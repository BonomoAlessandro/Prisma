// W8 Scherenschnitt: das Brett ist ein grosser Scherenschnitt wie aus dem Pays-d'Enhaut. Das Feld ist helles Büttenpapier,
// im Rand stehen schwarz geschnittene Tannen, Hirsche, Herzen und Glühwürmchen, gespiegelt wie gefaltetes Papier. Die
// Seiten sind ein Stapel Papier. Lichtwelle: Licht scheint durch das Papier und zeigt sein Wasserzeichen, einen Hirsch
__katalog.varianten.scherenschnitt = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const r = rng(901);
  const paper = [0.79, 0.76, 0.68];
  const s = L.surface(2048, (x, z) => {
    const laid = 0.5 + 0.5 * Math.sin(z * 2 * Math.PI / 0.008), chain = 1 - smooth(0.0, 0.004, Math.abs(((x + 10) % 0.025) - 0.0125) - 0.0105);
    const cloud = fbm(x * 2.5, z * 2.5, 4, 902);
    let c = mix3(paper, [0.74, 0.7, 0.62], cloud * 0.5);
    c = mix3(c, [c[0] * 0.97, c[1] * 0.97, c[2] * 0.96], laid * 0.25 + chain * 0.2);
    return [c, 0.95, (cloud - 0.5) * 0.0006, [laid * 0.4 + chain * 0.6, 0]];
  }, ({ color: g, mask: mk, px, m }) => {
    const ink = '#141313';
    g.fillStyle = ink;
    // Spitzenband aussen: schwarzes Band mit ausgeschnittenen Bögen
    const side = (fn) => { // fn zeichnet für eine Seite (lokal: u längs, w nach aussen ab Feldrand), auf allen vier
      for (let k = 0; k < 4; k++) {
        g.save(); g.translate(px(0), px(0)); g.rotate(k * Math.PI / 2); fn(g); g.restore();
      }
    };
    const U = (u) => u * m, Wd = (w) => -(HB + w) * m; // lokal: Seite oben (z negativ), nach aussen = −y
    side((c) => {
      c.fillStyle = ink;
      // Bodenlinie am Feld und Spitzenband aussen
      c.fillRect(U(-HP), Wd(0.04), U(PLATE), 0.035 * m);
      c.fillRect(U(-HP), Wd(0.7), U(PLATE), 0.07 * m);
      for (let u = -HP + 0.05; u < HP; u += 0.1) { c.beginPath(); c.arc(U(u), Wd(0.62), 0.04 * m, Math.PI, 0); c.fill(); }
      // Tannen (gespiegelt um die Mitte): Stamm und Etagen
      const fir = (u, hgt) => {
        c.fillRect(U(u) - 0.012 * m, Wd(0.045), 0.024 * m, -0.06 * m);
        const tiers = 4 + Math.round(hgt * 6);
        for (let t = 0; t < tiers; t++) {
          const y0 = 0.08 + t * hgt / tiers, w = (1 - t / tiers) * hgt * 0.42 + 0.03;
          c.beginPath(); c.moveTo(U(u - w), Wd(y0)); c.lineTo(U(u + w), Wd(y0)); c.lineTo(U(u), Wd(y0 + hgt / tiers * 1.7)); c.closePath(); c.fill();
        }
      };
      // Hirsch (stilisiert), Blick zur Mitte
      const deer = (u, dir, k = 1.05) => {
        const X = (dx) => U(u + dx * dir * k), Y = (dy) => Wd(0.05 + dy * k);
        c.beginPath(); c.ellipse(X(0), Y(0.2), 0.13 * k * m, 0.06 * k * m, 0, 0, Math.PI * 2); c.fill();
        c.lineWidth = 0.022 * k * m; c.strokeStyle = ink; c.lineCap = 'round';
        for (const lx of [-0.09, -0.06, 0.07, 0.1]) { c.beginPath(); c.moveTo(X(lx), Y(0.18)); c.lineTo(X(lx + 0.01), Y(0.0)); c.stroke(); }
        c.beginPath(); c.moveTo(X(0.1), Y(0.24)); c.lineTo(X(0.15), Y(0.36)); c.stroke(); // Hals
        c.beginPath(); c.ellipse(X(0.18), Y(0.37), 0.045 * k * m, 0.025 * k * m, dir * 0.4, 0, Math.PI * 2); c.fill();
        c.lineWidth = 0.014 * k * m;
        c.beginPath(); c.moveTo(X(0.15), Y(0.39)); c.lineTo(X(0.12), Y(0.5)); c.lineTo(X(0.08), Y(0.55)); c.moveTo(X(0.125), Y(0.47)); c.lineTo(X(0.17), Y(0.53));
        c.moveTo(X(0.13), Y(0.43)); c.lineTo(X(0.09), Y(0.46)); c.stroke(); // Geweih
      };
      const heart = (u, s0) => {
        c.beginPath(); c.moveTo(U(u), Wd(0.12)); c.bezierCurveTo(U(u - s0), Wd(0.12 + s0 * 0.6), U(u - s0 * 0.5), Wd(0.12 + s0 * 1.3), U(u), Wd(0.12 + s0 * 0.9));
        c.bezierCurveTo(U(u + s0 * 0.5), Wd(0.12 + s0 * 1.3), U(u + s0), Wd(0.12 + s0 * 0.6), U(u), Wd(0.12)); c.fill();
      };
      const stars = (u) => { for (const [du, w0, rr] of [[-0.06, 0.53, 0.012], [0.05, 0.5, 0.009], [0.0, 0.56, 0.007]]) { c.beginPath(); c.arc(U(u + du), Wd(w0), rr * m, 0, Math.PI * 2); c.fill(); } };
      for (const sg of [-1, 1]) {
        fir(sg * 0.32, 0.4); fir(sg * 0.58, 0.36); stars(sg * 0.8);
        deer(sg * 1.25, -sg); fir(sg * 1.75, 0.42); fir(sg * 1.98, 0.34); fir(sg * 2.22, 0.4); stars(sg * 2.45);
        heart(sg * 2.7, 0.14); fir(sg * 3.0, 0.38); fir(sg * 3.24, 0.42); fir(sg * 3.48, 0.32); deer(sg * 3.88, -sg, 0.9);
      }
      heart(0, 0.16);
    });
    // Ecken: Rosette (Sonne) aus Strahlen
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const X = px(sx * 4.52), Z = px(sz * 4.52);
      g.fillStyle = ink; g.beginPath(); g.arc(X, Z, 0.2 * m, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgb(219,211,191)';
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.beginPath(); g.moveTo(X + Math.cos(a) * 0.05 * m, Z + Math.sin(a) * 0.05 * m); g.lineTo(X + Math.cos(a + 0.18) * 0.17 * m, Z + Math.sin(a + 0.18) * 0.17 * m); g.lineTo(X + Math.cos(a - 0.18) * 0.17 * m, Z + Math.sin(a - 0.18) * 0.17 * m); g.fill(); }
      g.beginPath(); g.arc(X, Z, 0.035 * m, 0, Math.PI * 2); g.fill();
    }
    // Glühwürmchen: kleine runde Löcher in Rand (Maske Blau)
    void mk;
    // Wasserzeichen (Maske Grün): grosser Hirschkopf und Tannen, nur im Gegenlicht sichtbar
    const wm = document.createElement('canvas'); wm.width = wm.height = 2048; const w = wm.getContext('2d');
    w.fillStyle = '#000'; w.fillRect(0, 0, 2048, 2048);
    w.fillStyle = '#fff'; w.strokeStyle = '#fff'; w.lineCap = 'round';
    const C = px(0);
    w.beginPath(); w.ellipse(C, C + 0.35 * m, 0.55 * m, 0.8 * m, 0, 0, Math.PI * 2); w.fill(); // Kopf
    w.beginPath(); w.ellipse(C, C + 1.05 * m, 0.32 * m, 0.3 * m, 0, 0, Math.PI * 2); w.fill(); // Schnauze
    for (const sg of [-1, 1]) {
      w.beginPath(); w.ellipse(C + sg * 0.75 * m, C - 0.05 * m, 0.35 * m, 0.14 * m, sg * -0.5, 0, Math.PI * 2); w.fill(); // Ohren
      w.lineWidth = 0.14 * m; w.beginPath(); w.moveTo(C + sg * 0.3 * m, C - 0.35 * m); w.quadraticCurveTo(C + sg * 1.1 * m, C - 1.2 * m, C + sg * 1.3 * m, C - 2.6 * m); w.stroke();
      w.lineWidth = 0.09 * m;
      for (const [t, len] of [[0.35, 0.8], [0.6, 0.9], [0.85, 0.7]]) {
        const bx = C + sg * (0.3 + 1.0 * t) * m, by = C - (0.35 + 2.25 * t) * m;
        w.beginPath(); w.moveTo(bx, by); w.lineTo(bx + sg * len * 0.55 * m, by - len * 0.6 * m); w.stroke();
      }
    }
    w.fillStyle = '#000'; for (const sg of [-1, 1]) { w.beginPath(); w.arc(C + sg * 0.24 * m, C + 0.25 * m, 0.07 * m, 0, Math.PI * 2); w.fill(); }
    // in die Maske (Grün) übertragen, weich
    const md = mk.getImageData(0, 0, 2048, 2048), wd = w.getImageData(0, 0, 2048, 2048);
    for (let i = 0; i < md.data.length; i += 4) md.data[i + 1] = wd.data[i];
    mk.putImageData(md, 0, 0);
  }, 0.0003);
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.35,
    // Raster: feine Bleistiftlinien; Einlegelinie: ein schwarzer Papierstreifen
    groove: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.19, 0.18), floorGroove * 0.8);',
    replace: [['float iw = 0.011;', 'float iw = 0.02;']],
    inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.08, 0.075, 0.07), floorInlay);',
    bevel: '', bevelRough: '', refl: 0.0,
    decl: 'uniform sampler2D uMark;', uniforms: { uMark: { value: s.mask } },
    // Lichtwelle: Gegenlicht im Ring; das Papier wird durchscheinend warm, Rippung und Wasserzeichen treten hervor
    wave: `
        vec2 mk2 = texture2D(uMark, vUv).rg;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.2), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        float ink = 1.0 - smoothstep(0.08, 0.3, dot(diffuseColor.rgb, vec3(0.333)));
        float behind = 1.0 - smoothstep(uShock.x - 0.5, uShock.x + 0.2, sd);
        vec3 warm = vec3(1.0, 0.76, 0.42);
        gl_FragColor.rgb += warm * (wide * (0.3 + mk2.r * 0.45) + mk2.g * (wide * 0.9 + behind * 0.45)) * k * (1.0 - ink);
        gl_FragColor.rgb += uShockColor * ring * k * 0.25;`,
  });
  // Seiten: Papierstapel, oben das schwarze Blatt
  const side = L.sideTex(1024, 160, (u, v) => {
    const sheet = Math.floor(v * 60), tone = noise(sheet, Math.floor(u * 3), 903);
    let c = mix3([0.84, 0.8, 0.71], [0.93, 0.9, 0.82], tone);
    c = mix3(c, [0.6, 0.57, 0.5], (1 - smooth(0.0, 0.25, Math.abs(v * 60 - sheet - 0.5) - 0.25)) * 0.5);
    return mix3(c, [0.08, 0.075, 0.07], smooth(0.08, 0.06, v));
  });
  L.sides(L.sideMat(L.tex(side), { glow: 0.3, roughness: 0.95 }));
  L.hide('plateTrim');
  void r; void CELL;
  return 'Scherenschnitt';
};
