# -*- coding: utf-8 -*-
"""Bulatkan koordinat gateway di assets/validasi.js ke 3 desimal (± 110 m).

Tiap sesi uji menyimpan posisi gateway ("gw": {"lat", "lon"}) dengan 6 desimal — presisi
± 0,1 m. Beberapa sesi memakai "homebase", yang bisa jadi rumah atau kos anggota tim, dan
berkas ini disajikan terbuka di situs. Kode situs tidak memakai koordinat itu sama sekali
(grafiknya hanya butuh jarak dan RSSI yang sudah terhitung), jadi pembulatan tidak
mengubah satu pun grafik. Tiga desimal cukup untuk "daerah mana", tidak cukup untuk
"rumah mana".

    python tools/sanitasi-validasi.py            # terapkan
    python tools/sanitasi-validasi.py --periksa  # hanya cek; kode keluar 1 kalau masih presisi

assets/validasi.js adalah salinan data.js tim. Setiap kali disalin ulang dari sumbernya,
jalankan skrip ini lagi sebelum push.
"""

import argparse
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BERKAS = os.path.join(ROOT, "assets", "validasi.js")
POLA = re.compile(r'("gw":\s*\{\s*"lat":\s*)(-?\d+\.\d+)(,\s*"lon":\s*)(-?\d+\.\d+)', re.S)
CATATAN = ('/* Koordinat "gw" dibulatkan ke 3 desimal oleh tools/sanitasi-validasi.py — '
           'lokasi homebase tidak untuk dipublikasikan. */\n')
DESIMAL = 3


def desimal(teks):
    return len(teks.split(".")[1])


def bulatkan(teks):
    return ("%.*f" % (DESIMAL, float(teks))).rstrip("0").rstrip(".")


def main():
    for aliran in (sys.stdout, sys.stderr):
        try:
            aliran.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    ap = argparse.ArgumentParser(description="Bulatkan koordinat gateway di assets/validasi.js")
    ap.add_argument("--periksa", action="store_true", help="hanya periksa, jangan ubah apa pun")
    args = ap.parse_args()

    teks = io.open(BERKAS, encoding="utf-8", newline="").read()
    ketemu = POLA.findall(teks)
    if not ketemu:
        sys.exit("tidak ada blok \"gw\" di assets/validasi.js — formatnya berubah?")

    presisi = [(la, lo) for _, la, _, lo in ketemu if desimal(la) > DESIMAL or desimal(lo) > DESIMAL]
    print("blok gw: %d · masih lebih dari %d desimal: %d" % (len(ketemu), DESIMAL, len(presisi)))

    if args.periksa:
        sys.exit(1 if presisi else 0)
    if not presisi:
        print("Sudah dibulatkan, tidak ada yang diubah.")
        return

    def ganti(m):
        print("  %-11s %-11s  ->  %-8s %-8s" % (m.group(2), m.group(4), bulatkan(m.group(2)), bulatkan(m.group(4))))
        return m.group(1) + bulatkan(m.group(2)) + m.group(3) + bulatkan(m.group(4))

    baru = POLA.sub(ganti, teks)
    if CATATAN.strip() not in baru:
        penanda = "window.VALIDASI"
        assert baru.count(penanda) == 1
        nl = "\r\n" if "\r\n" in baru[:400] else "\n"
        baru = baru.replace(penanda, CATATAN.replace("\n", nl) + penanda, 1)
    io.open(BERKAS, "w", encoding="utf-8", newline="").write(baru)
    print("\nSelesai: %d koordinat gateway dibulatkan ke %d desimal." % (len(ketemu), DESIMAL))


if __name__ == "__main__":
    main()
