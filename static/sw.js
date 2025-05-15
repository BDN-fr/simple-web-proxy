// https://stackoverflow.com/q/68381113
var requestedUrl = new URL(window.location.pathname.substring(1))
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    // console.log(url.host, '\n', url.hostname, '\n', url.origin, '\n', url.pathname, '\n', url.protocol)
    // const newUrl = new URL('/' + (url.host && url.href) || url.pathname);
    // console.log(newUrl.href);
    // event.respondWith(fetch(newUrl));
    event.preventDefault()
    return
});