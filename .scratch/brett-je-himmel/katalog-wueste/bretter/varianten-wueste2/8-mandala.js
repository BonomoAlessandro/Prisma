// D8 Sandmandala, gemalt: das Feld glatter, feiner Sand in den weichen Tönen der Dünen, im Rand ein Mandala aus
// farbigem Sand (Bänder, Blütenblätter, Tore in der Mitte jeder Seite), Seiten wie eine gemalte Düne von Apricot zu
// Rosa-Lila mit einer dunklen Tuschelinie oben. Die Lichtwelle fegt das Mandala: Die Farben leuchten auf und verwehen
__katalog.varianten.mandala = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const W2 = __katalog.w2, r = rng(141);
  const sand = [0.96, 0.80, 0.62], lilac = [0.78, 0.62, 0.70];
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    // gemalter Verlauf: zur Kante hin rosa-lila wie die Schattenseiten der Dünen
    const g = fbm(x * 0.2, z * 0.2, 3, 142);
    let c = mix3(sand, [0.98, 0.86, 0.70], smooth(0.4, 0.7, g) * 0.6);
    c = mix3(c, lilac, smooth(HB - 1.2, HB + 0.1, box) * 0.25);
    const k = 0.95 + 0.1 * noise(x * 400, z * 400, 143); // Korn
    return [[c[0] * k, c[1] * k, c[2] * k], 0.97, 0];
  }, ({ color: g, px, m }) => {
    const grain = (col) => col; // Farben als Sand: Körnung kommt unten
    const frame = (o, i, col) => { g.fillStyle = col; g.beginPath(); g.rect(px(-o), px(-o), 2 * o * m, 2 * o * m); g.rect(px(-i), px(-i), 2 * i * m, 2 * i * m); g.fill('evenodd'); };
    const R0 = HB + 0.24;
    frame(HP - 0.02, HP - 0.1, '#2f7f86');      // Türkis aussen
    frame(HP - 0.1, HP - 0.14, '#f2e6cf');
    frame(HP - 0.14, HP - 0.36, '#e3a45a');     // Safran mit Dreiecken
    frame(HP - 0.36, HP - 0.4, '#f2e6cf');
    frame(HP - 0.4, R0, '#c9707a');             // Rosa mit Blütenblättern
    // Dreiecke im Safranband
    g.fillStyle = '#b4513f';
    const along = (o, step, draw) => { for (let t = -o + step / 2; t < o; t += step) for (const s of [[t, -1], [t, 1], [-1, t], [1, t]]) draw(s); };
    const tri = (cx, cz, rot, size) => {
      g.save(); g.translate(px(cx), px(cz)); g.rotate(rot); g.beginPath(); g.moveTo(-size * m, size * 0.6 * m); g.lineTo(size * m, size * 0.6 * m); g.lineTo(0, -size * 0.8 * m); g.closePath(); g.fill(); g.restore();
    };
    const c1 = HP - 0.25;
    along(c1, 0.2, ([a, b]) => {
      if (b === -1 || b === 1) tri(a, b * c1, b === 1 ? 0 : Math.PI, 0.07); else tri(a * c1, b, a === 1 ? -Math.PI / 2 : Math.PI / 2, 0.07);
    });
    // Blütenblätter im rosa Band
    const c2 = (HP - 0.4 + R0) / 2;
    g.fillStyle = '#f6d9c4';
    along(c2, 0.16, ([a, b]) => {
      const [cx, cz] = (b === -1 || b === 1) ? [a, b * c2] : [a * c2, b];
      g.beginPath(); g.ellipse(px(cx), px(cz), 0.055 * m, 0.03 * m, (b === -1 || b === 1) ? 0 : Math.PI / 2, 0, 7); g.fill();
    });
    g.fillStyle = '#7a4a8a';
    along(c2, 0.16, ([a, b]) => { const [cx, cz] = (b === -1 || b === 1) ? [a, b * c2] : [a * c2, b]; g.beginPath(); g.arc(px(cx), px(cz), 0.012 * m, 0, 7); g.fill(); });
    // Tore in der Mitte jeder Seite (T-förmig, Türkis mit Gold)
    for (const [sx, sz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      g.save(); g.translate(px(sx * (HP - 0.3)), px(sz * (HP - 0.3)));
      g.rotate(Math.atan2(sz, sx) + Math.PI / 2);
      g.fillStyle = '#2f7f86'; g.fillRect(-0.45 * m, -0.18 * m, 0.9 * m, 0.36 * m);
      g.fillStyle = '#f0c35a'; g.fillRect(-0.3 * m, -0.1 * m, 0.6 * m, 0.2 * m);
      g.fillStyle = '#2f7f86'; g.fillRect(-0.12 * m, -0.05 * m, 0.24 * m, 0.25 * m);
      g.restore();
    }
    // Raster: dünne Linien aus rosabraunem Sand, leicht gestreut
    g.fillStyle = 'rgba(150,80,90,0.8)';
    for (let k = 0; k <= 7; k++) {
      const p = -HB + k * CELL;
      for (let t = -HB; t < HB; t += 0.004) {
        const j = (r() - 0.5) * 0.006;
        g.fillRect(px(p + j) - 0.006 * m, px(t), 0.012 * m, 0.005 * m);
        g.fillRect(px(t), px(p + j) - 0.006 * m, 0.005 * m, 0.012 * m);
      }
    }
    // Einlegelinie: Linie aus weissem Sand
    const iw = HB + 0.15; g.strokeStyle = 'rgba(250,244,232,0.95)'; g.lineWidth = 0.025 * m; g.strokeRect(px(-iw), px(-iw), 2 * iw * m, 2 * iw * m);
    // Körnung über alles (farbiger Sand)
    const im = g.getImageData(0, 0, g.canvas.width, g.canvas.height);
    for (let i = 0; i < im.data.length; i += 4) { const k = 0.9 + Math.random() * 0.2; im.data[i] *= k; im.data[i + 1] *= k; im.data[i + 2] *= k; }
    g.putImageData(im, 0, 0);
    // Tuschelinie an der Kante (Moebius)
    g.strokeStyle = 'rgba(70,40,50,0.9)'; g.lineWidth = 0.02 * m; g.strokeRect(px(-HP) + 0.01 * m, px(-HP) + 0.01 * m, (PLATE - 0.02) * m, (PLATE - 0.02) * m);
  });
  const rimMask = W2.mask(512, (x, px, m) => { x.fillStyle = '#fff'; x.fillRect(0, 0, 512, 512); x.fillStyle = '#000'; const w = HB + 0.22; x.fillRect(px(-w), px(-w), 2 * w * m, 2 * w * m); });
  L.floor({
    map: s.map, rough: s.rough, normal: null, roughness: 1, envMapIntensity: 0.3,
    groove: '', inlay: '', bevel: '', grooveRough: '', inlayRough: '', bevelRough: '', refl: 0.0,
    decl: 'uniform sampler2D uRim;', uniforms: { uRim: { value: rimMask } },
    // Lichtwelle: die Sandfarben leuchten im Ring auf; dahinter verweht das Mandala zu blassem Sand
    wave: `
        float rimK = texture2D(uRim, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        float glint = step(0.92, fract(sin(dot(floor(vUv * 1800.0), vec2(12.9898, 78.233))) * 43758.5453));
        float swept = step(sd, uShock.x - 0.4) * rimK;
        vec3 plain = vec3(dot(gl_FragColor.rgb, vec3(0.33))) * vec3(1.08, 0.95, 0.85);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, plain, swept * 0.7 * k);
        gl_FragColor.rgb += gl_FragColor.rgb * wide * k * 1.2 + vec3(1.5, 1.2, 0.8) * glint * wide * k * 1.5;`,
  });
  // Seiten: gemalte Düne, Apricot oben, Rosa, Lila unten; Tuschelinie oben
  const side = L.sideTex(512, 128, (u, v) => {
    const t = Math.round(clamp(v + (fbm(u * 0.6, 0, 2, 144) - 0.5) * 0.25) * 4) / 4; // wenige Töne
    let c = mix3([0.97, 0.72, 0.52], [0.86, 0.56, 0.56], clamp(t * 1.6));
    c = mix3(c, [0.62, 0.48, 0.62], smooth(0.5, 1, t));
    return mix3(c, [0.28, 0.16, 0.2], v < 0.035 ? 1 : 0);
  });
  L.sides(L.sideMat(L.tex(side), { glow: 0.5, roughness: 1 }));
  L.hide('plateTrim');
  return 'Sandmandala';
};
