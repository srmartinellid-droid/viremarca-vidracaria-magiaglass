import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function validCookie(raw: string | undefined) {
  if (!raw || !process.env.ADMIN_SECRET) return false;
  const [token, sig] = raw.split('.');
  if (!token || !sig || sig.length !== 64) return false;
  const expected = crypto.createHmac('sha256', process.env.ADMIN_SECRET).update(token).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}

export const runtime = 'nodejs';

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path === '/admin' || path === '/admin/') {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/index.html';
    return NextResponse.redirect(url);
  }

  if (!path.startsWith('/admin/')) return NextResponse.next();
  if (path === '/admin/index.html') return NextResponse.next();

  if (!validCookie(req.cookies.get('mg_admin')?.value)) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/index.html';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ['/admin', '/admin/', '/admin/:path*'] };
