import { HttpModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { MemberService } from './member/member.service';
import { PreferenceService } from './preference/preference.service';
import { MemberController } from './member/member.controller';
import { PreferenceController } from './preference/preference.controller';
import { EventsGateway } from './events.gateway';
import { MailService } from './mail/mail.service';
import { ContactController } from './contact/contact.controller';

@Module({
  imports: [HttpModule, PassportModule, JwtModule.register({})],
  controllers: [AppController, MemberController, PreferenceController, ContactController],
  providers: [AppService, JwtStrategy, MemberService, PreferenceService, EventsGateway, MailService],
})
export class AppModule {
}
