// W1 Baumscheibe: das Brett ist eine Scheibe vom Stammfuss einer alten Lärche. Rotbraunes Kernholz mit Jahresringen,
// heller Splint, rundum die Borke; der Umriss folgt den vier Wurzelanläufen. Die Lichtwelle läuft Ring für Ring
// durch das Holz, wie Harz, das im Spätholz aufleuchtet
__katalog.varianten.scheibe = async (L) => {
  const { T, D, HB, HP, fbm, noise, clamp, smooth, mix, mix3 } = L;
  const W2 = __katalog.w2, WD = __katalog.wald;
  // Umriss: abgerundetes Quadrat, an den Seitenmitten leicht eingezogen (Wurzelanläufe an den Ecken), etwas unruhig
  const R = (a) => Math.min(WD.rsq(a, 4.88, 1.0) - 0.07 * Math.pow(Math.cos(2 * a), 2) + (noise(Math.cos(a) * 1.6 + 3, Math.sin(a) * 1.6, 201) - 0.5) * 0.16 + (noise(Math.cos(a) * 6 + 3, Math.sin(a) * 6, 214) - 0.5) * 0.04,
    4.885 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))));
  const { Rof, pts } = WD.polar(R);
  const EDGE = 4.88, BARK = 4.56, SAP = 4.24;
  const px0 = 0.25, pz0 = -0.18; // Mark etwas aus der Mitte
  // Ringmass m: nahe am Mark rund, aussen dem Umriss folgend (0 … 4.88 an der Borke)
  const metric = (x, z) => {
    const r = Math.hypot(x, z), rp = Math.hypot(x - px0, z - pz0);
    const shape = r * EDGE / Rof(x, z);
    return mix(rp, shape, smooth(0.3, 3.2, r)) + (fbm(x * 0.5, z * 0.5, 3, 202) - 0.5) * 0.12;
  };
  // aussen enger (rund 130 Ringe), mit guten und schlechten Jahren
  const years = (m) => m * 14 + m * m * 2.6 + (fbm(m * 1.2, 0.5, 3, 215) - 0.5) * 5;
  const heart = [0.47, 0.31, 0.23], heart2 = [0.55, 0.37, 0.26], sap = [0.78, 0.68, 0.53], barkIn = [0.44, 0.22, 0.15], barkOut = [0.33, 0.31, 0.30];
  // Trockenrisse: von der Borke nach innen, keilförmig
  const cracks = [0.4, 1.35, 2.2, 3.05, 3.9, 4.75, 5.6].map((a, i) => [a + (noise(i, 3, 203) - 0.5) * 0.3, 0.035 + noise(i, 7, 204) * 0.03, 0.35 + noise(i, 9, 205) * 0.5]);
  const s = L.surface(2048, (x, z) => {
    const m = metric(x, z), y = years(m), f = y - Math.floor(y + (noise(Math.floor(y), 1, 206) - 0.5) * 0.3);
    // Spätholz dunkel; wo die Ringe eng stehen, schwächer (sonst verschwimmen sie zu dunklen Bändern)
    const dens = 14 + 5.2 * m, strong = 0.35 + 0.65 * noise(Math.floor(y) * 0.37, 2, 216);
    const late = smooth(0.62, 0.86, f) * (1 - smooth(0.93, 1.0, f)) * strong * clamp(1.7 - dens / 28, 0.3, 1);
    const grain = noise(x * 90, z * 90, 207);
    let c = mix3(heart, heart2, fbm(x * 0.7, z * 0.7, 3, 208));
    c = mix3(c, sap, smooth(SAP - 0.06, SAP + 0.06, m + (noise(x * 2, z * 2, 209) - 0.5) * 0.1));
    c = mix3(c, [c[0] * 0.64, c[1] * 0.58, c[2] * 0.56], late * 0.8);
    c = mix3(c, [c[0] * 0.92, c[1] * 0.9, c[2] * 0.88], grain * 0.25);
    let h = -late * 0.0003, rough = mix(0.5, 0.62, late);
    // Kambium (dünn, hell) und Borke (Bastschicht rötlich, aussen grau, schuppig)
    if (m > BARK - 0.02) {
      const t = smooth(BARK, EDGE, m), scale = noise(x * 9, z * 9, 210);
      const bark = mix3(barkIn, barkOut, smooth(0.25, 0.6, t + (scale - 0.5) * 0.3));
      c = mix3(mix3(c, [0.92, 0.82, 0.6], smooth(BARK - 0.03, BARK - 0.005, m) * 0.6), bark, smooth(BARK - 0.005, BARK + 0.01, m));
      h += smooth(BARK, BARK + 0.03, m) * (0.004 + scale * 0.006);
      rough = mix(rough, 0.95, smooth(BARK - 0.01, BARK + 0.01, m));
    }
    // Risse: Winkel um die Mitte, keilförmig von aussen
    let a = Math.atan2(z, x); if (a < 0) a += Math.PI * 2;
    for (const [ca, w, len] of cracks) {
      let da = Math.abs(a - ca); da = Math.min(da, Math.PI * 2 - da);
      const inward = (EDGE - m) / len; // 0 an der Borke … 1 am Ende des Risses
      if (inward < 1) {
        const wid = w * (1 - inward) * 0.5 / Math.max(m, 1) * (0.7 + noise(m * 6, ca * 10, 211) * 0.6);
        if (wid > 1e-4) { const k = 1 - smooth(wid * 0.5, wid, da); c = mix3(c, [0.12, 0.06, 0.04], k); h -= k * 0.01; }
      }
    }
    // Astspuren: kurze, dunkle Streifen vom Mark nach aussen
    for (const [ba, b0, b1] of [[0.9, 1.6, 2.6], [2.6, 2.2, 3.1], [4.1, 0.9, 1.8], [5.3, 2.8, 3.9]]) {
      let db = Math.abs(a - ba); db = Math.min(db, Math.PI * 2 - db);
      const on = smooth(b0, b0 + 0.2, m) * (1 - smooth(b1 - 0.3, b1, m));
      c = mix3(c, [0.36, 0.2, 0.13], (1 - smooth(0.004, 0.012 + 0.006 * (m - b0), db * m)) * on * 0.4);
    }
    // Kernrisse am Mark (klein)
    const rp = Math.hypot(x - px0, z - pz0), ap = Math.atan2(z - pz0, x - px0);
    const star = Math.pow(Math.abs(Math.cos(ap * 1.5 + 0.4)), 60) * (1 - smooth(0.05, 0.32, rp));
    c = mix3(c, [0.16, 0.08, 0.05], star * 0.85);
    // Maske: Rot = Spätholz (leuchtet), Grün = Ringmass für die Welle
    return [c, rough, h, [late * (m < BARK ? 1 : 0), clamp(m / 4.9)]];
  }, ({ color, px }) => W2.clip(color, px, pts), 0.00025);
  D.floorMaterial.alphaTest = 0.5;
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.45,
    // Raster: Brandlinien; keine Einlegelinie (der Splint rahmt das Feld), keine Fase
    groove: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.1, 0.05, 0.03), floorGroove * 0.85);',
    inlay: '', inlayRough: '', bevel: '', bevelRough: '', refl: 0.16,
    replace: [['float lw = 0.00458;', 'float lw = 0.0068;']],
    decl: 'uniform sampler2D uRings;', uniforms: { uRings: { value: s.mask } },
    // Lichtwelle: läuft Ring für Ring durch das Holz (im Ringmass, nicht im Abstand), das Spätholz leuchtet wie Harz
    wave: `
        vec2 rg = texture2D(uRings, vUv).rg;
        float rm = rg.g * 4.9;
        float band = exp(-pow((rm - uShock.x) / (uShock.z * 1.6), 2.0));
        float behind = 1.0 - smoothstep(uShock.x - 0.3, uShock.x + 0.1, rm);
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += vec3(1.5, 0.78, 0.25) * rg.r * (band * 1.7 + behind * 0.18) * k;
        gl_FragColor.rgb += (uShockColor * 0.4 + vec3(0.35, 0.18, 0.06)) * band * k * 0.35;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // Borke an der Seite: Lärche, tiefe Längsrisse, rötliche Bastschicht in den Rissen, graue Schuppen
  const bc = L.sideTex(1024, 256, (u, v) => {
    const x = u / L.PLATE * 2; // 2 m Breite, 0.5 m hoch
    const fx = x * 6 + (fbm(x * 1.5, v * 1.2, 3, 212) - 0.5) * 2.2;
    const rib = Math.abs(Math.sin(fx * Math.PI)), furrow = 1 - smooth(0.0, 0.32, rib);
    const brk = smooth(0.8, 0.86, noise(Math.floor(fx) * 3.1, v * 3.5, 213)); // Querrisse in den Schuppen
    let c = mix3([0.40, 0.36, 0.33], [0.53, 0.49, 0.45], smooth(0.3, 1, rib) * (0.6 + 0.4 * noise(x * 30, v * 8, 217)));
    c = mix3(c, [0.38, 0.17, 0.11], furrow * 0.9);
    c = mix3(c, [0.24, 0.13, 0.09], brk * 0.7);
    // oberer Rand: Schnittkante der Borke
    return mix3(c, [0.46, 0.26, 0.17], smooth(0.05, 0.0, v) * 0.6);
  });
  const barkMap = WD.slabTex(bc, 2, 0.5);
  const barkMat = L.sideMat(barkMap, { glow: 0.3, roughness: 0.95 });
  const slab = W2.slab(pts, { depth: 0.5, side: barkMat, cap: new T.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.95 }) });
  slab.castShadow = true;
  D.scene.add(slab);
  return 'Baumscheibe';
};
