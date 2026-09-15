/* ============================================
   MAGIA GLASS - Default Data & Persistence
   Server-backed persistence via Turso/libSQL
   ============================================ */

const STORAGE_KEYS = { services:'mg_services', gallery:'mg_gallery', settings:'mg_settings', home:'mg_home', password:'mg_admin_pass', auth:'mg_auth' };
const CONTENT_KEY_MAP = { mg_services:'services', mg_gallery:'gallery', mg_settings:'settings', mg_home:'home' };
function contentKey(key){ return CONTENT_KEY_MAP[key] || key; }

const DEFAULT_HOME = { badge:'Especialistas em vidros no Norte da Ilha', title:'Transformamos ambientes com <span>vidros sob medida</span>', description:'Box, sacadas, espelhos e projetos personalizados com acabamento impecável. Atendimento premium em Florianópolis e região.', stats:[{value:'10+',label:'Anos de experiência'},{value:'500+',label:'Projetos entregues'},{value:'100%',label:'Clientes satisfeitos'}] };
const DEFAULT_SERVICES = [
  {id:'box',title:'Box de Banheiro',description:'Box em vidro temperado com design moderno, segurança e fácil limpeza. Modelos flex, de correr e fixos sob medida.',icon:'🚿',category:'Banheiro',featured:true,order:1,image:''},
  {id:'sacadas',title:'Envidraçamento de Sacadas',description:'Sistemas Euro Glass e similares. Proteção contra vento, chuva e ruído mantendo a vista livre e valorizando o imóvel.',icon:'🏙️',category:'Externo',featured:true,order:2,image:''},
  {id:'espelhos',title:'Espelhos sob Medida',description:'Espelhos de parede inteira, com LED, bisotê ou lapidado. Ideal para academias, closets, salas e banheiros.',icon:'🪞',category:'Decoração',featured:true,order:3,image:''},
  {id:'cristaleira',title:'Cristaleiras e Móveis',description:'Cristaleiras de vidro sob medida que transformam o ambiente, organizam com elegância e trazem sofisticação.',icon:'🥂',category:'Decoração',featured:true,order:4,image:''},
  {id:'guarda-corpo',title:'Guarda-Corpo e Corrimão',description:'Segurança e sofisticação para escadas, varandas e áreas externas. Vidro temperado com instalação certificada.',icon:'🛡️',category:'Segurança',featured:false,order:5,image:''},
  {id:'pelicula',title:'Películas e Manutenção',description:'Aplicação de película Silver Black, vedação com silicone e manutenção completa de vidros e esquadrias.',icon:'🔧',category:'Manutenção',featured:false,order:6,image:''}
];
const DEFAULT_GALLERY = [
  {id:'g1',title:'Cristaleira sob medida',description:'Transforma o ambiente com elegância e organização.',category:'Decoração',image:'',images:[],date:'2025-11-10',featured:true},{id:'g2',title:'Espelhos para academia',description:'Parede inteira com instalação segura e acabamento impecável.',category:'Espelhos',image:'',images:[],date:'2025-10-22',featured:true},{id:'g3',title:'Box Flex instalado',description:'Design moderno e funcional para banheiros.',category:'Box',image:'',images:[],date:'2025-09-15',featured:true},{id:'g4',title:'Sacada Euro Glass',description:'Proteção total com vista livre.',category:'Sacadas',image:'',images:[],date:'2025-08-30',featured:false},{id:'g5',title:'Película Silver Black',description:'Obra entregue com qualidade e vedação perfeita.',category:'Manutenção',image:'',images:[],date:'2025-07-18',featured:false},{id:'g6',title:'Projeto Blumenau',description:'Obra concluída e cliente satisfeito.',category:'Projetos',image:'',images:[],date:'2025-06-05',featured:false}
];
const DEFAULT_SETTINGS = {phone:'48992220593',whatsapp:'5548992220593',instagram:'magiaglass_',email:'contato@magiaglass.com.br',address:'Norte da Ilha – Florianópolis / SC (Vargem Grande, Canasvieiras, Jurerê e região)',hours:'Seg a Sáb: 08h às 18h',logo:'',heroImage:'',heroImages:[],gradientOpacity:72,divider1:'',divider2:'',divider3:'',divider1Title:'Vidro que transforma',divider2Title:'Qualidade que se vê',divider3Title:'Acabamento impecável',divider1Text:'Projetos sob medida com instalação profissional no Norte da Ilha.',divider2Text:'Box, sacadas e espelhos com padrão premium.',divider3Text:'Cada detalhe pensado para valorizar o seu ambiente.'};
const DEFAULT_COPIES = {google:[{title:'Box de Vidro Temperado – Florianópolis Norte da Ilha',text:'Box sob medida com instalação limpa e acabamento impecável | Magia Glass. Atendimento em Canasvieiras, Jurerê e Vargem Grande. Orçamento rápido no WhatsApp!'},{title:'Envidraçamento de Sacadas – Euro Glass Floripa',text:'Proteja sua sacada do vento e chuva sem perder a vista. Sistemas de alta qualidade com instalação profissional no Norte da Ilha. Peça seu orçamento!'}],instagram:[{title:'Cristaleira de Vidro sob Medida',text:'✨ Uma cristaleira de vidro não é apenas um móvel: ela transforma o ambiente, valoriza sua decoração e ainda organiza suas taças com elegância.\n\nO vidro traz leveza, sofisticação e amplitude visual.\n\n👉 Já imaginou ter uma cristaleira feita exatamente para o seu estilo?\nFale conosco no WhatsApp e peça seu orçamento personalizado!\n\n📲 @magiaglass_ | Especialistas em espelhos e vidros no Norte da Ilha'},{title:'Espelhos para Academia / Estúdio',text:'Já pensou sua academia ou estúdio com espelhos sob medida como esse?\n\nAlém de ampliar o espaço, eles trazem mais estilo, iluminação e motivam os treinos.\n\nTrabalhamos com espelhos de parede inteira, instalados com segurança e acabamento impecável.\n\nChama no WhatsApp 📲 (48) 99222-0593'},{title:'Box Flex + Sacada',text:'Instalação box flex ✨\nSacada Euro Glass 🪄\n\nFaça seu orçamento ✍️\n📳 (48) 99222-0593'}],facebook:[{title:'Manutenção e Película',text:'Obra entregue com qualidade ✨\nPelícula Silver Black ✅\nManutenção e vedação de vidros ✅\n\nCliente satisfeito 🙌\nChama 🔥\n📳 (48) 99222-0593'}]};

let _serverData = {};
function xhr(method,url,body){const x=new XMLHttpRequest();x.open(method,url,false);x.withCredentials=true;x.setRequestHeader('Content-Type','application/json');if(method==='GET'){x.setRequestHeader('Cache-Control','no-cache');x.setRequestHeader('Pragma','no-cache');}try{x.send(body===undefined?null:JSON.stringify(body));}catch(e){return null;}return x;}
function getData(key,defaultValue){const k=contentKey(key);return Object.prototype.hasOwnProperty.call(_serverData,k)?_serverData[k]:defaultValue;}
function setData(key,value){
  const k=contentKey(key);
  let requestBody;
  try{requestBody={key:k,value};const bytes=new TextEncoder().encode(JSON.stringify(requestBody)).byteLength;if(bytes>3000000){alert('Os dados são grandes demais para salvar. Reduza a quantidade ou o tamanho das imagens.');return false;}}catch(e){alert('Não foi possível preparar os dados para salvar.');return false;}
  const x=xhr('POST','/api/content',requestBody);
  if(x&&x.status>=200&&x.status<300){_serverData[k]=value;if(k==='settings'){applyAdminBranding();}return true;}
  let message='Não foi possível salvar os dados.';
  if(!x)message='Não foi possível conectar ao servidor.';else if(x.status===401)message='Sua sessão administrativa expirou. Faça login novamente.';else if(x.status===413)message='Os dados são grandes demais para serem salvos. Reduza a quantidade/tamanho das imagens.';else{try{const payload=JSON.parse(x.responseText||'{}');if(payload.error)message=payload.error;}catch(e){}}
  alert(message);return false;
}
function initData(){const x=xhr('GET','/api/content?_=' + Date.now());if(x&&x.status===200){try{_serverData=JSON.parse(x.responseText);}catch(e){}}return _serverData;}
function isAuthenticated(){const x=xhr('GET','/api/auth/me');try{return !!(x&&x.status===200&&JSON.parse(x.responseText).authenticated);}catch(e){return false;}}
function login(password){const x=xhr('POST','/api/auth/login',{password});if(x&&x.status>=200&&x.status<300){window.__MG_LOGIN_ERROR='';return true;}try{const payload=x?JSON.parse(x.responseText):null;window.__MG_LOGIN_ERROR=payload&&payload.error?payload.error:'Não foi possível autenticar.';}catch(e){window.__MG_LOGIN_ERROR='Não foi possível conectar ao servidor.';}return false;}
function logout(){xhr('POST','/api/auth/logout');}
function changePassword(oldPass,newPass){const x=xhr('POST','/api/auth/password',{oldPassword:oldPass,newPassword:newPass});return !!(x&&x.status>=200&&x.status<300);}

function injectRuntimeUIRules(){
  if(typeof document==='undefined' || document.getElementById('mg-runtime-ui-rules')) return;
  const style=document.createElement('style');
  style.id='mg-runtime-ui-rules';
  style.textContent=`
    html.mg-site-loading { background:#fff; }
    html.mg-site-loading body { visibility:hidden !important; }
    body:not(:has(.hero)) .section:first-of-type { padding-top:calc(var(--space-3xl, 3rem) + 104px) !important; }
    .hero-badge { display:none !important; }
    .admin-sidebar .logo img[src*="logo-insta"], .footer-brand img[src*="logo-insta"] { visibility:hidden !important; }
    .admin-sidebar .logo { min-height:64px; display:flex; align-items:center; justify-content:flex-start; overflow:hidden; }
    .admin-sidebar .admin-brand-logo { display:flex; align-items:center; justify-content:flex-start; width:100%; min-height:64px; }
    .admin-sidebar .admin-brand-logo img { display:block; width:auto; max-width:220px; height:56px; max-height:56px; object-fit:contain; object-position:left center; }
    .footer-brand .footer-brand-logo { display:block; width:auto; max-width:240px; height:64px; max-height:64px; object-fit:contain; object-position:left center; margin-bottom:1rem; }
    .admin-sidebar .admin-brand-logo .logo-wordmark { transform:scale(.72); transform-origin:left center; }
  `;
  document.head.appendChild(style);
}
function isPublicSite(){return typeof window!=='undefined' && !window.location.pathname.includes('/admin/');}
function markSiteReady(){if(typeof document==='undefined') return;document.documentElement.classList.remove('mg-site-loading');document.documentElement.classList.add('mg-site-ready');}
function renderAdminBrandLogo(root,settings){
  root.innerHTML='';
  const wrap=document.createElement('span');wrap.className='admin-brand-logo';
  if(settings.logo){
    const img=document.createElement('img');img.src=settings.logo;img.alt='Logo';img.className='admin-brand-image';wrap.appendChild(img);
  }else{
    const word=document.createElement('div');word.className='logo-wordmark';word.innerHTML='<div class="logo-name"><span class="magia">MAGIA</span><span class="glass">GLASS</span></div><div class="logo-tag">Vidraçaria</div>';wrap.appendChild(word);
  }
  root.appendChild(wrap);
}
function applyAdminBranding(){
  if(typeof document==='undefined' || !document.querySelector('.admin-sidebar')) return;
  const settings=getData(STORAGE_KEYS.settings,DEFAULT_SETTINGS);
  document.querySelectorAll('.admin-sidebar .logo').forEach(logo=>{
    logo.setAttribute('data-logo-authority','settings.logo');
    renderAdminBrandLogo(logo,settings);
  });
}

if(typeof window!=='undefined'){
  const fontLink=document.createElement('link');fontLink.rel='stylesheet';fontLink.href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';document.head.appendChild(fontLink);
  injectRuntimeUIRules();
  if(isPublicSite()){document.documentElement.classList.add('mg-site-loading');}
  initData();
  applyAdminBranding();
  if(isPublicSite()){window.setTimeout(markSiteReady,5000);}
}
