// Impulsantwort des Halls (Ticket 03 von .scratch/umbau/, bis dahin der Bereich HALL in index.html): reine
// Berechnung. Die Seite setzt das Modul an seiner Stelle ein (Marke «MODUL src/hall.js», tools/seitenmodule.mjs; den
// import ersetzt dort mulberry32 aus src/zufall.js weiter oben); der Worker des Halls (src/hall-worker.ts) und
// tests/hall.test.mjs importieren es.
import { mulberry32 } from './zufall.js';

const HALL_SECONDS = 3.2; // Länge des Nachhalls

/**
 * Impulsantwort des Halls: Rauschen mit exponentiellem Abklingen, links/rechts verschieden (fester Samen, also bei
 * jedem Laden dieselbe Kurve). Unabhängig vom AudioContext, es zählt nur die Abtastrate. Als Generator in Stücken:
 * Nach je step Abtastwerten gibt er die Kontrolle ab, am Ende liefert er [links, rechts] als Float32Array. Bitgleich
 * mit der früheren Berechnung direkt im AudioBuffer (Float32 wie getChannelData).
 */
function* hallImpulse(rate, seconds = HALL_SECONDS, step = 8192) {
  const len = Math.floor(rate * seconds), rand = mulberry32(5);
  const data = [new Float32Array(len), new Float32Array(len)];
  for (const d of data) {
    for (let i0 = 0; i0 < len; i0 += step) {
      for (let i = i0, end = Math.min(len, i0 + step); i < end; i++) d[i] = (rand() * 2 - 1) * Math.pow(1 - i / len, 3.2);
      yield;
    }
  }
  return data;
}

export {
  HALL_SECONDS, hallImpulse,
};
