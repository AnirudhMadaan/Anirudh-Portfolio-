/* ─────────────────────────────────────────
   INTERACTIVE 3D CELESTIAL OBJECT
   A glowing wireframe planet with a tilted
   ring and an orbiting particle belt, mounted
   into .hero-3d-stage on the homepage only.
   Tilts toward the pointer; drag to spin.
───────────────────────────────────────── */
(function initHeroPlanet() {
  const container = document.querySelector('.hero-3d-stage');
  if (!container || typeof THREE === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width  = container.clientWidth;
  let height = container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  const group = new THREE.Group();
  group.rotation.x = 0.35;
  scene.add(group);

  /* Wireframe core */
  const coreGeo = new THREE.IcosahedronGeometry(1.5, 2);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x7c5cfc,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  /* Soft inner glow — additive sprite behind the wireframe */
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 256;
  const gctx = glowCanvas.getContext('2d');
  const grad = gctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(192,132,252,0.9)');
  grad.addColorStop(0.4, 'rgba(124,92,252,0.35)');
  grad.addColorStop(1, 'rgba(124,92,252,0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 256, 256);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(4.2, 4.2, 1);
  group.add(glow);

  /* Tilted ring */
  const ringGeo = new THREE.TorusGeometry(2.35, 0.012, 8, 128);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.55 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.3;
  group.add(ring);

  /* Orbiting particle belt */
  const beltCount = 260;
  const beltPositions = new Float32Array(beltCount * 3);
  for (let i = 0; i < beltCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2.2 + (Math.random() - 0.5) * 0.35;
    beltPositions[i * 3]     = Math.cos(angle) * radius;
    beltPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
    beltPositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const beltGeo = new THREE.BufferGeometry();
  beltGeo.setAttribute('position', new THREE.BufferAttribute(beltPositions, 3));
  const beltMat = new THREE.PointsMaterial({
    color: 0xe2e2f0,
    size: 0.035,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const belt = new THREE.Points(beltGeo, beltMat);
  belt.rotation.x = Math.PI / 2.3;
  group.add(belt);

  /* Pointer interaction: tilt toward cursor, drag to spin */
  let targetRotX = group.rotation.x;
  let targetRotY = 0;
  let isDragging = false;
  let lastPointerX = 0;
  let dragRotY = 0;

  function onPointerMove(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((clientY - rect.top) / rect.height - 0.5) * 2;
    targetRotY = dragRotY + nx * 0.5;
    targetRotX = 0.35 - ny * 0.25;
  }

  window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY), { passive: true });

  container.style.pointerEvents = 'auto';
  container.addEventListener('mousedown', (e) => { isDragging = true; lastPointerX = e.clientX; });
  window.addEventListener('mouseup', () => { isDragging = false; dragRotY = targetRotY; });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const delta = (e.clientX - lastPointerX) * 0.01;
    targetRotY += delta;
    dragRotY += delta;
    lastPointerX = e.clientX;
  });

  container.addEventListener('touchstart', (e) => {
    if (e.touches[0]) { isDragging = true; lastPointerX = e.touches[0].clientX; }
  }, { passive: true });
  container.addEventListener('touchmove', (e) => {
    if (e.touches[0]) {
      onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      const delta = (e.touches[0].clientX - lastPointerX) * 0.01;
      dragRotY += delta;
      lastPointerX = e.touches[0].clientX;
    }
  }, { passive: true });
  container.addEventListener('touchend', () => { isDragging = false; });

  function onResize() {
    width  = container.clientWidth;
    height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);

  let raf;
  function animate() {
    raf = requestAnimationFrame(animate);

    if (!prefersReducedMotion) {
      core.rotation.y += 0.0016;
      belt.rotation.y += 0.0009;
    }

    group.rotation.x += (targetRotX - group.rotation.x) * 0.05;
    group.rotation.y += (targetRotY - group.rotation.y) * 0.05;

    renderer.render(scene, camera);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else animate();
  });

  animate();
})();
