/* SPIELLOGIK ===========================================================
   Reine Rasterlogik ohne Three.js: 2D-Feld und Würfel-Level, ein Durchlauf für beide (tracePass).

   Modul (Ticket 03 von .scratch/umbau/, bis dahin der Bereich LOGIC in index.html): Die Seite (src/seite/…, seit
   Ticket 04), Tests und Werkzeuge importieren es (tools/solver.mjs, tests/logic.test.mjs). Tests und Werkzeuge führen
   es auch als Text aus, etwa mit weiteren Leveln (tools/seitenmodule.mjs: zerlege, ausText; die KI-Tester bauen das
   Spiel mit einer solchen Logik). Darum hier kein import und als einziges export der Block am Schluss, mit allen
   Namen der obersten Ebene (tests/logic.test.mjs prüft das). Kein Bezug auf Namen der Seite (Node lädt das Modul
   allein).
   Die Level stehen zwischen LEVELS:BEGIN und LEVELS:END, WUERFEL:BEGIN und WUERFEL:END, GESCHICHTE:BEGIN und
   GESCHICHTE:END; dorthin schreiben tools/ordne-level.mjs, tools/ordne-wuerfel.mjs, tools/geschichte.mjs und
   tools/vorrat.mjs.

   Koordinaten: x = Spalte (nach rechts), z = Zeile (zum Betrachter hin).
   Richtungen in 45°-Schritten, Winkel von +x Richtung +z gemessen:
     0 = Ost, 1 = Südost, 2 = Süd, 3 = Südwest, 4 = West, 5 = Nordwest, 6 = Nord, 7 = Nordost
   Farben als RGB-Bitmaske: Rot = 1, Grün = 2, Blau = 4 (Weiss = 7), damit
   Filtern (AND) und additives Mischen (OR) trivial werden.
   ===================================================================== */

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
 * Level-Definitionen. Format:
 *   { name, grad?, size?, tutorial?, schritte?, nebenbei?, elements: [{ type, x, z, dir?, rot?, color?, fixed? }],
 *     solution }
 *   grad:     Schwierigkeitsgrad jedes Levels nach dem Tutorial: 'leicht', 'mittel', 'schwer' oder 'sehr schwer'
 *             (Kopfzeile, Kachel und Seitentitel zeigen ihn, GRAD_ANZEIGE)
 *   source:   dir = Abstrahlrichtung, color (Standard Weiss)
 *   mirror:   rot = Winkel der Spiegelfläche (drehbar; rot und rot + 4 wirken gleich)
 *   prism:    rot = Richtung der Austrittsfläche = Richtung des Farbfächers (drehbar)
 *   filter:   color = durchgelassene Farbe(n)
 *   combiner: dir = Ausgangsrichtung (drehbar)
 *   blocker:  schluckt Licht
 *   target:   color = benötigte Farbe
 *   fixed:    Element ist nicht drehbar
 *   tutorial: Lern-Level am Anfang (die Übungen im Dorf); schritte ist ihre Führung (höchstens SCHRITTE_MAX,
 *             { text, bei, weiter, richtung?, trifft?, farbe? }, siehe SCHRITT_WEITER), dazu nebenbei: Hinweise nebenbei
 *             (NEBENBEI). Einen Hinweis (hint) haben sie seit Ticket 03 der Führung nicht mehr
 *   solution: { "x,z": rot bzw. dir } für jedes drehbare Element – die einzige Lösung.
 *             Die Elemente stehen zu Beginn in ihrer Startstellung (nie bereits gelöst).
 * Zuerst das Tutorial, seit .scratch/tutorial-neu/ vier Übungen: Erstes Licht (Ziel, Spiegel, drehbar und fest),
 * Brechung (Block, Prisma), Farbenlehre (Filter, farbige Quellen, Ring am Ziel), Mischung (Mischen am Ziel, Kombinator).
 * Ihre Bretter lassen die beiden untersten Reihen frei (dort liegt auf dem Handy das Band der Führung).
 * Danach die 150 Level nach der Schwierigkeit aus der Beurteilung, mit ihrem Grad (Ticket 15) – Elemente und Farben
 * mischen sich frei. tools/ordne-level.mjs ordnet sie zwischen den Markierungen und setzt den Grad; die Kommentare
 * je Level nennen die Herkunft (alte Wertung und Profil der Werkzeuge bis Ticket 21, Seed).
 * Die Tests prüfen mit dem Löser (tools/solver.mjs), dass jede notierte Lösung stimmt und eindeutig ist.
 */
const LEVELS = [
  {
    // Lösung: Spiegel (2,4) rot 3 – Ost → Nord; fester Spiegel (2,1) – Nord → Ost; Spiegel (5,1) rot 1 – Ost → Süd
    //   → Ziel (5,4). Neu mit Ticket 01 von .scratch/tutorial-neu/ (vier Schritte, strikte Führung): zuerst das Ziel,
    //   dann Tippen dreht (der vordere Spiegel wirft das Licht zu Beginn zurück, ein Tippen schickt es zum festen),
    //   dann den festen Spiegel antippen (er wackelt), zuletzt rund gegen eckig und zurückdrehen: Der hintere Spiegel
    //   steht eine Stufe zu weit (rot 2 = 1 + 1), langes Drücken löst die Übung. Zwischen dem festen Spiegel und den
    //   drehbaren liegt mindestens ein Feld.
    name: 'Erstes Licht', tutorial: true,
    schritte: [
      { text: 'Bring das Licht zum Kristall. Es läuft geradeaus, Spiegel lenken es um.', bei: '5,4',
        weiter: 'erklaerung' },
      { text: '{Tippe} den Spiegel an. Er dreht sich und lenkt das Licht weiter.', bei: '2,4',
        weiter: 'strahl', trifft: '2,1' },
      { text: '{Tippe} den Spiegel auf dem eckigen Sockel an und schau, was passiert.', bei: '2,1',
        weiter: 'antippen' },
      { text: 'Eckige Sockel stehen fest, runde drehen sich. {Drücke lang} auf diesen Spiegel, dann dreht er zurück.',
        bei: '5,1', weiter: 'drehen', richtung: -1 },
    ],
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'target', x: 5, z: 4, color: 'white' },
    ],
    solution: { '2,4': 3, '5,1': 1 },
  },
  {
    // Lösung: Spiegel (2,4) rot 1 – Süd → Ost; Prisma (4,4) rot 7 – Fächer nach Nordost: Rot → Nord → Ziel (4,1),
    //   Grün → Nordost → Ziel (6,2), Blau → Ost → Ziel (6,4). Neu mit Ticket 02 von .scratch/tutorial-neu/ (vier
    //   Schritte): Zu Beginn wirft der Spiegel das Licht nach Westen in den Block (0,4), der erste Schritt erklärt ihn.
    //   Zwei Tippen (über «zurück zur Lampe») schicken es nach Osten ins Prisma; dort fächert es zuerst falsch auf (rot 6:
    //   Grün und Blau treffen die falschen Kristalle), ein Tippen löst. Unten (z = 5, 6) steht nichts: Dort liegt auf dem
    //   Handy quer und bei 360 × 640 das Band. Nebenbei Kamera und Neustart.
    name: 'Brechung', tutorial: true,
    schritte: [
      { text: 'Durch einen Block kommt kein Licht. Er schluckt alles, was ihn trifft.', bei: '0,4',
        weiter: 'erklaerung' },
      { text: '{Tippe} den Spiegel, bis das Licht beim Prisma ankommt.', bei: '2,4', weiter: 'strahl', trifft: '4,4' },
      { text: 'Ein Prisma teilt weisses Licht in Rot, Grün und Blau.', bei: '4,4', weiter: 'erklaerung' },
      { text: '{Tippe} das Prisma, bis jede Farbe den Kristall in ihrer Farbe trifft.', bei: '4,4', weiter: 'drehen' },
    ],
    nebenbei: ['kamera', 'neustart'],
    elements: [
      { type: 'source', x: 2, z: 1, dir: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 3 },
      { type: 'blocker', x: 0, z: 4 },
      { type: 'prism', x: 4, z: 4, rot: 6 },
      { type: 'target', x: 4, z: 1, color: 'red' },
      { type: 'target', x: 6, z: 2, color: 'green' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
    ],
    solution: { '2,4': 1, '4,4': 7 },
  },
  {
    // Lösung: Grünfilter (2,2) – aus Weiss wird Grün; Spiegel (4,2) rot 3 – Ost → Nord → Ziel (4,0); die rote Lampe
    //   (6,1) – Süd; Spiegel (6,4) rot 3 – Süd → West → Ziel (4,4). Neu mit Ticket 02 von .scratch/tutorial-neu/ (vier
    //   Schritte): Zu Beginn fällt das Grün auf den roten Kristall (4,4) und flackert in seinem Ring, wenn der zweite
    //   Schritt den Ring erklärt; das Rot läuft am Ostrand hinaus. Zuerst kommt das Grün an seinen Platz (zwei Tippen),
    //   erst dann das Rot: Andersherum mischten sich auf dem roten Kristall beide Farben. Unten (z = 5, 6) steht nichts.
    name: 'Farbenlehre', tutorial: true,
    schritte: [
      { text: 'Ein Filter lässt nur seine eigene Farbe durch. Aus dem weissen Licht wird hier Grün.', bei: '2,2',
        weiter: 'erklaerung' },
      { text: 'Am Ring siehst du, welche Farbe ein Kristall braucht. Eine falsche Farbe flackert darin.',
        bei: ['4,4', '4,0'], weiter: 'erklaerung' },
      { text: '{Tippe} den Spiegel, bis das Grün beim grünen Kristall ankommt.', bei: '4,2', weiter: 'strahl',
        trifft: '4,0', farbe: 'green' },
      { text: 'Die andere Lampe leuchtet von selbst rot. {Tippe} ihren Spiegel, bis Rot beim roten Kristall ankommt.',
        bei: '6,4', weiter: 'drehen' },
    ],
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'filter', x: 2, z: 2, color: 'green' },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'target', x: 4, z: 0, color: 'green' },
      { type: 'target', x: 4, z: 4, color: 'red' },
      { type: 'source', x: 6, z: 1, dir: 2, color: 'red' },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
    ],
    solution: { '4,2': 3, '6,4': 3 },
  },
  {
    // Lösung: Spiegel (3,1) rot 1 – Rot von West → Süd → Ziel (3,3), dort mit dem Blau von West zu Magenta gemischt;
    //   Kombinator (5,2) dir 0 – mischt Rot von Nord und Blau von Süd zu Magenta → Ost → Ziel (6,2). Neu mit Ticket 02
    //   von .scratch/tutorial-neu/ (vier Schritte): zuerst Mischen am Ziel (zu Beginn läuft das Rot oben hinaus, nur
    //   Blau kommt an; zwei Tippen), dann der Kombinator, der schon beide Farben mischt (ein Tippen). Zwei rote und zwei
    //   blaue Lampen, damit beide Arten zu mischen dieselbe Farbe ergeben. Unten (z = 5, 6) steht nichts.
    name: 'Mischung', tutorial: true,
    schritte: [
      { text: 'Dieser Kristall braucht Magenta. Das entsteht, wenn Rot und Blau ihn zusammen treffen.', bei: '3,3',
        weiter: 'erklaerung' },
      { text: '{Tippe} den Spiegel, bis Rot und Blau zusammen beim Kristall ankommen.', bei: '3,1', weiter: 'strahl',
        trifft: '3,3', farbe: 'magenta' },
      { text: 'Der Kombinator mischt alles Licht, das hineinfällt, und schickt es als einen Strahl weiter.', bei: '5,2',
        weiter: 'erklaerung' },
      { text: '{Tippe} den Kombinator, bis sein Magenta beim zweiten Kristall ankommt.', bei: '5,2', weiter: 'drehen' },
    ],
    elements: [
      { type: 'source', x: 0, z: 1, dir: 0, color: 'red' },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'blue' },
      { type: 'target', x: 3, z: 3, color: 'magenta' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 5, z: 4, dir: 6, color: 'blue' },
      { type: 'combiner', x: 5, z: 2, dir: 7 },
      { type: 'target', x: 6, z: 2, color: 'magenta' },
    ],
    solution: { '3,1': 1, '5,2': 0 },
  },
  /* LEVELS:BEGIN */
  {
    // Lösung: Spiegel (2,3) rot 1 · Prisma (2,2) rot 7 · Spiegel (4,0) rot 0
    // Generator leicht, Seed 10013 · Ausbau „leicht“
    name: 'Wasserfarbe', titel: 'Moospolster', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'prism', x: 2, z: 2, rot: 6 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'target', x: 4, z: 2, color: 'blue' },
      { type: 'target', x: 5, z: 1, color: 'green' },
      { type: 'target', x: 2, z: 1, color: 'red' },
    ],
    solution: { '2,3': 1, '2,2': 7, '4,0': 0 },
  },
  {
    // Lösung: Prisma (5,5) rot 5 · Spiegel (5,6) rot 1 · Spiegel (2,3) rot 0
    // Generator leicht-sammelstelle, Seed 10091 · Ausbau „leicht“
    name: 'Lichtblick', titel: 'Farnwedel', grad: 'leicht',
    elements: [
      { type: 'prism', x: 5, z: 5, rot: 7 },
      { type: 'source', x: 6, z: 4, dir: 3, color: 'blue' },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'green' },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'target', x: 5, z: 1, color: 'blue' },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'source', x: 0, z: 5, dir: 7, color: 'yellow' },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 5, rot: 2, fixed: true },
      { type: 'target', x: 3, z: 6, color: 'yellow' },
    ],
    solution: { '5,5': 5, '5,6': 1, '2,3': 0 },
  },
  {
    // Lösung: Spiegel (4,1) rot 3 · Spiegel (4,3) rot 3
    // Wertung 12.8 · 2 drehbar · 2 Ziele · Rateschritte 5 · Profil 1-filter, Seed 2
    name: 'Umlenkung', titel: 'Tannenzapfen', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 4, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'filter', x: 5, z: 1, color: 'cyan' },
      { type: 'filter', x: 4, z: 5, color: 'magenta' },
      { type: 'target', x: 2, z: 3, color: 'cyan' },
      { type: 'target', x: 5, z: 3, color: 'magenta' },
    ],
    solution: { '4,1': 3, '4,3': 3 },
  },
  {
    // Lösung: Spiegel (3,5) rot 1 · Spiegel (5,5) rot 3 · Spiegel (5,4) rot 1
    // Wertung 13.7 · 3 drehbar · 2 Ziele · Rateschritte 6 · Kapitel II Gegenlicht
    name: 'Tönung', titel: 'Waldweg', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 3, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 3, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'target', x: 2, z: 2, color: 'white' },
      { type: 'target', x: 6, z: 5, color: 'white' },
    ],
    solution: { '3,5': 1, '5,5': 3, '5,4': 1 },
  },
  {
    // Lösung: Prisma (3,4) rot 6 · Spiegel (1,2) rot 0 · Spiegel (5,2) rot 0 · Spiegel (3,1) rot 3
    // Wertung 19.9 · 4 drehbar · 3 Ziele · Rateschritte 34 · handgebaut Spektrum
    name: 'Rundgang', titel: 'Lichtung', grad: 'leicht',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'prism', x: 3, z: 4, rot: 4 },
      { type: 'target', x: 6, z: 1, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'blue' },
    ],
    solution: { '3,4': 6, '1,2': 0, '5,2': 0, '3,1': 3 },
  },
  {
    // Lösung: Spiegel (5,4) rot 2 · Spiegel (6,3) rot 2 · Spiegel (2,4) rot 3 · Spiegel (2,0) rot 3
    // Generator leicht-mischziel, Seed 10636 · Ausbau „leicht“
    name: 'Fingerzeig', titel: 'Sandbank', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 5, color: 'red' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'target', x: 3, z: 0, color: 'magenta' },
    ],
    solution: { '5,4': 2, '6,3': 2, '2,4': 3, '2,0': 3 },
  },
  {
    // Lösung: Prisma (5,2) rot 3 · Spiegel (5,1) rot 1 · Spiegel (5,5) rot 1
    // Generator leicht-sammelstelle, Seed 10416 · Ausbau „leicht“
    name: 'Taschenlampe', titel: 'Pilzkreis', grad: 'leicht',
    elements: [
      { type: 'prism', x: 5, z: 2, rot: 7 },
      { type: 'source', x: 6, z: 3, dir: 5, color: 'blue' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'target', x: 2, z: 2, color: 'blue' },
      { type: 'target', x: 2, z: 5, color: 'green' },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 1, fixed: true },
      { type: 'target', x: 6, z: 6, color: 'red' },
    ],
    solution: { '5,2': 3, '5,1': 1, '5,5': 1 },
  },
  {
    // Lösung: Spiegel (1,5) rot 2 · Spiegel (0,4) rot 2 · Prisma (2,2) rot 0 · Spiegel (3,2) rot 1
    // Wertung 13.3 · 4 drehbar · 3 Ziele · Rateschritte 5 · Profil 2-prisma, Seed 939
    name: 'Farbsieb', titel: 'Heidelbeere', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 6, dir: 7 },
      { type: 'mirror', x: 2, z: 0, rot: 2, fixed: true },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'prism', x: 2, z: 2, rot: 6 },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'target', x: 3, z: 4, color: 'green' },
      { type: 'target', x: 6, z: 6, color: 'blue' },
    ],
    solution: { '1,5': 2, '0,4': 2, '2,2': 0, '3,2': 1 },
  },
  {
    // Lösung: Prisma (1,2) rot 5 · Spiegel (1,0) rot 3 · Spiegel (4,0) rot 1 · Spiegel (4,5) rot 3
    // Generator leicht, Seed 10432 · Ausbau „leicht“
    name: 'Lichtpunkt', titel: 'Eichhörnchen', grad: 'leicht',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'prism', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'target', x: 0, z: 5, color: 'blue' },
    ],
    solution: { '1,2': 5, '1,0': 3, '4,0': 1, '4,5': 3 },
  },
  {
    // Lösung: Spiegel (4,4) rot 1 · Spiegel (4,5) rot 1 · Spiegel (3,5) rot 1 · Spiegel (1,4) rot 1
    // Wertung 14.7 · 4 drehbar · 2 Ziele · Rateschritte 10 · Profil 2-farbe, Seed 927
    name: 'Kehre', titel: 'Laubdach', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'green' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 3, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 1, z: 1, color: 'blue' },
      { type: 'target', x: 3, z: 2, color: 'green' },
    ],
    solution: { '4,4': 1, '4,5': 1, '3,5': 1, '1,4': 1 },
  },
  {
    // Lösung: Spiegel (4,0) rot 3 · Spiegel (3,4) rot 3 · Spiegel (4,4) rot 3 · Spiegel (4,3) rot 1
    // Wertung 17.1 · 4 drehbar · 2 Ziele · Rateschritte 19 · Profil 2-farbe, Seed 1087
    name: 'Gegenlicht', titel: 'Waldmeister', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 4, color: 'blue' },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'filter', x: 3, z: 3, color: 'red' },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'target', x: 5, z: 3, color: 'blue' },
    ],
    solution: { '4,0': 3, '3,4': 3, '4,4': 3, '4,3': 1 },
  },
  {
    // Lösung: Spiegel (4,5) rot 3 · Prisma (4,6) rot 1 · Spiegel (5,6) rot 3 · Spiegel (5,2) rot 1
    // Generator leicht, Seed 10179 · Ausbau „leicht“
    name: 'Schneeflocke', titel: 'Muschelschale', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'prism', x: 4, z: 6, rot: 5 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 3, z: 5, color: 'red' },
    ],
    solution: { '4,5': 3, '4,6': 1, '5,6': 3, '5,2': 1 },
  },
  {
    // Lösung: Spiegel (2,6) rot 1 · Spiegel (2,0) rot 1 · Prisma (2,4) rot 5
    // Wertung 12.1 · 3 drehbar · 1 Ziel · Rateschritte 5 · Profil 1-prisma, Seed 105
    name: 'Regenbogen', titel: 'Strandkorb', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 0, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 6, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 5, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'prism', x: 2, z: 4, rot: 4 },
      { type: 'target', x: 0, z: 4, color: 'magenta' },
    ],
    solution: { '2,6': 1, '2,0': 1, '2,4': 5 },
  },
  {
    // Lösung: Spiegel (5,2) rot 3 · Spiegel (3,5) rot 1 · Prisma (0,3) rot 1
    // Generator leicht-mischziel, Seed 10570 · Ausbau „leicht“
    name: 'Papierflieger', titel: 'Möwe', grad: 'leicht',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'blue' },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'target', x: 3, z: 2, color: 'white' },
      { type: 'source', x: 3, z: 0, dir: 3 },
      { type: 'prism', x: 0, z: 3, rot: 2 },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 3, color: 'red' },
    ],
    solution: { '5,2': 3, '3,5': 1, '0,3': 1 },
  },
  {
    // Lösung: Spiegel (2,4) rot 0 · Spiegel (3,3) rot 2 · Prisma (1,5) rot 0
    // Generator leicht, Seed 10648 · Ausbau „leicht“
    name: 'Funke', titel: 'Seegras', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 1, color: 'cyan' },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'filter', x: 2, z: 2, color: 'green' },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 1, z: 5, rot: 3 },
      { type: 'target', x: 3, z: 5, color: 'red' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
    ],
    solution: { '2,4': 0, '3,3': 2, '1,5': 0 },
  },
  {
    // Lösung: Spiegel (2,3) rot 3 · Prisma (1,5) rot 1 · Prisma (2,4) rot 2
    // Generator leicht, Seed 10375 · Ausbau „leicht“
    name: 'Glimmer', titel: 'Strandgut', grad: 'leicht',
    elements: [
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'prism', x: 1, z: 5, rot: 7 },
      { type: 'prism', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 4, z: 5, color: 'red' },
      { type: 'target', x: 1, z: 6, color: 'blue' },
    ],
    solution: { '2,3': 3, '1,5': 1, '2,4': 2 },
  },
  {
    // Lösung: Prisma (4,3) rot 2 · Spiegel (6,1) rot 2 · Spiegel (4,5) rot 3
    // Generator leicht-sammelstelle, Seed 10095 · Ausbau „leicht“
    name: 'Kerzenschein', titel: 'Krabbe', grad: 'leicht',
    elements: [
      { type: 'prism', x: 4, z: 3, rot: 5 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'yellow' },
      { type: 'source', x: 5, z: 0, dir: 1, color: 'blue' },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 5, z: 4, color: 'red' },
      { type: 'target', x: 2, z: 5, color: 'cyan' },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
    ],
    solution: { '4,3': 2, '6,1': 2, '4,5': 3 },
  },
  {
    // Lösung: Spiegel (5,2) rot 1 · Prisma (3,2) rot 3 · Spiegel (2,3) rot 0 · Spiegel (0,2) rot 3 ·
    //   Spiegel (0,3) rot 1
    // Generator leicht, Seed 10177 · Ausbau „leicht“
    name: 'Kreidestrich', titel: 'Sandburg', grad: 'leicht',
    elements: [
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'prism', x: 3, z: 2, rot: 4 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'target', x: 1, z: 3, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'red' },
    ],
    solution: { '5,2': 1, '3,2': 3, '2,3': 0, '0,2': 3, '0,3': 1 },
  },
  {
    // Lösung: Spiegel (2,3) rot 3 · Spiegel (1,3) rot 1 · Prisma (1,2) rot 7 · Spiegel (3,0) rot 0 ·
    //   Spiegel (6,3) rot 2
    // Generator leicht, Seed 10245 · Ausbau „leicht“
    name: 'Farbstift', titel: 'Seebrise', grad: 'leicht',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'prism', x: 1, z: 2, rot: 5 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'target', x: 4, z: 5, color: 'green' },
      { type: 'target', x: 4, z: 2, color: 'blue' },
    ],
    solution: { '2,3': 3, '1,3': 1, '1,2': 7, '3,0': 0, '6,3': 2 },
  },
  {
    // Lösung: Spiegel (5,3) rot 3 · Spiegel (5,6) rot 1 · Spiegel (5,4) rot 3 · Spiegel (2,4) rot 3
    // Wertung 17.7 · 4 drehbar · 2 Ziele · Rateschritte 19 · Profil 2-filter, Seed 1699
    name: 'Fächer', titel: 'Sandkorn', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 5, z: 2, rot: 2, fixed: true },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'filter', x: 2, z: 5, color: 'green' },
      { type: 'filter', x: 5, z: 5, color: 'red' },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'target', x: 2, z: 6, color: 'green' },
    ],
    solution: { '5,3': 3, '5,6': 1, '5,4': 3, '2,4': 3 },
  },
  {
    // Lösung: Prisma (3,5) rot 6 · Spiegel (0,2) rot 2 · Spiegel (2,0) rot 0
    // Generator leicht-sammelstelle, Seed 11007 · Ausbau „leicht“
    name: 'Wegmarke', titel: 'Treibholz', grad: 'leicht',
    elements: [
      { type: 'prism', x: 3, z: 5, rot: 4 },
      { type: 'source', x: 4, z: 6, dir: 5, color: 'yellow' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'blue' },
      { type: 'target', x: 3, z: 2, color: 'green' },
      { type: 'target', x: 5, z: 3, color: 'magenta' },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
    ],
    solution: { '3,5': 6, '0,2': 2, '2,0': 0 },
  },
  {
    // Lösung: Spiegel (3,3) rot 2 · Spiegel (5,3) rot 2 · Prisma (6,2) rot 5
    // Generator leicht-mischziel, Seed 10053 · Ausbau „leicht“
    name: 'Farbklecks', titel: 'Dattelpalme', grad: 'leicht',
    elements: [
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 0, dir: 3, color: 'yellow' },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'target', x: 4, z: 4, color: 'white' },
      { type: 'source', x: 6, z: 4, dir: 5 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'prism', x: 6, z: 2, rot: 6 },
      { type: 'target', x: 0, z: 2, color: 'red' },
      { type: 'target', x: 6, z: 1, color: 'blue' },
    ],
    solution: { '3,3': 2, '5,3': 2, '6,2': 5 },
  },
  {
    // Lösung: Spiegel (2,4) rot 1 · Prisma (3,3) rot 5 · Spiegel (3,2) rot 3
    // Generator leicht-mischziel, Seed 10076 · Ausbau „leicht“
    name: 'Grasgrün', titel: 'Sandrose', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 1, color: 'white' },
      { type: 'source', x: 6, z: 6, dir: 5 },
      { type: 'prism', x: 3, z: 3, rot: 7 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'target', x: 4, z: 2, color: 'blue' },
      { type: 'target', x: 0, z: 0, color: 'green' },
    ],
    solution: { '2,4': 1, '3,3': 5, '3,2': 3 },
  },
  {
    // Lösung: Prisma (5,4) rot 0 · Spiegel (2,4) rot 3 · Prisma (0,3) rot 0
    // Generator leicht-sammelstelle, Seed 10733 · Ausbau „leicht“
    name: 'Glanzpapier', titel: 'Kamel', grad: 'leicht',
    elements: [
      { type: 'prism', x: 5, z: 4, rot: 2 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'cyan' },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'target', x: 6, z: 5, color: 'blue' },
      { type: 'target', x: 6, z: 4, color: 'green' },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 0, z: 3, rot: 7 },
      { type: 'target', x: 3, z: 6, color: 'blue' },
    ],
    solution: { '5,4': 0, '2,4': 3, '0,3': 0 },
  },
  {
    // Lösung: Spiegel (1,5) rot 1 · Spiegel (5,4) rot 1 · Spiegel (5,5) rot 1 · Spiegel (1,4) rot 1
    // Wertung 16 · 4 drehbar · 2 Ziele · Rateschritte 13 · Profil 2-bunt, Seed 268
    name: 'Spiegelgasse', titel: 'Dromedar', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 5, z: 2, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 1, z: 6, rot: 2, fixed: true },
      { type: 'filter', x: 3, z: 4, color: 'green' },
      { type: 'filter', x: 3, z: 5, color: 'green' },
      { type: 'target', x: 1, z: 2, color: 'green' },
      { type: 'target', x: 0, z: 4, color: 'green' },
    ],
    solution: { '1,5': 1, '5,4': 1, '5,5': 1, '1,4': 1 },
  },
  {
    // Lösung: Prisma (2,1) rot 1 · Spiegel (1,1) rot 1 · Spiegel (2,4) rot 1 · Kombinator (5,4) dir 7
    // Wertung 18.3 · 4 drehbar · 3 Ziele · Rateschritte 12 · Profil 2-misch, Seed 442
    name: 'Zwillinge', titel: 'Palmenhain', grad: 'leicht',
    elements: [
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'prism', x: 2, z: 1, rot: 5 },
      { type: 'combiner', x: 5, z: 4, dir: 4 },
      { type: 'target', x: 3, z: 0, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'cyan' },
      { type: 'target', x: 1, z: 5, color: 'white' },
    ],
    solution: { '2,1': 1, '1,1': 1, '2,4': 1, '5,4': 7 },
  },
  {
    // Lösung: Prisma (6,3) rot 3 · Spiegel (5,2) rot 0 · Spiegel (6,5) rot 3
    // Generator leicht-sammelstelle, Seed 10769 · Ausbau „leicht“
    name: 'Fackel', titel: 'Wasserloch', grad: 'leicht',
    elements: [
      { type: 'prism', x: 6, z: 3, rot: 6 },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 1, z: 6, dir: 7, color: 'green' },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'target', x: 1, z: 3, color: 'blue' },
      { type: 'target', x: 4, z: 5, color: 'yellow' },
      { type: 'mirror', x: 6, z: 5, rot: 1 },
    ],
    solution: { '6,3': 3, '5,2': 0, '6,5': 3 },
  },
  {
    // Lösung: Spiegel (6,5) rot 1 · Spiegel (5,2) rot 1 · Spiegel (2,2) rot 1 · Spiegel (5,4) rot 3 ·
    //   Spiegel (4,5) rot 1
    // Wertung 24.1 · 5 drehbar · 3 Ziele · Rateschritte 62 · Profil mittel/3-spiegel, Seed 2003045
    name: 'Glanzpunkt', titel: 'Ziehbrunnen', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'target', x: 5, z: 0, color: 'white' },
      { type: 'target', x: 2, z: 1, color: 'white' },
      { type: 'target', x: 6, z: 4, color: 'white' },
    ],
    solution: { '6,5': 1, '5,2': 1, '2,2': 1, '5,4': 3, '4,5': 1 },
  },
  {
    // Lösung: Spiegel (1,0) rot 1 · Spiegel (4,3) rot 1 · Spiegel (5,3) rot 1 · Spiegel (1,3) rot 3 ·
    //   Spiegel (0,3) rot 1
    // Wertung 24.4 · 5 drehbar · 3 Ziele · Rateschritte 72 · Profil 3-bunt, Seed 2840
    name: 'Gabelung', titel: 'Wüstenfuchs', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0 },
      { type: 'source', x: 4, z: 0, dir: 2 },
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 0, z: 5, rot: 0, fixed: true },
      { type: 'filter', x: 1, z: 2, color: 'cyan' },
      { type: 'target', x: 0, z: 1, color: 'cyan' },
      { type: 'target', x: 4, z: 5, color: 'white' },
      { type: 'target', x: 5, z: 5, color: 'white' },
    ],
    solution: { '1,0': 1, '4,3': 1, '5,3': 1, '1,3': 3, '0,3': 1 },
  },
  {
    // Lösung: Spiegel (1,0) rot 1 · Spiegel (1,4) rot 1 · Spiegel (5,3) rot 3 · Spiegel (4,2) rot 1
    // Generator leicht-mischziel, Seed 10408 · Ausbau „leicht“
    name: 'Glühbirne', titel: 'Rauchfahne', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'green' },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'target', x: 5, z: 4, color: 'white' },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'filter', x: 4, z: 5, color: 'magenta' },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 6, z: 6, color: 'magenta' },
    ],
    solution: { '1,0': 1, '1,4': 1, '5,3': 3, '4,2': 1 },
  },
  {
    // Lösung: Prisma (0,3) rot 7 · Prisma (2,0) rot 5 · Spiegel (1,0) rot 3
    // Generator leicht-sammelstelle, Seed 33, Ziel 35,4–36,65 · ersetzt Auslese (Austausch „leicht“)
    name: 'Strahlteiler', titel: 'Lava', grad: 'leicht',
    elements: [
      { type: 'prism', x: 0, z: 3, rot: 3 },
      { type: 'source', x: 3, z: 6, dir: 5, color: 'magenta' },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'green' },
      { type: 'target', x: 4, z: 3, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'prism', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'target', x: 1, z: 6, color: 'red' },
    ],
    solution: { '0,3': 7, '2,0': 5, '1,0': 3 },
  },
  {
    // Lösung: Prisma (1,0) rot 2 · Prisma (5,2) rot 6 · Spiegel (5,4) rot 0
    // Generator leicht-sammelstelle, Seed 10239 · Ausbau „leicht“
    name: 'Frühlicht', titel: 'Sandspur', grad: 'leicht',
    elements: [
      { type: 'prism', x: 1, z: 0, rot: 1 },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'green' },
      { type: 'source', x: 6, z: 0, dir: 4, color: 'magenta' },
      { type: 'target', x: 1, z: 5, color: 'green' },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'prism', x: 5, z: 2, rot: 1 },
      { type: 'target', x: 4, z: 1, color: 'red' },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'target', x: 6, z: 3, color: 'red' },
    ],
    solution: { '1,0': 2, '5,2': 6, '5,4': 0 },
  },
  {
    // Lösung: Prisma (3,6) rot 5 · Spiegel (3,4) rot 1 · Prisma (5,1) rot 6 · Kombinator (1,4) dir 5
    // Generator leicht, Seed 10672 · Ausbau „leicht“
    name: 'Lichtschalter', titel: 'Asche', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'prism', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'prism', x: 5, z: 1, rot: 3 },
      { type: 'combiner', x: 1, z: 4, dir: 6 },
      { type: 'target', x: 1, z: 6, color: 'red' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 5, z: 0, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'cyan' },
    ],
    solution: { '3,6': 5, '3,4': 1, '5,1': 6, '1,4': 5 },
  },
  {
    // Lösung: Spiegel (2,5) rot 3 · Spiegel (2,6) rot 1 · Prisma (0,5) rot 2 · Prisma (2,2) rot 3 ·
    //   Spiegel (3,6) rot 3
    // Wertung 22.3 · 5 drehbar · 4 Ziele · Rateschritte 30 · Profil 3-prisma, Seed 339
    name: 'Brechpunkt', titel: 'Schwefel', grad: 'leicht',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'mirror', x: 3, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'prism', x: 2, z: 2, rot: 5 },
      { type: 'prism', x: 0, z: 5, rot: 5 },
      { type: 'target', x: 1, z: 2, color: 'blue' },
      { type: 'target', x: 0, z: 3, color: 'white' },
      { type: 'target', x: 0, z: 4, color: 'green' },
      { type: 'target', x: 1, z: 6, color: 'red' },
    ],
    solution: { '2,5': 3, '2,6': 1, '0,5': 2, '2,2': 3, '3,6': 3 },
  },
  {
    // Lösung: Spiegel (5,1) rot 2 · Spiegel (3,5) rot 0 · Prisma (4,6) rot 7 · Spiegel (5,6) rot 3
    // Generator leicht-mischziel, Seed 10056 · Ausbau „leicht“
    name: 'Kirschrot', titel: 'Glutschein', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'source', x: 4, z: 0, dir: 1, color: 'green' },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'target', x: 2, z: 4, color: 'yellow' },
      { type: 'source', x: 2, z: 6, dir: 7 },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'prism', x: 4, z: 6, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'target', x: 5, z: 2, color: 'blue' },
    ],
    solution: { '5,1': 2, '3,5': 0, '4,6': 7, '5,6': 3 },
  },
  {
    // Lösung: Spiegel (2,3) rot 3 · Prisma (0,3) rot 0 · Spiegel (1,2) rot 2 · Spiegel (3,6) rot 0
    // Generator leicht-mischziel, Seed 10137 · Ausbau „leicht“
    name: 'Morgentau', titel: 'Sonnensystem', grad: 'leicht',
    elements: [
      { type: 'source', x: 2, z: 6, dir: 6, color: 'cyan' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'target', x: 4, z: 3, color: 'white' },
      { type: 'source', x: 0, z: 6, dir: 6 },
      { type: 'prism', x: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 3, color: 'blue' },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'target', x: 3, z: 1, color: 'green' },
    ],
    solution: { '2,3': 3, '0,3': 0, '1,2': 2, '3,6': 0 },
  },
  {
    // Lösung: Prisma (5,2) rot 2 · Spiegel (1,6) rot 0 · Spiegel (5,3) rot 3 · Spiegel (0,5) rot 2 ·
    //   Spiegel (6,3) rot 2 · Spiegel (5,4) rot 2
    // Generator leicht, Seed 10654 · Ausbau „leicht“
    name: 'Abzweigung', titel: 'Bimsstein', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'prism', x: 5, z: 2, rot: 7 },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 3, z: 3, color: 'green' },
      { type: 'target', x: 3, z: 2, color: 'blue' },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'target', x: 6, z: 5, color: 'red' },
    ],
    solution: { '5,2': 2, '1,6': 0, '5,3': 3, '0,5': 2, '6,3': 2, '5,4': 2 },
  },
  {
    // Lösung: Spiegel (6,2) rot 2 · Spiegel (1,5) rot 2 · Prisma (5,3) rot 3 · Spiegel (5,4) rot 3 ·
    //   Spiegel (3,4) rot 1
    // Generator leicht, Seed 10349 · Ausbau „leicht“
    name: 'Schaukel', titel: 'Basalt', grad: 'leicht',
    elements: [
      { type: 'source', x: 4, z: 0, dir: 1 },
      { type: 'source', x: 2, z: 6, dir: 5 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'prism', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'filter', x: 2, z: 4, color: 'yellow' },
      { type: 'target', x: 3, z: 2, color: 'red' },
      { type: 'target', x: 4, z: 2, color: 'yellow' },
      { type: 'target', x: 1, z: 3, color: 'blue' },
      { type: 'target', x: 3, z: 5, color: 'green' },
    ],
    solution: { '6,2': 2, '1,5': 2, '5,3': 3, '5,4': 3, '3,4': 1 },
  },
  {
    // Lösung: Prisma (6,4) rot 5 · Spiegel (6,6) rot 3 · Spiegel (5,5) rot 0 · Spiegel (6,1) rot 1
    // Generator leicht-sammelstelle, Seed 10308 · Ausbau „leicht“
    name: 'Hellblau', titel: 'Kraterrand', grad: 'leicht',
    elements: [
      { type: 'prism', x: 6, z: 4, rot: 0 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 6, z: 6, rot: 0 },
      { type: 'source', x: 0, z: 0, dir: 1, color: 'green' },
      { type: 'mirror', x: 5, z: 5, rot: 1 },
      { type: 'target', x: 2, z: 4, color: 'red' },
      { type: 'target', x: 3, z: 1, color: 'cyan' },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
    ],
    solution: { '6,4': 5, '6,6': 3, '5,5': 0, '6,1': 1 },
  },
  {
    // Lösung: Spiegel (2,2) rot 0 · Spiegel (3,1) rot 0 · Spiegel (6,4) rot 2 · Prisma (3,3) rot 6
    // Generator leicht, Seed 10913 · Ausbau „leicht“
    name: 'Kreisel', titel: 'Trabant', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'source', x: 0, z: 0, dir: 1 },
      { type: 'mirror', x: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'prism', x: 3, z: 3, rot: 1 },
      { type: 'filter', x: 4, z: 2, color: 'magenta' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 4, z: 6, color: 'magenta' },
    ],
    solution: { '2,2': 0, '3,1': 0, '6,4': 2, '3,3': 6 },
  },
  {
    // Lösung: Prisma (3,3) rot 6 · Spiegel (5,0) rot 1 · Spiegel (2,0) rot 3 · Prisma (2,5) rot 1
    // Generator leicht, Seed 10506 · Ausbau „leicht“
    name: 'Lichtfleck', titel: 'Mondaufgang', grad: 'leicht',
    elements: [
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'prism', x: 3, z: 3, rot: 5 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 1 },
      { type: 'prism', x: 2, z: 5, rot: 7 },
      { type: 'mirror', x: 3, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'green' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 1, z: 1, color: 'red' },
    ],
    solution: { '3,3': 6, '5,0': 1, '2,0': 3, '2,5': 1 },
  },
  {
    // Lösung: Prisma (5,2) rot 6 · Spiegel (6,1) rot 2 · Spiegel (5,1) rot 1 · Spiegel (3,1) rot 1 ·
    //   Kombinator (3,0) dir 3
    // Generator leicht, Seed 10472 · Ausbau „leicht“
    name: 'Kurve', titel: 'Dampfwolke', grad: 'leicht',
    elements: [
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'prism', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'combiner', x: 3, z: 0, dir: 4 },
      { type: 'target', x: 1, z: 2, color: 'yellow' },
      { type: 'target', x: 5, z: 0, color: 'blue' },
    ],
    solution: { '5,2': 6, '6,1': 2, '5,1': 1, '3,1': 1, '3,0': 3 },
  },
  {
    // Lösung: Spiegel (2,2) rot 3 · Prisma (0,1) rot 5 · Spiegel (2,0) rot 3 · Spiegel (3,1) rot 3 ·
    //   Spiegel (3,6) rot 3 · Spiegel (3,0) rot 1
    // Wertung 20.5 · 6 drehbar · 2 Ziele · Rateschritte 36 · Profil mittel/3-prisma, Seed 2001256
    name: 'Querschläger', titel: 'Planetenbahn', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'prism', x: 0, z: 1, rot: 2 },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 6, color: 'white' },
    ],
    solution: { '2,2': 3, '0,1': 5, '2,0': 3, '3,1': 3, '3,6': 3, '3,0': 1 },
  },
  {
    // Lösung: Spiegel (4,3) rot 1 · Spiegel (6,4) rot 3 · Spiegel (5,3) rot 1 · Prisma (5,0) rot 2
    // Generator leicht, Seed 10777 · Ausbau „leicht“
    name: 'Sonnenblume', titel: 'Ringplanet', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'green' },
      { type: 'source', x: 6, z: 0, dir: 4 },
      { type: 'source', x: 4, z: 0, dir: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'prism', x: 5, z: 0, rot: 6 },
      { type: 'filter', x: 4, z: 1, color: 'magenta' },
      { type: 'mirror', x: 2, z: 3, rot: 2, fixed: true },
      { type: 'target', x: 4, z: 5, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'green' },
      { type: 'target', x: 5, z: 5, color: 'magenta' },
    ],
    solution: { '4,3': 1, '6,4': 3, '5,3': 1, '5,0': 2 },
  },
  {
    // Lösung: Prisma (0,4) rot 2 · Spiegel (2,6) rot 0 · Spiegel (0,5) rot 1 · Spiegel (4,4) rot 2 ·
    //   Spiegel (3,3) rot 0 · Spiegel (6,5) rot 1
    // Generator leicht, Seed 10557 · Ausbau „leicht“
    name: 'Torbogen', titel: 'Mondphase', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 2 },
      { type: 'prism', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'target', x: 2, z: 4, color: 'red' },
      { type: 'target', x: 6, z: 6, color: 'green' },
      { type: 'blocker', x: 1, z: 4 },
    ],
    solution: { '0,4': 2, '2,6': 0, '0,5': 1, '4,4': 2, '3,3': 0, '6,5': 1 },
  },
  {
    // Lösung: Prisma (6,2) rot 3 · Spiegel (5,5) rot 3 · Spiegel (0,5) rot 1
    // Generator leicht-sammelstelle, Seed 114, Ziel 39,1–41,2 · ersetzt Doppelpass (Austausch „leicht“)
    name: 'Amethyst', titel: 'Mondkrater', grad: 'leicht',
    elements: [
      { type: 'prism', x: 6, z: 2, rot: 5 },
      { type: 'source', x: 4, z: 0, dir: 1, color: 'yellow' },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'blue' },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 0, z: 2, color: 'magenta' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'filter', x: 2, z: 5, color: 'red' },
    ],
    solution: { '6,2': 3, '5,5': 3, '0,5': 1 },
  },
  {
    // Lösung: Spiegel (4,3) rot 3 · Prisma (5,5) rot 0 · Spiegel (5,3) rot 3 · Prisma (5,2) rot 0 ·
    //   Spiegel (6,3) rot 2
    // Generator leicht, Seed 10230 · Ausbau „leicht“
    name: 'Tautropfen', titel: 'Grosser Bär', grad: 'leicht',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'source', x: 0, z: 0, dir: 1 },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'prism', x: 5, z: 5, rot: 6 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'prism', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 6, z: 2, color: 'green' },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 2, z: 5, color: 'blue' },
      { type: 'target', x: 6, z: 1, color: 'red' },
    ],
    solution: { '4,3': 3, '5,5': 0, '5,3': 3, '5,2': 0, '6,3': 2 },
  },
  {
    // Lösung: Spiegel (6,4) rot 3 · Spiegel (6,1) rot 1 · Prisma (3,2) rot 5 · Prisma (0,1) rot 6
    // Generator leicht, Seed 11096 · Ausbau „leicht“
    name: 'Sternchen', titel: 'Raumsonde', grad: 'leicht',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'prism', x: 3, z: 2, rot: 4 },
      { type: 'prism', x: 0, z: 1, rot: 4 },
      { type: 'mirror', x: 0, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 2, color: 'red' },
      { type: 'target', x: 5, z: 0, color: 'green' },
    ],
    solution: { '6,4': 3, '6,1': 1, '3,2': 5, '0,1': 6 },
  },
  {
    // Lösung: Prisma (4,4) rot 6 · Prisma (2,5) rot 3 · Spiegel (1,1) rot 2 · Spiegel (2,0) rot 0 ·
    //   Spiegel (6,2) rot 2
    // Generator leicht, Seed 10477 · Ausbau „leicht“
    name: 'Lichtkugel', titel: 'Erdaufgang', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'prism', x: 4, z: 4, rot: 1 },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'prism', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 1, z: 5, color: 'blue' },
      { type: 'mirror', x: 4, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'target', x: 4, z: 0, color: 'blue' },
    ],
    solution: { '4,4': 6, '2,5': 3, '1,1': 2, '2,0': 0, '6,2': 2 },
  },
  {
    // Lösung: Prisma (3,4) rot 6 · Spiegel (3,0) rot 3 · Prisma (6,1) rot 4
    // Generator leicht-sammelstelle, Seed 10818 · Ausbau „leicht“
    name: 'Glasperle', titel: 'Sternenzelt', grad: 'leicht',
    elements: [
      { type: 'prism', x: 3, z: 4, rot: 3 },
      { type: 'source', x: 1, z: 6, dir: 7, color: 'yellow' },
      { type: 'source', x: 5, z: 6, dir: 5, color: 'blue' },
      { type: 'target', x: 1, z: 2, color: 'red' },
      { type: 'target', x: 5, z: 2, color: 'magenta' },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'prism', x: 6, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 2, color: 'green' },
    ],
    solution: { '3,4': 6, '3,0': 3, '6,1': 4 },
  },
  {
    // Lösung: Prisma (2,3) rot 0 · Spiegel (3,2) rot 0 · Kombinator (4,3) dir 6 · Spiegel (4,5) rot 0 ·
    //   Spiegel (1,6) rot 1
    // Wertung 28.5 · 5 drehbar · 3 Ziele · Rateschritte 172 · handgebaut Kreuzungen
    name: 'Farbspiel', titel: 'Grosser Wagen', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'prism', x: 2, z: 3, rot: 2 },
      { type: 'filter', x: 5, z: 6, color: 'cyan' },
      { type: 'combiner', x: 4, z: 3, dir: 0 },
      { type: 'blocker', x: 6, z: 1 },
      { type: 'target', x: 4, z: 0, color: 'yellow' },
      { type: 'target', x: 1, z: 1, color: 'cyan' },
      { type: 'target', x: 6, z: 3, color: 'blue' },
    ],
    solution: { '2,3': 0, '3,2': 0, '4,3': 6, '4,5': 0, '1,6': 1 },
  },
  {
    // Lösung: Spiegel (5,2) rot 3 · Spiegel (0,4) rot 2 · Spiegel (4,0) rot 0 · Spiegel (0,2) rot 3 ·
    //   Prisma (0,3) rot 0
    // Generator leicht-abschalten, Seed 1435, Ziel 36,7–37,5 · ersetzt Labyrinth (Austausch „leicht“)
    name: 'Fackellauf', titel: 'Glutnest', grad: 'leicht',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'target', x: 6, z: 2, color: 'yellow' },
      { type: 'source', x: 2, z: 6, dir: 5, color: 'yellow' },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'prism', x: 0, z: 3, rot: 1 },
      { type: 'target', x: 5, z: 3, color: 'green' },
      { type: 'target', x: 3, z: 0, color: 'red' },
    ],
    solution: { '5,2': 3, '0,4': 2, '4,0': 0, '0,2': 3, '0,3': 0 },
  },
  {
    // Lösung: Prisma (0,2) rot 0 · Spiegel (2,0) rot 0 · Spiegel (6,4) rot 2 · Spiegel (5,5) rot 0
    // Generator leicht-sammelstelle, Seed 10067 · Ausbau „leicht“
    name: 'Fensterglas', titel: 'Zwergplanet', grad: 'leicht',
    elements: [
      { type: 'prism', x: 0, z: 2, rot: 1 },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'green' },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 6, z: 2, color: 'yellow' },
      { type: 'target', x: 3, z: 5, color: 'blue' },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 2, fixed: true },
    ],
    solution: { '0,2': 0, '2,0': 0, '6,4': 2, '5,5': 0 },
  },
  {
    // Lösung: Spiegel (0,5) rot 2 · Spiegel (1,0) rot 0 · Prisma (5,4) rot 4 · Spiegel (4,5) rot 2 ·
    //   Spiegel (5,6) rot 0
    // Generator leicht-mischziel, Seed 10280 · Ausbau „leicht“
    name: 'Rosenrot', titel: 'Kleiner Wagen', grad: 'leicht',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 5, color: 'cyan' },
      { type: 'source', x: 0, z: 1, dir: 7, color: 'magenta' },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'target', x: 3, z: 2, color: 'white' },
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'prism', x: 5, z: 4, rot: 7 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'target', x: 0, z: 4, color: 'green' },
    ],
    solution: { '0,5': 2, '1,0': 0, '5,4': 4, '4,5': 2, '5,6': 0 },
  },
  {
    // Lösung: Prisma (5,6) rot 0 · Prisma (1,2) rot 1 · Spiegel (1,3) rot 3 · Spiegel (4,2) rot 3 ·
    //   Spiegel (6,5) rot 2
    // Generator leicht, Seed 1710, Ziel 41,3–41,8 · ersetzt Seitenlicht (Austausch „leicht“)
    name: 'Fernlicht', titel: 'Sternenhimmel', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'prism', x: 5, z: 6, rot: 7 },
      { type: 'prism', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 1 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'target', x: 0, z: 3, color: 'blue' },
      { type: 'target', x: 4, z: 1, color: 'red' },
      { type: 'target', x: 2, z: 1, color: 'red' },
    ],
    solution: { '5,6': 0, '1,2': 1, '1,3': 3, '4,2': 3, '6,5': 2 },
  },
  {
    // Lösung: Spiegel (4,5) rot 1 · Spiegel (4,4) rot 1 · Spiegel (4,0) rot 1 · Spiegel (1,0) rot 3 ·
    //   Spiegel (1,4) rot 3 · Spiegel (4,1) rot 1
    // Wertung 23 · 6 drehbar · 2 Ziele · Rateschritte 67 · Profil 3-farbe, Seed 1164
    name: 'Zusammenfluss', titel: 'Sternkarte', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4, color: 'green' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 1, z: 1, color: 'yellow' },
      { type: 'target', x: 1, z: 6, color: 'white' },
    ],
    solution: { '4,5': 1, '4,4': 1, '4,0': 1, '1,0': 3, '1,4': 3, '4,1': 1 },
  },
  {
    // Lösung: Spiegel (5,5) rot 3 · Prisma (1,4) rot 0 · Prisma (5,6) rot 4 · Kombinator (3,6) dir 4
    // Generator leicht, Seed 11194 · Ausbau „leicht“
    name: 'Rutschbahn', titel: 'Nachthimmel', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'prism', x: 1, z: 4, rot: 6 },
      { type: 'prism', x: 5, z: 6, rot: 3 },
      { type: 'combiner', x: 3, z: 6, dir: 1 },
      { type: 'target', x: 1, z: 6, color: 'cyan' },
      { type: 'target', x: 4, z: 4, color: 'green' },
      { type: 'target', x: 4, z: 1, color: 'red' },
      { type: 'target', x: 0, z: 1, color: 'blue' },
    ],
    solution: { '5,5': 3, '1,4': 0, '5,6': 4, '3,6': 4 },
  },
  {
    // Lösung: Spiegel (6,5) rot 3 · Spiegel (3,5) rot 1 · Spiegel (1,0) rot 1 · Spiegel (3,6) rot 3 ·
    //   Spiegel (1,6) rot 1 · Spiegel (3,3) rot 3 · Spiegel (1,1) rot 3
    // Wertung 29 · 7 drehbar · 3 Ziele · Rateschritte 249 · Profil mittel2/b-4-farbe, Seed 4351010
    name: 'Schliff', titel: 'Kleiner Bär', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0, color: 'green' },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 6, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 0, color: 'white' },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'target', x: 5, z: 3, color: 'red' },
    ],
    solution: { '6,5': 3, '3,5': 1, '1,0': 1, '3,6': 3, '1,6': 1, '3,3': 3, '1,1': 3 },
  },
  {
    // Lösung: Prisma (1,3) rot 6 · Spiegel (3,1) rot 0 · Spiegel (0,2) rot 2 · Spiegel (1,1) rot 2 ·
    //   Prisma (3,2) rot 0 · Spiegel (6,2) rot 3
    // Generator leicht-falle, Seed 525, Ziel 42,4–42,95 · ersetzt Lichtbündel (Austausch „leicht“)
    name: 'Blitz', titel: 'Funkeln', grad: 'leicht',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 1, z: 3, rot: 4 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'target', x: 5, z: 3, color: 'blue' },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'source', x: 1, z: 0, dir: 1 },
      { type: 'prism', x: 3, z: 2, rot: 4 },
      { type: 'target', x: 0, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 4, color: 'blue' },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'target', x: 6, z: 0, color: 'green' },
    ],
    solution: { '1,3': 6, '3,1': 0, '0,2': 2, '1,1': 2, '3,2': 0, '6,2': 3 },
  },
  {
    // Lösung: Prisma (1,4) rot 6 · Spiegel (2,2) rot 0 · Prisma (3,3) rot 3 · Spiegel (3,6) rot 1
    // Generator leicht-sammelstelle, Seed 10659 · Ausbau „leicht“
    name: 'Lindgrün', titel: 'Abendhimmel', grad: 'leicht',
    elements: [
      { type: 'prism', x: 1, z: 4, rot: 3 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'magenta' },
      { type: 'target', x: 1, z: 1, color: 'green' },
      { type: 'source', x: 0, z: 4, dir: 7 },
      { type: 'mirror', x: 2, z: 2, rot: 1 },
      { type: 'prism', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 6, color: 'green' },
      { type: 'target', x: 5, z: 2, color: 'red' },
    ],
    solution: { '1,4': 6, '2,2': 0, '3,3': 3, '3,6': 1 },
  },
  {
    // Lösung: Spiegel (1,4) rot 3 · Spiegel (3,4) rot 3 · Spiegel (3,1) rot 3 · Spiegel (1,1) rot 1 ·
    //   Prisma (4,4) rot 5 · Spiegel (4,1) rot 1
    // Generator mittel-abzaehlen, Seed 10221 · Ausbau „mittel“
    name: 'Bronze', titel: 'Baumkrone', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'yellow' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'red' },
      { type: 'target', x: 0, z: 4, color: 'yellow' },
      { type: 'target', x: 3, z: 5, color: 'red' },
      { type: 'target', x: 1, z: 0, color: 'red' },
      { type: 'prism', x: 4, z: 4, rot: 4 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'target', x: 1, z: 5, color: 'blue' },
    ],
    solution: { '1,4': 3, '3,4': 3, '3,1': 3, '1,1': 1, '4,4': 5, '4,1': 1 },
  },
  {
    // Lösung: Prisma (4,5) rot 0 · Spiegel (4,4) rot 3 · Spiegel (0,1) rot 2 · Spiegel (2,6) rot 1 ·
    //   Spiegel (6,5) rot 1
    // Generator mittel-sammelstelle, Seed 10651 · Ausbau „mittel“
    name: 'Krokus', titel: 'Wurzelwerk', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 5, rot: 3 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'source', x: 1, z: 0, dir: 3, color: 'blue' },
      { type: 'mirror', x: 0, z: 1, rot: 3 },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'white' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 6, color: 'green' },
    ],
    solution: { '4,5': 0, '4,4': 3, '0,1': 2, '2,6': 1, '6,5': 1 },
  },
  {
    // Lösung: Spiegel (4,2) rot 1 · Spiegel (1,4) rot 3 · Spiegel (6,3) rot 3 · Spiegel (6,0) rot 1 ·
    //   Spiegel (1,0) rot 3
    // Generator mittel-mischziel, Seed 11017 · Ausbau „mittel“
    name: 'Enzian', titel: 'Fichtennadel', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0, color: 'cyan' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'target', x: 4, z: 4, color: 'white' },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'mirror', x: 6, z: 0, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'filter', x: 1, z: 3, color: 'blue' },
      { type: 'target', x: 0, z: 4, color: 'blue' },
    ],
    solution: { '4,2': 1, '1,4': 3, '6,3': 3, '6,0': 1, '1,0': 3 },
  },
  {
    // Lösung: Prisma (2,5) rot 5 · Spiegel (2,3) rot 3 · Spiegel (1,5) rot 1 · Spiegel (1,4) rot 1 ·
    //   Prisma (0,2) rot 2
    // Generator mittel-falle, Seed 10727 · Ausbau „mittel“
    name: 'Titan', titel: 'Sauerklee', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'prism', x: 2, z: 5, rot: 4 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'target', x: 4, z: 3, color: 'blue' },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'target', x: 0, z: 4, color: 'yellow' },
      { type: 'source', x: 2, z: 0, dir: 3, color: 'yellow' },
      { type: 'prism', x: 0, z: 2, rot: 4 },
      { type: 'target', x: 4, z: 6, color: 'red' },
    ],
    solution: { '2,5': 5, '2,3': 3, '1,5': 1, '1,4': 1, '0,2': 2 },
  },
  {
    // Lösung: Spiegel (2,5) rot 3 · Spiegel (5,5) rot 1 · Spiegel (1,2) rot 1 · Spiegel (2,3) rot 1 ·
    //   Prisma (1,5) rot 6
    // Generator mittel-mischziel, Seed 10664 · Ausbau „mittel“
    name: 'Europa', titel: 'Bärlauch', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'blue' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'target', x: 5, z: 2, color: 'white' },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'prism', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 0, z: 2, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'target', x: 5, z: 1, color: 'blue' },
      { type: 'target', x: 0, z: 4, color: 'red' },
    ],
    solution: { '2,5': 3, '5,5': 1, '1,2': 1, '2,3': 1, '1,5': 6 },
  },
  {
    // Lösung: Spiegel (2,4) rot 1 · Spiegel (4,4) rot 1 · Spiegel (4,1) rot 3 · Spiegel (2,1) rot 1 ·
    //   Prisma (2,5) rot 5 · Spiegel (0,5) rot 3
    // Generator mittel-abzaehlen, Seed 10027 · Ausbau „mittel“
    name: 'Bachlauf', titel: 'Waldkauz', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 4, z: 5, color: 'magenta' },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 4, color: 'blue' },
      { type: 'prism', x: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 1, z: 2, color: 'red' },
    ],
    solution: { '2,4': 1, '4,4': 1, '4,1': 3, '2,1': 1, '2,5': 5, '0,5': 3 },
  },
  {
    // Lösung: Spiegel (5,4) rot 3 · Spiegel (2,4) rot 3 · Spiegel (2,1) rot 1 · Spiegel (5,1) rot 3 ·
    //   Prisma (5,5) rot 5 · Spiegel (2,5) rot 1
    // Generator mittel-abzaehlen, Seed 10373 · Ausbau „mittel“
    name: 'Lichtfeder', titel: 'Arvenwald', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 5, z: 0, color: 'cyan' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
      { type: 'target', x: 1, z: 1, color: 'blue' },
      { type: 'prism', x: 5, z: 5, rot: 6 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 1, color: 'red' },
    ],
    solution: { '5,4': 3, '2,4': 3, '2,1': 1, '5,1': 3, '5,5': 5, '2,5': 1 },
  },
  {
    // Lösung: Prisma (1,1) rot 0 · Spiegel (1,4) rot 1 · Spiegel (2,2) rot 2 · Spiegel (3,3) rot 0 ·
    //   Prisma (5,1) rot 0
    // Generator mittel-sammelstelle, Seed 187, Ziel 44,28–45,68 · ersetzt Glasmurmel (Austausch „mittel“)
    name: 'Dreiklang', titel: 'Rehkitz', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 1, rot: 3 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'green' },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'source', x: 0, z: 0, dir: 1, color: 'magenta' },
      { type: 'target', x: 4, z: 1, color: 'green' },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'source', x: 4, z: 0, dir: 3 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'prism', x: 5, z: 1, rot: 7 },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 0, z: 4, color: 'blue' },
    ],
    solution: { '1,1': 0, '1,4': 1, '2,2': 2, '3,3': 0, '5,1': 0 },
  },
  {
    // Lösung: Spiegel (3,5) rot 3 · Spiegel (2,2) rot 0 · Spiegel (3,3) rot 2 · Spiegel (5,5) rot 1 ·
    //   Prisma (4,4) rot 7 · Spiegel (5,4) rot 1
    // Generator mittel-abschalten, Seed 335, Ziel 44,28–45,68 · ersetzt Knotenpunkt (Austausch „mittel“)
    name: 'Weissglut', titel: 'Harztropfen', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 3, z: 5, rot: 1 },
      { type: 'target', x: 1, z: 5, color: 'white' },
      { type: 'source', x: 0, z: 4, dir: 7 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'target', x: 5, z: 6, color: 'white' },
      { type: 'source', x: 6, z: 0, dir: 3 },
      { type: 'prism', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 2, color: 'red' },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'target', x: 6, z: 5, color: 'blue' },
    ],
    solution: { '3,5': 3, '2,2': 0, '3,3': 2, '5,5': 1, '4,4': 7, '5,4': 1 },
  },
  {
    // Lösung: Prisma (3,5) rot 5 · Spiegel (3,3) rot 3 · Spiegel (2,5) rot 1 · Spiegel (2,4) rot 1 ·
    //   Prisma (3,6) rot 3 · Spiegel (0,4) rot 1
    // Generator mittel-falle, Seed 10184 · Ausbau „mittel“
    name: 'Malachit', titel: 'Buchenhain', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'prism', x: 3, z: 5, rot: 6 },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'target', x: 5, z: 3, color: 'blue' },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'source', x: 6, z: 3, dir: 3 },
      { type: 'prism', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'target', x: 3, z: 1, color: 'red' },
    ],
    solution: { '3,5': 5, '3,3': 3, '2,5': 1, '2,4': 1, '3,6': 3, '0,4': 1 },
  },
  {
    // Lösung: Spiegel (2,5) rot 3 · Spiegel (3,1) rot 0 · Prisma (2,0) rot 3 · Spiegel (1,1) rot 2 ·
    //   Spiegel (4,4) rot 0 · Spiegel (5,3) rot 0
    // Generator mittel-mischziel, Seed 47, Ziel 45,7–46,88 · ersetzt Lichtschacht (Austausch „mittel“)
    name: 'Meeresleuchten', titel: 'Gezeiten', grad: 'mittel',
    elements: [
      { type: 'source', x: 2, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'target', x: 4, z: 5, color: 'white' },
      { type: 'source', x: 4, z: 0, dir: 3, color: 'yellow' },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'prism', x: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'target', x: 6, z: 4, color: 'green' },
    ],
    solution: { '2,5': 3, '3,1': 0, '2,0': 3, '1,1': 2, '4,4': 0, '5,3': 0 },
  },
  {
    // Lösung: Prisma (6,2) rot 4 · Spiegel (6,0) rot 1 · Spiegel (1,3) rot 3 · Prisma (3,3) rot 1 ·
    //   Spiegel (5,5) rot 2
    // Generator mittel-sammelstelle, Seed 10577 · Ausbau „mittel“
    name: 'Spektrum', titel: 'Dünung', grad: 'mittel',
    elements: [
      { type: 'prism', x: 6, z: 2, rot: 0 },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'green' },
      { type: 'mirror', x: 6, z: 0, rot: 2 },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 2, z: 2, color: 'green' },
      { type: 'target', x: 3, z: 5, color: 'magenta' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 1, z: 3, rot: 1 },
      { type: 'prism', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'target', x: 5, z: 1, color: 'blue' },
      { type: 'target', x: 4, z: 6, color: 'green' },
    ],
    solution: { '6,2': 4, '6,0': 1, '1,3': 3, '3,3': 1, '5,5': 2 },
  },
  {
    // Lösung: Spiegel (1,1) rot 3 · Spiegel (1,4) rot 1 · Spiegel (4,4) rot 1 · Spiegel (4,1) rot 3 ·
    //   Prisma (1,5) rot 7 · Spiegel (4,5) rot 3
    // Generator mittel-abzaehlen, Seed 10761 · Ausbau „mittel“
    name: 'Granat', titel: 'Wellenkamm', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'target', x: 1, z: 0, color: 'magenta' },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'prism', x: 1, z: 5, rot: 4 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'target', x: 4, z: 0, color: 'blue' },
    ],
    solution: { '1,1': 3, '1,4': 1, '4,4': 1, '4,1': 3, '1,5': 7, '4,5': 3 },
  },
  {
    // Lösung: Spiegel (2,4) rot 3 · Spiegel (2,2) rot 1 · Spiegel (4,2) rot 3 · Spiegel (4,4) rot 3 ·
    //   Prisma (1,4) rot 1 · Spiegel (1,6) rot 1
    // Generator mittel-abzaehlen, Seed 10083 · Ausbau „mittel“
    name: 'Farbtafel', titel: 'Gischt', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'target', x: 5, z: 4, color: 'red' },
      { type: 'target', x: 4, z: 0, color: 'white' },
      { type: 'target', x: 1, z: 2, color: 'red' },
      { type: 'prism', x: 1, z: 4, rot: 7 },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'mirror', x: 2, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'green' },
    ],
    solution: { '2,4': 3, '2,2': 1, '4,2': 3, '4,4': 3, '1,4': 1, '1,6': 1 },
  },
  {
    // Lösung: Prisma (4,4) rot 7 · Spiegel (2,6) rot 0 · Prisma (4,1) rot 1 · Spiegel (4,3) rot 3 ·
    //   Kombinator (6,3) dir 2
    // Generator mittel-sammelstelle, Seed 10598 · Ausbau „mittel“
    name: 'Brillenglas', titel: 'Schaumkrone', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 4, rot: 5 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 0, z: 4, dir: 1, color: 'yellow' },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'target', x: 5, z: 4, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'green' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'cyan' },
      { type: 'prism', x: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'combiner', x: 6, z: 3, dir: 5 },
      { type: 'target', x: 6, z: 4, color: 'yellow' },
      { type: 'target', x: 1, z: 3, color: 'blue' },
    ],
    solution: { '4,4': 7, '2,6': 0, '4,1': 1, '4,3': 3, '6,3': 2 },
  },
  {
    // Lösung: Spiegel (2,5) rot 1 · Spiegel (5,5) rot 1 · Spiegel (5,1) rot 1 · Spiegel (2,1) rot 1 ·
    //   Prisma (1,1) rot 1 · Spiegel (1,6) rot 3
    // Generator mittel-abzaehlen, Seed 11065 · Ausbau „mittel“
    name: 'Ganymed', titel: 'Klippe', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'target', x: 2, z: 0, color: 'white' },
      { type: 'target', x: 6, z: 1, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'red' },
      { type: 'prism', x: 1, z: 1, rot: 7 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'mirror', x: 0, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 4, color: 'blue' },
    ],
    solution: { '2,5': 1, '5,5': 1, '5,1': 1, '2,1': 1, '1,1': 1, '1,6': 3 },
  },
  {
    // Lösung: Spiegel (1,4) rot 3 · Spiegel (4,0) rot 1 · Spiegel (3,3) rot 2 · Prisma (3,4) rot 3 ·
    //   Prisma (4,5) rot 5 · Prisma (5,5) rot 4
    // Generator mittel-lockvogel, Seed 10180 · Ausbau „mittel“
    name: 'Kobalt', titel: 'Bucht', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'cyan' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'cyan' },
      { type: 'source', x: 6, z: 6, dir: 5, color: 'magenta' },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'target', x: 1, z: 5, color: 'blue' },
      { type: 'target', x: 1, z: 0, color: 'blue' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'mirror', x: 1, z: 3, rot: 3, fixed: true },
      { type: 'prism', x: 3, z: 4, rot: 6 },
      { type: 'prism', x: 4, z: 5, rot: 0 },
      { type: 'prism', x: 5, z: 5, rot: 7 },
      { type: 'target', x: 1, z: 6, color: 'green' },
    ],
    solution: { '1,4': 3, '4,0': 1, '3,3': 2, '3,4': 3, '4,5': 5, '5,5': 4 },
  },
  {
    // Lösung: Spiegel (4,5) rot 1 · Spiegel (0,4) rot 1 · Spiegel (0,0) rot 3 · Spiegel (3,0) rot 1 ·
    //   Prisma (3,3) rot 1 · Spiegel (4,3) rot 1
    // Generator mittel-mischziel, Seed 11110 · Ausbau „mittel“
    name: 'Bergsee', titel: 'Riff', grad: 'mittel',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'target', x: 1, z: 5, color: 'yellow' },
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 0, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'prism', x: 3, z: 3, rot: 7 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'target', x: 3, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'target', x: 6, z: 6, color: 'green' },
    ],
    solution: { '4,5': 1, '0,4': 1, '0,0': 3, '3,0': 1, '3,3': 1, '4,3': 1 },
  },
  {
    // Lösung: Spiegel (3,5) rot 1 · Spiegel (5,5) rot 3 · Spiegel (4,3) rot 1 · Prisma (0,2) rot 1 ·
    //   Spiegel (0,5) rot 1 · Spiegel (6,6) rot 3 · Spiegel (1,3) rot 0
    // Generator mittel-mischziel, Seed 10435 · Ausbau „mittel“
    name: 'Sonnenuhr', titel: 'Wanderdüne', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'target', x: 5, z: 3, color: 'white' },
      { type: 'source', x: 2, z: 0, dir: 3, color: 'cyan' },
      { type: 'prism', x: 0, z: 2, rot: 6 },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 3, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 1 },
      { type: 'mirror', x: 6, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 2, z: 2, color: 'green' },
      { type: 'target', x: 5, z: 0, color: 'blue' },
    ],
    solution: { '3,5': 1, '5,5': 3, '4,3': 1, '0,2': 1, '0,5': 1, '6,6': 3, '1,3': 0 },
  },
  {
    // Lösung: Spiegel (0,2) rot 1 · Spiegel (3,2) rot 1 · Spiegel (3,5) rot 1 · Spiegel (0,5) rot 3 ·
    //   Prisma (4,2) rot 5 · Spiegel (4,1) rot 3 · Spiegel (5,1) rot 3 · Spiegel (5,0) rot 3
    // Generator mittel-abzaehlen, Seed 10480 · Ausbau „mittel“
    name: 'Mondstein', titel: 'Dünenkamm', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 0, z: 6, color: 'red' },
      { type: 'target', x: 3, z: 1, color: 'red' },
      { type: 'target', x: 5, z: 5, color: 'yellow' },
      { type: 'prism', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'blue' },
    ],
    solution: { '0,2': 1, '3,2': 1, '3,5': 1, '0,5': 3, '4,2': 5, '4,1': 3, '5,1': 3, '5,0': 3 },
  },
  {
    // Lösung: Prisma (1,5) rot 7 · Spiegel (0,4) rot 2 · Prisma (5,3) rot 4 · Spiegel (4,3) rot 3 ·
    //   Spiegel (3,5) rot 3
    // Generator mittel-sammelstelle, Seed 10066 · Ausbau „mittel“
    name: 'Deimos', titel: 'Seepferdchen', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 5, rot: 5 },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'red' },
      { type: 'source', x: 4, z: 0, dir: 3, color: 'cyan' },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'target', x: 1, z: 2, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'green' },
      { type: 'source', x: 6, z: 4, dir: 5 },
      { type: 'prism', x: 5, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 3, z: 2, color: 'blue' },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 5, color: 'green' },
    ],
    solution: { '1,5': 7, '0,4': 2, '5,3': 4, '4,3': 3, '3,5': 3 },
  },
  {
    // Lösung: Prisma (2,2) rot 1 · Spiegel (4,2) rot 3 · Spiegel (2,3) rot 1 · Spiegel (3,3) rot 1 ·
    //   Spiegel (3,5) rot 1 · Prisma (1,5) rot 7
    // Generator mittel-falle, Seed 10622 · Ausbau „mittel“
    name: 'Gipfelkreuz', titel: 'Qualle', grad: 'mittel',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'source', x: 2, z: 6, dir: 5 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'prism', x: 1, z: 5, rot: 5 },
      { type: 'mirror', x: 6, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 2, rot: 1, fixed: true },
      { type: 'target', x: 1, z: 0, color: 'red' },
      { type: 'target', x: 4, z: 6, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'blue' },
    ],
    solution: { '2,2': 1, '4,2': 3, '2,3': 1, '3,3': 1, '3,5': 1, '1,5': 7 },
  },
  {
    // Lösung: Prisma (3,6) rot 5 · Spiegel (5,4) rot 2 · Spiegel (1,6) rot 1 · Spiegel (1,1) rot 1 ·
    //   Spiegel (0,1) rot 1 · Spiegel (5,0) rot 0
    // Generator mittel-sammelstelle, Seed 10024 · Ausbau „mittel“
    name: 'Farbton', titel: 'Hieroglyphe', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 6, rot: 4 },
      { type: 'source', x: 1, z: 0, dir: 1, color: 'green' },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'magenta' },
      { type: 'target', x: 2, z: 5, color: 'yellow' },
      { type: 'target', x: 3, z: 1, color: 'blue' },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'target', x: 0, z: 0, color: 'red' },
      { type: 'source', x: 0, z: 5, dir: 7, color: 'red' },
      { type: 'mirror', x: 5, z: 0, rot: 1 },
      { type: 'mirror', x: 6, z: 1, rot: 2, fixed: true },
    ],
    solution: { '3,6': 5, '5,4': 2, '1,6': 1, '1,1': 1, '0,1': 1, '5,0': 0 },
  },
  {
    // Lösung: Spiegel (5,5) rot 1 · Spiegel (2,2) rot 1 · Spiegel (4,4) rot 3 · Prisma (4,1) rot 5 ·
    //   Spiegel (0,2) rot 1 · Spiegel (2,5) rot 1
    // Generator mittel-mischziel, Seed 10040 · Ausbau „mittel“
    name: 'Lichtgitter', titel: 'Beduinenzelt', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'green' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'target', x: 5, z: 2, color: 'cyan' },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'prism', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'target', x: 5, z: 6, color: 'red' },
    ],
    solution: { '5,5': 1, '2,2': 1, '4,4': 3, '4,1': 5, '0,2': 1, '2,5': 1 },
  },
  {
    // Lösung: Prisma (1,2) rot 4 · Spiegel (5,6) rot 0 · Prisma (1,1) rot 4 · Spiegel (0,2) rot 2 ·
    //   Spiegel (3,5) rot 0
    // Generator mittel-sammelstelle, Seed 10900 · Ausbau „mittel“
    name: 'Brennpunkt', titel: 'Sandsturm', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 2, rot: 7 },
      { type: 'source', x: 3, z: 0, dir: 3, color: 'yellow' },
      { type: 'source', x: 6, z: 5, dir: 3, color: 'blue' },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'target', x: 0, z: 1, color: 'cyan' },
      { type: 'source', x: 6, z: 6, dir: 5 },
      { type: 'prism', x: 1, z: 1, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 2, fixed: true },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'target', x: 0, z: 0, color: 'blue' },
    ],
    solution: { '1,2': 4, '5,6': 0, '1,1': 4, '0,2': 2, '3,5': 0 },
  },
  {
    // Lösung: Spiegel (6,3) rot 3 · Spiegel (3,3) rot 1 · Spiegel (3,5) rot 1 · Spiegel (6,5) rot 1 ·
    //   Prisma (6,2) rot 3 · Spiegel (4,2) rot 1 · Spiegel (1,0) rot 3 · Spiegel (1,2) rot 3
    // Generator mittel-abzaehlen, Seed 10612 · Ausbau „mittel“
    name: 'Onyx', titel: 'Grabkammer', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'target', x: 0, z: 5, color: 'red' },
      { type: 'target', x: 6, z: 6, color: 'white' },
      { type: 'target', x: 3, z: 1, color: 'red' },
      { type: 'prism', x: 6, z: 2, rot: 6 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'target', x: 0, z: 2, color: 'blue' },
    ],
    solution: { '6,3': 3, '3,3': 1, '3,5': 1, '6,5': 1, '6,2': 3, '4,2': 1, '1,0': 3, '1,2': 3 },
  },
  {
    // Lösung: Prisma (4,3) rot 6 · Spiegel (2,1) rot 0 · Spiegel (5,2) rot 2 · Spiegel (4,1) rot 2 ·
    //   Spiegel (2,4) rot 1 · Prisma (6,5) rot 4
    // Generator mittel-falle, Seed 10363 · Ausbau „mittel“
    name: 'Silhouette', titel: 'Sonnenbarke', grad: 'mittel',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 4, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 5, color: 'white' },
      { type: 'target', x: 5, z: 0, color: 'blue' },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'prism', x: 6, z: 5, rot: 5 },
      { type: 'target', x: 5, z: 6, color: 'red' },
    ],
    solution: { '4,3': 6, '2,1': 0, '5,2': 2, '4,1': 2, '2,4': 1, '6,5': 4 },
  },
  {
    // Lösung: Prisma (0,3) rot 6 · Spiegel (0,4) rot 1 · Prisma (4,1) rot 6 · Spiegel (5,0) rot 0 ·
    //   Spiegel (6,1) rot 2 · Spiegel (1,6) rot 0
    // Generator mittel-sammelstelle, Seed 10290 · Ausbau „mittel“
    name: 'Hängebrücke', titel: 'Wadi', grad: 'mittel',
    elements: [
      { type: 'prism', x: 0, z: 3, rot: 1 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'blue' },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'green' },
      { type: 'target', x: 3, z: 0, color: 'magenta' },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'prism', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 3 },
      { type: 'target', x: 4, z: 0, color: 'green' },
      { type: 'target', x: 0, z: 5, color: 'blue' },
    ],
    solution: { '0,3': 6, '0,4': 1, '4,1': 6, '5,0': 0, '6,1': 2, '1,6': 0 },
  },
  {
    // Lösung: Prisma (4,4) rot 5 · Spiegel (4,2) rot 3 · Spiegel (3,4) rot 1 · Spiegel (3,3) rot 1 ·
    //   Prisma (0,2) rot 1 · Kombinator (1,3) dir 7
    // Generator mittel-falle, Seed 11069 · Ausbau „mittel“
    name: 'Halbmond', titel: 'Salzsee', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'prism', x: 4, z: 4, rot: 4 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'source', x: 0, z: 0, dir: 2 },
      { type: 'prism', x: 0, z: 2, rot: 4 },
      { type: 'combiner', x: 1, z: 3, dir: 2 },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'target', x: 3, z: 1, color: 'yellow' },
      { type: 'target', x: 4, z: 1, color: 'red' },
    ],
    solution: { '4,4': 5, '4,2': 3, '3,4': 1, '3,3': 1, '0,2': 1, '1,3': 7 },
  },
  {
    // Lösung: Spiegel (1,2) rot 1 · Spiegel (1,4) rot 1 · Spiegel (3,4) rot 1 · Spiegel (3,2) rot 3 ·
    //   Prisma (4,4) rot 5 · Spiegel (4,0) rot 1 · Spiegel (1,0) rot 3 · Spiegel (3,1) rot 3
    // Generator mittel-abzaehlen, Seed 10426 · Ausbau „mittel“
    name: 'Aquamarin', titel: 'Glutofen', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'target', x: 5, z: 2, color: 'red' },
      { type: 'target', x: 3, z: 5, color: 'white' },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'prism', x: 4, z: 4, rot: 6 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'target', x: 6, z: 1, color: 'blue' },
    ],
    solution: { '1,2': 1, '1,4': 1, '3,4': 1, '3,2': 3, '4,4': 5, '4,0': 1, '1,0': 3, '3,1': 3 },
  },
  {
    // Lösung: Prisma (5,4) rot 4 · Spiegel (2,4) rot 1 · Spiegel (4,2) rot 1 · Spiegel (4,5) rot 1 ·
    //   Spiegel (3,5) rot 1 · Spiegel (1,0) rot 0 · Spiegel (2,2) rot 3
    // Wertung 27.7 · 7 drehbar · 3 Ziele · Rateschritte 159 · Profil mittel2/b-4-filter, Seed 4999940
    name: 'Lichtkreuz', titel: 'Lavastrom', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'prism', x: 5, z: 4, rot: 3 },
      { type: 'filter', x: 3, z: 4, color: 'yellow' },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'target', x: 4, z: 1, color: 'yellow' },
      { type: 'target', x: 6, z: 5, color: 'green' },
    ],
    solution: { '5,4': 4, '2,4': 1, '4,2': 1, '4,5': 1, '3,5': 1, '1,0': 0, '2,2': 3 },
  },
  {
    // Lösung: Prisma (5,2) rot 3 · Spiegel (5,1) rot 1 · Spiegel (5,5) rot 3 · Prisma (1,2) rot 0 ·
    //   Spiegel (5,6) rot 0
    // Generator mittel-sammelstelle, Seed 10416 · Ausbau „mittel“
    name: 'Neumond', titel: 'Magma', grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, z: 2, rot: 6 },
      { type: 'source', x: 6, z: 3, dir: 5, color: 'blue' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'target', x: 2, z: 2, color: 'cyan' },
      { type: 'target', x: 2, z: 5, color: 'yellow' },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'cyan' },
      { type: 'prism', x: 1, z: 2, rot: 5 },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'mirror', x: 6, z: 5, rot: 2, fixed: true },
      { type: 'target', x: 1, z: 0, color: 'blue' },
    ],
    solution: { '5,2': 3, '5,1': 1, '5,5': 3, '1,2': 0, '5,6': 0 },
  },
  {
    // Lösung: Spiegel (4,2) rot 1 · Spiegel (6,3) rot 3 · Spiegel (2,5) rot 3 · Spiegel (0,5) rot 3 ·
    //   Spiegel (0,6) rot 1 · Spiegel (1,6) rot 3 · Prisma (1,2) rot 7
    // Generator mittel-mischziel, Seed 10329 · Ausbau „mittel“
    name: 'Intarsie', titel: 'Lavasee', grad: 'mittel',
    elements: [
      { type: 'source', x: 4, z: 0, dir: 2, color: 'green' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'target', x: 6, z: 2, color: 'yellow' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'mirror', x: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 6, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'prism', x: 1, z: 2, rot: 3 },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'target', x: 1, z: 1, color: 'red' },
      { type: 'target', x: 4, z: 4, color: 'blue' },
    ],
    solution: { '4,2': 1, '6,3': 3, '2,5': 3, '0,5': 3, '0,6': 1, '1,6': 3, '1,2': 7 },
  },
  {
    // Lösung: Spiegel (5,2) rot 3 · Spiegel (3,5) rot 1 · Prisma (2,4) rot 5 · Spiegel (0,4) rot 3 ·
    //   Spiegel (1,3) rot 2 · Spiegel (1,1) rot 0 · Spiegel (0,5) rot 1 · Spiegel (3,6) rot 1
    // Generator mittel-mischziel, Seed 10570 · Ausbau „mittel“
    name: 'Perlglanz', titel: 'Geysir', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'blue' },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'target', x: 3, z: 2, color: 'white' },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'yellow' },
      { type: 'prism', x: 2, z: 4, rot: 4 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 2, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 3 },
      { type: 'target', x: 5, z: 6, color: 'red' },
    ],
    solution: { '5,2': 3, '3,5': 1, '2,4': 5, '0,4': 3, '1,3': 2, '1,1': 0, '0,5': 1, '3,6': 1 },
  },
  {
    // Lösung: Prisma (2,3) rot 7 · Spiegel (4,1) rot 2 · Prisma (6,0) rot 4 · Spiegel (1,5) rot 0 ·
    //   Spiegel (0,4) rot 2 · Spiegel (3,1) rot 0
    // Generator mittel-sammelstelle, Seed 10504 · Ausbau „mittel“
    name: 'Mondfinsternis', titel: 'Obsidian', grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, z: 3, rot: 5 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 0, z: 5, dir: 7, color: 'blue' },
      { type: 'target', x: 2, z: 1, color: 'red' },
      { type: 'target', x: 5, z: 3, color: 'magenta' },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 6, z: 0, rot: 7 },
      { type: 'mirror', x: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
    ],
    solution: { '2,3': 7, '4,1': 2, '6,0': 4, '1,5': 0, '0,4': 2, '3,1': 0 },
  },
  {
    // Lösung: Spiegel (4,2) rot 3 · Spiegel (4,4) rot 1 · Spiegel (1,4) rot 1 · Spiegel (1,2) rot 3 ·
    //   Prisma (5,2) rot 3 · Prisma (1,1) rot 1 · Spiegel (4,1) rot 1
    // Generator mittel-abzaehlen, Seed 10144 · Ausbau „mittel“
    name: 'Seidenglanz', titel: 'Tuffstein', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'target', x: 1, z: 6, color: 'magenta' },
      { type: 'prism', x: 5, z: 2, rot: 4 },
      { type: 'prism', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'target', x: 4, z: 5, color: 'red' },
    ],
    solution: { '4,2': 3, '4,4': 1, '1,4': 1, '1,2': 3, '5,2': 3, '1,1': 1, '4,1': 1 },
  },
  {
    // Lösung: Spiegel (1,2) rot 3 · Prisma (1,1) rot 7 · Spiegel (5,4) rot 3 · Spiegel (1,0) rot 3 ·
    //   Spiegel (2,4) rot 1 · Spiegel (3,1) rot 1 · Spiegel (2,0) rot 1
    // Wertung 27.8 · 7 drehbar · 3 Ziele · Rateschritte 190 · Profil mittel2/b-4-filter, Seed 4170829
    name: 'Sternschnuppe', titel: 'Aschewolke', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 0, fixed: true },
      { type: 'prism', x: 1, z: 1, rot: 2 },
      { type: 'filter', x: 1, z: 4, color: 'red' },
      { type: 'target', x: 5, z: 0, color: 'red' },
      { type: 'target', x: 1, z: 3, color: 'blue' },
      { type: 'target', x: 2, z: 5, color: 'red' },
    ],
    solution: { '1,2': 3, '1,1': 7, '5,4': 3, '1,0': 3, '2,4': 1, '3,1': 1, '2,0': 1 },
  },
  {
    // Lösung: Spiegel (5,5) rot 1 · Prisma (5,1) rot 0 · Spiegel (2,1) rot 3 · Spiegel (2,0) rot 3 ·
    //   Prisma (3,0) rot 0 · Spiegel (4,0) rot 1 · Spiegel (2,5) rot 1 · Spiegel (2,2) rot 1
    // Wertung 28.8 · 8 drehbar · 3 Ziele · Rateschritte 189 · Profil mittel2/b-4-prisma, Seed 4044674
    name: 'Spiegeltreppe', titel: 'Skarabäus', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'mirror', x: 6, z: 0, rot: 2, fixed: true },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'prism', x: 3, z: 0, rot: 5 },
      { type: 'prism', x: 5, z: 1, rot: 1 },
      { type: 'target', x: 6, z: 1, color: 'green' },
      { type: 'target', x: 1, z: 2, color: 'white' },
      { type: 'target', x: 5, z: 2, color: 'blue' },
    ],
    solution: { '5,5': 1, '5,1': 0, '2,1': 3, '2,0': 3, '3,0': 0, '4,0': 1, '2,5': 1, '2,2': 1 },
  },
  {
    // Lösung: Prisma (0,5) rot 7 · Spiegel (1,6) rot 0 · Spiegel (0,1) rot 2 · Spiegel (1,0) rot 0 ·
    //   Spiegel (2,1) rot 0 · Prisma (3,2) rot 4
    // Generator mittel-sammelstelle, Seed 11079 · Ausbau „mittel“
    name: 'Sonate', titel: 'Ascheregen', grad: 'mittel',
    elements: [
      { type: 'prism', x: 0, z: 5, rot: 1 },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'blue' },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'red' },
      { type: 'target', x: 5, z: 5, color: 'blue' },
      { type: 'target', x: 0, z: 2, color: 'yellow' },
      { type: 'source', x: 5, z: 6, dir: 5 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 4, z: 1, rot: 2, fixed: true },
      { type: 'prism', x: 3, z: 2, rot: 0 },
      { type: 'target', x: 1, z: 4, color: 'red' },
    ],
    solution: { '0,5': 7, '1,6': 0, '0,1': 2, '1,0': 0, '2,1': 0, '3,2': 4 },
  },
  {
    // Lösung: Spiegel (2,2) rot 1 · Spiegel (2,4) rot 1 · Spiegel (5,4) rot 1 · Spiegel (5,2) rot 1 ·
    //   Prisma (1,2) rot 1 · Spiegel (1,3) rot 3 · Spiegel (0,3) rot 3 · Spiegel (2,5) rot 1
    // Generator mittel-abzaehlen, Seed 20199, Ziel 52–58 · Ausbau „mittel“
    name: 'Merkur', titel: 'Fumarole', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'target', x: 6, z: 2, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'red' },
      { type: 'target', x: 2, z: 1, color: 'magenta' },
      { type: 'prism', x: 1, z: 2, rot: 7 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'target', x: 2, z: 6, color: 'blue' },
    ],
    solution: { '2,2': 1, '2,4': 1, '5,4': 1, '5,2': 1, '1,2': 1, '1,3': 3, '0,3': 3, '2,5': 1 },
  },
  {
    // Lösung: Spiegel (4,1) rot 2 · Spiegel (1,0) rot 0 · Spiegel (5,4) rot 0 · Spiegel (5,2) rot 0 ·
    //   Prisma (1,4) rot 0 · Spiegel (2,5) rot 0 · Spiegel (3,2) rot 0
    // Wertung 34 · 7 drehbar · 4 Ziele · Rateschritte 536 · Profil mittel2/b-4-filter, Seed 4241762
    name: 'Farbverlauf', titel: 'Bärenhüter', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 3 },
      { type: 'source', x: 0, z: 1, dir: 7 },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 0, fixed: true },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 0, fixed: true },
      { type: 'prism', x: 1, z: 4, rot: 3 },
      { type: 'filter', x: 2, z: 1, color: 'yellow' },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'target', x: 6, z: 1, color: 'white' },
      { type: 'target', x: 6, z: 3, color: 'magenta' },
      { type: 'target', x: 4, z: 4, color: 'green' },
    ],
    solution: { '4,1': 2, '1,0': 0, '5,4': 0, '5,2': 0, '1,4': 0, '2,5': 0, '3,2': 0 },
  },
  {
    // Lösung: Spiegel (6,1) rot 3 · Spiegel (1,1) rot 1 · Prisma (3,5) rot 7 · Spiegel (1,0) rot 3 ·
    //   Spiegel (3,4) rot 3 · Prisma (4,1) rot 3 · Spiegel (6,5) rot 3
    // Wertung 30.9 · 7 drehbar · 3 Ziele · Rateschritte 317 · Profil mittel2/b-4-prisma, Seed 4036449
    name: 'Glasfaser', titel: 'Phönix', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 2 },
      { type: 'source', x: 4, z: 6, dir: 5 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 2, fixed: true },
      { type: 'mirror', x: 4, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'prism', x: 4, z: 1, rot: 7 },
      { type: 'prism', x: 3, z: 5, rot: 5 },
      { type: 'target', x: 5, z: 0, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'white' },
      { type: 'target', x: 5, z: 4, color: 'yellow' },
    ],
    solution: { '6,1': 3, '1,1': 1, '3,5': 7, '1,0': 3, '3,4': 3, '4,1': 3, '6,5': 3 },
  },
  {
    // Lösung: Prisma (2,0) rot 3 · Spiegel (2,2) rot 1 · Spiegel (1,0) rot 3 · Spiegel (1,1) rot 3 ·
    //   Spiegel (0,1) rot 3 · Spiegel (2,4) rot 1 · Spiegel (0,2) rot 1 · Prisma (2,5) rot 4
    // Generator mittel-falle, Seed 218, Ziel 55,55–55,68 · ersetzt Weichensteller (Austausch „mittel“)
    name: 'Kaskade', titel: 'Io', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 4, color: 'magenta' },
      { type: 'prism', x: 2, z: 0, rot: 6 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'target', x: 4, z: 2, color: 'red' },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'prism', x: 2, z: 5, rot: 1 },
      { type: 'target', x: 0, z: 5, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'blue' },
    ],
    solution: { '2,0': 3, '2,2': 1, '1,0': 3, '1,1': 3, '0,1': 3, '2,4': 1, '0,2': 1, '2,5': 4 },
  },
  {
    // Lösung: Spiegel (5,3) rot 3 · Spiegel (4,3) rot 3 · Spiegel (1,5) rot 1 · Spiegel (4,2) rot 1 ·
    //   Spiegel (4,0) rot 1 · Prisma (2,0) rot 3 · Spiegel (2,3) rot 1
    // Generator mittel-mischziel, Seed 10309 · Ausbau „mittel“
    name: 'Ranke', titel: 'Triton', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'target', x: 4, z: 5, color: 'white' },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'prism', x: 2, z: 0, rot: 4 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'target', x: 3, z: 6, color: 'red' },
    ],
    solution: { '5,3': 3, '4,3': 3, '1,5': 1, '4,2': 1, '4,0': 1, '2,0': 3, '2,3': 1 },
  },
  {
    // Lösung: Spiegel (4,1) rot 1 · Spiegel (6,1) rot 3 · Spiegel (6,5) rot 1 · Spiegel (4,5) rot 1 ·
    //   Prisma (2,5) rot 7 · Spiegel (3,4) rot 2 · Spiegel (1,4) rot 0 · Spiegel (0,3) rot 2
    // Generator mittel-abzaehlen, Seed 10310 · Ausbau „mittel“
    name: 'Fernrohr', titel: 'Pluto', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'cyan' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 4, z: 6, color: 'blue' },
      { type: 'target', x: 2, z: 1, color: 'white' },
      { type: 'prism', x: 2, z: 5, rot: 6 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 1 },
    ],
    solution: { '4,1': 1, '6,1': 3, '6,5': 1, '4,5': 1, '2,5': 7, '3,4': 2, '1,4': 0, '0,3': 2 },
  },
  {
    // Lösung: Prisma (1,6) rot 7 · Spiegel (0,5) rot 2 · Spiegel (1,2) rot 1 · Spiegel (0,2) rot 3 ·
    //   Spiegel (0,3) rot 1 · Prisma (2,2) rot 4
    // Generator mittel-sammelstelle, Seed 11145 · Ausbau „mittel“
    name: 'Abenddämmerung', titel: 'Charon', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 6, rot: 3 },
      { type: 'source', x: 5, z: 0, dir: 3, color: 'magenta' },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'green' },
      { type: 'target', x: 4, z: 6, color: 'blue' },
      { type: 'target', x: 4, z: 3, color: 'yellow' },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'prism', x: 2, z: 2, rot: 2 },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'target', x: 1, z: 0, color: 'green' },
    ],
    solution: { '1,6': 7, '0,5': 2, '1,2': 1, '0,2': 3, '0,3': 1, '2,2': 4 },
  },
  {
    // Lösung: Prisma (3,2) rot 7 · Spiegel (3,0) rot 1 · Spiegel (4,2) rot 3 · Spiegel (4,1) rot 3 ·
    //   Prisma (2,3) rot 1 · Spiegel (6,3) rot 1 · Spiegel (2,6) rot 1
    // Generator mittel-falle, Seed 10318 · Ausbau „mittel“
    name: 'Lagune', titel: 'Polkappe', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'prism', x: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'target', x: 1, z: 0, color: 'red' },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'source', x: 0, z: 1, dir: 1 },
      { type: 'prism', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 5, z: 4, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'green' },
      { type: 'target', x: 5, z: 2, color: 'blue' },
      { type: 'target', x: 5, z: 1, color: 'blue' },
    ],
    solution: { '3,2': 7, '3,0': 1, '4,2': 3, '4,1': 3, '2,3': 1, '6,3': 1, '2,6': 1 },
  },
  {
    // Lösung: Spiegel (1,0) rot 0 · Spiegel (3,2) rot 2 · Spiegel (2,4) rot 1 · Spiegel (1,6) rot 0 ·
    //   Prisma (0,5) rot 7 · Spiegel (6,5) rot 1 · Spiegel (6,6) rot 3 · Spiegel (5,1) rot 1
    // Generator mittel-mischziel, Seed 20297, Ziel 52–58 · Ausbau „mittel“
    name: 'Arabeske', titel: 'Marsstaub', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 1, dir: 7, color: 'cyan' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'target', x: 1, z: 4, color: 'white' },
      { type: 'source', x: 6, z: 1, dir: 3 },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'prism', x: 0, z: 5, rot: 4 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 6, rot: 1 },
      { type: 'mirror', x: 5, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'target', x: 1, z: 1, color: 'blue' },
    ],
    solution: { '1,0': 0, '3,2': 2, '2,4': 1, '1,6': 0, '0,5': 7, '6,5': 1, '6,6': 3, '5,1': 1 },
  },
  {
    // Lösung: Spiegel (3,5) rot 1 · Spiegel (3,3) rot 3 · Spiegel (5,3) rot 3 · Spiegel (5,5) rot 1 ·
    //   Prisma (1,5) rot 7 · Prisma (3,1) rot 1 · Spiegel (6,1) rot 3
    // Generator mittel-abzaehlen, Seed 20005, Ziel 52–58 · Ausbau „mittel“
    name: 'Mars', titel: 'Vesta', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'magenta' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'cyan' },
      { type: 'target', x: 0, z: 3, color: 'blue' },
      { type: 'target', x: 6, z: 5, color: 'magenta' },
      { type: 'target', x: 3, z: 6, color: 'blue' },
      { type: 'prism', x: 1, z: 5, rot: 4 },
      { type: 'target', x: 2, z: 4, color: 'green' },
      { type: 'prism', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 1 },
      { type: 'mirror', x: 6, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 5, z: 6, color: 'red' },
    ],
    solution: { '3,5': 1, '3,3': 3, '5,3': 3, '5,5': 1, '1,5': 7, '3,1': 1, '6,1': 3 },
  },
  {
    // Lösung: Prisma (3,4) rot 6 · Spiegel (1,2) rot 2 · Spiegel (3,0) rot 0 · Spiegel (6,3) rot 2 ·
    //   Prisma (2,6) rot 7 · Spiegel (2,0) rot 1
    // Generator mittel-sammelstelle, Seed 10371 · Ausbau „mittel“
    name: 'Rückspiegel', titel: 'Ceres', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 4, rot: 1 },
      { type: 'source', x: 5, z: 6, dir: 5, color: 'magenta' },
      { type: 'source', x: 1, z: 6, dir: 7, color: 'green' },
      { type: 'target', x: 4, z: 3, color: 'blue' },
      { type: 'target', x: 3, z: 1, color: 'green' },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'target', x: 3, z: 6, color: 'magenta' },
      { type: 'source', x: 0, z: 4, dir: 1 },
      { type: 'prism', x: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 6, z: 2, rot: 2, fixed: true },
      { type: 'target', x: 0, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'green' },
    ],
    solution: { '3,4': 6, '1,2': 2, '3,0': 0, '6,3': 2, '2,6': 7, '2,0': 1 },
  },
  {
    // Lösung: Prisma (3,4) rot 5 · Prisma (2,2) rot 2 · Spiegel (2,6) rot 3 · Spiegel (5,5) rot 0 ·
    //   Spiegel (3,1) rot 3 · Spiegel (4,1) rot 1
    // Generator mittel-sammelstelle, Seed 10336 · Ausbau „mittel“
    name: 'Kupferglanz', titel: 'Erdschatten', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 4, rot: 2 },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'green' },
      { type: 'target', x: 0, z: 4, color: 'magenta' },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'prism', x: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 1 },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 0, z: 6, color: 'green' },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'target', x: 4, z: 6, color: 'blue' },
    ],
    solution: { '3,4': 5, '2,2': 2, '2,6': 3, '5,5': 0, '3,1': 3, '4,1': 1 },
  },
  {
    // Lösung: Prisma (4,1) rot 6 · Spiegel (2,1) rot 3 · Spiegel (5,1) rot 1 · Spiegel (4,2) rot 3 ·
    //   Prisma (4,4) rot 2 · Spiegel (4,6) rot 3 · Spiegel (3,6) rot 1
    // Generator mittel-sammelstelle, Seed 10139 · Ausbau „mittel“
    name: 'Regenschauer', titel: 'Drache', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 1, rot: 2 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'target', x: 5, z: 0, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'prism', x: 4, z: 4, rot: 4 },
      { type: 'target', x: 4, z: 0, color: 'green' },
      { type: 'target', x: 6, z: 6, color: 'red' },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 3, z: 6, rot: 3 },
    ],
    solution: { '4,1': 6, '2,1': 3, '5,1': 1, '4,2': 3, '4,4': 2, '4,6': 3, '3,6': 1 },
  },
  {
    // Lösung: Spiegel (5,4) rot 3 · Spiegel (2,4) rot 3 · Spiegel (2,1) rot 1 · Spiegel (5,1) rot 3 ·
    //   Prisma (5,5) rot 5 · Spiegel (4,5) rot 3 · Spiegel (2,6) rot 1 · Spiegel (6,1) rot 3
    // Generator mittel-abzaehlen, Seed 10993 · Ausbau „mittel“
    name: 'Wechselspiel', titel: 'Roter Fleck', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'target', x: 1, z: 1, color: 'blue' },
      { type: 'target', x: 5, z: 0, color: 'white' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
      { type: 'prism', x: 5, z: 5, rot: 7 },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 4, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'red' },
    ],
    solution: { '5,4': 3, '2,4': 3, '2,1': 1, '5,1': 3, '5,5': 5, '4,5': 3, '2,6': 1, '6,1': 3 },
  },
  {
    // Lösung: Spiegel (2,0) rot 0 · Spiegel (3,1) rot 2 · Spiegel (4,6) rot 3 · Spiegel (4,2) rot 3 ·
    //   Spiegel (5,4) rot 3 · Spiegel (6,4) rot 3 · Prisma (6,2) rot 4
    // Generator mittel-mischziel, Seed 20358, Ziel 52–58 · Ausbau „mittel“
    name: 'Walzer', titel: 'Adler', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 7, color: 'red' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'target', x: 2, z: 2, color: 'magenta' },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'prism', x: 6, z: 2, rot: 3 },
      { type: 'mirror', x: 0, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 3, z: 5, color: 'red' },
      { type: 'target', x: 5, z: 0, color: 'green' },
    ],
    solution: { '2,0': 0, '3,1': 2, '4,6': 3, '4,2': 3, '5,4': 3, '6,4': 3, '6,2': 4 },
  },
  {
    // Lösung: Prisma (4,2) rot 3 · Spiegel (4,4) rot 1 · Spiegel (3,2) rot 3 · Spiegel (3,3) rot 3 ·
    //   Spiegel (2,3) rot 3 · Spiegel (1,3) rot 1 · Prisma (1,1) rot 5 · Spiegel (2,6) rot 1
    // Generator mittel-falle, Seed 10421 · Ausbau „mittel“
    name: 'Glasharfe', titel: 'Pegasus', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'prism', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'prism', x: 1, z: 1, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'target', x: 0, z: 3, color: 'blue' },
      { type: 'target', x: 1, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'target', x: 6, z: 6, color: 'blue' },
    ],
    solution: { '4,2': 3, '4,4': 1, '3,2': 3, '3,3': 3, '2,3': 3, '1,3': 1, '1,1': 5, '2,6': 1 },
  },
  {
    // Lösung: Prisma (1,4) rot 2 · Spiegel (5,4) rot 1 · Spiegel (4,1) rot 0 · Spiegel (1,2) rot 2 ·
    //   Spiegel (2,5) rot 2 · Spiegel (2,1) rot 0 · Prisma (3,0) rot 0 · Spiegel (5,0) rot 0
    // Generator mittel-sammelstelle, Seed 10036 · Ausbau „mittel“
    name: 'Laterna magica', titel: 'Perseus', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 4, rot: 3 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'source', x: 6, z: 3, dir: 5, color: 'green' },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'target', x: 0, z: 5, color: 'blue' },
      { type: 'target', x: 1, z: 5, color: 'green' },
      { type: 'source', x: 0, z: 3, dir: 7 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 2, fixed: true },
      { type: 'mirror', x: 1, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 2, z: 5, rot: 1 },
      { type: 'target', x: 1, z: 6, color: 'red' },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'prism', x: 3, z: 0, rot: 4 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'target', x: 6, z: 1, color: 'blue' },
      { type: 'target', x: 4, z: 0, color: 'green' },
    ],
    solution: { '1,4': 2, '5,4': 1, '4,1': 0, '1,2': 2, '2,5': 2, '2,1': 0, '3,0': 0, '5,0': 0 },
  },
  {
    // Lösung: Spiegel (3,4) rot 0 · Spiegel (4,6) rot 3 · Spiegel (6,2) rot 1 · Prisma (2,3) rot 1 ·
    //   Prisma (4,5) rot 2 · Prisma (3,2) rot 0 · Spiegel (5,3) rot 1
    // Generator mittel-lockvogel, Seed 10102 · Ausbau „mittel“
    name: 'Kristall', titel: 'Einhorn', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 1, dir: 1, color: 'yellow' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'target', x: 6, z: 1, color: 'green' },
      { type: 'target', x: 1, z: 6, color: 'green' },
      { type: 'target', x: 6, z: 6, color: 'green' },
      { type: 'mirror', x: 2, z: 5, rot: 2, fixed: true },
      { type: 'prism', x: 2, z: 3, rot: 5 },
      { type: 'prism', x: 4, z: 5, rot: 0 },
      { type: 'prism', x: 3, z: 2, rot: 5 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'target', x: 5, z: 5, color: 'red' },
    ],
    solution: { '3,4': 0, '4,6': 3, '6,2': 1, '2,3': 1, '4,5': 2, '3,2': 0, '5,3': 1 },
  },
  {
    // Lösung: Prisma (6,3) rot 3 · Spiegel (4,3) rot 1 · Spiegel (6,4) rot 3 · Spiegel (5,4) rot 3 ·
    //   Spiegel (3,4) rot 1 · Prisma (5,0) rot 4 · Spiegel (5,5) rot 1 · Spiegel (6,5) rot 1
    // Generator mittel-falle, Seed 10749 · Ausbau „mittel“
    name: 'Gleichgewicht', titel: 'Fuhrmann', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 6, z: 3, rot: 6 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'target', x: 4, z: 1, color: 'blue' },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'prism', x: 5, z: 0, rot: 6 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 0, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'red' },
    ],
    solution: { '6,3': 3, '4,3': 1, '6,4': 3, '5,4': 3, '3,4': 1, '5,0': 4, '5,5': 1, '6,5': 1 },
  },
  {
    // Lösung: Prisma (1,2) rot 5 · Spiegel (4,2) rot 3 · Spiegel (4,4) rot 3 · Spiegel (2,4) rot 1 ·
    //   Spiegel (2,0) rot 3 · Spiegel (6,4) rot 1 · Spiegel (5,0) rot 1 · Prisma (4,5) rot 5
    // Wertung 35.5 · 8 drehbar · 4 Ziele · Rateschritte 956 · Profil mittel2/b-4-bunt, Seed 4056924
    name: 'Silberstreif', titel: 'Schwan', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 5, rot: 1, fixed: true },
      { type: 'prism', x: 1, z: 2, rot: 1 },
      { type: 'prism', x: 4, z: 5, rot: 3 },
      { type: 'filter', x: 3, z: 0, color: 'cyan' },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'target', x: 1, z: 4, color: 'red' },
      { type: 'target', x: 5, z: 5, color: 'cyan' },
      { type: 'target', x: 6, z: 6, color: 'blue' },
    ],
    solution: { '1,2': 5, '4,2': 3, '4,4': 3, '2,4': 1, '2,0': 3, '6,4': 1, '5,0': 1, '4,5': 5 },
  },
  {
    // Lösung: Spiegel (4,1) rot 1 · Spiegel (4,4) rot 1 · Spiegel (1,4) rot 1 · Spiegel (1,1) rot 1 ·
    //   Prisma (4,5) rot 7 · Prisma (5,1) rot 5 · Spiegel (6,5) rot 3 · Spiegel (6,3) rot 1
    // Generator mittel-abzaehlen, Seed 385, Ziel 57,28–58,31 · ersetzt Polarlicht (Austausch „mittel“)
    name: 'Doppelstern', titel: 'Herkules', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'magenta' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 4, color: 'yellow' },
      { type: 'prism', x: 4, z: 5, rot: 4 },
      { type: 'prism', x: 5, z: 1, rot: 6 },
      { type: 'mirror', x: 6, z: 5, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 1, fixed: true },
      { type: 'target', x: 3, z: 0, color: 'blue' },
      { type: 'target', x: 5, z: 0, color: 'blue' },
    ],
    solution: { '4,1': 1, '4,4': 1, '1,4': 1, '1,1': 1, '4,5': 7, '5,1': 5, '6,5': 3, '6,3': 1 },
  },
  {
    // Lösung: Spiegel (1,1) rot 3 · Spiegel (3,1) rot 1 · Spiegel (3,4) rot 1 · Spiegel (1,4) rot 3 ·
    //   Prisma (5,1) rot 4 · Spiegel (4,2) rot 2 · Spiegel (5,3) rot 0 · Spiegel (4,4) rot 1 ·
    //   Spiegel (0,4) rot 3
    // Generator schwer-abzaehlen, Seed 10231 · Ausbau „schwer“
    name: 'Steinkreis', titel: 'Fuchsbau', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'yellow' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'green' },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'cyan' },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'target', x: 1, z: 6, color: 'cyan' },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'prism', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'target', x: 6, z: 2, color: 'red' },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'target', x: 0, z: 5, color: 'red' },
    ],
    solution: { '1,1': 3, '3,1': 1, '3,4': 1, '1,4': 3, '5,1': 4, '4,2': 2, '5,3': 0, '4,4': 1, '0,4': 3 },
  },
  {
    // Lösung: Spiegel (5,5) rot 1 · Spiegel (5,2) rot 1 · Spiegel (3,2) rot 1 · Spiegel (3,5) rot 1 ·
    //   Prisma (1,2) rot 7 · Spiegel (2,1) rot 2 · Spiegel (6,5) rot 1 · Spiegel (3,0) rot 1
    // Generator schwer-abzaehlen, Seed 10030 · Ausbau „schwer“
    name: 'Irrgarten', titel: 'Totholz', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'cyan' },
      { type: 'target', x: 5, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 0, z: 5, color: 'magenta' },
      { type: 'prism', x: 1, z: 2, rot: 6 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 1, z: 0, rot: 0, fixed: true },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'target', x: 2, z: 0, color: 'green' },
    ],
    solution: { '5,5': 1, '5,2': 1, '3,2': 1, '3,5': 1, '1,2': 7, '2,1': 2, '6,5': 1, '3,0': 1 },
  },
  {
    // Lösung: Prisma (1,6) rot 6 · Spiegel (3,6) rot 3 · Spiegel (1,1) rot 3 · Spiegel (5,6) rot 0 ·
    //   Spiegel (4,1) rot 1 · Spiegel (2,3) rot 0 · Spiegel (1,0) rot 1
    // Generator schwer-sammelstelle, Seed 10001 · Ausbau „schwer“
    name: 'Observatorium', titel: 'Ameisenhügel', grad: 'schwer',
    elements: [
      { type: 'prism', x: 1, z: 6, rot: 1 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'cyan' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'target', x: 4, z: 3, color: 'cyan' },
      { type: 'target', x: 0, z: 5, color: 'yellow' },
      { type: 'source', x: 6, z: 5, dir: 3, color: 'green' },
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'target', x: 0, z: 0, color: 'white' },
    ],
    solution: { '1,6': 6, '3,6': 3, '1,1': 3, '5,6': 0, '4,1': 1, '2,3': 0, '1,0': 1 },
  },
  {
    // Lösung: Spiegel (5,4) rot 0 · Prisma (2,4) rot 7 · Spiegel (2,1) rot 3 · Spiegel (4,2) rot 0 ·
    //   Spiegel (6,4) rot 2 · Spiegel (3,4) rot 3 · Spiegel (5,5) rot 2 · Spiegel (3,1) rot 3 ·
    //   Spiegel (3,0) rot 3
    // Generator schwer-mischziel, Seed 10247 · Ausbau „schwer“
    name: 'Gipfelsturm', titel: 'Köhlerhütte', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 5, dir: 5, color: 'green' },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'target', x: 4, z: 5, color: 'white' },
      { type: 'source', x: 0, z: 6, dir: 7 },
      { type: 'prism', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 6, color: 'green' },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'blue' },
    ],
    solution: { '5,4': 0, '2,4': 7, '2,1': 3, '4,2': 0, '6,4': 2, '3,4': 3, '5,5': 2, '3,1': 3, '3,0': 3 },
  },
  {
    // Lösung: Spiegel (4,0) rot 3 · Spiegel (0,2) rot 1 · Spiegel (2,3) rot 0 · Prisma (4,3) rot 5 ·
    //   Prisma (1,2) rot 3 · Prisma (3,4) rot 4 · Spiegel (1,6) rot 1
    // Generator schwer-lockvogel, Seed 10060 · Ausbau „schwer“
    name: 'Expedition', titel: 'Hirschkäfer', grad: 'schwer',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'source', x: 5, z: 6, dir: 5, color: 'cyan' },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'target', x: 5, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 5, color: 'blue' },
      { type: 'mirror', x: 1, z: 0, rot: 1, fixed: true },
      { type: 'prism', x: 4, z: 3, rot: 4 },
      { type: 'prism', x: 1, z: 2, rot: 2 },
      { type: 'prism', x: 3, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 4, color: 'yellow' },
      { type: 'target', x: 3, z: 3, color: 'red' },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 2, z: 6, rot: 3, fixed: true },
    ],
    solution: { '4,0': 3, '0,2': 1, '2,3': 0, '4,3': 5, '1,2': 3, '3,4': 4, '1,6': 1 },
  },
  {
    // Lösung: Prisma (3,1) rot 0 · Prisma (0,5) rot 6 · Spiegel (0,4) rot 3 · Spiegel (4,4) rot 1 ·
    //   Spiegel (4,6) rot 1 · Spiegel (5,6) rot 3 · Spiegel (5,1) rot 3 · Spiegel (6,1) rot 3
    // Generator schwer-sammelstelle, Seed 10076 · Ausbau „schwer“
    name: 'Polarfahrt', titel: 'Buntspecht', grad: 'schwer',
    elements: [
      { type: 'prism', x: 3, z: 1, rot: 6 },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 2, z: 0, dir: 1, color: 'green' },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'target', x: 4, z: 1, color: 'cyan' },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'prism', x: 0, z: 5, rot: 4 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 1 },
      { type: 'target', x: 6, z: 0, color: 'green' },
    ],
    solution: { '3,1': 0, '0,5': 6, '0,4': 3, '4,4': 1, '4,6': 1, '5,6': 3, '5,1': 3, '6,1': 3 },
  },
  {
    // Lösung: Prisma (4,4) rot 2 · Spiegel (6,4) rot 3 · Spiegel (1,2) rot 1 · Prisma (3,2) rot 2 ·
    //   Spiegel (2,3) rot 2 · Spiegel (6,5) rot 2 · Spiegel (4,5) rot 2
    // Generator schwer-sammelstelle, Seed 10121 · Ausbau „schwer“
    name: 'Windjammer', titel: 'Steilküste', grad: 'schwer',
    elements: [
      { type: 'prism', x: 4, z: 4, rot: 1 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'target', x: 3, z: 5, color: 'cyan' },
      { type: 'target', x: 6, z: 6, color: 'red' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'prism', x: 3, z: 2, rot: 5 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 6, z: 5, rot: 1 },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 3, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 0, z: 3, color: 'blue' },
      { type: 'target', x: 5, z: 6, color: 'red' },
    ],
    solution: { '4,4': 2, '6,4': 3, '1,2': 1, '3,2': 2, '2,3': 2, '6,5': 2, '4,5': 2 },
  },
  {
    // Lösung: Spiegel (3,2) rot 1 · Spiegel (1,2) rot 1 · Spiegel (1,5) rot 1 · Spiegel (3,5) rot 1 ·
    //   Prisma (3,1) rot 3 · Spiegel (2,1) rot 1 · Spiegel (1,1) rot 1 · Prisma (4,5) rot 1
    // Generator schwer-abzaehlen, Seed 10140 · Ausbau „schwer“
    name: 'Dreimaster', titel: 'Austernbank', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'white' },
      { type: 'target', x: 5, z: 2, color: 'red' },
      { type: 'target', x: 0, z: 5, color: 'red' },
      { type: 'prism', x: 3, z: 1, rot: 7 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 1, z: 0, color: 'blue' },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'prism', x: 4, z: 5, rot: 0 },
      { type: 'target', x: 5, z: 6, color: 'green' },
    ],
    solution: { '3,2': 1, '1,2': 1, '1,5': 1, '3,5': 1, '3,1': 3, '2,1': 1, '1,1': 1, '4,5': 1 },
  },
  {
    // Lösung: Spiegel (4,5) rot 3 · Spiegel (4,1) rot 3 · Spiegel (2,3) rot 1 · Prisma (2,6) rot 1 ·
    //   Spiegel (5,6) rot 3 · Spiegel (1,0) rot 0 · Prisma (2,1) rot 1
    // Generator schwer-mischziel, Seed 10351 · Ausbau „schwer“
    name: 'Weltreise', titel: 'Seehund', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 5, dir: 0, color: 'green' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'target', x: 4, z: 4, color: 'white' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'prism', x: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'source', x: 0, z: 1, dir: 7 },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'prism', x: 2, z: 1, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'green' },
      { type: 'target', x: 3, z: 3, color: 'blue' },
      { type: 'target', x: 4, z: 0, color: 'red' },
    ],
    solution: { '4,5': 3, '4,1': 3, '2,3': 1, '2,6': 1, '5,6': 3, '1,0': 0, '2,1': 1 },
  },
  {
    // Lösung: Prisma (2,5) rot 6 · Spiegel (4,3) rot 0 · Spiegel (1,4) rot 2 · Spiegel (2,3) rot 2 ·
    //   Spiegel (0,1) rot 2 · Spiegel (1,0) rot 0 · Spiegel (5,2) rot 0 · Prisma (0,5) rot 6 ·
    //   Spiegel (0,3) rot 2
    // Generator schwer-falle, Seed 10215 · Ausbau „schwer“
    name: 'Segeltörn', titel: 'Felsenbucht', grad: 'schwer',
    elements: [
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'blue' },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'source', x: 1, z: 6, dir: 5, color: 'cyan' },
      { type: 'prism', x: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 0, rot: 0, fixed: true },
      { type: 'target', x: 0, z: 4, color: 'green' },
      { type: 'target', x: 6, z: 1, color: 'blue' },
    ],
    solution: { '2,5': 6, '4,3': 0, '1,4': 2, '2,3': 2, '0,1': 2, '1,0': 0, '5,2': 0, '0,5': 6, '0,3': 2 },
  },
  {
    // Lösung: Spiegel (6,5) rot 1 · Spiegel (4,5) rot 1 · Spiegel (4,3) rot 1 · Spiegel (6,3) rot 3 ·
    //   Prisma (3,5) rot 7 · Spiegel (3,2) rot 1 · Prisma (4,2) rot 1 · Spiegel (5,2) rot 3 ·
    //   Spiegel (0,0) rot 3
    // Generator schwer-abzaehlen, Seed 10148 · Ausbau „schwer“
    name: 'Kreuzfahrt', titel: 'Meerenge', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'target', x: 4, z: 6, color: 'blue' },
      { type: 'target', x: 1, z: 3, color: 'white' },
      { type: 'target', x: 6, z: 1, color: 'blue' },
      { type: 'prism', x: 3, z: 5, rot: 4 },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 1, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 0, rot: 1, fixed: true },
      { type: 'prism', x: 4, z: 2, rot: 6 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'target', x: 0, z: 1, color: 'red' },
    ],
    solution: { '6,5': 1, '4,5': 1, '4,3': 1, '6,3': 3, '3,5': 7, '3,2': 1, '4,2': 1, '5,2': 3, '0,0': 3 },
  },
  {
    // Lösung: Prisma (3,2) rot 7 · Spiegel (3,3) rot 1 · Spiegel (3,0) rot 1 · Spiegel (2,0) rot 3 ·
    //   Prisma (1,2) rot 1 · Spiegel (2,1) rot 1 · Spiegel (1,6) rot 1 · Spiegel (4,5) rot 0
    // Generator schwer-sammelstelle, Seed 10329 · Ausbau „schwer“
    name: 'Gambit', titel: 'Kielwasser', grad: 'schwer',
    elements: [
      { type: 'prism', x: 3, z: 2, rot: 4 },
      { type: 'source', x: 0, z: 5, dir: 7, color: 'magenta' },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'green' },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 4, z: 1, color: 'yellow' },
      { type: 'source', x: 0, z: 1, dir: 1 },
      { type: 'mirror', x: 3, z: 0, rot: 3 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'prism', x: 1, z: 2, rot: 6 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'target', x: 4, z: 6, color: 'blue' },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'target', x: 5, z: 4, color: 'green' },
    ],
    solution: { '3,2': 7, '3,3': 1, '3,0': 1, '2,0': 3, '1,2': 1, '2,1': 1, '1,6': 1, '4,5': 0 },
  },
  {
    // Lösung: Prisma (4,5) rot 4 · Spiegel (5,6) rot 0 · Spiegel (4,4) rot 3 · Prisma (6,1) rot 3 ·
    //   Spiegel (6,3) rot 3 · Spiegel (1,6) rot 0 · Prisma (2,2) rot 7
    // Generator schwer-sammelstelle, Seed 10116 · Ausbau „schwer“
    name: 'Schatzkarte', titel: 'Sturmflut', grad: 'schwer',
    elements: [
      { type: 'prism', x: 4, z: 5, rot: 2 },
      { type: 'source', x: 6, z: 5, dir: 3, color: 'blue' },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'green' },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'target', x: 2, z: 3, color: 'white' },
      { type: 'target', x: 1, z: 5, color: 'green' },
      { type: 'source', x: 5, z: 0, dir: 1 },
      { type: 'prism', x: 6, z: 1, rot: 6 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 3 },
      { type: 'mirror', x: 0, z: 5, rot: 2, fixed: true },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'prism', x: 2, z: 2, rot: 2 },
      { type: 'target', x: 4, z: 2, color: 'blue' },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'target', x: 4, z: 0, color: 'green' },
    ],
    solution: { '4,5': 4, '5,6': 0, '4,4': 3, '6,1': 3, '6,3': 3, '1,6': 0, '2,2': 7 },
  },
  {
    // Lösung: Spiegel (5,3) rot 1 · Spiegel (3,3) rot 1 · Spiegel (3,6) rot 3 · Spiegel (5,6) rot 1 ·
    //   Prisma (5,1) rot 2 · Prisma (1,3) rot 0 · Spiegel (3,1) rot 0 · Spiegel (2,4) rot 1
    // Generator schwer-abzaehlen, Seed 10276 · Ausbau „schwer“
    name: 'Steilwand', titel: 'Priel', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'yellow' },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'yellow' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 6, z: 3, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'cyan' },
      { type: 'target', x: 3, z: 2, color: 'yellow' },
      { type: 'prism', x: 5, z: 1, rot: 6 },
      { type: 'target', x: 6, z: 2, color: 'red' },
      { type: 'prism', x: 1, z: 3, rot: 5 },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'target', x: 4, z: 2, color: 'red' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'mirror', x: 2, z: 4, rot: 3 },
    ],
    solution: { '5,3': 1, '3,3': 1, '3,6': 3, '5,6': 1, '5,1': 2, '1,3': 0, '3,1': 0, '2,4': 1 },
  },
  {
    // Lösung: Spiegel (3,6) rot 1 · Spiegel (3,2) rot 3 · Spiegel (5,2) rot 3 · Spiegel (5,1) rot 3 ·
    //   Prisma (6,1) rot 7 · Prisma (4,4) rot 1 · Spiegel (4,5) rot 3 · Spiegel (2,5) rot 3
    // Generator schwer-mischziel, Seed 10487 · Ausbau „schwer“
    name: 'Nordwand', titel: 'Seenebel', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'blue' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'mirror', x: 5, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 5, z: 5, color: 'white' },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'prism', x: 6, z: 1, rot: 5 },
      { type: 'mirror', x: 6, z: 0, rot: 1, fixed: true },
      { type: 'source', x: 4, z: 0, dir: 2 },
      { type: 'prism', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'target', x: 5, z: 0, color: 'red' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'red' },
    ],
    solution: { '3,6': 1, '3,2': 3, '5,2': 3, '5,1': 3, '6,1': 7, '4,4': 1, '4,5': 3, '2,5': 3 },
  },
  {
    // Lösung: Prisma (3,1) rot 7 · Spiegel (0,4) rot 2 · Spiegel (0,2) rot 2 · Spiegel (1,1) rot 2 ·
    //   Prisma (3,3) rot 4 · Spiegel (2,3) rot 3 · Spiegel (2,5) rot 1 · Spiegel (4,5) rot 3
    // Generator schwer-sammelstelle, Seed 10559 · Ausbau „schwer“
    name: 'Minotaurus', titel: 'Königsgrab', grad: 'schwer',
    elements: [
      { type: 'prism', x: 3, z: 1, rot: 1 },
      { type: 'source', x: 6, z: 4, dir: 5, color: 'blue' },
      { type: 'source', x: 2, z: 6, dir: 5, color: 'red' },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'target', x: 4, z: 1, color: 'cyan' },
      { type: 'target', x: 3, z: 0, color: 'red' },
      { type: 'source', x: 4, z: 6, dir: 5, color: 'blue' },
      { type: 'mirror', x: 0, z: 2, rot: 1 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'prism', x: 3, z: 3, rot: 5 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 6, color: 'red' },
    ],
    solution: { '3,1': 7, '0,4': 2, '0,2': 2, '1,1': 2, '3,3': 4, '2,3': 3, '2,5': 1, '4,5': 3 },
  },
  {
    // Lösung: Spiegel (4,2) rot 1 · Spiegel (6,2) rot 3 · Spiegel (6,4) rot 1 · Spiegel (4,4) rot 1 ·
    //   Spiegel (1,0) rot 3 · Spiegel (2,0) rot 1 · Prisma (2,4) rot 1 · Spiegel (2,5) rot 3
    // Generator schwer-abzaehlen, Seed 324, Ziel 59,45–60,41 · ersetzt Unendlichkeit (Austausch „schwer“)
    name: 'Wegweiser', titel: 'Waldquelle', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'yellow' },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'target', x: 2, z: 2, color: 'white' },
      { type: 'target', x: 4, z: 5, color: 'red' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'prism', x: 2, z: 4, rot: 5 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'target', x: 0, z: 5, color: 'blue' },
    ],
    solution: { '4,2': 1, '6,2': 3, '6,4': 1, '4,4': 1, '1,0': 3, '2,0': 1, '2,4': 1, '2,5': 3 },
  },
  {
    // Lösung: Prisma (2,2) rot 0 · Spiegel (4,4) rot 2 · Spiegel (3,1) rot 0 · Spiegel (4,2) rot 0 ·
    //   Spiegel (5,1) rot 2 · Spiegel (2,1) rot 2 · Spiegel (0,1) rot 2 · Prisma (1,0) rot 0
    // Generator schwer-falle, Seed 557, Ziel 58,5–59,28 · ersetzt Rangierbahnhof (Austausch „schwer“)
    name: 'Passstrasse', titel: 'Bergpfad', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'target', x: 4, z: 0, color: 'yellow' },
      { type: 'blocker', x: 4, z: 1 },
      { type: 'source', x: 5, z: 6, dir: 5 },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
      { type: 'prism', x: 1, z: 0, rot: 6 },
      { type: 'target', x: 0, z: 3, color: 'blue' },
    ],
    solution: { '2,2': 0, '4,4': 2, '3,1': 0, '4,2': 0, '5,1': 2, '2,1': 2, '0,1': 2, '1,0': 0 },
  },
  {
    // Lösung: Spiegel (4,5) rot 1 · Spiegel (4,1) rot 1 · Spiegel (2,1) rot 1 · Spiegel (2,5) rot 1 ·
    //   Prisma (5,5) rot 3 · Spiegel (5,6) rot 1 · Spiegel (4,0) rot 3 · Spiegel (5,0) rot 1
    // Generator schwer-abzaehlen, Seed 10580 · Ausbau „schwer“
    name: 'Kaperfahrt', titel: 'Sarkophag', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'target', x: 4, z: 6, color: 'white' },
      { type: 'target', x: 1, z: 5, color: 'blue' },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'prism', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'target', x: 6, z: 6, color: 'red' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'green' },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
    ],
    solution: { '4,5': 1, '4,1': 1, '2,1': 1, '2,5': 1, '5,5': 3, '5,6': 1, '4,0': 3, '5,0': 1 },
  },
  {
    // Lösung: Prisma (5,6) rot 0 · Spiegel (3,5) rot 0 · Prisma (2,4) rot 4 · Spiegel (0,4) rot 3 ·
    //   Spiegel (0,2) rot 2 · Spiegel (2,0) rot 0 · Spiegel (6,4) rot 2 · Prisma (2,1) rot 1
    // Generator schwer-sammelstelle, Seed 10387 · Ausbau „schwer“
    name: 'Biwak', titel: 'Steinwüste', grad: 'schwer',
    elements: [
      { type: 'prism', x: 5, z: 6, rot: 2 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'green' },
      { type: 'source', x: 0, z: 1, dir: 1, color: 'red' },
      { type: 'target', x: 6, z: 6, color: 'green' },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
      { type: 'source', x: 6, z: 2, dir: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'prism', x: 2, z: 4, rot: 6 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'target', x: 5, z: 5, color: 'blue' },
      { type: 'target', x: 1, z: 5, color: 'red' },
      { type: 'source', x: 0, z: 3, dir: 7 },
      { type: 'prism', x: 2, z: 1, rot: 0 },
      { type: 'target', x: 0, z: 5, color: 'green' },
    ],
    solution: { '5,6': 0, '3,5': 0, '2,4': 4, '0,4': 3, '0,2': 2, '2,0': 0, '6,4': 2, '2,1': 1 },
  },
  {
    // Lösung: Spiegel (5,4) rot 3 · Spiegel (2,4) rot 3 · Spiegel (2,1) rot 1 · Spiegel (5,1) rot 3 ·
    //   Prisma (5,5) rot 5 · Spiegel (4,5) rot 3 · Spiegel (6,1) rot 3 · Spiegel (4,6) rot 3 ·
    //   Spiegel (1,6) rot 1
    // Generator schwer-abzaehlen, Seed 10373 · Ausbau „schwer“
    name: 'Pilgerweg', titel: 'Felsbogen', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 5, z: 0, color: 'cyan' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
      { type: 'target', x: 1, z: 1, color: 'magenta' },
      { type: 'prism', x: 5, z: 5, rot: 4 },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 1 },
      { type: 'source', x: 6, z: 0, dir: 2 },
      { type: 'target', x: 2, z: 5, color: 'white' },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 3 },
      { type: 'blocker', x: 3, z: 3 },
    ],
    solution: { '5,4': 3, '2,4': 3, '2,1': 1, '5,1': 3, '5,5': 5, '4,5': 3, '6,1': 3, '4,6': 3, '1,6': 1 },
  },
  {
    // Lösung: Prisma (5,0) rot 2 · Spiegel (2,0) rot 3 · Spiegel (0,5) rot 2 · Prisma (6,4) rot 1 ·
    //   Prisma (3,4) rot 7 · Prisma (1,2) rot 1 · Spiegel (1,3) rot 3
    // Generator schwer-sammelstelle, Seed 10010 · Ausbau „schwer“
    name: 'Kompassnadel', titel: 'Hitzeflimmern', grad: 'schwer',
    elements: [
      { type: 'prism', x: 5, z: 0, rot: 0 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'source', x: 6, z: 0, dir: 4, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'green' },
      { type: 'target', x: 6, z: 1, color: 'yellow' },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'prism', x: 6, z: 4, rot: 6 },
      { type: 'target', x: 6, z: 5, color: 'blue' },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'cyan' },
      { type: 'prism', x: 3, z: 4, rot: 0 },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'prism', x: 1, z: 2, rot: 6 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 1, z: 6, color: 'blue' },
      { type: 'target', x: 0, z: 4, color: 'blue' },
    ],
    solution: { '5,0': 2, '2,0': 3, '0,5': 2, '6,4': 1, '3,4': 7, '1,2': 1, '1,3': 3 },
  },
  {
    // Lösung: Spiegel (4,5) rot 0 · Prisma (3,4) rot 6 · Spiegel (1,4) rot 3 · Prisma (2,4) rot 6 ·
    //   Spiegel (4,2) rot 2 · Spiegel (2,3) rot 2 · Spiegel (4,1) rot 0
    // Wertung 31.4 · 7 drehbar · 3 Ziele · Rateschritte 399 · Profil mittel2/4-bunt, Seed 3064184
    name: 'Oase', titel: 'Hexenring', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 3 },
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 3, z: 6, rot: 2, fixed: true },
      { type: 'prism', x: 2, z: 4, rot: 0 },
      { type: 'prism', x: 3, z: 4, rot: 0 },
      { type: 'target', x: 3, z: 1, color: 'cyan' },
      { type: 'target', x: 5, z: 2, color: 'magenta' },
      { type: 'target', x: 1, z: 3, color: 'red' },
    ],
    solution: { '4,5': 0, '3,4': 6, '1,4': 3, '2,4': 6, '4,2': 2, '2,3': 2, '4,1': 0 },
  },
  {
    // Lösung: Spiegel (4,4) rot 1 · Spiegel (1,2) rot 1 · Spiegel (6,2) rot 1 · Spiegel (0,4) rot 3 ·
    //   Prisma (4,3) rot 1 · Spiegel (6,5) rot 2 · Prisma (0,6) rot 0 · Spiegel (5,1) rot 2
    // Generator schwer-abschalten, Seed 8, Ziel 59,45–60,41 · ersetzt Sternwarte (Austausch „schwer“)
    name: 'Stabübergabe', titel: 'Holzsteg', grad: 'schwer',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'target', x: 6, z: 4, color: 'magenta' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'magenta' },
      { type: 'mirror', x: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'prism', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'target', x: 5, z: 3, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'green' },
      { type: 'prism', x: 0, z: 6, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 3, z: 1, rot: 0, fixed: true },
      { type: 'target', x: 2, z: 0, color: 'red' },
    ],
    solution: { '4,4': 1, '1,2': 1, '6,2': 1, '0,4': 3, '4,3': 1, '6,5': 2, '0,6': 0, '5,1': 2 },
  },
  {
    // Lösung: Spiegel (1,1) rot 3 · Spiegel (3,4) rot 2 · Prisma (2,1) rot 7 · Spiegel (4,1) rot 1 ·
    //   Prisma (4,3) rot 6 · Spiegel (4,2) rot 3 · Kombinator (5,2) dir 2
    // Wertung 34.8 · 7 drehbar · 3 Ziele · Rateschritte 762 · Profil 4-bunt, Seed 781
    name: 'Gordischer Knoten', titel: 'Wattenmeer', grad: 'schwer',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'source', x: 5, z: 6, dir: 5 },
      { type: 'mirror', x: 2, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'prism', x: 2, z: 1, rot: 3 },
      { type: 'prism', x: 4, z: 3, rot: 2 },
      { type: 'combiner', x: 5, z: 2, dir: 5 },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'target', x: 5, z: 3, color: 'cyan' },
    ],
    solution: { '1,1': 3, '3,4': 2, '2,1': 7, '4,1': 1, '4,3': 6, '4,2': 3, '5,2': 2 },
  },
  {
    // Lösung: Spiegel (3,2) rot 1 · Spiegel (3,6) rot 1 · Spiegel (1,6) rot 3 · Spiegel (1,2) rot 1 ·
    //   Prisma (4,4) rot 1 · Spiegel (5,5) rot 0 · Spiegel (6,4) rot 2 · Prisma (4,2) rot 5 ·
    //   Spiegel (4,1) rot 3 · Spiegel (5,1) rot 3
    // Generator schwer-abzaehlen, Seed 20367, Ziel 72–86 · Ausbau „schwer“
    name: 'Seekarte', titel: 'Sandmeer', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'red' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'target', x: 4, z: 6, color: 'white' },
      { type: 'target', x: 0, z: 2, color: 'red' },
      { type: 'target', x: 3, z: 0, color: 'red' },
      { type: 'source', x: 0, z: 0, dir: 1, color: 'cyan' },
      { type: 'prism', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'prism', x: 4, z: 2, rot: 6 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 0, color: 'green' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
    ],
    solution: { '3,2': 1, '3,6': 1, '1,6': 3, '1,2': 1, '4,4': 1, '5,5': 0, '6,4': 2, '4,2': 5, '4,1': 3, '5,1': 3 },
  },
  {
    // Lösung: Spiegel (3,3) rot 1 · Spiegel (4,3) rot 1 · Spiegel (6,1) rot 1 · Spiegel (6,4) rot 3 ·
    //   Spiegel (1,5) rot 1 · Prisma (2,5) rot 1 · Prisma (4,0) rot 1 · Spiegel (5,3) rot 3 ·
    //   Spiegel (5,0) rot 3
    // Generator schwer-mischziel, Seed 20440, Ziel 72–86 · Ausbau „schwer“
    name: 'Springergabel', titel: 'Salzpfanne', grad: 'schwer',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'target', x: 4, z: 4, color: 'white' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'prism', x: 2, z: 5, rot: 5 },
      { type: 'mirror', x: 3, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 4, z: 5, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'target', x: 2, z: 3, color: 'red' },
      { type: 'source', x: 0, z: 4, dir: 7 },
      { type: 'prism', x: 4, z: 0, rot: 4 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'blue' },
    ],
    solution: { '3,3': 1, '4,3': 1, '6,1': 1, '6,4': 3, '1,5': 1, '2,5': 1, '4,0': 1, '5,3': 3, '5,0': 3 },
  },
  {
    // Lösung: Spiegel (3,0) rot 3 · Spiegel (5,4) rot 1 · Spiegel (0,5) rot 1 · Spiegel (6,3) rot 3 ·
    //   Prisma (6,1) rot 6 · Prisma (0,4) rot 7 · Spiegel (5,6) rot 3 · Spiegel (2,2) rot 2 ·
    //   Spiegel (1,1) rot 2 · Spiegel (4,6) rot 1
    // Generator schwer-mischziel, Seed 20548, Ziel 72–86 · Ausbau „schwer“
    name: 'Planetarium', titel: 'Magmakammer', grad: 'schwer',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'target', x: 5, z: 0, color: 'white' },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'prism', x: 6, z: 1, rot: 4 },
      { type: 'prism', x: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'target', x: 2, z: 0, color: 'green' },
      { type: 'target', x: 4, z: 1, color: 'blue' },
      { type: 'target', x: 6, z: 0, color: 'green' },
    ],
    solution: { '3,0': 3, '5,4': 1, '0,5': 1, '6,3': 3, '6,1': 6, '0,4': 7, '5,6': 3, '2,2': 2, '1,1': 2, '4,6': 1 },
  },
  {
    // Lösung: Spiegel (3,4) rot 3 · Prisma (0,4) rot 5 · Spiegel (0,1) rot 3 · Spiegel (1,0) rot 3 ·
    //   Spiegel (6,0) rot 1 · Spiegel (6,2) rot 3 · Spiegel (5,2) rot 3 · Spiegel (4,1) rot 1 ·
    //   Spiegel (1,4) rot 1 · Spiegel (5,3) rot 1 · Spiegel (5,6) rot 1
    // Generator schwer-mischziel, Seed 20905, Ziel 72–86 · Ausbau „schwer“
    name: 'Leuchtfeuer', titel: 'Lavabombe', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'target', x: 3, z: 5, color: 'white' },
      { type: 'source', x: 2, z: 6, dir: 5, color: 'magenta' },
      { type: 'prism', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'target', x: 6, z: 3, color: 'blue' },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'target', x: 6, z: 6, color: 'blue' },
    ],
    solution: { '3,4': 3, '0,4': 5, '0,1': 3, '1,0': 3, '6,0': 1, '6,2': 3, '5,2': 3, '4,1': 1, '1,4': 1, '5,3': 1, '5,6': 1 },
  },
  {
    // Lösung: Prisma (2,4) rot 6 · Prisma (4,1) rot 4 · Spiegel (1,1) rot 1 · Spiegel (1,0) rot 1 ·
    //   Spiegel (0,0) rot 3 · Spiegel (3,2) rot 2 · Spiegel (5,4) rot 0 · Prisma (4,0) rot 5
    // Generator schwer-sammelstelle, Seed 20667, Ziel 72–86 · Ausbau „schwer“
    name: 'Rätselturm', titel: 'Schlot', grad: 'schwer',
    elements: [
      { type: 'prism', x: 2, z: 4, rot: 5 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 4, z: 6, dir: 5, color: 'green' },
      { type: 'target', x: 0, z: 2, color: 'yellow' },
      { type: 'target', x: 2, z: 0, color: 'yellow' },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'prism', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'source', x: 0, z: 4, dir: 7, color: 'magenta' },
      { type: 'prism', x: 4, z: 0, rot: 0 },
    ],
    solution: { '2,4': 6, '4,1': 4, '1,1': 1, '1,0': 1, '0,0': 3, '3,2': 2, '5,4': 0, '4,0': 5 },
  },
  {
    // Lösung: Prisma (4,3) rot 0 · Prisma (3,1) rot 2 · Spiegel (3,5) rot 3 · Spiegel (1,3) rot 0 ·
    //   Spiegel (3,6) rot 3 · Prisma (2,6) rot 5 · Spiegel (2,5) rot 1 · Spiegel (2,4) rot 3
    // Generator schwer-sammelstelle, Seed 10089 · Ausbau „schwer“
    name: 'Zauberwürfel', titel: 'Lavatunnel', grad: 'schwer',
    elements: [
      { type: 'prism', x: 4, z: 3, rot: 3 },
      { type: 'source', x: 1, z: 0, dir: 1, color: 'green' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'red' },
      { type: 'target', x: 5, z: 3, color: 'yellow' },
      { type: 'target', x: 6, z: 1, color: 'yellow' },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'prism', x: 3, z: 1, rot: 6 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'prism', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 6, color: 'red' },
      { type: 'target', x: 0, z: 2, color: 'blue' },
    ],
    solution: { '4,3': 0, '3,1': 2, '3,5': 3, '1,3': 0, '3,6': 3, '2,6': 5, '2,5': 1, '2,4': 3 },
  },
  {
    // Lösung: Spiegel (2,0) rot 1 · Spiegel (1,4) rot 3 · Spiegel (3,4) rot 2 · Spiegel (2,5) rot 2 ·
    //   Prisma (4,2) rot 2 · Spiegel (4,5) rot 0 · Prisma (5,2) rot 3 · Prisma (5,6) rot 3
    // Generator schwer-mischziel, Seed 79, Ziel 66,03–70,98 · ersetzt Kristallpalast (Austausch „schwer“)
    name: 'Mäander', titel: 'Tempelruine', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0, color: 'red' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'target', x: 2, z: 4, color: 'white' },
      { type: 'source', x: 0, z: 1, dir: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 5, z: 4, color: 'yellow' },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'prism', x: 4, z: 2, rot: 7 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'prism', x: 5, z: 2, rot: 2 },
      { type: 'prism', x: 5, z: 6, rot: 6 },
      { type: 'target', x: 4, z: 6, color: 'blue' },
    ],
    solution: { '2,0': 1, '1,4': 3, '3,4': 2, '2,5': 2, '4,2': 2, '4,5': 0, '5,2': 3, '5,6': 3 },
  },
  {
    // Lösung: Spiegel (0,5) rot 3 · Spiegel (2,5) rot 1 · Spiegel (2,2) rot 1 · Spiegel (0,2) rot 1 ·
    //   Prisma (3,4) rot 7 · Spiegel (3,0) rot 3 · Spiegel (6,0) rot 1 · Spiegel (6,3) rot 3 ·
    //   Spiegel (1,3) rot 3 · Spiegel (4,4) rot 3 · Spiegel (4,1) rot 1
    // Generator schwer-abzaehlen, Seed 20656, Ziel 72–86 · Ausbau „schwer“
    name: 'Basislager', titel: 'Basaltsäule', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'target', x: 5, z: 2, color: 'cyan' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'target', x: 0, z: 0, color: 'white' },
      { type: 'source', x: 5, z: 6, dir: 5 },
      { type: 'prism', x: 3, z: 4, rot: 4 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'target', x: 1, z: 6, color: 'red' },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'target', x: 1, z: 1, color: 'blue' },
    ],
    solution: { '0,5': 3, '2,5': 1, '2,2': 1, '0,2': 1, '3,4': 7, '3,0': 3, '6,0': 1, '6,3': 3, '1,3': 3, '4,4': 3, '4,1': 1 },
  },
  {
    // Lösung: Spiegel (4,2) rot 3 · Spiegel (1,2) rot 1 · Spiegel (1,4) rot 3 · Spiegel (4,4) rot 3 ·
    //   Prisma (3,3) rot 5 · Spiegel (3,1) rot 1 · Prisma (5,4) rot 5 · Spiegel (5,1) rot 3 ·
    //   Spiegel (6,1) rot 1 · Spiegel (6,2) rot 3
    // Generator schwer-abzaehlen, Seed 10157 · Ausbau „schwer“
    name: 'Sphinx', titel: 'Feuerberg', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'red' },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'target', x: 0, z: 4, color: 'white' },
      { type: 'target', x: 1, z: 1, color: 'magenta' },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'magenta' },
      { type: 'prism', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'prism', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'target', x: 1, z: 6, color: 'blue' },
    ],
    solution: { '4,2': 3, '1,2': 1, '1,4': 3, '4,4': 3, '3,3': 5, '3,1': 1, '5,4': 5, '5,1': 3, '6,1': 1, '6,2': 3 },
  },
  {
    // Lösung: Prisma (1,1) rot 2 · Spiegel (4,1) rot 1 · Spiegel (1,0) rot 1 · Spiegel (2,4) rot 0 ·
    //   Spiegel (2,3) rot 2 · Spiegel (1,4) rot 0 · Prisma (0,3) rot 7 · Prisma (3,5) rot 7 ·
    //   Spiegel (5,3) rot 0
    // Generator schwer-sammelstelle, Seed 20876, Ziel 72–86 · Ausbau „schwer“
    name: 'Spieluhr', titel: 'Schwefeldampf', grad: 'schwer',
    elements: [
      { type: 'prism', x: 1, z: 1, rot: 7 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'blue' },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'target', x: 5, z: 5, color: 'magenta' },
      { type: 'target', x: 0, z: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 6, dir: 7 },
      { type: 'source', x: 0, z: 1, dir: 1 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'prism', x: 0, z: 3, rot: 0 },
      { type: 'prism', x: 3, z: 5, rot: 5 },
      { type: 'target', x: 3, z: 2, color: 'red' },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'target', x: 6, z: 4, color: 'green' },
    ],
    solution: { '1,1': 2, '4,1': 1, '1,0': 1, '2,4': 0, '2,3': 2, '1,4': 0, '0,3': 7, '3,5': 7, '5,3': 0 },
  },
  {
    // Lösung: Spiegel (2,1) rot 1 · Spiegel (1,4) rot 1 · Prisma (4,3) rot 5 · Spiegel (0,5) rot 1 ·
    //   Spiegel (5,5) rot 1 · Spiegel (5,6) rot 3 · Spiegel (4,2) rot 3 · Spiegel (4,0) rot 1 ·
    //   Spiegel (3,0) rot 3 · Spiegel (6,2) rot 3 · Spiegel (6,1) rot 1
    // Generator schwer-mischziel, Seed 20904, Ziel 72–86 · Ausbau „schwer“
    name: 'Automaton', titel: 'Erdbeben', grad: 'schwer',
    elements: [
      { type: 'source', x: 2, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'target', x: 1, z: 1, color: 'white' },
      { type: 'source', x: 1, z: 6, dir: 7, color: 'magenta' },
      { type: 'prism', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 0, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'target', x: 0, z: 2, color: 'red' },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'target', x: 2, z: 0, color: 'blue' },
    ],
    solution: { '2,1': 1, '1,4': 1, '4,3': 5, '0,5': 1, '5,5': 1, '5,6': 3, '4,2': 3, '4,0': 1, '3,0': 3, '6,2': 3, '6,1': 1 },
  },
  {
    // Lösung: Spiegel (3,5) rot 1 · Spiegel (1,4) rot 1 · Spiegel (4,1) rot 3 · Spiegel (2,2) rot 1 ·
    //   Prisma (1,2) rot 4 · Spiegel (0,2) rot 3 · Spiegel (0,3) rot 1 · Spiegel (5,3) rot 1 ·
    //   Spiegel (5,5) rot 1 · Spiegel (4,0) rot 1 · Spiegel (3,0) rot 3
    // Generator schwer-mischziel, Seed 20986, Ziel 72–86 · Ausbau „schwer“
    name: 'Puzzlestück', titel: 'Enceladus', grad: 'schwer',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'target', x: 1, z: 5, color: 'white' },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'red' },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'prism', x: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 2, color: 'green' },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 5, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'blocker', x: 4, z: 4 },
    ],
    solution: { '3,5': 1, '1,4': 1, '4,1': 3, '2,2': 1, '1,2': 4, '0,2': 3, '0,3': 1, '5,3': 1, '5,5': 1, '4,0': 1, '3,0': 3 },
  },
  {
    // Lösung: Prisma (2,4) rot 2 · Spiegel (4,2) rot 0 · Spiegel (1,4) rot 1 · Prisma (5,2) rot 2 ·
    //   Spiegel (5,6) rot 1 · Spiegel (1,5) rot 0 · Prisma (3,6) rot 0 · Spiegel (6,6) rot 3 ·
    //   Spiegel (6,3) rot 2
    // Generator schwer-sammelstelle, Seed 20294, Ziel 75–86 · Ausbau „schwer“
    name: 'Kopfnuss', titel: 'Rhea', grad: 'schwer',
    elements: [
      { type: 'prism', x: 2, z: 4, rot: 6 },
      { type: 'source', x: 6, z: 4, dir: 5, color: 'cyan' },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 5, color: 'cyan' },
      { type: 'target', x: 4, z: 6, color: 'yellow' },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'prism', x: 5, z: 2, rot: 7 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'target', x: 0, z: 4, color: 'blue' },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'prism', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'filter', x: 3, z: 1, color: 'cyan' },
      { type: 'target', x: 4, z: 5, color: 'red' },
      { type: 'target', x: 6, z: 5, color: 'green' },
    ],
    solution: { '2,4': 2, '4,2': 0, '1,4': 1, '5,2': 2, '5,6': 1, '1,5': 0, '3,6': 0, '6,6': 3, '6,3': 2 },
  },
  {
    // Lösung: Prisma (4,3) rot 3 · Spiegel (4,5) rot 1 · Spiegel (3,3) rot 3 · Spiegel (3,4) rot 3 ·
    //   Prisma (4,2) rot 5 · Prisma (3,1) rot 6 · Spiegel (4,0) rot 0 · Spiegel (1,6) rot 1 ·
    //   Spiegel (2,6) rot 3
    // Generator schwer-falle, Seed 20316, Ziel 72–86 · Ausbau „schwer“
    name: 'Taschenuhr', titel: 'Titania', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4, color: 'magenta' },
      { type: 'prism', x: 4, z: 3, rot: 1 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'source', x: 0, z: 4, dir: 7, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 5 },
      { type: 'prism', x: 4, z: 2, rot: 1 },
      { type: 'prism', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'target', x: 2, z: 4, color: 'magenta' },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'target', x: 3, z: 0, color: 'green' },
    ],
    solution: { '4,3': 3, '4,5': 1, '3,3': 3, '3,4': 3, '4,2': 5, '3,1': 6, '4,0': 0, '1,6': 1, '2,6': 3 },
  },
  {
    // Lösung: Spiegel (0,1) rot 1 · Spiegel (2,1) rot 1 · Spiegel (2,3) rot 1 · Spiegel (0,3) rot 3 ·
    //   Spiegel (5,4) rot 1 · Spiegel (6,4) rot 1 · Spiegel (6,5) rot 3 · Prisma (4,1) rot 5 ·
    //   Prisma (2,4) rot 7 · Spiegel (5,6) rot 3
    // Generator schwer-abzaehlen, Seed 20281, Ziel 75–86 · Ausbau „schwer“
    name: 'Sanduhr', titel: 'Dione', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'yellow' },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 0, z: 5, color: 'magenta' },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'yellow' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'prism', x: 4, z: 1, rot: 2 },
      { type: 'prism', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'mirror', x: 3, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 3, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'green' },
    ],
    solution: { '0,1': 1, '2,1': 1, '2,3': 1, '0,3': 3, '5,4': 1, '6,4': 1, '6,5': 3, '4,1': 5, '2,4': 7, '5,6': 3 },
  },
  {
    // Lösung: Spiegel (4,4) rot 1 · Spiegel (3,3) rot 3 · Spiegel (1,4) rot 1 · Spiegel (3,0) rot 3 ·
    //   Spiegel (3,6) rot 1 · Spiegel (5,6) rot 3 · Prisma (4,0) rot 2 · Spiegel (0,4) rot 2 ·
    //   Spiegel (6,1) rot 1 · Spiegel (6,3) rot 3
    // Generator schwer-mischziel, Seed 20081, Ziel 75–86 · Ausbau „schwer“
    name: 'Räderwerk', titel: 'Oberon', grad: 'schwer',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'blue' },
      { type: 'mirror', x: 5, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'target', x: 4, z: 1, color: 'white' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'cyan' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'filter', x: 3, z: 5, color: 'red' },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'prism', x: 4, z: 0, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'target', x: 4, z: 5, color: 'red' },
    ],
    solution: { '4,4': 1, '3,3': 3, '1,4': 1, '3,0': 3, '3,6': 1, '5,6': 3, '4,0': 2, '0,4': 2, '6,1': 1, '6,3': 3 },
  },
  {
    // Lösung: Prisma (4,3) rot 4 · Spiegel (6,1) rot 2 · Spiegel (2,5) rot 0 · Spiegel (0,3) rot 2 ·
    //   Spiegel (4,4) rot 0 · Spiegel (5,5) rot 2 · Spiegel (4,6) rot 0 · Prisma (5,1) rot 1 ·
    //   Spiegel (5,4) rot 1
    // Generator schwer-sammelstelle, Seed 20504, Ziel 72–86 · Ausbau „schwer“
    name: 'Denksport', titel: 'Kuipergürtel', grad: 'schwer',
    elements: [
      { type: 'prism', x: 4, z: 3, rot: 6 },
      { type: 'source', x: 5, z: 0, dir: 1, color: 'blue' },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 2, z: 1, color: 'magenta' },
      { type: 'target', x: 1, z: 3, color: 'cyan' },
      { type: 'mirror', x: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'source', x: 2, z: 6, dir: 7, color: 'blue' },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'source', x: 6, z: 0, dir: 3 },
      { type: 'prism', x: 5, z: 1, rot: 4 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 6, z: 2, rot: 2, fixed: true },
      { type: 'mirror', x: 2, z: 2, rot: 2, fixed: true },
      { type: 'target', x: 3, z: 1, color: 'green' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
    ],
    solution: { '4,3': 4, '6,1': 2, '2,5': 0, '0,3': 2, '4,4': 0, '5,5': 2, '4,6': 0, '5,1': 1, '5,4': 1 },
  },
  {
    // Lösung: Prisma (2,1) rot 1 · Prisma (5,1) rot 4 · Prisma (2,4) rot 7 · Spiegel (4,2) rot 0 ·
    //   Spiegel (5,3) rot 2 · Spiegel (3,5) rot 2 · Spiegel (2,2) rot 1 · Spiegel (1,2) rot 3
    // Generator schwer-sammelstelle, Seed 10237 · Ausbau „schwer“
    name: 'Ariadnefaden', titel: 'Tethys', grad: 'schwer',
    elements: [
      { type: 'prism', x: 2, z: 1, rot: 4 },
      { type: 'source', x: 1, z: 0, dir: 1, color: 'green' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'red' },
      { type: 'target', x: 5, z: 4, color: 'cyan' },
      { type: 'target', x: 4, z: 1, color: 'yellow' },
      { type: 'source', x: 6, z: 2, dir: 5 },
      { type: 'prism', x: 5, z: 1, rot: 1 },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'source', x: 0, z: 2, dir: 1 },
      { type: 'prism', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'target', x: 4, z: 6, color: 'yellow' },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 1, fixed: true },
    ],
    solution: { '2,1': 1, '5,1': 4, '2,4': 7, '4,2': 0, '5,3': 2, '3,5': 2, '2,2': 1, '1,2': 3 },
  },
  {
    // Lösung: Prisma (0,4) rot 1 · Spiegel (2,4) rot 3 · Spiegel (0,5) rot 1 · Prisma (4,3) rot 2 ·
    //   Spiegel (6,5) rot 1 · Spiegel (1,1) rot 3 · Spiegel (5,4) rot 0 · Spiegel (6,1) rot 3 ·
    //   Spiegel (4,4) rot 3 · Spiegel (2,6) rot 1 · Spiegel (6,0) rot 1
    // Generator schwer-falle, Seed 20844, Ziel 72–86 · Ausbau „schwer“
    name: 'Schatztruhe', titel: 'Mimas', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 0, z: 4, rot: 4 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 2, color: 'red' },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 1, fixed: true },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 1, z: 0, dir: 1, color: 'yellow' },
      { type: 'prism', x: 4, z: 3, rot: 7 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 3, rot: 2, fixed: true },
      { type: 'target', x: 3, z: 0, color: 'magenta' },
      { type: 'target', x: 1, z: 6, color: 'blue' },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'target', x: 5, z: 6, color: 'green' },
      { type: 'mirror', x: 6, z: 0, rot: 3 },
    ],
    solution: { '0,4': 1, '2,4': 3, '0,5': 1, '4,3': 2, '6,5': 1, '1,1': 3, '5,4': 0, '6,1': 3, '4,4': 3, '2,6': 1, '6,0': 1 },
  },
  {
    // Lösung: Spiegel (1,4) rot 1 · Spiegel (0,4) rot 3 · Spiegel (4,1) rot 3 · Spiegel (5,1) rot 1 ·
    //   Spiegel (5,3) rot 1 · Prisma (4,0) rot 5 · Prisma (6,3) rot 2 · Spiegel (2,0) rot 3 ·
    //   Spiegel (6,4) rot 3 · Spiegel (1,3) rot 3 · Spiegel (5,6) rot 1
    // Generator schwer-mischziel, Seed 20840, Ziel 72–86 · Ausbau „schwer“
    name: 'Lotsenboot', titel: 'Halbschatten', grad: 'schwer',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'target', x: 0, z: 5, color: 'white' },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'prism', x: 4, z: 0, rot: 3 },
      { type: 'prism', x: 6, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'target', x: 3, z: 6, color: 'blue' },
      { type: 'target', x: 2, z: 6, color: 'red' },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'target', x: 6, z: 6, color: 'green' },
    ],
    solution: { '1,4': 1, '0,4': 3, '4,1': 3, '5,1': 1, '5,3': 1, '4,0': 5, '6,3': 2, '2,0': 3, '6,4': 3, '1,3': 3, '5,6': 1 },
  },
  {
    // Lösung: Spiegel (5,6) rot 1 · Spiegel (3,3) rot 3 · Spiegel (5,5) rot 1 · Prisma (2,3) rot 5 ·
    //   Spiegel (2,1) rot 1 · Spiegel (1,3) rot 1 · Spiegel (1,2) rot 3 · Prisma (3,1) rot 3 ·
    //   Prisma (4,5) rot 4 · Spiegel (3,5) rot 3
    // Wertung 44.3 · 10 drehbar · 4 Ziele · Rateschritte 8031 · gehärtet aus Profil 4-prisma, Seed 3007
    name: 'Fata Morgana', titel: 'Karawanserei', grad: 'schwer',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'prism', x: 3, z: 1, rot: 7 },
      { type: 'prism', x: 2, z: 3, rot: 7 },
      { type: 'prism', x: 4, z: 5, rot: 6 },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'target', x: 1, z: 1, color: 'blue' },
      { type: 'target', x: 5, z: 2, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'yellow' },
    ],
    solution: { '5,6': 1, '3,3': 3, '5,5': 1, '2,3': 5, '2,1': 1, '1,3': 1, '1,2': 3, '3,1': 3, '4,5': 4, '3,5': 3 },
  },
  {
    // Lösung: Spiegel (3,3) rot 3 · Spiegel (3,1) rot 1 · Spiegel (1,1) rot 1 · Spiegel (1,3) rot 3 ·
    //   Prisma (6,5) rot 2 · Prisma (5,3) rot 5 · Spiegel (1,0) rot 1 · Spiegel (1,5) rot 1 ·
    //   Spiegel (5,2) rot 1 · Spiegel (6,6) rot 3
    // Generator schwer-abzaehlen, Seed 20107, Ziel 75–86 · Ausbau „schwer“
    name: 'Zugbrücke', titel: 'Adlernebel', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'yellow' },
      { type: 'target', x: 0, z: 3, color: 'white' },
      { type: 'target', x: 6, z: 1, color: 'red' },
      { type: 'prism', x: 6, z: 5, rot: 1 },
      { type: 'prism', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'source', x: 0, z: 0, dir: 0 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'target', x: 2, z: 2, color: 'blue' },
      { type: 'mirror', x: 6, z: 6, rot: 2 },
    ],
    solution: { '3,3': 3, '3,1': 1, '1,1': 1, '1,3': 3, '6,5': 2, '5,3': 5, '1,0': 1, '1,5': 1, '5,2': 1, '6,6': 3 },
  },
  {
    // Lösung: Prisma (4,0) rot 1 · Spiegel (4,2) rot 3 · Spiegel (5,0) rot 1 · Spiegel (5,1) rot 1 ·
    //   Spiegel (1,3) rot 1 · Prisma (1,4) rot 1 · Spiegel (6,4) rot 3 · Spiegel (6,2) rot 1 ·
    //   Spiegel (5,5) rot 3 · Spiegel (6,1) rot 3
    // Generator schwer-falle, Seed 559, Ziel 70,98–75,57 · ersetzt Irrlicht (Austausch „schwer“)
    name: 'Abkürzung', titel: 'Luftspiegelung', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0, color: 'magenta' },
      { type: 'prism', x: 4, z: 0, rot: 5 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'target', x: 2, z: 2, color: 'blue' },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'prism', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 3 },
      { type: 'target', x: 1, z: 6, color: 'blue' },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'target', x: 1, z: 1, color: 'white' },
    ],
    solution: { '4,0': 1, '4,2': 3, '5,0': 1, '5,1': 1, '1,3': 1, '1,4': 1, '6,4': 3, '6,2': 1, '5,5': 3, '6,1': 3 },
  },
  {
    // Lösung: Spiegel (4,2) rot 3 · Spiegel (4,1) rot 1 · Spiegel (2,6) rot 3 · Spiegel (2,2) rot 1 ·
    //   Spiegel (1,2) rot 3 · Spiegel (1,1) rot 3 · Prisma (2,1) rot 0 · Prisma (1,4) rot 3 ·
    //   Kombinator (3,2) dir 1 · Prisma (1,6) rot 0
    // Wertung 47.8 · 10 drehbar · 4 Ziele · Rateschritte 16396 · gehärtet aus Profil 4-farbe, Seed 3057
    name: 'Rosette', titel: 'Rotglut', grad: 'schwer',
    elements: [
      { type: 'source', x: 4, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 0, z: 6, dir: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'prism', x: 2, z: 1, rot: 7 },
      { type: 'prism', x: 1, z: 4, rot: 7 },
      { type: 'prism', x: 1, z: 6, rot: 4 },
      { type: 'filter', x: 2, z: 5, color: 'yellow' },
      { type: 'combiner', x: 3, z: 2, dir: 6 },
      { type: 'target', x: 3, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'target', x: 4, z: 3, color: 'white' },
      { type: 'target', x: 0, z: 5, color: 'green' },
    ],
    solution: { '4,2': 3, '4,1': 1, '2,6': 3, '2,2': 1, '1,2': 3, '1,1': 3, '2,1': 0, '1,4': 3, '3,2': 1, '1,6': 0 },
  },
  {
    // Lösung: Spiegel (1,1) rot 3 · Prisma (5,4) rot 5 · Spiegel (2,4) rot 3 · Spiegel (2,5) rot 1 ·
    //   Spiegel (5,1) rot 3 · Spiegel (6,1) rot 3 · Spiegel (6,0) rot 1 · Prisma (1,0) rot 1 ·
    //   Spiegel (3,5) rot 1 · Spiegel (3,6) rot 3
    // Generator schwer-mischziel, Seed 20113, Ziel 75–86 · Ausbau „schwer“
    name: 'Jakobsweg', titel: 'Ringnebel', grad: 'schwer',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'cyan' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'target', x: 4, z: 1, color: 'white' },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'prism', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 1 },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 0, fixed: true },
      { type: 'target', x: 0, z: 5, color: 'green' },
      { type: 'target', x: 4, z: 0, color: 'magenta' },
      { type: 'source', x: 0, z: 1, dir: 7 },
      { type: 'prism', x: 1, z: 0, rot: 5 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'target', x: 2, z: 6, color: 'red' },
    ],
    solution: { '1,1': 3, '5,4': 5, '2,4': 3, '2,5': 1, '5,1': 3, '6,1': 3, '6,0': 1, '1,0': 1, '3,5': 1, '3,6': 3 },
  },
  {
    // Lösung: Prisma (5,4) rot 0 · Spiegel (2,1) rot 3 · Prisma (4,2) rot 2 · Spiegel (4,3) rot 1 ·
    //   Spiegel (6,3) rot 3 · Spiegel (2,6) rot 0 · Spiegel (0,3) rot 1 · Spiegel (4,6) rot 1 ·
    //   Prisma (6,6) rot 6
    // Generator schwer-sammelstelle, Seed 20095, Ziel 75–86 · Ausbau „schwer“
    name: 'Gebirgspfad', titel: 'Lagunennebel', grad: 'schwer',
    elements: [
      { type: 'prism', x: 5, z: 4, rot: 4 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'source', x: 3, z: 6, dir: 7, color: 'green' },
      { type: 'target', x: 6, z: 5, color: 'cyan' },
      { type: 'target', x: 6, z: 4, color: 'yellow' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 0, dir: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'prism', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 5, rot: 2, fixed: true },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'target', x: 6, z: 2, color: 'cyan' },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'prism', x: 6, z: 6, rot: 4 },
      { type: 'target', x: 0, z: 0, color: 'red' },
    ],
    solution: { '5,4': 0, '2,1': 3, '4,2': 2, '4,3': 1, '6,3': 3, '2,6': 0, '0,3': 1, '4,6': 1, '6,6': 6 },
  },
  {
    // Lösung: Prisma (4,5) rot 3 · Spiegel (4,3) rot 3 · Prisma (5,2) rot 6 · Spiegel (3,0) rot 0 ·
    //   Prisma (5,1) rot 5 · Spiegel (3,1) rot 3 · Spiegel (4,6) rot 1 · Spiegel (5,0) rot 1 ·
    //   Kombinator (4,0) dir 2
    // Generator schwer-sammelstelle, Seed 20172, Ziel 75–86 · Ausbau „schwer“
    name: 'Kalenderstein', titel: 'Eulennebel', grad: 'schwer',
    elements: [
      { type: 'prism', x: 4, z: 5, rot: 5 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'green' },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'target', x: 3, z: 6, color: 'yellow' },
      { type: 'target', x: 2, z: 5, color: 'blue' },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'prism', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 0, rot: 0, fixed: true },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'source', x: 0, z: 6, dir: 7 },
      { type: 'prism', x: 5, z: 1, rot: 4 },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 4, z: 6, rot: 0 },
      { type: 'target', x: 6, z: 6, color: 'red' },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'combiner', x: 4, z: 0, dir: 0 },
      { type: 'target', x: 0, z: 3, color: 'cyan' },
    ],
    solution: { '4,5': 3, '4,3': 3, '5,2': 6, '3,0': 0, '5,1': 5, '3,1': 3, '4,6': 1, '5,0': 1, '4,0': 2 },
  },
  {
    // Lösung: Spiegel (4,6) rot 1 · Spiegel (1,5) rot 3 · Spiegel (1,2) rot 3 · Prisma (4,3) rot 6 ·
    //   Spiegel (4,2) rot 3 · Spiegel (1,4) rot 1 · Spiegel (5,2) rot 3 · Prisma (4,5) rot 6 ·
    //   Prisma (5,4) rot 4 · Kombinator (3,4) dir 4 · Spiegel (3,2) rot 3
    // Wertung 52.4 · 11 drehbar · 3 Ziele · Rateschritte 65481 · gehärtet aus Profil 4-filter, Seed 6008
    name: 'Spiegelsaal', titel: 'Orionnebel', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 2, z: 1, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'prism', x: 4, z: 3, rot: 1 },
      { type: 'prism', x: 5, z: 4, rot: 6 },
      { type: 'prism', x: 4, z: 5, rot: 2 },
      { type: 'filter', x: 4, z: 4, color: 'green' },
      { type: 'combiner', x: 3, z: 4, dir: 7 },
      { type: 'target', x: 5, z: 0, color: 'green' },
      { type: 'target', x: 3, z: 1, color: 'yellow' },
      { type: 'target', x: 0, z: 4, color: 'white' },
    ],
    solution: { '4,6': 1, '1,5': 3, '1,2': 3, '4,3': 6, '4,2': 3, '1,4': 1, '5,2': 3, '4,5': 6, '5,4': 4, '3,4': 4, '3,2': 3 },
  },
  {
    // Lösung: Spiegel (5,4) rot 1 · Spiegel (1,3) rot 1 · Prisma (1,5) rot 1 · Spiegel (6,1) rot 2 ·
    //   Spiegel (2,6) rot 0 · Spiegel (5,0) rot 0 · Prisma (4,1) rot 5 · Spiegel (4,0) rot 1 ·
    //   Spiegel (5,5) rot 1 · Spiegel (5,6) rot 3 · Spiegel (3,0) rot 3
    // Generator schwer-mischziel, Seed 21131, Ziel 72–86 · Ausbau „schwer“
    name: 'Höhenweg', titel: 'Trifidnebel', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'target', x: 5, z: 3, color: 'white' },
      { type: 'source', x: 0, z: 4, dir: 1 },
      { type: 'source', x: 1, z: 6, dir: 7 },
      { type: 'prism', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'prism', x: 4, z: 1, rot: 6 },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'target', x: 2, z: 1, color: 'red' },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'target', x: 3, z: 6, color: 'magenta' },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
    ],
    solution: { '5,4': 1, '1,3': 1, '1,5': 1, '6,1': 2, '2,6': 0, '5,0': 0, '4,1': 5, '4,0': 1, '5,5': 1, '5,6': 3, '3,0': 3 },
  },
  {
    // Lösung: Prisma (2,4) rot 0 · Spiegel (4,2) rot 2 · Spiegel (3,5) rot 0 · Spiegel (4,4) rot 0 ·
    //   Spiegel (1,2) rot 3 · Spiegel (0,2) rot 3 · Spiegel (5,5) rot 0 · Prisma (0,3) rot 1 ·
    //   Spiegel (6,4) rot 2 · Prisma (6,6) rot 3 · Spiegel (6,0) rot 1
    // Generator schwer-falle, Seed 20941, Ziel 72–86 · Ausbau „schwer“
    name: 'Ankerplatz', titel: 'Schleiernebel', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, z: 4, rot: 6 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'source', x: 4, z: 6, dir: 7 },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'magenta' },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'prism', x: 0, z: 3, rot: 7 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'prism', x: 6, z: 6, rot: 5 },
      { type: 'mirror', x: 5, z: 1, rot: 2, fixed: true },
      { type: 'mirror', x: 6, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 5, z: 6, color: 'blue' },
      { type: 'target', x: 4, z: 0, color: 'magenta' },
      { type: 'mirror', x: 6, z: 0, rot: 2 },
      { type: 'blocker', x: 3, z: 2 },
    ],
    solution: { '2,4': 0, '4,2': 2, '3,5': 0, '4,4': 0, '1,2': 3, '0,2': 3, '5,5': 0, '0,3': 1, '6,4': 2, '6,6': 3, '6,0': 1 },
  },
  {
    // Lösung: Prisma (5,5) rot 0 · Spiegel (5,4) rot 1 · Spiegel (3,2) rot 0 · Prisma (2,1) rot 7 ·
    //   Spiegel (5,1) rot 1 · Spiegel (2,0) rot 1 · Spiegel (0,0) rot 3 · Spiegel (0,3) rot 1 ·
    //   Prisma (2,6) rot 5 · Spiegel (1,6) rot 1
    // Generator schwer-sammelstelle, Seed 21101, Ziel 72–86 · Ausbau „schwer“
    name: 'Hafeneinfahrt', titel: 'Hantelnebel', grad: 'schwer',
    elements: [
      { type: 'prism', x: 5, z: 5, rot: 4 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'source', x: 4, z: 6, dir: 7, color: 'yellow' },
      { type: 'target', x: 6, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 4, color: 'magenta' },
      { type: 'target', x: 6, z: 5, color: 'green' },
      { type: 'source', x: 5, z: 0, dir: 3 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'prism', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 0, z: 0, rot: 0 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'target', x: 2, z: 3, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 3, color: 'magenta' },
      { type: 'prism', x: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'target', x: 1, z: 2, color: 'red' },
    ],
    solution: { '5,5': 0, '5,4': 1, '3,2': 0, '2,1': 7, '5,1': 1, '2,0': 1, '0,0': 3, '0,3': 1, '2,6': 5, '1,6': 1 },
  },
  {
    // Lösung: Prisma (5,3) rot 3 · Spiegel (3,3) rot 1 · Spiegel (5,4) rot 3 · Spiegel (4,4) rot 3 ·
    //   Prisma (2,5) rot 6 · Spiegel (2,3) rot 1 · Spiegel (0,3) rot 3 · Spiegel (1,2) rot 3 ·
    //   Spiegel (2,2) rot 3 · Spiegel (6,2) rot 1
    // Generator schwer-falle, Seed 194, Ziel 75,76–81,58 · ersetzt Sternbild (Austausch „schwer“)
    name: 'Seeschlange', titel: 'Glutfluss', grad: 'schwer',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 5, z: 3, rot: 6 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'target', x: 3, z: 1, color: 'blue' },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'prism', x: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 1 },
      { type: 'mirror', x: 4, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 5, rot: 1, fixed: true },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 5, color: 'green' },
      { type: 'target', x: 6, z: 1, color: 'blue' },
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'filter', x: 1, z: 5, color: 'blue' },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'red' },
    ],
    solution: { '5,3': 3, '3,3': 1, '5,4': 3, '4,4': 3, '2,5': 6, '2,3': 1, '0,3': 3, '1,2': 3, '2,2': 3, '6,2': 1 },
  },
  {
    // Lösung: Spiegel (1,2) rot 3 · Spiegel (1,5) rot 3 · Spiegel (3,5) rot 1 · Spiegel (3,2) rot 3 ·
    //   Spiegel (5,3) rot 3 · Spiegel (5,1) rot 1 · Prisma (5,5) rot 5 · Spiegel (6,3) rot 1 ·
    //   Spiegel (0,4) rot 3 · Spiegel (0,5) rot 1 · Spiegel (3,0) rot 1
    // Generator schwer-abzaehlen, Seed 261, Ziel 75,76–81,58 · ersetzt Leuchtturm (Austausch „schwer“)
    name: 'Odyssee', titel: 'Miranda', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'red' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'yellow' },
      { type: 'target', x: 4, z: 2, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'yellow' },
      { type: 'target', x: 1, z: 1, color: 'magenta' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'blue' },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'prism', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'target', x: 0, z: 0, color: 'blue' },
    ],
    solution: { '1,2': 3, '1,5': 3, '3,5': 1, '3,2': 3, '5,3': 3, '5,1': 1, '5,5': 5, '6,3': 1, '0,4': 3, '0,5': 1, '3,0': 1 },
  },
  {
    // Lösung: Prisma (4,3) rot 3 · Spiegel (4,5) rot 1 · Spiegel (3,3) rot 3 · Spiegel (3,4) rot 3 ·
    //   Spiegel (4,2) rot 3 · Spiegel (4,1) rot 1 · Spiegel (4,0) rot 3 · Spiegel (0,4) rot 1 ·
    //   Prisma (3,0) rot 5 · Spiegel (1,0) rot 3 · Spiegel (1,3) rot 1
    // Generator schwer-falle, Seed 409, Ziel 75,76–81,58 · ersetzt Glasperlenspiel (Austausch „schwer“)
    name: 'Maskerade', titel: 'Krebsnebel', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4, color: 'magenta' },
      { type: 'prism', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'filter', x: 5, z: 0, color: 'magenta' },
      { type: 'target', x: 6, z: 0, color: 'magenta' },
      { type: 'prism', x: 3, z: 0, rot: 4 },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'target', x: 0, z: 3, color: 'blue' },
    ],
    solution: { '4,3': 3, '4,5': 1, '3,3': 3, '3,4': 3, '4,2': 3, '4,1': 1, '4,0': 3, '0,4': 1, '3,0': 5, '1,0': 3, '1,3': 1 },
  },
  {
    // Lösung: Spiegel (3,3) rot 1 · Spiegel (5,5) rot 1 · Spiegel (5,2) rot 3 · Prisma (3,4) rot 4 ·
    //   Prisma (3,2) rot 7 · Prisma (4,3) rot 3 · Prisma (3,5) rot 6 · Spiegel (1,3) rot 0 ·
    //   Spiegel (5,1) rot 1 · Prisma (5,4) rot 7
    // Wertung 53.6 · 10 drehbar · 4 Ziele · Rateschritte 76094 · gehärtet aus Profil 3-spiegel, Seed 6024
    name: 'Halo', titel: 'Pferdekopfnebel', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 1, fixed: true },
      { type: 'prism', x: 3, z: 2, rot: 4 },
      { type: 'prism', x: 4, z: 3, rot: 2 },
      { type: 'prism', x: 3, z: 4, rot: 2 },
      { type: 'prism', x: 5, z: 4, rot: 6 },
      { type: 'prism', x: 3, z: 5, rot: 0 },
      { type: 'blocker', x: 1, z: 2 },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'magenta' },
      { type: 'target', x: 0, z: 4, color: 'yellow' },
      { type: 'target', x: 4, z: 5, color: 'red' },
    ],
    solution: { '3,3': 1, '5,5': 1, '5,2': 3, '3,4': 4, '3,2': 7, '4,3': 3, '3,5': 6, '1,3': 0, '5,1': 1, '5,4': 7 },
  },
  {
    // Lösung: Spiegel (2,5) rot 3 · Prisma (3,6) rot 1 · Spiegel (2,3) rot 3 · Prisma (2,4) rot 6 ·
    //   Prisma (3,2) rot 3 · Spiegel (2,2) rot 3 · Prisma (1,5) rot 0 · Prisma (4,5) rot 5 ·
    //   Spiegel (4,4) rot 1
    // Wertung 53.4 · 9 drehbar · 4 Ziele · Rateschritte 84811 · gehärtet aus Profil 3-bunt, Seed 7013
    name: 'Sternenstaub', titel: 'Bachtobel', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 4, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'prism', x: 3, z: 2, rot: 6 },
      { type: 'prism', x: 2, z: 4, rot: 4 },
      { type: 'prism', x: 1, z: 5, rot: 4 },
      { type: 'prism', x: 4, z: 5, rot: 4 },
      { type: 'prism', x: 3, z: 6, rot: 2 },
      { type: 'target', x: 5, z: 1, color: 'blue' },
      { type: 'target', x: 1, z: 3, color: 'magenta' },
      { type: 'target', x: 2, z: 6, color: 'magenta' },
      { type: 'target', x: 4, z: 6, color: 'red' },
    ],
    solution: { '2,5': 3, '3,6': 1, '2,3': 3, '2,4': 6, '3,2': 3, '2,2': 3, '1,5': 0, '4,5': 5, '4,4': 1 },
  },
  {
    // Lösung: Prisma (1,3) rot 7 · Spiegel (3,5) rot 1 · Prisma (3,6) rot 1 · Spiegel (4,6) rot 3 ·
    //   Spiegel (6,5) rot 3 · Spiegel (3,4) rot 1 · Spiegel (2,4) rot 3 · Spiegel (1,0) rot 1 ·
    //   Spiegel (0,0) rot 3 · Spiegel (0,2) rot 1
    // Generator sehr schwer-sammelstelle, Seed 12035 · Ausbau „sehr schwer“
    name: 'Kapella', titel: 'Baumriese', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 1, z: 3, rot: 6 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 0, z: 4, dir: 7, color: 'magenta' },
      { type: 'target', x: 2, z: 2, color: 'yellow' },
      { type: 'target', x: 4, z: 3, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'prism', x: 3, z: 6, rot: 5 },
      { type: 'mirror', x: 4, z: 6, rot: 0 },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'filter', x: 6, z: 1, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'green' },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
    ],
    solution: { '1,3': 7, '3,5': 1, '3,6': 1, '4,6': 3, '6,5': 3, '3,4': 1, '2,4': 3, '1,0': 1, '0,0': 3, '0,2': 1 },
  },
  {
    // Lösung: Spiegel (3,5) rot 1 · Spiegel (3,2) rot 1 · Spiegel (6,2) rot 3 · Spiegel (6,5) rot 1 ·
    //   Spiegel (5,4) rot 3 · Spiegel (2,4) rot 1 · Spiegel (2,0) rot 1 · Spiegel (0,0) rot 3 ·
    //   Prisma (3,1) rot 1 · Spiegel (4,1) rot 3 · Prisma (1,5) rot 7 · Spiegel (1,3) rot 3
    // Generator sehr schwer-abzaehlen, Seed 41595 · Ausbau „sehr schwer“
    name: 'Albireo', titel: 'Dunkler Tann', grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'target', x: 0, z: 2, color: 'white' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'blue' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 0, z: 0, rot: 1 },
      { type: 'prism', x: 3, z: 1, rot: 6 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'prism', x: 1, z: 5, rot: 6 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'red' },
    ],
    solution: { '3,5': 1, '3,2': 1, '6,2': 3, '6,5': 1, '5,4': 3, '2,4': 1, '2,0': 1, '0,0': 3, '3,1': 1, '4,1': 3, '1,5': 7, '1,3': 3 },
  },
  {
    // Lösung: Spiegel (5,5) rot 3 · Spiegel (3,4) rot 2 · Spiegel (2,1) rot 1 · Prisma (3,5) rot 1 ·
    //   Prisma (4,3) rot 4 · Prisma (2,2) rot 7 · Spiegel (3,6) rot 1 · Spiegel (0,3) rot 1 ·
    //   Prisma (6,3) rot 3
    // Generator sehr schwer-lockvogel, Seed 41653 · Ausbau „sehr schwer“
    name: 'Kanopus', titel: 'Nebelwald', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'yellow' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'magenta' },
      { type: 'target', x: 0, z: 1, color: 'yellow' },
      { type: 'blocker', x: 1, z: 2 },
      { type: 'prism', x: 3, z: 5, rot: 6 },
      { type: 'prism', x: 4, z: 3, rot: 1 },
      { type: 'prism', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'target', x: 4, z: 0, color: 'green' },
      { type: 'source', x: 3, z: 0, dir: 1 },
      { type: 'prism', x: 6, z: 3, rot: 4 },
      { type: 'target', x: 3, z: 2, color: 'blue' },
    ],
    solution: { '5,5': 3, '3,4': 2, '2,1': 1, '3,5': 1, '4,3': 4, '2,2': 7, '3,6': 1, '0,3': 1, '6,3': 3 },
  },
  {
    // Lösung: Prisma (5,2) rot 1 · Spiegel (5,0) rot 1 · Spiegel (5,6) rot 1 · Spiegel (6,6) rot 3 ·
    //   Prisma (1,4) rot 2 · Spiegel (3,6) rot 0 · Prisma (4,2) rot 3 · Spiegel (1,5) rot 1 ·
    //   Spiegel (0,2) rot 3 · Spiegel (0,5) rot 2
    // Generator sehr schwer-sammelstelle, Seed 40895 · Ausbau „sehr schwer“
    name: 'Diphda', titel: 'Waldnacht', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 5, z: 2, rot: 4 },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'green' },
      { type: 'target', x: 6, z: 2, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'white' },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 6, rot: 0 },
      { type: 'prism', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 3, z: 6, rot: 3 },
      { type: 'source', x: 6, z: 0, dir: 3 },
      { type: 'prism', x: 4, z: 2, rot: 0 },
      { type: 'target', x: 4, z: 3, color: 'magenta' },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'target', x: 3, z: 5, color: 'green' },
      { type: 'mirror', x: 0, z: 2, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 0, z: 3, color: 'blue' },
    ],
    solution: { '5,2': 1, '5,0': 1, '5,6': 1, '6,6': 3, '1,4': 2, '3,6': 0, '4,2': 3, '1,5': 1, '0,2': 3, '0,5': 2 },
  },
  {
    // Lösung: Prisma (3,1) rot 3 · Spiegel (5,5) rot 1 · Spiegel (5,6) rot 3 · Prisma (2,6) rot 6 ·
    //   Prisma (4,2) rot 5 · Spiegel (4,1) rot 3 · Spiegel (6,1) rot 3 · Spiegel (6,0) rot 1 ·
    //   Spiegel (5,0) rot 3 · Spiegel (4,4) rot 2 · Spiegel (1,1) rot 0
    // Generator sehr schwer-sammelstelle, Seed 40911 · Ausbau „sehr schwer“
    name: 'Hamal', titel: 'Brecher', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 3, z: 1, rot: 7 },
      { type: 'source', x: 2, z: 0, dir: 1, color: 'blue' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'green' },
      { type: 'target', x: 2, z: 1, color: 'cyan' },
      { type: 'target', x: 0, z: 4, color: 'yellow' },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'prism', x: 2, z: 6, rot: 0 },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'magenta' },
      { type: 'prism', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 5, color: 'blue' },
      { type: 'blocker', x: 6, z: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 1, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'target', x: 0, z: 2, color: 'blue' },
    ],
    solution: { '3,1': 3, '5,5': 1, '5,6': 3, '2,6': 6, '4,2': 5, '4,1': 3, '6,1': 3, '6,0': 1, '5,0': 3, '4,4': 2, '1,1': 0 },
  },
  {
    // Lösung: Prisma (2,6) rot 5 · Prisma (3,4) rot 6 · Spiegel (3,2) rot 3 · Prisma (5,4) rot 1 ·
    //   Spiegel (4,2) rot 3 · Spiegel (6,4) rot 1 · Spiegel (6,5) rot 3 · Spiegel (4,1) rot 1 ·
    //   Prisma (5,1) rot 3 · Spiegel (4,0) rot 1 · Spiegel (3,0) rot 3
    // Generator sehr schwer-sammelstelle, Seed 40922 · Ausbau „sehr schwer“
    name: 'Fomalhaut', titel: 'Urwald', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 2, z: 6, rot: 7 },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'blue' },
      { type: 'source', x: 6, z: 2, dir: 3, color: 'green' },
      { type: 'target', x: 2, z: 1, color: 'cyan' },
      { type: 'target', x: 1, z: 5, color: 'yellow' },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'prism', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'target', x: 4, z: 3, color: 'blue' },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'prism', x: 5, z: 4, rot: 4 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 1 },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'prism', x: 5, z: 1, rot: 6 },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'target', x: 0, z: 2, color: 'blue' },
    ],
    solution: { '2,6': 5, '3,4': 6, '3,2': 3, '5,4': 1, '4,2': 3, '6,4': 1, '6,5': 3, '4,1': 1, '5,1': 3, '4,0': 1, '3,0': 3 },
  },
  {
    // Lösung: Prisma (3,2) rot 3 · Spiegel (4,2) rot 3 · Prisma (2,6) rot 7 · Spiegel (4,6) rot 3 ·
    //   Spiegel (5,2) rot 1 · Spiegel (5,5) rot 3 · Spiegel (2,3) rot 1 · Spiegel (0,3) rot 3 ·
    //   Spiegel (2,1) rot 3 · Prisma (3,1) rot 6 · Spiegel (3,0) rot 1
    // Generator sehr schwer-sammelstelle, Seed 42721 · Ausbau „sehr schwer“
    name: 'Dubhe', titel: 'Johanniswürmchen', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 3, z: 2, rot: 0 },
      { type: 'source', x: 6, z: 5, dir: 5, color: 'blue' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'target', x: 3, z: 5, color: 'white' },
      { type: 'source', x: 0, z: 6, dir: 0 },
      { type: 'prism', x: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 0 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'prism', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'target', x: 0, z: 0, color: 'green' },
    ],
    solution: { '3,2': 3, '4,2': 3, '2,6': 7, '4,6': 3, '5,2': 1, '5,5': 3, '2,3': 1, '0,3': 3, '2,1': 3, '3,1': 6, '3,0': 1 },
  },
  {
    // Lösung: Spiegel (0,5) rot 1 · Spiegel (5,1) rot 1 · Spiegel (5,0) rot 1 · Spiegel (3,2) rot 3 ·
    //   Prisma (3,4) rot 0 · Spiegel (5,4) rot 1 · Spiegel (1,1) rot 3 · Prisma (1,3) rot 1 ·
    //   Spiegel (5,6) rot 1 · Spiegel (1,6) rot 1 · Spiegel (4,3) rot 1
    // Generator sehr schwer-mischziel, Seed 41160 · Ausbau „sehr schwer“
    name: 'Kastor', titel: 'Tiefsee', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 4, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'target', x: 0, z: 0, color: 'white' },
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'prism', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'prism', x: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 4, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
    ],
    solution: { '0,5': 1, '5,1': 1, '5,0': 1, '3,2': 3, '3,4': 0, '5,4': 1, '1,1': 3, '1,3': 1, '5,6': 1, '1,6': 1, '4,3': 1 },
  },
  {
    // Lösung: Prisma (1,4) rot 5 · Spiegel (0,2) rot 1 · Prisma (2,6) rot 3 · Spiegel (0,6) rot 1 ·
    //   Prisma (4,5) rot 5 · Spiegel (4,3) rot 1 · Spiegel (2,1) rot 3 · Spiegel (2,0) rot 1 ·
    //   Spiegel (1,0) rot 3 · Spiegel (5,2) rot 1
    // Generator sehr schwer-sammelstelle, Seed 10188 · Ausbau „sehr schwer“
    name: 'Atair', titel: 'Mahlstrom', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 1, z: 4, rot: 7 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'source', x: 5, z: 0, dir: 3, color: 'green' },
      { type: 'target', x: 0, z: 4, color: 'magenta' },
      { type: 'target', x: 0, z: 3, color: 'cyan' },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 0, z: 1, rot: 3, fixed: true },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'prism', x: 2, z: 6, rot: 6 },
      { type: 'mirror', x: 0, z: 6, rot: 2 },
      { type: 'blocker', x: 1, z: 5 },
      { type: 'source', x: 6, z: 3, dir: 3 },
      { type: 'prism', x: 4, z: 5, rot: 4 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'target', x: 3, z: 5, color: 'red' },
      { type: 'target', x: 5, z: 5, color: 'blue' },
    ],
    solution: { '1,4': 5, '0,2': 1, '2,6': 3, '0,6': 1, '4,5': 5, '4,3': 1, '2,1': 3, '2,0': 1, '1,0': 3, '5,2': 1 },
  },
  {
    // Lösung: Spiegel (4,3) rot 1 · Spiegel (5,5) rot 0 · Prisma (6,4) rot 5 · Spiegel (2,4) rot 3 ·
    //   Spiegel (3,1) rot 0 · Spiegel (0,4) rot 2 · Spiegel (2,6) rot 3 · Spiegel (0,6) rot 1 ·
    //   Prisma (6,3) rot 5 · Spiegel (4,1) rot 3 · Spiegel (6,0) rot 1 · Spiegel (1,0) rot 3
    // Generator sehr schwer-mischziel, Seed 41581 · Ausbau „sehr schwer“
    name: 'Alhena', titel: 'Meeresgrund', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'blue' },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'target', x: 2, z: 3, color: 'cyan' },
      { type: 'source', x: 0, z: 0, dir: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'prism', x: 6, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'target', x: 1, z: 5, color: 'cyan' },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 0, z: 6, rot: 3 },
      { type: 'source', x: 3, z: 6, dir: 7 },
      { type: 'prism', x: 6, z: 3, rot: 7 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'target', x: 0, z: 5, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
    ],
    solution: { '4,3': 1, '5,5': 0, '6,4': 5, '2,4': 3, '3,1': 0, '0,4': 2, '2,6': 3, '0,6': 1, '6,3': 5, '4,1': 3, '6,0': 1, '1,0': 3 },
  },
  {
    // Lösung: Spiegel (3,1) rot 3 · Spiegel (1,1) rot 1 · Spiegel (4,4) rot 1 · Prisma (2,2) rot 5 ·
    //   Spiegel (0,2) rot 3 · Spiegel (0,5) rot 1 · Spiegel (6,5) rot 3 · Spiegel (6,1) rot 1 ·
    //   Spiegel (2,0) rot 1 · Spiegel (3,2) rot 1 · Spiegel (4,2) rot 3 · Prisma (5,2) rot 3 ·
    //   Spiegel (5,4) rot 1
    // Generator sehr schwer-mischziel, Seed 11914 · Ausbau „sehr schwer“
    name: 'Sirius', titel: 'Springflut', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 1, dir: 0, color: 'yellow' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'target', x: 1, z: 4, color: 'white' },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'prism', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'cyan' },
      { type: 'prism', x: 5, z: 2, rot: 4 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 1, z: 6, color: 'green' },
      { type: 'target', x: 6, z: 6, color: 'blue' },
    ],
    solution: { '3,1': 3, '1,1': 1, '4,4': 1, '2,2': 5, '0,2': 3, '0,5': 1, '6,5': 3, '6,1': 1, '2,0': 1, '3,2': 1, '4,2': 3, '5,2': 3, '5,4': 1 },
  },
  {
    // Lösung: Spiegel (2,1) rot 1 · Spiegel (6,1) rot 3 · Spiegel (6,4) rot 1 · Spiegel (2,4) rot 1 ·
    //   Spiegel (3,2) rot 1 · Spiegel (4,2) rot 1 · Spiegel (4,6) rot 3 · Prisma (3,6) rot 5 ·
    //   Spiegel (0,2) rot 3 · Spiegel (0,3) rot 1 · Spiegel (5,3) rot 3 · Spiegel (1,6) rot 1 ·
    //   Spiegel (1,0) rot 1
    // Generator sehr schwer-abzaehlen, Seed 11803 · Ausbau „sehr schwer“
    name: 'Aldebaran', titel: 'Walgesang', grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'red' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'target', x: 2, z: 5, color: 'yellow' },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'target', x: 0, z: 1, color: 'white' },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'prism', x: 3, z: 6, rot: 3 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'mirror', x: 1, z: 6, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'target', x: 0, z: 0, color: 'red' },
    ],
    solution: { '2,1': 1, '6,1': 3, '6,4': 1, '2,4': 1, '3,2': 1, '4,2': 1, '4,6': 3, '3,6': 5, '0,2': 3, '0,3': 1, '5,3': 3, '1,6': 1, '1,0': 1 },
  },
  {
    // Lösung: Prisma (4,4) rot 3 · Spiegel (4,3) rot 1 · Spiegel (5,4) rot 1 · Spiegel (1,1) rot 1 ·
    //   Spiegel (2,1) rot 1 · Prisma (2,2) rot 3 · Spiegel (2,6) rot 3 · Prisma (3,2) rot 1 ·
    //   Spiegel (6,2) rot 3 · Spiegel (6,1) rot 1
    // Generator sehr schwer-sammelstelle, Seed 10419 · Ausbau „sehr schwer“
    name: 'Spiralnebel', titel: 'Riesenwelle', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 4, z: 4, rot: 2 },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'target', x: 3, z: 5, color: 'cyan' },
      { type: 'target', x: 0, z: 4, color: 'cyan' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'prism', x: 2, z: 2, rot: 5 },
      { type: 'source', x: 5, z: 0, dir: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'prism', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'target', x: 2, z: 0, color: 'red' },
    ],
    solution: { '4,4': 3, '4,3': 1, '5,4': 1, '1,1': 1, '2,1': 1, '2,2': 3, '2,6': 3, '3,2': 1, '6,2': 3, '6,1': 1 },
  },
  {
    // Lösung: Spiegel (3,0) rot 1 · Spiegel (3,4) rot 3 · Spiegel (4,3) rot 1 · Prisma (2,5) rot 7 ·
    //   Spiegel (2,3) rot 1 · Spiegel (6,3) rot 3 · Spiegel (6,2) rot 1 · Spiegel (4,5) rot 3 ·
    //   Spiegel (4,0) rot 3 · Spiegel (2,1) rot 1 · Spiegel (5,0) rot 1 · Spiegel (1,3) rot 1
    // Generator sehr schwer-mischziel, Seed 366, Ziel 88,36–89,15 · ersetzt Korona (Austausch „sehr schwer“)
    name: 'Lichtfächer', titel: 'Hochmoor', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0, color: 'cyan' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'target', x: 1, z: 0, color: 'white' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'green' },
      { type: 'source', x: 3, z: 6, dir: 5 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'prism', x: 2, z: 5, rot: 6 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'target', x: 1, z: 1, color: 'magenta' },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'target', x: 5, z: 6, color: 'green' },
    ],
    solution: { '3,0': 1, '3,4': 3, '4,3': 1, '2,5': 7, '2,3': 1, '6,3': 3, '6,2': 1, '4,5': 3, '4,0': 3, '2,1': 1, '5,0': 1, '1,3': 1 },
  },
  {
    // Lösung: Spiegel (1,5) rot 3 · Spiegel (5,1) rot 1 · Spiegel (5,0) rot 1 · Spiegel (6,6) rot 3 ·
    //   Prisma (6,3) rot 5 · Spiegel (1,3) rot 3 · Spiegel (5,4) rot 3 · Spiegel (0,5) rot 3 ·
    //   Prisma (2,1) rot 6 · Spiegel (2,0) rot 1 · Spiegel (1,0) rot 3 · Spiegel (0,3) rot 1
    // Generator sehr schwer-mischziel, Seed 41786 · Ausbau „sehr schwer“
    name: 'Alioth', titel: 'Felsschlucht', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'target', x: 3, z: 5, color: 'cyan' },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 6, rot: 2 },
      { type: 'prism', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'prism', x: 2, z: 1, rot: 5 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'target', x: 0, z: 6, color: 'red' },
    ],
    solution: { '1,5': 3, '5,1': 1, '5,0': 1, '6,6': 3, '6,3': 5, '1,3': 3, '5,4': 3, '0,5': 3, '2,1': 6, '2,0': 1, '1,0': 3, '0,3': 1 },
  },
  {
    // Lösung: Prisma (1,1) rot 5 · Spiegel (1,4) rot 3 · Spiegel (3,5) rot 3 · Spiegel (3,4) rot 3 ·
    //   Spiegel (5,4) rot 1 · Prisma (5,5) rot 4 · Prisma (1,2) rot 4 · Spiegel (2,0) rot 1 ·
    //   Prisma (3,2) rot 0 · Spiegel (6,2) rot 1
    // Generator sehr schwer, Seed 41243 · Ausbau „sehr schwer“
    name: 'Ankaa', titel: 'Waldgeist', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'red' },
      { type: 'prism', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'target', x: 0, z: 1, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'prism', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 3, fixed: true },
      { type: 'source', x: 3, z: 0, dir: 3 },
      { type: 'prism', x: 1, z: 2, rot: 5 },
      { type: 'target', x: 4, z: 6, color: 'magenta' },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'prism', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 6, z: 4, color: 'green' },
    ],
    solution: { '1,1': 5, '1,4': 3, '3,5': 3, '3,4': 3, '5,4': 1, '5,5': 4, '1,2': 4, '2,0': 1, '3,2': 0, '6,2': 1 },
  },
  {
    // Lösung: Spiegel (3,2) rot 2 · Spiegel (6,3) rot 1 · Spiegel (5,1) rot 3 · Prisma (1,4) rot 0 ·
    //   Prisma (1,3) rot 1 · Prisma (5,5) rot 7 · Spiegel (4,4) rot 1 · Spiegel (4,5) rot 3 ·
    //   Spiegel (2,5) rot 0 · Spiegel (0,0) rot 3 · Spiegel (0,1) rot 1
    // Generator sehr schwer-lockvogel, Seed 40912 · Ausbau „sehr schwer“
    name: 'Enif', titel: 'Pharao', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 5, dir: 7, color: 'yellow' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'magenta' },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'target', x: 2, z: 1, color: 'magenta' },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'target', x: 6, z: 1, color: 'magenta' },
      { type: 'mirror', x: 6, z: 2, rot: 3, fixed: true },
      { type: 'prism', x: 1, z: 4, rot: 4 },
      { type: 'prism', x: 1, z: 3, rot: 6 },
      { type: 'prism', x: 5, z: 5, rot: 6 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'target', x: 3, z: 5, color: 'green' },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'source', x: 6, z: 0, dir: 4, color: 'blue' },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 2 },
    ],
    solution: { '3,2': 2, '6,3': 1, '5,1': 3, '1,4': 0, '1,3': 1, '5,5': 7, '4,4': 1, '4,5': 3, '2,5': 0, '0,0': 3, '0,1': 1 },
  },
  {
    // Lösung: Spiegel (1,3) rot 1 · Spiegel (1,4) rot 1 · Spiegel (1,1) rot 1 · Spiegel (1,0) rot 3 ·
    //   Spiegel (2,0) rot 1 · Spiegel (2,5) rot 3 · Spiegel (0,5) rot 3 · Spiegel (3,2) rot 3 ·
    //   Spiegel (3,6) rot 1 · Spiegel (4,6) rot 3 · Spiegel (4,0) rot 3 · Spiegel (5,0) rot 1 ·
    //   Spiegel (5,3) rot 3 · Spiegel (0,1) rot 3
    // Generator sehr schwer-mischziel, Seed 11995 · Ausbau „sehr schwer“
    name: 'Rigel', titel: 'Samum', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0, color: 'cyan' },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'target', x: 6, z: 4, color: 'white' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'blue' },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'green' },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
      { type: 'target', x: 0, z: 2, color: 'green' },
    ],
    solution: { '1,3': 1, '1,4': 1, '1,1': 1, '1,0': 3, '2,0': 1, '2,5': 3, '0,5': 3, '3,2': 3, '3,6': 1, '4,6': 3, '4,0': 3, '5,0': 1, '5,3': 3, '0,1': 3 },
  },
  {
    // Lösung: Spiegel (5,3) rot 1 · Spiegel (5,6) rot 3 · Spiegel (4,4) rot 1 · Spiegel (3,4) rot 3 ·
    //   Prisma (2,4) rot 5 · Spiegel (1,4) rot 3 · Spiegel (1,5) rot 3 · Spiegel (0,5) rot 3 ·
    //   Spiegel (0,6) rot 1 · Spiegel (2,0) rot 1 · Spiegel (1,0) rot 3 · Prisma (6,1) rot 7 ·
    //   Spiegel (6,0) rot 1
    // Generator sehr schwer-mischziel, Seed 42703 · Ausbau „sehr schwer“
    name: 'Menkar', titel: 'Dünenmeer', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0, color: 'blue' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'target', x: 5, z: 4, color: 'white' },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'prism', x: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 6, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'target', x: 0, z: 4, color: 'blue' },
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'prism', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 0, rot: 3 },
      { type: 'mirror', x: 5, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 3, color: 'red' },
    ],
    solution: { '5,3': 1, '5,6': 3, '4,4': 1, '3,4': 3, '2,4': 5, '1,4': 3, '1,5': 3, '0,5': 3, '0,6': 1, '2,0': 1, '1,0': 3, '6,1': 7, '6,0': 1 },
  },
  {
    // Lösung: Prisma (4,5) rot 3 · Spiegel (6,3) rot 2 · Spiegel (1,2) rot 0 · Prisma (2,6) rot 5 ·
    //   Spiegel (2,1) rot 3 · Spiegel (6,1) rot 3 · Spiegel (0,6) rot 1 · Spiegel (0,4) rot 3 ·
    //   Spiegel (6,0) rot 1 · Spiegel (5,0) rot 3 · Spiegel (5,6) rot 1 · Spiegel (6,6) rot 3
    // Generator sehr schwer-sammelstelle, Seed 11925 · Ausbau „sehr schwer“
    name: 'Pollux', titel: 'Mumie', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 4, z: 5, rot: 6 },
      { type: 'source', x: 3, z: 0, dir: 1, color: 'yellow' },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'source', x: 0, z: 3, dir: 7, color: 'blue' },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'target', x: 1, z: 5, color: 'cyan' },
      { type: 'source', x: 6, z: 2, dir: 3 },
      { type: 'prism', x: 2, z: 6, rot: 4 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 3, z: 6, color: 'green' },
      { type: 'mirror', x: 0, z: 6, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'target', x: 6, z: 4, color: 'magenta' },
      { type: 'mirror', x: 6, z: 0, rot: 3 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 6, rot: 1 },
    ],
    solution: { '4,5': 3, '6,3': 2, '1,2': 0, '2,6': 5, '2,1': 3, '6,1': 3, '0,6': 1, '0,4': 3, '6,0': 1, '5,0': 3, '5,6': 1, '6,6': 3 },
  },
  {
    // Lösung: Prisma (5,6) rot 7 · Spiegel (4,5) rot 2 · Prisma (3,1) rot 2 · Spiegel (5,3) rot 1 ·
    //   Prisma (3,2) rot 0 · Spiegel (0,4) rot 2 · Spiegel (5,0) rot 0 · Spiegel (1,5) rot 0 ·
    //   Spiegel (4,2) rot 3 · Spiegel (2,4) rot 2
    // Generator sehr schwer-sammelstelle, Seed 42412 · Ausbau „sehr schwer“
    name: 'Merak', titel: 'Feuersee', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 5, z: 6, rot: 0 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'green' },
      { type: 'source', x: 6, z: 3, dir: 3, color: 'magenta' },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 5, color: 'cyan' },
      { type: 'target', x: 6, z: 6, color: 'blue' },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'prism', x: 3, z: 1, rot: 6 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 7 },
      { type: 'prism', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 0, rot: 1 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'target', x: 6, z: 1, color: 'red' },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'target', x: 4, z: 0, color: 'green' },
    ],
    solution: { '5,6': 7, '4,5': 2, '3,1': 2, '5,3': 1, '3,2': 0, '0,4': 2, '5,0': 0, '1,5': 0, '4,2': 3, '2,4': 2 },
  },
  {
    // Lösung: Spiegel (1,0) rot 1 · Prisma (1,5) rot 0 · Spiegel (3,5) rot 3 · Kombinator (3,3) dir 7 ·
    //   Spiegel (1,3) rot 1 · Spiegel (4,5) rot 3 · Prisma (4,4) rot 5 · Spiegel (4,3) rot 3 ·
    //   Spiegel (2,4) rot 3 · Kombinator (2,5) dir 2
    // Wertung 52.2 · 10 drehbar · 3 Ziele · Rateschritte 49178 · gehärtet aus Profil 3-misch, Seed 8068
    name: 'Lichtkegel', titel: 'Korallenriff', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0 },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0, fixed: true },
      { type: 'prism', x: 4, z: 4, rot: 7 },
      { type: 'prism', x: 1, z: 5, rot: 5 },
      { type: 'filter', x: 1, z: 2, color: 'magenta' },
      { type: 'combiner', x: 3, z: 3, dir: 1 },
      { type: 'combiner', x: 2, z: 5, dir: 1 },
      { type: 'target', x: 5, z: 1, color: 'white' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
      { type: 'target', x: 2, z: 6, color: 'white' },
    ],
    solution: { '1,0': 1, '1,5': 0, '3,5': 3, '3,3': 7, '1,3': 1, '4,5': 3, '4,4': 5, '4,3': 3, '2,4': 3, '2,5': 2 },
  },
  {
    // Lösung: Spiegel (2,2) rot 1 · Spiegel (1,3) rot 1 · Spiegel (4,3) rot 3 · Prisma (0,1) rot 1 ·
    //   Spiegel (4,1) rot 3 · Spiegel (4,0) rot 3 · Spiegel (3,4) rot 2 · Spiegel (0,5) rot 1 ·
    //   Spiegel (5,5) rot 1 · Spiegel (6,6) rot 3 · Prisma (2,6) rot 5 · Spiegel (6,3) rot 1
    // Generator sehr schwer-mischziel, Seed 42120 · Ausbau „sehr schwer“
    name: 'Sadr', titel: 'Königskammer', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'target', x: 4, z: 2, color: 'white' },
      { type: 'source', x: 0, z: 0, dir: 2 },
      { type: 'prism', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 6, rot: 2 },
      { type: 'target', x: 1, z: 6, color: 'yellow' },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'source', x: 6, z: 2, dir: 3 },
      { type: 'prism', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'target', x: 4, z: 6, color: 'blue' },
    ],
    solution: { '2,2': 1, '1,3': 1, '4,3': 3, '0,1': 1, '4,1': 3, '4,0': 3, '3,4': 2, '0,5': 1, '5,5': 1, '6,6': 3, '2,6': 5, '6,3': 1 },
  },
  {
    // Lösung: Prisma (4,3) rot 3 · Spiegel (2,3) rot 3 · Spiegel (2,4) rot 3 · Prisma (2,0) rot 5 ·
    //   Prisma (5,2) rot 5 · Spiegel (6,0) rot 1 · Spiegel (4,6) rot 1 · Spiegel (5,6) rot 3 ·
    //   Prisma (3,6) rot 5 · Spiegel (3,2) rot 1
    // Generator sehr schwer, Seed 40343 · Ausbau „sehr schwer“
    name: 'Mintaka', titel: 'Weisse Wüste', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 4, z: 3, rot: 5 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'prism', x: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 1, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 6, color: 'red' },
      { type: 'target', x: 0, z: 4, color: 'blue' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'cyan' },
      { type: 'prism', x: 5, z: 2, rot: 6 },
      { type: 'mirror', x: 5, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'source', x: 6, z: 3, dir: 3 },
      { type: 'prism', x: 3, z: 6, rot: 4 },
      { type: 'target', x: 5, z: 0, color: 'blue' },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
    ],
    solution: { '4,3': 3, '2,3': 3, '2,4': 3, '2,0': 5, '5,2': 5, '6,0': 1, '4,6': 1, '5,6': 3, '3,6': 5, '3,2': 1 },
  },
  {
    // Lösung: Spiegel (2,1) rot 3 · Spiegel (2,4) rot 1 · Spiegel (5,4) rot 1 · Prisma (3,1) rot 1 ·
    //   Spiegel (0,4) rot 3 · Spiegel (5,1) rot 3 · Prisma (3,4) rot 5 · Prisma (4,4) rot 5 ·
    //   Prisma (5,3) rot 2 · Spiegel (1,1) rot 2 · Kombinator (4,2) dir 6
    // Wertung 54.5 · 11 drehbar · 4 Ziele · Rateschritte 80714 · gehärtet aus Profil 4-bunt, Seed 8051
    name: 'Morgenröte', titel: 'Sonnentempel', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 6, rot: 2, fixed: true },
      { type: 'prism', x: 3, z: 1, rot: 6 },
      { type: 'prism', x: 5, z: 3, rot: 4 },
      { type: 'prism', x: 3, z: 4, rot: 1 },
      { type: 'prism', x: 4, z: 4, rot: 4 },
      { type: 'filter', x: 5, z: 5, color: 'yellow' },
      { type: 'combiner', x: 4, z: 2, dir: 5 },
      { type: 'target', x: 4, z: 0, color: 'cyan' },
      { type: 'target', x: 5, z: 0, color: 'red' },
      { type: 'target', x: 6, z: 4, color: 'yellow' },
      { type: 'target', x: 0, z: 5, color: 'green' },
    ],
    solution: { '2,1': 3, '2,4': 1, '5,4': 1, '3,1': 1, '0,4': 3, '5,1': 3, '3,4': 5, '4,4': 5, '5,3': 2, '1,1': 2, '4,2': 6 },
  },
  {
    // Lösung: Prisma (5,2) rot 2 · Spiegel (1,2) rot 1 · Spiegel (3,1) rot 1 · Spiegel (3,0) rot 1 ·
    //   Spiegel (5,6) rot 3 · Spiegel (4,6) rot 1 · Spiegel (6,1) rot 1 · Spiegel (2,0) rot 3 ·
    //   Prisma (3,3) rot 4 · Spiegel (0,4) rot 1 · Spiegel (1,4) rot 3
    // Generator sehr schwer-sammelstelle, Seed 40563 · Ausbau „sehr schwer“
    name: 'Mizar', titel: 'Feuersturm', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 5, z: 2, rot: 7 },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'target', x: 6, z: 3, color: 'yellow' },
      { type: 'target', x: 2, z: 5, color: 'cyan' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 4, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'source', x: 6, z: 0, dir: 3 },
      { type: 'prism', x: 3, z: 3, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 1, z: 5, color: 'red' },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'target', x: 0, z: 2, color: 'green' },
    ],
    solution: { '5,2': 2, '1,2': 1, '3,1': 1, '3,0': 1, '5,6': 3, '4,6': 1, '6,1': 1, '2,0': 3, '3,3': 4, '0,4': 1, '1,4': 3 },
  },
  {
    // Lösung: Spiegel (2,4) rot 3 · Spiegel (4,3) rot 1 · Prisma (1,4) rot 5 · Spiegel (3,6) rot 3 ·
    //   Spiegel (3,2) rot 1 · Prisma (1,2) rot 4 · Prisma (4,4) rot 2 · Spiegel (0,4) rot 3 ·
    //   Spiegel (4,6) rot 1 · Spiegel (6,6) rot 3 · Spiegel (6,3) rot 1 · Spiegel (4,1) rot 1
    // Generator sehr schwer, Seed 40139 · Ausbau „sehr schwer“
    name: 'Alkor', titel: 'Glutkern', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'yellow' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'prism', x: 1, z: 4, rot: 6 },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'prism', x: 1, z: 2, rot: 6 },
      { type: 'prism', x: 4, z: 4, rot: 5 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 1, fixed: true },
      { type: 'target', x: 2, z: 5, color: 'red' },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'target', x: 0, z: 1, color: 'cyan' },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 6, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
    ],
    solution: { '2,4': 3, '4,3': 1, '1,4': 5, '3,6': 3, '3,2': 1, '1,2': 4, '4,4': 2, '0,4': 3, '4,6': 1, '6,6': 3, '6,3': 1, '4,1': 1 },
  },
  {
    // Lösung: Spiegel (3,2) rot 1 · Prisma (1,4) rot 1 · Spiegel (5,4) rot 1 · Spiegel (2,5) rot 2 ·
    //   Spiegel (1,6) rot 0 · Spiegel (1,2) rot 3 · Spiegel (6,5) rot 1 · Prisma (0,2) rot 6 ·
    //   Spiegel (3,6) rot 1 · Spiegel (1,3) rot 1 · Spiegel (0,1) rot 3 · Spiegel (6,1) rot 3
    // Generator sehr schwer-mischziel, Seed 40142 · Ausbau „sehr schwer“
    name: 'Kochab', titel: 'Sandviper', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 4, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'target', x: 4, z: 2, color: 'white' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'source', x: 0, z: 3, dir: 1 },
      { type: 'prism', x: 1, z: 4, rot: 6 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'prism', x: 0, z: 2, rot: 5 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 5, color: 'green' },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'blocker', x: 2, z: 6 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 5, color: 'red' },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 6, z: 0, color: 'green' },
    ],
    solution: { '3,2': 1, '1,4': 1, '5,4': 1, '2,5': 2, '1,6': 0, '1,2': 3, '6,5': 1, '0,2': 6, '3,6': 1, '1,3': 1, '0,1': 3, '6,1': 3 },
  },
  {
    // Lösung: Prisma (1,4) rot 7 · Spiegel (0,4) rot 1 · Spiegel (4,1) rot 0 · Spiegel (5,2) rot 0 ·
    //   Prisma (6,3) rot 3 · Spiegel (3,3) rot 1 · Spiegel (4,5) rot 2 · Spiegel (3,1) rot 1 ·
    //   Spiegel (6,1) rot 2 · Spiegel (5,6) rot 0 · Spiegel (3,5) rot 2 · Spiegel (4,6) rot 0
    // Generator sehr schwer-sammelstelle, Seed 673, Ziel 90,42–91,28 · ersetzt Quasar (Austausch „sehr schwer“)
    name: 'Leitstern', titel: 'Skorpion', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 1, z: 4, rot: 2 },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'source', x: 3, z: 6, dir: 5, color: 'blue' },
      { type: 'target', x: 1, z: 1, color: 'magenta' },
      { type: 'target', x: 6, z: 4, color: 'white' },
      { type: 'source', x: 1, z: 6, dir: 7 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'prism', x: 6, z: 3, rot: 7 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 6, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'target', x: 5, z: 0, color: 'green' },
      { type: 'source', x: 6, z: 2, dir: 3, color: 'yellow' },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'target', x: 6, z: 5, color: 'green' },
    ],
    solution: { '1,4': 7, '0,4': 1, '4,1': 0, '5,2': 0, '6,3': 3, '3,3': 1, '4,5': 2, '3,1': 1, '6,1': 2, '5,6': 0, '3,5': 2, '4,6': 0 },
  },
  {
    // Lösung: Prisma (5,4) rot 4 · Spiegel (4,3) rot 2 · Spiegel (5,2) rot 2 · Spiegel (3,0) rot 0 ·
    //   Spiegel (2,1) rot 0 · Spiegel (1,0) rot 0 · Spiegel (0,1) rot 2 · Prisma (2,5) rot 3 ·
    //   Spiegel (0,5) rot 3 · Prisma (2,2) rot 3 · Spiegel (0,2) rot 3
    // Generator sehr schwer-sammelstelle, Seed 10645 · Ausbau „sehr schwer“
    name: 'Prokyon', titel: 'Feuerzunge', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 5, z: 4, rot: 6 },
      { type: 'source', x: 6, z: 5, dir: 5, color: 'red' },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'cyan' },
      { type: 'target', x: 4, z: 5, color: 'magenta' },
      { type: 'target', x: 0, z: 4, color: 'cyan' },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
      { type: 'source', x: 3, z: 6, dir: 5 },
      { type: 'prism', x: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'target', x: 2, z: 6, color: 'red' },
      { type: 'target', x: 1, z: 6, color: 'green' },
      { type: 'source', x: 6, z: 6, dir: 5 },
      { type: 'prism', x: 2, z: 2, rot: 4 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
    ],
    solution: { '5,4': 4, '4,3': 2, '5,2': 2, '3,0': 0, '2,1': 0, '1,0': 0, '0,1': 2, '2,5': 3, '0,5': 3, '2,2': 3, '0,2': 3 },
  },
  {
    // Lösung: Spiegel (2,4) rot 3 · Spiegel (2,2) rot 1 · Spiegel (4,2) rot 1 · Spiegel (4,4) rot 3 ·
    //   Spiegel (2,6) rot 1 · Spiegel (3,6) rot 3 · Spiegel (3,0) rot 1 · Spiegel (0,0) rot 3 ·
    //   Prisma (5,2) rot 3 · Spiegel (5,5) rot 1 · Prisma (4,5) rot 5 · Spiegel (2,1) rot 3
    // Generator sehr schwer-abzaehlen, Seed 11189 · Ausbau „sehr schwer“
    name: 'Gravitation', titel: 'Schirokko', grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'cyan' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 0, z: 2, color: 'white' },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'red' },
      { type: 'mirror', x: 2, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'prism', x: 5, z: 2, rot: 4 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'prism', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'target', x: 6, z: 1, color: 'red' },
    ],
    solution: { '2,4': 3, '2,2': 1, '4,2': 1, '4,4': 3, '2,6': 1, '3,6': 3, '3,0': 1, '0,0': 3, '5,2': 3, '5,5': 1, '4,5': 5, '2,1': 3 },
  },
  {
    // Lösung: Prisma (0,1) rot 1 · Spiegel (1,0) rot 0 · Prisma (3,5) rot 6 · Spiegel (5,3) rot 0 ·
    //   Spiegel (6,4) rot 2 · Spiegel (3,1) rot 1 · Prisma (6,1) rot 5 · Spiegel (2,4) rot 0 ·
    //   Spiegel (5,0) rot 0 · Spiegel (1,4) rot 2 · Spiegel (3,0) rot 3 · Spiegel (4,0) rot 1
    // Generator sehr schwer-sammelstelle, Seed 40656 · Ausbau „sehr schwer“
    name: 'Izar', titel: 'Erdfeuer', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 0, z: 1, rot: 5 },
      { type: 'source', x: 6, z: 5, dir: 5, color: 'blue' },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'green' },
      { type: 'target', x: 0, z: 6, color: 'magenta' },
      { type: 'target', x: 4, z: 5, color: 'yellow' },
      { type: 'source', x: 4, z: 6, dir: 5 },
      { type: 'prism', x: 3, z: 5, rot: 4 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'target', x: 5, z: 5, color: 'blue' },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'source', x: 1, z: 6, dir: 7 },
      { type: 'prism', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 1 },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'target', x: 3, z: 6, color: 'green' },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'target', x: 6, z: 0, color: 'blue' },
    ],
    solution: { '0,1': 1, '1,0': 0, '3,5': 6, '5,3': 0, '6,4': 2, '3,1': 1, '6,1': 5, '2,4': 0, '5,0': 0, '1,4': 2, '3,0': 3, '4,0': 1 },
  },
  {
    // Lösung: Spiegel (6,2) rot 3 · Spiegel (3,2) rot 3 · Prisma (5,3) rot 4 · Spiegel (2,0) rot 0 ·
    //   Spiegel (1,1) rot 0 · Spiegel (0,3) rot 1 · Spiegel (0,2) rot 3 · Prisma (0,5) rot 6 ·
    //   Spiegel (1,4) rot 0 · Spiegel (3,0) rot 3 · Spiegel (4,0) rot 1 · Spiegel (2,1) rot 3
    // Generator sehr schwer-mischziel, Seed 40263 · Ausbau „sehr schwer“
    name: 'Algol', titel: 'Asteroidengürtel', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'target', x: 3, z: 4, color: 'white' },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'cyan' },
      { type: 'prism', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'source', x: 1, z: 6, dir: 5 },
      { type: 'prism', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 5, color: 'cyan' },
      { type: 'blocker', x: 1, z: 5 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
    ],
    solution: { '6,2': 3, '3,2': 3, '5,3': 4, '2,0': 0, '1,1': 0, '0,3': 1, '0,2': 3, '0,5': 6, '1,4': 0, '3,0': 3, '4,0': 1, '2,1': 3 },
  },
  {
    // Lösung: Spiegel (5,0) rot 1 · Spiegel (3,3) rot 3 · Spiegel (6,3) rot 3 · Spiegel (1,0) rot 3 ·
    //   Spiegel (2,1) rot 0 · Prisma (3,2) rot 2 · Prisma (4,1) rot 5 · Spiegel (1,5) rot 3 ·
    //   Spiegel (0,5) rot 3 · Prisma (3,4) rot 7 · Spiegel (2,3) rot 3 · Spiegel (2,6) rot 3
    // Generator sehr schwer-abschalten, Seed 11243 · Ausbau „sehr schwer“
    name: 'Orion', titel: 'Eruption', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 5, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'source', x: 0, z: 3, dir: 7 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'prism', x: 3, z: 2, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'prism', x: 4, z: 1, rot: 4 },
      { type: 'target', x: 3, z: 1, color: 'red' },
      { type: 'mirror', x: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 0, z: 6, color: 'yellow' },
      { type: 'prism', x: 3, z: 4, rot: 6 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'target', x: 6, z: 4, color: 'blue' },
    ],
    solution: { '5,0': 1, '3,3': 3, '6,3': 3, '1,0': 3, '2,1': 0, '3,2': 2, '4,1': 5, '1,5': 3, '0,5': 3, '3,4': 7, '2,3': 3, '2,6': 3 },
  },
  {
    // Lösung: Prisma (1,0) rot 1 · Spiegel (0,1) rot 2 · Prisma (2,2) rot 5 · Spiegel (2,1) rot 3 ·
    //   Spiegel (0,2) rot 3 · Spiegel (3,1) rot 1 · Spiegel (0,5) rot 1 · Spiegel (3,5) rot 1 ·
    //   Prisma (4,3) rot 6 · Spiegel (4,2) rot 3 · Spiegel (6,2) rot 1 · Spiegel (6,4) rot 3
    // Generator sehr schwer-sammelstelle, Seed 40703 · Ausbau „sehr schwer“
    name: 'Bellatrix', titel: 'Gasriese', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 1, z: 0, rot: 5 },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'red' },
      { type: 'source', x: 5, z: 6, dir: 5, color: 'blue' },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'target', x: 5, z: 0, color: 'magenta' },
      { type: 'target', x: 1, z: 4, color: 'cyan' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'source', x: 1, z: 6, dir: 7 },
      { type: 'prism', x: 4, z: 3, rot: 7 },
      { type: 'target', x: 6, z: 1, color: 'blue' },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
    ],
    solution: { '1,0': 1, '0,1': 2, '2,2': 5, '2,1': 3, '0,2': 3, '3,1': 1, '0,5': 1, '3,5': 1, '4,3': 6, '4,2': 3, '6,2': 1, '6,4': 3 },
  },
  {
    // Lösung: Prisma (3,1) rot 0 · Spiegel (5,3) rot 2 · Spiegel (4,0) rot 0 · Spiegel (5,1) rot 0 ·
    //   Spiegel (2,3) rot 0 · Prisma (1,6) rot 0 · Spiegel (4,3) rot 0 · Prisma (1,2) rot 7 ·
    //   Spiegel (5,4) rot 0 · Spiegel (1,0) rot 1 · Spiegel (6,2) rot 3 · Spiegel (6,3) rot 2
    // Generator sehr schwer-falle, Seed 11138 · Ausbau „sehr schwer“
    name: 'Beteigeuze', titel: 'Feuerring', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'prism', x: 3, z: 1, rot: 7 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'target', x: 3, z: 5, color: 'blue' },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'source', x: 5, z: 0, dir: 3 },
      { type: 'source', x: 0, z: 5, dir: 1 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'prism', x: 1, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'prism', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'target', x: 6, z: 0, color: 'magenta' },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'target', x: 0, z: 0, color: 'red' },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
    ],
    solution: { '3,1': 0, '5,3': 2, '4,0': 0, '5,1': 0, '2,3': 0, '1,6': 0, '4,3': 0, '1,2': 7, '5,4': 0, '1,0': 1, '6,2': 3, '6,3': 2 },
  },
  {
    // Lösung: Prisma (1,3) rot 4 · Spiegel (5,3) rot 0 · Prisma (3,1) rot 3 · Spiegel (3,6) rot 3 ·
    //   Spiegel (2,6) rot 1 · Spiegel (2,1) rot 1 · Spiegel (1,1) rot 1 · Spiegel (1,0) rot 1 ·
    //   Spiegel (0,0) rot 3 · Spiegel (5,6) rot 0 · Prisma (4,5) rot 5
    // Generator sehr schwer-sammelstelle, Seed 40816 · Ausbau „sehr schwer“
    name: 'Megrez', titel: 'Perihel', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 1, z: 3, rot: 5 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 4, z: 6, dir: 5, color: 'blue' },
      { type: 'target', x: 0, z: 3, color: 'green' },
      { type: 'target', x: 0, z: 2, color: 'magenta' },
      { type: 'target', x: 0, z: 4, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'prism', x: 3, z: 1, rot: 5 },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'source', x: 6, z: 5, dir: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'prism', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 5, color: 'red' },
      { type: 'target', x: 1, z: 2, color: 'green' },
    ],
    solution: { '1,3': 4, '5,3': 0, '3,1': 3, '3,6': 3, '2,6': 1, '2,1': 1, '1,1': 1, '1,0': 1, '0,0': 3, '5,6': 0, '4,5': 5 },
  },
  {
    // Lösung: Prisma (1,2) rot 2 · Spiegel (1,4) rot 3 · Prisma (5,4) rot 5 · Spiegel (0,4) rot 1 ·
    //   Spiegel (4,1) rot 3 · Spiegel (1,5) rot 1 · Spiegel (6,1) rot 3 · Spiegel (6,0) rot 1 ·
    //   Spiegel (0,0) rot 3 · Spiegel (0,1) rot 1 · Spiegel (2,1) rot 1 · Kombinator (5,3) dir 7 ·
    //   Spiegel (0,3) rot 3 · Spiegel (2,5) rot 1
    // Generator sehr schwer, Seed 42941 · Ausbau „sehr schwer“
    name: 'Nunki', titel: 'Flammenmeer', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 6, z: 3, dir: 3 },
      { type: 'prism', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'prism', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'target', x: 3, z: 5, color: 'red' },
      { type: 'target', x: 3, z: 2, color: 'green' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 5, z: 6, color: 'red' },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 0, z: 0, rot: 0 },
      { type: 'blocker', x: 3, z: 1 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'combiner', x: 5, z: 3, dir: 4 },
      { type: 'target', x: 6, z: 2, color: 'cyan' },
      { type: 'mirror', x: 0, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'target', x: 2, z: 6, color: 'red' },
    ],
    solution: { '1,2': 2, '1,4': 3, '5,4': 5, '0,4': 1, '4,1': 3, '1,5': 1, '6,1': 3, '6,0': 1, '0,0': 3, '0,1': 1, '2,1': 1, '5,3': 7, '0,3': 3, '2,5': 1 },
  },
  {
    // Lösung: Prisma (4,4) rot 2 · Spiegel (5,1) rot 3 · Spiegel (3,1) rot 3 · Prisma (5,5) rot 2 ·
    //   Prisma (3,3) rot 3 · Kombinator (6,6) dir 6 · Spiegel (3,4) rot 3 · Spiegel (1,3) rot 3 ·
    //   Spiegel (1,6) rot 3 · Kombinator (2,4) dir 2
    // Generator sehr schwer-sammelstelle, Seed 10608 · Ausbau „sehr schwer“
    name: 'Magellanwolke', titel: 'Aphel', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 4, z: 4, rot: 1 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'blue' },
      { type: 'target', x: 4, z: 6, color: 'cyan' },
      { type: 'target', x: 2, z: 6, color: 'white' },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'prism', x: 5, z: 5, rot: 6 },
      { type: 'prism', x: 3, z: 3, rot: 1 },
      { type: 'mirror', x: 5, z: 6, rot: 1, fixed: true },
      { type: 'combiner', x: 6, z: 6, dir: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'combiner', x: 2, z: 4, dir: 5 },
      { type: 'mirror', x: 0, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
    ],
    solution: { '4,4': 2, '5,1': 3, '3,1': 3, '5,5': 2, '3,3': 3, '6,6': 6, '3,4': 3, '1,3': 3, '1,6': 3, '2,4': 2 },
  },
  {
    // Lösung: Prisma (6,4) rot 3 · Spiegel (5,3) rot 0 · Spiegel (5,5) rot 2 · Spiegel (1,2) rot 2 ·
    //   Prisma (2,1) rot 1 · Spiegel (4,1) rot 1 · Spiegel (4,6) rot 3 · Spiegel (5,2) rot 3 ·
    //   Spiegel (5,0) rot 1 · Spiegel (1,0) rot 3 · Spiegel (1,1) rot 3 · Prisma (0,5) rot 7
    // Generator sehr schwer-sammelstelle, Seed 42153 · Ausbau „sehr schwer“
    name: 'Alnilam', titel: 'Bahnresonanz', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 6, z: 4, rot: 6 },
      { type: 'source', x: 2, z: 6, dir: 7, color: 'cyan' },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'red' },
      { type: 'target', x: 0, z: 4, color: 'magenta' },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'source', x: 5, z: 6, dir: 5 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'prism', x: 2, z: 1, rot: 5 },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 2, z: 2, rot: 1, fixed: true },
      { type: 'target', x: 3, z: 6, color: 'red' },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'source', x: 1, z: 6, dir: 5, color: 'magenta' },
      { type: 'prism', x: 0, z: 5, rot: 2 },
      { type: 'target', x: 6, z: 6, color: 'green' },
    ],
    solution: { '6,4': 3, '5,3': 0, '5,5': 2, '1,2': 2, '2,1': 1, '4,1': 1, '4,6': 3, '5,2': 3, '5,0': 1, '1,0': 3, '1,1': 3, '0,5': 7 },
  },
  {
    // Lösung: Spiegel (6,0) rot 1 · Spiegel (6,4) rot 3 · Spiegel (1,2) rot 1 · Prisma (4,3) rot 5 ·
    //   Spiegel (2,6) rot 3 · Spiegel (2,3) rot 1 · Spiegel (4,2) rot 1 · Spiegel (1,1) rot 1 ·
    //   Spiegel (0,3) rot 3 · Spiegel (0,5) rot 1 · Spiegel (2,1) rot 3 · Spiegel (6,6) rot 3 ·
    //   Spiegel (5,6) rot 1
    // Generator sehr schwer-mischziel, Seed 42851 · Ausbau „sehr schwer“
    name: 'Saiph', titel: 'Ausbruch', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0, color: 'blue' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'target', x: 1, z: 4, color: 'white' },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'cyan' },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'prism', x: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'filter', x: 0, z: 4, color: 'green' },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 5, rot: 1, fixed: true },
      { type: 'target', x: 3, z: 6, color: 'red' },
      { type: 'mirror', x: 6, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'target', x: 5, z: 1, color: 'green' },
    ],
    solution: { '6,0': 1, '6,4': 3, '1,2': 1, '4,3': 5, '2,6': 3, '2,3': 1, '4,2': 1, '1,1': 1, '0,3': 3, '0,5': 1, '2,1': 3, '6,6': 3, '5,6': 1 },
  },
  {
    // Lösung: Prisma (5,1) rot 2 · Prisma (5,5) rot 4 · Spiegel (0,5) rot 1 · Spiegel (0,4) rot 3 ·
    //   Spiegel (1,4) rot 3 · Spiegel (5,4) rot 1 · Spiegel (1,0) rot 1 · Spiegel (6,4) rot 1 ·
    //   Spiegel (4,6) rot 0 · Spiegel (2,2) rot 1 · Prisma (2,3) rot 5 · Spiegel (4,4) rot 2
    // Generator sehr schwer-sammelstelle, Seed 51827, Ziel 96–112 · Ausbau „sehr schwer“
    name: 'Wezen', titel: 'Dunkelwolke', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 5, z: 1, rot: 1 },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'cyan' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'red' },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 5 },
      { type: 'prism', x: 5, z: 5, rot: 7 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 3 },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'target', x: 0, z: 2, color: 'magenta' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'prism', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'target', x: 6, z: 5, color: 'green' },
    ],
    solution: { '5,1': 2, '5,5': 4, '0,5': 1, '0,4': 3, '1,4': 3, '5,4': 1, '1,0': 1, '6,4': 1, '4,6': 0, '2,2': 1, '2,3': 5, '4,4': 2 },
  },
  {
    // Lösung: Spiegel (2,1) rot 1 · Spiegel (2,0) rot 1 · Prisma (0,0) rot 2 · Prisma (1,2) rot 2 ·
    //   Kombinator (4,4) dir 0 · Prisma (6,3) rot 5 · Spiegel (2,3) rot 3 · Spiegel (2,6) rot 3 ·
    //   Prisma (3,5) rot 7 · Spiegel (0,6) rot 1
    // Generator sehr schwer, Seed 40562 · Ausbau „sehr schwer“
    name: 'Alphard', titel: 'Sternwiege', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 0, z: 1, dir: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'prism', x: 0, z: 0, rot: 5 },
      { type: 'prism', x: 1, z: 2, rot: 6 },
      { type: 'combiner', x: 4, z: 4, dir: 6 },
      { type: 'target', x: 6, z: 4, color: 'yellow' },
      { type: 'target', x: 0, z: 3, color: 'magenta' },
      { type: 'source', x: 3, z: 6, dir: 7 },
      { type: 'prism', x: 6, z: 3, rot: 6 },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'source', x: 0, z: 2, dir: 1 },
      { type: 'prism', x: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 6, rot: 0 },
      { type: 'target', x: 5, z: 5, color: 'blue' },
    ],
    solution: { '2,1': 1, '2,0': 1, '0,0': 2, '1,2': 2, '4,4': 0, '6,3': 5, '2,3': 3, '2,6': 3, '3,5': 7, '0,6': 1 },
  },
  {
    // Lösung: Spiegel (3,5) rot 1 · Spiegel (3,2) rot 3 · Spiegel (5,2) rot 3 · Spiegel (5,5) rot 1 ·
    //   Prisma (3,1) rot 3 · Spiegel (2,1) rot 1 · Spiegel (0,0) rot 3 · Spiegel (0,3) rot 1 ·
    //   Spiegel (5,6) rot 1 · Spiegel (5,0) rot 1 · Spiegel (4,3) rot 1 · Spiegel (4,0) rot 3 ·
    //   Prisma (6,3) rot 2
    // Generator sehr schwer-abzaehlen, Seed 10292 · Ausbau „sehr schwer“
    name: 'Gezeitenkraft', titel: 'Feuerschlund', grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'red' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'yellow' },
      { type: 'target', x: 2, z: 2, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'magenta' },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
      { type: 'prism', x: 3, z: 1, rot: 6 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 0, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'target', x: 4, z: 4, color: 'blue' },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'prism', x: 6, z: 3, rot: 1 },
    ],
    solution: { '3,5': 1, '3,2': 3, '5,2': 3, '5,5': 1, '3,1': 3, '2,1': 1, '0,0': 3, '0,3': 1, '5,6': 1, '5,0': 1, '4,3': 1, '4,0': 3, '6,3': 2 },
  },
  {
    // Lösung: Prisma (2,4) rot 7 · Spiegel (2,2) rot 1 · Spiegel (3,4) rot 3 · Spiegel (3,3) rot 3 ·
    //   Spiegel (6,3) rot 3 · Spiegel (4,1) rot 2 · Spiegel (0,5) rot 2 · Spiegel (1,6) rot 0 ·
    //   Prisma (5,1) rot 3 · Spiegel (5,4) rot 3 · Prisma (5,5) rot 1 · Spiegel (5,6) rot 3
    // Generator sehr schwer-falle, Seed 12126 · Ausbau „sehr schwer“
    name: 'Kassiopeia', titel: 'Himmelspol', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'target', x: 0, z: 2, color: 'red' },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'source', x: 3, z: 0, dir: 1, color: 'green' },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'prism', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 0, fixed: true },
      { type: 'target', x: 4, z: 2, color: 'green' },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'white' },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'source', x: 6, z: 4, dir: 3 },
      { type: 'prism', x: 5, z: 5, rot: 4 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'target', x: 6, z: 5, color: 'red' },
    ],
    solution: { '2,4': 7, '2,2': 1, '3,4': 3, '3,3': 3, '6,3': 3, '4,1': 2, '0,5': 2, '1,6': 0, '5,1': 3, '5,4': 3, '5,5': 1, '5,6': 3 },
  },
  {
    // Lösung: Spiegel (3,2) rot 1 · Spiegel (5,3) rot 3 · Spiegel (5,4) rot 3 · Prisma (4,4) rot 2 ·
    //   Spiegel (4,6) rot 1 · Spiegel (6,5) rot 1 · Prisma (4,3) rot 7 · Spiegel (5,1) rot 1 ·
    //   Spiegel (1,5) rot 1 · Spiegel (1,1) rot 1 · Spiegel (4,2) rot 3 · Spiegel (3,0) rot 3 ·
    //   Spiegel (4,0) rot 1
    // Generator sehr schwer-mischziel, Seed 40538 · Ausbau „sehr schwer“
    name: 'Markab', titel: 'Saturnring', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'target', x: 2, z: 2, color: 'white' },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'prism', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'source', x: 1, z: 6, dir: 7 },
      { type: 'prism', x: 4, z: 3, rot: 0 },
      { type: 'target', x: 6, z: 1, color: 'green' },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'target', x: 6, z: 2, color: 'red' },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'target', x: 1, z: 0, color: 'blue' },
    ],
    solution: { '3,2': 1, '5,3': 3, '5,4': 3, '4,4': 2, '4,6': 1, '6,5': 1, '4,3': 7, '5,1': 1, '1,5': 1, '1,1': 1, '4,2': 3, '3,0': 3, '4,0': 1 },
  },
  {
    // Lösung: Prisma (1,4) rot 5 · Spiegel (1,0) rot 3 · Spiegel (2,0) rot 1 · Spiegel (2,2) rot 3 ·
    //   Spiegel (0,2) rot 1 · Spiegel (0,1) rot 3 · Spiegel (5,5) rot 1 · Prisma (1,5) rot 2 ·
    //   Spiegel (3,0) rot 0 · Prisma (2,3) rot 2 · Spiegel (5,2) rot 2
    // Generator sehr schwer, Seed 40374 · Ausbau „sehr schwer“
    name: 'Achernar', titel: 'Ringschatten', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'prism', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'prism', x: 1, z: 5, rot: 0 },
      { type: 'target', x: 2, z: 6, color: 'yellow' },
      { type: 'target', x: 1, z: 6, color: 'cyan' },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'source', x: 0, z: 3, dir: 7, color: 'blue' },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'prism', x: 2, z: 3, rot: 7 },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'filter', x: 5, z: 4, color: 'yellow' },
      { type: 'target', x: 0, z: 6, color: 'blue' },
    ],
    solution: { '1,4': 5, '1,0': 3, '2,0': 1, '2,2': 3, '0,2': 1, '0,1': 3, '5,5': 1, '1,5': 2, '3,0': 0, '2,3': 2, '5,2': 2 },
  },
  {
    // Lösung: Spiegel (3,2) rot 3 · Spiegel (1,2) rot 1 · Spiegel (1,5) rot 1 · Spiegel (3,5) rot 3 ·
    //   Spiegel (4,4) rot 3 · Spiegel (5,4) rot 3 · Spiegel (5,2) rot 1 · Spiegel (0,2) rot 3 ·
    //   Prisma (3,1) rot 1 · Spiegel (6,1) rot 3 · Spiegel (6,0) rot 1 · Spiegel (4,0) rot 3 ·
    //   Prisma (5,5) rot 3
    // Generator sehr schwer-abzaehlen, Seed 42430 · Ausbau „sehr schwer“
    name: 'Schedir', titel: 'Planetenparade', grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'target', x: 1, z: 1, color: 'blue' },
      { type: 'target', x: 0, z: 5, color: 'white' },
      { type: 'target', x: 3, z: 6, color: 'blue' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'prism', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 1, fixed: true },
      { type: 'target', x: 2, z: 1, color: 'red' },
      { type: 'prism', x: 5, z: 5, rot: 5 },
      { type: 'target', x: 6, z: 4, color: 'green' },
    ],
    solution: { '3,2': 3, '1,2': 1, '1,5': 1, '3,5': 3, '4,4': 3, '5,4': 3, '5,2': 1, '0,2': 3, '3,1': 1, '6,1': 3, '6,0': 1, '4,0': 3, '5,5': 3 },
  },
  {
    // Lösung: Prisma (3,1) rot 6 · Spiegel (0,4) rot 2 · Prisma (2,5) rot 6 · Spiegel (0,3) rot 2 ·
    //   Spiegel (3,4) rot 2 · Spiegel (4,3) rot 0 · Prisma (6,5) rot 1 · Spiegel (0,1) rot 2 ·
    //   Spiegel (1,0) rot 0 · Spiegel (5,2) rot 0 · Spiegel (6,3) rot 2
    // Generator sehr schwer-sammelstelle, Seed 51612, Ziel 96–112 · Ausbau „sehr schwer“
    name: 'Thuban', titel: 'Oortsche Wolke', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 3, z: 1, rot: 0 },
      { type: 'source', x: 2, z: 6, dir: 5, color: 'red' },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'cyan' },
      { type: 'target', x: 2, z: 0, color: 'yellow' },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'prism', x: 2, z: 5, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'source', x: 5, z: 6, dir: 5 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'prism', x: 6, z: 5, rot: 3 },
      { type: 'mirror', x: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'target', x: 6, z: 6, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'blue' },
    ],
    solution: { '3,1': 6, '0,4': 2, '2,5': 6, '0,3': 2, '3,4': 2, '4,3': 0, '6,5': 1, '0,1': 2, '1,0': 0, '5,2': 0, '6,3': 2 },
  },
  {
    // Lösung: Prisma (2,1) rot 6 · Spiegel (3,0) rot 0 · Spiegel (5,2) rot 2 · Spiegel (3,4) rot 2 ·
    //   Spiegel (4,2) rot 0 · Spiegel (4,6) rot 0 · Spiegel (1,3) rot 0 · Prisma (0,4) rot 2 ·
    //   Prisma (5,3) rot 3 · Spiegel (2,6) rot 0 · Spiegel (0,5) rot 1 · Spiegel (1,0) rot 0 ·
    //   Spiegel (0,1) rot 2
    // Generator sehr schwer, Seed 50514, Ziel 96–112 · Ausbau „sehr schwer“
    name: 'Hadar', titel: 'Firmament', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'prism', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'target', x: 2, z: 0, color: 'green' },
      { type: 'target', x: 5, z: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 3 },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'yellow' },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'prism', x: 0, z: 4, rot: 0 },
      { type: 'prism', x: 5, z: 3, rot: 1 },
      { type: 'target', x: 4, z: 4, color: 'yellow' },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 5, color: 'green' },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 0, z: 1, rot: 3 },
      { type: 'target', x: 1, z: 6, color: 'red' },
    ],
    solution: { '2,1': 6, '3,0': 0, '5,2': 2, '3,4': 2, '4,2': 0, '4,6': 0, '1,3': 0, '0,4': 2, '5,3': 3, '2,6': 0, '0,5': 1, '1,0': 0, '0,1': 2 },
  },
  {
    // Lösung: Prisma (6,2) rot 4 · Spiegel (6,1) rot 1 · Spiegel (3,3) rot 1 · Prisma (4,3) rot 2 ·
    //   Spiegel (4,5) rot 1 · Spiegel (5,5) rot 1 · Spiegel (5,6) rot 3 · Spiegel (3,4) rot 0 ·
    //   Spiegel (2,3) rot 0 · Spiegel (0,5) rot 2 · Prisma (0,3) rot 7 · Spiegel (1,3) rot 1 ·
    //   Spiegel (1,5) rot 1
    // Generator sehr schwer-sammelstelle, Seed 109, Ziel 96,52–110 · ersetzt Farbmühle (Austausch „sehr schwer“)
    name: 'Konjunktion', titel: 'Sternenmeer', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 6, z: 2, rot: 0 },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'red' },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'red' },
      { type: 'target', x: 0, z: 2, color: 'yellow' },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'prism', x: 4, z: 3, rot: 7 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'source', x: 3, z: 6, dir: 5 },
      { type: 'prism', x: 0, z: 3, rot: 3 },
      { type: 'target', x: 4, z: 6, color: 'cyan' },
      { type: 'target', x: 5, z: 4, color: 'red' },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'target', x: 1, z: 6, color: 'blue' },
    ],
    solution: { '6,2': 4, '6,1': 1, '3,3': 1, '4,3': 2, '4,5': 1, '5,5': 1, '5,6': 3, '3,4': 0, '2,3': 0, '0,5': 2, '0,3': 7, '1,3': 1, '1,5': 1 },
  },
  {
    // Lösung: Spiegel (1,1) rot 3 · Spiegel (5,0) rot 0 · Spiegel (4,3) rot 3 · Spiegel (6,2) rot 1 ·
    //   Prisma (6,3) rot 4 · Spiegel (4,4) rot 3 · Spiegel (1,4) rot 3 · Spiegel (1,5) rot 3 ·
    //   Spiegel (0,5) rot 1 · Spiegel (5,4) rot 2 · Spiegel (6,5) rot 2 · Spiegel (5,6) rot 0 ·
    //   Spiegel (2,6) rot 1 · Prisma (4,6) rot 0
    // Generator sehr schwer-mischziel, Seed 357, Ziel 90,33–90,41 · ersetzt Spiegelkabinett (Austausch „sehr schwer“)
    name: 'Weissabgleich', titel: 'Albatros', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0, color: 'green' },
      { type: 'source', x: 6, z: 1, dir: 5, color: 'red' },
      { type: 'mirror', x: 1, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'target', x: 4, z: 1, color: 'white' },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'prism', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'target', x: 0, z: 4, color: 'green' },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'prism', x: 4, z: 6, rot: 6 },
      { type: 'target', x: 4, z: 5, color: 'red' },
      { type: 'target', x: 6, z: 4, color: 'red' },
    ],
    solution: { '1,1': 3, '5,0': 0, '4,3': 3, '6,2': 1, '6,3': 4, '4,4': 3, '1,4': 3, '1,5': 3, '0,5': 1, '5,4': 2, '6,5': 2, '5,6': 0, '2,6': 1, '4,6': 0 },
  },
  {
    // Lösung: Spiegel (4,6) rot 1 · Spiegel (4,2) rot 1 · Spiegel (2,2) rot 1 · Spiegel (2,6) rot 3 ·
    //   Prisma (1,2) rot 7 · Spiegel (1,1) rot 1 · Prisma (4,1) rot 1 · Spiegel (6,1) rot 3 ·
    //   Spiegel (0,0) rot 3 · Spiegel (6,0) rot 1 · Spiegel (5,0) rot 3 · Spiegel (6,5) rot 3 ·
    //   Spiegel (1,3) rot 3 · Spiegel (6,4) rot 1
    // Generator sehr schwer-abzaehlen, Seed 170, Ziel 96,18–99,16 · ersetzt Farbenrausch (Austausch „sehr schwer“)
    name: 'Dreigestirn', titel: 'Nova', grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'target', x: 1, z: 6, color: 'cyan' },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 2, z: 1, color: 'magenta' },
      { type: 'prism', x: 1, z: 2, rot: 4 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 1, fixed: true },
      { type: 'prism', x: 4, z: 1, rot: 6 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 0, z: 0, rot: 0 },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'mirror', x: 6, z: 0, rot: 3 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 1, fixed: true },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'green' },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'target', x: 0, z: 4, color: 'red' },
    ],
    solution: { '4,6': 1, '4,2': 1, '2,2': 1, '2,6': 3, '1,2': 7, '1,1': 1, '4,1': 1, '6,1': 3, '0,0': 3, '6,0': 1, '5,0': 3, '6,5': 3, '1,3': 3, '6,4': 1 },
  },
  {
    // Lösung: Prisma (2,4) rot 1 · Spiegel (2,6) rot 3 · Spiegel (3,4) rot 1 · Spiegel (3,5) rot 1 ·
    //   Spiegel (5,5) rot 3 · Spiegel (1,2) rot 2 · Prisma (2,3) rot 3 · Spiegel (5,1) rot 3 ·
    //   Spiegel (0,3) rot 1 · Spiegel (0,1) rot 3 · Spiegel (5,0) rot 1 · Spiegel (6,1) rot 1 ·
    //   Prisma (6,5) rot 1 · Spiegel (4,0) rot 3
    // Generator sehr schwer-falle, Seed 534, Ziel 91,29–96,51 · ersetzt Zenit (Austausch „sehr schwer“)
    name: 'Azur', titel: 'Eisriese', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'source', x: 3, z: 0, dir: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'prism', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'source', x: 5, z: 6, dir: 7 },
      { type: 'prism', x: 6, z: 5, rot: 3 },
      { type: 'target', x: 6, z: 6, color: 'blue' },
      { type: 'target', x: 0, z: 5, color: 'green' },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'target', x: 4, z: 6, color: 'blue' },
    ],
    solution: { '2,4': 1, '2,6': 3, '3,4': 1, '3,5': 1, '5,5': 3, '1,2': 2, '2,3': 3, '5,1': 3, '0,3': 1, '0,1': 3, '5,0': 1, '6,1': 1, '6,5': 1, '4,0': 3 },
  },
  {
    // Lösung: Prisma (3,1) rot 0 · Spiegel (4,0) rot 0 · Prisma (4,5) rot 1 · Spiegel (1,0) rot 0 ·
    //   Spiegel (4,2) rot 2 · Spiegel (4,6) rot 1 · Spiegel (6,6) rot 3 · Spiegel (2,2) rot 1 ·
    //   Spiegel (0,2) rot 3 · Prisma (0,3) rot 2 · Spiegel (1,4) rot 0 · Prisma (4,3) rot 1
    // Generator sehr schwer, Seed 40862 · Ausbau „sehr schwer“
    name: 'Mirfak', titel: 'Südliches Kreuz', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'prism', x: 3, z: 1, rot: 7 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'source', x: 3, z: 6, dir: 7 },
      { type: 'prism', x: 4, z: 5, rot: 7 },
      { type: 'mirror', x: 5, z: 1, rot: 0, fixed: true },
      { type: 'target', x: 6, z: 0, color: 'magenta' },
      { type: 'target', x: 5, z: 5, color: 'magenta' },
      { type: 'source', x: 0, z: 1, dir: 7 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 2, fixed: true },
      { type: 'target', x: 4, z: 1, color: 'yellow' },
      { type: 'mirror', x: 6, z: 6, rot: 1 },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'prism', x: 0, z: 3, rot: 4 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'prism', x: 4, z: 3, rot: 7 },
      { type: 'target', x: 5, z: 3, color: 'red' },
    ],
    solution: { '3,1': 0, '4,0': 0, '4,5': 1, '1,0': 0, '4,2': 2, '4,6': 1, '6,6': 3, '2,2': 1, '0,2': 3, '0,3': 2, '1,4': 0, '4,3': 1 },
  },
  {
    // Lösung: Spiegel (3,1) rot 1 · Spiegel (3,4) rot 1 · Spiegel (1,4) rot 3 · Spiegel (1,1) rot 3 ·
    //   Spiegel (4,2) rot 3 · Spiegel (6,2) rot 1 · Spiegel (6,4) rot 3 · Spiegel (0,4) rot 1 ·
    //   Prisma (3,5) rot 7 · Spiegel (6,5) rot 1 · Spiegel (5,6) rot 1 · Spiegel (5,0) rot 1
    // Generator sehr schwer-abzaehlen, Seed 101, Ziel 90,55–96,17 · ersetzt Ereignishorizont (Austausch „sehr schwer“)
    name: 'Umlaufbahn', titel: 'Atoll', grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'yellow' },
      { type: 'target', x: 1, z: 6, color: 'red' },
      { type: 'target', x: 3, z: 0, color: 'white' },
      { type: 'target', x: 0, z: 1, color: 'magenta' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'prism', x: 3, z: 5, rot: 5 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
    ],
    solution: { '3,1': 1, '3,4': 1, '1,4': 3, '1,1': 3, '4,2': 3, '6,2': 1, '6,4': 3, '0,4': 1, '3,5': 7, '6,5': 1, '5,6': 1, '5,0': 1 },
  },
  {
    // Lösung: Prisma (2,1) rot 0 · Spiegel (0,3) rot 2 · Prisma (1,3) rot 1 · Spiegel (4,6) rot 0 ·
    //   Spiegel (5,5) rot 2 · Spiegel (4,4) rot 0 · Spiegel (1,5) rot 3 · Spiegel (0,5) rot 1 ·
    //   Prisma (4,2) rot 7 · Spiegel (5,2) rot 1 · Spiegel (5,4) rot 1
    // Generator sehr schwer-sammelstelle, Seed 42149 · Ausbau „sehr schwer“
    name: 'Mira', titel: 'Sternenstrom', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 2, z: 1, rot: 2 },
      { type: 'source', x: 3, z: 6, dir: 5, color: 'blue' },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'source', x: 1, z: 0, dir: 1, color: 'yellow' },
      { type: 'target', x: 4, z: 3, color: 'magenta' },
      { type: 'target', x: 6, z: 1, color: 'cyan' },
      { type: 'source', x: 4, z: 0, dir: 3 },
      { type: 'prism', x: 1, z: 3, rot: 7 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'target', x: 2, z: 6, color: 'green' },
      { type: 'mirror', x: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'prism', x: 4, z: 2, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'green' },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 4, color: 'blue' },
    ],
    solution: { '2,1': 0, '0,3': 2, '1,3': 1, '4,6': 0, '5,5': 2, '4,4': 0, '1,5': 3, '0,5': 1, '4,2': 7, '5,2': 1, '5,4': 1 },
  },
  {
    // Lösung: Prisma (2,0) rot 3 · Spiegel (0,2) rot 2 · Spiegel (4,5) rot 3 · Spiegel (6,5) rot 1 ·
    //   Prisma (6,6) rot 4 · Spiegel (5,6) rot 1 · Spiegel (5,2) rot 3 · Spiegel (4,4) rot 0 ·
    //   Spiegel (2,6) rot 0 · Spiegel (1,5) rot 0 · Spiegel (6,2) rot 1 · Prisma (1,2) rot 7 ·
    //   Spiegel (5,1) rot 1
    // Generator sehr schwer-sammelstelle, Seed 42541 · Ausbau „sehr schwer“
    name: 'Alpheratz', titel: 'Fixstern', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 2, z: 0, rot: 2 },
      { type: 'source', x: 6, z: 0, dir: 4, color: 'yellow' },
      { type: 'source', x: 6, z: 4, dir: 5, color: 'blue' },
      { type: 'target', x: 2, z: 4, color: 'yellow' },
      { type: 'target', x: 1, z: 0, color: 'magenta' },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'prism', x: 6, z: 6, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'target', x: 6, z: 3, color: 'green' },
      { type: 'source', x: 0, z: 3, dir: 7 },
      { type: 'prism', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 3 },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'target', x: 0, z: 6, color: 'blue' },
    ],
    solution: { '2,0': 3, '0,2': 2, '4,5': 3, '6,5': 1, '6,6': 4, '5,6': 1, '5,2': 3, '4,4': 0, '2,6': 0, '1,5': 0, '6,2': 1, '1,2': 7, '5,1': 1 },
  },
  {
    // Lösung: Prisma (3,1) rot 3 · Spiegel (4,2) rot 2 · Prisma (5,3) rot 5 · Spiegel (5,2) rot 3 ·
    //   Spiegel (6,2) rot 1 · Spiegel (6,5) rot 3 · Prisma (0,4) rot 6 · Spiegel (2,0) rot 3 ·
    //   Spiegel (3,6) rot 1 · Spiegel (0,1) rot 3 · Spiegel (2,5) rot 1
    // Generator sehr schwer-sammelstelle, Seed 50914, Ziel 96–112 · Ausbau „sehr schwer“
    name: 'Alkaid', titel: 'Sternhaufen', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 3, z: 1, rot: 0 },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'red' },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'cyan' },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'target', x: 3, z: 4, color: 'magenta' },
      { type: 'target', x: 1, z: 3, color: 'white' },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'prism', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 3 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 0, color: 'cyan' },
      { type: 'source', x: 2, z: 6, dir: 5 },
      { type: 'prism', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'target', x: 4, z: 4, color: 'green' },
    ],
    solution: { '3,1': 3, '4,2': 2, '5,3': 5, '5,2': 3, '6,2': 1, '6,5': 3, '0,4': 6, '2,0': 3, '3,6': 1, '0,1': 3, '2,5': 1 },
  },
  /* LEVELS:END */
];
/** Anzahl Tutorial-Level (sie stehen am Anfang von LEVELS). */
const TUTORIAL_COUNT = LEVELS.filter(l => l.tutorial).length;

/*
 * Führung im Dorf (Spec .scratch/tutorial-fuehrung/, Richtung C «Vorzeigen»): Eine Übung hat statt des Hinweises
 * höchstens SCHRITTE_MAX Schritte { text, bei, weiter, richtung?, trifft?, farbe? }. text: ein oder zwei kurze Sätze im
 * Du, Platzhalter je Gerät (SCHRITT_PLATZHALTER). bei: Zelle "x,z" des Elements (oder mehrere), auf dem der
 * Lichtkegel liegt; bei einem Handlungsschritt reagieren nur sie (Sperre, seit .scratch/tutorial-neu/). weiter: was
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
/** Platzhalter der Schritte in der Befehlsform: [Touch, Maus]. */
const SCHRITT_PLATZHALTER = { '{Tippe}': ['Tippe', 'Klicke'], '{Drücke lang}': ['Drücke lang', 'Rechtsklicke'] };
/** Text für das Gerät (touch: Finger, sonst Maus): Platzhalter der Schritte ersetzt. */
function geraeteText(text, touch) {
  let t = text;
  for (const [p, [finger, maus]] of Object.entries(SCHRITT_PLATZHALTER)) t = t.replaceAll(p, touch ? finger : maus);
  return t;
}
/**
 * Hinweise nebenbei: warten auf nichts, zählen nicht zu den Schritten, verschwinden bei der ersten Benutzung oder
 * spätestens mit dem Lösen und kommen beim Neustart derselben Übung nicht wieder. text: [Touch, Maus].
 */
const NEBENBEI = {
  kamera: { text: ['Wisch mit einem Finger, dann dreht sich die Ansicht. Mit zwei Fingern zoomst du.',
    'Zieh mit der Maus, dann dreht sich die Ansicht. Mit dem Mausrad zoomst du.'] },
  // ohne Ort: Der Knopf steht am Desktop unten rechts, auf dem Handy hochkant unten in der Reihe, quer rechts in der
  // Mitte (Ticket 02 von .scratch/tutorial-neu/; bisher «rechts am Rand», das passte hochkant nicht)
  neustart: { text: ['Tippst du auf den Kreispfeil, fängt die Übung von vorn an.',
    'Klickst du auf den Kreispfeil oder drückst R, fängt die Übung von vorn an.'] },
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
 * Würfel-Level: { name, dim: 3, size, height?, grad, hint?, elements: [{ type, x, y, z, axis?, dir?, rot?, color?, fixed? }],
 * solution: { "x,y,z": rot bzw. dir } }. y ist die Ebene (0 = unten), axis die Drehachse (Standard 'y', siehe AXES).
 * grad wie in LEVELS; entlang der Reihenfolge sinkt er nie. Seit Noas Geschichte liegen alle im Vorrat
 * (tools/vorrat.mjs). Getrennt von LEVELS, damit die Werkzeuge der Levelliste (tools/ordne-level.mjs) unberührt
 * bleiben. Reihenfolge und Grade zwischen WUERFEL:BEGIN und WUERFEL:END schreibt tools/ordne-wuerfel.mjs
 * (.scratch/wuerfel-500/).
 */
const LEVELS_3D = [
  /* WUERFEL:BEGIN */
  /* WUERFEL:END */
];

/**
 * Noas Geschichte (Spec .scratch/noa-geschichte/, «Daten»): je Grad die 6 Welten in der Reihenfolge der Kapitel
 * (STORY_CHAPTERS: Bergwald, Meer, Wüste, Vulkan, Planeten, Sterne), je mit den Schlüsseln (name) ihrer 10 Level in der
 * Reihenfolge des Durchgangs. Die Level stehen in LEVELS, mit dem Titel, den das Spiel zeigt (titel). Zwischen
 * GESCHICHTE:BEGIN und GESCHICHTE:END schreibt tools/geschichte.mjs spiel (aus tools/geschichte/wahl.json).
 */
const STORY_LEVELS = {
  /* GESCHICHTE:BEGIN */
  'leicht': [
    // Bergwald
    ['Wasserfarbe', 'Lichtblick', 'Umlenkung', 'Tönung', 'Rundgang', 'Taschenlampe', 'Farbsieb', 'Lichtpunkt', 'Kehre',
     'Gegenlicht'],
    // Meer
    ['Fingerzeig', 'Schneeflocke', 'Regenbogen', 'Kreidestrich', 'Papierflieger', 'Funke', 'Kerzenschein', 'Glimmer',
     'Wegmarke', 'Farbstift'],
    // Wüste
    ['Fächer', 'Farbklecks', 'Glanzpapier', 'Spiegelgasse', 'Grasgrün', 'Zwillinge', 'Fackel', 'Glanzpunkt',
     'Frühlicht', 'Gabelung'],
    // Vulkan
    ['Strahlteiler', 'Lichtschalter', 'Glühbirne', 'Fackellauf', 'Abzweigung', 'Schaukel', 'Hellblau', 'Brechpunkt',
     'Kurve', 'Kirschrot'],
    // Planeten
    ['Lichtfleck', 'Torbogen', 'Morgentau', 'Querschläger', 'Amethyst', 'Lichtkugel', 'Sternchen', 'Kreisel',
     'Fensterglas', 'Sonnenblume'],
    // Sterne
    ['Farbspiel', 'Rosenrot', 'Tautropfen', 'Schliff', 'Glasperle', 'Zusammenfluss', 'Fernlicht', 'Blitz', 'Lindgrün',
     'Rutschbahn'],
  ],
  'mittel': [
    // Bergwald
    ['Enzian', 'Bronze', 'Krokus', 'Weissglut', 'Dreiklang', 'Bachlauf', 'Titan', 'Europa', 'Lichtfeder', 'Malachit'],
    // Meer
    ['Meeresleuchten', 'Farbtafel', 'Spektrum', 'Granat', 'Brillenglas', 'Ganymed', 'Kobalt', 'Bergsee', 'Deimos',
     'Gipfelkreuz'],
    // Wüste
    ['Sonnenuhr', 'Mondstein', 'Brennpunkt', 'Spiegeltreppe', 'Farbton', 'Onyx', 'Silhouette', 'Lichtgitter',
     'Hängebrücke', 'Halbmond'],
    // Vulkan
    ['Lichtkreuz', 'Intarsie', 'Neumond', 'Aquamarin', 'Mondfinsternis', 'Seidenglanz', 'Merkur', 'Perlglanz',
     'Sternschnuppe', 'Sonate'],
    // Planeten
    ['Kaskade', 'Ranke', 'Abenddämmerung', 'Fernrohr', 'Rückspiegel', 'Mars', 'Lagune', 'Arabeske', 'Wechselspiel',
     'Kupferglanz'],
    // Sterne
    ['Silberstreif', 'Walzer', 'Regenschauer', 'Glasharfe', 'Laterna magica', 'Doppelstern', 'Gleichgewicht',
     'Farbverlauf', 'Kristall', 'Glasfaser'],
  ],
  'schwer': [
    // Bergwald
    ['Passstrasse', 'Irrgarten', 'Oase', 'Steinkreis', 'Observatorium', 'Wegweiser', 'Stabübergabe', 'Gipfelsturm',
     'Polarfahrt', 'Expedition'],
    // Meer
    ['Windjammer', 'Segeltörn', 'Weltreise', 'Dreimaster', 'Gambit', 'Kreuzfahrt', 'Steilwand', 'Gordischer Knoten',
     'Schatzkarte', 'Nordwand'],
    // Wüste
    ['Minotaurus', 'Kaperfahrt', 'Mäander', 'Pilgerweg', 'Biwak', 'Seekarte', 'Kompassnadel', 'Abkürzung',
     'Fata Morgana', 'Springergabel'],
    // Vulkan
    ['Planetarium', 'Rätselturm', 'Leuchtfeuer', 'Basislager', 'Zauberwürfel', 'Sphinx', 'Rosette', 'Seeschlange',
     'Spieluhr', 'Automaton'],
    // Planeten
    ['Puzzlestück', 'Taschenuhr', 'Räderwerk', 'Odyssee', 'Kopfnuss', 'Sanduhr', 'Ariadnefaden', 'Schatztruhe',
     'Denksport', 'Lotsenboot'],
    // Sterne
    ['Spiegelsaal', 'Maskerade', 'Jakobsweg', 'Zugbrücke', 'Gebirgspfad', 'Halo', 'Kalenderstein', 'Ankerplatz',
     'Hafeneinfahrt', 'Höhenweg'],
  ],
  'sehr schwer': [
    // Bergwald
    ['Kanopus', 'Sternenstaub', 'Fomalhaut', 'Kapella', 'Ankaa', 'Albireo', 'Lichtfächer', 'Dubhe', 'Diphda', 'Alioth'],
    // Meer
    ['Kastor', 'Aldebaran', 'Hamal', 'Sirius', 'Atair', 'Spiralnebel', 'Alhena', 'Lichtkegel', 'Umlaufbahn',
     'Weissabgleich'],
    // Wüste
    ['Morgenröte', 'Enif', 'Pollux', 'Kochab', 'Leitstern', 'Gravitation', 'Rigel', 'Menkar', 'Mintaka', 'Sadr'],
    // Vulkan
    ['Merak', 'Nunki', 'Mizar', 'Alkor', 'Izar', 'Prokyon', 'Saiph', 'Orion', 'Gezeitenkraft', 'Beteigeuze'],
    // Planeten
    ['Markab', 'Algol', 'Bellatrix', 'Azur', 'Achernar', 'Schedir', 'Alnilam', 'Megrez', 'Magellanwolke', 'Thuban'],
    // Sterne
    ['Hadar', 'Alphard', 'Wezen', 'Kassiopeia', 'Alpheratz', 'Dreigestirn', 'Konjunktion', 'Alkaid', 'Mirfak', 'Mira'],
  ],
  /* GESCHICHTE:END */
};

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
  SCHRITT_WEITER, SCHRITT_PLATZHALTER, geraeteText, NEBENBEI, schrittZellen, zelleVon, schrittGeste, strahlTrifft,
  lichtBei, schrittErfuellt, schrittErlaubt, LEVELS_3D, STORY_LEVELS, RUHE_NACH_MS, RUHE_MIN_FPS, RUHE_FPS,
  ruhetaktAus, ruhtJetzt, bildrate, bildrateGrund,
};
