// LoRa SX1278 module (Ai-Thinker Ra-02 style) — 17.0 x 16.0 mm PCB,
// shielded can, SMA female edge jack, 8 + 8 pins on 2.54 mm pitch.
// Millimetres, board plane = XY, +Z up, z = 0 = module PCB underside
// (same datum convention as parts/esp32-devkit.js).
import * as THREE from 'three';

const MAT = {
  pcb: new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.46, metalness: 0.06 }),
  shield: new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.42, metalness: 0.78 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xc9a24c, roughness: 0.3, metalness: 0.85 }),
  solder: new THREE.MeshStandardMaterial({ color: 0xb9bcb8, roughness: 0.28, metalness: 0.8 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xd8c48a, roughness: 0.26, metalness: 0.9 }),
  ptfe: new THREE.MeshStandardMaterial({ color: 0xf2f1ec, roughness: 0.5, metalness: 0.02 }),
  plastic: new THREE.MeshStandardMaterial({ color: 0x191a1d, roughness: 0.58, metalness: 0.03 }),
};
MAT.pcb.name = 'module_pcb_black';
MAT.shield.name = 'steel_shield';
MAT.gold.name = 'gold_plating';
MAT.solder.name = 'solder_joint';
MAT.brass.name = 'sma_brass';
MAT.ptfe.name = 'sma_dielectric';
MAT.plastic.name = 'black_plastic';

const BW = 17.0, BL = 16.0, BT = 1.0;    // module pcb
const PITCH = 2.0, NPIN = 8;             // Ra-02 uses a 2.0 mm pad pitch
const ROW = 15.6;                        // row spacing (pad rows sit on the two edges)
const PAD_OD = 1.3, DRILL = 0.45;
const PIN = 0.5, HDR_H = 2.5, PIN_DOWN = 6.0, PIN_UP = 0.8;

function rectShape(cx, cy, w, h) {
  const s = new THREE.Shape();
  s.moveTo(cx - w / 2, cy - h / 2);
  s.lineTo(cx + w / 2, cy - h / 2);
  s.lineTo(cx + w / 2, cy + h / 2);
  s.lineTo(cx - w / 2, cy + h / 2);
  s.closePath();
  return s;
}

function roundRectShape(cx, cy, w, h, r) {
  const s = new THREE.Shape();
  const x = cx - w / 2, y = cy - h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  s.closePath();
  return s;
}

function circlePath(x, y, r) {
  const p = new THREE.Path();
  p.absarc(x, y, r, 0, Math.PI * 2, true);
  return p;
}

function extrude(name, mat, shapes, z, depth, seg = 18) {
  const g = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: false, curveSegments: seg });
  g.translate(0, 0, z);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  return m;
}

function box(name, mat, w, d, h, x, y, z) {
  const g = new THREE.BoxGeometry(w, d, h);
  g.translate(x, y, z + h / 2);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  return m;
}

// cylinder with its axis along +Y (SMA jack points off the board edge)
function cylY(name, mat, r, len, x, y0, z, seg = 32) {
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, false);
  g.translate(0, len / 2, 0);
  g.translate(x, y0, 0);
  const m = new THREE.Mesh(g, mat);
  m.position.z = z;
  m.name = name;
  return m;
}

function tubeY(name, mat, rOuter, rInner, len, x, y0, z, seg = 36) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
  s.holes.push(circlePath(0, 0, rInner));
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: seg });
  g.rotateX(-Math.PI / 2);          // extrude along +Y
  g.translate(x, y0, z);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  return m;
}

export function buildLoraSx1278(opts = {}) {
  const withHeaders = opts.headers !== false;
  const part = new THREE.Group();
  part.name = 'lora_sx1278_ra02';

  /* ---- pin grid: 8 per long edge, 2.54 mm pitch ---- */
  const pins = [];
  for (let i = 0; i < NPIN; i++) {
    const y = -((NPIN - 1) / 2) * PITCH + i * PITCH;
    pins.push([-ROW / 2, y], [ROW / 2, y]);
  }

  /* ---- module pcb, drilled ---- */
  const boardShape = roundRectShape(0, 0, BW, BL, 0.6);
  for (const [x, y] of pins) boardShape.holes.push(circlePath(x, y, DRILL));
  part.add(extrude('module_pcb', MAT.pcb, boardShape, 0, BT));

  /* ---- gold annular rings, both faces ---- */
  const rings = pins.map(([x, y]) => {
    const s = new THREE.Shape();
    s.absarc(x, y, PAD_OD / 2, 0, Math.PI * 2, false);
    s.holes.push(circlePath(x, y, DRILL));
    return s;
  });
  part.add(extrude('pad_rings_top', MAT.gold, rings, BT - 0.01, 0.05));
  part.add(extrude('pad_rings_bottom', MAT.gold, rings, -0.04, 0.05));

  /* ---- pins: full male headers standalone, short stubs when the module is
         soldered onto a breakout adapter ---- */
  for (const side of [-1, 1]) {
    const nm = side < 0 ? 'left' : 'right';
    const sq = pins.filter(([x]) => Math.sign(x) === side)
      .map(([x, y]) => rectShape(x, y, PIN, PIN));
    if (withHeaders) {
      part.add(box(`header_${nm}_body`, MAT.plastic, 2.0, NPIN * PITCH - 0.4, HDR_H,
        (side * ROW) / 2, 0, -HDR_H));
      part.add(extrude(`header_${nm}_pins`, MAT.gold, sq,
        -HDR_H - PIN_DOWN, HDR_H + PIN_DOWN + BT + PIN_UP, 4));
    } else {
      part.add(extrude(`header_${nm}_pins`, MAT.gold, sq, -1.75, 1.75 + BT + PIN_UP, 4));
    }
  }

  /* ---- solder fillets on the top face ---- */
  const joints = new THREE.Group();
  joints.name = 'solder_joints_top';
  for (const [x, y] of pins) {
    const g = new THREE.ConeGeometry(PAD_OD / 2 + 0.05, 0.34, 18, 1, true);
    g.rotateX(-Math.PI / 2);
    g.translate(x, y, BT + 0.17);
    const m = new THREE.Mesh(g, MAT.solder);
    m.name = `solder_${x < 0 ? 'l' : 'r'}_${y.toFixed(2)}`;
    joints.add(m);
  }
  part.add(joints);

  /* ---- RF shield can: 13.4 x 11.2 x 2.2 mm, sits toward the far edge ---- */
  const canCY = -1.4;
  part.add(extrude('rf_shield_can', MAT.shield,
    roundRectShape(0, canCY, 13.4, 11.2, 0.5), BT, 2.2));
  // stamped seam + vent dimples on the lid
  part.add(extrude('shield_lid_seam', MAT.shield, [
    rectShape(0, canCY + 5.0, 12.4, 0.35),
    rectShape(0, canCY - 5.0, 12.4, 0.35)], BT + 2.2, 0.08, 4));
  const dimples = new THREE.Group();
  dimples.name = 'shield_vents';
  for (let i = 0; i < 3; i++) {
    const g = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
    g.rotateX(Math.PI / 2);
    g.translate(-3.6 + i * 3.6, canCY, BT + 2.25);
    const m = new THREE.Mesh(g, MAT.shield);
    m.name = `vent_${i + 1}`;
    dimples.add(m);
  }
  part.add(dimples);

  /* ---- SMA female edge jack on the +Y edge ---- */
  const jy = BL / 2 - 1.4, jz = BT + 2.7;
  part.add(box('sma_body_block', MAT.brass, 6.35, 3.4, 5.4, 0, jy + 0.5, BT));
  part.add(cylY('sma_thread_barrel', MAT.brass, 3.1, 4.4, 0, jy + 2.2, jz));
  part.add(tubeY('sma_bore', MAT.brass, 3.02, 2.05, 4.5, 0, jy + 2.2, jz));
  part.add(cylY('sma_dielectric', MAT.ptfe, 2.05, 3.6, 0, jy + 2.7, jz));
  part.add(cylY('sma_centre_socket', MAT.gold, 0.62, 3.9, 0, jy + 2.5, jz));
  // thread ridges
  const threads = new THREE.Group();
  threads.name = 'sma_threads';
  for (let i = 0; i < 8; i++) {
    const m = cylY(`thread_${i + 1}`, MAT.brass, 3.16, 0.2, 0, jy + 2.6 + i * 0.5, jz, 28);
    threads.add(m);
  }
  part.add(threads);
  // ground tabs soldered to the pcb
  for (const side of [-1, 1]) {
    part.add(box(`sma_ground_tab_${side < 0 ? 'l' : 'r'}`, MAT.brass,
      1.1, 2.4, 0.8, side * 2.9, jy - 0.9, BT - 0.05));
  }
  part.add(box('sma_centre_pin_solder', MAT.solder, 1.0, 1.4, 0.4, 0, jy - 2.6, BT));

  /* ---- SX1278 transceiver die area is hidden; visible passives + xtal ---- */
  part.add(box('crystal_32mhz', MAT.shield, 3.2, 2.5, 0.9, 5.2, 5.0, BT));
  const passives = [[-5.6, 4.4], [-3.4, 4.6], [1.2, 5.2], [-5.6, -7.0], [0.4, -7.1], [4.2, -7.0]];
  part.add(extrude('passives_0603', MAT.plastic,
    passives.map(([x, y]) => rectShape(x, y, 0.9, 1.6)), BT, 0.45, 4));
  part.add(extrude('passive_terminations', MAT.gold,
    passives.flatMap(([x, y]) => [
      rectShape(x, y - 0.66, 0.95, 0.36),
      rectShape(x, y + 0.66, 0.95, 0.36)]), BT, 0.47, 4));

  return part;
}
