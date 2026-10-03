import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { db, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { sameOrigin, requestIp } from '@/lib/request-security';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS = 5;
const MAX = { nome: 120, whatsapp: 40, servico: 120, mensagem: 2000, origem: 120 };

function clean(value: unknown, max: number) {
  return String(value ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}
function ipHash(req: Request) {
  return crypto.createHash('sha256').update(requestIp(req)).digest('hex');
}
function whatsappUrl(phone: string, text: string) {
  const digits = phone.replace(/\D/g, '');
  return 'https://wa.me/' + (digits || '5548992220593') + '?text=' + encodeURIComponent(text);
}

export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return NextResponse.json({ ok: false, error: 'Origem não permitida.' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    if (body.website) return NextResponse.json({ ok: true, whatsappUrl: whatsappUrl('5548992220593','Olá! Gostaria de um orçamento.') }, { status: 200 });
    const nome=clean(body.nome,MAX.nome), whatsapp=clean(body.whatsapp,MAX.whatsapp), servico=clean(body.servico,MAX.servico), mensagem=clean(body.mensagem,MAX.mensagem), origem=clean(body.origem || 'site',MAX.origem);
    if (!nome || !whatsapp || !servico) return NextResponse.json({ ok:false,error:'Preencha nome, WhatsApp e serviço.' }, { status:400 });
    await ensureSchema();
    const key=ipHash(req), now=Date.now();
    const row=await db.execute({sql:'SELECT attempts,window_start FROM lead_rate_limits WHERE ip_hash=? LIMIT 1',args:[key]});
    if (row.rows[0]) {
      const attempts=Number(row.rows[0].attempts), start=Number(row.rows[0].window_start);
      if (now-start < WINDOW_MS && attempts >= MAX_SUBMISSIONS) {
        return NextResponse.json({ok:false,error:'Limite temporário de envios atingido. Tente novamente mais tarde.'},{status:429,headers:{'Retry-After':String(Math.ceil((WINDOW_MS-(now-start))/1000))}});
      }
      if (now-start >= WINDOW_MS) await db.execute({sql:'DELETE FROM lead_rate_limits WHERE ip_hash=?',args:[key]});
    }
    await db.execute({sql:'INSERT INTO leads(nome,whatsapp,servico,mensagem,origem,status,nota,created_at) VALUES(?,?,?,?,?,?,?,?)',args:[nome,whatsapp,servico,mensagem,origem,'novo','',new Date().toISOString()]});
    await db.execute({sql:`INSERT INTO lead_rate_limits(ip_hash,attempts,window_start) VALUES(?,?,?)
      ON CONFLICT(ip_hash) DO UPDATE SET attempts=CASE WHEN ?-lead_rate_limits.window_start>=? THEN 1 ELSE lead_rate_limits.attempts+1 END,
      window_start=CASE WHEN ?-lead_rate_limits.window_start>=? THEN ? ELSE lead_rate_limits.window_start END`,args:[key,1,now,now,WINDOW_MS,now,WINDOW_MS,now]});
    return NextResponse.json({ok:true,whatsappUrl:whatsappUrl('5548992220593',`Olá! Meu nome é ${nome}.\nWhatsApp: ${whatsapp}\nServiço: ${servico}\nMensagem: ${mensagem}`)},{headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    console.error('[lead-create]',error);
    return NextResponse.json({ok:false,error:'Não foi possível registrar o contato.'},{status:500,headers:{'Cache-Control':'no-store'}});
  }
}

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({error:'Não autorizado'},{status:401});
  const url=new URL(req.url), page=Math.max(1,Number(url.searchParams.get('page')||1)), limit=Math.min(50,Math.max(1,Number(url.searchParams.get('limit')||20))), offset=(page-1)*limit;
  await ensureSchema();
  const rows=await db.execute({sql:'SELECT id,nome,whatsapp,servico,mensagem,origem,status,nota,created_at FROM leads ORDER BY created_at DESC LIMIT ? OFFSET ?',args:[limit,offset]});
  const count=await db.execute('SELECT COUNT(*) AS count FROM leads');
  return NextResponse.json({items:rows.rows,page,limit,total:Number(count.rows[0]?.count||0)},{headers:{'Cache-Control':'no-store'}});
}

export async function PATCH(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({error:'Origem não permitida.'},{status:403});
  if (!(await isAdmin())) return NextResponse.json({error:'Não autorizado'},{status:401});
  const body=await req.json().catch(()=>({})), id=Number(body.id), status=clean(body.status,30), nota=clean(body.nota,500);
  const allowed=['novo','contatado','orçamento','fechado','perdido'];
  if(!Number.isInteger(id)||id<1||!allowed.includes(status)) return NextResponse.json({error:'Dados inválidos.'},{status:400});
  await ensureSchema();
  await db.execute({sql:'UPDATE leads SET status=?,nota=? WHERE id=?',args:[status,nota,id]});
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}
