// Reihenfolge und Grade der 150 Level (Ticket 15; Spec „Levelliste, Reihenfolge und Austausch“, „Beurteilung“ und
// „Entscheide zu den Tests“, Nahtstelle 3): das Werkzeug, aus dem Reihenfolge, Grade, Duldungsliste und Prüfliste
// entstehen. Es beurteilt die Level (beurteilung/parallel.mjs), rechnet nach den Regeln in levelliste.mjs und
// berichtet; mit --schreiben trägt es das Ergebnis in index.html und levelliste.json ein.
// - Reihenfolge: nach der Schwierigkeit, Verschiebungen bis MAX_WANDERN Plätze, weiter wandernde Level bleiben an ihrem
//   heutigen Platz (Prüfliste für Ticket 16). Gerechnet wird immer von der heutigen Reihenfolge aus
//   (beurteilung/heutige-reihenfolge.mjs), nicht von der in index.html; ein zweiter Lauf ändert darum nichts.
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
//   Eindeutigkeit der Lösung; dazu die Anker der KI-Tester und der Zusammenhang von Spielwert und Schwierigkeit.
// Aufruf: sh tools/leise.sh node tools/ordne-level.mjs [--schreiben] [--json <datei>]   (etwa 40 s, vier Threads)
//   --schreiben: ordnet die Level in index.html (zwischen LEVELS:BEGIN und LEVELS:END) und setzt ihren Grad (Feld
//                grad); schreibt in levelliste.json die Duldungsliste und die Prüfliste. Die ursprüngliche
//                Duldungsliste und die entfernten Namen bleiben, wie sie sind; fehlt die Datei, ist die ursprüngliche
//                die heutige.
//   --json:      schreibt das Ergebnis je Level (heutiger und neuer Platz, Grad, Gründe) in die Datei.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { L, solve, period } from './solver.mjs';
import { GRADE } from './beurteilung/index.mjs';
import { beurteileAlle } from './beurteilung/parallel.mjs';
import { SCHWELLEN, gradVon } from './beurteilung/grad.mjs';
import { inHeutigerReihenfolge } from './beurteilung/heutige-reihenfolge.mjs';
import { rangkorrelation } from './beurteilung/schwierigkeit-eichung.mjs';
import { gradeOf, loadAnchors } from './ki-tester/protocol.mjs';
import { DATEI, GRUENDE, MAX_WANDERN, ladeLevelliste, ordne, gradeEntlang, zehner } from './levelliste.mjs';

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
const mittel = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const rang = (grad) => GRADE.indexOf(grad);
const argument = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);

const levels = inHeutigerReihenfolge();
const n = levels.length;
const name = (i) => `${i + 1} ${levels[i].name}`;
const schreiben = process.argv.includes('--schreiben');
const jsonDatei = argument('--json');
const start = Date.now();

// Bis zum Fixpunkt: Reihenfolge und Grade aus der Schwierigkeit, die Beurteilung mit diesen Graden
let grad = levels.map(() => null), b, ohneGrad, ordnung, folge, runde = 0;
for (let vorher = null; ; vorher = b) {
  if (++runde > 5) throw new Error('Kein Fixpunkt nach 5 Durchgängen: Die Schwierigkeit hängt vom Grad ab.');
  console.log(`Durchgang ${runde}: beurteile die ${n} Level ${runde === 1 ? 'ohne Grad' : 'mit den Graden'} …`);
  b = await beurteileAlle(levels.map((level, i) => ({ level, opts: { grad: grad[i], teuer: true } })));
  ohneGrad ??= b;
  const text = (x) => JSON.stringify(x.schwierigkeit);
  const gleich = vorher && b.every((x, i) => text(x) === text(vorher[i]));
  ordnung = ordne(b.map(x => x.schwierigkeit.wert));
  folge = [...Array(n).keys()].sort((i, j) => ordnung.platz[i] - ordnung.platz[j]);
  const neu = gradeEntlang(folge, b.map(x => x.schwierigkeit.wert), ordnung.bleibt);
  if (gleich && neu.every((g, i) => g === grad[i])) break;
  grad = neu;
}
const werte = b.map(x => x.schwierigkeit.wert);
const { formel, platz, bleibt } = ordnung;
console.log(`Fixpunkt nach ${runde} Durchgängen: Schwierigkeit und Grade ändern sich mit den Graden nicht mehr`);

// Reihenfolge
console.log(`\nReihenfolge (Verschiebungen bis ${MAX_WANDERN} Plätze übernommen, Plätze ab der heutigen Reihenfolge)`);
const wandert = [...Array(n).keys()].filter(i => !bleibt.has(i));
const um = wandert.map(i => Math.abs(platz[i] - (i + 1)));
console.log(`  ${wandert.length} Level nach der Formel, davon ${um.filter(x => x === 0).length} am heutigen Platz; `
  + `verschoben im Mittel um ${zahl(mittel(um))}, höchstens ${Math.max(...um)} Plätze`);
const pruef = [...bleibt].filter(([, g]) => g === 'Formel').map(([i]) => i).sort((i, j) => i - j);
const nachgezogen = [...bleibt].filter(([, g]) => g === 'Reihenfolge').map(([i]) => i);
const vorn = pruef.filter(i => formel[i] < i + 1).length;
console.log(`  Prüfliste für Ticket 16 (nach der Formel mehr als ${MAX_WANDERN} Plätze): ${pruef.length} Level, `
  + `${vorn} nach vorn, ${pruef.length - vorn} nach hinten`);
for (const i of pruef) {
  console.log(`    ${name(i)}: Formel ${formel[i]} (${formel[i] > i + 1 ? '+' : '−'}${Math.abs(formel[i] - i - 1)}), `
    + `Schwierigkeit ${zahl(werte[i])}`);
}
for (const i of nachgezogen) {
  console.log(`  bleibt ausserdem, weil es zwischen den Leveln der Prüfliste ${MAX_WANDERN} Plätze überschritte: `
    + `${name(i)} (Formel ${formel[i]})`);
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
const gewechselt = [...Array(n).keys()].filter(i => grad[i] !== gradeOf(i + 1).name);
console.log(`  Grad anders als vorläufig nach heutigem Platz: ${gewechselt.length} Level`);
for (const g of GRADE) {
  const hin = gewechselt.filter(i => grad[i] === g);
  if (hin.length) console.log(`    jetzt ${g}: ${hin.map(i => `${name(i)} (war ${gradeOf(i + 1).name})`).join(', ')}`);
}

// Duldungsliste
const gilt = (grund, i) => GRUENDE[grund].gilt(b[i], grad[i]);
const begriffe = (x) => [...new Set(x.ausschluesse.map(a => a.begriff))].join(', ');
const WARUM = { ausschlussgrund: i => begriffe(b[i]), unterMindestSpielwert: i => zahl(b[i].spielwert.wert) };
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
const neuzaehlung = NEUZAEHLUNG.map(p => p - 1);
console.log(`  Vergleich mit den ${neuzaehlung.length} Leveln der Neuzählung:`);
console.log(`    neu: ${zeige(ausschluss.filter(i => !neuzaehlung.includes(i)), WARUM.ausschlussgrund)}`);
console.log(`    fallen weg: ${zeige(neuzaehlung.filter(i => !ausschluss.includes(i)))}`);
console.log('    entfallen mit dem Grad leicht (Füllteil und Zerfall gelten erst ab „mittel“): '
  + `${zeige(neuzaehlung.filter(i => !ausschluss.includes(i) && ohneGrad[i].ausschluesse.length),
    i => begriffe(ohneGrad[i]))}`);
const duldung = nachPlatz([...Array(n).keys()].filter(i => Object.keys(GRUENDE).some(grund => gilt(grund, i))));
console.log(`  Duldungsliste zusammen: ${duldung.length} Level (${GRADE.map(g => `${g} `
  + `${duldung.filter(i => grad[i] === g).length} von ${jeGrad(g, i => grad[i]).length}`).join(', ')})`);
const nurKernidee = duldung.filter(i => !gilt('ausschlussgrund', i));
const beide = nurKernidee.filter(i => gilt('ohneKernidee', i) && gilt('unterMindestSpielwert', i));
const nurOhne = nurKernidee.filter(i => !gilt('unterMindestSpielwert', i));
const nurUnter = nurKernidee.filter(i => !gilt('ohneKernidee', i));
console.log(`    ohne Ausschlussgrund: ${nurKernidee.length}, davon ohne nötige Kernidee und unter dem `
  + `Mindest-Spielwert ${beide.length}; nur ohne Kernidee: ${zeige(nurOhne, WARUM.unterMindestSpielwert)}; `
  + `nur unter dem Mindest-Spielwert: ${zeige(nurUnter, WARUM.unterMindestSpielwert)}`);
const geduldetGeprueft = duldung.filter(i => bleibt.get(i) === 'Formel');
console.log(`    auch auf der Prüfliste: ${geduldetGeprueft.length}, davon mit Ausschlussgrund `
  + `${geduldetGeprueft.filter(i => gilt('ausschlussgrund', i)).length}; Prüfliste ohne Duldungsliste: `
  + `${zeige(pruef.filter(i => !duldung.includes(i)))}`);
console.log('  Grenzfälle der Neuzählung:');
for (const [art, plaetze] of Object.entries(GRENZFAELLE)) {
  console.log(`    ${art}: ${plaetze.map(p => `${name(p - 1)} ${begriffe(b[p - 1]) || 'besteht'}`).join('; ')}`);
}

// Regeln der Levelliste (Nahtstelle 3)
console.log('\nRegeln der Levelliste (Nahtstelle 3), in der neuen Reihenfolge');
const sinkt = folge.filter((i, k) => k && rang(grad[i]) < rang(grad[folge[k - 1]]));
console.log(`  Jedes Level hat einen Grad: ${grad.every(g => GRADE.includes(g)) ? 'ja' : 'nein'}; der Grad sinkt `
  + `${sinkt.length ? `bei ${zeige(sinkt)}` : 'nie'}`);
const imSpiel = (i) => !duldung.includes(i);
const SICHTEN = [['alle', () => true], ['ohne die Duldungsliste', imSpiel], ['ohne die Prüfliste', i => !bleibt.has(i)],
  ['ohne beide', i => imSpiel(i) && !bleibt.has(i)]];
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
const namen = L.LEVELS.map(l => l.name);
console.log(`  Namen eindeutig: ${new Set(namen).size === namen.length ? 'ja' : 'nein'}`);
const mehrdeutig = levels.map((level, i) => [i, level, solve(level, { unique: true })]).filter(([, level, r]) => {
  const norm = (set) => Object.entries(set).map(([z, v]) => {
    const el = level.elements.find(e => `${e.x},${e.z}` === z);
    return `${z}:${v % period(el)}`;
  }).sort().join(' ');
  return r.aborted || r.count !== 1 || norm(r.solutions[0].set) !== norm(level.solution);
});
console.log(`  Genau eine Lösung: ${mehrdeutig.length ? `nicht bei ${zeige(mehrdeutig.map(([i]) => i))}` : 'alle'}`);
console.log('  Verschiebungen durch die KI-Tester: noch keine (die Läufe bisher eichen nur, Tickets 13 und 16)');
console.log('  Anker der KI-Tester (je zwei pro Grad, am unteren und oberen Ende):');
for (const a of loadAnchors().map(x => ({ ...x, i: x.position - 1 }))) {
  console.log(`    ${a.id} ${name(a.i)}: ${a.grad} ${a.ende} → Platz ${platz[a.i]}, ${grad[a.i]}`
    + `${grad[a.i] === a.grad ? '' : ' (anderer Grad)'}${bleibt.has(a.i) ? ', auf der Prüfliste' : ''}`);
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
const listen = {
  duldung: Object.fromEntries(Object.entries(duldungJe).map(([grund, alle]) => [grund, folgeNamen(alle)])),
  pruefliste: folgeNamen(pruef),
};
const bisher = existsSync(DATEI) ? ladeLevelliste() : null;
const listenGleich = bisher && JSON.stringify(bisher.duldung) === JSON.stringify(listen.duldung)
  && JSON.stringify(bisher.pruefliste) === JSON.stringify(listen.pruefliste);
console.log(`\nindex.html: Reihenfolge und Grade ${imSpielGleich ? 'stimmen' : 'weichen ab'}; levelliste.json: `
  + `${!bisher ? 'fehlt' : listenGleich ? 'Duldungsliste und Prüfliste stimmen' : 'weicht ab'}`);
if (schreiben) {
  if (!imSpielGleich) schreibeLevels();
  writeFileSync(DATEI, levellisteText({
    ...listen, urspruenglich: bisher?.urspruenglich ?? listen.duldung, entfernteNamen: bisher?.entfernteNamen ?? [],
  }));
  console.log(`  geschrieben: ${imSpielGleich ? '' : 'index.html und '}levelliste.json`);
}

if (jsonDatei) {
  writeFileSync(jsonDatei, JSON.stringify(folge.map(i => ({
    platz: platz[i], heute: i + 1, name: levels[i].name, schwierigkeit: werte[i], formel: formel[i], grad: grad[i],
    gradNachSchwelle: gradVon(werte[i]), bleibt: bleibt.get(i) ?? null,
    duldung: Object.keys(GRUENDE).filter(grund => gilt(grund, i)), ausschluesse: begriffe(b[i]),
    hauptKernidee: b[i].hauptKernidee.begriff, spielwert: b[i].spielwert.wert,
  })), null, 1) + '\n');
  console.log(`\nErgebnis je Level in ${jsonDatei}`);
}
console.log(`\nLaufzeit ${zahl((Date.now() - start) / 1000)} s`);

/** Namen der Level (Indizes) in der neuen Reihenfolge. */
function folgeNamen(liste) {
  return liste.slice().sort((i, j) => platz[i] - platz[j]).map(i => levels[i].name);
}

/**
 * Ordnet die Level in index.html zwischen den Markierungen LEVELS:BEGIN und LEVELS:END nach der neuen Reihenfolge und
 * setzt je Level das Feld grad hinter den Namen (statt der alten Markierung difficulty). Jedes Level steht dort als
 * Block von „  {“ bis „  },“; der Text eines Blocks bleibt sonst unverändert.
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
function levellisteText({ duldung, urspruenglich, entfernteNamen, pruefliste }) {
  const liste = (namen, einzug) => {
    if (!namen.length) return '[]';
    const zeilen = [];
    let z = '';
    for (const t of namen.map(x => JSON.stringify(x))) {
      if (z && einzug.length + 2 + z.length + 2 + t.length > 118) {
        zeilen.push(z + ',');
        z = t;
      } else z = z ? `${z}, ${t}` : t;
    }
    zeilen.push(z);
    return `[\n${zeilen.map(x => `${einzug}  ${x}`).join('\n')}\n${einzug}]`;
  };
  const gruppe = (g) => `{\n${Object.keys(GRUENDE).map(k => `    "${k}": ${liste(g[k] ?? [], '    ')}`)
    .join(',\n')}\n  }`;
  return '{\n'
    + '  "kommentar": "Duldungsliste nach Grund, ursprüngliche Liste, entfernte Namen, Prüfliste (levelliste.mjs).",\n'
    + `  "duldung": ${gruppe(duldung)},\n`
    + `  "urspruenglich": ${gruppe(urspruenglich)},\n`
    + `  "entfernteNamen": ${liste(entfernteNamen, '  ')},\n`
    + `  "pruefliste": ${liste(pruefliste, '  ')}\n`
    + '}\n';
}
