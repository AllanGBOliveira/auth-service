import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthEventsService } from './auth-events.service';
import { I18nService } from 'nestjs-i18n';
import type {
  LoginMessagePattern,
  RegisterMessagePattern,
  ValidateTokenRequest,
} from 'types/auth';

describe('AuthController', () => {
  let controller: AuthController;
  // let authService: AuthService;
  // let authEventsService: AuthEventsService;
  // let i18nService: I18nService;

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

  const mockI18nService = {
    t: jest.fn().mockReturnValue('Translated message'),
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
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    // authService = module.get<AuthService>(AuthService);
    // authEventsService = module.get<AuthEventsService>(AuthEventsService);
    // i18nService = module.get<I18nService>(I18nService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('loginMicroservice', () => {
    it('should call authService.login with correct parameters', async () => {
      const loginData: LoginMessagePattern = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = { access_token: 'jwt-token' };
      const mockValidateResult = {
        valid: true,
        user: { id: '1', email: 'test@example.com' },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);
      mockAuthService.validateToken.mockResolvedValue(mockValidateResult);
      mockI18nService.t.mockReturnValue('Login successful');

      const result = await controller.loginMicroservice(loginData);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginData.email,
        loginData.password,
      );
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        expectedResult.access_token,
      );
      expect(mockAuthEventsService.publishUserLogin).toHaveBeenCalledWith(
        mockValidateResult.user,
      );
      expect(mockI18nService.t).toHaveBeenCalledWith('auth.LOGIN_SUCCESS');
      expect(result).toEqual({
        ...expectedResult,
        message: 'Login successful',
      });
    });

    it('should handle login errors', async () => {
      const loginData: LoginMessagePattern = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      const error = new Error('Invalid credentials');

      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.loginMicroservice(loginData)).rejects.toThrow();

      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginData.email,
        loginData.password,
      );
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
      expect(mockAuthEventsService.publishUserLogin).not.toHaveBeenCalled();
      // O controller agora chama i18n.t no catch para traduzir a mensagem de erro
      expect(mockI18nService.t).toHaveBeenCalledWith('auth.LOGIN_FAILED');
    });
  });

  describe('registerMicroservice', () => {
    it('should call authService.register with correct parameters', async () => {
      const registerData: RegisterMessagePattern = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = { access_token: 'jwt-token' };
      const mockValidateResult = {
        valid: true,
        user: { id: '1', email: 'test@example.com' },
      };

      mockAuthService.register.mockResolvedValue(expectedResult);
      mockAuthService.validateToken.mockResolvedValue(mockValidateResult);
      mockI18nService.t.mockReturnValue('Registration successful');

      const result = await controller.registerMicroservice(registerData);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        expectedResult.access_token,
      );
      expect(mockAuthEventsService.publishUserLogin).toHaveBeenCalledWith(
        mockValidateResult.user,
      );
      expect(mockI18nService.t).toHaveBeenCalledWith('auth.REGISTER_SUCCESS');
      expect(result).toEqual({
        ...expectedResult,
        message: 'Registration successful',
      });
    });

    it('should handle registration errors', async () => {
      const registerData: RegisterMessagePattern = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      };
      const error = new Error('Email already exists');

      mockAuthService.register.mockRejectedValue(error);

      await expect(
        controller.registerMicroservice(registerData),
      ).rejects.toThrow();

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
      expect(mockAuthEventsService.publishUserLogin).not.toHaveBeenCalled();

      expect(mockI18nService.t).toHaveBeenCalledWith('auth.REGISTER_FAILED');
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const tokenData: ValidateTokenRequest = {
        token: 'valid-jwt-token',
      };
      const mockValidateResult = {
        valid: true,
        user: { id: '1', email: 'test@example.com' },
      };

      mockAuthService.validateToken.mockResolvedValue(mockValidateResult);
      mockI18nService.t.mockReturnValue('Token validated');

      const result = await controller.validateToken(tokenData);

      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        tokenData.token,
      );
      expect(mockI18nService.t).toHaveBeenCalledWith('auth.TOKEN_VALIDATED');
      expect(result).toEqual({
        ...mockValidateResult,
        message: 'Token validated',
      });
    });

    it('should handle invalid token', async () => {
      const tokenData: ValidateTokenRequest = {
        token: 'invalid-jwt-token',
      };
      const mockValidateResult = {
        valid: false,
        user: null,
      };

      mockAuthService.validateToken.mockResolvedValue(mockValidateResult);
      mockI18nService.t.mockReturnValue('Token invalid');

      const result = await controller.validateToken(tokenData);

      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        tokenData.token,
      );
      expect(mockI18nService.t).toHaveBeenCalledWith('auth.TOKEN_INVALID');
      expect(result).toEqual({
        ...mockValidateResult,
        message: 'Token invalid',
      });
    });

    it('should handle token validation errors', async () => {
      const tokenData: ValidateTokenRequest = {
        token: 'malformed-token',
      };
      const error = new Error('Token malformed');

      mockAuthService.validateToken.mockRejectedValue(error);

      await expect(controller.validateToken(tokenData)).rejects.toThrow();

      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        tokenData.token,
      );
      // O controller agora chama i18n.t no catch para traduzir a mensagem de erro
      expect(mockI18nService.t).toHaveBeenCalledWith('auth.TOKEN_INVALID');
    });
  });
});
