// Sonnensystem, Hintergrund der Planeten (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import { GLSL_NOISE } from './sterne.js';
import { camera, LAYER_NO_REFLECT, scene } from '../szene.js';

/* =====================================================================
   SONNENSYSTEM — Hintergrund der Planeten (aus dem Code, siehe skyTheme)
   Das Brett schwebt über der Sonne, die Planeten kreisen um beide. Grössen und Abstände sind gestaucht (sonst wären
   die inneren Planeten winzige Punkte und Neptun weit ausserhalb des Bildes), die Umlaufzeiten gestaffelt wie in
   echt, aber zusammengestaucht (Wurzel der echten Verhältnisse). Die äusseren Bahnen liegen tiefer: So ziehen alle
   Planeten auf der fernen Seite durch den Streifen über der Platte – im Hoch- wie im Breitformat. Alles berechnet,
   ohne Bilddateien; nicht in der Bodenspiegelung.
   ===================================================================== */

const SOLAR = {
  sunY: -6, sunRadius: 2.8,
  slope: 0.5,         // Bahnen sinken nach aussen: Höhe = -1.5 - slope * (Abstand - 7.6)
  mercuryPeriod: 60,  // s je Umlauf; die anderen nach der Wurzel der echten Umlaufzeiten
  // Bahnradius, Grösse, echte Umlaufzeit (Jahre), Anfangswinkel (°, 90 = hinter dem Feld), Bahnneigung (°),
  // Achsneigung (°), Eigendrehung (s, negativ = rückwärts)
  planets: [
    { name: 'Merkur', kind: 0, orbit: 7.6, size: 0.24, years: 0.24, phase: 160, incl: 7, tilt: 0, spin: 90 },
    { name: 'Venus', kind: 1, orbit: 9.0, size: 0.35, years: 0.62, phase: 20, incl: 3.4, tilt: 177, spin: -160 },
    { name: 'Erde', kind: 2, orbit: 10.6, size: 0.37, years: 1, phase: 70, incl: 0, tilt: 23, spin: 40 },
    { name: 'Mars', kind: 3, orbit: 12.2, size: 0.28, years: 1.88, phase: 235, incl: 1.9, tilt: 25, spin: 42 },
    { name: 'Jupiter', kind: 4, orbit: 15.5, size: 1.05, years: 11.86, phase: 118, incl: 1.3, tilt: 3, spin: 24 },
    { name: 'Saturn', kind: 5, orbit: 19.5, size: 0.95, years: 29.46, phase: 52, incl: 2.5, tilt: 27, spin: 26, ring: true },
    { name: 'Uranus', kind: 6, orbit: 23.5, size: 0.68, years: 84, phase: 300, incl: 0.8, tilt: 98, spin: -36 },
    { name: 'Neptun', kind: 7, orbit: 27, size: 0.66, years: 165, phase: 95, incl: 1.8, tilt: 28, spin: 34 },
  ],
  moon: { size: 0.1, distance: 0.75, period: 9 },
};

const solarUniforms = {
  uSun: { value: new THREE.Vector3(0, SOLAR.sunY, 0) },
  uFade: { value: 0 },  // 0 … 1 beim Überblenden (skyTheme)
  uTime: { value: 0 },
};

// Oberflächen nach Art: 0 Merkur/Mond, 1 Venus, 2 Erde, 3 Mars, 4 Jupiter, 5 Saturn, 6 Uranus, 7 Neptun.
// Gezeichnet im Objektsystem (dreht mit), beleuchtet von der Sonne; Atmosphären leuchten am Rand.
const PLANET_SHADER = {
  vertexShader: `varying vec3 vObj, vN, vPos;
    void main() {
      vObj = position;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vPos = wp.xyz;
      vN = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: `
    uniform vec3 uSun;
    uniform float uFade, uTime;
    uniform int uKind;
    varying vec3 vObj, vN, vPos;
    ${GLSL_NOISE}
    // Wolkenbänder der Gasriesen: Streifen nach Breite, verwirbelt
    vec3 bands(vec3 p, float n, float turb, vec3 dark, vec3 light) {
      float b = p.y * n + (fbm(p * vec3(2.5, 9.0, 2.5) + 4.0) - 0.5) * turb;
      return mix(dark, light, 0.5 + 0.5 * sin(b * 3.1416));
    }
    void main() {
      vec3 p = normalize(vObj);
      vec3 col, atm = vec3(0.0);
      if (uKind == 0) {
        col = vec3(0.42, 0.40, 0.38) * (0.55 + 0.7 * fbm(p * 7.0));
      } else if (uKind == 1) {
        col = mix(vec3(0.80, 0.66, 0.42), vec3(0.95, 0.88, 0.68), fbm(vec3(p.x * 2.0, p.y * 7.0, p.z * 2.0) + 2.0));
        atm = vec3(0.9, 0.8, 0.5) * 0.35;
      } else if (uKind == 2) {
        float h = fbm(p * 2.2 + vec3(1.7, 9.2, 4.4));
        vec3 ocean = mix(vec3(0.015, 0.05, 0.20), vec3(0.03, 0.14, 0.36), smoothstep(0.3, 0.5, h));
        vec3 land = mix(vec3(0.09, 0.24, 0.07), vec3(0.50, 0.40, 0.22), smoothstep(0.35, 0.65, fbm(p * 6.0)));
        col = mix(ocean, land, smoothstep(0.50, 0.53, h));
        col = mix(col, vec3(0.9), smoothstep(0.80, 0.86, abs(p.y) + 0.08 * (h - 0.5))); // Polkappen
        float a = uTime * 0.02; // Wolken ziehen langsam über die Oberfläche
        vec3 q = vec3(p.x * cos(a) - p.z * sin(a), p.y, p.x * sin(a) + p.z * cos(a));
        col = mix(col, vec3(0.92), 0.85 * smoothstep(0.52, 0.68, fbm(q * vec3(3.5, 6.0, 3.5) + 7.0)));
        atm = vec3(0.25, 0.45, 1.0) * 0.6;
      } else if (uKind == 3) {
        col = mix(vec3(0.66, 0.30, 0.14), vec3(0.38, 0.17, 0.10), smoothstep(0.45, 0.62, fbm(p * 3.0 + 5.0)));
        col = mix(col, vec3(0.9, 0.86, 0.82), smoothstep(0.90, 0.94, abs(p.y)));
        atm = vec3(0.8, 0.5, 0.4) * 0.15;
      } else if (uKind == 4) {
        col = bands(p, 9.0, 1.6, vec3(0.60, 0.42, 0.30), vec3(0.93, 0.87, 0.76));
        vec3 d = p - normalize(vec3(0.94, -0.36, 0.0)); // Grosser Roter Fleck
        col = mix(col, vec3(0.72, 0.30, 0.18), 0.9 * exp(-dot(d.xz, d.xz) / 0.012 - d.y * d.y / 0.004));
        atm = vec3(0.9, 0.8, 0.7) * 0.15;
      } else if (uKind == 5) {
        col = bands(p, 7.0, 0.8, vec3(0.74, 0.62, 0.42), vec3(0.93, 0.85, 0.64));
        atm = vec3(0.9, 0.8, 0.6) * 0.12;
      } else if (uKind == 6) {
        col = mix(vec3(0.52, 0.76, 0.80), vec3(0.62, 0.84, 0.86), 0.5 + 0.5 * sin(p.y * 10.0));
        atm = vec3(0.5, 0.85, 0.9) * 0.3;
      } else {
        col = bands(p, 8.0, 1.0, vec3(0.13, 0.24, 0.64), vec3(0.24, 0.42, 0.88));
        vec3 d = p - normalize(vec3(-0.6, -0.35, 0.7)); // dunkler Fleck
        col = mix(col, vec3(0.06, 0.10, 0.35), 0.8 * exp(-dot(d, d) / 0.01));
        atm = vec3(0.35, 0.55, 1.0) * 0.35;
      }
      vec3 N = normalize(vN), L = normalize(uSun - vPos), V = normalize(cameraPosition - vPos);
      float ndl = dot(N, L);
      float lit = clamp(ndl * 0.92 + 0.08, 0.0, 1.0); // etwas weicher Übergang zur Nachtseite
      float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.5) * smoothstep(-0.25, 0.4, ndl);
      gl_FragColor = vec4((col * (0.02 + 1.15 * lit) + atm * rim) * uFade, 1.0);
    }`,
};

const solar = (() => {
  const group = new THREE.Group();
  group.visible = false;
  const noPick = (o) => { o.layers.set(LAYER_NO_REFLECT); o.raycast = () => {}; o.frustumCulled = o.isMesh; return o; };

  // Sonne: brodelnde Oberfläche, zum Rand dunkler; hell genug für Bloom, liegt aber fast ganz hinter der Platte
  const sun = noPick(new THREE.Mesh(new THREE.SphereGeometry(SOLAR.sunRadius, 48, 32), new THREE.ShaderMaterial({
    uniforms: solarUniforms, fog: false,
    vertexShader: PLANET_SHADER.vertexShader,
    fragmentShader: `uniform float uFade, uTime;
      varying vec3 vObj, vN, vPos;
      ${GLSL_NOISE}
      void main() {
        vec3 p = normalize(vObj);
        float g = fbm(p * 6.0 + vec3(0.0, uTime * 0.04, 0.0));
        float mu = clamp(dot(normalize(vN), normalize(cameraPosition - vPos)), 0.0, 1.0);
        vec3 col = mix(vec3(1.0, 0.42, 0.10), vec3(1.0, 0.82, 0.50), g) * (1.3 + 1.3 * g) * (0.45 + 0.55 * sqrt(mu));
        gl_FragColor = vec4(col * uFade, 1.0);
      }`,
  })));
  sun.position.copy(solarUniforms.uSun.value);
  group.add(sun);

  // Korona: Leuchten um die Sonne, das rund um die Platte hervorscheint (Billboard, additiv, Alpha bleibt 0 = Himmel)
  const CORONA = 17; // halbe Breite des Billboards
  const corona = noPick(new THREE.Mesh(new THREE.PlaneGeometry(2 * CORONA, 2 * CORONA), new THREE.ShaderMaterial({
    uniforms: { ...solarUniforms, uRadius: { value: SOLAR.sunRadius / CORONA } },
    transparent: true, depthWrite: false, fog: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uFade, uTime, uRadius;
      varying vec2 vUv;
      ${GLSL_NOISE}
      void main() {
        vec2 c = vUv * 2.0 - 1.0;
        float r = length(c), x = max(r - uRadius, 0.0);
        float rays = 0.8 + 0.4 * noise(vec3(atan(c.y, c.x) * 3.0, r * 2.0 - uTime * 0.05, uTime * 0.03));
        float glow = (exp(-x * 10.0) * 0.9 + exp(-x * 4.5) * 0.12 * rays) * smoothstep(1.0, 0.6, r);
        gl_FragColor = vec4(vec3(1.0, 0.52, 0.2) * glow * uFade, 0.0);
      }`,
  })));
  corona.renderOrder = -98; // nach den Sternen
  group.add(corona);
  const coronaRay = new THREE.Vector3();

  const sphere = new THREE.SphereGeometry(1, 48, 32);
  const planetMaterial = (kind) => new THREE.ShaderMaterial({
    uniforms: { ...solarUniforms, uKind: { value: kind } }, fog: false, ...PLANET_SHADER,
  });
  const orbitY = (r) => -1.5 - SOLAR.slope * (r - 7.6);
  const deg = THREE.MathUtils.degToRad;
  const orbitPos = (pl, a, target) => target.set(pl.orbit * Math.cos(a),
    orbitY(pl.orbit) + pl.orbit * Math.sin(deg(pl.incl)) * Math.sin(a - pl.node), -pl.orbit * Math.sin(a));

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x8890b0, transparent: true, opacity: 0, depthWrite: false, fog: false,
    blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
  const planets = SOLAR.planets.map((cfg, i) => {
    const pl = { ...cfg, node: i * 1.3, rate: 2 * Math.PI / (SOLAR.mercuryPeriod * Math.sqrt(cfg.years / 0.24)) };
    pl.holder = new THREE.Group(); // läuft auf der Bahn
    const tilt = new THREE.Group();
    tilt.rotation.z = deg(cfg.tilt);
    pl.body = noPick(new THREE.Mesh(sphere, planetMaterial(cfg.kind)));
    pl.body.scale.setScalar(cfg.size);
    tilt.add(pl.body);
    if (cfg.ring) tilt.add(pl.ring = makeRing(cfg.size));
    pl.holder.add(tilt);
    group.add(pl.holder);
    // feine Bahnlinie
    const pts = [];
    for (let k = 0; k < 160; k++) pts.push(orbitPos(pl, k / 160 * 2 * Math.PI, new THREE.Vector3()));
    group.add(noPick(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lineMat)));
    return pl;
  });
  const earth = planets.find((p) => p.kind === 2);
  const moon = noPick(new THREE.Mesh(sphere, planetMaterial(0)));
  moon.scale.setScalar(SOLAR.moon.size);
  earth.holder.add(moon);

  /** Saturnring: Ringe mit Lücken (Cassini-Teilung), von der Sonne beleuchtet, mit dem Schatten des Planeten. */
  function makeRing(size) {
    const inner = size * 1.25, outer = size * 2.25;
    const mesh = noPick(new THREE.Mesh(new THREE.RingGeometry(inner, outer, 128, 1), new THREE.ShaderMaterial({
      uniforms: { ...solarUniforms, uCenter: { value: new THREE.Vector3() }, uPlanet: { value: size },
        uInner: { value: inner }, uOuter: { value: outer } },
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: `varying vec3 vLocal, vPos, vN;
        void main() {
          vLocal = position;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vPos = wp.xyz;
          vN = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0));
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `uniform vec3 uSun, uCenter;
        uniform float uFade, uPlanet, uInner, uOuter;
        varying vec3 vLocal, vPos, vN;
        void main() {
          float u = (length(vLocal.xy) - uInner) / (uOuter - uInner);
          float dens = (0.55 + 0.25 * sin(u * 47.0) + 0.2 * sin(u * 113.0 + 1.0)) * smoothstep(0.0, 0.06, u) * smoothstep(1.0, 0.9, u);
          dens *= 1.0 - 0.9 * smoothstep(0.62, 0.64, u) * smoothstep(0.70, 0.68, u); // Cassini-Teilung
          vec3 L = normalize(uSun - vPos);
          vec3 cp = uCenter - vPos;
          float t = dot(cp, L);
          float shade = (t > 0.0 && dot(cp, cp) - t * t < uPlanet * uPlanet) ? 0.12 : 1.0; // Schatten des Planeten
          vec3 col = mix(vec3(0.62, 0.54, 0.40), vec3(0.92, 0.85, 0.68), u) * (0.25 + 0.85 * abs(dot(normalize(vN), L))) * shade;
          gl_FragColor = vec4(col * uFade, dens * 0.9 * uFade);
        }`,
    })));
    mesh.rotation.x = -Math.PI / 2; // in die Äquatorebene
    return mesh;
  }

  return {
    group, corona, planets, lineMat,
    setFade(k) {
      solarUniforms.uFade.value = k;
      lineMat.opacity = 0.12 * k;
      group.visible = k > 0;
    },
    update(t) {
      solarUniforms.uTime.value = t;
      // Korona hinter die Platte schieben und im selben Mass vergrössern (gleich gross im Bild): Durch die
      // Sonnenmitte schnitte sie die Platte, ihr Leuchten läge dann auf deren hinterem Teil.
      coronaRay.subVectors(sun.position, camera.position);
      const dist = coronaRay.length(), push = 12;
      corona.position.copy(sun.position).addScaledVector(coronaRay, push / dist);
      corona.scale.setScalar((dist + push) / dist);
      corona.quaternion.copy(camera.quaternion);
      for (const pl of planets) {
        orbitPos(pl, deg(pl.phase) + pl.rate * t, pl.holder.position);
        pl.body.rotation.y = 2 * Math.PI * t / pl.spin;
        if (pl.ring) pl.body.getWorldPosition(pl.ring.material.uniforms.uCenter.value);
      }
      const m = 2 * Math.PI * t / SOLAR.moon.period;
      moon.position.set(Math.cos(m) * SOLAR.moon.distance, 0.12 * Math.sin(m), -Math.sin(m) * SOLAR.moon.distance);
    },
  };
})();
scene.add(solar.group);

export { solar };
