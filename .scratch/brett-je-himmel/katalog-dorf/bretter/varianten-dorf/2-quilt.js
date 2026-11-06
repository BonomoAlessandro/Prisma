// V2 Flickendecke: das Brett ist Noas Quilt, über einen Kasten gelegt. 49 Flicken in Rauten-Ringen um die Mitte
// (wie «Sunshine and Shadow» der Amish), das Raster sind die Nähte mit hellem Zierstich; schmale innere Borte statt
// Einlegelinie, breite dunkle Aussenborte mit gestepptem Kordelmuster, Einfassung; der Stoff fällt in Falten über die
// Seiten. Lichtwelle: wie die Taschenlampe unter der Decke, die Flicken leuchten in ihrer Farbe durch.
__katalog.varianten.quilt = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.dorf, W2 = __katalog.w2;
  const HQ = 4.8, IB = HB + 0.14, BIND = HQ - 0.06;
  // Farben verblichen und gedämpft (Mondlicht): zur Hälfte ins warme Grau gemischt
  const grey = [0.33, 0.31, 0.29];
  const pal = [[0.62, 0.50, 0.30], [0.46, 0.24, 0.25], [0.24, 0.37, 0.38], [0.38, 0.29, 0.42], [0.52, 0.34, 0.24], [0.28, 0.33, 0.46], [0.36, 0.40, 0.26]]
    .map((c) => mix3(c, grey, 0.42).map((v) => v * 0.9));
  const indigo = [0.16, 0.19, 0.27], wine = [0.42, 0.22, 0.23], rust = [0.47, 0.30, 0.22];
  const outline = W2.roundedSquare(HQ, 0.14, 200);
  const s = L.surface(2048, (x, z) => {
    const ax = Math.abs(x), az = Math.abs(z), box = Math.max(ax, az);
    const weave = (Math.sin(x * 900) * Math.sin(z * 900)) * 0.025 + (noise(x * 120, z * 120, 222) - 0.5) * 0.06;
    let c, h = 0;
    if (box < HB) {
      const i = Math.floor((x + HB) / CELL), j = Math.floor((z + HB) / CELL), d = Math.abs(i - 3) + Math.abs(j - 3);
      const fx = (x + HB) / CELL - i, fz = (z + HB) / CELL - j;
      c = pal[d].map((v) => v * (1 + (noise(i * 3.1, j * 7.7, 223) - 0.5) * 0.12)); // Stoff je Flicken etwas anders
      // Stoffmuster je Flicken: uni, Streublümchen, Vichy, feine Streifen (leise)
      const kind = Math.floor(noise(i * 9.7, j * 1.3, 225) * 4);
      let pat = 0;
      if (kind === 1) { const u = (x / 0.07) % 1, v = (z / 0.07) % 1, o = Math.floor(z / 0.07) % 2 ? 0.5 : 0; pat = Math.hypot(((u + o + 1) % 1) - 0.5, ((v + 1) % 1) - 0.5) < 0.17 ? 1 : 0; }
      else if (kind === 2) { const a = Math.abs(((x / 0.09) % 1 + 1) % 1 - 0.5) < 0.25, b = Math.abs(((z / 0.09) % 1 + 1) % 1 - 0.5) < 0.25; pat = (a ? 0.5 : 0) + (b ? 0.5 : 0); }
      else if (kind === 3) pat = Math.abs(((x / 0.05) % 1 + 1) % 1 - 0.5) < 0.12 ? 1 : 0;
      c = c.map((v) => v * (1 + pat * 0.22));
      // gesteppt: Kissen je Flicken, dazu diagonale Steppnähte
      const pil = (1 - Math.pow(Math.abs(fx - 0.5) * 2, 3)) * (1 - Math.pow(Math.abs(fz - 0.5) * 2, 3));
      const q = Math.abs(((x + z) / 0.3) % 1 + 1) % 1, st = smooth(0.05, 0.0, Math.min(q, 1 - q));
      h = pil * 0.012 - st * 0.004 * pil;
      c = c.map((v) => v * (1 - st * 0.18 * pil + (pil - 0.6) * 0.12));
      const seam = Math.min(fx, 1 - fx, fz, 1 - fz) * CELL;
      h -= smooth(0.05, 0.0, seam) * 0.006;
      if (seam < 0.006) c = c.map((v) => v * 0.55);
    } else if (box < IB) {
      // innere Borte (Weinrot), leicht gepolstert
      c = wine; h = 0.002 * Math.sin((box - HB) / (IB - HB) * Math.PI);
      if (box - HB < 0.006 || IB - box < 0.006) { c = wine.map((v) => v * 0.55); h = -0.002; }
    } else if (box < BIND) {
      // Aussenborte: dunkles Indigo, gestepptes Kordelmuster (zwei verschlungene Wellen) und Rautengitter
      const along = ax > az ? z : x, t = (box - IB) / (BIND - IB);
      c = indigo;
      const w1 = Math.abs(t - 0.5 - 0.3 * Math.sin(along * 7)), w2 = Math.abs(t - 0.5 + 0.3 * Math.sin(along * 7));
      const cord = smooth(0.035, 0.0, Math.min(w1, w2));
      const dg = Math.abs(((along + box) / 0.12) % 1 + 1) % 1, dg2 = Math.abs(((along - box) / 0.12) % 1 + 1) % 1;
      const grid = smooth(0.08, 0.0, Math.min(dg, 1 - dg, dg2, 1 - dg2)) * (cord > 0.1 ? 0 : 1) * smooth(0.12, 0.2, Math.abs(t - 0.5) + 0.1);
      h = 0.003 * Math.sin(t * Math.PI) - cord * 0.002 - grid * 0.0012;
      c = c.map((v) => v * (1 + cord * 0.35 - grid * 0.1));
    } else {
      c = rust; h = 0.002; // Einfassung
    }
    c = c.map((v) => clamp(v * (1 + weave)));
    return [c, 0.95, h];
  }, ({ color: g, px, m }) => {
    // Zierstich (Vorstich) in hellem Garn auf den Nähten
    g.strokeStyle = 'rgba(232,220,196,0.85)'; g.lineWidth = 0.009 * m; g.setLineDash([0.035 * m, 0.022 * m]);
    for (let k = 0; k <= 7; k++) {
      const p = -HB + k * CELL;
      g.beginPath(); g.moveTo(px(p), px(-HB)); g.lineTo(px(p), px(HB)); g.stroke();
      g.beginPath(); g.moveTo(px(-HB), px(p)); g.lineTo(px(HB), px(p)); g.stroke();
    }
    g.setLineDash([]);
    W2.clip(g, px, outline);
  }, 0.00025);
  D.floorMaterial.alphaTest = 0.5;
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 2.4, roughness: 1, envMapIntensity: 0.3,
    groove: '', inlay: '', bevel: '', grooveRough: '', inlayRough: '', bevelRough: '', refl: 0.0,
    // Lichtwelle: Licht scheint von unten durch den Stoff, die Flicken leuchten in ihrer eigenen Farbe
    wave: `
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.5), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        vec3 through = diffuseColor.rgb * vec3(2.6, 2.1, 1.5) + vec3(0.05, 0.04, 0.02);
        gl_FragColor.rgb += through * (wide * 1.6 + trail * 10.0) * k;
        gl_FragColor.rgb += (uShockColor * 0.4 + vec3(0.3, 0.24, 0.15)) * ring * k * 0.5;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // Kasten unter der Decke (dunkel, damit zwischen den Falten nichts durchscheint)
  D.scene.add(V.box(4.55, -0.02, 0.5, new T.MeshStandardMaterial({ color: 0x0c0d12, roughness: 1 })));
  // Fall des Stoffs: Ringe vom Umriss nach unten; Falten wachsen nach unten, die Ecken hängen tiefer
  const cornerN = (x0, z0) => {
    const cx = clamp(x0, -(HQ - 0.14), HQ - 0.14), cz = clamp(z0, -(HQ - 0.14), HQ - 0.14), l = Math.hypot(x0 - cx, z0 - cz) || 1;
    return [(x0 - cx) / l, (z0 - cz) / l];
  };
  const drop = [[0, 0, 0], [-0.02, 0.03, 0], [-0.06, 0.045, 0.2], [-0.14, 0.05, 0.5], [-0.26, 0.05, 0.75], [-0.4, 0.05, 1], [-0.5, 0.045, 1], [-0.52, 0.03, 1]];
  const rings = drop.map(([y, out, amp]) => [y, (x0, z0) => {
    const [nx, nz] = cornerN(x0, z0), along = Math.abs(x0) > Math.abs(z0) ? z0 : x0;
    const corner = smooth(3.4, 4.75, Math.min(Math.abs(x0), Math.abs(z0)));
    const fold = Math.sin(along * 4.1 + Math.abs(x0) * 0.7) * 0.045 * amp * (1 - corner * 0.5) + Math.sin(along * 9.3) * 0.012 * amp;
    const o = out + fold;
    return [x0 + nx * o, z0 + nz * o, -corner * amp * 0.24 + (Math.sin(along * 3.1) * 0.03 * amp)];
  }]);
  const pts = W2.roundedSquare(HQ, 0.14, 480);
  void pts;
  const hull = V.hullSmooth(W2.roundedSquare(HQ, 0.14, 480), rings, (y, x, z, k) => (k >= rings.length - 2 || k === 0 ? rust : indigo).map((v) => v * (1 + (noise(x * 2, z * 2, 224) - 0.5) * 0.2)), 0.22);
  hull.material.envMapIntensity = 0.25;
  D.scene.add(hull);
  return 'Flickendecke';
};
