import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Meetup } from '../model/meetup.model';
import { EventsGateway } from '../events.gateway';
import { PubSub } from '@google-cloud/pubsub';
import { Storage } from '@google-cloud/storage';
import { interval } from 'rxjs';
import { AbstractStateService } from '../abstract-state.service';
import { verify } from 'jsonwebtoken';
import { isObject } from 'util';

@Injectable()
export class MeetupService extends AbstractStateService {
  pubsub;
  bucket;
  subscription;
  meetups = new Map<string, Meetup>();
  provisionaryMeetups = new Map<string, Meetup>();
  topicName = 'BgovBackendMeetup';
  bucketName = 'bgov-web-meetups';
  subscriptionNameTemplate = 'meetupSubscription';
  rotateSubscriptionEvery = 1000 * 60 * 60;
  deleteSubscriptionAfter = this.rotateSubscriptionEvery + 1000 * 60 * 5;
  messageHandler = message => {
    const meetup = JSON.parse(message.data);
    if (meetup.v < 0) {
      this.provisionaryMeetups.delete(meetup.id);
      // tslint:disable-next-line:no-console
      console.log(`Deleted Provisionary Meetup for ${meetup.id}`);
    } else {
      if (meetup.s) {
        const v = verify(meetup.s, process.env.SYNCMASTER_SECRET);
        this.meetups.set(meetup.id, meetup);
        const meetupMessage = { type: 'Meetup', payload: meetup };
        this.eventsGateway.notify(meetup.memberId, meetupMessage);
        this.provisionaryMeetups.delete(meetup.id);
        // tslint:disable-next-line:no-console
        console.log(`Added Meetup for ${meetup.id}`);
      } else {
        this.provisionaryMeetups.set(meetup.id, meetup);
        // tslint:disable-next-line:no-console
        console.log(`Added Provisionary Meetup for ${meetup.id}`);
      }
    }
    message.ack();
  };

  constructor(private eventsGateway: EventsGateway) {
    super();
    this.pubsub = new PubSub();
    const storage = new Storage();
    this.bucket = storage.bucket(this.bucketName);
    this.loadFromBucket();
    this.listen();
    interval(this.rotateSubscriptionEvery).subscribe(() =>
      this.rotateSubscription(),
    );
  }

  async setMeetup(meetup, member) {
    const currentMeetup =
      this.provisionaryMeetups.get(meetup.id) || this.meetups.get(meetup.id);
    const version = !!currentMeetup ? currentMeetup.v + 1 : 0;
    const provisionaryMeetup = Object.assign({}, meetup, {
      v: version,
    });
    if (version === 0) {
      const ids = new Set();
      [...this.meetups.keys()].forEach(id => ids.add(id));
      [...this.provisionaryMeetups.keys()].forEach(id => ids.add(id));
      provisionaryMeetup.id = member.id + '-' + ids.size;
    }
    delete provisionaryMeetup.s;
    provisionaryMeetup.memberId = member.id;
    if (!provisionaryMeetup.id.startsWith(member.id)) {
      throw new HttpException(
        'Only editing own meetups is allowed',
        HttpStatus.FORBIDDEN,
      );
    }
    this.provisionaryMeetups.set(meetup.id, provisionaryMeetup);
    const data = JSON.stringify(provisionaryMeetup);
    const dataBuffer = Buffer.from(data);
    await this.pubsub.topic(this.topicName).publish(dataBuffer);
    return provisionaryMeetup;
  }

  getMeetup(id, member) {
    const meetup = this.provisionaryMeetups.has(id)
      ? this.provisionaryMeetups.get(id)
      : this.meetups.get(id);
    switch (meetup.scope) {
      case 'private':
        return !!member && member.id === meetup.memberId ? meetup : null;
      case 'internal':
        return !!member ? meetup : null;
      case 'public':
        return meetup;
    }
    // for (const key of Object.keys(meetup)) {
    //   if (meetup[key].scope === 'private' && !member) {
    //     delete meetup[key];
    //   }
    // }
    return meetup;
  }

  getMeetups(member) {
    const ids = new Set();
    [...this.meetups.keys()].forEach(id => ids.add(id));
    [...this.provisionaryMeetups.keys()].forEach(id => ids.add(id));
    return [...ids]
      .map(id => this.getMeetup(id, member))
      .filter(meetup => !!meetup);
  }

  async loadFromBucket() {
    const [files] = await this.bucket.getFiles();
    const meetupFiles = files.filter(file => file.name.endsWith('.meetup'));
    for (const meetupFile of meetupFiles) {
      const data = await meetupFile.download();
      const meetup = JSON.parse(data.toString());
      meetup.s = 'Loaded';
      this.meetups.set(meetup.id, meetup);
    }
    // tslint:disable-next-line:no-console
    console.log(`Done loading ${meetupFiles.length} meetup files from bucket`);
  }
}
