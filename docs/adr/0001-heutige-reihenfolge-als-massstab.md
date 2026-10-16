# Die heutige Reihenfolge ist der Massstab für die Schwierigkeit

Es gibt keine Spieldaten, und KI-Tester waren sich bei der Schwierigkeit kaum einig (Rangkorrelation 0,02–0,27). Die
heutige Reihenfolge der 150 Level ist von Hand festgelegt und vom Nutzer grösstenteils selbst gespielt. Darum eichen
wir die Schwierigkeit an ihr. Die Gewichte werden an der einen Hälfte der Level eingestellt und an der anderen
vorhergesagt, dann umgekehrt (gekreuzt). Abnahme: Rangkorrelation dieser Vorhersagen mit der heutigen Reihenfolge
mindestens 0,85 über alle Level und 0,3 je 30er-Bereich, auf zwei Stellen gerundet wie beim Knäuel. Alle 150 Level
zählen gleich.

**Geändert am 16.10.2026** (Ticket 12, Entscheid des Nutzers): Vorher galt 0,5 je 30er-Bereich, gemessen nur an den 15
nicht geeichten Leveln eines Bereichs. Das erreichte keine Formel. Stand beim Entscheid:

| | über alle | 1–30 | 31–60 | 61–90 | 91–120 | 121–150 |
|---|---|---|---|---|---|---|
| Schwierigkeit, an den 15 nicht geeichten Leveln je Bereich | 0,93 | 0,81 | 0,58 | 0,33 | 0,43 | 0,76 |
| Schwierigkeit, gekreuzt über alle 30 Level je Bereich | 0,93 | 0,850 | 0,301 | 0,382 | 0,296 | 0,521 |
| alte Wertung (`score`), an denselben 15 Leveln | 0,87 | 0,86 | 0,23 | −0,31 | 0,88 | 0,50 |

Gerundet wird auf zwei Stellen (zweiter Entscheid des Nutzers vom selben Tag): 91–120 liegt bei 0,296, gerundet 0,30,
und ist damit erreicht. Der Abstand zur Schwelle ist knapp; schon kleine Änderungen an Leveln oder Gewichten können ihn
kippen (Stand in Ticket 12).

- In der Mitte haben fast alle Level 7 drehbare Elemente und lösen sich ohne Fallunterscheidung; die heutige
  Reihenfolge dort stammt aus mehreren Reviews mit eingeschobenen Leveln.
- Mit 15 Leveln schwankt die Rangkorrelation zufällig um etwa ±0,27, mit allen 30 eines Bereichs um etwa ±0,19. Das
  gekreuzte Mass nutzt jedes Level einmal, immer mit Gewichten, in die sein Platz nicht einging.
- Ganz unberührt ist die vorhergesagte Hälfte nicht: Ihre Messwerte (nicht ihre Plätze) bestimmen die Skala und die
  Grenzen der Anteile mit, und die Masse der Teilwerte wurden auch nach Zahlen gewählt, die sie enthalten. Knapp ist
  das Ergebnis auch gegenüber der festen Grösse, die nicht geeicht ist (Ticket 12).
- Die Schwelle 0,3 verlangt, dass die Schwierigkeit der Reihenfolge in jedem Bereich spürbar folgt. Über alle Level
  bleibt es bei 0,85.

**Ergänzt am 16.10.2026** (Ticket 15): Seit Ticket 15 stehen die Level im Spiel in der Reihenfolge der Formel. Die
heutige Reihenfolge bleibt der Massstab, als feste Namensliste in `tools/beurteilung/heutige-reihenfolge.json`; an ihr
wird weiter geeicht und gekreuzt geprüft, mit denselben Gewichten und Zahlen. Ohne sie eichte die Schwierigkeit an
ihrer eigenen Reihenfolge.
