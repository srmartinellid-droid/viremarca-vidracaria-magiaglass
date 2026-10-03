export const dynamic = 'force-static';

export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://viremarca-vidracaria-magiaglass.vercel.app';
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api',
    'Disallow: /pages/ferramentas.html',
    'Sitemap: ' + base.replace(/\/$/, '') + '/sitemap.xml',
    '',
  ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
