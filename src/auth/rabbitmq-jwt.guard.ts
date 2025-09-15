import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { CanActivateRequest, ValidatedUser } from 'types/auth';
import type { Request } from 'express';

@Injectable()
export class RabbitMQJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const data = context.switchToRpc().getData<CanActivateRequest>();
    const token = data?.token ?? this.extractTokenFromHeader(data.headers);

    if (!token) {
      throw new RpcException('Token de autenticação não fornecido');
    }

    try {
      const jwtSecret = this.configService.get<string>(
        'JWT_SECRET',
        'your-secret-key',
      );
      const payload = await this.jwtService.verifyAsync<Partial<ValidatedUser>>(
        token,
        {
          secret: jwtSecret,
        },
      );

      data.user = payload;
      return true;
    } catch (error: unknown) {
      const e = error as Error;

      throw new RpcException(e.message);
    }
  }

  private extractTokenFromHeader(
    headers: Request['headers'],
  ): string | undefined {
    const [type, token] = headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
