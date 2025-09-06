import { Injectable } from '@nestjs/common';
import type { Game } from '../types/games';

const games: Array<Game> = [
  { id: 1, name: 'Game 1', status: 'active' },
  { id: 2, name: 'Game 2', status: 'inactive' },
  { id: 3, name: 'Game 3', status: 'active' },
];

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World! Auth Service';
  }

  getGames(
    params: {
      search?: string;
      status?: 'active' | 'inactive';
    } = {},
  ): Array<Game> {
    return games.filter((game) => {
      const matchesSearch = game.name
        .toLowerCase()
        .includes(params.search?.toLowerCase() || '');
      const matchesStatus = params.status
        ? game.status === params.status
        : true;
      return matchesSearch && matchesStatus;
    });
  }

  getGameById(id: number): Game | string {
    return games.find((game) => game.id === id) || 'Game not found';
  }
}
