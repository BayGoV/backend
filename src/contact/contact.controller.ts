import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MailService } from '../mail/mail.service';

@Controller('contact')
export class ContactController {
  constructor(private mailService: MailService) {}

  @Post('anon') anonymousContact(@Body() body) {
    return this.mailService.send(body.subject, body.subject, body.message);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('vfyd')
  verifiedContact(@Req() req, @Body() body) {
    const subject = `Nachricht von ${req.user.email}`;
    return this.mailService.send(subject, body.subject, body.message);
  }
}
