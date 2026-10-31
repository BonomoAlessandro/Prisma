// Kandidaten aus dem Generator (tools/generator/) für neue Level: einst für den Ausbau auf 500 Level
// (.scratch/500-level/, Ticket 01), seit Noas Geschichte für neue Level der Geschichte (.scratch/noa-geschichte/, Tickets
// 01 und 09) und für die Würfel-Level (tools/wuerfel.mjs). Die KI-Tester beurteilen die gewählten (Lauf ausbau-… bzw.
// wuerfel-…); in die Reihe aus Spiel und Vorrat kommen flache mit tools/ordne-level.mjs --ausbau, Würfel-Level mit
// tools/ordne-wuerfel.mjs --kandidaten.
//
// pool: Kandidaten für Aufträge wie „mittel-mischziel“, Seeds start … start + seeds - 1, verteilt in Blöcken auf --jobs
//   Prozesse. Jedes gelieferte Level geht als JSON-Zeile { auftrag, seed, level, schwierigkeit, spielwert,
//   hauptKernidee, kernideen, stand } an die Datei (angehängt; level wie in LEVELS, ohne Namen; die Werte aus der
//   Beurteilung des Generators, ungerundet; stand der Commit, siehe standDesCodes). Dieselben Seeds liefern auf
//   demselben Stand dieselben Level.
//   --schwierigkeit VON,BIS: die Ziel-Schwierigkeit der Aufträge wie bei generiere.mjs (etwa für das obere Ende von
//   „schwer“, das der Generator sonst selten trifft); die Zeile trägt sie dann als ziel.
//   --wuerfel: Kandidaten im Würfel 7 × 7 × 5 (WUERFEL = QUADER, .scratch/wuerfel-7x7x5/; bis 26.10.2026 7 × 7 × 7,
//     .scratch/wuerfel-500/), level wie in LEVELS_3D ohne Namen. Was die Ebenen-Regel verletzt (ebenenVerletzt,
//     Dauerregel des Nutzers), verwirft pool wie ein Level ohne Ergebnis (Grund „Ebenen-Regel“).
//     LEISE_CPU=50 sh tools/leise.sh node tools/ausbau.mjs pool <auftrag …> --aus <datei> [--seed S] [--seeds M]
//       [--jobs N] [--schwierigkeit VON,BIS] [--wuerfel]
// Die Wahl einer Gruppe des Ausbaus auf 500 Level nach dem Bedarf der Reihe (wahl, bedarf) ist mit Ticket 08 von Noas
// Geschichte weggefallen (im Verlauf bis 944b038): Die Reihe ist nicht mehr der Ablauf des Spiels, und neue Level wählt
// tools/geschichte.mjs wahl für die Geschichte; flache Kandidaten wählt der Koordinator vor dem Lauf der KI-Tester (so in
// Ticket 01 der Geschichte), Würfel-Level wählt tools/wuerfel.mjs wahl.
import { execFileSync, fork } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { gedeckelt, deckelText } from './deckel.mjs';
import { QUADER, ebenenVerletzt } from './wuerfelliste.mjs';

const BLOCK = 25;
/** Der Würfel der Würfel-Level für pool --wuerfel: 7 × 7 × 5 (QUADER, Dauerregel des Nutzers vom 26.10.2026). */
export const WUERFEL = QUADER;

const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf(name); return i < 0 ? def : args.splice(i, 2)[1]; };
const fail = (text) => { console.error(text); process.exit(1); };
const zahl = (x, n = 1) => x.toFixed(n).replace('.', ',');

if (process.env.AUSBAU_WORKER) {
  // Prozess für pool: rechnet Blöcke von Seeds eines Auftrags und schickt die Level zurück
  const [{ generiere, angebot }, { feldformVon }] = await Promise.all(
    ['./generator/index.mjs', './beurteilung/feldform.mjs'].map(f => import(f)));
  const auftraege = new Map(angebot().map(a => [a.name, a]));
  process.on('message', ({ auftrag, from, to, schwierigkeit, wuerfel }) => {
    const feldform = feldformVon(wuerfel ? WUERFEL : {});
    const level = [], gruende = {};
    for (let seed = from; seed < to; seed++) {
      const { level: l, beurteilung: b, grund } = generiere({
        ...auftraege.get(auftrag), seed, feldform, schwierigkeit });
      const fehlt = !l ? grund : wuerfel && ebenenVerletzt(l).length ? 'Ebenen-Regel' : null;
      if (fehlt) { gruende[fehlt] = (gruende[fehlt] || 0) + 1; continue; }
      level.push({ auftrag, seed, ...(schwierigkeit ? { ziel: schwierigkeit } : {}), level: l,
        schwierigkeit: b.schwierigkeit.wert, spielwert: b.spielwert.wert,
        hauptKernidee: b.hauptKernidee.begriff, kernideen: [...new Set(b.kernideen.map(k => k.begriff))] });
    }
    process.send({ auftrag, level, gruende });
  });
} else if (args[0] === 'pool') await pool();
else if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  fail('Aufruf: node tools/ausbau.mjs pool … (siehe Kopf)');
}

/**
 * Stand des Codes, mit dem pool die Level baut (Commit, kurz): Ein Seed liefert nur mit demselben Generator und derselben
 * Beurteilung dasselbe Level (Review Ticket 02 der Würfel-Level). Mit „+“, wenn Generator, Beurteilung oder Spiellogik
 * vom Commit abweichen; dann ist der Stand nicht genau nachbaubar. null ohne git oder ausserhalb eines Repos (mit
 * Warnung); die Zeilen tragen dann stand: null, und tests/wuerfelliste.test.mjs lehnt die Herkunft ab.
 */
function standDesCodes() {
  const git = (...a) => execFileSync('git', a, { cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    const geaendert = git('status', '--porcelain', '--', 'tools/generator', 'tools/beurteilung', 'tools/solver.mjs',
      'tools/ausbau.mjs', 'index.html');
    if (geaendert) console.error(`pool: Generator, Beurteilung oder Spiellogik geändert, Stand mit „+“:\n${geaendert}`);
    return git('rev-parse', '--short=7', 'HEAD') + (geaendert ? '+' : '');
  } catch (e) {
    console.error(`pool: Stand des Codes unbekannt (git: ${e.message.split('\n')[0]}), Herkunft nicht nachbaubar`);
    return null;
  }
}

async function pool() {
  const aus = flag('--aus', null), start = Number(flag('--seed', 1)), seeds = Number(flag('--seeds', 400));
  const ziel = flag('--schwierigkeit', null)?.split(',').map(Number) ?? null;
  if (ziel && !(ziel.length === 2 && ziel.every(Number.isFinite) && ziel[0] <= ziel[1])) {
    fail(`--schwierigkeit VON,BIS mit VON ≤ BIS, nicht ${ziel.join(',')}`);
  }
  const jobs = Number(flag('--jobs', Math.max(1, os.cpus().length >> 1)));
  const wuerfel = args.includes('--wuerfel');
  const auftraege = args.slice(1).filter(a => a !== '--wuerfel');
  const { angebot } = await import('./generator/index.mjs');
  const bekannt = angebot().map(a => a.name);
  if (!aus || !auftraege.length || ![start, seeds, jobs].every(Number.isInteger)) {
    fail('Aufruf: node tools/ausbau.mjs pool <auftrag …> --aus <datei> [--seed S] [--seeds M] [--jobs N]');
  }
  const fremd = auftraege.filter(a => !bekannt.includes(a));
  if (fremd.length) fail(`Unbekannte Aufträge: ${fremd.join(', ')}; bekannt: ${bekannt.join(', ')}`);
  if (!gedeckelt()) fail(`Nur über tools/leise.sh mit höchstens dem Deckel (${deckelText()})`);
  const stand = standDesCodes();
  const tasks = auftraege.flatMap(auftrag => Array.from({ length: Math.ceil(seeds / BLOCK) }, (_, k) => ({
    auftrag, from: start + k * BLOCK, to: Math.min(start + (k + 1) * BLOCK, start + seeds), schwierigkeit: ziel, wuerfel })));
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
    const zeilen = ergebnis.get(a).level.sort((x, y) => x.seed - y.seed).map(x => JSON.stringify({ ...x, stand }) + '\n');
    if (zeilen.length) appendFileSync(aus, zeilen.join(''));
  }
  console.error(`pool: ${[...ergebnis.values()].reduce((s, e) => s + e.level.length, 0)} Level nach ${aus}, `
    + `${zahl((Date.now() - t0) / 1000)} s`);
}
