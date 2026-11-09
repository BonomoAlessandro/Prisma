// W6 Wurzelgeflecht: das Brett ist ein alter Steinboden aus dem Wald, den die Wurzeln eines Baums umschlungen haben.
// Jedes Feld ist eine eigene Steinplatte, in den Fugen laufen feine Wurzelhaare. Dicke Wurzeln kriechen über den Rand,
// umfassen die Seiten und hängen unter dem Brett als Geflecht. Lichtwelle: Licht fliesst wie Saft durch die Wurzeln
__katalog.varianten.wurzeln = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng, hash } = L;
  const WD = __katalog.wald, r = rng(701);
  const stone = [0.45, 0.45, 0.40], stone2 = [0.36, 0.38, 0.36], soil = [0.2, 0.15, 0.11];
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    let c, h = 0, hair = 0, rough = 0.85;
    if (box <= HB + 0.005) {
      const ix = Math.floor((x + HB) / CELL), iz = Math.floor((z + HB) / CELL);
      const tone = hash(ix, iz, 3), tint = hash(ix, iz, 4), lx = (x + HB) - (ix + 0.5) * CELL, lz = (z + HB) - (iz + 0.5) * CELL;
      c = mix3(stone, stone2, tone);
      c = mix3(c, tint < 0.5 ? [0.46, 0.42, 0.35] : [0.36, 0.4, 0.4], Math.abs(tint - 0.5) * 0.8); // je Platte wärmer oder kühler
      c = mix3(c, [0.52, 0.5, 0.44], fbm(x * 3, z * 3, 3, 702) * 0.4);
      c = mix3(c, [c[0] * 0.72, c[1] * 0.74, c[2] * 0.72], smooth(0.6, 0.75, fbm(x * 1.4 + ix, z * 1.4 + iz, 4, 711)) * 0.6); // Verwitterung
      // Ränder der Platten abgerundet (dunkler), Flecken und Haarrisse
      const e = CELL / 2 - Math.max(Math.abs(lx), Math.abs(lz));
      c = mix3(c, [c[0] * 0.66, c[1] * 0.66, c[2] * 0.64], (1 - smooth(0.0, 0.09, e + (noise(x * 6, z * 6, 712) - 0.5) * 0.04)) * 0.8);
      h = -(1 - smooth(0.0, 0.07, e)) * 0.006 + (fbm(x * 8, z * 8, 2, 703) - 0.5) * 0.001;
      // Wurzelhaare in den Fugen: geschlängelte Linien nahe den Rasterlinien
      const gx = Math.abs(((x + HB) / CELL + 0.5) % 1 - 0.5) * CELL, gz = Math.abs(((z + HB) / CELL + 0.5) % 1 - 0.5) * CELL;
      const wx = gx - 0.012 * Math.sin(z * 9 + noise(x, z * 2, 704) * 4), wz = gz - 0.012 * Math.sin(x * 9 + noise(x * 2, z, 705) * 4);
      hair = Math.max(1 - smooth(0.002, 0.006, Math.abs(wx)), 1 - smooth(0.002, 0.006, Math.abs(wz))) * smooth(0.3, 0.5, noise(x * 1.5, z * 1.5, 706) + 0.2);
      c = mix3(c, [0.55, 0.45, 0.33], hair * 0.7);
    } else {
      // Rand: grössere, unregelmässige Steine mit Erde dazwischen
      const [e] = __katalog.w2.cells(x, z, 0.42, 707);
      c = mix3(mix3(stone2, stone, fbm(x * 2, z * 2, 3, 708)), soil, 1 - smooth(0.008, 0.028, e));
      c = mix3(c, [c[0] * 0.75, c[1] * 0.75, c[2] * 0.74], (1 - smooth(0.02, 0.09, e)) * 0.6);
      h = smooth(0.01, 0.09, e) * 0.008;
      rough = 0.92;
    }
    return [c, rough, h, hair];
  }, null, 0.0003);
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.4,
    // Raster: die Fugen zwischen den Platten; Einlegelinie: Fuge zwischen Feld und Rand, dunkel
    groove: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.1, 0.08), floorGroove * 0.85);',
    replace: [['float lw = 0.00458;', 'float lw = 0.006;'], ['float r1 = abs(box - (halfBoard + 0.16));', 'float r1 = abs(box - (halfBoard + 0.012));']],
    inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.12, 0.09, 0.07), floorInlay);', bevel: '', bevelRough: '', refl: 0.08,
    decl: 'uniform sampler2D uHair;', uniforms: { uHair: { value: s.mask } },
    // Lichtwelle: Saft leuchtet in den Wurzelhaaren der Fugen, die Wurzeln selbst (eigene Körper) glühen mit
    wave: `
        float hr = texture2D(uHair, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += vec3(0.6, 1.3, 0.55) * max(hr, floorGroove * 0.6) * (wide * 2.0 + trail * 0.5) * k;
        gl_FragColor.rgb += (uShockColor * 0.3 + vec3(0.2, 0.35, 0.15)) * ring * k * 0.45;`,
  });
  // Seiten: Mauerwerk aus Bruchstein
  const side = L.sideTex(4096, 160, (u, v) => {
    const [e] = __katalog.w2.cells(u, v * 0.38, 0.16, 709);
    let c = mix3(stone2, stone, fbm(u * 3, v * 2, 3, 710));
    return mix3(c, soil, 1 - smooth(0.006, 0.018, e));
  });
  L.sides(L.sideMat(L.tex(side), { glow: 0.28, roughness: 0.92 }));
  L.hide('plateTrim');
  // Wurzeln: kommen im Rand aus dem Boden, kriechen über die Kante, umfassen die Seite und hängen darunter
  const tubes = [];
  const rootCol = () => mix3([0.06, 0.05, 0.04], [0.11, 0.09, 0.07], r()); // linear: dunkles Graubraun
  const SIDE = HP - 0.05;
  const one = (thick, along, sideSign, axis) => {
    // axis 0: Seite bei x = ±, 1: bei z = ±; along: Lage längs der Seite; die Wurzel kriecht längs über den Rand
    const P = (inward, y, t) => (axis === 0 ? [sideSign * (SIDE - inward), y, t] : [t, y, sideSign * (SIDE - inward)]);
    const d = (r() < 0.5 ? -1 : 1) * (0.8 + r() * 1.4), w = () => (r() - 0.5) * 0.12;
    const t0 = Math.max(-HP + 0.4 + Math.max(0, -d * 1.4), Math.min(HP - 0.4 - Math.max(0, d * 1.4), along));
    const pts = [P(0.5 + w(), -0.05, t0), P(0.4 + w(), 0.02, t0 + d * 0.3), P(0.32 + w(), thick * 0.6, t0 + d * 0.6), P(0.22 + w(), thick * 0.5, t0 + d * 0.9),
      P(0.06, thick * 0.4, t0 + d * 1.15), P(0.0, -0.06, t0 + d * 1.27), P(0.0, -0.22, t0 + d * 1.35), P(0.0, -0.37, t0 + d * 1.4)];
    // darunter nach innen und hinab, sich windend
    const depth = 0.9 + r() * 1.5;
    for (let k = 1; k <= 4; k++) pts.push(P(0.25 + k * (0.25 + r() * 0.3), -0.42 - depth * k / 4, t0 + d * 1.4 + (r() - 0.5) * 0.6 * k));
    tubes.push(WD.tube(pts, thick, thick * 0.12, 64, 8, rootCol()));
    // Seitenwurzeln: eine kleine im Rand, zwei unten
    const q = pts[2];
    tubes.push(WD.tube([q, [q[0] + (r() - 0.5) * 0.4, 0.01, q[2] + (r() - 0.5) * 0.4], [q[0] + (r() - 0.5) * 0.7, -0.04, q[2] + (r() - 0.5) * 0.7]].map(([x, y, z]) => [Math.max(-SIDE, Math.min(SIDE, x)), y, Math.max(-SIDE, Math.min(SIDE, z))]), thick * 0.45, thick * 0.15, 16, 6, rootCol()));
    for (let b = 0; b < 2; b++) {
      const k0 = 8 + Math.floor(r() * 3), p0 = pts[k0], len = 0.4 + r() * 0.8;
      const bp = [p0, [p0[0] + (r() - 0.5) * len, p0[1] - len * 0.4, p0[2] + (r() - 0.5) * len], [p0[0] + (r() - 0.5) * len * 1.6, p0[1] - len, p0[2] + (r() - 0.5) * len * 1.6]];
      tubes.push(WD.tube(bp, thick * 0.45, thick * 0.08, 16, 6, rootCol()));
    }
  };
  for (let i = 0; i < 22; i++) {
    const axis = i % 2, sg = (i >> 1) % 2 ? -1 : 1, along = (r() * 2 - 1) * (HP - 0.5);
    one(0.04 + r() * 0.04, along, sg, axis);
  }
  // Ecken: je eine dicke Wurzel diagonal über die Ecke
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const pts = [[sx * 4.3, -0.05, sz * 4.55], [sx * 4.6, 0.07, sz * 4.62], [sx * 4.82, 0.04, sz * 4.8], [sx * 4.84, -0.2, sz * 4.84], [sx * 4.82, -0.4, sz * 4.8],
      [sx * 4.2, -0.9, sz * 4.1], [sx * 3.4, -1.6, sz * 3.6], [sx * 2.8, -2.6, sz * 2.9]];
    tubes.push(WD.tube(pts, 0.08, 0.015, 64, 9, rootCol()));
  }
  const rootMat = L.withWave(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, emissive: new T.Color(0.05, 0.045, 0.04) }), `{
      ${L.RING}
      float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
      float vein = 0.5 + 0.5 * sin(vW.y * 18.0 + sd * 6.0 - uShock.x * 8.0);
      gl_FragColor.rgb += vec3(0.55, 1.2, 0.5) * (wide * 1.4 + trail * 0.45) * (0.6 + vein * 0.4) * min(1.0, uShock.y * 3.0);
    }`);
  const roots = new T.Mesh(WD.merge(tubes), rootMat);
  roots.castShadow = true; roots.receiveShadow = true;
  D.scene.add(roots);
  return 'Wurzelgeflecht';
};
