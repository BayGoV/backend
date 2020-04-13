import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { MemberService } from '../member/member.service';

@Injectable()
export class LetterService {
  constructor(private memberService: MemberService) {}

  letter(message) {
    const mm2pt = mm => Math.floor(mm * 2.835);
    const rect = (x, y, w, h) => {
      doc
        .save()
        .moveTo(mm2pt(x), mm2pt(y))
        .lineTo(mm2pt(x + w), mm2pt(y))
        .lineTo(mm2pt(x + w), mm2pt(y + h))
        .lineTo(mm2pt(x), mm2pt(y + h))
        .lineTo(mm2pt(x), mm2pt(y))
        .dash(5, 10)
        .stroke('#a7a2a2');
    };
    const doc = new PDFDocument({ autoFirstPage: false });

    for (const member of this.memberService.members.values()) {
      doc.addPage({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
      });
      doc.fillColor('white').text('begin');
      doc.fontSize(9);
      doc
        .fillColor('black')
        .text(
          'Bayerischer Go-Verein e.V. VR6714 (Amtsgericht München)',
          mm2pt(23),
          mm2pt(45),
        );
      // rect(23, 45, 85, 5.5);
      // rect(23, 45 + 7, 85, 16);
      // rect(23, 45 + 7 + 17, 85, 21);
      doc.fontSize(10);
      doc.text('Bayerischer Go-Verein e.V.', mm2pt(140), mm2pt(12));
      doc.text('VR6714 Amtsgericht München');
      doc.moveDown();
      doc.text('Ihre Mitgliedsinformation:');
      doc.text('Nummer: ' + member.id);
      doc.text(
        'Code: ' +
          [...this.memberService.memberSecrets.entries()]
            .filter(([key, value]) => value === member.id)
            .map(([key, value]) => key),
      );
      doc.text('Status: ' + member.status);
      doc.fontSize(12);
      doc.text(
        `${member.firstname} ${member.lastname}`,
        mm2pt(23),
        mm2pt(45 + 7 + 17),
      );
      doc.text(`${member.street}`);
      doc.text(`${member.zip} ${member.city}`);
      doc.fontSize(10);
      doc.text('Hallo liebe Go-Freunde,', mm2pt(23), mm2pt(115));
      doc.moveDown();
      doc.text(message, { align: 'justify', width: 330 });
      doc.moveDown();
      doc.text('Beste Grüße');
      doc.moveDown();
      doc.text('Kai Meemken, Präsident');
      doc.text('', mm2pt(20), mm2pt(270));
      doc.fontSize(9);
      doc.text(
        'Bankverbindung: Bayerischer Go-Verein, HypoVereinsbank München, BLZ 700 202 70, Konto 100 827 11',
        { align: 'center', width: 500 },
      );
      doc.text('IBAN: DE43 7002 0270 0010 0827 11  BIC: HYVEDEMMXXX', {
        align: 'center',
        width: 500,
      });
    }
    return doc;
  }
}
