// ESP32-WROOM-32 devkit, 30-pin (DOIT DevKit V1 style) — 51.4 x 28.3 mm.
// Millimetres, board plane = XY, +Z up. z = 0 is the devkit PCB's underside;
// the header pins run below it, so the part drops straight onto a carrier
// board at z = 0 (its own datum) for the exploded view.
import * as THREE from 'three';

const MAT = {
  pcb: new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.46, metalness: 0.06 }),
  solder: new THREE.MeshStandardMaterial({ color: 0xb9bcb8, roughness: 0.28, metalness: 0.8 }),
  shield: new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.42, metalness: 0.78 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xc9a24c, roughness: 0.3, metalness: 0.85 }),
  plastic: new THREE.MeshStandardMaterial({ color: 0x191a1d, roughness: 0.58, metalness: 0.03 }),
  led_red: new THREE.MeshStandardMaterial({ color: 0xb4443a, roughness: 0.3, metalness: 0.05 }),
  led_blue: new THREE.MeshStandardMaterial({ color: 0x3f6fb0, roughness: 0.3, metalness: 0.05 }),
};
MAT.pcb.name = 'devkit_pcb_black';
MAT.shield.name = 'steel_shield';
MAT.gold.name = 'gold_plating';
MAT.solder.name = 'solder_joint';
MAT.plastic.name = 'black_plastic';
MAT.led_red.name = 'led_red';
MAT.led_blue.name = 'led_blue';

const BW = 28.3, BL = 51.4, BT = 1.6;   // devkit pcb
const PITCH = 2.54, ROW = 25.4, NPIN = 15;
const PAD_OD = 1.6, DRILL = 0.55;       // radius: pad ring / hole
const PIN = 0.64;                        // square pin
const HDR_H = 2.54, PIN_DOWN = 6.0, PIN_UP = 1.0;

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

export function buildEsp32Devkit() {
  const part = new THREE.Group();
  part.name = 'esp32_wroom_32_devkit';

  /* ---- header hole grid ---- */
  const pins = [];
  for (let i = 0; i < NPIN; i++) {
    const y = -((NPIN - 1) / 2) * PITCH + i * PITCH;
    pins.push([-ROW / 2, y], [ROW / 2, y]);
  }

  /* ---- devkit pcb, drilled ---- */
  const boardShape = roundRectShape(0, 0, BW, BL, 1.2);
  for (const [x, y] of pins) boardShape.holes.push(circlePath(x, y, DRILL));
  part.add(extrude('devkit_pcb', MAT.pcb, boardShape, 0, BT));

  /* ---- gold annular rings, both faces ---- */
  const rings = pins.map(([x, y]) => {
    const s = new THREE.Shape();
    s.absarc(x, y, PAD_OD / 2, 0, Math.PI * 2, false);
    s.holes.push(circlePath(x, y, DRILL));
    return s;
  });
  part.add(extrude('pad_rings_top', MAT.gold, rings, BT - 0.01, 0.06));
  part.add(extrude('pad_rings_bottom', MAT.gold, rings, -0.05, 0.06));

  /* ---- solder fillets on the top face (headers are soldered from above) ---- */
  const fillets = new THREE.Group();
  fillets.name = 'solder_joints_top';
  for (const [x, y] of pins) {
    const g = new THREE.ConeGeometry(PAD_OD / 2 + 0.06, 0.62, 20, 1, true);
    g.rotateX(-Math.PI / 2);
    g.translate(x, y, BT + 0.31);
    const m = new THREE.Mesh(g, MAT.solder);
    m.name = `solder_${x < 0 ? 'l' : 'r'}_${y.toFixed(2)}`;
    fillets.add(m);
  }
  part.add(fillets);

  /* ---- male headers: plastic spacer under the board, pins through ---- */
  for (const side of [-1, 1]) {
    const nm = side < 0 ? 'left' : 'right';
    part.add(box(`header_${nm}_body`, MAT.plastic, PITCH, NPIN * PITCH, HDR_H,
      (side * ROW) / 2, 0, -HDR_H));
    const sq = pins.filter(([x]) => Math.sign(x) === side)
      .map(([x, y]) => rectShape(x, y, PIN, PIN));
    part.add(extrude(`header_${nm}_pins`, MAT.gold, sq, -HDR_H - PIN_DOWN, HDR_H + PIN_DOWN + BT + PIN_UP, 4));
  }

  /* ---- ESP32-WROOM-32 module (antenna end flush with the board edge) ---- */
  const modW = 18, modL = 25.5, modT = 0.8;
  const modCY = BL / 2 - modL / 2;
  part.add(extrude('wroom_module_pcb', MAT.pcb,
    roundRectShape(0, modCY, modW, modL, 0.4), BT, modT));
  const shieldL = 18.2;
  const shieldCY = modCY - (modL - shieldL) / 2;
  part.add(extrude('wroom_shield', MAT.shield,
    roundRectShape(0, shieldCY, modW - 0.2, shieldL, 0.8), BT + modT, 2.3));

  // meandered PCB antenna on the module's exposed end
  const antBase = shieldCY + shieldL / 2 + 1.1;
  const ant = [];
  for (let i = 0; i < 5; i++) ant.push(rectShape(0, antBase + i * 1.25, 13, 0.5));
  for (let i = 0; i < 4; i++) ant.push(rectShape(i % 2 ? -6.25 : 6.25, antBase + 0.625 + i * 1.25, 0.5, 1.25));
  ant.push(rectShape(-6.25, antBase - 1.3, 0.5, 2.6));
  part.add(extrude('wroom_antenna', MAT.gold, ant, BT + modT - 0.01, 0.06, 4));

  /* ---- micro-USB receptacle at the far end ---- */
  const usbCY = -BL / 2 + 2.1;
  const shell = roundRectShape(0, usbCY, 7.6, 5.9, 0.5);
  shell.holes.push(roundRectShape(0, usbCY, 6.5, 4.8, 0.4));
  part.add(extrude('usb_shell', MAT.shield, shell, BT, 2.5));
  part.add(box('usb_cavity', MAT.plastic, 6.4, 4.7, 2.3, 0, usbCY + 0.4, BT + 0.1));
  part.add(box('usb_tongue', MAT.shield, 5.2, 2.0, 0.5, 0, usbCY - 1.1, BT + 0.95));

  /* ---- reset tact switch (the only button wired in the built unit) ---- */
  part.add(box('switch_reset_body', MAT.plastic, 4.4, 4.4, 1.5, -8.6, -18.4, BT));
  part.add(box('switch_reset_plate', MAT.shield, 4.1, 4.1, 0.35, -8.6, -18.4, BT + 1.5));
  part.add(cyl('switch_reset_plunger', MAT.plastic, 0.85, 0.7, -8.6, -18.4, BT + 1.85));

  /* ---- USB-UART bridge + regulator + LEDs + passives ---- */
  part.add(box('usb_uart_ic', MAT.pcb, 5, 5, 0.95, -7.2, -11.6, BT));
  part.add(box('ldo_regulator', MAT.pcb, 6.6, 3.6, 1.65, 7.4, -11.2, BT));
  part.add(extrude('ldo_leads', MAT.gold, [
    rectShape(7.4, -13.4, 3.2, 1.2),
    rectShape(5.1, -9.4, 1.4, 0.9),
    rectShape(7.4, -9.4, 1.4, 0.9),
    rectShape(9.7, -9.4, 1.4, 0.9)], BT, 0.25, 4));
  part.add(box('led_power', MAT.led_red, 1.25, 2.0, 0.75, -5.4, -21.2, BT));
  part.add(box('led_status', MAT.led_blue, 1.25, 2.0, 0.75, 5.4, -21.2, BT));

  const passives = [[-9.2, -6.2], [-6.4, -6.2], [-3.4, -6.2], [9.2, -6.2],
    [6.4, -6.2], [3.4, -6.2], [-9.2, -15.4], [9.2, -15.4], [0, -8.4], [0, -14.6]];
  part.add(extrude('passives_0805', MAT.plastic,
    passives.map(([x, y]) => rectShape(x, y, 1.3, 2.05)), BT, 0.6, 4));
  part.add(extrude('passive_terminations', MAT.gold,
    passives.flatMap(([x, y]) => [rectShape(x, y - 0.85, 1.35, 0.45), rectShape(x, y + 0.85, 1.35, 0.45)]),
    BT, 0.62, 4));

  return part;
}
