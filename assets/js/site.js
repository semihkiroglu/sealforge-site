/* SealForge site — theme and language plumbing.
   No dependencies, no build step: everything runs from the static files.

   Language: every translatable node carries data-i18n="key". The English text
   lives in the markup itself and is captured as each node's source, so `en`
   in DICT stays empty and is never duplicated. Adding a language = add one
   block here; no HTML edit. Missing keys fall back to the markup, never blank. */

(() => {
  'use strict';

  const root = document.documentElement;
  const THEME_KEY = 'sealforge.theme';
  const LANG_KEY = 'sealforge.lang';
  const FALLBACK_LANG = 'en';

  const DICT = {
    en: { name: 'English' },
    // tr: { name: 'Türkçe', 'hero.title': '…', 'nav.why': 'Neden' },
  };

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode: keep it in-memory only */ } },
  };

  // ── Theme ────────────────────────────────────────────────────────────
  const toggle = document.getElementById('theme-toggle');
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    store.set(THEME_KEY, theme);
    toggle.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`);
    toggle.setAttribute('aria-pressed', String(theme === 'light'));
  };
  toggle.addEventListener('click', () => applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light'));
  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');

  // ── Language ─────────────────────────────────────────────────────────
  const select = document.getElementById('lang-select');
  for (const [code, dict] of Object.entries(DICT)) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = dict.name ?? code;
    select.append(option);
  }

  const applyLang = (requested) => {
    const lang = DICT[requested] ? requested : FALLBACK_LANG;
    root.lang = lang;
    for (const el of document.querySelectorAll('[data-i18n]')) {
      // innerHTML is safe here: both sides are repo-authored static content —
      // DICT strings, and the node's own markup captured below. No user input.
      el.dataset.i18nSource ??= el.innerHTML;
      el.innerHTML = DICT[lang][el.dataset.i18n] ?? el.dataset.i18nSource;
    }
    select.value = lang;
    store.set(LANG_KEY, lang);
  };

  select.addEventListener('change', () => applyLang(select.value));
  applyLang(store.get(LANG_KEY) ?? FALLBACK_LANG);
})();
