// 1 Sandbank: nasser, glattgestrichener Sand im Feld, Rippeln auf dem Rand, Rasterlinien als gezogene Rillen
__katalog.varianten.sand = async (L) => {
  const { T, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng, parts } = L;
  const dry = [0.95, 0.76, 0.58], damp = [0.80, 0.61, 0.46], wet = [0.62, 0.47, 0.36], dark = [0.45, 0.35, 0.30];
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const inField = 1 - smooth(HB + 0.02, HB + 0.22, box);
    const g = fbm(x * 0.9, z * 0.9, 4, 3), grain = noise(x * 260, z * 260, 9);
    // Rippeln: Kämme quer zur Strömung, mit Verwerfung
    const w = (x * 0.82 + z * 0.57) / 0.24 + fbm(x * 0.3, z * 0.3, 3, 5) * 10 + noise(x * 1.6, z * 1.6, 8) * 1.4;
    const ph = w - Math.floor(w);
    const rip = Math.pow(Math.sin(Math.PI * ph), 1.5) - 0.6 * (ph > 0.65 ? (ph - 0.65) / 0.35 : 0);
    const trough = smooth(0.5, 0.05, Math.sin(Math.PI * ph));
    let c = mix3(dry, damp, 0.35 + 0.4 * g);
    c = mix3(c, dark, trough * 0.06);
    // Feld: feuchter, glatt gestrichen; wenig Korn
    const cf = mix3(damp, wet, 0.1 + 0.8 * smooth(0.3, 0.7, fbm(x * 0.28, z * 0.28, 4, 11)));
    c = mix3(c, cf, inField);
    const sp = noise(x * 520, z * 520, 12);
    const k = 0.9 + 0.2 * grain;
    c = [c[0] * k, c[1] * k, c[2] * k];
    if (sp > 0.9) c = mix3(c, [1, 0.97, 0.92], 0.5); else if (sp < 0.08) c = mix3(c, [0.25, 0.2, 0.2], 0.45);
    const glint = noise(x * 400, z * 400, 2) > 0.93 ? 0.25 : 1;
    const rough = mix(0.95, (0.16 + 0.4 * smooth(0.3, 0.7, fbm(x * 0.28, z * 0.28, 4, 11))) * glint, inField);
    const h = mix(rip * 0.012, (g - 0.5) * 0.0015 + (grain - 0.5) * 0.0004, inField) + (grain - 0.5) * 0.0006;
    return [c, rough, h];
  }, ({ color, rough, height, px, m }) => {
    // Rasterlinien: mit dem Finger gezogene Rillen (dunkler, feuchter, Rand leicht aufgeworfen)
    const r = rng(4);
    for (let k = 0; k <= 7; k++) {
      const p = -HB + k * CELL;
      for (const vert of [true, false]) {
        const seg = 48;
        for (const [ctx, style, width] of [[height, 'rgb(100,100,100)', 0.022], [color, 'rgba(70,50,34,0.55)', 0.022], [rough, 'rgb(80,80,80)', 0.024]]) {
          ctx.strokeStyle = style; ctx.lineWidth = width * m; ctx.lineCap = 'round';
          ctx.beginPath();
          for (let i = 0; i <= seg; i++) {
            const a = -HB + (i / seg) * 2 * HB, j = Math.sin(i * 1.7 + k * 3.1) * 0.003;
            const X = vert ? p + j : a, Z = vert ? a : p + j;
            i ? ctx.lineTo(px(X), px(Z)) : ctx.moveTo(px(X), px(Z));
          }
          ctx.stroke();
        }
      }
    }
    // Einlegelinie: eine Reihe Muschelsplitter
    const ring = HB + 0.16;
    for (let side = 0; side < 4; side++) {
      for (let t = -ring; t < ring; t += 0.028 + r() * 0.03) {
        const along = t, off = (r() - 0.5) * 0.03;
        let X, Z;
        if (side === 0) { X = along; Z = -ring + off; } else if (side === 1) { X = ring + off; Z = along; }
        else if (side === 2) { X = -along; Z = ring + off; } else { X = -ring + off; Z = -along; }
        const sz = (0.012 + r() * 0.02) * m, rot = r() * Math.PI;
        const tint = r();
        color.fillStyle = tint < 0.6 ? `rgb(${236 + r() * 15},${222 + r() * 20},${205 + r() * 25})` : tint < 0.85 ? `rgb(${226},${170 + r() * 30},${150 + r() * 30})` : 'rgb(120,110,120)';
        color.beginPath(); color.ellipse(px(X), px(Z), sz, sz * (0.45 + r() * 0.4), rot, 0, Math.PI * 2); color.fill();
        height.fillStyle = 'rgb(140,140,140)';
        height.beginPath(); height.ellipse(px(X), px(Z), sz, sz * 0.6, rot, 0, Math.PI * 2); height.fill();
        rough.fillStyle = 'rgb(110,110,110)';
        rough.beginPath(); rough.ellipse(px(X), px(Z), sz, sz * 0.6, rot, 0, Math.PI * 2); rough.fill();
      }
    }
  }, 0.00025);

  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.35,
    groove: '', inlay: '', bevel: 'diffuseColor.rgb *= 1.0 - floorBevel * 0.25;', bevelRough: '', grooveRough: '', inlayRough: '',
    refl: 0.6,
    // Lichtwelle: ein Saum aus Schaum läuft über den Sand, dahinter bleibt der Sand nass und dunkel (trocknet nach)
    wave: `
        float grainN = fract(sin(dot(floor(vUv * 1400.0), vec2(12.9898, 78.233))) * 43758.5453);
        float front = exp(-pow((sd - uShock.x) / (uShock.z * 0.8), 2.0));
        float wetB = smoothstep(uShock.x - 2.2, uShock.x - 0.05, sd) * (1.0 - smoothstep(uShock.x - 0.05, uShock.x + 0.05, sd));
        gl_FragColor.rgb *= 1.0 - 0.42 * wetB * min(1.0, uShock.y * 2.5);
        gl_FragColor.rgb += vec3(0.20, 0.27, 0.30) * wetB * 0.18 * min(1.0, uShock.y * 2.5);
        gl_FragColor.rgb += (uShockColor * 0.8 + vec3(0.55, 0.53, 0.48)) * front * (0.55 + 0.45 * grainN) * uShock.y * 1.6;`,
  });

  // Seiten: abgestochener, geschichteter Sand (unten feuchter)
  const side = L.sideTex(2048, 96, (u, v) => {
    const layer = fbm(u * 0.4, v * 9 + fbm(u * 0.8, 0, 2, 2) * 2, 3, 21);
    let c = mix3([0.86, 0.66, 0.50], [0.66, 0.50, 0.37], layer);
    c = mix3(c, [0.45, 0.34, 0.27], smooth(0.6, 1.0, v));
    const gr = 0.9 + 0.2 * noise(u * 300, v * 40, 4);
    return [c[0] * gr, c[1] * gr, c[2] * gr];
  });
  L.sides(L.sideMat(L.tex(side), { roughness: 0.95 }));
  L.hide('plateTrim');
  return 'Sandbank';
};
