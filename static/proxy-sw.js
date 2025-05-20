var origin = ''

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

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
        url.pathname.replaceAll('/' + origin, '') +
        url.search
    )

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
    }

    console.log('Proxying ' + url.href + ' to ' + newUrl.href)

    // Adding the base tag to all pages to make relative paths works
    if (
        event.request.destination === 'document' ||
        event.request.headers.get('Accept').includes('text/html')
    ) {
        event.respondWith(
            fetch(newUrl, requestOptions).then(res => {
                return res.text().then(html => {
                    // var directory = newUrl.pathname.substring(0, newUrl.pathname.lastIndexOf('/') + 1)
                    var directory = newUrl.pathname.replace(origin + '/', '') // Not works if the page have an extension like /path/to/a/page/index.html but who cares ? (a lot of websites)
                    if (!directory.endsWith('/')) {
                        directory = directory + '/'
                    }
                    const hasBaseTag = html.includes('<base')

                    var newHtml
                    if (hasBaseTag) {
                        newHtml = html.replace(/<base[^>]*>/, `<base href="${directory}">`)
                    } else {
                        newHtml = html.replace('<head>', `<head><base href="${directory}">`)
                    }

                    return new Response(newHtml, {
                        status: res.status,
                        statusText: res.statusText,
                        headers: res.headers
                    })
                })
            })
        )
    } else {
        event.respondWith(fetch(newUrl, requestOptions));
    }
});

self.addEventListener('message', e => {
    origin = e.data
});