// 8 Schwebende Sandinsel: unregelmässiger, runder Umriss innerhalb 9.8 × 9.8, Sand mit Strandhafer auf dem Rand,
// darunter ein Felszapfen wie bei einer schwebenden Insel
__katalog.varianten.insel = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng, parts } = L;
  const r = rng(29);
  L.skyBehind();
  L.hide('plateSides', 'plateTrim');
  // Umriss: Quadrat mit runden Ecken (Halbmass 4.85, Radius 0.7), unregelmässig angefressen (bis 0.32 nach innen)
  const N = 160;
  const outline = [];
  const rsq = (a) => { // Abstand zur Kante eines abgerundeten Quadrats in Richtung a
    const dx = Math.cos(a), dz = Math.sin(a), h = 4.86, rc = 0.75;
    let lo = 0, hi = 8;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2, x = Math.abs(dx * m), z = Math.abs(dz * m);
      const qx = Math.max(x - (h - rc), 0), qz = Math.max(z - (h - rc), 0);
      const d = Math.max(x, z) <= h - rc ? Math.max(x, z) - h : Math.hypot(qx, qz) - rc;
      if (d < 0) lo = m; else hi = m;
    }
    return lo;
  };
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2;
    const bite = smooth(0.45, 0.8, fbm(Math.cos(a) * 2.2 + 5, Math.sin(a) * 2.2, 3, 111)) * 0.3 + noise(a * 9, 0, 112) * 0.05;
    outline.push([a, rsq(a) - bite]);
  }
  const radAt = (a) => {
    const t = ((a / (Math.PI * 2)) % 1 + 1) % 1 * N, i = Math.floor(t), f = t - i;
    return mix(outline[i % N][1], outline[(i + 1) % N][1], f);
  };
  const inside = (x, z) => Math.hypot(x, z) - radAt(Math.atan2(z, x)); // < 0 innen
  // Oberseite: Sand, Feld glatt, Rand mit Spuren von Treibgut; ausserhalb des Umrisses durchsichtig (alphaTest)
  const sandL = [0.94, 0.76, 0.58], sandD = [0.80, 0.60, 0.45];
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const field = 1 - smooth(HB + 0.05, HB + 0.25, box);
    const g = fbm(x * 0.4, z * 0.4, 4, 113), gr = noise(x * 300, z * 300, 114);
    let c = mix3(sandL, sandD, smooth(0.3, 0.75, g) * 0.7 + (1 - field) * 0.15);
    const k = 0.92 + 0.16 * gr; c = [c[0] * k, c[1] * k, c[2] * k];
    const e = inside(x, z);
    c = mix3(c, [0.62, 0.46, 0.36], smooth(-0.25, 0, e) * 0.6); // Kante dunkler
    const dune = Math.sin((x * 0.5 - z * 0.8) * 9 + g * 8) * 0.004 * (1 - field);
    return [c, mix(0.95, 0.75, field), dune + (gr - 0.5) * 0.0006];
  }, ({ color, px, m, N: n }) => {
    // Raster: in den Sand gezogene Rillen (wie Sandbank, schmaler)
    for (let k = 0; k <= 7; k++) {
      const p = -HB + k * CELL;
      for (const [w, st] of [[0.03, 'rgba(120,80,55,0.35)'], [0.012, 'rgba(95,62,44,0.75)']]) {
        color.strokeStyle = st; color.lineWidth = w * m;
        color.beginPath(); color.moveTo(px(p), px(-HB)); color.lineTo(px(p), px(HB)); color.stroke();
        color.beginPath(); color.moveTo(px(-HB), px(p)); color.lineTo(px(HB), px(p)); color.stroke();
      }
    }
    // Umriss ausschneiden
    color.globalCompositeOperation = 'destination-in';
    color.beginPath();
    for (let i = 0; i <= N; i++) {
      const [a, rr] = outline[i % N];
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      i ? color.lineTo(px(x), px(z)) : color.moveTo(px(x), px(z));
    }
    color.closePath(); color.fillStyle = '#000'; color.fill();
    color.globalCompositeOperation = 'source-over';
  }, 0.00025);
  D.floorMaterial.alphaTest = 0.5;
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.4,
    groove: '', inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.98, 0.92, 0.82), floorInlay * 0.8);', bevel: '', bevelRough: '', grooveRough: '',
    refl: 0.0,
    // Lichtwelle: ein goldener Ring, in dem die Sandkörner glitzern
    wave: `
        float spark = step(0.965, fract(sin(dot(floor(vUv * 2200.0), vec2(12.9898, 78.233))) * 43758.5453));
        float band = exp(-pow((sd - uShock.x) / (uShock.z * 2.5), 2.0));
        gl_FragColor.rgb += (uShockColor * 0.7 + vec3(0.5, 0.38, 0.18)) * ring * uShock.y * 1.1;
        gl_FragColor.rgb += vec3(1.6, 1.4, 1.0) * spark * (band + trail * 0.25) * min(1.0, uShock.y * 3.0) * 2.0;`,
  });
  // Rand und Felszapfen: Ringe vom Umriss nach unten, verrauscht, flach schattiert
  const rings = [[0, 1.0, 0], [-0.05, 1.0, 0.01], [-0.3, 0.998, 0.03], [-0.6, 0.97, 0.08], [-1.0, 0.9, 0.14], [-1.4, 0.78, 0.2],
    [-1.8, 0.6, 0.24], [-2.15, 0.4, 0.24], [-2.45, 0.2, 0.18], [-2.65, 0.07, 0.08]];
  const pos = [], col = [], idx = [];
  const sandC = [0.80, 0.62, 0.46], earth = [0.56, 0.40, 0.33], rock = [0.64, 0.46, 0.42], rockD = [0.42, 0.33, 0.37];
  rings.forEach(([y, sc, jit], k) => {
    for (let i = 0; i < N; i++) {
      const [a, rr] = outline[i];
      const n = (fbm(Math.cos(a) * 2 + k * 0.7, Math.sin(a) * 2 + y, 3, 115) - 0.5) * 2;
      const rad = Math.min(rr * sc * (1 + n * jit), 4.88);
      pos.push(Math.cos(a) * rad, y + (k > 1 ? n * 0.08 : 0), Math.sin(a) * rad);
      const t = k / (rings.length - 1);
      let c = k < 2 ? sandC : k < 3 ? earth : mix3(rock, rockD, clamp(t * 1.2 + n * 0.2));
      const v = 0.92 + 0.16 * r();
      col.push(c[0] * v, c[1] * v, c[2] * v);
    }
  });
  pos.push(0.15, -2.78, -0.1); col.push(...rockD);
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < N; i++) {
    const a = k * N + i, b = k * N + (i + 1) % N, c = (k + 1) * N + i, d = (k + 1) * N + (i + 1) % N;
    idx.push(a, b, c, b, d, c);
  }
  const tip = rings.length * N;
  for (let i = 0; i < N; i++) idx.push((rings.length - 1) * N + i, (rings.length - 1) * N + (i + 1) % N, tip);
  let geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo = geo.toNonIndexed(); geo.computeVertexNormals();
  const underMat = new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92, envMapIntensity: 1.2, side: T.DoubleSide,
    emissive: new T.Color(0.25, 0.2, 0.2) });
  underMat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vColor;'); };
  const under = new T.Mesh(geo, underMat);
  under.receiveShadow = true;
  const g = new T.Group();
  g.add(under);
  // Wurzeln und hängende Halme unter der Kante
  const rootMat = new T.MeshStandardMaterial({ color: 0x8a6a50, roughness: 0.9, emissive: 0x3a2a1e });
  for (let i = 0; i < 30; i++) {
    const a = r() * Math.PI * 2, rr = radAt(a) * 0.975, len = 0.2 + r() * 0.45;
    const p0 = new T.Vector3(Math.cos(a) * rr, -0.12 - r() * 0.2, Math.sin(a) * rr);
    const pts = [p0];
    for (let k = 1; k <= 4; k++) pts.push(p0.clone().add(new T.Vector3((r() - 0.5) * 0.08 + Math.cos(a) * 0.03 * k, -len * k / 4, (r() - 0.5) * 0.08 + Math.sin(a) * 0.03 * k)));
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 10, 0.008 + r() * 0.01, 4), rootMat));
  }
  // Strandhafer: Büschel aus schmalen Halmen auf dem Rand (nicht im Feld)
  const blade = new T.BufferGeometry();
  { const p = [], c = [];
    for (let b = 0; b < 9; b++) {
      const ang = b / 9 * Math.PI * 2 + r(), lean = 0.12 + r() * 0.25, h = 0.28 + r() * 0.3, w = 0.012;
      const dx = Math.cos(ang), dz = Math.sin(ang), tx = -dz * w, tz = dx * w;
      const top = [dx * lean, h, dz * lean];
      p.push(-tx, 0, -tz, tx, 0, tz, ...top);
      const g1 = 0.85 + r() * 0.3;
      c.push(0.42 * g1, 0.52 * g1, 0.2 * g1, 0.42 * g1, 0.52 * g1, 0.2 * g1, 0.85, 0.78, 0.45);
    }
    blade.setAttribute('position', new T.Float32BufferAttribute(p, 3)); blade.setAttribute('color', new T.Float32BufferAttribute(c, 3));
    blade.computeVertexNormals(); }
  const grassMat = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.8, emissive: new T.Color(0.12, 0.12, 0.06) });
  const NT = 170, tufts = new T.InstancedMesh(blade, grassMat, NT);
  const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(), P = new T.Vector3();
  for (let i = 0; i < NT; i++) {
    let x, z, tries = 0;
    for (;;) {
      x = (r() * 2 - 1) * HP; z = (r() * 2 - 1) * HP; tries++;
      if (Math.max(Math.abs(x), Math.abs(z)) < HB + 0.3) continue;
      if (inside(x, z) > -0.08) continue;
      const corner = smooth(3.4, 4.8, Math.min(Math.abs(x), Math.abs(z)));
      if (r() < 0.25 + corner * 0.8 || tries > 60) break;
    }
    P.set(x, 0, z); Q.setFromAxisAngle(new T.Vector3(0, 1, 0), r() * 6.3); S.setScalar(0.7 + r() * 0.7);
    tufts.setMatrixAt(i, M.compose(P, Q, S));
  }
  tufts.castShadow = true;
  g.add(tufts);
  // ein paar Muscheln und Kiesel auf dem Rand
  const pebble = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), new T.MeshStandardMaterial({ color: 0xf2e6d6, roughness: 0.5, emissive: 0x2a2620 }), 60);
  for (let i = 0; i < 60; i++) {
    let x, z;
    do { x = (r() * 2 - 1) * HP; z = (r() * 2 - 1) * HP; } while (Math.max(Math.abs(x), Math.abs(z)) < HB + 0.3 || inside(x, z) > -0.1);
    P.set(x, 0.005, z); Q.setFromAxisAngle(new T.Vector3(0, 1, 0), r() * 6.3); S.set(0.03 + r() * 0.03, 0.012, 0.02 + r() * 0.02);
    pebble.setMatrixAt(i, M.compose(P, Q, S));
    pebble.setColorAt(i, new T.Color().setHSL(0.06 + r() * 0.05, 0.3 + r() * 0.3, 0.7 + r() * 0.2));
  }
  g.add(pebble);
  D.scene.add(g);
  return 'Sandinsel';
};
