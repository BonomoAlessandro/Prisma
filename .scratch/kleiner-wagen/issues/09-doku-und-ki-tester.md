# 09: Doku und Test der KI-Tester

**Spec:** ../spec.md

**Blocked by:** 08

**Status:** ready-for-agent

**What to build:** Glossar, Plan und Kommentare beschreiben den Kleinen Wagen so, wie er gebaut ist (Entscheid 23;
«Doku» in den Entscheiden zur Umsetzung der Spec).

- [ ] `CONTEXT.md`, Abschnitt «Noas Geschichte»: neue Einträge **Kleiner Wagen** (das Sternbild aus sieben Sternen,
      an der Spitze der Deichsel der Polarstern; im Code `wagen`; _Vermeiden_: Sternzeichen, Planeten), **Stern einer
      Welt** und **Erwachen** (wann, was man sieht, wann ein Stern als wach gilt, «Von vorn»).
- [ ] Bestehende Einträge anpassen, wo der Wagen sie berührt: Reise (Aufstieg zum Stern, Flug am nächsten vorbei),
      Einstieg in eine Welt, Träger, Wiederholen (kein Erwachen), Menü und Übersicht (nach der Wahl aus Ticket 02),
      Im Dorf (Wagen am Himmel).
- [ ] Die Sprache des Glossars: kurz, Begriffe statt Code, so wie die übrigen Einträge.
- [ ] `PLAN.md` 0.4 abhaken mit Verweis auf diese Spec; die Farben-Ebene bleibt dort als offene Idee stehen.
- [ ] Kommentare im Code an den geänderten Stellen auf dem Stand (Geschichte, Reise, Finale, Bühne, Ladezeichen).
- [ ] **Test der KI-Tester** nach der Änderung an `CONTEXT.md` laufen lassen (ihr Fingerabdruck hängt an der Doku,
      «Was Spass macht» gehört dazu); er muss grün sein.
- [ ] Alle Tests grün; Review nach dem Ticket.

## Anhaltspunkte

- `tests/ki-tester.test.mjs`; Begriffe und Ton: bestehende Einträge in `CONTEXT.md`.

## Comments
