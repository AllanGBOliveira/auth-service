import { Body, Controller, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthEventsService } from './auth-events.service';
import { Public } from './decorators/public.decorator';
import {
  MessagePattern,
  EventPattern,
  RpcException,
} from '@nestjs/microservices';
import { I18nService, I18nContext } from 'nestjs-i18n';
import type {
  LoginMessagePattern,
  RegisterMessagePattern,
  ValidateTokenRequest,
  TokenValidationEventPayload,
  LogoutEventPayload,
} from 'types/auth';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private authEventsService: AuthEventsService,
    private i18n: I18nService,
  ) {}
  @Public()
  @MessagePattern({ cmd: 'login' })
  async loginMicroservice(data: LoginMessagePattern) {
    this.logger.log(`Login request received - Email: ${data.email}`);

    try {
      this.logger.debug(`Current I18n Lang: ${I18nContext.current()?.lang}`);

      const result = await this.authService.login(data.email, data.password);

      const payload = await this.authService.validateToken(result.access_token);
      if (payload.valid && payload.user) {
        this.authEventsService.publishUserLogin(payload.user);
      }

      const translatedMessage = this.i18n.t('auth.LOGIN_SUCCESS');
      this.logger.debug(`Translated message: ${translatedMessage}`);

      return {
        ...result,
        message: translatedMessage,
      };
    } catch (error: unknown) {
      const e = error as Error;
      const errorMessage = this.i18n.t('auth.LOGIN_FAILED') || e.message;
      this.logger.error(
        `Login failed - Error message translated: ${errorMessage}`,
      );
      throw new RpcException(errorMessage);
    }
  }

  @Public()
  @MessagePattern({ cmd: 'register' })
  async registerMicroservice(data: RegisterMessagePattern) {
    this.logger.log(
      `Register request received - Email: ${data.email}, Name: ${data.name}`,
    );

    try {
      const result = await this.authService.register(data);

      const payload = await this.authService.validateToken(result.access_token);
      if (payload.valid && payload.user) {
        this.authEventsService.publishUserLogin(payload.user);
      }

      return {
        ...result,
        message: this.i18n.t('auth.REGISTER_SUCCESS'),
      };
    } catch (error: unknown) {
      const e = error as Error;
      const errorMessage = this.i18n.t('auth.REGISTER_FAILED') || e.message;
      this.logger.error(`Register failed - Error message: ${errorMessage}`);
      throw new RpcException(errorMessage);
    }
  }

  @Public()
  @MessagePattern({ cmd: 'validate_token' })
  async validateToken(data: ValidateTokenRequest) {
    this.logger.log('Token validation request received');

    try {
      const result = await this.authService.validateToken(data.token);

      if (result.valid) {
        return {
          ...result,
          message: this.i18n.t('auth.TOKEN_VALIDATED'),
        };
      } else {
        return {
          ...result,
          message: this.i18n.t('auth.TOKEN_INVALID'),
        };
      }
    } catch (error: unknown) {
      const e = error as Error;
      const errorMessage = this.i18n.t('auth.TOKEN_INVALID') || e.message;
      this.logger.error(
        `Token validation failed - Error message: ${errorMessage}`,
      );
      throw new RpcException(errorMessage);
    }
  }

  @Public()
  @EventPattern('auth.validate.request')
  async handleTokenValidationRequest(data: TokenValidationEventPayload) {
    this.logger.log(
      `Auth validation event received - RequestID: ${data.requestId}, Target: ${data.targetService}`,
    );
    await this.authEventsService.validateTokenAndPublish(
      data.token,
      data.requestId,
      data.targetService,
    );
  }

  @Public()
  @EventPattern('auth.logout.request')
  handleLogoutRequest(data: LogoutEventPayload) {
    this.logger.log(`Logout event received - UserID: ${data.userId}`);
    this.authEventsService.publishUserLogout(data.userId);
  }
}
