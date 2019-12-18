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


