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
  /* Header disclosures work without JavaScript; this only closes them on outside click or Escape. */
  const menus = [...document.querySelectorAll('.site-header details')];
  const navToggle = document.querySelector('.nav-toggle');
  menus.forEach(menu => menu.addEventListener('toggle', () => { if (menu.open) { menus.forEach(other => { if (other !== menu) other.open = false; }); navToggle.checked = false; } }));
  navToggle.addEventListener('change', () => { if (navToggle.checked) menus.forEach(menu => { menu.open = false; }); });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header details')) menus.forEach(menu => { menu.open = false; });
    if (!event.target.closest('.nav-menu')) navToggle.checked = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    menus.forEach(menu => { if (menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
    if (navToggle.checked) { navToggle.checked = false; navToggle.focus(); }
  });
})();
