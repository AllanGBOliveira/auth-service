import { BaseRabbitMQPayload, BaseUserDto, BaseServiceError } from './common';
import type { Request } from 'express';

export interface LoginDto {
  email: string;
  password: string;
}

export type RegisterDto = BaseUserDto;

export interface LoginMessagePattern extends BaseRabbitMQPayload {
  email: string;
  password: string;
}

export interface RegisterMessagePattern
  extends BaseRabbitMQPayload,
    BaseUserDto {}

export interface ValidateTokenRequest extends BaseRabbitMQPayload {
  token: string;
}

export interface TokenValidationEventPayload {
  token: string;
  requestId: string;
  targetService: string;
}

export interface LogoutEventPayload {
  userId: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  error?: string;
  message?: string;
}

export type AuthServiceError = BaseServiceError;

export type AuthServiceResponse = ValidateTokenResponse | AuthServiceError;

export interface AuthTokenResponse {
  access_token: string;
}

export interface JwtPayload {
  email: string;
  sub: string;
  role: string;
}

export interface ValidatedUser extends Partial<JwtPayload> {
  id: string;
  email: string;
  role: string;
  secret?: string;
}

export interface TokenValidationResult {
  valid: boolean;
  user?: ValidatedUser;
  error?: string;
}

export interface AuthEventResult {
  requestId: string;
  targetService: string;
  valid: boolean;
  user?: ValidatedUser;
  error?: string;
  timestamp: string;
}

export interface UserLoginEvent {
  eventType: 'user.login';
  user: ValidatedUser;
  timestamp: string;
}

export interface UserLogoutEvent {
  eventType: 'user.logout';
  userId: string;
  timestamp: string;
}

export interface TokenValidatedEvent {
  eventType: 'token.validated';
  user: ValidatedUser;
  requestId?: string;
  timestamp: string;
}

export interface TokenInvalidEvent {
  eventType: 'token.invalid';
  requestId?: string;
  error: string;
  timestamp: string;
}

export interface CanActivateRequest extends Request {
  token: string;
}
