import { NestFactory } from '@nestjs/core';
import { BatchModule } from './batch.module';

async function bootstrap() {
  const app = await NestFactory.create(BatchModule);
  await app.listen(process.env.PORT_API ?? 4000);
}
bootstrap();
