import { Controller, Get, Post, Req, Body, UseGuards } from '@nestjs/common';
import { PreferenceService } from './preference.service';
import { AuthGuard } from '@nestjs/passport';
import { MemberService } from '../member/member.service';
import { Preference } from '../model/preference.model';

@UseGuards(AuthGuard('jwt'))
@Controller('preference')
export class PreferenceController {
  constructor(
    private memberService: MemberService,
    private preferenceService: PreferenceService,
  ) {}

  @Get('*')
  getPreference(@Req() req) {
    const member = this.memberService.memberByEmail(req.user.email);
    return this.preferenceService.getPreference(member);
  }

  @Post()
  setPreference(@Req() req, @Body() preference: Preference) {
    const member = this.memberService.memberByEmail(req.user.email);
    this.preferenceService.setPreference(member, preference);
    return preference;
  }
}
