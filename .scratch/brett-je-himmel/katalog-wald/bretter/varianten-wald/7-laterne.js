// W7 Papierlaterne: das Brett ist eine flache Laterne aus Washi-Papier in einem Gitter aus dunklem Holz (Kumiko), das
// von innen warm leuchtet: eine Lichtinsel im dunklen Wald. Das Raster sind die Holzstäbe, im Rand liegt das Muster
// Asanoha (Hanfblatt), die Seiten sind Papierwände zwischen Pfosten. Lichtwelle: Fach für Fach flammt das Licht auf
__katalog.varianten.laterne = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const r = rng(801);
  const paper = [0.66, 0.58, 0.44], wood = '#2a1f17';
  const s = L.surface(2048, (x, z) => {
    // Washi: lange Fasern, leichte Wolken
    const fib = Math.pow(noise(x * 4 + noise(x * 30, z * 30, 802) * 2, z * 60, 803), 6), cloud = fbm(x * 1.8, z * 1.8, 4, 804);
    let c = mix3(paper, [0.6, 0.5, 0.36], cloud * 0.6);
    c = mix3(c, [0.78, 0.7, 0.56], fib * 0.6);
    return [c, 0.95, (fib - 0.3) * 0.0002, 1];
  }, ({ color: g, mask: mk, px, m }) => {
    const lineAll = (draw, w) => {
      for (const [ctx, col] of [[g, wood], [mk, '#000']]) { ctx.strokeStyle = col; ctx.lineWidth = w * m; ctx.lineCap = 'square'; ctx.beginPath(); draw(ctx); ctx.stroke(); }
    };
    // Rahmen: aussen breit, innen schmal
    const frame = (o, i) => { for (const [ctx, col] of [[g, wood], [mk, '#000']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.rect(px(-o), px(-o), 2 * o * m, 2 * o * m); ctx.rect(px(i), px(-i), -2 * i * m, 2 * i * m); ctx.fill('evenodd'); } };
    frame(HP, HP - 0.12); frame(HB + 0.06, HB);
    // Asanoha im Rand: Raster aus gleichseitigen Dreiecken, in jedem ein Stern aus sechs Linien
    const A = 0.2, H = A * Math.sqrt(3) / 2;
    g.save(); mk.save();
    for (const ctx of [g, mk]) { ctx.beginPath(); ctx.rect(px(-HP), px(-HP), PLATE * m, PLATE * m); ctx.rect(px(HB + 0.06), px(-HB - 0.06), -2 * (HB + 0.06) * m, 2 * (HB + 0.06) * m); ctx.clip('evenodd'); }
    lineAll((ctx) => {
      for (let j = -30; j <= 30; j++) for (let i = -30; i <= 30; i++) {
        const x0 = i * A + (j % 2) * A / 2, z0 = j * H;
        if (Math.max(Math.abs(x0), Math.abs(z0)) < HB - 0.3 || Math.max(Math.abs(x0), Math.abs(z0)) > HP + 0.3) continue;
        // zwei Dreiecke (oben/unten) mit Mittelpunkten; Linien von den Ecken zum Mittelpunkt
        const tris = [[[x0, z0], [x0 + A, z0], [x0 + A / 2, z0 + H]], [[x0 + A / 2, z0 + H], [x0 + A, z0], [x0 + 1.5 * A, z0 + H]]];
        for (const t of tris) {
          const cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cz = (t[0][1] + t[1][1] + t[2][1]) / 3;
          ctx.moveTo(px(t[0][0]), px(t[0][1])); ctx.lineTo(px(t[1][0]), px(t[1][1])); ctx.lineTo(px(t[2][0]), px(t[2][1])); ctx.lineTo(px(t[0][0]), px(t[0][1]));
          for (const p of t) { ctx.moveTo(px(p[0]), px(p[1])); ctx.lineTo(px(cx), px(cz)); }
        }
      }
    }, 0.011);
    g.restore(); mk.restore();
  }, 0.0003);
  // Leuchten von innen: Papier (Maske) ohne die Holzstäbe des Rasters; Lichtwelle: jedes Fach flammt auf, wenn der
  // Ring seine Mitte erreicht
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.3,
    groove: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.17, 0.12, 0.09), floorGroove);',
    replace: [['float lw = 0.00458;', 'float lw = 0.0145;']],
    inlay: '', inlayRough: '', bevel: '', bevelRough: '', refl: 0.0,
    decl: 'uniform sampler2D uPaper;', uniforms: { uPaper: { value: s.mask } },
    after: `
      {
        float pm = texture2D(uPaper, vUv).r * (1.0 - floorGroove);
        vec2 pp2 = (vUv - 0.5) * ${PLATE.toFixed(4)};
        float glowIn = 0.55 + 0.1 * sin(pp2.x * 0.7 + pp2.y * 0.9);
        vec2 cellC = (floor((pp2 + ${HB.toFixed(4)}) / ${CELL.toFixed(4)}) + 0.5) * ${CELL.toFixed(4)} - ${HB.toFixed(4)};
        float inBoard = step(max(abs(pp2.x), abs(pp2.y)), ${HB.toFixed(4)});
        float dc = mix(length(pp2), length(cellC), inBoard);
        float flare = uShock.y > 0.0 ? exp(-pow((dc - uShock.x) / 0.6, 2.0)) * min(1.0, uShock.y * 3.0) : 0.0;
        float after = uShock.y > 0.0 ? (1.0 - smoothstep(uShock.x - 0.6, uShock.x, dc)) * 0.25 * min(1.0, uShock.y * 3.0) : 0.0;
        gl_FragColor.rgb += vec3(0.5, 0.3, 0.1) * pm * glowIn;
        gl_FragColor.rgb += (vec3(0.55, 0.3, 0.08) + uShockColor * 0.12) * pm * (flare + after);
      }`,
    wave: '',
  });
  // Seiten: Papierwände zwischen Pfosten (alle 1.2 m) und Querstab, leuchten selbst
  const sc = L.canvas(4096, 160), sx = sc.getContext('2d'), mpx = 4096 / PLATE;
  const grd = sx.createLinearGradient(0, 0, 0, 160); grd.addColorStop(0, '#f2d9a6'); grd.addColorStop(1, '#d6ac6a');
  sx.fillStyle = grd; sx.fillRect(0, 0, 4096, 160);
  for (let i = 0; i < 400; i++) { sx.strokeStyle = `rgba(255,245,220,${0.15 + r() * 0.2})`; sx.lineWidth = 1; sx.beginPath(); const u = r() * 4096, v = r() * 160; sx.moveTo(u, v); sx.lineTo(u + 20 + r() * 60, v + (r() - 0.5) * 6); sx.stroke(); }
  sx.fillStyle = wood; sx.fillRect(0, 0, 4096, 14); sx.fillRect(0, 146, 4096, 14); sx.fillRect(0, 74, 4096, 6);
  for (let k = 0; k <= 8; k++) { const u = (0.7 + k * CELL) * mpx; sx.fillRect(u - 7, 0, 14, 160); }
  sx.fillRect(0, 0, 0.12 * mpx, 160); sx.fillRect(4096 - 0.12 * mpx, 0, 0.12 * mpx, 160);
  const st = L.tex(sc);
  L.sides(new T.MeshStandardMaterial({ map: st, roughness: 0.95, emissiveMap: st, emissive: new T.Color(0.62, 0.5, 0.36), envMapIntensity: 0.4 }));
  L.hide('plateTrim');
  return 'Papierlaterne';
};
