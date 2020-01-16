import { PubSub } from '@google-cloud/pubsub';

export class AbstractStateService {
  subscriptionNameTemplate;
  pubsub;
  topicName;
  subscription;
  messageHandler;
  deletePrefSubscriptionAfter;

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
