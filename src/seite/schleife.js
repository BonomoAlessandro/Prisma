// Hauptschleife (frame, draw, animate), Testschnittstelle (__prisma, __prismaDebug) und Seitenstart (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import { frameRate, leistung, perfHud } from './leistung.js';
import { FIXED_TIME } from './konfiguration.js';
import {
  arbeit, camera, compileParallel, markSceneReady, NEXT_FRAME, renderer, REST_STEPS, scene, sceneLoop,
} from './szene.js';
import { background, buildEnvironment, ENV_ROOM, stars } from './himmel/sterne.js';
import { skyTheme } from './himmel/skybox.js';
import { boardTheme, shockClock, shockUniforms } from './brett/brett.js';
import { bloomPass, brushPass, composer, finalPass, hemi, keyLight } from './bildschritte.js';
import { cameraRig, updateCamera } from './kamera.js';
import { ELEMENT_FACTORIES, MAT } from './brett/elemente.js';
import {
  animateRotations, animateWeigern, boardGroup, cubeView, game, rotateElement, updateTargetGoals, weigernde,
} from './brett/feld.js';
import { beamMaterial, beamShadeMaterial, beamView, buildBeamGeometry, floorGlowMaterial } from './brett/strahlen.js';
import { makeInteractive } from './eingabe.js';
import { audio } from './ton.js';
import { celebration, changeLevel, enterLevel, flow, progress, updateFlow } from './levelfluss.js';
import { fuehrung } from './fuehrung.js';
import { markSeitenstart, setShown, ui } from './oberflaeche/ui.js';
import { himmelsWagen } from './geschichte/daten.js';
import { menu, story, uebersicht } from './geschichte/geschichte.js';
import { adaptiveResolution, renderReflection, sceneTime } from './aufloesung.js';
import {
  COLORS, createBoard, geraeteText, isRotatable, LEVELS, mod8, NEBENBEI, STORY_LEVELS, TUTORIAL_COUNT,
} from '../logik.js';
import { neueAufgabe } from './aufgabe.ts';
import { alsGlobal } from './testschnittstelle.ts';

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
  COLORS: () => COLORS, draw: () => draw, geraeteText: () => geraeteText, isRotatable: () => isRotatable,
  LEVELS: () => LEVELS, NEBENBEI: () => NEBENBEI, STORY_LEVELS: () => STORY_LEVELS,
  TUTORIAL_COUNT: () => TUTORIAL_COUNT,
}, { draw: (f) => { draw = f; } });

export { animate, draw, frame };
