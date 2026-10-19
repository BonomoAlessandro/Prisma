// Reihenfolge und Grade der 150 Level (Ticket 15; Spec „Levelliste, Reihenfolge und Austausch“, „Beurteilung“ und
// „Entscheide zu den Tests“, Nahtstelle 3): das Werkzeug, aus dem Reihenfolge, Grade, Duldungsliste und Prüfliste
// entstehen. Es beurteilt die Level (beurteilung/parallel.mjs), rechnet nach den Regeln in levelliste.mjs und
// berichtet; mit --schreiben trägt es das Ergebnis in index.html und levelliste.json ein.
// - Reihenfolge: nach der Schwierigkeit, Verschiebungen bis MAX_WANDERN Plätze, weiter wandernde Level bleiben an ihrem
//   heutigen Platz (Prüfliste für Ticket 16). Gerechnet wird immer von der heutigen Reihenfolge aus
//   (beurteilung/heutige-reihenfolge.mjs), nicht von der in index.html; ein zweiter Lauf ändert darum nichts.
// - Urteile der KI-Tester (Ticket 16): die zählenden Einträge des Protokolls (Ablauf 2, Läufe pruefung-…; zu neuen
//   Leveln ersatz-…, siehe Austausch unten). Ein Level der Prüfliste kommt auf den Platz der Formel, wenn beide
//   zustimmen, sonst bleibt es; dazu die eigenen Korrekturen und die Ablehnungen (reihenfolge in levelliste.mjs). Der
//   Bericht zeigt je Level der Prüfliste den Entscheid.
// - Grade: feste SCHWELLEN (beurteilung/grad.mjs); ein Level am heutigen Platz bekommt den Grad seines Abschnitts. Der
//   Bericht zeigt die Herleitung der Schwellen aus der vorläufigen Aufteilung (VORLAEUFIG), die Level, deren Grad nicht
//   der Schwelle folgt, und zum Vergleich zwei andere Regeln.
// - Kreisschluss: Der Grad geht in die Beurteilung ein (Füllteil und Zerfall ab „mittel“), und Kernidee und
//   Mindest-Spielwert gelten erst ab „mittel“. Darum rechnet das Skript bis zum Fixpunkt: zuerst ohne Grad, dann mit
//   den Graden der Reihenfolge, bis sich Schwierigkeit und Grade nicht mehr ändern. Heute hängt die Schwierigkeit nicht
//   vom Grad ab; der zweite Durchgang bestätigt das.
// - Duldungsliste nach Grund (GRUENDE), je Grad, verglichen mit den 37 Leveln der Neuzählung (Spec) und mit
//   levelliste.json, dazu die Grenzfälle der Neuzählung.
// - Die übrigen Regeln der Levelliste: Grad, Mittel der Schwierigkeit und Haupt-Kernidee je 10 Level, Namen,
//   Eindeutigkeit der Lösung, Korrekturen der KI-Tester (höchstens MAX_SHIFT Plätze vom Platz davor, nach den
//   Korrekturen und am Ende; zuWeitKorrigiert in levelliste.mjs); dazu die Anker der KI-Tester und der Zusammenhang
//   von Spielwert und Schwierigkeit.
// - Austausch (Tickets 23–26): Neue Level haben keinen heutigen Platz und stehen nach der Formel (imSpiel und reihenfolge
//   in levelliste.mjs), dazu die Urteile der KI-Tester aus den Läufen ersatz-…. Mit --austausch rechnet das Skript, als
//   wären die Kandidaten schon im Spiel und die ersetzten Level entfernt: wo jeder einordnet, mit welchem Grad, ob die
//   Regeln halten. So werden Kandidaten vor dem Lauf der KI-Tester geprüft, und mit --schreiben kommen sie ins Spiel.
// Aufruf: sh tools/leise.sh node tools/ordne-level.mjs [--austausch <datei>] [--schreiben] [--json <datei>]
//         (etwa 40 s, vier Threads)
//   --austausch: eine JSON-Liste (oder eine JSON-Zeile je Eintrag) { ersetzt, level, name, auftrag, seed,
//                schwierigkeit }: ersetzt ist der Name eines Levels im Spiel, level die Leveldaten des neuen (wie von
//                tools/generiere.mjs), name der genehmigte Name; ohne name heisst es wie bei den KI-Testern „Kandidat
//                <Abdruck>“ (kandidatName in leveldaten.mjs). auftrag, seed und schwierigkeit (die Ziel-Schwierigkeit
//                [von, bis] des Auftrags) sind wahlweise; sie stehen als Herkunft im Kommentar des Levels in
//                index.html, damit generiere.mjs <auftrag> --seed S --anzahl 1 --schwierigkeit VON,BIS es nachbaut.
//   --schreiben: ordnet die Level in index.html (zwischen LEVELS:BEGIN und LEVELS:END) und setzt ihren Grad (Feld
//                grad); schreibt in levelliste.json die Duldungsliste und die Prüfliste. Die ursprüngliche
//                Duldungsliste, die entfernten Namen und die Plätze der Formel beim Entscheid über die Level der
//                Prüfliste (prueflisteFormel, Ticket 26) bleiben, wie sie sind, ebenso die Gruppe „behalten nach
//                Urteil der KI-Tester“ (behalten, Ticket 24; ohne Level, die es nicht mehr gibt); ein Level der
//                Prüfliste mit neuem Urteil kommt mit seinem Platz der Formel von heute dazu (festePlaetze); fehlt
//                die Datei, ist die ursprüngliche die heutige. Einmal, in Ticket 16, wächst die ursprüngliche Liste um
//                begründete Ergänzungen (ergaenzungBegruendet in levelliste.mjs), die levelliste.json auch einzeln
//                festhält (ergaenzt).
//                Es schreibt nicht, solange eine Häufung der Haupt-Kernidee offen bleibt oder ein von den KI-Testern
//                korrigiertes Level mehr als MAX_SHIFT Plätze von seinem Platz davor steht, auch mit --austausch.
//                Mit --austausch setzt es dazu die neuen Level mit ihrem Namen ein und nimmt die ersetzten heraus:
//                ihre Namen kommen auf entfernteNamen, ihre Leveldaten in die feste Kopie für die Eichung
//                (beurteilung/entfernte-level.json). Das geht nur, wenn jedes neue Level einen genehmigten Namen und
//                ein zählendes Urteil der KI-Tester hat, das es nicht ablehnt.
//   --json:      schreibt das Ergebnis je Level (heutiger und neuer Platz, Grad, Gründe; bei einem neuen Level dazu
//                der Name bei den KI-Testern und die Leveldaten) in die Datei; tools/ki-tester/prepare.mjs nimmt sie
//                mit --kandidaten.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { L, solve, period } from './solver.mjs';
import { GRADE } from './beurteilung/index.mjs';
import { beurteileAlle } from './beurteilung/parallel.mjs';
import { SCHWELLEN, gradVon } from './beurteilung/grad.mjs';
import { ENTFERNTE, HEUTIGE_REIHENFOLGE, entfernteLevel } from './beurteilung/heutige-reihenfolge.mjs';
import { rangkorrelation } from './beurteilung/schwierigkeit-eichung.mjs';
import { MAX_SHIFT, provisionalGradeOf, loadAnchors } from './ki-tester/protocol.mjs';
import { kandidatName, levelCode } from './leveldaten.mjs';
import {
  DATEI, GRUENDE, HAUPT_KERNIDEE_JE_10, MAX_ENTZERREN, MAX_WANDERN, alleUrteile, ergaenzungBegruendet, festePlaetze,
  imSpiel, ladeLevelliste, reihenfolge, stark, zaehlendeUrteile, zehner, zuWeitKorrigiert,
} from './levelliste.mjs';

/** Vorläufige Aufteilung (Spec): leicht 1–30, mittel 31–100, schwer 101–140, sehr schwer 141–150. */
const VORLAEUFIG = [30, 70, 40, 10];
/** Die Schwelle liegt in der breitesten Lücke höchstens so viele Plätze von der vorläufigen Grenze (grad.mjs). */
const FENSTER = 5;
/** Die Duldungsliste der Neuzählung (Spec, Stand vor Ticket 15), mit heutigem Platz. */
const NEUZAEHLUNG = [15, 19, 20, 26, 29, 31, 36, 38, 40, 43, 67, 77, 86, 92, 97, 98, 101, 106, 111, 116, 120, 121, 128,
  129, 131, 132, 133, 134, 136, 137, 138, 139, 140, 143, 146, 147, 149];
/** Grenzfälle der Neuzählung, mit der fertigen Beurteilung neu zu prüfen (Spec, „Weitere Hinweise“). */
const GRENZFAELLE = {
  'Knäuel bei 1,30 und 1,29': [122, 150, 38, 85, 99, 109],
  'Zerfall mit zweiter Gruppe aus 2 Elementen': [36, 37, 43, 80, 101],
  'Scheinmischung (b) nicht direkt oder zerlegt': [76, 100, 117, 118],
};
const INDEX = new URL('../index.html', import.meta.url);

const zahl = (x, n = 1) => x.toFixed(n).replace('.', ',');
/** Eine Zahl wie angegeben, mit Dezimalkomma (die Ziel-Schwierigkeit aus der Austausch-Datei, etwa 36,65). */
const dezimal = (x) => String(x).replace('.', ',');
/** Die Ziel-Schwierigkeit eines Eintrags im Austausch als Text, etwa „36,7–37,5“. */
const zielText = (a) => a.schwierigkeit.map(dezimal).join('–');
const mittel = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const rang = (grad) => GRADE.indexOf(grad);
const argument = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);

const schreiben = process.argv.includes('--schreiben');
const jsonDatei = argument('--json');
const start = Date.now();
// Die Level im Spiel, mit dem Austausch: zuerst die der heutigen Reihenfolge, dann die neuen (imSpiel)
const austausch = argument('--austausch') ? ladeAustausch(argument('--austausch')) : [];
const ersetzt = austausch.map(a => a.ersetzt);
const { levels, heute } = imSpiel([...L.LEVELS.slice(L.TUTORIAL_COUNT).filter(l => !ersetzt.includes(l.name)),
  ...austausch.map(a => a.level)]);
const n = levels.length;
/** Bei einem neuen Level der Name, unter dem die KI-Tester es beurteilen (Läufe ersatz-…). */
const kandidat = levels.map((l, i) => (heute[i] === null ? kandidatName(l) : null));
const name = (i) => `${heute[i] ?? 'neu'} ${levels[i].name}`;
const neue = [...Array(n).keys()].filter(i => heute[i] === null);

// Bis zum Fixpunkt: Reihenfolge und Grade aus der Schwierigkeit und den Urteilen der KI-Tester, die Beurteilung mit
// diesen Graden. Die Zustimmung zu einem Level der Prüfliste rechnet mit dem Platz der Formel beim Entscheid
// (prueflisteFormel in levelliste.json, Entscheid des Nutzers vom 19.10.2026, Ticket 26)
const urteile = zaehlendeUrteile();
const formelEntscheid = (existsSync(DATEI) ? ladeLevelliste().prueflisteFormel : null) ?? {};
let grad = levels.map(() => null), b, ohneGrad, ordnung, folge, runde = 0;
for (let vorher = null; ; vorher = b) {
  if (++runde > 5) throw new Error('Kein Fixpunkt nach 5 Durchgängen: Die Schwierigkeit hängt vom Grad ab.');
  console.log(`Durchgang ${runde}: beurteile die ${n} Level ${runde === 1 ? 'ohne Grad' : 'mit den Graden'} …`);
  b = await beurteileAlle(levels.map((level, i) => ({ level, opts: { grad: grad[i], teuer: true } })));
  ohneGrad ??= b;
  const text = (x) => JSON.stringify(x.schwierigkeit);
  const gleich = vorher && b.every((x, i) => text(x) === text(vorher[i]));
  const jetzt = b;
  // Häufung der Haupt-Kernidee: gezählt ohne die Duldungsliste, mit den Graden der Reihenfolge
  ordnung = reihenfolge(b.map(x => x.schwierigkeit.wert), levels.map(l => l.name), urteile, {
    haupt: b.map(x => x.hauptKernidee.begriff),
    geduldet: (i, g, u) => Object.values(GRUENDE).some(grund => grund.gilt(jetzt[i], g, u)),
    heute, kandidat, formelEntscheid,
  });
  folge = ordnung.folge;
  const neu = ordnung.grad;
  if (gleich && neu.every((g, i) => g === grad[i])) break;
  grad = neu;
}
const werte = b.map(x => x.schwierigkeit.wert);
const { formel, bleibt, ki } = ordnung;
const platz = new Array(n);
folge.forEach((i, k) => { platz[i] = k + 1; });
console.log(`Fixpunkt nach ${runde} Durchgängen: Schwierigkeit und Grade ändern sich mit den Graden nicht mehr`);

// Reihenfolge
console.log(`\nReihenfolge (Verschiebungen bis ${MAX_WANDERN} Plätze übernommen, Plätze ab der heutigen Reihenfolge)`);
const wandert = [...Array(n).keys()].filter(i => !bleibt.has(i) && heute[i] !== null);
const um = wandert.map(i => Math.abs(platz[i] - heute[i]));
console.log(`  ${wandert.length} Level nach der Formel, davon ${um.filter(x => x === 0).length} am heutigen Platz; `
  + `verschoben im Mittel um ${zahl(mittel(um))}, höchstens ${Math.max(...um)} Plätze; dazu ${neue.length} neue`);
const pruef = [...ordnung.pruefliste].sort((i, j) => i - j);
const nachgezogen = [...bleibt].filter(([, g]) => g === 'Reihenfolge').map(([i]) => i);
const vorn = pruef.filter(i => formel[i] < heute[i]).length, mitUrteil = pruef.filter(i => ki.has(i)).length;
console.log(`  Prüfliste für Ticket 16 (nach der Formel mehr als ${MAX_WANDERN} Plätze): ${pruef.length} Level, `
  + `${vorn} nach vorn, ${pruef.length - vorn} nach hinten; mit Urteil der KI-Tester ${mitUrteil}`);
const vz = (k) => `${k > 0 ? '+' : '−'}${Math.abs(k)}`;
/** Der Entscheid zu einem Level der Prüfliste (Ticket 16), oder dass es noch kein zählendes Urteil hat. */
const entscheid = (i) => {
  const u = ki.get(i);
  if (!u) return heute[i] === null ? 'noch kein Urteil' : 'noch kein Urteil, bleibt';
  const korrektur = u.verschiebung ? `, Korrektur ${vz(u.verschiebung)}` : '';
  const abgelehnt = u.abgelehnt ? `, abgelehnt (${u.gruende.join(', ')})` : '';
  const einordnung = (t) => `${t} ${u.eintrag.urteile[t].einordnung}`;
  const wohin = `${korrektur}${abgelehnt} → Platz ${platz[i]}`;
  if (u.neu) return `${u.eintrag.lauf}: ${einordnung('A')}, ${einordnung('B')}${wohin}`;
  const je = Object.entries(u.je).map(([t, x]) => `${einordnung(t)} `
    + `${x.stimmtZu ? 'stimmt zu' : 'nicht'} (Abstand Formel ${x.formel}, alt ${x.alt})`).join(', ');
  return `${u.eintrag.lauf}: ${u.zurFormel ? 'zur Formel' : 'bleibt'}${wohin}; ${je}`;
};
for (const i of pruef) {
  const fest = ki.get(i)?.formelEntscheid, beiEntscheid = fest && fest !== formel[i] ? `, beim Entscheid ${fest}` : '';
  console.log(`    ${name(i)}: Formel ${formel[i]} (${vz(formel[i] - heute[i])}${beiEntscheid}), Schwierigkeit `
    + `${zahl(werte[i])}; ${entscheid(i)}`);
}
for (const i of nachgezogen) {
  console.log(`  bleibt ausserdem, weil es zwischen den Leveln der Prüfliste ${MAX_WANDERN} Plätze überschritte: `
    + `${name(i)} (Formel ${formel[i]})`);
}
// Neue Level (Austausch, Tickets 23–26): nach der Formel, dazu das Urteil der KI-Tester aus einem Lauf ersatz-…
if (neue.length) console.log(`  Neue Level (ohne heutigen Platz, nach der Formel): ${neue.length}`);
for (const i of [...neue].sort((x, y) => platz[x] - platz[y])) {
  const a = austausch.find(x => x.level === levels[i]);
  const ziel = a?.schwierigkeit ? `, Ziel ${zielText(a)}` : '';
  const herkunft = a ? `ersetzt ${a.ersetzt}${a.auftrag ? `, ${a.auftrag} Seed ${a.seed}${ziel}` : ''}; ` : '';
  console.log(`    ${levels[i].name}${levels[i].name === kandidat[i] ? '' : ` (${kandidat[i]})`}: ${herkunft}Platz `
    + `${platz[i]}, Formel ${formel[i]}, Schwierigkeit ${zahl(werte[i], 2)}, ${grad[i]}, Haupt-Kernidee `
    + `${b[i].hauptKernidee.begriff ?? '–'}, Spielwert ${zahl(b[i].spielwert.wert)}; ${entscheid(i)}`);
}

// Schwellen und Grade
console.log('\nSchwellen der Grade');
const sortiert = [...werte].sort((x, y) => x - y);
let grenze = 0;
VORLAEUFIG.slice(0, -1).forEach((anzahl, g) => {
  grenze += anzahl;
  const luecken = [];
  for (let k = grenze - FENSTER; k <= grenze + FENSTER; k++) {
    luecken.push({ k, von: sortiert[k - 1], bis: sortiert[k] });
  }
  const breiteste = luecken.reduce((x, y) => (y.bis - y.von > x.bis - x.von ? y : x));
  const s = SCHWELLEN[GRADE[g + 1]], vorlaeufig = luecken[FENSTER];
  console.log(`  ${GRADE[g + 1]} ab ${zahl(s)}: vorläufige Grenze nach ${grenze} Leveln liegt zwischen `
    + `${zahl(vorlaeufig.von, 2)} und ${zahl(vorlaeufig.bis, 2)} (Lücke ${zahl(vorlaeufig.bis - vorlaeufig.von, 2)}); `
    + `breiteste Lücke bis ${FENSTER} Plätze davon nach ${breiteste.k} Leveln, ${zahl(breiteste.von, 2)} bis `
    + `${zahl(breiteste.bis, 2)} (${zahl(breiteste.bis - breiteste.von, 2)})`);
  if (!(s > breiteste.von && s < breiteste.bis)) console.log(`    Achtung: ${zahl(s)} liegt nicht in dieser Lücke`);
  const nah = werte.filter(w => Math.abs(w - s) <= 1).length;
  console.log(`    ${nah} Level liegen höchstens 1 Punkt von der Schwelle entfernt`);
});
const jeGrad = (g, nach) => [...Array(n).keys()].filter(i => nach(i) === g);
console.log('  Level je Grad nach der Schwelle:',
  GRADE.map(g => `${g} ${jeGrad(g, i => gradVon(werte[i])).length}`).join(', '));
console.log('  Level je Grad in der Reihenfolge:', GRADE.map((g) => {
  const plaetze = jeGrad(g, i => grad[i]).map(i => platz[i]);
  return `${g} ${plaetze.length} (Plätze ${Math.min(...plaetze)}–${Math.max(...plaetze)})`;
}).join(', '));
const anders = [...Array(n).keys()].filter(i => grad[i] !== gradVon(werte[i])).sort((i, j) => platz[i] - platz[j]);
console.log(`  Grad des Abschnitts statt nach der Schwelle (bleibt am heutigen Platz): ${anders.length} Level`);
for (const i of anders) console.log(`    ${name(i)}: ${grad[i]} statt ${gradVon(werte[i])} (${zahl(werte[i])})`);
// Zum Vergleich zwei andere Regeln, damit der Grad nie sinkt: das laufende Maximum der Grade nach der Schwelle von vorn
// und das laufende Minimum von hinten. Ein Level der Prüfliste zieht dabei viele andere mit.
const nachSchwelle = folge.map(i => rang(gradVon(werte[i])));
const maxVorn = nachSchwelle.map((_, k) => Math.max(...nachSchwelle.slice(0, k + 1)));
const minHinten = nachSchwelle.map((_, k) => Math.min(...nachSchwelle.slice(k)));
for (const [text, r] of [['laufendes Maximum von vorn', maxVorn], ['laufendes Minimum von hinten', minHinten]]) {
  const teile = GRADE.map((g, gi) => {
    const p = r.map((x, k) => (x === gi ? k + 1 : 0)).filter(Boolean);
    return `${g} ${p.length}${p.length ? ` (${p[0]}–${p.at(-1)})` : ''}`;
  });
  console.log(`  zum Vergleich ${text}: ${teile.join(', ')}; ${r.filter((x, k) => x !== nachSchwelle[k]).length} `
    + 'Level nicht nach der Schwelle');
}
const gewechselt = [...Array(n).keys()].filter(i => heute[i] !== null
  && grad[i] !== provisionalGradeOf(heute[i]).name);
console.log(`  Grad anders als vorläufig nach heutigem Platz: ${gewechselt.length} Level`);
for (const g of GRADE) {
  const hin = gewechselt.filter(i => grad[i] === g);
  const war = (i) => `${name(i)} (war ${provisionalGradeOf(heute[i]).name})`;
  if (hin.length) console.log(`    jetzt ${g}: ${hin.map(war).join(', ')}`);
}

// Duldungsliste
const gilt = (grund, i) => GRUENDE[grund].gilt(b[i], grad[i], ki.get(i));
const begriffe = (x) => [...new Set(x.ausschluesse.map(a => a.begriff))].join(', ');
const WARUM = {
  ausschlussgrund: i => begriffe(b[i]), unterMindestSpielwert: i => zahl(b[i].spielwert.wert),
  abgelehnt: i => `${ki.get(i).gruende.join(', ')}, ${ki.get(i).eintrag.lauf}`,
};
console.log('\nDuldungsliste (Grad der Reihenfolge, Plätze heute)');
const nachPlatz = (liste) => liste.sort((i, j) => i - j);
const zeige = (liste, warum) => liste.map(i => `${name(i)}${warum ? ` (${warum(i)})` : ''}`).join(', ') || '–';
const jeGradText = (liste) => GRADE.map(g => `${g} ${liste.filter(i => grad[i] === g).length}`).join(', ');
const duldungJe = Object.fromEntries(Object.keys(GRUENDE).map(grund => [grund,
  nachPlatz([...Array(n).keys()].filter(i => gilt(grund, i)))]));
for (const [grund, alle] of Object.entries(duldungJe)) {
  console.log(`  ${GRUENDE[grund].text}: ${alle.length} Level (${jeGradText(alle)})`);
  for (const g of GRADE) {
    const hier = alle.filter(i => grad[i] === g);
    if (hier.length) console.log(`    ${g}: ${zeige(hier, WARUM[grund])}`);
  }
}
const ausschluss = duldungJe.ausschlussgrund;
// Die Level der Neuzählung (heutige Plätze), soweit sie noch im Spiel stehen; die übrigen sind ausgetauscht
const neuzaehlung = NEUZAEHLUNG.map(p => heute.indexOf(p)).filter(i => i >= 0);
const ausgetauscht = NEUZAEHLUNG.filter(p => !heute.includes(p)).map(p => `${p} ${HEUTIGE_REIHENFOLGE[p - 1]}`);
console.log(`  Vergleich mit den ${NEUZAEHLUNG.length} Leveln der Neuzählung`
  + `${ausgetauscht.length ? ` (ausgetauscht: ${ausgetauscht.join(', ')})` : ''}:`);
console.log(`    neu: ${zeige(ausschluss.filter(i => !neuzaehlung.includes(i)), WARUM.ausschlussgrund)}`);
console.log(`    fallen weg: ${zeige(neuzaehlung.filter(i => !ausschluss.includes(i)))}`);
console.log('    entfallen mit dem Grad leicht (Füllteil und Zerfall gelten erst ab „mittel“): '
  + `${zeige(neuzaehlung.filter(i => !ausschluss.includes(i) && ohneGrad[i].ausschluesse.length),
    i => begriffe(ohneGrad[i]))}`);
const duldung = nachPlatz([...Array(n).keys()].filter(i => Object.keys(GRUENDE).some(grund => gilt(grund, i))));
console.log(`  Duldungsliste zusammen: ${duldung.length} Level (${GRADE.map(g => `${g} `
  + `${duldung.filter(i => grad[i] === g).length} von ${jeGrad(g, i => grad[i]).length}`).join(', ')})`);
const nurKernidee = duldung.filter(i => !gilt('ausschlussgrund', i) && !gilt('abgelehnt', i));
const beide = nurKernidee.filter(i => gilt('ohneKernidee', i) && gilt('unterMindestSpielwert', i));
const nurOhne = nurKernidee.filter(i => !gilt('unterMindestSpielwert', i));
const nurUnter = nurKernidee.filter(i => !gilt('ohneKernidee', i));
console.log(`    ohne Ausschlussgrund: ${nurKernidee.length}, davon ohne nötige Kernidee und unter dem `
  + `Mindest-Spielwert ${beide.length}; nur ohne Kernidee: ${zeige(nurOhne, WARUM.unterMindestSpielwert)}; `
  + `nur unter dem Mindest-Spielwert: ${zeige(nurUnter, WARUM.unterMindestSpielwert)}`);
// Behalten nach Urteil der KI-Tester (Ticket 24): die Gruppe aus levelliste.json, wie sie ist, ohne Level, die es nicht
// mehr gibt; sie wächst nie. Je Level die Regel stark (levelliste.mjs) am ganzen Protokoll
const behalten = ((existsSync(DATEI) ? ladeLevelliste().behalten : null) ?? [])
  .filter(x => levels.some(l => l.name === x));
const behaltenIdx = behalten.map(x => levels.findIndex(l => l.name === x));
const protokoll = alleUrteile();
const nichtStark = behalten.filter(x => !stark(x, protokoll).stark);
console.log(`    behalten nach Urteil der KI-Tester (Ticket 24): ${behalten.length} Level `
  + `(${GRADE.map(g => `${g} ${behaltenIdx.filter(i => grad[i] === g).length}`).join(', ')}); nicht stark: `
  + `${nichtStark.join(', ') || '–'}; auf der Duldungsliste ohne diesen Grund: `
  + `${duldung.filter(i => !behaltenIdx.includes(i)).length}`);
const geduldetGeprueft = duldung.filter(i => ordnung.pruefliste.includes(i));
console.log(`    auch auf der Prüfliste: ${geduldetGeprueft.length}, davon mit Ausschlussgrund `
  + `${geduldetGeprueft.filter(i => gilt('ausschlussgrund', i)).length}; Prüfliste ohne Duldungsliste: `
  + `${zeige(pruef.filter(i => !duldung.includes(i)))}`);
console.log('  Grenzfälle der Neuzählung:');
for (const [art, plaetze] of Object.entries(GRENZFAELLE)) {
  const fall = (i, p) => (i < 0 ? `${p} ${HEUTIGE_REIHENFOLGE[p - 1]} ausgetauscht`
    : `${name(i)} ${begriffe(b[i]) || 'besteht'}`);
  console.log(`    ${art}: ${plaetze.map(p => fall(heute.indexOf(p), p)).join('; ')}`);
}

// Regeln der Levelliste (Nahtstelle 3)
console.log('\nRegeln der Levelliste (Nahtstelle 3), in der neuen Reihenfolge');
const sinkt = folge.filter((i, k) => k && rang(grad[i]) < rang(grad[folge[k - 1]]));
console.log(`  Jedes Level hat einen Grad: ${grad.every(g => GRADE.includes(g)) ? 'ja' : 'nein'}; der Grad sinkt `
  + `${sinkt.length ? `bei ${zeige(sinkt)}` : 'nie'}`);
const ungeduldet = (i) => !duldung.includes(i);
const SICHTEN = [['alle', () => true], ['ohne die Duldungsliste', ungeduldet],
  ['ohne die Prüfliste', i => !bleibt.has(i)], ['ohne beide', i => ungeduldet(i) && !bleibt.has(i)]];
console.log('  Mittel der Schwierigkeit je 10 Level:');
console.log(`    ${zehner(folge).map(z => zahl(mittel(z.map(i => werte[i])))).join(' ')}`);
for (const [text, wer] of [...SICHTEN, ['heutige Reihenfolge', null]]) {
  // Eine Gruppe ohne Level dieser Sicht zählt nicht; verglichen wird dann mit der vorigen, die eines hat
  const je = zehner(wer ? folge : [...Array(n).keys()]).map((z, k) => ({ k, w: z.filter(wer ?? (() => true)) }))
    .filter(g => g.w.length).map(g => ({ k: g.k, m: mittel(g.w.map(i => werte[i])) }));
  const schritte = je.slice(1).map((g, j) => ({ von: je[j].k, k: g.k, s: g.m - je[j].m }));
  const kleinster = schritte.reduce((x, y) => (y.s < x.s ? y : x));
  console.log(`    ${text}: kleinster Schritt ${zahl(kleinster.s, 2)} (Plätze ${10 * kleinster.von + 1}–`
    + `${10 * kleinster.k + 10}), Schritte ${schritte.map(s => zahl(s.s)).join(' ')}`
    + `${je.length < 15 ? `; ${15 - je.length} Gruppen ohne Level` : ''}`);
}
console.log('  Haupt-Kernidee höchstens zweimal je 10 Level:');
for (const [text, wer] of SICHTEN) {
  const verletzt = [];
  zehner(folge).forEach((z, k) => {
    const zahlJe = {};
    for (const i of z.filter(wer)) {
      const h = b[i].hauptKernidee.begriff;
      if (h) (zahlJe[h] ??= []).push(i);
    }
    for (const [h, mit] of Object.entries(zahlJe).filter(([, mit]) => mit.length > 2)) {
      verletzt.push(`Plätze ${10 * k + 1}–${10 * k + 10}: ${h} ${mit.length}-mal, ${zeige(mit)}`);
    }
  });
  console.log(`    ${text}: ${verletzt.length ? `${verletzt.length} Verletzungen` : 'eingehalten'}`);
  for (const v of verletzt) console.log(`      ${v}`);
}
let gleitend = 0;
for (let a = 0; a + 10 <= n; a++) {
  const zahlJe = {};
  for (const i of folge.slice(a, a + 10)) {
    const h = b[i].hauptKernidee.begriff;
    if (h) zahlJe[h] = (zahlJe[h] || 0) + 1;
  }
  if (Object.values(zahlJe).some(x => x > 2)) gleitend++;
}
console.log(`    zum Vergleich in gleitenden Fenstern zu 10 Leveln, alle: verletzt in ${gleitend} von ${n - 9}`);
const namen = [...L.LEVELS.slice(0, L.TUTORIAL_COUNT), ...levels].map(l => l.name);
const bisherEntfernt = existsSync(DATEI) ? ladeLevelliste().entfernteNamen : [];
const wiederVergeben = namen.filter(x => bisherEntfernt.includes(x) || ersetzt.includes(x));
console.log(`  Namen eindeutig: ${new Set(namen).size === namen.length ? 'ja' : 'nein'}; entfernte Namen wieder `
  + `vergeben: ${wiederVergeben.join(', ') || 'keine'}`);
const mehrdeutig = levels.map((level, i) => [i, level, solve(level, { unique: true })]).filter(([, level, r]) => {
  const norm = (set) => Object.entries(set).map(([z, v]) => {
    const el = level.elements.find(e => `${e.x},${e.z}` === z);
    return `${z}:${v % period(el)}`;
  }).sort().join(' ');
  return r.aborted || r.count !== 1 || norm(r.solutions[0].set) !== norm(level.solution);
});
console.log(`  Genau eine Lösung: ${mehrdeutig.length ? `nicht bei ${zeige(mehrdeutig.map(([i]) => i))}` : 'alle'}`);
const kiText = (wer) => [...ki].filter(([, u]) => wer(u)).map(([i]) => name(i)).join(', ') || '–';
const kiNeu = [...ki.values()].filter(u => u.neu).length;
console.log(`  Urteile der KI-Tester (Ablauf 2): ${ki.size - kiNeu} von ${pruef.length} Leveln der Prüfliste `
  + `(Ticket 16, pruefung-…), ${kiNeu} von ${neue.length} neuen Leveln (ersatz-…); zur Formel: `
  + `${kiText(u => u.zurFormel)}; eigene Korrektur: ${kiText(u => u.verschiebung)}; abgelehnt: `
  + `${kiText(u => u.abgelehnt)}`);
const zug = ({ i, von, nach }) => `${name(i)} (${b[i].hauptKernidee.begriff ?? 'ohne Haupt-Kernidee'}`
  + `${duldung.includes(i) ? ', Duldungsliste' : ''}) von Platz ${von + 1} auf ${nach + 1}`;
console.log(`  Häufung der Haupt-Kernidee (höchstens ${HAUPT_KERNIDEE_JE_10} je 10 Level ohne die Duldungsliste): `
  + `${ordnung.zuege.length ? ordnung.zuege.map(zug).join('; ') : 'keine Züge'}`);
const offenText = ordnung.offen.map(h => `Plätze ${10 * h.gruppe + 1}–${10 * h.gruppe + 10}: ${h.begriff} `
  + `${h.mit.length}-mal, ${h.mit.map(name).join(', ')}`).join('; ');
if (offenText) console.log(`    nicht aufzulösen mit höchstens ${MAX_ENTZERREN} Plätzen: ${offenText}`);
// Viele Korrekturen nahe beieinander schieben einander, ebenso die Züge der Häufungsregel (Ticket 24, Review M1)
const zuWeit = zuWeitKorrigiert(ordnung);
console.log(`  Korrekturen der KI-Tester höchstens ${MAX_SHIFT} Plätze vom Platz davor, nach den Korrekturen und am `
  + `Ende: ${zuWeit.length ? `nicht bei ${zuWeit.map(v => `${name(v.i)} (Platz davor ${v.davor}, nach den `
    + `Korrekturen ${v.korrigiert}, am Ende ${v.ende})`).join('; ')}` : 'eingehalten'}`);
console.log('  Anker der KI-Tester (je zwei pro Grad, am unteren und oberen Ende):');
// Die Anker stehen in anchors.json mit Namen; i ist ihr heutiger Platz (Index), wie bei den übrigen Zeilen hier
for (const a of loadAnchors().map(x => ({ ...x, i: levels.findIndex(l => l.name === x.name) }))) {
  console.log(`    ${a.id} ${name(a.i)}: ${a.grad} ${a.ende} → Platz ${platz[a.i]}, ${grad[a.i]}`
    + `${grad[a.i] === a.grad ? '' : ' (anderer Grad)'}`
    + `${ordnung.pruefliste.includes(a.i) ? ', auf der Prüfliste' : ''}`);
}

// Spielwert und Schwierigkeit (Hinweis aus Ticket 12)
const korrelation = [['alle', () => true], ...GRADE.map(g => [g, i => grad[i] === g])].map(([text, wer]) => {
  const i = [...Array(n).keys()].filter(wer);
  return `${text} ${zahl(rangkorrelation(i.map(j => b[j].spielwert.wert), i.map(j => werte[j])), 2)}`;
});
console.log(`\nRangkorrelation von Spielwert und Schwierigkeit: ${korrelation.join(', ')}`);

// Stand der Leveldaten und der Levelliste
const reihe = L.LEVELS.slice(L.TUTORIAL_COUNT);
const imSpielGleich = folge.every((i, k) => reihe[k]?.name === levels[i].name && reihe[k].grad === grad[i]);
const bisher = existsSync(DATEI) ? ladeLevelliste() : null;
// Die ursprüngliche Liste wuchs einmal, in Ticket 16, um begründete Ergänzungen (ergaenzungBegruendet): Level, die
// beide KI-Tester ablehnen, und Level, die durch ihr Urteil in einen Grad kommen, in dem sie eine Regel verletzen
const bisherIn = (grund) => bisher?.urspruenglich?.[grund] ?? [];
const neuAufListe = Object.fromEntries(Object.keys(GRUENDE).map(grund => [grund,
  duldungJe[grund].filter(i => !bisherIn(grund).includes(levels[i].name))]));
const ergaenzt = Object.fromEntries(Object.keys(GRUENDE).map(grund => [grund, [...new Set([
  ...(bisher?.ergaenzt?.[grund] ?? []),
  ...folgeNamen(neuAufListe[grund].filter(i => ergaenzungBegruendet(grund, ki.get(i), grad[i]))),
])]]));
const listen = {
  duldung: Object.fromEntries(Object.entries(duldungJe).map(([grund, alle]) => [grund, folgeNamen(alle)])),
  pruefliste: folgeNamen(pruef),
  prueflisteErledigt: pruef.every(i => ki.has(i)),
};
// Der Platz der Formel beim Entscheid über die Level der Prüfliste bleibt fest (Ticket 26); ein Level mit neuem Urteil
// kommt mit seinem Platz der Formel von heute dazu (festePlaetze)
const prueflisteFormel = festePlaetze(bisher?.prueflisteFormel ?? null, ordnung, levels.map(l => l.name));
for (const [grund, neu] of Object.entries(neuAufListe)) {
  const ohne = neu.filter(i => !ergaenzt[grund].includes(levels[i].name));
  if (neu.length) console.log(`  neu auf der Duldungsliste (${GRUENDE[grund].text}): ${zeige(neu)}`);
  if (ohne.length) console.log(`    Achtung, nicht begründet (Ticket 16): ${zeige(ohne)}`);
}
const listenGleich = bisher && ['duldung', 'pruefliste', 'prueflisteErledigt']
  .every(k => JSON.stringify(bisher[k]) === JSON.stringify(listen[k]))
  && JSON.stringify(bisher.ergaenzt) === JSON.stringify(ergaenzt)
  && JSON.stringify(bisher.prueflisteFormel) === JSON.stringify(prueflisteFormel)
  && JSON.stringify(bisher.behalten ?? []) === JSON.stringify(behalten);
console.log(`\nindex.html: Reihenfolge und Grade ${imSpielGleich ? 'stimmen' : 'weichen ab'}; levelliste.json: `
  + `${!bisher ? 'fehlt' : listenGleich ? 'Duldungsliste und Prüfliste stimmen' : 'weicht ab'}`);
// Mit dem Austausch nur, wenn jedes neue Level seinen genehmigten Namen und ein zählendes Urteil hat, das es nicht
// ablehnt (Lehnen beide KI-Tester ab, kommt ein neuer Kandidat; Tickets 23–26)
const austauschOffen = austausch.flatMap((a) => {
  const i = levels.indexOf(a.level), u = ki.get(i);
  return [
    ...(a.level.name === kandidat[i] ? [`${a.ersetzt}: Der Ersatz hat noch keinen genehmigten Namen`] : []),
    ...(!u ? [`${levels[i].name}: noch kein Urteil der KI-Tester (Lauf ersatz-…)`] : []),
    ...(u?.abgelehnt ? [`${levels[i].name}: von beiden KI-Testern abgelehnt (${u.gruende.join(', ')})`] : []),
  ];
});
if (schreiben && (ordnung.offen.length || zuWeit.length)) {
  if (ordnung.offen.length) {
    console.log('  nicht geschrieben: Eine Häufung der Haupt-Kernidee lässt sich nach der Regel nicht auflösen '
      + '(oben).');
  }
  if (zuWeit.length) {
    console.log(`  nicht geschrieben: Ein von den KI-Testern korrigiertes Level steht mehr als ${MAX_SHIFT} Plätze von `
      + `seinem Platz davor (oben): ${zuWeit.map(v => name(v.i)).join(', ')}`);
  }
  process.exitCode = 1;
} else if (schreiben && (austauschOffen.length || wiederVergeben.length)) {
  console.log(`  nicht geschrieben: ${[...austauschOffen, ...wiederVergeben.map(x => `${x}: entfernter Name`)]
    .join('; ')}`);
  process.exitCode = 1;
} else if (schreiben) {
  if (!imSpielGleich) schreibeLevels();
  const urspruenglich = Object.fromEntries(Object.keys(GRUENDE).map(grund => [grund,
    bisher ? [...new Set([...bisherIn(grund), ...ergaenzt[grund]])] : listen.duldung[grund]]));
  const entfernteNamen = [...new Set([...(bisher?.entfernteNamen ?? []), ...ersetzt])];
  writeFileSync(DATEI, levellisteText({
    ...listen, urspruenglich, ergaenzt, entfernteNamen, prueflisteFormel, behalten,
  }));
  if (austausch.length) schreibeEntfernte();
  console.log(`  geschrieben: ${imSpielGleich ? '' : 'index.html und '}levelliste.json`
    + `${austausch.length ? ' und beurteilung/entfernte-level.json' : ''}`);
}

if (jsonDatei) {
  writeFileSync(jsonDatei, JSON.stringify(folge.map(i => ({
    platz: platz[i], heute: heute[i], name: levels[i].name, schwierigkeit: werte[i], formel: formel[i],
    grad: grad[i], gradNachSchwelle: gradVon(werte[i]), bleibt: bleibt.get(i) ?? null,
    pruefliste: ordnung.pruefliste.includes(i),
    kiTester: ki.has(i) ? { lauf: ki.get(i).eintrag.lauf, zurFormel: ki.get(i).zurFormel,
      verschiebung: ki.get(i).verschiebung, abgelehnt: ki.get(i).abgelehnt } : null,
    duldung: Object.keys(GRUENDE).filter(grund => gilt(grund, i)), ausschluesse: begriffe(b[i]),
    hauptKernidee: b[i].hauptKernidee.begriff, spielwert: b[i].spielwert.wert,
    // ein neues Level: der Name bei den KI-Testern und die Leveldaten (für prepare.mjs --kandidaten)
    ...(heute[i] === null ? { kandidat: kandidat[i], level: levels[i] } : {}),
  })), null, 1) + '\n');
  console.log(`\nErgebnis je Level in ${jsonDatei}`);
}
console.log(`\nLaufzeit ${zahl((Date.now() - start) / 1000)} s`);

/** Namen der Level (Indizes) in der neuen Reihenfolge. */
function folgeNamen(liste) {
  return liste.slice().sort((i, j) => platz[i] - platz[j]).map(i => levels[i].name);
}

/**
 * Liest den Austausch (siehe Kopf): eine JSON-Liste oder eine JSON-Zeile je Eintrag. Jeder Eintrag ersetzt ein anderes
 * Level im Spiel; das neue Level heisst wie genehmigt (name) oder „Kandidat <Abdruck>“. Rückgabe: je Eintrag
 * { ersetzt, auftrag, seed, schwierigkeit, level } mit den Leveldaten samt Name und Grad; schwierigkeit ist die
 * Ziel-Schwierigkeit [von, bis] des Auftrags oder null.
 */
function ladeAustausch(datei) {
  const text = readFileSync(datei, 'utf8').trim();
  const liste = text.startsWith('[') ? JSON.parse(text)
    : text.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
  const main = L.LEVELS.slice(L.TUTORIAL_COUNT);
  return liste.map((a, k) => {
    const wo = `${datei}, Eintrag ${k + 1}`;
    if (!main.some(l => l.name === a.ersetzt)) throw new Error(`${wo}: kein Level „${a.ersetzt}“ im Spiel`);
    if (liste.filter(x => x.ersetzt === a.ersetzt).length > 1) throw new Error(`${wo}: „${a.ersetzt}“ zweimal`);
    if (!Array.isArray(a.level?.elements) || !a.level.solution || !GRADE.includes(a.level.grad)) {
      throw new Error(`${wo}: Leveldaten mit elements, solution und grad nötig`);
    }
    const ziel = a.schwierigkeit ?? null;
    if (ziel && !(Array.isArray(ziel) && ziel.length === 2 && ziel.every(Number.isFinite) && ziel[0] <= ziel[1])) {
      throw new Error(`${wo}: schwierigkeit muss [von, bis] sein, nicht ${JSON.stringify(ziel)}`);
    }
    const { name: _, ...daten } = a.level;
    return { ersetzt: a.ersetzt, auftrag: a.auftrag ?? null, seed: a.seed ?? null, schwierigkeit: ziel,
      level: { name: a.name || kandidatName(daten), ...daten } };
  });
}

/**
 * Hängt die Leveldaten der ersetzten Level an die feste Kopie für die Eichung an (beurteilung/entfernte-level.json,
 * siehe heutige-reihenfolge.mjs), so wie sie im Spiel standen; ein Level je Zeile.
 */
function schreibeEntfernte() {
  // nur Level der heutigen Reihenfolge; ein ersetztes neues Level ist nicht Teil des Massstabs
  const neu = ersetzt.filter(x => HEUTIGE_REIHENFOLGE.includes(x))
    .map(x => L.LEVELS.find(l => l.name === x && !l.tutorial));
  const alle = [...entfernteLevel().filter(l => !ersetzt.includes(l.name)), ...neu];
  writeFileSync(ENTFERNTE, '{\n'
    + '  "kommentar": "Entfernte Level der heutigen Reihenfolge, wie sie zuletzt im Spiel standen: feste Kopie für die '
    + 'Eichung (heutige-reihenfolge.mjs, Tickets 23–26).",\n'
    + `  "level": [\n${alle.map(l => `    ${JSON.stringify(l)}`).join(',\n')}\n  ]\n}\n`);
}

/**
 * Ordnet die Level in index.html zwischen den Markierungen LEVELS:BEGIN und LEVELS:END nach der neuen Reihenfolge und
 * setzt je Level das Feld grad hinter den Namen (statt der alten Markierung difficulty). Jedes Level steht dort als
 * Block von „  {“ bis „  },“; der Text eines Blocks bleibt sonst unverändert. Mit dem Austausch fallen die Blöcke der
 * ersetzten Level weg, und die neuen kommen dazu (levelCode in leveldaten.mjs, mit Herkunft im Kommentar).
 */
function schreibeLevels() {
  const html = readFileSync(INDEX, 'utf8'), nl = html.includes('\r\n') ? '\r\n' : '\n';
  const a = html.indexOf('/* LEVELS:BEGIN */'), e = html.indexOf('/* LEVELS:END */');
  if (a < 0 || e < a) throw new Error('index.html: Markierungen LEVELS:BEGIN/END fehlen');
  const von = html.indexOf(nl, a) + nl.length, bis = html.lastIndexOf(nl, e) + nl.length;
  const bloecke = new Map();
  let block = null;
  for (const zeile of html.slice(von, bis).split(nl).slice(0, -1)) {
    if (zeile === '  {') block = [zeile];
    else if (!block) throw new Error(`index.html: Zeile ausserhalb eines Levels: ${zeile}`);
    else block.push(zeile);
    if (zeile === '  },') {
      const m = block.map(z => z.match(/^ {4}name: '([^']+)'(?:, difficulty: '[a-z ]+')?(?:, grad: '[a-z ]+')?,$/))
        .find(Boolean);
      if (!m) throw new Error(`index.html: Level ohne Namenszeile: ${block.slice(0, 3).join(' ')}`);
      bloecke.set(m[1], block);
      block = null;
    }
  }
  for (const x of ersetzt) bloecke.delete(x);
  for (const a of austausch) {
    // Herkunft im Kommentar, so dass generiere.mjs das Level nachbaut: Auftrag, Seed und Ziel-Schwierigkeit (die alte
    // Zeile „Wertung …“ der übrigen Level gibt es für neue nicht)
    const teile = [a.seed !== null && `Seed ${a.seed}`,
      a.schwierigkeit && `Ziel ${zielText(a)}`];
    const herkunft = a.auftrag ? `Generator ${[a.auftrag, ...teile.filter(Boolean)].join(', ')} · ` : '';
    const kommentar = [`${herkunft}ersetzt ${a.ersetzt} (Austausch „${grad[levels.indexOf(a.level)]}“)`];
    bloecke.set(a.level.name, levelCode(a.level, kommentar).split('\n'));
  }
  if (bloecke.size !== n) throw new Error(`index.html: ${bloecke.size} Level zwischen den Markierungen, erwartet ${n}`);
  const text = folge.map((i) => {
    const neu = bloecke.get(levels[i].name);
    if (!neu) throw new Error(`index.html: Level „${levels[i].name}“ fehlt`);
    return neu.map(z => z.replace(/^( {4}name: '[^']+')(?:, difficulty: '[a-z ]+')?(?:, grad: '[a-z ]+')?,$/,
      `$1, grad: '${grad[i]}',`)).join(nl);
  }).join(nl) + nl;
  writeFileSync(INDEX, html.slice(0, von) + text + html.slice(bis));
}

/** levelliste.json mit Namenslisten zu höchstens 120 Zeichen je Zeile. */
function levellisteText({
  duldung, urspruenglich, ergaenzt, entfernteNamen, pruefliste, prueflisteErledigt, prueflisteFormel, behalten = [],
}) {
  const zeilenweise = (teile, einzug, auf, zu) => {
    if (!teile.length) return `${auf}${zu}`;
    const zeilen = [];
    let z = '';
    for (const t of teile) {
      if (z && einzug.length + 2 + z.length + 2 + t.length > 118) {
        zeilen.push(z + ',');
        z = t;
      } else z = z ? `${z}, ${t}` : t;
    }
    zeilen.push(z);
    return `${auf}\n${zeilen.map(x => `${einzug}  ${x}`).join('\n')}\n${einzug}${zu}`;
  };
  const liste = (namen, einzug) => zeilenweise(namen.map(x => JSON.stringify(x)), einzug, '[', ']');
  const plaetze = (je, einzug) => zeilenweise(Object.entries(je).map(([k, v]) => `${JSON.stringify(k)}: ${v}`),
    einzug, '{', '}');
  const gruppe = (g) => `{\n${Object.keys(GRUENDE).map(k => `    "${k}": ${liste(g[k] ?? [], '    ')}`)
    .join(',\n')}\n  }`;
  return '{\n'
    + '  "kommentar": "Duldung, ursprüngliche Liste, Ergänzungen aus Ticket 16, entfernte Namen, Prüfliste, behalten '
    + 'nach Urteil der KI-Tester (levelliste.mjs).",\n'
    + `  "duldung": ${gruppe(duldung)},\n`
    + `  "urspruenglich": ${gruppe(urspruenglich)},\n`
    + `  "ergaenzt": ${gruppe(ergaenzt)},\n`
    + `  "entfernteNamen": ${liste(entfernteNamen, '  ')},\n`
    + `  "pruefliste": ${liste(pruefliste, '  ')},\n`
    + `  "prueflisteErledigt": ${prueflisteErledigt},\n`
    + `  "prueflisteFormel": ${plaetze(prueflisteFormel, '  ')},\n`
    + `  "behalten": ${liste(behalten, '  ')}\n`
    + '}\n';
}
