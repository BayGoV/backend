import { HttpModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { MemberService } from './member/member.service';
import { PreferenceService } from './preference/preference.service';
import { MemberController } from './member/member.controller';

@Module({
  imports: [HttpModule, PassportModule, JwtModule.register({})],
  controllers: [AppController, MemberController],
  providers: [AppService, JwtStrategy, MemberService, PreferenceService],
})
export class AppModule {
}
