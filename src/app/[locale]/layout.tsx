import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LOCALES, type Locale } from '@/shared/i18n/config';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!LOCALES.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  // lang attribute is set on the root <html> via suppressHydrationWarning.
  // The inline script below is safe: locale is validated against the
  // LOCALES allowlist above, so no untrusted content reaches the DOM.
  const setLangScript = `document.documentElement.lang="${locale}"`;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <script dangerouslySetInnerHTML={{ __html: setLangScript }} />
      {children}
    </NextIntlClientProvider>
  );
}