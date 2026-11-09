// D7 Meteoreisen: das Brett ist eine geätzte Scheibe aus einem Eisenmeteoriten (Gibeon). Im Feld das Widmanstätten-
// Muster, ruhig; der Rand ist Schmelzkruste mit Daumendellen und Rost. Die Lichtwelle ist eine Hitzefront, hinter der
// das Eisen in Anlauffarben steht (Strohgelb, Bronze, Violett, Blau)
__katalog.varianten.meteor = async (L) => {
  const { T, D, PLATE, HB, HP, CELL, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const W2 = __katalog.w2;
  const dirs = [0, Math.PI / 3, 2 * Math.PI / 3];
  const lam = (x, z) => {
    // Kristallbereiche (grosse Zellen) mit eigener Drehung; drei Lamellenscharen unter 60°
    const [, id] = W2.cells(x, z, 2.2, 131);
    const rot = ((id * 0.618) % 1) * Math.PI;
    let best = 0, thin = 0;
    for (const d of dirs) {
      const a = d + rot, u = x * Math.cos(a) + z * Math.sin(a), v = -x * Math.sin(a) + z * Math.cos(a);
      const w = u / 0.09 + fbm(v * 0.3, u * 0.3, 2, 132) * 1.5;
      const seg = noise(Math.floor(w), v * 0.8, 133); // Lamellen brechen ab
      const band = Math.abs(Math.sin(w * Math.PI));
      if (seg > 0.45) best = Math.max(best, smooth(0.55, 0.8, band));
      thin = Math.max(thin, smooth(0.985, 1, band) * (seg > 0.45 ? 1 : 0));
    }
    return [best, thin];
  };
  const s = L.surface(1536, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const inF = 1 - smooth(HB + 0.1, HB + 0.32, box);
    const [b, thin] = box < HB + 0.36 ? lam(x, z) : [0, 0];
    let c = mix3([0.56, 0.56, 0.58], [0.74, 0.74, 0.76], b * (0.4 + 0.6 * (1 - inF * 0.5)));
    c = mix3(c, [0.86, 0.86, 0.88], thin * 0.7);
    // Rand: Schmelzkruste, Daumendellen (Regmaglypten), Rost
    const [e] = box > HB + 0.2 ? W2.cells(x, z, 0.22, 134) : [0.1], dent = smooth(0.0, 0.08, e);
    const rust = smooth(0.55, 0.75, fbm(x * 1.4, z * 1.4, 4, 135));
    let crust = mix3([0.16, 0.13, 0.12], [0.26, 0.20, 0.17], dent);
    crust = mix3(crust, [0.55, 0.30, 0.14], rust * 0.8);
    const edge = smooth(HB + 0.22, HB + 0.34, box);
    c = mix3(c, crust, edge);
    const h = edge * (dent * 0.008) + (1 - edge) * b * 0.0004;
    return [c, mix(0.32 - b * 0.08, 0.8, edge), h];
  }, null, 0.00025);
  // Metall nur im Feld (metalnessMap liest den Blaukanal)
  const met = W2.mask(512, (x, px, m) => {
    x.fillStyle = '#fff'; const w = HB + 0.28; x.fillRect(px(-w), px(-w), 2 * w * m, 2 * w * m);
  });
  const fm = D.floorMaterial;
  fm.metalnessMap = met; fm.metalness = 0.9;
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 1.2,
    groove: 'diffuseColor.rgb *= 1.0 - floorGroove * 0.6;', inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95), floorInlay);',
    inlayRough: 'roughnessFactor = mix(roughnessFactor, 0.1, floorInlay);', bevel: '', bevelRough: '', refl: 0.6,
    // Lichtwelle: Hitzefront; dahinter Anlauffarben, die mit dem Abstand verblassen
    wave: `
        float behind = clamp((uShock.x - sd) / 2.6, 0.0, 1.0);
        float k = min(1.0, uShock.y * 3.0);
        vec3 temper = behind < 0.33 ? mix(vec3(1.0, 0.85, 0.45), vec3(0.85, 0.5, 0.25), behind / 0.33)
          : behind < 0.66 ? mix(vec3(0.85, 0.5, 0.25), vec3(0.55, 0.3, 0.7), (behind - 0.33) / 0.33)
          : mix(vec3(0.55, 0.3, 0.7), vec3(0.25, 0.45, 0.9), (behind - 0.66) / 0.34);
        float inside = step(sd, uShock.x) * (1.0 - behind * 0.6);
        float metal = texture2D(metalnessMap, vUv).b;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * temper * 1.6, inside * k * metal * 0.85);
        gl_FragColor.rgb += vec3(1.6, 1.0, 0.5) * ring * k * 1.2;`,
  });
  const side = L.sideTex(1024, 64, (u, v) => {
    const [e] = W2.cells(u, v * 0.38, 0.2, 136), rust = smooth(0.55, 0.75, fbm(u * 1.4, v, 3, 137));
    let c = mix3([0.15, 0.12, 0.11], [0.25, 0.19, 0.16], smooth(0, 0.08, e));
    c = mix3(c, [0.55, 0.30, 0.14], rust * 0.7);
    return mix3(c, [0.7, 0.7, 0.72], smooth(0.08, 0.0, v) * 0.8); // polierte Schnittkante oben
  });
  L.sides(L.sideMat(L.tex(side), { glow: 0.25, roughness: 0.7, env: 1.4 }));
  L.hide('plateTrim');
  return 'Meteoreisen';
};
