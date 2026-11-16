/* Shared by static site pages and editable documents; no translated content depends on JavaScript. */
(() => {
  'use strict';
  const root = document.documentElement;
  const base = new URL(root.dataset.languageRoot || './', location.href);
  const relative = location.pathname.slice(base.pathname.length);
  const file = relative.replace(/^tr\//, '') || 'index.html';
  const supported = value => value === 'en' || value === 'tr';
  const requested = new URL(location.href).searchParams.get('lang');
  let stored;
  try { stored = localStorage.getItem('sealforge.language'); } catch { /* Explicit links also work with blocked storage. */ }
  const browser = (navigator.languages || [navigator.language]).map(value => (value || '').toLowerCase().split('-')[0]).find(supported) || 'en';
  const language = supported(requested) ? requested : supported(stored) ? stored : relative.startsWith('tr/') ? 'tr' : browser;
  if (supported(requested)) {
    try { localStorage.setItem('sealforge.language', requested); } catch { /* Navigation retains the explicit query preference. */ }
  }
  const destination = code => new URL((code === 'tr' ? 'tr/' : '') + file, base);
  if (language !== root.lang) {
    const target = destination(language);
    target.search = location.search;
    target.searchParams.set('lang', language);
    target.hash = location.hash;
    location.replace(target.href);
    return;
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.language-switch a[lang]').forEach(link => {
      const target = destination(link.lang);
      target.search = location.search;
      target.searchParams.set('lang', link.lang);
      target.hash = location.hash;
      link.href = target.href;
      if (link.lang === root.lang) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    // Keep a manual choice across page navigation even when storage is blocked.
    document.querySelectorAll('a[href]').forEach(link => {
      const original = link.getAttribute('href');
      if (!original || original.startsWith('#') || link.hasAttribute('download') || link.closest('.language-switch')) return;
      const target = new URL(link.href);
      if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) return;
      if (!/^(tr\/)?[^/]+\.html$/.test(target.pathname.slice(base.pathname.length))) return;
      target.searchParams.set('lang', root.lang);
      link.href = target.href;
    });
  });
})();
