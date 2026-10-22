// Wiring harness: the red/black pairs from the reference photo.
//   holder  → TP4056 B+ / B−   (inside the battery bay)
//   TP4056 OUT+ / OUT− → J1     (up over the bay divider into the PCB bay)
// Millimetres, in a frame offset to the battery bay so the harness can be
// dropped in at assembly position [0, −55, 0]. It lifts out as one piece.
import * as THREE from 'three';

const MAT = {
  red: new THREE.MeshStandardMaterial({ color: 0xa8271f, roughness: 0.46, metalness: 0.03 }),
  black: new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.5, metalness: 0.03 }),
  shrink: new THREE.MeshStandardMaterial({ color: 0x0f1013, roughness: 0.6, metalness: 0.02 }),
  solder: new THREE.MeshStandardMaterial({ color: 0xb9bcb8, roughness: 0.3, metalness: 0.78 }),
};
MAT.red.name = 'wire_red';
MAT.black.name = 'wire_black';
MAT.shrink.name = 'heatshrink_black';
MAT.solder.name = 'solder_joint';

const R = 0.85;   // 22 AWG with insulation

function wire(name, mat, pts, r = R) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const g = new THREE.TubeGeometry(curve, Math.max(24, pts.length * 10), r, 10, false);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  return m;
}

function blob(name, mat, r, p) {
  const g = new THREE.SphereGeometry(r, 14, 10);
  g.translate(...p);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  return m;
}

function sleeve(name, pts) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const g = new THREE.TubeGeometry(curve, 16, R + 0.35, 10, false);
  const m = new THREE.Mesh(g, MAT.shrink);
  m.name = name;
  return m;
}

export function buildHarness() {
  const part = new THREE.Group();
  part.name = 'wiring_harness';

  // battery holder lugs → charger B+ / B−
  const battPlus = [
    [33.4, 9.9, 0.9], [34.2, 4.0, 5.0], [30.0, -5.0, 11.0],
    [21.0, -12.5, 17.5], [16.4, -15.0, 19.2],
  ];
  const battMinus = [
    [-33.4, 9.9, 0.9], [-32.0, 1.5, 4.5], [-16.0, -7.0, 7.5],
    [4.0, -15.0, 14.5], [16.4, -19.0, 19.2],
  ];
  part.add(wire('wire_batt_plus', MAT.red, battPlus));
  part.add(wire('wire_batt_minus', MAT.black, battMinus));
  part.add(sleeve('sleeve_batt_plus', battPlus.slice(0, 2)));
  part.add(sleeve('sleeve_batt_minus', battMinus.slice(0, 2)));

  // charger OUT+ / OUT− → J1 screw terminal. Once past the bay divider the run
  // has to stay under the PCB lid, whose seat is at z = 15 in assembly space
  // (z = 15 here, since the harness sits at z offset 0), so the crossing is
  // kept at ~12 mm rather than arcing over the wall.
  const outPlus = [
    [16.4, -23.0, 19.2], [11.0, -18.0, 18.0], [3.0, -8.0, 14.0],
    [0.0, 2.0, 11.0], [3.0, 12.0, 10.5], [10.0, 20.0, 9.5], [17.7, 29.5, 7.0],
  ];
  const outMinus = [
    [16.4, -27.0, 19.2], [9.0, -21.0, 17.5], [-1.0, -9.0, 12.5],
    [-4.0, 3.0, 10.5], [-1.0, 13.0, 10.0], [7.0, 21.0, 9.0], [24.7, 29.5, 7.0],
  ];
  part.add(wire('wire_out_plus', MAT.red, outPlus));
  part.add(wire('wire_out_minus', MAT.black, outMinus));

  // solder joints where the pairs land on the charger pads
  for (const [nm, y] of [['batt_plus', -15], ['batt_minus', -19], ['out_plus', -23], ['out_minus', -27]]) {
    part.add(blob(`pad_solder_${nm}`, MAT.solder, 1.15, [16.4, y, 19.2]));
  }

  return part;
}
