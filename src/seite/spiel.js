// Spiel und Oberfläche (Ticket 04 von .scratch/umbau/, bis dahin das dritte Skript in index.html): Kamera,
// Elemente, Strahlen, Eingabe, Ton, Levelfluss, Oberfläche, Geschichte, Hauptschleife und Seitenstart.
//
// Seitenstart in Stücken (Ticket 10 der Leistung): Bis Ticket 04 des Umbaus waren die Teile der Seite drei klassische
// Skripte, die der Browser in eigenen Aufgaben übersetzte und startete. Als Module laufen sie in einer; darum wartet
// dieses Modul zuerst auf eine neue Aufgabe (await auf oberster Ebene), an derselben Stelle wie früher die Grenze der
// Skripte. Die Module laufen in der Reihenfolge ihrer Teile wie früher: Jedes importiert zuerst das vorherige (auch nur
// dafür), src/main.ts das letzte. Beim Laden ruft ein Teil nichts aus einem späteren auf.
import {
  arbeit, background, bloomPass, boardReflection, boardTheme, brushPass, buildEnvironment, camera, compileParallel,
  composer, createBrushedTexture, DIAG, ENV_ROOM, finalPass, hemi, keyLight, LAYER_NO_REFLECT,
  makeMirrorStreakTexture, markSceneReady, markShadowsDirty, NEXT_FRAME, nextFrame, reflector, reflLodShift, renderer,
  REST_STEPS, ruhe, RUHE_OHNE_START, scene, sceneLoop, SHOCK_REST_S, SHOCK_SPEED, shockClock, shockUniforms, skyTheme,
  sliced, stars, starsFromSin, updateSky, urlSky,
} from './darstellung.js';
import {
  APP_VERSION, BOARD, CELL, FIXED_TIME, GRID, IS_MOBILE, LOOK, phasenZufall, PLATE, PLATE_RIM, QUALITY,
} from './konfiguration.js';
import { mulberry32 } from '../zufall.js';
import {
  AXES, bildrate, bildrateGrund, COLORS, createBoard, dirToRotationY, geraeteText, isRotatable, LEVELS, LEVELS_3D,
  MIRROR_HALF_WIDTH, mod8, NEBENBEI, pickTapped, RUHE_NACH_MS, ruhetaktAus, ruhtJetzt, schrittErfuellt,
  schrittErlaubt, schrittGeste, schrittZellen, STORY_LEVELS, traceBeams, TUTORIAL_COUNT, zelleVon,
} from '../logik.js';
import { HALL_SECONDS, hallImpulse } from '../hall.js';
import { neueAufgabe } from './aufgabe.ts';
import { alsGlobal } from './testschnittstelle.ts';

await neueAufgabe();

/* =====================================================================
   KAMERA — schräg von oben, schwebt sanft, frei ums Feld drehbar (Neigung begrenzt)
   ===================================================================== */

const cameraRig = {
  lead: 0.35,             // Blickpunkt so weit vor der Feldmitte (zur Kamera hin)
  target: new THREE.Vector3(),
  baseTheta: 0,           // Azimut
  basePhi: 0.86,          // Winkel von der Senkrechten
  userTheta: 0, userPhi: 0,
  goalTheta: 0, goalPhi: 0, // goalTheta bleibt in −π … π (dragCamera)
  limitsPhiUp: 0.22,      // höchstens so viel steiler als die Ausgangsansicht
  // Flachster Blick (von der Senkrechten, ≈ 80°, in jedem Bildformat): Die Skybox ist bis über den Horizont zu sehen,
  // das Feld noch von oben. Im Breitformat endet das Bild oben knapp unter dem Rand der HD-Streifen (10° über dem
  // Horizont, SKYBOX); flacher stünde die Platte als schwarze Wand im Bild.
  phiMax: 1.4,
  radius: 18,             // Abstand der Ausgangsansicht; gedreht bleibt er gleich (ein Zoom pumpte, siehe PLAN 2.18)
  // Zoom von Hand (Mausrad, zwei Finger): Faktor auf radius, nur ein wenig näher heran oder weiter weg
  userZoom: 1, goalZoom: 1,
  zoomMin: 0.8, zoomMax: 1.25,
  homing: null,           // Rückflug zur Ausgangsansicht beim Levelwechsel (cameraGoHome)
  cube: 0,                // Kantenlänge der Grundfläche im Würfel-Level, sonst 0 (loadLevel)
  cubeHeight: 0,          // seine Zahl der Ebenen
  lift: 0,                // Höhe des Blickpunkts (Würfel: seine Mitte)
  zoom: 1,                // Abstandsfaktor (Würfel: CUBE.cameraZoom)
  tilt: 0,                // zusätzliche Neigung (Würfel: CUBE.cameraTilt, flacher – die Höhe wird lesbar)
  turn: 0,                // zusätzlicher Azimut (Würfel: CUBE.cameraTurn, schräg auf eine Kante)
  wide: 1,                // 0 = Hochformat … 1 = Querformat (fitCameraDistance)
  settling: 0,            // Abstand aller weich nachgeführten Werte zu ihrem Ziel (updateCamera, sceneLoop)
  // Halt vor dem Land (cameraStop): so viel weiter ist das Sichtfeld gerade (1: wie sonst). Solange der Halt greift,
  // setzt updateCamera es jedes Bild aus dem Format (kameraSichtfeld), auch über story.sichtfeld hinweg; lässt er los,
  // einmal zurück aufs Format, danach gehört es wieder dem Format und der Geschichte
  stopWide: 1,
  stopFovMax: 100,        // Grad: weiter nie, auch wenn das Brett dann nicht mehr ganz ins Bild passt
};

/**
 * Halt vor dem Land (Wunsch des Nutzers vom 09.11.2026: am Strand kam die Kamera herausgezoomt bis hinter die Palmen):
 * camera.stops der Skybox (skybox.json) sind Grenzen [dx, dz, weit]: In der waagrechten Richtung (dx, dz) steht die
 * Kamera höchstens weit m von der Mitte des Bretts. Liegt ihr Platz dahinter, rückt sie auf ihrem Strahl zum Blickpunkt
 * heran, bis sie an der Grenze steht (höchstens auf ein Zehntel des Abstands); der Blick bleibt derselbe. Zurück: der
 * Faktor, um den sie näher steht (1: frei).
 * top (camera.top): ebenso eine Decke, höchstens so hoch über der Platte (Eishöhle: auf dem Handy stand die Kamera im
 * Würfel steil von oben über dem Gewölbe und sah es von aussen).
 * target: Blickpunkt, dir: Richtung vom Blickpunkt zur Kamera (Einheitsvektor), r: Abstand ohne Halt.
 */
function cameraStop(stops, target, dir, r, top) {
  let k = 1;
  for (const [dx, dz, weit] of stops ?? []) {
    const len = Math.hypot(dx, dz), out = (dir.x * dx + dir.z * dz) / len;
    if (out <= 1e-6) continue; // die Kamera entfernt sich nicht in diese Richtung
    const frei = (weit - (target.x * dx + target.z * dz) / len) / out;
    k = Math.min(k, Math.max(frei, 0.1 * r) / r);
  }
  if (top !== undefined && dir.y > 1e-6) k = Math.min(k, Math.max((top - target.y) / dir.y, 0.1 * r) / r);
  return k;
}
const _stopDir = new THREE.Vector3();

function fitCameraDistance() {
  // Spielfeld soll in Breite und Höhe sicher ins Bild passen
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const tanV = Math.tan(vfov / 2);
  const tanH = tanV * camera.aspect;
  // Hochformat: steiler von oben – das Feld nutzt die Höhe besser, und die Vorderkante wird
  // perspektivisch weniger breit, sodass weniger Rand nötig ist (grössere Zellen zum Tippen).
  const wide = THREE.MathUtils.clamp((camera.aspect - 0.5) / 0.8, 0, 1);
  cameraRig.wide = wide;
  const halfW = PLATE * THREE.MathUtils.lerp(0.52, 0.56, wide);
  const halfH = PLATE * 0.42;
  cameraRig.radius = Math.max(halfW / tanH, halfH / tanV, 14);
  cameraRig.basePhi = THREE.MathUtils.lerp(0.46, 0.86, wide);
  // Neigung gilt gegen basePhi: Ändert sich das Fenster, bleibt sie in ihren Grenzen (nie flacher als phiMax, im Würfel
  // auch nie steiler als CUBE.phiMin)
  const { up, down } = phiLimits();
  const clampPhi = (p) => THREE.MathUtils.clamp(p, -up, down);
  cameraRig.goalPhi = clampPhi(cameraRig.goalPhi);
  cameraRig.userPhi = clampPhi(cameraRig.userPhi);
  if (cameraRig.homing) cameraRig.homing.phi = clampPhi(cameraRig.homing.phi);
  updateSky(wide);
}

/**
 * Das Hauptlicht kreist mit der Kamera (ohne ihr Schweben): So sieht das Feld von jeder Seite aus wie entworfen.
 * Ein festes Licht stünde von hinten gesehen gegenüber und spiegelte sich grell im polierten Stein.
 */
const keyLightHome = keyLight.position.clone();
const Y_AXIS = new THREE.Vector3(0, 1, 0);
let keyLightTheta = 0;
function orbitKeyLight(theta) {
  if (Math.abs(theta - keyLightTheta) < 1e-4) return; // Schatten nur neu berechnen, wenn das Licht wandert
  keyLightTheta = theta;
  keyLight.position.copy(keyLightHome).applyAxisAngle(Y_AXIS, theta);
  markShadowsDirty();
}

/** Beim Levelwechsel: in einem Bogen auf kürzestem Weg zurück zur Ausgangsansicht. */
function cameraGoHome() {
  const theta = cameraRig.goalTheta, phi = cameraRig.goalPhi, zoom = cameraRig.goalZoom;
  if (Math.abs(theta) + Math.abs(phi) + Math.abs(zoom - 1) < 1e-3) return;
  cameraRig.homing = { theta, phi, zoom, t: 0, duration: 0.8 + 0.25 * Math.abs(theta) };
}

function updateCamera(t, dt) {
  const h = cameraRig.homing;
  if (h) {
    h.t = Math.min(1, h.t + dt / h.duration);
    const e = h.t < 0.5 ? 4 * h.t ** 3 : 1 - (2 - 2 * h.t) ** 3 / 2; // ease-in-out
    cameraRig.goalTheta = h.theta * (1 - e);
    cameraRig.goalPhi = h.phi * (1 - e);
    cameraRig.goalZoom = 1 + (h.zoom - 1) * (1 - e);
    if (h.t >= 1) cameraRig.homing = null;
  }
  const k = 1 - Math.pow(0.00002, dt); // Zeitkonstante ≈ 0.09 s: weich, aber nicht träge
  cameraRig.userTheta += (cameraRig.goalTheta - cameraRig.userTheta) * k;
  cameraRig.userPhi += (cameraRig.goalPhi - cameraRig.userPhi) * k;
  cameraRig.userZoom += (cameraRig.goalZoom - cameraRig.userZoom) * k;

  // Würfel-Level: Blick auf die Würfelmitte, etwas weiter weg (weich übergeblendet, auch beim Levelwechsel)
  const cube = cameraRig.cube;
  const lift = cube ? cameraRig.cubeHeight * CELL / 2 : 0;
  cameraRig.lift += (lift - cameraRig.lift) * k;
  // Hochformat: Das 2D-Feld füllt die Breite, der schmalere Würfel darf näher heran
  const zoom = cube ? THREE.MathUtils.lerp(CUBE.cameraZoomNarrow, CUBE.cameraZoom, cameraRig.wide) * cube / CUBE.cameraSize : 1;
  cameraRig.zoom += (zoom - cameraRig.zoom) * k;
  const tilt = cube ? CUBE.cameraTilt : 0, turn = cube ? CUBE.cameraTurn : 0;
  cameraRig.tilt += (tilt - cameraRig.tilt) * k;
  cameraRig.turn += (turn - cameraRig.turn) * k;
  // wie weit die Kamera noch von ihrem Ziel ist (sceneLoop: hinter der Bühne ruht die Schleife erst, wenn sie steht)
  const c = cameraRig;
  c.settling = Math.abs(c.goalTheta - c.userTheta) + Math.abs(c.goalPhi - c.userPhi) + Math.abs(c.goalZoom - c.userZoom)
    + Math.abs(lift - c.lift) + Math.abs(zoom - c.zoom) + Math.abs(tilt - c.tilt) + Math.abs(turn - c.turn);

  const theta = cameraRig.baseTheta + cameraRig.turn + cameraRig.userTheta + Math.sin(t * 0.13) * 0.035;
  const phi = cameraRig.basePhi + cameraRig.tilt + cameraRig.userPhi + Math.sin(t * 0.21 + 1.3) * 0.018;
  const r = cameraRig.radius * cameraRig.zoom * cameraRig.userZoom * (1 + Math.sin(t * 0.17 + 0.4) * 0.006);

  cameraRig.target.set(cameraRig.lead * Math.sin(theta), cameraRig.lift, cameraRig.lead * Math.cos(theta));
  _stopDir.set(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta));
  // Halt vor dem Land: näher heran und das Sichtfeld so viel weiter, dass das Brett auf der Höhe des Blickpunkts
  // gleich gross im Bild bleibt (die nahe Kante wird grösser). Nach den Himmeln, die gerade zu sehen sind, je mit ihrem
  // Anteil: Beim Wechsel der Welt (Reise der Geschichte) gleiten Kamera und Sichtfeld mit dem Überblenden, in beide
  // Richtungen, statt in einem Bild zu springen
  let stop = 1;
  for (const e of skyTheme.entries) {
    const w = skyTheme.weight[e.id];
    if (w > 0 && e.camera) {
      stop -= w * w * (3 - 2 * w) * (1 - cameraStop(e.camera.stops, cameraRig.target, _stopDir, r, e.camera.top));
    }
  }
  camera.position.copy(cameraRig.target).addScaledVector(_stopDir, r * stop);
  if (stop < 1 || cameraRig.stopWide !== 1) {
    const fov0 = kameraSichtfeld(camera.aspect), half = Math.tan(THREE.MathUtils.degToRad(fov0 / 2));
    const fov = Math.min(cameraRig.stopFovMax, THREE.MathUtils.radToDeg(2 * Math.atan(half / stop)));
    cameraRig.stopWide = stop < 1 ? fov / fov0 : 1;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }
  camera.lookAt(cameraRig.target);
  // Geschichte: in den Zwischenszenen schaut die Kamera vom Brett hinauf in den Himmel (story.gaze 0 … 1)
  if (story.gaze > 0) {
    const d = _gazeLook.copy(cameraRig.target).sub(camera.position).normalize().lerp(story.gazeDir, story.gaze).normalize();
    camera.lookAt(d.add(camera.position));
    // Ende des Finales: der Wagen rechts der Mitte und doch aufrecht (story.wagenEnde; den Horizont sieht man dort nicht)
    if (story.seit) camera.rotateY(story.seit);
  }
  orbitKeyLight(cameraRig.baseTheta + cameraRig.userTheta);
}
const _gazeLook = new THREE.Vector3();

// Ziehen dreht die Kamera, Mausrad und zwei Finger zoomen; ausgewertet im Eingabemodul (INTERAKTION).
const drag = { active: false };
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

/* =====================================================================
   SPIELELEMENTE — 3D-Modelle für Quelle, Spiegel und Ziel
   ===================================================================== */

const BEAM_Y = 0.42; // Höhe, auf der die Strahlen über der Platte laufen
const HALF_GRID = (GRID - 1) / 2;

/** Rasterkoordinate → Weltposition (Zellmitte auf der Platte). */
function gridToWorld(x, z, y = 0, target = new THREE.Vector3()) {
  return target.set((x - HALF_GRID) * CELL, y, (z - HALF_GRID) * CELL);
}

/**
 * Würfel-Level: Rasterpunkt (auch Zwischenpunkte von Strahlen) → Welt. Die Zellen liegen mittig im Würfel, der auf
 * der Platte steht: die unterste Zellmitte eine halbe Zelle über der Platte (CUBE_FLOOR), jede weitere eine Zelle
 * höher – so passen auch senkrechte Ringe der untersten Ebene (Radius mit Marken 0.58) über die Platte.
 * Waagrecht mittig wie das 2D-Feld.
 */
const CUBE_FLOOR = CELL / 2;
function cubeToWorld(x, y, z, size, target = new THREE.Vector3()) {
  const half = (size - 1) / 2;
  return target.set((x - half) * CELL, CUBE_FLOOR + y * CELL, (z - half) * CELL);
}

/** Strahlpunkt eines Abschnitts oder Ereignisses in Weltkoordinaten (2D: auf Strahlhöhe). */
function beamPointToWorld(x, y, z, target) {
  return y === undefined ? gridToWorld(x, z, BEAM_Y, target) : cubeToWorld(x, y, z, game.board.size, target);
}

/** Normale aus der Logik als Weltvektor (2D: [nx, nz], Würfel: [nx, ny, nz]). */
const normalToWorld = (n, target = new THREE.Vector3()) => (n.length === 3 ? target.fromArray(n) : target.set(n[0], 0, n[1]));

/**
 * Würfel-Level: Lage eines Elementmodells. Die Modelle sind für die 2D-Platte gebaut (Sockel unten, Optik auf
 * Strahlhöhe, Drehung um ihr lokales y). Die Basis (u, a, v) der Drehachse (AXES) dreht lokales x, y, z in die
 * Drehebene; der Ursprung liegt so, dass die Optik in der Zellmitte sitzt.
 */
const _axisBasis = new THREE.Matrix4();
function placeInCube(obj, el, size) {
  const { u, a, v } = AXES[el.axis];
  _axisBasis.makeBasis(new THREE.Vector3(...u), new THREE.Vector3(...a), new THREE.Vector3(...v));
  obj.quaternion.setFromRotationMatrix(_axisBasis);
  cubeToWorld(el.x, el.y, el.z, size, obj.position).addScaledVector(new THREE.Vector3(...a), -BEAM_Y);
}

/**
 * 0 … 1: wie stark eine Farbe gedämpft werden soll, weil sie hell ist. Helle Farben (Weiss, Gelb,
 * Cyan, Grün) überschreiten die Bloom-Schwelle viel stärker als Rot, Blau oder Magenta.
 */
function brightTame(c) {
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  return THREE.MathUtils.smoothstep(lum, 0.35, 0.95);
}

// Linear (THREE.Color), satt: Nebenkanäle nahe 0. Früher lagen sie bei 0.2 (im Bild Mint, Lachs, Lavendel), und es war
// schwer zu sehen, welche Farbe wohin muss (Wunsch 10.11.2026). Cyan liegt näher bei Blau (G 0.55): mit mehr Grün
// bleichte die Tonwertabbildung (ACES) seinen Kern fast weiss. Gleich dick wirken die Strahlen über BEAM_EVEN.
const COLOR_RGB = {
  1: new THREE.Color(1.0, 0.035, 0.02),  // Rot
  2: new THREE.Color(0.04, 1.0, 0.07),   // Grün
  3: new THREE.Color(1.0, 0.7, 0.0),     // Gelb
  4: new THREE.Color(0.03, 0.13, 1.0),   // Blau
  5: new THREE.Color(1.0, 0.03, 0.9),    // Magenta
  6: new THREE.Color(0.0, 0.55, 1.0),    // Cyan
  7: new THREE.Color(1.0, 0.97, 0.92),   // Weiss (minimal warm)
};

const brushedTex = createBrushedTexture(256);
brushedTex.repeat.set(2, 2);

const MAT = {
  metalDark: new THREE.MeshStandardMaterial({
    color: 0x2c2c33, metalness: 1, roughness: 0.42, roughnessMap: brushedTex, envMapIntensity: 1.1,
  }),
  metalBright: new THREE.MeshStandardMaterial({
    color: 0xb9bac4, metalness: 1, roughness: 0.3, roughnessMap: brushedTex, envMapIntensity: 1.25,
  }),
  mirror: new THREE.MeshStandardMaterial({
    color: 0xf2f4ff, metalness: 1, roughness: 0.03, envMap: null, envMapIntensity: 1.7, // envMap: seitenstart
    emissive: 0xdfe6ff, emissiveIntensity: 0.22, emissiveMap: makeMirrorStreakTexture(),
  }),
  // Rahmen des Spiegels: schwarz lackiert, leichter Glanz
  frameBlack: new THREE.MeshStandardMaterial({ color: 0x0a0a0d, metalness: 0.3, roughness: 0.32, envMapIntensity: 0.9 }),
  stone: new THREE.MeshStandardMaterial({
    color: 0x111117, metalness: 0, roughness: 0.38, envMapIntensity: 0.7,
  }),
  lens: new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.97, 0.92).multiplyScalar(5.5) }),
};

function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Würfel-Level (Prototyp): Die Elemente schweben, Sockel passen dort nicht. Statt des Drehtellers liegt ein Ring in
 * der Drehebene um das Element (mit 45°-Marken), zwei Achszapfen zeigen die Drehachse auch dann, wenn man den Ring
 * von der Kante sieht. Feste Elemente haben statt des eckigen Sockels einen eckigen Rahmen mit rotem Rand.
 * Alles in lokalen Koordinaten des 2D-Modells (lokal y = Drehachse, Optik auf BEAM_Y).
 */
const CUBE_MOUNT = { ring: 0.52, tube: 0.011, tick: 0.06, pin: [0.27, 0.44], frame: 0.98, bar: 0.03 };
const inCube = () => game.board?.dim === 3;

function makeCubeRing() {
  const g = new THREE.Group();
  const R = CUBE_MOUNT.ring;
  const ring = shadowed(new THREE.Mesh(new THREE.TorusGeometry(R, CUBE_MOUNT.tube, 8, 96), MAT.metalBright));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = BEAM_Y;
  g.add(ring);
  for (let i = 0; i < 8; i++) { // 45°-Marken, nach aussen
    const a = i * Math.PI / 4;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(CUBE_MOUNT.tick, 0.014, 0.014), MAT.metalBright);
    tick.position.set(Math.cos(a) * (R + CUBE_MOUNT.tick / 2), BEAM_Y, Math.sin(a) * (R + CUBE_MOUNT.tick / 2));
    tick.rotation.y = -a;
    g.add(tick);
  }
  const [p0, p1] = CUBE_MOUNT.pin;
  for (const s of [-1, 1]) { // Achszapfen über und unter dem Element
    const pin = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, p1 - p0, 12), MAT.metalBright));
    pin.position.y = BEAM_Y + s * (p0 + p1) / 2;
    const knob = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), MAT.metalBright));
    knob.position.y = BEAM_Y + s * p1;
    g.add(pin, knob);
  }
  return g;
}

function makeCubeFrame() {
  const g = new THREE.Group();
  const s = CUBE_MOUNT.frame, t = CUBE_MOUNT.bar, e = s / 2 - t / 2, w = FIXED_EDGE.width;
  const { edgeMat } = fixedBase();
  for (const [bw, bd, x, z, along] of [[s, t, 0, -e, 'x'], [s, t, 0, e, 'x'], [t, s - 2 * t, -e, 0, 'z'], [t, s - 2 * t, e, 0, 'z']]) {
    const bar = shadowed(new THREE.Mesh(new THREE.BoxGeometry(bw, t, bd), MAT.metalDark));
    bar.position.set(x, BEAM_Y, z);
    // roter Rand: schmaler Streifen mitten im Profil, schaut oben und unten knapp heraus
    const edge = new THREE.Mesh(along === 'x' ? new THREE.BoxGeometry(bw, t + 0.006, w) : new THREE.BoxGeometry(w, t + 0.006, bd), edgeMat);
    edge.position.copy(bar.position);
    edge.raycast = () => {};
    edge.layers.set(LAYER_NO_REFLECT);
    g.add(bar, edge);
  }
  return g;
}

/** Runder Metallsockel (Drehteller), auf dem jedes drehbare Element steht. */
function makePedestal(radius = 0.34) {
  if (inCube()) return makeCubeRing();
  const g = new THREE.Group();
  const disk = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + 0.02, 0.06, 48), MAT.metalDark));
  disk.position.y = 0.03;
  const rim = shadowed(new THREE.Mesh(new THREE.TorusGeometry(radius - 0.03, 0.008, 8, 64), MAT.metalBright));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.062;
  g.add(disk, rim);
  return g;
}

/**
 * Fester Sockel für alles, was sich nicht drehen lässt (Quelle, Ziel, Filter, fester Spiegel; auch ein festes Prisma
 * oder ein fester Kombinator): eckiger, dunkler Steinblock mit schmalem rot leuchtendem Rand – kein Drehteller.
 * Formensprache: rund mit weissem Leuchtring = drehbar, eckig mit rotem Rand = fest (auf dem Handy waren die feinen
 * Drehmarken unsichtbar).
 */
const FIXED_BASE_SIZE = 0.66;
const FIXED_BASE_TOP = 0.07;  // Oberkante des Steinblocks (Teller: 0.06) – Ringe und Lichthöfe liegen knapp darüber
// Randleiste: feine Linie (halb so breit wie der Leuchtring der drehbaren Elemente), flach knapp über dem Block;
// Oberkante 0.079 – knapp über dem Lichthof des Ziels (FIXED_BASE_TOP + 0.008), sonst flimmert sein Rand.
// Gedämpftes Rot weit unter der Bloom-Schwelle: ruhig und unaufdringlich. Wenig Grün- und Blauanteil – das ACES im
// finalPass zieht helles Rot sonst ins Orange.
const FIXED_EDGE = { width: 0.017, height: 0.010, inset: 0.012, color: new THREE.Color(0.42, 0.06, 0.07) };
let fixedBaseParts = null; // Geometrien und Material, geteilt von allen festen Sockeln (beim ersten Gebrauch gebaut)
function fixedBase() {
  if (fixedBaseParts) return fixedBaseParts;
  const size = FIXED_BASE_SIZE, { width: t, height: h, inset } = FIXED_EDGE;
  const blockGeo = new THREE.BoxGeometry(size, FIXED_BASE_TOP, size).translate(0, FIXED_BASE_TOP / 2, 0);
  const frameGeo = new THREE.BoxGeometry(size + 0.02, 0.02, size + 0.02).translate(0, 0.01, 0);
  // eckiger Rand oben, knapp innerhalb der Blockkante: macht die Form "eckig = fest" auch auf dem dunklen Boden lesbar
  const outer = size - 2 * inset, e = outer / 2 - t / 2, y = FIXED_BASE_TOP - 0.001 + h / 2;
  const edgeGeo = mergeGeometries([[outer, t, 0, -e], [outer, t, 0, e], [t, outer - 2 * t, -e, 0], [t, outer - 2 * t, e, 0]]
    .map(([w, d, x, z]) => new THREE.BoxGeometry(w, h, d).translate(x, y, z)));
  const edgeMat = new THREE.MeshBasicMaterial({ color: FIXED_EDGE.color, fog: false });
  for (const geo of [blockGeo, frameGeo, edgeGeo]) SHARED_GEOMETRIES.add(geo);
  SHARED_MATERIALS.add(edgeMat);
  fixedBaseParts = { blockGeo, frameGeo, edgeGeo, edgeMat };
  return fixedBaseParts;
}
/** Drei Draw-Calls: Block, Rahmen, Randleiste (alle Geometrien geteilt). */
function makeFixedBase() {
  if (inCube()) return makeCubeFrame();
  const { blockGeo, frameGeo, edgeGeo, edgeMat } = fixedBase();
  const g = new THREE.Group();
  g.add(shadowed(new THREE.Mesh(blockGeo, MAT.stone)), shadowed(new THREE.Mesh(frameGeo, MAT.metalDark)));
  // Leuchtrand nicht in der Bodenspiegelung (wie der Leuchtring der drehbaren Elemente)
  const edge = new THREE.Mesh(edgeGeo, edgeMat);
  edge.raycast = () => {};
  edge.layers.set(LAYER_NO_REFLECT);
  edge.userData.sockelRand = true; // makeRefusing: das Element weigert sich beim Antippen
  g.add(edge);
  return g;
}

/** Lichtquelle: schlanker Scheinwerfer auf einer Säule, Linse strahlt in +x. */
function makeSource(el) {
  const root = new THREE.Group();
  root.add(makeFixedBase());

  const head = new THREE.Group();
  head.rotation.y = dirToRotationY(el.dir);
  root.add(head);

  const column = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, BEAM_Y - 0.05, 24), MAT.metalBright));
  column.position.y = 0.06 + (BEAM_Y - 0.05) / 2 - 0.02;
  if (!inCube()) head.add(column);

  const housing = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.15, 0.5, 40), MAT.metalDark));
  housing.rotation.z = Math.PI / 2;
  housing.position.set(-0.04, BEAM_Y, 0);
  head.add(housing);

  // Kühlrippen
  for (let i = 0; i < 4; i++) {
    const fin = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 40), MAT.metalBright));
    fin.rotation.y = Math.PI / 2;
    fin.position.set(-0.24 + i * 0.07, BEAM_Y, 0);
    head.add(fin);
  }

  const bezel = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 12, 48), MAT.metalBright));
  bezel.rotation.y = Math.PI / 2;
  bezel.position.set(0.21, BEAM_Y, 0);
  head.add(bezel);

  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.11, 40), MAT.lens.clone());
  lens.rotation.y = Math.PI / 2;
  lens.position.set(0.212, BEAM_Y, 0);
  head.add(lens);

  root.userData.lens = lens;
  return root;
}

/** Spiegel: schmaler schwarzer Rahmen, silbrige Fläche mit Lichtstreifen, auf Drehteller mit 45°-Markierungen (fest: Steinblock). */
function makeMirror(el) {
  const root = new THREE.Group();
  root.add(el.fixed ? makeFixedBase() : makePedestal(0.4));

  // Gravierte 45°-Marken auf dem Teller (nur drehbare Spiegel – feste stehen auf dem eckigen Sockel)
  for (let i = 0; i < 8 && !el.fixed && !inCube(); i++) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.004, 0.012), MAT.metalBright);
    const a = i * Math.PI / 4;
    tick.position.set(Math.cos(a) * 0.32, 0.063, Math.sin(a) * 0.32);
    tick.rotation.y = -a;
    root.add(tick);
  }

  const pivot = new THREE.Group();
  pivot.rotation.y = dirToRotationY(el.rot);
  root.add(pivot);

  const W = MIRROR_HALF_WIDTH * 2 * CELL, H = 0.6, T = 0.03, P = 0.034; // Breite, Höhe, Rahmentiefe, Profil
  const bottom = BEAM_Y - H / 2;

  const frame = new THREE.Group();
  const bar = (w, h, x, y) => {
    const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, T), MAT.frameBlack));
    m.position.set(x, y, 0);
    frame.add(m);
  };
  bar(W, P, 0, bottom + P / 2);
  bar(W, P, 0, bottom + H - P / 2);
  bar(P, H, -W / 2 + P / 2, bottom + H / 2);
  bar(P, H, W / 2 - P / 2, bottom + H / 2);
  pivot.add(frame);

  const glass = shadowed(new THREE.Mesh(new THREE.BoxGeometry(W - P * 1.4, H - P * 1.4, 0.012), MAT.mirror));
  glass.position.y = bottom + H / 2;
  pivot.add(glass);

  // Zwei schlanke Stützen zum Teller
  for (const sx of inCube() ? [] : [-0.22, 0.22]) {
    const leg = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, bottom - 0.06, 12), MAT.frameBlack));
    leg.position.set(sx, 0.06 + (bottom - 0.06) / 2, 0);
    pivot.add(leg);
  }

  root.userData.pivot = pivot;
  root.userData.orient = (e) => { pivot.rotation.y = dirToRotationY(e.rot); };
  return root;
}

/** Brillantschliff als Lathe-Profil (unten Spitze, oben Tafel), facettiert durch flatShading. */
function makeGemGeometry(radius) {
  const pts = [
    new THREE.Vector2(0.0, -0.95),
    new THREE.Vector2(0.62, -0.28),
    new THREE.Vector2(1.0, 0.0),
    new THREE.Vector2(1.0, 0.08),
    new THREE.Vector2(0.62, 0.42),
    new THREE.Vector2(0.0, 0.42),
  ].map(p => p.multiplyScalar(radius));
  const geo = new THREE.LatheGeometry(pts, 8);
  geo.computeVertexNormals();
  return geo;
}

/** Ziel: schwebender Edelstein in seiner Zielfarbe, mit Leuchtkern und glimmendem Ring. */
function makeTarget(el) {
  const root = new THREE.Group();
  root.add(makeFixedBase());
  const col = COLOR_RGB[el.color];
  const mask = el.color; // Farbmaske: Rot 1, Grün 2, Blau 4
  // Etwas sattere Variante der Strahlfarbe für den Stein (bei den satten Farben seit 10.11.2026 kaum ein Unterschied)
  const deep = new THREE.Color(col.r * col.r, col.g * col.g, col.b * col.b).lerp(col, 0.85);
  // Dunkle Farben (Blau, Rot) verwässern schnell: Mit viel Weiss und Schillern im Glas liest sich Blau neben
  // Weiss nur als „Weiss mit Blaustich“. Helle Farben vertragen mehr (und werden getroffen gedämpft, siehe litTame).
  const bt = brightTame(col);

  // Ring aus drei Bögen, ein fester Platz je Grundfarbe (Rot links, Grün rechts, Blau vorne; hinten offen, dort
  // verdeckt ihn der Stein). Es leuchten die Grundfarben, aus denen die Zielfarbe besteht: Blau ein Bogen, Cyan
  // zwei, Weiss drei. So ist die Farbe auch ohne Farbunterscheidung lesbar, und man sieht, woraus sie gemischt
  // wird. Kommt Licht an, zeigt jeder Bogen seine Grundfarbe: gebraucht und da = heller, fehlt = ruhig,
  // nicht gebraucht und da = flackert im leeren Platz (falsches Licht).
  const ringSegs = [];
  for (const p of [1, 2, 4]) {
    const on = (mask & p) !== 0;
    const seg = new THREE.Mesh(targetArcGeometry(), new THREE.MeshBasicMaterial({
      color: on ? COLOR_RGB[p].clone().multiplyScalar(TARGET_IDLE.ring) : TARGET_RING.offColor, toneMapped: false,
    }));
    // Bogen in der xy-Ebene drehen, dann flach legen: Winkel 90° zeigt zur Kamera (+z)
    seg.rotation.set(Math.PI / 2, 0, THREE.MathUtils.degToRad(TARGET_RING.slots[p] - TARGET_RING.arc / 2));
    seg.position.y = FIXED_BASE_TOP + 0.006;
    if (inCube()) { seg.position.y = BEAM_Y; seg.scale.setScalar(1.4); } // Würfel: um den Stein statt auf dem Sockel
    // In der Bodenspiegelung verdeckt ihn ohnehin das Spiegelbild des Sockels: dort nicht zeichnen
    seg.layers.set(LAYER_NO_REFLECT);
    root.add(seg);
    // arrive: Grundfarbe kommt sichtbar an (animiert 0..1). partial: Zusatzhelligkeit, wenn sie ankommt –
    // bei hellen Farben (Grün) gedämpft, sonst überstrahlt der Bogen schon vor dem Treffer.
    const partial = TARGET_RING.partial * (1 - 0.6 * brightTame(COLOR_RGB[p]));
    Object.assign(seg.userData, { primary: p, on, color: COLOR_RGB[p], partial, arrive: 0, arriveGoal: 0 });
    ringSegs.push(seg);
  }

  // Farbiger Lichthof auf dem Sockel: zeigt schon vor dem Treffer, welche Farbe das Ziel erwartet.
  const haloMat = new THREE.MeshBasicMaterial({
    map: spotTexture, color: col.clone().multiplyScalar(TARGET_IDLE.halo), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = inCube() ? BEAM_Y : FIXED_BASE_TOP + 0.008;
  halo.raycast = () => {};
  root.add(halo);

  // Bewusst ohne echte Transmission: die würde jedes Frame die ganze Szene ein zweites Mal rendern
  // (≈ ein Drittel der Frame-Zeit). Transparenz + Clearcoat + Iridescence + Leuchtkern wirken fast gleich.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: deep.clone().lerp(new THREE.Color(1, 1, 1), THREE.MathUtils.lerp(0.06, 0.3, bt)), // getönt, aber noch Glas
    metalness: 0, roughness: 0.04, ior: 2.0, specularIntensity: 1,
    transparent: true, opacity: 0.84,
    clearcoat: 1, clearcoatRoughness: 0.02,
    iridescence: THREE.MathUtils.lerp(0.15, 0.45, bt), iridescenceIOR: 1.8, // Schillern hellt dunkle Farben auf
    emissive: deep.clone(), emissiveIntensity: TARGET_IDLE.emissive,
    flatShading: true, envMapIntensity: 1.8,
  });
  // Kein Schattenwurf: der Stein dreht und schwebt, die Shadow-Map wird aber nur bei Änderungen
  // neu berechnet – und Transparenz kennt die Shadow-Map nicht (voll dunkler Schatten).
  const gem = new THREE.Mesh(makeGemGeometry(0.26), gemMat);
  gem.position.y = BEAM_Y;
  root.add(gem);

  // Opaker Leuchtkern: scheint durch den transparenten Stein.
  const coreMat = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(TARGET_IDLE.core) });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 0), coreMat);
  gem.add(core);

  root.userData.gem = gem;
  root.userData.core = core;
  root.userData.ringSegs = ringSegs;
  root.userData.halo = halo;
  root.userData.color = col;
  // Dunkle Farben (v. a. Blau) gehen sonst in den hellen Glanzlichtern unter: stärker selbst leuchten lassen.
  const lum = 0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b;
  // Helle Farben überschreiten die Bloom-Schwelle viel stärker: getroffen gedämpfter leuchten,
  // sonst wird der ganze Edelstein (v. a. Weiss) zum facettenlosen Fleck
  root.userData.litTame = 1 - 0.4 * bt;
  root.userData.emissiveTame = 1 - 0.65 * bt;
  root.userData.glowBoost = THREE.MathUtils.clamp(0.35 / Math.max(lum, 0.01), 1, 1.2);
  root.userData.hit = 0;        // animierter Zustand 0..1
  root.userData.hitGoal = 0;
  root.userData.wrong = 0;      // falsches Licht kommt an: animiert 0..1
  root.userData.wrongGoal = 0;
  root.userData.wrongMix = 0;
  root.userData.wrongColor = new THREE.Color();
  root.userData.flash = 0;      // kurzes Aufblitzen im Lösungsmoment (1 → 0)
  root.userData.phase = phasenZufall() * Math.PI * 2;
  root.userData.update = (t, dt) => updateTarget(root, t, dt);
  return root;
}

/** Leuchtstärken eines noch nicht getroffenen Ziels (getroffen kommt jeweils hit × … dazu). */
// Unter der Bloom-Schwelle bleiben, sonst kippt die Farbe im Tone Mapping ins Weisse.
const TARGET_IDLE = { core: 0.8, emissive: 0.15, ring: 0.7, halo: 0.12 };
/**
 * Farbring der Ziele: Radius (ausserhalb des Steins, Radius 0.26 – er schwebt höher und verdeckt von oben sonst die
 * Bögen; innerhalb des roten Sockelrands bei 0.30), Bogenmitte je Grundfarbe in Grad (0 = +x, 90 = zur Kamera; Rot
 * und Grün leicht nach vorne, damit sie auch im Hochformat neben dem Stein sichtbar bleiben), Bogenlänge, Dicke,
 * Farbe leerer Plätze und Zusatzhelligkeit eines gebrauchten Bogens, dessen Farbe schon ankommt.
 */
const TARGET_RING = {
  radius: 0.27, slots: { 1: 190, 2: 350, 4: 90 }, arc: 90, tube: 0.017,
  offColor: new THREE.Color(0.05, 0.05, 0.06), partial: 1.0,
};
let targetArcGeo = null;
/** Ein Bogen des Farbrings (geteilt von allen Zielen). */
function targetArcGeometry() {
  if (!targetArcGeo) {
    targetArcGeo = new THREE.TorusGeometry(TARGET_RING.radius, TARGET_RING.tube, 8, 32, THREE.MathUtils.degToRad(TARGET_RING.arc));
    SHARED_GEOMETRIES.add(targetArcGeo);
  }
  return targetArcGeo;
}

/** Ziel-Zustand weich nachführen (Glimmen ↔ hell leuchtend). */
function updateTarget(obj, t, dt) {
  const u = obj.userData;
  u.hit += (u.hitGoal - u.hit) * (1 - Math.pow(0.0005, dt));
  u.wrong += (u.wrongGoal - u.wrong) * (1 - Math.pow(0.002, dt));
  const h = u.hit, hl = h * u.litTame;
  u.flash *= Math.pow(0.04, dt);
  const f = u.flash;
  u.gem.scale.setScalar(1 + f * 0.28);
  u.gem.rotation.y = t * (0.25 + h * 0.6) + u.phase;
  u.gem.position.y = BEAM_Y + Math.sin(t * 1.1 + u.phase) * 0.018;
  const flicker = 1 + Math.sin(t * 13.0 + u.phase) * 0.03 * h;
  // Wartend atmet das Ziel langsam in seiner Farbe – es "fragt" nach Licht.
  const breathe = (1 - h) * (0.5 + 0.5 * Math.sin(t * 1.8 + u.phase));
  u.core.material.color.copy(u.color).multiplyScalar((TARGET_IDLE.core + breathe * 0.15 + hl * 6.9 + f * 14 * u.litTame) * flicker);
  u.gem.material.emissiveIntensity = (TARGET_IDLE.emissive + breathe * 0.05) * u.glowBoost + h * 1.3 * u.emissiveTame;
  u.halo.material.color.copy(u.color).multiplyScalar(TARGET_IDLE.halo + breathe * 0.05 + hl * 0.6 + f * 1.4);
  // Farbring: je Grundfarbe ein Bogen. Gebraucht: leuchtet, heller sobald seine Farbe ankommt (danach trägt hit).
  // Nicht gebraucht, kommt aber an: flackert unruhig im leeren Platz – z. B. "hier kommt zu viel Blau an".
  const ringLevel = TARGET_IDLE.ring + breathe * 0.1 + hl * 2.9 + f * 5;
  const unrest = 0.65 + 0.35 * Math.sin(t * 7.0 + u.phase) * Math.sin(t * 2.3);
  for (const seg of u.ringSegs) {
    const s = seg.userData;
    s.arrive += (s.arriveGoal - s.arrive) * (1 - Math.pow(0.002, dt));
    if (s.on) seg.material.color.copy(s.color).multiplyScalar(ringLevel + s.arrive * (1 - h) * s.partial);
    else seg.material.color.copy(TARGET_RING.offColor).lerp(_wrongTint.copy(s.color).multiplyScalar(TARGET_WRONG.ring * unrest), s.arrive);
  }
  // Falsche Farbe: Der Lichtfleck flackert zusätzlich in der Mischung, die ankommt; Stein und gebrauchte Bögen
  // zeigen weiter, welche Farbe gesucht ist.
  if (u.wrong > 0.002) u.halo.material.color.lerp(_wrongTint.copy(u.wrongColor).multiplyScalar(TARGET_WRONG.halo * unrest), u.wrong);
}
/** Ziel mit Licht der falschen Farbe: leerer Platz im Farbring und Lichtfleck (unter der Bloom-Schwelle). */
const TARGET_WRONG = { ring: 0.9, halo: 0.6 };
const _wrongTint = new THREE.Color();

/* ---------- Phase 4: Prisma, Farbfilter, Kombinator, Blocker ---------- */

/** Geschliffenes Glas ohne Transmission (zu teuer, siehe Edelstein); tiefen-neutral, damit Strahlen im Glas sichtbar bleiben. */
function makeGlassMaterial(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial(Object.assign({
    color, metalness: 0, roughness: 0.03, ior: 1.5, specularIntensity: 1,
    transparent: true, opacity: 0.42, depthWrite: false,
    clearcoat: 1, clearcoatRoughness: 0.02,
    iridescence: 0.7, iridescenceIOR: 1.35, iridescenceThicknessRange: [120, 700],
    flatShading: true, envMapIntensity: 2.2,
  }, opts));
}

/** Feine, helle Glaskanten: lassen den Schliff auch vor dunklem Grund erkennen. */
function glassEdges(geometry, opacity = 0.28) {
  const lines = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 20),
    new THREE.LineBasicMaterial({ color: 0xdfe6ff, transparent: true, opacity, depthWrite: false })
  );
  lines.renderOrder = 6; // nach dem Glas (renderOrder 5), sonst deckt es die Kanten ab
  lines.raycast = () => {};
  return lines;
}

/** Weicher Regenbogenverlauf (für das Spektralfenster des Prismas). */
function createSpectrumTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 32;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  ['#ff2a1e', '#ffb21e', '#f4ff3a', '#30ff6a', '#2ad8ff', '#3a5bff', '#a43aff'].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 32);
  // vertikal weich ausblenden
  const v = ctx.createLinearGradient(0, 0, 0, 32);
  v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.5, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 256, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}
const spectrumTexture = createSpectrumTexture();

/** Leuchtzustand eines Elements weich nachführen: aktiv, sobald die Strahlfront es erreicht. */
function activeColorOf(u) {
  let color = 0;
  for (const r of u.events || []) if (beamView.revealed(r, r.worldDist)) color |= r.ev.color;
  return color;
}
function easeToward(current, goal, dt, speed = 0.0005) {
  return current + (goal - current) * (1 - Math.pow(speed, dt));
}

/**
 * Zeichen des Prismas auf seinem Sockel (PLAN 1.3): hinten ein weisser Strich (Eingang), vorn drei Pfeilspitzen in Rot,
 * Grün und Blau, jede in Richtung ihres Strahls (refractInPrism: Rot rot − 1, Grün rot, Blau rot + 1; lokal liegt der
 * Austritt bei −z und Rot auf der Seite −x). Sie drehen mit und zeigen auch ohne Licht, wohin das Prisma die Farben
 * wirft; tritt eine Farbe aus, leuchtet ihr Pfeil heller (unter der Bloom-Schwelle). Die Pfeile liegen vor der
 * Bodenplatte des Prismas, sonst verdeckte diese sie von oben. Auf dem eckigen Steinsockel eines festen Prismas ist
 * weniger Platz als auf dem Drehteller (Radius 0.38): Dort sind sie kleiner und näher.
 */
const PRISM_MARKS = {
  fan: [{ color: 1, offset: -1 }, { color: 2, offset: 0 }, { color: 4, offset: 1 }],
  arrowAt: 0.3, arrowAtFixed: 0.27, arrowScaleFixed: 0.75,
  barAt: 0.35, barAtFixed: 0.31,
  plateY: 0.078, // über dem Drehteller samt Leuchtring (Oberkante 0.07)
  arrowIdle: 1.1, arrowLit: 0.8, barIdle: 0.75, barLit: 0.4,
};
let prismMarkParts = null; // Geometrien, geteilt von allen Prismen (beim ersten Gebrauch gebaut)
function prismMarkGeometries() {
  if (prismMarkParts) return prismMarkParts;
  const arrow = new THREE.ShapeGeometry(new THREE.Shape(
    [[0, 0.075], [0.075, -0.045], [0, -0.018], [-0.075, -0.045]].map(([x, y]) => new THREE.Vector2(x, y))
  )).rotateX(-Math.PI / 2); // Spitze nach −z
  const bar = new THREE.BoxGeometry(0.16, 0.008, 0.04);
  for (const geo of [arrow, bar]) SHARED_GEOMETRIES.add(geo);
  prismMarkParts = { arrow, bar };
  return prismMarkParts;
}
/** Gruppe der Zeichen (lokal wie das Prisma) und update(Farben, die austreten; Leuchten des Prismas; dt). */
function makePrismMarks(fixed) {
  const { arrow, bar } = prismMarkGeometries();
  const m = PRISM_MARKS;
  const y = fixed ? FIXED_BASE_TOP + 0.012 : m.plateY; // Steinsockel: über der Randleiste (Oberkante 0.079)
  const group = new THREE.Group();
  const flat = (geo, mat) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.raycast = () => {};
    mesh.layers.set(LAYER_NO_REFLECT); // wie die Leuchtränder nicht in der Bodenspiegelung
    group.add(mesh);
    return mesh;
  };
  const arrows = m.fan.map(({ color, offset }) => {
    const mat = new THREE.MeshBasicMaterial({ color: 0, side: THREE.DoubleSide });
    const mesh = flat(arrow, mat);
    const a = offset * Math.PI / 4, r = fixed ? m.arrowAtFixed : m.arrowAt;
    mesh.position.set(Math.sin(a) * r, y, -Math.cos(a) * r);
    mesh.rotation.y = -a; // Spitze −z → (sin a, −cos a)
    if (fixed) mesh.scale.setScalar(m.arrowScaleFixed);
    // Helle Farben (Grün) gedämpft, sonst überstrahlen sie Rot und Blau
    return { color, mat, glow: 0, tame: 1 - 0.5 * brightTame(COLOR_RGB[color]) };
  });
  const barMat = new THREE.MeshBasicMaterial({ color: 0 });
  flat(bar, barMat).position.set(0, y, fixed ? m.barAtFixed : m.barAt);
  return {
    group,
    update(color, glow, dt) {
      for (const a of arrows) {
        a.glow = easeToward(a.glow, color & a.color ? 1 : 0, dt);
        a.mat.color.copy(COLOR_RGB[a.color]).multiplyScalar((m.arrowIdle + a.glow * m.arrowLit) * a.tame);
      }
      barMat.color.setScalar(m.barIdle + glow * m.barLit);
    },
  };
}

/**
 * Prisma: dreiseitiges Glasprisma zwischen zwei Metallplatten, Austrittsfläche (lokal −z) in Richtung rot·45°, auf dem
 * Sockel seine Zeichen (makePrismMarks).
 */
function makePrism(el) {
  const root = new THREE.Group();
  root.add(el.fixed ? makeFixedBase() : makePedestal(0.38));
  const pivot = new THREE.Group();
  root.add(pivot);

  const H = 0.5;
  const R = 0.33;
  const geo = new THREE.CylinderGeometry(R, R, H, 3, 1); // Ecke lokal bei +z, gegenüber die Fläche bei −z
  const glass = new THREE.Mesh(geo, makeGlassMaterial(new THREE.Color(0.86, 0.9, 1.0), { iridescence: 1.0 }));
  glass.position.y = BEAM_Y;
  glass.renderOrder = 5;
  pivot.add(glass);
  const edges = glassEdges(geo, 0.32);
  edges.position.y = BEAM_Y;
  pivot.add(edges);

  for (const y of [BEAM_Y - H / 2 - 0.012, BEAM_Y + H / 2 + 0.012]) {
    const cap = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.024, 3), MAT.metalBright));
    cap.position.y = y;
    pivot.add(cap);
  }
  const post = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, BEAM_Y - H / 2 - 0.07, 12), MAT.metalBright));
  post.position.y = 0.06 + (BEAM_Y - H / 2 - 0.07) / 2;
  if (!inCube()) pivot.add(post);

  // Spektralfenster auf der Austrittsfläche: zeigt die Fächerrichtung und leuchtet, wenn Licht austritt.
  // (Bei Blick von aussen liegt Rot auf der Seite, zu der der rote Strahl abgelenkt wird.)
  const veilMat = new THREE.MeshBasicMaterial({
    map: spectrumTexture, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, fog: false, opacity: 1,
  });
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(R * Math.sqrt(3) * 0.8, H * 0.82), veilMat);
  veil.position.set(0, BEAM_Y, -(R * 0.5 + 0.004));
  veil.raycast = () => {};
  pivot.add(veil);

  const marks = makePrismMarks(el.fixed);
  pivot.add(marks.group);

  const u = root.userData;
  u.pivot = pivot;
  u.veil = veil;
  u.glow = 0;
  // Austrittsfläche lokal −z → Rasterrichtung (cos a, sin a): rotation.y = −π/2 − a
  u.orient = (e) => { pivot.rotation.y = -Math.PI / 2 - e.rot * Math.PI / 4; };
  u.orient(el);
  u.update = (t, dt) => {
    const color = activeColorOf(u);
    u.glow = easeToward(u.glow, color ? 1 : 0, dt);
    veilMat.color.setScalar(0.08 + u.glow * 1.1);
    marks.update(color, u.glow, dt);
  };
  return root;
}

/** Farbfilter: schwebender, sechseckig geschliffener Kristall in seiner Durchlassfarbe. */
function makeFilter(el) {
  const root = new THREE.Group();
  root.add(makeFixedBase());
  const col = COLOR_RGB[el.color];

  const pts = [[0, -0.34], [0.16, -0.2], [0.18, 0.16], [0, 0.34]].map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(pts, 6);
  // Wie beim Zielkristall: Dunkle Farben (Blau, Rot) mit weniger Weiss und Schillern, etwas deckender und mit mehr
  // Eigenleuchten – sonst wirkt ein Blaufilter blasslila.
  const bt = brightTame(col);
  const idleGlow = THREE.MathUtils.lerp(0.3, 0.18, bt);
  const tint = col.clone().lerp(new THREE.Color(1, 1, 1), THREE.MathUtils.lerp(0.05, 0.25, bt));
  const crystal = new THREE.Mesh(geo, makeGlassMaterial(tint, {
    opacity: THREE.MathUtils.lerp(0.72, 0.62, bt), emissive: col.clone(), emissiveIntensity: idleGlow,
    iridescence: THREE.MathUtils.lerp(0.1, 0.3, bt),
  }));
  crystal.position.y = BEAM_Y;
  crystal.renderOrder = 5;
  root.add(crystal);
  const edges = glassEdges(geo, 0.22);
  crystal.add(edges);

  const coreMat = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(0.5) });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), coreMat);
  crystal.add(core);

  const ringMat = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(0.5) });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.008, 8, 48), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = FIXED_BASE_TOP + 0.006;
  if (inCube()) { ring.position.y = BEAM_Y; ring.scale.setScalar(1.5); }
  root.add(ring);

  const u = root.userData;
  u.glow = 0;
  u.phase = phasenZufall() * Math.PI * 2;
  u.update = (t, dt) => {
    u.glow = easeToward(u.glow, activeColorOf(u) ? 1 : 0, dt);
    crystal.rotation.y = t * 0.3 + u.phase;
    crystal.position.y = BEAM_Y + Math.sin(t * 0.9 + u.phase) * 0.012;
    coreMat.color.copy(col).multiplyScalar(0.5 + u.glow * 4.5);
    ringMat.color.copy(col).multiplyScalar(0.5 + u.glow * 2.0);
    crystal.material.emissiveIntensity = idleGlow + u.glow * 0.8;
  };
  return root;
}

/** Kombinator: Glaskugel in einer kardanischen Fassung, Austrittsdüse zeigt in Richtung dir. */
function makeCombiner(el) {
  const root = new THREE.Group();
  root.add(el.fixed ? makeFixedBase() : makePedestal(0.38));
  const pivot = new THREE.Group();
  root.add(pivot);

  const orbGeo = new THREE.IcosahedronGeometry(0.2, 1);
  const orb = new THREE.Mesh(orbGeo, makeGlassMaterial(new THREE.Color(0.9, 0.92, 1.0), { opacity: 0.38 }));
  orb.position.y = BEAM_Y;
  orb.renderOrder = 5;
  pivot.add(orb);
  orb.add(glassEdges(orbGeo, 0.18));

  const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.15, 0.15, 0.17) });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.065, 20, 14), coreMat);
  core.position.y = BEAM_Y;
  pivot.add(core);

  // Kardanische Ringe
  const gimbal = new THREE.Group();
  gimbal.position.y = BEAM_Y;
  pivot.add(gimbal);
  for (const [rx, ry] of [[Math.PI / 2, 0], [0, 0]]) {
    // kein Schattenwurf: die Ringe drehen sich, die Shadow-Map wird nur bei Änderungen erneuert
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.01, 8, 64), MAT.metalBright);
    ring.rotation.set(rx, ry, 0);
    gimbal.add(ring);
  }

  // Austrittsdüse (lokal +x) mit Linse in der Mischfarbe. Hell und mit schwach leuchtender Linse, damit die
  // Richtung auch ohne Licht und auf dem Handy erkennbar ist; die Linse ist eine flache Scheibe statt einer
  // Kreisfläche, damit sie auch von oben als Streifen zu sehen ist.
  const nozzle = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.14, 24), MAT.metalBright));
  nozzle.rotation.z = Math.PI / 2;
  nozzle.position.set(0.31, BEAM_Y, 0);
  pivot.add(nozzle);
  const lensMat = new THREE.MeshBasicMaterial({ color: COMBINER_LENS_IDLE.clone() });
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.02, 24), lensMat);
  lens.rotation.z = Math.PI / 2;
  lens.position.set(0.39, BEAM_Y, 0);
  pivot.add(lens);

  const post = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, BEAM_Y - 0.33, 12), MAT.metalBright));
  post.position.y = 0.06 + (BEAM_Y - 0.33) / 2;
  if (!inCube()) pivot.add(post);

  const u = root.userData;
  u.pivot = pivot;
  u.glow = 0;
  u.mix = 0;
  u.orient = (e) => { pivot.rotation.y = dirToRotationY(e.dir); };
  u.orient(el);
  const tmp = new THREE.Color();
  let shown = 7;
  u.update = (t, dt) => {
    const arrived = activeColorOf(u); // nur Farben, deren Strahl schon sichtbar angekommen ist
    if (arrived) shown = arrived;
    u.glow = easeToward(u.glow, arrived ? 1 : 0, dt);
    gimbal.rotation.y = t * 0.35;
    gimbal.rotation.x = Math.sin(t * 0.4) * 0.25;
    const tame = 1 - 0.45 * brightTame(COLOR_RGB[shown]); // weisse Mischung sonst eine weisse Scheibe
    tmp.copy(COLOR_RGB[shown]).multiplyScalar(2.6 * tame);
    coreMat.color.setRGB(0.15, 0.15, 0.17).lerp(tmp, u.glow);
    tmp.copy(COLOR_RGB[shown]).multiplyScalar(4.0 * tame);
    lensMat.color.copy(COMBINER_LENS_IDLE).lerp(tmp, u.glow);
  };
  return root;
}
/** Linse des Kombinators ohne Licht: schwach leuchtend (unter der Bloom-Schwelle), zeigt die Austrittsrichtung. */
const COMBINER_LENS_IDLE = new THREE.Color(0.55, 0.57, 0.66);

/** Blocker: schwere, dunkle Steinsäule mit Metallband. */
function makeBlocker() {
  const root = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x0c0c10, roughness: 0.62, metalness: 0, envMapIntensity: 0.6, flatShading: true,
  });
  const column = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.33, 0.92, 6), stoneMat));
  column.position.y = 0.46;
  column.rotation.y = Math.PI / 6;
  root.add(column);
  const top = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.06, 6), stoneMat));
  top.position.y = 0.95;
  top.rotation.y = Math.PI / 6;
  root.add(top);
  const band = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.335, 0.34, 0.035, 6), MAT.metalDark));
  band.position.y = 0.1;
  band.rotation.y = Math.PI / 6;
  root.add(band);
  return root;
}

const ELEMENT_FACTORIES = {
  source: makeSource,
  mirror: makeMirror,
  prism: makePrism,
  filter: makeFilter,
  combiner: makeCombiner,
  blocker: makeBlocker,
  target: makeTarget,
};

/* =====================================================================
   BOARD — verbindet Spiellogik und 3D-Darstellung
   ===================================================================== */

const boardGroup = new THREE.Group();
scene.add(boardGroup);

const game = {
  levelIndex: 0,
  board: null,
  objects: new Map(), // element.id → Object3D
  hitProxies: [],     // unsichtbare Trefferzylinder der drehbaren Elemente und der festen mit Sockel (Weigerung)
  targets: [],        // Modelle der Ziele
  result: null,
  // Statistik des laufenden Versuchs: die Zeit läuft ab der ersten Drehung
  stats: { turns: 0, startedAt: null, lastTurnAt: null },
};

const SHARED_MATERIALS = new Set(Object.values(MAT));

/** Gibt Geometrien und elementeigene Materialien eines entfernten Modells frei. */
function disposeTree(root) {
  root.traverse((o) => {
    if (o.geometry && !SHARED_GEOMETRIES.has(o.geometry)) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const m of mats) if (!SHARED_MATERIALS.has(m) && m !== hitProxyMaterial) m.dispose();
  });
}

/* =====================================================================
   WÜRFEL — Hilfen für die Würfel-Level (Prototyp): Rahmen und Zellpunkte zeigen die Tiefe.
   ===================================================================== */

const CUBE = {
  frameColor: new THREE.Color(0.3, 0.34, 0.5),
  cameraZoom: 1.3,                                  // Abstand im Vergleich zum 2D-Feld (der Würfel ist höher)
  cameraZoomNarrow: 0.95,                           // … im Hochformat (dort begrenzt die Breite, der Würfel ist schmaler)
  cameraSize: 5,                                    // Kantenlänge, für die die Abstände gelten; andere Würfel im Verhältnis
  cameraTilt: 0.3,                                  // flacher als beim 2D-Feld: die Ebenen liegen sichtbar übereinander
  cameraTurn: 0.5,                                  // schräg: Strahlen zur Kamera hin liegen nicht hintereinander
  phiMin: 0.22, phiMax: 1.42,                       // Neigung: fast senkrecht von oben bis knapp über die Platte
};

const cubeView = {
  group: new THREE.Group(),
  size: 0,         // Kantenlänge der Grundfläche des aktuellen Würfels, 0 = 2D-Level
  height: 0,       // seine Zahl der Ebenen
  frameMat: null,  // Linien des Rahmens (leuchten beim Lösen auf, siehe glow)

  /** Neues Level: Hilfen auf- bzw. abbauen. */
  build(board) {
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    this.group.clear();
    this.frameMat = null;
    this.size = board.dim === 3 ? board.size : 0;
    this.height = board.dim === 3 ? board.height : 0;
    if (!this.size) return;
    const n = this.size, h = this.height, ext = n * CELL, extH = h * CELL, mid = (n - 1) / 2;
    const quiet = (o) => { o.raycast = () => {}; o.layers.set(LAYER_NO_REFLECT); return o; };
    const lineMat = (color, opacity) => new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, fog: false });
    const dotMat = (color, opacity, size) => new THREE.PointsMaterial({ color, size, transparent: true, opacity, depthWrite: false, fog: false });

    const box = new THREE.BoxGeometry(ext, extH, ext);
    const frame = quiet(new THREE.LineSegments(new THREE.EdgesGeometry(box), this.frameMat = lineMat(CUBE.frameColor.clone(), 0.5)));
    box.dispose();
    // auf der Platte stehend, die Zellen mittig darin (siehe cubeToWorld)
    cubeToWorld(mid, 0, mid, n, frame.position).y = extH / 2 + 0.002;

    const p = [];
    for (let y = 0; y < h; y++) for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) p.push(...cubeToWorld(x, y, z, n).toArray());
    const cells = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    const dots = quiet(new THREE.Points(cells, dotMat(CUBE.frameColor, 0.7, 0.045)));
    this.group.add(frame, dots);
  },
  /** Rahmen in der Farbe der Lichtwelle aufleuchten lassen (k = 0 … 1). */
  glow(k) {
    if (!this.frameMat) return;
    this.frameMat.color.copy(CUBE.frameColor).lerp(shockUniforms.uShockColor.value, k).multiplyScalar(1 + k * 5);
    this.frameMat.opacity = 0.5 + k * 0.5;
  },
};
boardGroup.add(cubeView.group);

/**
 * Die Elemente eines Felds bauen (Generator, yield je Element), noch nicht in der Szene: objects bekommt [el, obj],
 * proxies die Trefferflächen. Während eines Schritts gelten board und proxies als die des Spiels (inCube,
 * makeInteractive lesen sie), danach wieder die alten: So lässt sich das nächste Level bauen, während das alte noch steht.
 */
function* buildElements(board, objects, proxies) {
  for (const el of board.elements) {
    const factory = ELEMENT_FACTORIES[el.type];
    if (!factory) continue;
    const saved = [game.board, game.hitProxies];
    game.board = board;
    game.hitProxies = proxies;
    try {
      const obj = factory(el);
      if (board.dim === 3) placeInCube(obj, el, board.size);
      else gridToWorld(el.x, el.z, 0, obj.position);
      obj.userData.element = el;
      if (isRotatable(el)) makeInteractive(obj);
      else if (board.dim !== 3) makeRefusing(obj); // Würfel: Rahmen statt Sockel, keine Weigerung
      objects.push([el, obj]);
    } finally {
      [game.board, game.hitProxies] = saved;
    }
    yield;
  }
}

/**
 * Das nächste Level vorab bauen (Ticket 09 der Leistung): Beim Abstieg ins Level baute loadLevel alle Elemente in
 * einem Bild, das hielt es auf dem gedrosselten Handy 135 ms an (Poco rund 40 ms). Sobald feststeht, welches Level
 * kommt (changeLevel, Einstieg der Geschichte), entstehen sie in Häppchen an ruhigen Stellen (sliced, ruhe), während
 * das alte Feld versinkt oder der Blick im Himmel ist; loadLevel nimmt sie dann nur noch. Was bis dahin nicht fertig
 * ist, baut loadLevel wie bisher im selben Bild zu Ende. Mit ?t= (Tests, KI-Tester) nicht: Dort zieht Math.random eine
 * feste Folge, die Reihenfolge der Züge bliebe so wie bisher.
 */
const levelPrep = { level: null, board: null, objects: null, proxies: null, steps: null };
function prepareLevel(index) {
  const level = LEVELS[index];
  if (FIXED_TIME !== null || !level || levelPrep.level === level) return;
  dropPreparedLevel();
  try {
    levelPrep.board = createBoard(level);
  } catch { return; } // ein fehlerhaftes Level meldet loadLevel
  levelPrep.level = level;
  levelPrep.objects = [];
  levelPrep.proxies = [];
  const steps = levelPrep.steps = buildElements(levelPrep.board, levelPrep.objects, levelPrep.proxies);
  sliced(steps, true, 'Level vorab').catch((e) => { if (levelPrep.steps === steps) dropPreparedLevel(); console.warn(`Level vorab: ${e.message}`); });
}
function dropPreparedLevel() {
  for (const [, obj] of levelPrep.objects ?? []) disposeTree(obj);
  levelPrep.steps?.return();
  Object.assign(levelPrep, { level: null, board: null, objects: null, proxies: null, steps: null });
}

/** Baut ein Level auf; beamDelay = Sekunden, bis die Strahlen von den Quellen aus loswachsen. */
function loadLevel(index, beamDelay = 0) {
  game.levelIndex = index;
  // vorab gebaut (prepareLevel): den Rest jetzt; sonst alles jetzt
  const prep = levelPrep.level === LEVELS[index] ? { ...levelPrep } : null;
  if (prep) Object.assign(levelPrep, { level: null, board: null, objects: null, proxies: null, steps: null });
  else dropPreparedLevel();
  const board = prep?.board ?? createBoard(LEVELS[index]);
  const objects = prep?.objects ?? [], proxies = prep?.proxies ?? [];
  const steps = prep?.steps ?? buildElements(board, objects, proxies);
  arbeit.tue(prep ? 'Level: Rest aufbauen' : 'Level aufbauen', () => { for (let r = steps.next(); !r.done; r = steps.next()); });
  game.board = board;
  game.stats = { turns: 0, startedAt: null, lastTurnAt: null };
  // das alte Feld: aus der Szene, freigeben erst in den nächsten Bildern (sliced; es kostete das Bild des Abstiegs
  // auf dem gedrosselten Handy weitere 14 ms)
  const old = [...game.objects.values()];
  for (const obj of old) boardGroup.remove(obj);
  if (old.length) sliced((function* () { for (const obj of old) { disposeTree(obj); yield; } })(), false, 'Level freigeben');
  game.objects.clear();
  game.hitProxies = proxies;
  setHovered(null);
  clearTimeout(input.longPressTimer);
  if (input.pointer) input.pointer.el = input.pointer.fest = null;
  for (const [el, obj] of objects) {
    boardGroup.add(obj);
    game.objects.set(el.id, obj);
  }
  game.targets = [...game.objects.values()].filter(o => o.userData.element.type === 'target');
  cubeView.build(game.board);
  cameraRig.cube = game.board.dim === 3 ? game.board.size : 0;
  cameraRig.cubeHeight = game.board.dim === 3 ? game.board.height : 0;
  // Staub im ganzen Würfel, nicht nur knapp über der Platte (Teilchen liegen zwischen 0.12 und 0.84)
  beamView.dust.scale.y = cameraRig.cube ? cameraRig.cubeHeight * CELL / 0.84 : 1;
  markShadowsDirty();
  // Schonfrist für die adaptive Auflösung (neue Shader kompilieren beim ersten Frame)
  requestAnimationFrame(() => adaptiveResolution.hold()); // im nächsten Frame: beim ersten Aufruf noch nicht definiert
  beamView.reset(); // Strahlen des alten Felds nicht über dem neuen ausblenden
  recomputeBeams(false, beamDelay);
}

function recomputeBeams(instant = false, delay = 0) {
  sceneLoop.wake(); // Strahlen wachsen, Elemente drehen sich (auch hinter der Bühne fertig)
  // Ruhte die Schleife (geweckt, auch eben durch wake oben, aber noch kein Schritt seither: last null), steht
  // beamView.time noch beim letzten Schritt: Neue Strahlen wären sonst schon gewachsen, entfallene schon ausgeblendet
  // (Geburt und Tod zählen ab time). Darum erst wecken, dann prüfen.
  if (sceneLoop.started && sceneLoop.last === null && FIXED_TIME === null) beamView.time = sceneTime.at();
  game.result = traceBeams(game.board);
  beamView.update(game.result, instant, delay);
  // Ein Ziel leuchtet erst auf, wenn der letzte seiner Strahlen sichtbar angekommen ist.
  for (const el of game.board.elements) {
    if (el.type !== 'target') continue;
    const u = game.objects.get(el.id).userData;
    u.satisfied = game.result.satisfied.has(el.id);
    u.arrivals = beamView.eventRecords.filter(r => r.ev.kind === 'hit' && r.ev.target === el.id);
    // falsches Licht: eine Farbe, die das Ziel nicht enthält (0 = nichts Falsches). Eine erst halb fertige Mischung
    // (z. B. nur Rot auf Magenta) ist der richtige Weg und zählt nicht.
    const mix = game.result.hits.get(el.id) || 0;
    u.wrongMix = mix & ~el.color ? mix : 0;
  }
  // Prisma, Filter, Kombinator: welche Strahlen kommen an (für ihr Aufleuchten)
  for (const el of game.board.elements) {
    if (el.type !== 'prism' && el.type !== 'filter' && el.type !== 'combiner') continue;
    const u = game.objects.get(el.id).userData;
    // nur Ereignisse, bei denen Licht weitergeht (ein Prisma ohne Austritt bleibt dunkel)
    u.events = beamView.eventRecords.filter(r => r.ev.element === el.id && r.ev.kind !== 'absorb');
    if (el.type === 'combiner') u.mix = game.result.mixes.get(el.id) || 0;
  }
}

function updateTargetGoals() {
  let lit = 0, total = 0;
  for (const obj of game.objects.values()) {
    const u = obj.userData;
    if (u.element.type !== 'target') continue;
    const arrived = u.arrivals.length > 0 && u.arrivals.every(r => beamView.revealed(r, r.worldDist));
    const goal = u.satisfied && arrived ? 1 : 0;
    if (goal && !u.hitGoal) audio.hit(u.element.color); // Ton, sobald das Licht sichtbar ankommt
    u.hitGoal = goal;
    u.wrongGoal = u.wrongMix && arrived ? 1 : 0;
    if (u.wrongGoal) u.wrongColor.copy(COLOR_RGB[u.wrongMix]); // erst wenn das Licht sichtbar ankommt
    // Farbring: je Strahl, sobald er sichtbar ankommt (ein schon liegender Bogen blendet nicht ab, während ein
    // weiterer Strahl noch wächst)
    let seen = 0;
    for (const r of u.arrivals) if (beamView.revealed(r, r.worldDist)) seen |= r.ev.color;
    for (const seg of u.ringSegs) seg.userData.arriveGoal = seen & seg.userData.primary ? 1 : 0;
    total++;
    lit += goal;
  }
  if (flow.state === 'play' || flow.state === 'in') ui.showGoal(lit, total);
}

const ROTATE = {
  duration: 0.26,   // Sekunden
  beamDelay: 0.17,  // neuer Strahl wächst, wenn die Drehung fast fertig ist
};
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

/**
 * Dreht ein Element um ±45°: die Logik sofort, das Modell weich (Easing). Mehrere schnelle
 * Klicks addieren sich zum Zielwinkel, ohne Sprung. Alle drei drehbaren Typen drehen bei +1
 * ihren Pivot um −π/4 (siehe orient: Spiegel/Kombinator −a, Prisma −π/2 − a).
 */
function rotateElement(el, delta) {
  if (!el || !isRotatable(el) || game.board.elements[el.id] !== el) return; // z. B. Element eines alten Levels
  if (flow.state !== 'play') return; // während eines Levelwechsels nicht drehen
  audio.rotate();
  const now = performance.now();
  game.stats.turns++;
  game.stats.startedAt ??= now;
  game.stats.lastTurnAt = now;
  // Der Kombinator dreht seine Ausgangsrichtung, Spiegel und Prisma ihren Winkel
  if (el.type === 'combiner') el.dir = mod8(el.dir + delta);
  else el.rot = mod8(el.rot + delta);
  const u = game.objects.get(el.id).userData;
  const current = u.pivot.rotation.y;
  const goal = (u.rotation ? u.rotation.to : current) - delta * Math.PI / 4;
  u.rotation = { from: current, to: goal, t: 0 };
  sceneLoop.wake(); // auch ohne Eingabe (__prismaDebug.loese)
  recomputeBeams(false, ROTATE.beamDelay);
  fuehrung.gedreht(el, delta);
}

/** Weiche Drehungen fortschreiben (pro Frame). */
function animateRotations(dt) {
  for (const obj of game.objects.values()) {
    const u = obj.userData;
    if (!u.rotation) continue;
    const r = u.rotation;
    r.t = Math.min(1, r.t + dt / ROTATE.duration);
    u.pivot.rotation.y = r.from + (r.to - r.from) * easeOutCubic(r.t);
    markShadowsDirty();
    if (r.t >= 1) u.rotation = null;
  }
}

/**
 * Weigerung (Ticket 02 von .scratch/tutorial-fuehrung/): Ein festes Element mit eckigem Sockel wackelt beim Antippen
 * kurz um die senkrechte Achse, sein roter Rand blitzt auf. Ohne Text, ohne Zug, Strahlen und Speicherstand bleiben,
 * wie sie sind. dauer in s, winkel in rad, schwingungen: ganze Hin-und-her-Bewegungen, blitz: Faktor der Helligkeit
 * des Rands auf dem Höhepunkt.
 */
const WEIGERN = { dauer: 0.42, winkel: 0.1, schwingungen: 2, blitz: 4 };
const weigernde = new Set(); // Modelle, die gerade wackeln (leer: keine Arbeit je Bild)

/** Rüstet ein festes Element mit Sockel mit einem Trefferzylinder aus (ohne Sockel: nichts, es reagiert nicht). */
function makeRefusing(obj) {
  let rand = null;
  obj.traverse((m) => { if (m.userData.sockelRand) rand = m; });
  if (!rand) return;
  const proxy = new THREE.Mesh(hitProxyGeometry, hitProxyMaterial);
  proxy.position.y = 0.375;
  proxy.userData.element = obj.userData.element;
  obj.add(proxy);
  game.hitProxies.push(proxy);
  obj.userData.sockelRand = rand;
}

/**
 * Das feste Element el weigert sich (erneut angetippt: von vorn). Unter der Sperre der Führung (fuehrung.darf) auch
 * ein drehbares: Es wackelt ebenso, ohne Blitz (sein runder Sockel hat keinen roten Rand).
 */
function weigern(el) {
  if (!el || (isRotatable(el) && fuehrung.darf(el)) || game.board.elements[el.id] !== el) return; // z. B. altes Level
  if (flow.state !== 'play') return;
  const obj = game.objects.get(el.id), u = obj?.userData;
  if (!u || (!u.sockelRand && !isRotatable(el))) return;
  fuehrung.angetippt(el); // ein Schritt kann auf die Weigerung warten (festes Element antippen)
  if (u.weigern) { u.weigern.t = 0; return; }
  // eigenes Material nur für die Dauer: das geteilte (edgeMat) liesse alle Sockel aufblitzen
  const mat = u.sockelRand?.material.clone() ?? null;
  if (mat) u.sockelRand.material = mat;
  u.weigern = { t: 0, mat, rotY: obj.rotation.y };
  weigernde.add(obj);
  sceneLoop.wake();
}

/** Wackeln und Blitz fortschreiben (pro Frame, nur solange eines wackelt). */
function animateWeigern(dt) {
  for (const obj of weigernde) {
    const u = obj.userData, w = u.weigern;
    w.t = Math.min(1, w.t + dt / WEIGERN.dauer);
    obj.rotation.y = w.rotY + WEIGERN.winkel * Math.sin(2 * Math.PI * WEIGERN.schwingungen * w.t) * (1 - w.t);
    // Blitz: schnell hell (Höhepunkt bei einem Viertel), langsam zurück
    w.mat?.color.copy(FIXED_EDGE.color).multiplyScalar(1 + WEIGERN.blitz * Math.sin(Math.PI * Math.sqrt(w.t)));
    markShadowsDirty();
    if (w.t >= 1 || !obj.parent) { // fertig oder das Level ist gewechselt
      obj.rotation.y = w.rotY;
      if (w.mat) { u.sockelRand.material = fixedBase().edgeMat; w.mat.dispose(); }
      u.weigern = null;
      weigernde.delete(obj);
    }
  }
}

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

/* =====================================================================
   INTERAKTION — Klick/Tap dreht +45°, Rechtsklick/langes Drücken −45°,
   Ziehen dreht die Kamera, Mausrad/zwei Finger zoomen. Hover: sanfter Lichtrand + Lichtkreis am Boden.
   ===================================================================== */

const INPUT = {
  pulseDuration: 1.1, // Sekunden: Aufleuchten der drehbaren Elemente zu Levelbeginn
  dragThresholdMouse: 5,    // px, ab hier ist es ein Ziehen statt eines Klicks
  dragThresholdTouch: 10,
  longPressMs: 450,
  touchSlop: 26,            // px: so weit daneben darf ein Finger tippen und trifft trotzdem
  hoverFade: 0.0008,        // Glättung des Hover-Leuchtens (pro Sekunde verbleibender Anteil)
  wheelZoom: 0.001,         // Zoom je Pixel Mausrad (ein Raster ≈ 100 px ≈ 10 %), gedeckelt auf wheelStep je Ereignis
  wheelStep: 100,
};

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
// pinch: zweiter Finger, solange zwei Finger zoomen ({ id, x, y, d: letzter Abstand der Finger })
const input = { pointer: null, pinch: null, hovered: null, longPressTimer: 0 };

const _pickPos = new THREE.Vector3();
/**
 * Element unter einem Bildschirmpunkt, über die Trefferzylinder: drehbare und feste mit Sockel (Weigerung), Drehbares
 * im Toleranzbereich gewinnt immer (pickTapped). slop (px): verfehlt der Strahl die Zylinder, zählt auch ein Element,
 * dessen Mitte höchstens so weit entfernt liegt (Finger sind ungenau).
 */
function pickElement(clientX, clientY, slop = 0) {
  if (flow.state !== 'play') return null; // während eines Levelwechsels nichts anwählen
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNdc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointerNdc, camera);
  const cands = raycaster.intersectObjects(game.hitProxies, false)
    .map((h) => ({ el: h.object.userData.element, hit: h.distance, px: Infinity }));
  if (slop > 0) {
    for (const proxy of game.hitProxies) { // Abstände hier in Pixeln des Layouts (clientX, Rechteck)
      proxy.getWorldPosition(_pickPos).project(camera);
      const px = Math.hypot((_pickPos.x + 1) / 2 * rect.width + rect.left - clientX,
        (1 - _pickPos.y) / 2 * rect.height + rect.top - clientY);
      cands.push({ el: proxy.userData.element, hit: null, px });
    }
  }
  return pickTapped(cands, slop * SEITE, fuehrung.vorrang());
}

/**
 * Nur drehbare Elemente, die drehen dürfen (Hover, Lichtrand, Drehen): Feste reagieren allein aufs Antippen, unter der
 * Sperre der Führung weigern sich auch drehbare ausser den markierten (fuehrung.darf).
 */
const rotatableOnly = (el) => (el && isRotatable(el) && fuehrung.darf(el) ? el : null);

function setHovered(el) {
  if (input.hovered === el) return;
  input.hovered = el;
  sceneLoop.wake(); // Hover blendet weich ein und aus
  renderer.domElement.style.cursor = el ? 'pointer' : '';
}

/** Fresnel-Lichtrand: additiv über den Flächen eines Elements, nur wenn es gehovert wird. */
const RIM_VERTEX = `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const RIM_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.6);
    gl_FragColor = vec4(uColor * f * uIntensity, 1.0);
  }`;

function createHoverRingTexture(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const h = size / 2;
  const g = ctx.createRadialGradient(h, h, 0, h, h, h);
  g.addColorStop(0.0, 'rgba(255,255,255,0)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.02)');
  g.addColorStop(0.74, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.8, 'rgba(255,255,255,0.18)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}
const hoverRingTexture = createHoverRingTexture(256);
const hoverRingGeometry = new THREE.PlaneGeometry(1.15, 1.15);
// Höhe ≈ Modellhöhe: höhere Zylinder fingen bei schrägem Blick Klicks auf das dahinterliegende Element ab
const hitProxyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.75, 12);
const hitProxyMaterial = new THREE.MeshBasicMaterial({ visible: false });
const SHARED_GEOMETRIES = new Set([hoverRingGeometry, hitProxyGeometry]);

/** Gestrichelter Ring (Torus-Bögen) als eine Geometrie: count Striche, gap = Anteil der Lücke. */
function dashedRingGeometry(radius, count, gap, tube) {
  const step = Math.PI * 2 / count;
  const parts = [];
  for (let i = 0; i < count; i++) {
    const g = new THREE.TorusGeometry(radius, tube, 6, 10, step * (1 - gap));
    g.rotateZ(i * step);
    parts.push(g);
  }
  return mergeGeometries(parts);
}

/** Fügt indizierte Geometrien zu einer zusammen (ein Draw-Call); gibt die Teile frei. */
function mergeGeometries(parts) {
  const pos = [], nor = [], uv = [], idx = [];
  let offset = 0;
  for (const g of parts) {
    pos.push(...g.attributes.position.array);
    nor.push(...g.attributes.normal.array);
    if (g.attributes.uv) uv.push(...g.attributes.uv.array);
    for (const k of g.index.array) idx.push(k + offset);
    offset += g.attributes.position.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  if (uv.length === offset * 2) out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}

/** Rüstet ein drehbares Element mit Trefferzylinder, Lichtrand, Boden-Lichtkreis und Leuchtring aus. */
function makeInteractive(obj) {
  const u = obj.userData;

  const proxy = new THREE.Mesh(hitProxyGeometry, hitProxyMaterial);
  proxy.position.y = inCube() ? BEAM_Y : 0.375;
  if (inCube()) proxy.scale.set(1.2, 1.35, 1.2); // Würfel: Ring mit Marken (0.58) und Achszapfen (±0.475) einschliessen
  proxy.userData.element = u.element;
  obj.add(proxy);
  game.hitProxies.push(proxy);

  const rimMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0.75, 0.82, 1.0) }, uIntensity: { value: 0 } },
    vertexShader: RIM_VERTEX,
    fragmentShader: RIM_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    fog: false,
  });
  const overlays = [];
  const solids = [];
  obj.traverse((m) => {
    if (!m.isMesh || m === proxy || !m.material || m.material.blending === THREE.AdditiveBlending) return;
    solids.push(m);
  });
  for (const m of solids) {
    const o = new THREE.Mesh(m.geometry, rimMat);
    o.renderOrder = 7;
    o.raycast = () => {};
    o.visible = false;
    o.layers.set(LAYER_NO_REFLECT);
    m.add(o);
    overlays.push(o);
  }

  const ringMat = new THREE.MeshBasicMaterial({
    map: hoverRingTexture, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, fog: false, color: new THREE.Color(0, 0, 0),
  });
  const ring = new THREE.Mesh(hoverRingGeometry, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = inCube() ? BEAM_Y : 0.006;
  ring.raycast = () => {};
  ring.visible = false;
  ring.layers.set(LAYER_NO_REFLECT);
  obj.add(ring);

  // Leuchtring auf dem Drehteller: dauerhaftes Zeichen "drehbar" (alles Feste steht auf einem eckigen Sockel
  // mit rotem Leuchtrand, siehe makeFixedBase).
  // Grundhelligkeit unter der Bloom-Schwelle, damit er ruhig bleibt; zu Levelbeginn pulsiert er einmal.
  const pedestalDisk = obj.children[0]?.children[0];
  const turnR = inCube() ? CUBE_MOUNT.ring : (pedestalDisk?.geometry?.parameters?.radiusTop ?? 0.38) - 0.03;
  const turnMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  // gestrichelt (6 grobe Striche, halbe Lücken): Filter haben einen durchgehenden Ring in ihrer Farbe, Ziele drei
  // farbige Bögen auf eckigem Sockel – so ist "drehbar" eine eigene Form. Alle Striche in einer Geometrie
  // (ein Draw-Call je Element).
  const turnRing = new THREE.Mesh(dashedRingGeometry(turnR, 6, 0.5, 0.017), turnMat);
  turnRing.rotation.x = Math.PI / 2;
  turnRing.position.y = inCube() ? BEAM_Y : 0.064;
  turnRing.raycast = () => {};
  turnRing.layers.set(LAYER_NO_REFLECT);
  obj.add(turnRing);

  u.hover = 0;
  u.pulseT = -1000; // Zeit seit Beginn des Pulses (negativ: Verzögerung; -1000: kein Puls)
  u.startPulse = (delay = 0) => { u.pulseT = -delay; sceneLoop.wake(); };
  u.updateHover = (dt) => {
    const goal = input.hovered === u.element ? 1 : 0;
    u.hover += (goal - u.hover) * (1 - Math.pow(INPUT.hoverFade, dt));
    if (u.hover < 0.002 && goal === 0) u.hover = 0;
    let pulse = 0;
    if (u.pulseT > -100) {
      u.pulseT += dt;
      if (u.pulseT >= INPUT.pulseDuration) u.pulseT = -1000; // fertig
      else if (u.pulseT > 0) pulse = Math.sin(Math.PI * u.pulseT / INPUT.pulseDuration);
    }
    const lit = Math.max(u.hover, pulse * 0.8);
    const on = lit > 0;
    rimMat.uniforms.uIntensity.value = lit * 0.6;
    for (const o of overlays) o.visible = on;
    ring.visible = u.hover > 0;
    ringMat.color.setRGB(0.55, 0.62, 0.85).multiplyScalar(u.hover * 1.3);
    turnMat.color.setRGB(0.66, 0.7, 0.8).multiplyScalar(0.85 + u.hover * 0.4 + pulse * 2.2); // kühles Weiss, so hell wie zuvor das Eisblau
  };
  u.warmup = (on) => { for (const o of overlays) o.visible = on; ring.visible = on; }; // siehe warmupShaders
}

/* ---------- Zeiger-Ereignisse ---------- */

/** dx, dy in Pixeln der Oberfläche (SEITE) */
function dragCamera(dx, dy) {
  const s = 2.4 / Math.max(window.innerWidth / SEITE, 600);
  cameraRig.homing = null;
  fuehrung.kamera();
  cameraRig.goalTheta -= dx * s;
  // Nach einer ganzen Runde beide Winkel um 2π zurücknehmen (gleiches Bild): Der Rückflug beim Levelwechsel
  // nimmt so den kürzesten Weg, statt alle Runden zurückzudrehen.
  const wrap = Math.round(cameraRig.goalTheta / (2 * Math.PI)) * 2 * Math.PI;
  cameraRig.goalTheta -= wrap;
  cameraRig.userTheta -= wrap;
  const { up, down } = phiLimits();
  cameraRig.goalPhi = THREE.MathUtils.clamp(cameraRig.goalPhi - dy * s, -up, down);
}

/**
 * Grenzen der Neigung gegen basePhi (nach oben, nach unten). Würfel: deutlich freier – von oben in die Schächte, von
 * der Seite auf die Ebenen.
 */
function phiLimits() {
  const base = cameraRig.basePhi + CUBE.cameraTilt;
  return cameraRig.cube ? { up: base - CUBE.phiMin, down: CUBE.phiMax - base }
    : { up: cameraRig.limitsPhiUp, down: cameraRig.phiMax - cameraRig.basePhi };
}

/** Zoom um den Faktor f (> 1: weiter weg), in den Grenzen von cameraRig. */
function zoomCamera(f) {
  cameraRig.homing = null;
  fuehrung.kamera();
  cameraRig.goalZoom = THREE.MathUtils.clamp(cameraRig.goalZoom * f, cameraRig.zoomMin, cameraRig.zoomMax);
}

function endPointer() {
  clearTimeout(input.longPressTimer);
  if (input.pointer && input.pointer.type !== 'mouse') setHovered(null);
  input.pointer = null;
  input.pinch = null;
  if (drag.active) {
    drag.active = false;
    adaptiveResolution.hold(1);
  }
}

const canvasEl = renderer.domElement;

// iOS Safari ignoriert user-scalable=no: Pinch-Zoom der Seite (statt des Spiels) explizit unterbinden
document.addEventListener('gesturestart', (e) => e.preventDefault());

canvasEl.addEventListener('pointerdown', (e) => {
  // Eine Maus kann nicht zweimal drücken, ohne loszulassen: verlorenes pointerup aufräumen
  if (input.pointer && e.pointerType === 'mouse') endPointer();
  const first = input.pointer;
  if (first && !input.pinch && first.type !== 'mouse' && e.pointerType !== 'mouse') {
    // Zweiter Finger: zoomen statt tippen oder drehen
    clearTimeout(input.longPressTimer);
    first.consumed = true;
    input.pinch = { id: e.pointerId, x: e.clientX, y: e.clientY, d: Math.hypot(e.clientX - first.cx, e.clientY - first.cy) };
    try { canvasEl.setPointerCapture(e.pointerId); } catch { /* z. B. synthetische Zeiger */ }
    drag.active = true;
    setHovered(null);
    return;
  }
  if (input.pointer || e.button === 1) return; // sonst ein Zeiger zur Zeit; Mittelklick ignorieren
  const picked = pickElement(e.clientX, e.clientY, e.pointerType === 'mouse' ? 0 : INPUT.touchSlop);
  const el = rotatableOnly(picked);
  // x, y: zuletzt fürs Drehen ausgewertet; cx, cy: wo der Zeiger gerade ist (für den Abstand beim Zoomen);
  // done: nach dem Zoomen mit zwei Fingern dreht der verbliebene nicht mehr (ein neuer zweiter zoomt wieder);
  // fest: angetipptes festes Element, es weigert sich beim Loslassen
  input.pointer = {
    id: e.pointerId, type: e.pointerType, button: e.button,
    x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, cx: e.clientX, cy: e.clientY,
    el, fest: el ? null : picked, moved: false, consumed: false, done: false,
  };
  try { canvasEl.setPointerCapture(e.pointerId); } catch { /* z. B. synthetische Zeiger */ }
  if (el) setHovered(el);
  // Langes Drücken (v. a. Touch): Gegenrichtung
  if (el && e.button === 0 && e.pointerType !== 'mouse') {
    input.longPressTimer = setTimeout(() => {
      const p = input.pointer;
      if (!p || p.moved || p.consumed) return;
      p.consumed = true;
      if (!fuehrung.darf(p.el)) { weigern(p.el); return; } // der Schritt wechselte während des Drückens
      rotateElement(p.el, -1);
      if (navigator.vibrate) navigator.vibrate(12);
    }, INPUT.longPressMs);
  }
});

canvasEl.addEventListener('pointermove', (e) => {
  const p = input.pointer;
  if (!p) {
    if (e.pointerType === 'mouse') setHovered(rotatableOnly(pickElement(e.clientX, e.clientY)));
    return;
  }
  const q = input.pinch;
  if (e.pointerId === p.id) { p.cx = e.clientX; p.cy = e.clientY; }
  else if (q && e.pointerId === q.id) { q.x = e.clientX; q.y = e.clientY; }
  else return;
  if (q) {
    const d = Math.hypot(q.x - p.cx, q.y - p.cy);
    if (d > 0 && q.d > 0) zoomCamera(q.d / d); // auseinander: näher heran
    q.d = d;
    return;
  }
  if (p.done) return;
  if (!p.moved) {
    const threshold = p.type === 'mouse' ? INPUT.dragThresholdMouse : INPUT.dragThresholdTouch;
    if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) / SEITE < threshold) return;
    p.moved = true;
    clearTimeout(input.longPressTimer);
    drag.active = true;
    setHovered(null);
  }
  dragCamera((e.clientX - p.x) / SEITE, (e.clientY - p.y) / SEITE);
  p.x = e.clientX;
  p.y = e.clientY;
});

/** Zweiter Finger losgelassen: Zoomen fertig, der erste dreht bis zum Loslassen nicht mehr. */
function endPinch(e) {
  if (!input.pinch || e.pointerId !== input.pinch.id) return false;
  input.pinch = null;
  input.pointer.done = true;
  return true;
}

canvasEl.addEventListener('pointerup', (e) => {
  if (endPinch(e)) return;
  const p = input.pointer;
  if (!p || e.pointerId !== p.id) return;
  // die Sperre noch einmal: Zwischen Drücken und Loslassen kann der Schritt gewechselt haben
  if (!p.moved && !p.consumed && p.el && fuehrung.darf(p.el)) rotateElement(p.el, p.button === 2 ? -1 : 1);
  else if (!p.moved && !p.consumed && (p.fest || p.el)) weigern(p.fest ?? p.el);
  endPointer();
  if (e.pointerType === 'mouse') setHovered(rotatableOnly(pickElement(e.clientX, e.clientY)));
});
canvasEl.addEventListener('pointercancel', (e) => { if (!endPinch(e) && input.pointer && e.pointerId === input.pointer.id) endPointer(); });
canvasEl.addEventListener('lostpointercapture', (e) => { if (!endPinch(e) && input.pointer && e.pointerId === input.pointer.id) endPointer(); });
// Mausrad; die Zwei-Finger-Geste des Touchpads kommt als Rad mit ctrlKey (feiner, darum stärker gewichtet) und
// skalierte sonst die ganze Seite
canvasEl.addEventListener('wheel', (e) => {
  e.preventDefault();
  const px = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight / SEITE : 1) * (e.ctrlKey ? 10 : 1);
  zoomCamera(Math.exp(THREE.MathUtils.clamp(px, -INPUT.wheelStep, INPUT.wheelStep) * INPUT.wheelZoom));
  adaptiveResolution.hold(1); // wie beim Ziehen: währenddessen die Auflösung nicht umbauen
}, { passive: false });
window.addEventListener('blur', () => { if (input.pointer) endPointer(); });
// Mittelklick: kein Autoscroll
canvasEl.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });
canvasEl.addEventListener('pointerleave', (e) => { if (!input.pointer && e.pointerType === 'mouse') setHovered(null); });

/* =====================================================================
   AUDIO — alles mit der Web Audio API erzeugt, keine Dateien.
   Leises Glitzern im Hintergrund, glasige Klicks beim Drehen, ein Ton je Zielfarbe
   (Rot tief … Blau hoch) und ein Akkord beim Lösen. Alle Töne liegen in
   A-Dur (A, C#, E, F#, G#, B), damit jede Kombination harmonisch klingt.
   Der AudioContext entsteht erst bei der ersten Geste (Autoplay-Regeln).
   ===================================================================== */

// Frequenz je Farbmaske – vom tiefen Rot über das Spektrum zum hohen Blau
const TONE_HZ = {
  1: 220.0,   // Rot      A3
  3: 277.18,  // Gelb     C#4
  2: 329.63,  // Grün     E4
  6: 415.30,  // Cyan     G#4
  4: 493.88,  // Blau     B4
  5: 369.99,  // Magenta  F#4
  7: 554.37,  // Weiss    C#5
};
const GLASS_HZ = [1760, 1975.5, 2217.5, 2637.0, 2960.0]; // A6 … F#7 (Pentatonik)
const SHIMMER_HZ = [1318.5, 1480.0, 1760, 1975.5, 2217.5]; // E6 … C#7: Hintergrund-Glitzern, etwas tiefer und weicher
// Glockentöne der Sterne 1–6 des Kleinen Wagens (audio.stern, Ticket 05 von .scratch/kleiner-wagen/): A4 … A5 in der
// Pentatonik der Zieltöne, Stern 1 der tiefste; über dem Akkord der Strahlen, unter dem Glitzern
const STERN_HZ = [440, 493.88, 554.37, 659.26, 739.99, 880];
// Schlusston des Polarsterns im Finale (audio.stern(7), Ticket 06): das A des sechsten Sterns, darunter Quinte und
// Oktave, die die steigende Reihe auflösen ([Hz, Anteil der Lautstärke])
const POLAR_HZ = [[880, 1], [659.26, 0.45], [440, 0.6]];
const HALL_WET = 0.55;    // Lautstärke des Halls (HALL_SECONDS: Länge, in src/hall.js)

// im Leerlauf (Safari kennt requestIdleCallback nicht)
const whenIdle = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 200 }) : (f) => setTimeout(f, 16);

/**
 * Impulsantwort je Abtastrate, einmal berechnet (Promise auf [links, rechts]): in einem Worker, damit der Hauptthread
 * frei bleibt; ohne Worker in Stücken von etwa 4 ms im Leerlauf.
 */
const hallData = (() => {
  const cache = new Map();
  const inPieces = (rate) => new Promise((resolve) => {
    const steps = hallImpulse(rate, HALL_SECONDS);
    const step = () => {
      const t = performance.now();
      let r;
      do r = steps.next(); while (!r.done && performance.now() - t < 4);
      if (r.done) resolve(r.value); else whenIdle(step);
    };
    whenIdle(step);
  });
  // der Worker lädt sein Modul src/hall-worker.ts (im Build eine eigene Datei unter assets/)
  const inWorker = (rate) => new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../hall-worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => resolve(data);
    worker.onerror = (e) => { e.preventDefault(); reject(e); };
    worker.postMessage(rate);
  });
  return (rate) => {
    if (!cache.has(rate)) {
      let p;
      try { p = inWorker(rate).catch(() => inPieces(rate)); } catch { p = inPieces(rate); }
      cache.set(rate, p);
    }
    return cache.get(rate);
  };
})();
// gleich beim Laden, auf Verdacht für die häufigste Abtastrate (Windows, Android, iOS); prepare verlangt die des Kontexts
hallData(48000);

const audio = {
  ctx: null,     // erst nach der ersten Geste (unlock); vorher liegt der Kontext angehalten in _ctx bereit
  master: null,  // Gesamtlautstärke (Ton an/aus)
  dry: null,     // direkter Weg
  wet: null,     // Hall
  muted: false,
  storageKey: 'prisma.muted',
  _ctx: null,    // vorab angelegt (prepare)
  _shimmerOn: false, _shimmerTimer: 0, // Hintergrund-Glitzern läuft (ab unlock); sein Zeitgeber (0: ruht)

  /**
   * Vorab, ohne Geste: Kontext angehalten anlegen, Knoten aufbauen und die Impulsantwort des Halls (hallData, seit dem
   * Laden im Worker berechnet) an den Convolver hängen. Das alles hielt früher beim ersten Klick die Seite an (Desktop
   * etwa 0,1 s, mit kaltem Audiogerät 0,4 s; Handy-Emulation mit 4× gedrosselter CPU 0,4–0,6 s), meist genau beim
   * Übergang in den Prolog. Anlegen des Kontexts und Puffer des Convolvers lassen sich nicht teilen (auf langsamen
   * Geräten je 0,1–0,2 s), darum beides nur, solange der Startbildschirm still steht (_quiet, Aufruf unten). Der
   * Browser warnt in der Konsole, dass der Kontext ohne Geste nicht startet; unlock weckt ihn.
   */
  prepare() {
    if (this._ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this._ctx = new AC();
    if (ctx.state === 'running') ctx.suspend(); // darf er ohne Geste laufen: bis zum ersten Klick trotzdem ruhen
    const comp = ctx.createDynamicsCompressor(); // fängt Spitzen ab, wenn viele Töne zusammenkommen
    comp.threshold.value = -14; comp.ratio.value = 3;
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(comp);
    this.dry = ctx.createGain();
    this.dry.connect(this.master);
    const reverb = ctx.createConvolver();
    this.wet = ctx.createGain();
    this.wet.gain.value = 0; // bis der Hall da ist (ein Convolver ohne Puffer schweigt)
    this.wet.connect(reverb);
    reverb.connect(this.master);
    // der Puffer des Convolvers kostet für sich mehr als die ganze Berechnung
    hallData(ctx.sampleRate).then((data) => this._quiet(() => {
      const buf = ctx.createBuffer(2, data[0].length, ctx.sampleRate);
      data.forEach((d, ch) => buf.getChannelData(ch).set(d)); // copyToChannel fehlt dem alten webkitAudioContext
      reverb.buffer = buf;
      // Klick vor dem Hall: weich dazublenden (Töne, die schon klingen, kommen allmählich in den Hall)
      if (ctx.state === 'running') this.wet.gain.setTargetAtTime(HALL_WET, ctx.currentTime, 0.4);
      else this.wet.gain.value = HALL_WET;
    }));
  },

  /** Beim ersten Klick/Tastendruck: den vorbereiteten Kontext wecken und das Hintergrund-Glitzern starten. */
  unlock() {
    // Ohne echte Nutzergeste verweigert der Browser den Ton (und warnt) – dann später erneut
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    if (this.ctx) { this._sync(); return; }
    this.prepare(); // Klick vor der Vorbereitung: Kontext jetzt, der Hall kommt nach
    if (!this._ctx) return;
    this.ctx = this._ctx;
    this.master.gain.value = this.muted ? 0 : 0.9;
    this._sync(); // in der Geste wecken (stumm: bleibt angehalten, bis der Ton angeht)
    this._startShimmer();
  },

  /**
   * Was die Seite länger anhält, nur an einer ruhigen Stelle (ruhe): vor der Enthüllung des Startbildschirms (wartet auf
   * die Schrift) gleich, sonst an der nächsten (nach der Enthüllung, im Prolog beim Warten auf Tippen …), dann im
   * Leerlauf. Ohne Startbildschirm sofort.
   */
  _quiet(f) {
    if (!ui.intro.classList.contains('go') && flow.state === 'intro') f();
    else ruhe.warte().then(() => whenIdle(() => (ruhe.jetzt() ? f() : this._quiet(f))));
  },

  /**
   * Hintergrund: kein Dauerton, sondern vereinzelte, leise Glastöne mit langem Hall –
   * wie Lichtreflexe im Raum. Alle paar Sekunden ein Ton, manchmal ein zweiter dazu.
   */
  _startShimmer() {
    this._shimmerOn = true;
    this._shimmerResume();
  },
  /**
   * Nächsten Glitzerton planen. Im Hintergrund-Tab oder stumm ruht der Zeitgeber ganz (kein Ton zu hören, der Kontext
   * steht dann ohnehin); _sync plant wieder, sobald der Tab sichtbar bzw. der Ton an ist.
   */
  _shimmerResume(delay = 2000) {
    if (!this._shimmerOn || this._shimmerTimer || this.muted || document.hidden) return;
    const tick = () => {
      this._shimmerTimer = 0;
      if (this.muted || document.hidden) return; // ruhen bis _sync
      if (this.ctx.state === 'running') {
        const pick = () => SHIMMER_HZ[Math.floor(Math.random() * SHIMMER_HZ.length)];
        const opts = { gain: 0.012 + Math.random() * 0.01, attack: 0.02, decay: 3.5 + Math.random() * 1.5,
          partials: [[1, 1], [2.76, 0.12]], wet: 1.2 };
        this._bell(pick(), opts);
        if (Math.random() < 0.35) this._bell(pick(), { ...opts, when: 0.25 + Math.random() * 0.5, gain: opts.gain * 0.7 });
      }
      this._shimmerResume(2500 + Math.random() * 4000);
    };
    this._shimmerTimer = setTimeout(tick, delay);
  },

  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem(this.storageKey, m ? '1' : '0'); } catch { /* egal */ }
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.08);
    this._sync();
  },

  /**
   * Kontext laufen lassen oder anhalten: stumm oder Tab im Hintergrund → suspend (spart CPU).
   * Weckt auch iOS' "interrupted" (Anruf, App-Wechsel).
   */
  _sync() {
    if (!this.ctx) return;
    const run = !this.muted && !document.hidden;
    clearTimeout(this._suspendTimer);
    if (run && this.ctx.state !== 'running') this.ctx.resume();
    // erst nach dem Ausblenden anhalten, sonst knackt es
    if (!run && this.ctx.state === 'running') this._suspendTimer = setTimeout(() => this.ctx.suspend(), 300);
    if (run) this._shimmerResume(); // Glitzern ruhte (Tab verborgen oder stumm)
  },

  /** Eigener Ausgang für eine Tonfolge, die sich als Ganzes abbrechen lässt (Lösungsmoment). */
  bus() {
    if (!this.ctx) return null;
    const dry = this.ctx.createGain(), wet = this.ctx.createGain();
    dry.connect(this.dry); wet.connect(this.wet);
    return {
      dry, wet,
      fadeOut: () => {
        const t = this.ctx.currentTime;
        dry.gain.setTargetAtTime(0, t, 0.05); wet.gain.setTargetAtTime(0, t, 0.05);
        setTimeout(() => { dry.disconnect(); wet.disconnect(); }, 600); // Knoten freigeben
      },
    };
  },

  /**
   * Glockenartiger Ton aus wenigen Teiltönen.
   * partials: [[Verhältnis, Lautstärke], …] · decay: Abklingzeit (s) · wet: Hallanteil
   */
  _bell(hz, { when = 0, gain = 0.1, attack = 0.005, decay = 1.8, partials = [[1, 1]], wet = 0.5, out = null } = {}) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime + when;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + attack);
    env.gain.exponentialRampToValueAtTime(1e-4, t + attack + decay);
    const send = ctx.createGain();
    send.gain.value = wet;
    env.connect(out ? out.dry : this.dry);
    env.connect(send).connect(out ? out.wet : this.wet);
    for (const [ratio, g] of partials) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.frequency.value = hz * ratio;
      og.gain.value = g;
      o.connect(og).connect(env);
      o.start(t);
      o.stop(t + attack + decay + 0.05);
    }
  },

  /** Drehen: kurzer, glasiger Klang (unharmonische Teiltöne wie bei angeschlagenem Glas). */
  rotate() {
    const hz = GLASS_HZ[Math.floor(Math.random() * GLASS_HZ.length)];
    this._bell(hz, { gain: 0.035, decay: 0.45, partials: [[1, 1], [2.76, 0.3], [5.4, 0.1]], wet: 0.8 });
  },

  /** Ein Schritt der Führung ist geschafft (fuehrung.geschafft): zwei leise, helle Glockentöne aufwärts. */
  schritt() {
    const glocke = [[1, 1], [2, 0.14]];
    this._bell(STERN_HZ[3], { gain: 0.026, attack: 0.004, decay: 1.1, partials: glocke, wet: 0.7 });
    this._bell(STERN_HZ[5], { when: 0.09, gain: 0.02, attack: 0.004, decay: 1.4, partials: glocke, wet: 0.8 });
  },

  /** Ziel getroffen: Ton passend zur Farbe. */
  hit(color, when = 0, { octave = 1, gain = 0.07, out = null } = {}) {
    const hz = TONE_HZ[color];
    if (hz) this._bell(hz * octave, { when, gain, out, decay: 2.2, partials: [[1, 1], [2, 0.22], [3.01, 0.06]] });
  },

  /**
   * Ein Stern des Kleinen Wagens erwacht (k: 1 … 6, STERN_HZ): ein leiser Glockenton mit unharmonischem Teilton, lang
   * und mit viel Hall. k = 7: der Schlusston des Polarsterns im Finale (POLAR_HZ), voller und länger.
   */
  stern(k, when = 0, { gain = 0.05, out = null } = {}) {
    const glocke = [[1, 1], [2, 0.2], [2.76, 0.12], [5.4, 0.04]];
    if (k === wagen.polarstern) {
      for (const [hz, g] of POLAR_HZ) {
        this._bell(hz, { when, gain: gain * 1.2 * g, out, attack: 0.006, decay: 5.5, wet: 0.9, partials: glocke });
      }
      return;
    }
    const hz = STERN_HZ[k - 1];
    if (hz) this._bell(hz, { when, gain, out, attack: 0.004, decay: 3.6, wet: 0.9, partials: glocke });
  },

  /** Level gelöst: Akkord aus allen getroffenen Tönen, getragen von einem tiefen A. */
  chord(colors, when = 0, out = null) {
    const tones = [...new Set(colors.map(c => TONE_HZ[c]).filter(Boolean))];
    const g = 0.09 / Math.sqrt(tones.length + 1);
    for (const hz of tones) {
      this._bell(hz, { when, out, gain: g, attack: 0.06, decay: 4.5, partials: [[1, 1], [2, 0.3], [0.5, 0.25]], wet: 0.7 });
      this._bell(hz * 2, { when: when + 0.04, out, gain: g * 0.35, attack: 0.03, decay: 3.0, wet: 0.9 });
    }
    this._bell(110, { when, out, gain: g * 1.2, attack: 0.1, decay: 5, partials: [[1, 1], [2, 0.4]], wet: 0.6 });
  },
};
try { audio.muted = localStorage.getItem(audio.storageKey) === '1'; } catch { /* Standard: Ton an */ }
document.addEventListener('visibilitychange', () => audio._sync());
// Vorbereiten, sobald das erste Bild steht (ui und introCalm gibt es dann)
requestAnimationFrame(() => setTimeout(() => audio._quiet(() => audio.prepare()), 0));

/* =====================================================================
   LÖSUNGSMOMENT — die Ziele leuchten nacheinander auf (mit ihren Tönen),
   dann erklingt der Akkord: Bloom pulsiert, eine Lichtwelle läuft über die
   Platte und es regnet Funken in den Zielfarben. Danach "Level gelöst".
   Im Würfel ist die Welle eine Kugelschale aus der Würfelmitte (der Rahmen
   leuchtet auf, wenn sie ihn durchquert) und die Funken sprühen aus den Zielen.
   ===================================================================== */

const CELEBRATE = {
  step: 0.2,          // Sekunden zwischen dem Aufleuchten zweier Ziele
  chordPause: 0.12,   // nach dem letzten Ziel bis zum Akkord
  panelDelay: 1.2,    // nach dem Akkord bis "Level gelöst"
  bloomBoost: 1.1,    // Bloom-Stärke steigt kurz um diesen Faktor
  shockSpeed: SHOCK_SPEED, // Welteinheiten pro Sekunde
  shockWidth: 0.16,
  shockReach: PLATE * 0.72, // läuft bis über die Plattenecken
  shellReach: 1.1,    // Würfel: Kugelschale bis 1.1 × Kantenlänge (über die Ecken bei 0.87)
  particles: 300,
};

/** Funkenregen: CPU-animierte Punkte, additiv; nur aktiv, solange Funken leben. */
function createSparkRain(count) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), alpha = new Float32Array(count);
  const size = new Float32Array(count);
  const rand = mulberry32(23);
  for (let i = 0; i < count; i++) size[i] = 0.6 + rand() * 1.0;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aAlpha;
      attribute float aSize;
      uniform float uPixelRatio;
      varying vec3 vColor;
      void main() {
        vColor = aColor * aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aAlpha <= 0.0 ? 0.0 : aSize * 2.6 * uPixelRatio * (20.0 / -mv.z);
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.0, length(c));
        gl_FragColor = vec4(vColor * a * a, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.visible = false;
  points.layers.set(LAYER_NO_REFLECT);
  points.raycast = () => {};
  scene.add(points);
  const sparks = Array.from({ length: count }, () => ({ life: 0, max: 1, vx: 0, vy: 0, vz: 0 }));
  return {
    points, sparks, alive: 0, rand,
    drag: 0, // Luftwiderstand (1/s): nur beim Feuerwerk im Würfel
    /** Funken über dem Feld verteilen; sie starten gestaffelt (delay) und fallen sanft. */
    burst(colors) {
      this.drag = 0;
      const p = geo.attributes.position.array, cl = geo.attributes.aColor.array;
      for (let i = 0; i < count; i++) {
        const s = sparks[i], c = COLOR_RGB[colors[i % colors.length]];
        p[i * 3] = (rand() - 0.5) * BOARD * 1.05;
        p[i * 3 + 1] = 0.9 + rand() * 2.0; // knapp über dem Feld – höher wirkt es wie ein Sternenhimmel
        p[i * 3 + 2] = (rand() - 0.5) * BOARD * 1.05;
        s.vx = (rand() - 0.5) * 0.25; s.vz = (rand() - 0.5) * 0.25; s.vy = -(0.25 + rand() * 0.5);
        s.max = 2.0 + rand() * 1.6;
        s.life = -rand() * 0.9; // negativ = wartet noch
        const hot = 1.0 + rand() * 1.2; // HDR: die hellsten Funken blühen
        cl[i * 3] = c.r * hot; cl[i * 3 + 1] = c.g * hot; cl[i * 3 + 2] = c.b * hot;
      }
      geo.attributes.aColor.needsUpdate = true;
      this.alive = count;
      points.visible = true;
    },
    /**
     * Würfel: Feuerwerk – aus jedem Ziel (origins, Weltpositionen) sprühen Funken seiner Farbe in alle Richtungen,
     * werden von der Luft gebremst und sinken dann ab.
     */
    burstFrom(origins, colors) {
      this.drag = 1.8;
      const p = geo.attributes.position.array, cl = geo.attributes.aColor.array;
      for (let i = 0; i < count; i++) {
        const s = sparks[i], k = i % origins.length, o = origins[k], c = COLOR_RGB[colors[k]];
        const u = rand() * 2 - 1, phi = rand() * 2 * Math.PI, ring = Math.sqrt(1 - u * u), v = 2.5 + rand() * 3.0;
        s.vx = ring * Math.cos(phi) * v; s.vy = u * v + 0.5; s.vz = ring * Math.sin(phi) * v;
        p[i * 3] = o.x; p[i * 3 + 1] = o.y; p[i * 3 + 2] = o.z;
        s.max = 1.6 + rand() * 1.4;
        s.life = -rand() * 0.12;
        const hot = 1.0 + rand() * 1.2;
        cl[i * 3] = c.r * hot; cl[i * 3 + 1] = c.g * hot; cl[i * 3 + 2] = c.b * hot;
      }
      geo.attributes.aColor.needsUpdate = true;
      this.alive = count;
      points.visible = true;
    },
    update(dt, t) {
      if (!this.alive) return;
      const p = geo.attributes.position.array, a = geo.attributes.aAlpha.array;
      let alive = 0;
      for (let i = 0; i < count; i++) {
        const s = sparks[i];
        if (s.life >= s.max) { a[i] = 0; continue; }
        s.life += dt;
        alive++;
        if (s.life < 0) { a[i] = 0; continue; }
        if (this.drag) { const f = Math.exp(-this.drag * dt); s.vx *= f; s.vy *= f; s.vz *= f; }
        s.vy -= 0.35 * dt; // leichte Schwerkraft, die Luft bremst
        p[i * 3] += (s.vx + Math.sin(t * 1.3 + i) * 0.08) * dt;
        p[i * 3 + 1] += s.vy * dt;
        p[i * 3 + 2] += s.vz * dt;
        if (p[i * 3 + 1] < 0.03) { p[i * 3 + 1] = 0.03; s.vy = 0; s.vx *= 0.5; s.vz *= 0.5; } // am Boden verglühen
        const k = s.life / s.max;
        const twinkle = 0.75 + 0.25 * Math.sin(t * 17 + i * 3.1);
        a[i] = Math.min(1, s.life * 6) * (1 - k * k) * twinkle;
      }
      this.alive = alive;
      points.visible = alive > 0;
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
      mat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    },
    stop() { for (const s of sparks) if (s.life < 0) s.life = s.max; }, // wartende Funken verwerfen
  };
}

/**
 * Würfel: Lichtwelle als Kugelschale aus der Würfelmitte. Leuchtet am Rand (Fresnel), innen kaum – so bleibt der
 * Würfel durch sie hindurch sichtbar. Wo sie die Platte schneidet, läuft der Bodenring der 2D-Welle mit.
 */
function createShockShell() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color() }, uStrength: { value: 0 } },
    vertexShader: `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = cameraPosition - wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float rim = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        gl_FragColor = vec4(uColor * pow(rim, 5.0) * 2.4 * uStrength, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
  });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), mat);
  shell.visible = false;
  shell.frustumCulled = false;
  shell.raycast = () => {};
  shell.layers.set(LAYER_NO_REFLECT);
  boardGroup.add(shell);
  return shell;
}

const celebration = {
  active: false,
  t: 0,
  chordAt: 0,
  steps: [],          // [{ obj, at, done }]
  chordDone: false,
  panelShown: false,
  colors: [],
  rain: createSparkRain(CELEBRATE.particles),
  shell: createShockShell(),

  start(targets) {
    // Reihenfolge: von links hinten nach rechts vorn – eine Welle wie beim Levelwechsel
    const order = [...targets].sort((a, b) => waveDelay(a.userData.element) - waveDelay(b.userData.element));
    this.steps = order.map((obj, i) => ({ obj, at: i * CELEBRATE.step, done: false }));
    this.chordAt = (order.length - 1) * CELEBRATE.step + CELEBRATE.chordPause;
    this.colors = order.map(o => o.userData.element.color);
    this.t = 0;
    this.active = true;
    sceneLoop.wake();
    this.chordDone = this.panelShown = false;
    // Hell, etwas höher als beim Treffer: die Ziele "antworten" nacheinander
    // Eigener Ausgang: beim Abbrechen verstummen auch die schon geplanten Töne und der Akkord
    if (this.sound) this.sound.fadeOut();
    const out = this.sound = audio.bus();
    this.steps.forEach((s) => audio.hit(s.obj.userData.element.color, s.at, { octave: 2, gain: 0.04, out }));
    audio.chord(this.colors, this.chordAt, out);
    adaptiveResolution.hold(this.chordAt + 3); // Funken und Bloom-Puls nicht als Leistungsproblem werten
  },

  cancel() {
    if (this.active && this.sound) { this.sound.fadeOut(); this.sound = null; }
    this.active = false;
    this.rain.stop();
    this.endWave();
    bloomPass.strength = LOOK.bloomStrength;
  },
  /** Lichtwelle aus: Bodenring, Kugelschale und Leuchten des Würfelrahmens. */
  endWave() {
    shockUniforms.uShock.value.y = 0;
    this.shell.visible = false;
    cubeView.glow(0);
  },

  update(dt, t) {
    this.rain.update(dt, t);
    if (!this.active) return;
    this.t += dt;
    for (const s of this.steps) if (!s.done && this.t >= s.at) { s.done = true; s.obj.userData.flash = 1; }
    if (!this.chordDone && this.t >= this.chordAt) {
      this.chordDone = true;
      arbeit.merke('Lichtwelle');
      if (cubeView.size) this.rain.burstFrom(this.steps.map(s => s.obj.userData.gem.getWorldPosition(new THREE.Vector3())), this.colors);
      else this.rain.burst(this.colors);
      // Wellenfarbe: Mischung der Zielfarben, hell genug zum Blühen
      const c = shockUniforms.uShockColor.value.setRGB(0, 0, 0);
      for (const k of this.colors) c.add(COLOR_RGB[k]);
      c.multiplyScalar(1 / this.colors.length).lerp(WHITE, 0.25).multiplyScalar(0.5);
    }
    const tc = this.t - this.chordAt;
    if (tc >= 0) {
      // Bloom: schneller Anstieg, weiches Abklingen
      const env = tc < 0.12 ? tc / 0.12 : Math.exp(-(tc - 0.12) * 2.0);
      bloomPass.strength = LOOK.bloomStrength * (1 + CELEBRATE.bloomBoost * env);
      const r = tc * CELEBRATE.shockSpeed;
      let fade;
      if (cubeView.size) {
        // Würfel: Kugelschale aus der Mitte bis über die Ecken; am Boden ihr Schnittkreis, der Rahmen leuchtet auf,
        // während sie ihn durchquert (Flächenmitten bei ext/2, Ecken bei ext·√3/2)
        const ext = cubeView.size * CELL, h = cubeView.height * CELL / 2;
        fade = Math.max(0, 1 - r / (ext * CELEBRATE.shellReach));
        this.shell.visible = fade > 0;
        this.shell.position.set(0, h, 0);
        this.shell.scale.setScalar(Math.max(r, 0.01));
        this.shell.material.uniforms.uColor.value.copy(shockUniforms.uShockColor.value);
        this.shell.material.uniforms.uStrength.value = fade * fade;
        const foot = r > h ? Math.sqrt(r * r - h * h) : 0;
        shockUniforms.uShock.value.set(foot, r > h ? fade * fade : 0, CELEBRATE.shockWidth * (1 + foot * 0.12));
        cubeView.glow(THREE.MathUtils.smoothstep(r, ext * 0.4, ext * 0.5) * (1 - THREE.MathUtils.smoothstep(r, ext * 0.6, ext * 0.95)));
      } else {
        fade = Math.max(0, 1 - r / CELEBRATE.shockReach);
        shockUniforms.uShock.value.set(r, fade * fade, CELEBRATE.shockWidth * (1 + r * 0.12));
      }
      if (!this.panelShown && tc >= CELEBRATE.panelDelay) {
        this.panelShown = true;
        ui.showSolved(game.levelIndex, flow.solveStats);
      }
      if (fade <= 0 && env < 0.01 && this.panelShown) {
        this.active = false;
        this.endWave();
        bloomPass.strength = LOOK.bloomStrength;
      }
    }
  },
};

/* =====================================================================
   LEVELFLUSS — Übergänge zwischen den Leveln.
   Beim Wechsel versinken die Elemente als Welle (diagonal über das Feld) im
   Stein, das neue Feld wächst in derselben Welle heraus, dann wachsen die Strahlen.
   ===================================================================== */

const FLOW = {
  outDuration: 0.4,  // Versinken eines Elements
  inDuration: 0.6,   // Herauswachsen eines Elements
  wave: 0.035,       // Versatz je Diagonalschritt (x + z) der Welle
};
const easeInCubic = (x) => x * x * x;
const easeOutBack = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const NO_LIGHT = { segments: [], events: [] }; // leeres Strahlergebnis: alles blendet aus
/**
 * Die Würfel-Level hängen im Spiel hinter den 2D-Leveln (seit Noas Geschichte liegen sie im Vorrat, tools/vorrat.mjs;
 * zurückgeholt zeigt sie die Testschnittstelle zeige). In src/logik.js bleibt LEVELS ohne sie – Tests, Golden-Test und
 * die Werkzeuge der Levelliste sehen nur die 2D-Level.
 */
const CUBE_START = LEVELS.length;
LEVELS.push(...LEVELS_3D);
/**
 * Anzeige der Grade (Feld grad in LEVELS): volle Punkte von GRAD_PUNKTE (●○○○ … ●●●●) und Text in der Kopfzeile, für
 * Screenreader als Text (das Menü hat dieselben Grade und Namen, createMenu). Das Tutorial hat keinen Grad und keine
 * Anzeige.
 */
const GRAD_PUNKTE = 4;
const GRAD_ANZEIGE = {
  'leicht': { label: 'Leicht', punkte: 1 },
  'mittel': { label: 'Mittel', punkte: 2 },
  'schwer': { label: 'Schwer', punkte: 3 },
  'sehr schwer': { label: 'Sehr schwer', punkte: 4 },
};
/** Füllt ein .tier-Element für ein Level mit Punkten und Text; ohne Grad (Tutorial) bleibt es leer und versteckt. */
function fillTier(el, lvl) {
  const d = GRAD_ANZEIGE[lvl.grad];
  el.hidden = !d;
  el.replaceChildren();
  if (!d) return;
  const pips = document.createElement('span'), label = document.createElement('span');
  pips.className = 'pips';
  pips.setAttribute('aria-hidden', 'true');
  for (let k = 0; k < GRAD_PUNKTE; k++) {
    const punkt = document.createElement('i');
    if (k < d.punkte) punkt.className = 'on';
    pips.appendChild(punkt);
  }
  label.className = 'label';
  label.textContent = d.label;
  el.append(pips, label);
}
const flow = {
  state: 'intro', // intro | play | out | in
  t: 0,           // Zeit seit Beginn des aktuellen Übergangs
  next: 0,        // Ziel-Level beim Versinken
  solved: false,  // Lösungsmoment für das aktuelle Feld schon ausgelöst
  record: null,   // neue Bestmarke beim Lösen ({ neueBestzeit, wenigerDrehungen }, story.markSolved) für «Gelöst»
};
const waveDelay = (el) => (el.x + el.z + (el.y || 0)) * FLOW.wave; // Würfel: die Welle steigt auch nach oben
/** Dauer der Welle über ein Feld (Level oder Board; Würfel: drei Achsen, in der Höhe so viele Ebenen wie height). */
const waveLength = (b = game.board) => (2 * ((b.size || 7) - 1)
  + (b.dim === 3 ? (b.height || b.size || 7) - 1 : 0)) * FLOW.wave;

/**
 * Speicherstand von Noas Geschichte (Spec .scratch/noa-geschichte/, «Speicherstand»): je Grad unter prisma.noa.<grad>
 * (Leerzeichen als Bindestrich: prisma.noa.sehr-schwer) ein JSON { platz, geloest, gesehen, geschafft }. platz: das
 * Level, das dran ist (0 … 59 im Durchgang des Grads); geloest: die gelösten Level (Namen, nicht Plätze); gesehen: die
 * Momente, die nur beim ersten Mal kommen (prolog, angebot, dorf und die Einstiege in die Welten unter der Kennung
 * ihrer Station, etwa meer); geschafft: das Finale ist gesehen. Weitere Felder bleiben beim Speichern erhalten
 * (gespielt; dorf, das Kapitel «Im Dorf», prüft story.setGrade über storyDorfStand). Die Bestwerte je Level liegen
 * daneben unter prisma.noa.<grad>.bestwerte (best, noteBest), damit sie «Von vorn» überleben (Entscheid 27). Dazu der
 * zuletzt gespielte Grad unter prisma.noa.zuletzt. Die alten Schlüssel (prisma.solvedLevels, prisma.current,
 * prisma.sky, prisma.signal, prisma.signal.seen) liest das Spiel nicht mehr und löscht sie nicht.
 */
const progress = {
  keyOf: (grad) => `prisma.noa.${grad.replaceAll(' ', '-')}`,
  lastKey: 'prisma.noa.zuletzt',
  read(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  write(key, value) {
    try { localStorage.setItem(key, value); } catch { /* privates Fenster o. Ä. */ }
  },
  /** Stand eines Grads (count: Zahl der Level seines Durchgangs); fehlt er oder ist er unlesbar, von vorn. */
  load(grad, count) {
    let s = null;
    try { s = JSON.parse(this.read(this.keyOf(grad)) || 'null'); } catch { /* von vorn */ }
    if (!s || typeof s !== 'object' || Array.isArray(s)) s = {};
    const namen = (a) => (Array.isArray(a) ? a.filter(x => typeof x === 'string') : []);
    const platz = Number.isInteger(s.platz) && s.platz >= 0 && s.platz < count ? s.platz : 0;
    return { ...s, platz, geloest: namen(s.geloest), gesehen: namen(s.gesehen), geschafft: s.geschafft === true };
  },
  save(grad, stand) { this.write(this.keyOf(grad), JSON.stringify(stand)); },
  /**
   * «Von vorn» im Menü: den Stand nur dieses Grads löschen (Entscheid 19); der zuletzt gespielte Grad und die
   * Bestwerte bleiben (Entscheid 27).
   */
  remove(grad) {
    try { localStorage.removeItem(this.keyOf(grad)); } catch { /* privates Fenster o. Ä. */ }
  },
  bestKeyOf(grad) { return `${this.keyOf(grad)}.bestwerte`; },
  /**
   * Bestwerte eines Grads (Entscheid 24): je Level (Name) { zeit, drehungen }, zeit in ganzen Sekunden, beide je für
   * sich, auch aus verschiedenen Läufen. Was keine endliche Zahl ≥ 0 ist, fällt weg; unlesbar: keine.
   */
  best(grad) {
    let s = null;
    try { s = JSON.parse(this.read(this.bestKeyOf(grad)) || 'null'); } catch { /* keine */ }
    const gut = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0, alle = {};
    if (!s || typeof s !== 'object' || Array.isArray(s)) return alle;
    for (const [name, w] of Object.entries(s)) {
      const e = {};
      if (gut(w?.zeit)) e.zeit = w.zeit;
      if (gut(w?.drehungen)) e.drehungen = w.drehungen;
      if (Object.keys(e).length) alle[name] = e;
    }
    return alle;
  },
  /**
   * Ein Level gelöst (seconds: Zeit bis zur lösenden Drehung, turns: Drehungen): Bestzeit und wenigste Drehungen je
   * für sich nachführen. Zurück, was besser wurde, für das Feld «Gelöst»; gemeldet nur, wenn es schon einen Wert gab
   * (nicht beim ersten Lösen). Die Zeit zählt in ganzen Sekunden wie die Anzeige: Bleibt sie gleich, ist es keine
   * neue Bestzeit.
   */
  noteBest(grad, name, { seconds, turns }) {
    const alle = this.best(grad), alt = alle[name] ?? {}, zeit = Math.floor(seconds);
    alle[name] = { zeit: Math.min(alt.zeit ?? Infinity, zeit), drehungen: Math.min(alt.drehungen ?? Infinity, turns) };
    this.write(this.bestKeyOf(grad), JSON.stringify(alle));
    return { neueBestzeit: alt.zeit !== undefined && zeit < alt.zeit,
      wenigerDrehungen: alt.drehungen !== undefined && turns < alt.drehungen };
  },
  /** Der zuletzt gespielte Grad (einer aus STORY_LEVELS), sonst null. */
  last() { const g = this.read(this.lastKey); return g !== null && Object.hasOwn(STORY_LEVELS, g) ? g : null; },
  setLast(grad) { this.write(this.lastKey, grad); },
};

/** Level wechseln: altes Feld versinkt, danach wächst das neue heraus. */
function changeLevel(index) {
  if (flow.state === 'intro' || index < 0 || index >= LEVELS.length) return;
  if (flow.state === 'story' && !story.holdEnter) return; // die Geschichte führt gerade (story.sinkTo darf)
  flow.next = index;
  prepareLevel(index); // die Elemente schon während des Versinkens bauen
  if (flow.state === 'out') return; // versinkt schon – nur das Ziel-Level ändert sich
  sceneLoop.wake();
  flow.state = 'out';
  flow.t = 0;
  flow.solved = false;
  cameraGoHome(); // das neue Feld erscheint wieder aus der Ausgangsansicht
  celebration.cancel();
  ui.hideSolved();
  ui.hideHud();
  // Elemente versinken aus ihrer aktuellen Höhe (auch mitten im Herauswachsen)
  for (const obj of game.objects.values()) obj.userData.appearFrom = obj.scale.x;
  setHovered(null);
  clearTimeout(input.longPressTimer);
  if (input.pointer) input.pointer.el = null;
  beamView.update(NO_LIGHT); // alle Strahlen blenden aus
  // Leuchtkörper erlöschen mit ihren Strahlen (sie hängen an den alten Ereignis-Datensätzen)
  for (const obj of game.objects.values()) {
    const u = obj.userData;
    if (u.element.type === 'target') { u.satisfied = false; u.arrivals = []; }
    if (u.events) u.events = [];
  }
  adaptiveResolution.hold(FLOW.outDuration + waveLength() + 0.2); // Schatten-Updates jeden Frame
}

/** Level neu starten (Knopf, R); während des Versinkens zählt das bereits gewählte Ziel-Level. */
function restartLevel() {
  fuehrung.neustart();
  changeLevel(flow.state === 'out' ? flow.next : game.levelIndex);
}

/** Neues Level aufbauen und als Welle herauswachsen lassen. */
function enterLevel(index) {
  sceneLoop.wake();
  flow.state = 'in';
  flow.t = 0;
  flow.solved = false;
  flow.record = null;
  loadLevel(index, FLOW.inDuration + waveLength(LEVELS[index])); // erst wenn alles steht
  for (const obj of game.objects.values()) obj.scale.setScalar(1e-3);
  fuehrung.neu(index); // beim ersten Schritt (auch nach Neustart und Neuladen)
  ui.showHud(index);
}

/**
 * Einmalig: Shader, die erst später gebraucht werden (Hover-Lichtrand, Funkenregen), jetzt kompilieren.
 * Sonst stockt genau der erste Tipp bzw. der erste Lösungsmoment (auf Mobil-GPUs 10–50 ms).
 */
let shadersWarm = false;
function warmupShaders() {
  if (shadersWarm) return;
  shadersWarm = true;
  const obj = [...game.objects.values()].find(o => o.userData.warmup);
  // stösst in Häppchen an (übersetzt im Hintergrund; in einem Stück hielt es ein Bild auf dem gedrosselten Handy 95 ms
  // an, Ticket 09): der Zustand gilt nur je Häppchen, dazwischen ist er wie vorher
  const warm = () => {
    obj?.userData.warmup(true);
    celebration.rain.points.visible = true;
    return () => {
      obj?.userData.warmup(false);
      celebration.rain.points.visible = celebration.rain.alive > 0;
    };
  };
  compileParallel([scene], { variants: [warm], slices: true, was: 'Level: Shader' });
  // die unsichtbaren Vorwärm-Elemente jeder Art (am Ende, vor compileParallel) bleiben: Sonst übersetzte das erste
  // Level mit einer neuen Art seine Shader mitten im Fall des Lichts (ein Ruck)
}

/** Pro Frame: Übergänge animieren und den Lösungsmoment auslösen bzw. zurücknehmen. */
function updateFlow(dt) {
  if (flow.state === 'intro' || flow.state === 'story') return; // story: die Geschichte führt (Zwischenszene, Karte)
  if (flow.state === 'play') {
    const lit = game.result.solved && game.targets.every(o => o.userData.hit > 0.85);
    if (lit && !flow.solved) {
      flow.solved = true;
      // bis zur lösenden Drehung, nicht bis die Ziele sichtbar leuchten; Drehungen danach zählen nicht mehr
      const st = game.stats;
      flow.solveStats = { turns: st.turns, seconds: st.startedAt === null ? 0 : (st.lastTurnAt - st.startedAt) / 1000 };
      flow.record = story.markSolved(game.levelIndex, flow.solveStats); // neue Bestmarke für «Gelöst»
      celebration.start(game.targets);
    } else if (!game.result.solved && flow.solved) { // wieder verdreht
      flow.solved = false;
      celebration.cancel();
      ui.hideSolved();
    }
    return;
  }
  flow.t += dt;
  const out = flow.state === 'out';
  const dur = out ? FLOW.outDuration : FLOW.inDuration;
  for (const obj of game.objects.values()) {
    const k = Math.min(1, Math.max(0, (flow.t - waveDelay(obj.userData.element)) / dur));
    const s = out ? obj.userData.appearFrom * (1 - easeInCubic(k)) : easeOutBack(k);
    obj.scale.setScalar(Math.max(s, 1e-3)); // nie ganz 0: sonst entartete Normalenmatrix
  }
  markShadowsDirty();
  if (flow.t >= dur + waveLength()) {
    if (out && story.holdEnter) story.sunk(); // Geschichte: das neue Level wächst erst nach ihrer Zwischenszene
    else if (out) enterLevel(flow.next);
    else {
      flow.state = 'play';
      warmupShaders();
      fuehrung.start();
      // drehbare Elemente leuchten einmal kurz auf – als Welle wie beim Herauswachsen
      for (const obj of game.objects.values()) obj.userData.startPulse?.(waveDelay(obj.userData.element) * 1.5);
    }
  }
}

/* =====================================================================
   UI — Kopfzeile, kleine Schaltflächen, "Level gelöst", Startbildschirm. Alles DOM über der Szene; Klicks darauf
   erreichen den Canvas nicht und drehen daher nichts.
   ===================================================================== */

const $ = (id) => document.getElementById(id);
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;

/**
 * Führung im Dorf (Spec .scratch/tutorial-fuehrung/, neu gestaltet mit .scratch/tutorial-neu/): zeigt die Schritte
 * einer Übung (LEVELS[i].schritte), wartet auf die Handlung des Spielers und geht dann weiter. Der Satz steht im Band
 * unten (#band), mit Punkten für den Fortschritt der Übung und bei einer Erklärung «Weiter»; Hinweise nebenbei klein
 * darüber. Die Szene ist leicht abgedunkelt, ein Lichtkegel liegt auf jedem Element des Schritts; bei einem
 * Handlungsschritt zeigt die Hand seine Geste sofort vor, nach FUEHRUNG.handPause s ohne Fortschritt wieder, bis der
 * Schritt geschafft ist (Wunsch des Nutzers nach dem Poco-Test).
 * Strikt (Sperre): Bei einem Handlungsschritt reagieren nur seine Elemente (darf, vorrang; schrittErlaubt), alle
 * anderen weigern sich (weigern, auch drehbare); bei einer Erklärung ist das ganze Brett gesperrt bis «Weiter». Kamera,
 * Knöpfe, Menü, Übersicht, Ton, Neustart und «Dorf überspringen» bleiben frei. Ohne Führung ist nichts gesperrt.
 * Rückmeldung: Ist ein Schritt geschafft, füllt sich sein Punkt, ein leiser Ton (audio.schritt, nur bei Ton an); nach FUEHRUNG.wechsel s blendet der nächste weich ein (Satz,
 * Lichtkegel, Hand). Die Sperre gilt in der Zeit dazwischen schon für den neuen Schritt. Fehlversuche bleiben ohne
 * Tadel. Der letzte Schritt endet erst mit dem Lösen; gelöst wird nie von selbst. Wird die Übung früher gelöst, gilt
 * das sofort: Die restlichen Schritte entfallen, nichts bleibt stehen.
 * Jedes neue Brett (enterLevel: Neustart, Neuladen, nächster Grad, aus der Übersicht) beginnt beim ersten Schritt;
 * Menü und Übersicht (hideHud, showHud) behalten ihn. Kein Speicherstand.
 * Anschlüsse: gedreht (rotateElement), angetippt (weigern: ein Schritt «antippen» eines festen Elements wartet darauf),
 * kamera (dragCamera, zoomCamera), neustart (restartLevel), start (das Brett steht), darf und vorrang (Eingabe:
 * rotatableOnly, pickElement, weigern), platziere (je Bild, solange über dem Brett etwas zu sehen ist).
 */
const FUEHRUNG = {
  hand: { tippen: 2.6, zurueck: 3.6 }, // s: so lange zeigt die Hand die Geste zu Beginn eines Schritts vor
  handPause: 5,                        // s: so lange bleibt die Hand weg, bis sie die Geste noch einmal vorzeigt
  kuppe: 0.42,                         // Höhe über dem Brett, wo die Fingerkuppe aufsetzt (Welt)
  wechsel: 0.6,                        // s nach einem geschafften Schritt, bis der nächste weich einblendet
  // Lichtkegel: Halbmesser um das Element (Welt; die Zelle misst CELL) in der Höhe hoehe über dem Brett; bis innen
  // (Anteil des Halbmessers) ganz hell, dann weich ins Abdunkeln (dunkel: Deckkraft über der übrigen Szene)
  kegel: { radius: 0.78, hoehe: 0.3, innen: 0.55, dunkel: 0.52 }, // dunkel 0,46 → 0,52 nach dem Poco-Test
};

const fuehrung = {
  level: null,        // die geführte Übung (LEVELS[i]) oder null: keine Führung
  board: null,        // ihr Brett; ein neues (enterLevel) beginnt beim ersten Schritt
  schritt: 0,         // Platz in level.schritte; der letzte bleibt bis zum Lösen
  los: false,         // das Brett steht (flow play): Lichtkegel und Hand dürfen erscheinen
  fertig: false,      // gelöst: nichts mehr bis zum nächsten Brett
  wechselt: false,    // ein Schritt ist geschafft, der nächste blendet nach FUEHRUNG.wechsel ein
  vorige: [],         // Zellen des geschafften Schritts: ihr Lichtkegel bleibt, solange es wechselt
  hand: false,        // die Hand zeigt die Geste des Schritts vor (einmal je Schritt)
  vorzeigen: false,   // die Hand hat die Geste des Schritts noch nicht vorgezeigt (unter Menü und Übersicht wartet sie)
  nebenbei: [],       // offene Hinweise nebenbei (Schlüssel in NEBENBEI)
  benutzt: new Set(), // benutzte Hinweise nebenbei der Übung benutztIn: kommen beim Neustart nicht wieder
  benutztIn: -1,
  neustarten: false,  // ein Neustart (restartLevel) kommt: nur dann bleiben die benutzten Hinweise nebenbei weg
  handUhr: 0, wechselUhr: 0, ausUhr: 0, // setTimeout: Ende des Vorzeigens, nächster Schritt, Ebene weg
  sichtbar: false,    // Abdunkeln, Lichtkegel oder Hand zu sehen: platziere je Bild
  kegel: [],          // Lichtkegel { el, loch, schein, x, y, r } (x, y, r in Pixeln des Canvas; platziere)
  kegelZellen: '',    // ihre Zellen (ein neuer Satz Kegel wächst neu auf)
  handZiel: null,     // Element der Hand
  band: null,         // das Band unten (#band, bandTeile)
  bild: null, handEl: null, // Ebene über dem Brett (#fuehrung): Abdunkeln, Lichtkegel, Hand

  /** Läuft die Führung für LEVELS[index] auf dem Brett? */
  fuehrt(index) { return !!this.level && this.level === LEVELS[index] && this.board === game.board; },
  aktiv() { return !!this.level && !this.fertig; },
  /** Der laufende Schritt (null: keiner mehr oder keine Führung). */
  aktuell() { return this.aktiv() ? this.level.schritte[this.schritt] ?? null : null; },
  /** Sperre: Darf el reagieren (drehen, als festes angetippt werden)? Ohne laufende Führung immer. */
  darf(el) { return !this.aktiv() || this.board !== game.board || schrittErlaubt(this.aktuell(), el); },
  /** Für die Auswahl beim Antippen (pickTapped): die Elemente des Schritts gewinnen; ohne Führung null. */
  vorrang() {
    if (!this.aktiv() || this.board !== game.board) return null;
    const s = this.aktuell();
    return (el) => schrittErlaubt(s, el);
  },

  /** Neues Brett (enterLevel): Führung nur für eine Übung im Dorf mit Schritten, beim ersten Schritt. */
  neu(index) {
    const lvl = LEVELS[index];
    const gefuehrt = !!lvl.schritte?.length && story.drives(index) && story.inDorf;
    // benutzte Hinweise nebenbei bleiben nur beim Neustart derselben Übung weg; sonst (nächster Grad, aus der
    // Übersicht) läuft die Führung ganz (Review Ticket 02 Gerüst)
    if (index !== this.benutztIn || !this.neustarten) { this.benutzt.clear(); this.benutztIn = index; }
    this.neustarten = false;
    this.level = gefuehrt ? lvl : null;
    this.board = game.board;
    this.schritt = 0;
    this.los = this.fertig = this.wechselt = this.hand = this.vorzeigen = false;
    this.vorige = [];
    this.nebenbei = gefuehrt ? (lvl.nebenbei ?? []).filter((n) => !this.benutzt.has(n)) : [];
    this.stoppeUhren();
    this.zeichneBild(true); // das vorige Brett: nichts mehr darüber
    this.zeichneBand();
  },
  /** Das Brett steht (updateFlow): Abdunkeln, Lichtkegel, die Hand zeigt den laufenden Schritt vor. */
  start() {
    if (!this.aktiv() || this.board !== game.board || this.los) return;
    this.los = true;
    this.beginneSchritt();
  },
  /**
   * Schritt beginnen (auch nach dem Weiterschalten, weich: nach FUEHRUNG.wechsel). Trifft der Strahl schon: gleich
   * weiter (nie über den letzten hinaus).
   */
  beginneSchritt(weich = false) {
    const letzter = this.level.schritte.length - 1;
    let s = this.aktuell();
    while (s?.weiter === 'strahl' && this.schritt < letzter
      && schrittErfuellt(s, { art: 'strahl', board: this.board, result: game.result })) {
      this.schritt++;
      s = this.aktuell();
    }
    clearTimeout(this.handUhr);
    clearTimeout(this.wechselUhr);
    this.hand = false;
    this.vorzeigen = !!(s && schrittGeste(s));
    this.wechselt = weich;
    if (weich) {
      this.wechselUhr = setTimeout(() => {
        this.wechselt = false;
        this.zeigeHand();
        this.zeichne();
      }, FUEHRUNG.wechsel * 1000);
    } else this.zeigeHand();
    this.zeichne();
  },
  /**
   * Die Hand zeigt die Geste des laufenden Schritts vor, sobald das Brett steht, der Schritt eingeblendet und zu sehen
   * ist (stand es unter dem Menü fertig, beim Zurückkommen; Review Ticket 02 Gerüst). Danach bleibt sie
   * FUEHRUNG.handPause s weg und zeigt wieder vor, bis der Schritt wechselt (beginneSchritt hält die Uhr an).
   */
  zeigeHand() {
    const s = this.aktuell(), geste = s && schrittGeste(s);
    if (!this.vorzeigen || !this.los || this.wechselt || story.choosing || !geste) return;
    this.vorzeigen = false;
    this.hand = true;
    this.handUhr = setTimeout(() => {
      this.hand = false;
      this.zeichneBild();
      this.handUhr = setTimeout(() => { this.vorzeigen = true; this.zeigeHand(); this.zeichneBild(); },
        FUEHRUNG.handPause * 1000);
    }, FUEHRUNG.hand[geste] * 1000);
  },
  /** Ereignis e (schrittErfuellt) für den laufenden Schritt; schaltet es weiter: true. Der letzte endet mit dem Lösen. */
  ereignis(e) {
    const s = this.aktuell();
    if (!s || this.board !== game.board || !schrittErfuellt(s, e)) return false;
    if (this.schritt >= this.level.schritte.length - 1) return false;
    this.geschafft(s);
    this.schritt++;
    this.beginneSchritt(true);
    return true;
  },
  /** Rückmeldung zum geschafften Schritt s: Ton; den Punkt füllt zeichne. Kein Funkeln (Wunsch des Nutzers nach Ticket 01). */
  geschafft(s) {
    this.vorige = schrittZellen(s);
    audio.schritt();
  },
  /** Ein Element wurde gedreht (rotateElement, nach der neuen Rechnung). */
  gedreht(el, delta) {
    if (!this.aktiv() || this.board !== game.board) return;
    if (game.result.solved) { this.beenden(); return; } // früher gelöst: gilt sofort
    if (!this.ereignis({ art: 'gedreht', el, delta })) this.ereignis({ art: 'strahl', board: this.board, result: game.result });
  },
  /** Ein Element weigert sich (weigern): der Anschluss für einen Schritt «antippen» eines festen Elements. */
  angetippt(el) { if (this.aktiv()) this.ereignis({ art: 'angetippt', el }); },
  /** «Weiter» an einer Erklärung (nicht, solange der nächste Schritt einblendet). */
  weiter() { if (this.aktiv() && !this.wechselt) this.ereignis({ art: 'weiter' }); },
  /** Eine Geste der Kamera (Ziehen, Zoomen): beendet den Hinweis nebenbei zur Kamera. */
  kamera() { if (this.nebenbei.length && this.nebenbei.includes('kamera')) this.nutze('kamera'); },
  /** Neustart der Übung (restartLevel), vor dem neuen Brett. */
  neustart() {
    this.neustarten = true;
    if (this.nebenbei.includes('neustart')) this.nutze('neustart');
  },
  nutze(n) {
    this.benutzt.add(n);
    this.nebenbei = this.nebenbei.filter((m) => m !== n);
    this.zeichneBand();
  },
  /** Gelöst: Schritte und Hinweise nebenbei entfallen, Band, Abdunkeln und Hand gehen weich. */
  beenden() {
    this.fertig = true;
    this.wechselt = this.hand = false;
    this.nebenbei = [];
    this.stoppeUhren();
    this.zeichne();
  },
  stoppeUhren() { clearTimeout(this.handUhr); clearTimeout(this.wechselUhr); },
  /** Kopfzeile ausgeblendet (Menü, Übersicht, Levelwechsel, Zwischenszene): nichts über dem Brett. */
  verbergen() {
    clearTimeout(this.handUhr); // der Wechsel zum nächsten Schritt läuft weiter, die Hand wartet (zeigeHand)
    // mitten im Vorzeigen oder in der Pause danach: beim Zurückkommen zeigt sie noch einmal ganz vor
    if (!this.fertig) this.vorzeigen = true;
    this.hand = false;
    if (this.band?.knopf.contains(document.activeElement)) this.band.knopf.blur(); // das Band ist nur ausgeblendet
    this.zeichneBild(true);
  },
  /** Kopfzeile wieder da (showHud): weiter im selben Schritt. */
  zeigen() {
    this.zeichneBand();
    this.zeigeHand();
    this.zeichneBild();
  },
  zeichne() { this.zeichneBand(); this.zeichneBild(); },

  /** Die Teile des Bands (#band in der Kopfzeile), beim ersten Gebrauch. */
  bandTeile() {
    if (this.band) return this.band;
    const el = $('band');
    const knopf = el.querySelector('.fuehrung-weiter');
    knopf.addEventListener('click', () => this.weiter());
    return this.band = { el, knopf, satz: el.querySelector('.band-satz'), zeile: el.querySelector('.band-zeile'),
      punkte: el.querySelector('.band-punkte'), neben: el.querySelector('.band-neben') };
  },
  /**
   * Das Band: der Satz des Schritts, ein Punkt je Schritt (voll: geschafft, mit Ring: der laufende), «Weiter» an einer
   * Erklärung, darüber die Hinweise nebenbei. Während es wechselt, blendet der Satz aus und mit dem neuen wieder ein
   * (CSS .wechsel). Ohne laufende Führung (gelöst, anderes Brett) blendet es aus und behält dabei seinen Inhalt.
   */
  zeichneBand() {
    const b = this.bandTeile(), schritte = this.level?.schritte ?? [];
    const an = this.aktiv() && this.board === game.board;
    b.el.classList.toggle('aus', !an);
    if (b.punkte.childElementCount !== schritte.length && (an || !schritte.length)) {
      b.punkte.replaceChildren(...schritte.map(() => document.createElement('i')));
    }
    [...b.punkte.children].forEach((p, i) => {
      p.classList.toggle('voll', this.fertig || i < this.schritt);
      p.classList.toggle('jetzt', an && !this.wechselt && i === this.schritt);
    });
    if (!an) return;
    b.zeile.classList.toggle('wechsel', this.wechselt);
    if (!this.wechselt) {
      const s = this.aktuell(), text = geraeteText(s.text, IS_TOUCH);
      if (b.satz.textContent !== text) b.satz.textContent = text;
      b.knopf.hidden = s.weiter !== 'erklaerung';
    } else if (b.knopf.contains(document.activeElement)) b.knopf.blur();
    const neben = this.nebenbei.map((n) => NEBENBEI[n].text[IS_TOUCH ? 0 : 1]).join(' ');
    if (b.neben.textContent !== neben) b.neben.textContent = neben;
    b.neben.hidden = !neben;
  },

  /**
   * Was über dem Brett zu sehen ist: das Abdunkeln mit einem Lichtkegel je Element des Schritts (während es wechselt,
   * die des geschafften), die Hand beim Vorzeigen. aus: sofort nichts (Menü, neues Brett); gelöst blenden Abdunkeln und
   * Kegel weich aus.
   */
  zeichneBild(aus = false) {
    const s = this.aktuell();
    const zeigt = !aus && this.aktiv() && this.los && flow.state === 'play' && !story.choosing
      && this.board === game.board;
    clearTimeout(this.ausUhr);
    if (!zeigt && !this.bild) return;
    if (!this.bild) this.baueBild();
    if (zeigt) {
      const am = (z) => this.board.elements.find((el) => zelleVon(el) === z);
      this.zeigeKegel((this.wechselt ? this.vorige : schrittZellen(s)).map(am).filter(Boolean));
    } else if (aus) this.zeigeKegel([]);
    const geste = zeigt && !this.wechselt ? schrittGeste(s) : null;
    const hand = geste && this.hand ? this.kegel[0]?.el ?? null : null;
    this.handZiel = hand;
    const art = !hand ? '' : geste === 'tippen' ? 'tippen' : IS_TOUCH ? 'halten' : 'rechtsklick';
    if (this.handEl.dataset.art !== art) this.handEl.dataset.art = art;
    this.handEl.style.display = hand ? '' : 'none';
    this.bild.classList.toggle('dunkel', zeigt);
    this.sichtbar = zeigt;
    if (zeigt) {
      this.bild.style.display = '';
      this.platziere();
    }
    if (aus) this.bild.style.display = 'none';
    // gelöst: Abdunkeln und Kegel blenden aus (CSS), danach ist die Ebene weg
    else if (!zeigt) this.ausUhr = setTimeout(() => { this.bild.style.display = 'none'; this.zeigeKegel([]); }, 700);
  },
  /** Lichtkegel auf die Elemente ziele: ein neuer Satz wächst auf (CSS), derselbe bleibt stehen. */
  zeigeKegel(ziele) {
    const key = ziele.map((el) => el.id).join();
    if (key === this.kegelZellen) return;
    this.kegelZellen = key;
    for (const k of this.kegel) { k.loch.remove(); k.schein.remove(); }
    const ns = this.bild.namespaceURI, loecher = this.bild.querySelector('.fz-loecher');
    const scheine = this.bild.querySelector('.fz-scheine');
    this.kegel = ziele.map((el) => {
      const teil = (verlauf) => {
        const g = document.createElementNS(ns, 'g'), c = document.createElementNS(ns, 'circle');
        c.setAttribute('r', '1');
        c.setAttribute('fill', `url(#${verlauf})`);
        c.setAttribute('class', 'fz-kegel');
        g.append(c);
        return g;
      };
      const loch = teil('fz-loch'), schein = teil('fz-schein');
      loecher.append(loch);
      scheine.append(schein);
      return { el, loch, schein, x: 0, y: 0, r: 0 };
    });
    sceneLoop.wake();
  },
  /** Die Ebene #fuehrung (beim ersten Gebrauch): Abdunkeln mit Löchern für die Lichtkegel, die Hand. */
  baueBild() {
    const tmp = document.createElement('div');
    // Zeigehand (Ticket 06, Wahl B des Nutzers): Kuppe des Zeigefingers im Ursprung, die Hand unten rechts, in Pixeln;
    // eingerollte Finger, Daumen, goldener Ärmel. Maus mit der rechten Taste. Die Drehung steht an einer eigenen Gruppe:
    // Die Animationen (transform in CSS) ersetzten sonst die des Attributs
    const form = ['<rect x="-6.5" y="0" width="13" height="36" rx="6.5"/>', '<rect x="5" y="19" width="11.5" height="17" rx="5.75"/>',
      '<rect x="15" y="22" width="11" height="16" rx="5.5"/>', '<rect x="24" y="26" width="9.5" height="14" rx="4.75"/>',
      '<rect x="-8" y="26" width="41" height="32" rx="11"/>',
      '<rect x="-15" y="31" width="10" height="22" rx="5" transform="rotate(-32 -10 42)"/>',
      '<rect x="-4" y="55" width="33" height="10" rx="2"/>'].join('');
    const finger = `<g class="fz-finger"><g class="fz-kontur">${form}</g><g class="fz-flaeche">${form}</g>
      <rect class="fz-aermel" x="-4" y="57" width="33" height="8" rx="2"/><path class="fz-falte" d="M15.7 27V33M25 30V35M-2 6.5H2"/></g>`;
    // Lichtkegel: Im Abdunkeln (Maske: weiss deckt) liegt je Kegel ein Loch, innen ganz offen, aussen weich, nach
    // aussen durchsichtig statt weiss, so stören sich nahe Kegel nicht; darüber ein schwacher warmer Schein
    const k = FUEHRUNG.kegel;
    tmp.innerHTML = `<svg id="fuehrung" aria-hidden="true" style="display: none">
      <defs>
        <radialGradient id="fz-loch"><stop offset="${k.innen}" stop-color="#000"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
        <radialGradient id="fz-schein"><stop offset="0" stop-color="#ffe6b0" stop-opacity="0.12"/>
          <stop offset="${k.innen}" stop-color="#ffd98a" stop-opacity="0.07"/>
          <stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
        <mask id="fz-maske" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
          <rect class="fz-flaeche-maske" width="100%" height="100%" fill="#fff"/><g class="fz-loecher"></g></mask>
      </defs>
      <rect class="fz-dunkel" width="100%" height="100%" mask="url(#fz-maske)" style="--fz-dunkel: ${k.dunkel}"/>
      <g class="fz-scheine"></g>
      <g class="fz-hand">
      <g class="fz-tippen"><circle class="fz-welle" r="22"/><g transform="rotate(-18)">${finger}</g></g>
      <g class="fz-halten"><circle class="fz-ring" r="28" pathLength="100" transform="rotate(-90)"/>
        <g transform="rotate(-18)">${finger}</g></g>
      <g class="fz-rechtsklick"><circle class="fz-welle" r="22"/><g transform="translate(6 6)">
        <path class="fz-maus" d="M0 12A12 12 0 0 1 24 12V26A12 12 0 0 1 0 26Z"/>
        <path class="fz-taste" d="M12 0A12 12 0 0 1 24 12V14H12Z"/><path class="fz-maus" d="M12 0V14H0V12A12 12 0 0 1 12 0Z"/></g></g>
    </g></svg>`;
    this.bild = tmp.firstElementChild;
    this.handEl = this.bild.querySelector('.fz-hand');
    this.handEl.style.display = 'none';
    document.body.insertBefore(this.bild, $('hud')); // unter Kopfzeile und Band, über der Szene
  },
  /** Bildschirmlage (Pixel des Canvas) des Modells obj, hoehe über seiner Mitte (mit seiner Grösse beim Herauswachsen). */
  bildpunkt(obj, hoehe) {
    const v = _fzMitte, w = canvasEl.clientWidth, h = canvasEl.clientHeight;
    obj.getWorldPosition(v);
    v.y += hoehe * obj.scale.x;
    v.project(camera);
    return { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h };
  },
  /**
   * Je Bild, solange sichtbar: Die Lichtkegel und die Hand gehen an die Bildschirmlage ihres Elements (Kamera, Zoom,
   * Herauswachsen), die Kegel in der Grösse des Elements im Bild, die Hand in ihrer eigenen. Gesetzt wird nur, was
   * sich um einen halben Pixel ändert (die Kamera schwebt).
   */
  platziere() {
    if (!this.bild) return;
    const w = canvasEl.clientWidth, h = canvasEl.clientHeight;
    const box = `0 0 ${w} ${h}`;
    if (this.bild.getAttribute('viewBox') !== box) this.bild.setAttribute('viewBox', box);
    camera.updateMatrixWorld();
    const rechts = _fzRechts.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    const rund = (x) => Math.round(x * 2) / 2;
    for (const k of this.kegel) {
      const obj = game.objects.get(k.el.id);
      if (!obj) continue;
      const p = this.bildpunkt(obj, FUEHRUNG.kegel.hoehe);
      // Halbmesser im Bild: ein Punkt um radius nach rechts (in der Ebene des Bildschirms) neben der Mitte
      const v = obj.getWorldPosition(_fzMitte);
      v.y += FUEHRUNG.kegel.hoehe * obj.scale.x;
      v.addScaledVector(rechts, FUEHRUNG.kegel.radius * Math.max(obj.scale.x, 0.01)).project(camera);
      const r = Math.max(4, rund(Math.hypot((v.x + 1) / 2 * w - p.x, (1 - v.y) / 2 * h - p.y)));
      const x = rund(p.x), y = rund(p.y);
      if (x === k.x && y === k.y && r === k.r) continue;
      Object.assign(k, { x, y, r });
      const t = `translate(${x} ${y}) scale(${r})`;
      k.loch.setAttribute('transform', t);
      k.schein.setAttribute('transform', t);
    }
    const obj = this.handZiel && game.objects.get(this.handZiel.id);
    if (!obj) return;
    const p = this.bildpunkt(obj, FUEHRUNG.kuppe);
    const t = `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`;
    if (this.handEl.getAttribute('transform') !== t) this.handEl.setAttribute('transform', t);
  },
};
const _fzMitte = new THREE.Vector3(), _fzRechts = new THREE.Vector3();

/** Sekunden als m:ss bzw. h:mm:ss. */
function formatDuration(seconds) {
  const s = Math.floor(seconds), pad = (n) => String(n).padStart(2, '0');
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/** Bereich ein-/ausblenden; versteckt ist er auch für Tastatur und Screenreader weg (inert). */
function setShown(el, shown) {
  el.classList.toggle('hidden', !shown);
  el.inert = !shown;
  if (!shown && el.contains(document.activeElement)) document.activeElement.blur();
}

/** Der Seitenstart (seitenstart, am Ende des Scripts) hat alles aufgebaut und die Programme der Szene angestossen: Erst
 * dann beginnt die Enthüllung (ui.init), seine Stücke fielen sonst als Rucke in sie */
let markSeitenstart;
const seitenstartAngestossen = new Promise((resolve) => { markSeitenstart = resolve; });

/**
 * Intro ruhig: Strahl, Schriftzug, Farbfächer und Texte sind eingeblendet (CSS #intro: „Klicken zum Starten“ endet
 * 2,9 + 1,2 s nach Beginn der Enthüllung, danach pulsiert es nur noch langsam). Bis dahin ist keine Stelle ruhig (ruhe):
 * Eine Skybox wartet mit dem Übersetzen, Hochladen und ersten Zeichnen (siehe createPanoramaSky), ebenso das Vorwärmen
 * von Menü und Bühne und der Ton: Schon ein einzelnes ausgelassenes Bild sah man als Ruck in der langsamen Enthüllung.
 * Vorher laufen Dekodieren (Worker), Netz und Ebenen in Häppchen. Ohne Intro (?nointro) sofort.
 */
const INTRO_REVEAL_MS = 4200;
let markIntroCalm;
const introCalm = new Promise((resolve) => { markIntroCalm = resolve; });

const ui = {
  hud: $('hud'), title: $('hud-title'), tier: $('hud-tier'), goal: $('hud-goal'), ziele: $('hud-ziele'),
  grad: $('hud-grad'), sub: $('hud-sub'),
  controls: $('controls'), sound: $('btn-sound'),
  solved: $('solved'), solvedMsg: $('solved-msg'), solvedBest: $('solved-best'), solvedStats: $('solved-stats'),
  next: $('btn-next'), overview: $('btn-overview'),
  intro: $('intro'),
  canStart: false, // „Klicken zum Starten“ ist da (siehe init)

  init() {
    $('btn-restart').addEventListener('click', () => restartLevel());
    this.sound.addEventListener('click', () => this.toggleSound());
    $('btn-menu').addEventListener('click', () => story.toMenu());
    this.overview.addEventListener('click', () => story.toOverview());
    this.next.addEventListener('click', () => this.advance());
    this.intro.addEventListener('click', () => this.start());
    this.intro.querySelector('.start span').textContent = IS_TOUCH ? 'Tippen zum Starten' : 'Klicken zum Starten';
    this.updateSound();
    // Enthüllung starten, sobald die Schrift geladen ist (spätestens nach 0,8 s), ohne auf die Szene zu warten (Ticket 03
    // der Leistung). Kein sichtbares Bild: Die Szene liegt hinter dem deckenden Startbildschirm und wird davor nur einmal
    // gezeichnet (aufwaermen; was das erste Bild bei three einrichtet, hielte sonst die Enthüllung an). Sind ihre Shader
    // dann noch nicht übersetzt (compileParallel im Hintergrund), zeichnet sie erst nach der Enthüllung (introCalm,
    // sceneLoop.mayDraw)
    const until = (promise, ms) => Promise.race([promise, new Promise((r) => setTimeout(r, ms))]);
    // (nach zwei Bildern: Ist die Schrift schon da, ehe die Seite fertig geladen hat, fiele der lange erste Frame sonst
    // in die Enthüllung; davor Menü und Bühne vorwärmen, vorwaermenVorStart). Der Seitenstart läuft in Stücken (Ticket 10
    // der Leistung): auch auf ihn warten
    Promise.all([until(document.fonts?.ready, 800), seitenstartAngestossen]).then(nextFrame).then(nextFrame)
      .then(() => vorwaermenVorStart().catch((e) => console.error(e))).then(() => {
      sceneLoop.aufwaermen();
      this.intro.classList.add('go');
      // reduzierte Bewegung: die Animationen sind gleich fertig (CSS), also nicht warten
      const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(markIntroCalm, still ? 0 : INTRO_REVEAL_MS);
      introCalm.then(() => { sceneLoop.calm = ruhe.calm = true; sceneLoop.wake(); }); // was liegen blieb, jetzt
      // „Klicken zum Starten“ am Ende der Enthüllung (2,9 s: der Strahl ist verglüht), ohne auf den Himmel dahinter zu
      // warten: Er ist hinter dem deckenden Startbildschirm nicht zu sehen und lädt an ruhigen Stellen fertig (ruhe)
      setTimeout(() => {
        this.canStart = true;
        this.intro.classList.add('ready');
      }, still ? 0 : 2900);
    });
    // Ton freischalten, sobald der Spieler irgendwo interagiert (Autoplay-Regeln der Browser)
    const unlock = (e) => { if (e.isTrusted) audio.unlock(); }; // synthetische Ereignisse (Tests) zählen nicht als Geste
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
  },

  /**
   * Kopfzeile. In Noas Geschichte: «Das Meer – Brandung» (Kapitel und Titel des Levels), darunter die Ziele mit dem
   * Grad dahinter («Ziele 0 / 3 · ●●○○ Mittel»; Kapitel, Level und Bedienung stehen seit dem 09.11.2026 nicht mehr
   * da, Wunsch des Nutzers); im Dorf «Im Dorf – Brechung», darunter ebenso Ziele und Grad, dann «Übung 2 / 4» (der Satz
   * des laufenden Schritts steht seit .scratch/tutorial-neu/ im Band unten, fuehrung). Ein Level ausserhalb der
   * Geschichte (Testschnittstelle zeige): Titel oder Name mit dem Grad dahinter, im Tutorial darunter der erste
   * Schritt, im Würfel der Hinweis.
   */
  showHud(index) {
    const lvl = LEVELS[index];
    this.hud.classList.toggle('tutorial', !!lvl.tutorial || lvl.dim === 3);
    this.hud.classList.toggle('geschichte', story.drives(index)); // Handy quer: die Unterzeile bleibt (CSS)
    this.overview.hidden = !story.drives(index); // die Übersicht gibt es nur in einem Level der Geschichte
    fillTier(this.tier, lvl);
    this.grad.hidden = true;
    // eine Übung ausserhalb der Führung zeigt ihren ersten Schritt (Testschnittstelle zeige)
    const hinweis = () => geraeteText(lvl.schritte?.[0].text ?? '', IS_TOUCH);
    if (story.drives(index)) {
      const [title, info] = story.hudText(index);
      this.title.textContent = title;
      this.tier.hidden = true; // der Grad steht hinter den Zielen
      // eine Übung im Dorf hat keinen Grad: der gewählte
      fillTier(this.grad, lvl.tutorial ? { grad: story.grade } : lvl);
      const zeile = [];
      if (info) { // im Dorf «Übung 2 / 4», am Stück: Auf dem Handy hochkant bräche es sonst vor der 4 um
        const teil = document.createElement('span');
        teil.className = 'teil';
        teil.textContent = info;
        zeile.push(teil);
      }
      // geführt: der Satz des Schritts steht im Band unten (fuehrung.zeichneBand, seit .scratch/tutorial-neu/)
      if (lvl.tutorial && !fuehrung.fuehrt(index)) { // Übung im Dorf ohne Führung: ihr erster Schritt in eigener Zeile
        const h = document.createElement('span');
        h.className = 'hinweis';
        h.textContent = hinweis();
        zeile.push(h);
      }
      this.sub.replaceChildren(...zeile);
    } else if (lvl.dim === 3) {
      this.title.textContent = `Würfel ${index - CUBE_START + 1} / ${LEVELS.length - CUBE_START} – `
        + `${lvl.titel ?? lvl.name}`;
      this.sub.textContent = lvl.hint ?? '';
    } else if (lvl.tutorial) {
      this.title.textContent = `Tutorial ${index + 1} / ${TUTORIAL_COUNT} – ${lvl.name}`;
      this.sub.textContent = hinweis();
    } else {
      this.title.textContent = lvl.titel ?? lvl.name;
      this.sub.textContent = '';
    }
    this.showGoal(0, game.board.elements.filter(e => e.type === 'target').length);
    // unter dem offenen Menü nicht (ein Level, das beim Öffnen gerade wechselte, wächst dahinter fertig heraus)
    this.hud.classList.toggle('hidden', story.choosing);
    if (story.choosing) fuehrung.verbergen(); else fuehrung.zeigen();
  },
  /** Wie viele Ziele schon in ihrer Farbe leuchten – macht die Aufgabe in jedem Level sichtbar. */
  showGoal(lit, total) {
    const text = `Ziele ${lit} / ${total}`;
    if (this.ziele.textContent !== text) this.ziele.textContent = text;
    this.goal.classList.toggle('done', lit === total); // hellt nur die Ziele auf, der Grad hat seine eigene Farbe
  },
  hideHud() { this.hud.classList.add('hidden'); fuehrung.verbergen(); },

  /**
   * Meldung nach dem Lösen, mit Zeit und Drehungen. In der Geschichte sagt sie, wie es weitergeht (story.solvedText),
   * und „Weiter“ führt dorthin; ausserhalb der Geschichte (Testschnittstelle) gibt es kein „Weiter“. Eine neue
   * Bestmarke (flow.record, Entscheid 24) steht darunter, die Zahl dazu leuchtet auf. Unter dem offenen Menü oder der
   * Übersicht nicht: Wer mitten im Lösungsmoment dorthin geht, sieht sie, wenn er ins Level zurückkehrt (story.resume).
   */
  showSolved(index, stats) {
    if (story.choosing) return;
    const r = flow.record;
    const stat = (num, unit, best) => {
      const el = document.createElement('span'), n = document.createElement('span'), u = document.createElement('span');
      n.className = best ? 'num best' : 'num'; n.textContent = num;
      u.className = 'unit'; u.textContent = unit;
      el.append(n, ' ', u); // Leerzeichen für Screenreader
      return el;
    };
    this.solvedStats.replaceChildren(...(stats ? [stat(formatDuration(stats.seconds), 'Zeit', r?.neueBestzeit), ' ',
      stat(stats.turns, stats.turns === 1 ? 'Drehung' : 'Drehungen', r?.wenigerDrehungen)] : []));
    // in der Zeile oben (Handy quer: dort ohne Zeit und Drehungen) und für den Bildschirmleser (aria-live)
    this.solvedBest.textContent = [r?.neueBestzeit && 'Neue Bestzeit', r?.wenigerDrehungen && 'Weniger Drehungen']
      .filter(Boolean).join(' · ');
    const inStory = story.drives(index);
    if (inStory) [this.solvedMsg.textContent, this.next.textContent] = story.solvedText();
    else this.solvedMsg.textContent = 'Level gelöst';
    this.next.hidden = !inStory;
    if (inStory) story.preloadNext();
    setShown(this.solved, true);
    document.body.classList.add('is-solved'); // Handy quer: Meldung ersetzt die Kopfzeile
  },
  hideSolved() { setShown(this.solved, false); document.body.classList.remove('is-solved'); },
  solvedVisible() { return !this.solved.classList.contains('hidden'); },
  advance() {
    // z. B. zweites Auslösen (Taste + Klick); ausserhalb der Geschichte gibt es kein Weiter
    if (flow.state !== 'play' || !this.solvedVisible() || !story.drives(game.levelIndex)) return;
    story.advance();
  },

  toggleSound() {
    audio.unlock();
    audio.setMuted(!audio.muted);
    this.updateSound();
  },
  updateSound() {
    this.sound.classList.toggle('muted', audio.muted);
    this.sound.setAttribute('aria-pressed', String(audio.muted));
    this.sound.setAttribute('aria-label', audio.muted ? 'Ton an' : 'Ton aus');
  },

  /** Startbildschirm verlassen: Ton freischalten, dann das Menü (story.start); die Knöpfe kommen mit dem Level. */
  start(gesture = true) {
    if (flow.state !== 'intro' || !this.canStart) return; // erst, wenn „Klicken zum Starten“ da ist
    if (gesture) audio.unlock(); // ohne Geste verweigert der Browser den Ton – dann beim ersten Klick
    setShown(this.intro, false);
    // nach dem Ausblenden ganz entfernen (die Puls-Animation liefe sonst endlos weiter)
    setTimeout(() => { this.intro.style.display = 'none'; }, 1200);
    story.start();
    sceneLoop.wake(); // aufgedeckt: die Szene zeichnet wieder
  },
};
ui.init();

/* =====================================================================
   MENÜ DER GESCHICHTE (Ticket 05; seit Ticket 08 von .scratch/kleiner-wagen/ «Sternkarte mit Reitern», Variante F des
   Skizzenkatalogs, gewählt vom Nutzer). Die vier Grade sind Reiter; der gewählte zeigt seinen Kleinen Wagen wie auf
   einer Sternkarte: Kreise um den Polarstern, die Namen der Welten an ihren Sternen, die Grösse der Punkte nach der
   echten Helligkeit, noch fehlende Linien gestrichelt, der Stern der Welt, in der das Licht ist, mit Ring. Darunter der
   Knopf des Grads (Weiter, Beginnen, Fortsetzen, Übersicht) und «Von vorn» mit Rückfrage. «Weiter» heisst der Knopf des
   zuletzt gespielten, nicht geschafften Grads; ihn zeigt das Menü beim Öffnen. Ist seit dem letzten Zeigen eines Grads
   (in dieser Sitzung) ein Stern erwacht, blitzt er auf, und seine Linien ziehen sich (der Moment aus dem Katalog).
   Desktop und Handy quer: Reiter links untereinander, die Karte daneben, der Knopf darunter; Handy hoch: Reiter oben
   als Segmente, darunter Karte und Stand, der Knopf ganz unten in Reichweite des Daumens. Gestalt im Stil (Präfix
   menue-). Der Baustein .scratch/noa-geschichte/bausteine/menue/ («Lichtwege») ist damit überholt.

     const menu = createMenu({ root, onAction, wagen });
     menu.show(stand);   // einblenden; ist es offen, mit dem neuen Stand neu zeichnen (Fokus und Reiter bleiben)
     menu.hide();        // ausblenden; Promise, erfüllt, wenn es ganz weg ist (hide(true): sofort, Testschnittstelle)
     menu.offen;         // true, solange es offen ist
     menu.vorwaermen(stand); // einmal unsichtbar zeichnen, solange es zu ist (Startbildschirm)
     menu.keydown(e);    // aus dem Tastatur-Handler des Spiels: true, wenn das Menü die Taste genommen hat

   stand = { grade: { leicht: { stand: 'neu' | 'begonnen' | 'geschafft', welt, geloest, wach }, mittel, schwer,
             'sehr schwer' }, zuletzt: 'mittel', hervorheben: false }   (das Spiel: story.menuStand)
   wach: so viele Sterne des Wagens sind in diesem Grad wach (0 … 7 mit dem Polarstern; das Spiel: wagen.stand); ohne
   Angabe aus den gelösten Leveln.
   wagen: Form und Linien des Kleinen Wagens { form, linien, polarstern } (im Spiel das Modul wagen).
   onAction({ aktion, grad }): 'weiter' | 'beginnen' | 'fortsetzen' | 'uebersicht' | 'vonvorn' (nach der Rückfrage).
   Bedienung: Ein Reiter wählt seinen Grad (Klick, Tippen, Fokus); der Knopf und Enter auf einem Reiter führen die
   Aktion des Grads aus. Pfeile: der Knopf, dann die Reiter von oben nach unten (Pos1, Ende). Ohne Abhängigkeiten vom
   übrigen Spiel.
   ===================================================================== */

const createMenu = (() => {
  /** Die Grade in der Reihenfolge des Menüs; id wie das Feld grad in LEVELS (GRAD_ANZEIGE im Spiel). */
  const GRADE = [
    { id: 'leicht', name: 'Leicht', punkte: 1 },
    { id: 'mittel', name: 'Mittel', punkte: 2 },
    { id: 'schwer', name: 'Schwer', punkte: 3 },
    { id: 'sehr schwer', name: 'Sehr schwer', punkte: 4 },
  ];
  /** Die sechs Welten eines Durchgangs, Welt i weckt Stern i + 1; vor der ersten Welt ist das Licht im Dorf. */
  const WELTEN = [
    { id: 'wald', name: 'Bergwald' }, { id: 'meer', name: 'Meer' }, { id: 'wueste', name: 'Wüste' },
    { id: 'vulkan', name: 'Vulkan' }, { id: 'planeten', name: 'Planeten' }, { id: 'sterne', name: 'Sterne' },
  ];
  const JE_WELT = 10;
  const LEVEL = WELTEN.length * JE_WELT; // 60 je Grad
  /** Zeichen im Strich der STORY_ICONS: «Von vorn» wie «Level neu starten» im Spiel. */
  const ICONS = { neu: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v3.2h3.2"/>' };
  const AKTION = { weiter: 'Weiter', beginnen: 'Beginnen', fortsetzen: 'Fortsetzen', uebersicht: 'Übersicht', vonvorn: 'Von vorn' };
  // gleich wie im CSS des Menüs
  const HOCH = '(max-width: 600px) and (orientation: portrait)';
  const STILL = '(prefers-reduced-motion: reduce)';
  const AUS_MS = 800, FRAGE_MS = 300; // Ausblenden des Menüs bzw. der Rückfrage (Transition im CSS des Menüs)
  /**
   * Sternkarte: echte Helligkeit (mag) der Sterne 1 … 7 (Kochab, Pherkad, η, ζ, ε, δ UMi, Polaris) für die Grösse der
   * Punkte, wohin ihre Namen stehen (vom Stern nach aussen; hoch steht der von Stern 1 darüber, rechts fehlt der Platz).
   * rand: Platz (px) um den Wagen für die Namen, je Seite; gross: höchstens so viele px je Einheit der Form; kreis:
   * Abstand der Kreise um den Pol (Einheiten der Form), speiche: Winkel zwischen den Stundenlinien (°). moment: das
   * Erwachen beim Öffnen beginnt nach ab s, je weiterer Stern schritt s später.
   */
  const KARTE = {
    mag: [2.1, 3.0, 4.9, 4.3, 4.2, 4.3, 2.0],
    richtung: [[1, -0.15], [0.3, 1], [-0.35, 1], [0.35, -1], [0.3, -1], [0.3, -1], [0, -1]],
    richtungHoch: { 1: [0.25, -1] },
    rand: { links: 24, rechts: 116, oben: 46, unten: 48 },
    randHoch: { links: 46, rechts: 34, oben: 42, unten: 40 },
    gross: 6, kreis: 23.3, speiche: 30,
    moment: { ab: 0.7, schritt: 0.45 },
  };
  let zaehler = 0;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const f = (n) => n.toFixed(1);
  const make = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  /* ---------- Stand lesen ---------- */

  /** Stand des Spiels in die Daten des Menüs; Fehlendes gilt als «neu», Zahlen werden begrenzt. */
  function lies(stand, uebersicht) {
    const grade = GRADE.map((g, i) => {
      const s = stand?.grade?.[g.id] ?? {};
      const art = s.stand === 'begonnen' || s.stand === 'geschafft' ? s.stand : 'neu';
      const geloest = art === 'geschafft' ? LEVEL : art === 'neu' ? 0 : clamp(Math.floor(+s.geloest || 0), 0, LEVEL);
      // Welt: id oder Nummer 0 … 5; 'dorf' vor der ersten Welt (Prolog, «Im Dorf»); fehlt sie, aus den gelösten Leveln
      let welt = typeof s.welt === 'number' ? Math.floor(s.welt) : WELTEN.findIndex((w) => w.id === s.welt);
      const dorf = art === 'begonnen' && s.welt === 'dorf';
      if (art !== 'begonnen') welt = art === 'geschafft' ? WELTEN.length : -1;
      else if (dorf) welt = -1;
      else if (!(welt >= 0 && welt < WELTEN.length)) welt = Math.min(WELTEN.length - 1, Math.floor(geloest / JE_WELT));
      // wache Sterne: geschafft alle sieben, begonnen höchstens die sechs der Welten
      const wach = art === 'geschafft' ? WELTEN.length + 1 : art === 'neu' ? 0
        : clamp(Math.floor(Number.isFinite(+s.wach) ? +s.wach : geloest / JE_WELT), 0, WELTEN.length);
      const naechster = art === 'begonnen' && wach < WELTEN.length ? wach + 1 : 0; // Stern der Welt, in der das Licht ist
      const aktion = art === 'geschafft' ? (uebersicht ? 'uebersicht' : 'vonvorn') : art === 'neu' ? 'beginnen' : 'fortsetzen';
      return { ...g, i, art, geloest, welt, dorf, wach, naechster, aktion };
    });
    const zuletzt = grade.find((g) => g.id === stand?.zuletzt) ?? null;
    const weiter = zuletzt?.art === 'begonnen' ? zuletzt : null;
    // hervorheben: true → der nächstschwerere, noch nicht geschaffte Grad nach dem zuletzt geschafften; oder eine id
    let hervor = null;
    if (typeof stand?.hervorheben === 'string') hervor = grade.find((g) => g.id === stand.hervorheben) ?? null;
    else if (stand?.hervorheben && zuletzt?.art === 'geschafft') hervor = grade.slice(zuletzt.i + 1).find((g) => g.art !== 'geschafft') ?? null;
    return { grade, zuletzt, weiter, hervor };
  }
  const weltName = (g) => (g.dorf ? 'Dorf' : WELTEN[g.welt].name);
  const ariaStand = (g) => (g.art === 'geschafft' ? 'geschafft, Polarstern erreicht' : g.art === 'neu' ? 'noch nicht begonnen'
    : `begonnen, ${g.dorf ? 'im Dorf' : weltName(g)}, ${g.geloest} von ${LEVEL} Leveln gelöst`);
  const wohin = (g) => (g.art === 'neu' ? `${g.name} · noch nicht begonnen` : g.art === 'geschafft' ? `${g.name} · geschafft`
    : `${g.name} · ${weltName(g)} ${g.geloest} / ${LEVEL}`);
  /** Was als Nächstes am Himmel des Grads geschieht (Handy hoch, unter der Karte). */
  const fein = (g) => (g.art === 'geschafft' ? 'Alle sieben Sterne sind wach' : g.art === 'neu' ? 'Alle Sterne schlafen'
    : g.naechster ? `Als Nächstes erwacht Stern ${g.naechster}: ${WELTEN[g.naechster - 1].name}`
      : 'Nur der Polarstern wartet noch');

  /* ---------- Baustein ---------- */

  return function createMenu({ root, onAction = () => {}, uebersicht = true, wagen = null } = {}) {
    if (!root) throw new Error('createMenu: root fehlt');
    const uid = `menue-${++zaehler}`;
    const icon = (id) => `<svg class="menue-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[id]}</svg>`;
    const stern = () => `<span class="menue-stern" aria-hidden="true"><svg viewBox="0 0 100 100" focusable="false"><use href="#${uid}-stern"/></svg></span>`;
    const form = wagen?.form ?? [], linien = wagen?.linien ?? [], polar = wagen?.polarstern ?? form.length;

    root.classList.add('menue', 'menue-aus');
    root.hidden = true;
    root.inert = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Menü');
    root.innerHTML = `
      <svg class="menue-defs" aria-hidden="true" focusable="false"><defs>
        <radialGradient id="${uid}-hof"><stop offset="0" stop-color="#ffffff" stop-opacity="0.6"/><stop offset="0.22" stop-color="#cdd4ff" stop-opacity="0.26"/><stop offset="1" stop-color="#aab4ff" stop-opacity="0"/></radialGradient>
        <radialGradient id="${uid}-strahl"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#e6eaff" stop-opacity="0.5"/><stop offset="1" stop-color="#e6eaff" stop-opacity="0"/></radialGradient>
        <radialGradient id="${uid}-schein"><stop offset="0" stop-color="#ffffff" stop-opacity="0.8"/><stop offset="0.22" stop-color="#dfe3ff" stop-opacity="0.32"/><stop offset="1" stop-color="#aab4ff" stop-opacity="0"/></radialGradient>
        <symbol id="${uid}-stern" viewBox="-50 -50 100 100">
          <circle r="48" fill="url(#${uid}-hof)"/>
          <path d="M0-46L2.4-2.4 30 0 2.4 2.4 0 46-2.4 2.4-30 0-2.4-2.4z" fill="url(#${uid}-strahl)"/>
          <path d="M0-16L1.2-1.2 16 0 1.2 1.2 0 16-1.2 1.2-16 0-1.2-1.2z" fill="#fff" transform="rotate(45)" opacity="0.55"/>
          <circle r="4.2" fill="#fff"/>
        </symbol>
      </defs></svg>
      <div class="menue-inhalt">
        <header class="menue-kopf"><h2 class="menue-titel">Prisma</h2><p class="menue-unter">Ein Lichtsignal an die Sterne</p></header>
        <ol class="menue-grade" aria-label="Grade"></ol>
        <div class="menue-karte" aria-hidden="true"><svg class="menue-sternkarte" focusable="false"></svg></div>
        <div class="menue-info" aria-hidden="true"><span class="menue-info-name"></span><span class="menue-stand"></span><span class="menue-fein"></span></div>
        <div class="menue-knoepfe">
          <button type="button" class="menue-weiter" data-menue-fokus="weiter"><span class="menue-was"></span><span class="menue-wohin"></span></button>
        </div>
      </div>
      <div class="menue-frage menue-aus" role="alertdialog" aria-modal="true" aria-labelledby="${uid}-frage-titel" aria-describedby="${uid}-frage-text" hidden>
        <div class="menue-frage-box">
          <h3 class="menue-frage-titel" id="${uid}-frage-titel"></h3>
          <p class="menue-frage-text" id="${uid}-frage-text"></p>
          <div class="menue-frage-knoepfe">
            <button type="button" class="menue-pille" data-menue-frage="nein">Abbrechen</button>
            <button type="button" class="menue-pille menue-pille-ja" data-menue-frage="ja">Von vorn</button>
          </div>
        </div>
      </div>
      <p class="menue-sr" aria-live="polite"></p>`;
    const $ = (sel) => root.querySelector(sel);
    // Fokusrahmen erst nach einer Taste: Chrome zeigt ihn sonst auch, wenn das Menü nach einem Klick ins Leere (etwa auf
    // den Startbildschirm) den Fokus setzt; mit Zeiger oder Finger bedient, bleibt er weg (CSS .menue-zeiger)
    addEventListener('pointerdown', () => root.classList.add('menue-zeiger'), true);
    addEventListener('keydown', () => root.classList.remove('menue-zeiger'), true);
    const inhalt = $('.menue-inhalt'), karte = $('.menue-karte'), svg = $('.menue-sternkarte'), liste = $('.menue-grade');
    const knopf = $('.menue-weiter'), knoepfe = $('.menue-knoepfe'), info = $('.menue-info');
    const frageEl = $('.menue-frage'), sr = $('.menue-sr');
    const neinBtn = $('[data-menue-frage="nein"]'), jaBtn = $('[data-menue-frage="ja"]');

    let daten = lies({}, uebersicht);
    let offen = false;
    let gesperrt = false;   // nach einer Aktion (ausser «Von vorn») bis zum nächsten show(): kein Doppelklick
    let frage = null;       // Grad der offenen Rückfrage
    let frageVon = null;    // Knopf, der sie geöffnet hat (bekommt den Fokus zurück)
    let wahlId = null;      // Grad des gewählten Reiters: seine Karte und sein Knopf
    let warm = false;       // vorwaermen zeichnet gerade unsichtbar
    let zeitAus = 0, zeitFrage = 0, plan = 0;
    const gezeigt = new Map(); // je Grad: so viele Sterne waren beim letzten Zeigen wach (der Moment des Erwachens)
    let gezeichnet = '';    // was die Karte zeigt (Grösse, Grad, Stand): dasselbe nicht neu zeichnen
    let momentBis = 0;      // bis dahin läuft der Moment (performance.now); danach einmal ohne ihn neu zeichnen

    const gewaehlt = () => daten.grade.find((g) => g.id === wahlId) ?? daten.grade[0];
    /** Reiter beim Öffnen: der Grad von «Weiter», sonst der hervorgehobene, der zuletzt gespielte, der erste begonnene. */
    const startWahl = () => (daten.weiter ?? daten.hervor ?? daten.zuletzt ?? daten.grade.find((x) => x.art === 'begonnen')
      ?? daten.grade[0]).id;
    const aktionVon = (g) => (g === daten.weiter ? 'weiter' : g.aktion);

    /* ---------- Aufbau: Reiter, Knopf, «Von vorn» ---------- */

    function standEl(el, g) {
      el.replaceChildren();
      if (g.art === 'geschafft') { el.innerHTML = stern(); el.append(make('span', '', 'Geschafft')); }
      else if (g.art === 'neu') el.textContent = 'noch nicht begonnen';
      else el.append(make('span', '', weltName(g)), make('span', 'menue-trenn', '·'), make('span', 'menue-zahl', `${g.geloest} / ${LEVEL}`));
    }
    function render() {
      liste.replaceChildren();
      for (const b of knoepfe.querySelectorAll('.menue-vonvorn')) b.remove();
      for (const g of daten.grade) {
        const li = make('li', `menue-grad menue-${g.art}`);
        li.dataset.grad = g.id;
        if (g === daten.hervor) li.classList.add('menue-hervor');
        if (g === daten.weiter) li.classList.add('menue-zuletzt');
        const wahl = make('button', 'menue-wahl');
        wahl.type = 'button';
        wahl.dataset.menueFokus = `wahl:${g.id}`;
        wahl.setAttribute('aria-label', `${g.name}: ${ariaStand(g)}${g === daten.hervor ? ', als Nächstes empfohlen' : ''}. ${AKTION[aktionVon(g)]}`);
        const zeile = make('span', 'menue-zeile1');
        const pips = make('span', 'menue-pips');
        for (let k = 1; k <= 4; k++) pips.append(make('i', k <= g.punkte ? 'menue-on' : ''));
        zeile.append(pips, make('span', 'menue-name', g.name));
        const stand = make('span', 'menue-stand');
        standEl(stand, g);
        wahl.append(zeile, stand);
        wahl.addEventListener('click', () => waehle(g.id));
        li.append(wahl);
        liste.append(li);
        // «Von vorn» bei begonnenem oder geschafftem Grad (ohne Übersicht ist es beim geschafften schon der Knopf),
        // zu sehen beim gewählten
        if (g.art !== 'neu' && g.aktion !== 'vonvorn') {
          const vv = make('button', 'menue-vonvorn');
          vv.type = 'button';
          vv.dataset.menueFokus = `vonvorn:${g.id}`;
          vv.setAttribute('aria-label', `${g.name} von vorn beginnen`);
          vv.setAttribute('aria-haspopup', 'dialog');
          vv.innerHTML = `${icon('neu')}<span>Von vorn</span>`;
          vv.addEventListener('click', () => oeffneFrage(g, vv));
          knoepfe.append(vv);
        }
      }
      setzeWahl();
    }
    /** Den gewählten Reiter zeigen: hervorgehoben, seine Karte, sein Knopf, sein «Von vorn», sein Stand (hoch). */
    function setzeWahl() {
      const g = gewaehlt();
      for (const li of liste.children) {
        const an = li.dataset.grad === g.id;
        li.classList.toggle('menue-an', an);
        li.firstChild.setAttribute('aria-current', an ? 'true' : 'false');
      }
      for (const b of knoepfe.querySelectorAll('.menue-vonvorn')) b.hidden = b.dataset.menueFokus !== `vonvorn:${g.id}`;
      const a = aktionVon(g);
      knopf.querySelector('.menue-was').textContent = AKTION[a];
      knopf.querySelector('.menue-wohin').textContent = wohin(g);
      knopf.setAttribute('aria-label', `${AKTION[a]}: ${g.name}, ${ariaStand(g)}`);
      if (a === 'vonvorn') knopf.setAttribute('aria-haspopup', 'dialog'); else knopf.removeAttribute('aria-haspopup');
      info.querySelector('.menue-info-name').textContent = g.name;
      standEl(info.querySelector('.menue-stand'), g);
      info.querySelector('.menue-fein').textContent = fein(g);
      zeichne();
    }
    function waehle(id) {
      if (id === wahlId) return;
      wahlId = id;
      setzeWahl();
    }

    /* ---------- Sternkarte zeichnen (bei jeder Grössenänderung und jeder Wahl neu) ---------- */

    function zeichne() {
      if (!offen && !warm || !form.length) return;
      // in Pixeln der Oberfläche: getBoundingClientRect misst in Pixeln des Layouts (SEITE)
      const R = karte.getBoundingClientRect(), W = R.width / SEITE, H = R.height / SEITE;
      if (!W || !H) return;
      const g = gewaehlt(), hoch = matchMedia(seiteMedia(HOCH)).matches, rand = hoch ? KARTE.randHoch : KARTE.rand;
      // dasselbe Bild nicht noch einmal (ResizeObserver, Schriften, show mit gleichem Stand): ein laufender Moment bliebe
      // sonst nicht stehen
      const key = [W, H, hoch, g.id, g.art, g.wach, g.geloest].join();
      if (key === gezeichnet && (!momentBis || performance.now() < momentBis)) return;
      gezeichnet = key;
      momentBis = 0;
      const xs = form.map((p) => p[0]), ys = form.map((p) => p[1]);
      const x0 = Math.min(...xs), y0 = Math.min(...ys), bw = Math.max(...xs) - x0, bh = Math.max(...ys) - y0;
      const s = clamp(Math.min((W - rand.links - rand.rechts) / bw, (H - rand.oben - rand.unten) / bh), 0.8, KARTE.gross);
      // der Wagen samt dem Platz für die Namen mittig in der Karte
      const ox = rand.links + (W - rand.links - rand.rechts - bw * s) / 2 - x0 * s;
      const oy = rand.oben + (H - rand.oben - rand.unten - bh * s) / 2 - y0 * s;
      const P = (k) => [ox + form[k - 1][0] * s, oy + form[k - 1][1] * s];
      const wach = (k) => (k === polar ? g.wach > WELTEN.length : k <= g.wach);
      const da = ([a, b]) => wach(a) && wach(b);
      // Moment: erst beim Zeigen, nicht beim Vorwärmen; was seit dem letzten Zeigen dieses Grads erwacht ist
      const vorher = gezeigt.get(g.id), still = !offen || matchMedia(STILL).matches;
      const ab = !still && vorher !== undefined && vorher < g.wach ? vorher : g.wach;
      gezeigt.set(g.id, g.wach);
      const warVorher = (k) => (k === polar ? ab > WELTEN.length : k <= ab);
      const M = KARTE.moment, um = (k) => M.ab + M.schritt * (Math.min(k, WELTEN.length + 1) - ab - 1);

      const kern = clamp(0.45 * s, 1.4, 2.7), ring = Math.max(7, 2.2 * s), breite = clamp(0.45 + 0.24 * s, 0.8, 1.7);
      const abstand = clamp(2 * s + 8, 11, 20);
      // Netz der Sternkarte: Kreise um den Pol, Stundenlinien, in der Karte
      const [px, py] = P(polar), weit = Math.hypot(W, H) + Math.hypot(px, py);
      let netz = '';
      for (let r = KARTE.kreis * s; r < weit; r += KARTE.kreis * s) netz += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(r)}"/>`;
      for (let w = 0; w < 360; w += KARTE.speiche) {
        const a = w * Math.PI / 180;
        netz += `<line x1="${f(px)}" y1="${f(py)}" x2="${f(px + Math.cos(a) * weit)}" y2="${f(py + Math.sin(a) * weit)}"/>`;
      }
      let teile = `<defs><clipPath id="${uid}-rand"><rect width="${f(W)}" height="${f(H)}" rx="24"/></clipPath></defs>`
        + `<g class="menue-netz" clip-path="url(#${uid}-rand)">${netz}</g>`;
      // Linien: noch fehlende gestrichelt, gezogene hell (eben gezogene ziehen sich vom ersten Stern zum zweiten)
      for (const l of linien) {
        const [ax, ay] = P(l[0]), [bx, by] = P(l[1]), xy = `x1="${f(ax)}" y1="${f(ay)}" x2="${f(bx)}" y2="${f(by)}"`;
        teile += `<line class="menue-geist" ${xy} stroke-width="${f(breite)}"/>`;
        if (!da(l)) continue;
        const neu = !(warVorher(l[0]) && warVorher(l[1]));
        teile += `<line class="menue-linie${neu ? ' menue-zieht' : ''}" ${xy} stroke-width="${f(breite)}"`
          + (neu ? ` style="--len:${f(Math.hypot(bx - ax, by - ay) + 1)};--d:${um(Math.max(...l)) + 0.2}s"` : '') + '/>';
      }
      // Sterne: Punktgrösse nach der Helligkeit; wache mit Hof, schlafende klein und blass; der Polarstern mit Strahlen
      let namen = '';
      for (let k = 1; k <= form.length; k++) {
        const [x, y] = P(k), m = 1 + (4.9 - KARTE.mag[k - 1]) * 0.3, an = wach(k), neu = an && !warVorher(k);
        const r = kern * m * (an ? 1 : 0.62), d = neu ? ` style="--d:${um(k)}s"` : '';
        teile += `<g transform="translate(${f(x)} ${f(y)})"><g class="menue-ks${an ? ' menue-an' : ''}${neu ? ' menue-erwacht' : ''}"${d}>`;
        if (k === polar) {
          const gr = kern * m * 4.6 / 46 * 100 * (an ? 1.25 : 1);
          teile += `<use href="#${uid}-stern" x="${f(-gr / 2)}" y="${f(-gr / 2)}" width="${f(gr)}" height="${f(gr)}"/>`;
        } else {
          if (an) teile += `<circle class="menue-schein" r="${f(kern * 5.5 * m)}" fill="url(#${uid}-schein)"/>`;
          teile += `<circle class="menue-kern" r="${f(r)}"/>`;
        }
        teile += '</g>';
        if (k === g.naechster) {
          teile += `<circle class="menue-ring${ab < g.wach ? ' menue-spaeter' : ''}" r="${f(ring)}"`
            + (ab < g.wach ? ` style="--d:${um(g.wach) + 0.6}s"` : '') + '/>';
        }
        teile += '</g>';
        // Name nach aussen, darunter bei geweckten und beim Stern der Welt die gelösten Level dieser Welt
        const [dx0, dy0] = (hoch && KARTE.richtungHoch[k]) || KARTE.richtung[k - 1], n = Math.hypot(dx0, dy0);
        const dx = dx0 / n, dy = dy0 / n, tx = x + dx * abstand, ty = y + dy * abstand;
        const zahl = k === polar ? '' : an ? `${JE_WELT} / ${JE_WELT}`
          : k === g.naechster ? `${clamp(g.geloest - (k - 1) * JE_WELT, 0, JE_WELT)} / ${JE_WELT}` : '';
        const seit = Math.abs(dx) > Math.abs(dy), anker = seit ? (dx > 0 ? 'start' : 'end') : 'middle';
        const lage = seit ? 'central' : dy > 0 ? 'hanging' : 'auto';
        const [d1, d2] = !zahl ? ['0', '0'] : seit ? ['-0.6em', '1.25em'] : dy > 0 ? ['0', '1.3em'] : ['-1.15em', '1.3em'];
        const cls = k === polar ? `menue-polar${an ? ' menue-an' : ''}`
          : `menue-welt${an ? ' menue-an' : k === g.naechster ? ' menue-jetzt' : ''}`;
        namen += `<text class="menue-etikett ${cls}" x="${f(tx)}" y="${f(ty)}" text-anchor="${anker}" dominant-baseline="${lage}">`
          + `<tspan x="${f(tx)}" dy="${d1}">${esc(k === polar ? 'Polarstern' : WELTEN[k - 1].name)}</tspan>`
          + (zahl ? `<tspan class="menue-klein" x="${f(tx)}" dy="${d2}">${zahl}</tspan>` : '') + '</text>';
      }
      svg.setAttribute('viewBox', `0 0 ${f(W)} ${f(H)}`);
      svg.innerHTML = teile + namen;
      if (ab < g.wach) momentBis = performance.now() + (um(g.wach) + 2) * 1000;
    }
    /** Neu zeichnen im nächsten Bild (mehrere Anlässe zugleich: einmal). */
    function planen() {
      if (!offen || plan) return;
      plan = requestAnimationFrame(() => { plan = 0; zeichne(); });
    }
    const beobachter = typeof ResizeObserver === 'function' ? new ResizeObserver(planen) : null;
    addEventListener('resize', planen);
    document.fonts?.ready?.then(planen);
    // Fokus auf einem Reiter (Tab, Pfeile, Rückkehr aus der Übersicht): er ist gewählt
    inhalt.addEventListener('focusin', (e) => {
      const li = e.target.classList?.contains('menue-wahl') ? e.target.closest('.menue-grad') : null;
      if (li) waehle(li.dataset.grad);
    });

    /* ---------- Fokus ---------- */

    const ziel = (key) => (key ? root.querySelector(`[data-menue-fokus="${CSS.escape(key)}"]`) : null);
    function fokussiere(key) {
      const el = ziel(key);
      if (el && !el.hidden) el.focus({ preventScroll: true });
      return !!el && !el.hidden;
    }
    /** Wohin der Fokus beim Öffnen geht: «Weiter», sonst der Reiter des hervorgehobenen, zuletzt gespielten, ersten Grads. */
    const startFokus = () => (daten.weiter ? 'weiter' : `wahl:${startWahl()}`);
    /** Haltepunkte der Pfeiltasten: der Knopf, dann die Reiter von oben nach unten. */
    const halte = () => [knopf, ...liste.querySelectorAll('.menue-wahl')];

    /* ---------- Aktionen und Rückfrage ---------- */

    function melde(aktion, g) {
      if (gesperrt || !offen) return;
      if (aktion !== 'vonvorn') gesperrt = true; // das Spiel blendet das Menü aus; show() gibt es wieder frei
      onAction({ aktion, grad: g.id });
    }
    /** Die Aktion des Grads g (Knopf oder Enter auf seinem Reiter); von: der Knopf, der sie auslöst. */
    const handle = (g, von) => (g.aktion === 'vonvorn' ? oeffneFrage(g, von) : melde(aktionVon(g), g));
    knopf.addEventListener('click', () => handle(gewaehlt(), knopf));

    function oeffneFrage(g, von) {
      if (!offen || gesperrt) return;
      clearTimeout(zeitFrage);
      frage = g;
      frageVon = von?.dataset.menueFokus ?? null;
      $('.menue-frage-titel').textContent = `${g.name} von vorn beginnen?`;
      $('.menue-frage-text').textContent = g.art === 'geschafft'
        ? `Der Stand dieses Grads wird gelöscht, auch der erreichte Polarstern. Die anderen Grade bleiben, wie sie sind.`
        : `Der Stand dieses Grads wird gelöscht (${g.dorf ? 'im Dorf' : weltName(g)}, ${g.geloest} von ${LEVEL} Leveln). Die anderen Grade bleiben, wie sie sind.`;
      inhalt.inert = true;
      frageEl.hidden = false;
      void frageEl.offsetWidth; // erst sichtbar setzen, dann einblenden
      frageEl.classList.remove('menue-aus');
      neinBtn.focus({ preventScroll: true }); // sicher: Abbrechen zuerst
    }
    /** ja: bestätigt («Von vorn» an das Spiel); sofort: ohne Ausblenden und ohne Fokus (show, hide). */
    function schliesseFrage(ja = false, sofort = false) {
      if (!frage) return;
      const g = frage;
      frage = null;
      frageEl.classList.add('menue-aus');
      inhalt.inert = false;
      clearTimeout(zeitFrage);
      const weg = () => { if (!frage) frageEl.hidden = true; };
      if (sofort) { weg(); return; }
      zeitFrage = setTimeout(weg, FRAGE_MS);
      if (!ja) { fokussiere(frageVon) || fokussiere(`wahl:${g.id}`); return; }
      fokussiere(`wahl:${g.id}`); // vor onAction: ein show() darin behält den Fokus beim Grad
      melde('vonvorn', g);
      fokussiere(`wahl:${g.id}`) || fokussiere(startFokus());
      sage(`${g.name}: Stand gelöscht.`);
    }
    neinBtn.addEventListener('click', () => schliesseFrage(false));
    jaBtn.addEventListener('click', () => schliesseFrage(true));
    frageEl.addEventListener('click', (e) => { if (e.target === frageEl) schliesseFrage(false); });

    /** Meldung für den Bildschirmleser (leeren und neu setzen: auch dieselbe Meldung zweimal). */
    function sage(text) {
      sr.textContent = '';
      requestAnimationFrame(() => { sr.textContent = text; });
    }

    /* ---------- Tasten ---------- */

    /** true: die Taste gehört dem Menü (Standardaktion verhindert). */
    function taste(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return false;
      if (frage) {
        if (e.key === 'Escape') { schliesseFrage(false); return true; }
        // in der Rückfrage bleiben: Tab und Pfeile wechseln zwischen den zwei Knöpfen
        if (e.key === 'Tab' || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          (document.activeElement === neinBtn ? jaBtn : neinBtn).focus();
          return true;
        }
        return false;
      }
      const akt = document.activeElement;
      // Enter auf einem Reiter: die Aktion seines Grads (Klick und Leertaste wählen ihn nur); gehalten: nichts
      if (e.key === 'Enter' && akt?.classList?.contains('menue-wahl') && root.contains(akt)) {
        const g = daten.grade.find((x) => x.id === akt.closest('.menue-grad').dataset.grad);
        if (g && !e.repeat) { waehle(g.id); handle(g, akt); }
        return true;
      }
      const schritt = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!schritt && e.key !== 'Home' && e.key !== 'End') return false;
      const stopps = halte();
      let i = stopps.indexOf(akt);
      if (i < 0 && akt?.classList?.contains('menue-vonvorn')) i = 0; // «Von vorn» gehört zum Knopf
      let el;
      if (e.key === 'Home') el = stopps[0];
      else if (e.key === 'End') el = stopps[stopps.length - 1];
      else if (i < 0) el = ziel(startFokus());
      else el = stopps[clamp(i + schritt, 0, stopps.length - 1)];
      el?.focus({ preventScroll: true });
      return true;
    }
    root.addEventListener('keydown', (e) => {
      if (!offen || e.defaultPrevented) return;
      if (taste(e)) { e.preventDefault(); e.stopPropagation(); }
    });

    /* ---------- Öffnen und Schliessen ---------- */

    return {
      get offen() { return offen; },
      /** Einblenden mit dem Stand des Spiels; ist das Menü schon offen, neu aufbauen (Fokus und Reiter bleiben). */
      show(stand = {}) {
        daten = lies(stand, uebersicht);
        gesperrt = false;
        const war = offen;
        const key = war && root.contains(document.activeElement) ? document.activeElement.dataset?.menueFokus : null;
        if (war && frage) schliesseFrage(false, true);
        if (!war) wahlId = startWahl();
        render();
        if (!war) {
          offen = true;
          clearTimeout(zeitAus);
          root.hidden = false;
          root.inert = false;
          void root.offsetWidth; // erst sichtbar setzen, dann einblenden
          root.classList.remove('menue-aus');
          knopf.classList.toggle('menue-auf', !matchMedia(STILL).matches);
          beobachter?.observe(karte);
          zeichne();
          fokussiere(startFokus());
        } else if (key) fokussiere(key) || fokussiere(startFokus());
      },
      /**
       * Einmal unsichtbar zeichnen (fast durchsichtig, nicht bedienbar, ohne Fokus), solange es zu ist: Das erste
       * Zeichnen hielt das Bild beim ersten Öffnen an (Review Ticket 05, damals mit dem Leuchten der Lichtwege bis gut
       * 400 ms). show() zeichnet neu.
       */
      vorwaermen(stand = {}) {
        if (offen || warm) return;
        warm = true;
        daten = lies(stand, uebersicht);
        wahlId = startWahl();
        root.hidden = false;
        root.classList.add('menue-vorwaermen');
        render();
        requestAnimationFrame(() => requestAnimationFrame(() => {
          warm = false;
          root.classList.remove('menue-vorwaermen');
          if (!offen) root.hidden = true;
        }));
      },
      /** Ausblenden; erfüllt, wenn es ganz weg ist (dann hidden). sofort: ohne Überblenden (Testschnittstelle). */
      hide(sofort = false) {
        if (!offen) return Promise.resolve();
        offen = false;
        if (momentBis) momentBis = 1; // ein unterbrochener Moment spielt beim nächsten Öffnen nicht noch einmal
        schliesseFrage(false, true);
        if (root.contains(document.activeElement)) document.activeElement.blur();
        root.inert = true;
        root.classList.add('menue-aus');
        beobachter?.disconnect();
        cancelAnimationFrame(plan);
        plan = 0;
        clearTimeout(zeitAus);
        return new Promise((resolve) => {
          zeitAus = setTimeout(() => { if (!offen) root.hidden = true; resolve(); }, sofort ? 0 : AUS_MS);
          if (sofort) root.hidden = true;
        });
      },
      /**
       * Für den Tastatur-Handler des Spiels, solange das Menü offen ist: true, wenn die Taste dem Menü gehört (dann
       * nichts weiter tun). Liegt der Fokus ausserhalb (Klick ins Leere), holen ihn Pfeile und Tab zurück ins Menü.
       */
      keydown(e) {
        if (!offen) return false;
        if (root.contains(e.target)) return e.defaultPrevented || taste(e) && (e.preventDefault(), true);
        if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'].includes(e.key)) {
          e.preventDefault();
          if (frage) neinBtn.focus(); else fokussiere(startFokus());
          return true;
        }
        if (frage && e.key === 'Escape') { schliesseFrage(false); return true; }
        return false;
      },
    };
  };
})();

/* =====================================================================
   ÜBERSICHT DES GRADS (Ticket 06, Spec .scratch/noa-geschichte/, Entscheide 9, 16, 19, 24) — Baustein aus
   .scratch/noa-geschichte/bausteine/uebersicht/ (dort LIESMICH.md mit Schnittstelle und probe.html).
   Ersetzt die Levelauswahl: je Welt eine Reihe mit Station, Name und Summe der Bestzeiten, je Level eine Kachel mit
   Nummer, Titel, gelöst, Bestzeit und wenigsten Drehungen. Gelöste Level sind wieder spielbar, das nächste ungelöste
   ist offen, spätere sind gesperrt (sichtbar, nicht wählbar). «Im Dorf» als eigene Reihe, wenn es gespielt wurde.
   Seit Ticket 08 von .scratch/kleiner-wagen/ als «Sternhaufen» (Variante C des Skizzenkatalogs, gewählt vom Nutzer):
   Die Übersicht ist ein Himmel mit dem Kleinen Wagen im Stand des Grads; um jeden Stern stehen die zehn Level seiner
   Welt als kleine Sterne (gelöst hell, das nächste mit Ring, gesperrt blass), «Im Dorf» als eigener Haufen. Ein Haufen
   ist die Station seiner Welt: Antippen zeigt ihre Level daneben (Desktop, Handy quer) bzw. darunter (Handy hoch) als
   Liste mit Bestwerten, eine Welt je Seite; blättern auch mit den Pfeilen oder Wischen über die Liste (mit Bewegung,
   wie die bisherige Levelauswahl). Den Stand liefert story.overviewData, die Wahl nimmt story.playFromOverview. Der
   Baustein in .scratch/noa-geschichte/bausteine/uebersicht/ (Reihen und Lichtwege) ist damit überholt.
   Beim Einbau geändert (im Baustein nachgeführt): Trennung erst vor einem Rest von vier Buchstaben (Asteroiden-gürtel
   statt Asteroidengür-tel); daten.geschafft (Finale gesehen) statt «alle gelöst» für den Kopf; daten.dorf.frei (nach
   «Überspringen» sind alle Übungen spielbar, Ticket 07).
   ===================================================================== */

/**
 * Baut die Übersicht in root (ein leeres Element, z. B. <div id="uebersicht">) und gibt { show, hide, vorwaermen,
 * offen } zurück.
 * icons: Zeichen der Stationen (im Spiel STORY_ICONS: dorf, wald, meer, …), Inhalt eines SVG mit viewBox 0 0 24 24.
 * wagen: Form und Linien des Kleinen Wagens { form, linien, polarstern } (im Spiel das Modul wagen); Welt i hat Stern
 * i + 1, er ist wach, sobald alle Level der Welt gelöst sind, der Polarstern, wenn der Grad geschafft ist.
 * onPlay({ welt, level, wiederholen, eintrag }): eine offene, freie oder gelöste Kachel gewählt; welt ist der Index in
 * daten.welten oder 'dorf', level der Index in der Reihe, wiederholen true bei einem gelösten Level, eintrag das
 * Objekt aus den Daten. onClose(): Escape, «Schliessen» oder Klick neben die Kacheln. Beide schliessen nicht selbst;
 * der Aufrufer ruft hide().
 */
function createUebersicht({ root, icons = {}, wagen = null, onPlay = () => {}, onClose = () => {} }) {
  /** Handy hoch (Liste unter dem Himmel; gleich wie im CSS der Übersicht) */
  const HOCH = '(max-width: 600px) and (orientation: portrait)';
  /**
   * Himmel der Übersicht: echte Helligkeit (mag) der Sterne 1 … 7 für die Grösse der Punkte (wie die Sternkarte im
   * Menü), wohin ihre Namen stehen (hoch steht der von Stern 1 darüber); dorf: Lage des Haufens «Im Dorf» in Einheiten
   * der Form (unter der Deichsel, wo der Wagen frei lässt); rand: Platz (px) um den Wagen für Haufen und Namen;
   * gross: höchstens so viele px je Einheit der Form; haufen: Radius des Kreises der Level (Einheiten der Form).
   */
  const HIMMEL = {
    mag: [2.1, 3.0, 4.9, 4.3, 4.2, 4.3, 2.0],
    richtung: [[1, -0.15], [0.3, 1], [-0.35, 1], [0.35, -1], [0.3, -1], [0.3, -1], [0, -1]],
    richtungHoch: { 1: [0.25, -1] },
    dorf: [-50, 21],
    rand: { links: 46, rechts: 132, oben: 74, unten: 70 },
    randKlein: { links: 22, rechts: 52, oben: 42, unten: 40 },
    gross: 6.3, haufen: 5.4,
  };
  const form = wagen?.form ?? [], linien = wagen?.linien ?? [], polar = wagen?.polarstern ?? form.length;
  /** Wischen und Blättern mit den Werten der früheren Levelauswahl (bis Ticket 04 im Spiel) */
  const WISCH = { min: 50, schwelle: 10, steigung: 0.6, gummi: 0.3, ms: 280, easing: 'cubic-bezier(0.25, 0.8, 0.3, 1)' };
  /** wie GRAD_ANZEIGE im Spiel */
  const GRADE = {
    'leicht': { name: 'Leicht', punkte: 1 }, 'mittel': { name: 'Mittel', punkte: 2 },
    'schwer': { name: 'Schwer', punkte: 3 }, 'sehr schwer': { name: 'Sehr schwer', punkte: 4 },
  };
  /** eigene Zeichen, im Strich der STORY_ICONS */
  const Z = {
    uhr: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    drehung: '<path d="M19 12a7 7 0 1 1-2.05-4.95"/><path d="M17.3 3.6v3.6h-3.6"/>',
    schloss: '<rect x="6" y="11" width="12" height="8.5" rx="1.5"/><path d="M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11"/>',
    links: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
    rechts: '<path d="M9.5 5.5l6.5 6.5-6.5 6.5"/>',
    zu: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ico = (pfad, cls = '') => `<svg class="ueb-ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${pfad ?? ''}</svg>`;
  const wert = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  /** 1:42, ab einer Stunde 1:02:05 (wie formatDuration im Spiel) */
  const zeit = (sek) => {
    const s = Math.floor(sek), z = (n) => String(n).padStart(2, '0'), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
    return h ? `${h}:${z(m)}:${z(s % 60)}` : `${m}:${z(s % 60)}`;
  };
  /** für Bildschirmleser «1 Minute 42 Sekunden» statt «1:42» */
  const sprichZeit = (sek) => {
    const s = Math.floor(sek), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, r = s % 60, t = [];
    if (h) t.push(`${h} ${h === 1 ? 'Stunde' : 'Stunden'}`);
    if (m) t.push(`${m} ${m === 1 ? 'Minute' : 'Minuten'}`);
    if (r || !t.length) t.push(`${r} ${r === 1 ? 'Sekunde' : 'Sekunden'}`);
    return t.join(' ');
  };
  const drehungen = (n) => `${n} ${n === 1 ? 'Drehung' : 'Drehungen'}`;
  /**
   * Weiche Trennstriche in langen Wörtern, ohne Wörterbuch (hyphens: auto kennt Deutsch nicht in jedem Browser): in
   * jeder Gruppe von Konsonanten zwischen zwei Vokalen vor dem längsten Anlaut, mit dem ein deutsches Wort beginnen
   * kann (Schaum-krone, Feuer-schlund, See-pferd-chen, Luft-spiegelung), sonst vor dem letzten Konsonanten
   * (Asteroiden-gürtel); vorn zwei, hinten vier Buchstaben mindestens (sonst Asteroidengür-tel, Bärenhü-ter). Gebraucht
   * nur, wenn ein Wort auch klein nicht in die Kachel passt (.ueb-brich); sonst trennt das CSS nicht.
   */
  const VOKAL = /[aeiouyäöüàéèê]/i;
  const ANLAUT = ['schr', 'schl', 'schm', 'schn', 'schw', 'spr', 'str', 'pfl', 'pfr', 'sch', 'pf', 'bl', 'br', 'ch', 'ck',
    'dr', 'fl', 'fr', 'gl', 'gr', 'kl', 'kn', 'kr', 'ph', 'pl', 'pr', 'sp', 'st', 'th', 'tr', 'zw'];
  const SHY = String.fromCharCode(0xad);
  const trenne = (titel) => String(titel ?? '').replace(/\p{L}{9,}/gu, (w) => {
    const klein = w.toLowerCase(), stellen = [];
    for (let i = 1; i < w.length; i++) {
      if (VOKAL.test(klein[i]) || !VOKAL.test(klein[i - 1])) continue; // Anfang einer Gruppe von Konsonanten
      let e = i;
      while (e < w.length && !VOKAL.test(klein[e])) e++;
      if (e >= w.length) break; // am Wortende: keine Trennstelle
      const gruppe = klein.slice(i, e), anlaut = ANLAUT.find((a) => gruppe.endsWith(a));
      const t = e - (anlaut ? anlaut.length : 1);
      if (t >= 2 && w.length - t >= 4) stellen.push(t);
      i = e;
    }
    return stellen.reduceRight((s, t) => s.slice(0, t) + SHY + s.slice(t), w);
  });
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const uid = `ueb-${Math.random().toString(36).slice(2, 8)}`;
  /** Polarstern klein (wie im Menü): ein geschaffter Grad */
  const STERN = `<svg class="ueb-stern" viewBox="-50 -50 100 100" aria-hidden="true"><defs><radialGradient id="${uid}-hof">
    <stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="0.3" stop-color="#cdd4ff" stop-opacity="0.22"/>
    <stop offset="1" stop-color="#aab4ff" stop-opacity="0"/></radialGradient></defs><circle r="46" fill="url(#${uid}-hof)"/>
    <path d="M0-46L2.6-2.6 32 0 2.6 2.6 0 46-2.6 2.6-32 0-2.6-2.6z" fill="#fff"/><circle r="5" fill="#fff"/></svg>`;

  root.classList.add('ueb', 'ueb-zu');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', `${uid}-titel`);
  root.setAttribute('aria-describedby', `${uid}-grad`);
  root.inert = true;
  root.innerHTML = `
    <div class="ueb-rahmen">
      <header class="ueb-kopf">
        <div class="ueb-kopftext">
          <h2 class="ueb-titel" id="${uid}-titel">Übersicht</h2>
          <p class="ueb-grad" id="${uid}-grad"></p>
        </div>
        <p class="ueb-legende" aria-hidden="true"><span>${ico(Z.uhr)}Bestzeit</span><span>${ico(Z.drehung)}wenigste Drehungen</span></p>
      </header>
      <nav class="ueb-stationen" aria-label="Welten"></nav>
      <div class="ueb-pager">
        <button class="ueb-schritt" data-schritt="-1" aria-label="Vorige Welt">${ico(Z.links)}</button>
        <div class="ueb-seitentitel"></div>
        <button class="ueb-schritt" data-schritt="1" aria-label="Nächste Welt">${ico(Z.rechts)}</button>
      </div>
      <div class="ueb-fenster"><div class="ueb-spur"></div></div>
      <footer class="ueb-fuss"><button class="ueb-schliessen" aria-label="Schliessen">${ico(Z.zu)}<span>Schliessen</span></button></footer>
    </div>
    <p class="ueb-hinweis" role="status"></p>`;
  const $ = (sel) => root.querySelector(sel);
  const rahmen = $('.ueb-rahmen'), gradEl = $('.ueb-grad'), stationen = $('.ueb-stationen'), seitentitel = $('.ueb-seitentitel');
  const fenster = $('.ueb-fenster'), spur = $('.ueb-spur'), hinweis = $('.ueb-hinweis');
  const schritte = [...root.querySelectorAll('.ueb-schritt')];

  let daten = null, reihen = [], seite = 0, modus = 'seiten', offen = false;
  root.dataset.modus = modus; // vor dem ersten Messen (zeichneHimmel): das CSS richtet sich danach
  const himmelMass = { fenster: '', W: 0, H: 0 }; // Grösse des Himmels (zeichneHimmel) bei dieser Grösse des Fensters
  let himmelWas = '';   // was der Himmel zeigt: dasselbe nicht neu zeichnen
  let datenWas = '';    // mit welchen Daten Kopf und Kacheln gezeichnet sind (zeichne)
  let himmelPlan = 0;   // Himmel im nächsten Bild (himmelBald)
  let wisch = null, gewischtUm = -Infinity, gezeigtUm = -Infinity, fahrt = null, hinweisUhr = 0;

  /**
   * Reihen der Übersicht: «Im Dorf» (falls gespielt), dann die Welten. Zustand je Level: gelöst (spielbar), offen (das
   * erste ungelöste der Kette) oder gesperrt (jedes spätere ungelöste). Die Welten bilden eine Kette über alle Reihen,
   * das Dorf eine eigene. Mit dorf.frei (nach «Überspringen») ist dort jede ungelöste Übung frei: spielbar wie die
   * offene, ohne deren Hof.
   */
  function baueReihen(d) {
    const r = [];
    if (d.dorf) r.push({ art: 'dorf', schluessel: 'dorf', name: d.dorf.name ?? 'Im Dorf', icon: d.dorf.icon ?? 'dorf', level: d.dorf.level ?? [] });
    (d.welten ?? []).forEach((w, i) => r.push({ art: 'welt', schluessel: i, name: w.name, icon: w.icon, level: w.level ?? [] }));
    for (const art of ['dorf', 'welt']) {
      let frei = true;
      const alleFrei = art === 'dorf' && !!d.dorf?.frei;
      for (const re of r.filter((x) => x.art === art)) {
        re.zustand = re.level.map((l) => {
          if (l.geloest) return 'geloest';
          if (alleFrei) return 'frei';
          if (frei) { frei = false; return 'offen'; }
          return 'gesperrt';
        });
      }
    }
    for (const re of r) {
      const mitZeit = re.level.filter((l) => l.geloest && wert(l.bestzeit));
      re.geloest = re.zustand.filter((z) => z === 'geloest').length;
      re.mitZeit = mitZeit.length;
      re.summe = mitZeit.reduce((s, l) => s + Math.floor(l.bestzeit), 0);
      re.lage = re.level.length && re.geloest === re.level.length ? 'fertig'
        : re.zustand.some((z) => z === 'offen' || z === 'frei') || re.geloest ? 'jetzt' : 'spaeter';
    }
    return r;
  }

  /** «4 / 10 · ◷ 6:12» (sichtbar) und «Meer: 4 von 10 gelöst, Summe der Bestzeiten …» (Bildschirmleser) */
  const standHtml = (re) => `<span>${re.geloest} / ${re.level.length}</span>` +
    (re.mitZeit ? `<span class="ueb-wert">${ico(Z.uhr)}${zeit(re.summe)}</span>` : '');
  const standText = (re) => `${re.name}: ${re.geloest} von ${re.level.length} gelöst` +
    (re.mitZeit ? `, Summe der Bestzeiten ${sprichZeit(re.summe)}` : '');

  function kachelHtml(re, l) {
    const lvl = re.level[l], z = re.zustand[l], titel = lvl.titel ?? lvl.name ?? '';
    const art = re.art === 'dorf' ? 'Übung' : 'Level';
    const mitZeit = z === 'geloest' && wert(lvl.bestzeit), mitDr = z === 'geloest' && wert(lvl.drehungen);
    const aktuell = daten.aktuell && daten.aktuell.welt === re.schluessel && daten.aktuell.level === l;
    let unten = '';
    if (z === 'gesperrt') unten = `<span class="ueb-schloss">${ico(Z.schloss)}</span>`;
    else if (z === 'offen' || z === 'frei') unten = `<span class="ueb-los">${re.art === 'dorf' ? 'Üben' : 'Weiter'}${ico(Z.rechts)}</span>`;
    else unten = (mitZeit ? `<span class="ueb-wert">${ico(Z.uhr)}${zeit(lvl.bestzeit)}</span>` : '<span></span>') +
      (mitDr ? `<span class="ueb-wert">${ico(Z.drehung)}${Math.round(lvl.drehungen)}</span>` : '');
    const sprache = [`${art} ${l + 1}`, titel, z === 'gesperrt' ? 'gesperrt'
      : z === 'offen' ? (re.art === 'dorf' ? 'als Nächstes zu üben' : 'als Nächstes zu spielen') : z === 'frei' ? 'frei' : 'gelöst'];
    if (mitZeit) sprache.push(`Bestzeit ${sprichZeit(lvl.bestzeit)}`);
    if (mitDr) sprache.push(`wenigste ${drehungen(Math.round(lvl.drehungen))}`);
    if (aktuell) sprache.push('läuft gerade');
    return `<li><button class="ueb-kachel ueb-${z}" tabindex="-1" aria-label="${esc(sprache.join(', '))}"` +
      `${z === 'gesperrt' ? ' aria-disabled="true"' : ''}${aktuell ? ' aria-current="true"' : ''}>` +
      `<span class="ueb-nr">${l + 1}</span>${z === 'geloest' ? '<span class="ueb-punkt"></span>' : ''}` +
      `<span class="ueb-name">${esc(trenne(titel))}</span><span class="ueb-unten">${unten}</span></button></li>`;
  }

  function reiheHtml(re, r) {
    return `<section class="ueb-welt ueb-${re.lage}" data-reihe="${r}" role="group" aria-label="${esc(standText(re))}">
      <div class="ueb-welt-kopf" aria-hidden="true">
        <span class="ueb-welt-text"><span class="ueb-welt-name">${esc(re.name)}</span><span class="ueb-welt-stand">${standHtml(re)}</span></span>
        <span class="ueb-station">${ico(icons[re.icon])}</span>
      </div>
      <ol class="ueb-kacheln">${re.level.map((_, l) => kachelHtml(re, l)).join('')}</ol>
    </section>`;
  }

  function zeichne() {
    // derselbe Stand wie beim letzten Zeigen: Kopf und Kacheln stehen schon (das Öffnen braucht dann kein neues Layout)
    const was = JSON.stringify(daten);
    if (was === datenWas) return;
    datenWas = was;
    const g = (typeof daten.grad === 'string' ? GRADE[daten.grad] : daten.grad) ?? { name: String(daten.grad ?? ''), punkte: 0 };
    const welten = reihen.filter((re) => re.art === 'welt');
    const geloest = welten.reduce((s, re) => s + re.geloest, 0), gesamt = welten.reduce((s, re) => s + re.level.length, 0);
    // geschafft heisst: Finale gesehen (daten.geschafft); ohne Angabe, wenn alle gelöst sind
    const geschafft = typeof daten.geschafft === 'boolean' ? daten.geschafft : gesamt > 0 && geloest === gesamt;
    const summe = welten.reduce((s, re) => s + re.summe, 0), alleZeiten = welten.every((re) => re.mitZeit === re.level.length);
    gradEl.innerHTML = `<span class="ueb-gradzeile" aria-hidden="true"><span class="ueb-pips">${[1, 2, 3, 4]
      .map((i) => `<i${i <= g.punkte ? ' class="ueb-an"' : ''}></i>`).join('')}</span><span class="ueb-gradname">${esc(g.name)}</span></span>` +
      `<span class="ueb-fortschritt" aria-hidden="true">${geschafft ? `${STERN}<span>Geschafft</span><span class="ueb-trenn">·</span>` : ''}` +
      `<span>${geloest} / ${gesamt}</span>${geschafft && alleZeiten ? `<span class="ueb-trenn">·</span><span class="ueb-wert">${ico(Z.uhr)}${zeit(summe)}</span>` : ''}</span>` +
      `<span class="ueb-sr">${esc(g.name)}, ${geschafft ? 'geschafft, ' : ''}${geloest} von ${gesamt} Level gelöst` +
      `${geschafft && alleZeiten ? `, Summe der Bestzeiten ${sprichZeit(summe)}` : ''}</span>`;
    root.classList.toggle('ueb-geschafft', geschafft);
    spur.innerHTML = reihen.map(reiheHtml).join('');
  }

  /**
   * Der Himmel der Übersicht: der Kleine Wagen im Stand des Grads (wache Sterne hell und verbunden, noch fehlende
   * Linien blass, ein Ring um den Stern der Welt, die dran ist), um jeden Stern die Level seiner Welt als kleine Sterne
   * (gelöst hell, offen mit Ring, frei klein, gesperrt blass), «Im Dorf» als eigener Haufen mit seinem Zeichen; daneben
   * Name und Stand. Die Stationen (ueb-tab) liegen als Ziele über den Haufen. In Pixeln von .ueb-stationen; ihre Grösse
   * hängt nur am Fenster und am Kopf und wird je Fenster und Kopf einmal gemessen (sonst hielte jedes Öffnen für ein
   * Layout an).
   * Zeigt er schon dasselbe (gleicher Stand, gleiche Grösse), bleibt er stehen. true: neu gezeichnet.
   */
  function zeichneHimmel() {
    if (!form.length) return false;
    const fenster = `${innerWidth}x${innerHeight}:${gradEl.textContent}`;
    if (himmelMass.fenster !== fenster) {
      const R = stationen.getBoundingClientRect();
      Object.assign(himmelMass, { fenster, W: R.width / SEITE, H: R.height / SEITE });
    }
    const { W, H } = himmelMass;
    if (!W || !H) { himmelMass.fenster = ''; return false; }
    const was = [W, H, root.classList.contains('ueb-geschafft'), ...reihen.map((re) => `${re.name}:${re.zustand.join()}:${re.summe}`)].join('|');
    if (was === himmelWas) return false;
    himmelWas = was;
    const klein = W < 640 || H < 420, rand = klein ? HIMMEL.randKlein : HIMMEL.rand, hoch = matchMedia(seiteMedia(HOCH)).matches;
    const xs = form.map((p) => p[0]), ys = form.map((p) => p[1]);
    const x0 = Math.min(...xs), y0 = Math.min(...ys), bw = Math.max(...xs) - x0, bh = Math.max(...ys) - y0;
    const s = Math.max(0.8, Math.min((W - rand.links - rand.rechts) / bw, (H - rand.oben - rand.unten) / bh, HIMMEL.gross));
    const ox = rand.links + (W - rand.links - rand.rechts - bw * s) / 2 - x0 * s;
    const oy = rand.oben + (H - rand.oben - rand.unten - bh * s) / 2 - y0 * s;
    const P = (k) => [ox + form[k - 1][0] * s, oy + form[k - 1][1] * s];
    const welten = reihen.filter((re) => re.art === 'welt'), dorf = reihen.find((re) => re.art === 'dorf');
    const geschafft = root.classList.contains('ueb-geschafft');
    const wach = (k) => (k === polar ? geschafft : welten[k - 1]?.lage === 'fertig');
    const naechster = geschafft ? 0 : welten.findIndex((re) => re.lage !== 'fertig') + 1;
    const f = (v) => v.toFixed(1), r = HIMMEL.haufen * s, punkt = Math.max(1.4, Math.min(2.4, 0.38 * s));
    const kern = Math.max(1.6, Math.min(3.6, 0.57 * s)), breite = Math.max(0.8, Math.min(1.7, 0.45 + 0.24 * s));
    let haufen = '', wagenTeil = '', namen = '';
    const kreis = (cx, cy, re, rr) => re.zustand.forEach((z, j) => {
      const a = -Math.PI / 2 + j * 2 * Math.PI / re.zustand.length, x = f(cx + Math.cos(a) * rr), y = f(cy + Math.sin(a) * rr);
      if (z === 'geloest') haufen += `<circle class="ueb-l-schein" cx="${x}" cy="${y}" r="${f(punkt * 2.6)}"/><circle class="ueb-l" cx="${x}" cy="${y}" r="${f(punkt)}"/>`;
      else if (z === 'offen') haufen += `<circle class="ueb-l ueb-l-offen" cx="${x}" cy="${y}" r="${f(punkt * 0.8)}"/><circle class="ueb-l-ring" cx="${x}" cy="${y}" r="${f(punkt * 2.2)}"/>`;
      else haufen += `<circle class="ueb-l ueb-l-${z}" cx="${x}" cy="${y}" r="${f(punkt * (z === 'frei' ? 0.8 : 0.6))}"/>`;
    });
    const name = (x, y, dir, ab, text, zahl, cls) => {
      const n = Math.hypot(dir[0], dir[1]), dx = dir[0] / n, dy = dir[1] / n, tx = f(x + dx * ab), ty = f(y + dy * ab);
      const seit = Math.abs(dx) > Math.abs(dy), anker = seit ? (dx > 0 ? 'start' : 'end') : 'middle';
      const lage = seit ? 'central' : dy > 0 ? 'hanging' : 'auto';
      const [d1, d2] = !zahl ? ['0', '0'] : seit ? ['-0.6em', '1.25em'] : dy > 0 ? ['0', '1.3em'] : ['-1.15em', '1.3em'];
      namen += `<text class="ueb-h-name ${cls}" x="${tx}" y="${ty}" text-anchor="${anker}" dominant-baseline="${lage}">`
        + `<tspan x="${tx}" dy="${d1}">${esc(text)}</tspan>${zahl ? `<tspan class="ueb-h-zahl" x="${tx}" dy="${d2}">${zahl}</tspan>` : ''}</text>`;
    };
    const ziele = []; // je Reihe ihre Station, in der Reihenfolge der Reihen (Tab und Pfeile)
    const ziel = (re, x, y, rr) => {
      const d = Math.max(44, 2 * (rr + punkt * 3) + 4);
      ziele[reihen.indexOf(re)] = `<button class="ueb-tab ueb-${re.lage}" data-reihe="${reihen.indexOf(re)}" aria-label="${esc(standText(re))}"`
        + ` style="left:${f(x - d / 2)}px;top:${f(y - d / 2)}px;width:${f(d)}px;height:${f(d)}px"></button>`;
    };
    welten.forEach((re, i) => {
      const k = i + 1;
      if (k >= polar) return;
      const [x, y] = P(k);
      kreis(x, y, re, r);
      ziel(re, x, y, r);
      name(x, y, (hoch && HIMMEL.richtungHoch[k]) || HIMMEL.richtung[k - 1], r + Math.max(9, 3 * s), re.name,
        `${re.geloest} / ${re.level.length}`, wach(k) ? 'ueb-an' : k === naechster ? 'ueb-jetzt' : '');
    });
    if (dorf) {
      const x = ox + HIMMEL.dorf[0] * s, y = oy + HIMMEL.dorf[1] * s, rr = r * 0.8, z = Math.max(14, 2.2 * s);
      kreis(x, y, dorf, rr);
      ziel(dorf, x, y, rr);
      haufen += `<svg class="ueb-h-dorf" x="${f(x - z / 2)}" y="${f(y - z / 2)}" width="${f(z)}" height="${f(z)}" viewBox="0 0 24 24">${icons[dorf.icon] ?? ''}</svg>`;
      name(x, y, [1, 0], rr + Math.max(9, 3 * s), dorf.name, `${dorf.geloest} / ${dorf.level.length}`, dorf.lage === 'fertig' ? 'ueb-an' : '');
    }
    for (const l of linien) {
      const [ax, ay] = P(l[0]), [bx, by] = P(l[1]), xy = `x1="${f(ax)}" y1="${f(ay)}" x2="${f(bx)}" y2="${f(by)}"`;
      wagenTeil += `<line class="${wach(l[0]) && wach(l[1]) ? 'ueb-h-linie' : 'ueb-h-geist'}" ${xy} stroke-width="${f(breite)}"/>`;
    }
    for (let k = 1; k <= form.length; k++) {
      const [x, y] = P(k), m = 1 + (4.9 - HIMMEL.mag[k - 1]) * 0.3, an = wach(k);
      if (an || k === polar) wagenTeil += `<circle class="ueb-h-schein" fill="url(#${uid}-schein)" cx="${f(x)}" cy="${f(y)}" r="${f(kern * 5.5 * m * (an ? 1 : 0.6))}"/>`;
      wagenTeil += `<circle class="ueb-h-stern${an ? ' ueb-an' : ''}" cx="${f(x)}" cy="${f(y)}" r="${f(kern * m * (an ? 1 : 0.62))}"/>`;
      if (k === naechster) wagenTeil += `<circle class="ueb-h-ring" cx="${f(x)}" cy="${f(y)}" r="${f(r + 6)}"/>`;
    }
    const [px, py] = P(polar);
    name(px, py, HIMMEL.richtung[polar - 1], Math.max(12, 4 * s), 'Polarstern', '', geschafft ? 'ueb-an' : '');
    stationen.innerHTML = `<svg class="ueb-himmel" viewBox="0 0 ${f(W)} ${f(H)}" aria-hidden="true" focusable="false">`
      + `<defs><radialGradient id="${uid}-schein"><stop offset="0" stop-color="#fff" stop-opacity="0.8"/>`
      + `<stop offset="0.22" stop-color="#dfe3ff" stop-opacity="0.32"/><stop offset="1" stop-color="#aab4ff" stop-opacity="0"/>`
      + `</radialGradient></defs>${haufen}${wagenTeil}${namen}</svg>${ziele.join('')}`;
    return true;
  }

  /**
   * Den Himmel im nächsten Bild zeichnen (beim Öffnen; die Übersicht blendet da erst ein): show misst dann kein Layout,
   * es fällt ins Layout des Bilds. Die Stationen bekommen danach ihre gezeigte Welt (zeigeSeitenkopf).
   */
  function himmelBald() {
    cancelAnimationFrame(himmelPlan);
    himmelPlan = requestAnimationFrame(() => { himmelPlan = 0; if (offen && zeichneHimmel()) zeigeSeitenkopf(); });
  }

  const kacheln = (r) => [...(spur.children[r]?.querySelectorAll('.ueb-kachel') ?? [])];
  /** die offene Kachel einer Kette ('welt' oder 'dorf') als [Reihe, Level], sonst null */
  function offeneKachel(art) {
    const r = reihen.findIndex((re) => re.art === art && re.zustand.includes('offen'));
    return r < 0 ? null : [r, reihen[r].zustand.indexOf('offen')];
  }
  /** Kachel, die beim Öffnen den Fokus bekommt: gewählt, sonst das laufende Level, sonst das offene, sonst die erste
   * der ersten Welt */
  function startZiel(wahl) {
    const finde = (a) => {
      if (!a) return null;
      const r = reihen.findIndex((re) => re.schluessel === a.welt);
      return r >= 0 && reihen[r].level[a.level ?? 0] ? [r, a.level ?? 0] : null;
    };
    const erste = Math.max(0, reihen.findIndex((re) => re.art === 'welt'));
    return finde(wahl.fokus) ?? finde(daten.aktuell) ?? offeneKachel('welt') ?? offeneKachel('dorf') ?? [erste, 0];
  }

  /** Nur eine Kachel ist mit Tab erreichbar (die zuletzt fokussierte), die übrigen mit den Pfeiltasten */
  function rolle(k) {
    if (!k) return;
    for (const alt of spur.querySelectorAll('.ueb-kachel[tabindex="0"]')) if (alt !== k) alt.tabIndex = -1;
    k.tabIndex = 0;
  }
  function fokussiere(r, l) {
    const k = kacheln(r)[l];
    if (!k) return;
    if (modus === 'seiten' && r !== seite) blaettere(r, { bewegt: Math.abs(r - seite) === 1 });
    rolle(k);
    k.focus();
  }

  // ---------- Seiten: eine Welt je Seite, Blättern mit Bewegung ----------
  /** Eine Welt je Seite (seit dem Himmel der Übersicht immer; früher auf dem Desktop alle untereinander) */
  function setzeModus() {
    if (modus !== 'seiten') { modus = 'seiten'; root.dataset.modus = modus; }
    ordne();
  }
  /** Seiten in Ruhe: nur die gezeigte ist bedienbar (die übrigen liegen daneben, beim Wischen sichtbar) */
  function ordne() {
    beendeFahrt();
    [...spur.children].forEach((s, r) => { s.inert = modus === 'seiten' && r !== seite; });
    schiebe(0);
  }
  const schrittweite = () => spur.clientWidth + (parseFloat(getComputedStyle(spur).columnGap) || 0);
  /** Spur in Ruhe (dx 0) oder um dx px aus der Ruhe (beim Wischen) */
  function schiebe(dx) {
    // in Ruhe in Anteilen der Breite (ohne zu messen: das Öffnen braucht so kein Layout), beim Wischen in px
    spur.style.transform = modus !== 'seiten' || !(seite || dx) ? '' : dx ? `translateX(${-seite * schrittweite() + dx}px)`
      : `translateX(calc(${-seite} * (100% + ${parseFloat(getComputedStyle(spur).columnGap) || 0}px)))`;
  }
  function fahre(von, nach) {
    const anim = spur.animate([{ transform: `translateX(${von}px)` }, { transform: `translateX(${nach}px)` }],
      { duration: WISCH.ms * Math.min(1, Math.abs(nach - von) / schrittweite()), easing: WISCH.easing });
    fahrt = { anim };
    anim.onfinish = () => { if (fahrt?.anim === anim) beendeFahrt(); };
  }
  /** laufende Bewegung gleich fertig (der Endstand ist schon gesetzt) */
  function beendeFahrt() {
    const f = fahrt;
    fahrt = null;
    f?.anim.cancel();
  }
  /**
   * Zur Seite ziel blättern: Kopf, Stationen und Pfeile wechseln gleich, die Kacheln fahren (bewegt, ausser bei
   * reduzierter Bewegung). von: wo die Spur beim Wischen schon steht (px aus der Ruhe der alten Seite).
   */
  function blaettere(ziel, { von = 0, bewegt = true } = {}) {
    if (modus !== 'seiten' || ziel < 0 || ziel >= reihen.length || ziel === seite) {
      if (von) zurueck(von);
      return false;
    }
    beendeFahrt();
    const w = schrittweite(), start = -seite * w + von;
    seite = ziel;
    [...spur.children].forEach((s, r) => { s.inert = r !== seite; });
    // Tab führt auf der neuen Seite zu ihrer offenen Kachel, sonst zur ersten
    if (!spur.children[seite].contains(spur.querySelector('.ueb-kachel[tabindex="0"]'))) {
      const z = reihen[seite].zustand.indexOf('offen');
      rolle(kacheln(seite)[Math.max(0, z)]);
    }
    zeigeSeitenkopf();
    schiebe(0);
    if (bewegt && !still()) fahre(start, -seite * w);
    return true;
  }
  /** zu kurz gewischt oder am Rand: zurück in die Ruhe */
  function zurueck(von) {
    schiebe(0);
    if (!still()) fahre(-seite * schrittweite() + von, -seite * schrittweite());
  }
  /** Kopf der gezeigten Seite: Station, Name, Stand; Pfeile und Stationen dazu */
  function zeigeSeitenkopf() {
    const re = reihen[seite];
    if (!re) return;
    seitentitel.innerHTML = `<span class="ueb-seitenname" aria-hidden="true">${ico(icons[re.icon])}<span class="ueb-welt-name">${esc(re.name)}</span></span>` +
      `<span class="ueb-welt-stand" aria-hidden="true">${standHtml(re)}</span><span class="ueb-sr">${esc(standText(re))}</span>`;
    const weg = document.activeElement;
    schritte[0].disabled = seite === 0;
    schritte[1].disabled = seite === reihen.length - 1;
    if (weg?.disabled) schritte[weg === schritte[0] ? 1 : 0].focus(); // Pfeil am Ende: Fokus nicht verlieren
    for (const t of stationen.querySelectorAll('.ueb-tab')) {
      if (+t.dataset.reihe === seite) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    }
  }

  // ---------- Titel: lange Wörter kleiner, nur notfalls mitten im Wort umbrechen ----------
  function passeTitelAn() {
    const namen = [...spur.querySelectorAll('.ueb-name')];
    for (const t of namen) t.classList.remove('ueb-eng', 'ueb-brich');
    const zuBreit = (t) => t.scrollWidth > t.clientWidth + 1;
    const lang = namen.filter(zuBreit);
    lang.forEach((t) => t.classList.add('ueb-eng'));
    lang.filter(zuBreit).forEach((t) => t.classList.add('ueb-brich'));
  }

  // ---------- Hinweis (gesperrte Kachel) ----------
  /** Hinweis kurz zeigen: über der Kachel nahe (ohne Platz darüber darunter), ohne Kachel über dem Fuss (Review
   * Ticket 06: unten in der Mitte war er weit weg von der Kachel, die man angeklickt hatte) */
  function sage(text, nahe = null) {
    hinweis.textContent = text;
    const bei = !!nahe;
    hinweis.classList.toggle('ueb-bei', bei);
    hinweis.style.left = hinweis.style.top = '';
    if (bei) {
      // in Pixeln der Oberfläche (SEITE)
      const b = nahe.getBoundingClientRect(), r = { left: b.left / SEITE, width: b.width / SEITE, top: b.top / SEITE, bottom: b.bottom / SEITE };
      const w = hinweis.offsetWidth, h = hinweis.offsetHeight, ab = 10;
      const x = Math.min(Math.max(r.left + r.width / 2, 16 + w / 2), innerWidth / SEITE - 16 - w / 2);
      hinweis.style.left = `${x}px`;
      hinweis.style.top = `${r.top - ab - h >= 8 ? r.top - ab - h : r.bottom + ab}px`;
    }
    hinweis.classList.add('ueb-da');
    clearTimeout(hinweisUhr);
    hinweisUhr = setTimeout(() => hinweis.classList.remove('ueb-da'), 2800);
  }

  // ---------- Bedienung ----------
  spur.addEventListener('click', (e) => {
    const k = e.target.closest('.ueb-kachel');
    if (!k) return;
    const r = +k.closest('.ueb-welt').dataset.reihe, l = kacheln(r).indexOf(k), re = reihen[r], z = re.zustand[l];
    rolle(k);
    if (z === 'gesperrt') {
      const o = offeneKachel(re.art);
      const vor = o && reihen[o[0]];
      const titel = vor ? vor.level[o[1]].titel ?? vor.level[o[1]].name ?? '' : '';
      sage(vor ? `Gesperrt – erst «${titel}» (${vor.name} ${o[1] + 1}) lösen` : 'Gesperrt', k);
      return;
    }
    onPlay({ welt: re.schluessel, level: l, wiederholen: z === 'geloest', eintrag: re.level[l] });
  });
  stationen.addEventListener('click', (e) => {
    const t = e.target.closest('.ueb-tab');
    if (t) blaettere(+t.dataset.reihe, { bewegt: Math.abs(+t.dataset.reihe - seite) === 1 });
  });
  for (const b of schritte) b.addEventListener('click', () => blaettere(seite + +b.dataset.schritt));
  $('.ueb-schliessen').addEventListener('click', () => onClose());
  // Klick neben die Kacheln (auf den Hintergrund) schliesst wie in der bisherigen Levelauswahl
  root.addEventListener('click', (e) => { if (e.target === root || e.target === rahmen) onClose(); });
  root.addEventListener('focusin', (e) => { if (e.target.classList?.contains('ueb-kachel')) rolle(e.target); });

  /**
   * Tasten (solange offen, vor dem Spiel abgefangen): Pfeile über die Kacheln (links/rechts in der Reihenfolge, auch
   * über die Grenze der Welt; hoch/runter eine Reihe), Pos1/Ende Anfang und Ende der Welt (mit Strg: ganz), Bild↑/↓
   * vorige und nächste Welt, Escape schliesst, Tab bleibt im Dialog. Ausserhalb der Kacheln blättern ←/→ (Seiten);
   * sonst holen die Pfeile den Fokus auf die Kacheln zurück (auf die, die Tab erreicht), und Pos1/Ende wirken wie von
   * ihr aus (Review Ticket 06: mit dem Fokus auf «Schliessen» taten sie nichts).
   */
  function taste(e) {
    if (!offen || e.altKey || e.metaKey || (e.ctrlKey && e.key !== 'Home' && e.key !== 'End')) return;
    const k = e.key, an = document.activeElement, kachel = an?.closest?.('.ueb-kachel');
    const nimm = () => { e.preventDefault(); e.stopPropagation(); };
    if (k === 'Enter' && e.repeat) { nimm(); return; } // gehaltenes Enter (etwa von der Karte im Menü) spielt nichts
    if (k === 'Escape') { nimm(); onClose(); return; }
    if (k === 'Tab') { e.stopPropagation(); falle(e); return; }
    const pfeile = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
    if (!pfeile.includes(k)) return;
    if (kachel && root.contains(kachel)) {
      const r = +kachel.closest('.ueb-welt').dataset.reihe, l = kacheln(r).indexOf(kachel), n = reihen[r].level.length;
      const letzte = (z) => reihen[z].level.length - 1;
      let ziel = null;
      if (k === 'ArrowRight') ziel = l < n - 1 ? [r, l + 1] : r < reihen.length - 1 ? [r + 1, 0] : null;
      else if (k === 'ArrowLeft') ziel = l > 0 ? [r, l - 1] : r > 0 ? [r - 1, letzte(r - 1)] : null;
      else if (k === 'Home') ziel = e.ctrlKey ? [0, 0] : [r, 0];
      else if (k === 'End') ziel = e.ctrlKey ? [reihen.length - 1, letzte(reihen.length - 1)] : [r, n - 1];
      else if (k === 'PageUp' || k === 'PageDown') {
        const z = r + (k === 'PageDown' || k === 'ArrowDown' ? 1 : -1);
        if (z >= 0 && z < reihen.length) ziel = [z, Math.min(l, letzte(z))];
      } else { // Seite: hoch und runter im Raster der Welt
        const sp = getComputedStyle(kachel.closest('.ueb-kacheln')).gridTemplateColumns.split(' ').length || 1;
        const z = l + (k === 'ArrowDown' ? sp : -sp);
        if (z >= 0 && z < n) ziel = [r, z];
        else if (k === 'ArrowDown' && Math.floor(l / sp) < Math.floor((n - 1) / sp)) ziel = [r, n - 1];
      }
      nimm();
      if (ziel) fokussiere(...ziel);
      return;
    }
    if (an?.closest?.('.ueb-stationen') && (k === 'ArrowLeft' || k === 'ArrowRight')) {
      const tabs = [...stationen.querySelectorAll('.ueb-tab')], i = tabs.indexOf(an.closest('.ueb-tab'));
      nimm();
      tabs[Math.min(tabs.length - 1, Math.max(0, i + (k === 'ArrowRight' ? 1 : -1)))]?.focus();
      return;
    }
    if (modus === 'seiten' && ['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(k)) {
      nimm();
      blaettere(seite + (k === 'ArrowRight' || k === 'PageDown' ? 1 : -1));
      return;
    }
    // Fokus auf «Schliessen», einem Pfeil der Seiten oder verloren (Klick auf den Hintergrund): zurück auf die Kacheln
    nimm();
    const t = spur.querySelector('.ueb-kachel[tabindex="0"]');
    if (!t || t.closest('[inert]')) return;
    if (k === 'Home' || k === 'End') {
      const r = +t.closest('.ueb-welt').dataset.reihe, z = e.ctrlKey ? (k === 'Home' ? 0 : reihen.length - 1) : r;
      fokussiere(z, k === 'Home' ? 0 : reihen[z].level.length - 1);
    } else t.focus();
  }
  /** Tab und Umschalt+Tab bleiben im Dialog */
  function falle(e) {
    const ziele = [...root.querySelectorAll('button')]
      .filter((b) => b.tabIndex >= 0 && !b.disabled && !b.closest('[inert]') && b.getClientRects().length);
    if (!ziele.length) return;
    const i = ziele.indexOf(document.activeElement);
    if (e.shiftKey ? i <= 0 : i < 0 || i === ziele.length - 1) {
      e.preventDefault();
      ziele[e.shiftKey ? ziele.length - 1 : 0].focus();
    }
  }

  /**
   * Wischen über die Kacheln (Finger oder Stift, nicht die Maus; Kopf, Stationen und Pfeile blättern nicht), wie in
   * der bisherigen Levelauswahl: Die Kacheln folgen dem Finger, die Nachbarwelt fährt daneben herein; beim Loslassen
   * blättert es weiter oder federt zurück. Ein zweiter Finger bricht ab; senkrechtes Ziehen übernimmt der Browser
   * (touch-action: pan-y) und meldet dann pointercancel.
   */
  function loslassen(e, abgebrochen) {
    const w = wisch;
    wisch = null;
    if (!w.waagrecht) return;
    gewischtUm = performance.now();
    const dx = (e.clientX - w.x) / SEITE, schritt = dx < 0 ? 1 : -1; // Pixel der Oberfläche
    if (!abgebrochen && Math.abs(dx) >= WISCH.min && reihen[seite + schritt]) blaettere(seite + schritt, { von: w.gezeigt });
    else if (w.gezeigt) zurueck(w.gezeigt);
  }
  root.addEventListener('pointerdown', (e) => {
    gewischtUm = -Infinity; // neues Drücken: sein Klick gilt wieder
    if (!e.isPrimary && wisch) loslassen(e, true);
  });
  fenster.addEventListener('pointerdown', (e) => {
    if (modus !== 'seiten' || e.pointerType === 'mouse' || !e.isPrimary || !e.target.closest('.ueb-kacheln')) return;
    beendeFahrt();
    wisch = { id: e.pointerId, x: e.clientX, y: e.clientY, griff: 0, waagrecht: false, gezeigt: 0 };
  });
  root.addEventListener('pointermove', (e) => {
    const w = wisch;
    if (w?.id !== e.pointerId) return;
    if (!w.waagrecht) {
      const dx = (e.clientX - w.x) / SEITE, dy = (e.clientY - w.y) / SEITE;
      if (Math.hypot(dx, dy) < WISCH.schwelle) return;
      if (Math.abs(dy) > Math.abs(dx) * WISCH.steigung) { wisch = null; return; } // senkrecht: kein Wischen
      w.waagrecht = true;
      w.griff = e.clientX; // ab hier folgen die Kacheln dem Finger, ohne Sprung
      return;
    }
    if (still()) return;
    const dx = (e.clientX - w.griff) / SEITE;
    w.gezeigt = reihen[seite + (dx < 0 ? 1 : -1)] ? dx : dx * WISCH.gummi; // am Anfang und Ende nur zögernd
    schiebe(w.gezeigt);
  });
  root.addEventListener('pointerup', (e) => { if (wisch?.id === e.pointerId) loslassen(e, false); });
  root.addEventListener('pointercancel', (e) => { if (wisch?.id === e.pointerId) loslassen(e, true); });
  // ein Klick gleich nach dem Wischen (ohne neues Drücken) wählt keine Kachel und schliesst nicht; ebenso einer mit
  // Maus oder Finger gleich nach dem Öffnen (der zweite eines Doppelklicks auf den Knopf, der sie geöffnet hat)
  addEventListener('click', (e) => {
    const jetzt = performance.now(), gleich = jetzt - gewischtUm < 400 || e.detail > 0 && jetzt - gezeigtUm < 400;
    if (gleich && root.contains(e.target)) { e.stopPropagation(); e.preventDefault(); }
  }, true);
  addEventListener('resize', () => { if (offen) { zeichneHimmel(); setzeModus(); zeigeSeitenkopf(); passeTitelAn(); } });

  /**
   * Zeigt die Übersicht mit diesen Daten (jedes Mal neu gezeichnet) und setzt den Fokus: wahl.fokus { welt, level },
   * sonst daten.aktuell, sonst die offene Kachel. Auf Seiten zeigt sie deren Welt.
   */
  function show(d, wahl = {}) {
    gezeigtUm = performance.now();
    daten = d;
    reihen = baueReihen(d);
    zeichne();
    offen = true;
    root.inert = false;
    root.classList.remove('ueb-zu');
    removeEventListener('keydown', taste, true);
    addEventListener('keydown', taste, true);
    const [r, l] = startZiel(wahl);
    seite = r;
    himmelBald();
    setzeModus();
    zeigeSeitenkopf();
    passeTitelAn();
    document.fonts?.ready?.then(() => { if (offen) passeTitelAn(); });
    const k = kacheln(r)[l];
    rolle(k);
    k?.focus();
    // die Welt erst nach dem Öffnen ansagen, wenn geblättert wird (sonst doppelt mit dem Fokus)
    requestAnimationFrame(() => { if (offen) seitentitel.setAttribute('aria-live', 'polite'); });
  }
  function hide() {
    if (!offen) return;
    offen = false;
    beendeFahrt();
    wisch = null;
    removeEventListener('keydown', taste, true);
    root.classList.add('ueb-zu');
    root.inert = true;
    seitentitel.removeAttribute('aria-live');
    clearTimeout(hinweisUhr);
    hinweis.classList.remove('ueb-da');
    hinweis.textContent = '';
  }
  /**
   * Einmal unsichtbar zeichnen (fast durchsichtig, nicht bedienbar, ohne Fokus), solange nichts anderes läuft: Beim
   * ersten Zeigen stand sonst ein Bild rund 100 ms, während der Browser alles zum ersten Mal zeichnete (danach nicht
   * mehr). Nur, solange sie zu ist; show() zeichnet danach ohnehin neu.
   */
  function vorwaermen(d) {
    if (offen) return;
    daten = d;
    reihen = baueReihen(d);
    zeichne();
    seite = 0;
    root.classList.add('ueb-vorwaermen');
    zeichneHimmel();
    setzeModus();
    zeigeSeitenkopf();
    passeTitelAn();
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('ueb-vorwaermen')));
  }

  return { show, hide, vorwaermen, get offen() { return offen; } };
}

/* =====================================================================
   NOAS GESCHICHTE — «Ein Lichtsignal an die Sterne», der Ablauf des Spiels (Spec .scratch/noa-geschichte/).
   Noa will aus einem Bergdorf dem Polarstern ein Zeichen schicken. Eine Taschenlampe reicht nicht so weit, doch Licht
   lässt sich weitergeben: Der Spieler reicht es Welt für Welt weiter (ein Kapitel = eine Welt mit ihrer Skybox und
   10 Leveln). Jede Welt weckt dabei einen Stern des Kleinen Wagens (wagen, Spec .scratch/kleiner-wagen/): Am
   Kapitelende steigen die Strahlen der Ziele zum Stern dieser Welt, er erwacht (erwache), und ein Träger nimmt das
   Licht am nächsten Stern vorbei mit in die nächste Welt (travel). Im Finale erwacht der sechste, das Licht läuft über
   die Deichsel zum Polarstern, und er antwortet: Sein Strahl fällt zurück, und im Dorf sieht Noa ihn blinken (Epilog
   auf der Bühne, createStoryScene).
   Nach dem Startbildschirm wählt der Spieler im Menü einen Grad (createMenu, Ticket 05); jeder Grad hat seinen eigenen
   Durchgang (STORY_LEVELS) und seinen eigenen Stand (progress, prisma.noa.*): Platz, gelöste Level, gesehene Momente.
   Prolog und Einstiege in die Welten kommen je Grad nur beim ersten Mal. Nach dem Prolog wählt der Spieler «Üben»
   (Kapitel «Im Dorf», das Tutorial, STORY_DORF) oder «Gleich los». Prolog, Kapitel «Im Dorf» und Einstiege lassen
   sich überspringen, die Reisen nicht (Entscheide 10, 28). Neuladen setzt dort fort, wo der Grad steht.
   Ins Menü geht es mit «Menü» im Spiel (der Stand bleibt) und am Ende des Epilogs; dahinter schaut die Kamera in den
   Himmel. Die Würfel-Level gehören nicht zu dieser Geschichte.
   ===================================================================== */

const STORY_UP = 0.42; // Blick in den Himmel: so hoch über den Horizont (rad), wenn das Kapitel nichts anderes sagt (up)
const STORY_ICONS = {
  dorf: '<path d="M4.5 19.5v-7.5l7.5-6 7.5 6v7.5z"/><path d="M10 19.5V15h4v4.5"/>',
  wald: '<path d="M12 3.5l-5 7h3l-4.5 6.5h13L14 10.5h3z"/><path d="M12 17v3.5"/>',
  meer: '<path d="M2.5 10c2.4-2.2 4.6-2.2 7 0s4.6 2.2 7 0c1.4-1.3 3.6-1.8 5-1"/><path d="M2.5 15.5c2.4-2.2 4.6-2.2 7 0s4.6 2.2 7 0c1.4-1.3 3.6-1.8 5-1"/>',
  wueste: '<path d="M2.5 19.5l7-11 7 11z"/><path d="M9.5 8.5l2.2 11"/><circle cx="18.2" cy="6" r="2.2"/>',
  vulkan: '<path d="M2.5 19.5l5.5-9h2.2l1.8 2 1.8-2h2.2l5.5 9z"/><path d="M11 7.5c-.6-1.6.6-2.6 0-4.2M14 7.5c.8-1.2 1.8-1.6 2.6-1.2"/>',
  planeten: '<circle cx="12" cy="12" r="4.2"/><ellipse cx="12" cy="12" rx="9.5" ry="3" transform="rotate(-20 12 12)"/>',
  sterne: '<path d="M12 3l1.9 7.1L21 12l-7.1 1.9L12 21l-1.9-7.1L3 12l7.1-1.9z"/>',
};
/** Stationen des Wegs: das Dorf, dann je Kapitel eine (Station k ist Stern k des Kleinen Wagens). */
const STORY_STATIONS = [['dorf', 'Dorf'], ['wald', 'Wald'], ['meer', 'Meer'], ['wueste', 'Wüste'], ['vulkan', 'Vulkan'],
  ['planeten', 'Planeten'], ['sterne', 'Sterne']];
/**
 * Leiste unter dem Untertitel der Ankunft (story.fillPath, Leiste C aus dem Skizzenkatalog von .scratch/kleiner-wagen/):
 * massstab: CSS-Pixel je Einheit von wagen.form (bei voller Breite, Desktop), rand: Platz um die Form [x, y] (px),
 * zeichen: Grösse der Zeichen der Welten (px). Auf dem Handy setzt das CSS sie kleiner.
 */
const STORY_LEISTE = { massstab: 2.1, rand: [22, 20], zeichen: 19 };
/**
 * Kapitel: Station auf dem Weg, Hintergrund, Meldung und Knopf nach dem letzten Level; die Level je Grad stehen in
 * STORY_LEVELS (dieselbe Reihenfolge der Welten). travel: Untertitel, wenn das Licht hier ankommt (nach dem Prolog,
 * auf der Reise, beim Fortsetzen); carrier: was das Licht von hier in die nächste Welt trägt (STORY_CARRIERS). up:
 * so hoch schaut man in dieser Welt in den Himmel, wenn das Licht ankommt (Einstieg, Ende des Flugs, Menü; ohne
 * Angabe STORY_UP); der Aufstieg am Ende der Welt schaut zu ihrem Stern. finale: danach antwortet der Stern, und der
 * Epilog folgt.
 */
const STORY_CHAPTERS = [
  { station: 1, title: 'Der Bergwald', sky: 'forest',
    travel: 'Die Glühwürmchen fliegen mit Noas Licht tief in den Bergwald. Irgendwo über den Tannen schläft der erste Stern.',
    carrier: 'glow', done: 'Der Wald leuchtet', next: 'Weiter zum Meer' },
  { station: 2, title: 'Das Meer', sky: 'beach',
    travel: 'Über dem Wald ist der erste Stern aufgewacht. Er zeigt zum Meer, und die Glühwürmchen fliegen mit dem Licht über die Hügel bis an den Strand.',
    carrier: 'spray', done: 'Das Meer leuchtet', next: 'Weiter in die Wüste' },
  { station: 3, title: 'Die Wüste', sky: 'desert',
    travel: 'Jetzt leuchtet auch der zweite Stern. Der Wind nimmt das Licht mit, weit übers Wasser bis dorthin, wo die Wüste anfängt.',
    carrier: 'sand', done: 'Die Wüste leuchtet', next: 'Weiter zum Vulkan' },
  { station: 4, title: 'Der Vulkan', sky: 'volcano',
    travel: 'Über den Dünen funkelt der dritte Stern. Ein Sandwirbel trägt das Licht weiter bis an einen Krater, in dem Feuer brennt.',
    carrier: 'embers', done: 'Der Vulkan glüht', next: 'Hinauf in den Himmel' },
  { station: 5, title: 'Die Planeten', sky: 'solar',
    travel: 'Mit dem vierten Stern ist die Schale des Wagens vollständig. Da bricht der Vulkan aus und schleudert das Licht hoch über die Wolken.',
    carrier: 'comet', done: 'Die Planeten leuchten', next: 'Weiter zu den Sternen' },
  { station: 6, title: 'Die Sterne', sky: 'milky', finale: true,
    travel: 'Fünf Sterne leuchten schon, nur einer schläft noch. Ein Komet nimmt das Licht mit, weit hinaus zu den Sternen.',
    done: 'Der Wagen ist wach', next: 'Hinaufschauen' },
];
const STORY_FINALE = ['Der letzte Stern wacht auf. Jetzt leuchtet der ganze Kleine Wagen.',
  'Das Licht wandert die Deichsel entlang bis zum Polarstern.', 'Der Polarstern hat Noas Zeichen gesehen.'];
/** Kennung einer Welt im Speicherstand (gesehen): die ihrer Station auf dem Weg (STORY_STATIONS), etwa meer. */
const storyChapterId = (ch) => STORY_STATIONS[ch.station][0];
/**
 * Der Kleine Wagen (Spec .scratch/kleiner-wagen/, «Der Wagen»): das Sternbild, an der Spitze seiner Deichsel der
 * Polarstern. Jede der sechs Welten weckt einen seiner Sterne, in der Reihenfolge von STORY_CHAPTERS (Stern 1 der
 * Bergwald … Stern 6 die Sterne, im Finale); der siebte ist der Polarstern, er wird nicht geweckt, er antwortet. Form,
 * Reihenfolge des Erwachens, Linien und der Stand im Durchgang stehen hier an einer Stelle; Ladezeichen, Himmel, Bühne,
 * Finale, Menü, Übersicht und Leiste nehmen sie von hier. (Der Parameter ?wagen=<faktor> gehört dem Ladezeichen.)
 */
const wagen = {
  /**
   * Form: je Stern in der Reihenfolge des Erwachens (Stern 1 … 7) sein Ort, in Einheiten des Ladezeichens (dort bei
   * Grösse 1 je 1,2 px): x nach rechts, y nach unten. Der Polarstern (7) steht oben links an der Spitze der Deichsel
   * (5, 6), die Schale (1–4) unten rechts; 1 aussen an der Schale, 2 unten aussen, 3 unten innen, 4 wo die Deichsel
   * ansetzt.
   */
  form: [[44, 4], [48, 30], [14, 26], [8, 2], [-14, -12], [-38, -24], [-64, -34]],
  /**
   * Linien [von, nach] (Nummern der Sterne) in der Reihenfolge, in der sie sich ziehen: Erwacht Stern k (k ≥ 2), zieht
   * sich eine von k − 1 zu ihm; mit Stern 4 dazu 4 → 1 (die Schale schliesst sich); 6 → 7 zieht der Puls im Finale.
   */
  linien: [[1, 2], [2, 3], [3, 4], [4, 1], [4, 5], [5, 6], [6, 7]],
  polarstern: 7,
  /**
   * Stand des Wagens in einem Durchgang, ohne eigenes Feld im Speicherstand (stand: Stand eines Grads wie progress.load,
   * welten: seine Level je Welt, STORY_LEVELS[grad]). Stern k ist wach, sobald das letzte Level der Welt k gelöst ist
   * (bis «Von vorn»); ein geschaffter Grad (Finale gesehen) hat den ganzen Wagen wach, mit dem Polarstern. Eine Linie
   * ist gezogen, wenn ihre beiden Sterne wach sind; das sind genau die Linien je erwachtem Stern. Zurück { wach:
   * Nummern der wachen Sterne, linien: die gezogenen in ihrer Reihenfolge, naechster: der erste schlafende Stern (der
   * Stern der Welt, die dran ist; nach der letzten Welt vor dem Finale der Polarstern), null, wenn alle wach sind }.
   */
  stand(stand, welten) {
    const wach = [];
    for (let k = 1; k <= this.form.length; k++) {
      const letztes = k < this.polarstern ? welten?.[k - 1]?.at(-1) : undefined;
      if (stand?.geschafft || letztes !== undefined && stand?.geloest?.includes(letztes)) wach.push(k);
    }
    return { wach, linien: this.linien.filter(([a, b]) => wach.includes(a) && wach.includes(b)).map((l) => [...l]),
      naechster: this.form.map((_, i) => i + 1).find((k) => !wach.includes(k)) ?? null };
  },
};
/**
 * Der Kleine Wagen am Himmel der Welten und des Dorfs (Spec .scratch/kleiner-wagen/, «Der Wagen», Entscheide 10, 11,
 * 20; Ticket 04): Lage, Grösse und Helligkeit an einer Stelle. Er steht an einer festen Stelle in der Welt, nicht an
 * der Skybox: hoehe und azimut sind die Richtung der Mitte seiner Form (wagen.form) von der Kamera aus, azimut 0
 * geradeaus wie in der Ausgangsansicht (−z), positiv nach rechts. So hoch, dass der Stern des Vulkans über der
 * früheren Kraterwand stand (sie reichte geradeaus bis gut 50°; seit PLAN 1.7 ist der Rand viel niedriger, die Lage
 * blieb, wie abgenommen); der ganze Wagen (112 × 64 Einheiten der Form) misst mit winkel
 * 0,15 etwa 17° × 10° und passt so auch im Hochformat (gut 21° breit) ins Bild. Helligkeit je Zustand [Nacht, Tag]
 * nach der Tabelle der Spec (linear, die Sterne weiss; alles bleibt unter der Bloom-Schwelle), Grösse der Sterne
 * (punkt) und Breite der Linien in CSS-Pixeln. Grösse und Helligkeit hat der Nutzer bei der Abnahme so bestätigt
 * (07.11.2026); Punkte und Linien misst auch der Wagen der Bühne so (BUEHNENWAGEN, glBuehne).
 */
const HIMMELSWAGEN = {
  hoehe: 60,                                  // Grad über dem Horizont
  azimut: 0,                                  // Grad, positiv nach rechts
  winkel: 0.15,                               // Grösse: Grad je Einheit der Form
  abstand: 70,                                // von der Kamera, wie die Hintergrundsterne
  wach: { hell: [0.85, 0.85], punkt: [6.5, 6.5] },  // geweckt: hell, auch bei Tag
  linie: { hell: [0.17, 0.26], breite: 1.1, luecke: 7 }, // gezogene Linie; luecke: so viele px Abstand zu den Sternen
  welt: { hell: [0.22, 0.7], punkt: [3.4, 2.6] },    // Stern dieser Welt, schläft noch: blass und atmend / feiner Funke
  schlaf: { hell: [0.14, 0], punkt: [3, 3] },        // übrige schlafende: blass wie Hintergrundsterne / unsichtbar
  polar: { hell: [0.5, 0.22], punkt: [4.6, 3.6] },   // Polarstern, bevor er antwortet: mittelhell / blass
  atmen: { tiefe: 0.22, periode: 5 },                // Stern dieser Welt bei Nacht: kaum merklich (Anteil, s)
  // Aufblitzen beim Erwachen und Aufzucken im Vorbeiflug (Ticket 05): bei glanz 1 so hell (unter der Bloom-Schwelle,
  // auch bei Tag sichtbar) und um diesen Anteil grösser; eine Linie, die sich zieht, so hell
  glanz: { hell: 0.95, groesser: 1.3, linie: 0.6 },
};
/**
 * Der Wagen am Himmel (HIMMELSWAGEN): ein eigenes, leichtes Objekt um die Kamera (wie die Sterne, ohne Parallaxe), ein
 * Netz aus sieben Sternen und sieben Linien in einem Zeichenaufruf. Sterne und Linien sind Rechtecke, die der
 * Vertex-Shader in Bildpixeln aufspannt (die Linien zwischen den projizierten Sternen); gemischt wird über dem Himmel
 * (Farbe vorgerechnet, Alpha des Ziels bleibt: Alpha 0 markiert den Himmel), nie heller als die Bloom-Schwelle: Der
 * Wagen franst nicht aus. Er blendet mit keiner Skybox: Tag oder Nacht liest er aus dem Himmel (Helligkeit der
 * Hintergrundsterne, stars.uFade, die beim Überblenden mitgleitet; keine = Tag). Landschaft vor ihm (Panorama, Brett,
 * Planeten) deckt ihn über die Tiefe zu.
 * zeige(stand, welt): was er zeigt (stand wie wagen.stand, null: alle schlafend; welt: Nummer des Sterns dieser Welt,
 * null über dem Dorf). update(t): je Bild (animate). richtung(k): Richtung von Stern k (1 … 7) in der Welt, von der
 * Kamera aus (Aufstieg und Finale, Tickets 05 und 06; Proben). stand: was er gerade zeigt { wach, linien, welt }.
 * Bewegtes beim Erwachen und Vorbeiflug (Ticket 05; story.erwache, story.zucke), geschrieben von den Tweens der
 * Geschichte: glanz (je Stern 0 … 6, je Linie 7 …: 0 … 1, Stern hell bis an die Bloom-Schwelle und grösser, Linie heller)
 * und anteil (je Linie wie wagen.linien: so weit ist sie vom ersten zum zweiten Stern gezogen, 0 … 1).
 */
const himmelsWagen = (() => {
  const H = HIMMELSWAGEN, form = wagen.form, n = form.length, nL = wagen.linien.length;
  // hinter Menü und Übersicht aus (blendet): sicht 0 … 1, in AUSBLENDEN s
  const AUSBLENDEN = 0.4, zielSicht = () => (menu.offen || uebersicht.offen ? 0 : 1);
  let sicht = 1;
  // Richtungen: Mitte der Form in (hoehe, azimut), die Sterne in der Tangentialebene darum (rechts, oben im Bild)
  const rad = THREE.MathUtils.degToRad, el = rad(H.hoehe), az = rad(H.azimut);
  const mitte = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  const rechts = new THREE.Vector3().crossVectors(mitte, new THREE.Vector3(0, 1, 0)).normalize();
  const oben = new THREE.Vector3().crossVectors(rechts, mitte).normalize();
  const xs = form.map((p) => p[0]), ys = form.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const je = Math.tan(rad(H.winkel));
  const dirs = form.map(([x, y]) => mitte.clone().addScaledVector(rechts, (x - cx) * je)
    .addScaledVector(oben, -(y - cy) * je).normalize());
  // Netz: je Stern und je Linie ein Rechteck (4 Ecken); a, b: Richtungen der beiden Enden (beim Stern dieselbe),
  // ecke: (quer, längs) −1 … 1 bzw. 0 … 1, art: 0 Stern, 1 Linie, nr: Platz in uHell/uGroesse
  const nQ = n + nL, a = new Float32Array(nQ * 12), b = new Float32Array(nQ * 12), ecke = new Float32Array(nQ * 8);
  const art = new Float32Array(nQ * 4), nr = new Float32Array(nQ * 4), index = [];
  const quad = (i, pa, pb, istLinie) => {
    const ecken = istLinie ? [[-1, 0], [1, 0], [1, 1], [-1, 1]] : [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    ecken.forEach((e, j) => {
      const v = i * 4 + j;
      pa.toArray(a, v * 3);
      pb.toArray(b, v * 3);
      ecke.set(e, v * 2);
      art[v] = istLinie ? 1 : 0;
      nr[v] = i;
    });
    index.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  };
  dirs.forEach((d, i) => quad(i, d, d, false));
  wagen.linien.forEach(([von, nach], i) => quad(n + i, dirs[von - 1], dirs[nach - 1], true));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(a, 3)); // für three.js; der Shader rechnet mit aA und aB
  geo.setAttribute('aA', new THREE.BufferAttribute(a, 3));
  geo.setAttribute('aB', new THREE.BufferAttribute(b, 3));
  geo.setAttribute('aEcke', new THREE.BufferAttribute(ecke, 2));
  geo.setAttribute('aArt', new THREE.BufferAttribute(art, 1));
  geo.setAttribute('aNr', new THREE.BufferAttribute(nr, 1));
  geo.setIndex(index);
  const uniforms = {
    uHell: { value: new Float32Array(nQ) },    // Helligkeit je Stern und Linie (update)
    uGroesse: { value: new Float32Array(nQ) }, // Durchmesser je Stern bzw. Breite je Linie (Bildpixel)
    uAnteil: { value: new Float32Array(nQ).fill(1) }, // so weit ist eine Linie gezogen (Erwachen); bei Sternen 1
    uLuecke: { value: 0 },                     // Abstand der Linien zu den Sternen (Bildpixel)
    uRes: { value: new THREE.Vector2(1, 1) },  // Grösse des Bilds (Bildpixel)
    uAbstand: { value: H.abstand },
    uMax: { value: 0.95 * LOOK.bloomThreshold }, // nie heller: kein Bloom
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      attribute vec3 aA, aB;
      attribute vec2 aEcke;
      attribute float aArt, aNr;
      uniform float uHell[${nQ}], uGroesse[${nQ}], uAnteil[${nQ}], uLuecke, uAbstand;
      uniform vec2 uRes;
      varying vec2 vEcke;
      varying float vHell, vArt;
      void main() {
        int i = int(aNr + 0.5);
        vHell = uHell[i];
        vEcke = aEcke;
        vArt = aArt;
        vec4 pa = projectionMatrix * modelViewMatrix * vec4(aA * uAbstand, 1.0);
        vec4 pb = projectionMatrix * modelViewMatrix * vec4(aB * uAbstand, 1.0);
        pb = mix(pa, pb, uAnteil[i]); // eine Linie, die sich gerade zieht, reicht erst so weit
        // hinter der Kamera oder ausgeschaltet: nichts (ausserhalb des Bilds)
        if (pa.w <= 0.01 || pb.w <= 0.01 || vHell <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        vec2 px = 2.0 / uRes; // ein Bildpixel in NDC
        if (aArt < 0.5) { // Stern: Quadrat um den projizierten Punkt, anderthalbmal so gross wie der Kern (Schein)
          gl_Position = pa;
          gl_Position.xy += aEcke * 0.75 * uGroesse[i] * px * pa.w;
          return;
        }
        vec2 sa = pa.xy / pa.w, sb = pb.xy / pb.w, d = (sb - sa) / px;
        float len = length(d);
        if (len < 2.0 * uLuecke + 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        d /= len;
        vec4 p = mix(pa, pb, aEcke.y);
        vec2 off = vec2(-d.y, d.x) * aEcke.x * (0.5 * uGroesse[i] + 1.0) + d * uLuecke * (1.0 - 2.0 * aEcke.y);
        p.xy += off * px * p.w;
        gl_Position = p;
      }`,
    fragmentShader: `
      uniform float uMax;
      varying vec2 vEcke;
      varying float vHell, vArt;
      void main() {
        float a;
        if (vArt < 0.5) {
          float r = length(vEcke) * 1.5; // 1: Rand des Kerns
          a = smoothstep(1.0, 0.45, r) + 0.22 * pow(max(0.0, 1.0 - r / 1.5), 2.0);
        } else a = smoothstep(1.0, 0.35, abs(vEcke.x));
        float h = min(vHell * a, uMax);
        gl_FragColor = vec4(vec3(h), h);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide, // die Rechtecke der Linien drehen je nach Richtung im Bild
    // vorgerechnete Farbe über dem Himmel, Alpha des Ziels unverändert (Alpha 0 markiert den Himmel)
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    fog: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -97; // nach den Sternen und der Korona der Sonne
  mesh.layers.set(LAYER_NO_REFLECT);
  mesh.raycast = () => {};
  scene.add(mesh);

  const mische = (paar, nacht) => paar[1] + (paar[0] - paar[1]) * nacht; // [Nacht, Tag]
  const stand = { wach: [], linien: [], welt: null };
  const glanz = new Float32Array(nQ), anteil = new Float32Array(nL).fill(1); // Erwachen, Vorbeiflug (Ticket 05)
  return {
    mesh,
    stand,
    glanz,
    anteil,
    zeige(s, welt) {
      const wach = s?.wach ?? [], linien = s?.linien ?? [];
      if (JSON.stringify([wach, linien, welt]) === JSON.stringify([stand.wach, stand.linien, stand.welt])) return;
      Object.assign(stand, { wach: [...wach], linien: linien.map((l) => [...l]), welt });
      sceneLoop.wake(); // ruht die Schleife (mit ?t=): den neuen Stand zeichnen
    },
    richtung(k, ziel = new THREE.Vector3()) { return ziel.copy(dirs[k - 1]); },
    /**
     * Offen sind Menü oder Übersicht: Ihre Sternkarte zeigt den Wagen schon; der am Himmel dahinter blendet aus (sicht
     * 0, in AUSBLENDEN s), sonst stünde er doppelt da (Abnahme Ticket 11: nach dem Epilog der ganze Wagen zweimal).
     */
    get blendet() { return sicht !== zielSicht(); },
    /** Ohne Ausblenden gleich so, wie es Menü und Übersicht verlangen (hinter der Bühne: Das sieht niemand). */
    sofort() { sicht = zielSicht(); },
    update(t, dt = 0) {
      mesh.position.copy(camera.position);
      const ziel = zielSicht(), schritt = Math.min(dt, 0.1) / AUSBLENDEN;
      sicht = sicht < ziel ? Math.min(ziel, sicht + schritt) : Math.max(ziel, sicht - schritt);
      mesh.visible = sicht > 0;
      const pr = renderer.getPixelRatio();
      renderer.getDrawingBufferSize(uniforms.uRes.value);
      // Nacht: Der Himmel zeigt Hintergrundsterne (Welten bei Nacht 0,3, Sonnensystem und Milchstrasse 1), Tag: keine
      const nacht = THREE.MathUtils.clamp(stars.material.uniforms.uFade.value / 0.3, 0, 1);
      const atmen = 1 + H.atmen.tiefe * nacht * Math.sin(2 * Math.PI * t / H.atmen.periode);
      const h = uniforms.uHell.value, g = uniforms.uGroesse.value;
      for (let k = 1; k <= n; k++) {
        const z = stand.wach.includes(k) ? H.wach : k === wagen.polarstern ? H.polar
          : k === stand.welt ? H.welt : H.schlaf;
        const basis = mische(z.hell, nacht) * (z === H.welt ? atmen : 1), x = glanz[k - 1];
        h[k - 1] = basis + (H.glanz.hell - basis) * x;
        g[k - 1] = mische(z.punkt, nacht) * pr * (1 + H.glanz.groesser * x);
      }
      wagen.linien.forEach(([von, nach], i) => {
        const basis = stand.linien.some(([x, y]) => x === von && y === nach) ? mische(H.linie.hell, nacht) : 0;
        h[n + i] = basis && basis + (H.glanz.linie - basis) * glanz[n + i];
        g[n + i] = H.linie.breite * pr;
        uniforms.uAnteil.value[n + i] = anteil[i];
      });
      uniforms.uLuecke.value = H.linie.luecke * pr;
      if (sicht < 1) for (let i = 0; i < h.length; i++) h[i] *= sicht * sicht * (3 - 2 * sicht);
    },
  };
})();
/**
 * Das Kapitel «Im Dorf» (Entscheide 3, 10, 18; Ticket 07): das Tutorial zwischen Prolog und Bergwald, keine der sechs
 * Welten. Seine Übungen sind LEVELS[0 … TUTORIAL_COUNT − 1] mit Name und Schritten der Führung; sie zählen nicht zu
 * den 60 des Grads.
 * angebot: nach dem Prolog auf der Bühne (auch nach «Überspringen»), beim ersten Durchgang je Grad; einstieg: der
 * Untertitel, wenn das Licht ins Dorf kommt (ohne Träger: Es ist schon bei Noa); ende: nach der letzten Übung oder
 * «Überspringen», danach tragen die Glühwürmchen das Licht in den Bergwald. done/next: «Gelöst» nach der letzten Übung.
 * sky: der Hintergrund, die Skybox «Noas Dorf bei Nacht» (village; fehlt sie, nimmt setSky die Milchstrasse).
 */
const STORY_DORF = { station: 0, title: 'Im Dorf', sky: 'village',
  angebot: { kicker: 'Im Dorf', ueben: 'Üben', los: 'Gleich los',
    text: 'Die Glühwürmchen wollen gleich los in den Wald. Möchtest du vorher mit Noa im Dorf üben?' },
  einstieg: { kicker: 'Im Dorf · Erstes Licht', traeger: null, moment: 'dorf', path: 0,
    text: 'Hinter dem Haus übt Noa mit der Taschenlampe. Mit einem alten Spiegel und einem Stück buntem Glas lässt sich das Licht überallhin schicken.' },
  ende: 'Jetzt hat Noa den Dreh raus. Am Waldrand warten schon die Glühwürmchen.',
  done: 'Das Dorf leuchtet', next: 'In den Bergwald' };
/** So lange (ms) bleibt «Überspringen» nach dem Ende eines Einstiegs weg, bevor es im Dorf das Kapitel meint. */
const STORY_SKIP_RUHE = 2000;
/**
 * Stand des Dorfs im Speicherstand (prisma.noa.<grad>.dorf, nur nach «Üben»): { ende: null (das Kapitel läuft) |
 * 'gespielt' | 'uebersprungen' }; Unlesbares gilt als nicht gespielt (null). Seit Ticket 02 von .scratch/tutorial-neu/
 * merkt sich das Dorf keinen Platz mehr (Spec «Kein Stand im Dorf»): Wer es startet, beginnt bei Übung 1. Ein altes
 * Feld platz (bis 8, aus der Zeit der 9 Übungen) zählt nicht und fällt beim nächsten Speichern weg; ein beendetes Dorf
 * bleibt darum beendet, wie gross sein platz auch war.
 */
const storyDorfStand = (d) => (d && typeof d === 'object' && !Array.isArray(d)
  && [null, 'gespielt', 'uebersprungen'].includes(d.ende ?? null) ? { ende: d.ende ?? null } : null);
/**
 * Träger zwischen zwei Welten (story.makeCarrier): Punkte um den Lichtpunkt und hinter ihm her. motion: swarm
 * (umkreisen ihn), helix (Wirbel, nach hinten weiter), trail (Spur auf seinem Weg, wave: auf und ab wie Wellen),
 * embers (Glut, fällt zurück), comet (Schweif, nach hinten breiter). delay: so weit (s) reicht die Spur zurück;
 * radius, spin (rad/s), size: Bereiche je Punkt; color: Grundfarbe (heller als 1 blüht).
 */
const STORY_CARRIERS = {
  glow: { motion: 'swarm', count: 56, delay: 0.8, radius: [1.8, 5.5], spin: [1.4, 2.8], color: [0.8, 1, 0.32], size: [2.6, 4.2] },
  spray: { motion: 'trail', count: 96, delay: 1.6, radius: [0.3, 2.2], wave: 1.4, color: [0.55, 0.82, 1], size: [1.2, 2.4] },
  sand: { motion: 'helix', count: 96, delay: 1.2, radius: [1.6, 4.4], spin: [5, 8], color: [1, 0.76, 0.36], size: [1.1, 2.1] },
  embers: { motion: 'embers', count: 96, delay: 1.4, radius: [0.5, 2.8], color: [1, 0.36, 0.08], size: [1.3, 2.6] },
  comet: { motion: 'comet', count: 96, delay: 2.4, radius: [0.3, 1.8], color: [0.72, 0.88, 1], size: [1.2, 3.0] },
};
/**
 * Erwachen und Flug (Spec .scratch/kleiner-wagen/, Ablauf 3 und 5; Ticket 05): Am Ende einer Welt steigen die Strahlen
 * zu ihrem Stern (himmelsWagen.richtung), er erwacht (story.erwache: blitzt auf, die Linie(n) ziehen sich, sein
 * Glockenton), dann fliegt der Träger in einem Bogen (story.bogen) am nächsten, noch schlafenden Stern vorbei, der kurz
 * aufzuckt (story.zucke), und hinab, so hoch, wie man in der neuen Welt hinaufschaut. Ein Einstieg in eine Welt kommt
 * von der Seite am Stern dieser Welt vorbei. Gleich lang wie der frühere seitliche Bogen.
 * Solange der Untertitel der Ankunft steht (Kicker und Text in der Mitte, Ticket 08), liegt der Lichtpunkt in der
 * Mitte des freien Raums darüber (story.lichtHoch, gemessen); licht: so weit über der Mitte des Bilds (Anteil der
 * halben Bildhöhe; story.look), wo nichts zu messen ist. vorbei: so weit (Grad) zieht das Licht neben dem Stern
 * vorbei, nach aussen vom Wagen. reise: Flug der Reise (s), am Stern beim Anteil amStern des Wegs, das Ende seitwaerts
 * (rad) vom Stern. einstieg: Flug des Einstiegs (s), Start von (rad) seitlich und hoeher (rad) als der Stern, an ihm beim
 * Anteil amStern. Erwachen: blitz (s) des Sterns, linie (s) je Linie, die sich zieht, dann klingt ihr Glanz in nach (s)
 * aus; zucken (s) des nächsten Sterns im Vorbeiflug; schweben: Kreis (Grad) des Lichts um den geweckten Stern, solange
 * die nächste Welt lädt.
 * Abnahme Ticket 11: Am Ende von Einstieg und Reise hält das Licht über dem Untertitel an und wartet auf Tippen, ohne
 * Zeitablauf (story.anhalten); ein Tippen in den ersten halt s danach galt noch dem Flug und zählt nicht. Dann fällt
 * es gleichmässig aufs Brett (storyFall: nach einem Anlauf über den Anteil anlauf der Zeit gleich schnell, ohne
 * Abbremsen). Abnahme Ticket 12: gleichmässig im Bild (story.fall); fall: dauer (s), kamera: Anlauf und Abbremsen
 * der Kamera (Anteile der Zeit, storyRampe), dazwischen dreht sie gleich schnell.
 */
const STORY_FLUG = {
  licht: 0.3,
  halt: 0.3, anlauf: 0.1,
  fall: { dauer: 2.8, kamera: [0.15, 0.35] },
  vorbei: 1.0,
  reise: { dauer: 6, amStern: 0.32, seitwaerts: 0.45 },
  einstieg: { dauer: 3.4, amStern: 0.45, von: 0.55, hoeher: 0.06 },
  blitz: 1.6, linie: 0.7, nach: 0.8,
  zucken: 1.1,
  schweben: 1.2,
};
/**
 * Finale (Spec .scratch/kleiner-wagen/, Ablauf 6; Ticket 06): Die Strahlen steigen zum sechsten Stern, er erwacht
 * (ascend, erwache), und sie laufen in auslaufen (s) in ihn aus (story.auslaufen, Abnahme Ticket 12). Die Kamera
 * kommt dabei schon dort an, wo der ganze Wagen über dem Untertitel steht (story.wagenBlick; rand: so viel freier
 * Platz um ihn, Anteil der kürzeren Bildseite; Abnahme Ticket 11), zu Satz 1 gleitet sie in blick (s) nur noch nach,
 * falls der Untertitel anders steht. Ab ab (s) läuft ein Puls Stern für Stern durch ihn (story.puls): schritt (s) von
 * Stern zu Stern, jeder leuchtet bis glanz auf und mit seinem Ton, die Linie dazwischen leuchtet, während der Puls
 * darauf läuft; nach (s) nach dem sechsten Stern ist er verklungen. Zu Satz 2 springt er ab ab (s) über die Deichsel
 * (story.deichsel): Die Linie 6 → 7 zieht sich in zug (s), dann flammt der Polarstern auf, sein Schlusston klingt, in
 * flamme (s) ist er still. Erst dann wartet der Satz auf Tippen. Danach antwortet der Polarstern: Sein Strahl fällt aus
 * dem Bild, das steht (story.antwortBlick, ohne Blick zu ihm); am Ende steht der ganze Wagen im Bild, genau dort, wo
 * ihn gleich die Bühne zeigt (story.wagenEnde, Wagen in Wagen; Ticket 07; seit Ticket 11 rechts der Mitte, die Kamera
 * dafür seitlich gedreht). Der Aufprall auf dem Brett weich (Abnahme Ticket 12, antwort): Kommt die Spitze ins letzte
 * Stück vorglut (Anteil des Wegs), glüht das Brett unter ihr auf (bis glut), daraus läuft die Lichtwelle (story.shock),
 * die in anstieg (s) erst ganz hell wird, ebenso der Schein (story.pulse); der Strahl läuft nach ab (s) in aus (s) ins
 * Brett aus. abstand: so weit vor der Kamera steht der Lichtpunkt auf einem Stern (wie im Aufstieg).
 */
const STORY_PULS = {
  blick: 1.2, rand: 0.07, abstand: 72, auslaufen: 1.6,
  antwort: { vorglut: 0.3, glut: 0.45, anstieg: 0.35, ab: 0.15, aus: 2.0 },
  puls: { ab: 0.9, schritt: 0.26, glanz: 0.8, nach: 0.6 },
  deichsel: { ab: 0.35, zug: 0.7, flamme: 0.7 },
};
/**
 * Der Kleine Wagen auf der Bühne von Prolog und Epilog (Spec .scratch/kleiner-wagen/, Entscheide 8, 15, Ablauf 1
 * und 7; Ticket 07): Er steht im Himmel der Bühne um ihren Polarstern, in der Form von wagen.form. Wo und wie gross,
 * folgt aus dem Ende des Finales (story.wagenEnde): Im ersten Bild des Epilogs steht er genau dort, wo der Wagen am
 * Himmel der Welt zuletzt stand (Wagen in Wagen), in jedem Format; der Prolog zeigt ihn an derselben Stelle. feld:
 * Platz, den er auf der Bühne hat (scene.wagenFeld), in jedem Bild des Epilogs und in Prolog 4: rand (Anteil der
 * kürzeren Bildseite) vom Rand des Bilds und über den Graten der Berge; darin höchstens hoehe dieses Platzes hoch
 * und breite so breit (sonst schaut das Finale am Ende weiter, mit grösserem Sichtfeld der Kamera), waagrecht bei
 * lage (0 am linken, 1 am rechten Rand des Platzes; Abnahme Ticket 11: weiter rechts, damit Noa nicht so steil
 * hinauf leuchtet; Noas Arm und Strahl zeigen zum Polarstern, erhoben).
 * Prolog: die sechs Sterne blass wie die schwächsten Hintergrundsterne (schlaf: Helligkeit, Durchmesser in
 * CSS-Pixeln), ohne Funkeln, ohne Linien; in Prolog 4 zeichnen sich die Linien einmal ab (andeutung: ab s nach dem
 * Beginn der Einstellung, in auf s bis hell, in aus s wieder weg). Epilog: alle sieben wach wie am Himmel der Welten
 * (HIMMELSWAGEN.wach, die Linien wie HIMMELSWAGEN.linie bei Nacht); sie glimmen nach: ab halten s nach dem Beginn in
 * abklingen s auf glimmen, dann atmen sie (tiefe, periode s). Grösse und Helligkeit hat der Nutzer bei der
 * Abnahme so bestätigt (07.11.2026).
 */
const BUEHNENWAGEN = {
  feld: { rand: 0.04, hoehe: 0.8, breite: 0.6, lage: 0.8 },
  schlaf: { hell: 0.34, punkt: 1.6 },
  andeutung: { hell: 0.11, ab: 1.4, auf: 1.3, aus: 2.1 },
  nachglimmen: { halten: 2.6, abklingen: 4, glimmen: 0.11, tiefe: 0.3, periode: 5 },
};
/**
 * Prolog und Epilog: Einstellungen der Kamera über dem Dorf (Bühne siehe createStoryScene), je mit einem Satz.
 * cam: Bildmitte x, y und Zoom in der Ebene von Noa, im Hochformat camP (dort passt nur ein schmaler Streifen ins
 * Bild); from: Start der ersten Fahrt; move: Dauer der Fahrt (s); act: was dabei geschieht (siehe scene.act);
 * winkelWie: Noa leuchtet hier im selben Winkel zum Polarstern wie in dieser Einstellung des Prologs, die Kamera fährt
 * dafür waagrecht (x von cam bzw. camP gilt nur ohne Wagen; scene.winkelKamera, Abnahme Ticket 13).
 */
const STORY_PROLOG = [
  { from: { x: 820, y: 160, z: 1.08 }, fromP: { x: 760, y: 120, z: 1.08 }, cam: { x: 800, y: 470, z: 1 },
    camP: { x: 760, y: 470, z: 1 }, move: 6,
    text: 'Hoch in den Bergen liegt ein kleines Dorf. Aus den Kaminen steigt Rauch, und über den Dächern funkeln die Sterne.' },
  { cam: { x: 520, y: 590, z: 2 }, move: 4.5,
    text: 'Jeden Abend klettert Noa auf den Hügel hinter den Häusern und sucht den Polarstern. Er sitzt ganz vorn an der Deichsel des Kleinen Wagens.' },
  { cam: { x: 560, y: 560, z: 2.2 }, move: 2.6, act: 'lamp',
    text: 'Heute hat Noa die Taschenlampe mitgenommen. Klick. Der Polarstern soll ein Zeichen bekommen.' },
  { cam: { x: 900, y: 300, z: 1.35 }, camP: { x: 760, y: 330, z: 1.3 }, move: 5, act: 'reach',
    text: 'Aber das Licht kommt nicht weit. Die Sterne des Wagens schlafen, und ohne sie verliert es sich im Dunkeln.' },
  { cam: { x: 760, y: 600, z: 1.55 }, camP: { x: 560, y: 600, z: 1.55 }, move: 4, act: 'gather',
    text: 'Da blinkt etwas am Waldrand. Ein Schwarm Glühwürmchen fliegt heran und fängt das Licht ein.' },
  { cam: { x: 1250, y: 560, z: 1.7 }, camP: { x: 1300, y: 590, z: 1.6 }, move: 5.5, act: 'carry',
    text: 'Jeder Stern im Wagen gehört zu einem Ort und wacht erst auf, wenn dort Licht ankommt. Hilf den Glühwürmchen, das Licht von Ort zu Ort zu bringen, bis es beim Polarstern ankommt.' },
];
const STORY_EPILOG = [
  { from: { x: 900, y: 120, z: 1.12 }, fromP: { x: 980, y: 160, z: 1.08 }, cam: { x: 760, y: 420, z: 1.25 },
    camP: { x: 520, y: 470, z: 1.3 }, move: 6.5,
    text: 'In dieser Nacht bleibt Noa noch lange auf dem Hügel sitzen und schaut hinauf.' },
  { cam: { x: 790, y: 400, z: 1.2 }, camP: { x: 1000, y: 300, z: 1.1 }, move: 2.5, act: 'blink',
    text: 'Da blinkt der Polarstern. Einmal, zweimal, dreimal.' },
  { cam: { x: 720, y: 560, z: 1.4 }, camP: { x: 500, y: 560, z: 1.6 }, winkelWie: 'reach', move: 3, act: 'answer',
    text: 'Noa lacht und blinkt mit der Taschenlampe zurück. Über dem Dorf leuchten jetzt alle sieben Sterne.' },
];

/**
 * Bühne für Prolog und Epilog: ein Bergdorf bei Nacht über den ganzen Bildschirm, gezeichnet in sechs Ebenen (Himmel,
 * ferne Berge, Bergwald, Dorf, Noas Hügel, Vordergrund). Eine Kamera fährt darüber; nahe Ebenen ziehen schneller
 * vorbei als ferne (Parallaxe, p). Die Szene lebt: Sterne funkeln, Rauch steigt aus den Kaminen, Glühwürmchen
 * schwirren am Waldrand. Masse in der Ebene von Noa (p = 1): bei Zoom 1 ein Bild von 1600 × 900. Ohne SVG-Filter
 * (Unschärfe kostete bei jeder Kamerabewegung viel), Leuchten über radiale Verläufe.
 *
 * Gezeichnet wird so selten wie möglich (Ticket 04 von .scratch/leistung/): Jede Ebene ist eine eigene Ebene des
 * Compositors (.ebene, ein SVG darin in Massen der Szene), die Kamera schiebt und skaliert sie per Web Animations
 * (fahrt), ohne sie neu zu rastern. Gerastert wird eine Ebene einmal je Folge (Prolog oder Epilog), in der grössten
 * Skalierung der Folge (das macht Chrome für laufende Transform-Animationen so; eine Animation je Ebene für die ganze
 * Folge, folgeAnlegen): Sie bleibt beim Zoom scharf, und keine sichtbare Ebene rastert neu (sonst zeigte sie dabei
 * fehlende Kacheln, Flackern, Ticket 16). Was sich klein bewegt (Glühwürmchen, Rauch, Schal, Atmen des
 * Polarsterns, Flackern des Strahls), läuft als Animation von transform und opacity auf eigenen kleinen Ebenen, nach
 * der Zeit der Bühne (time; mit speed schneller); Arm, Strahl und Blinken als vorab berechnete Spuren (spur); funkelnde
 * Sterne in wenigen Gruppen, flackernde Fenster einzeln per CSS. Während einer Fahrt ändert JavaScript nichts am DOM:
 * Jeder Commit liess Chrome die bewegten Ebenen neu rastern. Die Linien (linie) bekommen ihre Breite je Ruhepunkt in
 * einer verborgenen Kopie. Beim Warten auf Tippen läuft keine Schleife, ausgeblendet ruht alles.
 * Am Himmel steht der Kleine Wagen um den Polarstern (BUEHNENWAGEN, Ticket 07 von .scratch/kleiner-wagen/); wo, sagt
 * wagenLage(): die Orte seiner sieben Sterne im ersten Bild des Epilogs (Anteile von oben links; story.wagenEnde).
 */
function createStoryScene(host, { wagenLage = null } = {}) {
  const rand = mulberry32(11);
  const r = (a, b) => a + (b - a) * rand();
  const n = (v) => +v.toFixed(1);
  const smooth01 = (v) => { const k = Math.min(1, Math.max(0, v)); return k * k * (3 - 2 * k); };
  const line = (pts) => 'M' + pts.map(([x, y]) => `${n(x)} ${n(y)}`).join('L');
  const area = (pts) => `${line(pts)}L${pts.at(-1)[0]} 2600L${pts[0][0]} 2600Z`; // weit hinab: im Hochformat sieht man mehr
  const yAt = (pts, x) => {
    const i = pts.findIndex(([px]) => px > x);
    if (i <= 0) return (i < 0 ? pts.at(-1) : pts[0])[1];
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    return ay + (by - ay) * (x - ax) / (bx - ax);
  };
  /** Grat aus Stützpunkten, viermal verfeinert: Jede neue Mitte liegt etwas versetzt, so wird die Kante zackig. */
  const ridge = (ctrl, rough) => {
    let pts = ctrl;
    for (let pass = 0; pass < 4; pass++) {
      const next = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
        next.push(pts[i], [(ax + bx) / 2, (ay + by) / 2 + (rand() - 0.5) * (bx - ax) * rough]);
      }
      pts = [...next, pts.at(-1)];
    }
    return pts;
  };
  /** Sanfte Kuppen: zwischen den Stützpunkten weich (waagrecht an jedem Stützpunkt). */
  const soft = (ctrl) => ctrl.slice(1).flatMap(([bx, by], i) => {
    const [ax, ay] = ctrl[i];
    return Array.from({ length: 12 }, (_, k) => { const t = k / 12; return [ax + (bx - ax) * t, ay + (by - ay) * t * t * (3 - 2 * t)]; });
  }).concat([ctrl.at(-1)]);
  /** Schneekappen über der Schneegrenze: von der Kante ein Stück hinab, je höher der Gipfel, desto tiefer. */
  const snow = (pts, limit) => {
    let d = '', run = [];
    const flush = () => {
      if (run.length > 2) d += line([...run, ...run.slice().reverse().map(([x, y]) => [x + r(-2, 2), y + (limit - y) * r(0.25, 0.45)])]) + 'Z';
      run = [];
    };
    for (const p of pts) { if (p[1] < limit) run.push(p); else flush(); }
    flush();
    return d;
  };
  /** Tanne als eine Fläche: drei Stufen und ein kurzer Stamm. */
  const FIR = [[0.3, 0.64], [0.14, 0.62], [0.4, 0.36], [0.2, 0.34], [0.5, 0.05], [0.07, 0.05], [0.07, 0]];
  const fir = (x, y, h) => {
    const w = h * r(0.34, 0.44), lean = r(-0.03, 0.03) * h;
    const side = (s) => FIR.map(([dx, dy]) => `L${n(x + s * dx * w)} ${n(y - dy * h)}`);
    return `M${n(x + lean)} ${n(y - h)}${side(-1).join('')}${side(1).reverse().join('')}Z`;
  };
  /**
   * Grosse Flächen aus vielen Teilen (Tannenreihen, Gras) in Stücken von STUECK Massen, je ein eigener Pfad ('|' trennt,
   * pfade): Skia rastert jede Kachel nur mit den Pfaden, die sie berührt. Ein Pfad mit Hunderten Tannen kostete jede
   * Kachel der Ebene ganz (Raster-Hänger bis 80 ms im GPU-Prozess, Ticket 16).
   */
  const STUECK = 150;
  const pfade = (d, attr) => d.split('|').filter(Boolean).map((s) => `<path d="${s}" ${attr}/>`).join('');
  const firRow = (x0, x1, [s0, s1], [h0, h1], base) => {
    let d = '';
    let stueck = null;
    for (let x = x0; x < x1; x += r(s0, s1)) {
      const s = Math.floor(x / STUECK);
      if (stueck !== null && s !== stueck) d += '|';
      stueck = s;
      d += fir(x, base(x), r(h0, h1));
    }
    return d + '|';
  };
  /**
   * Strichbreite wie früher mit vector-effect non-scaling-stroke: in Pixeln, gleich bei jedem Zoom. --rs ist die
   * Skalierung der Ebene im Ruhepunkt (die WebGL-Bühne rastert jede Linie je Ruhepunkt, linieTex), während einer Fahrt
   * wächst und schrumpft der Strich mit, im Ruhepunkt stimmt er wieder. Ausnahme die fernen Ebenen (.fest): --rs aus
   * Zoom 1, der Strich wird beim Zoomen etwas breiter.
   */
  const strich = (w) => `stroke-width:calc(${w}px / var(--rs, 1))`;
  const rim = (pts, color, opacity, width = 1.2) =>
    `<path d="${line(pts)}" fill="none" stroke="${color}" stroke-opacity="${opacity}" style="${strich(width)}"/>`;
  /** Ein Teil der Szene als eigenes SVG in Massen der Szene: Ausschnitt x, y, b, h (viewBox), dort auch platziert. */
  const svg = (x, y, b, h, inhalt, cls = '', stil = '') =>
    `<svg class="${cls}" width="${b}" height="${h}" viewBox="${x} ${y} ${b} ${h}" style="left:${x}px;top:${y}px;${stil}">${inhalt}</svg>`;
  const BILD = (inhalt, cls = '', stil = '') => svg(0, 0, 1600, 900, inhalt, `bild ${cls}`, stil); // eine ganze Ebene (ragt über 1600 × 900 hinaus)
  /**
   * Linien mit strich (Grate, Dachkanten, Umriss von Noa) als eigenes SVG (.linie): Die WebGL-Bühne rastert sie je
   * Ruhepunkt mit ihrer Breite dort (linieTex). f(inhalt, cls): SVG. Jede Linie kostet Speicher der Grafik (Textur
   * längs der ganzen Linie): die Grate der fernen Berge und des Bergwalds, die im Prolog höchstens um 1,26 und 1,5
   * zoomen, liegen darum im Bild ihrer Ebene, mit fester Breite (.fest). Die Grate von Dorfhügel und Noas Hügel liegen
   * unter dem Bild, doppelt so breit (die Fläche deckt die untere Hälfte).
   */
  const linie = (f, inhalt) => f(inhalt, 'linie');

  // Himmel: Verlauf, Milchstrasse, Sterne (einige funkeln), der Polarstern. Die funkelnden Sterne liegen in acht
  // Gruppen (je vier Takte, matte und helle getrennt), jede eine eigene kleine Ebene mit einer CSS-Animation, statt
  // dutzender Animationen je Stern; ihr Takt richtet sich nach der Dauer, die der Stern früher hatte
  const TW_TAKT = [[2.8, -0.4], [3.6, -2.9], [4.3, -1.6], [5.1, -4.4]]; // Dauer, Verzögerung (s)
  const twinkle = TW_TAKT.flatMap(() => ['', '']);
  let stars = '', band = '';
  for (let i = 0; i < 300; i++) {
    const y = r(-950, 620);
    if (y > 420 && rand() < 0.6) continue; // zum Horizont hin dünner
    const big = rand() < 0.07, twinkles = rand() < 0.25;
    const cx = r(-700, 2300), radius = big ? r(1.3, 2.1) : r(0.4, 1.1), opacity = r(0.3, 0.95);
    const circle = `<circle cx="${n(cx)}" cy="${n(y)}" r="${radius.toFixed(2)}" opacity="${opacity.toFixed(2)}"/>`;
    if (!twinkles) { stars += circle; continue; }
    r(0, 6); // früher die Verzögerung je Stern: gezogen bleibt sie, sonst verschöbe sich alles Weitere der Szene
    const takt = Math.min(3, Math.floor((r(2.4, 5.5) - 2.4) / 3.1 * 4));
    twinkle[takt * 2 + (opacity < 0.62 ? 0 : 1)] += circle;
  }
  for (let i = 0; i < 180; i++) {
    const x = r(-300, 2000), spread = (rand() + rand() + rand() - 1.5) * 110;
    band += `<circle cx="${n(x)}" cy="${n(150 + spread)}" r="${r(0.35, 0.8).toFixed(2)}" opacity="${r(0.25, 0.7).toFixed(2)}"/>`;
  }
  // Milchstrasse aus vielen weichen Flecken entlang eines Bands, verschieden breit und hell
  let milky = '';
  for (let i = 0; i < 14; i++) {
    const x = -300 + i * 170 + r(-60, 60);
    milky += `<ellipse cx="${n(x)}" cy="${n(150 + r(-40, 40))}" rx="${n(r(160, 320))}" ry="${n(r(55, 130))}" fill="url(#s-mw)" opacity="${r(0.25, 0.6).toFixed(2)}"/>`;
  }

  // Ferne Berge mit Schnee, dahinter Dunst
  const far = ridge([[-800, 560], [-520, 430], [-300, 490], [-80, 360], [150, 470], [380, 335], [560, 440], [770, 300], [940, 415],
    [1120, 345], [1300, 455], [1510, 320], [1720, 440], [1930, 370], [2400, 520]], 0.32);
  // Bergwald: niedrigere Kämme, dicht mit Tannen
  const mid = ridge([[-800, 650], [-450, 565], [-160, 605], [100, 528], [330, 592], [520, 548], [720, 606], [910, 566], [1110, 618],
    [1310, 548], [1560, 604], [1810, 538], [2400, 630]], 0.22);
  // Dorfhügel
  const hill = soft([[-800, 732], [-200, 706], [250, 712], [520, 690], [700, 660], [900, 641], [1100, 646], [1300, 668],
    [1600, 700], [2000, 712], [2400, 730]]);
  // Noas Hügel links, der Waldrand rechts
  const ground = soft([[-800, 772], [-350, 746], [50, 712], [300, 668], [430, 657], [560, 672], [760, 742], [980, 768],
    [1180, 752], [1450, 742], [1750, 750], [2400, 775]]);

  // Häuser: Mitte x, Breite, Höhe, Dachhöhe, Fenster [dx, dy über dem Boden], Kamin
  const HOUSES = [[700, 44, 28, 18, [[-9, 11], [8, 11]], 1], [756, 34, 24, 16, [[0, 9]], 0],
    [818, 54, 34, 22, [[-15, 12], [0, 12], [15, 12]], 1], [884, 40, 28, 18, [[-7, 10]], 1], [940, 30, 22, 15, [[0, 8]], 0],
    [1072, 48, 32, 21, [[-11, 12], [10, 12]], 1], [1128, 38, 26, 17, [[0, 10]], 0], [1174, 32, 22, 15, [], 1]];
  const chimneys = [];
  let houses = '', eaves = '', glows = '', flicker = '';
  const windowAt = (x, y) => {
    if (rand() < 0.15) { houses += `<rect x="${n(x - 2.5)}" y="${n(y - 3)}" width="5" height="6" fill="#16162e"/>`; return; }
    const glow = `<circle cx="${n(x)}" cy="${n(y)}" r="17" fill="url(#s-win)"/>`;
    // flackernde Fenster: je ein eigenes kleines SVG mit der CSS-Animation (es sind nur wenige)
    if (rand() < 0.3) flicker += svg(n(x) - 17, n(y) - 17, 34, 34, glow, 'flk', `animation-delay:${(-r(0, 3)).toFixed(1)}s`);
    else glows += glow;
    houses += `<rect x="${n(x - 2.5)}" y="${n(y - 3)}" width="5" height="6" fill="#ffd28a"/>`;
  };
  for (const [x, w, h, roof, wins, chimney] of HOUSES) {
    const base = yAt(hill, x) + 6, top = base - h, eave = `M${x - w / 2 - 4} ${n(top + 1)}L${x} ${n(top - roof)}L${x + w / 2 + 4} ${n(top + 1)}`;
    if (chimney) {
      const cx = x + w * 0.22, cy = top - roof * 0.62;
      houses += `<rect x="${n(cx - 3)}" y="${n(cy - 9)}" width="6" height="14" fill="#0a0a1c"/>`;
      chimneys.push([cx, cy - 10]);
    }
    houses += `<rect x="${x - w / 2}" y="${n(top)}" width="${w}" height="${h + 12}" fill="#0a0a1d"/><path d="${eave}Z" fill="#0d0d26"/>`;
    eaves += `<path d="${eave}" fill="none" stroke="#3c4080" stroke-opacity="0.55" style="${strich(1)}"/>`;
    for (const [dx, dy] of wins) windowAt(x + dx, base - dy - 4);
  }
  { // Kirche: Turm mit Spitze und Kreuz, ein kleines Schiff daneben
    const base = yAt(hill, 1004) + 6, top = base - 76;
    houses += `<rect x="1015" y="${n(base - 30)}" width="26" height="42" fill="#0a0a1d"/><path d="M1013 ${n(base - 29)}L1028 ${n(base - 44)}L1043 ${n(base - 29)}Z" fill="#0d0d26"/>` +
      `<rect x="993" y="${n(top)}" width="22" height="88" fill="#0a0a1d"/><path d="M990 ${n(top + 1)}L1004 ${n(top - 40)}L1018 ${n(top + 1)}Z" fill="#0d0d26"/>` +
      `<path d="M1004 ${n(top - 40)}v-11M999.5 ${n(top - 46)}h9" stroke="#0d0d26" stroke-width="2"/>`;
    eaves += `<path d="M990 ${n(top + 1)}L1004 ${n(top - 40)}L1018 ${n(top + 1)}" fill="none" stroke="#3c4080" stroke-opacity="0.55" style="${strich(1)}"/>`;
    glows += `<circle cx="1004" cy="${n(top + 20)}" r="15" fill="url(#s-win)"/>`;
    houses += `<circle cx="1004" cy="${n(top + 20)}" r="3.6" fill="#ffd28a"/>`;
  }
  // Weg vom Dorf hinunter, mit Laternen
  const path = [690, 640, 590, 540, 480, 420].map((x) => [x, yAt(hill, x) + 5]);
  let lanterns = '';
  for (const [x, y] of path.slice(1, -1)) lanterns += `<circle cx="${n(x)}" cy="${n(y - 9)}" r="11" fill="url(#s-win)" opacity="0.7"/><circle cx="${n(x)}" cy="${n(y - 9)}" r="1.8" fill="#ffe2a8"/><rect x="${n(x - 0.7)}" y="${n(y - 7)}" width="1.4" height="7" fill="#0a0a1d"/>`;
  // Zaun an Noas Hügel
  const posts = [470, 494, 518, 542].map((x) => [x, yAt(ground, x)]);
  const fence = posts.map(([x, y]) => `<rect x="${x - 1.5}" y="${n(y - 18)}" width="3" height="20"/>`).join('') +
    `<path d="${line(posts.map(([x, y]) => [x, y - 13]))}${line(posts.map(([x, y]) => [x, y - 6]))}" fill="none" stroke="#05050f" stroke-width="2"/>`;
  // Vordergrund: Grasbüschel
  let grass = '';
  for (let x = -900, s = null; x < 2500; x += r(12, 28)) {
    if (s !== null && Math.floor(x / STUECK) !== s) grass += '|';
    s = Math.floor(x / STUECK);
    const y = 884 + r(-6, 6);
    grass += `M${n(x - 6)} ${n(y)}L${n(x - 3)} ${n(y - r(8, 18))}L${n(x)} ${n(y)}L${n(x + 2)} ${n(y - r(10, 24))}L${n(x + 5)} ${n(y)}Z`;
  }

  // ein Teil, der sich bewegt: Drehpunkt an (x, y), der Inhalt darum herum (Ausschnitt dx, dy, b, h um den Drehpunkt)
  const teil = (cls, x, y, [dx, dy, b, h], inhalt, innen = '@') =>
    `<div class="teil ${cls}" style="left:${x}px;top:${y}px">${innen.replace('@', svg(dx, dy, b, h, inhalt))}</div>`;
  /*
   * Strahl der Taschenlampe, im Arm (dreht mit ihm, Ursprung an der Spitze der Lampe), gezeichnet von der WebGL-Bühne
   * (strahlMesh): Kegel und Kern, je ein Trapez mit Hals w0 an der Lampe und Breite k · Länge am Ende, darauf ein
   * Verlauf über Länge / 0,55 (stopps: Alpha, Prozent). Die Länge ist ein Anteil von STRAHL_L (laenge).
   */
  const STRAHL_L = 860, STRAHL_MIN = 0.02; // kürzer (Anteil von STRAHL_L) zeichnet er nicht (Kraft 0 oder kaum sichtbar)
  const STRAHL_WEICH = 0.8; // Breite des weichen Rands des Kegels (teil im Shader; der Kern 0,5)
  const STRAHL_TEILE = [
    { w0: 3, k: 0.04, farbe: '#fff1cc', stopps: [[0.42, 0], [0.2, 15], [0.07, 35], [0, 55]] },
    { w0: 1.4, k: 0.011, farbe: '#fffaf0', stopps: [[0.95, 0], [0.4, 12], [0.06, 32], [0, 50]] },
  ];
  const twinkleSvgs = twinkle.map((s, i) => BILD(`<g fill="#fff">${s}</g>`, `tw${i % 2 ? ' hell' : ''}`,
    `animation-duration:${TW_TAKT[i >> 1][0]}s;animation-delay:${TW_TAKT[i >> 1][1] - (i % 2) * 1.3}s`)).join('');
  host.insertAdjacentHTML('beforeend', `<div class="scene">
    <div class="world" aria-hidden="true">
      <div class="ebene" data-p="0.06">
        ${BILD(`<defs>
          <linearGradient id="s-sky" gradientUnits="userSpaceOnUse" x1="0" y1="-700" x2="0" y2="640"><stop offset="0" stop-color="#03040f"/><stop offset="0.45" stop-color="#080a24"/><stop offset="0.8" stop-color="#15163a"/><stop offset="1" stop-color="#28274f"/></linearGradient>
          <radialGradient id="s-mw"><stop offset="0" stop-color="#c9cfff" stop-opacity="0.16"/><stop offset="1" stop-color="#c9cfff" stop-opacity="0"/></radialGradient>
          <radialGradient id="s-ray" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="30"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.4" stop-color="#e8ecff" stop-opacity="0.35"/><stop offset="1" stop-color="#e8ecff" stop-opacity="0"/></radialGradient>
          <radialGradient id="s-halo"><stop offset="0" stop-color="#fff" stop-opacity="0.85"/><stop offset="0.08" stop-color="#eef0ff" stop-opacity="0.5"/><stop offset="0.25" stop-color="#cdd5ff" stop-opacity="0.16"/><stop offset="1" stop-color="#cdd5ff" stop-opacity="0"/></radialGradient>
          <linearGradient id="s-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3070" stop-opacity="0"/><stop offset="0.5" stop-color="#2c3070" stop-opacity="0.5"/><stop offset="1" stop-color="#2c3070" stop-opacity="0"/></linearGradient>
          <radialGradient id="s-win"><stop offset="0" stop-color="#ffb35a" stop-opacity="0.55"/><stop offset="0.4" stop-color="#ff9c3a" stop-opacity="0.16"/><stop offset="1" stop-color="#ff9c3a" stop-opacity="0"/></radialGradient>
          <radialGradient id="s-gw"><stop offset="0" stop-color="#e4ff8a" stop-opacity="0.9"/><stop offset="0.3" stop-color="#c2ff4a" stop-opacity="0.3"/><stop offset="1" stop-color="#c2ff4a" stop-opacity="0"/></radialGradient>
          <radialGradient id="s-smoke"><stop offset="0" stop-color="#5c6190" stop-opacity="0.55"/><stop offset="0.6" stop-color="#5c6190" stop-opacity="0.2"/><stop offset="1" stop-color="#5c6190" stop-opacity="0"/></radialGradient>
        </defs>
        <rect x="-3000" y="-3000" width="7600" height="4400" fill="url(#s-sky)"/>
        <g transform="rotate(-16 900 150)">${milky}<g fill="#dfe3ff">${band}</g></g>
        <g fill="#fff">${stars}</g>`)}
        ${twinkleSvgs}
        ${teil('polar', 1120, 150, [-64, -64, 128, 128], `<circle r="64" fill="url(#s-halo)"/><g transform="rotate(12)" fill="url(#s-ray)"><path d="M0 -30L1.8 0L0 30L-1.8 0ZM-30 0L0 -1.8L30 0L0 1.8Z"/><path d="M0 -13L1 0L0 13L-1 0ZM-13 0L0 -1L13 0L0 1Z" transform="rotate(45)" opacity="0.6"/></g><circle r="3.4" fill="#fff"/>`)}
      </div>
      <div class="ebene" data-p="0.22">
        ${BILD(`<path d="${area(far)}" fill="#1f1f4a"/><path d="${snow(far, 425)}" fill="#8b92d6" opacity="0.2"/>${rim(far, '#8a90d8', 0.35)}
        <rect x="-3000" y="470" width="7600" height="170" fill="url(#s-mist)"/>`, 'fest')}
      </div>
      <div class="ebene" data-p="0.42">
        ${BILD(`<path d="${area(mid)}" fill="#15153a"/>${rim(mid, '#4f539e', 0.35)}${pfade(`${firRow(-800, 2400, [6, 12], [10, 26], (x) => yAt(mid, x) + r(2, 7))}`, 'fill="#101030"')}
        <rect x="-3000" y="612" width="7600" height="120" fill="url(#s-mist)" opacity="0.8"/>`, 'fest')}
      </div>
      <div class="ebene" data-p="0.68">
        ${linie(BILD, rim(hill, '#2c3066', 0.5, 2.4))}${BILD(`<path d="${area(hill)}" fill="#0d0d25"/><path d="${line(path)}" fill="none" stroke="#1b1b3b" stroke-width="3" stroke-linecap="round"/>
        ${pfade(`${firRow(360, 650, [7, 15], [22, 52], (x) => yAt(hill, x) + 4)}${firRow(1215, 1580, [7, 14], [24, 58], (x) => yAt(hill, x) + 4)}${firRow(-700, 300, [10, 22], [26, 60], (x) => yAt(hill, x) + 4)}${firRow(1600, 2300, [10, 22], [26, 60], (x) => yAt(hill, x) + 4)}`, 'fill="#0a0a1f"')}
        <g>${glows}</g>`)}${flicker}${svg(450, 480, 780, 240, houses + lanterns)}${linie((inhalt, cls) => svg(450, 480, 780, 240, inhalt, cls), eaves)}
        <div class="teil smoke"></div>
      </div>
      <div class="ebene" data-p="1">
        ${linie(BILD, rim(ground, '#2a2e62', 0.55, 3))}${BILD(`${pfade(`${firRow(1110, 2200, [22, 40], [170, 330], (x) => yAt(ground, x) + r(0, 8))}${firRow(-700, 230, [26, 48], [120, 260], (x) => yAt(ground, x) + r(0, 8))}`, 'fill="#0a0a20"')}
        <path d="${area(ground)}" fill="#08081b"/>
        ${pfade(`${firRow(1150, 2200, [30, 60], [120, 240], (x) => yAt(ground, x) + 12)}${firRow(-700, 160, [40, 70], [110, 210], (x) => yAt(ground, x) + 12)}`, 'fill="#050515"')}
        <g fill="#05050f">${fence}</g>
        <g fill="#03030a">
          <path d="M422.5 628L422 650Q421.5 653 418.8 655.4Q417.6 657.6 420.4 657.6L429 657.6L429.3 628Z"/>
          <path d="M431.2 628L431.5 657.6L440.6 657.6Q443.2 657.4 441.6 655.2Q439 653 438.8 650L438.2 628Z"/>
          <path d="M419.5 592Q430 585.5 440.5 592L443.6 610L447.6 634.5Q430 639 412.4 634.5L416.4 610Z"/>
          <circle cx="430" cy="576.5" r="9.4"/>
          <path d="M419.8 575Q419.2 559.5 430 558.4Q440.8 559.5 440.2 575Z"/><rect x="418.6" y="571.2" width="22.8" height="5.2" rx="2.6"/>
          <circle cx="430" cy="555.2" r="4.3"/>
        </g>`)}
        ${teil('scarf', 437, 590, [-18, -4, 38, 18], '<path fill="#03030a" d="M-15.8 -3Q-7 1.5 1.8 -3L3.2 1.6Q-7 6 -17.2 1.6ZM-1.5 0L18 7Q12 12 4 5.6Z"/>')}
        ${linie((inhalt, cls) => svg(436, 567, 13, 69, inhalt, cls), `<path d="M437.2 568.5A9.4 9.4 0 0 1 438.6 581M440.8 592.6L443.9 610L447.6 634" fill="none" stroke="#4a4f98" stroke-opacity="0.75" stroke-linecap="round" style="${strich(1.1)}"/>`)}
        ${teil('arm', 440, 592, [-3, -5, 39, 10], '<g fill="#03030a"><rect x="-2" y="-3" width="24" height="6" rx="3"/><circle cx="21.5" cy="0" r="3.8"/></g><rect x="22" y="-4.2" width="11.5" height="8.4" rx="2" fill="#22223c"/><rect x="32.4" y="-4.8" width="2.4" height="9.6" rx="1" fill="#3a3a60"/>')}
        <div class="teil worms"></div>
      </div>
      <div class="ebene" data-p="1.35">
        ${BILD(`<path d="${fir(-140, 905, 780)}${fir(60, 910, 520)}${fir(2060, 905, 720)}${fir(2200, 912, 460)}" fill="#020208"/>
        ${pfade(`${grass}`, 'fill="#030309"')}<rect x="-3000" y="884" width="7600" height="1800" fill="#030309"/>`)}
      </div>
    </div>
    <div class="sub"><div class="kicker"></div><div class="lines"><p class="line"></p><p class="line"></p></div><div class="hint"><span></span></div><div class="actions"></div></div>
    <button class="skip" type="button">Überspringen</button>
  </div>`);

  const el = host.lastElementChild, q = (s) => el.querySelector(s);
  /*
   * Je Ebene: p (Parallaxe), inhalt (das Element .ebene, darin ihre SVG und Teile in der Reihenfolge des Bilds): nur
   * die Quelle der WebGL-Bühne (glBuehne), selbst nie gezeichnet (CSS).
   */
  const layers = [...el.querySelectorAll('.ebene')].map((e) => ({ p: +e.dataset.p, inhalt: e }));
  const lines = [...el.querySelectorAll('.line')];

  /* ---- Bewegung: Werte nach der Zeit der Bühne, je Bild gezeichnet von glBuehne ---- */
  let scene = null;
  /** die Kurve SINUS (cubic-bezier(0.37, 0, 0.63, 1), wie (1 − cos πu) / 2) wie im Browser: zu p in [0, 1] der Wert */
  const sinusKurve = (p) => {
    const bx = (s) => 3 * (1 - s) ** 2 * s * 0.37 + 3 * (1 - s) * s * s * 0.63 + s ** 3;
    let lo = 0, hi = 1;
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (bx(m) < p) lo = m; else hi = m; }
    const s = (lo + hi) / 2;
    return 3 * (1 - s) * s * s + s ** 3; // y: 0, 0, 1, 1
  };
  /**
   * Schwingung mitte + amp · sin(ω t + φ) in der Zeit der Bühne t, hin und her zwischen mitte − amp und mitte + amp mit
   * der Kurve SINUS (so lief sie bis Ticket 19 als Animation des Browsers): wert(t).
   */
  const schwinger = (amp, omega, phi, mitte = 0) => {
    if (omega < 0) { omega = -omega; phi = Math.PI - phi; } // sin(−ω t + φ) = sin(ω t − φ + π)
    const halb = Math.PI / omega, c = (t) => t + (phi + Math.PI / 2) / omega; // Wert(c) = mitte − amp · cos(ω c)
    return { wert: (t) => { const x = c(t) / halb, n = Math.floor(x), p = x - n;
      return mitte - amp + 2 * amp * sinusKurve(n % 2 === 0 ? p : 1 - p); } };
  };
  /**
   * Ein Wert der Bühne, der sich in Stücken ändert (wie die Tweens; Arm, Kraft und Länge des Strahls, Blinken des Sterns):
   * Stücke { t0, t1, f(t, u) } in der Zeit der Bühne (t wie beim Anlegen, auch wenn die Zeit seither gesprungen ist;
   * u: so lange läuft das Stück schon), ein späteres gilt ab seinem Beginn und hält danach seinen letzten Wert.
   * Gezeichnet wird wert(t) in jedem Bild (glBuehne).
   */
  const spur = (basis) => {
    const s = { basis, stuecke: [] };
    s.wert = (t) => {
      let v = s.basis;
      // f in der Zeit, in der das Stück angelegt wurde (verschoben: so weit ist die Zeit seither gesprungen)
      for (const st of s.stuecke) {
        if (t >= st.t0) v = st.f(Math.min(t, st.t1) - st.verschoben, Math.min(t, st.t1) - st.t0);
      }
      return v;
    };
    /** Die Zeit der Bühne springt um d (time = …): Die Stücke rücken mit, zu sehen bleibt dasselbe. */
    s.verschiebe = (d) => { for (const st of s.stuecke) { st.t0 += d; st.t1 += d; st.verschoben += d; } };
    /** ein Stück dazu: ab t0 für dauer Sekunden der Wert f(t) */
    s.dazu = (t0, dauer, f) => { s.stuecke.push({ t0, t1: t0 + dauer, f, verschoben: 0 }); };
    /** von vorn: steht auf basis */
    s.zurueck = (b) => { s.basis = b; s.stuecke = []; };
    return s;
  };
  // Schal im Wind, der Polarstern atmet, der Strahl flackert
  const schal = schwinger(4, 2.3, 0), atem = schwinger(0.05, 1.7, 0, 1), flackern = schwinger(0.07, 23, 0, 0.93);
  // Arm (Grad), Kraft und Länge des Strahls (Anteil von STRAHL_L), Blinken des Polarsterns, Helligkeit der Linien des
  // Wagens (Andeutung in Prolog 4, Nachglimmen im Epilog; scene.wagenBei) als Spuren (spur)
  const armSpur = spur(75), kraft = spur(0), laenge = spur(0), stern = spur(0), wagenLinien = spur(0);
  const spuren = [armSpur, kraft, laenge, stern, wagenLinien];
  // Glühwürmchen: schwirren am Waldrand (hx, hy), fliegen zur Lampe und umkreisen sie (ox, oy, spin), tragen das Licht
  // in den Wald (dx, dy); wo sie sind, rechnet wurmOrt, ihr Blinken glBuehne
  const worms = Array.from({ length: 16 }, () => ({ hx: r(1070, 1250), hy: r(565, 705), dx: r(1390, 1570), dy: r(560, 665),
    a: r(0.5, 1.3), b: r(0.6, 1.5), ph: r(0, 6.3), fl: r(2, 5), spin: r(1.6, 2.6) * (rand() < 0.5 ? -1 : 1), ox: r(18, 44),
    oy: r(12, 30), delay: r(0, 1.6) }));
  /* ---- Bühne in WebGL (Ticket 19, ADR 0007) ---- */
  /**
   * Die Bühne, gezeichnet in WebGL (bis Ticket 19 vom Compositor, als Ebenen): Die Logik (Folge, Fahrten, Spuren,
   * Schwinger, Orte der Glühwürmchen) liefert die Werte, die Ebenen (.ebene) nur die Quelle. Jedes Bild zeichnet die eigene
   * Schleife aus der Zeit: Kamera aus der Folge (folgeZeit, auf der Uhr der Folge, folgeUhr), Arm, Kraft,
   * Länge und Stern aus den Spuren, Schal, Atmen und Flackern aus den Schwingern, die Glühwürmchen aus wurmOrt (genau,
   * ohne Animationen). Was steht, ist je Ebene und Abschnitt der Folge (abschnitteFuer, wie die Ebenen des Compositors)
   * ein Bild aus demselben SVG, nur so gross wie das, was man darin sieht, in der grössten Skalierung des Abschnitts
   * (darüber hinaus eine Grundstufe und scharfe Stufen je Ruhepunkt, stufen), in Kacheln je eine Textur, ganz
   * durchsichtige fallen weg; gerastert wird im Ruhepunkt davor, ein paar Kacheln je Bild. Linien (linie) bekommen wie
   * oben ihre Breite je Ruhepunkt. Eine eigene Leinwand im .world (dessen Ein- und Ausblenden bleibt), ein eigener
   * WebGL-Kontext ohne Tiefe und Kantenglättung, in Gerätepixeln (mit dem Massstab der Seite, SEITE); der des Spiels
   * zeichnet mit höchstens 2 Pixeln je CSS-Pixel der Oberfläche (QUALITY), auf dem Poco unschärfer als die Bühne bisher.
   * Gemessen (Ticket 19): Fahrten des Prologs ohne Lücke über 25 ms, Texturen höchstens etwa 116 MB bei 2400 × 1080.
   */
  const glBuehne = () => {
    const leinwand = document.createElement('canvas');
    leinwand.className = 'gl-buehne';
    q('.world').prepend(leinwand);
    const r3 = new THREE.WebGLRenderer({ canvas: leinwand, antialias: false, alpha: false, depth: false, stencil: false,
      premultipliedAlpha: true, powerPreference: 'high-performance' });
    r3.setPixelRatio(1);
    r3.setClearColor(0x020208, 1);
    r3.sortObjects = false;
    const MAX_TEX = Math.min(8192, r3.capabilities.maxTextureSize);
    const KACHEL = 512; // px je Kachel (eine Textur; ganz durchsichtige fallen weg, rastern)
    const kamera = new THREE.OrthographicCamera(0, 1, 0, 1, -1, 1);
    const welt = new THREE.Scene();
    const quad = new THREE.BufferGeometry();
    quad.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], 3));
    quad.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    quad.setIndex([0, 1, 2, 0, 2, 3]);
    // vormultipliertes Alpha wie im Compositor: Texturen vormultipliert hochgeladen, gemischt mit 1, 1 − α
    const mischen = { transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };
    // uvRect: der Teil der Textur ohne ihren Rand (1 Pixel der Nachbarn, gegen Nähte beim Filtern, rastern)
    const VS = 'uniform vec4 uvRect; varying vec2 vUv; void main() { vUv = uvRect.xy + uv * uvRect.zw; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
    const bildMaterial = () => new THREE.ShaderMaterial({ ...mischen,
      uniforms: { map: { value: null }, opacity: { value: 1 }, uvRect: { value: new THREE.Vector4(0, 0, 1, 1) } },
      vertexShader: VS,
      fragmentShader: 'uniform sampler2D map; uniform float opacity; varying vec2 vUv; void main() { gl_FragColor = texture2D(map, vUv) * opacity; }' });
    /** Mesh über dem Einheitsquadrat stellen: box [x, y, b, h] in Massen des Teils, m (a, b, c, d, e, f) vom Teil in
     *  die Ebene, pose { s, ox, oy } von der Ebene in Pixel der Leinwand */
    const setze = (mesh, { s, ox, oy }, [bx, by, bw, bh], [a, b, c, d, e, f] = [1, 0, 0, 1, 0, 0]) => {
      mesh.matrix.set(s * a * bw, s * c * bh, 0, s * (a * bx + c * by + e) + ox,
        s * b * bw, s * d * bh, 0, s * (b * bx + d * by + f) + oy, 0, 0, 1, 0, 0, 0, 0, 1);
      mesh.matrixWorldNeedsUpdate = true;
    };
    const dreh = (grad, x = 0, y = 0, sk = 1) => {
      const r = grad * Math.PI / 180, co = Math.cos(r) * sk, si = Math.sin(r) * sk;
      return [co, si, -si, co, x, y];
    };
    const mal = ([a1, b1, c1, d1, e1, f1], [a2, b2, c2, d2, e2, f2]) => // erst m2, dann m1
      [a1 * a2 + c1 * b2, b1 * a2 + d1 * b2, a1 * c2 + c1 * d2, b1 * c2 + d1 * d2, a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1];

    /* -- SVG aus den Ebenen: was steht, als Markup in Massen der Szene (verschachtelte svg mit x, y statt left, top) -- */
    const defs = new XMLSerializer().serializeToString(q('defs'));
    const markup = (svgEl) => {
      const k = svgEl.cloneNode(true);
      k.setAttribute('x', parseFloat(svgEl.style.left) || 0);
      k.setAttribute('y', parseFloat(svgEl.style.top) || 0);
      k.removeAttribute('style');
      k.removeAttribute('class');
      k.setAttribute('overflow', 'visible');
      return new XMLSerializer().serializeToString(k);
    };
    const boxVon = (svgEl) => svgEl.getAttribute('viewBox').split(' ').map(Number);
    // Namensraum aus dem DOM: index.html nennt keine Adresse (Offline, tests/logic.test.mjs)
    const svgDoc = (inhalt, [x, y, w, h], pw, ph, rs) => `<svg xmlns="${q('svg').namespaceURI}" `
      + `width="${pw}" height="${ph}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="none" style="--rs:${rs}">${defs}${inhalt}</svg>`;
    /** Grenzen einer Linie: die Punkte ihres Pfads (nur M und L), sonst die Box ihres SVG; dazu Rand für den Strich */
    const linienBox = (svgEl) => {
      const d = [...svgEl.querySelectorAll('path')].map((p) => p.getAttribute('d')).join(' ');
      if (/[AQCSHVaqcshv]/.test(d)) { const [x, y, b, h] = boxVon(svgEl); return [x - 4, y - 4, x + b + 4, y + h + 4]; }
      const z = d.match(/-?\d*\.?\d+/g).map(Number);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let i = 0; i + 1 < z.length; i += 2) { x0 = Math.min(x0, z[i]); x1 = Math.max(x1, z[i]); y0 = Math.min(y0, z[i + 1]); y1 = Math.max(y1, z[i + 1]); }
      return [x0 - 6, y0 - 6, x1 + 6, y1 + 6];
    };

    /* -- Teile je Ebene in der Reihenfolge des DOM: stehend (gruppe), linie, sterne, flk, polar, rauch, schal, arm, wuermer -- */
    const teile = layers.map(({ inhalt, p }, ebene) => {
      const liste = [];
      let gruppe = null;
      for (const kind of inhalt.children) {
        const cl = kind.classList;
        if (kind.tagName.toLowerCase() === 'svg' && !cl.contains('linie') && !cl.contains('tw') && !cl.contains('flk')) {
          if (!gruppe) liste.push(gruppe = { art: 'gruppe', ebene, p, teile: [], box: [Infinity, Infinity, -Infinity, -Infinity],
            rs: cl.contains('fest') ? 'fest' : 1 });
          gruppe.teile.push(markup(kind));
          if (cl.contains('fest')) gruppe.rs = 'fest';
          // ein ganzes Bild (BILD) ragt über seine Box hinaus (Himmel, Flächen bis 2600 hinab): ohne Grenze
          const [x, y, b, h] = boxVon(kind), ganz = cl.contains('bild');
          const g = gruppe.box;
          gruppe.box = ganz ? [-Infinity, -Infinity, Infinity, Infinity]
            : [Math.min(g[0], x), Math.min(g[1], y), Math.max(g[2], x + b), Math.max(g[3], y + h)];
          continue;
        }
        gruppe = null;
        if (cl.contains('linie')) { if (!cl.contains('aus')) liste.push({ art: 'linie', ebene, p, inhalt: markup(kind), box: linienBox(kind) }); }
        else if (cl.contains('tw')) {
          const st = kind.style, dauer = parseFloat(st.animationDuration), verz = parseFloat(st.animationDelay);
          let sterne = liste.find((x) => x.art === 'sterne');
          if (!sterne) liste.push(sterne = { art: 'sterne', ebene, p, punkte: [] });
          for (const c of kind.querySelectorAll('circle')) {
            sterne.punkte.push([+c.getAttribute('cx'), +c.getAttribute('cy'), +c.getAttribute('r'), +(c.getAttribute('opacity') ?? 1),
              dauer, verz, cl.contains('hell') ? 0.15 : 0.26]);
          }
        } else if (cl.contains('flk')) {
          liste.push({ art: 'flk', ebene, p, inhalt: markup(kind), box: boxVon(kind),
            verz: parseFloat(kind.style.animationDelay) || 0 });
        } else if (cl.contains('polar')) liste.push({ art: 'polar', ebene, p, ...teilVon(kind, kind.querySelector('svg')) });
        else if (cl.contains('smoke')) liste.push({ art: 'rauch', ebene, p });
        else if (cl.contains('scarf')) liste.push({ art: 'schal', ebene, p, ...teilVon(kind, kind.querySelector('svg')) });
        else if (cl.contains('arm')) liste.push({ art: 'arm', ebene, p, ...teilVon(kind, kind.querySelector(':scope > svg')) });
        else if (cl.contains('worms')) liste.push({ art: 'wuermer', ebene, p });
      }
      return liste;
    });
    /** Teil (div.teil) um seinen Ort (left, top) und sein SVG (Box um den Ort) */
    function teilVon(div, svgEl) {
      return { ort: [parseFloat(div.style.left) || 0, parseFloat(div.style.top) || 0], box: boxVon(svgEl),
        inhalt: markup(svgEl) };
    }

    /* -- Rastern: SVG → Kacheln (je eine Textur), eine je Bild gezeichnet und hochgeladen, abbrechbar -- */
    let plan = 0; // Nummer des Plans (neue Folge, anderer Bildschirm): ältere Arbeit bricht ab
    const nachBild = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
    const RASTER_MS = 4; // so viel Arbeit des Hauptthreads je Bild beim Rastern im Ruhepunkt
    let wartet = false; // eine Fahrt wartet auf ihre Texturen (bereit): mehr je Bild
    let kette = Promise.resolve(); // Rastern nacheinander (ein Stück je Bild)
    const statistik = { kacheln: 0, leer: 0, ms: 0, laengste: 0, texturen: 0, log: [] };
    const g3 = r3.getContext(), kachel = document.createElement('canvas'), kctx = kachel.getContext('2d');
    const probe = document.createElement('canvas');
    probe.width = probe.height = 32;
    const pctx = probe.getContext('2d', { willReadFrequently: true });
    /** Die Kachel ist ganz durchsichtig (Probe in 32 × 32): keine Textur (der Himmel der nahen Ebenen, Speicher der Grafik) */
    const durchsichtig = (img, x, y, w, h) => {
      pctx.clearRect(0, 0, 32, 32);
      pctx.drawImage(img, x, y, w, h, 0, 0, 32, 32);
      const d = pctx.getImageData(0, 0, 32, 32).data;
      for (let i = 3; i < d.length; i += 4) if (d[i]) return false;
      return true;
    };
    /**
     * Textur aus der Leinwand der Kachel, als THREE.Texture, die three nur bindet (Version 0: lädt nichts selbst hoch):
     * Eine ganze Leinwand auf einmal hielt den Hauptthread bis 320 ms an (das SVG wird erst beim Hochladen gerastert).
     */
    const textur = (quelle) => {
      const wt = g3.createTexture();
      r3.state.bindTexture(g3.TEXTURE_2D, wt);
      g3.pixelStorei(g3.UNPACK_FLIP_Y_WEBGL, false);
      g3.pixelStorei(g3.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      g3.texImage2D(g3.TEXTURE_2D, 0, g3.RGBA, g3.RGBA, g3.UNSIGNED_BYTE, quelle);
      for (const [k, v] of [[g3.TEXTURE_MIN_FILTER, g3.LINEAR], [g3.TEXTURE_MAG_FILTER, g3.LINEAR],
        [g3.TEXTURE_WRAP_S, g3.CLAMP_TO_EDGE], [g3.TEXTURE_WRAP_T, g3.CLAMP_TO_EDGE]]) g3.texParameteri(g3.TEXTURE_2D, k, v);
      const tex = new THREE.Texture();
      r3.properties.get(tex).__webglTexture = wt;
      return { tex, frei: () => { g3.deleteTexture(wt); r3.properties.remove(tex); } };
    };
    /**
     * SVG inhalt im Ausschnitt [x0, y0, x1, y1] (Massen) mit S Pixeln je Mass rastern, in Kacheln von KACHEL Pixeln, je
     * eine eigene Textur mit 1 Pixel Rand der Nachbarn (keine Nähte beim Filtern); ganz durchsichtige fallen weg. Zurück
     * ein Bild { obj (Gruppe der Meshes), kacheln [{ mesh, box }], frei(), bytes }, oder null (abgebrochen).
     */
    const rastern = (inhalt, [x0, y0, x1, y1], S, rs, eilig = () => false) => {
      const job = kette.then(async () => {
        const meinPlan = plan;
        let pw = Math.max(1, Math.ceil((x1 - x0) * S)), ph = Math.max(1, Math.ceil((y1 - y0) * S));
        const f = Math.min(1, MAX_TEX / pw, MAX_TEX / ph);
        if (f < 1) { S *= f; pw = Math.min(MAX_TEX, Math.ceil((x1 - x0) * S)); ph = Math.min(MAX_TEX, Math.ceil((y1 - y0) * S)); }
        const url = URL.createObjectURL(new Blob([svgDoc(inhalt, [x0, y0, pw / S, ph / S], pw, ph, rs)], { type: 'image/svg+xml' }));
        const kacheln = [], frei = () => { for (const k of kacheln) k.frei(); };
        let ab = performance.now(); // Beginn der Arbeit in diesem Bild
        try {
          const img = new Image();
          img.src = url;
          await img.decode();
          for (let ty = 0; ty < ph; ty += KACHEL) for (let tx = 0; tx < pw; tx += KACHEL) {
            // im Ruhepunkt ein Stück je Bild; in einer Fahrt nur, was gebraucht wird (sonst wartet es)
            while (scene.moving && !eilig() && meinPlan === plan) await nachBild();
            if (meinPlan !== plan) { frei(); return null; }
            const t0 = performance.now(), w = Math.min(KACHEL, pw - tx), h = Math.min(KACHEL, ph - ty);
            if (pw * ph > KACHEL * KACHEL && durchsichtig(img, tx, ty, w, h)) { statistik.leer++; continue; }
            const ax = Math.max(0, tx - 1), ay = Math.max(0, ty - 1), kw = Math.min(pw, tx + w + 1) - ax, kh = Math.min(ph, ty + h + 1) - ay;
            if (kachel.width !== kw || kachel.height !== kh) { kachel.width = kw; kachel.height = kh; } else kctx.clearRect(0, 0, kw, kh);
            kctx.drawImage(img, ax, ay, kw, kh, 0, 0, kw, kh);
            const t = textur(kachel), mesh = new THREE.Mesh(quad, bildMaterial());
            mesh.matrixAutoUpdate = false;
            mesh.frustumCulled = false;
            mesh.material.uniforms.map.value = t.tex;
            mesh.material.uniforms.uvRect.value.set((tx - ax) / kw, (ty - ay) / kh, w / kw, h / kh);
            kacheln.push({ mesh, box: [x0 + tx / S, y0 + ty / S, w / S, h / S], frei: t.frei, bytes: kw * kh * 4 });
            const ms = performance.now() - t0;
            statistik.kacheln++; statistik.ms += ms; statistik.laengste = Math.max(statistik.laengste, ms);
            if (statistik.log.length < 3000) statistik.log.push([Math.round(t0), +ms.toFixed(1), kw * kh]);
            // weiter im nächsten Bild, sobald dieses RASTER_MS Arbeit hatte (wartet eine Fahrt darauf: mehr)
            if (!eilig() && performance.now() - ab > (wartet ? 12 : RASTER_MS)) { await nachBild(); ab = performance.now(); }
          }
          statistik.texturen++;
          const obj = new THREE.Group();
          for (const k of kacheln) obj.add(k.mesh);
          return { obj, kacheln, frei, bytes: kacheln.reduce((x, k) => x + k.bytes, 0), groesse: [pw, ph] };
        } finally { URL.revokeObjectURL(url); }
      });
      kette = job.catch(() => null);
      return job;
    };
    /** Bild in die Ebene (pose), m: vom Teil in die Ebene, alpha: Deckkraft */
    const zeigBild = (bild, pose, m, alpha = 1) => {
      for (const k of bild.kacheln) { setze(k.mesh, pose, k.box, m); k.mesh.material.uniforms.opacity.value = alpha; }
    };

    /* -- Plan je Folge und Bildschirm: Ansichten je Ebene und Abschnitt, daraus Ausschnitte und Skalierungen -- */
    const q2 = () => (window.visualViewport?.scale ?? 1) * (window.devicePixelRatio || 1); // Gerätepixel je CSS-Pixel der Bühne
    // höchstens so viele Bildschirme an Pixeln je Textur (Speicher der Grafik): darüber bekommt ein Abschnitt eine
    // Grundstufe über alles, was man sieht, und schärfere Stufen für die Ruhepunkte (stufen)
    const BUDGET = 1.6;
    /** Ansichten der Ebene p in den Fahrten a … b, je 24 Schritte: Rechteck in Massen, Skalierung, ende (Ruhepunkt) */
    const ansichten = (stuecke, p, a, b) => {
      const W = innerWidth, H = innerHeight, aus = [];
      for (const [i, { from, to }] of stuecke.slice(a, b + 1).entries()) for (let j = i ? 1 : 0; j <= 24; j++) {
        const k = j / 24, c = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, z: from.z * (to.z / from.z) ** k };
        const s = scene.skala(c, p), X = 800 + (c.x - 800) * p, Y = 450 + (c.y - 450) * p;
        aus.push({ box: [X - W / 2 / s - 4, Y - H / 2 / s - 4, X + W / 2 / s + 4, Y + H / 2 / s + 4], s, ende: j === 0 || j === 24 });
      }
      return aus;
    };
    const huelle = (l) => [Math.min(...l.map((x) => x.box[0])), Math.min(...l.map((x) => x.box[1])),
      Math.max(...l.map((x) => x.box[2])), Math.max(...l.map((x) => x.box[3]))];
    const schnitt = (a, b) => [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
    const leer = (b) => !(b[2] > b[0] && b[3] > b[1]);
    const inhaltVon = (b) => (b[2] - b[0]) * (b[3] - b[1]);
    const weiter = ([x0, y0, x1, y1], f) => { const dx = (x1 - x0) * f, dy = (y1 - y0) * f; return [x0 - dx, y0 - dy, x1 + dx, y1 + dy]; };
    /**
     * Stufen einer Gruppe im Abschnitt [a, b] der Folge: eine Grundstufe über alles, was man darin sieht (Skalierung die
     * grösste, höchstens BUDGET Bildschirme an Pixeln), dazu je Ruhepunkt, den die Grundstufe um mehr als 15 % zu grob
     * zeigt, eine scharfe Stufe über seine Ansicht (in einer Zoomfahrt ist die Mitte so etwas weicher, im Halt nie)
     */
    const stufen = (p, [a, b], grenze) => {
      const q = q2(), budget = BUDGET * innerWidth * innerHeight * q * q, v = ansichten(stand.stuecke, p, a, b);
      const box = schnitt(huelle(v), grenze);
      if (leer(box)) return [];
      const S = Math.min(Math.max(...v.map((x) => x.s)) * q, Math.sqrt(budget / inhaltVon(box))), aus = [{ box, S }];
      for (const x of v) {
        if (!x.ende || x.s * q <= S * 1.15) continue;
        const bx = schnitt(weiter(x.box, 0.04), grenze);
        if (leer(bx) || aus.some((y) => y.box.join() === bx.join())) continue;
        aus.push({ box: bx, S: Math.min(x.s * q, Math.sqrt(budget / inhaltVon(bx))) });
      }
      return aus;
    };

    // Texturen der stehenden Gruppen: je Gruppe { Abschnitt → { job, teile (Stufen mit Mesh), fertig } }; Linien je
    // Ruhepunkt; Teile (Sprites)
    const gruppen = teile.flat().filter((x) => x.art === 'gruppe');
    const linienT = teile.flat().filter((x) => x.art === 'linie');
    for (const g of gruppen) { g.obj = new THREE.Group(); welt.add(g.obj); g.tex = new Map(); }
    for (const l of linienT) { l.obj = new THREE.Group(); welt.add(l.obj); }
    let stand = null; // { stuecke, abschnitte, key }
    const freiAlle = (e) => { for (const bild of e?.teile ?? []) bild.frei(); };
    /** Textur der Gruppe g für den Abschnitt [a, b] (anlegen, falls nicht da); eilig: in einer Fahrt sofort rastern */
    const gruppeTex = (g, ab, eilig = false) => {
      const key = ab.join('-');
      let e = g.tex.get(key);
      if (!e) {
        e = { teile: null, eilig, fertig: false };
        g.tex.set(key, e);
        const rs = g.rs === 'fest' ? scene.skala({ z: 1 }, g.p).toFixed(5) : 1;
        e.job = Promise.all(stufen(g.p, ab, g.box).map(({ box, S }) => rastern(g.teile.join(''), box, S, rs, () => e.eilig)))
          .then((bilder) => {
            if (bilder.some((x) => !x)) { for (const x of bilder) x?.frei(); return null; } // abgebrochen (neuer Plan)
            e.teile = bilder;
            e.fertig = true;
            einmal();
            return e;
          });
      }
      if (eilig) e.eilig = true;
      return e;
    };
    /** Linie l im Ruhepunkt: Breite aus der Kamera c, gerastert für die nächste Fahrt n (Ausschnitt der ganzen Folge) */
    const linieTex = (l, c, n) => {
      const rs = scene.skala(c, l.p), aktuell = l.aktuell;
      if (aktuell && Math.max(rs / aktuell.rs, aktuell.rs / rs) <= LINIEN_TOLERANZ) return;
      if (l.wird && Math.max(rs / l.wird.rs, l.wird.rs / rs) <= LINIEN_TOLERANZ) return;
      const anzahl = stand.stuecke.length, q = q2();
      const aus = schnitt(huelle(ansichten(stand.stuecke, l.p, 0, anzahl - 1)), l.box);
      if (leer(aus)) return;
      const smax = Math.max(...ansichten(stand.stuecke, l.p, Math.max(0, n - 1), Math.min(n, anzahl - 1)).map((x) => x.s));
      const S = Math.min(smax * q, Math.sqrt(BUDGET * innerWidth * innerHeight * q * q / inhaltVon(aus)));
      const e = l.wird = { rs, bild: null };
      e.job = rastern(l.inhalt, aus, S, rs.toFixed(5)).then((bild) => {
        if (l.wird !== e || !bild) { bild?.frei(); return; }
        l.wird = null;
        l.aktuell?.bild?.frei();
        e.bild = bild;
        l.aktuell = e;
        l.obj.clear();
        l.obj.add(bild.obj);
      });
    };

    /* -- Teile, die sich bewegen: kleine Texturen einmal je Plan, je ein Mesh -- */
    const sprites = [];
    const sprite = (x, inhalt, box, extra = 1) => {
      const s = { obj: new THREE.Group(), box, inhalt, extra, p: x.p, bild: null };
      welt.add(s.obj);
      sprites.push(s);
      return s;
    };
    const flks = [], rauch = [], wuermer = [];
    let polarT = null, schalT = null, armT = null, sterne = null, strahl = null;
    for (const x of teile.flat()) {
      if (x.art === 'flk') flks.push({ ...x, s: sprite(x, x.inhalt, x.box) });
      else if (x.art === 'polar') polarT = { ...x, s: sprite(x, x.inhalt, x.box, 2.8) };
      else if (x.art === 'schal') schalT = { ...x, s: sprite(x, x.inhalt, x.box) };
      else if (x.art === 'arm') {
        armT = { ...x, s: sprite(x, x.inhalt, x.box) };
        strahl = strahlMesh();
      } else if (x.art === 'rauch') {
        const inhalt = '<ellipse rx="1.5" ry="1" fill="url(#s-smoke)"/>';
        chimneys.forEach(([cx, cy], i) => [0, 1 / 3, 2 / 3].forEach((off0) =>
          rauch.push({ ort: [n(cx), n(cy)], off: off0 + i * 0.13, s: sprite(x, inhalt, [-1.5, -1, 3, 2], 13) })));
      } else if (x.art === 'wuermer') {
        const inhalt = (DIAG.has('ohneleuchten') ? '' : '<circle r="11" fill="url(#s-gw)"/>') + '<circle r="1.9" fill="#efffb0"/>';
        for (const w of worms) wuermer.push({ w, s: sprite(x, inhalt, [-11, -11, 22, 22], 1.6) });
      } else if (x.art === 'sterne') sterne = { ...x, mesh: sternMesh(x.punkte) };
    }
    const wagenM = wagenMesh();
    // gezeichnet wird in der Reihenfolge des DOM (Ebene für Ebene, darin wie ihre Kinder)
    {
      const reihe = [];
      for (const x of teile.flat()) {
        if (x.art === 'gruppe') reihe.push(x.obj);
        else if (x.art === 'linie') reihe.push(x.obj);
        else if (x.art === 'sterne') reihe.push(sterne.mesh);
        else if (x.art === 'flk') reihe.push(flks.find((f) => f.box === x.box).s.obj);
        else if (x.art === 'polar') reihe.push(wagenM, polarT.s.obj); // der Wagen hinter seinem Polarstern
        else if (x.art === 'schal') reihe.push(schalT.s.obj);
        else if (x.art === 'arm') reihe.push(armT.s.obj, strahl);
        else if (x.art === 'rauch') reihe.push(...rauch.map((r) => r.s.obj));
        else if (x.art === 'wuermer') reihe.push(...wuermer.map((w) => w.s.obj));
      }
      for (const m of reihe) welt.remove(m);
      for (const m of reihe) welt.add(m);
    }
    // alle Shader jetzt übersetzen: Der Strahl erscheint erst beim Klick der Lampe und übersetzte dann im ersten Bild (88 ms)
    {
      const vor = new THREE.Mesh(quad, bildMaterial());
      welt.add(vor);
      for (const o of welt.children) o.visible = true;
      r3.compile(welt, kamera);
      welt.remove(vor);
    }

    /** Funkelnde Sterne als Punkte: Deckkraft je Gruppe wie die CSS-Animation (ease-in-out, hin und her) */
    function sternMesh(punkte) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(punkte.flatMap(([x, y]) => [x, y, 0]), 3));
      g.setAttribute('stern', new THREE.Float32BufferAttribute(punkte.flatMap(([, , r, o]) => [r, o]), 2));
      g.setAttribute('takt', new THREE.Float32BufferAttribute(punkte.flatMap(([, , , , d, v, von]) => [d, v, von]), 3));
      const m = new THREE.Points(g, new THREE.ShaderMaterial({ ...mischen,
        uniforms: { uPose: { value: new THREE.Vector3(1, 0, 0) }, uZeit: { value: 0 }, uAufl: { value: new THREE.Vector2(1, 1) } },
        vertexShader: `uniform vec3 uPose; uniform float uZeit; uniform vec2 uAufl; attribute vec2 stern; attribute vec3 takt;
          varying float vR; varying float vA;
          float kurve(float x) { // ease-in-out (cubic-bezier(0.42, 0, 0.58, 1)), genähert
            return x * x * (3.0 - 2.0 * x); }
          void main() {
            vec2 px = position.xy * uPose.x + uPose.yz;
            gl_Position = vec4(px / uAufl * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
            vR = stern.x * uPose.x;
            float u = mod((uZeit - takt.y) / takt.x, 2.0); // hin und her (alternate)
            float k = kurve(u < 1.0 ? u : 2.0 - u);
            vA = stern.y * mix(takt.z, 1.0, k);
            gl_PointSize = 2.0 * vR + 3.0;
          }`,
        fragmentShader: `varying float vR; varying float vA;
          void main() {
            float d = length(gl_PointCoord - 0.5) * (2.0 * vR + 3.0);
            // Fläche wie beim Rastern einer kleinen Scheibe: Kante 1 Pixel weich, sehr kleine nach ihrer Fläche
            float a = clamp(vR + 0.5 - d, 0.0, 1.0) * min(1.0, vR * vR * 3.14159 / 0.785);
            gl_FragColor = vec4(1.0) * a * vA;
          }` }));
      m.frustumCulled = false;
      welt.add(m);
      return m;
    }
    /**
     * Der Kleine Wagen (BUEHNENWAGEN): Sterne 1 … 6 und die sieben Linien als Rechtecke in Bildpixeln um ihre Orte im
     * Himmel (scene.wagenOrte, wagenSetzen), gezeichnet wie der Wagen am Himmel der Welten (himmelsWagen: Kern mit
     * Schein, Linien mit Lücke zu den Sternen); der Polarstern ist der Teil polar. Helligkeit und Grösse je Bild
     * (zeichnen, scene.wagenBei).
     */
    function wagenMesh() {
      const nS = wagen.polarstern - 1, nQ = nS + wagen.linien.length, index = [];
      const ecke = new Float32Array(nQ * 8), art = new Float32Array(nQ * 4), nr = new Float32Array(nQ * 4);
      for (let i = 0; i < nQ; i++) {
        const linie = i >= nS;
        (linie ? [[-1, 0], [1, 0], [1, 1], [-1, 1]] : [[-1, -1], [1, -1], [1, 1], [-1, 1]]).forEach((e, j) => {
          ecke.set(e, (i * 4 + j) * 2);
          art[i * 4 + j] = linie ? 1 : 0;
          nr[i * 4 + j] = i;
        });
        index.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(nQ * 12), 3)); // für three.js
      g.setAttribute('aA', new THREE.Float32BufferAttribute(new Float32Array(nQ * 8), 2));
      g.setAttribute('aB', new THREE.Float32BufferAttribute(new Float32Array(nQ * 8), 2));
      g.setAttribute('aEcke', new THREE.Float32BufferAttribute(ecke, 2));
      g.setAttribute('aArt', new THREE.Float32BufferAttribute(art, 1));
      g.setAttribute('aNr', new THREE.Float32BufferAttribute(nr, 1));
      g.setIndex(index);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ ...mischen,
        uniforms: { uPose: { value: new THREE.Vector3(1, 0, 0) }, uAufl: { value: new THREE.Vector2(1, 1) },
          uHell: { value: new Float32Array(nQ) }, uGroesse: { value: new Float32Array(nQ) }, uLuecke: { value: 0 } },
        vertexShader: `uniform vec3 uPose; uniform vec2 uAufl; uniform float uHell[${nQ}], uGroesse[${nQ}], uLuecke;
          attribute vec2 aA, aB, aEcke; attribute float aArt, aNr;
          varying vec2 vEcke; varying float vHell, vArt;
          vec4 bild(vec2 px) { return vec4(px / uAufl * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0); }
          void main() {
            int i = int(aNr + 0.5);
            vHell = uHell[i]; vEcke = aEcke; vArt = aArt;
            vec2 pa = aA * uPose.x + uPose.yz, pb = aB * uPose.x + uPose.yz; // Bildpixel
            if (vHell <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; } // aus: nichts
            if (aArt < 0.5) { gl_Position = bild(pa + aEcke * 0.75 * uGroesse[i]); return; } // Stern mit Schein
            vec2 d = pb - pa;
            float len = length(d);
            if (len < 2.0 * uLuecke + 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
            d /= len;
            gl_Position = bild(mix(pa, pb, aEcke.y) + vec2(-d.y, d.x) * aEcke.x * (0.5 * uGroesse[i] + 1.0)
              + d * uLuecke * (1.0 - 2.0 * aEcke.y));
          }`,
        fragmentShader: `varying vec2 vEcke; varying float vHell, vArt;
          void main() {
            float a;
            if (vArt < 0.5) {
              float r = length(vEcke) * 1.5; // 1: Rand des Kerns
              a = smoothstep(1.0, 0.45, r) + 0.22 * pow(max(0.0, 1.0 - r / 1.5), 2.0);
            } else a = smoothstep(1.0, 0.35, abs(vEcke.x));
            float h = min(vHell * a, 1.0);
            gl_FragColor = vec4(vec3(h), h);
          }` }));
      m.frustumCulled = false;
      welt.add(m);
      return m;
    }
    /** Die Orte des Wagens (scene.wagenOrte, Massen der Szene im Himmel) in sein Netz, wenn sie neu sind. */
    function wagenSetzen(orte) {
      if (wagenM.userData.orte === orte) return;
      wagenM.userData.orte = orte;
      const nS = wagen.polarstern - 1, ga = wagenM.geometry.attributes.aA, gb = wagenM.geometry.attributes.aB;
      const enden = [...orte.slice(0, nS).map((o) => [o, o]),
        ...wagen.linien.map(([a, b]) => [orte[a - 1], orte[b - 1]])];
      enden.forEach(([a, b], i) => {
        for (let j = 0; j < 4; j++) { ga.array.set(a, (i * 4 + j) * 2); gb.array.set(b, (i * 4 + j) * 2); }
      });
      ga.needsUpdate = gb.needsUpdate = true;
    }
    /**
     * Strahl: Kegel und Kern (STRAHL_TEILE) als ein Trapez je Teil mit Hals w0 und Breite k · L am Ende, deckend in seiner
     * Farbe mal dem Verlauf (Maske: Stopps über L / 0,55), der Kern über dem Kegel, darüber das Leuchten der Lampe (s-lamp);
     * alles zusammen mal Kraft und Flackern (wie die Deckkraft der Gruppe im DOM). In Massen des Arms, Ursprung an der
     * Spitze der Lampe (left 34).
     */
    function strahlMesh() {
      const farbe = (h) => new THREE.Vector3(...[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255));
      const stopps = (st) => st.map(([a, p]) => new THREE.Vector2(p / 100, a));
      const [kegel, kern] = STRAHL_TEILE;
      const m = new THREE.Mesh(quad, new THREE.ShaderMaterial({ ...mischen,
        uniforms: { uL: { value: 1 }, uS: { value: 1 }, uO: { value: 0 }, uPx: { value: 1 },
          uW0: { value: new THREE.Vector2(kegel.w0, kern.w0) }, uK: { value: new THREE.Vector2(kegel.k, kern.k) },
          uHb: { value: new THREE.Vector2(...STRAHL_TEILE.map(({ w0, k }) => Math.max(k * STRAHL_L, w0 / 0.25))) },
          uF0: { value: farbe(kegel.farbe) }, uF1: { value: farbe(kern.farbe) },
          uS0: { value: stopps(kegel.stopps) }, uS1: { value: stopps(kern.stopps) }, uBox: { value: new THREE.Vector4() } },
        vertexShader: 'uniform vec4 uBox; varying vec2 vP; void main() { vP = uBox.xy + uv * uBox.zw; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform float uL; uniform float uS; uniform float uO; uniform float uPx; uniform vec2 uW0; uniform vec2 uK; uniform vec2 uHb;
          uniform vec3 uF0; uniform vec3 uF1; uniform vec2 uS0[4]; uniform vec2 uS1[4]; varying vec2 vP;
          // Maske: Stopps (Anteil, Alpha) über die Länge L / 0,55, zwischen ihnen weich (smoothstep statt linear: keine
          // Knicke im Verlauf, die als Stufen zu sehen waren)
          float verlauf(vec2 s[4], float u) {
            if (u <= s[0].x) return s[0].y;
            for (int i = 1; i < 4; i++) if (u <= s[i].x) return mix(s[i - 1].y, s[i].y, smoothstep(s[i - 1].x, s[i].x, u));
            return s[3].y; }
          // weich: so breit (Anteil der halben Breite) blendet der Rand aus, je zur Hälfte innen und aussen (die Menge
          // Licht bleibt gleich, mindestens ein Pixel); mit dem harten Rand wie im DOM wirkte der Strahl aussen eckig
          // (Nutzer, Ticket 19)
          float teil(float w0, float k, float hb, float weich) {
            float halb = w0 + (k * uL - w0) * vP.x / uL; // Hals w0, am Ende k · L (Kegel und Keile zusammen)
            float rand = min(halb, uS * hb); // die Box der Maske (Höhe 2 hb, mitskaliert)
            float b = max(uPx, weich * rand);
            float a = smoothstep(-0.5 * b, 0.5 * b, rand - abs(vP.y));
            return a * clamp(vP.x / uPx + 0.5, 0.0, 1.0) * clamp((uL - vP.x) / uPx + 0.5, 0.0, 1.0); }
          void main() {
            float u = vP.x / (uL / 0.55);
            float a0 = teil(uW0.x, uK.x, uHb.x, ${STRAHL_WEICH.toFixed(2)}) * verlauf(uS0, u), a1 = teil(uW0.y, uK.y, uHb.y, 0.5) * verlauf(uS1, u);
            vec4 c = vec4(uF0 * a0, a0);
            c = vec4(uF1 * a1, a1) + c * (1.0 - a1);
            float r = length(vP) / 24.0; // Leuchten der Lampe (s-lamp, r 24)
            float al = r < 0.25 ? mix(1.0, 0.45, r / 0.25) : mix(0.45, 0.0, clamp((r - 0.25) / 0.75, 0.0, 1.0));
            vec3 fl = r < 0.25 ? mix(vec3(1.0, 250.0 / 255.0, 240.0 / 255.0), vec3(1.0, 241.0 / 255.0, 204.0 / 255.0), r / 0.25) : vec3(1.0, 241.0 / 255.0, 204.0 / 255.0);
            c = vec4(fl * al, al) + c * (1.0 - al);
            gl_FragColor = c * uO;
          }` }));
      m.matrixAutoUpdate = false;
      m.frustumCulled = false;
      welt.add(m);
      return m;
    }

    /* -- Kamera aus der Folge auf ihrer Uhr (folgeUhr: Tippen, Tempo, Halt) -- */
    const kameraBei = () => {
      const a = scene.folgeUhr, fz = scene.folgeZeit;
      if (!a || !fz || a.currentTime == null) return scene.cam;
      const ms = a.currentTime;
      let c = fz.start;
      for (const { from, to, t, d } of fz.stuecke) {
        if (ms < t) return from;
        if (ms <= t + d) {
          const k = storyEase((ms - t) / d);
          return { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, z: from.z * (to.z / from.z) ** k };
        }
        c = to;
      }
      return c;
    };
    /** Funkeln der Sterne und Flackern der Fenster wie die CSS-Animationen bis Ticket 19: ease-in-out, genähert */
    const sanft = (x) => x * x * (3 - 2 * x);
    const FLK = [[0, 0.9], [0.3, 1], [0.55, 0.6], [0.8, 0.85], [1, 0.9]];
    const flackernBei = (zeit, verz) => {
      const u = (((zeit - verz) / 3.2) % 1 + 1) % 1;
      for (let i = 1; i < FLK.length; i++) if (u <= FLK[i][0]) return FLK[i - 1][1] + (FLK[i][1] - FLK[i - 1][1]) * sanft((u - FLK[i - 1][0]) / (FLK[i][0] - FLK[i - 1][0]));
      return 0.9;
    };

    /* -- je Bild -- */
    const bilder = new Float64Array(4096); // Zeitstempel der eigenen Bilder (Ring), für die Proben
    let bildN = 0, raf = 0, breite = 0, hoehe = 0;
    let fest = null; // eingefroren (scene.einfrieren): jedes Bild zu diesem Zeitpunkt (performance.now)
    const neuePlan = () => {
      const fz = scene.folgeZeit;
      if (!fz) return;
      plan++;
      stand = { stuecke: fz.stuecke, abschnitte: scene.abschnitte, key: fz.key };
      // was noch rastert, bricht ab und gibt sich selbst frei (plan)
      for (const g of gruppen) { for (const e of g.tex.values()) freiAlle(e); g.tex.clear(); g.zeigt = null; g.obj.clear(); }
      for (const l of linienT) { l.aktuell?.bild?.frei(); l.aktuell = l.wird = null; }
      // Teile: klein, gleich rastern (Skalierung: die grösste der Folge in ihrer Ebene, mal extra)
      for (const s of sprites) {
        const smax = Math.max(...ansichten(stand.stuecke, s.p, 0, stand.stuecke.length - 1).map((v) => v.s)), [x, y, b, h] = s.box;
        rastern(s.inhalt, [x, y, x + b, y + h], Math.min(smax * q2() * s.extra, 512 / Math.max(b, h)), 1, () => true)
          .then((bild) => { if (!bild) return; s.bild?.frei(); s.bild = bild; s.obj.clear(); s.obj.add(bild.obj); });
      }
      nachfuehren();
    };
    /** Welche Texturen jetzt gebraucht werden: anlegen, was fehlt; im Ruhepunkt auch die der nächsten Fahrt */
    const nachfuehren = () => {
      if (!stand) return;
      const anzahl = stand.stuecke.length;
      const n = Math.max(0, Math.min(anzahl - 1, scene.moving ? scene.fahrtIndex : scene.fahrtIndex + 1));
      for (const g of gruppen) {
        const ab = stand.abschnitte[g.ebene].find(([a, b]) => a <= n && n <= b);
        const e = gruppeTex(g, ab, scene.moving && !g.zeigt);
        if (e.fertig && g.zeigt !== e) {
          g.zeigt = e;
          g.obj.clear();
          for (const bild of e.teile) g.obj.add(bild.obj);
          // andere Abschnitte frei (ausser einer, der gerade noch rastert)
          for (const [k, x] of g.tex) if (x !== e && x.fertig) { freiAlle(x); g.tex.delete(k); }
        }
      }
      if (!scene.moving) for (const l of linienT) linieTex(l, scene.cam, n);
    };
    const pose = (c, p, q) => {
      const s = scene.skala(c, p) * q, X = 800 + (c.x - 800) * p, Y = 450 + (c.y - 450) * p;
      return { s, ox: innerWidth * q / 2 - s * X, oy: innerHeight * q / 2 - s * Y };
    };
    const zeichnen = (ts = performance.now()) => {
      if (fest !== null) ts = fest;
      const q = q2(), bw = Math.round(innerWidth * q), bh = Math.round(innerHeight * q);
      if (bw !== breite || bh !== hoehe) {
        breite = bw; hoehe = bh;
        r3.setSize(bw, bh, false);
        kamera.right = bw; kamera.bottom = bh; kamera.updateProjectionMatrix();
      }
      const t = scene.zeitBei(ts), c = kameraBei(), posen = layers.map(({ p }) => pose(c, p, q)), echt = ts / 1000;
      for (const g of gruppen) {
        for (const bild of g.zeigt?.teile ?? []) zeigBild(bild, posen[g.ebene]);
      }
      for (const l of linienT) {
        if (l.aktuell?.bild) zeigBild(l.aktuell.bild, posen[l.ebene]);
      }
      const zeig = (s, m, alpha = 1, ebene = layers.findIndex((l) => l.p === s.p)) => {
        s.obj.visible = !!s.bild && alpha > 0.001;
        if (s.obj.visible) zeigBild(s.bild, posen[ebene], m, alpha);
      };
      if (sterne) {
        const u = sterne.mesh.material.uniforms, ps = posen[sterne.ebene];
        u.uPose.value.set(ps.s, ps.ox, ps.oy); u.uZeit.value = echt; u.uAufl.value.set(bw, bh);
      }
      for (const f of flks) zeig(f.s, [1, 0, 0, 1, 0, 0], flackernBei(echt, f.verz), f.ebene);
      { // der Kleine Wagen im Himmel (die Ebene des Polarsterns), sein Polarstern ist der Teil polar
        const orte = scene.wagenOrte, w = scene.wagenBei(t), u = wagenM.material.uniforms, ps = posen[0];
        const nS = wagen.polarstern - 1, H = HIMMELSWAGEN;
        wagenM.visible = !!orte;
        if (orte) {
          wagenSetzen(orte);
          u.uPose.value.set(ps.s, ps.ox, ps.oy); u.uAufl.value.set(bw, bh);
          u.uHell.value.fill(w.hell, 0, nS).fill(w.linie, nS);
          u.uGroesse.value.fill(w.punkt * q, 0, nS).fill(H.linie.breite * q, nS);
          u.uLuecke.value = H.linie.luecke * q;
        }
      }
      if (polarT) zeig(polarT.s, dreh(0, ...(scene.wagenOrte?.[wagen.polarstern - 1] ?? polarT.ort),
        (1 + 1.8 * stern.wert(t)) * atem.wert(t)), 1, polarT.ebene);
      for (const r of rauch) {
        const k = (((t + r.off * 20) % 20) + 20) % 20 / 20, size = 3 + k * 10, dx = k * 34 + Math.sin(4 * Math.PI * k - 3 * r.off) * 3;
        zeig(r.s, [size, 0, 0, size, r.ort[0] + dx, r.ort[1] - k * 85], Math.sin(Math.PI * k) ** 1.5 * 0.5, layers.findIndex((l) => l.p === r.s.p));
      }
      if (schalT) zeig(schalT.s, dreh(schal.wert(t), ...schalT.ort), 1, schalT.ebene);
      const armGrad = armSpur.wert(t);
      if (armT) {
        const m = dreh(armGrad, ...armT.ort);
        zeig(armT.s, m, 1, armT.ebene);
        const v = kraft.wert(t), o = (v > 0.002 ? v : 0) * flackern.wert(t);
        strahl.visible = o > 0.001 && !DIAG.has('ohnestrahl');
        if (strahl.visible) {
          const sL = Math.max(laenge.wert(t), STRAHL_MIN), L = sL * STRAHL_L, H = Math.max(24, ...STRAHL_TEILE.map(({ w0, k }) => Math.max(w0, k * L) * (1 + STRAHL_WEICH / 2))) + 2;
          const box = [-24, -H, L + 24, 2 * H], u = strahl.material.uniforms, ps = posen[armT.ebene];
          setze(strahl, ps, box, mal(m, [1, 0, 0, 1, 34, 0]));
          u.uBox.value.set(...box); u.uL.value = L; u.uS.value = sL; u.uO.value = o; u.uPx.value = 1 / ps.s;
        }
      }
      if (wuermer.length) {
        const a = armGrad * Math.PI / 180, tx = 440 + 34 * Math.cos(a), ty = 592 + 34 * Math.sin(a);
        for (const { w, s } of wuermer) {
          const [x, y, g] = scene.worms === 'idle' ? [w.hx + Math.sin(t * w.a + w.ph) * 16, w.hy + Math.cos(t * w.b + w.ph) * 9, 1]
            : scene.wurmOrt(w, t, tx, ty), blink = 0.45 + 0.55 * Math.sin(w.fl * t + w.ph) ** 2;
          zeig(s, [g, 0, 0, g, x, y], blink);
        }
      }
      r3.render(welt, kamera);
      bilder[bildN++ % bilder.length] = ts;
    };
    let einmalRaf = 0;
    const einmal = () => { if (!raf && !einmalRaf) einmalRaf = requestAnimationFrame((ts) => { einmalRaf = 0; if (!raf && stand) { nachfuehren(); zeichnen(ts); } }); };
    const schleife = (ts) => {
      raf = 0;
      if (!scene.running) return;
      zeichnen(ts);
      raf = requestAnimationFrame(schleife);
      // nach dem Bild: was fehlt, anstossen (rastert dann ein Stück je Bild)
      if (!scene.moving) nachfuehren();
    };
    return {
      leinwand,
      neuePlan,
      /** einmal zeichnen (vorwärmen: Shader und Texturen), ohne Schleife */
      zeichnen: () => { nachfuehren(); zeichnen(); },
      start() { if (!raf) raf = requestAnimationFrame(schleife); },
      /** jedes Bild zum Zeitpunkt ms (performance.now; null: wieder jetzt) */
      einfrieren(ms) { fest = ms; },
      stop() { cancelAnimationFrame(raf); raf = 0; },
      /** Fahrt n kann beginnen, sobald ihre Texturen da sind (Tippen im Ruhepunkt, bevor sie fertig gerastert sind) */
      async bereit(n) {
        if (!stand) return;
        const jobs = gruppen.map((g) => gruppeTex(g, stand.abschnitte[g.ebene].find(([a, b]) => a <= n && n <= b)).job);
        wartet = true;
        try { await Promise.all(jobs); } finally { wartet = false; }
        nachfuehren();
      },
      /** ausgeblendet: Texturen frei (Speicher der Grafik), die Leinwand klein; die nächste Folge plant neu */
      freigeben() {
        plan++;
        stand = null;
        for (const g of gruppen) { for (const e of g.tex.values()) freiAlle(e); g.tex.clear(); g.zeigt = null; g.obj.clear(); }
        for (const l of linienT) { l.aktuell?.bild?.frei(); l.aktuell = l.wird = null; }
        for (const s of sprites) { s.bild?.frei(); s.bild = null; }
        breite = hoehe = 1;
        r3.setSize(1, 1, false);
      },
      /** Abstände der eigenen Bilder (ms), die letzten n */
      bilder(nur = 4096) {
        const k = Math.min(bildN, bilder.length, nur), aus = [];
        for (let i = bildN - k + 1; i < bildN; i++) aus.push(bilder[i % bilder.length] - bilder[(i - 1) % bilder.length]);
        return aus;
      },
      /** Zeitstempel der eigenen Bilder seit t (performance.now, aufsteigend), für die Leistungsanzeige */
      zeitenSeit(t) {
        const aus = [];
        for (let i = Math.max(0, bildN - bilder.length); i < bildN; i++) if (bilder[i % bilder.length] >= t) aus.push(bilder[i % bilder.length]);
        return aus;
      },
      /** Bytes der Texturen (stehend, Linien, Teile) */
      speicher() {
        let b = 0;
        for (const g of gruppen) for (const e of g.tex.values()) for (const bild of e.teile ?? []) b += bild.bytes;
        for (const l of linienT) b += (l.aktuell?.bild?.bytes ?? 0) + (l.wird?.bild?.bytes ?? 0);
        for (const s of sprites) b += s.bild?.bytes ?? 0;
        return b;
      },
      statistik,
      /** Bilder einzeln: [Art, Ebene, Breite × Höhe in Pixeln, Kacheln, MB] */
      liste() {
        const aus = [];
        for (const g of gruppen) for (const [k, e] of g.tex) for (const bild of e.teile ?? []) aus.push(['gruppe ' + k, g.ebene, bild.groesse.join('×'), bild.kacheln.length, +(bild.bytes / 1048576).toFixed(1)]);
        for (const l of linienT) if (l.aktuell?.bild) aus.push(['linie', l.ebene, l.aktuell.bild.groesse.join('×'), l.aktuell.bild.kacheln.length, +(l.aktuell.bild.bytes / 1048576).toFixed(1)]);
        return aus;
      },
    };
  };
  const gl = glBuehne();
  q('.hint span').textContent = IS_TOUCH ? 'Tippen zum Weitergehen' : 'Klicken zum Weitergehen';
  // Arm mit der Lampe zeigt zum Polarstern (Grad; er steht an der Spitze des Wagens, scene.wagenOrte), so wie man beide
  // in der Einstellung sieht, in der Noa zu ihm hinauf leuchtet (Prolog 4 reach, schon beim Heben in lamp; Epilog 3
  // answer), mit der Parallaxe von Himmel und Hügel (Abnahme Ticket 11; vorher wie bei Zoom 1, und der Strahl lief auf
  // dem Desktop links am Polarstern vorbei). Noa steht in der Ebene p = 1, ihr Arm dreht um (440, 592).
  // In Epilog 3 im selben Winkel wie in Prolog 4 (Abnahme Ticket 13: dafür fährt die Kamera dort, scene.winkelKamera).
  const erhoben = (act) => {
    const shot = scene.folge?.find((s) => s.act === (act === 'lamp' ? 'reach' : act));
    if (!shot || !scene.wagenOrte) {
      const [x, y] = scene.wagenOrte?.[wagen.polarstern - 1] ?? [1120, 150];
      return Math.atan2(y + 20 - 592, x - 440) * 180 / Math.PI;
    }
    return scene.winkel(scene.ziel(shot)[0]);
  };
  const [FLUG_ZU, FLUG_WALD] = [2.4, 3.6]; // s: Dauer der Flüge der Glühwürmchen zur Lampe und in den Wald
  const ABSCHNITT_MARGE = 1.15; // so viel mehr als nötig darf eine Ebene im Ruhepunkt gerastert sein (abschnitteFuer)
  const HALTEN = 1e7; // ms (fast 3 h): so lange hält die Folge vor jeder Fahrt ihr Bild (folgeAnlegen; länger: haltWachen)
  const LINIEN_TOLERANZ = 1.1; // neu gerastert wird eine Linie erst, wenn ihre Strichbreite sonst um mehr als 10 % abwiche
  // ms nach dem Halt, bis die Pause ruhig ist (story.stillBild): Bis dahin rastert die Bühne Linien und die Texturen der
  // nächsten Fahrt (glBuehne, nachfuehren); so lang wie bis Ticket 19 (Wartezeit, gestaffelte Ebenen, Tausch der Linien)
  const RUHE_NACH_HALT = 1050;
  const ZEILE_AUS_MS = 600; // so lange blendet ein Satz der Bühne aus (CSS #story .scene .line; Rückfall in say)

  scene = {
    el, skip: q('.skip'), gl,
    tweens: [], running: false,
    uhr: { t0: performance.now(), s0: 0, tempo: 1 }, // Zeit der Bühne: läuft in echter Zeit, mal speed
    letzte: 0,          // Zeit der Bühne beim letzten Bild der JS-Schleife
    raf: 0, faellig: 0, // angefordertes Bild; frühestens dann zeichnet es wieder (höchstens 60 Hz)
    tweenZeit: 0,       // Zeitgeber zum nächsten Beginn oder Ende eines Tweens (tweenWecker)
    cam: { x: 800, y: 450, z: 1 },
    arm: 75, beamLen: 0, beamPower: 0, starBoost: 0,
    worms: 'idle', gatherAt: 0, carryAt: 0,
    klickAt: 0,         // Zeit der Bühne, zu der die Lampe klickt (act lamp; Überspringen davor: kein Strahl)
    moving: false,      // eine Kamerafahrt läuft (nur sie wird durch Tippen schneller)
    movedAt: 0,         // Beginn der Fahrt (Zeit der Bühne): ein Doppeltipp beschleunigt die nächste nicht gleich
    laufend: null,      // Fahrt der Kamera, die läuft oder zuletzt lief: { uhr }
    folge: null,        // die Einstellungen, die die Bühne zeigt (Prolog oder Epilog)
    folgeFuer: null,    // für diese Folge ist folgeUhr angelegt
    folgeUhr: null,     // Uhr der ganzen Folge (folgeAnlegen): eine Animation ohne Ziel, ms auf der Uhr
    folgeZeit: null,    // { start, zeiten, kameras, key } der Folge
    fahrtIndex: -1,     // Einstellung der Fahrt, die läuft oder zuletzt lief
    haltZeit: 0,        // Zeitgeber: der Halt bleibt unbegrenzt (haltWachen)
    wagenOrte: null,    // Orte der sieben Sterne des Wagens im Himmel, Massen der Szene (wagenLegen)

    /** Zeit der Bühne (s); setzen rückt die Spuren mit. */
    get time() { const u = this.uhr; return u.s0 + (performance.now() - u.t0) / 1000 * u.tempo; },
    /** Zeit der Bühne zum Zeitpunkt ms (performance.now, auch die Zeitachse des Dokuments) */
    zeitBei(ms) { const u = this.uhr; return u.s0 + (ms - u.t0) / 1000 * u.tempo; },
    set time(v) {
      for (const s of spuren) s.verschiebe(v - this.time);
      this.uhr = { t0: performance.now(), s0: v, tempo: this.uhr.tempo };
      this.letzte = v;
    },
    /** Tempo: Tippen (4) und Überspringen (60) beschleunigen Fahrt, Tweens und alles, was sich bewegt. */
    get speed() { return this.uhr.tempo; },
    set speed(v) {
      if (v === this.uhr.tempo) return;
      this.uhr = { t0: performance.now(), s0: this.time, tempo: v };
      if (this.tweenZeit) this.wecken(); // Ende der Tweens neu stellen (tweenWecker)
      // übersprungen vor dem Klick der Lampe: kein Strahl (wie der Tween in act; die Spur zeigte ihn sonst kurz)
      if (v >= 10 && this.time < this.klickAt) { kraft.zurueck(0); laenge.zurueck(0); }
      // die Uhr der Folge (anpassen legt sie beim Drehen mitten in einer Fahrt neu an) und die der Fahrt
      for (const a of [this.folgeUhr, this.laufend?.uhr]) a?.updatePlaybackRate(v);
    },
    /** Es läuft noch etwas, auf das man warten kann (Tween oder Fahrt). */
    get laeuft() { return this.tweens.length > 0 || this.moving; },

    portrait() { return innerWidth / innerHeight < 0.9; },
    /** Wo der Polarstern bei dieser Kamera im Bild steht (Anteil der Breite und Höhe), wie skala() rechnet. */
    starAt(c) { return this.wagenImBild(c)[wagen.polarstern - 1]; },
    /** Wo die sieben Sterne des Wagens (wagenOrte) bei der Kamera c im Bild stehen (Anteile von oben links). */
    wagenImBild(c) {
      const W = innerWidth, H = innerHeight, p = layers[0].p, s = this.skala(c, p);
      const x = 800 + (c.x - 800) * p, y = 450 + (c.y - 450) * p;
      return (this.wagenOrte ?? this.wagenLegen()).map(([ox, oy]) => [(ox - x) * s / W + 0.5, (oy - y) * s / H + 0.5]);
    },
    /** Kamera im ersten Bild des Epilogs (Beginn seiner ersten Fahrt; im Hochformat fromP) */
    epilogStart() {
      const f = STORY_EPILOG[0];
      return (this.portrait() && f.fromP) || f.from;
    },
    /**
     * Platz für den Wagen auf der Bühne (BUEHNENWAGEN.feld) als Anteile im ersten Bild des Epilogs { links, rechts,
     * oben, unten }: so, dass er in jedem Bild des Epilogs (Anfang und jede Einstellung) und in Prolog 4 ganz zu sehen
     * ist, rand vom Rand des Bilds und über dem höchsten Grat der fernen Berge und des Bergwalds, den man dort sieht.
     * Gerechnet in der Ebene des Himmels (dort steht der Wagen fest).
     */
    wagenFeld() {
      const W = innerWidth, H = innerHeight, rand = BUEHNENWAGEN.feld.rand * Math.min(W, H), p = layers[0].p;
      const mitte = (c, q) => [800 + (c.x - 800) * q, 450 + (c.y - 450) * q];
      const reach = STORY_PROLOG.find((s) => s.act === 'reach');
      const kameras = [this.epilogStart(), ...STORY_EPILOG.map((s) => this.ziel(s)[0]), this.ziel(reach)[0]];
      let x0 = -Infinity, x1 = Infinity, y0 = -Infinity, y1 = Infinity;
      for (const c of kameras) {
        const s = this.skala(c, p), [X, Y] = mitte(c, p);
        let grat = H; // höchster Grat im Bild (Bildpixel von oben)
        for (const [pts, q] of [[far, layers[1].p], [mid, layers[2].p]]) {
          const sq = this.skala(c, q), [Xq, Yq] = mitte(c, q);
          for (const [x, y] of pts) {
            const bx = W / 2 + (x - Xq) * sq;
            if (bx >= 0 && bx <= W) grat = Math.min(grat, H / 2 + (y - Yq) * sq);
          }
        }
        x0 = Math.max(x0, X + (rand - W / 2) / s);
        x1 = Math.min(x1, X + (W / 2 - rand) / s);
        y0 = Math.max(y0, Y + (rand - H / 2) / s);
        y1 = Math.min(y1, Y + (grat - rand - H / 2) / s);
      }
      const c = this.epilogStart(), s = this.skala(c, p), [X, Y] = mitte(c, p);
      return { links: (x0 - X) * s / W + 0.5, rechts: (x1 - X) * s / W + 0.5, oben: (y0 - Y) * s / H + 0.5,
        unten: (y1 - Y) * s / H + 0.5 };
    },
    /**
     * Den Wagen in den Himmel legen: dorthin, wo ihn das Finale am Ende zeigt (wagenLage, Anteile im ersten Bild des
     * Epilogs), in Massen der Szene in der Ebene des Himmels; ohne wagenLage dreimal so gross wie die Form um den
     * Polarstern von früher. Zurück die Orte (wagenOrte), je Bildschirm neu (folgeAnlegen).
     */
    wagenLegen() {
      const [px, py] = wagen.form[wagen.polarstern - 1];
      this.wagenOrte = wagenLage ? this.orteAus(wagenLage())
        : wagen.form.map(([fx, fy]) => [1120 + 3 * (fx - px), 150 + 3 * (fy - py)]);
      return this.wagenOrte;
    },
    /** Orte im Himmel (Massen der Szene) zu Anteilen lage im ersten Bild des Epilogs (wagenLage). */
    orteAus(lage) {
      const c = this.epilogStart(), p = layers[0].p, s = this.skala(c, p);
      const x = 800 + (c.x - 800) * p, y = 450 + (c.y - 450) * p;
      return lage.map(([fx, fy]) => [x + (fx - 0.5) * innerWidth / s, y + (fy - 0.5) * innerHeight / s]);
    },
    /**
     * Winkel (Grad im Bild, y nach unten: hinauf negativ), in dem Noa bei der Kamera c zum Polarstern leuchtet: vom
     * Drehpunkt ihres Arms (440, 592 in ihrer Ebene, p = 1) zum Polarstern an seinem Ort in orte (Massen der Szene im
     * Himmel), mit der Parallaxe von Himmel und Hügel (wie wagenImBild).
     */
    winkel(c, orte = this.wagenOrte ?? this.wagenLegen()) {
      const p = layers[0].p, s0 = this.skala(c, p), s1 = this.skala(c, 1), [ox, oy] = orte[wagen.polarstern - 1];
      const dx = (ox - 800 - (c.x - 800) * p) * s0 - (440 - c.x) * s1;
      const dy = (oy - 450 - (c.y - 450) * p) * s0 - (592 - c.y) * s1;
      return Math.atan2(dy, dx) * 180 / Math.PI;
    },
    /**
     * Kamera c der Einstellung shot mit winkelWie (Epilog 3; Abnahme Ticket 13): Noa leuchtet darin im selben Winkel
     * zum Polarstern wie in der Einstellung winkelWie des Prologs (Prolog 4), in jedem Format. Höhe und Zoom bleiben,
     * waagrecht fährt die Kamera dorthin, wo der Polarstern in diesem Winkel über Noa steht (Noa zieht schneller durchs
     * Bild als der ferne Himmel; der Abstand im Bild hängt linear an c.x). Der Wagen liegt, wo ihn das Finale am Ende
     * zeigt (wagenLage), und das hängt über wagenFeld ein wenig auch an dieser Kamera: darum in ein paar Schritten;
     * solange gerechnet wird, gibt ziel den letzten Schritt (wagenFeld fragt danach). Je Bildschirm einmal.
     */
    winkelKamera(shot, c) {
      const key = `${innerWidth}×${innerHeight}×${camera.aspect}`, m = this._winkel;
      if (m?.shot === shot && m.key === key) return m.c;
      const w = this._winkel = { shot, key, c: { ...c } };
      if (!wagenLage) return w.c;
      const vorbild = STORY_PROLOG.find((s) => s.act === shot.winkelWie), p = layers[0].p;
      for (let schritt = 0; schritt < 6; schritt++) {
        const orte = this.orteAus(wagenLage()), soll = this.winkel(this.ziel(vorbild)[0], orte) * Math.PI / 180;
        const s0 = this.skala(w.c, p), s1 = this.skala(w.c, 1), [ox, oy] = orte[wagen.polarstern - 1];
        const dy = (oy - 450 - (w.c.y - 450) * p) * s0 - (592 - w.c.y) * s1;
        // dx = (ox - 800 - (x - 800) p) s0 - (440 - x) s1 soll dy / tan(soll) sein, nach x aufgelöst
        const x = (dy / Math.tan(soll) - (ox - 800 + 800 * p) * s0 + 440 * s1) / (s1 - p * s0);
        const fertig = Math.abs(x - w.c.x) < 0.01;
        w.c = { ...w.c, x };
        if (fertig) break;
      }
      return w.c;
    },
    /**
     * Was der Wagen der Bühne zur Zeit t zeigt (BUEHNENWAGEN; glBuehne zeichnet es): hell und punkt (Durchmesser in
     * CSS-Pixeln) der Sterne 1 … 6, linie: Helligkeit der Linien. Im Epilog wach wie am Himmel der Welten, sonst
     * schlafend; die Linien aus der Spur wagenLinien, im Epilog atmend, sobald sie nachglimmen.
     */
    wagenBei(t) {
      const B = BUEHNENWAGEN, N = B.nachglimmen, H = HIMMELSWAGEN;
      const wach = this.folge === STORY_EPILOG, v = wagenLinien.wert(t), von = H.linie.hell[0];
      const ruhig = wach ? THREE.MathUtils.clamp((von - v) / Math.max(1e-6, von - N.glimmen), 0, 1) : 0;
      return { hell: wach ? H.wach.hell[0] : B.schlaf.hell,
        punkt: wach ? H.wach.punkt[0] : B.schlaf.punkt,
        linie: v * (1 + N.tiefe * ruhig * Math.sin(2 * Math.PI * t / N.periode)) };
    },
    /** Pixel je Mass der Szene in der Ebene p bei der Kamera c (Hochformat: weiter weg; wie preserveAspectRatio slice). */
    skala(c, p) {
      const W = innerWidth, H = innerHeight, fit = Math.min(1, 900 * W / H / 820);
      return (1 + (c.z - 1) * p) * fit * Math.max(W / 1600, H / 900);
    },
    /** Ziel einer Einstellung (im Hochformat camP; mit winkelWie gerechnet, winkelKamera) und Dauer ihrer Fahrt (s). */
    ziel(shot) {
      const seconds = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : shot.move;
      const c = (this.portrait() && shot.camP) || shot.cam;
      return [shot.winkelWie ? this.winkelKamera(shot, c) : c, seconds];
    },
    /**
     * Die ganze Folge (Prolog oder Epilog) auf einer Uhr (folgeUhr, eine Animation ohne Ziel auf der Zeitachse des
     * Dokuments, mit dem Tempo der Bühne): vor jeder Fahrt ein Halt (HALTEN lang, die Kamera steht), dann die Fahrt
     * (storyEase, Zoom geometrisch); die Kamera rechnet glBuehne je Bild aus der Uhr (kameraBei). moveTo springt an den
     * Beginn der nächsten Fahrt (currentTime). zeiten[i]: Beginn der Fahrt zur Einstellung i (ms auf der Uhr),
     * kameras[i]: ihr Ziel.
     */
    folgeAnlegen() {
      this.folgeUhr?.cancel();
      const shots = this.folge, hoch = this.portrait();
      let c = { ...((hoch && shots[0].fromP) || shots[0].from || shots[0].cam) };
      const stuecke = [], zeiten = [], kameras = [];
      let t = HALTEN;
      for (const shot of shots) {
        const [to, seconds] = this.ziel(shot), d = seconds * 1000;
        stuecke.push({ from: c, to, t, d });
        zeiten.push(t);
        kameras.push(to);
        t += d + HALTEN;
        c = to;
      }
      this.folgeZeit = { start: { ...stuecke[0].from }, zeiten, kameras, stuecke, ende: t, key: this.folgeKey() };
      this.abschnitte = layers.map(({ p }) => this.abschnitteFuer(p, stuecke));
      this.folgeUhr = new Animation(new KeyframeEffect(null, null, { duration: t, fill: 'both' }), document.timeline);
      this.folgeUhr.play();
      this.folgeUhr.updatePlaybackRate(this.speed);
      this.wagenLegen(); // je Bildschirm (wie das Finale ihn am Ende zeigt)
      gl.neuePlan();
    },
    /**
     * Der Halt ist unbegrenzt: Die Folge hält je Ruhepunkt HALTEN lang; steht die Bühne länger (Tab über Nacht), springt
     * ihre Uhr alle HALTEN / 3 zurück an den Anfang des Halts ab (ms auf der Uhr).
     */
    haltWachen(ab) {
      clearTimeout(this.haltZeit);
      this.haltZeit = setTimeout(() => {
        if (this.moving) return;
        if (this.folgeUhr && this.folgeUhr.currentTime > ab) this.folgeUhr.currentTime = ab;
        this.haltWachen(ab);
      }, HALTEN / 3);
    },
    /**
     * Abschnitte der Folge für die Ebene p (Fahrten [von, bis]): Eine Textur der Ebene (glBuehne) hält die grösste
     * Skalierung ihrer Fahrten, und so ist sie auch im Ruhepunkt davor so fein gerastert (Speicher der Grafik: eine
     * Textur für die ganze Folge hielte jede nahe Ebene im ganzen Prolog in Zoom 2,2, Review Ticket 16).
     * Ein Abschnitt wächst, solange an keinem seiner Ruhepunkte mehr als ABSCHNITT_MARGE × die Skalierung gerastert wird,
     * die dort ohnehin nötig ist (Ruhepunkt oder nächste Fahrt). Ferne Ebenen bleiben so in einem Abschnitt; die nahen
     * wechseln nur an Ruhepunkten mit grossem Zoomwechsel (Prolog: nach Fahrt 1, 3 und 4, nicht in der Noa-Szene 2).
     */
    abschnitteFuer(p, stuecke) {
      const s = (c) => this.skala(c, p), noetig = stuecke.map(({ from, to }) => Math.max(s(from), s(to)));
      // Ruhepunkt k (nach Fahrt k; −1: Anfang): was dort ohnehin gerastert ist, mal Marge
      const erlaubt = (k) => ABSCHNITT_MARGE * Math.max(s(k < 0 ? stuecke[0].from : stuecke[k].to), noetig[k + 1] ?? 0);
      const abschnitte = [];
      for (let a = 0; a < stuecke.length;) {
        let b = a, max = noetig[a];
        while (b + 1 < stuecke.length) {
          const m = Math.max(max, noetig[b + 1]);
          let passt = true;
          for (let k = a - 1; k <= b + 1; k++) if (m > erlaubt(k)) passt = false;
          if (!passt) break;
          b++;
          max = m;
        }
        abschnitte.push([a, b]);
        a = b + 1;
      }
      return abschnitte;
    },
    /** Kennung der Folge (Bildschirm, Hochformat, reduzierte Bewegung) */
    folgeKey() {
      return JSON.stringify([innerWidth, innerHeight, matchMedia('(prefers-reduced-motion: reduce)').matches]);
    },
    /** Die Uhr der Folge steht am Anfang (im Halt vor der ersten Fahrt); neu angelegt nur, wenn nötig. */
    folgeStart(folge) {
      if (folge) this.folge = folge;
      if (!this.folge) return;
      if (folge && folge !== this.folgeFuer || this.folgeZeit?.key !== this.folgeKey() || !this.folgeUhr) {
        this.folgeFuer = this.folge;
        this.folgeAnlegen();
      }
      this.folgeUhr.currentTime = 0;
      this.folgeUhr.play();
      this.haltWachen(0);
    },
    /** ms nach dem Halt, bis die Pause ruhig ist (story.stillBild; RUHE_NACH_HALT) */
    ruheNachHalt: RUHE_NACH_HALT,
    /** Bildschirm gedreht oder anders gross: Folge und Kamera neu rechnen (gleiche Zeit, gleicher Weg). */
    anpassen() {
      const alt = this.folgeUhr;
      if (!alt) return;
      const zeit = alt.currentTime, lief = alt.playState === 'running';
      this.folgeAnlegen();
      // die Kamera steht im Ziel der letzten fertigen Fahrt (in einer Fahrt: in dem davor)
      const { kameras, start } = this.folgeZeit, i = this.moving ? this.fahrtIndex - 1 : this.fahrtIndex;
      this.cam = { ...(i >= 0 ? kameras[i] : start) };
      this.folgeUhr.currentTime = zeit;
      if (!lief) this.folgeUhr.pause();
    },
    /** Auf den Anfang der Einstellung shot stellen; folge: die Einstellungen, die kommen (Prolog oder Epilog). */
    reset(shot, folge = null) {
      this.tweens = [];
      this.speed = 1;
      this.moving = false;
      this.fahrtIndex = -1;
      this.laufend?.uhr.cancel();
      this.laufend = null;
      this.arm = 75;
      this.beamLen = this.beamPower = this.starBoost = 0;
      armSpur.zurueck(75);
      for (const s of [kraft, laenge, stern, wagenLinien]) s.zurueck(0);
      this.worms = 'idle';
      this.cam = { ...((this.portrait() && shot.fromP) || shot.from || shot.cam) };
      this.folgeStart(folge);
      if (this.folge === STORY_EPILOG) { // die Linien des Wagens kommen hell aus dem Finale und glimmen nach
        const N = BUEHNENWAGEN.nachglimmen, von = HIMMELSWAGEN.linie.hell[0], t0 = this.time + N.halten;
        wagenLinien.zurueck(von);
        wagenLinien.dazu(t0, N.abklingen, (x, u) => von + (N.glimmen - von) * smooth01(u / N.abklingen));
      }
      this.say('');
      this.kicker('');
      q('.sub').classList.remove('angebot', 'sofort');
      this.hint(false);
      this.actions([]);
    },
    /**
     * Unsichtbar vorwärmen für die erste Einstellung shot der folge: die Folge anlegen und alles zeichnen, dazu die
     * Klasse prewarm (fast durchsichtig, aber gezeichnet). playScene nimmt sie weg, ruhen ebenso.
     */
    vorwaermen(shot, folge = null) {
      this.reset(shot, folge);
      el.classList.add('prewarm');
    },
    /** Ausgeblendet: keine Schleife (nichts kostet mehr). */
    ruhen() {
      el.classList.remove('prewarm');
      if (this.running) return;
      gl.stop();
      clearTimeout(this.haltZeit);
      // die Folge weg (ausser in einer Fahrt: die läuft zu Ende), die Texturen frei; die nächste Folge legt reset wieder an
      if (!this.moving && this.folgeUhr) {
        this.folgeUhr.cancel();
        this.folgeUhr = null;
        this.folgeFuer = null;
        this.laufend?.uhr.cancel();
        this.laufend = null;
        gl.freigeben(); // ausgeblendet: Texturen frei, die nächste Folge plant neu (folgeAnlegen)
      }
    },
    /** Einblenden und die Szene laufen lassen. */
    show() {
      el.classList.remove('lit');
      if (!this.running) {
        this.running = true;
        this.folgeUhr?.play();
        this.time = this.time; // die Tweens holen die Zeit des Ruhens nicht nach (letzte)
        this.wecken();
      }
      gl.start();
      void el.offsetWidth;
      el.classList.add('lit');
    },
    /**
     * Für Vergleichsbilder (tests/buehne-messung.mjs): Die Bühne steht in der Zeit t (s), auch Funkeln und Flackern, und
     * zeigt dieses eine Bild; auftauen lässt sie von dort weiterlaufen.
     */
    einfrieren(t) {
      this.running = false;
      this.time = this.gefroren = t;
      this.folgeUhr?.pause();
      gl.einfrieren(performance.now());
      gl.zeichnen();
    },
    auftauen() {
      gl.einfrieren(null);
      this.time = this.gefroren;
      this.running = true;
      this.folgeUhr?.play();
      gl.start();
      this.wecken();
    },
    /** Ausblenden (CSS 1,6 s), danach anhalten (ausser sie zeigt sich inzwischen wieder: «Zum Menü» und gleich neu). */
    async hide() {
      el.classList.remove('lit');
      await storySleep(1600);
      if (!el.classList.contains('lit')) { this.running = false; this.ruhen(); }
    },
    tween(seconds, fn, ease = storyEase, delay = 0) {
      const p = new Promise((resolve) => this.tweens.push({ t: -delay, s: Math.max(seconds, 1e-6), fn, ease, resolve }));
      this.wecken();
      return p;
    },
    /**
     * Kamerafahrt zur Einstellung shot (der Folge; im Hochformat camP): Die Uhr der Folge springt an den Beginn der Fahrt
     * und läuft mit speed. Wann sie fertig ist, sagt eine Animation ohne Ziel (uhr, mit Tempo). Danach hält die Folge das
     * Ziel (Halt).
     */
    moveTo(shot) {
      if (this.speed < 10) this.speed = 1; // nach dem Beschleunigen wieder normal (ausser beim Überspringen)
      clearTimeout(this.haltZeit);
      const i = this.folge?.indexOf(shot) ?? -1;
      if (i < 0) throw new Error('moveTo: Einstellung nicht in der Folge');
      if (this.folgeZeit?.key !== this.folgeKey()) this.anpassen();
      const { zeiten } = this.folgeZeit, [, seconds] = this.ziel(shot);
      const f = { uhr: new Animation(new KeyframeEffect(null, null, { duration: seconds * 1000 }), document.timeline) };
      this.moving = true;
      this.fahrtIndex = i;
      this.movedAt = this.time;
      const a = this.folgeUhr;
      a.currentTime = zeiten[i];
      a.play();
      a.updatePlaybackRate(this.speed);
      f.uhr.play();
      f.uhr.updatePlaybackRate(this.speed);
      this.laufend?.uhr.cancel();
      this.laufend = f;
      return new Promise((resolve) => f.uhr.finished.then(() => {
        if (this.laufend !== f) return; // abgebrochen (reset): wie früher ein Tween, der nie fertig wird
        this.cam = { ...this.folgeZeit.kameras[i] }; // (nach einer Drehung in der Fahrt die neue)
        this.moving = false;
        if (!this.running) { this.ruhen(); resolve(); return; } // in der Fahrt ausgeblendet: jetzt ganz ruhen (Folge weg)
        if (this.speed < 10) this.speed = 1; // sonst liefen Rauch, Glühwürmchen und Schal beim Warten weiter im Zeitraffer
        this.haltWachen(zeiten[i] + seconds * 1000); // die Folge hält das Ziel weiter (Halt)
        resolve();
      }, () => {}));
    },
    /**
     * Im Ruhepunkt vor der Einstellung mit act name vorbereiten: Vor answer und lamp hat der Strahl schon seine Länge,
     * noch aus (Kraft 0; act und reset setzen die Kraft über die Spur). Seine Shader übersetzt glBuehne beim Anlegen.
     */
    vorbereiten(name) {
      if ((name === 'answer' || name === 'lamp') && kraft.wert(this.time) === 0) {
        const l = name === 'lamp' ? 0.3 : 0.55;
        this.beamLen = l;
        laenge.zurueck(l);
      }
    },
    /** Was in einer Einstellung geschieht. */
    act(name) {
      // was sich bewegt, rechnet der Tween (Stand für die Logik) und zeigt die Spur (je Bild gezeichnet, glBuehne)
      const t = this.time, eben = (t0, d, ease) => (x) => ease(Math.min(1, Math.max(0, (x - t0) / d)));
      const hoch = erhoben(name);
      if (name === 'lamp') { // Arm hoch, Klick, der Strahl wächst zum Himmel
        this.tween(1.1, (k) => { this.arm = 75 + (hoch - 75) * k; }, storyEase, 0.4).then(() => {
          if (this.speed >= 10) { kraft.zurueck(0); laenge.zurueck(0); return; } // übersprungen: kein Klick über dem Ausblenden
          audio.rotate();
          this.beamPower = 1;
          this.tween(1.8, (k) => { this.beamLen = 0.3 * k; }, (k) => 1 - (1 - k) ** 3); // nah: nur ein Stück, sonst reicht er bis zum Stern
        });
        const e = eben(t + 0.4, 1.1, storyEase);
        armSpur.dazu(t + 0.4, 1.1, (x) => 75 + (hoch - 75) * e(x));
        this.klickAt = t + 1.5;
        kraft.dazu(t + 1.5, 0, () => 1);
        const w = eben(t + 1.5, 1.8, (k) => 1 - (1 - k) ** 3);
        laenge.dazu(t + 1.5, 1.8, (x) => 0.3 * w(x));
      } else if (name === 'reach') { // beim Blick nach oben streckt sich der Strahl und verblasst vor den Sternen
        const from = this.beamLen;
        this.tween(3.5, (k) => { this.beamLen = from + (1 - from) * k; }, storyEase, 0.3);
        const von = laenge.wert(t), e = eben(t + 0.3, 3.5, storyEase);
        laenge.dazu(t + 0.3, 3.5, (x) => von + (1 - von) * e(x));
        // … und die Linien des Wagens zeichnen sich einmal für einen Atemzug ab (BUEHNENWAGEN.andeutung)
        const A = BUEHNENWAGEN.andeutung;
        wagenLinien.dazu(t + A.ab, A.auf + A.aus, (x, u) => A.hell * (u < A.auf ? smooth01(u / A.auf)
          : 1 - smooth01((u - A.auf) / A.aus)));
      } else if (name === 'gather') { // Glühwürmchen fliegen zur Lampe und umkreisen sie
        this.worms = 'gather';
        this.gatherAt = this.time + 0.6;
        for (let i = 0; i < 5; i++) audio.hit(2, 0.9 + i * 0.32, { octave: 2, gain: 0.018 });
      } else if (name === 'carry') { // … und tragen das Licht in den Wald, die Lampe wird schwächer
        this.worms = 'carry';
        this.carryAt = this.time + 0.3;
        this.tween(3.2, (k) => { this.beamPower = 1 - 0.75 * k; }, storyEase, 0.5);
        const e = eben(t + 0.5, 3.2, storyEase);
        kraft.dazu(t + 0.5, 3.2, (x) => 1 - 0.75 * e(x));
      } else if (name === 'blink') { // Epilog: der Polarstern blinkt dreimal
        for (let i = 0; i < 3; i++) {
          this.tween(0.9, (k) => { this.starBoost = Math.sin(Math.PI * k); }, storyLinear, 1.4 + i * 1.1);
          audio.hit(7, 1.6 + i * 1.1, { octave: 2, gain: 0.05 });
          const e = eben(t + 1.4 + i * 1.1, 0.9, storyLinear);
          stern.dazu(t + 1.4 + i * 1.1, 0.9, (x) => Math.sin(Math.PI * e(x)));
        }
      } else if (name === 'answer') { // Noa hebt die Lampe und blinkt dreimal zurück
        this.beamLen = 0.55;
        laenge.zurueck(0.55);
        this.tween(1.0, (k) => { this.arm = 75 + (hoch - 75) * k; }, storyEase, 0.3);
        const e = eben(t + 0.3, 1.0, storyEase);
        armSpur.dazu(t + 0.3, 1.0, (x) => 75 + (hoch - 75) * e(x));
        for (let i = 0; i < 3; i++) {
          this.tween(0.8, (k) => { this.beamPower = Math.sin(Math.PI * k); }, storyLinear, 1.6 + i * 1.0);
          audio.hit(7, 1.8 + i * 1.0, { gain: 0.03 });
          const b = eben(t + 1.6 + i, 0.8, storyLinear);
          kraft.dazu(t + 1.6 + i, 0.8, (x) => Math.sin(Math.PI * b(x)));
        }
      }
    },
    /**
     * Untertitel: der alte blendet aus, der neue danach ein (CSS .line.on). umbau: ändert, was um den Satz steht
     * (Angebot: «Im Dorf» und die Knöpfe; Epilog: Platz für «Zum Menü»), und läuft erst, wenn der alte Satz ganz
     * ausgeblendet ist; dann kommt der neue mit allem gleich (sofort). So steht jeder Satz von Anfang an dort, wo er
     * bleibt, und keiner rückt, solange man ihn sieht (Abnahme Ticket 12: Die Bühne ist unten bündig, Knöpfe darunter
     * schoben den Satz hinauf). Zurück dann: erfüllt nach dem Umbau.
     */
    say(text, { umbau = null } = {}) {
      this.umbauLos?.(false);
      const [a, b] = lines, cur = a.classList.contains('on') ? a : b, next = cur === a ? b : a;
      const sichtbar = cur.classList.contains('on') && cur.textContent;
      cur.classList.remove('on');
      if (text && next.textContent !== text) next.textContent = text; // schon gesetzt und gerastert (vorSagen)
      if (!umbau) { if (text) next.classList.add('on'); return; }
      return new Promise((fertig) => {
        // ja: umbauen und den Satz zeigen; nein (reset oder ein neuer Satz davor): nichts mehr
        const los = this.umbauLos = (ja = true) => {
          if (this.umbauLos !== los) return;
          clearTimeout(this.umbauZeit);
          this.umbauLos = null;
          if (ja) {
            umbau();
            q('.sub').classList.add('sofort');
            if (text) next.classList.add('on');
          }
          fertig();
        };
        if (!sichtbar) { los(); return; }
        // erst am Ende seines Ausblendens (Review Ticket 12): Nach einer festen Zeit ab hier rückte er noch, wenn das
        // nächste Bild spät kam (Rechner beschäftigt; 200–400 ms später schob der Umbau den halb sichtbaren Satz
        // 34–42 px). Rückfall nach der vierfachen Zeit (im verborgenen Tab ruhen die Transitionen)
        void getComputedStyle(cur).opacity; // die Transition jetzt anlegen
        const aus = cur.getAnimations?.().filter((an) => an.transitionProperty === 'opacity') ?? [];
        Promise.all(aus.map((an) => an.finished)).then(() => los(), () => los());
        this.umbauZeit = setTimeout(los, 4 * ZEILE_AUS_MS);
      });
    },
    /**
     * Den nächsten Satz schon im Ruhepunkt in die verborgene Zeile setzen: Chrome rastert ihn dann jetzt und nicht beim
     * Tippen, wo er mit dem Beginn der Fahrt ein bis zwei Bilder kostete (Ticket 20). say nimmt ihn so, wie er steht.
     */
    vorSagen(text) {
      const next = lines.find((l) => !l.classList.contains('on'));
      if (text && next && next.textContent !== text) next.textContent = text;
    },
    hint(on) { q('.hint').classList.toggle('on', on); },
    /** Zeile über dem Untertitel (Angebot nach dem Prolog: «Im Dorf»); leer: blendet aus. */
    kicker(text) {
      const k = q('.sub .kicker');
      if (text) { k.textContent = text; q('.sub').classList.add('angebot'); } // Gestalt des Angebots (CSS), bis reset
      k.classList.toggle('on', !!text);
    },
    /** Knöpfe unter dem Untertitel ([Beschriftung, Aktion]); angebot: blenden mit dem Satz ein (CSS). */
    actions(list, { angebot = false } = {}) {
      const box = q('.actions');
      box.classList.toggle('angebot', angebot);
      box.replaceChildren();
      if (!list.length) { box.classList.remove('platz'); box.style.minHeight = ''; }
      for (const [label, fn] of list) {
        const b = document.createElement('button');
        b.textContent = label;
        b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
        box.append(b);
      }
    },
    /**
     * Platz für die Knöpfe list schon jetzt, ohne sie (Epilog: «Zum Menü» kommt erst nach der Fahrt, der letzte Satz
     * steht aber schon dort, wo er dann bleibt; Abnahme Ticket 12): so hoch wie mit ihnen, bis actions sie bringt.
     */
    platzFuer(list) {
      const box = q('.actions');
      this.actions(list);
      box.style.minHeight = `${box.offsetHeight}px`;
      box.classList.add('platz');
      box.replaceChildren();
    },

    /**
     * Die JS-Schleife der Tweens anstossen, solange die Bühne läuft. Wartet sie auf das nächste Ende eines Tweens
     * (tweenZeit), läuft sie gleich weiter (ein neuer Tween endet vielleicht früher).
     */
    wecken() {
      if (!this.running) return;
      if (this.tweenZeit) { clearTimeout(this.tweenZeit); this.tweenZeit = 0; this.raf = requestAnimationFrame((t) => this.frame(t)); return; }
      if (this.raf) return;
      this.letzte = this.time;
      this.raf = requestAnimationFrame((t) => this.frame(t));
    },
    /**
     * Tweens rechnen nur den Stand für die Logik (zu sehen sind die Spuren): Statt jedes Bild (rAF hielt den Hauptthread
     * in den Fahrten 3, 4 und 6 jedes Bild wach, Ticket 18) weckt ein Zeitgeber zum nächsten Beginn oder Ende eines Tweens.
     */
    tweenWecker() {
      clearTimeout(this.tweenZeit);
      const naechst = Math.min(...this.tweens.map((tw) => (tw.t < 0 ? -tw.t : tw.s - tw.t)));
      this.tweenZeit = setTimeout(() => { this.tweenZeit = 0; this.frame(performance.now()); },
        Math.max(1, naechst / this.speed * 1000 + 1));
    },
    frame(now) {
      this.raf = 0;
      if (!this.running) return;
      if (now < this.faellig - 2) { this.raf = requestAnimationFrame((t) => this.frame(t)); return; } // höchstens 60 Hz
      // nicht weiter als ein Bild voraus: Sonst liefe die Frist bei Bildschirmen knapp über 60 Hz davon und liesse
      // alle paar Sekunden ein Bild aus
      this.faellig = Math.min(Math.max(this.faellig + 1000 / 60, now), now + 1000 / 60 + 1);
      const t = this.time, dt = Math.max(0, t - this.letzte);
      this.letzte = t;
      for (const tw of this.tweens.slice()) {
        tw.t += dt;
        if (tw.t < 0) continue;
        const k = Math.min(1, tw.t / tw.s);
        tw.fn(tw.ease(k));
        if (k >= 1) { this.tweens.splice(this.tweens.indexOf(tw), 1); tw.resolve(); }
      }
      if (this.tweens.length) this.tweenWecker();
    },
    /**
     * Wo ein Glühwürmchen zur Zeit t ist (x, y, Grösse s; tx, ty: Spitze der Lampe), samt Schwingen: zur Lampe (gather,
     * Anteil g), von dort in den Wald (carry, k), unterwegs im Bogen nach oben.
     */
    wurmOrt(w, t, tx, ty) {
      const g = smooth01((t - this.gatherAt - w.delay) / FLUG_ZU);
      const k = this.worms === 'carry' ? smooth01((t - this.carryAt - w.delay * 0.7) / FLUG_WALD) : 0;
      let x = w.hx + Math.sin(t * w.a + w.ph) * 16, y = w.hy + Math.cos(t * w.b + w.ph) * 9;
      const ang = t * w.spin + w.ph;
      x += (tx + Math.cos(ang) * w.ox - x) * g;
      y += (ty + Math.sin(ang) * w.oy - y) * g - Math.sin(Math.PI * g) * 50;
      if (this.worms === 'carry') {
        x += (w.dx + Math.sin(t * w.a) * 8 - x) * k;
        y += (w.dy + Math.cos(t * w.b) * 6 - y) * k - Math.sin(Math.PI * k) * 70;
      }
      return [x, y, this.worms === 'idle' ? 1 : 1 + 0.6 * g];
    },
  };
  addEventListener('resize', () => scene.anpassen());
  return scene;
}

// wie der Rückflug der Kamera; die flachere Kurve aus leistung-11 ist zurückgenommen (Ursache der Ruckler war die
// DOM-Bühne, Nutzer: Tempo wieder wie am Anfang, Ticket 19)
const storyEase = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (2 - 2 * k) ** 3 / 2);
const storyLinear = (k) => k;
/** Zügig los, dann immer langsamer (Strahl des Polarsterns läuft ins Brett aus, story.auslaufen). */
const storyAuslauf = (k) => 1 - (1 - k) ** 3;
/**
 * Weg mit gleichmässig steigender Geschwindigkeit über den Anteil a der Zeit, dann gleich schnell, zuletzt über den
 * Anteil b gleichmässig abbremsend (b 0: ohne Abbremsen).
 */
const storyRampe = (a, b = 0) => (k) => {
  const ganz = 1 - a / 2 - b / 2;
  if (k < a) return k * k / (2 * a) / ganz;
  if (k <= 1 - b) return (k - a / 2) / ganz;
  return 1 - (1 - k) ** 2 / (2 * b) / ganz;
};
/** Fall des Lichts aufs Brett im Bild (story.fall; Abnahme Ticket 11, 12): kurzer Anlauf (STORY_FLUG.anlauf), dann
 * gleichmässig. */
const storyFall = (k) => storyRampe(STORY_FLUG.anlauf)(k);
const storySleep = (ms) => new Promise((r) => setTimeout(r, ms)); // für Übergänge im DOM (CSS läuft in echter Zeit)

/**
 * Das Menü der Geschichte (createMenu); den Stand liefert story.menuStand, die Aktionen nimmt story.pick. Ein
 * geschaffter Grad öffnet seine Übersicht (Entscheid 19). Die Form des Kleinen Wagens auf der Sternkarte: wagen.
 */
const menu = createMenu({
  root: $('menue'),
  wagen,
  uebersicht: true,
  onAction: (a) => story.pick(a),
});
/** Die Übersicht eines Grads (createUebersicht): Daten aus story.overviewData; Wahl und Schliessen nimmt story. */
const uebersicht = createUebersicht({
  root: $('uebersicht'),
  icons: STORY_ICONS,
  wagen,
  onPlay: (wahl) => story.playFromOverview(wahl),
  onClose: () => story.closeOverview(),
});
/**
 * Menü und Bühne einmal unsichtbar zeichnen, noch vor der Enthüllung des Startbildschirms (ui.init; die Seite lädt, nichts
 * Sichtbares animiert): Beim ersten Öffnen stand sonst ein Bild bis gut 400 ms (Menü mit den Lichtwegen) bzw. 250 ms
 * (Bühne des Prologs, Review Ticket 05). Nach der Enthüllung (introCalm) wäre zu spät: «Klicken zum Starten» kommt schon
 * nach 2,9 s, und ein Klick vor dem Vorwärmen brachte das Menü kalt (gemessen 650 ms). Die Bühne bleibt für neue Spieler
 * bis zum Prolog gehalten (story.vorwaermen). Ihr Promise erfüllt sich erst nach drei Bildern, bei verborgenem Tab erst
 * nach der Rückkehr: höchstens 1 s warten. Mit ?nointro steht statt des Startbildschirms gleich das Menü.
 */
async function vorwaermenVorStart() {
  if (flow.state !== 'intro' && !(RUHE_OHNE_START && story.choosing)) return;
  if (!menu.offen) {
    menu.vorwaermen(story.menuStand());
    await nextFrame(); await nextFrame(); await nextFrame();
  }
  // wer Prolog und Angebot schon gesehen hat, bekommt keinen Prolog mehr (ausser in einem neuen Grad): keine Bühne;
  // gehalten nur hinter dem Startbildschirm (mit ?nointro und zeige() käme sonst nie ein Prolog, der sie freigibt)
  const gesehen = story.stand?.gesehen ?? [];
  if (gesehen.includes('prolog') && gesehen.includes('angebot')) return;
  await Promise.race([story.vorwaermen(flow.state === 'intro' && !gesehen.includes('prolog')), storySleep(1000)]);
}
// Die Übersicht (~100 ms beim ersten Öffnen) wird erst aus Menü oder Spiel gebraucht: nach der Enthüllung an der
// nächsten ruhigen Stelle, die nichts Sichtbares zeigt (Startbildschirm, wartende Bühne) oder ohnehin lädt (ruhe.laden,
// Überblendung nach «Weiter»); im sichtbaren Spiel kostete es selbst ein Bild
introCalm.then(async () => {
  for (;;) {
    await ruhe.warte();
    if (uebersicht.offen) return;
    if (flow.state === 'intro' || story.stillBild || ruhe.laden || RUHE_OHNE_START && story.choosing) break;
    await storySleep(500);
  }
  uebersicht.vorwaermen(story.overviewData(story.grade ?? 'leicht'));
});

/**
 * Ladezeichen: Wartet die Geschichte auf den Himmel einer Welt (story.skyOf: Einstieg nach «Üben», Fortsetzen, erster
 * Himmel nach dem Start; story.offer: «Gleich los», solange der Wald fehlt), zeichnet sich nach 0,4 s der Kleine Wagen:
 * Stern für Stern vom Polarstern bis zur Schale, dann blenden alle aus, und er beginnt von vorn. Gewählt vom Nutzer aus
 * dem Prototyp (Branch prototyp/ladeindikator, .scratch/ladeindikator/). Die Wartestellen melden etwa alle 0,1 s mit
 * warte(true), ob sie noch warten, am Ende warte(false). Unter Menü und Übersicht nicht (dann warte(false)). Versteckt
 * laufen keine Animationen.
 */
const ladeZeichen = (() => {
  const el = document.getElementById('lade');
  // Sterne des Kleinen Wagens (Form aus wagen.form, px; hier Polarstern zuerst, umgekehrt zum Erwachen) und Linien
  // [von, nach, Beginn in s] aus wagen.linien: Der Wagen zeichnet sich vom Polarstern die Deichsel hinab bis in die
  // Schale. Jede Linie zwischen zwei Nachbarn wächst in 0,25 s zum nächsten Stern, sobald er aufleuchtet; die übrige
  // (4 → 1 des Wagens) schliesst danach die Schale, von ihrem letzten Stern zurück
  const S = 1.2, RAND = 15, TAKT = 0.32, AN = 0.25, HALTEN = 0.8, AUS = 0.7;
  const P = wagen.form.slice().reverse(), stelle = (k) => P.length - k; // Stern k des Wagens an Stelle 7 − k
  const K = wagen.linien.map(([a, b]) => {
    const i = Math.min(stelle(a), stelle(b)), j = Math.max(stelle(a), stelle(b));
    return j - i === 1 ? [i, j, j * TAKT] : [j, i, j * TAKT + AN];
  }).sort((x, y) => x[2] - y[2]);
  const ende = P.length * TAKT + HALTEN, zyklus = ende + AUS, pz = (s) => `${(s / zyklus * 100).toFixed(2)}%`;
  const xs = P.map(([x]) => x * S), ys = P.map(([, y]) => y * S), x0 = Math.min(...xs) - RAND, y0 = Math.min(...ys) - RAND;
  el.style.width = `${Math.max(...xs) - x0 + RAND}px`;
  el.style.height = `${Math.max(...ys) - y0 + RAND}px`;
  const ort = (i) => [xs[i] - x0, ys[i] - y0];
  let css = '';
  for (const [i, j, t] of K) {
    const [ax, ay] = ort(i), [bx, by] = ort(j), k = document.createElement('div');
    k.className = 'kante';
    k.style.cssText = `left:${ax}px;top:${ay}px;width:${Math.hypot(bx - ax, by - ay)}px;transform:rotate(${Math.atan2(by - ay, bx - ax)}rad)`;
    k.innerHTML = `<i></i><i style="animation:lade-k${i}${j} ${zyklus}s linear infinite"></i>`;
    el.append(k);
    css += `@keyframes lade-k${i}${j}{0%,${pz(t)}{transform:scaleX(0);opacity:0}${pz(t + AN)}{transform:scaleX(1);opacity:1}`
      + `${pz(ende)}{transform:scaleX(1);opacity:1}100%{transform:scaleX(1);opacity:0}}`;
  }
  P.forEach((_, i) => {
    const [x, y] = ort(i), d = i === 0 ? 30 : 18, s = document.createElement('div');
    s.className = 'stern';
    s.style.cssText = `left:${x}px;top:${y}px;width:${d}px;height:${d}px;animation:lade-s${i} ${zyklus}s linear infinite`;
    el.append(s);
    css += `@keyframes lade-s${i}{0%,${pz(i * TAKT)}{opacity:0.16}${pz(i * TAKT + AN)},${pz(ende)}{opacity:1}100%{opacity:0.16}}`;
  });
  const stil = document.createElement('style');
  stil.textContent = css;
  document.head.append(stil);

  // Grösse (--gross): auf dem Handy wie oben gezeichnet, auf grossen Bildschirmen bis 2,2-mal (Nutzer: auf dem
  // Computer grösser; 1280 × 800 ergibt 2). ?wagen=<faktor>: fest, zum Ausprobieren
  const fest = Math.min(4, Math.max(0, Number(new URLSearchParams(location.search).get('wagen')) || 0));
  const groesse = () => el.style.setProperty('--gross',
    (fest || Math.min(2.2, Math.max(1, Math.min(seiteBreite(), seiteHoehe() * 1.6) / 640))).toFixed(3));
  groesse();
  window.addEventListener('resize', groesse);

  let seit = 0, an = false, stopp = 0, obenGewuenscht = false;
  const setze = (ja) => {
    if (ja === an) return;
    an = ja;
    clearTimeout(stopp);
    if (ja) { // von vorn: zuerst der Polarstern (laufen die Animationen noch vom Ausblenden, erst neu anstossen)
      el.classList.toggle('oben', obenGewuenscht);
      if (el.classList.contains('laeuft')) { el.classList.remove('laeuft'); void el.offsetWidth; }
      el.classList.add('laeuft', 'an');
    } else {
      el.classList.remove('an');
      stopp = setTimeout(() => el.classList.remove('laeuft'), 600); // nach dem Ausblenden: Animationen aus
    }
  };
  return {
    /**
     * Wartet die Stelle noch (ja)? Nach 0,4 s Warten zeigen, sonst weich ausblenden. oben: über der Bühne (oben im
     * Himmel statt in der Mitte); gilt ab dem nächsten Einblenden, ein stehender Wagen springt nicht.
     */
    warte(ja, oben = false) {
      obenGewuenscht = oben;
      if (!ja) { seit = 0; setze(false); return; }
      const jetzt = performance.now();
      if (!seit) seit = jetzt;
      setze(jetzt - seit >= 400);
    },
  };
})();

/**
 * Testhilfe ?alles (Wunsch des Nutzers vom 09.11.2026: testen, ohne durchzuspielen): setzt den Speicherstand eines
 * Grads auf «alles gelöst», bevor die Geschichte ihn liest. Alle Level seines Durchgangs und alle Übungen im Dorf sind
 * gelöst, alle Momente und das Finale gesehen, der Grad ist der zuletzt gespielte. Im Menü steht dann «Übersicht», dort
 * ist jedes Level wählbar. ?alles: Leicht; ?alles=mittel, schwer, sehr-schwer. Weitere Felder des Stands und die
 * Bestwerte bleiben. Danach verschwindet der Parameter aus der Adresse, ein Neuladen setzt nichts mehr; «Von vorn» im
 * Menü setzt den Grad zurück.
 */
(() => {
  const q = new URLSearchParams(location.search);
  if (!q.has('alles')) return;
  const grad = (q.get('alles') || 'leicht').replaceAll('-', ' ');
  if (!Object.hasOwn(STORY_LEVELS, grad)) { console.warn(`?alles: Grad ${grad} unbekannt, nichts gesetzt`); return; }
  const namen = STORY_LEVELS[grad].flat(), uebungen = LEVELS.slice(0, TUTORIAL_COUNT).map((l) => l.name);
  const alt = progress.load(grad, namen.length);
  const momente = ['prolog', 'angebot', STORY_DORF.einstieg.moment, ...STORY_CHAPTERS.map(storyChapterId)];
  progress.save(grad, { ...alt, platz: namen.length - 1, geloest: [...new Set([...uebungen, ...namen])],
    gesehen: [...new Set([...alt.gesehen, ...momente])], geschafft: true,
    dorf: { ende: 'gespielt' } });
  progress.setLast(grad);
  // die übrigen Parameter wörtlich behalten (URLSearchParams schriebe ?noadapt als ?noadapt=)
  const rest = location.search.slice(1).split('&').filter((t) => t && !/^alles(=|$)/.test(t)).join('&');
  history.replaceState(history.state, '', location.pathname + (rest ? `?${rest}` : '') + location.hash);
})();

const story = {
  el: $('story'),
  grade: null,        // gewählter Grad (Schlüssel in STORY_LEVELS), bis zur Wahl der zuletzt gespielte oder null
  stand: null,        // sein Speicherstand (progress.load), platz siehe step
  choosing: false,    // Menü oder Übersicht offen (openMenu bis choose, Übersicht bis zur Wahl oder zum Schliessen)
  paused: null,       // Menü oder Übersicht aus dem Spiel geöffnet: { grade, at } (toMenu, toOverview); im selben
                      // Grad geht es dort weiter (resume)
  overview: null,     // Übersicht offen: { grade, from: 'menu' | 'spiel' } (dorthin führt Schliessen zurück)
  replay: false,      // Wiederholen (Entscheid 16): gelöste Level ohne Einstieg, Reise und Untertitel; der Platz
                      // im Speicherstand bleibt, bis wieder ein ungelöstes Level dran ist
  outside: false,     // ein Level ausserhalb der Geschichte (Testschnittstelle zeige): ohne Stand und Kopfzeile
  steps: [],          // je Level des Durchgangs im Grad { c: Kapitel, index: Platz in LEVELS }
  step: 0,            // Level, das gerade läuft (der Platz im Speicherstand)
  inDorf: false,      // eine Übung «Im Dorf» läuft (Ticket 07), dann ist uebung das Level statt steps[step]; mit
                      // replay als Wiederholen aus der Übersicht
  uebung: 0,          // die Übung im Dorf (0 … TUTORIAL_COUNT − 1, zugleich ihr Platz in LEVELS)
  entering: null,     // ein Einstieg (enter) läuft, bis das Level zu wachsen beginnt: { skip } (Überspringen, land)
  endeWartet: false,  // «Überspringen» im Dorf, während eine Zwischenszene lief: danach (done)
  skipShown: false,   // «Überspringen» (#btn-skip) ist zu sehen (update, skippable)
  skipRuhe: 0,        // bis dann (performance.now) kein «Dorf überspringen»: gleich nach einem Einstieg
  landing: false,     // ein übersprungener Einstieg landet (land): Tippen beschleunigt nicht
  gaze: 0,            // Blick in den Himmel, 0 … 1 (updateCamera)
  gazeDir: new THREE.Vector3(0, 1, 0),
  amStern: null,      // Finale: Der Lichtpunkt steht auf diesem Stern des Wagens (1 … 7; update)
  seit: 0,            // Ende des Finales: Drehung der Kamera um ihre Hochachse (rad, updateCamera; wagenEnde)
  halt: false,        // das Licht hält über dem Untertitel der Ankunft an und wartet auf Tippen (anhalten)
  haltAuf: null,      // dabei: wo es von der Kamera aus steht (update hält es dort, auch wenn sie noch gleitet)
  gazeRun: 0,         // zählt die weichen Blickwechsel (gazeTo): ein neuer löst den laufenden ab
  holdEnter: false,   // updateFlow: nach dem Versinken auf die Geschichte warten (sunk)
  running: false,     // eine Zwischenszene läuft
  fast: 1,            // Tippen in einer Zwischenszene: schneller
  tweens: [],
  waitTap: null,
  scene: null,        // Bühne für Prolog und Epilog (createStoryScene), beim ersten Gebrauch gebaut
  _covered: false,
  /** Die Bühne deckt das Spiel zu: Es zeichnet höchstens 30 Bilder/s (frameRate.fps), sobald sie ganz eingeblendet ist gar nicht mehr (sceneLoop) */
  get covered() { return this._covered; },
  set covered(on) {
    if (on === this._covered) return;
    this._covered = on;
    sceneLoop.coverStory(on);
  },
  blend: null,        // Reise zwischen zwei Welten auf der Erde: { from, to } der Hintergründe (blendSky)
  himmel: himmelsWagen, // der Kleine Wagen am Himmel (Ticket 04 von .scratch/kleiner-wagen/; Proben lesen stand)
  skipped: false,     // Prolog übersprungen
  stillBild: false,   // die Bühne wartet auf Tippen oder steht mit dem Angebot: eine ruhige Stelle (ruhe) ab stillAb
  ladeSperre: false,  // Ruhepunkt vor einem Flug der Glühwürmchen: dort lädt nichts Grosses hinter der Bühne (ruhe)
  stillAb: 0,         // performance.now(), ab wann (nach dem gestaffelten Vorbereiten der nächsten Fahrt)
  buehneWarm: false,  // die Bühne des Prologs ist vorgewärmt und bleibt bis zum Prolog gerastert (vorwaermen)
  ersterHimmel: true, // noch keiner seit dem Start abgewartet (skyOf): Fehlt er, ist das Laden markiert (ruhe.lade)
  licht: null,        // Höhe des Lichts über dem Untertitel, gemessen (lichtHoch); null: neu messen
  lichtBei: 0,        // bei dieser Höhe des Fensters gemessen

  init() {
    // der Hintergrund der Welt, in der es im zuletzt gespielten Grad weitergeht (sonst der ersten): Er lädt schon
    // während des Startbildschirms. Mit ?sky= (Tests) bleibt der dort gewählte
    const last = progress.last();
    if (last) this.setGrade(last);
    if (!urlSky) {
      this.setSky(this.dorfLaeuft() ? STORY_DORF.sky : STORY_CHAPTERS[this.steps[this.step]?.c ?? 0].sky, false);
    }
    this.el.addEventListener('click', () => this.tap());
    this.skipBtn = $('btn-skip');
    this.skipBtn.addEventListener('click', (e) => { e.stopPropagation(); this.skip(); this.keepFocus(this.skipBtn); });
    this.buildScene();
  },
  /**
   * Grad setzen: sein Durchgang aus STORY_LEVELS, sein Stand, sein Platz (ein Wiederholen endet, ebenso eine Übung im
   * Dorf: begin setzt sie fort). Den Stand des Dorfs prüft erst dieser Schritt (progress kennt das Tutorial nicht).
   */
  setGrade(grade) {
    this.grade = grade;
    this.replay = false;
    this.inDorf = false;
    this.endeWartet = false;
    const byName = new Map(LEVELS.map((l, i) => [l.name, i]));
    this.steps = [];
    STORY_CHAPTERS.forEach((ch, c) => {
      for (const name of STORY_LEVELS[grade]?.[c] ?? []) {
        if (byName.has(name)) this.steps.push({ c, index: byName.get(name) });
        else console.warn(`Geschichte: Level ${name} fehlt`);
      }
    });
    this.stand = progress.load(grade, this.steps.length);
    this.step = this.stand.platz;
    const dorf = storyDorfStand(this.stand.dorf);
    if (dorf) this.stand.dorf = dorf;
    else delete this.stand.dorf;
    this.himmelStand();
  },
  /** Das Kapitel «Im Dorf» ist begonnen und noch nicht zu Ende (gespielt oder übersprungen). */
  dorfLaeuft() { return this.stand?.dorf?.ende === null; },
  /** Das Level, mit dem es nach dem Start wohl weitergeht (Vorwärmen): im zuletzt gespielten Grad, sonst im ersten. */
  firstIndex() {
    if (this.dorfLaeuft()) return 0; // das Dorf beginnt immer bei Übung 1
    if (this.steps.length) return this.steps[this.step].index;
    const name = Object.values(STORY_LEVELS)[0]?.[0]?.[0], i = LEVELS.findIndex(l => l.name === name);
    return i >= 0 ? i : 0;
  },
  chapter() { return STORY_CHAPTERS[this.steps[this.step].c]; },
  /** Hintergrund des Kapitels; fehlt die Skybox (z. B. skies.js nicht geladen): Milchstrasse. */
  // ?sky=…: dieser Hintergrund bleibt auch in den Levels und auf Reisen (Vergleich auf dem Handy)
  setSky(id, animate) { skyTheme.set(skyTheme.byId.has(urlSky) ? urlSky : skyTheme.byId.has(id) ? id : 'milky', animate); },
  /** Das Level, das die Geschichte gerade spielt: im Dorf die Übung, sonst das Level des Platzes (Platz in LEVELS). */
  currentIndex() { return this.inDorf ? this.uebung : this.steps[this.step]?.index; },
  /** Die Geschichte führt das Level index (sonst: ausserhalb, Testschnittstelle zeige). */
  drives(index) { return !this.outside && this.grade !== null && this.currentIndex() === index; },
  /**
   * Stand des Grads speichern; gespielt: wann zuletzt (ms seit 1970), für «Weiter» im Menü (menuStand). Der Platz
   * fällt nie zurück (Wiederholen spielt Level davor). Die Übung im Dorf nicht (Spec .scratch/tutorial-neu/, «Kein
   * Stand im Dorf»): Innerhalb der Sitzung behalten sie Menü und Übersicht (story.uebung), nach dem Neuladen beginnt
   * das Dorf bei Übung 1.
   */
  save() {
    if (this.outside || this.grade === null) return;
    this.stand.platz = Math.max(this.stand.platz, this.step);
    this.stand.gespielt = Date.now();
    progress.save(this.grade, this.stand);
  },
  /** Ein Moment, der nur beim ersten Mal kommt (prolog, Einstieg in eine Welt), ist gesehen. */
  see(moment) {
    if (this.stand.gesehen.includes(moment)) return;
    this.stand.gesehen.push(moment);
    this.save();
  },
  seen(moment) { return this.stand.gesehen.includes(moment); },
  /**
   * Ein Level des Durchgangs ist gelöst (beim Lösen, updateFlow; stats: flow.solveStats): gelöst merken und die
   * Bestwerte nachführen, auch beim Wiederholen. Zurück, was besser wurde ({ neueBestzeit, wenigerDrehungen }, für
   * «Gelöst»), ausserhalb der Geschichte null.
   */
  markSolved(index, stats) {
    if (!this.drives(index)) return null;
    const name = LEVELS[index].name, record = progress.noteBest(this.grade, name, stats);
    if (!this.stand.geloest.includes(name)) {
      this.stand.geloest.push(name);
      this.save();
    }
    return record;
  },
  /**
   * Stand des Kleinen Wagens im Grad grade (wagen.stand: wache Sterne, gezogene Linien, nächster Stern), abgeleitet aus
   * seinem Durchgang; je Grad getrennt, nach «Von vorn» alle schlafend. Neuladen, Fortsetzen, Wiederholen, Menü und
   * Übersicht zeigen denselben; nur das Erwachen selbst (Aufstieg, Reise, Finale) ändert ihn sichtbar. Proben lesen ihn
   * über die Testschnittstelle (story).
   */
  wagenStand(grade = this.grade) {
    const welten = STORY_LEVELS[grade];
    if (!welten) return wagen.stand(null, null);
    return wagen.stand(grade === this.grade && this.stand ? this.stand : progress.load(grade, welten.flat().length),
      welten);
  },
  /**
   * Der Wagen am Himmel (himmelsWagen) zeigt den Stand des Durchgangs im Grad auf dem Brett; über dem Dorf (Kapitel «Im
   * Dorf», auch im Menü, solange es läuft) wie im Prolog alle sechs schlafend, ohne Stern einer Welt; sonst ist der
   * Stern dieser Welt der des Kapitels auf dem Platz. Angeglichen bei jedem Wechsel von Grad oder Welt (setGrade,
   * begin, enter, Wiederholen über eine Weltgrenze, Epilog), also bevor man ihn sieht. Das Lösen des letzten Levels
   * einer Welt weckt ihren Stern sichtbar erst beim Aufstieg (erwache); Stern dieser Welt wird der nächste, wenn das
   * Licht auf der Reise an ihm vorbeizieht (zucke).
   */
  himmelStand() {
    const c = this.steps[this.step]?.c;
    if (this.grade === null || this.inDorf || !this.replay && this.dorfLaeuft()) himmelsWagen.zeige(null, null);
    else himmelsWagen.zeige(this.wagenStand(), c === undefined ? null : c + 1);
  },

  /* ---------- Ablauf ---------- */

  /** Nach dem Startbildschirm: das Menü über dem Himmel der Welt, in der es im zuletzt gespielten Grad weitergeht. */
  start() {
    flow.state = 'story';
    this.scene ??= this.makeScene(); // jetzt, unter dem Startbildschirm, statt erst im Finale (ein Ruck)
    this.openMenu({ sofort: true });
  },
  /**
   * Menü öffnen (Entscheide 8, 14, 17): nach dem Startbildschirm, mit «Menü» im Spiel und am Ende des Epilogs.
   * Kopfzeile, Knöpfe und «Gelöst» sind solange weg; dahinter schaut die Kamera in den Himmel, damit das Brett nicht
   * hinter der Sternkarte steht (vom Brett hebt sich der Blick weich, sofort: unter dem Startbildschirm). hervorheben:
   * direkt nach dem Epilog der nächstschwerere Grad (Entscheid 14).
   */
  openMenu({ sofort = false, hervorheben = false } = {}) {
    this.lift(sofort);
    menu.show(this.menuStand(hervorheben));
  },
  /**
   * Menü oder Übersicht öffnet: Kopfzeile, Knöpfe und «Gelöst» gehen weg, der Blick hebt sich vom Brett in den Himmel
   * (sofort: unter dem Startbildschirm). Bis zur Wahl oder zum Schliessen ist choosing gesetzt: Dann erscheinen
   * Kopfzeile und «Gelöst» nicht (ui), Tippen wirkt nicht (tap), steht der Blick im Himmel, reichen 10 Bilder/s (frameRate).
   */
  lift(sofort = false) {
    this.choosing = true;
    this.fast = 1;
    setHovered(null);
    ui.hideHud();
    ui.hideSolved();
    setShown(ui.controls, false);
    if (this.gaze < 1) {
      if (this.gaze === 0) this.aimGaze(this.steps.length ? this.chapter().up ?? STORY_UP : STORY_UP);
      if (sofort) { this.gazeRun++; this.gaze = 1; } else this.gazeTo(1, 1.8);
    }
  },
  /**
   * Stand je Grad für das Menü (createMenu): neu, begonnen (ab dem Prolog; Welt des Platzes, vor dem Bergwald das Dorf,
   * gelöste Level des Durchgangs, wache Sterne des Wagens) oder geschafft. «Weiter» (Entscheid 25) führt zum zuletzt gespielten unter den
   * begonnenen Graden: dem zuletzt gewählten, wenn er begonnen ist, sonst dem mit dem jüngsten Speichern (gespielt;
   * ohne Zeit zählt ein Stand als ältester). «Von vorn» und «geschafft» nehmen einen Grad aus dieser Wahl.
   * hervorheben: direkt nach dem Epilog der nächstschwerere, noch nicht geschaffte Grad nach dem zuletzt gewählten
   * (Entscheid 14).
   */
  menuStand(hervorheben = false) {
    const grade = {}, gespielt = {};
    for (const [g, welten] of Object.entries(STORY_LEVELS)) {
      const namen = new Set(welten.flat()), s = progress.load(g, namen.size);
      if (s.geschafft) { grade[g] = { stand: 'geschafft', wach: wagen.form.length }; continue; }
      if (!s.gesehen.length && !s.geloest.length && !s.platz) continue; // neu (auch ein unlesbarer Stand)
      let c = 0;
      for (let rest = s.platz; c < welten.length - 1 && rest >= welten[c].length; c++) rest -= welten[c].length;
      const welt = storyChapterId(STORY_CHAPTERS[c]);
      grade[g] = { stand: 'begonnen', welt: c === 0 && !s.gesehen.includes(welt) ? 'dorf' : welt,
        geloest: s.geloest.filter((n) => namen.has(n)).length, wach: wagen.stand(s, welten).wach.length };
      gespielt[g] = Number.isFinite(s.gespielt) ? s.gespielt : 0;
    }
    const last = progress.last(), order = Object.keys(STORY_LEVELS), begonnen = Object.keys(gespielt);
    const weiter = gespielt[last] !== undefined ? last
      : begonnen.reduce((a, g) => (a === null || gespielt[g] > gespielt[a] ? g : a), null);
    const nach = order.indexOf(last);
    const hervor = hervorheben && nach >= 0
      ? order.slice(nach + 1).find((g) => grade[g]?.stand !== 'geschafft') ?? false : false;
    // zuletzt: das Ziel von «Weiter»; ohne begonnenen Grad der zuletzt gewählte (Fokus im Menü)
    return { grade, zuletzt: weiter ?? last, hervorheben: hervor };
  },
  /** «Menü» im Spiel (Entscheid 17, Esc): Der Stand bleibt; der Blick hebt sich vom Brett in den Himmel. */
  toMenu() {
    if (this.choosing || this.running || this.holdEnter || !['play', 'in', 'out'].includes(flow.state)) return;
    // zurück ins selbe Level (choose): Es steht noch auf dem Brett; at: die Zeit im Menü zählt nicht
    this.paused = this.outside || this.grade === null ? null : { grade: this.grade, at: performance.now() };
    this.openMenu();
  },
  /**
   * «Übersicht» im Spiel (Knopf, Taste L) wie «Menü»: Das Level bleibt stehen (paused), der Blick hebt sich in den
   * Himmel, darüber die Übersicht des laufenden Grads mit dem laufenden Level. Nur in einem Level der Geschichte.
   */
  toOverview() {
    if (this.choosing || this.running || this.holdEnter || !['play', 'in', 'out'].includes(flow.state)) return;
    if (this.outside || this.grade === null) return;
    this.paused = { grade: this.grade, at: performance.now() };
    this.lift();
    this.openOverview(this.grade, 'spiel');
  },
  /** Übersicht des Grads grade öffnen (from: 'menu' oder 'spiel', dorthin führt Schliessen zurück). */
  openOverview(grade, from) {
    this.overview = { grade, from };
    if (from === 'menu') menu.hide(); // die Übersicht blendet darüber ein (gleiche Ebene, im Dokument danach)
    uebersicht.show(this.overviewData(grade, from === 'spiel'));
  },
  /**
   * Übersicht schliessen (Esc, «Schliessen», Klick daneben, L): zurück ins Menü (Fokus bei der Karte des Grads) bzw.
   * ins Level, das beim Öffnen lief (die Zeit in der Übersicht zählt nicht, resume). Fokus: in einem gelösten Level
   * auf «Weiter», sobald «Gelöst» wieder steht (Enter führt weiter), sonst auf «Übersicht».
   */
  closeOverview() {
    const o = this.overview;
    if (!o || !uebersicht.offen) return;
    uebersicht.hide();
    this.overview = null;
    if (o.from === 'menu') {
      menu.show(this.menuStand());
      $('menue').querySelector(`[data-menue-fokus="wahl:${CSS.escape(o.grade)}"]`)?.focus({ preventScroll: true });
      return;
    }
    this.choosing = false;
    const p = this.paused, geloest = flow.solved;
    this.paused = null;
    const zurueck = p ? this.resume(p) : Promise.resolve();
    if (!geloest) { ui.overview.focus({ preventScroll: true }); return; }
    zurueck.then(() => { if (!this.choosing && ui.solvedVisible()) ui.next.focus({ preventScroll: true }); });
  },
  /**
   * Kachel in der Übersicht gewählt (Entscheide 9 und 16). Ein gelöstes Level läuft als Wiederholen: ohne Einstieg,
   * Reise und Untertitel, der Platz im Speicherstand bleibt; aus dem Menü ändert das den zuletzt gespielten Grad nicht
   * (Entscheid 3 zu Ticket 06). Das offene Level läuft im normalen Ablauf; ist es das Level auf dem Brett, geht es dort
   * weiter wie nach Schliessen. Ein altes Brett versinkt, während die Kamera im Himmel ist (begin). Eine Übung im
   * Dorf: playDorf.
   */
  playFromOverview({ welt, level, eintrag, wiederholen }) {
    const o = this.overview, p = this.paused;
    if (!o || !uebersicht.offen) return;
    if (o.grade !== this.grade) this.setGrade(o.grade); // aus dem Menü: ein anderer Grad als der auf dem Brett
    const i = welt === 'dorf' ? (LEVELS[level]?.name === eintrag.name ? level : -1)
      : this.steps.findIndex((s) => LEVELS[s.index].name === eintrag.name);
    if (i < 0) return;
    uebersicht.hide();
    this.overview = null;
    this.choosing = false;
    this.paused = null;
    if (welt === 'dorf') { this.playDorf(i, wiederholen, p); return; }
    if (!wiederholen && p?.grade === o.grade && !this.inDorf && i === this.step && game.board
      && game.levelIndex === this.steps[i].index) {
      this.resume(p); // das offene Level steht noch auf dem Brett: dort weiter
      return;
    }
    // ein Level der Welten mitten im Kapitel «Im Dorf» (nur das erste des Bergwalds ist offen): Das Dorf ist damit
    // übersprungen, ohne seinen Schluss (Entscheid des Umsetzers, Ticket 07)
    if (this.dorfLaeuft()) this.stand.dorf.ende = 'uebersprungen';
    this.inDorf = false;
    this.outside = false;
    this.step = i;
    this.replay = wiederholen;
    if (!wiederholen) this.save();
    this.begin();
  },
  /**
   * Übung i «Im Dorf» aus der Übersicht (Entscheid 4 zu Ticket 07): Läuft das Kapitel noch, geht es an der offenen
   * Übung weiter wie sonst (steht sie auf dem Brett, wie Schliessen); jede andere läuft als Wiederholen, ohne Einstieg,
   * «Weiter» zur nächsten, nach der letzten zurück in die Übersicht. Nach «Überspringen» sind alle frei (auch die
   * ungelösten laufen so). p: Spiel pausiert beim Öffnen.
   */
  playDorf(i, wiederholen, p) {
    const laeuft = this.dorfLaeuft();
    if (!wiederholen && laeuft && p?.grade === this.grade && this.inDorf && !this.replay && this.uebung === i
      && game.board && game.levelIndex === i) {
      this.resume(p);
      return;
    }
    this.outside = false;
    this.inDorf = true;
    this.uebung = i;
    this.replay = wiederholen || !laeuft;
    if (!this.replay) this.save();
    this.begin();
  },
  /**
   * Daten der Übersicht (createUebersicht) für den Grad grade: die sechs Welten mit ihren Leveln (Titel, gelöst,
   * Bestwerte nur bei gelösten: nach «Von vorn» bleiben sie gespeichert, erscheinen aber erst wieder mit dem Lösen),
   * geschafft (Finale gesehen), aus dem Spiel das laufende Level. dorf: die Übungen «Im Dorf», sobald das Kapitel
   * gespielt ist (Ticket 07: stand.dorf, nach «Überspringen» alle frei).
   */
  overviewData(grade, imSpiel = false) {
    const s = grade === this.grade && this.stand ? this.stand
      : progress.load(grade, (STORY_LEVELS[grade] ?? []).flat().length);
    const best = progress.best(grade), titel = new Map(LEVELS.map((l) => [l.name, l.titel]));
    const level = (name) => {
      const geloest = s.geloest.includes(name), b = geloest ? best[name] ?? {} : {};
      return { name, titel: titel.get(name), geloest, bestzeit: b.zeit ?? null, drehungen: b.drehungen ?? null };
    };
    const welten = STORY_CHAPTERS.map((ch, c) => ({ name: ch.title.replace(/^(Der|Die|Das) /, ''),
      icon: storyChapterId(ch), level: (STORY_LEVELS[grade]?.[c] ?? []).map(level) }));
    const d = { grad: grade, welten, geschafft: s.geschafft }, dorf = storyDorfStand(s.dorf);
    if (dorf) {
      d.dorf = { level: LEVELS.slice(0, TUTORIAL_COUNT).map((l) => level(l.name)),
        frei: dorf.ende === 'uebersprungen' };
    }
    const cur = imSpiel && this.steps[this.step];
    if (imSpiel && this.inDorf) d.aktuell = { welt: 'dorf', level: this.uebung };
    else if (cur) {
      d.aktuell = { welt: cur.c, level: (STORY_LEVELS[grade]?.[cur.c] ?? []).indexOf(LEVELS[cur.index].name) };
    }
    return d;
  },
  /** Esc im Menü, das aus dem Spiel kam: zurück ins Level wie mit «Weiter» (nach dem Start und dem Epilog nicht). */
  back() {
    if (this.choosing && this.paused) this.choose(this.paused.grade);
  },
  /** «Zum Menü» am Ende des Epilogs, ohne Neuladen: Das Menü blendet über der Bühne ein, die Bühne aus. */
  afterEpilog() {
    if (this.choosing) return;
    this.running = false;
    this.covered = false; // dahinter der Himmel der Sterne, die Kamera schaut noch zum Polarstern
    this.openMenu({ hervorheben: true });
    himmelsWagen.sofort(); // hinter der Bühne schon aus (die Sternkarte zeigt den Wagen), ohne Ausblenden
    this.close();
    this.scene.hide();
  },
  /** Aktion im Menü (createMenu, onAction): ein geschaffter Grad öffnet seine Übersicht, die übrigen spielen. */
  pick({ aktion, grad }) {
    if (aktion === 'vonvorn') this.resetGrade(grad);
    else if (aktion === 'uebersicht') this.openOverview(grad, 'menu');
    else this.choose(grad);
  },
  /**
   * «Von vorn» (nach der Rückfrage im Menü): nur der Stand dieses Grads geht (Entscheid 19), seine Bestwerte bleiben
   * (Entscheid 27); das Menü bleibt offen.
   */
  resetGrade(grade) {
    progress.remove(grade);
    if (this.grade === grade) { this.paused = null; this.setGrade(grade); } // sein Level auf dem Brett gilt nicht mehr
    menu.show(this.menuStand());
  },
  /**
   * Grad gewählt: dort weiter, wo er steht; neu von vorn mit dem Prolog. Das Menü blendet sofort aus (nicht erst, wenn
   * der Himmel der Welt da ist); war es aus dem Spiel geöffnet und geht es im selben Level weiter, steht es noch da.
   */
  choose(grade) {
    if (!this.choosing) return;
    this.choosing = false;
    menu.hide();
    // zurück in ein Wiederholen eines geschafften Grads (Esc): Es bleibt der zuletzt gespielte, nicht geschaffte Grad
    // (Entscheid 25 und 3 zu Ticket 06)
    if (!(grade === this.grade && this.stand?.geschafft)) progress.setLast(grade);
    const p = this.paused;
    this.paused = null;
    if (p?.grade === grade && game.board && game.levelIndex === this.currentIndex()) { // auch eine Übung im Dorf
      this.save(); // gespielt: jetzt (menuStand)
      this.resume(p);
      return;
    }
    this.outside = false;
    this.setGrade(grade);
    this.save();
    this.begin();
  },
  /**
   * Zurück ins Level, das beim Öffnen von Menü oder Übersicht lief: Der Blick senkt sich aufs Brett, es geht weiter
   * wie vorher; die Zeit dort zählt nicht für die Bestzeit.
   */
  async resume(p) {
    this.running = true;
    this.buehneFrei();
    // beide Zeitpunkte verschieben: Kam der Lösungsmoment der letzten Drehung vor dem Menü erst danach, zählte sonst
    // die Zeit im Menü ab (unter dem Menü gibt es keine Drehung, lastTurnAt liegt immer davor)
    const st = game.stats, pause = performance.now() - p.at;
    if (st.startedAt !== null) { st.startedAt += pause; st.lastTurnAt += pause; }
    setShown(ui.controls, true);
    ui.showHud(game.levelIndex);
    await this.gazeTo(0, 1.8);
    // gelöst: die Meldung wieder (kam der Lösungsmoment erst unter dem Menü, jetzt; sonst kommt sie noch von selbst)
    if (flow.solved && flow.state === 'play' && (!celebration.active || celebration.panelShown)) {
      ui.showSolved(game.levelIndex, flow.solveStats);
    }
    this.done();
  },
  /**
   * Prolog (nur beim ersten Mal je Grad) mit dem Angebot «Üben» / «Gleich los» (Entscheid 18), dann bringt der Träger
   * das Licht in die Welt, in der es weitergeht, bzw. das Licht kommt ins Dorf. Ein altes Feld (Menü oder Übersicht aus
   * dem Spiel, nach dem Epilog) versinkt dabei unbemerkt: Die Kamera schaut in den Himmel bzw. die Bühne deckt es zu.
   * Läuft das Kapitel «Im Dorf», beginnt es bei Übung 1 (kein Stand im Dorf). Wiederholen (replay) kommt immer ohne
   * Prolog und Einstieg.
   */
  async begin() {
    this.running = true;
    flow.state = 'story';
    if (!this.inDorf && !this.replay && this.dorfLaeuft()) { this.inDorf = true; this.uebung = 0; }
    this.himmelStand();
    let index = this.currentIndex(), ch = this.inDorf ? STORY_DORF : this.chapter();
    prepareLevel(index); // ohne altes Feld (sinkTo): die Elemente in den Pausen des Prologs bzw. während der Blick oben ist
    const sunk = game.board ? this.sinkTo(index) : Promise.resolve(); // versinkt auch aus dem Herauswachsen
    if (this.replay || this.seen(this.inDorf ? STORY_DORF.einstieg.moment : storyChapterId(ch))) {
      // in dieser Welt hat schon ein Level begonnen: ohne Einstieg. Die Kamera bleibt im Himmel, bis die Welt bereit
      // ist (sonst sähe man ein leeres Brett, solange ihr Himmel lädt), dann senkt sich der Blick, und das Level wächst
      this.buehneFrei(); // kein Prolog: eine gehaltene Bühne ruht
      await this.skyOf(ch);
      await sunk;
      setShown(ui.controls, true);
      await this.gazeTo(0, 2.2, (k) => { if (k > 0.25 && flow.state === 'story') enterLevel(index); });
      this.done();
      return;
    }
    // das Angebot nur vor dem ersten Level des Grads (ein älterer Stand ohne «angebot» bekommt es nicht mitten im Wald)
    const angebot = !this.inDorf && !this.seen('angebot') && !this.seen(storyChapterId(STORY_CHAPTERS[0]));
    if (this.seen('prolog') && !angebot) this.buehneFrei(); // kein Prolog: die gehaltene Bühne ruht
    if (!this.seen('prolog') || angebot) {
      // lädt hinter der Bühne, aber nur beim Warten auf Tippen und beim Angebot, nie während einer Fahrt (ruhe; das
      // Hochladen von scharfem Bild und Streifen hielt sie bis 110 ms an, Review Ticket 07)
      this.setSky(ch.sky, true);
      // nach einem Neuladen zwischen Prolog und Wahl: nur das Angebot, auf dem letzten Bild des Prologs, ohne Fahrt
      const shots = this.seen('prolog') ? [{ ...STORY_PROLOG.at(-1), text: '', act: null, move: 0 }] : STORY_PROLOG;
      const ueben = await this.playScene(shots, { skippable: !this.seen('prolog'), angebot });
      this.see('prolog');
      if (ueben) { this.inDorf = true; this.uebung = 0; index = this.currentIndex(); ch = STORY_DORF; }
    }
    // Abschnitte des Messwerkzeugs (leistung.waehrend): Einstieg, Reise, Weltwechsel und Finale
    if (this.inDorf) await leistung.waehrend('einstieg', this.enter(index, ch, sunk, STORY_DORF.einstieg));
    else await leistung.waehrend('einstieg', this.enter(index, ch, sunk));
    this.done();
  },
  /**
   * «Gelöst» steht, und «Weiter» führt in eine andere Welt (Reise, beim Wiederholen die Weltgrenze): deren Himmel
   * gleich schon laden (skyTheme.preload; die Feier ist dann vorbei), nicht erst im Flug. Er braucht gut 2 s.
   */
  preloadNext() {
    const cur = !this.inDorf && this.steps[this.step], next = cur && this.steps[this.step + 1];
    if (!next || next.c === cur.c) return;
    const sky = STORY_CHAPTERS[next.c].sky, index = game.levelIndex;
    setTimeout(() => {
      if (ui.solvedVisible() && game.levelIndex === index && !this.choosing && !this.running) skyTheme.preload(sky);
    }, 300);
  },
  /** Eine Zwischenszene ist zu Ende; wartet ein «Überspringen» des Dorfs (skip), kommt es jetzt. */
  done() {
    this.running = false;
    if (this.endeWartet) { this.endeWartet = false; this.dorfEnde('uebersprungen'); }
  },
  /**
   * Das Angebot nach dem Prolog (auch nach «Überspringen») auf der Bühne: «Im Dorf», der Satz und die Knöpfe «Üben» und
   * «Gleich los», der Fokus auf «Üben». Der Prolog ist gesehen, sobald das Angebot steht; die Wahl gilt sofort (gesehen:
   * angebot; nach «Üben» stand.dorf, und der Himmel des Dorfs kommt hinter der Bühne, die ihn noch ganz zudeckt).
   * Zurück: true bei «Üben».
   */
  async offer(sc) {
    const a = STORY_DORF.angebot;
    // übersprungen: Die Fahrt läuft im Zeitraffer zu Ende (sonst klickte die Lampe noch unter dem Angebot)
    for (let t = 0; sc.laeuft && t < 40; t++) await storySleep(50);
    sc.speed = 1;
    sc.hint(false);
    // «Im Dorf» und die Knöpfe erst, wenn der letzte Satz des Prologs aus ist (Abnahme Ticket 12: Sie schoben ihn
    // sonst noch im Ausblenden hinauf); dann steht der Satz des Angebots gleich dort, wo er bleibt
    let knoepfe;
    const umgebaut = sc.say(a.text, { umbau: () => {
      sc.kicker(a.kicker);
      knoepfe = new Promise((resolve) => {
        sc.actions([[a.ueben, () => resolve(true)], [a.los, () => resolve(false)]], { angebot: true });
      });
    } });
    this.see('prolog'); // schon jetzt: Ein Neuladen vor der Wahl bringt nur noch das Angebot (begin)
    await umgebaut;
    sc.el.querySelector('.actions button')?.focus({ preventScroll: true });
    // sobald das Angebot steht (wie bis Ticket 12, nicht schon, während der letzte Satz ausblendet), lädt der Wald
    // fertig (ruhe), was in den Pausen des Prologs nicht fertig wurde: Die Fahrt ist vorbei, der Spieler liest. So ist
    // er nach «Gleich los» bereit (sonst Schwarz, bis er geladen war). Nach «Üben» ist er nicht mehr gewählt und lädt
    // nicht weiter (Review Ticket 07)
    this.stillBild = true;
    this.ladeSperre = false;
    // erst wenn die Linien des letzten Halts getauscht sind (nach dem Überspringen kommt das Angebot gleich danach)
    this.stillAb = performance.now() + sc.ruheNachHalt;
    setTimeout(() => sceneLoop.wake(), sc.ruheNachHalt + 20);
    sceneLoop.wake(); // was hinter der Bühne liegen blieb, jetzt zeichnen (mayDraw)
    // (ohne Knöpfe: Der Umbau entfiel, weil die Bühne inzwischen neu begann; dann wie bis Ticket 12 keine Wahl mehr)
    const ueben = await (knoepfe ?? new Promise(() => {}));
    sc.actions([]); // nur eine Wahl (Doppelklick)
    this.keepFocus(); // der Knopf ist weg: Fokus gleich zurück (nicht erst nach dem Warten unten)
    // «Gleich los», der Wald aber noch nicht da (vor den Flügen der Glühwürmchen lädt er nicht, Ticket 18): die Bühne
    // bleibt stehen, bis er da ist (höchstens 8 s), statt schwarz
    // (nach der Uhr, nicht gezählt: Zeitgeber in einem verborgenen Tab sind gedrosselt)
    const bis = performance.now() + 8000;
    if (!ueben) while (!skyTheme.ready && performance.now() < bis) { ladeZeichen.warte(true, true); await storySleep(100); }
    // nach 8 s ohne Wald wartet gleich der Einstieg weiter (skyOf): Der Wagen bleibt stehen, statt aus- und einzublenden
    if (ueben || skyTheme.ready) ladeZeichen.warte(false);
    this.stillBild = false;
    this.keepFocus();
    this.fast = 1; // «Überspringen» des Prologs tippt (fast = 3): Der Einstieg danach läuft wieder in seinem Tempo
    if (ueben) {
      this.stand.dorf = { ende: null };
      this.setSky(STORY_DORF.sky, false);
    }
    this.see('angebot');
    return ueben;
  },
  /**
   * Himmel der Welt ch und warten, bis er da ist (höchstens 8 s). Sieht man dabei in den Himmel (nach dem Menü),
   * wechselt er wie auf der Reise langsamer, zwischen zwei Welten auf der Erde über die Farben beider (blendSky).
   */
  async skyOf(ch) {
    const old = skyTheme.current, fadeTime = skyTheme.fadeTime;
    this.setSky(ch.sky, true);
    if (skyTheme.current !== old) {
      skyTheme.fadeTime = 2.4;
      const earth = (id) => skyTheme.byId.get(id)?.sky.rings;
      this.blend = earth(old) && earth(skyTheme.current) ? { from: old, to: skyTheme.current } : null;
    }
    // Steht der erste Himmel nach dem Start noch nicht (wer weiterspielt und gleich «Weiter» wählt; im Prolog nicht
    // fertig geworden): Laden hinter der Überblendung, ruhig und im Messwerkzeug markiert (ruhe.lade). Die Kamera
    // schaut in den Himmel, die Vorschau steht schon, das Netz und das scharfe Bild blenden weich darüber ein. Solange
    // der Himmel fehlt, zeichnet sich der Kleine Wagen (ladeZeichen; unter Menü und Übersicht nicht)
    const warte = async () => {
      // nicht, solange ein Satz auf Tippen wartet (Ende des Dorfs: Der Wald lädt schon, während man liest)
      for (let t = 0; !skyTheme.ready && t < 8; t += 0.1) { ladeZeichen.warte(!this.choosing && !this.waitTap); await this.wait(0.1); }
      ladeZeichen.warte(false);
    };
    await (skyTheme.ready || !this.ersterHimmel ? warte() : ruhe.lade(warte()));
    this.ersterHimmel = false;
    skyTheme.fadeTime = fadeTime;
    this.blend = null;
  },
  /** Blick weich in den Himmel (to = 1) oder zurück aufs Brett (0); ein neuer Aufruf löst einen laufenden ab. */
  gazeTo(to, seconds, onStep) {
    const run = ++this.gazeRun, from = this.gaze;
    return this.tween(seconds, (k) => {
      if (run !== this.gazeRun) return;
      this.gaze = from + (to - from) * k;
      onStep?.(k);
    });
  },
  /**
   * „Weiter“ nach dem Lösen: im Kapitel das nächste Level, am Kapitelende die Zwischenszene. Beim Wiederholen
   * (Entscheid 16) das nächste gelöste Level ohne Zwischenszene, in einer anderen Welt blendet nur der Himmel
   * (replayWorld); nach dem letzten Level eines geschafften Grads die Übersicht. Ist das nächste Level noch ungelöst,
   * gilt wieder der normale Ablauf (Reise, Finale).
   */
  advance() {
    if (this.running) return;
    if (this.inDorf) { this.advanceDorf(); return; }
    const cur = this.steps[this.step], next = this.steps[this.step + 1];
    if (this.replay) {
      if (!next && this.stand.geschafft) { this.toOverview(); return; }
      if (next && this.stand.geloest.includes(LEVELS[next.index].name)) {
        this.step++;
        if (next.c === cur.c) changeLevel(next.index);
        else leistung.waehrend('weltwechsel', this.replayWorld(next));
        return;
      }
      this.replay = false;
    }
    if (next?.c !== cur.c && STORY_CHAPTERS[cur.c].finale) { leistung.waehrend('finale', this.finale()); return; }
    if (!next) { this.ending(); return; }
    this.step++;
    this.save();
    if (next.c === cur.c) changeLevel(next.index);
    else leistung.waehrend('reise', this.chapterEnd(next));
  },
  /**
   * «Weiter» im Dorf: die nächste Übung, nach der letzten das Ende des Kapitels (dorfEnde). Beim Wiederholen nach dem
   * Ende des Kapitels zurück in die Übersicht; läuft das Kapitel noch, gilt ab der ersten ungelösten Übung wieder der
   * normale Ablauf.
   */
  advanceDorf() {
    const next = this.uebung + 1, laeuft = this.dorfLaeuft();
    if (next >= TUTORIAL_COUNT) {
      if (this.replay && !laeuft) { this.toOverview(); return; }
      this.replay = false;
      this.dorfEnde('gespielt');
      return;
    }
    if (this.replay && laeuft && !this.stand.geloest.includes(LEVELS[next].name)) this.replay = false;
    this.uebung = next;
    this.save();
    changeLevel(next);
  },
  /**
   * Ende des Kapitels «Im Dorf» (art: 'gespielt' nach der letzten Übung, 'uebersprungen'): «Gelöst», Kopfzeile und
   * Knöpfe gehen weg, der Blick hebt sich, darunter versinkt die Übung; der Satz zum Ende wartet auf Tippen, dann
   * tragen die Glühwürmchen das Licht in den Bergwald (Einstieg wie nach dem Prolog). Während einer Zwischenszene
   * wartet ein «Überspringen», bis sie fertig ist (done).
   */
  async dorfEnde(art) {
    if (!this.inDorf || this.choosing || !this.dorfLaeuft()) return;
    if (this.running) { this.endeWartet = true; return; }
    this.running = true;
    flow.state = 'story'; // die Übung dreht nicht mehr (auch mitten im Herauswachsen)
    this.fast = 1;
    ui.hideSolved();
    // gleich nach dem Lösen übersprungen: «Gelöst» käme sonst noch aus der Feier (panelDelay) über den Satz zum Ende
    if (celebration.active) celebration.panelShown = true;
    ui.hideHud();
    setHovered(null);
    setShown(ui.controls, false);
    this.stand.dorf.ende = art;
    this.inDorf = false;
    this.replay = false;
    this.save();
    if (this.gaze === 0) this.aimGaze(STORY_UP);
    const hoch = this.gazeTo(1, 1.8);
    await this.wait(0.6);
    this.present('caption', this.el.querySelector('.caption'), (el) => this.fillCaption(el,
      { kicker: STORY_DORF.title, text: STORY_DORF.ende, tap: IS_TOUCH ? 'Tippen' : 'Klicken' }));
    await hoch;
    const { index } = this.steps[this.step], sunk = this.sinkTo(index); // erst im Himmel: kein leeres Brett
    // der Himmel des Bergwalds kommt schon, während der Satz steht («Am Waldrand blinken schon …»): Nach dem Tippen
    // wartet der Einstieg dann nicht mehr auf ihn (Review Ticket 07)
    const wald = this.skyOf(STORY_CHAPTERS[0]);
    await this.untilTap();
    this.el.querySelector('.caption .tap').textContent = ''; // getippt: die Aufforderung geht sofort
    await wald;
    await leistung.waehrend('einstieg', this.enter(index, STORY_CHAPTERS[0], sunk));
    this.done();
  },
  /** Ende einer Welt (1–5): Die Strahlen steigen zu ihrem Stern, er erwacht, dann die Reise in die nächste. */
  async chapterEnd(next) {
    const c = this.steps[this.step - 1].c, from = STORY_CHAPTERS[c], ch = STORY_CHAPTERS[next.c];
    // der Stern erwacht schon dort, wo er gleich über dem Untertitel der Reise steht (Abnahme Ticket 11): Danach
    // verschiebt sich das Bild nicht mehr
    await this.ascend(c + 1, { ende: (p) => this.blickAuf(p, this.lichtFuer(this.ankunft(ch))) });
    await this.travel(from, STORY_CHAPTERS[next.c], next.index);
    this.running = false;
  },
  /**
   * Wiederholen über die Grenze einer Welt (Entscheid 16): Nur der Himmel blendet, ohne Träger, Untertitel und Blick
   * in den Himmel. Das alte Level bleibt stehen (dreht nicht mehr), bis der Himmel der neuen Welt samt Brett geladen
   * ist (settled, höchstens 8 s; nicht ready: das scharfe Bild und die Streifen kommen mit quiet erst danach), dann
   * versinkt es, und das neue wächst, während der Himmel überblendet: langsamer als sonst, zwischen zwei Welten auf der
   * Erde über die Farben beider wie auf der Reise (blendSky). Das Brett gleitet dabei mit dem Himmel ins neue.
   */
  async replayWorld(next) {
    this.running = true;
    flow.state = 'story';
    this.fast = 1; // wie ascend: ein Tippen vorher (Enter beim Herauswachsen) verkürzt das Warten auf den Himmel nicht
    ui.hideSolved();
    ui.hideHud();
    setHovered(null);
    const fadeTime = skyTheme.fadeTime, old = skyTheme.current;
    skyTheme.quiet = true; // grosse Texturen erst, wenn das Level steht (wie nach der Reise)
    skyTheme.fadeTime = 2.4;
    this.setSky(STORY_CHAPTERS[next.c].sky, true);
    this.himmelStand(); // der Stern der neuen Welt; der Wagen bleibt stehen
    const earth = (id) => skyTheme.byId.get(id)?.sky.rings;
    this.blend = earth(old) && earth(skyTheme.current) ? { from: old, to: skyTheme.current } : null;
    for (let t = 0; !skyTheme.settled && t < 8; t += 0.1) await this.wait(0.1); // Himmel und Brett der neuen Welt
    await this.sinkTo(next.index);
    enterLevel(next.index);
    for (let t = 0; skyTheme.fading && t < 8; t += 0.1) await this.wait(0.1);
    skyTheme.fadeTime = fadeTime;
    this.blend = null;
    this.running = false;
    this.wait(1.2).then(() => { skyTheme.quiet = false; });
  },
  /**
   * Zwischen zwei Welten, ohne Schnitt: Ein Träger (Glühwürmchen, Gischt, Sand, Glut, Komet) nimmt den Lichtpunkt beim
   * eben geweckten Stern, er fliegt in einem Bogen am nächsten, noch schlafenden Stern vorbei (der kurz aufzuckt, zucke)
   * und hinab, und die Kamera folgt ihm (Ticket 05 von .scratch/kleiner-wagen/; STORY_FLUG). Die neue Welt lädt schon
   * beim Abflug; sobald sie da ist, blendet die alte über einen kurzen Moment Nacht in sie hinein, der Wagen bleibt
   * stehen. Unbemerkt versinkt darunter das alte Feld. In der Mitte steht dazu, wohin die Reise geht, die Leiste am
   * Rand; darüber steht das Licht (lichtHoch). Am Ende des Bogens hält es dort an und wartet auf Tippen (anhalten,
   * Abnahme Ticket 11), dann fällt es aufs neue Brett.
   */
  async travel(from, ch, index) {
    const fl = this.flare, carrier = this.carrier, n = STORY_CHAPTERS.indexOf(ch) + 1, F = STORY_FLUG;
    carrier.start(from.carrier, fl.position);
    this.present('caption', this.el.querySelector('.caption'), (el) => this.fillCaption(el, this.ankunft(ch)));
    // Der geweckte Stern ist Stern n − 1, der nächste Stern n (der der neuen Welt). Das Licht bleibt bei ihm, während
    // der Träger es aufnimmt; es steht schon über dem Untertitel (der Blick des Aufstiegs, chapterEnd)
    const dist = fl.position.distanceTo(camera.position), stern = himmelsWagen.richtung(n - 1);
    const place = (el, az) => fl.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
      .multiplyScalar(dist).add(camera.position);
    let hoch = this.lichtHoch();
    this.tween(0.9, (k) => {
      carrier.strength = k;
      for (const b of this.beams) b.material.uniforms.uStrength.value = 1 - k;
    });
    await this.tween(1.0, () => {
      hoch = this.lichtHoch();
      fl.position.copy(camera.position).addScaledVector(stern, dist);
      carrier.orb.copy(fl.position);
      this.look(fl.position, hoch);
    });
    this.endAscent();
    const sunk = this.sinkTo(index);
    // Langsamer als ein gewöhnlicher Wechsel des Hintergrunds: erst aus, dann ein, je 1,5 s. Die alte Welt bleibt, bis
    // die neue geladen ist (skyTheme.update). Zwischen zwei Welten auf der Erde gleitet der Himmel dazwischen über die
    // Farben beider (blendSky) statt über die Nacht; ins Sonnensystem und zu den Sternen geht es durch die Nacht.
    const fadeTime = skyTheme.fadeTime, old = skyTheme.current;
    skyTheme.fadeTime = 3;
    skyTheme.quiet = true; // scharfes Bild und Streifen der neuen Welt erst nach der Landung (jeder Ruck fiele auf)
    this.setSky(ch.sky, true);
    const earth = (id) => skyTheme.byId.get(id)?.sky.rings;
    this.blend = earth(old) && earth(skyTheme.current) ? { from: old, to: skyTheme.current } : null;
    // Lädt die neue Welt noch (Himmel oder Brett), sammelt der Träger das Licht weiter, in einem kleinen Kreis um den
    // geweckten Stern (höchstens 8 s): Hochladen und Übersetzen halten den Grafikprozess kurz an, und ein Ruck fiele im Flug auf
    const [azS, elS] = this.winkel(stern), kreis = THREE.MathUtils.degToRad(F.schweben);
    // seitwärts in die Richtung, in der der nächste Stern liegt (keine Kehre); liegt er fast darunter, abwechselnd
    const quer = this.vorbeiAn(n, azS)[0] - azS, side = Math.abs(quer) > 0.02 ? Math.sign(quer) : n % 2 ? 1 : -1;
    let az0 = azS, el0 = elS, phase = 0;
    for (let t = 0; !skyTheme.settled && t < 8; t += 0.1) {
      await this.tween(0.1, (k) => {
        const p = phase + k * 0.12, r = kreis * Math.min(1, (t + k * 0.1) / 1.5);
        az0 = azS + side * r * Math.sin(p) / Math.cos(elS);
        el0 = elS + r * (1 - Math.cos(p)) * 0.6;
        place(el0, az0);
        carrier.orb.copy(fl.position);
        this.look(fl.position, hoch);
      }, storyLinear);
      phase += 0.12;
    }
    // Bogen vom geweckten Stern am nächsten vorbei und hinab, seitwärts weiter in seine Richtung, am Ende so hoch,
    // wie man in der neuen Welt hinaufschaut
    const vorbei = this.vorbeiAn(n, az0), ende = [vorbei[0] + side * F.reise.seitwaerts,
      Math.min(1.15, (ch.up ?? STORY_UP) + 0.1)];
    const weg = this.bogen([az0, el0], vorbei, ende, F.reise.amStern);
    let gezuckt = false;
    await this.tween(F.reise.dauer, (k) => {
      const [az, el] = weg(k);
      place(el, az);
      carrier.orb.copy(fl.position);
      this.look(fl.position, hoch);
      if (!gezuckt && k >= F.reise.amStern) { gezuckt = true; this.zucke(n, true); }
    });
    if (!gezuckt) this.zucke(n, true);
    await this.anhalten(); // über dem Untertitel, bis der Spieler tippt (inzwischen versinkt das alte Feld)
    await sunk;
    // blendet die neue Welt noch ein, schwebt das Licht weiter (höchstens 8 s)
    let [az, el1] = ende;
    for (let t = 0; skyTheme.fading && t < 8; t += 0.1) {
      await this.tween(0.1, (k) => {
        place(el1, az + side * 0.03 * k);
        carrier.orb.copy(fl.position);
        this.look(fl.position, hoch);
      }, storyLinear);
      az += side * 0.03;
    }
    await this.fall(index, fl.position.clone());
    skyTheme.fadeTime = fadeTime; // erst jetzt: sonst blendete der Rest der neuen Welt plötzlich schneller ein
    this.blend = null;
    this.wait(1.2).then(() => { skyTheme.quiet = false; }); // erst, wenn das Level steht
  },
  /**
   * Himmel zwischen zwei Welten auf der Erde, nach skyTheme.update: Die Panoramen blenden durchsichtig über der
   * Himmelskugel (skyTheme zeigt immer nur eines zugleich). Dazwischen zeigte die Kugel den leeren Weltraum; hier zeigt
   * sie stattdessen den Farbverlauf beider Welten (sky.rings), der während des ganzen Überblendens von der alten zur
   * neuen gleitet. Die Vorschau eines Panoramas auf der Kugel (uPreview) blendet mit ihm aus und ein, die Sterne gehen
   * von der alten zur neuen Helligkeit.
   */
  blendSky() {
    const { from, to } = this.blend, a = skyTheme.byId.get(from).sky, b = skyTheme.byId.get(to).sky;
    const wa = skyTheme.weight[from], wb = skyTheme.weight[to], smooth = (w) => w * w * (3 - 2 * w);
    const p = wa > 0 ? 0.5 * (1 - wa) : 0.5 + 0.5 * wb; // 0 … 1 über das ganze Überblenden
    const bg = background.material.uniforms, su = stars.material.uniforms;
    bg.uPano.value = 1;
    bg.uRings.value.forEach((c, i) => c.fromArray(a.rings[i]).lerp(_storyDir.fromArray(b.rings[i]), p));
    bg.uPreviewOn.value = Math.min(bg.uPreviewOn.value, smooth(Math.max(wa, wb)));
    su.uFade.value = a.stars + (b.stars - a.stars) * p;
    su.uHorizon.value = (a.starsAboveHorizon ? 1 : 0) + ((b.starsAboveHorizon ? 1 : 0) - (a.starsAboveHorizon ? 1 : 0)) * p;
    su.uFrom.value = starsFromSin(a) + (starsFromSin(b) - starsFromSin(a)) * p;
  },
  /**
   * Ende der letzten Welt (Ticket 06 von .scratch/kleiner-wagen/, STORY_PULS): Die Strahlen steigen zum sechsten Stern,
   * er erwacht. Satz 1: Der Blick geht zum ganzen Wagen, ein Lichtpuls läuft Stern für Stern durch ihn (puls). Satz 2:
   * Er springt über die Deichsel, der Polarstern flammt auf (deichsel). Satz 3, dann antwortet der Polarstern: Sein
   * Strahl fällt zurück aufs Brett, die Kamera folgt ihm. Der Aufprall klingt aus (Lichtwelle, Funkenregen, die Ziele
   * blitzen), dann geht der Blick noch einmal hinauf, bis der ganze Wagen dort im Bild steht, wo die Bühne ihn zeigt
   * (wagenEnde, wenn nötig mit weiterem Sichtfeld), und während die Welt in der Nacht versinkt, taucht das Dorf auf, in
   * dem Noa wartet (Epilog; Wagen in Wagen, Ticket 07).
   */
  async finale() {
    const P = STORY_PULS, fl = this.flare, sechster = this.steps[this.step].c + 1;
    // er erwacht schon im Blick auf den ganzen Wagen, wie ihn Satz 1 zeigt (Abnahme Ticket 11: kein Nachschieben),
    // und die Strahlen laufen aus, sobald er wach ist (Abnahme Ticket 12: in ihn hinein, nicht abrupt)
    const oben = this.captionVorab({ text: STORY_FINALE[0], tap: IS_TOUCH ? 'Tippen' : 'Klicken' }).cap;
    await this.ascend(sechster, { ende: () => this.wagenBlick(oben / innerHeight), aus: true });
    // Satz 1: Das Licht geht im sechsten Stern auf, der Blick gleitet zum ganzen Wagen über dem Untertitel
    this.amStern = sechster;
    await this.caption(STORY_FINALE[0], (cap) => {
      const von = this.gazeDir.clone(), blick = this.wagenBlick(cap.getBoundingClientRect().top / innerHeight);
      this.tween(P.blick, (x) => { this.gazeDir.copy(von).lerp(blick, x).normalize(); });
      const hell = fl.material.opacity;
      this.tween(0.8, (x) => { fl.material.opacity = hell * (1 - x); fl.visible = x < 1; });
      return this.puls();
    });
    // Satz 2: über die Deichsel zum Polarstern
    await this.caption(STORY_FINALE[1], () => this.deichsel());
    // Satz 3: Alles steht still, jetzt fällt ein langes Bild nicht auf (die Bühne wird vorgezeichnet)
    await this.caption(STORY_FINALE[2], () => this.prewarmScene(STORY_EPILOG));
    const cap = this.el.querySelector('.caption');
    cap.classList.add('swap');
    await storySleep(350);
    this.open('veil');
    cap.classList.remove('swap');
    this.fast = 1;
    const star = fl.position.clone(), hit = new THREE.Vector3(0, BEAM_Y, 0), blick = this.gazeDir.clone();
    this.aim(this.answer, star, hit, WHITE);
    audio.hit(7, 0, { octave: 2, gain: 0.06 });
    audio.hit(7, 0.3, { gain: 0.05 });
    // der Strahl fällt immer schneller aus dem Bild, das gerade steht (Abnahme Ticket 11: kein Blick zum Polarstern
    // davor); erst wenn seine Spitze tief unter die Mitte kommt, folgt ihr die Kamera bis aufs Brett (antwortBlick)
    const folge = this.antwortBlick(blick), A = P.antwort;
    // weicher Aufprall (Abnahme Ticket 12): Das Brett glüht unter der Spitze schon auf, bevor sie ankommt (Lichtwelle
    // mit Halbmesser 0)
    shockUniforms.uShockColor.value.copy(WHITE).multiplyScalar(0.6);
    const glut = (u) => A.glut * THREE.MathUtils.smoothstep(u, 1 - A.vorglut, 1) ** 2;
    await this.tween(2.4, (k) => {
      const u = k * k;
      this.answer.material.uniforms.uHead.value = u;
      folge(_storyHead.copy(star).lerp(hit, u));
      this.gaze = 1 - THREE.MathUtils.smoothstep(k, 0.8, 1);
      shockUniforms.uShock.value.set(0, glut(u), CELEBRATE.shockWidth);
    }, storyLinear);
    this.endAscent();
    this.shock(WHITE, { von: glut(1), anstieg: A.anstieg });
    this.pulse(A.anstieg);
    audio.chord([1, 2, 4, 7], 0);
    celebration.rain.burst([7, 7, 4, 2, 1]);
    for (const obj of game.targets) obj.userData.flash = 1;
    this.wait(A.ab).then(() => this.auslaufen([this.answer], A.aus, storyAuslauf)); // der Strahl läuft ins Brett aus
    await this.wait(2.6);
    // Blick hinauf, bis der ganze Wagen dort steht, wo ihn gleich das gezeichnete Dorf zeigt (Wagen in Wagen,
    // wagenEnde; hat er dort weniger Platz, schaut die Kamera dabei weiter); der Lichtpunkt auf dem Polarstern wird so
    // gross wie der gezeichnete Stern
    const ende = this.wagenEnde(), fov0 = camera.fov, size = fl.scale.x, rad = THREE.MathUtils.degToRad;
    const weiter = Math.tan(rad(ende.fov / 2)) / Math.tan(rad(fov0 / 2));
    this.tween(3.4, (k) => {
      this.gazeDir.copy(ende.blick);
      this.gaze = k;
      this.seit = ende.seit * k;
      this.sichtfeld(fov0 + (ende.fov - fov0) * k);
      fl.scale.setScalar(size + (4.5 * weiter - size) * k);
    });
    await this.wait(3.2);
    await this.ending(true);
  },
  /**
   * Nach dem letzten Level: Der Grad ist geschafft, Epilog im Dorf. soft: langsam überblenden (Finale). «Zum Menü»
   * führt ohne Neuladen ins Menü (afterEpilog; Entscheid 14).
   */
  async ending(soft = false) {
    this.running = true;
    flow.state = 'story';
    ui.hideSolved();
    ui.hideHud();
    this.stand.geschafft = true;
    this.save();
    this.himmelStand(); // der ganze Wagen (dahinter, für das Menü nach dem Epilog)
    await this.playScene(STORY_EPILOG, { soft, actions: [['Zum Menü', () => this.afterEpilog()]] });
  },
  /**
   * Prolog oder Epilog auf der Bühne: je Einstellung eine Kamerafahrt mit einem Satz, weiter mit Tippen. Tippen
   * während einer Fahrt macht sie schneller. actions: Knöpfe nach der letzten Einstellung (Epilog), die Bühne bleibt
   * dann stehen; sonst blendet sie aus. angebot: nach dem Tippen auf die letzte Einstellung oder dem Überspringen das
   * Angebot (offer), danach blendet sie aus; zurück die Wahl (true: «Üben»), sonst false.
   */
  async playScene(shots, { skippable = false, actions = null, soft = false, angebot = false } = {}) {
    const sc = this.scene ??= this.makeScene();
    sc.reset(shots[0], shots);
    // eine bis hier gehaltene Bühne (vorwaermen) zeigt sich jetzt, schon gerastert, und blendet wie sonst aus 0 ein
    // (vor dem Wegnehmen von prewarm: bis open gilt sonst kein Modus, und die Ebenen fielen weg)
    if (this.buehneWarm) {
      this.el.style.transition = 'none';
      this.el.classList.remove('gehalten');
      void this.el.offsetWidth;
      this.el.style.transition = '';
      this.buehneWarm = false;
    }
    sc.el.classList.remove('prewarm');
    this.stillBild = false;
    sc.skip.hidden = !skippable;
    this.skipped = false;
    // soft: Die Welt dahinter versinkt langsam in der Nacht, während die Bühne einblendet (CSS #story.slow); erst
    // danach ist sie ganz verdeckt
    this.el.classList.toggle('slow', soft);
    this.open('scene');
    sc.show();
    if (soft) {
      await this.wait(1.9);
      this.el.classList.remove('slow');
      for (const o of [this.answer, this.flare]) o.visible = false;
      this.amStern = null;
      this.sichtfeld(); // das Finale schaute am Ende weiter und seitlich gedreht (wagenEnde)
      this.seit = 0;
    }
    this.covered = true;
    for (const shot of shots) {
      if (this.skipped) break;
      if (sc.gl) await sc.gl.bereit(shots.indexOf(shot)); // WebGL: Texturen der Fahrt fertig (meist schon im Ruhepunkt)
      // vor dem letzten Satz des Epilogs schon der Platz für «Zum Menü» (er rückt dann nicht mehr, Abnahme Ticket 12)
      if (actions && shot === shots.at(-1)) sc.say(shot.text, { umbau: () => sc.platzFuer(actions) });
      else sc.say(shot.text);
      sc.hint(false);
      if (shot.act) sc.act(shot.act);
      await sc.moveTo(shot);
      if (this.skipped) break;
      // (war die Fahrt kürzer als das Ausblenden des vorigen Satzes, jetzt gleich umbauen: sonst nähme der Umbau die
      // Knöpfe danach wieder weg)
      if (actions && shot === shots.at(-1)) { sc.umbauLos?.(); sc.actions(actions); return; }
      // nach einem Neuladen (letztes Bild ohne Satz) gleich das Angebot, sonst erst nach dem Tippen wie jedes Bild
      if (angebot && shot === shots.at(-1) && !shot.text) break;
      sc.hint(true);
      // ruhige Stelle: hier darf geladen und die Szene dahinter gezeichnet werden (ruhe), aber erst, wenn die Bühne die
      // Linien gestaffelt neu gerastert hat (ruheNachHalt; sonst raste beides zugleich)
      this.stillBild = true;
      this.stillAb = performance.now() + sc.ruheNachHalt;
      setTimeout(() => sceneLoop.wake(), sc.ruheNachHalt + 20);
      // was die nächste Einstellung beim Tippen neu rastern liesse, jetzt (sc.vorbereiten)
      // (nur in diesem Ruhepunkt: schnell getippt, könnte schon der nächste stehen)
      const hier = shots.indexOf(shot), naechste = shots[hier + 1];
      this.ladeSperre = ['gather', 'carry'].includes(naechste?.act);
      if (naechste) setTimeout(() => { if (this.stillBild && sc.running && sc.fahrtIndex === hier) { sc.vorSagen(naechste.text); if (naechste.act) sc.vorbereiten(naechste.act); } }, sc.ruheNachHalt);
      await this.untilTap();
      this.stillBild = false;
    }
    sc.skip.hidden = true; // Escape wirkt nur im Prolog (sonst ginge damit später eine Karte weiter)
    const ueben = angebot ? await this.offer(sc) : false;
    sc.say('');
    sc.kicker('');
    sc.hint(false);
    await sc.hide();
    this.covered = false;
    return ueben;
  },
  /**
   * Vorwärmen der Bühne für den Prolog: Unter dem Startbildschirm die Bühne einmal unsichtbar zeichnen (erste
   * Einstellung des Prologs, die Folge schon angelegt), zwei Bilder lang: Ihr erstes Zeichnen hielt den Prolog bis
   * 250 ms an (Review Ticket 05), danach nicht mehr. #story ist dabei da, aber leer und nicht bedienbar (inert). Nur,
   * solange die Geschichte nichts zeigt; danach ruht die Bühne wieder (createStoryScene, ruhen). halten (neue Spieler,
   * Ticket 03 der Leistung): Sie bleibt fast durchsichtig stehen und damit gerastert, bis der Prolog sie zeigt (sonst
   * rasterte sein erstes Bild sie neu, 90–130 ms) oder feststeht, dass keiner kommt (buehneFrei). Zurück: ein Promise,
   * erfüllt, sobald das Vorwärmen gezeichnet ist.
   */
  vorwaermen(halten = false) {
    if (!this.el.classList.contains('hidden')) return Promise.resolve();
    const sc = this.scene ??= this.makeScene();
    if (sc.el.classList.contains('prewarm')) return Promise.resolve();
    this.prewarmScene(STORY_PROLOG);
    this.el.classList.add('gehalten'); // da, obwohl hidden (CSS): Wer «hidden» prüft, sieht weiter keine Bühne
    this.buehneWarm = true;
    return new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!halten) this.buehneFrei();
      requestAnimationFrame(() => fertig());
    })));
  },
  /** Die vorgewärmte Bühne ausblenden und ruhen lassen (vorwaermen; als Nächstes kommt kein Prolog). */
  buehneFrei() {
    if (!this.buehneWarm) return;
    this.buehneWarm = false;
    this.el.classList.remove('gehalten');
    if (this.el.inert) this.scene.ruhen(); // sonst inzwischen geöffnet (open): Das zeigt die Bühne selbst
  },
  /**
   * Die Bühne einmal unsichtbar zeichnen lassen (erste Einstellung der Folge shots, die Folge schon angelegt), bevor sie gebraucht
   * wird: Das erste Zeichnen der grossen Szene dauerte über 100 ms. playScene nimmt die Klasse wieder weg.
   */
  prewarmScene(shots) {
    const sc = this.scene ??= this.makeScene();
    sc.vorwaermen(shots[0], shots);
  },
  makeScene() {
    // der Wagen am Himmel der Bühne steht, wo ihn das Finale am Ende zeigt (Wagen in Wagen)
    const sc = createStoryScene(this.el, { wagenLage: () => this.wagenEnde().sterne });
    sc.skip.hidden = true; // nur im Prolog (playScene); sonst hielte skip ihn nach einem Neuladen für offen
    sc.skip.addEventListener('click', (e) => { e.stopPropagation(); this.skipProlog(); });
    return sc;
  },
  /** Prolog überspringen: laufende Fahrt sofort zu Ende, keine weiteren Einstellungen. */
  skipProlog() {
    if (!this.scene || this.scene.skip.hidden) return;
    this.skipped = true;
    this.scene.speed = 60;
    this.tap();
  },

  /* ---------- Zwischenszenen ---------- */

  /** Blickrichtung in den Himmel: geradeaus über das Brett hinweg, elevation (rad) über dem Horizont. */
  aimGaze(elevation) {
    const f = _gazeLook.copy(cameraRig.target).sub(camera.position).setY(0).normalize();
    this.gazeDir.copy(f).multiplyScalar(Math.cos(elevation)).setY(Math.sin(elevation)).normalize();
  },
  /**
   * Die Strahlen der Ziele steigen zu einem Lichtpunkt am Himmel, die Kamera schaut ihnen nach; der Punkt blitzt auf,
   * wenn sie ankommen. stern: Nummer des Sterns dieser Welt (Ende einer Welt, Ticket 05 von .scratch/kleiner-wagen/; im
   * Finale der sechste, Ticket 06): Der Lichtpunkt steht dort, wo er am Himmel steht (himmelsWagen.richtung; beim
   * Vulkan hoch über dem Rand), und er erwacht, sobald die Strahlen ankommen (erwache). Reise und Finale beginnen hier:
   * Die Knöpfe gehen weg, «Menü» und «Neu starten» wirken dort nicht (Review Ticket 05); sie kommen mit dem nächsten
   * Level wieder (fall, begin).
   * ende(punkt): Blickrichtung, in der die Kamera ankommt (Abnahme Ticket 11): Der Stern steht beim Erwachen schon
   * dort, wo ihn der folgende Untertitel braucht (Reise: über ihm, lichtFuer; Finale: der ganze Wagen, wagenBlick); auf
   * dem Weg hinauf gleitet der Blick von der Spitze der Strahlen dorthin. Ohne: genau auf den Stern. aus: Die Strahlen
   * laufen aus, sobald er wach ist (auslaufen; Finale; am Ende einer Welt nimmt sie der Träger, travel).
   */
  async ascend(stern, { ende = null, aus = false } = {}) {
    this.running = true;
    flow.state = 'story';
    this.fast = 1;
    ui.hideSolved();
    ui.hideHud();
    setShown(ui.controls, false);
    setHovered(null);
    adaptiveResolution.hold(6);
    this.open('veil');
    himmelsWagen.richtung(stern, this.gazeDir);
    const ziel = this.gazeDir.clone(), dist = 72;
    const fl = this.flare, point = fl.position.copy(camera.position).addScaledVector(ziel, dist);
    const schluss = ende ? ende(point.clone()) : null;
    fl.visible = true;
    fl.material.opacity = 0;
    fl.scale.setScalar(1);
    const targets = game.targets.slice(0, this.beams.length);
    const colors = targets.map((o) => o.userData.element.color);
    const from = targets.map((o) => o.userData.gem.getWorldPosition(new THREE.Vector3()));
    const middle = from.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, from.length));
    const rise = 2.0, step = 0.14;
    targets.forEach((obj, i) => {
      const b = this.beams[i];
      this.aim(b, from[i], point, COLOR_RGB[colors[i]]);
      audio.hit(colors[i], 0.15 + i * step, { octave: 2, gain: 0.045 });
      this.tween(rise, (k) => { b.material.uniforms.uHead.value = k; }, storyEase, 0.15 + i * step);
    });
    // die Kamera folgt der Spitze der mittleren Strahlen hinauf (am Anfang weich vom Brett weg) und kommt in schluss an
    this.tween(rise, (k) => {
      this.look(_storyHead.copy(middle).lerp(point, storyEase(k)));
      if (schluss) this.gazeDir.lerp(schluss, storyEase(k)).normalize();
      this.gaze = THREE.MathUtils.smoothstep(k, 0, 0.3);
    }, storyLinear, 0.15 + (targets.length - 1) * step / 2);
    await this.wait(0.15 + (targets.length - 1) * step + rise);
    // Ankunft am Himmel
    audio.chord(colors, 0);
    this.pulse();
    this.erwache(stern);
    if (aus) this.auslaufen(this.beams.filter((b) => b.visible)).then(() => this.endAscent());
    await this.tween(1.3, (k) => {
      // am Stern: Er steht in der Richtung von der Kamera aus, die sich leise bewegt (sonst wanderte das Licht von ihm weg)
      fl.position.copy(camera.position).addScaledVector(ziel, dist);
      const burst = k < 0.15 ? k / 0.15 : Math.exp(-(k - 0.15) * 3);
      fl.material.opacity = Math.min(1, k * 6);
      fl.scale.setScalar(5 + 9 * burst);
    }, storyLinear);
  },
  endAscent() {
    for (const b of this.beams) b.visible = false;
  },
  /**
   * Strahlen laufen aus (Abnahme Ticket 12: nicht abrupt weg): Ihr Ende rückt in dauer s zur Spitze (uTail mit
   * einem weichen Stück, makeBeam), auf dem Weg weg (Anteil der Länge über der Zeit), und in der zweiten Hälfte werden
   * sie dazu schwächer. Im Finale die Strahlen zum sechsten Stern ins Licht beim Stern (erst langsam, dann zügig, weich
   * ankommend) und der Strahl des Polarsterns ins Brett (zügig durch das ferne Stück, das im Bild kurz ist, dann immer
   * langsamer durch das nahe; storyAuslauf). Zurück: erfüllt, wenn nichts mehr leuchtet (sichtbar bleiben sie;
   * wegnehmen wie endAscent).
   */
  auslaufen(strahlen, dauer = STORY_PULS.auslaufen, weg = storyEase) {
    return this.tween(dauer, (k) => {
      for (const b of strahlen) {
        b.material.uniforms.uTail.value = 1.2 * weg(k);
        b.material.uniforms.uStrength.value = 1 - THREE.MathUtils.smoothstep(k, 0.5, 1);
      }
    }, storyLinear);
  },
  /**
   * Blick in den Himmel auf einen Punkt richten (gaze bestimmt, wie weit). hoch: der Punkt steht so weit über der Mitte
   * des Bilds (Anteil der halben Bildhöhe, lichtHoch), der Blick also etwas tiefer.
   */
  look(point, hoch = 0) { this.blickAuf(point, hoch, this.gazeDir); },
  /**
   * Die Kamera gleich in Richtung d drehen (wie updateCamera mit gaze 1 im nächsten Bild), damit dieses Bild so
   * gezeichnet wird, wie fall den Lichtpunkt ins Bild rechnet (sonst hinkte der Blick ein Bild nach).
   */
  kameraNach(d) {
    camera.lookAt(_gazeLook.copy(camera.position).add(d));
    camera.updateMatrixWorld();
  },
  /** Die Blickrichtung von look, ohne den Blick zu setzen (in d). */
  blickAuf(point, hoch = 0, d = new THREE.Vector3()) {
    d.copy(point).sub(camera.position).normalize();
    if (!hoch) return d;
    const el = Math.asin(d.y) - Math.atan(hoch * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const waag = Math.hypot(d.x, d.z) || 1;
    return d.set(d.x / waag * Math.cos(el), Math.sin(el), d.z / waag * Math.cos(el));
  },
  /**
   * Antwort des Polarsterns (Finale; Abnahme Ticket 11): Die Kamera bleibt im Blick blick, solange die Spitze seines
   * Strahls nicht weiter als frei (Anteil der halben Bildhöhe) unter die Mitte fällt; dann senkt sie sich weich mit
   * ihr, die Spitze bleibt höchstens tief unter der Mitte. Zurück eine Funktion, die zur Spitze (Punkt) den Blick
   * setzt.
   */
  antwortBlick(blick, frei = 0.5, tief = 0.75) {
    const [azB, elB] = this.winkel(blick), halb = THREE.MathUtils.degToRad(camera.fov / 2);
    const a = frei * halb, r = (tief - frei) * halb, d = new THREE.Vector3();
    return (spitze) => {
      const [azH, elH] = this.winkel(d.copy(spitze).sub(camera.position).normalize(), azB);
      const x = elB - elH - a; // so weit ist die Spitze unter der freien Zone
      const senken = x <= 0 ? 0 : x - r * (1 - Math.exp(-x / r)); // stetig und ohne Ruck in der Neigung
      const w = senken > 0 ? senken / (elB - elH) : 0, az = azB + (azH - azB) * w, el = elB - senken;
      this.gazeDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    };
  },
  /**
   * Stern k des Kleinen Wagens erwacht (Ende einer Welt, sobald die Strahlen ihn erreichen; Ticket 05 von
   * .scratch/kleiner-wagen/): Der Wagen am Himmel zeigt ab jetzt den neuen Stand, der Stern blitzt auf und bleibt hell,
   * die neuen Linien ziehen sich nacheinander vom vorigen Stern zu ihm (mit Stern 4 danach 4 → 1, die Schale schliesst
   * sich), sein Glockenton klingt. Der Stern dieser Welt bleibt er, bis das Licht am nächsten vorbeizieht (zucke).
   */
  erwache(k) {
    const H = himmelsWagen, F = STORY_FLUG, n = wagen.form.length, vorher = H.stand.linien.map((l) => l.join());
    H.zeige(this.wagenStand(), k);
    const neu = wagen.linien.map((l, i) => i).filter((i) => H.stand.linien.some((l) => l.join() === wagen.linien[i].join())
      && !vorher.includes(wagen.linien[i].join()));
    audio.stern(k, 0.1);
    this.tween(F.blitz, (x) => { H.glanz[k - 1] = x >= 1 ? 0 : x < 0.08 ? x / 0.08 : Math.exp(-(x - 0.08) * 4); },
      storyLinear);
    neu.forEach((i, j) => {
      H.anteil[i] = 0;
      H.glanz[n + i] = 1;
      const zug = F.linie + F.nach;
      this.tween(zug, (x) => {
        const t = x * zug;
        H.anteil[i] = storyEase(Math.min(1, t / F.linie));
        H.glanz[n + i] = t <= F.linie ? 1 : 1 - THREE.MathUtils.smoothstep(t, F.linie, zug);
      }, storyLinear, 0.2 + j * F.linie * 0.85);
    });
  },
  /**
   * Das Licht zieht am schlafenden Stern k vorbei (Reise, Einstieg): Er zuckt kurz auf und wird wieder blass. weiter: ab
   * jetzt ist er der Stern dieser Welt (Reise: der Stern der neuen Welt, himmelStand).
   */
  zucke(k, weiter = false) {
    const H = himmelsWagen;
    if (weiter) this.himmelStand();
    this.tween(STORY_FLUG.zucken, (x) => {
      H.glanz[k - 1] = x >= 1 ? 0 : x < 0.1 ? 0.75 * x / 0.1 : 0.75 * Math.exp(-(x - 0.1) * 5);
    }, storyLinear);
  },
  /**
   * Blick, in dem der ganze Kleine Wagen am Himmel im Bild steht (Finale, Ticket 06 von .scratch/kleiner-wagen/), mit
   * STORY_PULS.rand Platz zu den Rändern; unten: so weit hinab (Anteil der Bildhöhe von oben) reicht der freie Platz
   * (über dem Untertitel). Waagrecht steht der Wagen immer in der Mitte: Er steht hoch am Himmel, und die Kamera hält
   * den Horizont waagrecht (updateCamera), seitlich davon stünde er schräg (bei 60° Höhe für ein Viertel der Bildbreite
   * gut 20° gedreht); senkrecht mitten im freien Platz. feld (Ende des Finales, wagenEnde): statt dessen genau zwischen
   * oben und unten (Anteile der Höhe), mit dem Sichtfeld fov (Grad) und der Kamera um seit (rad) um ihre Hochachse
   * gedreht (wagenEnde). Gerechnet mit einer Kopie der Kamera an ihrem Ort (wagenKamera), in wenigen Schritten (die
   * Projektion ist nicht linear). Zurück die Blickrichtung (für gazeDir).
   */
  wagenBlick(unten = 1, feld = null) {
    const H = himmelsWagen, cam = this.wagenKamera(feld?.fov), seit = feld?.seit ?? 0;
    const Hb = innerHeight, r = STORY_PULS.rand * Math.min(innerWidth, Hb), y1 = 1 - 2 * (feld ? feld.oben : r / Hb);
    // Feld des Wagens im Bild (NDC, y nach oben)
    const y0 = Math.min(y1, 1 - 2 * (feld ? feld.unten : unten - r / Hb));
    const sterne = wagen.form.map((_, i) => H.richtung(i + 1, new THREE.Vector3()));
    const az = THREE.MathUtils.degToRad(HIMMELSWAGEN.azimut), p = new THREE.Vector3();
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    let el = Math.asin(sterne.reduce((a, d) => a.add(d), new THREE.Vector3()).normalize().y);
    const blick = () => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    for (let schritt = 0; schritt < 8; schritt++) {
      cam.lookAt(p.copy(cam.position).add(blick()));
      if (seit) cam.rotateY(seit);
      cam.updateMatrixWorld();
      const ys = sterne.map((d) => p.copy(cam.position).addScaledVector(d, H.mesh.material.uniforms.uAbstand.value)
        .project(cam).y);
      const ly = Math.min(...ys), hy = Math.max(...ys), dy = (y0 + y1 - ly - hy) / 2; // Verschiebung: mitten ins Feld
      if (Math.abs(dy) < 1e-4) break;
      el -= Math.atan(dy * tanV); // das Bild hinauf schieben: Die Kamera senkt sich
    }
    return blick();
  },
  /** Kopie der Kamera an ihrem Ort (wagenBlick, wagenImBild), mit dem Sichtfeld fov (Grad), sonst ihrem. */
  wagenKamera(fov = null) {
    const cam = (this._wagenKamera ??= camera.clone(false)).copy(camera, false);
    if (fov !== null && fov !== undefined) { cam.fov = fov; cam.updateProjectionMatrix(); }
    return cam;
  },
  /** Wo die sieben Sterne des Wagens am Himmel im Bild stehen, wenn die Kamera nach blick schaut (Sichtfeld fov, Grad;
   *  um seit rad um ihre Hochachse gedreht): Anteile [x, y] von oben links. */
  wagenImBild(blick, fov, seit = 0) {
    const H = himmelsWagen, cam = this.wagenKamera(fov), p = new THREE.Vector3(), d = new THREE.Vector3();
    cam.lookAt(p.copy(cam.position).add(blick));
    if (seit) cam.rotateY(seit);
    cam.updateMatrixWorld();
    return wagen.form.map((_, i) => {
      p.copy(cam.position).addScaledVector(H.richtung(i + 1, d), H.mesh.material.uniforms.uAbstand.value).project(cam);
      return [(p.x + 1) / 2, (1 - p.y) / 2];
    });
  },
  /**
   * Ende des Finales, Wagen in Wagen (Ticket 07 von .scratch/kleiner-wagen/): Blick und Sichtfeld der Kamera (fov,
   * Grad), in denen der ganze Wagen am Himmel dort steht, wo die Bühne Platz für ihn hat (scene.wagenFeld):
   * senkrecht mitten im Platz (wagenBlick), höchstens BUEHNENWAGEN.feld.hoehe des Platzes hoch und breite so breit,
   * waagrecht bei lage im Platz (Abnahme Ticket 11: weiter rechts, Noa leuchtet weniger steil). Ist er dafür mit dem
   * Sichtfeld des Spiels (kameraSichtfeld) zu gross, schaut die Kamera am Ende weiter. Seitlich der Mitte stünde er
   * schräg (wagenBlick): Darum dreht sich die Kamera dafür um ihre eigene Hochachse (seit, rad; updateCamera), dann
   * bleibt er aufrecht. Den Horizont, der sich dabei neigte, sieht man am Ende des Finales nicht (die Kamera schaut hoch
   * in den Himmel der Sterne). sterne: wo seine sieben Sterne dann im Bild stehen (Anteile von oben links); genau dort
   * legt die Bühne ihren Wagen hin (scene.wagenLegen), im ersten Bild des Epilogs.
   */
  wagenEnde() {
    const sc = this.scene ??= this.makeScene(), feld = sc.wagenFeld(), fov0 = kameraSichtfeld(camera.aspect);
    const B = BUEHNENWAGEN.feld, breit = feld.rechts - feld.links, rad = THREE.MathUtils.degToRad;
    const spanne = (sterne, k) => {
      const v = sterne.map((s) => s[k]);
      return [Math.min(...v), Math.max(...v)];
    };
    const masse = (sterne) => [0, 1].map((k) => ((a, b) => b - a)(...spanne(sterne, k)));
    const [b0, h0] = masse(this.wagenImBild(this.wagenBlick(1, { ...feld, fov: fov0 }), fov0));
    const platz = [B.breite * breit, B.hoehe * (feld.unten - feld.oben)];
    // so viel weiter: Der Wagen wird kleiner, wie tan(fov / 2) wächst (nie enger, höchstens dreimal so weit)
    const f = THREE.MathUtils.clamp(Math.max(b0 / platz[0], h0 / platz[1]), 1, 3) || 1;
    const fov = 2 * THREE.MathUtils.radToDeg(Math.atan(Math.tan(rad(fov0 / 2)) * f));
    // waagrecht: die Kamera so weit um ihre Hochachse gedreht, dass die Mitte des Wagens bei lage im Platz steht (ein
    // paar Schritte, die Projektion ist nicht linear; senkrecht danach neu eingepasst)
    const tanH = Math.tan(rad(fov / 2)) * camera.aspect, ndc = (x) => Math.atan((2 * x - 1) * tanH);
    let seit = 0, blick = this.wagenBlick(1, { ...feld, fov }), sterne = this.wagenImBild(blick, fov);
    for (let schritt = 0; schritt < 4; schritt++) {
      const [x0, x1] = spanne(sterne, 0), ziel = feld.links + (x1 - x0) / 2 + B.lage * (breit - (x1 - x0));
      seit += ndc(ziel) - ndc((x0 + x1) / 2);
      blick = this.wagenBlick(1, { ...feld, fov, seit });
      sterne = this.wagenImBild(blick, fov, seit);
    }
    return { blick, fov, seit, sterne };
  },
  /** Sichtfeld der Kamera (Grad; ohne: wie sonst in diesem Format, kameraSichtfeld), am Ende des Finales weiter. */
  sichtfeld(fov = kameraSichtfeld(camera.aspect)) {
    if (camera.fov === fov) return;
    camera.fov = fov;
    camera.updateProjectionMatrix();
  },
  /**
   * Satz 1 des Finales (STORY_PULS.puls): Ein Lichtpuls läuft Stern für Stern durch den Wagen, in der Reihenfolge des
   * Erwachens (1 … 6), jeder Stern leuchtet mit seinem Glockenton auf und klingt nach; die Linie zum nächsten leuchtet,
   * solange der Puls auf ihr zu einem Stern läuft, mit allen Linien, die sich mit diesem Stern gezogen haben (an Stern 4
   * auch die der Schale, 4 → 1). Zurück ein Promise, erfüllt, wenn er verklungen ist.
   */
  puls() {
    const H = himmelsWagen, P = STORY_PULS.puls, n = wagen.form.length, z = wagen.polarstern - 2; // Stern 1 … z + 1
    const wege = Array.from({ length: z }, (_, i) => wagen.linien.map((l, j) => j)
      .filter((j) => Math.max(...wagen.linien[j]) === i + 2)); // je Schritt zu Stern i + 2 seine Linien
    const dauer = z * P.schritt + P.nach;
    let klang = 0;
    return this.tween(dauer, (x) => {
      const s = x * dauer / P.schritt; // so weit ist der Puls: bei Stern s + 1
      for (; klang <= z && klang <= s; klang++) audio.stern(klang + 1);
      for (let i = 0; i <= z; i++) {
        H.glanz[i] = x >= 1 || s < i ? 0 : P.glanz * Math.exp(-4 * (s - i) * P.schritt / P.nach);
      }
      wege.forEach((w, i) => {
        const g = x < 1 && s > i && s < i + 1 ? Math.sin(Math.PI * (s - i)) : 0;
        for (const j of w) H.glanz[n + j] = g;
      });
    }, storyLinear, P.ab);
  },
  /**
   * Satz 2 des Finales (STORY_PULS.deichsel): Der Puls springt vom sechsten Stern über die Deichsel, die Linie 6 → 7
   * zieht sich, dann flammt der Polarstern auf (er ist jetzt wach, der Lichtpunkt steht auf ihm) und setzt den
   * Schlusston. Zurück ein Promise, erfüllt, wenn er ruhig steht.
   */
  async deichsel() {
    const H = himmelsWagen, D = STORY_PULS.deichsel, fl = this.flare, n = wagen.form.length, k = wagen.polarstern;
    const i = wagen.linien.findIndex(([a, b]) => a === k - 1 && b === k), alle = wagen.linien.map((l) => [...l]);
    H.anteil[i] = 0; // die Linie zur Deichsel gibt es ab jetzt, sie zieht sich erst
    H.glanz[n + i] = 1;
    H.zeige({ wach: H.stand.wach, linien: alle }, H.stand.welt);
    await this.tween(D.zug, (x) => {
      H.anteil[i] = storyEase(x);
      H.glanz[k - 2] = 0.6 * (1 - x); // am Fuss der Deichsel springt er ab (die Strahlen sind schon aus, ascend)
    }, storyLinear, D.ab);
    // der Polarstern flammt auf
    H.zeige({ wach: wagen.form.map((_, j) => j + 1), linien: alle }, null);
    this.amStern = k;
    fl.visible = true;
    fl.material.opacity = 0;
    audio.stern(k);
    this.pulse();
    await this.tween(D.flamme, (x) => {
      const burst = x < 0.15 ? x / 0.15 : Math.exp(-(x - 0.15) * 3);
      fl.material.opacity = Math.min(1, x * 6);
      fl.scale.setScalar(6 + 9 * burst);
      H.glanz[k - 1] = x >= 1 ? 0 : burst;
      H.glanz[n + i] = x >= 1 ? 0 : 1 - x;
    }, storyLinear);
  },
  /**
   * Richtung von der Kamera aus als [Azimut, Höhe] (rad, wie place in travel und enter: x = sin az · cos el, z = cos az
   * · cos el), der Azimut nahe bei um (ohne Sprung über ±π: geradeaus liegt dort).
   */
  winkel(dir, um = null) {
    const az = Math.atan2(dir.x, dir.z), el = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
    return [um === null ? az : um + THREE.MathUtils.euclideanModulo(az - um + Math.PI, 2 * Math.PI) - Math.PI, el];
  },
  /**
   * Der Punkt neben Stern k, an dem das Licht vorbeizieht ([Azimut, Höhe] wie winkel): STORY_FLUG.vorbei Grad vom Stern
   * weg, nach aussen von der Mitte des Wagens.
   */
  vorbeiAn(k, um) {
    const H = himmelsWagen, mitte = new THREE.Vector3();
    for (let i = 1; i <= wagen.form.length; i++) mitte.add(H.richtung(i, _storyDir));
    const [az, el] = this.winkel(H.richtung(k, _storyDir), um), [maz, mel] = this.winkel(mitte.normalize(), um);
    const dx = (az - maz) * Math.cos(el), dy = el - mel, l = Math.hypot(dx, dy) || 1;
    const w = THREE.MathUtils.degToRad(STORY_FLUG.vorbei);
    return [az + dx / l * w / Math.cos(el), el + dy / l * w];
  },
  /**
   * Bogen am Himmel von p0 über p1 nach p2 (je [Azimut, Höhe]): eine quadratische Bézierkurve, die beim Anteil u durch p1
   * geht. Zurück eine Funktion des Anteils t (0 … 1) des Wegs.
   */
  bogen(p0, p1, p2, u) {
    const c = [0, 1].map((i) => (p1[i] - (1 - u) ** 2 * p0[i] - u * u * p2[i]) / (2 * u * (1 - u)));
    return (t) => [0, 1].map((i) => (1 - t) ** 2 * p0[i] + 2 * t * (1 - t) * c[i] + t * t * p2[i]);
  },
  /**
   * In eine Welt hinein ohne Reise davor (nach dem Prolog, beim Fortsetzen): Der Träger, der das Licht hierher bringt
   * (im ersten Kapitel die Glühwürmchen des Prologs, sonst der der Welt davor), fliegt mit ihm von der Seite heran, am
   * schlafenden Stern dieser Welt vorbei, der kurz aufzuckt (Ticket 05 von .scratch/kleiner-wagen/), und es fällt aufs
   * Brett; ins Dorf ohne Träger und ohne Stern, tief über dem Horizont. Dazu der Untertitel mit Kapitel und Leiste wie
   * auf der Reise; über ihm hält das Licht an, bis der Spieler tippt (anhalten, Abnahme Ticket 11), und fällt dann
   * gleichmässig aufs Brett. Bis der Himmel der Welt geladen ist, bleibt die Kamera, wo sie war (nach dem Menü im
   * Himmel der Welt davor); schaut sie schon in den Himmel, schwenkt sie weich zum Licht. sunk: ein altes Feld ist
   * versunken (begin).
   * wie: was der Welt ch sonst entnommen wird (Einstieg ins Dorf: STORY_DORF.einstieg, ohne Träger): kicker, text, path
   * (Station), traeger (STORY_CARRIERS oder null), moment (gesehen, sobald das Level wächst).
   * «Überspringen» oder Esc (Entscheid 10) bis dahin: weich landen (land), ohne Schnitt.
   */
  async enter(index, ch, sunk, wie = {}) {
    prepareLevel(index); // nach «Üben» ein anderes als in begin
    const c = STORY_CHAPTERS.indexOf(ch), fl = this.flare, carrier = this.carrier;
    const { kicker = `Kapitel ${c + 1} · ${ch.title}`, text = ch.travel, path = ch.station,
      traeger = c > 0 ? STORY_CHAPTERS[c - 1].carrier : 'glow', moment = storyChapterId(ch) } = wie;
    const e = this.entering = { skip: false };
    this.himmelStand(); // nach «Üben» das Dorf, nach dem Dorf der Bergwald
    this.fast = 1; // ein Tippen davor (Prolog, Bühne) beschleunigt den Einstieg nicht; Tippen während seiner schon
    await this.skyOf(ch); // übersprungen: trotzdem bis der Himmel da ist (kein leeres Brett unter einem fremden Himmel)
    if (e.skip) { await this.land(index, moment, sunk); return; }
    const up = ch.up ?? STORY_UP, dist = 60, from = this.gaze > 0.5 ? this.gazeDir.clone() : null;
    this.gazeRun++; // ein weicher Blickwechsel (gazeTo) endet hier
    this.aimGaze(up);
    // in eine Welt: von der Seite heran am schlafenden Stern dieser Welt vorbei, der kurz aufzuckt (zucke), und hinab
    // vor die Kamera (STORY_FLUG.einstieg); das Licht steht über dem Untertitel (lichtHoch). Ins Dorf (ohne
    // Stern): tief über dem Horizont heran und erst vor der Kamera etwas höher; auch dort steht das Licht über dem
    // Untertitel in der Mitte (Review Ticket 08: mit hoch 0 lag es gut 3 s hinter dem Text)
    const az1 = Math.atan2(this.gazeDir.x, this.gazeDir.z), side = c % 2 ? 1 : -1, el1 = Math.max(0.2, up - 0.15);
    const F = STORY_FLUG, stern = c >= 0 ? c + 1 : null, hoch = () => this.lichtHoch();
    let weg;
    if (stern) {
      const [azS, elS] = this.winkel(himmelsWagen.richtung(stern, _storyDir), az1);
      weg = this.bogen([azS + side * F.einstieg.von / Math.cos(elS), elS + F.einstieg.hoeher],
        this.vorbeiAn(stern, az1), [az1, el1], F.einstieg.amStern);
    } else {
      const az0 = az1 + side, el0 = Math.max(0.03, up - 0.4);
      weg = (k) => [az0 + (az1 - az0) * k, el0 + (el1 - el0) * k];
    }
    const place = ([az, el]) => fl.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
      .multiplyScalar(dist).add(camera.position);
    place(weg(0));
    fl.visible = true;
    fl.material.opacity = 1;
    fl.scale.setScalar(5);
    carrier.start(traeger, fl.position); // ohne Träger (null): nur der Lichtpunkt
    carrier.strength = 1;
    // aus dem Himmel (Menü): erst noch dorthin, wohin die Kamera schon schaut, dann folgt sie dem Licht
    const follow = (k) => {
      this.look(fl.position, hoch());
      if (from) this.gazeDir.lerp(from, 1 - THREE.MathUtils.smoothstep(k, 0, 0.6)).normalize();
    };
    follow(0);
    this.gaze = 1;
    this.present('caption', this.el.querySelector('.caption'), (el) => this.fillCaption(el,
      { kicker, text, path, tap: IS_TOUCH ? 'Tippen' : 'Klicken', warte: true }));
    let gezuckt = !stern;
    await this.tween(F.einstieg.dauer, (k) => {
      place(weg(k));
      carrier.orb.copy(fl.position);
      follow(k);
      if (!gezuckt && k >= F.einstieg.amStern) { gezuckt = true; this.zucke(stern); }
    }, storyEase, 0, e);
    if (e.skip) { await this.land(index, moment, sunk); return; }
    await this.anhalten(e); // über dem Untertitel, bis der Spieler tippt (Abnahme Ticket 11)
    if (e.skip) { await this.land(index, moment, sunk); return; }
    await sunk;
    if (e.skip) { await this.land(index, moment, sunk); return; }
    await this.fall(index, fl.position.clone(), moment, e);
  },
  /**
   * Der Lichtpunkt fällt von from aufs Brett, die Kamera folgt ihm; ein Träger zerstreut sich, das Level wächst, der
   * Moment (Einstieg in eine Welt, ins Dorf; sonst die Welt des Platzes) ist gesehen. e: im Einstieg (enter) dessen
   * Zustand: Bis das Level wächst, lässt er sich überspringen (land). from: wo das Licht steht (über dem Untertitel).
   * Massgebend ist die Bewegung im Bild (Abnahme Ticket 12): Das Licht fällt dort gleich schnell (nach dem kurzen
   * Anlauf, storyFall; ohne Abbremsen vor dem Brett, Abnahme Ticket 11) von seinem Platz bis dorthin, wo das Brett
   * im Bild steht. Die Kamera dreht sich derweil auf dem Grosskreis vom Himmel aufs Brett, ruhig: anlaufen,
   * gleichmässig, sanft ankommen (STORY_FLUG.fall.kamera). Den Ort des Lichts in der Welt ergeben beide: auf dem Strahl
   * der Kamera durch seinen Punkt im Bild, im Abstand, der von dem am Halt zu dem des Bretts geht (im Kehrwert
   * gleichmässig, wie die Tiefe im Bild). Bis Ticket 11 fiel es in der Welt gleichmässig und die Kamera folgte ihm:
   * Im Bild beschleunigte es, bremste und beschleunigte wieder (gemessen in der Probe, pruefeFallImBild).
   */
  async fall(index, from, moment = storyChapterId(this.chapter()), e = null) {
    const fl = this.flare, carrier = this.carrier, to = new THREE.Vector3(0, BEAM_Y, 0), size = fl.scale.x;
    const F = STORY_FLUG.fall, kamera = storyRampe(...F.kamera), cam = camera.position;
    fl.visible = true;
    fl.material.opacity = 1;
    // Anfang: Blick und Ort im Bild am Halt (die Kamera genau so ausgerichtet, wie gleich gezeichnet wird)
    const von = this.gaze > 0 ? this.gazeDir.clone() : _gazeLook.copy(cameraRig.target).sub(cam).normalize().clone();
    this.gazeRun++; // ein weicher Blickwechsel (gazeTo) endet hier
    this.gaze = 1;
    this.gazeDir.copy(von);
    this.kameraNach(von);
    const s0 = from.clone().project(camera), r0 = from.distanceTo(cam), s1 = new THREE.Vector3();
    const brett = new THREE.Vector3(), dreh = new THREE.Quaternion(), q = new THREE.Quaternion(), keine = q.clone();
    let entered = false, closed = false;
    await this.tween(F.dauer, (t) => {
      const k = storyFall(t), c = kamera(t);
      // wo das Brett im Bild steht, wenn die Kamera ganz unten ist (sie wiegt sich leise, darum je Bild)
      brett.copy(cameraRig.target).sub(cam).normalize();
      this.kameraNach(brett);
      s1.copy(to).project(camera);
      // der Blick dieses Bilds, und das Licht auf dem Strahl durch seinen Punkt im Bild
      dreh.setFromUnitVectors(von, brett);
      this.gazeDir.copy(von).applyQuaternion(q.slerpQuaternions(keine, dreh, c)).normalize();
      this.kameraNach(this.gazeDir);
      const r = 1 / (1 / r0 + (1 / to.distanceTo(cam) - 1 / r0) * k);
      fl.position.lerpVectors(s0, s1, k).setZ(0.5).unproject(camera).sub(cam).normalize().multiplyScalar(r).add(cam);
      fl.scale.setScalar(size + (2 - size) * k);
      fl.material.opacity = 1 - THREE.MathUtils.smoothstep(k, 0.72, 0.95);
      carrier.orb.copy(fl.position);
      carrier.strength = Math.min(carrier.strength, 1 - THREE.MathUtils.smoothstep(k, 0.55, 0.95));
      if (t >= 1) this.gaze = 0; // genau aufs Brett (der Blick ist dort angekommen)
      if (!entered && k > 0.6) {
        entered = true;
        if (e && this.entering === e) { // ab hier nicht mehr zu überspringen
          this.entering = null;
          this.skipRuhe = performance.now() + STORY_SKIP_RUHE;
        }
        enterLevel(index);
        setShown(ui.controls, true); // nach dem Menü wieder da
        this.see(moment); // hier beginnt das erste Level dieser Welt: ihr Einstieg ist gesehen
      }
      if (!closed && k > 0.8) { closed = true; this.close(); } // Untertitel der Reise oder des Einstiegs
    }, storyLinear, 0, e);
    if (!entered) { await this.land(index, moment); return; } // übersprungen, bevor das Level wuchs
    fl.visible = false;
    carrier.stop();
  },
  /**
   * Einstieg übersprungen (Entscheid 10; Vorbild der Prolog: kein Schnitt, nur eine kürzere, weiche Fahrt): Der
   * Untertitel geht zu, Lichtpunkt und Träger blenden in 0,4 s aus, dann senkt sich der Blick aufs Brett, und das Level
   * wächst wie beim Fortsetzen; der Moment ist gesehen. sunk: das alte Feld ist versunken.
   */
  async land(index, moment, sunk = Promise.resolve()) {
    this.entering = null;
    // «Dorf überspringen» erst 2 s nach dem Herauswachsen (wie im Fall), nicht schon während der Landung: Mit dem Warten
    // aufs Versinken und grossen Winkeln dauert sie länger als die Pause
    this.skipRuhe = Infinity;
    this.fast = 1;
    this.landing = true; // Tippen beschleunigt die Landung nicht (sie ist schon die Abkürzung)
    this.close();
    const fl = this.flare, carrier = this.carrier, o = fl.material.opacity, s = carrier.strength;
    this.tween(0.4, (k) => { fl.material.opacity = o * (1 - k); carrier.strength = s * (1 - k); }, storyLinear)
      .then(() => { fl.visible = false; carrier.stop(); });
    await sunk;
    setShown(ui.controls, true);
    // Der Blick dreht sich auf dem Grosskreis von seiner jetzigen Richtung aufs Brett, gleichmässig verteilt (Review
    // Ticket 07). Das lineare Mischen von updateCamera (gaze) zwischen Brett und gazeDir drängte bei einem früh
    // übersprungenen Einstieg (gazeDir 130–150° vom Brett) fast die ganze Drehung in wenige Bilder. Grosse Winkel
    // dauern länger: höchstens etwa 1,3° je Bild bei 60 Bildern/s. Das Level wächst, sobald das Brett ins Bild kommt.
    const brett = _gazeLook.copy(cameraRig.target).sub(camera.position).normalize().clone();
    const von = brett.clone().lerp(this.gazeDir, this.gaze).normalize(), winkel = von.angleTo(brett);
    const dreh = new THREE.Quaternion().setFromUnitVectors(von, brett), q = new THREE.Quaternion(), keine = q.clone();
    const smooth = (k) => k * k * (3 - 2 * k);
    this.gazeRun++; // ein laufender weicher Blickwechsel endet hier
    this.gazeDir.copy(von);
    this.gaze = 1;
    let gewachsen = false;
    await this.tween(1.8 * Math.max(1, winkel / (Math.PI / 2)), (k) => {
      this.gazeDir.copy(von).applyQuaternion(q.slerpQuaternions(keine, dreh, k)).normalize();
      if (!gewachsen && k > 0.25 && (1 - k) * winkel < 1.05 && flow.state === 'story') {
        gewachsen = true;
        this.skipRuhe = performance.now() + STORY_SKIP_RUHE;
        enterLevel(index);
        this.see(moment);
      }
    }, smooth);
    this.gaze = 0;
    this.landing = false;
    if (!gewachsen && flow.state === 'story') { enterLevel(index); this.see(moment); }
    this.skipRuhe = Math.min(this.skipRuhe, performance.now() + STORY_SKIP_RUHE);
  },
  /**
   * «Überspringen» (Knopf #btn-skip) bzw. Esc (taste): den Prolog (sein Knopf auf der Bühne), einen Einstieg (enter
   * landet weich) und, nur mit dem Knopf, das Kapitel «Im Dorf» (dorfEnde). Die Reisen laufen ganz (Entscheid 28).
   */
  skip(taste = false) {
    if (this.scene && !this.scene.skip.hidden) { this.skipProlog(); return; }
    const e = this.entering;
    if (e) {
      if (e.skip) return;
      e.skip = true;
      this.dropTweens(e); // Flug oder Fall halten an, wo sie sind; enter bzw. fall gehen zu land
      e.halt?.(); // ebenso das Licht, das über dem Untertitel wartet (anhalten)
      return;
    }
    if (!taste && this.skippable()) this.dorfEnde('uebersprungen');
  },
  /** Ist «Überspringen» (#btn-skip) jetzt zu sehen: in einem Einstieg und solange das Kapitel «Im Dorf» läuft. */
  skippable() {
    if (this.choosing || this.outside || this.grade === null || flow.state === 'intro') return false;
    if (this.entering) return !this.entering.skip;
    // nach dem Einstieg ins Dorf eine Pause: «Überspringen» wechselt dort die Bedeutung (Einstieg → Kapitel), ein
    // Tippen, das noch den Einstieg meinte, beendet sonst das Dorf (Review Ticket 07)
    if (performance.now() < this.skipRuhe) return false;
    return this.inDorf && this.dorfLaeuft() && !this.endeWartet; // auch beim Wiederholen einer Übung davor
  },
  /** Altes Feld versinken lassen, ohne dass das neue von selbst wächst (updateFlow ruft sunk). */
  sinkTo(index) {
    return new Promise((resolve) => {
      this._sunk = resolve;
      this.holdEnter = true;
      changeLevel(index);
    });
  },
  sunk() {
    this.holdEnter = false;
    flow.state = 'story';
    const resolve = this._sunk;
    this._sunk = null;
    resolve?.();
  },
  /** Bloom kurz hochziehen wie beim Lösen. */
  pulse(anstieg = null) {
    // anstieg: in so vielen s weich am hellsten (Aufprall des Polarsterns, Abnahme Ticket 12), sonst gleich
    const a = anstieg ? anstieg / 1.6 : 0.08;
    return this.tween(1.6, (k) => {
      const env = k < a ? (anstieg ? THREE.MathUtils.smoothstep(k, 0, a) : k / a) : Math.exp(-(k - a) * 4);
      bloomPass.strength = LOOK.bloomStrength * (1 + 1.3 * env * (1 - k));
    }, storyLinear);
  },
  /**
   * Lichtwelle über die Platte (wie beim Lösen, siehe celebration). von, anstieg (Aufprall des Polarsterns, Abnahme
   * Ticket 12): Sie beginnt so hell, wie das Brett schon glüht (von), und wird erst in anstieg s ganz hell.
   */
  shock(color, { von = 1, anstieg = 0 } = {}) {
    shockUniforms.uShockColor.value.copy(color).multiplyScalar(0.6);
    return this.tween(1.5, (k) => {
      const r = k * CELEBRATE.shockReach, fade = 1 - k;
      const hell = anstieg ? von + (1 - von) * THREE.MathUtils.smoothstep(k, 0, anstieg / 1.5) : 1;
      shockUniforms.uShock.value.set(r, k < 1 ? fade * fade * hell : 0, CELEBRATE.shockWidth * (1 + r * 0.12));
    }, storyLinear);
  },

  /* ---------- Untertitel ---------- */

  /**
   * Ein Satz, weiter mit Tippen. waehrend(el): was zum Satz geschieht (Finale), gerufen, sobald er erscheint (el: der
   * Untertitel, schon mit dem Satz gefüllt, wenn vorher keiner stand); erst wenn es fertig ist (Promise), wartet der Satz
   * auf Tippen, bis dahin ohne Aufforderung.
   */
  async caption(text, waehrend = null) {
    const cap = this.el.querySelector('.caption');
    const zeigen = this.present('caption', cap,
      (el) => this.fillCaption(el, { text, tap: IS_TOUCH ? 'Tippen' : 'Klicken', warte: !!waehrend }));
    await Promise.all([zeigen, waehrend?.(cap)]);
    cap.classList.remove('warte');
    await this.untilTap();
  },
  /**
   * Untertitel füllen: Kapitel darüber, Leiste unten am Rand (beides nur bei der Ankunft in einer Welt; dann stehen
   * Kicker und Text in der Mitte, .mitte), Aufforderung zum Tippen. neu: auf der Reise (die Leiste zeigt das Erwachen).
   * warte: die Aufforderung bleibt verborgen (ihr Platz bleibt), bis das, worauf der Satz wartet, fertig ist (Finale)
   * bzw. das Licht über ihm anhält (anhalten).
   */
  fillCaption(el, { kicker = '', text, path, tap = '', neu = false, warte = false }) {
    el.querySelector('.kicker').textContent = kicker;
    el.querySelector('.text').textContent = text;
    el.classList.toggle('mitte', path !== undefined);
    el.classList.toggle('warte', warte);
    this.fillPath(el.querySelector('.path'), path, neu);
    el.querySelector('.tap').textContent = tap;
    this.licht = null; // neu messen (lichtHoch)
  },
  /** Untertitel der Ankunft in der Welt ch auf der Reise (travel; fillCaption). */
  ankunft(ch) {
    return { kicker: `Kapitel ${STORY_CHAPTERS.indexOf(ch) + 1} · ${ch.title}`, text: ch.travel, path: ch.station,
      neu: true, tap: IS_TOUCH ? 'Tippen' : 'Klicken', warte: true };
  },
  /**
   * Ankunft in einer Welt (Abnahme Ticket 11): Das Licht hält über dem Untertitel an, die Aufforderung zum Tippen
   * erscheint, und es geht erst weiter, wenn der Spieler tippt, klickt oder Enter bzw. die Leertaste drückt; kein
   * Zeitablauf. Ein Tippen in den ersten STORY_FLUG.halt s galt noch dem Flug (es machte ihn schneller) und zählt
   * nicht. Das Licht bleibt dabei still im Bild (haltAuf, update). e: Zustand des Einstiegs (enter): «Überspringen»
   * bzw. Esc beenden den Halt ebenso (skip, e.skip).
   */
  async anhalten(e = null) {
    const cap = this.el.querySelector('.caption'), ab = performance.now();
    this.halt = true;
    this.haltAuf = this.flare.position.clone().sub(camera.position);
    this.fast = 1;
    cap.classList.remove('warte');
    while (!e?.skip) {
      const getippt = this.untilTap();
      await (e ? Promise.race([getippt, new Promise((weiter) => { e.halt = weiter; })]) : getippt);
      if (performance.now() - ab >= STORY_FLUG.halt * 1000) break;
    }
    if (e) e.halt = null;
    this.waitTap = null;
    this.halt = false;
    this.haltAuf = null;
    cap.querySelector('.tap').textContent = ''; // getippt: die Aufforderung geht sofort (ohne Höhe, nichts rückt)
  },
  /**
   * So weit über der Mitte des Bilds steht das Licht, solange der Untertitel steht (Anteil der halben Bildhöhe, wie
   * look): bei der Ankunft in einer Welt in der Mitte des freien Raums zwischen oberem Rand und Kicker (Wahl des
   * Nutzers, Ticket 02 von .scratch/kleiner-wagen/), einmal je Untertitel und Grösse des Bilds gemessen; sonst
   * STORY_FLUG.licht.
   */
  lichtHoch() {
    const cap = this.el.querySelector('.caption');
    if (this.el.dataset.mode !== 'caption' || !cap.classList.contains('mitte')) return STORY_FLUG.licht;
    if (this.licht === null || this.lichtBei !== innerHeight) {
      this.licht = this.lichtUeber(this.oberkante(cap).oben);
      this.lichtBei = innerHeight;
    }
    return this.licht;
  },
  /** lichtHoch zu einem Kicker (bzw. Text) mit der Oberkante oben (px). */
  lichtUeber(oben) { return THREE.MathUtils.clamp(1 - oben / innerHeight, 0, 0.9); },
  /** Oberkante (px von oben) des Untertitels cap (cap) und seines Kickers bzw. Texts (oben). */
  oberkante(cap) {
    return { cap: cap.getBoundingClientRect().top,
      oben: (cap.querySelector('.kicker:not(:empty)') ?? cap.querySelector('.text')).getBoundingClientRect().top };
  },
  /**
   * Wo ein Untertitel mit inhalt (wie fillCaption) stünde, bevor er steht (oberkante), gemessen an einer verborgenen
   * Kopie: Der Blick des Aufstiegs kommt schon so an, wie ihn der folgende Untertitel braucht (Abnahme Ticket 11).
   */
  captionVorab(inhalt) {
    const kopie = this.el.querySelector('.caption').cloneNode(true), licht = this.licht;
    this.fillCaption(kopie, inhalt);
    this.licht = licht;
    kopie.classList.remove('swap');
    kopie.style.cssText = 'display: flex; visibility: hidden; pointer-events: none';
    this.el.append(kopie);
    const r = this.oberkante(kopie);
    kopie.remove();
    return r;
  },
  /** lichtHoch für den Untertitel mit inhalt, bevor er steht (captionVorab). */
  lichtFuer(inhalt) { return this.lichtUeber(this.captionVorab(inhalt).oben); },
  /** Untertitel zeigen; ein schon offener wechselt seinen Inhalt mit kurzem Überblenden. */
  async present(mode, el, fill) {
    const shown = !this.el.classList.contains('hidden') && this.el.dataset.mode === mode;
    if (shown) { el.classList.add('swap'); await storySleep(350); }
    fill(el);
    if (!shown) { el.classList.add('swap'); this.open(mode); void el.offsetWidth; }
    el.classList.remove('swap');
    await storySleep(shown ? 350 : 800);
  },
  /**
   * Leiste der Ankunft (Leiste C «Zeichen im Wagen», Ticket 08 von .scratch/kleiner-wagen/): der Kleine Wagen in der
   * Form von wagen.form, an den Sternen der Welten ihre Zeichen (STORY_ICONS), an der Spitze der Polarstern. now:
   * Station, in die das Licht kommt (STORY_STATIONS; Station k ist Stern k, das Dorf 0 hat keinen): die Sterne davor
   * wach und verbunden, der Stern der Welt now mit Ring und Puls, spätere blass. neu (Reise): Der eben geweckte Stern
   * now − 1 blitzt auf, seine Linie(n) ziehen sich. Masse: STORY_LEISTE (CSS-Pixel, die Breite setzt das CSS).
   */
  fillPath(el, now, neu = false) {
    el.replaceChildren();
    if (now === undefined) return;
    const { massstab: s, rand, zeichen: ic } = STORY_LEISTE, form = wagen.form;
    const x0 = Math.min(...form.map((p) => p[0])), y0 = Math.min(...form.map((p) => p[1]));
    const w = (Math.max(...form.map((p) => p[0])) - x0) * s + 2 * rand[0];
    const h = (Math.max(...form.map((p) => p[1])) - y0) * s + 2 * rand[1];
    const P = (k) => [rand[0] + (form[k - 1][0] - x0) * s, rand[1] + (form[k - 1][1] - y0) * s];
    const f = (v) => v.toFixed(1), polar = wagen.polarstern, eben = neu && now > 1 ? now - 1 : 0;
    const wach = (k) => k < now && k !== polar;
    let svg = `<defs><radialGradient id="story-hof"><stop offset="0" stop-color="#fff" stop-opacity="0.8"/>`
      + `<stop offset="0.22" stop-color="#dfe3ff" stop-opacity="0.32"/><stop offset="1" stop-color="#aab4ff" stop-opacity="0"/>`
      + '</radialGradient></defs>';
    for (const [a, b] of wagen.linien) {
      const [ax, ay] = P(a), [bx, by] = P(b), xy = `x1="${f(ax)}" y1="${f(ay)}" x2="${f(bx)}" y2="${f(by)}"`;
      svg += `<line class="wgeist" ${xy}/>`;
      if (wach(a) && wach(b)) {
        const istNeu = a === eben || b === eben, len = Math.hypot(bx - ax, by - ay);
        svg += `<line class="wl${istNeu ? ' neu' : ''}"${istNeu ? ` style="--len:${f(len + 1)}"` : ''} ${xy}/>`;
      }
    }
    const [px, py] = P(polar), r = ic * 0.3;
    svg += `<g transform="translate(${f(px)} ${f(py)})" opacity="0.7"><circle r="${f(ic * 0.9)}" fill="url(#story-hof)" opacity="0.6"/>`
      + `<path d="M0 ${f(-2 * r)}L${f(r * 0.15)} ${f(-r * 0.15)} ${f(r * 1.4)} 0 ${f(r * 0.15)} ${f(r * 0.15)} 0 ${f(2 * r)} ${f(-r * 0.15)} ${f(r * 0.15)} ${f(-r * 1.4)} 0 ${f(-r * 0.15)} ${f(-r * 0.15)}z" fill="#fff"/>`
      + '<circle r="1.6" fill="#fff"/></g>';
    STORY_STATIONS.slice(1).forEach(([icon], i) => {
      const k = i + 1, [x, y] = P(k);
      const cls = wach(k) ? `wach${k === eben ? ' neu' : ''}` : k === now ? 'jetzt' : '';
      svg += `<g class="${cls}" data-k="${k}" transform="translate(${f(x)} ${f(y)})">`
        + `<circle class="hof" r="${f(ic * 1.15)}" fill="url(#story-hof)"/><circle class="ring" r="${f(ic * 0.82)}"/>`
        + `<g class="zeichen" transform="translate(${f(-ic / 2)} ${f(-ic / 2)}) scale(${(ic / 24).toFixed(3)})">`
        + `<circle class="scheibe" cx="12" cy="12" r="14"/>${STORY_ICONS[icon]}</g></g>`;
    });
    el.innerHTML = `<svg viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}" height="${f(h)}" aria-hidden="true">${svg}</svg>`;
  },
  open(mode) {
    this.el.dataset.mode = mode;
    setShown(this.el, true);
    sceneLoop.wake(); // deckt die Bühne nicht mehr (Modus), zeichnet die Szene wieder
  },
  close() {
    const fokus = this.el.contains(document.activeElement);
    setShown(this.el, false);
    sceneLoop.wake(); // aufgedeckt
    if (fokus) this.keepFocus();
  },
  /**
   * Der Fokus fiele auf body, weil sein Knopf eben verschwand (weg; Wahl im Angebot, «Überspringen») oder die
   * Geschichte ausblendet (Review Ticket 07): Er geht auf die Geschichte, solange sie zu sehen ist (Enter tippt, Tab
   * führt zu «Überspringen»), sonst aufs Spielfeld. Ein anderer Fokus bleibt.
   */
  keepFocus(weg = null) {
    const a = document.activeElement;
    if (a && a !== document.body && a !== weg && a.isConnected && !a.closest('[inert]')) return;
    (this.el.classList.contains('hidden') ? renderer.domElement : this.el).focus({ preventScroll: true });
  },
  untilTap() { return new Promise((resolve) => { this.waitTap = resolve; }); },
  /** Tippen/Klicken auf die Geschichte (oder Enter): Karte weiter, in einer Zwischenszene schneller. */
  tap() {
    if (this.choosing) return; // Menü: nur seine Knöpfe
    if (!this.waitTap) {
      if (!this.landing) this.fast = 3; // die Landung (land) nicht: sie ist schon die Abkürzung
      const sc = this.scene;
      if (sc?.moving && sc.speed < 10 && sc.time - sc.movedAt > 0.3) sc.speed = 4; // Kamerafahrt auf der Bühne
      return;
    }
    const resolve = this.waitTap;
    this.waitTap = null;
    this.fast = 1;
    audio.rotate();
    resolve();
  },
  /** Tasten in der Geschichte (das offene Menü nimmt sie vorher, menu.keydown); true: erledigt. */
  keydown(e) {
    if (this.el.classList.contains('hidden') && flow.state !== 'story') return false;
    if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); this.tap(); }
    else if (e.code === 'Escape') this.skip(true); // Prolog oder Einstieg (das Dorf nicht: dort öffnet Esc das Menü)
    return e.code !== 'KeyM';
  },

  /* ---------- Kopfzeile und Meldung ---------- */

  /**
   * Kopfzeile: [«Das Meer – Brandung»] (Kapitel und Level stehen seit dem 09.11.2026 nicht mehr in der Unterzeile);
   * im Dorf [«Im Dorf – Brechung», «Übung 2 / 4»]. Grad und Hinweis: ui.
   */
  hudText(index) {
    if (this.inDorf) {
      return [`${STORY_DORF.title} – ${LEVELS[index].name}`, `Übung ${this.uebung + 1} / ${TUTORIAL_COUNT}`];
    }
    const lvl = LEVELS[index];
    return [`${STORY_CHAPTERS[this.steps[this.step].c].title} – ${lvl.titel ?? lvl.name}`];
  },
  /**
   * Meldung und Knopf nach dem Lösen: im Kapitel «Gelöst» / «Weiter», am Ende der Welt ihr Satz und wohin es geht
   * (beim Wiederholen ebenso, nur ohne Reise); nach dem letzten Level eines geschafften Grads beim Wiederholen zurück
   * in die Übersicht statt ins Finale.
   */
  solvedText() {
    if (this.inDorf) { // nach der letzten Übung in den Bergwald, beim Wiederholen nach dem Kapitel in die Übersicht
      if (this.uebung + 1 < TUTORIAL_COUNT) return ['Gelöst', 'Weiter'];
      return [STORY_DORF.done, this.replay && !this.dorfLaeuft() ? 'Zur Übersicht' : STORY_DORF.next];
    }
    const cur = this.steps[this.step], next = this.steps[this.step + 1], ch = STORY_CHAPTERS[cur.c];
    if (next && next.c === cur.c) return ['Gelöst', 'Weiter'];
    return !next && this.replay && this.stand.geschafft ? [ch.done, 'Zur Übersicht'] : [ch.done, ch.next];
  },

  /* ---------- Zeitachse (läuft mit animate, Zeit der Szene) ---------- */

  /** mark: Marke für dropTweens (Flug und Fall eines Einstiegs: sein Zustand entering). */
  tween(seconds, fn, ease = storyEase, delay = 0, mark = null) {
    sceneLoop.wake(); // ruht die Schleife hinter der Bühne, liefe der Tween nie
    return new Promise((resolve) => {
      this.tweens.push({ t: -delay, s: Math.max(seconds, 1e-6), fn, ease, resolve, mark });
    });
  },
  /**
   * Die Tweens mit der Marke mark abbrechen: Sie verschwinden ohne letzten Schritt (Lichtpunkt und Kamera springen
   * nicht ans Ende), ihre Promise ist erfüllt. Weiche Blickwechsel (gazeTo) und Warten (skyOf, wait) bleiben.
   */
  dropTweens(mark) {
    const weg = this.tweens.filter((tw) => tw.mark === mark);
    this.tweens = this.tweens.filter((tw) => tw.mark !== mark);
    for (const tw of weg) tw.resolve();
  },
  wait(seconds) { return this.tween(seconds, () => {}); },
  update(dt) {
    const skip = this.skippable();
    if (skip !== this.skipShown) {
      this.skipShown = skip;
      // im Dorf sagt der Knopf, was er überspringt (nur beim Einblenden: kein Wechsel vor den Augen)
      if (skip) this.skipBtn.textContent = this.entering ? 'Überspringen' : 'Dorf überspringen';
      setShown(this.skipBtn, skip);
    }
    this.carrier?.update(dt * this.fast);
    // auf dem Stern: Er steht in der Richtung von der Kamera aus, die sich leise bewegt (sonst wanderte das Licht weg)
    if (this.amStern) {
      this.flare.position.copy(camera.position)
        .addScaledVector(himmelsWagen.richtung(this.amStern, _storyDir), STORY_PULS.abstand);
    }
    // im Halt über dem Untertitel ebenso: Es steht still im Bild, auch wenn die Kamera noch gleitet (anhalten)
    if (this.haltAuf) {
      this.flare.position.copy(camera.position).add(this.haltAuf);
      this.carrier?.orb.copy(this.flare.position);
    }
    if (this.blend) this.blendSky();
    if (!this.tweens.length) return;
    const d = dt * this.fast;
    for (const tw of this.tweens.slice()) {
      tw.t += d;
      if (tw.t < 0) continue;
      const k = Math.min(1, tw.t / tw.s);
      tw.fn(tw.ease(k));
      if (k >= 1) { this.tweens.splice(this.tweens.indexOf(tw), 1); tw.resolve(); }
    }
  },

  /* ---------- 3D: Himmelsstrahlen, Lichtpunkt, Träger ---------- */

  /** Alles einmal anlegen, unsichtbar: compileParallel übersetzt beim Start auch Unsichtbares mit. */
  buildScene() {
    const geo = new THREE.CylinderGeometry(0.2, 0.2, 1, 16, 1, true).translate(0, 0.5, 0);
    this.beams = Array.from({ length: 10 }, () => this.makeBeam(geo));
    this.answer = this.makeBeam(geo);
    this.flare = this.makeFlare();
    this.carrier = this.makeCarrier(96);
  },
  /**
   * Träger des Lichts zwischen zwei Welten (STORY_CARRIERS): Punkte, die dem Lichtpunkt (orb) folgen. Jeder Punkt hängt
   * um seine Verzögerung zurück und liegt dort, wo der Lichtpunkt damals war (Verlauf history): So entsteht beim Flug
   * von selbst eine Spur. strength blendet alles ein und aus.
   */
  makeCarrier(count) {
    const geo = new THREE.BufferGeometry();
    for (const [name, size] of [['position', 3], ['aColor', 3], ['aAlpha', 1], ['aSize', 1]]) {
      geo.setAttribute(name, new THREE.BufferAttribute(new Float32Array(count * size), size));
    }
    const mat = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: 1 } },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aAlpha;
        attribute float aSize;
        uniform float uPixelRatio;
        varying vec3 vColor;
        void main() {
          vColor = aColor * aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aAlpha <= 0.0 ? 0.0 : aSize * 260.0 * uPixelRatio / -mv.z;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
          gl_FragColor = vec4(vColor * a * a, 1.0);
        }`,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false,
    });
    const points = new THREE.Points(geo, mat);
    points.visible = false;
    points.frustumCulled = false;
    points.renderOrder = 9;
    points.raycast = () => {};
    points.layers.set(LAYER_NO_REFLECT);
    scene.add(points);
    const rand = mulberry32(31);
    const seeds = Array.from({ length: count }, () => ({ d: rand(), r: rand(), sp: rand(), s: rand(), ph: rand() * Math.PI * 2,
      fl: 2 + rand() * 4, dir: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize() }));
    const history = []; // [Zeit, x, y, z] der letzten 3 s
    const A = geo.attributes;
    return {
      kind: null, t: 0, strength: 0, orb: new THREE.Vector3(),
      start(kind, at) {
        this.kind = STORY_CARRIERS[kind] ?? null;
        this.t = 0;
        this.strength = 0;
        this.orb.copy(at);
        history.length = 0;
        points.visible = !!this.kind;
      },
      stop() { this.kind = null; points.visible = false; },
      update(dt) {
        const K = this.kind;
        if (!K) return;
        this.t += dt;
        history.push([this.t, this.orb.x, this.orb.y, this.orb.z]);
        while (history.length > 2 && history[1][0] < this.t - 3) history.shift();
        const t = this.t, back = (time) => { let i = history.length - 1; while (i > 0 && history[i][0] > time) i--; return history[i]; };
        seeds.forEach((sd, i) => {
          if (i >= K.count) { A.aAlpha.array[i] = 0; return; }
          const [, hx, hy, hz] = back(t - K.delay * sd.d), r = K.radius[0] + (K.radius[1] - K.radius[0]) * sd.r;
          const ang = sd.ph + t * (K.spin ? K.spin[0] + (K.spin[1] - K.spin[0]) * sd.sp : 0);
          let x = hx, y = hy, z = hz, alpha;
          if (K.motion === 'swarm' || K.motion === 'helix') {
            const rr = K.motion === 'helix' ? r * (0.35 + sd.d) : r;
            x += Math.cos(ang) * rr;
            y += Math.sin(ang * 1.3 + sd.ph) * rr * 0.6;
            z += Math.sin(ang) * rr;
            alpha = K.motion === 'swarm' ? 0.5 + 0.5 * Math.sin(t * sd.fl + sd.ph) ** 2 : 1 - 0.7 * sd.d;
          } else {
            const spread = K.motion === 'trail' ? r : r * (K.motion === 'embers' ? 0.3 + sd.d * 2 : 0.15 + sd.d * 1.2);
            x += sd.dir.x * spread;
            y += sd.dir.y * spread + (K.wave ? Math.sin(t * 3 + sd.d * 8) * K.wave : 0) - (K.motion === 'embers' ? 6 * sd.d * sd.d : 0);
            z += sd.dir.z * spread;
            alpha = K.motion === 'comet' ? (1 - sd.d) ** 1.5 : (1 - sd.d) * (0.6 + 0.4 * Math.sin(t * sd.fl * 2 + sd.ph));
          }
          A.position.array.set([x, y, z], i * 3);
          const hot = 1.3 + sd.s * 1.3;
          A.aColor.array.set([K.color[0] * hot, K.color[1] * hot, K.color[2] * hot], i * 3);
          A.aAlpha.array[i] = Math.max(0, alpha) * this.strength;
          A.aSize.array[i] = K.size[0] + (K.size[1] - K.size[0]) * sd.s;
        });
        for (const a of Object.values(A)) a.needsUpdate = true;
        mat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      },
    };
  },
  /** Strahl als leuchtende Röhre (Kern und Hof aus dem Blickwinkel); wächst bis uHead (0 … 1 seiner Länge). */
  makeBeam(geo) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color() }, uHead: { value: 0 }, uTail: { value: 0 },
        uStrength: { value: 1 } },
      vertexShader: `
        varying vec3 vN;
        varying vec3 vV;
        varying vec3 vAxis;
        varying float vY;
        void main() {
          vY = position.y;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vN = normalize(mat3(modelMatrix) * normal);
          vAxis = normalize(mat3(modelMatrix) * vec3(0.0, 1.0, 0.0));
          vV = cameraPosition - wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      // Mitte der Röhre aus Sicht der Kamera: Blickrichtung quer zur Achse (schräg gesehen sonst fast unsichtbar)
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uHead;
        uniform float uTail;
        uniform float uStrength;
        varying vec3 vN;
        varying vec3 vV;
        varying vec3 vAxis;
        varying float vY;
        void main() {
          // auslaufen (story.auslaufen): Das Ende uTail rückt zur Spitze, weich über ein Stück der Länge
          float tail = smoothstep(uTail - 0.2, uTail, vY);
          if (vY > uHead || tail <= 0.0) discard;
          vec3 v = normalize(vV), axis = normalize(vAxis);
          vec3 across = v - axis * dot(v, axis);
          float l = length(across);
          float f = l > 1e-4 ? abs(dot(normalize(vN), across / l)) : 1.0;
          float profile = pow(f, 18.0) * 3.2 + pow(f, 4.0) * 0.4;
          vec3 color = mix(uColor, vec3(1.0), pow(f, 30.0) * 0.75); // weisslicher Kern
          float head = 1.0 + 3.0 * exp(-(uHead - vY) * 60.0);
          gl_FragColor = vec4(color * profile * head * smoothstep(0.0, 0.01, vY) * tail * uStrength, 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    mesh.frustumCulled = false;
    mesh.raycast = () => {};
    mesh.layers.set(LAYER_NO_REFLECT);
    scene.add(mesh);
    return mesh;
  },
  aim(beam, from, to, color) {
    const dir = _storyDir.copy(to).sub(from), len = dir.length();
    beam.position.copy(from);
    beam.quaternion.setFromUnitVectors(Y_AXIS, dir.normalize());
    beam.scale.set(1, len, 1);
    const u = beam.material.uniforms;
    u.uColor.value.copy(color);
    u.uHead.value = 0;
    u.uStrength.value = 1;
    u.uTail.value = 0;
    beam.visible = true;
  },
  /**
   * Lichtpunkt am Himmel (Ziel der Strahlen beim Stern der Welt, dann das getragene Licht, im Finale zuletzt auf dem
   * Polarstern): weicher Hof mit vier kurzen Strahlen, die sich zur Spitze hin verjüngen, dazwischen vier schwache;
   * leicht gedreht. Feine Linien quer durchs Bild wirkten wie ein Fadenkreuz.
   */
  makeFlare() {
    const size = 256, h = size / 2, c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(h, h, 0, h, h, h);
    // weich auslaufend: ohne sichtbaren Rand (sonst wirkt der Hof wie eine Scheibe)
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.05, 'rgba(255,255,255,0.85)');
    r.addColorStop(0.1, 'rgba(235,238,255,0.45)');
    r.addColorStop(0.18, 'rgba(220,226,255,0.18)');
    r.addColorStop(0.3, 'rgba(210,218,255,0.06)');
    r.addColorStop(0.5, 'rgba(200,210,255,0.015)');
    r.addColorStop(1, 'rgba(200,210,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, size, size);
    g.globalCompositeOperation = 'lighter';
    const ray = (angle, length, width, alpha) => {
      g.save();
      g.translate(h, h);
      g.rotate(angle);
      const l = g.createLinearGradient(0, 0, length, 0);
      l.addColorStop(0, `rgba(255,255,255,${alpha})`);
      l.addColorStop(0.35, `rgba(235,240,255,${alpha * 0.4})`);
      l.addColorStop(1, 'rgba(235,240,255,0)');
      g.fillStyle = l;
      g.beginPath();
      g.moveTo(0, -width);
      g.lineTo(length, 0);
      g.lineTo(0, width);
      g.closePath();
      g.fill();
      g.restore();
    };
    for (let k = 0; k < 4; k++) ray(0.21 + k * Math.PI / 2, h * 0.7, 3.4, 0.9);
    for (let k = 0; k < 4; k++) ray(0.21 + Math.PI / 4 + k * Math.PI / 2, h * 0.3, 1.8, 0.4);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    const mat = new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(2.4, 2.4, 2.4), transparent: true, depthWrite: false,
      depthTest: false, blending: THREE.AdditiveBlending, fog: false });
    const s = new THREE.Sprite(mat);
    s.visible = false;
    s.renderOrder = 10;
    s.raycast = () => {};
    s.layers.set(LAYER_NO_REFLECT);
    scene.add(s);
    return s;
  },
};
const _storyDir = new THREE.Vector3(), _storyHead = new THREE.Vector3();
story.init();

/* ---------- Tasten ----------
   R: neu starten · M: Ton · Esc: Menü · L: Übersicht · Enter: weiter (nach dem Lösen) bzw. Start; im Menü Tab,
   Pfeile, Pos1/Ende, Enter (menu.keydown), Esc zurück ins Spiel (story.back); in der Übersicht Pfeile, Pos1/Ende,
   Bild↑/↓, Tab, Enter und Esc (createUebersicht fängt sie ab), L schliesst sie; in den Zwischenszenen
   Enter/Leertaste weiter, Esc überspringt den Prolog und die Einstiege (story.keydown); im Dorf öffnet Esc das Menü
   wie in jedem Level (das Kapitel überspringt nur der Knopf).
   Level und Hintergrund wählt die Geschichte (Entscheide 21 und 26). C (Debug): Farbe der Quellen wechseln */

/**
 * Nach dem Start mit Enter oder Leertaste hat ein Knopf des Menüs gleich den Fokus: Die gehaltene Taste löste sonst
 * seinen Klick aus, bei Enter die Wiederholung des Drückens, bei der Leertaste das Loslassen (ohne Wahl in den Prolog
 * von «Leicht» oder weiter). Bis zum Loslassen gehört sie niemandem; ein neues Drücken (Loslassen verpasst, etwa in
 * einem anderen Fenster) gibt sie wieder frei.
 */
function holdUntilRelease(code) {
  const halt = (u) => {
    if (u.code !== code) return;
    const done = u.type === 'keyup' || !u.repeat;
    if (done) { removeEventListener('keydown', halt, true); removeEventListener('keyup', halt, true); }
    if (u.type === 'keydown' && !u.repeat) return; // neu gedrückt: wieder wie sonst
    u.preventDefault();
    u.stopImmediatePropagation();
  };
  addEventListener('keydown', halt, true);
  addEventListener('keyup', halt, true);
}

window.addEventListener('keydown', (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  // Enter/Leertaste auf einer Schaltfläche löst deren Klick aus – nicht zusätzlich hier
  if ((e.code === 'Enter' || e.code === 'Space') && e.target.closest?.('button')) return;
  if (flow.state === 'intro') {
    if (e.code !== 'Enter' && e.code !== 'Space') return;
    e.preventDefault();
    ui.start();
    if (flow.state !== 'intro') holdUntilRelease(e.code);
    return;
  }
  // offene Übersicht: ihre Tasten nimmt sie selbst (Capture), R usw. wirken nicht aufs Feld darunter; L schliesst
  if (uebersicht.offen) {
    if (e.code === 'KeyM') ui.toggleSound();
    else if (e.code === 'KeyL') story.closeOverview();
    return;
  }
  // offenes Menü: R, Pfeile usw. bedienen nicht das Feld darunter; Esc führt zurück ins Spiel, wenn es von dort kam
  if (menu.offen) {
    if (menu.keydown(e)) return;
    if (e.code === 'KeyM') ui.toggleSound();
    else if (e.code === 'Escape') story.back();
    return;
  }
  if (story.keydown(e)) return;
  if (e.code === 'KeyM') ui.toggleSound();
  else if (e.code === 'Escape') story.toMenu();
  else if (e.code === 'KeyL') story.toOverview();
  else if (e.code === 'Enter' && ui.solvedVisible()) {
    e.preventDefault();
    ui.advance();
  } else if (e.code === 'KeyR') {
    restartLevel();
  } else if (e.code === 'KeyC') {
    if (flow.state !== 'play') return;
    const cycle = [7, 1, 2, 4, 3, 5, 6];
    for (const el of game.board.elements) {
      if (el.type !== 'source') continue;
      el.color = cycle[(cycle.indexOf(el.color) + 1) % cycle.length];
      game.objects.get(el.id).userData.lens.material.color.copy(COLOR_RGB[el.color]).multiplyScalar(5.5);
    }
    recomputeBeams();
  }
});

// ?nointro: direkt ins Spiel (Screenshot-Tests)
if (new URLSearchParams(location.search).has('nointro')) { ui.canStart = true; ui.start(false); markIntroCalm(); }


/* =====================================================================
   RESIZE & LOOP
   ===================================================================== */

/** Sichtfeld der Kamera (Grad, senkrecht) im Format aspect: im Hochformat weiter statt riesiger Distanz. */
function kameraSichtfeld(aspect) { return aspect < 1 ? 44 : 32; }

function onResize() {
  // Grösse des Bilds in Pixeln der Oberfläche: das Canvas liegt im vergrösserten body (SEITE); Pixelverhältnis wie vorher
  const w = seiteBreite(), h = seiteHoehe();
  camera.aspect = w / h;
  camera.fov = kameraSichtfeld(camera.aspect);
  camera.updateProjectionMatrix();
  fitCameraDistance();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  const pr = renderer.getPixelRatio();
  reflector.getRenderTarget().setSize(
    Math.round(w * pr * QUALITY.reflectionScale),
    Math.round(h * pr * QUALITY.reflectionScale)
  );
  finalPass.uniforms.uResolution.value.set(w * pr, h * pr);
  reflLodShift.value = Math.max(0, Math.log2(pr));
}
window.addEventListener('resize', onResize);
onResize();

const clock = new THREE.Clock();
/**
 * Zeit der Animationen (s) zu einem rAF-Zeitstempel ts (frame): Die Uhr beim Start des Callbacks lief um den Verzug
 * des Callbacks nach dem Bildschirmtakt verschieden weit (andere Arbeit davor, auf dem Handy mehrere ms), bewegte
 * Dinge wie die Fische machten dann ungleiche Schritte (Spec .scratch/leistung/, Ticket 17). Der Zeitstempel des
 * Bildschirmbilds ist gleichmässig. Ohne ts (Aufwärmen, Wecken der Strahlen) gilt die Uhr; nie rückwärts, sonst
 * begänne etwa die Simulation der Fische neu (createFishSim).
 */
const sceneTime = {
  t: 0,
  at(ts = performance.now()) {
    clock.getElapsedTime(); // startet die Uhr beim ersten Aufruf (startTime)
    return (this.t = Math.max(this.t, (ts - clock.startTime) / 1000));
  },
};

/**
 * Adaptive Auflösung: misst die echte Frame-Zeit und senkt die Renderauflösung, sobald 60 FPS
 * nicht gehalten werden; steigt vorsichtig wieder, wenn Luft ist. Gescheiterte Stufen werden
 * gemerkt, damit die Auflösung nicht hin und her pendelt.
 */
const adaptiveResolution = {
  scale: 1,
  minPixelRatio: IS_MOBILE ? 1 : 0.8, // nie darunter (echte Pixel pro CSS-Pixel) – sonst wird es zu unscharf
  ceiling: 1,           // höchste Stufe, die zuletzt flüssig lief
  window: 0, slow: 0, frames: 0, // Messfenster (Sekunden), Frames über Budget, Frames gesamt
  calm: 0, cooldown: 1.5, last: performance.now(),
  probe: null,          // läuft gerade eine Absenkung zur Probe?
  locked: false,        // Absenken bringt nichts (z. B. 30-Hz-Sparmodus, CPU-Engpass)
  skip: 0,              // so viele Bilder nicht werten (verdeckt gezeichnete Bilder, das erste nach dem Ruhen, siehe draw)
  // ?noadapt: feste Auflösung (für Screenshot-Tests im langsamen Software-Rendering)
  disabled: new URLSearchParams(location.search).has('noadapt'),

  get min() { return Math.min(1, this.minPixelRatio / QUALITY.pixelRatio); },

  /** Kurze Schonfrist, z. B. nach Levelstart (Shader-Kompilierung erzeugt einzelne lange Frames). */
  hold(seconds = 1.5) { this.cooldown = Math.max(this.cooldown, seconds); this.window = this.slow = this.frames = 0; },

  /** gap: angestrebter Abstand zweier Bilder in ms (frameRate) – bei 30 Bildern/s ist ein Bild nach 33 ms nicht zu langsam. */
  tick(gap = 1000 / 60) {
    if (this.disabled) return;
    const now = performance.now();
    const ms = now - this.last;
    this.last = now;
    if (this.skip > 0) { this.skip--; return; } // weder Fenster noch Zähler, Schonfrist oder Ruhe: wie ohne Messung
    if (ms > 100) return; // Tab war im Hintergrund
    const sec = ms / 1000;
    if (this.cooldown > 0) { this.cooldown -= sec; return; }
    // Während die Kamera gezogen wird nie umbauen (jeder Umbau ist ein kurzer Hänger)
    if (drag.active) { this.window = this.slow = this.frames = 0; return; }

    this.window += sec; this.frames++;
    if (ms > Math.max(20, gap * 1.25)) this.slow++;
    this.calm = ms < Math.max(18, gap * 1.1) ? this.calm + sec : 0;
    // Nach 30 s ruhigem Betrieb darf die Obergrenze wieder steigen
    if (this.calm > 30 && this.ceiling < 1) { this.ceiling = Math.min(1, this.ceiling + 0.05); this.calm = 0; }
    if (this.window < 2) return; // zwei Sekunden messen, bevor etwas umgebaut wird

    const overload = this.slow / this.frames; // Anteil Frames über Budget in der letzten Sekunde
    this.window = this.slow = this.frames = 0;

    if (this.probe) {
      // Hat die letzte Absenkung geholfen? Sonst zurück und Absenken sperren.
      if (overload > this.probe.overload * 0.8) { this.locked = true; this.set(this.probe.from); }
      this.probe = null;
      return;
    }
    if (overload > 0.3 && !this.locked && this.scale > this.min + 1e-3) {
      this.ceiling = Math.max(this.min, this.scale - 0.05);
      this.probe = { from: this.scale, overload };
      this.set(this.scale - (IS_MOBILE ? 0.25 : 0.12)); // Handy: schneller herunter, sonst ruckelt es lange
    } else if (overload < 0.05 && this.calm > 8 && !drag.active && this.scale < this.ceiling) {
      this.set(Math.min(this.ceiling, this.scale + 0.08));
    }
  },

  set(scale) {
    this.scale = Math.max(this.min, Math.min(1, scale));
    const pr = QUALITY.pixelRatio * this.scale;
    this.changes = (this.changes || 0) + 1;
    renderer.setPixelRatio(pr);
    composer._pixelRatio = pr; // nicht setPixelRatio(): das baut alle Puffer neu, onResize gleich nochmal
    onResize();
    this.hold(0.6);
    this.calm = 0;
  },
};

const REFLECT_GLOW_DIM = 0.3; // Leuchtkörper erscheinen in der Spiegelung gedämpft (wie die Strahlen)
// Platte im Bild? Sonst braucht niemand die Spiegelung (Menü und Übersicht: Der Blick hebt sich in den Himmel); im
// ersten Bild, in dem die Platte wieder auftaucht, ist sie schon neu
const _reflectFrustum = new THREE.Frustum(), _reflectViewProj = new THREE.Matrix4();
const _reflectPlate = new THREE.Box3(new THREE.Vector3(-PLATE / 2, -0.01, -PLATE / 2), new THREE.Vector3(PLATE / 2, 0.01, PLATE / 2));
const _reflectDimmed = []; // gedämpfte Ziele (userData) dieses Bilds; ihre Werte in userData.reflectSave (ohne Allokation)

/** Zeichnet renderReflection gerade etwas (eingeschaltet und die Platte im Bild)? */
function reflectionInView() {
  if (!QUALITY.reflections) return false;
  camera.updateMatrixWorld();
  _reflectFrustum.setFromProjectionMatrix(_reflectViewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
  return _reflectFrustum.intersectsBox(_reflectPlate);
}

/**
 * Mipmaps der Spiegelung nur bis zur Stufe, die der Boden liest (Ticket 11): Er tastet mit Stufe 1 … 2,2 plus log2 des
 * Pixelverhältnisses ab; weil die Textur kleiner als das Bild ist, landet das auf etwa 0,5 … 1,7 (Handy) bzw. −0,7 … 0,5
 * (Desktop). Bis Stufe 4 bleibt also alles gleich; die fünf, sechs kleinsten Stufen erzeugte jedes Bild umsonst (auf
 * Kachel-GPUs je ein eigener Durchgang). Je Bild, weil setSize das Ziel neu anlegt.
 */
const REFLECT_MAX_MIP = 4;
function limitReflectionMips() {
  const tex = renderer.properties.get(reflector.getRenderTarget().texture).__webglTexture;
  if (!tex || !renderer.capabilities.isWebGL2) return; // noch nicht angelegt (erstes Bild: ganze Kette wie bisher)
  const gl = renderer.getContext();
  renderer.state.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, REFLECT_MAX_MIP);
}

function renderReflection() {
  // spiegelnde Oberflächen der gezeigten Bretter (beim Überblenden beide; leer: keines spiegelt), alle in y = 0; in
  // Welten ohne Spiegelung (boardReflection 0) nichts, weder Spiegelbild noch Mipmaps
  const mirrors = boardTheme.mirrors, mirror = mirrors[0];
  if (!mirror || !(boardReflection.uniform.value > 0) || !reflectionInView()) return;
  mirror.updateMatrixWorld();
  reflector.matrixWorld.copy(mirror.matrixWorld);

  for (const m of mirrors) m.visible = false; // verhindert Feedback-Loop (die Oberfläche liest die Textur, in die gerendert wird)
  const backgroundVisible = background.visible;
  background.visible = false; // gespiegelt nur ein bläulicher Fleck; ein dunkler Raum spiegelt sich schwarz
  // Gespiegelte Strahlen weich und ohne dünnen Kern: der würde in der niedrig aufgelösten
  // Spiegelung zur Treppenlinie – und auf poliertem Stein ist ein Spiegelbild ohnehin weich.
  // Ohne Fliessen und Pakete: Ihr Auf und Ab zerfiel in der kleinen, weichgezeichneten Textur zu wandernden Flecken.
  const bu = beamMaterial.uniforms;
  const core = bu.uCore.value, glow = bu.uGlow.value, intensity = bu.uIntensity.value;
  bu.uCore.value = 0.045; bu.uGlow.value = 0.09; bu.uIntensity.value = 0.45; bu.uCalm.value = 1;
  // Leuchtende Edelsteine ebenso gedämpft spiegeln: ihr HDR-Kern würde sonst als harte, weisse Kontur erscheinen
  // (Werte sichern und exakt wiederherstellen – kein Teilen, damit sich nichts aufschaukeln kann)
  for (const obj of game.objects.values()) {
    const u = obj.userData;
    if (u.element.type !== 'target') continue;
    const save = u.reflectSave ??= { core: new THREE.Color(), emissive: 0 };
    save.core.copy(u.core.material.color);
    save.emissive = u.gem.material.emissiveIntensity;
    _reflectDimmed.push(u);
    u.core.material.color.multiplyScalar(REFLECT_GLOW_DIM);
    u.gem.material.emissiveIntensity *= REFLECT_GLOW_DIM;
  }
  // Beim Auflösen des MSAA nur die Farbe kopieren, Tiefe und Stencil verwerfen (three: __ignoreDepthValues): Gelesen
  // wird nur die Farbe, Kachel-GPUs sparen das Speichern und Kopieren der Tiefe (Ticket 11). Je Bild, weil setSize das
  // Ziel neu anlegt und dabei die Eigenschaften vergisst
  renderer.properties.get(reflector.getRenderTarget()).__ignoreDepthValues = true;
  limitReflectionMips();
  reflector.onBeforeRender(renderer, scene, camera);
  for (const u of _reflectDimmed) {
    u.core.material.color.copy(u.reflectSave.core);
    u.gem.material.emissiveIntensity = u.reflectSave.emissive;
  }
  _reflectDimmed.length = 0;
  bu.uCore.value = core; bu.uGlow.value = glow; bu.uIntensity.value = intensity; bu.uCalm.value = 0;
  background.visible = backgroundVisible;
  for (const m of mirrors) m.visible = true;
}

/* ---------- Messwerkzeug (Spec .scratch/leistung/, Ticket 01) ---------- */

// Abschnitte der Messung: Kennung → [Name auf der Karte, Laden (zählt nicht gegen die Grenzwerte)]
const MESS_ABSCHNITTE = {
  seitenstart: ['Seitenstart', true], // bis die Enthüllung des Startbildschirms beginnt: Die Seite lädt
  laden: ['Laden', true],             // Laden hinter einer Überblendung, vom Code markiert (leistung.markiere('laden'))
  start: ['Startbildschirm'], menue: ['Menü'], uebersicht: ['Übersicht'], prolog: ['Prolog'], einstieg: ['Einstieg'],
  spiel: ['Spiel'], reise: ['Reise'], weltwechsel: ['Weltwechsel'], ankunft: ['Spiel n. Reise'], finale: ['Finale'],
  epilog: ['Epilog'],
};
// Grenzwerte der Spec: p95 der sichtbaren Bildabstände ≤ 16,7 ms mit 10 % Toleranz (rAF-Zeitstempel schwanken), kein
// Bild über 33 ms; auf dem Handy (Poco) p95 der Zeichenzeit ≤ 8 ms bei 60 Bildern/s, mit ?takt=30 (stetige 30 wie unter
// ADR 0006) dieselbe Reserve: ≤ 16 ms
const MESS_GRENZE = { p95: 18.3, bild: 33, get zeichnen() { return frameRate.spielFps <= 30 ? 16 : 8; } };
const MESS_FACH = 0.1, MESS_FAECHER = 2000; // Histogramm: Fächer zu 0,1 ms bis 200 ms, darüber im letzten (max genau)

/**
 * Misst, was man sieht, nicht nur die WebGL-Bilder (perfHud): Eine eigene, leichte rAF-Schleife (starte) misst den
 * Abstand aufeinanderfolgender Display-Frames, unabhängig von frameRate und frame(); ruht die Szene, misst sie weiter. Sie
 * läuft nur mit ?perf oder nach Taste F. Getrennt nach Abschnitten (abschnitt: Startbildschirm,
 * Prolog, Menü, Spiel, Reise …): Ein Abstand zählt zum Abschnitt an seinem Anfang (der Hänger nach dem Klick auf
 * «Klicken zum Starten» gehört zum Startbildschirm). Einstieg, Reise, Weltwechsel und Finale markiert die Geschichte
 * (waehrend), Laden hinter einer Überblendung markiert der Code mit markiere('laden') bzw. waehrend('laden', promise):
 * Es wird getrennt ausgewiesen und zählt nicht gegen die Grenzwerte. Die Messung verfälscht nichts merklich: Histogramme
 * mit festen Fächern (genaue p95 ohne Liste aller Abstände) und ein Ringpuffer für die Anzeige, keine Allokationen pro
 * Bild. Dazu Hänger des Hauptthreads mit Ursache (PerformanceObserver: long-animation-frame, longtask).
 * Zeichenzeit (bildBeginn … bildEnde in frame()): die GPU-Zeit je gerendertem Bild über EXT_disjoint_timer_query_webgl2
 * (fehlt die Erweiterung, wie auf vielen Android-Geräten, bleibt sie leer). Dazu die CPU-Zeit von frame() und die
 * gezeichneten Bilder je Sekunde, auch nur in ruhigen Zeiten (ohne Tweens, ohne Einblenden des Himmels). Die Proben
 * lesen die Werte über window.__prisma.leistung.daten(). Den Referenzdurchlauf mit Ergebniskarte und Dauerlast (Tickets
 * 01 und 08 der Leistung) gibt es nicht mehr (ADR 0008).
 */
const leistung = {
  aktiv: false,
  schleife: 0,        // Nummer der laufenden Messschleife (starte, stoppe)
  prev: null,        // rAF-Zeitstempel des letzten Display-Frames (null: neu anfangen, etwa nach verstecktem Tab)
  teil: null,         // Messwerte des Abschnitts ab dem letzten Frame (neuerTeil)
  teile: new Map(),   // Kennung → Messwerte, in der Reihenfolge des ersten Auftretens
  wechsel: [],        // [Zeit, Kennung] je Abschnittswechsel: Hänger kommen erst später an (teilBei)
  marken: [],         // Abschnitte, die der Code markiert (markiere), der jüngste gilt
  ladend: 0,          // markiertes Laden hinter einer Überblendung (geht allen Abschnitten vor)
  ring: new Float32Array(256), ringPos: 0, ringN: 0, sortiert: new Float32Array(256), // Anzeige: jüngste Abstände (Takt)
  schlimmste: [],     // die längsten Abstände { ms, id, t }
  haenger: [],        // die längsten long-animation-frames { ms, id, t, ursache }
  hudZeit: 0,
  gl: null, timer: null, abfragen: [], abfrageNeu: 0, abfrageAlt: 0, abfrageLaeuft: false, // GPU-Zeit
  ruhig: false,       // beim letzten Display-Frame: keine Tweens, der Himmel blendet nicht ein (gez/s ruhig)
  modell: '',         // Gerät laut navigator.userAgentData (Android: Modell), sobald bekannt

  starte() {
    if (this.aktiv) return;
    this.aktiv = true;
    this.prev = null;
    // je Start eine eigene Schleife: Eine alte, die nach stoppe noch ein Bild wartet, endet dort
    const nr = ++this.schleife, loop = (ts) => {
      if (nr !== this.schleife) return;
      this.tick(ts);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    if (this.gl) return; // eingerichtet beim ersten Start
    this.gl = renderer.getContext();
    this.timer = this.gl.getExtension('EXT_disjoint_timer_query_webgl2');
    if (this.timer) for (let i = 0; i < 8; i++) this.abfragen.push({ q: this.gl.createQuery(), teil: null, offen: false });
    document.addEventListener('visibilitychange', () => { this.prev = null; });
    const typen = window.PerformanceObserver?.supportedEntryTypes ?? [];
    if (typen.includes('long-animation-frame')) {
      new PerformanceObserver((l) => { if (this.aktiv) l.getEntries().forEach((e) => this.haenger1(e)); })
        .observe({ type: 'long-animation-frame', buffered: true });
    }
    if (typen.includes('longtask')) {
      new PerformanceObserver((l) => {
        if (this.aktiv) l.getEntries().forEach((e) => { this.teilBei(e.startTime).longtasks++; });
      })
        .observe({ type: 'longtask', buffered: true });
    }
    navigator.userAgentData?.getHighEntropyValues?.(['model', 'platformVersion'])
      .then((d) => { this.modell = [d.platform, d.platformVersion, d.model].filter(Boolean).join(' '); })
      .catch(() => {});
  },
  /** Taste F blendet die Anzeige aus: Dann ruht auch die Messung (keine Kosten). */
  stoppe() {
    this.aktiv = false;
    this.schleife++;
  },
  /** Ein Display-Frame: den Abstand zum letzten dem Abschnitt an dessen Anfang zuschlagen. */
  tick(ts) {
    const id = this.abschnitt();
    if (this.prev !== null && this.teil) {
      this.abstand(this.teil, ts - this.prev, ts);
      if (this.ruhig) this.teil.ruhigMs += ts - this.prev;
    }
    if (this.teil?.id !== id) { this.teil = this.neuerTeil(id); this.wechsel.push([ts, id]); }
    this.prev = ts;
    // ruhig: Es läuft keine Fahrt (Tween) und der Himmel blendet nicht ein oder über (gez/s ruhig: wie viel die Szene
    // zeichnet, wenn sich nichts tut; das Menü zeichnet beim Hineinfahren und beim Einblenden des Himmels 60/s, still 10/s)
    this.ruhig = !story.tweens.length && !skyTheme.moving;
    if (ts - this.hudZeit >= 500) {
      this.hudZeit = ts;
      perfHud.zeige();
    }
  },
  /** Welcher Abschnitt gerade zu sehen ist (nur Lesen von Zuständen, je Display-Frame). */
  abschnitt() {
    if (this.ladend) return 'laden';
    if (flow.state === 'intro') return ui.intro.classList.contains('go') ? 'start' : 'seitenstart';
    if (story.choosing) return uebersicht.offen ? 'uebersicht' : 'menue';
    // die Bühne: Prolog (mit Angebot) oder Epilog (der Grad ist dann schon geschafft, ending)
    if (story.el.dataset.mode === 'scene' && !story.el.classList.contains('hidden')) {
      return story.stand?.geschafft ? 'epilog' : 'prolog';
    }
    return this.marken.length ? this.marken[this.marken.length - 1] : 'spiel';
  },
  /** Abschnitt id markieren, bis die zurückgegebene Funktion aufgerufen wird ('laden': Laden hinter Überblendung). */
  markiere(id) {
    let aus = false;
    if (id === 'laden') {
      this.ladend++;
      return () => { if (!aus) { aus = true; this.ladend--; } };
    }
    this.marken.push(id);
    return () => {
      if (aus) return;
      aus = true;
      const i = this.marken.lastIndexOf(id);
      if (i >= 0) this.marken.splice(i, 1);
    };
  },
  /** Abschnitt id markieren, bis promise erledigt ist; zurück das Promise (wartet wie das ursprüngliche). */
  waehrend(id, promise) { return promise.finally(this.markiere(id)); },

  reihe: () => ({ fach: new Uint32Array(MESS_FAECHER), n: 0, summe: 0, max: 0 }),
  neuerTeil(id) {
    let t = this.teile.get(id);
    if (!t) {
      t = { id, bild: this.reihe(), zeichnen: this.reihe(), cpu: this.reihe(), ueber: 0, gezeichnet: 0, haenger: 0,
        haengerMax: 0, longtasks: 0,
        ruhigMs: 0, gezRuhig: 0 }; // Zeit und gezeichnete Bilder, solange es ruhig war (tick)
      this.teile.set(id, t);
    }
    return t;
  },
  eintragen(r, ms) {
    r.fach[Math.min(MESS_FAECHER - 1, Math.floor(ms / MESS_FACH))]++;
    r.n++;
    r.summe += ms;
    if (ms > r.max) r.max = ms;
  },
  /** Quantil q einer Reihe (obere Kante des Fachs, höchstens max); leer: null. */
  quantil(r, q) {
    if (!r.n) return null;
    const ziel = Math.ceil(r.n * q);
    for (let i = 0, s = 0; i < MESS_FAECHER; i++) {
      s += r.fach[i];
      if (s >= ziel) return i === MESS_FAECHER - 1 ? r.max : Math.min((i + 1) * MESS_FACH, r.max);
    }
    return r.max;
  },
  abstand(teil, ms, ts) {
    this.eintragen(teil.bild, ms);
    this.ring[this.ringPos] = ms;
    this.ringPos = (this.ringPos + 1) % this.ring.length;
    this.ringN++;
    if (ms <= MESS_GRENZE.bild) return;
    teil.ueber++;
    this.bestenliste(this.schlimmste, { ms, id: teil.id, t: ts - ms });
  },
  /** liste: die 8 längsten Einträge (nach ms) behalten. */
  bestenliste(liste, eintrag) {
    liste.push(eintrag);
    liste.sort((a, b) => b.ms - a.ms);
    if (liste.length > 8) liste.length = 8;
  },
  /** Abschnitt zur Zeit t (performance.now) aus den Wechseln; davor der erste. */
  teilBei(t) {
    for (let i = this.wechsel.length - 1; i >= 0; i--) if (this.wechsel[i][0] <= t) return this.teile.get(this.wechsel[i][1]);
    return this.teile.get(this.wechsel[0]?.[1]) ?? this.neuerTeil(this.abschnitt());
  },
  /** Ein long-animation-frame (über 50 ms): zählen und mit Ursache merken (längstes Script, sonst Stil und Layout). */
  haenger1(e) {
    const teil = this.teilBei(e.startTime);
    teil.haenger++;
    teil.haengerMax = Math.max(teil.haengerMax, e.duration);
    const s = [...(e.scripts ?? [])].sort((a, b) => b.duration - a.duration)[0];
    const render = e.renderStart > 0 ? e.startTime + e.duration - e.renderStart : 0;
    const datei = (s?.sourceURL || '').replace(/[?#].*$/, '').split('/').pop();
    const ursache = s
      ? `${s.invoker || s.invokerType}${s.sourceFunctionName ? ` → ${s.sourceFunctionName}` : ''}`
        + `${datei ? ` (${datei}${s.sourceCharPosition >= 0 ? `:${s.sourceCharPosition}` : ''})` : ''}`
        + `: Script ${Math.round(s.duration)} ms, Rendern ${Math.round(render)} ms`
      : `ohne Script, Rendern ${Math.round(render)} ms`;
    this.bestenliste(this.haenger, { ms: e.duration, id: teil.id, t: e.startTime, ursache });
  },

  /** Beginn eines gerenderten Bilds in frame(): Startzeit (0: Messung aus). */
  bildBeginn() { return this.aktiv ? performance.now() : 0; },
  /** Vor dem ersten Zeichnen in frame(): GPU-Zeit messen (fertige Abfragen vorher auslesen). */
  gpuBeginn() {
    if (!this.aktiv || !this.timer || !this.teil) return;
    this.abfragenLesen();
    const a = this.abfragen[this.abfrageNeu];
    if (a.offen) return; // alle Abfragen noch unterwegs: dieses Bild nicht
    this.gl.beginQuery(this.timer.TIME_ELAPSED_EXT, a.q);
    a.offen = true;
    a.teil = this.teil;
    this.abfrageLaeuft = true;
    this.abfrageNeu = (this.abfrageNeu + 1) % this.abfragen.length;
  },
  /** Ende eines gerenderten Bilds (t0 aus bildBeginn): CPU-Zeit, GPU-Abfrage schliessen. */
  bildEnde(t0) {
    if (!t0 || !this.teil) return;
    const teil = this.teil;
    this.eintragen(teil.cpu, performance.now() - t0);
    teil.gezeichnet++;
    if (this.ruhig) teil.gezRuhig++;
    if (this.abfrageLaeuft) {
      this.gl.endQuery(this.timer.TIME_ELAPSED_EXT);
      this.abfrageLaeuft = false;
    }
  },

  /**
   * Fertige GPU-Abfragen der Reihe nach auslesen. Disjunkt (Takt der GPU gestört): Die Ergebnisse aller Abfragen
   * unterwegs sind unbrauchbar, auch die noch nicht fertigen; das Lesen setzt die Meldung zurück, darum gleich alle.
   */
  abfragenLesen() {
    const gl = this.gl, n = this.abfragen.length;
    if (gl.getParameter(this.timer.GPU_DISJOINT_EXT)) for (const a of this.abfragen) a.teil = null;
    for (let k = 0; k < n; k++) {
      const a = this.abfragen[this.abfrageAlt];
      if (!a.offen || !gl.getQueryParameter(a.q, gl.QUERY_RESULT_AVAILABLE)) return;
      if (a.teil) this.eintragen(a.teil.zeichnen, gl.getQueryParameter(a.q, gl.QUERY_RESULT) / 1e6);
      a.offen = false;
      this.abfrageAlt = (this.abfrageAlt + 1) % n;
    }
  },

  /**
   * Bildschirmtakt (Hz) aus den jüngsten Abständen der Display-Frames (für die Anzeige): der Median. frameRate.vsync
   * misst nur, solange das Spiel zeichnet, und nimmt das 10-%-Quantil (schätzt bei 60 Hz eher 61). Hält die Grafik
   * den Takt dauernd nicht, ruft der Browser rAF seltener auf: Dann ist das der erreichte Takt, nicht der des
   * Bildschirms (das Ziel der Anzeige rechnet darum nicht damit, perfHud.ziel). null: noch zu wenige Abstände.
   */
  bildschirmHz() {
    const n = Math.min(this.ringN, this.ring.length);
    if (n < 10) return null;
    const s = this.sortiert.subarray(0, n);
    s.set(this.ring.subarray(0, n));
    return 1000 / s.sort()[n >> 1];
  },

  /** Alle Messwerte als Daten (Testschnittstelle). */
  daten() {
    const q = (r, x) => this.quantil(r, x);
    const abschnitte = [...this.teile.values()].filter((t) => t.bild.n || t.gezeichnet).map((t) => {
      const [name, laden = false] = MESS_ABSCHNITTE[t.id];
      const p95 = q(t.bild, 0.95), zeichnenP95 = q(t.zeichnen, 0.95);
      return { id: t.id, name, laden, bilder: t.bild.n, sekunden: t.bild.summe / 1000, p50: q(t.bild, 0.5), p95,
        max: t.bild.max, ueber33: t.ueber, zeichnenP95, zeichnenMax: t.zeichnen.max, zeichnenN: t.zeichnen.n,
        cpuP95: q(t.cpu, 0.95), cpuMax: t.cpu.max, gezeichnet: t.gezeichnet,
        gezeichnetJeS: t.bild.summe ? t.gezeichnet / t.bild.summe * 1000 : 0,
        // ruhig: erst ab einer halben Sekunde Ruhe im Abschnitt (sonst «–»)
        ruhigSekunden: t.ruhigMs / 1000, gezeichnetRuhigJeS: t.ruhigMs >= 500 ? t.gezRuhig / t.ruhigMs * 1000 : null,
        haenger: t.haenger,
        haengerMax: t.haengerMax, longtasks: t.longtasks,
        fluessig: laden ? null : t.bild.n === 0 || p95 <= MESS_GRENZE.p95 && t.ueber === 0,
        zeichnenOk: zeichnenP95 === null ? null : zeichnenP95 <= MESS_GRENZE.zeichnen };
    });
    // alle Abschnitte ausser Laden zusammen, und der Takt aus dem Median aller Abstände
    const gesamt = this.reihe(), alle = this.reihe(), zeichnen = this.reihe();
    let ueber = 0;
    for (const t of this.teile.values()) {
      for (let i = 0; i < MESS_FAECHER; i++) {
        alle.fach[i] += t.bild.fach[i];
        if (!MESS_ABSCHNITTE[t.id][1]) { gesamt.fach[i] += t.bild.fach[i]; zeichnen.fach[i] += t.zeichnen.fach[i]; }
      }
      alle.n += t.bild.n;
      if (MESS_ABSCHNITTE[t.id][1]) continue;
      gesamt.n += t.bild.n; gesamt.summe += t.bild.summe; gesamt.max = Math.max(gesamt.max, t.bild.max);
      zeichnen.n += t.zeichnen.n; zeichnen.max = Math.max(zeichnen.max, t.zeichnen.max);
      ueber += t.ueber;
    }
    alle.max = Math.max(...[...this.teile.values()].map((t) => t.bild.max), 0);
    const median = q(alle, 0.5), size = renderer.getDrawingBufferSize(new THREE.Vector2());
    return {
      version: APP_VERSION, zeit: new Date().toISOString(), gpuZeit: !!this.timer, // Zeichenzeit gemessen (Timer)
      geraet: { ua: navigator.userAgent, modell: this.modell, gpu: perfHud.gpu, mobil: IS_MOBILE,
        bildschirm: `${screen.width}×${screen.height}`, fenster: `${Math.round(innerWidth / SEITE)}×${Math.round(innerHeight / SEITE)}`, seite: SEITE,
        pixelverhaeltnis: devicePixelRatio, render: `${size.x}×${size.y}`, renderPixel: renderer.getPixelRatio(),
        adaptiv: adaptiveResolution.scale, umbauten: adaptiveResolution.changes || 0,
        spielFps: frameRate.spielFps, ruheFps: frameRate.ruheFps, kerne: navigator.hardwareConcurrency ?? null, speicher: navigator.deviceMemory ?? null,
        takt: median ? Math.round(1000 / median) : null, medianMs: median },
      abschnitte,
      gesamt: { bilder: gesamt.n, p95: q(gesamt, 0.95), max: gesamt.max, ueber33: ueber, zeichnenP95: q(zeichnen, 0.95),
        zeichnenMax: zeichnen.max },
      schlimmste: this.schlimmste.map((e) => ({ ...e, abschnitt: MESS_ABSCHNITTE[e.id][0] })),
      haenger: this.haenger.map((e) => ({ ...e, abschnitt: MESS_ABSCHNITTE[e.id][0] })),
    };
  },
};

/* ---------- Leistungsanzeige (Taste F oder ?perf) ---------- */

/**
 * Leistungsanzeige: wie viele Bilder je Sekunde wirklich gezeichnet werden (effektiv, gezählt über die letzte Sekunde)
 * und wie viele das Bild gerade anstrebt (Ziel, mit dem Grund: Spiel, Menü, Himmel, Geschichte, Bühne), dazu der
 * Bildschirmtakt, das p95 der Abstände der gezeichneten Bilder, die Auflösung und die Version. Gezählt werden die Bilder
 * des Spiels (draw) und die der Bühne von Prolog und Epilog (eigene Leinwand, createStoryScene); es gilt die Leinwand,
 * die mehr zeichnet (beim Überblenden zeichnen beide). Neu geschrieben alle 0,5 s aus der Messschleife (leistung.tick),
 * die nur läuft, solange die Anzeige offen ist.
 */
const perfHud = {
  el: document.getElementById('perf'),
  visible: new URLSearchParams(location.search).has('perf'),
  last: performance.now(),
  zeiten: new Float64Array(512), n: 0, // Zeitstempel der gezeichneten Bilder des Spiels (Ring)
  gpu: (() => {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  })(),
  /** Je gerendertem WebGL-Bild (draw): Zeit merken; die Anzeige schreibt zeige. */
  tick() {
    const now = performance.now();
    const ms = now - this.last;
    this.last = now;
    if (ms < 250) this.avgMs = this.avgMs ? this.avgMs * 0.95 + ms * 0.05 : ms; // für __prisma.fps()
    this.zeiten[this.n++ % this.zeiten.length] = now;
  },
  /** Zeitstempel der Bilder des Spiels seit t (aufsteigend). */
  spielSeit(t) {
    const aus = [];
    for (let i = Math.max(0, this.n - this.zeiten.length); i < this.n; i++) {
      const z = this.zeiten[i % this.zeiten.length];
      if (z >= t) aus.push(z);
    }
    return aus;
  },
  /**
   * Was das Bild gerade anstrebt: [Bilder/s, Grund]; Bilder/s null, wo kein WebGL-Bild gezeichnet wird. Fürs Spiel
   * wie frameRate.due (jedes k-te Bildschirmbild, bei 144 Hz also 72), die Bühne zeichnet jedes Bildschirmbild. hz
   * (bildschirmHz) sinkt, wenn die Grafik den Takt dauernd nicht hält: Das Ziel bleibt dann mindestens fps bzw. 60,
   * sonst stünde dort, was erreicht wird, und man sähe den Rückstand nicht.
   */
  ziel(hz) {
    if (story.scene?.running) return [Math.round(Math.max(60, hz)), 'Bühne'];
    if (flow.state === 'intro') return [null, 'Startbildschirm (Animation des Browsers)'];
    if (sceneLoop.covered) return [null, 'verdeckt'];
    if (sceneLoop.started && !sceneLoop.awake) return [0, 'ruht (nichts bewegt sich)'];
    const fps = frameRate.fps(), k = frameRate.teiler(fps);
    return [Math.round(k > 1 ? hz / k : Math.max(fps, hz)), frameRate.grund()];
  },
  zeige() {
    if (!this.visible) return;
    const seit = performance.now() - 1000;
    const spiel = this.spielSeit(seit), buehne = story.scene?.gl?.zeitenSeit(seit) ?? [];
    const bilder = buehne.length > spiel.length ? buehne : spiel;
    const abstaende = bilder.slice(1).map((z, i) => z - bilder[i]).sort((a, b) => a - b);
    const p95 = abstaende.length ? abstaende[Math.min(abstaende.length - 1, Math.floor(abstaende.length * 0.95))] : null;
    const hz = leistung.bildschirmHz() ?? 1000 / frameRate.vsync;
    const [ziel, grund] = this.ziel(hz);
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const effektiv = ziel === null && !bilder.length ? '–' : bilder.length;
    const abstand = p95 === null ? '–' : `${p95.toFixed(1)} ms`;
    const adaptiv = `adaptiv ${adaptiveResolution.scale.toFixed(2)}${adaptiveResolution.locked ? ' (gesperrt)' : ''}`;
    // schmal (Handy): knappe Fassung oben links (CSS #perf.schmal), die Bedienung des Spiels bleibt frei
    const schmal = innerWidth / SEITE < 700;
    this.el.classList.toggle('schmal', schmal);
    this.el.textContent = schmal
      ? `${effektiv} Bilder/s · Ziel ${ziel ?? '–'} · ${grund}\n${Math.round(hz)} Hz · p95 ${abstand} · ${adaptiv}\n${APP_VERSION}`
      : `${effektiv} Bilder/s   Ziel ${ziel ?? '–'} · ${grund}\n`
        + `Bildschirm ${Math.round(hz)} Hz · Abstand p95 ${abstand}\n`
        + `Auflösung ${size.x}×${size.y} · ${adaptiv}\n`
        + `Version ${APP_VERSION}`;
  },
  toggle() {
    this.visible = !this.visible;
    this.el.hidden = !this.visible;
    if (this.visible) leistung.starte();
    else leistung.stoppe();
  },
};
perfHud.el.hidden = !perfHud.visible;
if (perfHud.visible) leistung.starte();

window.addEventListener('keydown', (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === 'KeyF') perfHud.toggle();
});

/**
 * Bildrate nach Bedarf: Jedes Bild rendert die Szene zweimal (Bodenspiegelung) plus Bloom – das ist fast die ganze
 * Last; die Logik kostet unter 0,1 ms. Das WebGL-Bild läuft mit 60 Bildern/s (spielFps), im Level, im Menü und in den
 * Folgen der Geschichte (ADR 0008; von ADR 0006 bis dahin stetig 30), im ruhenden Level 30 (siehe unten). Steht der Blick im Himmel
 * (Menü, Übersicht), 10 (skyFps); hinter der Bühne, solange sie einblendet, 30. Bewegt sich gar nichts (mit ?t=), ruht die Schleife ganz (sceneLoop). ?takt=30: zum
 * Vergleich wie unter ADR 0006, das Spiel stetig mit 30, die Folgen der Geschichte im WebGL-Bild (Einstieg, Reise,
 * Finale) mit 60 (storyFps, geschichte; ADR 0007).
 * Ruhe-Bildrate (Tickets 01 und 02 der Energie, ADR 0009): Ruht das Level (ruhe), zeichnet es 30 Bilder/s (ruheFps;
 * ?ruhetakt=<n> ab 20, ?ruhetakt=aus oder =60: aus), bei jeder Eingabe oder Bewegung sofort wieder spielFps (rege,
 * zurueck).
 */
const frameRate = {
  spielFps: new URLSearchParams(location.search).get('takt') === '30' ? 30 : 60,
  storyFps: 60,
  // Menü und Übersicht offen, der Blick steht im Himmel: Dort bewegt sich nur noch wenig und langsam (Funkeln der
  // Sterne, Schweben der Kamera; Bestandsaufnahme Ticket 06 der Leistung: je Bild höchstens 5/255 auf unter 0,1 % der
  // Pixel), 10 Bilder/s reichen
  skyFps: 10,
  vsync: 1000 / 60,   // Bildschirmtakt: 10-%-Quantil der rAF-Abstände im letzten Messfenster (übersprungene Bilder sind billig
                      // und kommen genau im Takt; gerenderte können länger dauern)
  windowD: new Float32Array(90), windowN: 0, windowCount: 0, // rAF-Abstände im Messfenster (due)
  prevTs: null,
  skipped: 0,         // rAF-Aufrufe seit dem letzten gerenderten Bild
  gap: 1000 / 60,     // erwarteter Abstand zweier gerenderter Bilder – Budget der adaptiven Auflösung (siehe due)
  ruheFps: null,      // Bilder/s in Ruhe (ruhetaktAus: 30 oder ?ruhetakt=<n>), null: aus (?ruhetakt=aus), stetig spielFps
  ruht: false,        // beim letzten rAF in Ruhe (ruhe): zeichnet ruheFps
  anstoss: -Infinity, // performance.now() der letzten Eingabe oder Bewegung (rege, ruhe)
  ruheLage: { ruheFps: null, spiel: false, seitAnstoss: 0, bewegt: false }, // für ruhtJetzt, ohne Allokation je rAF
  lage: { verdeckt: false, geschichte: false, himmel: false, menue: false, ruht: false, spielFps: 60, storyFps: 60,
    skyFps: 10, ruheFps: null }, // für bildrate und bildrateGrund
  /**
   * Eine Folge der Geschichte im WebGL-Bild läuft (flow.state 'story': Aufstieg, Reise, Fall, Einstieg, Finale, Satz
   * zum Ende des Dorfs), nicht im Menü oder in der Übersicht (choosing) und nicht hinter der Bühne (covered, dort steht
   * nur der Himmel). Am Zustand statt an den Promises der Folgen: Ein abgebrochener Tween (dropTweens, reset) wird nie
   * fertig, ein Zähler bliebe dann stehen und das Spiel bei 60. Ab enterLevel (flow.state 'in') gilt der Takt des Spiels.
   */
  geschichte() { return flow.state === 'story' && !story.choosing && !story.covered; },
  /** Menü oder Übersicht offen, der Blick ganz im Himmel (story.lift), nicht hinter der Bühne; der Himmel blendet nicht
   *  gerade ein, über oder schärft nach (skyTheme.moving: das liefe mit 10 Bildern/s stufig). */
  skyOnly() { return story.choosing && story.gaze >= 1 && !story.covered && !story.tweens.length && !skyTheme.moving; },
  /**
   * Angestrebte Bilder/s jetzt (due: je rAF, darum ohne Allokation). Hinter der Bühne, solange sie einblendet (danach
   * zeichnet das Spiel gar nicht mehr, sceneLoop.covered), höchstens 30 wie vor ADR 0008: Bühne und Spiel zeichnen dann
   * beide, und vom Spiel sieht man kaum noch etwas.
   */
  fps() { return bildrate(this.jetzt()); },
  /** Der Grund zu fps (Leistungsanzeige): Spiel, Ruhe, Menü, Himmel (Menü), Geschichte, hinter der Bühne. */
  grund() { return bildrateGrund(this.jetzt()); },
  /** Die Lage für bildrate und bildrateGrund (src/logik.js; ruht: zuletzt von due bestimmt). */
  jetzt() {
    const z = this.lage;
    z.verdeckt = story.covered;
    z.geschichte = !z.verdeckt && this.geschichte();
    z.himmel = !z.verdeckt && !z.geschichte && this.skyOnly();
    z.menue = story.choosing;
    z.ruht = this.ruht;
    z.spielFps = this.spielFps; z.storyFps = this.storyFps; z.skyFps = this.skyFps; z.ruheFps = this.ruheFps;
    return z;
  },
  /**
   * Was das Auge im ruhenden Level verfolgen würde (Text) oder false. Das Schweben der Kamera, das Fliessen der
   * Strahlen, das Drehen und Atmen der Ziele und die Himmel samt Fischen, Glühwürmchen, Funken und Planeten bleiben Ruhe
   * (Wunsch des Nutzers; Ticket 02 der Energie: auf dem Poco wirkte mit 30 in keiner Welt etwas stufig);
   * keine Ruhe sind: der Finger oder die Maustaste unten (Ziehen, Halten, zwei Finger), alles in sceneLoop.pending
   * (Drehen, Puls, Wackeln, Hover, Ziele, die aufleuchten, wachsende Strahlen, Feier, Herauswachsen, Überblenden des
   * Himmels oder Bretts, Kamera nach dem Ziehen, Zoomen oder beim Rückflug), der Wechsel der Führung und ihre Hand und
   * die Lichtwelle samt Nachwirkung auf dem Brett.
   */
  bewegt() {
    if (drag.active || input.pointer || input.pinch) return 'Eingabe';
    if (fuehrung.wechselt || fuehrung.hand) return 'Führung';
    if (shockUniforms.uShockT.value < SHOCK_REST_S) return 'Lichtwelle';
    return sceneLoop.pending();
  },
  /**
   * Ruht das Level (ruhtJetzt)? Im Level (flow 'play', weder Menü, Übersicht noch Bühne), RUHE_NACH_MS nach der letzten
   * Eingabe oder Bewegung, und es bewegt sich nichts, das man anschaut (bewegt). Eine Bewegung zählt wie eine Eingabe:
   * Nach ihrem Ende bleibt der volle Takt noch RUHE_NACH_MS. Mit ?ruhetakt=aus nie (stetig wie unter ADR 0008).
   */
  ruhe(ts) {
    if (this.ruheFps === null) return false;
    const z = this.ruheLage;
    z.ruheFps = this.ruheFps;
    z.spiel = flow.state === 'play' && !story.choosing && !story.covered && !sceneLoop.covered;
    z.seitAnstoss = ts - this.anstoss;
    z.bewegt = z.spiel && z.seitAnstoss >= RUHE_NACH_MS ? this.bewegt() : false;
    if (z.bewegt) this.anstoss = ts;
    return ruhtJetzt(z);
  },
  /** Eingabe oder Anstoss (sceneLoop.wake): ruhte das Level, das nächste Bildschirmbild gleich mit dem vollen Takt. */
  rege() {
    this.anstoss = performance.now();
    if (this.ruht) { this.ruht = false; this.zurueck(); }
  },
  /** Aus der Ruhe zurück: jetzt zeichnen, nicht erst im nächsten Ruhe-Takt; der längere Abstand davor ist kein langsames Bild. */
  zurueck() {
    this.skipped = Infinity;
    adaptiveResolution.skip = Math.max(adaptiveResolution.skip, 1);
  },
  /**
   * Jedes wievielte Bildschirmbild für fps gerendert wird (k). So bleibt der Takt gleichmässig (kein Wechsel 14/21 ms):
   * 60 Bilder/s bei 60 Hz alle, bei 75/90 Hz ebenfalls alle, bei 120/144 Hz jedes zweite (60/72), bei 165 Hz jedes dritte
   * (55). Schafft die Grafik den Takt nicht, kommen die rAF-Aufrufe ohnehin seltener.
   */
  teiler(fps) { return Math.max(1, Math.floor(1000 / this.vsync / fps + 0.34)); },
  /** true = dieses rAF-Ereignis rendern (jedes k-te Bildschirmbild, teiler). */
  due(ts) {
    if (this.prevTs !== null) {
      const d = ts - this.prevTs;
      if (d > 2 && d < 100) this.windowD[this.windowN++] = d;
      if (++this.windowCount >= 90) {
        // nicht der kürzeste Abstand, sondern das 10-%-Quantil: Nach einem langen Bild holt rAF auf (z. B. 21 und dann
        // 12 ms bei 60 Hz). Der kürzeste hielt dann 12 ms für den Takt, k wurde 3 statt 2 (20 statt 30 Bilder/s), und
        // adaptiveResolution wertete jedes Bild als langsam (50 ms bei einem Budget von 3 × 12 ms): Absenkung im ersten
        // Level ohne ein langes sichtbares Bild (Ticket 03 der Leistung)
        if (this.windowN) this.vsync = this.windowD.subarray(0, this.windowN).sort()[Math.floor(this.windowN * 0.1)];
        this.windowN = 0; this.windowCount = 0;
      }
    }
    this.prevTs = ts;
    const ruht = this.ruhe(ts);
    if (ruht !== this.ruht) { this.ruht = ruht; if (!ruht) this.zurueck(); }
    const fps = this.fps(), k = this.teiler(fps);
    // k > 1: übersprungene, billige Aufrufe zeigen den echten Takt – Budget = tatsächlicher Abstand (50 Hz: 40 ms).
    // k = 1: der gemessene Takt kann von einer überlasteten Grafik stammen – dann gilt das Ziel-Budget.
    this.gap = k > 1 ? k * this.vsync : 1000 / fps;
    if (++this.skipped < k) return false;
    this.skipped = 0;
    return true;
  },
};
frameRate.ruheFps = ruhetaktAus(new URLSearchParams(location.search).get('ruhetakt'), frameRate.spielFps);
// Eingaben wecken die Hauptschleife (sceneLoop): Drücken, Ziehen und Hover (pointermove), Loslassen, Rad, Tasten
for (const type of ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'keydown', 'touchstart']) {
  window.addEventListener(type, () => sceneLoop.wake(), { passive: true, capture: true });
}
window.addEventListener('resize', () => sceneLoop.wake(true)); // Render-Targets neu: aufwärmen
document.addEventListener('visibilitychange', () => sceneLoop.wake());

const MAX_DT = 0.05; // längster Zeitschritt je Bild: Animationen springen nach einem Ruckler nicht

/**
 * Ein Durchgang der Hauptschleife (sceneLoop): Logik, und nur wenn die Szene zu sehen ist, auch Zeichnen. Verdeckt
 * läuft die Logik in jedem rAF, solange etwas ansteht; danach ruht die Schleife (vorher ein Bild, falls sich etwas
 * geändert hat).
 */
function frame(ts) {
  const loop = sceneLoop;
  if (loop.covered) {
    loop.wasCovered = true;
    if (loop.pending()) { loop.still = 0; loop.dirty = true; } else loop.still++;
    const dt = loop.last === null ? 1 / 60 : Math.min((ts - loop.last) / 1000, MAX_DT);
    loop.last = ts;
    const t0 = leistung.bildBeginn();
    animate(FIXED_TIME ?? sceneTime.at(ts), dt);
    window.__prisma.ticks++;
    if (loop.still >= REST_STEPS) {
      if (loop.dirty && loop.mayDraw()) draw(dt, t0, false); // aufwärmen und den Stand von jetzt auf die Leinwand
      loop.awake = false; // ruhen, bis wake()
      loop.guard();
      return;
    }
    requestAnimationFrame(frame);
    return;
  }
  if (loop.wasCovered) {
    // aufgedeckt: gleich zeichnen; die Pause ist kein langsames Bild (adaptiveResolution lernt aus ihr nichts)
    loop.wasCovered = false;
    frameRate.skipped = Infinity;
    frameRate.prevTs = null;
    adaptiveResolution.hold(0.5);
  }
  if (!frameRate.due(ts)) { requestAnimationFrame(frame); return; }
  // dt aus dem rAF-Zeitstempel: gleichmässiger als eine eigene Uhr beim Callback-Start
  const dt = loop.last === null ? 1 / 60 : Math.min((ts - loop.last) / 1000, MAX_DT);
  loop.last = ts;
  if (loop.ambient() || loop.pending()) loop.still = 0; else loop.still++;
  const t0 = leistung.bildBeginn(); // Messwerkzeug: CPU-Zeit von frame() und Zeichenzeit (nur mit ?perf)
  animate(FIXED_TIME ?? sceneTime.at(ts), dt);
  window.__prisma.ticks++;
  draw(dt, t0);
  // nichts bewegt sich mehr: ruhen, bis wake() (das letzte Bild bleibt stehen; die Bilder bis hierher zeigen auch, was
  // ohne Weckruf geändert wurde)
  if (loop.still >= REST_STEPS) { loop.awake = false; loop.guard(); return; }
  requestAnimationFrame(frame);
}

/**
 * Ein Bild zeichnen. t0: Beginn des Durchgangs (leistung.bildBeginn, für die Messung); learn: adaptiveResolution wertet
 * es (nicht verdeckt und nicht beim Aufwärmen).
 */
function draw(dt, t0, learn = true) {
  leistung.gpuBeginn();
  renderReflection();
  skyTheme.vorzeichnen();
  composer.render(dt);
  leistung.bildEnde(t0);

  if (!learn) adaptiveResolution.skip = Math.max(adaptiveResolution.skip, 1); // nur die Zeit nehmen (tick)
  adaptiveResolution.tick(frameRate.gap);
  perfHud.tick();
  window.__prisma.frames++;
  sceneLoop.dirty = false;
  if (!sceneLoop.warm) { sceneLoop.warm = true; markSceneReady(); }
}

/** Ein Zeitschritt aller Animationen, ohne zu rendern. */
function animate(t, dt) {
  updateCamera(t, dt);
  skyTheme.update(dt, t);
  background.position.copy(camera.position); // Hintergrundkugel immer um die Kamera
  stars.position.copy(camera.position); // Sterne ebenso: unendlich weit weg, keine Parallaxe
  stars.material.uniforms.uTime.value = t;
  stars.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
  finalPass.uniforms.uTime.value = t;

  updateFlow(dt);
  story.update(dt);
  himmelsWagen.update(t, dt); // nach story.update: Tag oder Nacht aus dem Himmel, wie ihn blendSky mischt
  celebration.update(dt, t);
  shockClock(dt); // nach Feier und Geschichte, die den Ring setzen
  animateRotations(dt);
  if (weigernde.size) animateWeigern(dt);
  for (const obj of game.objects.values()) {
    if (obj.userData.update) obj.userData.update(t, dt);
    if (obj.userData.updateHover) obj.userData.updateHover(dt);
  }
  beamView.tick(t, dt);
  updateTargetGoals();
  if (fuehrung.sichtbar) fuehrung.platziere(); // Lichtkegel und Hand gehen mit Kamera und Zoom
}

// Zustand für Werkzeuge und Proben; ohne Weg, ein Level zu wechseln (goto ist mit der Levelauswahl weggefallen: Die
// Geschichte lässt kein Level überspringen, ADR 0005; Level ausserhalb zeigt __prismaDebug.zeige). frames: gezeichnete
// Bilder (hinter Startbildschirm und Bühne kaum welche), ticks: Schritte der Logik (die Schleife läuft; darauf warten
// die Proben), ruht(): die Hauptschleife ruht, verdeckt(): die Szene ist ganz zugedeckt (sceneLoop), brett(): welches
// Brett zu sehen ist, { himmel (id des Himmels, dem es gehört), art, bereit (berechnet und hochgeladen), von (beim
// Überblenden der Himmel des bisherigen), anteil (des neuen, 1 ohne Überblenden), notfall } (boardTheme.info),
// skyReady(): Himmel und Brett ganz da
window.__prisma = { frames: 0, ticks: 0, ruht: () => sceneLoop.started && !sceneLoop.awake,
  verdeckt: () => sceneLoop.covered, ready: true, level: () => game.board?.name, solved: () => !!game.result?.solved,
  levelIndex: () => game.levelIndex, playing: () => flow.state === 'play', start: () => ui.start(),
  celebrating: () => celebration.active, solvedPanel: () => ui.solvedVisible(),
  fps: () => (perfHud.avgMs ? Math.round(1000 / perfHud.avgMs) : 0), resolution: () => adaptiveResolution.scale,
  skyReady: () => skyTheme.ready, brett: () => boardTheme.info(),
  // Messwerkzeug (Spec .scratch/leistung/): daten() die Messwerte bisher (nur mit ?perf oder nach Taste F)
  leistung: { daten: () => leistung.daten() } };
// Bühne der Geschichte (Ticket 19): modus dom oder gl; bilder(): Abstände der eigenen Bilder (ms), speicher(): Bytes der
// Texturen, statistik: Rastern (Kacheln, ms, längste, Hochladen)
window.__prisma.buehne = { modus: 'gl', bilder: (n) => story.scene?.gl?.bilder(n) ?? [],
  speicher: () => story.scene?.gl?.speicher() ?? 0, statistik: () => story.scene?.gl?.statistik ?? null,
  liste: () => story.scene?.gl?.liste() ?? [] };
// Zugriff für Debugging/Tests (nicht serialisieren), die Testschnittstelle für Werkzeuge und Proben; das Spiel ruft
// nichts davon auf. settle(s): nur mit ?t=, spult Herauswachsen, Aufleuchten und Überblenden um s Sekunden vor, ohne zu
// rendern (Screenshots der KI-Tester). zeige(index): LEVELS[index] ausserhalb der Geschichte zeigen, gleich nach dem
// Laden mit ?nointro (das Menü ist offen; es geht sofort weg, die Kamera schaut aufs Brett): ohne Speicherstand,
// Kopfzeile mit Titel oder Name und Grad (Bilder der KI-Tester, Proben im Würfel). loese(): das laufende Level lösen,
// Drehung für Drehung wie ein Spieler (Proben des Ablaufs; die Geschichte geht dann wie gewohnt weiter). Einen Grad
// wählt das Menü (menu, oder story.choose(grad), solange es offen ist), einen Stand setzen Proben über localStorage
// (progress) und Neuladen. uebersicht: die Übersicht (offen, Daten aus story.overviewData). beamView, shockUniforms,
// STORY_LEVELS, COLORS: für den Bildvergleich (tests/bildvergleich.mjs), der nur über dieses Objekt in die Seite greift.
window.__prismaDebug = { beamView, shockUniforms, STORY_LEVELS, COLORS, arbeit, fuehrung, scene, camera, renderer, boardTheme, bloomPass, brushPass, finalPass, keyLight, hemi, game, rotateElement, flow, changeLevel, celebration, audio, ui, progress, skyTheme, cameraRig, cubeView, story, menu, uebersicht, adaptiveResolution, sceneLoop,
  settle(seconds) {
    if (FIXED_TIME === null) throw new Error('settle braucht ?t=');
    for (let k = 0; k < seconds / MAX_DT; k++) animate(FIXED_TIME, MAX_DT);
    sceneLoop.wake(true); // ruht die Schleife (mit ?t= steht die Szene), den neuen Stand zeichnen
  },
  zeige(index) {
    if (!(index >= 0 && index < LEVELS.length)) throw new Error(`zeige: kein Level ${index}`);
    story.outside = true;
    story.choosing = false;
    story.paused = null;
    story.overview = null;
    menu.hide(true);
    uebersicht.hide();
    story.gazeRun++;
    story.gaze = 0;
    story.close();
    setShown(ui.controls, true);
    if (game.board && flow.state === 'play') { changeLevel(index); return; }
    // mit ?t= steht die Zeit (FIXED_TIME): Strahlen, die nach ihr geboren sind, wüchsen nie. Wie beim ersten Level
    // vor dem ersten Bild zählen sie ab 0, so stehen sie nach settle wie früher
    if (FIXED_TIME !== null) beamView.time = 0;
    enterLevel(index);
  },
  loese() {
    if (flow.state !== 'play') throw new Error('loese: kein Level im Spiel');
    const lvl = LEVELS[game.levelIndex];
    for (const el of game.board.elements) {
      const key = el.y === undefined ? `${el.x},${el.z}` : `${el.x},${el.y},${el.z}`;
      if (!isRotatable(el) || !(key in lvl.solution)) continue;
      const delta = mod8(lvl.solution[key] - (el.type === 'combiner' ? el.dir : el.rot));
      if (delta) rotateElement(el, delta);
    }
  } };

/**
 * Elemente des ersten Levels, unsichtbar auf dem Brett: Der Start übersetzt ihre Shader mit, sonst täte es das erste
 * Bild der Welle nach dem Klick (gemessen bis 0,7 s Stillstand). Dazu je eines jeder übrigen Art. Sie bleiben (siehe
 * warmupShaders): Ein späteres Level mit einer neuen Art übersetzte sonst mitten im Fall des Lichts.
 */
function vorwaermElemente() {
  const group = new THREE.Group(), types = new Set();
  const proxies = game.hitProxies; // läuft im Seitenstart: ein schon geladenes Level behielte seine Trefferzylinder
  game.hitProxies = [];
  group.visible = false;
  // drehbare mit Trefferzylinder, Lichtrand und Leuchtringen (makeInteractive): Deren Shader übersetzte sonst das erste
  // Bild, in dem ein drehbares Element herauswächst (70–140 ms Stillstand beim ersten Level, Review Ticket 07)
  const add = (el) => {
    if (!ELEMENT_FACTORIES[el.type]) return;
    const obj = ELEMENT_FACTORIES[el.type](el);
    obj.userData.element = el;
    if (isRotatable(el)) makeInteractive(obj);
    group.add(obj);
    types.add(el.type);
  };
  const random = Math.random;
  Math.random = () => 0.5; // die Zufallsfolge des Spiels nicht verschieben (mit ?t= fest, siehe FIXED_TIME)
  try {
    createBoard(LEVELS[story.firstIndex()]).elements.forEach(add);
    for (const level of LEVELS) {
      if (types.size === Object.keys(ELEMENT_FACTORIES).length) break;
      for (const el of createBoard(level).elements) if (!types.has(el.type)) add(el);
    }
  } catch (e) {
    console.error(e); // nur ein Vorwärmen: das Spiel startet auch ohne
  } finally { Math.random = random; }
  // dazu die Strahlen: Ihre Netze entstehen erst mit dem Level (beamView._rebuild), die Materialien sind geteilt
  const beams = [beamMaterial, floorGlowMaterial, beamShadeMaterial]
    .map((mat) => new THREE.Mesh(buildBeamGeometry([]), mat));
  group.add(...beams);
  boardGroup.add(group);
  game.hitProxies = proxies; // makeInteractive trägt die Trefferzylinder der Vorwärm-Elemente ein: Sie sind nie zu treffen
}

/** Materialien der Bildschritte (Bloom, letzter Schritt) in einer Szene ohne Licht: so übersetzt three sie wie im Vollbild */
function passScene() {
  const s = new THREE.Scene(), quad = new THREE.PlaneGeometry(2, 2), mats = new Set();
  for (const pass of composer.passes) for (const v of Object.values(pass)) for (const mat of [v].flat()) if (mat?.isMaterial) mats.add(mat);
  for (const mat of mats) s.add(new THREE.Mesh(quad, mat));
  return s;
}
/**
 * Seitenstart in Stücken (Ticket 10 der Leistung): Was nach dem Nötigsten (Renderer, Szene, Startbildschirm) kommt,
 * läuft in eigenen Aufgaben statt im Hauptscript am Stück (das hielt die Seite auf dem gedrosselten Handy 1,4 s, auf
 * dem Poco 340 ms an). Die Reihenfolge bleibt: Umgebungen vor dem Anstossen der Programme (sie bestimmen deren Code).
 * Bis zum Ende zeichnet nichts die Szene (sceneLoop.start), die Enthüllung wartet darauf (seitenstartAngestossen).
 * Zwischen den Stücken nur eine neue Aufgabe, kein Bild abwarten: Der Browser zeichnet dazwischen, wenn ein Bild fällig
 * ist, aber der Aufbau wartet nicht auf den Grafikprozess (er übersetzt in dieser Zeit Shader und hält dabei Bilder an;
 * mit nextFrame kam die Enthüllung so auf dem Desktop bis 0,5 s später).
 */
const SEITENSTART_MS = 50; // je Aufgabe; Poco: bis gut 100 ms (ein Schritt kann die Grenze überschreiten)
async function seitenstart() {
  // Schritte, zwischen denen eine neue Aufgabe beginnen darf (yield); je Aufgabe etwa SEITENSTART_MS. Ein schneller
  // Rechner schafft so mehrere in einer Aufgabe. yield NEXT_FRAME vor einem grossen Schritt: der beginnt eine eigene
  // Aufgabe (bei 4× gedrosselt je 100–250 ms)
  function* aufbau() {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = buildEnvironment(ENV_ROOM.scene, pmrem);
    yield NEXT_FRAME;
    MAT.mirror.envMap = buildEnvironment(ENV_ROOM.mirror, pmrem);
    MAT.mirror.needsUpdate = true;
    pmrem.dispose();
    yield;
    yield* stars.userData.fill();
    yield NEXT_FRAME;
    vorwaermElemente();
  }
  try {
    for (const steps = aufbau(); ;) {
      await neueAufgabe();
      let step = {};
      for (const t = performance.now(); performance.now() - t <= SEITENSTART_MS;) {
        step = steps.next();
        if (step.done || step.value === NEXT_FRAME) break;
      }
      if (step.done) break;
    }
    await neueAufgabe();
    // Die Hauptschleife und das erste Bild erst, wenn die Shader übersetzt sind (im Hintergrund, compileParallel): Sonst
    // stünde es so lange, und mit ihm das Intro. Angestossen in Häppchen (three erzeugt den Code jedes Programms
    // synchron, am Stück 400 ms bei 4×), länger als im Spiel: Vor der Enthüllung animiert nichts. Nicht gewählte
    // Hintergründe aus dem Code (Sonnensystem) übersetzt warmupShaders später.
    await compileParallel([scene, passScene()], {
      skip: skyTheme.idleGroups, slices: true, sliceMs: SEITENSTART_MS, pause: neueAufgabe, issued: markSeitenstart,
    });
  } catch (e) {
    console.error(e);
  } finally {
    markSeitenstart();
    sceneLoop.start();
  }
}
seitenstart();

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  adaptiveResolution: () => adaptiveResolution, animateWeigern: () => animateWeigern, audio: () => audio,
  BEAM_Y: () => BEAM_Y, beamView: () => beamView, BUEHNENWAGEN: () => BUEHNENWAGEN, cameraRig: () => cameraRig,
  celebration: () => celebration, changeLevel: () => changeLevel, COLORS: () => COLORS,
  cubeToWorld: () => cubeToWorld, draw: () => draw, enterLevel: () => enterLevel, fixedBase: () => fixedBase,
  flow: () => flow, frameRate: () => frameRate, fuehrung: () => fuehrung, FUEHRUNG: () => FUEHRUNG, game: () => game,
  geraeteText: () => geraeteText, gridToWorld: () => gridToWorld, input: () => input, INPUT: () => INPUT,
  isRotatable: () => isRotatable, leistung: () => leistung, LEVELS: () => LEVELS, loadLevel: () => loadLevel,
  menu: () => menu, MESS_ABSCHNITTE: () => MESS_ABSCHNITTE, NEBENBEI: () => NEBENBEI, onResize: () => onResize,
  perfHud: () => perfHud, phiLimits: () => phiLimits, reflectionInView: () => reflectionInView,
  renderReflection: () => renderReflection, rotateElement: () => rotateElement, story: () => story,
  STORY_CHAPTERS: () => STORY_CHAPTERS, STORY_DORF: () => STORY_DORF, STORY_EPILOG: () => STORY_EPILOG,
  STORY_LEVELS: () => STORY_LEVELS, STORY_PROLOG: () => STORY_PROLOG, TUTORIAL_COUNT: () => TUTORIAL_COUNT,
  uebersicht: () => uebersicht, weigernde: () => weigernde,
}, { draw: (f) => { draw = f; }, renderReflection: (f) => { renderReflection = f; } });

export {
  adaptiveResolution, animate, beamView, cameraRig, CELEBRATE, celebration, clock, draw, flow, frame, frameRate, game,
  himmelsWagen, input, leistung, menu, sceneTime, story, uebersicht, ui, weigernde,
};
