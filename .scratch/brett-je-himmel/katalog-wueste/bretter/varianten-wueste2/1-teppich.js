// D1 Fliegender Kelim: das Brett ist ein dicker, gewebter Teppich (4 cm), Feld ockerfarben mit Abrash, Rand mit
// Bordüren und Rauten, Fransen an den Schmalseiten; Goldfäden in den Rauten leuchten bei der Lichtwelle
__katalog.varianten.teppich = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const W2 = __katalog.w2, r = rng(71);
  const XE = 4.62; // Webkante an den Schmalseiten (x), dahinter Fransen bis 4.88
  const pts = [[-XE, -HP], [XE, -HP], [XE, HP], [-XE, HP]];
  const red = '#a5372a', indigo = '#2c3561', cream = '#efe0c2', saffron = '#d99a3a', ochre = [0.80, 0.58, 0.36];
  const gold = [];
  const s = L.surface(2048, (x, z) => {
    // Grund: Wolle mit Webstruktur und Abrash (Farbbänder quer)
    const weave = (Math.sin(x * 1300) * Math.sin(z * 1300) > 0 ? 1 : 0) * 0.04 + noise(x * 300, z * 300, 72) * 0.06;
    const abrash = (fbm(0, z * 0.9, 3, 73) - 0.5) * 0.12;
    const c = ochre.map((v, i) => clamp(v * (1 + abrash - weave + 0.03) - (i === 2 ? abrash * 0.1 : 0)));
    return [c, 0.95, (noise(x * 900, z * 900, 74) - 0.5) * 0.0004];
  }, ({ color: g, height, px, m }) => {
    const R = (x0, z0, x1, z1, col) => { g.fillStyle = col; g.fillRect(px(x0), px(z0), (x1 - x0) * m, (z1 - z0) * m); };
    // Bordüren: aussen Indigo mit Zickzack, innen Krapprot mit Rauten
    const band = (o, i, col) => { R(-XE, -o, XE, -i, col); R(-XE, i, XE, o, col); R(-o, -HP, -i, HP, col); R(i, -HP, o, HP, col); };
    band(HP, HP - 0.18, indigo);
    band(HP - 0.18, HB + 0.24, red);
    band(HB + 0.24, HB + 0.2, cream);
    // Zickzack (laufender Hund) im Indigo
    g.strokeStyle = cream; g.lineWidth = 0.025 * m;
    const zig = (a0, a1, c, vert) => {
      g.beginPath();
      for (let a = a0, k = 0; a <= a1; a += 0.09, k++) {
        const o = c + (k % 2 ? 0.045 : -0.045);
        vert ? (k ? g.lineTo(px(o), px(a)) : g.moveTo(px(o), px(a))) : (k ? g.lineTo(px(a), px(o)) : g.moveTo(px(a), px(o)));
      }
      g.stroke();
    };
    zig(-XE, XE, -HP + 0.09, false); zig(-XE, XE, HP - 0.09, false); zig(-HP, HP, -XE + 0.09, true); zig(-HP, HP, XE - 0.09, true);
    // Rauten (Göl) mit Haken im roten Band
    const diamond = (cx, cz, s) => {
      const path = () => { g.beginPath(); g.moveTo(px(cx), px(cz - s)); g.lineTo(px(cx + s), px(cz)); g.lineTo(px(cx), px(cz + s)); g.lineTo(px(cx - s), px(cz)); g.closePath(); };
      path(); g.fillStyle = saffron; g.fill();
      g.strokeStyle = indigo; g.lineWidth = 0.02 * m; path(); g.stroke();
      g.fillStyle = cream; g.beginPath(); g.moveTo(px(cx), px(cz - s * 0.45)); g.lineTo(px(cx + s * 0.45), px(cz)); g.lineTo(px(cx), px(cz + s * 0.45)); g.lineTo(px(cx - s * 0.45), px(cz)); g.closePath(); g.fill();
      g.fillStyle = red; g.fillRect(px(cx) - 0.03 * m, px(cz) - 0.03 * m, 0.06 * m, 0.06 * m);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { // Haken
        g.strokeStyle = indigo; g.lineWidth = 0.018 * m; g.beginPath();
        g.moveTo(px(cx + dx * s), px(cz + dz * s)); g.lineTo(px(cx + dx * (s + 0.06)), px(cz + dz * (s + 0.06)));
        g.lineTo(px(cx + dx * (s + 0.06) + dz * 0.05), px(cz + dz * (s + 0.06) + dx * 0.05)); g.stroke();
      }
      gold.push([cx, cz, s]);
    };
    const mid = (HP - 0.18 + HB + 0.24) / 2;
    for (let t = -4.0; t <= 4.01; t += 0.8) { diamond(t, -mid, 0.13); diamond(t, mid, 0.13); }
    for (let t = -3.2; t <= 3.21; t += 0.8) { diamond(-mid, t, 0.13); diamond(mid, t, 0.13); }
    // Raster: eingewebte Indigo-Linien
    g.fillStyle = 'rgba(44,53,97,0.85)';
    for (let k = 0; k <= 7; k++) {
      const p = -HB + k * CELL;
      g.fillRect(px(p) - 0.011 * m, px(-HB), 0.022 * m, 2 * HB * m);
      g.fillRect(px(-HB), px(p) - 0.011 * m, 2 * HB * m, 0.022 * m);
    }
    // Einlegelinie: Schachbrett aus Creme und Indigo
    for (let t = -HB - 0.16; t < HB + 0.16; t += 0.04) {
      const c = Math.round((t + 10) / 0.04) % 2 ? cream : indigo;
      for (const [x, z] of [[t, -HB - 0.16], [t, HB + 0.14], [-HB - 0.16, t], [HB + 0.14, t]]) R(x, z, x + 0.02 + (x === t ? 0.02 : 0), z + 0.02 + (z === t ? 0.02 : 0), c);
    }
    W2.clip(g, px, pts);
  }, 0.00025);
  // Goldfäden: Umrisse der Rauten als Maske für die Lichtwelle
  const goldMask = W2.mask(1024, (x, px, m) => {
    x.strokeStyle = '#fff'; x.lineWidth = 0.025 * m;
    for (const [cx, cz, s0] of gold) {
      for (const s of [s0 + 0.03, s0 * 0.6]) {
        x.beginPath(); x.moveTo(px(cx), px(cz - s)); x.lineTo(px(cx + s), px(cz)); x.lineTo(px(cx), px(cz + s)); x.lineTo(px(cx - s), px(cz)); x.closePath(); x.stroke();
      }
    }
  });
  D.floorMaterial.alphaTest = 0.5;
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.4,
    groove: '', inlay: '', bevel: '', grooveRough: '', inlayRough: '', bevelRough: '', refl: 0.0,
    decl: 'uniform sampler2D uGold;', uniforms: { uGold: { value: goldMask } },
    // Lichtwelle: die Goldfäden in den Rauten leuchten auf, wo der Ring vorbeizieht
    wave: `
        float gm = texture2D(uGold, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 5.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.6 + vec3(0.35, 0.28, 0.15)) * ring * k * 0.8;
        gl_FragColor.rgb += vec3(1.8, 1.25, 0.45) * gm * (wide + trail * 0.25) * k * 2.2;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // dünner Teppich (4 cm) mit Webkante
  const edge = L.canvas(256, 16), ex = edge.getContext('2d');
  for (let i = 0; i < 256; i += 8) { ex.fillStyle = (i / 8) % 2 ? indigo : red; ex.fillRect(i, 0, 8, 16); }
  const et = L.tex(edge, true, true); et.repeat.set(3, 25);
  D.scene.add(W2.slab(pts, { depth: 0.04, side: L.sideMat(et, { glow: 0.3, roughness: 0.95 }), cap: new T.MeshStandardMaterial({ color: 0x7a3a2c, roughness: 0.95 }) }));
  // Fransen an den Schmalseiten
  const NF = 2 * 230, geo = new T.BoxGeometry(0.014, 1, 0.014); geo.translate(0, -0.5, 0);
  const fr = new T.InstancedMesh(geo, new T.MeshStandardMaterial({ color: 0xeee0c4, roughness: 0.95, emissive: 0x3a352c }), NF);
  const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(), P = new T.Vector3(), E = new T.Euler();
  for (let i = 0; i < NF; i++) {
    const sgn = i < NF / 2 ? -1 : 1, z = -HP + 0.06 + ((i % (NF / 2)) / (NF / 2)) * (PLATE - 0.12);
    const len = 0.2 + r() * 0.12;
    P.set(sgn * (XE - 0.005), -0.02, z);
    Q.setFromEuler(E.set((r() - 0.5) * 0.15, 0, sgn * (0.5 + r() * 0.25)));
    S.set(1, len, 1);
    fr.setMatrixAt(i, M.compose(P, Q, S));
  }
  D.scene.add(fr);
  return 'Fliegender Kelim';
};
