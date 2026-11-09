// D5 Tempelboden, gefunden: ein Bruchstück aus einem Tempel. Feld aus poliertem Kalkstein, Raster aus eingelegtem
// Lapislazuli, Einlegelinie aus Gold, im Rand die blaue Sternendecke mit goldenen Sternen, halb im Sand; eine Ecke
// abgebrochen, auf einer anderen Ecke eine Säulentrommel
__katalog.varianten.ruine = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const W2 = __katalog.w2, r = rng(111);
  // Umriss: Quadrat, Ecke (+x, −z) abgebrochen (Bruchlinie x − z ≈ 8.55, gezackt)
  const pts = [[-HP, -HP]];
  const A = [HP - 1.25, -HP], B = [HP, -HP + 1.25];
  pts.push(A);
  for (let i = 1; i < 14; i++) {
    const t = i / 14, j = (r() - 0.5) * 0.16 + Math.sin(t * 9) * 0.04;
    pts.push([mix(A[0], B[0], t) - j * 0.7, mix(A[1], B[1], t) + j * 0.7]);
  }
  pts.push(B, [HP, HP], [-HP, HP]);
  const lime = [0.93, 0.86, 0.74], lime2 = [0.86, 0.77, 0.64], lapis = '#1f3a8a', goldC = '#e8b347';
  const starsMask = [];
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const g = fbm(x * 0.5, z * 0.5, 4, 112), vein = Math.pow(1 - Math.abs(fbm(x * 0.7, z * 0.7, 3, 113) - 0.5) * 2, 14);
    let c = mix3(lime, lime2, smooth(0.3, 0.75, g));
    c = mix3(c, [0.78, 0.68, 0.56], vein * 0.4);
    const inF = 1 - smooth(HB + 0.05, HB + 0.2, box);
    return [c, mix(0.7, 0.3, inF), (g - 0.5) * 0.001];
  }, ({ color: g, height, rough, px, m }) => {
    // Rand: Sternendecke (Lapisblau, goldene fünfzackige Sterne), aussen ein Fries aus Ocker und Rot
    const R0 = HB + 0.26, R1 = HP - 0.12;
    const frame = (o, i, col, ctx = g) => { ctx.fillStyle = col; ctx.beginPath(); ctx.rect(px(-o), px(-o), 2 * o * m, 2 * o * m); ctx.rect(px(i), px(-i), -2 * i * m, 2 * i * m); ctx.fill('evenodd'); };
    frame(R1, R0, '#24408f');
    frame(HP, R1, '#b5652f');
    for (let k = 0; k < 4; k++) frame(HP - 0.03 - k * 0.025, HP - 0.04 - k * 0.025, k % 2 ? '#e6d2a8' : '#7a2f22');
    const star = (cx, cz, rr) => {
      g.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? rr * 0.42 : rr; i ? g.lineTo(px(cx + Math.cos(a) * q), px(cz + Math.sin(a) * q)) : g.moveTo(px(cx + Math.cos(a) * q), px(cz + Math.sin(a) * q)); }
      g.closePath(); g.fillStyle = goldC; g.fill();
      starsMask.push([cx, cz, rr]);
    };
    for (let x = -HP + 0.22; x < HP - 0.1; x += 0.24) for (let z = -HP + 0.22; z < HP - 0.1; z += 0.24) {
      const box = Math.max(Math.abs(x), Math.abs(z));
      if (box > R0 + 0.06 && box < R1 - 0.06) star(x + (r() - 0.5) * 0.02, z + (r() - 0.5) * 0.02, 0.07);
    }
    // Raster: Lapisbänder mit Pyritflecken, Einlegelinie Gold
    for (let k = 0; k <= 7; k++) {
      const p = -HB + k * CELL;
      g.fillStyle = lapis;
      g.fillRect(px(p) - 0.013 * m, px(-HB), 0.026 * m, 2 * HB * m);
      g.fillRect(px(-HB), px(p) - 0.013 * m, 2 * HB * m, 0.026 * m);
      height.fillStyle = 'rgb(122,122,122)';
      height.fillRect(px(p) - 0.013 * m, px(-HB), 0.026 * m, 2 * HB * m); height.fillRect(px(-HB), px(p) - 0.013 * m, 2 * HB * m, 0.026 * m);
    }
    for (let i = 0; i < 1400; i++) {
      const k = Math.floor(r() * 8), t = -HB + r() * 2 * HB, p = -HB + k * CELL + (r() - 0.5) * 0.02;
      g.fillStyle = '#e9c76a'; const [x, z] = r() < 0.5 ? [p, t] : [t, p];
      g.fillRect(px(x), px(z), 2, 2);
    }
    const iw = HB + 0.15;
    g.strokeStyle = goldC; g.lineWidth = 0.03 * m; g.strokeRect(px(-iw), px(-iw), 2 * iw * m, 2 * iw * m);
    rough.strokeStyle = 'rgb(60,60,60)'; rough.lineWidth = 0.03 * m; rough.strokeRect(px(-iw), px(-iw), 2 * iw * m, 2 * iw * m);
    // Sand, der über den Rand geweht ist (Luv-Seite −x und eine Ecke)
    const sand = g.createLinearGradient(px(-HP), 0, px(-HP + 0.9), 0);
    sand.addColorStop(0, 'rgba(232,170,112,0.95)'); sand.addColorStop(1, 'rgba(232,170,112,0)');
    g.fillStyle = sand;
    for (let i = 0; i < 60; i++) { const z = -HP + r() * PLATE, w = 0.35 + r() * 0.5; g.beginPath(); g.ellipse(px(-HP), px(z), w * m, (0.25 + r() * 0.4) * m, 0, 0, 7); g.fill(); }
    W2.clip(g, px, pts);
  }, 0.00025);
  const gm = W2.mask(1024, (x, px, m) => {
    x.fillStyle = '#fff';
    for (const [cx, cz, rr] of starsMask) {
      x.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? rr * 0.42 : rr; i ? x.lineTo(px(cx + Math.cos(a) * q), px(cz + Math.sin(a) * q)) : x.moveTo(px(cx + Math.cos(a) * q), px(cz + Math.sin(a) * q)); }
      x.closePath(); x.fill();
    }
    const iw = HB + 0.15; x.strokeStyle = '#fff'; x.lineWidth = 0.03 * m; x.strokeRect(px(-iw), px(-iw), 2 * iw * m, 2 * iw * m);
  });
  D.floorMaterial.alphaTest = 0.5;
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.8,
    groove: '', inlay: '', bevel: '', grooveRough: '', inlayRough: '', bevelRough: '', refl: 0.25,
    decl: 'uniform sampler2D uGold;', uniforms: { uGold: { value: gm } },
    // Lichtwelle: Gold der Sterne und der Einlegelinie blitzt auf, wo der Ring vorbeizieht
    wave: `
        float gmk = texture2D(uGold, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 5.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.6 + vec3(0.3, 0.25, 0.15)) * ring * k * 0.9;
        gl_FragColor.rgb += vec3(1.9, 1.35, 0.45) * gmk * (wide + trail * 0.35) * k * 2.4;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // Seiten: Quader aus Kalkstein, verwittert
  const wall = L.sideTex(1024, 128, (u, v) => {
    const len = 1.1, ju = Math.abs((u / len) % 1 - 0.5) > 0.49 ? 1 : 0;
    let c = mix3(lime2, [0.76, 0.66, 0.54], fbm(u * 4, v * 2, 3, 114));
    c = mix3(c, [0.9, 0.62, 0.44], smooth(0.75, 1, v) * 0.5);
    return mix3(c, [0.5, 0.42, 0.36], ju * 0.7);
  });
  const wt = L.tex(wall, true, true); wt.repeat.set(1 / PLATE, 1 / 0.38);
  D.scene.add(W2.slab(pts, { depth: 0.38, side: L.sideMat(wt, { glow: 0.32 }), cap: new T.MeshStandardMaterial({ color: 0x9a8670, roughness: 0.9 }) }));
  // Säulentrommel auf der Ecke (−x, +z), bemalt mit Bändern
  const drum = L.canvas(256, 64), dx = drum.getContext('2d');
  dx.fillStyle = '#e8dcc2'; dx.fillRect(0, 0, 256, 64);
  [['#24408f', 6], ['#b5652f', 22], ['#e8b347', 40], ['#24408f', 52]].forEach(([c, y]) => { dx.fillStyle = c; dx.fillRect(0, y, 256, 7); });
  const col = new T.Mesh(new T.CylinderGeometry(0.3, 0.32, 0.34, 24), L.sideMat(L.tex(drum), { glow: 0.3 }));
  col.position.set(-HP + 0.4, 0.17, HP - 0.4); col.castShadow = true;
  D.scene.add(col);
  return 'Tempelboden';
};
