# 12: Schwierigkeit geeicht

**What to build:** Die Beurteilung liefert die Schwierigkeit als Zahl mit Teilwerten. Sie misst vor allem die
Denkarbeit und bildet die heutige Reihenfolge nach (ADR 0001), geprüft an Leveln, an denen nicht geeicht wurde.

**Spec:** ../spec.md, Abschnitt „Beurteilung“ (Schwierigkeit).

**Blocked by:** 09 (Spielermodell und Probieren), 10 (Kernideen I), 11 (Kernideen II)

**Status:** ready-for-agent

- [ ] Die Schwierigkeit besteht aus Teilwerten: Denkarbeit aus dem Spielermodell, Farblogik und Kernideen. Die Grösse
      (drehbare Elemente) geht nur mit kleinem, nach oben begrenztem Anteil ein. Dieser Anteil ist ausgewiesen.
- [ ] Die Gewichte werden nur an jedem zweiten der 150 Level eingestellt. Die Auswahl ist fest, zum Beispiel alle
      geraden Plätze. Alle 150 zählen gleich.
- [ ] Ein Test prüft die Rangkorrelation mit der heutigen Reihenfolge an den übrigen Leveln: mindestens 0,85 über alle
      und mindestens 0,5 in jedem 30er-Bereich.
- [ ] Ein Bericht unter `## Comments` nennt die Werte gesamt und je Bereich sowie die grössten Abweichungen mit altem
      und neuem Platz.
