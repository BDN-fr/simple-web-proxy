const permissiveCSP = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
    "script-src * 'unsafe-inline' 'unsafe-eval'; " +
    "style-src * 'unsafe-inline'; " +
    "img-src * data: blob:; " +
    "font-src *; " +
    "connect-src *; " +
    "frame-src *;"

const quitHtml = `\
<div style='position: fixed; left: 0px; bottom: 0px; z-index: 99999; font-family: Arial, Helvetica, sans-serif; font-weight: 400; font-size: 14px;'>
    <button
    id='quit-proxy'
    style='background-color: #5BCFFF; color: #222222; border: none; height: 2rem; width: auto; border-radius: 15px; padding: 5px; margin: 0;'
    >
        Quit proxy
    </button>
</div>
<script>
document.getElementById('quit-proxy').addEventListener('click', ev => {
    navigator.serviceWorker.getRegistration().then(function(registration) {
        if (registration) {
            registration.unregister()
                .then(function() {
                    window.location.href = '/'
                })
                .catch(function(error) {
                    console.error('Service Worker unregistration failed:', error);
                })
        } else {
            window.location.href = '/'
        }
    })
})
</script>
`

var origin = ''

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', async event => {
    if (origin=='') return
    const url = new URL(event.request.url);
    if (url.href.startsWith(self.location.origin + '/web/')) return

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

    // Modifying the HTML page
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
                    newHtml = newHtml.replace('</body>', quitHtml + '</body>')

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