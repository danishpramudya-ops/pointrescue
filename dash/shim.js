/* ==========================================================================
   shim.js — menjalankan dashboard asli tanpa server Python.
   Dashboard ini biasanya membaca gps.json / trail.json yang ditulis
   binserial_listener.py (alat sungguhan) atau simulate.py (peragaan).
   Di sini keduanya diganti rekaman nyata dari simulate.py: 80 bingkai,
   4 node (2 SAR + 2 KORBAN), diputar berulang. Endpoint /api/* dilayani
   di memori supaya tombol-tombol dashboard tetap berfungsi.
   Tidak ada baris kode dashboard yang diubah.
   ========================================================================== */
(function () {
  'use strict';

  var FRAME_MS = 700;                       // jeda antar bingkai rekaman
  var t0 = Date.now();
  var replay = null;
  var base = { lat: -7.954, lng: 112.615, ts: Date.now() / 1000, source: 'manual' };
  var chat = [];

  var origFetch = window.fetch.bind(window);

  var ready = origFetch('replay.json')
    .then(function (r) { return r.json(); })
    .then(function (d) { replay = d; })
    .catch(function (e) { console.warn('[shim] rekaman tidak terbaca', e); replay = { frames: [], trail: {} }; });

  function json(obj, status) {
    return new Response(JSON.stringify(obj), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  function currentNodes() {
    var frames = (replay && replay.frames) || [];
    if (!frames.length) return [];
    var i = Math.floor((Date.now() - t0) / FRAME_MS) % frames.length;
    var now = Date.now() / 1000;
    /* last_seen dari rekaman sudah basi — disegarkan supaya node tampak daring */
    return frames[i].map(function (n) {
      var c = {};
      for (var k in n) c[k] = n[k];
      c.last_seen = now;
      return c;
    });
  }

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var path = String(url).split('?')[0];
    var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();

    /* ---- data node & jejak ------------------------------------------------ */
    if (/(^|\/)gps\.json$/.test(path)) {
      return ready.then(function () { return json(currentNodes()); });
    }
    if (/(^|\/)trail\.json$/.test(path)) {
      return ready.then(function () { return json((replay && replay.trail) || {}); });
    }
    if (/(^|\/)base\.json$/.test(path)) {
      return Promise.resolve(json(base));
    }
    if (/(^|\/)chat\.json$/.test(path)) {
      return Promise.resolve(json(chat));
    }

    /* ---- endpoint server -------------------------------------------------- */
    if (/\/api\/serverinfo$/.test(path)) {
      return Promise.resolve(json({}));                 /* tanpa ip → alamat disembunyikan */
    }
    if (/\/api\/trail\/clear$/.test(path)) {
      if (replay) replay.trail = {};
      return Promise.resolve(json({ ok: true }));
    }
    if (/\/api\/base$/.test(path)) {
      if (method === 'POST') {
        try {
          var b = JSON.parse((init && init.body) || '{}');
          if (typeof b.lat === 'number' && typeof b.lng === 'number') {
            base = { lat: b.lat, lng: b.lng, ts: Date.now() / 1000, source: b.source || 'manual' };
          }
        } catch (e) { /* biarkan base lama */ }
      }
      return Promise.resolve(json(base));
    }
    if (/\/api\/chat$/.test(path)) {
      if (method === 'POST') {
        try {
          var m = JSON.parse((init && init.body) || '{}');
          m.ts = m.ts || Date.now() / 1000;
          chat.push(m);
          if (chat.length > 60) chat.shift();
        } catch (e) { /* abaikan pesan cacat */ }
      }
      return Promise.resolve(json(chat));
    }

    return origFetch(input, init);
  };
})();
