// Oberfläche: Zugriff aufs DOM, Touch-Gerät (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import '../levelfluss.js';

/* =====================================================================
   UI — Kopfzeile, kleine Schaltflächen, "Level gelöst", Startbildschirm. Alles DOM über der Szene; Klicks darauf
   erreichen den Canvas nicht und drehen daher nichts.
   ===================================================================== */

const $ = (id) => document.getElementById(id);
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;

export { $, IS_TOUCH };
