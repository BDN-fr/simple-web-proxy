import requests
from urllib.parse import urlparse
from flask import Flask, request, jsonify, Response, render_template

app = Flask(__name__)
app.static_folder = 'static'

@app.route('/static/<path:path>')
def static_handler(path):
    return app.send_static_file(path)

@app.route('/')
def index():
    if request.cookies['proxy-host']:
        return app.redirect('/'+request.cookies['proxy-host'])
    return 'You need to put the link', 400

@app.route("/<path:path>", methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def proxy(path:str):
    path_url = urlparse(path)

    if path_url.netloc == '' and request.cookies['proxy-host']:
        # path_url = urlparse(request.cookies['proxy-host']+path_url.path)
        newUrl = path_url.scheme+request.cookies['proxy-host']+'/'+ \
            path_url.path == '/'+request.cookies['proxy-host'] and '/' or path_url.path + \
            (path_url.params != '' and ('?'+path_url.params) or '') + \
            (path_url.fragment != '' and ('#'+path_url.fragment) or '')
        path_url = urlparse(newUrl)
    if path_url.scheme == '':
        path_url = urlparse('https://'+path)

    print(path_url)

    host = path_url.scheme + '://' + path_url.netloc

    print(host)

    path = host+path_url.path+ (path_url.params != '' and ('?'+path_url.params) or '/') + (path_url.fragment != '' and ('#'+path_url.fragment) or '')

    print(path)

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
    
    if response.content_type.find('text/html') != -1:
        # baseIndex = res.text.find('<base')
        # if baseIndex != -1:
        #     pass # TODO: modify the path
        end_head_index = res.text.find('</head>')
        base = f'    <base href="{request.full_path+'/'}">\n'
        content = res.text[:end_head_index-1] + base + res.text[end_head_index:]
        response = Response(content, res.status_code, headers)
        #TODO: insert the script for making the service worker

    if not request.referrer:
        response.set_cookie('proxy-host', host)

    return response

if __name__ == '__main__':
    app.run('127.0.0.1', 5000, False)