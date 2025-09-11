import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthEventsService } from './auth-events.service';
import type { LoginDto, RegisterDto } from 'types/auth';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    validateToken: jest.fn(),
  };

  const mockAuthEventsService = {
    publishTokenValidated: jest.fn(),
    publishTokenInvalid: jest.fn(),
    publishUserLogin: jest.fn(),
    publishUserLogout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: AuthEventsService,
          useValue: mockAuthEventsService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('loginMicroservice', () => {
    it('should call authService.login with correct parameters', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = { access_token: 'jwt-token' };
      const mockValidateResult = { 
        valid: true, 
        user: { id: '1', email: 'test@example.com' } 
      };

      mockAuthService.login.mockResolvedValue(expectedResult);
      mockAuthService.validateToken.mockResolvedValue(mockValidateResult);

      const result = await controller.loginMicroservice(loginDto);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(authService.validateToken).toHaveBeenCalledWith(expectedResult.access_token);
      expect(mockAuthEventsService.publishUserLogin).toHaveBeenCalledWith(mockValidateResult.user);
      expect(result).toEqual(expectedResult);
    });

    it('should handle login errors', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      const error = new Error('Invalid credentials');

      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.loginMicroservice(loginDto)).rejects.toThrow(
        error,
      );
      expect(authService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(authService.validateToken).not.toHaveBeenCalled();
      expect(mockAuthEventsService.publishUserLogin).not.toHaveBeenCalled();
    });
  });

  describe('registerMicroservice', () => {
    it('should call authService.register with correct parameters', async () => {
      const registerDto: RegisterDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = { access_token: 'jwt-token' };
      const mockValidateResult = { 
        valid: true, 
        user: { id: '1', email: 'test@example.com' } 
      };

      mockAuthService.register.mockResolvedValue(expectedResult);
      mockAuthService.validateToken.mockResolvedValue(mockValidateResult);

      const result = await controller.registerMicroservice(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.validateToken).toHaveBeenCalledWith(expectedResult.access_token);
      expect(mockAuthEventsService.publishUserLogin).toHaveBeenCalledWith(mockValidateResult.user);
      expect(result).toEqual(expectedResult);
    });

    it('should handle registration errors', async () => {
      const registerDto: RegisterDto = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      };
      const error = new Error('Email already exists');

      mockAuthService.register.mockRejectedValue(error);

      await expect(
        controller.registerMicroservice(registerDto),
      ).rejects.toThrow(error);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.validateToken).not.toHaveBeenCalled();
      expect(mockAuthEventsService.publishUserLogin).not.toHaveBeenCalled();
    });
  });
});
