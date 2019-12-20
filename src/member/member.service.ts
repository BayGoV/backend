import { Injectable } from '@nestjs/common';
import { Member } from '../model/member.model';

@Injectable()
export class MemberService {
  members = new Map<string, Member>();

  constructor() {
    const hw: Member = {
      id: '1234567',
      email: 'hans.wurst@peluda.de',
      firstname: 'Hans',
      lastname: 'Wurst',
      status: 'Vollmitglied',
    };
    this.members.set(hw.email, hw);
  }
}
