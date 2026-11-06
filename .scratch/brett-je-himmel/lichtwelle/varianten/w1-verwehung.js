// Wüste A «Sandverwehung»: Mit dem Ring treibt eine Fahne aus Sand über den Putz, in Schlieren nach aussen, Körner
// hüpfen mit. Hinter ihr bleiben Sandzungen in Windrichtung liegen, in den Rillen länger, und wehen fleckig fort. Am
// Rand rieselt der Sand in dünnen Strähnen über das Gesims hinunter
__katalog.varianten['w-verwehung'] = async (L) => {
  const W = __katalog.welle, { HP } = L, r = L.rng(601);
  // Schlieren in Windrichtung (radial): Rauschen, längs der Richtung nach aussen gemittelt
  const streak = (q, n, step, freq) => `(${Array.from({ length: n }, (_, i) => `wNoise((${q} - wDir * ${(i * step).toFixed(3)}) * ${freq.toFixed(1)})`).join(' + ')}) / ${n.toFixed(1)}`;
  await W.brett('lehm', {
    pre: `
      float wSand = 0.0;
      if (uWave.x < 6.0 && wAge > -0.05) {
        // Sandzungen, die die Verwehung zurücklässt: liegen kurz, in den Rillen länger, wehen fleckig fort
        float gone = 0.8 + 1.0 * wFbm(wp * 1.1 + 3.0) + floorGroove * 0.7;
        float tongue = smoothstep(0.4, 0.62, ${streak('wp', 5, 0.09, 9)});
        wSand = smoothstep(0.0, 0.1, wAge) * (1.0 - smoothstep(gone - 0.45, gone, wAge)) * (0.25 + 0.75 * tongue);
        float grain = wNoise(wp * 150.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88, 0.55, 0.22) * (0.8 + grain * 0.4), wSand * 0.8);
      }`,
    // Ring nur als warmer Hauch: die Form trägt der Sand
    wave: `
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.5 + vec3(0.4, 0.26, 0.12)) * ring * 0.5 * k;`,
    after: `
      if (uWave.x < 6.0 && wAge > -0.05 && wAge < 0.4) {
        // Fahne an der Front: Schlieren, die etwas schneller als der Ring nach aussen treiben (~1,2 m lang)
        vec2 q = wp - wDir * uWave.x * 7.6;
        float s = ${streak('q', 6, 0.07, 14)};
        float band = smoothstep(-0.03, 0.005, wAge) * (1.0 - smoothstep(0.05, 0.22, wAge));
        float st = smoothstep(0.38, 0.66, s);
        vec3 sandLit = gl_FragColor.rgb * vec3(1.32, 1.42, 1.25) + vec3(0.07, 0.045, 0.01);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.82, band * (1.0 - st) * 0.5);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, sandLit, band * st * 0.9);
      }`,
  });
  // Körner der Fahne: hüpfen mit der Front nach aussen, bleiben zurück und legen sich; helle und dunkle
  const grains = [];
  for (let i = 0; i < 2600; i++) {
    const [x, z] = W.imRing(r, 0.3, HP - 0.05);
    grains.push([x, z, r() * 0.05, 0.25 + r() * 0.35, 6.5 * (0.6 + r() * 0.5), 0.02 + r() * 0.1, 18 + r() * 20, r()]);
  }
  W.teilchen(grains.length, {
    a0: [4, (i) => grains[i].slice(0, 4)], // x, z, Verzug, Lebenszeit (s)
    a1: [4, (i) => grains[i].slice(4)],    // Tempo (m/s), Sprunghöhe (m), Sprungtakt, Zufall
  }, `
    float age = uWave.x - (length(a0.xy) / 6.5 + a0.z);
    if (age > 0.0 && age < a0.w) {
      float u = age / a0.w;
      vec2 dir = normalize(a0.xy + 1e-4), side = vec2(-dir.y, dir.x);
      vec2 xz = a0.xy + dir * a1.x * age * (1.0 - 0.5 * u) + side * (a1.w - 0.5) * 0.3 * age;
      float hop = abs(sin(age * a1.z + a1.w * 6.28)) * a1.y * (1.0 - u);
      pos = vec3(xz.x, 0.015 + hop, xz.y);
      float bx = max(abs(xz.x), abs(xz.y));
      alpha = smoothstep(0.0, 0.04, age) * (1.0 - smoothstep(0.55, 1.0, u)) * (1.0 - smoothstep(4.85, 4.95, bx));
      size = 0.014 + 0.012 * fract(a1.w * 7.0);
      float tw = pow(wHash(vec2(a1.w * 97.0, floor(uWave.y * 20.0))), 24.0);
      col = fract(a1.w * 13.0) < 0.5 ? vec3(0.42, 0.21, 0.08) : vec3(1.15, 0.78, 0.42);
      col += vec3(2.6, 2.1, 1.4) * tw;
    }`, W.PUNKT);
  // Rieseln über das Gesims: an der Kante, sobald die Fahne ankommt, in dünnen Strähnen
  const falls = [];
  for (let s = 0; s < 4; s++) {
    for (let k = 0; k < 44; k++) {
      const t = (r() * 2 - 1) * (HP - 0.1), nx = [1, -1, 0, 0][s], nz = [0, 0, 1, -1][s];
      const x = nx ? nx * (HP - 0.03) : t, z = nz ? nz * (HP - 0.03) : t;
      for (let j = 0; j < 8; j++) falls.push([x + (nz ? (r() - 0.5) * 0.05 : 0), z + (nx ? (r() - 0.5) * 0.05 : 0), r() * 1.0, 0.7 + r() * 0.3, nx, nz, 0.12 + r() * 0.3, r()]);
    }
  }
  W.teilchen(falls.length, {
    a0: [4, (i) => falls[i].slice(0, 4)], // x, z, Verzug, Lebenszeit
    a1: [4, (i) => falls[i].slice(4)],    // Normale x, z, Tempo nach aussen, Zufall
  }, `
    float age = uWave.x - (length(a0.xy) / 6.5 + 0.05 + a0.z);
    if (age > 0.0 && age < a0.w) {
      vec2 n = a1.xy;
      vec2 xz = a0.xy + n * (0.03 + a1.z * age);
      pos = vec3(xz.x, 0.005 - 4.905 * age * age, xz.y);
      alpha = smoothstep(0.0, 0.05, age) * (1.0 - smoothstep(0.4, 0.9, -pos.y));
      size = 0.016 + 0.01 * a1.w;
      col = a1.w < 0.5 ? vec3(0.5, 0.26, 0.1) : vec3(1.1, 0.74, 0.4);
    }`, W.PUNKT);
  return 'Lehmterrasse · Sandverwehung';
};
