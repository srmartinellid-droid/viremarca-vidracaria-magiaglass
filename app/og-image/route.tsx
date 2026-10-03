import { ImageResponse } from 'next/og';

export const runtime = 'edge';
const size = { width: 1200, height: 630 };

async function readLocalLogo() {
  const response = await fetch(new URL('../../assets/images/logo-profile.png', import.meta.url));
  if (!response.ok) throw new Error('Não foi possível carregar o logo local.');
  const bytes = await response.arrayBuffer();
  return `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`;
}

export async function GET() {
  const logo = await readLocalLogo();
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7FAFC', color: '#0F2744', fontFamily: 'sans-serif' }}>
      <div style={{ width: 630, height: 630, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={logo} alt="Magia Glass" style={{ maxWidth: 520, maxHeight: 360, objectFit: 'contain' }} />
      </div>
      <div style={{ width: 430, display: 'flex', flexDirection: 'column', gap: 18, paddingRight: 70 }}>
        <div style={{ fontSize: 42, fontWeight: 700 }}>Vidros sob medida</div>
        <div style={{ fontSize: 24, color: '#475569' }}>Magia Glass · Norte da Ilha · Florianópolis/SC</div>
      </div>
    </div>,
    size
  );
}
