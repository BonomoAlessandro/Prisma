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
// Aufruf: node tools/aehnlichkeit.mjs   (Bericht: die ähnlichsten Paare unter den Leveln im Spiel)
import { pathToFileURL } from 'node:url';
import { L } from './solver.mjs';

/** Ab dieser Ähnlichkeit (Jaccard-Index 0–1, auf zwei Stellen gerundet) ist ein neues Level zu ähnlich. */
export const AEHNLICH_AB = 0.5;

/** Grösste Koordinate im flachen Feld 7 × 7 (die Zellen laufen von 0 bis N). */
const N = 6;
/** Die acht Symmetrien des quadratischen Felds als Abbildung einer Zelle. */
const SYMMETRIEN = [
  (x, z) => [x, z], (x, z) => [N - z, x], (x, z) => [N - x, N - z], (x, z) => [z, N - x],
  (x, z) => [N - x, z], (x, z) => [z, x], (x, z) => [x, N - z], (x, z) => [N - z, N - x],
];

/** Art eines Elements ohne Stellung: Typ, Farbe bei Quelle, Ziel und Filter, fest oder drehbar. */
const art = (e) => [e.type, ['source', 'target', 'filter'].includes(e.type) ? e.color ?? 'white' : '',
  e.fixed ? 'fest' : ''].join(':');

/** Die Elemente eines Levels als Menge von Texten „Art@x,z“, nach der Symmetrie s. */
const menge = (level, s = SYMMETRIEN[0]) => new Set(level.elements.map((e) => {
  const [x, z] = s(e.x, e.z);
  return `${art(e)}@${x},${z}`;
}));

/** Ähnlichkeit zweier Level (0–1, siehe Kopf), auf zwei Stellen gerundet. */
export function aehnlichkeit(a, b) {
  const mb = menge(b);
  let best = 0;
  for (const s of SYMMETRIEN) {
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
  const paare = [];
  for (let i = 0; i < L.LEVELS.length; i++) {
    for (let j = i + 1; j < L.LEVELS.length; j++) {
      paare.push({ a: L.LEVELS[i].name, b: L.LEVELS[j].name, wert: aehnlichkeit(L.LEVELS[i], L.LEVELS[j]) });
    }
  }
  paare.sort((x, y) => y.wert - x.wert);
  const zahl = (x) => x.toFixed(2).replace('.', ',');
  console.log(`${L.LEVELS.length} Level, ${paare.length} Paare; Grenze ${zahl(AEHNLICH_AB)}`);
  console.log(`Ab der Grenze: ${paare.filter(p => p.wert >= AEHNLICH_AB).length} Paare`);
  for (const p of paare.slice(0, 15)) console.log(`  ${zahl(p.wert)}  ${p.a} – ${p.b}`);
  const stufen = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
  console.log(`Paare ab … : ${stufen.map(s => `${zahl(s)} ${paare.filter(p => p.wert >= s).length}`).join(', ')}`);
}
