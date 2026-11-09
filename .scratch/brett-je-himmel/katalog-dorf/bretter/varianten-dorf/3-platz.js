// V3 Dorfplatz nach dem Regen: das Feld sind 49 Granitplatten (eine je Feld, das Raster sind die nassen Fugen), im
// Rand Kopfsteinpflaster, dazwischen eine Zeile heller Läufersteine statt Einlegelinie, aussen ein Randstein. Alles ist
// nass und spiegelt; an einer Ecke steht eine Laterne, an einer anderen ein Brunnentrog. Lichtwelle: ein Glanz wie
// Laternenlicht läuft über die nassen Steine und bleibt in Pfützen und Fugen.
__katalog.varianten.platz = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.dorf, W2 = __katalog.w2, r = rng(311);
  const LA = HB + 0.04, LB = HB + 0.2, CURB = HP - 0.13; // Läuferzeile, Pflaster, Randstein
  const LAMP = [3.95, -4.55]; // Laterne hinten rechts (x, z)
  const granite = (x, z, base, sc = 1) => {
    const n = noise(x * 260 * sc, z * 260 * sc, 312), n2 = noise(x * 90 * sc, z * 90 * sc, 313);
    let c = base;
    if (n > 0.78) c = c.map((v) => v * 0.35);          // dunkler Glimmer
    else if (n < 0.16) c = c.map((v) => v * 1.45);     // heller Feldspat
    return c.map((v) => v * (0.92 + n2 * 0.16));
  };
  const s = L.surface(2048, (x, z) => {
    const ax = Math.abs(x), az = Math.abs(z), box = Math.max(ax, az);
    const wetN = fbm(x * 0.55, z * 0.55, 4, 314);
    const puddle = smooth(0.33, 0.27, wetN);                 // Pfützen in Senken
    let c, rough, h = 0;
    if (box < HB) {
      const i = Math.floor((x + HB) / CELL), j = Math.floor((z + HB) / CELL);
      const fx = (x + HB) / CELL - i, fz = (z + HB) / CELL - j, ed = Math.min(fx, 1 - fx, fz, 1 - fz) * CELL;
      const tone = noise(i * 5.1, j * 3.3, 315);
      c = granite(x, z, mix3([0.25, 0.25, 0.27], [0.33, 0.32, 0.33], tone));
      rough = 0.42 - wetN * 0.15;
      h = -smooth(0.045, 0.0, ed) * 0.004 + (noise(x * 3, z * 3, 316) - 0.5) * 0.001;
      if (ed < 0.014) { c = [0.03, 0.035, 0.04]; rough = 0.08; h = -0.012; } // Fuge voll Wasser
    } else if (box < LA) {
      c = [0.03, 0.035, 0.04]; rough = 0.08; h = -0.012;
    } else if (box < LB) {
      // Läufer: lange, helle Granitsteine
      const along = ax > az ? z : x, seg = Math.floor((along + 10) / 0.62), fs = ((along + 10) / 0.62) % 1;
      c = granite(x, z, [0.44, 0.43, 0.42].map((v) => v * (0.9 + noise(seg, ax > az ? 1 : 2, 317) * 0.2)));
      rough = 0.45;
      const ed = Math.min(box - LA, LB - box, Math.min(fs, 1 - fs) * 0.62);
      h = -smooth(0.03, 0.0, ed) * 0.004;
      if (ed < 0.008 || Math.abs(ax - az) < 0.008 && box > LA) { c = [0.03, 0.035, 0.04]; rough = 0.1; h = -0.01; }
    } else if (box < CURB) {
      // Kopfsteinpflaster: gewölbte Steine (Waben), Fugen mit Wasser
      const [e, id] = W2.cells(x, z, 0.11, 318);
      const dome = smooth(0.0, 0.045, e);
      c = granite(x, z, [0.30, 0.29, 0.30].map((v) => v * (0.75 + noise(id * 0.37, 1.5, 319) * 0.5)), 1.4);
      rough = mix(0.08, 0.5, dome);
      h = dome * 0.008 - 0.008;
      if (e < 0.012) { c = [0.03, 0.035, 0.04]; rough = 0.08; }
    } else {
      // Randstein
      c = granite(x, z, [0.40, 0.39, 0.39]); rough = 0.5;
      const ed = Math.min(box - CURB, HP - box);
      h = -smooth(0.025, 0.0, ed) * 0.004;
      if (box - CURB < 0.01) { c = [0.03, 0.035, 0.04]; rough = 0.08; h = -0.01; }
    }
    // nass: dunkler, Pfützen spiegeln
    c = c.map((v) => v * mix(0.86, 0.68, puddle));
    rough = mix(rough, 0.04, puddle * (box > HB ? 1 : 0.85));
    // Lichtkegel der Laterne auf den nassen Steinen
    return [c, clamp(rough), h * (1 - puddle * 0.7)];
  }, null, 0.0003);
  // Pfützen und Fugen als Maske für die Lichtwelle; Lichtfleck der Laterne als Leuchtkarte
  const wet = W2.mask(512, (x, px, m) => {
    const id = x.getImageData(0, 0, 512, 512);
    for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) {
      const wx = -HP + (i + 0.5) * PLATE / 512, wz = -HP + (j + 0.5) * PLATE / 512;
      const v = smooth(0.35, 0.27, fbm(wx * 0.55, wz * 0.55, 4, 314));
      id.data[(j * 512 + i) * 4] = v * 255;
    }
    x.putImageData(id, 0, 0);
    x.strokeStyle = '#a00'; x.lineWidth = 0.02 * m;
    for (let k = 0; k <= 7; k++) { const p = -HB + k * CELL; x.beginPath(); x.moveTo(px(p), px(-HB)); x.lineTo(px(p), px(HB)); x.moveTo(px(-HB), px(p)); x.lineTo(px(HB), px(p)); x.stroke(); }
  });
  const pool = L.canvas(256), pc = pool.getContext('2d');
  pc.fillStyle = '#000'; pc.fillRect(0, 0, 256, 256);
  const lp = (w) => (w + HP) / PLATE * 256;
  const grd = pc.createRadialGradient(lp(LAMP[0]), lp(LAMP[1]), 0, lp(LAMP[0]), lp(LAMP[1]), 3.8 / PLATE * 256);
  grd.addColorStop(0, 'rgba(255,170,80,0.8)'); grd.addColorStop(0.3, 'rgba(255,150,70,0.3)'); grd.addColorStop(1, 'rgba(255,140,60,0)');
  pc.fillStyle = grd; pc.fillRect(0, 0, 256, 256);
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 1.0,
    groove: '', inlay: '', bevel: '', grooveRough: '', inlayRough: '', bevelRough: '', refl: 0.75,
    decl: 'uniform sampler2D uWet; uniform sampler2D uPool;', uniforms: { uWet: { value: wet }, uPool: { value: L.tex(pool, false) } },
    // Lichtkegel der Laterne auf den nassen Steinen
    after: 'gl_FragColor.rgb += texture2D(uPool, vUv).rgb * vec3(0.55, 0.42, 0.3);',
    // Lichtwelle: warmer Glanz über die nassen Steine, in Pfützen und Fugen bleibt er länger
    wave: `
        float wm = texture2D(uWet, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.5 + vec3(0.5, 0.36, 0.18)) * ring * k * (0.55 + wm * 1.2);
        gl_FragColor.rgb += vec3(1.7, 1.15, 0.55) * wm * (wide * 0.8 + trail * 10.0) * k;`,
  });
  // Seiten: Randstein oben, darunter Bruchsteinmauer
  const side = L.tex(V.sideCanvas(2048, 96, PLATE, (u, v) => {
    if (v < 0.32) return granite(u, v * 0.38, [0.40, 0.39, 0.39]).map((c) => c * (v < 0.03 ? 1.2 : 1));
    const [e, id] = W2.cells(u, v * 0.38 * 1.6, 0.16, 321);
    if (e < 0.018) return [0.09, 0.09, 0.1];
    return granite(u, v, [0.27, 0.26, 0.27].map((c) => c * (0.7 + noise(id * 0.71, 3.1, 322) * 0.6)), 0.8);
  }), true, true);
  L.sides(L.sideMat(side, { glow: 0.18, roughness: 0.6, env: 1.3 }));
  L.hide('plateTrim');
  const g = new T.Group();
  // Laterne: Mast, Kopf mit leuchtendem Glas, Dach, Spitze
  const iron = new T.MeshStandardMaterial({ color: 0x1c2420, roughness: 0.45, metalness: 0.6, envMapIntensity: 1.4 });
  const add = (geo, mat, x, y, z) => { const o = new T.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  add(new T.CylinderGeometry(0.11, 0.14, 0.28, 12), iron, LAMP[0], 0.14, LAMP[1]);
  add(new T.CylinderGeometry(0.045, 0.06, 2.4, 10), iron, LAMP[0], 1.4, LAMP[1]);
  add(new T.CylinderGeometry(0.12, 0.08, 0.06, 4, 1, false, Math.PI / 4), iron, LAMP[0], 2.62, LAMP[1]);
  const glass = new T.MeshStandardMaterial({ color: 0x302010, emissive: 0xffb45a, emissiveIntensity: 2.4, roughness: 0.3 });
  add(new T.CylinderGeometry(0.17, 0.12, 0.36, 4, 1, false, Math.PI / 4), glass, LAMP[0], 2.83, LAMP[1]);
  add(new T.ConeGeometry(0.24, 0.2, 4, 1, false, Math.PI / 4), iron, LAMP[0], 3.11, LAMP[1]);
  add(new T.SphereGeometry(0.035, 8, 6), iron, LAMP[0], 3.24, LAMP[1]);
  // Brunnentrog aus Granit mit Wasser, hinten links im Rand, mit Brunnenstock und Röhre
  const trogMat = L.sideMat(side, { glow: 0.16, roughness: 0.55 });
  const TX = -4.55, TZ0 = -4.75, TZ1 = -3.0, TW = 0.56, TH = 0.46;
  const walls = [[TX, (TZ0 + TZ1) / 2 + 0, TW, TZ1 - TZ0]];
  void walls;
  for (const [x, z, w, d] of [[TX - TW / 2 + 0.04, (TZ0 + TZ1) / 2, 0.08, TZ1 - TZ0], [TX + TW / 2 - 0.04, (TZ0 + TZ1) / 2, 0.08, TZ1 - TZ0], [TX, TZ0 + 0.04, TW, 0.08], [TX, TZ1 - 0.04, TW, 0.08]]) {
    add(new T.BoxGeometry(w, TH, d), trogMat, x, TH / 2, z);
  }
  const water = new T.Mesh(new T.PlaneGeometry(TW - 0.16, TZ1 - TZ0 - 0.16), new T.MeshStandardMaterial({ color: 0x050a10, roughness: 0.04, metalness: 0.5, envMapIntensity: 2 }));
  water.rotation.x = -Math.PI / 2; water.position.set(TX, TH - 0.06, (TZ0 + TZ1) / 2); g.add(water);
  add(new T.BoxGeometry(0.2, 1.15, 0.2), trogMat, TX, 0.575, TZ0 - 0.0 + 0.12);
  const pipe = add(new T.CylinderGeometry(0.018, 0.018, 0.34, 8), iron, TX, 0.86, TZ0 + 0.32);
  pipe.rotation.x = Math.PI / 2 - 0.15;
  // Lichtwelle: ein kurzer Schauer zieht mit dem Ring; Tropfen schlagen auf, Ringe laufen aus und glänzen
  const rip = L.canvas(128), rx2 = rip.getContext('2d');
  rx2.clearRect(0, 0, 128, 128);
  for (const [rr, a, w] of [[58, 0.9, 3], [44, 0.55, 2.4], [30, 0.3, 2]]) { rx2.strokeStyle = `rgba(255,236,205,${a})`; rx2.lineWidth = w; rx2.beginPath(); rx2.arc(64, 64, rr, 0, 7); rx2.stroke(); }
  const ripG = new T.PlaneGeometry(1, 1); ripG.rotateX(-Math.PI / 2);
  const A = 'clamp((uShock.x - d - seed * 1.1) / 0.8, 0.0, 1.0)';
  const ripMat = V.waveMat(new T.MeshBasicMaterial({ map: L.tex(rip), color: new T.Color(1.1, 0.95, 0.8), transparent: true, depthWrite: false, blending: T.AdditiveBlending }),
    { grow: `step(0.001, ${A}) * (1.0 - ${A}) * 1.6`, size: `mix(0.12, 1.0, ${A})`, glow: 'gl_FragColor.rgb *= vGrow;' });
  const ripples = [], drops = [];
  for (let i = 0; i < 900; i++) {
    const x = (r() * 2 - 1) * (HP - 0.15), z = (r() * 2 - 1) * (HP - 0.15);
    if (x < -4.2 && z < -2.9) continue; // Brunnentrog
    ripples.push([x, 0.004, z, { s: 0.3 + r() * 0.35 }]);
    if (i % 2) drops.push([x, 0.01, z, 0.85, 0.9, 1]);
  }
  g.add(V.waveInst(ripG, ripMat, ripples));
  g.add(V.sparks(drops, { rise: 0.6, fall: 1.1, px: 7, width: 2.2, keep: 0.25 }));
  D.scene.add(g);
  return 'Dorfplatz nach dem Regen';
};
