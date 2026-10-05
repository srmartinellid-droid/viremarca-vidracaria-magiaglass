import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const source = await readFile(path.join(process.cwd(), 'public/assets/images/logo-insta.jpeg'));
    const png = await sharp(source)
      .resize(48, 48, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer();
    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}
