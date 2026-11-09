// Strand C «Wasserglanz»: Mit dem Ring zieht ein Band aus Wasserlicht über den Stein, als läge er kurz unter Wasser:
// ein wanderndes Lichtnetz (Kaustik), der Stein glänzt nass. In der Rinne leuchtet das Wasser auf, die Spiegelung
// kräuselt sich, und ein paar Blasen steigen auf und platzen
__katalog.varianten['s-glanz'] = async (L) => {
  const W = __katalog.welle, { HB, HP } = L, r = L.rng(503);
  const IN = HB + 0.12, OUT = HP - 0.13;
  const f = (v) => v.toFixed(3);
  await W.brett('wasserrand', {
    pre: `
      float wChan = smoothstep(${f(IN - 0.01)}, ${f(IN + 0.01)}, wbx) * (1.0 - smoothstep(${f(OUT - 0.01)}, ${f(OUT + 0.01)}, wbx));
      float wFld = 1.0 - smoothstep(${f(IN - 0.02)}, ${f(IN + 0.01)}, wbx);
      // Band aus Wasserlicht: setzt mit der Front ein, ~1,5 m Nachlauf
      float wBand = (uWave.x < 6.0) ? smoothstep(-0.02, 0.02, wAge) * exp(-max(wAge, 0.0) * 3.2) * wFld : 0.0;
      diffuseColor.rgb *= 1.0 - wBand * 0.22;`,
    rough: 'roughnessFactor = mix(roughnessFactor, 0.18, wBand * 0.85);',
    wave: '',
    after: `
      if (uWave.x < 6.0 && wAge > -0.05) {
        // Lichtnetz wie auf dem Grund eines Beckens, wandert langsam
        float caust = (wBand > 0.01 || wChan > 0.0) ? wCaustic(wp * 0.42, 1.0 + uWave.x * 0.9) : 0.0;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * vec3(0.7, 0.94, 0.94), wBand * 0.55);
        gl_FragColor.rgb += vec3(0.6, 1.0, 0.92) * caust * wBand * 0.75;
        gl_FragColor.rgb += (uShockColor + vec3(0.3, 0.4, 0.4)) * exp(-pow((wAge + 0.004) / 0.016, 2.0)) * wFld * 0.75;
        if (wChan > 0.0 && wAge > -0.02) {
          float ca = smoothstep(-0.02, 0.05, wAge) * exp(-max(wAge, 0.0) * 1.2) * wChan;
          gl_FragColor.rgb += vec3(0.45, 1.0, 0.92) * caust * ca * 1.1 + vec3(0.14, 0.36, 0.33) * ca;
        }
      }`,
    replace: [['vec2 ruv = vReflUv.xy / vReflUv.w;', `vec2 ruv = vReflUv.xy / vReflUv.w;
      if (uWave.x < 6.0 && wAge > 0.0) {
        float rp = sin(wd * 24.0 - uWave.x * 13.0 + wbx * 8.0) * exp(-wAge * 1.1) * wChan;
        ruv += vec2(rp * 0.012, rp * 0.007);
      }`]],
  });
  // ein paar Blasen aus der Rinne: klein, steigen, platzen
  const list = [];
  for (let i = 0; i < 80; i++) {
    const [x, z] = W.imRing(r, IN + 0.03, OUT - 0.03);
    list.push([x, z, 0.05 + r() * 0.4, 0.5 + r() * 0.9, 0.07 + r() * 0.06, 0.22 + r() * 0.3, 0.05 + r() * 0.2, r()]);
  }
  W.teilchen(list.length, {
    a0: [4, (i) => list[i].slice(0, 4)],
    a1: [4, (i) => list[i].slice(4)],
  }, `
    float age = uWave.x - (length(a0.xy) / 6.5 + a0.z);
    if (age > 0.0 && age < a0.w + 0.1) {
      float grow = smoothstep(0.0, 0.25, age), lift = max(age - 0.15, 0.0);
      float R = a1.x * (0.2 + 0.8 * grow);
      vec2 dir = normalize(a0.xy + 1e-4), side = vec2(-dir.y, dir.x);
      vec2 xz = a0.xy + dir * a1.z * lift + side * sin(lift * 3.0 + a1.w * 6.28) * 0.06 * min(lift, 1.0);
      pos = vec3(xz.x, R * grow + a1.y * lift, xz.y);
      float p = clamp((age - a0.w) / 0.1, 0.0, 1.0);
      size = R * (1.0 + p * 0.4);
      alpha = smoothstep(0.0, 0.1, age) * (1.0 - p);
      X = vec4(a1.w, p, 0.0, 0.0);
    }`, `
    float r = length(vC); if (r > 1.0) discard;
    float nz = sqrt(1.0 - r * r), fres = pow(1.0 - nz, 2.0);
    vec3 film = mix(vec3(0.75, 1.0, 0.95), wFilm(fres * 0.8 + vX.x), 0.35);
    vec2 h1 = vC - vec2(-0.36, 0.42);
    float hl = exp(-dot(h1, h1) * 38.0);
    float rim = smoothstep(0.84, 0.96, r) * (1.0 - smoothstep(0.96, 1.0, r));
    float a = clamp(0.1 + fres * 0.75 + rim * 0.5 + hl, 0.0, 1.0);
    if (vX.y > 0.0) a = rim * step(0.45, wHash(vec2(floor(atan(vC.y, vC.x) * 3.0), vX.x * 50.0))) * 1.6;
    gl_FragColor = vec4(film * (0.6 + fres) + vec3(1.7) * hl, a * vA);`);
  return 'Gezeitenbecken · Wasserglanz';
};
