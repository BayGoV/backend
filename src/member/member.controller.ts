import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MemberService } from './member.service';

@UseGuards(AuthGuard('jwt'))
@Controller('api/member')
export class MemberController {
  constructor(private memberService: MemberService) {}

  @Get('*')
  getSelf(@Req() req) {
    const members = [...this.memberService.members.values()];
    const membersWithEmail = members.reduce(
      (acc, cur) =>
        req.user.email.toLowerCase() === cur.email.toLowerCase()
          ? [cur, ...acc]
          : acc,
      [],
    );
    if (membersWithEmail.length === 0) {
      throw new HttpException('Member not found', HttpStatus.NOT_FOUND);
    } else if (membersWithEmail.length > 1) {
      throw new HttpException('Member not unique', HttpStatus.NOT_FOUND);
    }
    return membersWithEmail[0];
  }
}
