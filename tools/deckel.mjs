// Deckel für schwere Läufe (Spec „Generator“, Rechnerlast): Generator, Messskript und Screenshots der KI-Tester laufen
// nur über tools/leise.sh, mit tiefster Priorität und höchstens STANDARD_MAX_CPU Prozent der Maschine. Ein Rechner darf
// die Obergrenze lokal mit der Umgebungsvariablen LEISE_MAX_CPU anheben, ohne dass das versioniert wird, etwa in
// .claude/settings.local.json unter env (gitignored). leise.sh liest dieselbe Variable.
import os from 'node:os';

/** Obergrenze in Prozent, wenn LEISE_MAX_CPU fehlt (Spec: höchstens 50 %). */
export const STANDARD_MAX_CPU = 50;

/** Die Obergrenze dieses Rechners: LEISE_MAX_CPU, sonst STANDARD_MAX_CPU. Keine Zahl ergibt NaN, also keinen Lauf. */
export const maxCpu = () => Number(process.env.LEISE_MAX_CPU || STANDARD_MAX_CPU);

/**
 * Läuft der Prozess gedeckelt? Tiefste Priorität, wie leise.sh sie setzt, und LEISE_CPU (Standard 20, wie leise.sh)
 * höchstens grenze (Standard: maxCpu()). Als !(cpu <= grenze) geprüft: Ein NaN auf einer Seite bricht von selbst ab.
 */
export function gedeckelt(grenze = maxCpu()) {
  const cpu = Number(process.env.LEISE_CPU || 20);
  return os.getPriority() === os.constants.priority.PRIORITY_LOW && !!(cpu <= grenze);
}

/** Text für Fehlermeldungen: die Werte der beiden Variablen. */
export const deckelText = () => `LEISE_CPU ${process.env.LEISE_CPU ?? 'nicht gesetzt'}, LEISE_MAX_CPU `
  + `${process.env.LEISE_MAX_CPU ?? `nicht gesetzt (Standard ${STANDARD_MAX_CPU})`}`;
