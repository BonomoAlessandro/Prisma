// Szene und Renderer: WebGL, Szene, Kamera, Hauptschleife (sceneLoop), Ruhe, Übersetzen der Programme (Ticket 04 von
// .scratch/umbau/, bis dahin in index.html).
//
// Seitenstart in Stücken (Ticket 10 der Leistung): Hier begann bis Ticket 04 des Umbaus ein eigenes klassisches Skript,
// das der Browser in einer eigenen Aufgabe übersetzte und startete. Als Module laufen die Teile sonst am Stück; darum
// wartet dieses Modul zuerst auf eine neue Aufgabe (await auf oberster Ebene). Die Module laufen in der Reihenfolge der
// früheren Skripte: Jedes importiert zuerst das vorherige (auch nur dafür), src/main.ts das letzte. Beim Laden ruft ein
// Modul nichts aus einem späteren auf.
import { FIXED_TIME, LOOK, QUALITY } from './konfiguration.ts';
import { skyTheme } from './himmel/skybox.js';
import { cameraRig } from './kamera.js';
import { game, weigernde } from './brett/feld.js';
import { beamView } from './brett/strahlen.js';
import { input } from './eingabe.js';
import { celebration, flow } from './levelfluss.js';
import { ui } from './oberflaeche/ui.js';
import { himmelsWagen } from './geschichte/daten.js';
import { menu, story, uebersicht } from './geschichte/geschichte.js';
import { adaptiveResolution, sceneTime } from './aufloesung.js';
import { frameRate, leistung } from './leistung.js';
import { animate, draw, frame } from './schleife.js';
import { neueAufgabe } from './aufgabe.ts';
import { alsGlobal } from './testschnittstelle.ts';

await neueAufgabe();

/* =====================================================================
   RENDERER
   ===================================================================== */

// Auf den Bildschirm zeichnet nur der letzte Bildschritt (ein Rechteck übers ganze Bild): ohne Tiefe und Stencil, die
// Szene hat beides in ihrem eigenen Ziel (createComposer). Spart auf Kachel-GPUs Löschen und Speichern je Bild (Ticket 11)
const renderer = new THREE.WebGLRenderer({ antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(QUALITY.pixelRatio);
renderer.setSize(seiteBreite(), seiteHoehe()); // in Pixeln der Oberfläche (SEITE)
// Tone Mapping (ACES Filmic) und sRGB-Wandlung passieren im finalen Post-Pass,
// damit Bloom auf echten HDR-Werten arbeitet.
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputEncoding = THREE.LinearEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Schatten werden nur neu berechnet, wenn sich etwas Schattenwerfendes bewegt (markShadowsDirty).
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
function markShadowsDirty() { renderer.shadowMap.needsUpdate = true; }
document.body.appendChild(renderer.domElement);
renderer.domElement.tabIndex = -1; // Ziel des Fokus, wenn ein Knopf verschwindet (story.keepFocus), statt body
renderer.domElement.setAttribute('aria-label', 'Spielfeld');

// In HalfFloat rendern braucht explizit eine color_buffer-Extension (WebGL1 und WebGL2).
const HDR_SUPPORTED = renderer.capabilities.isWebGL2
  ? (renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float'))
  : (renderer.extensions.has('OES_texture_half_float') && renderer.extensions.has('EXT_color_buffer_half_float'));
const HDR_TYPE = HDR_SUPPORTED ? THREE.HalfFloatType : THREE.UnsignedByteType;

/**
 * Tiefe (und Stencil) des gerade gebundenen Ziels target verwerfen, wenn sie niemand mehr liest (Ticket 11): Kachel-GPUs
 * (Handy) schreiben sonst jede Kachel samt Tiefe in den Speicher zurück. Nur WebGL2 und ohne MSAA (dort löst three auf
 * und bindet dabei andere Puffer; für die Spiegelung siehe renderReflection).
 */
function discardDepth(r, target) {
  if (!r.capabilities.isWebGL2 || !target?.depthBuffer || target.samples > 0 || r.getRenderTarget() !== target) return;
  const gl = r.getContext();
  gl.invalidateFramebuffer(gl.FRAMEBUFFER, [target.stencilBuffer ? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT]);
}
// Was vor dem Zeichnen der Szene in ein eigenes Ziel muss, (renderer, camera, Ziel der Szene, scene) => …: im Pass der
// Szene vorab, damit ihr Ziel nicht mittendrin wechselt (waterSurface, Ticket 11)
const SCENE_PREPASSES = new Set();
if (!HDR_SUPPORTED) {
  // Fallback ohne HDR: Bloom-Schwelle unter 1 (sonst blüht nichts), Spiegelung aus
  // (der Reflector rendert intern immer in HalfFloat).
  LOOK.bloomThreshold = 0.8;
  QUALITY.reflections = false;
}

renderer.domElement.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  document.getElementById('hud-sub').textContent = 'Grafikkontext verloren – bitte neu laden';
});

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/** Szene bereit: erstes Bild gezeichnet, sichtbar oder zum Aufwärmen hinter dem Startbildschirm (draw, sceneLoop). Eine
 * Skybox und ein Brett laden danach in Häppchen weiter. Steht vor allem, was darauf wartet: Auf langsamem Netz ist das
 * Steinbrett (Worker) berechnet, bevor der Rest der Seite geladen ist, und erst nach dem ersten Bild gibt es alles, was
 * sein Laden braucht (ruhe.jetzt: flow, story). */
let markSceneReady;
const sceneReady = new Promise((resolve) => { markSceneReady = resolve; });

/**
 * Hauptschleife (frame): Logik (animate) und Zeichnen getrennt. Deckt eine Ebene die Szene ganz zu (covered: der
 * Startbildschirm, die Bühne von Prolog und Epilog, sobald sie ganz eingeblendet ist), läuft nur die Logik, gezeichnet
 * wird nicht. Steht dann auch keine Logik an (pending: Tweens der Geschichte, Überblenden und Einblenden eines
 * Hintergrunds, Kamera, Feld, Feier), ruht die Schleife ohne rAF, bis wake() sie weckt (Tweens, Hintergründe, Level,
 * Aufdecken, Grösse, Sichtbarkeit, Eingaben). Vor dem Ruhen einmal zeichnen, wenn sich seit dem letzten Bild etwas
 * geändert hat: Das wärmt Programme, Uploads und Render-Targets vor dem Aufdecken auf, und die Leinwand zeigt den Stand
 * von jetzt. Die Uhr (clock) läuft weiter, die Zeitbasis springt beim Aufdecken also nicht. Sichtbar ruht die Schleife
 * ebenso, sobald sich nichts bewegt: keine Logik ansteht und keine Umgebung lebt (ambient; das letzte Bild bleibt
 * stehen). Gezeichnet wird sichtbar im Takt von frameRate.
 */
const REST_STEPS = 10; // so viele Schritte in Folge ohne anstehende Logik, dann ruhen
const sceneLoop = {
  started: false,     // Shader des Starts übersetzt, die Schleife läuft (start)
  awake: false,       // ein rAF für frame ist angemeldet (oder frame läuft)
  last: null,         // rAF-Zeitstempel des letzten Schritts (null: nach dem Ruhen ein normaler Schritt)
  still: 0,           // Schritte in Folge ohne anstehende Logik
  dirty: true,        // seit dem letzten Bild geändert (vor dem Ruhen zeichnen)
  warm: false,        // schon einmal gezeichnet (aufwaermen bzw. frame)
  calm: false,        // Startbildschirm ruhig (introCalm): vorher kein Bild hinter der Enthüllung
  storyOpaque: false, // die Bühne ist ganz eingeblendet (coverStory)
  storyRun: 0,
  wasCovered: false,  // im letzten Schritt verdeckt (Aufdecken erkennen)

  /** Szene ganz zugedeckt: Startbildschirm (deckend, bis der Klick ihn ausblendet) oder die eingeblendete Bühne. */
  get covered() {
    if (flow.state === 'intro') return true;
    return this.storyOpaque && story.covered && story.el.dataset.mode === 'scene'
      && !story.el.classList.contains('hidden');
  },
  /**
   * Die Bühne deckt (story.covered) bzw. nicht mehr: Ganz zu ist sie erst, wenn #story fertig eingeblendet ist (0,8 s,
   * im Finale 1,8 s); bis dahin sieht man die Szene noch durch.
   */
  coverStory(on) {
    const run = ++this.storyRun;
    this.storyOpaque = false;
    this.wake();
    if (!on) return;
    const fades = story.el.getAnimations?.().filter((a) => a.transitionProperty) ?? null;
    const done = () => { if (run === this.storyRun) this.storyOpaque = true; };
    if (fades) Promise.all(fades.map((a) => a.finished.catch(() => {}))).then(done);
    else setTimeout(done, 1900); // ohne getAnimations: länger als das längste Einblenden
  },
  /**
   * Steht Logik an, die fortschreiten muss: Tweens, Überblenden, Kamera, Feld, Feier, Strahlen, Drehen, Puls, dazu
   * alles, was in dt weich nachgeführt wird (Hover, Treffer und falsche Farbe der Ziele)?
   */
  pending() {
    // Rückgabe: was ansteht (Text, für die Warnung des Sicherheitsnetzes, guard), sonst false
    if (story.tweens.length || story.carrier?.kind || story.blend) return 'Geschichte (Tween, Träger, Überblenden)';
    // «Überspringen» schaltet story.update um: noch nicht nachgeführt, oder die Pause nach dem Einstieg ins Dorf läuft
    // (Infinity während der Landung: Deren Tweens halten die Schleife wach, danach wird sie endlich)
    if (story.skippable() !== story.skipShown) return 'Überspringen';
    if (Number.isFinite(story.skipRuhe) && performance.now() < story.skipRuhe) return 'Überspringen (Pause)';
    if (flow.state === 'in' || flow.state === 'out') return `Feld (${flow.state})`;
    if (celebration.active || celebration.rain.alive > 0) return 'Feier';
    if (skyTheme.busy) return 'Himmel';
    if (himmelsWagen.blendet) return 'Wagen am Himmel (Menü)';
    if (cameraRig.homing || cameraRig.settling > 1e-3) return 'Kamera';
    if (beamView.time < beamView.settleAt + 1.2) return 'Strahlen';
    if (weigernde.size) return 'Weigerung';
    for (const obj of game.objects.values()) {
      const u = obj.userData;
      if (u.rotation || u.pulseT > -100) return 'Drehen oder Puls';
      if (u.hover !== undefined && Math.abs((input.hovered === u.element ? 1 : 0) - u.hover) > 2e-3) return 'Hover';
      if (u.hitGoal === undefined) continue;
      if (Math.abs(u.hitGoal - u.hit) > 1e-3 || Math.abs(u.wrongGoal - u.wrong) > 1e-3 || u.flash > 1e-3) return 'Ziel';
      for (const seg of u.ringSegs) if (Math.abs(seg.userData.arriveGoal - seg.userData.arrive) > 1e-3) return 'Ziel';
    }
    return false;
  },
  /**
   * Bewegt sich in der sichtbaren Szene etwas von selbst (Bestandsaufnahme Ticket 06 der Leistung)? Solange die Uhr
   * läuft, immer: Die Kamera schwebt, Strahlen fliessen, Ziele drehen sich und atmen, Staub, Sterne und jeder Himmel
   * leben. Still steht die Szene nur mit ?t= (FIXED_TIME: Bilder der Tests und der KI-Tester).
   */
  ambient() { return FIXED_TIME === null; },
  guardTimer: 0,
  /**
   * Sicherheitsnetz, solange die Schleife ruht: alle 350 ms fragen, ob doch etwas ansteht (pending, sichtbar auch die
   * Umgebung). Dann fehlt eine Weckstelle: warnen (console.warn «sceneLoop: Weckstelle fehlt», die Proben melden das)
   * und wecken. Mit ?t= nicht (die Szene steht dort ohnehin, Bilder der Tests bleiben unberührt).
   */
  guard() {
    clearTimeout(this.guardTimer);
    if (FIXED_TIME !== null) return;
    this.guardTimer = setTimeout(() => {
      if (this.awake || !this.started) return;
      const why = this.pending() || (!this.covered && this.ambient() && 'Umgebung');
      if (!why) { this.guard(); return; }
      console.warn(`sceneLoop: Weckstelle fehlt – die Schleife ruhte, obwohl ansteht: ${why} (Sicherheitsnetz weckt)`);
      this.wake();
    }, 350);
  },
  /** Weckt die ruhende Schleife (cold: Render-Targets oder Ähnliches geändert, vor dem nächsten Ruhen zeichnen). */
  wake(cold = false) {
    if (cold) this.dirty = true;
    this.still = 0;
    // Eingabe oder Anstoss: eine Weile keine Ruhe-Bildrate (frameRate.ruhe), das nächste Bild sofort (erst ab start: frameRate
    // steht weiter unten im Script)
    if (this.started) frameRate.rege();
    if (this.awake || !this.started) return;
    this.awake = true;
    this.last = null;
    // Sichtbar: das erste Bild nach dem Ruhen sofort (frameRate), die Pause ist kein langsames Bild
    frameRate.skipped = Infinity;
    frameRate.prevTs = null;
    adaptiveResolution.skip = Math.max(adaptiveResolution.skip, 1);
    requestAnimationFrame(frame);
  },
  start() {
    this.started = true;
    this.wake();
  },
  /**
   * Darf verdeckt gezeichnet werden? Nicht während der Enthüllung des Startbildschirms, auch nicht das allererste Bild
   * (waren die Shader bei ihrem Beginn noch nicht übersetzt, wärmt die Szene erst danach auf, introCalm). Hinter der
   * eingeblendeten Bühne nur an einer ruhigen Stelle (ruhe: beim Warten auf Tippen, beim Angebot), nie mitten in einer
   * Fahrt: Das Bild kostete auf dem Poco 137 ms (Review Ticket 02); was liegen blieb, zeichnet sie dann (story.stillBild
   * weckt).
   */
  mayDraw() {
    if (flow.state === 'intro') return this.calm || !ui.intro.classList.contains('go');
    return !this.storyOpaque || ruhe.jetzt();
  },
  /** Jetzt einmal zeichnen, ohne sichtbar zu sein (vor der Enthüllung des Startbildschirms, siehe ui.init). */
  aufwaermen() {
    if (!this.started || this.warm) return;
    const t0 = leistung.bildBeginn();
    animate(FIXED_TIME ?? sceneTime.at(), 0); // Kamera und Uniforms auf den Stand, ohne Zeit vorzuspulen
    draw(1 / 60, t0, false);
  },
};

/**
 * Arbeit in Häppchen: führt einen Generator aus, der zwischendurch yield sagt, und gibt nach SLICE_MS ans nächste Bild
 * ab (yield NEXT_FRAME: sofort). So laufen Intro und Spiel flüssig weiter, während eine Skybox aufgebaut wird.
 * Ergebnis: der Rückgabewert. was: Name der Arbeit fürs Protokoll (arbeit).
 */
const SLICE_MS = 6;
const NEXT_FRAME = Symbol('nächstes Bild');
/** yield RUHIG: erst weiter an einer ruhigen Stelle (ruhe), yield RUHIG_KLEIN: ebenso, für kleine Uploads (ruhe.jetzt) */
const RUHIG = Symbol('ruhige Stelle'), RUHIG_KLEIN = Symbol('ruhige Stelle, klein');
/**
 * Protokoll der Arbeit beim Vorladen und Aufbauen (Ticket 11 von .scratch/brett-je-himmel/): Welches Stück (Himmel,
 * Brett, Shader, Hochladen, Vorzeichnen, erstes Bild) lief wann und wie lange im Hauptthread. Nur für Proben
 * (window.__arbeitAn vor dem Laden gesetzt, Geschichte-Probe), sonst kostet es nur die Abfrage von an. log: [Beginn
 * (performance.now), ms, was]; merke: ein Ereignis ohne Dauer (etwa das erste Bild eines Panoramas).
 */
const arbeit = {
  an: window.__arbeitAn === true,
  log: [],
  /** fn() als Arbeit was ausführen und protokollieren */
  tue(was, fn) {
    if (!this.an) return fn();
    const t = performance.now();
    try { return fn(); } finally { this.eintrag(t, performance.now() - t, was); }
  },
  merke(was) { if (this.an) this.eintrag(performance.now(), 0, was); },
  eintrag(t, ms, was) {
    const last = this.log.at(-1);
    // Häppchen derselben Arbeit im selben Bild (sliced) zusammenfassen: höchstens SLICE_MS auseinander
    if (last && last[2] === was && ms > 0 && t - (last[0] + last[1]) < 2) last[1] = t + ms - last[0];
    else this.log.push([t, ms, was]);
    if (this.log.length > 20000) this.log.splice(0, 5000);
  },
};
/**
 * Grafikspeicher eines Himmels aus Blender freigeben, ohne dass man es sieht (Ticket 11 von .scratch/brett-je-himmel/).
 * Beim Wechsel gab er bisher alles auf einmal frei: Texturen (am Desktop mit den Streifen rund 300 MB), Netze und
 * Programme. Das hielt den Grafikprozess im ersten Bild des neuen Himmels 70–125 ms an (headless mit Grafikkarte;
 * gemessen mit dem Protokoll der Arbeit, `--grenzen`). Je Bild eine grosse Textur kostete im Überblenden noch je 53 ms,
 * eine Sekunde später einmal 143 ms; in einem ruhigen Level dagegen nichts. Darum wartet die Freigabe auf ein stilles
 * Bild (still: ein Level läuft, nichts blendet über, keine Feier, kein Menü, keine Übersicht, seit STILL_MS), gibt dann
 * je Bild eine grosse Textur (schwer) oder Kleines in Häppchen (sliced) frei und fragt vor jedem Stück neu. Länger als
 * FRIST_MS wartet nichts (dann wie bisher, nur in Häppchen). add(fn, schwer, was): fn gibt frei; was: Name im
 * Protokoll (arbeit).
 */
const freigabe = {
  STILL_MS: 500,
  FRIST_MS: 20000,
  liste: [],      // [fn, schwer, was, seit (performance.now)]
  laeuft: false,
  stillSeit: null,
  add(fn, schwer = false, was = 'Freigeben') {
    this.liste.push([fn, schwer, was, performance.now()]);
    if (!this.laeuft) this.start();
  },
  /** grosse Textur: eigenes Bild (ab 1 M Pixel, etwa das ganze Bild oder ein Streifen eines Himmels) */
  schwer(t) { return (t.image?.width ?? 0) * (t.image?.height ?? 0) >= 1 << 20; },
  /** jetzt ein stilles Bild, seit STILL_MS */
  still() {
    const jetzt = flow.state === 'play' && !celebration.active && skyTheme.ready && !story.running && !menu.offen
      && !uebersicht.offen;
    if (!jetzt) { this.stillSeit = null; return false; }
    this.stillSeit ??= performance.now();
    return performance.now() - this.stillSeit >= this.STILL_MS;
  },
  /** Promise: an einem stillen Bild oder wenn das älteste Stück FRIST_MS wartet (alle 100 ms gefragt, ohne rAF) */
  warte() {
    const ok = () => this.still() || performance.now() - (this.liste[0]?.[3] ?? 0) >= this.FRIST_MS;
    if (ok()) return Promise.resolve();
    return new Promise((weiter) => { const frage = () => (ok() ? weiter() : setTimeout(frage, 100)); setTimeout(frage, 100); });
  },
  start() {
    this.laeuft = true;
    (async () => {
      while (this.liste.length) {
        await this.warte();
        const t = performance.now(), was = this.liste[0][2];
        arbeit.tue(was, () => {
          // eine grosse Textur allein in diesem Bild, sonst Kleines bis SLICE_MS und vor der nächsten grossen halt
          for (let erstes = true; this.liste.length && performance.now() - t < SLICE_MS; erstes = false) {
            const [fn, schwer] = this.liste[0];
            if (schwer && !erstes) break;
            this.liste.shift();
            try { fn(); } catch (e) { console.warn(`Freigeben: ${e.message}`); }
            if (schwer) break;
          }
        });
        await nextFrame();
      }
    })().finally(() => { this.laeuft = false; if (this.liste.length) this.start(); });
  },
};
async function sliced(steps, ruhig = false, was = 'Häppchen') {
  if (ruhig) await ruhe.warte();
  for (let t = performance.now(); ;) {
    const { done, value } = arbeit.an ? arbeit.tue(was, () => steps.next()) : steps.next();
    if (done) return value;
    if (value === RUHIG || value === RUHIG_KLEIN) {
      if (!ruhe.jetzt(value === RUHIG_KLEIN)) { await ruhe.warte(value === RUHIG_KLEIN); t = performance.now(); }
    } else if (value === NEXT_FRAME || performance.now() - t > SLICE_MS) {
      await nextFrame();
      if (ruhig) await ruhe.warte(); // ruhig: auch jedes Häppchen Rechnen nur an ruhigen Stellen (Aufbau einer Skybox)
      t = performance.now();
    }
  }
}

/**
 * Ruhige Stellen (Ticket 03 der Leistung): Was den Hauptthread oder den Grafikprozess länger anhält, läuft nur, wenn
 * nichts Sichtbares animiert: eine Skybox aufbauen (Netz und Ebenen in Häppchen, sliced mit ruhig), ihre Shader
 * übersetzen, ihre Netze und Texturen hochladen, ihr erstes Zeichnen
 * (skyWarmDraw), ein Brett übersetzen und hochladen (boardTheme.load), Vorwärmen von Menü, Bühne und Übersicht, Ton
 * vorbereiten. WebGL anhalten genügt nicht: Das erste
 * Schreiben in eine grosse Textur hält den Grafikprozess 30–80 ms an, und über ihn laufen auch CSS und SVG.
 * Ruhig ist: vor der Enthüllung des Startbildschirms (die Seite lädt) und nach ihr (introCalm: nur «Klicken zum
 * Starten» pulsiert), auf der Bühne beim Warten auf Tippen und beim Angebot (nicht während einer Fahrt, nicht beim Ein-
 * und Ausblenden), ein markiertes Laden hinter einer Überblendung (lade: story.skyOf) und das Spiel selbst (dort regeln
 * skyTheme.quiet und preload, wann eine Skybox lädt). Nicht ruhig: die Enthüllung, Menü und Übersicht (ausser mit
 * ?nointro, den Tests ohne Startbildschirm: dort wie bisher), die Bühne sonst. klein: Uploads, die keinen Frame kosten
 * (Vorschau einer Skybox, 1024 Pixel breit), dürfen auch unter Menü und Übersicht.
 */
const RUHE_OHNE_START = new URLSearchParams(location.search).has('nointro');
/**
 * Diagnose-Schalter für den Vergleich auf dem Handy (Ticket 18), ?diag=a,b: je Schalter genau eine Ursache weg.
 * ohnevorbereitung: solange die Bühne zu sehen ist, keine ruhige Stelle (ruhe.jetzt), also kein Laden, Vorwärmen und
 * Zeichnen von WebGL dahinter; ohneleuchten: Glühwürmchen ohne ihren Lichthof (nur der Kern); ohnestrahl: kein Strahl
 * der Lampe; ruhepunkte: hinter der Bühne laden wie bis Ticket 18 in jedem Ruhepunkt (sonst nicht vor den Flügen der
 * Glühwürmchen); seite275: Massstab der Seite wie bis Ticket 18 (SEITE, im Kopf der Seite).
 */
const DIAG = new Set((new URLSearchParams(location.search).get('diag') ?? '').split(',').filter(Boolean));
const ruhe = {
  calm: false,    // Startbildschirm ruhig (introCalm)
  laden: 0,       // markiertes Laden hinter einer Überblendung (lade)
  jetzt(klein = false) {
    if (this.laden) return true;
    if (flow.state === 'intro') return !ui.intro.classList.contains('go') || this.calm;
    if (story.choosing) return klein || RUHE_OHNE_START;
    if (!story.el.inert && story.el.dataset.mode === 'scene') { // die Bühne ist da (nicht nur vorgewärmt)
      if (DIAG.has('ohnevorbereitung')) return false;
      // nicht im Ruhepunkt vor einem Flug der Glühwürmchen (ladeSperre, ausser Kleinem): Die Arbeit lief auf dem Adreno
      // noch in die Fahrt hinein, wenn getippt wurde, und die Glühwürmchen stockten (Poco, Ticket 18; ?diag=ruhepunkte: wie bisher)
      return story.stillBild && (klein || !story.ladeSperre || DIAG.has('ruhepunkte')) && performance.now() >= story.stillAb
        && !story.scene?.laeuft;
    }
    return true;
  },
  /** Promise, erfüllt an der nächsten ruhigen Stelle (alle 50 ms gefragt: kein rAF, die Szene darf ruhen) */
  warte(klein = false) {
    if (this.jetzt(klein)) return Promise.resolve();
    return new Promise((weiter) => {
      const frage = () => (this.jetzt(klein) ? weiter() : setTimeout(frage, 50));
      setTimeout(frage, 50);
    });
  },
  /** Laden hinter einer Überblendung, bis promise erledigt ist: ruhig, im Messwerkzeug als Laden markiert */
  lade(promise) {
    this.laden++;
    const ende = leistung.markiere('laden');
    return promise.finally(() => { this.laden--; ende(); });
  },
};

/**
 * Shader übersetzen, ohne den Hauptthread anzuhalten. three 0.147 übersetzt ein Programm beim ersten Zeichnen (oder in
 * renderer.compile) und fragt gleich danach seine Uniforms ab – das wartet, bis die Grafik fertig ist. Beim Start sind
 * das über 40 Programme nacheinander (gemessen 0,6 s mit Shader-Cache des Browsers, ohne über 3 s), und Intro und
 * Einblenden stehen so lange still. Mit KHR_parallel_shader_compile stösst compileParallel alle Programme zuerst an,
 * wartet Bild für Bild, bis die Grafik sie (in eigenen Threads) fertig hat, und lässt three sie erst dann einrichten.
 * Kniff, an three 0.147 gebunden: Beim Anstossen wirft die Abfrage der Uniforms (ACTIVE_UNIFORMS) PENDING, solange das
 * Programm nicht fertig ist. three hat es da schon beim Material abgelegt und richtet es beim nächsten compile oder
 * render fertig ein. Ohne die Erweiterung wie bisher renderer.compile (wartet).
 */
const compileParallel = (() => {
  const gl = renderer.getContext();
  const ext = gl.getExtension('KHR_parallel_shader_compile');
  const PENDING = Symbol('Programm noch nicht fertig');
  // compile() geht mit root.traverse über die Materialien, auch über unsichtbare: nur über objects (ohne die Teilbäume in
  // skip, siehe collect) und PENDING je Objekt abfangen, damit compile zu Ende läuft
  function issue(root, objects) {
    root.traverse = function (cb) {
      for (const o of objects) { try { cb(o); } catch (e) { if (e !== PENDING) throw e; } }
    };
    try { renderer.compile(root, camera); } finally { delete root.traverse; }
  }
  function collect(root, skip) {
    const list = [];
    const walk = (o) => { if (skip.has(o)) return; list.push(o); for (const c of o.children) walk(c); };
    walk(root);
    return list;
  }
  let issued = null; // während des Anstossens: die neu gelinkten Programme
  const deleted = new WeakSet();
  const getParam = gl.getProgramParameter.bind(gl);
  if (ext) {
    const link = gl.linkProgram.bind(gl), del = gl.deleteProgram.bind(gl);
    gl.linkProgram = (p) => { link(p); issued?.push(p); };
    gl.deleteProgram = (p) => { deleted.add(p); del(p); };
    gl.getProgramParameter = (p, name) => {
      if (issued && name === gl.ACTIVE_UNIFORMS && !getParam(p, ext.COMPLETION_STATUS_KHR)) throw PENDING;
      return getParam(p, name);
    };
  }
  // Jede Abfrage geht zum Grafikprozess und wartet, bis er seine Warteschlange abgearbeitet hat: nur nötige stellen
  const done = (p) => deleted.has(p) || gl.isContextLost() || getParam(p, ext.COMPLETION_STATUS_KHR);
  /** Anstossen: batch = [[Wurzel, Objekte]], je Fassung (variants: setzt sie, null = wie es ist) */
  function run(batch, variants, programs) {
    const check = renderer.debug.checkShaderErrors;
    // diese Prüfung im Konstruktor fragte sofort ab (und wartete); ohne die Erweiterung wartet three ohnehin, dann
    // bleibt sie (sonst fehlte dort jede Meldung über einen fehlerhaften Shader)
    if (ext) renderer.debug.checkShaderErrors = false;
    issued = ext ? programs : null;
    try {
      for (const variant of variants) {
        const undo = variant?.();
        // Durchsichtig und beidseitig: three übersetzt Rück- und Vorderseite nacheinander und stellt side dazwischen um.
        // Wirft die erste, bliebe side verstellt und die zweite fehlte – darum beide Seiten einzeln anstossen.
        const both = new Set();
        for (const [, objects] of batch) for (const o of objects) {
          for (const m of [o.material ?? []].flat()) if (m.transparent && m.side === THREE.DoubleSide) both.add(m);
        }
        try {
          for (const side of both.size ? [THREE.BackSide, THREE.FrontSide] : [null]) {
            if (side !== null) for (const m of both) m.side = side;
            for (const [root, objects] of batch) issue(root, objects);
          }
        } finally {
          for (const m of both) m.side = THREE.DoubleSide;
          undo?.();
        }
      }
    } finally {
      issued = null;
      renderer.debug.checkShaderErrors = check;
    }
  }
  /**
   * skip: Teilbäume, die (noch) nicht gebraucht werden, etwa ein gerade nicht gezeigter Hintergrund. variants: Fassungen
   * (Funktionen, die sie einstellen und optional eine zurück zum vorigen Zustand geben), je anzustossen. slices: in
   * Häppchen über mehrere Bilder anstossen (je etwa SLICE_MS, ein Material und eine Fassung je Aufruf):
   * three erzeugt den Code jedes Programms synchron, über die ganze Szene hielt das beim Aufbau einer Skybox ein Bild
   * auf dem gedrosselten Handy 230 ms an (Ticket 09 der Leistung). Dann gelten die Fassungen nur je Häppchen; zwischen
   * den Bildern bleibt die letzte eingestellt, sofern sie nichts zurückgibt. alive (mit slices): falsch, sobald das
   * Übersetzen nicht mehr gebraucht wird (Abbruch des Aufbaus); ebenso fällt aus, was inzwischen nicht mehr unter seiner
   * Wurzel hängt (entfernt, womöglich schon freigegeben: three legte sonst neue Programme für entsorgte Materialien an).
   * sliceMs: Länge eines Häppchens (Seitenstart: länger, dort animiert noch nichts), pause: was zwischen zwei Häppchen
   * abwartet (Seitenstart: nur eine neue Aufgabe). issued: wird gerufen, sobald alles angestossen ist (das Übersetzen
   * läuft dann noch im Hintergrund).
   */
  return async function compileParallel(roots, {
    skip = [], variants = [null], slices = false, alive = () => true, sliceMs = SLICE_MS, issued: onIssued = null,
    pause = nextFrame, was = 'Shader',
  } = {}) {
    const omit = new Set(skip), programs = [];
    const lists = roots.map((r) => [r, collect(r, omit)]);
    if (!slices) arbeit.tue(was, () => run(lists, variants, programs));
    else {
      let t = performance.now();
      for (const [root, objects] of lists) {
        for (let i = 0; i < objects.length;) {
          const part = [];
          // je Material und Fassung einzeln: Ein grosses Programm kostet allein bis 30 ms bei 4×, und wo der Treiber nicht
          // wirklich parallel übersetzt, wartet schon das Anstossen (die Abfrage in getProgramParameter) darauf
          for (let n = 0; i < objects.length && n < 1;) {
            const o = objects[i++];
            let top = o;
            while (top.parent) top = top.parent;
            if (top !== root) continue;
            part.push(o);
            if (o.material) n++;
          }
          for (const variant of variants) {
            if (!alive()) return;
            arbeit.tue(was, () => run([[root, part]], [variant], programs));
            if (performance.now() - t > sliceMs) { await pause(); t = performance.now(); }
          }
        }
      }
    }
    onIssued?.();
    if (!ext) return; // ohne die Erweiterung hat three schon gewartet
    // je Bild bis zum ersten unfertigen (sie werden etwa der Reihe nach fertig); höchstens rund 10 s, falls ein Treiber
    // nie fertig meldet – dann wartet three eben beim ersten Zeichnen
    let ready = 0;
    for (let frames = 0; ready < programs.length && frames++ < 600;) {
      await nextFrame();
      while (ready < programs.length && done(programs[ready])) ready++;
    }
    if (renderer.debug.checkShaderErrors && !gl.isContextLost()) {
      for (const p of programs.slice(0, ready)) { // nur fertige: eine Abfrage an einem unfertigen wartete
        if (deleted.has(p) || getParam(p, gl.LINK_STATUS)) continue;
        const logs = (gl.getAttachedShaders(p) ?? []).map((s) => (gl.getShaderInfoLog(s) ?? '').trim()).filter(Boolean);
        console.error(`THREE.WebGLProgram: Shader Error – ${gl.getProgramInfoLog(p)}\n${logs.join('\n')}`);
      }
    }
    // Einrichten (Uniforms lesen) übernimmt three beim ersten Zeichnen, jetzt ohne Warten. Ein renderer.compile hier
    // wartete auf Programme, die ein anderer Aufruf gleichzeitig übersetzt (Skybox während der Szene).
  };
})();

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(LOOK.fogColor, LOOK.fogDensity);

// Near-Plane bewusst nicht zu klein: die Kamera ist nie näher als ~6 Einheiten (herangezoomt), und eine grosse
// Near-Plane verbessert die Tiefenauflösung erheblich (verhindert Z-Fighting am Boden). Far-Plane: auch
// herausgezoomt im Hochformat (Kamera bis ~40 entfernt) liegt das Netz eines Panoramas davor (PANO.dMax).
const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 1.0, 140);
const LAYER_NO_REFLECT = 1; // Objekte auf dieser Ebene erscheinen nicht in der Bodenspiegelung
camera.layers.enable(LAYER_NO_REFLECT);

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  camera: () => camera, renderer: () => renderer, ruhe: () => ruhe, sceneLoop: () => sceneLoop,
});

export {
  arbeit, camera, compileParallel, DIAG, discardDepth, freigabe, HDR_SUPPORTED, HDR_TYPE, LAYER_NO_REFLECT,
  markSceneReady, markShadowsDirty, NEXT_FRAME, nextFrame, renderer, REST_STEPS, ruhe, RUHE_OHNE_START, RUHIG,
  RUHIG_KLEIN, scene, SCENE_PREPASSES, sceneLoop, sceneReady, sliced,
};
