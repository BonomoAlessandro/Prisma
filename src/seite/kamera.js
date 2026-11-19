// Kamera: schräg von oben, frei ums Feld drehbar (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
//
// Seitenstart in Stücken (Ticket 10 der Leistung): Hier begann bis Ticket 04 des Umbaus ein eigenes klassisches Skript,
// das der Browser in einer eigenen Aufgabe übersetzte und startete. Als Module laufen die Teile sonst am Stück; darum
// wartet dieses Modul zuerst auf eine neue Aufgabe (await auf oberster Ebene). Die Module laufen in der Reihenfolge der
// früheren Skripte: Jedes importiert zuerst das vorherige (auch nur dafür), src/main.ts das letzte. Beim Laden ruft ein
// Modul nichts aus einem späteren auf.
import { keyLight } from './bildschritte.js';
import { CELL, PLATE } from './konfiguration.ts';
import { camera, markShadowsDirty, renderer } from './szene.js';
import { updateSky } from './himmel/sterne.js';
import { skyTheme } from './himmel/skybox.js';
import { CUBE } from './brett/feld.js';
import { phiLimits } from './eingabe.js';
import { story } from './geschichte/geschichte.js';
import { kameraSichtfeld } from './aufloesung.js';
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

/**
 * Beim Levelwechsel: in einem Bogen auf kürzestem Weg zurück zur Ausgangsansicht (Drehung und Neigung). Den Zoom von
 * Hand behält sie (Wunsch des Nutzers vom 19.11.2026): Wer näher heran oder weiter weg gezoomt hat, spielt auch das
 * nächste Level so.
 */
function cameraGoHome() {
  const theta = cameraRig.goalTheta, phi = cameraRig.goalPhi;
  if (Math.abs(theta) + Math.abs(phi) < 1e-3) return;
  cameraRig.homing = { theta, phi, t: 0, duration: 0.8 + 0.25 * Math.abs(theta) };
}

function updateCamera(t, dt) {
  const h = cameraRig.homing;
  if (h) {
    h.t = Math.min(1, h.t + dt / h.duration);
    const e = h.t < 0.5 ? 4 * h.t ** 3 : 1 - (2 - 2 * h.t) ** 3 / 2; // ease-in-out
    cameraRig.goalTheta = h.theta * (1 - e);
    cameraRig.goalPhi = h.phi * (1 - e);
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

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  cameraRig: () => cameraRig,
});

export { _gazeLook, cameraGoHome, cameraRig, drag, fitCameraDistance, updateCamera, Y_AXIS };
