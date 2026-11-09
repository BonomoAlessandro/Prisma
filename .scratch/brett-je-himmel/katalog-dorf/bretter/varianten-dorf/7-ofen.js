// V7 Kachelofen: das Brett ist die Sitzfläche eines Kachelofens in der Stube. Im Feld 49 grün glasierte Blattkacheln
// (eine je Feld) mit gekehltem Rahmen, das Raster sind die hellen Fugen; die Glasur sammelt sich dunkel in den Kehlen und
// wird auf den Graten hell, mit feinem Craquelé. Eine Reihe schmaler Gesimskacheln statt Einlegelinie, im Rand die
// hölzerne Ofenbank aus Arve. Die Seiten sind kleine Kacheln über einem Sockel. Lichtwelle: Glut, die durch die
// Fugen leuchtet, als lodere das Feuer im Ofen auf.
__katalog.varianten.ofen = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.dorf, W2 = __katalog.w2;
  const GS = HB + 0.14, BANK = HP; // Gesimskacheln bis GS, dann Ofenbank
  const glaze = [0.085, 0.24, 0.15], glazeDark = [0.015, 0.06, 0.04], glazeEdge = [0.55, 0.58, 0.30], kitt = [0.27, 0.25, 0.22];
  const arve = [0.42, 0.28, 0.17], arve2 = [0.33, 0.21, 0.13];
  const tile = (fx, fz, size, id, x, z) => {
    // Blattkachel: Fuge, Wulst (Grat), Kehle, flacher Spiegel
    const e = Math.min(fx, 1 - fx, fz, 1 - fz) * size;
    const W = size > 0.5 ? 1 : size / 1.2;
    const joint = e < 0.012 * W + 0.004;
    const ridge = Math.exp(-Math.pow((e - 0.04 * W) / (0.016 * W), 2));
    const cove = Math.exp(-Math.pow((e - 0.085 * W) / (0.02 * W), 2));
    const tone = noise(id * 1.7, 0.3, 712);
    let c = mix3(glaze, [0.11, 0.29, 0.17], tone);
    const run = fbm(x * 14, z * 1.6, 3, 713), pool = fbm(x * 2.5, z * 2.5, 3, 719); // Laufspuren, Pfützen der Glasur
    c = c.map((v) => v * (0.72 + run * 0.4 + (pool - 0.5) * 0.3));
    c = mix3(c, glazeDark, cove * 0.9);
    c = mix3(c, glazeEdge, ridge * 0.7);
    const flow = run;
    const [cr] = W2.cells(x, z, 0.06, 714); // Craquelé
    if (cr < 0.0025) c = c.map((v) => v * 0.8);
    let h = ridge * 0.004 - cove * 0.003 + (flow - 0.5) * 0.0006;
    let rough = 0.12;
    if (joint) { c = kitt; h = -0.008; rough = 0.85; }
    return [c, rough, h, joint];
  };
  const s = L.surface(2048, (x, z) => {
    const ax = Math.abs(x), az = Math.abs(z), box = Math.max(ax, az);
    if (box < HB) {
      const i = Math.floor((x + HB) / CELL), j = Math.floor((z + HB) / CELL);
      const [c, rough, h] = tile((x + HB) / CELL - i, (z + HB) / CELL - j, CELL, i * 7 + j, x, z);
      return [c, rough, h];
    }
    if (box < GS) {
      // Gesimskacheln: schmal, gewölbt (Wulst), dunkler glasiert, 0.3 m lang
      const along = ax > az ? z : x, t = (box - HB) / (GS - HB), seg = (along + 10) / 0.3;
      const fs = seg % 1;
      let c = mix3(glazeDark, glaze, Math.sin(t * Math.PI));
      c = mix3(c, glazeEdge, Math.pow(Math.sin(t * Math.PI), 8) * 0.35);
      let h = Math.sin(t * Math.PI) * 0.006, rough = 0.15;
      if (t < 0.08 || t > 0.92 || Math.min(fs, 1 - fs) * 0.3 < 0.008 || Math.abs(ax - az) < 0.008) { c = kitt; h = -0.006; rough = 0.85; }
      return [c, rough, h];
    }
    // Ofenbank aus Arve: Bretter längs der Kante, Gehrung, Äste; abgesessen glänzend
    const side = ax > az, along = side ? z : x, k = Math.floor((box - GS) / 0.28);
    const grain = fbm(along * 0.8 + k * 3.1, box * 30, 3, 715);
    let c = mix3(arve2, arve, grain);
    const kn = Math.hypot(((along + k * 1.7) % 1.9 + 1.9) % 1.9 - 0.95, (box - GS - 0.14 - k * 0.28) * 2.2);
    if (noise(Math.floor((along + k * 1.7) / 1.9), k, 716) > 0.5 && kn < 0.035) c = mix3(c, [0.16, 0.09, 0.05], smooth(0.035, 0.015, kn));
    let h = (grain - 0.5) * 0.0008;
    const fb = ((box - GS) / 0.28) % 1;
    if (box - GS < 0.006 || Math.min(fb, 1 - fb) * 0.28 < 0.003 || Math.abs(ax - az) < 0.004) { c = [0.08, 0.05, 0.03]; h = -0.004; }
    return [c, 0.42, h];
  }, null, 0.0003);
  // Kehlen jeder Kachel als Maske für die Glut (nicht die Fugen)
  const joints = W2.mask(1024, (x, px, m) => {
    x.strokeStyle = '#fff'; x.lineWidth = 0.05 * m; x.lineJoin = 'round';
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) { const x0 = -HB + i * CELL + 0.085, z0 = -HB + j * CELL + 0.085; x.strokeRect(px(x0), px(z0), (CELL - 0.17) * m, (CELL - 0.17) * m); }
    x.filter = 'blur(3px)'; x.drawImage(x.canvas, 0, 0); x.filter = 'none';
  });
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 2.0,
    groove: '', inlay: '', bevel: '', grooveRough: '', inlayRough: '', bevelRough: '', refl: 0.55,
    decl: 'uniform sampler2D uJoints;', uniforms: { uJoints: { value: joints } },
    // Lichtwelle: die Kacheln werden heiss, Glut glimmt in der Kehle jeder Kachel, die Glasur wird warm
    wave: `
        float jm = texture2D(uJoints, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 4.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.4 + vec3(0.45, 0.2, 0.05)) * ring * k * 0.6;
        gl_FragColor.rgb += vec3(0.32, 0.09, 0.015) * (wide * 0.8 + trail * 7.0) * k;
        gl_FragColor.rgb += vec3(2.6, 0.8, 0.16) * jm * (wide * 1.3 + trail * 14.0) * k * 1.4;
        float glazeM = smoothstep(0.0, 0.035, diffuseColor.g - diffuseColor.r);
        float back = step(sd, uShock.x) * clamp(1.0 - (uShock.x - sd) / 2.2, 0.0, 1.0);
        float heat = clamp(wide * 1.1 + back * 0.95, 0.0, 1.0) * k;
        vec3 hotC = mix(vec3(0.75, 0.08, 0.02), vec3(1.7, 0.6, 0.12), clamp(wide * 1.3, 0.0, 1.0));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, hotC * (0.45 + diffuseColor.g * 2.4), heat * glazeM * 0.9);`,
  });
  L.hide('plateSides', 'plateTrim');
  // Seiten: Brett der Bank (Stirn, 6 cm), darunter kleine Kacheln (0.3 × 0.24 m) und ein dunkler Sockel
  const SIDE_H = 0.72;
  const side = L.tex(V.sideCanvas(2048, 160, PLATE, (u, v) => {
    const y = v * SIDE_H;
    if (y < 0.06) { const gr = fbm(u * 0.8, y * 60, 3, 717); return mix3(arve2, arve, gr).map((c) => c * (y < 0.008 ? 1.3 : 1)); }
    if (y > SIDE_H - 0.1) return [0.1, 0.09, 0.08].map((c) => c * (0.9 + noise(u * 9, y * 9, 718) * 0.2));
    const yy = y - 0.06, row = Math.floor(yy / 0.24), off = row % 2 ? 0.15 : 0;
    const fx = ((u + off) / 0.3) % 1, fz = (yy / 0.24) % 1;
    const [c] = tile(fx, fz, 0.27, row * 40 + Math.floor((u + off) / 0.3), u, y);
    return c;
  }), true, true);
  const g = new T.Group();
  g.add(V.box(HP, 0.0, SIDE_H, L.sideMat(side, { glow: 0.2, roughness: 0.3, env: 1.6 }), new T.MeshStandardMaterial({ color: 0x0a0908 })));
  // Funken stieben aus den Fugen, fliegen im Bogen und verlöschen
  const sp = [], rr = rng(733);
  for (let i = 0; i < 560; i++) {
    const a = -HB + Math.floor(rr() * 8) * CELL, b = (rr() * 2 - 1) * HB, c = rr() < 0.5 ? [1, 0.55, 0.15] : [1, 0.8, 0.35];
    sp.push(rr() < 0.5 ? [a, 0.01, b, ...c] : [b, 0.01, a, ...c]);
  }
  g.add(V.sparks(sp, { rise: 1.3, fall: 1.2, px: 14, width: 2.2, keep: 0.7 }));
  D.scene.add(g);
  return 'Kachelofen';
};
