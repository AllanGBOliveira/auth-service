import { Body, Controller, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthEventsService } from './auth-events.service';
import { Public } from './decorators/public.decorator';
import { MessagePattern, EventPattern, RpcException } from '@nestjs/microservices';
import { I18nService, I18nContext } from 'nestjs-i18n';
import type { LoginDto, RegisterDto } from 'types/auth';

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
  async loginMicroservice(data: LoginDto & { lang?: string }) {
    this.logger.log(`Login request received - Email: ${data.email}`);
    
    try {
      console.log('🔍 Current I18n Lang:', I18nContext.current()?.lang);
      
      const result = await this.authService.login(data.email, data.password);
      
      // Publica evento de login
      const payload = await this.authService.validateToken(result.access_token);
      if (payload.valid) {
        await this.authEventsService.publishUserLogin(payload.user);
      }
      
      const translatedMessage = await this.i18n.t('auth.LOGIN_SUCCESS');
      console.log('🌍 Translated message:', translatedMessage);
      
      return {
        ...result,
        message: translatedMessage
      };
    } catch (error) {
      const errorMessage = await this.i18n.t('auth.LOGIN_FAILED');
      console.log('❌ Error message translated:', errorMessage);
      throw new RpcException(errorMessage);
    }
  }

  @Public()
  @MessagePattern({ cmd: 'register' })
  async registerMicroservice(data: RegisterDto & { lang?: string }) {
    this.logger.log(`Register request received - Email: ${data.email}, Name: ${data.name}`);
    
    try {
      const result = await this.authService.register(data);
      
      const payload = await this.authService.validateToken(result.access_token);
      if (payload.valid) {
        await this.authEventsService.publishUserLogin(payload.user);
      }
      
      return {
        ...result,
        message: await this.i18n.t('auth.REGISTER_SUCCESS')
      };
    } catch (error) {
      const errorMessage = await this.i18n.t('auth.REGISTER_FAILED');
      throw new RpcException(errorMessage);
    }
  }

  @Public()
  @MessagePattern({ cmd: 'validate_token' })
  async validateToken(data: { token: string; lang?: string }) {
    this.logger.log('Token validation request received');
    
    try {
      const result = await this.authService.validateToken(data.token);
      
      if (result.valid) {
        return {
          ...result,
          message: await this.i18n.t('auth.TOKEN_VALIDATED')
        };
      } else {
        return {
          ...result,
          message: await this.i18n.t('auth.TOKEN_INVALID')
        };
      }
    } catch (error) {
      const errorMessage = await this.i18n.t('auth.TOKEN_INVALID');
      throw new RpcException(errorMessage);
    }
  }

  @Public()
  @EventPattern('auth.validate.request')
  async handleTokenValidationRequest(data: { token: string; requestId: string; targetService: string }) {
    this.logger.log(`Auth validation event received - RequestID: ${data.requestId}, Target: ${data.targetService}`);
    await this.authEventsService.validateTokenAndPublish(data.token, data.requestId, data.targetService);
  }

  @Public()
  @EventPattern('auth.logout.request')
  async handleLogoutRequest(data: { userId: string }) {
    this.logger.log(`Logout event received - UserID: ${data.userId}`);
    await this.authEventsService.publishUserLogout(data.userId);
  }
}
