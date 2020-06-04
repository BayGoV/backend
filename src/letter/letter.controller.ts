import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LetterService } from './letter.service';
import { AuthGuard } from '@nestjs/passport';
import { MemberService } from '../member/member.service';

@Controller('letter')
export class LetterController {
  constructor(
    private memberService: MemberService,
    private letterService: LetterService,
  ) {
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  letter(@Req() req, @Res() response) {
    const member = this.memberService.memberByEmail(req.user.email);
    if (!member || !['09000453', '09000702', '09000750'].includes(member.id)) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    const lorem =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in suscipit purus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Vivamus nec hendrerit felis. Morbi aliquam facilisis risus eu lacinia. Sed eu leo in turpis fringilla hendrerit. Ut nec accumsan nisl. Suspendisse rhoncus nisl posuere tortor tempus et dapibus elit porta. Cras leo neque, elementum a rhoncus ut, vestibulum non nibh. Phasellus pretium justo turpis. Etiam vulputate, odio vitae tincidunt ultricies, eros odio dapibus nisi, ut tincidunt lacus arcu eu elit. Aenean velit erat, vehicula eget lacinia ut, dignissim non tellus. Aliquam nec lacus mi, sed vestibulum nunc. Suspendisse potenti. Curabitur vitae sem turpis. Vestibulum sed neque eget dolor dapibus porttitor at sit amet sem. Fusce a turpis lorem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae;';
    const doc = this.letterService.letter(lorem);
    doc.pipe(response);
    doc.end();
  }
}
