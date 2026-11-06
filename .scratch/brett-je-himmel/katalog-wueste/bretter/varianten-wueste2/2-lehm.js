// D2 Lehmterrasse (Djenné): glatter Lehmputz im Feld, Rand mit Ziegeln, wo der Putz abgeplatzt ist; unter einem
// Gesims eine eingezogene Lehmwand mit herausragenden Palmholzbalken (Torons); Spitztürmchen mit Straussenei an den Ecken
__katalog.varianten.lehm = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng, parts } = L;
  const r = rng(81);
  const plaster = [0.83, 0.60, 0.42], plaster2 = [0.74, 0.52, 0.37], brick = [0.66, 0.44, 0.31];
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const g = fbm(x * 0.4, z * 0.4, 4, 82), straw = noise(x * 160, z * 160, 83);
    // Kellenstriche: flache Bögen
    const sw = Math.sin(Math.hypot(x - Math.round(x / 0.9) * 0.9, z - Math.round(z / 0.9) * 0.9 + 0.4) * 22 + g * 4);
    let c = mix3(plaster, plaster2, smooth(0.3, 0.75, g));
    c = mix3(c, [0.93, 0.78, 0.55], straw > 0.9 ? 0.5 : 0); // Stroh
    let h = sw * 0.0004 + (straw - 0.5) * 0.0004;
    // Rand: Putz stellenweise abgeplatzt, Ziegel sichtbar
    if (box > HB + 0.26) {
      const off = smooth(0.52, 0.56, fbm(x * 1.6, z * 1.6, 3, 84));
      const bx = (Math.abs(x) > Math.abs(z) ? z : x) / 0.32, by = box / 0.12;
      const row = Math.floor(by), jb = Math.abs(by - row - 0.5) > 0.42 || Math.abs(((bx + row * 0.5) % 1 + 1) % 1 - 0.5) > 0.45;
      const b = mix3(brick, [0.58, 0.38, 0.27], noise(Math.floor(bx + row * 0.5), row, 85));
      c = mix3(c, jb ? [0.50, 0.36, 0.28] : b, off);
      h -= off * 0.004 + (jb ? off * 0.002 : 0);
    }
    return [c, 0.92, h];
  }, null, 0.00025);
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.4,
    groove: 'diffuseColor.rgb *= 1.0 - floorGroove * 0.55;', inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.79, 0.6), floorInlay);',
    replace: [['float iw = 0.011;', 'float iw = 0.02;']],
    bevel: '', bevelRough: '', refl: 0.0,
    // Lichtwelle: warmes Abendlicht; es läuft in den Rillen des Rasters mit
    wave: `
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.6 + vec3(0.45, 0.3, 0.15)) * (ring * 1.1 + trail * 0.06) * k;
        gl_FragColor.rgb += vec3(1.6, 0.9, 0.35) * max(floorGroove, floorInlay) * (wide + trail * 0.3) * k * 1.6;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // Wandtextur: Lehmputz mit Regenrinnen
  const wall = L.sideTex(1024, 128, (u, v) => {
    const g = fbm(u * 1.5, v * 2, 3, 86), gully = smooth(0.62, 0.8, fbm(u * 9, v * 0.5, 2, 87));
    let c = mix3(plaster, plaster2, g);
    return mix3(c, [0.60, 0.42, 0.31], gully * 0.6);
  });
  const wt = L.tex(wall, true, true);
  const wallMat = L.sideMat(wt, { glow: 0.34, roughness: 0.95 });
  const g = new T.Group();
  // Gesims (volle Breite, 9 cm) und eingezogene Wand (9.3 m)
  const cornice = new T.Mesh(new T.BoxGeometry(PLATE, 0.09, PLATE), wallMat);
  cornice.position.y = -0.003 - 0.045; g.add(cornice);
  const W = 9.3, wallM = new T.Mesh(new T.BoxGeometry(W, 0.34, W), wallMat);
  wallM.position.y = -0.093 - 0.17; g.add(wallM);
  // Torons: Palmholzbalken, 22 cm aus der Wand
  const toron = new T.CylinderGeometry(0.028, 0.032, 0.3, 6); toron.rotateZ(Math.PI / 2);
  const tm = new T.MeshStandardMaterial({ color: 0x7d6650, roughness: 0.9, emissive: 0x2a2018 });
  const spots = [];
  for (const y of [-0.2, -0.34]) for (let t = -4.4; t <= 4.41; t += 0.55) {
    const tt = t + (y < -0.3 ? 0.27 : 0);
    if (Math.abs(tt) > 4.45) continue;
    spots.push([W / 2 + 0.07, y, tt, 0], [-W / 2 - 0.07, y, tt, Math.PI], [tt, y, W / 2 + 0.07, -Math.PI / 2], [tt, y, -W / 2 - 0.07, Math.PI / 2]);
  }
  const inst = new T.InstancedMesh(toron, tm, spots.length);
  const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(1, 1, 1), P = new T.Vector3();
  spots.forEach(([x, y, z, a], i) => { P.set(x, y, z); Q.setFromAxisAngle(new T.Vector3(0, 1, 0), a + (r() - 0.5) * 0.1); inst.setMatrixAt(i, M.compose(P, Q, S)); });
  inst.castShadow = true; g.add(inst);
  // Spitztürmchen mit Straussenei auf den Ecken des Rands
  const pin = new T.LatheGeometry([0, 0.3, 0.28, 0.22, 0.12, 0.04, 0].map((rr, i) => new T.Vector2(rr, i * 0.09)), 12);
  const egg = new T.SphereGeometry(0.055, 12, 8); egg.scale(1, 1.3, 1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const p = new T.Mesh(pin, L.sideMat(wt, { glow: 0.34 })); p.position.set(sx * 4.55, 0, sz * 4.55); p.castShadow = true; g.add(p);
    const e = new T.Mesh(egg, new T.MeshStandardMaterial({ color: 0xf4efe4, roughness: 0.4, emissive: 0x403c34 })); e.position.set(sx * 4.55, 0.6, sz * 4.55); g.add(e);
  }
  D.scene.add(g);
  return 'Lehmterrasse';
};
