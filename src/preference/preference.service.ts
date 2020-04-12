import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Preference } from '../model/preference.model';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';
import { interval } from 'rxjs';
import { verify } from 'jsonwebtoken';
import { EventsGateway } from '../events.gateway';
import { AbstractStateService } from '../abstract-state.service';
import { MemberService } from '../member/member.service';
import { filter } from 'rxjs/operators';
import { randomBytes } from 'crypto';

@Injectable()
export class PreferenceService extends AbstractStateService {
  pubsub;
  bucket;
  subscription;
  preferences = new Map<string, Preference>();
  provisionaryPreferences = new Map<string, Preference>();
  topicName = 'BgovBackendPreference';
  subscriptionNameTemplate = 'prefSubscription';
  rotateSubscriptionEvery = 1000 * 60 * 60;
  deleteSubscriptionAfter = this.rotateSubscriptionEvery + 1000 * 60 * 5;
  messageHandler = message => {
    const pref = JSON.parse(message.data);
    if (pref.v < 0) {
      this.provisionaryPreferences.delete(pref.id);
      Logger.log(`Deleted Provisionary Preference for ${pref.id}`);
    } else {
      if (pref.s) {
        const v = verify(pref.s, process.env.SYNCMASTER_SECRET);
        this.preferences.set(pref.id, pref);
        this.memberService.backupEmails.set(pref.id, pref.backupEmail);
        const prefMessage = { type: 'Preference', payload: pref };
        this.eventsGateway.notify(pref.id, prefMessage);
        this.provisionaryPreferences.delete(pref.id);
        Logger.log(`Added Preference for ${pref.id}`);
      } else {
        this.provisionaryPreferences.set(pref.id, pref);
        Logger.log(`Added Provisionary Preference for ${pref.id}`);
      }
    }
    message.ack();
  };

  constructor(
    private eventsGateway: EventsGateway,
    private memberService: MemberService,
  ) {
    super();
    this.pubsub = new PubSub();
    const storage = new Storage();
    this.bucket = storage.bucket('bgov-web-preferences');
    this.loadFromBucket();
    this.listen();
    interval(this.rotateSubscriptionEvery).subscribe(() =>
      this.rotateSubscription(),
    );
  }

  getPreference(member) {
    const preference = this.provisionaryPreferences.has(member.id)
      ? Object.assign({ p: true }, this.provisionaryPreferences.get(member.id))
      : this.preferences.get(member.id);

    if (!!preference && !preference.secret) {
      preference.secret = randomBytes(5)
        .toString('hex')
        .slice(0, 7);
      this.setPreference(member, preference);
    }
    return preference || new Preference();
  }

  async setPreference(member, preference) {
    if (member.id !== preference.id) {
      throw new HttpException(
        'Only setting own preference is allowed',
        HttpStatus.FORBIDDEN,
      );
    }
    const currentPreference =
      this.provisionaryPreferences.get(preference.id) ||
      this.preferences.get(preference.id);
    const version = !!currentPreference ? currentPreference.v + 1 : 0;
    const provisionaryPreference = Object.assign({}, preference, {
      v: version,
    });
    delete provisionaryPreference.s;
    this.provisionaryPreferences.set(preference.id, provisionaryPreference);
    const data = JSON.stringify(provisionaryPreference);
    const dataBuffer = Buffer.from(data);
    return await this.pubsub.topic(this.topicName).publish(dataBuffer);
  }

  async loadFromBucket() {
    const [files] = await this.bucket.getFiles();
    const prefFiles = files.filter(file => file.name.endsWith('.pref'));
    for (const prefFile of prefFiles) {
      const data = await prefFile.download();
      const pref = JSON.parse(data.toString());
      pref.s = 'Loaded';
      this.preferences.set(pref.id, pref);
    }
    Logger.log(`Done loading ${prefFiles.length} preference files from bucket`);
    await this.memberService.finishedLoading();
    for (const preference of this.preferences.values()) {
      if (preference.secret) {
        this.memberService.memberSecrets.set(preference.secret, preference.id);
      }
      if (preference.backupEmail) {
        this.memberService.backupEmails.set(
          preference.id,
          preference.backupEmail,
        );
      }
    }
    Logger.log(
      `Registered ${this.memberService.backupEmails.size} Backup-Emails`,
    );
    Logger.log(
      `Registered ${this.memberService.memberSecrets.size} Member-Secrets`,
    );
  }
}
