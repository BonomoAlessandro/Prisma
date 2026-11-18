// Umgebung (PMREM) und Sternenhimmel mit Milchstrasse (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import '../texturen.js';
import { LAYER_NO_REFLECT, renderer, scene } from '../szene.js';
import { mulberry32 } from '../../zufall.js';
import { alsGlobal } from '../testschnittstelle.ts';

/* =====================================================================
   ENVIRONMENT (PMREM) — ein dunkler Raum mit wenigen Softboxen,
   damit Glas und Metall edle, ruhige Lichtkanten bekommen.
   ===================================================================== */

/**
 * Raum der Umgebung: Farbe unten (Boden), am Horizont und oben. Die Szene spiegelt einen dunklen Raum. Spiegelglas
 * bekommt einen helleren, silbrigen Raum: Es spiegelt sonst nur den fast schwarzen Boden und wirkt auf dem dunklen
 * Feld wie ein Loch oder ein ausgeschalteter Bildschirm.
 */
const ENV_ROOM = {
  scene: { floor: [0.002, 0.002, 0.002], low: [0.010, 0.009, 0.020], high: [0.030, 0.028, 0.060] },
  mirror: { floor: [0.07, 0.075, 0.10], low: [0.09, 0.09, 0.13], high: [0.05, 0.05, 0.09] },
};

/** pmrem: ein PMREMGenerator für beide Räume (sein Blur-Shader wird so nur einmal übersetzt), gibt der Aufrufer frei */
function buildEnvironment(roomColors, pmrem) {
  const envScene = new THREE.Scene();

  const room = new THREE.Mesh(
    new THREE.SphereGeometry(30, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        uFloor: { value: new THREE.Vector3(...roomColors.floor) },
        uLow: { value: new THREE.Vector3(...roomColors.low) },
        uHigh: { value: new THREE.Vector3(...roomColors.high) },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uFloor, uLow, uHigh; varying vec3 vDir; void main(){
        float h = vDir.y;
        vec3 col = mix(uLow, uHigh, smoothstep(-0.2, 0.9, h));
        col = mix(col, uFloor, smoothstep(0.0, -0.6, h));
        gl_FragColor = vec4(col, 1.0);
      }`,
    })
  );
  envScene.add(room);

  const panel = (w, h, pos, color, intensity) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
    );
    m.position.copy(pos);
    m.lookAt(0, 0, 0);
    envScene.add(m);
  };
  panel(14, 7, new THREE.Vector3(0, 16, 2), 0xfff4ea, 3.2);     // grosse Deckensoftbox
  panel(2.2, 16, new THREE.Vector3(-15, 5, -3), 0xdfe4ff, 0.55);  // kühler Streifen links
  panel(2.2, 16, new THREE.Vector3(15, 5, -5), 0xe4dcff, 0.45);   // violetter Streifen rechts
  panel(10, 2.5, new THREE.Vector3(0, 4, -16), 0x9a90e0, 0.5);   // Hinterkante
  panel(6, 2, new THREE.Vector3(4, 2, 15), 0xffe2c8, 0.6);       // warmes Fülllicht vorne

  return pmrem.fromScene(envScene, 0.035).texture;
}

// Beide Umgebungen (scene.environment, MAT.mirror.envMap) baut der Seitenstart in eigenen Aufgaben (seitenstart, am Ende
// des Scripts), vor dem Anstossen der Programme: Bis dahin zeichnet und übersetzt nichts die Szene.

/* =====================================================================
   HINTERGRUND — Sternenhimmel mit Milchstrasse
   Die Kamera blickt schräg von oben (im Hochformat steiler): Zu sehen sind vor allem Richtungen nach unten, rund um
   das schwebende Feld. In der Ausgangsansicht läuft die Milchstrasse deshalb als Band diagonal hinter dem Feld durch,
   ihr heller Kern liegt über dem Feld. Die Kamera kreist frei ums Feld – Sterne und Band gehen daher ganz herum.
   Im Band liegen Sternwolken, Staub und einzelne farbige Gasnebel; abseits davon die beiden Magellanschen Wolken,
   die man erst beim Drehen entdeckt. Alles bleibt dunkel und unter der Bloom-Schwelle, nur die hellsten Sterne glimmen beim Funkeln knapp darüber –
   Strahlen und Ziele bleiben vorne.
   ===================================================================== */

const SKY = {
  glow: 0.05,       // Helligkeit der Milchstrasse (linear)
  stars: 15000,     // Sterne rund um die Bandmitte (Kappe bis capDeg); der übrige Himmel kommt gleich dicht dazu
  capDeg: 80,
  bandArc: 1.4,     // Bogen des Bands in der Kappe (rad, je Seite der Mitte)
  bandStars: 0.5,   // Anteil der Sterne dicht am Band
  // Lage der Milchstrasse je Bildformat: Blickwinkel phi (von der Senkrechten, wie cameraRig.basePhi), Bandmitte so
  // viele Grad über der Blickrichtung, Neigung des Bands gegen die Waagrechte des Bildes, Kern entlang des Bands.
  // Hochformat: diagonal hinter dem Feld durch. Breitformat: Das Feld deckt die Mitte ab – das Band läuft flach
  // durch den Streifen über dem Feld, der Kern steht rechts oben. Dazwischen wird übergeblendet (updateSky).
  tall: { phi: 0.46, up: 11.5, tilt: 62, core: 9 },
  wide: { phi: 0.86, up: 13, tilt: 8, core: 20 },
  // Magellansche Wolken: Dreht man die Kamera um turn (°), stehen sie, wo in der Ausgangsansicht die Bandmitte steht,
  // nur up ° höher (Hochformat, Breitformat) – dort in jedem Bildformat 40–56° neben dem Band. Im Hochformat unter
  // der Platte (dort ist viel Himmel frei), im Breitformat im Streifen darüber. Halbachsen in rad, lange Achse in °.
  lmc: { turn: 205, up: [-24, -1], axes: [0.075, 0.05], angle: 25 },
  smc: { turn: 222, up: [-29, -5], axes: [0.04, 0.025], angle: -10 },
};
/**
 * Lage des Himmels für ein Bildformat als Drehung vom Himmels- ins Weltsystem. Himmelsachsen: x entlang des Bands,
 * y Normale der Band-Ebene (galaktische Breite), z Bandmitte.
 */
function skyFrame({ phi, up, tilt }) {
  const rad = THREE.MathUtils.degToRad;
  const view = new THREE.Vector3(0, -Math.cos(phi), -Math.sin(phi));
  const screenUp = new THREE.Vector3(0, Math.sin(phi), -Math.cos(phi)); // im Bild oben, senkrecht zur Blickrichtung
  const center = view.clone().multiplyScalar(Math.cos(rad(up))).addScaledVector(screenUp, Math.sin(rad(up)));
  const centerUp = screenUp.clone().multiplyScalar(Math.cos(rad(up))).addScaledVector(view, -Math.sin(rad(up)));
  const along = new THREE.Vector3(Math.cos(rad(tilt)), 0, 0).addScaledVector(centerUp, Math.sin(rad(tilt)));
  const normal = new THREE.Vector3().crossVectors(center, along);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(along, normal, center));
}
const skyTall = skyFrame(SKY.tall), skyWide = skyFrame(SKY.wide);

// Wertrauschen und fBm für die Shader von Himmel, Sonne und Planeten
const GLSL_NOISE = `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 1.7; a *= 0.5; }
    return v;
  }
  float fbm3(vec3 p) { // grob und günstiger, für grossflächige Muster
    return 0.5 * noise(p) + 0.25 * noise(p * 2.03 + 1.7) + 0.125 * noise(p * 4.12 + 5.1);
  }`;

const background = new THREE.Mesh(
  new THREE.SphereGeometry(80, 48, 24),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uSkyRot: { value: new THREE.Matrix3() }, // Welt → Himmel (updateSky)
      // Himmel → Welt im Hochformat: Die Wolken liegen fest am Band und sehen im Hochformat aus wie entworfen
      uCloudRot: { value: new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(skyTall)) },
      uCore: { value: new THREE.Vector3(0, 0, 1) }, // Richtung des Kerns im Himmelssystem (updateSky)
      uGlow: { value: SKY.glow },
      uPano: { value: 0 }, // 0 … 1: Platzhalter einer Skybox aus Blender statt Weltraum (skyTheme)
      uRings: { value: Array.from({ length: 9 }, () => new THREE.Vector3()) }, // dazu: Farbe nach Höhe (sky.rings)
      uPreview: { value: null }, uPreviewOn: { value: 0 }, // statt der Ringe: Vorschau des Panoramas (skyTheme.update)
      // Magellansche Wolken: Welt → Tangentialebene um die Mitte, in Halbachsen (updateSky)
      uLmc: { value: new THREE.Matrix3() },
      uSmc: { value: new THREE.Matrix3() },
    },
    // Richtung von der Kamera aus, damit der Himmel aus jeder Position gleich aussieht (unendlich weit weg).
    vertexShader: `varying vec3 vDir; void main(){
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vDir = normalize(wp.xyz - cameraPosition);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
    fragmentShader: `
      uniform float uGlow, uPano, uPreviewOn;
      uniform mat3 uSkyRot, uCloudRot, uLmc, uSmc;
      uniform vec3 uCore, uRings[9];
      uniform sampler2D uPreview;
      varying vec3 vDir;
      ${GLSL_NOISE}
      // Platzhalter einer Skybox aus Blender: Farbverlauf nach Höhe, im Panorama gemessen (9 Ringe von −90° bis 90°). Man
      // sieht ihn nur, solange das Panorama lädt oder überblendet; danach liegt das Panorama davor (SKYBOX).
      vec3 panoSky(vec3 d) {
        float x = (asin(clamp(d.y, -1.0, 1.0)) / 3.141592653589793 + 0.5) * 8.0;
        vec3 col = vec3(0.0);
        for (int k = 0; k < 9; k++) col += uRings[k] * max(0.0, 1.0 - abs(x - float(k)));
        // Vorschau: eine kleine Stufe des ganzen Bilds, sobald es dekodiert ist – wie das Panorama abgetastet, nur ohne
        // Parallaxe (unendlich weit weg), bis das Netz davor eingeblendet ist
        if (uPreviewOn > 0.0) {
          vec3 b = vec3(d.x, -d.z, d.y); // Spiel -> Blender
          vec2 uv = vec2(0.5 + atan(b.x, b.y) / 6.283185307179586, 1.0 - acos(clamp(b.z, -1.0, 1.0)) / 3.141592653589793);
          col = mix(col, texture2D(uPreview, uv).rgb, uPreviewOn);
        }
        return col;
      }
      // Magellansche Wolke: fleckig ausfransender Nebel aus Sternenlicht um die Mitte von m (siehe uLmc)
      vec3 satellite(mat3 m, vec3 d, vec3 seed, float pink) {
        vec3 l = m * d;
        if (l.z <= 0.0) return vec3(0.0);
        vec2 p = l.xy / l.z; // in Halbachsen
        float r2 = dot(p, p);
        if (r2 > 6.0) return vec3(0.0);
        float n = fbm(d * 38.0 + seed);
        float body = exp(-r2 * (1.9 - 1.6 * n)) * (0.3 + 1.4 * n * n);
        float bar = exp(-p.x * p.x * 1.6 - p.y * p.y * 14.0) * 0.5; // heller Balken längs der langen Achse
        vec2 k = p - vec2(0.45, 0.35);
        float knot = pink * exp(-dot(k, k) * 30.0) * (0.5 + n); // rosa Gasnebel am Rand (Tarantelnebel)
        return vec3(0.72, 0.78, 1.0) * (body + bar) + vec3(1.0, 0.36, 0.52) * knot;
      }
      void main(){
        vec3 d = normalize(vDir);
        // tiefer Raum: fast schwarz, ein Hauch Blau-Violett
        vec3 col = vec3(0.0012, 0.0011, 0.0028) + vec3(0.0016, 0.0012, 0.0038) * (0.5 + 0.5 * d.y);
        // Milchstrasse: Band um die Ebene y = 0 des Himmelssystems, wolkig, mit dunklen Staubstreifen und warmem Kern
        vec3 s = uSkyRot * d;
        float lat = s.y;
        float core = pow(max(dot(s, uCore), 0.0), 18.0);
        float width = 0.11 + 0.09 * core;
        float band = exp(-lat * lat / (width * width));
        if (band > 0.003 && uGlow > 0.0) { // uGlow 0: Sonnensystem, nur Sterne (skyTheme)
          vec3 q = (uCloudRot * s) * 4.5; // Wolken fest am Band (im Hochformat genau die Weltrichtung)
          float clouds = fbm(q);
          float dust = fbm(q * 2.4 + vec3(5.2, 1.3, 8.4));
          // Sternwolken: helle Klumpen heben sich ab
          float glow = band * (0.22 + 1.1 * clouds * clouds + 0.9 * smoothstep(0.5, 0.72, clouds)) + band * core * 1.1;
          float l = (lat - 0.25 * width * (clouds - 0.5)) / (0.45 * width); // kein pow(): Basis kann negativ sein
          float lane = exp(-l * l);
          // Staub: der lange Streifen in der Mitte, daneben einzelne dunkle Wolken
          float shade = 1.0 - 0.85 * lane * smoothstep(0.42, 0.68, dust) - 0.5 * (1.0 - lane) * smoothstep(0.56, 0.7, dust);
          glow *= shade;
          vec3 tint = mix(vec3(0.58, 0.64, 1.0), vec3(0.95, 0.88, 0.80), clamp(core * 1.2, 0.0, 1.0));
          col += tint * glow * uGlow;
          // Gasnebel nahe der Bandebene, selten und fädig: rosa leuchtender Wasserstoff, bläulich angestrahlter Staub
          float place = fbm3(q * 0.45 + vec3(11.3, 4.1, 7.9));
          float plane = exp(-lat * lat / (0.6 * width * width));
          float wisps = 0.3 + 2.2 * clouds * dust;
          vec3 neb = vec3(1.0, 0.32, 0.46) * smoothstep(0.56, 0.68, place) + vec3(0.36, 0.56, 1.0) * 0.6 * smoothstep(0.34, 0.26, place);
          col += neb * plane * wisps * shade * 2.4 * uGlow;
        }
        if (uGlow > 0.0) col += (satellite(uLmc, d, vec3(3.0, 9.0, 1.0), 1.0) + 0.8 * satellite(uSmc, d, vec3(7.0, 2.0, 5.0), 0.0)) * 1.8 * uGlow;
        // Skybox aus Blender: Platzhalter (davor das Panorama, siehe SKYBOX)
        if (uPano > 0.0) col = mix(col, panoSky(d), uPano);
        // Alpha 0 = Himmel: Der letzte Bildschritt lässt hier die Farbverschiebung am Bildrand weg (Sterne!)
        gl_FragColor = vec4(col, 0.0);
      }`,
  })
);
// Nach den undurchsichtigen Objekten zeichnen (bleibt vor allen transparenten): Wo Platte oder Elemente schon stehen,
// verwirft der Tiefentest die Pixel, bevor der teure Milchstrassen-Shader läuft.
background.renderOrder = 1000;
scene.add(background);

/**
 * Sterne: feste Punkte im Himmelssystem (immer gleich angeordnet), rund und kantengeglättet, am Band dichter; helle
 * funkeln leicht. Die Drehung ins Weltsystem setzt updateSky.
 */
function createStars() {
  // Zuerst die Kappe um die Bandmitte, wie für die Ausgangsansicht entworfen; danach der übrige Himmel (Band und
  // Rest) gleich dicht – die Kamera kreist frei ums Feld. Die Kappe zieht dieselben Zufallszahlen wie zuvor allein.
  const capCos = Math.cos(THREE.MathUtils.degToRad(SKY.capDeg));
  const cap = SKY.stars;
  const band = Math.round(cap * SKY.bandStars * (Math.PI / SKY.bandArc - 1));
  const n = cap + band + Math.round(cap * (1 - SKY.bandStars) * (1 + capCos) / (1 - capCos));
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), info = new Float32Array(n * 4);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aStar', new THREE.BufferAttribute(info, 4));
  // Die Sterne selbst zieht fill, ein Generator mit yield je 2048 Sternen (der Seitenstart in Häppchen, vor dem ersten
  // Bild: am Stück 200 ms auf dem gedrosselten Handy; Ticket 10 der Leistung). Gerechnet wird in zieh, einer gewöhnlichen
  // Funktion: Eine Schleife im Generator selbst optimiert V8 nicht, sie lief zwei- bis dreimal langsamer.
  const rand = mulberry32(31);
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
  // Sternfarben von bläulich über weiss bis warm, mit Häufigkeit
  const TINTS = [[0.70, 0.80, 1.0, 0.2], [0.86, 0.91, 1.0, 0.3], [1.0, 1.0, 1.0, 0.25], [1.0, 0.91, 0.78, 0.17], [1.0, 0.76, 0.6, 0.08]];
  const d = new THREE.Vector3();
  const zieh = (from, to) => {
    for (let i = from; i < to; i++) {
      const inCap = i < cap;
      if (inCap ? rand() < SKY.bandStars : i < cap + band) {
        // entlang des Bands (in der Kappe bis ±bandArc, sonst der Rest des Kreises), Breite normalverteilt
        const u = rand() * 2 - 1;
        const s = inCap ? u * SKY.bandArc : Math.sign(u) * (SKY.bandArc + Math.abs(u) * (Math.PI - SKY.bandArc));
        const lat = gauss() * 0.055;
        d.set(Math.sin(s) * Math.cos(lat), Math.sin(lat), Math.cos(s) * Math.cos(lat));
      } else {
        do d.set(gauss(), gauss(), gauss()).normalize(); while (inCap ? d.z < capCos : d.z >= capCos);
      }
      d.toArray(pos, i * 3);
      const b = 0.05 + 0.85 * Math.pow(rand(), 8);          // die meisten schwach, wenige hell
      let r = rand(), t = 0;
      while (t < TINTS.length - 1 && r > TINTS[t][3]) r -= TINTS[t++][3];
      col.set(TINTS[t].slice(0, 3), i * 3);
      info.set([b, 1.1 + b * 2.6, rand(), b > 0.25 ? 1 : 0.25], i * 4); // Helligkeit, Grösse (px), Phase, Funkeln
    }
  };
  const fill = function* () {
    for (let i = 0; i < n; i += 2048) {
      zieh(i, Math.min(n, i + 2048));
      yield;
    }
    for (const a of Object.values(geo.attributes)) a.needsUpdate = true;
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() }, uFade: { value: 1 }, uHorizon: { value: 0 },
      uFrom: { value: 0 } },
    vertexShader: `
      attribute vec3 aColor;
      attribute vec4 aStar;
      uniform float uTime, uPixelRatio, uFade, uHorizon, uFrom;
      varying vec3 vColor;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position * 70.0, 1.0);
        float twinkle = 1.0 + aStar.w * 0.22 * sin(uTime * (0.6 + aStar.z * 1.4) + aStar.z * 40.0);
        // nur über dem Horizont, wo eine Skybox es verlangt (sky.starsAboveHorizon: darunter liegen Gelände und Nebel),
        // und erst ab der Höhe uFrom (Sinus von sky.starsFrom): Die Sterne liegen 70 m um die Kamera, das Netz eines
        // Panoramas verdeckt nur, was näher liegt; die obere Wand des Vulkans (70 … 99 m) bekäme sonst Sterne
        float above = mix(1.0, smoothstep(uFrom, uFrom + 0.12, normalize(mat3(modelMatrix) * position).y), uHorizon);
        vColor = aColor * aStar.x * twinkle * uFade * above;
        gl_PointSize = aStar.y * uPixelRatio;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float a = smoothstep(0.5, 0.1, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(vColor * a, 0.0);
      }`,
    transparent: true,
    depthWrite: false,
    // additiv, aber Alpha unverändert lassen: Alpha 0 markiert den Himmel (siehe Hintergrund)
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    fog: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = -99;
  points.layers.set(LAYER_NO_REFLECT);
  points.raycast = () => {};
  points.userData.fill = fill;
  return points;
}
const stars = createStars();
scene.add(stars);

/** Himmel aufs Bildformat ausrichten (0 = Hochformat, 1 = Breitformat; aus fitCameraDistance). */
function updateSky(wide) {
  stars.quaternion.slerpQuaternions(skyTall, skyWide, wide);
  const u = background.material.uniforms;
  u.uSkyRot.value.setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(stars.quaternion)).transpose();
  const core = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(SKY.tall.core, SKY.wide.core, wide));
  u.uCore.value.set(Math.sin(core), 0, Math.cos(core));
  const center = new THREE.Vector3(0, 0, 1).applyQuaternion(stars.quaternion); // Bandmitte in der Welt
  satelliteFrame(u.uLmc.value, center, SKY.lmc, wide);
  satelliteFrame(u.uSmc.value, center, SKY.smc, wide);
}

/** Matrix für satellite() im Shader: Welt → (lange Achse, kurze Achse) in Halbachsen und Abstand zur Mitte. */
function satelliteFrame(m, center, { turn, up, axes, angle }, wide) {
  const rad = THREE.MathUtils.degToRad, Y = new THREE.Vector3(0, 1, 0);
  const c = center.clone().applyAxisAngle(Y, rad(turn));
  let east = new THREE.Vector3().crossVectors(Y, c).normalize();
  const lift = rad(THREE.MathUtils.lerp(up[0], up[1], wide));
  c.multiplyScalar(Math.cos(lift)).addScaledVector(new THREE.Vector3().crossVectors(c, east), Math.sin(lift));
  east = new THREE.Vector3().crossVectors(Y, c).normalize();
  const north = new THREE.Vector3().crossVectors(c, east);
  const a = east.clone().multiplyScalar(Math.cos(rad(angle))).addScaledVector(north, Math.sin(rad(angle)));
  const b = new THREE.Vector3().crossVectors(c, a);
  m.set(a.x / axes[0], a.y / axes[0], a.z / axes[0], b.x / axes[1], b.y / axes[1], b.z / axes[1], c.x, c.y, c.z);
}

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  stars: () => stars,
});

export { background, buildEnvironment, ENV_ROOM, GLSL_NOISE, SKY, stars, updateSky };
