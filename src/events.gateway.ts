import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { MemberService } from './member/member.service';
import { JwtStrategy } from './jwt.strategy';
import { verify } from 'jsonwebtoken';

@WebSocketGateway()
export class EventsGateway {
  constructor(
    private memberService: MemberService,
    private jwtStrategy: JwtStrategy,
  ) {}

  @SubscribeMessage('subscribe')
  async handleMessage(client: any, payload: any): Promise<string> {
    const key = await this.jwtStrategy.verify(payload);
    const token: any = verify(payload, key);
    const member = this.memberService.memberByEmail(token.email);
    return `Subscription OK for ${member.id}`;
  }
}
