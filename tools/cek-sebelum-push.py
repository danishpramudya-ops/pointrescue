# -*- coding: utf-8 -*-
"""Pemeriksaan keamanan SEBELUM push — jalankan tiap kali, sebelum `git push`.

    python tools/cek-sebelum-push.py

Memeriksa persis berkas yang akan ikut ter-commit (`git ls-files -co --exclude-standard`),
bukan seluruh folder. Kode keluar 1 kalau ada GAGAL, supaya bisa dipasang sebagai hook.

  GAGAL  rahasia (kunci, token, sandi) · jalur tembaga PCB di data 3D · berkas bernama PCB /
         Gerber / skematik · koordinat gateway ber-presisi tinggi di data uji · berkas ≥ 50 MB ·
         email git yang bukan alamat noreply
  CATAT  koordinat presisi di berkas lain · domain luar yang dipanggil halaman

Situs ini statis: tidak ada server, basis data, atau login yang bisa diserang. Risiko yang
nyata ada di dua tempat — AKUN GitHub (aktifkan 2FA) dan ISI repo (rahasia yang ikut
ter-commit). Skrip ini menjaga yang kedua.
"""

import io
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

NOISE = ("vendor/", "dash/vendor/", "app/canvaskit/", "app/assets/NOTICES")
RAHASIA = [
    ("kunci privat", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----")),
    ("kunci AWS", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("kunci API Google", re.compile(r"AIza[0-9A-Za-z\-_]{35}")),
    ("token GitHub", re.compile(r"gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,}")),
    ("token Slack", re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}")),
    ("JWT", re.compile(r"eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}")),
    ("token Mapbox", re.compile(r"\b[ps]k\.eyJ[A-Za-z0-9_-]{20,}")),
    ("URL basis data / broker", re.compile(r"(?i)\b(mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis|amqps?|mqtts?)://[^\s'\"<>]+")),
    ("sandi/kunci di kode", re.compile(
        r"""(?i)\b(api[_-]?key|secret|passwd|password|access[_-]?token|auth[_-]?token|client[_-]?secret)\b\s*[:=]\s*['"][^'"\s]{8,}['"]""")),
]
NAMA_TERLARANG = re.compile(r"(?i)(gerber|schematic|skematik|easyeda|kicad|\.gbr$|\.gtl$|\.gbl$|\.gto$|\.gbo$|\.gts$|\.gbs$|\.gko$|\.drl$|"
                            r"pcb[-_]?(layout|top|bottom|real)|\.pcbdoc$|\.schdoc$)")
NAMA_DIIZINKAN = {"proto/pcb-data.json", "proto/pcb-model.js", "proto/parts/pcb.js"}   # kode & data 3D tanpa jalur
KOORD = re.compile(r"-[67]\.\d{5,}\D{1,6}11[0-4]\.\d{5,}")
URL = re.compile(r"https?://([A-Za-z0-9.-]+)")

gagal, catat = [], []


def git(*a):
    return subprocess.run(["git"] + list(a), capture_output=True, text=True, encoding="utf-8", errors="replace").stdout


def berkas():
    return [f for f in git("ls-files", "-co", "--exclude-standard").split("\n") if f and os.path.isfile(f)]


def teks(path):
    try:
        if os.path.getsize(path) > 6_000_000:
            return ""
        return io.open(path, encoding="utf-8", errors="ignore").read()
    except Exception:
        return ""


def main():
    for aliran in (sys.stdout, sys.stderr):
        try:
            aliran.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    semua = berkas()
    print("memeriksa %d berkas yang akan ikut ter-commit\n" % len(semua))
    domain = {}
    ext_teks = (".html", ".js", ".mjs", ".css", ".json", ".md", ".py", ".txt", ".svg", ".xml", ".yml", ".yaml")

    for f in semua:
        ukuran = os.path.getsize(f)
        if ukuran >= 50 * 1024 * 1024:
            gagal.append("berkas %.0f MB (batas aman GitHub 50 MB): %s" % (ukuran / 1048576.0, f))
        if NAMA_TERLARANG.search(f) and f not in NAMA_DIIZINKAN:
            gagal.append("nama berkas terkait desain PCB: %s" % f)
        if not f.lower().endswith(ext_teks):
            continue
        t = teks(f)
        derau = f.startswith(NOISE) or f.endswith("main.dart.js")
        if not derau:
            for nama, rx in RAHASIA:
                m = rx.search(t)
                if m:
                    gagal.append("%s di %s: %s…" % (nama, f, m.group(0)[:6]))
            for m in URL.finditer(t):
                domain.setdefault(m.group(1), set()).add(f)
        if KOORD.search(t) and not f.endswith(("main.dart.js",)):
            catat.append("koordinat ber-presisi tinggi (≥ 5 desimal) di %s" % f)

    # ── data 3D PCB: jalur tembaga harus kosong ──────────────────────────
    try:
        d = json.load(io.open("proto/pcb-data.json", encoding="utf-8"))
        n = len(d.get("top", [])) + len(d.get("bottom", []))
        if n:
            gagal.append("proto/pcb-data.json masih memuat %d jalur tembaga — jalankan tools/pangkas-pcb.py" % n)
    except FileNotFoundError:
        pass
    v = teks("proto/viewer.html")
    m = re.search(r'id="pcb-data">(.*?)</script>', v, re.S)
    if m:
        try:
            dv = json.loads(m.group(1))
            n = len(dv.get("top", [])) + len(dv.get("bottom", []))
            if n:
                gagal.append("proto/viewer.html masih memuat %d jalur tembaga — jalankan tools/pangkas-pcb.py" % n)
        except ValueError:
            catat.append("blok #pcb-data di proto/viewer.html tidak bisa dibaca sebagai JSON")

    # ── data uji: koordinat gateway ──────────────────────────────────────
    val = teks("assets/validasi.js")
    for mm in re.finditer(r'"gw":\s*\{\s*"lat":\s*(-?\d+\.\d+),\s*"lon":\s*(-?\d+\.\d+)', val, re.S):
        if any(len(g.split(".")[1]) > 3 for g in mm.groups()):
            gagal.append("koordinat gateway di assets/validasi.js masih presisi tinggi — jalankan tools/sanitasi-validasi.py")
            break

    # ── identitas commit ────────────────────────────────────────────────
    email = git("config", "user.email").strip()
    if email and "noreply.github.com" not in email:
        gagal.append("email git bukan noreply (%s) — akan tampil publik di tiap commit" % email)

    print("— GAGAL (%d) —" % len(gagal))
    for g in gagal:
        print("  ✗", g)
    if not gagal:
        print("  tidak ada")
    print("\n— CATATAN (%d) —" % len(catat))
    for c in sorted(set(catat)):
        print("  •", c)
    if not catat:
        print("  tidak ada")
    luar = sorted(d for d in domain if not d.endswith(("w3.org", "localhost")) and d not in ("github.com",))
    print("\n— domain luar yang disebut kode (info) —")
    print("  ", ", ".join(luar) if luar else "tidak ada")

    if gagal:
        print("\nJANGAN push dulu.")
        sys.exit(1)
    print("\nAman untuk di-push.")


if __name__ == "__main__":
    main()
