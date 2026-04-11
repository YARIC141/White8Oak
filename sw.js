// Меняй версию при каждом деплое — это сбросит кеш у всех пользователей
const CACHE = 'white-oak-v2';

const PRECACHE = [
    '/White8Oak/config.js',
    '/White8Oak/css/style.css',
    '/White8Oak/manifest.json',
    '/White8Oak/icons/icon.svg'
];

// ── Установка ────────────────────────────────────────────────────────────────
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

    if (event.request.method !== 'GET') return;

    // Внешние запросы (шрифты, EmailJS, Google Sheets, GitHub API) — только сеть
    if (!url.origin.includes('github.io') && !url.origin.includes('githubusercontent.com')) {
        return;
    }

    // index.html — Network-first: всегда свежая версия приложения
    if (url.pathname === '/White8Oak/' || url.pathname.endsWith('index.html')) {
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

    // products.json — Network-first: свежий каталог, фолбек на кеш (офлайн)
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

    // CSS, JS, картинки, иконки — Cache-first (быстро, обновляем в фоне)
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
