// Clean embed view — the same assembly, no UI. Everything is driven by URL
// params so one file covers video capture, slides, and a website embed.
//
//   ?explode=0..1      static explode amount            (default: loop)
//   ?explode=loop      collapse ⇄ explode, forever
//   ?spin=0|1          turntable                        (default 1)
//   ?spinspeed=1.2     turntable speed
//   ?view=iso|front|side|top|hero    camera direction    (default iso)
//   ?zoom=1            distance multiplier (>1 = further away)
//   ?pad=0.92          framing margin (1.0 = fit bounding sphere exactly)
//   ?bg=#22201e|none   background; none = transparent PNG-ready
//   ?shadow=0|1        ground shadow (default: off when bg is transparent)
//   ?ghost=0|1         translucent casing               (default 0)
//   ?guides=0|1        dashed explode guide lines       (default 1)
//   ?orbit=0|1         allow mouse orbit/zoom           (default 1)
//   ?export=1          bring back the OBJ / GLB download buttons
import * as THREE from 'three';
import { setupStudio } from './studio.js';
import { buildAssembly, makeFramer, clamp01 } from './assembly-model.js';

const q = new URLSearchParams(location.search);
const num = (k, d) => { const v = parseFloat(q.get(k)); return Number.isFinite(v) ? v : d; };
const flag = (k, d) => (q.has(k) ? !['0', 'false', 'off', 'no'].includes(q.get(k)) : d);

const VIEWS = {
  iso:   [0.62, 0.5, 1],
  hero:  [1.0, 0.34, 0.72],
  front: [0, 0.12, 1],
  side:  [1, 0.12, 0.02],
  top:   [0.01, 1, 0.02],
};
const viewDir = VIEWS[q.get('view')] ?? VIEWS.iso;

const stage = document.querySelector('three-d-stage');
await stage.ready;
stage.shadowRoot.querySelector('.note')?.remove();
if (!flag('export', false)) stage.shadowRoot.querySelector('.toolbar')?.remove();
setupStudio(stage, THREE);

if (!flag('orbit', true)) {
  stage._controls.enabled = false;
  stage.style.pointerEvents = 'none';
}

const D = JSON.parse(document.getElementById('pcb-data').textContent);// a contact shadow on transparency reads as grey mush, so drop it by default
const bgParam = (q.get('bg') ?? '').toLowerCase();
const clearBg = ['none', 'transparent', 'alpha', '0'].includes(bgParam);
if (stage._ground) stage._ground.visible = flag('shadow', !clearBg);

const { model, setExplode, setGhost } = await buildAssembly(D, { guides: flag('guides', true) });
setGhost(flag('ghost', false));

stage.setObject(model);
const framer = makeFramer(stage, model, { pad: num('pad', 1.0) });
framer.measure(setExplode, viewDir);

// seed the orbit direction from ?view before the first frame is drawn
addEventListener('resize', () => { framer.remeasure(); frame(lastU); });

const seed = new THREE.Vector3(...viewDir).normalize();
stage._camera.position.copy(stage._controls.target).add(seed.multiplyScalar(framer.closed.dist));
stage._controls.update();

const ZOOM = num('zoom', 1);
let lastU = 0;
function frame(u) {
  lastU = u;
  framer.apply(u, viewDir);
  if (ZOOM !== 1) {
    const cam = stage._camera, ctr = stage._controls;
    cam.position.sub(ctr.target).multiplyScalar(ZOOM).add(ctr.target);
    ctr.update();
  }
}

const spin = flag('spin', true);
stage._controls.autoRotate = spin;
stage._controls.autoRotateSpeed = num('spinspeed', 1.2);
// the stage kills autorotate on the first pointer-down; for an embed the
// turntable is the point, so keep it running
if (spin) stage._controls.addEventListener('end', () => { stage._controls.autoRotate = true; });

/* ---- explode timing: same envelope as the baked GLB clip ---- */
const HOLD_IN = 0.4, RAMP = 3.2, HOLD_MID = 0.9, HOLD_OUT = 0.4;
const CLIP = HOLD_IN + RAMP + HOLD_MID + RAMP + HOLD_OUT;
const uAtTime = (t) => {
  if (t <= HOLD_IN) return 0;
  if (t <= HOLD_IN + RAMP) return (t - HOLD_IN) / RAMP;
  if (t <= HOLD_IN + RAMP + HOLD_MID) return 1;
  if (t <= HOLD_IN + RAMP + HOLD_MID + RAMP) return 1 - (t - HOLD_IN - RAMP - HOLD_MID) / RAMP;
  return 0;
};

const raw = (q.get('explode') ?? 'loop').toLowerCase();
const looping = raw === 'loop' || raw === 'auto' || raw === '1loop';
const fixedU = clamp01(num('explode', 1));

if (looping) {
  const t0 = performance.now();
  (function tick(now) {
    const t = ((now - t0) / 1000) % CLIP;
    const u = uAtTime(t);
    setExplode(u);
    frame(u);
    requestAnimationFrame(tick);
  })(t0);
} else {
  setExplode(fixedU);
  frame(fixedU);
}

// small hook so a capture script or a slide can drive it: window.setExplode(0.5)
window.pointrescue = { setExplode: (u) => { setExplode(clamp01(u)); frame(clamp01(u)); }, model };
