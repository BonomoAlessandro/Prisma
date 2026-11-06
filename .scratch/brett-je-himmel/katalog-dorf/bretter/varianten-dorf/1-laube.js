// V1 Laube: das Brett ist der Holzboden der Laube (Balkon) an einem Chalet. Breite Lärchendielen, das Raster sind die
// breiteren Fugen, wo die Dielen enden; im Rand ein Rahmen aus Brettern auf Gehrung. Darunter hängt die Brüstung aus
// ausgesägten Brettern (Laubsägearbeit) mit Geranienkisten. Lichtwelle: Lampenlicht der Stube scheint durch die Fugen.
__katalog.varianten.laube = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.dorf, W2 = __katalog.w2, r = rng(211);
  const PW = 0.4, FR = HB + 0.1; // Dielenbreite (3 je Feld), Abschlussleiste bis FR, dann Rahmen
  const larch = [0.40, 0.29, 0.20], larch2 = [0.30, 0.215, 0.155], grey = [0.34, 0.31, 0.29];
  const wood = (x, z, along, id, weather) => {
    const tone = noise(id * 3.7, 0.5, 212);
    const grain = fbm(along * 0.7 + id * 5.3, (along === x ? z : x) * 26, 3, 213);
    const ring = Math.pow(Math.abs(Math.sin((along === x ? z : x) * 70 + grain * 9)), 8);
    let c = mix3(larch2, larch, tone * 0.7 + grain * 0.5);
    c = mix3(c, [c[0] * 0.78, c[1] * 0.76, c[2] * 0.76], ring * 0.6);
    return mix3(c, grey, weather);
  };
  const s = L.surface(2048, (x, z) => {
    const ax = Math.abs(x), az = Math.abs(z), box = Math.max(ax, az);
    let c, h = 0;
    if (box < HB) {
      // Dielen längs x, 0.4 m breit, enden an den Feldgrenzen
      const row = Math.floor((z + HB) / PW), col = Math.floor((x + HB) / CELL), id = row * 7 + col;
      const fz = (z + HB) / PW - row, fx = (x + HB) / CELL - col;
      c = wood(x, z, x, id, noise(x * 0.4, z * 0.4, 214) * 0.25);
      // Knoten
      const kx = (noise(id, 1.5, 215) - 0.5) * 0.9, kd = Math.hypot((fx - 0.5 - kx) * CELL / 0.05, (fz - 0.5) * PW / 0.035);
      if (noise(id, 2.5, 216) > 0.6 && kd < 1) c = mix3(c, [0.17, 0.11, 0.07], smooth(1, 0.3, kd));
      const cell = row % 3 === 2 ? fz : 9; // Feldgrenze längs: nach jeder dritten Diele
      const seamZ = Math.min(fz, 1 - fz) * PW, seamX = Math.min(fx, 1 - fx) * CELL;
      const wideZ = (row % 3 === 0 && fz < 0.5) || (row % 3 === 2 && fz > 0.5);
      h = -0.0012 * Math.pow((fz - 0.5) * 2, 2);
      if (seamZ < (wideZ ? 0.013 : 0.003)) { c = [0.05, 0.035, 0.03]; h = -0.01; }
      if (seamX < 0.012) { c = [0.05, 0.035, 0.03]; h = -0.01; }
      void cell;
    } else if (box < FR) {
      // Abschlussleiste: helleres, glattes Brett, das das Feld rahmt (statt Einlegelinie)
      const along = ax > az ? z : x;
      c = mix3(wood(x, z, along, 99 + (ax > az ? 1 : 2), 0.1), [0.52, 0.40, 0.29], 0.45);
      h = 0.0008;
      if (box < HB + 0.012 || box > FR - 0.006) { c = [0.05, 0.035, 0.03]; h = -0.01; }
    } else {
      // Rahmen: Bretter längs der Kante (2 × 0.3 m), Gehrung an den Ecken, verwittert grauer
      const side = ax > az, along = side ? z : x, k = Math.floor((box - FR) / 0.3);
      const id = 200 + k * 4 + (side ? (x > 0 ? 0 : 1) : (z > 0 ? 2 : 3));
      c = wood(x, z, along, id, 0.25 + smooth(HP - 0.3, HP, box) * 0.2);
      const fb = ((box - FR) / 0.3) % 1;
      if (Math.min(fb, 1 - fb) * 0.3 < 0.004 || Math.abs(ax - az) < 0.006) { c = [0.05, 0.035, 0.03]; h = -0.008; }
      h += -0.0012 * Math.pow((fb - 0.5) * 2, 2);
    }
    return [c, 0.9, h];
  }, ({ color: g, height, px, m }) => {
    // Nagelköpfe an den Enden der Dielen
    for (let k = 0; k <= 7; k++) for (let row = 0; row < 21; row++) for (const dx of [-0.05, 0.05]) for (const dz of [0.11, 0.29]) {
      const x = -HB + k * CELL + dx, z = -HB + row * PW + dz;
      if (Math.abs(x) > HB - 0.02) continue;
      g.fillStyle = '#16120f'; g.beginPath(); g.arc(px(x), px(z), 0.008 * m, 0, 7); g.fill();
      height.fillStyle = 'rgb(118,118,118)'; height.beginPath(); height.arc(px(x), px(z), 0.008 * m, 0, 7); height.fill();
    }
  }, 0.0004);
  // Fugen als Maske für die Lichtwelle: Feldgrenzen und Rahmenfugen
  const gaps = W2.mask(1024, (x, px, m) => {
    x.fillStyle = '#fff';
    for (let k = 0; k <= 7; k++) {
      const p = -HB + k * CELL;
      x.fillRect(px(p) - 0.014 * m, px(-HB), 0.028 * m, 2 * HB * m);
      x.fillRect(px(-HB), px(p) - 0.014 * m, 2 * HB * m, 0.028 * m);
    }
    x.strokeStyle = '#fff'; x.lineWidth = 0.02 * m;
    for (const w of [HB + 0.006, FR]) x.strokeRect(px(-w), px(-w), 2 * w * m, 2 * w * m);
  });
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.35,
    groove: '', inlay: '', bevel: '', grooveRough: '', inlayRough: '', bevelRough: '', refl: 0.0,
    decl: 'uniform sampler2D uGaps;', uniforms: { uGaps: { value: gaps } },
    // Lichtwelle: warmes Lampenlicht der Stube scheint von unten durch die Fugen
    wave: `
        float gm = texture2D(uGaps, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 4.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.5 + vec3(0.35, 0.22, 0.1)) * ring * k * 0.7;
        gl_FragColor.rgb += vec3(2.2, 1.35, 0.5) * gm * (wide + trail * 9.0) * k * 2.0;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  const g = new T.Group();
  // Bodenstärke: Stirnseiten der Rahmenbretter (6 cm)
  const edge = L.tex(V.sideCanvas(1024, 32, PLATE, (u, v) => {
    const c = wood(u, v, u, Math.floor(u / 2.1), 0.35);
    return v < 0.08 ? mix3(c, [0.55, 0.45, 0.36], 0.5) : c;
  }), true, true);
  g.add(V.box(HP, 0, 0.06, L.sideMat(edge, { glow: 0.16 }), new T.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.95 })));
  // Brüstung (hängt unter dem Boden): senkrechte Bretter mit ausgesägten Herzen und Tulpen, oben und unten ein Riegel
  const BH = 0.62, BW = 0.18, cv = L.canvas(2048, 136), cx = cv.getContext('2d'), pm = 2048 / PLATE, ph = 136 / BH;
  const wc = cx.createImageData(2048, 136);
  for (let j = 0; j < 136; j++) for (let i = 0; i < 2048; i++) {
    const u = i / pm, v = j / ph, b = Math.floor(u / BW);
    let c = wood(u, v, v, b, 0.3);
    if (v < 0.07 || v > BH - 0.07) c = wood(u, v, u, 900 + (v < 0.1 ? 0 : 1), 0.4);
    const k = (j * 2048 + i) * 4;
    wc.data[k] = c[0] * 255; wc.data[k + 1] = c[1] * 255; wc.data[k + 2] = c[2] * 255; wc.data[k + 3] = 255;
  }
  cx.putImageData(wc, 0, 0);
  cx.globalCompositeOperation = 'destination-out'; cx.fillStyle = '#000';
  for (let b = 0; b * BW < PLATE; b++) {
    const u0 = b * BW, uc = u0 + BW / 2, vc = BH * 0.5;
    cx.fillRect((u0 + BW - 0.004) * pm, 0.07 * ph, 0.008 * pm, (BH - 0.14) * ph); // Fuge zwischen den Brettern
    // Herz in der Mitte des Bretts
    const hz = (sx, sy, sc) => { cx.beginPath(); cx.arc((sx - 0.018 * sc) * pm, (sy - 0.012 * sc) * ph, 0.02 * sc * pm, 0, 7); cx.arc((sx + 0.018 * sc) * pm, (sy - 0.012 * sc) * ph, 0.02 * sc * pm, 0, 7); cx.fill();
      cx.beginPath(); cx.moveTo((sx - 0.037 * sc) * pm, (sy - 0.008 * sc) * ph); cx.lineTo((sx + 0.037 * sc) * pm, (sy - 0.008 * sc) * ph); cx.lineTo(sx * pm, (sy + 0.05 * sc) * ph); cx.fill(); };
    hz(uc, vc - 0.06, 1.7);
    // Tulpe zwischen zwei Brettern (halbe Form je Brett): Kelch und Stiel
    const ue = u0 + BW;
    cx.beginPath(); cx.ellipse(ue * pm, (vc + 0.13) * ph, 0.03 * pm, 0.045 * ph, 0, 0, 7); cx.fill();
    cx.fillRect((ue - 0.006) * pm, (vc + 0.15) * ph, 0.012 * pm, 0.08 * ph);
    cx.beginPath(); cx.ellipse(ue * pm, (vc - 0.17) * ph, 0.022 * pm, 0.03 * ph, 0, 0, 7); cx.fill();
  }
  cx.globalCompositeOperation = 'source-over';
  const bt = L.tex(cv, true); bt.wrapS = T.RepeatWrapping;
  const balMat = new T.MeshStandardMaterial({ map: bt, alphaTest: 0.5, side: T.DoubleSide, roughness: 0.9, emissiveMap: bt, emissive: new T.Color().setScalar(0.24) });
  const IN = HP - 0.2;
  for (const [x, z, ry] of [[0, IN, 0], [0, -IN, Math.PI], [IN, 0, Math.PI / 2], [-IN, 0, -Math.PI / 2]]) {
    const p = new T.Mesh(new T.PlaneGeometry(2 * IN, BH), balMat);
    p.position.set(x, -0.06 - BH / 2, z); p.rotation.y = ry; p.castShadow = true; g.add(p);
  }
  // Balkenköpfe, die unter dem Boden hervorschauen
  const beam = new T.BoxGeometry(0.16, 0.2, 0.36);
  const beams = [];
  for (const t of [-3.6, -1.2, 1.2, 3.6]) beams.push([t, -0.16, IN + 0.02, {}], [t, -0.16, -IN - 0.02, {}], [IN + 0.02, -0.16, t, { ry: Math.PI / 2 }], [-IN - 0.02, -0.16, t, { ry: Math.PI / 2 }]);
  g.add(V.inst(beam, L.sideMat(edge, { glow: 0.14 }), beams));
  // Geranienkisten: aussen an der Brüstung, 2 je Seite; Blätter und Dolden aus Kugeln
  const kiste = [], leaf = [], bloom = [];
  for (const side of [0, 1, 2, 3]) for (const t0 of [-2.3, 2.3]) {
    const along = (a) => side === 0 ? [a, IN + 0.1] : side === 1 ? [a, -IN - 0.1] : side === 2 ? [IN + 0.1, a] : [-IN - 0.1, a];
    const [bx, bz] = along(t0);
    kiste.push([bx, -0.12, bz, { ry: side < 2 ? 0 : Math.PI / 2 }]);
    for (let i = 0; i < 44; i++) {
      const [lx, lz] = along(t0 + (r() - 0.5) * 1.6);
      leaf.push([lx + (r() - 0.5) * 0.08, -0.05 + r() * 0.09, lz + (r() - 0.5) * 0.08, { s: [0.1, 0.05, 0.1], ry: r() * 6 }]);
    }
    for (let u = 0; u < 9; u++) {
      const [ux, uz] = along(t0 - 0.72 + u * 0.18 + (r() - 0.5) * 0.06), uy = 0.06 + r() * 0.09;
      for (let i = 0; i < 13; i++) bloom.push([ux + (r() - 0.5) * 0.1, uy + (r() - 0.5) * 0.07, uz + (r() - 0.5) * 0.1, { s: 0.03 + r() * 0.015 }]);
    }
  }
  const kisteMat = L.sideMat(edge, { glow: 0.16 });
  g.add(V.inst(new T.BoxGeometry(1.7, 0.16, 0.16), kisteMat, kiste.map(([x, y, z, o]) => [x, y, z, o])));
  g.add(V.inst(new T.SphereGeometry(1, 8, 6), new T.MeshStandardMaterial({ color: 0x2c4a22, roughness: 0.8, emissive: 0x0b1608 }), leaf));
  g.add(V.inst(new T.IcosahedronGeometry(1, 0), new T.MeshStandardMaterial({ color: 0xc8243a, roughness: 0.7, emissive: 0x3a0a10 }), bloom));
  D.scene.add(g);
  return 'Laube';
};
