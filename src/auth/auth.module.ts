import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthEventsService } from './auth-events.service';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, AuthEventsService],
  exports: [AuthService, AuthEventsService],
})
export class AuthModule {}
