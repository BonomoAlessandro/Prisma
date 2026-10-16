// Registrierung der Regeln der Beurteilung: je Regel genau eine Zeile, die ihre Datei wieder exportiert. Was hier nicht
// steht, meldet die Beurteilung als offen. Wie eine Regel aussieht, steht in index.mjs.
//
// Jedes Ticket trägt seine Zeilen unter seiner eigenen Kommentarzeile ein. So berühren sich parallele Tickets beim
// Zusammenführen nicht: Zwischen ihren Einträgen steht immer eine unveränderte Zeile.

// Mischziele (Ticket 06)
export { default as mischziele } from './mischziele.mjs';
// Ausschlussgründe Scheinmischung und Knäuel, je eine Datei in ausschluesse/ (Ticket 07)
// Ausschlussgründe Füllteil und Zerfall, je eine Datei in ausschluesse/ (Ticket 08)
// Ausschlussgrund Probieren, in ausschluesse/ (Ticket 09)
// Kernideen Mischziel aus zwei Quellen, Abschalten und Farben abzählen, je eine Datei in kernideen/ (Ticket 10)
// Kernideen Sammelstelle, Falle und Lockvogel, je eine Datei in kernideen/ (Ticket 11)
// Schwierigkeit, in schwierigkeit.mjs (Ticket 12)
// Spielwert, in spielwert.mjs (Ticket 13)
