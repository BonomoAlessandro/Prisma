// Strand A «Brandung»: Eine flache Welle mit Schaumkrone rollt mit dem Ring über den Sandstein. Dahinter ist der Stein
// nass, dunkel und glänzt, dann trocknet er fleckig (Mulden und Rillen zuletzt). Tropfen spritzen an der Krone. In der
// Rinne schlägt die Welle an: Gischt steigt an der Kante auf, Schaum treibt rundum, das Wasser kräuselt sich
__katalog.varianten['s-brandung'] = async (L) => {
  const W = __katalog.welle, { T, HB, HP } = L, r = L.rng(501);
  const IN = HB + 0.12, OUT = HP - 0.13;
  const f = (v) => v.toFixed(3);
  await W.brett('wasserrand', {
    pre: `
      float wChan = smoothstep(${f(IN - 0.01)}, ${f(IN + 0.01)}, wbx) * (1.0 - smoothstep(${f(OUT - 0.01)}, ${f(OUT + 0.01)}, wbx));
      float wFld = 1.0 - smoothstep(${f(IN - 0.02)}, ${f(IN + 0.01)}, wbx);
      float wWet = 0.0;
      if (uWave.x < 6.0 && wAge > -0.05) {
        // Wasserfilm: kommt mit der Front, trocknet fleckig; in Mulden und Rillen bleibt er länger
        float dry = 0.75 + 1.0 * wFbm(wp * 1.3) + floorGroove * 0.6;
        wWet = smoothstep(-0.01, 0.03, wAge) * (1.0 - smoothstep(dry - 0.4, dry, wAge)) * wFld;
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * diffuseColor.rgb * 0.9, wWet * 0.8);
      }`,
    rough: 'roughnessFactor = mix(roughnessFactor, 0.1, wWet * 0.9);',
    wave: '',
    after: `
      if (uWave.x < 6.0 && wAge > -0.05) {
        // Schaumkrone an der Front (~25 cm), zerrissen; dahinter Schaumspitzen, die zerfallen; ganz vorn ein Lichtsaum
        float fa = wAge;
        float crest = exp(-pow((fa - 0.022) / 0.03, 2.0)) * wFld;
        float lace = 0.0, foam = 0.0;
        if (fa < 0.45) {
          float fn = wFbm(wp * 9.0 + vec2(uWave.x * 1.4, -uWave.x));
          foam = smoothstep(0.42, 0.62, crest * (0.45 + fn * 0.95));
          // Schaumreste hinter der Krone: dünne, zerrissene Fäden, nur stellenweise
          float ln = abs(wNoise(wp * 6.0 + vec2(uWave.x * 0.6, 0.3)) - 0.5);
          float lpatch = smoothstep(0.45, 0.72, wNoise(wp * 2.3 + 4.0));
          lace = (1.0 - smoothstep(0.0, 0.045, ln)) * lpatch * exp(-pow((fa - 0.09) / 0.07, 2.0)) * wFld;
        }
        // dünne, klare Wasserschicht direkt hinter der Krone (türkis), läuft schnell ab
        float sheet = smoothstep(0.02, 0.05, fa) * exp(-max(fa - 0.05, 0.0) * 6.0) * wFld;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * vec3(0.6, 0.88, 0.88) + vec3(0.02, 0.07, 0.07), sheet * 0.6);
        float glint = exp(-pow((fa + 0.006) / 0.012, 2.0)) * wFld;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 1.08, 1.08), clamp(foam * 0.92 + lace * 0.6, 0.0, 1.0));
        gl_FragColor.rgb += (uShockColor + vec3(0.3, 0.4, 0.4)) * glint * 0.9;
        // Glitzern auf dem nassen Stein
        gl_FragColor.rgb += vec3(1.3, 1.45, 1.45) * step(0.993, wHash(floor(wp * 60.0) + floor(uWave.y * 10.0))) * wWet;
        // Rinne: die Welle schlägt an, Schaum treibt rundum, eigene Stärke (nicht die des Rings)
        if (wChan > 0.0) {
          float ca = smoothstep(-0.02, 0.05, fa) * exp(-max(fa, 0.0) * 1.3) * wChan;
          float cf = smoothstep(0.45, 0.72, wFbm(wp * 8.0 + vec2(uWave.x * 0.9, -uWave.x * 0.6)));
          float swell = exp(-pow((fa - 0.05) / 0.08, 2.0)) * wChan;
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.05, 1.12, 1.12), clamp(cf * ca * 0.95 + swell * 0.75, 0.0, 1.0));
          gl_FragColor.rgb += vec3(0.2, 0.45, 0.42) * ca * 0.35;
        }
      }`,
    // Spiegelung in der Rinne kräuselt sich, wenn die Welle ankommt
    replace: [['vec2 ruv = vReflUv.xy / vReflUv.w;', `vec2 ruv = vReflUv.xy / vReflUv.w;
      if (uWave.x < 6.0 && wAge > 0.0) {
        float rp = sin(wd * 26.0 - uWave.x * 15.0 + wbx * 9.0) * exp(-wAge * 1.2) * wChan;
        ruv += vec2(rp * 0.012, rp * 0.007);
      }`]],
  });
  // Tropfen: an der Krone über dem Feld (flach, mit der Welle), an der Rinne hoch (Gischt an Innen- und Aussenkante)
  const drops = [];
  for (let i = 0; i < 420; i++) {
    const [x, z] = W.imRing(r, 0.4, IN - 0.05), up = 0.9 + r() * 1.3;
    drops.push([x, z, r() * 0.04, up, 6.5 * (0.8 + r() * 0.3), 0.022 + r() * 0.024, r()]);
  }
  for (let i = 0; i < 340; i++) {
    const outer = r() < 0.3, [x, z] = W.imRing(r, outer ? OUT - 0.04 : IN - 0.02, outer ? OUT + 0.02 : IN + 0.1), up = 1.8 + r() * 1.6;
    drops.push([x, z, 0.01 + r() * 0.12, up, 0.4 + r() * 1.4, 0.022 + r() * 0.03, r()]);
  }
  W.teilchen(drops.length, {
    a0: [4, (i) => drops[i].slice(0, 4)], // x, z, Verzug (s), Anfangstempo nach oben (m/s)
    a1: [3, (i) => drops[i].slice(4)],    // Tempo nach aussen (m/s), Grösse (m), Zufall
  }, `
    float age = uWave.x - (length(a0.xy) / 6.5 + a0.z);
    float life = 2.0 * a0.w / 9.81;
    if (age > 0.0 && age < life) {
      vec2 dir = normalize(a0.xy + 1e-4), side = vec2(-dir.y, dir.x);
      vec2 xz = a0.xy + dir * a1.x * age + side * (a1.z - 0.5) * 0.8 * age;
      pos = vec3(xz.x, 0.02 + a0.w * age - 4.905 * age * age, xz.y);
      size = a1.y * (1.0 - 0.4 * age / life);
      alpha = smoothstep(0.0, 0.03, age) * (1.0 - smoothstep(life * 0.7, life, age)) * 0.9;
      col = vec3(1.15, 1.3, 1.32);
    }`, W.PUNKT);
  return 'Gezeitenbecken · Brandung';
};
