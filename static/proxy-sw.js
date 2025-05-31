const permissiveCSP = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
    "script-src * 'unsafe-inline' 'unsafe-eval'; " +
    "style-src * 'unsafe-inline'; " +
    "img-src * data: blob:; " +
    "font-src *; " +
    "connect-src *; " +
    "frame-src *;"

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

                    var newHtml
                    const hasBaseTag = html.includes('<base')
                    if (hasBaseTag) {
                        newHtml = html.replace(/<base[^>]*>/, `<base href="${directory}">`)
                    } else {
                        newHtml = html.replace('<head>', `<head><base href="${directory}">`)
                    }

                    var newHeaders = new Headers(res.headers)
                    newHeaders.delete('content-security-policy')
                    newHeaders.delete('content-security-policy-report-only')
                    newHeaders.delete('x-content-security-policy')
                    newHeaders.delete('x-webkit-csp')
                    newHeaders.delete('x-frame-options')
                    newHeaders.delete('x-content-type-options')
                    newHeaders.delete('referrer-policy')
                    newHeaders.set('Content-Security-Policy', permissiveCSP)

                    return new Response(newHtml, {
                        status: res.status,
                        statusText: res.statusText,
                        headers: newHeaders
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