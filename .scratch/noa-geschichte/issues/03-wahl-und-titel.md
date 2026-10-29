# 03: Wahl der 240 Level und Titel der Welten

**Spec:** ../spec.md

**Blocked by:** 02

**Status:** ready-for-agent

**What to build:** Je Grad die 60 Level der Geschichte, verteilt auf die 6 Welten zu je 10, nach den Regeln der Spec
(«Wahl der 240 Level»), und für jedes einen Titel, der zu seiner Welt passt. Das Ergebnis ist eine nachbaubare Datei
unter `tools/geschichte/`; das Spiel bleibt in diesem Ticket unverändert.

- [ ] Werkzeug für die Wahl (z. B. `tools/geschichte.mjs wahl`): Pool je Grad aus dem Spiel, für «sehr schwer» dazu
      die 15 aus `tools/geschichte/sehr-schwer-neu.json`; Bewertung aus Urteil der KI-Tester und Spielwert, kein von
      beiden abgelehntes Level; Vielfalt vor Bewertung (Haupt-Kernidee höchstens zweimal je 10 aufeinanderfolgende
      Level des Grads, auch über Weltgrenzen; Ähnlichkeit unter 0,5); Schwierigkeit über den ganzen Bereich des Grads,
      Welt *w* mit den Rängen 10·*w* … 10·*w*+9, innerhalb der Welt Vertauschungen um höchstens 2 Plätze.
- [ ] Gleiche Eingaben ergeben die gleiche Wahl. Die Datei nennt je Level Grad, Welt, Platz, Schwierigkeit,
      Haupt-Kernidee, Bewertung und, wo die Vielfalt eine Entscheidung erzwang, warum.
- [ ] Die 15 neuen sehr schweren Level bekommen einen Schlüssel (`name`) im bisherigen Stil, eindeutig und nicht von der
      Liste entfernter Level.
- [ ] 240 Titel (je Welt 40) nach «Namen der Welten» in der Spec, eindeutig über alle Titel und Namen in Spiel und
      Vorrat, Schweizer Schreibweise. Der Koordinator wählt sie, ohne Freigabe des Nutzers.
- [ ] Tests der Wahl: 4 × 60, je Welt 10, Grad stimmt, Schwierigkeit steigt (Ränge je Welt, Vertauschungen höchstens 2),
      Vielfalt, Ähnlichkeit, kein abgelehntes Level, genau eine Lösung, Titel eindeutig; Gegenproben an erfundenen
      Fällen.
- [ ] Bericht unter `## Comments`: Verteilung der Haupt-Kernideen je Grad und Welt, Bereich der Schwierigkeit je Welt,
      wo die Vielfalt die Bewertung überstimmte.
- [ ] Alle Tests grün; Review nach dem Ticket.

## Comments
