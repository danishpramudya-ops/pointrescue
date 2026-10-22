"""Server statis untuk situs POINT RESCUE.

Beda dengan `python -m http.server`: server ini mengirim header no-cache,
sehingga perubahan CSS/JS langsung terlihat tanpa perlu hard-reload. Sepanjang
pengembangan, cache browser berkali-kali membuat halaman tampak "tidak berubah"
padahal berkasnya sudah diperbarui.

Jalankan dari folder POINTRESCUE-FINAL:

    python 5-WEBSITE/serve.py

lalu buka http://localhost:8130
"""

import argparse
import http.server
import os
import socketserver
import threading
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # sunyikan log per-permintaan; hanya galat yang ditampilkan
        if not str(args[1] if len(args) > 1 else "").startswith(("4", "5")):
            return
        super().log_message(fmt, *args)


def main() -> None:
    # Saat keluarannya dialirkan ke pipa, Windows memakai cp1252 dan panah "→"
    # di bawah membuat server mati sebelum sempat melayani apa pun.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    ap = argparse.ArgumentParser(description="Server statis tanpa cache untuk situs Point Rescue")
    ap.add_argument("--port", type=int, default=8130)
    args = ap.parse_args()

    class Server(socketserver.ThreadingTCPServer):
        # satu permintaan pada satu waktu membuat halaman dengan banyak aset
        # (iframe viewer 3D, dashboard, video) saling menunggu sampai time out.
        allow_reuse_address = True
        daemon_threads = True

    try:
        with Server(("", args.port), Handler) as httpd:
            print(f"POINT RESCUE  →  http://localhost:{args.port}")
            print(f"Menyajikan    :  {ROOT}")
            print("Cache dimatikan. Ctrl+C untuk berhenti.\n")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nBerhenti.")
    except OSError as e:
        print(f"Gagal membuka port {args.port}: {e}")
        print("Port mungkin sedang dipakai. Coba: python 5-WEBSITE/serve.py --port 8131")
        sys.exit(1)


if __name__ == "__main__":
    main()
