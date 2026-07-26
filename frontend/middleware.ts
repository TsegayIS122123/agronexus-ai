import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Public paths (no auth needed)
  const publicPaths = ['/', '/about', '/solutions', '/contact'];
  if (publicPaths.some(path => pathname === path || pathname.startsWith('/solutions'))) {
    return NextResponse.next();
  }

  // Auth paths
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (token) {
      // Get role from cookie or decode from token
      const role = request.cookies.get('user_role')?.value || 'farmer';
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
    }
    return NextResponse.next();
  }

  // Protected paths - require auth
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based path enforcement
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    const pathRole = pathSegments[0];
    const validRoles = ['farmer', 'processor', 'consumer', 'admin'];
    if (validRoles.includes(pathRole)) {
      const role = request.cookies.get('user_role')?.value || 'farmer';
      if (pathRole !== role) {
        return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
      }
    }
  }

  return NextResponse.next();
}

// Optional: Configure which paths middleware runs on
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
