import { discoverFeatures } from './discovery.js';
import { registerServiceWorker } from './pwa.js';

const $ = (id) => document.getElementById(id);
const list = $('feature-list');
const search = $('search');

let features = [];

function featureCard(f) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.className = 'card feature-card';
  a.href = f.path;

  const icon = document.createElement('span');
  icon.className = 'feature-card__icon';
  icon.setAttribute('aria-hidden', 'true');
  if (/\.(svg|png|jpe?g|webp|gif)$/i.test(f.icon)) {
    const img = document.createElement('img');
    img.src = f.path + f.icon;
    img.alt = '';
    icon.append(img);
  } else {
    icon.textContent = f.icon || f.title.charAt(0).toUpperCase();
  }

  const title = document.createElement('h3');
  title.className = 'feature-card__title';
  title.textContent = f.title;

  const desc = document.createElement('p');
  desc.className = 'feature-card__desc';
  desc.textContent = f.description;

  a.append(icon, title, desc);

  if (f.tags.length) {
    const tags = document.createElement('div');
    tags.className = 'feature-card__tags';
    for (const t of f.tags) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = t;
      tags.append(chip);
    }
    a.append(tags);
  }

  li.append(a);
  return li;
}

function render() {
  const q = search.value.trim().toLowerCase();
  const shown = q
    ? features.filter((f) => [f.title, f.description, f.groupTitle, ...f.tags].join(' ').toLowerCase().includes(q))
    : features;

  // Ungrouped features first, then one section per group in name order.
  const groups = new Map();
  for (const f of shown) {
    const key = f.group ?? '';
    if (!groups.has(key)) groups.set(key, { title: f.groupTitle || '', items: [] });
    groups.get(key).items.push(f);
  }
  const keys = [...groups.keys()].sort((a, b) => (a !== '') - (b !== '') || a.localeCompare(b));

  list.replaceChildren(...keys.map((key) => {
    const { title, items } = groups.get(key);
    const section = document.createElement('section');
    if (title) {
      const h = document.createElement('h3');
      h.className = 'section-title';
      h.textContent = title;
      section.append(h);
    }
    const ul = document.createElement('ul');
    ul.className = 'grid';
    ul.append(...items.map(featureCard));
    section.append(ul);
    return section;
  }));
  $('no-results').hidden = !(features.length && !shown.length);
}

async function load() {
  const { source, features: found } = await discoverFeatures();
  features = found;

  $('feature-count').textContent = features.length ? `(${features.length})` : '';
  $('empty-state').hidden = features.length > 0;
  search.hidden = features.length < 6;

  if (source === 'none' && ['localhost', '127.0.0.1'].includes(location.hostname)) {
    const hint = $('empty-hint');
    hint.innerHTML = 'Running locally? Generate the manifest with <code>npm run build</code>.';
    hint.hidden = false;
  }

  render();
}

function watchConnectivity() {
  const update = () => ($('offline-banner').hidden = navigator.onLine);
  addEventListener('online', update);
  addEventListener('offline', update);
  update();
}

function setupInstall() {
  const btn = $('install-btn');
  let deferred;
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    btn.hidden = false;
  });
  btn.addEventListener('click', async () => {
    btn.hidden = true;
    deferred?.prompt();
    deferred = null;
  });
  addEventListener('appinstalled', () => (btn.hidden = true));
}

search.addEventListener('input', render);
watchConnectivity();
setupInstall();
registerServiceWorker({
  onUpdate(apply) {
    $('update-toast').hidden = false;
    $('update-btn').addEventListener('click', apply, { once: true });
  },
});
load();
