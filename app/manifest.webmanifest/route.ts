export const dynamic = 'force-static';

export function GET() {
  return Response.json({
    name: 'Magia Glass',
    short_name: 'Magia Glass',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1E6A9E',
    lang: 'pt-BR',
    icons: [{ src: '/assets/favicon.svg?v=3', sizes: '64x64', type: 'image/svg+xml' }],
  }, {
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}
