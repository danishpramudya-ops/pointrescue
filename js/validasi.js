/* ==========================================================================
   validasi.js — bagian 08, digambar dari rekaman lapangan yang sebenarnya

   Sumbernya assets/validasi.js: keluaran tools/anchorpulse.py atas rekaman
   serial gateway delapan sesi, disusun tools/susun_validasi.py. Berkas itu
   disalin apa adanya dari repo validasi tim — modul ini menyajikan, tidak
   menghitung ulang, supaya angka di situs tidak pernah bisa berbeda dari
   angka di dokumen tim.

   Warna sengaja sedikit. Sebaran RSSI memakai SATU warna; identitas sesi
   dibawa oleh penyaring, bukan oleh delapan warna yang saling mirip. Pasangan
   warna yang benar-benar muncul bersama — biru vs oranye dan biru vs merah —
   keduanya lolos pemeriksaan keterbacaan buta warna.
   ========================================================================== */
(function () {
  'use strict';

  var V = window.VALIDASI;
  if (!V || !V.sesi) return;

  var NS = 'http://www.w3.org/2000/svg';
  var BIRU = '#2f7fe0', ORANYE = '#e45a07', MERAH = '#d30e10';
  var TINTA = '#0b2038', REDUP = '#43566f', KISI = 'rgba(9,50,97,.12)';
  var MONO = 'JetBrains Mono, monospace';

  function gerak() { return !window.PRMotion || window.PRMotion.on; }

  function el(n, a) {
    var e = document.createElementNS(NS, n);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }
  function teks(x, y, isi, o) {
    var a = { x: x, y: y, fill: REDUP, 'font-size': 10.5, 'font-family': MONO };
    for (var k in (o || {})) a[k] = o[k];
    var t = el('text', a); t.textContent = isi; return t;
  }
  /* dinamai TX, bukan T: tiap fungsi grafik di bawah memakai T
     sebagai margin atas (var W, H, L, R, T, B) dan akan menutupinya */
  var TX = window.PRText || function (k) { return k; };
  var LOC = window.PRLocale || 'id-ID';

  function angka(n, d) {
    return Number(n).toLocaleString(LOC, {
      minimumFractionDigits: d || 0, maximumFractionDigits: d || 0
    });
  }

  /* ---------- tooltip bersama ------------------------------------------- */
  var tip = document.createElement('div');
  tip.className = 'vtip'; tip.hidden = true;
  document.body.appendChild(tip);

  function tampilTip(ev, html) {
    tip.innerHTML = html; tip.hidden = false;
    var r = tip.getBoundingClientRect();
    var x = ev.clientX + 14, y = ev.clientY - r.height - 12;
    if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
    if (y < 8) y = ev.clientY + 18;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function sembunyiTip() { tip.hidden = true; }
  addEventListener('scroll', sembunyiTip, { passive: true });

  function pasangTip(node, html) {
    node.addEventListener('mouseenter', function (e) { tampilTip(e, html); });
    node.addEventListener('mousemove', function (e) { tampilTip(e, html); });
    node.addEventListener('mouseleave', sembunyiTip);
  }

  /* ---------- 1. angka pokok -------------------------------------------- */
  function kpi() {
    var t = V.total || {};
    var peta = {
      sesi: [t.sesi, 0], menit: [t.menit, 1], rx: [t.rx, 0],
      tx: [t.tx, 0], jauh: [t.jarak_maks, 0], reboot: [t.reboot, 0]
    };
    Object.keys(peta).forEach(function (k) {
      var n = document.querySelector('[data-vk="' + k + '"]');
      if (!n || peta[k][0] == null) return;
      var akhir = peta[k][0], des = peta[k][1];
      if (!gerak()) { n.textContent = angka(akhir, des); return; }
      var mulai = performance.now(), lama = 1100;
      (function step(now) {
        var u = Math.min(1, (now - mulai) / lama);
        u = 1 - Math.pow(1 - u, 3);
        n.textContent = angka(akhir * u, des);
        if (u < 1) requestAnimationFrame(step);
        else n.textContent = angka(akhir, des);
      })(mulai);
    });
  }

  /* ---------- 2. sebaran RSSI terhadap jarak ---------------------------- */
  function scatter() {
    var svg = document.getElementById('vScatter');
    if (!svg) return;
    var W = 900, H = 420, L = 62, R = 20, T = 18, B = 52;
    var x0 = L, x1 = W - R, y0 = T, y1 = H - B;

    var titik = [];
    V.sesi.forEach(function (s, i) {
      (s.titik || []).forEach(function (p) {
        titik.push({ i: i, d: p.d, rssi: p.rssi, snr: p.snr, node: p.node, sesi: s.label });
      });
    });

    var dMaks = 2300;
    /* skala akar: seratus meter pertama tidak berdesakan di tepi kiri —
       justru di situ sinyalnya jatuh paling curam */
    var xs = function (m) { return x0 + Math.sqrt(Math.max(0, m) / dMaks) * (x1 - x0); };
    var ys = function (r) { return y0 + ((-r - 25) / 105) * (y1 - y0); };

    var n = document.querySelector('[data-v-titik]');
    if (n) n.textContent = angka(titik.length);

    [-40, -60, -80, -100, -120].forEach(function (r) {
      svg.appendChild(el('line', { x1: x0, x2: x1, y1: ys(r), y2: ys(r), stroke: KISI, 'stroke-width': 1 }));
      svg.appendChild(teks(x0 - 10, ys(r) + 4, r, { 'text-anchor': 'end' }));
    });
    [0, 25, 100, 250, 500, 1000, 1500, 2000].forEach(function (m) {
      svg.appendChild(el('line', { x1: xs(m), x2: xs(m), y1: y0, y2: y1, stroke: KISI, 'stroke-width': 1 }));
      svg.appendChild(teks(xs(m), y1 + 20, m, { 'text-anchor': 'middle' }));
    });
    svg.appendChild(teks((x0 + x1) / 2, H - 8, TX('jarak dari posko (m) · skala akar'), { 'text-anchor': 'middle' }));
    svg.appendChild(teks(15, (y0 + y1) / 2, 'RSSI (dBm)', {
      'text-anchor': 'middle', transform: 'rotate(-90 15 ' + ((y0 + y1) / 2) + ')'
    }));

    svg.appendChild(el('line', {
      x1: x0, x2: x1, y1: ys(-126), y2: ys(-126),
      stroke: MERAH, 'stroke-width': 2, 'stroke-dasharray': '6 5'
    }));
    /* labelnya di kanan: di kiri ia menimpa gumpalan titik paling padat */
    var lbl = teks(x1 - 4, ys(-126) - 9, TX('paket terlemah yang masih terbaca · −126 dBm'),
      { fill: MERAH, 'text-anchor': 'end', stroke: '#fff', 'stroke-width': 3.5,
        'paint-order': 'stroke', 'stroke-linejoin': 'round' });
    svg.appendChild(lbl);

    var lapis = el('g', {});
    svg.appendChild(lapis);

    var titikEl = titik.map(function (p) {
      var c = el('circle', {
        cx: xs(p.d).toFixed(1), cy: ys(p.rssi).toFixed(1), r: 4,
        fill: BIRU, 'fill-opacity': '0.32'
      });
      pasangTip(c, '<b>' + TX(p.sesi) + '</b><br>' + TX('node ') + p.node + '<br>' +
        angka(p.d, 1) + ' m · ' + p.rssi + ' dBm · SNR ' + p.snr);
      lapis.appendChild(c);
      return c;
    });

    /* penyaring sesi — identitas dibawa penyaring, bukan delapan warna mirip */
    var leg = document.getElementById('vLegend');
    var aktif = -1;
    function terapkan() {
      for (var k = 0; k < titikEl.length; k++) {
        var on = aktif < 0 || titik[k].i === aktif;
        titikEl[k].setAttribute('fill', (aktif >= 0 && on) ? ORANYE : BIRU);
        titikEl[k].setAttribute('fill-opacity', aktif < 0 ? '0.32' : (on ? '0.75' : '0.06'));
        titikEl[k].setAttribute('r', (aktif >= 0 && on) ? 4.5 : 4);
      }
    }
    if (leg) {
      V.sesi.forEach(function (s, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = TX(s.pendek || s.label);
        b.setAttribute('aria-pressed', 'false');
        b.title = TX(s.tempat) + ' — ' + (s.titik || []).length + ' titik';
        b.addEventListener('click', function () {
          aktif = (aktif === i) ? -1 : i;
          for (var k = 0; k < leg.children.length; k++) {
            var o = leg.children[k];
            var on = (k === aktif);
            o.classList.toggle('is-on', on);
            o.setAttribute('aria-pressed', on ? 'true' : 'false');
          }
          terapkan();
        });
        leg.appendChild(b);
      });
      var semua = document.createElement('button');
      semua.type = 'button';
      semua.className = 'is-reset';
      semua.textContent = TX('semua');
      semua.addEventListener('click', function () {
        aktif = -1;
        for (var k = 0; k < leg.children.length; k++) {
          leg.children[k].classList.remove('is-on');
          leg.children[k].setAttribute('aria-pressed', 'false');
        }
        terapkan();
      });
      leg.appendChild(semua);
    }
  }

  /* ---------- 3. jangkauan per sesi ------------------------------------- */
  function jangkauan() {
    var svg = document.getElementById('vRange');
    if (!svg) return;
    var W = 460, H = 300, L = 96, R = 52, T = 26, B = 34;
    var x0 = L, x1 = W - R, y0 = T, y1 = H - B;

    var baris = V.sesi.map(function (s) {
      var j = s.jangkauan || {};
      return {
        nama: TX(s.pendek || s.label),
        hop0: j.hop0_m || 0, relay: j.relay_m || 0, ragu: j.ragu_m || 0
      };
    });
    var maks = 2300;
    var xs = function (m) { return x0 + (m / maks) * (x1 - x0); };
    var tinggi = (y1 - y0) / baris.length;
    var tebal = 8;

    /* tekstur untuk batang relai — pembeda kedua di samping warna */
    var defs = el('defs', {});
    var pat = el('pattern', {
      id: 'vArsir', width: 6, height: 6,
      patternTransform: 'rotate(45)', patternUnits: 'userSpaceOnUse'
    });
    pat.appendChild(el('rect', { width: 6, height: 6, fill: '#ffffff' }));
    pat.appendChild(el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: ORANYE, 'stroke-width': 2.6 }));
    defs.appendChild(pat);
    svg.appendChild(defs);

    [0, 500, 1000, 1500, 2000].forEach(function (m) {
      svg.appendChild(el('line', { x1: xs(m), x2: xs(m), y1: y0 - 6, y2: y1, stroke: KISI, 'stroke-width': 1 }));
      svg.appendChild(teks(xs(m), y1 + 18, m, { 'text-anchor': 'middle', 'font-size': 9.5 }));
    });
    svg.appendChild(teks(x1 + 6, y1 + 18, 'm', { 'text-anchor': 'start', 'font-size': 9.5 }));

    baris.forEach(function (b, i) {
      var yTop = y0 + tinggi * i;
      var punyaRelai = b.relay > 0;
      /* dua sub-batang terpisah, bukan bertumpuk: relai 201 m pernah lebih
         panjang daripada tautan langsung 76 m di sesi yang sama, dan batang
         yang saling menimpa membuat yang pendek hilang sama sekali */
      var yLangsung = punyaRelai ? yTop + tinggi * 0.34 : yTop + tinggi / 2;
      var yRelai = yTop + tinggi * 0.68;

      svg.appendChild(teks(x0 - 10, yTop + tinggi / 2 + 3.5, b.nama,
        { 'text-anchor': 'end', 'font-size': 9.5, fill: TINTA }));

      /* batas atas yang diragukan digambar putus-putus — membuangnya sama
         saja menyembunyikan sebagian data */
      if (b.ragu) {
        svg.appendChild(el('rect', {
          x: xs(0), y: yLangsung - tebal / 2 - 2, width: xs(b.ragu) - xs(0), height: tebal + 4, rx: 4,
          fill: 'none', stroke: REDUP, 'stroke-width': 1.2, 'stroke-dasharray': '4 3'
        }));
      }

      var wL = Math.max(3, xs(b.hop0) - xs(0));
      var rL = el('rect', {
        x: xs(0), y: yLangsung - tebal / 2, width: gerak() ? 0 : wL,
        height: tebal, rx: 4, fill: BIRU
      });
      pasangTip(rL, '<b>' + b.nama + '</b><br>' + TX('tautan langsung · ') + angka(b.hop0) + ' m');
      svg.appendChild(rL);
      if (gerak()) {
        rL.style.transition = 'width .9s cubic-bezier(.22,.68,.16,1) ' + (i * 70) + 'ms';
        requestAnimationFrame(function () { rL.setAttribute('width', wL); });
      }
      svg.appendChild(teks(xs(b.hop0) + (b.ragu ? 46 : 7), yLangsung + 3.5, angka(b.hop0),
        { 'font-size': 9.5, fill: TINTA }));

      if (punyaRelai) {
        var wR = Math.max(3, xs(b.relay) - xs(0));
        var rR = el('rect', {
          x: xs(0), y: yRelai - tebal / 2, width: wR, height: tebal, rx: 4,
          fill: 'url(#vArsir)', stroke: ORANYE, 'stroke-width': 1
        });
        pasangTip(rR, '<b>' + b.nama + '</b><br>' + TX('lewat relai · ') + angka(b.relay) + ' m');
        svg.appendChild(rR);
        svg.appendChild(teks(xs(b.relay) + 7, yRelai + 3.5, angka(b.relay),
          { 'font-size': 9.5, fill: ORANYE }));
      }
    });

    var g = el('g', {});
    g.appendChild(el('rect', { x: x0, y: 6, width: 16, height: 8, rx: 3, fill: BIRU }));
    g.appendChild(teks(x0 + 22, 13.5, TX('langsung'), { 'font-size': 9.5 }));
    g.appendChild(el('rect', { x: x0 + 92, y: 6, width: 16, height: 8, rx: 3, fill: 'url(#vArsir)', stroke: ORANYE, 'stroke-width': 1 }));
    g.appendChild(teks(x0 + 114, 13.5, TX('lewat relai'), { 'font-size': 9.5 }));
    svg.appendChild(g);
  }

  /* ---------- 4. PDR per node ------------------------------------------- */
  function pdr() {
    var svg = document.getElementById('vPdr');
    if (!svg) return;
    var W = 460, H = 300, L = 118, R = 40, T = 16, B = 34;
    var x0 = L, x1 = W - R, y0 = T, y1 = H - B;

    var baris = [];
    V.sesi.forEach(function (s) {
      (s.node || []).forEach(function (nd) {
        baris.push({
          nama: TX(s.pendek || s.label) + ' · ' + nd.node,
          pdr: nd.pdr, rx: nd.rx, exp: nd.exp, reboot: nd.reboot
        });
      });
    });

    var xs = function (v) { return x0 + (v / 100) * (x1 - x0); };
    var tinggi = (y1 - y0) / baris.length;
    var tebal = Math.min(9, tinggi - 3);

    [0, 25, 50, 75, 100].forEach(function (v) {
      svg.appendChild(el('line', { x1: xs(v), x2: xs(v), y1: y0, y2: y1, stroke: KISI, 'stroke-width': 1 }));
      svg.appendChild(teks(xs(v), y1 + 18, v + '%', { 'text-anchor': 'middle', 'font-size': 9.5 }));
    });

    baris.forEach(function (b, i) {
      var yc = y0 + tinggi * i + tinggi / 2;
      svg.appendChild(teks(x0 - 8, yc + 3, b.nama, { 'text-anchor': 'end', 'font-size': 8.5, fill: TINTA }));
      var lebar = Math.max(3, xs(b.pdr) - xs(0));
      var r = el('rect', {
        x: xs(0), y: yc - tebal / 2, width: gerak() ? 0 : lebar,
        height: tebal, rx: 4, fill: BIRU
      });
      pasangTip(r, '<b>' + b.nama + '</b><br>PDR ' + b.pdr.toFixed(2) + '%<br>' +
        angka(b.rx) + TX(' dari ') + angka(b.exp) + TX(' paket · ') + b.reboot + TX('× nyala ulang'));
      svg.appendChild(r);
      if (gerak()) {
        r.style.transition = 'width .8s cubic-bezier(.22,.68,.16,1) ' + (i * 45) + 'ms';
        requestAnimationFrame(function () { r.setAttribute('width', lebar); });
      }
      svg.appendChild(teks(xs(b.pdr) + 6, yc + 3, b.pdr.toFixed(0), { 'font-size': 8.5, fill: TINTA }));
    });
  }

  /* ---------- 5. fix GPS sah vs tanpa fix -------------------------------- */
  function fix() {
    var svg = document.getElementById('vFix');
    if (!svg) return;
    var W = 900, H = 220, L = 120, R = 210, T = 14, B = 30;
    var x0 = L, x1 = W - R, y0 = T, y1 = H - B;

    var baris = V.sesi.map(function (s) {
      var r = s.ringkas || {};
      return { nama: TX(s.pendek || s.label), fix: r.fix || 0, nofix: r.nofix || 0 };
    });
    var maks = Math.max.apply(null, baris.map(function (b) { return b.fix + b.nofix; }));
    var xs = function (v) { return (v / maks) * (x1 - x0); };
    var tinggi = (y1 - y0) / baris.length;
    var tebal = Math.min(13, tinggi - 5);

    baris.forEach(function (b, i) {
      var yc = y0 + tinggi * i + tinggi / 2;
      svg.appendChild(teks(x0 - 10, yc + 3.5, b.nama, { 'text-anchor': 'end', 'font-size': 9.5, fill: TINTA }));

      var wf = Math.max(3, xs(b.fix));
      var rf = el('rect', { x: x0, y: yc - tebal / 2, width: wf, height: tebal, rx: 4, fill: BIRU });
      pasangTip(rf, '<b>' + b.nama + '</b><br>' + angka(b.fix) + TX(' paket ber-fix GPS sah'));
      svg.appendChild(rf);

      var wn = 0;
      if (b.nofix) {
        wn = Math.max(3, xs(b.nofix));
        /* jeda 2 px ke permukaan supaya dua segmen tidak menyatu jadi satu batang */
        var rn = el('rect', { x: x0 + wf + 2, y: yc - tebal / 2, width: wn, height: tebal, rx: 4, fill: MERAH });
        pasangTip(rn, '<b>' + b.nama + '</b><br>' + angka(b.nofix) +
          TX(' paket tanpa fix — koordinatnya karangan firmware'));
        svg.appendChild(rn);
      }
      var tot = b.fix + b.nofix;
      var pct = tot ? Math.round(b.nofix / tot * 100) : 0;
      svg.appendChild(teks(x0 + wf + wn + 12, yc + 3.5,
        angka(b.fix) + ' ' + TX('fix GPS sah') + ' · ' + angka(b.nofix) + ' ' + TX('tanpa fix') + ' (' + pct + '%)',
        { 'font-size': 9, fill: TINTA }));
    });

    var g = el('g', {});
    g.appendChild(el('rect', { x: x0, y: y1 + 8, width: 16, height: 8, rx: 3, fill: BIRU }));
    g.appendChild(teks(x0 + 22, y1 + 15.5, TX('fix GPS sah'), { 'font-size': 9.5 }));
    g.appendChild(el('rect', { x: x0 + 122, y: y1 + 8, width: 16, height: 8, rx: 3, fill: MERAH }));
    g.appendChild(teks(x0 + 144, y1 + 15.5, TX('tanpa fix'), { 'font-size': 9.5 }));
    svg.appendChild(g);
  }

  /* ---------- 6. tabel — supaya datanya tetap terbaca tanpa grafik ------- */
  function tabel() {
    var host = document.getElementById('vTabel');
    if (!host) return;
    var h = '<table><caption>' + TX('Ringkasan delapan sesi') + '</caption><thead><tr>' +
      '<th scope="col">' + TX('Sesi') + '</th><th scope="col">' + TX('Tempat') + '</th><th scope="col">' + TX('Diterima') + '</th>' +
      '<th scope="col">' + TX('Dipancarkan') + '</th><th scope="col">' + TX('Fix sah') + '</th><th scope="col">' + TX('Tanpa fix') + '</th>' +
      '<th scope="col">' + TX('Langsung (m)') + '</th><th scope="col">' + TX('Relai (m)') + '</th><th scope="col">' + TX('Nyala ulang') + '</th>' +
      '</tr></thead><tbody>';
    V.sesi.forEach(function (s) {
      var r = s.ringkas || {}, j = s.jangkauan || {};
      var reboot = (s.node || []).reduce(function (a, n) { return a + (n.reboot || 0); }, 0);
      h += '<tr><th scope="row">' + TX(s.label || '') + '</th><td>' + TX(s.tempat || '') + '</td>' +
        '<td>' + angka(r.rx || 0) + '</td><td>' + angka(r.tx || 0) + '</td>' +
        '<td>' + angka(r.fix || 0) + '</td><td>' + angka(r.nofix || 0) + '</td>' +
        '<td>' + angka(j.hop0_m || 0) + '</td><td>' + (j.relay_m ? angka(j.relay_m) : '—') + '</td>' +
        '<td>' + reboot + '</td></tr>';
    });
    h += '</tbody></table>';
    host.innerHTML = h;

    var tombol = document.getElementById('vTabelToggle');
    if (tombol) {
      tombol.addEventListener('click', function () {
        var buka = host.hidden;
        host.hidden = !buka;
        tombol.setAttribute('aria-expanded', buka ? 'true' : 'false');
        tombol.textContent = TX(buka ? 'Sembunyikan tabel' : 'Lihat angkanya sebagai tabel');
      });
    }
  }

  var sudah = false;
  function gambar() {
    if (sudah) return;
    sudah = true;
    kpi(); scatter(); jangkauan(); pdr(); fix(); tabel();
  }
  window.PRValidasi = { gambar: gambar };

  /* kalau seksinya sudah terlihat sebelum pengamat gulir sempat menyala */
  function cekAwal() {
    var sec = document.getElementById('pengujian');
    if (sec && sec.getBoundingClientRect().top < innerHeight) gambar();
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', cekAwal);
  else cekAwal();
})();
