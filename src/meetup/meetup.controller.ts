import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { MemberService } from '../member/member.service';
import { MeetupService } from './meetup.service';
import { Meetup } from '../model/meetup.model';

@Controller('api/meetup')
export class MeetupController {
  constructor(
    private memberService: MemberService,
    private meetupService: MeetupService,
  ) {}

  @Get('*')
  getPreference(@Req() req) {
    const member = this.memberService.memberByEmail(req.user.email);
    const meetups = this.meetupService.getMeetups(member);
    return meetups;
  }

  @Put('*')
  async setPreference(@Req() req, @Body() meetup: Meetup) {
    const member = this.memberService.memberByEmail(req.user.email);
    await this.meetupService.setMeetup(meetup, member);
    return meetup;
  }
}
