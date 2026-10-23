/* ==========================================================================
   versus-model.js — dua perangkat pembanding di bagian "Komparasi" (02)

     ht     Handy Talky   — radio genggam dua-band generik
     mesh   node mesh     — node LoRa genggam generik berlayar e-paper

   Keduanya MODEL GENERIK buatan sendiri dari bentuk dasar (kotak membulat,
   silinder), BUKAN tiruan produk atau merek tertentu: tidak ada logo, tidak
   ada tulisan, ukurannya hanya perkiraan jenisnya. Itu sebabnya situs
   menyebutnya "ilustrasi 3D generik" dan tidak butuh izin foto siapa pun.

   Dipakai dua tempat dengan kode yang sama persis, jadi poster PNG dan
   model yang berputar di halaman selalu cocok:
     - proto/versus.html            model hidup di tabel komparasi
     - tools/pembanding-3d.html     bahan tools/render-pembanding.py (PNG)

   Berkas tim (proto/*.js lain) tidak disentuh. Satuan mm, sumbu y ke atas,
   sisi depan = +z. Warnanya satu keluarga slate-biru, sejajar dengan casing
   Point Rescue setelah "diangkat": di atas latar navy, hitam pekat akan
   hilang siluetnya.
   ========================================================================== */

export function buat(THREE) {
  /* Kotak bersudut membulat. Algoritmanya sama dengan RoundedBoxGeometry di
     examples/jsm milik three.js (yang tidak ikut di-vendor): kotak berpetak
     ganjil, tiap titik didorong ke permukaan bola berjari-jari r di sudutnya. */
  function rbox(w, h, d, r, seg = 3) {
    r = Math.min(r, w / 2, h / 2, d / 2);
    const s = seg * 2 + 1;
    const g = new THREE.BoxGeometry(1, 1, 1, s, s, s).toNonIndexed();
    const pos = g.attributes.position, nor = g.attributes.normal;
    const kotak = new THREE.Vector3(w, h, d).multiplyScalar(0.5).subScalar(r);
    const setengah = 0.5 / s;
    const p = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i);
      n.copy(p);
      n.x -= Math.sign(n.x) * setengah;
      n.y -= Math.sign(n.y) * setengah;
      n.z -= Math.sign(n.z) * setengah;
      n.normalize();
      pos.setXYZ(i, kotak.x * Math.sign(p.x) + n.x * r, kotak.y * Math.sign(p.y) + n.y * r, kotak.z * Math.sign(p.z) + n.z * r);
      nor.setXYZ(i, n.x, n.y, n.z);
    }
    return g;
  }

  const bahan = (warna, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: warna, roughness: 0.58, metalness: 0.05 }, o));
  const tambah = (grup, geo, mat, x = 0, y = 0, z = 0, nama = '') => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (nama) m.name = nama;
    grup.add(m);
    return m;
  };
  /* silinder yang porosnya searah z (tombol yang menghadap ke depan) */
  const silZ = (r, h, seg = 28) => { const g = new THREE.CylinderGeometry(r, r, h, seg); g.rotateX(Math.PI / 2); return g; };

  const W = {
    badan:  '#46586f',
    badan2: '#3a4a5e',
    gelap:  '#25344a',
    karet:  '#2f3d52',
    logam:  '#9db2c9',
    kaca:   '#0d1722',
    epaper: '#cbd5d2',
    tinta:  '#2a3641'
  };

  /* ── Handy Talky: radio genggam dua-band generik ── */
  function ht() {
    const g = new THREE.Group();
    const badan = bahan(W.badan), badan2 = bahan(W.badan2), gelap = bahan(W.gelap, { roughness: 0.7 });
    const karet = bahan(W.karet, { roughness: 0.82 }), logam = bahan(W.logam, { roughness: 0.38, metalness: 0.3 });

    tambah(g, rbox(58, 112, 30, 8, 4), badan, 0, 0, 0, 'badan');
    /* paket baterai: menonjol di punggung bagian bawah */
    tambah(g, rbox(58, 80, 8, 5, 3), badan2, 0, -16, -17, 'baterai');
    tambah(g, rbox(15, 58, 2.4, 1, 2), bahan(W.gelap, { roughness: 0.4, metalness: 0.3 }), 0, -16, -22.6, 'penjepit-sabuk');

    /* panel depan gelap */
    tambah(g, rbox(51, 99, 2.6, 3.6, 3), gelap, 0, -2, 15.3, 'panel-depan');

    /* layar LCD + dua "angka" */
    const kacaMat = bahan(W.kaca, { roughness: 0.25, emissive: '#16405a', emissiveIntensity: 0.9 });
    tambah(g, rbox(32, 15, 1.4, 1.6, 2), kacaMat, 0, 40, 16.5, 'lcd');
    const digit = bahan('#7fd3ff', { roughness: 0.4, emissive: '#7fd3ff', emissiveIntensity: 0.7 });
    tambah(g, rbox(14, 4.2, 0.5, 0.6, 1), digit, -5, 42, 17.4);
    tambah(g, rbox(8, 2.2, 0.5, 0.5, 1), digit, 7, 37.6, 17.4);

    /* kisi speaker: lima celah memanjang */
    const celah = bahan('#0a111b', { roughness: 0.9 });
    for (let i = 0; i < 5; i++) tambah(g, rbox(26, 1.5, 1.1, 0.6, 1), celah, 0, 27 - i * 3.5, 16.7);

    /* papan tombol 4 × 3 */
    const ys = [4, -7, -18, -29];
    const xs = [-16, 0, 16];
    ys.forEach((y, i) => xs.forEach((x) => tambah(g, rbox(14, 8.2, 3.2, 2, 2), i === 0 ? bahan('#34455a', { roughness: 0.7 }) : karet, x, y, 16.9)));
    /* lubang mikrofon */
    tambah(g, silZ(1.4, 1.2, 14), celah, 0, -44, 16.7);

    /* sisi kiri: PTT besar + dua tombol kecil */
    tambah(g, rbox(5, 30, 15, 2, 2), karet, -30.6, 14, 0, 'ptt');
    tambah(g, rbox(4, 11, 8, 1.4, 2), karet, -30.2, -10, 0);
    tambah(g, rbox(4, 11, 8, 1.4, 2), karet, -30.2, -24, 0);

    /* atas: kenop, LED, pangkal antena + antena karet berusuk */
    tambah(g, new THREE.CylinderGeometry(6.6, 6.6, 2.2, 28), logam, 15, 57, 0);
    tambah(g, new THREE.CylinderGeometry(5.6, 5.8, 9.5, 20), gelap, 15, 62.8, 0, 'kenop');
    tambah(g, new THREE.CylinderGeometry(4.2, 4.2, 1.4, 20), logam, 15, 67.9, 0);
    const led = new THREE.SphereGeometry(2.4, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    tambah(g, led, bahan('#ffb25c', { emissive: '#ff9a2e', emissiveIntensity: 0.9, roughness: 0.3 }), 2, 56, 9, 'led');
    tambah(g, new THREE.CylinderGeometry(4.8, 4.8, 5, 6), logam, -14, 58.5, 0, 'konektor');
    tambah(g, new THREE.CylinderGeometry(2.8, 4.4, 78, 24), karet, -14, 100.5, 0, 'antena');
    for (let i = 0; i < 4; i++) tambah(g, new THREE.TorusGeometry(3.7 - i * 0.12, 0.55, 8, 22).rotateX(Math.PI / 2), karet, -14, 63 + i * 4.2, 0);
    tambah(g, new THREE.SphereGeometry(2.8, 16, 12), karet, -14, 139.5, 0);
    return g;
  }

  /* ── node mesh: perangkat LoRa genggam generik berlayar e-paper ── */
  function mesh() {
    const g = new THREE.Group();
    const badan = bahan('#3f566b'), badan2 = bahan('#324859'), gelap = bahan(W.gelap, { roughness: 0.7 });
    const karet = bahan(W.karet, { roughness: 0.82 }), logam = bahan(W.logam, { roughness: 0.38, metalness: 0.3 });

    tambah(g, rbox(58, 100, 17, 7, 4), badan, 0, 0, 0, 'badan');
    tambah(g, rbox(54, 96, 3.2, 3, 2), badan2, 0, 0, -9.4, 'penutup-baterai');

    /* bingkai layar + layar e-paper abu terang dengan "isi" generik (tanpa tulisan) */
    tambah(g, rbox(50, 72, 1.8, 3.6, 3), gelap, 0, 8, 8.6, 'bingkai');
    tambah(g, rbox(44, 36, 1, 1.8, 2), bahan('#171f2a', { roughness: 0.5 }), 0, 21, 9.6);
    const epaper = bahan(W.epaper, { roughness: 0.85 });
    tambah(g, rbox(40, 32, 0.8, 1.2, 2), epaper, 0, 21, 10.3, 'layar-epaper');
    const tinta = bahan(W.tinta, { roughness: 0.9 });
    tambah(g, rbox(24, 2.6, 0.4, 0.5, 1), tinta, -5.5, 32.2, 10.9);
    [[30, 25.6], [24, 21.2], [28, 16.8], [18, 12.4]].forEach(([lebar, y]) => tambah(g, rbox(lebar, 1.5, 0.4, 0.4, 1), tinta, (lebar - 32) / 2 - 1, y, 10.9));
    [1.6, 3, 4.4].forEach((t, i) => tambah(g, rbox(2, t, 0.4, 0.3, 1), tinta, 13.6 + i * 3.2, 29.6 + t / 2 + 0.2, 10.9));

    /* tiga tombol bundar + lekuk di bawahnya */
    [-14, 0, 14].forEach((x) => tambah(g, silZ(5.2, 2.6, 28), karet, x, -14, 9.4));
    tambah(g, rbox(20, 2.4, 1, 1, 1), bahan('#243040', { roughness: 0.8 }), 0, -28, 9.0);

    /* atas: pangkal SMA, antena cambuk yang sedikit melengkung, LED, tali */
    tambah(g, new THREE.CylinderGeometry(3.9, 3.9, 6, 6), logam, 17, 53, 0, 'konektor');
    const cambuk = new THREE.Group();
    cambuk.position.set(17, 56, 0);
    cambuk.rotation.z = -0.1;
    tambah(cambuk, new THREE.CylinderGeometry(2.0, 2.9, 68, 20), karet, 0, 34, 0, 'antena');
    tambah(cambuk, new THREE.SphereGeometry(2.0, 14, 10), karet, 0, 68, 0);
    g.add(cambuk);
    tambah(g, new THREE.SphereGeometry(1.5, 14, 10), bahan('#8df0bd', { emissive: '#4fdc96', emissiveIntensity: 0.9, roughness: 0.3 }), -18, 45, 8.9, 'led');
    tambah(g, new THREE.TorusGeometry(4.4, 1.1, 10, 26).rotateY(Math.PI / 2), karet, -23, 54, 0, 'tali');
    /* saklar geser di sisi kanan */
    tambah(g, rbox(2.4, 11, 5, 0.9, 2), logam, 29.2, 26, 0);
    return g;
  }

  /* pose dan arah kamera bawaan tiap perangkat — dipakai poster DAN model hidup,
     supaya saat model hidup memudar masuk, bingkai pertamanya sama dengan posternya */
  const POSE = {
    ht:   { rx: -0.12, ry:  0.5, rz: -0.55, cx: -0.1,  cy: 0.42 },
    mesh: { rx: -0.12, ry: -0.5, rz: -0.6,  cx:  0.35, cy: 0.42 }
  };

  return { ht, mesh, POSE };
}
