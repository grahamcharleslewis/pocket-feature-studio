// Include on every feature page:
//   <script type="module" src="../../js/feature.js"></script>
// Registers the service worker (so a feature opened directly from a link still
// works offline afterwards) and applies updates silently on the next visit.

import { registerServiceWorker } from './pwa.js';

registerServiceWorker();
