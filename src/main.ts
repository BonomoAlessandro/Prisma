// Einstieg der Seite (Ticket 04 von .scratch/umbau/): lädt die Teile des Spiels (src/seite/, Übersicht im README unter
// «Aufbau des Codes»). Es importiert nur den letzten Teil; jeder Teil importiert zuerst den vorherigen, so laufen sie
// beim Laden in der Reihenfolge der früheren Skripte (siehe src/seite/szene.js).
import './seite/schleife.js';
import { introCalm } from './seite/oberflaeche/ui.js';

// Den Service Worker registriert das Skript im Kopf von index.html erst, wenn load da ist und dieses Ereignis kommt
// (Ticket 09 von .scratch/umbau/): Alle Teile sind geladen und die Enthüllung ist vorbei (introCalm; ohne Intro sofort).
// Das Ende der Module allein kam gemessen so früh wie load (rund 1 s), und das Vorab-Speichern lief dann während des
// ganzen Seitenstarts mit
introCalm.then(() => dispatchEvent(new Event('prisma-ruhig')));
