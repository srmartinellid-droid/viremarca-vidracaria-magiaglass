export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const response = await fetch(new URL('/assets/images/logo-insta.jpeg', request.url));
  if (!response.ok) return new Response('Not Found', { status: 404 });
  return new Response(await response.arrayBuffer(), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
