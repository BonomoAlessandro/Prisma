// Registrierung der Regeln der Beurteilung: je Regel genau eine Zeile, die ihre Datei wieder exportiert. Was hier nicht
// steht, meldet die Beurteilung als offen. Wie eine Regel aussieht, steht in index.mjs.
//
// Jedes Ticket trägt seine Zeilen unter seiner eigenen Kommentarzeile ein. So berühren sich parallele Tickets beim
// Zusammenführen nicht: Zwischen ihren Einträgen steht immer eine unveränderte Zeile.

// Mischziele (Ticket 06)
export { default as mischziele } from './mischziele.mjs';
// Ausschlussgründe Scheinmischung und Knäuel, je eine Datei in ausschluesse/ (Ticket 07)
export { default as scheinmischung } from './ausschluesse/scheinmischung.mjs';
export { default as knaeuel } from './ausschluesse/knaeuel.mjs';
// Ausschlussgründe Füllteil und Zerfall, je eine Datei in ausschluesse/ (Ticket 08)
export { default as fuellteil } from './ausschluesse/fuellteil.mjs';
export { default as zerfall } from './ausschluesse/zerfall.mjs';
// Ausschlussgrund Probieren, in ausschluesse/ (Ticket 09)
export { default as schliessen } from './schliessen.mjs';
export { default as probieren } from './ausschluesse/probieren.mjs';
// Kernideen Mischziel aus zwei Quellen, Abschalten und Farben abzählen, je eine Datei in kernideen/ (Ticket 10)
export { default as mischzielZweiQuellen } from './kernideen/mischziel-zwei-quellen.mjs';
export { default as abschalten } from './kernideen/abschalten.mjs';
export { default as farbenAbzaehlen } from './kernideen/farben-abzaehlen.mjs';
// Kernideen Sammelstelle, Falle und Lockvogel, je eine Datei in kernideen/, und die Haupt-Kernidee (Ticket 11)
export { default as sammelstelle } from './kernideen/sammelstelle.mjs';
export { default as falle } from './kernideen/falle.mjs';
export { default as lockvogel } from './kernideen/lockvogel.mjs';
export { default as hauptKernidee } from './haupt-kernidee.mjs';
// Schwierigkeit, in schwierigkeit.mjs (Ticket 12)
// Spielwert, in spielwert.mjs (Ticket 13)
