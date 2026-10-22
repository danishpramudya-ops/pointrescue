// The PKM carrier board itself: FR-4 substrate with the real copper artwork
// traced out of the project's gerber renders (bottom = blue layer,
// top = red layer), hand-cut outline, drilled pads and mounting holes.
// Millimetres, board plane = XY, z = 0 = bottom copper.
import * as THREE from 'three';

const CU = 0.075;          // copper + tin plating, mm
const EPS = 0.004;
const TH_DEFAULT = 1.6;

export const BOARD_TOP = EPS + 2 * CU + TH_DEFAULT;   // top copper surface, mm

const fr4 = new THREE.MeshStandardMaterial({ color: 0x7f8566, roughness: 0.4, metalness: 0.04 });
fr4.name = 'fr4_substrate';
const cut = new THREE.MeshStandardMaterial({ color: 0xb3ad8d, roughness: 0.8, metalness: 0.02 });
cut.name = 'fr4_cut_edge';
const tin = new THREE.MeshStandardMaterial({ color: 0xf4f6f3, roughness: 0.23, metalness: 0.74 });
tin.name = 'tinned_copper';

function circlePath(x, y, r) {
  const p = new THREE.Path();
  p.absarc(x, y, r, 0, Math.PI * 2, true);
  return p;
}

function rectShape(cx, cy, w, h) {
  const s = new THREE.Shape();
  s.moveTo(cx - w / 2, cy - h / 2);
  s.lineTo(cx + w / 2, cy - h / 2);
  s.lineTo(cx + w / 2, cy + h / 2);
  s.lineTo(cx - w / 2, cy + h / 2);
  s.closePath();
  return s;
}

// round or stadium pad with its drill as a hole
function padShape(p) {
  const s = new THREE.Shape();
  const r = Math.min(p.w, p.h) / 2;
  if (Math.abs(p.w - p.h) < 0.12) {
    s.absarc(p.x, p.y, r, 0, Math.PI * 2, false);
  } else if (p.h > p.w) {
    const dy = (p.h - p.w) / 2;
    s.absarc(p.x, p.y + dy, r, 0, Math.PI, false);
    s.absarc(p.x, p.y - dy, r, Math.PI, Math.PI * 2, false);
  } else {
    const dx = (p.w - p.h) / 2;
    s.absarc(p.x + dx, p.y, r, -Math.PI / 2, Math.PI / 2, false);
    s.absarc(p.x - dx, p.y, r, Math.PI / 2, Math.PI * 1.5, false);
  }
  s.closePath();
  s.holes.push(circlePath(p.x, p.y, p.hr));
  return s;
}

export function buildPcb(D) {
  const TH = D.board.t ?? TH_DEFAULT;
  let seed = 20260717;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

  const drills = D.holes.map(([x, y, r]) => ({ x, y, r: r * 1.06 }));
  const mounts = D.mounts.map(([x, y, r]) => ({ x, y, r: r * 0.9 }));
  const pads = D.pads.map(([x, y, w, h]) => {
    let best = null, bd = Infinity;
    for (const d of drills) {
      const dd = (d.x - x) ** 2 + (d.y - y) ** 2;
      if (dd < bd) { bd = dd; best = d; }
    }
    return { x, y, w, h, hr: bd < 0.6 ? best.r : Math.min(w, h) * 0.3 };
  });

  const BW = D.board.w, BH = D.board.h;
  const pts = [];
  const N = 30, j = 0.075;
  for (let i = 0; i < N; i++) pts.push(new THREE.Vector2(-BW / 2 + (BW * i) / N, -BH / 2 + (rnd() - 0.5) * j));
  for (let i = 0; i < N; i++) pts.push(new THREE.Vector2(BW / 2 + (rnd() - 0.5) * j, -BH / 2 + (BH * i) / N));
  for (let i = 0; i < N; i++) pts.push(new THREE.Vector2(BW / 2 - (BW * i) / N, BH / 2 + (rnd() - 0.5) * j));
  for (let i = 0; i < N; i++) pts.push(new THREE.Vector2(-BW / 2 + (rnd() - 0.5) * j, BH / 2 - (BH * i) / N));
  const outline = new THREE.Shape();
  outline.setFromPoints(pts);
  for (const d of drills) outline.holes.push(circlePath(d.x, d.y, d.r));
  for (const m of mounts) outline.holes.push(circlePath(m.x, m.y, m.r));

  const plate = new THREE.Group();
  plate.name = 'pcb';

  const board = new THREE.Mesh(
    new THREE.ExtrudeGeometry(outline, { depth: TH, bevelEnabled: false, curveSegments: 22 }),
    [fr4, cut]
  );
  board.name = 'fr4_board';
  board.position.z = CU;
  plate.add(board);

  const padGeoSrc = pads.map(padShape);
  const copper = (shapes, base, depth, name) => {
    const m = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: false, curveSegments: 22 }),
      tin
    );
    m.name = name;
    m.position.z = base;
    plate.add(m);
  };
  copper(D.bottom.map((r) => rectShape(r[0], r[1], r[2], r[3])), 0, CU, 'copper_bottom_traces');
  copper(D.top.map((r) => rectShape(r[0], r[1], r[2], r[3])), CU + TH, CU, 'copper_top_traces');
  copper(padGeoSrc, -EPS, CU + EPS, 'copper_bottom_pads');
  copper(padGeoSrc, CU + TH, CU + EPS, 'copper_top_pads');

  plate.position.z = EPS;
  return plate;
}
