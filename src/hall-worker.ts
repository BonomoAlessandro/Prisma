// Worker des Halls (Ticket 03 von .scratch/umbau/): rechnet die Impulsantwort (src/hall.js) ausserhalb des
// Hauptthreads, für hallData (Ton der Seite). Bekommt die Abtastrate, schickt [links, rechts] als Float32Array zurück
// (die Puffer übertragen, nicht kopiert) und endet. Die Seite startet ihn als Modul-Worker (new Worker(new URL(…)):
// im Dev-Server diese Datei, im Build macht Vite daraus eine Datei unter assets/). Lädt er nicht (alte Browser ohne
// Modul-Worker), rechnet die Seite in Stücken im Hauptthread.
import { HALL_SECONDS, hallImpulse } from './hall.js';

onmessage = ({ data: rate }: MessageEvent<number>) => {
  const steps: Generator<undefined, Float32Array[]> = hallImpulse(rate, HALL_SECONDS);
  let r: IteratorResult<undefined, Float32Array[]>;
  do r = steps.next(); while (!r.done);
  postMessage(r.value, r.value.map((d) => d.buffer));
  close();
};
