/* ─────────────────────────────────────────
   INTERACTIVE 3D STARFIELD (Three.js)
   Mounts into .stars. Falls back to nothing
   (the flat --clr-bg still reads fine) if
   Three.js failed to load — e.g. offline.
───────────────────────────────────────── */
(function initStarfield() {
  const container = document.querySelector('.stars');
  if (!container || typeof THREE === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 6;

  /* Two depth layers of points for a subtle parallax feel */
  function makeLayer(count, spread, size, color, opacity) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geo, mat);
  }

  const farStars  = makeLayer(1100, 40, 0.028, 0xffffff, 0.75);
  const nearStars = makeLayer(220, 26, 0.05, 0xc084fc, 0.85);
  scene.add(farStars, nearStars);

  let targetX = 0, targetY = 0;
  let mouseX = 0, mouseY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let raf;
  function animate() {
    raf = requestAnimationFrame(animate);

    if (!prefersReducedMotion) {
      farStars.rotation.y += 0.00016;
      nearStars.rotation.y += 0.00034;
      farStars.rotation.x += 0.00004;
    }

    targetX += (mouseX - targetX) * 0.03;
    targetY += (mouseY - targetY) * 0.03;
    camera.position.x = targetX * 0.5;
    camera.position.y = -targetY * 0.35;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  /* Pause rendering off-screen tabs to save battery */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      animate();
    }
  });

  animate();
})();
