import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Public()
  @MessagePattern({ cmd: 'health_check' })
  getHello(): string {
    this.logger.log('Health check request received');
    return this.appService.getHello();
  }
}
