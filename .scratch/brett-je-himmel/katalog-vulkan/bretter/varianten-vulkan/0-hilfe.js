// Hilfen für den Vulkan-Katalog (aus dem Wüsten-Katalog übernommen und ergänzt): Platte mit freiem Umriss, Umriss aus
// der Oberseite schneiden, Rumpf aus Ringen (mit UV), Waben (Voronoi), Maske als Textur, Unterlicht der Lava
__katalog.vk = (() => {
  const L = __katalog.lib, { T, D, HP } = L;
  /** Platte mit Umriss pts ([[x, z], …]) von y = −top bis −top−depth; side: Seitenmaterial, cap: Deckel/Boden */
  function slab(pts, { depth = 0.38, top = 0.003, side, cap }) {
    const shape = new T.Shape(pts.map(([x, z]) => new T.Vector2(x, z)));
    const geo = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1, curveSegments: 1 });
    const mesh = new T.Mesh(geo, [cap ?? side, side]);
    mesh.rotation.x = Math.PI / 2; mesh.position.y = -top;
    mesh.receiveShadow = true;
    return mesh;
  }
  /** Oberseite ausserhalb des Umrisses durchsichtig (für L.surface: paint) */
  function clip(ctx, px, pts) {
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    pts.forEach(([x, z], i) => (i ? ctx.lineTo(px(x), px(z)) : ctx.moveTo(px(x), px(z))));
    ctx.closePath(); ctx.fillStyle = '#000'; ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  /** Abgerundetes Quadrat (Halbmass h, Radius rc), n Punkte, mit Störung jitter(a) */
  function roundedSquare(h, rc, n = 160, jitter = () => 0) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
      let lo = 0, hi = 8;
      for (let k = 0; k < 40; k++) {
        const m = (lo + hi) / 2, x = Math.abs(dx * m), z = Math.abs(dz * m);
        const qx = Math.max(x - (h - rc), 0), qz = Math.max(z - (h - rc), 0);
        const d = Math.max(x, z) <= h - rc ? Math.max(x, z) - h : Math.hypot(qx, qz) - rc;
        if (d < 0) lo = m; else hi = m;
      }
      const r = lo + jitter(a);
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return pts;
  }
  /** Ist (x, z) im Umriss pts? */
  function inside(pts, x, z) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, zi] = pts[i], [xj, zj] = pts[j];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
    }
    return c;
  }
  /**
   * Rumpf aus Ringen: rings [y, f(x, z, u) → [x, z, dy]] über dem Umriss pts, optional Spitze tip [x, y, z].
   * Liefert BufferGeometry mit uv (u: Umfang 0..1, v: Ring 0..1) und, wenn color(y, x, z, k) gegeben, Farbe je Ecke.
   * flat: flach schattiert (nicht indiziert).
   */
  function hullGeo(pts, rings, { color, tip, flat = true } = {}) {
    const pos = [], col = [], uv = [], idx = [], N = pts.length, R = rings.length;
    rings.forEach(([y, f], k) => {
      for (let i = 0; i <= N; i++) {
        const [x0, z0] = pts[i % N];
        const [x, z, dy = 0] = f(x0, z0, i / N);
        pos.push(x, y + dy, z);
        uv.push(i / N, k / (R - 1 + (tip ? 1 : 0)));
        if (color) col.push(...color(y, x, z, k));
      }
    });
    const W = N + 1;
    for (let k = 0; k < R - 1; k++) for (let i = 0; i < N; i++) {
      const a = k * W + i, b = k * W + i + 1, c = (k + 1) * W + i, d = (k + 1) * W + i + 1;
      idx.push(a, b, c, b, d, c);
    }
    if (tip) {
      const t0 = pos.length / 3;
      for (let i = 0; i <= N; i++) { pos.push(...tip); uv.push(i / N, 1); if (color) col.push(...color(tip[1], tip[0], tip[2], R)); }
      const l = (R - 1) * W;
      for (let i = 0; i < N; i++) idx.push(l + i, l + i + 1, t0 + i);
    }
    let geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    if (color) geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    if (flat) geo = geo.toNonIndexed();
    geo.computeVertexNormals();
    return geo;
  }
  /** Farbe je Dreieck (nicht indizierte Geometrie): fn(normal, mitte, i) → [r, g, b] */
  function faceColors(geo, fn) {
    const p = geo.attributes.position, n = p.count, col = new Float32Array(n * 3);
    const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), nn = new T.Vector3(), m = new T.Vector3();
    for (let i = 0; i < n; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      nn.subVectors(c, b).cross(new T.Vector3().subVectors(a, b)).normalize();
      m.copy(a).add(b).add(c).multiplyScalar(1 / 3);
      const rgb = fn(nn, m, i / 3);
      for (let k = 0; k < 3; k++) col.set(rgb, (i + k) * 3);
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    return geo;
  }
  /** Waben: [Abstand zur Kante (F2 − F1), Zellnummer, Abstand zum Kern F1] bei Zellgrösse s */
  function cells(x, z, s, seed = 0) {
    const X = x / s, Z = z / s, xi = Math.floor(X), zi = Math.floor(Z);
    let f1 = 9, f2 = 9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const a = L.noise((xi + i) * 7.31 + 0.5, (zi + j) * 3.17 + 0.5, seed), b = L.noise((xi + i) * 5.13 + 0.5, (zi + j) * 9.71 + 0.5, seed + 1);
      const dx = xi + i + 0.1 + a * 0.8 - X, dz = zi + j + 0.1 + b * 0.8 - Z, d = Math.hypot(dx, dz);
      if (d < f1) { f2 = f1; f1 = d; id = (xi + i) * 131 + (zi + j) * 17; } else if (d < f2) f2 = d;
    }
    return [(f2 - f1) * s, id, f1 * s];
  }
  /** Maske (Canvas N×N über die Platte, wie L.surface) als lineare Textur; draw(ctx, px, m) */
  function mask(N, draw) {
    const c = L.canvas(N), x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#000'; x.fillRect(0, 0, N, N);
    draw(x, (w) => (w + HP) / L.PLATE * N, N / L.PLATE);
    return L.tex(c, false);
  }
  /** Maske aus einer Funktion fn(x, z) → 0..1 (N×N über die Platte) */
  function maskFn(N, fn) {
    return mask(N, (x) => {
      const im = x.getImageData(0, 0, N, N);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const v = fn(-HP + (i + 0.5) * L.PLATE / N, -HP + (j + 0.5) * L.PLATE / N);
        const k = (j * N + i) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = L.clamp(v) * 255; im.data[k + 3] = 255;
      }
      x.putImageData(im, 0, 0);
    });
  }
  /**
   * Unterlicht der Lava (GLSL, nach withWave): Flächen, die nach unten oder zur Seite schauen, bekommen das Licht des
   * Lavasees, gewichtet mit ihrer eigenen Farbe (helle Stoffe glühen stärker an). down/side: Stärke; lo/hi: Höhe, auf
   * der es voll wirkt bzw. auf die Hälfte fällt. spec: Glanz für Glas und Metall, unabhängig von der Farbe (Spiegelung
   * der Glut in Flächen, die nach unten schauen, stärker unter flachem Blick). Bleibt unter der Bloom-Schwelle.
   */
  const LAVA = 'vec3(1.0, 0.36, 0.09)';
  function unter({ down = 0.9, side = 0.35, lo = -2.0, hi = 0.0, spec = 0 } = {}) {
    return `
      {
        vec3 wN = inverseTransformDirection(normal, viewMatrix);
        float dn = clamp(-wN.y, 0.0, 1.0), sd0 = 1.0 - abs(wN.y);
        float low = 0.5 + 0.5 * smoothstep(${hi.toFixed(3)}, ${lo.toFixed(3)}, vW.y);
        gl_FragColor.rgb += diffuseColor.rgb * ${LAVA} * (dn * ${down.toFixed(3)} + sd0 * ${side.toFixed(3)}) * low;
        ${spec ? `float frs = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);
        gl_FragColor.rgb += ${LAVA} * pow(clamp(-wN.y + 0.25, 0.0, 1.0), 1.5) * (0.12 + 0.88 * frs) * ${spec.toFixed(3)} * low;` : ''}
      }`;
  }
  /** Material mit Unterlicht und Lichtwelle (wave: GLSL, darf sd, ring, trail aus RING benutzen) */
  function lavaMat(params, o = {}, wave = '') {
    const mat = new T.MeshStandardMaterial({ roughness: 0.85, envMapIntensity: 1.0, ...params });
    return L.withWave(mat, unter(o) + (wave ? `\n      {\n${L.RING}\n${wave}\n      }` : ''), o.decl ?? '', o.uniforms ?? {});
  }
  /** Textur für hullGeo (Zeile 0 der Leinwand = oberster Ring, v = 0) */
  function htex(c, srgb = true) { const t = L.tex(c, srgb); t.flipY = false; return t; }
  /**
   * Körper der Lichtwelle (wie die Blumen im Moospolster des Wald-Katalogs): unsichtbar in Ruhe, erscheinen nur, wenn
   * der Ring vorbeizieht. list: [{ p: [x, y, z], r: [rx, ry, rz], s: Zahl oder [sx, sy, sz], c: [r, g, b] }].
   * mode 'grow': wachsen im Ring (axis 'y': nur in die Höhe), keep: Anteil, der hinter dem Ring bleibt und über tail
   *   (m) vergeht. 'rise': erscheinen, wenn der Ring sie erreicht, steigen über tail (m) um lift (m) auf und treiben um
   *   drift (m) nach aussen; size: GLSL-Ausdruck der Grösse aus ph (0..1). 'hop': springen um lift hoch, drehen sich um
   *   spin (rad) und fallen zurück.
   * glow: GLSL vor dem Tonemapping, sieht vGrow (0..1, Stärke), vPhase (0 Ring … 1 Ende), vRnd (0..1 je Körper).
   * Liefert ein InstancedMesh (ohne Schatten; das Netz steht im Ursprung).
   */
  function koerper(geo, mat, list, o = {}) {
    const { mode = 'grow', width = 2.5, keep = 0, tail = 1.2, lift = 0.4, drift = 0, spin = 0, jitter = 0.4, axis = 'all',
      size = '(1.0 - ph)', glow = '' } = o;
    const f = (v) => Number(v).toFixed(3);
    const key = 'katalog-koerper-' + Math.random();
    let body;
    if (mode === 'grow') {
      body = `vGrow = clamp(max(ringv, ${f(keep)} * step(0.0, rel) * (1.0 - vPhase)) * on, 0.0, 1.0);
        ${axis === 'y' ? 'transformed.y *= vGrow;' : 'transformed *= vGrow;'}`;
    } else if (mode === 'rise') {
      body = `float ph = vPhase, act = step(0.0, rel) * step(rel, ${f(tail)}) * on;
        vGrow = act * (1.0 - ph);
        transformed *= act * max(0.0, ${size});
        vec2 dir = normalize(ic.xz + vec2(1e-4));
        vLift = vec3(dir.x * ${f(drift)} * ph, ${f(lift)} * (1.0 - (1.0 - ph) * (1.0 - ph)) * (0.6 + 0.6 * vRnd), dir.y * ${f(drift)} * ph);`;
    } else {
      body = `float ph = clamp((rel + 0.3) / ${f(tail)}, 0.0, 1.0), act = step(0.0, rel + 0.3) * step(rel + 0.3, ${f(tail)}) * on;
        vPhase = ph; vGrow = act * sin(3.1416 * ph);
        float a = ${f(spin)} * ph * (vRnd > 0.5 ? 1.0 : -1.0);
        transformed.yz = mat2(cos(a), sin(a), -sin(a), cos(a)) * transformed.yz;
        transformed *= act * smoothstep(0.0, 0.12, ph) * smoothstep(1.0, 0.85, ph);
        vLift = vec3(0.0, ${f(lift)} * sin(3.1416 * ph) * (0.6 + 0.6 * vRnd), 0.0);`;
    }
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, L.shock);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uShock;\nvarying float vGrow;\nvarying float vPhase;\nvarying float vRnd;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vec3 vLift = vec3(0.0);
          vec3 ic = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          vRnd = fract(sin(dot(ic.xz, vec2(12.9898, 78.233))) * 43758.5453);
          float d = length(ic.xz) + (vRnd - 0.5) * ${f(jitter)};
          float on = step(0.001, uShock.y) * min(1.0, uShock.y * 3.0);
          float ringv = exp(-pow((d - uShock.x) / (uShock.z * ${f(width)}), 2.0));
          float rel = uShock.x - d;
          vPhase = clamp(rel / ${f(tail)}, 0.0, 1.0);
          ${body}`)
        .replace('#include <project_vertex>', `vec4 mvPosition = vec4(transformed, 1.0);
          mvPosition = instanceMatrix * mvPosition;
          mvPosition.xyz += vLift;
          mvPosition = modelViewMatrix * mvPosition;
          gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vGrow;\nvarying float vPhase;\nvarying float vRnd;')
        .replace('#include <tonemapping_fragment>', `${glow}\n#include <tonemapping_fragment>`);
    };
    mat.customProgramCacheKey = () => key;
    const inst = new T.InstancedMesh(geo, mat, list.length);
    const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(), P = new T.Vector3(), E = new T.Euler(), C = new T.Color();
    list.forEach((it, i) => {
      P.set(...it.p); Q.setFromEuler(E.set(...(it.r ?? [0, 0, 0])));
      if (Array.isArray(it.s)) S.set(...it.s); else S.setScalar(it.s ?? 1);
      inst.setMatrixAt(i, M.compose(P, Q, S));
      if (it.c) { C.setRGB(...it.c); inst.setColorAt(i, C); }
    });
    inst.frustumCulled = false; inst.castShadow = false; inst.receiveShadow = false;
    return inst;
  }
  /** Gleich verteilte Punkte auf der Platte (im Umriss pts, wenn gegeben); fn(x, z, box, r) → Eintrag oder null */
  function streu(n, r, fn, pts) {
    const out = [];
    for (let k = 0; out.length < n && k < n * 20; k++) {
      const x = (r() * 2 - 1) * (HP - 0.06), z = (r() * 2 - 1) * (HP - 0.06);
      if (pts && !inside(pts, x, z)) continue;
      const e = fn(x, z, Math.max(Math.abs(x), Math.abs(z)), r);
      if (e) out.push(e);
    }
    return out;
  }
  return { slab, clip, roundedSquare, inside, hullGeo, faceColors, cells, mask, maskFn, unter, lavaMat, LAVA, htex, koerper, streu };
})();
