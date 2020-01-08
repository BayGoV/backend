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
    const prefFiles = files.filter(file => file.name.endsWith('.pref'));
    for (const prefFile of prefFiles) {
      const data = await prefFile.download();
      const pref = JSON.parse(data.toString());
      this.preferences.set(pref.id, pref);
    }
    // tslint:disable-next-line:no-console
    console.log(`Done loading ${files.length} preference files from bucket`);
  }
}
