/* ============================================
   MAGIA GLASS - Default Data & Persistence
   Server-backed persistence via Turso/libSQL
   ============================================ */

const STORAGE_KEYS = {
  services: 'mg_services',
  gallery: 'mg_gallery',
  settings: 'mg_settings',
  home: 'mg_home',
  password: 'mg_admin_pass',
  auth: 'mg_auth'
};

const DEFAULT_HOME = {
  badge: 'Especialistas em vidros no Norte da Ilha',
  title: 'Transformamos ambientes com <span>vidros sob medida</span>',
  description: 'Box, sacadas, espelhos e projetos personalizados com acabamento impecável. Atendimento premium em Florianópolis e região.',
  stats: [
    { value: '10+', label: 'Anos de experiência' },
    { value: '500+', label: 'Projetos entregues' },
    { value: '100%', label: 'Clientes satisfeitos' }
  ]
};

const DEFAULT_SERVICES = [
  { id:'box', title:'Box de Banheiro', description:'Box em vidro temperado com design moderno, segurança e fácil limpeza. Modelos flex, de correr e fixos sob medida.', icon:'🚿', category:'Banheiro', featured:true, order:1, image:'' },
  { id:'sacadas', title:'Envidraçamento de Sacadas', description:'Sistemas Euro Glass e similares. Proteção contra vento, chuva e ruído mantendo a vista livre e valorizando o imóvel.', icon:'🏙️', category:'Externo', featured:true, order:2, image:'' },
  { id:'espelhos', title:'Espelhos sob Medida', description:'Espelhos de parede inteira, com LED, bisotê ou lapidado. Ideal para academias, closets, salas e banheiros.', icon:'🪞', category:'Decoração', featured:true, order:3, image:'' },
  { id:'cristaleira', title:'Cristaleiras e Móveis', description:'Cristaleiras de vidro sob medida que transformam o ambiente, organizam com elegância e trazem sofisticação.', icon:'🥂', category:'Decoração', featured:true, order:4, image:'' },
  { id:'guarda-corpo', title:'Guarda-Corpo e Corrimão', description:'Segurança e sofisticação para escadas, varandas e áreas externas. Vidro temperado com instalação certificada.', icon:'🛡️', category:'Segurança', featured:false, order:5, image:'' },
  { id:'pelicula', title:'Películas e Manutenção', description:'Aplicação de película Silver Black, vedação com silicone e manutenção completa de vidros e esquadrias.', icon:'🔧', category:'Manutenção', featured:false, order:6, image:'' }
];

const DEFAULT_GALLERY = [
  { id:'g1', title:'Cristaleira sob medida', description:'Transforma o ambiente com elegância e organização.', category:'Decoração', image:'', images:[], date:'2025-11-10', featured:true },
  { id:'g2', title:'Espelhos para academia', description:'Parede inteira com instalação segura e acabamento impecável.', category:'Espelhos', image:'', images:[], date:'2025-10-22', featured:true },
  { id:'g3', title:'Box Flex instalado', description:'Design moderno e funcional para banheiros.', category:'Box', image:'', images:[], date:'2025-09-15', featured:true },
  { id:'g4', title:'Sacada Euro Glass', description:'Proteção total com vista livre.', category:'Sacadas', image:'', images:[], date:'2025-08-30', featured:false },
  { id:'g5', title:'Película Silver Black', description:'Obra entregue com qualidade e vedação perfeita.', category:'Manutenção', image:'', images:[], date:'2025-07-18', featured:false },
  { id:'g6', title:'Projeto Blumenau', description:'Obra concluída e cliente satisfeito.', category:'Projetos', image:'', images:[], date:'2025-06-05', featured:false }
];

const DEFAULT_SETTINGS = {
  phone:'48992220593', whatsapp:'5548992220593', instagram:'magiaglass_', email:'contato@magiaglass.com.br',
  address:'Norte da Ilha – Florianópolis / SC (Vargem Grande, Canasvieiras, Jurerê e região)', hours:'Seg a Sáb: 08h às 18h',
  logo:'', heroImage:'', heroImages:[], gradientOpacity:72, divider1:'', divider2:'', divider3:'',
  divider1Title:'Vidro que transforma', divider2Title:'Qualidade que se vê', divider3Title:'Acabamento impecável',
  divider1Text:'Projetos sob medida com instalação profissional no Norte da Ilha.', divider2Text:'Box, sacadas e espelhos com padrão premium.', divider3Text:'Cada detalhe pensado para valorizar o seu ambiente.'
};

const DEFAULT_COPIES = {
  google: [
    { title:'Box de Vidro Temperado – Florianópolis Norte da Ilha', text:'Box sob medida com instalação limpa e acabamento impecável | Magia Glass. Atendimento em Canasvieiras, Jurerê e Vargem Grande. Orçamento rápido no WhatsApp!' },
    { title:'Envidraçamento de Sacadas – Euro Glass Floripa', text:'Proteja sua sacada do vento e chuva sem perder a vista. Sistemas de alta qualidade com instalação profissional no Norte da Ilha. Peça seu orçamento!' }
  ],
  instagram: [
    { title:'Cristaleira de Vidro sob Medida', text:'✨ Uma cristaleira de vidro não é apenas um móvel: ela transforma o ambiente, valoriza sua decoração e ainda organiza suas taças com elegância.\n\nO vidro traz leveza, sofisticação e amplitude visual.\n\n👉 Já imaginou ter uma cristaleira feita exatamente para o seu estilo?\nFale conosco no WhatsApp e peça seu orçamento personalizado!\n\n📲 @magiaglass_ | Especialistas em espelhos e vidros no Norte da Ilha' },
    { title:'Espelhos para Academia / Estúdio', text:'Já pensou sua academia ou estúdio com espelhos sob medida como esse?\n\nAlém de ampliar o espaço, eles trazem mais estilo, iluminação e motivam os treinos.\n\nTrabalhamos com espelhos de parede inteira, instalados com segurança e acabamento impecável.\n\nChama no WhatsApp 📲 (48) 99222-0593' },
    { title:'Box Flex + Sacada', text:'Instalação box flex ✨\nSacada Euro Glass 🪄\n\nFaça seu orçamento ✍️\n📳 (48) 99222-0593' }
  ],
  facebook: [ { title:'Manutenção e Película', text:'Obra entregue com qualidade ✨\nPelícula Silver Black ✅\nManutenção e vedação de vidros ✅\n\nCliente satisfeito 🙌\nChama 🔥\n📳 (48) 99222-0593' } ]
};

let _serverData = {};

function xhr(method, url, body) {
  const x = new XMLHttpRequest();
  x.open(method, url, false);
  x.setRequestHeader('Content-Type', 'application/json');
  try { x.send(body === undefined ? null : JSON.stringify(body)); } catch (e) { return null; }
  return x;
}

function getData(key, defaultValue) {
  return Object.prototype.hasOwnProperty.call(_serverData, key) ? _serverData[key] : defaultValue;
}

function setData(key, value) {
  const x = xhr('POST', '/api/content', { key, value });
  if (x && x.status >= 200 && x.status < 300) { _serverData[key] = value; return true; }
  alert('Não foi possível salvar. Verifique a sessão administrativa.');
  return false;
}

function initData() {
  const x = xhr('GET', '/api/content');
  if (x && x.status === 200) { try { _serverData = JSON.parse(x.responseText); } catch (e) {} }
  return _serverData;
}

function isAuthenticated() {
  const x = xhr('GET', '/api/auth/me');
  try { return !!(x && x.status === 200 && JSON.parse(x.responseText).authenticated); } catch (e) { return false; }
}

function login(password) {
  const x = xhr('POST', '/api/auth/login', { password });
  if (x && x.status >= 200 && x.status < 300) {
    window.__MG_LOGIN_ERROR = '';
    return true;
  }
  try {
    const payload = x ? JSON.parse(x.responseText) : null;
    window.__MG_LOGIN_ERROR = payload && payload.error ? payload.error : 'Não foi possível autenticar.';
  } catch (e) {
    window.__MG_LOGIN_ERROR = 'Não foi possível conectar ao servidor.';
  }
  return false;
}

function logout() { xhr('POST', '/api/auth/logout'); }

function changePassword(oldPass, newPass) {
  const x = xhr('POST', '/api/auth/password', { oldPassword: oldPass, newPassword: newPass });
  return !!(x && x.status >= 200 && x.status < 300);
}

if (typeof window !== 'undefined') initData();
