// Brett mit planarer Spiegelung, die Bretter je Himmel (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import { boardCoreUniforms, skyTheme } from '../himmel/skybox.js';
import { BOARD, CELL, GRID, PLATE, PLATE_THICK, QUALITY, SPIEGEL_ALLE } from '../konfiguration.ts';
import {
  arbeit, compileParallel, NEXT_FRAME, renderer, ruhe, RUHIG, scene, sceneLoop, sceneReady, sliced,
} from '../szene.js';
import { boardTextures, createStoneTextures, tidePoolData } from '../texturen.js';
import { CELEBRATE } from '../levelfluss.js';
import { mulberry32 } from '../../zufall.js';
import { alsGlobal } from '../testschnittstelle.ts';

/* =====================================================================
   BRETT mit planarer Spiegelung (Spec .scratch/brett-je-himmel/)
   ===================================================================== */

// Spiegelungs-Kamera: rendert die Szene gespiegelt in eine Textur, die die Oberfläche des Bretts (je nach Rauheit
// leicht weichgezeichnet) liest. Eine für alle Bretter.
const reflector = new THREE.Reflector(new THREE.PlaneGeometry(PLATE, PLATE), {
  textureWidth: 256,
  textureHeight: 256,
  clipBias: 0.002,
  multisample: 0, // MSAA wird unten über samples gesetzt (WebGL2)
});
// Hängt bewusst nicht im Szenengraph; seine Matrix wird in renderReflection() von der Oberfläche des gezeigten Bretts
// übernommen.
reflector.getRenderTarget().stencilBuffer = true; // 24 statt 16 Bit Tiefe (vor dem ersten Rendern setzen)
// Kantenglättung in der Spiegelung: sonst bekommen Strahlen und Kristalle in der kleinen Textur
// Treppenkanten. three.js löst MSAA vor dem Erzeugen der Mipmaps auf – beides lässt sich kombinieren.
if (renderer.capabilities.isWebGL2) reflector.getRenderTarget().samples = QUALITY.reflectionMsaa;
// Mipmaps: Unschärfe je nach Rauheit mit einer einzigen Abtastung (versetzte Abtastungen erzeugten Geisterbilder)
if (renderer.capabilities.isWebGL2) { // WebGL1 kann keine Mipmaps für NPOT-Texturen
  reflector.getRenderTarget().texture.generateMipmaps = true;
  reflector.getRenderTarget().texture.minFilter = THREE.LinearMipmapLinearFilter;
}
// Verschiebung der Mipmap-Stufe (Bias): Die automatische Stufe berücksichtigt die Texturgrösse schon; damit die
// Unschärfe in CSS-Pixeln gleich bleibt, muss der Bias nur die Pixeldichte ausgleichen.
const reflLodShift = { value: 0 };

/**
 * Spiegelt das Brett unter dem Himmel id? Nur unter den beiden im All (spiegel im Eintrag, SKY_ENTRIES), mit
 * ?spiegel=alle unter allen, ohne HDR nie (Ticket 04 der Energie, ADR 0010). Die Zuordnung hängt am Himmel, nicht an der
 * Art des Bretts: Das Steinbrett steht auch in der Eishöhle, und dort spiegelt es nicht.
 */
const spiegelHimmel = (id) => QUALITY.reflections && (SPIEGEL_ALLE || !!skyTheme.byId.get(id)?.spiegel);
/**
 * Anteil der Spiegelung auf dem Brett (uReflStrength aller Bretter, addBoardReflection): 1 unter einem Himmel mit
 * Spiegelung (spiegelHimmel), sonst 0. Bei 0 rechnet renderReflection nichts (weder Spiegelbild noch Mipmaps), und die
 * Bretter lesen die Spiegeltextur nicht; sonst sehen sie gleich aus, nur ohne Spiegelbild. Blendet der Himmel über,
 * wandert der Anteil in derselben Zeit (skyTheme.fadeTime) weich zum neuen, solange der Himmel nicht hält; springt der
 * Himmel (set ohne Überblenden) oder steht er, gilt gleich der neue. follow je Bild aus skyTheme.update und aus set.
 */
const boardReflection = {
  uniform: { value: 0 }, // uReflStrength: weich (smoothstep) aus anteil
  anteil: 0,             // 0 … 1, linear in der Zeit
  follow(dt, springen = false) {
    const ziel = spiegelHimmel(skyTheme.current) ? 1 : 0;
    if (springen || !skyTheme.fading) this.anteil = ziel;
    else if (!skyTheme.holding) {
      const step = dt / skyTheme.fadeTime;
      this.anteil = ziel > this.anteil ? Math.min(ziel, this.anteil + step) : Math.max(ziel, this.anteil - step);
    }
    const a = this.anteil;
    this.uniform.value = a * a * (3 - 2 * a);
  },
};

// Lichtwelle beim Lösen (siehe celebration): x = Radius, y = Stärke, z = Breite (Welt). Pflicht auf jedem Brett, je Art
// in ihrem Material; die Farbe nutzt auch der Rahmen im Würfel. uShockT: Sekunden seit dem Start des Rings (shockClock;
// 99 in Ruhe)
const SHOCK_SPEED = 6.5; // m/s, Tempo des Rings (CELEBRATE.shockSpeed)
const shockUniforms = {
  uShock: { value: new THREE.Vector3(0, 0, 0.4) },
  uShockColor: { value: new THREE.Color(1, 1, 1) },
  uShockT: { value: 99 },
};
const SHOCK_REST_S = 8; // so lange nach dem Start wirkt eine Lichtwelle auf einem Brett höchstens nach
/**
 * Uhr der Lichtwelle (uShockT), je Bild nach Feier und Geschichte (animate): Solange der Ring läuft, ist sie genau seine
 * Zeit (Radius / SHOCK_SPEED), danach läuft sie mit dt weiter, bis die Wirkung auf dem Brett vorbei ist, dann 99 (Ruhe).
 * Beim Fall des Lichts (story.shock) läuft der Ring langsamer (rund 4,7 m/s), die Uhr also auch: Die Front bleibt am
 * Ring. Bretter mit eigener Lichtwelle (tidePool) richten sich nach der Ankunft des Rings (uShockT − Abstand /
 * SHOCK_SPEED), nicht nach seiner Stärke: Die fällt bis zum Rand auf fast nichts (0,82 bei 0,7 m, 0,16 bei 4,3 m), dort
 * kämen Wasser und Schaum sonst ohne Kraft an.
 */
function shockClock(dt) {
  const u = shockUniforms.uShockT, s = shockUniforms.uShock.value;
  if (s.y > 0) u.value = s.x / SHOCK_SPEED;
  else if (u.value < SHOCK_REST_S) u.value += dt;
  else u.value = 99;
}

/**
 * Spiegelung auf der Oberfläche eines Bretts (onBeforeCompile): Uniforms, Vertex-Code und Deklarationen für die
 * Spiegeltextur des reflector; den Beitrag rechnet boardReflectGlsl
 */
function addBoardReflection(shader) {
  shader.uniforms.tReflect = { value: reflector.getRenderTarget().texture };
  shader.uniforms.uReflMatrix = reflector.material.uniforms.textureMatrix;
  shader.uniforms.uReflStrength = boardReflection.uniform; // für alle Bretter dasselbe (Welt mit Spiegelung, weich)
  shader.uniforms.uReflLodShift = reflLodShift;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform mat4 uReflMatrix;\nvarying vec4 vReflUv;')
    .replace('#include <project_vertex>', '#include <project_vertex>\nvReflUv = uReflMatrix * vec4(position, 1.0);');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform sampler2D tReflect;\nuniform float uReflStrength;\nuniform float uReflLodShift;\nvarying vec4 vReflUv;');
}
/**
 * GLSL der Spiegelung vor dem Tonemapping (addBoardReflection): weichgezeichnet nach Rauheit, Fresnel, nur wo es glänzt.
 * strength: Anteil der Spiegelung (Text, GLSL); warp: GLSL, das ruv verschieben darf (etwa Kräuseln). Der Beitrag kommt
 * nur dazu (kein Anteil der Farbe darunter geht weg): Ohne Spiegelung (uReflStrength 0, boardReflection) bleibt das Brett
 * also genau so, wie es ohne Spiegelbild aussah, und liest die Textur nicht (Bedingung für alle Pixel gleich).
 */
function boardReflectGlsl(strength, warp = '') {
  return `
      if (uReflStrength > 0.0) {
        vec2 ruv = vReflUv.xy / vReflUv.w;${warp}
        // Unschärfe über Mipmaps nur mässig: tiefe Stufen mitteln in Blöcken (bis 32×32 Texel) und machten aus
        // gespiegelten Strahlen eine Kette weicher Flecken, die beim Bewegen der Kamera wanderten ("Wellen").
        // Die Strahlen werden für die Spiegelung ohnehin breit und weich gezeichnet (renderReflection).
        // uReflLodShift: höhere Pixeldichte (Handy) → entsprechend tiefere Stufe, gleiche Unschärfe wie am Desktop
        vec3 refl = texture2D(tReflect, ruv, min(1.0 + roughnessFactor * 2.0, 2.2) + uReflLodShift).rgb;
        float ndv = clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0);
        float fresnel = 0.22 + 0.78 * pow(1.0 - ndv, 4.0);
        float gloss = 1.0 - smoothstep(0.15, 0.7, roughnessFactor);
        gl_FragColor.rgb += refl * fresnel * gloss * uReflStrength * ${strength};
      }`;
}

// Analytische Details des Steinbretts (Plattenkoordinaten in Welteinheiten), kantengeglättet über fwidth.
const FLOOR_DETAIL_GLSL = `
  float floorGroove = 0.0, floorInlay = 0.0, floorBevel = 0.0;
  {
    vec2 pp = (vUv - 0.5) * ${PLATE.toFixed(4)};
    float halfBoard = ${(BOARD / 2).toFixed(4)};

    // Gravierte Rasterlinien; Kontrast sinkt, wenn die Linie schmaler als ein Pixel wird
    vec2 q = (pp + halfBoard) / ${CELL.toFixed(4)};
    vec2 fw = max(fwidth(q), vec2(1e-5));
    vec2 gq = abs(fract(q + 0.5) - 0.5);
    float lw = ${(0.0055 / CELL).toFixed(5)};
    vec2 line = (1.0 - smoothstep(vec2(lw) - fw * 0.5, vec2(lw) + fw * 0.5, gq)) * clamp(lw * 2.0 / fw, 0.25, 1.0);
    vec2 apw = fwidth(pp);
    vec2 inside = 1.0 - smoothstep(vec2(halfBoard), vec2(halfBoard) + apw, abs(pp));
    floorGroove = max(line.x, line.y) * inside.x * inside.y;

    // Helle, matte Einlegelinie knapp ausserhalb des Spielfelds. Bewusst nicht metallisch:
    // eine dünne Glanzlinie auf leicht unebenem Grund glitzert pixelweise (wirkt gestrichelt).
    float box = max(abs(pp.x), abs(pp.y));
    float bw = max(fwidth(box), 1e-5);
    float r1 = abs(box - (halfBoard + 0.16));
    float iw = 0.011;
    floorInlay = (1.0 - smoothstep(iw - bw, iw + bw, r1)) * clamp(iw * 2.0 / bw, 0.2, 1.0);

    // Polierte Fase an der Plattenkante: fängt das Licht und zeichnet die Silhouette
    float edgeDist = ${(PLATE / 2).toFixed(4)} - box;
    floorBevel = (1.0 - smoothstep(0.0, 0.06, edgeDist)) * 0.7;
  }
`;

/* ---------- Übergang zwischen Brettern (Ticket 05): für alle Arten gleich, an einer Stelle ---------- */

/**
 * Wie zwei Bretter ineinander übergehen, auch verschiedener Form: Das neue wächst von der Mitte nach aussen über das
 * bisherige, mit leuchtender, fransiger Front, über die ganze Dauer des Himmels (boardTheme). Beide zeichnen dabei
 * undurchsichtig; jedes verwirft die Pixel, die gerade dem anderen gehören (discard). Welchem Brett ein Pixel gehört,
 * entscheidet ein Wert n (0 … 1) des Sehstrahls durch dieses Pixel, nicht der Ort des Bretts: n hängt am Punkt, wo der
 * Strahl in die Hülle aller Bretter tritt (Quader über den Umriss, von y = 0 bis BOARD_BLEND_HULL_Y; Teile ausserhalb
 * der Hülle über dem Brett nehmen ihren eigenen Ort), innen klein, aussen
 * und unten gross, mit Rauschen. Beide Bretter rechnen für ein Pixel also dasselbe n; das neue zeichnet, wo n unter der
 * Front liegt, das bisherige darüber (um BOARD_BLEND_EPS überlappend). So ist jedes Pixel, das beide decken (der Schnitt
 * der Kernquader), in jedem Bild von einem der beiden gedeckt, und eingezogene oder hängende Teile des neuen kommen
 * schon während des Übergangs zum Vorschein: Wo das bisherige verworfen wird, sieht man dahinter das neue. Ebenso gehen
 * überstehende Teile des bisherigen nach und nach. Vorab übersetzt wird die Fassung mit BOARD_BLEND (variant).
 * Wird ein Übergang umgelenkt, behält jedes Brett sein Stück, und das neue wächst darüber (bis zu vier Abschnitte von n
 * je Brett). Netze mit eigenem ShaderMaterial (Funken, Tropfen, Körner) gehören nicht dazu: Sie blenden über den Anteil
 * in setFade selbst aus.
 */
// Unterkante der Hülle (m), unter dem tiefsten Teil aller Bretter: Die längste Basaltsäule endet bei −2,84 m (fester
// Zufall, basaltColumns); eine Art, die tiefer reicht, muss sie senken
const BOARD_BLEND_HULL_Y = -2.9;
const BOARD_BLEND_EPS = 0.002;  // so weit überlappen die Stücke zweier Bretter (keine Lücke aus Rundung)
const boardBlendHull = { value: new THREE.Vector2(PLATE / 2, BOARD_BLEND_HULL_Y) };
const BOARD_BLEND_DECL = `
#ifdef BOARD_BLEND
  uniform vec4 uBoardBlend[2]; // Abschnitte von n [von, bis), in denen dieses Brett zeichnet (x, y und z, w)
  uniform vec3 uBoardFront;    // Front des neuen Bretts: x n, y Stärke des Leuchtens (0: keines), z Breite in n
  uniform vec2 uBoardHull;     // Hülle: x halbe Breite, y Unterkante
  varying vec3 vBoardView;
  float bbHash(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
  float bbNoise(vec3 x) {
    vec3 i = floor(x), f = fract(x), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(bbHash(i), bbHash(i + vec3(1.0, 0.0, 0.0)), u.x),
                   mix(bbHash(i + vec3(0.0, 1.0, 0.0)), bbHash(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
               mix(mix(bbHash(i + vec3(0.0, 0.0, 1.0)), bbHash(i + vec3(1.0, 0.0, 1.0)), u.x),
                   mix(bbHash(i + vec3(0.0, 1.0, 1.0)), bbHash(i + vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
  }
  // Eintritt des Strahls o + t·d in den Quader lo … hi (t ≥ 0)
  bool bbBox(vec3 o, vec3 d, vec3 lo, vec3 hi, out float t) {
    vec3 inv = 1.0 / (d + vec3(equal(d, vec3(0.0))) * 1e-7);
    vec3 a = (lo - o) * inv, b = (hi - o) * inv, n = min(a, b), f = max(a, b);
    float t0 = max(max(n.x, n.y), n.z), t1 = min(min(f.x, f.y), f.z);
    t = max(t0, 0.0);
    return t1 >= t;
  }
  // n dieses Pixels: Liegt das Stück des Bretts nicht über y = 0, zählt der Sehstrahl (wo er in die Hülle tritt; für alle
  // Bretter gleich, darum decken sie dort lückenlos). Liegt es darüber (Polster, Kräuter), zählt sein eigener Ort:
  // Sonst bekäme es den Eintritt seines Strahls weiter innen und erschiene zu früh. Den Kernquader deckt jedes Brett
  // mit Stücken in der Hülle. Innen klein, zum Rand und nach unten gross, dazu Rauschen
  // Ort der Kamera aus viewMatrix: three setzt cameraPosition nur für einige Materialien (Standard, Phong, Toon, Shader
  // oder mit envMap), für MeshLambertMaterial bliebe es (0, 0, 0) und n falsch (Basaltsäulen, Polster des Moospolsters)
  float boardBlendN() {
    vec3 cam = -(vec4(viewMatrix[3].xyz, 0.0) * viewMatrix).xyz;
    vec3 v = (vec4(vBoardView, 0.0) * viewMatrix).xyz, w = cam + v, d = normalize(v), p = w;
    float h = uBoardHull.x + 0.005, t;
    bool drin = w.y < 0.005; // über dem Brett: draussen (die Metallkante des Steinbretts etwa, bündig, zählt als drin)
    if (drin && bbBox(cam, d, vec3(-h, uBoardHull.y, -h), vec3(h, 0.005, h), t)) p = cam + d * t;
    float r = min(1.0, length(p.xz) / (uBoardHull.x * 1.41421) + max(0.0, -p.y) * 0.1);
    float g = bbNoise(p * 0.9) * 0.7 + bbNoise(p * 2.4 + 11.0) * 0.3;
    return clamp(0.015 + 0.82 * r + 0.24 * (g - 0.5) * min(1.0, r * 4.0), 0.0, 1.0);
  }
#endif
`;
const BOARD_BLEND_START = `
#ifdef BOARD_BLEND
  float bbN = boardBlendN();
  bool bbIn = false;
  for (int i = 0; i < 2; i++) {
    vec4 q = uBoardBlend[i];
    bbIn = bbIn || (bbN >= q.x && bbN < q.y) || (bbN >= q.z && bbN < q.w);
  }
  if (!bbIn) discard;
#endif
`;
const BOARD_BLEND_GLOW = `
#ifdef BOARD_BLEND
  if (uBoardFront.y > 0.0) { // die Front leuchtet warm, knapp innerhalb des neuen Bretts
    float bbE = (uBoardFront.x - bbN) / uBoardFront.z;
    if (bbE >= 0.0 && bbE < 1.0) gl_FragColor.rgb += vec3(1.0, 0.82, 0.55) * (1.0 - bbE) * (1.0 - bbE) * uBoardFront.y;
  }
#endif
`;

/**
 * Das Überblenden eines Bretts (BOARD_BLEND_DECL): hängt sich an alle Materialien seiner Netze (ausser ShaderMaterial)
 * und gibt { variant (Fassung mit BOARD_BLEND für compileParallel), set(ranges, front) } zurück. ranges: Abschnitte
 * [von, bis) von n, in denen es zeichnet (höchstens vier, aufsteigend; [[0, 1]]: ganz, ohne Überblenden, die Programme
 * wie ohne diesen Teil); front: [n, Stärke] der Front oder null. Je Bild aus boardTheme.render.
 */
function boardBlend(group) {
  const parts = [new THREE.Vector4(), new THREE.Vector4()];
  const uniforms = { uBoardBlend: { value: parts }, uBoardFront: { value: new THREE.Vector3(0, 0, 0.03) },
    uBoardHull: boardBlendHull };
  const materials = new Set();
  group.traverse((o) => { if (o.isMesh) for (const m of [o.material].flat()) if (!m.isShaderMaterial) materials.add(m); });
  for (const m of materials) {
    // three unterscheidet Programme nach onBeforeCompile.toString(): Hier steht für alle Materialien dieselbe Hülle,
    // also den Schlüssel des eigenen Codes behalten (BOARD_BLEND steht in defines und trennt die Fassungen)
    const prev = m.onBeforeCompile, key = m.customProgramCacheKey();
    m.customProgramCacheKey = () => key;
    m.onBeforeCompile = (shader, r) => {
      prev.call(m, shader, r);
      Object.assign(shader.uniforms, uniforms); // auch ohne BOARD_BLEND: three nimmt die Uniforms der zuletzt gebauten
      shader.vertexShader = shader.vertexShader
        .replace('void main() {', '#ifdef BOARD_BLEND\nvarying vec3 vBoardView;\n#endif\nvoid main() {')
        .replace('#include <project_vertex>', '#include <project_vertex>\n#ifdef BOARD_BLEND\nvBoardView = mvPosition.xyz;\n#endif');
      shader.fragmentShader = shader.fragmentShader
        .replace('void main() {', `${BOARD_BLEND_DECL}\nvoid main() {\n${BOARD_BLEND_START}`)
        .replace('#include <tonemapping_fragment>', `${BOARD_BLEND_GLOW}\n#include <tonemapping_fragment>`);
    };
  }
  let on = false;
  const blend = (an) => {
    if (an === on) return;
    on = an;
    for (const m of materials) {
      m.defines ??= {};
      if (an) m.defines.BOARD_BLEND = '';
      else delete m.defines.BOARD_BLEND;
      m.needsUpdate = true; // eigene Programme, beim Laden vorab übersetzt (variant)
    }
  };
  return {
    variant: () => { const was = on; blend(true); return () => blend(was); },
    set(ranges, front) {
      blend(!(ranges.length === 1 && ranges[0][0] <= 0 && ranges[0][1] >= 1));
      if (!on) return;
      const n = Math.min(ranges.length, 4);
      for (let i = 0; i < 4; i++) {
        let lo = 0, hi = 0; // leer
        if (i < n) { // mehr als vier Abschnitte (mehrfach umgelenkt): der vierte reicht bis zum Ende des letzten
          const von = ranges[i][0], bis = i === n - 1 ? ranges.at(-1)[1] : ranges[i][1];
          lo = von <= 0 ? -1 : von - BOARD_BLEND_EPS;
          hi = bis >= 1 ? 2 : bis;
        }
        const v = parts[i >> 1];
        if (i & 1) { v.z = lo; v.w = hi; } else { v.x = lo; v.y = hi; }
      }
      uniforms.uBoardFront.value.set(front?.[0] ?? 0, front?.[1] ?? 0, 0.03);
    },
  };
}

/**
 * Steinbrett (Art stone, ohne Werte): dunkler, fein geäderter Schiefer (Texturen aus dem Hintergrund-Thread,
 * createStoneTextures) mit eingravierten Rasterlinien, heller Einlegelinie und Fase (FLOOR_DETAIL_GLSL), Spiegelung und
 * Lichtwelle auf der Oberfläche, dazu polierte dunkle Seiten und eine schmale Metallkante. Das Brett von Milchstrasse
 * und Sonnensystem und der Rückfall ohne Brett-Angabe. Rückgabe wie jede Art (BOARD_TYPES).
 */
function stoneBoard() {
  const stoneTex = createStoneTextures(QUALITY.textureSize);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: stoneTex.map,
    roughness: 1.0,
    roughnessMap: stoneTex.roughnessMap,
    metalness: 0.0,
    normalMap: stoneTex.normalMap,
    normalScale: new THREE.Vector2(0.12, 0.12), // nur ein Hauch Relief – sonst wirken Spiegelungen ölig-wellig
    envMapIntensity: 0.22,
  });
  floorMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shockUniforms);
    addBoardReflection(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uShock;\nuniform vec3 uShockColor;')
      .replace('#include <map_fragment>', `#include <map_fragment>
      ${FLOOR_DETAIL_GLSL}
      diffuseColor.rgb *= 1.0 - floorGroove * 0.6;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.16, 0.18), floorInlay);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 2.2 + 0.012, floorBevel);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor = mix(roughnessFactor, 0.8, floorGroove);
      roughnessFactor = mix(roughnessFactor, 0.55, floorInlay);
      roughnessFactor = mix(roughnessFactor, 0.12, floorBevel);`)
      .replace('#include <tonemapping_fragment>', `${boardReflectGlsl('0.42')}
      if (uShock.y > 0.0) {
        // Ring um die Feldmitte, dahinter ein schwacher Nachschein
        float sd = length((vUv - 0.5) * ${PLATE.toFixed(4)});
        float ring = exp(-pow((sd - uShock.x) / uShock.z, 2.0));
        float trail = (1.0 - smoothstep(0.0, max(uShock.x, 1e-3), sd)) * 0.04;
        gl_FragColor.rgb += uShockColor * (ring + trail) * uShock.y;
      }
      #include <tonemapping_fragment>`);
    floorMaterial.userData.shader = shader;
  };

  const floorTop = new THREE.Mesh(new THREE.PlaneGeometry(PLATE, PLATE), floorMaterial);
  floorTop.rotation.x = -Math.PI / 2;
  floorTop.receiveShadow = true;

  // Seitenkanten: poliert, damit sie Softbox-Licht fangen und sich vom Hintergrund lösen
  const plateSideMaterial = new THREE.MeshStandardMaterial({
    color: 0x14141b,
    roughness: 0.22,
    metalness: 0.0,
    envMapIntensity: 1.4,
  });
  const plateSides = new THREE.Mesh(new THREE.BoxGeometry(PLATE, PLATE_THICK, PLATE), plateSideMaterial);
  plateSides.position.y = -PLATE_THICK / 2 - 0.03; // Deckfläche deutlich unter der Oberfläche
  plateSides.receiveShadow = true;

  // Alles in einer Gruppe, die Teile der Kante direkt darin: So entstehen genau so viele Objekte wie früher, als die
  // Kante eine eigene Gruppe in der Szene war. three zieht für jede Kennung (uuid) Zufallszahlen; ein Objekt mehr
  // verschöbe mit ?t= den festen Zufall, und Vergleichsbilder zeigten etwa die Ziele anders gedreht
  const group = new THREE.Group();
  group.add(floorTop, plateSides);
  // Schmale Metallkante rundum (ausserhalb der Fläche, minimal erhaben)
  // – klare Silhouette aus jedem Blickwinkel, ohne mit der Oberfläche zu überlappen.
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x8d8e98, metalness: 1.0, roughness: 0.28, envMapIntensity: 1.3 });
  {
    const T = 0.024, H = 0.056, y = 0.003 - H / 2;
    for (const sgn of [-1, 1]) {
      const bx = new THREE.Mesh(new THREE.BoxGeometry(PLATE + 2 * T, H, T), trimMat);
      bx.position.set(0, y, sgn * (PLATE / 2 + T / 2));
      const bz = new THREE.Mesh(new THREE.BoxGeometry(T, H, PLATE), trimMat);
      bz.position.set(sgn * (PLATE / 2 + T / 2), y, 0);
      bx.receiveShadow = bz.receiveShadow = true;
      group.add(bx, bz);
    }
  }

  // Überblenden: boardBlend (für alle Arten gleich)
  const materials = [floorMaterial, plateSideMaterial, trimMat];
  const textures = [stoneTex.map, stoneTex.roughnessMap, stoneTex.normalMap];
  return {
    group,
    mirror: floorTop,
    textures,
    computed: stoneTex.computed,
    setFade(k) { group.visible = k > 0; },
    dispose() {
      group.traverse((o) => o.geometry?.dispose());
      for (const m of materials) m.dispose();
      for (const t of textures) t.dispose();
    },
  };
}

// Lichtwelle «Brandung» des Gezeitenbeckens (tidePoolBoard), GLSL. Rauschen: Hash, Wertrauschen, drei Oktaven
const TIDE_NOISE_GLSL = `
  float wHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float wNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), u.x), mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float wFbm(vec2 p) { return wNoise(p) * 0.55 + wNoise(p * 2.07 + 13.1) * 0.3 + wNoise(p * 4.3 + 7.7) * 0.15; }
  float wBell(float x) { return exp(-x * x); } // Glocke; pow(x, 2.0) ist für x < 0 in GLSL nicht festgelegt
`;
// nach der Farbe (sieht floorGroove): wp Ort (m), wd Abstand zur Mitte, wbx Kastenabstand, wAge Sekunden, seit der Ring
// hier ankam (< 0: noch nicht), wChan Rinne, wFld Feld samt nassem Rand; der Stein wird hinter der Front nass und
// trocknet fleckig (in den Rillen zuletzt)
const TIDE_WAVE_PRE = `
      vec2 wp = (vUv - 0.5) * ${PLATE.toFixed(4)};
      float wd = length(wp), wbx = max(abs(wp.x), abs(wp.y));
      float wAge = uShockT - wd / ${SHOCK_SPEED.toFixed(2)};
      float wChan = smoothstep(uChannel.x - 0.01, uChannel.x + 0.01, wbx) * (1.0 - smoothstep(uChannel.y - 0.01, uChannel.y + 0.01, wbx));
      float wFld = 1.0 - smoothstep(uChannel.x - 0.02, uChannel.x + 0.01, wbx);
      float wWet = 0.0;
      if (uShockT < ${SHOCK_REST_S.toFixed(1)} && wAge > -0.05) {
        float dry = 0.75 + wFbm(wp * 1.3) + floorGroove * 0.6;
        wWet = smoothstep(-0.01, 0.03, wAge) * (1.0 - smoothstep(dry - 0.4, dry, wAge)) * wFld;
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * diffuseColor.rgb * 0.9, wWet * 0.8);
      }`;
// in der Spiegelung (boardReflectGlsl): Sie kräuselt sich in der Rinne, wenn die Welle ankommt
const TIDE_RIPPLE_GLSL = `
        if (uShockT < ${SHOCK_REST_S.toFixed(1)} && wAge > 0.0) {
          float rp = sin(wd * 26.0 - uShockT * 15.0 + wbx * 9.0) * exp(-wAge * 1.2) * wChan;
          ruv += vec2(rp * 0.012, rp * 0.007);
        }`;
// vor dem Tonemapping: Schaumkrone an der Front (~25 cm), zerrissen, dahinter Schaumfäden, die zerfallen, und eine
// dünne, klare Wasserschicht; ganz vorn ein Lichtsaum in der Farbe der Welle; Glitzern auf dem nassen Stein. In der
// Rinne schlägt die Welle an und Schaum treibt rundum, mit eigener Stärke
const TIDE_WAVE_GLSL = `
      if (uShockT < ${SHOCK_REST_S.toFixed(1)} && wAge > -0.05) {
        float fa = wAge;
        float crest = wBell((fa - 0.022) / 0.03) * wFld;
        float lace = 0.0, foam = 0.0;
        if (fa < 0.45) {
          float fn = wFbm(wp * 9.0 + vec2(uShockT * 1.4, -uShockT));
          foam = smoothstep(0.42, 0.62, crest * (0.45 + fn * 0.95));
          float ln = abs(wNoise(wp * 6.0 + vec2(uShockT * 0.6, 0.3)) - 0.5);
          float lpatch = smoothstep(0.45, 0.72, wNoise(wp * 2.3 + 4.0));
          lace = (1.0 - smoothstep(0.0, 0.045, ln)) * lpatch * wBell((fa - 0.09) / 0.07) * wFld;
        }
        float sheet = smoothstep(0.02, 0.05, fa) * exp(-max(fa - 0.05, 0.0) * 6.0) * wFld;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * vec3(0.6, 0.88, 0.88) + vec3(0.02, 0.07, 0.07), sheet * 0.6);
        float glint = wBell((fa + 0.006) / 0.012) * wFld;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 1.08, 1.08), clamp(foam * 0.92 + lace * 0.6, 0.0, 1.0));
        gl_FragColor.rgb += (uShockColor + vec3(0.3, 0.4, 0.4)) * glint * 0.9;
        gl_FragColor.rgb += vec3(1.3, 1.45, 1.45) * step(0.993, wHash(floor(wp * 60.0) + floor(uShockT * 10.0))) * wWet;
        if (wChan > 0.0) {
          float ca = smoothstep(-0.02, 0.05, fa) * exp(-max(fa, 0.0) * 1.3) * wChan;
          float cf = smoothstep(0.45, 0.72, wFbm(wp * 8.0 + vec2(uShockT * 0.9, -uShockT * 0.6)));
          float swell = wBell((fa - 0.05) / 0.08) * wChan;
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.05, 1.12, 1.12), clamp(cf * ca * 0.95 + swell * 0.75, 0.0, 1.0));
          gl_FragColor.rgb += vec3(0.2, 0.45, 0.42) * ca * 0.35;
        }
      }`;
const TIDE_DROPS_S = 2; // so lange nach dem Start des Rings fliegen Tropfen (der letzte landet nach 1,9 s)

/**
 * Tropfen der Brandung (tidePoolBoard): 760 Vierecke als Instanzen, Flug ganz im Vertex-Shader nach der Ankunft des Rings
 * (uShockT). An der Krone über dem Feld flach und mit der Welle nach aussen, an der Rinne hoch (Gischt an Innen- und
 * Aussenkante). Additiv hell, ohne das Alpha des Bilds zu ändern (Pinselfilter, Farbsaum im letzten Bildschritt).
 * uFade: Anteil beim Überblenden.
 */
function tideDrops(IN, OUT) {
  const r = mulberry32(501), a0 = [], a1 = [];
  // Zufallspunkt im Kastenring lo ≤ max(|x|, |z|) ≤ hi, gleich verteilt
  const ring = (lo, hi) => {
    let x, z, b;
    do { x = (r() * 2 - 1) * hi; z = (r() * 2 - 1) * hi; b = Math.max(Math.abs(x), Math.abs(z)); } while (b < lo || b > hi);
    return [x, z];
  };
  for (let i = 0; i < 420; i++) {
    const [x, z] = ring(0.4, IN - 0.05), up = 0.9 + r() * 1.3;
    a0.push(x, z, r() * 0.04, up);
    a1.push(SHOCK_SPEED * (0.8 + r() * 0.3), 0.022 + r() * 0.024, r());
  }
  for (let i = 0; i < 340; i++) {
    const outer = r() < 0.3, [x, z] = ring(outer ? OUT - 0.04 : IN - 0.02, outer ? OUT + 0.02 : IN + 0.1), up = 1.8 + r() * 1.6;
    a0.push(x, z, 0.01 + r() * 0.12, up);
    a1.push(0.4 + r() * 1.4, 0.022 + r() * 0.03, r());
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('a0', new THREE.InstancedBufferAttribute(new Float32Array(a0), 4));
  g.setAttribute('a1', new THREE.InstancedBufferAttribute(new Float32Array(a1), 3));
  g.instanceCount = a0.length / 4;
  const material = new THREE.ShaderMaterial({
    uniforms: { uShockT: shockUniforms.uShockT, uFade: { value: 1 } },
    vertexShader: `
      uniform float uShockT;
      attribute vec4 a0; // x, z, Verzug (s), Anfangstempo nach oben (m/s)
      attribute vec3 a1; // Tempo nach aussen (m/s), Grösse (m), Zufall
      varying vec2 vC;
      varying float vA;
      void main() {
        float age = uShockT - (length(a0.xy) / ${SHOCK_SPEED.toFixed(2)} + a0.z), life = 2.0 * a0.w / 9.81;
        vC = position.xy;
        vA = 0.0;
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0); // ausserhalb des Bilds
        if (age > 0.0 && age < life) {
          vec2 dir = normalize(a0.xy + 1e-4), side = vec2(-dir.y, dir.x);
          vec2 xz = a0.xy + dir * a1.x * age + side * (a1.z - 0.5) * 0.8 * age;
          vec4 mv = modelViewMatrix * vec4(xz.x, 0.02 + a0.w * age - 4.905 * age * age, xz.y, 1.0);
          mv.xy += position.xy * a1.y * (1.0 - 0.4 * age / life);
          gl_Position = projectionMatrix * mv;
          vA = smoothstep(0.0, 0.03, age) * (1.0 - smoothstep(life * 0.7, life, age)) * 0.9;
        }
      }`,
    fragmentShader: `
      uniform float uFade;
      varying vec2 vC;
      varying float vA;
      void main() {
        float d = length(vC);
        if (d > 1.0 || vA <= 0.003) discard;
        gl_FragColor = vec4(1.15, 1.3, 1.32, (1.0 - smoothstep(0.3, 1.0, d)) * vA * uFade);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending, // wie NormalBlending, aber das Alpha des Bilds bleibt
    blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  return mesh;
}

/**
 * Gezeitenbecken (Art tidePool, das Brett des Strands; Ticket 04, aus dem Katalog gewählt: Karte 6): Feld aus hellem
 * Sandstein mit eingravierten Rasterlinien, im Rand eine flache Rinne mit klarem Wasser (Lichtnetz am Grund, Schaum an den
 * Kanten; die Wasserkante ersetzt die Einlegelinie), aussen eine schmale Felslippe. Die Seiten sind nasser Fels mit
 * Rinnsalen. Gespiegelt wird nur in der Rinne, dort stark: über die Rauheit (Wasser glatt, Stein und Fels matt). Form wie
 * das Steinbrett ohne Metallkante: Oberfläche in y = 0, die Seiten bündig darunter. Texturen im Hintergrund-Thread
 * (tidePoolData) in der Grösse des Steinbretts (QUALITY.textureSize), dazu die Seiten (1024 × 64).
 * Lichtwelle «Brandung» (Vorschau in .scratch/brett-je-himmel/lichtwelle/, Variante A): Eine Welle mit Schaumkrone rollt
 * mit dem Ring über den Stein, Tropfen spritzen (tideDrops). Dahinter ist der Stein nass, glänzt und trocknet fleckig. In
 * der Rinne steigt Gischt auf, Schaum treibt rundum, die Spiegelung kräuselt sich. Alles folgt der Ankunft des Rings
 * (shockClock), nicht seiner Stärke.
 * values: { stone, water, rock (je zwei Farben sRGB 0 … 1: hell, dunkel), channel ([innen, aussen], Kastenabstand von der
 * Mitte in m) } (BOARD_PARAMS in tools/sky-schema.mjs). Rückgabe wie jede Art (BOARD_TYPES).
 */
function tidePoolBoard(values) {
  for (const k of ['stone', 'water', 'rock', 'channel']) if (!values[k]) throw new Error(`Gezeitenbecken ohne ${k}`);
  const N = QUALITY.textureSize, SIDE_H = 64, [IN, OUT] = values.channel;
  const tex = boardTextures(
    { map: [N, N, true], roughnessMap: [N, N, false], normalMap: [N, N, false], side: [N, SIDE_H, true] }, tidePoolData,
    { size: N, sideH: SIDE_H, plate: PLATE, stone: values.stone, water: values.water, rock: values.rock, channel: [IN, OUT] });
  const channel = { value: new THREE.Vector2(IN, OUT) };

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tex.map,
    roughness: 1.0,
    roughnessMap: tex.roughnessMap,
    metalness: 0.0,
    normalMap: tex.normalMap,
    envMapIntensity: 0.9,
  });
  floorMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shockUniforms, { uChannel: channel });
    addBoardReflection(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform vec3 uShockColor;\nuniform float uShockT;\nuniform vec2 uChannel;\n${TIDE_NOISE_GLSL}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
      ${FLOOR_DETAIL_GLSL}
      diffuseColor.rgb *= 1.0 - floorGroove * 0.5;
      ${TIDE_WAVE_PRE}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor = mix(roughnessFactor, 0.8, floorGroove);
      roughnessFactor = mix(roughnessFactor, 0.1, wWet * 0.9);`)
      .replace('#include <tonemapping_fragment>', `${boardReflectGlsl('0.85', TIDE_RIPPLE_GLSL)}
      ${TIDE_WAVE_GLSL}
      #include <tonemapping_fragment>`);
  };
  const floorTop = new THREE.Mesh(new THREE.PlaneGeometry(PLATE, PLATE), floorMaterial);
  floorTop.rotation.x = -Math.PI / 2;
  floorTop.receiveShadow = true;

  // Seiten: matt und nass; im Spiel fällt kaum Licht auf senkrechte Flächen, darum leuchtet ein Teil der Farbe selbst
  // (Licht des Strands), sonst stünden sie bei flachem Blick schwarz im Bild. Ohne Deckfläche: Die Oberfläche liegt
  // bündig darauf (keine Fuge, kein Flimmern)
  const sideMaterial = new THREE.MeshStandardMaterial({
    map: tex.side, roughness: 0.5, envMapIntensity: 1.6, emissiveMap: tex.side, emissive: new THREE.Color().setScalar(0.28),
  });
  const H = PLATE_THICK + 0.03, sideGeo = new THREE.BoxGeometry(PLATE, H, PLATE);
  const top = sideGeo.groups[2], idx = Array.from(sideGeo.index.array); // Gruppen +x, −x, +y, −y, +z, −z
  idx.splice(top.start, top.count);
  sideGeo.setIndex(idx);
  sideGeo.clearGroups();
  const sides = new THREE.Mesh(sideGeo, sideMaterial);
  sides.position.y = -H / 2;
  sides.receiveShadow = true;

  const drops = tideDrops(IN, OUT);
  const group = new THREE.Group();
  group.add(floorTop, sides, drops);

  // Überblenden: boardBlend (für alle Arten gleich); die Tropfen blenden mit dem Anteil
  const materials = [floorMaterial, sideMaterial];
  const textures = [tex.map, tex.roughnessMap, tex.normalMap, tex.side];
  return {
    group,
    mirror: floorTop,
    textures,
    computed: tex.computed,
    setFade(k) {
      group.visible = k > 0;
      drops.material.uniforms.uFade.value = k;
      // je Bild (boardTheme.render): Tropfen nur zeichnen, solange die Lichtwelle sie wirft
      drops.visible = shockUniforms.uShockT.value < TIDE_DROPS_S;
    },
    dispose() {
      group.traverse((o) => o.geometry?.dispose());
      for (const m of [...materials, drops.material]) m.dispose();
      for (const t of textures) t.dispose();
    },
  };
}

/* ---------- Lehmterrasse (Art clay): das Brett der Wüste (Ticket 06) ---------- */

// Masse der Lehmterrasse (m). Das Brett ist das Dach eines Lehmbaus wie der Moschee von Djenné: Unter einem Gesims über
// die ganze Breite steht eine eingezogene Wand, aus der Balken aus Palmholz ragen (Torons, je 22 cm). Die Ecken des
// Rands bleiben frei. Lehm ist matt: keine Spiegelung
const CLAY = {
  cornice: 0.09,          // Gesims über die ganze Breite (PLATE), 3 mm unter der Oberfläche
  wall: 9.3, wallH: 0.34, // eingezogene Wand unter dem Gesims: Breite, Höhe
  wallTex: [1024, 128],   // Textur von Gesims und Wand (u über PLATE, v über die Höhe einer Seite)
  grains: 2600,           // Körner, die mit der Fahne über den Putz hüpfen (Lichtwelle)
  falls: [44, 8],         // je Seite so viele Strähnen zu so vielen Körnern, die über das Gesims rieseln
  waveEnd: 3.2,           // so lange (s nach dem Start des Rings) sind Körner unterwegs, danach nicht gezeichnet
};
// Werte der Brett-Angabe (tools/sky-schema.mjs, BOARD_PARAMS), alle Farben sRGB 0 … 1
const CLAY_VALUES = ['plaster', 'straw', 'brick', 'joint', 'gully', 'inlay', 'wood', 'sand'];

/**
 * Farbe und Normalen der Lehmterrasse (createClayTextures), ohne Bezug auf das übrige Spiel (Worker). Formeln und Farben
 * aus dem Katalog (katalog-wueste, 2-lehm.js), die Höhen ungerundet. Feld size² über das ganze Brett (Zeile j bei
 * uv.y = (j + ½) / size, also z von +plate/2 nach −plate/2): glatter Lehmputz in zwei Tönen (plaster) mit Kellenstrichen
 * und Strohhalmen (straw), im Rand (ab half + 0,26 m) stellenweise abgeplatzt, dort Ziegel (brick, zwei Töne) mit Fugen
 * (joint). Wand wallW × wallH: Putz mit Regenrinnen (gully). Farben sRGB 0 … 1 (v: Werte der Brett-Angabe).
 */
function clayData({ size, plate, half, wallW, wallH, v }) {
  const hash = (x, y, s) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  const fbm = (x, y, oct, s) => {
    let sum = 0, amp = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { sum += amp * noise(x * f, y * f, s + i * 17); n += amp; amp *= 0.5; f *= 2.03; }
    return sum / n;
  };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const put = (out, k, c) => { out[k] = c[0] * 255; out[k + 1] = c[1] * 255; out[k + 2] = c[2] * 255; out[k + 3] = 255; };

  const n = size * size, texel = plate / size;
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n);
  for (let j = 0; j < size; j++) {
    const z = plate / 2 - (j + 0.5) * texel;
    for (let i = 0; i < size; i++) {
      const x = -plate / 2 + (i + 0.5) * texel, k = j * size + i, box = Math.max(Math.abs(x), Math.abs(z));
      const g = fbm(x * 0.4, z * 0.4, 4, 82), straw = noise(x * 160, z * 160, 83);
      // Kellenstriche: flache Bögen
      const sw = Math.sin(Math.hypot(x - Math.round(x / 0.9) * 0.9, z - Math.round(z / 0.9) * 0.9 + 0.4) * 22 + g * 4);
      let c = mix(v.plaster[0], v.plaster[1], smooth(0.3, 0.75, g));
      if (straw > 0.9) c = mix(c, v.straw, 0.5);
      let h = sw * 0.0004 + (straw - 0.5) * 0.0004;
      if (box > half + 0.26) { // Rand: Putz stellenweise abgeplatzt, Ziegel sichtbar
        const off = smooth(0.52, 0.56, fbm(x * 1.6, z * 1.6, 3, 84));
        const bx = (Math.abs(x) > Math.abs(z) ? z : x) / 0.32, by = box / 0.12, row = Math.floor(by);
        const joint = Math.abs(by - row - 0.5) > 0.42 || Math.abs((((bx + row * 0.5) % 1) + 1) % 1 - 0.5) > 0.45;
        const brick = mix(v.brick[0], v.brick[1], noise(Math.floor(bx + row * 0.5), row, 85));
        c = mix(c, joint ? v.joint : brick, off);
        h -= off * 0.004 + (joint ? off * 0.002 : 0);
      }
      put(color, k * 4, c);
      height[k] = h;
    }
  }
  // Normalen im Raum der Textur (+u = +x, +v = −z): (−∂h/∂u, −∂h/∂v, 1)
  const normal = new Uint8ClampedArray(n * 4);
  const H = (i, j) => height[Math.min(size - 1, Math.max(0, j)) * size + Math.min(size - 1, Math.max(0, i))];
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const nx = -(H(i + 1, j) - H(i - 1, j)) / (2 * texel), ny = -(H(i, j + 1) - H(i, j - 1)) / (2 * texel);
      const l = Math.hypot(nx, ny, 1);
      put(normal, (j * size + i) * 4, [(nx / l) * 0.5 + 0.5, (ny / l) * 0.5 + 0.5, (1 / l) * 0.5 + 0.5]);
    }
  }
  const wall = new Uint8ClampedArray(wallW * wallH * 4);
  for (let j = 0; j < wallH; j++) {
    const y = 1 - (j + 0.5) / wallH; // 0 oben … 1 unten (Zeile 0 liegt unten)
    for (let i = 0; i < wallW; i++) {
      const u = ((i + 0.5) / wallW) * plate;
      const g = fbm(u * 1.5, y * 2, 3, 86), gully = smooth(0.62, 0.8, fbm(u * 9, y * 0.5, 2, 87));
      put(wall, (j * wallW + i) * 4, mix(mix(v.plaster[0], v.plaster[1], g), v.gully, gully * 0.6));
    }
  }
  return { map: color, normalMap: normal, wallMap: wall };
}

/**
 * Texturen der Lehmterrasse, im Hintergrund-Thread berechnet wie die jedes Bretts (boardTextures): { map (Feld, sRGB),
 * normalMap (Feld), wallMap (Wand, sRGB, wiederholt), computed (Promise) }. Rauheit braucht es keine: Der Putz ist
 * überall gleich matt.
 */
function createClayTextures(v) {
  const size = QUALITY.textureSize, [wallW, wallH] = CLAY.wallTex;
  return boardTextures({ map: [size, size, true], normalMap: [size, size, false], wallMap: [wallW, wallH, true, true] },
    clayData, { size, plate: PLATE, half: BOARD / 2, wallW, wallH, v });
}

// Rauschen der Sandverwehung (GLSL): Hash, Wertrauschen, drei Oktaven
const CLAY_NOISE_GLSL = `
  float wHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float wNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), u.x),
      mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float wFbm(vec2 p) { return wNoise(p) * 0.55 + wNoise(p * 2.07 + 13.1) * 0.3 + wNoise(p * 4.3 + 7.7) * 0.15; }`;
/** Schlieren in Windrichtung (GLSL-Ausdruck): Rauschen bei q, über n Schritte längs wDir nach innen gemittelt */
const clayStreak = (q, n, step, freq) => `(${Array.from({ length: n }, (_, i) =>
  `wNoise((${q} - wDir * ${(i * step).toFixed(3)}) * ${freq.toFixed(1)})`).join(' + ')}) / ${n.toFixed(1)}`;

/**
 * Körner der Sandverwehung als Billboards (Instanzen eines Vierecks), bewegt ganz im Vertex-Shader nach der Uhr der
 * Lichtwelle (uWave). rows: je Korn acht Zahlen (a0, a1); vertex: GLSL, setzt pos (Welt), size (Halbmass, m), alpha und
 * col. uK: Anteil des Bretts beim Überblenden. Unsichtbar, bis die Uhr läuft (clayBoard, tick).
 */
function clayGrains(rows, vertex, uniforms) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const a0 = new Float32Array(rows.length * 4), a1 = new Float32Array(rows.length * 4);
  rows.forEach((r, i) => { a0.set(r.slice(0, 4), i * 4); a1.set(r.slice(4, 8), i * 4); });
  g.setAttribute('a0', new THREE.InstancedBufferAttribute(a0, 4));
  g.setAttribute('a1', new THREE.InstancedBufferAttribute(a1, 4));
  g.instanceCount = rows.length;
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `uniform vec4 uWave;
      uniform float uK;
      attribute vec4 a0, a1;
      varying vec2 vC;
      varying float vA;
      varying vec3 vCol;
      ${CLAY_NOISE_GLSL}
      void main() {
        vec3 pos = vec3(0.0), col = vec3(1.0);
        float size = 0.02, alpha = 0.0;
        ${vertex}
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        mv.xy += position.xy * size;
        gl_Position = alpha > 0.003 ? projectionMatrix * mv : vec4(0.0, 0.0, 2.0, 1.0); // sonst ausserhalb des Bilds
        vC = position.xy;
        vA = alpha * uK;
        vCol = col;
      }`,
    fragmentShader: `varying vec2 vC;
      varying float vA;
      varying vec3 vCol;
      void main() {
        float r = length(vC);
        if (r > 1.0) discard;
        gl_FragColor = vec4(vCol, (1.0 - smoothstep(0.3, 1.0, r)) * vA);
      }`,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  mesh.visible = false;
  return mesh;
}

/**
 * Lehmterrasse (Art clay, Wüste): glatter Lehmputz im Feld mit feinen Rillen als Raster und einer hellen Kalklinie als
 * Einlegelinie (FLOOR_DETAIL_GLSL, breiter), im Rand Ziegel, wo der Putz abgeplatzt ist (Texturen aus dem
 * Hintergrund-Thread, createClayTextures). Darunter Gesims und eingezogene Wand mit Balken aus Palmholz (als Instanzen);
 * die Ecken bleiben frei. Lehm ist matt: keine Spiegelung (mirror null, renderReflection entfällt). Lichtwelle
 * «Sandverwehung»: Mit dem Ring treibt eine Fahne aus Sand in Schlieren nach aussen, Körner hüpfen mit; dahinter bleiben
 * Sandzungen liegen, in den Rillen länger, und wehen fleckig fort. Am Gesims rieselt Sand in dünnen Strähnen hinunter.
 * v: Werte der Brett-Angabe (CLAY_VALUES, sRGB 0 … 1).
 */
function clayBoard(v) {
  for (const k of CLAY_VALUES) if (!v[k]) throw new Error(`Wert ${k} fehlt`);
  const srgb = (c, f = 1) => new THREE.Color().setRGB(c[0] * f, c[1] * f, c[2] * f, THREE.SRGBColorSpace);
  const tex = createClayTextures(v);

  // Uhr der Lichtwelle (uWave): x Sekunden seit dem Start des Rings (99: Ruhe), y frei laufend (s), z 1 / Tempo des
  // Rings. Alles richtet sich nach seiner Ankunft (x − Abstand · z), nicht nach seiner Stärke: Die fällt bis zum Rand auf
  // fast nichts (0,82 bei 0,7 m, 0,16 bei 4,3 m). Solange er läuft, folgt die Uhr seinem Radius (so auch dem langsameren
  // Ring der Geschichte, story.shock); danach läuft sie in Sekunden weiter, und die Verwehung klingt in eigener Zeit aus.
  // Gestellt, bevor die Oberfläche zeichnet (onBeforeRender): nur, solange das Brett zu sehen ist
  const uWave = { value: new THREE.Vector4(99, 0, 0, 0) }, uK = { value: 1 };
  let waveStart = null;
  const tick = () => {
    const s = shockUniforms.uShock.value, now = performance.now() / 1000, speed = CELEBRATE.shockSpeed;
    if (s.y > 0) waveStart = now - s.x / speed;
    const age = waveStart === null ? 99 : Math.min(99, now - waveStart);
    uWave.value.set(age, now % 600, 1 / speed, 0);
    grains.visible = falls.visible = age < CLAY.waveEnd; // wirkt ab dem nächsten Bild; ihre ersten Körner kommen später
  };

  // Oberfläche: Putz mit Rillen und Kalklinie, Sandzungen und Fahne der Lichtwelle
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, map: tex.map, normalMap: tex.normalMap, normalScale: new THREE.Vector2(1, 1), roughness: 0.92,
    metalness: 0, envMapIntensity: 0.4,
  });
  const uInlay = { value: srgb(v.inlay) }, uSand = { value: srgb(v.sand) };
  floorMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shockUniforms, { uWave, uInlay, uSand });
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
      uniform vec3 uShock, uShockColor, uInlay, uSand;
      uniform vec4 uWave;
      ${CLAY_NOISE_GLSL}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
      ${FLOOR_DETAIL_GLSL.replace('float iw = 0.011;', 'float iw = 0.02;')}
      diffuseColor.rgb *= 1.0 - floorGroove * 0.55;
      diffuseColor.rgb = mix(diffuseColor.rgb, uInlay, floorInlay);
      // Lichtwelle: Wo der Ring ankam (vor wAge s), bleiben Sandzungen in Windrichtung liegen, in den Rillen länger, und
      // wehen fleckig fort
      vec2 wp = (vUv - 0.5) * ${PLATE.toFixed(4)};
      float wd = length(wp), wAge = uWave.x - wd * uWave.z;
      vec2 wDir = wp / max(wd, 1e-3);
      if (uWave.x < 3.6 && wAge > -0.05 && wAge < 2.5) { // spätestens 2,5 s nach der Ankunft ist der Sand fort
        float gone = 0.8 + wFbm(wp * 1.1 + 3.0) + floorGroove * 0.7;
        float tongue = smoothstep(0.4, 0.62, ${clayStreak('wp', 5, 0.09, 9)});
        float sand = smoothstep(0.0, 0.1, wAge) * (1.0 - smoothstep(gone - 0.45, gone, wAge)) * (0.25 + 0.75 * tongue);
        diffuseColor.rgb = mix(diffuseColor.rgb, uSand * (0.8 + wNoise(wp * 150.0) * 0.4), sand * 0.8);
      }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor = mix(roughnessFactor, 0.8, floorGroove);
      roughnessFactor = mix(roughnessFactor, 0.55, floorInlay);`)
      .replace('#include <tonemapping_fragment>', `
      // der Ring selbst nur als warmer Hauch: die Form trägt der Sand
      if (uShock.y > 0.0) {
        float ring = exp(-pow((wd - uShock.x) / uShock.z, 2.0));
        gl_FragColor.rgb += (uShockColor * 0.5 + vec3(0.4, 0.26, 0.12)) * ring * 0.5 * min(1.0, uShock.y * 3.0);
      }
      // Fahne an der Front: Schlieren, die etwas schneller als der Ring nach aussen treiben (~1,2 m lang), hell im Licht
      if (uWave.x < 1.5 && wAge > -0.05 && wAge < 0.4) {
        vec2 q = wp - wDir * uWave.x * 7.6;
        float st = smoothstep(0.38, 0.66, ${clayStreak('q', 6, 0.07, 14)});
        float band = smoothstep(-0.03, 0.005, wAge) * (1.0 - smoothstep(0.05, 0.22, wAge));
        vec3 lit = gl_FragColor.rgb * vec3(1.32, 1.42, 1.25) + vec3(0.07, 0.045, 0.01);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.82, band * (1.0 - st) * 0.5);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, lit, band * st * 0.9);
      }
      #include <tonemapping_fragment>`);
  };
  const floorTop = new THREE.Mesh(new THREE.PlaneGeometry(PLATE, PLATE), floorMaterial);
  floorTop.rotation.x = -Math.PI / 2;
  floorTop.receiveShadow = true;
  floorTop.onBeforeRender = tick;

  // Gesims und Wand: matter Lehmputz. Im Spiel fällt kaum Licht auf senkrechte Flächen; ein Teil der Farbe leuchtet
  // selbst, sonst stünden sie schwarz im Bild
  const wallMat = new THREE.MeshStandardMaterial({ map: tex.wallMap, emissiveMap: tex.wallMap,
    emissive: new THREE.Color(0.34, 0.34, 0.34), roughness: 0.95, envMapIntensity: 1.2 });
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(PLATE, CLAY.cornice, PLATE), wallMat);
  cornice.position.y = -0.003 - CLAY.cornice / 2;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(CLAY.wall, CLAY.wallH, CLAY.wall), wallMat);
  wall.position.y = -0.003 - CLAY.cornice - CLAY.wallH / 2;
  cornice.receiveShadow = wall.receiveShadow = true;

  // Torons: Balken aus Palmholz in zwei versetzten Reihen, 22 cm aus der Wand
  const rnd = mulberry32(81), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0), out = CLAY.wall / 2 + 0.07, spots = [];
  for (const y of [-0.2, -0.34]) {
    for (let t = -4.4; t <= 4.41; t += 0.55) {
      const tt = t + (y < -0.3 ? 0.27 : 0);
      if (Math.abs(tt) > 4.45) continue;
      spots.push([out, y, tt, 0], [-out, y, tt, Math.PI], [tt, y, out, -Math.PI / 2], [tt, y, -out, Math.PI / 2]);
    }
  }
  const woodMat = new THREE.MeshStandardMaterial({ color: srgb(v.wood), roughness: 0.9, emissive: srgb(v.wood, 0.33) });
  const torons = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.028, 0.032, 0.3, 6).rotateZ(Math.PI / 2), woodMat,
    spots.length);
  spots.forEach(([x, y, z, a], i) => torons.setMatrixAt(i, m4.compose(p.set(x, y, z),
    q.setFromAxisAngle(up, a + (rnd() - 0.5) * 0.1), one)));
  torons.frustumCulled = false; // three 0.147 prüft bei Instanzen nur die Kugel um die Form am Ursprung

  // Körner der Fahne: hüpfen mit der Front nach aussen, bleiben zurück und legen sich; helle und dunkle, einige blitzen
  const r2 = mulberry32(601), edge = PLATE / 2, rows = [];
  for (let i = 0; i < CLAY.grains; i++) {
    let x, z, bx;
    do {
      x = (r2() * 2 - 1) * (edge - 0.05);
      z = (r2() * 2 - 1) * (edge - 0.05);
      bx = Math.max(Math.abs(x), Math.abs(z));
    } while (bx < 0.3);
    rows.push([x, z, r2() * 0.05, 0.25 + r2() * 0.35, 6.5 * (0.6 + r2() * 0.5), 0.02 + r2() * 0.1, 18 + r2() * 20, r2()]);
  }
  const uniforms = { uWave, uK };
  // a0: x, z, Verzug, Lebenszeit (s); a1: Tempo (m/s), Sprunghöhe (m), Sprungtakt, Zufall
  const grains = clayGrains(rows, `
        float age = uWave.x - (length(a0.xy) * uWave.z + a0.z);
        if (age > 0.0 && age < a0.w) {
          float u = age / a0.w;
          vec2 dir = normalize(a0.xy + 1e-4), side = vec2(-dir.y, dir.x);
          vec2 xz = a0.xy + dir * a1.x * age * (1.0 - 0.5 * u) + side * (a1.w - 0.5) * 0.3 * age;
          float hop = abs(sin(age * a1.z + a1.w * 6.28)) * a1.y * (1.0 - u);
          pos = vec3(xz.x, 0.015 + hop, xz.y);
          float bx = max(abs(xz.x), abs(xz.y));
          alpha = smoothstep(0.0, 0.04, age) * (1.0 - smoothstep(0.55, 1.0, u))
            * (1.0 - smoothstep(${(edge - 0.05).toFixed(2)}, ${(edge + 0.05).toFixed(2)}, bx));
          size = 0.014 + 0.012 * fract(a1.w * 7.0);
          float tw = pow(wHash(vec2(a1.w * 97.0, floor(uWave.y * 20.0))), 24.0);
          col = fract(a1.w * 13.0) < 0.5 ? vec3(0.42, 0.21, 0.08) : vec3(1.15, 0.78, 0.42);
          col += vec3(2.6, 2.1, 1.4) * tw;
        }`, uniforms);
  // Rieseln über das Gesims: an der Kante, sobald die Fahne ankommt, in dünnen Strähnen
  const fallRows = [], [strands, per] = CLAY.falls;
  for (let s = 0; s < 4; s++) {
    const nx = [1, -1, 0, 0][s], nz = [0, 0, 1, -1][s];
    for (let k = 0; k < strands; k++) {
      const t = (r2() * 2 - 1) * (edge - 0.1), x = nx ? nx * (edge - 0.03) : t, z = nz ? nz * (edge - 0.03) : t;
      for (let j = 0; j < per; j++) {
        fallRows.push([x + (nz ? (r2() - 0.5) * 0.05 : 0), z + (nx ? (r2() - 0.5) * 0.05 : 0), r2(), 0.7 + r2() * 0.3,
          nx, nz, 0.12 + r2() * 0.3, r2()]);
      }
    }
  }
  // a0: x, z, Verzug, Lebenszeit (s); a1: Richtung nach aussen (x, z), Tempo nach aussen (m/s), Zufall
  const falls = clayGrains(fallRows, `
        float age = uWave.x - (length(a0.xy) * uWave.z + 0.05 + a0.z);
        if (age > 0.0 && age < a0.w) {
          vec2 xz = a0.xy + a1.xy * (0.03 + a1.z * age);
          pos = vec3(xz.x, 0.005 - 4.905 * age * age, xz.y);
          alpha = smoothstep(0.0, 0.05, age) * (1.0 - smoothstep(0.4, 0.9, -pos.y));
          size = 0.016 + 0.01 * a1.w;
          col = a1.w < 0.5 ? vec3(0.5, 0.26, 0.1) : vec3(1.1, 0.74, 0.4);
        }`, uniforms);

  const group = new THREE.Group();
  group.add(floorTop, cornice, wall, torons, grains, falls);

  // Überblenden: boardBlend (für alle Arten gleich); die Körner blenden mit dem Anteil (uK)
  const all = [floorMaterial, wallMat, woodMat];
  const textures = [tex.map, tex.normalMap, tex.wallMap];
  return {
    group,
    mirror: null,
    textures,
    computed: tex.computed,
    setFade(k) {
      group.visible = k > 0;
      uK.value = k;
    },
    dispose() {
      group.traverse((o) => { o.geometry?.dispose(); if (o.isInstancedMesh) o.dispose(); });
      for (const m of [...all, grains.material, falls.material]) m.dispose();
      for (const t of textures) t.dispose();
    },
  };
}

/* ---------- Mondlicht auf dem Brett: für Moospolster und Hochbeet gleich, an einer Stelle ---------- */

/**
 * Mondlicht auf einem Brett (Moospolster im Wald, Hochbeet im Dorf; Wünsche vom 09. und 10.11.2026): ein kühles Licht aus
 * der Richtung des Hauptlichts im Panorama (v.lightDir: light.dir des Himmels, SKY_ENTRIES gibt es der Brett-Angabe
 * mit), nur auf dem Brett, zur Lampe des Spiels dazu. Es hellt auf, was zum Mond zeigt (v.moon), und zeichnet dort helle
 * Kanten (v.moonRim, wie RIM der Bäume in toonInstances), auf der Fläche (floor) nur mit dem Anteil floorRim. Für
 * MeshStandardMaterial und MeshLambertMaterial (nach lights_fragment_end).
 */
function boardMoonlight(materials, v, floor, floorRim) {
  if (!v.lightDir) throw new Error('Mondlicht: Richtung des Monds fehlt (light.dir im Register)');
  const lin = (c) => new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);
  const uniforms = { uMoon: { value: lin(v.moon) }, uMoonRim: { value: lin(v.moonRim) },
    uMoonDir: { value: new THREE.Vector3(...v.lightDir).normalize() } };
  for (const m of materials) {
    // three unterscheidet Programme nach onBeforeCompile.toString(): Die Hülle ist für alle Materialien dieselbe, also
    // den Schlüssel des eigenen Codes behalten, dazu «mond» und die Stärke der Kante
    const prev = m.onBeforeCompile, key = m.customProgramCacheKey(), rimK = m === floor ? floorRim : 1;
    m.customProgramCacheKey = () => `${key}|mond${rimK}`;
    m.onBeforeCompile = (shader, renderer) => {
      prev.call(m, shader, renderer);
      if (!shader.fragmentShader.includes('#include <lights_fragment_end>')) throw new Error('Mondlicht: Stelle fehlt');
      Object.assign(shader.uniforms, uniforms);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uMoon, uMoonRim, uMoonDir;')
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          {
            vec3 toMoon = normalize((viewMatrix * vec4(uMoonDir, 0.0)).xyz);
            float ml = dot(normal, toMoon);
            // saturate statt max: Das Skalarprodukt liegt durch Rundung auch knapp über 1, pow(negativ) ist undefiniert
            float mrim = pow(1.0 - saturate(dot(normal, geometry.viewDir)), 3.0) * smoothstep(-0.1, 0.4, ml);
            reflectedLight.directDiffuse += uMoon * diffuseColor.rgb * max(ml, 0.0) + uMoonRim * (mrim * ${rimK.toFixed(2)});
          }`);
    };
  }
}

/* ---------- Hochbeet (Art raisedBed): das Brett des Dorfs (Ticket 08) ---------- */

// Masse des Hochbeets (m, als Kastenabstand von der Mitte). Das Brett ist das Hochbeet aus Noas Garten: Im Feld wächst
// eine Blumenwiese (Wunsch vom 10.11.2026, vorher frisch gerechte Erde), das Raster sind Pflanzschnüre zwischen
// Holzpflöcken, statt der Einlegelinie liegt eine Reihe Kiesel, dahinter wachsen Kräuter im Rand. Der Kasten ist aus
// Lärchenbohlen, oben liegt ein Abdeckbrett. Wiese und Erde sind matt: keine Spiegelung
const BED = {
  peg: BOARD / 2 + 0.07,      // Pflöcke an den Enden der Schnüre
  pebbles: BOARD / 2 + 0.16,  // Mitte der Kieselreihe
  herbs: [BOARD / 2 + 0.2, PLATE / 2 - 0.13], // Streifen der Kräuter, aussen beginnt das Abdeckbrett
  cap: 0.08,                  // Abdeckbrett: so hoch über der Fläche
  depth: 0.6,                 // Kasten unter der Erde: drei Bohlen zu 20 cm
  sideTex: [1024, 128],       // Bohlen der Seiten (u über PLATE, v über depth)
  capTex: [1024, 32],         // Abdeckbrett (u über die Länge, v über die Breite)
  flies: [260, 160],          // Glühwürmchen über den Kräutern und über dem Feld (Lichtwelle)
  sproutsEnd: 1.9,            // so lange (s nach dem Start des Rings) keimen Sämlinge, danach nicht gezeichnet
  fliesEnd: 4.4,              // ebenso Glühwürmchen
  moonRimFloor: 0.1,          // Mondkante auf der Fläche: kaum (bei flachem Blick wirkte die Erde sonst wie grauer Beton)
};
// Werte der Brett-Angabe (tools/sky-schema.mjs, BOARD_PARAMS), alle Farben sRGB 0 … 1
const BED_VALUES = ['soil', 'mulch', 'grass', 'grassTip', 'daisy', 'daisyHeart', 'clover', 'cord', 'pebble', 'larch', 'peg',
  'chive', 'thyme', 'lettuce', 'marigold', 'blossom', 'sprout', 'firefly', 'moon', 'moonRim'];

/**
 * Farbe und Normalen des Hochbeets (raisedBedBoard), ohne Bezug auf das übrige Spiel (Worker). Formeln aus dem Katalog
 * (katalog-dorf, 4-hochbeet.js), die Wiese aus der Vorschau vom 10.11.2026 (PLAN). Feld size² über das ganze Brett
 * (Zeile j bei uv.y = (j + ½) / size, also z von +plate/2 nach −plate/2): im Feld eine Wiese aus Grasbüscheln (grass
 * [dunkel, hell], Spitzen grassTip) mit dunklen Lücken, Gänseblümchen und Klee in Grüppchen; im Rand dunkle Erde in
 * zwei Tönen (soil) mit Krumen und Mulch (mulch), da und dort ein Steinchen. Seiten sideW × sideH: Lärchenbohlen
 * (larch, zwei Töne) mit Fugen und Schrauben, das Abdeckbrett capW × capH ebenso. Farben sRGB 0 … 1 (v: Werte der
 * Brett-Angabe).
 */
function raisedBedData({ size, plate, half, rim, sideW, sideH, capW, capH, depth, v }) {
  const hash = (x, y, s) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  const fbm = (x, y, oct, s) => {
    let sum = 0, amp = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { sum += amp * noise(x * f, y * f, s + i * 17); n += amp; amp *= 0.5; f *= 2.03; }
    return sum / n;
  };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const put = (out, k, c) => { out[k] = c[0] * 255; out[k + 1] = c[1] * 255; out[k + 2] = c[2] * 255; out[k + 3] = 255; };

  const n = size * size, texel = plate / size, grit = mix(v.soil[0], v.pebble, 0.25), field = half + 0.02;
  const ground = [v.grass[0].map((x) => x * 0.35), v.grass[0].map((x) => x * 0.7)]; // Grund der Wiese
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n);
  for (let j = 0; j < size; j++) {
    const z = plate / 2 - (j + 0.5) * texel;
    for (let i = 0; i < size; i++) {
      const x = -plate / 2 + (i + 0.5) * texel, k = j * size + i, box = Math.max(Math.abs(x), Math.abs(z));
      const clod = fbm(x * 9, z * 9, 3, 413);
      if (box < field) { // Wiese: Grund zwischen den Grasbüscheln (dunkles Gras), die Büschel folgen unten
        put(color, k * 4, mix(ground[0], ground[1], clod));
        height[k] = (clod - 0.5) * 0.002;
        continue;
      }
      const crumb = noise(x * 70, z * 70, 412);
      let c = mix(v.soil[1], v.soil[0], clod * 0.7 + crumb * 0.5);
      let h = (crumb - 0.5) * 0.002 + (clod - 0.5) * 0.004;
      if (box < rim) { // Mulch, Stroh zwischen den Kräutern
        c = mix(c, v.mulch, smooth(0.55, 0.8, noise(x * 30, z * 30, 415)) * 0.6);
      }
      if (crumb > 0.93) c = grit; // Steinchen
      put(color, k * 4, c);
      height[k] = h;
    }
  }
  // Grasbüschel etwa alle 4,5 cm: Halme strahlen von einer Mitte aus und werden zur Spitze heller (grassTip); grosse
  // Flecken heller und dunkler, jedes Büschel etwas anders. Die Mitten liegen im Feld, an seinem Rand reichen Halme bis
  // 6 cm auf die Erde
  let seed = 977;
  const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const at = (x, z) => [Math.round((x + plate / 2) / texel - 0.5), Math.round((plate / 2 - z) / texel - 0.5)];
  const gap = 0.045;
  for (let gz = -field; gz < field; gz += gap) {
    for (let gx = -field; gx < field; gx += gap) {
      const x0 = gx + r() * gap, z0 = gz + r() * gap;
      if (Math.max(Math.abs(x0), Math.abs(z0)) > field) continue;
      const patch = fbm(x0 * 0.9, z0 * 0.9, 3, 416), q = (0.7 + patch * 0.6) * (0.85 + r() * 0.3) * 255;
      const base = mix(v.grass[0], v.grass[1], smooth(0.3, 0.75, patch) * 0.8 + r() * 0.2);
      const blades = 9 + Math.floor(r() * 8), reach = 0.02 + r() * 0.035, [i0, j0] = at(x0, z0);
      for (let b = 0; b < blades; b++) {
        const lay = r() * 6.283, len = (reach * (0.5 + r() * 0.7)) / texel, dx = Math.cos(lay), dz = Math.sin(lay);
        for (let t = 0; t <= len; t++) { // ohne Arrays je Pixel (mit ihnen dauerte es doppelt so lange)
          const i = Math.round(i0 + dx * t), j = Math.round(j0 - dz * t);
          if (i < 0 || j < 0 || i >= size || j >= size) break;
          const f = t / len, k = j * size + i, dark = 0.75 + f * 0.25, w = f * f * 0.7;
          for (let ch = 0; ch < 3; ch++) color[k * 4 + ch] = (base[ch] * dark * (1 - w) + v.grassTip[ch] * w) * q;
          height[k] = Math.max(height[k], 0.004 * (1 - f * 0.5));
        }
      }
    }
  }
  // Blumen, 14 je m²: Gänseblümchen (daisy, Mitte daisyHeart) und Klee (clover), je ein kleiner Tupfer, in Grüppchen um
  // wenige Mitten verstreut, dazwischen einzelne
  const flowers = Math.round((2 * field) ** 2 * 14);
  const groups = Array.from({ length: Math.round(flowers / 25) }, () => [(r() * 2 - 1) * field, (r() * 2 - 1) * field]);
  for (let b = 0; b < flowers; b++) {
    const g = groups[Math.floor(r() * groups.length)], lone = r() < 0.2, sp = 0.05 + r() * 0.2, a = r() * 6.283;
    const x0 = lone ? (r() * 2 - 1) * field : g[0] + Math.cos(a) * sp, z0 = lone ? (r() * 2 - 1) * field : g[1] + Math.sin(a) * sp;
    if (Math.max(Math.abs(x0), Math.abs(z0)) > field) continue;
    const [i0, j0] = at(x0, z0), clover = r() < 0.35, rad = (clover ? 0.006 : 0.008) / texel + 0.5;
    for (let dj = -Math.ceil(rad); dj <= Math.ceil(rad); dj++) {
      for (let di = -Math.ceil(rad); di <= Math.ceil(rad); di++) {
        const d = Math.hypot(di, dj), i = i0 + di, j = j0 + dj;
        if (d > rad || i < 0 || j < 0 || i >= size || j >= size) continue;
        put(color, (j * size + i) * 4, clover ? v.clover : d < rad * 0.4 ? v.daisyHeart : v.daisy);
        height[j * size + i] = 0.002;
      }
    }
  }
  // Normalen im Raum der Textur (+u = +x, +v = −z): (−∂h/∂u, −∂h/∂v, 1)
  const normal = new Uint8ClampedArray(n * 4);
  const H = (i, j) => height[Math.min(size - 1, Math.max(0, j)) * size + Math.min(size - 1, Math.max(0, i))];
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const nx = -(H(i + 1, j) - H(i - 1, j)) / (2 * texel), ny = -(H(i, j + 1) - H(i, j - 1)) / (2 * texel);
      const l = Math.hypot(nx, ny, 1);
      put(normal, (j * size + i) * 4, [(nx / l) * 0.5 + 0.5, (ny / l) * 0.5 + 0.5, (1 / l) * 0.5 + 0.5]);
    }
  }
  // Lärchenbohlen: Maserung längs, jede Bohle (id) etwas anders
  const plank = (u, w, id) => mix(v.larch[1], v.larch[0], fbm(u * 0.7 + id * 3.3, w * 30, 3, 416) * 0.8
    + noise(id, 0.5, 417) * 0.3);
  const side = new Uint8ClampedArray(sideW * sideH * 4);
  for (let j = 0; j < sideH; j++) {
    const y = (1 - (j + 0.5) / sideH) * depth / 0.2, b = Math.floor(y), fb = y - b; // Zeile 0 liegt unten
    for (let i = 0; i < sideW; i++) {
      const u = ((i + 0.5) / sideW) * plate, sx = (u % 1.4) / 1.4;
      let c = plank(u, fb, b + Math.floor(u / 3.3) * 7);
      if (fb < 0.03 || fb > 0.97) c = c.map((x) => x * 0.35); // Fugen
      if (Math.abs(sx - 0.5) < 0.004 && Math.abs(fb - 0.5) < 0.05) c = [0.1, 0.1, 0.1]; // Schrauben
      put(side, (j * sideW + i) * 4, c);
    }
  }
  const cap = new Uint8ClampedArray(capW * capH * 4);
  for (let j = 0; j < capH; j++) {
    const w = (j + 0.5) / capH, edge = w < 0.08 || w > 0.92 ? 0.7 : 1;
    for (let i = 0; i < capW; i++) {
      put(cap, (j * capW + i) * 4, plank(((i + 0.5) / capW) * plate, w, 31).map((x) => x * edge));
    }
  }
  return { map: color, normalMap: normal, side, cap };
}

// Pflanzschnüre (GLSL, nach der Farbe; wp: Ort aus vUv, x und −z in m): helle Schnüre über dem Feld von Pflock zu Pflock,
// je mit einem schmalen Schatten daneben, kantengeglättet über fwidth wie die Rasterlinien des Steinbretts. Sie bleiben
// auch aus der Ferne sichtbar (das Raster muss gut lesbar bleiben). cord: Anteil der Schnur, cordShade: ihr Schatten
const BED_CORD_GLSL = `
      float cord = 0.0, cordShade = 0.0;
      {
        vec2 pz = vec2(wp.x, -wp.y);
        float hb = ${(BOARD / 2).toFixed(4)}, ends = ${BED.peg.toFixed(4)};
        vec2 q = (pz + hb) / ${CELL.toFixed(4)};
        vec2 fw = max(fwidth(q), vec2(1e-5));
        float lw = ${(0.0055 / CELL).toFixed(5)}, sw = ${(0.007 / CELL).toFixed(5)};
        vec2 gq = abs(fract(q + 0.5) - 0.5), gs = abs(fract(q - ${(0.012 / CELL).toFixed(5)} + 0.5) - 0.5);
        vec2 line = (1.0 - smoothstep(vec2(lw) - fw * 0.5, vec2(lw) + fw * 0.5, gq)) * clamp(lw * 2.0 / fw, 0.4, 1.0);
        vec2 sh = (1.0 - smoothstep(vec2(sw) - fw * 0.5, vec2(sw) + fw * 0.5, gs)) * clamp(sw * 2.0 / fw, 0.3, 1.0);
        vec2 ap = max(fwidth(pz), vec2(1e-5));
        vec2 span = 1.0 - smoothstep(vec2(ends), vec2(ends) + ap.yx, abs(pz.yx)); // x: Schnur längs z bis |z| = Pflock
        vec2 inner = 1.0 - smoothstep(vec2(hb + 0.02), vec2(hb + 0.03), abs(pz)); // nur die acht Schnüre je Richtung
        cord = max(line.x * span.x * inner.x, line.y * span.y * inner.y);
        cordShade = max(sh.x * span.x * inner.x, sh.y * span.y * inner.y) * (1.0 - cord);
      }`;

/**
 * Instanzen aus [[x, y, z, { s (Zahl oder [x, y, z]), rx, ry, rz, c (THREE.Color) }], …], c sonst color; nie
 * aussortiert (three 0.147)
 */
function bedInstances(geo, material, list, color) {
  const mesh = new THREE.InstancedMesh(geo, material, list.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const e = new THREE.Euler();
  list.forEach(([x, y, z, o = {}], i) => {
    const sc = o.s ?? 1;
    if (Array.isArray(sc)) s.fromArray(sc); else s.setScalar(sc);
    mesh.setMatrixAt(i, m4.compose(p.set(x, y, z), q.setFromEuler(e.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0, 'YXZ')), s));
    if (o.c ?? color) mesh.setColorAt(i, o.c ?? color);
  });
  mesh.frustumCulled = false;
  return mesh;
}

/**
 * Hochbeet (Art raisedBed, Dorf; Ticket 08, aus dem Katalog gewählt: Karte 4): Im Feld eine Blumenwiese mit
 * Gänseblümchen und Klee (Wunsch vom 10.11.2026, vorher frisch gerechte Erde; Texturen aus dem Hintergrund-Thread,
 * raisedBedData), das Raster sind helle Pflanzschnüre zwischen Holzpflöcken (BED_CORD_GLSL, Pflöcke als Instanzen),
 * statt der Einlegelinie eine Reihe heller Kiesel. Im Rand wachsen Kräuter in Erde mit Mulch: Schnittlauch mit lila
 * Blüten, Thymian, Ringelblumen und Salat (je als Instanzen). Die Seiten sind Lärchenbohlen, oben liegt ein Abdeckbrett
 * 8 cm über dem Feld. Wiese und Erde sind matt: keine Spiegelung (mirror null).
 * Lichtwelle (Katalog Version 2): Wo der Ring ankommt, leuchtet die Wiese auf und die Schnüre mit, neben den Schnüren
 * keimen Reihen von Sämlingen auf (rund 1100), und Glühwürmchen steigen aus Wiese und Kräutern (420). Hinter dem Ring ziehen
 * sich die Keimlinge in die Erde zurück, die Glühwürmchen schweben noch kurz und verlöschen. Alles folgt der Ankunft des
 * Rings (shockClock, uShockT − Abstand / SHOCK_SPEED), nicht seiner Stärke. Das Hochbeet liegt im Mondlicht des Dorfs
 * (Wunsch vom 10.11.2026, es wirkte zu grell für die Nacht): kühle Farben aus der Brett-Angabe und ein Licht aus der
 * Richtung des Monds mit hellen Kanten (boardMoonlight). v: Werte der Brett-Angabe (BED_VALUES, sRGB; dazu lightDir).
 */
function raisedBedBoard(v) {
  for (const k of BED_VALUES) if (!v[k]) throw new Error(`Wert ${k} fehlt`);
  const srgb = (c, f = 1) => new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace).multiplyScalar(f);
  const N = QUALITY.textureSize, [sideW, sideH] = BED.sideTex, [capW, capH] = BED.capTex, [hIn, rim] = BED.herbs;
  const tex = boardTextures(
    { map: [N, N, true], normalMap: [N, N, false], side: [sideW, sideH, true], cap: [capW, capH, true] },
    raisedBedData, { size: N, plate: PLATE, half: BOARD / 2, rim, sideW, sideH, capW, capH, depth: BED.depth, v });

  // x: Anteil beim Überblenden, y: Anfang der Lichtwelle (beim Fall des Polarsterns glüht das Brett erst auf, bevor
  // der Ring läuft: dann so stark wie er), z: Pixeldichte (Glühwürmchen); je Bild in setFade gestellt
  const uBed = { value: new THREE.Vector4(1, 1, 1, 0) }, uCord = { value: srgb(v.cord) };
  const WAVE_GLSL = `
      vec2 wp = (vUv - 0.5) * ${PLATE.toFixed(4)};
      float wAge = uShockT - length(wp) / ${SHOCK_SPEED.toFixed(2)}, wFront = 0.0, wAfter = 0.0;
      if (uShockT < ${SHOCK_REST_S.toFixed(1)} && wAge > -0.3) {
        wFront = exp(-pow(wAge / 0.07, 2.0)) * uBed.y; // ± 45 cm um die Ankunft des Rings
        wAfter = wAge > 0.0 ? exp(-wAge * 3.0) * uBed.y : 0.0;
      }`;

  // Oberfläche: Wiese, im Rand Erde und Mulch, Schnüre und ihr Schatten; mit der Lichtwelle leuchten Fläche und Schnüre auf
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, map: tex.map, normalMap: tex.normalMap, normalScale: new THREE.Vector2(1, 1), roughness: 0.97,
    metalness: 0, envMapIntensity: 0.3,
  });
  floorMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shockUniforms, { uBed, uCord });
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
      uniform vec3 uShockColor, uCord;
      uniform float uShockT;
      uniform vec4 uBed;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
      ${WAVE_GLSL}
      ${BED_CORD_GLSL}
      diffuseColor.rgb = mix(diffuseColor.rgb * (1.0 - cordShade * 0.55), uCord, cord);`)
      .replace('#include <tonemapping_fragment>', `
      gl_FragColor.rgb += (uShockColor * 0.35 + vec3(0.25, 0.32, 0.08)) * (wFront * 0.8 + wAfter * 0.07);
      gl_FragColor.rgb += uCord * cord * wFront * 1.2;
      #include <tonemapping_fragment>`);
  };
  const floorTop = new THREE.Mesh(new THREE.PlaneGeometry(PLATE, PLATE), floorMaterial);
  floorTop.rotation.x = -Math.PI / 2;
  floorTop.receiveShadow = true;

  // Kasten aus Lärchenbohlen ohne Deckfläche (die Fläche liegt bündig darauf), Oberkante in y = 0. Im Spiel fällt kaum Licht
  // auf senkrechte Flächen; ein Teil der Farbe leuchtet selbst, sonst stünden sie schwarz im Bild
  const wood = (map, glow) => new THREE.MeshStandardMaterial({ map, emissiveMap: map,
    emissive: new THREE.Color().setScalar(glow), roughness: 0.9, envMapIntensity: 1.2 });
  const sideMat = wood(tex.side, 0.15), capMat = wood(tex.cap, 0.12);
  const boxGeo = new THREE.BoxGeometry(PLATE, BED.depth, PLATE);
  const top = boxGeo.groups[2], idx = Array.from(boxGeo.index.array); // Gruppen +x, −x, +y, −y, +z, −z
  idx.splice(top.start, top.count);
  boxGeo.setIndex(idx);
  boxGeo.clearGroups();
  const box = new THREE.Mesh(boxGeo, sideMat);
  box.position.y = -BED.depth / 2;
  box.receiveShadow = true;

  // Abdeckbrett: vier Bretter, die vorn und hinten über die ganze Breite, die seitlichen dazwischen (gedreht)
  const capW2 = PLATE / 2 - rim, capMid = (PLATE / 2 + rim) / 2;
  // in einer Form, damit sie dasselbe Programm nutzen wie die Seiten (jedes Programm mehr kostet beim Übersetzen)
  const capGeo = (() => {
    const parts = [[0, capMid, 0, 1], [0, -capMid, 0, 1], [capMid, 0, Math.PI / 2, 2 * rim / PLATE],
      [-capMid, 0, Math.PI / 2, 2 * rim / PLATE]].map(([x, z, ry, sx]) => new THREE.BoxGeometry(PLATE, BED.cap, capW2)
      .scale(sx, 1, 1).rotateY(ry).translate(x, BED.cap / 2, z));
    const g = new THREE.BufferGeometry(), idx = [];
    let n = 0;
    for (const name of ['position', 'normal', 'uv']) {
      g.setAttribute(name, new THREE.Float32BufferAttribute(parts.flatMap((p) => Array.from(p.attributes[name].array)),
        parts[0].attributes[name].itemSize));
    }
    for (const p of parts) { for (const i of p.index.array) idx.push(i + n); n += p.attributes.position.count; p.dispose(); }
    g.setIndex(idx);
    return g;
  })();
  const caps = new THREE.Mesh(capGeo, capMat);
  caps.receiveShadow = true;

  // Pflöcke an den Enden der Schnüre, Kiesel, Kräuter: Instanzen mit Farbe je Instanz, alle mit einem Material (ein
  // Programm). Eigenlicht wie im Katalog: Ein Hauch der eigenen Farbe leuchtet, sonst versänken sie in der Nacht des Dorfs
  const plantMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, emissive: 0xffffff });
  plantMat.emissive.setScalar(0.06);
  plantMat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vColor;');
  };
  const r = mulberry32(411), pegs = [];
  for (let k = 0; k <= GRID; k++) {
    const p = -BOARD / 2 + k * CELL;
    pegs.push([p, 0.06, BED.peg], [p, 0.06, -BED.peg], [BED.peg, 0.06, p], [-BED.peg, 0.06, p]);
  }
  const pegMesh = bedInstances(new THREE.BoxGeometry(0.03, 0.12, 0.03), plantMat, pegs, srgb(v.peg));

  // Kugeln: Kiesel, Thymian-Polster, Salat und Blüten
  const blobs = [], stalks = [], flowers = [];
  const pebble = srgb(v.pebble), thyme = srgb(v.thyme), lettuce = srgb(v.lettuce), blossom = srgb(v.blossom);
  for (let side = 0; side < 4; side++) {
    for (let t = -hIn; t < hIn; t += 0.05 + r() * 0.03) { // Kieselreihe
      const w = BED.pebbles + (r() - 0.5) * 0.02, rx = 0.022 + r() * 0.014, rz = 0.016 + r() * 0.01;
      const [x, z] = side === 0 ? [t, w] : side === 1 ? [t, -w] : side === 2 ? [w, t] : [-w, t];
      blobs.push([x, 0.004, z, { s: [rx, 0.012, rz], ry: r() * 3, c: pebble.clone().multiplyScalar(0.75 + r() * 0.45) }]);
    }
  }
  // Kräuter in Abschnitten entlang jeder Seite, reihum Schnittlauch, Thymian, Ringelblumen und Salat
  const MID = (hIn + rim) / 2, WIDE = rim - hIn - 0.04;
  for (let side = 0; side < 4; side++) {
    const at = (t, o) => side === 0 ? [t, MID + o] : side === 1 ? [t, -MID - o] : side === 2 ? [MID + o, t] : [-MID - o, t];
    for (let t = -4.6, n = 0; t < 4.6; t += 0.24 + r() * 0.12, n++) {
      const kind = (n + side * 3 + (r() < 0.25 ? 1 : 0)) % 4, o = (r() - 0.5) * WIDE * 0.5, [cx, cz] = at(t, o);
      if (kind === 0) { // Schnittlauch mit lila Blütenköpfen
        for (let i = 0; i < 28; i++) {
          const a = r() * 6.28, rr = r() * 0.07, hgt = 0.18 + r() * 0.14;
          stalks.push([cx + Math.cos(a) * rr, 0, cz + Math.sin(a) * rr,
            { s: [1.3, hgt, 1.3], rx: Math.sin(a) * 0.3, rz: -Math.cos(a) * 0.3 }]);
          if (i < 5) blobs.push([cx + Math.cos(a) * (rr + 0.06), hgt * 0.95, cz + Math.sin(a) * (rr + 0.06), { s: 0.026, c: blossom }]);
        }
      } else if (kind === 1) { // Thymian-Polster mit Blütchen
        const w = 0.15 + r() * 0.06;
        blobs.push([cx, 0.02, cz, { s: [w, 0.1, w * (0.8 + r() * 0.3)], c: thyme }]);
        for (let i = 0; i < 6; i++) blobs.push([cx + (r() - 0.5) * w * 1.4, 0.08 + r() * 0.03, cz + (r() - 0.5) * w * 1.4, { s: 0.012, c: blossom }]);
      } else if (kind === 2) { // Ringelblumen
        for (let i = 0; i < 6; i++) {
          const x = cx + (r() - 0.5) * 0.24, z = cz + (r() - 0.5) * 0.24, hgt = 0.16 + r() * 0.1;
          stalks.push([x, 0, z, { s: [1.4, hgt, 1.4] }]);
          flowers.push([x, hgt, z, { rx: (r() - 0.5) * 0.7, rz: (r() - 0.5) * 0.7, s: 1.3 }]);
          blobs.push([x, 0.03, z, { s: [0.09, 0.07, 0.09], c: thyme }]);
        }
      } else { // Salat
        blobs.push([cx, 0.04, cz, { s: [0.15, 0.09, 0.15], ry: r() * 6, c: lettuce }]);
        blobs.push([cx, 0.07, cz, { s: [0.09, 0.07, 0.09], ry: r() * 6, c: lettuce }]);
      }
    }
  }
  const stalkGeo = new THREE.CylinderGeometry(0.004, 0.006, 1, 4, 1, true).translate(0, 0.5, 0);
  const stalkMesh = bedInstances(stalkGeo, plantMat, stalks, srgb(v.chive));
  const blobMesh = bedInstances(new THREE.SphereGeometry(1, 8, 5), plantMat, blobs);
  const flowerMesh = bedInstances(new THREE.CylinderGeometry(0.035, 0.03, 0.012, 10), plantMat, flowers, srgb(v.marigold));

  // Lichtwelle: Sämlinge in Reihen neben den Schnüren (längs x). Ein Stiel und zwei Keimblätter in einer Form; sie
  // keimen kurz vor der Ankunft des Rings auf und ziehen sich dahinter wieder in die Erde zurück (ganz im Vertex-Shader)
  const sproutGeo = (() => {
    const pos = [];
    for (let i = 0; i < 3; i++) { // Stiel: drei Seiten, 7 cm
      const a0 = i / 3 * Math.PI * 2, a1 = (i + 1) / 3 * Math.PI * 2;
      const p = (a, y, rad) => [Math.cos(a) * rad, y, Math.sin(a) * rad];
      pos.push(...p(a0, 0, 0.005), ...p(a1, 0, 0.005), ...p(a1, 0.072, 0.004),
        ...p(a0, 0, 0.005), ...p(a1, 0.072, 0.004), ...p(a0, 0.072, 0.004));
    }
    for (const sg of [1, -1]) { // Keimblätter: flache Rauten, leicht nach oben gewölbt
      const b = [0, 0.072, 0], l = [sg * 0.026, 0.078, 0.012], rr = [sg * 0.026, 0.078, -0.012], tip = [sg * 0.056, 0.08, 0];
      pos.push(...b, ...l, ...tip, ...b, ...tip, ...rr);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  })();
  const sprouts = [];
  for (let k = 0; k <= GRID; k++) {
    for (const off of [-0.17, 0.17]) {
      const z = -BOARD / 2 + k * CELL + off;
      if (Math.abs(z) > BOARD / 2 - 0.04) continue;
      for (let x = -BOARD / 2 + 0.06; x < BOARD / 2 - 0.04; x += 0.09 + r() * 0.03) {
        sprouts.push([x, 0, z + (r() - 0.5) * 0.03, { ry: r() * 6.3, s: 1.6 + r() * 0.7 }]);
      }
    }
  }
  const sproutMat = new THREE.MeshStandardMaterial({ color: srgb(v.sprout), roughness: 0.7, emissive: srgb(v.sprout, 0.12),
    side: THREE.DoubleSide });
  sproutMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uShockT: shockUniforms.uShockT, uBed });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uShockT;\nuniform vec4 uBed;\nvarying float vGrow;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      {
        vec3 ic = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float seed = fract(sin(dot(ic.xz, vec2(12.9898, 78.233))) * 43758.5453);
        float a = uShockT - length(ic.xz) / ${SHOCK_SPEED.toFixed(2)} - seed * 0.05;
        vGrow = smoothstep(-0.14, 0.0, a) * (1.0 - smoothstep(0.06 + seed * 0.06, 0.28 + seed * 0.12, a)) * uBed.y;
        transformed.y *= smoothstep(0.0, 0.55, vGrow);   // erst der Stiel aus der Erde,
        transformed.xz *= smoothstep(0.25, 1.0, vGrow);  // dann öffnen sich die Keimblätter
      }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGrow;')
      .replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb *= 1.0 + vGrow * 0.45;\n#include <tonemapping_fragment>');
  };
  const sproutMesh = bedInstances(sproutGeo, sproutMat, sprouts);
  sproutMesh.visible = false;

  // Glühwürmchen: über den Kräutern dichter, über dem Feld locker. Wo der Ring ankommt, leuchten sie auf, steigen,
  // treiben und flackern, nach 1 bis 3 s verlöschen sie. Additiv, ohne das Alpha des Bilds zu ändern (wie glowParticles)
  const flyPos = [], flySeed = [], [overHerbs, overField] = BED.flies;
  for (let i = 0; i < overHerbs + overField; i++) {
    if (i < overHerbs) {
      const a = Math.floor(r() * 4), t = (r() - 0.5) * 9, o = MID + (r() - 0.5) * 0.5, y = 0.08 + r() * 0.3;
      flyPos.push(...(a === 0 ? [t, y, o] : a === 1 ? [t, y, -o] : a === 2 ? [o, y, t] : [-o, y, t]));
    } else flyPos.push((r() - 0.5) * BOARD, 0.03 + r() * 0.15, (r() - 0.5) * BOARD);
    flySeed.push(r());
  }
  const flyGeo = new THREE.BufferGeometry();
  flyGeo.setAttribute('position', new THREE.Float32BufferAttribute(flyPos, 3));
  flyGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(flySeed, 1));
  const flies = new THREE.Points(flyGeo, new THREE.ShaderMaterial({
    uniforms: { uShockT: shockUniforms.uShockT, uBed, uColor: { value: srgb(v.firefly) } },
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: `attribute float aSeed;
      uniform float uShockT;
      uniform vec4 uBed;
      varying float vA;
      void main() {
        vec3 p = position;
        float a = uShockT - length(p.xz) / ${SHOCK_SPEED.toFixed(2)} - aSeed * 0.1, t = max(a, 0.0);
        float on = smoothstep(-0.05, 0.05, a), off = 1.0 - smoothstep(0.8 + aSeed * 0.8, 1.5 + aSeed * 1.3, a);
        float flick = 0.7 + 0.3 * sin(uShockT * (8.0 + aSeed * 9.0) + aSeed * 40.0);
        float flash = exp(-a * a / 0.01); // hell, wo der Ring gerade ankommt
        p.y += (1.0 - exp(-t * 1.3)) * (0.3 + aSeed * 0.8);
        p.x += sin(aSeed * 40.0 + t * 2.1) * min(t, 1.0) * 0.14;
        p.z += cos(aSeed * 23.0 + t * 1.7) * min(t, 1.0) * 0.14;
        vA = (on * off * flick * 0.8 + flash * 0.8) * uBed.x * uBed.y;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = vA > 0.01 ? uBed.z * 260.0 * (0.55 + aSeed * 0.6) / -mv.z : 0.0;
      }`,
    fragmentShader: `uniform vec3 uColor;
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float halo = pow(smoothstep(0.5, 0.0, d), 2.0), core = smoothstep(0.14, 0.0, d);
        gl_FragColor = vec4(uColor * (halo * 0.9 + core * 2.4) * min(vA, 1.2), 0.0);
      }`,
  }));
  flies.frustumCulled = false;
  flies.renderOrder = 6;
  flies.visible = false;

  const group = new THREE.Group();
  group.add(floorTop, box, caps, pegMesh, stalkMesh, blobMesh, flowerMesh, sproutMesh, flies);

  // Überblenden: boardBlend (für alle Arten gleich); die Glühwürmchen blenden mit dem Anteil (uBed.x)
  const all = [floorMaterial, sideMat, capMat, plantMat, sproutMat];

  // Mondlicht aus der Richtung des Monds im Panorama, mit hellen Kanten auf der Mondseite (auf der Fläche schwächer)
  boardMoonlight(all, v, floorMaterial, BED.moonRimFloor);

  const textures = [tex.map, tex.normalMap, tex.side, tex.cap];
  return {
    group,
    mirror: null,
    textures,
    computed: tex.computed,
    setFade(k) {
      group.visible = k > 0;
      // je Bild (boardTheme.render): Anfang der Welle, Pixeldichte; Sämlinge und Glühwürmchen nur, solange die Welle läuft
      const s = shockUniforms.uShock.value, t = shockUniforms.uShockT.value;
      uBed.value.set(k, s.y > 0 && s.x < 0.5 ? Math.min(1, s.y * 3) : 1, renderer.getPixelRatio(), 0);
      sproutMesh.visible = t < BED.sproutsEnd;
      flies.visible = t < BED.fliesEnd;
    },
    dispose() {
      group.traverse((o) => { o.geometry?.dispose(); if (o.isInstancedMesh) o.dispose(); });
      for (const m of [...all, flies.material]) m.dispose();
      for (const t of textures) t.dispose();
    },
  };
}

/* ---------- Moospolster (Art moss): das Brett des Bergwalds (Ticket 07) ---------- */

// Masse und Mengen des Moospolsters. Das Brett ist ein Stück Waldboden, das sich gelöst hat: Im Rand liegen dicke
// Moospolster mit Helmlingen, an den Ecken wächst Farn, die Seiten sind eine Erdscholle, darunter hängen Wurzeln
const MOSS = {
  sideTex: [2048, 128], // Erdscholle (u über PLATE, v über die Dicke)
  cushionTex: 512,      // Moos der Polster (wiederholt)
  cushions: 420,        // Polster im Rand
  roots: 70,            // Wurzeln unter der Scholle
  flowers: 1500,        // Blumen der Lichtwelle (Waldsauerklee), unsichtbar in Ruhe
  flowerEnd: 2.2,       // so lange (s nach dem Start des Rings) blühen Blumen, danach nicht gezeichnet
  moonRimFloor: 0.3,    // Mondkante auf der Fläche: nur ein Hauch, bei flachem Blick glänzte sie sonst wie Raureif
};
// Werte der Brett-Angabe (tools/sky-schema.mjs, BOARD_PARAMS), alle Farben sRGB 0 … 1
const MOSS_VALUES = ['moss', 'tip', 'gold', 'silver', 'litter', 'soil', 'pebble', 'thread', 'root', 'fern', 'cap', 'glow',
  'flower', 'moon', 'moonRim'];

/**
 * Farbe und Normalen des Moospolsters, die Erdscholle und das Moos der Polster (mossBoard), ohne Bezug auf das übrige
 * Spiel (Worker). Formeln und Farben aus dem Katalog (katalog-wald, 2-moos.js), die Höhen ungerundet. Feld size² über das
 * ganze Brett (Zeile j bei z = plate/2 − (j + ½) · plate/size): kurzes Samtmoos in zwei Tönen (moss) mit hellen Spitzen
 * (tip) und Flecken (gold, im Katalog golden), im Feld ruhiger; im Rand unter den Polstern Nadelstreu (litter). Seiten
 * sideW × sideH: Humus (soil) mit Steinen (pebble) und Wurzelfäden (thread), oben hängt Moos über die Kante. Polster
 * cushion²: Moos, nahtlos wiederholbar. v: Werte der Brett-Angabe.
 */
function mossData({ size, plate, half, sideW, sideH, cushion, v }) {
  const hash = (x, y, s) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  // Wertrauschen; mit p periodisch (Gitter modulo p), für das wiederholte Moos der Polster
  const noise = (x, y, s, p = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    const X = (i) => (p ? ((i % p) + p) % p : i);
    const a = hash(X(xi), X(yi), s), b = hash(X(xi + 1), X(yi), s), c = hash(X(xi), X(yi + 1), s);
    const d = hash(X(xi + 1), X(yi + 1), s);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  const fbm = (x, y, oct, s) => {
    let sum = 0, amp = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { sum += amp * noise(x * f, y * f, s + i * 17); n += amp; amp *= 0.5; f *= 2.03; }
    return sum / n;
  };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const put = (out, k, c) => { out[k] = c[0] * 255; out[k + 1] = c[1] * 255; out[k + 2] = c[2] * 255; out[k + 3] = 255; };

  const n = size * size, texel = plate / size;
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n);
  for (let j = 0; j < size; j++) {
    const z = plate / 2 - (j + 0.5) * texel;
    for (let i = 0; i < size; i++) {
      const x = -plate / 2 + (i + 0.5) * texel, k = j * size + i, box = Math.max(Math.abs(x), Math.abs(z));
      const clump = fbm(x * 14, z * 14, 3, 302), tip = noise(x * 150, z * 150, 303), patch = fbm(x * 0.55, z * 0.55, 3, 304);
      const inF = 1 - smooth(half, half + 0.12, box), a = smooth(0.28, 0.72, clump);
      let c = mix(v.moss[0], v.moss[1], a + (0.55 + (clump - 0.5) * 0.5 - a) * inF); // im Feld ruhiger
      c = mix(c, v.tip, tip * 0.35 * smooth(0.3, 0.8, clump));
      c = mix(c, v.gold, smooth(0.5, 0.8, patch) * 0.3);
      if (box > half + 0.12) { // Rand: unter den Polstern Nadelstreu
        const nd = Math.abs(Math.sin(x * 60 + noise(x * 3, z * 3, 305) * 9) * Math.sin(z * 55 + noise(z * 3, x * 3, 306) * 9)) ** 8;
        c = mix(c, v.litter, smooth(half + 0.12, half + 0.3, box) * (0.4 + nd * 0.5));
      }
      put(color, k * 4, c);
      height[k] = (clump - 0.5) * 0.008 + (tip - 0.5) * 0.0015;
    }
  }
  // Normalen im Raum der Textur (+u = +x, +v = −z): (−∂h/∂u, −∂h/∂v, 1)
  const normal = new Uint8ClampedArray(n * 4);
  const H = (i, j) => height[Math.min(size - 1, Math.max(0, j)) * size + Math.min(size - 1, Math.max(0, i))];
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const nx = -(H(i + 1, j) - H(i - 1, j)) / (2 * texel), ny = -(H(i, j + 1) - H(i, j - 1)) / (2 * texel);
      const l = Math.hypot(nx, ny, 1);
      put(normal, (j * size + i) * 4, [(nx / l) * 0.5 + 0.5, (ny / l) * 0.5 + 0.5, (1 / l) * 0.5 + 0.5]);
    }
  }
  // Erdscholle: oben Moos, das über die Kante hängt, darunter Humus mit Steinen und Wurzelfäden
  const side = new Uint8ClampedArray(sideW * sideH * 4);
  for (let j = 0; j < sideH; j++) {
    const y = 1 - (j + 0.5) / sideH; // 0 oben … 1 unten (Zeile 0 liegt unten)
    for (let i = 0; i < sideW; i++) {
      const u = ((i + 0.5) / sideW) * plate;
      const drip = 0.18 + fbm(u * 3, 0.5, 3, 307) * 0.22 + noise(u * 9, 1, 308) ** 4 * 0.25;
      const stone = smooth(0.66, 0.72, fbm(u * 6, y * 2.2, 3, 309)), soil = fbm(u * 20, y * 6, 4, 310);
      let c = mix(v.soil[0], v.soil[1], soil);
      c = mix(c, v.pebble, stone * (0.7 + noise(u * 40, y * 10, 311) * 0.3));
      const thread = 1 - smooth(0, 0.04, Math.abs(Math.sin(u * 7 + y * 3 + fbm(u * 2, y, 2, 312) * 6)));
      c = mix(c, v.thread, thread * smooth(0.3, 0.5, y) * 0.5);
      put(side, (j * sideW + i) * 4, mix(c, mix(v.moss[0], v.moss[1], noise(u * 30, y * 8, 313)),
        1 - smooth(drip - 0.03, drip + 0.03, y)));
    }
  }
  // Moos der Polster: grob und fein, im Gitter periodisch (nahtlos über die Kugel wiederholt)
  const cush = new Uint8ClampedArray(cushion * cushion * 4), f1 = 180, f2 = 41; // Zellen über die Breite
  for (let j = 0; j < cushion; j++) {
    for (let i = 0; i < cushion; i++) {
      const t = noise(i * f1 / cushion, j * f1 / cushion, 314, f1) * 0.6 + noise(i * f2 / cushion, j * f2 / cushion, 315, f2) * 0.4;
      put(cush, (j * cushion + i) * 4, mix(v.moss[0], v.tip, t));
    }
  }
  return { map: color, normalMap: normal, side, cushion: cush };
}

// Wurzeln unter der Scholle: verjüngte Röhren längs einer Catmull-Rom-Kurve, alle in einem Netz (Farbe je Wurzel)
function mossRoots(r, half, y0, colors) {
  const SEG = 12, RAD = 5, pos = [], nor = [], col = [], idx = [], P = new THREE.Vector3(), T = new THREE.Vector3();
  const N = new THREE.Vector3(), B = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0);
  for (let w = 0; w < MOSS.roots; w++) {
    const edge = r() < 0.5, t = (r() * 2 - 1) * (half - 0.2), sgn = r() < 0.5 ? -1 : 1, inset = 0.1 + r() * 1.6;
    const x0 = edge ? sgn * (half - inset) : t, z0 = edge ? t : sgn * (half - inset), len = 0.25 + r() * 0.8;
    const pts = [new THREE.Vector3(x0, y0, z0)];
    for (let k = 1; k <= 4; k++) pts.push(new THREE.Vector3(x0 + (r() - 0.5) * 0.18 * k, y0 - len * k / 4, z0 + (r() - 0.5) * 0.18 * k));
    const curve = new THREE.CatmullRomCurve3(pts), r0 = 0.018 + r() * 0.015, c = colors(r()), base = pos.length / 3;
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG, rad = r0 + (0.003 - r0) * u ** 0.8;
      curve.getPoint(u, P);
      curve.getTangent(u, T);
      N.crossVectors(T, X).normalize(); // Wurzeln hängen fast senkrecht: x steht nie längs
      B.crossVectors(T, N);
      for (let j = 0; j < RAD; j++) {
        const a = (j / RAD) * Math.PI * 2, cx = Math.cos(a), sx = Math.sin(a);
        const nx = N.x * cx + B.x * sx, ny = N.y * cx + B.y * sx, nz = N.z * cx + B.z * sx;
        pos.push(P.x + nx * rad, P.y + ny * rad, P.z + nz * rad);
        nor.push(nx, ny, nz);
        col.push(c.r, c.g, c.b);
      }
    }
    for (let i = 0; i < SEG; i++) {
      for (let j = 0; j < RAD; j++) {
        const a = base + i * RAD + j, b = base + i * RAD + (j + 1) % RAD, d = a + RAD, e = b + RAD;
        idx.push(a, d, b, b, d, e);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

// Farnwedel (GLSL): Farbe und Deckung im Bild des Wedels (uv: x quer, y vom Stiel zur Spitze), Fiederblättchen in zwei
// Tönen am Stiel, wie im Katalog gezeichnet (34 Paare, zur Spitze kürzer)
const MOSS_FROND_GLSL = `
  vec4 mossFrond(vec2 uv, vec3 leaf, vec3 stem) {
    float s = abs(uv.x - 0.5);
    if (s < 0.0117 && uv.y < 0.98) return vec4(stem, 1.0);
    float k0 = floor((uv.y - 0.0586) / 0.02683);
    for (int i = -1; i <= 1; i++) {
      float k = k0 + float(i);
      if (k < 0.0 || k > 33.0) continue;
      float t = k / 34.0, L = (1.0 - 0.85 * t) * 0.46 * (t < 0.08 ? 0.6 : 1.0), q = s / L;
      if (q > 1.0) continue;
      float dy = uv.y - (0.0586 + t * 0.9121), tipY = 0.0137 + 0.0098 * t;
      float up = 2.0 * q * (1.0 - q) * 0.0254 + q * q * tipY;
      float lo = q * q * tipY - 2.0 * q * (1.0 - q) * 0.0078 - (1.0 - q) * (1.0 - q) * 0.0098;
      if (dy > lo && dy < up) return vec4(leaf * (mod(k, 2.0) < 0.5 ? 1.08 : 1.0), 1.0);
    }
    return vec4(0.0);
  }`;

/**
 * Blumen der Lichtwelle (mossBoard): Waldsauerklee, flach auf Moos und Polstern, als Instanzen eines Vierecks, Form im
 * Fragment-Shader. Ganz nach der Ankunft des Rings (uShockT − Abstand / SHOCK_SPEED): Sie öffnen sich, wenn er ankommt,
 * leuchten kurz und welken hinter ihm (schliessen sich, werden braun, verschwinden). In Ruhe nicht gezeichnet (setFade).
 * list: je Blume [x, y, z, Grösse, Drehung, Verzug, Zufall]; petal, heart: Farben (linear).
 */
function mossFlowers(list, petal, heart) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const a0 = new Float32Array(list.length * 4), a1 = new Float32Array(list.length * 3);
  list.forEach((f, i) => { a0.set(f.slice(0, 4), i * 4); a1.set(f.slice(4, 7), i * 3); });
  g.setAttribute('a0', new THREE.InstancedBufferAttribute(a0, 4));
  g.setAttribute('a1', new THREE.InstancedBufferAttribute(a1, 3));
  g.instanceCount = list.length;
  const material = new THREE.ShaderMaterial({
    uniforms: { uShockT: shockUniforms.uShockT, uPetal: { value: petal }, uHeart: { value: heart } },
    vertexShader: `
      uniform float uShockT;
      attribute vec4 a0; // x, y, z, Halbmass (m)
      attribute vec3 a1; // Drehung, Verzug (s), Zufall
      varying vec2 vC;
      varying float vWilt, vFresh, vRot;
      void main() {
        float age = uShockT - (length(a0.xz) / ${SHOCK_SPEED.toFixed(2)} + a1.y);
        float open = smoothstep(-0.08, 0.06, age);
        vWilt = smoothstep(0.14 + a1.z * 0.1, 0.45 + a1.z * 0.2, age);
        vFresh = 1.0 - smoothstep(0.0, 0.25, age);
        vRot = a1.x;
        vC = position.xy;
        float s = open * (1.0 - vWilt * 0.8);
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0); // ausserhalb des Bilds
        if (s > 0.01 && vWilt < 0.999) {
          vec2 q = position.xy * a0.w * s;
          float c = cos(a1.x), sn = sin(a1.x);
          q = vec2(c * q.x - sn * q.y, sn * q.x + c * q.y);
          // das Viereck liegt in x, −z: Es zeigt nach oben (Vorderseite)
          vec3 p = vec3(a0.x + q.x, a0.y - vWilt * 0.008 + q.y * (a1.z - 0.5) * 0.3, a0.z - q.y);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      }`,
    fragmentShader: `
      uniform vec3 uPetal, uHeart;
      varying vec2 vC;
      varying float vWilt, vFresh, vRot;
      void main() {
        float r = length(vC), th = atan(vC.y, vC.x);
        float pa = (fract(th * ${(5 / (2 * Math.PI)).toFixed(5)} + 0.5) - 0.5) * ${(2 * Math.PI / 5).toFixed(5)};
        float rho = r * cos(pa), tau = r * sin(pa);
        float len = 0.48 * (1.0 - vWilt * 0.35), wid = 0.30 * (1.0 - vWilt * 0.55); // welkend schmal und kurz
        float e = (rho - len) / len, f = tau / wid;
        bool heart = r < 0.14;
        if (!heart && e * e + f * f > 1.0) discard;
        vec3 col = heart ? uHeart : mix(uPetal, vec3(0.515, 0.187, 0.351), 0.6 * (1.0 - smoothstep(0.02, 0.04, abs(tau)))
          * step(0.16, r) * step(r, 0.76));
        col = mix(col, col * vec3(0.62, 0.48, 0.32), vWilt);
        gl_FragColor = vec4(col * (0.95 + 0.9 * vFresh), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  mesh.visible = false;
  return mesh;
}

/**
 * Moospolster (Art moss, Bergwald; Ticket 07, aus dem Katalog gewählt: Karte 2): Das Brett ist ein Stück Waldboden, das
 * sich gelöst hat. Das Feld ist kurzes, samtiges Moos wie im Moostempel, das Raster Linien aus hellem Silbermoos
 * (FLOOR_DETAIL_GLSL, breiter), ohne Einlegelinie (Texturen aus dem Hintergrund-Thread, mossData). Im Rand liegen dicke
 * Moospolster mit leuchtenden Helmlingen, an den Ecken und vereinzelt am Rand wächst Farn (je als Instanzen). Die Seiten
 * sind eine Erdscholle mit Steinen, bündig unter der Oberfläche; darunter hängen Wurzeln. Keine Spiegelung (mirror null).
 * Lichtwelle wie der Waldgott in «Prinzessin Mononoke»: Wo der Ring vorbeizieht, blühen kleine weisse Blumen auf und
 * welken hinter ihm wieder (mossFlowers), die Helmlinge leuchten auf, über das Moos läuft ein grünlich-goldener Schein.
 * Alles folgt der Ankunft des Rings (shockClock), nicht seiner Stärke. Das Brett liegt im Mondlicht des Walds (Wunsch
 * vom 09.11.2026): blaugrüne Farben aus der Brett-Angabe und ein kühles Licht aus der Richtung des Monds (moon), das auf
 * der Mondseite helle Kanten zeichnet (moonRim) wie bei den Bäumen (toonInstances; boardMoonlight). v: Werte der
 * Brett-Angabe (MOSS_VALUES, sRGB; dazu lightDir, die Richtung des Monds).
 */
function mossBoard(v) {
  for (const k of MOSS_VALUES) if (!v[k]) throw new Error(`Wert ${k} fehlt`);
  const lin = (c, f = 1) => new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace).multiplyScalar(f);
  const HP = PLATE / 2, HB = BOARD / 2, N = QUALITY.textureSize, [SW, SH] = MOSS.sideTex, CT = MOSS.cushionTex;
  const tex = boardTextures(
    { map: [N, N, true], normalMap: [N, N, false], side: [SW, SH, true], cushion: [CT, CT, true] }, mossData,
    { size: N, plate: PLATE, half: HB, sideW: SW, sideH: SH, cushion: CT, v });
  tex.cushion.wrapS = tex.cushion.wrapT = THREE.RepeatWrapping;
  tex.cushion.repeat.set(3, 2);

  // Oberfläche: Moos, Raster aus Silbermoos; Lichtwelle als grünlich-goldener Schein an der Front, der nachglimmt
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, map: tex.map, normalMap: tex.normalMap, roughness: 1, metalness: 0, envMapIntensity: 0.35,
  });
  const detail = FLOOR_DETAIL_GLSL.replace(/float lw = [\d.]+;/, 'float lw = 0.0075;');
  if (detail === FLOOR_DETAIL_GLSL) throw new Error('Rasterlinien: Breite nicht gefunden (FLOOR_DETAIL_GLSL)');
  const uSilver = { value: lin(v.silver) };
  floorMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shockUniforms, { uSilver });
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
      uniform vec3 uShockColor, uSilver;
      uniform float uShockT;
      float wBell(float x) { return exp(-x * x); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
      ${detail}
      diffuseColor.rgb = mix(diffuseColor.rgb, uSilver, floorGroove * 0.6);`)
      .replace('#include <tonemapping_fragment>', `
      if (uShockT < 3.0) {
        vec2 wp = (vUv - 0.5) * ${PLATE.toFixed(4)};
        float wAge = uShockT - length(wp) / ${SHOCK_SPEED.toFixed(2)};
        float front = wBell((wAge - 0.03) / 0.06), after = smoothstep(0.0, 0.08, wAge) * exp(-max(wAge, 0.0) * 2.2);
        gl_FragColor.rgb += (uShockColor * 0.2 + vec3(0.25, 0.5, 0.12)) * (front * 0.4 + after * 0.1);
      }
      #include <tonemapping_fragment>`);
  };
  const floorTop = new THREE.Mesh(new THREE.PlaneGeometry(PLATE, PLATE), floorMaterial);
  floorTop.rotation.x = -Math.PI / 2;
  floorTop.receiveShadow = true;

  // Erdscholle: bündig unter der Oberfläche, ohne Deckfläche (wie beim Gezeitenbecken). Im Spiel fällt kaum Licht auf
  // senkrechte Flächen; ein Teil der Farbe leuchtet selbst, sonst stünde sie bei flachem Blick schwarz im Bild
  const sideMaterial = new THREE.MeshStandardMaterial({ map: tex.side, emissiveMap: tex.side,
    emissive: new THREE.Color().setScalar(0.3), roughness: 1, envMapIntensity: 1.2 });
  const SIDE_H = PLATE_THICK + 0.03, sideGeo = new THREE.BoxGeometry(PLATE, SIDE_H, PLATE);
  const top = sideGeo.groups[2], idx = Array.from(sideGeo.index.array); // Gruppen +x, −x, +y, −y, +z, −z
  idx.splice(top.start, top.count);
  sideGeo.setIndex(idx);
  sideGeo.clearGroups();
  const sides = new THREE.Mesh(sideGeo, sideMaterial);
  sides.position.y = -SIDE_H / 2;
  sides.receiveShadow = true;

  const r = mulberry32(301), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), sc = new THREE.Vector3(), tint = new THREE.Color();
  const scatter = (geo, mat, list) => {
    const inst = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((o, i) => {
      inst.setMatrixAt(i, m4.compose(p.fromArray(o.p), q.setFromEuler(e.set(...(o.r ?? [0, 0, 0]))),
        Array.isArray(o.s) ? sc.fromArray(o.s) : sc.setScalar(o.s)));
      if (o.c) inst.setColorAt(i, tint.setRGB(o.c[0], o.c[1], o.c[2]));
    });
    inst.receiveShadow = true;
    inst.frustumCulled = false; // three 0.147 prüft bei Instanzen nur die Kugel um die Form am Ursprung
    return inst;
  };
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const inRim = (a, b) => {
    let x, z, box;
    do { x = (r() * 2 - 1) * b; z = (r() * 2 - 1) * b; box = Math.max(Math.abs(x), Math.abs(z)); } while (box < a || box > b);
    return [x, z, box];
  };

  // Polster im Rand: flache Kuppeln mit feiner Moosstruktur, höchstens 5 cm über den Umriss hinaus. Matt (Lambert) und
  // ohne Schatten: Die Polster liegen mehrfach übereinander, als MeshStandardMaterial mit Schatten kosteten sie am Desktop
  // rund 4 ms Zeichenzeit (gemessen, Ticket 07), so gut 1 ms. Tönung und Leuchten grau, so hell wie die warmen Töne
  // zuvor (ebenso bei Pilzen, Farn und Wurzeln): Die Farbe kommt allein aus der Brett-Angabe (Mondlicht im Wald)
  const cushionMat = new THREE.MeshLambertMaterial({ map: tex.cushion, emissiveMap: tex.cushion,
    emissive: new THREE.Color().setScalar(0.32) });
  const cushionList = [];
  for (let i = 0; i < MOSS.cushions; i++) {
    const [x, z, box] = inRim(HB + 0.1, HP - 0.12), stretch = 1 + r() * 0.4, out = (box - HB) / (HP - HB);
    const big = Math.min(0.14 + r() * 0.22, (HP + 0.05 - box) / stretch);
    cushionList.push({ p: [x, -0.03, z], r: [0, r() * 6.3, 0], s: [big * stretch, (0.05 + r() * 0.08) * (1.2 - out * 0.5), big],
      c: mix3([0.9, 0.9, 0.9], [1.09, 1.09, 1.09], r()) });
  }
  const cushions = scatter(new THREE.SphereGeometry(1, 18, 6, 0, Math.PI * 2, 0, Math.PI / 2), cushionMat, cushionList);
  cushions.receiveShadow = false;

  // Helmlinge in Grüppchen: Glockenhut auf dünnem Stiel, leuchten schwach grünlich; mit der Welle hell auf (Ankunft des
  // Rings an der Instanz), dann klingt es ab
  const capMat = new THREE.MeshStandardMaterial({ color: lin(v.cap), roughness: 0.6, emissive: lin(v.glow) });
  capMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uShockT: shockUniforms.uShockT });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vMossD;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        { vec4 o4 = vec4(0.0, 0.0, 0.0, 1.0);
        #ifdef USE_INSTANCING
          o4 = instanceMatrix * o4;
        #endif
        vMossD = length((modelMatrix * o4).xz); }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uShockT;\nvarying float vMossD;')
      .replace('#include <tonemapping_fragment>', `
        if (uShockT < 5.0) {
          float age = uShockT - vMossD / ${SHOCK_SPEED.toFixed(2)};
          gl_FragColor.rgb += vec3(0.5, 1.4, 0.7) * smoothstep(-0.12, 0.0, age) * exp(-max(age, 0.0) * 1.4) * 1.6;
        }
        #include <tonemapping_fragment>`);
  };
  const stemMat = new THREE.MeshStandardMaterial({ color: lin(v.cap), roughness: 0.7, emissive: lin(v.glow, 0.45) });
  const capList = [], stemList = [], tilt = new THREE.Vector3();
  const spots = [[-4.55, -4.5], [4.5, -4.6], [4.6, 4.45], [-4.45, 4.6], [0.4, -4.6], [-4.6, 1.2], [4.62, -1.6], [-1.8, 4.62],
    [2.4, 4.55], [-2.5, -4.62], [4.58, 2.1], [-4.6, -2.3]];
  for (const [cx, cz] of spots) {
    const n = 4 + Math.floor(r() * 5);
    for (let i = 0; i < n; i++) {
      const x = cx + (r() - 0.5) * 0.4, z = cz + (r() - 0.5) * 0.4, box = Math.max(Math.abs(x), Math.abs(z));
      if (box > HP - 0.06 || box < HB + 0.08) continue;
      const hgt = 0.1 + r() * 0.14, rad = 0.035 + r() * 0.035, rot = [(r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4];
      stemList.push({ p: [x, 0.02, z], r: rot, s: [rad * 0.5, hgt, rad * 0.5] });
      tilt.set(0, hgt, 0).applyEuler(e.set(...rot));
      capList.push({ p: [x + tilt.x, 0.02 + tilt.y - rad * 0.3, z + tilt.z], r: rot, s: rad, c: mix3([0.88, 0.88, 0.88], [1, 1, 1], r()) });
    }
  }
  const capGeo = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55).scale(1, 1.1, 1);
  const stemGeo = new THREE.CylinderGeometry(0.12, 0.16, 1, 6).translate(0, 0.5, 0);
  const stems = scatter(stemGeo, stemMat, stemList), caps = scatter(capGeo, capMat, capList);

  // Farn an den Ecken und vereinzelt am Rand: Wedel als gebogene Fläche, die aufsteigt und sich nach aussen überbiegt
  const frondMat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8,
    emissive: new THREE.Color().setScalar(0.38) });
  const uLeaf = { value: lin(v.fern[0]) }, uStem = { value: lin(v.fern[1]) };
  frondMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uLeaf, uStem });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFrond;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFrond = uv;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform vec3 uLeaf, uStem;\nvarying vec2 vFrond;\n${MOSS_FROND_GLSL}`)
      .replace('#include <map_fragment>', `vec4 frond = mossFrond(vFrond, uLeaf, uStem);
        if (frond.a < 0.5) discard;
        diffuseColor.rgb *= frond.rgb;`)
      .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance *= frond.rgb;');
  };
  const frondGeo = new THREE.PlaneGeometry(0.32, 1, 1, 10);
  { // Wedel: steigt auf und biegt sich nach aussen (+z) über
    const pa = frondGeo.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const t = pa.getY(i) + 0.5;
      let y = 0, zz = 0;
      for (let k = 0; k < 20; k++) { const a = 1.15 - (t * k / 20) * 1.9; y += Math.sin(a) * t / 20; zz += Math.cos(a) * t / 20; }
      pa.setXYZ(i, pa.getX(i) * (1 - t * 0.6), y - Math.abs(pa.getX(i)) * 0.25, zz);
    }
    frondGeo.computeVertexNormals();
  }
  const frondList = [];
  const clumps = [[-4.45, -4.45, 11], [4.45, -4.45, 9], [4.45, 4.45, 11], [-4.45, 4.45, 9], [-4.62, -0.6, 5], [4.62, 0.9, 5],
    [1.4, 4.62, 5], [-1.2, -4.62, 4]];
  for (const [cx, cz, n] of clumps) {
    const outA = Math.atan2(cx, cz); // nach aussen
    for (let i = 0; i < n; i++) {
      frondList.push({ p: [cx + (r() - 0.5) * 0.1, 0.02, cz + (r() - 0.5) * 0.1], r: [0, outA + (r() - 0.5) * (n > 5 ? 3.4 : 1.6), 0],
        s: 0.95 + r() * 0.6 });
    }
  }
  const fronds = scatter(frondGeo, frondMat, frondList);

  // Wurzeln unter der Scholle (ein Netz)
  const rootMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, emissive: new THREE.Color().setScalar(0.095) });
  const r0 = lin(v.root[0]), r1 = lin(v.root[1]);
  const roots = new THREE.Mesh(mossRoots(r, HP, -SIDE_H + 0.02, (t) => r0.clone().lerp(r1, t)), rootMat);

  // Blumen der Lichtwelle: überall verstreut, im Rand höher (auf den Polstern)
  const flowerList = [];
  for (let i = 0; i < MOSS.flowers; i++) {
    const x = (r() * 2 - 1) * (HP - 0.1), z = (r() * 2 - 1) * (HP - 0.1), box = Math.max(Math.abs(x), Math.abs(z));
    flowerList.push([x, box > HB + 0.1 ? 0.06 + r() * 0.08 : 0.012, z, (0.11 + r() * 0.07) / 2, r() * 6.3, r() * 0.08, r()]);
  }
  const flowers = mossFlowers(flowerList, lin(v.flower[0]), lin(v.flower[1]));

  const group = new THREE.Group();
  group.add(floorTop, sides, cushions, stems, caps, fronds, roots, flowers);

  // Überblenden: boardBlend (für alle Arten gleich); die Blumen stehen nur ohne Überblenden
  const all = [floorMaterial, sideMaterial, cushionMat, capMat, stemMat, frondMat, rootMat];

  // Mondlicht aus der Richtung des Monds im Panorama, mit hellen Kanten auf der Mondseite (auf der Fläche schwächer)
  boardMoonlight(all, v, floorMaterial, MOSS.moonRimFloor);

  const textures = [tex.map, tex.normalMap, tex.side, tex.cushion];
  return {
    group,
    mirror: null,
    textures,
    computed: tex.computed,
    setFade(k) {
      group.visible = k > 0;
      // je Bild (boardTheme.render): Blumen nur zeichnen, solange die Lichtwelle sie blühen lässt
      flowers.visible = k >= 1 && shockUniforms.uShockT.value < MOSS.flowerEnd;
    },
    dispose() {
      group.traverse((o) => { o.geometry?.dispose(); if (o.isInstancedMesh) o.dispose(); });
      for (const m of [...all, flowers.material]) m.dispose();
      for (const t of textures) t.dispose();
    },
  };
}

/* ---------- Basaltsäulen (Art basalt): das Brett des Vulkans (Ticket 09) ---------- */

// Masse der Basaltsäulen (m). Das Brett ist das Ende eines Bündels sechseckiger Säulen wie am Giant's Causeway (Spitze
// des Sechsecks in z). Im Feld sind sie eben geschliffen: Die Oberfläche zeichnet ihre Fugen, die Säulen selbst stehen
// knapp darunter. Im Rand stehen sie in Stufen, nach aussen tiefer, einzelne höher. Unten hängen sie verschieden lang
// herab wie an der Decke der Fingalshöhle
const BASALT = {
  r: 0.19,                  // Umkreis einer Säule
  body: 0.975,              // Körper etwas schmaler als die Wabe: feine Fugen zwischen den Säulen
  top: -0.003,              // Köpfe der Säulen des Felds, knapp unter der Oberfläche
  field: BOARD / 2 + 0.19,  // Säulen, deren Mitte näher liegt (Kastenabstand), gehören zum Feld: Sie decken jeden Punkt
                            // des 7×7-Felds, und nur über ihnen ist die Oberfläche deckend
  core: 3.95,               // halbe Kante des Kernquaders: Bis 4,2 m stehen Säulen des Felds, 25 cm bleiben als Tiefe
  coreLow: -0.8,            // Boden des Kernquaders: Die kürzeste Säule des Felds endet bei −0,865 m
  rise: 0.5,                // Anteil der Säulen des Felds, die sich in der Lichtwelle heben
  waveEnd: 3,               // so lange (s nach dem Start des Rings) wirkt die Lichtwelle, danach steht das Brett still
};
// Werte der Brett-Angabe (tools/sky-schema.mjs, BOARD_PARAMS), alle Farben sRGB 0 … 1
const BASALT_VALUES = ['basalt', 'tint', 'lip', 'joint', 'line', 'inlay', 'column', 'rise', 'glow'];

/**
 * Farbe, Rauheit und Normalen der Oberfläche der Basaltsäulen (basaltBoard), ohne Bezug auf das übrige Spiel (Worker).
 * Formeln und Farben aus dem Katalog (katalog-vulkan, 2-basalt.js), die Höhen ungerundet. size² über das ganze Brett
 * (Zeile j bei uv.y = (j + ½) / size, also z von +plate/2 nach −plate/2): je Säule ein Ton zwischen basalt[1] und
 * basalt[0], wolkig getönt (tint), ihr Rand etwas heller geschliffen (lip), die Fugen dunkel (joint) und vertieft.
 * Ausserhalb der Säulen des Felds (field, Kastenabstand ihrer Mitte) ist sie durchsichtig (Alpha 0): Dort stehen die
 * Säulen des Rands als Körper. Rauheit im G-Kanal wie bei three, im R-Kanal die Fugen für die Glut der Lichtwelle.
 * a: { size, plate, field, r (Umkreis einer Säule), v (Werte der Brett-Angabe) }.
 */
function basaltData({ size, plate, field, r: R, v }) {
  const hash = (x, y, s) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  const fbm = (x, y, oct, s) => {
    let sum = 0, amp = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { sum += amp * noise(x * f, y * f, s + i * 17); n += amp; amp *= 0.5; f *= 2.03; }
    return sum / n;
  };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // Wabe unter (x, z): Mitte (cx, cz), Nummer, Abstand zur Kante (kubische Koordinaten, gerundet)
  const S3 = Math.sqrt(3), AP = R * S3 / 2, CS = Math.cos(Math.PI / 3), SN = Math.sin(Math.PI / 3);
  const hexAt = (x, z) => {
    const qf = (S3 / 3 * x - z / 3) / R, rf = (2 / 3 * z) / R, sf = -qf - rf;
    let q = Math.round(qf), rr = Math.round(rf);
    const s = Math.round(sf), dq = Math.abs(q - qf), dr = Math.abs(rr - rf), ds = Math.abs(s - sf);
    if (dq > dr && dq > ds) q = -rr - s; else if (dr > ds) rr = -q - s;
    const cx = R * S3 * (q + rr / 2), cz = R * 1.5 * rr, px = x - cx, pz = z - cz;
    const m = Math.max(Math.abs(px), Math.abs(px * CS + pz * SN), Math.abs(px * CS - pz * SN));
    return { cx, cz, id: q * 1000 + rr, edge: AP - m };
  };

  const n = size * size, texel = plate / size;
  const color = new Uint8ClampedArray(n * 4), rough = new Uint8ClampedArray(n * 4), height = new Float32Array(n);
  for (let j = 0; j < size; j++) {
    const z = plate / 2 - (j + 0.5) * texel;
    for (let i = 0; i < size; i++) {
      const x = -plate / 2 + (i + 0.5) * texel, k = (j * size + i) * 4, h = hexAt(x, z);
      if (Math.max(Math.abs(h.cx), Math.abs(h.cz)) >= field) { height[j * size + i] = -0.004; continue; } // Alpha 0
      const t = noise(h.id * 0.137, h.id * 0.071, 302);
      let c = mix(v.basalt[1], v.basalt[0], t);
      c = mix(c, v.tint, fbm(x * 2, z * 2, 3, 303) * 0.4);
      const joint = smooth(0.012, 0.004, h.edge), lip = smooth(0.045, 0.012, h.edge) * (1 - joint);
      c = mix(c, v.lip, lip * 0.5);
      c = mix(c, v.joint, joint);
      color[k] = c[0] * 255; color[k + 1] = c[1] * 255; color[k + 2] = c[2] * 255; color[k + 3] = 255;
      rough[k] = smooth(0.02, 0.004, h.edge) * 255; rough[k + 1] = (0.5 + 0.35 * joint) * 255; rough[k + 3] = 255;
      height[j * size + i] = -joint * 0.004 - lip * 0.0012 + (fbm(x * 9, z * 9, 2, 304) - 0.5) * 0.0004;
    }
  }
  // Normalen im Raum der Textur (+u = +x, +v = −z): (−∂h/∂u, −∂h/∂v, 1)
  const normal = new Uint8ClampedArray(n * 4);
  const H = (i, j) => height[Math.min(size - 1, Math.max(0, j)) * size + Math.min(size - 1, Math.max(0, i))];
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const nx = -(H(i + 1, j) - H(i - 1, j)) / (2 * texel), ny = -(H(i, j + 1) - H(i, j - 1)) / (2 * texel);
      const l = Math.hypot(nx, ny, 1), k = (j * size + i) * 4;
      normal[k] = ((nx / l) * 0.5 + 0.5) * 255; normal[k + 1] = ((ny / l) * 0.5 + 0.5) * 255;
      normal[k + 2] = ((1 / l) * 0.5 + 0.5) * 255; normal[k + 3] = 255;
    }
  }
  return { map: color, roughnessMap: rough, normalMap: normal };
}

/**
 * Säulen der Basaltsäulen (basaltBoard): alle, die ganz in den Umriss passen, wie im Katalog (gleicher Zufall). Die des
 * Felds oben bündig (BASALT.top), die des Rands in Stufen, nach aussen tiefer, einzelne höher; unten hängen sie
 * verschieden lang herab, in der Mitte am längsten. Liefert [{ x, z, top, bot, tone (0 … 1), field }].
 */
function basaltColumns() {
  const R = BASALT.r, S3 = Math.sqrt(3), AP = R * S3 / 2, HP = PLATE / 2, r = mulberry32(301), cols = [];
  const clamp = (x) => Math.min(1, Math.max(0, x));
  for (let rr = -34; rr <= 34; rr++) {
    for (let q = -34; q <= 34; q++) {
      const x = R * S3 * (q + rr / 2), z = R * 1.5 * rr;
      if (Math.abs(x) > HP - AP || Math.abs(z) > HP - R) continue;
      const box = Math.max(Math.abs(x), Math.abs(z)), d = Math.hypot(x, z), field = box < BASALT.field;
      const out = clamp((box - BASALT.field) / (HP - BASALT.field));
      let top = field ? BASALT.top : -0.025 - out * 0.34 * (0.45 + r() * 0.8);
      if (!field && out > 0.25 && r() < 0.14) top = 0.03 + r() * 0.06; // einzelne höher, wie Stufen am Causeway
      const hang = 0.45 + 2.3 * Math.pow(clamp(1 - d / 6.6), 1.6) * (0.55 + 0.45 * r()) + (r() < 0.12 ? r() * 0.6 : 0);
      const id = q * 1000 + rr;
      cols.push({ x, z, top, bot: -PLATE_THICK - hang, id, field });
    }
  }
  return cols;
}

/**
 * Basaltsäulen (Art basalt, Vulkan; Ticket 09, aus dem Katalog gewählt: Karte 2): Das Brett ist das Ende eines Bündels
 * sechseckiger Basaltsäulen. Die Oberfläche (Texturen aus dem Hintergrund-Thread, basaltData) zeigt die eben
 * geschliffenen Säulen des Felds mit feinen Fugen, das Raster als feine helle Linien darüber, die Einlegelinie hellgrau
 * (FLOOR_DETAIL_GLSL), leicht spiegelnd; ausserhalb der Säulen des Felds ist sie durchsichtig. Die Säulen selbst sind
 * Instanzen eines Sechseckprismas (basaltColumns, je eine Gruppe für Feld und Rand), flach schattiert, matt (Lambert
 * mit einem Ersatz für das Umgebungslicht; MeshStandardMaterial kostete am Desktop rund 4 ms je Bild mehr) und ohne
 * Schatten. Flächen, die nach unten oder zur Seite schauen, fangen das Licht des Lavasees (glow), ihre Enden am
 * stärksten. Lichtwelle (Katalog Version 2): Mit dem Ring steigt Glut in den Fugen auf und verglimmt dahinter, die Hälfte
 * der Säulen des Felds hebt sich eine Handbreit, ihre Flanken glühen orange, und hinter dem Ring sinken sie zurück; die
 * Köpfe der Randsäulen leuchten nacheinander auf. Alles folgt der Ankunft des Rings (shockClock), nicht seiner Stärke.
 * Die Glut liegt knapp über der Bloom-Schwelle, das Licht der Lava in Ruhe darunter.
 * v: Werte der Brett-Angabe (BASALT_VALUES, sRGB 0 … 1). Rückgabe wie jede Art (BOARD_TYPES).
 */
function basaltBoard(v) {
  for (const k of BASALT_VALUES) if (!v[k]) throw new Error(`Wert ${k} fehlt`);
  const srgb = (c) => new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);
  const N = QUALITY.textureSize, R = BASALT.r;
  const tex = boardTextures({ map: [N, N, true], roughnessMap: [N, N, false], normalMap: [N, N, false] }, basaltData,
    { size: N, plate: PLATE, field: BASALT.field, r: R, v });
  const uLine = { value: srgb(v.line) }, uInlay = { value: srgb(v.inlay) }, uGlow = { value: srgb(v.glow) };
  const speed = SHOCK_SPEED.toFixed(2), end = BASALT.waveEnd.toFixed(1);

  // Oberfläche: Säulen des Felds mit Fugen, Raster und Einlegelinie, leichte Spiegelung; Glut in den Fugen
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, map: tex.map, roughness: 1, roughnessMap: tex.roughnessMap, metalness: 0, normalMap: tex.normalMap,
    normalScale: new THREE.Vector2(1, 1), envMapIntensity: 0.6,
  });
  floorMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shockUniforms, { uLine, uInlay, uGlow });
    addBoardReflection(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
      uniform vec3 uShock, uShockColor, uLine, uInlay, uGlow;
      uniform float uShockT;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
      if (sampledDiffuseColor.a < 0.5) discard; // ausserhalb der Säulen des Felds: Dort stehen die des Rands
      ${FLOOR_DETAIL_GLSL}
      diffuseColor.rgb = mix(diffuseColor.rgb, uLine, floorGroove * 0.75);
      diffuseColor.rgb = mix(diffuseColor.rgb, uInlay, floorInlay);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor = mix(roughnessFactor, 0.8, floorGroove);
      roughnessFactor = mix(roughnessFactor, 0.55, floorInlay);`)
      .replace('#include <tonemapping_fragment>', `${boardReflectGlsl('0.3')}
      {
        vec2 wp = (vUv - 0.5) * ${PLATE.toFixed(4)};
        float wd = length(wp);
        // der Ring selbst als warmer Hauch
        if (uShock.y > 0.0) {
          float ring = exp(-pow((wd - uShock.x) / uShock.z, 2.0));
          gl_FragColor.rgb += (uShockColor * 0.5 + vec3(0.2, 0.12, 0.05)) * ring * 0.6 * min(1.0, uShock.y * 3.0);
        }
        // Glut steigt in den Fugen auf, wenn der Ring ankommt (vor wAge s), und verglimmt dahinter
        float wAge = uShockT - wd / ${speed};
        if (uShockT < ${end} && wAge > -0.12) {
          float jn = texture2D(roughnessMap, vUv).r;
          float up = smoothstep(-0.12, 0.02, wAge), a = max(wAge, 0.0);
          float glut = up * (0.72 * exp(-a / 0.16) + 0.28 * exp(-a / 0.8) * (1.0 - smoothstep(1.6, 2.6, a)));
          gl_FragColor.rgb += uGlow * jn * glut * 1.5;
        }
      }
      #include <tonemapping_fragment>`);
  };
  const floorTop = new THREE.Mesh(new THREE.PlaneGeometry(PLATE, PLATE), floorMaterial);
  floorTop.rotation.x = -Math.PI / 2;
  floorTop.receiveShadow = true;

  // Säulen: Licht des Lavasees von unten und die Köpfe, die in der Lichtwelle nacheinander aufleuchten (jede mit
  // eigenem Verzug bis 0,25 s). Feld und Rand teilen sich das Material
  const colMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
  colMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uShockT: shockUniforms.uShockT, uGlow });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBW;\nvarying vec3 vBI;')
      .replace('#include <project_vertex>', `#include <project_vertex>
      {
        vec4 w4 = vec4(transformed, 1.0), o4 = vec4(0.0, 0.0, 0.0, 1.0);
        #ifdef USE_INSTANCING
          w4 = instanceMatrix * w4; o4 = instanceMatrix * o4;
        #endif
        vBW = (modelMatrix * w4).xyz; vBI = (modelMatrix * o4).xyz;
      }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
      varying vec3 vBW;
      varying vec3 vBI;
      uniform float uShockT;
      uniform vec3 uGlow;`)
      .replace('#include <tonemapping_fragment>', `
      {
        vec3 wN = inverseTransformDirection(normal, viewMatrix);
        float dn = clamp(-wN.y, 0.0, 1.0), sd0 = 1.0 - abs(wN.y);
        float low = 0.5 + 0.5 * (1.0 - smoothstep(-2.5, -0.4, vBW.y)); // tiefer: näher an der Lava
        // Ersatz für das Umgebungslicht, das Lambert nicht kennt (wie die Softboxen bei MeshStandardMaterial): oben mehr
        gl_FragColor.rgb += diffuseColor.rgb * (0.35 + 1.5 * clamp(wN.y, 0.0, 1.0));
        gl_FragColor.rgb += diffuseColor.rgb * uGlow * (dn * 2.8 + sd0 * 0.3) * low;
        float frs = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);
        gl_FragColor.rgb += uGlow * pow(clamp(-wN.y + 0.25, 0.0, 1.0), 1.5) * (0.12 + 0.88 * frs) * 0.35 * low;
        if (uShockT < ${end}) {
          float rnd = fract(sin(dot(vBI.xz, vec2(12.9898, 78.233))) * 43758.5453);
          float a = uShockT - length(vBI.xz) / ${speed} - rnd * 0.25;
          float flash = smoothstep(-0.04, 0.0, a) * exp(-max(a, 0.0) / 0.16);
          float topf = smoothstep(0.7, 0.95, wN.y);
          gl_FragColor.rgb += uGlow * vec3(1.0, 0.8, 0.7) * flash * (0.06 + 0.94 * topf) * 1.15;
        }
      }
      #include <tonemapping_fragment>`);
  };
  const cols = basaltColumns(), dark = srgb(v.column[1]), light = srgb(v.column[0]);
  const geo = new THREE.CylinderGeometry(R * BASALT.body, R * BASALT.body, 1, 6, 1).translate(0, -0.5, 0);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const c = new THREE.Color(), hash = (id) => { const x = Math.sin(id * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const columns = (list, mat) => {
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((col, i) => {
      mesh.setMatrixAt(i, m4.compose(p.set(col.x, col.top, col.z), q, s.set(1, col.top - col.bot, 1)));
      mesh.setColorAt(i, c.copy(dark).lerp(light, hash(col.id)));
    });
    mesh.frustumCulled = false; // three 0.147 prüft bei Instanzen nur die Kugel um die Form am Ursprung
    return mesh;
  };
  const field = columns(cols.filter((col) => col.field), colMat), rim = columns(cols.filter((col) => !col.field), colMat);

  // Lichtwelle: Die Hälfte der Säulen des Felds hebt sich im Ring um 8 bis 30 cm aus der Oberfläche, die Flanken glühen
  // frisch; dahinter sinken sie zurück (Höhe im Vertex-Shader nach der Ankunft des Rings). Gezeichnet nur, solange die
  // Lichtwelle wirkt
  const rq = mulberry32(311), lifts = [];
  for (const col of cols) if (col.field && rq() < BASALT.rise) lifts.push([col.x, col.z, 0.08 + rq() ** 2 * 0.22]);
  const riseMat = new THREE.MeshLambertMaterial({ color: srgb(v.rise), flatShading: true });
  riseMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uShockT: shockUniforms.uShockT, uGlow });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uShockT;\nvarying float vGrow;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      {
        vec3 ic = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float rnd = fract(sin(dot(ic.xz, vec2(12.9898, 78.233))) * 43758.5453);
        float a = uShockT - (length(ic.xz) + (rnd - 0.5) * 0.4) / ${speed};
        // hebt sich an der Front, ein Teil bleibt kurz oben und sinkt in einer halben Sekunde zurück
        vGrow = a < 0.0 ? exp(-a * a / 0.0036) : 0.7 * exp(-a * a / 0.01) + 0.3 * (1.0 - smoothstep(0.0, 0.5, a));
        transformed.y *= vGrow;
      }`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uGlow;\nvarying float vGrow;')
      .replace('#include <tonemapping_fragment>', `
      {
        vec3 wN = inverseTransformDirection(normal, viewMatrix);
        gl_FragColor.rgb += uGlow * (1.0 - smoothstep(0.6, 0.9, wN.y)) * vGrow * 1.2;
      }
      #include <tonemapping_fragment>`);
  };
  const rise = new THREE.InstancedMesh(new THREE.CylinderGeometry(R * 0.95, R * 0.95, 1, 6, 1).translate(0, 0.5, 0),
    riseMat, lifts.length);
  lifts.forEach(([x, z, h], i) => rise.setMatrixAt(i, m4.compose(p.set(x, -0.02, z), q, s.set(1, h, 1))));
  rise.frustumCulled = false;
  rise.visible = false;

  const group = new THREE.Group();
  group.add(floorTop, field, rim, rise);

  // Überblenden: boardBlend (für alle Arten gleich, auch an colMat und riseMat). Die Oberfläche zeichnet vor den
  // Säulen (renderOrder): Deren Köpfe unter ihr kosten dann nichts
  floorTop.renderOrder = 0;
  field.renderOrder = rim.renderOrder = rise.renderOrder = 1;
  const all = [floorMaterial, colMat, riseMat];

  const textures = [tex.map, tex.roughnessMap, tex.normalMap];
  return {
    group,
    mirror: floorTop,
    textures,
    computed: tex.computed,
    setFade(k) {
      group.visible = k > 0;
      // je Bild (boardTheme.render): die Säulen der Lichtwelle nur, solange sie wirkt
      rise.visible = shockUniforms.uShockT.value < BASALT.waveEnd;
    },
    dispose() {
      group.traverse((o) => { o.geometry?.dispose(); if (o.isInstancedMesh) o.dispose(); });
      for (const m of all) m.dispose();
      for (const t of textures) t.dispose();
    },
  };
}

/**
 * Arten von Brettern (Spec .scratch/brett-je-himmel/), je { core, build(values) }. tools/sky-schema.mjs liest ihre Namen
 * aus der Zeile `const BOARD_TYPES = { … }` und prüft die Werte der Brett-Angaben (BOARD_PARAMS dort).
 * core: Kernquader { lo, hi } (Welt, m), den jedes Brett der Art sicher ganz und undurchsichtig deckt. Dahinter zeichnet
 * der Himmel nichts (boardCoreUniforms); füllt eine Form ihren Umriss nicht ganz, ist er kleiner, sonst entstehen Löcher
 * im Himmel. Mehr als der Umriss von PLATE × PLATE darf er nicht sein.
 * build(values): ein Brett aus den Werten der Brett-Angabe (wirft es, steht das Steinbrett), {
 * - group: alles, was zum Brett gehört; kommt unsichtbar in die Szene, bis es gezeigt wird (setFade),
 * - mirror: spiegelnde Oberfläche in y = 0 (renderReflection übernimmt ihre Matrix und blendet sie beim Spiegeln aus;
 *   null: spiegelt nicht),
 * - textures: im Spiel berechnete Texturen (boardTheme lädt sie in Häppchen hoch, boardTextureUpload),
 * - computed: Promise, erfüllt, sobald die Texturen berechnet sind (im Hintergrund-Thread); abgelehnt: gescheitert,
 * - setFade(k), je Bild (boardTheme.render): Anteil k (0 … 1) des Bretts im Bild, 0 unsichtbar (group.visible). Das
 *   Überblenden selbst macht boardBlend für alle Arten gleich, an den Materialien der Netze; eine Art blendet hier nur,
 *   was eigene ShaderMaterials hat (Funken, Tropfen, Körner), mit k. Ihre Netze mit gewöhnlichen Materialien decken den
 *   Kernquader und zeichnen undurchsichtig,
 * - dispose(): Grafikspeicher freigeben }.
 * Pflicht auf jedem Brett ist die Lichtwelle beim Lösen (shockUniforms; eine eigene richtet sich nach shockClock).
 */
const stone = {
  // Oberfläche (y = 0), Seiten (3 cm darunter, PLATE_THICK dick) und die Metallkante dazwischen decken den Umriss
  core: { lo: [-PLATE / 2, -PLATE_THICK - 0.03, -PLATE / 2], hi: [PLATE / 2, 0, PLATE / 2] },
  build: stoneBoard,
};
const tidePool = {
  // Oberfläche (y = 0) und die bündigen Seiten darunter decken den Umriss
  core: { lo: [-PLATE / 2, -PLATE_THICK - 0.03, -PLATE / 2], hi: [PLATE / 2, 0, PLATE / 2] },
  build: tidePoolBoard,
};
const clay = {
  // Oberfläche (y = 0) über Gesims (ganze Breite) und eingezogener Wand: Sicher gedeckt ist nur der Quader der Wand
  core: {
    lo: [-CLAY.wall / 2, -0.003 - CLAY.cornice - CLAY.wallH, -CLAY.wall / 2],
    hi: [CLAY.wall / 2, 0, CLAY.wall / 2],
  },
  build: clayBoard,
};
const raisedBed = {
  // Erde (y = 0) über dem Kasten aus Bohlen ohne Deckfläche: Beide decken den Umriss bis zum Boden des Kastens
  core: { lo: [-PLATE / 2, -BED.depth, -PLATE / 2], hi: [PLATE / 2, 0, PLATE / 2] },
  build: raisedBedBoard,
};
const moss = {
  // Oberfläche (y = 0) und die bündige Erdscholle darunter decken den Umriss
  core: { lo: [-PLATE / 2, -PLATE_THICK - 0.03, -PLATE / 2], hi: [PLATE / 2, 0, PLATE / 2] },
  build: mossBoard,
};
const basalt = {
  // Die Säulen des Felds stehen dicht unter der Oberfläche (y = 0) und reichen mindestens 0,865 m hinab: Sie decken den
  // Quader unter dem Feld. Der stufige Rand und die Fugen zwischen den Säulen decken nichts sicher
  core: { lo: [-BASALT.core, BASALT.coreLow, -BASALT.core], hi: [BASALT.core, 0, BASALT.core] },
  build: basaltBoard,
};
const BOARD_TYPES = { stone, tidePool, clay, raisedBed, moss, basalt };

/**
 * Textur eines Bretts in Häppchen hochladen (Generator für sliced), an three vorbei wie skyUpload: eigene WebGL-Textur
 * fester Grösse (texStorage2D), je Bild ein Streifen von höchstens 256 K Pixeln (1 MB) an einer ruhigen Stelle (ruhe),
 * am Schluss die Mipmaps auf der Grafikkarte und die Einstellungen wie three. three bindet sie danach nur noch
 * (properties: __webglTexture, __version). In einem Stück hielten die drei Texturen des Steinbretts (je 4 MB) ein Bild
 * auf dem gedrosselten Handy bis 100 ms an (Review Ticket 01). Ohne WebGL2 renderer.initTexture in einem Stück.
 * alive: falsch, sobald das Brett nicht mehr gebraucht wird (Abbruch).
 */
function* boardTextureUpload(t, alive) {
  yield RUHIG;
  if (!alive() || boardTheme.onGpu(t)) return;
  if (!renderer.capabilities.isWebGL2) { renderer.initTexture(t); return; }
  const gl = renderer.getContext(), { width: w, height: h, data } = t.image, tex = gl.createTexture();
  const bind = () => renderer.state.bindTexture(gl.TEXTURE_2D, tex); // über three, damit es weiss, was gebunden ist
  // inzwischen freigegeben oder doch von three hochgeladen (gezeigt, bevor es bereit war: Notfall)
  const weg = () => !alive() || boardTheme.onGpu(t);
  const levels = t.generateMipmaps ? Math.floor(Math.log2(Math.max(w, h))) + 1 : 1;
  bind();
  gl.texStorage2D(gl.TEXTURE_2D, levels, t.encoding === THREE.sRGBEncoding ? gl.SRGB8_ALPHA8 : gl.RGBA8, w, h);
  const rows = Math.max(1, Math.floor((1 << 18) / w));
  for (let y = 0; y < h; y += rows) {
    yield RUHIG;
    if (weg()) { gl.deleteTexture(tex); return; }
    const n = Math.min(rows, h - y);
    bind();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); // wie three für Daten (flipY, premultiplyAlpha aus)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, t.unpackAlignment);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, w, n, gl.RGBA, gl.UNSIGNED_BYTE, data.subarray(y * w * 4, (y + n) * w * 4));
    gl.flush();
    yield NEXT_FRAME;
  }
  yield RUHIG;
  if (weg()) { gl.deleteTexture(tex); return; }
  bind();
  if (levels > 1) gl.generateMipmap(gl.TEXTURE_2D);
  const wrap = (m) => (m === THREE.RepeatWrapping ? gl.REPEAT : m === THREE.MirroredRepeatWrapping ? gl.MIRRORED_REPEAT
    : gl.CLAMP_TO_EDGE);
  const filter = { [THREE.NearestFilter]: gl.NEAREST, [THREE.LinearFilter]: gl.LINEAR,
    [THREE.NearestMipmapNearestFilter]: gl.NEAREST_MIPMAP_NEAREST, [THREE.LinearMipmapNearestFilter]: gl.LINEAR_MIPMAP_NEAREST,
    [THREE.NearestMipmapLinearFilter]: gl.NEAREST_MIPMAP_LINEAR, [THREE.LinearMipmapLinearFilter]: gl.LINEAR_MIPMAP_LINEAR };
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap(t.wrapS));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap(t.wrapT));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter[t.magFilter]);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, levels > 1 ? filter[t.minFilter] : gl.LINEAR);
  const aniso = renderer.extensions.get('EXT_texture_filter_anisotropic'), p = renderer.properties.get(t);
  if (aniso && t.anisotropy > 1 && levels > 1 && t.magFilter !== THREE.NearestFilter) {
    gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(t.anisotropy, renderer.capabilities.getMaxAnisotropy()));
    p.__currentAnisotropy = t.anisotropy;
  }
  p.__webglTexture = tex;
  p.__version = t.version;
  t.addEventListener('dispose', () => { gl.deleteTexture(tex); renderer.properties.remove(t); });
}

/**
 * Der Brett-Teil (Spec .scratch/brett-je-himmel/). Er baut Bretter aus den Brett-Angaben der Himmel (board im Register:
 * { type, …Werte }; ohne Angabe, unter Milchstrasse und Sonnensystem das Steinbrett) und teilt eines unter allen
 * Himmeln mit gleicher Art und gleichen Werten (so liegt etwa das Steinbrett nur einmal im Grafikspeicher). Der Wechsel
 * des Himmels (skyTheme) steuert ihn, die Geschichte spricht nur mit dem Himmel:
 * - prepare(sky, angabe): Beim Vorbereiten und Vorladen eines Himmels (set, preload) wird sein Brett gebaut, berechnet
 *   (im Hintergrund-Thread), übersetzt und in Häppchen hochgeladen (load), an ruhigen Stellen wie der Himmel (ruhe),
 *   nie im Moment des Wechsels. Anders als scharfes Bild und Streifen des Himmels wartet es nicht auf skyTheme.quiet:
 *   Ohne sein Brett ist ein Himmel nicht settled, Reise und Wiederholen warteten sonst bis zur Frist.
 * - free(sky): Es wird mit seinem Himmel freigegeben (auf dem Handy sofort, sonst nach skyTheme.keep); gezeigt bleibt
 *   es, bis das Überblenden vorbei ist. Das Steinbrett bleibt immer gebaut (Milchstrasse, Sonnensystem, Rückfall).
 * - follow(dt), je Bild: Das gezeigte Brett folgt dem gezeigten Himmel. Ist das Brett des gewählten nicht bereit, hält
 *   skyTheme den bisherigen Himmel (holding, haelt), und dessen Brett bleibt stehen. Dann wächst das neue gleichzeitig
 *   mit dem Himmel und über dessen ganze Dauer über das bisherige (boardBlend: von der Mitte nach aussen, für alle
 *   Formen gleich), auch über die Nacht ohne Steinbrett dazwischen. Wird das umgelenkt, behält jedes gezeigte Brett sein
 *   Stück (unter), und das nächste wächst darüber, in der Zeit, die der Himmel noch braucht. Springt der Himmel (set
 *   ohne Überblenden), springt das Brett mit; ist es dann nicht bereit, steht keines da, bis es bereit ist.
 * - Notfall: Scheitert das Berechnen, steht das Steinbrett. Steht nach 8 s, in denen es laden durfte (ruhe: nicht unter
 *   dem Menü), noch kein Brett da (es gibt kein früheres zum Halten, etwa beim ersten Himmel nach dem Start), wächst
 *   das Steinbrett in skyTheme.fadeTime ins Bild, bis das richtige bereit ist, und das wächst dann ebenso darüber
 *   (fristStarten). Beides mit einer Warnung, nie einem Fehler.
 * skyTheme.ready schliesst das Brett ein (steht), skyTheme.settled ebenso (bereitFuer).
 */
const BOARD_NOTFALL_S = 8;
const _boardCore = new THREE.Vector3(), _boardMirrors = [];
const boardTheme = {
  types: BOARD_TYPES, // Testschnittstelle: Proben legen hier eigene Arten an
  built: new Map(),   // Schlüssel aus Art und Werten -> Eintrag { key, type, board, blend, users, ready, failed, gone, … }
  skies: new Map(),   // id eines vorbereiteten Himmels -> Eintrag seines Bretts (prepare … free)
  stone: null,        // Eintrag des Steinbretts (dauerhaft)
  // das gezeigte, beim Überblenden das neue Brett: { sky (id des Himmels, dem es gehört), entry, notfall (das Steinbrett
  // steht für ein gescheitertes Brett oder, mit frist, weil nach 8 s keines bereit war) }; null: keines
  to: null,
  anteil: 1,          // so weit ist to gewachsen, 0 … 1 (1 ohne Überblenden); sein Stück ist n < anteil (boardBlend)
  // beim Überblenden die bisherigen Bretter, von innen nach aussen, je wie to mit bis: Ihr Stück reicht vom vorigen bis
  // dahin (das äusserste bis 1; fehlt es, wächst to aus dem Nichts). Leer ohne Überblenden
  unter: [],
  mitHimmel: false,   // das Überblenden folgt dem des Himmels (sonst eine eigene Uhr: aus dem Notfall)
  p0: 0,              // mit dem Himmel: dessen Fortschritt (progress) beim Beginn dieses Überblendens
  ohne: null,         // kein Brett steht da: { ms (so lange, wie es laden durfte; nach 8 s der Notfall), uhr } (fristStarten)

  /** Brett zu einer Brett-Angabe (ohne: das Steinbrett), schon gebaut oder neu (es lädt gleich, load); release gibt es ab */
  acquire(angabe) {
    let { type = 'stone', ...values } = angabe ?? {};
    if (!Object.hasOwn(this.types, type)) { // Register neuer als das Spiel: wie ohne Angabe
      console.warn(`Brett: Art ${type} unbekannt, Steinbrett`);
      type = 'stone';
      values = {};
    }
    const key = JSON.stringify([type, Object.keys(values).sort().map((k) => [k, values[k]])]);
    let entry = this.built.get(key);
    if (!entry) {
      entry = { key, type, board: null, blend: null, users: 0, ready: false, failed: false, gone: false, loaded: null,
        blendVorab: null, blendBereit: false };
      this.built.set(key, entry);
      try {
        entry.board = arbeit.tue(`Brett ${type}: bauen`, () => this.types[type].build(values));
        entry.blend = boardBlend(entry.board.group);
        entry.board.setFade(0);
        scene.add(entry.board.group);
        entry.loaded = this.load(entry);
      } catch (e) {
        entry.failed = true;
        console.warn(`Brett ${type}: ${e.message}, Steinbrett`);
      }
      if (this.built.size > 1) for (const e of this.built.values()) this.needBlend(e);
    }
    entry.users++;
    return entry;
  },
  /** Brett abgeben (acquire); braucht es niemand mehr, wird es freigegeben */
  release(entry) {
    if (--entry.users > 0) return;
    entry.gone = true;
    this.built.delete(entry.key);
    if (!entry.board) return;
    scene.remove(entry.board.group);
    arbeit.tue(`Brett ${entry.type}: freigeben`, () => entry.board.dispose());
  },
  /**
   * Ein neues Brett bereit machen: abwarten, bis seine Texturen berechnet sind, dann an ruhigen Stellen (ruhe) seine
   * Programme übersetzen (compileParallel, erst nach dem ersten Bild der Szene wie der Himmel) und seine Texturen in
   * Häppchen hochladen (boardTextureUpload). Scheitert etwas, steht das Steinbrett (target).
   */
  async load(entry) {
    const alive = () => !entry.gone;
    try {
      await entry.board.computed;
      await sceneReady;
      await ruhe.warte();
      if (!alive()) return;
      await this.compile(entry, [null]);
      await sliced((function* () { for (const t of entry.board.textures) yield* boardTextureUpload(t, alive); })(), false,
        `Brett ${entry.type}: Texturen`);
      if (!alive()) return;
      if (!entry.board.textures.every((t) => this.onGpu(t))) throw new Error('Texturen nicht hochgeladen');
      entry.ready = true;
    } catch (e) {
      if (!alive()) return;
      entry.failed = true;
      console.warn(`Brett ${entry.type}: ${e?.message ?? e}, Steinbrett`);
    } finally {
      sceneLoop.wake(true); // zeigen (follow); hinter einer Bühne vor dem Ruhen zeichnen (aufwärmen)
    }
  },
  /** Programme eines Bretts übersetzen, ohne das Bild anzuhalten (compileParallel, nur seine Gruppe) */
  compile(entry, variants) {
    const group = entry.board.group;
    return compileParallel([scene], { skip: scene.children.filter((c) => c !== group), variants, slices: true,
      was: `Brett ${entry.type}: Shader${variants[0] ? ' Überblenden' : ''}`,
      alive: () => !entry.gone });
  },
  /**
   * Gibt es mehr als ein Brett, kann jedes überblenden: seine Fassung dafür (boardBlend, variant) nach dem Laden vorab
   * übersetzen, sonst übersetzte three sie im ersten Bild des Wechsels (Ruck). Bis dahin hält skyTheme den bisherigen
   * Himmel (bereitFuer).
   */
  needBlend(entry) {
    if (entry.blendVorab || !entry.loaded) return;
    entry.blendVorab = entry.loaded.then(async () => {
      if (!entry.ready || entry.gone) return;
      await ruhe.warte();
      if (!entry.gone) await this.compile(entry, [entry.blend.variant]);
    }).catch((e) => console.warn(`Brett ${entry.type}: Überblenden nicht vorab übersetzt (${e?.message ?? e})`))
      .then(() => { entry.blendBereit = true; sceneLoop.wake(); });
  },
  /**
   * Das Brett des Himmels sky (seine Brett-Angabe) bauen und bereit machen; es bleibt, bis der Himmel frei wird
   */
  prepare(sky, angabe) {
    if (!this.skies.has(sky)) this.skies.set(sky, this.acquire(angabe));
  },
  /** Mit dem Himmel sky freigeben (skyTheme.update); gezeigt bleibt es, bis sein Überblenden vorbei ist */
  free(sky) {
    const entry = this.skies.get(sky);
    if (!entry) return;
    this.skies.delete(sky);
    this.release(entry);
  },
  /** Das Brett, das unter dem Himmel sky stehen soll: { entry, notfall } (gescheitert: das Steinbrett, als Notfall) */
  target(sky) {
    const entry = this.skies.get(sky);
    return entry && !entry.failed ? { entry, notfall: false } : { entry: this.stone, notfall: !!entry };
  },
  /** das äusserste der bisherigen Bretter (beim Überblenden das, von dem es ausging), sonst null */
  get from() { return this.unter.at(-1) ?? null; },
  /** Einträge aller gezeigten Bretter (to und unter) */
  get gezeigt() { return [this.to, ...this.unter].filter(Boolean).map((l) => l.entry); },
  /**
   * Das Brett des Himmels sky kann ins Bild: berechnet, übersetzt und hochgeladen, und muss es über ein anderes
   * wachsen, sind beide auch dafür übersetzt (skyTheme hält bis dahin den bisherigen Himmel, holding)
   */
  bereitFuer(sky) {
    const { entry } = this.target(sky), da = this.gezeigt;
    return entry.ready && (da.every((e) => e === entry) || [entry, ...da].every((e) => e.blendBereit));
  },
  /**
   * Ein Brett steht, das bleiben muss, bis das des Himmels sky bereit ist: skyTheme hält so lange den bisherigen Himmel
   * (holding). Steht keines (der erste Himmel nach dem Start), gibt es nichts zu halten: Der Himmel blendet über, und
   * das Brett erscheint, sobald es bereit ist (nach 8 s das Steinbrett, follow).
   */
  haelt(sky) { return !!this.to && !this.bereitFuer(sky); },
  /** to ist das Brett des Himmels sky, wie target es verlangt */
  istZiel(sky) {
    const z = this.target(sky), to = this.to;
    return to?.sky === sky && to.entry === z.entry && to.notfall === z.notfall;
  },
  /** Das Brett des Himmels sky steht ganz und bereit im Bild (skyTheme.ready); im Notfall nur, wenn es scheiterte */
  steht(sky) { return this.anteil === 1 && !this.unter.length && this.istZiel(sky) && this.to.entry.ready; },
  /** blendet mit eigener Uhr über (aus dem Notfall): skyTheme.busy */
  get busy() { return this.anteil < 1 && !this.mitHimmel; },
  /**
   * Fortschritt des Himmels über sein ganzes Überblenden in den Himmel sky, 0 … 1: erst blendet der bisherige aus
   * (0 … 0,5), dann der neue ein (0,5 … 1); wie story.blendSky
   */
  progress(sky) {
    const s = skyTheme, a = s.entries.find((e) => s.weight[e.id] > 0);
    if (!a) return 0.5;
    return a.id === sky ? 0.5 + 0.5 * s.weight[a.id] : 0.5 * (1 - s.weight[a.id]);
  },
  /** Gezeigt werden to (ganz, anteil 1) und unter; alle gehalten (users), die bisher gezeigten abgegeben */
  show(to, unter = []) {
    const vorher = this.gezeigt;
    for (const l of [to, ...unter]) if (l) l.entry.users++;
    for (const e of vorher) this.release(e);
    Object.assign(this, { to, unter, anteil: 1 });
    if (to && this.ohne) { clearInterval(this.ohne.uhr); this.ohne = null; }
  },
  /**
   * ziel wächst über das, was gerade steht (boardBlend): Das bisher gezeigte behält sein Stück (n < anteil), die
   * übrigen ebenso. mitHimmel: in der Zeit, die der Himmel noch zum Überblenden braucht (umgelenkt: der Rest), sonst in
   * skyTheme.fadeTime. Steht nichts, wächst es aus dem Nichts.
   */
  blend(ziel, mitHimmel) {
    const unter = this.to ? [{ ...this.to, bis: this.anteil }, ...this.unter].filter((l) => l.bis > 0) : [];
    arbeit.merke(`Brett ${ziel.entry.type}: wächst`);
    this.show(ziel, unter);
    Object.assign(this, { anteil: 0, mitHimmel, p0: mitHimmel ? this.progress(ziel.sky) : 0 });
  },
  /**
   * Frist des Notfalls, solange kein Brett dasteht: Sie zählt nur die Zeit, in der das Brett laden darf (ruhe.jetzt),
   * also nicht unter Menü und Übersicht, während einer Fahrt der Bühne oder der Enthüllung, wo bewusst nichts lädt.
   * Wartet die Geschichte darauf, darf es laden (skyOf: ruhe.lade). Nach BOARD_NOTFALL_S weckt sie die Schleife
   * (follow). Eigene Uhr statt der Bilder: Die Schleife darf dazwischen ruhen.
   */
  fristStarten() {
    let zuletzt = performance.now();
    const ohne = this.ohne = { ms: 0, uhr: setInterval(() => {
      const now = performance.now();
      if (ruhe.jetzt()) ohne.ms += Math.min(now - zuletzt, 1000); // verborgener Tab: Zeitgeber gedrosselt, höchstens 1 s
      zuletzt = now;
      if (ohne.ms >= BOARD_NOTFALL_S * 1000) { clearInterval(ohne.uhr); sceneLoop.wake(); }
    }, 100) };
  },
  /** Je Bild nach dem Himmel (skyTheme.update) und nach set: das gezeigte Brett dem gezeigten Himmel nachführen */
  follow(dt) {
    const sky = skyTheme.current, z = this.target(sky), to = this.to, fading = skyTheme.fading;
    if (!this.istZiel(sky)) {
      const ziel = { sky, entry: z.entry, notfall: z.notfall };
      if (this.bereitFuer(sky)) {
        // mit dem Himmel, sobald er sich bewegt; aus dem Notfall (oder während es mit eigener Uhr wächst) mit eigener
        // Uhr; sonst gleich (der Himmel sprang)
        if (to && fading) { if (!skyTheme.holding) this.blend(ziel, true); }
        else if (to && (to.frist || (this.anteil < 1 && !this.mitHimmel))) this.blend(ziel, false);
        else this.show(ziel);
      } else if (to?.frist) {
        to.sky = sky; // das Steinbrett nach 8 s ohne Brett steht weiter, nun für diesen Himmel
      } else if (!to || !skyTheme.holding) {
        // Der Himmel steht schon (er sprang), sein Brett aber nicht: kein falsches stehen lassen. Fehlt nach 8 s, in
        // denen es laden durfte, jedes Brett, wächst das Steinbrett ins Bild, sobald es selbst bereit ist (sonst lüde
        // three es beim ersten Zeichnen in einem Stück hoch)
        if (to) this.show(null);
        if (!this.ohne) {
          if (sceneLoop.started) this.fristStarten(); // erst mit der Szene, nicht schon, während die Seite lädt
        } else if (this.ohne.ms >= BOARD_NOTFALL_S * 1000 && this.stone.ready && this.stone.blendBereit) {
          if (z.entry !== this.stone) console.warn(`Brett von ${sky}: nach ${BOARD_NOTFALL_S} s nicht bereit, Steinbrett`);
          this.blend({ sky, entry: this.stone, notfall: true, frist: true }, false);
        }
      }
    }
    if (this.anteil < 1) {
      const p0 = this.p0;
      this.anteil = !this.mitHimmel ? Math.min(1, this.anteil + dt / skyTheme.fadeTime)
        : fading && p0 < 0.999 ? THREE.MathUtils.clamp((this.progress(this.to.sky) - p0) / (1 - p0), 0, 1) : 1;
      // ganz gewachsen: allein; ein bisheriges, dessen Stück es ganz bedeckt, abgeben
      if (this.anteil >= 1) this.show(this.to);
      else if (this.unter[0]?.bis <= this.anteil) {
        const a = this.anteil;
        this.show(this.to, this.unter.filter((l) => l.bis > a));
        this.anteil = a;
      }
    }
    this.render();
  },
  /**
   * Die Bretter zeigen: je Brett sein Stück von n (boardBlend) und sein Anteil (setFade), dazu der Kernquader (beim
   * Überblenden der Schnitt aller gezeigten; wächst eines aus dem Nichts, keiner)
   */
  render() {
    const to = this.to, ganz = this.anteil >= 1 && !this.unter.length;
    // Stücke von innen nach aussen: to bis anteil, dann jedes bisherige bis zu seinem bis
    const stuecke = [];
    let rand = 0;
    if (to) {
      stuecke.push([to.entry, 0, ganz ? 1 : this.anteil]);
      rand = ganz ? 1 : this.anteil;
      for (const l of this.unter) {
        if (l.bis <= rand) continue;
        const letztes = stuecke.at(-1);
        if (letztes[0] === l.entry) letztes[2] = l.bis; // gleiches Brett: ein Stück
        else stuecke.push([l.entry, rand, l.bis]);
        rand = l.bis;
      }
    }
    const front = to && stuecke[0][2] < 1
      ? [this.anteil, Math.min(1, this.anteil * 6, (1 - this.anteil) * 6) * 1.6] : null;
    for (const e of this.built.values()) {
      if (!e.board) continue;
      const meine = stuecke.filter((s) => s[0] === e).map((s) => [s[1], s[2]]);
      e.board.setFade(meine.reduce((a, [von, bis]) => a + bis - von, 0));
      if (meine.length) e.blend.set(meine, e === to.entry ? front : null);
    }
    const lo = boardCoreUniforms.uCoreLo.value, hi = boardCoreUniforms.uCoreHi.value;
    if (to && rand >= 1) {
      lo.set(-Infinity, -Infinity, -Infinity);
      hi.set(Infinity, Infinity, Infinity);
      for (const [e] of stuecke) {
        const core = this.types[e.type].core;
        lo.max(_boardCore.fromArray(core.lo));
        hi.min(_boardCore.fromArray(core.hi));
      }
      lo.addScalar(0.01);
      hi.addScalar(-0.01);
    }
    if (!to || rand < 1 || lo.x > hi.x || lo.y > hi.y || lo.z > hi.z) hi.copy(lo.set(0, -1e4, 0)); // keiner: weit unten
  },
  /** spiegelnde Oberflächen der gezeigten Bretter (renderReflection blendet beim Spiegeln alle aus; leer: keines) */
  get mirrors() {
    _boardMirrors.length = 0;
    for (const e of this.gezeigt) {
      const m = e.board?.mirror;
      if (m && e.board.group.visible && !_boardMirrors.includes(m)) _boardMirrors.push(m);
    }
    return _boardMirrors;
  },
  /** Textur im Stand ihrer Daten auf der Grafikkarte */
  onGpu(t) { return t.version > 0 && renderer.properties.get(t).__version === t.version; },
  /**
   * Testschnittstelle (__prisma.brett): himmel (id des Himmels, dessen Brett zu sehen ist, beim Überblenden des neuen;
   * null: keines), art, bereit (berechnet und hochgeladen), von (beim Überblenden der Himmel des bisherigen, von dem es
   * ausging, sonst null; null auch, wenn es aus dem Nichts wächst), anteil (des neuen, 0 … 1; 1 ohne Überblenden),
   * notfall (das Steinbrett steht für eines, das scheiterte oder nach 8 s nicht bereit war), stuecke (je gezeigtem Brett
   * [Himmel, Art, von, bis] seines Stücks von n, von innen nach aussen; Proben)
   */
  info() {
    const to = this.to;
    let rand = this.anteil;
    const stuecke = to ? [[to.sky, to.entry.type, 0, this.anteil]] : [];
    for (const l of this.unter) if (l.bis > rand) { stuecke.push([l.sky, l.entry.type, rand, l.bis]); rand = l.bis; }
    return { himmel: to?.sky ?? null, art: to?.entry.type ?? null, bereit: !!to?.entry.ready, von: this.from?.sky ?? null,
      anteil: this.anteil, notfall: !!to?.notfall, stuecke };
  },
};
boardTheme.stone = boardTheme.acquire(); // bleibt immer gebaut: Milchstrasse, Sonnensystem und der Rückfall brauchen es

// ?sky=forest: diesen Hintergrund zeigen statt dem der Welt (Tests); prisma.sky liest das Spiel nicht mehr
// (Entscheid 26). Erst hier: set bereitet auch das Brett des Hintergrunds vor (boardTheme)
const urlSky = new URLSearchParams(location.search).get('sky');
if (skyTheme.order.includes(urlSky)) skyTheme.current = urlSky;
skyTheme.set(skyTheme.current, false);

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  boardReflection: () => boardReflection, boardTheme: () => boardTheme, reflector: () => reflector,
  shockUniforms: () => shockUniforms, spiegelHimmel: () => spiegelHimmel, stoneBoard: () => stoneBoard,
});

export {
  boardReflection, boardTheme, reflector, reflLodShift, SHOCK_REST_S, SHOCK_SPEED, shockClock, shockUniforms, urlSky,
};
