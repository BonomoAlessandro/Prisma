// 2 Treibholz-Floss: je Reihe eine Bohle, Rand aus zwei breiteren Bohlen, darunter drei Rundhölzer, Tau als Einlegelinie
__katalog.varianten.floss = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng, parts } = L;
  const r = rng(11);
  L.hide('floorTop', 'plateSides', 'plateTrim');
  L.skyBehind();

  // Bohlen: Reihen in z; Feldreihen 1.2, Randbohlen 0.7; Fuge 1.6 cm
  const GAP = 0.016, TH = 0.15;
  const planks = [];
  planks.push({ z0: -HP, z1: -HB, rim: true });
  for (let k = 0; k < 7; k++) planks.push({ z0: -HB + k * CELL, z1: -HB + (k + 1) * CELL });
  planks.push({ z0: HB, z1: HP, rim: true });
  for (const p of planks) {
    const need = p.rim ? 4.2 : HB + 0.25; // Feld ganz gedeckt
    p.xa = -Math.min(HP - 0.02, need + 0.15 + r() * 0.55);
    p.xb = Math.min(HP - 0.02, need + 0.15 + r() * 0.55);
    p.tone = r(); p.paint = p.rim && r() < 0.9;
  }
  const plankOf = (z) => planks.find((p) => z >= p.z0 && z < p.z1) ?? planks[planks.length - 1];

  // Oberseite (weltbezogen): Maserung längs x, Äste, Nägel, eingebrannte Rasterlinien
  const top = L.surface(2048, (x, z) => {
    const p = plankOf(z);
    const zr = (z - p.z0) / (p.z1 - p.z0);
    const grainW = fbm(x * 0.35, z * 9 + p.tone * 40, 3, 4) * 6;
    const grain = Math.sin((z * 38 + grainW) * 2.2) * 0.5 + 0.5;
    const fine = noise(x * 3, z * 160 + p.tone * 9, 6);
    const silver = [0.67, 0.64, 0.58], warm = [0.62, 0.53, 0.42], deep = [0.36, 0.31, 0.27];
    let c = mix3(silver, warm, clamp(p.tone * 0.9 + (fbm(x * 0.5, z * 2, 3, 7) - 0.5) * 0.8));
    c = mix3(c, deep, (grain * 0.22 + fine * 0.18) * (0.7 + 0.6 * fbm(x * 1.4, z * 3, 2, 8)));
    // verblasste Farbe alter Bootsplanken auf den Randbohlen
    if (p.paint) {
      const peel = smooth(0.48, 0.56, fbm(x * 1.1, z * 4.2, 4, 13) + fine * 0.15);
      c = mix3(c, [0.42, 0.66, 0.66], peel * 0.75);
    }
    // Kanten der Bohle dunkler, abgerundet
    const edge = smooth(0.0, 0.05, Math.min(zr, 1 - zr) * (p.z1 - p.z0));
    c = mix3([0.22, 0.19, 0.17], c, 0.45 + 0.55 * edge);
    const h = (grain - 0.5) * 0.0018 + (fine - 0.5) * 0.001 - (1 - edge) * 0.006;
    return [c, 0.82 + 0.12 * fine, h];
  }, ({ color, rough, height, px, m }) => {
    // Äste
    for (let i = 0; i < 22; i++) {
      const p = planks[Math.floor(r() * planks.length)];
      const x = (r() - 0.5) * 8.6, z = mix(p.z0 + 0.15, p.z1 - 0.15, r()), w = (0.04 + r() * 0.06) * m;
      const g = color.createRadialGradient(px(x), px(z), 0, px(x), px(z), w * 2.2);
      g.addColorStop(0, 'rgba(60,45,35,0.95)'); g.addColorStop(0.35, 'rgba(95,75,60,0.7)'); g.addColorStop(1, 'rgba(95,75,60,0)');
      color.fillStyle = g; color.beginPath(); color.ellipse(px(x), px(z), w * 2.2, w * 1.1, 0, 0, 7); color.fill();
    }
    // Nägel über den Rundhölzern
    for (const p of planks) for (const lx of [-3.9, 0, 3.9]) for (const f of [0.28, 0.72]) {
      const z = mix(p.z0, p.z1, f), x = lx + (r() - 0.5) * 0.06;
      color.fillStyle = 'rgba(70,55,48,0.95)'; color.beginPath(); color.arc(px(x), px(z), 0.016 * m, 0, 7); color.fill();
      color.fillStyle = 'rgba(150,95,60,0.5)'; color.beginPath(); color.arc(px(x), px(z), 0.03 * m, 0, 7); color.fill();
    }
    // Eingebrannte Rasterlinien (Brandmalerei): Spalten quer über die Bohlen, Reihen auf den Fugen
    for (let k = 0; k <= 7; k++) {
      const p = -HB + k * CELL;
      for (const [w, a] of [[0.05, 0.25], [0.026, 0.8], [0.012, 0.9]]) {
        color.strokeStyle = `rgba(45,28,18,${a})`; color.lineWidth = w * m;
        color.beginPath(); color.moveTo(px(p), px(-HB)); color.lineTo(px(p), px(HB)); color.stroke();
      }
      height.strokeStyle = 'rgb(112,112,112)'; height.lineWidth = 0.02 * m;
      height.beginPath(); height.moveTo(px(p), px(-HB)); height.lineTo(px(p), px(HB)); height.stroke();
    }
  }, 0.00025);
  const wood = (c, rough = 0.85) => new T.MeshStandardMaterial({ color: c, roughness: rough, envMapIntensity: 1.1 });
  const grainTex = (() => {
    const c = L.canvas(512, 64), x = c.getContext('2d'), im = x.createImageData(512, 64);
    for (let j = 0; j < 64; j++) for (let i = 0; i < 512; i++) {
      const g = Math.sin((j * 0.7 + fbm(i * 0.01, j * 0.05, 3, 2) * 12) * 2.0) * 0.5 + 0.5, n = noise(i * 0.3, j * 2, 3);
      const v = 0.78 + 0.22 * (1 - g * 0.6 - n * 0.4);
      const k = (j * 512 + i) * 4; im.data[k] = 168 * v; im.data[k + 1] = 156 * v; im.data[k + 2] = 140 * v; im.data[k + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    const t = L.tex(c, true, true); t.repeat.set(3, 1); return t;
  })();
  const sideMat = L.sideMat(grainTex, { glow: 0.3 });
  const endMat = wood(0x8a7a66, 0.95);
  const topMat = L.withWave(new T.MeshStandardMaterial({ map: top.map, roughnessMap: top.rough, normalMap: top.normal, roughness: 1, envMapIntensity: 0.6 }), `
      {
        ${L.RING}
        // eingebrannte Linien glimmen auf wie Glut, wo die Welle vorbeizieht
        vec2 q = (vW.xz + ${HB.toFixed(3)}) / ${CELL.toFixed(3)};
        vec2 dq = abs(fract(q + 0.5) - 0.5) * ${CELL.toFixed(3)};
        float inside = step(abs(vW.x), ${(HB + 0.02).toFixed(3)}) * step(abs(vW.z), ${(HB + 0.02).toFixed(3)});
        float line = (1.0 - smoothstep(0.008, 0.03, min(dq.x, dq.y))) * inside;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 4.0), 2.0)) + trail * 0.15;
        gl_FragColor.rgb += vec3(1.6, 0.62, 0.16) * line * wide * min(1.0, uShock.y * 3.0) * 2.2;
        gl_FragColor.rgb += (uShockColor * 0.6 + vec3(0.25, 0.2, 0.12)) * ring * uShock.y * 0.9;
      }`);
  const g = new T.Group();
  for (const p of planks) {
    const len = p.xb - p.xa, wdt = p.z1 - p.z0 - GAP, cx = (p.xa + p.xb) / 2, cz = (p.z0 + p.z1) / 2;
    const geo = new T.BoxGeometry(len, TH, wdt);
    const uv = geo.attributes.uv, pos = geo.attributes.position;
    for (let i = 8; i < 12; i++) { // Oberseite: weltbezogen
      const wx = pos.getX(i) + cx, wz = pos.getZ(i) + cz;
      uv.setXY(i, (wx + HP) / PLATE, 1 - (wz + HP) / PLATE);
    }
    const mesh = new T.Mesh(geo, [endMat, endMat, topMat, sideMat, sideMat, sideMat]);
    mesh.position.set(cx, -TH / 2, cz);
    mesh.receiveShadow = true;
    g.add(mesh);
  }
  // Rundhölzer darunter
  const logMat = L.sideMat(grainTex, { glow: 0.22, extra: { color: 0xb8a890 } });
  for (const lx of [-3.9, 0, 3.9]) {
    const log = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, PLATE - 0.3, 18, 1), logMat);
    log.rotation.x = Math.PI / 2; log.position.set(lx, -TH - 0.19, 0); log.castShadow = log.receiveShadow = true;
    g.add(log);
  }
  // Licht aus den Fugen (Lichtwelle): leuchtende Fläche unter den Bohlen
  const glowMat = new T.ShaderMaterial({
    uniforms: { ...L.shock }, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uShock; uniform vec3 uShockColor; varying vec3 vW;
      void main(){ float sd = length(vW.xz); float ring = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
        gl_FragColor = vec4((vec3(1.4, 0.8, 0.35) + uShockColor) * ring * uShock.y * 2.5, 1.0); }`,
  });
  const glow = new T.Mesh(new T.PlaneGeometry(PLATE - 0.2, PLATE - 0.2), glowMat);
  glow.rotation.x = -Math.PI / 2; glow.position.y = -TH - 0.01;
  g.add(glow);
  // Tau: Einlegelinie um das Feld, Zurrungen an den Randbohlen
  const ropeMat = new T.MeshStandardMaterial({ color: 0xc9b48a, roughness: 0.95, envMapIntensity: 1.0 });
  const ropeTex = (() => {
    const c = L.canvas(64, 256), x = c.getContext('2d');
    x.fillStyle = '#d8c59c'; x.fillRect(0, 0, 64, 256);
    x.strokeStyle = 'rgba(90,70,40,0.75)'; x.lineWidth = 5;
    for (let i = -10; i < 20; i++) { x.beginPath(); x.moveTo(0, i * 16); x.lineTo(64, i * 16 + 40); x.stroke(); }
    const t = L.tex(c, true, true); t.repeat.set(1, 1); return t;
  })();
  ropeMat.map = ropeTex; ropeMat.color.set(0xffffff);
  const R = HB + 0.17, rr = 0.15;
  const pts = [];
  for (let s = 0; s < 4; s++) {
    const a0 = s * Math.PI / 2;
    for (let i = 0; i <= 8; i++) {
      const a = a0 + i / 8 * Math.PI / 2;
      const cx = (s === 0 || s === 3 ? 1 : -1) * (R - rr), cz = (s < 2 ? 1 : -1) * (R - rr);
      pts.push(new T.Vector3(cx + Math.cos(a) * rr, 0.022, cz + Math.sin(a) * rr));
    }
  }
  const ropeCurve = new T.CatmullRomCurve3(pts, true);
  const rope = new T.Mesh(new T.TubeGeometry(ropeCurve, 400, 0.024, 8, true), ropeMat);
  ropeTex.repeat.set(1, 140);
  rope.castShadow = true; rope.receiveShadow = true;
  g.add(rope);
  for (const pz of [-(HB + HP) / 2, (HB + HP) / 2]) for (const lx of [-3.9, 0, 3.9]) for (const dx of [-0.05, 0.05]) {
    const loop = [];
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      loop.push(new T.Vector3(lx + dx, -0.24 + Math.sin(a) * 0.27, pz + Math.cos(a) * 0.37));
    }
    const lash = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(loop, true), 48, 0.02, 6, true), ropeMat);
    lash.castShadow = true;
    g.add(lash);
  }
  D.scene.add(g);
  return 'Floss';
};
