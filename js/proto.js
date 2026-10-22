/* ==========================================================================
   proto.js — bagian anatomi
   Memakai mesin 3D milik tim (three-d-stage + assembly-model). Saat digulir,
   kamera dan nilai explode dikendalikan penuh; setelah cerita selesai kendali
   diserahkan ke pengunjung (orbit / zoom).
   ========================================================================== */

import { buildAssembly, makeFramer } from '../proto/assembly-model.js';

const STEPS = [
  { ids: ['CASE'],            label: 'Casing' },
  { ids: ['TP', 'TB'],        label: 'Tutup' },
  { ids: ['U5'],              label: 'ESP32' },
  { ids: ['U2'],              label: 'LoRa' },
  { ids: ['U3'],              label: 'GPS' },
  { ids: ['PCB', 'J1', 'C1'], label: 'Carrier PCB' },
  { ids: ['CHG', 'HLD', 'BAT'], label: 'Daya' },
  { ids: ['ANT', 'GPSA'],     label: 'Antena' },
  { ids: ['SW', 'LED', 'WIR'], label: 'Kendali' }
];

const sec     = document.getElementById('anatomi');
const stage   = document.getElementById('stage3d');
const partEls = [...document.querySelectorAll('#parts .part')];
const badge   = document.getElementById('partBadge');
const badgeT  = badge?.querySelector('span');
const barEl   = document.getElementById('explodeBar');
const freeBtn = document.getElementById('freeBtn');
const hint    = document.getElementById('anatomyHint');

const motionOn = () => !window.PRMotion || window.PRMotion.on;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

let framer = null, setExplode = null, items = [], free = false, step = -1;

boot().catch((err) => {
  console.error('[proto] gagal memuat model 3D', err);
  if (hint) hint.textContent = 'Model 3D gagal dimuat';
});

async function boot() {
  const { THREE } = await stage.ready;

  /* toolbar & catatan bawaan komponen tidak dipakai di halaman ini */
  stage.shadowRoot.querySelector('.toolbar')?.remove();
  stage.shadowRoot.querySelector('.note')?.remove();

  const D = await fetch('proto/pcb-data.json').then((r) => r.json());
  const built = await buildAssembly(D);
  items = built.items;
  setExplode = built.setExplode;

  stage.setObject(built.model);
  framer = makeFramer(stage, built.model, { pad: 1.06 });
  framer.measure(setExplode, [0.62, 0.5, 1]);

  /* studio dibuat untuk latar terang; di sini latarnya gelap */
  tuneLights(THREE);

  /* kendali baru dibuka setelah pengunjung menekan tombol */
  stage._controls.enabled = false;
  stage._controls.enableDamping = true;

  buildDimCache(THREE);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { framer.remeasure(); onScroll(); }, { passive: true });

  freeBtn?.addEventListener('click', toggleFree);
}

/* ---------- cahaya untuk latar gelap -------------------------------------- */
function tuneLights(THREE) {
  const scene = stage._scene;
  scene.traverse((o) => {
    if (o.isHemisphereLight) { o.intensity = 0.55; o.groundColor.setHex(0x0a1f3a); }
    else if (o.isDirectionalLight) o.intensity = Math.min(o.intensity, 2.0);
  });
  const rim = new THREE.DirectionalLight(0x6fb0ff, 1.5);
  rim.position.set(-5, 2, -4);
  scene.add(rim);
}

/* ---------- redupkan part yang tidak sedang dibahas ------------------------ */
const dimCache = new Map();
function buildDimCache(THREE) {
  for (const it of items) {
    const pairs = [];
    it.group.traverse((o) => {
      if (!o.isMesh) return;
      const orig = o.material;
      /* Diredupkan ke biru-abu, BUKAN ke hitam: latar halaman sudah gelap,
         jadi part yang digelapkan akan hilang sama sekali dari siluetnya. */
      const one = (m) => {
        const c = m.clone();
        if (c.color) c.color.lerp(new THREE.Color(0x37536f), 0.62);
        if (c.emissive) c.emissive.setHex(0x000000);
        if (c.metalness !== undefined) c.metalness = Math.min(c.metalness, 0.25);
        if (c.roughness !== undefined) c.roughness = Math.max(c.roughness, 0.65);
        return c;
      };
      pairs.push([o, orig, Array.isArray(orig) ? orig.map(one) : one(orig)]);
    });
    dimCache.set(it.id, pairs);
  }
}
function applyFocus(ids) {
  for (const it of items) {
    const on = !ids || ids.includes(it.id);
    for (const [mesh, orig, dim] of dimCache.get(it.id)) mesh.material = on ? orig : dim;
    if (it.line) it.line.visible = false;
    if (it.anchor) it.anchor.visible = false;
  }
}

/* ---------- gulir --------------------------------------------------------- */
function onScroll() {
  if (!framer || free) return;
  const r = sec.getBoundingClientRect();
  const span = r.height - innerHeight;
  const p = span > 0 ? clamp01(-r.top / span) : 0;

  const u = p;
  setExplode(u);
  framer.apply(u);

  if (barEl) barEl.style.width = (p * 100).toFixed(1) + '%';

  const i = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length));
  if (i !== step) {
    step = i;
    partEls.forEach((el, k) => el.classList.toggle('is-active', k === i));
    applyFocus(STEPS[i].ids);
    if (badgeT) { badgeT.textContent = STEPS[i].label; badge.classList.add('is-on'); }
  }
}

/* ---------- serahkan kendali ---------------------------------------------- */
function toggleFree() {
  free = !free;
  stage._controls.enabled = free;
  sec.classList.toggle('is-free', free);
  freeBtn.textContent = free ? 'Kembali ke cerita' : 'Ambil kendali';
  if (free) {
    applyFocus(null);                    // semua part kembali berwarna penuh
    badge.classList.remove('is-on');
  } else {
    step = -1;
    onScroll();
  }
}
