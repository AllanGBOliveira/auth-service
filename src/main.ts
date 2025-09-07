import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const tempApp = await NestFactory.create(AppModule);
  const configService = tempApp.get(ConfigService);
  await tempApp.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          `amqp://${configService.get('RABBITMQ_DEFAULT_USER')}:${configService.get('RABBITMQ_DEFAULT_PASS')}@rabbitmq:${configService.get('RABBITMQ_DEFAULT_PORT')}`,
        ],
        queue: 'auth_queue',
        queueOptions: {
          durable: true,
        },
      },
    },
  );

  await app.listen().then(() => {
    console.log(`Auth microservice listening to RabbitMQ queue: auth_queue`);
  });
}
bootstrap();
