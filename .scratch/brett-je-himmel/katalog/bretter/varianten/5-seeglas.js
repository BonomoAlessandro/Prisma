// 5 Seeglas: jedes Feld eine mattierte Glasfliese, Fugen als Raster, Rand aus Glaskieseln, Seiten aus dickem Glas
__katalog.varianten.seeglas = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng, parts } = L;
  const r = rng(8);
  const palette = [[0.34, 0.64, 0.60], [0.42, 0.68, 0.56], [0.58, 0.74, 0.72], [0.38, 0.60, 0.66], [0.47, 0.70, 0.64], [0.52, 0.72, 0.60]];
  const rare = [[0.82, 0.62, 0.36], [0.30, 0.42, 0.74]];
  const tiles = [];
  for (let i = 0; i < 49; i++) tiles.push(palette[Math.floor(r() * palette.length)]);
  const grout = [0.80, 0.72, 0.60];
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const fx = (x + HB) / CELL, fz = (z + HB) / CELL;
    const inField = Math.abs(x) < HB && Math.abs(z) < HB;
    const gN = noise(x * 140, z * 140, 71);
    if (inField) {
      const ix = Math.floor(fx), iz = Math.floor(fz), tx = (fx - ix - 0.5) * CELL, tz = (fz - iz - 0.5) * CELL;
      // Fliese mit gerundeten Ecken, Fuge 3 cm (je 1.5 cm)
      const half = CELL / 2 - 0.015, rc = 0.08;
      const qx = Math.max(Math.abs(tx) - (half - rc), 0), qz = Math.max(Math.abs(tz) - (half - rc), 0);
      const d = Math.hypot(qx, qz) - rc; // < 0 innen
      const inTile = smooth(0.003, -0.003, d);
      const t = tiles[iz * 7 + ix];
      const frost = fbm(x * 6, z * 6, 3, 72);
      const rim = smooth(-0.07, -0.005, d); // Rand heller (Licht im Glas)
      let c = mix3(t, [Math.min(1, t[0] * 1.12 + 0.06), Math.min(1, t[1] * 1.1 + 0.06), Math.min(1, t[2] * 1.08 + 0.06)], rim * 0.8);
      c = mix3(c, [c[0] * 0.78, c[1] * 0.82, c[2] * 0.84], smooth(-0.12, -0.45, d) * 0.7);
      c = mix3(c, [Math.min(1, c[0] + 0.25), Math.min(1, c[1] + 0.25), Math.min(1, c[2] + 0.25)], smooth(0.62, 0.8, frost) * 0.5);
      c = mix3([grout[0] * (0.9 + 0.2 * gN), grout[1] * (0.9 + 0.2 * gN), grout[2] * (0.9 + 0.2 * gN)], c, inTile);
      const h = inTile * (0.006 - Math.pow(clamp(1 + d / 0.05), 3) * 0.006) + (frost - 0.5) * 0.0006 * inTile;
      return [c, mix(0.95, 0.2 + frost * 0.18, inTile), h];
    }
    return [[grout[0] * (0.88 + 0.24 * gN), grout[1] * (0.88 + 0.24 * gN), grout[2] * (0.88 + 0.24 * gN)], 0.95, (gN - 0.5) * 0.0008];
  }, ({ color, rough, height, px, m }) => {
    // Rand: Glaskiesel in Sand gesetzt; Einlegelinie aus kobaltblauen Splittern
    const put = (x, z, rad, col, ell, rot) => {
      color.fillStyle = `rgb(${col.map((v) => Math.round(v * 255)).join(',')})`;
      color.beginPath(); color.ellipse(px(x), px(z), rad * m, rad * ell * m, rot, 0, 7); color.fill();
      color.fillStyle = 'rgba(255,255,255,0.25)';
      color.beginPath(); color.ellipse(px(x) - rad * m * 0.2, px(z) - rad * m * 0.2, rad * m * 0.55, rad * ell * m * 0.45, rot, 0, 7); color.fill();
      const hg = height.createRadialGradient(px(x), px(z), 0, px(x), px(z), rad * m);
      hg.addColorStop(0, 'rgb(170,170,170)'); hg.addColorStop(1, 'rgb(132,132,132)');
      height.fillStyle = hg; height.beginPath(); height.ellipse(px(x), px(z), rad * m, rad * ell * m, rot, 0, 7); height.fill();
      rough.fillStyle = 'rgb(105,105,105)'; rough.beginPath(); rough.ellipse(px(x), px(z), rad * m, rad * ell * m, rot, 0, 7); rough.fill();
    };
    for (let i = 0; i < 2600; i++) {
      const x = (r() * 2 - 1) * (HP - 0.02), z = (r() * 2 - 1) * (HP - 0.02);
      if (Math.max(Math.abs(x), Math.abs(z)) < HB + 0.26) continue;
      const col = r() < 0.08 ? rare[Math.floor(r() * 2)] : palette[Math.floor(r() * palette.length)];
      put(x, z, 0.025 + r() * 0.05, col, 0.55 + r() * 0.4, r() * 6.3);
    }
    const ring = HB + 0.15;
    for (let side = 0; side < 4; side++) for (let t = -ring; t < ring; t += 0.035 + r() * 0.025) {
      const off = (r() - 0.5) * 0.015;
      const [x, z] = side === 0 ? [t, -ring + off] : side === 1 ? [ring + off, t] : side === 2 ? [-t, ring + off] : [-ring + off, -t];
      put(x, z, 0.014 + r() * 0.01, [0.22, 0.36, 0.72], 0.6 + r() * 0.3, r() * 6.3);
    }
  }, 0.00025);
  // Licht im Glas (vorgetäuscht): die Fliesen leuchten schwach aus sich
  const m = D.floorMaterial;
  m.emissiveMap = s.map; m.emissive = new T.Color(0.05, 0.08, 0.08);
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.9,
    groove: '', inlay: '', bevel: '', grooveRough: '', inlayRough: '', bevelRough: '',
    refl: 0.45,
    // Lichtwelle: Fliese um Fliese leuchtet von innen auf, wie Sonne, die durch Glas fällt
    wave: `
        vec2 cp = (vUv - 0.5) * ${PLATE.toFixed(3)};
        vec2 cell = floor((cp + ${HB.toFixed(3)}) / ${CELL.toFixed(3)});
        float inF = step(abs(cp.x), ${HB.toFixed(3)}) * step(abs(cp.y), ${HB.toFixed(3)});
        vec2 cc = (cell + 0.5) * ${CELL.toFixed(3)} - ${HB.toFixed(3)};
        float cd = length(cc);
        float tileGlow = exp(-pow((cd - uShock.x) / 0.75, 2.0)) * inF * smoothstep(0.2, 0.4, dot(diffuseColor.rgb, vec3(0.33)));
        gl_FragColor.rgb += (diffuseColor.rgb + 0.15) * vec3(0.8, 1.15, 1.1) * tileGlow * min(1.0, uShock.y * 3.0) * 2.4;
        gl_FragColor.rgb += uShockColor * ring * uShock.y * 0.35 * (1.0 - inF);`,
  });
  // Seiten: dickes, durchscheinendes Glas
  L.skyBehind();
  const grad = L.canvas(16, 128), gx = grad.getContext('2d');
  const lg = gx.createLinearGradient(0, 0, 0, 128);
  lg.addColorStop(0, '#c8eee4'); lg.addColorStop(0.1, '#5cbfb0'); lg.addColorStop(0.6, '#1f8580'); lg.addColorStop(1, '#125a62');
  gx.fillStyle = lg; gx.fillRect(0, 0, 16, 128);
  const glass = new T.MeshStandardMaterial({
    map: L.tex(grad), color: 0xffffff, transparent: true, opacity: 0.86, roughness: 0.1, metalness: 0,
    emissiveMap: null, emissive: new T.Color(0.03, 0.17, 0.16), envMapIntensity: 2.2, depthWrite: false,
  });
  L.sides(glass);
  L.hide('plateTrim');
  // Unterseite der Platte von unten: durchscheinend wie die Seiten
  const under = new T.Mesh(new T.PlaneGeometry(PLATE, PLATE), new T.MeshStandardMaterial({ color: 0x2c8f8c, transparent: true, opacity: 0.55, roughness: 0.2, depthWrite: false }));
  under.rotation.x = Math.PI / 2; under.position.y = -0.41;
  D.scene.add(under);
  return 'Seeglas';
};
