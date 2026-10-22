// Website build: the assembly viewer plus every control from the study page,
// wired to a part list, a BOM and the download row.
import * as THREE from 'three';
import { setupStudio } from './studio.js';
import { buildAssembly, makeFramer, clamp01, easeIO } from './assembly-model.js';

const stage = document.querySelector('three-d-stage');
const viewport = document.getElementById('viewport');
const labelHost = document.getElementById('labels');
const leaders = document.getElementById('leaders');
const SVGNS = 'http://www.w3.org/2000/svg';

await stage.ready;
stage.shadowRoot.querySelector('.note')?.remove();
stage.shadowRoot.querySelector('.toolbar')?.remove();
setupStudio(stage, THREE);

const D = JSON.parse(document.getElementById('pcb-data').textContent);
const { model, items, movable, setExplode, setGhost, progressAt } = await buildAssembly(D);

stage.setObject(model);
const framer = makeFramer(stage, model, { pad: 1.04 });
framer.measure(setExplode, [0.62, 0.5, 1]);

let u = 0, dir = 0;
function apply() {
  setExplode(u);
  framer.apply(u);
}
apply();

/* ---------- labels ---------- */
for (const it of items) {
  const el = document.createElement('div');
  el.className = `lbl gutter-${it.off[0] < 0 ? 'l' : 'r'}`;
  el.innerHTML = `<div class="hd"><em>${it.id}</em><b>${it.name}</b></div><span>${it.spec}</span>`;
  labelHost.appendChild(el);
  it.el = el;

  const path = document.createElementNS(SVGNS, 'polyline');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'rgba(239,236,228,0.38)');
  path.setAttribute('stroke-width', '1');
  leaders.appendChild(path);
  const dot = document.createElementNS(SVGNS, 'circle');
  dot.setAttribute('r', '2.2');
  dot.setAttribute('fill', 'rgba(239,236,228,0.78)');
  leaders.appendChild(dot);
  it.path = path;
  it.dot = dot;
}

const v = new THREE.Vector3();
let showLabels = true;

// Two gutters inside the viewport, each packed so callouts never overlap.
function updateLabels() {
  const rect = viewport.getBoundingClientRect();
  const cam = stage._camera;
  const vis = showLabels ? clamp01((u - 0.08) * 3.2) : 0;
  const cols = { l: [], r: [] };
  const band = { l: [96, rect.height - 132], r: [96, rect.height - 132] };
  const mid = rect.width / 2;

  for (const it of items) {
    it.anchor.getWorldPosition(v);
    v.project(cam);
    it._sx = (v.x * 0.5 + 0.5) * rect.width;
    it._sy = (-v.y * 0.5 + 0.5) * rect.height;
    const hw = it.el.offsetWidth / 2;
    const lx = it._sx + it.off[0] * 0.72;
    if (it.off[0] < 0) {
      it._lx = Math.min(Math.max(lx, hw + 12), Math.max(hw + 12, mid - hw - 6));
    } else {
      it._lx = Math.max(Math.min(lx, rect.width - hw - 12), Math.min(rect.width - hw - 12, mid + hw + 6));
    }
    it._ly = it._sy + it.off[1] * 0.72;
    cols[it.off[0] < 0 ? 'l' : 'r'].push(it);
  }

  for (const key of ['l', 'r']) {
    const list = cols[key].sort((a, b) => a._ly - b._ly);
    if (!list.length) continue;
    const [top, bottom] = band[key];
    const avail = Math.max(40, bottom - top);
    const sumH = list.reduce((n, it) => n + it.el.offsetHeight, 0);
    const GAP = 10;
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1], b = list[i];
      const need = (a.el.offsetHeight + b.el.offsetHeight) / 2 + GAP;
      if (b._ly - a._ly < need) b._ly = a._ly + need;
    }
    const firstH = list[0].el.offsetHeight, lastH = list[list.length - 1].el.offsetHeight;
    const span = (list[list.length - 1]._ly + lastH / 2) - (list[0]._ly - firstH / 2);
    if (span > avail) {
      const gap = list.length > 1 ? Math.max(1, (avail - sumH) / (list.length - 1)) : 0;
      let y = top;
      for (const it of list) { it._ly = y + it.el.offsetHeight / 2; y += it.el.offsetHeight + gap; }
    } else {
      const over = list[list.length - 1]._ly + lastH / 2 - bottom;
      if (over > 0) for (const it of list) it._ly -= over;
      const under = top + firstH / 2 - list[0]._ly;
      if (under > 0) for (const it of list) it._ly += under;
    }
  }

  for (const it of items) {
    const focused = focus === it.id;
    let o = it.id === 'CASE' ? Math.max(vis, showLabels ? 0.9 : 0) : vis;
    if (focus) o = focused ? 1 : o * 0.12;
    it.el.style.transform = `translate(${it._lx}px, ${it._ly}px) translate(-50%, -50%)`;
    it.el.style.opacity = o;
    it.el.dataset.focus = focused ? '1' : '';
    const side = it.off[0] < 0 ? 1 : -1;
    const edge = it._lx + side * (it.el.offsetWidth / 2 + 8);
    const elbow = edge + side * 16;
    it.path.setAttribute('points', `${it._sx},${it._sy} ${elbow},${it._ly} ${edge},${it._ly}`);
    it.path.style.opacity = o;
    it.dot.setAttribute('cx', it._sx);
    it.dot.setAttribute('cy', it._sy);
    it.dot.style.opacity = o;
  }
}

/* ---------- part list: hover highlights, click isolates ---------- */
const listEl = document.getElementById('partlist');
const bomEl = document.getElementById('bomBody');
let focus = null;

const hiCache = new Map();
function highlight(id, on) {
  const it = items.find((x) => x.id === id);
  if (!it) return;
  if (!hiCache.has(id)) {
    const pairs = [];
    it.group.traverse((o) => {
      if (!o.isMesh) return;
      const orig = o.material;
      const clone = Array.isArray(orig) ? orig.map((m) => m.clone()) : orig.clone();
      const boost = (m) => { if (m.emissive) { m.emissive.setHex(0x6a5f3a); m.emissiveIntensity = 1; } };
      Array.isArray(clone) ? clone.forEach(boost) : boost(clone);
      pairs.push([o, orig, clone]);
    });
    hiCache.set(id, pairs);
  }
  for (const [mesh, orig, clone] of hiCache.get(id)) mesh.material = on ? clone : orig;
}

function setFocus(id) {
  focus = focus === id ? null : id;
  for (const it of items) {
    const on = !focus || it.id === focus || it.id === 'CASE';
    it.group.visible = !focus || it.id === focus;
    if (it.line) it.line.visible = on && !focus;
  }
  for (const row of listEl.children) row.dataset.on = row.dataset.id === focus ? '1' : '';
  isoNote.hidden = !focus;
  isoNote.textContent = focus ? `Isolasi: ${items.find((x) => x.id === focus).name}` : '';
}

const isoNote = document.getElementById('iso');
const order = [...items].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
for (const it of order) {
  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'row';
  row.dataset.id = it.id;
  row.innerHTML = `<em>${it.id}</em><span><b>${it.name}</b>${it.spec}</span>`;
  row.addEventListener('pointerenter', () => highlight(it.id, true));
  row.addEventListener('pointerleave', () => highlight(it.id, false));
  row.addEventListener('click', () => setFocus(it.id));
  listEl.appendChild(row);

  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${it.id}</td><td>${it.name}</td><td>${it.spec}</td>`;
  bomEl.appendChild(tr);
}

/* ---------- controls ---------- */
const playBtn = document.getElementById('play');
const slider = document.getElementById('slide');
const pct = document.getElementById('pct');
const ghostBtn = document.getElementById('ghost');
const labelBtn = document.getElementById('labelsBtn');
const spinBtn = document.getElementById('spin');

let ghost = false;
const sync = () => {
  slider.value = Math.round(u * 1000);
  pct.textContent = Math.round(u * 100) + '%';
  playBtn.textContent = dir > 0 ? 'Pause' : u > 0.999 ? 'Collapse' : 'Explode';
};

playBtn.addEventListener('click', () => {
  dir = dir > 0 ? 0 : u > 0.999 ? -1 : 1;
  sync();
});
slider.addEventListener('input', () => { dir = 0; u = slider.value / 1000; apply(); sync(); });
ghostBtn.addEventListener('click', () => {
  ghost = !ghost;
  setGhost(ghost);
  ghostBtn.dataset.on = ghost ? '1' : '';
});
labelBtn.addEventListener('click', () => {
  showLabels = !showLabels;
  labelBtn.dataset.on = showLabels ? '1' : '';
});
spinBtn.addEventListener('click', () => {
  const on = !stage._controls.autoRotate;
  stage._controls.autoRotate = on;
  spinBtn.dataset.on = on ? '1' : '';
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); playBtn.click(); }
});

const VIEWS = { iso: [0.62, 0.5, 1], front: [0, 0.12, 1], side: [1, 0.12, 0.02], top: [0.01, 1, 0.02] };
for (const btn of document.querySelectorAll('[data-view]')) {
  btn.addEventListener('click', () => {
    const d = VIEWS[btn.dataset.view];
    const ctr = stage._controls;
    stage._camera.position.copy(ctr.target)
      .add(new THREE.Vector3(...d).normalize().multiplyScalar(framer.at(u).dist));
    ctr.update();
    for (const b of document.querySelectorAll('[data-view]')) b.dataset.on = b === btn ? '1' : '';
  });
}

addEventListener('resize', () => { framer.remeasure(); apply(); });

/* ---------- downloads ---------- */
const FPS = 24, HOLD_IN = 0.4, RAMP = 3.2, HOLD_MID = 0.9, HOLD_OUT = 0.4;
const CLIP_LEN = HOLD_IN + RAMP + HOLD_MID + RAMP + HOLD_OUT;
const uAtTime = (t) => {
  if (t <= HOLD_IN) return 0;
  if (t <= HOLD_IN + RAMP) return (t - HOLD_IN) / RAMP;
  if (t <= HOLD_IN + RAMP + HOLD_MID) return 1;
  if (t <= HOLD_IN + RAMP + HOLD_MID + RAMP) return 1 - (t - HOLD_IN - RAMP - HOLD_MID) / RAMP;
  return 0;
};

document.getElementById('dlObj').addEventListener('click', () => stage._runExport('obj'));
document.getElementById('dlGlb').addEventListener('click', () => stage._runExport('glb'));

const animBtn = document.getElementById('dlAnim');
animBtn.addEventListener('click', async () => {
  const restore = animBtn.textContent;
  animBtn.disabled = true;
  animBtn.textContent = 'Baking…';
  try {
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const keepU = u, keepGhost = ghost, keepFocus = focus;
    if (keepFocus) setFocus(keepFocus);
    dir = 0; u = 0;
    if (keepGhost) { setGhost(false); }
    apply();
    items.forEach((it) => { it.anchor.visible = false; if (it.line) it.line.visible = false; });

    const rodMat = new THREE.MeshStandardMaterial({ color: 0x8d8878, roughness: 0.62, metalness: 0.08 });
    rodMat.name = 'explode_guide_rod';
    const rods = movable.map((it) => {
      const g = new THREE.CylinderGeometry(0.22, 0.22, 1, 10, 1, true);
      g.rotateX(Math.PI / 2);
      g.translate(0, 0, 0.5);
      const m = new THREE.Mesh(g, rodMat);
      m.name = `guide_${it.id}`;
      m.position.set(it.guideXY[0], it.guideXY[1], it.guideZ);
      m.scale.z = 0.0001;
      it.host.add(m);
      return m;
    });

    const times = [];
    for (let i = 0, n = Math.round(CLIP_LEN * FPS); i <= n; i++) times.push(i / FPS);
    const tracks = [];
    for (const it of movable) {
      const pos = [], scl = [];
      for (const t of times) {
        const dz = it.lift * progressAt(uAtTime(t), it.rank);
        pos.push(it.pos ? it.pos[0] : 0, it.pos ? it.pos[1] : 0, it.restZ + dz);
        scl.push(1, 1, Math.max(0.0001, dz));
      }
      tracks.push(new THREE.VectorKeyframeTrack(`part_${it.id}.position`, times, pos));
      tracks.push(new THREE.VectorKeyframeTrack(`guide_${it.id}.scale`, times, scl));
    }
    const clip = new THREE.AnimationClip('explode_collapse', CLIP_LEN, tracks);
    const buf = await new Promise((res, rej) => {
      new GLTFExporter().parse(model, res, rej, { binary: true, animations: [clip], onlyVisible: true });
    });

    rods.forEach((m) => { m.parent.remove(m); m.geometry.dispose(); });
    items.forEach((it) => { it.anchor.visible = true; if (it.line) it.line.visible = true; });
    if (keepGhost) setGhost(true);
    u = keepU; apply(); sync();

    const url = URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pointrescue-explode.glb';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    animBtn.textContent = `${Math.round(CLIP_LEN * FPS)} frame ✓`;
    setTimeout(() => { animBtn.textContent = restore; }, 2400);
  } catch (err) {
    console.error(err);
    animBtn.textContent = 'Gagal export';
    setTimeout(() => { animBtn.textContent = restore; }, 2400);
  } finally {
    animBtn.disabled = false;
  }
});

/* ---------- loop ---------- */
let last = performance.now();
(function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (dir !== 0) {
    u = clamp01(u + (dir * dt) / 3.2);
    apply();
    if (u <= 0 || u >= 1) dir = 0;
    sync();
  }
  updateLabels();
  requestAnimationFrame(tick);
})(last);

// callouts need gutters: on a narrow viewport they cover the model, so they
// start off and the user can still switch them on
showLabels = viewport.clientWidth >= 820;

sync();
labelBtn.dataset.on = showLabels ? '1' : '';
document.querySelector('[data-view="iso"]').dataset.on = '1';
void easeIO;
