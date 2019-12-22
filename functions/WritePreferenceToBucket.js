const { Storage } = require('@google-cloud/storage');
const { Duplex } = require('stream');
const storage = new Storage();
const bucket = storage.bucket('bgov-web-preferences');

const save = (preference, gcFile) =>
  new Promise((resolve, reject) => {
    const stream = new Duplex();
    stream.push(preference);
    stream.push(null);
    stream
      .pipe(
        gcFile.createWriteStream({
          resumable: false,
          validation: false,
          contentType: 'auto',
          metadata: {
            'Cache-Control': 'public, max-age=31536000',
          },
        }),
      )
      .on('error', error => {
        reject(error);
      })
      .on('finish', () => {
        resolve(true);
      });
  });

exports.helloPubSub = async (event, context) => {
  const pubsubMessage = event.data;
  const jsonMessage = Buffer.from(pubsubMessage, 'base64').toString();
  const preference = JSON.parse(jsonMessage);
  const gcFile = bucket.file(preference.id + '.pref');
  await save(jsonMessage, gcFile);
};

const helloLocal = async () => {
  const preference = { id: 1122334, email: 'hans.wurst@peluda.de', v: 4 };
  const jsonMessage = JSON.stringify(preference);
  const gcFile = bucket.file(preference.id + '.pref');
  let oldPreference;
  try {
    const file = await gcFile.download();
    oldPreference = JSON.parse(file.toString());
  } catch (e) {
    console.error('Unable to determine old pref');
  }
  if (!oldPreference) {
    await save(jsonMessage, gcFile);
  } else {
    if (preference.v === oldPreference.v + 1) {
      await gcFile.copy(preference.id + '.pref.v' + oldPreference.v);
      await save(jsonMessage, gcFile);
    } else {
      console.log('Conflict detected. Aborting');
    }
  }
};

helloLocal().then(() => console.log('done'));
