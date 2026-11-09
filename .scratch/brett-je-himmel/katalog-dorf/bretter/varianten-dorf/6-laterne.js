// V6 Himmelslaterne: das Brett ist der Deckel einer grossen Papierlaterne, die Noas Zeichen zu den Sternen trägt.
// Oben warmes, von innen durchleuchtetes Papier; das Raster sind die Schatten der Bambusrippen. Im Rand ein
// Scherenschnitt in Schwarz (Tannen, Häuser, Kühe, Herzen), eine Spitzenborte statt Einlegelinie. Die Seiten laufen
// nach unten zusammen und leuchten, mit einem Scherenschnitt des Dorfs samt Kirche und Noa mit der Lampe.
// Lichtwelle: die Flamme lodert auf, die ganze Laterne glüht von innen nach aussen heller.
__katalog.varianten.laterne = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.dorf, W2 = __katalog.w2, r = rng(611);
  const N = 2048, m = N / PLATE, px = (w) => (w + HP) / PLATE * N;
  const LACE = HB + 0.08, CUT0 = HB + 0.16, CUT1 = HP - 0.1; // Spitzenborte, Scherenschnitt, Bambusreif aussen
  // Papier (Leuchtkarte = Farbe): warm, Fasern, zur Mitte heller (die Flamme ist darunter)
  const paper = L.surface(N, (x, z) => {
    const fib = noise(x * 60, z * 9, 612) * 0.5 + noise(x * 9, z * 60, 613) * 0.5, cl = fbm(x * 1.2, z * 1.2, 3, 614);
    const centre = 1.08 - smooth(0.5, 7.0, Math.hypot(x, z)) * 0.5;
    const v = (0.86 + (fib - 0.5) * 0.12 + (cl - 0.5) * 0.14) * centre;
    let c = [v, v * 0.80, v * 0.55];
    // Schatten der Bambusrippen (Raster): weich, leicht unregelmässig
    const box = Math.max(Math.abs(x), Math.abs(z));
    if (box < HB + 0.02) {
      const q = (w) => Math.abs((((w + HB) / CELL) % 1 + 1) % 1 - 0.5) * CELL;
      const d = Math.min(0.6 - q(x + Math.sin(z * 2.1) * 0.006), 0.6 - q(z + Math.sin(x * 1.7) * 0.006));
      const rib = smooth(0.03, 0.006, d) * 0.55 + smooth(0.01, 0.0, d) * 0.3;
      c = c.map((u) => u * (1 - rib));
    }
    return [c, 0.95, (fib - 0.5) * 0.0008];
  }, ({ color: g }) => {
    g.fillStyle = '#0b0806';
    // Spitzenborte: Band mit Bögen und Löchern
    V.frame(g, px, m, LACE + 0.035, LACE - 0.02, '#0b0806');
    for (let side = 0; side < 4; side++) for (let t = -LACE; t <= LACE; t += 0.07) {
      const [x, z] = side === 0 ? [t, LACE + 0.035] : side === 1 ? [t, -LACE - 0.035] : side === 2 ? [LACE + 0.035, t] : [-LACE - 0.035, t];
      g.beginPath(); g.arc(px(x), px(z), 0.03 * m, 0, 7); g.fill();
    }
    g.globalCompositeOperation = 'destination-out';
    for (let side = 0; side < 4; side++) for (let t = -LACE + 0.035; t <= LACE; t += 0.07) {
      const [x, z] = side === 0 ? [t, LACE + 0.01] : side === 1 ? [t, -LACE - 0.01] : side === 2 ? [LACE + 0.01, t] : [-LACE - 0.01, t];
      g.beginPath(); g.arc(px(x), px(z), 0.011 * m, 0, 7); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    // Scherenschnitt im Rand: Grundlinie aussen, Figuren stehen nach innen (von aussen gelesen aufrecht)
    g.fillStyle = '#0b0806';
    V.frame(g, px, m, CUT1, CUT1 - 0.05, '#0b0806');
    const seq = ['tanne', 'herz', 'haus', 'tanne', 'kuh', 'tanne', 'stern', 'haus', 'tanne', 'kuh', 'herz', 'tanne'];
    for (let side = 0; side < 4; side++) {
      // tr(a, b): a längs der Seite, b nach innen ab der Grundlinie
      const tr = (a, b) => {
        const o = CUT1 - 0.045 - b;
        const [x, z] = side === 0 ? [a, o] : side === 1 ? [-a, -o] : side === 2 ? [o, -a] : [-o, a];
        return [px(x), px(z)];
      };
      g.fillStyle = '#0b0806';
      let a = -HP + 0.75, k = side * 3;
      while (a < HP - 0.75) {
        const art = seq[k++ % seq.length], w = art === 'kuh' ? 0.4 : art === 'haus' ? 0.36 : 0.3;
        V.figur(g, tr, art, a + w / 2, 1.25);
        a += w + 0.06;
      }
    }
    // Ecken: grosses Herz mit Lebensbaum
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const cx = sx * (HP - 0.42), cz = sz * (HP - 0.42), tr = (a, b) => [px(cx + a), px(cz - b + 0.12)];
      V.figur(g, tr, 'herz', 0, 3.4);
      g.globalCompositeOperation = 'destination-out';
      V.figur(g, tr, 'tanne', 0, 1.0);
      g.globalCompositeOperation = 'source-over';
    }
  }, 0.0003);
  const fm = D.floorMaterial;
  fm.emissiveMap = paper.map; fm.emissive.setRGB(0.85, 0.72, 0.55);
  L.floor({
    map: paper.map, rough: paper.rough, normal: paper.normal, normalScale: 1, color: 0x7a6a58, roughness: 1, envMapIntensity: 0.25,
    groove: '', inlay: '', bevel: '', grooveRough: '', inlayRough: '', bevelRough: '', refl: 0.0,
    // Lichtwelle: die Flamme lodert auf, das Papier glüht vom Ring an heller, der Scherenschnitt bleibt schwarz
    wave: `
        vec3 em = texture2D(emissiveMap, vUv).rgb;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 4.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += em * em * vec3(2.4, 1.5, 0.6) * (wide * 2.0 + trail * 22.0) * k;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // Seiten: Papier, nach unten zusammenlaufend, mit Scherenschnitt des Dorfs; leuchtet von innen
  const H = 1.5, BOT = 3.7, SW = 2048, SH = 320;
  const sc = L.canvas(SW, SH), sx = sc.getContext('2d');
  const grad = sx.createLinearGradient(0, 0, 0, SH);
  grad.addColorStop(0, '#d9a868'); grad.addColorStop(0.7, '#f0c27c'); grad.addColorStop(1, '#ffd690');
  sx.fillStyle = grad; sx.fillRect(0, 0, SW, SH);
  // Rippen (senkrecht) als Schatten, Bambusreif oben und unten
  const um = SW / (2 * HP); // eine Seite pro Textur, 9.8 m breit
  for (let u = 0; u <= 2 * HP; u += 1.4) { sx.fillStyle = 'rgba(90,50,20,0.35)'; sx.fillRect(u * um - 3, 0, 6, SH); }
  sx.fillStyle = '#3a2412'; sx.fillRect(0, 0, SW, 7); sx.fillRect(0, SH - 9, SW, 9);
  // Scherenschnitt: Hügel, Dorf mit Kirche, Tannen, Kühe, Noa mit Lampe, Sterne
  sx.fillStyle = '#0b0806';
  const vm = SH / H, base = SH - 16, tr = (a, b) => [a * um, base - b * vm];
  sx.beginPath(); sx.moveTo(0, base + 2);
  for (let u = 0; u <= 2 * HP + 0.05; u += 0.1) sx.lineTo(u * um, base - (0.06 + Math.sin(u * 0.9) * 0.04 + Math.sin(u * 2.3) * 0.02) * vm);
  sx.lineTo(SW, SH); sx.lineTo(0, SH); sx.fill();
  const scene = [['tanne', 0.45, 3], ['tanne', 0.95, 2.4], ['haus', 1.75, 3], ['haus', 2.65, 2.5], ['kirche', 3.75, 2.6], ['haus', 4.75, 2.6],
    ['tanne', 5.45, 2.8], ['kuh', 6.25, 2.6], ['tanne', 6.95, 3.2], ['noa', 7.7, 3.2], ['tanne', 8.5, 2.5], ['haus', 9.25, 2.6]];
  for (const [art, a, s] of scene) V.figur(sx, tr, art, a, s);
  for (let i = 0; i < 14; i++) { const y0 = (0.12 + r() * 0.3) * SH; V.figur(sx, (a, b) => [a * um, y0 - b * vm], 'stern', 0.3 + i * 0.68 + r() * 0.2, 0.7 + r() * 0.6); }
  const st = L.tex(sc, true); st.wrapS = T.RepeatWrapping; st.repeat.x = 4;
  const sideMat = new T.MeshStandardMaterial({ map: st, emissiveMap: st, emissive: new T.Color(0.95, 0.85, 0.75), roughness: 0.95, side: T.DoubleSide, color: 0x605040 });
  // Seitenwand leuchtet bei der Welle mit
  L.withWave(sideMat, `
      float k = min(1.0, uShock.y * 3.0);
      float lit = 1.0 - smoothstep(0.0, max(uShock.x, 1e-3) + 1.5, length(vW.xz) - 1.0);
      gl_FragColor.rgb *= 1.0 + k * (1.0 + lit * 0.9);`);
  const g = new T.Group();
  g.add(V.frustum(HP - 0.005, BOT, H, sideMat));
  // Bambusreifen oben und unten, Brenner in der Mitte unten
  const bamboo = new T.MeshStandardMaterial({ color: 0x5a3c1e, roughness: 0.7, emissive: 0x1c1006 });
  for (const [h, y] of [[HP - 0.005, -0.02], [BOT, -H + 0.02]]) {
    for (const sgn of [-1, 1]) {
      const a = new T.Mesh(new T.BoxGeometry(2 * h + 0.04, 0.04, 0.04), bamboo); a.position.set(0, y, sgn * h); g.add(a);
      const b = new T.Mesh(new T.BoxGeometry(0.04, 0.04, 2 * h + 0.04), bamboo); b.position.set(sgn * h, y, 0); g.add(b);
    }
  }
  const flame = new T.Mesh(new T.SphereGeometry(0.22, 16, 10), new T.MeshBasicMaterial({ color: new T.Color(3, 1.8, 0.7) }));
  flame.position.y = -H + 0.1; flame.scale.y = 1.4; g.add(flame);
  // Lichtwelle: wo der Ring vorbeizieht, lösen sich kleine Himmelslaternen und steigen auf; weiter hinten verlöschen sie
  const lanG = new T.CylinderGeometry(0.075, 0.055, 0.14, 4, 1, false, Math.PI / 4); lanG.translate(0, 0.07, 0);
  const lanMat = V.waveMat(new T.MeshStandardMaterial({ color: 0xffd8a0, roughness: 0.9, emissive: new T.Color(1.6, 0.68, 0.2) }),
    { grow: 'max(ring, behind * (1.0 - age))', size: 'min(1.0, vGrow * 1.8)', lift: 'age * (1.4 + seed * 0.9) + ring * 0.05', width: 2.6, len: 2.7,
      glow: 'gl_FragColor.rgb *= 0.45 + vGrow * 0.75;' });
  const lan = [];
  for (let i = 0; i < 190; i++) lan.push([(r() * 2 - 1) * (HP - 0.2), 0.01, (r() * 2 - 1) * (HP - 0.2), { ry: r() * 6.3, s: 1.1 + r() * 0.6 }]);
  g.add(V.waveInst(lanG, lanMat, lan));
  D.scene.add(g);
  return 'Himmelslaterne';
};
