const ICO = Uint8Array.from(atob('AAABAAEAAQEAAAAAAAAwAAAAFgAAACgAAAABAAAAAgAAAAEAIAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='), c => c.charCodeAt(0));

export function GET() {
  return new Response(ICO, {
    headers: { 'Content-Type': 'image/x-icon', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
