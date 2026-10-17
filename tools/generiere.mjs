// Kommandozeile des Generators (tools/generator/, Ticket 18): Level zu einem Auftrag aus Grad und Kernidee, für die
// Seeds der Reihe nach, im flachen Feld 7 × 7. Jedes gelieferte Level geht als JSON-Zeile { seed, level, schwierigkeit,
// spielwert, kernideen, hauptKernidee } auf stdout (level wie in LEVELS, ohne Namen), eine Zusammenfassung mit den
// Gründen der Seeds ohne Level auf stderr. Ein Prozess; derselbe Aufruf liefert dieselben Level. Nur über die
// gedeckelte Umgebung (Spec „Generator“, höchstens 50 % CPU):
//   LEISE_CPU=50 sh tools/leise.sh node tools/generiere.mjs <auftrag> [--anzahl N] [--seed S] [--seeds M]
//   auftrag     wie „leicht“ oder „leicht-mischziel“; ohne Angabe nennt es die Aufträge, die der Generator kennt
//   --anzahl N  so viele Level liefern (Standard 10)
//   --seed S    erster Seed (Standard 1)
//   --seeds M   höchstens so viele Seeds versuchen (Standard 1000)
// Weiter geht es etwa mit node tools/show.mjs (Textfeld) oder der Beurteilung.
import { generiere, angebot } from './generator/index.mjs';
import { feldformVon } from './beurteilung/feldform.mjs';

const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf(name); return i < 0 ? def : Number(args.splice(i, 2)[1]); };
const anzahl = flag('--anzahl', 10), start = flag('--seed', 1), seeds = flag('--seeds', 1000);
const auftraege = angebot();
const auftrag = auftraege.find(a => a.name === args[0]);
if (!auftrag || args.length !== 1 || ![anzahl, start, seeds].every(Number.isInteger)) {
  console.error('Aufruf: LEISE_CPU=50 sh tools/leise.sh node tools/generiere.mjs <auftrag> [--anzahl N] [--seed S] '
    + `[--seeds M]\nAufträge: ${auftraege.map(a => a.name).join(', ')}`);
  process.exit(1);
}
process.stdout.on('error', () => process.exit(0)); // etwa „| head“ schliesst die Pipe
const feldform = feldformVon({}), gruende = new Map();
let geliefert = 0, versucht = 0;
for (let seed = start; geliefert < anzahl && versucht < seeds; seed++, versucht++) {
  const { grad, kernidee } = auftrag;
  const { level, beurteilung: b, grund } = generiere({ grad, kernidee, seed, feldform });
  if (!level) { gruende.set(grund, (gruende.get(grund) || 0) + 1); continue; }
  geliefert++;
  console.log(JSON.stringify({
    seed, level, schwierigkeit: +b.schwierigkeit.wert.toFixed(1), spielwert: +b.spielwert.wert.toFixed(1),
    kernideen: [...new Set(b.kernideen.map(k => k.begriff))], hauptKernidee: b.hauptKernidee.begriff,
  }));
}
const ohne = [...gruende].sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g} ${n}`).join(', ');
console.error(`${auftrag.name}: ${geliefert} Level aus ${versucht} Seeds${ohne ? ` · ohne Level: ${ohne}` : ''}`);
