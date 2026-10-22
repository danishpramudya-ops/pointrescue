# -*- coding: utf-8 -*-
"""Bangkitkan garis kontur topografi sebagai SVG untuk latar seksi.

    python 5-WEBSITE/tools/kontur.py

Menulis dua berkas ke assets/img/:

    kontur-terang.svg   garis tinta tipis, untuk seksi berlatar terang
    kontur-gelap.svg    garis biru tipis, untuk seksi berlatar gelap

KENAPA KONTUR. Seksi terang situs ini rata abu-abu polos dan tiga-tiganya
berurutan, sementara seksi gelap memakai gradien radial yang persis sama
sehingga terasa berulang. Yang dibutuhkan tekstur yang menambah kedalaman
tanpa merebut perhatian — dan garis kontur adalah bahasa visual peta
pencarian, jadi ia bukan hiasan yang ditempel dari luar.

BUKAN POLA YANG DIULANG. Pola kecil yang di-repeat selalu ketahuan
jahitannya. Di sini medannya benar-benar dihitung — jumlah beberapa gundukan
gauss ditambah punggungan sinus — lalu garis isonya ditarik dengan marching
squares. Satu gambar besar, tidak berulang, tidak ada jahitan.
"""

import io
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

W, H = 1600, 1100          # viewBox
KOTAK = 8                  # kerapatan sampel; makin kecil makin halus, makin berat
TINGKAT = 15               # jumlah garis kontur


def medan(x, y):
    """Ketinggian di satu titik. Gundukan + punggungan, bukan noise acak —
    hasilnya lebih menyerupai lereng dan lembah daripada bintik."""
    nx, ny = x / W, y / H
    z = 0.0
    # beberapa puncak dengan tinggi dan lebar berbeda
    for cx, cy, amp, sig in (
        (0.18, 0.30, 1.00, 0.26),
        (0.62, 0.18, 0.82, 0.20),
        (0.86, 0.55, 0.95, 0.24),
        (0.40, 0.72, 0.70, 0.22),
        (0.08, 0.85, 0.60, 0.19),
        (0.72, 0.92, 0.55, 0.17),
    ):
        d2 = (nx - cx) ** 2 + (ny - cy) ** 2
        z += amp * math.exp(-d2 / (2 * sig * sig))
    # punggungan panjang yang memiringkan seluruh medan
    z += 0.22 * math.sin(nx * 3.1 + ny * 1.7)
    z += 0.13 * math.sin(nx * 6.4 - ny * 4.2 + 1.2)
    return z


def marching_squares(grid, gw, gh, level):
    """Kembalikan potongan garis pada satu ketinggian.

    Tiap kotak 2x2 diperiksa: sisi mana yang dilintasi garis iso itu, dan di
    titik mana persisnya (interpolasi linier antar sudut). Kasus ambigu
    (sudut berseberangan) sengaja dipecah lewat rata-rata keempat sudutnya,
    supaya garisnya tidak pernah menyilang sendiri.
    """
    seg = []

    def ip(p1, p2, v1, v2):
        if abs(v1 - v2) < 1e-12:
            return p1
        t = (level - v1) / (v2 - v1)
        return (p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t)

    for j in range(gh - 1):
        for i in range(gw - 1):
            v = (grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i])
            p = ((i * KOTAK, j * KOTAK), ((i + 1) * KOTAK, j * KOTAK),
                 ((i + 1) * KOTAK, (j + 1) * KOTAK), (i * KOTAK, (j + 1) * KOTAK))
            idx = 0
            for k in range(4):
                if v[k] > level:
                    idx |= 1 << k
            if idx in (0, 15):
                continue
            a = ip(p[0], p[1], v[0], v[1])   # sisi atas
            b = ip(p[1], p[2], v[1], v[2])   # sisi kanan
            c = ip(p[2], p[3], v[2], v[3])   # sisi bawah
            d = ip(p[3], p[0], v[3], v[0])   # sisi kiri
            if idx in (1, 14):
                seg.append((d, a))
            elif idx in (2, 13):
                seg.append((a, b))
            elif idx in (3, 12):
                seg.append((d, b))
            elif idx in (4, 11):
                seg.append((b, c))
            elif idx in (6, 9):
                seg.append((a, c))
            elif idx in (7, 8):
                seg.append((c, d))
            elif idx == 5 or idx == 10:
                tengah = sum(v) / 4
                if (tengah > level) == (idx == 5):
                    seg.append((d, a)); seg.append((b, c))
                else:
                    seg.append((a, b)); seg.append((c, d))
    return seg


def rangkai(seg):
    """Sambung potongan jadi jalur panjang. Tanpa ini SVG-nya berisi ribuan
    <line> pendek dan ukurannya membengkak berkali lipat."""
    kunci = lambda p: (round(p[0], 2), round(p[1], 2))
    sisa = {}
    for a, b in seg:
        sisa.setdefault(kunci(a), []).append((a, b))
        sisa.setdefault(kunci(b), []).append((b, a))
    dipakai = set()
    jalur = []
    for a, b in seg:
        if (kunci(a), kunci(b)) in dipakai or (kunci(b), kunci(a)) in dipakai:
            continue
        titik = [a, b]
        dipakai.add((kunci(a), kunci(b)))
        for _ in range(2):                      # rangkai maju, lalu mundur
            while True:
                ujung = titik[-1]
                lanjut = None
                for p, q in sisa.get(kunci(ujung), []):
                    if (kunci(p), kunci(q)) in dipakai or (kunci(q), kunci(p)) in dipakai:
                        continue
                    lanjut = (p, q); break
                if not lanjut:
                    break
                dipakai.add((kunci(lanjut[0]), kunci(lanjut[1])))
                titik.append(lanjut[1])
            titik.reverse()
        if len(titik) > 3:
            jalur.append(titik)
    return jalur


def svg(jalur, warna, tebal, alfa):
    d = []
    for t in jalur:
        bagian = ["M%.1f %.1f" % t[0]]
        for p in t[1:]:
            bagian.append("L%.1f %.1f" % p)
        d.append(" ".join(bagian))
    isi = "".join('<path d="%s"/>' % p for p in d)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" '
        'width="%d" height="%d" preserveAspectRatio="xMidYMid slice">'
        '<g fill="none" stroke="%s" stroke-width="%s" stroke-opacity="%s" '
        'stroke-linejoin="round" stroke-linecap="round">%s</g></svg>'
        % (W, H, W, H, warna, tebal, alfa, isi)
    )


def main():
    for aliran in (sys.stdout, sys.stderr):
        try:
            aliran.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    gw, gh = W // KOTAK + 1, H // KOTAK + 1
    grid = [[medan(i * KOTAK, j * KOTAK) for i in range(gw)] for j in range(gh)]
    lo = min(min(r) for r in grid)
    hi = max(max(r) for r in grid)

    jalur = []
    for k in range(1, TINGKAT + 1):
        level = lo + (hi - lo) * k / (TINGKAT + 1)
        jalur += rangkai(marching_squares(grid, gw, gh, level))

    keluar = os.path.join(ROOT, "assets", "img")
    os.makedirs(keluar, exist_ok=True)
    for nama, warna, tebal, alfa in (
        ("kontur-terang.svg", "#0f4489", "1.6", "0.30"),
        ("kontur-gelap.svg", "#7fb4ff", "1.6", "0.42"),
    ):
        p = os.path.join(keluar, nama)
        io.open(p, "w", encoding="utf-8", newline="\n").write(
            svg(jalur, warna, tebal, alfa))
        print("%-20s %6.1f KB" % (nama, os.path.getsize(p) / 1024))

    print("%d jalur, %d tingkat" % (len(jalur), TINGKAT))


if __name__ == "__main__":
    main()
