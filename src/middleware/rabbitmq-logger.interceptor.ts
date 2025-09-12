import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
// import { RmqContext } from '@nestjs/microservices';

@Injectable()
export class RabbitMQLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RabbitMQ');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();

    if (contextType === 'rpc') {
      // const rmqContext = context.switchToRpc().getContext<RmqContext>();
      const pattern = context.getHandler().name;
      const data: Record<string, any> = context.switchToRpc().getData();

      const messageId = this.generateMessageId();

      this.logger.log(
        `[${messageId}] Received message - Pattern: ${pattern} | Data: ${JSON.stringify(data)}`,
      );

      const startTime = Date.now();

      return next.handle().pipe(
        tap({
          next: (response) => {
            const processingTime = Date.now() - startTime;
            this.logger.log(
              `[${messageId}] Message processed successfully - Pattern: ${pattern} | Response: ${JSON.stringify(response)} | Time: ${processingTime}ms`,
            );
          },
          error: (error: unknown) => {
            const e = error as Error;

            const processingTime = Date.now() - startTime;
            this.logger.error(
              `[${messageId}] Message processing failed - Pattern: ${pattern} | Error: ${e.message} | Time: ${processingTime}ms`,
            );
          },
        }),
      );
    }

    return next.handle();
  }

  private generateMessageId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
