import requests
from urllib.parse import urlparse
from flask import Flask, request, jsonify, Response, render_template

app = Flask(__name__)
app.static_folder = 'static'

@app.route('/web/<path:path>')
def web(path):
    return render_template('index.html')

@app.route('/')
@app.route("/<path:path>", methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def proxy(path:str):
    if path == 'proxy-sw.js':
        return app.send_static_file(path)

    # Almost otally taken from https://stackoverflow.com/a/36601467
    res = requests.request(  # ref. https://stackoverflow.com/a/36601467/248616
        method          = request.method,
        url             = path,
        headers         = {k:v for k,v in request.headers if k.lower() != 'host'}, # exclude 'host' header
        data            = request.get_data(),
        cookies         = request.cookies,
        allow_redirects = True,
    )

    excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']  #NOTE we here exclude all "hop-by-hop headers" defined by RFC 2616 section 13.5.1 ref. https://www.rfc-editor.org/rfc/rfc2616#section-13.5.1
    headers          = [
        (k,v) for k,v in res.raw.headers.items()
        if k.lower() not in excluded_headers
    ]

    response = Response(res.content, res.status_code, headers)

    return response

if __name__ == '__main__':
    app.run('127.0.0.1', 5000, False)