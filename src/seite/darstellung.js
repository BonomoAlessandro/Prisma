// Darstellung (Ticket 04 von .scratch/umbau/, bis dahin das zweite Skript in index.html): Renderer, Texturen,
// Umgebung, Himmel und Skyboxen, Brett, Licht und Bildschritte (Bloom).
//
// Seitenstart in Stücken (Ticket 10 der Leistung): Bis Ticket 04 des Umbaus waren die Teile der Seite drei klassische
// Skripte, die der Browser in eigenen Aufgaben übersetzte und startete. Als Module laufen sie in einer; darum wartet
// dieses Modul zuerst auf eine neue Aufgabe (await auf oberster Ebene), an derselben Stelle wie früher die Grenze der
// Skripte. Die Module laufen in der Reihenfolge ihrer Teile wie früher: Jedes importiert zuerst das vorherige (auch nur
// dafür), src/main.ts das letzte. Beim Laden ruft ein Teil nichts aus einem späteren auf.
import {
  BOARD, CELL, FIXED_TIME, GRID, IS_MOBILE, LOOK, PLATE, PLATE_THICK, QUALITY, SPIEGEL_ALLE,
} from './konfiguration.js';
import {
  adaptiveResolution, animate, beamView, cameraRig, CELEBRATE, celebration, clock, draw, flow, frame, frameRate, game,
  himmelsWagen, input, leistung, menu, sceneTime, story, uebersicht, ui, weigernde,
} from './spiel.js';
import { mulberry32 } from '../zufall.js';
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

/* =====================================================================
   PROZEDURALE TEXTUREN
   ===================================================================== */

// Deterministischer Zufall (mulberry32, oben bei FIXED_TIME), damit das Steinbrett bei jedem Laden gleich aussieht.

function makeNoise2D(seed) {
  const rand = mulberry32(seed);
  const perm = new Uint8Array(512);
  const grad = new Float32Array(256);
  for (let i = 0; i < 256; i++) { perm[i] = i; grad[i] = rand(); }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  const fade = t => t * t * (3 - 2 * t);
  // Value-Noise im Bereich [0,1]
  return function (x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const X = xi & 255, Y = yi & 255;
    const a = grad[perm[perm[X] + Y]], b = grad[perm[perm[X + 1] + Y]];
    const c = grad[perm[perm[X] + Y + 1]], d = grad[perm[perm[X + 1] + Y + 1]];
    const u = fade(xf), v = fade(yf);
    return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
  };
}

/**
 * Texturen eines Bretts, im Spiel berechnet: in einem Worker (Blob wie beim Dekodieren der Skybox). Im Hauptthread
 * kostete das Steinbrett gut die Hälfte des Hängers beim Laden der Seite (Ticket 03 der Leistung; 1024² Pixel mit je 16
 * Oktaven Rauschen). Bis die Daten da sind, sind die Texturen leer (nie hochgeladen). Hochgeladen werden sie danach in
 * Häppchen an ruhigen Stellen (boardTheme.load, boardTextureUpload). Ohne Worker wie früher im Hauptthread.
 * specs: { name: [Breite, Höhe, sRGB, wiederholt] } der RGBA-Texturen (Mipmaps, Zeile 0 bei uv.y = 0); compute(arg) rechnet
 * { name: Uint8ClampedArray } und kennt nur sich selbst und helpers (Funktionen, die mit in den Worker kommen).
 * Rückgabe: { name: DataTexture, …, computed (Promise: erfüllt, sobald die Daten da sind; abgelehnt, wenn das Rechnen
 * scheitert) }.
 */
function boardTextures(specs, compute, arg, helpers = []) {
  const out = {};
  for (const [name, [w, h, srgb, repeat]] of Object.entries(specs)) {
    const tex = out[name] = new THREE.DataTexture(new Uint8ClampedArray(w * h * 4), w, h, THREE.RGBAFormat);
    tex.encoding = srgb ? THREE.sRGBEncoding : THREE.LinearEncoding;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    tex.flipY = false;
    if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  }
  let done = false, fertig, gescheitert;
  out.computed = new Promise((ja, nein) => { fertig = ja; gescheitert = nein; });
  const fill = (d) => {
    if (done) return;
    done = true;
    for (const name of Object.keys(specs)) {
      out[name].image.data.set(d[name]);
      out[name].needsUpdate = true;
    }
    fertig();
  };
  const sicher = (f) => { try { f(); } catch (e) { gescheitert(e); } }; // gescheitert: das Steinbrett als Notfall
  const hier = () => sicher(() => fill(compute(arg))); // im Hauptthread
  try {
    const url = URL.createObjectURL(new Blob([`${helpers.join('\n')}\n${compute}
      onmessage = ({ data }) => { const d = ${compute.name}(data); postMessage(d, Object.values(d).map((a) => a.buffer)); };`],
    { type: 'text/javascript' }));
    const worker = new Worker(url);
    URL.revokeObjectURL(url);
    worker.onmessage = ({ data }) => { worker.terminate(); sicher(() => fill(data)); };
    worker.onerror = () => { worker.terminate(); hier(); }; // Worker nicht ladbar (CSP): im Hauptthread
    worker.postMessage(arg);
  } catch { hier(); }
  return out;
}

/**
 * Erzeugt Farb-, Rauheits- und Normal-Map des Steinbretts: dunkler, fein
 * geäderter Schiefer. Nur die weichen, grossflächigen Strukturen stecken in
 * der Textur – scharfe Details (Rasterlinien, Intarsie, Mikrokörnung) rechnet
 * der Boden-Shader analytisch, damit sie in jeder Auflösung scharf bleiben.
 * Rückgabe: { map, roughnessMap, normalMap, computed } (boardTextures, stoneBoard).
 */
function createStoneTextures(size) {
  return boardTextures({ map: [size, size, true], roughnessMap: [size, size, false], normalMap: [size, size, false] },
    stoneData, size, [mulberry32, makeNoise2D]);
}

/** Farbe, Rauheit und Normalen des Steinbretts (createStoneTextures), ohne Bezug auf das übrige Spiel (Worker). */
function stoneData(size) {
  const noise = makeNoise2D(7);
  // Jede Oktave gedreht (~37°) und versetzt, damit sich Strukturen nicht in mehreren Grössen wiederholen
  const ROT_C = Math.cos(0.65), ROT_S = Math.sin(0.65);
  const fbm = (x, y, oct) => {
    let s = 0, a = 0.5;
    for (let i = 0; i < oct; i++) {
      s += a * noise(x, y);
      const nx = (x * ROT_C - y * ROT_S) * 2.03 + 17.1;
      y = (x * ROT_S + y * ROT_C) * 2.03 + 5.3;
      x = nx;
      a *= 0.5;
    }
    return s;
  };

  const n = size * size;
  const height = new Float32Array(n);
  const color = new Uint8ClampedArray(n * 4);
  const rough = new Uint8ClampedArray(n * 4); // three.js liest die Rauheit aus dem G-Kanal

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const u = x / size * 6, v = y / size * 6;

      const base = fbm(u, v, 5);
      const warp = fbm(u * 0.6 + 11.3, v * 0.6 + 4.1, 4);
      // Adern als Höhenlinie eines verzerrten Rauschfelds: organisches, nicht periodisches Netz
      const rn = fbm(u * 0.7 + warp * 2.2 + 3.1, v * 0.7 - warp * 1.7 + 8.4, 4);
      const vein = Math.pow(Math.max(0, 1 - Math.abs(rn * 2 - 1) * 9), 2.2);
      const cloud = fbm(u * 0.35 + 3.7, v * 0.35 + 9.2, 3);

      height[i] = base * 0.5 + vein * 0.08;

      // Farbe (sRGB): tiefes Schiefer mit leichtem Blaustich und grossen, ruhigen Wolken
      const tone = 0.85 + cloud * 0.3;
      color[i * 4] = (13 + base * 11 + vein * 15) * tone;
      color[i * 4 + 1] = (13 + base * 11 + vein * 15) * tone;
      color[i * 4 + 2] = (17 + base * 14 + vein * 20) * tone;
      color[i * 4 + 3] = 255;

      // Rauheit: poliert, Adern noch etwas glatter
      const ro = Math.max(0, Math.min(1, 0.30 + (base - 0.5) * 0.25 - vein * 0.12));
      rough[i * 4] = 255; rough[i * 4 + 1] = ro * 255; rough[i * 4 + 2] = 255; rough[i * 4 + 3] = 255;
    }
  }

  // Normal-Map aus der Höhenkarte (Sobel) – bewusst sanft
  const normal = new Uint8ClampedArray(n * 4);
  const strength = 1.4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xm = Math.max(0, x - 1), xp = Math.min(size - 1, x + 1);
      const ym = Math.max(0, y - 1), yp = Math.min(size - 1, y + 1);
      const dx = (height[y * size + xp] - height[y * size + xm]) * strength;
      const dy = (height[yp * size + x] - height[ym * size + x]) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      normal[i] = (-dx / len * 0.5 + 0.5) * 255;
      normal[i + 1] = (dy / len * 0.5 + 0.5) * 255;
      normal[i + 2] = (1 / len * 0.5 + 0.5) * 255;
      normal[i + 3] = 255;
    }
  }

  return { map: color, roughnessMap: rough, normalMap: normal };
}

/**
 * Farbe, Rauheit, Normalen und Seiten des Gezeitenbeckens (tidePoolBoard), ohne Bezug auf das übrige Spiel (Worker).
 * Formeln und Farben aus Karte 6 des Skizzenkatalogs (.scratch/brett-je-himmel/katalog/bretter/varianten/6-wasserrand.js):
 * Feld aus hellem Sandstein in Schichten, am Rand zum Wasser dunkel und nass; in der Rinne klares Wasser über Sand mit
 * Lichtnetz, Schaum an beiden Kanten und leichten Wellen; aussen eine Felslippe. Seiten: nasser Fels mit Rinnsalen,
 * unten Algen. a: { size (Oberfläche size², Seiten size × sideH), sideH, plate (Umriss, m), stone, water, rock (je zwei
 * Farben, sRGB 0 … 1), channel ([innen, aussen], Kastenabstand von der Mitte in m) }.
 */
function tidePoolData(a) {
  // Wertrauschen wie im Katalog: Gitter aus Hash-Werten, je Oktave mit eigenem Samen
  const hash = (x, y, s) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const p = hash(xi, yi, s), q = hash(xi + 1, yi, s), r = hash(xi, yi + 1, s), t = hash(xi + 1, yi + 1, s);
    return p + (q - p) * u + (r - p) * v + (p - q - r + t) * u * v;
  };
  const fbm = (x, y, oct, s) => {
    let sum = 0, amp = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { sum += amp * noise(x * f, y * f, s + i * 17); n += amp; amp *= 0.5; f *= 2.03; }
    return sum / n;
  };
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const smooth = (e0, e1, v) => { const t = clamp((v - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  const mix = (p, q, t) => p + (q - p) * t;
  const mix3 = (p, q, t) => [mix(p[0], q[0], t), mix(p[1], q[1], t), mix(p[2], q[2], t)];
  const N = a.size, P = a.plate, [IN, OUT] = a.channel, [stone, stone2] = a.stone;
  const [water, water2] = a.water, [lip, lip2] = a.rock;

  const map = new Uint8ClampedArray(N * N * 4), roughnessMap = new Uint8ClampedArray(N * N * 4);
  const height = new Float32Array(N * N);
  for (let j = 0; j < N; j++) {
    const z = (0.5 - (j + 0.5) / N) * P; // Zeile 0 bei uv.y = 0, also vorn (z = +P / 2)
    for (let i = 0; i < N; i++) {
      const x = ((i + 0.5) / N - 0.5) * P, k = j * N + i;
      const box = Math.max(Math.abs(x), Math.abs(z));
      const g = fbm(x * 0.5, z * 0.5, 5, 81), layer = fbm(x * 0.15 + g, z * 2.5, 3, 82), fine = noise(x * 150, z * 150, 83);
      let c, r, h;
      if (box < IN) {
        // Sandstein in Schichten, feines Korn; zum Wasser hin dunkel und nass
        c = mix3(stone, stone2, smooth(0.3, 0.75, layer));
        c = mix3(c, [c[0] * 0.92, c[1] * 0.9, c[2] * 0.9], fine * 0.5);
        const wetEdge = smooth(IN - 0.12, IN, box);
        c = mix3(c, [c[0] * 0.72, c[1] * 0.7, c[2] * 0.7], wetEdge);
        r = 0.86 - wetEdge * 0.4;
        h = (layer - 0.5) * 0.002 + (fine - 0.5) * 0.0005;
      } else if (box < OUT) {
        // Wasser: Grund (Sand, Kiesel) türkis getönt, Lichtnetz (Kaustik), Schaum an den Kanten
        const cx = Math.abs(fbm(x * 2.2 + 3, z * 2.2, 3, 84) - 0.5), cz = Math.abs(fbm(x * 2.2, z * 2.2 + 7, 3, 85) - 0.5);
        const caustic = Math.pow(Math.max(0, 1 - Math.min(cx, cz) * 4.2), 6);
        c = mix3(water, water2, g);
        c = mix3(c, [0.86, 0.97, 0.92], clamp(caustic) * 0.55);
        const foamIn = smooth(IN + 0.07 + (noise(x * 9, z * 9, 86) - 0.5) * 0.06, IN, box);
        const foamOut = smooth(OUT - 0.05 + (noise(x * 11, z * 11, 87) - 0.5) * 0.04, OUT, box) * 0.6;
        const foam = clamp(foamIn + foamOut) * (0.6 + 0.4 * noise(x * 40, z * 40, 88));
        c = mix3(c, [0.95, 0.97, 0.95], foam);
        r = mix(0.03, 0.7, foam);
        h = -0.004 + Math.sin((x * 0.7 + z * 0.7) * 22 + fbm(x, z, 2, 89) * 6) * 0.0012
          + (noise(x * 30, z * 30, 90) - 0.5) * 0.0008;
      } else {
        c = mix3(lip, lip2, fbm(x * 3, z * 3, 3, 91)); // Felslippe
        r = 0.7;
        h = 0.006 + (fine - 0.5) * 0.002;
      }
      map[k * 4] = c[0] * 255; map[k * 4 + 1] = c[1] * 255; map[k * 4 + 2] = c[2] * 255; map[k * 4 + 3] = 255;
      roughnessMap[k * 4] = roughnessMap[k * 4 + 1] = roughnessMap[k * 4 + 2] = r * 255; // three liest G
      roughnessMap[k * 4 + 3] = 255;
      height[k] = h;
    }
  }
  // Normalen aus den Höhen (Tangentenraum: x nach rechts, uv.y nach hinten)
  const normalMap = new Uint8ClampedArray(N * N * 4), texel = P / N;
  const H = (i, j) => height[Math.min(N - 1, Math.max(0, j)) * N + Math.min(N - 1, Math.max(0, i))];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const dx = (H(i + 1, j) - H(i - 1, j)) / (2 * texel), dv = (H(i, j + 1) - H(i, j - 1)) / (2 * texel);
      const l = Math.hypot(dx, dv, 1), k = (j * N + i) * 4;
      normalMap[k] = (-dx / l * 0.5 + 0.5) * 255;
      normalMap[k + 1] = (-dv / l * 0.5 + 0.5) * 255;
      normalMap[k + 2] = (1 / l * 0.5 + 0.5) * 255;
      normalMap[k + 3] = 255;
    }
  }
  // Seiten (Box-UV, je Seite u über die ganze Länge, v 0 oben … 1 unten): nasser Fels, dunkle Rinnsale, unten Algen
  const SH = a.sideH, side = new Uint8ClampedArray(N * SH * 4);
  for (let j = 0; j < SH; j++) {
    const v = 1 - (j + 0.5) / SH;
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N * P, k = (j * N + i) * 4;
      const g = fbm(u * 1.4, v * 3, 4, 92), streak = fbm(u * 18, v * 0.6, 3, 93);
      let c = mix3(lip, lip2, smooth(0.3, 0.7, g));
      c = mix3(c, [0.22, 0.20, 0.22], smooth(0.55, 0.75, streak) * 0.7);
      c = mix3(c, [0.28, 0.34, 0.22], smooth(0.7, 1, v) * 0.6);
      side[k] = c[0] * 255; side[k + 1] = c[1] * 255; side[k + 2] = c[2] * 255; side[k + 3] = 255;
    }
  }
  return { map, roughnessMap, normalMap, side };
}


/** Gebürstetes Metall: feine horizontale Riefen als Rauheits-Map. */
function createBrushedTexture(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const rand = mulberry32(3);
  ctx.fillStyle = 'rgb(110,110,110)';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 3; i++) {
    const y = rand() * size;
    const v = 80 + rand() * 90;
    ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    ctx.fillRect(0, y, size, rand() * 1.2 + 0.3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Spiegelglas: zwei schräge Lichtstreifen (breit und schmal) als Leucht-Map – das vertraute Zeichen für Spiegel.
 * Ohne sie liest sich die dunkle Fläche im schwarzen Rahmen wie ein Bildschirm.
 */
function makeMirrorStreakTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#fff';
  ctx.filter = 'blur(1.5px)';
  for (const [x, w] of [[30, 22], [64, 8]]) {
    ctx.beginPath();
    ctx.moveTo(x, -4); ctx.lineTo(x + w, -4); ctx.lineTo(x + w - 70, 132); ctx.lineTo(x - 70, 132);
    ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

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

/* =====================================================================
   SKYBOX AUS BLENDER — Hintergründe, die in Blender (Cycles) als Panorama entstehen (tools/blender/; welchen das Spiel
   zeigt, bestimmt die Welt, siehe skyTheme). Jede steht mit einem Manifest im Register backgrounds/skies.js (erzeugt
   von tools/blender/pack.mjs, Felder in tools/sky-schema.mjs). Ihre Bilder liegen als Skripte mit Data-URLs in
   backgrounds/<id>/, weil Chrome Bilder aus file:// nicht in WebGL-Texturen lässt, und laden erst bei der Wahl: base
   (ganzes Equirect, Tiefe, Daten der Ebenen, jedes Gerät) und auf dem Desktop bands (hoch aufgelöste Streifen für den
   Blick nach unten).
   Parallaxe: Das Panorama ist von einem Punkt über dem Brett aus gerendert (center). Es liegt nicht auf einer Kugel um
   die Kamera, sondern auf einem Netz um diesen Punkt, jede Ecke so weit draussen wie die Szene in Blender (Tiefe im
   Log-Raum geglättet, sonst rissen Kanten auf). Der Shader rechnet die Richtung vom Mittelpunkt zum Punkt auf dem Netz
   und tastet damit einen Streifen oder das ganze Bild ab. Das Netz schreibt Tiefe, so verdecken Kämme, was dahinter
   liegt (etwa Nebellagen). Grenze des Verfahrens: Dinge nahe am Brett sähe die Kamera aus einem anderen Winkel als der
   Mittelpunkt, sie stünden schräg. Darum fehlen sie im Panorama (nur ihre Schatten sind drin), und das Spiel zeichnet
   sie selbst (Ebenen, SKY_LAYERS).
   Pinsel: Ebenen mit brush: true bekommen Pinselstriche wie das Panorama (anisotroper Kuwahara-Filter wie anime.py,
   createBrushPass); Grösse und Regler im Feld brush der Skybox (size in Grad wie px_per_deg × 0.28, uniformity,
   sharpness, eccentricity, mobile: Stufe auf dem Handy). Ohne brush bleibt alles ungemalt.
   Farben: lineare Szenenwerte, sRGB-kodiert, unter der Bloom-Schwelle (panorama.peak); ACES, Vignette und Korn macht der
   letzte Bildschritt wie bei allem. Ausgeblendet und nicht gewählt, gibt eine Skybox ihren Grafikspeicher frei
   (skyTheme.keep).
   Wald (forest): Mondnacht über einem Nebelmeer, nahe Fichten als 3D-Modelle (toonInstances), ein ziehender
   Nebelschleier (mistSheets) und Glühwürmchen (glowParticles).
   Strand (beach): Abend am Meer, das Brett über einer türkisen Lagune vor dem Strand; nahe Palmen, Bäume und Büsche
   als 3D-Modelle, beleuchtet und gemalt wie im Panorama (paintedInstances, mit Pinsel), Wellen, Schaum und Glitzern
   ums Brett (waterSurface), Fische (fishSchools), nahe Felsen (bakedMesh).
   Vulkan (volcano): Nacht in einem Trichter aus Sand wie dem Gaskrater Darvaza; der Lavasee unter dem Brett (lavaPool),
   Felsbrocken darin (bakedMesh) und die Flammen der Feuernester auf der Böschung (fireNests) zeichnet das Spiel bewegt.
   ===================================================================== */

const SKY_FORMAT = 1; // Fassung des Registers, die das Spiel versteht (tools/sky-schema.mjs)
const PANO = {
  dMin: 6, dMax: 88, // Abstand der Netzecken vom Mittelpunkt: auch im Hochformat (Kamera bis ~40 entfernt) vor camera.far
  blurDeg: 1,        // Glättung der Tiefe (Sigma in Grad); je Skybox panorama.depth.blur
  segU: 512, segV: 256, // Netz; je Skybox panorama.depth.mesh (Wüste: nahe Dünenkämme schärfer)
  appear: 0.6,       // s: Einblenden, wenn die Daten erst nach der Wahl ankommen
  // Streifen nur auf dem Desktop: zusammen mit dem ganzen Bild rund 260 MB Grafikspeicher (ohne: rund 45 MB)
  hd: !IS_MOBILE && renderer.capabilities.maxTextureSize >= 4096,
};

/**
 * Höhe der Texturen für die Streifen (Desktop, Ticket 11): Die Streifen der Welten sind verschieden hoch (Wüste 3823,
 * die übrigen 3413 Zeilen bei 4096 Breite). Das erste Schreiben in eine Textur einer neuen Grösse hielt den
 * Grafikprozess 105–142 ms an, mitten im Spiel. In einer Höhe für alle nimmt der Vorrat (skyTexPool) beim nächsten Himmel
 * die Texturen des vorigen. Der Worker füllt Stufe 0 jedes Streifens mit der wiederholten Kante auf diese Höhe auf
 * (skyBitmaps, pad), dann gehen alle Stufen genau auf; der Shader liest nur den Anteil des Bilds (uKl). Rund 10–20 % mehr
 * Grafikspeicher und Zeilen beim Hochladen für die Streifen.
 */
const BAND_HOEHE = 4096;

/** Zahl als GLSL-Fliesskommazahl (1 -> 1.0), Liste als vec2/vec3 */
const glf = (v) => { const s = String(v); return /[.e]/.test(s) ? s : `${s}.0`; };
const glv = (a) => `vec${a.length}(${a.map(glf).join(', ')})`;

function loadSkyScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => { s.remove(); resolve(); };
    s.onerror = () => { s.remove(); reject(new Error(`${src} nicht geladen`)); };
    document.head.appendChild(s);
  });
}

/**
 * Daten-PNG (Data-URL) ohne Farbangaben. Die PNGs der Skyboxen (Tiefe, Karten) tragen sRGB, gAMA und cHRM; Firefox
 * rechnet solche Bilder ins Farbprofil des Bildschirms um, beim Zeichnen ins Canvas (skyLogDepth, groundShift; three
 * lädt nach WebGL ohne Umrechnung hoch): schon ohne eigenes Profil um ±1, mit dem eines Notebooks bis 36 Stufen je
 * Kanal. Mit 16 Bit in Rot und Grün lagen Tiefe und Wasser dann falsch. Bilder ohne Angaben lässt er, wie sie sind
 * (geprüft mit Firefox 158, Chrome wie vorher). Die Angaben stehen vor den Bilddaten (IDAT), der Rest bleibt unverändert.
 */
const PNG_COLOR_CHUNKS = new Set(['sRGB', 'gAMA', 'cHRM', 'iCCP', 'cICP', 'mDCV', 'cLLI']);
function plainPng(url) {
  const head = 'data:image/png;base64,';
  if (!url.startsWith(head)) return url;
  const bin = atob(url.slice(head.length));
  if (!bin.startsWith('\x89PNG\r\n\x1a\n')) return url;
  const u32 = (p) => ((bin.charCodeAt(p) << 24) | (bin.charCodeAt(p + 1) << 16) | (bin.charCodeAt(p + 2) << 8) | bin.charCodeAt(p + 3)) >>> 0;
  let out = bin.slice(0, 8), p = 8, dropped = false;
  while (p + 8 <= bin.length && bin.slice(p + 4, p + 8) !== 'IDAT') {
    const end = p + 12 + u32(p);
    if (PNG_COLOR_CHUNKS.has(bin.slice(p + 4, p + 8))) dropped = true;
    else out += bin.slice(p, end);
    p = end;
  }
  return dropped ? head + btoa(out + bin.slice(p)) : url;
}
/** Alle PNG-Data-URLs in einem Teil einer Skybox ohne Farbangaben (plainPng), an Ort und Stelle. Listen aus Zahlen
 * (Geometrie der Ebenen, im Wald rund 30 000 Werte) übergeht es: Mit ihnen hielt es den Hauptthread doppelt so lang an
 * (Wald, Chrome mit vierfach gedrosselter CPU: rund 21 statt 10 ms). */
function plainPngs(o) {
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') o[k] = plainPng(v);
    else if (v && typeof v === 'object' && typeof v[0] !== 'number') plainPngs(v);
  }
  return o;
}
/**
 * Farbbilder der Skyboxen dekodieren, für WebGL kippen, Mipmaps rechnen und alles in Streifen zu STRIP_ROWS Zeilen
 * schneiden – in einem Worker: Kippen kostete im Hauptthread selbst mit createImageBitmap rund 25 ms je 4096×3413-Bild,
 * ein Stück hochladen rund 110 ms und generateMipmap im Grafikprozess 35–50 ms (Streifen: je ein paar ms, siehe
 * skyUpload). Ergebnis { width, height, strips: [{ level, y, bitmap }] }; ohne WebGL2 ein einziger Streifen ohne Mipmaps
 * (die macht dann three). null, wo das nicht geht (kein Worker und kein createImageBitmap, oder es kippt nicht – ältere
 * Browser übergehen die Option still; geprüft einmal mit einem 1×2-Bild): dann ein Bild wie bisher.
 */
const STRIP_ROWS = 256; // 4096 × 256 × 4 Byte = 4 MB je Streifen
const skyBitmaps = (() => {
  const OPT = { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' };
  async function decode(url, rows, pad = 0) {
    let bmp = await createImageBitmap(await (await fetch(url)).blob(), OPT);
    const inhalt = bmp.height;
    // pad: Stufe 0 auf so viele Zeilen auffüllen, mit der letzten Zeile (gekippt: der oberen Kante des Bilds) wiederholt,
    // erst dann die Mipmaps: So geht jede Stufe genau auf (Streifen in einer Höhe, BAND_HOEHE), und keine Stufe liest an
    // der Kante Zeilen, die nicht zum Bild gehören (im Vorrat die eines früheren Himmels)
    if (pad > inhalt && rows < Infinity && typeof OffscreenCanvas === 'function') {
      // willReadFrequently: Leinwand im Hauptspeicher (wie cut); sonst lag sie im Grafikprozess, und das Auffüllen und die
      // Mipmaps daraus hielten ihn mitten im Überblenden an (Bilder bis 200 ms, --wagen)
      const c = new OffscreenCanvas(bmp.width, pad), g = c.getContext('2d', { willReadFrequently: true });
      g.imageSmoothingEnabled = false;
      g.drawImage(bmp, 0, 0);
      g.drawImage(bmp, 0, inhalt - 1, bmp.width, 1, 0, inhalt, bmp.width, pad - inhalt);
      bmp.close();
      bmp = c.transferToImageBitmap();
    }
    const { width, height } = bmp, levels = [bmp];
    // Für das eigene Hochladen (rows endlich) auch die Mipmaps, je Stufe halbiert: generateMipmap hielt den Grafikprozess
    // je grosse Textur 35–50 ms an
    for (let w = width, h = height; rows < Infinity && (w > 1 || h > 1);) {
      w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
      const next = await createImageBitmap(levels[levels.length - 1], { resizeWidth: w, resizeHeight: h, resizeQuality: 'medium' });
      // Übergeht ein Browser die Grösse still, scheiterte texSubImage2D (Stufe schwarz): dann ein Bild wie bisher
      if (next.width !== w || next.height !== h) throw new Error('Grösse übergangen');
      levels.push(next);
    }
    // Streifen über ein OffscreenCanvas als eigenes Bild: Einen mit createImageBitmap(lv, 0, y, …) zugeschnittenen lädt
    // Firefox ohne den Zuschnitt in WebGL (jeder Streifen zeigte die obersten Zeilen, der Grund lag in Ringen); so
    // bitgenau und je Streifen in 1–2 statt bis 25 ms hochgeladen. willReadFrequently: Canvas im Hauptspeicher, Chrome
    // wie vorher (sonst lagen die wartenden Streifen im Grafikprozess, an der Spitze rund 180 MB mehr). Vormultipliziert
    // (das Canvas): gleich für die deckenden JPEGs, nicht für ein Farbbild mit Alpha.
    const cut = (lv, y, h) => {
      const c = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(lv.width, h) : null;
      const g = c?.getContext('2d', { willReadFrequently: true });
      if (!g) return createImageBitmap(lv, 0, y, lv.width, h);
      g.drawImage(lv, 0, -y);
      return c.transferToImageBitmap();
    };
    const strips = [];
    for (const [level, lv] of levels.entries()) {
      if (lv.height <= rows) { strips.push({ level, y: 0, bitmap: lv }); continue; }
      for (let y = 0; y < lv.height; y += rows) {
        strips.push({ level, y, bitmap: await cut(lv, y, Math.min(rows, lv.height - y)) });
      }
      lv.close();
    }
    return { width, height, inhalt, strips };
  }
  // Bilder nacheinander, nicht alle zugleich (jedes belegt dekodiert samt Mipmaps und Streifen bis 150 MB), und jedes
  // erst, wenn es dran ist: Wer schnell durchschaltet, wartet so nicht auf die Bilder einer schon freigegebenen Skybox
  // (alive false: der Auftrag fällt weg)
  let worker = null, nextId = 0, flips = null, queue = Promise.resolve();
  const waiting = new Map();
  const once = (url, rows, pad) => (worker
    ? new Promise((resolve, reject) => {
      const id = nextId++;
      waiting.set(id, (d) => (d.r ? resolve(d.r) : reject(new Error(d.err))));
      worker.postMessage({ id, url, rows, pad });
    })
    : decode(url, rows, pad));
  const run = (url, rows, alive = () => true, pad = 0) => (queue = queue.catch(() => {}).then(() => {
    if (!alive()) throw new Error('nicht mehr gebraucht');
    return once(url, rows, pad);
  }));
  // Worker und Test erst beim ersten Bild (mit einem Hintergrund aus dem Code braucht es beides nie)
  function start() {
    try {
      worker = new Worker(URL.createObjectURL(new Blob([`const OPT = ${JSON.stringify(OPT)};\n${decode};
        onmessage = async ({ data: { id, url, rows, pad } }) => {
          try { const r = await decode(url, rows, pad); postMessage({ id, r }, r.strips.map((s) => s.bitmap)); }
          catch (e) { postMessage({ id, err: String(e) }); }
        };`], { type: 'text/javascript' })));
      worker.onmessage = ({ data }) => { waiting.get(data.id)?.(data); waiting.delete(data.id); };
      worker.onerror = () => { // Worker nicht ladbar: offene Anfragen scheitern, ab jetzt ohne
        worker = null;
        for (const answer of waiting.values()) answer({ err: 'Worker nicht verfügbar' });
        waiting.clear();
      };
    } catch { /* ohne Worker */ }
    return Promise.race([(async () => {
      // 1 × 2 Pixel, oben rot, unten blau, als fertiges PNG: Mit einer Leinwand und toDataURL las der Browser sie aus
      // dem Grafikprozess zurück und wartete dabei, bis dieser die Shader des Seitenstarts übersetzt hatte (Hauptthread
      // bis 2 s angehalten, ohne Script; Ticket 10 der Leistung)
      const { strips } = await run('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAIAAAAW4yFwAAAADUlEQVR4nGP4zwAC/wEIAAH/2ZC7NQAAAABJRU5ErkJggg==', 2);
      const d = Object.assign(document.createElement('canvas'), { width: 1, height: 2 }).getContext('2d', { willReadFrequently: true });
      d.drawImage(strips[0].bitmap, 0, 0);
      for (const s of strips) s.bitmap.close();
      return d.getImageData(0, 0, 1, 1).data[2] > 128; // oben jetzt blau
    })().catch(() => false), new Promise((resolve) => setTimeout(resolve, 10000, null))]);
  }
  /** kippt createImageBitmap mit imageOrientation 'flipY' wirklich (ältere Browser übergehen die Option still) */
  const flipsOk = async () => {
    const ok = await (flips ??= start());
    if (ok === null) flips = null; // keine Antwort in 10 s: die nächste Skybox prüft neu
    return !!ok;
  };
  return Object.assign(async (url, alive, pad = 0) => {
    const ok = await flipsOk();
    if (!ok) return null;
    const r = await run(url, renderer.capabilities.isWebGL2 ? STRIP_ROWS : Infinity, alive, pad);
    if (Math.max(r.width, r.height) <= renderer.capabilities.maxTextureSize) return r;
    for (const s of r.strips) s.bitmap.close(); // zu gross für diese Grafik: ein Bild, three verkleinert es
    return null;
  }, { flipsOk });
})();

/** bitmap: dekodiert und in Streifen (skyBitmaps), sonst oder wo das nicht geht ein Bild (schon dekodiert: sonst täte es
 * das erste drawImage im Hauptthread, beim Tiefenbild gemessen bis 170 ms) */
async function loadSkyImage(url, bitmap = false, alive = () => true, pad = 0) {
  if (bitmap) {
    try {
      const strips = await skyBitmaps(url, alive, pad);
      if (strips) return strips;
    } catch (e) { if (!alive()) throw e; /* sonst wie ohne */ }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('Bild nicht lesbar'));
    img.src = url;
    img.decode().then(() => resolve(img), () => { img.onload = () => resolve(img); if (img.complete && img.naturalWidth) resolve(img); });
  });
}

/**
 * Das erste Zeichnen einer Skybox vorwegnehmen (Generator für sliced): Beim ersten Bild, in dem sie einblendet, lud
 * three die Netze hoch und richtete die Programme ein; das hielt dieses Bild 50–120 ms an, mitten in der Reise oder an
 * einer Weltgrenze (Review Ticket 06). Hier zeichnet jedes Teil einmal unsichtbar in ein Ziel von 1 × 1 Pixel, je in
 * einem eigenen Bild, das Panorama durchsichtig wie beim Einblenden. Eine eigene Ebene (SKY_WARM_LAYER) für die Teile,
 * die Lichter der Szene und die Kamera: Mit denselben Lichtern und in ein Ziel wie beim Composer trifft es dieselben
 * Programme (sonst übersetzte three neue). Schatten werden dabei nicht neu gezeichnet.
 */
const SKY_WARM_LAYER = 30;
function* skyWarmDraw(staging, parts, sky, alive) {
  const target = new THREE.WebGLRenderTarget(1, 1), cam = camera.clone(), lights = [];
  target.prismaWarm = true; // eigene Ziele (SCENE_PREPASSES) schon in der Grösse des Spiels anlegen (waterSurface)
  cam.layers.set(SKY_WARM_LAYER);
  scene.traverse((o) => { if (o.isLight) { lights.push(o); o.layers.enable(SKY_WARM_LAYER); } });
  const draw = (part) => {
    const touched = [];
    part.traverse((o) => {
      touched.push([o, o.frustumCulled]);
      o.frustumCulled = false;
      o.layers.enable(SKY_WARM_LAYER);
    });
    const before = renderer.getRenderTarget(), shadows = renderer.shadowMap.needsUpdate;
    staging.visible = true;
    renderer.shadowMap.needsUpdate = false;
    try {
      renderer.setRenderTarget(target);
      renderer.render(scene, cam);
    } finally {
      renderer.setRenderTarget(before);
      renderer.shadowMap.needsUpdate = shadows;
      staging.visible = false;
      for (const [o, culled] of touched) { o.frustumCulled = culled; o.layers.disable(SKY_WARM_LAYER); }
    }
  };
  try {
    for (const part of parts) {
      yield RUHIG;
      if (!alive()) return;
      if (part === sky) { // beim Einblenden durchsichtig (applyFade), danach nicht: beide Fassungen
        for (const transparent of [true, false]) {
          sky.material.transparent = transparent;
          sky.material.needsUpdate = true;
          draw(sky);
        }
      } else draw(part);
      yield NEXT_FRAME;
    }
  } finally {
    for (const l of lights) l.layers.disable(SKY_WARM_LAYER);
    target.dispose();
  }
}

/** Dekodierte Bilder einer Textur schliessen (nach dem Hochladen oder bei Abbruch); ein Bild sammelt die GC ein */
function closeSkyImage(t) {
  for (const s of t.userData.strips ?? []) s.bitmap.close();
  t.userData.strips = null;
}

/** img: Bild oder Streifen aus skyBitmaps (WebGL2: dann lädt skyUpload hoch, nicht three; schon gekippt) */
function skyTexture(img, wrapU) {
  const own = img.strips && renderer.capabilities.isWebGL2;
  const t = new THREE.Texture(own ? { width: img.width, height: img.height } : img.strips?.[0].bitmap ?? img);
  t.encoding = THREE.sRGBEncoding;
  t.wrapS = wrapU ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  // Streifen sind schon gekippt. Ein ImageBitmap kippt WebGL nie, wohl aber das Canvas, über das three es in WebGL1
  // verkleinert (NPOT mit Mipmaps) oder nach linear umrechnet (ohne EXT_sRGB)
  t.flipY = !img.strips;
  t.userData.strips = img.strips ?? null;
  if (!own) t.needsUpdate = true;
  return t;
}

/**
 * Textur in Häppchen hochladen (Generator für sliced). Mit Streifen aus skyBitmaps an three vorbei: eigene WebGL-Textur
 * mit fester Grösse (texStorage2D), je Häppchen ein Streifen einer Stufe (Mipmaps aus dem Worker), am Schluss die
 * Einstellungen wie three; three bindet sie dann nur noch (properties.__webglTexture; needsUpdate nie gesetzt, also lädt
 * three selbst nichts hoch). Sonst renderer.initTexture in einem Stück.
 */
function* skyUpload(t, klein = false) {
  const strips = t.userData.strips, ruhig = klein ? RUHIG_KLEIN : RUHIG; // jedes Stück an einer ruhigen Stelle (ruhe)
  yield ruhig;
  if (!strips || !renderer.capabilities.isWebGL2) {
    const img = t.image;
    // Ein Bild (Tiefe, Wassermaske, Karten des Wassers) dekodierte der Browser beim Hochladen noch einmal im Hauptthread,
    // weil three die Farbumrechnung abschaltet: die Tiefe des Strands hielt so ein Bild auf dem gedrosselten Handy
    // 50 ms an (Ticket 09). Darum aus denselben Daten als ImageBitmap ohne Umrechnung (im Hintergrund dekodiert, gekippt
    // wie three es täte) und das hochladen; danach gilt wieder das Bild (für ein späteres Neuladen durch three).
    if (!strips && renderer.capabilities.isWebGL2 && img instanceof HTMLImageElement && img.complete && img.naturalWidth
      && img.src.startsWith('data:') && typeof createImageBitmap === 'function') {
      // gekippt nur, wo der Browser die Option wirklich anwendet (skyBitmaps prüft es; sonst stünde die Tiefe Kopf)
      let bitmap = null, done = false, gone = false;
      const drop = () => { gone = true; }; // inzwischen freigegeben (Abbruch des Aufbaus): nicht mehr hochladen
      t.addEventListener('dispose', drop);
      (t.flipY ? skyBitmaps.flipsOk() : Promise.resolve(true)).then((ok) => (!ok ? null
        : fetch(img.src).then((r) => r.blob()).then((blob) => createImageBitmap(blob, {
          imageOrientation: t.flipY ? 'flipY' : 'from-image',
          premultiplyAlpha: t.premultiplyAlpha ? 'premultiply' : 'none', colorSpaceConversion: 'none',
        })))).then((b) => { bitmap = b; }, () => {}).finally(() => { done = true; });
      let waited = false;
      try {
        while (!done) yield NEXT_FRAME;
        yield ruhig;
        waited = true;
      } finally {
        t.removeEventListener('dispose', drop);
        if (gone || !waited) bitmap?.close(); // !waited: der Aufbau gab den Generator auf
      }
      if (gone) return;
      if (bitmap) {
        const flipY = t.flipY;
        t.image = bitmap;
        t.flipY = false;
        try { renderer.initTexture(t); } finally { t.image = img; t.flipY = flipY; bitmap.close(); }
        return;
      }
    }
    renderer.initTexture(t);
    if (strips) closeSkyImage(t);
    return;
  }
  const gl = renderer.getContext(), { width: w, height: h } = t.image;
  // ganze Kette aus dem Worker, Vorschau nur Stufe 0; mipmaps (Bilder der Felsen): nur Stufe 0, die übrigen erzeugt
  // danach die Grafikkarte wie bei three (generateMipmap)
  const levels = t.userData.mipmaps ? Math.floor(Math.log2(Math.max(w, h))) + 1
    : Math.max(...strips.map((s) => s.level)) + 1;
  // aus dem Vorrat (skyTexPool), sonst neu: jeder Streifen jeder Stufe überschreibt sie ganz
  const pooled = skyTexPool.take(w, h, levels), tex = pooled ?? gl.createTexture();
  const bind = () => renderer.state.bindTexture(gl.TEXTURE_2D, tex); // über three, damit es weiss, was gebunden ist
  const weg = () => skyTexPool.give(w, h, levels, tex); // abgebrochen: zurück in den Vorrat
  bind();
  if (!pooled) gl.texStorage2D(gl.TEXTURE_2D, levels, gl.SRGB8_ALPHA8, w, h);
  arbeit.merke(`Textur ${w}×${h}: ${pooled ? 'aus dem Vorrat' : 'neu'}`);
  // Grosse Streifen je in einem eigenen Bild, gleich abgeschickt: Schneller, als der Grafikprozess sie abnimmt, liefe
  // sein Puffer voll, und der nächste wartete (gemessen bis 100 ms)
  for (const { level, y, bitmap } of strips) {
    // inzwischen freigegeben: release hat die Bilder geschlossen (das Panorama liest auch eine Szene in offscreen)
    if (t.userData.strips !== strips) { weg(); return; }
    yield ruhig;
    if (t.userData.strips !== strips) { weg(); return; }
    bind();
    gl.texSubImage2D(gl.TEXTURE_2D, level, 0, y, bitmap.width, bitmap.height, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    gl.flush();
    yield bitmap.width * bitmap.height >= 1 << 19 ? NEXT_FRAME : undefined;
  }
  bind();
  if (t.userData.mipmaps) gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, t.wrapS === THREE.RepeatWrapping ? gl.REPEAT : gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, levels > 1 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  const aniso = renderer.extensions.get('EXT_texture_filter_anisotropic');
  if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, t.anisotropy);
  closeSkyImage(t);
  renderer.properties.get(t).__webglTexture = tex;
  t.userData.vorrat = true; // freigeben kostet nichts (zurück in den Vorrat): sofort (releaseTree)
  // nur einmal: dispose kommt öfter (die Vorschau hängt auch in den Uniforms), zweimal im Vorrat nähmen sie zwei Himmel
  t.addEventListener('dispose', function zu() {
    t.removeEventListener('dispose', zu);
    weg();
    renderer.properties.remove(t);
  });
}

/**
 * Vorrat an Texturen der Himmel (Ticket 11 von .scratch/brett-je-himmel/): Eine Textur, die skyUpload angelegt hat
 * (ganzes Bild, Vorschau, Streifen; feste Grösse über texStorage2D), wird beim Freigeben nicht gelöscht, sondern hier
 * aufgehoben, und der nächste Himmel mit gleicher Grösse lädt hinein. Löschen und neu Anlegen grosser Texturen hielten den
 * Grafikprozess sonst an: das Löschen im ersten Bild des neuen Himmels (70–125 ms, auch in Häppchen noch je 53–106 ms),
 * das erste Schreiben in eine neue grosse Textur mitten im Spiel (die Streifen am Desktop, 105–142 ms). Was KEEP_MS
 * niemand mehr nimmt, löscht freigabe an einem stillen Bild (Handy kürzer: weniger Grafikspeicher).
 */
const skyTexPool = {
  KEEP_MS: IS_MOBILE ? 10000 : 30000,
  frei: new Map(), // Schlüssel w×h×Stufen -> [{ tex, seit }]
  take(w, h, levels) {
    const list = this.frei.get(`${w}x${h}x${levels}`);
    return list?.pop()?.tex ?? null;
  },
  give(w, h, levels, tex) {
    const key = `${w}x${h}x${levels}`, eintrag = { tex, seit: performance.now() };
    if (!this.frei.has(key)) this.frei.set(key, []);
    if (this.frei.get(key).some((e) => e.tex === tex)) return; // schon da
    this.frei.get(key).push(eintrag);
    // nach KEEP_MS löschen, falls ihn bis dahin niemand genommen hat (an einem stillen Bild, freigabe)
    setTimeout(() => {
      const list = this.frei.get(key);
      if (!list?.includes(eintrag)) return;
      freigabe.add(() => {
        const i = list.indexOf(eintrag);
        if (i < 0) return; // inzwischen genommen
        list.splice(i, 1);
        renderer.getContext().deleteTexture(tex);
      }, w * h >= 1 << 20, `Vorrat: Textur ${w}×${h} löschen`);
    }, this.KEEP_MS);
  },
  /** im Vorrat: Zahl und Grafikspeicher (MB, mit Mipmaps), für Proben */
  get stand() {
    let n = 0, mb = 0;
    for (const [key, list] of this.frei) {
      const [w, h, l] = key.split('x').map(Number);
      n += list.length;
      mb += list.length * w * h * 4 * (l > 1 ? 4 / 3 : 1) / 1e6;
    }
    return { n, mb: Math.round(mb) };
  },
};

/** Tiefenkarte (16 Bit log in Rot und Grün, 65535 = Himmel) -> geglätteter Log-Abstand (Sigma blurDeg in Grad, 0:
 * ungeglättet), Ferne auf dMax begrenzt. Generator für sliced (Häppchen je Spalte bzw. Zeile). */
function* skyLogDepth(img, depthLog, blurDeg = PANO.blurDeg) {
  const w = img.width, h = img.height;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  yield;
  // in Streifen auslesen (in einem Stück hielt das ein Bild auf dem gedrosselten Handy 40–60 ms an, Ticket 09)
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y += 64) {
    px.set(ctx.getImageData(0, y, w, Math.min(64, h - y)).data, y * w * 4);
    yield;
  }
  const la = Math.log(depthLog[0]), lb = Math.log(depthLog[1]), lmin = Math.log(PANO.dMin), lmax = Math.log(PANO.dMax);
  let src = new Float32Array(w * h);
  for (let x = 0; x < w; x++) {
    let last = lmax;
    for (let y = 0; y < h; y++) {
      const i = y * w + x, code = px[i * 4] * 256 + px[i * 4 + 1];
      // ohne Treffer: über dem Horizont Himmel, darunter das Loch im Gelände unter dem Brett – dort den letzten Wert
      // darüber nehmen, sonst zöge die Glättung den Boden an den Brettkanten in die Ferne
      if (code === 65535) src[i] = y < h / 2 ? lmax : last;
      else src[i] = last = Math.min(lmax, Math.max(lmin, la + code / 65535 * (lb - la)));
    }
    yield;
  }
  if (!(blurDeg > 0)) return { w, h, data: src };
  // Gauss, getrennt: waagrecht über die Naht hinweg, senkrecht am Rand festgehalten
  const sigma = blurDeg * w / 360, r = Math.ceil(sigma * 3), k = [];
  for (let i = -r; i <= r; i++) k.push(Math.exp(-i * i / (2 * sigma * sigma)));
  const ks = k.reduce((s, v) => s + v, 0);
  const pass = function* (from, horizontal) {
    const to = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let i = -r; i <= r; i++) {
          const xx = horizontal ? (x + i + w) % w : x, yy = horizontal ? y : Math.min(h - 1, Math.max(0, y + i));
          s += from[yy * w + xx] * k[i + r];
        }
        to[y * w + x] = s / ks;
      }
      yield;
    }
    return to;
  };
  return { w, h, data: yield* pass(yield* pass(src, true), false) };
}

/** Kugelnetz um den Mittelpunkt (mesh: Felder waagrecht und senkrecht), Ecken im Abstand der Szene (bilinear aus der
 * Tiefe). Generator für sliced. */
function* skyProxyGeometry(depth, center, [segU, segV] = [PANO.segU, PANO.segV]) {
  const pos = new Float32Array((segU + 1) * (segV + 1) * 3);
  const sample = (u, v) => {
    const { w, h, data } = depth;
    const x = u * w - 0.5, y = Math.min(h - 1, Math.max(0, v * h - 0.5));
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const X0 = (x0 % w + w) % w, X1 = (X0 + 1) % w, Y1 = Math.min(h - 1, y0 + 1);
    return (data[y0 * w + X0] * (1 - fx) + data[y0 * w + X1] * fx) * (1 - fy) + (data[Y1 * w + X0] * (1 - fx) + data[Y1 * w + X1] * fx) * fy;
  };
  let p = 0;
  for (let i = 0; i <= segV; i++) {
    const v = i / segV, th = v * Math.PI;
    for (let j = 0; j <= segU; j++) {
      const u = j / segU, ph = (u - 0.5) * 2 * Math.PI;
      // Richtung in Blender (bx, by, bz) -> Spiel (bx, bz, −by)
      const bx = Math.sin(th) * Math.sin(ph), by = Math.sin(th) * Math.cos(ph), bz = Math.cos(th);
      const d = Math.exp(sample(u, v));
      pos[p++] = center.x + bx * d; pos[p++] = center.y + bz * d; pos[p++] = center.z - by * d;
    }
    yield;
  }
  const index = new Uint32Array(segU * segV * 6);
  for (let i = 0, n = 0; i < segV; i++) {
    for (let j = 0; j < segU; j++) {
      const a = i * (segU + 1) + j, b = a + 1, c = a + segU + 1, d = c + 1;
      index[n++] = a; index[n++] = c; index[n++] = b; index[n++] = b; index[n++] = c; index[n++] = d;
    }
    yield; // je Zeile (Wüste 1024 × 512: in einem Stück 54 ms auf dem gedrosselten Handy, Ticket 09)
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  return geo;
}

/**
 * Ecken und Dreiecke des Kugelnetzes in Stücken hochladen (Generator für sliced), je Stück ein Bild: Beim ersten
 * Zeichnen lud three sie in einem Stück hoch; beim feinen Netz der Wüste (1024 × 512: 6,3 MB Ecken, 12,6 MB Dreiecke)
 * hielt das ein Bild 70–105 ms an (der Puffer zum Grafikprozess lief voll und wartete), gleich nach «Weiter» auf der
 * Reise dorthin. Danach je ein eigener WebGL-Puffer (GLBufferAttribute: three bindet ihn nur und gibt ihn mit dem Netz
 * frei; die Hüllkugel vorher, sie liesse sich daraus nicht mehr rechnen). Puffer bis 4 MB (die Netze 512 × 256 der
 * übrigen Skyboxen) und ohne WebGL2 wie bisher: In Stücken war beim Wald das erste Bild des Angebots nach dem Prolog
 * länger (gemessen bis 88 statt 53 ms).
 */
const SKY_BUFFER_CHUNK = 1 << 21, SKY_BUFFER_WHOLE = 1 << 22; // 2 MB je Bild, ab über 4 MB
/** Hüllkugel von Ecken (x, y, z je Ecke) wie BufferGeometry.computeBoundingSphere, Generator (yield je 64k Ecken) */
function* boundingSphereSteps(a, per = 1 << 16) {
  const box = new THREE.Box3();
  for (let s = 0; s < a.length; s += per * 3) {
    for (let i = s, e = Math.min(a.length, s + per * 3); i < e; i += 3) {
      const x = a[i], y = a[i + 1], z = a[i + 2];
      if (x < box.min.x) box.min.x = x; if (y < box.min.y) box.min.y = y; if (z < box.min.z) box.min.z = z;
      if (x > box.max.x) box.max.x = x; if (y > box.max.y) box.max.y = y; if (z > box.max.z) box.max.z = z;
    }
    yield;
  }
  const c = box.getCenter(new THREE.Vector3());
  let maxSq = 0;
  for (let s = 0; s < a.length; s += per * 3) {
    for (let i = s, e = Math.min(a.length, s + per * 3); i < e; i += 3) {
      const dx = a[i] - c.x, dy = a[i + 1] - c.y, dz = a[i + 2] - c.z;
      maxSq = Math.max(maxSq, dx * dx + dy * dy + dz * dz);
    }
    yield;
  }
  return new THREE.Sphere(c, Math.sqrt(maxSq));
}
function* skyBufferUpload(geo) {
  if (!renderer.capabilities.isWebGL2) return;
  const gl = renderer.getContext();
  for (const name of ['position', 'index']) {
    const attr = name === 'index' ? geo.index : geo.getAttribute(name), array = attr?.array;
    if (!array || array.byteLength <= SKY_BUFFER_WHOLE) continue;
    // aus einem eigenen Puffer rechnete three sie nicht mehr; wie computeBoundingSphere, aber in Häppchen (in einem
    // Stück beim Netz der Wüste 75 ms auf dem gedrosselten Handy, Ticket 09)
    if (name === 'position') geo.boundingSphere = yield* boundingSphereSteps(array);
    const target = name === 'index' ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER, buffer = gl.createBuffer();
    geo.addEventListener('dispose', () => gl.deleteBuffer(buffer)); // auch, wenn three das Netz nie gezeichnet hat
    // ohne das Vertex Array Objekt, das three gerade gebunden hat (es merkte sich sonst diesen Puffer der Dreiecke)
    const upload = (fn) => {
      const vao = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
      gl.bindVertexArray(null);
      gl.bindBuffer(target, buffer);
      fn();
      gl.bindBuffer(target, null);
      gl.bindVertexArray(vao);
      gl.flush();
    };
    yield RUHIG;
    upload(() => gl.bufferData(target, array.byteLength, gl.STATIC_DRAW));
    const per = SKY_BUFFER_CHUNK / array.BYTES_PER_ELEMENT, bytes = array.BYTES_PER_ELEMENT;
    for (let at = 0; at < array.length; at += per) {
      yield NEXT_FRAME;
      yield RUHIG;
      upload(() => gl.bufferSubData(target, at * bytes, array, at, Math.min(per, array.length - at)));
    }
    const type = array instanceof Float32Array ? gl.FLOAT : array instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    const own = new THREE.GLBufferAttribute(buffer, type, attr.itemSize, bytes, attr.count);
    if (name === 'index') geo.setIndex(own); else geo.setAttribute(name, own);
  }
}

/**
 * Plattentest im Panorama (skyPanoramaMaterial): der Kernquader des gezeigten Bretts, je 1 cm kleiner, während eines
 * Überblendens der Schnitt der Kernquader aller gezeigten Bretter (boardBlend). Dort ist jedes Pixel von einem deckend gezeichnet,
 * dahinter zeichnet der Himmel nichts. Ohne gezeigtes Brett liegt er weit unter der Szene, wo ihn kein Blick trifft.
 * Gemeinsam für alle Panoramen; boardTheme setzt ihn (die Kernquader der Arten stehen bei BOARD_TYPES).
 */
const boardCoreUniforms = { uCoreLo: { value: new THREE.Vector3() }, uCoreHi: { value: new THREE.Vector3() } };

/**
 * bands: [{ u, v, tex, on }] – on: Anteil des Streifens (0 = noch nicht geladen, das ganze Bild zeigt sich; Uniform
 * uOn). material.userData.setDepthRule({ uniforms, glsl }): Das Netz schreibt dann als Tiefe skyDepth(vWorld) (glsl
 * definiert sie; für eine Ebene, die das Netz anders als nach seiner Lage verdecken soll, siehe waterSurface).
 */
function skyPanoramaMaterial(uniforms, center, full, bands) {
  const u = { ...uniforms, ...boardCoreUniforms, uFull: { value: full }, uCenter: { value: center } };
  u.uSoft = { value: null }; // Vorschau, über die das scharfe Bild einblendet (uSoftOn 1 → 0, createPanoramaSky)
  u.uSoftOn = { value: 0 };
  bands.forEach((b, i) => {
    u[`uBand${i}`] = { value: b.tex };
    u[`uRect${i}`] = { value: new THREE.Vector4(b.u[0], b.u[1], b.v[0], b.v[1]) };
    u[`uOn${i}`] = { value: b.on ?? 1 };
    u[`uKl${i}`] = { value: 1 }; // Anteil der Zeilen des Streifens an seiner Textur (BAND_HOEHE, skyUpload)
  });
  const decl = bands.map((_, i) => `uniform sampler2D uBand${i}; uniform vec4 uRect${i}; uniform float uOn${i}; uniform float uKl${i};`).join('\n');
  // Streifen: Rechteck (u0, u1, v0, v1) im ganzen Equirect; Bildzeile 0 oben (Textur mit flipY: t = 1 − v). Kommt er
  // erst nach dem Einblenden (uOn < 1), mischt er sich über das ganze Bild. Aufgefüllt auf BAND_HOEHE (skyBitmaps, pad)
  // liegt das Bild in den unteren Zeilen (Anteil uKl), darüber die wiederholte Kante.
  const pick = bands.map((_, i) => `
        if (!hit && uOn${i} > 0.0 && u >= uRect${i}.x && u <= uRect${i}.y && v >= uRect${i}.z && v <= uRect${i}.w) {
          vec2 s = 1.0 / vec2(uRect${i}.y - uRect${i}.x, uRect${i}.w - uRect${i}.z);
          vec2 k = vec2(1.0, uKl${i});
          col = SAMPLE(uBand${i}, vec2((u - uRect${i}.x) * s.x, 1.0 - (v - uRect${i}.z) * s.y) * k, gx * s * k, gy * s * k);
          if (uOn${i} < 1.0) col = mix(SAMPLE(uFull, vec2(u, 1.0 - v), gx, gy), col, uOn${i});
          hit = true;
        }`).join('');
  const fragment = (rule) => `
        #if __VERSION__ >= 300
          #define SAMPLE(t, p, gx, gy) textureGrad(t, p, gx, gy).rgb
        #elif defined(GL_EXT_shader_texture_lod)
          #define SAMPLE(t, p, gx, gy) texture2DGradEXT(t, p, gx, gy).rgb
        #else
          #define SAMPLE(t, p, gx, gy) texture2D(t, p).rgb
        #endif
        uniform sampler2D uFull, uSoft;
        uniform float uSoftOn;
        uniform vec3 uCenter;
        uniform float uFade, uReady;
        ${decl}
        varying vec3 vWorld;
        const float PI = 3.141592653589793;
        uniform vec3 uCoreLo, uCoreHi; // Kernquader des gezeigten Bretts, je 1 cm kleiner (boardCoreUniforms)
        ${rule?.glsl ?? ''}
        void main() {
          vec3 g = normalize(vWorld - uCenter);
          vec3 b = vec3(g.x, -g.z, g.y); // Spiel -> Blender
          float u = 0.5 + atan(b.x, b.y) / (2.0 * PI);
          float v = acos(clamp(b.z, -1.0, 1.0)) / PI;
          // Ableitungen vor jeder Verzweigung; an der Naht (u springt 1 -> 0) den Sprung herausnehmen, sonst wählte die
          // Grafikkarte dort die kleinste Mipmap-Stufe (eine Linie aus Mittelwerten)
          vec2 dx = dFdx(vec2(u, v)), dy = dFdy(vec2(u, v));
          dx.x -= floor(dx.x + 0.5); dy.x -= floor(dy.x + 0.5);
          vec2 gx = vec2(dx.x, -dx.y), gy = vec2(dy.x, -dy.y);
          // Hinter dem Kernquader des Bretts (undurchsichtig, steht fest, wird danach gezeichnet und deckt das Netz dort
          // zu): nichts weiter rechnen. Im Level deckt das Brett gut ein Drittel des Bilds; das Netz schreibt am Strand
          // seine Tiefe selbst, der Tiefentest kann es dort also nicht vorher verwerfen (Ticket 11). Quader um 1 cm
          // kleiner, damit am Rand kein Pixel ohne Netz und ohne Brett bleibt.
          {
            vec3 eye = vWorld - cameraPosition, inv = 1.0 / eye;
            vec3 t0 = (uCoreLo - cameraPosition) * inv, t1 = (uCoreHi - cameraPosition) * inv;
            vec3 tn = min(t0, t1), tf = max(t0, t1);
            float tIn = max(max(tn.x, tn.y), tn.z), tOut = min(min(tf.x, tf.y), tf.z);
            if (tIn <= tOut && tIn > 0.0 && tIn < 1.0) discard; // eye läuft bis zum Netz: t = 1 dort
          }
          vec3 col = vec3(0.0);
          bool hit = false;
          ${pick}
          if (!hit) col = SAMPLE(uFull, vec2(u, 1.0 - v), gx, gy);
          if (uSoftOn > 0.0) col = mix(col, texture2D(uSoft, vec2(u, 1.0 - v)).rgb, uSoftOn);
          gl_FragColor = vec4(col, uFade * uReady);${rule ? `
          gl_FragDepthEXT = skyDepth(vWorld);` : ''}
        }`;
  const material = new THREE.ShaderMaterial({
    uniforms: u,
    side: THREE.DoubleSide,
    extensions: { derivatives: true, shaderTextureLOD: true },
    vertexShader: `
        varying vec3 vWorld;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorld = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
    fragmentShader: fragment(null),
  });
  material.userData.setDepthRule = (rule) => {
    Object.assign(material.uniforms, rule.uniforms);
    material.extensions.fragDepth = true;
    material.fragmentShader = fragment(rule);
    material.needsUpdate = true;
  };
  return material;
}

/**
 * Ebenen: was das Spiel zu einem Panorama selbst zeichnet, je Typ mit Parametern aus dem Manifest (layers). Jeder Typ
 * ist eine Funktion (ctx, opt) -> Object3D; ctx = { uniforms (uFade, uReady, uTime), pointUniforms (dazu uPixelRatio),
 * data (Daten aus base), light (Richtung zum Hauptlicht), lightGLSL (const vec3 SKY_LIGHT), fog, air, pano (full:
 * Textur des ganzen Panoramas, center: sein Mittelpunkt, depth: ungeglättete Tiefe { tex, size, log, image },
 * waterMask: Wassermaske oder null, siehe maskTexture; eine Ebene darf depthRule setzen: die Tiefe, die das Netz
 * schreibt, siehe skyPanoramaMaterial), offscreen (Szenen, die eine Ebene selbst zeichnet: werden mit übersetzt und
 * freigegeben), later (Arbeit, die warten kann: async (alive) =>, läuft, sobald die Skybox ganz eingeblendet ist;
 * alive() ist falsch, sobald sie freigegeben ist), under (von waterSurface: Szene unter der Wasseroberfläche) }. Am
 * Object3D optional userData.update(t, dt) (jedes Bild, solange sichtbar) und userData.dispose() (beim Freigeben).
 * Jede Ebene kann brush: true tragen (Pinselstriche über ihren undurchsichtigen Materialien, createBrushPass; die
 * Einstellungen stehen im Feld brush der Skybox); das gilt für jeden Typ und braucht dort keinen Code.
 * Neues kommt als weiterer Typ dazu; tools/sky-schema.mjs liest die Namen aus der Zeile `const SKY_LAYERS = { … }`.
 */

/**
 * Base64 zu Bytes (ArrayBuffer), Generator für sliced: in Stücken von B64_CHUNK Zeichen, yield nach jedem. Mit
 * Uint8Array.fromBase64, wo es das gibt, sonst atob und eine Schleife (Uint8Array.from mit Rückruf je Zeichen war
 * mehrfach langsamer; ein grosses Feld hielt auf dem gedrosselten Handy ein Bild 50–60 ms an, Ticket 09 der Leistung).
 */
const B64_CHUNK = 1 << 18; // Zeichen, durch 4 teilbar
function* b64Bytes(s) {
  const pad = s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0;
  const out = new Uint8Array(Math.floor((s.length * 3) / 4) - pad);
  let o = 0;
  for (let i = 0; i < s.length; i += B64_CHUNK) {
    const part = s.slice(i, i + B64_CHUNK);
    if (Uint8Array.fromBase64) {
      const b = Uint8Array.fromBase64(part);
      out.set(b, o);
      o += b.length;
    } else {
      const bin = atob(part);
      for (let k = 0; k < bin.length; k++) out[o + k] = bin.charCodeAt(k);
      o += bin.length;
    }
    yield;
  }
  return o === out.length ? out.buffer : out.slice(0, o).buffer;
}

/** Float32Array.from(src, fn) in Häppchen (Generator für sliced, yield je per Werte), dasselbe Ergebnis */
function* mappedFloats(src, fn, per = 1 << 16) {
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i += per) {
    for (let k = i, e = Math.min(src.length, i + per); k < e; k++) out[k] = fn(src[k]);
    yield;
  }
  return out;
}

/** BufferGeometry.computeVertexNormals (three 0.147, mit Index) in Häppchen: Generator für sliced, dasselbe Ergebnis;
 *  ein Baum am Strand brauchte in einem Stück auf dem gedrosselten Handy 40 ms (Ticket 09) */
function* vertexNormalsSteps(geo, per = 1 << 13) {
  const index = geo.index, pos = geo.getAttribute('position');
  if (!index || !pos) { geo.computeVertexNormals(); return; }
  const normal = new THREE.Float32BufferAttribute(new Float32Array(3 * pos.count), 3);
  geo.setAttribute('normal', normal);
  const pA = new THREE.Vector3(), pB = new THREE.Vector3(), pC = new THREE.Vector3();
  const nA = new THREE.Vector3(), nB = new THREE.Vector3(), nC = new THREE.Vector3();
  const cb = new THREE.Vector3(), ab = new THREE.Vector3();
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
    pA.fromBufferAttribute(pos, a); pB.fromBufferAttribute(pos, b); pC.fromBufferAttribute(pos, c);
    cb.subVectors(pC, pB); ab.subVectors(pA, pB); cb.cross(ab);
    nA.fromBufferAttribute(normal, a); nB.fromBufferAttribute(normal, b); nC.fromBufferAttribute(normal, c);
    nA.add(cb); nB.add(cb); nC.add(cb);
    normal.setXYZ(a, nA.x, nA.y, nA.z); normal.setXYZ(b, nB.x, nB.y, nB.z); normal.setXYZ(c, nC.x, nC.y, nC.z);
    if (i % (per * 3) === per * 3 - 3) yield;
  }
  yield;
  for (let i = 0; i < normal.count; i++) {
    nA.fromBufferAttribute(normal, i).normalize();
    normal.setXYZ(i, nA.x, nA.y, nA.z);
    if (i % (per * 4) === per * 4 - 1) yield;
  }
  normal.needsUpdate = true;
}

/** Modell als Felder: unverändert (pos, nrm, col, idx) oder kompakt aus Base64 (pos16: Int16 / 8192, col8: Uint8,
 *  Wurzel der Farbe; idx16: Uint16; ohne Normalen), wie es der Export des Strands schreibt. Dazu dort (game_models):
 *  prims: Blätter und Fiedern je Form noch kompakter (pack_prims): je Blatt erste Ecke base16 (Int16 / 8192), die
 *  übrigen k − 1 als d8 (Int8 × dscale) relativ dazu, Farbe col8, Dreiecke nach tri (Ecken 0 … k − 1); leaf ist 1 für
 *  ihre Ecken (Laub scheint durch, paintedInstances). tubes: Röhren (pack_tubes): je Röhre Ringe n8 und Ecken je Ring
 *  s8, je Ring Mitte c16 (Int16 / 8192), Radius r16 (Uint16 / 2¹⁸), Farbe col8; die Ringe wie tube() in pflanzen.py
 *  (Querachse mitgeführt, Anfang senkrecht zu oben bzw. zu x, wenn die Röhre senkrecht beginnt). self8 je Ecke, Blatt
 *  bzw. Ring: Licht durch die eigene Krone (self_light), entpackt als self [Himmel, a0, a1, b1] je Ecke.
 *  Generator (sliced): yield je Feld und alle paar Röhren bzw. Blätter – in einem Stück hielt ein Baum ein Bild auf dem
 *  gedrosselten Handy bis 90 ms an (Ticket 09 der Leistung). */
function* unpackModel(m) {
  if (m.pos16 === undefined) return m; // leer ('') bei Bäumen ohne Früchte: alles in prims und tubes
  const bytes = b64Bytes;
  const pos = yield* mappedFloats(new Int16Array(yield* bytes(m.pos16)), (v) => v / 8192);
  const col = yield* mappedFloats(new Uint8Array(yield* bytes(m.col8)), (v) => (v / 255) ** 2);
  const idx = new Uint16Array(yield* bytes(m.idx16));
  if (!m.prims && !m.tubes) return { pos, col, idx };
  const prims = m.prims ?? [], t = m.tubes;
  const rings = t ? new Uint8Array(yield* bytes(t.n8)) : [], sides = t ? new Uint8Array(yield* bytes(t.s8)) : [];
  let nv = pos.length / 3, ni = idx.length;
  for (const p of prims) { nv += p.count * p.k; ni += p.count * p.tri.length; }
  rings.forEach((n, j) => { nv += n * sides[j]; ni += (n - 1) * sides[j] * 6; });
  const P = new Float32Array(nv * 3), C = new Float32Array(nv * 3), leaf = new Float32Array(nv);
  const S = new Float32Array(nv * 4).fill(1); // ohne self8: frei
  // Lage im Blatt (entlang 0 … 1, quer in Blattbreiten): die Ecken des Sechsecks wie leaf() in pflanzen.py; alles
  // andere in der Mitte (paintedInstances schneidet daraus eine runde Blattform)
  const shape = new Float32Array(nv * 2).fill(0.5);
  for (let e = 1; e < nv * 2; e += 2) shape[e] = 0;
  const HEX = [0, 0, 0.3, 0.5, 0.72, 0.42, 1, 0, 0.72, -0.42, 0.3, -0.5];
  const I = nv > 65536 ? new Uint32Array(ni) : new Uint16Array(ni);
  P.set(pos); C.set(col); I.set(idx);
  // self8 der Gruppe g (Blatt, Ring, Ecke) auf die Ecken v0 … v0 + k − 1
  const setSelf = (s8, g, v0, k) => {
    if (!s8) return;
    const q = [s8[g * 4] / 255, s8[g * 4 + 1] / 255, (s8[g * 4 + 2] - 128) / 127, (s8[g * 4 + 3] - 128) / 127];
    for (let e = 0; e < k; e++) S.set(q, (v0 + e) * 4);
  };
  const s8 = m.self8 ? new Uint8Array(yield* bytes(m.self8)) : null;
  for (let e = 0; e < pos.length / 3; e++) setSelf(s8, e, e, 1);
  let v = pos.length / 3, i = idx.length;
  if (t) {
    const c = yield* mappedFloats(new Int16Array(yield* bytes(t.c16)), (x) => x / 8192);
    const r = yield* mappedFloats(new Uint16Array(yield* bytes(t.r16)), (x) => x / 2 ** 18);
    const rc = new Uint8Array(yield* bytes(t.col8)), rs = t.self8 ? new Uint8Array(yield* bytes(t.self8)) : null;
    const at = (k) => new THREE.Vector3(c[k * 3], c[k * 3 + 1], c[k * 3 + 2]);
    const tan = new THREE.Vector3(), u = new THREE.Vector3(), w = new THREE.Vector3();
    let k0 = 0;
    for (let j = 0; j < rings.length; j++) {
      const n = rings[j], s = sides[j];
      if (j % 64 === 63) yield;
      for (let k = 0; k < n; k++) {
        // Richtung wie np.gradient: in der Mitte zentral, an den Enden einseitig
        tan.subVectors(at(k0 + Math.min(k + 1, n - 1)), at(k0 + Math.max(k - 1, 0))).normalize();
        if (k === 0) u.crossVectors(tan, new THREE.Vector3(Math.abs(tan.y) > 0.9 ? 1 : 0, Math.abs(tan.y) > 0.9 ? 0 : 1, 0));
        else u.addScaledVector(tan, -tan.dot(u));
        u.normalize();
        w.crossVectors(tan, u);
        const q = k0 + k, cen = at(q);
        for (let e = 0; e < s; e++) {
          const a = (e * 2 * Math.PI) / s, o = (v + k * s + e) * 3;
          for (let x = 0; x < 3; x++) {
            P[o + x] = cen.getComponent(x) + r[q] * (Math.cos(a) * u.getComponent(x) + Math.sin(a) * w.getComponent(x));
            C[o + x] = (rc[q * 3 + x] / 255) ** 2;
          }
        }
        setSelf(rs, q, v + k * s, s);
        if (k < n - 1) {
          for (let e = 0; e < s; e++) {
            const a = v + k * s + e, b = v + k * s + ((e + 1) % s);
            I.set([a, b, b + s, a, b + s, a + s], i);
            i += 6;
          }
        }
      }
      v += n * s;
      k0 += n;
    }
  }
  for (const p of prims) {
    const base = new Int16Array(yield* bytes(p.base16)), d = new Int8Array(yield* bytes(p.d8));
    const c = new Uint8Array(yield* bytes(p.col8));
    const ps = p.self8 ? new Uint8Array(yield* bytes(p.self8)) : null;
    for (let j = 0; j < p.count; j++, v += p.k) {
      if (j % 1024 === 1023) yield;
      for (let e = 0; e < p.k; e++) {
        for (let a = 0; a < 3; a++) {
          P[(v + e) * 3 + a] = base[j * 3 + a] / 8192 + (e ? d[(j * (p.k - 1) + e - 1) * 3 + a] * p.dscale : 0);
          C[(v + e) * 3 + a] = (c[j * 3 + a] / 255) ** 2;
        }
        leaf[v + e] = 1;
      }
      if (p.form === 'blatt') shape.set(HEX, v * 2);
      setSelf(ps, j, v, p.k);
      for (const e of p.tri) I[i++] = v + e;
    }
  }
  return { pos: P, col: C, idx: I, leaf, self: S, shape };
}

/** Je Modell ein InstancedMesh mit material (Daten wie bei toonInstances; die Drehung auch als [x, y, z] wie in
 *  Blender, Euler XYZ um dessen Achsen: Palmen lehnen); aInfo je Instanz: Licht unten, oben, Helligkeit,
 *  Nebel-Oberkante; aCol, aLeaf, aSelf und aShape, wenn das Modell sie hat. Jedes Bild bekommt die Grafikkarte nur die
 *  Instanzen, deren Hüllquader im Bild liegt (cullInstances; three.js zeichnete sonst alle: Eine Hülle um alle
 *  Standorte enthielte immer das Brett). In der Standardansicht sind das von 188 Pflanzen am Strand gut ein Dutzend.
 *  userData.instances: alle Matrizen (für den Pinsel). Generator (sliced: yield je Modell). */
function* instancedModels(set, material, colored) {
  const out = new THREE.Group(), mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const meshes = [];
  for (const [k, packed] of set.models.entries()) {
    const model = yield* unpackModel(packed);
    yield;
    const list = set.instances.filter((t) => t[6] === k);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(model.pos, 3));
    if (colored) geo.setAttribute('aCol', new THREE.Float32BufferAttribute(model.col, 3));
    if (model.leaf) geo.setAttribute('aLeaf', new THREE.Float32BufferAttribute(model.leaf, 1));
    if (model.self) geo.setAttribute('aSelf', new THREE.Float32BufferAttribute(model.self, 4));
    if (model.shape) geo.setAttribute('aShape', new THREE.Float32BufferAttribute(model.shape, 2));
    geo.setIndex(ArrayBuffer.isView(model.idx) ? new THREE.BufferAttribute(model.idx, 1) : model.idx);
    if (model.nrm) geo.setAttribute('normal', new THREE.Float32BufferAttribute(model.nrm, 3));
    else yield* vertexNormalsSteps(geo);
    yield;
    geo.computeBoundingBox();
    const info = new Float32Array(list.length * 4), all = new Float32Array(list.length * 16);
    const mesh = new THREE.InstancedMesh(geo, material, list.length);
    list.forEach(([x, y, z, h, w, turn, , lo, hi, shade, top = 0], i) => {
      // Blender Rz·Ry·Rx in Spielachsen (x, z, −y): Ry·R(−z)·Rx, three.js-Reihenfolge 'YZX'
      const [rx, ry, rz] = Array.isArray(turn) ? turn : [0, 0, turn];
      q.setFromEuler(e.set(rx, rz, -ry, 'YZX'));
      mtx.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(w, h, w)).toArray(all, i * 16);
      info.set([lo, hi, shade, top], i * 4);
    });
    mesh.instanceMatrix.array.set(all);
    geo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info.slice(), 4));
    mesh.frustumCulled = false; // selbst je Instanz (cullInstances)
    mesh.userData.instances = all;
    meshes.push({ mesh, all, info, boxes: null, shown: null });
    out.add(mesh);
    yield;
  }
  out.userData.update = () => cullInstances(meshes);
  return out;
}

/** Nur die Instanzen im Bild der Kamera an die Grafikkarte (vorne in instanceMatrix und aInfo, count); hochgeladen nur,
 *  wenn sich die Auswahl ändert. Hüllquader in der Welt einmal (die Ebenen stehen still). Ohne neue Arrays je Bild:
 *  Die Auswahl steht in einem festen Feld je Mesh (shown). */
const cullInstances = (() => {
  const frustum = new THREE.Frustum(), viewProj = new THREE.Matrix4(), m = new THREE.Matrix4();
  return (meshes) => {
    camera.updateMatrixWorld();
    frustum.setFromProjectionMatrix(viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    for (const g of meshes) {
      const { mesh, all, info } = g, n = all.length / 16;
      g.boxes ??= Array.from({ length: n }, (_, i) =>
        mesh.geometry.boundingBox.clone().applyMatrix4(m.fromArray(all, i * 16).premultiply(mesh.matrixWorld)));
      let changed = !g.shown;
      g.shown ??= new Uint8Array(n);
      const shown = g.shown;
      for (let i = 0; i < n; i++) {
        const v = frustum.intersectsBox(g.boxes[i]) ? 1 : 0;
        if (v !== shown[i]) { shown[i] = v; changed = true; }
      }
      if (!changed) continue;
      const mat = mesh.instanceMatrix.array, attr = mesh.geometry.getAttribute('aInfo');
      let c = 0;
      for (let i = 0; i < n; i++) {
        if (!shown[i]) continue;
        mat.set(all.subarray(i * 16, i * 16 + 16), c * 16);
        attr.array.set(info.subarray(i * 4, i * 4 + 4), c * 4);
        c++;
      }
      mesh.count = c;
      mesh.visible = c > 0;
      mesh.instanceMatrix.needsUpdate = attr.needsUpdate = true;
    }
  };
})();

/**
 * Nahe Objekte (Daten: models {pos, nrm, idx} in Spielkoordinaten oder kompakt, siehe unpackModel; Fuss im Ursprung,
 * Höhe und Breite 1; instances [x, y, z, Höhe, Breite, Drehung um die Hochachse (oder [x, y, z], instancedModels),
 * Modell, Licht unten, Licht oben, Helligkeit, Nebel-Oberkante]):
 * Das Panorama zeigt sie nicht, aus seinem Mittelpunkt gesehen lägen sie schräg. Farben (palette) wie die gemalten
 * Objekte im Panorama: zwei Stufen im Hauptlicht (Toon; soft 0 … 1 macht sie weich), heller Rand an den Kanten zum
 * Licht, unten dunkler, etwas Dunst mit dem Abstand (air). Wie viel Licht ein Objekt unten und oben trifft (Schatten von
 * Kämmen und Nachbarn), hat Blender je Instanz ausgerechnet; ihre Schatten auf dem Boden stecken im Panorama (Wald:
 * wald_spielbaum.py).
 * Nebel wie in der Szene (fog): Die Dichte hängt nur von der Höhe über der Nebel-Oberkante an der Instanz ab (weicher
 * Saum, darunter der Kern, je eine Rampe). Entlang des Blicks bis zur Kamera (über dem Nebel) zählt also nur ihr
 * Integral von der Höhe des Punkts aufwärts, mal Weg je Höhe – so versinken Objekte am Rand des Nebelmeers darin wie
 * im Panorama. Ohne fog oder ohne Oberkante je Instanz: kein Nebel. Generator (sliced: yield je Modell).
 */
function* toonInstances(ctx, opt) {
  const set = ctx.data[opt.data], pal = opt.palette, air = ctx.air;
  const fog = ctx.fog && set.instances.every((t) => t.length > 10) ? ctx.fog : null;
  const fogRamp = ([a, b, d]) => `${d.toFixed(4)} * ramp(dz, ${a.toFixed(2)}, ${b.toFixed(2)})`;
  // Modelle mit Farbe je Ecke (col): Die Palette gibt dann Faktoren auf diese Farbe (Stamm braun, Laub grün)
  const colored = set.models.every((m) => m.col || m.col8);
  const material = new THREE.ShaderMaterial({
    uniforms: ctx.uniforms,
    defines: colored ? { USE_COL: '' } : {},
    side: colored ? THREE.DoubleSide : THREE.FrontSide, // offene Flächen (Palmwedel) von beiden Seiten
    vertexShader: `
        attribute vec4 aInfo; // Licht unten, oben; Helligkeit; Oberkante des Nebels
        varying vec4 vInfo;
        varying vec3 vN, vPos;
        varying float vH;
        #ifdef USE_COL
          attribute vec3 aCol;
          varying vec3 vCol;
        #endif
        void main() {
          #ifdef USE_COL
            vCol = aCol;
          #endif
          mat4 m = modelMatrix * instanceMatrix;
          vec4 wp = m * vec4(position, 1.0);
          vec3 sc = vec3(length(m[0].xyz), length(m[1].xyz), length(m[2].xyz));
          vN = normalize(mat3(m) * (normal / (sc * sc)));
          vPos = wp.xyz;
          vInfo = aInfo;
          vH = position.y;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
    fragmentShader: `
        uniform float uFade, uReady;
        varying vec4 vInfo;
        varying vec3 vN, vPos;
        varying float vH;
        ${ctx.lightGLSL}
        // Farben der gemalten Objekte und des Nebels (Anzeige), zurückgerechnet auf Szenenwerte vor ACES
        const vec3 SHADOW = ${glv(pal.shadow)}, MID = ${glv(pal.mid)};
        const vec3 LIT = ${glv(pal.lit)}, RIM = ${glv(pal.rim)}, HAZE = ${glv(air.haze)};
        const vec3 FOG_LIT = ${glv(air.lit)};
        const float SOFT = ${glf(opt.soft ?? 0)};
        #ifdef USE_COL
          varying vec3 vCol;
          #define BASE(c) (c * vCol)
        #else
          #define BASE(c) (c)
        #endif
        // Integral einer Rampe (0 bei Höhe a, 1 ab Höhe b < a) von dz aufwärts
        float ramp(float dz, float a, float b) {
          float w = a - b;
          if (dz >= a) return 0.0;
          if (dz > b) return (a - dz) * (a - dz) / (2.0 * w);
          return 0.5 * w + (b - dz);
        }
        void main() {
          vec3 N = normalize(vN);
          if (!gl_FrontFacing) N = -N;
          vec3 toCam = cameraPosition - vPos;
          float dist = length(toCam);
          float l = dot(N, SKY_LIGHT);
          float moon = mix(vInfo.x, vInfo.y, smoothstep(0.2, 0.8, vH));
          // Stufen: hart wie gemalt (soft 0) bis weich verlaufend (soft 1, natürlicher für Laub)
          vec3 col = mix(BASE(SHADOW), BASE(MID), smoothstep(-0.5 - 0.4 * SOFT, -0.3 + 0.2 * SOFT, l));
          col = mix(col, BASE(LIT), smoothstep(-0.05 * SOFT, 0.12 + 0.45 * SOFT, l) * moon);
          col *= mix(0.6, 1.0, smoothstep(0.0, 0.45, vH));
          float rim = pow(1.0 - max(dot(N, toCam / dist), 0.0), 3.0) * smoothstep(-0.1, 0.4, l) * moon;
          col = mix(col, BASE(RIM), rim * 0.6) * vInfo.z;
          col = mix(col, HAZE, 1.0 - exp(-dist * ${glf(air.density)}));${fog ? `
          // Nebel: Integral der Dichte über dem Punkt mal Weg je Höhe; zum Licht hin heller (Vorwärtsstreuung)
          float dz = vPos.y - vInfo.w;
          float tau = (${fogRamp(fog.soft)} + ${fogRamp(fog.core)}) * min(dist / max(cameraPosition.y - vPos.y, 0.1), 8.0);
          vec2 h = normalize(-toCam.xz + vec2(1e-4)), m = normalize(SKY_LIGHT.xz);
          col = mix(mix(HAZE, FOG_LIT, pow(max(dot(h, m), 0.0), 2.0)), col, exp(-tau));` : ''}
          gl_FragColor = vec4(col * uFade * uReady, 1.0);
        }`,
  });
  return yield* instancedModels(set, material, colored);
}

/** GLSL-mat3 aus einer Matrix in Zeilen [[a, b, c], …] (GLSL füllt Spalten) */
const glm3 = (rows) => `mat3(${[0, 1, 2].map((c) => glv(rows.map((r) => r[c]))).join(', ')})`;

/**
 * Nahe Pflanzen wie im Panorama gemalt (Daten wie toonInstances mit Farbe je Ecke, Drehung [x, y, z] wie in Blender,
 * dazu light aus dem Export des Strands, plant_light; Helligkeit je Instanz bleibt unbenutzt, Blender kennt sie
 * nicht): Das Spiel rechnet, was Blender und anime.py für sie rechnen würden. Licht wie in Blender: Himmel und Boden
 * aus einer Lichtsonde (sh: Kugelfunktionen bis Grad 2 in Blender-Achsen, Beleuchtungsstärke je Normale), Sonne (sun)
 * × max(N·L, 0) mal Sonne an der Instanz (unten, oben: Schatten von Gelände und Nachbarn), beides durch die eigene
 * Krone (aSelf aus self_light: Himmel; Sonne nach ihrem Azimut in den Achsen der Vorlage), Grundlicht (emit, wie
 * mat_plant), Laub scheint zu translucent durch (Licht von hinten), Glanz wie die Principled BSDF; Luftperspektive
 * nach airDist.
 * Dann gemalt wie anime.grade: Belichtung, ACES und sRGB (so sähe es im Spiel aus), satter, bläuliche Schatten, warme
 * Lichter (paint), zurück auf Szenenwerte vor ACES (wie die Textur des Panoramas, höchstens TEX_MAX). Pinselstriche mit
 * brush (createBrushPass); ihr Runden der Blätter macht aShape nach (Sechseck -> runde Blattform). Generator (sliced:
 * yield je Modell).
 */
function* paintedInstances(ctx, opt) {
  const set = ctx.data[opt.data], L = set.light, P = L.paint, air = ctx.air;
  const IN = [[0.59719, 0.35458, 0.04823], [0.07600, 0.90834, 0.01566], [0.02840, 0.13383, 0.83777]];
  const OUT = [[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]];
  const inverse = (rows) => {
    const m = new THREE.Matrix3().set(...rows.flat()).invert().elements; // spaltenweise
    return [0, 1, 2].map((r) => [0, 1, 2].map((c) => m[c * 3 + r]));
  };
  const T = glf(L.translucent);
  const material = new THREE.ShaderMaterial({
    uniforms: ctx.uniforms,
    side: THREE.DoubleSide, // offene Flächen (Blätter, Fiedern) von beiden Seiten
    // Licht und Malen je Ecke, für Vorder- und Rückseite (gl_FrontFacing wählt im Pixel): Die Blätter sind klein, und
    // gemalt ist das Licht ohnehin flächig – je Pixel kostete der Shader auf dem Handy ein Vielfaches
    vertexShader: `
        attribute vec4 aInfo; // Licht unten, oben; Helligkeit; Oberkante des Nebels
        attribute vec3 aCol;
        attribute float aLeaf; // 0 Holz, 1 Laub (scheint durch)
        attribute vec4 aSelf; // durch die eigene Krone: Himmel; Sonne a0 + a1 cos φ + b1 sin φ
        attribute vec2 aShape;
        varying vec3 vFront, vBack;
        varying vec2 vShape;
        ${ctx.lightGLSL}
        const vec3 SUN = ${glv(L.sun)}, EMIT = ${glv(L.emit)}, HAZE = ${glv(air.haze)};
        const vec3 GLOSS_SUN = ${glv(L.gloss?.sun ?? L.sun)};
        const float GLOSS_SKY = ${glf(L.gloss?.sky ?? 1 / Math.PI)};
        const vec3 SHADOW = ${glv(P.shadow)}, WARM = ${glv(P.light)};
        const mat3 IN_INV = ${glm3(inverse(IN))}, OUT_INV = ${glm3(inverse(OUT))};
        const mat3 IN_M = ${glm3(IN)}, OUT_M = ${glm3(OUT)};
        // Himmel und Boden der Lichtsonde (Blender-Achsen)
        vec3 sky(vec3 n) {
          return ${L.sh.map((c, i) => `${glv(c)} * ${['1.0', 'n.x', 'n.y', 'n.z', 'n.x * n.y', 'n.y * n.z',
            '(3.0 * n.z * n.z - 1.0)', 'n.x * n.z', '(n.x * n.x - n.y * n.y)'][i]}`).join(' + ')};
        }
        // ACES wie der letzte Bildschritt (Belichtung 1) und zurück (anime.aces_inverse)
        vec3 aces(vec3 c) {
          vec3 v = IN_M * (c / 0.6);
          v = (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.4329510) + 0.238081);
          return clamp(OUT_M * v, 0.0, 1.0);
        }
        vec3 acesInverse(vec3 d) {
          vec3 y = clamp(OUT_INV * d, 0.0, 1.0);
          vec3 a = 1.0 - 0.983729 * y, b = 0.0245786 - 0.4329510 * y, c = -0.000090537 - 0.238081 * y;
          vec3 x = (-b + sqrt(max(b * b - 4.0 * a * c, 0.0))) / (2.0 * max(a, 1e-4));
          return max(IN_INV * x, 0.0) * 0.6;
        }
        vec3 encode(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        vec3 decode(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c)); }
        // Farbe einer Seite mit Normale N: Licht wie in Blender, gemalt wie anime.grade, als Szenenwert vor ACES
        vec3 shade(vec3 N, vec3 V, float dist, float sun, float sky0, float leaf) {
          vec3 nb = vec3(N.x, -N.z, N.y);
          float nl = dot(N, SKY_LIGHT);
          vec3 front = max(sky(nb), 0.0) * sky0 + SUN * max(nl, 0.0) * sun;
          vec3 back = max(sky(-nb), 0.0) * sky0 + SUN * max(-nl, 0.0) * sun;
          // das Grundlicht steckt in Blender in der Principled BSDF: beim Laub nur ihr Anteil (1 − translucent)
          vec3 lin = aCol * (mix(front, back, ${T} * leaf) + EMIT * (1.0 - ${T} * leaf));
          // Glanz wie die Principled BSDF in Blender (Rauheit Laub 0.55, Holz 0.85; ohne ihn fehlte dem Laub der
          // bläuliche Schimmer des Himmels): Himmel in Spiegelrichtung nach Fresnel, Sonne nach GGX
          float nv = max(dot(N, V), 1e-3), rough = mix(0.85, 0.55, leaf), a2 = pow(rough, 4.0);
          vec3 R = reflect(-V, N);
          // sky() ist Beleuchtung eines weissen, matten Körpers (Pixelwert), Glanzstrahlen sehen den Himmel mit GLOSS_SKY
          vec3 spec = (0.04 + (1.0 - rough - 0.04) * pow(1.0 - nv, 5.0)) * max(sky(vec3(R.x, -R.z, R.y)), 0.0) * GLOSS_SKY * sky0;
          vec3 H = normalize(V + SKY_LIGHT);
          float nh = max(dot(N, H), 0.0), k = rough * rough * 0.5, nlp = max(nl, 0.0);
          float ggx = a2 / (3.14159 * pow(nh * nh * (a2 - 1.0) + 1.0, 2.0));
          float fs = 0.04 + 0.96 * pow(1.0 - max(dot(V, H), 0.0), 5.0);
          spec += GLOSS_SUN * sun * ggx * fs * nlp / (4.0 * mix(nlp, 1.0, k) * mix(nv, 1.0, k));
          lin += spec * (1.0 - ${T} * leaf);
          lin = mix(lin, HAZE, 1.0 - exp(-dist / ${glf(L.airDist)}));
          // gemalt wie anime.grade (Anzeige-Farben, sRGB-kodiert)
          vec3 d = encode(aces(lin * ${glf(P.exposure)}));
          float lum = dot(d, vec3(0.2126, 0.7152, 0.0722));
          d = lum + (d - lum) * ${glf(P.saturation)};
          d += (1.0 - smoothstep(0.0, 0.45, lum)) * SHADOW;
          d *= 1.0 + smoothstep(0.35, 0.85, lum) * (WARM - 1.0);
          return min(acesInverse(decode(clamp(d, 0.0, 1.0))), 0.91); // TEX_MAX
        }
        void main() {
          vShape = aShape;
          mat4 m = modelMatrix * instanceMatrix;
          // Azimut der Sonne in den Achsen der Vorlage (x = cos φ, z = sin φ): Licht durch die eigene Krone
          vec2 sd = vec2(dot(SKY_LIGHT, normalize(m[0].xyz)), dot(SKY_LIGHT, normalize(m[2].xyz)));
          sd /= max(length(sd), 1e-4);
          float self = clamp(aSelf.y + aSelf.z * sd.x + aSelf.w * sd.y, 0.0, 1.0);
          float sun = mix(aInfo.x, aInfo.y, smoothstep(0.2, 0.8, position.y)) * self;
          vec4 wp = m * vec4(position, 1.0);
          vec3 sc = vec3(length(m[0].xyz), length(m[1].xyz), length(m[2].xyz));
          vec3 N = normalize(mat3(m) * (normal / (sc * sc)));
          vec3 toCam = cameraPosition - wp.xyz;
          float dist = length(toCam);
          vFront = shade(N, toCam / dist, dist, sun, aSelf.x, aLeaf);
          vBack = shade(-N, toCam / dist, dist, sun, aSelf.x, aLeaf); // Rückseite: Normale umgedreht
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
    fragmentShader: `
        uniform float uFade, uReady;
        varying vec3 vFront, vBack;
        varying vec2 vShape;
        void main() {
          // runde Blätter statt Sechsecke (gemalt verwischt der Pinsel ihre Ecken), zur Spitze schmaler
          if (abs(vShape.y) > 0.5 * pow(sin(3.14159 * vShape.x), 0.6) * (1.0 - 0.2 * vShape.x)) discard;
          gl_FragColor = vec4((gl_FrontFacing ? vFront : vBack) * uFade * uReady, 1.0);
        }`,
  });
  return yield* instancedModels(set, material, true);
}

/**
 * Nahe Objekte mit gebackenem Licht (Daten: { pos16: Ecken in Spielkoordinaten als Int16 / scale, uv16: UV als Uint16,
 * idx16/idx32: Dreiecke, rock8: je Ecke 0 … 255, wie viel Fels sie trägt, texture: Bild – Szenenwerte vor ACES,
 * sRGB-kodiert, gemalt wie das Panorama }; Strand: die nahen Felsen samt dem Gelände ihrer Gruppen). Blender hat sie
 * beleuchtet, mit Schatten; das Panorama zeigt sie nicht (aus seinem Mittelpunkt gesehen lägen sie schräg), ihre
 * Schatten darin bleiben. Wo das Gelände flach ist (rock8 unter der Hälfte), zeigt sich das Panorama: Dort stimmt es
 * (gebacken hob sich der Sand ab). Mit fade: [von, bis] läuft das Netz dazwischen ins Panorama aus, statt hart
 * abzubrechen: durchsichtig, oder mit ground: [sink, up] (Wüste: rock8 · up ist die Höhe der nahen Dünen über dem Sand
 * des Panoramas, das Netz liegt sink tiefer) in die Farbe, die das Panorama vom Sand direkt darunter zeigt; Strand:
 * ground [0, 0], das flache Gelände der Felsgruppen nimmt die Farbe, die das Panorama genau dort zeigt (sonst stand es
 * mit Treppenrand heller im Sand).
 * Mit view, viewTexture, viewData zeigen sie, wo man sie vom Mittelpunkt des Panoramas aus sieht, das Bild, das Blender
 * von dort gemalt hat (vom Mittelpunkt aus projiziert: so sahen sie aus, als das Panorama sie noch zeigte – gebacken
 * wirkten sie fleckiger und flauer); sonst das gebackene Licht. view.windows: Ausschnitte [az0, az1, el0, el1 (Grad,
 * wie das Equirect), Breite, Zeile oben, Zeile unten (Anteil des Bilds)], untereinander im Bild; viewData ein Viertel:
 * R Abstand vom Mittelpunkt (log, 8 Bit, Bereich view.log), G Gewicht (0 neben und am Rand der Felsen). Ein Punkt
 * gilt als von dort gesehen, wenn sein Abstand zu dem im Bild passt.
 * Generator (sliced: wartet, bis die Bilder dekodiert sind; hochgeladen werden sie mit den übrigen Texturen vor dem
 * Einblenden).
 */
function* bakedMesh(ctx, opt) {
  const set = ctx.data[opt.data];
  // je Feld und Stück ein Häppchen (sliced, b64Bytes): zusammen hielt das Entpacken ein Bild 30–40 ms an, ein grosses
  // Feld allein auf dem gedrosselten Handy noch 50–60 ms (Ticket 09 der Leistung)
  const q = new Int16Array(yield* b64Bytes(set.pos16));
  const uv = new Uint16Array(yield* b64Bytes(set.uv16));
  const rock = new Uint8Array(yield* b64Bytes(set.rock8));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(yield* mappedFloats(q, (v) => v / set.scale), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(yield* mappedFloats(uv, (v) => v / 65535), 2));
  geo.setAttribute('aRock', new THREE.BufferAttribute(yield* mappedFloats(rock, (v) => v / 255), 1));
  const idx = set.idx16 ? new Uint16Array(yield* b64Bytes(set.idx16)) : new Uint32Array(yield* b64Bytes(set.idx32));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  // Bild aus einer Data-URL, dekodiert, nicht nur geladen: Sonst dekodierte es texImage2D beim Hochladen im Hauptthread
  // (siehe loadSkyImage). color: Farbbild (sRGB, Mipmaps), sonst Daten (nächster Nachbar, ohne Mipmaps)
  // Als ImageBitmap ohne Farbumrechnung, im Hintergrund dekodiert: Ein dekodiertes Bild (img.decode) dekodierte der
  // Browser beim Hochladen noch einmal im Hauptthread, weil three die Farbumrechnung abschaltet. Farbbilder dazu in
  // Streifen zu 256 Zeilen, die skyUpload je in einem eigenen Bild hochlädt (Mipmaps danach auf der Grafikkarte): Das
  // grosse Bild der Felsen am Strand (2662 × 1706) hielt in einem Stück ein Bild über 100 ms an (Ticket 08). Wo das
  // nicht geht, wie bisher als Bild.
  const BITMAP = { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }, ZEILEN = 256;
  const image = function* (url, color) {
    let bitmap = null, done = typeof createImageBitmap !== 'function';
    if (!done) {
      fetch(url).then((r) => r.blob()).then((blob) => createImageBitmap(blob, BITMAP))
        .then((b) => { bitmap = b; }, () => {}).finally(() => { done = true; });
    }
    while (!done) yield NEXT_FRAME;
    let strips = null;
    if (bitmap && color && renderer.capabilities.isWebGL2 && typeof OffscreenCanvas === 'function') {
      // Streifen über ein OffscreenCanvas wie in skyBitmaps, je einer in einem Häppchen: Einen mit
      // createImageBitmap(bitmap, 0, y, …) zugeschnittenen lädt Firefox ohne den Zuschnitt in WebGL (deckende JPEGs:
      // das vormultiplizierte Canvas ändert nichts). Ohne OffscreenCanvas das ganze Bild in einem Stück.
      const { width: w, height: h } = bitmap, list = [];
      try {
        for (let y = 0; y < h; y += ZEILEN) {
          const c = new OffscreenCanvas(w, Math.min(ZEILEN, h - y));
          c.getContext('2d', { willReadFrequently: true }).drawImage(bitmap, 0, -y);
          list.push({ level: 0, y, bitmap: c.transferToImageBitmap() });
          yield;
        }
        strips = list;
      } catch { for (const s of list) s.bitmap.close(); }
    }
    const img = strips ? { width: bitmap.width, height: bitmap.height } : bitmap ?? new Image();
    const tex = new THREE.Texture(img);
    if (strips) {
      bitmap.close();
      tex.userData.strips = strips;
      tex.userData.mipmaps = true;
    } else if (bitmap) tex.addEventListener('dispose', () => bitmap.close());
    tex.flipY = false; // Zeile 0 oben wie die Bilder und die UV-Karte aus Blender (v nach oben): im Shader 1 − v
    if (color) {
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    } else {
      tex.minFilter = tex.magFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
    }
    if (strips) return tex; // lädt skyUpload hoch, three nicht (needsUpdate bleibt aus)
    if (!bitmap) {
      let decoded = null;
      img.src = url;
      img.decode().then(() => { decoded = true; }, () => { decoded = false; });
      while (decoded === null) yield NEXT_FRAME;
      if (!decoded || !img.naturalWidth) throw new Error('Bild der Felsen nicht lesbar');
    }
    tex.needsUpdate = true;
    return tex;
  };
  const tex = yield* image(set.texture, true);
  const view = set.view && set.viewTexture && set.viewData ? set.view : null;
  const uniforms = { ...ctx.uniforms, uTex: { value: tex } };
  if (view) {
    uniforms.uView = { value: yield* image(set.viewTexture, true) };
    uniforms.uViewData = { value: yield* image(set.viewData, false) };
  }
  // je Ausschnitt: Lage im Bild und Gewicht 0 … 1 (ohne Verzweigung: Ableitungen fürs Farbbild gelten überall)
  const windows = (view?.windows ?? []).map(([a0, a1, e0, e1, w, t0, t1], i) => `
          {
            vec2 st = vec2((az - ${glf(a0)}) / ${glf(a1 - a0)}, (${glf(e1)} - el) / ${glf(e1 - e0)});
            float inside = step(0.0, st.x) * step(st.x, 1.0) * step(0.0, st.y) * step(st.y, 1.0);
            vec2 uv${i} = vec2(st.x * ${glf(w)}, ${glf(t0)} + st.y * ${glf(t1 - t0)});
            vec4 dd = texture2D(uViewData, uv${i});
            float ld = mix(VIEW_LOG.x, VIEW_LOG.y, dd.r);
            float w${i} = inside * dd.g * (1.0 - smoothstep(0.015, 0.04, abs(log(dist) - ld)));
            viewUv = mix(viewUv, uv${i}, inside);
            weight = max(weight, w${i});
          }`).join('');
  // fade [von, bis] in rock8: dort geht die Farbe in die des Panoramas über; ground [sink, up]: rock8 ist die Höhe über
  // dem Sand des Panoramas (mal up, in m), das Netz liegt sink tiefer – die Farbe kommt von diesem Sand unter dem Punkt
  // (was dahinter liegt, wäre bei schrägem Blick der Sand unter der Düne)
  const fade = opt.fade ?? null, ground = fade && opt.ground;
  if (ground) Object.assign(uniforms, { uPano: { value: ctx.pano.full } });
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
        attribute float aRock;
        varying vec2 vUv;
        varying float vRock;
        varying vec3 vPos;
        void main() {
          vUv = vec2(uv.x, 1.0 - uv.y);
          vRock = aRock;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
    fragmentShader: `${ground ? `
        #if __VERSION__ >= 300
          #define LOD0(t, p) textureLod(t, p, 0.0)
        #elif defined(GL_EXT_shader_texture_lod)
          #define LOD0(t, p) texture2DLodEXT(t, p, 0.0)
        #else
          #define LOD0(t, p) texture2D(t, p)
        #endif
        uniform sampler2D uPano;` : ''}
        uniform sampler2D uTex${view ? ', uView, uViewData' : ''};
        uniform float uFade, uReady;
        varying vec2 vUv;
        varying float vRock;
        varying vec3 vPos;
        const vec3 VIEW_CENTER = ${glv(ctx.pano.center.toArray())};
        const vec2 VIEW_LOG = ${glv((view?.log ?? [1, 2]).map(Math.log))};
        void main() {
          vec3 col = texture2D(uTex, vUv).rgb;${view ? `
          // Richtung vom Mittelpunkt wie im Equirect (Grad): az von Blender +y aus, el über dem Horizont
          vec3 d = vPos - VIEW_CENTER;
          float dist = length(d);
          float az = degrees(atan(d.x, -d.z)), el = degrees(asin(clamp(d.y / dist, -1.0, 1.0)));
          vec2 viewUv = vec2(0.0);
          float weight = 0.0;${windows}
          col = mix(col, texture2D(uView, viewUv).rgb, weight);` : ''}
          ${ground ? `if (vRock < ${glf(fade[0])}) discard;
          vec3 g = vec3(vPos.x, vPos.y + ${glf(ground[0])} - vRock * ${glf(ground[1])}, vPos.z) - VIEW_CENTER;
          vec3 b = normalize(vec3(g.x, -g.z, g.y));
          vec3 sand = LOD0(uPano, vec2(0.5 + atan(b.x, b.y) / 6.2831853, 1.0 - acos(clamp(b.z, -1.0, 1.0)) / 3.1415927)).rgb;
          col = mix(sand, col, smoothstep(${glf(fade[0])}, ${glf(fade[1])}, vRock));` : fade ? `float a = smoothstep(${glf(fade[0])}, ${glf(fade[1])}, vRock);
          if (a <= 0.0) discard;` : 'if (vRock < 0.5) discard;'}
          gl_FragColor = vec4(col * uFade * uReady, ${fade && !ground ? 'a' : '1.0'});
        }`,
    transparent: !!fade && !ground,
    extensions: { shaderTextureLOD: !!ground },
  }));
  mesh.frustumCulled = false;
  return mesh;
}

/**
 * Leuchtpunkte zwischen nahen Objekten (Daten wie toonInstances; Wald: Glühwürmchen): im Ring um das Brett, über dem
 * Nebel, unter der Brettebene; klein, mit weichem Schein, sie leuchten unregelmässig auf (etwa eine halbe Sekunde, dann
 * eine Weile dunkel).
 */
function glowParticles(ctx, opt) {
  const rand = mulberry32(opt.seed);
  const [r0, r1] = opt.ring;
  const spots = ctx.data[opt.data].instances.filter(([x, y, z, , , , , , , , top = -Infinity]) =>
    Math.hypot(x, z) > r0 && Math.hypot(x, z) < r1 && y > top + opt.aboveFog);
  const n = opt.count, pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n && spots.length; i++) {
    const [x, y, z] = spots[Math.floor(rand() * spots.length)];
    pos.set([x + (rand() - 0.5) * opt.spread, Math.min(y + opt.lift[0] + rand() * opt.lift[1], opt.yMax), z + (rand() - 0.5) * opt.spread], i * 3);
    seed[i] = rand();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const points = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: ctx.pointUniforms,
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: `attribute float aSeed;
        uniform float uTime, uFade, uReady, uPixelRatio;
        varying float vGlow;
        void main() {
          float t = uTime * (0.2 + 0.15 * aSeed) + aSeed * 60.0;
          vec3 p = position + vec3(sin(t) * 1.2 + sin(t * 0.37) * 0.7, sin(t * 0.7 + 1.0) * 0.4, cos(t * 0.83) * 1.2);
          p.y = min(p.y, ${glf(opt.ceiling)}); // nie über die Brettebene
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float ph = fract(uTime * (0.25 + 0.2 * aSeed) + aSeed * 7.0);
          float blink = smoothstep(0.0, 0.08, ph) * smoothstep(0.3, 0.12, ph); // kurz an, lange aus
          vGlow = blink * uFade * uReady;
          gl_PointSize = ${glf(opt.size)} * uPixelRatio * 40.0 / -mv.z;
        }`,
    fragmentShader: `varying float vGlow;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          float core = smoothstep(0.3, 0.0, r), halo = exp(-r * r * 6.0) * 0.35;
          gl_FragColor = vec4((${glv(opt.color)} * core * 2.2 + ${glv(opt.halo)} * halo) * vGlow, 0.0);
        }`,
  }));
  points.frustumCulled = false;
  points.renderOrder = 6;
  return points;
}

/**
 * Ziehender Nebelschleier: durchscheinende Lagen knapp über der Oberkante des Nebelmeers (fog.top; sheets: Höhe darüber,
 * Deckkraft, Versatz des Musters), deren Schwaden langsam mit dem Wind treiben und sich dabei verändern. Wo Kämme
 * höher liegen, verdeckt sie das Panorama (Tiefentest): Der Schleier bleibt in den Tälern. Farbe wie der gemalte Nebel
 * (air), zum Licht hin heller; zum Rand der Sicht (fade) blendet er aus.
 */
function mistSheets(ctx, opt) {
  const out = new THREE.Group(), air = ctx.air;
  opt.sheets.forEach(([dy, alpha, off]) => {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(opt.radius, 64).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: { ...ctx.uniforms, uAlpha: { value: alpha }, uOff: { value: off } },
      transparent: true, depthWrite: false,
      vertexShader: `varying vec3 vPos;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
      fragmentShader: `uniform float uTime, uFade, uReady, uAlpha, uOff;
          varying vec3 vPos;
          ${GLSL_NOISE}
          ${ctx.lightGLSL}
          const vec3 HAZE = ${glv(air.haze)}, FOG_LIT = ${glv(air.lit)};
          void main() {
            vec2 wind = ${glv(opt.wind)};
            vec2 p = vPos.xz - wind * uTime * ${glf(opt.speed)};
            // in Windrichtung gestreckte Schwaden, die sich langsam verändern
            vec2 q = vec2(dot(p, wind), dot(p, vec2(-wind.y, wind.x)) * ${glf(opt.stretch)}) / ${glf(opt.scale)};
            float n = fbm3(vec3(q, uTime * 0.02 + uOff * 7.0));
            float a = smoothstep(${glf(opt.cover[0])}, ${glf(opt.cover[1])}, n) * uAlpha;
            vec3 toCam = cameraPosition - vPos;
            float dist = length(toCam);
            a *= smoothstep(${glf(opt.fade[1])}, ${glf(opt.fade[0])}, dist);
            vec2 h = normalize(-toCam.xz + vec2(1e-4)), m = normalize(SKY_LIGHT.xz);
            vec3 col = mix(HAZE, FOG_LIT, pow(max(dot(h, m), 0.0), 2.0));
            float k = uFade * uReady;
            gl_FragColor = vec4(col * k, a * k);
          }`,
    }));
    disc.position.y = ctx.fog.top + dy;
    disc.frustumCulled = false;
    disc.renderOrder = 5;
    out.add(disc);
  });
  return out;
}

/**
 * Lavasee unter dem Brett (Vulkan, wie der Nyiragongo): eine Scheibe auf der Höhe level (+ lift zur Kamera hin, für
 * den Tiefentest gegen das Netz des Panoramas), Radius radius, am Rand über fade ins gemalte Panorama ausgeblendet.
 * Dunkle Krustenplatten (crust: zwei Töne) mit unregelmässigen, glühenden Rissen in zwei Grössen (plates: Platten
 * scale m, feinere Risse fine im Anteil der Platten, Breite crack im Anteil der Zelle); die Platten treiben (drift, m/s)
 * und verformen sich langsam (churn), die Risse öffnen und schliessen sich. Farbe der Glut nach Hitze (heat: Kern,
 * heiss, tief). Gasblasen (bursts: count Stellen im Ring ring, Radius size, Dauer period in s) wölben die Kruste auf,
 * ihre Risse glühen auf, dann reisst sie, Lava spritzt kurz hoch (spatter: Tropfen je Blase, Höhe height in m, Grösse
 * size) und kühlt wieder zu Kruste ab. Dazu Funken (sparks). Nahe beim Brett (calm: Radien, Faktor) glüht alles
 * gedämpfter. Alle Farben sind Szenenwerte unter der Bloom-Schwelle.
 */
function lavaPool(ctx, opt) {
  const out = new THREE.Group();
  const y0 = opt.level + opt.lift;
  const [calm0, calm1, calmK] = opt.calm;
  const [core, hot, deep] = opt.heat;
  const pl = opt.plates, bu = opt.bursts, sp = opt.spatter;
  const rand = mulberry32(opt.seed);
  // Blasen: Ort, Dauer, Versatz (gemeinsam für Scheibe und Spritzer)
  const bursts = Array.from({ length: bu.count }, () => {
    const a = rand() * 2 * Math.PI, r = bu.ring[0] + rand() * (bu.ring[1] - bu.ring[0]);
    return { x: Math.sin(a) * r, z: Math.cos(a) * r, period: bu.period[0] + rand() * (bu.period[1] - bu.period[0]),
      offset: rand(), size: bu.size[0] + rand() * (bu.size[1] - bu.size[0]) };
  });
  const burstU = bursts.map((b) => new THREE.Vector4(b.x, b.z, b.period, b.offset));
  const sizeU = bursts.map((b) => b.size);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(opt.radius, 160).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { ...ctx.uniforms, uBursts: { value: burstU }, uBurstR: { value: sizeU } },
    transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
    fragmentShader: `uniform float uTime, uFade, uReady;
        uniform vec4 uBursts[${bu.count}];
        uniform float uBurstR[${bu.count}];
        varying vec3 vPos;
        ${GLSL_NOISE}
        vec2 hash2(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return fract(sin(p) * 43758.5453);
        }
        // Abstand zur nächsten Zellgrenze (Anteil der Zelle); die Zellpunkte kreisen langsam (die Platten verformen sich)
        float cells(vec2 x, float t) {
          vec2 n = floor(x), f = fract(x), mg = vec2(0.0), mr = vec2(0.0);
          float md = 8.0;
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j)), o = 0.5 + 0.4 * sin(t + 6.2831 * hash2(n + g));
            vec2 r = g + o - f;
            float d = dot(r, r);
            if (d < md) { md = d; mr = r; mg = g; }
          }
          md = 8.0;
          for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
            vec2 g = mg + vec2(float(i), float(j)), o = 0.5 + 0.4 * sin(t + 6.2831 * hash2(n + g));
            vec2 r = g + o - f;
            if (dot(mr - r, mr - r) > 1e-5) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
          }
          return md;
        }
        const vec3 CORE = ${glv(core)}, HOT = ${glv(hot)}, DEEP = ${glv(deep)};
        const vec3 CRUST0 = ${glv(opt.crust[0])}, CRUST1 = ${glv(opt.crust[1])};
        vec3 glow(float h) { return h < 0.5 ? mix(DEEP, HOT, h * 2.0) : mix(HOT, CORE, h * 2.0 - 1.0); }
        void main() {
          vec2 p = vPos.xz;
          float t = uTime;
          vec2 q = p - ${glv(pl.drift)} * t;
          vec2 w = q + (vec2(fbm3(vec3(q * 0.12, t * 0.02)), fbm3(vec3(q * 0.12 + 7.0, t * 0.02))) - 0.44) * 8.0;
          float open = 0.7 + 0.6 * noise(vec3(p * 0.15, t * 0.25));            // Risse atmen
          float big = cells(w / ${glf(pl.scale)}, t * ${glf(pl.churn)});
          float small = cells(w / ${glf(pl.scale * 0.32)} + 9.0, t * ${glf(pl.churn * 1.3)});
          float cw = ${glf(pl.crack)} * open;
          float k1 = (1.0 - smoothstep(0.0, cw, big)) * mix(0.5, 1.0, smoothstep(0.3, 0.65, noise(vec3(w * 0.4, 2.0))));
          float k2 = (1.0 - smoothstep(0.0, cw * 0.8, small)) * smoothstep(${glf(1 - pl.fine)}, ${glf(1 - pl.fine + 0.12)}, noise(vec3(p * 0.3, 5.0))) * 0.75;
          float heat = max(k1, k2);
          float halo = (1.0 - smoothstep(0.0, cw * 3.5, big)) * 0.18;            // Kruste neben den Rissen glimmt
          vec3 crust = mix(CRUST0, CRUST1, noise(vec3(w * 0.5, 1.0)));
          // Blasen: Kruste wölbt sich, Risse glühen auf, reisst, glüht hell, kühlt ab
          for (int i = 0; i < ${bu.count}; i++) {
            vec4 b = uBursts[i];
            float R = uBurstR[i];
            float ph = fract(t / b.z + b.w);
            vec2 d = p - b.xy;
            float r = length(d);
            if (r > R * 3.0) continue;
            if (ph < 0.55) {                                                   // aufwölben
              float s = ph / 0.55, rr = R * (0.4 + 0.6 * s);
              float inside = 1.0 - smoothstep(rr * 0.85, rr, r);
              float torn = 1.0 - smoothstep(0.0, cw * (0.8 + 1.2 * s), small);   // die feinen Risse reissen auf
              crust = mix(crust, crust * 1.6 + 0.01, inside * s);                // gespannt, heller
              heat = max(heat, inside * torn * s * s * 0.85);
              heat = max(heat, (1.0 - smoothstep(rr, rr * 1.15, r)) * smoothstep(rr * 0.8, rr, r) * s * 0.6);
            } else if (ph < 0.68) {                                            // aufgerissen: helle Lava
              float s = (ph - 0.55) / 0.13;
              float edge = R * (1.0 + 0.45 * s) * (0.75 + 0.5 * noise(vec3(d * 2.5, b.w * 30.0 + s)));
              heat = max(heat, (1.0 - smoothstep(edge * 0.8, edge, r)) * (0.7 + 0.3 * (1.0 - r / edge)));
            } else {                                                           // abkühlen, Spritzer ringsum
              float s = (ph - 0.68) / 0.32;
              float edge = R * (1.1 - 0.6 * s) * (0.75 + 0.5 * noise(vec3(d * 2.5, b.w * 30.0 + 1.0)));
              float spot = (1.0 - smoothstep(edge * 0.75, edge, r)) * (0.6 + 0.4 * (1.0 - r / edge));
              float drops = step(0.86, noise(vec3(d * 5.0, b.w * 40.0))) * (1.0 - smoothstep(R, R * 2.6, r));
              heat = max(heat, max(spot, drops * 0.8) * (1.0 - s) * (1.0 - s));
            }
          }
          float calm = mix(${glf(calmK)}, 1.0, smoothstep(${glf(calm0)}, ${glf(calm1)}, length(p)));
          vec3 col = crust + DEEP * halo * calm;
          col = mix(col, glow(heat) * calm, smoothstep(0.02, 0.25, heat));
          float a = 1.0 - smoothstep(${glf(opt.radius - opt.fade)}, ${glf(opt.radius)}, length(p));
          gl_FragColor = vec4(col, a * uFade * uReady);
        }`,
  }));
  disc.position.y = y0;
  disc.frustumCulled = false;
  disc.renderOrder = -900; // gleich nach dem Panorama, vor allem Übrigen
  out.add(disc);

  // Spritzer (beim Aufreissen hochgeworfen, im Bogen zurück) und Funken (steigen auf): Punkte, Grösse in Metern
  const screenH = { value: 1 };
  const P = [], A = [], B = [];
  for (const b of bursts) {
    for (let k = 0; k < sp.count; k++) {
      const a = rand() * 2 * Math.PI, h = rand() * 1.4;
      P.push(b.x, y0, b.z);
      A.push(Math.cos(a) * h, sp.height * (0.5 + 0.5 * rand()), Math.sin(a) * h, -1);   // Geschwindigkeit; w < 0: Spritzer
      B.push(b.period, b.offset, 0, 0);
    }
  }
  const sk = opt.sparks;
  for (let i = 0; i < sk.count; i++) {
    const a = rand() * 2 * Math.PI, r = Math.sqrt(rand()) * (opt.radius - opt.fade);
    P.push(Math.sin(a) * r, y0, Math.cos(a) * r);
    A.push(0, sk.height * (0.5 + 0.5 * rand()), 0, rand());
    B.push(1.6 + rand() * 2.4, rand(), 0, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('aVel', new THREE.Float32BufferAttribute(A, 4));
  geo.setAttribute('aTime', new THREE.Float32BufferAttribute(B, 4));
  const drops = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: { ...ctx.pointUniforms, uScreenH: screenH },
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: `attribute vec4 aVel, aTime;
        uniform float uTime, uScreenH;
        varying float vOn, vCool;
        void main() {
          vec3 p = position;
          float size;
          if (aVel.w < 0.0) {                         // Spritzer: ab dem Aufreissen (Phase 0.55) im Bogen
            float tau = (fract(uTime / aTime.x + aTime.y) - 0.55) * aTime.x;
            float vy = sqrt(2.0 * 9.81 * aVel.y);
            p += vec3(aVel.x * tau, vy * tau - 4.905 * tau * tau, aVel.z * tau);
            vOn = step(0.0, tau) * step(${glf(opt.level)}, p.y);
            vCool = clamp(tau / 1.2, 0.0, 1.0);
            size = ${glf(sp.size)};
          } else {                                    // Funke: steigt auf, schwankt
            float ph = fract(uTime / aTime.x + aTime.y * 13.0), s = aVel.w * 6.2831;
            p += vec3(sin(uTime * 1.3 + s) * 0.8 * ph, ph * aVel.y, cos(uTime * 1.1 + s) * 0.8 * ph);
            vOn = 1.0 - smoothstep(0.6, 1.0, ph);
            vCool = ph;
            size = ${glf(sk.size)};
          }
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max(size * projectionMatrix[1][1] * 0.5 * uScreenH / max(-mv.z, 0.1), 1.5);
        }`,
    fragmentShader: `uniform float uFade, uReady;
        varying float vOn, vCool;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          float a = (1.0 - smoothstep(0.5, 1.0, r)) * vOn;
          vec3 col = mix(${glv(sp.color)}, ${glv(sk.color)}, vCool);   // kühlt ab: gelb zu rot
          gl_FragColor = vec4(col * a * uFade * uReady, 0.0);
        }`,
  }));
  drops.frustumCulled = false;
  drops.renderOrder = 6;
  out.add(drops);
  const size = new THREE.Vector2();
  out.userData.update = () => { screenH.value = renderer.getDrawingBufferSize(size).y; };
  return out;
}

/**
 * Feuernester (Vulkan, wie im Gaskrater Darvaza): Das Panorama zeigt nur ihren Schein, den Russ und die glimmenden
 * Risse, die Flammen zeichnet das Spiel bewegt. Je Flamme eine aufrechte Fläche, zur Kamera gedreht, der Fuss auf der
 * Böschung (data: flames je [x, y, z, Höhe, Breite, Zufall] in Spielkoordinaten, vom Export der Szene); im Shader drei
 * Zungen aus Rauschen, das nach oben zieht: Sie flackern, schwanken und reissen an der Spitze auf, in vier Farbstufen
 * wie gemalt (core, mid, edge, deep ab den Schwellen bands), am Fuss ein bläulicher Saum (base), rundum ein weicher
 * Glutschein (halo); shape: Faktor auf Höhe und Breite. Dazu je Nest (nests: [x, y, z, Zahl der Flammen]) ein weicher
 * Schein (glow, Radius glowSize m plus 0,25 m je Flamme), der mitflackert: das Licht auf dem Sand, und aufsteigende
 * Funken (embers: count je Nest, Höhe height m, Grösse size m, Farbe color). Keine Texturen, nur Ecken (rund 1000
 * Flammen: gut 130 KB, samt Schein und Funken gut 150 KB). lift: so weit zur Kamera hin (m), für den Tiefentest gegen
 * das Netz des Panoramas; cover: so viel deckt eine Flamme den Grund ab (der Rest kommt dazu). Farben unter der
 * Bloom-Schwelle.
 */
function fireNests(ctx, opt) {
  const out = new THREE.Group();
  const { flames, nests } = ctx.data[opt.data];
  const n = flames.length;
  const foot = new Float32Array(n * 12), shape = new Float32Array(n * 12), corner = new Float32Array(n * 8);
  const index = new (n * 4 > 65536 ? Uint32Array : Uint16Array)(n * 6); // ab 16384 Flammen reicht Uint16 nicht
  flames.forEach(([x, y, z, h, w, s], i) => {
    for (let k = 0; k < 4; k++) {
      const v = i * 4 + k;
      foot.set([x, y, z], v * 3);
      shape.set([h, w, s], v * 3);
      corner.set([k & 1 ? 1 : -1, k >> 1], v * 2);
    }
    index.set([i * 4, i * 4 + 1, i * 4 + 3, i * 4, i * 4 + 3, i * 4 + 2], i * 6);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(foot, 3));
  geo.setAttribute('aFlame', new THREE.BufferAttribute(shape, 3));
  geo.setAttribute('aCorner', new THREE.BufferAttribute(corner, 2));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  const speed = glf(opt.speed);
  const tongues = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: ctx.uniforms,
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: `attribute vec3 aFlame;
        attribute vec2 aCorner;
        uniform float uTime;
        varying vec2 vUv;
        varying float vSeed, vHot;
        void main() {
          float s = aFlame.z, t = uTime * ${speed};
          // Flackern: die Flamme wächst und schrumpft unregelmässig, je Flamme anders
          float flick = 0.8 + 0.12 * sin(t * 6.1 + s * 40.0) + 0.08 * sin(t * 11.3 + s * 17.0) + 0.06 * sin(t * 2.3 + s * 5.0);
          vec3 toCam = cameraPosition - position;
          vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
          vec3 front = normalize(vec3(toCam.x, 0.0, toCam.z) + 1e-4);
          // die Fläche ist breiter und höher als die Flamme: Platz zum Schwanken
          float h = aFlame.x * flick * 1.15 * ${glf(opt.shape[0])}, w = aFlame.y * 2.0 * ${glf(opt.shape[1])};
          vec3 p = position + front * ${glf(opt.lift)} + side * (aCorner.x * w * 0.5) + vec3(0.0, aCorner.y * h, 0.0);
          vUv = aCorner; vSeed = s; vHot = flick;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
    fragmentShader: `uniform float uTime, uFade, uReady;
        varying vec2 vUv;
        varying float vSeed, vHot;
        ${GLSL_NOISE}
        void main() {
          float t = uTime * ${speed};
          // Rauschen zieht nach oben; nach oben schwankt die Flamme mehr, die Ränder fransen aus, die Spitzen reissen
          // auf. Unten breit auf dem Boden (rund unten und spitz oben wirkte wie ein Tropfen). Drei Zungen: in der Mitte
          // die grosse, links und rechts kürzere, die abwechselnd auflodern
          float n = fbm3(vec3(vUv.x * 1.6 + vSeed * 13.0, vUv.y * 2.2 - t * 2.2, t * 0.4 + vSeed * 7.0));
          float e = noise(vec3(vUv.x * 4.0 + vSeed * 5.0, vUv.y * 5.0 - t * 4.0, vSeed * 3.0));
          float y0 = vUv.y * 1.15, sway = (n - 0.44) * 1.8 * vUv.y, body = 0.0, heat = 0.0;
          for (int i = 0; i < 3; i++) {
            float fi = float(i) - 1.0;
            float tall = i == 1 ? 1.0 : 0.6 + 0.18 * sin(t * 3.1 + vSeed * 20.0 + fi * 2.1);
            float y = y0 / tall;
            float x = vUv.x * 2.0 - fi * 0.34 + sway;
            float width = (y < 0.25 ? 0.75 + y : pow(max(1.0 - y, 0.0) / 0.75, 0.9)) * (i == 1 ? 1.0 : 0.55);
            float d = abs(x) / max(width, 1e-3) + (e - 0.5) * 0.7 * y;
            float b = (1.0 - smoothstep(0.8, 1.0, d)) * (1.0 - smoothstep(0.5, 0.9, y + (n - 0.44) * 1.2));
            body = max(body, b);
            heat = max(heat, b * pow(max(1.0 - d, 0.0), 1.5) * (1.0 - 0.9 * y));
          }
          // Glut um die Flamme: ein weicher Schein, nur dazugezählt
          float halo = exp(-(vUv.x * vUv.x * 2.5 + (y0 - 0.3) * (y0 - 0.3) * 3.5)) * (0.75 + 0.25 * vHot);
          if (body < 0.01 && halo < 0.02) discard;
          heat *= vHot;
          vec3 col = heat > ${glf(opt.bands[0])} ? ${glv(opt.core)} : heat > ${glf(opt.bands[1])} ? ${glv(opt.mid)}
            : heat > ${glf(opt.bands[2])} ? ${glv(opt.edge)} : ${glv(opt.deep)};
          // Gas brennt am Fuss bläulich: ein schmaler Saum unten in der Mitte
          col = mix(col, ${glv(opt.base)}, (1.0 - smoothstep(0.02, 0.1, y0)) * smoothstep(0.2, 0.5, heat) * 0.8);
          float k = uFade * uReady, a = body * k;
          gl_FragColor = vec4(col * a + ${glv(opt.halo)} * halo * (1.0 - body) * k, a * ${glf(opt.cover)});
        }`,
  }));
  tongues.frustumCulled = false;
  tongues.renderOrder = 6;
  out.add(tongues);

  // Schein je Nest: ein weicher Fleck, der unregelmässig mitflackert. Als Fläche zur Kamera, nicht als Punkt: Punkte
  // wären hier mehrere hundert Pixel gross (manche Handys begrenzen sie) und fielen ganz weg, sobald ihre Mitte das
  // Bild verlässt (Review)
  const screenH = { value: 1 };
  const G = [], K = [], GC = [], GI = [];
  nests.forEach(([x, y, z, k], i) => {
    for (let c = 0; c < 4; c++) {
      G.push(x, y + 0.6, z);
      K.push(opt.glowSize + 0.25 * k, (i * 0.618) % 1);
      GC.push(c & 1 ? 1 : -1, c & 2 ? 1 : -1);
    }
    GI.push(i * 4, i * 4 + 1, i * 4 + 3, i * 4, i * 4 + 3, i * 4 + 2);
  });
  const gGeo = new THREE.BufferGeometry();
  gGeo.setAttribute('position', new THREE.Float32BufferAttribute(G, 3));
  gGeo.setAttribute('aGlow', new THREE.Float32BufferAttribute(K, 2));
  gGeo.setAttribute('aCorner', new THREE.Float32BufferAttribute(GC, 2));
  gGeo.setIndex(GI);
  const glow = new THREE.Mesh(gGeo, new THREE.ShaderMaterial({
    uniforms: ctx.uniforms,
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: `attribute vec2 aGlow, aCorner;
        uniform float uTime;
        varying float vK;
        varying vec2 vUv;
        void main() {
          float t = uTime * ${speed}, s = aGlow.y * 6.2831;
          vK = 0.55 + 0.25 * sin(t * 5.3 + s * 3.0) + 0.2 * sin(t * 9.7 + s * 7.0);
          vUv = aCorner;
          vec4 mv = viewMatrix * vec4(position, 1.0);
          mv.xy += aCorner * aGlow.x;   // in Blickrichtung ausgerichtet, Radius in Metern
          gl_Position = projectionMatrix * mv;
        }`,
    fragmentShader: `uniform float uFade, uReady;
        varying float vK;
        varying vec2 vUv;
        void main() {
          float r = length(vUv);
          gl_FragColor = vec4(${glv(opt.glow)} * exp(-r * r * 4.0) * (1.0 - smoothstep(0.8, 1.0, r)) * vK * uFade * uReady, 0.0);
        }`,
  }));
  glow.frustumCulled = false;
  glow.renderOrder = 5;
  out.add(glow);

  // Funken (embers: count je Nest): steigen aus dem Nest auf, schwanken, kühlen von Gelb zu Rot ab und verlöschen
  const em = opt.embers, rand = mulberry32(31), E = [], EA = [];
  for (const [x, y, z, k] of nests) {
    const spread = 0.4 + 0.06 * k;
    for (let j = 0; j < em.count; j++) {
      E.push(x + (rand() - 0.5) * 2 * spread, y + 0.3, z + (rand() - 0.5) * 2 * spread);
      EA.push(1.2 + rand() * 1.8, rand(), em.height * (0.5 + 0.5 * rand()), rand());   // Dauer, Versatz, Höhe, Zufall
    }
  }
  const eGeo = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.Float32BufferAttribute(E, 3));
  eGeo.setAttribute('aEmber', new THREE.Float32BufferAttribute(EA, 4));
  const embers = new THREE.Points(eGeo, new THREE.ShaderMaterial({
    uniforms: { ...ctx.uniforms, uScreenH: screenH },
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: `attribute vec4 aEmber;
        uniform float uTime, uScreenH;
        varying float vOn, vCool;
        void main() {
          float t = uTime * ${speed}, ph = fract(t / aEmber.x + aEmber.y), s = aEmber.w * 6.2831;
          vec3 p = position + vec3(sin(t * 1.7 + s) * 0.5 * ph, ph * aEmber.z, cos(t * 1.3 + s) * 0.5 * ph);
          vOn = smoothstep(0.0, 0.08, ph) * (1.0 - smoothstep(0.55, 1.0, ph)) * step(0.5, fract(t * 7.0 + s));
          vCool = ph;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max(${glf(em.size)} * projectionMatrix[1][1] * 0.5 * uScreenH / max(-mv.z, 0.1), 1.5);
        }`,
    fragmentShader: `uniform float uFade, uReady;
        varying float vOn, vCool;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          float a = (1.0 - smoothstep(0.4, 1.0, r)) * (0.6 + 0.4 * vOn) * (1.0 - vCool * 0.5);
          gl_FragColor = vec4(mix(${glv(em.color)}, ${glv(opt.deep)}, vCool) * a * uFade * uReady, 0.0);
        }`,
  }));
  embers.frustumCulled = false;
  embers.renderOrder = 6;
  out.add(embers);
  const size = new THREE.Vector2();
  out.userData.update = () => { screenH.value = renderer.getDrawingBufferSize(size).y; };
  return out;
}

/**
 * Kachelbare Wellen fürs Wasser (waterSurface): RGB = Normale feiner Wellen (Summe von Sinuswellen mit ganzzahligen
 * Wellenzahlen, vorwiegend in einer Richtung), A = kachelbares Rauschen (Lücken der Brecher). Generator (yield je Zeile).
 */
function* createWaveTexture(size) {
  const rand = mulberry32(91);
  const waves = [];
  while (waves.length < 56) {
    const mag = 2 + 26 * rand() ** 2, ang = (rand() - 0.5) * 2.4;
    const kx = Math.round(Math.sin(ang) * mag), ky = Math.round(Math.cos(ang) * mag);
    if (kx || ky) waves.push([kx, ky, Math.hypot(kx, ky) ** -1.8, rand() * 2 * Math.PI]);
  }
  const n = size * size, sx = new Float32Array(n), sy = new Float32Array(n);
  // cos(a + b) = cos a cos b − sin a sin b: Sinus und Kosinus je Welle und Spalte bzw. Zeile vorab (statt 56 cos je Pixel)
  const W = waves.length, colC = new Float64Array(W * size), colS = new Float64Array(W * size);
  const rowC = new Float64Array(W * size), rowS = new Float64Array(W * size);
  const KX = waves.map((w) => w[0]), KY = waves.map((w) => w[1]), AMP = waves.map((w) => w[2]);
  waves.forEach(([kx, ky, , ph], w) => {
    for (let i = 0; i < size; i++) {
      const a = 2 * Math.PI * kx * i / size + ph, b = 2 * Math.PI * ky * i / size;
      colC[w * size + i] = Math.cos(a); colS[w * size + i] = Math.sin(a);
      rowC[w * size + i] = Math.cos(b); rowS[w * size + i] = Math.sin(b);
    }
  });
  let sum = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let ax = 0, ay = 0;
      for (let w = 0, i = 0; w < W; w++, i += size) {
        const c = AMP[w] * (colC[i + x] * rowC[i + y] - colS[i + x] * rowS[i + y]);
        ax += c * KX[w]; ay += c * KY[w];
      }
      sx[y * size + x] = ax; sy[y * size + x] = ay;
      sum += ax * ax + ay * ay;
    }
    yield;
  }
  const norm = 0.3 / Math.sqrt(sum / n); // mittlere Steigung
  // Rauschen auf kachelbaren Gittern (Perioden 4 … 32)
  const lattices = [4, 8, 16, 32].map((p) => ({ p, g: Float32Array.from({ length: p * p }, rand) }));
  const lat = ({ p, g }, u, v) => {
    const x = u * p, y = v * p, xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi, sxx = fx * fx * (3 - 2 * fx), syy = fy * fy * (3 - 2 * fy);
    const at = (i, j) => g[((j % p) + p) % p * p + ((i % p) + p) % p];
    return (at(xi, yi) * (1 - sxx) + at(xi + 1, yi) * sxx) * (1 - syy) + (at(xi, yi + 1) * (1 - sxx) + at(xi + 1, yi + 1) * sxx) * syy;
  };
  const data = new Uint8ClampedArray(n * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const gx = sx[i] * norm, gy = sy[i] * norm, len = Math.hypot(gx, gy, 1);
      data[i * 4] = (-gx / len * 0.5 + 0.5) * 255;
      data[i * 4 + 1] = (-gy / len * 0.5 + 0.5) * 255;
      data[i * 4 + 2] = (1 / len * 0.5 + 0.5) * 255;
      let f = 0;
      lattices.forEach((l, k) => { f += lat(l, x / size, y / size) * 0.5 ** (k + 1); });
      data[i * 4 + 3] = THREE.MathUtils.clamp((f / 0.9375 - 0.5) * 1.6 + 0.5, 0, 1) * 255;
    }
    yield;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  tex.needsUpdate = true;
  return tex;
}

/**
 * Schaum, kachelbar: R = Schwelle, wie lange ein Punkt Schaum bleibt – je weiter von den Mitten runder Löcher in drei
 * Grössen, desto länger. Wie viel Schaum zu sehen ist, entscheidet im Shader die Dichte: frisch ist alles weiss, dann
 * reisst er zu Zellen, dann zu Fäden auf und verschwindet (foamDissolve). So sehen Schaumfelder in der Brandung von oben
 * aus. Generator (yield je Zeile).
 */
function* createFoamTexture(size) {
  const rand = mulberry32(17);
  const cells = (n) => {
    const pts = Float32Array.from({ length: n * n * 2 }, rand);
    return (u, v) => { // Abstand zum nächsten Zellpunkt (Worley), kachelbar
      const x = u * n, y = v * n, xi = Math.floor(x), yi = Math.floor(y);
      let f1 = 9;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const cx = xi + di, cy = yi + dj, k = (((cy % n) + n) % n * n + ((cx % n) + n) % n) * 2;
          const d = (x - cx - pts[k]) ** 2 + (y - cy - pts[k + 1]) ** 2;
          if (d < f1) f1 = d;
        }
      }
      return Math.sqrt(f1);
    };
  };
  const big = cells(9), small = cells(22), tiny = cells(55);
  const lattice = (p) => { const g = Float32Array.from({ length: p * p }, rand); return (u, v) => {
    const x = u * p, y = v * p, xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const at = (i, j) => g[((j % p) + p) % p * p + ((i % p) + p) % p], sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return (at(xi, yi) * (1 - sx) + at(xi + 1, yi) * sx) * (1 - sy) + (at(xi, yi + 1) * (1 - sx) + at(xi + 1, yi + 1) * sx) * sy;
  }; };
  const thick = lattice(6), patch = lattice(14);
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      // Löcher: Je weiter ein Punkt von den (verwirbelten) Lochmitten in drei Grössen entfernt ist, desto länger bleibt
      // er Schaum – die Löcher gehen rund auf und wachsen, bis nur Fäden zwischen ihnen übrig sind
      const wu = u + 0.035 * (thick(u, v) - 0.5), wv = v + 0.035 * (thick(v + 0.37, u + 0.71) - 0.5);
      const holes = Math.min(big(wu, wv) / 0.62, 0.85 * small(wu, wv) / 0.62 + 0.25, 0.7 * tiny(u, v) / 0.62 + 0.45);
      const i = (y * size + x) * 4;
      data[i] = Math.max(0, Math.min(1, holes * (0.8 + 0.2 * patch(u, v)))) * 255;
      data[i + 3] = 255;
    }
    yield;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Gerechnete Textur merken (Generator): beim nächsten Aufbau eine Kopie mit denselben Daten, ohne nochmals zu rechnen
 * (Wellen und Schaum des Wassers: wer wieder zum Strand wechselt, spart rund 0,3 s). Die Kopie gibt release frei.
 */
const rememberedTextures = new Map();
function* rememberTexture(key, steps) {
  if (!rememberedTextures.has(key)) rememberedTextures.set(key, yield* steps);
  return rememberedTextures.get(key).clone(); // clone setzt needsUpdate (Texture.copy)
}

/** Karte aus einer Data-URL (Wasser): ohne Mipmaps, linear gefiltert */
function mapTexture(url, what) {
  const img = new Image(), tex = new THREE.Texture(img);
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  img.onload = () => { tex.needsUpdate = true; };
  img.onerror = () => console.warn(`Wasser: ${what} nicht lesbar`);
  img.src = url;
  return tex;
}

/**
 * Ersatz für den Grund, wo ihn das Panorama nicht zeigt (Brechung im Wasser, waterSurface). Sichtbar ist der Grund
 * unter einer Zelle der Wasserkarte, wenn die Tiefe des Panoramas in seiner Richtung bis zur Wasserfläche darüber
 * reicht (Blender hat sie in der Tiefe; wo das Spiel sie zeichnet, ist sie durchsichtig). Hinter Fels sähe der
 * Mittelpunkt den Fels – im Wasser stünde ein Schatten des Felsens –, dort gilt die nächste Zelle mit sichtbarem Grund
 * (um eine Zelle Abstand vom Schatten, damit die lineare Filterung nicht hineinreicht); im Loch des Geländes unter dem
 * Brett (ohne Treffer zeigt das Panorama den Himmel) der Rand rundum. water: { image (Karte), ext, range, level, calm
 * (ruhig: verdeckt auch, was laut Karte als Fels an der Wasserfläche steht) },
 * depth: { image, log }. Ergebnis RGBA, Zeile 0 bei z = +ext (wie die Karte als Textur, ohne Kippen): R 128 − Radius
 * des Rands im Loch / 0,1 m (sonst 128), G/B 128 + Versatz in x/z zur Ersatzstelle / 0,25 m. Generator für sliced.
 */
function* groundShift(water, depth, center) {
  const { ext, range: [d0, d1], level, calm = false } = water, n = water.image.width;
  const px = imagePixels(water.image);
  yield;
  const depthPx = imagePixels(depth.image);
  yield;
  const la = Math.log(depth.log[0]), lb = Math.log(depth.log[1]), dw = depth.image.width, dh = depth.image.height;
  // Abstand der Szene vom Mittelpunkt in Richtung (x, y, z) (Spiel), bilinear im Log wie im Shader; null ohne Treffer
  const dist = (x, y, z) => {
    const l = Math.hypot(x, y, z), bx = x / l, by = -z / l, bz = y / l;
    const u = (0.5 + Math.atan2(bx, by) / (2 * Math.PI)) * dw - 0.5;
    const v = (Math.acos(Math.max(-1, Math.min(1, bz))) / Math.PI) * dh - 0.5;
    const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
    let sum = 0;
    const corners = [[0, 0, (1 - fu) * (1 - fv)], [1, 0, fu * (1 - fv)], [0, 1, (1 - fu) * fv], [1, 1, fu * fv]];
    for (const [di, dj, wt] of corners) {
      const k = 4 * (Math.min(dh - 1, Math.max(0, j + dj)) * dw + ((((i + di) % dw) + dw) % dw));
      const code = depthPx[k] * 256 + depthPx[k + 1];
      if (code === 65535) return null;
      sum += wt * (la + (code / 65535) * (lb - la));
    }
    return Math.exp(sum);
  };
  // je Zelle: 0 sichtbar, 1 verdeckt, 2 im Loch, 3 Land (ohne Wasser, Grund egal)
  const LAND = 3, kind = new Uint8Array(n * n), rim = new Float32Array(n * n), cell = (2 * ext) / n;
  const CALM_TALL = 1.2; // ruhig: so hoch ragt Eis oder Fels im Wasser höchstens heraus (m; Schollen bis gut 1 m)
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const i = row * n + col, d = d0 + ((d1 - d0) * (px[4 * i] * 256 + px[4 * i + 1])) / 65535;
      if (d <= 0) { kind[i] = LAND; continue; }
      const x = (col + 0.5) * cell - ext - center.x, z = (row + 0.5) * cell - ext - center.z, y = level - d - center.y;
      // Grund um t vom Mittelpunkt weg gerückt: 0 sichtbar, 1 verdeckt, 2 im Loch
      const r = Math.hypot(x, z) || 1;
      const seen = (t) => {
        const qx = x * (1 + t / r), qz = z * (1 + t / r), pd = dist(qx, y, qz);
        if (pd === null) return 2;
        const ds = (Math.hypot(qx, y, qz) * (center.y - level)) / -y; // bis zur Wasserfläche auf dem Strahl
        if (pd < ds - 0.05 - 0.004 * ds) return 1;
        if (calm) {
          // Ruhig: Steht auf dem letzten Stück des Strahls vor der Wasserfläche (dort tiefer als CALM_TALL über ihr) Eis
          // oder Fels (B der Karte, eine Zelle Rand)? Dann verdeckt es den Grund. Die grobe Tiefe fasst die dünnen
          // Ränder der Schollen nicht: Sie standen sonst als Geisterbilder im Wasser, gestreckt und weiter hinten
          const f = (level - center.y) / y, hx = qx * f, hz = qz * f, hr = Math.hypot(hx, hz) || 1;
          const back = Math.min(hr, (CALM_TALL * hr) / (center.y - level));
          for (let u = 0; u <= back; u += cell) { // ganze Zellen genügen: jede Probe prüft 3 × 3
            const k = 1 - u / hr;
            const sc = Math.floor((hx * k + center.x + ext) / cell), sr = Math.floor((hz * k + center.z + ext) / cell);
            for (let a = Math.max(0, sr - 1); a <= Math.min(n - 1, sr + 1); a++) {
              for (let b = Math.max(0, sc - 1); b <= Math.min(n - 1, sc + 1); b++) {
                if (px[4 * (a * n + b) + 2] > 76) return 1;
              }
            }
          }
        }
        return 0;
      };
      kind[i] = seen(0);
      if (kind[i] !== 2) continue;
      let t = 0;
      while (t < 12 && seen(t) === 2) t += 0.25;
      rim[i] = r + t + 0.5; // etwas weiter: Die Farben haben am Rand des Lochs noch vom Himmel
      if (col % 8 === 7) yield; // eine Zeile im Loch dauerte allein über 10 ms (Ticket 09)
    }
    yield;
  }
  // Schatten um eine Zelle erweitern; Loch: der grösste Rand der Nachbarn
  const seed = new Int32Array(n * n).fill(-1), rimOut = new Float32Array(n * n);
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const i = row * n + col;
      let near = false;
      for (let a = Math.max(0, row - 1); a <= Math.min(n - 1, row + 1); a++) {
        for (let b = Math.max(0, col - 1); b <= Math.min(n - 1, col + 1); b++) {
          const j = a * n + b;
          if (kind[j] === 1) near = true;
          rimOut[i] = Math.max(rimOut[i], rim[j]);
        }
      }
      if (kind[i] === 0 && !near) seed[i] = i;
    }
    yield;
  }
  // nächste sichtbare Zelle: je ein Durchgang vorwärts und rückwärts über das Gitter, jede Zelle übernimmt von den
  // schon besuchten Nachbarn die nächste (Abstand nach Euklid)
  const take = (i, row, col, dr, dc) => {
    const r2 = row + dr, c2 = col + dc;
    if (r2 < 0 || r2 >= n || c2 < 0 || c2 >= n) return;
    const s = seed[r2 * n + c2], own = seed[i];
    if (s < 0) return;
    const d2 = (o) => (((o / n) | 0) - row) ** 2 + ((o % n) - col) ** 2;
    if (own < 0 || d2(s) < d2(own)) seed[i] = s;
  };
  const FORWARD = [[-1, -1], [-1, 0], [-1, 1], [0, -1]], BACK = [[1, 1], [1, 0], [1, -1], [0, 1]];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) for (const [dr, dc] of FORWARD) take(row * n + col, row, col, dr, dc);
    yield;
  }
  for (let row = n - 1; row >= 0; row--) {
    for (let col = n - 1; col >= 0; col--) for (const [dr, dc] of BACK) take(row * n + col, row, col, dr, dc);
    yield;
  }
  const out = new Uint8Array(n * n * 4), enc = (v, step) => Math.max(0, Math.min(255, Math.round(128 + v / step)));
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const i = row * n + col, k = 4 * ((n - 1 - row) * n + col), s = seed[i];
      out[k] = enc(-rimOut[i], 0.1);
      out[k + 1] = s < 0 || kind[i] === LAND ? 128 : enc(((s % n) - col) * cell, 0.25);
      out[k + 2] = s < 0 || kind[i] === LAND ? 128 : enc((((s / n) | 0) - row) * cell, 0.25);
      out[k + 3] = 255;
    }
    yield;
  }
  return { data: out, n };
}

/**
 * Gitter fürs Wasser in der Ebene y = 0: n × n Felder über ±half, darum Ringe (das Quadrat vergrössert, je um 12 %) bis
 * far. Die Ringe brauchen keine feinen Felder: Weit draussen rechnet der Shader den Ort aus dem Strahl. Generator
 * (sliced: yield je Zeile bzw. Ring; in einem Stück hielt es ein Bild auf dem gedrosselten Handy 58 ms an, Ticket 09
 * der Leistung), gleich in die fertigen Felder geschrieben.
 */
function* waterGeometry(half, n, far) {
  // Rand des Gitters gegen den Uhrzeigersinn (von oben), dann je Ring dieselben Punkte weiter draussen
  const rim = [];
  for (let j = 0; j < n; j++) rim.push([j, 0]);
  for (let i = 0; i < n; i++) rim.push([n, i]);
  for (let j = n; j > 0; j--) rim.push([j, n]);
  for (let i = n; i > 0; i--) rim.push([0, i]);
  const m = rim.length, first = (n + 1) * (n + 1);
  let k = 0;
  for (let scale = 1; scale < far / half; k++, scale *= 1.12);
  const count = first + k * m;
  const pos = new Float32Array(count * 3);
  const index = new (count - 1 >= 65535 ? Uint32Array : Uint16Array)(6 * n * n + 6 * m * Math.max(0, k - 1));
  let p = 0, x = 0;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) { pos[p++] = -half + (2 * half * j) / n; pos[p++] = 0; pos[p++] = -half + (2 * half * i) / n; }
    yield;
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const a = i * (n + 1) + j, b = a + 1, c = a + n + 1, d = c + 1;
      index[x++] = a; index[x++] = c; index[x++] = b; index[x++] = b; index[x++] = c; index[x++] = d;
    }
    yield;
  }
  for (let r = 0, scale = 1; r < k; r++, scale *= 1.12) {
    for (const [j, i] of rim) { pos[p++] = (-half + (2 * half * j) / n) * scale; pos[p++] = 0; pos[p++] = (-half + (2 * half * i) / n) * scale; }
    yield;
  }
  for (let r = 0; r + 1 < k; r++) {
    for (let q = 0; q < m; q++) {
      const a = first + r * m + q, b = first + r * m + ((q + 1) % m), c = a + m, d = b + m;
      index[x++] = a; index[x++] = b; index[x++] = c; index[x++] = b; index[x++] = d; index[x++] = c;
    }
    yield;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  return geo;
}

/** RGBA-Daten n × n als Karte fürs Wasser (linear, ohne Mipmaps) */
function groundTexture(data, n) {
  const tex = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Wassermaske des Panoramas (Zeile 0 am Horizont, Zeilen wie im Equirect: 360° / Breite je Zeile; so weit unter den
 * Horizont, wie sie hoch ist, siehe MASK_DEG in tools/blender/wald_export.py): linear, ohne Mipmaps, rundum
 */
function maskTexture(img) {
  const tex = new THREE.Texture(img);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.flipY = false;
  tex.needsUpdate = true;
  return tex;
}

/** Pixel (RGBA) eines geladenen Bilds */
function imagePixels(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width; canvas.height = img.height;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  return g.getImageData(0, 0, img.width, img.height).data;
}

// Bis wohin das Spielwasser reicht: Ringe ums Gitter der Karte bis WATER_FAR (m), zum Horizont hin blendet es nach der
// Richtung, in der das Netz des Panoramas liegt, zwischen WATER_HORIZON[0] und [1] Grad unter dem Horizont ins gemalte
// Meer (dort ist es nur noch Dunst)
const WATER_FAR = 6000, WATER_HORIZON = [-1.2, -0.3];
// m: so weit liegt das Spielwasser höchstens vor der Kamera (weiter Entferntes rückt auf dem Strahl her); das Netz
// des Panoramas schreibt dahinter höchstens bis WATER_CAP + 4, die Himmelskugel liegt bei 136
const WATER_CAP = camera.far - 16;

/**
 * Wasser ums Brett, wie es sich bewegt. Daten aus Blender: map – R/G Wassertiefe mit 16 Bit (an Land negativ: Höhe des
 * Sands), B Fels –, shore – R/G Abstand zur Wasserlinie mit 16 Bit (> 0 an Land), B nahe Felsgruppe (zeichnet das
 * Spiel, bakedMesh) –, Zeile 0 am hinteren Rand bei z = −extent; dazu size, extent, level, die Bereiche depthRange und
 * shoreRange und fade: wo Blender seine Wasserfläche einblendet. Bis fade[1] malt Blender nur den Grund (mit der Farbe
 * des Wassers nach Tiefe); diese Ebene deckt das Meer bis kurz vor den Horizont (WATER_FAR, WATER_HORIZON) – sonst lag
 * zwischen Spielwasser und Himmel ein Streifen gemaltes Meer, das nicht dazu passte (erst Grund, dann flaches Wasser).
 * Die Oberfläche kommt von ihr: Dünung, die parallel zum Ufer heranläuft, im Flachen steiler wird und als Walze bricht
 * – Schaum, der zu Zellen und Fäden zerfällt, nicht jede Welle überall –, das Auflaufen den Strand hinauf und zurück,
 * nasser glänzender Sand, Spülmarken, Gischt an den Felsen, Glitzern zur Sonne. Brechung und Spiegelung lesen das
 * Panorama: den Grund unter der Stelle, von den Wellen verschoben, und in Richtung des gespiegelten Strahls Himmel und
 * Insel (wie vom Mittelpunkt aus gesehen). Wellenphysik wie im früheren gerechneten Strand (2.25). wave: Wellenlänge,
 * Kreisfrequenz; sun, foam, sediment, lip, crest: Farben (Szenenwerte; crest: Licht im Kamm der Dünung, die noch nicht
 * bricht). calm (Eishöhle): ruhiges Wasser – keine Dünung, keine Brandung, kein Schaum, kein Auflaufen, kein Spülsaum;
 * nur Kräuselwellen, um ripple (0 … 1) schwächer, und die Spiegelung (am Ufer endet es, wo der Grund auftaucht). Das Gitter folgt, wo das Wasser aufläuft, der Höhe des Sands, und liegt für den Tiefentest etwas zur Kamera
 * hin (lift). Ob es verdeckt ist, entscheidet das Netz des Panoramas Pixel für Pixel nach dem, was es zeigt
 * (ctx.pano.depthRule): Zeigt es Wasser oder etwas hinter dem Wasser, liegt seine Tiefe hinter der Wasserfläche – das
 * geglättete Netz reichte um Felsen herum vor das Wasser, von der Seite gesehen endete das Wasser so weit vor dem Fels
 * –, zeigt es Fels vor dem Wasser, liegt sie davor (nicht bei den nahen Felsgruppen): Das Wasser endet am gemalten Rand
 * des Felsens, aus jedem Blickwinkel. Die Brechung nimmt den Grund, wo das Panorama ihn nicht zeigt, von daneben
 * (groundShift). Was unter der Oberfläche schwimmt (ctx.under.scene, etwa fishSchools), zeichnet es vorher in ein
 * eigenes Bild und legt es über den Grund, von den Wellen verschoben wie dieser; Spiegelung, Schaum und Glitzern liegen
 * darüber. Generator (sliced: Wellen und Schaum rechnen).
 */
function* waterSurface(ctx, opt) {
  const w = ctx.data[opt.data];
  const waves = yield* rememberTexture('waves', createWaveTexture(256));
  const foam = yield* rememberTexture('foam', createFoamTexture(512));
  const ext = w.extent;
  // Tiefenregel für das Netz (unten) braucht gl_FragDepth; ohne sie (WebGL1 ohne EXT_frag_depth) wie vor 2.36: Schnitt
  // am Fels vom Mittelpunkt aus, Blende bis fade[1]
  const cut = renderer.capabilities.isWebGL2 || renderer.extensions.has('EXT_frag_depth');
  const geo = yield* waterGeometry(ext, Math.round(2 * ext), cut ? WATER_FAR : ext);
  // Abstand der Szene vom Mittelpunkt in Richtung d, aus der Tiefe des Panoramas (log, bilinear; ohne Treffer fern);
  // im Wasser und in der Tiefenregel des Netzes
  const depthGLSL = (sampler) => `
        const vec2 DEPTH_SIZE = ${glv(ctx.pano.depth.size)}, DEPTH_LOG = ${glv(ctx.pano.depth.log.map(Math.log))};
        float logDepth(vec2 ij) {
          vec4 t = LOD0(${sampler}, (ij + 0.5) / DEPTH_SIZE);
          float c = (t.r * 65280.0 + t.g * 255.0) / 65535.0;
          return c > 0.99999 ? DEPTH_LOG.y : mix(DEPTH_LOG.x, DEPTH_LOG.y, c);
        }
        float panoDist(vec3 d) {
          vec3 b = normalize(vec3(d.x, -d.z, d.y));
          vec2 uv = vec2(0.5 + atan(b.x, b.y) / 6.2831853, 1.0 - acos(clamp(b.z, -1.0, 1.0)) / 3.1415927) * DEPTH_SIZE - 0.5;
          vec2 i = floor(uv), f = uv - i;
          return exp(mix(mix(logDepth(i), logDepth(i + vec2(1.0, 0.0)), f.x), mix(logDepth(i + vec2(0.0, 1.0)), logDepth(i + 1.0), f.x), f.y));
        }`;
  const under = { scene: new THREE.Scene(), target: null };
  ctx.under = under;
  ctx.offscreen.push(under.scene);
  const decl = `
        uniform sampler2D uMap, uShore;
        const float EXT = ${glf(ext)}, LEVEL = ${glf(w.level)}, ROCK_LIFT = 1.0;
        const vec2 DEPTH = ${glv(w.depthRange)}, SHORE = ${glv(w.shoreRange)};
        vec2 mapUV(vec2 p) { return vec2((p.x + EXT) / (2.0 * EXT), 1.0 - (p.y + EXT) / (2.0 * EXT)); }
        float bits16(vec2 hl) { return (hl.x * 65280.0 + hl.y * 255.0) / 65535.0; }
        // Tiefe (an Land negativ) und Abstand zur Wasserlinie (> 0 an Land) an p (Spiel x, z)
        vec2 at(vec2 p) {
          vec2 uv = mapUV(p);
          return vec2(mix(DEPTH.x, DEPTH.y, bits16(texture2D(uMap, uv).rg)), mix(SHORE.x, SHORE.y, bits16(texture2D(uShore, uv).rg)));
        }`;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...ctx.uniforms,
      uMap: { value: mapTexture(w.map, 'Karte') }, uShore: { value: mapTexture(w.shore, 'Abstand zum Ufer') },
      uWaves: { value: waves }, uFoam: { value: foam },
      uPano: { value: ctx.pano.full }, uCenter: { value: ctx.pano.center }, uDepth: { value: ctx.pano.depth.tex },
      uUnder: { value: null }, uUnderOn: { value: 0 }, uUnderView: { value: new THREE.Matrix4() },
      uGround: { value: groundTexture(new Uint8Array([128, 128, 128, 255]), 1) }, // bis groundShift gerechnet ist
    },
    defines: { ...(cut ? { CUT: '' } : {}), ...(opt.calm ? { CALM: '' } : {}) },
    extensions: { derivatives: true, shaderTextureLOD: true },
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: `${decl}
        varying vec3 vPos, vRay;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vec2 m = at(wp.xz);
          float rock = texture2D(uMap, mapUV(wp.xz)).b;
          // an Land auf dem Sand (dort läuft das Wasser auf), am Fels auf Höhe des Wassers: Was er verdeckt,
          // entscheiden die Felsen des Spiels und das Netz des Panoramas (ohne dessen Tiefenregel liegt es weiter
          // vorn). Jenseits der Karte offenes Wasser (ihr Rand gilt dort nicht, wie im Fragment)
          float outside = smoothstep(EXT - 12.0, EXT - 1.0, max(abs(wp.x), abs(wp.z)));
          wp.y = LEVEL + max(-m.x, 0.0) * (1.0 - rock) * (1.0 - outside);
          #ifdef CALM
            wp.y = LEVEL; // ruhiges Wasser läuft nicht auf
          #endif
          float lift = ${glf(opt.lift)};
          #ifndef CUT
            lift += ROCK_LIFT * rock;
          #endif
          vPos = wp.xyz;
          // auf dem Strahl zur Kamera hin; was weiter weg liegt, höchstens so weit wie WATER_CAP (vor camera.far und
          // der Himmelskugel, im Bild an derselben Stelle)
          vec3 toCam = cameraPosition - wp.xyz;
          float dc = length(toCam);
          float t = min(max(dc - lift, 0.0), ${glf(WATER_CAP)});
          vRay = cameraPosition - toCam / dc * t;
          gl_Position = projectionMatrix * viewMatrix * vec4(vRay, 1.0);
        }`,
    fragmentShader: `${decl}
        #if __VERSION__ >= 300
          #define LOD(t, p, l) textureLod(t, p, l)
        #elif defined(GL_EXT_shader_texture_lod)
          #define LOD(t, p, l) texture2DLodEXT(t, p, l)
        #else
          #define LOD(t, p, l) texture2D(t, p)
        #endif
        #define LOD0(t, p) LOD(t, p, 0.0)
        uniform sampler2D uWaves, uFoam, uPano, uDepth, uUnder, uGround;
        uniform vec3 uCenter;
        uniform float uTime, uFade, uReady, uUnderOn;
        uniform mat4 uUnderView;
        varying vec3 vPos, vRay;
        ${GLSL_NOISE}
        // noise(vec3(q, 0.0)): bei z = 0 wiegt die zweite Lage 0, also nur die erste (gleiches Ergebnis, halb so viel)
        float noiseFlat(vec2 q) {
          vec3 i = vec3(floor(q), 0.0);
          vec2 f = fract(q);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y);
        }
        ${ctx.lightGLSL}
        const float CELL = ${glf(2 * ext / w.size)};
        const vec2 FADE = ${glv(w.fade)};
        const float SKY_R = ${glf(PANO.dMax)};
        const vec2 HORIZON = ${glv(WATER_HORIZON.map((a) => Math.sin(THREE.MathUtils.degToRad(a))))};
        const float SWELL_K = ${glf(2 * Math.PI / opt.wave[0])}, SWELL_W = ${glf(opt.wave[1])};
        const vec3 SUN_COL = ${glv(opt.sun)}, FOAM = ${glv(opt.foam)}, SEDIMENT = ${glv(opt.sediment)}, LIP = ${glv(opt.lip)};
        const vec3 CREST = ${glv(opt.crest)};
        #ifdef CALM
          const float WIND = ${glf(opt.ripple ?? 1)}; // ruhiges Wasser: Kräuselwellen so viel schwächer
        #else
          const float WIND = 1.0;
        #endif
        // Panorama in Richtung d (Spiel), wie vom Mittelpunkt gesehen; Mipmap-Stufe lod von Hand (Ableitungen gelten in
        // den verzweigten Teilen nicht), sonst die Grundstufe (die Karte ist hier fein genug)
        const float PANO_TEXEL = 0.0015; // Winkel eines Pixels im ganzen Bild (π / 2048 Zeilen)
        vec3 panoLod(vec3 d, float lod) {
          vec3 b = normalize(vec3(d.x, -d.z, d.y));
          return LOD(uPano, vec2(0.5 + atan(b.x, b.y) / 6.2831853, 1.0 - acos(clamp(b.z, -1.0, 1.0)) / 3.1415927), lod).rgb;
        }
        vec3 pano(vec3 d) { return panoLod(d, 0.0); }
        #ifdef CALM
          // Grund an der Ersatzstelle q + s (Versatz s in m), mit deren Tiefe statt der eigenen
          vec3 groundAt(vec3 rel, vec2 q, vec2 s) {
            return pano(vec3(rel.x + s.x, rel.y + at(q).x - at(q + s).x, rel.z + s.y));
          }
        #endif
        // Grund an q, wie ihn das Panorama zeigt; sieht der Mittelpunkt ihn nicht, eine Stelle daneben (groundShift):
        // die nächste, deren Grund er sieht, im Loch unter dem Brett der Rand rundum, zur eigenen Richtung gewichtet
        vec3 ground(vec3 q) {
          vec4 g = texture2D(uGround, mapUV(q.xz)) * 255.0 - 128.0;
          vec3 rel = q - uCenter;
          if (g.r > -0.5) {
            #ifdef CALM
              // ruhig: die Farben der vier Nachbarzellen mischen, jede an ihrer Ersatzstelle mit deren Tiefe. Gemischte
              // Versätze zweier Ersatzstellen zeigten zwischen ihnen wieder den Rand einer Scholle (Geisterbilder)
              float gn = 2.0 * EXT / CELL;
              vec2 t = mapUV(q.xz) * gn - 0.5, t0 = floor(t), fr = t - t0;
              vec2 s0 = (texture2D(uGround, (t0 + vec2(0.5, 0.5)) / gn).gb * 255.0 - 128.0) * 0.25;
              vec2 s1 = (texture2D(uGround, (t0 + vec2(1.5, 0.5)) / gn).gb * 255.0 - 128.0) * 0.25;
              vec2 s2 = (texture2D(uGround, (t0 + vec2(0.5, 1.5)) / gn).gb * 255.0 - 128.0) * 0.25;
              vec2 s3 = (texture2D(uGround, (t0 + vec2(1.5, 1.5)) / gn).gb * 255.0 - 128.0) * 0.25;
              // alle gleich (im offenen Wasser fast immer 0): eine Abfrage, bei 0 genau wie ohne Ersatz
              if (length(s1 - s0) + length(s2 - s0) + length(s3 - s0) < 0.01) {
                return dot(s0, s0) < 1e-6 ? pano(rel) : groundAt(rel, q.xz, s0);
              }
              return mix(mix(groundAt(rel, q.xz, s0), groundAt(rel, q.xz, s1), fr.x),
                         mix(groundAt(rel, q.xz, s2), groundAt(rel, q.xz, s3), fr.x), fr.y);
            #else
              return pano(rel + vec3(g.g, 0.0, g.b) * 0.25);
            #endif
          }
          // sechs Richtungen ab der eigenen; je näher am Rand, desto mehr zählt die eigene (am Rand die Probe von dort)
          float len = length(rel.xz), rim = max(-g.r * 0.1, len + 0.01), sum = 0.0;
          float a0 = len > 1e-4 ? atan(rel.z, rel.x) : 0.0, sharp = 30.0 * pow(len / rim, 4.0);
          vec3 col = vec3(0.0);
          for (int i = 0; i < 6; i++) {
            float an = a0 + float(i) * 1.0472;
            float wt = pow(0.501 + 0.5 * cos(float(i) * 1.0472), sharp);
            col += pano(vec3(cos(an) * rim, rel.y, sin(an) * rim)) * wt;
            sum += wt;
          }
          return col / sum;
        }
        ${depthGLSL('uDepth')}
        // Schaum mit Dichte dens an p: dicht ganz weiss, dann reisst er zu Zellen, dann zu Fäden auf und verschwindet.
        // In Strömungsrichtung dir gestreckt und mit dem Wasser um drift verschoben.
        float foamDissolve(vec2 p, float dens, vec2 dir, float drift) {
          vec2 q = vec2(dot(p, vec2(-dir.y, dir.x)), dot(p, dir) * 0.45 - drift);
          float t = texture2D(uFoam, q * 0.2).r * 0.7 + texture2D(uFoam, q * 0.53 + 0.37).r * 0.3;
          return smoothstep(1.0 - dens, 1.15 - dens, t);
        }
        float wrapPhase(float ph) { return mod(ph + 3.14159, 6.28319) - 3.14159; }
        // Wellengruppen: mal höhere, mal niedrigere Wellen, entlang der Küste versetzt
        float swellSetAt(vec2 p, float t) { return 0.75 + 0.25 * sin(t * 0.19 + p.x * 0.05) * sin(t * 0.083 + p.x * 0.031 + 1.7); }
        // ... für Welle Nummer m, als sie die Wasserlinie erreichte (off: Versatz der Phase hier)
        float waveEnv(vec2 p, float m, float off) { return swellSetAt(p, (m * 6.28319 + off * SWELL_K) / SWELL_W); }
        // Profil einer gebrochenen Welle (Walze): Kamm bei 0, vorn (landwärts, x > 0) steil abfallend, hinten flach
        float bore(float x, float sharp) { return x > 0.0 ? exp(-x * sharp) : (x + 3.14159) * (x + 3.14159) * 0.10132; }
        // Höhe der Dünung über dem Meeresspiegel an Phase x; d: Wassertiefe (an Land negativ), env: Wellengruppe. Im
        // Flachen wird die Welle höher und steiler, bricht und läuft als Walze ans Ufer – nie höher, als das Wasser tief
        // ist. brk: ob diese Welle hier bricht – wo nicht, bleibt sie rund (ausser um das Tal: sonst spränge die Höhe)
        float swellHeight(float x, float d, float env, float sharp, float brk) {
          float b = smoothstep(1.8, 0.9, d) * mix(1.0, brk, smoothstep(3.0, 2.2, abs(x)));
          float shape = mix(cos(x), bore(x, sharp) - 0.19, b);
          return min(${glf(opt.height)} * env * (1.0 + 0.9 * smoothstep(5.0, 1.2, d)), 0.4 * max(d, 0.0) + 0.03) * shape;
        }
        // Auflaufen: Hat die Walze die Wasserlinie erreicht, schiesst sie als dünner Film den Strand hinauf, wird
        // langsamer und bleibt stehen, dann fliesst sie beschleunigt zurück (Umkehr nach etwa 40 % des Zyklus).
        // u: Zeit seit dem Eintreffen der Walze (Anteil der Periode); reach: Höhe, die diese Welle erreicht
        const float SWASH_UP = 0.24, SWASH_DOWN = 0.4, SWASH_LOW = -0.1;
        float swashLevel(float u, float reach) {
          float r = reach - SWASH_LOW;
          if (u < SWASH_UP) { float t = 1.0 - u / SWASH_UP; return SWASH_LOW + r * (1.0 - t * t); }
          float t = min((u - SWASH_UP) / SWASH_DOWN, 1.0);
          return reach - r * t * t;
        }
        float swashLeaves(float a, float reach) { return SWASH_UP + SWASH_DOWN * sqrt(clamp((reach - a) / (reach - SWASH_LOW), 0.0, 1.0)); }
        float swashHash(float n, float i) { return fract(sin(mod(n, 256.0) * 12.9898 + i * 78.233) * 43758.5453); }
        // Höhe, die Welle Nummer n erreicht: von Welle zu Welle und entlang des Strands verschieden, mit Zungen
        float swashReach(float n, float along) {
          float a = along / 7.0, i = floor(a), f = smoothstep(0.0, 1.0, fract(a));
          float b = along / 2.3, j = floor(b), g = smoothstep(0.0, 1.0, fract(b));
          return ${glf(opt.reach)} * (0.15 + 0.2 * mix(swashHash(n, i), swashHash(n, i + 1.0), f) + 0.05 * (mix(swashHash(n + 0.5, j), swashHash(n + 0.5, j + 1.0), g) - 0.5));
        }
        // Nicht jede Welle bricht überall: Lücken entlang der Front, von Welle zu Welle anders; nahe am Ufer jede
        float breakGaps(float ph, float d, float along) {
          float waveNo = floor((ph - wrapPhase(ph)) / 6.28319 + 0.5);
          return mix(smoothstep(0.32, 0.5, texture2D(uWaves, vec2(along * 0.012, waveNo * 0.137)).a), 1.0, smoothstep(1.0, 0.6, d));
        }
        float swashShare(float d) { return smoothstep(0.7, 0.05, d); }
        // Normale der Wasserfläche: Dünung (Gefälle aus swellHeight, Richtung dir) und kurze Wellen – zwei Züge
        // analytisch, drei Lagen aus der Normal-Map; im dünnen Wasser am Strand glatt. var: Streuung der Steigungen, die
        // das Bild nicht mehr auflöst (Länge der gemittelten Normalen in den Mipmaps): In der Ferne wird das Glitzern so
        // zu einem Schimmer, statt zu flimmern.
        // low: nur die langen Wellen (Dünung, Wellenzüge ab 4,5 m) – damit verschiebt das Wasser, was darunter schwimmt.
        // Mit den Kräuselwellen änderte sich der Versatz auf Zentimetern um bis über 0,1 m: Die Fische zerrissen.
        // fp: wie gross ein Pixel auf der Wasserfläche ist (m). Wellen, die er nicht mehr auflöst, fallen weg (die aus
        // der Normal-Map mitteln die Mipmaps): In der Ferne liefen sie sonst als Moiré schnell quer über das Wasser,
        // und im flachen Blick spiegelt schon eine kleine Neigung einen ganz anderen Teil des Himmels.
        float resolved(float k, float fp) { return 1.0 - smoothstep(0.4, 0.8, fp * k / 3.14159); }
        vec3 waterNormal(vec2 p, float dist, float fp, float x, vec2 dir, float d, float env, float sharp, float brk, out float var, out vec2 low) {
          vec2 d2 = vec2(-0.34, -0.94), d3 = vec2(0.53, -0.848);
          float deep = smoothstep(0.0, 0.8, d); // im Flachen glatt
          vec2 s = dir * SWELL_K * (swellHeight(x + 0.03, d, env, sharp, brk) - swellHeight(x - 0.03, d, env, sharp, brk)) / 0.06 * (1.0 - swashShare(d)) * resolved(SWELL_K, fp);
          #ifdef CALM
            s = vec2(0.0); // keine Dünung
          #endif
          float wind = deep * WIND;
          s += d2 * 0.05 * wind * sin(dot(p, d2) * 0.95 - uTime * 1.05 + 1.3) * resolved(0.95, fp);
          s += d3 * 0.035 * wind * sin(dot(p, d3) * 1.4 - uTime * 1.25 + 4.1) * resolved(1.4, fp);
          vec2 d4 = vec2(0.81, -0.59); // Windsee schräg zur Dünung, länger
          s += d4 * 0.07 * wind * sin(dot(p, d4) * 0.52 - uTime * 0.83 + 0.7) * (0.6 + 0.4 * sin(dot(p, vec2(0.6, 0.8)) * 0.07 + uTime * 0.05)) * resolved(0.52, fp);
          low = -s;
          const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);
          vec3 a = texture2D(uWaves, p * 0.09 + vec2(0.004, -0.013) * uTime).rgb * 2.0 - 1.0;
          vec3 b = texture2D(uWaves, (ROT * p) * 0.27 + vec2(-0.011, -0.02) * uTime).rgb * 2.0 - 1.0;
          vec3 c = texture2D(uWaves, p * 0.83 + vec2(0.031, -0.027) * uTime).rgb * 2.0 - 1.0;
          float ripple = (0.25 + 0.75 * deep) * WIND;
          s -= a.xy / max(a.z, 0.3) * 0.3 * ripple;
          s -= (b.xy / max(b.z, 0.3)) * ROT * 0.32 * ripple;
          s -= c.xy / max(c.z, 0.3) * 0.22 * ripple;
          var = 0.004 + (0.1 * max(1.0 - length(a), 0.0) + 0.1 * max(1.0 - length(b), 0.0) + 0.06 * max(1.0 - length(c), 0.0)) * ripple + dist * 0.00004;
          // in der Ferne ruhiger: Im flachen Blick wechselte jede Neigung zwischen Spiegelung und Grund (Streifen)
          return normalize(vec3(-s.x, 1.0, -s.y) * vec3(1.0 - 0.6 * smoothstep(60.0, 300.0, dist), 1.0, 1.0 - 0.6 * smoothstep(60.0, 300.0, dist)));
        }
        // Spiegelung der Sonne auf einer rauen Fläche (Beckmann-Verteilung mit Streuung var der Steigungen)
        float sunGlint(vec3 N, vec3 V, float var) {
          vec3 H = normalize(SKY_LIGHT + V);
          float nh = max(dot(N, H), 0.05), nh2 = nh * nh;
          float D = exp(-(1.0 - nh2) / (nh2 * 2.0 * var)) / (6.2832 * var * nh2 * nh2);
          float F = 0.02 + 0.98 * pow(1.0 - max(dot(V, H), 0.0), 5.0);
          return min(D * F / (4.0 * max(dot(N, V), 0.15)) * 0.05, 12.0);
        }
        void main() {
          vec3 pos = vPos;
          #ifdef CUT
            // Ort auf der Wasserfläche aus dem Strahl (weit draussen liegen die Ecken auf ihm näher, und die Felder
            // sind gross); an Land, wo das Gitter dem Sand folgt, wie gezeichnet
            vec3 ray = normalize(vRay - cameraPosition);
            if (vPos.y < LEVEL + 0.001 && ray.y < -1e-5) pos = cameraPosition + ray * ((cameraPosition.y - LEVEL) / -ray.y);
          #endif
          vec2 p = pos.xz;
          // vor jedem discard: Ableitungen über das ganze Pixelquadrat
          float fp = max(length(dFdx(p)), length(dFdy(p)));
          #ifdef CUT
            if (ray.y > -1e-5) discard;
          #endif
          // zum Rand der Karte hin offenes Wasser (ihr Rand gilt draussen nicht; Land verdeckt dort das Netz des
          // Panoramas), weich, damit man keine Kante sieht
          float open = smoothstep(EXT - 12.0, EXT - 1.0, max(abs(p.x), abs(p.y)));
          vec2 m = mix(at(p), vec2(4.0, SHORE.x), open);
          float bedD = m.x, shore = m.y;
          float rock = texture2D(uMap, mapUV(p)).b * (1.0 - open);
          #ifdef CUT
            // Zum Horizont hin ins gemalte Meer, nach der Richtung, in der das Netz des Panoramas auf diesem Strahl
            // liegt (von einer hohen Kamera aus liegt sein Horizont tiefer als der wahre)
            vec3 oc = cameraPosition - uCenter;
            float rb = dot(oc, ray), skyT = -rb + sqrt(max(rb * rb - dot(oc, oc) + SKY_R * SKY_R, 0.0));
            float k = uFade * uReady * (1.0 - smoothstep(HORIZON.x, HORIZON.y, (oc.y + ray.y * skyT) / SKY_R));
            // Land über dem Auflaufen. Fels am Wasser (die Karte mit 0,75 m zählt ihn grob) bleibt Wasser: Wo er es
            // verdeckt, entscheidet das Netz des Panoramas, bis an seinen gemalten Rand.
            if ((bedD < -0.7 && (rock < 0.7 || shore > 2.0)) || k <= 0.0) discard;
          #else
            float k = uFade * uReady * (1.0 - smoothstep(FADE.x, FADE.y, length(p)));
            if (bedD < -0.7 || k <= 0.0) discard;
          #endif
          // Am Fels: Fürs Wasser selbst ist der Grund dort tief genug, dass es nicht aufläuft. Wo er es verdeckt,
          // entscheidet das Netz des Panoramas (CUT), sonst die Tiefe in Richtung des Mittelpunkts: Sieht er vor dieser
          // Stelle schon Fels, liegt sie in ihm oder dahinter – dort kein Wasser.
          float seen = 1.0, bed0 = bedD, hug = 0.0, near = 0.0;
          if (rock > 0.01) {
            vec3 rel = pos - uCenter;
            float rk = smoothstep(0.0, 0.25, rock);
            #ifndef CUT
              float dc = length(rel);
              seen = 1.0 - smoothstep(0.02 + 0.002 * dc, 0.08 + 0.006 * dc, dc - panoDist(rel)) * rk;
              if (seen <= 0.0) discard;
            #endif
            // dicht vor dem Fels (von der Kamera aus): 0,6 m weiter hinten wäre schon Fels – dort der Schaum am Fuss.
            // Fels im Panorama nach seiner Tiefe. Die nahen Felsgruppen (B der zweiten Karte) zeichnet das Spiel, dort
            // nach der Karte, nur am Rand: Sie zählt um die Blöcke einen Ring mit (sonst ein breites weisses Band)
            // ruhig (CALM): kein Schaum am Fels
            #ifndef CALM
            vec2 away = normalize(pos.xz - cameraPosition.xz) * 0.6;
            vec3 rel2 = rel + vec3(away.x, 0.0, away.y);
            near = texture2D(uShore, mapUV(p)).b;
            float edge = smoothstep(0.85, 1.0, texture2D(uMap, mapUV(p + away)).b) * (1.0 - smoothstep(0.85, 1.0, rock));
            hug = mix(smoothstep(0.0, 0.6, length(rel2) - panoDist(rel2)), edge, near) * rk;
            #endif
            bedD = mix(bedD, max(bedD, 0.25), smoothstep(0.3, 0.7, rock));
          }
          vec3 toCam = cameraPosition - pos;
          float dist = length(toCam);
          vec3 V = toCam / dist;
          // aufs Ufer zu: Gefälle des Abstands, nach vorn genommen (zwei Abfragen statt vier: fürs Handy)
          #ifdef CALM
            vec2 dir = vec2(0.0, 1.0); // ohne Wellen gleich (spart vier Abfragen)
          #else
          vec2 dir = normalize(vec2(at(p + vec2(CELL, 0.0)).y - shore, at(p + vec2(0.0, CELL)).y - shore) + vec2(1e-6));
          #endif
          // Wellen: Fronten parallel zum Ufer, entlang des Ufers leicht versetzt (wob), in Gruppen höher und niedriger
          float wob = (noiseFlat(p * 0.045) - 0.5) * 6.0;
          // Wellengruppen; zum Rand der Karte hin ohne Dünung (draussen gälte überall derselbe Abstand zum Ufer),
          // rundum gleich weit
          float env = swellSetAt(p, uTime) * (1.0 - smoothstep(EXT * 0.55, EXT * 0.95, length(p)));
          float sharp = mix(7.0, 3.0, smoothstep(15.0, 50.0, dist)); // Front der Walze in der Ferne weicher
          float along = p.x;
          // Was nur im Flachen wirkt, nur dort rechnen (Ticket 11, Handy): Ab 1,8 m Tiefe bricht keine Welle (jede
          // Verwendung von brk ist mit smoothstep(1.8, 0.9, Tiefe) = 0 gewichtet), ab 0,7 m läuft nichts auf (share = 0,
          // das Wasser ist dort mindestens 0,39 m dick, der Sand nie frei). Das Bild bleibt genau gleich.
          #ifdef CALM
            // ruhiges Wasser: keine Dünung, kein Auflaufen; es reicht genau bis an die Wasserlinie
            float ph = 0.0, x = 0.0, brk = 1.0, u = 0.0, n = 0.0;
            float share = 0.0, reach = 0.0, reachPrev = 0.0, swash = 0.0;
            float thick = bedD;
            if (thick <= 0.0) discard; // Grund über dem Wasser: das zeigt das Panorama (vor Normale und Wellen)
          #else
          float ph = (shore + wob) * SWELL_K - uTime * SWELL_W, x = wrapPhase(ph), brk = bedD < 1.8 ? breakGaps(ph, bedD, along) : 1.0;
          float cyc = (uTime * SWELL_W - wob * SWELL_K) / 6.28319; // so viele Walzen haben die Wasserlinie erreicht
          float u = fract(cyc), n = floor(cyc);
          float share = swashShare(bedD), reach = 0.0, reachPrev = 0.0, swash = 0.0;
          if (bedD < 0.7) {
            reach = swashReach(n, along) * waveEnv(p, n, wob);
            reachPrev = swashReach(n - 1.0, along) * waveEnv(p, n - 1.0, wob);
            swash = swashLevel(u, reach);
          }
          float thick = mix(swellHeight(x, bedD, env, sharp, brk), swash, share) + bedD; // Wasser über dem Grund
          #endif
          float var;
          vec2 lowN; // Neigung der langen Wellen (wie N.xz, ohne Kräuselwellen)
          vec3 N = waterNormal(p, dist, fp, x, dir, bedD, env, sharp, brk, var, lowN);
          float fn = texture2D(uWaves, p * vec2(0.35, 0.5) + vec2(0.0, uTime * 0.03)).a;
          vec3 rgb;
          float a;
          if (thick <= 0.0) {
            // Sand frei: Wie lange ist es her, dass das Wasser hier abgeflossen ist? Frisch glänzt der Film, dann
            // versickert er. Am höchsten Punkt jeder Welle bleibt ein Schaumsaum liegen und zerfällt; ältere Spülmarken
            // als dünne dunkle Linien, bis eine höhere Welle sie wegspült.
            float h = -bedD, since = 9.0, residue = 0.0, marks = 0.0;
            if (h > -0.3 && h < 0.6) {
              if (h < reach && u > swashLeaves(h, reach)) since = u - swashLeaves(h, reach);
              else if (h < reachPrev) since = u + 1.0 - swashLeaves(h, reachPrev);
              residue = smoothstep(0.03, 0.0, abs(h - reach)) * step(SWASH_UP, u) * exp(-(u - SWASH_UP) * 2.5)
                + smoothstep(0.03, 0.0, abs(h - reachPrev)) * exp(-(u + 1.0 - SWASH_UP) * 2.5);
              float later = u < SWASH_UP ? swashLevel(u, reach) : -1.0;
              for (int i = 0; i <= 5; i++) {
                float mi = n - float(i), rk = swashReach(mi, along) * waveEnv(p, mi, wob);
                float wt = (1.0 - (float(i) + u) * 0.16) * (i == 0 ? smoothstep(SWASH_UP, SWASH_UP + 0.05, u) : 1.0);
                if (rk > later) marks = max(marks, smoothstep(0.012, 0.0, abs(h - rk)) * wt);
                later = max(later, rk);
              }
            }
            float shine = exp(-since * 4.0) * (1.0 - rock);
            vec3 Nf = normalize(mix(N, vec3(0.0, 1.0, 0.0), 0.8));
            float F = 0.02 + 0.98 * pow(1.0 - max(dot(Nf, V), 0.0), 5.0);
            vec3 R = reflect(-V, Nf);
            float foam = foamDissolve(p, residue * 0.7, dir, 0.0) * 0.85 * (1.0 - rock);
            // vormultipliziert: nasser Sand dunkler (a), der Film spiegelt Himmel und Sonne (dazu), Schaum deckt
            a = clamp(0.12 * shine + 0.12 * marks * (1.0 - rock) + foam, 0.0, 1.0);
            rgb = (pano(vec3(R.x, abs(R.y), R.z)) * max(F, 0.1) + SUN_COL * sunGlint(Nf, V, 0.005)) * shine + FOAM * foam;
            if (a < 0.004 && dot(rgb, rgb) < 1e-5) discard;
          } else {
            // Grund durch die Oberfläche: im Panorama an der Stelle unter dem Wasser, von den Wellen verschoben
            float depth = thick;
            vec2 off = N.xz * min(depth, 1.5) * 0.2;
            #ifdef CALM
              off *= 0.25; // ruhig: sonst Schlieren an Eis und Steinen knapp unter Wasser
            #endif
            vec3 below = ground(vec3(p.x + off.x, LEVEL - bedD, p.y + off.y));
            // was darin schwimmt (Bild der Szene unter der Oberfläche, vormultipliziert), von den langen Wellen verschoben
            // wie der Grund in gut 1 m Tiefe: Die Fische schwanken, bleiben aber ganz
            if (uUnderOn > 0.5) {
              vec4 c = uUnderView * vec4(pos + vec3(lowN.x, 0.0, lowN.y) * 0.25, 1.0);
              vec4 f = LOD0(uUnder, c.xy / c.w * 0.5 + 0.5);
              below = below * (1.0 - f.a) + f.rgb;
            }
            // Auflauffilm über dem Sand: dünn und klar – der Sand darunter nur etwas dunkler und kühler (nass); ein
            // deckendes, dunkles Band wirkte wie Schlamm
            below *= mix(vec3(1.0), vec3(0.9, 0.91, 0.95), share);
            float rising = max(1.0 - smoothstep(SWASH_UP * 0.7, SWASH_UP * 1.3, u), smoothstep(0.9, 1.0, u));
            float back = (1.0 - rising) * share * smoothstep(0.3, 0.0, bedD); // Rückstrom: Film fliesst den Strand hinab
            // Trübung: In der Brandung wirbeln die Walzen Sand auf – milchig, gleich hinter einer Walze am stärksten
            float breaking = smoothstep(1.8, 0.9, bedD) * mix(1.0, brk, smoothstep(3.0, 2.2, abs(x)));
            float stirred = smoothstep(2.4, 0.6, bedD) * (0.4 + 0.6 * exp(min(x, 0.0) * 0.6) * smoothstep(0.15, 0.0, x) * smoothstep(-3.14, -2.4, x));
            #ifdef CALM
              breaking = 0.0; stirred = 0.0; // keine Brandung, nichts aufgewirbelt
            #endif
            below = mix(below, SEDIMENT, stirred * 0.5 * (1.0 - exp(-depth * 1.5)) * (1.0 - 0.7 * share));
            float F = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
            vec3 R = reflect(-V, N);
            // unscharf, so weit die Wellen innerhalb des Pixels streuen (was die Mipmaps der Normal-Map wegmitteln: var
            // ohne Grundwert): Fern spiegelt das Wasser den gemittelten Himmel, statt Pixel für Pixel zwischen den
            // Farben am Horizont zu springen – das flimmerte und lief als Streifen quer über das Wasser (höchstens
            // Stufe 6, gut 6°; die Probe bleibt so weit über dem Horizont, sonst mischte der Boden darunter mit)
            float lod = min(log2(1.0 + sqrt(max(var - 0.004 - dist * 0.00004, 0.0)) / PANO_TEXEL), 6.0);
            vec3 refl = panoLod(vec3(R.x, max(abs(R.y), exp2(lod) * PANO_TEXEL * 0.5), R.z), lod);
            vec3 col = mix(below, refl, max(F, 0.1 * share)) + SUN_COL * sunGlint(N, V, var); // der Film glänzt
            // Rückstrom: Das Wasser läuft beschleunigt hangab und sammelt sich in flachen Rinnen – helle und dunkle
            // Streifen in Fliessrichtung, die mit ihm seewärts gleiten
            float down = max(u - SWASH_UP, 0.0);
            vec2 rq = vec2(dot(p, vec2(-dir.y, dir.x)), dot(p, dir) + down * down * 6.0);
            float thin = smoothstep(0.12, 0.01, depth);   // im dünnen Film deutlicher
            if (back * thin > 0.0) { // sonst ändert es nichts (Ticket 11: Texturzugriffe nur, wo sie wirken)
              float rill = texture2D(uWaves, rq * vec2(1.3, 0.38)).a * 0.6 + texture2D(uWaves, rq * vec2(3.1, 0.9) + 0.4).a * 0.4;
              col *= 1.0 - 0.08 * back * thin * smoothstep(0.5, 0.72, rill);
              col += refl * 0.08 * back * thin * smoothstep(0.55, 0.78, 1.0 - rill);
            }
            // Vor der brechenden Front ihre steile, beschattete Seite: ein dunkler Streifen; die dünne Lippe leuchtet
            // türkis im Gegenlicht (draussen ebenso die Kämme)
            col *= 1.0 - 0.25 * breaking * smoothstep(0.0, 0.06, x) * smoothstep(0.4, 0.12, x) * (1.0 - share);
            float face = breaking * smoothstep(0.8, 0.0, x) * smoothstep(-0.15, 0.0, x);
            col += LIP * face * env * (1.0 - share) * smoothstep(0.0, 0.3, depth);
            // Dünung, die noch nicht bricht: Der Kamm leuchtet, wo das Licht durch seine dünne Spitze fällt, das Tal
            // davor liegt etwas dunkler – so sieht man von oben die Wellen heranrollen
            float swell = (1.0 - breaking) * (1.0 - share) * smoothstep(0.5, 1.6, bedD) * env;
            #ifdef CALM
              swell = 0.0;
            #endif
            col *= 1.0 - 0.12 * swell * smoothstep(0.1, 0.9, -cos(x));
            col += CREST * swell * smoothstep(0.45, 1.0, cos(x)) * smoothstep(-0.2, 0.6, sin(x + 0.6));
            // Schaum: an der brechenden Front ein schmaler, dichter Kern, dahinter ein Feld aus Zellen und Fäden, das
            // seewärts ausdünnt; in der Brandungszone ein Rest. Auf dem Auflauffilm Schaum, solange er hinaufläuft,
            // vorn eine helle Kante; Gischt an den Felsen.
            float xf = x + (fn - 0.5) * 0.3;
            float core = smoothstep(0.08, -0.02, xf) * smoothstep(-0.75, -0.15, xf);
            float field = exp(min(xf, 0.0) * 0.65) * smoothstep(0.12, 0.04, xf) * smoothstep(-3.14, -2.3, xf) * 0.62;
            float dens = (breaking * max(core * 1.15 * (1.0 - 0.5 * rock), field) + 0.17 * smoothstep(2.2, 0.8, bedD)) * (1.0 - share);
            dens *= 1.0 - 0.55 * smoothstep(0.3, 0.8, rock); // über flachem Fels kein Teppich
            #ifdef CALM
              dens = 0.0; // kein Schaum
            #endif
            // auf dem Film: hinauf eine Schaumrolle vorn; hinab zerrissene Schaumreste, in Fliessrichtung gezogen
            dens = max(dens, share * (0.1 + 0.6 * rising * smoothstep(0.12, 0.01, depth)) + back * 0.22 * smoothstep(0.2, 0.03, depth));
            // ohne Dichte kein Schaum (foamDissolve ist dann 0)
            float foam = dens > 0.0 ? foamDissolve(p, dens, dir, share * swash * 8.0 + uTime * 0.05 - back * down * 2.0) : 0.0;
            foam = max(foam, smoothstep(0.03, 0.004, depth) * share * rising * (0.6 + 0.4 * fn)); // helle Kante nur hinauf
            // an den Felsen: Brandung im Takt der Wellen – kommt eine an, schäumt es am Fels auf, dann zerfällt der
            // Schaum zu Fäden und läuft ab; dicht am Fels (flach) immer etwas Schaum
            float surge = smoothstep(-0.5, 0.6, cos(x + 0.4)) * env, d0 = depth - bedD + bed0;
            // am Fuss ein Saum, mal breiter, mal unterbrochen; kommt eine Welle an, schäumt es auf
            // (nur am Fels: ohne ihn sind hug und lace 0)
            float gaps = hug > 0.0 ? texture2D(uFoam, p * 0.11 + vec2(uTime * 0.012, 0.0)).r : 0.0;
            float lace = max(hug * mix(smoothstep(0.25, 0.7, gaps), 1.0, surge), 0.5 * surge * smoothstep(0.4, 0.9, rock) * smoothstep(0.9, 0.2, d0) * (1.0 - 0.75 * near));
            #ifdef CALM
              lace = 0.0; // kein Schaum an Schollen und Eis im Wasser
            #endif
            if (lace > 0.0) foam = max(foam, lace * foamDissolve(p * 1.3, 0.12 + 0.35 * hug + 0.35 * surge * (0.4 + hug), dir, uTime * 0.06 - surge * 0.4));
            col = mix(col, FOAM * (0.86 + 0.16 * fn), clamp(foam, 0.0, 1.0) * mix(0.75, 0.95, smoothstep(0.4, 0.9, dens)));
            // Rand des Films: hinauf eine klare Kante, hinab versickert das Wasser fleckig (die Stellen, wo der Sand
            // schon frei liegt, wandern nicht als Linie zurück)
            float seep = back > 0.0 ? back * 0.03 * texture2D(uFoam, p * 0.35).r : 0.0;
            a = smoothstep(0.0, 0.012 + 0.02 * back, depth - seep) * seen;
            rgb = col * a;
          }
          gl_FragColor = vec4(rgb * k, a * k);
        }`,
  });
  // Tiefe des Netzes nach dem, was es zeigt (siehe oben): T ist der Punkt, den das Panorama in dieser Richtung zeigt, P
  // die Wasserfläche auf dem Strahl der Kamera. Wasser, Loch (ohne Treffer) oder etwas hinter P: hinter P; Fels vor P:
  // vor das höchste Wasser (Auflaufen bis 0,75 m, dazu lift); sonst (Sand: dort läuft das Wasser auf) wie es liegt.
  if (cut) {
    // so viele Grad unter dem Horizont deckt die Wassermaske ab (siehe maskTexture)
    const mask = ctx.pano.waterMask?.image, maskDeg = mask ? (mask.height * 360) / mask.width : 90;
    ctx.pano.depthRule = {
      uniforms: {
        uCutDepth: { value: ctx.pano.depth.tex }, uCutMap: { value: material.uniforms.uMap.value },
        uCutShore: { value: material.uniforms.uShore.value }, uCutMask: { value: ctx.pano.waterMask },
      },
      glsl: `${ctx.pano.waterMask ? '\n        #define CUT_MASK' : ''}
        uniform sampler2D uCutDepth, uCutMap, uCutShore, uCutMask;
        uniform mat4 projectionMatrix;
        const float CUT_LEVEL = ${glf(w.level)}, CUT_EXT = ${glf(ext)};
        const float CUT_FAR = ${glf(WATER_CAP + 4)}, CUT_NEAR = ${glf(camera.near + 0.05)};
        #define LOD0(t, p) texture2D(t, p) // ohne Mipmaps
        ${depthGLSL('uCutDepth')}
        float cutAt(vec3 w) {
          vec4 q = projectionMatrix * (viewMatrix * vec4(w, 1.0)); // zwei Matrix-Vektor-Produkte statt Matrix mal Matrix je Pixel
          return clamp(q.z / q.w * 0.5 + 0.5, 0.0, 1.0);
        }
        float skyDepth(vec3 world) {
          vec3 d = normalize(world - uCenter), ray = normalize(world - cameraPosition);
          if (d.y > 0.0 || ray.y > -0.001) return gl_FragCoord.z; // Himmel; Strahl ohne Wasserfläche
          float tP = (cameraPosition.y - CUT_LEVEL) / -ray.y;
          #define CUT_BEHIND max(gl_FragCoord.z, cutAt(cameraPosition + ray * min(tP + 0.5, CUT_FAR))) // hinter P
          // Wasser: nach der Maske, so fein wie das Bild (die Tiefe ist gröber: um ferne Palmen blieb ein Saum ohne
          // Spielwasser), sonst nach der Tiefe. Etwas hinter dem Wasser: nur nah (Felsen, die das geglättete Netz vor
          // das Wasser zieht); weiter weg gälte es auch, wo das Netz Fernes nur tiefer zeigt (Inseln, Küste von oben).
          // Zeigt die Maske Wasser, steht das Ergebnis ohne die Tiefe des Panoramas fest (Ticket 11: das Wasser deckt am
          // Strand den grössten Teil des Bilds; das Lesen der Tiefe ist dort das Teuerste)
          bool masked = false, water = false;
          #ifdef CUT_MASK
            float below = degrees(asin(clamp(-d.y, -1.0, 1.0))) / ${glf(maskDeg)};
            if (below < 1.0) {
              masked = true;
              water = texture2D(uCutMask, vec2(0.5 + atan(d.x, -d.z) / (2.0 * PI), below)).r > 0.5;
              if (water) return CUT_BEHIND;
            }
          #endif
          float dT = panoDist(d);
          vec3 T = uCenter + d * dT;
          if (!masked) water = T.y < CUT_LEVEL + 0.03;
          if (water || (dT < 60.0 && length(T - cameraPosition) > tP + 0.3)) return CUT_BEHIND;
          // Fels, den das Panorama zeigt (nicht die nahen Felsgruppen: Die zeichnet das Spiel, das Panorama zeigt dort
          // flachen Boden, der sie sonst verdeckte)
          vec2 uv = vec2((T.x + CUT_EXT) / (2.0 * CUT_EXT), 1.0 - (T.z + CUT_EXT) / (2.0 * CUT_EXT));
          if (texture2D(uCutMap, uv).b > 0.3 && texture2D(uCutShore, uv).b < 0.5) {
            float tH = (cameraPosition.y - CUT_LEVEL - 0.75) / -ray.y;
            return min(gl_FragCoord.z, cutAt(cameraPosition + ray * max(tH - 1.6, CUT_NEAR)));
          }
          return gl_FragCoord.z;
        }`,
    };
  }
  // Ersatz für verdeckten Grund, in Häppchen, sobald die Skybox eingeblendet ist (bis dahin liest die Brechung das
  // Panorama überall direkt); bricht ab, wenn sie inzwischen freigegeben ist
  ctx.later.push(async (alive) => {
    try {
      await ruhe.warte(); // wie der übrige Aufbau nur an ruhigen Stellen, auch das Dekodieren (nicht in Fahrten)
      const image = await loadSkyImage(w.map);
      const water = { ext, range: w.depthRange, level: w.level, image, calm: !!opt.calm };
      const steps = groundShift(water, ctx.pano.depth, ctx.pano.center);
      const done = await sliced((function* () {
        for (let s = steps.next(); alive(); s = steps.next()) { if (s.done) return s.value; yield; }
        return null;
      })(), true, 'Wasser: Grund');
      if (!done || !alive()) return;
      const old = material.uniforms.uGround.value;
      material.uniforms.uGround.value = groundTexture(done.data, done.n);
      old.dispose();
    } catch (e) { console.warn(`Wasser: Ersatz für den Grund nicht gerechnet (${e.message})`); }
  });
  const plane = new THREE.Mesh(geo, material);
  plane.frustumCulled = false;
  plane.renderOrder = 4;
  // Kurz bevor das Wasser gezeichnet wird: die Szene unter der Oberfläche in ein eigenes Bild, so gross wie das, in das
  // gerade gezeichnet wird, auch auf dem Handy: Halb so gross deckte dort ein Texel 2,75 × 2,75 Bildschirmpixel, die
  // schmalen Fische bekamen Treppen und die Schwanzlinien zerfielen in Punkte (Spec .scratch/leistung/, Ticket 14).
  // Im Bild des Spiels schon vor der Szene (SCENE_PREPASSES, Ticket 11): Mitten in der Szene das Ziel zu wechseln hiess
  // auf Kachel-GPUs (Handy), das halb gezeichnete Szenenbild samt Tiefe in den Speicher zu schreiben und danach wieder
  // zu laden. Sonst (Aufwärmen, Übersetzen) wie bisher in onBeforeRender.
  const clearColor = new THREE.Color(), size = new THREE.Vector2();
  let ready = null; // Kamera, für die das Bild unter der Oberfläche in diesem Bild schon steht (Vorlauf)
  const drawUnder = (r, cam, into) => {
    const on = under.scene.children.some((o) => o.visible);
    material.uniforms.uUnderOn.value = on ? 1 : 0;
    // Aufwärmen (skyWarmDraw, 1 × 1): das Ziel gleich so gross und mit so vielen Proben wie im Spiel anlegen, auch wenn
    // gerade nichts darunter schwimmt. Sonst legte es das erste Bild an, in dem der Strand einblendet; das hielt die
    // Grafikkarte dort 50–80 ms an (Ticket 05)
    if (!on && !into?.prismaWarm) return;
    if (into?.prismaWarm) into = composer.readBuffer;
    if (into) size.set(into.width, into.height); else r.getDrawingBufferSize(size);
    size.max(new THREE.Vector2(1, 1));
    if (!under.target) {
      under.target = new THREE.WebGLRenderTarget(size.x, size.y, {
        type: HDR_TYPE, samples: r.capabilities.isWebGL2 && !IS_MOBILE ? (into?.samples ?? 0) : 0,
      });
    } else if (under.target.width !== size.x || under.target.height !== size.y) under.target.setSize(size.x, size.y);
    const before = r.getRenderTarget();
    r.getClearColor(clearColor);
    const clearAlpha = r.getClearAlpha();
    r.setRenderTarget(under.target);
    r.setClearColor(0x000000, 0);
    // clear() löscht nur, was gerade beschrieben werden darf; zuletzt war oft ein Material ohne depthWrite dran (auch
    // das Wasser selbst). Blieb die Tiefe der Fische vom vorigen Bild stehen, schnitt sie die bewegten Fische ab.
    r.state.buffers.depth.setMask(true);
    r.state.buffers.color.setMask(true);
    r.clear();
    r.render(under.scene, cam);
    discardDepth(r, under.target); // die Tiefe der Fische braucht danach niemand
    r.setRenderTarget(before);
    r.setClearColor(clearColor, clearAlpha);
    material.uniforms.uUnder.value = under.target.texture;
    material.uniforms.uUnderView.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  };
  const prepass = (r, cam, into, root) => {
    ready = null;
    let o = plane;
    for (; o.parent; o = o.parent) if (!o.visible) return; // wird nicht gezeichnet
    if (o !== root || !o.visible) return;
    drawUnder(r, cam, into);
    ready = cam;
  };
  SCENE_PREPASSES.add(prepass);
  plane.onBeforeRender = (r, scene, cam) => {
    if (ready === cam) ready = null; // schon im Vorlauf gezeichnet
    else drawUnder(r, cam, r.getRenderTarget());
  };
  plane.userData.dispose = () => { SCENE_PREPASSES.delete(prepass); under.target?.dispose(); };
  return plane;
}

/**
 * Fischkörper (Länge 1 entlang +x, Kopf bei 0, Schwanzwurzel bei 1, dann die gegabelte Schwanzflosse bis 1.3; seitlich
 * flach): aUV = (Lage entlang 0 … 1.3, Höhe −1 … 1, Seite −1 … 1). Höhe und Breite gibt die Instanz.
 */
function createFishGeometry() {
  const along = 10, around = 8, pos = [], uv = [], idx = [];
  const prof = (u) => Math.sin(Math.PI * (0.06 + 0.94 * u)) ** 0.75 * (1 - 0.55 * u * u); // Umriss von der Seite
  for (let i = 0; i <= along; i++) {
    const u = i / along, h = 0.5 * prof(u), w = 0.22 * prof(u) * (1 - 0.4 * u);
    for (let j = 0; j < around; j++) {
      const a = (j / around) * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
      pos.push(u, h * s, w * c);
      uv.push(u, s, c);
    }
  }
  for (let i = 0; i < along; i++) {
    for (let j = 0; j < around; j++) {
      const a = i * around + j, b = i * around + (j + 1) % around;
      idx.push(a, a + around, b, b, a + around, b + around);
    }
  }
  // Schwanzflosse (gegabelt) und Rückenflosse: flache Dreiecke, beidseitig
  const fin = (pts, uvs) => { const o = pos.length / 3; pts.forEach((p, k) => { pos.push(...p); uv.push(...uvs[k]); }); idx.push(o, o + 1, o + 2); };
  fin([[0.97, 0, 0], [1.3, 0.36, 0], [1.18, 0, 0]], [[1.0, 0, 0], [1.3, 1, 0], [1.2, 0, 0]]);
  fin([[0.97, 0, 0], [1.18, 0, 0], [1.3, -0.36, 0]], [[1.0, 0, 0], [1.2, 0, 0], [1.3, -1, 0]]);
  fin([[0.3, 0.38, 0], [0.62, 0.52, 0], [0.82, 0.3, 0]], [[0.3, 1.1, 0], [0.62, 1.3, 0], [0.82, 1.1, 0]]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Wo Fische schwimmen dürfen, als Abstandsfeld (m): positiv im offenen Wasser – mindestens minDepth tief, kein Fels –
 * mit dem Abstand zur nächsten Stelle, die das nicht ist, dort negativ. Karte: Tiefe und Fels je Zelle (Zeile 0 bei
 * z = −extent). Abstand nach Chamfer (Schritte 1 und √2 in zwei Durchläufen, auf etwa 8 % genau); sdf und depth lesen
 * bilinear an (x, z) (Spiel). Ohne three.js (tools/blender/out/arbeit/fischtest.mjs prüft es in Node). steps: statt
 * des Felds ein Generator für sliced (yield je Zeile; in einem Stück hielt es ein Bild auf dem gedrosselten Handy 70 ms
 * an, Ticket 09 der Leistung), dasselbe Ergebnis.
 */
function fishField(depth, rock, size, extent, minDepth, steps = false) {
  const cell = (2 * extent) / size, n = size * size;
  const dist = function* (inside) {
    const d = new Float32Array(n);
    for (let i = 0; i < n; i++) d[i] = inside(i) ? 1e9 : 0;
    const relax = (i, j, w) => { if (d[j] + w < d[i]) d[i] = d[j] + w; };
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        if (x > 0) relax(i, i - 1, 1);
        if (y > 0) { relax(i, i - size, 1); if (x > 0) relax(i, i - size - 1, Math.SQRT2); if (x < size - 1) relax(i, i - size + 1, Math.SQRT2); }
      }
      yield;
    }
    for (let y = size - 1; y >= 0; y--) {
      for (let x = size - 1; x >= 0; x--) {
        const i = y * size + x;
        if (x < size - 1) relax(i, i + 1, 1);
        if (y < size - 1) { relax(i, i + size, 1); if (x < size - 1) relax(i, i + size + 1, Math.SQRT2); if (x > 0) relax(i, i + size - 1, Math.SQRT2); }
      }
      yield;
    }
    return d;
  };
  const open = (i) => depth[i] >= minDepth && rock[i] < 0.01;
  const build = function* () {
    const toShallow = yield* dist(open), toOpen = yield* dist((i) => !open(i));
    const sdf = new Float32Array(n);
    for (let i = 0; i < n; i++) sdf[i] = (open(i) ? toShallow[i] - 0.5 : 0.5 - toOpen[i]) * cell;
    const bilinear = (f, x, z) => {
      const u = Math.min(Math.max((x + extent) / cell - 0.5, 0), size - 1.001), v = Math.min(Math.max((z + extent) / cell - 0.5, 0), size - 1.001);
      const i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j, k = j * size + i;
      return (f[k] * (1 - a) + f[k + 1] * a) * (1 - b) + (f[k + size] * (1 - a) + f[k + size + 1] * a) * b;
    };
    return { sdf: (x, z) => bilinear(sdf, x, z), depth: (x, z) => bilinear(depth, x, z) };
  };
  const g = build();
  if (steps) return g;
  for (;;) { const { done, value } = g.next(); if (done) return value; }
}

/**
 * Schwarmverhalten (ohne three.js). Jeder Schwarm hat einen unsichtbaren Leitfisch, der um das Brett patrouilliert –
 * Fische sammeln sich an Bauten im Wasser –, je Schwarm in eigenem Abstand zur Kante (meist nahe), mal näher, mal
 * weiter, mit leichtem Schlängeln. Vor flachem Wasser, Fels, Brett und dem Rand der Reichweite weicht er mit Fühlern aus
 * (voraus, schräg links und rechts; die Seite bleibt, bis es frei ist); stösst er an, kehrt die Patrouille um. Andere
 * Schwärme meidet er. Die Fische folgen ihm auf eigenen Plätzen im Schwarm, die langsam wandern, halten Abstand
 * voneinander und schwimmen immer in Blickrichtung: Die Drehrate ändert sich stetig (sprang sie, zitterten die Fische),
 * der Körper biegt sich in der Kurve, das Tempo folgt mit begrenzter Beschleunigung. Der Schwanzschlag folgt dem Tempo
 * (schneller = häufiger), die Stärke dem Schub; die Tiefe folgt sanft der gewünschten, nie näher als 0,4 m am Grund.
 * Nie ins Flache: Wer doch zu nahe kommt, wird zurückgeschoben.
 * opt: seed, area (Mitte x, z, Halbachsen: Reichweite), keepOut (halbe Kante des Bretts samt Abstand), schools (count,
 * length, speed, depth). setField(fishField) – vorher steht alles still (advance gibt null). advance(t) rechnet in
 * festen Schritten bis t und gibt den Anteil des nächsten Schritts; neu begonnen (erstes Bild, Zeit zurück) wird WARM s
 * vor t, das erste Bild hängt so nur von t ab (Vergleichsbilder mit angehaltener Zeit, ?t=); warm(t) nimmt das beim
 * Aufbau vorweg. Nach einer Lücke über CATCH s geht es vom letzten Stand weiter.
 * sample(k, alpha, out): Fisch k,
 * zwischen den letzten zwei Schritten gemischt – x, z, Richtung (Winkel, von +x nach +z), Tempo, Tiefe unter der
 * Oberfläche, Biegung (Krümmung × Länge), Phase und Stärke des Schwanzschlags, Neigung, Drehrate.
 */
function createFishSim(opt) {
  // WARM: Vorlauf nach einem Neubeginn (s). Vorher wurde ab Sekunde 0 nachgerechnet – bis zu 3600 Schritte in einem
  // Bild, ein Ruck beim Wählen des Hintergrunds; 5 s sind 150 Schritte, die Schwärme sind dann schon unterwegs (warm:
  // beim Aufbau in Häppchen). CATCH: so viel wird nach einer Pause höchstens in einem Bild nachgerechnet (s)
  const H = 1 / 30, TAU = Math.PI * 2, F = 10, WARM = 5, CATCH = 0.25;
  const [cx, cz, rx, rz] = opt.area, B = opt.keepOut;
  const wrap = (a) => a - TAU * Math.floor((a + Math.PI) / TAU);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  let field = null;
  // Abstand zur Kante des Bretts (Quadrat mit halber Kante B), zum Rand der Reichweite (Ellipse, genähert), zu allem
  const board = (x, z) => {
    const dx = Math.abs(x) - B, dz = Math.abs(z) - B;
    return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0);
  };
  const reach = (x, z) => (1 - Math.hypot((x - cx) / rx, (z - cz) / rz)) * Math.min(rx, rz);
  const clear = (x, z) => Math.min(field.sdf(x, z), board(x, z), reach(x, z));
  const grad = (f, x, z) => {
    const e = 0.4, gx = f(x + e, z) - f(x - e, z), gz = f(x, z + e) - f(x, z - e), l = Math.hypot(gx, gz) || 1;
    return [gx / l, gz / l];
  };

  // Schwärme und Fische (fest): Plätze im Schwarm (vorn, seitlich, Tiefe; × Radius), wie die Plätze wandern
  const rand0 = mulberry32(opt.seed);
  const schools = opt.schools.map((s, k) => ({
    s, cruise: s.speed, radius: 0.5 + 0.55 * s.length * Math.sqrt(s.count),
    wander: [0.13 + 0.12 * rand0(), 0.37 + 0.25 * rand0(), rand0() * TAU, rand0() * TAU, 0.05 + 0.06 * rand0(), rand0() * TAU],
    pref: 0.6 + 6 * ((k + rand0()) / opt.schools.length) ** 1.6,
  }));
  const fish = [];
  schools.forEach((sc, k) => {
    for (let i = 0; i < sc.s.count; i++) {
      const a = rand0() * TAU, r = Math.sqrt(rand0());
      fish.push({
        school: k, len: sc.s.length * (0.85 + 0.3 * rand0()),
        slot: [Math.cos(a) * r * 1.2 - 0.35, Math.sin(a) * r * 0.85, (rand0() - 0.5) * 0.4],
        drift: [rand0() * TAU, rand0() * TAU, 0.11 + 0.1 * rand0(), 0.07 + 0.08 * rand0()],
      });
    }
  });
  const N = fish.length;
  let cur = new Float64Array(N * F), prev = new Float64Array(N * F), simT = null;
  const lead = schools.map(() => ({ x: 0, z: 0, a: 0, w: 0, v: 0, dir: 1, avoid: 0, against: 0 }));

  // Neubeginn zur Zeit start: Startplätze je nach start verschieden (sonst begänne jede Wahl gleich), aber nur von ihm
  // abhängig
  // Generator (yield je Schwarm: die Suche nach dem Start kostet je bis 300 Abfragen des Felds); reset in einem Stück
  const reset = (start) => { for (const _ of resetSteps(start)); };
  function* resetSteps(start) {
    const rand = mulberry32(opt.seed + 101 + Math.floor(start));
    for (let k = 0; k < lead.length; k++) {
      const L = lead[k], sc = schools[k];
      if (k) yield;
      // Start: frei genug, nahe am Brett, möglichst weit weg von den übrigen Schwärmen; entlang der Kante
      let best = [0, B + 3], bestScore = -Infinity;
      for (let tries = 0; tries < 300; tries++) {
        const a = rand() * TAU, r = B + 1 + rand() * 9, x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (clear(x, z) < sc.radius + 1) continue;
        let score = 0;
        for (let j = 0; j < k; j++) score = Math.min(score, Math.hypot(x - lead[j].x, z - lead[j].z) - 8);
        if (score > bestScore) { bestScore = score; best = [x, z]; }
      }
      [L.x, L.z] = best;
      L.dir = k % 2 ? 1 : -1;
      const [gx, gz] = grad(board, L.x, L.z);
      Object.assign(L, { a: Math.atan2(gx * L.dir, -gz * L.dir), w: 0, v: sc.cruise, avoid: 0, against: 0 });
    }
    fish.forEach((f, i) => {
      const L = lead[f.school], sc = schools[f.school], o = i * F;
      const c = Math.cos(L.a), s = Math.sin(L.a), fx = f.slot[0] * sc.radius, fz = f.slot[1] * sc.radius;
      cur.set([L.x + c * fx - s * fz, L.z + s * fx + c * fz, L.a, sc.cruise, sc.s.depth + f.slot[2], 0, rand() * TAU, 0.6, 0, 0], o);
    });
    prev.set(cur);
  }

  function stepLead(L, sc, k, t) {
    const w = sc.wander;
    // gewünschte Richtung: entlang der Kante (Patrouille), zum bevorzugten Abstand hin, dazu Schlängeln
    const [gx, gz] = grad(board, L.x, L.z);
    const off = clamp((board(L.x, L.z) - sc.pref - 2 * Math.sin(t * w[4] + w[5])) / 3, -1, 1);
    const wig = 0.45 * (Math.sin(t * w[0] + w[2]) + 0.6 * Math.sin(t * w[1] + w[3]));
    let want = wrap(Math.atan2(gx * L.dir - gz * off * 0.7, -gz * L.dir - gx * off * 0.7) + wig - L.a) * 0.6;
    // Fühler
    const look = 1.5 + 1.5 * L.v, need = 0.5 * sc.radius + 0.4;
    const probe = (da, f) => clear(L.x + Math.cos(L.a + da) * look * f, L.z + Math.sin(L.a + da) * look * f);
    const cL = probe(0.6, 0.8), cR = probe(-0.6, 0.8), worst = Math.min(probe(0, 1), cL, cR, clear(L.x, L.z) + 0.5);
    if (worst < need) {
      if (!L.avoid) L.avoid = cL > cR ? 1 : -1;
      want = L.avoid * (1.4 * (need - worst) / need + 0.25);
    } else if (worst > need * 1.3) L.avoid = 0;
    // andere Schwärme meiden (vor allem voraus)
    lead.forEach((o, j) => {
      if (o === L) return;
      const ex = o.x - L.x, ez = o.z - L.z, d = Math.hypot(ex, ez), near = 2.5 * (sc.radius + schools[j].radius);
      if (d >= near) return;
      const ahead = (ex * Math.cos(L.a) + ez * Math.sin(L.a)) / d, side = Math.cos(L.a) * ez - Math.sin(L.a) * ex;
      want -= Math.sign(side || 1) * 0.6 * (near - d) / near * (0.4 + 0.6 * Math.max(ahead, 0));
    });
    // stösst er an (schwimmt er länger gegen die Patrouille), kehrt sie um
    L.against = (Math.cos(L.a) * -gz + Math.sin(L.a) * gx) * L.dir < -0.3 ? L.against + H : 0;
    if (L.against > 1.5) { L.dir = -L.dir; L.against = 0; }
    L.w += clamp(clamp(want, -0.9, 0.9) - L.w, -1.5 * H, 1.5 * H);
    L.a = wrap(L.a + L.w * H);
    L.v += clamp(sc.cruise * (1 + 0.2 * Math.sin(t * 0.21 + k * 1.7) + 0.1 * Math.sin(t * 0.53 + k)) - L.v, -0.5, 0.5) * H;
    L.x += Math.cos(L.a) * L.v * H; L.z += Math.sin(L.a) * L.v * H;
    const c = clear(L.x, L.z), m = sc.radius * 0.5;
    if (c < m) { const [px, pz] = grad(clear, L.x, L.z); L.x += px * (m - c); L.z += pz * (m - c); }
  }

  function step(t) {
    lead.forEach((L, k) => stepLead(L, schools[k], k, t));
    [prev, cur] = [cur, prev];
    for (let i = 0; i < N; i++) {
      const f = fish[i], sc = schools[f.school], L = lead[f.school], o = i * F, d = f.drift, R = sc.radius;
      let x = prev[o], z = prev[o + 1], a = prev[o + 2], v = prev[o + 3];
      // zum eigenen Platz im Schwarm (wandert langsam) und mit dem Leitfisch mit
      const sx = (f.slot[0] + 0.25 * Math.sin(t * d[2] + d[0])) * R, sz = (f.slot[1] + 0.25 * Math.sin(t * d[3] + d[1])) * R;
      const c = Math.cos(L.a), s = Math.sin(L.a);
      let vx = c * L.v + (L.x + c * sx - s * sz - x) * 0.7, vz = s * L.v + (L.z + s * sx + c * sz - z) * 0.7;
      // Abstand zu den Nachbarn im Schwarm
      const sep = 1.1 * f.len + 0.25;
      for (let j = 0; j < N; j++) {
        if (j === i || fish[j].school !== f.school) continue;
        const ex = x - prev[j * F], ez = z - prev[j * F + 1], e = Math.hypot(ex, ez);
        if (e < sep && e > 1e-4) { const k = ((sep - e) / sep) * sc.cruise * 1.2 / e; vx += ex * k; vz += ez * k; }
      }
      // selbst nicht ins Flache (Fühler voraus)
      const worst = Math.min(clear(x + Math.cos(a) * (0.6 + 0.8 * v), z + Math.sin(a) * (0.6 + 0.8 * v)), clear(x, z) + 0.3);
      if (worst < 0.35) { const [gx, gz] = grad(clear, x, z); vx += gx * (0.35 - worst) * 2.5; vz += gz * (0.35 - worst) * 2.5; }
      // drehen (Drehrate stetig, höchstens 2 rad/s) und vorwärts schwimmen, nie seitwärts
      const da = wrap(Math.atan2(vz, vx) - a);
      const turn = prev[o + 9] + clamp(clamp(da / 0.4, -2, 2) - prev[o + 9], -8 * H, 8 * H);
      a = wrap(a + turn * H);
      const vt = clamp(Math.hypot(vx, vz) * Math.max(Math.cos(da), 0.3), 0.25 * sc.cruise, 1.9 * sc.cruise);
      const acc = clamp((vt - v) / 0.3, -2 * sc.cruise, 1.4 * sc.cruise);
      v += acc * H;
      x += Math.cos(a) * v * H; z += Math.sin(a) * v * H;
      const c2 = clear(x, z);
      if (c2 < 0.15) { const [gx, gz] = grad(clear, x, z); x += gx * (0.15 - c2); z += gz * (0.15 - c2); }
      // Tiefe sanft zur gewünschten; Neigung aus dem Steigen und Sinken
      const y0 = prev[o + 4];
      const yt = clamp(sc.s.depth + f.slot[2] * R * 0.3 + 0.08 * Math.sin(t * 0.4 + d[0]), 0.3, Math.max(field.depth(x, z) - 0.4, 0.3));
      const y = y0 + (yt - y0) * (1 - Math.exp(-H / 1.2));
      const pitch = prev[o + 8] + (clamp((y0 - y) / H / Math.max(v, 0.1), -0.35, 0.35) - prev[o + 8]) * 0.1;
      // Biegung in der Kurve; Schwanzschlag: Takt nach Tempo je Länge, Stärke nach Schub
      const bend = prev[o + 5] + (clamp((turn / Math.max(v, 0.15)) * f.len, -0.8, 0.8) - prev[o + 5]) * 0.2;
      const hz = clamp(0.7 + (0.8 * v) / f.len, 0.8, 2.6);
      const amp = prev[o + 7] + (clamp(0.45 + (0.6 * acc) / sc.cruise + 0.3 * (v / sc.cruise - 0.6), 0.3, 1) - prev[o + 7]) * 0.1;
      cur.set([x, z, a, v, y, bend, (prev[o + 6] + TAU * hz * H) % (TAU * 64), amp, pitch, turn], o);
    }
  }

  return {
    count: N, fish,
    setField(f) { field = f; simT = null; },
    /** Neubeginn zur Zeit t vorwegnehmen (Generator für sliced, yield je Schritt): wie das erste advance(t), aber beim
     *  Aufbau statt im ersten Bild (dort hielten die 150 Schritte es auf dem gedrosselten Handy 170 ms an, Ticket 09) */
    *warm(t) {
      const start = Math.max(0, t - WARM);
      yield* resetSteps(start);
      simT = start;
      while (simT + H <= t + 1e-9) { step(simT); simT += H; yield; }
    },
    advance(t) {
      if (!field) return null;
      // Ein wenig zurück (warm nach der Uhr, das erste Bild nach dem Zeitstempel des Bilds, der früher liegen kann):
      // stehen lassen, nicht neu einschwimmen (das hielt das Bild sonst wieder 150 Schritte an); erst weiter zurück neu
      if (simT === null || t < simT - CATCH) { simT = Math.max(0, t - WARM); reset(simT); }
      else if (t < simT) return 0;
      // nach einer Pause (ausgeblendet, die Zeit sprang): vom letzten Stand weiter, nicht neu einschwimmen und nicht alles
      // nachrechnen; höchstens CATCH s je Bild (die Plätze sind ohnehin zufällig, das fällt nicht auf)
      else if (t - simT > CATCH) simT = t - CATCH;
      while (simT + H <= t + 1e-9) { step(simT); simT += H; }
      return clamp((t - simT) / H, 0, 1);
    },
    sample(k, alpha, out) {
      const o = k * F;
      for (let j = 0; j < F; j++) out[j] = prev[o + j] + (cur[o + j] - prev[o + j]) * alpha;
      out[2] = prev[o + 2] + wrap(cur[o + 2] - prev[o + 2]) * alpha;
      if (cur[o + 6] < prev[o + 6]) out[6] = prev[o + 6] + (cur[o + 6] + TAU * 64 - prev[o + 6]) * alpha; // Phase lief über
      return out;
    },
  };
}

/**
 * Bunte Fische, die in kleinen Schwärmen ums Brett ziehen (Daten: die Wasserkarte von waterSurface, für Tiefe, Fels und
 * Grund). Wie sie schwimmen, rechnet createFishSim (in der Lagune, nie flacher als minDepth, in der Reichweite area);
 * die Wasserkarte liest es einmal als Bild. Schwärme (schools): Anzahl, Länge (m), Form (Höhe, Breite je Länge), Tempo
 * (m/s), Tiefe (m), Muster ('tang': Rücken dunkel, Schwanz farbig; 'bands': helle Bänder mit dunklem Rand; 'plain':
 * Bauch heller) und drei Farben (Szenenwerte). Sie liegen unter dem Wasser: Rot wird mit dem Weg durchs Wasser zuerst
 * geschluckt, das Licht des Wassers (Grund aus dem Panorama) legt sich darüber. Auf dem Grund ein weicher Schatten
 * (shadow: Deckkraft), von der gebrochenen Sonne versetzt, je höher über dem Grund, desto weicher. Gezeichnet wird in die
 * Szene unter der Oberfläche (ctx.under, von waterSurface): Das Wasser legt sie als Grund unter seine Oberfläche, mit
 * Brechung, Spiegelung, Schaum und Glitzern darüber – über allem gezeichnet sahen die Fische aus, als flögen sie.
 */
function* fishSchools(ctx, opt) {
  const w = ctx.data[opt.data], under = ctx.under;
  if (!under) throw new Error('braucht waterSurface davor');
  const sim = createFishSim({ ...opt, keepOut: PLATE / 2 + 0.3 });
  // Wasserkarte lesen, Abstandsfeld rechnen und das Einschwimmen vorwegnehmen, alles beim Aufbau in Häppchen (sliced):
  // im Rückruf des Bilds bzw. im ersten Bild hielt das ein Bild auf dem gedrosselten Handy 70 bzw. 170 ms an (Ticket 09)
  const readField = function* () {
    let img = null, failed = null;
    loadSkyImage(w.map).then((i) => { img = i; }, (e) => { failed = e; });
    while (!img && !failed) yield NEXT_FRAME;
    if (failed) throw failed;
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const g = canvas.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const px = g.getImageData(0, 0, img.width, img.height).data, m = img.width * img.height;
    yield;
    const depth = new Float32Array(m), rock = new Float32Array(m), [d0, d1] = w.depthRange;
    for (let i = 0; i < m; i++) {
      depth[i] = d0 + ((d1 - d0) * (px[4 * i] * 256 + px[4 * i + 1])) / 65535;
      rock[i] = px[4 * i + 2] / 255;
    }
    yield;
    return yield* fishField(depth, rock, img.width, w.extent, opt.minDepth, true);
  };
  try {
    sim.setField(yield* readField());
    yield* sim.warm(FIXED_TIME ?? (clock.running ? clock.getElapsedTime() : 0)); // die Uhr nicht hier starten
  } catch (e) { console.warn(`Fische: Wasserkarte nicht lesbar (${e.message})`); }

  const PAT = { tang: 0, bands: 1, plain: 2 };
  const n = sim.count;
  const attr = (size, get) => new THREE.InstancedBufferAttribute(Float32Array.from(sim.fish.flatMap(get)), size);
  const school = (f) => opt.schools[f.school];
  // je Bild aus der Simulation: Ort (x, Tiefe, z, Neigung) und Bewegung (Richtung, Biegung, Phase, Stärke)
  const aPos = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const aMove = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const aShape = attr(4, (f) => [f.len, school(f).shape[0], school(f).shape[1], PAT[school(f).pattern]]);
  const decl = `
        attribute vec4 aPos, aMove, aShape;
        const float LEVEL = ${glf(w.level)};
        // Mitte des Fischs und die Achsen seiner Form: x nach hinten (Kopf vorn), z zur Seite
        vec3 fishAt() { return vec3(aPos.x, LEVEL - aPos.y, aPos.z); }
        vec2 fishBack() { return -vec2(cos(aMove.x), sin(aMove.x)); }`;
  const common = { ...ctx.uniforms, uPano: { value: ctx.pano.full }, uCenter: { value: ctx.pano.center } };

  // Fische
  const body = new THREE.InstancedBufferGeometry().copy(createFishGeometry());
  body.instanceCount = n;
  body.setAttribute('aPos', aPos);
  body.setAttribute('aMove', aMove);
  body.setAttribute('aShape', aShape);
  body.setAttribute('aC1', attr(3, (f) => school(f).colors[0]));
  body.setAttribute('aC2', attr(3, (f) => school(f).colors[1]));
  body.setAttribute('aC3', attr(3, (f) => school(f).colors[2]));
  const fishMat = new THREE.ShaderMaterial({
    uniforms: common,
    extensions: { shaderTextureLOD: true },
    side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: `${decl}
        attribute vec3 aUV, aC1, aC2, aC3;
        varying vec3 vPos, vN, vUV, vC1, vC2, vC3;
        varying float vPat;
        void main() {
          // Körper: Länge, Höhe, Breite. Schwanzschlag als Welle zum Schwanz hin, hinten stärker (Phase und Stärke aus der
          // Simulation); in der Kurve gebogen, Kopf und Schwanz zur Innenseite (aMove.y: Krümmung × Länge); beim Steigen
          // und Sinken geneigt
          float u = position.x;
          float side = sin(aMove.z - u * 4.0) * 0.16 * aMove.w * u * u - 0.5 * aMove.y * (u - 0.4) * (u - 0.4);
          // Umriss ±0,5 hoch, ±0,22 breit: auf Höhe aShape.y und Breite aShape.z je Länge
          vec3 q = vec3(u - 0.5, position.y * aShape.y, position.z / 0.44 * aShape.z + side) * aShape.x;
          q.y -= q.x * aPos.w;
          vec3 n = vec3(normal.x, normal.y / aShape.y, normal.z * 0.44 / aShape.z);
          vec2 xd = fishBack(), zd = vec2(-xd.y, xd.x);
          vec3 wp = fishAt() + vec3(xd.x * q.x + zd.x * q.z, q.y, xd.y * q.x + zd.y * q.z);
          vN = normalize(vec3(xd.x * n.x + zd.x * n.z, n.y, xd.y * n.x + zd.y * n.z));
          vPos = wp; vUV = aUV; vC1 = aC1; vC2 = aC2; vC3 = aC3; vPat = aShape.w;
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
        }`,
    fragmentShader: `
        #if __VERSION__ >= 300
          #define LOD0(t, p) textureLod(t, p, 0.0)
        #elif defined(GL_EXT_shader_texture_lod)
          #define LOD0(t, p) texture2DLodEXT(t, p, 0.0)
        #else
          #define LOD0(t, p) texture2D(t, p)
        #endif
        uniform sampler2D uPano;
        uniform vec3 uCenter;
        uniform float uTime;
        varying vec3 vPos, vN, vUV, vC1, vC2, vC3;
        varying float vPat;
        const float LEVEL = ${glf(w.level)};
        const vec3 ABSORB = vec3(0.4, 0.1, 0.07); // Schwächung je m Weg im Wasser (Rot zuerst; klar in der Lagune)
        vec3 pano(vec3 d) {
          vec3 b = normalize(vec3(d.x, -d.z, d.y));
          return LOD0(uPano, vec2(0.5 + atan(b.x, b.y) / 6.2831853, 1.0 - acos(clamp(b.z, -1.0, 1.0)) / 3.1415927)).rgb;
        }
        void main() {
          float u = vUV.x, v = vUV.y;
          // Muster
          vec3 col = vC1;
          if (vPat < 0.5) {        // Doktorfisch: dunkle Zeichnung auf dem Rücken, Schwanz farbig
            col = mix(col, vC2, smoothstep(0.15, 0.3, v) * smoothstep(0.12, 0.25, u) * smoothstep(0.85, 0.7, u)
              * smoothstep(0.3, 0.6, abs(vUV.z)));   // nur seitlich: von oben sieht man den blauen Rücken
            col = mix(col, vC3, step(0.98, u));
          } else if (vPat < 1.5) { // Clownfisch: drei helle Bänder mit dunklem Rand
            float b = min(min(abs(u - 0.22), abs(u - 0.55)), abs(u - 0.9));
            col = mix(vC2, col, smoothstep(0.05, 0.07, b));
            col = mix(col, vC3, smoothstep(0.065, 0.075, b) * smoothstep(0.095, 0.085, b));
            col = mix(col, vC3, step(1.12, u) * 0.8);
          } else {                 // schlicht: Bauch heller, Flossen eigene Farbe
            col = mix(col, vC2, smoothstep(-0.1, -0.6, v));
            col = mix(col, vC3, step(0.98, u) + step(1.05, v));
          }
          // Auge
          col *= 1.0 - 0.85 * smoothstep(0.045, 0.03, length(vec2(u - 0.1, (v - 0.25) * 0.5)) ) * step(0.3, abs(vUV.z));
          // Licht von oben (Sonne und Himmel durchs Wasser), unten dunkler, flimmernde Lichtnetze
          vec3 N = normalize(vN);
          float shimmer = 0.85 + 0.3 * sin(vPos.x * 3.1 + uTime * 2.3) * sin(vPos.z * 2.7 - uTime * 1.9);
          col *= (0.5 + 0.5 * clamp(N.y * 0.5 + 0.5, 0.0, 1.0)) * shimmer * 1.5;
          // Weg durchs Wasser bis zur Oberfläche: Rot zuerst geschluckt, das Licht des Wassers darüber (Spiegelung und
          // Brechung an der Oberfläche macht das Wasser). Unter Wasser läuft der Strahl gebrochen steiler (Brechzahl
          // 1,33): höchstens 1,5-mal die Tiefe – gerade gerechnet wurde er bei flachem Blick doppelt so lang, und die
          // Fische verschwanden im Wasserlicht
          vec3 V = normalize(cameraPosition - vPos);
          float depth = max(LEVEL - vPos.y, 0.0), path = depth / sqrt(1.0 - (1.0 - V.y * V.y) / 1.769);
          vec3 water = pano(vec3(vPos.x, LEVEL - depth - 0.6, vPos.z) - uCenter);
          col = col * exp(-ABSORB * path) + water * (1.0 - exp(-0.45 * path));
          float a = smoothstep(48.0, 30.0, length(vPos.xz));
          gl_FragColor = vec4(col * a, a);
        }`,
  });
  const fishMesh = new THREE.Mesh(body, fishMat);
  fishMesh.frustumCulled = false;

  // Schatten auf dem Grund: weiche dunkle Flecken, von der (gebrochenen) Sonne versetzt
  const quad = new THREE.InstancedBufferGeometry();
  quad.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3));
  quad.setIndex([0, 2, 1, 0, 3, 2]);
  quad.instanceCount = n;
  for (const name of ['aPos', 'aMove', 'aShape']) quad.setAttribute(name, body.getAttribute(name));
  const shadowMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: mapTexture(w.map, 'Karte') } },
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: `${decl}
        ${ctx.lightGLSL}
        uniform sampler2D uMap;
        const float EXT = ${glf(w.extent)};
        const vec2 DEPTH = ${glv(w.depthRange)};
        varying vec2 vQ;
        varying float vA;
        void main() {
          vec3 p = fishAt();
          vec2 hl = texture2D(uMap, vec2((p.x + EXT) / (2.0 * EXT), 1.0 - (p.z + EXT) / (2.0 * EXT))).rg;
          float bed = LEVEL - max(mix(DEPTH.x, DEPTH.y, (hl.x * 65280.0 + hl.y * 255.0) / 65535.0), 0.0);
          // im Wasser steiler gebrochen (Brechzahl 1,33)
          vec3 L = normalize(vec3(SKY_LIGHT.x / 1.33, sqrt(max(1.0 - dot(SKY_LIGHT.xz, SKY_LIGHT.xz) / 1.769, 0.05)), SKY_LIGHT.z / 1.33));
          vec3 s = p - L * (p.y - bed) / L.y;
          // je höher über dem Grund, desto weicher und blasser (die Wellen streuen das Licht)
          float h = p.y - bed, blur = 1.0 + 0.3 * h;
          vec2 xd = fishBack(), zd = vec2(-xd.y, xd.x);
          vec2 q = position.xz * vec2(0.75, 0.35) * aShape.x * blur;
          vec3 wp = vec3(s.x + xd.x * q.x + zd.x * q.y, bed + 0.02, s.z + xd.y * q.x + zd.y * q.y);
          vQ = position.xz;
          vA = smoothstep(4.5, 0.3, h) / blur;
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
        }`,
    fragmentShader: `
        varying vec2 vQ;
        varying float vA;
        void main() {
          float a = ${glf(opt.shadow)} * vA * smoothstep(1.0, 0.2, length(vQ));
          gl_FragColor = vec4(0.0, 0.0, 0.0, a);
        }`,
  });
  const shadowMesh = new THREE.Mesh(quad, shadowMat);
  shadowMesh.frustumCulled = false;
  fishMesh.visible = shadowMesh.visible = false; // bis die Wasserkarte gelesen ist
  under.scene.add(shadowMesh, fishMesh);

  const holder = new THREE.Group();
  const s = new Float64Array(10);
  holder.userData.update = (t) => {
    const alpha = sim.advance(t);
    if (alpha === null) return; // Wasserkarte noch nicht gelesen
    for (let k = 0; k < n; k++) {
      sim.sample(k, alpha, s);
      aPos.setXYZW(k, s[0], s[4], s[1], s[8]);
      aMove.setXYZW(k, s[2], s[5], s[6], s[7]);
    }
    aPos.needsUpdate = aMove.needsUpdate = true;
    fishMesh.visible = shadowMesh.visible = true;
  };
  return holder;
}

const SKY_LAYERS = { toonInstances, paintedInstances, glowParticles, mistSheets, waterSurface, fishSchools, bakedMesh, lavaPool, fireNests };

/**
 * Eine Skybox aus ihrem Manifest (Eintrag im Register). Schnittstelle wie die übrigen Hintergründe (skyTheme):
 * prepare() lädt, setFade(k) blendet ein (0 … 1), update(t, dt) jedes Bild solange sichtbar, ready = ganz eingeblendet,
 * release() gibt den Grafikspeicher frei (ausgeblendet und nicht gewählt; prepare() lädt danach neu).
 */
function createPanoramaSky(m) {
  const group = new THREE.Group();
  group.visible = false;
  const uniforms = { uFade: { value: 0 }, uReady: { value: 0 }, uTime: { value: 0 } };
  const pointUniforms = { ...uniforms, uPixelRatio: { value: renderer.getPixelRatio() } };
  const light = new THREE.Vector3().fromArray(m.light.dir).normalize();
  const lightGLSL = `const vec3 SKY_LIGHT = vec3(${light.toArray().map((v) => v.toFixed(4)).join(', ')});`;
  let loading = null, failed = false, mesh = null, preview = null, age = null, token = 0, offscreen = [], vorgezeichnet = false;
  let bands = [];               // je Streifen: { on (Uniform uOn), age (s seit dem Hochladen), done }
  let sharpen = null;           // scharfes ganzes Bild über der Vorschau: { on (Uniform uSoftOn), age, done }
  const streaming = new Set();  // Streifen-Texturen, die gerade hochladen

  /** Teil laden (Skript mit Data-URLs); es muss zum Stand des Registers passen */
  async function loadPart(role) {
    const part = m.parts.find((p) => p.role === role);
    await loadSkyScript(`backgrounds/${part.file}`);
    const key = `${m.id}/${role}`, got = window.PRISMA_SKY_PARTS?.[key];
    delete window.PRISMA_SKY_PARTS?.[key]; // die Bilder stecken gleich in den Texturen
    if (!got || got.rev !== m.rev) throw new Error(`${part.file}: anderer Stand als im Register`);
    return plainPngs(got);
  }

  async function build(my) {
    const base = await loadPart('base');
    const hd = PANO.hd && m.parts.some((p) => p.role === 'bands')
      ? await loadPart('bands').catch((e) => { console.warn(`${m.name}: ${e.message}, ohne Streifen`); return null; }) : null;
    const rects = hd ? m.panorama.bands : [];
    if (my !== token) return; // inzwischen wieder freigegeben (weitergeschaltet): nichts mehr dekodieren
    // Farbbilder fertig dekodiert (Tiefe als Bild: skyLogDepth liest sie ungekippt über ein Canvas). Erst das ganze
    // Bild: Damit blendet die Skybox ein; die Streifen dekodiert der Worker danach, sie kommen später dazu (unten).
    const alive = () => my === token;
    const fullLoad = loadSkyImage(base.full, true, alive), depthLoad = loadSkyImage(base.depth);
    const maskLoad = base.watermask ? loadSkyImage(base.watermask) : null; // Wasser im Panorama, fein (waterSurface)
    // im Worker nach dem ganzen Bild, aufgefüllt auf BAND_HOEHE Zeilen (eine Höhe für alle Welten, skyTexPool)
    const bandLoads = (hd?.bands ?? []).map((url) => loadSkyImage(url, true, alive, BAND_HOEHE));
    for (const load of bandLoads) load.catch(() => {}); // Fehler erst unten, beim Abbruch gar nicht: nie unbehandelt
    const images = await Promise.allSettled([fullLoad, depthLoad, ...(maskLoad ? [maskLoad] : [])]);
    const [fullImg, depthImg, maskImg = null] = images.map((r) => r.value);
    const dropBands = () => { for (const load of bandLoads) load.then(closeSkyStrips, () => {}); };
    const dropImages = () => { closeSkyStrips(fullImg); dropBands(); };
    const broken = images.find((r) => r.status === 'rejected');
    if (broken || my !== token) { // gescheitert oder inzwischen wieder freigegeben
      dropImages();
      if (broken && my === token) throw broken.reason;
      return;
    }
    // Vorschau: die Stufe des ganzen Bilds mit höchstens 1024 Pixel Breite, als eigene kleine Textur ohne Mipmaps
    // (kopiert: die Streifen braucht das ganze Bild noch), rund 2 MB. Damit steht die Skybox gleich, nur unscharf: auf
    // der Himmelskugel (panoSky), sobald sie dekodiert ist, auf dem Netz, sobald es steht. Das scharfe Bild kommt nach
    // der Enthüllung des Intros (unten); vorher hielte sein Hochladen den Grafikprozess an. Die Vorschau ist klein genug
    // für Menü und Übersicht (ruhe, klein), nicht aber für die Enthüllung des Startbildschirms.
    const small = fullImg.strips ? Math.ceil(Math.log2(fullImg.width / 1024)) : 0;
    const smallStrips = small > 0 ? fullImg.strips.filter((s) => s.level === small) : [];
    if (smallStrips.length) {
      const strips = await Promise.all(smallStrips.map(async ({ y, bitmap }) => ({ level: 0, y, bitmap: await createImageBitmap(bitmap) })));
      const tex = skyTexture({ width: fullImg.width >> small, height: fullImg.height >> small, strips }, true);
      streaming.add(tex);
      await sliced(skyUpload(tex, true), false, `Himmel ${m.id}: Vorschau hochladen`);
      streaming.delete(tex);
      if (my !== token) { tex.dispose(); dropImages(); return; }
      preview = tex;
      sceneLoop.wake(); // Vorschau einblenden (skyTheme.update)
    }
    await sceneReady; // erst nach dem ersten Bild der Szene: Seine Shader übersetzten sonst gleichzeitig, das Intro begänne später
    if (my !== token) { dropImages(); return; }
    const full = skyTexture(fullImg, true);
    streaming.add(full); // bis es hochgeladen ist: release schliesst seine Streifen
    const dropFull = () => { streaming.delete(full); closeSkyImage(full); full.dispose(); };
    // Netz in Häppchen (sliced): Tiefe glätten, Ecken setzen. Wie alles Weitere nur an ruhigen Stellen (ruhe): Schon die
    // Häppchen von 6 ms liessen das Menü und die Fahrten des Prologs auf dem gedrosselten Handy Bilder auslassen
    const center = new THREE.Vector3().fromArray(m.panorama.center);
    const depthLog = await sliced(skyLogDepth(depthImg, m.panorama.depth.log, m.panorama.depth.blur), true, `Himmel ${m.id}: Tiefe`);
    const geo = my === token ? await sliced(skyProxyGeometry(depthLog, center, m.panorama.depth.mesh), true, `Himmel ${m.id}: Netz`) : null;
    if (my !== token) { dropFull(); dropBands(); geo?.dispose(); return; }
    const soft = preview ?? full; // so lange auf dem Netz und in den Ebenen (Spiegelung im Wasser)
    const sky = new THREE.Mesh(geo, skyPanoramaMaterial(uniforms, center, soft, rects.map((b) => ({ ...b, tex: null, on: 0 }))));
    const myBands = bands = rects.map((_, i) => ({ on: sky.material.uniforms[`uOn${i}`], age: null, done: false }));
    const mySharpen = sharpen = { on: sky.material.uniforms.uSoftOn, age: null, done: !preview };
    sky.renderOrder = -1000;           // zuerst: alles Übrige liegt davor, der Tiefentest verwirft es früh
    sky.frustumCulled = false;
    const parts = [sky];
    let painted = false; // eine Ebene mit Pinsel: seine Programme mit übersetzen
    // Tiefe ungeglättet (16 Bit in Rot und Grün: nächste Nachbarn, das Wasser mischt selbst im Log)
    const depth = new THREE.Texture(depthImg);
    depth.minFilter = depth.magFilter = THREE.NearestFilter;
    depth.generateMipmaps = false;
    depth.wrapS = THREE.RepeatWrapping;
    depth.needsUpdate = true;
    const pano = {
      full: soft, center, depthRule: null, waterMask: maskImg && maskTexture(maskImg),
      depth: { tex: depth, size: [depthImg.width, depthImg.height], log: m.panorama.depth.log, image: depthImg },
    };
    const ctx = {
      uniforms, pointUniforms, data: withHd(base.data ?? {}, hd?.data), light, lightGLSL, fog: m.fog, air: m.air, pano,
      offscreen: [], later: [],
    };
    // Ebenen je ab einem neuen Bild; wer viel rechnet (Wasser, Bäume), ist ein Generator und läuft in Häppchen
    for (const layer of [...m.layers ?? [], null]) {
      await nextFrame();
      await ruhe.warte();
      if (my !== token) { for (const root of [...parts, ...ctx.offscreen]) releaseTree(root); dropFull(); dropBands(); return; }
      if (!layer) break;
      try {
        if (!SKY_LAYERS[layer.type]) throw new Error('unbekannt');
        const made = arbeit.tue(`Himmel ${m.id}: Ebene ${layer.type}`, () => SKY_LAYERS[layer.type](ctx, layer));
        const part = made.isObject3D ? made : await sliced(made, true, `Himmel ${m.id}: Ebene ${layer.type}`);
        if (layer.brush && m.brush) painted = paint(part) || painted;
        parts.push(part);
      } catch (e) { console.warn(`${m.name}: Ebene ${layer.type} ausgelassen (${e.message})`); }
    }
    if (pano.depthRule) sky.material.userData.setDepthRule(pano.depthRule);
    // Nicht in der Bodenspiegelung (dort wird auch die Himmelskugel ausgeblendet), nicht anklickbar
    for (const p of parts) p.traverse((o) => { o.layers.set(LAYER_NO_REFLECT); o.raycast = () => {}; });
    // Übersetzen, Hochladen und erstes Zeichnen nur an ruhigen Stellen (ruhe; jedes Stück fragt neu): Mit leerem
    // Shader-Cache (erster Besuch) hielt das den Grafikprozess mitten in der Enthüllung bis 300 ms an. Neue Spieler laden
    // so nach der Enthüllung oder in den Pausen des Prologs, wer weiterspielt, nach der Enthüllung oder hinter der
    // Überblendung nach «Weiter» (story.skyOf). Bis dahin zeigt die Himmelskugel die Vorschau.
    await ruhe.warte();
    if (my !== token) { for (const root of [...parts, ...ctx.offscreen]) releaseTree(root); dropFull(); dropBands(); return; }
    offscreen = ctx.offscreen;
    // Vor dem ersten Bild des Einblendens übersetzen und hochladen, ohne das laufende Bild anzuhalten: Shader im
    // Hintergrund (compileParallel, beide Fassungen des Panoramas, siehe applyFade), Texturen in Häppchen (skyUpload; das
    // ganze Bild nur ohne Vorschau, sonst folgt es unten). Solange in der Szene, aber unsichtbar: compile geht auch über
    // Unsichtbares und rechnet mit dem Licht der Szene.
    const staging = new THREE.Group();
    staging.visible = false;
    staging.add(...parts);
    scene.add(staging);
    try {
      // nur die neuen Teile (staging, offscreen), in Häppchen: Der Rest der Szene ist schon übersetzt, und three erzeugte
      // sonst den Code aller ihrer Programme in einem Stück (Ticket 09). Die Szene bleibt Wurzel (Licht, Nebel, Umgebung)
      const roots = [scene, ...offscreen], compiled = [];
      const skip = [...skyTheme.idleGroups, ...scene.children.filter((c) => c !== staging)];
      const variants = [true, false].map((transparent) => () => { sky.material.transparent = transparent; });
      const alive = () => my === token;
      compiled.push(compileParallel(roots, { skip, variants, slices: true, alive, was: `Himmel ${m.id}: Shader` }));
      if (painted) compiled.push(compileParallel([brushPass.programs()], { slices: true, alive, was: `Himmel ${m.id}: Shader Pinsel` }));
      const textures = new Set();
      for (const root of [staging, ...offscreen]) root.traverse((o) => {
        for (const mat of [o.material ?? []].flat()) {
          for (const v of [...Object.values(mat), ...Object.values(mat.uniforms ?? {}).map((u) => u.value)]) if (v?.isTexture) textures.add(v);
        }
      });
      const uploads = sliced((function* () {
        yield* skyBufferUpload(sky.geometry); // vor dem ersten Zeichnen (skyWarmDraw), sonst lädt es three in einem Stück
        for (const t of textures) {
          if (my !== token) return;
          yield* skyUpload(t);
          yield;
        }
      })(), false, `Himmel ${m.id}: Hochladen`);
      await Promise.all([...compiled, uploads]);
      await sliced(skyWarmDraw(staging, parts, sky, () => my === token), false, `Himmel ${m.id}: erstes Zeichnen (1 × 1)`);
    } catch (e) {
      for (const root of [staging, ...ctx.offscreen]) releaseTree(root); // gescheitert: nichts halb Geladenes behalten
      dropFull();
      dropBands();
      if (my === token) { offscreen = []; preview = null; } // die Vorschau hing in den Uniforms, ist also entsorgt
      throw e;
    } finally {
      scene.remove(staging);
    }
    if (my !== token) { releaseTree(staging); dropFull(); dropBands(); return; } // inzwischen wieder freigegeben
    if (!preview) streaming.delete(full); // ohne Vorschau oben schon hochgeladen
    group.add(...parts);
    mesh = sky;
    sceneLoop.wake(); // einblenden (update, skyTheme.update), auch hinter dem Startbildschirm
    adaptiveResolution.hold(); // Einblenden (doppelt gezeichnet) nicht als Überlast werten
    // Grosse Texturen erst, wenn die Skybox ganz eingeblendet ist: Das erste Schreiben in eine neue grosse Textur hält
    // den Grafikprozess kurz an (30–80 ms), das sah man im Intro und in der Überblendung als Ruck. Ebenso während einer
    // Zwischenszene der Geschichte (skyTheme.quiet): Dort fliegt das Licht, und jeder Ruck fiele auf. Jedes Stück
    // wartet dazu auf eine ruhige Stelle (skyUpload, ruhe): im Prolog nur beim Warten auf Tippen.
    const shown = () => uniforms.uFade.value >= 1 && uniforms.uReady.value >= 1 && !skyTheme.quiet;
    if (preview) {
      while (my === token && !shown()) await nextFrame();
      if (my === token) await sliced(skyUpload(full), false, `Himmel ${m.id}: scharfes Bild`);
      streaming.delete(full);
      if (my !== token) { full.dispose(); dropBands(); return; }
      // Scharfes Bild statt der Vorschau, überall (Netz, Spiegelung im Wasser); das Netz blendet dabei weich über (uSoft)
      for (const root of [group, ...offscreen]) root.traverse((o) => {
        for (const mat of [o.material ?? []].flat()) for (const u of Object.values(mat.uniforms ?? {})) if (u.value === preview) u.value = full;
      });
      sky.material.uniforms.uSoft.value = preview;
      mySharpen.on.value = 1;
      mySharpen.age = 0;
      sceneLoop.wake();
    }
    // Was die Ebenen erst nach dem Einblenden rechnen (ctx.later), dann die Streifen nachladen, je hochgeladen weich
    // über dem ganzen Bild einblenden (update, uOn)
    while (my === token && !shown()) await nextFrame();
    for (const job of ctx.later) if (my === token) await job(() => my === token);
    for (const [i, load] of bandLoads.entries()) {
      let img = null;
      try { img = await load; } catch (e) { if (my === token) console.warn(`${m.name}: Streifen ${i + 1} nicht geladen (${e.message})`); }
      if (my !== token || !img) { closeSkyStrips(img); myBands[i].done = true; continue; }
      const tex = skyTexture(img, false);
      streaming.add(tex); // release schliesst die Bilder, skyUpload bricht dann ab
      await sliced(skyUpload(tex), false, `Himmel ${m.id}: Streifen`);
      streaming.delete(tex);
      if (my !== token) { tex.dispose(); continue; }
      sky.material.uniforms[`uBand${i}`].value = tex;
      sky.material.uniforms[`uKl${i}`].value = (img.inhalt ?? img.height) / img.height;
      myBands[i].age = 0;
      sceneLoop.wake();
    }
  }

  /** Ebene mit Pinselstrichen (brush: true an der Ebene, Einstellungen im Feld brush der Skybox; createBrushPass): beim
   *  Pass anmelden, beim Freigeben abmelden */
  function paint(part) {
    if (!brushPass.supported) return false;
    const center = new THREE.Vector3().fromArray(m.panorama.center);
    const off = brushPass.add({ root: part, brush: { ...BRUSH_DEFAULT, ...m.brush }, center, uniforms });
    const before = part.userData.dispose;
    part.userData.dispose = () => { before?.(); off(); };
    return true;
  }

  /** Daten der Ebenen: Felder aus dem HD-Teil (Desktop, etwa grössere Bilder) ersetzen die gleichnamigen */
  function withHd(data, hdData) {
    const out = { ...data };
    for (const [k, v] of Object.entries(hdData ?? {})) out[k] = { ...out[k], ...v };
    return out;
  }

  /** Dekodierte Streifen schliessen, die (noch) keine Textur haben */
  function closeSkyStrips(img) { for (const s of img?.strips ?? []) s.bitmap.close(); }

  /** Grafikspeicher eines Teilbaums freigeben; spaeter: in Häppchen (freigabe), etwa beim Wechsel des Himmels */
  function releaseTree(root, spaeter = false) {
    const frei = (fn, schwer = false) => (spaeter ? freigabe.add(fn, schwer, `Himmel ${m.id}: freigeben`) : fn());
    root.traverse((o) => {
      o.userData.dispose?.();
      if (o.isInstancedMesh) frei(() => o.dispose()); // Puffer der Instanzen (Geometrie und Material bleiben, siehe unten)
      if (o.geometry) frei(() => o.geometry.dispose());
      for (const mat of [o.material ?? []].flat()) {
        for (const u of Object.values(mat.uniforms ?? {})) {
          const t = u.value;
          if (!t?.isTexture) continue;
          closeSkyImage(t); // noch nicht hochgeladen (Abbruch während des Aufbaus)
          if (t.userData.vorrat) t.dispose(); // zurück in den Vorrat (skyTexPool), gleich wieder zu haben
          else frei(() => t.dispose(), freigabe.schwer(t));
        }
        frei(() => mat.dispose());
      }
    });
  }

  /** Während des Überblendens und Einblendens durchsichtig über der Himmelskugel, sonst undurchsichtig und zuerst. */
  function applyFade() {
    if (!mesh) return;
    const transparent = uniforms.uFade.value * uniforms.uReady.value < 0.999;
    if (mesh.material.transparent !== transparent) {
      mesh.material.transparent = transparent;
      mesh.material.needsUpdate = true;
    }
  }

  return {
    group,
    panorama: true,
    /** ganz eingeblendet, samt Streifen */
    get ready() { return uniforms.uReady.value >= 1 && (sharpen?.done ?? true) && bands.every((b) => b.done); },
    /** geladen (blendet ab jetzt ein; Streifen kommen danach) oder gescheitert: bis dahin bleibt der bisherige Hintergrund
     * stehen (skyTheme.update) */
    get settled() { return mesh !== null || failed; },
    /** ganz eingeblendet, vielleicht noch mit der Vorschau statt des scharfen Bilds und ohne Streifen; oder gescheitert */
    get shown() { return mesh !== null && uniforms.uReady.value >= 1 || failed; },
    /** update blendet noch ein (Netz, scharfes Bild, Streifen); wer das anstösst, weckt die Schleife (sceneLoop) */
    get busy() {
      return mesh !== null && (uniforms.uReady.value < 1 || sharpen?.age != null && !sharpen.done
        || bands.some((b) => b.age !== null && !b.done));
    },
    /** geladen oder lädt: release gibt etwas frei */
    get held() { return loading !== null; },
    /** kleine Textur des ganzen Bilds für die Himmelskugel, solange das Netz fehlt, ein- oder ausblendet (null: noch keine) */
    get preview() { return preview; },
    /** geladen, aber noch nie im Bild und noch nicht vorgezeichnet (skyTheme.vorzeichnen) */
    get vorzeichnenNoetig() { return !!mesh && !vorgezeichnet && !group.visible; },
    /**
     * Einmal unsichtbar ins Bild des Spiels zeichnen (Ticket 11): wie im ersten Bild des Einblendens, durchsichtig und
     * mit fast nichts Deckkraft, ganz eingeblendet (uReady), zeichne(): die Szene samt Pinsel in das Ziel, das das
     * nächste Bild ohnehin ganz überschreibt (skyTheme.vorzeichnen). Danach wieder unsichtbar.
     */
    vorzeichnen(zeichne) {
      if (!this.vorzeichnenNoetig) return false;
      vorgezeichnet = true;
      const fade = uniforms.uFade.value, ready = uniforms.uReady.value;
      uniforms.uFade.value = 1e-3;
      uniforms.uReady.value = 1;
      group.visible = true;
      applyFade();
      try { zeichne(); } finally {
        uniforms.uFade.value = fade;
        uniforms.uReady.value = ready;
        group.visible = false;
        applyFade();
      }
      return true;
    },
    /** Erst laden, wenn die Skybox gewählt wird (Wald: 1,5 MB, auf dem Desktop dazu 4,5 MB Streifen). */
    prepare() {
      if (loading) return;
      const my = token;
      loading = build(my).catch((e) => { if (my === token) failed = true; console.error(`${m.name}: ${e.message}`); })
        .finally(() => sceneLoop.wake()); // gescheitert: der bisherige Hintergrund blendet aus (skyTheme.update)
    },
    setFade(k) {
      if (k > 0 && !group.visible) arbeit.merke(`Himmel ${m.id}: erstes Bild${mesh ? '' : ' (Vorschau)'}`);
      uniforms.uFade.value = k;
      if (k > 0) this.prepare();
      else if (mesh) age = PANO.appear; // vor dem Einblenden geladen: nur uFade blendet (sonst mischten sich halb die Ringe)
      group.visible = k > 0;
      applyFade();
    },
    update(t, dt) {
      if (!mesh) return;
      age = age === null ? 0 : age + dt; // in dt, nicht in t: läuft auch bei angehaltener Zeit (?t=)
      uniforms.uReady.value = Math.min(1, age / PANO.appear);
      uniforms.uTime.value = t;
      pointUniforms.uPixelRatio.value = renderer.getPixelRatio();
      for (const p of group.children) p.userData.update?.(t, dt);
      if (sharpen && sharpen.age !== null && !sharpen.done) {
        sharpen.age += dt;
        sharpen.on.value = Math.max(0, 1 - sharpen.age / PANO.appear);
        sharpen.done = sharpen.on.value <= 0;
      }
      for (const b of bands) {
        if (b.age === null || b.done) continue;
        b.age += dt;
        b.on.value = Math.min(1, b.age / PANO.appear);
        b.done = b.on.value >= 1;
      }
      applyFade();
    },
    release() {
      if (!loading) return;
      arbeit.merke(`Himmel ${m.id}: freigeben`);
      token++;
      loading = null; failed = false; mesh = null; age = null; bands = []; sharpen = null; vorgezeichnet = false;
      preview?.dispose(); // zurück in den Vorrat (skyTexPool)
      preview = null;
      for (const t of streaming) closeSkyImage(t); // bricht skyUpload ab
      streaming.clear();
      uniforms.uReady.value = 0;
      // in Häppchen (freigabe): Alles auf einmal (beim Wechsel bis rund 300 MB am Desktop) hielt den Grafikprozess im
      // ersten Bild des neuen Himmels 70–125 ms an (Ticket 11)
      for (const root of [group, ...offscreen]) releaseTree(root, true);
      group.clear();
      offscreen = [];
    },
  };
}

/**
 * Hintergründe (order: Reihenfolge im Register): Milchstrasse und Sonnensystem aus dem Code, dazu jede Skybox aus
 * Blender im Register (backgrounds/skies.js, SKYBOX: Wald, Strand …). Welchen das Spiel zeigt, bestimmt die Welt der
 * Geschichte (Entscheid 26; Tests mit ?sky=); gespeichert wird keine Wahl. Beim Wechsel bleibt der bisherige stehen,
 * bis der neue geladen ist (settled); dann blendet erst der bisherige ganz aus, dann der neue ein: Undurchsichtige
 * Teile (Planeten, nahe 3D-Objekte einer Skybox) blenden aus Schwarz ein und lägen sonst als dunkle Flächen über dem
 * alten. Darum ist immer höchstens einer eingeblendet, und Himmelskugel und Sterne mischen nur zwischen ihm und dem
 * Neutralzustand (dunkler Raum mit Sternen). sky: milkyWay (Anteil der Milchstrasse), stars (Helligkeit der Sterne),
 * starsAboveHorizon (Sterne nur über dem Horizont), starsFrom (mit starsAboveHorizon: erst ab dieser Höhe in Grad,
 * Vulkan: über dem Kraterrand), rings (Platzhalter der Kugel, solange ein Panorama lädt oder überblendet). Module:
 * prepare, setFade, update, ready, settled, release (siehe createPanoramaSky). board: die Brett-Angabe der Skybox
 * (Register), ohne sie das Steinbrett. Das Brett gehört zum Bereitsein seines Hintergrunds: Es lädt mit ihm, hält mit
 * ihm (holding), blendet gleichzeitig mit ihm über und wird mit ihm freigegeben (boardTheme). spiegel: Unter diesem
 * Hintergrund spiegelt das Brett (nur die beiden im All, Ticket 04 der Energie, ADR 0010; spiegelHimmel, boardReflection).
 */
const SKY_NEUTRAL = { milkyWay: 0, stars: 1, starsAboveHorizon: false, starsFrom: 0, rings: null };
/** so lange hält skyTheme den bisherigen Himmel höchstens, bis der gewählte vorgezeichnet ist (wartetAufVorzeichnen) */
const VORZEICHNEN_MS = 500;
/** Untergrenze der Sterne (sky.starsFrom, Grad) als Sinus für den Shader; ohne starsAboveHorizon 0 */
const starsFromSin = (s) => (s.starsAboveHorizon ? Math.sin(THREE.MathUtils.degToRad(s.starsFrom ?? 0)) : 0);
const SKY_ENTRIES = (() => {
  const code = [
    { id: 'milky', name: 'Milchstrasse', order: 10, sky: { milkyWay: 1 }, spiegel: true },
    { id: 'solar', name: 'Sonnensystem', order: 20, module: solar, spiegel: true },
  ];
  // Ein unbrauchbarer Eintrag (unbekannte Fassung, id doppelt, Fehler beim Anlegen) fällt mit einer Warnung weg; das Spiel
  // läuft mit den übrigen Hintergründen weiter
  const ids = new Set(code.map((e) => e.id));
  const blender = [];
  for (const m of window.PRISMA_SKIES ?? []) {
    try {
      if (m.format !== SKY_FORMAT) throw new Error(`Fassung ${m.format} unbekannt`);
      if (ids.has(m.id)) throw new Error('id doppelt');
      const rings = m.sky?.rings;
      if (!Array.isArray(rings) || rings.length !== 9 || !rings.every((c) => Array.isArray(c) && c.length === 3 && c.every(Number.isFinite))) {
        throw new Error('sky.rings: 9 Farben');
      }
      // Die Brett-Angabe bekommt die Richtung des Hauptlichts im Panorama mit (light.dir): Bretter im Mondlicht
      // (boardMoonlight) beleuchten sich aus der Richtung des Monds
      const board = m.board && m.light?.dir ? { ...m.board, lightDir: m.light.dir } : m.board;
      blender.push({ id: m.id, name: m.name, order: m.order, sky: m.sky, board, camera: m.camera,
        module: createPanoramaSky(m) });
      ids.add(m.id);
    } catch (e) { console.warn(`Skybox ${m?.id}: übersprungen (${e.message})`); }
  }
  delete window.PRISMA_SKIES;
  return [...code, ...blender].map((e) => ({ ...e, sky: { ...SKY_NEUTRAL, ...e.sky } })).sort((a, b) => a.order - b.order);
})();
for (const e of SKY_ENTRIES) if (e.module?.panorama) scene.add(e.module.group);

const skyTheme = {
  entries: SKY_ENTRIES,
  byId: new Map(SKY_ENTRIES.map((e) => [e.id, e])),
  order: SKY_ENTRIES.map((e) => e.id),
  current: 'milky',
  weight: Object.fromEntries(SKY_ENTRIES.map((e) => [e.id, e.id === 'milky' ? 1 : 0])), // Anteil, 0 … 1
  fadeTime: 0.9,   // s für Aus- und Einblenden zusammen
  quiet: false,    // Zwischenszene der Geschichte: grosse Texturen (scharfes Bild, Streifen) erst danach (createPanoramaSky)
  // Eine ausgeblendete Skybox aus Blender gibt ihren Grafikspeicher frei: auf dem Handy sofort, sonst nach keep s
  // (wer bald wieder vorbeikommt, lädt sie nicht neu, und Neuladen kostet einen Ruckler) – und immer, sobald eine
  // andere gewählt ist: zwei Panoramen zugleich im Grafikspeicher nur, solange das neue lädt und das alte noch steht.
  keep: IS_MOBILE ? 0 : 30,
  hidden: {},      // s ausgeblendet, je Hintergrund
  ahead: null,     // vorgeladen, noch nicht gewählt (preload): wird nicht freigegeben, bis ein anderer gewählt ist
  goal(id) { return id === this.current ? 1 : 0; },
  get fading() { return this.order.some((id) => this.weight[id] !== this.goal(id)); },
  /** Gewählter Hintergrund ganz eingeblendet, sein Brett ganz und bereit im Bild (die Geschichte wartet darauf; Tests) */
  get ready() {
    return !this.fading && (this.byId.get(this.current).module?.ready ?? true) && boardTheme.steht(this.current);
  },
  /** Gewählter Hintergrund geladen (oder gescheitert) und sein Brett bereit: Ab jetzt blendet er über (update) */
  get settled() {
    return this.byId.get(this.current).module?.settled !== false && boardTheme.bereitFuer(this.current);
  },
  /**
   * Der bisherige Hintergrund bleibt stehen, solange er etwas zeigt: während der gewählte lädt (sonst sähe man nur die
   * Platzhalterfarben; lädt der bisherige selbst noch, blendet er gleich aus und gibt frei, das bricht sein Laden ab)
   * und während das Brett des gewählten noch nicht bereit ist (so lange bleibt auch das bisherige Brett, boardTheme.haelt).
   */
  get holding() {
    const shown = this.entries.filter((e) => e.id !== this.current && this.weight[e.id] > 0);
    if (!shown.length) return false;
    return this.byId.get(this.current).module?.settled === false && shown.some((e) => e.module?.settled !== false)
      || boardTheme.haelt(this.current) || this.wartetAufVorzeichnen();
  },
  /**
   * Der gewählte Himmel ist geladen, aber noch nicht vorgezeichnet (vorzeichnen): Der bisherige bleibt so lange stehen,
   * höchstens VORZEICHNEN_MS, damit auch ohne Vorladen (Wiederholen über eine Weltgrenze) erst vorgezeichnet wird und
   * dann eingeblendet. Fragt nur, was billig ist (je Bild).
   */
  wartetAufVorzeichnen() {
    const m = this.byId.get(this.current).module;
    if (!m?.vorzeichnenNoetig) { this.vorzeichnenSeit = null; return false; }
    this.vorzeichnenSeit ??= performance.now();
    return performance.now() - this.vorzeichnenSeit < VORZEICHNEN_MS;
  },
  vorzeichnenSeit: null,
  /**
   * Ein Bild, in dem das doppelte Zeichnen nicht auffällt (Review Ticket 11, Poco): keine Lichtwelle, kein Wachsen des
   * Bretts, keine Fahrt der Kamera und kein Überblenden (Halten zählt nicht: da steht das Bild).
   */
  get ruhigZumVorzeichnen() {
    return !celebration.active && !(shockUniforms.uShock.value.y > 0) && boardTheme.anteil === 1
      && !story.tweens.length && !(this.fading && !this.holding);
  },
  /** Gewählter Hintergrund steht (Startbildschirm): wie ready, aber scharfes Bild und Streifen dürfen noch fehlen */
  get shown() { return !this.fading && (this.byId.get(this.current).module?.shown ?? true); },
  /**
   * update hat noch zu tun (sceneLoop.pending): Überblenden, Vorschau einblenden, ein Panorama blendet ein oder schärft
   * nach, ein ausgeblendetes wartet aufs Freigeben, ein Brett blendet aus dem Notfall über. Lädt eines nur, weckt es
   * die Schleife selbst (createPanoramaSky, boardTheme.load).
   */
  get busy() {
    return this.moving || boardTheme.busy || this.entries.some((e) => !(this.weight[e.id] > 0)
      && e.id !== this.current && e.id !== this.ahead && e.module?.held);
  },
  /** Im Bild ändert sich der Himmel gerade (Überblenden, Vorschau, Einblenden, Schärfen); frameRate.skyOnly gilt dann nicht. */
  get moving() {
    if (this.fading) return true;
    const bg = background.material.uniforms, shown = this.entries.find((e) => this.weight[e.id] > 0);
    const preview = shown?.module?.preview ?? null;
    if (bg.uPreview.value !== preview || preview && bg.uPreviewOn.value < 1) return true;
    return this.entries.some((e) => this.weight[e.id] > 0 && e.module?.busy);
  },
  /**
   * Ein geladenes Panorama, das noch nie zu sehen war (gewählt oder vorgeladen), einmal unsichtbar in voller Grösse
   * vorzeichnen, vor dem Bild des Spiels (draw) und nur an einer ruhigen Stelle (ruhe), je Bild höchstens eines (Ticket
   * 11). skyWarmDraw hat es schon in ein Ziel von 1 × 1 Pixel gezeichnet; hier trifft es dazu das Ziel des Spiels in seiner
   * Grösse und Art (Tiefe, Stencil, HDR) mit allen Vorläufen (SCENE_PREPASSES) und den Pinsel samt seinen Zielen: Was ein
   * Treiber erst beim ersten echten Zeichnen anlegt, geschieht so vorher. Das Bild selbst überschreibt danach alles.
   */
  vorzeichnen() {
    for (const e of this.entries) {
      if (this.weight[e.id] > 0 || (e.id !== this.current && e.id !== this.ahead) || !e.module?.vorzeichnenNoetig) continue;
      if (!ruhe.jetzt() || !this.ruhigZumVorzeichnen) return; // erst fragen, wenn eines ansteht (je Bild)
      arbeit.tue(`Himmel ${e.id}: vorzeichnen`, () => e.module.vorzeichnen(() => {
        const rt = composer.readBuffer, before = renderer.getRenderTarget(), shadows = renderer.shadowMap.needsUpdate;
        renderer.shadowMap.needsUpdate = false;
        try {
          for (const prepass of SCENE_PREPASSES) prepass(renderer, camera, rt, scene);
          renderer.setRenderTarget(rt);
          renderer.render(scene, camera); // autoClear: löscht das Ziel zuerst
          brushPass.render(renderer, composer.writeBuffer, rt);
        } finally {
          renderer.setRenderTarget(before);
          renderer.shadowMap.needsUpdate = shadows;
        }
      }));
      adaptiveResolution.hold(0.5); // das doppelt gezeichnete Bild nicht als Überlast werten
      return;
    }
  },

  /** Gruppen der Hintergründe aus dem Code, die gerade nicht gewählt sind: beim Vorab-Übersetzen auslassen */
  get idleGroups() { return this.entries.filter((e) => e.module?.group && !e.module.panorama && e.id !== this.current).map((e) => e.module.group); },
  /** Hintergrund wechseln (die Welt der Geschichte bestimmt ihn, Entscheid 26; gespeichert wird nichts). */
  set(id, animate = true) {
    arbeit.merke(`Himmel ${id}: gewählt`);
    this.current = id;
    this.ahead = null;
    this.hidden[id] = 0;                   // gewählt: die Frist fürs Freigeben beginnt erst beim Wegschalten
    this.byId.get(id).module?.prepare?.(); // vor dem Ausblenden: sonst stockte die Überblendung
    boardTheme.prepare(id, this.byId.get(id).board); // sein Brett ebenso
    if (!animate) for (const n of this.order) this.weight[n] = this.goal(n);
    this.apply();
    boardReflection.follow(0, !animate); // die Spiegelung ebenso
    boardTheme.follow(0); // ohne Überblenden springt das Brett gleich mit
    sceneLoop.wake();
  },
  /**
   * Einen Hintergrund schon laden, ohne ihn zu zeigen (die Geschichte: die nächste Welt, solange «Gelöst» steht). Sein
   * Aufbau (Netze, Hochladen der Bilder) hielt sonst einzelne Bilder 50–120 ms an, mitten in der Reise oder beim
   * Überblenden an einer Weltgrenze (Review Ticket 06); so geschieht er vorher auf dem stillen Bild. Sein Brett ebenso.
   */
  preload(id) {
    if (id === this.current || !this.byId.has(id)) return;
    arbeit.merke(`Himmel ${id}: vorladen`);
    this.ahead = id;
    this.hidden[id] = 0;
    this.byId.get(id).module?.prepare?.();
    boardTheme.prepare(id, this.byId.get(id).board);
    sceneLoop.wake(); // das bisher vorgeladene gibt update frei
  },
  update(dt, t) {
    if (this.fading && !this.holding) {
      const step = 2 * dt / this.fadeTime;
      const others = this.order.filter((n) => n !== this.current);
      for (const n of others) this.weight[n] = Math.max(0, this.weight[n] - step);
      if (others.every((n) => this.weight[n] === 0)) this.weight[this.current] = Math.min(1, this.weight[this.current] + step);
      this.apply();
    }
    // Vorschau des eingeblendeten Panoramas statt der Platzhalterfarben (panoSky), in 0,3 s
    const bg = background.material.uniforms;
    const preview = this.entries.find((e) => this.weight[e.id] > 0)?.module?.preview ?? null;
    if (bg.uPreview.value !== preview) { bg.uPreview.value = preview; bg.uPreviewOn.value = 0; }
    if (preview) bg.uPreviewOn.value = Math.min(1, bg.uPreviewOn.value + dt / 0.3);
    const otherPanorama = this.byId.get(this.current).module?.panorama;
    for (const e of this.entries) {
      if (this.weight[e.id] > 0) { e.module?.update(t, dt); this.hidden[e.id] = 0; continue; }
      if (e.id === this.current || e.id === this.ahead || !e.module?.release) continue;
      this.hidden[e.id] = (this.hidden[e.id] ?? 0) + dt;
      if (otherPanorama || this.hidden[e.id] >= this.keep) { e.module.release(); boardTheme.free(e.id); }
    }
    boardReflection.follow(dt);
    boardTheme.follow(dt);
  },
  apply() {
    const a = this.entries.find((e) => this.weight[e.id] > 0); // höchstens einer (siehe oben)
    const w = a ? this.weight[a.id] : 0, k = w * w * (3 - 2 * w), s = a?.sky ?? SKY_NEUTRAL;
    const mix = (key) => SKY_NEUTRAL[key] + k * (s[key] - SKY_NEUTRAL[key]);
    const bg = background.material.uniforms;
    bg.uGlow.value = SKY.glow * mix('milkyWay');
    bg.uPano.value = s.rings ? k : 0;
    if (s.rings) s.rings.forEach((c, i) => bg.uRings.value[i].fromArray(c));
    stars.material.uniforms.uFade.value = mix('stars');
    stars.material.uniforms.uHorizon.value = s.starsAboveHorizon ? k : 0;
    stars.material.uniforms.uFrom.value = starsFromSin(s);
    // Die Himmelskugel (Radius 80 um die Kamera, ohne Tiefe) zeichnet nach dem Netz eines Panoramas und deckte weiter
    // draussen liegende Teile zu. Mit 136 (vor camera.far = 140) liegt sie überall dahinter; sie rechnet nur mit der
    // Richtung, sieht also gleich aus.
    background.scale.setScalar(a?.module?.panorama ? 136 / 80 : 1);
    for (const e of this.entries) e.module?.setFade(e === a ? k : 0);
  },
};

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

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  boardCoreUniforms: () => boardCoreUniforms, boardReflection: () => boardReflection, boardTheme: () => boardTheme,
  camera: () => camera, reflector: () => reflector, renderer: () => renderer, ruhe: () => ruhe,
  sceneLoop: () => sceneLoop, shockUniforms: () => shockUniforms, skyTheme: () => skyTheme,
  spiegelHimmel: () => spiegelHimmel, stars: () => stars, stoneBoard: () => stoneBoard,
});

export {
  arbeit, background, bloomPass, boardReflection, boardTheme, brushPass, buildEnvironment, camera, compileParallel,
  composer, createBrushedTexture, DIAG, ENV_ROOM, finalPass, hemi, keyLight, LAYER_NO_REFLECT,
  makeMirrorStreakTexture, markSceneReady, markShadowsDirty, NEXT_FRAME, nextFrame, reflector, reflLodShift, renderer,
  REST_STEPS, ruhe, RUHE_OHNE_START, scene, sceneLoop, SHOCK_REST_S, SHOCK_SPEED, shockClock, shockUniforms, skyTheme,
  sliced, stars, starsFromSin, updateSky, urlSky,
};
