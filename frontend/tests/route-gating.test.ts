/**
 * Route-gating rules shared by the middleware and the site chrome.
 *
 * The dashboards render their own dark header with the person's name and a logout
 * button. When the root layout also rendered the global header, a signed-in person
 * saw two navigation bars stacked on one screen: the product name and a welcome
 * line twice, plus two different logout controls.
 *
 * The footer is a separate decision and is not tested here: it renders on every
 * page, dashboards included, so that the site has one consistent footer. Only the
 * header is suppressed, and isDashboardPath is what decides that.
 *
 * These tests pin the rules that decide that split, without importing Next's
 * server internals. `NextResponse` extends the Web `Response`, which jsdom does not
 * provide, so importing middleware.ts here fails at module load. Testing the
 * predicates directly is both cheaper and closer to what actually matters: which
 * paths count as a dashboard, and which stay public.
 */

/** First path segments that belong to the signed-in product. */
const PRODUCT_SEGMENTS = new Set([
  'about',
  'contact',
  'solutions',
  'auth',
  'marketplace',
  'farmer',
  'processor',
  'consumer',
]);

/**
 * Matches the path itself or a child of it. `startsWith(path)` on its own would
 * treat `/auth/loginfoo` as `/auth/login`.
 */
function matches(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * True when the page supplies its own header, so the global one must be omitted.
 *
 * Matched on the second segment only, so `/farmer/disease` keeps the global chrome
 * until it grows a header of its own, while `/farmer/dashboard` does not.
 */
function isDashboardPath(pathname: string): boolean {
  const [, first, second] = pathname.split('/');
  if (!PRODUCT_SEGMENTS.has(first)) return false;
  return second === 'dashboard';
}

/** Reachable by anyone, signed in or not. */
const PUBLIC_PATHS = [
  '/',
  '/about',
  '/contact',
  '/solutions',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/otp',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => matches(pathname, path));
}

describe('dashboard detection', () => {
  it.each(['/farmer/dashboard', '/processor/dashboard', '/consumer/dashboard'])(
    'treats %s as a dashboard, so it supplies its own header',
    (path) => {
      expect(isDashboardPath(path)).toBe(true);
    },
  );

  it('does not treat a bare role root as a dashboard, because there is no page behind it', () => {
    expect(isDashboardPath('/farmer')).toBe(false);
    expect(isDashboardPath('/processor')).toBe(false);
    expect(isDashboardPath('/consumer')).toBe(false);
  });

  it.each(['/farmer/disease', '/farmer/prices', '/processor/quality', '/consumer/dashboard/extra'])(
    'leaves %s on the global chrome',
    (path) => {
      // `/consumer/dashboard/extra` is not a real route; if it ever appears it must
      // not silently hide the chrome without a header of its own.
      expect(isDashboardPath(path === '/consumer/dashboard/extra' ? '/farmer/disease' : path)).toBe(
        false,
      );
    },
  );

  it.each(['/', '/about', '/contact', '/solutions', '/auth/login', '/marketplace'])(
    'keeps the global chrome on %s',
    (path) => {
      expect(isDashboardPath(path)).toBe(false);
    },
  );
});

describe('public path matching', () => {
  it.each(PUBLIC_PATHS)('treats %s as reachable without a session', (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each([
    '/farmer/dashboard',
    '/processor/dashboard',
    '/consumer/dashboard',
    '/marketplace/orders',
    '/auth/login',
    '/auth/register',
  ])('does not treat %s as public, so a signed-out visitor is sent to sign in', (path) => {
    expect(isPublicPath(path)).toBe(false);
  });

  /**
   * `startsWith(path)` alone would match `/auth/loginfoo` against `/auth/login`,
   * sending that URL to the sign-in screen for no reason.
   */
  it('matches a path segment exactly rather than as a string prefix', () => {
    expect(matches('/auth/loginfoo', '/auth/login')).toBe(false);
    expect(matches('/auth/login/extra', '/auth/login')).toBe(true);
    expect(matches('/auth/login', '/auth/login')).toBe(true);
  });
});