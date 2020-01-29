import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { MemberService } from '../member/member.service';
import { MeetupService } from './meetup.service';
import { Meetup } from '../model/meetup.model';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from '../optional-jwt.authguard';

@Controller('api/meetup')
export class MeetupController {
  constructor(
    private memberService: MemberService,
    private meetupService: MeetupService,
  ) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get('*')
  getPreference(@Req() req) {
    let meetups;
    try {
      const member = this.memberService.memberByEmail(req.user.email);
      meetups = this.meetupService.getMeetups(member);
    } catch (e) {
      meetups = this.meetupService.getMeetups(null);
    }

    return meetups;
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('*')
  async setPreference(@Req() req, @Body() meetup: Meetup) {
    const member = this.memberService.memberByEmail(req.user.email);
    return await this.meetupService.setMeetup(meetup, member);
  }
}
