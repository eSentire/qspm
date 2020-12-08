#!/usr/bin/env python3
'''
WASM based web server.
'''
import sys
import http.server
import socketserver


def main():
    'main'
    port = 8000 if len(sys.argv) == 1 else int(sys.argv[1])
    print(f'serving {port}')

    # Newer versions of python have .wasm built in
    # but this won't hurt.
    handler = http.server.SimpleHTTPRequestHandler
    if sys.version_info.major == 3 and sys.version_info.minor < 8:
        # Fixed in 3.8.
        # https://bugs.python.org/issue31670
        handler.extensions_map.update({
            '.wasm': 'application/wasm',
        })

    try:
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("", port), handler) as httpd:
            httpd.allow_reuse_address = True
            httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n^C interrupt\nStopped')
    except OSError as exc:
        num = 0
        xport = port
        while True:
            xport += 1
            num += 1
            try:
                socketserver.TCPServer(("", xport), handler)
                break
            except OSError:
                if num > 50:
                    # No internet access?
                    port = 0
                    break
        print(f'ERROR: Address {port} is already in use.')
        print(f'       {exc}')
        if xport > 0:
            print(f'       Try running "make server PORT={xport}" or "tools/server.py {xport}".')


if __name__ == '__main__':
    main()
