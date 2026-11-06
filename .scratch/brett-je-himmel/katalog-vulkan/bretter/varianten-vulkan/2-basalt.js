// V2 Basaltsäulen: das Brett ist das Ende eines Bündels sechseckiger Basaltsäulen wie am Giant's Causeway. Im Feld
// sind die Säulen eben abgeschliffen (feine Fugen), im Rand stehen sie in Stufen, nach aussen tiefer. Unten hängen sie
// verschieden lang herab wie die Decke der Fingalshöhle, ihre Enden glühen im Licht der Lava. Lichtwelle: Glut steigt
// in den Fugen auf, und die Köpfe der Randsäulen leuchten nacheinander auf
__katalog.varianten.basalt = async (L) => {
  const { T, D, PLATE, HB, HP, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.vk, r = rng(301);
  const R = 0.19, S3 = Math.sqrt(3), AP = R * S3 / 2; // Umkreis, Apothem
  const FIELD = HB + R; // Mitte einer Feldsäule: deckt jeden Punkt des Felds
  const center = (q, rr) => [R * S3 * (q + rr / 2), R * 1.5 * rr];
  /** Sechseck (Spitze in z) unter (x, z): Mitte, Nummer, Abstand zur Kante */
  function hexAt(x, z) {
    const qf = (S3 / 3 * x - z / 3) / R, rf = (2 / 3 * z) / R, sf = -qf - rf;
    let q = Math.round(qf), rr = Math.round(rf), s = Math.round(sf);
    const dq = Math.abs(q - qf), dr = Math.abs(rr - rf), ds = Math.abs(s - sf);
    if (dq > dr && dq > ds) q = -rr - s; else if (dr > ds) rr = -q - s;
    const [cx, cz] = center(q, rr), px = x - cx, pz = z - cz;
    let m = 0;
    for (const a of [0, Math.PI / 3, -Math.PI / 3]) m = Math.max(m, Math.abs(px * Math.cos(a) + pz * Math.sin(a)));
    return { cx, cz, q, rr, id: q * 1000 + rr, edge: AP - m };
  }
  const tone = (id) => L.noise(id * 0.137, id * 0.071, 302);
  const s = L.surface(2048, (x, z) => {
    const h = hexAt(x, z), t = tone(h.id);
    const inField = Math.max(Math.abs(h.cx), Math.abs(h.cz)) < FIELD;
    let c = mix3([0.13, 0.125, 0.12], [0.2, 0.19, 0.18], t);
    c = mix3(c, [0.16, 0.15, 0.17], fbm(x * 2, z * 2, 3, 303) * 0.4);
    const joint = smooth(0.012, 0.004, h.edge), lip = smooth(0.045, 0.012, h.edge) * (1 - joint);
    c = mix3(c, [0.24, 0.23, 0.22], lip * 0.5);
    c = mix3(c, [0.035, 0.03, 0.03], joint);
    const hh = -joint * 0.004 - lip * 0.0012 + (fbm(x * 9, z * 9, 2, 304) - 0.5) * 0.0004;
    return [inField ? c : [0, 0, 0], mix(0.5, 0.85, joint), hh];
  }, ({ color, px, N }) => {
    // ausserhalb der Feldsäulen durchsichtig: dort stehen die Randsäulen als Körper
    const im = color.getImageData(0, 0, N, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = -HP + (i + 0.5) * PLATE / N, z = -HP + (j + 0.5) * PLATE / N, h = hexAt(x, z);
      if (Math.max(Math.abs(h.cx), Math.abs(h.cz)) >= FIELD) im.data[(j * N + i) * 4 + 3] = 0;
    }
    color.putImageData(im, 0, 0);
  }, 0.0002);
  const joints = V.maskFn(1024, (x, z) => { const h = hexAt(x, z); return smooth(0.02, 0.004, h.edge); });
  D.floorMaterial.alphaTest = 0.5;
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.6,
    groove: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.34, 0.31), floorGroove * 0.75);',
    inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.38, 0.32), floorInlay);',
    bevel: '', bevelRough: '', refl: 0.3,
    decl: 'uniform sampler2D uJoint;', uniforms: { uJoint: { value: joints } },
    // Lichtwelle: Glut steigt in den Fugen auf, wo der Ring vorbeizieht
    wave: `
        float jn = texture2D(uJoint, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.5 + vec3(0.2, 0.12, 0.05)) * ring * k * 0.6;
        gl_FragColor.rgb += vec3(1.25, 0.5, 0.12) * jn * (wide + trail * 0.25) * k * 1.4;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // Säulen: alle, die ganz in die Platte passen; Feldsäulen oben bündig, Randsäulen in Stufen, unten verschieden lang
  const cols = [];
  for (let rr = -34; rr <= 34; rr++) for (let q = -34; q <= 34; q++) {
    const [cx, cz] = center(q, rr);
    if (Math.abs(cx) > HP - AP || Math.abs(cz) > HP - R) continue;
    const box = Math.max(Math.abs(cx), Math.abs(cz)), d = Math.hypot(cx, cz);
    const field = box < FIELD;
    const out = clamp((box - FIELD) / (HP - FIELD));
    let top = field ? -0.01 : -0.025 - out * 0.34 * (0.45 + r() * 0.8);
    if (!field && out > 0.25 && r() < 0.14) top = 0.03 + r() * 0.06; // einzelne höher, wie Stufen am Causeway
    const hang = 0.45 + 2.3 * Math.pow(clamp(1 - d / 6.6), 1.6) * (0.55 + 0.45 * r()) + (r() < 0.12 ? r() * 0.6 : 0);
    cols.push({ cx, cz, top, bot: -0.38 - hang, id: q * 1000 + rr, field });
  }
  const geo = new T.CylinderGeometry(R * 0.975, R * 0.975, 1, 6, 1); geo.translate(0, -0.5, 0);
  const mat = V.lavaMat({ color: 0xffffff, roughness: 0.7, flatShading: true, envMapIntensity: 1.4 }, { down: 2.8, side: 0.3, lo: -2.5, hi: -0.4, spec: 0.35 }, `
        float d = length(vI.xz);
        float flash = exp(-pow((d - uShock.x) / 0.55, 2.0)) * min(1.0, uShock.y * 3.0);
        vec3 wN2 = inverseTransformDirection(normal, viewMatrix);
        float topf = smoothstep(0.7, 0.95, wN2.y);
        gl_FragColor.rgb += vec3(1.1, 0.48, 0.14) * flash * (0.35 + 0.65 * topf) * 0.9;`);
  const inst = new T.InstancedMesh(geo, mat, cols.length);
  const M = new T.Matrix4(), Q = new T.Quaternion(), Sc = new T.Vector3(), P = new T.Vector3(), C = new T.Color();
  cols.forEach((c, i) => {
    P.set(c.cx, c.top, c.cz); Sc.set(1, c.top - c.bot, 1);
    inst.setMatrixAt(i, M.compose(P, Q, Sc));
    const t = tone(c.id), v = mix(0.022, 0.05, t);
    C.setRGB(v, v * 0.96, v * 0.93); inst.setColorAt(i, C);
  });
  inst.castShadow = true; inst.receiveShadow = true;
  D.scene.add(inst);
  // Lichtwelle: die Säulen des Felds heben sich im Ring, ihre Flanken glühen frisch; dahinter sinken sie zurück
  {
    const cg = new T.CylinderGeometry(R * 0.95, R * 0.95, 1, 6, 1); cg.translate(0, 0.5, 0);
    const q = rng(311), list = [];
    for (const c of cols) if (c.field && q() < 0.5) list.push({ p: [c.cx, -0.02, c.cz], s: [1, 0.08 + Math.pow(q(), 2) * 0.22, 1] });
    const m = new T.MeshStandardMaterial({ color: 0x0b0a0a, roughness: 0.6, flatShading: true });
    D.scene.add(V.koerper(cg, m, list, { mode: 'grow', axis: 'y', width: 2.2, keep: 0.25, tail: 1.0, glow: `
      vec3 wN = inverseTransformDirection(normal, viewMatrix);
      float side = 1.0 - smoothstep(0.6, 0.9, wN.y);
      gl_FragColor.rgb += vec3(1.0, 0.36, 0.07) * side * vGrow * 0.85;` }));
  }
  return `Basaltsäulen (${cols.length} Säulen)`;
};
