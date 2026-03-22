import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always public
  if (pathname === '/') return NextResponse.next();
  if (pathname === '/dev-gate') return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.next();
  if (pathname.startsWith('/_next/')) return NextResponse.next();
  if (pathname === '/favicon.ico') return NextResponse.next();

  // Check dev access cookie
  const hasAccess = request.cookies.get('mise-dev-access')?.value === 'true';
  if (hasAccess) return NextResponse.next();

  // Redirect to dev gate
  const url = request.nextUrl.clone();
  url.pathname = '/dev-gate';
  url.searchParams.set('redirect', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
