import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import type { CreateUserDto, UpdateUserDto } from '../../types/users';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: [
        'id',
        'name',
        'email',
        'isActive',
        'role',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async findOne(id: string): Promise<User | null> {
    try {
      return this.usersRepository.findOne({
        where: { id },
        select: [
          'id',
          'name',
          'email',
          'isActive',
          'role',
          'createdAt',
          'updatedAt',
        ],
      });
    } catch (error: unknown) {
      const e = error as Error;

      this.logger.error(
        `Login failed - Error message translated: ${e.message}`,
      );
      throw new RpcException({
        message: e.message,
        status: 404,
      });
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    try {
      await this.usersRepository.update(id, updateUserDto);
      return this.findOne(id);
    } catch (error: unknown) {
      const e = error as Error;

      this.logger.error(
        `Login failed - Error message translated: ${e.message}`,
      );
      throw new RpcException({
        message: e.message,
        status: 404,
      });
    }
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
