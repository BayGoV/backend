import { Controller, Get, Post, Req, Body, UseGuards, Put } from '@nestjs/common';
import { PreferenceService } from './preference.service';
import { AuthGuard } from '@nestjs/passport';
import { MemberService } from '../member/member.service';
import { Preference } from '../model/preference.model';

@UseGuards(AuthGuard('jwt'))
@Controller('api/preference')
export class PreferenceController {
  constructor(
    private memberService: MemberService,
    private preferenceService: PreferenceService,
  ) {}

  @Get('*')
  getPreference(@Req() req) {
    const member = this.memberService.memberByEmail(req.user.email);
    const pref = this.preferenceService.getPreference(member);
    return pref || Object.assign(new Preference(), {id: member.id});
  }

  @Put('*')
  async setPreference(@Req() req, @Body() preference: Preference) {
    const member = this.memberService.memberByEmail(req.user.email);
    await this.preferenceService.setPreference(member, preference);
    return preference;
  }
}
