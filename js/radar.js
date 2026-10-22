/* ==========================================================================
   radar.js
   Port vanilla dari komponen <Radar /> React Bits (varian JavaScript + CSS).
   Shader GLSL-nya dipakai apa adanya; yang diganti hanya lapisan penggambarnya
   — ogl ditukar WebGL mentah supaya proyek ini tidak perlu menambah pustaka.
   Satu segitiga layar penuh, uniform yang sama persis dengan komponen aslinya.

   Pemakaian:
     <div class="radar" data-radar data-color="#3f8fe8" data-speed="0.6"></div>
   Semua prop dibaca dari data-* dengan nama kebab-case.

   Catatan warna: backgroundColor hitam membuat alpha = panjang sinyal, jadi
   kanvasnya transparan dan hanya garis radar yang tergambar di atas latar
   halaman. Itu yang dipakai di sini.
   ========================================================================== */
(function () {
  'use strict';

  var VERT = [
    'attribute vec2 uv;',
    'attribute vec2 position;',
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  gl_Position = vec4(position, 0, 1);',
    '}'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform float uTime;',
    'uniform vec3  uResolution;',
    'uniform float uSpeed;',
    'uniform float uScale;',
    'uniform float uRingCount;',
    'uniform float uSpokeCount;',
    'uniform float uRingThickness;',
    'uniform float uSpokeThickness;',
    'uniform float uSweepSpeed;',
    'uniform float uSweepWidth;',
    'uniform float uSweepLobes;',
    'uniform vec3  uColor;',
    'uniform vec3  uBgColor;',
    'uniform bool  uLightMode;',
    'uniform float uFalloff;',
    'uniform float uBrightness;',
    'uniform vec2  uMouse;',
    'uniform float uMouseInfluence;',
    'uniform bool  uEnableMouse;',
    '#define TAU 6.28318530718',
    '#define PI 3.14159265359',
    'void main() {',
    '  vec2 st = gl_FragCoord.xy / uResolution.xy;',
    '  st = st * 2.0 - 1.0;',
    '  st.x *= uResolution.x / uResolution.y;',
    '  if (uEnableMouse) {',
    '    vec2 mShift = (uMouse * 2.0 - 1.0);',
    '    mShift.x *= uResolution.x / uResolution.y;',
    '    st -= mShift * uMouseInfluence;',
    '  }',
    '  st *= uScale;',
    '  float dist = length(st);',
    '  float theta = atan(st.y, st.x);',
    '  float t = uTime * uSpeed;',
    '  float ringPhase = dist * uRingCount - t;',
    '  float ringDist = abs(fract(ringPhase) - 0.5);',
    '  float ringGlow = 1.0 - smoothstep(0.0, uRingThickness, ringDist);',
    '  float spokeAngle = abs(fract(theta * uSpokeCount / TAU + 0.5) - 0.5) * TAU / uSpokeCount;',
    '  float arcDist = spokeAngle * dist;',
    '  float spokeGlow = (1.0 - smoothstep(0.0, uSpokeThickness, arcDist)) * smoothstep(0.0, 0.1, dist);',
    '  float sweepPhase = t * uSweepSpeed;',
    '  float sweepBeam = pow(max(0.5 * sin(uSweepLobes * theta + sweepPhase) + 0.5, 0.0), uSweepWidth);',
    '  float fade = smoothstep(1.05, 0.85, dist) * pow(max(1.0 - dist, 0.0), uFalloff);',
    '  float intensity = max((ringGlow + spokeGlow + sweepBeam) * fade * uBrightness, 0.0);',
    '  vec3 signal = uColor * intensity;',
    '  vec3 col;',
    '  if (uLightMode) {',
    '    vec3 mapped = vec3(1.0) - exp(-max(signal, vec3(0.0)) * 1.45);',
    '    float energy = clamp(max(mapped.r, max(mapped.g, mapped.b)), 0.0, 1.0);',
    '    vec3 hue = mapped / max(energy, 0.0001);',
    '    hue = pow(clamp(hue, 0.0, 1.0), vec3(1.2));',
    '    col = mix(uBgColor, hue, smoothstep(0.015, 0.8, energy) * 0.96);',
    '    gl_FragColor = vec4(col, 1.0);',
    '  } else {',
    '    col = signal + uBgColor;',
    '    float alpha = clamp(length(col), 0.0, 1.0);',
    '    gl_FragColor = vec4(col, alpha);',
    '  }',
    '}'
  ].join('\n');

  var DEFAULTS = {
    speed: 1.0, scale: 0.5, ringCount: 10.0, spokeCount: 10.0,
    ringThickness: 0.05, spokeThickness: 0.01, sweepSpeed: 1.0,
    sweepWidth: 2.0, sweepLobes: 1.0, falloff: 2.0, brightness: 1.0,
    mouseInfluence: 0.1, enableMouseInteraction: true, lightMode: false,
    color: '#9f29ff', backgroundColor: '#000000'
  };

  function hexToVec3(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16) / 255,
            parseInt(h.slice(2, 4), 16) / 255,
            parseInt(h.slice(4, 6), 16) / 255];
  }

  function readOptions(el) {
    var o = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      var attr = 'data-' + k.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); });
      var raw = el.getAttribute(attr);
      var def = DEFAULTS[k];
      if (raw === null) { o[k] = def; return; }
      if (typeof def === 'boolean') o[k] = raw !== 'false';
      else if (typeof def === 'number') { var n = parseFloat(raw); o[k] = isNaN(n) ? def : n; }
      else o[k] = raw;
    });
    return o;
  }

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('[radar] shader gagal dikompilasi:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function init(host) {
    var o = readOptions(host);
    var canvas = document.createElement('canvas');
    canvas.className = 'radar__canvas';
    var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: true })
          || canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) { host.classList.add('is-unsupported'); return; }

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[radar] program gagal ditautkan:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    /* satu segitiga menutupi layar — sama seperti geometri Triangle di ogl */
    function attrib(name, data, size) {
      var loc = gl.getAttribLocation(prog, name);
      if (loc < 0) return;
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
    attrib('position', [-1, -1, 3, -1, -1, 3], 2);
    attrib('uv',       [ 0,  0, 2,  0,  0, 2], 2);

    var U = {};
    ['uTime','uResolution','uSpeed','uScale','uRingCount','uSpokeCount','uRingThickness',
     'uSpokeThickness','uSweepSpeed','uSweepWidth','uSweepLobes','uColor','uBgColor',
     'uLightMode','uFalloff','uBrightness','uMouse','uMouseInfluence','uEnableMouse']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    gl.uniform1f(U.uSpeed, o.speed);
    gl.uniform1f(U.uScale, o.scale);
    gl.uniform1f(U.uRingCount, o.ringCount);
    gl.uniform1f(U.uSpokeCount, o.spokeCount);
    gl.uniform1f(U.uRingThickness, o.ringThickness);
    gl.uniform1f(U.uSpokeThickness, o.spokeThickness);
    gl.uniform1f(U.uSweepSpeed, o.sweepSpeed);
    gl.uniform1f(U.uSweepWidth, o.sweepWidth);
    gl.uniform1f(U.uSweepLobes, o.sweepLobes);
    gl.uniform3fv(U.uColor, hexToVec3(o.color));
    gl.uniform3fv(U.uBgColor, hexToVec3(o.backgroundColor));
    gl.uniform1i(U.uLightMode, o.lightMode ? 1 : 0);
    gl.uniform1f(U.uFalloff, o.falloff);
    gl.uniform1f(U.uBrightness, o.brightness);
    gl.uniform1f(U.uMouseInfluence, o.mouseInfluence);
    gl.uniform1i(U.uEnableMouse, o.enableMouseInteraction ? 1 : 0);

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    host.appendChild(canvas);

    var dpr = Math.min(devicePixelRatio || 1, 2);
    function resize() {
      var w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform3f(U.uResolution, canvas.width, canvas.height, canvas.width / canvas.height);
    }
    resize();
    addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(host);

    var cur = [0.5, 0.5], tgt = [0.5, 0.5];
    if (o.enableMouseInteraction) {
      canvas.addEventListener('mousemove', function (e) {
        var r = canvas.getBoundingClientRect();
        tgt = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
      });
      canvas.addEventListener('mouseleave', function () { tgt = [0.5, 0.5]; });
    }

    var motionOn = function () { return !window.PRMotion || window.PRMotion.on; };
    var visible = true, raf = 0;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      gl.uniform1f(U.uTime, motionOn() ? now * 0.001 : 8.0);   /* waktu dibekukan saat animasi dimatikan */
      if (o.enableMouseInteraction) {
        cur[0] += 0.05 * (tgt[0] - cur[0]);
        cur[1] += 0.05 * (tgt[1] - cur[1]);
        gl.uniform2f(U.uMouse, cur[0], cur[1]);
      } else {
        gl.uniform2f(U.uMouse, 0.5, 0.5);
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    raf = requestAnimationFrame(frame);

    /* hemat GPU saat bagian ini keluar layar */
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          visible = e.isIntersecting;
          if (visible && !raf) raf = requestAnimationFrame(frame);
        });
      }, { rootMargin: '120px' }).observe(host);
    }
  }

  function boot() { [].forEach.call(document.querySelectorAll('[data-radar]'), init); }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();
