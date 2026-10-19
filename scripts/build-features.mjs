#!/usr/bin/env node
// Scans features/ and writes features.json, the manifest the home page reads.
//
// A directory containing an index.html is a feature; its own sub-directories
// belong to it and are not scanned. A directory without one is a group (e.g.
// features/examples/) and is scanned recursively; features inside it are shown
// under a section named after the group. Names that start with "." or "_" are
// skipped, so you can park drafts in "_my-draft".
//
// Metadata comes from features/<id>/feature.json when present, otherwise from
// the feature's index.html (<title>, <meta name="description">, and the
// optional <meta name="feature-icon"> / <meta name="feature-tags">).

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const featuresDir = join(root, 'features');
const outFile = join(root, 'features.json');

const HIDDEN = /^[._]/;
const exists = (p) => stat(p).then(() => true, () => false);

function metaContent(html, name) {
  const tag = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`, 'i'));
  return tag?.[0].match(/content=["']([^"']*)["']/i)?.[1]?.trim();
}

function fromHtml(html) {
  const tags = metaContent(html, 'feature-tags');
  return {
    title: html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim(),
    description: metaContent(html, 'description'),
    icon: metaContent(html, 'feature-icon'),
    tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
  };
}

function titleCase(name) {
  return name.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

async function readFeature(id) {
  const dir = join(featuresDir, id);
  const indexPath = join(dir, 'index.html');
  if (!(await exists(indexPath))) return null;

  const html = await readFile(indexPath, 'utf8');
  let meta = fromHtml(html);

  const jsonPath = join(dir, 'feature.json');
  if (await exists(jsonPath)) {
    try {
      meta = { ...meta, ...JSON.parse(await readFile(jsonPath, 'utf8')) };
    } catch (err) {
      console.warn(`! features/${id}/feature.json is not valid JSON: ${err.message}`);
    }
  }

  const segments = id.split('/');
  const groupSegments = segments.slice(0, -1);
  return {
    id,
    path: `features/${id}/`,
    group: groupSegments.join('/'),
    groupTitle: groupSegments.map(titleCase).join(' / '),
    title: meta.title || titleCase(segments.at(-1)),
    description: meta.description || '',
    icon: meta.icon || '',
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    order: Number.isFinite(meta.order) ? meta.order : null,
  };
}

async function findFeatureIds(rel = '') {
  const entries = await readdir(join(featuresDir, rel), { withFileTypes: true }).catch(() => []);
  const ids = [];
  for (const e of entries) {
    if (!e.isDirectory() || HIDDEN.test(e.name)) continue;
    const id = rel ? `${rel}/${e.name}` : e.name;
    if (await exists(join(featuresDir, id, 'index.html'))) ids.push(id);
    else ids.push(...(await findFeatureIds(id)));
  }
  return ids;
}

const features = (await Promise.all((await findFeatureIds()).map(readFeature)))
  .filter(Boolean)
  .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.title.localeCompare(b.title));

await writeFile(
  outFile,
  JSON.stringify({ generated: new Date().toISOString(), features }, null, 2) + '\n',
);
console.log(`features.json: ${features.length} feature(s)${features.length ? ' — ' + features.map((f) => f.id).join(', ') : ''}`);
