# Features

Any directory here that contains an `index.html` is a feature, and it appears on the home page automatically.

Directories without an `index.html` are **groups**. They're scanned recursively, and their features get their own section on the home page:

```
features/
  camera/index.html              → "Features" (ungrouped, listed first)
  examples/                      → "Examples" section
    fibonacci/index.html
  sensors/motion/index.html      → "Sensors" section
```

A feature's own sub-directories belong to it and are not scanned, so `features/camera/assets/` is safe to use.

## Adding a feature

1. Create `features/[<group>/]<feature-id>/index.html`. The path becomes the URL.
2. Optionally add a `feature.json` next to it for card metadata.
3. Push to `main`, and the deploy workflow regenerates `features.json`. Locally, run `npm start`.

Directories starting with `.` or `_` are ignored, so `_draft-camera/` stays hidden until you rename it.

## Card metadata

Discovery reads metadata in this order, with later sources winning:

1. The folder name, e.g. `share-target` becomes "Share Target"
2. `index.html`: `<title>`, `<meta name="description">`, `<meta name="feature-icon">`, `<meta name="feature-tags">`
3. `feature.json`

```json
{
  "title": "Camera Capture",
  "description": "Take a photo with getUserMedia and preview it.",
  "icon": "📷",
  "tags": ["media", "permissions"],
  "order": 10
}
```

`icon` can be an emoji or text, or an image file path relative to the feature folder (e.g. `"icon.svg"`).
`order` is optional. Lower numbers come first, and features without an order are sorted by title after the ordered ones.

## Starter template

Use relative paths. On GitHub Pages the site lives under `/<repo-name>/`, so root-absolute paths like `/css/app.css` break. The template is for a top-level feature (`../../`). Inside a group, add one more `../` per level, e.g. `../../../` for `features/examples/fibonacci/`, which is a working example to copy from.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>My Feature</title>
  <meta name="description" content="One line about what this demonstrates.">
  <meta name="feature-icon" content="✨">
  <meta name="feature-tags" content="demo">
  <link rel="manifest" href="../../manifest.webmanifest">
  <link rel="icon" href="../../icons/icon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../../css/app.css">
  <script type="module" src="../../js/feature.js"></script>
</head>
<body>
  <header class="app-bar">
    <a class="icon-btn" href="../../" aria-label="Back to all features">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </a>
    <h1 class="app-bar__title">My Feature</h1>
  </header>
  <main class="container stack">
    <div class="card">
      <p>Feature content goes here.</p>
      <button class="btn btn--primary">Try it</button>
    </div>
  </main>
</body>
</html>
```

The shared classes are defined in `css/app.css`: `app-bar`, `container`, `stack`, `grid`, `card`, `btn` / `btn--primary` / `btn--block`, `chip`, `input`, `list`, `banner`, `toast`, `empty-state`, `section-title`. For colours, use the CSS custom properties (`var(--color-primary)` and so on) rather than hard-coded values, so light and dark mode both work.
