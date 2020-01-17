import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { MemberService } from './member/member.service';
import { JwtStrategy } from './jwt.strategy';
import { verify } from 'jsonwebtoken';
import { Subject } from 'rxjs';
import { SocketMessage } from './model/socketMessage.model';

@WebSocketGateway()
export class EventsGateway {
  private subscriptions = new Map<string, Subject<SocketMessage>>();
  private clients = [];

  constructor(
    private memberService: MemberService,
    private jwtStrategy: JwtStrategy,
  ) {}

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
        client.emit('update', message);
      });
      this.clients.push(client.id);
    }
    return `Subscribed for ${member.id}`;
  }

  notify(id: string, message: SocketMessage) {
    if (this.subscriptions.has(id)) {
      this.subscriptions.get(id).next(message);
    }
  }
}
