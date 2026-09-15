import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!path.startsWith('/admin/') || path === '/admin/index.html') return NextResponse.next();
  const cookie = req.cookies.get('mg_admin')?.value;
  if (!cookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/index.html';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
