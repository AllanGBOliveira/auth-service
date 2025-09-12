import type { CreateUserDto } from './../../types/users.d';
import type {
  AuthTokenResponse,
  JwtPayload,
  TokenValidationResult,
  ValidatedUser,
} from './../../types/auth.d';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Partial<User> | null> {
    const user: User | null = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { id, name, email, isActive, role, createdAt, updatedAt } = user;
      return {
        id,
        name,
        email,
        isActive,
        role,
        createdAt,
        updatedAt,
      };
    }
    return null;
  }

  async login(email: string, password: string): Promise<AuthTokenResponse> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      email: user.email ?? '',
      sub: user.id ?? '',
      role: user.role ?? '',
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register(createUserDto: CreateUserDto): Promise<AuthTokenResponse> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      const cleanToken = token.replace('Bearer ', '');

      const payload =
        await this.jwtService.verifyAsync<Partial<ValidatedUser>>(cleanToken);
      if (!payload) {
        throw new Error('Token inválido ou expirado');
      }

      const user: ValidatedUser = {
        id: payload.sub ?? '',
        email: payload.email ?? '',
        role: payload.role ?? '',
      };

      return {
        valid: true,
        user,
      };
    } catch (error: unknown) {
      const e = error as Error;
      e.message = 'Token inválido ou expirado';
      return {
        valid: false,
        error: e.message,
      };
    }
  }
}
