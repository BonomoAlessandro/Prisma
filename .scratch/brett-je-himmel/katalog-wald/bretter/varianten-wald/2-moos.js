// W2 Moospolster: das Brett ist ein Stück Waldboden, das sich gelöst hat. Das Feld ist kurzer Samtmoos wie im
// Moostempel, im Rand liegen dicke Polster mit leuchtenden Helmlingen und Farn an den Ecken, die Seiten sind die
// Erdscholle mit Steinen und Wurzeln. Lichtwelle wie der Waldgott in Mononoke: wo der Ring vorbeizieht, blühen
// kleine Blumen auf und welken hinter ihm
__katalog.varianten.moos = async (L) => {
  const { T, D, PLATE, HB, HP, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const WD = __katalog.wald, r = rng(301);
  const moss = [0.24, 0.36, 0.17], mossDark = [0.17, 0.27, 0.14], mossTip = [0.38, 0.49, 0.23], mossGold = [0.36, 0.40, 0.17];
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const clump = fbm(x * 14, z * 14, 3, 302), tip = noise(x * 150, z * 150, 303), patch = fbm(x * 0.55, z * 0.55, 3, 304);
    const inF = 1 - smooth(HB, HB + 0.12, box);
    let c = mix3(mossDark, moss, mix(smooth(0.28, 0.72, clump), 0.55 + (clump - 0.5) * 0.5, inF)); // im Feld ruhiger
    c = mix3(c, mossTip, tip * 0.35 * smooth(0.3, 0.8, clump));
    c = mix3(c, mossGold, smooth(0.5, 0.8, patch) * 0.3);
    let h = (clump - 0.5) * 0.008 + (tip - 0.5) * 0.0015;
    // Rand: unter den Polstern Nadelstreu
    if (box > HB + 0.12) {
      const nd = Math.pow(Math.abs(Math.sin(x * 60 + noise(x * 3, z * 3, 305) * 9) * Math.sin(z * 55 + noise(z * 3, x * 3, 306) * 9)), 8);
      c = mix3(c, [0.36, 0.24, 0.14], smooth(HB + 0.12, HB + 0.3, box) * (0.4 + nd * 0.5));
    }
    return [c, 1.0, h];
  }, null, 0.0004);
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.35,
    // Raster: Linien aus hellem Silbermoos; keine Einlegelinie, die Polster beginnen am Feld
    groove: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.58, 0.44), floorGroove * 0.6);',
    replace: [['float lw = 0.00458;', 'float lw = 0.0075;']],
    inlay: '', inlayRough: '', bevel: '', bevelRough: '', refl: 0.0,
    // Lichtwelle: grünlich-goldener Hauch über dem Moos; die Blumen (eigene Körper) blühen im Ring auf
    wave: `
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 2.5), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.3 + vec3(0.35, 0.55, 0.18)) * (ring * 0.7 + wide * 0.3 + trail * 1.5) * k;`,
  });
  L.hide('plateTrim');
  // Erdscholle: oben Moos, das über die Kante hängt, darunter Humus mit Steinen und Wurzelfäden
  const side = L.sideTex(4096, 160, (u, v) => {
    const drip = 0.18 + fbm(u * 3, 0.5, 3, 307) * 0.22 + Math.pow(noise(u * 9, 1, 308), 4) * 0.25;
    const stone = smooth(0.66, 0.72, fbm(u * 6, v * 2.2, 3, 309)), soil = fbm(u * 20, v * 6, 4, 310);
    let c = mix3([0.17, 0.12, 0.09], [0.26, 0.19, 0.13], soil);
    c = mix3(c, [0.43, 0.42, 0.40], stone * (0.7 + noise(u * 40, v * 10, 311) * 0.3));
    const rootl = 1 - smooth(0.0, 0.04, Math.abs(Math.sin(u * 7 + v * 3 + fbm(u * 2, v, 2, 312) * 6)));
    c = mix3(c, [0.48, 0.36, 0.24], rootl * smooth(0.3, 0.5, v) * 0.5);
    const m = 1 - smooth(drip - 0.03, drip + 0.03, v);
    return mix3(c, mix3(mossDark, moss, noise(u * 30, v * 8, 313)), m);
  });
  L.sides(L.sideMat(L.tex(side), { glow: 0.3, roughness: 1 }));
  const g = new T.Group();
  // Polster im Rand: weiche Kuppeln mit feiner Moosstruktur
  const mtex = WD.picture(512, 512, (x, w) => {
    const im = x.createImageData(w, w);
    for (let j = 0; j < w; j++) for (let i = 0; i < w; i++) {
      const n = noise(i * 0.35, j * 0.35, 314) * 0.6 + noise(i * 0.08, j * 0.08, 315) * 0.4, k = (j * w + i) * 4;
      const c = mix3(mossDark, mossTip, n);
      im.data[k] = c[0] * 255; im.data[k + 1] = c[1] * 255; im.data[k + 2] = c[2] * 255; im.data[k + 3] = 255;
    }
    x.putImageData(im, 0, 0);
  });
  mtex.wrapS = mtex.wrapT = T.RepeatWrapping; mtex.repeat.set(3, 2);
  const cushionMat = new T.MeshStandardMaterial({ map: mtex, roughness: 1, envMapIntensity: 0.6, emissiveMap: mtex, emissive: new T.Color(0.22, 0.24, 0.2) });
  const cushions = [];
  for (let i = 0; i < 420; i++) {
    const [x, z, box] = WD.inRim(r, HB + 0.1, HP - 0.12);
    const big = 0.14 + r() * 0.22, out = (box - HB) / (HP - HB);
    const c = mix3([0.8, 0.95, 0.75], [1.15, 1.1, 0.8], r());
    cushions.push({ p: [x, -0.03, z], r: [0, r() * 6.3, 0], s: [big * (1 + r() * 0.4), (0.05 + r() * 0.08) * (1.2 - out * 0.5), big], c });
  }
  g.add(WD.scatter(new T.SphereGeometry(1, 20, 12), cushionMat, cushions));
  // Helmlinge in Grüppchen: Glockenhut auf dünnem Stiel, leuchten schwach grünlich
  const capG = new T.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55); capG.scale(1, 1.1, 1);
  const stemG = new T.CylinderGeometry(0.12, 0.16, 1, 6); stemG.translate(0, 0.5, 0);
  const glowWave = `{
      ${L.RING}
      float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
      gl_FragColor.rgb += vec3(0.5, 1.4, 0.7) * (wide * 1.6 + trail * 0.4) * min(1.0, uShock.y * 3.0);
    }`;
  const capMat = L.withWave(new T.MeshStandardMaterial({ color: 0xc9d8b0, roughness: 0.6, emissive: new T.Color(0.32, 0.62, 0.38) }), glowWave);
  const stemMat = new T.MeshStandardMaterial({ color: 0xd8dcc8, roughness: 0.7, emissive: new T.Color(0.16, 0.24, 0.16) });
  const caps = [], stems = [];
  const spots = [[-4.55, -4.5], [4.5, -4.6], [4.6, 4.45], [-4.45, 4.6], [0.4, -4.6], [-4.6, 1.2], [4.62, -1.6], [-1.8, 4.62], [2.4, 4.55], [-2.5, -4.62], [4.58, 2.1], [-4.6, -2.3]];
  for (const [cx, cz] of spots) {
    const n = 4 + Math.floor(r() * 5);
    for (let i = 0; i < n; i++) {
      const x = cx + (r() - 0.5) * 0.4, z = cz + (r() - 0.5) * 0.4;
      if (Math.max(Math.abs(x), Math.abs(z)) > HP - 0.06 || Math.max(Math.abs(x), Math.abs(z)) < HB + 0.08) continue;
      const hgt = 0.1 + r() * 0.14, rad = 0.035 + r() * 0.035, tilt = [(r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4];
      stems.push({ p: [x, 0.02, z], r: tilt, s: [rad * 0.5, hgt, rad * 0.5] });
      const top = new T.Vector3(0, hgt, 0).applyEuler(new T.Euler(...tilt));
      caps.push({ p: [x + top.x, 0.02 + top.y - rad * 0.3, z + top.z], r: tilt, s: rad, c: mix3([0.85, 0.9, 0.75], [1, 1, 1], r()) });
    }
  }
  g.add(WD.scatter(stemG, stemMat, stems), WD.scatter(capG, capMat, caps));
  // Farn an den Ecken und vereinzelt am Rand: Wedel als gebogene Fläche mit Bild
  const frondTex = WD.picture(256, 1024, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.strokeStyle = '#6f8a3c'; x.lineWidth = 6; x.beginPath(); x.moveTo(w / 2, h); x.lineTo(w / 2, 20); x.stroke();
    for (let k = 0; k < 34; k++) {
      const t = k / 34, y = h - 60 - t * (h - 90), len = (1 - t * 0.85) * (w * 0.46) * (t < 0.08 ? 0.6 : 1);
      for (const sgn of [-1, 1]) {
        x.fillStyle = k % 2 ? '#3f6a26' : '#456f2a';
        x.beginPath(); x.moveTo(w / 2, y);
        x.quadraticCurveTo(w / 2 + sgn * len * 0.5, y - 26, w / 2 + sgn * len, y - 14 - t * 10);
        x.quadraticCurveTo(w / 2 + sgn * len * 0.5, y + 8, w / 2, y + 10);
        x.fill();
      }
    }
  });
  const frondG = new T.PlaneGeometry(0.32, 1, 1, 10);
  { // Wedel: steigt auf und biegt sich nach aussen (+z) über
    const p = frondG.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = p.getY(i) + 0.5, a = 1.15 - t * 1.9; // Winkel über der Waagrechten
      let y = 0, zz = 0; for (let k = 0; k < 20; k++) { const aa = 1.15 - (t * k / 20) * 1.9; y += Math.sin(aa) * t / 20; zz += Math.cos(aa) * t / 20; }
      p.setXYZ(i, p.getX(i) * (1 - t * 0.6), y - Math.abs(p.getX(i)) * 0.25 + 0 * a, zz);
    }
    frondG.computeVertexNormals();
  }
  const frondMat = new T.MeshStandardMaterial({ map: frondTex, alphaTest: 0.5, side: T.DoubleSide, roughness: 0.8, emissiveMap: frondTex, emissive: new T.Color(0.35, 0.4, 0.3) });
  const fronds = [];
  const clumps = [[-4.45, -4.45, 11], [4.45, -4.45, 9], [4.45, 4.45, 11], [-4.45, 4.45, 9], [-4.62, -0.6, 5], [4.62, 0.9, 5], [1.4, 4.62, 5], [-1.2, -4.62, 4]];
  for (const [cx, cz, n] of clumps) {
    const outA = Math.atan2(cx, cz); // nach aussen
    for (let i = 0; i < n; i++) {
      const a = outA + (r() - 0.5) * (n > 5 ? 3.4 : 1.6);
      fronds.push({ p: [cx + (r() - 0.5) * 0.1, 0.02, cz + (r() - 0.5) * 0.1], r: [0, a, 0], s: 0.95 + r() * 0.6 });
    }
  }
  g.add(WD.scatter(frondG, frondMat, fronds));
  // Wurzeln unter der Scholle
  const roots = [];
  for (let i = 0; i < 70; i++) {
    const edge = r() < 0.5, t = (r() * 2 - 1) * (HP - 0.2), sgn = r() < 0.5 ? -1 : 1, inset = 0.1 + r() * 1.6;
    const x0 = edge ? sgn * (HP - inset) : t, z0 = edge ? t : sgn * (HP - inset), len = 0.25 + r() * 0.8;
    const pts = [[x0, -0.37, z0]];
    for (let k = 1; k <= 4; k++) pts.push([x0 + (r() - 0.5) * 0.18 * k, -0.37 - len * k / 4, z0 + (r() - 0.5) * 0.18 * k]);
    roots.push(WD.tube(pts, 0.018 + r() * 0.015, 0.003, 16, 5, mix3([0.42, 0.31, 0.22], [0.55, 0.43, 0.3], r())));
  }
  g.add(new T.Mesh(WD.merge(roots), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, emissive: new T.Color(0.12, 0.09, 0.07) })));
  // Blumen (Waldsauerklee): überall verstreut, unsichtbar, bis die Welle sie aufblühen lässt
  const flowerTex = WD.picture(128, 128, (x, w) => {
    x.clearRect(0, 0, w, w); x.translate(w / 2, w / 2);
    for (let k = 0; k < 5; k++) {
      x.rotate(Math.PI * 2 / 5); x.fillStyle = '#fbf6f8'; x.beginPath(); x.ellipse(0, -w * 0.24, w * 0.15, w * 0.24, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(190,120,160,0.7)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -w * 0.08); x.lineTo(0, -w * 0.38); x.stroke();
    }
    x.fillStyle = '#f2d36b'; x.beginPath(); x.arc(0, 0, w * 0.07, 0, Math.PI * 2); x.fill();
  });
  const flowerG = new T.PlaneGeometry(1, 1); flowerG.rotateX(-Math.PI / 2);
  const flowerMat = WD.growMat(new T.MeshStandardMaterial({ map: flowerTex, alphaTest: 0.5, side: T.DoubleSide, roughness: 0.7, emissiveMap: flowerTex, emissive: new T.Color(0.5, 0.5, 0.5) }),
    { rest: 0, keep: 0.0, width: 3.0, glow: 'gl_FragColor.rgb *= 1.0 + vGrow * 0.8;' });
  const flowers = [];
  for (let i = 0; i < 1500; i++) {
    const x = (r() * 2 - 1) * (HP - 0.1), z = (r() * 2 - 1) * (HP - 0.1), box = Math.max(Math.abs(x), Math.abs(z));
    const y = box > HB + 0.1 ? 0.06 + r() * 0.08 : 0.012;
    flowers.push({ p: [x, y, z], r: [(r() - 0.5) * 0.3, r() * 6.3, (r() - 0.5) * 0.3], s: 0.11 + r() * 0.07 });
  }
  const fl = WD.scatter(flowerG, flowerMat, flowers); fl.castShadow = false;
  g.add(fl);
  D.scene.add(g);
  return 'Moospolster';
};
