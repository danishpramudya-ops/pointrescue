/* ==========================================================================
   scroll.js — mesin gulir
   Satu loop rAF; tiap bagian punya perlakuan sendiri lewat data-anim.
   ========================================================================== */
(function () {
  'use strict';

  var motionOn = function () { return !window.PRMotion || window.PRMotion.on; };
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ---------- 1. siapkan teks yang dipecah per kata ----------------------- */
  $$('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (w, i) {
      var span = document.createElement('span');
      span.className = 'w';
      var inner = document.createElement('i');
      inner.textContent = w;
      inner.style.setProperty('--i', i);
      span.appendChild(inner);
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- 2. delay bertahap --------------------------------------------- */
  $$('[data-r]').forEach(function (el) { el.style.setProperty('--r', el.dataset.r); });

  /* ---------- 3. panjang garis SVG untuk efek gambar-sendiri --------------- */
  $$('.meshsvg__links path').forEach(function (p) {
    var len = p.getTotalLength();
    p.style.setProperty('--len', len.toFixed(1));
  });

  /* ---------- 4. tandai bagian yang masuk layar --------------------------- */
  var seen = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.dataset.anim === 'chart') drawChart();
      seen.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -14% 0px', threshold: 0.1 });

  $$('section, .track, .anatomy, .proto, .outro').forEach(function (s) { seen.observe(s); });

  /* angka berhitung naik */
  var counters = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, to = +el.dataset.count, t0 = performance.now();
      (function step(now) {
        var k = clamp((now - t0) / 900, 0, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
      counters.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(function (el) { counters.observe(el); });

  /* ---------- 5. nav aktif ------------------------------------------------ */
  var links = $$('.nav__links a');
  var spy = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(function (a) { var t = $(a.getAttribute('href')); if (t) spy.observe(t); });

  /* ---------- 6. loop gulir ---------------------------------------------- */
  var nav      = $('#nav');
  var bar      = $('#scrollbar');
  var floor    = $('.grid-floor');
  var shot     = $('.shot__frame img');
  var track    = $('.track');
  var rail     = $('#rail');
  var trackbar = $('#trackbar');
  var protoSt  = $('.proto__sticky');
  var bleed    = $('.proto__bleed img');
  var phone    = $('.phone');

  /* posisi bagian dalam dokumen; dihitung ulang saat ukuran berubah */
  function progressOf(el, extra) {
    var r = el.getBoundingClientRect();
    var span = r.height - innerHeight + (extra || 0);
    if (span <= 0) return r.top <= 0 ? 1 : 0;
    return clamp(-r.top / span, 0, 1);
  }

  var queued = false;
  function frame() {
    queued = false;
    var y = scrollY, vh = innerHeight;

    if (nav) nav.classList.toggle('is-stuck', y > 40);
    if (bar) {
      var max = document.documentElement.scrollHeight - vh;
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
    if (!motionOn()) return;

    if (floor) floor.style.setProperty('--py', (y * 0.2).toFixed(1) + 'px');
    if (shot && y < vh * 1.4) shot.style.setProperty('--sy', (y * -0.05).toFixed(1) + 'px');

    /* 03 — rel horizontal */
    if (track && rail) {
      var r = track.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        var p = progressOf(track);
        var dist = Math.max(0, rail.scrollWidth - innerWidth + 48);
        rail.style.setProperty('--x', (p * dist).toFixed(1));
        if (trackbar) trackbar.style.width = (p * 100).toFixed(1) + '%';
      }
    }

    /* 06 — foto full-bleed mengecil dari zoom */
    if (protoSt && bleed) {
      var rp = protoSt.getBoundingClientRect();
      if (rp.top < vh && rp.bottom > 0) {
        var pz = progressOf(protoSt);
        bleed.style.setProperty('--z', (1.35 - 0.35 * pz).toFixed(3));
      }
    }

    /* 09 — ponsel berputar mengikuti masuknya bagian */
    if (phone) {
      var rf = phone.getBoundingClientRect();
      if (rf.top < vh && rf.bottom > 0) {
        var pe = clamp(1 - (rf.top - vh * 0.2) / (vh * 0.7), 0, 1);
        phone.style.setProperty('--e', pe.toFixed(3));
      }
    }
  }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  frame();

  /* ---------- 7. denyut paket di diagram mesh ----------------------------- */
  (function pulse() {
    var svg = $('#meshsvg'); if (!svg) return;
    var paths = $$('.meshsvg__links path', svg);
    var dot = $('#pulse', svg);
    if (!dot || !paths.length) return;
    var i = 0, t0 = 0;
    function run(now) {
      if (!t0) t0 = now;
      var path = paths[i % paths.length];
      var len = path.getTotalLength();
      var k = (now - t0) / 900;
      if (k >= 1) { t0 = now; i++; }
      else {
        var pt = path.getPointAtLength(len * k);
        dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
        dot.style.opacity = String(Math.sin(k * Math.PI));
      }
      requestAnimationFrame(run);
    }
    requestAnimationFrame(run);
  })();

  /* ---------- 8. grafik validasi lapangan --------------------------------
     Digambar js/validasi.js dari assets/validasi.js — rekaman delapan sesi
     yang sebenarnya. Dulu di sini ada garis regresi yang digambar tangan;
     itu dibuang karena bentuknya dikarang, bukan diukur.                   */
  function drawChart() {
    if (window.PRValidasi) window.PRValidasi.gambar();
  }


})();
