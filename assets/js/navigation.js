/* MAGIA GLASS - Soft Navigation */
(function () {
  'use strict';
  if (window.location.pathname.includes('/admin/')) return;

  const pageCache = new Map();
  let navigating = false;
  let renderedUrl = canonical(window.location.href);

  function canonical(url) {
    const u = new URL(url, window.location.href);
    if (u.pathname.endsWith('/index.html')) u.pathname = u.pathname.slice(0, -10) || '/';
    else if (u.pathname.endsWith('.html')) u.pathname = u.pathname.slice(0, -5) || '/';
    return u.origin + u.pathname + u.search + u.hash;
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

  async function fetchPage(url) {
    const key = canonical(url);
    if (pageCache.has(key)) return pageCache.get(key);
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'default',
      headers: { Accept: 'text/html', 'X-MG-Soft-Navigation': '1' }
    });
    if (!response.ok) throw new Error('navigation fetch failed: ' + response.status);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc.body || !doc.querySelector('.header')) throw new Error('invalid Magia Glass page');
    pageCache.set(key, html);
    return html;
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

  function swapPage(html, url, push) {
    const nextDoc = new DOMParser().parseFromString(html, 'text/html');
    const currentHeader = document.querySelector('.header');
    if (!currentHeader || !nextDoc.body) throw new Error('navigation shell unavailable');

    const nextChildren = Array.from(nextDoc.body.children)
      .filter(node => !node.matches('.header') && node.tagName !== 'SCRIPT')
      .map(node => document.importNode(node, true));

    const replace = function () {
      document.body.replaceChildren(currentHeader, ...nextChildren);
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
    const target = new URL(url, window.location.href);
    const targetCanonical = canonical(target);
    if (targetCanonical === renderedUrl && push) return;
    navigating = true;
    try {
      const html = await fetchPage(target.href);
      swapPage(html, target.href, push);
    } catch (error) {
      window.location.href = target.href;
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
