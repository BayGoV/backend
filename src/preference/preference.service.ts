import { Injectable } from '@nestjs/common';
import { Preference } from '../model/preference.model';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class PreferenceService {
  bucket;
  preferences = new Map<string, Preference>();

  constructor() {
    const storage = new Storage();
    this.bucket = storage.bucket('bgov-web-preferences');
    this.loadFromBucket();
  }

  async loadFromBucket() {
    const [files] = await this.bucket.getFiles();
    files.forEach(file => console.log(file));
  }
}
