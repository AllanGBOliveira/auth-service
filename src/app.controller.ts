import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import type { Game } from '../types/games';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

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
