// V5 Buntes Glas: das Brett ist ein Bleiglasfenster der Dorfkirche, flach gelegt und von unten erleuchtet. Im Feld
// 49 Scheiben aus blassem Kathedralglas (eine je Feld), das Raster sind die Bleiruten mit Lötstellen. Im Rand eine Borte
// aus farbigem Glas (Rauten in Rubinrot, Kobalt, Gold), in den Ecken Butzenscheiben; doppelte Bleirute statt
// Einlegelinie; aussen ein schmaler Eisenrahmen, das Fenster ist nur 12 cm dick. Lichtwelle: wie Sonne, die durch ein
// Kirchenfenster bricht, die Gläser flammen in ihrer Farbe auf.
__katalog.varianten.glas = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.dorf, W2 = __katalog.w2, r = rng(511);
  const IR = HB + 0.1, BO = HP - 0.16, FE = HP - 0.13; // Doppelblei bis IR, farbige Borte bis BO, Eisen ab FE
  const N = 2048, m = N / PLATE, px = (w) => (w + HP) / PLATE * N;
  // Leuchtkarte (Licht, das durchs Glas kommt) und Farbkarte (Blei, Eisen; Glas dunkel spiegelnd)
  const glow = L.canvas(N), gx = glow.getContext('2d');
  const tints = ['#9a8a62', '#7f9070', '#7c8a96', '#968070', '#8a9478'];
  gx.fillStyle = '#000'; gx.fillRect(0, 0, N, N);
  for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
    gx.fillStyle = tints[Math.floor(noise(i * 3.3, j * 5.1, 512) * tints.length)];
    gx.fillRect(px(-HB + i * CELL), px(-HB + j * CELL), CELL * m, CELL * m);
  }
  // farbige Borte: Quader aus antikem Glas, abwechselnd Rubin und Kobalt, innen ein Bernsteinstreifen; Vierpass in den Ecken
  const ruby = '#a8182a', cobalt = '#1c3a9c', amber = '#d08a1c', green = '#2a7a40';
  const B0 = IR + 0.05, B1 = BO - 0.03, BM = (B0 + B1) / 2, BW2 = (B1 - B0) / 2;
  V.frame(gx, px, m, B0, IR, amber);
  V.frame(gx, px, m, BO, B1, amber);
  const band = (draw) => { for (let side = 0; side < 4; side++) draw((t, o) => side === 0 ? [t, o] : side === 1 ? [t, -o] : side === 2 ? [o, t] : [-o, t]); };
  const LEN = 0.6, segs = [];
  band((at) => {
    let k = 0;
    for (let t = -BM + BW2 + 0.06; t < BM - BW2 - 0.06 - 0.01; t += LEN, k++) {
      const t1 = Math.min(t + LEN, BM - BW2 - 0.06);
      const [x0, z0] = at(t, B0), [x1, z1] = at(t1, B1);
      gx.fillStyle = k % 2 ? cobalt : ruby;
      gx.fillRect(px(Math.min(x0, x1)), px(Math.min(z0, z1)), Math.abs(x1 - x0) * m, Math.abs(z1 - z0) * m);
      segs.push([at, t, t1]);
    }
  });
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [a * BM, b * BM]);
  for (const [cx, cz] of corners) {
    const R = BW2 + 0.06;
    gx.fillStyle = cobalt; gx.fillRect(px(cx - R), px(cz - R), 2 * R * m, 2 * R * m);
    gx.fillStyle = ruby;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { gx.beginPath(); gx.arc(px(cx + dx * R * 0.42), px(cz + dz * R * 0.42), R * 0.42 * m, 0, 7); gx.fill(); }
    gx.fillStyle = amber; gx.beginPath(); gx.arc(px(cx), px(cz), R * 0.3 * m, 0, 7); gx.fill();
    gx.fillStyle = green; for (const [dx, dz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { gx.beginPath(); gx.arc(px(cx + dx * R * 0.78), px(cz + dz * R * 0.78), R * 0.14 * m, 0, 7); gx.fill(); }
  }
  // Blei: Linien in die Farbkarte (dunkel, matt, erhaben) und als Abdeckung in die Leuchtkarte
  const col = L.canvas(N), cx2 = col.getContext('2d'), hgt = L.canvas(N), hx = hgt.getContext('2d', { willReadFrequently: true });
  const rough = L.canvas(N), rx = rough.getContext('2d');
  cx2.fillStyle = '#0e1013'; cx2.fillRect(0, 0, N, N);
  hx.fillStyle = 'rgb(128,128,128)'; hx.fillRect(0, 0, N, N);
  rx.fillStyle = 'rgb(28,28,28)'; rx.fillRect(0, 0, N, N);
  const lead = (fn) => { for (const c of [gx, cx2, hx, rx]) { c.save(); fn(c); c.restore(); } };
  const leadStyle = (c, w) => { c.lineWidth = w * m; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = c === gx ? '#000' : c === cx2 ? '#2a2c30' : c === hx ? 'rgb(190,190,190)' : 'rgb(150,150,150)'; };
  lead((c) => {
    leadStyle(c, 0.032);
    for (let k = 0; k <= 7; k++) {
      const p = -HB + k * CELL;
      c.beginPath(); c.moveTo(px(p), px(-HB)); c.lineTo(px(p), px(HB)); c.moveTo(px(-HB), px(p)); c.lineTo(px(HB), px(p)); c.stroke();
    }
    for (const w of [HB + 0.005, IR - 0.005, IR + 0.03, B0, B1, BO]) c.strokeRect(px(-w), px(-w), 2 * w * m, 2 * w * m);
    leadStyle(c, 0.024);
    for (const [at, t, t1] of segs) { const [x0, z0] = at(t, B0), [x1, z1] = at(t, B1); c.beginPath(); c.moveTo(px(x0), px(z0)); c.lineTo(px(x1), px(z1)); c.stroke(); void t1; }
    for (const [x0, z0] of corners) {
      const R = BW2 + 0.06;
      c.strokeRect(px(x0 - R), px(z0 - R), 2 * R * m, 2 * R * m);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { c.beginPath(); c.arc(px(x0 + dx * R * 0.42), px(z0 + dz * R * 0.42), R * 0.42 * m, 0, 7); c.stroke(); }
      c.beginPath(); c.arc(px(x0), px(z0), R * 0.3 * m, 0, 7); c.stroke();
    }
  });
  // Grisaille: dunkel aufgemalte Ranken auf der Borte (nur Licht- und Farbkarte)
  for (const c of [gx]) {
    c.strokeStyle = 'rgba(10,6,4,0.75)'; c.lineWidth = 0.012 * m; c.lineCap = 'round';
    for (const [at, t, t1] of segs) {
      c.beginPath();
      for (let u = t + 0.04; u <= t1 - 0.04; u += 0.01) { const [x, z] = at(u, BM + Math.sin((u - t) / (t1 - t) * Math.PI * 2) * BW2 * 0.45); u === t + 0.04 ? c.moveTo(px(x), px(z)) : c.lineTo(px(x), px(z)); }
      c.stroke();
      for (const f of [0.25, 0.75]) { const u = t + (t1 - t) * f, [x, z] = at(u, BM + (f < 0.5 ? 1 : -1) * BW2 * 0.45); c.beginPath(); c.arc(px(x), px(z), 0.035 * m, 0, 7); c.stroke(); }
    }
  }
  // Lötstellen an den Kreuzungen
  for (let i = 0; i <= 7; i++) for (let j = 0; j <= 7; j++) {
    const x = -HB + i * CELL, z = -HB + j * CELL;
    cx2.fillStyle = '#5a5c60'; cx2.beginPath(); cx2.arc(px(x), px(z), 0.03 * m, 0, 7); cx2.fill();
    rx.fillStyle = 'rgb(80,80,80)'; rx.beginPath(); rx.arc(px(x), px(z), 0.03 * m, 0, 7); rx.fill();
  }
  // Glas: Hammerschlag (Höhe), Schlieren und Blasen in der Leuchtkarte
  const hi = hx.getImageData(0, 0, N, N), gi = gx.getImageData(0, 0, N, N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = (j * N + i) * 4;
    if (hi.data[k] > 140) continue; // Blei
    const x = -HP + (i + 0.5) / m, z = -HP + (j + 0.5) / m;
    const hammer = noise(x * 34, z * 34, 513), streak = fbm(x * 0.6, z * 5, 3, 514);
    hi.data[k] = hi.data[k + 1] = hi.data[k + 2] = 128 + (hammer - 0.5) * 40;
    const hot = 1.25 - Math.min(1, Math.hypot(x, z) / 7) * 0.5, seed = noise(x * 300, z * 300, 515);
    const f = (0.7 + streak * 0.55 + (hammer - 0.5) * 0.2) * hot + (seed > 0.985 ? 0.6 : seed > 0.975 ? -0.3 : 0);
    for (let q = 0; q < 3; q++) gi.data[k + q] = clamp(gi.data[k + q] * f, 0, 255);
  }
  hx.putImageData(hi, 0, 0); gx.putImageData(gi, 0, 0);
  // Eisenrahmen aussen (in allen Karten)
  for (const [c, colr] of [[gx, '#000'], [cx2, '#17181b'], [rx, 'rgb(110,110,110)']]) { V.frame(c, px, m, HP, FE, colr); }
  for (let t = -HP + 0.3; t < HP; t += 0.6) for (const [x, z] of [[t, HP - 0.065], [t, -HP + 0.065], [HP - 0.065, t], [-HP + 0.065, t]]) {
    cx2.fillStyle = '#3a3c40'; cx2.beginPath(); cx2.arc(px(x), px(z), 0.018 * m, 0, 7); cx2.fill();
  }
  const fm = D.floorMaterial;
  fm.emissiveMap = L.tex(glow); fm.emissive.setScalar(1.15);
  L.floor({
    map: L.tex(col), rough: L.tex(rough, false), normal: L.normalFrom(hx, N, PLATE / N, 0.0002), normalScale: 1, roughness: 1, envMapIntensity: 1.8,
    groove: '', inlay: '', bevel: '', grooveRough: '', inlayRough: '', bevelRough: '', refl: 0.8,
    // Lichtwelle: die Gläser flammen in ihrer Farbe auf, dahinter glimmen sie nach
    wave: `
        vec3 em = texture2D(emissiveMap, vUv).rgb;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += em * vec3(1.9, 1.7, 1.45) * (wide * 1.5 + trail * 16.0) * k;
        gl_FragColor.rgb += (uShockColor * 0.4 + vec3(0.3, 0.26, 0.2)) * ring * k * 0.4;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // Eisenrahmen als Kante (12 cm), Unterseite dunkel; darunter zwei Windeisen
  const ironTex = L.tex(V.sideCanvas(1024, 16, PLATE, (u, v) => {
    const riv = Math.abs(((u + 0.3) % 0.6) - 0.3) < 0.015 && Math.abs(v - 0.5) < 0.2;
    return riv ? [0.3, 0.3, 0.32] : [0.11, 0.11, 0.12].map((c) => c * (0.9 + noise(u * 20, v * 4, 516) * 0.25));
  }), true, true);
  const ironMat = L.sideMat(ironTex, { glow: 0.12, roughness: 0.45, env: 1.5, extra: { metalness: 0.6 } });
  const g = new T.Group();
  g.add(V.box(HP, 0.004, 0.12, ironMat, new T.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.8 })));
  for (const t of [-2.4, 2.4]) {
    const bar = new T.Mesh(new T.BoxGeometry(PLATE - 0.04, 0.05, 0.03), ironMat); bar.position.set(0, -0.145, t); g.add(bar);
  }
  D.scene.add(g);
  return 'Buntes Glas';
};
