const CACHE = 'white-oak-v1';

// Статические ресурсы — кешируются при установке
const PRECACHE = [
    '/White8Oak/',
    '/White8Oak/index.html',
    '/White8Oak/config.js',
    '/White8Oak/css/style.css',
    '/White8Oak/manifest.json',
    '/White8Oak/icons/icon.svg'
];

// ── Установка: кешируем статику ──────────────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
    );
    self.skipWaiting();
});

// ── Активация: удаляем старые кеши ──────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ── Запросы ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Только GET запросы
    if (event.request.method !== 'GET') return;

    // Внешние запросы (шрифты, EmailJS, Google Sheets, GitHub API) — только сеть
    if (!url.origin.includes('github.io') && !url.origin.includes('githubusercontent.com')) {
        return;
    }

    // products.json — Network-first: всегда берём свежие данные, фолбек на кеш
    if (url.pathname.endsWith('products.json')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Всё остальное — Cache-first: быстро из кеша, обновляем в фоне
    event.respondWith(
        caches.match(event.request).then(cached => {
            const network = fetch(event.request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE).then(cache => cache.put(event.request, clone));
                }
                return response;
            });
            return cached || network;
        })
    );
});
