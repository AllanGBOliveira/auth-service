import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { I18nService } from 'nestjs-i18n';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RabbitMQRateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RabbitMQ-RateLimit');
  private store: RateLimitStore = {};
  private readonly windowMs = 15 * 60 * 1000;
  private readonly maxMessages = 1000;

  constructor(private i18n: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();

    if (contextType === 'rpc') {
      const data: Record<string, any> = context.switchToRpc().getData();
      const pattern = context.getHandler().name;

      const key = this.getKey(data, pattern);
      const now = Date.now();

      this.cleanExpiredEntries(now);

      if (!this.store[key]) {
        this.store[key] = {
          count: 1,
          resetTime: now + this.windowMs,
        };
      } else {
        if (now > this.store[key].resetTime) {
          this.store[key] = {
            count: 1,
            resetTime: now + this.windowMs,
          };
        } else {
          this.store[key].count++;
        }
      }

      const { count } = this.store[key];

      if (count > this.maxMessages) {
        this.logger.warn(
          `Rate limit exceeded for key: ${key} | Pattern: ${pattern} | Count: ${count}`,
        );

        throw new RpcException({
          message: this.i18n.t('auth.RATE_LIMIT_EXCEEDED'),
          status: 429,
        });
      }

      this.logger.debug(
        `Rate limit check - Key: ${key} | Pattern: ${pattern} | Count: ${count}/${this.maxMessages}`,
      );
    }

    return next.handle();
  }

  private getKey(data: Record<string, any>, pattern: string): string {
    if (data?.email) {
      return `${pattern}:${data.email}`;
    }

    const timeWindow = Math.floor(Date.now() / (5 * 60 * 1000));
    return `${pattern}:${timeWindow}`;
  }

  private cleanExpiredEntries(now: number): void {
    Object.keys(this.store).forEach((key) => {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    });
  }
}
