/* SPIELLOGIK ===========================================================
   Reine Rasterlogik ohne Three.js: 2D-Feld und Würfel-Level, ein Durchlauf für beide (tracePass).

   Modul (Ticket 03 von .scratch/umbau/, bis dahin der Bereich LOGIC in index.html): Die Seite (src/seite/…, seit
   Ticket 04), Tests und Werkzeuge importieren es (tools/solver.mjs, tests/logic.test.mjs). Tests und Werkzeuge führen
   es auch als Text aus (tools/seitenmodule.mjs: zerlege, ausText, golden.mjs mit einer veränderten Strahlregel).
   Darum hier als einziges import die Zeile mit den Leveldaten und als einziges export der Block am Schluss, mit allen
   Namen der obersten Ebene (tests/logic.test.mjs prüft das). Kein Bezug auf Namen der Seite (Node lädt das Modul
   allein).
   Die Level und die Reise der Geschichte stehen seit Ticket 06 von .scratch/umbau/ als Daten in src/daten/level.js
   (bis dahin hier zwischen Markierungen); dorthin schreiben tools/ordne-level.mjs, tools/ordne-wuerfel.mjs,
   tools/geschichte.mjs und tools/vorrat.mjs.

   Koordinaten: x = Spalte (nach rechts), z = Zeile (zum Betrachter hin).
   Richtungen in 45°-Schritten, Winkel von +x Richtung +z gemessen:
     0 = Ost, 1 = Südost, 2 = Süd, 3 = Südwest, 4 = West, 5 = Nordwest, 6 = Nord, 7 = Nordost
   Farben als RGB-Bitmaske: Rot = 1, Grün = 2, Blau = 4 (Weiss = 7), damit
   Filtern (AND) und additives Mischen (OR) trivial werden.
   ===================================================================== */
import { FLACH, REISE, UEBUNGEN, WUERFEL } from './daten/level.js';

const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const COLORS = { red: 1, green: 2, yellow: 3, blue: 4, magenta: 5, cyan: 6, white: 7 };
const COLOR_NAMES = ['none', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
const MAX_BOUNCES = 50;   // Schutz gegen Endlosschleifen pro Strahl
const MAX_SEGMENTS = 256; // harte Obergrenze für das ganze Feld
const ELEMENT_TYPES = ['source', 'mirror', 'prism', 'filter', 'combiner', 'blocker', 'target'];

const mod8 = (n) => ((n % 8) + 8) % 8;
/** Einheitsvektoren der Richtungen (einmal berechnet; eingefroren, weil Strahlabschnitte sie teilen). */
const UNIT_DIRS = DIRS.map(([dx, dz]) => { const l = Math.hypot(dx, dz); return Object.freeze([dx / l, dz / l]); });
const unitDir = (dir) => UNIT_DIRS[mod8(dir)];

/**
 * Spiegel: Linie im Winkel rot·45°, beidseitig verspiegelt.
 * Reflexion eines Winkels φ an einer Linie α: φ' = 2α − φ.
 * Verläuft der Strahl parallel zur Spiegelfläche, trifft er die Rahmenkante und wird geschluckt
 * (reflectOnMirror liefert dann die unveränderte Richtung).
 */
function reflectOnMirror(dir, rot) {
  return mod8(2 * rot - dir);
}

/** Strecke (in Zellen), die ein Strahl nach der Feldkante noch ausläuft, bevor er ganz verblasst. */
const EDGE_RUN = 3;

/** Halbe Spiegelbreite in Rasterzellen (Modell: 0.46 Welt bei CELL = 1.2, siehe makeMirror).
 *  Dort endet ein parallel einfallender Strahl. */
const MIRROR_HALF_WIDTH = 0.46 / 1.2;

/**
 * Rasterrichtung → Drehung um die Y-Achse in three.js.
 * Rasterwinkel laufen von +x nach +z; eine positive rotation.y dreht +x aber nach −z.
 */
function dirToRotationY(dir) {
  return -dir * Math.PI / 4;
}

/** Erzeugt den Spielzustand aus einer Level-Definition (siehe LEVELS; Würfel-Level siehe LEVELS_3D). */
function createBoard(level) {
  if (level.dim === 3) return createBoard3(level);
  const size = level.size || 7;
  const elements = level.elements.map((e, i) => {
    if (!ELEMENT_TYPES.includes(e.type)) throw new Error(`Level "${level.name}": unbekannter Typ "${e.type}"`);
    if (e.color && !COLORS[e.color]) throw new Error(`Level "${level.name}": unbekannte Farbe "${e.color}"`);
    return {
      id: i,
      type: e.type,
      x: e.x,
      z: e.z,
      rot: mod8(e.rot || 0),
      dir: mod8(e.dir || 0),
      color: COLORS[e.color || 'white'],
      fixed: !!e.fixed,
    };
  });
  const grid = new Array(size * size).fill(null); // Elemente nach Zelle (z · size + x) – schneller Zugriff beim Verfolgen
  for (const el of elements) {
    const key = el.x + ',' + el.z;
    if (el.x < 0 || el.z < 0 || el.x >= size || el.z >= size) throw new Error(`Level "${level.name}": ${key} ausserhalb`);
    if (grid[el.z * size + el.x]) throw new Error(`Level "${level.name}": Zelle ${key} doppelt belegt`);
    grid[el.z * size + el.x] = el;
  }
  return { size, elements, grid, name: level.name };
}

/** Eine Normale der Spiegelfläche je Stellung (einmal berechnet statt Math.sin und Math.cos bei jedem Treffer). */
const MIRROR_NORMALS = Array.from({ length: 8 }, (_, rot) => {
  const a = rot * Math.PI / 4;
  return [-Math.sin(a), Math.cos(a)];
});

/**
 * Normale der Spiegelfläche, die zur Seite des einfallenden Strahls zeigt.
 * Der reflektierte Strahl verlässt den Spiegel auf derselben Seite.
 */
function mirrorFrontNormal(rot, dir) {
  const n = MIRROR_NORMALS[mod8(rot)], d = DIRS[dir];
  let nx = n[0], nz = n[1];
  if (nx * d[0] + nz * d[1] > 0) { nx = -nx; nz = -nz; }
  return [nx, nz];
}

/**
 * Stellung, die der Löser (tools/solver.mjs) noch nicht festgelegt hat. Liest die Verfolgung sie, hält sie an und
 * liefert { open: Element, hits: bis dahin sichere Treffer, resume: Stand zum Weitermachen }. Im Spiel kommt sie nie vor.
 */
const OPEN = -1;

function isRotatable(el) {
  return !el.fixed && (el.type === 'mirror' || el.type === 'prism' || el.type === 'combiner');
}

/**
 * Welches Element ein Tippen oder Klick meint (pickElement). Kandidaten { el, hit: Abstand des Strahls zum
 * Trefferzylinder oder null, px: Abstand seiner Mitte zum Zeiger in Pixeln }; slop: so weit daneben zählt noch (px).
 * Ein drehbares Element im Toleranzbereich (getroffen oder höchstens slop daneben) gewinnt immer gegen ein festes,
 * damit die Weigerung das Spielen nicht schlechter macht. In jeder Gruppe zuerst das vorderste getroffene, sonst das
 * nächstgelegene. Nichts in Reichweite: null. vorrang (Sperre der Führung, schrittErlaubt): Elemente, für die er wahr
 * ist, gewinnen vor allen anderen, auch ein festes vor einem drehbaren.
 */
function pickTapped(cands, slop = 0, vorrang = null) {
  const gruppe = (el) => (vorrang?.(el) ? 0 : isRotatable(el) ? 1 : 2);
  for (const g of [0, 1, 2]) {
    let best = null, bestHit = Infinity, near = null, nearPx = slop;
    for (const c of cands) {
      if (gruppe(c.el) !== g) continue;
      if (c.hit !== null && c.hit < bestHit) { bestHit = c.hit; best = c.el; }
      if (c.px < nearPx) { nearPx = c.px; near = c.el; }
    }
    if (best || near) return best ?? near;
  }
  return null;
}

/** Zerlegt eine Farbmaske in ihre Grundfarben (Rot, Grün, Blau). */
function primariesOf(color) {
  return [1, 2, 4].filter(c => color & c);
}

/** Grösste Ablenkung, die ein Prisma schafft (in 45°-Schritten): bis 90°. */
const PRISM_MAX_BEND = 2;

/**
 * Prisma: Die Austrittsfläche zeigt in Richtung rot·45° – dorthin zielt der Farbfächer.
 * Grün läuft genau in Prismarichtung, Rot 45° links davon (rot − 1), Blau 45° rechts (rot + 1).
 * Jede Stellung bewirkt so etwas anderes: Fächer geradeaus, um 45° oder um 90° abgelenkt.
 * Zeigt die Austrittsfläche nach hinten (Ablenkung 135° oder 180°), tritt kein Licht aus.
 * Eine Grundfarbe läuft nur auf ihrer eigenen Bahn (gebrochen, nicht gespalten);
 * eine Mischfarbe zerfällt in ihre Anteile.
 * Rückgabe: [{ dir, color }] – leer, wenn das Licht nicht austreten kann.
 */
function refractInPrism(dir, color, rot) {
  const b = mod8(rot - dir);
  const bend = b > 4 ? b - 8 : b; // −3 … 4
  if (Math.abs(bend) > PRISM_MAX_BEND) return [];
  const offset = { 1: -1, 2: 0, 4: 1 };
  return primariesOf(color).map(c => ({ dir: mod8(rot + offset[c]), color: c }));
}

/**
 * Verfolgt alle Strahlen auf dem Feld.
 * extraRays (optional, v. a. für Tests): zusätzliche Startstrahlen { x, z, dir, color }, im Würfel
 * { x, y, z, d: [dx, dy, dz], color }.
 * from (optional, nur für den Löser): resume einer Verfolgung, die an einem Element auf OPEN angehalten hat. Die
 * Verfolgung macht dort weiter, statt von vorn zu beginnen, mit demselben Ergebnis – vorausgesetzt, seither wurde nur
 * die Stellung dieses Elements gesetzt (gleiches Feld, gleiche extraRays). Bis zum Anhalten hat sie es nie gelesen.
 *
 * Kombinatoren geben die additive Mischung ALLER eintreffenden Strahlen ab – auch solcher,
 * die erst über ihren eigenen oder einen anderen Kombinator ankommen. Deshalb wird
 * iteriert, bis sich die Eingangsfarben nicht mehr ändern (Fixpunkt; die Masken können
 * nur wachsen und haben 3 Bit, nach wenigen Durchläufen ist Schluss).
 *
 * Rückgabe:
 *   segments:  [{ x0, z0, x1, z1, color, dist0, length, n0, n1 }]  (Rasterkoordinaten, dist0 = Weglänge ab Quelle)
 *              n0/n1: Schnittnormalen [nx, nz] an Anfang/Ende – sichtbar ist nur, was auf ihrer Seite liegt
 *              (Spiegel: Spiegelfläche, sonst senkrecht zum Strahl), damit kein Leuchten durch Objekte dringt
 *              fade (optional): Auslaufstrecke vor dem Ende, über die der Strahl verblasst (Feldkante)
 *   events:    [{ x, z, color, kind, dist, target?, element?, normal? }]
 *              kind ∈ reflect | refract | filter | merge | hit | absorb | edge | floor (Würfel: auf der Plattform)
 *   hits:      Map(targetId → additiv gemischte Farbe aller eintreffenden Strahlen)
 *   mixes:     Map(combinerId → abgegebene Mischfarbe)
 *   satisfied: Set der Ziel-IDs, deren Mischfarbe exakt ihrer Zielfarbe entspricht
 *   solved:    alle Ziele erfüllt
 *   truncated: Obergrenze erreicht (Abpraller, Abschnitte, Kombinator-Fixpunkt) – dann nie gelöst
 * Würfel-Level (board.dim 3) laufen über denselben Durchlauf (tracePass): Ein flaches Level ist ein Würfel mit einer
 * Ebene (y = 0, Drehachse y). Im Würfel haben Segmente zusätzlich y0/y1, Ereignisse y, Normalen sind [nx, ny, nz].
 * Steht ein Element, das Licht bekommt, auf OPEN, ist die Rückgabe nur { open: Element, hits, resume } (für den Löser).
 * Ohne früheren Durchlauf ist hits dieselbe Map wie im Stand resume; ein Aufrufer darf sie nicht verändern.
 */
function traceBeams(board, extraRays = [], from = null) {
  let emitting = from ? from.emitting : new Map(); // combinerId → { color, dist } aus dem vorigen Durchlauf
  let result = from ? from.result : null;
  let paused = from ? from.paused : null; // angehaltener Durchlauf, in dem es weitergeht
  // Jeder Durchlauf trägt Licht einen Kombinator weiter; jede Mischung kann höchstens 3-mal wachsen.
  let combiners = 0;
  for (const el of board.elements) if (el.type === 'combiner') combiners++;
  const maxPasses = 3 * combiners + 2;
  let stable = false;
  for (let pass = from ? from.pass : 0; pass < maxPasses && !stable; pass++) {
    const r = tracePass(board, extraRays, emitting, paused);
    paused = null;
    if (r.open) {
      // Für den Löser: Die Treffer des vorigen Passes sind ebenfalls sicher (die Pässe wachsen nur). Der angehaltene
      // Durchlauf behält seine eigenen.
      let hits = r.paused.hits;
      if (result) {
        hits = new Map(hits);
        for (const [id, c] of result.hits) hits.set(id, (hits.get(id) || 0) | c);
      }
      return { open: r.open, hits, resume: { pass, emitting, result, paused: r.paused } };
    }
    result = r;
    const next = result.combinerInputs;
    stable = next.size === emitting.size;
    if (stable) for (const [id, v] of next) if (emitting.get(id)?.color !== v.color) { stable = false; break; }
    emitting = next;
  }
  if (!stable) result.truncated = true;
  const mixes = new Map();
  for (const [id, v] of emitting) mixes.set(id, v.color);
  // Zielregel: Alle eintreffenden Strahlen mischen sich additiv; erfüllt ist ein Ziel nur,
  // wenn die Mischung exakt seiner Farbe entspricht (ein zusätzlicher falscher Strahl stört).
  const satisfied = new Set();
  let targets = 0;
  for (const t of board.elements) {
    if (t.type !== 'target') continue;
    targets++;
    if (result.hits.get(t.id) === t.color) satisfied.add(t.id);
  }
  // Abgebrochene Verfolgung (Obergrenzen) zählt nie als gelöst – dieselbe Regel gilt für den Löser
  const solved = !result.truncated && targets > 0 && satisfied.size === targets;
  return {
    segments: result.segments, events: result.events, hits: result.hits, mixes,
    satisfied, solved, truncated: result.truncated,
  };
}

/* ---------- Würfel (dim: 3) und Richtungen der Strahlregel ----------
   Koordinaten x, y (Ebene, nach oben), z. Richtungen sind ganzzahlige Vektoren [dx, dy, dz] mit Werten −1, 0, 1,
   ohne Raumdiagonalen: 6 Achsen und 12 Flächendiagonalen (DIRS3). Spiegelungen führen nie aus dieser Menge heraus.
   Jedes Element dreht um eine feste Achse (axis 'x' | 'y' | 'z', Standard 'y') und wirkt in der Ebene senkrecht
   dazu genau wie ein 2D-Element: rot bzw. dir zählt dort in 45°-Schritten (DIRS) über die Ebenenbasis u, v.
   Achse y ist die 2D-Ebene (u = +x, v = +z). Ein Spiegel mit waagrechter Achse lenkt Licht zwischen die Ebenen.
   Die Basis (u, a, v) ist rechtshändig: Die Darstellung dreht die 2D-Modelle damit in ihre Ebene.
   Ein flaches Level ist ein Würfel mit einer Ebene (ADR 0003): y = 0, alle Achsen y, nur die ersten acht Richtungen.
   Es läuft durch denselben Durchlauf (tracePass); nur die Ausgabe lässt y weg wie seit jeher. */
const AXES = {
  y: { a: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  x: { a: [1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  z: { a: [0, 0, 1], u: [1, 0, 0], v: [0, -1, 0] },
};
const MAX_SIZE_3D = 16; // Kantenlänge höchstens (die Schleifenerkennung in tracePass trüge bis 64)
/** Halbe Spiegelhöhe in Rasterzellen (Rahmen 0.6 hoch, siehe makeMirror): dort endet ein Strahl längs der Drehachse. */
const MIRROR_HALF_HEIGHT = 0.3 / 1.2;

const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit3 = (d) => { const l = Math.hypot(d[0], d[1], d[2]); return [d[0] / l, d[1] / l, d[2] / l]; };

/** Die 18 Richtungen [dx, dy, dz]: zuerst die acht der Ebene in der Reihenfolge von DIRS (ein flaches Level kennt nur
 *  sie, mit derselben Nummer), dann die zehn mit Anteil in y. Ein Strahl trägt die Nummer (ray.dir). */
const DIRS3 = DIRS.map(([dx, dz]) => [dx, 0, dz]);
for (const dy of [1, -1]) for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) {
  if (dx * dx + dz * dz <= 1) DIRS3.push([dx, dy, dz]);
}
const DIR_OF_CODE = new Array(27).fill(-1);
DIRS3.forEach((d, i) => { DIR_OF_CODE[(d[0] + 1) * 9 + (d[1] + 1) * 3 + d[2] + 1] = i; });
/** Nummer der Richtung d, −1 für eine Raumdiagonale oder den Nullvektor. */
const dirOf = (d) => DIR_OF_CODE[(d[0] + 1) * 9 + (d[1] + 1) * 3 + d[2] + 1];
/** Nummer der Richtung d; ist d keine der 18 Richtungen, ein Fehler (what: wessen Richtung). */
function dirIndex(d, what) {
  const i = dirOf(d);
  if (!(i >= 0)) throw new Error(`${what} mit ungültiger Richtung ${JSON.stringify(d)}`);
  return i;
}
/** Einheitsvektoren, eingefroren wie UNIT_DIRS; die acht der Ebene mit denselben Zahlen wie UNIT_DIRS. */
const UNIT_DIRS3 = DIRS3.map((d, i) => Object.freeze(i < 8 ? [UNIT_DIRS[i][0], 0, UNIT_DIRS[i][1]] : unit3(d)));
/** Schnittnormalen am Ende eines Abschnitts, der nicht an einem Spiegel endet: entgegen der Laufrichtung. */
const BACK_DIRS = UNIT_DIRS.map(u => Object.freeze([-u[0], -u[1]]));
const BACK_DIRS3 = UNIT_DIRS3.map(u => Object.freeze([-u[0], -u[1], -u[2]]));

/**
 * Richtungen in der Drehebene eines Elements, als Tabellen je Achse A (AXIS_IDS) und Richtung i = A · 18 + dir:
 *   PLANE_K[i]  Richtung k (0 … 7, wie DIRS) des Anteils in der Drehebene, −1 wenn dir längs der Achse läuft
 *   PLANE_A[i]  Anteil längs der Achse (−1, 0, 1); 0 heisst: dir liegt in der Drehebene, dann ist PLANE_K die Richtung
 *   FROM_PLANE[(A · 3 + s + 1) · 8 + k]  Richtung aus k in der Ebene und Anteil s längs der Achse (−1: Raumdiagonale)
 * Für Achse y und die acht Richtungen der Ebene ist das die Gleichheit: Ein flaches Level rechnet so wie in 2D.
 */
const AXIS_NAMES = ['y', 'x', 'z'], AXIS_IDS = { y: 0, x: 1, z: 2 };
const PLANE_K = [], PLANE_A = [], FROM_PLANE = [];
for (const name of AXIS_NAMES) {
  const { a, u, v } = AXES[name];
  for (const d of DIRS3) {
    const du = dot3(d, u), dv = dot3(d, v);
    PLANE_K.push(DIRS.findIndex(([x, z]) => x === du && z === dv));
    PLANE_A.push(dot3(d, a));
  }
  for (const s of [-1, 0, 1]) for (const [du, dv] of DIRS) {
    FROM_PLANE.push(dirOf([0, 1, 2].map(c => du * u[c] + dv * v[c] + s * a[c])));
  }
}
/**
 * Läuft ein Strahl parallel zur Spiegelfläche, endet er an der ersten Rahmenkante, die er erreicht: in der Drehebene
 * an der Seitenkante (MIRROR_HALF_WIDTH, wie in 2D), längs der Achse an der Ober- oder Unterkante; schräg dazu (Anteil
 * in der Ebene und längs der Achse, je 1/√2) an der näheren der beiden. Rückversatz von der Zellmitte je Richtung i.
 */
const MIRROR_EDGE = PLANE_A.map((s, i) => (s === 0 ? MIRROR_HALF_WIDTH : PLANE_K[i] < 0 ? MIRROR_HALF_HEIGHT
  : Math.min(MIRROR_HALF_WIDTH, MIRROR_HALF_HEIGHT) * Math.SQRT2));

/** Richtung k (0 … 7, wie DIRS) in der Drehebene eines Elements mit Achse axis. */
function planeDir(axis, k) {
  const [du, dv] = DIRS[mod8(k)], { u, v } = AXES[axis];
  return [du * u[0] + dv * v[0], du * u[1] + dv * v[1], du * u[2] + dv * v[2]];
}

/** Gegenstück zu planeDir: Index k der Richtung d in der Drehebene, −1 wenn d aus der Ebene herauszeigt. */
function planeIndex(axis, d) {
  const { a, u, v } = AXES[axis];
  if (dot3(d, a) !== 0) return -1;
  const du = dot3(d, u), dv = dot3(d, v);
  return DIRS.findIndex(([x, z]) => x === du && z === dv);
}

/** Vektor in der Drehebene der Achse mit Nummer A aus den Anteilen nu, nv der Ebenenbasis (etwa einer 2D-Normalen). */
function inPlane(A, nu, nv) {
  const { u, v } = AXES[AXIS_NAMES[A]];
  return [nu * u[0] + nv * v[0], nu * u[1] + nv * v[1], nu * u[2] + nv * v[2]];
}

/**
 * Spiegel im Würfel: Die Fläche enthält die Drehachse und die Ebenenrichtung rot. Der Anteil des Strahls in der
 * Drehebene wird wie in 2D gespiegelt (reflectOnMirror), der Anteil längs der Achse bleibt. Läuft der Strahl parallel
 * zur Fläche (Anteil in der Ebene parallel zur Spiegellinie oder null), trifft er die Rahmenkante: Rückgabe null.
 * Dieselbe Regel rechnet tracePass über die Nummern der Richtungen. d ist eine der 18 Richtungen (DIRS3).
 */
function reflect3(d, axis, rot) {
  const A = AXIS_IDS[axis], i = A * 18 + dirIndex(d, 'Spiegelung'), k = PLANE_K[i];
  const nk = k < 0 ? k : reflectOnMirror(k, rot);
  return nk === k ? null : DIRS3[FROM_PLANE[(A * 3 + PLANE_A[i] + 1) * 8 + nk]].slice();
}

/** Normale der Spiegelfläche (Einheitsvektor) auf der Seite des einfallenden Strahls: die 2D-Normale in der Drehebene. */
function mirrorFrontNormal3(axis, rot, d) {
  const A = AXIS_IDS[axis], k = PLANE_K[A * 18 + dirIndex(d, 'Spiegelnormale')];
  // längs der Achse (k < 0) steht der Strahl senkrecht auf jeder Normalen der Fläche: dann die der Stellung
  const n = k < 0 ? MIRROR_NORMALS[mod8(rot)] : mirrorFrontNormal(rot, k);
  return inPlane(A, n[0], n[1]);
}

/** Prisma im Würfel: fächert in seiner Drehebene wie in 2D; Licht, das schräg zur Ebene einfällt, tritt nicht aus. */
function refractInPrism3(d, color, axis, rot) {
  const k = planeIndex(axis, d);
  if (k < 0) return [];
  return refractInPrism(k, color, rot).map(o => ({ d: planeDir(axis, o.dir), color: o.color }));
}

/**
 * Spielzustand eines Würfel-Levels: wie createBoard, dazu Ebene y und Drehachse axis je Element. size ist die Kante der
 * Grundfläche (x, z), height die Zahl der Ebenen (y; ohne Angabe size, ein Würfel). Die Würfel-Level sind 7 × 7 × 5.
 */
function createBoard3(level) {
  const size = level.size || 5, height = level.height || size;
  if (size > MAX_SIZE_3D || height > MAX_SIZE_3D) throw new Error(`Level "${level.name}": Würfel grösser als ${MAX_SIZE_3D}`);
  const elements = level.elements.map((e, i) => {
    if (!ELEMENT_TYPES.includes(e.type)) throw new Error(`Level "${level.name}": unbekannter Typ "${e.type}"`);
    if (e.color && !COLORS[e.color]) throw new Error(`Level "${level.name}": unbekannte Farbe "${e.color}"`);
    if (e.axis && !AXES[e.axis]) throw new Error(`Level "${level.name}": unbekannte Achse "${e.axis}"`);
    return {
      id: i,
      type: e.type,
      x: e.x,
      y: e.y,
      z: e.z,
      axis: e.axis || 'y',
      rot: mod8(e.rot || 0),
      dir: mod8(e.dir || 0),
      color: COLORS[e.color || 'white'],
      fixed: !!e.fixed,
    };
  });
  const grid = new Array(size * size * height).fill(null); // Index (y · size + z) · size + x
  for (const el of elements) {
    const key = el.x + ',' + el.y + ',' + el.z;
    if (el.y === undefined) throw new Error(`Level "${level.name}": Element ${el.x},?,${el.z} ohne Ebene y`);
    if (![el.x, el.y, el.z].every((c, k) => Number.isInteger(c) && c >= 0 && c < (k === 1 ? height : size))) throw new Error(`Level "${level.name}": ${key} ausserhalb`);
    const i = (el.y * size + el.z) * size + el.x;
    if (grid[i]) throw new Error(`Level "${level.name}": Zelle ${key} doppelt belegt`);
    grid[i] = el;
  }
  return { dim: 3, size, height, elements, grid, name: level.name };
}

/**
 * Tabellen für tracePass, einmal aus denselben Regeln berechnet statt bei jedem Treffer (wie MIRROR_NORMALS), je
 * Achse A, Stellung r (0 … 7) und Richtung dir; die Einträge sind eingefroren, weil Strahlen sie teilen:
 *   MIRROR_FRONT[r · 8 + k]              mirrorFrontNormal(r, k) für k in der Ebene (flach)
 *   MIRROR_FRONT3[(A · 8 + r) · 8 + k]   dieselbe Normale in der Drehebene der Achse A (Würfel, mirrorFrontNormal3)
 *   PRISM_OUT[((A · 8 + r) · 18 + dir) · 8 + Farbe]  austretende Strahlen [{ dir, color }] aus refractInPrism in der
 *                                       Drehebene; leer, wenn das Licht schräg zur Ebene einfällt (refractInPrism3)
 * Die Spiegelung selbst rechnet tracePass bei jedem Treffer mit reflectOnMirror (die Gegenprobe des Golden-Tests
 * verändert sie).
 */
const MIRROR_FRONT = [], MIRROR_FRONT3 = [], PRISM_OUT = [];
for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) MIRROR_FRONT.push(Object.freeze(mirrorFrontNormal(r, k)));
for (let A = 0; A < 3; A++) for (let r = 0; r < 8; r++) {
  for (let k = 0; k < 8; k++) { const n = MIRROR_FRONT[r * 8 + k]; MIRROR_FRONT3.push(Object.freeze(inPlane(A, n[0], n[1]))); }
  for (let dir = 0; dir < 18; dir++) for (let color = 0; color < 8; color++) {
    const i = A * 18 + dir;
    const outs = PLANE_A[i] === 0 ? refractInPrism(PLANE_K[i], color, r) : [];
    PRISM_OUT.push(Object.freeze(outs.map(o => Object.freeze({ dir: FROM_PLANE[(A * 3 + 1) * 8 + o.dir], color: o.color }))));
  }
}

/**
 * Ein Durchlauf der Strahlverfolgung mit festen Kombinator-Ausgaben, für flache Level und Würfel. Ein flaches Brett
 * ist ein Würfel mit einer Ebene: y = 0, Drehachse y, Raster (z · size + x) wie die unterste Ebene des Würfels.
 * Segmente, Ereignisse und Normalen eines flachen Bretts haben kein y (siehe traceBeams). extraRays: flach
 * { x, z, dir, color }, im Würfel { x, y, z, d: [dx, dy, dz], color } mit einer der 18 Richtungen, sonst ein Fehler.
 * Trifft er auf ein Element mit offener Stellung (OPEN, nur beim Löser), hält er an und gibt { open, paused } zurück:
 * paused ist sein Zustand an dieser Stelle. Mit from = paused macht ein späterer Durchlauf dort weiter, auf einer
 * Kopie (der Löser setzt von dort aus jede Stellung).
 */
function tracePass(board, extraRays, emitting, from) {
  const cube = board.dim === 3, S = board.size, H = board.height;
  const units = cube ? UNIT_DIRS3 : UNIT_DIRS, backs = cube ? BACK_DIRS3 : BACK_DIRS;
  const segments = from ? from.segments.slice() : [];
  const events = from ? from.events.slice() : [];
  const hits = from ? new Map(from.hits) : new Map();
  const combinerInputs = new Map();
  if (from) for (const [id, v] of from.combinerInputs) combinerInputs.set(id, { color: v.color, dist: v.dist, first: v.first.slice() });
  // (Zelle, Richtung, Farbe): derselbe Strahl läuft nur einmal. Ein Feld ist bei so wenigen Strahlen schneller als ein
  // Set; MAX_SEGMENTS begrenzt seine Länge.
  const seen = from ? from.seen.slice() : [];
  const queue = from ? from.queue.slice() : [];
  let truncated = from ? from.truncated : false;
  // Anhalten am offenen Element: beim Abschicken der Startstrahlen (start: Index des Elements, head -1) oder im Strahl
  // queue[head] in der Zelle (cx, cy, cz) des Elements
  const pause = (open, start, head, cx, cy, cz) =>
    ({ open, paused: { segments, events, hits, combinerInputs, seen, queue, truncated, start, head, cx, cy, cz } });

  // Einziger Weg, einen Strahl abzuschicken: hier greifen Schleifen- und Abprallschutz für alle Elemente.
  const pushRay = (ray) => {
    if (ray.color === 0) return; // kein Licht mehr übrig
    // Strahlen starten in Zellen (ganzzahlig, Kantenlänge ≤ 64)
    const key = (((ray.y * 64 + ray.x) * 64 + ray.z) * 18 + ray.dir) * 8 + ray.color;
    // Schon unterwegs: zwei Strahlen laufen zusammen oder eine Schleife schliesst sich. Die Fortsetzung
    // wäre identisch, es geht also nichts verloren – kein Abbruch, das Ergebnis bleibt exakt.
    if (seen.includes(key)) return;
    if (ray.bounces > MAX_BOUNCES) { truncated = true; return; }
    seen.push(key);
    queue.push(ray);
  };
  // Startstrahl eines Elements (Quelle, Ausgang eines Kombinators): dir zählt in seiner Drehebene
  const emitter = (el, color, dist) => {
    const dir = cube ? FROM_PLANE[(AXIS_IDS[el.axis] * 3 + 1) * 8 + el.dir] : el.dir;
    pushRay({ x: el.x, y: cube ? el.y : 0, z: el.z, dir, color, dist, bounces: 0, n0: units[dir] });
  };

  if (!from || from.head < 0) {
    const els = board.elements;
    for (let i = from ? from.start : 0; i < els.length; i++) {
      const el = els[i];
      if (el.type === 'source') emitter(el, el.color, 0);
      if (el.type === 'combiner' && emitting.has(el.id)) {
        if (el.dir === OPEN) return pause(el, i, -1);
        const e = emitting.get(el.id);
        emitter(el, e.color, e.dist);
      }
    }
    for (const r of extraRays) {
      if (!cube) { pushRay({ y: 0, dist: 0, bounces: 0, n0: unitDir(r.dir), ...r, dir: mod8(r.dir) }); continue; }
      const dir = dirIndex(r.d, 'Startstrahl');
      pushRay({ dist: 0, bounces: 0, n0: UNIT_DIRS3[dir], ...r, dir });
    }
  }

  // Die Schleife läuft beim Lösen millionenfach: bewusst ohne Destrukturierung, Objekt-Spread und Math.hypot, die hier
  // messbar langsamer sind.
  for (let head = from && from.head >= 0 ? from.head : 0; head < queue.length; head++) {
    if (segments.length >= MAX_SEGMENTS) { truncated = true; break; }
    const ray = queue[head];
    const step = DIRS3[ray.dir], dx = step[0], dy = step[1], dz = step[2];
    let cx = ray.x, cy = ray.y, cz = ray.z;
    // Weitermachen am angehaltenen Element: eine Zelle davor beginnen, der erste Schritt trifft es (dazwischen ist leer)
    if (from && head === from.head) { cx = from.cx - dx; cy = from.cy - dy; cz = from.cz - dz; }

    const ahead = UNIT_DIRS3[ray.dir];
    // Abschnitt bis (x1, y1, z1); im flachen Feld ist y überall 0 und fehlt in der Ausgabe
    const emit = (x1, y1, z1, n1 = backs[ray.dir], fade) => {
      const lx = x1 - ray.x, ly = y1 - ray.y, lz = z1 - ray.z;
      const length = Math.sqrt(lx * lx + ly * ly + lz * lz);
      if (length > 1e-6) {
        const seg = cube
          ? { x0: ray.x, y0: ray.y, z0: ray.z, x1, y1, z1, color: ray.color, dist0: ray.dist, length, n0: ray.n0, n1 }
          : { x0: ray.x, z0: ray.z, x1, z1, color: ray.color, dist0: ray.dist, length, n0: ray.n0, n1 };
        if (fade) seg.fade = fade;
        segments.push(seg);
      }
      return ray.dist + length;
    };
    const next = (dir, color, d) =>
      pushRay({ x: cx, y: cy, z: cz, dir, color, dist: d, bounces: ray.bounces + 1, n0: units[dir] });
    // Licht endet an der Vorderseite eines Körpers, back vor der Zellmitte
    const absorbAt = (back, el) => {
      const x = cx - ahead[0] * back, y = cy - ahead[1] * back, z = cz - ahead[2] * back;
      const d = emit(x, y, z);
      events.push(cube ? { x, y, z, color: ray.color, kind: 'absorb', dist: d, element: el.id }
        : { x, z, color: ray.color, kind: 'absorb', dist: d, element: el.id });
    };

    for (;;) {
      const nx = cx + dx, ny = cy + dy, nz = cz + dz;
      if (dy < 0 && ny < 0) {
        // Würfel: nach unten endet der Strahl auf der Plattform (Oberkante eine halbe Zelle unter der untersten Ebene)
        const fx = cx + dx * 0.5, fy = cy - 0.5, fz = cz + dz * 0.5;
        const d = emit(fx, fy, fz);
        events.push({ x: fx, y: fy, z: fz, color: ray.color, kind: 'floor', dist: d });
        break;
      }
      if (nx < 0 || nz < 0 || nx >= S || nz >= S || (dy !== 0 && ny >= H)) {
        // über die Feldkante hinaus in die Ferne laufen lassen; dort blendet der Shader den Strahl weich aus
        const ex = cx + dx * 0.5 + ahead[0] * EDGE_RUN, ey = cy + dy * 0.5 + ahead[1] * EDGE_RUN;
        const ez = cz + dz * 0.5 + ahead[2] * EDGE_RUN;
        const d = emit(ex, ey, ez, undefined, EDGE_RUN);
        events.push(cube ? { x: ex, y: ey, z: ez, color: ray.color, kind: 'edge', dist: d }
          : { x: ex, z: ez, color: ray.color, kind: 'edge', dist: d });
        break;
      }
      cx = nx; cy = ny; cz = nz;
      const el = board.grid[(cy * S + cz) * S + cx];
      if (!el) continue;

      if (el.type === 'mirror') {
        if (el.rot === OPEN) return pause(el, 0, head, cx, cy, cz);
        // Der Anteil in der Drehebene spiegelt wie in 2D, der Anteil längs der Achse bleibt (reflect3)
        const A = cube ? AXIS_IDS[el.axis] : 0, i = A * 18 + ray.dir, k = PLANE_K[i];
        const nk = k < 0 ? k : reflectOnMirror(k, el.rot);
        if (nk === k) {
          // Parallel zur Fläche: Der Strahl trifft die Rahmenkante und wird geschluckt.
          absorbAt(MIRROR_EDGE[i], el);
          break;
        }
        const r = el.rot & 7, normal = cube ? MIRROR_FRONT3[(A * 8 + r) * 8 + k] : MIRROR_FRONT[r * 8 + k];
        const d = emit(cx, cy, cz, normal);
        events.push(cube ? { x: cx, y: cy, z: cz, color: ray.color, kind: 'reflect', dist: d, normal }
          : { x: cx, z: cz, color: ray.color, kind: 'reflect', dist: d, normal });
        const nd = FROM_PLANE[(A * 3 + PLANE_A[i] + 1) * 8 + nk];
        pushRay({ x: cx, y: cy, z: cz, dir: nd, color: ray.color, dist: d, bounces: ray.bounces + 1, n0: normal });
        break;
      }

      if (el.type === 'prism') {
        if (el.rot === OPEN) return pause(el, 0, head, cx, cy, cz);
        const d = emit(cx, cy, cz);
        // fächert in seiner Drehebene wie in 2D; schräg zur Ebene tritt kein Licht aus (refractInPrism3)
        const A = cube ? AXIS_IDS[el.axis] : 0;
        const outs = PRISM_OUT[((A * 8 + (el.rot & 7)) * 18 + ray.dir) * 8 + ray.color];
        const kind = outs.length ? 'refract' : 'absorb';
        events.push(cube ? { x: cx, y: cy, z: cz, color: ray.color, kind, dist: d, element: el.id }
          : { x: cx, z: cz, color: ray.color, kind, dist: d, element: el.id });
        for (let o = 0; o < outs.length; o++) next(outs[o].dir, outs[o].color, d);
        break;
      }

      if (el.type === 'filter') {
        const d = emit(cx, cy, cz);
        const passed = ray.color & el.color, color = passed || ray.color, kind = passed ? 'filter' : 'absorb';
        events.push(cube ? { x: cx, y: cy, z: cz, color, kind, dist: d, element: el.id }
          : { x: cx, z: cz, color, kind, dist: d, element: el.id });
        next(ray.dir, passed, d); // Farbe 0 wird in pushRay verworfen
        break;
      }

      if (el.type === 'combiner') {
        const d = emit(cx, cy, cz);
        // Ausgang startet, sobald jede beteiligte Grundfarbe erstmals da ist: späteste der frühesten
        // Ankünfte je Grundfarbe – so verzögern Rückkopplungen über den eigenen Ausgang nichts.
        // first[b]: früheste Ankunft der Grundfarbe 1 << b (Rot, Grün, Blau)
        let inp = combinerInputs.get(el.id);
        if (!inp) combinerInputs.set(el.id, inp = { color: 0, dist: 0, first: [Infinity, Infinity, Infinity] });
        inp.color |= ray.color;
        let dist = -Infinity;
        for (let b = 0; b < 3; b++) {
          if (ray.color >> b & 1 && d < inp.first[b]) inp.first[b] = d;
          if (inp.color >> b & 1 && inp.first[b] > dist) dist = inp.first[b];
        }
        inp.dist = dist;
        events.push(cube ? { x: cx, y: cy, z: cz, color: ray.color, kind: 'merge', dist: d, element: el.id }
          : { x: cx, z: cz, color: ray.color, kind: 'merge', dist: d, element: el.id });
        break;
      }

      if (el.type === 'target') {
        const d = emit(cx, cy, cz);
        hits.set(el.id, (hits.get(el.id) || 0) | ray.color);
        events.push(cube ? { x: cx, y: cy, z: cz, color: ray.color, kind: 'hit', dist: d, target: el.id }
          : { x: cx, z: cz, color: ray.color, kind: 'hit', dist: d, target: el.id });
        break;
      }

      absorbAt(0.32, el); // Quelle und Blocker schlucken das Licht an ihrer Vorderseite.
      break;
    }
  }
  return { segments, events, hits, combinerInputs, truncated };
}

/**
 * Die Level (Format und Inhalt in src/daten/level.js, seit Ticket 06 von .scratch/umbau/): zuerst die Übungen im Dorf
 * (UEBUNGEN, tutorial: true), dann die Level der Reihe (FLACH).
 */
const LEVELS = [...UEBUNGEN, ...FLACH];
/** Anzahl Tutorial-Level (sie stehen am Anfang von LEVELS). */
const TUTORIAL_COUNT = LEVELS.filter(l => l.tutorial).length;

/*
 * Führung im Dorf (Spec .scratch/tutorial-fuehrung/, Richtung C «Vorzeigen»): Eine Übung hat statt des Hinweises
 * höchstens SCHRITTE_MAX Schritte { text, bei, weiter, richtung?, trifft?, farbe? }. text: der Schlüssel seines Satzes
 * in der Übersetzungsschicht (src/texte/, seit Ticket 07 von .scratch/umbau/): ein oder zwei kurze Sätze im Du, mit
 * Platzhaltern je Gerät ({Tippe}, {Drücke lang}; Bereich geraet der Sprachdatei). bei: Zelle "x,z" des Elements
 * (oder mehrere), auf dem der Lichtkegel liegt; bei einem Handlungsschritt reagieren nur sie (Sperre, seit .scratch/tutorial-neu/). weiter: was
 * den Schritt weiterschaltet (SCHRITT_WEITER); richtung: bei «drehen» nur diese Richtung (−1: zurück, langes Drücken
 * bzw. Rechtsklick). trifft: bei «strahl» die Zelle, die der Strahl treffen soll, wenn es nicht das Element bei ist; bei
 * ist dann das Element, das dafür zu drehen ist (Lichtkegel und Hand dort, die Geste nach richtung, die hier nichts
 * einschränkt). farbe: bei «strahl» zählt nur Licht, das dort genau diese Farbe mischt (COLORS; am Kombinator seine
 * Mischung, sonst die Treffer). Der letzte Schritt ist eine Handlung und endet erst mit dem Lösen. Die Führung selbst
 * (Band, Lichtkegel, Hand) steht bei der Oberfläche (fuehrung).
 */
const SCHRITTE_MAX = 4;
/**
 * Was einen Schritt weiterschaltet: erklaerung (der Knopf «Weiter» am Satz, nie Zeit oder eine Drehung), antippen (das
 * Element antippen: ein drehbares dreht sich dabei, ein festes weigert sich), drehen (das Element drehen), strahl (der
 * Strahl trifft das Element bei bzw. trifft).
 */
const SCHRITT_WEITER = ['erklaerung', 'antippen', 'drehen', 'strahl'];
/**
 * Hinweise nebenbei: warten auf nichts, zählen nicht zu den Schritten, verschwinden bei der ersten Benutzung oder
 * spätestens mit dem Lösen und kommen beim Neustart derselben Übung nicht wieder. text: der Schlüssel des Satzes in
 * der Übersetzungsschicht, je Gerät { touch, maus }. Den Satz zum neustart sagt sie ohne Ort: Der Knopf steht am
 * Desktop unten rechts, auf dem Handy hochkant unten in der Reihe, quer rechts in der Mitte (Ticket 02 von
 * .scratch/tutorial-neu/; bisher «rechts am Rand», das passte hochkant nicht).
 */
const NEBENBEI = {
  kamera: { text: 'fuehrung.nebenbei.kamera' },
  neustart: { text: 'fuehrung.nebenbei.neustart' },
};
/** Zellen eines Schritts (bei als Zelle oder Liste). */
const schrittZellen = (s) => (s.bei === undefined ? [] : [].concat(s.bei));
const zelleVon = (el) => `${el.x},${el.z}`;
/**
 * Geste, die die Hand vorzeigt: tippen, zurueck (langes Drücken bzw. Rechtsklick) oder null (Erklärung, Strahl auf das
 * Element selbst). Ein Strahl mit trifft zeigt sie am Element bei, das zu drehen ist.
 */
function schrittGeste(s) {
  if (s.weiter !== 'antippen' && s.weiter !== 'drehen' && !(s.weiter === 'strahl' && s.trifft)) return null;
  return s.richtung === -1 ? 'zurueck' : 'tippen';
}
/** Trifft ein Strahl das Element el (Ergebnis von traceBeams)? Spiegel: wo er spiegelt oder an der Kante schluckt. */
function strahlTrifft(result, el) {
  if (!el) return false;
  if (result.hits.has(el.id)) return true;
  return result.events.some((ev) => ev.element === el.id || ev.target === el.id
    || (ev.kind === 'reflect' && ev.y === undefined && ev.x === el.x && ev.z === el.z));
}
/** Farbe (Bitmaske wie COLORS), die am Element el ankommt: am Kombinator seine Mischung, sonst die Treffer. */
const lichtBei = (result, el) => (el.type === 'combiner' ? result.mixes.get(el.id) : result.hits.get(el.id)) ?? 0;
/**
 * Schaltet das Ereignis e den Schritt s weiter? e: { art: 'weiter' } (Knopf), { art: 'angetippt', el } (ein festes
 * Element weigert sich), { art: 'gedreht', el, delta }, { art: 'strahl', board, result } (nach jeder neuen Rechnung).
 */
function schrittErfuellt(s, e) {
  const zellen = schrittZellen(s), bei = (el) => !!el && zellen.includes(zelleVon(el));
  switch (s.weiter) {
    case 'erklaerung': return e.art === 'weiter';
    case 'antippen': return (e.art === 'angetippt' || e.art === 'gedreht') && bei(e.el);
    case 'drehen': return e.art === 'gedreht' && bei(e.el) && (!s.richtung || Math.sign(e.delta) === s.richtung);
    case 'strahl': return e.art === 'strahl' && (s.trifft === undefined ? zellen : [s.trifft]).some((z) => {
      const el = e.board.elements.find((x) => zelleVon(x) === z);
      return strahlTrifft(e.result, el) && (!s.farbe || lichtBei(e.result, el) === COLORS[s.farbe]);
    });
    default: return false;
  }
}
/**
 * Sperre (Spec .scratch/tutorial-neu/, «Strikte Führung»): Darf das Element el im Schritt s reagieren (drehen, als
 * festes angetippt werden)? Bei einem Handlungsschritt nur die Elemente bei, bei einer Erklärung keines. Alle anderen
 * weigern sich wie feste (weigern), auch drehbare.
 */
const schrittErlaubt = (s, el) => !!s && s.weiter !== 'erklaerung' && schrittZellen(s).includes(zelleVon(el));

/**
 * Würfel-Level (Format und Inhalt in src/daten/level.js, WUERFEL), getrennt von LEVELS, damit die Werkzeuge der
 * Levelliste (tools/ordne-level.mjs) unberührt bleiben.
 */
const LEVELS_3D = [...WUERFEL];

/**
 * Noas Geschichte: je Grad die 6 Welten in der Reihenfolge der Kapitel (STORY_CHAPTERS), je mit den Schlüsseln (name)
 * ihrer 10 Level (src/daten/level.js, REISE).
 */
const STORY_LEVELS = REISE;

/*
 * Ruhe-Bildrate (Spec .scratch/energie/, Tickets 01 und 02; ADR 0009): Das Level zeichnet in Ruhe nur 30 Bilder/s,
 * in jeder Welt, bei jeder Eingabe und jeder Bewegung sofort wieder den Takt des Spiels. ?ruhetakt=<n> wählt einen
 * anderen Wert (ab 20), ?ruhetakt=aus oder =60 schaltet sie aus (stetig 60 wie unter ADR 0008). Hier nur die
 * Entscheidung (tests/logic.test.mjs), was Ruhe ist, liest frameRate.ruhe aus der Szene.
 */
const RUHE_NACH_MS = 1500; // so lange nach der letzten Eingabe oder Bewegung (sceneLoop.wake) noch der volle Takt
const RUHE_MIN_FPS = 20;   // darunter wäre ein Zeitschritt länger als MAX_DT (0,05 s): Animationen liefen langsamer
const RUHE_FPS = 30;       // Standard (Entscheid des Nutzers, 15.11.2026: auf dem Poco 30–35 % weniger Strom im Level)
/**
 * Wert von ?ruhetakt (Text oder null) → Bilder/s in Ruhe, oder null (Ruhe-Bildrate aus). Ohne Schalter oder
 * unbrauchbar RUHE_FPS, unter 20 dann 20; «aus» oder nicht unter spielFps (?ruhetakt=60, mit ?takt=30 auch der
 * Standard): aus.
 */
function ruhetaktAus(wert, spielFps) {
  const text = wert === null || wert === undefined ? '' : String(wert).trim().toLowerCase();
  if (text === 'aus') return null;
  const n = Math.round(Number(text));
  const fps = text === '' || !Number.isFinite(n) || n <= 0 ? RUHE_FPS : Math.max(RUHE_MIN_FPS, n);
  return fps < spielFps ? fps : null;
}
/**
 * Ruht das Level? z: { ruheFps (ruhetaktAus), spiel (flow 'play', weder Menü noch Bühne), seitAnstoss (ms seit der
 * letzten Eingabe oder Bewegung), bewegt (etwas, das man anschaut, bewegt sich: Text oder false) }.
 */
function ruhtJetzt(z) {
  return z.ruheFps !== null && z.spiel && z.seitAnstoss >= RUHE_NACH_MS && !z.bewegt;
}
/**
 * Angestrebte Bilder/s (frameRate.fps) und ihr Grund (Leistungsanzeige). z: { verdeckt (hinter der einblendenden
 * Bühne), geschichte, himmel (Blick im Himmel), menue, ruht (ruhtJetzt), spielFps, storyFps, skyFps, ruheFps }.
 */
function bildrate(z) {
  if (z.verdeckt) return Math.min(30, z.spielFps);
  if (z.geschichte) return Math.max(z.storyFps, z.spielFps);
  if (z.himmel) return z.skyFps;
  if (z.ruht && !z.menue && z.ruheFps !== null) return z.ruheFps;
  return z.spielFps;
}
function bildrateGrund(z) {
  if (z.verdeckt) return 'hinter der Bühne';
  if (z.geschichte) return 'Geschichte';
  if (z.himmel) return 'Himmel (Menü)';
  if (z.menue) return 'Menü';
  // ?takt=30 zeichnet ohnehin stetig 30: Dort ist die Ruhe-Bildrate nicht ausgeschaltet, sondern unnötig
  if (z.ruheFps === null && z.spielFps > RUHE_FPS) return 'Spiel (Ruhe aus)';
  return z.ruht ? 'Ruhe' : 'Spiel';
}

export {
  DIRS, COLORS, COLOR_NAMES, MAX_BOUNCES, MAX_SEGMENTS, ELEMENT_TYPES, mod8, UNIT_DIRS, unitDir, reflectOnMirror,
  EDGE_RUN, MIRROR_HALF_WIDTH, dirToRotationY, createBoard, MIRROR_NORMALS, mirrorFrontNormal, OPEN, isRotatable,
  pickTapped, primariesOf, PRISM_MAX_BEND, refractInPrism, traceBeams, AXES, MAX_SIZE_3D, MIRROR_HALF_HEIGHT, dot3,
  unit3, DIRS3, DIR_OF_CODE, dirOf, dirIndex, UNIT_DIRS3, BACK_DIRS, BACK_DIRS3, AXIS_NAMES, AXIS_IDS, PLANE_K,
  PLANE_A, FROM_PLANE, MIRROR_EDGE, planeDir, planeIndex, inPlane, reflect3, mirrorFrontNormal3, refractInPrism3,
  createBoard3, MIRROR_FRONT, MIRROR_FRONT3, PRISM_OUT, tracePass, LEVELS, TUTORIAL_COUNT, SCHRITTE_MAX,
  SCHRITT_WEITER, NEBENBEI, schrittZellen, zelleVon, schrittGeste, strahlTrifft,
  lichtBei, schrittErfuellt, schrittErlaubt, LEVELS_3D, STORY_LEVELS, RUHE_NACH_MS, RUHE_MIN_FPS, RUHE_FPS,
  ruhetaktAus, ruhtJetzt, bildrate, bildrateGrund,
};
