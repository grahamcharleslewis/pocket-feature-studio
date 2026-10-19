import { API_ROOT, getJSON, resourceFor, listHref, el, showError, skeletons } from './swapi.js';

const container = document.getElementById('endpoints');

function endpointCard(type, url) {
  const meta = resourceFor(type);
  const link = el('a', 'card feature-card');
  link.href = listHref(type);

  const icon = el('span', 'feature-card__icon', meta.icon);
  icon.setAttribute('aria-hidden', 'true');
  const count = el('p', 'feature-card__desc', 'Counting records…');

  link.append(icon, el('h3', 'feature-card__title', meta.label), count, el('p', 'swapi-endpoint__url', url));

  // Page 1 of each endpoint carries the total record count.
  getJSON(url).then(
    (page) => { count.textContent = `${page.count.toLocaleString()} records`; },
    () => { count.textContent = 'Count unavailable'; },
  );

  const li = el('li');
  li.append(link);
  return li;
}

async function load() {
  container.replaceChildren(skeletons(6));
  try {
    const endpoints = await getJSON(API_ROOT);
    const list = el('ul', 'grid');
    list.append(...Object.entries(endpoints).map(([type, url]) => endpointCard(type, url)));
    container.replaceChildren(list);
  } catch (error) {
    showError(container, error, load);
  }
}

load();
