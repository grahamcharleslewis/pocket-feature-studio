// Shared helpers for the SWAPI pages: fetching, resource metadata and links.
// Docs: https://swapi.dev/documentation

export const API_ROOT = 'https://swapi.dev/api/';

// How each endpoint is labelled, titled and summarised in lists.
export const RESOURCES = {
  people: {
    label: 'People', icon: '🧑‍🚀',
    title: (r) => r.name,
    summary: (r) => [r.birth_year, r.gender],
  },
  planets: {
    label: 'Planets', icon: '🪐',
    title: (r) => r.name,
    summary: (r) => [r.climate, r.population === 'unknown' ? null : `pop. ${formatNumber(r.population)}`],
  },
  films: {
    label: 'Films', icon: '🎬',
    title: (r) => r.title,
    summary: (r) => [`Episode ${r.episode_id}`, r.release_date],
  },
  species: {
    label: 'Species', icon: '👽',
    title: (r) => r.name,
    summary: (r) => [r.classification, r.language],
  },
  vehicles: {
    label: 'Vehicles', icon: '🚗',
    title: (r) => r.name,
    summary: (r) => [r.model, r.vehicle_class],
  },
  starships: {
    label: 'Starships', icon: '🚀',
    title: (r) => r.name,
    summary: (r) => [r.model, r.starship_class],
  },
};

// Falls back gracefully if the API ever adds an endpoint we don't know about.
export const resourceFor = (type) => RESOURCES[type] ?? {
  label: titleCase(type), icon: '✨',
  title: (r) => r.name ?? r.title ?? 'Untitled',
  summary: () => [],
};

// One request per URL per page view; linked records are often shared
// (e.g. every Tatooine native points at planets/1/).
const cache = new Map();

export function getJSON(url) {
  const key = url.replace(/^http:/, 'https:');
  if (!cache.has(key)) {
    const request = fetch(key, { headers: { Accept: 'application/json' } }).then((res) => {
      if (res.status === 404) throw Object.assign(new Error('That record isn’t in the Star Wars API.'), { status: 404 });
      if (!res.ok) throw Object.assign(new Error(`The Star Wars API returned ${res.status}.`), { status: res.status });
      return res.json();
    });
    request.catch(() => cache.delete(key));
    cache.set(key, request);
  }
  return cache.get(key);
}

export const isApiUrl = (value) => typeof value === 'string' && /^https?:\/\/swapi\.dev\/api\/\w+\/\d+\/?$/.test(value);

// "https://swapi.dev/api/people/1/" → { type: 'people', id: '1' }
export function parseApiUrl(url) {
  const [type, id] = new URL(url).pathname.replace(/^\/api\//, '').split('/').filter(Boolean);
  return { type, id };
}

export const apiUrl = (type, id) => `${API_ROOT}${encodeURIComponent(type)}/${id ? `${encodeURIComponent(id)}/` : ''}`;
export const listHref = (type, params = {}) => `list.html?${new URLSearchParams({ type, ...params })}`;
export const itemHref = (url) => `item.html?${new URLSearchParams(parseApiUrl(url))}`;

export function titleCase(text) {
  return text.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatNumber(value) {
  const n = Number(String(value).replace(/,/g, ''));
  return String(value).trim() !== '' && Number.isFinite(n) ? n.toLocaleString() : value;
}

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// Error card with a Retry button; replaces the contents of `container`.
export function showError(container, error, retry) {
  const offline = !navigator.onLine;
  const missing = error.status === 404;
  const box = el('div', 'empty-state');
  box.setAttribute('role', 'alert');
  box.append(
    el('div', 'empty-state__icon', offline ? '📡' : missing ? '🔭' : '⚠️'),
    el('h2', null, offline ? 'You’re offline' : missing ? 'Not found' : 'Couldn’t reach the Star Wars API'),
    el('p', null, offline ? 'This demo shows live data, so it needs a connection.' : error.message),
  );
  if (!missing) {
    const button = el('button', 'btn btn--primary', 'Retry');
    button.type = 'button';
    button.addEventListener('click', retry);
    box.append(button);
  }
  container.replaceChildren(box);
}

export function skeletons(count) {
  const list = el('ul', 'grid');
  for (let i = 0; i < count; i++) list.append(el('li', 'skeleton'));
  return list;
}
