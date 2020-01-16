import { VersionedDataTransferObject } from './versioned-data-transfer-object';

class ScopedField {
  value: string;
  scope: 'public' | 'private';
}

// tslint:disable-next-line:max-classes-per-file
export class Meetup extends VersionedDataTransferObject {
  memberId: string;
  name: string;
  address: ScopedField;
  frequency: ScopedField;
  email?: ScopedField;
  phone?: ScopedField;
  scope: 'public' | 'private';
}
