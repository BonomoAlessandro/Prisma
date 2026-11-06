// V1 Obsidian: das Brett ist ein geschlagener Block aus Vulkanglas. Das Feld ist schwarz poliert und spiegelt, im Rand
// liegen muschelige Abschläge mit Wellenlinien (wie an einer Steinzeitklinge), der Umriss ist ausgebogt. Unten ein
// facettierter Kiel, dessen Flächen die Glut des Sees spiegeln; die dünne Kante scheint rotbraun durch. Lichtwelle:
// ein Regenbogenschimmer wie bei Regenbogenobsidian
__katalog.varianten.obsidian = async (L) => {
  const { T, D, PLATE, HB, HP, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.vk, r = rng(201);
  // Umriss: Bögen der Abschläge, K Stück um den Umfang, ungleich breit
  const K = 30, H0 = 4.885, RC = 0.6;
  const ph = (a) => K * a / (2 * Math.PI) + 0.35 * Math.sin(3 * a) + 0.22 * Math.sin(7 * a + 1);
  const depthOf = (i) => 0.07 + 0.14 * L.noise(i * 3.7, 0.5, 202);
  const bite = (a) => { const p = ph(a), i = Math.floor(p), f = p - i; return depthOf(((i % K) + K) % K) * Math.pow(1 - (2 * f - 1) ** 2, 0.8); };
  const pts = V.roundedSquare(H0, RC, 1100, (a) => -bite(a));
  // Mitten der Abschläge auf dem Umriss (Winkel durch Bisektion)
  const scars = [];
  for (let i = 0; i < K; i++) {
    let lo = 0, hi = 2 * Math.PI;
    const target = i + 0.5;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (ph(m) < target) lo = m; else hi = m; }
    const a = lo;
    // Punkt auf dem Umriss: nächster Punkt von pts in dieser Richtung
    let best = pts[0], bd = 9;
    for (const p of pts) { const d = Math.abs(Math.atan2(p[1], p[0]) - Math.atan2(Math.sin(a), Math.cos(a))); if (d < bd) { bd = d; best = p; } }
    scars.push({ x: best[0], z: best[1], R: 0.6 + r() * 0.35, d: 0.01 + r() * 0.01 });
  }
  // kleine Retuschen ganz am Rand
  for (let i = 0; i < 120; i++) {
    const p = pts[Math.floor(r() * pts.length)];
    scars.push({ x: p[0], z: p[1], R: 0.1 + r() * 0.12, d: 0.002 + r() * 0.003, small: true });
  }
  const flow = (x, z) => Math.sin(x * 2.1 + Math.sin(z * 0.9) * 1.7 + Math.sin(x * 0.4 + z * 0.3) * 2.0 + fbm(x * 0.3, z * 0.3, 3, 203) * 3);
  const scarAt = (x, z) => {
    let b1 = 9, b2 = 9, s1 = null;
    for (const s of scars) {
      const dx = x - s.x, dz = z - s.z;
      if (Math.abs(dx) > s.R || Math.abs(dz) > s.R) continue;
      const t = Math.hypot(dx, dz) / s.R;
      if (t < b1) { b2 = b1; b1 = t; s1 = s; } else if (t < b2) b2 = t;
    }
    return [b1, b2, s1];
  };
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const fl = flow(x, z);
    let c = [0.020 + fl * 0.004, 0.020 + fl * 0.004, 0.024 + fl * 0.005], rough = 0.2, h = fl * 0.00015;
    if (box > HB + 0.12) {
      const [t, t2, sc] = scarAt(x, z);
      if (sc && t < 1) {
        const dist = t * sc.R;
        const ripple = Math.sin(dist / 0.04 * Math.PI * 2 + noise(x * 5, z * 5, 204) * 2.5) * (1 - t * 0.7);
        h += -sc.d * (1 - t * t) + ripple * 0.0006;
        const ridge = smooth(0.08, 0.0, t2 - t) * (t2 < 1 ? 1 : 0.6);
        c = mix3([0.06, 0.056, 0.06], [0.3, 0.28, 0.29], clamp((1 - t) * 0.2 + Math.pow(ripple * 0.5 + 0.5, 2) * 0.6 * (1 - t * 0.6)));
        c = mix3(c, [0.52, 0.49, 0.48], ridge * 0.9);
        rough = mix(0.16, 0.3, ridge);
        h += ridge * 0.001;
      }
    }
    return [c, rough, h];
  }, ({ color, px }) => V.clip(color, px, pts), 0.0002);
  // dünne Kante: rotbraun durchscheinend (Glut von unten), als Leuchten
  const edge = V.mask(1024, (x, px, m) => {
    x.strokeStyle = 'rgb(255,255,255)'; x.lineJoin = 'round';
    for (const [w, a] of [[0.22, 0.18], [0.12, 0.3], [0.06, 0.55], [0.025, 1]]) {
      x.globalAlpha = a; x.lineWidth = w * m; x.beginPath();
      pts.forEach(([X, Z], i) => (i ? x.lineTo(px(X), px(Z)) : x.moveTo(px(X), px(Z)))); x.closePath(); x.stroke();
    }
    x.globalAlpha = 1;
  });
  const fm = D.floorMaterial;
  fm.emissiveMap = edge; fm.emissive.setRGB(0.5, 0.13, 0.035);
  fm.alphaTest = 0.5;
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 1.0,
    groove: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.085, 0.08, 0.085), floorGroove);',
    inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.15, 0.15), floorInlay);',
    grooveRough: 'roughnessFactor = mix(roughnessFactor, 0.85, floorGroove);',
    inlayRough: 'roughnessFactor = mix(roughnessFactor, 0.85, floorInlay);',
    bevel: '', bevelRough: '', refl: 0.85,
    // Lichtwelle: Regenbogenschimmer, der den Fliessbändern des Glases folgt
    wave: `
        vec2 pp = (vUv - 0.5) * ${PLATE.toFixed(3)};
        float fl = sin(pp.x * 2.1 + sin(pp.y * 0.9) * 1.7 + sin(pp.x * 0.4 + pp.y * 0.3) * 2.0);
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 2.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        vec3 irid = 0.5 + 0.5 * cos(6.2832 * (sd * 0.8 - uShock.x * 0.8 + fl * 0.1 + vec3(0.0, 0.33, 0.67)));
        float sheen = pow(0.5 + 0.5 * fl, 3.0);
        gl_FragColor.rgb += mix(vec3(0.5), irid, 0.75) * wide * (0.12 + 0.88 * sheen) * k * 0.42 + uShockColor * ring * k * 0.22;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // Kiel: facettiert, linsenförmig nach unten; jede Facette spiegelt die Glut des Sees anders
  const hp = pts.filter((_, i) => i % 14 === 0);
  const prof = [[-0.003, 1, 0], [-0.3, 0.99, 0.03], [-0.75, 0.92, 0.07], [-1.15, 0.7, 0.08], [-1.45, 0.34, 0.05]];
  const rings = prof.map(([y, sc, j], k) => [y, (x, z, u) => {
    const n = (noise(u * 60, k * 3.1, 205) - 0.5) * j * 4;
    return [x * (sc + n * 0.1), z * (sc + n * 0.1), k > 0 ? (noise(u * 45, k, 206) - 0.5) * 0.14 : 0];
  }]);
  const geo = V.hullGeo(hp, rings, { tip: [0.2, -1.58, -0.1] });
  V.faceColors(geo, (n, m) => { const v = 0.08 + 0.92 * Math.pow(r(), 2.5); return [v, v, v]; });
  const keel = new T.Mesh(geo, L.withWave(new T.MeshStandardMaterial({ color: 0x050506, roughness: 0.12, metalness: 0, flatShading: true, envMapIntensity: 1.6, side: T.DoubleSide }), `
      {
        vec3 wN = inverseTransformDirection(normal, viewMatrix);
        float dn = pow(clamp(-wN.y + 0.35, 0.0, 1.0), 1.5);
        float fr = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.0);
        gl_FragColor.rgb += vec3(0.85, 0.24, 0.05) * dn * (0.05 + 1.1 * fr) * vColor.r;
        ${L.RING}
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 2.0), 2.0));
        vec3 irid = 0.5 + 0.5 * cos(6.2832 * (vW.y * 1.5 + sd * 0.6 + vec3(0.0, 0.33, 0.67)));
        gl_FragColor.rgb += irid * wide * min(1.0, uShock.y * 3.0) * 0.45 * vColor.r;
      }`));
  keel.material.vertexColors = true;
  keel.material.onBeforeCompile = ((orig) => (sh, rr) => { orig(sh, rr); sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', ''); })(keel.material.onBeforeCompile);
  D.scene.add(keel);
  return 'Obsidian';
};
