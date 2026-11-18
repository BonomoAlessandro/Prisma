// Worker der Skyboxen (Ticket 05 von .scratch/umbau/, bis dahin ein Blob aus dem Text von decode): dekodiert die
// Farbbilder der Skyboxen mit decode (src/himmelbild.js) ausserhalb des Hauptthreads, für skyBitmaps
// (src/seite/himmel/skybox.js). Bekommt { id, url, rows, pad }, schickt { id, r } mit den Streifen (die Bilder
// übertragen, nicht kopiert) oder { id, err } zurück und bleibt für die nächsten Bilder offen. Die Seite startet ihn als
// Modul-Worker (new Worker(new URL(…)): im Dev-Server diese Datei, im Build macht Vite daraus eine Datei unter assets/).
// Lädt er nicht, dekodiert die Seite im Hauptthread.
import { decode } from './himmelbild.js';

type Auftrag = { id: number; url: string; rows: number; pad: number };

onmessage = async ({ data: { id, url, rows, pad } }: MessageEvent<Auftrag>) => {
  try {
    const r = await decode(url, rows, pad);
    postMessage({ id, r }, r.strips.map((s: { bitmap: ImageBitmap }) => s.bitmap));
  } catch (e) { postMessage({ id, err: String(e) }); }
};
