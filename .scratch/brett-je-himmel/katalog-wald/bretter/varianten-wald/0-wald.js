// Hilfen für den Wald-Katalog: Netze zusammenfügen, Wurzeln als Röhren, Streuen als Instanzen, Lichtwelle, die Körper
// wachsen lässt, Bilder mit Alpha aus Canvas
__katalog.wald = (() => {
  const L = __katalog.lib, { T, D } = L;
  /** Geometrien zu einer zusammenfügen (Attribute, die alle haben) */
  function merge(geos) {
    const list = geos.map((g) => (g.index ? g.toNonIndexed() : g));
    const names = Object.keys(list[0].attributes).filter((n) => list.every((g) => g.attributes[n]));
    const out = new T.BufferGeometry();
    for (const n of names) {
      const size = list[0].attributes[n].itemSize, total = list.reduce((s, g) => s + g.attributes[n].count, 0);
      const arr = new Float32Array(total * size);
      let o = 0;
      for (const g of list) { arr.set(g.attributes[n].array, o); o += g.attributes[n].array.length; }
      out.setAttribute(n, new T.BufferAttribute(arr, size));
    }
    return out;
  }
  /** Röhre längs Punkten [[x, y, z], …] mit Radius r0 → r1, Farbe je Röhre (Attribut color) */
  function tube(pts, r0, r1, seg = 32, radial = 7, color = [1, 1, 1]) {
    const curve = new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(...p)), false, 'catmullrom', 0.5);
    const g = new T.TubeGeometry(curve, seg, 1, radial, false);
    // Radius längs der Röhre verjüngen: Ringe um die Mittellinie skalieren
    const pos = g.attributes.position, frames = curve.computeFrenetFrames(seg, false), P = new T.Vector3();
    for (let i = 0; i <= seg; i++) {
      const t = i / seg, c = curve.getPointAt(t), r = r0 + (r1 - r0) * Math.pow(t, 0.8);
      for (let j = 0; j <= radial; j++) {
        const k = i * (radial + 1) + j;
        P.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c);
        pos.setXYZ(k, P.x, P.y, P.z);
      }
    }
    g.computeVertexNormals();
    const n = pos.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) col.set(color, i * 3);
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    g.deleteAttribute('uv');
    return g;
  }
  /** Instanzen: list = [{ p: [x, y, z], r: [ex, ey, ez], s: [sx, sy, sz] | s, c: [r, g, b] }] */
  function scatter(geo, mat, list) {
    const inst = new T.InstancedMesh(geo, mat, list.length);
    const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(), P = new T.Vector3(), E = new T.Euler();
    list.forEach((o, i) => {
      P.set(...o.p); Q.setFromEuler(E.set(...(o.r ?? [0, 0, 0])));
      if (Array.isArray(o.s)) S.set(...o.s); else S.setScalar(o.s ?? 1);
      inst.setMatrixAt(i, M.compose(P, Q, S));
      if (o.c) inst.setColorAt(i, new T.Color(o.c[0], o.c[1], o.c[2]));
    });
    inst.castShadow = true; inst.receiveShadow = true;
    return inst;
  }
  /**
   * Material, dessen Instanzen mit der Lichtwelle wachsen (Mittelpunkt der Instanz im Ring → Grösse 1, sonst rest).
   * keep: wie viel hinter dem Ring stehen bleibt (0..1).
   */
  function growMat(mat, { rest = 0, keep = 0, width = 2.5, glow = '' } = {}) {
    const key = 'katalog-grow-' + Math.random();
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, L.shock);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uShock;\nvarying float vGrow;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          {
            vec3 ic = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
            float d = length(ic.xz);
            float ring = exp(-pow((d - uShock.x) / (uShock.z * ${width.toFixed(2)}), 2.0));
            float behind = 1.0 - smoothstep(uShock.x - 0.2, uShock.x + 0.2, d);
            float k = min(1.0, uShock.y * 3.0);
            vGrow = clamp(max(ring, behind * ${keep.toFixed(2)}) * step(0.001, uShock.y) * k, 0.0, 1.0);
            transformed *= mix(${rest.toFixed(3)}, 1.0, vGrow);
          }`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vGrow;')
        .replace('#include <tonemapping_fragment>', `${glow}\n#include <tonemapping_fragment>`);
    };
    mat.customProgramCacheKey = () => key;
    return mat;
  }
  /** Bild mit Alpha aus Canvas 2D (w × h), draw(ctx, w, h) */
  function picture(w, h, draw, srgb = true) {
    const c = L.canvas(w, h), x = c.getContext('2d');
    draw(x, w, h);
    return L.tex(c, srgb);
  }
  /** Punkt im Rand (box zwischen a und b), gleich verteilt */
  function inRim(r, a = L.HB + 0.02, b = L.HP - 0.02) {
    let x, z, box;
    do { x = (r() * 2 - 1) * b; z = (r() * 2 - 1) * b; box = Math.max(Math.abs(x), Math.abs(z)); } while (box < a || box > b);
    return [x, z, box];
  }
  /**
   * Umriss in Polarform: R(a) als Tabelle mit n Winkeln. Rof(x, z) liefert den Radius des Umrisses in Richtung (x, z)
   * (linear zwischen den Tabellenwerten), pts den Umriss als [[x, z], …].
   */
  function polar(R, n = 720) {
    const tab = Array.from({ length: n + 1 }, (_, i) => R(i / n * Math.PI * 2));
    const Rof = (x, z) => {
      let a = Math.atan2(z, x); if (a < 0) a += Math.PI * 2;
      const f = a / (Math.PI * 2) * n, i = Math.floor(f);
      return tab[i] + (tab[i + 1] - tab[i]) * (f - i);
    };
    const pts = tab.slice(0, n).filter((_, i) => i % 2 === 0).map((r, i) => {
      const a = i * 2 / n * Math.PI * 2;
      return [Math.cos(a) * r, Math.sin(a) * r];
    });
    return { Rof, pts };
  }
  /** Radius des abgerundeten Quadrats (Halbmass h, Eckradius rc) in Richtung a */
  function rsq(a, h, rc) {
    const dx = Math.cos(a), dz = Math.sin(a);
    let lo = 0, hi = 8;
    for (let k = 0; k < 36; k++) {
      const m = (lo + hi) / 2, x = Math.abs(dx * m), z = Math.abs(dz * m);
      const qx = Math.max(x - (h - rc), 0), qz = Math.max(z - (h - rc), 0);
      const d = Math.max(x, z) <= h - rc ? Math.max(x, z) - h : Math.hypot(qx, qz) - rc;
      if (d < 0) lo = m; else hi = m;
    }
    return lo;
  }
  /** Seitenmaterial für W2.slab: Textur über wm Meter breit, auf die Tiefe depth gestreckt (oben = Zeile 0) */
  function slabTex(c, wm, depth) {
    const t = L.tex(c, true, true);
    t.repeat.set(1 / wm, 1 / depth); t.offset.set(0, 1 - 1 / depth);
    return t;
  }
  return { merge, tube, scatter, growMat, picture, inRim, polar, rsq, slabTex };
})();
