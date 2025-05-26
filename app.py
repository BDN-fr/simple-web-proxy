import requests
from urllib.parse import urlparse
from flask import Flask, request, jsonify, Response, render_template

app = Flask(__name__)
app.static_folder = 'static'

@app.route('/')
def root():
    return render_template('nopath.html')

@app.route('/web/<path:path>')
def web(path):
    if not urlparse(path).scheme:
        return 'Your url don\'t have a protocol', 400
    return render_template('redirect.html')

@app.route("/<path:path>", methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def proxy(path:str):
    if path == 'proxy-sw.js':
        return app.send_static_file(path)

    if not urlparse(path).scheme:
        return 'Your url don\'t have a protocol', 400

    # unwanted_headers = ['host', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest', 'pragma', 'connection', 'cache-control', 'dnt', 'rtt', 'downlink', 'referer', 'user-agent']
    # referer
    # Almost otally taken from https://stackoverflow.com/a/36601467
    try:
        res = requests.request(  # ref. https://stackoverflow.com/a/36601467/248616
            method          = request.method,
            url             = path,
            # headers         = {k:v for k,v in request.headers if not (k.lower() in unwanted_headers)}, # exclude 'host' header
            data            = request.get_data(),
            cookies         = request.cookies,
            allow_redirects = True,
        )
    except Exception as e:
        return e, 500

    # print({k:v for k,v in request.headers if not (k.lower() in unwanted_headers)})

    excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']  #NOTE we here exclude all "hop-by-hop headers" defined by RFC 2616 section 13.5.1 ref. https://www.rfc-editor.org/rfc/rfc2616#section-13.5.1
    headers          = [
        (k,v) for k,v in res.raw.headers.items()
        if k.lower() not in excluded_headers
    ]

    return Response(res.content, res.status_code, headers)

if __name__ == '__main__':
    app.run('127.0.0.1', 5000, False)