# -*- coding: utf-8 -*-
"""Buang jalur tembaga (top/bottom) dari data 3D papan PCB yang ikut dipublikasikan.

Desain PCB tidak untuk dipublikasikan. Data 3D-nya — proto/pcb-data.json dan salinan
inline di proto/viewer.html — memuat seluruh jalur tembaga sebagai persegi panjang
tipis, dan itu berkas biasa yang bisa diunduh siapa pun dari situs. Skrip ini
mengosongkan `top` dan `bottom`. Outline papan, pad, dan lubang dibiarkan, jadi viewer
3D tetap menampilkan papannya — hanya tanpa jalur.

    python tools/pangkas-pcb.py            # terapkan
    python tools/pangkas-pcb.py --periksa  # hanya cek; kode keluar 1 kalau masih ada jalur

Berkas aslinya disalin dulu ke ../_arsip-lokal/ (folder di LUAR repo) kalau salinannya
belum ada. Jalankan lagi setiap kali pcb-data.json diganti dengan data baru dari tim.
"""

import argparse
import io
import json
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARSIP = os.path.join(os.path.dirname(ROOT), "_arsip-lokal")
BERKAS_JSON = os.path.join(ROOT, "proto", "pcb-data.json")
BERKAS_VIEWER = os.path.join(ROOT, "proto", "viewer.html")
BLOK = re.compile(r'(<script type="application/json" id="pcb-data">)(.*?)(</script>)', re.S)


def jumlah_jalur(d):
    return len(d.get("top", [])) + len(d.get("bottom", []))


def tulis(d):
    return json.dumps(d, separators=(",", ":"), ensure_ascii=False)


def baca(path):
    return io.open(path, encoding="utf-8", newline="").read()


def simpan(path, teks):
    io.open(path, "w", encoding="utf-8", newline="").write(teks)


def main():
    for aliran in (sys.stdout, sys.stderr):
        try:
            aliran.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    ap = argparse.ArgumentParser(description="Buang jalur tembaga dari data 3D PCB")
    ap.add_argument("--periksa", action="store_true", help="hanya periksa, jangan ubah apa pun")
    args = ap.parse_args()

    ada = 0

    # 1. proto/pcb-data.json
    teks_json = baca(BERKAS_JSON)
    d = json.loads(teks_json)
    n = jumlah_jalur(d)
    print("proto/pcb-data.json    jalur: %d (top %d + bottom %d)" % (n, len(d.get("top", [])), len(d.get("bottom", []))))
    ada += n

    # 2. salinan inline di proto/viewer.html
    teks_view = baca(BERKAS_VIEWER)
    m = BLOK.search(teks_view)
    if not m:
        sys.exit("proto/viewer.html: blok #pcb-data tidak ditemukan")
    dv = json.loads(m.group(2))
    nv = jumlah_jalur(dv)
    print("proto/viewer.html      jalur: %d (top %d + bottom %d)" % (nv, len(dv.get("top", [])), len(dv.get("bottom", []))))
    ada += nv

    if args.periksa:
        print("\nMASIH ADA JALUR TEMBAGA — jalankan tanpa --periksa." if ada else "\nBersih: tidak ada jalur tembaga.")
        sys.exit(1 if ada else 0)

    if not ada:
        print("\nSudah bersih, tidak ada yang diubah.")
        return

    os.makedirs(ARSIP, exist_ok=True)
    for sumber, nama in ((BERKAS_JSON, "pcb-data-asli.json"), (BERKAS_VIEWER, "viewer-asli.html")):
        tujuan = os.path.join(ARSIP, nama)
        if not os.path.exists(tujuan):
            shutil.copy2(sumber, tujuan)
            print("arsip lokal  ->", tujuan)

    d["top"], d["bottom"] = [], []
    simpan(BERKAS_JSON, tulis(d) + ("\n" if teks_json.endswith("\n") else ""))

    dv["top"], dv["bottom"] = [], []
    teks_view = BLOK.sub(lambda mm: mm.group(1) + tulis(dv) + mm.group(3), teks_view, count=1)
    simpan(BERKAS_VIEWER, teks_view)

    print("\nSelesai: jalur tembaga dibuang dari kedua berkas (outline, pad, dan lubang tetap).")


if __name__ == "__main__":
    main()
