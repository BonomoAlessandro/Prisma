// V4 Amboss: das Brett ist die Bahn eines riesigen Ambosses, wie in der Schmiede des Vulkan. Das Feld ist
// geschliffener Stahl mit feinen Schleifspuren und Anreisslinien als Raster, im Rand Hammerschläge und Zunder, in einer
// Ecke Vierkant- und Lochloch. Darunter der Körper mit Taille und Füssen, auf dem Rand ein glühender Stab.
// Lichtwelle: ein Hammerschlag, weissglühender Ring mit Funkenflug, dahinter kühlt der Stahl dunkelrot ab
__katalog.varianten.amboss = async (L) => {
  const { T, D, PLATE, HB, HP, THICK, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.vk, r = rng(501);
  const hardy = { x: 4.5, z: -3.4, h: 0.15 }, pritchel = { x: 4.5, z: -2.55, r: 0.075 };
  const s = L.surface(2048, (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    const inF = 1 - smooth(HB + 0.06, HB + 0.3, box);
    // Schleifspuren: feine Bögen um wechselnde Mitten
    const cxs = Math.round(x / 1.6) * 1.6 + 0.5, czs = Math.round(z / 1.6) * 1.6 - 0.3;
    const sw = Math.sin(Math.hypot(x - cxs, z - czs) * 420 + noise(x * 3, z * 3, 502) * 6) * 0.5 + 0.5;
    const mott = fbm(x * 0.5, z * 0.5, 4, 503);
    let c = mix3([0.36, 0.36, 0.38], [0.45, 0.45, 0.47], mott);
    c = mix3(c, [0.55, 0.55, 0.57], sw * 0.15);
    let rough = mix(0.44, 0.56, mott), h = (sw - 0.5) * 0.00008;
    // Rand: Hammerschläge (flache Dellen) und Zunder (blauschwarz), an der Kante blank gerieben
    if (inF < 1) {
      const [e, id, f1] = V.cells(x, z, 0.16, 504);
      const dent = smooth(0.0, 0.1, f1);
      const scale = smooth(0.48, 0.62, fbm(x * 1.1, z * 1.1, 4, 505));
      let rim = mix3([0.3, 0.3, 0.32], [0.36, 0.36, 0.38], dent);
      rim = mix3(rim, [0.12, 0.125, 0.15], scale * 0.7);
      rim = mix3(rim, [0.45, 0.25, 0.12], smooth(0.62, 0.72, fbm(x * 2, z * 2, 3, 506)) * 0.5); // Rost
      const worn = smooth(HP - 0.08, HP - 0.01, box);
      rim = mix3(rim, [0.72, 0.72, 0.74], worn * 0.7);
      c = mix3(rim, c, inF);
      h += (1 - inF) * (-(1 - dent * dent) * 0.0035);
      rough = mix(mix(0.45, 0.7, scale), rough, inF);
    }
    return [c, rough, h];
  }, ({ color, height, px, m }) => {
    // Vierkantloch und Lochloch: dunkel, mit blanker Fase
    for (const ctx of [color, height]) {
      const isH = ctx === height;
      ctx.fillStyle = isH ? 'rgb(20,20,20)' : 'rgb(8,8,9)';
      ctx.strokeStyle = isH ? 'rgb(90,90,90)' : 'rgb(175,175,180)'; ctx.lineWidth = 0.03 * m;
      ctx.fillRect(px(hardy.x - hardy.h), px(hardy.z - hardy.h), 2 * hardy.h * m, 2 * hardy.h * m);
      ctx.strokeRect(px(hardy.x - hardy.h), px(hardy.z - hardy.h), 2 * hardy.h * m, 2 * hardy.h * m);
      ctx.beginPath(); ctx.arc(px(pritchel.x), px(pritchel.z), pritchel.r * m, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }, 0.0002);
  // Metall überall auf der Bahn (Löcher ausgenommen)
  const met = V.mask(512, (x, px, m) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, 512, 512); x.fillStyle = '#000';
    x.fillRect(px(hardy.x - hardy.h), px(hardy.z - hardy.h), 2 * hardy.h * m, 2 * hardy.h * m);
    x.beginPath(); x.arc(px(pritchel.x), px(pritchel.z), pritchel.r * m, 0, Math.PI * 2); x.fill();
  });
  // Glut um den Stab auf dem Rand
  const bar = { x0: -2.9, x1: -0.5, z: 4.5 };
  const heat = V.mask(512, (x, px, m) => {
    const g = x.createLinearGradient(px(bar.x0), 0, px(bar.x1), 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.6, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0.9)');
    x.filter = `blur(${0.08 * m}px)`; x.fillStyle = g;
    x.fillRect(px(bar.x0), px(bar.z - 0.14), (bar.x1 - bar.x0 + 0.15) * m, 0.28 * m); x.filter = 'none';
  });
  const fm = D.floorMaterial;
  fm.metalnessMap = met; fm.metalness = 0.7;
  fm.emissiveMap = heat; fm.emissive.setRGB(0.6, 0.12, 0.02);
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 1.3,
    groove: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.86, 0.88), floorGroove * 0.6);',
    grooveRough: 'roughnessFactor = mix(roughnessFactor, 0.15, floorGroove);',
    inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.58, 0.3), floorInlay);',
    inlayRough: 'roughnessFactor = mix(roughnessFactor, 0.25, floorInlay);',
    bevel: '', bevelRough: '', refl: 0.6,
    // Lichtwelle: Hammerschlag; weissglühender Ring, Funken fliegen nach aussen, dahinter dunkelrot abkühlend
    wave: `
        vec2 pp = (vUv - 0.5) * ${PLATE.toFixed(3)};
        float k = min(1.0, uShock.y * 3.0);
        float ang = atan(pp.y, pp.x);
        float bin = floor(ang * 40.0);
        float hsh = fract(sin(bin * 91.7) * 43758.5453), hs2 = fract(sin(bin * 17.3) * 12345.678);
        float rel = sd - uShock.x - 0.1 - hs2 * 0.5;
        float streak = step(0.8, hsh) * smoothstep(0.3, 0.12, abs(fract(ang * 40.0) - 0.5))
          * smoothstep(0.0, 0.05, rel) * smoothstep(0.35 + hs2 * 0.6, 0.0, rel);
        float behind = clamp((uShock.x - sd) / 2.2, 0.0, 1.0) * step(sd, uShock.x);
        gl_FragColor.rgb += vec3(1.4, 1.1, 0.75) * ring * k * 0.85;
        gl_FragColor.rgb += vec3(1.3, 0.6, 0.15) * streak * k * 1.1;
        gl_FragColor.rgb += vec3(0.5, 0.08, 0.01) * (1.0 - behind) * step(0.001, behind) * k * 0.7;`,
  });
  // Bahn: Seiten geschliffen, oben eine blanke Fase
  const sideC = L.sideTex(2048, 64, (u, v) => {
    const sc = smooth(0.45, 0.62, fbm(u * 1.5, v * 3, 3, 507));
    let c = mix3([0.3, 0.3, 0.32], [0.08, 0.08, 0.1], sc);
    return mix3(c, [0.75, 0.75, 0.78], smooth(0.12, 0.04, v));
  });
  L.sides(V.lavaMat({ map: L.tex(sideC), metalness: 0.7, roughness: 0.45, envMapIntensity: 1.4 }, { down: 1.2, side: 0.6 }));
  L.hide('plateTrim');
  // Körper: Taille und Füsse
  const pts = V.roundedSquare(4.9, 0.1, 96);
  const prof = [[-THICK, 0.995], [-0.42, 0.965], [-0.62, 0.86], [-0.9, 0.72], [-1.15, 0.64], [-1.4, 0.66], [-1.62, 0.76], [-1.8, 0.88], [-1.9, 0.9], [-1.97, 0.88]];
  const rings = prof.map(([y, sc]) => [y, (x, z) => [x * sc, z * sc]]);
  const bodyGeo = V.hullGeo(pts, rings, { tip: [0, -1.97, 0], flat: false });
  const bc = L.canvas(1024, 128), bx = bc.getContext('2d'), bi = bx.createImageData(1024, 128);
  for (let j = 0; j < 128; j++) for (let i = 0; i < 1024; i++) {
    const u = i / 1024 * 36, v = j / 128, sc = fbm(u * 1.2, v * 5, 4, 508);
    const c = mix3([0.3, 0.3, 0.32], [0.42, 0.41, 0.41], sc), rs = smooth(0.6, 0.75, fbm(u * 2, v * 9, 3, 509));
    const cc = mix3(c, [0.35, 0.18, 0.09], rs * 0.6), k = (j * 1024 + i) * 4;
    bi.data[k] = cc[0] * 255; bi.data[k + 1] = cc[1] * 255; bi.data[k + 2] = cc[2] * 255; bi.data[k + 3] = 255;
  }
  bx.putImageData(bi, 0, 0);
  const body = new T.Mesh(bodyGeo, V.lavaMat({ map: V.htex(bc), metalness: 0.55, roughness: 0.5, envMapIntensity: 1.3 }, { down: 1.6, side: 0.5, lo: -2.0, hi: -0.4, spec: 0.7 }));
  body.castShadow = body.receiveShadow = true;
  D.scene.add(body);
  // glühender Stab auf dem Rand: links dunkelrot, rechts gelbweiss
  const barGeo = new T.BoxGeometry(bar.x1 - bar.x0, 0.11, 0.11, 24, 1, 1);
  const bcol = [], bp = barGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const t = (bp.getX(i) + (bar.x1 - bar.x0) / 2) / (bar.x1 - bar.x0);
    const c = t < 0.5 ? mix3([0.05, 0.01, 0.0], [0.6, 0.1, 0.01], t * 2) : mix3([0.6, 0.1, 0.01], [0.95, 0.62, 0.22], (t - 0.5) * 2);
    bcol.push(...c);
  }
  barGeo.setAttribute('color', new T.Float32BufferAttribute(bcol, 3));
  const barMat = new T.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.6, metalness: 0.4, emissive: 0xffffff });
  barMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 color;\nvarying vec3 vHot;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHot = color;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vHot;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vHot;');
  };
  const barM = new T.Mesh(barGeo, barMat);
  barM.position.set((bar.x0 + bar.x1) / 2, 0.055, bar.z); barM.rotation.y = 0.04; barM.castShadow = true;
  D.scene.add(barM);
  // Lichtwelle: Funken springen aus dem Ring hoch und nach aussen und verglühen im Flug
  {
    const q = rng(521);
    const sg = new T.BoxGeometry(0.012, 0.012, 0.1);
    const sp = V.streu(1400, q, (x, z, box, w) => ({ p: [x, 0.01, z], r: [w() * 6.3, w() * 6.3, w() * 6.3], s: 0.7 + w() * 0.8 }));
    D.scene.add(V.koerper(sg, new T.MeshBasicMaterial({ color: 0xffffff }), sp, { mode: 'rise', tail: 1.3, lift: 0.9, drift: 0.7, size: '(1.0 - ph * ph)', glow: `
      gl_FragColor.rgb = mix(vec3(1.6, 1.3, 0.8), vec3(1.2, 0.3, 0.03), vPhase);` }));
  }
  return 'Amboss';
};
