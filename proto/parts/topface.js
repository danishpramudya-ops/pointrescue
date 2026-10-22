// Parts mounted through the case's top end face (the 84 × 35 mm face at
// y = +55): SMA bulkhead + rubber-duck antenna, the external 25 mm GPS patch,
// the two indicator LEDs and the blue-capped reset button.
// Millimetres. Local origin sits ON the outer face, +Y = outward, so a shank at
// negative Y is inside the case and the 3 mm wall spans y −3 … 0.
import * as THREE from 'three';

const MAT = {
  rubber: new THREE.MeshStandardMaterial({ color: 0x131417, roughness: 0.78, metalness: 0.02 }),
  plastic: new THREE.MeshStandardMaterial({ color: 0x191a1d, roughness: 0.58, metalness: 0.03 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xd8c48a, roughness: 0.26, metalness: 0.9 }),
  nickel: new THREE.MeshStandardMaterial({ color: 0xc6cace, roughness: 0.3, metalness: 0.86 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xc9a24c, roughness: 0.3, metalness: 0.85 }),
  teal: new THREE.MeshStandardMaterial({ color: 0x2f8f86, roughness: 0.55, metalness: 0.04 }),
  coax: new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.6, metalness: 0.03 }),
  ceramic: new THREE.MeshStandardMaterial({ color: 0xd8c9a8, roughness: 0.42, metalness: 0.05 }),
  patch: new THREE.MeshStandardMaterial({ color: 0xb98a4e, roughness: 0.28, metalness: 0.86 }),
  cap_blue: new THREE.MeshStandardMaterial({ color: 0x2a6fd0, roughness: 0.44, metalness: 0.06 }),
  led_yellow: new THREE.MeshStandardMaterial({ color: 0xd8c22e, roughness: 0.26, metalness: 0.04 }),
  led_green: new THREE.MeshStandardMaterial({ color: 0x39a94e, roughness: 0.26, metalness: 0.04 }),
};
MAT.rubber.name = 'antenna_rubber';
MAT.plastic.name = 'black_plastic';
MAT.brass.name = 'sma_brass';
MAT.nickel.name = 'nickel_plating';
MAT.gold.name = 'gold_plating';
MAT.teal.name = 'heatshrink_teal';
MAT.coax.name = 'coax_jacket';
MAT.ceramic.name = 'patch_ceramic';
MAT.patch.name = 'patch_copper';
MAT.cap_blue.name = 'button_cap_blue';
MAT.led_yellow.name = 'led_yellow';
MAT.led_green.name = 'led_green';

// cylinder along Y, spanning y0 → y0 + len (rTop tapers the outward end)
function cylY(name, mat, r, len, x, y0, z, seg = 32, rTop = r) {
  const g = new THREE.CylinderGeometry(rTop, r, len, seg);
  g.translate(0, len / 2, 0);
  g.translate(x, y0, z);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  return m;
}

function ringY(name, mat, r, tube, x, y, z) {
  const g = new THREE.TorusGeometry(r, tube, 10, 30);
  g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  return m;
}

function ball(name, mat, r, x, y, z) {
  const g = new THREE.SphereGeometry(r, 24, 16);
  g.translate(x, y, z);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  return m;
}

// slab: w across X, t through Y (from y0 outward), h up Z, centred on x / z
function slab(name, mat, w, t, h, x, y0, z) {
  const g = new THREE.BoxGeometry(w, t, h);
  g.translate(x, y0 + t / 2, z);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  return m;
}

/* ================= SMA bulkhead + rubber-duck antenna =================
   Fits the Ø6 mm hole in the case's left wall (3 mm thick). */
export function buildAntennaAssembly() {
  const part = new THREE.Group();
  part.name = 'lora_antenna_assembly';

  // bulkhead jack through the wall: nut outside, washer + solder tail inside
  part.add(cylY('sma_nut', MAT.brass, 3.9, 2.6, 0, 0.2, 0, 6));
  part.add(cylY('sma_thread', MAT.brass, 2.95, 5.4, 0, 2.6, 0));
  part.add(cylY('sma_shank', MAT.brass, 2.95, 3.4, 0, -3.2, 0));
  part.add(cylY('sma_centre_pin', MAT.gold, 0.62, 6.4, 0, 2.4, 0, 18));
  part.add(cylY('sma_washer', MAT.nickel, 4.1, 0.8, 0, -4.0, 0, 24));
  part.add(cylY('sma_body_inner', MAT.brass, 3.2, 4.6, 0, -8.6, 0));

  // pigtail: white coax under teal heat-shrink, running back into the case
  part.add(cylY('coax_pigtail', MAT.coax, 1.35, 22, 0, -30, 0, 16));
  part.add(cylY('pigtail_heatshrink', MAT.teal, 2.0, 11, 0, -19.5, 0, 18));

  // antenna: knurled plug barrel, ribbed shoulder, tapered rubber blade
  part.add(cylY('antenna_plug_barrel', MAT.rubber, 4.7, 13, 0, 7.6, 0));
  for (let i = 0; i < 3; i++) {
    part.add(ringY(`antenna_rib_${i + 1}`, MAT.rubber, 4.55, 0.62, 0, 22.4 + i * 2.7, 0));
  }
  part.add(cylY('antenna_blade', MAT.rubber, 4.55, 85, 0, 20.6, 0, 30, 3.35));
  part.add(ball('antenna_tip', MAT.rubber, 3.35, 0, 105.6, 0));

  return part;
}

/* ===================== external 25 mm GPS patch ====================== */
export function buildPatchAntenna() {
  const part = new THREE.Group();
  part.name = 'gps_patch_antenna_external';

  part.add(slab('patch_adhesive', MAT.plastic, 24, 0.4, 24, 0, 0, 0));
  part.add(slab('patch_ceramic', MAT.ceramic, 25, 3.6, 25, 0, 0.4, 0));
  part.add(slab('patch_copper_plate', MAT.patch, 22.4, 0.16, 22.4, 0, 4.0, 0));
  part.add(cylY('patch_feed_pin', MAT.gold, 0.55, 0.6, -6.4, 4.1, 6.4, 16));

  // u.FL pigtail dropping through the wall to the GPS module
  part.add(cylY('patch_coax', MAT.coax, 1.05, 20, 4.0, -20, -9.5, 14));
  part.add(slab('patch_coax_exit', MAT.plastic, 3.2, 0.5, 2.4, 4.0, -0.5, -9.5));

  return part;
}

/* ========================== indicator LEDs ===========================
   5 mm LEDs in the two Ø5 holes on the top face: the moulded flange sits
   against the inner wall, the dome stands 1 mm proud outside. */
export function buildIndicatorLeds() {
  const part = new THREE.Group();
  part.name = 'indicator_leds';

  for (const [nm, x, mat] of [['yellow', 0, MAT.led_yellow], ['green', -10, MAT.led_green]]) {
    part.add(cylY(`led_${nm}_flange`, mat, 2.9, 1.0, x, -4.0, 0, 26));
    part.add(cylY(`led_${nm}_body`, mat, 2.45, 4.0, x, -3.0, 0, 26));
    part.add(ball(`led_${nm}_dome`, mat, 2.45, x, 1.0, 0));
    // the long bent legs from the reference photo
    for (const sz of [-1, 1]) {
      part.add(slab(`led_${nm}_leg_${sz < 0 ? 'k' : 'a'}`, MAT.nickel,
        0.5, 9, 0.5, x + sz * 1.2, -13.0, 0));
      part.add(slab(`led_${nm}_leg_${sz < 0 ? 'k' : 'a'}_bend`, MAT.nickel,
        0.5, 0.5, 5, x + sz * 1.2, -13.0, -2.7));
    }
  }

  return part;
}

/* ============ reset button: tact switch + blue round cap =============
   Fits the Ø12 hole in the right-hand wall: the shaft fills the hole and the
   Ø14 flange covers it, so the opening is hidden once the cap is on. */
export function buildResetButton() {
  const part = new THREE.Group();
  part.name = 'reset_button';

  // body inside the case, plunger through the wall, cap outside
  part.add(slab('switch_body', MAT.plastic, 6.2, 5.4, 6.2, 0, -12.0, 0));
  part.add(slab('switch_plate', MAT.nickel, 5.8, 0.35, 5.8, 0, -6.6, 0));
  part.add(cylY('switch_plunger', MAT.plastic, 1.75, 3.6, 0, -6.8, 0, 22));
  part.add(cylY('button_cap_shaft', MAT.cap_blue, 5.85, 3.4, 0, -3.2, 0, 36));
  part.add(cylY('button_cap_flange', MAT.cap_blue, 7.0, 1.8, 0, 0, 0, 36));
  part.add(cylY('button_cap_body', MAT.cap_blue, 6.4, 4.4, 0, 1.8, 0, 36, 5.2));
  part.add(ball('button_cap_dome', MAT.cap_blue, 5.2, 0, 6.2, 0));

  // four bent legs
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    part.add(slab(`switch_leg_${sx < 0 ? 'l' : 'r'}${sz < 0 ? 'b' : 't'}`, MAT.nickel,
      0.8, 3.4, 0.5, sx * 3.4, -13.8, sz * 2.3));
  }

  return part;
}
