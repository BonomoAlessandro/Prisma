// V8 Drachenhort: das Brett ist der Schatz eines Drachen, der es mit seinen Krallen festhält. Das Feld ist eine
// dunkle Bronzeplatte mit eingeprägten Drachenschuppen und goldenen Linien, im Rand liegen Haufen aus Goldmünzen. Die
// Seiten sind Schuppenhaut, an jeder Ecke greifen drei Krallen von unten über die Kante. Lichtwelle: das Gold
// funkelt Münze für Münze auf, die Schuppen leuchten golden nach
__katalog.varianten.drachenhort = async (L) => {
  const { T, D, PLATE, HB, HP, THICK, fbm, noise, clamp, smooth, mix, mix3, rng } = L;
  const V = __katalog.vk, r = rng(901);
  const H0 = 4.62, pts = V.roundedSquare(H0, 0.22, 200);
  const RIM = HB + 0.22;
  // Schuppen: Reihen von Scheiben, die oberen Reihen liegen auf den unteren
  const SR = 0.17, SH = 0.115, SW = 0.34;
  function scale(x, z) {
    const j0 = Math.floor((z - SR) / SH), j1 = Math.ceil((z + SR) / SH);
    for (let j = j0; j <= j1; j++) {
      const off = (((j % 2) + 2) % 2) * SW / 2, i = Math.round((x - off) / SW);
      for (const ii of [i - 1, i, i + 1]) {
        const cx = ii * SW + off, cz = j * SH, d = Math.hypot(x - cx, z - cz) / SR;
        if (d < 1 && z <= cz + SR * 0.15) return { d, id: ii * 977 + j * 131 };
      }
    }
    return { d: 1, id: 0 };
  }
  const heap = (x, z) => {
    const box = Math.max(Math.abs(x), Math.abs(z));
    return smooth(RIM - 0.02, RIM + 0.2, box) * (0.03 + 0.15 * smooth(0.35, 0.75, fbm(x * 0.7, z * 0.7, 3, 902))) * smooth(H0 + 0.02, H0 - 0.08, box);
  };
  const s = L.surface(2048, (x, z) => {
    const sc = scale(x, z), t = L.noise(sc.id * 0.31, 0.7, 903);
    let c = mix3([0.26, 0.17, 0.09], [0.34, 0.23, 0.12], t);
    const edge = smooth(0.82, 0.97, sc.d);
    c = mix3(c, [0.5, 0.36, 0.16], edge * 0.6);
    c = mix3(c, [0.14, 0.09, 0.05], smooth(0.97, 1.0, sc.d));
    // unter den Münzen: Gold
    const box = Math.max(Math.abs(x), Math.abs(z));
    c = mix3(c, [0.62, 0.45, 0.16], smooth(RIM - 0.04, RIM + 0.04, box));
    return [c, mix(0.38, 0.25, edge), (1 - sc.d * sc.d) * 0.003 - smooth(0.97, 1, sc.d) * 0.001];
  }, ({ color, px }) => V.clip(color, px, pts), 0.0002);
  const em = V.maskFn(1024, (x, z) => { const sc = scale(x, z); return smooth(0.8, 0.97, sc.d) * (1 - smooth(0.97, 1, sc.d)); });
  const fm = D.floorMaterial;
  fm.metalness = 0.75; fm.alphaTest = 0.5;
  L.floor({
    map: s.map, rough: s.rough, normal: s.normal, normalScale: 1, roughness: 1, envMapIntensity: 2.0,
    groove: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.85, 0.62, 0.22), floorGroove * 0.85);',
    grooveRough: 'roughnessFactor = mix(roughnessFactor, 0.2, floorGroove);',
    inlay: 'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.85, 0.62, 0.22), floorInlay);',
    replace: [['float iw = 0.011;', 'float iw = 0.02;']],
    bevel: '', bevelRough: '', refl: 0.45,
    after: 'gl_FragColor.rgb += vec3(0.16, 0.1, 0.03) * floorGroove;',
    decl: 'uniform sampler2D uScale;', uniforms: { uScale: { value: em } },
    // Lichtwelle: die Schuppenränder leuchten golden auf
    wave: `
        float se = texture2D(uScale, vUv).r;
        float wide = exp(-pow((sd - uShock.x) / (uShock.z * 3.0), 2.0));
        float k = min(1.0, uShock.y * 3.0);
        gl_FragColor.rgb += (uShockColor * 0.4 + vec3(0.4, 0.28, 0.08)) * ring * k * 0.6;
        gl_FragColor.rgb += vec3(1.3, 0.9, 0.3) * max(se, floorGroove) * (wide + trail * 0.25) * k * 1.1;`,
  });
  L.hide('plateSides', 'plateTrim');
  L.skyBehind();
  // Seiten: Schuppenhaut, dunkelrot mit Bronzerändern
  const W = 4096, Hh = 128, cc = L.canvas(W, Hh), cx = cc.getContext('2d'), ci = cx.createImageData(W, Hh);
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
    const u = i / W * 37, v = j / Hh, sc = scale(u * 2, -v * 1.14); // Wand: v 0..2/3 = 0,38 m; Schuppen halb so gross
    const t = L.noise(sc.id * 0.17, 2, 904);
    let c = mix3([0.22, 0.05, 0.04], [0.32, 0.08, 0.05], t);
    c = mix3(c, [0.55, 0.36, 0.16], smooth(0.8, 0.96, sc.d) * 0.8);
    c = mix3(c, [0.05, 0.02, 0.02], smooth(0.96, 1, sc.d));
    const k = (j * W + i) * 4;
    ci.data[k] = c[0] * 255; ci.data[k + 1] = c[1] * 255; ci.data[k + 2] = c[2] * 255; ci.data[k + 3] = 255;
  }
  cx.putImageData(ci, 0, 0);
  const sideGeo = V.hullGeo(pts, [[-0.003, (x, z) => [x, z]], [-0.2, (x, z) => [x, z]], [-THICK, (x, z) => [x * 0.995, z * 0.995]]], { tip: [0, -THICK - 0.02, 0], flat: false });
  const skin = V.lavaMat({ map: V.htex(cc), roughness: 0.4, metalness: 0.3, envMapIntensity: 1.6 }, { down: 1.4, side: 0.8 });
  D.scene.add(new T.Mesh(sideGeo, skin));
  // Hügel unter den Münzen
  const hg = new T.PlaneGeometry(PLATE, PLATE, 220, 220); hg.rotateX(-Math.PI / 2);
  const hp = hg.attributes.position;
  for (let i = 0; i < hp.count; i++) hp.setY(i, heap(hp.getX(i), hp.getZ(i)) - 0.006);
  hg.computeVertexNormals();
  const heapMat = L.withWave(new T.MeshStandardMaterial({ color: 0x9a6a22, metalness: 0.7, roughness: 0.4, envMapIntensity: 2.0 }), '');
  heapMat.onBeforeCompile = ((o) => (sh, rr) => { o(sh, rr); sh.fragmentShader = sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\nif (max(abs(vW.x), abs(vW.z)) < ${(RIM - 0.03).toFixed(3)} || max(abs(vW.x), abs(vW.z)) > ${(H0 - 0.03).toFixed(3)}) discard;`); })(heapMat.onBeforeCompile);
  const heapM = new T.Mesh(hg, heapMat); heapM.receiveShadow = true; D.scene.add(heapM);
  // Münzen
  const coins = [];
  while (coins.length < 2200) {
    const x = (r() * 2 - 1) * (H0 - 0.05), z = (r() * 2 - 1) * (H0 - 0.05), box = Math.max(Math.abs(x), Math.abs(z));
    if (box < RIM || !V.inside(pts, x, z)) continue;
    coins.push([x, heap(x, z) + 0.002 + r() * 0.008, z]);
  }
  const cg = new T.CylinderGeometry(0.052, 0.052, 0.009, 16);
  const coinMat = L.withWave(new T.MeshStandardMaterial({ color: 0xe0a83c, metalness: 0.85, roughness: 0.28, envMapIntensity: 2.4 }), `
      {
        ${L.RING}
        float d = length(vI.xz);
        float hs = fract(sin(dot(vI.xz, vec2(12.9898, 78.233))) * 43758.5453);
        float glint = exp(-pow((d - uShock.x - (hs - 0.5) * 0.5) / 0.22, 2.0)) * step(0.45, hs);
        gl_FragColor.rgb += vec3(1.5, 1.15, 0.55) * glint * min(1.0, uShock.y * 3.0) * 1.2;
        gl_FragColor.rgb += diffuseColor.rgb * ${V.LAVA} * 0.12;
      }`);
  const inst = new T.InstancedMesh(cg, coinMat, coins.length);
  const M = new T.Matrix4(), Q = new T.Quaternion(), S1 = new T.Vector3(1, 1, 1), P = new T.Vector3(), E = new T.Euler(), C = new T.Color();
  coins.forEach(([x, y, z], i) => {
    P.set(x, y, z); Q.setFromEuler(E.set((r() - 0.5) * 0.9, r() * 6.3, (r() - 0.5) * 0.9));
    inst.setMatrixAt(i, M.compose(P, Q, S1));
    const t = r(); C.setRGB(mix(0.85, 1, t), mix(0.62, 0.78, t), mix(0.25, 0.4, t)); inst.setColorAt(i, C);
  });
  inst.castShadow = true; inst.receiveShadow = true;
  D.scene.add(inst);
  // Krallen: je Ecke drei, von unten über die Kante gekrümmt
  function talon(path, r0, segs = 28, rad = 9) {
    const curve = new T.CatmullRomCurve3(path.map((p) => new T.Vector3(...p)));
    const fr = curve.computeFrenetFrames(segs, false), pos = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, p = curve.getPointAt(t), rr = r0 * Math.pow(1 - t, 0.75) + 0.002;
      for (let k = 0; k < rad; k++) {
        const a = k / rad * Math.PI * 2;
        const n = fr.normals[i].clone().multiplyScalar(Math.cos(a) * rr).add(fr.binormals[i].clone().multiplyScalar(Math.sin(a) * rr * 0.8));
        pos.push(p.x + n.x, p.y + n.y, p.z + n.z);
      }
    }
    for (let i = 0; i < segs; i++) for (let k = 0; k < rad; k++) {
      const a = i * rad + k, b = i * rad + (k + 1) % rad, c = (i + 1) * rad + k, d = (i + 1) * rad + (k + 1) % rad;
      idx.push(a, c, b, b, c, d);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  const clawMat = V.lavaMat({ color: 0x1b1412, roughness: 0.22, metalness: 0.1, envMapIntensity: 2.2, side: T.DoubleSide }, { down: 1.6, side: 0.9 });
  const pawMat = V.lavaMat({ map: V.htex(cc), roughness: 0.45, metalness: 0.25, envMapIntensity: 1.6 }, { down: 1.6, side: 0.9 });
  // Profil einer Kralle: d = Abstand von der Kante nach aussen, y = Höhe
  const PROF = [[-0.5, -0.66], [-0.05, -0.48], [0.17, -0.2], [0.19, 0.07], [0.0, 0.18], [-0.28, 0.07]];
  const cAx = H0 - 0.22 + 0.22 * Math.SQRT1_2; // Ecke des gerundeten Quadrats auf der Diagonale
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    // drei Krallen: über die Kante x, über die Ecke, über die Kante z (Anker auf der Kante, Normale nach aussen)
    const anchors = [[H0, H0 - 0.62, 1, 0, 0.1], [cAx, cAx, Math.SQRT1_2, Math.SQRT1_2, 0.12], [H0 - 0.62, H0, 0, 1, 0.1]];
    for (const [ax, az, nx, nz, r0] of anchors) {
      const path = PROF.map(([d, y]) => [sx * (ax + nx * d), y, sz * (az + nz * d)]);
      const m = new T.Mesh(talon(path, r0), clawMat); m.castShadow = true; D.scene.add(m);
    }
    const paw = new T.Mesh(new T.SphereGeometry(1, 20, 14), pawMat);
    paw.scale.set(1.05, 0.32, 1.05); paw.position.set(sx * (H0 - 0.6), -0.62, sz * (H0 - 0.6));
    D.scene.add(paw);
  }
  return `Drachenhort (${coins.length} Münzen)`;
};
