/* ==========================================================================
   i18n.js — teks yang digambar oleh JS, bukan yang ada di HTML

   tools/buat-en.py menerjemahkan seluruh teks di dalam index.html, tapi
   label sumbu grafik, keterangan tooltip, judul kolom tabel dan tulisan di
   dalam simulasi SVG dibuat pada saat halaman berjalan — jadi tidak pernah
   tersentuh skrip itu. Berkas ini yang mengurusnya.

   Bahasa dibaca dari <html lang>. Kalau kuncinya tidak ada terjemahannya,
   yang dikembalikan kunci itu sendiri — halaman tidak pernah kosong, paling
   buruk cuma satu label yang belum diterjemahkan.
   ========================================================================== */
(function () {
  'use strict';

  var EN = {
    /* ---- grafik bagian 08 ---- */
    'jarak dari posko (m) · skala akar': 'distance from the post (m) · square-root scale',
    'paket terlemah yang masih terbaca · −126 dBm': 'weakest packet still decoded · −126 dBm',
    'semua': 'all',
    'langsung': 'direct',
    'lewat relai': 'via relay',
    'fix GPS sah': 'valid GPS fix',
    'tanpa fix': 'no fix',
    'node ': 'node ',
    'tautan langsung · ': 'direct link · ',
    'lewat relai · ': 'via relay · ',
    ' dari ': ' of ',
    ' paket · ': ' packets · ',
    '× nyala ulang': '× reboot',
    ' paket ber-fix GPS sah': ' packets with a valid GPS fix',
    ' paket tanpa fix — koordinatnya karangan firmware':
      ' packets with no fix — their coordinates are invented by the firmware',
    /* ---- tabel ---- */
    'Ringkasan delapan sesi': 'Summary of the eight sessions',
    'Sesi': 'Session',
    'Tempat': 'Place',
    'Diterima': 'Received',
    'Dipancarkan': 'Transmitted',
    'Fix sah': 'Valid fix',
    'Tanpa fix': 'No fix',
    'Langsung (m)': 'Direct (m)',
    'Relai (m)': 'Relay (m)',
    'Nyala ulang': 'Reboots',
    'Lihat angkanya sebagai tabel': 'View the numbers as a table',
    'Sembunyikan tabel': 'Hide the table',
    /* ---- sakelar animasi ---- */
    'Animasi': 'Motion',
    'Statis': 'Static',
    'Animasi menyala — klik untuk mematikan': 'Motion is on — click to turn it off',
    'Animasi mati — klik untuk menyalakan': 'Motion is off — click to turn it on',
    /* ---- simulasi SVG bagian 03 & 04 ---- */
    'MENARA SELULER': 'CELL TOWER',
    'JARINGAN SENDIRI': 'OWN NETWORK',
    'DASBOR POSKO': 'POST DASHBOARD',
    'APLIKASI SAR': 'SAR APP',
    'UBIN TERSIMPAN': 'STORED TILES',
    'UBIN DARING': 'ONLINE TILES',
    'GRID BUATAN PROGRAM': 'PROGRAM-DRAWN GRID',
    'diterima posko': 'received at the post',
    'jeda acak 400–700 ms': 'random 400–700 ms delay',
    'posisi & jejak tetap tampil': 'position & trail still shown',
    'salinan lewat jalur lain → dibuang': 'copy via another path → discarded',
    /* ---- nama sesi & tempat dari data tim ---- */
    '6 Jul Alun': '6 Jul Square',
    '30 Jul UBF': '30 Jul UBF',
    '11 Agu': '11 Aug',
    '14 Agu': '14 Aug',
    '18 Agu': '18 Aug',
    'Singkat': 'Short',
    '6 Juli · Alun-alun': '6 July · Town square',
    '24 Juli': '24 July',
    '30 Juli · UBF': '30 July · UBF',
    '11 Agustus': '11 August',
    '14 Agustus': '14 August',
    '18 Agustus': '18 August',
    'Uji multi-hop': 'Multi-hop test',
    'Uji singkat': 'Short test',
    'Alun-alun · terbuka': 'Town square · open ground',
    'Sekitar posko': 'Around the post',
    'UB Forest · berhalang': 'UB Forest · obstructed',
    'Jatimulyo · permukiman': 'Jatimulyo · housing',
    'Malang · uji multi-hop': 'Malang · multi-hop test',
    'Homebase · uji singkat': 'Homebase · short test'
  };

  var inggris = (document.documentElement.lang || 'id').slice(0, 2) === 'en';

  window.PRText = function (kunci) {
    if (!inggris) return kunci;
    return Object.prototype.hasOwnProperty.call(EN, kunci) ? EN[kunci] : kunci;
  };

  /* Pemisah ribuan dan desimal ikut bahasa: 2.314 / 337,5 dalam bahasa
     Indonesia, 2,314 / 337.5 dalam bahasa Inggris. */
  window.PRLocale = inggris ? 'en-GB' : 'id-ID';
})();
