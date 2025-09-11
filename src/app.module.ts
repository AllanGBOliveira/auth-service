import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { I18nModule, I18nJsonLoader } from 'nestjs-i18n';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RabbitMQJwtGuard } from './auth/rabbitmq-jwt.guard';
import { RabbitMQLoggerInterceptor } from './middleware/rabbitmq-logger.interceptor';
import { RabbitMQRateLimitInterceptor } from './middleware/rabbitmq-rate-limit.interceptor';
import databaseConfig from './config/database.config';
import i18nConfig from './config/i18n.config';
import { RabbitMQI18nResolver } from './config/rabbitmq-i18n.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, i18nConfig],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: process.env.NODE_ENV !== 'production',
      },
      resolvers: [
        RabbitMQI18nResolver,
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('database')!,
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h') },
      }),
      inject: [ConfigService],
      global: true,
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RabbitMQJwtGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RabbitMQRateLimitInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RabbitMQLoggerInterceptor,
    },
  ],
})
export class AppModule {}
