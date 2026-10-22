// Power parts for the POINTRESCUE battery bay:
//   • 18650 Li-ion cell (Ø18.4 × 65 mm)
//   • single-cell PCB-mount holder (76 × 20.5 × 19 mm)
//   • TP4056 charge module (26 × 17 mm, micro-USB) — it lands on the
//     24.8 × 17 mm boss the case already carries at z ≈ 17.5
// Millimetres, +Z up, z = 0 = each part's own seating face.
import * as THREE from 'three';

const MAT = {
  holder: new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.66, metalness: 0.03 }),
  nickel: new THREE.MeshStandardMaterial({ color: 0xc6cace, roughness: 0.3, metalness: 0.86 }),
  wrap: new THREE.MeshStandardMaterial({ color: 0x1b1e23, roughness: 0.42, metalness: 0.06 }),
  wrap_band: new THREE.MeshStandardMaterial({ color: 0x2e6ea8, roughness: 0.38, metalness: 0.08 }),
  insulator: new THREE.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 0.62, metalness: 0.02 }),
  chg_pcb: new THREE.MeshStandardMaterial({ color: 0x1b4f8a, roughness: 0.5, metalness: 0.06 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xc9a24c, roughness: 0.3, metalness: 0.85 }),
  shield: new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.42, metalness: 0.78 }),
  ic: new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.52, metalness: 0.04 }),
  led_red: new THREE.MeshStandardMaterial({ color: 0xb4443a, roughness: 0.3, metalness: 0.05 }),
  led_blue: new THREE.MeshStandardMaterial({ color: 0x3f6fb0, roughness: 0.3, metalness: 0.05 }),
};
MAT.holder.name = 'holder_black_plastic';
MAT.nickel.name = 'nickel_contact';
MAT.wrap.name = 'cell_wrap';
MAT.wrap_band.name = 'cell_wrap_band';
MAT.insulator.name = 'cell_insulator_ring';
MAT.chg_pcb.name = 'tp4056_pcb_blue';
MAT.gold.name = 'gold_plating';
MAT.shield.name = 'steel_shield';
MAT.ic.name = 'ic_black';
MAT.led_red.name = 'led_red';
MAT.led_blue.name = 'led_blue';

export const CELL = { d: 18.4, len: 65 };
export const HOLDER = { w: 76, d: 20.5, h: 19, floor: 1.2 };
// cell axis height above the holder's seating face
export const CELL_AXIS_Z = HOLDER.floor + CELL.d / 2;

function rectShape(cx, cy, w, h) {
  const s = new THREE.Shape();
  s.moveTo(cx - w / 2, cy - h / 2);
  s.lineTo(cx + w / 2, cy - h / 2);
  s.lineTo(cx + w / 2, cy + h / 2);
  s.lineTo(cx - w / 2, cy + h / 2);
  s.closePath();
  return s;
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

// cylinder with its axis along X (the cell lies across the bay)
function cylX(name, mat, r, len, x0, y, z, seg = 40) {
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  g.rotateZ(Math.PI / 2);
  g.translate(x0 + len / 2, y, z);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  return m;
}

/* ============================== 18650 cell ============================== */
export function buildCell18650() {
  const part = new THREE.Group();
  part.name = 'cell_18650';

  const R = CELL.d / 2, L = CELL.len, x0 = -L / 2;

  // bare nickel-plated can, then the printed wrap over most of it
  part.add(cylX('cell_can', MAT.nickel, R - 0.06, L, x0, 0, 0));
  part.add(cylX('cell_wrap', MAT.wrap, R, L - 3.4, x0 + 1.7, 0, 0));
  part.add(cylX('cell_wrap_band', MAT.wrap_band, R + 0.02, 7.5, x0 + 24, 0, 0));
  // insulator ring around the positive terminal
  part.add(cylX('cell_insulator_ring', MAT.insulator, R - 0.4, 0.5, x0 + L - 1.1, 0, 0, 44));
  // positive button, negative face
  part.add(cylX('cell_positive_button', MAT.nickel, 3.1, 1.3, x0 + L - 0.1, 0, 0, 30));
  part.add(cylX('cell_negative_face', MAT.nickel, R - 1.2, 0.3, x0 - 0.25, 0, 0, 36));

  return part;
}

/* =========================== single-cell holder ========================== */
export function buildBatteryHolder() {
  const part = new THREE.Group();
  part.name = 'battery_holder_18650';

  const { w: W, d: DP, h: H, floor: F } = HOLDER;
  const RAIL = 2.0, END = 4.0;

  // floor with the usual lightening slots
  const floor = rectShape(0, 0, W, DP);
  for (let i = -2; i <= 2; i++) floor.holes.push(rectShape(i * 12, 0, 7, 9));
  part.add(extrude('holder_floor', MAT.holder, floor, 0, F, 4));

  // side rails cradling the cell, cut down in the middle so the cell shows
  for (const sy of [-1, 1]) {
    const nm = sy < 0 ? 'front' : 'back';
    part.add(box(`holder_rail_${nm}`, MAT.holder, W, RAIL, H - 6, 0, sy * (DP / 2 - RAIL / 2), F));
    part.add(box(`holder_rail_${nm}_lip`, MAT.holder, W - 26, RAIL + 0.6, 2.2,
      0, sy * (DP / 2 - RAIL / 2), F + H - 6));
  }
  // end walls: spring side and fixed side
  for (const sx of [-1, 1]) {
    const nm = sx < 0 ? 'minus' : 'plus';
    part.add(box(`holder_end_${nm}`, MAT.holder, END, DP, H, sx * (W / 2 - END / 2), 0, 0));
    part.add(box(`holder_tab_${nm}`, MAT.holder, 1.6, 6.0, 3.0,
      sx * (W / 2 + 0.8), 0, F));
  }

  // contacts: coil spring on the negative end, flat plate on the positive end
  const axis = CELL_AXIS_Z;
  part.add(box('contact_plate_plus', MAT.nickel, 0.5, 9.0, 9.0, W / 2 - END - 0.25, 0, axis - 4.5));
  part.add(box('contact_plate_minus', MAT.nickel, 0.5, 9.0, 9.0, -W / 2 + END + 0.25, 0, axis - 4.5));
  const coil = new THREE.Group();
  coil.name = 'contact_spring';
  for (let i = 0; i < 4; i++) {
    const g = new THREE.TorusGeometry(3.4 - i * 0.15, 0.42, 8, 28);
    g.rotateY(Math.PI / 2);
    g.translate(-W / 2 + END + 1.0 + i * 1.1, 0, axis);
    const m = new THREE.Mesh(g, MAT.nickel);
    m.name = `spring_coil_${i + 1}`;
    coil.add(m);
  }
  part.add(coil);

  // wire exits on the back face — this holder is wired, not PCB-mounted, so
  // nothing protrudes below the seating plane
  for (const sx of [-1, 1]) {
    part.add(box(`wire_lug_${sx < 0 ? 'minus' : 'plus'}`, MAT.nickel,
      1.4, 2.6, 2.4, sx * (W / 2 - END - 0.6), DP / 2 - 0.4, F + 1.4));
  }

  return part;
}

/* ============================ TP4056 charger ============================ */
export function buildTp4056() {
  const part = new THREE.Group();
  part.name = 'tp4056_charger';

  const W = 26.0, DP = 17.0, T = 1.6;

  const pcb = rectShape(0, 0, W, DP);
  for (const sx of [-1, 1]) {
    const p = new THREE.Path();
    p.absarc(sx * (W / 2 - 2.2), DP / 2 - 2.2, 1.1, 0, Math.PI * 2, true);
    pcb.holes.push(p);
  }
  part.add(extrude('charger_pcb', MAT.chg_pcb, pcb, 0, T, 14));

  // micro-USB receptacle overhanging the +X edge
  const ux = W / 2 - 1.4;
  part.add(box('usb_shell', MAT.shield, 5.9, 7.6, 2.65, ux, 0, T));
  part.add(box('usb_tongue', MAT.ic, 2.2, 5.4, 0.6, ux + 0.6, 0, T + 0.9));

  // TP4056 SOP-8 + DW01 protection + dual MOSFET
  part.add(box('tp4056_ic', MAT.ic, 5.0, 4.0, 1.05, -1.0, 3.4, T));
  part.add(extrude('tp4056_leads', MAT.gold,
    [-1, 1].flatMap((sy) => [0, 1, 2, 3].map((i) =>
      rectShape(-3.0 + i * 1.27, 3.4 + sy * 2.6, 0.5, 1.2))), T, 0.22, 4));
  part.add(box('dw01_ic', MAT.ic, 3.0, 1.6, 0.75, -7.2, -3.6, T));
  part.add(box('mosfet_ic', MAT.ic, 2.9, 2.9, 0.8, -3.2, -4.2, T));

  // charge / standby LEDs and the programming resistor
  part.add(box('led_charge', MAT.led_red, 1.6, 0.8, 0.55, 6.6, 6.2, T));
  part.add(box('led_standby', MAT.led_blue, 1.6, 0.8, 0.55, 6.6, 4.0, T));

  const passives = [[3.4, -5.6], [1.0, -5.6], [-5.4, 5.8], [-8.6, 2.0], [-9.4, -0.6], [5.6, -2.4]];
  part.add(extrude('passives_0805', MAT.ic,
    passives.map(([x, y]) => rectShape(x, y, 2.05, 1.3)), T, 0.6, 4));
  part.add(extrude('passive_terminations', MAT.gold,
    passives.flatMap(([x, y]) => [
      rectShape(x - 0.85, y, 0.45, 1.35),
      rectShape(x + 0.85, y, 0.45, 1.35)]), T, 0.62, 4));

  // B+ / B- / OUT+ / OUT- solder pads along the -X edge
  const padY = [6.0, 2.0, -2.0, -6.0];
  part.add(extrude('screw_pads', MAT.gold,
    padY.map((y) => rectShape(-W / 2 + 2.4, y, 3.0, 2.4)), T - 0.01, 0.06, 4));

  return part;
}
