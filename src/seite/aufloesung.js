// Grösse, Uhr, adaptive Auflösung und Spiegelung des Bretts je Bild (Ticket 04 von .scratch/umbau/, bis dahin in
// index.html).
import './geschichte/geschichte.js';
import { IS_MOBILE, PLATE, QUALITY } from './konfiguration.ts';
import { camera, renderer, scene } from './szene.js';
import { background } from './himmel/sterne.js';
import { boardReflection, boardTheme, reflector, reflLodShift } from './brett/brett.js';
import { composer, finalPass } from './bildschritte.js';
import { drag, fitCameraDistance } from './kamera.js';
import { game } from './brett/feld.js';
import { beamMaterial } from './brett/strahlen.js';
import { alsGlobal } from './testschnittstelle.ts';

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

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  adaptiveResolution: () => adaptiveResolution, onResize: () => onResize, reflectionInView: () => reflectionInView,
  renderReflection: () => renderReflection,
}, { renderReflection: (f) => { renderReflection = f; } });

export { adaptiveResolution, clock, kameraSichtfeld, renderReflection, sceneTime };
