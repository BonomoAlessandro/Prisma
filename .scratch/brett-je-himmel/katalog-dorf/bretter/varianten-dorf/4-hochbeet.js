// V4 Hochbeet: das Brett ist ein Hochbeet aus Noas Garten. Im Feld frisch gerechte, dunkle Erde; das Raster sind
// gespannte Pflanzschnüre zwischen Holzpflöcken. Eine Reihe Kiesel statt Einlegelinie, dahinter wachsen im Rand
// Kräuter (Schnittlauch, Thymian, Ringelblumen, Salat). Die Seiten sind Lärchenbohlen. Lichtwelle: Glühwürmchen steigen
// aus Erde und Kräutern auf.
__katalog.varianten.hochbeet = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.dorf, W2 = __katalog.w2, r = rng(411);
  const ST = HB + 0.07, KA = HB + 0.12, KB = HB + 0.2, FRAME = HP - 0.13; // Pflöcke, Kiesel, Kräuter, Rahmen
  const soil = [0.17, 0.12, 0.085], soil2 = [0.11, 0.08, 0.06];
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const crumb = noise(x * 140, z * 140, 412), clod = fbm(x * 9, z * 9, 3, 413);
    let c = mix3(soil2, soil, clod * 0.7 + crumb * 0.5);
    let h = (crumb - 0.5) * 0.002 + (clod - 0.5) * 0.004;
    if (box < HB + 0.02) {
      const rake = Math.sin(z * 2 * Math.PI / 0.06 + fbm(x * 0.8, z * 0.8, 2, 414) * 3); // Spuren des Rechens
      h += rake * 0.0012;
      c = c.map((v) => v * (1 + rake * 0.05));
    } else if (box < FRAME) {
      c = mix3(c, [0.24, 0.19, 0.12], smooth(0.55, 0.8, noise(x * 30, z * 30, 415)) * 0.6); // Mulch, Stroh
    }
    if (crumb > 0.93) c = [0.30, 0.27, 0.24]; // Steinchen
    return [c, 0.97, h];
  }, ({ color: g, height, px, m }) => {
    // Pflanzschnüre: helle Schnur mit Schatten, von Pflock zu Pflock
    for (let k = 0; k <= 7; k++) {
      const p = -HB + k * CELL;
      g.fillStyle = 'rgba(0,0,0,0.45)';
      g.fillRect(px(p + 0.012) - 0.006 * m, px(-ST), 0.014 * m, 2 * ST * m); g.fillRect(px(-ST), px(p + 0.012) - 0.006 * m, 2 * ST * m, 0.014 * m);
      g.fillStyle = '#d8ccb0';
      g.fillRect(px(p) - 0.0055 * m, px(-ST), 0.011 * m, 2 * ST * m); g.fillRect(px(-ST), px(p) - 0.0055 * m, 2 * ST * m, 0.011 * m);
      height.fillStyle = 'rgb(150,150,150)';
      height.fillRect(px(p) - 0.0055 * m, px(-ST), 0.011 * m, 2 * ST * m); height.fillRect(px(-ST), px(p) - 0.0055 * m, 2 * ST * m, 0.011 * m);
    }
    // Kieselreihe zwischen Beet und Kräutern
    for (let side = 0; side < 4; side++) for (let t = -KB; t < KB; t += 0.05 + r() * 0.03) {
      const w = (KA + KB) / 2 + (r() - 0.5) * 0.02, rx = 0.022 + r() * 0.014, rz = 0.016 + r() * 0.01;
      const [x, z] = side === 0 ? [t, w] : side === 1 ? [t, -w] : side === 2 ? [w, t] : [-w, t];
      const v = 150 + r() * 60;
      g.fillStyle = `rgb(${v * 0.92},${v * 0.9},${v * 0.86})`;
      g.beginPath(); g.ellipse(px(x), px(z), rx * m, rz * m, r() * 3, 0, 7); g.fill();
      height.fillStyle = 'rgb(175,175,175)'; height.beginPath(); height.ellipse(px(x), px(z), rx * m, rz * m, 0, 0, 7); height.fill();
    }
  }, 0.0003);
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.3,
    groove: '', inlay: '', bevel: '', grooveRough: '', inlayRough: '', bevelRough: '', refl: 0.0,
    // Lichtwelle: grünlich-warmer Schein über der Erde, die Glühwürmchen sind eigene Punkte
    wave: `
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.35 + vec3(0.25, 0.32, 0.08)) * (ring * 0.8 + trail * 3.0) * k;`,
  });
  L.hide('plateSides', 'plateTrim');
  // Kasten aus Lärchenbohlen (3 × 0.2 m), Rahmen oben 6 cm über der Erde
  const plank = (u, v, id) => {
    const grain = fbm(u * 0.7 + id * 3.3, v * 30, 3, 416);
    return mix3([0.30, 0.21, 0.14], [0.40, 0.29, 0.19], grain * 0.8 + noise(id, 0.5, 417) * 0.3);
  };
  const BOX_H = 0.66;
  const side = L.tex(V.sideCanvas(2048, 128, PLATE, (u, v) => {
    const y = v * BOX_H, b = Math.floor(y / 0.22), fb = (y / 0.22) % 1;
    let c = plank(u, fb, b + Math.floor(u / 3.3) * 7);
    if (fb < 0.03 || fb > 0.97) c = c.map((x) => x * 0.35);
    const sx = (u % 1.4) / 1.4; // Schrauben
    if (Math.abs(sx - 0.5) < 0.004 && Math.abs(fb - 0.5) < 0.05) c = [0.1, 0.1, 0.1];
    return c;
  }), true, true);
  const g = new T.Group();
  g.add(V.box(HP - 0.005, 0.08, BOX_H, L.sideMat(side, { glow: 0.15 }), new T.MeshStandardMaterial({ color: 0x1c140e })));
  // Abdeckbrett oben (Rahmen), vier Bretter
  const capTex = L.tex(V.sideCanvas(1024, 32, PLATE, (u, v) => plank(u, v, 31)), true, true);
  const capMat = L.sideMat(capTex, { glow: 0.12 });
  for (const sgn of [-1, 1]) {
    const a = new T.Mesh(new T.BoxGeometry(PLATE, 0.08, HP - FRAME), capMat); a.position.set(0, 0.04, sgn * (FRAME + HP) / 2); a.castShadow = a.receiveShadow = true; g.add(a);
    const b = new T.Mesh(new T.BoxGeometry(HP - FRAME, 0.08, 2 * FRAME), capMat); b.position.set(sgn * (FRAME + HP) / 2, 0.04, 0); b.castShadow = b.receiveShadow = true; g.add(b);
  }
  // Pflöcke an den Enden der Schnüre
  const pegs = [];
  for (let k = 0; k <= 7; k++) { const p = -HB + k * CELL; pegs.push([p, 0.06, ST], [p, 0.06, -ST], [ST, 0.06, p], [-ST, 0.06, p]); }
  g.add(V.inst(new T.BoxGeometry(0.03, 0.12, 0.03), new T.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.9, emissive: 0x1c140c }), pegs));
  // Kräuter im Rand: Abschnitte entlang jeder Seite
  const blades = [], bushes = [], flowers = [], stems = [], lettuce = [], poms = [];
  const MID = (KB + FRAME) / 2, WIDE = FRAME - KB - 0.04;
  for (let side2 = 0; side2 < 4; side2++) {
    const at = (t, o) => side2 === 0 ? [t, MID + o] : side2 === 1 ? [t, -MID - o] : side2 === 2 ? [MID + o, t] : [-MID - o, t];
    for (let t = -4.6, n = 0; t < 4.6; t += 0.24 + r() * 0.12, n++) {
      const kind = (n + side2 * 3 + (r() < 0.25 ? 1 : 0)) % 4, o = (r() - 0.5) * WIDE * 0.5, [cx, cz] = at(t, o);
      if (kind === 0) { // Schnittlauch
        for (let i = 0; i < 28; i++) {
          const a = r() * 6.28, rr = r() * 0.07, hgt = 0.18 + r() * 0.14;
          blades.push([cx + Math.cos(a) * rr, 0, cz + Math.sin(a) * rr, { s: [1.3, hgt, 1.3], rx: Math.sin(a) * 0.3, rz: -Math.cos(a) * 0.3 }]);
          if (i < 5) poms.push([cx + Math.cos(a) * (rr + 0.06), hgt * 0.95, cz + Math.sin(a) * (rr + 0.06), { s: 0.026 }]);
        }
      } else if (kind === 1) { // Thymian-Polster mit Blütchen
        const w = 0.15 + r() * 0.06;
        bushes.push([cx, 0.02, cz, { s: [w, 0.1, w * (0.8 + r() * 0.3)] }]);
        for (let i = 0; i < 6; i++) poms.push([cx + (r() - 0.5) * w * 1.4, 0.08 + r() * 0.03, cz + (r() - 0.5) * w * 1.4, { s: 0.012 }]);
      } else if (kind === 2) { // Ringelblumen
        for (let i = 0; i < 6; i++) {
          const x = cx + (r() - 0.5) * 0.24, z = cz + (r() - 0.5) * 0.24, hgt = 0.16 + r() * 0.1;
          stems.push([x, 0, z, { s: [1.4, hgt, 1.4] }]);
          flowers.push([x, hgt, z, { rx: (r() - 0.5) * 0.7, rz: (r() - 0.5) * 0.7, s: 1.3 }]);
          bushes.push([x, 0.03, z, { s: [0.09, 0.07, 0.09] }]);
        }
      } else { // Salat
        lettuce.push([cx, 0.04, cz, { s: [0.15, 0.09, 0.15], ry: r() * 6 }]);
        lettuce.push([cx, 0.07, cz, { s: [0.09, 0.07, 0.09], ry: r() * 6 }]);
      }
    }
  }
  const green = (hex, e) => new T.MeshStandardMaterial({ color: hex, roughness: 0.8, emissive: e });
  const blade = new T.CylinderGeometry(0.004, 0.006, 1, 4); blade.translate(0, 0.5, 0);
  g.add(V.inst(blade, green(0x3f6a2a, 0x0c1a08), blades, false));
  g.add(V.inst(new T.SphereGeometry(1, 10, 6), green(0x4a5c3a, 0x0e140a), bushes));
  g.add(V.inst(new T.SphereGeometry(1, 10, 6), green(0x6a9a40, 0x14240c), lettuce));
  g.add(V.inst(blade, green(0x3f6a2a, 0x0c1a08), stems, false));
  g.add(V.inst(new T.CylinderGeometry(0.035, 0.03, 0.012, 10), new T.MeshStandardMaterial({ color: 0xe88a1c, roughness: 0.7, emissive: 0x3a1c04 }), flowers));
  g.add(V.inst(new T.IcosahedronGeometry(1, 1), new T.MeshStandardMaterial({ color: 0xa784c8, roughness: 0.8, emissive: 0x22182c }), poms));
  // Glühwürmchen: über den Kräutern dichter, über dem Beet locker
  const fly = [];
  for (let i = 0; i < 420; i++) {
    if (i < 260) { const a = r() * 4, t = (r() - 0.5) * 9, o = MID + (r() - 0.5) * 0.5; fly.push(a < 1 ? [t, 0.08 + r() * 0.3, o] : a < 2 ? [t, 0.08 + r() * 0.3, -o] : a < 3 ? [o, 0.08 + r() * 0.3, t] : [-o, 0.08 + r() * 0.3, t]); }
    else fly.push([(r() - 0.5) * 2 * HB, 0.03 + r() * 0.15, (r() - 0.5) * 2 * HB]);
  }
  g.add(V.fireflies(fly));
  D.scene.add(g);
  return 'Hochbeet';
};
