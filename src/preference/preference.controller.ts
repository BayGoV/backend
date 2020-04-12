import {
  Controller,
  Get,
  Post,
  Req,
  Body,
  UseGuards,
  Put,
  HttpException,
} from '@nestjs/common';
import { PreferenceService } from './preference.service';
import { AuthGuard } from '@nestjs/passport';
import { MemberService } from '../member/member.service';
import { Preference } from '../model/preference.model';

@Controller('api/preference')
export class PreferenceController {
  constructor(
    private memberService: MemberService,
    private preferenceService: PreferenceService,
  ) {}

  @Put('reset/backup/email')
  async resetBackupEmail(
    @Body() body: { secret: string; backupEmail: string },
  ) {
    const member = this.memberService.memberBySecret(body.secret);
    const pref = this.preferenceService.getPreference(member);
    if (pref.p) {
      throw new HttpException('Preference is being updated', 409);
    }
    pref.backupEmail = body.backupEmail;
    await this.preferenceService.setPreference(member, pref);
    return pref;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('*')
  getPreference(@Req() req) {
    const member = this.memberService.memberByEmail(req.user.email);
    const pref = this.preferenceService.getPreference(member);
    return pref || Object.assign(new Preference(), { id: member.id });
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('*')
  async setPreference(@Req() req, @Body() preference: Preference) {
    const member = this.memberService.memberByEmail(req.user.email);
    await this.preferenceService.setPreference(member, preference);
    return preference;
  }
}
