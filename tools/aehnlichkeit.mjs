// Ähnlichkeit zweier Level (Ausbau auf 500 Level, .scratch/500-level/ Ticket 01): Mit 500 Leveln auf dem Feld 7 × 7
// liefert der Generator leicht ein Level, das wie ein anderes aussieht, nur gespiegelt oder gedreht. Gemessen wird die
// Anordnung, nicht die Stellung der Elemente: Jedes Element zählt mit Art, Farbe (Quelle, Ziel, Filter), fest oder
// drehbar und seiner Zelle. Die Ähnlichkeit ist der Jaccard-Index dieser Mengen (gemeinsame durch alle Elemente), das
// Höchste über die acht Symmetrien des quadratischen Felds (vier Drehungen, jeweils gespiegelt). Die Richtung einer
// Quelle, die Drehung eines Spiegels oder Prismas und die Lösung zählen nicht: Ein Level mit denselben Elementen auf
// denselben Zellen ist für den Spieler dasselbe Rätsel, wie auch immer die Startstellung ist.
// Grenze (AEHNLICH_AB), gemessen an den 159 Leveln im Spiel (Tutorial und 150) am 20.10.2026: Die drei ähnlichsten
// Paare sind Fast-Doppel, dasselbe Feld mit wenigen anderen Elementen (Dreiklang – Delta 0,79, Karussell – Rundflug
// 0,76, Fokus – Türkis 0,59). Danach folgen verschiedene Rätsel mit ähnlichem Gerüst (Farbchor – Doppelstern 0,45,
// Erstes Licht – Winkelzug 0,43) und ab 0,30 abwärts nichts Auffälliges. Die Grenze liegt in der Lücke zwischen 0,45
// und 0,59. Ab ihr ist ein neues Level zu ähnlich, gegen ein Level im Spiel und gegen einen anderen Kandidaten
// derselben Wahl; die drei Paare im Spiel bleiben, bis über sie entschieden ist.
// Würfel-Level (.scratch/wuerfel-500/ Ticket 01) vergleicht es nur untereinander, über die 48 Symmetrien des Würfels
// (sechs Vertauschungen der Achsen, jede mit acht Spiegelungen). Auch die senkrechten Spiegelungen zählen, obwohl unten
// die Plattform liegt: Ein Strahl endet dort wie an der Oberkante, ein auf den Kopf gestelltes Rätsel ist dasselbe. Bei
// Spiegel, Prisma und Kombinator zählt die Drehachse zur Art (sie legt fest, wohin das Element lenken kann) und dreht
// mit; bei Quelle, Ziel, Filter und Block nicht, so wie die Richtung einer Quelle nicht zählt. Grenze wie im flachen
// Feld, gemessen siehe Kommentar zu AEHNLICH_AB. Im flacheren Quader (height, .scratch/wuerfel-7x7x5/) bleiben die 16
// Symmetrien, die die Achse y auf y lassen: die acht der Grundfläche, je auch auf den Kopf gestellt (wie oben). Ein
// Würfel und ein Quader sind nie ähnlich.
// Aufruf: node tools/aehnlichkeit.mjs   (Bericht: die ähnlichsten Paare unter allen Leveln aus Spiel und Vorrat, über
//         den gemeinsamen Lader lader.mjs, flach und im Würfel)
import { pathToFileURL } from 'node:url';

/** Ab dieser Ähnlichkeit (Jaccard-Index 0–1, auf zwei Stellen gerundet) ist ein neues Level zu ähnlich. */
export const AEHNLICH_AB = 0.5;

/** Grösste Koordinate im flachen Feld 7 × 7 (die Zellen laufen von 0 bis N). */
const N = 6;
/** Die acht Symmetrien des quadratischen Felds als Abbildung einer Zelle. */
const SYMMETRIEN = [
  (x, z) => [x, z], (x, z) => [N - z, x], (x, z) => [N - x, N - z], (x, z) => [z, N - x],
  (x, z) => [N - x, z], (x, z) => [z, x], (x, z) => [x, N - z], (x, z) => [N - z, N - x],
];

/** Die drei Achsen des Würfels in der Reihenfolge der Koordinaten [x, y, z]. */
const ACHSEN = ['x', 'y', 'z'];
/**
 * Die Symmetrien des Würfels mit Grundfläche n × n und h Ebenen, je (Zelle [x, y, z], Achse) → [Zelle, Achse]:
 * Koordinate i des Bilds ist Koordinate perm[i] des Urbilds, gespiegelt, wenn Bit i von flip gesetzt ist; die Achse
 * perm[i] wird zu i. Im Würfel (h = n) alle 48, im flacheren Quader nur die 16, die y auf y lassen.
 */
const wuerfelSymmetrien = (n, h) => [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]
  .filter(perm => h === n || perm[1] === 1).flatMap(perm =>
    Array.from({ length: 8 }, (_, flip) => (c, achse) => [
      perm.map((k, i) => (flip >> i & 1 ? (i === 1 ? h : n) - 1 - c[k] : c[k])), ACHSEN[perm.indexOf(ACHSEN.indexOf(achse))],
    ]));
/** Zahl der Ebenen eines Würfel-Levels (ohne height ein Würfel). */
const hoeheVon = (level) => level.height || level.size;
const WUERFEL_SYMMETRIEN = new Map();

/** Elemente, deren Drehachse im Würfel zur Art zählt. */
const MIT_ACHSE = ['mirror', 'prism', 'combiner'];

/** Art eines Elements ohne Stellung: Typ, Farbe bei Quelle, Ziel und Filter, fest oder drehbar; achse im Würfel. */
const art = (e, achse) => [e.type, ['source', 'target', 'filter'].includes(e.type) ? e.color ?? 'white' : '',
  e.fixed ? 'fest' : '', ...(achse && MIT_ACHSE.includes(e.type) ? [achse] : [])].join(':');

/** Die Elemente eines Levels als Menge von Texten „Art@x,z“ (im Würfel „Art@x,y,z“), nach der Symmetrie s. */
const menge = (level, s = symmetrien(level)[0]) => new Set(level.elements.map((e) => {
  if (level.dim !== 3) {
    const [x, z] = s(e.x, e.z);
    return `${art(e)}@${x},${z}`;
  }
  const [c, achse] = s([e.x, e.y, e.z], e.axis || 'y');
  return `${art(e, achse)}@${c.join(',')}`;
}));

/** Die Symmetrien des Felds eines Levels: acht im flachen Feld, im Würfel 48 oder 16 (je Grösse einmal gebaut). */
function symmetrien(level) {
  if (level.dim !== 3) return SYMMETRIEN;
  const k = `${level.size}×${hoeheVon(level)}`;
  if (!WUERFEL_SYMMETRIEN.has(k)) WUERFEL_SYMMETRIEN.set(k, wuerfelSymmetrien(level.size, hoeheVon(level)));
  return WUERFEL_SYMMETRIEN.get(k);
}

/**
 * Ähnlichkeit zweier Level (0–1, siehe Kopf), auf zwei Stellen gerundet. Ein flaches Level und ein Würfel-Level, oder
 * zwei Würfel verschiedener Grösse, sind nie ähnlich (0).
 */
export function aehnlichkeit(a, b) {
  if ((a.dim === 3) !== (b.dim === 3) || (a.dim === 3 && (a.size !== b.size || hoeheVon(a) !== hoeheVon(b)))) return 0;
  const mb = menge(b);
  let best = 0;
  for (const s of symmetrien(a)) {
    const ma = menge(a, s), gemeinsam = [...ma].filter(t => mb.has(t)).length;
    best = Math.max(best, gemeinsam / (ma.size + mb.size - gemeinsam));
  }
  return Math.round(best * 100) / 100;
}

/** Ist das Level einem der anderen zu ähnlich? Rückgabe: das ähnlichste andere als { level, wert } oder null. */
export function zuAehnlich(level, andere) {
  let best = null;
  for (const b of andere) {
    if (b === level) continue;
    const wert = aehnlichkeit(level, b);
    if (wert >= AEHNLICH_AB && (!best || wert > best.wert)) best = { level: b, wert };
  }
  return best;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { ALLE } = await import('./lader.mjs');
  for (const [titel, levels] of [['Flach:', ALLE.LEVELS], ['Würfel:', ALLE.LEVELS_3D]]) bericht(titel, levels);
}

/** Die ähnlichsten Paare unter den Leveln. */
function bericht(titel, levels) {
  const paare = [];
  for (let i = 0; i < levels.length; i++) {
    for (let j = i + 1; j < levels.length; j++) {
      paare.push({ a: levels[i].name, b: levels[j].name, wert: aehnlichkeit(levels[i], levels[j]) });
    }
  }
  paare.sort((x, y) => y.wert - x.wert);
  const zahl = (x) => x.toFixed(2).replace('.', ',');
  console.log(`${titel} ${levels.length} Level, ${paare.length} Paare; Grenze ${zahl(AEHNLICH_AB)}`);
  console.log(`Ab der Grenze: ${paare.filter(p => p.wert >= AEHNLICH_AB).length} Paare`);
  for (const p of paare.slice(0, 15)) console.log(`  ${zahl(p.wert)}  ${p.a} – ${p.b}`);
  const stufen = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
  console.log(`Paare ab … : ${stufen.map(s => `${zahl(s)} ${paare.filter(p => p.wert >= s).length}`).join(', ')}`);
}
