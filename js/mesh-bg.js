/* ==========================================================================
   mesh-bg.js — latar jaringan hidup

   Satu kanvas tetap di belakang seluruh halaman: titik-titik melayang pelan
   dan saling menarik garis ketika cukup dekat, sesekali ada paket berjalan di
   antara dua titik. Bukan sekadar hiasan — itu persis gambaran mesh LoRa yang
   dijelaskan situs ini.

   Kenapa SATU kanvas tetap, bukan satu per seksi: seksi gelap dibuat agak
   tembus (lihat .sec--dark di style.css) sehingga kanvas ini terlihat
   menembusnya, jadi cukup satu konteks 2D untuk seluruh halaman.
   ========================================================================== */
(function () {
  'use strict';

  var cv = document.getElementById('meshbg');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var motionOn = function () { return !window.PRMotion || window.PRMotion.on; };

  var LINK = 168;            /* jarak maksimum dua titik masih ditarik garis */
  var pts = [], packets = [], dpr = 1, W = 0, H = 0;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var want = Math.round(Math.min(72, Math.max(26, (W * H) / 26000)));
    while (pts.length < want) {
      pts.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * 9, vy: (Math.random() - .5) * 9,
        r: 0.9 + Math.random() * 1.3,
        /* sedikit titik dibuat "node" yang berdenyut */
        beat: Math.random() < .16 ? Math.random() * 6 : -1
      });
    }
    pts.length = want;
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  function spawnPacket() {
    if (pts.length < 2) return;
    var a = pts[(Math.random() * pts.length) | 0];
    var near = [];
    for (var i = 0; i < pts.length; i++) {
      var b = pts[i];
      if (b === a) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < LINK) near.push(b);
    }
    if (!near.length) return;
    packets.push({ a: a, b: near[(Math.random() * near.length) | 0], t: 0,
                   sp: 0.55 + Math.random() * 0.5 });
  }

  var last = performance.now(), acc = 0, still = false;

  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min((now - last) / 1000, .05); last = now;

    /* animasi mati: gambar sekali lalu berhenti, isinya tetap ada */
    if (!motionOn()) { if (!still) { draw(0); still = true; } return; }
    still = false;

    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < -40) p.x = W + 40; else if (p.x > W + 40) p.x = -40;
      if (p.y < -40) p.y = H + 40; else if (p.y > H + 40) p.y = -40;
      if (p.beat >= 0) p.beat += dt;
    }
    acc += dt;
    if (acc > 1.1) { acc = 0; if (packets.length < 5) spawnPacket(); }
    for (var k = packets.length - 1; k >= 0; k--) {
      packets[k].t += packets[k].sp * dt;
      if (packets[k].t >= 1) packets.splice(k, 1);
    }
    draw(dt);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* garis antartitik */
    ctx.lineWidth = 1;
    for (var i = 0; i < pts.length; i++) {
      for (var j = i + 1; j < pts.length; j++) {
        var a = pts[i], b = pts[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 > LINK * LINK) continue;
        var t = 1 - Math.sqrt(d2) / LINK;
        ctx.strokeStyle = 'rgba(111,176,255,' + (t * t * 0.17).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }

    /* titik */
    for (var m = 0; m < pts.length; m++) {
      var p = pts[m];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(143,190,250,.42)';
      ctx.fill();
      if (p.beat >= 0) {                       /* cincin denyut pada node */
        var ph = (p.beat % 3.4) / 3.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 + ph * 22, 0, 6.2832);
        ctx.strokeStyle = 'rgba(111,176,255,' + ((1 - ph) * 0.13).toFixed(3) + ')';
        ctx.lineWidth = 1; ctx.stroke();
      }
    }

    /* paket berjalan */
    for (var q = 0; q < packets.length; q++) {
      var pk = packets[q];
      var x = pk.a.x + (pk.b.x - pk.a.x) * pk.t;
      var y = pk.a.y + (pk.b.y - pk.a.y) * pk.t;
      var fade = Math.sin(pk.t * Math.PI);
      ctx.beginPath();
      ctx.arc(x, y, 1.9, 0, 6.2832);
      ctx.fillStyle = 'rgba(228,120,40,' + (fade * .75).toFixed(3) + ')';
      ctx.fill();
    }
  }

  requestAnimationFrame(frame);
})();
