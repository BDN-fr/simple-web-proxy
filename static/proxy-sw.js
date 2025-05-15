// https://stackoverflow.com/q/68381113
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    var newUrl = new URL('/' + url.pathname);
    console.log(newUrl);
    event.respondWith(fetch(newUrl));
});