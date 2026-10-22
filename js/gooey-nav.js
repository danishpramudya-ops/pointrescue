/* ==========================================================================
   gooey-nav.js — port vanilla dari komponen <GooeyNav /> React Bits
                  (varian JavaScript + CSS)

   MODEL GERAKNYA DIPERTAHANKAN UTUH. Fungsi noise(), getXY(), createParticle()
   dan makeParticles() disalin apa adanya: sudut partikel tetap
   ((360 + noise(8)) / total) * index, jarak luar-dalam tetap dari
   particleDistances, waktu gelembung tetap animationTime * 2 + timeVariance,
   dan trik gooey-nya tetap blur(7px) contrast(100) di atas latar hitam dengan
   mix-blend-mode: lighten. Nama propnya sama, cuma pindah ke data-* kebab-case.

   YANG DITAMBAHKAN — supaya animasinya bicara soal SINYAL, bukan gelembung:

   1. CINCIN PANCAR. Tiga cincin memuai dari tombol yang baru aktif, persis
      motif radar di hero dan penutup. Digambar DI LUAR lapisan gooey supaya
      tetap tipis; kalau ikut masuk filter, contrast(100) akan menebalkannya
      jadi gumpalan.
   2. LOMPATAN PAKET. Garis putus-putus ditarik dari tombol yang tadi aktif ke
      tombol yang baru, lalu satu titik oranye berjalan menyusurinya. Itu
      gambaran controlled flooding yang jadi inti alat ini: paket berpindah
      hop demi hop, bukan muncul begitu saja.
   3. Warna partikelnya diganti ke palet Point Rescue — biru, biru muda,
      oranye, merah — menggantikan warna bawaan komponennya.

   YANG BERBEDA DARI VERSI REACT. Di sana state aktif dipegang React dan hanya
   berubah saat diklik. Di sini nav-nya juga digerakkan scrollspy, jadi sumber
   kebenarannya kelas .is-active pada <a>, dan modul ini mengamatinya lewat
   MutationObserver. Akibatnya efeknya ikut jalan saat orang menggulir, bukan
   cuma saat mengklik — dan js/scroll.js tidak perlu disentuh sama sekali.
   ========================================================================== */
(function () {
  'use strict';

  var nav = document.querySelector('.nav__links');
  if (!nav) return;

  var links = [].slice.call(nav.querySelectorAll('a'));
  if (links.length < 2) return;

  var gerak = function () { return !window.PRMotion || window.PRMotion.on; };
  var kasar = matchMedia('(pointer: coarse)').matches;

  /* ---- prop komponen aslinya, lewat data-* pada .nav__links ------------- */
  function num(nama, bawaan) {
    var v = parseFloat(nav.dataset[nama]);
    return isNaN(v) ? bawaan : v;
  }
  var CFG = {
    animationTime: num('animationTime', 600),
    particleCount: num('particleCount', 14),
    particleDistances: [num('particleDistanceOuter', 54), num('particleDistanceInner', 8)],
    particleR: num('particleR', 100),
    timeVariance: num('timeVariance', 300),
    colors: [1, 2, 3, 1, 2, 3, 1, 4]
  };

  /* ---- lapisan efek ----------------------------------------------------- */
  nav.classList.add('gnav');
  /* Latar hitam yang dibutuhkan trik contrast(100) berukuran inset -70px;
     di komponen aslinya wadahnya setinggi 600 px jadi tidak kelihatan, di
     bilah nav setinggi ~50 px ia bocor jadi kotak hitam di bawah nav.
     Semua lapisan yang mengandung hitam itu dimasukkan ke wadah berkliping. */
  var lapis = document.createElement('span');
  lapis.className = 'gnav__lapis';
  var filter = document.createElement('span');
  filter.className = 'gnav__filter';
  var teks = document.createElement('span');
  teks.className = 'gnav__teks';
  var sinyal = document.createElement('span');
  sinyal.className = 'gnav__sinyal';
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'gnav__hop');
  svg.setAttribute('aria-hidden', 'true');
  var hop = document.createElementNS(NS, 'path');
  hop.setAttribute('class', 'gnav__hopjalur');
  var paket = document.createElementNS(NS, 'circle');
  paket.setAttribute('class', 'gnav__paket');
  paket.setAttribute('r', '3.4');
  svg.appendChild(hop);
  svg.appendChild(paket);
  lapis.appendChild(filter);
  lapis.appendChild(sinyal);
  lapis.appendChild(svg);
  nav.appendChild(lapis);
  nav.appendChild(teks);   /* teks di luar kliping supaya tidak ikut terpotong */

  /* ---- fungsi asli komponennya, tidak diubah ---------------------------- */
  var noise = function (n) { n = n === undefined ? 1 : n; return n / 2 - Math.random() * n; };

  function getXY(distance, pointIndex, totalPoints) {
    var angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  }

  function createParticle(i, t, d, r) {
    var rotate = noise(r / 10);
    return {
      start: getXY(d[0], CFG.particleCount - i, CFG.particleCount),
      end: getXY(d[1] + noise(7), CFG.particleCount - i, CFG.particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: CFG.colors[Math.floor(Math.random() * CFG.colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
    };
  }

  function makeParticles(element) {
    var d = CFG.particleDistances;
    var r = CFG.particleR;
    var bubbleTime = CFG.animationTime * 2 + CFG.timeVariance;
    element.style.setProperty('--time', bubbleTime + 'ms');

    for (var i = 0; i < CFG.particleCount; i++) {
      (function (i) {
        var t = CFG.animationTime * 2 + noise(CFG.timeVariance * 2);
        var p = createParticle(i, t, d, r);
        element.classList.remove('active');

        setTimeout(function () {
          var particle = document.createElement('span');
          var point = document.createElement('span');
          particle.classList.add('particle');
          particle.style.setProperty('--start-x', p.start[0] + 'px');
          particle.style.setProperty('--start-y', p.start[1] + 'px');
          particle.style.setProperty('--end-x', p.end[0] + 'px');
          particle.style.setProperty('--end-y', p.end[1] + 'px');
          particle.style.setProperty('--time', p.time + 'ms');
          particle.style.setProperty('--scale', String(p.scale));
          particle.style.setProperty('--color', 'var(--gnav-color-' + p.color + ', white)');
          particle.style.setProperty('--rotate', p.rotate + 'deg');

          point.classList.add('point');
          particle.appendChild(point);
          element.appendChild(particle);
          requestAnimationFrame(function () { element.classList.add('active'); });
          setTimeout(function () {
            try { element.removeChild(particle); } catch (e) { /* sudah dibuang */ }
          }, t);
        }, 30);
      })(i);
    }
  }

  function updateEffectPosition(element) {
    var kNav = nav.getBoundingClientRect();
    var kLapis = lapis.getBoundingClientRect();
    var pos = element.getBoundingClientRect();
    /* pill-nya dilebihkan sedikit dari kotak <a>: blur(7px) + contrast(100)
       mengikis tepinya, dan tanpa kelebihan ini huruf pertama dan terakhir
       ikut terpotong */
    var PX = 11, PY = 5;
    Object.assign(filter.style, {
      left: (pos.x - kLapis.x - PX) + 'px', top: (pos.y - kLapis.y - PY) + 'px',
      width: (pos.width + PX * 2) + 'px', height: (pos.height + PY * 2) + 'px'
    });
    Object.assign(teks.style, {
      left: (pos.x - kNav.x) + 'px', top: (pos.y - kNav.y) + 'px',
      width: pos.width + 'px', height: pos.height + 'px'
    });
    /* metrik hurufnya disalin dari <a>-nya sendiri; 'inherit' mengambil dari
       .nav__links dan hasilnya dua teks yang tidak bertindih rapi */
    var cs = getComputedStyle(element);
    teks.style.font = cs.font;
    teks.style.letterSpacing = cs.letterSpacing;
    teks.style.textTransform = cs.textTransform;
    teks.textContent = element.textContent;
  }

  /* ---- tambahan bertema sinyal ------------------------------------------ */
  function pancarCincin(element) {
    var wadah = lapis.getBoundingClientRect();
    var pos = element.getBoundingClientRect();
    sinyal.style.left = (pos.x - wadah.x + pos.width / 2) + 'px';
    sinyal.style.top = (pos.y - wadah.y + pos.height / 2) + 'px';
    for (var i = 0; i < 3; i++) {
      (function (i) {
        setTimeout(function () {
          var c = document.createElement('i');
          sinyal.appendChild(c);
          setTimeout(function () {
            try { sinyal.removeChild(c); } catch (e) { /* sudah dibuang */ }
          }, 1100);
        }, i * 150);
      })(i);
    }
  }

  function lompatPaket(dari, ke) {
    if (!dari || dari === ke) return;
    var wadah = lapis.getBoundingClientRect();
    var a = dari.getBoundingClientRect();
    var b = ke.getBoundingClientRect();
    var x1 = a.x - wadah.x + a.width / 2, y1 = a.y - wadah.y + a.height / 2;
    var x2 = b.x - wadah.x + b.width / 2, y2 = b.y - wadah.y + b.height / 2;
    /* lengkung tipis ke atas — paket yang melompat, bukan garis lurus */
    var mx = (x1 + x2) / 2, my = Math.min(y1, y2) - Math.min(26, Math.abs(x2 - x1) * 0.22 + 8);
    svg.setAttribute('viewBox', '0 0 ' + wadah.width + ' ' + wadah.height);
    svg.style.width = wadah.width + 'px';
    svg.style.height = wadah.height + 'px';
    hop.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' Q ' + mx + ' ' + my + ' ' + x2 + ' ' + y2);

    var panjang = hop.getTotalLength();
    hop.style.transition = 'none';
    hop.setAttribute('stroke-dasharray', '5 6');
    hop.setAttribute('stroke-dashoffset', panjang);
    hop.style.opacity = '1';

    svg.classList.add('is-on');
    var mulai = performance.now(), lama = 520;
    (function jalan(now) {
      var u = Math.min(1, (now - mulai) / lama);
      var e = 1 - Math.pow(1 - u, 3);
      hop.setAttribute('stroke-dashoffset', String(panjang * (1 - e)));
      var t = hop.getPointAtLength(panjang * e);
      paket.setAttribute('cx', t.x);
      paket.setAttribute('cy', t.y);
      paket.style.opacity = String(u < 0.9 ? 1 : (1 - u) * 10);
      if (u < 1) requestAnimationFrame(jalan);
      else {
        hop.style.transition = 'opacity .45s ease';
        hop.style.opacity = '0';
        paket.style.opacity = '0';
        setTimeout(function () { svg.classList.remove('is-on'); }, 460);
      }
    })(mulai);
  }

  /* ---- pengendali ------------------------------------------------------- */
  var aktif = links.findIndex(function (a) { return a.classList.contains('is-active'); });
  if (aktif < 0) aktif = 0;

  function pindah(i, ledak) {
    var el = links[i];
    if (!el) return;
    var sebelum = links[aktif];
    aktif = i;
    updateEffectPosition(el);

    if (!ledak || !gerak()) return;

    [].forEach.call(filter.querySelectorAll('.particle'), function (p) {
      try { filter.removeChild(p); } catch (e) { /* sudah dibuang */ }
    });
    teks.classList.remove('active');
    void teks.offsetWidth;              // paksa reflow, sama seperti versi React
    teks.classList.add('active');
    makeParticles(filter);
    pancarCincin(el);
    lompatPaket(sebelum, el);
  }

  /* sumber kebenaran: kelas .is-active, yang ditulis scrollspy DAN klik */
  var mo = new MutationObserver(function () {
    var i = links.findIndex(function (a) { return a.classList.contains('is-active'); });
    if (i >= 0 && i !== aktif) pindah(i, true);
  });
  links.forEach(function (a) {
    mo.observe(a, { attributes: true, attributeFilter: ['class'] });
    /* klik langsung memindahkan pill-nya, tidak menunggu gulir selesai */
    a.addEventListener('click', function () {
      var i = links.indexOf(a);
      if (i !== aktif) pindah(i, true);
    });
  });

  function pasang() { pindah(aktif, false); teks.classList.add('active'); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pasang);
  else pasang();
  pasang();

  if (window.ResizeObserver) new ResizeObserver(function () { pindah(aktif, false); }).observe(nav);
  addEventListener('resize', function () { pindah(aktif, false); });

  document.documentElement.classList.add('has-gnav');
  if (kasar) nav.classList.add('gnav--sederhana');
})();
