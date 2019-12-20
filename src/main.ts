import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Request, Response } from 'express';

async function bootstrap() {
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
