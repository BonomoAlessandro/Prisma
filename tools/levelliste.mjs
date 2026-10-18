// Regeln der Levelliste (Tickets 15, 16 und 23; Spec „Levelliste, Reihenfolge und Austausch“ und „Entscheide zu den
// Tests“, Nahtstelle 3), gemeinsam für tools/ordne-level.mjs, das Reihenfolge und Grade schreibt, und den Test
// tests/levelliste.test.mjs, der sie prüft:
// - Reihenfolge (ordne): Die Level stehen nach ihrer Schwierigkeit, bei gleichem Wert in der heutigen Reihenfolge
//   (beurteilung/heutige-reihenfolge.mjs). Verschiebungen bis MAX_WANDERN Plätze werden übernommen. Ein Level, das nach
//   der Formel weiter wandern würde, steht auf der Prüfliste der KI-Tester und bleibt an seinem heutigen Platz, bis
//   beide KI-Tester dem Platz der Formel zustimmen (Ticket 16, siehe reihenfolge). Die übrigen füllen die freien Plätze
//   in der Reihenfolge der Schwierigkeit; wanderte eines dabei weiter, bleibt es ebenso stehen, bis keines mehr zu weit
//   wandert (vor Ticket 16: 56 Strahlenkranz).
// - Urteile der KI-Tester (reihenfolge, Ticket 16 nach dem Plan aus Ticket 05): Es zählen nur die Läufe der Prüfliste
//   (pruefung-…) und des Austauschs (ersatz-…, siehe unten) von Ablauf 2, keine Probe- oder Eichläufe
//   (zaehlendeUrteile). Ein Level der Prüfliste kommt nur auf den Platz der Formel, wenn beide KI-Tester zustimmen: Der
//   Platz der Formel liegt für beide in ihrem Bereich der Einordnung oder näher daran als der alte Platz (zustimmung).
//   Sonst bleibt es am alten Platz. Von dort, wo es steht, gilt die eigene Korrektur der KI-Tester nach der Regel von
//   merge (ki-tester/protocol.mjs): höchstens MAX_SHIFT Plätze und nie über eine Gradgrenze (korrigiere).
//   Am alten Platz gilt das Ergebnis aus dem Protokoll, am Platz der Formel dieselbe Regel mit dem Grad dort: gerechnet
//   vom Platz der Formel (Rang nach der Schwierigkeit) aus, angewandt von dort, wo das Level nach ordne steht; wegen
//   der Level am alten Platz liegen die beiden einige Plätze auseinander (Ticket 16: höchstens 6). Lehnen beide
//   KI-Tester ein Level ab, wird es nicht korrigiert und kommt auf die Duldungsliste (Grund abgelehnt).
// - Grade entlang der Reihenfolge (gradeEntlang): nach den Schwellen (beurteilung/grad.mjs). Ein Level, das an seinem
//   heutigen Platz bleibt, steht nicht nach seiner Schwierigkeit; es bekommt den Grad seines Abschnitts, also den des
//   letzten Levels davor, das nach der Formel steht. Ein Abschnitt beginnt beim ersten Level nach der Formel, das die
//   Schwelle erreicht. So sinkt der Grad nie, und ein Level am alten Platz zieht keine anderen mit. Die eigenen
//   Korrekturen der KI-Tester bleiben im Abschnitt ihres Grads und ändern darum keinen Grad.
// - Häufung der Haupt-Kernidee (entzerre, Entscheide des Nutzers vom 17.10.2026, Ticket 16): Kommt dieselbe
//   Haupt-Kernidee auf einer Seite zu 10 Leveln öfter als HAUPT_KERNIDEE_JE_10-mal vor, gezählt ohne die Level der
//   Duldungsliste, rückt ein Level innerhalb seines Grads um höchstens MAX_ENTZERREN Plätze, so wenig wie nötig:
//   zuerst eines der betroffenen, sonst ein anderes derselben oder einer Nachbarseite, dabei eines der Duldungsliste
//   vor einem anderen; dann der kürzeste Zug, der spätere Platz, nach hinten. Kein Zug schafft eine neue Häufung oder
//   bricht die übrigen Regeln (Grad, Mittel je 10 Level, Korrekturen der KI-Tester).
// - Duldungsliste (levelliste.json, versioniert), nach Grund getrennt (GRUENDE): Level mit Ausschlussgrund, Level ab
//   „mittel“ ohne nötige Kernidee, Level ab „mittel“ unter dem Mindest-Spielwert und Level, die beide KI-Tester
//   ablehnen. Die Liste wird nur kürzer: Sie bleibt in jedem Grund eine Teilmenge der ursprünglichen Liste
//   (urspruenglich). Einmal, in Ticket 16, wuchs die ursprüngliche Liste um begründete Ergänzungen (ergaenzt,
//   ergaenzungBegruendet): Level, die beide KI-Tester ablehnen, und Level, die durch ein Urteil der KI-Tester in einen
//   Grad kommen, in dem sie eine Regel verletzen (Entscheid des Nutzers vom 17.10.2026). Dazu die Namen entfernter
//   Level, die nie wieder vergeben werden (entfernteNamen), und die Prüfliste für Ticket 16 (pruefliste; erledigt,
//   wenn jedes Level darauf ein zählendes Urteil hat: prueflisteErledigt).
// - Je 10 Level (eine Seite der Levelauswahl): Das Mittel der Schwierigkeit fällt um höchstens TOLERANZ_MITTEL Punkte,
//   und dieselbe Haupt-Kernidee kommt höchstens HAUPT_KERNIDEE_JE_10-mal vor, gezählt ohne die Level der
//   Duldungsliste (Entscheide des Nutzers vom 16.10.2026, Ticket 15).
// - Neue Level aus dem Austausch (Tickets 23–26; Spec: „Die Formel ordnet jedes Ersatzlevel ein, die KI-Tester
//   prüfen“): Sie haben keinen heutigen Platz (imSpiel), wandern also nicht und stehen nach der Formel wie die übrigen.
//   Beurteilt werden sie in Läufen ersatz-… unter dem Namen aus ihren Leveldaten (kandidatName in leveldaten.mjs), bevor
//   ihr Name genehmigt ist. Wie bei einem Level der Prüfliste am Platz der Formel gilt die eigene Korrektur der
//   KI-Tester nach der Regel von merge, vom Platz der Formel aus und mit dem Grad dort; lehnen beide ein neues Level
//   ab, kommt es nicht ins Spiel (ein neuer Kandidat statt Duldung). Die entfernten Level kommen mit ihrem Namen auf
//   entfernteNamen; ihre Leveldaten bleiben als feste Kopie für die Eichung (beurteilung/heutige-reihenfolge.mjs).
import { readFileSync } from 'node:fs';
import { L } from './solver.mjs';
import { GRADE } from './beurteilung/index.mjs';
import { gradVon } from './beurteilung/grad.mjs';
import { MINDEST_SPIELWERT } from './beurteilung/spielwert.mjs';
import { HEUTIGE_REIHENFOLGE, heutigerPlatz } from './beurteilung/heutige-reihenfolge.mjs';
import { MAX_SHIFT, TESTERS, merge, wish } from './ki-tester/protocol.mjs';

/** Weiter wandert kein Level ohne die KI-Tester (Spec „KI-Tester“: Kleinere Abweichungen entscheidet die Formel). */
export const MAX_WANDERN = 10;
/** Je 10 Level darf das Mittel der Schwierigkeit um höchstens so viele Punkte fallen. */
export const TOLERANZ_MITTEL = 1;
/** Je 10 Level kommt dieselbe Haupt-Kernidee höchstens so oft vor, ohne die Level der Duldungsliste. */
export const HAUPT_KERNIDEE_JE_10 = 2;
/** Gegen eine Häufung der Haupt-Kernidee rückt ein Level höchstens so viele Plätze (entzerre). */
export const MAX_ENTZERREN = 3;
/** Läufe, in denen die ursprüngliche Duldungsliste wachsen durfte (Ticket 16, die Läufe der Prüfliste). */
export const ERGAENZENDE_LAEUFE = /^pruefung-/;
export const DATEI = new URL('./levelliste.json', import.meta.url);
export const PROTOKOLL = new URL('./ki-tester/protocol.jsonl', import.meta.url);
/** Versionen des Ablaufs der KI-Tester, deren Läufe für die Levelliste zählen (Ticket 16: Ablauf 2). */
export const ZAEHLENDE_ABLAEUFE = ['2'];
/** Läufe, in denen die KI-Tester die neuen Level des Austauschs beurteilen (Tickets 23–26). */
export const ERSATZ_LAEUFE = /^ersatz-/;
/**
 * Läufe, deren Urteile für die Levelliste zählen: die der Prüfliste (pruefung-…, Ticket 16) und die des Austauschs
 * (ersatz-…, Tickets 23–26); Probe- und Eichläufe nicht.
 */
export const ZAEHLENDE_LAEUFE = /^(pruefung|ersatz)-/;

/**
 * Die Gründe der Duldungsliste, je { text, gilt(beurteilung, grad, ki) }: Verletzt ein Level mit dieser Beurteilung
 * (mit seinem Grad beurteilt), diesem Grad und diesem Urteil der KI-Tester (ki aus reihenfolge, oder undefined) die
 * Regel?
 */
export const GRUENDE = {
  ausschlussgrund: { text: 'Ausschlussgrund', gilt: (b) => b.ausschluesse.length > 0 },
  ohneKernidee: {
    text: 'ab „mittel“ ohne nötige Kernidee',
    gilt: (b, grad) => grad !== GRADE[0] && !b.hauptKernidee.begriff,
  },
  unterMindestSpielwert: {
    text: `ab „mittel“ unter dem Mindest-Spielwert ${MINDEST_SPIELWERT}`,
    gilt: (b, grad) => grad !== GRADE[0] && b.spielwert.wert < MINDEST_SPIELWERT,
  },
  abgelehnt: { text: 'von beiden KI-Testern abgelehnt', gilt: (b, grad, ki) => !!ki?.abgelehnt },
};

/**
 * Die Daten der Levelliste aus levelliste.json: { duldung, urspruenglich, ergaenzt, entfernteNamen, pruefliste,
 * prueflisteErledigt }.
 */
export const ladeLevelliste = () => JSON.parse(readFileSync(DATEI, 'utf8'));

/**
 * Darf ein Level in diesem Grund auf die ursprüngliche Duldungsliste kommen (Ticket 16)? ki: sein Urteil aus
 * reihenfolge, grad: sein Grad dort. Ja, wenn das Urteil aus einem Lauf der Prüfliste stammt und beide KI-Tester es
 * ablehnen (Grund abgelehnt) bzw. wenn es durch ihr Urteil auf den Platz der Formel und damit in einen anderen Grad
 * kommt als am alten Platz (die übrigen Gründe).
 */
export function ergaenzungBegruendet(grund, ki, grad) {
  if (!ki || !ERGAENZENDE_LAEUFE.test(ki.eintrag.lauf)) return false;
  return grund === 'abgelehnt' ? ki.abgelehnt : ki.zurFormel && ki.eintrag.referenz.grad !== grad;
}

/**
 * Zählt ein Eintrag des Protokolls für die Levelliste? Ablauf 2, ein Lauf der Prüfliste (pruefung-…) oder des
 * Austauschs (ersatz-…), kein Anker.
 */
export const zaehlt = (e) => ZAEHLENDE_ABLAEUFE.includes(e.ablauf) && ZAEHLENDE_LAEUFE.test(e.lauf) && !e.level.anker;

/** Die zählenden Einträge des Protokolls (Text mit einer JSON-Zeile je Eintrag, Vorgabe protocol.jsonl). */
export function zaehlendeUrteile(text = readFileSync(PROTOKOLL, 'utf8')) {
  return text.split('\n').filter(l => l.trim()).map(l => JSON.parse(l)).filter(zaehlt);
}

/**
 * Die Level im Spiel, wie die Regeln der Levelliste sie zählen (Tickets 15 und 23): zuerst die der heutigen
 * Reihenfolge, die noch im Spiel stehen, in dieser Reihenfolge, dann die neuen aus dem Austausch in der Reihenfolge im
 * Spiel. main: die Level nach dem Tutorial (Vorgabe aus LEVELS). Rückgabe { levels, heute: je Level sein heutiger
 * Platz (1–150) oder null bei einem neuen }.
 */
export function imSpiel(main = L.LEVELS.slice(L.TUTORIAL_COUNT)) {
  const alt = HEUTIGE_REIHENFOLGE.map(name => main.find(l => l.name === name)).filter(Boolean);
  const neu = main.filter(l => heutigerPlatz(l.name) === null);
  return { levels: [...alt, ...neu], heute: [...alt.map(l => heutigerPlatz(l.name)), ...neu.map(() => null)] };
}

/**
 * Die Reihenfolge aus den Schwierigkeiten (werte[i]: Schwierigkeit des Levels i, heute[i]: sein heutiger Platz oder
 * null bei einem neuen Level, Vorgabe i + 1; die Indizes in der heutigen Reihenfolge, die neuen danach). zurFormel:
 * Indizes von Leveln der Prüfliste, denen beide KI-Tester zustimmen; sie stehen nach der Formel wie die übrigen, auch
 * wenn sie weiter als MAX_WANDERN Plätze wandern. Ein neues Level wandert nicht, es steht immer nach der Formel.
 * Rückgabe je Index, Plätze ab 1: { formel: Platz nach der Formel, platz: neuer Platz, bleibt: Map Index → 'Formel'
 * (Prüfliste) oder 'Reihenfolge' (warum es am heutigen Platz bleibt), pruefliste: Indizes, die nach der Formel weiter
 * als MAX_WANDERN Plätze wandern würden }.
 */
export function ordne(werte, zurFormel = new Set(), heute = werte.map((_, i) => i + 1)) {
  const n = werte.length, nachWert = werte.map((_, i) => i).sort((i, j) => werte[i] - werte[j] || i - j);
  const formel = new Array(n);
  nachWert.forEach((i, r) => { formel[i] = r + 1; });
  const weit = (i, p) => heute[i] !== null && Math.abs(p - heute[i]) > MAX_WANDERN;
  const pruefliste = nachWert.filter(i => weit(i, formel[i]));
  const bleibt = new Map(pruefliste.filter(i => !zurFormel.has(i)).map(i => [i, 'Formel']));
  for (;;) {
    const besetzt = new Set([...bleibt.keys()].map(i => heute[i]));
    const frei = [...Array(n).keys()].map(k => k + 1).filter(p => !besetzt.has(p)), platz = new Array(n);
    for (const i of bleibt.keys()) platz[i] = heute[i];
    nachWert.filter(i => !bleibt.has(i)).forEach((i, k) => { platz[i] = frei[k]; });
    const zuWeit = nachWert.filter(i => !bleibt.has(i) && !zurFormel.has(i) && weit(i, platz[i]));
    if (!zuWeit.length) return { formel, platz, bleibt, pruefliste };
    for (const i of zuWeit) bleibt.set(i, 'Reihenfolge');
  }
}

/**
 * Die Grade entlang der Reihenfolge (folge: Indizes nach neuem Platz, werte und bleibt wie bei ordne): nach der
 * Schwelle; ein Level, das am heutigen Platz bleibt, mit dem Grad des letzten Levels davor, das nach der Formel steht
 * (ganz vorn mit dem des ersten). Rückgabe je Index.
 */
export function gradeEntlang(folge, werte, bleibt) {
  const grad = new Array(werte.length);
  let zuletzt = gradVon(werte[folge.find(i => !bleibt.has(i))]);
  for (const i of folge) {
    if (!bleibt.has(i)) zuletzt = gradVon(werte[i]);
    grad[i] = zuletzt;
  }
  return grad;
}

/**
 * Stimmen beide KI-Tester dem Platz der Formel zu (eintrag: Eintrag des Protokolls, alt und formel: alter Platz und
 * Platz der Formel)? Einer stimmt zu, wenn der Platz der Formel in seinem Bereich der Einordnung liegt oder näher daran
 * als der alte Platz. Die Bereiche rechnen mit den Plätzen der Anker im Eintrag (bei der Vorbereitung des Laufs).
 * Rückgabe: { je: { A, B } je { formel, alt: Abstand zum Bereich, stimmtZu }, zurFormel: beide stimmen zu }.
 */
export function zustimmung(eintrag, alt, formel) {
  const je = Object.fromEntries(TESTERS.map((t) => {
    const abstand = (platz) => Math.abs(wish(eintrag.urteile[t].einordnung, platz, eintrag.anker));
    const d = { formel: abstand(formel), alt: abstand(alt) };
    return [t, { ...d, stimmtZu: d.formel === 0 || d.formel < d.alt }];
  }));
  return { je, zurFormel: TESTERS.every(t => je[t].stimmtZu) };
}

/**
 * Wendet die eigenen Korrekturen der KI-Tester an (folge: Indizes nach Platz, grad je Index, korrekturen: Map Index →
 * Plätze, negativ = nach vorn). Wie bei merge rückt das Level, und die Level dazwischen rücken je einen Platz zu
 * seinem alten hin. Höchstens MAX_SHIFT Plätze und nie aus dem Abschnitt seines Grads; angewandt in der Reihenfolge der
 * Plätze vorher. Rückgabe: die neue Folge.
 */
export function korrigiere(folge, grad, korrekturen) {
  let neu = [...folge];
  for (const i of folge.filter(j => korrekturen.get(j))) {
    const k = korrekturen.get(i), von = neu.indexOf(i);
    const abschnitt = neu.flatMap((j, p) => (grad[j] === grad[i] ? [p] : []));
    const gewollt = von + Math.sign(k) * Math.min(Math.abs(k), MAX_SHIFT);
    neu = verschiebe(neu, von, Math.min(Math.max(gewollt, abschnitt[0]), abschnitt.at(-1)));
  }
  return neu;
}

/** Die Folge, in der das Level vom Platz von (Index) auf den Platz nach rückt; die dazwischen rücken je einen Platz. */
const verschiebe = (folge, von, nach) => {
  const neu = [...folge], [i] = neu.splice(von, 1);
  neu.splice(nach, 0, i);
  return neu;
};

/**
 * Die Häufungen der Haupt-Kernidee je 10 Level (folge: Indizes nach Platz, haupt: Haupt-Kernidee je Index oder null,
 * geduldet: Set der Indizes auf der Duldungsliste, die nicht zählen): je { gruppe (0 = Plätze 1–10), begriff, mit }.
 */
export function haeufungen(folge, haupt, geduldet) {
  return zehner(folge).flatMap((z, gruppe) => {
    const je = {};
    for (const i of z) if (haupt[i] && !geduldet.has(i)) (je[haupt[i]] ??= []).push(i);
    return Object.entries(je).filter(([, mit]) => mit.length > HAUPT_KERNIDEE_JE_10)
      .map(([begriff, mit]) => ({ gruppe, begriff, mit }));
  });
}

/**
 * Löst die Häufungen der Haupt-Kernidee auf (Entscheide des Nutzers vom 17.10.2026, Ticket 16), eine nach der anderen,
 * die vorderste zuerst. Ein Level rückt dafür innerhalb seines Grads um höchstens MAX_ENTZERREN Plätze; die Level
 * dazwischen rücken je einen Platz zu seinem alten hin. Ein Zug muss die Häufung auflösen, darf keine neue schaffen und
 * muss zulaessig(folge) bestehen (die übrigen Regeln, siehe reihenfolge). Wahl unter den Zügen:
 *   1. zuerst Züge der betroffenen Level;
 *   2. lässt sich die Häufung so nicht auflösen, Züge anderer Level derselben oder einer Nachbarseite, dabei ein Level
 *      der Duldungsliste vor einem anderen;
 *   3. dann der kürzeste Zug, dann der des Levels auf dem späteren Platz, dann der nach hinten.
 * folge: Indizes nach Platz, grad je Index, haupt: Haupt-Kernidee je Index oder null, geduldet: Set der Indizes auf
 * der Duldungsliste. Rückgabe: { folge, zuege: [{ i, von, nach }] mit Plätzen ab 0, offen: die Häufungen, die sich so
 * nicht auflösen lassen }.
 */
export function entzerre(folge, grad, haupt, geduldet, zulaessig = () => true) {
  let neu = [...folge];
  const zuege = [], offen = [];
  const gleich = (x, y) => x.gruppe === y.gruppe && x.begriff === y.begriff;
  for (;;) {
    const vorher = haeufungen(neu, haupt, geduldet), h = vorher.find(x => !offen.some(o => gleich(o, x)));
    if (!h) return { folge: neu, zuege, offen: vorher };
    // Rang eines Zugs, kleiner ist besser: betroffen vor anderem, Duldungsliste vor anderem, kürzer, später, hinten
    const rang = (z) => [h.mit.includes(z.i) ? 0 : 1, geduldet.has(z.i) ? 0 : 1, z.s, -z.von, -z.nach];
    const besser = (a, b) => {
      const ra = rang(a), rb = rang(b), k = ra.findIndex((x, j) => x !== rb[j]);
      return k >= 0 && ra[k] < rb[k];
    };
    const seiten = new Set([h.gruppe - 1, h.gruppe, h.gruppe + 1]);
    let best = null;
    for (const kreis of [h.mit, neu.filter((i, p) => !h.mit.includes(i) && seiten.has(Math.floor(p / 10)))]) {
      for (const i of kreis) {
        const von = neu.indexOf(i);
        for (let s = 1; s <= MAX_ENTZERREN; s++) {
          for (const nach of [von + s, von - s]) {
            if (nach < 0 || nach >= neu.length || grad[neu[nach]] !== grad[i]) continue;
            const probe = verschiebe(neu, von, nach), danach = haeufungen(probe, haupt, geduldet);
            if (danach.some(x => gleich(x, h) || !vorher.some(y => gleich(x, y))) || !zulaessig(probe)) continue;
            const zug = { i, von, nach, s, probe };
            if (!best || besser(zug, best)) best = zug;
          }
        }
      }
      if (best) break;
    }
    if (!best) offen.push(h);
    else {
      neu = best.probe;
      zuege.push({ i: best.i, von: best.von, nach: best.nach });
    }
  }
}

/** Steigt das Mittel der Schwierigkeit je 10 Level, mit höchstens TOLERANZ_MITTEL Punkten Rückschritt? */
export function mittelSteigt(folge, werte) {
  const mittel = zehner(folge).map(z => z.reduce((s, i) => s + werte[i], 0) / z.length);
  return mittel.every((m, k) => !k || m >= mittel[k - 1] - TOLERANZ_MITTEL);
}

/**
 * Reihenfolge und Grade mit den Urteilen der KI-Tester (Tickets 16 und 23). werte[i], namen[i]: Schwierigkeit und Name
 * des Levels i; heute[i]: sein heutiger Platz oder null bei einem neuen Level (Vorgabe i + 1, siehe imSpiel und
 * ordne); kandidat[i]: bei einem neuen Level der Name, unter dem die KI-Tester es beurteilt haben (kandidatName in
 * leveldaten.mjs). urteile: die zählenden Einträge des Protokolls. Urteile zu Leveln, die es nicht (mehr) gibt, zählen
 * nicht; ein Fehler ist ein Urteil zu einem heutigen Level ausserhalb der Prüfliste, ein Lauf ersatz-… zu einem
 * heutigen Level oder ein anderer Lauf zu einem neuen und ein zweites Urteil zum selben Level. Für die Häufung der
 * Haupt-Kernidee: haupt[i] (Haupt-Kernidee oder null) und geduldet(i, grad, ki) (steht das Level mit diesem Grad und
 * Urteil auf der Duldungsliste?); ohne haupt keine Häufungsregel.
 * Rückgabe: wie ordne, dazu basis (Folge vor den eigenen Korrekturen), korrigiert (nach ihnen), folge (nach der
 * Häufungsregel; Indizes nach Platz), zuege und offen (der Häufungsregel, siehe entzerre), grad (je Index), zurFormel
 * (Set der Level der Prüfliste, denen beide zustimmen) und ki: Map Index →
 * { eintrag, neu, je, zurFormel, abgelehnt, gruende, verschiebung } (bei einem neuen Level je: null).
 */
export function reihenfolge(werte, namen, urteile = [], {
  haupt = null, geduldet = () => false, heute = werte.map((_, i) => i + 1), kandidat = [],
} = {}) {
  const n = werte.length, { formel, pruefliste } = ordne(werte, new Set(), heute);
  const ki = new Map();
  for (const eintrag of urteile) {
    const name = eintrag.level.name;
    const i = namen.includes(name) ? namen.indexOf(name) : kandidat.indexOf(name);
    if (i < 0) continue;
    const wo = `Urteil zu ${name} (${eintrag.lauf})`, neu = heute[i] === null;
    if (neu !== ERSATZ_LAEUFE.test(eintrag.lauf)) {
      throw new Error(`${wo}: ${neu ? 'ein neues Level zählt nur aus einem Lauf ersatz-…'
        : 'ein Lauf ersatz-… beurteilt nur neue Level'}`);
    }
    if (!neu && !pruefliste.includes(i)) throw new Error(`${wo}: das Level steht nicht auf der Prüfliste`);
    if (ki.has(i)) throw new Error(`${wo}: schon beurteilt in ${ki.get(i).eintrag.lauf}`);
    ki.set(i, neu ? { eintrag, neu, je: null, zurFormel: false }
      : { eintrag, neu, ...zustimmung(eintrag, eintrag.referenz.position, formel[i]) });
  }
  const zurFormel = new Set([...ki].filter(([, u]) => u.zurFormel).map(([i]) => i));
  const ordnung = ordne(werte, zurFormel, heute);
  const basis = [...Array(n).keys()].sort((i, j) => ordnung.platz[i] - ordnung.platz[j]);
  const grad = gradeEntlang(basis, werte, ordnung.bleibt);
  for (const [i, u] of ki) {
    const { level, anker, urteile: je, ergebnis } = u.eintrag;
    // am alten Platz das Ergebnis aus dem Protokoll; am Platz der Formel (ein Level der Prüfliste mit Zustimmung oder
    // ein neues Level) dieselbe Regel mit dem Grad dort
    const r = !u.zurFormel && !u.neu ? ergebnis : merge({
      level: { ...level, anker: null }, anker, urteile: je,
      referenz: { art: 'Platz der Formel', position: formel[i], grad: grad[i], von: 1, bis: n },
    }).ergebnis;
    // ein abgelehntes Level hat nach der Regel von merge keine Verschiebung
    Object.assign(u, { abgelehnt: r.abgelehnt, gruende: r.gruende, verschiebung: r.verschiebung });
  }
  const korrigiert = korrigiere(basis, grad, new Map([...ki].map(([i, u]) => [i, u.verschiebung])));
  // Häufung der Haupt-Kernidee: Die Züge bleiben im Abschnitt des Grads, die Duldungsliste ändert sich dadurch nicht
  const aufListe = new Set(haupt ? basis.filter(i => geduldet(i, grad[i], ki.get(i))) : []);
  // Kein Zug darf die übrigen Regeln brechen: das Mittel je 10 Level, und jedes von den KI-Testern korrigierte Level
  // bleibt höchstens MAX_SHIFT Plätze von seinem Platz vor der Korrektur (den Grad sichert entzerre)
  const korrigierte = [...ki].filter(([, u]) => u.verschiebung).map(([i]) => i);
  const zulaessig = (probe) => mittelSteigt(probe, werte)
    && korrigierte.every(i => Math.abs(probe.indexOf(i) - basis.indexOf(i)) <= MAX_SHIFT);
  const { folge, zuege, offen } = haupt ? entzerre(korrigiert, grad, haupt, aufListe, zulaessig)
    : { folge: korrigiert, zuege: [], offen: [] };
  return { ...ordnung, basis, korrigiert, folge, zuege, offen, grad, zurFormel, ki };
}

/** Je 10 Level, also je Seite der Levelauswahl (PAGE_SIZE in index.html). */
export const zehner = (reihe) => Array.from({ length: Math.ceil(reihe.length / 10) },
  (_, k) => reihe.slice(10 * k, 10 * k + 10));
