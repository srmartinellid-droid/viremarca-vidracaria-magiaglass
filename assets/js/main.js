/* ============================================
   MAGIA GLASS - Main Frontend Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initWhatsApp();
  applySiteLogo();
  renderHomeIfNeeded();
  renderServicesIfNeeded();
  renderGalleryIfNeeded();
  initContactForm();
  initHeroCarousel();
  if (typeof markSiteReady === 'function') markSiteReady();
});

function initNav() {
  const toggle = document.querySelector('.menu-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });
    links.addEventListener('click', event => {
      if (event.target.closest('a')) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menu');
      }
    });
  }
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && (href.includes(path) || (path === '' && href.includes('index')))) {
      a.classList.add('active');
    }
  });

  const header = document.querySelector('.header');
  if (!header) return;
  const hasHero = !!document.querySelector('.hero');

  function updateHeader() {
    if (!hasHero) {
      header.classList.add('is-solid');
      header.classList.remove('is-transparent');
      return;
    }
    if (window.scrollY > 40) {
      header.classList.add('scrolled', 'is-solid');
      header.classList.remove('is-transparent');
    } else {
      header.classList.remove('scrolled', 'is-solid');
      header.classList.add('is-transparent');
    }
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

function normalizeWhatsAppNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '5548992220593';
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return '55' + digits;
  return digits;
}

function buildWhatsAppUrl(phone, text) {
  const normalized = normalizeWhatsAppNumber(phone);
  return '/whatsapp?phone=' + normalized + '&text=' + encodeURIComponent(text || 'Olá! Gostaria de um orçamento.');
}

function normalizeWhatsAppLinks(phone) {
  const normalized = normalizeWhatsAppNumber(phone);
  document.querySelectorAll('a[href*="/whatsapp?"]').forEach(link => {
    try {
      const url = new URL(link.href, window.location.origin);
      url.searchParams.set('phone', normalized);
      const text = url.searchParams.get('text');
      if (text) url.search = '?text=' + encodeURIComponent(text);
      link.href = url.toString();
    } catch (_) {}
  });
}

function trackEvent(name, data) {
  if (typeof window !== 'undefined' && typeof window.va === 'function') {
    try { window.va('event', name, data || {}); } catch (_) {}
  }
}

function initWhatsApp() {
  const settings = getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const btn = document.querySelector('.whatsapp-float');
  if (btn) {
    btn.href = buildWhatsAppUrl(settings.whatsapp, 'Olá! Vim pelo site da Magia Glass e gostaria de um orçamento.');
    btn.target = '_blank';
    btn.rel = 'noopener';
  }
  document.querySelectorAll('a[href*="/whatsapp?"]').forEach(el => {
    if (!el.dataset.mgTracked) {
      el.dataset.mgTracked = '1';
      el.addEventListener('click', () => trackEvent('whatsapp_click', { location: el.className || 'link' }));
    }
  });
  document.querySelectorAll('[data-whatsapp]').forEach(el => {
    el.href = buildWhatsAppUrl(settings.whatsapp, el.dataset.whatsapp || 'Olá! Gostaria de um orçamento.');
  });
  normalizeWhatsAppLinks(settings.whatsapp);
}

function renderHomeIfNeeded() {
  const home = getData(STORAGE_KEYS.home, DEFAULT_HOME);
  const badge = document.querySelector('[data-home="badge"]');
  if (badge) badge.remove();
  const title = document.querySelector('[data-home="title"]');
  const desc = document.querySelector('[data-home="description"]');
  if (title) title.innerHTML = home.title;
  if (desc) desc.textContent = home.description;

  const statsContainer = document.querySelector('[data-home="stats"]');
  if (statsContainer && home.stats) {
    statsContainer.innerHTML = home.stats.map(s => `
      <div class="stat">
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `).join('');
  }

  const servicesContainer = document.querySelector('[data-home="services"]');
  if (servicesContainer) {
    const wa = normalizeWhatsAppNumber(getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS).whatsapp);
    const services = getData(STORAGE_KEYS.services, DEFAULT_SERVICES)
      .filter(s => s.featured)
      .sort((a, b) => a.order - b.order)
      .slice(0, 6);
    servicesContainer.innerHTML = services.map(s => serviceCardHTML(s, wa, true)).join('');
  }
}

function serviceIcon(id) {
  const paths = {
    box: '<path d="M4 4h16v16H4z"/><path d="M8 4v16M16 4v16M4 10h16"/>',
    sacadas: '<path d="M4 20h16M6 20V7h12v13M9 7V4h6v3M10 11h4M10 15h4"/>',
    espelhos: '<circle cx="12" cy="12" r="8"/><path d="M8 15c2-2 4-2 8-6"/>',
    cristaleira: '<path d="M5 4h14v16H5z"/><path d="M5 10h14M12 4v16M8 7h1M15 7h1"/>',
    'guarda-corpo': '<path d="M5 20V7M19 20V7M5 10h14M8 20V10M12 20V10M16 20V10"/><path d="M3 20h18"/>',
    pelicula: '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>'
  };
  const body = paths[id] || paths.box;
  return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="service-icon-svg">' + body + '</svg>';
}

function serviceCardHTML(s, wa, compact) {
  const cover = s.image
    ? `<img class="service-cover" src="${s.image}" alt="${s.title}" loading="lazy">`
    : `<div class="service-cover-placeholder">${serviceIcon(s.id)}</div>`;
  return `
    <div class="service-card">
      ${cover}
      <div class="service-body">
        <div class="service-icon" aria-hidden="true">${serviceIcon(s.id)}</div>
        <h3>${s.title}</h3>
        <p>${s.description}</p>
        <a href="/whatsapp?phone=${wa}&text=${encodeURIComponent('Olá! Quero orçamento de: ' + s.title)}"
           class="btn btn-primary ${compact ? 'btn-sm' : ''}" target="_blank" rel="noopener">${compact ? 'Solicitar Orçamento' : 'Pedir Orçamento'}</a>
      </div>
    </div>
  `;
}

function renderServicesIfNeeded() {
  const container = document.querySelector('[data-services="list"]');
  if (!container) return;
  const wa = getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS).whatsapp;
  const services = getData(STORAGE_KEYS.services, DEFAULT_SERVICES)
    .sort((a, b) => a.order - b.order);
  container.innerHTML = '<div class="services-grid">' +
    services.map(s => serviceCardHTML(s, wa, false)).join('') +
    '</div>';
}

function getItemImages(item) {
  if (item.images && item.images.length) return item.images.slice();
  if (item.image) return [item.image];
  return [];
}

function renderGalleryIfNeeded() {
  const container = document.querySelector('[data-gallery="grid"]');
  if (!container) return;
  const settings = getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const wa = normalizeWhatsAppNumber(settings.whatsapp);
  const items = getData(STORAGE_KEYS.gallery, DEFAULT_GALLERY)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const pathPrefix = window.location.pathname.includes('/pages/') ? '../' : '';
  const fallback = settings.logo || (pathPrefix + 'assets/images/logo-insta.jpeg');

  window._galleryAlbums = items.map(item => {
    const imgs = getItemImages(item);
    if (!imgs.length) imgs.push(fallback);
    return {
      title: item.title,
      description: item.description || '',
      category: item.category || '',
      images: imgs.map(src => src || fallback)
    };
  });

  container.innerHTML = items.map((item, albumIdx) => {
    const imgs = getItemImages(item);
    const cover = imgs[0] || fallback;
    const count = imgs.length || 1;
    return `
      <article class="gallery-item" onclick="openAlbum(${albumIdx})" role="button" tabindex="0">
        <div class="gallery-item-media">
          <img src="${cover}" alt="${item.title}" loading="lazy" onerror="this.src='${fallback}'">
          ${count > 1 ? '<span class="gallery-item-count">' + count + ' fotos</span>' : ''}
          <div class="gallery-item-caption"><h4>${item.title}</h4></div>
        </div>
      </article>
    `;
  }).join('');
}

let _albumIdx = 0;
let _photoIdx = 0;

function openAlbum(albumIdx, photoIdx) {
  _lightboxPreviousFocus = document.activeElement;
  const albums = window._galleryAlbums || [];
  if (!albums.length) return;
  _albumIdx = albumIdx;
  _photoIdx = photoIdx || 0;
  showAlbumPhoto();
}

function showAlbumPhoto() {
  const albums = window._galleryAlbums || [];
  const album = albums[_albumIdx];
  if (!album) return;
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const imgs = album.images;
  if (_photoIdx < 0) _photoIdx = imgs.length - 1;
  if (_photoIdx >= imgs.length) _photoIdx = 0;
  const src = imgs[_photoIdx];
  const pathPrefix = window.location.pathname.includes('/pages/') ? '../' : '';
  let finalSrc = src;
  if (src && !src.startsWith('data:') && !src.startsWith('http') && !src.startsWith('../') && !src.startsWith('assets/')) {
    finalSrc = pathPrefix + src;
  } else if (src && src.startsWith('assets/') && pathPrefix) {
    finalSrc = pathPrefix + src;
  }
  const image = document.getElementById('lightbox-img');
  image.src = finalSrc || pathPrefix + 'assets/images/logo-insta.jpeg';
  image.alt = album.title || 'Imagem da obra';
  image.width = 1200;
  image.height = 900;
  const cap = document.getElementById('lightbox-caption');
  if (cap) {
    cap.innerHTML = '<strong>' + album.title + '</strong>' +
      (album.description ? '<span>' + album.description + '</span>' : '') +
      (album.category ? '<span style="margin-top:0.35rem;opacity:0.7;font-size:0.8rem;">' + album.category + '</span>' : '');
  }
  const counter = document.getElementById('lightbox-counter');
  if (counter) counter.textContent = (imgs.length > 1) ? ((_photoIdx + 1) + ' / ' + imgs.length) : '';
  lb.setAttribute('aria-hidden', 'false');
  lb.classList.add('open');
  const close = lb.querySelector('.lightbox-close');
  if (close) close.focus();
}

let _lightboxPreviousFocus = null;

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  if (_lightboxPreviousFocus && typeof _lightboxPreviousFocus.focus === 'function') _lightboxPreviousFocus.focus();
}

document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Tab') {
    const focusable = Array.from(lb.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')).filter(el => !el.disabled);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

function lightboxNext() {
  const albums = window._galleryAlbums || [];
  const album = albums[_albumIdx];
  if (!album) return;
  _photoIdx++;
  showAlbumPhoto();
}
function lightboxPrev() {
  const albums = window._galleryAlbums || [];
  const album = albums[_albumIdx];
  if (!album) return;
  _photoIdx--;
  showAlbumPhoto();
}
function openLightbox(idx) { openAlbum(0, idx); }

document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') lightboxNext();
  if (e.key === 'ArrowLeft') lightboxPrev();
});

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form || form.dataset.leadBound === '1') return;
  form.dataset.leadBound = '1';
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.querySelector('[name="name"]').value.trim();
    const phone = form.querySelector('[name="phone"]').value.trim();
    const service = form.querySelector('[name="service"]').value;
    const message = form.querySelector('[name="message"]').value.trim();
    const website = form.querySelector('[name="website"]')?.value || '';
    const settings = getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    const text = `Olá! Meu nome é ${name}.\nTelefone: ${phone}\nServiço de interesse: ${service}\nMensagem: ${message}`;
    const fallback = buildWhatsAppUrl(settings.whatsapp, text);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome:name, whatsapp:phone, servico:service, mensagem:message, origem:'site-contato', website })
      });
      const payload = await response.json().catch(() => ({}));
      window.open(payload.whatsappUrl || fallback, '_blank', 'noopener');
      if (response.ok) {
        form.reset();
        alert('Contato registrado. Abrindo o WhatsApp...');
      } else {
        alert('Abrindo o WhatsApp. O registro automático do contato não pôde ser concluído.');
      }
    } catch (_) {
      window.open(fallback, '_blank', 'noopener');
      alert('Abrindo o WhatsApp. O registro automático do contato não pôde ser concluído.');
    }
  });
}
function formatPhone(phone) {
  const p = phone.replace(/\D/g, '');
  if (p.length === 11) return `(${p.slice(0,2)}) ${p.slice(2,7)}-${p.slice(7)}`;
  return phone;
}

function applySiteFavicon(settings) {
  if (typeof document === 'undefined') return;
  const logo = settings && settings.logo ? String(settings.logo).trim() : '';
  if (!logo) return;

  let icons = document.querySelectorAll('link[rel~="icon"]');
  if (!icons.length) {
    const link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
    icons = [link];
  }

  icons.forEach(link => {
    link.href = logo;
    link.type = logo.startsWith('data:image/svg+xml') ? 'image/svg+xml' : (logo.startsWith('data:image/png') ? 'image/png' : (logo.startsWith('data:image/webp') ? 'image/webp' : (logo.startsWith('data:image/jpeg') || logo.startsWith('data:image/jpg') ? 'image/jpeg' : 'image/png')));
    link.removeAttribute('sizes');
  });
}

function applySiteLogo() {
  const settings = getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  
  document.querySelectorAll('[data-site-logo]').forEach(el => {
    if (settings.logo) {
      el.innerHTML = '<img src="' + settings.logo + '" alt="Logo" class="logo-img-upload">';
    } else {
      el.innerHTML = '<div class="logo-wordmark"><div class="logo-name"><span class="magia">MAGIA</span><span class="glass">GLASS</span></div><div class="logo-tag">Vidraçaria</div></div>';
    }
  });

  document.querySelectorAll('.footer-brand').forEach(brand => {
    const legacy = brand.querySelector('img[src*="logo-insta"]');
    if (legacy) {
      if (settings.logo) {
        legacy.src = settings.logo;
        legacy.className = 'footer-brand-logo';
        legacy.alt = 'Logo';
        legacy.removeAttribute('style');
      } else {
        legacy.replaceWith(document.createRange().createContextualFragment('<div class="logo-wordmark"><div class="logo-name"><span class="magia">MAGIA</span><span class="glass">GLASS</span></div><div class="logo-tag">Vidraçaria</div></div>'));
      }
    }
  });
}

function getHeroImages(settings) {
  if (settings.heroImages && settings.heroImages.length) return settings.heroImages.slice();
  if (settings.heroImage) return [settings.heroImage];
  return [];
}

function initHeroCarousel() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const settings = getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const images = getHeroImages(settings);
  const defaultImg = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80';
  const slides = images.length ? images : [defaultImg];

  let slidesWrap = hero.querySelector('.hero-slides');
  if (!slidesWrap) {
    slidesWrap = document.createElement('div');
    slidesWrap.className = 'hero-slides';
    hero.insertBefore(slidesWrap, hero.firstChild);
  }
  const oldBg = document.getElementById('hero-parallax');
  if (oldBg) oldBg.style.display = 'none';

  slidesWrap.innerHTML = slides.map((src, i) =>
    `<div class="hero-slide${i === 0 ? ' active' : ''}" style="background-image:url('${src}')"></div>`
  ).join('');

  let dots = hero.querySelector('.hero-dots');
  if (slides.length > 1) {
    if (!dots) {
      dots = document.createElement('div');
      dots.className = 'hero-dots';
      hero.appendChild(dots);
    }
    dots.innerHTML = slides.map((_, i) =>
      `<button type="button" class="${i === 0 ? 'active' : ''}" data-slide="${i}" aria-label="Slide ${i + 1}"></button>`
    ).join('');
    dots.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => goSlide(+btn.dataset.slide));
    });
  } else if (dots) {
    dots.remove();
  }

  let current = 0;
  function goSlide(n) {
    const els = slidesWrap.querySelectorAll('.hero-slide');
    if (!els.length) return;
    current = (n + els.length) % els.length;
    els.forEach((el, i) => el.classList.toggle('active', i === current));
    if (dots) {
      dots.querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === current));
    }
  }

  if (slides.length > 1) {
    setInterval(() => goSlide(current + 1), 5500);
  }

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    slidesWrap.querySelectorAll('.hero-slide').forEach(el => {
      el.style.transform = 'translateY(' + (y * 0.28) + 'px)';
    });
  }, { passive: true });
}
