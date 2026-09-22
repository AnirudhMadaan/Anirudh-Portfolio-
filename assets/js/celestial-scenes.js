/*
  Cosmic Wire Scenes
  All page scenes intentionally use the same visual language as the homepage:
  connected wire geometry, restrained glow, no textured/shiny planet surfaces.
  Drag to rotate • Wheel/pinch-style wheel to zoom • Touch supported.
*/
(() => {
  const host = document.querySelector('.page-3d-stage');
  if (!host || !window.THREE) return;

  const type = host.dataset.scene || 'constellation';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.display = 'block';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 6.8);
  const root = new THREE.Group();
  scene.add(root);

  const themes = {
    constellation: ['STELLAR MESH • ABOUT', 0x9b8cff],
    orbital: ['ORBITAL GEOMETRY • RESUME', 0x72d7ff],
    atom: ['QUANTUM NODE • SKILLS', 0x62e6d5],
    lunar: ['LUNAR CONSTELLATION • PROJECTS', 0xd7d9e5],
    blackhole: ['EVENT HORIZON • CONTACT', 0xb38cff]
  };
  const [label, accent] = themes[type] || themes.constellation;
  const labelEl = host.querySelector('.scene-label');
  if (labelEl) labelEl.textContent = label;

  const lineMat = (color = accent, opacity = 0.72, width = 1) =>
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, linewidth: width });
  const pointMat = (color = 0xe9edff, size = 0.035, opacity = 0.9) =>
    new THREE.PointsMaterial({ color, size, transparent: true, opacity, depthWrite: false, sizeAttenuation: true });

  function addGlow(color, scale = 3.7, opacity = 0.24) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    const hex = '#' + color.toString(16).padStart(6, '0');
    g.addColorStop(0, hex + 'aa');
    g.addColorStop(.35, hex + '38');
    g.addColorStop(1, hex + '00');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity, depthWrite: false }));
    sprite.scale.set(scale, scale, 1);
    root.add(sprite);
  }

  function addStars(count = 500, spread = 18) {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - .5) * spread;
      p[i * 3 + 1] = (Math.random() - .5) * spread * .65;
      p[i * 3 + 2] = (Math.random() - .5) * spread;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    scene.add(new THREE.Points(g, pointMat(0xbfc8e8, .016, .42)));
  }

  function addWireSphere(radius = 1.45, detail = 2, color = accent) {
    const geo = new THREE.IcosahedronGeometry(radius, detail);
    const lines = new THREE.LineSegments(new THREE.WireframeGeometry(geo), lineMat(color, .72));
    root.add(lines);
    geo.dispose();
    return lines;
  }

  function addLongitudeLatitude(radius = 1.47, color = accent) {
    const group = new THREE.Group();
    for (let i = -5; i <= 5; i++) {
      const lat = (i / 6) * Math.PI / 2;
      const r = radius * Math.cos(lat);
      const y = radius * Math.sin(lat);
      const pts = [];
      for (let s = 0; s <= 96; s++) {
        const a = s / 96 * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(color, i === 0 ? .5 : .25)));
    }
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      const pts = [];
      for (let s = 0; s <= 48; s++) {
        const t = s / 48 * Math.PI - Math.PI / 2;
        pts.push(new THREE.Vector3(Math.cos(t) * Math.cos(a) * radius, Math.sin(t) * radius, Math.cos(t) * Math.sin(a) * radius));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(color, .27)));
    }
    root.add(group);
  }

  function addConstellation(count = 28, radius = 1.9, color = accent, seed = 1) {
    const points = [];
    for (let i = 0; i < count; i++) {
      const a = (i * 2.399 + seed) % (Math.PI * 2);
      const z = Math.sin(i * 1.73 + seed) * .72;
      const rr = radius * (.72 + ((i * 37) % 100) / 250);
      const rxy = Math.sqrt(1 - z * z);
      points.push(new THREE.Vector3(Math.cos(a) * rxy * rr, z * rr, Math.sin(a) * rxy * rr));
    }
    const group = new THREE.Group();
    const pg = new THREE.BufferGeometry().setFromPoints(points);
    group.add(new THREE.Points(pg, pointMat(0xf0f3ff, .045, .95)));
    for (let i = 0; i < points.length - 1; i++) {
      if (i % 3 !== 1) group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([points[i], points[i + 1]]), lineMat(color, .36)));
    }
    // A few intentional long constellation links.
    [[0, 7], [4, 16], [9, 22], [13, 25]].forEach(([a, b]) => {
      if (points[a] && points[b]) group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([points[a], points[b]]), lineMat(color, .26)));
    });
    root.add(group);
  }

  function addOrbit(radius, tilt = 0, color = accent, opacity = .42) {
    const ring = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(Array.from({ length: 129 }, (_, i) => {
        const a = i / 128 * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      })),
      lineMat(color, opacity)
    );
    ring.rotation.x = tilt;
    root.add(ring);
    return ring;
  }

  function addOrbitNodes(radius, count, color = accent, speed = .35, tilt = 0) {
    const orbit = new THREE.Group(); orbit.rotation.x = tilt;
    const nodeGroup = new THREE.Group();
    for (let i = 0; i < count; i++) {
      const node = new THREE.Mesh(new THREE.OctahedronGeometry(.09, 0), new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: .9 }));
      const a = i / count * Math.PI * 2;
      node.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      nodeGroup.add(node);
    }
    orbit.add(nodeGroup); root.add(orbit); orbit.userData.speed = speed; return orbit;
  }

  addStars(type === 'blackhole' ? 650 : 430);

  if (type === 'constellation') {
    addGlow(accent, 4.1, .2);
    addWireSphere(1.38, 2);
    addLongitudeLatitude(1.42);
    addConstellation(32, 2.0, accent, 2);
    addOrbit(2.15, Math.PI / 2.7, accent, .28);
  }

  if (type === 'orbital') {
    addGlow(accent, 4.3, .18);
    const core = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.DodecahedronGeometry(1.12, 0)), lineMat(accent, .8));
    root.add(core);
    [1.65, 2.05, 2.45].forEach((r, i) => addOrbit(r, Math.PI / 3 + i * .22, i === 1 ? 0xc7f3ff : accent, .34));
    addOrbitNodes(2.05, 5, 0xeef4ff, .28, Math.PI / 3 + .22);
    addConstellation(18, 2.65, accent, 7);
  }

  if (type === 'atom') {
    addGlow(accent, 4.0, .17);
    const nucleus = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(.58, 1)), lineMat(accent, .85));
    root.add(nucleus);
    const colors = [accent, 0x8e9cff, 0xd8fff8];
    [0, 1, 2].forEach(i => addOrbit(1.55 + i * .25, i * Math.PI / 3, colors[i], .48));
    addConstellation(20, 2.25, accent, 13);
  }

  if (type === 'lunar') {
    addGlow(0xbfc7dd, 4.0, .15);
    addWireSphere(1.38, 2, 0xd5d9e8);
    addLongitudeLatitude(1.41, 0x9ca5bd);
    // Wire crater rings, deliberately sparse and stable.
    [[.42, .25, .35], [-.38, .4, .24], [.15, -.52, .18], [-.55, -.28, .14]].forEach(([x, y, r]) => {
      const c = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 25 }, (_, i) => {
        const a = i / 24 * Math.PI * 2;
        return new THREE.Vector3(x + Math.cos(a) * r, y + Math.sin(a) * r, 1.33);
      })), lineMat(0xe6e8f2, .34));
      c.rotation.y = -.15; root.add(c);
    });
    addOrbit(2.05, Math.PI / 2.4, 0xdde4ff, .32);
    addConstellation(24, 2.15, 0xc8d0e8, 21);
  }

  if (type === 'blackhole') {
    addGlow(accent, 4.8, .22);
    const core = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(.82, 2)), lineMat(0x0b0b13, .95));
    root.add(core);
    [1.05, 1.32, 1.62, 1.95, 2.28].forEach((r, i) => addOrbit(r, Math.PI / 2.05 + i * .015, i < 2 ? 0xf0b1ff : accent, .22 + i * .035));
    addConstellation(34, 2.55, accent, 31);
    const photon = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 97 }, (_, i) => {
      const a = i / 96 * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * 1.02, Math.sin(a) * .33, Math.sin(a) * 1.02);
    })), lineMat(0xffd58a, .75));
    root.add(photon);
  }

  // Robust pointer interaction: pointer capture keeps rotation working even
  // when the cursor leaves the canvas while dragging.
  let dragging = false, lastX = 0, lastY = 0, targetRX = 0, targetRY = 0, zoom = 6.8;
  host.style.pointerEvents = 'auto';
  host.addEventListener('pointerdown', e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    try { host.setPointerCapture(e.pointerId); } catch (_) {}
  });
  host.addEventListener('pointermove', e => {
    if (!dragging) return;
    targetRY += (e.clientX - lastX) * .009;
    targetRX += (e.clientY - lastY) * .006;
    targetRX = Math.max(-1.25, Math.min(1.25, targetRX));
    lastX = e.clientX; lastY = e.clientY;
  });
  const endDrag = e => {
    dragging = false;
    try { host.releasePointerCapture?.(e.pointerId); } catch (_) {}
  };
  host.addEventListener('pointerup', endDrag);
  host.addEventListener('pointercancel', endDrag);
  host.addEventListener('wheel', e => {
    e.preventDefault();
    zoom = Math.max(4.7, Math.min(9.2, zoom + e.deltaY * .004));
  }, { passive: false });

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  let raf;
  const clock = new THREE.Clock();
  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (!dragging && !reduced) targetRY += type === 'blackhole' ? .00065 : .00035;
    root.rotation.y += (targetRY - root.rotation.y) * .075;
    root.rotation.x += (targetRX - root.rotation.x) * .075;
    camera.position.z += (zoom - camera.position.z) * .08;
    root.children.forEach(o => {
      if (o.userData && o.userData.speed) o.rotation.y = t * o.userData.speed;
    });
    renderer.render(scene, camera);
  }
  animate();
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else animate(); });
})();
