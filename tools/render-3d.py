# -*- coding: utf-8 -*-
"""Keluarkan PNG berlatar transparan dari model 3D Point Rescue.

Bahan infografis, poster, dan konten Instagram. Modelnya sama persis dengan
yang ada di bagian 04 situs — mesin 3D tim, casing dari OBJ hasil cetak,
part lain berukuran asli. Jalur tembaga PCB sengaja tidak ada.

    python 5-WEBSITE/serve.py              # terminal lain
    python 5-WEBSITE/tools/render-3d.py

Hasilnya di `tools/render/`. Latarnya benar-benar transparan (alfa penuh),
jadi bisa langsung ditempel di atas warna atau foto apa pun.

    --port 8130       port serve.py
    --sisi 2400       sisi terpanjang PNG dalam piksel
    --hanya iso       cuma render satu sudut
"""

import argparse
import os
import sys

import json

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit("Butuh Playwright:  pip install playwright")

try:
    from PIL import Image
except ImportError:
    Image = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (nama berkas, sudut, explode 0–1, ghost, isi bingkai, pose berdiri)
DAFTAR = [
    ("unit-iso",            "iso",      0.00, False, 1.00, False),
    ("unit-depan",          "depan",    0.00, False, 1.00, False),
    ("unit-samping",        "samping",  0.00, False, 1.00, False),
    ("unit-atas",           "atas",     0.00, False, 1.00, False),
    ("unit-belakang",       "belakang", 0.00, False, 1.00, False),
    ("unit-tiga-perempat",  "tiga4",    0.00, False, 1.00, False),

    ("bongkar-30-iso",      "iso",      0.30, False, 1.05, False),
    ("bongkar-60-iso",      "iso",      0.60, False, 1.02, False),
    ("bongkar-penuh-iso",   "iso",      1.00, False, 1.00, False),
    ("bongkar-penuh-depan", "depan",    1.00, False, 1.00, False),
    ("bongkar-penuh-samping", "samping", 1.00, False, 1.00, False),

    ("tembus-iso",          "iso",      0.00, True,  1.00, False),
    ("tembus-bongkar-iso",  "iso",      0.55, True,  1.02, False),

    # pose berdiri — bahan poster dan feed Instagram yang potret
    ("poster-berdiri",         "iso",   0.00, False, 1.00, True),
    ("poster-berdiri-depan",   "depan", 0.00, False, 1.00, True),
    ("poster-berdiri-bongkar", "iso",   0.45, False, 1.00, True),
]


def potong(jalur, margin=0.04):
    """Potong rapat ke piksel yang benar-benar terisi, sisakan margin tipis.

    Tanpa ini tiap PNG penuh ruang kosong transparan dan harus dirapikan lagi
    di Canva. Marginnya proporsional, jadi tiap berkas punya nafas yang sama.
    """
    im = Image.open(jalur).convert("RGBA")
    kotak = im.getchannel("A").getbbox()
    if not kotak:
        return im.size
    x0, y0, x1, y1 = kotak
    m = int(max(x1 - x0, y1 - y0) * margin)
    kotak = (max(0, x0 - m), max(0, y0 - m),
             min(im.width, x1 + m), min(im.height, y1 + m))
    im.crop(kotak).save(jalur)
    return "%d x %d" % (kotak[2] - kotak[0], kotak[3] - kotak[1])


def main():
    for aliran in (sys.stdout, sys.stderr):
        try:
            aliran.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    ap = argparse.ArgumentParser(description="Render PNG transparan model 3D Point Rescue")
    ap.add_argument("--port", type=int, default=8130)
    ap.add_argument("--sisi", type=int, default=2400, help="sisi terpanjang PNG (piksel)")
    ap.add_argument("--hanya", default="", help="render hanya sudut ini")
    ap.add_argument("--keluaran", default=os.path.join(ROOT, "tools", "render"))
    ap.add_argument("--warna-asli", action="store_true",
                    help="pakai warna casing apa adanya, tanpa diangkat ke slate")
    ap.add_argument("--tanpa-potong", action="store_true",
                    help="jangan potong rapat ke isi gambar")
    args = ap.parse_args()

    os.makedirs(args.keluaran, exist_ok=True)

    # Dirender pada viewport sedang lalu dikalikan device scale factor —
    # jauh lebih ringan daripada viewport raksasa, hasil piksel sama.
    skala = 3
    vw = max(600, args.sisi // skala)
    daftar = [d for d in DAFTAR if not args.hanya or d[1] == args.hanya]

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True, args=[
            "--enable-unsafe-swiftshader",
            "--force-color-profile=srgb",
        ])
        ctx = browser.new_context(
            viewport={"width": vw, "height": vw},
            device_scale_factor=skala,
        )
        pg = ctx.new_page()
        galat = []
        pg.on("pageerror", lambda e: galat.append(str(e)[:200]))
        pg.goto("http://localhost:%d/proto/render.html" % args.port, wait_until="load")

        pg.wait_for_function("() => document.title === 'siap'", timeout=90000)
        pg.wait_for_timeout(1200)

        if args.warna_asli:
            pg.evaluate("() => window.__pr.warna(false)")

        # daftar 17 part + spesifikasinya, bahan menulis label infografis
        part = pg.evaluate("() => window.__pr.daftarPart()")
        with open(os.path.join(args.keluaran, "_part.json"), "w", encoding="utf-8") as f:
            json.dump(part, f, indent=1, ensure_ascii=False)
        baris = ["%-6s %-26s %s" % (p_["id"], p_["nama"], p_.get("spec") or "") for p_ in part]
        with open(os.path.join(args.keluaran, "_part.txt"), "w", encoding="utf-8") as f:
            f.write(chr(10).join(baris) + chr(10))

        for nama, sudut, explode, ghost, isi, miring in daftar:
            pg.evaluate(
                "([s, e, g, i, t]) => window.__pr.pasang(s, e, g, i, t)",
                [sudut, explode, ghost, isi, miring],
            )
            pg.evaluate("() => window.__pr.tunggu(8)")
            pg.wait_for_timeout(220)
            jalur = os.path.join(args.keluaran, nama + ".png")
            # omit_background = latar halaman dibuang, alfa dipertahankan
            pg.screenshot(path=jalur, omit_background=True)
            ukuran = potong(jalur) if (Image and not args.tanpa_potong) else None
            print("%-22s %-9s %s" % (nama, sudut, ukuran or ""))

        browser.close()

    if galat:
        print("\nGALAT HALAMAN:")
        for g in galat[:5]:
            print("  ", g)

    print("\n%d PNG dipotong rapat (kanvas render %d px) -> %s"
          % (len(daftar), vw * skala, args.keluaran))
    print("Latarnya transparan; siap ditempel di atas warna atau foto apa pun.")
    print("Daftar 17 part untuk label ada di _part.txt dan _part.json.")


if __name__ == "__main__":
    main()
