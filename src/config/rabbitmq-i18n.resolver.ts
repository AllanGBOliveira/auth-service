import { ExecutionContext, Injectable } from '@nestjs/common';
import { I18nResolver } from 'nestjs-i18n';

@Injectable()
export class RabbitMQI18nResolver implements I18nResolver {
  resolve(context: ExecutionContext): string | string[] | undefined {
    const rpcContext = context.switchToRpc();
    const data = rpcContext.getData();
    
    console.log('🔍 RabbitMQ Resolver - Data received:', data);
    
    if (data && typeof data === 'object' && 'lang' in data) {
      console.log('🌍 Language resolved:', data.lang);
      return data.lang;
    }
    
    console.log('⚠️ No lang found, using fallback: en');
    return 'en';
  }
}
