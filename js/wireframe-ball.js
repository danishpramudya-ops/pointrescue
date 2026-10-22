/* ==========================================================================
   wireframe-ball.js — bola rangka berputar, digambar di WebGL mentah

   KENAPA DITULIS SENDIRI, BUKAN DIPASANG DARI PAKETNYA

   Komponen <WireframeBall /> ada di React Bits **Pro**: dipasang lewat
   `npx shadcn add`, butuh components.json, registry berlisensi, dan kunci
   REACTBITS_LICENSE_KEY. Situs ini vanilla tanpa build dan tanpa npm — satu
   perintah itu akan menyeret React, Tailwind, dan langkah build ke proyek
   yang justru dirancang tidak punya semuanya. Kuncinya juga tidak ada di
   sini. Jadi yang dibawa masuk adalah VISUALNYA, ditulis ulang dengan
   perkakas yang sudah dipakai situs ini — sama seperti Radar, GlowCursor,
   ScrollExpand, GooeyNav dan TiltedCard sebelumnya.

   CARA MENGGAMBARNYA, DAN KENAPA BUKAN RAYMARCH

   Versi Pro me-raymarch SDF polihedron di dalam shader. Di sini pendekatannya
   analitik: 12 titik ikosahedron diputar dan diproyeksikan di JS, lalu 30
   rusuknya dikirim ke shader sebagai ruas garis layar. Tiap piksel menghitung
   jaraknya ke tiap ruas dan menumpuk cahayanya.

   Alasannya bukan kemalasan, tapi anggaran: halaman ini sudah menjalankan dua
   radar WebGL, satu mesin 3D three.js, satu build web Flutter, dan satu kanvas
   mesh. Raymarching SDF butuh puluhan langkah × 30 uji jarak untuk tiap
   piksel; cara analitik butuh 30 uji saja, sekali. Hasil pandangnya sama —
   rusuk bercahaya lembut yang meredup di sisi jauh — dengan ongkos sepersekian.

   YANG MEMBUATNYA NYAMBUNG DENGAN ALATNYA

   Ikosahedron itu 12 simpul dan 30 rusuk. Di situs ini simpul digambar lebih
   terang daripada rusuknya, karena memang itu maknanya: node dan tautan.
   Sisi yang membelakangi kamera diredupkan, jadi bolanya terbaca punya
   kedalaman — bukan lingkaran datar.

   Pemakaian:
     <div class="wball" data-wball data-color="#6fb0ff" data-speed="0.5"></div>
   Semua prop lewat data-* kebab-case.
   ========================================================================== */
(function () {
  'use strict';

  var RUSUK = 30, SIMPUL = 12;

  var VERT = [
    'attribute vec2 position;',
    'void main(){ gl_Position = vec4(position, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2  uRes;',
    'uniform vec4  uEdge[' + RUSUK + '];',    // x1,y1,x2,y2 dalam piksel
    'uniform vec2  uEdgeZ[' + RUSUK + '];',   // kedalaman 0..1 tiap ujung
    'uniform vec3  uNode[' + SIMPUL + '];',   // x,y piksel + kedalaman
    'uniform vec3  uColor;',
    'uniform vec3  uColorHot;',
    'uniform float uThick;',
    'uniform float uGlow;',
    'uniform float uBright;',

    /* jarak piksel ke ruas garis, plus posisi relatifnya di sepanjang ruas
       (dipakai untuk melerp kedalaman kedua ujungnya) */
    'vec2 segDist(vec2 p, vec2 a, vec2 b){',
    '  vec2 pa = p - a, ba = b - a;',
    '  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);',
    '  return vec2(length(pa - ba * h), h);',
    '}',

    'void main(){',
    '  vec2 p = gl_FragCoord.xy;',
    '  float aku = 0.0;',      // cahaya rusuk
    '  float node = 0.0;',     // cahaya simpul
    '  for (int i = 0; i < ' + RUSUK + '; i++) {',
    '    vec4 e = uEdge[i];',
    '    vec2 dz = segDist(p, e.xy, e.zw);',
    '    float z = mix(uEdgeZ[i].x, uEdgeZ[i].y, dz.y);',
    /*   sisi jauh menipis DAN meredup — itu yang memberi kesan bola,
         bukan lingkaran datar */
    '    float dekat = smoothstep(0.0, 1.0, z);',
    '    float tebal = uThick * mix(0.55, 1.0, dekat);',
    '    float g = exp(-max(dz.x - tebal, 0.0) / uGlow);',
    '    aku += g * mix(0.18, 1.0, dekat);',
    '  }',
    '  for (int j = 0; j < ' + SIMPUL + '; j++) {',
    '    vec3 n = uNode[j];',
    '    float d = length(p - n.xy);',
    '    float dekat = smoothstep(0.0, 1.0, n.z);',
    '    float r = uThick * mix(1.4, 2.6, dekat);',
    '    node += exp(-max(d - r, 0.0) / (uGlow * 0.85)) * mix(0.22, 1.0, dekat);',
    '  }',
    '  float a = clamp((aku * 0.55 + node * 0.9) * uBright, 0.0, 1.0);',
    '  vec3 warna = mix(uColor, uColorHot, clamp(node * 0.8, 0.0, 1.0));',
    '  gl_FragColor = vec4(warna * a, a);',
    '}'
  ].join('\n');

  /* ---- ikosahedron: 12 simpul, 30 rusuk -------------------------------- */
  function ikosahedron() {
    var t = (1 + Math.sqrt(5)) / 2;
    var v = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ];
    var n = Math.sqrt(1 + t * t);
    for (var i = 0; i < v.length; i++) {
      v[i][0] /= n; v[i][1] /= n; v[i][2] /= n;
    }
    /* rusuk = tiap pasang simpul yang jaraknya sama dengan jarak terpendek.
       Dihitung, bukan didaftar tangan — daftar 30 pasang yang diketik manual
       terlalu mudah salah satu angka dan cacatnya sulit terlihat. */
    var min2 = Infinity, i2, j2;
    for (i2 = 0; i2 < 12; i2++) {
      for (j2 = i2 + 1; j2 < 12; j2++) {
        var d = 0;
        for (var k = 0; k < 3; k++) { var s = v[i2][k] - v[j2][k]; d += s * s; }
        if (d < min2) min2 = d;
      }
    }
    var e = [];
    for (i2 = 0; i2 < 12; i2++) {
      for (j2 = i2 + 1; j2 < 12; j2++) {
        var dd = 0;
        for (var k2 = 0; k2 < 3; k2++) { var s2 = v[i2][k2] - v[j2][k2]; dd += s2 * s2; }
        if (Math.abs(dd - min2) < 1e-6) e.push([i2, j2]);
      }
    }
    return { v: v, e: e };
  }

  function pasang(host) {
    var ds = host.dataset;
    function num(nama, bawaan) {
      var x = parseFloat(ds[nama]); return isNaN(x) ? bawaan : x;
    }
    function warna(nama, bawaan) {
      var c = (ds[nama] || bawaan).replace('#', '');
      if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
      var n = parseInt(c, 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }

    var CFG = {
      speed: num('speed', 0.5),
      scale: num('scale', 0.72),
      thickness: num('thickness', 1.1),
      glow: num('glow', 5.0),
      brightness: num('brightness', 1.0),
      tilt: num('tilt', 0.42),
      color: warna('color', '#6fb0ff'),
      colorHot: warna('colorHot', '#e45a07')
    };

    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false })
          || canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: true });
    if (!gl) return;

    function shader(jenis, src) {
      var s = gl.createShader(jenis);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('wball:', gl.getShaderInfoLog(s)); return null;
      }
      return s;
    }
    var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('wball:', gl.getProgramInfoLog(prog)); return;
    }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var u = {};
    ['uRes', 'uEdge', 'uEdgeZ', 'uNode', 'uColor', 'uColorHot',
     'uThick', 'uGlow', 'uBright'].forEach(function (n) {
      u[n] = gl.getUniformLocation(prog, n);
    });
    gl.uniform3fv(u.uColor, CFG.color);
    gl.uniform3fv(u.uColorHot, CFG.colorHot);
    gl.uniform1f(u.uGlow, CFG.glow);
    gl.uniform1f(u.uBright, CFG.brightness);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    var geo = ikosahedron();
    var W = 1, H = 1, dpr = 1;

    function resize() {
      /* setPixelRatio harus dihitung ULANG di sini; kalau tidak, kanvasnya
         meleset saat jendela dipindah ke layar dengan kerapatan berbeda */
      dpr = Math.min(devicePixelRatio || 1, 2);
      var r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W; canvas.height = H;
      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';
      gl.viewport(0, 0, W, H);
      gl.uniform2f(u.uRes, W, H);
      gl.uniform1f(u.uThick, CFG.thickness * dpr);
    }
    resize();
    addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(host);

    var edge = new Float32Array(RUSUK * 4);
    var edgeZ = new Float32Array(RUSUK * 2);
    var node = new Float32Array(SIMPUL * 3);
    var px = new Float32Array(SIMPUL * 3);

    function gambar(t) {
      var ax = t * CFG.speed * 0.42 + CFG.tilt;
      var ay = t * CFG.speed * 0.63;
      var sx = Math.sin(ax), cx = Math.cos(ax);
      var sy = Math.sin(ay), cy = Math.cos(ay);
      var R = Math.min(W, H) * 0.5 * CFG.scale;
      var cxp = W * 0.5, cyp = H * 0.5;

      for (var i = 0; i < SIMPUL; i++) {
        var v = geo.v[i];
        /* putar sumbu Y lalu sumbu X — cukup untuk gerak turntable yang
           tidak pernah mengunci ke satu pose */
        var x1 = v[0] * cy + v[2] * sy;
        var z1 = -v[0] * sy + v[2] * cy;
        var y2 = v[1] * cx - z1 * sx;
        var z2 = v[1] * sx + z1 * cx;
        px[i * 3] = cxp + x1 * R;
        px[i * 3 + 1] = cyp + y2 * R;
        px[i * 3 + 2] = (z2 + 1) * 0.5;      // 0 = jauh, 1 = dekat
      }
      for (var e = 0; e < RUSUK; e++) {
        var a = geo.e[e][0], b = geo.e[e][1];
        edge[e * 4] = px[a * 3]; edge[e * 4 + 1] = px[a * 3 + 1];
        edge[e * 4 + 2] = px[b * 3]; edge[e * 4 + 3] = px[b * 3 + 1];
        edgeZ[e * 2] = px[a * 3 + 2]; edgeZ[e * 2 + 1] = px[b * 3 + 2];
      }
      node.set(px);

      gl.uniform4fv(u.uEdge, edge);
      gl.uniform2fv(u.uEdgeZ, edgeZ);
      gl.uniform3fv(u.uNode, node);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    var motionOn = function () { return !window.PRMotion || window.PRMotion.on; };
    var terlihat = true, jam = 0, last = performance.now(), loop = 0;

    function tik(now) {
      loop = requestAnimationFrame(tik);
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!terlihat) return;
      if (motionOn()) jam += dt;
      gambar(jam);
    }

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { terlihat = e.isIntersecting; });
      }, { threshold: 0 }).observe(host);
    }
    /* digambar sekali walaupun animasinya dimatikan — kalau tidak, kanvasnya
       kosong dan seksinya kehilangan visualnya sama sekali */
    gambar(0);
    loop = requestAnimationFrame(tik);
  }

  var daftar = [].slice.call(document.querySelectorAll('[data-wball]'));
  daftar.forEach(pasang);
})();
