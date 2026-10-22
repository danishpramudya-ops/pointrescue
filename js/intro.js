/* ==========================================================================
   intro.js — animasi logo pembuka, lalu serahkan halaman ke pengunjung
   ========================================================================== */
(function () {
  'use strict';

  var intro = document.getElementById('intro');
  if (!intro) return;

  var motionOn = function () { return !window.PRMotion || window.PRMotion.on; };
  var done = false;

  function finish() {
    if (done) return;
    done = true;
    intro.classList.add('is-done');
    document.body.classList.remove('is-intro');
    /* bersihkan setelah transisi supaya tidak menghalangi klik */
    setTimeout(function () { intro.remove(); }, 900);
  }

  if (!motionOn()) { finish(); return; }

  requestAnimationFrame(function () { intro.classList.add('go'); });

  var timer = setTimeout(finish, 3400);

  /* boleh dilewati kapan saja */
  ['click', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
    addEventListener(ev, function skip() {
      clearTimeout(timer);
      finish();
      removeEventListener(ev, skip);
    }, { once: true, passive: true });
  });
})();
