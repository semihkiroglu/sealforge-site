/* Isolated study state: never changes the production theme preference. */
(() => {
  'use strict';
  const root = document.documentElement;
  const assets = new URL('assets/', document.currentScript.src);
  const labels = {
    glide: ['A / Glide — right profile', 'Glide: complete streamlined seal in right profile'],
    turn: ['B / Turn — three-quarter view', 'Turn: complete streamlined seal in three-quarter view'],
    lookout: ['C / Lookout — near-frontal view', 'Lookout: complete streamlined seal with a near-frontal head'],
  };
  root.classList.add('js');
  const file = name => new URL(name, assets).href;
  function render() {
    const tone = root.dataset.tone;
    const choice = root.dataset.choice;
    document.querySelectorAll('[data-primary]').forEach(img => img.src = file(`primary-head-${tone}.svg`));
    document.querySelectorAll('[data-head]').forEach(img => img.src = file(`${img.dataset.head}-head-${tone}.png`));
    document.querySelectorAll('[data-full]').forEach(a => a.href = file(`${a.dataset.full}-body-${tone}.png`));
    document.querySelector('#full-seal').src = file(`${choice}-body-${tone}.png`);
    document.querySelector('#full-seal').alt = labels[choice][1];
    document.querySelector('#selection-label').textContent = labels[choice][0];
    document.querySelector('#head-file').href = file(`${choice}-head-${tone}.png`);
    document.querySelector('#body-file').href = file(`${choice}-body-${tone}.png`);
    document.querySelectorAll('button[data-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.choice === choice)));
    document.querySelectorAll('button[data-format]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.format === root.dataset.format)));
    const dark = tone === 'dark';
    document.querySelector('#tone').setAttribute('aria-pressed', String(dark));
    document.querySelector('#tone').textContent = dark ? 'Light preview' : 'Dark preview';
  }
  document.querySelectorAll('button[data-choice]').forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => { root.dataset.choice = button.dataset.choice; render(); });
  });
  document.querySelectorAll('button[data-format]').forEach(button => button.addEventListener('click', () => { root.dataset.format = button.dataset.format; render(); }));
  document.querySelector('#tone').addEventListener('click', () => { root.dataset.tone = root.dataset.tone === 'dark' ? 'light' : 'dark'; render(); });
  render();
})();
