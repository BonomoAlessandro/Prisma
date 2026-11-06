// D3 Geode: das Brett ist eine aufgeschnittene Geode. Feld eine polierte Achatscheibe mit Bändern um die Mitte, im Rand
// ein Kranz aus Amethyst- und Quarzspitzen, die Seiten die raue Aussenhaut. Die Lichtwelle läuft durch die Achatbänder
__katalog.varianten.geode = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const r = rng(91);
  const bandsAt = (x, z) => {
    const w = fbm(x * 0.25, z * 0.25, 4, 92) * 1.6 + fbm(x * 1.2, z * 1.2, 2, 93) * 0.15;
    const q = Math.max(Math.abs(x), Math.abs(z)) * 0.55 + Math.hypot(x, z) * 0.45; // eckig-rund wie die Druse
    return q + w;
  };
  const pal = [[0.96, 0.90, 0.82], [0.90, 0.72, 0.56], [0.80, 0.70, 0.80], [0.97, 0.94, 0.92], [0.86, 0.62, 0.48], [0.70, 0.62, 0.74]];
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const q = bandsAt(x, z);
    const t = q / 0.42, i = Math.floor(t), f = t - i;
    const a = pal[((i % 6) + 6) % 6], b = pal[(((i + 1) % 6) + 6) % 6];
    let c = mix3(a, b, smooth(0.75, 1.0, f));
    const fine = Math.sin(q * 160) * 0.5 + 0.5; // feine Achatlinien
    c = mix3(c, [c[0] * 0.9, c[1] * 0.88, c[2] * 0.92], fine * 0.35);
    // im Feld ruhiger: Kontrast halbiert
    const inF = 1 - smooth(HB + 0.05, HB + 0.25, box);
    c = mix3(c, mix3(c, [0.92, 0.82, 0.74], 0.5), inF * 0.5);
    // Rand: dunkler Grund der Druse
    c = mix3(c, [0.28, 0.20, 0.32], smooth(HB + 0.28, HB + 0.36, box));
    return [c, mix(0.6, 0.12, inF), (fine - 0.5) * 0.0002];
  }, null, 0.00025);
  // Bänder als Maske für die Lichtwelle (Phase der Bänder)
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.8,
    groove: 'diffuseColor.rgb *= 1.0 - floorGroove * 0.45;', inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.98, 0.97, 0.98), floorInlay);',
    bevel: '', bevelRough: '', refl: 0.5,
    // Lichtwelle: der Ring folgt den Bändern des Achats; jedes Band leuchtet kurz in seiner Farbe auf
    wave: `
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 4.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        float lum = dot(diffuseColor.rgb, vec3(0.333));
        gl_FragColor.rgb += (diffuseColor.rgb * 1.4 + uShockColor * 0.5) * wide * k * (0.4 + lum) * 1.3;
        gl_FragColor.rgb += uShockColor * ring * k * 0.6;`,
  });
  // Aussenhaut der Geode an den Seiten; oben ein weisses Chalcedonband (der Schnitt durch die Schichten)
  const side = L.sideTex(2048, 128, (u, v) => {
    const g = fbm(u * 3, v * 6, 4, 94), bump = Math.pow(noise(u * 30, v * 12, 95), 2);
    let c = mix3([0.56, 0.46, 0.40], [0.42, 0.34, 0.32], g);
    c = mix3(c, [0.64, 0.54, 0.46], bump * 0.6);
    c = mix3(c, [0.9, 0.88, 0.9], smooth(0.12, 0.04, v));
    return mix3(c, [0.6, 0.5, 0.66], smooth(0.2, 0.12, v) * (1 - smooth(0.12, 0.04, v)));
  });
  L.sides(L.sideMat(L.tex(side), { glow: 0.32, roughness: 0.9 }));
  L.hide('plateTrim');
  // Kristallkranz: Amethyst innen dunkel, aussen heller Quarz
  const geo = new T.ConeGeometry(1, 1, 6); geo.translate(0, 0.5, 0);
  const mat = L.withWave(new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.08, metalness: 0, flatShading: true, envMapIntensity: 1.8, emissive: new T.Color(0.12, 0.08, 0.14) }), `
      {
        ${L.RING}
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 4.0), 2.0));
        gl_FragColor.rgb += vec3(1.2, 0.9, 1.5) * wide * min(1.0, uShock.y * 3.0) * 1.4;
      }`);
  const N = 2600, inst = new T.InstancedMesh(geo, mat, N);
  const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(), P = new T.Vector3(), E = new T.Euler();
  for (let i = 0; i < N; i++) {
    let x, z, box;
    do { x = (r() * 2 - 1) * (HP - 0.03); z = (r() * 2 - 1) * (HP - 0.03); box = Math.max(Math.abs(x), Math.abs(z)); } while (box < HB + 0.32);
    const out = (box - HB - 0.32) / (HP - HB - 0.32); // 0 innen … 1 aussen
    const h = 0.05 + r() * 0.08 + (1 - out) * 0.05, rad = 0.018 + r() * 0.028;
    const nx = Math.abs(x) >= Math.abs(z) ? Math.sign(x) : 0, nz = nx ? 0 : Math.sign(z);
    P.set(x, -0.005, z);
    Q.setFromEuler(E.set(nz * (0.25 + r() * 0.3) * -1 + (r() - 0.5) * 0.4, r() * 6.3, nx * (0.25 + r() * 0.3) + (r() - 0.5) * 0.4));
    S.set(rad, h, rad);
    inst.setMatrixAt(i, M.compose(P, Q, S));
    const c = mix3([0.46, 0.26, 0.62], [0.92, 0.88, 0.96], clamp(out * 0.9 + r() * 0.3));
    inst.setColorAt(i, new T.Color(c[0], c[1], c[2]));
  }
  inst.castShadow = true; inst.receiveShadow = true;
  D.scene.add(inst);
  return 'Geode';
};
