import { VersionedDataTransferObject } from './versioned-data-transfer-object';

export class Member extends VersionedDataTransferObject {
  email: string;
  firstname: string;
  lastname: string;
  status: string;
  street: string;
  zip: string;
  city: string;
  dgoz: boolean;
}
