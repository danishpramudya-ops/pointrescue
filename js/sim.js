/* ==========================================================================
   sim.js — simulasi visual kecil untuk bagian Gagasan & Cara kerja.

   Tiap <svg data-sim="nama"> diisi dan digerakkan oleh satu loop rAF bersama.
   Hanya yang terlihat di layar yang dianimasikan, dan semuanya berhenti saat
   sakelar animasi (PRMotion) dimatikan — pada keadaan itu tiap simulasi tetap
   digambar sekali pada pose yang informatif, jadi isinya tidak pernah kosong.
   ========================================================================== */
(function () {
  'use strict';

  /* label di dalam simulasi digambar saat halaman jalan, jadi tidak
     tersentuh tools/buat-en.py — lewat PRText supaya ikut bahasa halaman */
  /* dinamai TX, bukan T: tiap fungsi grafik di bawah memakai T
     sebagai margin atas (var W, H, L, R, T, B) dan akan menutupinya */
  var TX = window.PRText || function (k) { return k; };

  var NS = 'http://www.w3.org/2000/svg';
  var C = { blue: '#3f8fe8', blueLt: '#6fb0ff', red: '#d30e10', orange: '#e45a07',
            dim: 'rgba(140,190,255,.22)', txt: 'rgba(215,232,250,.8)', mute: 'rgba(200,222,255,.4)' };

  function n(name, a) { var e = document.createElementNS(NS, name); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function txt(x, y, s, size, fill, anchor) {
    var t = n('text', { x: x, y: y, fill: fill || C.mute, 'font-size': size || 9,
      'font-family': 'JetBrains Mono, monospace', 'text-anchor': anchor || 'middle' });
    t.textContent = s; return t;
  }
  function node(x, y, r, fill, stroke, label) {
    var g = n('g', { transform: 'translate(' + x + ',' + y + ')' });
    g.appendChild(n('circle', { r: r, fill: fill, stroke: stroke || 'none', 'stroke-width': 1.6 }));
    if (label) { var t = txt(0, 3.4, label, 9.5, '#fff'); t.setAttribute('font-weight', '700'); g.appendChild(t); }
    return g;
  }
  var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ═══ 1. Tanpa operator ═══════════════════════════════════════════════
     Menara seluler mati, lalu tiga unit membentuk tautannya sendiri.       */
  function simNoOperator(svg) {
    svg.setAttribute('viewBox', '0 0 320 170');
    var tower = n('g', { transform: 'translate(60,92)' });
    tower.appendChild(n('path', { d: 'M-13 34 L-4 -22 L4 -22 L13 34', fill: 'none', stroke: C.dim, 'stroke-width': 2.4 }));
    tower.appendChild(n('path', { d: 'M-8 6 L8 6 M-10 20 L10 20', stroke: C.dim, 'stroke-width': 1.8 }));
    var arcs = [];
    [12, 20, 28].forEach(function (r) {
      var p = n('path', { d: 'M ' + (-r * .64) + ' ' + (-22 - r * .77) + ' A ' + r + ' ' + r + ' 0 0 1 ' + (r * .64) + ' ' + (-22 - r * .77),
        fill: 'none', stroke: C.blue, 'stroke-width': 2, 'stroke-linecap': 'round' });
      arcs.push(p); tower.appendChild(p);
    });
    var cross = n('g', { opacity: 0 });
    cross.appendChild(n('path', { d: 'M50 62 L70 82 M70 62 L50 82', stroke: C.red, 'stroke-width': 3, 'stroke-linecap': 'round' }));
    svg.appendChild(tower); svg.appendChild(cross);
    svg.appendChild(txt(60, 148, TX('MENARA SELULER'), 8.5));

    var pts = [[190, 52], [258, 100], [176, 122]];
    var links = [], dots = [];
    [[0, 1], [1, 2], [0, 2]].forEach(function (p) {
      var l = n('line', { x1: pts[p[0]][0], y1: pts[p[0]][1], x2: pts[p[1]][0], y2: pts[p[1]][1],
        stroke: C.orange, 'stroke-width': 1.8, 'stroke-dasharray': 90, 'stroke-dashoffset': 90 });
      links.push(l); svg.appendChild(l);
    });
    pts.forEach(function (p) { var g = node(p[0], p[1], 9, C.navy || '#0a2b52', C.blueLt); dots.push(g); svg.appendChild(g); });
    svg.appendChild(txt(212, 148, TX('JARINGAN SENDIRI'), 8.5, C.blueLt));

    return function (t) {
      var p = (t % 7) / 7;
      var die = Math.min(1, Math.max(0, (p - .18) / .16));
      arcs.forEach(function (a, i) {
        var alive = p < .18 ? (Math.sin(t * 6 - i) * .5 + .5) : 1 - die;
        a.style.opacity = String(Math.max(0, alive));
      });
      cross.style.opacity = String(die);
      var grow = Math.min(1, Math.max(0, (p - .42) / .34));
      links.forEach(function (l, i) {
        var k = Math.min(1, Math.max(0, (grow - i * .18) / .5));
        l.setAttribute('stroke-dashoffset', String(90 - 90 * ease(k)));
      });
      dots.forEach(function (d, i) {
        var k = Math.min(1, Math.max(0, (grow - i * .12) / .4));
        d.style.opacity = String(.35 + .65 * k);
      });
    };
  }

  /* ═══ 2. Controlled flooding ══════════════════════════════════════════
     Paket menyebar hop demi hop; jatah hop berkurang, salinan dibuang.     */
  function simFlooding(svg) {
    svg.setAttribute('viewBox', '0 0 320 170');
    var P = [[34, 86], [112, 48], [112, 124], [196, 86], [274, 60], [274, 116]];
    var E = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [1, 2]];
    var hopOf = [1, 1, 2, 2, 3, 3, 9];      /* 9 = jalur duplikat yang ditekan */
    var lines = E.map(function (e) {
      var l = n('line', { x1: P[e[0]][0], y1: P[e[0]][1], x2: P[e[1]][0], y2: P[e[1]][1],
        stroke: C.dim, 'stroke-width': 1.4 });
      svg.appendChild(l); return l;
    });
    var pulses = E.map(function () { var c = n('circle', { r: 4.2, fill: C.orange, opacity: 0 }); svg.appendChild(c); return c; });
    P.forEach(function (p, i) {
      svg.appendChild(node(p[0], p[1], i === 0 ? 12 : 9.5, i === 0 ? C.red : '#0a2b52', i === 0 ? C.red : C.blueLt, i === 0 ? 'K' : ''));
    });
    var badge = txt(196, 30, '', 10, C.orange); badge.setAttribute('font-weight', '700'); svg.appendChild(badge);
    var drop = txt(160, 158, '', 9, C.mute); svg.appendChild(drop);

    return function (t) {
      var p = (t % 6) / 6;
      var wave = p * 3.4;                    /* gelombang hop berjalan keluar */
      E.forEach(function (e, i) {
        var hop = hopOf[i];
        var dup = hop === 9;
        var k = Math.min(1, Math.max(0, wave - (dup ? 1 : hop - 1)));
        pulses[i].style.opacity = String(k > 0 && k < 1 ? (dup ? .35 : 1) : 0);
        if (k > 0 && k < 1) {
          var a = P[e[0]], b = P[e[1]], e2 = ease(k);
          pulses[i].setAttribute('cx', lerp(a[0], b[0], e2).toFixed(1));
          pulses[i].setAttribute('cy', lerp(a[1], b[1], e2).toFixed(1));
          pulses[i].setAttribute('fill', dup ? C.mute : C.orange);
        }
        lines[i].setAttribute('stroke', k >= 1 && !dup ? 'rgba(228,90,7,.5)' : C.dim);
      });
      var h = Math.max(0, 4 - Math.floor(wave));
      badge.textContent = wave < 3.4 ? 'hop ' + h : '';
      drop.textContent = (wave > 1.2 && wave < 3.2) ? TX('salinan lewat jalur lain → dibuang') : '';
    };
  }

  /* ═══ 3. Gambaran situasi ═════════════════════════════════════════════
     Satu paket, dua tujuan: dasbor posko dan aplikasi genggam.             */
  function simSituasi(svg) {
    svg.setAttribute('viewBox', '0 0 320 170');
    var src = [46, 85], lap = [232, 46], ph = [232, 126];
    [lap, ph].forEach(function (d) {
      svg.appendChild(n('path', { d: 'M' + src[0] + ' ' + src[1] + ' Q 140 ' + ((src[1] + d[1]) / 2 - 18) + ' ' + d[0] + ' ' + d[1],
        fill: 'none', stroke: C.dim, 'stroke-width': 1.4, 'stroke-dasharray': '4 5' }));
    });
    /* dasbor posko */
    var L = n('g', { transform: 'translate(' + lap[0] + ',' + lap[1] + ')' });
    L.appendChild(n('rect', { x: -34, y: -24, width: 68, height: 44, rx: 4, fill: '#0a2b52', stroke: C.blueLt, 'stroke-width': 1.5 }));
    L.appendChild(n('rect', { x: -42, y: 21, width: 84, height: 4, rx: 2, fill: C.blueLt, opacity: .6 }));
    var blipL = n('circle', { r: 3, fill: C.orange, opacity: 0, cx: 6, cy: -6 }); L.appendChild(blipL);
    svg.appendChild(L); svg.appendChild(txt(lap[0], lap[1] + 40, TX('DASBOR POSKO'), 8.5));
    /* ponsel */
    var H = n('g', { transform: 'translate(' + ph[0] + ',' + ph[1] + ')' });
    H.appendChild(n('rect', { x: -15, y: -26, width: 30, height: 48, rx: 5, fill: '#0a2b52', stroke: C.blueLt, 'stroke-width': 1.5 }));
    var blipH = n('circle', { r: 2.6, fill: C.orange, opacity: 0, cx: 3, cy: -4 }); H.appendChild(blipH);
    svg.appendChild(H); svg.appendChild(txt(ph[0], ph[1] + 38, TX('APLIKASI SAR'), 8.5));
    svg.appendChild(node(src[0], src[1], 11, C.red, C.red, 'K'));
    var p1 = n('circle', { r: 4, fill: C.orange, opacity: 0 }); svg.appendChild(p1);
    var p2 = n('circle', { r: 4, fill: C.orange, opacity: 0 }); svg.appendChild(p2);

    return function (t) {
      var p = (t % 4.4) / 4.4;
      var k = Math.min(1, p / .62);
      [[p1, lap], [[p2, ph][0], ph]].forEach(function () {});
      [[p1, lap], [p2, ph]].forEach(function (pair) {
        var c = pair[0], d = pair[1], e2 = ease(k);
        var mx = 140, my = (src[1] + d[1]) / 2 - 18;
        var x = (1 - e2) * (1 - e2) * src[0] + 2 * (1 - e2) * e2 * mx + e2 * e2 * d[0];
        var y = (1 - e2) * (1 - e2) * src[1] + 2 * (1 - e2) * e2 * my + e2 * e2 * d[1];
        c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1));
        c.style.opacity = String(k > 0 && k < 1 ? 1 : 0);
      });
      var lit = p > .62 ? 1 : 0;
      blipL.style.opacity = blipH.style.opacity = String(lit * (0.55 + 0.45 * Math.sin(t * 8)));
    };
  }

  /* ═══ 4. Peta berjenjang ══════════════════════════════════════════════
     Sumber peta gugur satu per satu; posisi node tetap tergambar.          */
  function simFallback(svg) {
    svg.setAttribute('viewBox', '0 0 320 170');
    var layers = [
      { label: TX('UBIN DARING'), build: function (g) {
          for (var i = 0; i < 3; i++) for (var j = 0; j < 2; j++)
            g.appendChild(n('rect', { x: 108 + i * 34, y: 44 + j * 34, width: 31, height: 31, rx: 2,
              fill: 'rgba(63,143,232,.30)', stroke: C.blue, 'stroke-width': .8 })); } },
      { label: TX('UBIN TERSIMPAN'), build: function (g) {
          for (var i = 0; i < 3; i++) for (var j = 0; j < 2; j++)
            g.appendChild(n('rect', { x: 108 + i * 34, y: 44 + j * 34, width: 31, height: 31, rx: 2,
              fill: 'rgba(228,90,7,.20)', stroke: C.orange, 'stroke-width': .8 })); } },
      { label: TX('GRID BUATAN PROGRAM'), build: function (g) {
          for (var i = 0; i <= 3; i++) g.appendChild(n('line', { x1: 108 + i * 34, y1: 44, x2: 108 + i * 34, y2: 112, stroke: C.dim, 'stroke-width': 1 }));
          for (var j = 0; j <= 2; j++) g.appendChild(n('line', { x1: 108, y1: 44 + j * 34, x2: 210, y2: 44 + j * 34, stroke: C.dim, 'stroke-width': 1 })); } }
    ];
    var gs = layers.map(function (L) { var g = n('g', {}); L.build(g); svg.appendChild(g); return g; });
    /* lapisan operasional selalu di atas */
    var ops = n('g', {});
    ops.appendChild(n('path', { d: 'M120 100 L142 78 L168 88 L196 58', fill: 'none', stroke: C.orange, 'stroke-width': 1.6, 'stroke-dasharray': '3 4' }));
    [[120, 100], [196, 58]].forEach(function (p, i) {
      ops.appendChild(n('circle', { cx: p[0], cy: p[1], r: i ? 5 : 4, fill: i ? C.red : C.blueLt }));
    });
    svg.appendChild(ops);
    var lab = txt(159, 134, '', 8.5, C.blueLt); svg.appendChild(lab);
    svg.appendChild(txt(159, 152, TX('posisi & jejak tetap tampil'), 8, C.mute));

    return function (t) {
      var step = Math.floor((t % 7.5) / 2.5);
      gs.forEach(function (g, i) { g.style.opacity = String(i === step ? 1 : 0); });
      lab.textContent = layers[step].label;
    };
  }

  /* ═══ 5. Mesh Cara kerja ══════════════════════════════════════════════
     Satu paket menempuh K → S → S → G, jatah hop turun tiap lompatan.      */
  function simMesh(svg) {
    var P = { K: [78, 250], S1: [188, 172], S2: [162, 292], S3: [322, 116], S4: [316, 232], G: [406, 186] };
    var HOPS = [['K', 'S1'], ['S1', 'S3'], ['S3', 'G']];
    var g = n('g', {});
    svg.appendChild(g);
    var pulse = n('circle', { r: 6.5, fill: C.orange, opacity: 0 }); g.appendChild(pulse);
    var halo = n('circle', { r: 6.5, fill: 'none', stroke: C.orange, 'stroke-width': 2, opacity: 0 }); g.appendChild(halo);
    /* diagram ini duduk di seksi TERANG, jadi warnanya beda dari kartu Gagasan */
    var hopTxt = txt(240, 44, '', 13, '#0f4489'); hopTxt.setAttribute('font-weight', '700'); g.appendChild(hopTxt);
    var note = txt(240, 62, '', 10, '#43566f'); g.appendChild(note);

    return function (t) {
      var cycle = 5.4, p = (t % cycle) / cycle;
      var seg = Math.min(HOPS.length - 1, Math.floor(p * HOPS.length * 1.12));
      var local = Math.min(1, (p * HOPS.length * 1.12) - seg);
      var a = P[HOPS[seg][0]], b = P[HOPS[seg][1]], e2 = ease(local);
      pulse.setAttribute('cx', lerp(a[0], b[0], e2).toFixed(1));
      pulse.setAttribute('cy', lerp(a[1], b[1], e2).toFixed(1));
      pulse.style.opacity = p < .96 ? '1' : '0';
      /* denyut saat tiba di node: jeda acak 400–700 ms sebelum diteruskan */
      var arrive = local > .82 ? (local - .82) / .18 : 0;
      halo.setAttribute('cx', b[0]); halo.setAttribute('cy', b[1]);
      halo.setAttribute('r', String(6.5 + arrive * 16));
      halo.style.opacity = String(arrive > 0 ? (1 - arrive) * .8 : 0);
      hopTxt.textContent = p < .96 ? 'hop ' + (4 - seg) : TX('diterima posko');
      note.textContent = arrive > .2 ? TX('jeda acak 400–700 ms') : '';
    };
  }

  var REG = { nooperator: simNoOperator, flooding: simFlooding, situasi: simSituasi,
              fallback: simFallback, mesh: simMesh };

  /* ---------- pemasangan & satu loop bersama ------------------------------ */
  var sims = [];
  [].forEach.call(document.querySelectorAll('[data-sim]'), function (svg) {
    var make = REG[svg.dataset.sim];
    if (!make) return;
    try {
      var draw = make(svg);
      var s = { draw: draw, visible: false };
      sims.push(s);
      if (window.IntersectionObserver) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { s.visible = e.isIntersecting; });
        }, { rootMargin: '80px' }).observe(svg);
      } else s.visible = true;
      draw(1.6);                       /* pose awal yang informatif */
    } catch (err) { console.error('[sim] gagal membangun', svg.dataset.sim, err); }
  });

  if (!sims.length) return;
  var motionOn = function () { return !window.PRMotion || window.PRMotion.on; };
  var t0 = performance.now(), wasOn = true;
  (function loop(now) {
    requestAnimationFrame(loop);
    var on = motionOn();
    if (!on) {
      if (wasOn) { sims.forEach(function (s) { s.draw(1.6); }); wasOn = false; }
      return;
    }
    wasOn = true;
    var t = (now - t0) / 1000;
    for (var i = 0; i < sims.length; i++) if (sims[i].visible) sims[i].draw(t);
  })(performance.now());
})();
