import { Controller, Get, Param } from '@nestjs/common';
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
  getGames(): Array<Game> {
    return this.appService.getGames();
  }

  @Get('games/:id')
  getGameById(@Param('id') id: string): Game | string {
    return this.appService.getGameById(Number(id));
  }
}
