// Die heutige Reihenfolge der 150 Level vor Ticket 15 als feste Namensliste (heutige-reihenfolge.json). Sie ist der
// Massstab der Eichung (ADR 0001): Die Schwierigkeit wird an ihren Plätzen geeicht und gekreuzt geprüft, die Eichmenge
// des Spielwerts nennt diese Plätze, und Ablauf 1 der KI-Tester rechnet mit ihnen. Seit Ticket 15 stehen die Level im
// Spiel in der Reihenfolge der Formel (tools/ordne-level.mjs); ohne diese Liste eichte die Schwierigkeit an ihrer
// eigenen Reihenfolge. Die Liste wird nie geändert. Ein Level, das erst später ins Spiel kommt, hat keinen heutigen
// Platz.
import { readFileSync } from 'node:fs';
import { L } from '../solver.mjs';

const DATEI = new URL('./heutige-reihenfolge.json', import.meta.url);
/** Die Namen in der heutigen Reihenfolge, Platz 1 zuerst. */
export const HEUTIGE_REIHENFOLGE = JSON.parse(readFileSync(DATEI, 'utf8')).namen;

/** Der heutige Platz (1–150) eines Levels nach seinem Namen, null für ein Level, das es damals nicht gab. */
export const heutigerPlatz = (name) => {
  const i = HEUTIGE_REIHENFOLGE.indexOf(name);
  return i < 0 ? null : i + 1;
};

/** Die Level des Spiels (LEVELS) in der heutigen Reihenfolge; wirft, wenn eines davon fehlt. */
export function inHeutigerReihenfolge() {
  return HEUTIGE_REIHENFOLGE.map((name) => {
    const level = L.LEVELS.find(l => l.name === name && !l.tutorial);
    if (!level) throw new Error(`Heutige Reihenfolge: kein Level „${name}“ im Spiel`);
    return level;
  });
}
