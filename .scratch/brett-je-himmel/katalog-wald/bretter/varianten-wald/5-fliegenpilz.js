// W5 Fliegenpilz: das Brett ist der Hut eines riesigen Fliegenpilzes. Das Feld ist die blassere, orangerote Mitte des
// Huts, im Rand sitzen weisse Warzen auf Scharlachrot. Der Hutrand rollt sich ein, darunter die hellen Lamellen und ein
// weisser Stiel mit Manschette und Knolle. Lichtwelle als Hexenring: Sporen steigen leuchtend auf, die Warzen glimmen
__katalog.varianten.fliegenpilz = async (L) => {
  const { T, D, PLATE, HB, HP, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const W2 = __katalog.w2, WD = __katalog.wald, r = rng(601);
  // Oberseite etwas kleiner, damit sich der Hutrand darunter nach aussen wölben kann (bis 4.88)
  const R = (a) => Math.min(WD.rsq(a, 4.7, 1.4) + (noise(Math.cos(a) * 5 + 1, Math.sin(a) * 5, 602) - 0.5) * 0.06, 4.7 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))));
  const { Rof, pts } = WD.polar(R);
  const center = [0.72, 0.38, 0.17], mid = [0.62, 0.16, 0.09], edge = [0.5, 0.08, 0.06];
  const s = L.surface(2048, (x, z) => {
    const q = Math.hypot(x, z) / Rof(x, z); // 0 Mitte … 1 Hutrand
    const a = Math.atan2(z, x);
    const fib = noise(a * 120, q * 6, 603), blot = fbm(x * 0.6, z * 0.6, 3, 604);
    let c = mix3(center, mid, smooth(0.25, 0.8, q + (blot - 0.5) * 0.2));
    c = mix3(c, edge, smooth(0.85, 1.0, q));
    c = mix3(c, [c[0] * 0.88, c[1] * 0.85, c[2] * 0.85], fib * 0.35); // feine Fasern
    // Riefung am Hutrand
    const stri = Math.pow(Math.abs(Math.sin(a * 140)), 6) * smooth(0.9, 0.99, q);
    c = mix3(c, [c[0] * 0.75, c[1] * 0.7, c[2] * 0.7], stri * 0.6);
    return [c, mix(0.42, 0.55, fib), (fib - 0.5) * 0.0004 - stri * 0.001];
  }, ({ color, px }) => W2.clip(color, px, pts), 0.00025);
  D.floorMaterial.alphaTest = 0.5;
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.7,
    // Raster: feine weisse Linien wie Reste der Hülle; Einlegelinie: weiss, etwas breiter
    groove: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.96, 0.92, 0.84), floorGroove * 0.7);',
    replace: [['float lw = 0.00458;', 'float lw = 0.0055;'], ['float iw = 0.011;', 'float iw = 0.022;']],
    inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.97, 0.94, 0.88), floorInlay);',
    bevel: '', bevelRough: '', refl: 0.22,
    // Lichtwelle: Hexenring, warmes Weiss; die Sporen und Warzen machen den Rest
    wave: `
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 2.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.4 + vec3(0.6, 0.52, 0.4)) * (ring * 0.8 + wide * 0.2 + trail * 0.4) * k;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // Hutrand rollt sich ein (rot), darunter Lamellen (hell), dann der Ansatz des Stiels
  const ST = 0.72; // Stielradius oben
  const prof = [[0, 1, 'r'], [-0.05, 1.022, 'r'], [-0.13, 1.036, 'r'], [-0.24, 1.03, 'r'], [-0.34, 1.0, 'r'], [-0.41, 0.955, 'r'], [-0.44, 0.92, 'l'],
    [-0.5, 0.72, 'l'], [-0.56, 0.48, 'l'], [-0.62, 0.25, 'l'], [-0.66, 0.15, 'l']];
  const rings = prof.map(([y, f]) => [y, (x, z) => {
    if (f >= 0.5) return [x * f, z * f];
    const l = Math.hypot(x, z), rr = Math.max(ST, l * f); // innen auf den Stiel zulaufen
    return [x / l * rr, z / l * rr];
  }]);
  const hull = W2.hull(pts, rings, (y, x, z, k) => {
    if (prof[k]?.[2] === 'r' || k === undefined) return mix3(edge, [0.36, 0.05, 0.04], clamp(-y * 2.2));
    const a = Math.atan2(z, x), g = Math.pow(Math.abs(Math.sin(a * 90)), 3); // Lamellen
    return mix3([0.95, 0.9, 0.8], [0.72, 0.66, 0.56], g * 0.7 + clamp(-y - 0.3) * 0.4);
  });
  hull.material.flatShading = false; hull.material.emissive.set(0.34, 0.3, 0.28);
  D.scene.add(hull);
  // Stiel mit Manschette und Knolle
  const stemMat = new T.MeshStandardMaterial({ color: 0xf1ece0, roughness: 0.75, emissive: 0x3c3a36 });
  const stem = new T.Mesh(new T.LatheGeometry([[0, -3.6], [0.95, -3.55], [1.12, -3.25], [1.05, -2.9], [0.82, -2.6], [0.7, -2.0], [0.66, -1.2], [0.7, -0.62], [0.0, -0.62]].map(([x, y]) => new T.Vector2(x, y)), 40), stemMat);
  stem.castShadow = true; D.scene.add(stem);
  const skirt = new T.Mesh(new T.LatheGeometry([[0.68, -0.95], [0.9, -1.05], [1.08, -1.3], [1.12, -1.45], [1.05, -1.48]].map(([x, y]) => new T.Vector2(x, y)), 48), new T.MeshStandardMaterial({ color: 0xfaf5ea, roughness: 0.8, side: T.DoubleSide, emissive: 0x403c36 }));
  D.scene.add(skirt);
  // Warzen: weisse, flache Brocken im Rand, auf der Knolle als Ringe
  const glowWarts = `{
      ${L.RING}
      float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
      gl_FragColor.rgb += vec3(1.3, 1.25, 1.1) * (wide * 1.2 + trail * 0.25) * min(1.0, uShock.y * 3.0);
    }`;
  const wartMat = L.withWave(new T.MeshStandardMaterial({ color: 0xf6f2ea, roughness: 0.85, flatShading: true, emissive: 0x4a4640 }), glowWarts);
  const warts = [];
  for (let i = 0; i < 900; i++) {
    const x = (r() * 2 - 1) * HP, z = (r() * 2 - 1) * HP, q = Math.hypot(x, z) / Rof(x, z), box = Math.max(Math.abs(x), Math.abs(z));
    if (box < HB + 0.1 || q > 0.97) continue;
    const sz = 0.07 + r() * 0.13;
    warts.push({ p: [x, 0.0, z], r: [r() * 6.3, r() * 6.3, r() * 6.3], s: [sz, sz * (0.35 + r() * 0.3), sz] });
  }
  for (let i = 0; i < 260; i++) { // Warzen auf dem eingerollten Hutrand
    const a = r() * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a), rr = R(a) * 1.03, y = -0.06 - r() * 0.22;
    const sz = 0.05 + r() * 0.08;
    warts.push({ p: [dx * rr, y, dz * rr], r: [r() * 6.3, r() * 6.3, r() * 6.3], s: [sz, sz * 0.5, sz] });
  }
  for (let i = 0; i < 60; i++) { // Hüllreste auf der Knolle
    const a = r() * Math.PI * 2, y = -3.3 + r() * 0.5, rr = 1.05;
    warts.push({ p: [Math.cos(a) * rr, y, Math.sin(a) * rr], r: [r() * 6, r() * 6, r() * 6], s: [0.08, 0.05, 0.08] });
  }
  D.scene.add(WD.scatter(new T.IcosahedronGeometry(1, 0), wartMat, warts));
  // Sporen: leuchtende Pünktchen über dem Hut, nur im Ring sichtbar (additiv)
  const sporeMat = L.withWave(new T.MeshBasicMaterial({ color: 0x000000, transparent: true, blending: T.AdditiveBlending, depthWrite: false }), `{
      ${L.RING}
      float wide = exp(-pow((sd - uShock.x) / (uShock.z * 1.6), 2.0));
      float up = smoothstep(0.0, 0.9, vW.y) ;
      gl_FragColor.rgb = vec3(1.6, 1.4, 1.0) * wide * (1.0 - up * 0.7) * min(1.0, uShock.y * 3.0);
    }`);
  const spores = [];
  for (let i = 0; i < 2600; i++) {
    const x = (r() * 2 - 1) * (HP - 0.2), z = (r() * 2 - 1) * (HP - 0.2);
    spores.push({ p: [x, 0.04 + Math.pow(r(), 1.8) * 0.9, z], s: 0.012 + r() * 0.016 });
  }
  const sp = WD.scatter(new T.IcosahedronGeometry(1, 0), sporeMat, spores); sp.castShadow = false; sp.receiveShadow = false;
  D.scene.add(sp);
  return 'Fliegenpilz';
};
