# 13: Spielwert geeicht

**What to build:** Die Beurteilung liefert den Spielwert als Zahl mit Teilwerten, getrennt von der Schwierigkeit. Er
entscheidet über die Aufnahme ins Spiel. Unter einem Mindest-Spielwert wird kein Level aufgenommen.

**Spec:** ../spec.md, Abschnitte „Beurteilung“ (Spielwert) und „KI-Tester“.

**Blocked by:** 05 (Ablauf der KI-Tester), 09 (Spielermodell und Probieren), 10 (Kernideen I), 11 (Kernideen II)

**Status:** ready-for-agent

- [ ] Der Spielwert besteht aus Teilwerten:
      - Schliessen (aus dem Spielermodell) und eine nötige Kernidee tragen zusammen etwa zwei Drittel.
      - Farblogik und Zusammenspiel geben einen kleineren Bonus.
      - Beim Zusammenspiel zählen gemeinsame Mischziele, und alle Quellen werden verglichen. Das behebt die Fehler aus
        der Analyse.
- [ ] Als Eichmenge dienen die Spass-Urteile der KI-Tester (Ablauf aus 05) für mindestens 40 Level aus allen vier
      Graden. Vorhandene Urteile aus den Reviews zählen mit, wenn sie ein Gefühl von 1 bis 5 enthalten. Alle Urteile
      stehen im Protokoll.
- [ ] Die Gewichte bringen den Spielwert möglichst nah an das Spass-Urteil. Die erreichte Rangkorrelation steht unter
      `## Comments`.
- [ ] Der Mindest-Spielwert ist festgelegt und begründet. Berichtet wird, welche der 150 Level darunter liegen.
- [ ] Mini-Level zeigen: Ein Level, das sich durch Schliessen mit nötiger Kernidee lösen lässt, hat einen höheren
      Spielwert als ein sonst gleiches Level ohne diese Eigenschaften.
