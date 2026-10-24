// Werkzeug für die Würfel-Level (.scratch/wuerfel-500/, Ticket 01): je Gruppe die neuen Level wählen. Die Kandidaten
// erzeugt tools/ausbau.mjs pool … --wuerfel (Generator im Würfel 7 × 7 × 7); die gewählten gehen an
// tools/ordne-wuerfel.mjs --kandidaten, das sie nach der Formel einordnet und schreibt (wuerfelliste.mjs, Kopf);
// dazwischen beurteilen die KI-Tester sie (Lauf wuerfel-…).
//
// wahl: wählt aus Pool-Dateien die neuen Level einer Gruppe (1–20). Der Bedarf je Grad ist der Bestand nach der Gruppe
//   (Tabelle der Spec, bestandNach) weniger die neuen Würfel-Level im Spiel; was einer Gruppe fehlte, holt die nächste
//   so von selbst nach. Ein Kandidat kommt in Frage, wenn sein Grad nach der Schwelle der seines Auftrags ist, er keine
//   Regel verletzt (ab „mittel“ Haupt-Kernidee und Mindest-Spielwert; Ausschlüsse schliesst schon der Generator aus),
//   er keinen zweiten unabhängigen Teil mit drehbarem Element hat (in „leicht“ höchstens eines, wie im flachen Ausbau:
//   Zerfall und Füllteil, wie ihn die KI-Tester lesen) und keinem Würfel-Level im Spiel zu ähnlich ist. Je Grad wird
//   dann einer nach dem anderen gewählt: der, dessen Haupt-Kernidee im Grad bisher am seltensten ist (gegen Häufungen),
//   bei gleicher Zahl der, dessen Schwierigkeit am weitesten von den schon gewählten und denen im Spiel liegt (so
//   verteilen sie sich über den Grad), dann der mit dem höheren Spielwert; keiner einem gewählten zu ähnlich. Bleibt
//   danach mit der Häufungsregel eine Häufung offen, tauscht die Wahl ein Level der Häufung gegen einen anderen Kandidaten
//   desselben Grads mit anderer Haupt-Kernidee, bis keine mehr offen ist (höchstens TAUSCH_RUNDEN Tausche).
//   --behalte <datei>: eine frühere Wahl, deren Level gesetzt sind (etwa nach einer Ablehnung durch die KI-Tester ohne
//   die abgelehnten); die Wahl füllt nur den Rest. --ohne <name,…>: Kandidaten (Name bei den KI-Testern, „Kandidat
//   <Abdruck>“), die nicht in Frage kommen. Ausgabe: eine JSON-Liste { auftrag, seed, level } (ohne Namen).
//     LEISE_CPU=50 sh tools/leise.sh node tools/wuerfel.mjs wahl <gruppe> --pool <datei>[,<datei> …] --aus <datei>
//       [--behalte <datei>] [--ohne <name,…>]
// bedarf: der Bestand je Grad im Spiel, nach jeder Gruppe und der Bedarf der nächsten.
//     node tools/wuerfel.mjs bedarf
import { readFileSync, writeFileSync } from 'node:fs';
import { L } from './solver.mjs';
import { GRADE } from './beurteilung/index.mjs';
import { gradVon } from './beurteilung/grad.mjs';
import { MINDEST_SPIELWERT } from './beurteilung/spielwert.mjs';
import { beurteileAlle } from './beurteilung/parallel.mjs';
import { feldformVon } from './beurteilung/feldform.mjs';
import { gruppen } from './beurteilung/ausschluesse/zerfall.mjs';
import { kandidatName } from './leveldaten.mjs';
import { aehnlichkeit, AEHNLICH_AB } from './aehnlichkeit.mjs';
import { zaehlendeWuerfelUrteile } from './levelliste.mjs';
import { gedeckelt, deckelText } from './deckel.mjs';
import { GRUPPEN, HANDGEBAUT, WUERFEL, bestandNach, wuerfelReihenfolge } from './wuerfelliste.mjs';

/**
 * Zweiter unabhängiger Teil: so viele drehbare Elemente höchstens, in jedem Grad. Strenger als tools/ausbau.mjs (dort
 * „leicht“ bis 1): In Gruppe 1 lehnten beide KI-Tester alle drei leichten Kandidaten mit einem solchen Teil ab.
 */
const ZWEITER_TEIL_HOECHSTENS = 0;
/** So viele Tausche gegen offene Häufungen höchstens (wahl). */
const TAUSCH_RUNDEN = 200;

const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf(name); return i < 0 ? def : args.splice(i, 2)[1]; };
const fail = (text) => { console.error(text); process.exit(1); };
const zahl = (x, n = 1) => x.toFixed(n).replace('.', ',');
const leseJsonl = (datei) => readFileSync(datei, 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
/** Die neuen Würfel-Level im Spiel (ohne die handgebauten) je Grad. */
const neuImSpiel = () => Object.fromEntries(GRADE.map(g => [g, L.LEVELS_3D
  .filter(l => !HANDGEBAUT.includes(l.name) && l.grad === g).length]));

if (args[0] === 'wahl') await wahl();
else if (args[0] === 'bedarf') bedarf();
else fail('Aufruf: node tools/wuerfel.mjs wahl|bedarf … (siehe Kopf)');

function bedarf() {
  const im = neuImSpiel();
  console.log(`Würfel-Level im Spiel: ${L.LEVELS_3D.length} (davon handgebaut ${HANDGEBAUT.length}); neue je Grad `
    + `${GRADE.map(g => `${g} ${im[g]}`).join(', ')}`);
  for (let k = 1; k <= GRUPPEN; k++) {
    const b = bestandNach(k), n = GRADE.reduce((s, g) => s + b[g], 0);
    console.log(`  nach Gruppe ${k} (Ticket ${String(k + 1).padStart(2, '0')}): ${n} neue, `
      + `${GRADE.map(g => b[g]).join(' / ')}; noch nötig ${GRADE.map(g => Math.max(0, b[g] - im[g])).join(' / ')}`);
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
  if (!(gruppe >= 1 && gruppe <= GRUPPEN) || !aus || !pools) {
    fail('Aufruf: node tools/wuerfel.mjs wahl <gruppe> --pool <datei>[,<datei> …] --aus <datei> [--behalte <datei>] '
      + '[--ohne <name,…>]');
  }
  if (!gedeckelt()) fail(`Nur über tools/leise.sh mit höchstens dem Deckel (${deckelText()})`);
  const t0 = Date.now(), ziel = bestandNach(gruppe), im = neuImSpiel();
  // Die Würfel-Level im Spiel, mit ihrem Grad beurteilt, und die Urteile der KI-Tester (Läufe wuerfel-…)
  const W = L.LEVELS_3D, urteile = zaehlendeWuerfelUrteile();
  const bW = await beurteileAlle(W.map(level => ({ level, opts: { grad: level.grad ?? null, teuer: true } })));
  // Die Kandidaten aus den Pools, ohne doppelte und ohne die im Spiel; die gesetzten aus --behalte
  const imSpielName = new Set(W.map(kandidatName));
  const gesehen = new Set(), kandidaten = [];
  for (const k of pools.split(',').flatMap(leseJsonl)) {
    const name = kandidatName(k.level);
    if (gesehen.has(name) || imSpielName.has(name)) continue;
    gesehen.add(name);
    if (k.level.dim !== WUERFEL.dim || k.level.size !== WUERFEL.size) fail(`${k.auftrag} Seed ${k.seed}: kein Würfel 7 × 7 × 7`);
    kandidaten.push({ ...k, name, grad: k.auftrag.replace(/-[a-z]+$/, '') });
  }
  const gesetzt = (behalteDatei ? JSON.parse(readFileSync(behalteDatei, 'utf8')) : []).map((g) => {
    const k = kandidaten.find(x => x.name === kandidatName(g.level));
    if (!k) fail(`--behalte: ${kandidatName(g.level)} (${g.auftrag} Seed ${g.seed}) steht in keinem Pool`);
    return k;
  });
  const gruende = {};
  const verwirf = (grund) => { gruende[grund] = (gruende[grund] || 0) + 1; return false; };
  const inFrage = kandidaten.filter((k) => {
    if (gesetzt.includes(k)) return false;
    if (ohne.includes(k.name)) return verwirf('ausgeschlossen (--ohne)');
    if (gradVon(k.schwierigkeit) !== k.grad) return verwirf('Grad nach der Schwelle anders als im Auftrag');
    if (k.grad !== GRADE[0] && (!k.hauptKernidee || k.spielwert < MINDEST_SPIELWERT)) {
      return verwirf('ab „mittel“ ohne Haupt-Kernidee oder unter dem Mindest-Spielwert');
    }
    if (W.some(l => aehnlichkeit(k.level, l) >= AEHNLICH_AB)) return verwirf('einem Würfel-Level im Spiel zu ähnlich');
    if (zweiterTeil(k.level) > ZWEITER_TEIL_HOECHSTENS) {
      return verwirf('zweiter unabhängiger Teil mit drehbarem Element (Zerfall, Füllteil)');
    }
    return true;
  });
  const nahAn = (k, wahl) => wahl.some(x => x !== k && aehnlichkeit(k.level, x.level) >= AEHNLICH_AB);

  // Die Wahl je Grad (siehe Kopf), ohne die Häufungsregel
  const gewaehlt = [...gesetzt], fehlt = {};
  for (const g of GRADE) {
    const noetig = Math.max(0, ziel[g] - im[g] - gesetzt.filter(k => k.grad === g).length);
    const imGrad = W.flatMap((l, i) => (l.grad === g ? [bW[i]] : []));
    let offen = inFrage.filter(k => k.grad === g);
    for (let dazu = 0; dazu < noetig; dazu++) {
      offen = offen.filter(k => !nahAn(k, gewaehlt));
      if (!offen.length) { fehlt[g] = noetig - dazu; break; }
      const schon = [...imGrad.map(x => ({ w: x.schwierigkeit.wert, h: x.hauptKernidee.begriff })),
        ...gewaehlt.filter(k => k.grad === g).map(k => ({ w: k.schwierigkeit, h: k.hauptKernidee }))];
      const rang = (k) => [schon.filter(s => s.h === k.hauptKernidee).length,
        -Math.min(Infinity, ...schon.map(s => Math.abs(s.w - k.schwierigkeit))), -k.spielwert];
      const vor = (a, b) => { const ra = rang(a), rb = rang(b), j = ra.findIndex((x, n) => x !== rb[n]); return j < 0 ? 0 : ra[j] - rb[j]; };
      const k = [...offen].sort(vor)[0];
      gewaehlt.push(k);
      offen = offen.filter(x => x !== k);
    }
  }

  // Die Reihenfolge mit den gewählten Leveln, wie ordne-wuerfel.mjs sie rechnet; gegen offene Häufungen tauschen. Die
  // Level im Spiel tragen ihr Urteil unter „Kandidat <Abdruck>“ (beurteilt vor dem Einordnen), darum auch hier kandidat.
  const folgeMit = (wahl) => {
    const werte = [...bW.map(x => x.schwierigkeit.wert), ...wahl.map(k => k.schwierigkeit)];
    const haupt = [...bW.map(x => x.hauptKernidee.begriff), ...wahl.map(k => k.hauptKernidee)];
    return wuerfelReihenfolge(werte, [...W.map(l => l.name), ...wahl.map(k => k.name)], haupt,
      { kandidat: [...W.map(kandidatName), ...wahl.map(k => k.name)], urteile });
  };
  let r = folgeMit(gewaehlt), tausche = 0;
  const getauscht = [];
  while (r.offen.length && tausche < TAUSCH_RUNDEN) {
    const h = r.offen[0], wer = h.mit.map(i => i - W.length).filter(j => j >= 0 && !gesetzt.includes(gewaehlt[j]));
    let besser = null;
    for (const j of wer) {
      const raus = gewaehlt[j];
      for (const rein of inFrage.filter(k => k.grad === raus.grad && k.hauptKernidee !== h.begriff
        && !gewaehlt.includes(k))) {
        const probe = gewaehlt.map((k, n) => (n === j ? rein : k));
        if (nahAn(rein, probe)) continue;
        const rp = folgeMit(probe);
        if (rp.offen.length < r.offen.length) { besser = { probe, rp, raus, rein }; break; }
      }
      if (besser) break;
    }
    tausche++;
    if (!besser) break;
    gewaehlt.splice(0, gewaehlt.length, ...besser.probe);
    r = besser.rp;
    getauscht.push(`${besser.raus.name} → ${besser.rein.name}`);
  }

  writeFileSync(aus, JSON.stringify(gewaehlt.map(k => ({ auftrag: k.auftrag, seed: k.seed,
    ...(k.ziel ? { schwierigkeit: k.ziel } : {}), level: k.level })), null, 1) + '\n');
  const je = Object.fromEntries(GRADE.map(g => [g, gewaehlt.filter(k => k.grad === g).length]));
  console.log(`Gruppe ${gruppe}: ${gewaehlt.length} Level gewählt (${GRADE.map(g => je[g]).join(' / ')}; gesetzt `
    + `${gesetzt.length}), Bestand danach ${GRADE.map(g => im[g] + je[g]).join(' / ')}, Ziel `
    + `${GRADE.map(g => ziel[g]).join(' / ')}`);
  console.log(`  Kandidaten: ${kandidaten.length}, in Frage ${inFrage.length}; verworfen: ${Object.entries(gruende)
    .map(([g, x]) => `${g} ${x}`).join(', ') || '–'}`);
  if (Object.keys(fehlt).length) console.log(`  zu wenige: ${Object.entries(fehlt).map(([g, x]) => `${g} ${x}`).join(', ')}`);
  console.log(`  Haupt-Kernideen: ${GRADE.map(g => `${g}: ${Object.entries(gewaehlt.filter(k => k.grad === g)
    .reduce((m, k) => ({ ...m, [k.hauptKernidee ?? '–']: (m[k.hauptKernidee ?? '–'] || 0) + 1 }), {}))
    .map(([h, x]) => `${h} ${x}`).join(', ')}`).join(' · ')}`);
  console.log(`  Häufungsregel: ${r.offen.length ? `offen ${r.offen.map(h => `Seite ${h.gruppe + 1} ${h.begriff} `
    + `${h.mit.length}-mal`).join(', ')}` : 'keine offen'}${getauscht.length ? `; getauscht ${getauscht.length}` : ''}`);
  console.log(`  ${aus} geschrieben, ${zahl((Date.now() - t0) / 1000)} s`);
}
