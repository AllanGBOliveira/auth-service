import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
  describe('games', () => {
    it('should return an array of games', () => {
      expect(appController.getGames()).toEqual([
        { id: 1, name: 'Game 1' },
        { id: 2, name: 'Game 2' },
        { id: 3, name: 'Game 3' },
      ]);
    });
  });
  describe('game by id', () => {
    it('should return a game by id', () => {
      expect(appController.getGameById('1')).toEqual({ id: 1, name: 'Game 1' });
    });
    it('should return "Game not found" if the game does not exist', () => {
      expect(appController.getGameById('10')).toEqual('Game not found');
    });
  });
});
