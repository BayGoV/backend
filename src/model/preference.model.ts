export class Preference {
  id: string;
  v: number;
  doNotDisturb: boolean;
  inviteMeToActivities: boolean;
  inviteMeToTournaments: boolean;
  inviteMeToDoodles: boolean;

  constructor() {
    this.doNotDisturb = false;
    this.inviteMeToActivities = false;
    this.inviteMeToTournaments = false;
    this.inviteMeToDoodles = false;
  }
}
