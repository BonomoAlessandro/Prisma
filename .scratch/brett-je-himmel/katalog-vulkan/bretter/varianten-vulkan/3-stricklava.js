// V3 Stricklava: das Brett ist eine Scholle aus frisch erstarrter Pāhoehoe-Lava. Das Feld ist glatte, glasige Haut mit
// silbrigem Schimmer, im Rand legt sich die Lava in Stricke (Bögen quer zum Fluss), zwischen den Bögen und an den
// Zehen des Umrisses glüht es noch. Die Seiten sind Kruste, die nach unten in glühende Lava übergeht. Das Raster sind
// feine Fugen, in denen es dunkelrot glimmt. Lichtwelle: ein Hitzestoss, die Risse flammen gelb auf
__katalog.varianten.stricklava = async (L) => {
  const { T, D, PLATE, HB, HP, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.vk, r = rng(401);
  // Umriss mit Zehen (runde Loben)
  const lobe = (a) => { const p = a * 22 / (2 * Math.PI) + noise(Math.cos(a) * 2, Math.sin(a) * 2, 402) * 1.6; return Math.pow(0.5 + 0.5 * Math.cos(p * 2 * Math.PI), 1.5); };
  const pts = V.roundedSquare(4.7, 0.9, 520, (a) => 0.18 * lobe(a) - 0.02);
  const SEG = 1.35; // Breite einer Bogengruppe (Festons) entlang des Rands
  const along = (x, z) => (Math.abs(x) > Math.abs(z) ? z * Math.sign(x) + (x > 0 ? 0 : 20) : -x * Math.sign(z) + (z > 0 ? 10 : 30));
  const rope = (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z)), d = box - (HB + 0.2);
    if (d < 0) return [0, 0, 0];
    const al = along(x, z) + fbm(x * 0.5, z * 0.5, 2, 403) * 0.6, seg = Math.floor(al / SEG), f = al / SEG - seg;
    const bow = 0.16 * Math.sin(f * Math.PI) * (0.7 + 0.6 * noise(seg, 1, 404));
    const ph = (d - bow) / 0.085 + noise(x * 3, z * 3, 405) * 0.5;
    const cr = Math.pow(Math.abs(Math.sin(ph * Math.PI)), 0.6);
    const twist = 0.75 + 0.25 * Math.sin(al * 55 + ph * 4);
    const fade = smooth(0, 0.08, d);
    const seam = smooth(0.05, 0.0, Math.min(f, 1 - f) * SEG) * smooth(0.02, 0.12, d); // Riss zwischen den Gruppen
    return [cr * twist * fade, seam, fade];
  };
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const g = fbm(x * 0.35, z * 0.35, 4, 406), w = fbm(x * 3, z * 3, 3, 407);
    let c = mix3([0.07, 0.065, 0.07], [0.16, 0.16, 0.19], smooth(0.4, 0.75, g)); // glasige Haut, silbrig-blau
    let rough = mix(0.5, 0.25, smooth(0.45, 0.75, g)), h = (w - 0.5) * 0.0015;
    const [cr, seam, fade] = rope(x, z);
    if (fade > 0) {
      c = mix3(c, mix3([0.04, 0.036, 0.04], [0.42, 0.41, 0.45], Math.pow(cr, 1.6)), fade * 0.95);
      c = mix3(c, [0.08, 0.02, 0.01], seam);
      h += cr * 0.01 * fade - seam * 0.006;
      rough = mix(rough, mix(0.7, 0.3, cr), fade);
    }
    return [c, rough, h];
  }, ({ color, px }) => V.clip(color, px, pts), 0.00025);
  // Glut: Risse zwischen den Bogengruppen, ein paar Spalten im Rand, Zehen am Umriss
  const glowM = V.mask(1024, (x, px, m) => {
    const im = x.getImageData(0, 0, 1024, 1024);
    for (let j = 0; j < 1024; j++) for (let i = 0; i < 1024; i++) {
      const X = -HP + (i + 0.5) * PLATE / 1024, Z = -HP + (j + 0.5) * PLATE / 1024;
      const [cr, seam, fade] = rope(X, Z);
      const fis = fade * smooth(0.012, 0.0, Math.abs(fbm(X * 0.9, Z * 0.9, 3, 408) - 0.5)) * smooth(0.55, 0.62, fbm(X * 0.4, Z * 0.4, 2, 409));
      const hot = Math.pow(1 - cr, 8) * fade * smooth(0.52, 0.66, fbm(X * 0.7, Z * 0.7, 3, 414)); // noch heisse Rinnen zwischen den Stricken
      const v = Math.max(seam * (0.6 + 0.4 * (1 - cr)), fis * 0.8, hot * 0.75);
      const k = (j * 1024 + i) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = clamp(v) * 255;
    }
    x.putImageData(im, 0, 0);
    // Zehen: glühender Saum am Umriss
    x.strokeStyle = '#fff'; x.lineJoin = 'round';
    for (const [w, a] of [[0.12, 0.25], [0.05, 0.6], [0.02, 1]]) {
      x.globalAlpha = a; x.lineWidth = w * m; x.beginPath();
      pts.forEach(([X, Z], i) => (i ? x.lineTo(px(X), px(Z)) : x.moveTo(px(X), px(Z)))); x.closePath(); x.stroke();
    }
    x.globalAlpha = 1;
  });
  const fm = D.floorMaterial;
  fm.emissiveMap = glowM; fm.emissive.setRGB(0.9, 0.27, 0.045);
  fm.alphaTest = 0.5;
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 1.0,
    groove: 'diffuseColor.rgb *= 1.0 - floorGroove * 0.7;',
    inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.3, 0.3, 0.33), floorInlay);',
    inlayRough: 'roughnessFactor = mix(roughnessFactor, 0.2, floorInlay);',
    bevel: '', bevelRough: '', refl: 0.35,
    // Raster: in den Fugen glimmt es dunkelrot
    after: 'gl_FragColor.rgb += vec3(0.34, 0.075, 0.012) * floorGroove;',
    // Lichtwelle: Hitzestoss, die Risse und Fugen flammen gelb auf
    wave: `
        float gm = texture2D(emissiveMap, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += vec3(0.9, 0.4, 0.1) * ring * k * 0.5;
        gl_FragColor.rgb += vec3(1.3, 0.85, 0.3) * max(gm, floorGroove * 0.8) * (wide + trail * 0.2) * k * 1.3;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // Seiten: Kruste, nach unten glühend; Unterseite flüssig
  const sp = pts.filter((_, i) => i % 2 === 0);
  const prof = [[-0.003, 1.0], [-0.06, 0.998], [-0.15, 0.99], [-0.27, 0.975], [-0.38, 0.95], [-0.47, 0.91], [-0.53, 0.85]];
  const rings = prof.map(([y, sc]) => [y, (x, z, u) => [x * sc, z * sc, (noise(u * 80, y * 9, 410) - 0.5) * 0.03]]);
  const geo = V.hullGeo(sp, rings, { tip: [0, -0.6, 0], flat: false });
  const W = 4096, Hh = 128, cc = L.canvas(W, Hh), ec = L.canvas(W, Hh);
  const cx = cc.getContext('2d'), ex = ec.getContext('2d'), ci = cx.createImageData(W, Hh), ei = ex.createImageData(W, Hh);
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
    const u = i / W * 38, v = j / Hh; // u in m entlang des Umfangs, v 0 oben … 1 Spitze
    const wr = Math.abs(Math.sin((v * 9 + fbm(u * 0.8, v * 3, 3, 411) * 2.5) * Math.PI)); // Runzeln quer
    let c = mix3([0.07, 0.06, 0.06], [0.3, 0.29, 0.31], Math.pow(wr, 3));
    const crack = smooth(0.025, 0.0, Math.abs(fbm(u * 1.2, v * 2, 3, 412) - 0.5)) * smooth(0.05, 0.4, v);
    const melt = smooth(0.6, 0.92, v + (fbm(u * 0.7, 0, 2, 413) - 0.5) * 0.2);
    const e = clamp(Math.max(crack * 0.8, melt));
    const k = (j * W + i) * 4;
    ci.data[k] = c[0] * 255; ci.data[k + 1] = c[1] * 255; ci.data[k + 2] = c[2] * 255; ci.data[k + 3] = 255;
    const hot = mix3([0.55, 0.12, 0.02], [1.0, 0.42, 0.08], melt);
    ei.data[k] = hot[0] * e * 255; ei.data[k + 1] = hot[1] * e * 255; ei.data[k + 2] = hot[2] * e * 255; ei.data[k + 3] = 255;
  }
  cx.putImageData(ci, 0, 0); ex.putImageData(ei, 0, 0);
  const sideMat = L.withWave(new T.MeshStandardMaterial({ map: V.htex(cc), emissiveMap: V.htex(ec), emissive: new T.Color(0.85, 0.85, 0.85), roughness: 0.6, envMapIntensity: 1.0 }), `
      {
        ${L.RING}
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
        gl_FragColor.rgb += vec3(1.0, 0.6, 0.2) * wide * min(1.0, uShock.y * 3.0) * 0.5;
      }`);
  const side = new T.Mesh(geo, sideMat);
  side.receiveShadow = true;
  D.scene.add(side);
  return 'Stricklava';
};
