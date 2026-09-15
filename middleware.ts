import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Canonical entry point for the administrative area.
  // The actual UI is the static /admin/index.html document.
  if (path === '/admin' || path === '/admin/') {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/index.html';
    return NextResponse.redirect(url);
  }

  if (!path.startsWith('/admin/')) return NextResponse.next();

  // Login page must remain publicly reachable.
  if (path === '/admin/index.html') return NextResponse.next();

  // Every other administrative document requires the server session cookie.
  const cookie = req.cookies.get('mg_admin')?.value;
  if (!cookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/index.html';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ['/admin', '/admin/', '/admin/:path*'] };
