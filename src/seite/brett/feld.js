// Feld: verbindet Spiellogik und 3D-Darstellung (game), Würfel, Laden, Drehen, Weigern (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import {
  COLOR_RGB, cubeToWorld, ELEMENT_FACTORIES, FIXED_EDGE, fixedBase, gridToWorld, MAT, placeInCube,
} from './elemente.js';
import { CELL, FIXED_TIME } from '../konfiguration.js';
import { arbeit, LAYER_NO_REFLECT, markShadowsDirty, scene, sceneLoop, sliced } from '../szene.js';
import { shockUniforms } from './brett.js';
import { cameraRig } from '../kamera.js';
import { beamView } from './strahlen.js';
import {
  hitProxyGeometry, hitProxyMaterial, input, makeInteractive, setHovered, SHARED_GEOMETRIES,
} from '../eingabe.js';
import { audio } from '../ton.js';
import { flow } from '../levelfluss.js';
import { fuehrung } from '../fuehrung.js';
import { ui } from '../oberflaeche/ui.js';
import { adaptiveResolution, sceneTime } from '../aufloesung.js';
import { createBoard, isRotatable, LEVELS, mod8, traceBeams } from '../../logik.js';
import { alsGlobal } from '../testschnittstelle.ts';

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

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  animateWeigern: () => animateWeigern, game: () => game, loadLevel: () => loadLevel,
  rotateElement: () => rotateElement, weigernde: () => weigernde,
});

export {
  animateRotations, animateWeigern, boardGroup, CUBE, cubeView, game, loadLevel, prepareLevel, recomputeBeams,
  rotateElement, SHARED_MATERIALS, updateTargetGoals, weigern, weigernde,
};
