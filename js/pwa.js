// Service worker registration, shared by the home page and features.
// The worker lives at the site root so its scope covers every feature.

const SW_URL = new URL('../sw.js', import.meta.url);

export function registerServiceWorker({ onUpdate } = {}) {
  if (!('serviceWorker' in navigator)) return;

  addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: new URL('./', SW_URL).pathname });

      const apply = () => reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
      const announce = () => {
        if (reg.waiting && navigator.serviceWorker.controller) onUpdate?.(apply);
      };

      announce();
      reg.addEventListener('updatefound', () => {
        reg.installing?.addEventListener('statechange', announce);
      });

      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return;
        reloading = true;
        location.reload();
      });
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  });
}
