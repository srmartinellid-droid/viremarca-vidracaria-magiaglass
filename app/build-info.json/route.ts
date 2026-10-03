import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    sha: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    branch: process.env.VERCEL_GIT_COMMIT_REF || 'local',
    builtAt: new Date().toISOString(),
    name: 'magia-glass-viremarca',
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
