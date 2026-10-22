# -*- coding: utf-8 -*-
"""Bangun en/index.html dari index.html.

Situs ini tanpa build — dan tetap begitu: berkas yang disajikan adalah HTML
statis biasa. Skrip ini dijalankan MANUAL saat isi halaman berubah, hasilnya
di-commit, dan pengunjung tidak pernah menyentuh skripnya.

    python 5-WEBSITE/tools/buat-en.py

Kenapa dibangkitkan, bukan ditulis tangan dua kali: struktur halamannya sudah
828 baris dan tiap perubahan tata letak harus muncul di dua bahasa. Kalau
disalin manual, versi Inggrisnya pasti tertinggal. Terjemahannya sendiri tetap
ditulis tangan di tools/kamus-en.py — tidak ada mesin penerjemah di sini.

Skrip ini GAGAL BERISIK: kalau ada satu saja potongan teks yang tidak punya
terjemahan, dia menyebutkan potongan itu dan keluar dengan kode 1. Jadi tidak
mungkin ada halaman Inggris yang diam-diam masih separuh bahasa Indonesia.
"""

import io
import os
import re
import sys
import importlib.util

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def muat_kamus():
    jalur = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kamus-en.py')
    spec = importlib.util.spec_from_file_location('kamus_en', jalur)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.KAMUS, mod.ATRIBUT


def pola(teks):
    """Cocokkan teks walau di sumbernya terpotong baris baru."""
    return re.compile(r'\s+'.join(re.escape(w) for w in teks.split()))


def teks_terlihat(html):
    bersih = re.sub(r'(?s)<script.*?</script>', '', html)
    bersih = re.sub(r'(?s)<style.*?</style>', '', bersih)
    bersih = re.sub(r'(?s)<!--.*?-->', '', bersih)
    keluar = []
    for t in re.findall(r'>([^<>]+)<', bersih):
        n = re.sub(r'\s+', ' ', t).strip()
        if n and not re.fullmatch(r'[\s\d.,·×—–&;:%()\[\]/+-]*', n):
            keluar.append(n)
    return keluar


def main():
    KAMUS, ATRIBUT = muat_kamus()
    sumber = os.path.join(ROOT, 'index.html')
    tujuan_dir = os.path.join(ROOT, 'en')
    tujuan = os.path.join(tujuan_dir, 'index.html')
    html = io.open(sumber, encoding='utf-8').read()

    # ── 1. terjemahkan, yang terpanjang dulu ──────────────────────────────
    # Urutan ini penting: potongan pendek sering jadi bagian dari potongan
    # panjang ("Tim" ada di dalam kalimat lain). Dengan yang panjang lebih
    # dulu, saat giliran yang pendek tiba teks panjangnya sudah berbahasa
    # Inggris dan tidak lagi cocok.
    lewat = []
    for id_, en in sorted(KAMUS.items(), key=lambda kv: -len(kv[0])):
        baru, n = pola(id_).subn(lambda m: en, html)
        if n == 0:
            lewat.append(id_)
        html = baru

    for id_, en in sorted(ATRIBUT.items(), key=lambda kv: -len(kv[0])):
        html = pola(id_).sub(lambda m: en, html)

    # ── 2. jalur relatif: halaman ini satu tingkat lebih dalam ────────────
    html = re.sub(r'(?<=")(css|js|assets|proto|dash|app)/', r'../\1/', html)
    html = html.replace('href="../assets/img/favicon', 'href="../assets/img/favicon')
    # <html lang> dan penanda basis untuk js
    html = html.replace('<html lang="id">', '<html lang="en" data-base="../">', 1)

    # ── 3. tautan bahasa dibalik arahnya, bukan ditambah ──────────────
    # Halaman sumber sudah punya tombol EN; di sini ia diganti jadi tombol ID.
    pola_lang = re.compile(r'<a class="nav__lang".*?</a>', re.S)
    ganti = ('<a class="nav__lang" href="../index.html" hreflang="id" '
             'aria-label="Baca dalam bahasa Indonesia">ID</a>')
    html, n_lang = pola_lang.subn(lambda m: ganti, html)

    # canonical, og:url, og:locale: milik halaman Indonesia; versi Inggris punya alamat en/ sendiri
    m_kan = re.search(r'<link rel="canonical" href="([^"]+)">', html)
    if m_kan:
        dasar = m_kan.group(1)
        html = html.replace('<link rel="canonical" href="%s">' % dasar, '<link rel="canonical" href="%sen/">' % dasar, 1)
        html = html.replace('<meta property="og:url" content="%s">' % dasar, '<meta property="og:url" content="%sen/">' % dasar, 1)
    html = html.replace('<meta property="og:locale" content="id_ID">', '<meta property="og:locale" content="en_US">', 1)

    # hreflang milik halaman Indonesia dibuang, diganti yang relatif ke en/
    NL = chr(10)
    pola_alt = re.compile(r'[^\S\r\n]*<link rel="alternate" hreflang="[^"]+" href="[^"]+">\n?')
    html = pola_alt.sub('', html)
    kepala = ('<link rel="alternate" hreflang="id" href="../index.html">' + NL
              + '<link rel="alternate" hreflang="en" href="./index.html">' + NL
              + '<link rel="alternate" hreflang="x-default" href="../index.html">' + NL)
    html = html.replace('</head>', kepala + '</head>', 1)

    # ── 4. periksa: masih ada bahasa Indonesia yang lolos? ────────────────
    # nama diri yang sengaja sama di kedua bahasa tidak dihitung sebagai sisa
    sisa = []
    for t in teks_terlihat(html):
        if t in KAMUS and KAMUS[t] != t:
            sisa.append(t)
    if lewat:
        print('KAMUS PUNYA ENTRI YANG TIDAK DIPAKAI (teksnya sudah berubah?):')
        for t in lewat:
            print('   -', t[:96])
    if sisa:
        print('MASIH BERBAHASA INDONESIA:')
        for t in dict.fromkeys(sisa):
            print('   -', t[:96])
        sys.exit(1)

    os.makedirs(tujuan_dir, exist_ok=True)
    io.open(tujuan, 'w', encoding='utf-8', newline='\n').write(html)
    print('en/index.html ditulis  (%d entri kamus, %d atribut, %d tombol bahasa)'
          % (len(KAMUS), len(ATRIBUT), n_lang))
    if lewat:
        print('%d entri kamus tidak terpakai — periksa daftar di atas.' % len(lewat))


if __name__ == '__main__':
    for aliran in (sys.stdout, sys.stderr):
        try:
            aliran.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass
    main()
