import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('__session')?.value;
  const publicPages = [
    '/login', 
    '/signup', 
    '/',
    '/anonymous-report',
    '/anonymous-report-status',
    '/emergency-contacts',
    '/support'
  ];
  const isPublicPage = publicPages.includes(request.nextUrl.pathname);

  if (!token && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
