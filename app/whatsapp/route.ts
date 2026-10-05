const DEFAULT_PHONE = '5548992220593';

export function GET(request: Request) {
  const url = new URL(request.url);
  const phone = (url.searchParams.get('phone') || DEFAULT_PHONE).replace(/\D/g, '');
  const text = url.searchParams.get('text') || 'Olá! Gostaria de um orçamento.';
  const destination = new URL('https://api.whatsapp.com/send');
  destination.searchParams.set('phone', phone);
  destination.searchParams.set('text', text);
  return Response.redirect(destination, 307);
}
