import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { enforceMfa } from '@/middleware/mfaEnforcement';

const intl = createMiddleware({
  locales: ['en', 'fr-CA', 'zh-Hant'],
  defaultLocale: 'en',
});

const ORG_PATH_RE =
  /^\/(en|fr-CA|zh-Hant)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\/|$)/;

export default async function middleware(req: NextRequest) {
  const intlResp = intl(req);
  if (intlResp && intlResp.headers.get('location')) return intlResp;

  const match = ORG_PATH_RE.exec(req.nextUrl.pathname);
  if (match) {
    const [, locale, orgId] = match;
    const mfaResp = await enforceMfa(req, orgId, locale);
    if (mfaResp) return mfaResp;
  }

  return intlResp;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};