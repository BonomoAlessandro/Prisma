// Noas Geschichte als Spielablauf (Spec .scratch/noa-geschichte/, «Wahl der 240 Level» und «Namen der Welten»;
// Ticket 03): Je Grad wählt es die 60 Level der Geschichte, verteilt sie auf die 6 Welten zu je 10 und gibt jedem
// einen Titel. Das Ergebnis steht in tools/geschichte/wahl.json, die Titel in tools/geschichte/titel.json (von Hand
// gepflegt). Das Spiel liest beides erst ab Ticket 04.
// - Pool je Grad: die flachen Level des Grads aus Spiel und Vorrat (ALLE im Lader, ohne Tutorial), für «sehr schwer»
//   dazu die 15 aus sehr-schwer-neu.json (unter ihrem Schlüssel name; die KI-Tester kennen sie als Kandidat).
// - Abgelehnt (kommt nicht in Frage; Auslegung von «kein von beiden abgelehntes Level», bestätigt als Entscheid des
//   Nutzers vom 29.10.2026: ausgeschlossen, wenn die KI-Tester oder die Beurteilung ablehnen):
//   - von den KI-Testern: In einem Urteil nennen beide einen Begriff aus «Was Spass verdirbt», der beim heutigen Grad
//     des Levels gilt (Regel von merge in ki-tester/protocol.mjs, neu gerechnet mit dem heutigen Grad). Gezählt wird
//     jedes flache Urteil zum Level, unter seinem Namen oder als Kandidat (kandidatName), auch als Anker und aus
//     Ablauf 1, wie bei der Regel stark der Levelliste. Ein fehlendes Urteil ist keine Ablehnung.
//   - von der Beurteilung: ein Ausschlussgrund, oder ab «mittel» ein Spielwert unter MINDEST_SPIELWERT (so kommt ein
//     Level nach spielwert.mjs nicht ins Spiel). In «leicht» gibt es keinen Mindest-Spielwert. Das trifft auch die
//     Level, die nach dem Urteil der KI-Tester im Spiel behalten wurden (behalten in levelliste.json); sie kommen nicht
//     in die Geschichte.
// - Bewertung (bewertung): zuerst das Gefühl im Mittel über alle Urteile beider KI-Tester, dann der Anteil der Urteile
//   mit Aha-Moment, dann der Spielwert (wie bei der Wahl der 15 neuen, Ticket 01). Ohne Urteil stützt sie sich auf den
//   Spielwert: Gefühl und Aha sind dann das Mittel der SCHAETZEN_AUS beurteilten Level desselben Grads mit dem
//   nächsten Spielwert (geschaetzt im Ergebnis).
// - Schwierigkeit: Die 60 eines Grads verteilen sich über seinen ganzen Bereich. Der Pool, nach Schwierigkeit geordnet,
//   wird in sechs Abschnitte geteilt (Sechstel), je Welt einer, von unten nach oben; jede Welt wählt ihre 10 aus ihrem
//   Abschnitt. So bekommt Welt w nach Schwierigkeit die Ränge 10·w … 10·w+9 der 60 (ausser «sehr schwer», unten).
//   Bekommt eine Welt aus ihrem Abschnitt keine 10, die die Vielfalt erfüllen, rückt eine Grenze um so wenige Level wie
//   nötig (Abweichung im Ergebnis): zuerst die obere in den nächsten Abschnitt, in der letzten Welt die untere (die
//   Welt davor wählt dann neu). Innerhalb der Welt stehen die Level nach ihrem Rang, um höchstens VERTAUSCHUNG Plätze
//   vertauscht.
// - Vielfalt vor Bewertung: Dieselbe Haupt-Kernidee kommt in jedem Fenster von FENSTER aufeinanderfolgenden Leveln des
//   Grads höchstens HOECHSTENS-mal vor, auch über die Grenzen der Welten (Level ohne Haupt-Kernidee zählen nicht, wie
//   in der Levelliste), und keine zwei der 240 sind einander zu ähnlich (aehnlichkeit.mjs, ab AEHNLICH_AB). Eine Welt
//   nimmt ihre Level nach der Bewertung; übergangen wird ein Level, dessen Haupt-Kernidee schon zweimal in der Welt
//   steht oder das einem gewählten zu ähnlich ist. Lassen sich die 10 dann nicht so anordnen, dass die Fenster über
//   die Grenze zur vorigen Welt stimmen, nimmt sie unter allen Mengen, die sich anordnen lassen, die mit der kleinsten
//   Summe der Ränge in der Bewertung (besteMenge; so gehen die nächstbesten Level vor). Das ist oft nötig: Haben zwei
//   Welten nacheinander je zweimal fünf Haupt-Kernideen, muss die zweite die Folge der Haupt-Kernideen der ersten
//   Platz für Platz wiederholen. Wo die Vielfalt so die Bewertung überstimmt, nennt das Ergebnis je Level, statt
//   welchem es kam und warum.
// - Anordnung: Unter allen Anordnungen, die die Regeln erfüllen, die mit den wenigsten Vertauschungen (kleinste Summe
//   der Abstände von Platz und Rang über den Grad), bei Gleichstand je Welt die erste in der Reihenfolge der Ränge.
// - «sehr schwer» (Entscheid des Nutzers vom 29.10.2026, UEBER_GRENZEN): Der Pool ist genau 60, es gibt keine Wahl,
//   und schon in den Sechsteln steht eine Haupt-Kernidee drei- oder viermal; mit den Rängen je Welt geht die Vielfalt
//   darum nicht auf. Nur in diesem Grad steht ein Level statt dessen höchstens 3 Plätze von seinem Rang im Grad (1–60),
//   auch über eine Weltgrenze (Welt w hat dann nicht genau die Ränge 10·w … 10·w+9), und die Vielfalt soll ganz
//   aufgehen. Unter den Anordnungen, die das erfüllen, die mit der kleinsten Summe der Verschiebungen, dann den
//   wenigsten verschobenen Leveln, dann die erste nach Rang (ordneUeberGrenzen). Geht es auch so nicht ganz auf (heute
//   so: mit je 12 von fünf Haupt-Kernideen müsste die Folge streng im Takt von 10 laufen, und die Schwierigkeit häuft
//   etwa viermal Falle unter den zehn schwersten; es geht auch mit 7 Plätzen nicht, gerechnet), wird nicht weiter
//   gelockert: die Anordnung mit höchstens 3 Plätzen, die das kleinste Zuviel hat (Summe über alle Fenster, wie oft
//   eine Haupt-Kernidee mehr als HOECHSTENS-mal vorkommt), dann wie oben. Die Verstösse stehen im Ergebnis
//   (verstoesse) und im Bericht. Bei mehr als 60 im Pool wählte es wie in den übrigen Graden (das hält die Regel
//   ohnehin ein).
// - Geht die Vielfalt in einem anderen Grad gar nicht auf (keine Wahl, und keine Grenze lässt sich verschieben), wird
//   ebenso nichts gelockert: Ränge und Vertauschungen wie oben, und die Anordnung mit dem kleinsten Zuviel, bei
//   Gleichstand mit den wenigsten Vertauschungen (ohneVielfalt). Heute kommt das nicht vor.
// - Titel (titel.json): je Welt und Grad 10, in der Reihenfolge der Plätze; der Titel auf Platz k gehört dem Level auf
//   Platz k. Eindeutig über alle Titel und alle Namen in Spiel, Vorrat und der 15 neuen (Gross- und Kleinschreibung
//   egal), keiner von der Liste entfernter Level, ein oder zwei Wörter, «ss» statt «ß» (titelFehler).
// Aufruf: LEISE_CPU=50 sh tools/leise.sh node tools/geschichte.mjs wahl [--trocken]   (etwa 30 s; --trocken: nur der
//           Bericht, ohne wahl.json zu schreiben)
//         node tools/geschichte.mjs titel   (nach einer Änderung in titel.json: ordnet die Titel neu zu, ohne neue
//           Wahl)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { ALLE } from './lader.mjs';
import { GRADE } from './beurteilung/index.mjs';
import { MINDEST_SPIELWERT } from './beurteilung/spielwert.mjs';
import { kandidatName } from './leveldaten.mjs';
import { AEHNLICH_AB, aehnlichkeit } from './aehnlichkeit.mjs';
import { HAUPT_KERNIDEE_JE_10, alleUrteile, ladeLevelliste } from './levelliste.mjs';
import { TESTERS, merge } from './ki-tester/protocol.mjs';

/** Die Welten der Geschichte in ihrer Reihenfolge (die Kapitel in STORY_CHAPTERS, index.html). */
export const WELTEN = ['Bergwald', 'Meer', 'Wüste', 'Vulkan', 'Planeten', 'Sterne'];
/** So viele Level je Welt und Grad. */
export const JE_WELT = 10;
/** So viele Level je Grad. */
export const JE_GRAD = WELTEN.length * JE_WELT;
/** Innerhalb einer Welt steht ein Level höchstens so viele Plätze von seinem Rang nach Schwierigkeit. */
export const VERTAUSCHUNG = 2;
/**
 * Grade, in denen ein Level statt dessen höchstens so viele Plätze von seinem Rang im Grad (1–60) steht, auch über eine
 * Weltgrenze (Entscheid des Nutzers vom 29.10.2026: «sehr schwer», weil dort die Vielfalt mit den Rängen je Welt nicht
 * aufgeht).
 */
export const UEBER_GRENZEN = { 'sehr schwer': 3 };
/** Je so viele aufeinanderfolgende Level eines Grads … */
export const FENSTER = 10;
/** … kommt dieselbe Haupt-Kernidee höchstens so oft vor (wie in der Levelliste). */
export const HOECHSTENS = HAUPT_KERNIDEE_JE_10;
/** Ohne Urteil der KI-Tester: Gefühl und Aha aus so vielen beurteilten Leveln mit dem nächsten Spielwert. */
export const SCHAETZEN_AUS = 10;

export const DATEIEN = {
  neu: new URL('./geschichte/sehr-schwer-neu.json', import.meta.url),
  wahl: new URL('./geschichte/wahl.json', import.meta.url),
  titel: new URL('./geschichte/titel.json', import.meta.url),
};

const mittel = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const nachName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
/** Nach Schwierigkeit, bei gleichem Wert nach Namen: die Reihenfolge der Ränge. */
export const nachSchwierigkeit = (a, b) => a.schwierigkeit - b.schwierigkeit || nachName(a, b);
/** Nach Bewertung, die beste zuerst (siehe Kopf), bei Gleichstand nach Namen. */
export const nachBewertung = (a, b) => b.bewertung.gefuehl - a.bewertung.gefuehl || b.bewertung.aha - a.bewertung.aha
  || b.spielwert - a.spielwert || nachName(a, b);

// ---------------------------------------------------------------------------------------------------------------
// Pool, Urteile, Ablehnung, Bewertung

/** Die 15 neuen sehr schweren Level aus sehr-schwer-neu.json: je { level (mit Schlüssel name), kandidat }. */
export function neueLevel(datei = DATEIEN.neu) {
  return JSON.parse(readFileSync(datei, 'utf8')).level.map(e => ({ level: e.level, kandidat: e.kandidat }));
}

/**
 * Der Pool aller Grade (siehe Kopf), je { name, level, grad, kandidat (Name bei den KI-Testern, falls anders), neu }.
 * Ein Level ohne Schlüssel oder mit einem Namen, den es schon gibt, bricht ab.
 */
export function poolLevel(neue = neueLevel()) {
  const main = ALLE.LEVELS.slice(ALLE.TUTORIAL_COUNT).map(level => ({ name: level.name, level, grad: level.grad,
    kandidat: null, neu: false }));
  const dazu = neue.map(n => ({ name: n.level.name, level: n.level, grad: n.level.grad, kandidat: n.kandidat,
    neu: true }));
  const namen = [...ALLE.LEVELS, ...ALLE.LEVELS_3D].map(l => l.name);
  for (const p of dazu) {
    if (!p.name) throw new Error(`sehr-schwer-neu.json: ${p.kandidat} ohne Schlüssel (name)`);
    if (namen.includes(p.name)) throw new Error(`sehr-schwer-neu.json: ${p.name} gibt es schon in Spiel oder Vorrat`);
    if (p.grad !== GRADE[3]) throw new Error(`sehr-schwer-neu.json: ${p.name} hat den Grad ${p.grad}`);
  }
  return [...main, ...dazu];
}

/** Die flachen Urteile zu einem Level: unter seinem Namen oder als Kandidat (eintraege: alleUrteile). */
export const urteileZu = (p, eintraege) => {
  const kandidaten = new Set([kandidatName(p.level), p.kandidat].filter(Boolean));
  return eintraege.filter(e => e.level.name === p.name || kandidaten.has(e.level.name));
};

/** Gefühl und Aha im Mittel über alle Urteile beider KI-Tester, mit Zahl und Läufen der Urteile; ohne Urteil null. */
export function urteilAus(eintraege) {
  const je = eintraege.flatMap(e => TESTERS.map(t => e.urteile[t]));
  if (!je.length) return null;
  return { gefuehl: mittel(je.map(u => u.gefuehl)), aha: mittel(je.map(u => (u.aha.ja ? 1 : 0))),
    urteile: eintraege.length, laeufe: [...new Set(eintraege.map(e => e.lauf))] };
}

/**
 * Warum ein Level abgelehnt ist (siehe Kopf), als Text, sonst null. p: { grad, spielwert, ausschluesse, eintraege }.
 */
export function ablehnung(p) {
  for (const e of p.eintraege) {
    const r = merge({ level: e.level, referenz: { ...e.referenz, grad: p.grad }, anker: e.anker, urteile: e.urteile });
    if (r.ergebnis.abgelehnt) return `von beiden KI-Testern abgelehnt (${e.lauf}: ${r.ergebnis.gruende.join(', ')})`;
  }
  if (p.ausschluesse.length) return `Ausschlussgrund (${p.ausschluesse.join(', ')})`;
  if (p.grad !== GRADE[0] && p.spielwert < MINDEST_SPIELWERT) {
    return `Spielwert ${p.spielwert.toFixed(1)} unter dem Mindest-Spielwert ${MINDEST_SPIELWERT}`;
  }
  return null;
}

/**
 * Die Bewertung je Level (siehe Kopf): aus dem eigenen Urteil oder, ohne Urteil, geschätzt aus den SCHAETZEN_AUS
 * beurteilten Leveln desselben Grads mit dem nächsten Spielwert. levels: je { name, grad, spielwert, urteil }.
 * Rückgabe je Level { gefuehl, aha, geschaetzt, urteile, laeufe }.
 */
export function bewertungen(levels) {
  return levels.map((p) => {
    if (p.urteil) return { gefuehl: p.urteil.gefuehl, aha: p.urteil.aha, geschaetzt: false, urteile: p.urteil.urteile,
      laeufe: p.urteil.laeufe };
    const nah = levels.filter(q => q.grad === p.grad && q.urteil)
      .sort((a, b) => Math.abs(a.spielwert - p.spielwert) - Math.abs(b.spielwert - p.spielwert) || nachName(a, b))
      .slice(0, SCHAETZEN_AUS);
    if (!nah.length) return { gefuehl: 0, aha: 0, geschaetzt: true, urteile: 0, laeufe: [] };
    return { gefuehl: mittel(nah.map(q => q.urteil.gefuehl)), aha: mittel(nah.map(q => q.urteil.aha)), geschaetzt: true,
      urteile: 0, laeufe: [], aus: nah.map(q => q.name) };
  });
}

/**
 * Beurteilt den Pool (auf mehreren Threads) und bewertet ihn: je Level dazu schwierigkeit, spielwert, haupt
 * (Haupt-Kernidee oder null), ausschluesse, eintraege (Urteile), urteil, bewertung und abgelehnt (Text oder null).
 */
export async function bewerte(pool = poolLevel(), eintraege = alleUrteile()) {
  const { beurteileAlle } = await import('./beurteilung/parallel.mjs');
  const b = await beurteileAlle(pool.map(p => ({ level: p.level, opts: { grad: p.grad, teuer: true } })));
  const levels = pool.map((p, i) => {
    const u = urteileZu(p, eintraege);
    return { ...p, schwierigkeit: b[i].schwierigkeit.wert, spielwert: b[i].spielwert.wert,
      haupt: b[i].hauptKernidee.begriff, ausschluesse: b[i].ausschluesse.map(a => a.begriff), eintraege: u,
      urteil: urteilAus(u) };
  });
  const bw = bewertungen(levels);
  return levels.map((p, i) => ({ ...p, bewertung: bw[i], abgelehnt: ablehnung(p) }));
}

// ---------------------------------------------------------------------------------------------------------------
// Vielfalt über die Grenzen der Welten
//
// Ein Zustand an der Grenze zweier Welten sagt je Haupt-Kernidee, ab welchem Platz der nächsten Welt (0–9) ihr erstes
// und ihr zweites Vorkommen dort stehen dürfen, damit kein Fenster über die Grenze sie mehr als HOECHSTENS-mal hat.
// Stand sie in der Welt davor auf den Plätzen p1 < p2, darf ihr erstes Vorkommen nicht vor p1 und ihr zweites nicht vor
// p2 stehen (das Fenster ab p1 reicht bis p1 + 9 der nächsten Welt); stand sie einmal auf p, darf ihr zweites nicht vor
// p stehen. Ältere Welten liegen weiter als ein Fenster zurück. (Gilt für HOECHSTENS = 2.)

const ZUSTAND_LEER = new Map();
/** Der Zustand nach einer Welt in der Anordnung welt (Level nach Platz). */
export function zustandNach(welt) {
  const plaetze = new Map();
  welt.forEach((l, j) => { if (l.haupt) plaetze.set(l.haupt, [...(plaetze.get(l.haupt) ?? []), j]); });
  return new Map([...plaetze].map(([x, p]) => [x, p.length >= 2 ? [p.at(-2), p.at(-1)] : [0, p[0]]]));
}
const zustandText = (z) => [...z].sort(([a], [b]) => (a < b ? -1 : 1)).map(([x, [u, v]]) => `${x}:${u},${v}`).join('|');
/** Lässt Zustand a der nächsten Welt höchstens so viel Raum wie b? (a ist dann nicht nötig, b genügt.) */
const engerAls = (a, b) => [...new Set([...a.keys(), ...b.keys()])].every((x) => {
  const [u, v] = a.get(x) ?? [0, 0], [s, t] = b.get(x) ?? [0, 0];
  return u >= s && v >= t;
});
/** Nur die Zustände, die nicht enger sind als ein anderer (je Text einmal). */
function weiteste(zustaende) {
  const je = new Map(zustaende.map(z => [zustandText(z), z]));
  const alle = [...je.values()];
  return alle.filter((a, i) => !alle.some((b, j) => j !== i && engerAls(a, b) && !(engerAls(b, a) && j > i)));
}

/**
 * Die Anordnungen einer Welt (welt: ihre Level nach Rang), die vom Zustand z aus die Vielfalt erfüllen, je als Liste
 * der Ränge nach Platz, in der Reihenfolge der Ränge (die erste ist die nächste an der Reihenfolge nach Schwierigkeit).
 * Jedes Level steht höchstens VERTAUSCHUNG Plätze von seinem Rang; in der Welt kommt jede Haupt-Kernidee höchstens
 * HOECHSTENS-mal vor (die Welt ist selbst ein Fenster). alle: false hält bei der ersten an.
 */
export function anordnungen(welt, z = ZUSTAND_LEER, { alle = true } = {}) {
  const n = welt.length, frei = new Array(n).fill(true), folge = [], aus = [], schon = new Map();
  const rec = (j) => {
    if (j === n) { aus.push([...folge]); return !alle; }
    const muss = j - VERTAUSCHUNG >= 0 && frei[j - VERTAUSCHUNG];
    for (let i = muss ? j - VERTAUSCHUNG : Math.max(0, j - VERTAUSCHUNG); i <= Math.min(n - 1, j + VERTAUSCHUNG); i++) {
      if (!frei[i]) continue;
      const x = welt[i].haupt, k = x ? (schon.get(x) ?? 0) : 0;
      if (x && (k >= HOECHSTENS || j < (z.get(x) ?? [0, 0])[k])) {
        if (muss) break;
        continue;
      }
      frei[i] = false; folge.push(i); if (x) schon.set(x, k + 1);
      const fertig = rec(j + 1);
      frei[i] = true; folge.pop(); if (x) schon.set(x, k);
      if (fertig) return true;
      if (muss) break;
    }
    return false;
  };
  rec(0);
  return aus;
}

/** Die Zustände nach der Welt welt (nach Rang), von einem der Zustände zs aus erreichbar; leer: geht nicht. */
export function zustaendeNach(welt, zs) {
  return weiteste(zs.flatMap(z => anordnungen(welt, z).map(r => zustandNach(r.map(i => welt[i])))));
}
const gehtVon = (welt, zs) => zs.some(z => anordnungen(welt, z, { alle: false }).length > 0);

// ---------------------------------------------------------------------------------------------------------------
// Wahl je Welt und je Grad

/** Wie oft die Haupt-Kernidee von x unter den Leveln menge vorkommt. */
const anzahl = (menge, x) => menge.filter(y => y.haupt && y.haupt === x.haupt).length;

/**
 * Die beste Menge von 10 aus kandidaten (nach Schwierigkeit geordnet), die sich anordnen lässt: die kleinste Summe der
 * Ränge in der Bewertung (rang), mit höchstens HOECHSTENS je Haupt-Kernidee, ohne zwei zu ähnliche Level (passt(x,
 * menge)), so dass jedes Level höchstens VERTAUSCHUNG Plätze von seinem Rang steht und die Vielfalt von einem der
 * Zustände zs aus aufgeht (geprüft am Ende mit gehtVon; unterwegs mit dem weitesten Zustand, dem kleinsten Platz je
 * Haupt-Kernidee über alle zs). Suche mit Schranke: die Summe so weit plus die kleinsten Ränge, die noch kommen
 * können. Unter gleich guten die zuerst gefundene (die Kandidaten nach Schwierigkeit, ein gut bewerteter zuerst mit).
 * Höchstens SUCHE_KNOTEN Schritte, danach gilt die beste bis dahin (gezählt in SUCHE, im Bericht). Rückgabe die Menge
 * nach Rang oder null.
 */
export const SUCHE_KNOTEN = 5e7;
/** Wie oft die Suche lief, ihre Schritte zusammen und wie oft sie an SUCHE_KNOTEN stiess (seit dem Start). */
export const SUCHE = { aufrufe: 0, schritte: 0, abgebrochen: 0 };
function besteMenge(kandidaten, rang, zs, passt) {
  const m = kandidaten.length, n = JE_WELT;
  const weit = new Map();
  for (const z of zs) {
    for (const [x, [u, v]] of z) {
      const [s, t] = weit.get(x) ?? [u, v];
      weit.set(x, [Math.min(s, u), Math.min(t, v)]);
    }
  }
  for (const [x] of weit) if (zs.some(z => !z.has(x))) weit.set(x, [0, 0]);
  // je Startpunkt c: die Ränge der Kandidaten ab c, aufsteigend (für die Schranke), und je Haupt-Kernidee ihre Zahl
  const abC = Array.from({ length: m + 1 }, (_, c) => kandidaten.slice(c).map(l => rang.get(l)).sort((a, b) => a - b));
  const ideen = [...new Set(kandidaten.map(l => l.haupt).filter(Boolean))];
  const nochIdee = Array.from({ length: m + 1 }, (_, c) => new Map(ideen.map(x => [x, kandidaten.slice(c)
    .filter(l => l.haupt === x).length])));
  const nochOhne = Array.from({ length: m + 1 }, (_, c) => kandidaten.slice(c).filter(l => !l.haupt).length);
  let best = null, bestKosten = Infinity, knoten = 0;
  const menge = [], platz = new Array(n).fill(false), stellen = new Map();
  const rec = (c, kosten) => {
    if (++knoten > SUCHE_KNOTEN) return;
    const r = menge.length;
    if (r === n) {
      const welt = [...menge];
      if (kosten < bestKosten && gehtVon(welt, zs)) { best = welt; bestKosten = kosten; }
      return;
    }
    if (m - c < n - r) return;
    // Schranke: die kleinsten Ränge, die noch kommen können
    let schranke = kosten;
    for (let k = 0; k < n - r; k++) schranke += abC[c][k];
    if (schranke >= bestKosten) return;
    // genug Level mit freier Haupt-Kernidee übrig?
    let moeglich = nochOhne[c];
    for (const x of ideen) moeglich += Math.min(HOECHSTENS - (stellen.get(x)?.length ?? 0), nochIdee[c].get(x));
    if (moeglich < n - r) return;
    const l = kandidaten[c];
    const mit = () => {
      if (l.haupt && (stellen.get(l.haupt)?.length ?? 0) >= HOECHSTENS) return;
      if (!passt(l, menge)) return;
      // Rang r auf einen Platz r - VERTAUSCHUNG … r + VERTAUSCHUNG; ist r - VERTAUSCHUNG noch frei, muss er dorthin
      const muss = r - VERTAUSCHUNG >= 0 && !platz[r - VERTAUSCHUNG];
      for (let p = Math.max(0, r - VERTAUSCHUNG); p <= Math.min(n - 1, r + VERTAUSCHUNG); p++) {
        if (platz[p] || (muss && p !== r - VERTAUSCHUNG)) continue;
        if (l.haupt) {
          const s = stellen.get(l.haupt) ?? [], [u, v] = weit.get(l.haupt) ?? [0, 0];
          // jedes Vorkommen ab u, das spätere von zweien ab v
          if (p < u || (s.length && Math.max(p, s[0]) < v)) continue;
          stellen.set(l.haupt, [...s, p]);
        }
        platz[p] = true; menge.push(l);
        rec(c + 1, kosten + rang.get(l));
        platz[p] = false; menge.pop();
        if (l.haupt) stellen.set(l.haupt, (stellen.get(l.haupt) ?? []).slice(0, -1));
      }
    };
    // ein gut bewerteter Kandidat zuerst mit, ein schlechter zuerst ohne: so kommt früh eine gute Menge als Schranke
    if (rang.get(l) < 2 * n) { mit(); rec(c + 1, kosten); } else { rec(c + 1, kosten); mit(); }
  };
  rec(0, 0);
  SUCHE.aufrufe++;
  SUCHE.schritte += Math.min(knoten, SUCHE_KNOTEN);
  if (knoten > SUCHE_KNOTEN) SUCHE.abgebrochen++;
  return best;
}

/**
 * Wählt die 10 Level einer Welt (siehe Kopf). kandidaten: die Level ihres Abschnitts; zs: die Zustände nach der Welt
 * davor; frueher: die schon gewählten Level (für die Ähnlichkeit); aehnlich(a, b): Ähnlichkeit zweier Level.
 * Zuerst nach der Bewertung mit höchstens HOECHSTENS je Haupt-Kernidee und ohne zu ähnliche; lässt sich das nicht
 * anordnen, die beste Menge, die sich anordnen lässt (besteMenge). Rückgabe null (keine Wahl) oder { welt (nach Rang),
 * uebergangen: [{ level, grund }] (die besser bewerteten als das schlechteste gewählte, die fehlen), zustaende }.
 */
export function waehleWelt(kandidaten, zs, frueher, aehnlich) {
  const ordnung = [...kandidaten].sort(nachBewertung), rang = new Map(ordnung.map((l, i) => [l, i]));
  const zuAehnlich = (x, menge) => {
    for (const y of menge) {
      const w = aehnlich(x, y);
      if (w >= AEHNLICH_AB) return { y, w };
    }
    return null;
  };
  let wahl = [];
  for (const x of ordnung) {
    if (wahl.length < JE_WELT && !(x.haupt && anzahl(wahl, x) >= HOECHSTENS) && !zuAehnlich(x, [...frueher, ...wahl])) {
      wahl.push(x);
    }
  }
  wahl.sort(nachSchwierigkeit);
  if (wahl.length < JE_WELT || !gehtVon(wahl, zs)) {
    const frei = kandidaten.filter(x => !zuAehnlich(x, frueher)).sort(nachSchwierigkeit);
    wahl = besteMenge(frei, rang, zs, (x, menge) => !zuAehnlich(x, menge));
    if (!wahl) return null;
  }
  // warum ein besser bewertetes Level fehlt: seine Haupt-Kernidee steht schon zweimal mit besser bewerteten in der
  // Welt, es ist einem gewählten zu ähnlich, oder sonst liess sich die Welt mit ihm nicht anordnen
  const schlechtestes = Math.max(...wahl.map(l => rang.get(l)));
  const uebergangen = ordnung.filter(x => rang.get(x) < schlechtestes && !wahl.includes(x)).map((x) => {
    const mit = wahl.filter(y => x.haupt && y.haupt === x.haupt && rang.get(y) < rang.get(x)).map(y => y.name);
    if (mit.length >= HOECHSTENS) {
      return { level: x, grund: `${x.haupt} stand schon ${HOECHSTENS}-mal in der Welt (${mit.join(', ')})` };
    }
    const a = zuAehnlich(x, [...frueher, ...wahl]);
    if (a) return { level: x, grund: `zu ähnlich wie ${a.y.name} (${String(a.w).replace('.', ',')})` };
    return { level: x, grund: 'mit ihm liess sich die Welt nicht so anordnen, dass keine Haupt-Kernidee mehr als '
      + `${HOECHSTENS}-mal in ${FENSTER} aufeinanderfolgenden Leveln steht (auch über die Grenze zur Welt davor)` };
  });
  return { welt: wahl, uebergangen, zustaende: zustaendeNach(wahl, zs) };
}

/** Die Grenzen der Abschnitte im Pool (n Level): bei den Sechsteln, je Welt eine untere, dazu das Ende. */
export const sechstel = (n) => Array.from({ length: WELTEN.length + 1 }, (_, w) => Math.round(w * n / WELTEN.length));

/**
 * Die Wahl eines Grads (siehe Kopf). levels: der Pool des Grads ohne abgelehnte, je { name, schwierigkeit, haupt,
 * spielwert, bewertung, level }; frueher: schon gewählte Level anderer Grade (Ähnlichkeit); aehnlich: wie
 * aehnlichkeit für zwei Level des Pools; ueberGrenzen: so viele Plätze darf ein Level über die Grenzen der Welten von
 * seinem Rang im Grad abweichen (UEBER_GRENZEN, 0: nur innerhalb der Welt). Rückgabe { welten: [{ welt (nach Platz),
 * rangfolge (nach Rang), abschnitt [von, bis), uebergangen }], grenzen, verschoben: Texte, verstoesse: [{ von, bis,
 * haupt, mal }], ueberGrenzen }.
 */
export function waehleGrad(levels, { frueher = [], aehnlich = (a, b) => aehnlichkeit(a.level, b.level),
  ueberGrenzen = 0 } = {}) {
  const reihe = [...levels].sort(nachSchwierigkeit), n = reihe.length, W = WELTEN.length;
  if (n < JE_GRAD) throw new Error(`Pool mit ${n} Leveln, nötig sind ${JE_GRAD}`);
  // Ohne Wahl und mit Verschiebungen über die Weltgrenzen (Entscheid des Nutzers vom 29.10.2026, «sehr schwer»): die
  // Anordnung des ganzen Grads; geht sie nicht auf, wie in den übrigen Graden (und dann mit Verstössen)
  if (ueberGrenzen && n === JE_GRAD) {
    // geht die Vielfalt auch so nicht ganz auf, die mit dem kleinsten Zuviel (nicht weiter gelockert)
    const folge = ordneUeberGrenzen(reihe, ueberGrenzen)
      ?? ordneUeberGrenzen(reihe, ueberGrenzen, { mitVerstoessen: true });
    return {
      welten: WELTEN.map((_, k) => {
        const welt = folge.slice(JE_WELT * k, JE_WELT * (k + 1));
        return { welt, rangfolge: [...welt].sort(nachSchwierigkeit), abschnitt: [JE_WELT * k, JE_WELT * (k + 1)],
          uebergangen: [] };
      }),
      grenzen: sechstel(n), verschoben: [], verstoesse: fensterVerstoesse(folge), ueberGrenzen,
    };
  }
  const grenzen = sechstel(n), fest = new Set(), verschoben = [];
  const raum = (w) => grenzen[w + 1] - grenzen[w];
  const ergebnis = [], zustaende = [[ZUSTAND_LEER]];
  let w = 0, schritte = 0;
  while (w < W) {
    if (++schritte > 10 * n) throw new Error('Wahl findet kein Ende');
    const gewaehlt = [...frueher, ...ergebnis.slice(0, w).flatMap(e => e.welt)];
    const r = waehleWelt(reihe.slice(grenzen[w], grenzen[w + 1]), zustaende[w], gewaehlt, aehnlich);
    if (r) {
      ergebnis[w] = r;
      zustaende[w + 1] = r.zustaende;
      w++;
      continue;
    }
    // Grenze verschieben: zuerst die obere nach oben (nicht in der letzten Welt und nicht, wenn sie schon nach unten
    // rücken musste), sonst die untere nach unten; die Welt davor wählt dann neu
    if (w < W - 1 && !fest.has(w + 1) && raum(w + 1) > JE_WELT) {
      grenzen[w + 1]++;
      continue;
    }
    if (w > 0 && raum(w - 1) > JE_WELT) {
      grenzen[w]--;
      fest.add(w);
      w--;
      continue;
    }
    return ohneVielfalt(reihe, grenzen, frueher, aehnlich);
  }
  const sechs = sechstel(n);
  for (let k = 1; k < W; k++) {
    if (grenzen[k] !== sechs[k]) {
      const d = grenzen[k] - sechs[k];
      verschoben.push(`Grenze ${WELTEN[k - 1]} | ${WELTEN[k]} ${Math.abs(d)} Level ${d > 0 ? 'höher' : 'tiefer'} als `
        + `beim Sechstel (Pool-Platz ${grenzen[k] + 1} statt ${sechs[k] + 1}): ${d > 0 ? WELTEN[k - 1] : WELTEN[k]} `
        + `bekam aus ihrem Abschnitt keine ${JE_WELT} Level, die die Vielfalt erfüllen`);
    }
  }
  const welten = ordne(ergebnis.map(e => e.welt));
  return {
    welten: ergebnis.map((e, k) => ({ welt: welten[k], rangfolge: e.welt, abschnitt: [grenzen[k], grenzen[k + 1]],
      uebergangen: e.uebergangen })),
    grenzen, verschoben, verstoesse: [], ueberGrenzen: 0,
  };
}

/**
 * Die Anordnung eines ganzen Grads ohne Grenzen der Welten (Entscheid des Nutzers vom 29.10.2026, nur «sehr schwer»):
 * reihe: die Level nach Rang; jedes steht höchstens d Plätze von seinem Rang, auch in einer Nachbarwelt, und in jedem
 * Fenster von FENSTER Plätzen kommt jede Haupt-Kernidee höchstens HOECHSTENS-mal vor. Unter allen solchen die mit der
 * kleinsten Summe der Verschiebungen, dann den wenigsten verschobenen Leveln, dann die erste in der Reihenfolge der
 * Ränge. Rechnet über die Plätze mit Merkzettel: Zustand ist, welche Ränge um den Platz schon stehen, und die
 * Haupt-Kernideen der letzten FENSTER - 1 Plätze. Rückgabe die Level nach Platz oder null (geht nicht).
 * mitVerstoessen: Geht es so nicht, die Anordnung mit dem kleinsten Zuviel über alle Fenster (wie zuviel), erst dann
 * die kleinste Summe der Verschiebungen usw.; liefert immer eine.
 */
export function ordneUeberGrenzen(reihe, d, { mitVerstoessen = false } = {}) {
  const n = reihe.length, nummer = new Map();
  const idee = reihe.map(l => (!l.haupt ? -1 : nummer.has(l.haupt) ? nummer.get(l.haupt)
    : nummer.set(l.haupt, nummer.size).get(l.haupt)));
  const NIE = [Infinity, Infinity, Infinity], plus = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const vor = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  // an Platz p: Bit k der maske, wenn Rang p - d + k schon steht (Ränge vor 0 gelten als gestellt); rest: die
  // Haupt-Kernideen der letzten FENSTER - 1 Plätze
  const moeglich = (p, maske, rest) => {
    const aus = [];
    for (let k = 0; k <= 2 * d; k++) {
      const r = p - d + k;
      if (r < 0 || r >= n || maske >> k & 1) continue;
      if (!mitVerstoessen && idee[r] >= 0 && rest.filter(x => x === idee[r]).length >= HOECHSTENS) continue;
      aus.push(r);
    }
    // ist Rang p - d noch frei, muss er jetzt kommen (später stünde er zu weit)
    return p - d >= 0 && !(maske & 1) ? aus.filter(r => r === p - d) : aus;
  };
  const weiter = (p, maske, rest, r) => [p + 1, (maske | 1 << (r - p + d)) >> 1,
    [...rest, idee[r]].slice(1 - FENSTER)];
  // Kosten eines Schritts: das Zuviel im Fenster, das an Platz p endet, die Verschiebung, ob verschoben
  const schritt = (p, r, rest) => {
    let z = 0;
    if (mitVerstoessen && p >= FENSTER - 1) {
      const je = new Array(nummer.size).fill(0);
      for (const x of [...rest, idee[r]]) if (x >= 0 && ++je[x] > HOECHSTENS) z++;
    }
    return [z, Math.abs(r - p), r !== p ? 1 : 0];
  };
  const memo = new Map();
  const ab = (p, maske, rest) => {
    if (p === n) return [0, 0, 0];
    const k = `${p}|${maske}|${rest.join(',')}`;
    if (!memo.has(k)) {
      let best = NIE;
      for (const r of moeglich(p, maske, rest)) {
        const c = plus(schritt(p, r, rest), ab(...weiter(p, maske, rest, r)));
        if (vor(c, best) < 0) best = c;
      }
      memo.set(k, best);
    }
    return memo.get(k);
  };
  let zustand = [0, (1 << d) - 1, []];
  if (ab(...zustand)[0] === Infinity) return null;
  const folge = [];
  for (let p = 0; p < n; p++) {
    const ziel = ab(...zustand);
    const r = moeglich(...zustand).find(q => !vor(plus(schritt(p, q, zustand[2]), ab(...weiter(...zustand, q))), ziel));
    folge.push(reihe[r]);
    zustand = weiter(...zustand, r);
  }
  return folge;
}

/** Wie weit eine Anordnung (Ränge nach Platz) vertauscht: die Summe der Abstände von Platz und Rang. */
export const versatz = (a) => a.reduce((s, i, j) => s + Math.abs(i - j), 0);

/**
 * Die Anordnung aller Welten (rangfolgen: je Welt ihre Level nach Rang), die die Vielfalt erfüllt und am wenigsten
 * vertauscht (kleinste Summe von versatz über alle Welten); unter gleich guten je Welt die erste in der Reihenfolge der
 * Ränge. Rückgabe je Welt ihre Level nach Platz.
 */
function ordne(rangfolgen) {
  const memo = new Map(), nach = (w, a) => zustandNach(a.map(i => rangfolgen[w][i]));
  // die kleinste Summe ab Welt w vom Zustand z aus (Infinity: geht nicht)
  const rest = (w, z) => {
    if (w === rangfolgen.length) return 0;
    const k = `${w}#${zustandText(z)}`;
    if (!memo.has(k)) {
      memo.set(k, Math.min(Infinity, ...anordnungen(rangfolgen[w], z).map(a => versatz(a) + rest(w + 1, nach(w, a)))));
    }
    return memo.get(k);
  };
  const aus = [];
  let z = ZUSTAND_LEER;
  for (let w = 0; w < rangfolgen.length; w++) {
    const ziel = rest(w, z);
    const a = anordnungen(rangfolgen[w], z).find(b => versatz(b) + rest(w + 1, nach(w, b)) === ziel);
    if (!a) throw new Error(`Keine Anordnung für Welt ${WELTEN[w]}`);
    aus.push(a.map(i => rangfolgen[w][i]));
    z = zustandNach(aus[w]);
  }
  return aus;
}

/**
 * Die Verstösse gegen die Vielfalt in einer Folge (Level nach Platz): je Fenster von FENSTER Plätzen und
 * Haupt-Kernidee, die öfter als HOECHSTENS-mal darin steht, { von, bis (Plätze ab 1), haupt, mal }.
 */
export function fensterVerstoesse(folge) {
  const aus = [];
  for (let s = 0; s + FENSTER <= folge.length; s++) {
    const je = {};
    for (const l of folge.slice(s, s + FENSTER)) if (l.haupt) je[l.haupt] = (je[l.haupt] ?? 0) + 1;
    for (const [haupt, mal] of Object.entries(je)) {
      if (mal > HOECHSTENS) aus.push({ von: s + 1, bis: s + FENSTER, haupt, mal });
    }
  }
  return aus;
}
/** Die Summe des Zuviels über alle Fenster (fensterVerstoesse). */
export const zuviel = (v) => v.reduce((s, x) => s + x.mal - HOECHSTENS, 0);

/**
 * Wenn die Vielfalt nicht aufgeht und sich keine Grenze verschieben lässt (Pool genau 60): je Welt die 10 nach der
 * Bewertung aus ihrem Abschnitt (wie waehleWelt, ohne Rücksicht auf die Grenzen; fehlt es, die übergangenen nach der
 * Bewertung), Ränge und Vertauschungen wie sonst, und die Anordnung mit dem kleinsten Zuviel über alle Fenster, bei
 * gleichem Zuviel die, die am wenigsten vertauscht, dann die erste in der Reihenfolge der Ränge. Die Verstösse kommen
 * ins Ergebnis.
 */
function ohneVielfalt(reihe, grenzen, frueher, aehnlich) {
  const W = WELTEN.length, rangfolgen = [], uebergangen = [];
  for (let w = 0; w < W; w++) {
    const kandidaten = reihe.slice(grenzen[w], grenzen[w + 1]).sort(nachBewertung);
    const gewaehlt = [...frueher, ...rangfolgen.flat()], wahl = [];
    for (const x of kandidaten) {
      if (wahl.length < JE_WELT && !(x.haupt && anzahl(wahl, x) >= HOECHSTENS)
        && ![...gewaehlt, ...wahl].some(y => aehnlich(x, y) >= AEHNLICH_AB)) wahl.push(x);
    }
    for (const x of kandidaten) if (wahl.length < JE_WELT && !wahl.includes(x)) wahl.push(x);
    rangfolgen.push(wahl.sort(nachSchwierigkeit));
    uebergangen.push(kandidaten.filter(x => !wahl.includes(x))
      .map(level => ({ level, grund: 'weniger gut bewertet' })));
  }
  // Rückwärts: die kleinsten Kosten [Zuviel, versatz] ab Welt w, je nach den Haupt-Kernideen der letzten FENSTER - 1
  // Level davor. Je Folge der Haupt-Kernideen genügt die Anordnung mit dem kleinsten versatz (die erste nach Rang)
  const perms = rangfolgen.map((r) => {
    const je = new Map();
    for (const a of anordnungenOhneVielfalt(r)) {
      const k = a.map(i => r[i].haupt ?? '-').join('|');
      if (!je.has(k) || versatz(a) < je.get(k).v) je.set(k, { welt: a.map(i => r[i]), v: versatz(a) });
    }
    return [...je.values()].sort((a, b) => a.v - b.v);
  });
  // das Zuviel der Fenster, die in der Welt p enden (wie zuviel(fensterVerstoesse(…)), mit Zahlen statt Texten)
  const nummer = new Map();
  const ideen = (welt) => welt.map(l => (l.haupt ? nummer.get(l.haupt) ?? nummer.set(l.haupt, nummer.size).get(l.haupt)
    : -1));
  for (const p of perms.flat()) p.ideen = ideen(p.welt);
  const kosten = (vorher, p) => {
    const f = [...ideen(vorher), ...p.ideen];
    let z = 0;
    for (let e = Math.max(FENSTER, vorher.length + 1); e <= f.length; e++) {
      const je = new Array(nummer.size).fill(0);
      for (let q = e - FENSTER; q < e; q++) if (f[q] >= 0 && ++je[f[q]] > HOECHSTENS) z++;
    }
    return [z, p.v];
  };
  const plus = (a, b) => [a[0] + b[0], a[1] + b[1]], vor = (a, b) => a[0] - b[0] || a[1] - b[1];
  const rest = new Map();
  const ab = (w, vorher) => {
    if (w === W) return [0, 0];
    const k = `${w}#${vorher.map(l => l.haupt ?? '-').join('|')}`;
    if (!rest.has(k)) {
      rest.set(k, perms[w].map(p => plus(kosten(vorher, p), ab(w + 1, p.welt.slice(1 - FENSTER)))).sort(vor)[0]);
    }
    return rest.get(k);
  };
  const welten = [];
  let vorher = [];
  for (let w = 0; w < W; w++) {
    const ziel = ab(w, vorher);
    // unter gleich guten die erste nach Rang (die Folgen der Haupt-Kernideen stehen nach versatz, nicht nach Rang)
    const p = perms[w].filter(q => !vor(plus(kosten(vorher, q), ab(w + 1, q.welt.slice(1 - FENSTER))), ziel))
      .map(q => q.welt)
      .sort((a, b) => a.reduce((d, l, j) => d || rangfolgen[w].indexOf(l) - rangfolgen[w].indexOf(b[j]), 0))[0];
    welten.push(p);
    vorher = p.slice(1 - FENSTER);
  }
  return {
    welten: welten.map((welt, w) => ({ welt, rangfolge: rangfolgen[w], abschnitt: [grenzen[w], grenzen[w + 1]],
      uebergangen: uebergangen[w] })),
    grenzen, verschoben: [], verstoesse: fensterVerstoesse(welten.flat()),
  };
}

/** Alle Anordnungen einer Welt mit höchstens VERTAUSCHUNG Plätzen vom Rang, ohne Regel der Vielfalt. */
function anordnungenOhneVielfalt(welt) {
  return anordnungen(welt.map(l => ({ ...l, haupt: null })));
}

// ---------------------------------------------------------------------------------------------------------------
// Ergebnis, Prüfung und Titel

const r2 = (x) => Math.round(x * 100) / 100;

/**
 * Die Wahl aller Grade aus dem bewerteten Pool (bewerte), in der Reihenfolge der Grade; die Ähnlichkeit gilt über alle
 * 240. Rückgabe { grade: { grad: Ergebnis von waehleGrad samt pool (Zahl), ausgeschlossen } }.
 */
export function waehle(bewertet, mass = (a, b) => aehnlichkeit(a.level, b.level)) {
  const grade = {}, frueher = [], schon = new Map();
  // jedes Paar nur einmal gemessen
  const aehnlich = (a, b) => {
    const k = a.name < b.name ? `${a.name}\n${b.name}` : `${b.name}\n${a.name}`;
    if (!schon.has(k)) schon.set(k, mass(a, b));
    return schon.get(k);
  };
  for (const g of GRADE) {
    const pool = bewertet.filter(p => p.grad === g);
    const r = waehleGrad(pool.filter(p => !p.abgelehnt), { frueher, aehnlich, ueberGrenzen: UEBER_GRENZEN[g] ?? 0 });
    frueher.push(...r.welten.flatMap(w => w.welt));
    grade[g] = { ...r, pool, ausgeschlossen: pool.filter(p => p.abgelehnt) };
  }
  return { grade };
}

/**
 * Warum in der Welt k eines Grads (Ergebnis von waehleGrad) ein Level nicht auf dem Platz seines Rangs steht, als Text:
 * die Häufungen, die entstünden, wenn die Welt nach Rang stünde und die übrigen wie gewählt. Mit Verschiebungen über
 * die Weltgrenzen (ueberGrenzen) die Häufungen im ganzen Grad nach Rang, die die Plätze von bis bis (im Grad, ab 0)
 * berühren, zwischen denen das Level verschoben ist.
 */
function vertauschtWeil(e, k, von, bis) {
  if (e.verstoesse.length) {
    return `so stehen weniger Haupt-Kernideen mehr als ${HOECHSTENS}-mal in ${FENSTER} aufeinanderfolgenden Leveln `
      + '(ganz geht die Vielfalt in diesem Grad nicht, siehe verstoesse)';
  }
  const je = new Map();
  if (e.ueberGrenzen) {
    for (const v of fensterVerstoesse(e.welten.flatMap(w => w.rangfolge).sort(nachSchwierigkeit))) {
      if (v.bis > von && v.von <= bis + 1 && !je.has(v.haupt)) je.set(v.haupt, v);
    }
  } else {
    for (const v of fensterVerstoesse(e.welten.flatMap((w, i) => (i === k ? w.rangfolge : w.welt)))) {
      if (v.bis > JE_WELT * k && v.von <= JE_WELT * (k + 1) && !je.has(v.haupt)) je.set(v.haupt, v);
    }
  }
  if (!je.size) {
    return 'so braucht der Grad die wenigsten Vertauschungen, ohne dass eine Haupt-Kernidee mehr als '
      + `${HOECHSTENS}-mal in ${FENSTER} aufeinanderfolgenden Leveln steht`;
  }
  return `nach Schwierigkeit allein stünde ${[...je.values()].map(v => `${v.haupt} ${v.mal}-mal auf den Plätzen `
    + `${v.von}–${v.bis} des Grads`).join(' und ')}`;
}

/** Die Bewertung eines Levels, wie sie im Ergebnis steht. */
const bewertungText = (p) => ({ gefuehl: r2(p.bewertung.gefuehl), aha: r2(p.bewertung.aha), spielwert: r2(p.spielwert),
  ...(p.bewertung.geschaetzt ? { geschaetzt: true } : { urteile: p.bewertung.urteile, laeufe: p.bewertung.laeufe }) });

/**
 * Die Wahl als Daten für wahl.json: je Grad Pool, Ausschlüsse, Abschnitte, Abweichungen und Verstösse, dazu je Level
 * Grad, Welt, Platz (1–10 in der Welt), Rang (1–60 nach Schwierigkeit im Grad), Schwierigkeit, Haupt-Kernidee,
 * Bewertung samt Rang in der Bewertung des Pools, Titel (titel.json, falls angegeben) und, wo die Vielfalt eine
 * Entscheidung erzwang, warum (vielfalt).
 */
export function alsDaten(wahl, titel = null) {
  const level = [], grade = {};
  for (const g of GRADE) {
    const e = wahl.grade[g], ordnung = e.pool.filter(p => !p.abgelehnt).sort(nachBewertung);
    const alle = e.welten.flatMap(w => w.rangfolge);
    const rang = new Map([...alle].sort(nachSchwierigkeit).map((l, i) => [l, i]));
    const reihe = e.pool.filter(p => !p.abgelehnt).sort(nachSchwierigkeit);
    grade[g] = {
      pool: e.pool.length, ausgeschlossen: e.ausgeschlossen.map(p => ({ name: p.name, grund: p.abgelehnt })),
      abschnitte: e.welten.map((w, k) => ({ welt: WELTEN[k], poolPlaetze: [w.abschnitt[0] + 1, w.abschnitt[1]],
        schwierigkeit: [r2(reihe[w.abschnitt[0]].schwierigkeit), r2(reihe[w.abschnitt[1] - 1].schwierigkeit)] })),
      verschoben: e.verschoben,
      vertauschung: e.ueberGrenzen ? `höchstens ${e.ueberGrenzen} Plätze vom Rang im Grad, auch über die Weltgrenze `
        + '(Entscheid des Nutzers vom 29.10.2026)' : `höchstens ${VERTAUSCHUNG} Plätze vom Rang, innerhalb der Welt`,
      verstoesse: e.verstoesse,
    };
    e.welten.forEach((w, k) => {
      // die besten 10 des Abschnitts nach der Bewertung; wer davon nicht gewählt ist, ist übergangen, und wer dafür
      // kam, steht in der Reihenfolge der Bewertung an seiner Stelle
      const kandidaten = reihe.slice(w.abschnitt[0], w.abschnitt[1]).sort(nachBewertung);
      const besten = kandidaten.slice(0, JE_WELT), fehlen = besten.filter(x => !alle.includes(x));
      const dafuer = [...w.rangfolge].filter(x => !besten.includes(x)).sort(nachBewertung);
      const grund = new Map(w.uebergangen.map(u => [u.level, u.grund]));
      w.welt.forEach((l, j) => {
        const r = rang.get(l), q = JE_WELT * k + j, gruende = [];
        const statt = fehlen[dafuer.indexOf(l)];
        if (statt) gruende.push(`statt ${statt.name} (besser bewertet): ${grund.get(statt) ?? 'weniger gut bewertet'}`);
        if (r !== q) {
          const andere = Math.floor(r / JE_WELT) !== k ? ` in ${WELTEN[Math.floor(r / JE_WELT)]}` : '';
          gruende.push(`Platz ${j + 1} statt ${r % JE_WELT + 1}${andere} nach Schwierigkeit: `
            + vertauschtWeil(e, k, Math.min(q, r), Math.max(q, r)));
        }
        level.push(geordnet({
          grad: g, welt: WELTEN[k], platz: j + 1, name: l.name, titel: titel?.[WELTEN[k]][g][j], rang: r + 1,
          schwierigkeit: r2(l.schwierigkeit), hauptKernidee: l.haupt,
          bewertung: { ...bewertungText(l), rang: ordnung.indexOf(l) + 1 },
          kandidat: l.neu ? l.kandidat : undefined, vielfalt: gruende.length ? gruende.join('; ') : undefined,
        }));
      });
    });
  }
  return { grade, level };
}

/**
 * Prüft eine Wahl (die Liste level wie in wahl.json) gegen die Regeln, ohne Lösung und Titel: 4 × 60, je Welt 10 mit
 * den Plätzen 1–10, Grad, Ränge je Welt und Vertauschungen (in den Graden von ueberGrenzen statt dessen höchstens so
 * viele Plätze vom Rang im Grad, auch über die Weltgrenze), Vielfalt (ausser den Verstössen in erlaubt je Grad; heute
 * keine), Ähnlichkeit über alle, kein abgelehntes Level, keines doppelt. info(name): { grad, schwierigkeit, haupt,
 * abgelehnt, level } des Levels im Pool; aehnlich(a, b) für zwei solche. Rückgabe: Texte.
 */
export function pruefe(level, info, { erlaubt = {}, aehnlich = (a, b) => aehnlichkeit(a.level, b.level),
  ueberGrenzen = UEBER_GRENZEN } = {}) {
  const fehler = [], namen = level.map(l => l.name);
  const doppelt = namen.filter((x, i) => namen.indexOf(x) !== i);
  if (doppelt.length) fehler.push(`doppelt: ${doppelt.join(', ')}`);
  for (const l of level) {
    const p = info(l.name);
    if (!p) { fehler.push(`${l.name}: nicht im Pool`); continue; }
    if (p.grad !== l.grad) fehler.push(`${l.name}: Grad ${p.grad}, in der Geschichte ${l.grad}`);
    if (p.abgelehnt) fehler.push(`${l.name}: abgelehnt (${p.abgelehnt})`);
  }
  for (const g of GRADE) {
    const imGrad = level.filter(l => l.grad === g);
    if (imGrad.length !== JE_GRAD) fehler.push(`${g}: ${imGrad.length} Level statt ${JE_GRAD}`);
    const folge = [];
    WELTEN.forEach((welt, w) => {
      const hier = imGrad.filter(l => l.welt === welt).sort((a, b) => a.platz - b.platz);
      if (hier.map(l => l.platz).join() !== Array.from({ length: JE_WELT }, (_, j) => j + 1).join()) {
        fehler.push(`${g}, ${welt}: Plätze ${hier.map(l => l.platz).join(',')} statt 1–${JE_WELT}`);
      }
      folge.push(...hier.map(l => ({ ...l, w })));
    });
    if (folge.some(l => !info(l.name))) continue;
    const mitDaten = folge.map(l => ({ ...l, ...info(l.name), name: l.name }));
    const rang = new Map([...mitDaten].sort(nachSchwierigkeit).map((l, i) => [l.name, i]));
    for (const l of mitDaten) {
      const r = rang.get(l.name), q = JE_WELT * l.w + l.platz - 1;
      if (ueberGrenzen[g]) {
        // nur in diesem Grad: Platz im ganzen Grad, auch über die Weltgrenze (Entscheid des Nutzers vom 29.10.2026)
        if (Math.abs(r - q) > ueberGrenzen[g]) {
          fehler.push(`${g}: ${l.name} auf Platz ${q + 1} des Grads, nach Schwierigkeit ${r + 1} (mehr als `
            + `${ueberGrenzen[g]} Plätze)`);
        }
      } else if (Math.floor(r / JE_WELT) !== l.w) {
        fehler.push(`${g}: ${l.name} hat den Rang ${r + 1}, gehört also nicht in ${WELTEN[l.w]}`);
      } else if (Math.abs(r % JE_WELT - (l.platz - 1)) > VERTAUSCHUNG) {
        fehler.push(`${g}, ${WELTEN[l.w]}: ${l.name} auf Platz ${l.platz}, nach Schwierigkeit ${r % JE_WELT + 1}`);
      }
    }
    const v = fensterVerstoesse(mitDaten), ok = new Set((erlaubt[g] ?? []).map(x => JSON.stringify(x)));
    for (const x of v.filter(y => !ok.has(JSON.stringify(y)))) {
      fehler.push(`${g}: ${x.haupt} ${x.mal}-mal auf den Plätzen ${x.von}–${x.bis}`);
    }
  }
  const alle = level.map(l => ({ name: l.name, ...info(l.name) })).filter(l => l.level);
  for (let i = 0; i < alle.length; i++) {
    for (let j = i + 1; j < alle.length; j++) {
      const w = aehnlich(alle[i], alle[j]);
      if (w >= AEHNLICH_AB) fehler.push(`zu ähnlich: ${alle[i].name} – ${alle[j].name} (${w})`);
    }
  }
  return fehler;
}

/** Die Titel aus titel.json: { Welt: { Grad: [10 Titel] } } (der Kommentar fällt weg). */
export function ladeTitel(datei = DATEIEN.titel) {
  const { kommentar, ...titel } = JSON.parse(readFileSync(datei, 'utf8'));
  return titel;
}

/** Ein Text klein und ohne Leerzeichen am Rand, zum Vergleich ohne Gross- und Kleinschreibung. */
const klein = (x) => x.trim().toLocaleLowerCase('de-CH');

/**
 * Was an den Titeln nicht stimmt (siehe Kopf): titel wie ladeTitel; namen: alle Namen in Spiel und Vorrat und der neuen
 * Level; entfernt: die Liste entfernter Level. Rückgabe: Texte.
 */
export function titelFehler(titel, namen, entfernt) {
  const fehler = [];
  const welten = Object.keys(titel);
  if (welten.join() !== WELTEN.join()) fehler.push(`Welten ${welten.join(', ')} statt ${WELTEN.join(', ')}`);
  const alle = [];
  for (const welt of WELTEN) {
    const g = Object.keys(titel[welt] ?? {});
    if (g.join() !== GRADE.join()) fehler.push(`${welt}: Grade ${g.join(', ')} statt ${GRADE.join(', ')}`);
    for (const grad of GRADE) {
      const liste = titel[welt]?.[grad] ?? [];
      if (liste.length !== JE_WELT) fehler.push(`${welt}, ${grad}: ${liste.length} Titel statt ${JE_WELT}`);
      alle.push(...liste.map(t => ({ t, wo: `${welt}, ${grad}` })));
    }
  }
  const nameKlein = new Map(namen.map(n => [klein(n), n])), entferntKlein = new Map(entfernt.map(n => [klein(n), n]));
  const gesehen = new Map();
  for (const { t, wo } of alle) {
    if (typeof t !== 'string' || !t.trim()) { fehler.push(`${wo}: leerer Titel`); continue; }
    const k = klein(t);
    if (t !== t.trim() || /\s{2}/.test(t)) fehler.push(`${wo}: «${t}» mit überzähligen Leerzeichen`);
    if (t.split(' ').length > 2) fehler.push(`${wo}: «${t}» hat mehr als zwei Wörter`);
    if (t.includes('ß')) fehler.push(`${wo}: «${t}» mit ß statt ss`);
    if (gesehen.has(k)) fehler.push(`${wo}: «${t}» doppelt (auch ${gesehen.get(k)})`);
    gesehen.set(k, wo);
    if (nameKlein.has(k)) fehler.push(`${wo}: «${t}» ist der Name eines Levels (${nameKlein.get(k)})`);
    if (entferntKlein.has(k)) fehler.push(`${wo}: «${t}» steht auf der Liste entfernter Level`);
  }
  return fehler;
}

/** Alle Namen, gegen die Titel eindeutig sein müssen: Spiel und Vorrat (flach und Würfel) und die neuen Level. */
export const alleNamen = (neue = neueLevel()) => [...ALLE.LEVELS, ...ALLE.LEVELS_3D, ...neue.map(n => n.level)]
  .map(l => l.name);

/** wahl.json als Text: oben die Angaben je Grad, dann je Level eine Zeile. */
export function wahlText(daten) {
  const kopf = { kommentar: 'Wahl der 240 Level für Noas Geschichte (Spec .scratch/noa-geschichte/, Ticket 03). '
    + 'Geschrieben von tools/geschichte.mjs wahl (Regeln im Kopf des Werkzeugs), Titel aus tools/geschichte/titel.json '
    + '(tools/geschichte.mjs titel). Je Level: Grad, Welt, Platz in der Welt (1–10), Name (Schlüssel), Titel, Rang '
    + 'nach '
    + 'Schwierigkeit im Grad (1–60), Schwierigkeit, Haupt-Kernidee, Bewertung (Gefühl und Aha im Mittel der Urteile '
    + 'der KI-Tester, Spielwert; ohne Urteil geschätzt; rang: Platz in der Bewertung des Pools), und wo die Vielfalt '
    + 'eine Entscheidung erzwang, warum (vielfalt).', grade: daten.grade };
  const text = kompakt(kopf, 4);
  return `${text.slice(0, -2)},\n "level": [\n${daten.level.map(l => `  ${JSON.stringify(l)}`).join(',\n')}\n ]\n}\n`;
}

/** JSON mit einem Leerzeichen Einzug bis zur Tiefe tiefe, darunter je Wert eine Zeile. */
function kompakt(x, tiefe, einzug = '') {
  if (tiefe === 0 || x === null || typeof x !== 'object') return JSON.stringify(x);
  const innen = `${einzug} `;
  const teile = Array.isArray(x) ? x.map(v => innen + kompakt(v, tiefe - 1, innen))
    : Object.entries(x).map(([k, v]) => `${innen}${JSON.stringify(k)}: ${kompakt(v, tiefe - 1, innen)}`);
  const [auf, zu] = Array.isArray(x) ? ['[', ']'] : ['{', '}'];
  return teile.length ? `${auf}\n${teile.join(',\n')}\n${einzug}${zu}` : `${auf}${zu}`;
}

/** Die Felder eines Levels in wahl.json, in dieser Reihenfolge. */
const FELDER = ['grad', 'welt', 'platz', 'name', 'titel', 'rang', 'schwierigkeit', 'hauptKernidee', 'bewertung',
  'kandidat', 'vielfalt'];
const geordnet = (l) => Object.fromEntries(FELDER.filter(k => l[k] !== undefined).map(k => [k, l[k]]));

/** Ordnet die Titel aus titel den Leveln einer gelesenen wahl.json zu (Platz k: Titel k). */
export const mitTitel = (daten, titel) => ({ ...daten,
  level: daten.level.map(l => geordnet({ ...l, titel: titel[l.welt][l.grad][l.platz - 1] })) });

// ---------------------------------------------------------------------------------------------------------------
// Kommandozeile

const fail = (text) => { console.error(text); process.exit(1); };
const zahl = (x, n = 1) => x.toFixed(n).replace('.', ',');

function pruefeTitel() {
  const titel = ladeTitel();
  const fehler = titelFehler(titel, alleNamen(), ladeLevelliste().entfernteNamen);
  if (fehler.length) fail(`Titel (tools/geschichte/titel.json):\n  ${fehler.join('\n  ')}`);
  return titel;
}

async function wahlBefehl(trocken) {
  const t0 = Date.now();
  const bewertet = await bewerte();
  const wahl = waehle(bewertet);
  const titel = existsSync(DATEIEN.titel) ? pruefeTitel() : null;
  if (!titel) console.error('tools/geschichte/titel.json fehlt: Wahl ohne Titel');
  const daten = alsDaten(wahl, titel);
  const info = new Map(bewertet.map(p => [p.name, p]));
  const erlaubt = Object.fromEntries(GRADE.map(g => [g, wahl.grade[g].verstoesse]));
  const fehler = pruefe(daten.level, n => info.get(n), { erlaubt });
  console.log(`Wahl der 240 Level (${zahl((Date.now() - t0) / 1000)} s); Suche nach der besten Menge: `
    + `${SUCHE.aufrufe}-mal, ${SUCHE.schritte} Schritte, ${SUCHE.abgebrochen}-mal an der Grenze von ${SUCHE_KNOTEN}`);
  for (const g of GRADE) {
    const e = wahl.grade[g], d = daten.grade[g];
    console.log(`\n${g}: Pool ${e.pool.length}, abgelehnt ${e.ausgeschlossen.length}`
      + `${e.ausgeschlossen.length ? ` (${e.ausgeschlossen.map(p => p.name).join(', ')})` : ''}`);
    e.welten.forEach((w, k) => {
      const je = {};
      for (const l of w.welt) je[l.haupt ?? 'ohne'] = (je[l.haupt ?? 'ohne'] ?? 0) + 1;
      const s = w.welt.map(l => l.schwierigkeit);
      console.log(`  ${WELTEN[k].padEnd(9)} ${zahl(Math.min(...s))}–${zahl(Math.max(...s))}  `
        + `Abschnitt ${d.abschnitte[k].poolPlaetze.join('–')}  `
        + `${Object.entries(je).map(([x, n]) => `${x} ${n}`).join(', ')}`);
      for (const u of w.uebergangen) console.log(`      übergangen: ${u.level.name} (${u.grund})`);
    });
    for (const v of e.verschoben) console.log(`  ${v}`);
    for (const v of e.verstoesse) {
      console.log(`  VIELFALT VERLETZT: ${v.haupt} ${v.mal}-mal auf den Plätzen ${v.von}–${v.bis}`);
    }
    const imGrad = daten.level.filter(l => l.grad === g), platz = (l) => JE_WELT * WELTEN.indexOf(l.welt) + l.platz;
    const weg = imGrad.filter(l => l.rang !== platz(l));
    const ueber = weg.filter(l => Math.floor((l.rang - 1) / JE_WELT) !== WELTEN.indexOf(l.welt)).length;
    const summe = weg.reduce((s, l) => s + Math.abs(l.rang - platz(l)), 0);
    console.log(`  vertauscht: ${weg.length} Level, zusammen ${summe} `
      + `Plätze${ueber ? `, davon ${ueber} über die Weltgrenze (${d.vertauschung})` : ''}; Verstösse gegen die `
      + `Vielfalt: ${new Set(e.verstoesse.map(v => v.von)).size} von ${JE_GRAD - FENSTER + 1} Fenstern, Zuviel `
      + `${zuviel(e.verstoesse)}`);
  }
  if (fehler.length) fail(`\nPrüfung:\n  ${fehler.join('\n  ')}`);
  if (trocken) { console.log('\n--trocken: wahl.json nicht geschrieben'); return; }
  writeFileSync(DATEIEN.wahl, wahlText(daten));
  console.log('\nwahl.json geschrieben');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [befehl, ...rest] = process.argv.slice(2);
  if (befehl === 'wahl') await wahlBefehl(rest.includes('--trocken'));
  else if (befehl === 'titel') {
    const titel = pruefeTitel(), daten = JSON.parse(readFileSync(DATEIEN.wahl, 'utf8'));
    writeFileSync(DATEIEN.wahl, wahlText(mitTitel(daten, titel)));
    console.log('Titel neu zugeordnet, wahl.json geschrieben');
  } else fail('Aufruf: node tools/geschichte.mjs wahl [--trocken] | titel (siehe Kopf)');
}
