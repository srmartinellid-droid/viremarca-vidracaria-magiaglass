import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(
      { authenticated: await isAdmin() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[admin-me]', error);
    return NextResponse.json(
      { authenticated: false, error: 'Falha ao validar a sessão administrativa.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
