// Bausteine der Kernideen (ADR 0004: zuerst die Kernidee gezielt einbauen): je Kernidee einer, dazu einer ohne
// Kernidee. Ein Baustein ist der Standard-Export seiner Datei, { kernidee, braucht, baue }:
//   kernidee: sein Glossarbegriff (wie in TEILE.kernideen der Beurteilung), null ohne Kernidee
//   braucht:  { quellen, drehbar }, was er mindestens setzt; die Vorgabe eines Grads muss es erlauben (vorgaben.mjs)
//   baue(bau, plan, vorgaben): setzt die Kernidee in den leeren Bau (bau.mjs): ihre Elemente mit bau.setze(el,
//     { kern: true }), die Zellen, die frei bleiben müssen, in bau.reserviert. Rückgabe null oder der Grund, warum es
//     nicht ging. Er darf den Bau mit bau.leere() neu beginnen.
// Ob die Kernidee nötig ist, prüft nicht der Baustein, sondern die Beurteilung (generiere in index.mjs).
//
// Je Baustein eine Zeile; jedes Ticket trägt seine Zeilen unter seiner eigenen Kommentarzeile ein (wie regeln.mjs der
// Beurteilung).

// Ohne Kernidee und Mischziel aus zwei Quellen (Ticket 18)
export { default as ohne } from './ohne.mjs';
export { default as mischzielZweiQuellen } from './mischziel-zwei-quellen.mjs';
