// Shared model builder for the POINTRESCUE assembly.
// Everything geometric lives here — parts, positions, explode travel, guide
// rods, camera framing — so both the annotated study (assembly.js) and the
// clean embed (assembly-clean.js) show the exact same object.
import * as THREE from 'three';
import { buildPcb } from './parts/pcb.js';
import { buildEsp32Devkit } from './parts/esp32-devkit.js';
import { buildLoraOnAdapter } from './parts/lora-adapter.js';
import { buildNeoM8n } from './parts/neo-m8n.js';
import { buildTerminalBlock, buildElectrolytic } from './parts/terminal-and-cap.js';
import { buildCell18650, buildBatteryHolder, buildTp4056, CELL_AXIS_Z } from './parts/battery.js';
import { buildAntennaAssembly, buildPatchAntenna, buildIndicatorLeds, buildResetButton } from './parts/topface.js';
import { buildHarness } from './parts/harness.js';
import { loadCasing, CASING_MATERIALS, CASING_CENTRES } from './parts/casing.js';

export const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

export async function buildAssembly(D, { guides = true } = {}) {
  const casing = await loadCasing();

  /* corrections to the printed shell — filled spare Ø12, filled Ø6 side hole,
     and a panel closing the 67 × 15 mm opening past the PCB lid */
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

  const HDR = 2.54;   // header plastic height = module stand-off
  const BT = 1.8;     // board top face, PCB resting on the ledge
  const BAY = -2;     // battery-bay floor, measured off the case mesh
  const BOSS = 17.53; // the case's own TP4056 platform
  const WALL_R = 33.5, FACE = 55;
  const OUT_XP = -Math.PI / 2;

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

    const restZ = s.pos ? s.pos[2] : 0;
    const lift = s.top != null ? Math.max(0, s.top - restZ) : 0;
    const guideXY = s.guide ?? [s.pos[0], s.pos[1]];
    const guideZ = s.pos ? s.pos[2] : (s.id === 'TB' ? 22 : 15.5);

    let line = null;
    if (lift > 0 && guides) {
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
  [...movable].sort((a, b) => a.seq - b.seq).forEach((it, i) => { it.rank = i; });

  const model = new THREE.Group();
  model.name = 'pointrescue_exploded';
  model.add(assembly);
  model.rotation.x = -Math.PI / 2;
  model.scale.setScalar(0.001);

  const STAGGER = 0.055;
  const SPAN = 1 + STAGGER * (movable.length - 1);
  const progressAt = (uu, rank) => easeIO(clamp01(uu * SPAN - rank * STAGGER));

  function setExplode(u) {
    for (const it of movable) {
      const dz = it.lift * progressAt(u, it.rank);
      it.group.position.z = it.restZ + dz;
      if (!it.line) continue;
      const pos = it.line.geometry.attributes.position;
      pos.setZ(1, it.guideZ + dz);
      pos.needsUpdate = true;
      it.line.geometry.computeBoundingBox();
      it.line.geometry.computeBoundingSphere();
      it.line.computeLineDistances();
    }
    dashMat.opacity = clamp01((u - 0.06) * 3) * 0.5;
  }

  function setGhost(on, opacity = 0.26) {
    for (const m of CASING_MATERIALS) {
      m.transparent = on;
      m.opacity = on ? opacity : 1;
      m.depthWrite = !on;
      m.needsUpdate = true;
    }
  }

  return { model, items, movable, setExplode, setGhost, progressAt, THREE };
}

/* ---- camera framing shared by both pages ----
   The assembled unit is 35 mm tall and the exploded stack 271 mm, so a single
   auto-frame leaves one state tiny: fit both, then interpolate. */
export function makeFramer(stage, model, { pad = 1.06, samples = 25 } = {}) {
  const box = new THREE.Box3();
  const corner = new THREE.Vector3();
  const right = new THREE.Vector3(), upv = new THREE.Vector3(), fwd = new THREE.Vector3();
  const WORLD_UP = new THREE.Vector3(0, 1, 0);

  /* A bounding-sphere fit wastes half the frame on a tall thin stack, so the
     eight box corners are projected onto the camera basis and the distance is
     solved per axis instead. */
  const fitFor = (dirArr) => {
    const cam = stage._camera;
    box.setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    fwd.set(...dirArr).normalize();                       // camera → target axis
    right.copy(WORLD_UP).cross(fwd).normalize();
    if (!Number.isFinite(right.x) || right.lengthSq() < 1e-8) right.set(1, 0, 0);
    upv.copy(fwd).cross(right).normalize();

    const vFov = (cam.fov * Math.PI) / 180;
    const tanV = Math.tan(vFov / 2);
    const tanH = tanV * cam.aspect;
    let ex = 0, ey = 0, ez = 0;
    for (let i = 0; i < 8; i++) {
      corner.set(
        i & 1 ? box.max.x : box.min.x,
        i & 2 ? box.max.y : box.min.y,
        i & 4 ? box.max.z : box.min.z,
      ).sub(center);
      ex = Math.max(ex, Math.abs(corner.dot(right)));
      ey = Math.max(ey, Math.abs(corner.dot(upv)));
      ez = Math.max(ez, Math.abs(corner.dot(fwd)));
    }
    const dist = Math.max(ex / tanH, ey / tanV) * pad + ez;
    return { center, dist };
  };
  const camDir = new THREE.Vector3();
  let table = null, keep = null, fitDir = [0.62, 0.5, 1];

  /* The stack is staggered, so it reaches nearly full height well before
     u = 1 — a straight closed→open lerp under-frames the middle. Sample the
     real bounds across the travel instead and interpolate the table. */
  function build(setExplode) {
    keep = setExplode;
    const t = [];
    for (let i = 0; i < samples; i++) {
      const uu = i / (samples - 1);
      setExplode(uu);
      t.push(fitFor(fitDir));
    }
    table = t;
    setExplode(0);
  }

  return {
    // dir sets the direction the fit is solved for (the fit stays put while
    // the user orbits, so dragging never rescales the model)
    measure(setExplode, dir) { if (dir) fitDir = dir; build(setExplode); },
    remeasure() { if (keep) build(keep); },
    at(u) {
      const x = clamp01(u) * (table.length - 1);
      const i = Math.min(table.length - 2, Math.floor(x));
      const f = x - i;
      const a = table[i], b = table[i + 1];
      return {
        center: a.center.clone().lerp(b.center, f),
        dist: a.dist + (b.dist - a.dist) * f,
      };
    },
    apply(u, fallbackDir = [0.62, 0.5, 1]) {
      if (!table) return;
      const cam = stage._camera, ctr = stage._controls;
      const fit = this.at(u);
      camDir.copy(cam.position).sub(ctr.target);
      if (camDir.lengthSq() < 1e-10) camDir.set(...fallbackDir);
      camDir.normalize();
      ctr.target.copy(fit.center);
      cam.position.copy(ctr.target).add(camDir.multiplyScalar(fit.dist));
      ctr.update();
    },
    get closed() { return table && table[0]; },
    get open() { return table && table[table.length - 1]; },
  };
}
