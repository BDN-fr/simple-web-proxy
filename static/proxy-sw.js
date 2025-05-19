var origin = ''

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// https://stackoverflow.com/q/68381113
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.href.startsWith(self.location.origin + '/web/')) {
        return
    }
    var newUrl = new URL(
        self.location.origin + '/' +
        ((url.origin != self.location.origin) && url.origin || origin) +
        url.pathname.replaceAll(origin, '') +
        url.search
    );
    console.log('Proxying ' + url.href + ' by ' + newUrl.href)
    event.respondWith(fetch(newUrl));
});

self.addEventListener('message', e => {
    origin = e.data
});