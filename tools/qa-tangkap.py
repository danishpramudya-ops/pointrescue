"""Tangkap layar seluruh situs, otomatis, tanpa perlu melihat layar.

Sepanjang pengembangan situs ini, panel browser di dalam editor tidak bisa
dipakai untuk QA: `innerWidth` jadi 0, rAF beku, `document.hidden` selalu
true, dan screenshot-nya time out. Chrome sungguhan lewat MCP juga tidak
menolong selama jendelanya tertutup jendela lain — Chrome berhenti menggambar
dan tangkapan layarnya keluar setengah kosong.

Yang berhasil: Chrome headless yang dikemudikan Playwright. Halamannya tidak
pernah tertutup apa pun, jadi apa yang tergambar memang apa yang ada.

    pip install playwright        # driver-nya saja; Chrome yang terpasang dipakai
    python 5-WEBSITE/serve.py     # di terminal lain
    python 5-WEBSITE/tools/qa-tangkap.py

Hasilnya di `tools/tangkapan/`, plus `_log.json` berisi galat konsol,
galat halaman, dan permintaan HTTP yang gagal.

    --port 8130      port serve.py
    --lebar 1600     lebar viewport (pakai 390 untuk ponsel)
    --tinggi 1000
    --awalan m       awalan nama berkas, supaya set ponsel tidak menimpa desktop
"""

import argparse
import json
import os
import sys

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit("Butuh Playwright:  pip install playwright")

ROOT = os.path.dirname(os.path.abspath(__file__))

# (nama berkas, id seksi atau None untuk hero, geser piksel dari atas seksi)
SHOTS = [
    ("00-hero", None, 0),
    ("01a-masalah", "masalah", 0), ("01b-masalah", "masalah", 1100),
    ("01c-masalah", "masalah", 2200), ("01d-masalah", "masalah", 3300),
    ("02a-gagasan", "gagasan", 0), ("02b-gagasan", "gagasan", 1300),
    ("02c-gagasan", "gagasan", 2600),
    ("03-sistem", "sistem", 0), ("03b-sistem", "sistem", 600),
    ("04-anatomi", "anatomi", 0), ("04b-anatomi", "anatomi", 800),
    ("05-prototipe", "prototipe", 0), ("05b-prototipe", "prototipe", 1200),
    ("06-dashboard", "dashboard", 0), ("06b-dashboard", "dashboard", 700),
    ("07-pengujian", "pengujian", 0), ("07b-pengujian", "pengujian", 900),
    ("08-aplikasi", "aplikasi", 0), ("08b-aplikasi", "aplikasi", 400),
    ("09-hki", "hki", 0), ("10-tim", "tim", 0), ("11-pkm", "pkm", 0),
]

# Menggulir bertahap, bukan melompat: seluruh transisi di situs ini digerakkan
# posisi gulir, dan lompatan membuatnya tertangkap di pose yang salah.
SCROLL = """
async ([y]) => {
  const awal = scrollY, langkah = 36;
  for (let i = 1; i <= langkah; i++) {
    scrollTo(0, awal + (y - awal) * i / langkah);
    await new Promise(r => setTimeout(r, 28));
  }
  await new Promise(r => setTimeout(r, 1000));
  return Math.round(scrollY);
}
"""


def main() -> None:
    # Windows memakai cp1252 saat keluarannya dialirkan ke pipa; tanpa ini
    # baris ringkasan di bawah membuat skripnya mati setelah semua kerja selesai.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    ap = argparse.ArgumentParser(description="Tangkap layar tiap bagian situs Point Rescue")
    ap.add_argument("--port", type=int, default=8130)
    ap.add_argument("--lebar", type=int, default=1600)
    ap.add_argument("--tinggi", type=int, default=1000)
    ap.add_argument("--awalan", default="")
    ap.add_argument("--keluaran", default=os.path.join(ROOT, "tangkapan"))
    args = ap.parse_args()

    os.makedirs(args.keluaran, exist_ok=True)
    base = f"http://localhost:{args.port}/"
    pre = (args.awalan + "-") if args.awalan else ""
    log = {"console": [], "pageerror": [], "http": []}

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True, args=[
            "--enable-unsafe-swiftshader",          # WebGL radar + three.js tetap jalan
            "--autoplay-policy=no-user-gesture-required",  # film bagian 01 mau berjalan
            "--force-color-profile=srgb",
        ])
        ctx = browser.new_context(viewport={"width": args.lebar, "height": args.tinggi},
                                  device_scale_factor=1,
                                  is_mobile=args.lebar < 600, has_touch=args.lebar < 600)
        page = ctx.new_page()
        page.on("console", lambda m: log["console"].append(f"[{m.type}] {m.text}")
                if m.type in ("error", "warning") else None)
        page.on("pageerror", lambda e: log["pageerror"].append(str(e)))
        page.on("response", lambda r: log["http"].append(f"{r.status} {r.url}")
                if r.status >= 400 else None)

        page.goto(base, wait_until="load")
        page.wait_for_timeout(3500)

        ids = sorted({s for _, s, _ in SHOTS if s})
        atas = page.evaluate(
            "(ids) => { const o = {}; for (const id of ids) { const e = document.getElementById(id);"
            " if (e) o[id] = Math.round(e.getBoundingClientRect().top + scrollY); } return o; }", ids)
        hilang = [i for i in ids if i not in atas]
        if hilang:
            log["seksi_hilang"] = hilang
            print("Seksi tidak ditemukan:", ", ".join(hilang))

        # Melebar juga diperiksa: elemen yang bocor ke kanan bikin halaman
        # bisa digulir mendatar, dan itu paling sering muncul di ponsel.
        log["lebar"] = page.evaluate(
            "() => ({ klien: document.documentElement.clientWidth,"
            " gulir: document.documentElement.scrollWidth })")

        for nama, seksi, geser in SHOTS:
            y = geser if seksi is None else atas.get(seksi, -1) + geser
            if y < 0:
                continue
            page.evaluate(SCROLL, [y])
            page.wait_for_timeout(400)
            page.screenshot(path=os.path.join(args.keluaran, pre + nama + ".png"))
            print(pre + nama)

        browser.close()

    with open(os.path.join(args.keluaran, pre + "_log.json"), "w", encoding="utf-8") as f:
        json.dump(log, f, indent=1, ensure_ascii=False)

    print(f"\n{len(SHOTS)} tangkapan → {args.keluaran}")
    print(f"galat halaman: {len(log['pageerror'])} · HTTP gagal: {len(log['http'])}"
          f" · galat/peringatan konsol: {len(log['console'])}")
    if log["lebar"]["gulir"] > log["lebar"]["klien"] + 1:
        print(f"PERINGATAN halaman bisa digulir mendatar: "
              f"{log['lebar']['gulir']} > {log['lebar']['klien']}")


if __name__ == "__main__":
    main()
