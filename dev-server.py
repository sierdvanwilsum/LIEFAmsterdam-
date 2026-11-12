"""Lokale ontwikkelserver met dezelfde app-routes als Vercel."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from sys import argv
from urllib.parse import urlsplit


class AppHandler(SimpleHTTPRequestHandler):
    def rewrite_app_route(self):
        parts = [part for part in urlsplit(self.path).path.split("/") if part]
        app_route = (
            parts[:1] == ["auth"]
            or parts == ["notifications"]
            or parts == ["planning"]
            or len(parts) == 2 and parts[0] == "my-shifts"
            or len(parts) == 4 and parts[0] == "events" and parts[2] == "shifts"
        )
        if app_route:
            self.path = "/index.html"

    def do_GET(self):
        self.rewrite_app_route()
        super().do_GET()

    def do_HEAD(self):
        self.rewrite_app_route()
        super().do_HEAD()


if __name__ == "__main__":
    port = int(argv[1]) if len(argv) > 1 else 8765
    print(f"LIEF Crew lokaal: http://127.0.0.1:{port}/", flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), AppHandler).serve_forever()
