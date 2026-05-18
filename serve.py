"""SPA static server with API proxy for XYZW Web Helper."""
import http.server
import socketserver
import os
import sys
import urllib.request
import urllib.error
import json

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")

# Proxy config — mirrors worker.js
WEIXIN_UA = (
    "Mozilla/5.0 (Linux; Android 7.0; Mi-4c Build/NRD90M; wv) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.49 "
    "Mobile MQQBrowser/6.2 TBS/043632 Safari/537.36 MicroMessenger/6.6.1.1220(0x26060135) "
    "NetType/WIFI Language/zh_CN"
)

PROXIES = [
    {
        "prefix": "/api/weixin-long",
        "target": "https://long.open.weixin.qq.com",
        "headers": {
            "User-Agent": WEIXIN_UA,
            "Accept": "*/*",
            "Referer": "https://open.weixin.qq.com/",
        },
    },
    {
        "prefix": "/api/weixin",
        "target": "https://open.weixin.qq.com",
        "headers": {
            "User-Agent": WEIXIN_UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Referer": "https://open.weixin.qq.com/",
        },
    },
    {
        "prefix": "/api/hortor",
        "target": "https://comb-platform.hortorgames.com",
        "headers": {
            "User-Agent": (
                "Mozilla/5.0 (Linux; Android 12; 23117RK66C Build/V417IR; wv) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/95.0.4638.74 "
                "Mobile Safari/537.36"
            ),
            "Accept": "*/*",
            "Host": "comb-platform.hortorgames.com",
            "Connection": "keep-alive",
            "Content-Type": "text/plain; charset=utf-8",
            "Origin": "https://open.weixin.qq.com",
            "Referer": "https://open.weixin.qq.com/",
        },
    },
]
# Sort longest prefix first
PROXIES.sort(key=lambda p: len(p["prefix"]), reverse=True)

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
}


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_response(204)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        if self._try_proxy():
            return
        self._serve_static_or_spa()

    def do_POST(self):
        if self._try_proxy():
            return
        self._serve_static_or_spa()

    def _try_proxy(self):
        """Try to proxy the request. Returns True if proxied."""
        proxy = next((p for p in PROXIES if self.path.startswith(p["prefix"])), None)
        if not proxy:
            return False

        target_path = self.path[len(proxy["prefix"]):] or "/"
        target_url = proxy["target"].rstrip("/") + target_path
        if self.path.endswith("?") and not target_path.startswith("?"):
            pass  # query already in target_path from self.path

        try:
            data = None
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 0:
                data = self.rfile.read(content_length)

            req = urllib.request.Request(
                target_url,
                data=data,
                method=self.command,
            )

            # Copy proxy-specific headers (they override)
            for k, v in proxy["headers"].items():
                req.add_header(k, v)

            # Honor Content-Type from the original request (important for POST)
            ct = self.headers.get("Content-Type")
            if ct:
                req.add_header("Content-Type", ct)

            with urllib.request.urlopen(req, timeout=30) as resp:
                body = resp.read()
                self.send_response(resp.status)
                for k, v in CORS_HEADERS.items():
                    self.send_header(k, v)
                ct_resp = resp.headers.get("Content-Type")
                if ct_resp:
                    self.send_header("Content-Type", ct_resp)
                self.send_header("Content-Length", len(body))
                self.end_headers()
                self.wfile.write(body)
            return True

        except urllib.error.HTTPError as e:
            body = e.read()
            self.send_response(e.code)
            for k, v in CORS_HEADERS.items():
                self.send_header(k, v)
            self.send_header("Content-Length", len(body))
            self.end_headers()
            self.wfile.write(body)
            return True

        except Exception as e:
            err = json.dumps({"error": str(e)}).encode()
            self.send_response(502)
            for k, v in CORS_HEADERS.items():
                self.send_header(k, v)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", len(err))
            self.end_headers()
            self.wfile.write(err)
            return True

    def _serve_static_or_spa(self):
        """Serve a static file or fallback to index.html (SPA)."""
        parsed_path = self.path.split("?")[0].split("#")[0].lstrip("/")
        file_path = os.path.join(DIR, parsed_path) if parsed_path else os.path.join(DIR, "index.html")

        if os.path.isdir(file_path):
            file_path = os.path.join(file_path, "index.html")

        if os.path.isfile(file_path):
            self.path = "/" + os.path.relpath(file_path, DIR).replace("\\", "/")
        else:
            self.path = "/index.html"

        return super().do_GET()

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {args[0]}")


if __name__ == "__main__":
    print(f"Serving SPA + API proxy from {DIR}")
    print(f"Proxying: /api/weixin-long -> {PROXIES[2]['target']}")
    print(f"Proxying: /api/weixin      -> {PROXIES[1]['target']}")
    print(f"Proxying: /api/hortor      -> {PROXIES[0]['target']}")
    print(f"Listening on http://0.0.0.0:{PORT}")
    with socketserver.TCPServer(("0.0.0.0", PORT), SPAHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
