import * as THREE from 'three';
import { setupStudio } from './studio.js';
import { buildPcb } from './parts/pcb.js';

const stage = document.querySelector('three-d-stage');
await stage.ready;
stage.shadowRoot.querySelector('.note')?.remove();
setupStudio(stage, THREE);

const D = JSON.parse(document.getElementById('pcb-data').textContent);

const model = new THREE.Group();
model.name = 'pcb_double_sided';
model.add(buildPcb(D));
model.rotation.x = -Math.PI / 2;
model.scale.setScalar(0.001);
stage.setObject(model);
