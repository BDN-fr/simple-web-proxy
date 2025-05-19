var origin = ''

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// https://stackoverflow.com/q/68381113
self.addEventListener('fetch', async event => {
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
    var r = event.request
    const requestOptions = {
        method: r.method,
        headers: new Headers(r.headers),
        body: ['GET', 'HEAD'].includes(r.method) ? null : await r.blob(),
        mode: 'cors',
        credentials: r.credentials,
        cache: r.cache,
        redirect: r.redirect,
        referrer: r.referrer
    };
    console.log('Proxying ' + url.href + ' to ' + newUrl.href)
    event.respondWith(fetch(newUrl, requestOptions));
});

self.addEventListener('message', e => {
    origin = e.data
});