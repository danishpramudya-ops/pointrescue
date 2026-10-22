// Shared studio setup for the PCB assembly parts: a small procedural
// environment so metals read as metal, plus balanced key/fill/underside light.
export function setupStudio(stage, THREE) {
  if (!stage._renderer || !stage._scene) return;
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#f2f4f6');
  sky.addColorStop(0.46, '#cdd2d6');
  sky.addColorStop(0.52, '#6d6f70');
  sky.addColorStop(1, '#2a2725');
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 512);
  const box = g.createRadialGradient(300, 130, 10, 300, 130, 190);
  box.addColorStop(0, '#ffffff'); box.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = box; g.fillRect(0, 0, 1024, 400);
  const box2 = g.createRadialGradient(760, 190, 10, 760, 190, 150);
  box2.addColorStop(0, '#e8eef4'); box2.addColorStop(1, 'rgba(232,238,244,0)');
  g.fillStyle = box2; g.fillRect(0, 0, 1024, 400);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(stage._renderer);
  stage._scene.environment = pmrem.fromEquirectangular(tex).texture;
  stage._scene.environmentIntensity = 0.8;
  stage._renderer.toneMapping = THREE.ACESFilmicToneMapping;
  stage._renderer.toneMappingExposure = 0.92;
  stage._scene.traverse((o) => {
    if (o.isHemisphereLight) o.intensity = 0.42;
    if (o.isDirectionalLight) o.intensity = o.castShadow ? 1.05 : 0.55;
  });
  const under = new THREE.DirectionalLight(0xf2f6ff, 1.0);
  under.position.set(-2, -4, 3);
  under.name = 'underside_fill';
  stage._scene.add(under);
}
