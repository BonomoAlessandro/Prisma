// W3 Granitblock mit Flechten: das Brett ist ein Block aus Alpengranit, oben gesägt und gestockt. Im Rand und an den
// Seiten die gespaltene Bruchfläche mit den halben Bohrlöchern aus dem Steinbruch; darauf Landkartenflechte,
// Gelbflechte und graue Blattflechten. Die Lichtwelle lässt den Glimmer im Granit funkeln
__katalog.varianten.granit = async (L) => {
  const { T, D, PLATE, HB, HP, fbm, noise, clamp, smooth, mix, mix3, rng, hash } = L;
  const W2 = __katalog.w2, WD = __katalog.wald, r = rng(401);
  const gray = [0.47, 0.49, 0.51], dark = [0.12, 0.13, 0.14], feld = [0.66, 0.65, 0.63], quartz = [0.40, 0.43, 0.47];
  const crystal = (x, z, s) => { // Körnung: Feldspat hell, Quarz grau, Biotit schwarz
    const a = noise(x * s, z * s, 402), b = noise(x * s * 2.3, z * s * 2.3, 403), cc = noise(x * s * 0.6 + 9, z * s * 0.6, 404);
    let c = mix3(gray, quartz, smooth(0.4, 0.6, cc));
    c = mix3(c, feld, smooth(0.6, 0.7, a) * 0.85);
    c = mix3(c, dark, smooth(0.74, 0.8, b));
    return [c, b];
  };
  // Flechten als Kolonien: Landkartenflechte (gelbgrün, schwarz gefeldert und umrandet), Gelbflechte (orange, klein),
  // Blattflechte (graugrün, Rosette)
  const colonies = new Map();
  const addCol = (x, z, rad, type) => {
    const key = Math.floor(x / 0.5) + ',' + Math.floor(z / 0.5);
    if (!colonies.has(key)) colonies.set(key, []);
    colonies.get(key).push([x, z, rad, type]);
  };
  const lichen = (x, z, c, seed = 0, cols = colonies) => {
    const kx = Math.floor(x / 0.5), kz = Math.floor(z / 0.5);
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      for (const [cx, cz, rad, type] of cols.get((kx + i) + ',' + (kz + j)) ?? []) {
        const d = Math.hypot(x - cx, z - cz) / rad + (noise(x * 14 + seed, z * 14, 405 + type) - 0.5) * 0.45;
        if (d > 1.08) continue;
        if (type === 0) { // Landkartenflechte
          const [e] = W2.cells(x, z, 0.014, 406);
          let l = mix3([0.60, 0.64, 0.30], [0.52, 0.57, 0.26], noise(x * 60, z * 60, 407));
          l = mix3(l, [0.1, 0.1, 0.09], 1 - smooth(0.0, 0.0025, e));
          c = mix3(c, l, 1 - smooth(0.96, 1.0, d));
          c = mix3(c, [0.09, 0.09, 0.08], smooth(0.94, 0.99, d) * (1 - smooth(1.02, 1.08, d)));
        } else if (type === 1) { // Gelbflechte
          c = mix3(c, mix3([0.74, 0.50, 0.22], [0.66, 0.42, 0.2], noise(x * 80, z * 80, 408)), (1 - smooth(0.9, 1.0, d)) * 0.9);
        } else { // Blattflechte
          const lobe = 0.5 + 0.5 * Math.sin(Math.atan2(z - cz, x - cx) * 9 + d * 6);
          c = mix3(c, mix3([0.56, 0.6, 0.54], [0.46, 0.5, 0.45], smooth(0.2, 0.7, 1 - d) * lobe), (1 - smooth(0.92, 1.0, d)) * 0.85);
        }
      }
    }
    return c;
  };
  for (let i = 0; i < 150; i++) {
    const t = r(), type = t < 0.5 ? 0 : t < 0.68 ? 1 : 2;
    const [x, z] = __katalog.wald.inRim(r, HB + 0.25, HP - 0.02);
    addCol(x, z, type === 1 ? 0.03 + r() * 0.05 : 0.06 + r() * 0.2, type);
  }
  // Umriss: Kanten leicht ausgebrochen, eine Ecke stärker abgeschlagen
  const R = (a) => {
    const sq = 4.895 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
    let d = (noise(Math.cos(a) * 9 + 2, Math.sin(a) * 9, 410) - 0.5) * 0.05 + Math.pow(noise(Math.cos(a) * 4, Math.sin(a) * 4 + 5, 411), 3) * 0.12;
    const dc = Math.abs(((a - Math.PI * 1.75) + Math.PI * 3) % (Math.PI * 2) - Math.PI); // Ecke hinten rechts (x+, z−)
    d += Math.max(0, 0.42 - dc * 3.2);
    return sq - d;
  };
  const { Rof, pts } = WD.polar(R, 1440);
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    let [c, b] = crystal(x, z, 60);
    const rim = smooth(HB + 0.2, HB + 0.3, box); // gestockt → gespalten
    // Feld: gestockt, fein und ruhig; heller Hauch
    c = mix3(c, mix3(c, [0.53, 0.55, 0.57], 0.4), 1 - rim);
    const pock = noise(x * 260, z * 260, 412);
    let h = (pock - 0.5) * 0.0006 * (1 - rim);
    // Rand: Spaltfläche, wellig, mit halben Bohrlöchern an der Aussenkante
    const sp = fbm(x * 1.2, z * 1.2, 4, 413);
    h += rim * (sp - 0.5) * 0.04;
    c = mix3(c, [c[0] * 0.86, c[1] * 0.87, c[2] * 0.9], rim * smooth(0.4, 0.7, sp) * 0.6);
    const edge = Rof(x, z) - Math.hypot(x, z);
    if (rim > 0) c = mix3(c, lichen(x, z, c), rim);
    c = mix3(c, [c[0] * 0.7, c[1] * 0.7, c[2] * 0.72], (1 - smooth(0.0, 0.05, edge)) * 0.6);
    // Glimmer: Maske für die Welle
    const mica = hash(Math.floor(x * 70), Math.floor(z * 70), 7) > 0.975 ? 1 : 0;
    return [c, mix(0.78, 0.92, rim), h, mica * (1 - rim * 0.5)];
  }, ({ color, px }) => W2.clip(color, px, pts), 0.0004);
  D.floorMaterial.alphaTest = 0.5;
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.5,
    // Raster: Sägeschnitte (dunkel); Einlegelinie: polierter Streifen, dunkler und glänzend
    groove: 'diffuseColor.rgb *= 1.0 - floorGroove * 0.7;',
    replace: [['float lw = 0.00458;', 'float lw = 0.0058;'], ['float iw = 0.011;', 'float iw = 0.035;']],
    inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.55, floorInlay);',
    inlayRough: 'roughnessFactor = mix(roughnessFactor, 0.18, floorInlay);', bevel: '', bevelRough: '', refl: 0.3,
    decl: 'uniform sampler2D uMica;', uniforms: { uMica: { value: s.mask } },
    // Lichtwelle: der Glimmer funkelt im Ring, dahinter ein kühler Schimmer
    wave: `
        float mi = texture2D(uMica, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 2.5), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.5 + vec3(0.25, 0.3, 0.38)) * (ring * 0.55 + trail * 0.6) * k;
        gl_FragColor.rgb += vec3(2.6, 2.7, 3.0) * mi * (wide * 1.4 + trail * 0.15) * k;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // Seiten: Spaltfläche mit halben Bohrlöchern (senkrechte Rinnen alle 14 cm), Flechten nach unten weniger
  const DEPTH = 0.62;
  // Flechten der Seiten: eigene Kolonien auf einem Streifen 4 m × 0.62 m, nach unten seltener
  const side = new Map();
  for (let i = 0; i < 40; i++) {
    const x = r() * 4, v = Math.pow(r(), 1.6) * 0.9, t = r(), type = t < 0.5 ? 0 : t < 0.7 ? 1 : 2;
    const key = Math.floor(x / 0.5) + ',' + Math.floor(v * DEPTH / 0.5);
    if (!side.has(key)) side.set(key, []);
    side.get(key).push([x, v * DEPTH, type === 1 ? 0.03 + r() * 0.04 : 0.05 + r() * 0.12, type]);
  }
  const lichenSide = (x, v, c) => lichen(x, v * DEPTH, c, 31, side);
  const sc = L.sideTex(2048, 160, (u, v) => {
    const x = u / L.PLATE * 4; // 4 m Breite
    let [c] = crystal(x, v * DEPTH, 60);
    const hole = Math.abs(((x + 0.07) % 0.14) - 0.07) / 0.07, chan = 1 - smooth(0.0, 0.32, hole);
    c = mix3(c, [c[0] * 0.62, c[1] * 0.63, c[2] * 0.66], chan * (1 - smooth(0.55, 0.75, v)) * 0.8);
    c = mix3(c, [c[0] * 1.12, c[1] * 1.12, c[2] * 1.12], (1 - smooth(0.0, 0.08, Math.abs(hole - 0.36))) * (1 - smooth(0.55, 0.75, v)) * 0.4);
    const sp = fbm(x * 1.5, v * 1.2, 3, 414);
    c = mix3(c, [c[0] * 0.8, c[1] * 0.8, c[2] * 0.84], smooth(0.45, 0.7, sp) * 0.5);
    return lichenSide(x, v, c);
  });
  const sideMap = WD.slabTex(sc, 4, DEPTH);
  const block = W2.slab(pts, { depth: DEPTH, side: L.sideMat(sideMap, { glow: 0.26, roughness: 0.9 }), cap: new T.MeshStandardMaterial({ color: 0x55585c, roughness: 0.95 }) });
  block.castShadow = true;
  D.scene.add(block);
  return 'Granitblock';
};
