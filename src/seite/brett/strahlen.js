// Strahlen, Lichtschein, Staub und Lichtblitze (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import { boardGroup } from './feld.js';
import { BOARD, CELL, IS_MOBILE, phasenZufall, PLATE, PLATE_RIM } from '../konfiguration.ts';
import { camera, LAYER_NO_REFLECT, renderer } from '../szene.js';
import { beamPointToWorld, COLOR_RGB, CUBE_FLOOR, normalToWorld } from './elemente.js';
import { mulberry32 } from '../../zufall.js';
import { alsGlobal } from '../testschnittstelle.ts';

/* =====================================================================
   STRAHLEN — Kern + Glow als Billboard-Kapseln (ein Draw-Call für alle),
   Lichtschein auf dem Boden, Staub im Strahl, Lichtblitze an Ereignissen.

   Jeder Abschnitt trägt seine eigene Wachstumsfront (Startweg + Geburtszeit)
   und ggf. eine Sterbezeit als Vertex-Attribut. Dadurch wachsen halb
   gewachsene Strahlen bei schnellen Folgeänderungen nahtlos weiter, und
   entfernte Abschnitte frieren ein und blenden aus – ohne Material-Klone.
   Annahme: Die Gruppen der Strahlen bleiben unbewegt oder werden über
   modelMatrix korrekt mitgeführt.
   ===================================================================== */

const BEAM = {
  revealSpeed: 30,     // Welteinheiten pro Sekunde
  coreWidth: 0.011,
  glowWidth: 0.054,
  glowGain: 1.15,      // farbiges Leuchten (Weiss bleibt bei 1)
  coreWhite: 0.06,     // Weissanteil im Kern farbiger Strahlen (früher 0.32: der Kern wirkte fast weiss)
  shade: 0.4,          // dunkler Saum ums Leuchten (beamShadeMaterial), Deckkraft in der Mitte
  shadeWidth: 0.13,
  quadWidth: 0.34,     // halbe Breite der Billboard-Fläche (Halo und Saum laufen an ihrem Rand auf null aus)
  floorWidth: 0.75,
  fadeOut: 0.22,       // Sekunden
  dustCount: IS_MOBILE ? 700 : 1600,
  // 2 vec4 pro Segment + Palette + Matrizen müssen unter MAX_VERTEX_UNIFORM_VECTORS bleiben (WebGL1: min. 128)
  maxDustSegments: renderer.capabilities.maxVertexUniforms >= 160 ? 48 : 32,
};

// Weglänge gehört zum Schlüssel: derselbe Abschnitt über einen neuen Weg ist ein neuer Abschnitt.
// Würfel-Level: mit Ebene y (im 2D-Feld undefined und damit gleich für alle)
const segmentKey = (s) => `${s.x0},${s.y0},${s.z0},${s.x1},${s.y1},${s.z1},${s.color},${s.dist0.toFixed(3)}`;
const eventKey = (e) => `${e.kind},${e.x},${e.y},${e.z},${e.color},${e.dist.toFixed(3)}`;

/** Position der Wachstumsfront eines Datensatzes zur Zeit t (Welteinheiten Weglänge). */
function frontAt(rec, t) {
  const tt = rec.death >= 0 ? Math.min(t, rec.death) : t;
  return rec.start + BEAM.revealSpeed * (tt - rec.birth);
}
/** Ausblendfaktor 1 → 0 nach dem "Tod" eines Datensatzes. */
function fadeAt(rec, t) {
  if (rec.death < 0) return 1;
  const f = Math.max(0, 1 - (t - rec.death) / BEAM.fadeOut);
  return f * f;
}

/*
 * Ausgleich je Farbe [Breite, Leuchten, Kern], damit alle Strahlen gleich dick wirken (Wunsch 10.11.2026: Blau wirkte
 * viel dünner als Grün). Bei gleicher Breite im Shader wirken dunkle Farben dünner: Ihr Leuchten fällt früher unter die
 * Sichtbarkeit, und ihr Kern bleibt unter der Bloom-Schwelle, während Grün und Gelb aufblühen. Breite wirkt auf Kern,
 * Leuchten und Saum, Leuchten auch auf den Schein auf dem Brett. Abgeglichen an sieben parallelen Strahlen vor
 * Milchstrasse, Strand und Dorf, Desktop und Handy (Breite quer zum Strahl, Perspektive herausgerechnet).
 */
const BEAM_EVEN = {
  1: [1.35, 1.18, 1.12], // Rot
  2: [1, 1, 1],          // Grün
  3: [1, 1, 1],          // Gelb
  4: [1.5, 1.3, 1.25],   // Blau
  5: [1.1, 1.03, 1],     // Magenta
  6: [1.05, 1.03, 1],    // Cyan
  7: [1, 1, 1],          // Weiss
};

const BEAM_VERTEX_COMMON = `
  attribute vec3 aStart;
  attribute vec3 aEnd;
  attribute vec2 aCorner;   // x: -1 Anfang / +1 Ende · y: Seite
  attribute vec3 aColor;
  attribute vec2 aDist;     // x: Weglänge ab Quelle am Anfang · y: Länge
  attribute vec3 aLife;     // x: Startweg der Front · y: Geburtszeit · z: Sterbezeit (−1 = lebt)
  attribute vec3 aCap0;     // Schnittnormale am Anfang (im 2D-Feld waagrecht, im Würfel beliebig)
  attribute vec3 aCap1;     // … und am Ende
  attribute float aFade;    // Ausblendstrecke vor dem Ende (Welt, ab Plattenkante; 0 = hartes Ende)
  attribute vec3 aEven;     // Ausgleich der Farbe (BEAM_EVEN): Breite, Leuchten, Kern
  varying vec3 vEven;
  uniform float uHalfWidth;
  varying vec2 vLocal;      // x: entlang (Welt, 0..Länge, ausserhalb = Kappe) · y: quer
  varying vec3 vColor;
  varying vec2 vDist;
  varying vec3 vLife;
  varying vec3 vWorld;
  varying vec2 vCut;        // Abstand vor den Schnittebenen an Anfang (x) und Ende (y)
  varying float vFade;
  void passCaps(vec3 s, vec3 e, vec3 p) {
    vWorld = p;
    vFade = aFade;
    vEven = aEven;
    // Der Abstand zu einer Ebene ist linear in p – über die flache Kapsel interpoliert bleibt er exakt.
    vCut = vec2(dot(p - s, mat3(modelMatrix) * aCap0), dot(p - e, mat3(modelMatrix) * aCap1));
  }
`;

const BEAM_FRAGMENT_COMMON = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uFadeOut;
  uniform vec2 uCapSoft;    // Übergangsbreite des Schnitts an den Enden
  varying vec2 vLocal;
  varying vec3 vColor;
  varying vec2 vDist;
  varying vec3 vLife;
  varying vec3 vWorld;
  varying vec2 vCut;
  varying float vFade;
  varying vec3 vEven;

  float hash1(float n) { return fract(sin(n) * 43758.5453123); }
  float noise1(float x) {
    float i = floor(x), f = fract(x);
    return mix(hash1(i), hash1(i + 1.0), f * f * (3.0 - 2.0 * f));
  }
  // Abstand zur Kapsel, Weglänge am nächsten Punkt und Sichtbarkeit (Front + Ausblenden)
  float cutDist; // Abstand zur nächsten Schnittebene (Spiegelfläche, Strahlende)
  void beamDistance(out float d, out float pathDist, out float visible) {
    float along = clamp(vLocal.x, 0.0, vDist.y);
    d = length(vec2(vLocal.x - along, vLocal.y));
    pathDist = vDist.x + along;
    bool dying = vLife.z >= 0.0;
    float t = dying ? min(uTime, vLife.z) : uTime;
    float front = vLife.x + uSpeed * (t - vLife.y);
    visible = 1.0 - smoothstep(front - 0.25, front, pathDist);
    // Schnitt an Anfang und Ende: hinter Spiegelfläche bzw. jenseits des Endpunkts kein Leuchten
    float k0 = vCut.x;
    float k1 = vCut.y;
    cutDist = min(k0, k1);
    visible *= smoothstep(uCapSoft.x, uCapSoft.y, k0) * smoothstep(uCapSoft.x, uCapSoft.y, k1);
    // Auslaufen in die Ferne: über die letzte Strecke weich auf null
    if (vFade > 0.0) {
      float f = smoothstep(0.0, vFade, vDist.y - along);
      visible *= f * f;
    }
    if (dying) {
      float f = clamp(1.0 - (uTime - vLife.z) / uFadeOut, 0.0, 1.0);
      visible *= f * f;
    }
  }
`;

const beamMaterialParams = (extraUniforms, vertexMain, fragment) => ({
  uniforms: Object.assign({
    uTime: { value: 0 },
    uSpeed: { value: BEAM.revealSpeed },
    uFadeOut: { value: BEAM.fadeOut },
    uHalfWidth: { value: BEAM.quadWidth },
    uCapSoft: { value: new THREE.Vector2(-0.006, 0.01) },
  }, extraUniforms),
  vertexShader: BEAM_VERTEX_COMMON + vertexMain,
  fragmentShader: fragment,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide, // Wicklung der Billboards hängt von Strahl- und Blickrichtung ab
  fog: false,
  extensions: { derivatives: true }, // fwidth() für die Kantenglättung des Kerns (WebGL1; WebGL2 hat es immer)
});

// Billboard-Kapsel um den Strahl, zur Kamera gedreht (Strahl und dunkler Saum)
const BEAM_BILLBOARD_MAIN = `
  void main() {
    vec3 s = (modelMatrix * vec4(aStart, 1.0)).xyz;
    vec3 e = (modelMatrix * vec4(aEnd, 1.0)).xyz;
    vec3 axis = e - s;
    float len = max(length(axis), 1e-4);
    vec3 dir = axis / len;
    vec3 base = aCorner.x < 0.0 ? s : e;
    vec3 c = cross(dir, normalize(cameraPosition - base));
    // Absicherung, falls der Strahl genau auf die Kamera zeigt
    vec3 side = length(c) < 1e-4 ? normalize(vec3(-dir.z, 0.0, dir.x) + 1e-5) : normalize(c);
    vec3 p = base + dir * aCorner.x * uHalfWidth + side * aCorner.y * uHalfWidth;
    vLocal = vec2(aCorner.x < 0.0 ? -uHalfWidth : len + uHalfWidth, aCorner.y * uHalfWidth);
    vColor = aColor;
    vDist = aDist;
    vLife = aLife;
    passCaps(s, e, p);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }`;

const beamMaterial = new THREE.ShaderMaterial(beamMaterialParams(
  {
    uCore: { value: BEAM.coreWidth },
    uGlow: { value: BEAM.glowWidth },
    uIntensity: { value: 1 },
    uCalm: { value: 0 }, // 1: ohne Fliessen und Energiepakete (Spiegelung, renderReflection)
  },
  BEAM_BILLBOARD_MAIN,
  BEAM_FRAGMENT_COMMON + `
  uniform float uCore;
  uniform float uGlow;
  uniform float uIntensity;
  uniform float uCalm;
  uniform float uHalfWidth;
  void main() {
    // Pixelgrösse vor discard bestimmen (Ableitungen nur in einheitlichem Kontrollfluss verlässlich)
    float px = length(vec2(dFdx(vLocal.y), dFdy(vLocal.y)));
    float d, pathDist, visible;
    beamDistance(d, pathDist, visible);
    if (visible <= 0.001) discard;

    // Fliessen: zwei gegenläufige Rauschbänder + seltene, wandernde Energiepakete
    float flow = 0.82
      + 0.12 * noise1(pathDist * 7.0 - uTime * 5.5)
      + 0.08 * noise1(pathDist * 19.0 + uTime * 3.1);
    // Pakete hellen nur den weichen Glow auf (der allein unter der Bloom-Schwelle bleibt; über dem Kern blüht es an
    // einem Paket so nur rund 10 % stärker): Früher hoben sie auch den Kern (bis 2,4fach) – der blühte an jedem
    // Paket zu einer Beule auf, und die wandernden Beulen liessen den Strahl wellig wirken, am stärksten bei flachem
    // Blick, wo die Pakete im Bild dicht aufeinander folgen.
    float packet = pow(max(0.0, sin(pathDist * 1.6 - uTime * 4.2)), 24.0) * 0.3;
    flow = mix(flow, 0.92, uCalm); // 0.92: Mittel des Fliessens
    packet *= 1.0 - uCalm;
    // Glow-Breite fest: Das frühere "Atmen" (Breite ±8 % entlang des Strahls, wandernd) wirkte auf scharfen
    // Bildschirmen wie Wellen – vor allem bei Strahlen quer zur Blickrichtung. Leicht schmaler als uGlow,
    // damit es im Mittel wie vorher aussieht.
    float gw = uGlow * 0.95 * vEven.x;

    // Kern nie schmaler als etwa ein Bildpunkt: Auf kleinen Schirmen (Handy) war er dünner als ein Pixel und
    // zerfiel je nach Winkel in Treppen und Lücken, die der Bloom noch verstärkte. Breiter heisst hier
    // gleich hell im Ganzen – die Spitze wird im selben Verhältnis gedämpft.
    // px (oben): Pixelgrösse aus der Querkoordinate vLocal.y (linear, ohne Knick) als echte Gradientenlänge.
    // fwidth(d) sprang an der Mittellinie (d = |y|) je 2×2-Pixelblock um bis zu das Doppelte – der Kern
    // pulsierte entlang schräger Strahlen und wirkte wellenförmig.
    float coreW = uCore * vEven.x;
    float cw = max(coreW, px * 1.5);
    float core = exp(-(d * d) / (cw * cw)) * (coreW / cw) * vEven.z;
    // Glow und Halo laufen vor Spiegelflächen und Enden aus: sonst legt sich der breite Saum
    // über die ganze Glasplatte bzw. den Edelstein und wirkt, als schiene Licht hindurch.
    // (den Lichtfleck auf der Glasfläche zeichnet beamView als eigenes, flaches Objekt)
    float nearCut = smoothstep(0.0, min(0.2, vDist.y * 0.3), cutDist);
    float glow = exp(-(d * d) / (gw * gw)) * mix(0.8, 1.0, nearCut);
    // am Rand der Billboard-Fläche auf null: Mit den breiteren dunklen Farben (BEAM_EVEN) bliebe sonst eine feine Kante
    float halo = exp(-d / (gw * 1.8)) * 0.05 * nearCut * smoothstep(uHalfWidth, uHalfWidth * 0.8, d);

    // Kern fast weiss nur bei weissem Licht; farbige Strahlen behalten einen satten Kern
    float whiteness = min(min(vColor.r, vColor.g), vColor.b);
    vec3 hot = mix(vColor, vec3(1.0), mix(${BEAM.coreWhite.toFixed(3)}, 0.6, whiteness));
    // Helle Farben (Weiss, Gelb, Grün; Cyan seit den satten Farben kaum noch) überschreiten die Bloom-Schwelle viel
    // stärker als Rot oder Blau – gedämpft, damit alle Strahlen gleich kräftig wirken.
    float bright = smoothstep(0.35, 0.95, dot(vColor, vec3(0.2126, 0.7152, 0.0722)));
    float gain = mix(${BEAM.glowGain.toFixed(3)}, 1.0, whiteness) * vEven.y; // Weiss bleibt, wie es ist
    vec3 col = vColor * (glow * mix(0.95, 0.75, whiteness) + halo) * flow * (1.0 + packet) * mix(1.0, 0.72, bright)
               * gain
             + hot * core * 3.0 * mix(1.0, 0.8, bright);
    col *= uIntensity * visible;
    gl_FragColor = vec4(col, 1.0);
  }`
));

// Dunkler Saum ums Leuchten, vor dem Strahl gezeichnet (Wunsch 10.11.2026, Variante «Dunkler Saum»). Additives Licht
// kann einen hellen Grund (Sand, Wiese) nur aufhellen, die Farbe geht dort im Weiss unter; der Saum dunkelt den Grund
// ums Leuchten ab (Ziel · (1 − a)), danach legt sich die Farbe darauf. Vor dunklem Himmel wirkt er kaum.
const beamShadeMaterial = new THREE.ShaderMaterial(Object.assign(beamMaterialParams(
  { uShade: { value: BEAM.shade }, uShadeWidth: { value: BEAM.shadeWidth } },
  BEAM_BILLBOARD_MAIN,
  BEAM_FRAGMENT_COMMON + `
  uniform float uShade;
  uniform float uShadeWidth;
  uniform float uHalfWidth;
  void main() {
    float d, pathDist, visible;
    beamDistance(d, pathDist, visible);
    if (visible <= 0.001) discard;
    float nearCut = smoothstep(0.0, min(0.2, vDist.y * 0.3), cutDist);
    float sw = uShadeWidth * vEven.x;
    // am Rand der Billboard-Fläche auf null (breiter Saum bei Blau, siehe BEAM_EVEN: sonst eine feine Kante)
    float a = uShade * exp(-(d * d) / (sw * sw)) * smoothstep(uHalfWidth, uHalfWidth * 0.8, d) * nearCut * visible;
    gl_FragColor = vec4(0.0, 0.0, 0.0, a);
  }`
), {
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.ZeroFactor,
  blendDst: THREE.OneMinusSrcAlphaFactor,
  blendSrcAlpha: THREE.ZeroFactor, // Alpha des Bildes bleibt (0 markiert den Himmel für die Aberration, BRUSH_MARK die
                                   // gemalten Ebenen)
  blendDstAlpha: THREE.OneFactor,
}));

// Bodenschein: flache Kapsel auf der Platte – das Licht "streift" den Stein.
const floorGlowMaterial = new THREE.ShaderMaterial(beamMaterialParams(
  // breiter Schein → weicherer Schnitt, sonst harte Kante quer zum Strahl
  { uFloorWidth: { value: BEAM.floorWidth }, uCapSoft: { value: new THREE.Vector2(-0.05, 0.15) } },
  `
  uniform float uFloorWidth;
  varying float vLift;
  void main() {
    // Würfel: Strahlen höherer Ebenen werfen schwächeren Schein (Tiefenhinweis); im 2D-Feld negativ, wirkt nicht
    vLift = (aCorner.x < 0.0 ? aStart.y : aEnd.y) - ${CUBE_FLOOR.toFixed(4)}; // unterste Würfelebene: 0, 2D: < 0
    vec3 s = (modelMatrix * vec4(aStart, 1.0)).xyz;
    vec3 e = (modelMatrix * vec4(aEnd, 1.0)).xyz;
    vec3 axis = e - s;
    float len = max(length(axis), 1e-4);
    vec3 dir = axis / len;
    vec3 side = cross(dir, vec3(0.0, 1.0, 0.0));
    // senkrechter Strahl (Würfel): keine Querrichtung – die Kapsel fällt auf dem Boden zur Linie zusammen, kein Schein
    side = dot(side, side) < 1e-6 ? vec3(1.0, 0.0, 0.0) : normalize(side);
    vec3 base = aCorner.x < 0.0 ? s : e;
    vec3 p = base + dir * aCorner.x * uFloorWidth + side * aCorner.y * uFloorWidth;
    vLocal = vec2(aCorner.x < 0.0 ? -uFloorWidth : len + uFloorWidth, aCorner.y * uFloorWidth);
    vColor = aColor;
    vDist = aDist;
    vLife = aLife;
    passCaps(s, e, p); // Schnitt am Strahl selbst, vor dem Absenken (Würfel: Normalen mit Höhenanteil)
    p.y = 0.004;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }`,
  BEAM_FRAGMENT_COMMON + `
  varying float vLift;
  void main() {
    float d, pathDist, visible;
    beamDistance(d, pathDist, visible);
    if (visible <= 0.001) discard;
    // nie über die Plattenkante hinaus
    float edge = ${(PLATE / 2).toFixed(4)} - max(abs(vWorld.x), abs(vWorld.z));
    visible *= smoothstep(0.0, 0.3, edge) * exp(-max(vLift, 0.0) * 0.45);
    float spill = exp(-(d * d) / 0.03) * 0.045 + exp(-d / 0.3) * 0.01;
    spill *= mix(1.0, 0.75, smoothstep(0.35, 0.95, dot(vColor, vec3(0.2126, 0.7152, 0.0722)))); // wie beim Strahl
    spill *= vEven.y; // Ausgleich der Farbe (BEAM_EVEN): dunkle Farben scheinen sonst kaum aufs Brett
    gl_FragColor = vec4(vColor * spill * visible, 1.0);
  }`
));

/** Baut die Kapsel-Geometrie für eine Liste von Abschnitts-Datensätzen. */
function buildBeamGeometry(records) {
  const n = records.length;
  const start = new Float32Array(n * 12), end = new Float32Array(n * 12);
  const corner = new Float32Array(n * 8), color = new Float32Array(n * 12);
  const dist = new Float32Array(n * 8), life = new Float32Array(n * 12);
  const cap0 = new Float32Array(n * 12), cap1 = new Float32Array(n * 12), fade = new Float32Array(n * 4);
  const even = new Float32Array(n * 12);
  const c0 = new THREE.Vector3(), c1 = new THREE.Vector3();
  const index = new Uint16Array(n * 6); // max. 256 Abschnitte × 4 Ecken < 65536
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  records.forEach((r, i) => {
    const s = r.seg, c = COLOR_RGB[s.color], ev = BEAM_EVEN[s.color];
    // Erst jenseits der Platte ausblenden: Weg bis zur Plattenkante entlang des Strahls (diagonal länger)
    const axis = Math.max(Math.abs(s.x1 - s.x0), Math.abs(s.z1 - s.z0)) / s.length;
    // Würfel: kein Plattenrand ringsum (Strahlen verlassen ihn auch nach oben) – ab der Würfelkante ausblenden
    const fadeLen = !s.fade ? 0 : s.y0 === undefined ? s.fade * CELL - PLATE_RIM / axis : s.fade * CELL;
    normalToWorld(s.n0, c0);
    normalToWorld(s.n1, c1);
    for (let k = 0; k < 4; k++) {
      const v = i * 4 + k;
      start[v * 3] = r.a.x; start[v * 3 + 1] = r.a.y; start[v * 3 + 2] = r.a.z;
      end[v * 3] = r.b.x; end[v * 3 + 1] = r.b.y; end[v * 3 + 2] = r.b.z;
      corner[v * 2] = corners[k][0]; corner[v * 2 + 1] = corners[k][1];
      color[v * 3] = c.r; color[v * 3 + 1] = c.g; color[v * 3 + 2] = c.b;
      dist[v * 2] = s.dist0 * CELL; dist[v * 2 + 1] = s.length * CELL;
      life[v * 3] = r.start; life[v * 3 + 1] = r.birth; life[v * 3 + 2] = r.death;
      fade[v] = fadeLen;
      even[v * 3] = ev[0]; even[v * 3 + 1] = ev[1]; even[v * 3 + 2] = ev[2];
      c0.toArray(cap0, v * 3);
      c1.toArray(cap1, v * 3);
    }
    index.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  });
  const geo = new THREE.BufferGeometry();
  // "position" wird nur für Bounding-Volumes gebraucht; die echte Lage entsteht im Shader.
  geo.setAttribute('position', new THREE.BufferAttribute(start, 3));
  geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
  geo.setAttribute('aEnd', new THREE.BufferAttribute(end, 3));
  geo.setAttribute('aCorner', new THREE.BufferAttribute(corner, 2));
  geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
  geo.setAttribute('aDist', new THREE.BufferAttribute(dist, 2));
  geo.setAttribute('aLife', new THREE.BufferAttribute(life, 3));
  geo.setAttribute('aCap0', new THREE.BufferAttribute(cap0, 3));
  geo.setAttribute('aCap1', new THREE.BufferAttribute(cap1, 3));
  geo.setAttribute('aFade', new THREE.BufferAttribute(fade, 1));
  geo.setAttribute('aEven', new THREE.BufferAttribute(even, 3));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  return geo;
}

/* ---------- Lichtblitze ---------- */

function createFlareTexture(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const h = size / 2;
  const g = ctx.createRadialGradient(h, h, 0, h, h, h);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.08, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.22)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.04)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  // Feiner Stern: zwei lange Strahlen (Kreuz) und vier kurze diagonale
  ctx.globalCompositeOperation = 'lighter';
  const ray = (angle, len, width, alpha) => {
    ctx.save();
    ctx.translate(h, h);
    ctx.rotate(angle);
    const lg = ctx.createLinearGradient(-len, 0, len, 0);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(-len, -width / 2, len * 2, width);
    ctx.restore();
  };
  ray(0, h * 0.98, size * 0.012, 0.9);
  ray(Math.PI / 2, h * 0.98, size * 0.012, 0.9);
  ray(Math.PI / 4, h * 0.7, size * 0.006, 0.45);
  ray(-Math.PI / 4, h * 0.7, size * 0.006, 0.45);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

const flareTexture = createFlareTexture(256);

/** Weicher, runder Lichtfleck für den Auftreffpunkt auf einer Spiegelfläche. */
function createSpotTexture(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const h = size / 2;
  const g = ctx.createRadialGradient(h, h, 0, h, h, h);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.2)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.03)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}
const spotTexture = createSpotTexture(128);
const SPOT_SIZE = 0.34;      // liegt sicher innerhalb der Glasfläche (0.87 × 0.55)
const SPOT_OFFSET = 0.009;   // knapp vor der Glasoberfläche (Glas: ±0.006)
const _spotTarget = new THREE.Vector3(), _spotNormal = new THREE.Vector3();
const spotGeometry = new THREE.PlaneGeometry(SPOT_SIZE, SPOT_SIZE);
const FLARE_STYLE = {
  reflect: { scale: 0.3, intensity: 2.2 },
  refract: { scale: 0.42, intensity: 2.4 },
  filter:  { scale: 0.3,  intensity: 1.8 },
  merge:   { scale: 0.45, intensity: 2.2 },
  hit:     { scale: 0.95, intensity: 3.2 },
  absorb:  { scale: 0.32, intensity: 1.0 },
  floor:   { scale: 0.32, intensity: 1.0 },
  edge:   { scale: 0.0,  intensity: 0.0 },
};
const WHITE = new THREE.Color(1, 1, 1);

/* ---------- Staub im Strahl ---------- */

function createDust(count) {
  const rand = mulberry32(11);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rand() - 0.5) * BOARD;
    pos[i * 3 + 1] = 0.12 + rand() * 0.72;
    pos[i * 3 + 2] = (rand() - 0.5) * BOARD;
    seed[i * 4] = rand() * 6.283;
    seed[i * 4 + 1] = 0.3 + rand() * 0.7;
    seed[i * 4 + 2] = rand();
    seed[i * 4 + 3] = rand();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));

  const N = BEAM.maxDustSegments;
  const palette = Array.from({ length: 8 }, (_, i) => (COLOR_RGB[i] ? COLOR_RGB[i].clone() : new THREE.Color(0, 0, 0)));
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uCount: { value: 0 },
      uSegA: { value: Array.from({ length: N }, () => new THREE.Vector4()) }, // xyz + Farbindex
      uSegB: { value: Array.from({ length: N }, () => new THREE.Vector4()) }, // xyz + Gewicht (Ausblenden)
      uPalette: { value: palette },
    },
    vertexShader: `
      #define N ${N}
      attribute vec4 aSeed;
      uniform float uTime, uPixelRatio;
      uniform int uCount;
      uniform vec4 uSegA[N];
      uniform vec4 uSegB[N];
      uniform vec3 uPalette[8];
      varying vec3 vColor;
      void main() {
        float ph = aSeed.x, sp = aSeed.y;
        // langsames Schweben mit zyklischem Auftrieb
        vec3 p = position;
        p.x += sin(uTime * 0.21 * sp + ph) * 0.18 + sin(uTime * 0.53 + ph * 3.0) * 0.04;
        p.z += cos(uTime * 0.17 * sp + ph * 1.7) * 0.18;
        p.y = 0.12 + mod(position.y - 0.12 + uTime * 0.02 * sp, 0.72);
        p = (modelMatrix * vec4(p, 1.0)).xyz;

        vec3 light = vec3(0.0);
        for (int i = 0; i < N; i++) {
          if (i >= uCount) break;
          vec3 a = uSegA[i].xyz;
          vec3 ab = uSegB[i].xyz - a;
          float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-5), 0.0, 1.0);
          vec3 q = a + ab * t - p;
          // Palette per Schleife, da dynamische Indizes in GLSL ES 1.0 nur eingeschränkt erlaubt sind
          vec3 col = vec3(0.0);
          for (int k = 1; k < 8; k++) if (float(k) == uSegA[i].w) col = uPalette[k];
          light += col * uSegB[i].w * exp(-dot(q, q) / 0.012);
        }
        float twinkle = 0.55 + 0.45 * sin(uTime * (1.5 + aSeed.z * 3.0) + ph * 5.0);
        vColor = light * twinkle;
        float lum = max(max(light.r, light.g), light.b);

        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = lum < 0.01 ? 0.0 : (2.0 + aSeed.w * 2.6) * uPixelRatio * (20.0 / -mv.z);
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.0, length(c));
        gl_FragColor = vec4(vColor * a * a * 3.0, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.layers.set(LAYER_NO_REFLECT); // in der Spiegelung kaum sichtbar, spart einen Pass
  points.raycast = () => {};
  return points;
}

/* ---------- Ansicht ---------- */

const beamView = {
  group: new THREE.Group(),
  beams: null,
  floor: null,
  shade: null,        // dunkler Saum (beamShadeMaterial)
  segRecords: [],     // lebende Abschnitte
  dyingSegs: [],      // ausblendende Abschnitte
  eventRecords: [],   // lebende Ereignisse
  dyingEvents: [],
  flares: [],
  spots: [],          // Lichtflecken auf Spiegelflächen
  dust: createDust(BEAM.dustCount),
  time: 0,
  settleAt: 0,        // Zeit, ab der keine Strahlen mehr wachsen oder ausblenden
  _toCam: new THREE.Vector3(),

  init() {
    boardGroup.add(this.group);
    this.group.add(this.dust);
  },

  _mesh(geo, mat, noReflect) {
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = 10;
    m.raycast = () => {};
    if (noReflect) m.layers.set(LAYER_NO_REFLECT);
    this.group.add(m);
    return m;
  },

  _rebuild() {
    if (this.beams) { this.group.remove(this.beams, this.floor, this.shade); this.beams.geometry.dispose(); }
    const geo = buildBeamGeometry(this.segRecords.concat(this.dyingSegs));
    // der dunkle Saum vor dem Strahl (nicht in der Spiegelung), auch vor dem Glas (renderOrder 5, ohne Tiefe): Liegt
    // ein Strahl dahinter, dunkelt er so nur den Grund ab, nicht die Glanzlichter von Prisma, Filter und Kombinator
    this.shade = this._mesh(geo, beamShadeMaterial, true);
    this.shade.renderOrder = 4.5;
    this.beams = this._mesh(geo, beamMaterial, false);
    this.floor = this._mesh(geo, floorGlowMaterial, true);
  },

  /** Neues Strahlergebnis übernehmen. instant = ohne Wachstums-Animation; delay = späterer Start neuer Strahlen. */
  update(result, instant = false, delay = 0) {
    const now = this.time;
    const prevSegs = new Map(this.segRecords.map(r => [r.key, r]));
    const prevEvents = new Map(this.eventRecords.map(r => [r.key, r]));

    // Neue Abschnitte starten an der frühesten Änderung – aber nie vor einer noch
    // wachsenden Front, sonst würden sie sich vom Strahl lösen.
    let freshStart = Infinity;
    for (const s of result.segments) if (!prevSegs.has(segmentKey(s))) freshStart = Math.min(freshStart, s.dist0 * CELL);
    for (const r of this.segRecords) {
      // Noch nicht geborene Abschnitte (Verzögerung) zählen mit ihrem Startpunkt, nicht mit einer
      // "negativen" Front – sonst summiert sich die Verzögerung bei schnellen Mehrfachklicks.
      const front = frontAt(r, Math.max(now, r.birth));
      if (front < (r.seg.dist0 + r.seg.length) * CELL) freshStart = Math.min(freshStart, front);
    }
    const freshLife = instant ? { start: 1e6, birth: now } : { start: freshStart, birth: now + delay };

    const carry = (prev, key) => {
      const old = prev.get(key);
      return old && !instant ? { start: old.start, birth: old.birth } : freshLife;
    };

    const nextSegs = result.segments.map((s) => {
      const key = segmentKey(s);
      const life = carry(prevSegs, key);
      return {
        seg: s, key, start: life.start, birth: life.birth, death: -1,
        a: beamPointToWorld(s.x0, s.y0, s.z0), b: beamPointToWorld(s.x1, s.y1, s.z1),
        end: (s.dist0 + s.length) * CELL,
      };
    });
    const nextEvents = result.events.map((e) => {
      const key = eventKey(e);
      const life = carry(prevEvents, key);
      return { ev: e, key, start: life.start, birth: life.birth, death: -1, worldDist: e.dist * CELL, pos: beamPointToWorld(e.x, e.y, e.z) };
    });

    // Entfallene Datensätze sterben jetzt und blenden aus (bereits ausblendende laufen weiter).
    const nextSegKeys = new Set(nextSegs.map(r => r.key));
    const nextEventKeys = new Set(nextEvents.map(r => r.key));
    const expire = (list) => list.filter(r => now - r.death < BEAM.fadeOut);
    this.dyingSegs = instant ? [] : expire(this.dyingSegs).concat(
      this.segRecords.filter(r => !nextSegKeys.has(r.key)).map(r => ({ ...r, death: now })));
    this.dyingEvents = instant ? [] : expire(this.dyingEvents).concat(
      this.eventRecords.filter(r => !nextEventKeys.has(r.key)).map(r => ({ ...r, death: now })));

    this.segRecords = nextSegs;
    this.eventRecords = nextEvents;
    this.maxEnd = Math.max(0, ...nextSegs.map(r => r.end));
    // bis hierhin wachsen Strahlen oder blenden aus (so lange bleibt die Hauptschleife wach, siehe sceneLoop.pending)
    const grow = instant ? 0 : Math.max(0, this.maxEnd - Math.min(freshStart, this.maxEnd)) / BEAM.revealSpeed;
    this.settleAt = Math.max(this.settleAt, now + delay + grow + BEAM.fadeOut);
    this._rebuild();
    this._syncFlares();
  },

  /** Alles vergessen (Levelwechsel): neue Strahlen wachsen danach frisch von den Quellen aus. */
  reset() {
    this.segRecords = []; this.dyingSegs = [];
    this.eventRecords = []; this.dyingEvents = [];
  },

  /** Ist ein Datensatz (Abschnittsende oder Ereignis) von seiner Front schon erreicht? */
  revealed(rec, dist) {
    return frontAt(rec, this.time) >= dist;
  },

  _syncFlares() {
    const all = this.eventRecords.concat(this.dyingEvents).filter(r => FLARE_STYLE[r.ev.kind].scale > 0);
    while (this.flares.length < all.length) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: flareTexture, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false,
      }));
      s.renderOrder = 11;
      s.raycast = () => {};
      // Nicht in der Bodenspiegelung: Versatz und Sichtseite gelten für die Hauptkamera,
      // gespiegelt lägen die Blitze auf der falschen Seite des Spiegels.
      s.layers.set(LAYER_NO_REFLECT);
      s.userData.phase = phasenZufall() * 10;
      s.userData.pop = 0;
      this.group.add(s);
      this.flares.push(s);
    }
    const perPlace = new Map(); // Blitze am selben Ort (z. B. drei Farben in einen Kombinator)
    const placeKey = (ev) => ev.x + ',' + ev.y + ',' + ev.z + ',' + ev.kind;
    for (const r of all) { const k = placeKey(r.ev); perPlace.set(k, (perPlace.get(k) || 0) + 1); }
    this.flares.forEach((s, i) => {
      const rec = all[i];
      if (rec) s.userData.share = 1 / Math.sqrt(perPlace.get(placeKey(rec.ev)));
      const prevKey = s.userData.rec && s.userData.rec.key;
      s.visible = !!rec;
      s.userData.rec = rec || null;
      // Gleicher Blitz an gleicher Stelle behält seinen Zustand, sonst neu aufblühen
      if (rec && prevKey !== rec.key) s.userData.pop = this.revealed(rec, rec.worldDist) && rec.birth < this.time ? 1 : 0;
    });

    // Auftreffpunkte: flach auf der getroffenen Seite der Spiegelfläche, nur von vorn sichtbar
    // und tiefengetestet – so wirkt das Glas angestrahlt, ohne dass Licht hindurchscheint.
    // Nur lebende Treffer: ein ausblendender Spot behielte nach einer Drehung die alte Ausrichtung
    const hits = this.eventRecords.filter(r => r.ev.kind === 'reflect');
    while (this.spots.length < hits.length) {
      const m = new THREE.Mesh(
        spotGeometry,
        new THREE.MeshBasicMaterial({
          map: spotTexture, blending: THREE.AdditiveBlending, transparent: true,
          depthWrite: false, fog: false, side: THREE.FrontSide,
        })
      );
      m.renderOrder = 11;
      m.raycast = () => {};
      m.layers.set(LAYER_NO_REFLECT); // gespiegelt wäre der Fleck heller als die weichen Spiegelstrahlen
      m.userData.pop = 0;
      this.group.add(m);
      this.spots.push(m);
    }
    this.spots.forEach((m, i) => {
      const rec = hits[i];
      const prevKey = m.userData.rec && m.userData.rec.key;
      m.visible = !!rec;
      m.userData.rec = rec || null;
      if (!rec) return;
      if (prevKey !== rec.key) m.userData.pop = this.revealed(rec, rec.worldDist) && rec.birth < this.time ? 1 : 0;
      const n = normalToWorld(rec.ev.normal, _spotNormal);
      m.position.copy(rec.pos).addScaledVector(n, SPOT_OFFSET);
      // Blickt der Fleck senkrecht nach oben oder unten (Würfel), braucht lookAt ein anderes "oben"
      m.up.set(0, Math.abs(n.y) > 0.99 ? 0 : 1, Math.abs(n.y) > 0.99 ? 1 : 0);
      m.lookAt(_spotTarget.copy(m.position).add(n));
    });
  },

  tick(t, dt) {
    this.time = t;
    beamMaterial.uniforms.uTime.value = t;
    floorGlowMaterial.uniforms.uTime.value = t;
    beamShadeMaterial.uniforms.uTime.value = t;

    // Vollständig ausgeblendete Abschnitte/Blitze aufräumen
    if (this.dyingSegs.length && this.dyingSegs.every(r => t - r.death >= BEAM.fadeOut)) {
      this.dyingSegs = [];
      this._rebuild();
    }
    if (this.dyingEvents.length && this.dyingEvents.every(r => t - r.death >= BEAM.fadeOut)) {
      this.dyingEvents = [];
      this._syncFlares();
    }

    // Lichtblitze: erscheinen, wenn die Front sie erreicht, dann sanftes Flackern
    const toCam = this._toCam;
    for (const s of this.flares) {
      if (!s.visible) continue;
      const rec = s.userData.rec;
      const style = FLARE_STYLE[rec.ev.kind];
      const on = this.revealed(rec, rec.worldDist);
      s.userData.pop = on ? Math.min(1, s.userData.pop + dt * 6) : 0;
      const p = s.userData.pop;
      const burst = p < 1 ? 1 + Math.sin(p * Math.PI) * 0.8 : 1; // kurzer Überschwinger
      const ph = s.userData.phase;
      const flicker = 0.88 + 0.08 * Math.sin(t * 9.1 + ph) + 0.04 * Math.sin(t * 23.7 + ph * 2.0);
      // Spiegel-Blitz nur von der getroffenen Seite sichtbar (nicht durch das Objekt hindurch)
      toCam.copy(camera.position).sub(rec.pos).normalize();
      const n = rec.ev.normal;
      // Ab einem deutlich frontalen Blick sichtbar; bei streifendem Blick würde der Blitz über
      // Rahmen und Stützen hinausragen (und beim Schweben der Kamera ein- und ausblenden).
      const side = n ? THREE.MathUtils.smoothstep(toCam.dot(normalToWorld(n, _spotNormal)), 0.3, 0.55) : 1;
      const fade = fadeAt(rec, t) * side;
      const scale = style.scale * p * burst * flicker * (0.4 + 0.6 * fadeAt(rec, t)) * (0.55 + 0.45 * side);
      s.scale.set(scale, scale, 1);
      s.material.rotation = Math.sin(t * 0.3 + ph) * 0.15;
      s.material.color.copy(COLOR_RGB[rec.ev.color]).lerp(WHITE, 0.35).multiplyScalar(style.intensity * flicker * fade * s.userData.share);
      // Richtung Kamera versetzt, damit Spiegelfläche/Edelstein den Blitz nicht halbiert
      s.position.copy(rec.pos).addScaledVector(toCam, 0.06);
    }

    for (const m of this.spots) {
      if (!m.visible) continue;
      const rec = m.userData.rec;
      m.userData.pop = this.revealed(rec, rec.worldDist) ? Math.min(1, m.userData.pop + dt * 6) : 0;
      const flicker = 0.92 + 0.08 * Math.sin(t * 7.3 + rec.worldDist * 3.0);
      m.material.color.copy(COLOR_RGB[rec.ev.color]).lerp(WHITE, 0.25)
        .multiplyScalar(1.6 * m.userData.pop * flicker);
    }

    this._updateDust(t);
  },

  /** Staub sieht nur die bereits sichtbaren (ggf. gekürzten) Abschnitte. */
  _updateDust(t) {
    const u = this.dust.material.uniforms;
    u.uTime.value = t;
    u.uPixelRatio.value = renderer.getPixelRatio();
    let n = 0;
    const lists = [this.segRecords, this.dyingSegs];
    for (const list of lists) {
      for (const r of list) {
        if (n >= BEAM.maxDustSegments) break;
        const d0 = r.seg.dist0 * CELL, len = r.seg.length * CELL;
        const visibleLen = Math.min(len, frontAt(r, t) - d0);
        const weight = fadeAt(r, t);
        if (visibleLen <= 0 || weight <= 0) continue;
        const f = visibleLen / len;
        u.uSegA.value[n].set(r.a.x, r.a.y, r.a.z, r.seg.color);
        u.uSegB.value[n].set(r.a.x + (r.b.x - r.a.x) * f, r.a.y, r.a.z + (r.b.z - r.a.z) * f, weight);
        n++;
      }
    }
    u.uCount.value = n;
  },
};
beamView.init();

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  beamView: () => beamView,
});

export { beamMaterial, beamShadeMaterial, beamView, buildBeamGeometry, floorGlowMaterial, spotTexture, WHITE };
