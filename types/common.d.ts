export interface JwtUser {
  email: string;
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

export interface BaseRabbitMQPayload {
  lang?: string;
  token?: string;
  user?: JwtUser;
}

export interface BaseUserDto {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface BaseServiceResponse {
  message: string;
  data?: any;
}

export interface BaseServiceError {
  status: 'error';
  message: string;
}

export interface RpcExceptionError {
  message: string;
  status: number;
  type: 'rpc';
}
