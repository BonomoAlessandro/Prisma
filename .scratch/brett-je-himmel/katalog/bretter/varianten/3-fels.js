// 3 Gezeitenfels: Brett aus dem Fels der Bucht, Feld glatt gewaschen, auf dem Rand Seepocken, Muscheln, Tang
__katalog.varianten.fels = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng, parts } = L;
  const r = rng(5);
  const pink = [0.66, 0.47, 0.40], mauve = [0.42, 0.34, 0.37], pale = [0.80, 0.63, 0.52];
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const field = 1 - smooth(HB + 0.05, HB + 0.3, box);
    const g = fbm(x * 0.55, z * 0.55, 5, 31), m2 = fbm(x * 2.4, z * 2.4, 3, 32);
    const speck = noise(x * 180, z * 180, 33);
    let c = mix3(pink, mauve, smooth(0.35, 0.7, g) * 0.45);
    c = mix3(c, pale, smooth(0.6, 0.9, m2) * 0.35);
    c = mix3(c, speck > 0.82 ? [0.92, 0.86, 0.8] : speck < 0.12 ? [0.2, 0.17, 0.2] : c, 0.6);
    // Risse auf dem Rand
    const crack = 1 - smooth(0.0, 0.02, Math.abs(fbm(x * 0.8, z * 0.8, 4, 34) - 0.5));
    c = mix3(c, [0.2, 0.15, 0.17], crack * (1 - field) * 0.8);
    // Grünbelag und nasse Zone am äusseren Rand
    const edge = smooth(HP - 0.5, HP, box);
    const algae = smooth(0.5, 0.65, fbm(x * 1.3, z * 1.3, 4, 35)) * edge * (1 - field);
    c = mix3(c, [0.25, 0.38, 0.17], algae * 0.8);
    c = mix3(c, [c[0] * 0.7, c[1] * 0.7, c[2] * 0.72], edge * 0.5 * (1 - field));
    const rough = mix(0.88 - algae * 0.3, 0.32 + 0.2 * m2, field);
    const h = mix((g - 0.5) * 0.03 + (m2 - 0.5) * 0.01 - crack * 0.006, (m2 - 0.5) * 0.0015, field) + (speck - 0.5) * 0.0005;
    return [c, rough, h];
  }, null, 0.0003);
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.5,
    groove: 'diffuseColor.rgb *= 1.0 - floorGroove * 0.55;',
    inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.82, 0.74), floorInlay);',
    bevel: 'diffuseColor.rgb *= 1.0 - floorBevel * 0.4;', bevelRough: '',
    refl: 0.4,
    // Lichtwelle: ein Wasserfilm läuft über den Fels; dahinter glänzt er nass
    wave: `
        float front = exp(-pow((sd - uShock.x) / (uShock.z * 1.2), 2.0));
        float wetB = smoothstep(uShock.x - 2.6, uShock.x, sd) * (1.0 - smoothstep(uShock.x - 0.02, uShock.x + 0.08, sd));
        float k = min(1.0, uShock.y * 2.5);
        gl_FragColor.rgb *= 1.0 - 0.3 * wetB * k;
        gl_FragColor.rgb += vec3(0.30, 0.42, 0.46) * wetB * 0.12 * k;
        gl_FragColor.rgb += (uShockColor + vec3(0.35, 0.45, 0.5)) * front * uShock.y * 1.4;`,
  });
  const side = L.sideTex(2048, 128, (u, v) => {
    const g = fbm(u * 1.2, v * 3, 4, 41), sp = noise(u * 160, v * 40, 42);
    let c = mix3(pink, mauve, smooth(0.3, 0.7, g));
    c = mix3(c, [0.24, 0.36, 0.16], smooth(0.55, 0.85, v + (fbm(u * 3, 0, 2, 43) - 0.5) * 0.4) * 0.85);
    c = mix3(c, [0.82, 0.76, 0.7], sp > 0.85 ? 0.5 : 0);
    return c;
  });
  L.sides(L.sideMat(L.tex(side), { roughness: 0.8, glow: 0.3 }));
  L.hide('plateTrim');

  const g = new T.Group();
  const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(), P = new T.Vector3(), E = new T.Euler();
  const rimPoint = (minIn = HB + 0.28) => {
    for (;;) {
      const x = (r() * 2 - 1) * (HP - 0.03), z = (r() * 2 - 1) * (HP - 0.03);
      const box = Math.max(Math.abs(x), Math.abs(z));
      if (box < minIn) continue;
      const dens = fbm(x * 1.6 + 10, z * 1.6, 3, 50) * 1.6 - 0.45 + smooth(HB + 0.3, HP, box) * 0.5;
      if (r() < dens) return [x, z];
    }
  };
  // Seepocken auf dem Rand und an den Seiten
  const barnGeo = new T.CylinderGeometry(0.011, 0.034, 0.032, 7, 1);
  barnGeo.translate(0, 0.012, 0);
  const barnMat = new T.MeshStandardMaterial({ color: 0xd9d2c4, roughness: 0.75, envMapIntensity: 1.2, flatShading: true });
  const NB = 1300, barn = new T.InstancedMesh(barnGeo, barnMat, NB);
  for (let i = 0; i < NB; i++) {
    const sc = 0.6 + r() * 0.9;
    if (i < 800) {
      const [x, z] = rimPoint();
      P.set(x, 0, z); Q.setFromEuler(E.set((r() - 0.5) * 0.3, r() * 6.3, (r() - 0.5) * 0.3));
    } else {
      const face = Math.floor(r() * 4), t = (r() * 2 - 1) * (HP - 0.02), y = -0.05 - Math.pow(r(), 1.6) * 0.33;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]][face];
      if (fbm(t * 1.8, y * 4 + face * 9, 3, 51) < 0.45) { i--; continue; }
      P.set(n[0] ? n[0] * HP : t, y, n[1] ? n[1] * HP : t);
      Q.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(n[0], 0, n[1]));
    }
    S.setScalar(sc);
    barn.setMatrixAt(i, M.compose(P, Q, S));
    const c = 0.75 + r() * 0.3;
    barn.setColorAt(i, new T.Color(c, c * 0.97, c * 0.92));
  }
  barn.castShadow = true; barn.receiveShadow = true;
  g.add(barn);
  // Miesmuscheln in zwei Ecken
  const musGeo = new T.SphereGeometry(1, 10, 6);
  const musMat = new T.MeshStandardMaterial({ color: 0x1a1d2c, roughness: 0.28, envMapIntensity: 1.8 });
  const NM = 220, mus = new T.InstancedMesh(musGeo, musMat, NM);
  for (let i = 0; i < NM; i++) {
    const corner = i % 2 ? [-1, -1] : [1, 1];
    const a = r() * Math.PI / 2, d = Math.sqrt(r()) * 0.9;
    const x = corner[0] * (HP - 0.12 - Math.cos(a) * d * 0.8), z = corner[1] * (HP - 0.12 - Math.sin(a) * d * 0.8);
    if (Math.max(Math.abs(x), Math.abs(z)) < HB + 0.3) { i--; continue; }
    P.set(x, 0.012, z); Q.setFromEuler(E.set((r() - 0.5) * 0.8, r() * 6.3, (r() - 0.5) * 0.6));
    S.set(0.055 + r() * 0.02, 0.018, 0.026);
    mus.setMatrixAt(i, M.compose(P, Q, S));
  }
  mus.castShadow = true;
  g.add(mus);
  // Napfschnecken
  const limGeo = new T.ConeGeometry(0.036, 0.022, 12); limGeo.translate(0, 0.011, 0);
  const lim = new T.InstancedMesh(limGeo, new T.MeshStandardMaterial({ color: 0xb8a48c, roughness: 0.6, envMapIntensity: 1.2 }), 70);
  for (let i = 0; i < 70; i++) {
    const [x, z] = rimPoint();
    P.set(x, 0, z); Q.identity(); S.setScalar(0.8 + r() * 0.6);
    lim.setMatrixAt(i, M.compose(P, Q, S));
  }
  g.add(lim);
  // Tang: Bänder vom Rand über die Kante hinunter
  const weed = (x, z, nx, nz, len, wdt, color) => {
    const segs = 14, pos = [], idx = [];
    const tx = -nz, tz = nx; // quer
    const flatLen = 0.12 + r() * 0.25;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, d = t * len;
      let px, py, pz;
      if (d < flatLen) { px = x + nx * d; pz = z + nz * d; py = 0.006; }
      else { const dd = d - flatLen; px = x + nx * (flatLen + Math.min(dd, 0.03)); pz = z + nz * (flatLen + Math.min(dd, 0.03)); py = 0.006 - dd; }
      const sway = Math.sin(t * 5 + x * 3) * 0.04 * t;
      const w = wdt * (1 - t * 0.5) * (0.8 + 0.4 * Math.sin(t * 9 + z));
      for (const sgn of [-1, 1]) pos.push(px + tx * (sgn * w + sway), py, pz + tz * (sgn * w + sway));
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const col = new T.Color(color);
    const mesh = new T.Mesh(geo, new T.MeshStandardMaterial({ color: col, roughness: 0.45, side: T.DoubleSide, envMapIntensity: 1.2, emissive: col.clone().multiplyScalar(0.45) }));
    mesh.castShadow = true;
    g.add(mesh);
  };
  const clusters = [[-2.6, 1], [1.4, 1], [3.2, 0], [-1.0, 3], [2.5, 2], [-3.4, 0], [0.4, 2]];
  for (const [t, face] of clusters) {
    const n = [[0, 1], [1, 0], [0, -1], [-1, 0]][face];
    for (let k = 0; k < 7; k++) {
      const tt = t + (r() - 0.5) * 0.7;
      const start = HP - 0.3 - r() * 0.15;
      const x = n[0] ? n[0] * start : tt, z = n[1] ? n[1] * start : tt;
      const kelp = r() < 0.4;
      weed(x, z, n[0], n[1], 0.7 + r() * 0.7, kelp ? 0.05 : 0.085, kelp ? 0x5c4a1c : (r() < 0.5 ? 0x4f8a2c : 0x3d7a34));
    }
  }
  // Seestern auf der Ecke
  const star = new T.Shape();
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2, rr = i % 2 ? 0.05 : 0.15;
    i ? star.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : star.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  const starGeo = new T.ExtrudeGeometry(star, { depth: 0.02, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 });
  const starMesh = new T.Mesh(starGeo, new T.MeshStandardMaterial({ color: 0xd8662e, roughness: 0.7, envMapIntensity: 1.1 }));
  starMesh.rotation.x = -Math.PI / 2; starMesh.rotation.z = 0.4; starMesh.position.set(-HP + 0.35, 0.018, HP - 0.42);
  starMesh.castShadow = true;
  g.add(starMesh);
  D.scene.add(g);
  return 'Gezeitenfels';
};
