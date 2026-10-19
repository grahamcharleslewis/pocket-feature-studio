import { apiUrl, getJSON, resourceFor, itemHref, el, showError, skeletons } from './swapi.js';

const PAGE_SIZE = 10; // fixed by SWAPI

const params = new URLSearchParams(location.search);
const type = params.get('type');
if (!type) location.replace('./');

const meta = resourceFor(type);
const results = document.getElementById('results');
const status = document.getElementById('status');
const search = document.getElementById('search');
const pager = document.getElementById('pager');
const prev = document.getElementById('prev');
const next = document.getElementById('next');

let page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1);
let query = params.get('search') ?? '';
let loadId = 0;

document.title = `${meta.label} · Star Wars API`;
document.getElementById('title').textContent = `${meta.icon} ${meta.label}`;
document.getElementById('search-label').textContent = `Search ${meta.label.toLowerCase()}`;
search.placeholder = `Search ${meta.label.toLowerCase()}`;
search.value = query;

const chevron = () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('swapi-row__chevron');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'm9 18 6-6-6-6');
  svg.append(path);
  return svg;
};

function row(record) {
  const link = el('a', 'swapi-row');
  link.href = itemHref(record.url);
  const text = el('span', 'swapi-row__text');
  const summary = meta.summary(record).filter((v) => v && v !== 'n/a' && v !== 'unknown').join(' · ');
  text.append(el('span', 'swapi-row__title', meta.title(record)), el('span', 'swapi-row__meta', summary));
  link.append(text, chevron());
  const li = el('li', 'swapi-row-item');
  li.append(link);
  return li;
}

function syncUrl() {
  const next = new URLSearchParams({ type });
  if (query) next.set('search', query);
  if (page > 1) next.set('page', page);
  history.replaceState(null, '', `?${next}`);
}

async function load() {
  const id = ++loadId;
  syncUrl();
  status.textContent = 'Loading…';
  results.replaceChildren(skeletons(3));
  pager.hidden = true;

  const url = new URL(apiUrl(type));
  if (query) url.searchParams.set('search', query);
  if (page > 1) url.searchParams.set('page', page);

  try {
    const data = await getJSON(url.href);
    if (id !== loadId) return; // a newer search has started

    const pages = Math.max(1, Math.ceil(data.count / PAGE_SIZE));
    status.textContent = query
      ? `${data.count.toLocaleString()} match${data.count === 1 ? '' : 'es'} for “${query}”`
      : `${data.count.toLocaleString()} ${meta.label.toLowerCase()}`;

    if (!data.results.length) {
      results.replaceChildren(el('p', 'empty-state', `No ${meta.label.toLowerCase()} match your search.`));
      return;
    }

    const list = el('ul', 'list');
    list.append(...data.results.map(row));
    results.replaceChildren(list);

    pager.hidden = pages === 1;
    prev.disabled = !data.previous;
    next.disabled = !data.next;
    document.getElementById('page-label').textContent = `Page ${page} of ${pages}`;
  } catch (error) {
    if (id !== loadId) return;
    status.textContent = '';
    showError(results, error, load);
  }
}

let debounce;
search.addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    query = search.value.trim();
    page = 1;
    load();
  }, 300);
});

document.getElementById('search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  clearTimeout(debounce);
  query = search.value.trim();
  page = 1;
  load();
});

function turn(delta) {
  page += delta;
  load();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
prev.addEventListener('click', () => turn(-1));
next.addEventListener('click', () => turn(1));

if (type) load();
