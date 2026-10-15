# 03: Strahlregel schneller

**What to build:** Die gemeinsame Strahlregel rechnet schneller, ohne ihr Verhalten zu ändern (ADR 0003). Spiel, Löser,
Generator und Tests profitieren davon. Es bleibt bei genau einer Strahlregel, eine schnellere Kopie für die Werkzeuge
gibt es nicht.

**Spec:** ../spec.md, Abschnitt „Strahlregel“.

**Blocked by:** 01 (Golden-Test), 02 (Ausgangszahlen)

**Status:** ready-for-agent

- [ ] Die heissen Stellen aus der Messung sind beseitigt:
      - die Ausnahme, die beim Lesen einer offenen Stellung im häufigen Fall geworfen wird,
      - Längen, die bei jedem Strahlschritt neu berechnet werden,
      - die aufwendige Buchhaltung der Kombinatoren.
- [ ] Der Golden-Test und alle bestehenden Logiktests sind grün.
- [ ] Das Messskript aus 02 zeigt die Zeit je Aufruf vorher und nachher. Der Gewinn steht unter `## Comments`.
- [ ] Screenshots des Spiels sind vor und nach dem Umbau gleich: Desktop und Handy, je ein Level mit Prisma,
      Kombinator und Filter. Sie entstehen über die gedeckelte Umgebung, nacheinander.
