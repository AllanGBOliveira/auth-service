import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { I18nResolver } from 'nestjs-i18n';

@Injectable()
export class RabbitMQI18nResolver implements I18nResolver {
  private readonly logger = new Logger(RabbitMQI18nResolver.name);

  resolve(context: ExecutionContext): string | string[] | undefined {
    const rpcContext = context.switchToRpc();
    const data: Record<string, any> = rpcContext.getData();

    this.logger.debug(
      `RabbitMQ Resolver - Data received: ${JSON.stringify(data)}`,
    );

    if (data && typeof data === 'object' && 'lang' in data) {
      this.logger.debug(`Language resolved: ${data.lang as string}`);
      return data.lang as string;
    }

    this.logger.warn('No lang found, using fallback: en');
    return 'en';
  }
}
