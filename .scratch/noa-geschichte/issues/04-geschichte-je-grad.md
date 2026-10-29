# 04: Die Geschichte je Grad im Spiel

**Spec:** ../spec.md

**Blocked by:** 03

**Status:** ready-for-agent

**What to build:** Das Spiel ist die Geschichte. `index.html` enthält nur noch das Tutorial und die 240 Level der Wahl
(mit Titel), alles andere liegt im Vorrat. Ein Durchgang läuft je Grad mit 6 Welten zu 10 Leveln, mit eigenem
Speicherstand je Grad. Die Wahl des Grads ist in diesem Ticket noch schlicht (vier Knöpfe nach dem Startbildschirm);
das gestaltete Menü folgt in Ticket 05.

- [ ] Umbau mit `tools/vorrat.mjs`: Die nicht gewählten flachen Level und alle 300 Würfel-Level in den Vorrat, die
      15 neuen sehr schweren ins Spiel; ein Datenblock der Geschichte (je Grad 6 × 10 Schlüssel in Reihenfolge), aus dem
      Werkzeug geschrieben. Test: Jedes Level von vorher steht im Spiel oder im Vorrat, mit unveränderten Leveldaten.
- [ ] `STORY_CHAPTERS` liest die Level je Grad aus dem Datenblock; Kopfzeile nach Entscheid 20 («Das Meer – Brandung»,
      «●●○○ Mittel · Kapitel 2 / 6 · Level 4 / 10»); das Spiel zeigt `titel ?? name`.
- [ ] Die Geschichte läuft ohne `?signal`; `?signal` hat keine Wirkung mehr. Überspringen mit N und `?signal=<Kapitel>`
      entfallen ganz (Entscheid 21); Werkzeuge und Testtreiber steuern über die Testschnittstelle (`__prismaDebug`).
- [ ] Speicherstand je Grad unter `prisma.noa.*` (Platz, gelöste Level, gesehene Momente, geschafft) und der zuletzt
      gespielte Grad; alte Schlüssel werden nicht mehr gelesen. Neuladen setzt im zuletzt gespielten Grad fort,
      Einstiege nur beim ersten Mal je Grad (wie heute `prisma.signal.seen`, jetzt je Grad).
- [ ] Die bisherige Levelauswahl (Fläche/Würfel, Seiten) ist aus dem Spiel; bis Ticket 06 öffnet der Knopf nichts
      bzw. ist ausgeblendet. Hintergrund-Knopf und Taste H entfallen (Entscheid 26).
- [ ] Tests der Levelliste und der Würfelliste auf den neuen Stand (Würfel im Vorrat); Golden-Test, Beurteilung,
      KI-Tester grün über den Lader.
- [ ] Probe im Browser: in jedem Grad ein Durchgang durch die ersten zwei Welten (Einstieg, 10 Level, Reise), dazu das
      Finale ab der letzten Welt; Desktop und Handy, Konsole ohne Fehler.
- [ ] Alle Tests grün; Review nach dem Ticket.

## Comments
