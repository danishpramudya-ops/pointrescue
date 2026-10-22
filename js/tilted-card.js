/* ==========================================================================
   tilted-card.js — port vanilla dari komponen <TiltedCard /> React Bits
                    (varian JavaScript + CSS)

   MODEL GERAKNYA DIPERTAHANKAN UTUH. Komponen aslinya memakai useSpring dari
   `motion/react`, bukan transition CSS — dan itu terasa: kartunya tidak
   mengejar kursor dengan easing tetap, tapi punya massa. Kalau di sini
   diganti `transition: transform .3s`, gerakannya jadi lain sama sekali.

   Jadi pegasnya diintegrasikan sendiri, dengan tetapan yang sama persis:

     rotateX, rotateY, scale   stiffness 100, damping 30, mass 2
     opacity tooltip           stiffness 100, damping 10, mass 1  (bawaan motion)
     rotasi tooltip            stiffness 350, damping 30, mass 1

   a = (-k·(x − tujuan) − c·v) / m ;  v += a·dt ;  x += v·dt

   Rumus sudutnya juga sama: offset kursor dari titik tengah dibagi setengah
   ukuran kartu, dikali rotateAmplitude, dan sumbu X-nya dibalik tanda. Tooltip
   ikut berputar mengikuti KECEPATAN kursor arah tegak (−velocityY · 0.6),
   bukan posisinya — detail kecil yang membuatnya terasa punya bobot.

   DUA HAL YANG BERBEDA DARI VERSI REACT

   1. `showMobileWarning` tidak diikutkan. Komponen aslinya menampilkan tulisan
      "This effect is not optimized for mobile" kepada pengunjung. Memberi tahu
      orang bahwa halamannya kurang bagus di perangkat mereka tidak menolong
      siapa pun; di sini efeknya cukup dimatikan pada penunjuk kasar.
   2. Teks tooltip tidak ditulis manual, melainkan dibaca dari .team__peran
      di markup. Akibatnya versi bahasa Inggris ikut benar tanpa satu pun
      entri kamus tambahan.
   ========================================================================== */
(function () {
  'use strict';

  var kartu = [].slice.call(document.querySelectorAll('.team figure'));
  if (!kartu.length) return;

  var kasar = matchMedia('(pointer: coarse)').matches;
  if (kasar) return;

  function gerak() { return !window.PRMotion || window.PRMotion.on; }

  /* prop komponen aslinya, lewat data-* pada .team */
  var wadah = document.querySelector('.team');
  function num(nama, bawaan) {
    var v = parseFloat(wadah && wadah.dataset[nama]);
    return isNaN(v) ? bawaan : v;
  }
  var ROTATE_AMPLITUDE = num('rotateAmplitude', 12);
  var SCALE_ON_HOVER = num('scaleOnHover', 1.06);

  function pegas(awal, k, c, m) {
    return { x: awal, tujuan: awal, v: 0, k: k, c: c, m: m };
  }
  function langkah(s, dt) {
    var a = (-s.k * (s.x - s.tujuan) - s.c * s.v) / s.m;
    s.v += a * dt;
    s.x += s.v * dt;
    /* dianggap diam kalau sudah cukup dekat, supaya loop-nya bisa berhenti */
    if (Math.abs(s.v) < 0.0008 && Math.abs(s.x - s.tujuan) < 0.0008) {
      s.x = s.tujuan; s.v = 0; return false;
    }
    return true;
  }

  var hidup = [];

  kartu.forEach(function (fig) {
    var dalam = fig.querySelector('.team__kartu');
    if (!dalam) return;

    /* Tooltip-nya memakai peran orangnya di proyek. Dibaca dari elemen yang
       sudah ada di markup, bukan ditulis manual — jadi versi bahasa Inggris
       ikut benar tanpa entri kamus tambahan. */
    var ket = fig.querySelector('.team__peran');
    var peran = ket ? ket.textContent.trim() : '';
    var tip = null;
    if (peran) {
      tip = document.createElement('figcaption');
      tip.className = 'team__tip';
      tip.setAttribute('aria-hidden', 'true');
      tip.textContent = peran;
      fig.appendChild(tip);
    }

    var rx = pegas(0, 100, 30, 2);
    var ry = pegas(0, 100, 30, 2);
    var sc = pegas(1, 100, 30, 2);
    var op = pegas(0, 100, 10, 1);
    var rc = pegas(0, 350, 30, 1);
    var mx = 0, my = 0, lastY = 0, jalan = false;

    var st = { rx: rx, ry: ry, sc: sc, op: op, rc: rc, gambar: gambar };

    function gambar() {
      dalam.style.transform =
        'rotateX(' + rx.x.toFixed(3) + 'deg) rotateY(' + ry.x.toFixed(3) + 'deg) ' +
        'scale(' + sc.x.toFixed(4) + ')';
      if (tip) {
        tip.style.opacity = Math.max(0, Math.min(1, op.x)).toFixed(3);
        tip.style.transform =
          'translate(' + mx.toFixed(1) + 'px,' + my.toFixed(1) + 'px) ' +
          'rotate(' + rc.x.toFixed(2) + 'deg)';
      }
    }

    function nyalakan() {
      if (jalan) return;
      jalan = true;
      hidup.push(st);
      st.mati = function () { jalan = false; };
      mulaiLoop();
    }

    fig.addEventListener('pointermove', function (e) {
      if (!gerak()) return;
      var r = dalam.getBoundingClientRect();
      var ox = e.clientX - r.left - r.width / 2;
      var oy = e.clientY - r.top - r.height / 2;
      rx.tujuan = (oy / (r.height / 2)) * -ROTATE_AMPLITUDE;
      ry.tujuan = (ox / (r.width / 2)) * ROTATE_AMPLITUDE;

      var rf = fig.getBoundingClientRect();
      mx = e.clientX - rf.left;
      my = e.clientY - rf.top;

      /* rotasi tooltip mengikuti KECEPATAN tegak kursor, bukan posisinya */
      rc.tujuan = -(oy - lastY) * 0.6;
      lastY = oy;
      nyalakan();
    });

    fig.addEventListener('pointerenter', function () {
      if (!gerak()) return;
      sc.tujuan = SCALE_ON_HOVER;
      op.tujuan = 1;
      nyalakan();
    });

    fig.addEventListener('pointerleave', function () {
      op.tujuan = 0; sc.tujuan = 1;
      rx.tujuan = 0; ry.tujuan = 0; rc.tujuan = 0;
      nyalakan();
    });
  });

  var loop = 0, last = 0;
  function mulaiLoop() {
    if (loop) return;
    last = performance.now();
    loop = requestAnimationFrame(tik);
  }
  function tik(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    var sisa = [];
    for (var i = 0; i < hidup.length; i++) {
      var s = hidup[i];
      var aktif = false;
      aktif = langkah(s.rx, dt) || aktif;
      aktif = langkah(s.ry, dt) || aktif;
      aktif = langkah(s.sc, dt) || aktif;
      aktif = langkah(s.op, dt) || aktif;
      /* rotasi tooltip selalu ditarik balik ke nol: targetnya cuma dorongan
         sesaat dari kecepatan kursor, bukan sudut yang harus dipertahankan */
      s.rc.tujuan *= 0.82;
      aktif = langkah(s.rc, dt) || aktif;
      s.gambar();
      if (aktif) sisa.push(s); else if (s.mati) s.mati();
    }
    hidup = sisa;
    loop = hidup.length ? requestAnimationFrame(tik) : 0;
  }

  document.documentElement.classList.add('has-tilt');
})();
