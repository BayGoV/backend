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
    return this.memberService.memberByEmail(req.user.email);
  }
}
