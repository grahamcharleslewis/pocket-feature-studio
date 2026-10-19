import {
  apiUrl, getJSON, resourceFor, isApiUrl, parseApiUrl, itemHref, listHref,
  titleCase, formatNumber, el, showError, skeletons,
} from './swapi.js';

const params = new URLSearchParams(location.search);
const type = params.get('type');
const id = params.get('id');
if (!type || !id) location.replace('./');

const meta = resourceFor(type);
const content = document.getElementById('content');
const back = document.getElementById('back');
back.href = listHref(type);
back.setAttribute('aria-label', `Back to ${meta.label}`);
document.getElementById('title').textContent = meta.label;

// Shown elsewhere on the page (hero, crawl, raw JSON) rather than as fields.
const SKIP = new Set(['name', 'title', 'url', 'created', 'edited', 'opening_crawl']);
const NUMERIC = /^(height|mass|diameter|population|surface_water|rotation_period|orbital_period|length|crew|passengers|cost_in_credits|cargo_capacity|max_atmosphering_speed|average_height|average_lifespan|MGLT|hyperdrive_rating)$/;

function fieldValue(key, value) {
  if (NUMERIC.test(key)) return formatNumber(value);
  return value === '' ? '—' : String(value);
}

// A group of links to related records; names arrive as each one loads.
function linkGroup(key, urls, showCount) {
  const section = el('section', 'card swapi-link-group');
  section.append(el('h3', null, showCount ? `${titleCase(key)} (${urls.length})` : titleCase(key)));

  const list = el('ul', 'swapi-links');
  for (const url of urls) {
    const related = parseApiUrl(url);
    const chip = el('a', 'chip', `${titleCase(related.type)} #${related.id}`);
    chip.href = itemHref(url);
    getJSON(url).then(
      (record) => { chip.textContent = resourceFor(related.type).title(record); },
      () => {},
    );
    const li = el('li');
    li.append(chip);
    list.append(li);
  }
  section.append(list);
  return section;
}

function render(record) {
  const name = meta.title(record);
  document.title = `${name} · Star Wars API`;

  const hero = el('div', 'card swapi-hero');
  hero.append(el('p', 'swapi-hero__type', `${meta.icon} ${meta.label}`), el('h2', 'swapi-hero__title', name));

  // Plain values become fields; links to other records (a single homeworld,
  // or arrays of films, starships, …) become groups of chips.
  const fields = el('dl', 'swapi-fields');
  const links = [];
  for (const [key, value] of Object.entries(record)) {
    if (SKIP.has(key) || value == null) continue;
    if (Array.isArray(value) || isApiUrl(value)) {
      const urls = [value].flat().filter(isApiUrl);
      if (urls.length) links.push(linkGroup(key, urls, Array.isArray(value)));
      continue;
    }
    const pair = el('div');
    pair.append(el('dt', null, titleCase(key)), el('dd', null, fieldValue(key, value)));
    fields.append(pair);
  }
  hero.append(fields);

  const sections = [hero];

  if (record.opening_crawl) {
    const crawl = el('section', 'card');
    crawl.append(el('h3', null, 'Opening crawl'), el('p', 'swapi-crawl', record.opening_crawl.replace(/\r\n/g, '\n')));
    sections.push(crawl);
  }

  sections.push(...links);

  const raw = el('details', 'card swapi-raw');
  const summary = el('summary', null, 'Raw JSON');
  const source = el('p', 'swapi-status');
  const sourceLink = el('a', null, record.url);
  sourceLink.href = record.url;
  sourceLink.target = '_blank';
  sourceLink.rel = 'noopener';
  source.append(sourceLink);
  raw.append(summary, source, el('pre', null, JSON.stringify(record, null, 2)));
  sections.push(raw);

  content.replaceChildren(...sections);
}

async function load() {
  content.replaceChildren(skeletons(2));
  try {
    render(await getJSON(apiUrl(type, id)));
  } catch (error) {
    showError(content, error, load);
  }
}

if (type && id) load();
