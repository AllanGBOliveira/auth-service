import { registerAs } from '@nestjs/config';
import { I18nOptions, I18nJsonLoader } from 'nestjs-i18n';
import * as path from 'path';

export default registerAs(
  'i18n',
  (): I18nOptions => ({
    fallbackLanguage: 'en',
    loader: I18nJsonLoader,
    loaderOptions: {
      path: path.join(__dirname, '../i18n/'),
      watch: process.env.NODE_ENV !== 'production',
    },
    resolvers: [],
  }),
);
