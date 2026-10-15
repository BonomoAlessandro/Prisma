# 05: Ablauf der KI-Tester

**What to build:** Ein wiederholbarer Ablauf, in dem zwei KI-Tester Level aus Spielersicht beurteilen, dazu ein
versioniertes Protokoll ihrer Urteile (ADR 0002). Die Tester beurteilen, was der Code schlecht sieht: Aha-Moment,
Lesbarkeit und Gefühl. Ticket 13 eicht an ihren Urteilen den Spielwert, die Tickets 16 und 23–26 prüfen damit die
Reihenfolge und die Ersatzlevel.

**Spec:** ../spec.md, Abschnitt „KI-Tester“.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Zwei Tester urteilen unabhängig voneinander. Jeder bekommt das Feld als Text und Screenshots der Startstellung
      auf Desktop und Handy.
- [ ] Als Anker dienen je zwei feste Level pro Schwierigkeitsgrad. Die Grade gelten vorläufig: leicht 1–30, mittel
      31–100, schwer 101–140, sehr schwer 141–150. Kein Anker steht auf der Duldungsliste der Spec.
- [ ] Jeder Tester antwortet in festen JSON-Feldern:
      - Aha-Moment ja oder nein, mit Beschreibung
      - Lesbarkeit
      - Gefühl (Spass) von 1 bis 5
      - Einordnung zwischen den Ankern
      - Ablehnung mit einem Begriff aus dem Glossar, oder keine
- [ ] Die Urteile werden nach festen Regeln zusammengeführt: abgelehnt nur, wenn beide ablehnen. Eine Korrektur der
      Position beträgt höchstens 5 Plätze und überschreitet nie eine Gradgrenze.
- [ ] Jedes Urteil steht mit Datum, Version des Ablaufs und Begründung im versionierten Protokoll.
- [ ] Ein Test prüft das Protokoll: Schema, Grenzen der Korrekturen und Ablehnung nur gemeinsam.
- [ ] Ein Probelauf auf den Ankern und drei weiteren Leveln liegt im Protokoll.
- [ ] Die Screenshots entstehen über die gedeckelte Umgebung, nacheinander.
