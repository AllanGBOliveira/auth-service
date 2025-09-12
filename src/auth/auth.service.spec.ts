import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import type { CreateUserDto } from '../../types/users';

jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  // let usersService: UsersService;
  // let jwtService: JwtService;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    isActive: true,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    // usersService = module.get<UsersService>(UsersService);
    // jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', 'password');

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'password',
        'hashedPassword',
      );
      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        isActive: mockUser.isActive,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should return null when user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password',
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        'hashedPassword',
      );
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token when credentials are valid', async () => {
      const expectedToken = 'jwt-access-token';
      const validateUserSpy = jest
        .spyOn(service, 'validateUser')
        .mockResolvedValue({
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          isActive: mockUser.isActive,
          role: mockUser.role,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        });
      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      const result = await service.login('test@example.com', 'password');

      expect(validateUserSpy).toHaveBeenCalledWith(
        'test@example.com',
        'password',
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
      expect(result).toEqual({ access_token: expectedToken });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const validateUserSpy = jest
        .spyOn(service, 'validateUser')
        .mockResolvedValue(null);

      await expect(
        service.login('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login('test@example.com', 'wrongpassword'),
      ).rejects.toThrow('Invalid credentials');

      expect(validateUserSpy).toHaveBeenCalledWith(
        'test@example.com',
        'wrongpassword',
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should create user and return access token', async () => {
      const createUserDto: CreateUserDto = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      };
      const hashedPassword = 'hashedPassword123';
      const expectedToken = 'jwt-access-token';
      const createdUser = {
        ...mockUser,
        ...createUserDto,
        password: hashedPassword,
      };

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUsersService.create.mockResolvedValue(createdUser);
      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      const result = await service.register(createUserDto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        10,
      );
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        email: createdUser.email,
        sub: createdUser.id,
        role: createdUser.role,
      });
      expect(result).toEqual({ access_token: expectedToken });
    });

    it('should handle user creation errors', async () => {
      const createUserDto: CreateUserDto = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
      };
      const hashedPassword = 'hashedPassword123';
      const error = new Error('Email already exists');

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUsersService.create.mockRejectedValue(error);

      await expect(service.register(createUserDto)).rejects.toThrow(error);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        10,
      );
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});
