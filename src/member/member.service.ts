import {
  HttpException,
  HttpService,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Member } from '../model/member.model';
import { DGOB_CREDENTIAL_ENDPOINT, DGOB_DATA_ENDPOINT } from '../constants';
import * as https from 'https';
import { map, switchMap } from 'rxjs/operators';
import { JSDOM } from 'jsdom';

@Injectable()
export class MemberService {
  members = new Map<string, Member>();

  constructor(private http: HttpService) {
    this.fetchMembersFromDGoB();
    // tslint:disable-next-line:no-console
    console.log('Started loading members from DGOB');
  }

  memberByEmail(email) {
    const members = [...this.members.values()];
    const membersWithEmail = members.reduce(
      (acc, cur) =>
        email.toLowerCase() === cur.email.toLowerCase() ? [cur, ...acc] : acc,
      [],
    );
    if (membersWithEmail.length === 0) {
      throw new HttpException('Member not found', HttpStatus.NOT_FOUND);
    } else if (membersWithEmail.length > 1) {
      throw new HttpException('Member not unique', HttpStatus.NOT_FOUND);
    }
    return membersWithEmail[0];
  }

  async fetchMembersFromDGoB() {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const reqSession = await this.http
      .post(
        DGOB_CREDENTIAL_ENDPOINT,
        'Name=bgov&Passwort=' + process.env.BGOV_PW,
        {
          auth: { username: 'bgovmv', password: process.env.BGOV_MV_PW },
          responseType: 'text',
          httpsAgent: agent,
        },
      )
      .pipe(
        map(req => req.headers['set-cookie']),
        map(cookies => cookies.find(cookie => cookie.startsWith('PHPSESSID'))),
        switchMap(cookie =>
          this.http.post(DGOB_DATA_ENDPOINT, 'LVID=09', {
            auth: { username: 'bgovmv', password: process.env.BGOV_MV_PW },
            headers: { Cookie: cookie },
            httpsAgent: agent,
          }),
        ),
      )
      .toPromise();
    this.parseMembers(reqSession.data).forEach(member => {
      const emailRegex = new RegExp(
        '(?:[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\\])',
      );
      if (emailRegex.test(member.email) && member.status !== 'Nichtmitglied') {
        this.members.set(member.id, member);
      }
    });
    // tslint:disable-next-line:no-console
    console.log(`Loaded ${this.members.size} members w/emails from DGOB`);
  }

  parseMembers(membersHtml) {
    const dom = new JSDOM(membersHtml);
    const $ = require('jquery')(dom.window);
    const rows = [...$('tr')];
    return rows.map(row => {
      return {
        id: row.querySelector('td:nth-child(2)').textContent,
        firstname: row.querySelector('td:nth-child(6)').textContent,
        lastname: row.querySelector('td:nth-child(5)').textContent,
        status: row.querySelector('td:nth-child(10)').textContent,
        email: row.querySelector('td:nth-child(14)').textContent,
        street: row.querySelector('td:nth-child(7)').textContent,
        zip: row.querySelector('td:nth-child(8)').textContent,
        city: row.querySelector('td:nth-child(9)').textContent,
      } as Member;
    });
  }
}
