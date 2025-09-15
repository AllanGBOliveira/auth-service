import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { I18nService } from 'nestjs-i18n';
import { UsersService } from './users.service';
import type {
  UserProfileMessagePattern,
  CreateUserPayload,
  FindUserByIdPayload,
  UpdateUserPayload,
  DeleteUserPayload,
  CreateUserResponse,
  FindUsersResponse,
  FindUserResponse,
  UpdateUserResponse,
  DeleteUserResponse,
} from 'types/users';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly i18n: I18nService,
  ) {}

  @MessagePattern({ cmd: 'create_user' })
  async create(payload: CreateUserPayload): Promise<CreateUserResponse> {
    this.logger.log(
      `Create user request - Email: ${payload.email}, Name: ${payload.name}`,
    );
    try {
      const createUserDto = {
        name: payload.name,
        email: payload.email,
        password: payload.password,
      };
      const user = await this.usersService.create(createUserDto);
      return {
        message: this.i18n.t('auth.USER_CREATED'),
        data: user,
      };
    } catch (error: unknown) {
      const e = error as Error;
      this.logger.error(`Failed to create user: ${e.message}`);

      throw new RpcException(this.i18n.t('auth.CREATE_USER_FAILED'));
    }
  }

  @MessagePattern({ cmd: 'find_all_users' })
  async findAll(): Promise<FindUsersResponse> {
    this.logger.log('Find all users request received');
    const users = await this.usersService.findAll();
    this.logger.log(`Found ${users.length} users`);
    return {
      message: this.i18n.t('auth.PROFILE_RETRIEVED'),
      data: users,
    };
  }

  @MessagePattern({ cmd: 'get_user_profile' })
  async getProfile(
    payload: UserProfileMessagePattern,
  ): Promise<FindUserResponse> {
    const userId = payload.user?.sub ?? '';
    this.logger.log(`Get user profile request - UserID: ${userId}`);
    const user = await this.usersService.findOne(userId);
    if (!user) {
      this.logger.warn(`User not found - UserID: ${userId}`);
      const errorMessage = this.i18n.t('auth.USER_NOT_FOUND');
      throw new RpcException({
        message: errorMessage,
        status: 404,
      });
    }
    return {
      message: this.i18n.t('auth.PROFILE_RETRIEVED'),
      data: user,
    };
  }

  @MessagePattern({ cmd: 'find_user_by_id' })
  async findOne(payload: FindUserByIdPayload): Promise<FindUserResponse> {
    this.logger.log(`Find user by ID request - ID: ${payload.id}`);
    const user = await this.usersService.findOne(payload.id);
    if (!user) {
      this.logger.warn(`User not found - ID: ${payload.id}`);
      const errorMessage = this.i18n.t('auth.USER_NOT_FOUND');
      throw new RpcException({
        message: errorMessage,
        status: 404,
      });
    }
    return {
      message: this.i18n.t('auth.PROFILE_RETRIEVED'),
      data: user,
    };
  }

  @MessagePattern({ cmd: 'update_user' })
  async update(payload: UpdateUserPayload): Promise<UpdateUserResponse> {
    this.logger.log(`Update user request - ID: ${payload.id}`);
    const user = await this.usersService.update(
      payload.id,
      payload.updateUserDto,
    );
    if (!user) {
      this.logger.warn(`User not found for update - ID: ${payload.id}`);
      const errorMessage = this.i18n.t('auth.USER_NOT_FOUND');
      throw new RpcException({
        message: errorMessage,
        status: 404,
      });
    }
    this.logger.log(`User updated successfully - ID: ${payload.id}`);
    return {
      message: this.i18n.t('auth.USER_UPDATED'),
      data: user,
    };
  }

  @MessagePattern({ cmd: 'delete_user' })
  async remove(payload: DeleteUserPayload): Promise<DeleteUserResponse> {
    this.logger.log(`Delete user request - ID: ${payload.id}`);
    await this.usersService.remove(payload.id);
    this.logger.log(`User deleted successfully - ID: ${payload.id}`);
    return {
      message: this.i18n.t('auth.USER_DELETED'),
    };
  }
}
