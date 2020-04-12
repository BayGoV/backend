import { VersionedDataTransferObject } from './versioned-data-transfer-object';
import { randomBytes } from 'crypto';

export class Preference extends VersionedDataTransferObject {
  doNotDisturb: boolean;
  inviteMeToActivities: boolean;
  inviteMeToTournaments: boolean;
  inviteMeToDoodles: boolean;
  backupEmail: string;
  secret: string;

  constructor() {
    super();
    this.doNotDisturb = false;
    this.inviteMeToActivities = false;
    this.inviteMeToTournaments = false;
    this.inviteMeToDoodles = false;
    this.secret = randomBytes(5)
      .toString('hex')
      .slice(0, 7);
  }
}
