import dns from 'node:dns';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: configService.getOrThrow<string>('app.clientUrl'),
    credentials: true,
  });

  const port = configService.getOrThrow<number>('app.port');

  await app.listen(port);

  console.log(`ChatCord API running on http://localhost:${port}/api`);
}

void bootstrap();
