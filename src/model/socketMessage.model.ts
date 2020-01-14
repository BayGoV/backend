import { Preference } from './preference.model';
import { Member } from './member.model';

export class SocketMessage {
  type: string;
  payload: Preference | Member;
}
