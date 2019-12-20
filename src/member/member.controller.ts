import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MemberService } from './member.service';

@UseGuards(AuthGuard('jwt'))
@Controller('api/member')
export class MemberController {
  constructor(private memberService: MemberService) {}

  @Get('*')
  login(@Req() req) {
    return this.memberService.members.get(req.user.email);
  }
}
