export const LOCALES = ['en', 'fr-CA', 'zh-Hant'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
