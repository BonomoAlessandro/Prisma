// D4 Yardang: ein Fels, den der Wind geformt hat. Runder Umriss, Oberseite glatt geschliffen mit Windrillen im Rand,
// darunter ein Kiel wie ein umgedrehter Bootsrumpf, die Flanken gerillt und gebändert wie «The Wave»
__katalog.varianten.yardang = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const W2 = __katalog.w2;
  const pts = W2.roundedSquare(4.88, 1.7, 180, (a) => (noise(Math.cos(a) * 3 + 4, Math.sin(a) * 3, 101) - 0.5) * 0.08);
  const apricot = [0.93, 0.66, 0.46], cream = [0.96, 0.84, 0.68], rose = [0.86, 0.56, 0.48], lilac = [0.66, 0.50, 0.58];
  const bands = (y, x, z) => {
    const w = y * 9 + fbm(x * 0.25, z * 0.25, 3, 102) * 3 + Math.sin(x * 0.6) * 0.6;
    const t = Math.sin(w) * 0.5 + 0.5, t2 = Math.sin(w * 2.3 + 1) * 0.5 + 0.5;
    let c = mix3(apricot, rose, smooth(0.35, 0.85, t));
    c = mix3(c, cream, smooth(0.7, 1, t2) * 0.6);
    return c;
  };
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const inF = 1 - smooth(HB + 0.05, HB + 0.25, box);
    // Wind von −x: Schliff längs x, im Rand tiefe Rillen
    const streak = noise(x * 1.2, z * 26, 103), groove = Math.pow(Math.abs(Math.sin(z * 34 + fbm(x * 0.4, z, 2, 104) * 5)), 6);
    let c = bands(fbm(x * 0.08, z * 0.08, 2, 105) * 0.8 + z * 0.04, x, z);
    c = mix3(c, mix3(c, cream, 0.5), inF * 0.45);       // Feld ruhiger und heller
    c = mix3(c, [c[0] * 0.92, c[1] * 0.9, c[2] * 0.9], streak * 0.35);
    c = mix3(c, [c[0] * 0.8, c[1] * 0.76, c[2] * 0.8], groove * (1 - inF) * 0.7);
    const h = (1 - inF) * (-groove * 0.004) + (streak - 0.5) * 0.0006;
    return [c, mix(0.85, 0.6, inF), h];
  }, ({ color, px }) => W2.clip(color, px, pts), 0.00025);
  D.floorMaterial.alphaTest = 0.5;
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 0.5,
    groove: 'diffuseColor.rgb *= 1.0 - floorGroove * 0.5;', inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.98, 0.9, 0.78), floorInlay);',
    bevel: '', bevelRough: '', refl: 0.12,
    // Lichtwelle als Böe: der Ring ist in Windrichtung gestreckt und zieht Streifen aus Licht hinter sich her
    wave: `
        vec2 wp = (vUv - 0.5) * ${PLATE.toFixed(3)};
        float sdw = length(vec2(wp.x * 0.72, wp.y));
        float gust = exp(-pow((sdw - uShock.x * 0.85) / (uShock.z * 2.2), 2.0));
        float lines = 0.4 + 0.6 * pow(fract(sin(floor(wp.y * 60.0) * 78.233) * 43758.5453), 3.0);
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.6 + vec3(0.6, 0.42, 0.25)) * gust * lines * k * 1.6;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // Kiel: Ringe vom Umriss nach unten; schmaler quer zum Wind (z) als längs (x), nach Lee (+x) verschoben, gerillt
  const prof = [[0, 1, 1, 0], [-0.08, 1, 1, 0], [-0.3, 0.985, 0.96, 0.05], [-0.6, 0.95, 0.84, 0.15], [-0.9, 0.88, 0.68, 0.3],
    [-1.2, 0.78, 0.5, 0.45], [-1.45, 0.64, 0.32, 0.6], [-1.65, 0.46, 0.17, 0.75], [-1.78, 0.28, 0.06, 0.85]];
  const rings = prof.map(([y, sx, sz, dx]) => [y, (x, z) => {
    const flute = 1 + Math.sin(y * 38 + x * 0.3) * 0.004 * (y < -0.1 ? 1 : 0);
    return [(x * sx + dx) * flute, z * sz * flute];
  }]);
  const hull = W2.hull(pts, rings, (y, x, z) => {
    const c = bands(y, x, z), sh = clamp(1 + y * 0.18); // nach unten etwas dunkler, ins Lila
    return mix3(c, lilac, 1 - sh);
  }, [0.9, -1.84, 0]);
  D.scene.add(hull);
  return 'Yardang';
};
