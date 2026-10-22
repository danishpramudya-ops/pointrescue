// LoRa SX1278 (Ra-02) soldered onto its 2.54 mm breakout adapter — this is
// the footprint the PKM board actually carries: 8 + 8 pins on 2.54 mm pitch,
// rows 25.4 mm apart, measured off the gerber.
// Millimetres, z = 0 = adapter pcb underside, header pins below.
import * as THREE from 'three';
import { buildLoraSx1278 } from './lora-sx1278.js';

const MAT = {
  pcb: new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.46, metalness: 0.06 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xc9a24c, roughness: 0.3, metalness: 0.85 }),
  solder: new THREE.MeshStandardMaterial({ color: 0xb9bcb8, roughness: 0.28, metalness: 0.8 }),
  plastic: new THREE.MeshStandardMaterial({ color: 0x191a1d, roughness: 0.58, metalness: 0.03 }),
};
MAT.pcb.name = 'adapter_pcb_black';
MAT.gold.name = 'gold_plating';
MAT.solder.name = 'solder_joint';
MAT.plastic.name = 'black_plastic';

const AW = 29.0, AL = 22.0, AT = 1.6;          // adapter pcb
const H_PITCH = 2.54, H_N = 8, H_ROW = 25.4;   // outer header rows
const M_PITCH = 2.0, M_N = 8, M_ROW = 15.6;    // inner rows the module sits on
const PAD_OD = 1.6, DRILL = 0.52;
const PIN = 0.64, HDR_H = 2.54, PIN_DOWN = 6.0, PIN_UP = 0.9;

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

export function buildLoraOnAdapter() {
  const part = new THREE.Group();
  part.name = 'lora_sx1278_on_adapter';

  const hdr = [], mod = [];
  for (let i = 0; i < H_N; i++) {
    const y = -((H_N - 1) / 2) * H_PITCH + i * H_PITCH;
    hdr.push([-H_ROW / 2, y], [H_ROW / 2, y]);
  }
  for (let i = 0; i < M_N; i++) {
    const y = -((M_N - 1) / 2) * M_PITCH + i * M_PITCH;
    mod.push([-M_ROW / 2, y], [M_ROW / 2, y]);
  }

  /* ---- adapter pcb, drilled for both grids ---- */
  const shape = roundRectShape(0, 0, AW, AL, 1.0);
  for (const [x, y] of hdr) shape.holes.push(circlePath(x, y, DRILL));
  for (const [x, y] of mod) shape.holes.push(circlePath(x, y, DRILL * 0.85));
  part.add(extrude('adapter_pcb', MAT.pcb, shape, 0, AT));

  const ring = (x, y, od, id) => {
    const s = new THREE.Shape();
    s.absarc(x, y, od / 2, 0, Math.PI * 2, false);
    s.holes.push(circlePath(x, y, id));
    return s;
  };
  const rings = hdr.map(([x, y]) => ring(x, y, PAD_OD, DRILL))
    .concat(mod.map(([x, y]) => ring(x, y, 1.25, DRILL * 0.85)));
  part.add(extrude('adapter_rings_top', MAT.gold, rings, AT - 0.01, 0.05));
  part.add(extrude('adapter_rings_bottom', MAT.gold, rings, -0.04, 0.05));

  /* ---- outer male headers ---- */
  for (const side of [-1, 1]) {
    const nm = side < 0 ? 'left' : 'right';
    part.add(box(`header_${nm}_body`, MAT.plastic, H_PITCH, H_N * H_PITCH, HDR_H,
      (side * H_ROW) / 2, 0, -HDR_H));
    part.add(extrude(`header_${nm}_pins`, MAT.gold,
      hdr.filter(([x]) => Math.sign(x) === side).map(([x, y]) => rectShape(x, y, PIN, PIN)),
      -HDR_H - PIN_DOWN, HDR_H + PIN_DOWN + AT + PIN_UP, 4));
  }
  const joints = new THREE.Group();
  joints.name = 'adapter_solder_joints';
  for (const [x, y] of hdr) {
    const g = new THREE.ConeGeometry(PAD_OD / 2 + 0.05, 0.5, 18, 1, true);
    g.rotateX(-Math.PI / 2);
    g.translate(x, y, AT + 0.25);
    const m = new THREE.Mesh(g, MAT.solder);
    m.name = `solder_${x < 0 ? 'l' : 'r'}_${y.toFixed(2)}`;
    joints.add(m);
  }
  part.add(joints);

  /* ---- the Ra-02 module, soldered flat onto the inner grid ---- */
  const module = buildLoraSx1278({ headers: false });
  module.position.z = AT;
  part.add(module);

  return part;
}
