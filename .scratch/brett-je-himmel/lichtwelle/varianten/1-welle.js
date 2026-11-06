// Hilfen für neue Lichtwellen (Strand, Wüste), zur Laufzeit im festen Stand: nichts davon gehört nach index.html.
// Alles läuft über die Ankunft des Rings (Zeit seit seinem Start minus Abstand / 6,5 m/s), nicht über seine Stärke:
// die fällt bis zum Rand auf fast nichts (0,82 bei 0,7 m, 0,16 bei 4,3 m). So hat jeder Effekt am Rand seine eigene
// Stärke und klingt nach dem Ring in eigener Zeit aus.
__katalog.welle = (() => {
  const L = __katalog.lib, { T, D } = L;
  const SPEED = 6.5, REACH = L.PLATE * 0.72;
  // x: Sekunden seit Start des Rings (99: Ruhe, vor dem ersten Lösen), y: frei laufende Zeit (s)
  const uWave = { value: new T.Vector4(99, 0, 0, 0) };
  const st = { start: null, wallStart: null, fix: null };
  function tick() {
    const s = L.shock.uShock.value, now = performance.now();
    uWave.value.y = (now / 1000) % 600;
    if (st.fix !== null) { // Standbild zum Prüfen: Ring und Uhr auf die Zeit fix (s)
      const r = Math.max(0, st.fix) * SPEED, fade = Math.max(0, 1 - r / REACH);
      s.set(r, st.fix >= 0 ? fade * fade : 0, 0.16 * (1 + r * 0.12));
      uWave.value.x = st.fix;
      return;
    }
    if (s.y > 0) {
      // solange der Ring läuft, genau seine Zeit (Radius / Tempo); danach läuft die Uhr von seinem Start weiter
      const start = now - (s.x / SPEED) * 1000;
      if (st.start === null || Math.abs(start - st.start) > 250) st.wallStart = Date.now() - (s.x / SPEED) * 1000;
      st.start = start;
    }
    uWave.value.x = st.start === null ? 99 : Math.min(99, (now - st.start) / 1000);
  }
  const prev = D.scene.onBeforeRender;
  D.scene.onBeforeRender = function (...a) { prev?.apply(this, a); tick(); };

  // GLSL: Hash, Wertrauschen, Schillern (Dünnfilm-Farben)
  const GLSL = `
    float wHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float wNoise(vec2 p) {
      vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
      return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), u.x), mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float wFbm(vec2 p) { return wNoise(p) * 0.55 + wNoise(p * 2.07 + 13.1) * 0.3 + wNoise(p * 4.3 + 7.7) * 0.15; }
    vec3 wFilm(float h) { return 0.5 + 0.5 * cos(6.2831853 * (h + vec3(0.0, 0.33, 0.67))); }
    // Lichtnetz unter Wasser (Kaustik, nach «Tileable Water Caustic» von joltz0r/Dave Hoskins): helle Fäden 0..1
    float wCaustic(vec2 uv, float time) {
      vec2 p = uv * 6.28318 - 250.0, i = p;
      float c = 1.0;
      for (int n = 0; n < 4; n++) {
        float t = time * (1.0 - (3.5 / float(n + 1)));
        i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
        c += 1.0 / length(vec2(p.x / (sin(i.x + t) / 0.005), p.y / (cos(i.y + t) / 0.005)));
      }
      c = 1.17 - pow(c / 4.0, 1.4);
      return clamp(pow(abs(c), 8.0), 0.0, 1.5);
    }`;

  /**
   * Boden-GLSL am Anfang (nach der Farbkarte): wp (Welt x, z), wd (Abstand zur Mitte), wbx (Kastenabstand), wAge
   * (Sekunden, seit der Ring hier war; < 0: noch nicht), wDir (Richtung nach aussen)
   */
  const PRE = `
    vec2 wp = (vUv - 0.5) * ${L.PLATE.toFixed(3)};
    float wd = length(wp), wbx = max(abs(wp.x), abs(wp.y));
    float wAge = uWave.x - wd / ${SPEED.toFixed(2)};
    vec2 wDir = wp / max(wd, 1e-3);`;

  /**
   * Brett bauen (Variante name aus dem Katalog) und dabei den Boden um die eigene Welle ergänzen. x: { pre (GLSL nach
   * der Farbkarte, sieht PRE), rough (nach der Rauheit), wave (ersetzt den Ring des Bretts; '' = keiner), after (vor dem
   * Tonemapping, läuft auch nach dem Ring), decl, uniforms, replace }
   */
  async function brett(name, x) {
    const orig = L.floor;
    L.floor = (o) => orig({
      ...o,
      decl: 'uniform vec4 uWave;\n' + GLSL + '\n' + (o.decl ?? '') + (x.decl ?? ''),
      uniforms: { ...(o.uniforms ?? {}), uWave, ...(x.uniforms ?? {}) },
      groove: (o.groove ?? 'diffuseColor.rgb *= 1.0 - floorGroove * 0.6;') + '\n' + PRE + '\n' + (x.pre ?? ''),
      grooveRough: (o.grooveRough ?? 'roughnessFactor = mix(roughnessFactor, 0.8, floorGroove);') + '\n' + (x.rough ?? ''),
      wave: x.wave ?? o.wave,
      after: (o.after ?? '') + '\n' + (x.after ?? ''),
      replace: [...(o.replace ?? []), ...(x.replace ?? [])],
    });
    try { return await __katalog.varianten[name](L); } finally { L.floor = orig; }
  }

  /**
   * n Teilchen als Billboards (Instanzen eines Vierecks), Bewegung ganz im Vertex-Shader. attrs: { name: [Grösse,
   * (i) → Zahl | [..]] }. vertex: GLSL, setzt vec3 pos (Welt), float size (Halbmass, m), float alpha, vec3 col, vec4 X;
   * sieht uWave, uShock, uShockColor und die Attribute. fragment: GLSL, setzt gl_FragColor aus vC (−1..1), vA, vCol, vX.
   */
  function teilchen(n, attrs, vertex, fragment, { blending = T.NormalBlending, uniforms = {}, order = 5 } = {}) {
    const g = new T.InstancedBufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    for (const [name, [size, fn]] of Object.entries(attrs)) {
      const arr = new Float32Array(n * size);
      for (let i = 0; i < n; i++) { const v = [fn(i)].flat(); for (let k = 0; k < size; k++) arr[i * size + k] = v[k] ?? 0; }
      g.setAttribute(name, new T.InstancedBufferAttribute(arr, size));
    }
    g.instanceCount = n;
    const decl = Object.entries(attrs).map(([nm, [s]]) => `attribute ${s === 1 ? 'float' : 'vec' + s} ${nm};`).join('\n');
    const head = `uniform vec4 uWave; uniform vec3 uShock; uniform vec3 uShockColor;\n${GLSL}\n`;
    const mat = new T.ShaderMaterial({
      uniforms: { uWave, uShock: L.shock.uShock, uShockColor: L.shock.uShockColor, ...uniforms },
      vertexShader: `${head}${decl}
        varying vec2 vC; varying float vA; varying vec3 vCol; varying vec4 vX;
        void main() {
          vec3 pos = vec3(0.0); float size = 0.05; float alpha = 0.0; vec3 col = vec3(1.0); vec4 X = vec4(0.0);
          ${vertex}
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          mv.xy += position.xy * size;
          gl_Position = alpha > 0.003 ? projectionMatrix * mv : vec4(0.0, 0.0, 2.0, 1.0);
          vC = position.xy; vA = alpha; vCol = col; vX = X;
        }`,
      fragmentShader: `${head}
        varying vec2 vC; varying float vA; varying vec3 vCol; varying vec4 vX;
        void main() { ${fragment} }`,
      transparent: true, depthWrite: false, blending,
    });
    const mesh = new T.Mesh(g, mat);
    mesh.frustumCulled = false; mesh.renderOrder = order; mesh.castShadow = false; mesh.receiveShadow = false;
    D.scene.add(mesh);
    return mesh;
  }
  /** Zufallspunkt im Kastenring a ≤ max(|x|, |z|) ≤ b (gleich verteilt) */
  function imRing(r, a, b) {
    let x, z, bx;
    do { x = (r() * 2 - 1) * b; z = (r() * 2 - 1) * b; bx = Math.max(Math.abs(x), Math.abs(z)); } while (bx < a || bx > b);
    return [x, z];
  }
  // Tropfen bzw. Korn: weicher runder Punkt
  const PUNKT = `float r = length(vC); if (r > 1.0) discard; gl_FragColor = vec4(vCol, (1.0 - smoothstep(0.3, 1.0, r)) * vA);`;
  return { uWave, st, tick, GLSL, PRE, SPEED, brett, teilchen, imRing, PUNKT };
})();
