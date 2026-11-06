// V7 Höhlenstadt: das Brett ist die Oberseite eines Tuffkegels, in den eine Stadt gehauen ist wie in Kappadokien,
// nur umgekehrt: Der Kegel hängt unter dem Brett, voller Fenster, Türen und Taubenlöcher, aus denen warmes Lampenlicht
// fällt. Oben glatter Tuff mit Meisselspuren, in einer Ecke führt eine Treppe hinab. Lichtwelle: Fenster für Fenster
// geht das Licht an, wo der Ring vorbeizieht
__katalog.varianten.hoehlenstadt = async (L) => {
  const { T, D, PLATE, HB, HP, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.vk, r = rng(801);
  const tuff = [0.8, 0.62, 0.5], tuff2 = [0.7, 0.53, 0.43], band = [0.86, 0.72, 0.58], red = [0.6, 0.38, 0.3];
  const stair = { x: -4.55, z: -2.6, w: 0.5, l: 1.5 }; // Treppe im Rand (längs z)
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const g = fbm(x * 0.4, z * 0.4, 4, 802);
    let c = mix3(tuff, tuff2, smooth(0.35, 0.75, g));
    // Meisselspuren: kurze parallele Kerben, Richtung wechselt in Feldern
    const cell = Math.floor(x / 0.6) * 7 + Math.floor(z / 0.6), dir = L.noise(cell * 0.3, 1, 803) * Math.PI;
    const u = x * Math.cos(dir) + z * Math.sin(dir), chis = Math.pow(Math.abs(Math.sin(u * 70)), 8) * (0.5 + 0.5 * noise(x * 4, z * 4, 804));
    c = mix3(c, [c[0] * 0.78, c[1] * 0.74, c[2] * 0.74], chis * 0.7);
    let h = -chis * 0.0016;
    // Rand: etwas rauer, mit roter Tuffschicht am Saum
    const rim = smooth(HB + 0.15, HB + 0.35, box);
    c = mix3(c, mix3(c, red, smooth(HP - 0.2, HP - 0.05, box) * 0.6), rim);
    h += rim * (fbm(x * 2, z * 2, 3, 805) - 0.5) * 0.006;
    return [c, 0.95, h];
  }, ({ color, height, px, m }) => {
    // Treppe hinab: dunkle Öffnung mit Stufen, warmes Licht von unten
    const x0 = px(stair.x - stair.w / 2), z0 = px(stair.z - stair.l / 2), W = stair.w * m, Lh = stair.l * m;
    const g = color.createLinearGradient(0, z0, 0, z0 + Lh);
    g.addColorStop(0, 'rgb(120,88,70)'); g.addColorStop(0.7, 'rgb(40,26,20)'); g.addColorStop(1, 'rgb(25,14,10)');
    color.fillStyle = g; color.fillRect(x0, z0, W, Lh);
    color.strokeStyle = 'rgba(205,170,140,0.85)'; color.lineWidth = 0.012 * m;
    for (let i = 1; i < 9; i++) { const y = z0 + Lh * i / 9; color.globalAlpha = 1 - i / 10; color.beginPath(); color.moveTo(x0, y); color.lineTo(x0 + W, y); color.stroke(); }
    color.globalAlpha = 1;
    height.fillStyle = 'rgb(60,60,60)'; height.fillRect(x0, z0, W, Lh);
  }, 0.00025);
  // Lampenlicht in der Treppe
  const lamp = V.mask(512, (x, px, m) => {
    const g = x.createLinearGradient(0, px(stair.z - stair.l / 2), 0, px(stair.z + stair.l / 2));
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.7)');
    x.fillStyle = g; x.fillRect(px(stair.x - stair.w / 2), px(stair.z - stair.l / 2), stair.w * m, stair.l * m);
  });
  const fm = D.floorMaterial;
  fm.emissiveMap = lamp; fm.emissive.setRGB(0.9, 0.55, 0.22);
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.4,
    groove: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.3, 0.2, 0.15), floorGroove * 0.9);',
    inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.55, 0.33, 0.26), floorInlay);',
    replace: [['float iw = 0.011;', 'float iw = 0.025;'], ['float lw = 0.00458;', 'float lw = 0.0075;']],
    bevel: '', bevelRough: '', refl: 0.0,
    // Lichtwelle: warmes Lampenlicht läuft über den Tuff
    wave: `
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.4 + vec3(0.5, 0.32, 0.12)) * (ring * 0.8 + wide * 0.25 + trail * 0.08) * k;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // Kegel: oben das Quadrat, nach unten rund und spitz
  const N = 240, sq = V.roundedSquare(4.9, 0.3, N);
  const prof = [[-0.003, 1.0, 0], [-0.4, 0.99, 0.05], [-0.85, 0.95, 0.2], [-1.35, 0.85, 0.45], [-1.85, 0.69, 0.7], [-2.35, 0.49, 0.9], [-2.8, 0.27, 1], [-3.1, 0.11, 1]];
  const R0 = 4.9;
  const rings = prof.map(([y, sc, b], k) => [y, (x, z, u) => {
    const a = u * Math.PI * 2, n = k > 0 ? (fbm(u * 9, k * 0.6, 3, 806) - 0.5) * 0.12 : 0;
    const cx = Math.cos(a) * R0 * 0.92, cz = Math.sin(a) * R0 * 0.92;
    return [mix(x, cx, b) * (sc + n), mix(z, cz, b) * (sc + n)];
  }]);
  const geo = V.hullGeo(sq, rings, { tip: [0, -3.22, 0], flat: false });
  // Textur: Schichten des Tuffs, Erosionsrinnen, Fenster in Stockwerken (Breite nach dem Umfang des Rings)
  const TW = 4096, TH = 512, cc = L.canvas(TW, TH), ec = L.canvas(TW, TH);
  const cx = cc.getContext('2d'), ex = ec.getContext('2d'), ci = cx.createImageData(TW, TH);
  const vOfY = (y) => { // v (0..1 über Ringe) aus y
    for (let k = 0; k < prof.length - 1; k++) if (y >= prof[k + 1][0]) return (k + (y - prof[k][0]) / (prof[k + 1][0] - prof[k][0])) / prof.length;
    return 1;
  };
  const scOfV = (v) => { const t = v * prof.length, k = Math.min(prof.length - 1, Math.floor(t)); const a = prof[k][1], b = prof[k + 1]?.[1] ?? 0.02; return mix(a, b, t - k); };
  for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) {
    const v = j / TH, u = i / TW * 38 * Math.max(0.15, scOfV(v));
    const t = v * 14 + fbm(i / TW * 30, v * 3, 3, 807) * 1.2;
    let c = mix3(tuff, band, smooth(0.6, 0.9, Math.sin(t) * 0.5 + 0.5));
    c = mix3(c, red, smooth(0.75, 0.95, Math.sin(t * 0.37 + 1)) * 0.5);
    const gully = smooth(0.6, 0.85, fbm(i / TW * 140, v * 0.6, 2, 808));
    c = mix3(c, [c[0] * 0.78, c[1] * 0.74, c[2] * 0.72], gully * 0.45);
    const lit = 0.75 + 0.25 * (1 - v); // unten etwas dunkler, die Lava leuchtet dort an (Unterlicht)
    const k = (j * TW + i) * 4;
    ci.data[k] = c[0] * 255 * lit; ci.data[k + 1] = c[1] * 255 * lit; ci.data[k + 2] = c[2] * 255 * lit; ci.data[k + 3] = 255;
  }
  cx.putImageData(ci, 0, 0);
  const wc = L.canvas(TW, TH), wx = wc.getContext('2d'); // alle Fenster und Türen (für die Lichtwelle)
  for (const c of [ex, wx]) { c.fillStyle = '#000'; c.fillRect(0, 0, TW, TH); }
  // Stockwerke
  const floors = [-0.55, -1.05, -1.55, -2.05, -2.5];
  for (const fy of floors) {
    const v = vOfY(fy), sc = scOfV(v), per = 38 * sc * 0.93, n = Math.floor(per / 0.75), py = v * TH;
    for (let w = 0; w < n; w++) {
      if (r() < 0.22) continue;
      const kind = r(), uc = (w + 0.5 + (r() - 0.5) * 0.3) / n;
      const wm = kind < 0.15 ? 0.3 : kind < 0.75 ? 0.2 : 0.09; // Tür, Fenster, Taubenloch
      const hm = kind < 0.15 ? 0.46 : kind < 0.75 ? 0.3 : 0.1;
      const wpx = wm / per * TW, hpx = hm * TH / 3.22, X = uc * TW - wpx / 2, Y = py - hpx / 2;
      const arch = (ctx, g = 0) => { ctx.beginPath(); ctx.moveTo(X - g, Y + hpx + g); ctx.lineTo(X - g, Y + wpx / 2); ctx.arc(X + wpx / 2, Y + wpx / 2, wpx / 2 + g, Math.PI, 0); ctx.lineTo(X + wpx + g, Y + hpx + g); ctx.closePath(); };
      cx.fillStyle = 'rgba(95,62,48,0.8)'; arch(cx, Math.max(2, wpx * 0.14)); cx.fill(); // Laibung
      cx.fillStyle = 'rgb(32,20,16)'; arch(cx); cx.fill();
      if (kind < 0.75) { wx.fillStyle = '#fff'; arch(wx); wx.fill(); }
      if (kind < 0.75 && r() < 0.6) {
        ex.fillStyle = `rgb(255,${Math.round(160 + r() * 40)},${Math.round(70 + r() * 30)})`; arch(ex); ex.fill();
        cx.fillStyle = 'rgb(150,95,50)'; arch(cx); cx.fill();
      }
      // Gesims über Türen
      if (kind < 0.15) { cx.fillStyle = 'rgba(230,205,180,0.6)'; cx.fillRect(X - wpx * 0.2, Y - 4, wpx * 1.4, 3); }
    }
  }
  const coneMat = new T.MeshStandardMaterial({ map: V.htex(cc), emissiveMap: V.htex(ec), emissive: new T.Color(0.78, 0.6, 0.45), roughness: 0.95, envMapIntensity: 0.4 });
  L.withWave(coneMat, V.unter({ down: 0.9, side: 0.4, lo: -3.0, hi: -0.5 }) + `
      {
        ${L.RING}
        float win = texture2D(uWin, vUv).r;
        float pass = exp(-pow((length(vW.xz) - uShock.x) / 0.9, 2.0)) + step(length(vW.xz), uShock.x) * 0.5;
        gl_FragColor.rgb += vec3(0.9, 0.6, 0.3) * win * pass * min(1.0, uShock.y * 3.0) * 0.9;
      }`, 'uniform sampler2D uWin;', { uWin: { value: V.htex(wc, false) } });
  const cone = new T.Mesh(geo, coneMat);
  cone.receiveShadow = true;
  D.scene.add(cone);
  // Feenkamine auf den Ecken: Tuffkegel mit dunklem Basalthut, hinten höher
  const lathe = new T.LatheGeometry([[0.3, 0], [0.28, 0.12], [0.22, 0.3], [0.15, 0.48], [0.11, 0.6], [0.1, 0.66], [0, 0.66]].map(([a, b]) => new T.Vector2(a, b)), 14);
  const capG = new T.SphereGeometry(0.17, 12, 8); capG.scale(1, 0.45, 1);
  const chimMat = V.lavaMat({ color: new T.Color(0.58, 0.4, 0.3), roughness: 0.95 }, { down: 0.9, side: 0.45 });
  const capMat = V.lavaMat({ color: new T.Color(0.05, 0.045, 0.045), roughness: 0.8 }, { down: 0.9, side: 0.4 });
  for (const [x, z, k] of [[-4.55, -4.55, 1.25], [4.55, -4.55, 1.0], [-4.58, 4.58, 0.7], [4.58, 4.58, 0.8]]) {
    const c = new T.Mesh(lathe, chimMat); c.position.set(x, 0, z); c.scale.set(1, k, 1); c.castShadow = true; D.scene.add(c);
    const h = new T.Mesh(capG, capMat); h.position.set(x, 0.66 * k + 0.02, z); h.castShadow = true; D.scene.add(h);
  }
  // Lichtwelle: kleine Heissluftballone steigen aus dem Ring auf wie morgens über Göreme und verblassen in der Höhe
  {
    const q = rng(821);
    const env = new T.SphereGeometry(0.5, 16, 12); env.scale(1, 1.15, 1); env.translate(0, 0.62, 0);
    const bk = new T.BoxGeometry(0.22, 0.16, 0.22);
    const pal = [[0.85, 0.2, 0.12], [0.95, 0.6, 0.12], [0.2, 0.4, 0.8], [0.9, 0.85, 0.3], [0.55, 0.2, 0.55]];
    const list = V.streu(55, q, (x, z, box, w) => ({ p: [x, 0.05, z], r: [0, w() * 6.3, 0], s: 0.3 + w() * 0.15, c: pal[Math.floor(w() * pal.length)] }));
    const size = '(smoothstep(0.0, 0.1, ph) * (1.0 - smoothstep(0.8, 1.0, ph)))';
    D.scene.add(V.koerper(env, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }), list, { mode: 'rise', tail: 2.6, lift: 1.3, size, glow: `
      gl_FragColor.rgb += vColor * 0.25 * (1.0 - vPhase * 0.5) + vec3(1.0, 0.6, 0.2) * 0.12;` }));
    D.scene.add(V.koerper(bk, new T.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.9 }), list.map((l) => ({ ...l, c: undefined })), { mode: 'rise', tail: 2.6, lift: 1.3, size }));
  }
  return 'Höhlenstadt';
};
