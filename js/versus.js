/* ==========================================================================
   versus.js — bagian 02 (Komparasi)

   Dua tugas, keduanya khusus tabel perbandingan:

   1. PEMICU MASUK. Seksinya tinggi, jadi kelas .in milik seksi (scroll.js)
      datang jauh sebelum tabelnya terlihat. Di sini tiap blok [data-vs]
      mendapat .vs-in sendiri ketika ia benar-benar naik ke layar; CSS
      (bagian "02 KOMPARASI") menjalankan transisinya dari kelas itu. Kelas
      .vs-js di <html> menandai bahwa JS hidup — keadaan awal yang
      tersembunyi hanya berlaku saat itu, jadi tanpa JavaScript tabelnya
      langsung terbaca.

   2. MODEL 3D di kepala kolom: tiga iframe proto/versus.html (Point Rescue,
      Handy Talky, node mesh) yang bisa diseret. Beratnya sama dengan viewer
      bagian 05, jadi diperlakukan sama:
        - dimuat LAMBAT, baru ketika tabelnya mendekat ke layar;
        - TIDAK dimuat di layar sempit (kepala kolom disembunyikan di sana,
          jadi yang tampil hanya poster PNG) dan tidak dimuat saat penghemat
          data menyala;
        - berhenti menggambar begitu keluar layar, dan berhenti berputar
          sendiri saat sakelar animasi (PRMotion) dimatikan;
        - PNG-nya jadi poster sampai modelnya tergambar, lalu memudar.
   ========================================================================== */
(function () {
  'use strict';

  var sec = document.getElementById('komparasi');
  if (!sec) return;
  document.documentElement.classList.add('vs-js');

  var gerak = function () { return !window.PRMotion || window.PRMotion.on; };

  /* ---------- 1. pemicu masuk ------------------------------------------------ */
  var blok = [].slice.call(sec.querySelectorAll('[data-vs]'));
  if ('IntersectionObserver' in window) {
    var masuk = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('vs-in');
        masuk.unobserve(e.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -20% 0px' });
    blok.forEach(function (b) { masuk.observe(b); });
  } else {
    blok.forEach(function (b) { b.classList.add('vs-in'); });
  }

  /* ---------- 2. model 3D ---------------------------------------------------- */
  var kotak = [].slice.call(sec.querySelectorAll('.vs__3d'));
  var tabel = sec.querySelector('.vs');
  if (!kotak.length || !tabel || !('IntersectionObserver' in window)) return;

  var lebar = window.matchMedia ? matchMedia('(min-width:861px)') : { matches: true };
  var hemat = !!(navigator.connection && navigator.connection.saveData);
  var dimuat = false, dekat = false;

  function muat() {
    if (dimuat || hemat || !lebar.matches) return;
    dimuat = true;
    kotak.forEach(function (k) {
      var f = k.querySelector('iframe');
      if (f && !f.getAttribute('src')) f.setAttribute('src', f.getAttribute('data-src'));
    });
  }
  new IntersectionObserver(function (es) {
    dekat = es[0].isIntersecting;
    if (dekat) muat();
  }, { rootMargin: '900px 0px 900px 0px' }).observe(tabel);
  /* jendela dilebarkan dari ukuran ponsel ke desktop */
  var ubah = function () { if (dekat) muat(); };
  if (lebar.addEventListener) lebar.addEventListener('change', ubah);
  else if (lebar.addListener) lebar.addListener(ubah);

  /* kabari iframe: sedang terlihat atau tidak, dan boleh berputar sendiri atau tidak */
  function kabari(k) {
    var f = k.querySelector('iframe');
    try { f.contentWindow.postMessage({ pr: 'versus', lihat: k._lihat !== false, gerak: gerak() }, location.origin); } catch (e) {}
  }
  kotak.forEach(function (k) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { k._lihat = e.isIntersecting; kabari(k); });
    }, { threshold: 0 }).observe(k);
  });
  /* motion.js menyiarkan 'pr:motion' tiap kali sakelar animasi ditekan */
  addEventListener('pr:motion', function () { kotak.forEach(kabari); });

  /* modelnya siap: poster memudar, petunjuk "seret" muncul */
  function siap(nama) {
    var k = kotak.filter(function (x) { return x.getAttribute('data-m') === nama; })[0];
    if (!k || k.classList.contains('is-3d')) return;
    k.classList.add('is-3d');
    tabel.classList.add('has-3d');
    kabari(k);
  }
  addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.pr !== 'versus-siap') return;
    siap(e.data.m);
  });
  /* Pesannya bisa terlewat — iframe lazy kadang selesai sebelum berkas ini memasang
     pendengarnya. Judul dokumen di dalam iframe jadi cadangan, seperti di hero. */
  var n = 0, pantau = setInterval(function () {
    kotak.forEach(function (k) {
      if (k.classList.contains('is-3d')) return;
      var f = k.querySelector('iframe'), jadi = false;
      try { jadi = !!(f && f.contentDocument && f.contentDocument.title === 'siap'); } catch (e) {}
      if (jadi) siap(k.getAttribute('data-m'));
    });
    if (++n > 120) clearInterval(pantau);          // 60 detik, lalu menyerah
  }, 500);
})();
