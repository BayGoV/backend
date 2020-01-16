import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Preference } from '../model/preference.model';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';
import { interval } from 'rxjs';
import { verify } from 'jsonwebtoken';
import { EventsGateway } from '../events.gateway';

@Injectable()
export class PreferenceService {
  pubsub;
  bucket;
  subscription;
  preferences = new Map<string, Preference>();
  provisionaryPreferences = new Map<string, Preference>();

  messageHandler = message => {
    const pref = JSON.parse(message.data);
    if (pref.v < 0) {
      this.provisionaryPreferences.delete(pref.id);
      // tslint:disable-next-line:no-console
      console.log(`Deleted Provisionary Preference for ${pref.id}`);
    } else {
      if (pref.s) {
        const v = verify(pref.s, process.env.SYNCMASTER_SECRET);
        this.preferences.set(pref.id, pref);
        const prefMessage = { type: 'Preference', payload: pref };
        this.eventsGateway.notify(pref.id, prefMessage);
        this.provisionaryPreferences.delete(pref.id);
        // tslint:disable-next-line:no-console
        console.log(`Added Preference for ${pref.id}`);
      } else {
        this.provisionaryPreferences.set(pref.id, pref);
        // tslint:disable-next-line:no-console
        console.log(`Added Provisionary Preference for ${pref.id}`);
      }
    }
    message.ack();
  };
  topicName = 'BgovBackendPreference';
  subscriptionNameTemplate = 'prefSubscription';
  rotateSubscriptionEvery = 1000 * 60 * 60;
  deletePrefSubscriptionAfter = this.rotateSubscriptionEvery + 1000 * 60 * 5;

  constructor(private eventsGateway: EventsGateway) {
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
    if (this.provisionaryPreferences.has(member.id)) {
      return Object.assign(
        { p: true },
        this.provisionaryPreferences.get(member.id),
      );
    }
    return this.preferences.get(member.id);
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
    // tslint:disable-next-line:no-console
    console.log(
      `Done loading ${prefFiles.length} preference files from bucket`,
    );
  }

  async listen() {
    const subscriptionName = this.subscriptionNameTemplate + Date.now();
    const subscriptionResponse = await this.pubsub
      .topic(this.topicName)
      .createSubscription(subscriptionName);
    const subscription = subscriptionResponse[0];
    if (!this.subscription) {
      this.subscription = subscription;
    }
    // tslint:disable-next-line:no-console
    console.log(`Listening for ${this.topicName}`);
    subscription.on(`message`, this.messageHandler);
    return subscription;
  }

  async rotateSubscription() {
    const newSubscription = await this.listen();
    this.subscription.removeListener('message', this.messageHandler);
    await this.subscription.delete();
    this.subscription = newSubscription;
    await this.cleanupSubscriptions();
  }

  async cleanupSubscriptions() {
    const pubsub = new PubSub();
    const [subscriptions] = await pubsub
      .topic(this.topicName)
      .getSubscriptions();
    for (const subscription of subscriptions) {
      const name = subscription.name.split('/').reverse()[0];
      if (name.startsWith(this.subscriptionNameTemplate)) {
        const age = name.substr(this.subscriptionNameTemplate.length);
        if (Date.now() - +age > this.deletePrefSubscriptionAfter) {
          await subscription.delete();
        }
      }
    }
  }
}
