import { VersionedDataTransferObject } from './versioned-data-transfer-object';

export class Preference extends VersionedDataTransferObject {
  doNotDisturb: boolean;
  inviteMeToActivities: boolean;
  inviteMeToTournaments: boolean;
  inviteMeToDoodles: boolean;

  constructor() {
    super();
    this.doNotDisturb = false;
    this.inviteMeToActivities = false;
    this.inviteMeToTournaments = false;
    this.inviteMeToDoodles = false;
  }
}
