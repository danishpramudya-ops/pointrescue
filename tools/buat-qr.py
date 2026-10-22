# -*- coding: utf-8 -*-
"""Bangkitkan kode QR resmi Point Rescue (situs + halaman tautan) dan UJI bahwa terbaca.

    pip install segno pillow zxing-cpp
    python tools/buat-qr.py

Alamat dasarnya dibaca dari <link rel="canonical"> di index.html — satu sumber
kebenaran. Kalau situs pindah alamat: ganti canonical dan og:* di index.html dan
link/index.html, jalankan tools/buat-og.py bila perlu, lalu jalankan skrip ini.
KODE QR YANG SUDAH DICETAK TIDAK BISA DIUBAH — karena itu alamatnya harus final
sebelum dicetak.

Keluaran di qr/:
    pointrescue-situs.svg / .png        situs utama
    pointrescue-linktree.svg / .png     halaman tautan resmi (link/)
    ...-polos.svg / .png                varian tanpa logo, untuk cetakan sangat kecil

Pilihan rancangan:
  - Koreksi galat tingkat H (±30%): logo di tengah menutup < 7% modul, jauh di bawah batas.
  - Modul navy #093261 di atas putih #ffffff (kontras ≈ 13:1); zona tenang 4 modul.
  - Kotak putih pelindung logo selebar bilangan modul ganjil dan sejajar kisi modul,
    jadi tidak ada modul yang tertutup separuh.
  - SETIAP berkas PNG diuji dibaca ulang oleh pemindai ZXing — ukuran asli, diperkecil
    sampai 150 px, diburamkan, dikompres JPEG kasar, dan diputar. Satu saja gagal,
    skrip berhenti dengan kode 1 alih-alih menyimpan kode yang tak bisa dipindai.
"""

import base64
import io
import os
import re
import sys

try:
    import segno
    import zxingcpp
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    sys.exit("Butuh:  pip install segno pillow zxing-cpp")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KELUAR = os.path.join(ROOT, "qr")
LOGO = os.path.join(ROOT, "assets", "img", "logo-mark.png")
GELAP, TERANG = "#093261", "#ffffff"
SKALA_PNG = 24           # piksel per modul -> ±1200 px
KOTAK_LOGO = 9           # modul, ganjil


def alamat_dasar():
    html = io.open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    m = re.search(r'<link rel="canonical" href="(https://[^"]+/)">', html)
    if not m:
        sys.exit('index.html tidak punya <link rel="canonical" href="https://…/">')
    return m.group(1)


def kotak_logo(logo, sisi_px):
    """Logo di dalam kotak putih bersudut membulat; rasio logo dijaga."""
    kotak = Image.new("RGBA", (sisi_px, sisi_px), (0, 0, 0, 0))
    d = ImageDraw.Draw(kotak)
    d.rounded_rectangle((0, 0, sisi_px - 1, sisi_px - 1), radius=int(sisi_px * 0.16), fill=TERANG)
    pad = int(sisi_px * 0.12)
    isi = sisi_px - 2 * pad
    w, h = logo.size
    k = min(isi / w, isi / h)
    lg = logo.resize((max(1, int(w * k)), max(1, int(h * k))), Image.LANCZOS)
    kotak.alpha_composite(lg, ((sisi_px - lg.width) // 2, (sisi_px - lg.height) // 2))
    return kotak


def buat(url, nama, dengan_logo):
    qr = segno.make(url, error="h", micro=False)
    n = qr.symbol_size(border=0)[0]                      # jumlah modul per sisi
    tot = n + 8                                           # + zona tenang 4 + 4

    # ── PNG ────────────────────────────────────────────────────────────
    buf = io.BytesIO()
    qr.save(buf, kind="png", scale=SKALA_PNG, border=4, dark=GELAP, light=TERANG)
    im = Image.open(io.BytesIO(buf.getvalue())).convert("RGBA")
    logo = Image.open(LOGO).convert("RGBA")
    if dengan_logo:
        sisi = KOTAK_LOGO * SKALA_PNG
        kotak = kotak_logo(logo, sisi)
        x = (im.width - sisi) // 2
        im.alpha_composite(kotak, (x, x))
    png = os.path.join(KELUAR, "%s.png" % nama)
    im.convert("RGB").save(png, optimize=True)

    # ── SVG (vektor, untuk cetak) ──────────────────────────────────────
    buf = io.BytesIO()
    qr.save(buf, kind="svg", scale=1, border=4, dark=GELAP, light=TERANG, xmldecl=False, svgns=True, nl=False)
    svg = buf.getvalue().decode("utf-8")
    if dengan_logo:
        a = (tot - KOTAK_LOGO) / 2.0
        pad = KOTAK_LOGO * 0.12
        isi = KOTAK_LOGO - 2 * pad
        w, h = logo.size
        k = min(isi / w, isi / h)
        lw, lh = w * k, h * k
        lb = io.BytesIO()
        logo.save(lb, format="PNG", optimize=True)
        b64 = base64.b64encode(lb.getvalue()).decode("ascii")
        tambah = ('<rect x="%.3f" y="%.3f" width="%d" height="%d" rx="%.3f" fill="%s"/>'
                  '<image x="%.3f" y="%.3f" width="%.3f" height="%.3f" href="data:image/png;base64,%s"/>'
                  % (a, a, KOTAK_LOGO, KOTAK_LOGO, KOTAK_LOGO * 0.16, TERANG,
                     a + (KOTAK_LOGO - lw) / 2, a + (KOTAK_LOGO - lh) / 2, lw, lh, b64))
        svg = svg.replace("</svg>", tambah + "</svg>")
    with io.open(os.path.join(KELUAR, "%s.svg" % nama), "w", encoding="utf-8") as f:
        f.write(svg)

    return png, n, tot


def uji(png, url):
    """Baca ulang dengan pemindai sungguhan, di bawah beberapa gangguan."""
    asli = Image.open(png).convert("RGB")
    kasus = [("asli", asli)]
    for lebar in (600, 300, 150):
        kasus.append(("kecil %d px" % lebar, asli.resize((lebar, lebar), Image.LANCZOS)))
    kasus.append(("buram 2 px", asli.resize((400, 400), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2))))
    jpg = io.BytesIO()
    asli.resize((400, 400), Image.LANCZOS).save(jpg, format="JPEG", quality=28)
    kasus.append(("JPEG q28", Image.open(io.BytesIO(jpg.getvalue()))))
    kasus.append(("putar 7°", asli.resize((500, 500), Image.LANCZOS).rotate(7, expand=True, fillcolor="white")))
    gagal = []
    for nama, gambar in kasus:
        hasil = zxingcpp.read_barcodes(gambar)
        teks = hasil[0].text if hasil else None
        if teks != url:
            gagal.append((nama, teks))
    return gagal


def main():
    for aliran in (sys.stdout, sys.stderr):
        try:
            aliran.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    os.makedirs(KELUAR, exist_ok=True)
    dasar = alamat_dasar()
    sasaran = [("pointrescue-situs", dasar), ("pointrescue-linktree", dasar + "link/")]
    print("alamat dasar:", dasar, "\n")
    ada_gagal = False
    for nama, url in sasaran:
        for logo_ in (True, False):
            berkas = nama + ("" if logo_ else "-polos")
            png, n, tot = buat(url, berkas, logo_)
            gagal = uji(png, url)
            tutup = (KOTAK_LOGO ** 2) / float(tot ** 2) * 100 if logo_ else 0
            print("%-26s %2d modul · logo menutup %.1f%% · %s" % (berkas, n, tutup, "TERBACA di semua uji" if not gagal else "GAGAL"))
            for nm, tx in gagal:
                print("      x %-12s -> %r" % (nm, tx))
            ada_gagal = ada_gagal or bool(gagal)
        print("   ", url, "\n")
    if ada_gagal:
        sys.exit("Ada kode QR yang gagal diuji — jangan dipakai.")
    print("Semua kode QR lolos uji baca. Berkas di:", KELUAR)


if __name__ == "__main__":
    main()
