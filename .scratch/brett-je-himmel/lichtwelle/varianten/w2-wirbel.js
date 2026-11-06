// Wüste B «Sandwirbel»: Wo der Ring vorbeizieht, wirbeln Sandkörner in kleinen Spiralen auf und rieseln langsam
// zurück; an einigen Stellen dreht sich der Sand zu kleinen Sandteufeln hoch, die ein Stück mitwandern und in sich
// zusammenfallen. Ab und zu glitzert ein Korn. Wo der Sand landet, liegt er kurz hell auf dem Putz
__katalog.varianten['w-wirbel'] = async (L) => {
  const W = __katalog.welle, { HP } = L, r = L.rng(602);
  await W.brett('lehm', {
    pre: `
      if (uWave.x < 6.0 && wAge > 0.6) {
        // Sand, wo die Körner landen: kommt nach der Flugzeit, vergeht wieder
        float k = smoothstep(0.7, 1.3, wAge) * (1.0 - smoothstep(1.7, 2.5, wAge));
        float spk = smoothstep(0.55, 0.85, wNoise(wp * 34.0)) * (0.6 + 0.4 * wFbm(wp * 2.0));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88, 0.56, 0.25), k * spk * 0.7);
      }`,
    wave: `
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.5 + vec3(0.4, 0.26, 0.12)) * ring * 0.6 * k;`,
    after: `
      if (uWave.x < 6.0 && wAge > -0.03 && wAge < 1.2) {
        // warmer Schimmer, wo der Sand aufwirbelt
        float haze = smoothstep(-0.03, 0.03, wAge) * exp(-max(wAge, 0.0) * 3.0);
        gl_FragColor.rgb += vec3(0.28, 0.16, 0.05) * haze * (0.5 + 0.5 * wNoise(wp * 3.0 + uWave.x));
      }`,
  });
  // Körner: Spirale nach oben (schnell), dann langsames Rieseln nach unten; helle und dunkle, selten ein Glitzern
  const grains = [];
  for (let i = 0; i < 2000; i++) {
    const [x, z] = W.imRing(r, 0.35, HP - 0.06), big = r();
    grains.push([x, z, r() * 0.08, 0.8 + r() * 0.8, 0.04 + r() * 0.18, (r() < 0.5 ? -1 : 1) * (5 + r() * 7), 0.08 + big * big * 0.45, r()]);
  }
  // Sandteufel: Trichter aus Körnern, die ein Stück nach aussen wandern und zusammenfallen
  const devils = [[0.5, 2.0], [1.6, 3.1], [2.5, 1.7], [3.4, 2.9], [4.3, 2.2], [5.2, 3.3], [6.0, 1.5]];
  for (const [a, d] of devils) {
    const cx = Math.cos(a) * d, cz = Math.sin(a) * d;
    for (let k = 0; k < 360; k++) {
      const f = Math.pow(r(), 0.75); // Höhe im Trichter 0..1
      // Kennung: Spiralradius < 0 heisst Sandteufel (Höhe f, Trichter)
      grains.push([cx, cz, 0.05 + r() * 0.1, 1.3 + r() * 0.3, -(0.05 + f * 0.4 + r() * 0.05), 8 + r() * 5, f, r()]);
    }
  }
  W.teilchen(grains.length, {
    a0: [4, (i) => grains[i].slice(0, 4)], // x, z, Verzug, Flugzeit (s)
    a1: [4, (i) => grains[i].slice(4)],    // Spiralradius (m; < 0: Sandteufel), Drehtempo (rad/s), Höhe (m bzw. 0..1), Zufall
  }, `
    float age = uWave.x - (length(a0.xy) / 6.5 + a0.z);
    if (age > 0.0 && age < a0.w + 0.45) {
      float u = clamp(age / a0.w, 0.0, 1.0);
      vec2 dir = normalize(a0.xy + 1e-4);
      if (a1.x > 0.0) {
        float y = u < 0.28 ? 1.0 - pow(1.0 - u / 0.28, 2.0) : 1.0 - pow((u - 0.28) / 0.72, 1.4);
        float th = a1.w * 6.2831 + a1.y * age * (1.0 - 0.5 * u);
        float rho = a1.x * smoothstep(0.0, 0.25, age);
        vec2 xz = a0.xy + dir * 0.35 * smoothstep(0.0, 0.7, age) + vec2(cos(th), sin(th)) * rho;
        pos = vec3(xz.x, 0.012 + a1.z * y, xz.y);
      } else {
        // Sandteufel: wächst in 0,3 s hoch, dreht, wandert nach aussen; am Ende fallen die Körner nach aussen weg
        float grow = smoothstep(0.0, 0.35, age), fall = smoothstep(0.75, 1.0, u);
        float th = a1.w * 6.2831 + a1.y * age * (1.25 - a1.z * 0.5);
        float rho = -a1.x * (0.4 + 0.6 * grow) * (1.0 + fall * 1.5);
        vec2 c = a0.xy + dir * 0.6 * age;
        vec2 xz = c + vec2(cos(th), sin(th)) * rho;
        float y = 0.02 + a1.z * 1.2 * grow * (1.0 - fall * fall);
        pos = vec3(xz.x, y, xz.y);
      }
      alpha = smoothstep(0.0, 0.05, age) * (1.0 - smoothstep(a0.w, a0.w + 0.45, age));
      size = (0.015 + 0.012 * fract(a1.w * 7.0)) * (a1.x < 0.0 ? 1.3 : 1.0);
      float tw = pow(wHash(vec2(a1.w * 97.0, floor(uWave.y * 20.0))), 24.0) * (1.0 - u * 0.5);
      col = fract(a1.w * 13.0) < 0.45 ? vec3(0.42, 0.21, 0.08) : vec3(1.15, 0.78, 0.42);
      col += vec3(2.8, 2.2, 1.5) * tw;
    }`, W.PUNKT);
  // Staub: wenige weiche Wolken, steigen mit dem Wirbel und vergehen
  const puffs = [];
  for (let i = 0; i < 40; i++) {
    const [x, z] = W.imRing(r, 0.8, HP - 0.3);
    puffs.push([x, z, r() * 0.1, 1.1 + r() * 0.6, 0.25 + r() * 0.3, 0.25 + r() * 0.4, r(), 0]);
  }
  W.teilchen(puffs.length, {
    a0: [4, (i) => puffs[i].slice(0, 4)], // x, z, Verzug, Lebenszeit
    a1: [4, (i) => puffs[i].slice(4)],    // Grösse, Steigen (m), Zufall
  }, `
    float age = uWave.x - (length(a0.xy) / 6.5 + a0.z);
    if (age > 0.0 && age < a0.w) {
      float u = age / a0.w;
      vec2 dir = normalize(a0.xy + 1e-4);
      vec2 xz = a0.xy + dir * 0.4 * u;
      pos = vec3(xz.x, 0.1 + a1.y * sqrt(u), xz.y);
      size = a1.x * (0.5 + 0.7 * u);
      alpha = smoothstep(0.0, 0.15, u) * (1.0 - smoothstep(0.4, 1.0, u)) * 0.14;
      col = vec3(0.9, 0.6, 0.34);
      X = vec4(a1.z, 0.0, 0.0, 0.0);
    }`, `
    float r = length(vC); if (r > 1.0) discard;
    float n = wNoise(vC * 2.5 + vX.x * 20.0);
    gl_FragColor = vec4(vCol, (1.0 - smoothstep(0.2, 1.0, r)) * (0.6 + 0.6 * n) * vA);`, { order: 4 });
  return 'Lehmterrasse · Sandwirbel';
};
