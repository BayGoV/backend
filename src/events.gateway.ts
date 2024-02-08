import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { MemberService } from './member/member.service';
import { JwtStrategy } from './jwt.strategy';
import { verify } from 'jsonwebtoken';
import { interval, Subject } from 'rxjs';
import { SocketMessage } from './model/socketMessage.model';
import { map } from 'rxjs/operators';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ pingInterval: 5000, pingTimeout: 10000 })
export class EventsGateway {
  private subscriptions = new Map<string, Subject<SocketMessage>>();
  private lastConnectionTimes = new Map<string, number>();
  private clients = [];

  constructor(
    private memberService: MemberService,
    private jwtStrategy: JwtStrategy,
  ) {
  }

  @SubscribeMessage('subscribe')
  async handleMessage(client: any, payload: any) {
    const key = await this.jwtStrategy.verify(payload);
    const token: any = verify(payload, key);
    const member = this.memberService.memberByEmail(token.email);
    let subscription = this.subscriptions.get(member.id);
    let isNew;
    if (!subscription || subscription.isStopped) {
      subscription = new Subject();
      isNew = true;
      this.subscriptions.set(member.id, subscription);
    }
    if (isNew || !this.clients.includes(client.id)) {
      subscription.subscribe(message => {
        this.lastConnectionTimes.set(member.id, Date.now());
        client.emit('update', message);
      });
      this.clients.push(client.id);
    }
    this.lastConnectionTimes.set(member.id, Date.now());
    const timeout = 60000;
    interval(5 * timeout).pipe(map(_ => {
      const lastConnected = this.lastConnectionTimes.get(member.id);
      if (Date.now() - lastConnected > timeout) {
        Logger.log(`Disconnecting ${member.email} after 5min timeout`);
        client.disconnect();
      }
    })).subscribe();
    return `Subscribed for ${member.id}`;
  }

  notify(id: string, message: SocketMessage) {
    if (this.subscriptions.has(id)) {
      this.subscriptions.get(id).next(message);
    }
  }
}
