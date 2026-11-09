// 7 Gemalt: Sandstein in den Farben des Panoramas, wenige ruhige Töne, gemalte Linien; der Pinsel der Pflanzen malt
// das Brett mit (Schutzquader aus, Brett als gemalte Ebene angemeldet)
__katalog.varianten.gemalt = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng, parts } = L;
  const r = rng(17);
  const light = [0.95, 0.74, 0.55], mid = [0.86, 0.60, 0.45], shade = [0.62, 0.45, 0.47], hi = [1.0, 0.86, 0.66];
  const q = (v, n) => Math.round(v * n) / n; // in wenige Töne
  const s = L.surface(1024, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const g = fbm(x * 0.32, z * 0.32, 4, 101), d = fbm(x * 1.1, z * 1.1, 3, 102);
    let t = q(clamp(g * 1.4 - 0.2 + (d - 0.5) * 0.3), 3);
    let c = mix3(light, mid, t * 0.8);
    const det = q(fbm(x * 2.6, z * 2.6, 3, 105), 4), det2 = fbm(x * 7, z * 1.8, 2, 106);
    c = mix3(c, mix3(c, shade, 0.5), (det - 0.45) * 0.55);
    c = mix3(c, hi, smooth(0.62, 0.78, det2) * 0.35);
    // Rand: gemalte Wellenlinien wie der Sand im Panorama
    const rim = smooth(HB + 0.1, HB + 0.25, box);
    const wv = Math.sin((x * 0.7 + z * 0.7) * 6 + fbm(x * 0.5, z * 0.5, 2, 103) * 9);
    c = mix3(c, mix3(mid, shade, 0.4), rim * smooth(0.75, 0.95, wv) * 0.8);
    c = mix3(c, hi, rim * smooth(-0.95, -0.75, -wv) * 0.0);
    // zur Kante hin ein violetter Schatten (gemalte Verdunkelung)
    c = mix3(c, shade, smooth(HP - 0.35, HP, box) * 0.6);
    return [c, 0.95, 0];
  }, ({ color, px, m }) => {
    // Rasterlinien gemalt: leicht ungleich breit, warmes Violettbraun
    color.lineCap = 'round';
    for (let k = 0; k <= 7; k++) {
      const p = -HB + k * CELL;
      for (const vert of [true, false]) {
        const seg = 24;
        for (let i = 0; i < seg; i++) {
          const a0 = -HB + i / seg * 2 * HB, a1 = -HB + (i + 1) / seg * 2 * HB;
          color.strokeStyle = `rgba(112,72,78,${0.75 + r() * 0.2})`;
          color.lineWidth = (0.018 + r() * 0.01) * m;
          color.beginPath();
          vert ? (color.moveTo(px(p), px(a0)), color.lineTo(px(p), px(a1))) : (color.moveTo(px(a0), px(p)), color.lineTo(px(a1), px(p)));
          color.stroke();
        }
      }
    }
    // Einlegelinie: helle, gemalte Linie
    const ring = HB + 0.16;
    color.strokeStyle = 'rgba(255,236,204,0.95)'; color.lineWidth = 0.03 * m;
    color.strokeRect(px(-ring), px(-ring), 2 * ring * m, 2 * ring * m);
  });
  L.floor({
    map: s.map, rough: s.rough, normal: null, roughness: 1, envMapIntensity: 0.3,
    groove: '', inlay: '', bevel: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.88, 0.7), floorBevel * 0.9);', bevelRough: 'roughnessFactor = 0.95;',
    grooveRough: '', inlayRough: '',
    refl: 0.0,
    // Lichtwelle: ein breiter, warmer Lichtring, den der Pinsel mitmalt
    wave: `
        float band = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
        gl_FragColor.rgb += (uShockColor * 0.7 + vec3(0.55, 0.42, 0.22)) * (band * 0.75 + ring * 0.5) * min(1.0, uShock.y * 3.0) * 1.6;`,
  });
  const side = L.sideTex(1024, 64, (u, v) => {
    const g = q(clamp(fbm(u * 0.8, v * 2, 3, 104) * 1.3 - 0.15), 2);
    let c = mix3([0.56, 0.42, 0.50], [0.44, 0.34, 0.45], g);
    return mix3([0.98, 0.80, 0.62], c, smooth(0.0, 0.14, v)); // helle Kante oben
  });
  L.sides(L.sideMat(L.tex(side), { roughness: 1, glow: 0.45 }));
  L.hide('plateTrim');
  // Pinsel: Brett anmelden, Schutzquader nicht zeichnen
  const R = D.renderer, render = R.render.bind(R);
  R.render = (obj, cam) => {
    const p = obj?.geometry?.parameters;
    if (obj?.isMesh && p && p.height === 5 && Math.abs(p.width - (PLATE + 1)) < 1e-6) return;
    return render(obj, cam);
  };
  const root = new T.Group();
  D.scene.add(root);
  root.add(parts.floorTop, parts.plateSides);
  const off = D.brushPass.supported ? D.brushPass.add({
    root, brush: { size: 0.28, uniformity: 4, sharpness: 0.8, eccentricity: 1.0 }, center: new T.Vector3(0, 10, -42),
    uniforms: { uFade: { value: 1 }, uReady: { value: 1 } },
  }) : null;
  return off ? 'Gemalt (Pinsel an)' : 'Gemalt (Pinsel nicht verfügbar)';
};
