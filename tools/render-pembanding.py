# -*- coding: utf-8 -*-
"""Render PNG berlatar transparan dua perangkat pembanding di halaman Komparasi Sistem.

    python 5-WEBSITE/serve.py                    # terminal lain (port 8130)
    python 5-WEBSITE/tools/render-pembanding.py

Modelnya dibangun tools/pembanding-3d.html — Handy Talky dan node mesh GENERIK
(bentuk dasar buatan sendiri, bukan tiruan produk atau merek), digambar oleh
mesin 3D tim yang sama dengan render Point Rescue supaya ketiganya serumpun.

Hasilnya assets/img/komparasi-ht.png dan komparasi-mesh.png, dipotong rapat ke
isi gambarnya dan diturunkan ke tinggi 640 px (cukup untuk layar 3×).

    --port 8130      port serve.py
    --tinggi 640     tinggi PNG akhir (piksel)
    --keluaran DIR   simpan di tempat lain (mis. untuk mencoba pose)
    --qs "rz=-0.5"   tambahan query ke halaman model: rx ry rz (pose), cx cy (arah kamera), isi, key
"""

import argparse
import os
import sys

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit("Butuh Playwright:  pip install playwright")
try:
    from PIL import Image
except ImportError:
    sys.exit("Butuh Pillow:  pip install pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DAFTAR = [("ht", "komparasi-ht"), ("mesh", "komparasi-mesh")]


def potong_dan_kecilkan(jalur, tinggi, margin=0.035):
    im = Image.open(jalur).convert("RGBA")
    x0, y0, x1, y1 = im.getchannel("A").getbbox()
    m = int(max(x1 - x0, y1 - y0) * margin)
    im = im.crop((max(0, x0 - m), max(0, y0 - m), min(im.width, x1 + m), min(im.height, y1 + m)))
    im = im.resize((round(im.width * tinggi / im.height), tinggi), Image.LANCZOS)
    im.save(jalur, optimize=True)
    return im.size


def main():
    for aliran in (sys.stdout, sys.stderr):
        try:
            aliran.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    ap = argparse.ArgumentParser(description="Render PNG transparan Handy Talky dan node mesh generik")
    ap.add_argument("--port", type=int, default=8130)
    ap.add_argument("--tinggi", type=int, default=640)
    ap.add_argument("--keluaran", default=os.path.join(ROOT, "assets", "img"))
    ap.add_argument("--qs", default="")
    args = ap.parse_args()
    os.makedirs(args.keluaran, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True, args=["--enable-unsafe-swiftshader", "--force-color-profile=srgb"])
        ctx = browser.new_context(viewport={"width": 1000, "height": 1000}, device_scale_factor=2)
        pg = ctx.new_page()
        galat = []
        pg.on("pageerror", lambda e: galat.append(str(e)[:200]))
        for kode, nama in DAFTAR:
            pg.goto("http://localhost:%d/tools/pembanding-3d.html?m=%s%s" % (args.port, kode, ("&" + args.qs) if args.qs else ""), wait_until="load")
            pg.wait_for_function("() => document.title === 'siap'", timeout=90000)
            pg.evaluate("() => window.__pb.tunggu(10)")
            pg.wait_for_timeout(300)
            jalur = os.path.join(args.keluaran, nama + ".png")
            pg.screenshot(path=jalur, omit_background=True)
            w, h = potong_dan_kecilkan(jalur, args.tinggi)
            print("%-14s %d x %d  %d B  -> %s" % (nama, w, h, os.path.getsize(jalur), jalur))
        browser.close()
    if galat:
        print("\nGALAT HALAMAN:")
        for g in galat[:5]:
            print("  ", g)
        sys.exit(1)


if __name__ == "__main__":
    main()
