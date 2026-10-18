// Die heutige Reihenfolge der 150 Level vor Ticket 15 als feste Namensliste (heutige-reihenfolge.json). Sie ist der
// Massstab der Eichung (ADR 0001): Die Schwierigkeit wird an ihren Plätzen geeicht und gekreuzt geprüft, die Eichmenge
// des Spielwerts nennt diese Plätze, und Ablauf 1 der KI-Tester rechnet mit ihnen. Seit Ticket 15 stehen die Level im
// Spiel in der Reihenfolge der Formel (tools/ordne-level.mjs); ohne diese Liste eichte die Schwierigkeit an ihrer
// eigenen Reihenfolge. Die Liste wird nie geändert. Ein Level, das erst später ins Spiel kommt, hat keinen heutigen
// Platz.
// Entfernte Level (Austausch, Tickets 23–26) bleiben Teil des Massstabs: Ihre Leveldaten stehen, wie sie zuletzt im
// Spiel waren, als feste Kopie in entfernte-level.json (geschrieben von tools/ordne-level.mjs beim Austausch). So
// bleiben Eichung, Eichmenge und die Tests der Beurteilung an den 150 heutigen Leveln gleich.
import { existsSync, readFileSync } from 'node:fs';
import { L } from '../solver.mjs';

const DATEI = new URL('./heutige-reihenfolge.json', import.meta.url);
/** Die feste Kopie der entfernten Level (Tickets 23–26), { kommentar, level: [Leveldaten wie in LEVELS] }. */
export const ENTFERNTE = new URL('./entfernte-level.json', import.meta.url);
/** Die Namen in der heutigen Reihenfolge, Platz 1 zuerst. */
export const HEUTIGE_REIHENFOLGE = JSON.parse(readFileSync(DATEI, 'utf8')).namen;

/** Der heutige Platz (1–150) eines Levels nach seinem Namen, null für ein Level, das es damals nicht gab. */
export const heutigerPlatz = (name) => {
  const i = HEUTIGE_REIHENFOLGE.indexOf(name);
  return i < 0 ? null : i + 1;
};

/** Die Leveldaten der entfernten Level aus der festen Kopie, leer vor dem ersten Austausch. */
export const entfernteLevel = () => (existsSync(ENTFERNTE) ? JSON.parse(readFileSync(ENTFERNTE, 'utf8')).level : []);

/**
 * Die 150 Level der heutigen Reihenfolge: aus dem Spiel (LEVELS), ein entferntes aus der festen Kopie; wirft, wenn
 * eines an beiden Orten fehlt oder an beiden steht.
 */
export function inHeutigerReihenfolge() {
  const kopie = entfernteLevel();
  return HEUTIGE_REIHENFOLGE.map((name) => {
    const level = L.LEVELS.find(l => l.name === name && !l.tutorial), entfernt = kopie.find(l => l.name === name);
    if (level && entfernt) throw new Error(`Heutige Reihenfolge: „${name}“ steht im Spiel und unter den entfernten`);
    if (!level && !entfernt) throw new Error(`Heutige Reihenfolge: kein Level „${name}“ im Spiel`);
    return level ?? entfernt;
  });
}
