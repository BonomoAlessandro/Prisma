// D6 Playa: das Brett ist ein Stück getrockneter Salztonebene (Deadvlei, Racetrack Playa). Im Rand grosse Schollen mit
// tiefen Trockenrissen, im Feld nur feine Haarrisse; drei Wandersteine mit langen Spuren. Bei der Lichtwelle quillt
// Licht aus den Rissen
__katalog.varianten.playa = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const W2 = __katalog.w2, r = rng(121);
  const clay = [0.95, 0.89, 0.80], clay2 = [0.88, 0.80, 0.70];
  // Wandersteine und ihre Spuren (auf dem Rand)
  const stones = [
    { p: [[-4.62, -3.0], [-4.55, -1.6], [-4.66, -0.2], [-4.58, 0.9]], s: 0.13 },
    { p: [[3.2, 4.62], [1.9, 4.55], [0.4, 4.68], [-0.6, 4.6]], s: 0.1 },
    { p: [[4.6, 0.6], [4.66, 1.8], [4.55, 2.9]], s: 0.15 },
  ];
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const inF = 1 - smooth(HB + 0.08, HB + 0.3, box);
    const [eBig] = W2.cells(x, z, 0.42, 122), [eFine] = W2.cells(x + 7, z - 3, 0.16, 124);
    const g = fbm(x * 0.6, z * 0.6, 4, 125);
    let c = mix3(clay, clay2, smooth(0.3, 0.75, g));
    // Rand: tiefe Risse mit aufgebogenen, hellen Schollenkanten; Feld: feine, blasse Haarrisse
    const crack = smooth(0.02, 0.006, eBig) * (1 - inF);
    const lip = smooth(0.06, 0.02, eBig) * (1 - crack) * (1 - inF);
    const hair = smooth(0.006, 0.0015, eFine) * (inF * 0.35 + (1 - inF) * 0.6);
    c = mix3(c, [1.0, 0.97, 0.92], lip * 0.5);
    c = mix3(c, [0.42, 0.32, 0.26], crack * 0.9);
    c = mix3(c, [0.72, 0.62, 0.52], hair);
    const h = -crack * 0.012 + lip * 0.004 - hair * 0.0015 + (g - 0.5) * 0.001;
    return [c, 0.95, h];
  }, ({ color, height, px, m }) => {
    // Spuren der Wandersteine: glatte, dunklere Rinnen
    for (const st of stones) {
      for (const [ctx, style, w] of [[color, 'rgba(150,120,95,0.55)', st.s * 1.5], [height, 'rgb(110,110,110)', st.s * 1.4]]) {
        ctx.strokeStyle = style; ctx.lineWidth = w * m; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); st.p.forEach(([x, z], i) => (i ? ctx.lineTo(px(x), px(z)) : ctx.moveTo(px(x), px(z)))); ctx.stroke();
      }
    }
  }, 0.00025);
  // Rissmaske für die Lichtwelle
  const cm = W2.mask(1024, (x, px, m) => {
    const im = x.getImageData(0, 0, 1024, 1024);
    for (let j = 0; j < 1024; j++) for (let i = 0; i < 1024; i++) {
      const wx = -HP + (i + 0.5) * PLATE / 1024, wz = -HP + (j + 0.5) * PLATE / 1024;
      const box = Math.max(Math.abs(wx), Math.abs(wz)), inF = 1 - smooth(HB + 0.08, HB + 0.3, box);
      const [eBig] = W2.cells(wx, wz, 0.42, 122), [eFine] = W2.cells(wx + 7, wz - 3, 0.16, 124);
      const v = Math.max(smooth(0.03, 0.006, eBig) * (1 - inF), smooth(0.008, 0.002, eFine) * 0.7);
      const k = (j * 1024 + i) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = v * 255;
    }
    x.putImageData(im, 0, 0);
  });
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.5,
    groove: 'diffuseColor.rgb *= 1.0 - floorGroove * 0.5;', inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.7, 0.58, 0.48), floorInlay);',
    bevel: '', bevelRough: '', refl: 0.0,
    decl: 'uniform sampler2D uCrack;', uniforms: { uCrack: { value: cm } },
    // Lichtwelle: warmes Licht quillt aus den Rissen, wo der Ring vorbeizieht
    wave: `
        float ck = texture2D(uCrack, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 4.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.5 + vec3(0.3, 0.22, 0.15)) * ring * k * 0.8;
        gl_FragColor.rgb += vec3(1.9, 1.0, 0.4) * ck * (wide + trail * 0.3) * k * 2.6;`,
  });
  // Seiten: Schichten aus getrocknetem Ton, mit senkrechten Rissen
  const side = L.sideTex(2048, 128, (u, v) => {
    const layer = Math.sin(v * 22 + fbm(u * 0.5, v, 2, 126) * 3) * 0.5 + 0.5;
    let c = mix3(clay2, [0.80, 0.70, 0.60], layer * 0.6);
    const vc = smooth(0.985, 1, Math.abs(Math.sin(u * 7 + fbm(u, v * 2, 2, 127) * 2)));
    c = mix3(c, [0.45, 0.36, 0.3], vc * 0.8);
    return mix3(c, [0.86, 0.6, 0.48], smooth(0.6, 1, v) * 0.35); // unten der warme Widerschein des Sands
  });
  L.sides(L.sideMat(L.tex(side), { glow: 0.34, roughness: 0.95 }));
  L.hide('plateTrim');
  // Wandersteine
  const g = new T.Group();
  for (const st of stones) {
    const geo = new T.DodecahedronGeometry(st.s, 0); geo.scale(1.2, 0.7, 1);
    const mesh = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x3a302c, roughness: 0.7, flatShading: true, emissive: 0x18120f }));
    const [x, z] = st.p[st.p.length - 1];
    mesh.position.set(x, st.s * 0.45, z); mesh.rotation.y = r() * 6; mesh.castShadow = true;
    g.add(mesh);
  }
  D.scene.add(g);
  return 'Playa';
};
