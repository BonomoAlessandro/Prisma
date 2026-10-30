// Noas Geschichte als Spielablauf (Spec .scratch/noa-geschichte/, «Wahl der 240 Level» und «Namen der Welten»;
// Ticket 03): Je Grad wählt es die 60 Level der Geschichte, verteilt sie auf die 6 Welten zu je 10 und gibt jedem
// einen Titel. Das Ergebnis steht in tools/geschichte/wahl.json, die Titel in tools/geschichte/titel.json (von Hand
// gepflegt). Ins Spiel bringt es die Wahl mit dem Befehl spiel (Ticket 04, unten).
// - Pool je Grad: die flachen Level des Grads aus Spiel und Vorrat (ALLE im Lader, ohne Tutorial), für «sehr schwer»
//   dazu die 15 aus sehr-schwer-neu.json (unter ihrem Schlüssel name; die KI-Tester kennen sie als Kandidat). Seit
//   Ticket 04 stehen sie im Spiel (ordne-level.mjs --ausbau) und gelten dort weiter als die neuen (poolLevel).
//   Seit Ticket 09 kommen die 35 beurteilten Kandidaten aus sehr-schwer-kandidaten.json dazu (ersatz; aus Ticket 01,
//   Lauf ausbau-noa-1 der KI-Tester): unter ihrem Schlüssel, ohne Schlüssel unter dem Namen bei den KI-Testern. Wen
//   die Wahl nimmt, der bekommt von Hand einen Schlüssel (Sternname wie die übrigen sehr schweren, eindeutig in jeder
//   Schreibung über alle Namen, Titel und entfernten Namen: namenFehler) und kommt beim Einbau ins Spiel (Befehl
//   ausbau, dann ordne-level.mjs --ausbau); dort gilt er weiter als Kandidat aus der Liste, so bleibt die Wahl
//   dieselbe.
//   Die Platzhalter, die die Wahl nicht mehr nimmt, legt spiel in den Vorrat; sie bleiben im Pool.
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
//   - Ein Kandidat aus sehr-schwer-kandidaten.json kommt dazu nur mit gutem Urteil in Frage (Regel der Wahl in Ticket
//     01: Gefühl im Mittel ab GUT_AB, Aha bei mindestens einem; gutesUrteil); heute fällt so 525422a7 weg.
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
// - «sehr schwer» (Entscheid des Nutzers vom 29.10.2026, UEBER_GRENZEN): Mit den Rängen je Welt ging die Vielfalt hier
//   nicht auf (die 60 Level von Ticket 03 hatten fast nur 5 Haupt-Kernideen zu je 12, und schon in den Sechsteln stand
//   eine drei- oder viermal). Nur in diesem Grad steht ein Level statt dessen höchstens 3 Plätze von seinem Rang unter
//   den 60 gewählten (1–60), auch über eine Weltgrenze (Welt w hat dann nicht genau die Ränge 10·w … 10·w+9), und die
//   Vielfalt soll ganz aufgehen. Seit Ticket 09 (Entscheide des Koordinators und des Nutzers vom 30.10.2026) wählt es
//   dazu 60 aus dem grösseren Pool nach denselben Regeln wie die übrigen Grade, nur über den ganzen Grad statt je Welt
//   (waehleUeberGrenzen): kein abgelehntes, keines einem gewählten Level eines anderen Grads oder einem besser
//   bewerteten des Pools zu ähnlich; gehen die 60 am besten bewerteten auf, gelten sie; sonst Vielfalt vor Bewertung,
//   die Menge mit der kleinsten Summe der Ränge in der Bewertung, die sich so anordnen lässt (wie besteMenge, so gehen
//   die nächstbesten Level mit anderer Haupt-Kernidee vor; die Suche besteMengeUeberGrenzen ist ein Strahl mit
//   Nachbessern, keine genaue Suche, Begründung dort). Die Sechstel gelten hier nicht; der Abschnitt einer Welt im
//   Ergebnis ist der Teil des Pools, aus dem ihre Ränge kommen. Angeordnet: unter den Anordnungen, die die Regel
//   erfüllen, die mit der kleinsten Summe der Verschiebungen, dann den wenigsten verschobenen Leveln, dann die erste
//   nach Rang (ordneUeberGrenzen). Geht es mit keiner Menge ganz auf, wird nicht weiter gelockert: die 60 am besten
//   bewerteten in der Anordnung mit höchstens 3 Plätzen, die das kleinste Zuviel hat (Summe über alle Fenster, wie oft
//   eine Haupt-Kernidee mehr als HOECHSTENS-mal vorkommt), dann wie oben; die Verstösse stehen im Ergebnis
//   (verstoesse) und im Bericht. Mit den Kandidaten von Ticket 09 geht es ganz auf (keine Verstösse); die Zahlen der
//   Suche (Summe der Ränge ab 0 gezählt, untere Schranke, ohne Vielfalt) stehen in wahl.json unter suche.
// - Geht die Vielfalt in einem anderen Grad gar nicht auf (keine Wahl, und keine Grenze lässt sich verschieben), wird
//   ebenso nichts gelockert: Ränge und Vertauschungen wie oben, und die Anordnung mit dem kleinsten Zuviel, bei
//   Gleichstand mit den wenigsten Vertauschungen (ohneVielfalt). Heute kommt das nicht vor.
// - Titel (titel.json): je Welt und Grad 10, in der Reihenfolge der Plätze; der Titel auf Platz k gehört dem Level auf
//   Platz k. Eindeutig über alle Titel und alle Namen in Spiel, Vorrat, der 15 neuen und der Kandidaten mit Schlüssel
//   (Gross- und Kleinschreibung egal), keiner von der Liste entfernter Level, ein oder zwei Wörter, «ss» statt «ß»
//   (titelFehler).
// - Ins Spiel (Befehl spiel, Ticket 04): index.html enthält danach das Tutorial und genau die 240 Level aus wahl.json,
//   jedes mit seinem Titel (Feld titel hinter dem Namen); die übrigen flachen Level und alle Würfel-Level legt es in
//   den Vorrat (vorrat.mjs), ohne Titel. Level der Wahl, die im Vorrat liegen, holt es zurück. Zwischen
//   GESCHICHTE:BEGIN und GESCHICHTE:END (STORY_LEVELS in index.html) schreibt es je Grad die 6 Welten mit den
//   Schlüsseln ihrer 10 Level in der Reihenfolge der Reise; daraus liest das Spiel seine Kapitel (STORY_CHAPTERS). Die
//   Level im Spiel ordnet es nicht um: So setzt der Lader die Reihe der flachen Level und die der Würfel-Level
//   unverändert wieder zusammen. Ein Level der Wahl, das weder im Spiel noch im Vorrat steht, muss zuerst ins Spiel
//   (neue Level über ordne-level.mjs --ausbau, mit allen flachen Leveln im Spiel); dann bricht es ab. Ein zweiter Lauf
//   ändert nichts. Nach einer neuen Wahl oder neuen Titeln: wahl bzw. titel, dann spiel. Neue Kandidaten aus
//   sehr-schwer-kandidaten.json bringt der Befehl ausbau in die Form für ordne-level.mjs --ausbau (ausbauListe).
// Aufruf: LEISE_CPU=50 sh tools/leise.sh node tools/geschichte.mjs wahl [--trocken]   (etwa 75 s, davon die Suche in
//           «sehr schwer» etwa 50 s; --trocken: nur der Bericht, ohne wahl.json zu schreiben; ohne --trocken bricht es
//           ab, solange ein gewählter Kandidat keinen Schlüssel hat)
//         node tools/geschichte.mjs titel   (nach einer Änderung in titel.json: ordnet die Titel neu zu, ohne neue
//           Wahl)
//         node tools/geschichte.mjs spiel [--trocken]   (bringt wahl.json ins Spiel, siehe oben; --trocken: nur der
//           Bericht)
//         node tools/geschichte.mjs ausbau <datei>   (die gewählten Kandidaten, die noch nicht in Spiel oder Vorrat
//           stehen, als JSON-Zeilen für ordne-level.mjs --ausbau <datei>)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { ALLE } from './lader.mjs';
import { ARTEN, INDEX, ablegen, inhalt, lese, namenImSpiel, zurueckholen } from './vorrat.mjs';
import { GRADE } from './beurteilung/index.mjs';
import { MINDEST_SPIELWERT } from './beurteilung/spielwert.mjs';
import { abdruck, kandidatName } from './leveldaten.mjs';
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

/** Kandidaten aus sehr-schwer-kandidaten.json kommen nur mit Gefühl im Mittel ab diesem Wert und Aha in Frage. */
export const GUT_AB = 3;

export const DATEIEN = {
  neu: new URL('./geschichte/sehr-schwer-neu.json', import.meta.url),
  kandidaten: new URL('./geschichte/sehr-schwer-kandidaten.json', import.meta.url),
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
 * Die beurteilten Kandidaten für «sehr schwer» aus sehr-schwer-kandidaten.json (Ticket 09): je { level, kandidat,
 * auftrag, seed }. Der Schlüssel level.name ist leer, bis die Wahl ein Level nimmt; dann ein Sternname (von Hand).
 */
export function kandidatenLevel(datei = DATEIEN.kandidaten) {
  return JSON.parse(readFileSync(datei, 'utf8')).level.map(e => ({ level: e.level, kandidat: e.kandidat,
    auftrag: e.auftrag, seed: e.seed }));
}

/**
 * Der Pool aller Grade (siehe Kopf), je { name, level, grad, kandidat (Name bei den KI-Testern, falls anders), neu,
 * ersatz (aus sehr-schwer-kandidaten.json) }. Seit Ticket 04 stehen die neuen Level im Spiel (über ordne-level.mjs
 * --ausbau); dann kommen sie aus ALLE wie die übrigen und gelten weiter als neu (mit ihrem Kandidaten), so bleibt die
 * Wahl dieselbe. Ebenso die Kandidaten aus Ticket 09, sobald sie im Spiel stehen; bis dahin heissen sie im Pool nach
 * ihrem Schlüssel oder, ohne Schlüssel, wie bei den KI-Testern. Ein neues Level ohne Schlüssel, mit einem anderen Grad
 * oder mit einem Namen, unter dem andere Leveldaten in Spiel oder Vorrat stehen, bricht ab; ebenso ein Kandidat, dessen
 * Leveldaten nicht zum Kandidatennamen passen oder ohne Schlüssel schon in Spiel oder Vorrat stehen.
 */
export function poolLevel(neue = neueLevel(), kandidaten = kandidatenLevel()) {
  const neuNach = new Map(neue.map(n => [n.level.name, n]));
  const ersatzNach = new Map(kandidaten.filter(k => k.level.name).map(k => [k.level.name, k]));
  const main = ALLE.LEVELS.slice(ALLE.TUTORIAL_COUNT).map((level) => {
    const k = neuNach.get(level.name) ?? ersatzNach.get(level.name);
    return { name: level.name, level, grad: level.grad, kandidat: k?.kandidat ?? null, neu: !!k,
      ersatz: ersatzNach.has(level.name) };
  });
  const vorhanden = new Map([...ALLE.LEVELS, ...ALLE.LEVELS_3D].map(l => [l.name, l]));
  const pruefeNeu = (n, datei) => {
    const name = n.level.name, da = vorhanden.get(name);
    if (!name) throw new Error(`${datei}: ${n.kandidat} ohne Schlüssel (name)`);
    if (da && (da.dim === 3 || da.tutorial || abdruck(da) !== abdruck(n.level) || da.grad !== n.level.grad)) {
      throw new Error(`${datei}: ${name} gibt es schon in Spiel oder Vorrat, mit anderen Leveldaten`);
    }
    if (n.level.grad !== GRADE[3]) throw new Error(`${datei}: ${name} hat den Grad ${n.level.grad}`);
  };
  for (const n of neue) pruefeNeu(n, 'sehr-schwer-neu.json');
  const flach = new Map(ALLE.LEVELS.map(l => [kandidatName(l), l.name]));
  for (const k of kandidaten) {
    const datei = 'sehr-schwer-kandidaten.json';
    if (kandidatName(k.level) !== k.kandidat) throw new Error(`${datei}: ${k.kandidat} passt nicht zu den Leveldaten`);
    if (k.level.name) pruefeNeu(k, datei);
    else if (flach.has(k.kandidat)) {
      throw new Error(`${datei}: ${k.kandidat} ohne Schlüssel, steht aber als ${flach.get(k.kandidat)} in Spiel oder `
        + 'Vorrat');
    }
  }
  const dazu = [
    ...neue.filter(n => !vorhanden.has(n.level.name)).map(n => ({ name: n.level.name, level: n.level,
      grad: n.level.grad, kandidat: n.kandidat, neu: true, ersatz: false })),
    ...kandidaten.filter(k => !vorhanden.has(k.level.name)).map(k => ({ name: k.level.name || k.kandidat,
      level: k.level.name ? k.level : { ...k.level, name: k.kandidat }, grad: k.level.grad, kandidat: k.kandidat,
      neu: true, ersatz: true })),
  ];
  return [...main, ...dazu];
}

/** Hat ein Kandidat aus sehr-schwer-kandidaten.json ein gutes Urteil (urteil wie urteilAus; Ticket 01)? */
export const gutesUrteil = (u) => !!u && u.gefuehl >= GUT_AB && u.aha > 0;

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
 * Warum ein Level abgelehnt ist (siehe Kopf), als Text, sonst null. p: { grad, spielwert, ausschluesse, eintraege,
 * ersatz }. Ein Kandidat aus sehr-schwer-kandidaten.json (ersatz) kommt dazu nur mit gutem Urteil in Frage.
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
  const u = p.ersatz ? urteilAus(p.eintraege) : null, komma = (x) => String(r2(x)).replace('.', ',');
  if (p.ersatz && !gutesUrteil(u)) {
    return `Kandidat ohne gutes Urteil der KI-Tester (${u ? `Gefühl im Mittel ${komma(u.gefuehl)}, Aha ${komma(u.aha)}`
      : 'kein Urteil'}; nötig Gefühl ab ${GUT_AB} und Aha, Ticket 01)`;
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
  // Mit Verschiebungen über die Weltgrenzen (Entscheid des Nutzers vom 29.10.2026, «sehr schwer»): Wahl und Anordnung
  // über den ganzen Grad (Ticket 09)
  if (ueberGrenzen) return waehleUeberGrenzen(reihe, ueberGrenzen, { frueher, aehnlich });
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
 * Die Wahl eines Grads mit Verschiebungen über die Weltgrenzen (siehe Kopf, «sehr schwer»; Ticket 09). reihe: der Pool
 * nach Schwierigkeit, ohne abgelehnte; d: so viele Plätze darf ein Level von seinem Rang unter den 60 gewählten stehen.
 * Wer einem gewählten Level eines anderen Grads (frueher) oder einem besser bewerteten des Pools, das selbst in Frage
 * kommt, zu ähnlich ist, kommt nicht in Frage. Geht die Vielfalt mit den JE_GRAD am besten bewerteten auf, gelten sie;
 * sonst die Menge mit der kleinsten Summe der Ränge in der Bewertung, die sich anordnen lässt (besteMengeUeberGrenzen);
 * gibt es keine, die am besten bewerteten mit dem kleinsten Zuviel. Angeordnet wie in ordneUeberGrenzen. Rückgabe wie
 * waehleGrad; je Welt ist rangfolge der Block ihrer Ränge (10·w … 10·w+9 unter den gewählten) und abschnitt der Teil
 * des Pools, aus dem er kommt (bis zum Level mit Rang 10·w+9, die letzte Welt bis zum Ende), dazu suche (die Zahlen
 * der Suche für wahl.json) oder null.
 */
function waehleUeberGrenzen(reihe, d, { frueher, aehnlich }) {
  const n = reihe.length, W = WELTEN.length;
  const ordnung = [...reihe].sort(nachBewertung), rang = new Map(ordnung.map((l, i) => [l, i]));
  const weg = new Map();
  for (const x of ordnung) {
    for (const y of [...frueher, ...ordnung.slice(0, rang.get(x)).filter(z => !weg.has(z))]) {
      const w = aehnlich(x, y);
      if (w >= AEHNLICH_AB) { weg.set(x, { y, w }); break; }
    }
  }
  const frei = reihe.filter(x => !weg.has(x));
  if (frei.length < JE_GRAD) throw new Error(`Pool ohne zu ähnliche mit ${frei.length} Leveln, nötig sind ${JE_GRAD}`);
  const besten = ordnung.filter(x => !weg.has(x)).slice(0, JE_GRAD).sort(nachSchwierigkeit);
  const summe = (menge) => menge.reduce((s, l) => s + rang.get(l), 0);
  let menge = besten, suche = null;
  if (frei.length > JE_GRAD && !ordneUeberGrenzen(besten, d)) {
    const r = besteMengeUeberGrenzen(frei, rang, d);
    if (r) menge = r.menge;
    suche = { summeDerRaenge: r ? summe(r.menge) : null, untereSchranke: r?.schranke ?? null,
      ohneVielfalt: summe(besten), ...(r ? r.zahlen : {}) };
  }
  // geht die Vielfalt nicht ganz auf, die Anordnung mit dem kleinsten Zuviel (nicht weiter gelockert)
  const folge = ordneUeberGrenzen(menge, d) ?? ordneUeberGrenzen(menge, d, { mitVerstoessen: true });
  const gewaehlt = new Set(menge);
  const grund = (x) => {
    const a = weg.get(x);
    if (a) return `zu ähnlich wie ${a.y.name} (${String(a.w).replace('.', ',')})`;
    if (!suche) return 'weniger gut bewertet';
    return `nicht in der besten gefundenen Menge von ${JE_GRAD} (kleinste Summe der Ränge in der Bewertung), die sich `
      + `so anordnen lässt, dass keine Haupt-Kernidee mehr als ${HOECHSTENS}-mal in ${FENSTER} aufeinanderfolgenden `
      + `Leveln steht (höchstens ${d} Plätze vom Rang, auch über die Weltgrenzen)`;
  };
  const welten = WELTEN.map((_, k) => {
    const block = menge.slice(JE_WELT * k, JE_WELT * (k + 1));
    const von = k ? reihe.indexOf(menge[JE_WELT * k - 1]) + 1 : 0;
    const bis = k < W - 1 ? reihe.indexOf(block.at(-1)) + 1 : n;
    const schlechtestes = Math.max(...block.map(l => rang.get(l)));
    const uebergangen = reihe.slice(von, bis).filter(x => !gewaehlt.has(x) && rang.get(x) < schlechtestes)
      .sort(nachBewertung).map(level => ({ level, grund: grund(level) }));
    return { welt: folge.slice(JE_WELT * k, JE_WELT * (k + 1)), rangfolge: block, abschnitt: [von, bis], uebergangen };
  });
  return { welten, grenzen: [...welten.map(w => w.abschnitt[0]), n], verschoben: [],
    verstoesse: fensterVerstoesse(folge), ueberGrenzen: d, suche };
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

// ---------------------------------------------------------------------------------------------------------------
// Wahl über den ganzen Grad (Ticket 09, siehe Kopf «sehr schwer»)
//
// Gesucht ist die Menge von n Leveln aus dem Pool mit der kleinsten Summe der Ränge in der Bewertung, die sich so
// anordnen lässt, dass jedes Level höchstens d Plätze von seinem Rang (unter den n gewählten, nach Schwierigkeit)
// steht und keine Haupt-Kernidee mehr als HOECHSTENS-mal in FENSTER aufeinanderfolgenden Plätzen. Gerechnet über die
// Plätze p = 0 … n-1 wie ordneUeberGrenzen, dazu die Wahl: Vor Platz p bekommt Rang p + d sein Level, ein späteres im
// Pool als das von Rang p + d - 1. Zustand: das zuletzt gewählte Level (j), die Haupt-Kernideen der gewählten, noch
// nicht gestellten Ränge p-d … p+d-1 (je 3 Bit, 0: gestellt) und die der letzten FENSTER - 1 Plätze (je 3 Bit). Ein
// Zustand mit gleichem Schlüssel und schlechteren Kosten (Summe der Ränge, dann der Verschiebungen, dann der
// verschobenen Level) fällt weg. Von zwei Leveln derselben Haupt-Kernidee kommt das spätere als nächstes nur in Frage,
// wenn es besser bewertet ist (das frühere lässt sonst mehr offen).
// Untere Schranke je Zustand (h): Die noch fehlenden Ränge brauchen so viele Level aus dem Rest des Pools; je
// Haupt-Kernidee höchstens so viele, wie auf den freien Plätzen noch Platz haben (früheste Plätze nach den letzten
// Vorkommen), weniger die schon gewählten, noch nicht gestellten; davon die am besten bewerteten (gierig, das ist hier
// genau). An der Wurzel ist das die untere Schranke im Ergebnis.
// Genau wäre die Suche über alle Zustände; das sprengt den Speicher (am echten Pool von «sehr schwer» über 6,8 Mio.
// Zustände schon bei Platz 8, gemessen am 30.10.2026). Darum ein Strahl: je Platz nur die STRAHL besten Zustände nach
// Kosten plus Schranke (bei Gleichstand nach Verschiebungen und Schlüssel, also nachbaubar), danach Nachbessern in
// Fenstern: Die gewählte Menge bleibt ausserhalb von NACHBESSERN.fenster aufeinanderfolgenden Leveln des Pools fest,
// innerhalb rechnet die Suche ohne Strahl genau (mit den Kosten der Menge als Schranke); die Fenster rücken in
// Schritten von NACHBESSERN.schritt durch den Pool, bis ein ganzer Durchgang nichts mehr verbessert. Kleine Pools
// (bis STRAHL Zustände je Platz) rechnet der Strahl genau (Test gegen alle Mengen).

/** So viele Zustände je Platz behält der Strahl der Suche (besteMengeUeberGrenzen; Begründung im Abschnitt oben). */
export const STRAHL = 100000;
/** Nachbessern in Fenstern: so viele aufeinanderfolgende Level des Pools frei, in so grossen Schritten. */
export const NACHBESSERN = { fenster: 20, schritt: 5 };

const OHNE_IDEE = 6;
/** Wie oft Haupt-Kernidee x in rest (je 3 Bit, die jüngste unten) vorkommt. */
const imRest = (rest, x) => {
  let k = 0;
  for (let i = 0; i < FENSTER - 1; i++) { if ((rest & 7) === x) k++; rest >>= 3; }
  return k;
};

/**
 * Die Suche aus dem Abschnitt oben über Leveln in Zahlen: idee[i] (0–5, OHNE_IDEE ohne Haupt-Kernidee) und kosten[i]
 * je Level des Pools nach Schwierigkeit; n Ränge, d Plätze. strahl: so viele Zustände je Platz (0: alle); schranke:
 * nur Zustände mit Kosten plus h bis hierher; fest[i]: 1 muss gewählt sein, -1 darf nicht, 0 frei. Rückgabe { wahl
 * (Indizes nach Rang), g (Summe der Ränge), s, v (Verschiebungen, verschobene), schranke (h an der Wurzel) } oder null.
 * (Gilt für d bis 3 und HOECHSTENS = 2.)
 */
export function sucheSchichten(idee, kosten, n, d, { strahl = 0, schranke = Infinity, fest = null } = {}) {
  const M = idee.length, B3 = 6 * d, RB = 3 * (FENSTER - 1), R8 = 2 ** RB, ANFANG = R8 - 1;
  if (d > 3 || HOECHSTENS !== 2 || M > 254) throw new Error('Suche nur für höchstens 3 Plätze, 2 je Fenster');
  const F = fest ?? new Int8Array(M);
  const slot = (slots, k) => (slots >> (3 * k)) & 7;
  const erlaubtAb = new Int32Array(M + 1), mussAb = new Int32Array(M + 1);
  for (let i = M - 1; i >= 0; i--) {
    erlaubtAb[i] = erlaubtAb[i + 1] + (F[i] >= 0 ? 1 : 0);
    mussAb[i] = mussAb[i + 1] + (F[i] === 1 ? 1 : 0);
  }
  const nachKosten = [...idee.keys()].sort((a, b) => kosten[a] - kosten[b] || a - b);
  // je Haupt-Kernidee, wie oft sie auf den Plätzen p … n-1 noch stehen kann (je 4 Bit; gilt in einer Schicht)
  const platzCache = new Map();
  const plaetze = (p, rest) => {
    let c = platzCache.get(rest);
    if (c !== undefined) return c;
    c = 0;
    for (let x = 5; x >= 0; x--) {
      let a = -Infinity, b = -Infinity, r = rest;
      for (let i = 0; i < FENSTER - 1; i++) {
        if ((r & 7) === x) { if (b === -Infinity) b = p - 1 - i; else if (a === -Infinity) a = p - 1 - i; }
        r >>= 3;
      }
      let k = 0;
      for (let q = Math.max(p, 0); ; q++) {
        q = Math.max(q, a + FENSTER);
        if (q > n - 1) break;
        k++; a = b; b = q;
      }
      c = c * 16 + Math.min(k, 15);
    }
    platzCache.set(rest, c);
    return c;
  };
  const hCache = new Map(), cap = new Int32Array(6);
  const h = (p, j, slots, rest) => {
    const R = n - Math.min(n, p + d);
    let c = plaetze(p, rest);
    for (let x = 0; x < 6; x++) { cap[x] = c % 16; c = Math.floor(c / 16); }
    for (let k = 0; k < 2 * d; k++) { const s = slot(slots, k); if (s && s - 1 !== OHNE_IDEE) cap[s - 1]--; }
    let key = j + 1;
    for (let x = 0; x < 6; x++) { if (cap[x] < 0) return Infinity; key = key * 16 + cap[x]; }
    key = key * 64 + R;
    let v = hCache.get(key);
    if (v !== undefined) return v;
    v = 0;
    let genommen = 0;
    for (let i = j + 1; i < M && v !== Infinity; i++) {
      if (F[i] !== 1) continue;
      if (idee[i] !== OHNE_IDEE && --cap[idee[i]] < 0) v = Infinity;
      genommen++; v += kosten[i];
    }
    for (let q = 0; q < M && genommen < R && v !== Infinity; q++) {
      const i = nachKosten[q], x = idee[i];
      if (i <= j || F[i] !== 0 || (x !== OHNE_IDEE && cap[x] <= 0)) continue;
      if (x !== OHNE_IDEE) cap[x]--;
      genommen++; v += kosten[i];
    }
    if (genommen !== R) v = Infinity;
    hCache.set(key, v);
    return v;
  };
  const FELDER = ['j', 'slots', 'rest', 'g', 's', 'v', 'f', 'eltern', 'item', 'rang'];
  const schicht = (gr) => ({ n: 0, j: new Int16Array(gr), slots: new Int32Array(gr), rest: new Int32Array(gr),
    g: new Int32Array(gr), s: new Int16Array(gr), v: new Int16Array(gr), f: new Float64Array(gr),
    eltern: new Int32Array(gr), item: new Int16Array(gr), rang: new Int16Array(gr) });
  const besser = (T, a, g, s, v) => g < T.g[a] || (g === T.g[a] && (s < T.s[a] || (s === T.s[a] && v < T.v[a])));
  let S = schicht(1);
  S.n = 1; S.j[0] = -1; S.rest[0] = ANFANG; S.eltern[0] = -1; S.item[0] = -1; S.rang[0] = -1;
  const verlauf = [S], items = [], kand = [];
  for (let p = -d; p < n; p++) {
    let T = schicht(Math.max(1024, S.n * 4));
    const index = new Map(), t = p + d;
    for (let a = 0; a < S.n; a++) {
      const j = S.j[a], slots = S.slots[a], rest = S.rest[a], g = S.g[a], s = S.s[a], v = S.v[a];
      // das Level für Rang t: das nächste feste muss kommen; von zwei derselben Haupt-Kernidee das spätere nur, wenn
      // es besser bewertet ist; es bleiben genug für die übrigen Ränge
      items.length = 0;
      if (t <= n - 1) {
        const bestJe = new Array(7).fill(Infinity);
        for (let i = j + 1; i < M && erlaubtAb[i] >= n - t; i++) {
          if (F[i] === -1) continue;
          if (F[i] === 1) { if (mussAb[i + 1] <= n - 1 - t) items.push(i); break; }
          if (mussAb[i + 1] > n - 1 - t || kosten[i] >= bestJe[idee[i]]) continue;
          bestJe[idee[i]] = kosten[i];
          items.push(i);
        }
      } else items.push(-1);
      for (const i of items) {
        const s7 = slots | (i >= 0 ? (idee[i] + 1) << B3 : 0), j2 = i >= 0 ? i : j, g2 = g + (i >= 0 ? kosten[i] : 0);
        // auf Platz p ein noch freier Rang p-d … p+d; ist Rang p-d frei, muss er es sein
        kand.length = 0;
        if (p < 0) kand.push(-1);
        else {
          const muss = slot(s7, 0) !== 0;
          for (let k = 0; k <= 2 * d; k++) {
            const x = slot(s7, k);
            if (!x) continue;
            if (muss && k !== 0) break;
            if (x - 1 !== OHNE_IDEE && imRest(rest, x - 1) >= HOECHSTENS) { if (muss) break; continue; }
            kand.push(k);
          }
        }
        for (const k of kand) {
          let slots2 = s7 >> 3, rest2 = rest, s2 = s, v2 = v;
          if (k >= 0) {
            const x = slot(s7, k);
            slots2 = (s7 & ~(7 << (3 * k))) >> 3;
            rest2 = ((rest << 3) | (x - 1)) & (R8 - 1);
            s2 += Math.abs(k - d); v2 += k !== d ? 1 : 0;
          }
          const key = (j2 + 1) * 2 ** (B3 + RB) + slots2 * R8 + rest2;
          let b = index.get(key);
          if (b !== undefined && !besser(T, b, g2, s2, v2)) continue;
          if (b === undefined) {
            if (T.n === T.j.length) {
              const U = schicht(T.n * 2);
              for (const f of FELDER) U[f].set(T[f]);
              U.n = T.n; T = U;
            }
            b = T.n++;
            index.set(key, b);
          }
          T.j[b] = j2; T.slots[b] = slots2; T.rest[b] = rest2; T.g[b] = g2; T.s[b] = s2; T.v[b] = v2;
          T.eltern[b] = a; T.item[b] = i; T.rang[b] = k < 0 ? -1 : p - d + k;
        }
      }
    }
    // erst nach dem Entdoppeln die Schranke: Kosten plus h
    platzCache.clear();
    let m = 0;
    for (let b = 0; b < T.n; b++) {
      const f = T.g[b] + (p < 0 ? 0 : h(p + 1, T.j[b], T.slots[b], T.rest[b]));
      if (f === Infinity || f > schranke) continue;
      if (m !== b) for (const k of FELDER) T[k][m] = T[k][b];
      T.f[m++] = f;
    }
    T.n = m;
    if (strahl && T.n > strahl) {
      const ord = Array.from({ length: T.n }, (_, i) => i).sort((a, b) => T.f[a] - T.f[b] || T.s[a] - T.s[b]
        || T.v[a] - T.v[b] || T.j[a] - T.j[b] || T.slots[a] - T.slots[b] || T.rest[a] - T.rest[b]);
      const U = schicht(strahl);
      for (let q = 0; q < strahl; q++) for (const k of FELDER) U[k][q] = T[k][ord[q]];
      U.n = strahl; T = U;
    }
    if (!T.n) return null;
    verlauf.push(T);
    S = T;
  }
  let e = 0;
  for (let a = 1; a < S.n; a++) if (besser(S, e, S.g[a], S.s[a], S.v[a])) e = a;
  const wahl = [];
  for (let L = verlauf.length - 1, q = e; L > 0; q = verlauf[L].eltern[q], L--) {
    if (verlauf[L].item[q] >= 0) wahl.push(verlauf[L].item[q]);
  }
  platzCache.clear();
  return { wahl: wahl.reverse(), g: S.g[e], s: S.s[e], v: S.v[e], schranke: h(-d, -1, 0, ANFANG) };
}

/**
 * Die Menge von n Leveln aus reihe (nach Schwierigkeit) mit der kleinsten Summe der Ränge in der Bewertung (rang), die
 * sich mit höchstens d Plätzen vom Rang ohne Verstoss gegen die Vielfalt anordnen lässt (Abschnitt oben): Strahl, dann
 * Nachbessern in Fenstern. Stirbt der Strahl aus, einmal mit vierfacher Breite. Rückgabe { menge (nach Schwierigkeit),
 * schranke (untere Schranke der Summe), zahlen: { strahl, fenster, schritt, durchgaenge, verbessert } } oder null.
 */
export function besteMengeUeberGrenzen(reihe, rang, d, { n = JE_GRAD, strahl = STRAHL,
  nachbessern = NACHBESSERN } = {}) {
  const ideen = [...new Set(reihe.map(l => l.haupt).filter(Boolean))].sort();
  if (ideen.length > 6) throw new Error(`Suche für höchstens 6 Haupt-Kernideen, nicht ${ideen.length}`);
  const idee = reihe.map(l => (l.haupt ? ideen.indexOf(l.haupt) : OHNE_IDEE)), kosten = reihe.map(l => rang.get(l));
  let breite = strahl, r = sucheSchichten(idee, kosten, n, d, { strahl: breite });
  if (!r && breite) r = sucheSchichten(idee, kosten, n, d, { strahl: breite *= 4 });
  if (!r) return null;
  const M = reihe.length, { fenster, schritt } = nachbessern;
  let durchgaenge = 0, verbessert = 0;
  for (let weiter = fenster > 0; weiter;) {
    weiter = false;
    durchgaenge++;
    for (let a = 0; a < M; a += schritt) {
      const fest = new Int8Array(M).fill(-1);
      for (const i of r.wahl) fest[i] = 1;
      fest.fill(0, a, Math.min(M, a + fenster));
      const q = sucheSchichten(idee, kosten, n, d, { fest, schranke: r.g });
      if (q && (q.g < r.g || (q.g === r.g && (q.s < r.s || (q.s === r.s && q.v < r.v))))) {
        if (q.g < r.g) { weiter = true; verbessert++; }
        r = { ...q, schranke: r.schranke };
      }
    }
  }
  return { menge: r.wahl.map(i => reihe[i]), schranke: r.schranke,
    zahlen: { strahl: breite, fenster, schritt, durchgaenge, verbessert } };
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
      ...(e.suche ? { suche: e.suche } : {}),
    };
    // je Abschnitt die besten 10 nach der Bewertung; wer davon nicht gewählt ist, ist übergangen, und wer dafür kam
    // (aus der Rangfolge des Abschnitts), steht in der Reihenfolge der Bewertung an seiner Stelle (statt)
    const statt = new Map();
    for (const w of e.welten) {
      const kandidaten = reihe.slice(w.abschnitt[0], w.abschnitt[1]).sort(nachBewertung);
      const besten = kandidaten.slice(0, JE_WELT), fehlen = besten.filter(x => !alle.includes(x));
      const dafuer = [...w.rangfolge].filter(x => !besten.includes(x)).sort(nachBewertung);
      const grund = new Map(w.uebergangen.map(u => [u.level, u.grund]));
      dafuer.forEach((l, i) => {
        if (!fehlen[i]) return;
        statt.set(l, `statt ${fehlen[i].name} (besser bewertet): ${grund.get(fehlen[i]) ?? 'weniger gut bewertet'}`);
      });
    }
    e.welten.forEach((w, k) => {
      w.welt.forEach((l, j) => {
        const r = rang.get(l), q = JE_WELT * k + j, gruende = [];
        if (statt.has(l)) gruende.push(statt.get(l));
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

/**
 * Alle Namen, gegen die Titel eindeutig sein müssen: Spiel und Vorrat (flach und Würfel), die neuen Level und die
 * Kandidaten mit Schlüssel.
 */
export const alleNamen = (neue = neueLevel(), kandidaten = kandidatenLevel()) => [...new Set([...ALLE.LEVELS,
  ...ALLE.LEVELS_3D, ...neue.map(n => n.level), ...kandidaten.filter(k => k.level.name).map(k => k.level)]
  .map(l => l.name))];

/**
 * Ein Name so, dass andere Schreibungen gleich aussehen: ohne Gross- und Kleinschreibung, Umlaute als ae/oe/ue, ß als
 * ss, ohne Akzente, Leer- und Satzzeichen, c wie k, ph wie f, th wie t, y wie i, v wie w, doppelte Buchstaben einfach
 * (Wega und Vega, Kastor und Castor, Morgenröte und Morgenroete).
 */
export const schreibung = (x) => x.toLocaleLowerCase('de-CH').replace(/ä/g, 'ae').replace(/ö/g, 'oe')
  .replace(/ü/g, 'ue').replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '').replace(/ph/g, 'f').replace(/th/g, 't').replace(/c/g, 'k').replace(/y/g, 'i')
  .replace(/v/g, 'w').replace(/(.)\1+/g, '$1');

/**
 * Was an den Schlüsseln der Kandidaten aus sehr-schwer-kandidaten.json nicht stimmt (Ticket 09): je Kandidat mit
 * Schlüssel kein Kandidatenname, eindeutig in jeder Schreibung (schreibung) über alle Namen in Spiel und Vorrat, die
 * neuen Level, die übrigen Kandidaten, die Titel und die Liste entfernter Level. Derselbe Name in Spiel oder Vorrat ist
 * das Level selbst (dass die Leveldaten gleich sind, prüft poolLevel). namen: alle übrigen Namen (alleNamen), titel:
 * alle Titel. Rückgabe: Texte.
 */
export function namenFehler(kandidaten, namen, entfernt, titel) {
  const fehler = [], mit = kandidaten.filter(k => k.level.name).map(k => k.level.name);
  const andere = [...namen.map(x => ({ x, wo: 'Name' })), ...titel.map(x => ({ x, wo: 'Titel' })),
    ...entfernt.map(x => ({ x, wo: 'entfernter Name' }))];
  for (const name of mit) {
    if (name !== name.trim() || /\s{2}/.test(name) || name.startsWith('Kandidat')) {
      fehler.push(`«${name}»: kein Schlüssel`);
    }
    const s = schreibung(name);
    const gleich = andere.filter(a => schreibung(a.x) === s && !(a.wo === 'Name' && a.x === name));
    for (const a of gleich) fehler.push(`«${name}» wie ${a.wo} «${a.x}»`);
    if (mit.filter(y => schreibung(y) === s).length > 1) fehler.push(`«${name}» doppelt unter den Kandidaten`);
  }
  return fehler;
}

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
// Ins Spiel (Ticket 04, siehe Kopf)

/** Die Markierungen des Datenblocks der Geschichte in index.html (in STORY_LEVELS). */
export const BLOCK = { anfang: '/* GESCHICHTE:BEGIN */', ende: '/* GESCHICHTE:END */' };

/**
 * Die Reise je Grad aus wahl.json (daten: die gelesene Datei): { Grad: [[die 10 Schlüssel der ersten Welt], …] }, die
 * Welten in der Reihenfolge von WELTEN, darin nach Platz. Wirft, wenn ein Platz fehlt oder doppelt ist.
 */
export function reiseAus(daten) {
  const reise = Object.fromEntries(GRADE.map(g => [g, WELTEN.map(() => Array(JE_WELT).fill(null))]));
  for (const l of daten.level) {
    const welt = reise[l.grad]?.[WELTEN.indexOf(l.welt)];
    if (!welt || !(l.platz >= 1 && l.platz <= JE_WELT) || welt[l.platz - 1] !== null) {
      throw new Error(`wahl.json: ${l.name} (${l.grad}, ${l.welt}, Platz ${l.platz}) passt nicht in die Reise`);
    }
    welt[l.platz - 1] = l.name;
  }
  const leer = GRADE.flatMap(g => reise[g].flatMap((w, k) => w.flatMap((x, j) => (x === null
    ? [`${g}, ${WELTEN[k]}, Platz ${j + 1}`] : []))));
  if (leer.length) throw new Error(`wahl.json: kein Level auf ${leer.join('; ')}`);
  return reise;
}

const js = (x) => `'${String(x).replace(/['\\]/g, '\\$&')}'`;

/**
 * Die Zeilen des Datenblocks (ohne Zeilenende): je Grad eine Liste der Welten, je Welt ihre Schlüssel, darüber ein
 * Kommentar mit dem Namen der Welt; auf höchstens 120 Zeichen umbrochen.
 */
export function blockZeilen(reise) {
  const zeilen = [];
  for (const g of GRADE) {
    zeilen.push(`  ${js(g)}: [`);
    reise[g].forEach((welt, k) => {
      zeilen.push(`    // ${WELTEN[k]}`);
      let z = '    [';
      welt.forEach((x, j) => {
        const teil = `${js(x)}${j === welt.length - 1 ? '],' : ','}`;
        if (z.length + 1 + teil.length > 120 && z.trim() !== '[') { zeilen.push(z); z = `     ${teil}`; }
        else z += z.endsWith('[') ? teil : ` ${teil}`;
      });
      zeilen.push(z);
    });
    zeilen.push('  ],');
  }
  return zeilen;
}

/** Die Grenzen der Zeilen zwischen zwei Markierungen in einem Text, wie in vorrat.mjs: { von, bis, nl }. */
function zwischen(text, anfang, ende) {
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const a = text.indexOf(anfang), e = text.indexOf(ende);
  if (a < 0 || e < a) throw new Error(`index.html: Markierungen ${anfang} und ${ende} fehlen`);
  return { von: text.indexOf(nl, a) + nl.length, bis: text.lastIndexOf(nl, e) + nl.length, nl };
}

/** index.html mit dem Datenblock der Reise (reiseAus) zwischen GESCHICHTE:BEGIN und GESCHICHTE:END. */
export function mitBlock(html, reise) {
  const b = zwischen(html, BLOCK.anfang, BLOCK.ende);
  return html.slice(0, b.von) + blockZeilen(reise).map(z => z + b.nl).join('') + html.slice(b.bis);
}

/** Die Reise aus dem Datenblock in index.html (wie das Spiel ihn liest), oder null ohne Markierungen. */
export function reiseImSpiel(html) {
  if (!html.includes(BLOCK.anfang)) return null;
  const b = zwischen(html, BLOCK.anfang, BLOCK.ende);
  return new Function(`return {\n${html.slice(b.von, b.bis)}};`)();
}

/**
 * Eine Namenszeile im Format von levelCode: Einzug und Name (im Würfel mit dim, size und height), wahlweise Titel,
 * dahinter der Rest.
 */
const NAMENSZEILE = new RegExp(String.raw`^( {4}name: '((?:[^'\\]|\\.)*)',(?: dim: 3, size: \d+,(?: height: \d+,)?)?)`
  + String.raw`( titel: '(?:[^'\\]|\\.)*',)?(.*)$`);

/**
 * index.html mit den Titeln der Geschichte (titel: Map Name → Titel) in den Namenszeilen der Level zwischen den
 * Markierungen (flach und Würfel); ein Level, das nicht in titel steht, hat danach keinen Titel. Der übrige Text
 * bleibt.
 */
export function mitTitelnImSpiel(html, titel) {
  const unquote = (s) => s.replace(/\\(.)/g, '$1');
  let text = html;
  for (const art of Object.keys(ARTEN)) {
    const b = zwischen(text, ARTEN[art].anfang, ARTEN[art].ende);
    const zeilen = text.slice(b.von, b.bis).split(b.nl).map((z) => {
      const m = z.match(NAMENSZEILE);
      if (!m) return z;
      const t = titel.get(unquote(m[2]));
      return `${m[1]}${t ? ` titel: ${js(t)},` : ''}${m[4]}`;
    });
    text = text.slice(0, b.von) + zeilen.join(b.nl) + text.slice(b.bis);
  }
  return text;
}

/**
 * Bringt die Wahl ins Spiel (siehe Kopf). texte wie lese() in vorrat.mjs, daten: die gelesene wahl.json. Rückgabe:
 * { schritte: [{ was, texte }] } in der Reihenfolge, in der sie geschrieben werden (zurückholen: erst index.html, dann
 * der Vorrat; ablegen: erst der Vorrat, dann index.html; so steht ein Level bei einem Abbruch höchstens doppelt), dazu
 * holen, weg (Namen je Art), titel (Zahl) und reise. Wirft, wenn ein Level der Wahl weder im Spiel noch im Vorrat
 * steht.
 */
export function insSpiel(texte, daten) {
  const reise = reiseAus(daten), titel = new Map(daten.level.map(l => [l.name, l.titel]));
  const imSpiel = (t, art) => namenImSpiel(t.spiel, art);
  const imVorrat = (t, art) => inhalt(t[art], art).map(b => b.name);
  const namen = daten.level.map(l => l.name);
  const fehlen = namen.filter(x => !imSpiel(texte, 'flach').includes(x) && !imVorrat(texte, 'flach').includes(x));
  if (fehlen.length) {
    throw new Error('Weder im Spiel noch im Vorrat (neue Level zuerst über ordne-level.mjs --ausbau): '
      + fehlen.join(', '));
  }
  const schritte = [];
  let t = texte;
  const holen = namen.filter(x => imVorrat(t, 'flach').includes(x));
  if (holen.length) {
    t = zurueckholen(t, holen);
    schritte.push({ was: 'zurückholen', texte: t });
  }
  const spiel = mitBlock(mitTitelnImSpiel(t.spiel, titel), reise);
  const weg = { flach: imSpiel(t, 'flach').filter(x => !titel.has(x)), wuerfel: imSpiel(t, 'wuerfel') };
  if (weg.flach.length || weg.wuerfel.length) {
    t = ablegen({ ...t, spiel }, [...weg.flach, ...weg.wuerfel]);
    schritte.push({ was: 'ablegen', texte: t });
  } else if (spiel !== t.spiel) {
    t = { ...t, spiel };
    schritte.push({ was: 'Titel und Datenblock', texte: t });
  }
  return { schritte, holen, weg, titel: titel.size, reise };
}

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

/** Prüft die Schlüssel der Kandidaten (namenFehler) und bricht bei einem Fehler ab. */
function pruefeNamen() {
  const titel = existsSync(DATEIEN.titel) ? Object.values(ladeTitel()).flatMap(w => Object.values(w).flat()) : [];
  const fehler = namenFehler(kandidatenLevel(), alleNamen(), ladeLevelliste().entfernteNamen, titel);
  if (fehler.length) fail(`Schlüssel (tools/geschichte/sehr-schwer-kandidaten.json):\n  ${fehler.join('\n  ')}`);
}

async function wahlBefehl(trocken) {
  const t0 = Date.now();
  pruefeNamen();
  const bewertet = await bewerte();
  const t1 = Date.now();
  const wahl = waehle(bewertet);
  const t2 = Date.now();
  const titel = existsSync(DATEIEN.titel) ? pruefeTitel() : null;
  if (!titel) console.error('tools/geschichte/titel.json fehlt: Wahl ohne Titel');
  const daten = alsDaten(wahl, titel);
  const info = new Map(bewertet.map(p => [p.name, p]));
  const erlaubt = Object.fromEntries(GRADE.map(g => [g, wahl.grade[g].verstoesse]));
  const fehler = pruefe(daten.level, n => info.get(n), { erlaubt });
  console.log(`Wahl der 240 Level (${zahl((Date.now() - t0) / 1000)} s, davon Beurteilung ${zahl((t1 - t0) / 1000)} s, `
    + `Wahl ${zahl((t2 - t1) / 1000)} s); Suche nach der besten Menge: ${SUCHE.aufrufe}-mal, ${SUCHE.schritte} `
    + `Schritte, ${SUCHE.abgebrochen}-mal an der Grenze von ${SUCHE_KNOTEN}`);
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
    if (e.suche) {
      const s = e.suche;
      console.log(`  Wahl über die Weltgrenzen: Summe der Ränge in der Bewertung ${s.summeDerRaenge ?? '–'} (ab 0 `
        + `gezählt; untere Schranke ${s.untereSchranke ?? '–'}, ohne Vielfalt ${s.ohneVielfalt}); Strahl ${s.strahl}, `
        + `dann Fenster ${s.fenster} Level in Schritten von ${s.schritt}: ${s.durchgaenge} Durchgänge, `
        + `${s.verbessert}-mal verbessert`);
    }
    const ersatz = imGrad.filter(l => info.get(l.name).ersatz);
    if (ersatz.length) {
      console.log(`  aus sehr-schwer-kandidaten.json: ${ersatz.length} (${ersatz.map(l => `${l.name} `
        + `[${l.kandidat.replace('Kandidat ', '')}]`).join(', ')})`);
    }
  }
  if (fehler.length) fail(`\nPrüfung:\n  ${fehler.join('\n  ')}`);
  const ohneSchluessel = daten.level.filter(l => info.get(l.name).ersatz && l.name === l.kandidat);
  if (ohneSchluessel.length) {
    const text = `${ohneSchluessel.length} gewählte Kandidaten ohne Schlüssel (level.name in tools/geschichte/`
      + `sehr-schwer-kandidaten.json eintragen, dann wahl neu): ${ohneSchluessel.map(l => l.name).join(', ')}`;
    if (!trocken) fail(`\n${text}`);
    console.log(`\n${text}`);
  }
  if (trocken) { console.log('\n--trocken: wahl.json nicht geschrieben'); return; }
  writeFileSync(DATEIEN.wahl, wahlText(daten));
  console.log('\nwahl.json geschrieben');
}

/** Bringt wahl.json ins Spiel (siehe Kopf und insSpiel) und berichtet; trocken: ohne zu schreiben. */
function spielBefehl(trocken) {
  const daten = JSON.parse(readFileSync(DATEIEN.wahl, 'utf8'));
  let r;
  try {
    r = insSpiel(lese(), daten);
  } catch (e) {
    fail(e.message);
  }
  const kurz = (liste) => (liste.length > 8 ? `${liste.slice(0, 8).join(', ')} …` : liste.join(', ') || '–');
  console.log(`Wahl ins Spiel: ${r.titel} Level mit Titel, Datenblock ${GRADE.length} × ${WELTEN.length} × ${JE_WELT}`);
  console.log(`  zurückholen: ${r.holen.length} (${kurz(r.holen)})`);
  console.log(`  ablegen: ${r.weg.flach.length} flache (${kurz(r.weg.flach)}), ${r.weg.wuerfel.length} Würfel-Level`);
  if (!r.schritte.length) { console.log('index.html und Vorrat stimmen schon, nichts zu schreiben'); return; }
  if (trocken) { console.log('--trocken: nichts geschrieben'); return; }
  let vorher = lese();
  for (const s of r.schritte) {
    const dateien = [[INDEX, 'spiel'], ...Object.entries(ARTEN).map(([art, a]) => [a.datei, art])]
      .filter(([, k]) => s.texte[k] !== vorher[k]);
    // zurückholen: erst index.html, dann der Vorrat; ablegen: erst der Vorrat (siehe insSpiel)
    if (s.was !== 'zurückholen') dateien.reverse();
    for (const [datei, k] of dateien) writeFileSync(datei, s.texte[k]);
    const namen = dateien.map(([, k]) => (k === 'spiel' ? 'index.html' : `tools/vorrat/${k}.js`));
    console.log(`  ${s.was}: geschrieben ${namen.join(', ')}`);
    vorher = s.texte;
  }
}

/** Die Kandidaten mit Seeds ab diesem kamen aus dem Pool mit Ziel-Schwierigkeit (Ticket 01, pool-ss-2). */
const ZIEL_OBEN = { abSeed: 50001, schwierigkeit: [96, 112] };

/**
 * Die gewählten Kandidaten aus sehr-schwer-kandidaten.json, die weder im Spiel noch im Vorrat stehen, als Eingabe für
 * ordne-level.mjs --ausbau (Ticket 09, wie die 15 neuen in Ticket 04): je { level, name, auftrag, seed,
 * schwierigkeit (nur bei Seeds aus pool-ss-2) }. daten: die gelesene wahl.json.
 */
export function ausbauListe(daten, kandidaten = kandidatenLevel()) {
  const gewaehlt = new Set(daten.level.map(l => l.name));
  const vorhanden = new Set([...ALLE.LEVELS, ...ALLE.LEVELS_3D].map(l => l.name));
  return kandidaten.filter(k => k.level.name && gewaehlt.has(k.level.name) && !vorhanden.has(k.level.name))
    .map(k => ({ level: k.level, name: k.level.name, auftrag: k.auftrag, seed: k.seed,
      ...(k.seed >= ZIEL_OBEN.abSeed ? { schwierigkeit: ZIEL_OBEN.schwierigkeit } : {}) }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [befehl, ...rest] = process.argv.slice(2);
  if (befehl === 'wahl') await wahlBefehl(rest.includes('--trocken'));
  else if (befehl === 'titel') {
    const titel = pruefeTitel(), daten = JSON.parse(readFileSync(DATEIEN.wahl, 'utf8'));
    writeFileSync(DATEIEN.wahl, wahlText(mitTitel(daten, titel)));
    console.log('Titel neu zugeordnet, wahl.json geschrieben');
  } else if (befehl === 'spiel') spielBefehl(rest.includes('--trocken'));
  else if (befehl === 'ausbau' && rest[0]) {
    const liste = ausbauListe(JSON.parse(readFileSync(DATEIEN.wahl, 'utf8')));
    writeFileSync(rest[0], `${liste.map(a => JSON.stringify(a)).join('\n')}\n`);
    console.log(`${liste.length} Kandidaten für ordne-level.mjs --ausbau nach ${rest[0]} geschrieben`
      + `${liste.length ? `: ${liste.map(a => a.name).join(', ')}` : ''}`);
  } else {
    fail('Aufruf: node tools/geschichte.mjs wahl [--trocken] | titel | spiel [--trocken] | ausbau <datei> '
      + '(siehe Kopf)');
  }
}
