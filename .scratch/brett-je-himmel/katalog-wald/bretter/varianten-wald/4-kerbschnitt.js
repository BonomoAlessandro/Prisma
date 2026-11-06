// W4 Kerbschnitt und Bauernmalerei: das Brett ist eine Tischplatte aus Arvenholz wie in einer Alphütte. Jede Reihe ist
// eine Bohle, die Rasterlinien sind Kerben. Der Rand ist dunkel blaugrün gemalt, mit Rosetten im Kerbschnitt (Sechsstern)
// und gemalten Tulpen dazwischen; an den Seiten eine Ranke. Die Lichtwelle: warmes Kerzenlicht fängt sich in den Kerben
__katalog.varianten.kerbschnitt = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng, parts } = L;
  const r = rng(501);
  const arve = [0.70, 0.56, 0.41], arveRot = [0.64, 0.46, 0.33], ast = [0.34, 0.2, 0.12];
  const knots = Array.from({ length: 34 }, () => [(r() * 2 - 1) * HB, (r() * 2 - 1) * HB, 0.012 + r() * 0.022]);
  const ground = '#1d3a3c', red = '#9b2f22', ochre = '#c99a3e', cream = '#efe2c4', leaf = '#4f7d4a';
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    // Bohlen längs x, je Reihe eine (Fugen auf den Rasterlinien), Maserung mit Flammen
    const row = Math.floor((z + HP) / CELL), zz = z + row * 3.7;
    const warp = fbm(x * 0.35, zz * 1.4, 3, 502) * 0.5 + fbm(x * 1.2, zz * 4, 2, 503) * 0.05;
    const grain = Math.sin((zz + warp) * 95), flame = smooth(0.5, 0.9, Math.abs(Math.sin((zz + warp * 1.6) * 9)));
    let c = mix3(arve, arveRot, flame * 0.55 + noise(row, 1, 504) * 0.3);
    c = mix3(c, [c[0] * 0.86, c[1] * 0.82, c[2] * 0.8], smooth(0.6, 1, grain) * 0.5);
    let h = smooth(0.6, 1, grain) * -0.0002;
    for (const [kx, kz, kr] of knots) {
      const d = Math.hypot(x - kx, (z - kz) * 1.3) / kr;
      if (d < 3) {
        c = mix3(c, ast, 1 - smooth(0.85, 1.0, d));
        c = mix3(c, [c[0] * 0.8, c[1] * 0.72, c[2] * 0.68], (1 - smooth(1.0, 2.6, d)) * 0.5 * (0.5 + 0.5 * Math.sin(d * 9)));
      }
    }
    return [c, 0.62, h];
  }, ({ color: g, height: hc, mask: mk, px, m }) => {
    const P = (x, z) => [px(x), px(z)];
    // Rand gemalt: Grund, Linien in Rot und Ocker
    const band = (o, i, col, ctx = g) => { ctx.fillStyle = col; ctx.beginPath(); ctx.rect(px(-o), px(-o), 2 * o * m, 2 * o * m); ctx.rect(px(i), px(-i), -2 * i * m, 2 * i * m); ctx.fill('evenodd'); };
    band(HP, HB + 0.02, ground);
    band(HP, HP - 0.05, red); band(HP - 0.08, HP - 0.1, ochre);
    band(HB + 0.08, HB + 0.02, red); band(HB + 0.12, HB + 0.1, ochre);
    // Kerbschnitt-Rosette (Sechsstern) im natürlichen Holz: Facetten hell und dunkel, ausgekerbt
    const rosette = (cx, cz, R) => {
      const [X, Z] = P(cx, cz), Rp = R * m;
      g.save(); g.translate(X, Z);
      g.fillStyle = '#d9c19a'; g.beginPath(); g.arc(0, 0, Rp * 1.18, 0, Math.PI * 2); g.fill();
      // Zahnkranz: 24 Kerben
      for (let k = 0; k < 24; k++) {
        const a0 = k / 24 * Math.PI * 2, a1 = (k + 0.5) / 24 * Math.PI * 2, a2 = (k + 1) / 24 * Math.PI * 2;
        for (const [aa, col] of [[a0, '#8a6a46'], [a1, '#b8966a']]) {
          g.fillStyle = col; g.beginPath(); g.moveTo(Math.cos(aa) * Rp * 1.18, Math.sin(aa) * Rp * 1.18);
          g.lineTo(Math.cos(aa + Math.PI / 24) * Rp * 1.02, Math.sin(aa + Math.PI / 24) * Rp * 1.02);
          g.lineTo(Math.cos(aa + Math.PI / 12) * Rp * 1.18, Math.sin(aa + Math.PI / 12) * Rp * 1.18); g.fill();
        }
        void a2;
      }
      g.fillStyle = '#e3cda6'; g.beginPath(); g.arc(0, 0, Rp, 0, Math.PI * 2); g.fill();
      // sechs Blätter aus Zirkelbögen; jede Hälfte eine Facette
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2, tip = [Math.cos(a) * Rp, Math.sin(a) * Rp];
        for (const [sg, col] of [[1, '#b38a58'], [-1, '#5c4029']]) {
          g.fillStyle = col; g.beginPath(); g.moveTo(0, 0);
          for (let t = 0; t <= 1.0001; t += 0.1) { // Bogen vom Zentrum zur Spitze
            const bulge = Math.sin(t * Math.PI) * Rp * 0.29 * sg;
            g.lineTo(tip[0] * t - Math.sin(a) * bulge, tip[1] * t + Math.cos(a) * bulge);
          }
          g.closePath(); g.fill();
        }
      }
      // Dreieckskerben zwischen den Blättern
      for (let k = 0; k < 6; k++) {
        const a = (k + 0.5) / 6 * Math.PI * 2;
        g.fillStyle = '#7c5a3a'; g.beginPath(); g.moveTo(Math.cos(a) * Rp * 0.42, Math.sin(a) * Rp * 0.42);
        g.lineTo(Math.cos(a - 0.22) * Rp * 0.93, Math.sin(a - 0.22) * Rp * 0.93); g.lineTo(Math.cos(a + 0.22) * Rp * 0.93, Math.sin(a + 0.22) * Rp * 0.93); g.fill();
      }
      g.restore();
      for (const [ctx, col] of [[hc, '#606060'], [mk, '#ffffff']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X, Z, Rp * 1.18, 0, Math.PI * 2); ctx.fill(); }
    };
    // gemalte Tulpe mit zwei Blättern, Spitze nach aussen (Richtung dir)
    const tulip = (cx, cz, a) => {
      const [X, Z] = P(cx, cz), s0 = 0.23 * m;
      g.save(); g.translate(X, Z); g.rotate(a);
      g.strokeStyle = leaf; g.lineWidth = 0.014 * m; g.beginPath(); g.moveTo(0, s0); g.lineTo(0, -s0 * 0.2); g.stroke();
      for (const sg of [-1, 1]) { g.fillStyle = leaf; g.beginPath(); g.moveTo(0, s0 * 0.8); g.quadraticCurveTo(sg * s0 * 0.9, s0 * 0.4, sg * s0 * 0.7, -s0 * 0.1); g.quadraticCurveTo(sg * s0 * 0.3, s0 * 0.3, 0, s0 * 0.8); g.fill(); }
      g.fillStyle = red; g.beginPath(); g.moveTo(-s0 * 0.42, -s0 * 0.2); g.quadraticCurveTo(-s0 * 0.5, -s0 * 0.9, -s0 * 0.2, -s0 * 1.0);
      g.lineTo(0, -s0 * 0.7); g.lineTo(s0 * 0.2, -s0 * 1.0); g.quadraticCurveTo(s0 * 0.5, -s0 * 0.9, s0 * 0.42, -s0 * 0.2); g.quadraticCurveTo(0, s0 * 0.05, -s0 * 0.42, -s0 * 0.2); g.fill();
      g.strokeStyle = cream; g.lineWidth = 0.008 * m; g.beginPath(); g.moveTo(-s0 * 0.2, -s0 * 0.3); g.quadraticCurveTo(-s0 * 0.28, -s0 * 0.7, -s0 * 0.14, -s0 * 0.85); g.stroke();
      g.fillStyle = ochre; for (const d of [-1, 0, 1]) { g.beginPath(); g.arc(d * s0 * 0.5, s0 * 0.95, s0 * 0.06, 0, Math.PI * 2); g.fill(); }
      g.restore();
    };
    const mid = (HB + HP) / 2;
    for (let k = 0; k < 7; k++) {
      const t = -HB + (k + 0.5) * CELL;
      for (const [x, z] of [[t, -mid], [t, mid], [-mid, t], [mid, t]]) rosette(x, z, 0.19);
    }
    for (const [x, z] of [[-mid, -mid], [mid, -mid], [mid, mid], [-mid, mid]]) rosette(x, z, 0.24);
    for (let k = 1; k < 7; k++) {
      const t = -HB + k * CELL;
      tulip(t, -mid, 0); tulip(t, mid, Math.PI); tulip(-mid, t, -Math.PI / 2); tulip(mid, t, Math.PI / 2);
    }
  }, 0.0005);
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.5,
    // Raster: Kerben (dunkel, etwas breiter); Einlegelinie: entfällt, die gemalten Linien ersetzen sie
    groove: 'diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.42, 0.36, 0.32), floorGroove);',
    replace: [['float lw = 0.00458;', 'float lw = 0.0075;']],
    inlay: '', inlayRough: '', bevel: '', bevelRough: '', refl: 0.12,
    decl: 'uniform sampler2D uCarve;', uniforms: { uCarve: { value: s.mask } },
    // Lichtwelle: warmes Kerzenlicht, das sich in Kerben und Rosetten fängt
    wave: `
        float cv = texture2D(uCarve, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 2.6), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += vec3(1.0, 0.62, 0.28) * (ring * 0.5 + wide * 0.25 + trail * 0.8) * k;
        gl_FragColor.rgb += vec3(1.8, 1.0, 0.4) * max(floorGroove, cv) * (wide * 1.2 + trail * 0.3) * k;`,
  });
  // Seiten: gemalte Ranke auf dunklem Grund, oben und unten rote Linien
  const sc = L.canvas(4096, 160), sx = sc.getContext('2d'), mpx = 4096 / PLATE;
  sx.fillStyle = ground; sx.fillRect(0, 0, 4096, 160);
  sx.fillStyle = red; sx.fillRect(0, 0, 4096, 12); sx.fillRect(0, 148, 4096, 12);
  sx.fillStyle = ochre; sx.fillRect(0, 18, 4096, 4); sx.fillRect(0, 138, 4096, 4);
  sx.strokeStyle = ochre; sx.lineWidth = 5; sx.beginPath();
  for (let u = 0; u <= 4096; u += 4) { const y = 80 + Math.sin(u / mpx * Math.PI / 0.6) * 30; u ? sx.lineTo(u, y) : sx.moveTo(u, y); }
  sx.stroke();
  for (let k = 0; k < PLATE / 0.6; k++) {
    const u = (k + 0.25) * 0.6 * mpx, up = k % 2 === 0, y = up ? 50 : 110;
    sx.fillStyle = leaf; sx.beginPath(); sx.ellipse(u + 40, y + (up ? 6 : -6), 26, 10, up ? -0.5 : 0.5, 0, Math.PI * 2); sx.fill();
    sx.fillStyle = red; sx.beginPath(); sx.arc(u - 30, y, 16, 0, Math.PI * 2); sx.fill();
    sx.fillStyle = cream; sx.beginPath(); sx.arc(u - 30, y, 6, 0, Math.PI * 2); sx.fill();
    sx.fillStyle = ochre; for (let d = 0; d < 5; d++) { const a = d / 5 * Math.PI * 2; sx.beginPath(); sx.arc(u - 30 + Math.cos(a) * 22, y + Math.sin(a) * 22, 4, 0, Math.PI * 2); sx.fill(); }
  }
  L.sides(L.sideMat(L.tex(sc), { glow: 0.34, roughness: 0.7 }));
  // Kante: statt Metall eine rote, gemalte Leiste
  const trim = new T.MeshStandardMaterial({ color: 0x8e2a1f, roughness: 0.6, emissive: 0x2a0c08 });
  parts.plateTrim.children.forEach((c) => { c.material = trim; });
  void r;
  return 'Kerbschnitt und Bauernmalerei';
};
