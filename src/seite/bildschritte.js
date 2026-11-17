// Beleuchtung und Bildschritte (Bloom, Pinsel, letzter Schritt) (Ticket 04 von .scratch/umbau/, bis dahin in
// index.html).
import './brett/brett.js';
import { IS_MOBILE, LOOK, PLATE, QUALITY } from './konfiguration.ts';
import { camera, discardDepth, HDR_SUPPORTED, HDR_TYPE, renderer, scene, SCENE_PREPASSES } from './szene.js';
import { glf, glm3, glv } from './himmel/skybox.js';

/* =====================================================================
   BELEUCHTUNG — Museumsspot als Hauptlicht
   ===================================================================== */

const hemi = new THREE.HemisphereLight(0x2a2d50, 0x050308, 0.08);
scene.add(hemi);

const keyLight = new THREE.SpotLight(0xfff1e2, 1.5, 0, 0.44, 1.0, 1);
keyLight.position.set(2.5, 15, 6);
keyLight.target.position.set(0, 0, 0);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(QUALITY.shadowSize, QUALITY.shadowSize);
keyLight.shadow.camera.near = 8;
keyLight.shadow.camera.far = 26;
keyLight.shadow.bias = -0.0002;
keyLight.shadow.normalBias = 0.02;
scene.add(keyLight, keyLight.target);

// Kein zusätzliches Gegenlicht: es glänzte bei flachem Blick als blauer Fleck auf dem polierten Stein.
// Lichtkanten an den Objekten liefern die Softboxen der Environment-Map.

/* =====================================================================
   POST-PROCESSING
   ===================================================================== */

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uExposure: { value: LOOK.exposure },
    uVignette: { value: LOOK.vignette },
    uAberration: { value: LOOK.aberration },
    uGrain: { value: LOOK.grain },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uTime, uExposure, uVignette, uAberration, uGrain;
    varying vec2 vUv;

    // ACES Filmic (identisch zu three.js ACESFilmicToneMapping)
    vec3 RRTAndODTFit(vec3 v) {
      vec3 a = v * (v + 0.0245786) - 0.000090537;
      vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
      return a / b;
    }
    vec3 acesFilmic(vec3 color) {
      const mat3 inM = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
      const mat3 outM = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
      color *= uExposure / 0.6;
      color = inM * color;
      color = RRTAndODTFit(color);
      color = outM * color;
      return clamp(color, 0.0, 1.0);
    }
    vec3 linearToSRGB(vec3 c) {
      return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
    }
    float hash(vec2 p) {
      p = fract(p * vec2(443.897, 441.423));
      p += dot(p, p.yx + 19.19);
      return fract((p.x + p.y) * p.x);
    }

    void main() {
      vec2 c = vUv - 0.5;
      float aspect = uResolution.x / uResolution.y;
      vec2 ca = c * vec2(aspect, 1.0);
      float r2 = dot(ca, ca);

      // Chromatische Aberration: sehr dezent und erst im äusseren Bildbereich – nicht am Himmel (Alpha 0), sonst
      // bekämen die Sterne einen Rot-Blau-Saum. Additives Licht kann Alpha über 1 heben: begrenzen.
      vec4 base = texture2D(tDiffuse, vUv);
      vec2 off = c * smoothstep(0.45, 0.95, r2) * uAberration * clamp(base.a, 0.0, 1.0);
      vec3 col;
      col.r = texture2D(tDiffuse, vUv - off).r;
      col.g = base.g;
      col.b = texture2D(tDiffuse, vUv + off).b;

      // Vignette
      float vig = smoothstep(1.05, 0.25, length(ca));
      col *= mix(1.0 - uVignette, 1.0, vig);

      col = acesFilmic(col);
      col = linearToSRGB(col);

      // Filmkorn (in den Mitteltönen am stärksten) + gleichzeitig Dithering gegen Banding
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      float n = hash(vUv * uResolution + fract(uTime * 7.31) * vec2(97.3, 61.7)) - 0.5;
      col += n * uGrain * (0.45 + 0.55 * (1.0 - abs(lum - 0.4) * 1.6));

      gl_FragColor = vec4(col, 1.0);
    }`,
};

/**
 * Pinselstriche über 3D-Ebenen einer Skybox (Baustein des Baukastens: Skybox-Feld brush, je Ebene brush: true; siehe
 * Kopf des Abschnitts SKYBOX). Blender malt das Panorama mit dem anisotropen Kuwahara-Filter seines Kompositors
 * (anime.stylize; Kyprianidis u. a. 2009, Gewichte als Polynome nach Kyprianidis u. a. 2010, Sektoren nach ihrer
 * Streuung gewichtet nach Kyprianidis 2011). Was das Spiel selbst zeichnet (nahe Pflanzen, Bäume, Felsen), fehlte er:
 * Palmwedel wirkten wie Kämme aus Einzelfiedern, gemalt sind es breite, gezackte, ruhig beleuchtete Flächen. Darum
 * derselbe Filter hier, nach dem Bild der Szene und vor dem Leuchten, nur wo diese Ebenen sind (ihre undurchsichtigen
 * Materialien schreiben Alpha BRUSH_MARK statt 1, mark) oder wohin er sie zieht: Lücken zwischen den Fiedern füllen
 * sich, dort mischt er wie Blender Hintergrund hinein. Einstellungen wie in anime.py (BRUSH_DEFAULT): size (Radius in
 * Grad; Blender nimmt px_per_deg × 0.28, so passt er zum gemalten Panorama), uniformity, sharpness, eccentricity, dazu
 * mobile (Stufe auf dem Handy statt QUALITY.brush: 2 oder 3 Bildpixel je Filterpixel, 0 aus).
 * Stufe { step, full } (QUALITY.brush, null aus): step × step Bildpixel je Filterpixel für Farben und Tensor; full:
 * gemalt in voller Auflösung (sonst in der des Filters, dann vergrössert)
 *  1. Farben wie im fertigen Bild (ACES und sRGB wie FinalShader, ohne Vignette; so filtert auch Blender) und Anteil
 *     Pflanze. Licht über der Bloom-Schwelle (Strahlen, Leuchtkörper) und additiv Überlagertes bleibt ungemalt.
 *  2. Strukturtensor (Sobel mit Gewichten für Drehsymmetrie, wie Blender).
 *  3. Filter: Tensor geglättet (uniformity), je Pixel eine Ellipse entlang der Kanten, 8 Sektoren; zurück auf
 *     Szenenwerte, vormultipliziert mit dem Deckungsgrad, über das Bild gelegt – ausser um das Brett: Ein Quader im
 *     Stencil schützt Brett, Elemente und Wasser dort, auch wo eine gemalte Ebene angrenzt.
 * Grösse der Striche: so gross in der Welt, wie Blender sie vom Mittelpunkt des Panoramas aus malte, also mal das
 * Verhältnis der Abstände Mittelpunkt / Kamera, gemittelt über die sichtbaren Objekte (vom Mittelpunkt aus 1).
 * Gerechnet wird nur im Ausschnitt um die sichtbaren Objekte (Hüllquader; die Ebenen stehen still).
 */
const BRUSH_MARK = 32;        // Alpha gemalter Ebenen (sonst 1; Himmel 0; additives Licht hebt es um je bis 1)
const BRUSH_DEFAULT = { size: 0.28, uniformity: 4, sharpness: 0.8, eccentricity: 1.0 };
const BRUSH_MAX_RADIUS = 12;  // Ausgabepixel; die Ellipse wird bis doppelt so lang
const BRUSH_FULL_MAX = 2.4e6; // grössere Bilder (Pixel) auch mit full in der Auflösung des Filters malen: Kosten

function createBrushPass(quality) {
  const pass = new THREE.Pass();
  pass.needsSwap = false;
  pass.supported = renderer.capabilities.isWebGL2 && HDR_SUPPORTED;
  const sources = new Set();
  let forced;        // Stufe von setLevel (Vergleich, Messung); undefined: QUALITY.brush bzw. mobile der Skybox
  let level = null;  // Stufe dieses Bilds
  let sized = 0;     // step, für den die Ziele bemessen sind
  const image = new THREE.Vector2(1, 1);
  // bilinear: der Filter und das Vergrössern lesen zwischen den Pixeln
  const target = () => new THREE.WebGLRenderTarget(1, 1, {
    type: HDR_TYPE, depthBuffer: false, generateMipmaps: false,
  });
  const colorRT = target(), tensorRT = target(), paintRT = target();

  // ACES wie der letzte Bildschritt (Belichtung LOOK.exposure) und zurück wie anime.aces_inverse
  const IN = [[0.59719, 0.35458, 0.04823], [0.07600, 0.90834, 0.01566], [0.02840, 0.13383, 0.83777]];
  const OUT = [[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]];
  const inverse = (rows) => {
    const m = new THREE.Matrix3().set(...rows.flat()).invert().elements; // spaltenweise
    return [0, 1, 2].map((r) => [0, 1, 2].map((c) => m[c * 3 + r]));
  };
  const COLOR_GLSL = `
      const mat3 ACES_IN = ${glm3(IN)}, ACES_OUT = ${glm3(OUT)};
      const mat3 ACES_IN_INV = ${glm3(inverse(IN))}, ACES_OUT_INV = ${glm3(inverse(OUT))};
      const float EXPOSURE = ${glf(LOOK.exposure / 0.6)};
      vec3 toDisplay(vec3 c) {
        vec3 v = ACES_IN * (c * EXPOSURE);
        v = (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.4329510) + 0.238081);
        v = clamp(ACES_OUT * v, 0.0, 1.0);
        return mix(v * 12.92, 1.055 * pow(v, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), v));
      }
      vec3 toScene(vec3 d) {
        d = mix(d / 12.92, pow((d + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), d));
        vec3 y = clamp(ACES_OUT_INV * d, 0.0, 1.0);
        vec3 a = 1.0 - 0.983729 * y, b = 0.0245786 - 0.4329510 * y, c = -0.000090537 - 0.238081 * y;
        vec3 x = (-b + sqrt(max(b * b - 4.0 * a * c, 0.0))) / (2.0 * max(a, 1e-4));
        return max(ACES_IN_INV * x, 0.0) / EXPOSURE;
      }`;
  const vertexShader = 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const shader = (uniforms, fragmentShader) => new THREE.ShaderMaterial({
    uniforms, vertexShader, fragmentShader, depthTest: false, depthWrite: false,
  });
  // vormultipliziert über das Bild (dessen Alpha bleibt), nicht wo der Quader ums Brett im Stencil steht. Ohne
  // stencilWriteMask 0: three setzt die Maske nur bei Materialien mit stencilWrite zurück, sie blieb auf 0 stehen, und
  // glClear löschte den Stencil im nächsten Bild nicht (der Schutz galt nur im ersten); Keep schreibt ohnehin nichts
  const OVER = {
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    stencilWrite: true, stencilFunc: THREE.NotEqualStencilFunc, stencilRef: 1,
  };
  const PLAIN = { blending: THREE.NoBlending, stencilWrite: false };

  // 1. Farben (Anzeige, sRGB-kodiert) und Anteil Pflanze; Alpha −1: Licht, bleibt ungemalt (als Probe zählt seine
  // Farbe: Kuwahara wählt ohnehin die ruhigen Sektoren, ein Strahl schmiert so kaum)
  const colorMat = shader({ tScene: { value: null }, uStep: { value: 1 } }, `
      uniform sampler2D tScene;
      uniform int uStep;
      ${COLOR_GLSL}
      void main() {
        ivec2 size = textureSize(tScene, 0), o = ivec2(gl_FragCoord.xy) * uStep;
        vec3 sum = vec3(0.0);
        float plant = 0.0;
        bool lit = false;
        for (int j = 0; j < uStep; j++) {
          for (int i = 0; i < uStep; i++) {
            vec4 c = texelFetch(tScene, min(o + ivec2(i, j), size - 1), 0);
            bool leaf = c.a > ${glf(BRUSH_MARK / 4)};
            // Licht (wie die Bloom-Schwelle) und was additiv darüber liegt
            lit = lit || dot(c.rgb, vec3(0.299, 0.587, 0.114)) > 1.0 || (!leaf && c.a > 1.02);
            sum += toDisplay(c.rgb);
            plant += leaf ? 1.0 : 0.0;
          }
        }
        float n = float(uStep * uStep);
        gl_FragColor = vec4(sum / n, lit ? -1.0 : plant / n);
      }`);

  // 2. Strukturtensor (xx, xy, yy)
  const tensorMat = shader({ tColor: { value: colorRT.texture } }, `
      uniform sampler2D tColor;
      vec3 at(ivec2 p, int x, int y) {
        return texelFetch(tColor, clamp(p + ivec2(x, y), ivec2(0), textureSize(tColor, 0) - 1), 0).rgb;
      }
      void main() {
        ivec2 p = ivec2(gl_FragCoord.xy);
        vec3 a = at(p, -1, -1), b = at(p, 0, -1), c = at(p, 1, -1), d = at(p, -1, 0), f = at(p, 1, 0);
        vec3 g = at(p, -1, 1), h = at(p, 0, 1), k = at(p, 1, 1);
        const float E = 0.182, M = 1.0 - 2.0 * E; // Gewichte für Drehsymmetrie, Kyprianidis 2011, 3.2.1
        vec3 dx = E * (c + k - a - g) + M * (f - d), dy = E * (g + k - a - c) + M * (h - b);
        gl_FragColor = vec4(dot(dx, dx), dot(dx, dy), dot(dy, dy), 0.0);
      }`);

  // 3. anisotroper Kuwahara wie compositor_kuwahara_anisotropic.glsl in Blender, aber statt jedes Pixels der Ellipse
  // (in voller Auflösung 22 ms je Bild auf einer RTX A2000) ein festes Muster aus Punktpaaren in der
  // Einheitsscheibe, zur Mitte dichter wie Blenders Gewicht exp(−π d²), bilinear gelesen. Die Gewichte der Sektoren je
  // Punkt (Polynome) stehen so fest im Shader, je Pixel kommt nur die Ellipse dazu.
  const ZETA = 0.25; // Überlappung der Sektoren in der Mitte (Blender: 2 / Radius, hier der Radius 8 der Eichbilder)
  const ENV = 3 * Math.PI / 16; // halber Öffnungswinkel der Hülle eines Sektors (Blender: 3/2 π / 8)
  const ETA = (ZETA + Math.cos(ENV)) / Math.sin(ENV) ** 2;
  /** Gewichte der 8 Sektoren (Sektor 0 Richtung +y, gegen den Uhrzeiger je 45°) an einem Punkt der Scheibe, Summe 1 */
  function sectorWeights(x, y) {
    const ex = (x - y) * Math.SQRT1_2, ey = (x + y) * Math.SQRT1_2;
    const w = [[y, x], [ey, ex], [-x, y], [-ex, ey], [-y, x], [-ey, ex], [x, y], [ex, ey]]
      .map(([along, across]) => Math.max(0, along + ZETA - ETA * across * across) ** 2);
    const sum = w.reduce((a, b) => a + b);
    return w.map((v) => v / sum);
  }
  /** pairs Punkte in der oberen Halbscheibe (der gespiegelte liegt unten): Radius nach exp(−π d²), Winkel golden */
  const pattern = (pairs) => Array.from({ length: pairs }, (_, i) => {
    const r = Math.sqrt(-Math.log(1 - ((i + 0.5) / pairs) * (1 - Math.exp(-Math.PI))) / Math.PI);
    const a = Math.PI * ((i * 0.6180339887) % 1);
    return [r * Math.cos(a), r * Math.sin(a)];
  });
  /** direct: malt gleich ins Bild (Pixel ohne Pinsel verworfen), sonst in paintRT (dort 0) */
  const paintShader = (pairs, direct) => {
    const total = Array(8).fill(0.125); // die Mitte zählt in jedem Sektor 1/8
    const f = (v) => glf(+v.toFixed(5));
    const taps = pattern(pairs).map(([x, y]) => {
      const lines = [`o = E * vec2(${f(x)}, ${f(y)}); u = tap(uv + o); l = tap(uv - o);`,
        'uu = u.rgb * u.rgb; ll = l.rgb * l.rgb;'];
      sectorWeights(x, y).forEach((w, k) => {
        if (w < 2e-3) return;
        const m = (k + 4) % 8; // der gespiegelte Punkt zählt im Sektor gegenüber
        total[k] += w;
        total[m] += w;
        lines.push(`S[${k}] += ${f(w)} * u; Q[${k}] += ${f(w)} * uu; S[${m}] += ${f(w)} * l; Q[${m}] += ${f(w)} * ll;`);
      });
      return lines.join('\n        ');
    });
    const probe = Array.from({ length: 8 }, (_, k) => glv([Math.cos(k * Math.PI / 4), Math.sin(k * Math.PI / 4)]
      .map((v) => +v.toFixed(4))));
    return `
      uniform sampler2D tColor, tTensor;
      uniform vec2 uPx;  // ein Ausgabepixel in uv der Filterziele
      uniform float uRadius, uSigma, uSharp, uEcc;
      ${COLOR_GLSL}
      const float SPILL = 0.35; // so viel Pflanze in den gewählten Sektoren, und ein Pixel daneben ist ganz gemalt
      const float TOTAL[8] = float[8](${total.map(f).join(', ')});
      vec4 tap(vec2 uv) { vec4 c = texture2D(tColor, uv); return vec4(c.rgb, max(c.a, 0.0)); }
      void main() {
        vec2 uv = gl_FragCoord.xy * uPx;
        vec4 c0 = texture2D(tColor, uv);
        if (c0.a < 0.0) { ${direct ? 'discard;' : 'gl_FragColor = vec4(0.0); return;'} }
        // keine Pflanze in der Nähe (Mitte und 8 Punkte im Radius): nichts zu malen
        if (c0.a <= 0.0) {
          float near = 0.0;
          ${probe.map((d) => `near += max(texture2D(tColor, uv + uRadius * uPx * ${d}).a, 0.0);`).join('\n          ')}
          if (near == 0.0) { ${direct ? 'discard;' : 'gl_FragColor = vec4(0.0); return;'} }
        }
        // Strukturtensor geglättet (Gauss uniformity / 3): 3 × 3 bilinear gelesene Punkte im Abstand sigma
        vec2 s = uSigma * uPx;
        vec3 t = texture2D(tTensor, uv).rgb + 0.60653 * (texture2D(tTensor, uv + vec2(s.x, 0.0)).rgb
          + texture2D(tTensor, uv - vec2(s.x, 0.0)).rgb + texture2D(tTensor, uv + vec2(0.0, s.y)).rgb
          + texture2D(tTensor, uv - vec2(0.0, s.y)).rgb) + 0.36788 * (texture2D(tTensor, uv + s).rgb
          + texture2D(tTensor, uv - s).rgb + texture2D(tTensor, uv + vec2(s.x, -s.y)).rgb
          + texture2D(tTensor, uv - vec2(s.x, -s.y)).rgb);
        // Richtung geringster Änderung (Eigenvektor) und Anisotropie 0 … 1
        float mid = 0.5 * (t.x + t.z), root = 0.5 * sqrt((t.x - t.z) * (t.x - t.z) + 4.0 * t.y * t.y);
        float l1 = mid + root, l2 = mid - root;
        vec2 v = vec2(l1 - t.x, -t.y);
        v = length(v) > 0.0 ? normalize(v) : vec2(1.0, 0.0);
        float an = l1 + l2 > 0.0 ? (l1 - l2) / (l1 + l2) : 0.0;
        // Ellipse entlang der Kante, gleiche Fläche wie der Kreis: Scheibe -> Versatz in uv
        float e = (uEcc + an) / uEcc;
        mat2 E = mat2(uRadius * e * v * uPx, uRadius / e * vec2(-v.y, v.x) * uPx);
        // je Sektor Summe von Farbe (in a der Anteil Pflanze) und Farbe²
        vec4 S[8];
        vec3 Q[8];
        for (int k = 0; k < 8; k++) { S[k] = 0.125 * c0; Q[k] = 0.125 * c0.rgb * c0.rgb; }
        vec2 o;
        vec4 u, l;
        vec3 uu, ll;
        ${taps.join('\n        ')}
        // Sektoren mit wenig Streuung zählen mehr: 1 / max(0.02, σ)^q, hier relativ zum ruhigsten (ohne Überlauf)
        float sd[8];
        float calm = 1e9;
        for (int k = 0; k < 8; k++) {
          S[k] /= TOTAL[k];
          sd[k] = max(0.02, dot(sqrt(abs(Q[k] / TOTAL[k] - S[k].rgb * S[k].rgb)), vec3(1.0)));
          calm = min(calm, sd[k]);
        }
        vec4 sum = vec4(0.0);
        float ws = 0.0;
        for (int k = 0; k < 8; k++) {
          float w = pow(calm / sd[k], uSharp);
          sum += w * S[k];
          ws += w;
        }
        sum /= ws;
        float cover = max(min(2.0 * c0.a, 1.0), smoothstep(0.0, SPILL, sum.a));
        gl_FragColor = vec4(toScene(sum.rgb) * cover, cover);
      }`;
  };
  const paintMat = shader({
    tColor: { value: colorRT.texture }, tTensor: { value: tensorRT.texture }, uPx: { value: new THREE.Vector2() },
    uRadius: { value: 4 }, uSigma: { value: 1 }, uSharp: { value: 12.8 }, uEcc: { value: 1 },
  }, '');
  let built = '';
  /** Filter für count Punktpaare, gleich ins Bild (direct) oder in paintRT */
  function paintFor(count, direct) {
    if (built !== `${count} ${direct}`) {
      built = `${count} ${direct}`;
      paintMat.fragmentShader = paintShader(count, direct);
      paintMat.needsUpdate = true;
    }
    Object.assign(paintMat, direct ? OVER : PLAIN);
  }

  // in der Auflösung des Filters gemalt: vergrössert über das Bild
  const layMat = shader({ tPaint: { value: paintRT.texture }, uPx: { value: new THREE.Vector2() } }, `
      uniform sampler2D tPaint;
      uniform vec2 uPx;
      void main() {
        vec4 c = texture2D(tPaint, gl_FragCoord.xy * uPx);
        if (c.a < 0.004) discard;
        gl_FragColor = c;
      }`);
  Object.assign(layMat, OVER);
  const quad = new THREE.FullScreenQuad(colorMat);

  // Quader ums Brett (Elemente, Wasser am Rand): Stencil 1, wo die Szene in ihm liegt (vordere Seiten zählen hoch,
  // hintere herunter, je nur vor der Szene)
  const guardGeo = new THREE.BoxGeometry(PLATE + 1, 5, PLATE + 1).translate(0, 1, 0);
  const guardMat = (side, op) => new THREE.MeshBasicMaterial({
    side, colorWrite: false, depthWrite: false,
    stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: op,
  });
  const guards = [
    new THREE.Mesh(guardGeo, guardMat(THREE.FrontSide, THREE.IncrementWrapStencilOp)),
    new THREE.Mesh(guardGeo, guardMat(THREE.BackSide, THREE.DecrementWrapStencilOp)),
  ];

  const shown = (o) => {
    for (; o; o = o.parent) {
      if (!o.visible) return false;
      if (o === scene) return true;
    }
    return false;
  };
  const frustum = new THREE.Frustum(), viewProj = new THREE.Matrix4(), at = new THREE.Vector3();
  /** Hüllquader der Meshes, Instanzen einzeln, in der Welt (einmal je Quelle; die Ebenen stehen still) */
  function boxes(s) {
    if (s.boxes) return s.boxes;
    const m = new THREE.Matrix4();
    s.boxes = [];
    s.root.traverse((o) => {
      if (!o.isMesh) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      if (!o.isInstancedMesh) {
        s.boxes.push(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
        return;
      }
      // alle Instanzen (userData.instances, instancedModels): count enthält nur die gerade sichtbaren
      const all = o.userData.instances ?? o.instanceMatrix.array.subarray(0, o.count * 16);
      for (let i = 0; i < all.length / 16; i++) {
        m.fromArray(all, i * 16);
        s.boxes.push(o.geometry.boundingBox.clone().applyMatrix4(m.premultiply(o.matrixWorld)));
      }
    });
    return s.boxes;
  }
  /** Sichtbare Objekte: Rechteck im Bild (NDC [x0, y0, x1, y1], null: keine) und Strichgrösse relativ zum Mittelpunkt
   *  des Panoramas (Abstandsverhältnis, nach Grösse im Bild gemittelt) */
  function survey(active) {
    frustum.setFromProjectionMatrix(viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    const rect = [1, 1, -1, -1];
    let sum = 0, weight = 0;
    for (const s of active) {
      for (const box of boxes(s)) {
        if (!frustum.intersectsBox(box)) continue;
        box.getCenter(at);
        const near = at.distanceTo(camera.position), k = (box.max.distanceTo(box.min) / near) ** 2;
        sum += k * at.distanceTo(s.center) / near;
        weight += k;
        // Ecken ins Bild; reicht der Quader vor die Kamera, gilt das ganze Bild
        for (let c = 0; c < 8; c++) {
          at.set(c & 1 ? box.max.x : box.min.x, c & 2 ? box.max.y : box.min.y, c & 4 ? box.max.z : box.min.z);
          at.applyMatrix4(camera.matrixWorldInverse);
          if (-at.z < camera.near) { rect[0] = rect[1] = -1; rect[2] = rect[3] = 1; break; }
          at.applyMatrix4(camera.projectionMatrix); // NDC (applyMatrix4 teilt durch w)
          rect[0] = Math.min(rect[0], at.x); rect[1] = Math.min(rect[1], at.y);
          rect[2] = Math.max(rect[2], at.x); rect[3] = Math.max(rect[3], at.y);
        }
      }
    }
    return { rect: weight ? rect : null, scale: weight ? sum / weight : 1 };
  }
  /** Ausschnitt (Scissor) eines Ziels in Pixeln aus dem Rechteck in NDC */
  function clip(rt, r) {
    const x0 = Math.max(0, Math.floor((r[0] + 1) / 2 * rt.width));
    const y0 = Math.max(0, Math.floor((r[1] + 1) / 2 * rt.height));
    const x1 = Math.min(rt.width, Math.ceil((r[2] + 1) / 2 * rt.width));
    const y1 = Math.min(rt.height, Math.ceil((r[3] + 1) / 2 * rt.height));
    rt.scissor.set(x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0));
    rt.scissorTest = true;
  }

  /** Ablauf für diese Bildgrösse: Bildpixel je Filterpixel (step) und ob gleich ins Bild gemalt wird (direct); über
   *  BRUSH_FULL_MAX Pixel (etwa 4K) kostete das zu viel, dann je mindestens 2 × 2 Pixel und vergrössert */
  function plan(lv = level) {
    const big = image.x * image.y > BRUSH_FULL_MAX;
    return { step: lv.full && big ? Math.max(2, lv.step) : lv.step, direct: lv.full && !big };
  }
  /** Ziele für step bemessen (erst beim ersten Bild mit dieser Stufe) */
  function size(n) {
    sized = n;
    for (const rt of [colorRT, tensorRT, paintRT]) rt.setSize(Math.ceil(image.x / n), Math.ceil(image.y / n));
    colorMat.uniforms.uStep.value = n;
  }
  pass.setSize = (w, h) => {
    image.set(w, h);
    if (sized) size(sized);
  };

  const activeSources = () => [...sources].filter((s) => s.uniforms.uFade.value * s.uniforms.uReady.value > 0 && shown(s.root));

  pass.render = (renderer, writeBuffer, readBuffer) => {
    if (!pass.supported) return;
    const active = activeSources();
    if (!active.length) return;
    const b = active[0].brush;
    level = forced !== undefined ? forced
      : IS_MOBILE && b.mobile !== undefined ? (b.mobile ? { step: b.mobile, full: false } : null) : quality;
    if (!level) return;
    const { rect, scale } = survey(active);
    if (!rect) return;
    const { step, direct } = plan();
    if (step !== sized) size(step);
    const out = direct ? 1 : step; // Bildpixel je Ausgabepixel
    paintFor(level.pairs ?? (direct ? 24 : 12), direct);
    const radius = b.size * (readBuffer.height / camera.fov) * scale; // Bildpixel
    // Ausschnitt: die Objekte und so weit daneben, wie der Filter liest (Ellipse bis 2 Radien) und malt (2 Radien)
    const reach = 4 * Math.min(radius, BRUSH_MAX_RADIUS * out) + 4 * step;
    const mx = 2 * reach / readBuffer.width, my = 2 * reach / readBuffer.height;
    const box = [rect[0] - mx, rect[1] - my, rect[2] + mx, rect[3] + my];
    // Farben und Tensor noch einmal so weit daneben: Der Filter liest dort, sonst Reste früherer Bilder
    const wide = [box[0] - mx, box[1] - my, box[2] + mx, box[3] + my];
    const u = paintMat.uniforms;
    u.uPx.value.set(out / (colorRT.width * step), out / (colorRT.height * step));
    u.uRadius.value = THREE.MathUtils.clamp(radius / out, 1, BRUSH_MAX_RADIUS);
    u.uSigma.value = Math.max(0.3, b.uniformity / 3 / out);
    u.uSharp.value = b.sharpness * 16;
    u.uEcc.value = 1 / Math.max(0.01, b.eccentricity);
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    colorMat.uniforms.tScene.value = readBuffer.texture;
    const passes = [[colorMat, colorRT, wide], [tensorMat, tensorRT, wide]];
    if (!direct) passes.push([paintMat, paintRT, box]);
    for (const [mat, rt, area] of passes) {
      clip(rt, area);
      quad.material = mat;
      renderer.setRenderTarget(rt);
      quad.render(renderer);
    }
    const scissor = readBuffer.scissor.clone(), scissorTest = readBuffer.scissorTest;
    clip(readBuffer, box);
    renderer.setRenderTarget(readBuffer);
    for (const g of guards) renderer.render(g, camera);
    if (!direct) layMat.uniforms.uPx.value.set(1 / (paintRT.width * step), 1 / (paintRT.height * step));
    quad.material = direct ? paintMat : layMat;
    quad.render(renderer);
    readBuffer.scissor.copy(scissor);
    readBuffer.scissorTest = scissorTest;
    renderer.setRenderTarget(readBuffer); // Ausschnitt wie vorher (das Leuchten zeichnet hier hinein)
    renderer.autoClear = autoClear;
  };

  /** Ebene malen: { root (Object3D der Ebene), brush (Einstellungen), center (des Panoramas), uniforms (uFade,
   *  uReady) }; ihre Materialien schreiben die Maske (mark). Liefert das Abmelden. */
  pass.add = (source) => {
    mark(source.root);
    sources.add(source);
    return () => {
      sources.delete(source);
      if (sources.size) return;
      for (const rt of [colorRT, tensorRT, paintRT]) rt.dispose(); // Grafikspeicher frei (bis 50 MB in 4K)
      sized = 0;
    };
  };
  /** Programme des Pinsels als Gruppe zum Übersetzen im Hintergrund (compileParallel, mit den Ebenen der Skybox nach
   *  introCalm; sonst beim ersten Bild mit Pinsel) */
  let programs = null;
  pass.programs = () => {
    if (programs) return programs;
    const lv = quality ?? { step: 2, full: false };
    paintFor(lv.pairs ?? (plan(lv).direct ? 24 : 12), plan(lv).direct);
    programs = new THREE.Group();
    for (const m of [colorMat, tensorMat, paintMat, layMat]) programs.add(new THREE.Mesh(quad._mesh.geometry, m));
    for (const g of guards) programs.add(new THREE.Mesh(guardGeo, g.material));
    return programs;
  };

  /** Maske: Undurchsichtige Materialien unter root schreiben am Ende von main Alpha BRUSH_MARK, ohne dass ihr Shader
   *  sich ändert (onBeforeCompile, eigener Schlüssel im Programm-Cache). Durchsichtige oder selbst mischende (etwa die
   *  Fische, vormultipliziert) mischten mit Alpha die Farbe: Sie bleiben ungemalt */
  const marked = new WeakSet();
  function mark(root) {
    root.traverse((o) => {
      for (const m of [o.material ?? []].flat()) {
        if (marked.has(m) || m.transparent || ![THREE.NormalBlending, THREE.NoBlending].includes(m.blending)) continue;
        marked.add(m);
        const before = m.onBeforeCompile, key = m.customProgramCacheKey;
        m.onBeforeCompile = (shader, r) => {
          before.call(m, shader, r);
          const end = shader.fragmentShader.lastIndexOf('}'); // Ende von main (main steht zuletzt)
          shader.fragmentShader = `${shader.fragmentShader.slice(0, end)}  gl_FragColor.a = ${glf(BRUSH_MARK)};\n}\n`;
        };
        m.customProgramCacheKey = () => `${key.call(m)}|brush|${before}`; // key liest sonst nur die Hülle oben
        m.needsUpdate = true;
      }
    });
  }

  /** Stufe festlegen (Vergleich, Messung): { step, full, pairs? }, null (aus) oder undefined (wieder wie im Spiel) */
  pass.setLevel = (next) => { forced = next; };
  return pass;
}

function createComposer() {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: HDR_TYPE,
    samples: renderer.capabilities.isWebGL2 ? QUALITY.msaa : 0,
    // Mit Stencil legt three.js einen kombinierten Tiefen-/Stencil-Puffer an (WebGL2: DEPTH24_STENCIL8,
    // WebGL1 faktisch 24 Bit) – ohne nur DEPTH_COMPONENT16, was bei flachem Blickwinkel zu
    // Streifen (Z-Fighting) auf der Platte führt.
    stencilBuffer: true,
  });
  const comp = new THREE.EffectComposer(renderer, rt);
  const scenePass = new THREE.RenderPass(scene, camera);
  // Eigene Ziele (SCENE_PREPASSES, etwa die Fische unter dem Wasser) vorab, dann die Szene in einem Zug
  const renderScene = scenePass.render;
  scenePass.render = function (r, writeBuffer, readBuffer, ...rest) {
    for (const prepass of SCENE_PREPASSES) prepass(r, this.camera, this.renderToScreen ? null : readBuffer, this.scene);
    return renderScene.call(this, r, writeBuffer, readBuffer, ...rest);
  };
  comp.addPass(scenePass);
  // Pinsel über gemalten Ebenen der Skyboxen: vor dem Leuchten, das danach über das gemalte Bild geht
  const brush = createBrushPass(QUALITY.brush);
  comp.addPass(brush);
  // Danach liest niemand mehr Tiefe und Stencil des Szenenbilds (der Pinsel brauchte den Stencil; das nächste Bild
  // löscht sie): verwerfen statt speichern (Kachel-GPUs, Ticket 11)
  const discard = new THREE.Pass();
  discard.needsSwap = false;
  discard.render = (r, writeBuffer, readBuffer) => discardDepth(r, readBuffer);
  comp.addPass(discard);

  const bloom = new THREE.UnrealBloomPass(
    new THREE.Vector2(seiteBreite(), seiteHoehe()),
    LOOK.bloomStrength, LOOK.bloomRadius, LOOK.bloomThreshold
  );
  // Bloom-Puffer auf HDR umstellen, sonst werden helle Strahlen auf 1.0 abgeschnitten. Ohne Tiefenpuffer (three legt
  // sonst je Ziel einen an): Die Vollbild-Pässe brauchen keinen, und Kachel-GPUs löschten und speicherten ihn in jedem
  // der zwölf Pässe mit (Ticket 11). Gesetzt, bevor three die Ziele beim ersten Zeichnen anlegt.
  [bloom.renderTargetBright, ...bloom.renderTargetsHorizontal, ...bloom.renderTargetsVertical]
    .forEach(t => { t.texture.type = HDR_TYPE; t.depthBuffer = false; });
  // Desktop: Bloom zusätzlich in halber Auflösung (UnrealBloom halbiert intern schon einmal) – optisch kaum
  // ein Unterschied, spart rund 70 % seiner Kosten. Nicht auf dem Handy: Dort sind helle Linien (Strahlen,
  // Glanzkante der Platte) im Verhältnis zu den Pixeln dünn, und im Viertel der Auflösung wurden sie nur
  // stellenweise erfasst – das Leuchten zerfiel in Perlen und Wellen. Mit Pixeldichte 2 entspricht die
  // halbe Auflösung dort genau einem Bloom-Pixel pro CSS-Pixel.
  const bloomDiv = IS_MOBILE ? 1 : 2;
  // Gegen Wellen im Leuchten dünner Strahlen: UnrealBloom verkleinert mit einem Kastenfilter (ein Bloom-Pixel mittelt
  // seinen Block, auf dem Desktop nur dessen mittlere 2 × 2 Bildpunkte) und vergrössert bilinear. Beides hängt davon
  // ab, wo ein dünner Strahl im Raster liegt: Der Kasten rundet seine Lage auf ganze Bloom-Pixel, die bilineare
  // Vergrösserung knickt den Saum zwischen ihnen. Entlang eines schrägen Strahls wechselt diese Lage stetig – der Saum
  // wurde regelmässig breiter und schmaler, je nach Blickwinkel mit anderem Abstand, und beim Schweben der Kamera
  // wanderte das Muster. Darum:
  // - Hochpass mit Dreiecksfilter über die doppelte Breite eines Bloom-Pixels (verteilt einen Strahl zwischen zwei
  //   Bloom-Pixeln stetig nach seiner Lage) und der Schwelle je Bildpunkt: Eine Schwelle nach dem Mitteln liess
  //   Strahlen je nach Lage verschieden stark blühen. Handy 4 × 4, Desktop 8 × 8 Abtastungen (Intel Iris Xe, 1080p:
  //   +0,5 ms gegenüber einer Abtastung).
  // - Vergrössern der Bloom-Stufen (Zusammensetzen, Auftragen aufs Bild) als kubischer B-Spline statt bilinear.
  const bloomRatio = 2 * bloomDiv; // Bildpunkte je Bloom-Pixel und Richtung
  const taps = Array.from({ length: 2 * bloomRatio }, (_, i) => i - bloomRatio + 0.5);
  const glslNum = (x) => x.toFixed(1);
  const quads = Array.from({ length: bloomRatio }, (_, q) => [2 * q, 2 * q + 1]); // je zwei benachbarte Abtastungen
  // Nur der Überschuss über der Schwelle blüht (weiches Knie), begrenzt gegen eckige Halos. Die Abtastungen rasten auf
  // Bildpunktmitten ein, die Gewichte rechnen mit dem echten Abstand zur Mitte des Bloom-Pixels: Geht die Bildgrösse
  // nicht in ganzen Bloom-Pixeln auf (krumme Fenstergrösse, adaptive Auflösung), wandert dessen Mitte gegen die
  // Bildpunkte, und feste Versätze träfen Bildpunktgrenzen – dort mittelte die Abtastung wieder vor der Schwelle.
  bloom.highPassUniforms.uSrcSize = { value: new THREE.Vector2() };
  bloom.materialHighPassFilter.fragmentShader = `
    uniform sampler2D tDiffuse;
    uniform float luminosityThreshold;
    uniform float smoothWidth;
    uniform vec2 uSrcSize; // Grösse des Szenenbilds in Bildpunkten
    varying vec2 vUv;
    vec3 excess(vec2 px) {
      vec3 texel = texture2D(tDiffuse, px / uSrcSize).rgb;
      float v = dot(texel, vec3(0.299, 0.587, 0.114));
      float alpha = smoothstep(luminosityThreshold, luminosityThreshold + smoothWidth, v);
      return min(texel * (max(v - luminosityThreshold, 0.0) / max(v, 1e-4)), vec3(2.5)) * alpha;
    }
    // Kann einer der vier Bildpunkte um die Ecke q über der Schwelle liegen? Eine bilineare Abtastung genau auf der Ecke
    // mittelt sie; liegt die Summe ihrer Helligkeiten (alle ≥ 0) unter der Schwelle, liegt es jeder einzelne auch, und
    // ihr Überschuss ist 0. Dann entfallen ihre vier Abtastungen (Ticket 11: der grösste Teil des Bilds blüht nicht).
    // 2 % Reserve für die Rechengenauigkeit des Filters.
    bool bright(vec2 q) {
      return 4.0 * dot(texture2D(tDiffuse, q / uSrcSize).rgb, vec3(0.299, 0.587, 0.114)) >= luminosityThreshold * 0.98;
    }
    void main() {
      vec2 c = vUv * uSrcSize, b = floor(c + 0.5), d = c - b; // Mitte des Bloom-Pixels, nächste Bildpunktecke, Rest
      ${taps.map((p, i) => `float wx${i} = ${glslNum(bloomRatio)} - abs(${glslNum(p)} - d.x), ` +
        `wy${i} = ${glslNum(bloomRatio)} - abs(${glslNum(p)} - d.y);`).join('\n      ')}
      vec3 e = vec3(0.0);
      ${quads.flatMap(([i0, i1]) => quads.map(([j0, j1]) => `if (bright(b + vec2(${glslNum((taps[i0] + taps[i1]) / 2)}, ${glslNum((taps[j0] + taps[j1]) / 2)}))) {
        ${[[i0, j0], [i1, j0], [i0, j1], [i1, j1]].map(([i, j]) =>
          `e += excess(b + vec2(${glslNum(taps[i])}, ${glslNum(taps[j])})) * (wx${i} * wy${j});`).join('\n        ')}
      }`)).join('\n      ')}
      gl_FragColor = vec4(e / ${glslNum(bloomRatio ** 4)}, 1.0);
    }`;
  bloom.highPassUniforms.smoothWidth.value = 0.6;
  // Kubischer B-Spline aus vier bilinearen Abtastungen (size: Grösse der Textur in Texeln)
  const BSPLINE_GLSL = `
    vec4 bspline(sampler2D tex, vec2 uv, vec2 size) {
      vec2 st = uv * size - 0.5;
      vec2 i = floor(st), f = st - i, f2 = f * f, f3 = f2 * f;
      vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0, w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
      vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0, w3 = f3 / 6.0;
      vec2 g0 = w0 + w1, g1 = w2 + w3;
      vec2 p0 = (i - 0.5 + w1 / g0) / size, p1 = (i + 1.5 + w3 / g1) / size;
      return (texture2D(tex, p0) * g0.x + texture2D(tex, vec2(p1.x, p0.y)) * g1.x) * g0.y
           + (texture2D(tex, vec2(p0.x, p1.y)) * g0.x + texture2D(tex, p1) * g1.x) * g1.y;
    }`;
  // Zusammensetzen in der Grösse der feinsten Stufe: die gröberen Stufen 2–5 vergrössert der B-Spline
  const composite = bloom.compositeMaterial;
  for (let i = 2; i <= 5; i++) composite.uniforms['uSize' + i] = { value: new THREE.Vector2() };
  composite.fragmentShader = composite.fragmentShader
    .replace('void main() {', `uniform vec2 uSize2, uSize3, uSize4, uSize5;${BSPLINE_GLSL}\nvoid main() {`)
    .replace(/texture2D\(blurTexture([2-5]), vUv\)/g, 'bspline(blurTexture$1, vUv, uSize$1)');
  // Auftragen aufs Bild in voller Auflösung, ebenfalls als B-Spline, additiv, Alpha unverändert (Alpha 0 = Himmel, siehe
  // FinalShader), gewichtet mit dem Alpha der zusammengesetzten Stufen (wie früher die Mischung SrcAlpha, One). Im
  // letzten Bildschritt statt in einem eigenen Pass (Ticket 11): Der las und schrieb das ganze Szenenbild (HalfFloat)
  // samt Tiefe nur, um das Leuchten dazuzulegen; auf Kachel-GPUs (Handy) ein Laden und Speichern des ganzen Bilds.
  const bloomOut = bloom.renderTargetsHorizontal[0]; // zusammengesetzt (composite)
  const bloomUniforms = { tBloom: { value: bloomOut.texture }, uBloomSize: { value: new THREE.Vector2(1, 1) }, uBloom: { value: 0 } };
  bloom.applied = false; // in diesem Bild zusammengesetzt (der letzte Bildschritt legt es dann auf)
  // wie UnrealBloomPass.render, ohne das Auftragen (und ohne renderToScreen und Maske, beides nie benutzt)
  bloom.render = function (r, writeBuffer, readBuffer) {
    r.getClearColor(this._oldClearColor);
    this.oldClearAlpha = r.getClearAlpha();
    const oldAutoClear = r.autoClear;
    r.autoClear = false;
    r.setClearColor(this.clearColor, 0);
    const pass = (material, target) => {
      this.fsQuad.material = material;
      r.setRenderTarget(target);
      r.clear(); // auf Kachel-GPUs: nichts laden
      this.fsQuad.render(r);
    };
    this.highPassUniforms.tDiffuse.value = readBuffer.texture;
    this.highPassUniforms.luminosityThreshold.value = this.threshold;
    pass(this.materialHighPassFilter, this.renderTargetBright);
    let input = this.renderTargetBright;
    for (let i = 0; i < this.nMips; i++) {
      // gleich grosse Quelle: paarweise (pairBlur); verkleinernd (waagrecht ab Stufe 1): wie UnrealBloom
      const blur = i === 0 ? pairBlur[i] : this.separableBlurMaterials[i];
      blur.uniforms.colorTexture.value = input.texture;
      blur.uniforms.direction.value = THREE.UnrealBloomPass.BlurDirectionX;
      pass(blur, this.renderTargetsHorizontal[i]);
      pairBlur[i].uniforms.colorTexture.value = this.renderTargetsHorizontal[i].texture;
      pairBlur[i].uniforms.direction.value = THREE.UnrealBloomPass.BlurDirectionY;
      pass(pairBlur[i], this.renderTargetsVertical[i]);
      input = this.renderTargetsVertical[i];
    }
    this.compositeMaterial.uniforms.bloomStrength.value = this.strength;
    this.compositeMaterial.uniforms.bloomRadius.value = this.radius;
    this.compositeMaterial.uniforms.bloomTintColors.value = this.bloomTintColors;
    // in zwei Schritten (compositeCoarse, compositeFine), siehe dort
    pass(compositeCoarse, this.renderTargetsHorizontal[1]);
    pass(compositeFine, bloomOut);
    this.applied = true;
    r.setClearColor(this._oldClearColor, this.oldClearAlpha);
    r.autoClear = oldAutoClear;
  };
  // Original-Gauss endet bei 1 Sigma -> sichtbare eckige Halos. Engeres Sigma = runde Halos.
  bloom.separableBlurMaterials.forEach(m => {
    m.defines.SIGMA = (m.defines.KERNEL_RADIUS / 2.4).toFixed(3);
    m.needsUpdate = true;
  });
  // Weichzeichnen, wo Quelle und Ziel gleich gross sind (alle senkrechten Durchgänge, auf Stufe 0 auch der waagrechte):
  // derselbe Gauss wie UnrealBloom, aber je zwei benachbarte Texel mit einer bilinearen Abtastung zwischen ihnen, nach
  // ihren Gewichten versetzt (Ticket 11: 3 statt 5 Abtastungen auf der grössten Stufe, 11 statt 21 auf der kleinsten).
  // Verkleinert ein Durchgang (waagrecht ab Stufe 1), mittelt jede seiner Abtastungen schon 2 × 2 Texel der Quelle: dort
  // wie UnrealBloom.
  const pairBlur = bloom.separableBlurMaterials.map((m) => {
    const radius = m.defines.KERNEL_RADIUS, sigma = parseFloat(m.defines.SIGMA);
    const w = Array.from({ length: radius }, (_, x) => Math.exp(-0.5 * x * x / (sigma * sigma)));
    const sum = w[0] + 2 * w.slice(1).reduce((a, b) => a + b, 0);
    const taps = [];
    for (let x = 1; x < radius; x += 2) {
      const wa = w[x], wb = x + 1 < radius ? w[x + 1] : 0;
      taps.push([(x * wa + (x + 1) * wb) / (wa + wb), (wa + wb) / sum]);
    }
    return new THREE.ShaderMaterial({
      uniforms: { colorTexture: { value: null }, texSize: m.uniforms.texSize, direction: { value: new THREE.Vector2() } },
      vertexShader: m.vertexShader,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D colorTexture;
        uniform vec2 texSize;
        uniform vec2 direction;
        void main() {
          vec2 stp = direction / texSize;
          vec3 s = texture2D(colorTexture, vUv).rgb * ${(w[0] / sum).toFixed(8)};
          ${taps.map(([o, wt]) => `s += (texture2D(colorTexture, vUv + stp * ${o.toFixed(8)}).rgb + texture2D(colorTexture, vUv - stp * ${o.toFixed(8)}).rgb) * ${wt.toFixed(8)};`).join('\n          ')}
          gl_FragColor = vec4(s, 1.0);
        }`,
    });
  });
  // Zusammensetzen in zwei Schritten (Ticket 11): erst die Stufen 2–5 in der Grösse der Stufe 2 (sie selbst ohne
  // Vergrössern, 3–5 als B-Spline), dann Stufe 1 und dieses Zwischenbild als B-Spline in der Grösse der Stufe 1. Stufe 2
  // ergibt genau dasselbe wie vorher; 3–5 bekommen zusätzlich einen B-Spline von einem Texel der Stufe 2 dazu (Sigma
  // etwa 2 Bildpunkte, ihre eigene Unschärfe ist über zehnmal so breit). Statt 17 Abtastungen je Pixel der Stufe 1
  // 5 dort und 13 je Pixel der viermal kleineren Stufe 2.
  const compositeUniforms = (extra) => ({
    ...Object.fromEntries(['bloomStrength', 'bloomRadius', 'bloomFactors', 'bloomTintColors'].map((k) => [k, composite.uniforms[k]])),
    ...extra,
  });
  const COMPOSITE_HEAD = `
    varying vec2 vUv;
    uniform float bloomStrength, bloomRadius;
    uniform float bloomFactors[5];
    uniform vec3 bloomTintColors[5];
    float lerpBloomFactor(const in float factor) { return mix(factor, 1.2 - factor, bloomRadius); }
    #define level(i, t) (lerpBloomFactor(bloomFactors[i]) * vec4(bloomTintColors[i], 1.0) * (t))
    ${BSPLINE_GLSL}`;
  const compositeCoarse = new THREE.ShaderMaterial({
    uniforms: compositeUniforms(Object.fromEntries([2, 3, 4, 5].flatMap((i) => [
      [`blurTexture${i}`, composite.uniforms[`blurTexture${i}`]], [`uSize${i}`, composite.uniforms[`uSize${i}`]]]))),
    vertexShader: composite.vertexShader,
    fragmentShader: `${COMPOSITE_HEAD}
    uniform sampler2D blurTexture2, blurTexture3, blurTexture4, blurTexture5;
    uniform vec2 uSize2, uSize3, uSize4, uSize5;
    void main() {
      gl_FragColor = bloomStrength * (level(1, texture2D(blurTexture2, vUv)) + level(2, bspline(blurTexture3, vUv, uSize3))
        + level(3, bspline(blurTexture4, vUv, uSize4)) + level(4, bspline(blurTexture5, vUv, uSize5)));
    }`,
  });
  const compositeFine = new THREE.ShaderMaterial({
    uniforms: compositeUniforms({ blurTexture1: composite.uniforms.blurTexture1, tCoarse: { value: bloom.renderTargetsHorizontal[1].texture },
      uSize2: composite.uniforms.uSize2 }),
    vertexShader: composite.vertexShader,
    fragmentShader: `${COMPOSITE_HEAD}
    uniform sampler2D blurTexture1, tCoarse;
    uniform vec2 uSize2;
    void main() {
      gl_FragColor = bloomStrength * level(0, texture2D(blurTexture1, vUv)) + bspline(tCoarse, vUv, uSize2);
    }`,
  });
  for (const m of [...pairBlur, compositeCoarse, compositeFine]) { m.depthTest = m.depthWrite = false; }
  const bloomSetSize = bloom.setSize.bind(bloom);
  bloom.setSize = (w, h) => {
    bloomSetSize(Math.max(1, Math.round(w / bloomDiv)), Math.max(1, Math.round(h / bloomDiv)));
    bloom.highPassUniforms.uSrcSize.value.set(Math.floor(w), Math.floor(h)); // gebrochene Grössen schneidet WebGL ab
    for (let i = 2; i <= 5; i++) {
      const t = bloom.renderTargetsVertical[i - 1];
      composite.uniforms['uSize' + i].value.set(t.width, t.height);
    }
    bloomUniforms.uBloomSize.value.set(bloomOut.width, bloomOut.height);
  };
  bloom.setSize(size.x, size.y);
  comp.addPass(bloom);

  const finalPass = new THREE.ShaderPass(FinalShader);
  // Leuchten dazulegen (siehe oben), wo der Bildschritt das Szenenbild liest, auch an den Stellen der Aberration
  Object.assign(finalPass.uniforms, bloomUniforms);
  finalPass.material.fragmentShader = FinalShader.fragmentShader
    .replace('varying vec2 vUv;', `varying vec2 vUv;
    uniform sampler2D tBloom;
    uniform vec2 uBloomSize;
    uniform float uBloom; // 0: ohne Leuchten (in diesem Bild nicht gerechnet)
    ${BSPLINE_GLSL}
    vec3 glow(vec2 uv) {
      if (uBloom <= 0.0) return vec3(0.0);
      vec4 b = bspline(tBloom, uv, uBloomSize);
      return b.rgb * (b.a * uBloom);
    }
    // Szenenbild mit Leuchten; ohne HDR (8 Bit) auf 1 begrenzt wie früher beim Auftragen ins 8-Bit-Szenenbild
    vec3 lit(vec3 c, vec2 uv) {
      c += glow(uv);
      return ${HDR_SUPPORTED ? 'c' : 'min(c, 1.0)'};
    }`)
    .replace(`col.r = texture2D(tDiffuse, vUv - off).r;
      col.g = base.g;
      col.b = texture2D(tDiffuse, vUv + off).b;`, `base.rgb = lit(base.rgb, vUv);
      col.g = base.g;
      if (off == vec2(0.0)) {
        col.rb = base.rb;
      } else {
        col.r = lit(texture2D(tDiffuse, vUv - off).rgb, vUv - off).r;
        col.b = lit(texture2D(tDiffuse, vUv + off).rgb, vUv + off).b;
      }`);
  if (!finalPass.material.fragmentShader.includes('lit(texture2D(tDiffuse, vUv - off).rgb')) throw new Error('FinalShader: Leuchten nicht eingesetzt');
  const renderFinal = finalPass.render;
  finalPass.render = function (...args) {
    bloomUniforms.uBloom.value = bloom.applied ? bloom.copyUniforms.opacity.value : 0;
    bloom.applied = false;
    return renderFinal.apply(this, args);
  };
  // Rendert direkt auf den Bildschirm: ohne Swap wird der zweite Composer-Puffer nie gebunden
  // und belegt daher keinen Grafikspeicher. Ohne Tiefentest (der Bildschirm hat keine Tiefe, siehe renderer).
  finalPass.needsSwap = false;
  finalPass.material.depthTest = finalPass.material.depthWrite = false;
  comp.addPass(finalPass);
  return { comp, bloom, finalPass, brush };
}

const { comp: composer, bloom: bloomPass, finalPass, brush: brushPass } = createComposer();
// Mit eigenem RenderTarget setzt der Composer sein Pixelverhältnis auf 1 – für HiDPI korrigieren.
composer.setPixelRatio(renderer.getPixelRatio());

export { bloomPass, BRUSH_DEFAULT, brushPass, composer, finalPass, hemi, keyLight };
