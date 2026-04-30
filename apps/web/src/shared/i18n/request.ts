import { getRequestConfig } from 'next-intl/server';
import { LOCALES, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locale || !LOCALES.includes(locale as Locale)) {
    return {
      locale: 'en',
      messages: (await import('../../../messages/en.json')).default,
    };
  }

  return {
    locale,
    messages: (await import(`../../../messages/${locale}.json`)).default,
  };
});
