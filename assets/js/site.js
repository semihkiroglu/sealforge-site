/* Static content works without JavaScript; this control only changes the theme. */
(() => {
  'use strict';
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const applyTheme = theme => {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#f7f8f5' : '#151b1d';
    toggle.setAttribute('aria-label', root.lang === 'tr' ? (theme === 'light' ? 'Koyu temaya geç' : 'Açık temaya geç') : `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`);
    toggle.setAttribute('aria-pressed', String(theme === 'light'));
    try { localStorage.setItem('sealforge.theme', theme); } catch { /* Storage may be blocked; the control still works. */ }
  };
  toggle.addEventListener('click', () => applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light'));
  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
  toggle.hidden = false;
})();

// Reveal contact addresses only after loading, so the static HTML contains no plain mailto.
document.querySelectorAll('.cipher-email[data-contact]').forEach(span => {
  const address = atob(span.dataset.contact);
  const link = document.createElement('a');
  link.href = `mailto:${address}`;
  link.textContent = address;
  link.setAttribute('aria-label', address);
  span.replaceWith(link);
});
