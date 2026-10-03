import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

function csv(value: unknown) {
  const s=String(value ?? '');
  return '"' + s.replace(/"/g,'""').replace(/\r?\n/g,' ') + '"';
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({error:'Não autorizado'},{status:401});
  await ensureSchema();
  const rows=await db.execute('SELECT id,nome,whatsapp,servico,mensagem,origem,status,nota,created_at FROM leads ORDER BY created_at DESC');
  const header=['id','nome','whatsapp','servico','mensagem','origem','status','nota','created_at'].join(',');
  const body=[header,...rows.rows.map(r=>[r.id,r.nome,r.whatsapp,r.servico,r.mensagem,r.origem,r.status,r.nota,r.created_at].map(csv).join(','))].join('\n');
  return new Response('\ufeff'+body,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="magia-glass-leads.csv"','Cache-Control':'no-store'}});
}
