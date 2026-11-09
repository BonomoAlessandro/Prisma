// Bretter für den Skizzenkatalog (Ticket 03), zur Laufzeit im festen Stand: nichts davon gehört nach index.html.
window.__katalog = (() => {
  const D = __prismaDebug, T = THREE;
  const PLATE = 9.8, BOARD = 8.4, CELL = 1.2, THICK = 0.38, HP = PLATE / 2, HB = BOARD / 2;
  let floorTop, plateSides;
  D.scene.traverse((o) => {
    if (o.isMesh && o.material === D.floorMaterial) floorTop = o;
    const p = o.geometry?.parameters;
    if (o.isMesh && p && Math.abs(p.width - PLATE) < 1e-6 && Math.abs(p.height - THICK) < 1e-6) plateSides = o;
  });
  const plateTrim = D.scene.children.find((o) => o.isGroup && o.children.length === 4
    && o.children.every((c) => c.isMesh && c.material?.metalness === 1));
  const shockU = D.floorMaterial.userData.shader.uniforms;
  const shock = { uShock: shockU.uShock, uShockColor: shockU.uShockColor };
  const aniso = Math.min(8, D.renderer.capabilities.getMaxAnisotropy());

  // HUD aus (nur die Szene im Bild)
  const style = document.createElement('style');
  style.textContent = 'body > *:not(canvas):not(script):not(style) { visibility: hidden !important; }';
  document.head.appendChild(style);

  /* ---------- Zufall und Rauschen ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function hash(x, y, s) {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function noise(x, y, s = 0) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, oct = 5, s = 0) {
    let sum = 0, amp = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { sum += amp * noise(x * f, y * f, s + i * 17); n += amp; amp *= 0.5; f *= 2.03; }
    return sum / n;
  }
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const mix3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
  const hex = (h) => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];

  /* ---------- Texturen ---------- */
  function tex(canvas, srgb = true, repeat = false) {
    const t = new T.CanvasTexture(canvas);
    t.encoding = srgb ? T.sRGBEncoding : T.LinearEncoding;
    t.anisotropy = aniso;
    if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
    return t;
  }
  function canvas(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /**
   * Oberfläche über die ganze Platte (Welt x, z; Zeile 0 = z −4.9, hinten). fn(x, z) → [r, g, b] (sRGB 0..1), rough,
   * height (m). paint({ color, rough, height, px }) zeichnet danach mit Canvas 2D (px: Welt → Pixel).
   * Liefert { map, rough, normal }.
   */
  function surface(N, fn, paint, hScale = 0.004) {
    const cc = canvas(N), rc = canvas(N), hc = canvas(N);
    const cx = cc.getContext('2d'), rx = rc.getContext('2d'), hx = hc.getContext('2d', { willReadFrequently: true });
    const ci = cx.createImageData(N, N), ri = rx.createImageData(N, N), hi = hx.createImageData(N, N);
    for (let j = 0; j < N; j++) {
      const z = -HP + (j + 0.5) * PLATE / N;
      for (let i = 0; i < N; i++) {
        const x = -HP + (i + 0.5) * PLATE / N;
        const [c, r, h] = fn(x, z);
        const k = (j * N + i) * 4;
        ci.data[k] = c[0] * 255; ci.data[k + 1] = c[1] * 255; ci.data[k + 2] = c[2] * 255; ci.data[k + 3] = 255;
        ri.data[k] = ri.data[k + 1] = ri.data[k + 2] = r * 255; ri.data[k + 3] = 255;
        hi.data[k] = hi.data[k + 1] = hi.data[k + 2] = clamp(128 + h / hScale, 0, 255); hi.data[k + 3] = 255;
      }
    }
    cx.putImageData(ci, 0, 0); rx.putImageData(ri, 0, 0); hx.putImageData(hi, 0, 0);
    const px = (w) => (w + HP) / PLATE * N;
    paint?.({ color: cx, rough: rx, height: hx, px, N, m: N / PLATE });
    return { map: tex(cc), rough: tex(rc, false), normal: normalFrom(hx, N, PLATE / N, hScale), canvas: cc };
  }
  /** Normalenkarte (Tangentenraum der Ebene) aus einer Höhenkarte (Grauwert, 128 = 0, hScale m je Stufe) */
  function normalFrom(hx, N, texel, hScale, M = N) {
    const h = hx.getImageData(0, 0, N, M).data;
    const nc = canvas(N, M), nx = nc.getContext('2d'), ni = nx.createImageData(N, M);
    const H = (i, j) => (h[((Math.min(M - 1, Math.max(0, j))) * N + ((i + N) % N)) * 4] - 128) * hScale;
    for (let j = 0; j < M; j++) {
      for (let i = 0; i < N; i++) {
        const dx = (H(i + 1, j) - H(i - 1, j)) / (2 * texel);
        const dz = (H(i, j + 1) - H(i, j - 1)) / (2 * texel); // Zeile nach unten = uv.y kleiner
        let nX = -dx, nY = dz, nZ = 1;
        const l = Math.hypot(nX, nY, nZ);
        const k = (j * N + i) * 4;
        ni.data[k] = (nX / l * 0.5 + 0.5) * 255; ni.data[k + 1] = (nY / l * 0.5 + 0.5) * 255; ni.data[k + 2] = (nZ / l * 0.5 + 0.5) * 255; ni.data[k + 3] = 255;
      }
    }
    nx.putImageData(ni, 0, 0);
    return tex(nc, false);
  }

  /* ---------- Boden (floorMaterial) umbauen, Spiegelung und Lichtwelle bleiben im Shader ---------- */
  let floorKey = 0;
  function floor(o) {
    const m = D.floorMaterial;
    if (o.map) m.map = o.map;
    if ('rough' in o) m.roughnessMap = o.rough;
    if ('normal' in o) m.normalMap = o.normal;
    m.normalScale.set(o.normalScale ?? 1, o.normalScale ?? 1);
    m.color.set(o.color ?? 0xffffff);
    m.roughness = o.roughness ?? 1;
    if (o.envMapIntensity !== undefined) m.envMapIntensity = o.envMapIntensity;
    const orig = m.onBeforeCompile, key = 'katalog-floor-' + (++floorKey);
    m.onBeforeCompile = (shader, r) => {
      orig.call(m, shader, r);
      Object.assign(shader.uniforms, o.uniforms ?? {});
      let f = shader.fragmentShader;
      const rep = (a, b) => { if (!f.includes(a)) throw new Error('Shader: fehlt ' + a.slice(0, 60)); f = f.replace(a, b); };
      rep('uniform vec3 uShockColor;', 'uniform vec3 uShockColor;\n' + (o.decl ?? ''));
      if (o.groove !== undefined) rep('diffuseColor.rgb *= 1.0 - floorGroove * 0.6;', o.groove);
      if (o.inlay !== undefined) rep('diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.16, 0.18), floorInlay);', o.inlay);
      if (o.bevel !== undefined) rep('diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 2.2 + 0.012, floorBevel);', o.bevel);
      if (o.grooveRough !== undefined) rep('roughnessFactor = mix(roughnessFactor, 0.8, floorGroove);', o.grooveRough);
      if (o.inlayRough !== undefined) rep('roughnessFactor = mix(roughnessFactor, 0.55, floorInlay);', o.inlayRough);
      if (o.bevelRough !== undefined) rep('roughnessFactor = mix(roughnessFactor, 0.12, floorBevel);', o.bevelRough);
      if (o.refl !== undefined) rep('* uReflStrength * 0.42;', `* uReflStrength * ${o.refl.toFixed(3)};`);
      if (o.wave !== undefined) rep('gl_FragColor.rgb += uShockColor * (ring + trail) * uShock.y;', o.wave);
      if (o.after) rep('#include <tonemapping_fragment>', o.after + '\n#include <tonemapping_fragment>');
      if (o.discard) rep('#include <map_fragment>', '#include <map_fragment>\n' + o.discard);
      for (const [a, b] of o.replace ?? []) rep(a, b);
      shader.fragmentShader = f;
      m.userData.shader = shader;
    };
    m.customProgramCacheKey = () => key;
    m.needsUpdate = true;
  }

  /** Eigene Materialien mit Lichtwelle: glsl sieht vW (Weltposition), uShock, uShockColor; vor dem Tonemapping */
  let matKey = 0;
  function withWave(mat, glsl, decl = '', uniforms = {}) {
    const key = 'katalog-mat-' + (++matKey);
    const before = mat.onBeforeCompile;
    mat.onBeforeCompile = (shader, r) => {
      before?.call(mat, shader, r);
      Object.assign(shader.uniforms, shock, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vW;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      if (!shader.vertexShader.includes('vW = (modelMatrix')) {
        shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      }
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\nvarying vec3 vW;\nuniform vec3 uShock;\nuniform vec3 uShockColor;\n${decl}`)
        .replace('#include <tonemapping_fragment>', `${glsl}\n#include <tonemapping_fragment>`);
    };
    mat.customProgramCacheKey = () => key;
    return mat;
  }
  // Ring der Lichtwelle (wie im Spiel): float sd, ring, trail aus der Weltposition
  const RING = `
      float sd = length(vW.xz);
      float ring = exp(-pow((sd - uShock.x) / uShock.z, 2.0));
      float trail = (1.0 - smoothstep(0.0, max(uShock.x, 1e-3), sd));`;

  /* ---------- Teile des heutigen Bretts ---------- */
  const parts = { floorTop, plateSides, plateTrim };
  /** Teile ausblenden; floorTop über sein Material (renderReflection setzt visible jedes Bild wieder) */
  function hide(...names) {
    for (const n of names) { if (n === 'floorTop') floorTop.material.visible = false; else parts[n].visible = false; }
  }
  /** Matte Seiten: im Spiel fällt kaum Licht auf senkrechte Flächen; ein Teil der Farbe leuchtet selbst (Licht des
   *  Strands), sonst stünden sie schwarz im Bild */
  function sideMat(map, o = {}) {
    return new T.MeshStandardMaterial({ map, roughness: o.roughness ?? 0.9, envMapIntensity: o.env ?? 1.2,
      emissiveMap: map, emissive: new T.Color().setScalar(o.glow ?? 0.32), ...(o.extra ?? {}) });
  }
  function sides(mat, geo) {
    plateSides.material = mat;
    if (geo) plateSides.geometry = geo;
  }
  /** Seiten-Textur (Box-UV: je Seite 0..1 über 9.8 m × Dicke) */
  function sideTex(W, H, fn) {
    const c = canvas(W, H), x = c.getContext('2d'), im = x.createImageData(W, H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const [r, g, b] = fn(i / W * PLATE, j / H); // u in m, v 0 oben … 1 unten
      const k = (j * W + i) * 4;
      im.data[k] = r * 255; im.data[k + 1] = g * 255; im.data[k + 2] = b * 255; im.data[k + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    return c;
  }
  /** Himmel hinter dem Quader des Bretts wieder zeichnen (Formen, die ihn nicht ganz decken) */
  function skyBehind() {
    let n = 0;
    D.scene.traverse((o) => {
      for (const m of [o.material ?? []].flat()) {
        if (m.fragmentShader?.includes('if (tIn <= tOut && tIn > 0.0 && tIn < 1.0) discard;')) {
          m.fragmentShader = m.fragmentShader.replace('if (tIn <= tOut && tIn > 0.0 && tIn < 1.0) discard;', '');
          m.needsUpdate = true; n++;
        }
      }
    });
    return n;
  }

  /* ---------- Kamera, Ecken, Welle ---------- */
  const base = { phi: D.cameraRig.basePhi, lead: D.cameraRig.lead };
  function kamera(a) {
    const c = D.cameraRig;
    c.homing = null;
    c.basePhi = base.phi; c.lead = base.lead; c.goalPhi = 0; c.goalZoom = 1; c.goalTheta = 0;
    if (a === 'oben') { c.basePhi = 0.04; c.lead = 0; c.goalZoom = 1.42; } // Wackeln ±0.018: phi bleibt > 0
    if (a === 'flach') { c.goalPhi = c.phiMax - base.phi; c.goalTheta = 0.62; }
    D.sceneLoop.wake();
    return a;
  }
  function ecken() {
    const P = (x, y, z) => { const v = new T.Vector3(x, y, z).project(D.camera); return [+((v.x + 1) / 2 * innerWidth).toFixed(1), +((1 - v.y) / 2 * innerHeight).toFixed(1)]; };
    return {
      w: innerWidth, h: innerHeight,
      oben: [[-HP, -HP], [HP, -HP], [HP, HP], [-HP, HP]].map(([x, z]) => P(x, 0, z)),
      unten: [[-HP, -HP], [HP, -HP], [HP, HP], [-HP, HP]].map(([x, z]) => P(x, -0.41, z)),
      feld: [[-HB, -HB], [HB, -HB], [HB, HB], [-HB, HB]].map(([x, z]) => P(x, 0, z)),
    };
  }
  async function welle(r) {
    D.loese();
    const t0 = performance.now();
    await new Promise((res) => {
      const f = () => (shock.uShock.value.x >= r || performance.now() - t0 > 15000) ? res() : requestAnimationFrame(f);
      f();
    });
    const v = shock.uShock.value.clone();
    D.scene.onBeforeRender = () => { shock.uShock.value.copy(v); };
    return v.toArray().map((n) => +n.toFixed(3));
  }

  const lib = { D, T, PLATE, BOARD, CELL, THICK, HP, HB, parts, shock, rng, noise, fbm, clamp, smooth, mix, mix3, hex,
    canvas, tex, surface, normalFrom, floor, withWave, RING, sides, sideTex, sideMat, hide, skyBehind };
  const varianten = {};
  return {
    lib, varianten,
    async bau(name) {
      if (name === 'stein') return 'Steinbrett (heute)';
      if (!varianten[name]) throw new Error('unbekannte Variante ' + name);
      const r = await varianten[name](lib);
      D.sceneLoop.wake(true);
      return r ?? name;
    },
    kamera, ecken, welle,
  };
})();
