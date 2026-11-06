// V8 Altes Spielbrett: das Brett ist der Deckel einer alten Spieltruhe. Im Feld Intarsien: 49 Felder abwechselnd aus
// hellem Ahorn und dunklem Nussbaum, die Maserung quer zueinander; das Raster entsteht aus dem Wechsel der Hölzer.
// Eine helle Ahornader statt Einlegelinie, im Rand eine Kordeleinlage, Nussbaum mit eingelegten Sternen in den Ecken
// und einem Mühlespiel in der Mitte jeder Seite. Schellack glänzt. Die Seiten der Truhe sind bemalt (Bauernmalerei),
// mit Messingecken. Lichtwelle: ein Kerzenschein gleitet über den Schellack, die hellen Felder leuchten warm nach.
__katalog.varianten.spielbrett = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.dorf, W2 = __katalog.w2, r = rng(811);
  const ADER = HB + 0.04, K0 = HB + 0.1, K1 = HB + 0.18; // Ahornader, Kordel, dann Nussbaum
  const maple = [0.50, 0.40, 0.28], maple2 = [0.42, 0.33, 0.22], walnut = [0.22, 0.14, 0.095], walnut2 = [0.16, 0.10, 0.07];
  const woodC = (a, b, along, across, seed) => {
    const gr = fbm(along * 0.6 + seed, across * 34, 3, 812), fig = Math.pow(Math.abs(Math.sin(across * 50 + gr * 8)), 6);
    return mix3(mix3(b, a, gr), b, fig * 0.35);
  };
  const s = L.surface(2048, (x, z) => {
    const ax = Math.abs(x), az = Math.abs(z), box = Math.max(ax, az);
    let c, h = 0;
    if (box < HB) {
      const i = Math.floor((x + HB) / CELL), j = Math.floor((z + HB) / CELL), light = (i + j) % 2 === 0;
      c = light ? woodC(maple, maple2, x, z, i * 3 + j) : woodC(walnut, walnut2, z, x, i * 5 + j);
      const fx = (x + HB) / CELL - i, fz = (z + HB) / CELL - j, ed = Math.min(fx, 1 - fx, fz, 1 - fz) * CELL;
      if (ed < 0.003) c = [0.08, 0.05, 0.035];
      h = (noise(x * 2, z * 2, 813) - 0.5) * 0.0006;
    } else if (box < ADER) {
      c = woodC(walnut, walnut2, ax > az ? z : x, box, 77);
      if (box > ADER - 0.022) c = woodC(maple, [0.56, 0.46, 0.33], ax > az ? z : x, box, 78);
    } else if (box < K0) {
      c = woodC(walnut, walnut2, ax > az ? z : x, box, 79);
    } else if (box < K1) {
      // Kordeleinlage: schräge, abwechselnd helle und dunkle Stäbchen
      const along = ax > az ? z : x, q = Math.floor((along + (box - K0)) / 0.035);
      c = q % 2 ? [0.52, 0.42, 0.30] : [0.12, 0.08, 0.055];
      if (box - K0 < 0.006 || K1 - box < 0.006) c = [0.08, 0.05, 0.035];
    } else {
      c = woodC(walnut, walnut2, ax > az ? z : x, box, 80);
      if (Math.abs(ax - az) < 0.004) c = [0.08, 0.05, 0.035];
    }
    return [c, 0.3, h];
  }, ({ color: g, rough, px, m }) => {
    const MAPLE = '#7e6a50', DARK = '#1d130d';
    // Sterne (achtzackig, zweifarbig) in den Ecken
    const star = (cx, cz, R) => {
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, a1 = a + Math.PI / 8, a2 = a - Math.PI / 8;
        g.fillStyle = i % 2 ? MAPLE : '#a08660';
        g.beginPath(); g.moveTo(px(cx), px(cz)); g.lineTo(px(cx + Math.cos(a2) * R * 0.38), px(cz + Math.sin(a2) * R * 0.38));
        g.lineTo(px(cx + Math.cos(a) * R), px(cz + Math.sin(a) * R)); g.closePath(); g.fill();
        g.fillStyle = i % 2 ? '#a08660' : MAPLE;
        g.beginPath(); g.moveTo(px(cx), px(cz)); g.lineTo(px(cx + Math.cos(a1) * R * 0.38), px(cz + Math.sin(a1) * R * 0.38));
        g.lineTo(px(cx + Math.cos(a) * R), px(cz + Math.sin(a) * R)); g.closePath(); g.fill();
      }
      g.strokeStyle = MAPLE; g.lineWidth = 0.012 * m; g.beginPath(); g.arc(px(cx), px(cz), R * 1.12 * m, 0, 7); g.stroke();
    };
    const RC = (HP + K1) / 2;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) star(sx * RC, sz * RC, 0.25);
    // Mühlespiel in der Mitte jeder Seite: drei Quadrate, Verbindungen, Punkte
    for (const [cx, cz] of [[0, RC], [0, -RC], [RC, 0], [-RC, 0]]) {
      g.strokeStyle = MAPLE; g.lineWidth = 0.012 * m;
      for (const q of [0.25, 0.165, 0.08]) g.strokeRect(px(cx - q), px(cz - q), 2 * q * m, 2 * q * m);
      g.beginPath();
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { g.moveTo(px(cx + dx * 0.08), px(cz + dz * 0.08)); g.lineTo(px(cx + dx * 0.25), px(cz + dz * 0.25)); }
      g.stroke();
      g.fillStyle = '#b29670';
      for (const q of [0.25, 0.165, 0.08]) for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) if (dx || dz) { g.beginPath(); g.arc(px(cx + dx * q), px(cz + dz * q), 0.018 * m, 0, 7); g.fill(); }
      // ein paar Steine liegen noch da: hell und dunkel
      for (const [dx, dz, col] of [[-1, -1, '#d8c8a8'], [1, 0, DARK], [0, 1, '#d8c8a8']]) { g.fillStyle = col; g.beginPath(); g.arc(px(cx + dx * 0.165), px(cz + dz * 0.165), 0.032 * m, 0, 7); g.fill(); }
    }
    // Schellack: an den Kanten etwas abgegriffen (rauer)
    rough.fillStyle = 'rgba(160,160,160,0.5)';
    for (let i = 0; i < 40; i++) { const t = (r() - 0.5) * 9.4, w = HP - 0.04; const [x, z] = [[t, w], [t, -w], [w, t], [-w, t]][i % 4]; rough.beginPath(); rough.ellipse(px(x), px(z), 0.2 * m, 0.05 * m, 0, 0, 7); rough.fill(); }
  }, 0.0003);
  // Helle Felder als Maske für den Nachschein
  const lightMask = W2.mask(512, (x, px, m) => {
    x.fillStyle = '#fff';
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) if ((i + j) % 2 === 0) x.fillRect(px(-HB + i * CELL), px(-HB + j * CELL), CELL * m, CELL * m);
  });
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.9,
    groove: '', inlay: '', bevel: '', grooveRough: '', inlayRough: '', bevelRough: '', refl: 0.42,
    decl: 'uniform sampler2D uLight;', uniforms: { uLight: { value: lightMask } },
    // Lichtwelle: Kerzenschein auf dem Schellack, die hellen Felder glimmen warm nach
    wave: `
        float lm = texture2D(uLight, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 2.5), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.45 + vec3(0.55, 0.38, 0.16)) * (ring * 0.9 + wide * 0.3) * k;
        gl_FragColor.rgb += diffuseColor.rgb * vec3(1.6, 1.1, 0.55) * lm * (wide * 0.8 + trail * 8.0) * k;`,
  });
  L.hide('plateSides', 'plateTrim');
  // Truhe: grüne Füllungen mit Bauernmalerei (Tulpen, Herzen, Rosetten) in Nussbaumrahmen; Messingecken
  const SH = 0.5, cw = 2048, ch = 104, um = cw / PLATE, vm = ch / SH;
  const cv = L.canvas(cw, ch), x = cv.getContext('2d');
  x.fillStyle = '#2a1a10'; x.fillRect(0, 0, cw, ch);
  const P0 = 0.06, P1 = SH - 0.06, PW = 1.75;
  for (let k = 0; k < 5; k++) {
    const u0 = 0.25 + k * (PW + 0.14);
    x.fillStyle = '#23402f'; x.fillRect(u0 * um, P0 * vm, PW * um, (P1 - P0) * vm);
    x.strokeStyle = '#c9a24a'; x.lineWidth = 2; x.strokeRect((u0 + 0.03) * um, (P0 + 0.03) * vm, (PW - 0.06) * um, (P1 - P0 - 0.06) * vm);
    const cu = u0 + PW / 2, cvv = (P0 + P1) / 2;
    // Ranken
    x.strokeStyle = '#7a9a4a'; x.lineWidth = 2.5;
    x.beginPath(); for (let t = -0.7; t <= 0.7; t += 0.02) { const yy = cvv + Math.sin(t * 9) * 0.05; t === -0.7 ? x.moveTo((cu + t) * um, yy * vm) : x.lineTo((cu + t) * um, yy * vm); } x.stroke();
    // Tulpen und Rosette
    const tulip = (u, v, col) => { x.fillStyle = col; x.beginPath(); x.moveTo((u - 0.05) * um, (v - 0.04) * vm); x.lineTo((u - 0.02) * um, (v + 0.04) * vm); x.lineTo((u + 0.02) * um, (v + 0.04) * vm); x.lineTo((u + 0.05) * um, (v - 0.04) * vm); x.lineTo((u + 0.025) * um, (v - 0.01) * vm); x.lineTo(u * um, (v - 0.05) * vm); x.lineTo((u - 0.025) * um, (v - 0.01) * vm); x.closePath(); x.fill(); };
    for (const t of [-0.55, -0.25, 0.25, 0.55]) tulip(cu + t, cvv + Math.sin(t * 9) * 0.05 - 0.06, k % 2 ? '#c8322a' : '#e0a02a');
    for (let q = 0; q < 6; q++) { const a = q * Math.PI / 3; x.fillStyle = q % 2 ? '#c8322a' : '#d8503a'; x.beginPath(); x.ellipse((cu + Math.cos(a) * 0.06) * um, (cvv + Math.sin(a) * 0.06) * vm, 0.055 * um, 0.028 * vm, a, 0, 7); x.fill(); }
    x.fillStyle = '#e0a02a'; x.beginPath(); x.ellipse(cu * um, cvv * vm, 0.03 * um, 0.03 * vm, 0, 0, 7); x.fill();
    for (const t of [-0.4, 0.4]) { x.fillStyle = '#e8d7b0'; x.beginPath(); x.ellipse((cu + t) * um, (cvv + 0.09) * vm, 0.025 * um, 0.012 * vm, t, 0, 7); x.fill(); }
  }
  const st = L.tex(cv, true);
  const g = new T.Group();
  g.add(V.box(HP, 0, SH, L.sideMat(st, { glow: 0.2, roughness: 0.5, env: 1.3 }), new T.MeshStandardMaterial({ color: 0x120c08 })));
  // Messingecken: je Ecke oben ein Winkel (zwei Bleche) und senkrecht eine Schiene
  const brass = new T.MeshStandardMaterial({ color: 0xc9a24a, metalness: 1, roughness: 0.32, envMapIntensity: 1.6, emissive: 0x2a1c06 });
  const parts = [];
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    parts.push([sx * (HP - 0.16), 0.004, sz * (HP - 0.035), { s: [0.32, 0.01, 0.07] }], [sx * (HP - 0.035), 0.004, sz * (HP - 0.16), { s: [0.07, 0.01, 0.32] }]);
    parts.push([sx * (HP - 0.005), -SH / 2, sz * (HP - 0.07), { s: [0.012, SH, 0.14] }], [sx * (HP - 0.07), -SH / 2, sz * (HP - 0.005), { s: [0.14, SH, 0.012] }]);
  }
  g.add(V.inst(new T.BoxGeometry(1, 1, 1), brass, parts));
  // Schlüsselschild vorne
  const esc = new T.Mesh(new T.BoxGeometry(0.16, 0.2, 0.01), brass); esc.position.set(0, -SH / 2, HP + 0.004); g.add(esc);
  D.scene.add(g);
  return 'Altes Spielbrett';
};
