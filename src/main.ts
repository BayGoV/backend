import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Request, Response } from 'express';
import { Storage } from '@google-cloud/storage';
import { parse } from 'dotenv';

async function bootstrap() {
  const storage = new Storage();
  const bucket = storage.bucket('bgov-web-config');
  const envFile = bucket.file('bgov-web.env');
  const file = await envFile.download();
  const parsed = parse(Buffer.concat(file));
  Object.keys(parsed).forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = parsed[key];
    } else {
      // tslint:disable-next-line:no-console
      console.error(
        `"${key}" is already defined in \`process.env\` and will not be overwritten`,
      );
    }
  });
  const app = await NestFactory.create(AppModule);
  app.use((req: Request, res: Response, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      res.send();
    } else {
      next();
    }
  });
  await app.listen(8080);
}

bootstrap();
