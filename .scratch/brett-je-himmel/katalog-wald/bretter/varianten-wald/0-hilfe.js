// Hilfen für den Wüsten-Katalog: Platte mit freiem Umriss, Umriss aus der Oberseite schneiden, Rumpf aus Ringen,
// Waben (Voronoi), Maske als Textur für die Lichtwelle
__katalog.w2 = (() => {
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
  /** Rumpf: Ringe [y, f(x, z) → [x, z]] über dem Umriss pts, Farbe color(y, x, z, k); flach schattiert, beidseitig */
  function hull(pts, rings, color, tip) {
    const pos = [], col = [], idx = [], N = pts.length;
    rings.forEach(([y, f], k) => {
      for (const [x0, z0] of pts) {
        const [x, z, dy = 0] = f(x0, z0);
        pos.push(x, y + dy, z);
        col.push(...color(y, x, z, k));
      }
    });
    if (tip) { pos.push(...tip); col.push(...color(tip[1], tip[0], tip[2], rings.length)); }
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < N; i++) {
      const a = k * N + i, b = k * N + (i + 1) % N, c = (k + 1) * N + i, d = (k + 1) * N + (i + 1) % N;
      idx.push(a, b, c, b, d, c);
    }
    if (tip) { const t = rings.length * N, l = (rings.length - 1) * N; for (let i = 0; i < N; i++) idx.push(l + i, l + (i + 1) % N, t); }
    let geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo = geo.toNonIndexed(); geo.computeVertexNormals();
    const mat = new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9, side: T.DoubleSide, envMapIntensity: 1.2, emissive: new T.Color(0.3, 0.27, 0.27) });
    mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vColor;'); };
    const mesh = new T.Mesh(geo, mat);
    mesh.receiveShadow = true;
    return mesh;
  }
  /** Waben: [Abstand zur Kante (F2 − F1), Zellnummer] bei Zellgrösse s */
  function cells(x, z, s, seed = 0) {
    const X = x / s, Z = z / s, xi = Math.floor(X), zi = Math.floor(Z);
    let f1 = 9, f2 = 9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const a = L.noise((xi + i) * 7.31 + 0.5, (zi + j) * 3.17 + 0.5, seed) , b = L.noise((xi + i) * 5.13 + 0.5, (zi + j) * 9.71 + 0.5, seed + 1);
      const dx = xi + i + 0.1 + a * 0.8 - X, dz = zi + j + 0.1 + b * 0.8 - Z, d = Math.hypot(dx, dz);
      if (d < f1) { f2 = f1; f1 = d; id = (xi + i) * 131 + (zi + j) * 17; } else if (d < f2) f2 = d;
    }
    return [(f2 - f1) * s, id];
  }
  /** Maske (Canvas N×N über die Platte, wie L.surface) als lineare Textur */
  function mask(N, draw) {
    const c = L.canvas(N), x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, N, N);
    draw(x, (w) => (w + HP) / L.PLATE * N, N / L.PLATE);
    return L.tex(c, false);
  }
  return { slab, clip, roundedSquare, hull, cells, mask };
})();
