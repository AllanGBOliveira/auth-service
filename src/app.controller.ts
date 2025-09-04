import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import type { Game } from '../types/games';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('games')
  getGames(
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'inactive',
  ): Array<Game> {
    return this.appService.getGames({
      search,
      status,
    });
  }
}
