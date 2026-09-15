/* ============================================
   MAGIA GLASS - Main Frontend Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initData();
  initNav();
  initWhatsApp();
  applySiteLogo();
  renderHomeIfNeeded();
  renderServicesIfNeeded();
  renderGalleryIfNeeded();
  initContactForm();
  initHeroCarousel();
});

function initNav() {
  const toggle = document.querySelector('.menu-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
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

function initWhatsApp() {
  const settings = getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const btn = document.querySelector('.whatsapp-float');
  if (btn) {
    btn.href = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent('Olá! Vim pelo site da Magia Glass e gostaria de um orçamento.')}`;
    btn.target = '_blank';
    btn.rel = 'noopener';
  }
  document.querySelectorAll('[data-whatsapp]').forEach(el => {
    el.href = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(el.dataset.whatsapp || 'Olá! Gostaria de um orçamento.')}`;
  });
}

function renderHomeIfNeeded() {
  const home = getData(STORAGE_KEYS.home, DEFAULT_HOME);
  const badge = document.querySelector('[data-home="badge"]');
  const title = document.querySelector('[data-home="title"]');
  const desc = document.querySelector('[data-home="description"]');
  if (badge) badge.textContent = home.badge;
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
    const wa = getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS).whatsapp;
    const services = getData(STORAGE_KEYS.services, DEFAULT_SERVICES)
      .filter(s => s.featured)
      .sort((a, b) => a.order - b.order)
      .slice(0, 6);
    servicesContainer.innerHTML = services.map(s => serviceCardHTML(s, wa, true)).join('');
  }
}

function serviceCardHTML(s, wa, compact) {
  const cover = s.image
    ? `<img class="service-cover" src="${s.image}" alt="${s.title}" loading="lazy">`
    : `<div class="service-cover-placeholder">${s.icon || '✨'}</div>`;
  return `
    <div class="service-card">
      ${cover}
      <div class="service-body">
        <div class="service-icon">${s.icon || '✨'}</div>
        <h3>${s.title}</h3>
        <p>${s.description}</p>
        <a href="https://wa.me/${wa}?text=${encodeURIComponent('Olá! Quero orçamento de: ' + s.title)}"
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
  // Grade única 3 colunas — sem quebrar por categoria
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
  const items = getData(STORAGE_KEYS.gallery, DEFAULT_GALLERY)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const pathPrefix = window.location.pathname.includes('/pages/') ? '../' : '';
  const fallback = pathPrefix + 'assets/images/logo-insta.jpeg';

  // Álbuns por item (clique abre o álbum da publicação)
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
  document.getElementById('lightbox-img').src = finalSrc || pathPrefix + 'assets/images/logo-insta.jpeg';
  const cap = document.getElementById('lightbox-caption');
  if (cap) {
    cap.innerHTML = '<strong>' + album.title + '</strong>' +
      (album.description ? '<span>' + album.description + '</span>' : '') +
      (album.category ? '<span style="margin-top:0.35rem;opacity:0.7;font-size:0.8rem;">' + album.category + '</span>' : '');
  }
  const counter = document.getElementById('lightbox-counter');
  if (counter) counter.textContent = (imgs.length > 1) ? ((_photoIdx + 1) + ' / ' + imgs.length) : '';
  lb.classList.add('open');
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
}
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
// compat
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
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('[name="name"]').value;
    const phone = form.querySelector('[name="phone"]').value;
    const service = form.querySelector('[name="service"]').value;
    const message = form.querySelector('[name="message"]').value;
    const settings = getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    const text = `Olá! Meu nome é ${name}.%0ATelefone: ${phone}%0AServiço de interesse: ${service}%0AMensagem: ${message}`;
    window.open(`https://wa.me/${settings.whatsapp}?text=${text}`, '_blank');
    form.reset();
    alert('Redirecionando para o WhatsApp...');
  });
}

function formatPhone(phone) {
  const p = phone.replace(/\D/g, '');
  if (p.length === 11) return `(${p.slice(0,2)}) ${p.slice(2,7)}-${p.slice(7)}`;
  return phone;
}

function applySiteLogo() {
  const settings = getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const logos = document.querySelectorAll('[data-site-logo]');
  logos.forEach(el => {
    if (settings.logo) {
      el.innerHTML = '<img src="' + settings.logo + '" alt="Logo" class="logo-img-upload">';
    } else {
      el.innerHTML = '<div class="logo-wordmark"><div class="logo-name"><span class="magia">MAGIA</span><span class="glass">GLASS</span></div><div class="logo-tag">Vidraçaria</div></div>';
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
  // esconde bg único antigo se existir
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

  // parallax suave nos slides
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    slidesWrap.querySelectorAll('.hero-slide').forEach(el => {
      el.style.transform = 'translateY(' + (y * 0.28) + 'px)';
    });
  }, { passive: true });
}
