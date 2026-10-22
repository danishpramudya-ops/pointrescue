// u-blox NEO-M8N GPS breakout (GY-GPSV3-NEO / "NEO-M8N flight controller"
// style) — 30 x 21 mm carrier, NEO-M8N module can, ceramic patch antenna,
// rechargeable backup cell, 6-pin header, 2 mounting holes.
// Millimetres, board plane = XY, +Z up, z = 0 = carrier pcb underside.
import * as THREE from 'three';

const MAT = {
  pcb: new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.46, metalness: 0.06 }),
  shield: new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.42, metalness: 0.78 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xc9a24c, roughness: 0.3, metalness: 0.85 }),
  solder: new THREE.MeshStandardMaterial({ color: 0xb9bcb8, roughness: 0.28, metalness: 0.8 }),
  plastic: new THREE.MeshStandardMaterial({ color: 0x191a1d, roughness: 0.58, metalness: 0.03 }),
  ceramic: new THREE.MeshStandardMaterial({ color: 0xdfd8c4, roughness: 0.34, metalness: 0.04 }),
  patch_top: new THREE.MeshStandardMaterial({ color: 0xd6b25c, roughness: 0.26, metalness: 0.88 }),
  cell: new THREE.MeshStandardMaterial({ color: 0x8e6f3c, roughness: 0.4, metalness: 0.5 }),
  led_blue: new THREE.MeshStandardMaterial({ color: 0x3f6fb0, roughness: 0.3, metalness: 0.05 }),
};
MAT.pcb.name = 'carrier_pcb_black';
MAT.shield.name = 'steel_shield';
MAT.gold.name = 'gold_plating';
MAT.solder.name = 'solder_joint';
MAT.plastic.name = 'black_plastic';
MAT.ceramic.name = 'antenna_ceramic';
MAT.patch_top.name = 'antenna_patch_gold';
MAT.cell.name = 'backup_cell';
MAT.led_blue.name = 'led_blue';

// carrier size + hole spacing taken from the mounting-hole pattern found in
// the project's own gerber (20.5 x 30.7 mm), i.e. the 25 x 35 mm GY carrier.
const BW = 25.0, BL = 35.0, BT = 1.6;      // carrier pcb
const PITCH = 2.54, NPIN = 4;   // the carrier footprint on this board has 4 pads
const PAD_OD = 1.7, DRILL = 0.55;
const PIN = 0.64, HDR_H = 2.54, PIN_DOWN = 6.0, PIN_UP = 1.0;
const MOUNT_R = 1.55;                       // M3 mounting holes

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

function cyl(name, mat, r, h, x, y, z, seg = 32) {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  g.rotateX(Math.PI / 2);
  g.translate(x, y, z + h / 2);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  return m;
}

export function buildNeoM8n(opts = {}) {
  const withPatch = opts.patch !== false;
  const part = new THREE.Group();
  part.name = 'neo_m8n_gps_breakout';

  /* ---- 6-pin header row along the -Y short edge ---- */
  const hy = -BL / 2 + 2.3;
  const pins = [];
  for (let i = 0; i < NPIN; i++) {
    pins.push([-((NPIN - 1) / 2) * PITCH + i * PITCH, hy]);
  }
  const mounts = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) mounts.push([sx * 10.25, sy * 15.35]);

  /* ---- carrier pcb, drilled ---- */
  const boardShape = roundRectShape(0, 0, BW, BL, 1.4);
  for (const [x, y] of pins) boardShape.holes.push(circlePath(x, y, DRILL));
  for (const [x, y] of mounts) boardShape.holes.push(circlePath(x, y, MOUNT_R));
  part.add(extrude('carrier_pcb', MAT.pcb, boardShape, 0, BT));

  /* ---- gold rings: header pads + plated mounting holes ---- */
  const rings = pins.map(([x, y]) => {
    const s = new THREE.Shape();
    s.absarc(x, y, PAD_OD / 2, 0, Math.PI * 2, false);
    s.holes.push(circlePath(x, y, DRILL));
    return s;
  });
  for (const [x, y] of mounts) {
    const s = new THREE.Shape();
    s.absarc(x, y, MOUNT_R + 0.75, 0, Math.PI * 2, false);
    s.holes.push(circlePath(x, y, MOUNT_R));
    rings.push(s);
  }
  part.add(extrude('pad_rings_top', MAT.gold, rings, BT - 0.01, 0.06));
  part.add(extrude('pad_rings_bottom', MAT.gold, rings, -0.05, 0.06));

  /* ---- male header under the board, pins through ---- */
  part.add(box('header_body', MAT.plastic, NPIN * PITCH, PITCH, HDR_H, 0, hy, -HDR_H));
  part.add(extrude('header_pins', MAT.gold, pins.map(([x, y]) => rectShape(x, y, PIN, PIN)),
    -HDR_H - PIN_DOWN, HDR_H + PIN_DOWN + BT + PIN_UP, 4));
  const joints = new THREE.Group();
  joints.name = 'solder_joints_top';
  for (const [x, y] of pins) {
    const g = new THREE.ConeGeometry(PAD_OD / 2 + 0.06, 0.5, 18, 1, true);
    g.rotateX(-Math.PI / 2);
    g.translate(x, y, BT + 0.25);
    const m = new THREE.Mesh(g, MAT.solder);
    m.name = `solder_${x.toFixed(2)}`;
    joints.add(m);
  }
  part.add(joints);

  /* ---- NEO-M8N module can (12.2 x 16 mm) on the pcb ---- */
  const canY = 2.2;
  part.add(extrude('neo_m8n_can', MAT.shield,
    roundRectShape(0, canY, 12.2, 16.0, 0.5), BT, 2.4));
  part.add(extrude('neo_m8n_can_seam', MAT.shield,
    [rectShape(0, canY + 7.2, 11.4, 0.3), rectShape(0, canY - 7.2, 11.4, 0.3)],
    BT + 2.4, 0.08, 4));

  /* ---- ceramic patch antenna: taped on top of the can, foam pads at the
         corners — exactly how the GY carrier stacks it ---- */
  const tapeZ = BT + 2.4, antZ = tapeZ + 0.35;
  if (withPatch) {
    const pads = [[-10, -8.5], [10, -8.5], [-10, 11.0], [10, 11.0]];
    part.add(extrude('antenna_foam_pads', MAT.plastic,
      pads.map(([x, y]) => rectShape(x, y, 3.4, 3.4)), BT, 2.75, 4));
    part.add(box('antenna_tape', MAT.plastic, 12.0, 15.6, 0.35, 0, canY, tapeZ));
    part.add(box('antenna_ceramic', MAT.ceramic, 25, 25, 3.4, 0, 1.0, antZ));
    part.add(box('antenna_patch_plate', MAT.patch_top, 23.4, 23.4, 0.12, 0, 1.0, antZ + 3.4));
    part.add(cyl('antenna_feed_pin', MAT.gold, 0.5, 0.5, -6.5, 4.0, antZ + 3.5));
  } else {
    // u.FL jack feeding the patch antenna on the case's top face
    part.add(box('ufl_jack_body', MAT.shield, 2.6, 2.6, 1.25, 4.0, canY + 5.4, BT));
    part.add(cyl('ufl_jack_ring', MAT.shield, 1.05, 0.5, 4.0, canY + 5.4, BT + 1.25));
    part.add(cyl('ufl_jack_pin', MAT.gold, 0.28, 0.4, 4.0, canY + 5.4, BT + 1.4));
  }

  /* ---- backup cell (under the patch) + LDO, LED, passives on the front strip ---- */
  part.add(cyl('backup_cell', MAT.cell, 3.05, 1.4, 7.4, -7.6, BT));
  part.add(cyl('backup_cell_top', MAT.shield, 2.1, 0.12, 7.4, -7.6, BT + 1.4));
  part.add(box('ldo_regulator', MAT.plastic, 2.9, 1.6, 1.1, 5.4, -13.4, BT));
  part.add(extrude('ldo_leads', MAT.gold, [
    rectShape(5.4, -14.4, 2.2, 0.7),
    rectShape(4.6, -12.4, 0.7, 0.8),
    rectShape(6.2, -12.4, 0.7, 0.8)], BT, 0.28, 4));
  part.add(box('led_fix', MAT.led_blue, 1.25, 2.0, 0.75, -9.6, -13.2, BT));

  const passives = [[-6.6, -13.2], [-4.1, -13.2], [-1.6, -13.2], [0.9, -13.2],
    [9.4, -13.0], [9.4, -10.4]];
  part.add(extrude('passives_0603', MAT.plastic,
    passives.map(([x, y]) => rectShape(x, y, 0.9, 1.6)), BT, 0.45, 4));
  part.add(extrude('passive_terminations', MAT.gold,
    passives.flatMap(([x, y]) => [
      rectShape(x, y - 0.66, 0.95, 0.36),
      rectShape(x, y + 0.66, 0.95, 0.36)]), BT, 0.47, 4));

  return part;
}
