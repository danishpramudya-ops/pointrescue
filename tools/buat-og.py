# -*- coding: utf-8 -*-
"""Render tools/og-card.html menjadi assets/img/og-card.jpg (1200 × 630).

Gambar itu yang tampil sebagai pratinjau saat tautan situs atau halaman tautan resmi
dibagikan di WhatsApp, Instagram, LinkedIn, atau Telegram — dirujuk lewat <meta
property="og:image"> di index.html dan link/index.html (alamatnya mutlak, jadi ikut
diganti kalau situs pindah alamat).

    pip install playwright        # driver-nya saja; Chrome yang terpasang dipakai
    python tools/buat-og.py

Fontnya (Archivo, JetBrains Mono) diambil dari Google Fonts saat dirender, jadi butuh
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
SUMBER = os.path.join(ROOT, "tools", "og-card.html")
HASIL = os.path.join(ROOT, "assets", "img", "og-card.jpg")


def main():
    for aliran in (sys.stdout, sys.stderr):
        try:
            aliran.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome", headless=True, args=["--force-color-profile=srgb"])
        page = b.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
        page.goto("file:///" + SUMBER.replace("\\", "/"), wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        ok = page.evaluate("document.fonts.check('800 40px Archivo') && document.fonts.check('600 20px \"JetBrains Mono\"')")
        if not ok:
            b.close()
            sys.exit("Font Archivo / JetBrains Mono tidak termuat (offline?) — kartu tidak disimpan.")
        page.wait_for_timeout(400)
        page.screenshot(path=HASIL, type="jpeg", quality=88, clip={"x": 0, "y": 0, "width": 1200, "height": 630})
        b.close()
    print("tersimpan: %s  (%.0f KB)" % (HASIL, os.path.getsize(HASIL) / 1024))


if __name__ == "__main__":
    main()
