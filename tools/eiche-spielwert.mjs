// Messskript: Eichung des Spielwerts (Ticket 13) an der Eichmenge (spielwert-eichmenge.mjs). Es beurteilt die 150
// heutigen Level und die Review-Kandidaten und berichtet:
// - die Eichmenge je Quelle und Grad und die Brücken (Level mit Urteil der KI-Tester und aus einem Review);
// - die Rangkorrelation des Spielwerts mit dem Spass für fünf Modelle, je auf der Eichmenge selbst und in der
//   Kreuzprüfung (5 und 10 Falten, eines weglassen, Hälfte: an jedem zweiten Level eingestellt, an den übrigen
//   geprüft): die Gewichte der Spec mit einer zählenden Kernidee, mit geeichtem KERNIDEE.weitere, mit geeichtem erste
//   und weitere (erste ab 0,6 und ganz frei) und frei eingestellte Gewichte. Die Falten folgen der Reihenfolge der
//   Eichmenge (Platz, dann Kandidaten);
// - mit den Werten aus spielwert.mjs: die Rangkorrelation je Quelle, Grad und Teilwert, das Gefühl unter und über
//   möglichen Mindest-Spielwerten, die Level der 150 unter dem MINDEST_SPIELWERT und den Zusammenhang mit Grad und
//   Grösse, auch ohne die Grösse (Teilkorrelation der Ränge).
// Geeicht wird an den Leveln ohne Ausschlussgrund, zum Vergleich auch an allen.
// Aufruf: sh tools/leise.sh node tools/eiche-spielwert.mjs   (etwa 35 s, die Beurteilung auf vier Threads)
import { GRADE } from './beurteilung/index.mjs';
import { beurteileAlle } from './beurteilung/parallel.mjs';
import { feldformVon } from './beurteilung/feldform.mjs';
import { inHeutigerReihenfolge } from './beurteilung/heutige-reihenfolge.mjs';
import { eichmenge, rangkorrelation as rho } from './beurteilung/spielwert-eichmenge.mjs';
import { GEWICHTE, KERNIDEE, MINDEST_SPIELWERT, kernideeTeil } from './beurteilung/spielwert.mjs';

const zahl = (x, n = 2) => x.toFixed(n).replace('.', ',');
const mittel = (a) => a.reduce((s, x) => s + x, 0) / a.length;

function merkmale(level, b) {
  const { begriff, weitere } = b.hauptKernidee, f = feldformVon(level);
  return { teilwerte: b.spielwert.teilwerte, wert: b.spielwert.wert, n: begriff ? 1 + weitere.length : 0,
    ausschluss: b.ausschluesse.length > 0, drehbar: level.elements.filter(e => f.stellungen(e).length).length };
}
// Beurteilt auf mehreren Threads (beurteilung/parallel.mjs), die Kandidaten als die teuersten zuerst
// Die 150 in der heutigen Reihenfolge (Plätze wie in der Eichmenge), je mit dem Grad aus den Leveldaten
const levels = inHeutigerReihenfolge(), eichung = eichmenge(), kandidaten = eichung.filter(e => !e.platz);
const beurteilt = await beurteileAlle([
  ...kandidaten.map(e => ({ level: e.level, opts: { grad: null } })),
  ...levels.map(level => ({ level, opts: { grad: level.grad } })),
]);
const heute = levels.map((level, i) => {
  return { platz: i + 1, name: level.name, grad: level.grad, ...merkmale(level, beurteilt[kandidaten.length + i]) };
});
let k = 0;
const menge = eichung.map(e => ({ ...e, ...(e.platz ? heute[e.platz - 1] : merkmale(e.level, beurteilt[k++])) }));
const ohne = menge.filter(x => !x.ausschluss);

/** Spielwert mit anderen Werten p = { s, k, f, z, erste, weitere }. */
const wert = (x, p) => p.s * x.teilwerte.schliessen + p.k * kernideeTeil(x.n, p) + p.f * x.teilwerte.farblogik + p.z * x.teilwerte.zusammenspiel;
const JETZT = { s: GEWICHTE.schliessen, k: GEWICHTE.kernidee, f: GEWICHTE.farblogik, z: GEWICHTE.zusammenspiel, ...KERNIDEE };
for (const x of menge) if (Math.abs(wert(x, JETZT) - x.wert) > 1e-9) throw new Error(`${x.name}: Spielwert nicht nachgerechnet`);
const guete = (set, p) => rho(set.map(x => wert(x, p)), set.map(x => x.spass));

console.log('Eichmenge');
const quellen = (set) => `KI-Tester ${set.filter(x => x.urteile.kiTester !== null).length}, Review ${set.filter(x => x.urteile.review !== null).length}`;
for (const g of [...GRADE, null]) {
  const s = menge.filter(x => x.grad === g);
  console.log(`  ${(g ?? 'Kandidaten').padEnd(11)} ${String(s.length).padStart(3)} Level (${quellen(s)}), ohne Ausschluss ${s.filter(x => !x.ausschluss).length}`);
}
console.log(`  zusammen    ${menge.length} Level, ohne Ausschluss ${ohne.length}`);
const bruecken = menge.filter(x => x.urteile.kiTester !== null && x.urteile.review !== null);
console.log('Brücken (KI-Tester gegen Review)');
for (const x of bruecken) console.log(`  ${String(x.platz).padStart(3)} ${x.name.padEnd(16)} ${zahl(x.urteile.kiTester, 1)} gegen ${zahl(x.urteile.review, 1)} (${x.review})${x.ausschluss ? ', Ausschlussgrund' : ''}`);
const d = bruecken.map(x => x.urteile.kiTester - x.urteile.review).sort((a, b) => a - b);
console.log(`  Differenz: Median ${zahl(d[Math.floor(d.length / 2)] / 2 + d[Math.ceil(d.length / 2) - 1] / 2)}, Mittel ${zahl(mittel(d))}, `
  + `Rangkorrelation ${zahl(rho(bruecken.map(x => x.urteile.kiTester), bruecken.map(x => x.urteile.review)))}`);

// Modelle: die Werte, unter denen gesucht wird
const SPEC = [{ ...JETZT, erste: 1, weitere: 0 }];
const GEEICHT = [...Array(11).keys()].map(i => ({ ...JETZT, erste: KERNIDEE.erste, weitere: i / 10 }));
const ERSTE = [...Array(11).keys()].flatMap(e => [...Array(11).keys()].map(i => ({ ...JETZT, erste: e / 10, weitere: i / 10 })));
const FREI = [];
for (let s = 0; s <= 67; s += 5) for (let f = 0; f <= 33; f += 3) for (const erste of [0.6, 0.8, 1]) for (const weitere of [0, 0.3, 0.6, 1]) {
  FREI.push({ s, k: 67 - s, f, z: 33 - f, erste, weitere });
}
const einstellen = (set, kandidaten) => kandidaten.reduce((b, p) => { const r = guete(set, p); return !b || r > b.r ? { r, p } : b; }, null);
const kreuz = (set, kandidaten, K) => {
  const vorhersage = new Array(set.length);
  for (let k = 0; k < K; k++) {
    const { p } = einstellen(set.filter((_, i) => i % K !== k), kandidaten);
    set.forEach((x, i) => { if (i % K === k) vorhersage[i] = wert(x, p); });
  }
  return rho(vorhersage, set.map(x => x.spass));
};
const halbe = (set, kandidaten) => guete(set.filter((_, i) => i % 2 === 1), einstellen(set.filter((_, i) => i % 2 === 0), kandidaten).p);
const werte = (p) => `S ${p.s} K ${p.k} F ${p.f} Z ${p.z}, erste ${p.erste}, weitere ${p.weitere}`;
for (const [name, set] of [['ohne Ausschluss', ohne], ['alle', menge]]) {
  console.log(`Modelle, ${name} (${set.length} Level): eingestellt / Kreuzprüfung 5, 10, eines weg / Hälfte geprüft`);
  for (const [m, kandidaten] of [['Spec, eine Kernidee', SPEC], ['Spec, weitere geeicht', GEEICHT],
    ['Spec, erste ab 0,6 geeicht', ERSTE.filter(p => p.erste >= 0.6)], ['Spec, erste geeicht', ERSTE], ['frei', FREI]]) {
    const b = einstellen(set, kandidaten);
    console.log(`  ${m.padEnd(26)} ${zahl(b.r)} / ${zahl(kreuz(set, kandidaten, 5))}, ${zahl(kreuz(set, kandidaten, 10))}, `
      + `${zahl(kreuz(set, kandidaten, set.length))} / ${zahl(halbe(set, kandidaten))}   (${werte(b.p)})`);
  }
}

console.log(`Spielwert wie in spielwert.mjs (${werte(JETZT)})`);
for (const [name, set] of [['ohne Ausschluss', ohne], ['alle', menge]]) {
  const teil = (f) => { const s = set.filter(f); return s.length > 3 ? `${zahl(guete(s, JETZT))} (${s.length})` : '–'; };
  console.log(`  ${name.padEnd(16)} gesamt ${zahl(guete(set, JETZT))}; KI-Tester ${teil(x => x.urteile.kiTester !== null)}, `
    + `Review ${teil(x => x.urteile.review !== null)}; ${GRADE.map(g => `${g} ${teil(x => x.grad === g)}`).join(', ')}, Kandidaten ${teil(x => !x.platz)}`);
  const jeTeilwert = (t) => rho(set.map(x => (t === 'kernidee' ? x.n : x.teilwerte[t])), set.map(x => x.spass));
  console.log(`    je Teilwert: ${Object.keys(GEWICHTE).map(t => `${t} ${zahl(jeTeilwert(t))}`).join(', ')} (Kernidee: Zahl der nötigen Kernideen)`);
}
console.log('Gefühl unter und über einem Mindest-Spielwert (Mittel, Zahl der Level)');
for (const [name, set] of [['ohne Ausschluss', ohne], ['alle', menge]]) {
  console.log(`  ${name}`);
  for (let t = 40; t <= 70; t += 5) {
    const unter = set.filter(x => x.wert < t), ueber = set.filter(x => x.wert >= t);
    console.log(`    ${t}: unter ${unter.length ? zahl(mittel(unter.map(x => x.spass))) : '–'} (${unter.length}), über ${zahl(mittel(ueber.map(x => x.spass)))} `
      + `(${ueber.length}), Abstand ${unter.length ? zahl(mittel(ueber.map(x => x.spass)) - mittel(unter.map(x => x.spass))) : '–'}`);
  }
}
console.log(`Die 150 unter dem Mindest-Spielwert ${MINDEST_SPIELWERT}`);
for (const g of GRADE) {
  const unter = heute.filter(x => x.grad === g && x.wert < MINDEST_SPIELWERT);
  console.log(`  ${g} ${unter.length} von ${heute.filter(x => x.grad === g).length}: ${unter.map(x => `${x.platz} ${x.name} (${zahl(x.wert, 1)}${x.n ? '' : ', ohne Kernidee'})`).join(', ')}`);
}
const abMittel = heute.filter(x => x.grad !== 'leicht');
console.log(`  ab „mittel“ ohne nötige Kernidee ${abMittel.filter(x => !x.n).length}, davon darunter ${abMittel.filter(x => !x.n && x.wert < MINDEST_SPIELWERT).length}; `
  + `mit Kernidee darunter ${abMittel.filter(x => x.n && x.wert < MINDEST_SPIELWERT).length}`);
console.log('Zusammenhang mit Grad und Grösse (Rangkorrelation)');
console.log(`  150: Spielwert und Grad ${zahl(rho(heute.map(x => x.wert), heute.map(x => GRADE.indexOf(x.grad))))}, Spielwert und drehbare Elemente `
  + `${zahl(rho(heute.map(x => x.wert), heute.map(x => x.drehbar)))}`);
console.log(`  Eichmenge ohne Ausschluss: Spass und drehbare Elemente ${zahl(rho(ohne.map(x => x.spass), ohne.map(x => x.drehbar)))}, Spielwert und `
  + `drehbare Elemente ${zahl(rho(ohne.map(x => x.wert), ohne.map(x => x.drehbar)))}`);
/** Rangkorrelation von Spielwert und Spass, wenn man die Zahl der drehbaren Elemente herausrechnet. */
const ohneGroesse = (set) => {
  const ws = rho(set.map(x => x.wert), set.map(x => x.spass)), wd = rho(set.map(x => x.wert), set.map(x => x.drehbar));
  const sd = rho(set.map(x => x.spass), set.map(x => x.drehbar));
  return (ws - wd * sd) / Math.sqrt((1 - wd ** 2) * (1 - sd ** 2));
};
console.log(`  Spielwert und Spass ohne die Grösse (Teilkorrelation): ohne Ausschluss ${zahl(ohneGroesse(ohne))}, alle ${zahl(ohneGroesse(menge))}`);
