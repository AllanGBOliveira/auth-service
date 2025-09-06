import { Body, Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { MessagePattern } from '@nestjs/microservices';
import type { LoginDto, RegisterDto } from 'types/auth';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Public()
  @MessagePattern({ cmd: 'login' })
  async loginMicroservice(loginDto: LoginDto) {
    console.log('Login request received in auth microservice:', loginDto);
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Public()
  @MessagePattern({ cmd: 'register' })
  async registerMicroservice(registerDto: RegisterDto) {
    console.log('Register request received in auth microservice:', registerDto);
    return this.authService.register(registerDto);
  }
}
