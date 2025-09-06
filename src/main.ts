import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: { port: process.env.PORT || 3001 },
    },
  );
  await app.listen().then(() => {
    console.log(`Microservice is running on port ${process.env.PORT || 3001}`);
  });
}
bootstrap();
