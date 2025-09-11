import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { UsersService } from './users.service';
import type { CreateUserDto, UpdateUserDto } from './users.service';

export interface JwtPayload {
  user: {
    email: string;
    sub: string;
    role: string;
    iat: number;
    exp: number;
  };
}

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'create_user' })
  async create(payload: { name: string; email: string; password: string; token?: string; user?: any }) {
    this.logger.log(`Create user request - Email: ${payload.email}, Name: ${payload.name}`);
    try {
      const createUserDto = {
        name: payload.name,
        email: payload.email,
        password: payload.password,
      };
      const user = await this.usersService.create(createUserDto);
      return {
        message: 'User created successfully',
        data: user,
      };
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`);
      throw new RpcException(`Failed to create user: ${error.message}`);
    }
  }

  @MessagePattern({ cmd: 'find_all_users' })
  async findAll(payload: { token?: string; user?: any }) {
    this.logger.log('Find all users request received');
    const users = await this.usersService.findAll();
    this.logger.log(`Found ${users.length} users`);
    return {
      message: 'Users retrieved successfully',
      data: users,
    };
  }

  @MessagePattern({ cmd: 'get_user_profile' })
  async getProfile(payload: { token?: string; user?: any }) {
    const userId = payload.user?.sub;
    this.logger.log(`Get user profile request - UserID: ${userId}`);
    const user = await this.usersService.findOne(userId);
    if (!user) {
      this.logger.warn(`User not found - UserID: ${userId}`);
      throw new RpcException('User not found');
    }
    return {
      message: 'Profile retrieved successfully',
      data: user,
    };
  }

  @MessagePattern({ cmd: 'find_user_by_id' })
  async findOne(payload: { id: string; token?: string; user?: any }) {
    this.logger.log(`Find user by ID request - ID: ${payload.id}`);
    const user = await this.usersService.findOne(payload.id);
    if (!user) {
      this.logger.warn(`User not found - ID: ${payload.id}`);
      throw new RpcException('User not found');
    }
    return {
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @MessagePattern({ cmd: 'update_user' })
  async update(payload: { id: string; updateUserDto: UpdateUserDto; token?: string; user?: any }) {
    this.logger.log(`Update user request - ID: ${payload.id}`);
    const user = await this.usersService.update(payload.id, payload.updateUserDto);
    if (!user) {
      this.logger.warn(`User not found for update - ID: ${payload.id}`);
      throw new RpcException('User not found');
    }
    this.logger.log(`User updated successfully - ID: ${payload.id}`);
    return {
      message: 'User updated successfully',
      data: user,
    };
  }

  @MessagePattern({ cmd: 'delete_user' })
  async remove(payload: { id: string; token?: string; user?: any }) {
    this.logger.log(`Delete user request - ID: ${payload.id}`);
    await this.usersService.remove(payload.id);
    this.logger.log(`User deleted successfully - ID: ${payload.id}`);
    return {
      message: 'User deleted successfully',
    };
  }
}
