import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MAIL_FROM, MAIL_TO } from '../constants';

@Injectable()
export class MailService {
  async send(subject, heading, message) {
    const html = `<h3>${heading}</h3><p>${message}</p>`;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const mailOptions = {
      from: MAIL_FROM,
      to: MAIL_TO,
      subject,
      text: 'This email contains HTML, please upgrade your Viewer',
      html,
      attachments: [],
    };
    const info = await transporter.sendMail(mailOptions);
    // tslint:disable-next-line:no-console
    console.log('Message sent: %s', info.messageId);
  }
}
