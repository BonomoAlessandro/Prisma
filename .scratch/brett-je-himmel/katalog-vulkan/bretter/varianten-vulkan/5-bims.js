// V5 Bimsfloss: das Brett ist ein Floss aus Bimsstein, dem Stein, der schwimmt. Hell, leicht und porös: im Feld glatt
// geschliffen mit feinen Poren, im Rand rau mit langgezogenen Blasen. Der Umriss ist rundlich, darunter ein bauchiger
// Körper, den die Lava von unten warm anleuchtet. Lichtwelle: Licht scheint durch die Poren wie durch eine Laterne
__katalog.varianten.bims = async (L) => {
  const { T, D, PLATE, HB, HP, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.vk;
  const pts = V.roundedSquare(4.82, 1.5, 360, (a) => (noise(Math.cos(a) * 2.5 + 3, Math.sin(a) * 2.5, 601) - 0.5) * 0.14 - 0.02);
  const pumice = [0.84, 0.8, 0.72], pumice2 = [0.76, 0.71, 0.63];
  // Poren: im Feld fein und rund, im Rand gross und in Fliessrichtung gestreckt
  const pores = (x, z, inF) => {
    const st = mix(2.6, 1.0, inF); // Streckung längs x im Rand
    const [, , f1a] = V.cells(x / st, z, mix(0.05, 0.022, inF), 602);
    const [, , f1b] = V.cells(x / st + 3.1, z - 1.7, mix(0.11, 0.05, inF), 603);
    const ra = mix(0.016, 0.009, inF) * (0.6 + 0.8 * noise(x * 20, z * 20, 604));
    const rb = mix(0.03, 0.017, inF) * (0.5 + noise(x * 9, z * 9, 605));
    return Math.max(smooth(ra, ra * 0.5, f1a), smooth(rb, rb * 0.6, f1b) * (inF > 0.5 ? 0.6 : 1));
  };
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const inF = 1 - smooth(HB + 0.1, HB + 0.35, box);
    const g = fbm(x * 0.6, z * 0.6, 4, 606);
    let c = mix3(pumice, pumice2, smooth(0.35, 0.75, g));
    c = mix3(c, [0.88, 0.85, 0.78], smooth(0.6, 0.8, fbm(x * 3, z * 3, 2, 607)) * 0.4);
    c = mix3(c, [0.7, 0.64, 0.56], Math.pow(noise(x * 1.5, z * 26, 614), 4) * 0.5); // Fasern
    const p = pores(x, z, inF);
    c = mix3(c, [0.4, 0.34, 0.3], p * mix(0.95, 0.85, inF));
    const lump = (1 - inF) * (fbm(x * 1.5, z * 1.5, 4, 608) - 0.5) * 0.02;
    return [c, 0.95, -p * mix(0.008, 0.002, inF) + lump];
  }, ({ color, px }) => V.clip(color, px, pts), 0.00025);
  const pm = V.maskFn(1024, (x, z) => { const box = Math.max(Math.abs(x), Math.abs(z)); return pores(x, z, 1 - smooth(HB + 0.1, HB + 0.35, box)); });
  D.floorMaterial.alphaTest = 0.5;
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.4,
    groove: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.39, 0.37), floorGroove * 0.85);',
    inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.18, 0.18), floorInlay);',
    bevel: '', bevelRough: '', refl: 0.0,
    decl: 'uniform sampler2D uPore;', uniforms: { uPore: { value: pm } },
    // Lichtwelle: warmes Licht scheint aus den Poren
    wave: `
        float po = texture2D(uPore, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 2.5), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.4 + vec3(0.25, 0.17, 0.08)) * ring * k * 0.6;
        gl_FragColor.rgb += vec3(1.5, 0.75, 0.25) * po * (wide + trail * 0.2) * k * 1.5;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // bauchiger Körper
  const hp = pts.filter((_, i) => i % 2 === 0);
  const prof = [[-0.003, 1.0], [-0.1, 0.998], [-0.26, 0.99], [-0.45, 0.965], [-0.65, 0.91], [-0.85, 0.79], [-1.0, 0.6], [-1.1, 0.34]];
  const rings = prof.map(([y, sc], k) => [y, (x, z, u) => {
    const n = k ? (fbm(u * 14, k * 0.7, 3, 609) - 0.5) * 0.14 : 0;
    return [x * (sc + n * 0.15), z * (sc + n * 0.15), k ? (noise(u * 30, k, 610) - 0.5) * 0.08 : 0];
  }]);
  const geo = V.hullGeo(hp, rings, { tip: [0.3, -1.15, -0.2], flat: false });
  const W = 4096, Hh = 256, cc = L.canvas(W, Hh), cx = cc.getContext('2d'), ci = cx.createImageData(W, Hh);
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
    const u = i / W * 36, v = j / Hh;
    const g = fbm(u * 0.8, v * 2, 3, 611);
    let c = mix3(pumice, pumice2, g);
    const [, , f1] = V.cells(u / 2.2, v * 1.1, 0.045, 612), rr = 0.014 * (0.5 + noise(u * 7, v * 9, 613));
    c = mix3(c, [0.38, 0.35, 0.33], smooth(rr, rr * 0.5, f1) * 0.85);
    const k = (j * W + i) * 4;
    ci.data[k] = c[0] * 255; ci.data[k + 1] = c[1] * 255; ci.data[k + 2] = c[2] * 255; ci.data[k + 3] = 255;
  }
  cx.putImageData(ci, 0, 0);
  const body = new T.Mesh(geo, V.lavaMat({ map: V.htex(cc), roughness: 0.95, envMapIntensity: 0.5 }, { down: 0.85, side: 0.42, lo: -1.0, hi: 0.0 }, `
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.5), 2.0));
        gl_FragColor.rgb += vec3(0.7, 0.45, 0.2) * wide * min(1.0, uShock.y * 3.0) * 0.5;`));
  body.receiveShadow = true;
  D.scene.add(body);
  return 'Bimsfloss';
};
