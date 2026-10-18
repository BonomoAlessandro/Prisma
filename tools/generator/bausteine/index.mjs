// Bausteine der Kernideen (ADR 0004: zuerst die Kernidee gezielt einbauen): je Kernidee einer, dazu einer ohne
// Kernidee. Ein Baustein ist der Standard-Export seiner Datei, { kernidee, braucht, baue }:
//   kernidee: sein Glossarbegriff (wie in TEILE.kernideen der Beurteilung), null ohne Kernidee
//   braucht:  { quellen, drehbar }, was er mindestens setzt; die Vorgabe eines Grads muss es erlauben (vorgaben.mjs)
//   baue(bau, plan, vorgaben): setzt die Kernidee in den leeren Bau (bau.mjs): ihre Elemente mit bau.setze(el,
//     { kern: true }), die Zellen, die frei bleiben müssen, in bau.reserviert. Rückgabe null oder der Grund, warum es
//     nicht ging. Er darf den Bau mit bau.leere() neu beginnen. Ein Lockvogel (festes Teil abseits der Lösung) kommt
//     mit { kern: true, lockvogel: true }; nur so nimmt ihn die Regel gegen wirkungslose Elemente aus.
//   andocken (wahlweise, Ticket 28): ab „mittel“ (vorgaben.andocken) darf „schwerer“ Stränge der Kernidee andocken
//     (andocken.mjs); { fremdfarbe: true }: auch die Quellen, die das Ergänzen setzt, teilen keine Grundfarbe mit den
//     Zielen der Kernidee (die Quellen des Andockens tun das immer, wo es geht). Elemente, die das Andocken nicht
//     verändern soll, trägt baue in bau.unberuehrt ein.
// Ob die Kernidee nötig ist, prüft nicht der Baustein, sondern die Beurteilung (generiere in index.mjs). Gemeinsame
// Hilfen der Bausteine (Licht gezielt an eine Zelle bringen, Strahlen verfolgen) stehen in wege.mjs, kein Baustein.
//
// Je Baustein eine Zeile; jedes Ticket trägt seine Zeilen unter seiner eigenen Kommentarzeile ein (wie regeln.mjs der
// Beurteilung).

// Ohne Kernidee und Mischziel aus zwei Quellen (Ticket 18)
export { default as ohne } from './ohne.mjs';
export { default as mischzielZweiQuellen } from './mischziel-zwei-quellen.mjs';
// Abschalten, Farben abzählen, Sammelstelle, Falle und Lockvogel (Ticket 19)
export { default as abschalten } from './abschalten.mjs';
export { default as farbenAbzaehlen } from './farben-abzaehlen.mjs';
export { default as sammelstelle } from './sammelstelle.mjs';
export { default as falle } from './falle.mjs';
export { default as lockvogel } from './lockvogel.mjs';
