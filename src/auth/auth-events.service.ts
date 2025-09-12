import { Injectable, Logger } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type {
  AuthEventResult,
  ValidatedUser,
  UserLoginEvent,
  UserLogoutEvent,
  TokenValidatedEvent,
  TokenInvalidEvent,
} from '../../types/auth';

@Injectable()
export class AuthEventsService {
  private readonly logger = new Logger(AuthEventsService.name);
  private client: ClientProxy;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [
          `amqp://${configService.get('RABBITMQ_DEFAULT_USER')}:${configService.get('RABBITMQ_DEFAULT_PASS')}@rabbitmq:${configService.get('RABBITMQ_DEFAULT_PORT')}`,
        ],
        queue: 'auth_events_queue',
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  async validateTokenAndPublish(
    token: string,
    requestId: string,
    targetService: string,
  ): Promise<AuthEventResult> {
    this.logger.log(
      `Token validation request - RequestID: ${requestId}, Target: ${targetService}`,
    );

    try {
      const cleanToken = token.replace('Bearer ', '');

      const payload =
        await this.jwtService.verifyAsync<Partial<ValidatedUser>>(cleanToken);
      if (!payload) {
        throw new Error('Token inválido ou expirado');
      }

      const user: ValidatedUser = {
        id: payload.sub ?? '',
        email: payload.email ?? '',
        role: payload.role ?? '',
      };

      const authResult: AuthEventResult = {
        requestId,
        targetService,
        valid: true,
        user,
        timestamp: new Date().toISOString(),
      };

      this.client.emit('auth.token.validated', authResult);
      this.logger.log(
        `Token valid - Published success event for RequestID: ${requestId}`,
      );

      return authResult;
    } catch (error: unknown) {
      const e = error as Error;
      const authResult: AuthEventResult = {
        requestId,
        targetService,
        valid: false,
        error: e.message || 'Token inválido ou expirado',
        timestamp: new Date().toISOString(),
      };

      this.client.emit('auth.token.invalid', authResult);
      this.logger.warn(
        `Token invalid - Published failure event for RequestID: ${requestId}`,
      );

      return authResult;
    }
  }

  publishUserLogin(user: ValidatedUser) {
    const loginEvent: UserLoginEvent = {
      eventType: 'user.login',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      timestamp: new Date().toISOString(),
    };

    this.client.emit('auth.user.login', loginEvent);
    this.logger.log(`Published login event for user: ${user.email}`);
  }

  publishUserLogout(userId: string) {
    const logoutEvent: UserLogoutEvent = {
      eventType: 'user.logout',
      userId,
      timestamp: new Date().toISOString(),
    };

    this.client.emit('auth.user.logout', logoutEvent);
    this.logger.log(`Published logout event for user: ${userId}`);
  }

  publishTokenValidated(user: ValidatedUser, requestId?: string) {
    const validationEvent: TokenValidatedEvent = {
      eventType: 'token.validated',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    this.client.emit('auth.token.validated', validationEvent);
    this.logger.log(`Published token validation event for user: ${user.email}`);
  }

  publishTokenInvalid(requestId?: string, error?: string) {
    const invalidEvent: TokenInvalidEvent = {
      eventType: 'token.invalid',
      requestId,
      error: error || 'Token inválido ou expirado',
      timestamp: new Date().toISOString(),
    };

    this.client.emit('auth.token.invalid', invalidEvent);
    this.logger.warn(`Published token invalid event - RequestID: ${requestId}`);
  }
}
