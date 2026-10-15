# 16: KI-Tester prüfen die grossen Abweichungen

**What to build:** Für jedes Level, das nach der Formel mehr als 10 Plätze wandern würde, urteilen die beiden KI-Tester.
Verschoben wird nur, wenn sie zustimmen. Danach steht die Reihenfolge der 150 Level fest.

**Spec:** ../spec.md, Abschnitte „KI-Tester“ und „Levelliste, Reihenfolge und Austausch“.

**Blocked by:** 05 (Ablauf der KI-Tester), 15 (Neue Reihenfolge und Grade)

**Status:** ready-for-agent

- [ ] Für jedes Level der Prüfliste aus Ticket 15 urteilen beide Tester nach dem Ablauf aus Ticket 05.
- [ ] Ein Level kommt nur dann auf den Platz der Formel, wenn beide Tester zustimmen. Sonst bleibt es an seinem alten
      Platz.
- [ ] Eigene Korrekturen der Tester betragen höchstens 5 Plätze und überschreiten nie eine Gradgrenze.
- [ ] Lehnen beide Tester ein Level ab, kommt es auf die Duldungsliste. Dies ist der letzte Zeitpunkt, an dem die Liste
      wachsen darf, und der Test der ursprünglichen Liste wird entsprechend nachgeführt.
- [ ] Das Protokoll ist vollständig. Ein Test der Levelliste prüft, dass jede Abweichung vom Platz der Formel im
      Protokoll begründet ist.
- [ ] Der Grad sinkt entlang der Reihenfolge weiterhin nie, und alle Tests sind grün.
