// Werkzeug für den Ausbau auf 500 Level (.scratch/500-level/, Ticket 01): Kandidaten erzeugen und je Gruppe wählen.
// Die gewählten Level gehen an tools/ordne-level.mjs --ausbau, das sie nach der Formel einfügt und schreibt
// (levelliste.mjs, Kopf); dazwischen beurteilen die KI-Tester sie (Lauf ausbau-…).
//
// pool: Kandidaten aus dem Generator (tools/generator/) für Aufträge wie „mittel-mischziel“, Seeds start … start +
//   seeds - 1, verteilt in Blöcken auf --jobs Prozesse. Jedes gelieferte Level geht als JSON-Zeile { auftrag, seed,
//   level, schwierigkeit, spielwert, hauptKernidee, kernideen } an die Datei (angehängt; level wie in LEVELS, ohne
//   Namen; die Werte aus der Beurteilung des Generators, ungerundet). Dieselben Seeds liefern dieselben Level.
//   --schwierigkeit VON,BIS: die Ziel-Schwierigkeit der Aufträge wie bei generiere.mjs (etwa für das obere Ende von
//   „schwer“, das der Generator sonst selten trifft); die Zeile trägt sie dann als ziel.
//     LEISE_CPU=50 sh tools/leise.sh node tools/ausbau.mjs pool <auftrag …> --aus <datei> [--seed S] [--seeds M]
//       [--jobs N] [--schwierigkeit VON,BIS]
// wahl: wählt aus Pool-Dateien die neuen Level einer Gruppe (1–10). Der Bedarf je Grad ist der Bestand nach der Gruppe
//   (Tabelle der Spec, ZIEL und GRUPPEN) weniger die Level im Spiel; was einer Gruppe fehlte, holt die nächste so von
//   selbst nach. Ein Kandidat kommt in Frage, wenn sein Grad nach der Schwelle der seines Auftrags ist, seine
//   Schwierigkeit im Bereich, den sein Grad im Spiel abdeckt, ab „mittel“ mit Haupt-Kernidee und Mindest-Spielwert, in
//   „leicht“ ohne zweiten unabhängigen Teil mit 2 und mehr drehbaren Elementen, ab „mittel“ ohne einen mit drehbarem
//   Element (ZWEITER_TEIL_HOECHSTENS, ZWEITER_TEIL_AB_MITTEL: Zerfall, wie ihn die KI-Tester lesen), und er keinem
//   Level im Spiel zu ähnlich ist (aehnlichkeit.mjs). Je Grad wird dann einer nach dem anderen gewählt: der, dessen
//   Schwierigkeit am weitesten von den Leveln dieses Grads im Spiel und den schon gewählten liegt (so verteilen sie
//   sich über den Grad), bei gleichem Abstand der mit dem höheren Spielwert; keinem gewählten zu ähnlich, der Grad
//   sinkt nie, das Mittel je 10 Level steigt, und um seinen Platz häuft sich seine Haupt-Kernidee nicht. Danach sucht
//   die Wahl Tausche, bis mit der Häufungsregel keine Häufung offen bleibt (siehe unten).
//   --behalte <datei>: eine frühere Wahl (Ausgabe von wahl), deren Level gesetzt sind, etwa nach einer Ablehnung durch
//   die KI-Tester ohne die abgelehnten; die Wahl füllt nur den Rest. --ohne <name,…>: Kandidaten (Name bei den
//   KI-Testern, „Kandidat <Abdruck>“), die nicht in Frage kommen. --auch-gesetzte: Reicht das nicht, darf die Suche
//   auch Level aus --behalte tauschen (seltener als die übrigen; sie brauchen dann ein Urteil). Ausgabe: eine
//   JSON-Liste { auftrag, seed, level } für ordne-level.mjs --ausbau, mit schwierigkeit (der Ziel-Schwierigkeit), wo
//   der Pool sie trägt (ohne Namen; die kommen nach dem Urteil der KI-Tester dazu).
//     LEISE_CPU=50 sh tools/leise.sh node tools/ausbau.mjs wahl <gruppe> --pool <datei>[,<datei> …] --aus <datei>
//       [--behalte <datei>] [--ohne <name,…>] [--auch-gesetzte] [--nur-beurteilt] [--schritte N] [--zufall N]
//   --nur-beurteilt: nur Kandidaten mit zählendem Urteil (Läufe ausbau-…), ohne Ablehnung in --ohne; so lässt sich
//   eine Gruppe aus einem Vorrat beurteilter Kandidaten zusammenstellen, ohne dass neue Urteile neue Korrekturen
//   bringen. --schritte N: Schritte der Suche (sonst SUCHE_SCHRITTE); --zufall N: ein anderer Startwert ihres Zufalls.
// bedarf: der Bestand je Grad im Spiel, nach jeder Gruppe und der Bedarf der nächsten.
//     node tools/ausbau.mjs bedarf
import { fork } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { L } from './solver.mjs';
import { GRADE } from './beurteilung/index.mjs';
import { gradVon } from './beurteilung/grad.mjs';
import { MINDEST_SPIELWERT } from './beurteilung/spielwert.mjs';
import { beurteileAlle } from './beurteilung/parallel.mjs';
import { kandidatName } from './leveldaten.mjs';
import { zuAehnlich } from './aehnlichkeit.mjs';
import { gruppen } from './beurteilung/ausschluesse/zerfall.mjs';
import { feldformVon } from './beurteilung/feldform.mjs';
import { gedeckelt, deckelText } from './deckel.mjs';
import {
  HAUPT_KERNIDEE_JE_10, imSpiel, ladeLevelliste, mittelSteigt, reihenfolge, zaehlendeUrteile, zuWeitKorrigiert,
} from './levelliste.mjs';

/** Die Verteilung der Grade nach dem Ausbau (Spec, Entscheid des Nutzers vom 20.10.2026): 500 Level. */
export const ZIEL = { leicht: 85, mittel: 265, schwer: 105, 'sehr schwer': 45 };
/** So viele Gruppen zu je 35 Leveln (Tickets 02–11). */
export const GRUPPEN = 10;
/** Der Bestand vor dem Ausbau (nach Ticket 25 der Spec der Beurteilung). */
export const VORHER = { leicht: 31, mittel: 74, schwer: 32, 'sehr schwer': 13 };
const BLOCK = 25;
/**
 * Vorprüfung auf Zerfall, wie ihn die KI-Tester lesen (Gruppe 1, Lauf ausbau-1): Die Regel der Beurteilung schliesst
 * erst aus, wenn der zweite unabhängige Teil 3 drehbare Elemente hat (MIN_ELEMENTE in zerfall.mjs). Die KI-Tester
 * lehnten aber alle 5 Kandidaten ab, deren zweiter Teil genau 2 hat, und von den übrigen 9 mit 2 nannte einer von
 * beiden bei 3 Zerfall; bei keinem Kandidaten mit einem zweiten Teil unter 2 nannte einer Zerfall. Darum kommt nur in
 * Frage, wessen zweiter Teil weniger drehbare Elemente hat, auch in „leicht“: Dort zählen Füllteil und Zerfall zwar
 * nicht, doch beide leichten Kandidaten mit einem zweiten Teil aus 2, die die KI-Tester in Gruppe 1 sahen, fanden sie
 * mühsam (Gefühl im Mittel 2,5).
 */
const ZWEITER_TEIL_HOECHSTENS = 1;
/**
 * Ab „mittel“ strenger (Gruppe 2, Lauf ausbau-2-2): Ein zweiter Teil mit einem einzigen drehbaren Element, meist eine
 * Quelle über einen Spiegel zu einem Ziel, dessen zweite Farbe eine feste Quelle bringt, lehnten beide KI-Tester
 * dreimal als Füllteil ab (in „sehr schwer“ und zweimal in „mittel“), bei vier anderen nicht. Füllteil gilt erst ab
 * „mittel“; dort darf es darum keinen zweiten Teil mit drehbarem Element geben.
 */
const ZWEITER_TEIL_AB_MITTEL = 0;
/** So viele Schritte hat die Suche gegen offene Häufungen (wahl) höchstens, ohne --schritte. */
const SUCHE_SCHRITTE = 4000;
/** Paartausch nach der Suche (wahl): höchstens so viele Runden, je Runde die so vielen Kandidaten mit dem höchsten
 * Spielwert. */
const PAAR_RUNDEN = 5, PAAR_KANDIDATEN = 12;
/** Mehrfachtausch nach dem Paartausch (wahl): höchstens so viele Level auf einmal, so viele Versuche je Zahl. */
const MEHR_HOECHSTENS = 6, MEHR_VERSUCHE = 60;

/**
 * Der Bestand je Grad nach der Gruppe k (0 = vor dem Ausbau): je Grad VORHER plus der Anteil k / GRUPPEN der neuen
 * Level, auf ganze Level nach den grössten Resten verteilt, so dass jede Gruppe 35 Level bringt (Tabelle der Spec).
 */
export function bestandNach(k) {
  const neu = GRADE.map(g => (ZIEL[g] - VORHER[g]) * k / GRUPPEN), ganz = neu.map(Math.floor);
  const summe = GRADE.reduce((s, g) => s + ZIEL[g] - VORHER[g], 0) * k / GRUPPEN;
  const reste = neu.map((x, j) => [x - ganz[j], j]).sort((a, b) => b[0] - a[0]);
  const fehlen = Math.round(summe) - ganz.reduce((s, x) => s + x, 0);
  for (let r = 0; r < fehlen; r++) ganz[reste[r][1]]++;
  return Object.fromEntries(GRADE.map((g, j) => [g, VORHER[g] + ganz[j]]));
}

const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf(name); return i < 0 ? def : args.splice(i, 2)[1]; };
const fail = (text) => { console.error(text); process.exit(1); };
const zahl = (x, n = 1) => x.toFixed(n).replace('.', ',');
const leseJsonl = (datei) => readFileSync(datei, 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
const MAIN = L.LEVELS.slice(L.TUTORIAL_COUNT);
const jeGrad = (levels) => Object.fromEntries(GRADE.map(g => [g, levels.filter(l => l.grad === g).length]));

if (process.env.AUSBAU_WORKER) {
  // Prozess für pool: rechnet Blöcke von Seeds eines Auftrags und schickt die Level zurück
  const [{ generiere, angebot }, { feldformVon }] = await Promise.all(
    ['./generator/index.mjs', './beurteilung/feldform.mjs'].map(f => import(f)));
  const feldform = feldformVon({}), auftraege = new Map(angebot().map(a => [a.name, a]));
  process.on('message', ({ auftrag, from, to, schwierigkeit }) => {
    const level = [], gruende = {};
    for (let seed = from; seed < to; seed++) {
      const { level: l, beurteilung: b, grund } = generiere({
        ...auftraege.get(auftrag), seed, feldform, schwierigkeit });
      if (!l) { gruende[grund] = (gruende[grund] || 0) + 1; continue; }
      level.push({ auftrag, seed, ...(schwierigkeit ? { ziel: schwierigkeit } : {}), level: l,
        schwierigkeit: b.schwierigkeit.wert, spielwert: b.spielwert.wert,
        hauptKernidee: b.hauptKernidee.begriff, kernideen: [...new Set(b.kernideen.map(k => k.begriff))] });
    }
    process.send({ auftrag, level, gruende });
  });
} else if (args[0] === 'pool') await pool();
else if (args[0] === 'wahl') await wahl();
else if (args[0] === 'bedarf') bedarf();
else if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  fail('Aufruf: node tools/ausbau.mjs pool|wahl|bedarf … (siehe Kopf)');
}

async function pool() {
  const aus = flag('--aus', null), start = Number(flag('--seed', 1)), seeds = Number(flag('--seeds', 400));
  const ziel = flag('--schwierigkeit', null)?.split(',').map(Number) ?? null;
  if (ziel && !(ziel.length === 2 && ziel.every(Number.isFinite) && ziel[0] <= ziel[1])) {
    fail(`--schwierigkeit VON,BIS mit VON ≤ BIS, nicht ${ziel.join(',')}`);
  }
  const jobs = Number(flag('--jobs', Math.max(1, os.cpus().length >> 1)));
  const auftraege = args.slice(1);
  const { angebot } = await import('./generator/index.mjs');
  const bekannt = angebot().map(a => a.name);
  if (!aus || !auftraege.length || ![start, seeds, jobs].every(Number.isInteger)) {
    fail('Aufruf: node tools/ausbau.mjs pool <auftrag …> --aus <datei> [--seed S] [--seeds M] [--jobs N]');
  }
  const fremd = auftraege.filter(a => !bekannt.includes(a));
  if (fremd.length) fail(`Unbekannte Aufträge: ${fremd.join(', ')}; bekannt: ${bekannt.join(', ')}`);
  if (!gedeckelt()) fail(`Nur über tools/leise.sh mit höchstens dem Deckel (${deckelText()})`);
  const tasks = auftraege.flatMap(auftrag => Array.from({ length: Math.ceil(seeds / BLOCK) }, (_, k) => ({
    auftrag, from: start + k * BLOCK, to: Math.min(start + (k + 1) * BLOCK, start + seeds), schwierigkeit: ziel })));
  const ergebnis = new Map(auftraege.map(a => [a, { level: [], gruende: {}, offen: 0 }]));
  for (const t of tasks) ergebnis.get(t.auftrag).offen++;
  const t0 = Date.now();
  await new Promise((resolve, reject) => {
    let next = 0, alive = Math.min(jobs, tasks.length);
    for (let i = 0; i < alive; i++) {
      const w = fork(fileURLToPath(import.meta.url), [], { env: { ...process.env, AUSBAU_WORKER: '1' } });
      const feed = () => (next < tasks.length ? w.send(tasks[next++]) : w.disconnect());
      w.on('message', (m) => {
        const e = ergebnis.get(m.auftrag);
        e.level.push(...m.level);
        for (const [g, x] of Object.entries(m.gruende)) e.gruende[g] = (e.gruende[g] || 0) + x;
        if (--e.offen === 0) console.error(`  ${m.auftrag}: ${e.level.length} Level aus ${seeds} Seeds`);
        feed();
      });
      w.on('exit', (code, signal) => (code || signal ? reject(new Error(`Prozess beendet: ${code ?? signal}`))
        : --alive || resolve()));
      feed();
    }
  });
  // in fester Reihenfolge (Auftrag, Seed), gleich wie die Arbeit verteilt war
  for (const a of auftraege) {
    const zeilen = ergebnis.get(a).level.sort((x, y) => x.seed - y.seed).map(x => JSON.stringify(x) + '\n');
    if (zeilen.length) appendFileSync(aus, zeilen.join(''));
  }
  console.error(`pool: ${[...ergebnis.values()].reduce((s, e) => s + e.level.length, 0)} Level nach ${aus}, `
    + `${zahl((Date.now() - t0) / 1000)} s`);
}

function bedarf() {
  const im = jeGrad(MAIN);
  console.log(`Im Spiel: ${MAIN.length} Level, ${GRADE.map(g => `${g} ${im[g]}`).join(', ')}`);
  for (let k = 1; k <= GRUPPEN; k++) {
    const b = bestandNach(k), n = GRADE.reduce((s, g) => s + b[g], 0);
    const fehlt = GRADE.map(g => Math.max(0, b[g] - im[g]));
    console.log(`  nach Gruppe ${k} (Ticket ${String(k + 1).padStart(2, '0')}): ${n} Level, `
      + `${GRADE.map(g => b[g]).join(' / ')}; noch nötig ${fehlt.join(' / ')}`);
  }
}

/** Drehbare Elemente im zweitgrössten unabhängigen Teil der Lösungsstellung (gruppen in zerfall.mjs), 0 bei einem Teil. */
function zweiterTeil(level) {
  const zwischenstand = new Map();
  const ctx = { level, feldform: feldformVon(level), grad: GRADE[1],
    merke: (k, rechne) => (zwischenstand.has(k) ? zwischenstand.get(k) : zwischenstand.set(k, rechne()).get(k)) };
  return gruppen(ctx)[1]?.elemente.length ?? 0;
}

async function wahl() {
  const gruppe = Number(args[1]), aus = flag('--aus', null), pools = flag('--pool', null);
  const behalteDatei = flag('--behalte', null), ohne = (flag('--ohne', '') || '').split(',').filter(Boolean);
  const auchGesetzte = args.includes('--auch-gesetzte'), nurBeurteilt = args.includes('--nur-beurteilt');
  const suchSchritte = Number(flag('--schritte', SUCHE_SCHRITTE)), startwert = Number(flag('--zufall', 0));
  if (!(gruppe >= 1 && gruppe <= GRUPPEN) || !aus || !pools || !(Number.isInteger(suchSchritte) && suchSchritte >= 0)
    || !Number.isInteger(startwert)) {
    fail('Aufruf: node tools/ausbau.mjs wahl <gruppe> --pool <datei>[,<datei> …] --aus <datei> [--behalte <datei>] '
      + '[--ohne <name,…>] [--auch-gesetzte] [--nur-beurteilt] [--schritte N] [--zufall N]');
  }
  const ziel = bestandNach(gruppe), im = jeGrad(MAIN);
  // Das Spiel wie in den Tests der Levelliste: Bestand und Ausbau, mit den zählenden Urteilen der KI-Tester
  const liste = ladeLevelliste(), urteile = zaehlendeUrteile();
  const { levels, heute, ausbau } = imSpiel(MAIN);
  const t0 = Date.now();
  const b = await beurteileAlle(levels.map(level => ({ level, opts: { grad: level.grad, teuer: true } })));
  const duldung = new Set(Object.values(liste.duldung).flat());
  // Die Kandidaten aus den Pools, ohne doppelte Level; die schon gesetzten aus --behalte
  const gesetzt = behalteDatei ? JSON.parse(readFileSync(behalteDatei, 'utf8')) : [];
  const roh = pools.split(',').flatMap(leseJsonl);
  const gesehen = new Set(), kandidaten = [];
  // Kandidaten mit zählendem Urteil (Läufe ausbau-…), etwa gut beurteilte, die ein Tausch wieder herausnahm: Sie
  // brauchen kein neues Urteil, die Suche nimmt sie darum lieber (abgelehnte und schwache stehen in --ohne)
  const beurteilt = new Set(urteile.filter(e => /^ausbau-/.test(e.lauf)).map(e => e.level.name));
  for (const k of roh) {
    const name = kandidatName(k.level);
    if (gesehen.has(name)) continue;
    gesehen.add(name);
    kandidaten.push({ ...k, name, grad: k.auftrag.replace(/-[a-z]+$/, ''), beurteilt: beurteilt.has(name) });
  }
  const setze = gesetzt.map((g) => {
    const k = kandidaten.find(x => x.name === kandidatName(g.level));
    if (!k) fail(`--behalte: ${kandidatName(g.level)} (${g.auftrag} Seed ${g.seed}) steht in keinem Pool`);
    return k;
  });
  const gruende = {};
  const bereich = Object.fromEntries(GRADE.map((g) => {
    const w = levels.flatMap((l, i) => (l.grad === g ? [b[i].schwierigkeit.wert] : []));
    return [g, [Math.min(...w), Math.max(...w)]];
  }));
  const verwirf = (_, grund) => { gruende[grund] = (gruende[grund] || 0) + 1; return false; };
  const inFrage = kandidaten.filter((k) => {
    if (setze.includes(k)) return false;
    if (nurBeurteilt && !k.beurteilt) return verwirf(k, 'ohne Urteil (--nur-beurteilt)');
    if (ohne.includes(k.name)) return verwirf(k, 'ausgeschlossen (--ohne)');
    if (gradVon(k.schwierigkeit) !== k.grad) return verwirf(k, 'Grad nach der Schwelle anders als im Auftrag');
    // im Bereich, den der Grad im Spiel abdeckt: Am Rand lägen sonst die neuen Level am weitesten von allen und kämen
    // zuerst (etwa die leichtesten vor Platz 1)
    const [von, bis] = bereich[k.grad];
    if (k.schwierigkeit < von || k.schwierigkeit > bis) return verwirf(k, 'ausserhalb des Bereichs seines Grads im Spiel');
    if (k.grad !== GRADE[0] && (!k.hauptKernidee || k.spielwert < MINDEST_SPIELWERT)) {
      return verwirf(k, 'ohne Haupt-Kernidee oder unter dem Mindest-Spielwert');
    }
    if (zuAehnlich(k.level, L.LEVELS)) return verwirf(k, 'einem Level im Spiel zu ähnlich');
    if (zweiterTeil(k.level) > (k.grad === GRADE[0] ? ZWEITER_TEIL_HOECHSTENS : ZWEITER_TEIL_AB_MITTEL)) {
      return verwirf(k, `zweiter unabhängiger Teil mit ${k.grad === GRADE[0] ? '2 und mehr drehbaren Elementen'
        : 'drehbarem Element'} (Zerfall nach den KI-Testern)`);
    }
    return true;
  });
  // Die Reihenfolge mit den gewählten Leveln, wie reihenfolge sie rechnet (ohne Häufungsregel)
  const werte = b.map(x => x.schwierigkeit.wert), haupt = b.map(x => x.hauptKernidee.begriff);
  const namen = levels.map(l => l.name);
  const kandidat = levels.map((l, i) => (heute[i] === null ? kandidatName(l) : null));
  const geduldet = new Set(levels.flatMap((l, i) => (duldung.has(l.name) ? [i] : [])));
  /**
   * Die Reihenfolge mit den gewählten Leveln, wie reihenfolge sie rechnet; mitRegel: auch mit der Häufungsregel (teuer).
   * Rückgabe: { r, w (Schwierigkeit je Index), haupt (je Index), sinkt, mittel }. Während der Wahl (auffuellen) kommen
   * ans Ende Platzhalter ohne Haupt-Kernidee, schwerer als alle Level, bis die letzte Seite voll ist: Eine angefangene
   * letzte Seite mit wenigen Leveln hat ein zufälliges Mittel, das fällt, und dann lässt die Häufungsregel keinen Zug zu
   * (bei 151 Leveln bleiben so 7 Häufungen offen, bei 160 keine). Die Platzhalter stehen hinter allen Leveln und
   * verschieben keine Seite. Das Ergebnis der Wahl rechnet ohne sie, wie ordne-level.mjs.
   */
  const folgeMit = (wahl, { mitRegel = false, auffuellen = true } = {}) => {
    const n = levels.length + wahl.length, platzhalter = auffuellen ? (10 - (n % 10)) % 10 : 0;
    const dazu = [...wahl, ...Array.from({ length: platzhalter }, (_, j) => ({
      name: `Platzhalter ${j + 1}`, schwierigkeit: 1e6 + j, hauptKernidee: null }))];
    const w = [...werte, ...dazu.map(k => k.schwierigkeit)], h = [...haupt, ...dazu.map(k => k.hauptKernidee ?? null)];
    const r = reihenfolge(w, [...namen, ...dazu.map(k => k.name)], urteile, {
      heute: [...heute, ...dazu.map(() => null)], kandidat: [...kandidat, ...dazu.map(k => k.name)],
      formelEntscheid: liste.prueflisteFormel, ausbau: [...ausbau, ...dazu.map(() => true)],
      ...(mitRegel ? { haupt: h, geduldet: i => geduldet.has(i) } : {}),
    });
    const sinkt = r.folge.some((i, p) => p && GRADE.indexOf(r.grad[i]) < GRADE.indexOf(r.grad[r.folge[p - 1]]));
    return { r, w, haupt: h, sinkt, mittel: mittelSteigt(r.folge, w) };
  };
  /**
   * Häuft sich die Haupt-Kernidee des Levels i um seinen Platz? Im gleitenden Fenster zu 10 Leveln um ihn (4 davor, 5
   * danach) mehr als HAUPT_KERNIDEE_JE_10-mal, ohne die Duldungsliste. Anders als die Seiten verschiebt sich das Fenster
   * nicht, wenn weiter vorn ein Level dazukommt; die Seiten prüft am Ende die Häufungsregel.
   */
  const haeuftSich = (f, i) => {
    if (!f.haupt[i]) return false;
    const p = f.r.folge.indexOf(i), fenster = f.r.folge.slice(Math.max(0, p - 4), p + 6);
    return fenster.filter(j => f.haupt[j] === f.haupt[i] && !geduldet.has(j)).length > HAUPT_KERNIDEE_JE_10;
  };
  /** Die Wahl je Grad (siehe Kopf), ohne die Häufungsregel. Rückgabe: { gewaehlt, bericht }. */
  const waehle = () => {
    const gewaehlt = [...setze], bericht = [];
    for (const g of GRADE) {
      const noetig = Math.max(0, ziel[g] - im[g] - setze.filter(k => k.grad === g).length);
      const imGrad = levels.flatMap((l, i) => (l.grad === g ? [werte[i]] : []));
      let offen = inFrage.filter(k => k.grad === g);
      let dazu = 0;
      while (dazu < noetig && offen.length) {
        const schon = [...imGrad, ...gewaehlt.filter(k => k.grad === g).map(k => k.schwierigkeit)];
        const abstand = (k) => Math.min(...schon.map(w => Math.abs(w - k.schwierigkeit)));
        offen.sort((x, y) => abstand(y) - abstand(x) || y.spielwert - x.spielwert || x.seed - y.seed);
        const passt = offen.find((k) => {
          if (zuAehnlich(k.level, gewaehlt.map(x => x.level))) return verwirf(k, 'einem gewählten zu ähnlich');
          const f = folgeMit([...gewaehlt, k]);
          if (f.sinkt) return verwirf(k, 'Grad sinkt');
          if (!f.mittel) return verwirf(k, 'Mittel je 10 Level fällt');
          if (haeuftSich(f, levels.length + gewaehlt.length)) return verwirf(k, 'Häufung der Haupt-Kernidee');
          return true;
        });
        if (!passt) break;
        gewaehlt.push(passt);
        offen = offen.filter(k => k !== passt);
        dazu++;
      }
      bericht.push(`${g}: im Spiel ${im[g]}, nach Gruppe ${gruppe} ${ziel[g]}, gesetzt `
        + `${setze.filter(k => k.grad === g).length}, gewählt ${dazu} von ${noetig}`
        + `${dazu < noetig ? ` (es fehlen ${noetig - dazu}: Pool erweitern)` : ''}; in Frage `
        + `${inFrage.filter(k => k.grad === g).length}`);
    }
    return { gewaehlt, bericht };
  };
  // Die Häufungsregel prüft erst das Ergebnis: Jedes eingefügte Level verschiebt die Seiten dahinter, und die heutige
  // Reihenfolge passt nur so ins Raster, wie sie ist (um 1–9 Plätze verschoben bleiben unter den heutigen Leveln 3–7
  // Häufungen offen, die Häufungsregel rückt höchstens MAX_ENTZERREN Plätze). Darum zuerst die ganze Wahl, dann eine
  // Suche (unten), bis keine Häufung mehr offen bleibt. Gezählt wird, was offen bleibt: Häufungen, dann Level in ihnen.
  let zeitRegel = 0;
  const pruefe = (wahl) => {
    const t = Date.now(), f = folgeMit(wahl, { mitRegel: true, auffuellen: false });
    zeitRegel += Date.now() - t;
    // Zuerst die Korrekturen der KI-Tester, die zu weit führen (Gruppe 2): Mit den Urteilen schieben korrigierte Level
    // einander, und steht eines schon vor der Häufungsregel mehr als MAX_SHIFT Plätze weit, lässt sie keinen Zug zu;
    // ordne-level.mjs schriebe dann auch nicht. Ein Level, das schon vor der Häufungsregel zu weit steht, zählt doppelt
    // (einmal hier, einmal in der ganzen Prüfung): Es sperrt jeden Zug, wiegt also schwerer (Review Ticket 03)
    const zuWeit = zuWeitKorrigiert({ ...f.r, folge: f.r.korrigiert }).length + zuWeitKorrigiert(f.r).length;
    return { f, zuWeit, schlecht: [zuWeit + f.r.offen.length, f.r.offen.reduce((s, h) => s + h.mit.length, 0)] };
  };
  const besser = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  /** Ist einer der neuen Kandidaten einem anderen Level der Wahl probe zu ähnlich? */
  const aehnlichIn = (neu, probe) => neu.some(x => zuAehnlich(x.level, probe.filter(y => y !== x).map(y => y.level)));
  const { gewaehlt, bericht } = waehle();
  // Lokale Suche: je Schritt ein gewähltes Level gegen einen anderen Kandidaten desselben Grads, zur Hälfte einen, der
  // in eine offene Häufung fällt und eine andere Haupt-Kernidee hat (er lockert sie auf), sonst irgendeinen. Genommen
  // wird der Tausch, wenn danach nicht mehr offen bleibt; auch gleich viel, damit die Suche über Stellen kommt, an denen
  // erst zwei Tausche helfen (etwa zwei Level mehr vor einer Seite). Zufall aus festem Startwert: dieselbe Wahl ergibt
  // dasselbe. Mit --zufall N ein anderer Startwert, falls die Suche aus dem ersten nicht herausfindet.
  let zufall = 0x9e3779b9 ^ gruppe ^ (startwert * 0x85ebca6b);
  const zahlBis = (n) => {
    zufall ^= zufall << 13; zufall ^= zufall >>> 17; zufall ^= zufall << 5;
    return (zufall >>> 0) % n;
  };
  const frei = gewaehlt.flatMap((k, j) => (setze.includes(k) ? [] : [j]));
  // mit --auch-gesetzte darf die Suche auch Level aus --behalte tauschen (sie brauchen dann ein neues Urteil), die
  // übrigen aber dreimal so oft
  const ausBehalte = auchGesetzte ? gewaehlt.flatMap((k, j) => (setze.includes(k) ? [j] : [])) : [];
  const tauschbar = [...frei, ...frei, ...frei, ...ausBehalte];
  let stand = pruefe(gewaehlt), tausche = 0, schritte = 0;
  // der beste Stand der Suche: wenig offen, dann wenige Level ohne Urteil (getauschte aus --behalte und neue)
  const getauscht = (wahl) => wahl.filter(k => !k.beurteilt).length;
  let best = { wahl: [...gewaehlt], stand, getauscht: getauscht(gewaehlt) };
  const vorBest = (p, wahl) => besser(p.schlecht, best.stand.schlecht)
    || (!besser(best.stand.schlecht, p.schlecht) && getauscht(wahl) < best.getauscht);
  while (stand.schlecht[0] && tauschbar.length && schritte < suchSchritte) {
    schritte++;
    const { r, w } = stand.f, h = r.offen[zahlBis(r.offen.length)];
    const j = tauschbar[zahlBis(tauschbar.length)], k = gewaehlt[j];
    const alle = inFrage.filter(x => x.grad === k.grad && !gewaehlt.includes(x));
    // ohne offene Häufung (nur noch zu weite Korrekturen) ein beliebiger Kandidat
    const seite = h ? r.folge.slice(Math.max(0, 10 * h.gruppe - 3), 10 * h.gruppe + 13).map(i => w[i]) : [];
    const hinein = !h ? [] : alle.filter(x => x.hauptKernidee !== h.begriff && x.schwierigkeit >= Math.min(...seite)
      && x.schwierigkeit <= Math.max(...seite));
    const auswahl = zahlBis(2) && hinein.length ? hinein : alle, mitUrteil = auswahl.filter(x => x.beurteilt);
    const quelle = (zahlBis(2) && mitUrteil.length ? mitUrteil : auswahl).sort((a, b) => b.spielwert - a.spielwert);
    if (!quelle.length) continue;
    // bevorzugt mit hohem Spielwert: der Platz in der Liste nach dem Quadrat einer gleichverteilten Zahl
    const x = quelle[Math.floor((zahlBis(1000) / 1000) ** 2 * quelle.length)];
    const probe = gewaehlt.map((y, q) => (q === j ? x : y));
    if (zuAehnlich(x.level, probe.filter(y => y !== x).map(y => y.level))) continue;
    const p = pruefe(probe);
    if (p.f.sinkt || !p.f.mittel || besser(stand.schlecht, p.schlecht)) continue;
    // ein Level aus --behalte nur, wenn es echt besser wird: gleich gut hiesse ein neues Urteil ohne Gewinn
    if (setze.includes(k) && !besser(p.schlecht, stand.schlecht)) continue;
    if (besser(p.schlecht, stand.schlecht)) tausche++;
    gewaehlt[j] = x;
    stand = p;
    if (vorBest(p, gewaehlt)) best = { wahl: [...gewaehlt], stand: p, getauscht: getauscht(gewaehlt) };
  }
  gewaehlt.splice(0, gewaehlt.length, ...best.wahl);
  stand = best.stand;
  // Paartausch, wenn noch etwas offen ist: Liegen drei Level derselben Haupt-Kernidee eng auf einer Seite, hilft oft
  // erst ein zweites Level dazwischen, und ein einzelner Tausch ist gleich gut (Gruppe 2: Odyssee, Halo und
  // Lichtbrücke auf 6 Plätzen). Getauscht werden zwei freie Level des Grads der Häufung gegen zwei Kandidaten, die in
  // sie fallen und eine andere Haupt-Kernidee haben; genommen wird der erste Tausch, nach dem weniger offen bleibt.
  let paare = 0;
  for (let runde = 0; stand.schlecht[0] && runde < PAAR_RUNDEN; runde++) {
    const { r, w } = stand.f, h = r.offen[0];
    if (!h) break;
    const gradH = r.grad[h.mit[0]];
    const seite = r.folge.slice(Math.max(0, 10 * h.gruppe - 3), 10 * h.gruppe + 13).map(i => w[i]);
    const hinein = inFrage.filter(x => x.grad === gradH && !gewaehlt.includes(x) && x.hauptKernidee !== h.begriff
      && x.schwierigkeit >= Math.min(...seite) && x.schwierigkeit <= Math.max(...seite))
      .sort((a, b) => b.spielwert - a.spielwert).slice(0, PAAR_KANDIDATEN);
    const freie = frei.filter(j => gewaehlt[j].grad === gradH);
    let gefunden = null;
    suche: for (let a = 0; a < freie.length; a++) {
      for (let b = a + 1; b < freie.length; b++) {
        for (let x = 0; x < hinein.length; x++) {
          for (let y = x + 1; y < hinein.length; y++) {
            const probe = gewaehlt.map((k, q) => (q === freie[a] ? hinein[x] : q === freie[b] ? hinein[y] : k));
            if (aehnlichIn([hinein[x], hinein[y]], probe)) continue;
            const p = pruefe(probe);
            paare++;
            if (!p.f.sinkt && p.f.mittel && besser(p.schlecht, stand.schlecht)) {
              gefunden = { probe, p };
              break suche;
            }
          }
        }
      }
    }
    // Mehrfachtausch: Die m freien Level des Grads, die am nächsten vor dem ersten Level der Häufung stehen, kommen
    // hinter es, ersetzt durch m Kandidaten aus dem Bereich der Häufung. So rückt die Häufung um m Plätze nach vorn
    // (Gruppe 2: Odyssee musste auf die Seite davor, weil hinter Lichtbrücke schon zwei Level mit Farben abzählen
    // standen). Die Kandidaten: m aus denen des Grads zwischen dem ersten und dem letzten Level der Häufung, mit einer
    // anderen Haupt-Kernidee, nach einer Mischung aus dem Zufall der Suche (dieselbe Wahl ergibt dasselbe).
    if (!gefunden) {
      const plaetze = h.mit.map(i => r.folge.indexOf(i)), erster = Math.min(...plaetze), letzter = Math.max(...plaetze);
      const imBereich = inFrage.filter(x => x.grad === gradH && !gewaehlt.includes(x) && x.hauptKernidee !== h.begriff
        && x.schwierigkeit > w[r.folge[erster]] && x.schwierigkeit < w[r.folge[letzter]])
        .sort((a, b) => b.spielwert - a.spielwert);
      const davor = freie.filter(j => r.folge.indexOf(levels.length + j) < erster)
        .sort((a, b) => r.folge.indexOf(levels.length + b) - r.folge.indexOf(levels.length + a));
      mehr: for (let m = 1; m <= Math.min(MEHR_HOECHSTENS, davor.length); m++) {
        for (let versuch = 0; versuch < MEHR_VERSUCHE && imBereich.length >= m; versuch++) {
          // gleichmässig gemischt (Fisher-Yates) mit dem festen Zufall, dann die ersten m (Review Ticket 03)
          const gemischt = [...imBereich];
          for (let q = gemischt.length - 1; q > 0; q--) {
            const t = zahlBis(q + 1);
            [gemischt[q], gemischt[t]] = [gemischt[t], gemischt[q]];
          }
          const neu = gemischt.slice(0, m);
          const probe = gewaehlt.map((k, q) => (davor.slice(0, m).includes(q) ? neu[davor.indexOf(q)] : k));
          if (aehnlichIn(neu, probe)) continue;
          const p = pruefe(probe);
          paare++;
          if (!p.f.sinkt && p.f.mittel && besser(p.schlecht, stand.schlecht)) { gefunden = { probe, p }; break mehr; }
        }
      }
    }
    if (!gefunden) break;
    gewaehlt.splice(0, gewaehlt.length, ...gefunden.probe);
    stand = gefunden.p;
  }
  const ende = stand.f;
  const ersetzt = setze.filter(k => !gewaehlt.includes(k));
  bericht.push(`Häufungsregel: ${schritte} Schritte der Suche, ${tausche} Verbesserungen, ${paare} Proben im `
    + `Paartausch, offen ${ende.r.offen.length}`
    + `${ersetzt.length ? `; getauscht aus --behalte: ${ersetzt.map(k => k.name).join(', ')}` : ''}`);
  // die Ziel-Schwierigkeit des Auftrags als schwierigkeit, wie ordne-level.mjs --ausbau sie für die Herkunft liest
  writeFileSync(aus, JSON.stringify(gewaehlt.map(k => ({ auftrag: k.auftrag, seed: k.seed,
    ...(k.ziel ? { schwierigkeit: k.ziel } : {}), level: k.level })), null, 1)
    + '\n');
  console.log(`wahl für Gruppe ${gruppe}: ${gewaehlt.length} Level nach ${aus} (${zahl((Date.now() - t0) / 1000)} s, `
    + `davon Häufungsregel ${zahl(zeitRegel / 1000)} s)`);
  for (const z of bericht) console.log(`  ${z}`);
  const haeufig = {};
  for (const k of gewaehlt) haeufig[k.hauptKernidee ?? 'ohne'] = (haeufig[k.hauptKernidee ?? 'ohne'] || 0) + 1;
  console.log(`  Haupt-Kernideen: ${Object.entries(haeufig).map(([h, x]) => `${h} ${x}`).join(', ')}`);
  console.log(`  danach mit der Häufungsregel: offene Häufungen ${ende.r.offen.length}, Züge ${ende.r.zuege.length}, `
    + `zu weit korrigiert ${stand.zuWeit}; `
    + `Mittel je 10 Level ${ende.mittel ? 'steigt' : 'fällt (letzte Seite prüfen)'}; Grad `
    + `${ende.sinkt ? 'sinkt' : 'sinkt nie'}`);
  for (const h of ende.r.offen) {
    const wer = (i) => (i < levels.length ? levels[i].name : gewaehlt[i - levels.length].name);
    console.log(`    offen: Plätze ${10 * h.gruppe + 1}–${10 * h.gruppe + 10} ${h.begriff} ${h.mit.length}-mal: ${h.mit.map(wer).join(", ")}`);
  }
  console.log(`  verworfen: ${Object.entries(gruende).map(([g, x]) => `${g} ${x}`).join(', ') || '–'}`);
  for (const k of gewaehlt.filter(x => !setze.includes(x))) {
    const i = levels.length + gewaehlt.indexOf(k);
    console.log(`    ${k.name}: ${k.auftrag} Seed ${k.seed}, Platz ${ende.r.folge.indexOf(i) + 1}, Schwierigkeit `
      + `${zahl(k.schwierigkeit, 2)}, ${k.hauptKernidee ?? '–'}, Spielwert ${zahl(k.spielwert)}`);
  }
}
