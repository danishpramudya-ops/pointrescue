/* ==========================================================================
   scroll-expand.js
   Port vanilla dari komponen <ScrollExpand /> React Bits (varian JavaScript +
   CSS). Logikanya dipertahankan apa adanya — smoothstep, clip-path inset,
   zoom media, ambang fade judul/hint/overlay, dan pengikut eksponensial
   `smoothing`. React-nya tidak dibawa masuk karena situs ini vanilla.

   Tambahan di luar komponen asli: media <video> baru diputar ketika bingkai
   sudah penuh (progress >= playAt), lalu dijeda dan dikembalikan ke awal
   ketika bagian ini ditinggalkan.

   Pemakaian:
     <div class="se" data-se data-start-width="42" data-media-zoom="1.35"> …
   Semua opsi dibaca dari data-* dengan nama kebab-case dari prop aslinya.
   ========================================================================== */
(function () {
  'use strict';

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  function smoothstep(edge0, edge1, x) {
    var t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
    return t * t * (3 - 2 * t);
  }

  var DEFAULTS = {
    startWidth: 42,
    startHeight: 58,
    startRadius: 24,
    endRadius: 0,
    mediaZoom: 1.35,
    scrollDistance: 1.2,
    holdDistance: 0.35,
    smoothing: 0.1,
    overlayScrim: 0.45,
    useWindowScroll: true,
    enabled: true,
    playAt: 0.98        /* tambahan: ambang progress saat video mulai */
  };

  function readOptions(root) {
    var o = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      var attr = 'data-' + k.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); });
      var raw = root.getAttribute(attr);
      if (raw === null) { o[k] = DEFAULTS[k]; return; }
      o[k] = typeof DEFAULTS[k] === 'boolean' ? raw !== 'false' : parseFloat(raw);
      if (typeof o[k] === 'number' && isNaN(o[k])) o[k] = DEFAULTS[k];
    });
    return o;
  }

  function init(root) {
    var track   = root.querySelector('.se__track');
    var stage   = root.querySelector('.se__stage');
    var frame   = root.querySelector('.se__frame');
    var media   = root.querySelector('.se__media');
    var title   = root.querySelector('.se__title');
    var hint    = root.querySelector('.se__hint');
    var overlay = root.querySelector('.se__overlay');
    var scrim   = root.querySelector('.se__scrim');
    if (!track || !stage || !frame || !media) return;

    var c = readOptions(root);
    var motionOn = function () { return !window.PRMotion || window.PRMotion.on; };
    var isVideo = media.tagName === 'VIDEO';

    var raf = 0, current = 0, target = 0, stageH = 0, running = false, playing = false;

    function measure() {
      stageH = c.useWindowScroll ? innerHeight : root.clientHeight;
      if (stageH <= 0) return;
      stage.style.height = stageH + 'px';
      track.style.height = stageH * (1 + Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance)) + 'px';
      var w = root.clientWidth || stageH;
      stage.style.setProperty('--se-title-size', clamp(w * 0.075, 20, 84) + 'px');
    }

    function readProgress() {
      if (!c.enabled) return 1;
      var span = stageH * Math.max(0.01, c.scrollDistance);
      if (c.useWindowScroll) return clamp(-track.getBoundingClientRect().top / span, 0, 1);
      return clamp(root.scrollTop / span, 0, 1);
    }

    function apply(p) {
      var e = smoothstep(0, 1, p);

      var w = c.startWidth + (100 - c.startWidth) * e;
      var h = c.startHeight + (100 - c.startHeight) * e;
      var ix = Math.max(0, (100 - w) / 2);
      var iy = Math.max(0, (100 - h) / 2);
      var r = c.startRadius + (c.endRadius - c.startRadius) * e;
      frame.style.clipPath = 'inset(' + iy + '% ' + ix + '% ' + iy + '% ' + ix + '% round ' + r + 'px)';

      media.style.transform = 'scale(' + (c.mediaZoom + (1 - c.mediaZoom) * e) + ')';

      if (scrim) scrim.style.opacity = String(c.overlayScrim * e);

      if (title) {
        var out = smoothstep(0.4, 0.88, p);
        title.style.opacity = String(1 - out);
        title.style.transform = 'translate3d(0,' + (-28 * out) + 'px,0) scale(' + (1 + 0.06 * out) + ')';
      }
      if (hint) {
        var gone = smoothstep(0, 0.12, p);
        hint.style.opacity = String(1 - gone);
        hint.style.transform = 'translate3d(0,' + (8 * gone) + 'px,0)';
      }
      if (overlay) {
        var inn = smoothstep(0.68, 1, p);
        overlay.style.opacity = String(inn);
        overlay.style.transform = 'translate3d(0,' + (18 * (1 - inn)) + 'px,0)';
      }

      /* video menyala hanya setelah bingkai penuh */
      if (isVideo) {
        if (p >= c.playAt && !playing) {
          playing = true;
          root.classList.add('is-playing');
          var pr = media.play();
          if (pr && pr.catch) pr.catch(function () { playing = false; });
        } else if (p < c.playAt - 0.06 && playing) {
          playing = false;
          root.classList.remove('is-playing');
          media.pause();
          if (p < 0.5) try { media.currentTime = 0; } catch (err) { /* abaikan */ }
        }
      }
    }

    function tick() {
      var k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * c.smoothing));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) { current = target; running = false; }
      apply(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    }

    function kick() {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function onScroll() {
      target = readProgress();
      if (c.smoothing <= 0 || !motionOn()) { current = target; apply(current); return; }
      kick();
    }

    function onResize() {
      measure();
      target = current = readProgress();
      apply(current);
    }

    measure();
    target = current = readProgress();
    apply(current);

    (c.useWindowScroll ? window : root).addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize);
    if (window.ResizeObserver) new ResizeObserver(onResize).observe(root);

    /* Tombol suara. Video HARUS tetap muted supaya autoplay diizinkan
       browser; tombol ini yang membuka suaranya atas perintah pengunjung. */
    var sound = root.querySelector('.se__sound');
    if (sound && isVideo) {
      sound.addEventListener('click', function (e) {
        e.stopPropagation();
        media.muted = !media.muted;
        sound.setAttribute('aria-pressed', String(!media.muted));
        sound.setAttribute('aria-label', media.muted ? 'Nyalakan suara film' : 'Matikan suara film');
        root.classList.toggle('is-muted', media.muted);
        if (!media.muted && media.paused && playing) media.play().catch(function () {});
      });
      root.classList.add('is-muted');
    }

    /* hemat daya: hentikan video saat bagian ini jauh di luar layar */
    if (isVideo && window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting && playing) {
            playing = false;
            root.classList.remove('is-playing');
            media.pause();
          }
        });
      }, { rootMargin: '200px' }).observe(root);
    }
  }

  function boot() { [].forEach.call(document.querySelectorAll('[data-se]'), init); }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();
