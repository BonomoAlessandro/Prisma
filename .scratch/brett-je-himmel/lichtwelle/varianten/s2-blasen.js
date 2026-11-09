// Strand B «Seifenblasen»: Der Ring schillert wie ein Seifenfilm, dahinter zieht ein Hauch Farbe über den Stein. Wo er
// vorbeizieht, wachsen ein paar Blasen aus dem Stein; in der Rinne schäumt das Wasser in kleinen Bläschen auf, und aus
// ihr steigt ein Kranz grösserer Blasen. Sie treiben, schwanken und zerplatzen nacheinander
__katalog.varianten['s-blasen'] = async (L) => {
  const W = __katalog.welle, { HB, HP } = L, r = L.rng(502);
  const IN = HB + 0.12, OUT = HP - 0.13;
  const f = (v) => v.toFixed(3);
  // Schaum in der Rinne: Kreise in einem Gitter, jede Zelle mit eigener Zeit (entsteht, platzt)
  const bubbleCells = (scale, seed) => `{
        vec2 g = wp * ${scale.toFixed(1)} + ${seed.toFixed(1)}, gi = floor(g), gf = fract(g) - 0.5;
        float h = wHash(gi), rr = 0.2 + 0.2 * wHash(gi + 3.1);
        vec2 off = (vec2(wHash(gi + 1.7), wHash(gi + 5.3)) - 0.5) * (0.5 - rr) * 1.8;
        float dc = length(gf - off), aa = fwidth(dc) * 1.2;
        float line = smoothstep(rr + aa, rr, dc) * smoothstep(rr - 0.1 - aa, rr - 0.1, dc);
        float inner = smoothstep(rr + aa, rr, dc);
        float born = 0.02 + h * 0.3, pop = 0.5 + wHash(gi + 9.2) * 1.5;
        float live = step(born, wAge) * step(wAge, pop) * step(0.2, h);
        foamC = max(foamC, line * live);
        filmC += wFilm(h * 3.0 + dc * 4.0) * inner * live;
      }`;
  await W.brett('wasserrand', {
    pre: `
      float wChan = smoothstep(${f(IN - 0.01)}, ${f(IN + 0.01)}, wbx) * (1.0 - smoothstep(${f(OUT - 0.01)}, ${f(OUT + 0.01)}, wbx));
      float wFld = 1.0 - smoothstep(${f(IN - 0.02)}, ${f(IN + 0.01)}, wbx);`,
    wave: '',
    after: `
      if (uWave.x < 6.0 && wAge > -0.05) {
        // Schillernder Ring (~35 cm), dahinter ein Seifenfilm, der langsam vergeht; ganz vorn ein heller Saum
        float band = exp(-pow((wAge - 0.03) / 0.045, 2.0));
        float sw = wFbm(wp * 1.4 + vec2(uWave.x * 0.5, 0.0));
        vec3 film = wFilm(wd * 0.3 + sw * 1.5 - uWave.x * 0.7);
        float sheen = smoothstep(0.0, 0.06, wAge) * exp(-max(wAge, 0.0) * 2.0) * 0.22;
        gl_FragColor.rgb += film * (band * 0.9 + sheen) * wFld;
        gl_FragColor.rgb += vec3(0.7) * exp(-pow((wAge + 0.006) / 0.012, 2.0)) * wFld * 0.5;
        // Rinne: Schaum aus Bläschen (zwei Grössen), eigene Stärke
        if (wChan > 0.0 && wAge > 0.0) {
          float foamC = 0.0; vec3 filmC = vec3(0.0);
          ${bubbleCells(9, 0)}
          ${bubbleCells(14, 31)}
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.1, 1.15, 1.15), foamC * 0.85 * wChan);
          gl_FragColor.rgb += filmC * 0.12 * wChan;
          gl_FragColor.rgb += vec3(0.2, 0.42, 0.4) * exp(-wAge * 1.5) * 0.3 * wChan;
        }
      }`,
  });
  // Blasen: wenige aus dem Feld (klein, platzen bald), ein Kranz aus der Rinne (grösser, steigen höher)
  const list = [];
  for (let i = 0; i < 90; i++) {
    const [x, z] = W.imRing(r, 0.6, IN - 0.25);
    list.push([x, z, r() * 0.1, 0.6 + r() * 0.8, 0.07 + r() * 0.07, 0.22 + r() * 0.25, 0.05 + r() * 0.2, r()]);
  }
  for (let i = 0; i < 150; i++) {
    const [x, z] = W.imRing(r, IN + 0.03, OUT - 0.03);
    list.push([x, z, 0.03 + r() * 0.3, 0.8 + r() * 0.9, 0.1 + r() * 0.12, 0.25 + r() * 0.35, 0.05 + r() * 0.3, r()]);
  }
  W.teilchen(list.length, {
    a0: [4, (i) => list[i].slice(0, 4)], // x, z, Verzug (s), Platzen nach (s)
    a1: [4, (i) => list[i].slice(4)],    // Radius (m), Steigen (m/s), Treiben nach aussen (m/s), Zufall
  }, `
    float age = uWave.x - (length(a0.xy) / 6.5 + a0.z);
    if (age > 0.0 && age < a0.w + 0.1) {
      float grow = smoothstep(0.0, 0.3, age), lift = max(age - 0.2, 0.0);
      float R = a1.x * (0.2 + 0.8 * grow);
      vec2 dir = normalize(a0.xy + 1e-4), side = vec2(-dir.y, dir.x);
      vec2 xz = a0.xy + dir * a1.z * lift + side * sin(lift * 2.4 + a1.w * 6.28) * 0.1 * min(lift, 1.0);
      pos = vec3(xz.x, R * grow + a1.y * lift + 0.03 * sin(lift * 5.0 + a1.w * 9.0), xz.y);
      float p = clamp((age - a0.w) / 0.1, 0.0, 1.0);
      size = R * (1.0 + p * 0.4);
      alpha = smoothstep(0.0, 0.1, age) * (1.0 - p);
      X = vec4(a1.w, p, 0.0, 0.0);
    }`, `
    float r = length(vC); if (r > 1.0) discard;
    float nz = sqrt(1.0 - r * r), fres = pow(1.0 - nz, 2.0);
    float sw = wNoise(vC * 1.8 + vX.x * 17.0 + uWave.y * 0.5);
    vec3 film = wFilm(fres * 0.8 + sw * 0.7 + vX.x);
    vec2 h1 = vC - vec2(-0.36, 0.42), h2 = vC - vec2(0.32, -0.36);
    float hl = exp(-dot(h1, h1) * 38.0) + exp(-dot(h2, h2) * 110.0) * 0.45;
    float rim = smoothstep(0.84, 0.96, r) * (1.0 - smoothstep(0.96, 1.0, r));
    float a = clamp(0.1 + fres * 0.75 + rim * 0.55 + hl, 0.0, 1.0);
    if (vX.y > 0.0) { // platzt: nur noch ein zerrissener Rand
      float seg = step(0.45, wHash(vec2(floor(atan(vC.y, vC.x) * 3.0), vX.x * 50.0)));
      a = rim * seg * 1.6;
    }
    gl_FragColor = vec4(film * (0.7 + fres * 1.3) + vec3(0.5) * rim + vec3(1.8) * hl, a * vA);`);
  return 'Gezeitenbecken · Seifenblasen';
};
