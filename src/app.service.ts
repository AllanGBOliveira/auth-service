import { Injectable } from '@nestjs/common';
import type { Game } from '../types/games';

const games: Array<Game> = [
  { id: 1, name: 'Game 1' },
  { id: 2, name: 'Game 2' },
  { id: 3, name: 'Game 3' },
];

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getGames(): Array<Game> {
    return games;
  }

  getGameById(id: number): Game | string {
    return games.find((game) => game.id === id) || 'Game not found';
  }
}
