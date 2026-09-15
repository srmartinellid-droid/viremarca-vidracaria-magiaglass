/* MAGIA GLASS - Soft Navigation */
(function () {
  'use strict';
  if (window.location.pathname.includes('/admin/')) return;

  const pageCache = new Map();
  const ROUTES = {
    '/': '/index.html',
    '/pages/servicos': '/pages/servicos.html',
    '/pages/galeria': '/pages/galeria.html',
    '/pages/contato': '/pages/contato.html'
  };
  let navigating = false;
  let renderedUrl = canonical(window.location.href);

  function normalizePathname(pathname) {
    let path = pathname || '/';
    path = path.replace(/\/pages\/(?:pages\/)+/g, '/pages/');
    if (path === '/index.html' || path === '/index') return '/';
    if (path.endsWith('/index.html')) return path.slice(0, -11) || '/';
    if (path.endsWith('.html')) path = path.slice(0, -5) || '/';
    if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
    return path || '/';
  }

  function canonical(url) {
    const u = new URL(url, window.location.href);
    u.pathname = normalizePathname(u.pathname);
    return u.origin + u.pathname + u.search + u.hash;
  }

  function routeSource(url) {
    const u = new URL(canonical(url), window.location.href);
    const source = ROUTES[u.pathname];
    if (!source) return u.pathname;
    return source + u.search + u.hash;
  }

  function resolvePublicLink(value, baseUrl) {
    if (!value || value.startsWith('#') || value.startsWith('data:') || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('javascript:')) return value;
    try {
      const resolved = new URL(value, baseUrl);
      if (resolved.origin !== window.location.origin || resolved.pathname.includes('/admin/')) return resolved.href;
      return canonical(resolved.href);
    } catch (_) {
      return value;
    }
  }

  function isInternalPageLink(anchor, event) {
    if (!anchor || !anchor.href) return false;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (anchor.target && anchor.target !== '_self') return false;
    if (anchor.hasAttribute('download')) return false;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.hash && canonical(url) === canonical(window.location.href)) return false;
    if (url.pathname.includes('/admin/')) return false;
    return true;
  }

  function normalizeRelativeUrl(value, baseUrl) {
    if (!value || value.startsWith('#') || value.startsWith('data:') || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('javascript:')) return value;
    try {
      const resolved = new URL(value, baseUrl);
      if (resolved.origin !== window.location.origin) return resolved.href;
      return resolved.href;
    } catch (_) {
      return value;
    }
  }

  function normalizeImportedUrls(root, baseUrl) {
    root.querySelectorAll('a[href]').forEach(function (anchor) {
      const raw = anchor.getAttribute('href');
      if (!raw || raw.startsWith('#')) return;
      const resolved = new URL(raw, baseUrl);
      if (resolved.origin !== window.location.origin) return;
      if (resolved.pathname.includes('/admin/')) return;
      anchor.setAttribute('href', resolvePublicLink(raw, baseUrl));
    });

    root.querySelectorAll('[src]').forEach(function (element) {
      const raw = element.getAttribute('src');
      if (raw) element.setAttribute('src', normalizeRelativeUrl(raw, baseUrl));
    });

    root.querySelectorAll('[poster]').forEach(function (element) {
      const raw = element.getAttribute('poster');
      if (raw) element.setAttribute('poster', normalizeRelativeUrl(raw, baseUrl));
    });
  }

  async function fetchPage(url) {
    const key = canonical(url);
    if (pageCache.has(key)) return pageCache.get(key);

    const fetchUrl = new URL(routeSource(key), window.location.origin).href;
    const response = await fetch(fetchUrl, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'default',
      headers: { Accept: 'text/html', 'X-MG-Soft-Navigation': '1' }
    });
    if (!response.ok) throw new Error('navigation fetch failed: ' + response.status);

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc.body || !doc.querySelector('.header')) throw new Error('invalid Magia Glass page');
    pageCache.set(key, { html: html, baseUrl: fetchUrl });
    return pageCache.get(key);
  }

  function updateHead(nextDoc) {
    if (nextDoc.title) document.title = nextDoc.title;
    const nextDescription = nextDoc.querySelector('meta[name="description"]');
    const currentDescription = document.querySelector('meta[name="description"]');
    if (nextDescription && currentDescription) currentDescription.setAttribute('content', nextDescription.getAttribute('content') || '');
  }

  function updateActiveNav() {
    const current = canonical(window.location.href).replace(/\/$/, '') || window.location.origin;
    document.querySelectorAll('.nav-links a').forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      const target = canonical(new URL(href, window.location.href).href).replace(/\/$/, '') || window.location.origin;
      a.classList.toggle('active', target === current);
    });
  }

  function refreshPageBehaviors() {
    if (typeof initWhatsApp === 'function') initWhatsApp();
    if (typeof applySiteLogo === 'function') applySiteLogo();
    if (typeof renderHomeIfNeeded === 'function') renderHomeIfNeeded();
    if (typeof renderServicesIfNeeded === 'function') renderServicesIfNeeded();
    if (typeof renderGalleryIfNeeded === 'function') renderGalleryIfNeeded();
    if (typeof initContactForm === 'function') initContactForm();
    if (typeof initHeroCarousel === 'function') initHeroCarousel();
    updateActiveNav();

    const header = document.querySelector('.header');
    if (header) {
      const hasHero = !!document.querySelector('.hero');
      header.classList.toggle('is-solid', !hasHero || window.scrollY > 40);
      header.classList.toggle('is-transparent', hasHero && window.scrollY <= 40);
      header.classList.toggle('scrolled', hasHero && window.scrollY > 40);
    }
    document.documentElement.classList.remove('mg-site-loading', 'mg-awaiting-data');
    document.documentElement.classList.add('mg-site-ready');
    if (typeof markSiteReady === 'function') markSiteReady();
  }

  function swapPage(payload, url, push) {
    const html = payload.html;
    const baseUrl = payload.baseUrl || new URL(routeSource(url), window.location.origin).href;
    const nextDoc = new DOMParser().parseFromString(html, 'text/html');
    const currentHeader = document.querySelector('.header');
    if (!currentHeader || !nextDoc.body) throw new Error('navigation shell unavailable');

    normalizeImportedUrls(currentHeader, renderedUrl);

    const nextChildren = Array.from(nextDoc.body.children)
      .filter(node => !node.matches('.header') && node.tagName !== 'SCRIPT')
      .map(node => document.importNode(node, true));

    const tempRoot = document.createElement('div');
    tempRoot.append(...nextChildren);
    normalizeImportedUrls(tempRoot, baseUrl);
    const normalizedChildren = Array.from(tempRoot.childNodes);

    const replace = function () {
      document.body.replaceChildren(currentHeader, ...normalizedChildren);
      updateHead(nextDoc);
      if (push) history.pushState({ mgSoftNavigation: true }, '', canonical(url));
      renderedUrl = canonical(url);
      window.scrollTo(0, 0);
      refreshPageBehaviors();
    };

    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const transition = document.startViewTransition(replace);
      transition.finished.catch(function () {});
    } else {
      replace();
    }
  }

  async function navigate(url, push) {
    if (navigating) return;
    const target = new URL(canonical(url), window.location.href);
    const targetCanonical = canonical(target);
    if (targetCanonical === renderedUrl && push) return;
    navigating = true;
    try {
      const payload = await fetchPage(targetCanonical);
      swapPage(payload, targetCanonical, push);
    } catch (error) {
      window.location.href = targetCanonical;
    } finally {
      navigating = false;
    }
  }

  function prefetch(anchor) {
    if (!anchor || anchor.dataset.mgPrefetched === '1') return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname.includes('/admin/')) return;
    anchor.dataset.mgPrefetched = '1';
    fetchPage(url.href).catch(function () { anchor.dataset.mgPrefetched = ''; });
  }

  function init() {
    const initialCanonical = canonical(window.location.href);
    if (initialCanonical !== window.location.href) history.replaceState({ mgSoftNavigation: true }, '', initialCanonical);
    renderedUrl = initialCanonical;

    document.addEventListener('click', function (event) {
      const anchor = event.target.closest('a');
      if (!isInternalPageLink(anchor, event)) return;
      event.preventDefault();
      navigate(anchor.href, true);
    });

    document.addEventListener('pointerenter', function (event) {
      const anchor = event.target.closest('a');
      if (!anchor || !isInternalPageLink(anchor, { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false })) return;
      prefetch(anchor);
    }, true);

    window.addEventListener('popstate', function () {
      navigate(window.location.href, false);
    });

    updateActiveNav();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
