import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MemberService } from './member.service';

@Controller('api/member')
export class MemberController {
  constructor(private memberService: MemberService) {}

  @Post('canSignIn')
  canSignIn(@Body() body) {
    const member = this.memberService.memberByEmail(body.email);
    return !!member;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('mailinglists')
  getMailingLists(@Req() req) {
    const member = this.memberService.memberByEmail(req.user.email);
    return this.memberService.getMailingLists(member);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('*')
  getSelf(@Req() req) {
    return this.memberService.memberByEmail(req.user.email);
  }
}
