/* ==========================================================================
   devices.js — dua perangkat peraga di dalam halaman

   1. LAPTOP  : dashboard operator yang sesungguhnya (dash/index.html) berjalan
                di dalam layar laptop. Iframe dirender pada 1440×900 lalu
                di-scale supaya muat — kalau iframe-nya langsung dikecilkan,
                dashboardnya masuk breakpoint ponsel dan tata letaknya berubah.
   2. PONSEL  : aplikasi Flutter yang SUNGGUHAN, di-build ke web dan berjalan
                di dalam layar ponsel. Bukan gambar — bisa diketuk dan digeser.

   Keduanya berhenti saat sakelar animasi dimatikan.
   ========================================================================== */
(function () {
  'use strict';

  var motionOn = function () { return !window.PRMotion || window.PRMotion.on; };
  /* en/index.html disajikan satu tingkat lebih dalam; <html data-base="../">
     memberi tahu jalur mana yang harus dipakai untuk iframe layar penuh */
  var BASIS = document.documentElement.dataset.base || '';

  /* ═══ 1. LAPTOP ═══════════════════════════════════════════════════════ */
  var screenEl = document.getElementById('laptopScreen');
  var frame = document.getElementById('dashframe');
  if (screenEl && frame) {
    var BASE_W = 1440, BASE_H = 900;
    function fit() {
      var w = screenEl.clientWidth;
      if (!w) return;
      var k = w / BASE_W;
      frame.style.width = BASE_W + 'px';
      frame.style.height = BASE_H + 'px';
      frame.style.transform = 'scale(' + k.toFixed(4) + ')';
      screenEl.style.height = Math.round(BASE_H * k) + 'px';
    }
    fit();
    addEventListener('resize', fit);
    if (window.ResizeObserver) new ResizeObserver(fit).observe(screenEl);
    frame.addEventListener('load', fit);
  }

  /* layar penuh — dashboard yang sama, tanpa dikecilkan */
  var open = document.getElementById('openDash');
  var wrapEl = document.getElementById('dashwrap');
  var big = document.getElementById('dashframe2');
  var close = document.getElementById('closeDash');
  if (open && wrapEl) {
    open.addEventListener('click', function () {
      if (big && big.getAttribute('src') === 'about:blank') big.setAttribute('src', BASIS + 'dash/index.html');
      wrapEl.hidden = false;
      document.body.classList.add('is-locked');
    });
    if (close) close.addEventListener('click', function () {
      wrapEl.hidden = true; document.body.classList.remove('is-locked');
    });
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !wrapEl.hidden) { wrapEl.hidden = true; document.body.classList.remove('is-locked'); }
    });
  }

  /* jam kecil di bawah laptop */
  var clock = document.getElementById('cclock');
  var simT = 8 * 3600 + 41 * 60;
  function hhmm(t) {
    var s = Math.floor(t) % 86400;
    return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
      .map(function (v) { return String(v).padStart(2, '0'); }).join(':');
  }

  /* ═══ 2. PONSEL ═══════════════════════════════════════════════════════
     Sama persis prinsipnya dengan laptop: yang ditampilkan APLIKASINYA
     SENDIRI, bukan gambarnya. app/ adalah `flutter build web` dari kode di
     1-PROGRAM/mobile, dijalankan lewat titik masuk terpisah yang melewati
     alur splash → onboarding → login → pindai node (pengunjung situs tidak
     punya node untuk disambungkan) dan menyuntikkan keadaan mesh yang sama
     dengan yang dipakai gambar HKI. Tidak satu pun berkas aplikasi diubah.

     Iframe-nya dirender 390 x 844 lalu di-scale, alasan yang sama dengan
     dashboard: mengecilkan iframe-nya langsung akan mengubah tata letaknya. */
  var screenEl2 = document.getElementById('phoneScreen');
  var appFrame  = document.getElementById('appframe');
  if (screenEl2 && appFrame) {
    var APP_W = 390, APP_H = 844;

    function fitApp() {
      var w = screenEl2.clientWidth;
      if (!w) return;
      var k = w / APP_W;
      appFrame.style.transform = 'scale(' + k.toFixed(4) + ')';
    }
    fitApp();
    addEventListener('resize', fitApp);
    if (window.ResizeObserver) new ResizeObserver(fitApp).observe(screenEl2);

    function appSiap() { screenEl2.classList.add('is-ready'); fitApp(); }
    try {
      if (appFrame.contentDocument && appFrame.contentDocument.readyState === 'complete') appSiap();
    } catch (e) { /* jangan sampai melempar */ }
    appFrame.addEventListener('load', function () {
      // load menyala begitu dokumennya selesai; CanvasKit masih perlu
      // beberapa saat lagi sebelum bingkai pertama benar-benar tergambar
      setTimeout(appSiap, 1200);
    });
    setTimeout(appSiap, 25000);   // jaring pengaman
  }

  /* layar penuh untuk aplikasi — sama polanya dengan dashboard */
  var openApp = document.getElementById('openApp');
  var appWrap = document.getElementById('appwrap');
  var appBig = document.getElementById('appframe2');
  var closeApp = document.getElementById('closeApp');
  if (openApp && appWrap) {
    openApp.addEventListener('click', function () {
      if (appBig && appBig.getAttribute('src') === 'about:blank') appBig.setAttribute('src', BASIS + 'app/index.html');
      appWrap.hidden = false;
      document.body.classList.add('is-locked');
    });
    if (closeApp) closeApp.addEventListener('click', function () {
      appWrap.hidden = true; document.body.classList.remove('is-locked');
    });
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !appWrap.hidden) { appWrap.hidden = true; document.body.classList.remove('is-locked'); }
    });
  }

  /* jam kecil di bawah laptop — jalan sendiri, tidak bergantung pada ponsel */
  if (clock) {
    var last = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      var dt = Math.min((now - last) / 1000, .05); last = now;
      if (!motionOn()) return;
      simT += dt * 6;
      clock.textContent = hhmm(simT) + ' · NET PR01 · 433 MHz';
    })(performance.now());
  }
})();

/* --------------------------------------------------------------------------
   3. VIEWER 3D (bagian 04) — iframe-nya lazy dan berat: three.js, OBJ casing,
      lalu 17 part dirakit. Selama beberapa detik itu kotaknya hitam polos
      setinggi 920 px tanpa penjelasan apa pun. Placeholder di bawahnya baru
      disingkirkan setelah halaman di dalam iframe benar-benar selesai dimuat.
   ------------------------------------------------------------------------ */
(function () {
  var box = document.querySelector('.anat__viewer');
  if (!box) return;
  var frame = box.querySelector('iframe');
  if (!frame) { box.classList.add('is-ready'); return; }

  function ready() { box.classList.add('is-ready'); }

  // iframe yang sudah terlanjur selesai sebelum skrip ini jalan
  try {
    if (frame.contentDocument && frame.contentDocument.readyState === 'complete') ready();
  } catch (e) { /* beda origin — tidak mungkin di sini, tapi jangan sampai melempar */ }

  frame.addEventListener('load', ready);
  // jaring pengaman: jangan biarkan placeholder-nya menetap kalau load tak pernah tiba
  setTimeout(ready, 20000);
})();

/* --------------------------------------------------------------------------
   4. SOROTAN 3D DI HERO — model yang sama dengan bagian 04, tapi berputar
      sendiri dan tidak bisa disentuh. Fotonya tetap jadi poster sampai
      modelnya benar-benar tergambar, jadi hero tidak pernah kosong.
   ------------------------------------------------------------------------ */
(function () {
  var box = document.getElementById('heroShot');
  var frame = document.getElementById('hero3d');
  if (!box || !frame) return;
  /* blok ini IIFE tersendiri, jadi punya penanda sakelar animasinya sendiri */
  var gerak = function () { return !window.PRMotion || window.PRMotion.on; };

  function siap() { clearInterval(pantau); box.classList.add('is-3d'); }

  addEventListener('message', function (e) {
    if (e.origin !== location.origin) return;
    if (e.data && e.data.pr === 'hero3d-siap') siap();
  });
  /* Pesannya bisa terlewat — iframe lazy kadang selesai sebelum berkas ini
     sempat memasang pendengarnya. Jadi judul dokumen di dalam iframe ikut
     dipantau sejak awal, tidak menunggu event 'load'. */
  var n = 0;
  var pantau = setInterval(function () {
    var jadi = false;
    try { jadi = frame.contentDocument && frame.contentDocument.title === 'siap'; } catch (err) {}
    if (jadi) { clearInterval(pantau); siap(); }
    else if (++n > 90) clearInterval(pantau);        // 36 detik, lalu menyerah
  }, 400);

  function kabari(on) {
    try { frame.contentWindow.postMessage({ pr: 'hero3d-gerak', on: !!on }, location.origin); } catch (e) {}
  }

  var terlihat = true;
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { terlihat = e.isIntersecting; kabari(terlihat && gerak()); });
    }, { threshold: 0 }).observe(box);
  }
  /* motion.js menyiarkan 'pr:motion' tiap kali sakelar animasi ditekan */
  addEventListener('pr:motion', function () { kabari(terlihat && gerak()); });
})();
