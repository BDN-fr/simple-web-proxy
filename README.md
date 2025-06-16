# simple-web-proxy
You can install the server with Docker with the [Dockerfile](/Dockerfile)
The server is accessible from the port 5000

## Usage

With a web browser: `https://example.org/`  
With a web browser but with an instant redirect: `https://example.org/web/https://example.net/some/path`  
Single request: `https://example.org/https://example.net/some/path`