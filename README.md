# Pocket Feature Studio

An installable PWA that hosts a gallery of small demos. Each demo shows one capability of a mobile web app. Every feature shares one stylesheet and colour scheme, and new features are discovered automatically.

## Layout

```
index.html              Home page: lists every discovered feature
manifest.webmanifest    PWA manifest
sw.js                   Service worker (offline shell + runtime caching)
css/app.css             Shared design tokens & components (light/dark)
js/app.js               Home page logic (render, search, install, updates)
js/discovery.js         Feature discovery
js/pwa.js               Service worker registration
js/feature.js           Include on feature pages
icons/                  App icons (regenerate with `npm run icons`)
features/               One sub-directory per feature (see features/README.md)
scripts/                Build, dev-server and icon scripts (Node, no dependencies)
.github/workflows/      GitHub Pages deploy
```

## How discovery works

GitHub Pages can't list directories, so feature discovery uses a manifest:

- `scripts/build-features.mjs` scans `features/**/index.html` (folders without an `index.html` act as groups) and writes `features.json`. The deploy workflow runs it on every push to `main`, and `npm start` runs it locally. The file is generated, so it isn't committed.
- If `features.json` is missing (for example, Pages is set to deploy from a branch), the home page reads the repo's file tree from the GitHub API instead. That route is rate-limited to 60 requests per hour per visitor, so the workflow is the recommended setup.

## Develop locally

```sh
npm start          # builds features.json, serves on http://localhost:8080
```

Requires Node 18+. There's nothing to install. After adding a feature, restart `npm start`, or run `npm run build` and reload the page.

## Deploy to GitHub Pages

1. Push this repo to GitHub, with `main` as the default branch.
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Push. The site is published at `https://<user>.github.io/<repo>/`.

Every deploy stamps `sw.js` with the commit SHA, so installed copies pick up the new version and the home page offers a **Reload** prompt.
