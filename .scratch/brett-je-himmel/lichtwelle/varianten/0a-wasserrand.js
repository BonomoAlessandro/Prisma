// 6 Gezeitenbecken: Feld aus hellem Sandstein, im Rand eine flache Rinne mit Wasser (Spiegelung nur dort), Felslippe
// aussen. Ausblick (wasserrand-ausblick): das Wasser fällt in Schleiern hinunter ins Meer
const wasserrand = async (L, ausblick) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng, parts } = L;
  const r = rng(13);
  const IN = HB + 0.12, OUT = HP - 0.13; // Rinne zwischen IN und OUT
  const stone = [0.82, 0.70, 0.56], stone2 = [0.72, 0.58, 0.45], lip = [0.62, 0.46, 0.40];
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const g = fbm(x * 0.5, z * 0.5, 5, 81), layer = fbm(x * 0.15 + g, z * 2.5, 3, 82), fine = noise(x * 150, z * 150, 83);
    if (box < IN) {
      let c = mix3(stone, stone2, smooth(0.3, 0.75, layer));
      c = mix3(c, [c[0] * 0.92, c[1] * 0.9, c[2] * 0.9], fine * 0.5);
      const wetEdge = smooth(IN - 0.12, IN, box);
      c = mix3(c, [c[0] * 0.72, c[1] * 0.7, c[2] * 0.7], wetEdge);
      return [c, 0.86 - wetEdge * 0.4, (layer - 0.5) * 0.002 + (fine - 0.5) * 0.0005];
    }
    if (box < OUT) {
      // Wasser: Grund (Sand, Kiesel) türkis getönt, Lichtnetz (Kaustik), Schaum an den Kanten
      const cx = Math.abs(fbm(x * 2.2 + 3, z * 2.2, 3, 84) - 0.5), cz = Math.abs(fbm(x * 2.2, z * 2.2 + 7, 3, 85) - 0.5);
      const caustic = Math.pow(1 - Math.min(cx, cz) * 4.2, 6);
      let c = mix3([0.33, 0.60, 0.58], [0.42, 0.70, 0.64], g);
      c = mix3(c, [0.86, 0.97, 0.92], clamp(caustic) * 0.55);
      const foamIn = smooth(IN + 0.07 + (noise(x * 9, z * 9, 86) - 0.5) * 0.06, IN, box);
      const foamOut = smooth(OUT - 0.05 + (noise(x * 11, z * 11, 87) - 0.5) * 0.04, OUT, box) * 0.6;
      const foam = clamp(foamIn + foamOut) * (0.6 + 0.4 * noise(x * 40, z * 40, 88));
      c = mix3(c, [0.95, 0.97, 0.95], foam);
      const wave = Math.sin((x * 0.7 + z * 0.7) * 22 + fbm(x, z, 2, 89) * 6) * 0.0012 + (noise(x * 30, z * 30, 90) - 0.5) * 0.0008;
      return [c, mix(0.03, 0.7, foam), -0.004 + wave];
    }
    const lc = mix3(lip, [0.48, 0.38, 0.38], fbm(x * 3, z * 3, 3, 91));
    return [lc, 0.7, 0.006 + (fine - 0.5) * 0.002];
  }, null, 0.00025);
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.9,
    groove: 'diffuseColor.rgb *= 1.0 - floorGroove * 0.5;', inlay: '', bevel: '', inlayRough: '', bevelRough: '',
    refl: 0.85,
    // Lichtwelle: Licht über den Stein, in der Rinne läuft ein Schwall mit Schaum rundum
    wave: `
        vec2 cp = (vUv - 0.5) * ${PLATE.toFixed(3)};
        float bx = max(abs(cp.x), abs(cp.y));
        float chan = step(${IN.toFixed(3)}, bx) * step(bx, ${OUT.toFixed(3)});
        gl_FragColor.rgb += (uShockColor + vec3(0.2)) * (ring + trail * 0.05) * min(1.0, uShock.y * 3.0) * 1.2 * (1.0 - chan);
        float swell = exp(-pow((sd - uShock.x) / 0.9, 2.0)) * chan;
        float foamN = fract(sin(dot(floor(vUv * 1200.0), vec2(12.9898, 78.233))) * 43758.5453);
        gl_FragColor.rgb += (vec3(0.6, 0.85, 0.8) + uShockColor) * swell * (0.5 + 0.5 * foamN) * min(1.0, uShock.y * 3.0) * 2.2;`,
  });
  const side = L.sideTex(2048, 128, (u, v) => {
    const g = fbm(u * 1.4, v * 3, 4, 92), streak = fbm(u * 18, v * 0.6, 3, 93);
    let c = mix3(lip, [0.44, 0.34, 0.34], smooth(0.3, 0.7, g));
    c = mix3(c, [0.22, 0.20, 0.22], smooth(0.55, 0.75, streak) * 0.7); // Rinnsale
    return mix3(c, [0.28, 0.34, 0.22], smooth(0.7, 1, v) * 0.6);
  });
  L.sides(L.sideMat(L.tex(side), { roughness: 0.5, glow: 0.28, env: 1.6 }));
  L.hide('plateTrim');
  if (ausblick) {
    // Schleier aus fallendem Wasser bis aufs Meer (3 m tiefer)
    const fall = L.canvas(512, 256), fx = fall.getContext('2d');
    fx.filter = 'blur(1.6px)';
    for (let i = 0; i < 300; i++) {
      const x = r() * 512, w = 2 + r() * 5, a = 0.04 + r() * 0.1;
      const lg = fx.createLinearGradient(0, 0, 0, 256);
      lg.addColorStop(0, `rgba(225,250,246,${a * 1.6})`); lg.addColorStop(0.5, `rgba(170,232,224,${a})`); lg.addColorStop(1, 'rgba(200,240,235,0.02)');
      fx.fillStyle = lg; fx.fillRect(x, r() * 20, w, 256);
    }
    fx.filter = 'none';
    const lip = fx.createLinearGradient(0, 0, 0, 30);
    lip.addColorStop(0, 'rgba(240,252,250,0.75)'); lip.addColorStop(1, 'rgba(240,252,250,0)');
    fx.fillStyle = lip; fx.fillRect(0, 0, 512, 30);
    const ft = L.tex(fall, true, true); ft.repeat.set(5, 1);
    const fm = new T.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false, side: T.DoubleSide, opacity: 0.9, color: 0xcff5ef });
    for (let k = 0; k < 4; k++) {
      const pl = new T.Mesh(new T.PlaneGeometry(PLATE * 0.97, 3.0), fm);
      const a = k * Math.PI / 2;
      pl.position.set(Math.sin(a) * (HP + 0.04), -1.5, Math.cos(a) * (HP + 0.04));
      pl.rotation.y = a;
      D.scene.add(pl);
    }
    // Gischt unten
    const sp = L.canvas(128), sx = sp.getContext('2d'), rg = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, 'rgba(255,255,255,0.8)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    sx.fillStyle = rg; sx.fillRect(0, 0, 128, 128);
    const spMat = new T.SpriteMaterial({ map: L.tex(sp), transparent: true, depthWrite: false, opacity: 0.5 });
    for (let i = 0; i < 70; i++) {
      const t = (r() * 2 - 1) * HP, side = Math.floor(r() * 4);
      const [x, z] = side === 0 ? [t, HP + 0.1] : side === 1 ? [HP + 0.1, t] : side === 2 ? [t, -HP - 0.1] : [-HP - 0.1, t];
      const spr = new T.Sprite(spMat); spr.position.set(x, -2.9 + r() * 0.2, z); spr.scale.setScalar(0.6 + r() * 0.8);
      D.scene.add(spr);
    }
  }
  return ausblick ? 'Gezeitenbecken (Ausblick: Wasserfall)' : 'Gezeitenbecken';
};
__katalog.varianten.wasserrand = (L) => wasserrand(L, false);
__katalog.varianten['wasserrand-ausblick'] = (L) => wasserrand(L, true);
