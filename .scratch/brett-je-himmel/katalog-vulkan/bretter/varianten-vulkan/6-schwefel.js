// V6 Schwefelquelle: das Brett ist ein Stück Dallol. Das Feld ist eine helle Salzkruste, im Rand liegen Becken mit
// säuregrünem Wasser, gerahmt von Sinter in Schwefelgelb, Ocker und Rost, dazwischen kleine Schwefelschlote. Die Seiten
// zeigen die bunten Schichten. Lichtwelle: blaues Schwefelfeuer wie am Kawah Ijen, die Becken fangen es auf
__katalog.varianten.schwefel = async (L) => {
  const { T, D, PLATE, HB, HP, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.vk, r = rng(701);
  const salt = [0.86, 0.84, 0.74], sulf = [0.88, 0.78, 0.2], lime = [0.6, 0.74, 0.24], acid = [0.16, 0.5, 0.42],
    ochre = [0.72, 0.44, 0.15], rust = [0.5, 0.2, 0.08];
  // Rand: Gelände aus Sinterhügeln (Höhe aus Rauschen, in Terrassen) und Becken in den Mulden
  const terr = (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const rim = smooth(HB + 0.12, HB + 0.32, box);
    if (rim <= 0) return null;
    const wx = x + (fbm(x * 0.8, z * 0.8, 3, 710) - 0.5) * 0.6, wz = z + (fbm(x * 0.8 + 5, z * 0.8, 3, 711) - 0.5) * 0.6;
    const ht = fbm(wx * 1.6, wz * 1.6, 4, 712);              // 0..1, Mulden < 0.42
    const water = smooth(0.43, 0.39, ht), tier = Math.abs(Math.sin(ht * 46)); // Terrassenkanten
    return { rim, ht, water, tier, id: Math.floor(wx * 1.3) * 31 + Math.floor(wz * 1.3) };
  };
  const s = L.surface(2048, (x, z) => {
    const g = fbm(x * 0.5, z * 0.5, 4, 704), fine = fbm(x * 6, z * 6, 3, 705);
    // Feld: blassgelbe Salzkruste mit Polygonrücken und gelben Schleiern
    const [pe] = V.cells(x + (fine - 0.5) * 0.1, z, 0.42, 706);
    let c = mix3([0.78, 0.75, 0.6], [0.84, 0.76, 0.42], smooth(0.5, 0.8, g) * 0.7);
    c = mix3(c, [0.68, 0.64, 0.5], smooth(0.4, 0.2, fine) * 0.4);
    c = mix3(c, [0.9, 0.88, 0.76], smooth(0.025, 0.006, pe) * 0.7);
    let rough = 0.9, h = smooth(0.025, 0.006, pe) * 0.002 + (fine - 0.5) * 0.0008;
    const t = terr(x, z);
    if (t) {
      // Hügel: unten Rost, dann Ocker, oben Schwefelgelb mit weissen Krusten; Terrassenkanten hell
      let rc = t.ht < 0.5 ? mix3(rust, ochre, smooth(0.42, 0.5, t.ht)) : t.ht < 0.6 ? mix3(ochre, sulf, smooth(0.5, 0.6, t.ht)) : mix3(sulf, [0.93, 0.9, 0.62], smooth(0.62, 0.75, t.ht));
      rc = mix3(rc, [0.95, 0.9, 0.62], Math.pow(t.tier, 14) * 0.6);
      // Becken in den Mulden: säuregrün, selten türkis; heller Sinterrand
      const wc = L.noise(t.id * 0.3, 2, 707) < 0.3 ? acid : mix3(lime, [0.75, 0.78, 0.2], L.noise(t.id * 0.7, 3, 708));
      rc = mix3(rc, [0.96, 0.93, 0.74], smooth(0.47, 0.43, t.ht) * (1 - t.water) * 0.8);
      rc = mix3(rc, wc, t.water);
      c = mix3(c, rc, t.rim);
      h += t.rim * ((t.ht - 0.5) * 0.06 * (1 - t.water) - t.water * 0.004 + Math.pow(t.tier, 14) * 0.002);
      rough = mix(rough, 0.06, t.water * t.rim);
    }
    return [c, rough, h];
  }, null, 0.00025);
  const pm = V.maskFn(1024, (x, z) => { const t = terr(x, z); return t ? t.water * t.rim : 0; });
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.7,
    groove: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.48, 0.2), floorGroove * 0.8);',
    inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.72, 0.16), floorInlay);',
    replace: [['float iw = 0.011;', 'float iw = 0.022;']],
    bevel: '', bevelRough: '', refl: 0.25,
    decl: 'uniform sampler2D uPool;', uniforms: { uPool: { value: pm } },
    // Lichtwelle: blaue Schwefelflammen, flackernd; die Becken fangen das blaue Licht
    wave: `
        vec2 pp = (vUv - 0.5) * ${PLATE.toFixed(3)};
        float ang = atan(pp.y, pp.x);
        float fl = 0.55 + 0.45 * sin(ang * 23.0 + sd * 9.0) * sin(ang * 37.0 - sd * 5.0 + 1.3);
        float band = exp(-pow((sd - uShock.x + 0.15 * fl) / (uShock.z * 1.6), 2.0));
        float halo = exp(-pow((sd - uShock.x) / (uShock.z * 4.5), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        float po = texture2D(uPool, vUv).r;
        vec3 blue = vec3(0.18, 0.42, 1.25);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * vec3(0.35, 0.45, 0.7), halo * k * 0.55);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, blue, clamp(band * fl * k * 1.1, 0.0, 0.9));
        gl_FragColor.rgb += blue * po * (halo + trail * 0.3) * k * 1.1;`,
  });
  // Seiten: bunte Schichten wie die Wände in Dallol
  const side = L.sideTex(2048, 128, (u, v) => {
    const t = v * 6 + fbm(u * 0.6, v * 2, 3, 708) * 1.6;
    const pal = [[0.9, 0.88, 0.78], sulf, ochre, [0.82, 0.7, 0.4], rust, lime, [0.92, 0.86, 0.6]];
    const i = Math.floor(t), f = t - i;
    let c = mix3(pal[((i % 7) + 7) % 7], pal[(((i + 1) % 7) + 7) % 7], smooth(0.7, 1, f));
    return mix3(c, [c[0] * 0.8, c[1] * 0.78, c[2] * 0.75], smooth(0.55, 0.8, fbm(u * 4, v * 8, 2, 709)) * 0.5);
  });
  L.sides(V.lavaMat({ map: L.tex(side), roughness: 0.9, envMapIntensity: 0.6 }, { down: 0.7, side: 0.38 }));
  L.hide('plateTrim');
  // Schwefelschlote: kleine Kegel mit gelben Krusten, in Gruppen im Rand
  const geo = new T.ConeGeometry(1, 1, 7, 1, true); geo.translate(0, 0.5, 0);
  const spots = [];
  for (const [gx, gz, n] of [[-4.45, -4.4, 6], [4.5, 3.9, 5], [-1.2, 4.55, 4], [4.55, -1.5, 3], [-4.55, 1.8, 4]]) {
    for (let i = 0; i < n; i++) {
      const x = clamp(gx + (r() - 0.5) * 0.7, -HP + 0.1, HP - 0.1), z = clamp(gz + (r() - 0.5) * 0.7, -HP + 0.1, HP - 0.1);
      if (Math.max(Math.abs(x), Math.abs(z)) < HB + 0.3) continue;
      spots.push([x, z, 0.06 + r() * 0.1, 0.05 + r() * 0.05]);
    }
  }
  const mat = V.lavaMat({ color: 0xffffff, roughness: 0.8, flatShading: true }, { down: 0.6, side: 0.3 }, `
        float flame = exp(-pow((sd - uShock.x) / (uShock.z * 2.5), 2.0)) * min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += vec3(0.25, 0.55, 1.4) * flame * 0.8;`);
  const inst = new T.InstancedMesh(geo, mat, spots.length);
  const M = new T.Matrix4(), Q = new T.Quaternion(), Sc = new T.Vector3(), P = new T.Vector3(), C = new T.Color(), E = new T.Euler();
  spots.forEach(([x, z, hgt, rad], i) => {
    P.set(x, -0.01, z); Sc.set(rad, hgt, rad); Q.setFromEuler(E.set((r() - 0.5) * 0.3, r() * 6, (r() - 0.5) * 0.3));
    inst.setMatrixAt(i, M.compose(P, Q, Sc));
    const c = mix3(sulf, mix3(ochre, lime, r()), r() * 0.5); C.setRGB(c[0], c[1], c[2]); inst.setColorAt(i, C);
  });
  inst.castShadow = true;
  D.scene.add(inst);
  // Lichtwelle: gelbe Schwefelkristalle wachsen, blaue Flammen züngeln an ihnen hoch; dahinter zerfallen die Kristalle
  {
    const q = rng(721);
    const cg = new T.OctahedronGeometry(1); cg.translate(0, 0.75, 0);
    const cr = V.streu(1100, q, (x, z, box, w) => ({ p: [x, -0.01, z], r: [(w() - 0.5) * 0.9, w() * 6.3, (w() - 0.5) * 0.9], s: [0.035 + w() * 0.03, 0.08 + w() * 0.12, 0.035 + w() * 0.03], c: (w() < 0.8 ? [0.9, 0.72, 0.08] : [0.75, 0.85, 0.2]) }));
    D.scene.add(V.koerper(cg, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, flatShading: true, emissive: new T.Color(0.25, 0.2, 0.02) }), cr, { mode: 'grow', width: 2.0, keep: 0.4, tail: 1.2 }));
    const fg = new T.ConeGeometry(1, 1, 7, 1, true); fg.translate(0, 0.5, 0);
    const fl = V.streu(600, q, (x, z, box, w) => ({ p: [x, 0.0, z], r: [0, w() * 6.3, 0], s: [0.04 + w() * 0.04, 0.2 + w() * 0.3, 0.04 + w() * 0.04] }));
    const fmat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
    D.scene.add(V.koerper(fg, fmat, fl, { mode: 'grow', width: 1.4, glow: `
      gl_FragColor = vec4(vec3(0.12, 0.35, 1.25) * vGrow * (0.6 + 0.4 * vRnd), 1.0);` }));
  }
  return `Schwefelquelle (${spots.length} Schlote)`;
};
