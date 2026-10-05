export const dynamic = 'force-static';

export function GET() {
  return Response.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    branch: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
    deployedAt: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'public, max-age=60, must-revalidate',
    },
  });
}
