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

/**
 * First path segments behind the sign-in gate that render DashboardShell.
 *
 * Narrower than the product's top-level sections on purpose: about, contact,
 * solutions, auth and marketplace are public and must keep the global header.
 */
const ROLE_SEGMENTS = new Set(['farmer', 'processor', 'consumer']);

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
 * Matched on the first segment only: everything under a role prefix renders
 * DashboardShell. This used to require a second segment of exactly `dashboard`,
 * while the deeper role pages kept the global header on the grounds that they had
 * none of their own. They do now, so that exemption would have put two bars on
 * one screen again.
 */
function isDashboardPath(pathname: string): boolean {
  const [, first] = pathname.split('/');
  return ROLE_SEGMENTS.has(first);
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

  it.each([
    '/farmer/disease',
    '/farmer/prices',
    '/farmer/chat',
    '/processor/quality',
    '/processor/equipment',
    '/processor/feasibility',
  ])('treats %s as owning its header too, now that it uses DashboardShell', (path) => {
    expect(isDashboardPath(path)).toBe(true);
  });

  it('suppresses the header on a bare role root too, since the gate is prefix-based', () => {
    // There is no page at `/farmer`, so nothing renders there. The gate cannot
    // distinguish it without a route table, and erring towards hiding the header
    // is the safer failure: it cannot produce two stacked bars.
    expect(isDashboardPath('/farmer')).toBe(true);
    expect(isDashboardPath('/processor')).toBe(true);
    expect(isDashboardPath('/consumer')).toBe(true);
  });

  it.each(['/', '/about', '/contact', '/solutions', '/auth/login', '/marketplace'])(
    'leaves %s on the global chrome',
    (path) => {
      expect(isDashboardPath(path)).toBe(false);
    },
  );

  it('does not suppress the header for a path that merely starts with a role name', () => {
    expect(isDashboardPath('/farmers-market')).toBe(false);
    expect(isDashboardPath('/processing-notes')).toBe(false);
  });
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