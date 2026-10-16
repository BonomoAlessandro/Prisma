# 15: Neue Reihenfolge und Grade

**What to build:** Die 150 Level werden mit der Beurteilung neu geordnet und bekommen ihren Schwierigkeitsgrad. Die
Tests der Levelliste prüfen ab jetzt die Regeln der Spec. Level, die eine Regel verletzen, stehen auf der Duldungsliste,
bis sie in Phase 6 ersetzt werden.

**Spec:** ../spec.md, Abschnitte „Levelliste, Reihenfolge und Austausch“, „Schwierigkeitsgrade“ und „Entscheide zu den
Tests“, Nahtstelle 3.

**Blocked by:** 12 (Schwierigkeit geeicht), 13 (Spielwert geeicht)

**Status:** ready-for-agent

- [ ] Die 150 Level werden nach der Schwierigkeit geordnet. Verschiebungen bis 10 Plätze werden übernommen. Ein Level,
      das weiter wandern würde, bleibt an seinem alten Platz und kommt auf die Prüfliste für Ticket 16.
- [ ] Feste Schwellen der vier Grade auf der Schwierigkeit sind festgelegt und begründet. Ausgangspunkt ist die
      vorläufige Aufteilung 30 / 70 / 40 / 10. Entlang der Reihenfolge sinkt der Grad nie.
- [ ] Jedes Level nach dem Tutorial trägt in den Leveldaten seinen Grad, eines der vier Wörter. Das Feld ist nach dem
      Glossar benannt und ersetzt die alte Markierung. Bis Ticket 17 zeigt das Spiel weiterhin nur „schwer“ und „sehr
      schwer“ an.
- [ ] Die Reihenfolge entsteht aus der Beurteilung und dem Protokoll der KI-Tester. Die von Hand gepflegte Auswahlliste
      wird für die Reihenfolge nicht mehr gebraucht.
- [ ] Auf der Duldungsliste stehen alle Level, die einen Ausschlussgrund haben, und ab „mittel“ alle, die keine nötige
      Kernidee haben oder unter dem Mindest-Spielwert liegen.
- [ ] **Haltepunkt:** In zwei Fällen hält das Ticket an, und der Nutzer entscheidet:
      - Die Duldungsliste wird deutlich länger als die 37 Level der Neuzählung.
      - Die heutigen Level verletzen eine Regel, die sich nicht über die Duldungsliste abbilden lässt, etwa „Haupt-Kernidee
        höchstens zweimal je 10 Level“.
- [ ] Eine leere Liste der entfernten Namen ist angelegt.
- [ ] Die neuen Tests der Levelliste ersetzen die Tests zu Markierung, gehärteten Leveln, Härte-Abnahme und
      Auswahlliste. Sie prüfen:
      - Jedes Level hat einen Grad, und der Grad sinkt nie.
      - Das Mittel der Schwierigkeit je 10 Level steigt, mit Toleranz.
      - Ein Ausschluss kommt nur bei Leveln auf der Duldungsliste vor.
      - Auf die Duldungsliste kommt kein neues Level: Der Test vergleicht mit der ursprünglichen Liste.
      - Ab „mittel“ hat jedes Level eine nötige Kernidee.
      - Ab „mittel“ liegt jedes Level über dem Mindest-Spielwert.
      - Dieselbe Haupt-Kernidee kommt höchstens zweimal je 10 Level vor.
      - Die Namen sind eindeutig, und keiner steht auf der Liste der entfernten Namen.
      - Jedes Level hat genau eine Lösung.
- [ ] Der Fortschritt der Spieler bleibt erhalten, denn er ist nach Namen gespeichert.

## Comments

**Hinweise aus den Tickets 11 und 13:**
- Ab „mittel“ haben 59 Level keine nötige Kernidee (Ticket 11), und 57 liegen unter dem Mindest-Spielwert 60, 53 davon
  ohne nötige Kernidee (Ticket 13). Die Duldungsliste würde damit deutlich länger als 37: Das ist der Haltepunkt, der
  Nutzer entscheidet.
- Darunter sind Level, die die KI-Tester mögen, etwa 73 Rochade und 89 Uhrwerk. Die KI-Tester sehen Kernideen, wo die
  Erkennung keine findet (39, 14, 51, 102, 73, 89; Ticket 13, „Hinweise“). Vor dem Festlegen der Liste prüfen, ob das
  Glossar zu schärfen oder die Erkennung zu erweitern ist.
- Der Mindest-Spielwert gilt erst ab „mittel“ (Auslegung vom 16.10.2026, Spec „Weitere Hinweise“).
