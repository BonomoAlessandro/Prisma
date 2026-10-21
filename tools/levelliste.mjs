// Regeln der Levelliste (Tickets 15, 16, 23, 24 und 26; Spec „Levelliste, Reihenfolge und Austausch“ und „Entscheide zu
// den Tests“, Nahtstelle 3), gemeinsam für tools/ordne-level.mjs, das Reihenfolge und Grade schreibt, und den Test
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
//   Die Entscheide aus Ticket 16 bleiben fest, auch wenn ein Austausch die Formel verschiebt (Entscheid des Nutzers vom
//   19.10.2026, Ticket 26): Ein Level mit dem Platz der Formel beim Entscheid, den levelliste.json festhält
//   (prueflisteFormel), bleibt auf der Prüfliste, und die Zustimmung rechnet mit diesem Platz; nur wohin ein Level mit
//   Zustimmung kommt, folgt der Formel von heute. Kommt ein Level später auf die Prüfliste, braucht es ein Urteil, und
//   sein Platz der Formel kommt dazu (festePlaetze).
// - Grade entlang der Reihenfolge (gradeEntlang): nach den Schwellen (beurteilung/grad.mjs). Ein Level, das an seinem
//   heutigen Platz bleibt, steht nicht nach seiner Schwierigkeit; es bekommt den Grad seines Abschnitts, also den des
//   letzten Levels davor, das nach der Formel steht. Ein Abschnitt beginnt beim ersten Level nach der Formel, das die
//   Schwelle erreicht. So sinkt der Grad nie, und ein Level am alten Platz zieht keine anderen mit. Die eigenen
//   Korrekturen der KI-Tester bleiben im Abschnitt ihres Grads und ändern darum keinen Grad.
// - Häufung der Haupt-Kernidee (entzerre, Entscheide des Nutzers vom 17.10.2026, Ticket 16): Kommt dieselbe
//   Haupt-Kernidee auf einer Seite zu 10 Leveln öfter als HAUPT_KERNIDEE_JE_10-mal vor, gezählt ohne die Level der
//   Duldungsliste, rückt ein Level innerhalb seines Grads um höchstens MAX_ENTZERREN Plätze (im Ausbau
//   MAX_ENTZERREN_AUSBAU, Entscheid des Nutzers vom 22.10.2026), so wenig wie nötig:
//   zuerst eines der betroffenen, sonst ein anderes derselben oder einer Nachbarseite, dabei eines der Duldungsliste
//   vor einem anderen; dann der kürzeste Zug, der spätere Platz, nach hinten. Löst kein einzelner Zug sie auf, gilt
//   auch eine Folge von Zügen, die sie je verkleinern und am Ende auflösen (höchstens VORAUSSCHAU Stellungen). Kein Zug
//   schafft eine neue Häufung oder bricht die übrigen Regeln (Grad, Mittel je 10 Level, Korrekturen der KI-Tester).
// - Korrekturen der KI-Tester (zuWeitKorrigiert, Ticket 24): Jede Korrektur führt höchstens MAX_SHIFT Plätze weit,
//   doch rücken andere Level an einem korrigierten vorbei, verschiebt es das mit. Darum gilt auch für das Ergebnis:
//   Kein korrigiertes Level steht mehr als MAX_SHIFT Plätze von seinem Platz davor, weder nach den Korrekturen noch am
//   Ende (nach der Häufungsregel).
//   ordne-level.mjs meldet einen Verstoss und schreibt dann nicht.
//   Im Ausbau gilt das nicht mehr (Entscheid des Nutzers vom 22.10.2026, Ticket 04: „Jetzt da wir so viele neue Level
//   generieren, dürfen bestehende Level auch verschoben werden, wenn nötig“; zuWeitGilt): Die KI-Tester korrigieren
//   neue Level oft um volle MAX_SHIFT Plätze, gegenläufige Korrekturen schoben einander über die Grenze, und dann liess
//   die Häufungsregel keinen Zug mehr zu. Eine einzelne Korrektur bleibt höchstens MAX_SHIFT Plätze (merge).
// - Duldungsliste (levelliste.json, versioniert), nach Grund getrennt (GRUENDE): Level mit Ausschlussgrund, Level ab
//   „mittel“ ohne nötige Kernidee, Level ab „mittel“ unter dem Mindest-Spielwert und Level, die beide KI-Tester
//   ablehnen. Die Liste wird nur kürzer: Sie bleibt in jedem Grund eine Teilmenge der ursprünglichen Liste
//   (urspruenglich). Einmal, in Ticket 16, wuchs die ursprüngliche Liste um begründete Ergänzungen (ergaenzt,
//   ergaenzungBegruendet): Level, die beide KI-Tester ablehnen, und Level, die durch ein Urteil der KI-Tester in einen
//   Grad kommen, in dem sie eine Regel verletzen (Entscheid des Nutzers vom 17.10.2026). Dazu die Namen entfernter
//   Level, die nie wieder vergeben werden (entfernteNamen), und die Prüfliste für Ticket 16 (pruefliste; erledigt,
//   wenn jedes Level darauf ein zählendes Urteil hat: prueflisteErledigt), je Level darauf mit dem Platz der Formel
//   beim Entscheid (prueflisteFormel, fest seit Ticket 26).
// - Behalten nach Urteil der KI-Tester (behalten, Entscheid des Nutzers vom 18.10.2026, Ticket 24): Level, die nur
//   wegen Kernidee oder Spielwert auf der Duldungsliste stehen und nach der Regel stark gut beurteilt sind, bleiben im
//   Spiel. Sie stehen weiter unter ihrem Grund auf der Duldungsliste (die Regel verletzen sie ja); nach dem Austausch
//   eines Grads dürfen dort nur noch sie stehen. Die Gruppe wächst nie: ordne-level.mjs übernimmt sie, wie sie ist, und
//   streicht nur Level, die es nicht mehr gibt. Dieselbe Regel gilt in „schwer“ (Entscheid vom 19.10.2026, Ticket 25).
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
// - Ausbau auf 500 Level (.scratch/500-level/, Entscheide des Nutzers vom 20.10.2026): Die Level vor dem Ausbau sind der
//   Bestand; sie stehen untereinander genau wie ohne den Ausbau (ordne, Prüfliste, Zustimmung und eigene Korrekturen der
//   KI-Tester rechnen nur unter ihnen). Die Level des Ausbaus (ausbau in levelliste.json, die Namen in der Reihenfolge
//   ihrer Aufnahme) kommen danach nach der Formel dazu (fuegeEin): jedes vor das erste Level des Bestands, das nach der
//   Formel steht und schwerer ist oder einen höheren Grad hat; ihr Grad folgt der Schwelle. So sinkt der Grad nie, und
//   die Entscheide über den Bestand bleiben fest. Beurteilt werden sie in Läufen ausbau-… unter ihrem Namen als
//   Kandidat; ihre eigene Korrektur gilt wie bei einem neuen Level vom Platz aus, an dem sie eingefügt sind. Häufung
//   der Haupt-Kernidee und Mittel je 10 Level gelten für die ganze Reihenfolge.
//   Die Anker der KI-Tester bleiben die feste Auswahl aus dem Bestand (Review Ticket 01): Mit dem Ausbau stehen sie
//   nicht mehr am Rand ihres Grads, wie es die Spec der KI-Tester für ihre Wahl verlangte; ein neues Level am Rand hat
//   dann keinen Anker dahinter. Neue Anker hiessen eine neue Version des Ablaufs, und die Urteile früherer Läufe wären
//   nicht mehr vergleichbar. Der Test der Anker rechnet darum unter dem Bestand.
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
/** Die Häufungsregel prüft für eine Häufung höchstens so viele Stellungen voraus (entzerre). */
export const VORAUSSCHAU = 40;
/** Ebenso im Ausbau: bestehende Level dürfen weiter rücken, wenn nötig (Entscheid des Nutzers vom 22.10.2026). */
export const MAX_ENTZERREN_AUSBAU = 5;
/** Die Grenze der Häufungsregel für eine Liste des Ausbaus (siehe zuWeitGilt). */
export const maxEntzerren = (ausbau = []) => (zuWeitGilt(ausbau) ? MAX_ENTZERREN : MAX_ENTZERREN_AUSBAU);
/** Läufe, in denen die ursprüngliche Duldungsliste wachsen durfte (Ticket 16, die Läufe der Prüfliste). */
export const ERGAENZENDE_LAEUFE = /^pruefung-/;
export const DATEI = new URL('./levelliste.json', import.meta.url);
export const PROTOKOLL = new URL('./ki-tester/protocol.jsonl', import.meta.url);
/** Versionen des Ablaufs der KI-Tester, deren Läufe für die Levelliste zählen (Ticket 16: Ablauf 2). */
export const ZAEHLENDE_ABLAEUFE = ['2'];
/** Läufe, in denen die KI-Tester die neuen Level des Austauschs beurteilen (Tickets 23–26). */
export const ERSATZ_LAEUFE = /^ersatz-/;
/** Läufe, in denen die KI-Tester die Level des Ausbaus beurteilen (.scratch/500-level/). */
export const AUSBAU_LAEUFE = /^ausbau-/;
/**
 * Läufe, deren Urteile für die Levelliste zählen: die der Prüfliste (pruefung-…, Ticket 16), die des Austauschs
 * (ersatz-…, Tickets 23–26) und die des Ausbaus (ausbau-…); Probe- und Eichläufe nicht.
 */
export const ZAEHLENDE_LAEUFE = /^(pruefung|ersatz|ausbau)-/;

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
 * prueflisteErledigt, prueflisteFormel, behalten, ausbau }.
 */
export const ladeLevelliste = () => JSON.parse(readFileSync(DATEI, 'utf8'));

/** So viel Gefühl hat ein behaltenes Level im Mittel über alle Urteile mindestens (Regel stark, Ticket 24). */
export const MIN_GEFUEHL_BEHALTEN = 4;

/** Alle Einträge des Protokolls, nicht nur die zählenden (Text: eine JSON-Zeile je Eintrag; Vorgabe die Datei). */
export function alleUrteile(text = readFileSync(PROTOKOLL, 'utf8')) {
  return text.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
}

/**
 * Regel stark (Entscheide des Nutzers und des Koordinators vom 18.10.2026, Ticket 24): Ein Level darf unter dem Grund
 * „behalten nach Urteil der KI-Tester“ im Spiel bleiben, wenn jedes Urteil im Protokoll zu ihm (Ablauf 1 und 2, jeder
 * Lauf, auch als Anker) bei beiden KI-Testern einen Aha-Moment und keinen Begriff der Ablehnung hat, das Gefühl im
 * Mittel über alle Urteile beider KI-Tester mindestens MIN_GEFUEHL_BEHALTEN ist und mindestens ein Urteil aus Ablauf 2
 * stammt. name: Name des Levels; eintraege: alle Einträge des Protokolls (alleUrteile).
 * Rückgabe: { stark, maengel: Texte, gefuehl: Mittel oder null, urteile: Zahl der Urteile }.
 */
export function stark(name, eintraege) {
  const u = eintraege.filter(e => e.level.name === name);
  const je = u.flatMap(e => TESTERS.map(t => e.urteile[t]));
  const gefuehl = je.length ? je.reduce((s, x) => s + x.gefuehl, 0) / je.length : null;
  const maengel = [
    ...(!u.length ? ['kein Urteil'] : []),
    ...(u.length && !u.some(e => e.ablauf === '2') ? ['kein Urteil aus Ablauf 2'] : []),
    ...u.flatMap(e => TESTERS.filter(t => !e.urteile[t].aha.ja).map(t => `${e.lauf}: ${t} ohne Aha-Moment`)),
    ...u.flatMap(e => TESTERS.filter(t => e.urteile[t].ablehnung.length)
      .map(t => `${e.lauf}: ${t} nennt ${e.urteile[t].ablehnung.join(', ')}`)),
    ...(gefuehl !== null && gefuehl < MIN_GEFUEHL_BEHALTEN ? [`Gefühl im Mittel ${gefuehl}`] : []),
  ];
  return { stark: !maengel.length, maengel, gefuehl, urteile: u.length };
}

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
 * Zählt ein Eintrag des Protokolls für die Levelliste? Ablauf 2, ein Lauf der Prüfliste (pruefung-…), des Austauschs
 * (ersatz-…) oder des Ausbaus (ausbau-…), kein Anker.
 */
export const zaehlt = (e) => ZAEHLENDE_ABLAEUFE.includes(e.ablauf) && ZAEHLENDE_LAEUFE.test(e.lauf) && !e.level.anker;

/** Die zählenden Einträge des Protokolls (Text mit einer JSON-Zeile je Eintrag, Vorgabe protocol.jsonl). */
export function zaehlendeUrteile(text = readFileSync(PROTOKOLL, 'utf8')) {
  return alleUrteile(text).filter(zaehlt);
}

/** Die Namen der Level des Ausbaus in der Reihenfolge ihrer Aufnahme (ausbau in levelliste.json), leer vor ihm. */
export const ausbauNamen = () => ladeLevelliste().ausbau ?? [];

/**
 * Die Level im Spiel, wie die Regeln der Levelliste sie zählen (Tickets 15 und 23): zuerst die der heutigen
 * Reihenfolge, die noch im Spiel stehen, in dieser Reihenfolge, dann die neuen aus dem Austausch in der Reihenfolge im
 * Spiel, dann die des Ausbaus in der Reihenfolge der Namen in ausbau. main: die Level nach dem Tutorial (Vorgabe aus
 * LEVELS); ausbau: die Namen der Level des Ausbaus (Vorgabe aus levelliste.json). Rückgabe { levels, heute: je Level
 * sein heutiger Platz (1–150) oder null bei einem neuen, ausbau: je Level, ob es zum Ausbau gehört }.
 */
export function imSpiel(main = L.LEVELS.slice(L.TUTORIAL_COUNT), ausbau = ausbauNamen()) {
  const alt = HEUTIGE_REIHENFOLGE.map(name => main.find(l => l.name === name)).filter(Boolean);
  const neu = main.filter(l => heutigerPlatz(l.name) === null && !ausbau.includes(l.name));
  const dazu = ausbau.map(name => main.find(l => l.name === name)).filter(Boolean);
  return {
    levels: [...alt, ...neu, ...dazu],
    heute: [...alt.map(l => heutigerPlatz(l.name)), ...neu.map(() => null), ...dazu.map(() => null)],
    ausbau: [...alt.map(() => false), ...neu.map(() => false), ...dazu.map(() => true)],
  };
}

/**
 * Die Reihenfolge aus den Schwierigkeiten (werte[i]: Schwierigkeit des Levels i, heute[i]: sein heutiger Platz oder
 * null bei einem neuen Level, Vorgabe i + 1; die Indizes in der heutigen Reihenfolge, die neuen danach). zurFormel:
 * Indizes von Leveln der Prüfliste, denen beide KI-Tester zustimmen; sie stehen nach der Formel wie die übrigen, auch
 * wenn sie weiter als MAX_WANDERN Plätze wandern. Ein neues Level wandert nicht, es steht immer nach der Formel.
 * fest[i]: bei einem Level der Prüfliste mit Entscheid der Platz der Formel beim Entscheid (Ticket 26), sonst
 * undefined; an ihm misst sich, ob es auf der Prüfliste steht, damit der Entscheid fest bleibt, auch wenn ein Austausch
 * seine Formel näher an den heutigen Platz rückt.
 * Rückgabe je Index, Plätze ab 1: { formel: Platz nach der Formel, platz: neuer Platz, bleibt: Map Index → 'Formel'
 * (Prüfliste) oder 'Reihenfolge' (warum es am heutigen Platz bleibt), pruefliste: Indizes, die nach der Formel (bzw.
 * dem festen Platz) weiter als MAX_WANDERN Plätze wandern würden }.
 */
export function ordne(werte, zurFormel = new Set(), heute = werte.map((_, i) => i + 1), fest = []) {
  const n = werte.length, nachWert = werte.map((_, i) => i).sort((i, j) => werte[i] - werte[j] || i - j);
  const formel = new Array(n);
  nachWert.forEach((i, r) => { formel[i] = r + 1; });
  const weit = (i, p) => heute[i] !== null && Math.abs(p - heute[i]) > MAX_WANDERN;
  const pruefliste = nachWert.filter(i => weit(i, fest[i] ?? formel[i]));
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
 * von, bis: nur die Seiten von bis bis (ab 0), etwa die, die ein Zug ändert.
 */
export function haeufungen(folge, haupt, geduldet, von = 0, bis = Infinity) {
  const liste = [];
  for (let gruppe = von; gruppe <= Math.min(bis, Math.ceil(folge.length / 10) - 1); gruppe++) {
    const je = {};
    for (let p = 10 * gruppe; p < Math.min(10 * gruppe + 10, folge.length); p++) {
      const i = folge[p];
      if (haupt[i] && !geduldet.has(i)) (je[haupt[i]] ??= []).push(i);
    }
    for (const [begriff, mit] of Object.entries(je)) {
      if (mit.length > HAUPT_KERNIDEE_JE_10) liste.push({ gruppe, begriff, mit });
    }
  }
  return liste;
}

/**
 * Löst die Häufungen der Haupt-Kernidee auf (Entscheide des Nutzers vom 17.10.2026, Ticket 16), eine nach der anderen,
 * die vorderste zuerst. Ein Level rückt dafür innerhalb seines Grads um höchstens weit Plätze (MAX_ENTZERREN, im
 * Ausbau MAX_ENTZERREN_AUSBAU, siehe maxEntzerren); die Level dazwischen rücken je einen Platz zu seinem alten hin. Ein
 * Zug muss die Häufung auflösen, darf keine neue schaffen und muss zulaessig(folge) bestehen (die übrigen Regeln, siehe
 * reihenfolge). Wahl unter den Zügen:
 *   1. zuerst Züge der betroffenen Level;
 *   2. lässt sich die Häufung so nicht auflösen, Züge anderer Level derselben oder einer Nachbarseite, dabei ein Level
 *      der Duldungsliste vor einem anderen;
 *   3. dann der kürzeste Zug, dann der des Levels auf dem späteren Platz, dann der nach hinten.
 * Ist die Häufung um mehr als ein Level zu gross (etwa 4-mal dieselbe Haupt-Kernidee im Ausbau), löst kein einzelner Zug
 * sie auf. Dann gelten mehrere Züge, die sie je verkleinern und am Ende auflösen; genommen die erste solche Folge nach
 * derselben Wahl, Zug für Zug.
 * folge: Indizes nach Platz, grad je Index, haupt: Haupt-Kernidee je Index oder null, geduldet: Set der Indizes auf
 * der Duldungsliste. Rückgabe: { folge, zuege: [{ i, von, nach }] mit Plätzen ab 0, offen: die Häufungen, die sich so
 * nicht auflösen lassen }.
 */
export function entzerre(folge, grad, haupt, geduldet, zulaessig = () => true, weit = MAX_ENTZERREN) {
  const gleich = (x, y) => x.gruppe === y.gruppe && x.begriff === y.begriff;
  // Die gültigen Züge gegen die Häufung h in neu, nach der Wahl oben geordnet; rest: wie oft h danach noch vorkommt.
  // nurBetroffene: nur Züge der betroffenen Level (die erste Wahl, spart die übrigen Proben)
  const moeglich = (neu, h, nurBetroffene) => {
    const vorher = haeufungen(neu, haupt, geduldet), seiten = new Set([h.gruppe - 1, h.gruppe, h.gruppe + 1]);
    const alle = [];
    for (const i of neu.filter((j, p) => h.mit.includes(j) || (!nurBetroffene && seiten.has(Math.floor(p / 10))))) {
      const von = neu.indexOf(i);
      for (let s = 1; s <= weit; s++) {
        for (const nach of [von + s, von - s]) {
          if (nach < 0 || nach >= neu.length || grad[neu[nach]] !== grad[i]) continue;
          // Ein Zug ändert nur die Seiten zwischen von und nach; die übrigen Häufungen bleiben wie vorher
          const a = Math.floor(Math.min(von, nach) / 10), b = Math.floor(Math.max(von, nach) / 10);
          const probe = verschiebe(neu, von, nach);
          const danach = [...vorher.filter(x => x.gruppe < a || x.gruppe > b),
            ...haeufungen(probe, haupt, geduldet, a, b)];
          const rest = danach.find(x => gleich(x, h)) ?? null;
          const neueHaeufung = danach.some(x => !gleich(x, h) && !vorher.some(y => gleich(x, y)));
          if ((rest && rest.mit.length >= h.mit.length) || neueHaeufung || !zulaessig(probe)) continue;
          const rang = [h.mit.includes(i) ? 0 : 1, geduldet.has(i) ? 0 : 1, s, -von, -nach];
          alle.push({ i, von, nach, probe, rest, rang });
        }
      }
    }
    const vor = (a, b) => {
      const k = a.rang.findIndex((x, j) => x !== b.rang[j]);
      return k < 0 ? 0 : a.rang[k] - b.rang[k];
    };
    return alle.sort(vor);
  };
  // Die erste Folge von Zügen, die h auflöst, oder null; höchstens VORAUSSCHAU Stellungen je Häufung, sonst verzweigt
  // eine unlösbare Häufung zu stark (jede Stellung hat Hunderte Züge)
  let budget;
  const loese = (neu, h) => {
    if (budget-- <= 0) return null;
    const betroffen = moeglich(neu, h, true).find(z => !z.rest);
    if (betroffen) return [betroffen];
    const zuege = moeglich(neu, h, false), ganz = zuege.find(z => !z.rest);
    if (ganz) return [ganz];
    for (const z of zuege) {
      const weiter = loese(z.probe, z.rest);
      if (weiter) return [z, ...weiter];
      if (budget <= 0) break;
    }
    return null;
  };
  let neu = [...folge];
  const zuege = [], offen = [];
  for (;;) {
    const h = haeufungen(neu, haupt, geduldet).find(x => !offen.some(o => gleich(o, x)));
    if (!h) return { folge: neu, zuege, offen: haeufungen(neu, haupt, geduldet) };
    budget = VORAUSSCHAU;
    const folgeZuege = loese(neu, h);
    if (!folgeZuege) offen.push(h);
    for (const z of folgeZuege ?? []) {
      neu = z.probe;
      zuege.push({ i: z.i, von: z.von, nach: z.nach });
    }
  }
}

/**
 * Steigt das Mittel der Schwierigkeit je 10 Level, mit höchstens TOLERANZ_MITTEL Punkten Rückschritt? Nur volle Seiten
 * zählen: Eine angefangene letzte Seite gibt es nur zwischen den Gruppen des Ausbaus, und ihr Mittel aus wenigen Leveln
 * ist zufällig (Ticket 06).
 */
export function mittelSteigt(folge, werte) {
  return !fallendeSeiten(folge, werte).length;
}

/** Die vollen Seiten (ab 0), deren Mittel um mehr als TOLERANZ_MITTEL Punkte unter dem der vorigen liegt. */
export function fallendeSeiten(folge, werte) {
  const mittel = zehner(folge).filter(z => z.length === 10).map(z => z.reduce((s, i) => s + werte[i], 0) / 10);
  return mittel.flatMap((m, k) => (k && m < mittel[k - 1] - TOLERANZ_MITTEL ? [k] : []));
}

/**
 * Reihenfolge und Grade mit den Urteilen der KI-Tester (Tickets 16 und 23). werte[i], namen[i]: Schwierigkeit und Name
 * des Levels i; heute[i]: sein heutiger Platz oder null bei einem neuen Level (Vorgabe i + 1, siehe imSpiel und
 * ordne); kandidat[i]: bei einem neuen Level der Name, unter dem die KI-Tester es beurteilt haben (kandidatName in
 * leveldaten.mjs). urteile: die zählenden Einträge des Protokolls. Urteile zu Leveln, die es nicht (mehr) gibt, zählen
 * nicht; ein Fehler ist ein Urteil zu einem heutigen Level ausserhalb der Prüfliste, ein Lauf ersatz-… zu einem
 * heutigen Level oder ein anderer Lauf zu einem neuen und ein zweites Urteil zum selben Level. Für die Häufung der
 * Haupt-Kernidee: haupt[i] (Haupt-Kernidee oder null) und geduldet(i, grad, ki) (steht das Level mit diesem Grad und
 * Urteil auf der Duldungsliste?); ohne haupt keine Häufungsregel. formelEntscheid: je Name eines Levels der Prüfliste
 * der Platz der Formel, mit dem über seine Zustimmung entschieden ist (levelliste.json, prueflisteFormel); siehe unten.
 * Rückgabe: wie ordne, dazu basis (Folge vor den eigenen Korrekturen), korrigiert (nach ihnen), folge (nach der
 * Häufungsregel; Indizes nach Platz), zuege und offen (der Häufungsregel, siehe entzerre), grad (je Index), zurFormel
 * (Set der Level der Prüfliste, denen beide zustimmen) und ki: Map Index →
 * { eintrag, neu, je, zurFormel, formelEntscheid, abgelehnt, gruende, verschiebung } (bei einem neuen Level je: null).
 * Mit dem Ausbau (ausbau[i]: gehört das Level i zum Ausbau, siehe imSpiel und Kopf): ordne und die Urteile zum Bestand
 * rechnen nur unter dem Bestand, platz, bleibt, pruefliste und die formel eines Levels des Bestands also mit Plätzen
 * unter ihm; ein Level des Ausbaus hat als formel den Platz, an dem es eingefügt ist (fuegeEin), und braucht ein Urteil
 * aus einem Lauf ausbau-…. basis ist die ganze Folge vor allen Korrekturen, eingefuegt die mit den Korrekturen am
 * Bestand und den eingefügten Leveln des Ausbaus vor deren eigenen Korrekturen; ausbau kommt je Index zurück. Ohne
 * Ausbau ist alles wie vorher und eingefuegt dasselbe wie korrigiert.
 */
export function reihenfolge(werte, namen, urteile = [], {
  haupt = null, geduldet = () => false, heute = werte.map((_, i) => i + 1), kandidat = [], formelEntscheid = {},
  ausbau = [],
} = {}) {
  // Der Entscheid aus Ticket 16 bleibt fest (Entscheid des Nutzers vom 19.10.2026, Ticket 26): Ein Level mit festem
  // Platz der Formel beim Entscheid bleibt auf der Prüfliste, und zugestimmt wird an diesem Platz, auch wenn ein
  // Austausch die Formel verschiebt; ohne festen Platz gilt die Formel von heute
  const fest = namen.map((x, i) => (heute[i] !== null && Object.hasOwn(formelEntscheid, x) ? formelEntscheid[x]
    : undefined));
  const n = werte.length, alle = [...Array(n).keys()], imAusbau = alle.map(i => !!ausbau[i]);
  // Der Bestand rechnet unter sich (ordne mit seinen Indizes, hier auf alle übersetzt), der Ausbau kommt danach dazu
  const bestand = alle.filter(i => !imAusbau[i]), dazu = alle.filter(i => imAusbau[i]), m = bestand.length;
  const teil = (a) => bestand.map(i => a[i]);
  const ordneBestand = (zurFormel) => {
    const o = ordne(teil(werte), new Set([...zurFormel].map(i => bestand.indexOf(i))), teil(heute), teil(fest));
    const voll = (a) => alle.map(i => (imAusbau[i] ? undefined : a[bestand.indexOf(i)]));
    return {
      formel: voll(o.formel), platz: voll(o.platz), bleibt: new Map([...o.bleibt].map(([k, g]) => [bestand[k], g])),
      pruefliste: o.pruefliste.map(k => bestand[k]),
    };
  };
  const { formel, pruefliste } = ordneBestand(new Set());
  const ki = new Map();
  for (const eintrag of urteile) {
    const name = eintrag.level.name;
    const i = namen.includes(name) ? namen.indexOf(name) : kandidat.indexOf(name);
    if (i < 0) continue;
    const wo = `Urteil zu ${name} (${eintrag.lauf})`, neu = heute[i] === null;
    if (imAusbau[i] !== AUSBAU_LAEUFE.test(eintrag.lauf)) {
      throw new Error(`${wo}: ${imAusbau[i] ? 'ein Level des Ausbaus zählt nur aus einem Lauf ausbau-…'
        : 'ein Lauf ausbau-… beurteilt nur Level des Ausbaus'}`);
    }
    if (!imAusbau[i] && neu !== ERSATZ_LAEUFE.test(eintrag.lauf)) {
      throw new Error(`${wo}: ${neu ? 'ein neues Level zählt nur aus einem Lauf ersatz-…'
        : 'ein Lauf ersatz-… beurteilt nur neue Level'}`);
    }
    if (!neu && !pruefliste.includes(i)) throw new Error(`${wo}: das Level steht nicht auf der Prüfliste`);
    if (ki.has(i)) throw new Error(`${wo}: schon beurteilt in ${ki.get(i).eintrag.lauf}`);
    const beimEntscheid = fest[i] ?? formel[i];
    ki.set(i, neu ? { eintrag, neu, je: null, zurFormel: false } : {
      eintrag, neu, formelEntscheid: beimEntscheid, ...zustimmung(eintrag, eintrag.referenz.position, beimEntscheid),
    });
  }
  const zurFormel = new Set([...ki].filter(([, u]) => u.zurFormel).map(([i]) => i));
  const ordnung = ordneBestand(zurFormel);
  const basisBestand = [...bestand].sort((i, j) => ordnung.platz[i] - ordnung.platz[j]);
  const grad = gradeEntlang(basisBestand, werte, ordnung.bleibt);
  for (const i of dazu) grad[i] = gradVon(werte[i]);
  /** Die eigene Korrektur nach dem Urteil u; bis: Länge der Folge, in der das Level steht. */
  const korrektur = (i, u, bis) => {
    const { level, anker, urteile: je, ergebnis } = u.eintrag;
    // am alten Platz das Ergebnis aus dem Protokoll; am Platz der Formel (ein Level der Prüfliste mit Zustimmung oder
    // ein neues Level) dieselbe Regel mit dem Grad dort
    const r = !u.zurFormel && !u.neu ? ergebnis : merge({
      level: { ...level, anker: null }, anker, urteile: je,
      referenz: { art: 'Platz der Formel', position: formel[i], grad: grad[i], von: 1, bis },
    }).ergebnis;
    // ein abgelehntes Level hat nach der Regel von merge keine Verschiebung
    Object.assign(u, { abgelehnt: r.abgelehnt, gruende: r.gruende, verschiebung: r.verschiebung });
  };
  const verschiebungen = (wer) => new Map([...ki].filter(([i]) => wer(i)).map(([i, u]) => [i, u.verschiebung]));
  for (const [i, u] of ki) if (!imAusbau[i]) korrektur(i, u, m);
  const korrigiertBestand = korrigiere(basisBestand, grad, verschiebungen(i => !imAusbau[i]));
  // Der Ausbau: eingefügt vor allen Korrekturen (basis) und nach denen am Bestand (eingefuegt); von dort aus gilt die
  // eigene Korrektur eines Levels des Ausbaus
  const basis = fuegeEin(basisBestand, dazu, werte, grad, ordnung.bleibt);
  const eingefuegt = fuegeEin(korrigiertBestand, dazu, werte, grad, ordnung.bleibt);
  for (const i of dazu) formel[i] = eingefuegt.indexOf(i) + 1;
  for (const [i, u] of ki) if (imAusbau[i]) korrektur(i, u, n);
  const korrigiert = korrigiere(eingefuegt, grad, verschiebungen(i => imAusbau[i]));
  // Häufung der Haupt-Kernidee: Die Züge bleiben im Abschnitt des Grads, die Duldungsliste ändert sich dadurch nicht
  const aufListe = new Set(haupt ? basis.filter(i => geduldet(i, grad[i], ki.get(i))) : []);
  // Kein Zug darf die übrigen Regeln brechen: das Mittel je 10 Level, und ohne Ausbau bleibt jedes von den
  // KI-Testern korrigierte Level höchstens MAX_SHIFT Plätze von seinem Platz vor der Korrektur (zuWeitGilt; den Grad
  // sichert entzerre). Fällt das Mittel schon vor den Zügen auf einer Seite (eine Wahl des Ausbaus in der Suche),
  // sperrt das nicht jeden Zug: Ein Zug darf nur keine weitere Seite fallen lassen (Ticket 06)
  const r = { basis, eingefuegt, korrigiert, ki, ausbau: imAusbau };
  const schonGefallen = new Set(fallendeSeiten(korrigiert, werte));
  const zulaessig = (probe) => fallendeSeiten(probe, werte).every(k => schonGefallen.has(k))
    && (!zuWeitGilt(imAusbau) || !zuWeitKorrigiert({ ...r, folge: probe }).length);
  const { folge, zuege, offen } = haupt ? entzerre(korrigiert, grad, haupt, aufListe, zulaessig, maxEntzerren(imAusbau))
    : { folge: korrigiert, zuege: [], offen: [] };
  return { ...ordnung, ...r, formel, folge, zuege, offen, grad, zurFormel };
}

/**
 * Fügt die Level des Ausbaus nach der Formel in eine Folge des Bestands ein (siehe Kopf): jedes vor das erste Level des
 * Bestands, das nach der Formel steht (nicht in bleibt) und schwerer ist oder das einen höheren Grad hat; gibt es
 * keines, ans Ende. Untereinander stehen die Level des Ausbaus nach der Schwierigkeit, bei gleichem Wert in der
 * Reihenfolge von dazu. Davor steht so kein Level mit höherem Grad, dahinter keines mit niedrigerem (grad je Index, beim
 * Ausbau nach der Schwelle). Rückgabe: die neue Folge.
 */
export function fuegeEin(folge, dazu, werte, grad, bleibt) {
  const neu = [...folge], rang = (i) => GRADE.indexOf(grad[i]), imAusbau = new Set(dazu);
  const sortiert = [...dazu].sort((i, j) => werte[i] - werte[j] || dazu.indexOf(i) - dazu.indexOf(j));
  for (const i of sortiert) {
    const p = neu.findIndex(j => !imAusbau.has(j) && ((!bleibt.has(j) && werte[j] > werte[i]) || rang(j) > rang(i)));
    neu.splice(p < 0 ? neu.length : p, 0, i);
  }
  return neu;
}

/**
 * Gilt die Grenze für korrigierte Level (zuWeitKorrigiert)? Nur ohne Ausbau (ausbau: je Index, ob das Level zum Ausbau
 * gehört; Entscheid des Nutzers vom 22.10.2026, siehe Kopf).
 */
export const zuWeitGilt = (ausbau = []) => !ausbau.some(Boolean);

/**
 * Korrekturen der KI-Tester, die zu weit führen (Ticket 24, Review M1): Ein korrigiertes Level steht nach den
 * Korrekturen und am Ende (nach der Häufungsregel) höchstens MAX_SHIFT Plätze von seinem Platz davor (basis). Viele
 * Korrekturen nahe beieinander schieben einander: Wer an einem korrigierten Level vorbeirückt, verschiebt es um einen
 * Platz. r: das Ergebnis von reihenfolge ({ basis, korrigiert, folge, ki }, mit dem Ausbau dazu ausbau und eingefuegt).
 * Ein Level des Bestands zählt seine Plätze unter dem Bestand, wie ohne den Ausbau; ein Level des Ausbaus zählt sie in
 * der ganzen Folge, vom Platz davor in eingefuegt aus. Rückgabe: die Verstösse, je { i, davor, korrigiert, ende } mit
 * Plätzen ab 1 wie gezählt, nach dem Platz in basis.
 */
export function zuWeitKorrigiert({ basis, korrigiert, folge, ki, ausbau = [], eingefuegt = basis }) {
  const unter = (f, i) => (ausbau[i] ? f : f.filter(j => !ausbau[j]));
  const platz = (f, i) => unter(f, i).indexOf(i) + 1;
  const davor = (i) => (ausbau[i] ? eingefuegt : basis);
  return [...ki].filter(([, u]) => u.verschiebung).map(([i]) => i)
    .filter(i => [korrigiert, folge].some(f => Math.abs(platz(f, i) - platz(davor(i), i)) > MAX_SHIFT))
    .sort((i, j) => basis.indexOf(i) - basis.indexOf(j))
    .map(i => ({ i, davor: platz(davor(i), i), korrigiert: platz(korrigiert, i), ende: platz(folge, i) }));
}

/**
 * Die Plätze der Formel beim Entscheid über die Level der Prüfliste (prueflisteFormel in levelliste.json, Ticket 26):
 * Die bisherigen bleiben, wie sie sind, auch die von inzwischen entfernten Leveln; ein Level der Prüfliste mit einem
 * Urteil, aber ohne festen Platz (es kam später auf die Prüfliste) kommt mit seinem Platz der Formel von heute dazu,
 * in der Reihenfolge im Spiel wie die Prüfliste.
 * bisher: { Name: Platz } oder null; r: das Ergebnis von reihenfolge; namen[i]: Name des Levels i. Rückgabe wie bisher.
 */
export function festePlaetze(bisher, r, namen) {
  const alt = bisher ?? {};
  const dazu = r.pruefliste.filter(i => r.ki.has(i) && !r.ki.get(i).neu && !Object.hasOwn(alt, namen[i]))
    .sort((i, j) => r.folge.indexOf(i) - r.folge.indexOf(j));
  return { ...alt, ...Object.fromEntries(dazu.map(i => [namen[i], r.formel[i]])) };
}

/** Je 10 Level, also je Seite der Levelauswahl (PAGE_SIZE in index.html). */
export const zehner = (reihe) => Array.from({ length: Math.ceil(reihe.length / 10) },
  (_, k) => reihe.slice(10 * k, 10 * k + 10));
