// Homepage story: Three.js hero (≤8 meshes, canvas textures only) + GSAP
// ScrollTrigger chapters. Progressive enhancement: without this module the
// page is a complete plain-DOM document; with it, the story takes over.
// Reduced-motion / no-WebGL / weak devices get the static hero image instead.

const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const weakDevice =
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
  (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
  innerWidth < 700;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function staticFallback() {
  document.body.classList.add('static-hero');
}

if (prefersReduced || weakDevice || !hasWebGL()) {
  staticFallback();
} else {
  // Lazy-init after first paint so LCP (the DOM headline) lands first.
  requestAnimationFrame(() => requestAnimationFrame(() => init().catch(staticFallback)));
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ---------------------------------------------------------------- textures

function sheetTexture(THREE, variant) {
  const W = 512;
  const H = 724;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, W, H);

  const ink = '#11233f';
  const line = '#d9dde5';
  const accent = variant.accent || ink;

  if (variant.band) {
    x.fillStyle = accent;
    x.fillRect(0, 0, W, 86);
    x.fillStyle = 'rgba(255,255,255,.92)';
    x.fillRect(36, 30, 150, 16);
    x.fillRect(36, 54, 90, 9);
  } else {
    x.fillStyle = ink;
    x.fillRect(36, 36, 140, 16);
    x.fillStyle = '#9aa3b2';
    x.fillRect(36, 62, 90, 8);
    if (variant.gold) {
      x.fillStyle = '#c8a24b';
      x.fillRect(36, 104, W - 72, 2);
    }
    x.fillStyle = accent;
    x.font = '700 34px Georgia, serif';
    x.textAlign = 'right';
    x.fillText(variant.title || 'INVOICE', W - 38, 64);
  }

  // bill-to block
  x.fillStyle = '#9aa3b2';
  x.fillRect(36, 140, 56, 8);
  x.fillStyle = ink;
  x.fillRect(36, 158, 120, 11);
  x.fillStyle = line;
  x.fillRect(36, 178, 150, 8);
  x.fillRect(36, 192, 130, 8);

  // table
  const top = 240;
  x.fillStyle = variant.band ? accent : ink;
  x.globalAlpha = variant.band ? 1 : 0.9;
  x.fillRect(36, top, W - 72, 26);
  x.globalAlpha = 1;
  for (let i = 0; i < 6; i++) {
    const y = top + 48 + i * 42;
    x.fillStyle = i % 2 && variant.zebra ? '#f4f2ec' : '#ffffff';
    x.fillRect(36, y - 14, W - 72, 34);
    x.fillStyle = '#3c4a62';
    x.fillRect(48, y, 170 - (i % 3) * 30, 9);
    x.fillStyle = '#6b7689';
    x.fillRect(W - 110, y, 62, 9);
    x.fillStyle = line;
    x.fillRect(36, y + 19, W - 72, 1);
  }

  // totals
  x.fillStyle = '#6b7689';
  x.fillRect(W - 220, 560, 70, 9);
  x.fillRect(W - 220, 584, 70, 9);
  x.fillStyle = accent;
  x.fillRect(W - 230, 610, 194, 30);
  x.fillStyle = '#ffffff';
  x.fillRect(W - 220, 620, 60, 10);
  x.fillRect(W - 112, 620, 66, 10);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function sealTexture(THREE) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  x.translate(S / 2, S / 2);
  x.rotate(-0.22);
  x.strokeStyle = '#0e6b4f';
  x.lineWidth = 10;
  x.beginPath();
  x.arc(0, 0, 104, 0, Math.PI * 2);
  x.stroke();
  x.lineWidth = 3;
  x.beginPath();
  x.arc(0, 0, 86, 0, Math.PI * 2);
  x.stroke();
  x.fillStyle = '#0e6b4f';
  x.font = '800 64px Helvetica, Arial, sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText('PAID', 0, 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function qrTexture(THREE) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, S, S);
  x.fillStyle = '#11233f';
  const cell = S / 21;
  // deterministic pseudo-QR
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let r = 2; r < 19; r++) {
    for (let q = 2; q < 19; q++) {
      if (rnd() > 0.52) x.fillRect(q * cell, r * cell, cell - 1, cell - 1);
    }
  }
  // finder squares
  for (const [fx, fy] of [[2, 2], [14, 2], [2, 14]]) {
    x.fillStyle = '#11233f';
    x.fillRect(fx * cell, fy * cell, cell * 5, cell * 5);
    x.fillStyle = '#fff';
    x.fillRect((fx + 1) * cell, (fy + 1) * cell, cell * 3, cell * 3);
    x.fillStyle = '#11233f';
    x.fillRect((fx + 2) * cell, (fy + 2) * cell, cell, cell);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------- scene

async function init() {
  const THREE = await import('/vendor/three/three.module.min.js');
  await loadScript('/vendor/gsap/gsap.min.js');
  await loadScript('/vendor/gsap/ScrollTrigger.min.js');
  const { gsap } = window;
  gsap.registerPlugin(window.ScrollTrigger);

  document.body.classList.add('js-story');

  const canvas = document.getElementById('hero-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 50);
  camera.position.set(0, 0, 7);

  scene.add(new THREE.AmbientLight(0xfff6e8, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc8d4ee, 0.5);
  fill.position.set(-4, -2, 4);
  scene.add(fill);

  const sheetGeo = new THREE.PlaneGeometry(2, 2.83);
  const variants = [
    { gold: true, title: 'INVOICE' },                      // classic serif
    { band: true, accent: '#11233f', zebra: true },        // modern grid
    { title: 'INVOICE', accent: '#6b7689' },               // minimal
    { band: true, accent: '#0e6b4f' },                     // bold emerald
    { gold: true, title: 'TAX INVOICE', zebra: true },     // gst
  ];
  const textures = variants.map((v) => sheetTexture(THREE, v));

  const main = new THREE.Mesh(
    sheetGeo,
    new THREE.MeshStandardMaterial({ map: textures[0], roughness: 0.85, metalness: 0 })
  );
  main.position.set(2.45, -0.2, 0);
  main.rotation.set(-0.05, -0.3, 0.03);
  scene.add(main);

  const others = [];
  const placements = [
    { p: [-5.0, 1.7, -4.4], r: [0.05, 0.4, -0.08], t: 1 },
    { p: [4.8, 1.7, -4.2], r: [-0.1, -0.5, 0.1], t: 2 },
    { p: [-4.6, -2.3, -5.8], r: [0.18, 0.3, 0.05], t: 3 },
    { p: [5.4, -1.5, -6.2], r: [0, -0.6, -0.06], t: 4 },
  ];
  for (const pl of placements) {
    const m = new THREE.Mesh(
      sheetGeo,
      new THREE.MeshStandardMaterial({ map: textures[pl.t], roughness: 0.9 })
    );
    m.position.set(...pl.p);
    m.rotation.set(...pl.r);
    scene.add(m);
    others.push(m);
  }

  // PAID seal (mesh 6)
  const seal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.9),
    new THREE.MeshBasicMaterial({ map: sealTexture(THREE), transparent: true, opacity: 0 })
  );
  seal.position.set(2.85, 0.5, 0.18);
  seal.rotation.copy(main.rotation);
  scene.add(seal);

  // QR (mesh 7)
  const qr = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.62),
    new THREE.MeshBasicMaterial({ map: qrTexture(THREE), transparent: true, opacity: 0 })
  );
  qr.position.set(2.1, -1.05, 0.1);
  qr.rotation.copy(main.rotation);
  scene.add(qr);

  // ---------------- mouse parallax (lerped) ----------------
  const target = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    target.x = (e.clientX / innerWidth - 0.5) * 0.35;
    target.y = (e.clientY / innerHeight - 0.5) * 0.22;
  }, { passive: true });

  const baseCam = { x: 0, y: 0 };
  let running = true;
  function tick() {
    if (!running) return;
    baseCam.x += (target.x - baseCam.x) * 0.045;
    baseCam.y += (target.y - baseCam.y) * 0.045;
    camera.position.x = camPath.x + baseCam.x;
    camera.position.y = camPath.y - baseCam.y;
    camera.position.z = camPath.z;
    camera.lookAt(look.x, look.y, look.z);
    const t = performance.now() / 1000;
    others.forEach((m, i) => {
      m.position.y = placements[i].p[1] + Math.sin(t * 0.5 + i * 1.7) * 0.06;
      m.rotation.z = placements[i].r[2] + Math.sin(t * 0.35 + i) * 0.02;
    });
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) tick();
  });
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // ---------------- scroll story ----------------
  const camPath = { x: 0, y: 0, z: 7 };
  const look = { x: 0, y: 0, z: 0 };

  // PAID seal stamps on first scroll
  let stamped = false;
  window.ScrollTrigger.create({
    trigger: '#ch2',
    start: 'top 95%',
    onEnter: () => {
      if (stamped) return;
      stamped = true;
      gsap.fromTo(seal.material, { opacity: 0 }, { opacity: 0.96, duration: 0.32, ease: 'power3.in' });
      gsap.fromTo(seal.scale, { x: 2.4, y: 2.4 }, { x: 1, y: 1, duration: 0.32, ease: 'power3.in' });
    },
  });

  // CH2: push through the scene while paywall labels dissolve (DOM)
  gsap.timeline({
    scrollTrigger: { trigger: '#ch2', start: 'top bottom', end: 'bottom top', scrub: 1 },
  })
    .to(camPath, { z: 3.4, x: -0.4, ease: 'none' }, 0)
    .to(look, { x: -0.5, ease: 'none' }, 0);

  for (const [i, gate] of [...document.querySelectorAll('.gate')].entries()) {
    gsap.fromTo(gate,
      { opacity: 0, y: 80 },
      {
        opacity: 1, y: -60,
        scrollTrigger: { trigger: '#ch2', start: `${10 + i * 16}% bottom`, end: `${45 + i * 16}% top`, scrub: 1 },
      });
    gsap.to(gate, {
      opacity: 0, y: -160, filter: 'blur(3px)',
      scrollTrigger: { trigger: '#ch2', start: `${45 + i * 16}% bottom`, end: `${75 + i * 16}% top`, scrub: 1 },
    });
  }

  // CH3: sheet rotates to camera and crossfades through templates
  gsap.timeline({
    scrollTrigger: { trigger: '#ch3', start: 'top bottom', end: 'bottom top', scrub: 1 },
  })
    .to(camPath, { x: 2.45, z: 4.3, ease: 'none' }, 0)
    .to(look, { x: 2.45, y: -0.2, ease: 'none' }, 0)
    .to(main.rotation, { x: 0, y: 0, z: 0, ease: 'none' }, 0)
    .to(seal.material, { opacity: 0, ease: 'none' }, 0)
    .to(seal.rotation, { x: 0, y: 0, z: 0, ease: 'none' }, 0);

  const tplCards = [...document.querySelectorAll('.tpl-card')];
  let activeTex = 0;
  window.ScrollTrigger.create({
    trigger: '#ch3',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
    onUpdate: (self) => {
      const idx = Math.min(textures.length - 1, Math.floor(self.progress * textures.length));
      if (idx !== activeTex) {
        activeTex = idx;
        main.material.map = textures[idx];
        main.material.needsUpdate = true;
        gsap.fromTo(main.material, { opacity: 0.55 }, { opacity: 1, duration: 0.3 });
        main.material.transparent = true;
      }
      tplCards.forEach((c, i) => c.classList.toggle('active', i === idx));
    },
  });

  // CH4: the QR materializes
  gsap.timeline({
    scrollTrigger: { trigger: '#ch4', start: 'top bottom', end: 'center center', scrub: 1 },
  })
    .to(camPath, { x: 2.2, y: -0.6, z: 2.9, ease: 'none' }, 0)
    .to(look, { x: 2.2, y: -0.9, ease: 'none' }, 0)
    .to(qr.rotation, { x: 0, y: 0, z: 0, ease: 'none' }, 0)
    .to(qr.material, { opacity: 1, ease: 'none' }, 0.3);

  // Story end: scene settles and fades; normal DOM takes over
  gsap.to('#hero-canvas', {
    opacity: 0,
    scrollTrigger: { trigger: '#story-end', start: 'top 90%', end: 'top 35%', scrub: 1 },
  });

  // Hero text gentle exit
  gsap.to('.hero-copy', {
    opacity: 0, y: -60,
    scrollTrigger: { trigger: '#ch2', start: 'top bottom', end: 'top 45%', scrub: 1 },
  });

  tick();
}
