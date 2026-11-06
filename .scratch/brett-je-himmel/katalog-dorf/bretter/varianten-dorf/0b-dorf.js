// Hilfen für den Dorf-Katalog: Instanzen, Rahmenbänder, eigene Kästen statt der Seiten des Steinbretts,
// Pyramidenstumpf mit Textur, Glühwürmchen, die mit der Lichtwelle aufleuchten, Scherenschnitt-Figuren
__katalog.dorf = (() => {
  const L = __katalog.lib, { T, D, HP, PLATE } = L;
  const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(), P = new T.Vector3(), E = new T.Euler();
  /** InstancedMesh aus [[x, y, z, { rx, ry, rz, s (Zahl oder [sx, sy, sz]), c: [r, g, b] }], …] */
  function inst(geo, mat, list, cast = true) {
    const m = new T.InstancedMesh(geo, mat, list.length);
    list.forEach(([x, y, z, o = {}], i) => {
      P.set(x, y, z); Q.setFromEuler(E.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0, 'YXZ'));
      const s = o.s ?? 1; Array.isArray(s) ? S.set(...s) : S.setScalar(s);
      m.setMatrixAt(i, M.compose(P, Q, S));
      if (o.c) m.setColorAt(i, new T.Color(...o.c));
    });
    m.castShadow = cast; m.receiveShadow = true;
    return m;
  }
  /** Quadratring zwischen den Halbmassen o (aussen) und i (innen) füllen (Canvas der Oberfläche) */
  function frame(g, px, m, o, i, col) {
    g.fillStyle = col; g.beginPath(); g.rect(px(-o), px(-o), 2 * o * m, 2 * o * m); g.rect(px(i), px(-i), -2 * i * m, 2 * i * m); g.fill('evenodd');
  }
  /** Kasten (Halbmass h, Oberkante top, Höhe hgt) mit Seitenmaterial; Deckel unsichtbar, Boden dunkel */
  function box(h, top, hgt, side, bottom) {
    const hidden = new T.MeshBasicMaterial({ visible: false });
    const b = new T.Mesh(new T.BoxGeometry(2 * h, hgt, 2 * h), [side, side, hidden, bottom ?? side, side, side]);
    b.position.y = top - hgt / 2; b.receiveShadow = true;
    return b;
  }
  /** Seitentextur mit Wiederholung je Meter: u in m (0 … len), v 0 oben … 1 unten */
  function sideCanvas(W, H, len, fn) {
    const c = L.canvas(W, H), x = c.getContext('2d'), im = x.createImageData(W, H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const [r, g, b, a = 1] = fn(i / W * len, j / H);
      const k = (j * W + i) * 4;
      im.data[k] = r * 255; im.data[k + 1] = g * 255; im.data[k + 2] = b * 255; im.data[k + 3] = a * 255;
    }
    x.putImageData(im, 0, 0);
    return c;
  }
  /** Offener Pyramidenstumpf (Halbmass oben a, unten b, Höhe h, Oberkante y = 0); u läuft 0 … 1 einmal ringsum */
  function frustum(a, b, h, mat) {
    let geo = new T.CylinderGeometry(a * Math.SQRT2, b * Math.SQRT2, h, 4, 1, true, Math.PI / 4);
    geo.translate(0, -h / 2, 0);
    geo = geo.toNonIndexed(); geo.computeVertexNormals();
    const m = new T.Mesh(geo, mat); m.receiveShadow = true;
    return m;
  }
  /** Glühwürmchen: Punkte, die mit der Lichtwelle aufleuchten und hinter dem Ring aufsteigen */
  function fireflies(pts, color = [0.78, 1, 0.32], px = 26) {
    const geo = new T.BufferGeometry(), r = L.rng(907);
    geo.setAttribute('position', new T.Float32BufferAttribute(pts.flat(), 3));
    geo.setAttribute('seed', new T.Float32BufferAttribute(pts.map(() => r()), 1));
    const mat = new T.ShaderMaterial({
      uniforms: { uShock: L.shock.uShock, uSize: { value: px * 10 * (D.renderer.getPixelRatio?.() ?? 1) }, uColor: { value: new T.Color(...color) } },
      vertexShader: `
        attribute float seed; uniform vec3 uShock; uniform float uSize; varying float vA;
        void main() {
          vec3 p = position;
          float sd = length(p.xz);
          float k = min(1.0, uShock.y * 3.0);
          float lit = exp(-pow((sd - uShock.x) / (uShock.z * 3.5), 2.0)) + (1.0 - smoothstep(0.0, max(uShock.x, 1e-3), sd)) * (0.35 + seed * 0.5);
          float age = clamp((uShock.x - sd) / 2.2, 0.0, 1.0);
          p.y += age * (0.25 + seed * 0.7);
          p.x += sin(seed * 40.0 + age * 6.0) * age * 0.12;
          vA = lit * k;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * (0.55 + seed * 0.6) / -mv.z * step(0.02, vA);
        }`,
      fragmentShader: `
        uniform vec3 uColor; varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float halo = pow(smoothstep(0.5, 0.0, d), 2.0), core = smoothstep(0.14, 0.0, d);
          gl_FragColor = vec4(uColor * (halo * 0.9 + core * 2.4) * min(vA, 1.2), 1.0);
        }`,
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    });
    const p = new T.Points(geo, mat); p.frustumCulled = false;
    return p;
  }
  /* ---------- Scherenschnitt: Figuren als Pfade (Einheiten in m, Fuss bei y = 0, nach oben −y im Canvas) ---------- */
  /** Zeichnet in ctx; tr(x, y) → Canvas-Punkt. Figuren: Tanne, Haus, Kirche, Kuh, Herz, Stern, Noa */
  function figur(ctx, tr, art, x, s = 1) {
    const L2 = (pts) => { ctx.beginPath(); pts.forEach(([a, b], i) => { const [u, v] = tr(x + a * s, b * s); i ? ctx.lineTo(u, v) : ctx.moveTo(u, v); }); ctx.closePath(); ctx.fill(); };
    const C = (a, b, rr) => { const [u, v] = tr(x + a * s, b * s), [u2, v2] = tr(x + (a + rr) * s, b * s); ctx.beginPath(); ctx.arc(u, v, Math.hypot(u2 - u, v2 - v), 0, 7); ctx.fill(); };
    if (art === 'tanne') {
      L2([[-0.02, 0], [0.02, 0], [0.02, 0.05], [-0.02, 0.05]]);
      for (const [y0, w, h] of [[0.04, 0.13, 0.16], [0.13, 0.1, 0.14], [0.21, 0.07, 0.12]]) L2([[-w, y0], [w, y0], [0, y0 + h]]);
    } else if (art === 'haus') {
      L2([[-0.12, 0], [0.12, 0], [0.12, 0.13], [0.16, 0.13], [0, 0.26], [-0.16, 0.13], [-0.12, 0.13]]);
      L2([[0.07, 0.17], [0.1, 0.17], [0.1, 0.24], [0.07, 0.24]]);
    } else if (art === 'kirche') {
      L2([[-0.16, 0], [0.1, 0], [0.1, 0.12], [-0.03, 0.2], [-0.16, 0.12]]);
      L2([[0.08, 0], [0.18, 0], [0.18, 0.3], [0.13, 0.46], [0.08, 0.3]]);
    } else if (art === 'kuh') {
      L2([[-0.12, 0.06], [0.1, 0.06], [0.12, 0.13], [-0.12, 0.13]]);
      for (const a of [-0.1, -0.06, 0.05, 0.09]) L2([[a, 0], [a + 0.02, 0], [a + 0.02, 0.07], [a, 0.07]]);
      L2([[0.1, 0.09], [0.17, 0.08], [0.18, 0.12], [0.11, 0.15]]);
      L2([[0.12, 0.14], [0.11, 0.18], [0.13, 0.15]]); L2([[0.15, 0.14], [0.17, 0.18], [0.16, 0.14]]);
      L2([[-0.12, 0.12], [-0.15, 0.04], [-0.14, 0.04], [-0.11, 0.11]]);
    } else if (art === 'herz') {
      C(-0.035, 0.1, 0.045); C(0.035, 0.1, 0.045); L2([[-0.078, 0.09], [0.078, 0.09], [0, 0]]);
    } else if (art === 'stern') {
      const pts = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 0.02 : 0.05; pts.push([Math.cos(a) * q, 0.06 + Math.sin(a) * q]); } L2(pts);
    } else if (art === 'noa') {
      C(0, 0.2, 0.03); L2([[-0.05, 0], [0.05, 0], [0.04, 0.16], [-0.04, 0.16]]);
      L2([[0.03, 0.14], [0.11, 0.2], [0.12, 0.18], [0.04, 0.12]]);
    }
  }
  /** Wie w2.hull, aber glatt schattiert (indiziert): Ringe [y, f(x, z) → [x, z, dy]] über dem Umriss pts */
  function hullSmooth(pts, rings, color, glow = 0.14) {
    const pos = [], col = [], idx = [], N = pts.length;
    rings.forEach(([y, f], k) => {
      for (const [x0, z0] of pts) {
        const [x, z, dy = 0] = f(x0, z0);
        pos.push(x, y + dy, z); col.push(...color(y, x, z, k));
      }
    });
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < N; i++) {
      const a = k * N + i, b = k * N + (i + 1) % N, c = (k + 1) * N + i, d = (k + 1) * N + (i + 1) % N;
      idx.push(a, c, b, b, c, d);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: T.DoubleSide, envMapIntensity: 1.1, emissive: new T.Color().setScalar(glow) });
    mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vColor;'); };
    const mesh = new T.Mesh(geo, mat); mesh.receiveShadow = true; mesh.castShadow = true;
    return mesh;
  }
  return { inst, frame, box, sideCanvas, frustum, fireflies, figur, hullSmooth };
})();
