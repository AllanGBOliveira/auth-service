declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: number;
    GATEWAY_SERVICE_HOST: string;
    GATEWAY_SERVICE_PORT: number;
    AUTH_DB_HOST: string;
    AUTH_DB_PORT: number;
    AUTH_DB_USERNAME: string;
    AUTH_DB_PASSWORD: string;
    AUTH_DB_DATABASE: string;
    JWT_SECRET: string;
  }
}
