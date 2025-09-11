import { Body, Controller, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthEventsService } from './auth-events.service';
import { Public } from './decorators/public.decorator';
import { MessagePattern, EventPattern } from '@nestjs/microservices';
import type { LoginDto, RegisterDto } from 'types/auth';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private authEventsService: AuthEventsService,
  ) {}
  @Public()
  @MessagePattern({ cmd: 'login' })
  async loginMicroservice(loginDto: LoginDto) {
    this.logger.log(`Login request received - Email: ${loginDto.email}`);
    const result = await this.authService.login(loginDto.email, loginDto.password);
    
    // Publica evento de login
    const payload = await this.authService.validateToken(result.access_token);
    if (payload.valid) {
      await this.authEventsService.publishUserLogin(payload.user);
    }
    
    return result;
  }

  @Public()
  @MessagePattern({ cmd: 'register' })
  async registerMicroservice(registerDto: RegisterDto) {
    this.logger.log(`Register request received - Email: ${registerDto.email}, Name: ${registerDto.name}`);
    const result = await this.authService.register(registerDto);
    
    const payload = await this.authService.validateToken(result.access_token);
    if (payload.valid) {
      await this.authEventsService.publishUserLogin(payload.user);
    }
    
    return result;
  }

  @Public()
  @MessagePattern({ cmd: 'validate_token' })
  async validateToken(payload: { token: string }) {
    this.logger.log('Token validation request received');
    return this.authService.validateToken(payload.token);
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
