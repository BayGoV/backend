import {VersionedDataTransferObject} from './versioned-data-transfer-object';

class ScopedField {
  value: string;
  scope: 'public' | 'internal' | 'private';
}

// tslint:disable-next-line:max-classes-per-file
export class Meetup extends VersionedDataTransferObject {
  constructor() {
    super();
    Object.assign(this, {
      id: Date.now().toString(),
      name: '',
      address: {value: '', scope: 'public'},
      frequency: {value: '', scope: 'public'},
      email: {value: '', scope: 'public'},
      phone: {value: '', scope: 'public'},
      contact: {value: '', scope: 'public'},
      scope: 'private',
      s: 'New',
    });
  }

  memberId: string;
  name: string;
  address: ScopedField;
  frequency: ScopedField;
  email: ScopedField;
  phone: ScopedField;
  contact: ScopedField;
  scope: 'public' | 'internal' | 'private';
}
