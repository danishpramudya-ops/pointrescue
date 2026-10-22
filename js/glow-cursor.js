/* ==========================================================================
   glow-cursor.js
   Berdasarkan komponen <GlowCursor /> React Bits (varian JavaScript + CSS).

   Yang dipertahankan: seluruh model geraknya — rantai MAX_POINTS titik yang
   saling mengejar, easing kepala yang dikoreksi frame-rate
   (1 - (1-followSpeed)^delta), chainEase = clamp(0.28 + followSpeed*0.35, …),
   serta idle fade (idleTimeout / fadeDuration). Nama propnya juga sama.

   Yang ditukar: penggambarnya. Shader WebGL aslinya menghasilkan glow lembut
   yang menyambung, sedangkan yang diminta adalah jejak PUTUS-PUTUS dengan ikon
   sinyal di kepala. Dash tajam adalah pekerjaan SVG, bukan shader — jadi
   ogl/WebGL diganti satu <svg> tetap. Efeknya: dash tetap tajam di DPI berapa
   pun dan halaman tidak perlu konteks WebGL ketiga.

   Pemetaan prop yang berubah makna:
     glowIntensity → kepekatan salinan jejak yang di-blur (pengganti halo)
     pulseSpeed    → kecepatan dash-offset berjalan menyusuri jejak
     hotspot, noiseStrength, glowSpread, blendMode → tidak dipakai
   ========================================================================== */
(function () {
  'use strict';

  var MAX_POINTS = 64;
  var NS = 'http://www.w3.org/2000/svg';

  var CFG = {
    color: '#f5811f',            /* kepala jejak — oranye */
    secondaryColor: '#d30e10',   /* ekor jejak — merah    */
    trailLength: 34,
    trailWidth: 3,
    followSpeed: 0.18,
    glowIntensity: 1.6,
    opacity: 1,
    pulseSpeed: 1.1,
    idleFade: true,
    idleTimeout: 900,
    fadeDuration: 700
  };

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* perangkat sentuh tetap dilewati; animasi dikendalikan sakelar PRMotion */
  if (!matchMedia('(pointer: fine)').matches) return;
  var motionOn = function () { return !window.PRMotion || window.PRMotion.on; };

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ---------- lapisan svg -------------------------------------------------- */
  var svg = el('svg', { class: 'cursorfx', 'aria-hidden': 'true' });
  var defs = el('defs', {});

  var grad = el('linearGradient', { id: 'cursorfxGrad', gradientUnits: 'userSpaceOnUse' });
  grad.appendChild(el('stop', { offset: '0',   'stop-color': CFG.color }));
  grad.appendChild(el('stop', { offset: '1',   'stop-color': CFG.secondaryColor }));
  defs.appendChild(grad);

  var blur = el('filter', { id: 'cursorfxBlur', x: '-40%', y: '-40%', width: '180%', height: '180%' });
  blur.appendChild(el('feGaussianBlur', { stdDeviation: '5' }));
  defs.appendChild(blur);
  svg.appendChild(defs);

  var dashArray = '13 11';
  var glowPath = el('path', {
    class: 'cursorfx__glow', fill: 'none', stroke: 'url(#cursorfxGrad)',
    'stroke-width': CFG.trailWidth * 2.4, 'stroke-linecap': 'round',
    'stroke-dasharray': dashArray, filter: 'url(#cursorfxBlur)'
  });
  var trailPath = el('path', {
    class: 'cursorfx__trail', fill: 'none', stroke: 'url(#cursorfxGrad)',
    'stroke-width': CFG.trailWidth, 'stroke-linecap': 'round',
    'stroke-dasharray': dashArray
  });
  svg.appendChild(glowPath);
  svg.appendChild(trailPath);

  /* ---------- kepala: motif sinyal Point Rescue ---------------------------- */
  var head = el('g', { class: 'cursorfx__head' });
  function arc(r, col, w) {
    var a = 50 * Math.PI / 180;
    var sx = (r * Math.cos(-a)).toFixed(2), sy = (r * Math.sin(-a)).toFixed(2);
    var ex = (r * Math.cos(a)).toFixed(2),  ey = (r * Math.sin(a)).toFixed(2);
    return el('path', {
      d: 'M ' + sx + ' ' + sy + ' A ' + r + ' ' + r + ' 0 0 1 ' + ex + ' ' + ey,
      fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round'
    });
  }
  head.appendChild(arc(13, '#d30e10', 2.6));
  head.appendChild(arc(9,  '#e4400a', 2.6));
  head.appendChild(arc(5,  '#f5811f', 2.6));
  head.appendChild(el('circle', { r: 2.6, fill: '#f5811f' }));
  head.appendChild(el('circle', { class: 'cursorfx__ring', r: 11, fill: 'none',
                                  stroke: '#f5811f', 'stroke-width': 1.4, opacity: 0 }));
  svg.appendChild(head);

  document.body.appendChild(svg);
  document.documentElement.classList.add('has-cursorfx');

  /* ---------- keadaan gerak (dari GlowCursor) ------------------------------ */
  var pts = [];
  for (var i = 0; i < MAX_POINTS; i++) pts.push({ x: 0, y: 0 });
  var target = { x: 0, y: 0 }, hd = { x: 0, y: 0 };
  var started = false, inside = false, fade = 0, angle = 0;
  var lastInput = performance.now(), lastFrame = performance.now();

  function begin(x, y) {
    target.x = hd.x = x; target.y = hd.y = y;
    for (var i = 0; i < MAX_POINTS; i++) { pts[i].x = x; pts[i].y = y; }
    started = true; fade = 1;
  }

  addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    if (!started) begin(e.clientX, e.clientY);
    target.x = e.clientX; target.y = e.clientY;
    inside = true; lastInput = performance.now();
    var hot = e.target && e.target.closest && e.target.closest('a,button,[role="button"],input,select,textarea,.hud__btn');
    svg.classList.toggle('is-hot', !!hot);
  }, { passive: true });

  addEventListener('pointerleave', function () { inside = false; lastInput = performance.now(); }, { passive: true });
  addEventListener('blur', function () { inside = false; lastInput = performance.now(); });

  /* ---------- jalur mulus lewat titik tengah kuadratik --------------------- */
  function pathOf(n) {
    var d = 'M ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
    for (var i = 1; i < n - 1; i++) {
      var mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      d += ' Q ' + pts[i].x.toFixed(1) + ' ' + pts[i].y.toFixed(1) + ' ' + mx.toFixed(1) + ' ' + my.toFixed(1);
    }
    return d;
  }

  var raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    var delta = Math.min((now - lastFrame) / 16.667, 3);
    lastFrame = now;

    /* animasi dimatikan: sembunyikan jejak dan kembalikan kursor sistem */
    if (!motionOn()) {
      if (svg.style.display !== 'none') {
        svg.style.display = 'none';
        document.documentElement.classList.remove('has-cursorfx');
      }
      return;
    }
    if (svg.style.display === 'none') {
      svg.style.display = '';
      document.documentElement.classList.add('has-cursorfx');
    }

    if (started) {
      var headEase = 1 - Math.pow(1 - clamp(CFG.followSpeed, 0.01, 0.99), delta);
      var chainBase = clamp(0.28 + CFG.followSpeed * 0.35, 0.08, 0.92);
      var chainEase = 1 - Math.pow(1 - chainBase, delta);
      hd.x += (target.x - hd.x) * headEase;
      hd.y += (target.y - hd.y) * headEase;
      pts[0].x = hd.x; pts[0].y = hd.y;
      for (var i = 1; i < MAX_POINTS; i++) {
        pts[i].x += (pts[i - 1].x - pts[i].x) * chainEase;
        pts[i].y += (pts[i - 1].y - pts[i].y) * chainEase;
      }
    }

    /* idle fade — persis logika komponen aslinya */
    var idleFor = now - lastInput;
    var shouldFade = CFG.idleFade && (!inside || idleFor > CFG.idleTimeout);
    var fadeStep = (16.667 * delta) / Math.max(CFG.fadeDuration, 16);
    fade += ((started && !shouldFade ? 1 : 0) - fade) * Math.min(1, fadeStep * 7);

    if (!started) return;

    var n = clamp(Math.round(CFG.trailLength), 2, MAX_POINTS);
    var d = pathOf(n);
    trailPath.setAttribute('d', d);
    glowPath.setAttribute('d', d);

    /* gradien mengikuti arah jejak: oranye di kepala, merah di ekor */
    grad.setAttribute('x1', pts[0].x.toFixed(1));
    grad.setAttribute('y1', pts[0].y.toFixed(1));
    grad.setAttribute('x2', pts[n - 1].x.toFixed(1));
    grad.setAttribute('y2', pts[n - 1].y.toFixed(1));

    /* dash berjalan menyusuri jejak — pengganti "pulse" milik shader */
    var off = -(now * 0.001 * CFG.pulseSpeed * 24) % 24;
    trailPath.setAttribute('stroke-dashoffset', off.toFixed(1));
    glowPath.setAttribute('stroke-dashoffset', off.toFixed(1));

    trailPath.style.opacity = String(fade * CFG.opacity);
    glowPath.style.opacity  = String(fade * CFG.opacity * 0.34 * clamp(CFG.glowIntensity / 1.9, 0, 2));

    /* kepala menghadap arah gerak */
    var dx = pts[0].x - pts[3].x, dy = pts[0].y - pts[3].y;
    if (dx * dx + dy * dy > 4) angle = Math.atan2(dy, dx) * 180 / Math.PI;
    head.setAttribute('transform',
      'translate(' + pts[0].x.toFixed(1) + ',' + pts[0].y.toFixed(1) + ') rotate(' + angle.toFixed(1) + ')');
    head.style.opacity = String(fade);
  }
  raf = requestAnimationFrame(frame);

  /* hentikan saat tab tidak aktif */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (!raf) { lastFrame = performance.now(); raf = requestAnimationFrame(frame); }
  });
})();
