import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MemberService } from './member.service';
import { PreferenceService } from '../preference/preference.service';

@Controller('api/member')
export class MemberController {
  constructor(
    private memberService: MemberService,
    private preferenceService: PreferenceService,
  ) {}

  @Post('canSignIn')
  canSignIn(@Body() body) {
    const member = this.memberService.memberByEmail(body.email);
    return !!member;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('mailinglists')
  getMailingLists(@Req() req) {
    const member = this.memberService.memberByEmail(req.user.email);
    if (!member || !['09000453', '09000702', '09000750'].includes(member.id)) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    const members = [...this.memberService.members.values()];
    return {
      all: members.map(m => m.email).filter(m => !!m),
      donotdisturb: members
        .filter(
          m =>
            this.preferenceService.preferences.has(m.id) &&
            this.preferenceService.preferences.get(m.id).doNotDisturb,
        )
        .map(m => m.email)
        .filter(m => !!m),
      inviteMeToActivities: members
        .filter(
          m =>
            this.preferenceService.preferences.has(m.id) &&
            this.preferenceService.preferences.get(m.id).inviteMeToActivities,
        )
        .map(m => m.email)
        .filter(m => !!m),
      inviteMeToTournaments: members
        .filter(
          m =>
            this.preferenceService.preferences.has(m.id) &&
            this.preferenceService.preferences.get(m.id).inviteMeToTournaments,
        )
        .map(m => m.email)
        .filter(m => !!m),
      inviteMeToDoodles: members
        .filter(
          m =>
            this.preferenceService.preferences.has(m.id) &&
            this.preferenceService.preferences.get(m.id).inviteMeToDoodles,
        )
        .map(m => m.email)
        .filter(m => !!m),
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('*')
  getSelf(@Req() req) {
    return this.memberService.memberByEmail(req.user.email);
  }
}
