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
