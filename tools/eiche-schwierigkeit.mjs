// Eicht die Gewichte der Schwierigkeit (Ticket 12, ADR 0001) an der heutigen Reihenfolge der 150 Level und schreibt sie
// nach tools/beurteilung/schwierigkeit-gewichte.json. Nur die Plätze der Level an den geraden Plätzen stellen die
// Gewichte ein; tests/beurteilung/schwierigkeit.test.mjs prüft gekreuzt, jede Hälfte mit den Gewichten der anderen.
// Jedes Level zählt gleich.
// - Messwerte: aus der Beurteilung, schwierigkeit.teilwerte (sie hängen nicht von den Gewichten ab), auf mehreren
//   Threads (beurteilung/parallel.mjs, BEURTEILUNG_THREADS).
// - Verfahren und Prüfung: tools/beurteilung/schwierigkeit-eichung.mjs (nichtnegative kleinste Quadrate des heutigen
//   Platzes, Anteile von Weglänge und Denkarbeit begrenzt). Die Grösse bekommt hier kein Gewicht: Sie ist fest begrenzt
//   (GROESSE in schwierigkeit.mjs).
// Aufruf: sh tools/leise.sh node tools/eiche-schwierigkeit.mjs [--bericht]
//   Immer: die Gewichte, die Anteile der Teilwerte und die Rangkorrelation, bisher (ungerade Plätze) und gekreuzt über
//   beide Hälften.
//   --bericht: dazu weitere Rangkorrelationen, die grössten Abweichungen, zum Vergleich die alte Wertung (score aus
//              metrics in solver.mjs, rund 25 s mehr) und die Rangkorrelation mit dem Spielwert.
import { writeFileSync } from 'node:fs';
import { L, metrics } from './solver.mjs';
import { beurteileAlle } from './beurteilung/parallel.mjs';
import { bewerte } from './beurteilung/schwierigkeit.mjs';
import {
  NAMEN, anteile, eiche, gekreuzt, jeBereich, raenge, rangkorrelation, gerade, ungerade,
} from './beurteilung/schwierigkeit-eichung.mjs';
import { gradeOf } from './ki-tester/protocol.mjs';

const DATEI = new URL('./beurteilung/schwierigkeit-gewichte.json', import.meta.url);
const bericht = process.argv.includes('--bericht');
const zahl = (x, n = 2) => x.toFixed(n).replace('.', ',');
const bereiche = ({ gesamt, bereiche: b }) => `${zahl(gesamt)} | je Bereich ${b.map(r => zahl(r.rho)).join(' ')}`;
/** Rangkorrelation mit dem Platz, gesamt und je 30er-Bereich, für die Level mit auswahl(platz). */
function korrelation(werte, auswahl) {
  const plaetze = werte.map((_, i) => i + 1).filter(auswahl);
  return bereiche(jeBereich(plaetze.map(p => werte[p - 1]), plaetze));
}

console.log('Beurteile die 150 Level …');
const levels = L.LEVELS.slice(L.TUTORIAL_COUNT);
const auftraege = levels.map((level, i) => ({ level, opts: { grad: gradeOf(i + 1).name, teuer: true } }));
const alle = (await beurteileAlle(auftraege)).map((b, i) => (
  { platz: i + 1, name: levels[i].name, teilwerte: b.schwierigkeit.teilwerte, spielwert: b.spielwert.wert }));
const gewichte = eiche(alle, gerade);
writeFileSync(DATEI, JSON.stringify({
  kommentar: 'Gewichte der Schwierigkeit, eingestellt von tools/eiche-schwierigkeit.mjs; nicht von Hand ändern.',
  geeicht: {
    plaetze: 'gerade', level: alle.filter(a => gerade(a.platz)).length,
    verfahren: 'nichtnegative kleinste Quadrate des heutigen Platzes, Anteile von Weglänge und Denkarbeit begrenzt',
  },
  gewichte,
}, null, 2) + '\n');
console.log('Gewichte:', NAMEN.map(n => `${n} ${zahl(gewichte[n], 3)}`).join(', '));

const bewertet = alle.map(a => bewerte(a.teilwerte, gewichte)), werte = bewertet.map(b => b.wert);
const prozent = (x) => `${zahl(100 * x, 1)} %`;
const punkte = (lies) => zahl(bewertet.reduce((s, b) => s + lies(b.teilwerte).wert, 0) / bewertet.length, 1);
console.log('Anteile am Wert (im Mittel, wenigstens bis höchstens je Level):');
for (const [teil, a] of Object.entries(anteile(alle, gewichte))) {
  const wo = alle[a.je.indexOf(a.hoechstens)].platz;
  console.log(`  ${teil}: ${prozent(a.mittel)} (${prozent(a.wenigstens)} bis ${prozent(a.hoechstens)}, `
    + `höchstens bei ${wo}), im Mittel ${punkte(t => t[teil])} Punkte`);
}
const denkarbeit = ['spielermodell', 'farblogik', 'kernideen'].map(t => `${t} ${punkte(w => w.denkarbeit[t])}`);
console.log(`  Wert ${zahl(Math.min(...werte), 1)} bis ${zahl(Math.max(...werte), 1)}; `
  + `in der Denkarbeit im Mittel: ${denkarbeit.join(', ')}`);
console.log('Rangkorrelation mit der heutigen Reihenfolge');
console.log('  ungerade Plätze (Prüfung):  ', korrelation(werte, ungerade));
const kreuz = gekreuzt(alle);
console.log('  gekreuzt über beide Hälften:', bereiche(kreuz));
if (bericht) {
  console.log('  gerade Plätze (geeicht):    ', korrelation(werte, gerade));
  console.log('  alle 150:                   ', korrelation(werte, () => true));
  console.log('  an den ungeraden geeicht:', NAMEN.map(n => `${n} ${zahl(kreuz.gewichte.ungerade[n], 3)}`).join(', '));
  const neu = raenge(werte);
  const abweichung = alle.map((a, i) => ({ ...a, neu: neu[i], wert: werte[i], um: Math.abs(neu[i] - a.platz) }))
    .sort((a, b) => b.um - a.um);
  console.log(`Grösste Abweichungen (alter Platz → neuer Platz unter den 150, Wert); über 10 Plätze: `
    + `${abweichung.filter(a => a.um > 10).length} Level`);
  for (const a of abweichung.slice(0, 12)) {
    const haelfte = a.platz % 2 ? 'ungerade' : 'gerade';
    console.log(`  ${a.platz} ${a.name} → ${zahl(a.neu, a.neu % 1 ? 1 : 0)} (${haelfte}), ${zahl(a.wert, 1)}`);
  }
  console.log('Alte Wertung (score aus metrics) …');
  const alt = levels.map(level => metrics(level).score);
  console.log('  ungerade Plätze:', korrelation(alt, ungerade));
  console.log('  alle 150 (ungeeicht, also auch gekreuzt):', korrelation(alt, () => true));
  // Spielwert und Schwierigkeit sollen getrennt messen (Spec): Wie stark hängen sie zusammen?
  const jeGrad = [...new Set(alle.map(a => gradeOf(a.platz).name))].map((grad) => {
    const i = alle.map((_, j) => j).filter(j => gradeOf(alle[j].platz).name === grad);
    return `${grad} ${zahl(rangkorrelation(i.map(j => alle[j].spielwert), i.map(j => werte[j])))}`;
  });
  const gesamt = rangkorrelation(alle.map(a => a.spielwert), werte);
  console.log(`Rangkorrelation Spielwert und Schwierigkeit: alle 150 ${zahl(gesamt)}; `
    + `je Grad nach heutigem Platz: ${jeGrad.join(', ')}`);
}
