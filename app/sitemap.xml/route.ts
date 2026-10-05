export const dynamic = 'force-static';

export function GET() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://viremarca-vidracaria-magiaglass.vercel.app').replace(/\/$/, '');
  const urls = ['/', '/servicos', '/galeria', '/contato'];
  const body = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    urls.map(path => '<url><loc>' + base + path + '</loc></url>').join('') +
    '</urlset>';
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
