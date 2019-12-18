import { Injectable } from '@nestjs/common';
import { Preference } from '../model/preference.model';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class PreferenceService {
  preferences = new Map<string, Preference>();

  loadFromBucket() {
    const storage = new Storage();
    // storage.bucket('bgov-web-preferences').upload()
  }
}
