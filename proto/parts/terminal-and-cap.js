// Passive / connector parts for the PKM carrier board:
//  • 2-way 3.5 mm pluggable screw terminal block (KF128 / "PCB terminal")
//  • radial electrolytic capacitor C1 (8 mm can, 3.5 mm lead pitch)
// Millimetres, board plane = XY, +Z up, z = 0 = carrier-board top face
// (leads run below z = 0, same convention as the module parts).
import * as THREE from 'three';

const MAT = {
  housing: new THREE.MeshStandardMaterial({ color: 0x1f5c8f, roughness: 0.5, metalness: 0.05 }),
  screw: new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.34, metalness: 0.85 }),
  cage: new THREE.MeshStandardMaterial({ color: 0xc9a24c, roughness: 0.32, metalness: 0.88 }),
  lead: new THREE.MeshStandardMaterial({ color: 0xd0d3cf, roughness: 0.3, metalness: 0.8 }),
  sleeve: new THREE.MeshStandardMaterial({ color: 0x1b3b6b, roughness: 0.42, metalness: 0.08 }),
  sleeve_top: new THREE.MeshStandardMaterial({ color: 0x9fb6d4, roughness: 0.36, metalness: 0.2 }),
  alu: new THREE.MeshStandardMaterial({ color: 0xb9bdc0, roughness: 0.34, metalness: 0.82 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.72, metalness: 0.02 }),
};
MAT.housing.name = 'terminal_housing_blue';
MAT.screw.name = 'screw_steel';
MAT.cage.name = 'brass_cage_clamp';
MAT.lead.name = 'tinned_lead';
MAT.sleeve.name = 'cap_sleeve_blue';
MAT.sleeve_top.name = 'cap_sleeve_stripe';
MAT.alu.name = 'aluminium_can';
MAT.rubber.name = 'cap_rubber_base';

function rectShape(cx, cy, w, h) {
  const s = new THREE.Shape();
  s.moveTo(cx - w / 2, cy - h / 2);
  s.lineTo(cx + w / 2, cy - h / 2);
  s.lineTo(cx + w / 2, cy + h / 2);
  s.lineTo(cx - w / 2, cy + h / 2);
  s.closePath();
  return s;
}

function circlePath(x, y, r) {
  const p = new THREE.Path();
  p.absarc(x, y, r, 0, Math.PI * 2, true);
  return p;
}

function extrude(name, mat, shapes, z, depth, seg = 20) {
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

function cyl(name, mat, r, h, x, y, z, seg = 40, rTop = r) {
  const g = new THREE.CylinderGeometry(rTop, r, h, seg);
  g.rotateX(Math.PI / 2);
  g.translate(x, y, z + h / 2);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  return m;
}

/* ============================ terminal block ============================ */
export function buildTerminalBlock(N = 2) {
  const part = new THREE.Group();
  part.name = `terminal_block_${N}way_3v5mm`;

  const PITCH = 3.5;
  const W = N * PITCH, D = 7.0, H = 8.5;
  const WALL = 0.7, BACK = 1.7, FLOOR = 0.9, LID = 1.9;
  const xs = [];
  for (let i = 0; i < N; i++) xs.push(-((N - 1) / 2) * PITCH + i * PITCH);

  // The wire mouths face -Y, the screws face +Z: build the housing from walls
  // so the front stays genuinely open (like a KF128).
  const cavY = -BACK / 2, cavD = D - BACK;          // cavity depth in y
  part.add(box('housing_back_wall', MAT.housing, W, BACK, H, 0, D / 2 - BACK / 2, 0));
  part.add(box('housing_floor', MAT.housing, W, cavD, FLOOR, 0, cavY, 0));
  for (const sx of [-1, 1]) {
    part.add(box(`housing_wall_${sx < 0 ? 'left' : 'right'}`, MAT.housing,
      WALL, cavD, H, sx * (W / 2 - WALL / 2), cavY, 0));
  }
  for (let i = 1; i < N; i++) {
    part.add(box(`housing_divider_${i}`, MAT.housing, 0.6, cavD, H, -W / 2 + i * PITCH, cavY, 0));
  }
  part.add(box('housing_front_lip', MAT.housing, W, 0.55, 1.1, 0, -D / 2 + 0.28, H - LID - 1.1));
  const lidShape = rectShape(0, cavY, W, cavD);
  for (const x of xs) lidShape.holes.push(circlePath(x, cavY + 0.9, 1.32));
  part.add(extrude('housing_lid', MAT.housing, [lidShape], H - LID, LID));

  for (let i = 0; i < N; i++) {
    const x = xs[i], tag = i + 1;
    // slotted M2.5 screw sunk in the lid bore
    const sz = H - LID + 0.3;   // head sits up inside the bore, visible from above
    part.add(cyl(`screw_head_${tag}`, MAT.screw, 1.28, 1.3, x, cavY + 0.9, sz, 26));
    part.add(box(`screw_slot_${tag}`, MAT.rubber, 2.3, 0.4, 0.3, x, cavY + 0.9, sz + 1.0));
    part.add(cyl(`screw_shank_${tag}`, MAT.screw, 0.62, sz - FLOOR - 1.2, x, cavY + 0.9,
      FLOOR + 1.2, 20));
    // brass cage clamp sitting on the floor
    const cage = rectShape(x, cavY - 0.2, 2.6, cavD - 1.4);
    cage.holes.push(rectShape(x, cavY - 0.2, 1.8, cavD - 2.6));
    part.add(extrude(`cage_clamp_${tag}`, MAT.cage, [cage], FLOOR, 3.2));
    // through-hole lead + solder pool on the pcb side
    part.add(box(`lead_${tag}`, MAT.lead, 0.9, 0.9, 4.6, x, cavY, -4.0));
    part.add(box(`lead_solder_${tag}`, MAT.lead, 1.9, 1.9, 0.5, x, cavY, -0.5));
  }

  return part;
}

/* ========================= electrolytic capacitor ======================== */
export function buildElectrolytic(opts = {}) {
  const R = opts.r ?? 4.0, HGT = opts.h ?? 11.5;
  const LEAD_PITCH = opts.leadPitch ?? 3.5, LEAD_DOWN = 4.6;

  const part = new THREE.Group();
  part.name = `electrolytic_cap_${(R * 2).toFixed(1)}mm`;

  part.add(cyl('cap_rubber_base', MAT.rubber, R - 0.1, 0.9, 0, 0, 0));
  part.add(cyl('cap_can', MAT.alu, R, HGT - 1.4, 0, 0, 0.9));
  // heat-shrink sleeve, slightly proud of the can, with the polarity stripe
  part.add(cyl('cap_sleeve', MAT.sleeve, R + 0.06, HGT - 2.2, 0, 0, 1.1));
  const stripe = new THREE.Shape();
  stripe.absarc(0, 0, R + 0.09, Math.PI * 0.87, Math.PI * 1.13, false);
  stripe.absarc(0, 0, R + 0.02, Math.PI * 1.13, Math.PI * 0.87, true);
  stripe.closePath();
  part.add(extrude('cap_polarity_stripe', MAT.sleeve_top, [stripe], 1.3, HGT - 2.6, 40));
  // crimped top with the pressure-relief cross
  // crimped rim + stamped pressure-relief cross on the very top of the can
  const canTop = 0.9 + (HGT - 1.4);
  part.add(cyl('cap_top_crimp', MAT.alu, R, 0.45, 0, 0, canTop - 0.45, 40, R - 0.45));
  part.add(extrude('cap_vent_cross', MAT.rubber,
    [rectShape(0, 0, R * 1.3, 0.42), rectShape(0, 0, 0.42, R * 1.3)], canTop - 0.05, 0.07, 4));

  for (const [tag, x] of [['plus', -LEAD_PITCH / 2], ['minus', LEAD_PITCH / 2]]) {
    part.add(cyl(`lead_${tag}`, MAT.lead, 0.32, LEAD_DOWN + 0.9, x, 0, -LEAD_DOWN, 16));
    part.add(cyl(`lead_solder_${tag}`, MAT.lead, 0.95, 0.5, x, 0, -0.5, 20, 0.55));
  }

  return part;
}
