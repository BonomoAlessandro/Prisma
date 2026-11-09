// 4 Muschelkalk mit Perlmutt: heller Schalenkalk, Feld geschliffen, Rand rau mit ganzen Muscheln; Raster und
// Einlegelinie aus Perlmutt
__katalog.varianten.muschelkalk = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng, parts } = L;
  const r = rng(21);
  const cream = [0.88, 0.80, 0.68], honey = [0.78, 0.64, 0.48], grey = [0.66, 0.62, 0.57];
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const field = 1 - smooth(HB + 0.08, HB + 0.3, box);
    const g = fbm(x * 0.6, z * 0.6, 5, 61), m2 = fbm(x * 3, z * 3, 3, 62), pore = noise(x * 90, z * 90, 63);
    let c = mix3(cream, honey, smooth(0.35, 0.75, g));
    c = mix3(c, grey, smooth(0.6, 0.85, m2) * 0.4);
    const hole = pore < 0.1 ? (1 - field * 0.7) : 0;
    c = mix3(c, [0.42, 0.34, 0.26], hole * 0.8);
    const rough = mix(0.92, 0.55 + 0.15 * m2, field);
    const h = mix((g - 0.5) * 0.012 + (m2 - 0.5) * 0.006, (m2 - 0.5) * 0.0008, field) - hole * 0.004;
    return [c, rough, h];
  }, ({ color, rough, height, px, m }) => {
    // Schalenbruch: Bögen (Querschnitte) überall, im Feld flach geschliffen
    for (let i = 0; i < 5200; i++) {
      const x = (r() * 2 - 1) * HP, z = (r() * 2 - 1) * HP;
      const box = Math.max(Math.abs(x), Math.abs(z)), inField = box < HB + 0.1;
      const rad = (0.012 + Math.pow(r(), 2) * 0.05) * m, a0 = r() * 6.3, span = 1 + r() * 1.8;
      const light = r() < 0.6;
      color.strokeStyle = light ? `rgba(250,240,222,${0.55 + r() * 0.4})` : `rgba(120,96,72,${0.35 + r() * 0.35})`;
      color.lineWidth = Math.max(1, rad * (0.12 + r() * 0.12));
      color.beginPath(); color.arc(px(x), px(z), rad, a0, a0 + span); color.stroke();
      if (!inField) {
        height.strokeStyle = 'rgba(160,160,160,0.7)'; height.lineWidth = color.lineWidth;
        height.beginPath(); height.arc(px(x), px(z), rad, a0, a0 + span); height.stroke();
      }
    }
    // ganze Muscheln (Herzmuscheln, Kammmuscheln) auf dem Rand, erhaben
    for (let i = 0; i < 260; i++) {
      let x, z;
      do { x = (r() * 2 - 1) * (HP - 0.05); z = (r() * 2 - 1) * (HP - 0.05); } while (Math.max(Math.abs(x), Math.abs(z)) < HB + 0.32);
      const rad = (0.03 + r() * 0.045) * m, rot = r() * 6.3, ribs = 9 + Math.floor(r() * 8);
      const tone = r();
      const base = tone < 0.5 ? [246, 234, 214] : tone < 0.8 ? [236, 196, 160] : [214, 170, 168];
      color.save(); color.translate(px(x), px(z)); color.rotate(rot);
      height.save(); height.translate(px(x), px(z)); height.rotate(rot);
      const fan = (ctx, fill) => { ctx.beginPath(); ctx.moveTo(0, rad * 0.35); ctx.arc(0, 0, rad, Math.PI * 1.1, Math.PI * 1.9); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
      fan(color, `rgb(${base.join(',')})`);
      const hg = height.createRadialGradient(0, rad * 0.35, 0, 0, 0, rad);
      hg.addColorStop(0, 'rgb(200,200,200)'); hg.addColorStop(1, 'rgb(150,150,150)');
      fan(height, hg);
      color.strokeStyle = 'rgba(150,110,80,0.55)'; color.lineWidth = Math.max(1, rad * 0.05);
      for (let k = 0; k <= ribs; k++) {
        const a = Math.PI * 1.1 + (k / ribs) * Math.PI * 0.8;
        color.beginPath(); color.moveTo(0, rad * 0.35); color.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); color.stroke();
      }
      color.restore(); height.restore();
    }
  }, 0.00025);

  // Perlmutt: Farbe kippt mit dem Blickwinkel und dem Ort
  const NACRE = (k) => `(vec3(0.80, 0.80, 0.82) + 0.22 * cos(6.2832 * (vec3(0.0, 0.33, 0.67) + ${k})))`;
  const view = 'dot(normalize(vNormal), normalize(vViewPosition)) * 2.2 + (vUv.x + vUv.y) * 3.0';
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.5,
    replace: [['float lw = 0.00458;', 'float lw = 0.0095;'], ['float iw = 0.011;', 'float iw = 0.03;']],
    groove: `diffuseColor.rgb = mix(diffuseColor.rgb, ${NACRE(view)}, floorGroove * 0.9);`,
    inlay: `diffuseColor.rgb = mix(diffuseColor.rgb, ${NACRE(view + ' + 0.25')}, floorInlay);`,
    grooveRough: 'roughnessFactor = mix(roughnessFactor, 0.12, floorGroove);',
    inlayRough: 'roughnessFactor = mix(roughnessFactor, 0.1, floorInlay);',
    bevel: 'diffuseColor.rgb *= 1.0 - floorBevel * 0.15;', bevelRough: '',
    refl: 0.36,
    // Lichtwelle: ein Schimmer in den Farben des Perlmutts zieht über den Stein, die Perlmuttlinien blitzen auf
    wave: `
        vec3 irid = 0.55 + 0.45 * cos(6.2832 * (vec3(0.0, 0.33, 0.67) + (sd - uShock.x) * 1.6 + vUv.x * 2.0));
        float band = exp(-pow((sd - uShock.x) / (uShock.z * 2.2), 2.0));
        gl_FragColor.rgb += irid * band * uShock.y * 0.9 + uShockColor * ring * uShock.y * 0.6;
        gl_FragColor.rgb += ${NACRE(view)} * max(floorGroove, floorInlay) * (band * 2.5 + trail * 0.6) * uShock.y * 1.4;`,
  });
  const side = L.sideTex(2048, 128, (u, v) => {
    const layer = fbm(u * 0.5, v * 7 + fbm(u, 0, 2, 64) * 2, 4, 65), bits = noise(u * 70, v * 20, 66);
    let c = mix3(cream, honey, smooth(0.3, 0.75, layer));
    c = mix3(c, bits > 0.75 ? [0.97, 0.94, 0.88] : bits < 0.12 ? [0.45, 0.37, 0.3] : c, 0.6);
    return mix3(c, [c[0] * 0.75, c[1] * 0.72, c[2] * 0.7], smooth(0.5, 1, v));
  });
  L.sides(L.sideMat(L.tex(side), { glow: 0.3 }));
  L.hide('plateTrim');
  return 'Muschelkalk';
};
