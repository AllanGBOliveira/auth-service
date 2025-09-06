import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Configuração base compartilhada
const baseConfig = {
  type: 'postgres' as const,
  host: process.env.AUTH_DB_HOST || 'localhost',
  port: process.env.AUTH_DB_PORT || 5432,
  username: process.env.AUTH_DB_USERNAME || 'auth_user',
  password: process.env.AUTH_DB_PASSWORD || 'auth_password',
  database: process.env.AUTH_DB_DATABASE || 'auth_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
};

// Para o NestJS (runtime)
export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    ...baseConfig,
    synchronize: true, // sempre false para usar migrations
  }),
);

// Para CLI do TypeORM (migrations)
export const AppDataSource = new DataSource({
  ...baseConfig,
  entities: ['src/**/*.entity.ts'], // CLI precisa dos arquivos .ts
  migrations: ['src/migrations/*.ts'],
  synchronize: true,
});
