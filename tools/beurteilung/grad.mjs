// Schwierigkeitsgrad (Glossar, Spec „Beurteilung“): Er folgt über feste Schwellen aus der Schwierigkeit. Festgelegt in
// Ticket 15 an den 150 Leveln: Ausgangspunkt war die vorläufige Aufteilung 30 / 70 / 40 / 10 (leicht 1–30, mittel
// 31–100, schwer 101–140, sehr schwer 141–150). Je Grenze liegt die Schwelle in der breitesten Lücke zwischen zwei
// benachbarten Werten höchstens 5 Plätze von der vorläufigen Grenze, in ihrer Mitte, auf halbe Punkte gerundet. So hält
// sie, wenn sich Werte etwas verschieben; genau nach 100 Leveln lägen die Nachbarn nur 0,01 auseinander. Nach diesen
// Schwellen sind es 30 / 74 / 34 / 12 Level. Herleitung und Zahlen in Ticket 15, Bericht in tools/ordne-level.mjs.
// Entlang der Reihenfolge der Levelliste sinkt der Grad nie; wie das gilt, wenn ein Level nicht auf dem Platz der
// Formel steht, regelt tools/levelliste.mjs.
import { GRADE } from './index.mjs';

/** Untere Schwellen auf der Schwierigkeit: Ab diesem Wert ist ein Level mindestens in diesem Grad. */
export const SCHWELLEN = { mittel: 43, schwer: 58.5, 'sehr schwer': 87 };

/** Der Grad nach der Schwierigkeit (Wert, etwa beurteilung.schwierigkeit.wert). */
export const gradVon = (wert) => GRADE.reduce((bisher, g) => (wert >= SCHWELLEN[g] ? g : bisher));
