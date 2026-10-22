// POINTRESCUE casing — the user's own Fusion 360 export (CASINGPART1FIX.obj).
// The OBJ carries three solids nested side by side on a print plate:
//   casefix1    main case body        84 × 145 × 35 mm
//   tutup2      PCB cover             67 × 91 × 5 mm
//   tutupbatre  battery cover         84 × 47 × 16 mm
// Source units are cm, so everything is scaled ×10 into the mm space the rest
// of the assembly uses. The plate layout keeps each lid on the same Y as its
// pocket and exactly 110 mm to the right, so undoing that X offset drops the
// lids straight onto the body.
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const MM = 10;                 // cm → mm
const LID_DX = -110;           // print-plate offset back onto the body
const PCB_COVER_DY = -20;      // the PCB lid is nested 20 mm off its opening

// Measured off the mesh, in raw (mm) case coordinates:
//   z = 3   interior floor          z = 5   60 mm-wide ledge the PCB rests on
//   z = 20  67 × 91 mm cover opening (PCB lid flange)
//   z = 35  top rim (battery lid sits flush)
const POCKET = { cx: 217, cy: -139.5, boardZ: 5 };

const bodyMat = new THREE.MeshStandardMaterial({ color: 0x33363a, roughness: 0.74, metalness: 0.04 });
bodyMat.name = 'printed_pla_body';
const lidMat = new THREE.MeshStandardMaterial({ color: 0x3d4146, roughness: 0.7, metalness: 0.04 });
lidMat.name = 'printed_pla_lid';

export const CASING_MATERIALS = [bodyMat, lidMat];

// Assembled heights, from the mesh: the PCB lid's flange lands on the 20 mm
// ledge (its own flange face sits 2 mm up its body), the battery lid closes
// flush with the 35 mm top rim.
export const CASING_FIT = { pcbCoverZ: 18, batteryCoverZ: 19 };

// Footprint centres in assembly space (x, y) — used for the explode guides.
export const CASING_CENTRES = {
  body: [0, -17.5],
  pcbCover: [0, -5.5],
  batteryCover: [0, -66.5],
};

function centreOnPocket(obj, { dx = 0, dy = 0, dz = 0 } = {}) {
  obj.position.set(-POCKET.cx + dx, -POCKET.cy + dy, -POCKET.boardZ + dz);
}

export async function loadCasing(url = './assets/casing.obj') {
  const root = await new OBJLoader().loadAsync(url);

  const pick = (name) => {
    const src = root.children.find((c) => c.name === name);
    if (!src) throw new Error(`casing group "${name}" missing from ${url}`);
    return src;
  };

  const wrap = (name, mat, meshName, opts) => {
    const src = pick(name);
    const geo = src.geometry.clone();
    geo.scale(MM, MM, MM);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = meshName;
    const group = new THREE.Group();
    group.name = `${meshName}_part`;
    group.add(mesh);
    centreOnPocket(mesh, opts);
    return group;
  };

  return {
    body: wrap('casefix1', bodyMat, 'case_body'),
    pcbCover: wrap('tutup2', lidMat, 'pcb_cover',
      { dx: LID_DX, dy: PCB_COVER_DY, dz: CASING_FIT.pcbCoverZ }),
    batteryCover: wrap('tutupbatre', lidMat, 'battery_cover',
      { dx: LID_DX, dz: CASING_FIT.batteryCoverZ }),
  };
}
