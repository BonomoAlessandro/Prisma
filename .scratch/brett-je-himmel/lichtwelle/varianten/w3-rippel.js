// Wüste C «Windrippel»: Vor dem Ring weht ein Schleier aus Sand, hinter ihm legen sich Windrippel auf den Putz: feine
// Bögen quer zum Wind wie auf einer Düne, im Streiflicht hell und dunkel. Sie wandern ein wenig und glätten sich
// wieder, bis der Putz frei ist
__katalog.varianten['w-rippel'] = async (L) => {
  const W = __katalog.welle, { HP } = L, r = L.rng(603);
  await W.brett('lehm', {
    pre: `
      float wRip = 0.0, wSl = 0.0;
      if (uWave.x < 6.0 && wAge > 0.0) {
        // Rippel: entstehen hinter dem Ring, halten kurz, glätten sich fleckig
        float smoothAt = 1.2 + 0.7 * wFbm(wp * 0.8 + 2.0);
        float amp = smoothstep(0.0, 0.3, wAge) * (1.0 - smoothstep(smoothAt - 0.6, smoothAt, wAge)) * smoothstep(0.3, 1.4, wd);
        // Bögen quer zum Wind, kräftig verbogen, damit keine Zielscheibe entsteht (Gabelungen wie auf der Düne)
        float warp = wFbm(wp * 0.9) - 0.5, warp2 = wNoise(wp * 2.6 + 1.7) - 0.5;
        float ph = (wd + warp * 0.9 + warp2 * 0.12 + sin(wp.x * 1.7 + wp.y * 1.3) * 0.08) / 0.15 - uWave.x * 0.5;
        float fr = fract(ph);
        float h = fr < 0.7 ? fr / 0.7 : (1.0 - fr) / 0.3;   // Luv flach, Lee steil
        wRip = amp; wSl = (fr < 0.7 ? 1.0 : -2.3) * amp;
        float cover = amp * (0.55 + 0.45 * smoothstep(0.3, 0.7, wFbm(wp * 2.2)));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.54, 0.24), cover * 0.75);
        diffuseColor.rgb *= 1.0 + (h - 0.5) * 0.35 * cover;
      }`,
    // Rippel im Licht: Normale kippt mit der Steigung (radial)
    replace: [['#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      if (wRip > 0.0) normal = normalize(normal - (viewMatrix * vec4(wDir.x, 0.0, wDir.y, 0.0)).xyz * wSl * 0.22);`]],
    after: `
      if (uWave.x < 6.0 && wAge > -0.06 && wAge < 0.3) {
        // Sandschleier an der Front
        vec2 q = wp - wDir * uWave.x * 7.0;
        float s = (wNoise((q) * 12.0) + wNoise((q - wDir * 0.08) * 12.0)) * 0.5;
        float veil = smoothstep(-0.06, -0.005, wAge) * (1.0 - smoothstep(0.02, 0.2, wAge));
        vec3 sandLit = gl_FragColor.rgb * vec3(1.3, 1.45, 1.3) + vec3(0.06, 0.04, 0.01);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, sandLit, veil * (0.25 + 0.5 * smoothstep(0.35, 0.7, s)));
      }`,
  });
  // wenige Körner springen an der Front
  const grains = [];
  for (let i = 0; i < 700; i++) {
    const [x, z] = W.imRing(r, 0.3, HP - 0.05);
    grains.push([x, z, r() * 0.04, 0.2 + r() * 0.25, 6.5 * (0.75 + r() * 0.4), 0.02 + r() * 0.08, 20 + r() * 16, r()]);
  }
  W.teilchen(grains.length, {
    a0: [4, (i) => grains[i].slice(0, 4)],
    a1: [4, (i) => grains[i].slice(4)],
  }, `
    float age = uWave.x - (length(a0.xy) / 6.5 + a0.z);
    if (age > 0.0 && age < a0.w) {
      float u = age / a0.w;
      vec2 dir = normalize(a0.xy + 1e-4);
      vec2 xz = a0.xy + dir * a1.x * age * (1.0 - 0.4 * u);
      pos = vec3(xz.x, 0.012 + abs(sin(age * a1.z + a1.w * 6.28)) * a1.y * (1.0 - u), xz.y);
      float bx = max(abs(xz.x), abs(xz.y));
      alpha = smoothstep(0.0, 0.04, age) * (1.0 - smoothstep(0.5, 1.0, u)) * (1.0 - smoothstep(4.85, 4.95, bx));
      size = 0.011 + 0.009 * fract(a1.w * 7.0);
      float tw = pow(wHash(vec2(a1.w * 97.0, floor(uWave.y * 24.0))), 14.0);
      col = vec3(1.05, 0.72, 0.4) + vec3(3.2, 2.6, 1.7) * tw;
    }`, W.PUNKT);
  return 'Lehmterrasse · Windrippel';
};
