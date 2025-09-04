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
      expect(appController.getGames('', undefined)).toEqual([
        { id: 1, name: 'Game 1', status: 'active' },
        { id: 2, name: 'Game 2', status: 'inactive' },
        { id: 3, name: 'Game 3', status: 'active' },
      ]);
    });

    it('should return an array of games filtered by search', () => {
      expect(appController.getGames('2', undefined)).toEqual([
        { id: 2, name: 'Game 2', status: 'inactive' },
      ]);
    });

    it('should return an array of games filtered by status', () => {
      expect(appController.getGames('', 'active')).toEqual([
        { id: 1, name: 'Game 1', status: 'active' },
        { id: 3, name: 'Game 3', status: 'active' },
      ]);
    });

    it('should return an array of games filtered by search and status', () => {
      expect(appController.getGames(' 2', 'inactive')).toEqual([
        { id: 2, name: 'Game 2', status: 'inactive' },
      ]);
    });
  });
});
