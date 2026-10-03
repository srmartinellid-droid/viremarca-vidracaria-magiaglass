import crypto from 'node:crypto';

export function requestIp(req: Request) {
  return (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
}

export function requestUserAgent(req: Request) {
  return req.headers.get('user-agent') || 'unknown';
}

export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (origin) {
    const expected = process.env.NEXT_PUBLIC_SITE_URL || 'https://viremarca-vidracaria-magiaglass.vercel.app';
    if (origin.replace(/\/$/, '') !== expected.replace(/\/$/, '')) return false;
  }
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return false;
  return true;
}

export function loginKey(req: Request) {
  return crypto.createHash('sha256').update(requestIp(req) + '\n' + requestUserAgent(req)).digest('hex');
}

export function clientKeyHash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
