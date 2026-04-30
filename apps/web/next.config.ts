import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/shared/i18n/request.ts');

const nextConfig: NextConfig = {
  // Source-shipped workspace package — Next must transpile its
  // .ts/.tsx files because @chounting/ui has no build step.
  transpilePackages: ['@chounting/ui'],
};

export default withNextIntl(nextConfig);
