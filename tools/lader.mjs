// Gemeinsamer Lader der Level (Spec .scratch/noa-geschichte/, «Daten»; Ticket 02): Spiel und Vorrat zusammen. Die Level
// im Spiel stehen in index.html (LEVELS und LEVELS_3D, über tools/solver.mjs), die übrigen im Vorrat (tools/vorrat/,
// Werkzeug tools/vorrat.mjs). Wer alle Level braucht, liest ALLE: Strahlregel, Golden-Test, Beurteilung und ihre
// Eichung, Ähnlichkeit, KI-Tester mit ihrem Protokoll, Levelliste und Würfelliste. So geht kein Level und kein Urteil
// verloren, wenn ein Level im Vorrat statt im Spiel liegt. Wer nur das Spiel braucht (Anzeige, Fortschritt, Tutorial,
// Proben im Browser), liest L aus tools/solver.mjs.
// - ALLE: { LEVELS, TUTORIAL_COUNT, LEVELS_3D } wie im Spiel, als stünden alle Level des Vorrats wieder darin, jedes an
//   seinem Platz: dieselbe Folge wie nach „tools/vorrat.mjs zurueckholen --alle“. Solange das Spiel seine Level in
//   ihrer Folge lässt, ist das die Reihenfolge von vor dem Ablegen (die Reihe der flachen Level und die der
//   Würfel), und die Regeln der Levelliste und der Würfelliste gelten weiter. Die Level im Spiel sind dieselben
//   Objekte wie in L.
// - VORRAT: { flach, wuerfel }, die Level des Vorrats in seiner Reihenfolge; ort(name): 'spiel', 'vorrat' oder null.
// - alleText(): index.html mit allen Leveln des Vorrats an ihrem Platz, als Text (für Prüfungen am Kommentar eines
//   Levels und für Seiten mit allen Leveln, etwa die Bilder der KI-Tester).
// Ein Name steht in Spiel und Vorrat zusammen höchstens einmal, sonst bricht der Lader ab.
import { L } from './solver.mjs';
import { einfuegen, inhalt, lese, leveldaten, mitAllen, namenImSpiel } from './vorrat.mjs';

const texte = lese();

/** Die Level des Vorrats je Art, in seiner Reihenfolge (Leveldaten wie in LEVELS bzw. LEVELS_3D). */
export const VORRAT = { flach: leveldaten(texte.flach, 'flach'), wuerfel: leveldaten(texte.wuerfel, 'wuerfel') };

/**
 * Die Level einer Art aus Spiel und Vorrat in der Folge nach dem Zurückholen aller (einfuegen in vorrat.mjs): spiel die
 * Level im Spiel (LEVELS bzw. LEVELS_3D), davor die ausserhalb der Markierungen (das Tutorial).
 */
function zusammen(art, spiel) {
  const imSpiel = namenImSpiel(texte.spiel, art), vor = spiel.length - imSpiel.length;
  if (vor < 0 || spiel.slice(vor).some((l, k) => l.name !== imSpiel[k])) {
    throw new Error(`index.html: ${art === 'flach' ? 'LEVELS' : 'LEVELS_3D'} passt nicht zu den Leveln zwischen den `
      + 'Markierungen');
  }
  const eintraege = inhalt(texte[art], art);
  const objekt = new Map([...spiel.map(l => [l.name, l]), ...VORRAT[art].map(l => [l.name, l])]);
  const doppelt = VORRAT[art].filter(l => spiel.some(x => x.name === l.name)).map(l => l.name);
  if (doppelt.length) throw new Error(`Im Spiel und im Vorrat: ${doppelt.join(', ')}`);
  return [...spiel.slice(0, vor), ...einfuegen(imSpiel, eintraege, eintraege).map(name => objekt.get(name))];
}

/** Alle Level aus Spiel und Vorrat, wie im Spiel geordnet (siehe Kopf). */
export const ALLE = Object.freeze({
  LEVELS: zusammen('flach', L.LEVELS), TUTORIAL_COUNT: L.TUTORIAL_COUNT, LEVELS_3D: zusammen('wuerfel', L.LEVELS_3D),
});
{
  const namen = [...ALLE.LEVELS, ...ALLE.LEVELS_3D].map(l => l.name);
  const doppelt = namen.filter((x, k) => namen.indexOf(x) !== k);
  if (doppelt.length) throw new Error(`Name in Spiel und Vorrat mehrfach: ${[...new Set(doppelt)].join(', ')}`);
}

const imVorrat = new Set([...VORRAT.flach, ...VORRAT.wuerfel].map(l => l.name));
const imSpiel = new Set([...L.LEVELS, ...L.LEVELS_3D].map(l => l.name));
/** Wo ein Level steht: 'spiel', 'vorrat' oder null (weder noch). */
export const ort = (name) => (imSpiel.has(name) ? 'spiel' : imVorrat.has(name) ? 'vorrat' : null);

let text = null;
/** index.html mit allen Leveln des Vorrats an ihrem Platz (siehe Kopf), einmal je Lauf gerechnet. */
export const alleText = () => (text ??= mitAllen(texte));
