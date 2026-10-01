import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * This file does not authorise anything, and it is worth being clear about why.
 *
 * The session keeps its access token in a module variable (see
 * `features/auth/session.ts`), which never reaches this code. The only credential
 * visible to middleware is whether a refresh cookie was presented, so every check
 * here is a presence check rather than a verification: anyone can forge the cookie
 * and pass straight through.
 *
 * That is not a hole, because nothing is decided here that matters. The identity
 * service rejects every request that does not carry a valid bearer token, so a
 * forged cookie gets an empty page shell and no data. What this file is for is
 * keeping a signed-in person off the sign-in screen on a full page load, and
 * sending a signed-out person to the sign-in screen rather than a blank dashboard.
 *
 * Replace it with a real check when the refresh token becomes an httpOnly cookie
 * set by the service, at which point the service can be asked instead of assumed.
 */

const SESSION_COOKIE = 'agronexus_refresh';

/** Reachable by anyone, and never redirected away from, signed in or not. */
const PUBLIC_PATHS = [
  '/',
  '/about',
  '/contact',
  '/solutions',
  // Recovery and verification screens. A person who has just signed up has no
  // session yet, and a person fixing a problem may well have one. Both need to
  // land on these pages, so they must not be treated as signed-in-only routes.
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/otp',
];

/** The two screens a signed-in person has no reason to see again. */
const AUTH_PATHS = ['/login', '/register', '/auth/login', '/auth/register'];

/**
 * Matches the path itself or a child of it. `startsWith(path)` on its own would
 * treat `/auth/loginfoo` as `/auth/login`.
 */
function matches(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function hasSession(request: NextRequest): boolean {
  return Boolean(request.cookies.get(SESSION_COOKIE)?.value);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (PUBLIC_PATHS.some((path) => matches(pathname, path))) {
    return NextResponse.next();
  }

  if (AUTH_PATHS.some((path) => matches(pathname, path))) {
    if (hasSession(request)) {
      return NextResponse.redirect(new URL('/farmer/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession(request)) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
