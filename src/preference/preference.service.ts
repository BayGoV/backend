import { Injectable } from '@nestjs/common';
import { Preference } from '../model/preference.model';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';
import { interval } from 'rxjs';

@Injectable()
export class PreferenceService {
  bucket;
  subscription;
  preferences = new Map<string, Preference>();
  messageHandler = message => {
    const pref = JSON.parse(message.data);
    this.preferences.set(pref.id, pref);
    // tslint:disable-next-line:no-console
    console.log(`Added Preference for ${pref.id}`);
    message.ack();
  };
  topicName = 'BgovBackendPreference';
  subscriptionNameTemplate = 'prefSubscription';
  rotateSubscriptionEvery = 1000 * 60 * 60;
  deletePrefSubscriptionAfter = this.rotateSubscriptionEvery + (1000 * 60 * 5);

  constructor() {
    const storage = new Storage();
    this.bucket = storage.bucket('bgov-web-preferences');
    this.listen();
    interval(this.rotateSubscriptionEvery).subscribe(() => this.rotateSubscription());
  }

  async loadFromBucket() {
    const [files] = await this.bucket.getFiles();
    const prefFiles = files.filter(file => file.name.endsWith('.pref'));
    for (const prefFile of prefFiles) {
      const data = await prefFile.download();
      const pref = JSON.parse(data.toString());
      this.preferences.set(pref.id, pref);
    }
    // tslint:disable-next-line:no-console
    console.log(`Done loading ${files.length} preference files from bucket`);
  }

  async listen() {
    const pubsub = new PubSub();
    const subscriptionName = this.subscriptionNameTemplate + Date.now();
    const subscriptionResponse = await pubsub
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
        const age = name.substr(
          this.subscriptionNameTemplate.length,
        );
        if (Date.now() - +age > this.deletePrefSubscriptionAfter) {
          await subscription.delete();
        }
      }
    }
  }
}
