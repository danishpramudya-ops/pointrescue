/* ==========================================================================
   motion.js — satu sakelar untuk seluruh animasi situs

   Sebelumnya tiap modul membaca prefers-reduced-motion sendiri-sendiri dan
   langsung mematikan diri. Akibatnya, di komputer yang setelan "animation
   effects" Windows-nya mati, radar membeku dan kursor jejak tidak muncul sama
   sekali — tanpa cara memulihkannya dari dalam halaman.

   Sekarang: setelan sistem tetap jadi nilai awal (menghormati pengguna yang
   memang butuh), tapi ada tombol di nav untuk menyalakan/mematikan, dan
   pilihannya diingat di localStorage.

   Modul lain cukup memanggil PRMotion.on dan mendengarkan 'pr:motion'.
   ========================================================================== */
(function () {
  'use strict';

  /* label sakelar ikut bahasa halaman; lihat js/i18n.js */
  var TX = window.PRText || function (k) { return k; };
  var KEY = 'pr-motion';
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* mode privat */ }

  var systemPrefersLess = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var on = saved === null ? !systemPrefersLess : saved === 'on';

  function apply(next, remember) {
    on = next;
    root.dataset.motion = on ? 'on' : 'off';
    if (remember) { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {} }
    if (btn) {
      btn.setAttribute('aria-pressed', String(on));
      btn.title = TX(on ? 'Animasi menyala — klik untuk mematikan' : 'Animasi mati — klik untuk menyalakan');
      btn.querySelector('.mtoggle__txt').textContent = TX(on ? 'Animasi' : 'Statis');
    }
    dispatchEvent(new CustomEvent('pr:motion', { detail: { on: on } }));
  }

  var btn = null;
  window.PRMotion = {
    get on() { return on; },
    set: function (v) { apply(!!v, true); },
    toggle: function () { apply(!on, true); }
  };

  /* tetapkan sedini mungkin supaya CSS tidak sempat salah render */
  root.dataset.motion = on ? 'on' : 'off';

  function mount() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mtoggle';
    btn.setAttribute('aria-pressed', String(on));
    btn.innerHTML =
      '<span class="mtoggle__dot" aria-hidden="true"></span>' +
      '<span class="mtoggle__txt">' + TX('Animasi') + '</span>';
    btn.addEventListener('click', function () { window.PRMotion.toggle(); });
    var cta = nav.querySelector('.nav__cta');
    nav.insertBefore(btn, cta || null);
    apply(on, false);
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mount);
  else mount();
})();
