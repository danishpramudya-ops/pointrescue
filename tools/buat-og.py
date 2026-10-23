# -*- coding: utf-8 -*-
"""Render kartu pratinjau tautan (1200 × 630) dari templat HTML-nya di tools/:

    tools/og-card.html       →  assets/img/og-card.jpg        situs utama dan halaman tautan
    tools/og-komparasi.html  →  assets/img/og-komparasi.jpg   halaman komparasi

Gambar itu yang tampil sebagai pratinjau saat tautan dibagikan di WhatsApp, Instagram,
LinkedIn, atau Telegram — dirujuk lewat <meta property="og:image"> di index.html,
link/index.html, dan komparasi/index.html (alamatnya mutlak, jadi ikut diganti kalau
situs pindah alamat).

    pip install playwright        # driver-nya saja; Chrome yang terpasang dipakai
    python tools/buat-og.py

Fontnya (Archivo) diambil dari Google Fonts saat dirender, jadi butuh
internet. Kalau gagal dimuat, skrip ini berhenti alih-alih diam-diam menyimpan kartu
dengan font pengganti.
"""

import os
import sys

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit("Butuh Playwright:  pip install playwright")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KARTU = [("og-card.html", "og-card.jpg"), ("og-komparasi.html", "og-komparasi.jpg")]


def main():
    for aliran in (sys.stdout, sys.stderr):
        try:
            aliran.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome", headless=True, args=["--force-color-profile=srgb"])
        page = b.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
        for sumber, hasil in KARTU:
            jalur = os.path.join(ROOT, "tools", sumber)
            keluar = os.path.join(ROOT, "assets", "img", hasil)
            page.goto("file:///" + jalur.replace("\\", "/"), wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            ok = page.evaluate("document.fonts.check('900 40px Archivo')")
            if not ok:
                b.close()
                sys.exit("Font Archivo tidak termuat (offline?) — kartu tidak disimpan.")
            page.wait_for_timeout(400)
            page.screenshot(path=keluar, type="jpeg", quality=88, clip={"x": 0, "y": 0, "width": 1200, "height": 630})
            print("tersimpan: %s  (%.0f KB)" % (keluar, os.path.getsize(keluar) / 1024))
        b.close()


if __name__ == "__main__":
    main()
