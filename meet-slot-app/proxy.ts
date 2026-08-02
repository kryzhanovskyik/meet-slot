import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/jwt';

const AUTH_ONLY_PATHS = ['/login', '/register'];
const PROTECTED_PATHS = ['/rooms', '/my-bookings'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  const isProtected = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAuthOnly = AUTH_ONLY_PATHS.includes(pathname);

  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnly && session) {
    return NextResponse.redirect(new URL('/rooms', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/rooms', '/rooms/:path*', '/my-bookings'],
};
