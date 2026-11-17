// Worker der Bretter (Ticket 05 von .scratch/umbau/, bis dahin ein Blob aus dem Text der Rechnung): rechnet die
// Texturen eines Bretts mit BRETT_DATEN (src/brettdaten.js) ausserhalb des Hauptthreads, für boardTextures
// (src/seite/texturen.js). Bekommt { art, arg }, schickt { name: Uint8ClampedArray } zurück (die Puffer übertragen,
// nicht kopiert); die Seite beendet ihn danach. Die Seite startet ihn als Modul-Worker (new Worker(new URL(…)): im
// Dev-Server diese Datei, im Build macht Vite daraus eine Datei unter assets/). Lädt er nicht, rechnet die Seite im
// Hauptthread.
import { BRETT_DATEN } from './brettdaten.js';

type Auftrag = { art: keyof typeof BRETT_DATEN; arg: unknown };

onmessage = ({ data: { art, arg } }: MessageEvent<Auftrag>) => {
  const d: Record<string, Uint8ClampedArray> = (BRETT_DATEN[art] as (a: unknown) => Record<string, Uint8ClampedArray>)(arg);
  postMessage(d, Object.values(d).map((a) => a.buffer));
};
