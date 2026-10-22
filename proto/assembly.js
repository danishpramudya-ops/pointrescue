// PKM / POINTRESCUE tracker — full assembly + exploded view.
// Electronics sit on the footprints measured off the project's gerber; the
// casing is the user's own Fusion 360 export, fitted to the mesh features it
// carries (PCB ledge at z = 5, cover opening at z = 20, top rim at z = 35).
import * as THREE from 'three';
import { setupStudio } from './studio.js';
import { buildPcb } from './parts/pcb.js';
import { buildEsp32Devkit } from './parts/esp32-devkit.js';
import { buildLoraOnAdapter } from './parts/lora-adapter.js';
import { buildNeoM8n } from './parts/neo-m8n.js';
import { buildTerminalBlock, buildElectrolytic } from './parts/terminal-and-cap.js';
import { buildCell18650, buildBatteryHolder, buildTp4056, CELL_AXIS_Z } from './parts/battery.js';
import { buildAntennaAssembly, buildPatchAntenna, buildIndicatorLeds, buildResetButton } from './parts/topface.js';
import { buildHarness } from './parts/harness.js';
import { loadCasing, CASING_MATERIALS, CASING_CENTRES } from './parts/casing.js';

const stage = document.querySelector('three-d-stage');
await stage.ready;
stage.shadowRoot.querySelector('.note')?.remove();
setupStudio(stage, THREE);

const D = JSON.parse(document.getElementById('pcb-data').textContent);
const casing = await loadCasing();

/* ---- corrections to the printed shell, added to the case body so they move
   with it and need no callout of their own ----
   • the right wall is printed with two Ø12 openings but this build fits one
     reset button, so the spare is filled
   • the Ø6 opening in the left wall is unused now the antenna exits the top
     end face, so it is filled too
   • the PCB lid only spans y −51…40; the 67 × 15 mm opening beyond it (on the
     z = 17 ledge) is left open by the print — that is the gap the wires escape
     through, so it gets a panel */
{
  const shell = CASING_MATERIALS[0];
  const add = (geo, name) => {
    const m = new THREE.Mesh(geo, shell);
    m.name = name;
    casing.body.add(m);
  };

  const spare = new THREE.CylinderGeometry(6.05, 6.05, 3.04, 36);
  spare.rotateZ(Math.PI / 2);
  spare.translate(32.0, 14.5, 5);
  add(spare, 'spare_button_hole_fill');

  const sma = new THREE.CylinderGeometry(3.05, 3.05, 3.04, 28);
  sma.rotateZ(Math.PI / 2);
  sma.translate(-32.0, 44.5, 2.5);
  add(sma, 'old_antenna_hole_fill');

  const panel = new THREE.BoxGeometry(67, 15, 3);
  panel.translate(0, 47.5, 18.5);
  add(panel, 'top_end_panel');
}
const HDR = 2.54;                       // header plastic height = module stand-off
const BT = 1.8;                         // board top face, PCB resting on the ledge
const BAY = -2;                         // battery-bay floor, measured off the case mesh
const BOSS = 17.53;                     // the case's own TP4056 platform

// Openings measured off the case mesh (assembly coordinates):
//   right wall  x = +33.5 — Ø12 at y 34.5 (button) and y 14.5 (filled above)
//   top face    y = +55   — Ø5  at x −9 and −19, z 1.5 (indicator LEDs)
// The antenna exits the same top end face, standing clear of the LEDs.
const WALL_R = 33.5, FACE = 55;
const OUT_XP = -Math.PI / 2;            // local +Y → world +X

/* ---------------- parts ----------------
   top   = absolute height (mm) the part reaches when fully exploded. Declaring
           the destination rather than a relative offset keeps the stack ordered
           even though the two bays have different floor heights — the travel
           itself is derived below as top - restZ.
   seq   = disassembly order: 0 leaves first (outer shell), last is the board
   stack = rides the electronics sub-assembly, which is turned 180° so the SMA
           antenna exits the top edge and the USB faces the battery bay, as in
           the built unit */
const specs = [
  { id: 'CASE', node: casing.body, seq: 99, guide: CASING_CENTRES.body,
    anchor: [0, 46, 24], off: [-172, 96],
    name: 'Case utama', spec: '84 × 145 × 35 mm · printed PLA' },

  { id: 'ANT', build: buildAntennaAssembly, pos: [-26, FACE, 11], rot: 0,
    top: 266, seq: -4, anchor: [0, 62, 0], off: [168, -104],
    name: 'Antena LoRa', spec: 'rubber duck Ø10 × 112 mm · SMA di muka atas' },

  { id: 'GPSA', build: buildPatchAntenna, pos: [8, FACE, 13], rot: 0,
    top: 240, seq: -3, anchor: [0, 5, 14], off: [-172, -104],
    name: 'Patch antena GPS', spec: '25 × 25 × 4 mm · eksternal, u.FL ke U3' },

  { id: 'SW', build: buildResetButton, pos: [WALL_R, 34.5, 5], rot: OUT_XP,
    top: 218, seq: -2, anchor: [0, 8, 0], off: [168, -138],
    name: 'Tombol reset', spec: 'tact 6 × 6 mm · cap Ø14 menutup lubang Ø12' },

  { id: 'LED', build: buildIndicatorLeds, pos: [-9, FACE, 1.5], rot: 0,
    top: 200, seq: -1, anchor: [-5, 4, 0], off: [-172, -138],
    name: 'LED indikator', spec: '2 × 5 mm · pas di lubang Ø5 · kuning + hijau' },

  { id: 'WIR', build: buildHarness, pos: [0, -55, 0], rot: 0,
    top: 151, seq: 1.5, anchor: [0, 2, 12.5], off: [168, -172],
    name: 'Wiring harness', spec: '22 AWG merah + hitam · baterai → TP4056 → J1' },

  { id: 'PCB', build: () => buildPcb(D), pos: [0, 0, 0], rot: 0, stack: true,
    top: 24, seq: 10, anchor: [-18, -30, BT], off: [-172, 62],
    name: 'Carrier PCB · FR-4', spec: '59.8 × 80.9 × 1.6 mm' },

  { id: 'J1', build: () => buildTerminalBlock(3), pos: [-21.2, 28.95, BT], rot: Math.PI,
    stack: true, top: 36, seq: 9, anchor: [0, 0, 8.5], off: [-172, 30],
    name: 'Screw terminal', spec: '3-way · 3.5 mm pitch' },

  { id: 'C1', build: () => buildElectrolytic({ r: 3.15, h: 11.5, leadPitch: 2.49 }),
    pos: [-10.9, 35.9, BT], rot: Math.PI / 2, stack: true,
    top: 46, seq: 8, anchor: [0, 0, 11.5], off: [168, -2],
    name: 'Electrolytic cap', spec: 'Ø6.3 × 11.5 mm' },

  { id: 'U3', build: () => buildNeoM8n({ patch: false }), pos: [-15.67, -8.31, BT + HDR], rot: Math.PI,
    stack: true, top: 57, seq: 7, anchor: [0, 0, 7.8], off: [-172, -4],
    name: 'u-blox NEO-M8N', spec: '25 × 35 mm · u.FL ke patch luar' },

  { id: 'U2', build: buildLoraOnAdapter, pos: [13.2, -28.1, BT + HDR], rot: Math.PI,
    stack: true, top: 69, seq: 6, anchor: [0, 0, 6.4], off: [-172, -38],
    name: 'LoRa SX1278 · Ra-02', spec: '2.54 mm adapter · SMA' },

  { id: 'U5', build: buildEsp32Devkit, pos: [13.55, 13.07, BT + HDR], rot: Math.PI,
    stack: true, top: 82, seq: 5, anchor: [0, 0, 5.0], off: [168, 28],
    name: 'ESP32-WROOM-32 devkit', spec: '30 pin · 51.4 × 28.3 mm' },

  { id: 'CHG', build: buildTp4056, pos: [27, -76, BOSS], rot: 0,
    top: 98, seq: 4, anchor: [0, 0, 3], off: [168, 96],
    name: 'TP4056 charger', spec: '26 × 17 mm · micro-USB · on the case boss' },

  { id: 'HLD', build: buildBatteryHolder, pos: [0, -55, BAY], rot: 0,
    top: 118, seq: 3, anchor: [-24, 0, 14], off: [-172, -72],
    name: 'Holder 18650', spec: '76 × 20.5 × 19 mm · spring contact' },

  { id: 'BAT', build: buildCell18650, pos: [0, -55, BAY + CELL_AXIS_Z], rot: 0,
    top: 140, seq: 2, anchor: [20, 0, 9], off: [168, 62],
    name: 'Sel 18650 Li-ion', spec: 'Ø18.4 × 65 mm · 3.7 V' },

  { id: 'TP', node: casing.pcbCover, top: 162, seq: 1, guide: CASING_CENTRES.pcbCover,
    anchor: [0, -5.5, 18], off: [168, -36],
    name: 'Tutup PCB', spec: '67 × 91 × 5 mm · drops on the 20 mm ledge' },

  { id: 'TB', node: casing.batteryCover, top: 184, seq: 0, guide: CASING_CENTRES.batteryCover,
    anchor: [0, -66.5, 30], off: [168, -70],
    name: 'Tutup baterai', spec: '84 × 47 × 16 mm · hollow cap, flush rim' },
];

const assembly = new THREE.Group();
assembly.name = 'pointrescue_assembly';

// The board goes into the case the other way round from the gerber's own
// orientation, so the whole electronics stack rides a 180° turntable.
const electronics = new THREE.Group();
electronics.name = 'electronics_stack';
electronics.rotation.z = Math.PI;
assembly.add(electronics);

const dashMat = new THREE.LineDashedMaterial({
  color: 0xd8d2c2, dashSize: 1.6, gapSize: 1.4, transparent: true, opacity: 0,
});
dashMat.name = 'explode_guide';

const items = specs.map((s) => {
  const host = s.stack ? electronics : assembly;
  const group = s.node ?? s.build();
  group.name = `part_${s.id}`;
  if (s.pos) {
    group.position.set(s.pos[0], s.pos[1], s.pos[2]);
    group.rotation.z = s.rot ?? 0;
  }
  host.add(group);

  const anchor = new THREE.Object3D();
  anchor.name = `anchor_${s.id}`;
  anchor.position.set(s.anchor[0], s.anchor[1], s.anchor[2]);
  group.add(anchor);

  // where the part rests, how far it travels, and where its guide line starts
  const restZ = s.pos ? s.pos[2] : 0;
  const lift = s.top != null ? Math.max(0, s.top - restZ) : 0;
  const guideXY = s.guide ?? [s.pos[0], s.pos[1]];
  const guideZ = s.pos ? s.pos[2] : (s.id === 'TB' ? 22 : 15.5);

  let line = null;
  if (lift > 0) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(guideXY[0], guideXY[1], guideZ),
      new THREE.Vector3(guideXY[0], guideXY[1], guideZ),
    ]);
    line = new THREE.Line(g, dashMat);
    line.name = `guide_${s.id}`;
    line.computeLineDistances();
    host.add(line);
  }
  return { ...s, group, anchor, line, restZ, lift, guideXY, guideZ, host };
});

const movable = items.filter((it) => it.lift > 0);
// stagger by rank, not by the raw seq value, so parts can be inserted at any
// point in the order without renumbering the rest
[...movable].sort((a, b) => a.seq - b.seq).forEach((it, i) => { it.rank = i; });

const model = new THREE.Group();
model.name = 'pointrescue_exploded';
model.add(assembly);
model.rotation.x = -Math.PI / 2;
model.scale.setScalar(0.001);

/* ---------------- explode state ---------------- */
const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const STAGGER = 0.055;
const SPAN = 1 + STAGGER * (movable.length - 1);

let u = 1;                    // 0 = assembled, 1 = fully exploded
let dir = 0;

function progressAt(uu, rank) {
  return easeIO(clamp01(uu * SPAN - rank * STAGGER));
}

function applyExplode() {
  for (const it of movable) {
    const dz = it.lift * progressAt(u, it.rank);
    it.group.position.z = it.restZ + dz;
    const pos = it.line.geometry.attributes.position;
    pos.setZ(1, it.guideZ + dz);
    pos.needsUpdate = true;
    it.line.geometry.computeBoundingBox();
    it.line.geometry.computeBoundingSphere();
    it.line.computeLineDistances();
  }
  dashMat.opacity = clamp01((u - 0.06) * 3) * 0.5;
  if (fitReady) frameCamera();
}

/* ---------------- framing ----------------
   The assembled unit is 35 mm tall and the exploded stack 271 mm, so a single
   auto-frame leaves one of the two states tiny. Fit both, then interpolate the
   target and the camera distance with the explode while keeping whatever
   direction the user has orbited to. */
let fitReady = false;
let fitClosed = null, fitOpen = null;

function fitFor() {
  const cam = stage._camera;
  const sphere = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());
  const vFov = (cam.fov * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * cam.aspect);
  const f = Math.min(vFov, hFov);
  return { center: sphere.center.clone(), dist: (sphere.radius / Math.sin(f / 2)) * 1.06 };
}

const camDir = new THREE.Vector3();
function frameCamera() {
  const cam = stage._camera, ctr = stage._controls;
  const p = easeIO(u);
  camDir.copy(cam.position).sub(ctr.target);
  if (camDir.lengthSq() < 1e-10) camDir.set(0.62, 0.5, 1);
  camDir.normalize();
  ctr.target.copy(fitClosed.center).lerp(fitOpen.center, p);
  cam.position.copy(ctr.target)
    .add(camDir.multiplyScalar(fitClosed.dist + (fitOpen.dist - fitClosed.dist) * p));
  ctr.update();
}

u = 0;
applyExplode();
stage.setObject(model);
fitClosed = fitFor();
u = 1;
applyExplode();
fitOpen = fitFor();
u = 0;
fitReady = true;
applyExplode();

/* ---------------- labels + leader lines ---------------- */
const labelHost = document.getElementById('labels');
const svg = document.getElementById('leaders');
const plateEl = document.querySelector('.plate');
const ctrlEl = document.querySelector('.ctrl');
const SVGNS = 'http://www.w3.org/2000/svg';

for (const it of items) {
  const el = document.createElement('div');
  el.className = `lbl gutter-${it.off[0] < 0 ? 'l' : 'r'}`;
  el.style.textAlign = it.off[0] < 0 ? 'right' : 'left';
  el.innerHTML = `<div class="hd"><em>${it.id}</em><b>${it.name}</b></div><span>${it.spec}</span>`;
  labelHost.appendChild(el);
  it.el = el;

  const path = document.createElementNS(SVGNS, 'polyline');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'rgba(239,236,228,0.42)');
  path.setAttribute('stroke-width', '1');
  svg.appendChild(path);
  const dot = document.createElementNS(SVGNS, 'circle');
  dot.setAttribute('r', '2.2');
  dot.setAttribute('fill', 'rgba(239,236,228,0.8)');
  svg.appendChild(dot);
  it.path = path;
  it.dot = dot;
}

const v = new THREE.Vector3();
let showLabels = true;

// Two gutters. Each has a reserved band that clears the title plate (top left)
// and the control bar / stage toolbar (bottom), and the column is packed evenly
// whenever the callouts need more room than the band has.
function updateLabels() {
  const rect = stage.getBoundingClientRect();
  const cam = stage._camera;
  const vis = showLabels ? clamp01((u - 0.08) * 3.2) : 0;
  const cols = { l: [], r: [] };
  // Reserved bands, measured against the real chrome rather than guessed: the
  // left gutter starts under the title plate and stops above the control bar.
  const plateR = plateEl.getBoundingClientRect();
  const ctrlR = ctrlEl.getBoundingClientRect();
  // the stage's own export toolbar is bottom-right, at about the control bar's
  // height, so both gutters stop above the same line
  const floor = ctrlR.top - rect.top - 14;
  const band = {
    l: [plateR.bottom - rect.top + 18, floor],
    r: [plateR.bottom - rect.top + 18, floor],
  };

  for (const it of items) {
    it.anchor.getWorldPosition(v);
    v.project(cam);
    it._sx = (v.x * 0.5 + 0.5) * rect.width;
    it._sy = (-v.y * 0.5 + 0.5) * rect.height;
    const hw = it.el.offsetWidth / 2;
    const lx = it._sx + it.off[0];
    // each gutter stays in its own half, so the two columns can never collide
    const mid = rect.width / 2;
    if (it.off[0] < 0) {
      const hi = Math.max(hw + 14, mid - hw - 8);
      it._lx = Math.min(Math.max(lx, hw + 14), hi);
    } else {
      const lo = Math.min(rect.width - hw - 14, mid + hw + 8);
      it._lx = Math.max(Math.min(lx, rect.width - hw - 14), lo);
    }
    it._ly = it._sy + it.off[1];
    cols[it.off[0] < 0 ? 'l' : 'r'].push(it);
  }

  for (const key of ['l', 'r']) {
    const list = cols[key].sort((a, b) => a._ly - b._ly);
    if (!list.length) continue;
    const [top, bottom] = band[key];
    const avail = Math.max(40, bottom - top);
    const sumH = list.reduce((n, it) => n + it.el.offsetHeight, 0);
    const GAP = 12;
    const firstH = list[0].el.offsetHeight;
    const lastH = list[list.length - 1].el.offsetHeight;

    // keep the anchor-following positions, then push apart to the minimum gap
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1], b = list[i];
      const need = (a.el.offsetHeight + b.el.offsetHeight) / 2 + GAP;
      if (b._ly - a._ly < need) b._ly = a._ly + need;
    }
    const span = (list[list.length - 1]._ly + lastH / 2) - (list[0]._ly - firstH / 2);

    if (span > avail) {
      // the laid-out column is taller than the band: pack it evenly instead of
      // fighting the two clamps (which would leave the last callout hanging)
      const gap = list.length > 1 ? Math.max(2, (avail - sumH) / (list.length - 1)) : 0;
      let y = top;
      for (const it of list) {
        it._ly = y + it.el.offsetHeight / 2;
        y += it.el.offsetHeight + gap;
      }
    } else {
      const over = list[list.length - 1]._ly + lastH / 2 - bottom;
      if (over > 0) for (const it of list) it._ly -= over;
      const under = top + firstH / 2 - list[0]._ly;
      if (under > 0) for (const it of list) it._ly += under;
    }
  }

  for (const it of items) {
    const o = it.id === 'CASE' ? Math.max(vis, showLabels ? 0.92 : 0) : vis;
    it.el.style.transform = `translate(${it._lx}px, ${it._ly}px) translate(-50%, -50%)`;
    it.el.style.opacity = o;

    const side = it.off[0] < 0 ? 1 : -1;
    const edge = it._lx + side * (it.el.offsetWidth / 2 + 9);
    const elbow = edge + side * 18;
    it.path.setAttribute('points', `${it._sx},${it._sy} ${elbow},${it._ly} ${edge},${it._ly}`);
    it.path.style.opacity = o;
    it.dot.setAttribute('cx', it._sx);
    it.dot.setAttribute('cy', it._sy);
    it.dot.style.opacity = o;
  }
}

/* ---------------- controls ---------------- */
const playBtn = document.getElementById('play');
const slider = document.getElementById('slide');
const pct = document.getElementById('pct');
const spinBtn = document.getElementById('spin');
const labelBtn = document.getElementById('labelsBtn');
const ghostBtn = document.getElementById('ghost');
const glbBtn = document.getElementById('glb');

let ghost = false;
function setGhost(on) {
  ghost = on;
  for (const m of CASING_MATERIALS) {
    m.transparent = on;
    m.opacity = on ? 0.26 : 1;
    m.depthWrite = !on;
    m.needsUpdate = true;
  }
  ghostBtn.dataset.on = on ? '1' : '';
}

function sync() {
  slider.value = Math.round(u * 1000);
  pct.textContent = Math.round(u * 100) + '%';
  playBtn.textContent = dir > 0 ? 'Pause' : u > 0.999 ? 'Collapse' : 'Explode';
}

playBtn.addEventListener('click', () => {
  if (dir > 0) dir = 0;
  else if (u > 0.999) dir = -1;
  else dir = 1;
  sync();
});
slider.addEventListener('input', () => {
  dir = 0;
  u = slider.value / 1000;
  applyExplode();
  sync();
});
spinBtn.addEventListener('click', () => {
  const on = !stage._controls.autoRotate;
  stage._controls.autoRotate = on;
  spinBtn.dataset.on = on ? '1' : '';
});
labelBtn.addEventListener('click', () => {
  showLabels = !showLabels;
  labelBtn.dataset.on = showLabels ? '1' : '';
});
ghostBtn.addEventListener('click', () => setGhost(!ghost));
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); playBtn.click(); }
});

/* ---------------- baked animation export (for Blender) ----------------
   The explode is sampled at 24 fps into real keyframe tracks — one position
   track per part, one scale track per guide rod — so the GLB plays on its own.
   Blender: File ▸ Import ▸ glTF 2.0, then Save As .blend. */
const FPS = 24, HOLD_IN = 0.4, RAMP = 3.2, HOLD_MID = 0.9, HOLD_OUT = 0.4;
const CLIP_LEN = HOLD_IN + RAMP + HOLD_MID + RAMP + HOLD_OUT;

function uAtTime(t) {
  if (t <= HOLD_IN) return 0;
  if (t <= HOLD_IN + RAMP) return (t - HOLD_IN) / RAMP;
  if (t <= HOLD_IN + RAMP + HOLD_MID) return 1;
  if (t <= HOLD_IN + RAMP + HOLD_MID + RAMP) return 1 - (t - HOLD_IN - RAMP - HOLD_MID) / RAMP;
  return 0;
}

async function exportAnimatedGlb() {
  const restore = glbBtn.textContent;
  glbBtn.disabled = true;
  glbBtn.textContent = 'Baking…';
  try {
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');

    const keepU = u, keepGhost = ghost;
    dir = 0;
    u = 0;
    if (keepGhost) setGhost(false);
    applyExplode();

    items.forEach((it) => {
      it.anchor.visible = false;                 // label empties: not needed downstream
      if (it.line) it.line.visible = false;      // dashed lines: glTF has no dash support
    });

    // solid guide rods stand in for the dashed lines, scaled along Z
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
      const [gx, gy] = it.guideXY;
      for (const t of times) {
        const dz = it.lift * progressAt(uAtTime(t), it.rank);
        pos.push(it.pos ? it.pos[0] : 0, it.pos ? it.pos[1] : 0, it.restZ + dz);
        scl.push(1, 1, Math.max(0.0001, dz));
      }
      tracks.push(new THREE.VectorKeyframeTrack(`part_${it.id}.position`, times, pos));
      tracks.push(new THREE.VectorKeyframeTrack(`guide_${it.id}.scale`, times, scl));
      void gx; void gy;
    }
    const clip = new THREE.AnimationClip('explode_collapse', CLIP_LEN, tracks);

    const buf = await new Promise((res, rej) => {
      new GLTFExporter().parse(model, res, rej,
        { binary: true, animations: [clip], onlyVisible: true });
    });

    rods.forEach((m) => { m.parent.remove(m); m.geometry.dispose(); });
    items.forEach((it) => {
      it.anchor.visible = true;
      if (it.line) it.line.visible = true;
    });
    if (keepGhost) setGhost(true);
    u = keepU;
    applyExplode();

    const url = URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pointrescue-explode.glb';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    glbBtn.textContent = `${Math.round(CLIP_LEN * FPS)} frames ✓`;
    setTimeout(() => { glbBtn.textContent = restore; }, 2600);
  } catch (err) {
    console.error(err);
    glbBtn.textContent = 'Export failed';
    setTimeout(() => { glbBtn.textContent = restore; }, 2600);
  } finally {
    glbBtn.disabled = false;
  }
}

glbBtn.addEventListener('click', exportAnimatedGlb);

let last = performance.now();
(function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (dir !== 0) {
    u = clamp01(u + (dir * dt) / 3.2);
    applyExplode();
    if (u <= 0 || u >= 1) dir = 0;
    sync();
  }
  updateLabels();
  requestAnimationFrame(tick);
})(last);

sync();
labelBtn.dataset.on = '1';
