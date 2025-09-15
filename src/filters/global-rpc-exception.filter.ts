// auth-service/src/common/filters/global-rpc-exception.filter.ts
import { Catch, ExceptionFilter, Logger, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';
import { RpcExceptionError } from '../../types/common';

@Catch(RpcException)
export class GlobalRpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalRpcExceptionFilter.name);

  catch(exception: RpcException) {
    const error = exception.getError();
    let formattedError: RpcExceptionError;

    // Asserção de tipo para garantir que o erro seja um objeto com as propriedades que queremos
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      'message' in error
    ) {
      formattedError = {
        ...(error as RpcExceptionError), // Usa asserção de tipo para garantir que é o tipo certo
        type: 'rpc', // Adiciona a chave
      };
    } else if (typeof error === 'string') {
      formattedError = {
        type: 'rpc',
        message: error,
        status: HttpStatus.BAD_REQUEST,
      };
    } else {
      // Caso seja um tipo inesperado
      formattedError = {
        type: 'rpc',
        message: 'An unexpected RPC error occurred.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    this.logger.error('Intercepted RPC Exception:', formattedError);

    // O ESLint ainda pode reclamar do tipo de retorno, então vamos tipar a função
    return throwError(() => formattedError);
  }
}
