import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { sameOrigin } from '@/lib/request-security';
import { processImage, uploadMedia, deleteMedia } from '@/lib/media';

export const runtime='nodejs';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ok:false,error:'Origem não permitida.'},{status:403});
  if (!(await isAdmin())) return NextResponse.json({ok:false,error:'Não autorizado'},{status:401});
  try {
    const form=await req.formData(), file=form.get('file'), purpose=String(form.get('purpose')||'gallery'), altText=String(form.get('altText')||'').trim().slice(0,180);
    if (!(file instanceof File)) return NextResponse.json({ok:false,error:'Arquivo ausente.'},{status:400});
    if (!['hero','service','gallery','logo'].includes(purpose)) return NextResponse.json({ok:false,error:'Finalidade inválida.'},{status:400});
    if (!altText) return NextResponse.json({ok:false,error:'Texto alternativo é obrigatório.'},{status:400});
    const {output}=await processImage(file,purpose as any), uploaded=await uploadMedia(output,purpose as any);
    await ensureSchema();
    try {
      await db.execute({sql:'INSERT INTO media(storage_key,url,purpose,alt_text,created_at) VALUES(?,?,?,?,?)',args:[uploaded.key,uploaded.url,purpose,altText,new Date().toISOString()]});
    } catch(error) {
      try { await deleteMedia(uploaded.url); } catch (_) {}
      throw error;
    }
    return NextResponse.json({ok:true,...uploaded,altText,size:output.byteLength},{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    console.error('[media-upload]',error);
    return NextResponse.json({ok:false,error:error instanceof Error?error.message:'Não foi possível processar a imagem.'},{status:400,headers:{'Cache-Control':'no-store'}});
  }
}

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ok:false,error:'Origem não permitida.'},{status:403});
  if (!(await isAdmin())) return NextResponse.json({ok:false,error:'Não autorizado'},{status:401});
  try {
    const body=await req.json().catch(()=>({})), url=String(body.url||'');
    if (!url.startsWith('https://')) return NextResponse.json({ok:false,error:'URL inválida.'},{status:400});
    await ensureSchema();
    const all=await db.execute('SELECT value FROM site_content');
    if (all.rows.some(row=>String(row.value).includes(url))) return NextResponse.json({ok:false,error:'A imagem ainda está em uso.'},{status:409});
    const row=await db.execute({sql:'SELECT id FROM media WHERE url=? LIMIT 1',args:[url]});
    if (!row.rows.length) return NextResponse.json({ok:false,error:'Imagem não encontrada.'},{status:404});
    await deleteMedia(url);
    await db.execute({sql:'DELETE FROM media WHERE url=?',args:[url]});
    return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    console.error('[media-delete]',error);
    return NextResponse.json({ok:false,error:error instanceof Error?error.message:'Não foi possível remover a imagem.'},{status:400});
  }
}
