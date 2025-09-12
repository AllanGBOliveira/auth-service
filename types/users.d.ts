import { BaseRabbitMQPayload, BaseUserDto } from './common';
import { User } from '../entities/user.entity';

// export interface User {
//   id: string;
//   name: string;
//   email: string;
//   role: string;
//   isActive: boolean;
//   createdAt: string;
//   updatedAt: string;
// }

export interface JwtUser {
  email: string;
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

export type UserProfileMessagePattern = BaseRabbitMQPayload;

export interface FindUserByIdPayload extends BaseRabbitMQPayload {
  id: string;
}

export interface UpdateUserPayload extends BaseRabbitMQPayload {
  id: string;
  updateUserDto: UpdateUserDto;
}

export interface DeleteUserPayload extends BaseRabbitMQPayload {
  id: string;
}

export interface CreateUserPayload extends BaseRabbitMQPayload, BaseUserDto {}

export type CreateUserDto = BaseUserDto;

export interface UpdateUserDto {
  name?: string;
  email?: string;
  isActive?: boolean;
  role?: string;
}

export interface UserServiceResponse<T> {
  message: string;
  data?: T | T[];
}

export type CreateUserResponse = UserServiceResponse<User>;

export type FindUsersResponse = UserServiceResponse<User[]>;

export type FindUserResponse = UserServiceResponse<User>;

export type UpdateUserResponse = UserServiceResponse<User>;

export interface DeleteUserResponse {
  message: string;
}
