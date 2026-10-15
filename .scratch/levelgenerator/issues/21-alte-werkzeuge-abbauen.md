# 21: Alte Werkzeuge abbauen

**What to build:** Nur noch die Beurteilung und der neue Generator bestimmen, wie Level beurteilt und erzeugt werden.
Die alten Werkzeuge mit eigenen Formeln verschwinden.

**Spec:** ../spec.md, Abschnitte „Generator“ und „Beurteilung“; ADR 0004.

**Blocked by:** 15 (Neue Reihenfolge und Grade), 19 (Generator: alle Kernideen), 20 (Generator: Verfeinern)

**Status:** ready-for-agent

- [ ] Diese Teile sind entfernt:
      - der alte Generator, das Härten und die Profile (Grössenstufe × Mischung);
      - die alte Formel der Schwierigkeit samt der falschen Zählung der Mischziele;
      - der alte Ja/Nein-Filter;
      - die von Hand gepflegte Auswahlliste;
      - Kandidatendateien, die niemand mehr verwendet.
- [ ] Pools und Kuratieren benutzen nur noch die Beurteilung oder entfallen, wo der neue Ablauf sie ersetzt.
- [ ] Kein Werkzeug rechnet mehr mit einer eigenen Formel. Das ist durch eine Suche im Code belegt.
- [ ] Die Referenz des Golden-Tests ist ohne die alte Wertung neu geschrieben, mit Begründung im Commit. Das Verhalten
      der Strahlregel bleibt unverändert.
- [ ] README (Werkzeuge, Tests) und PLAN.md sind nachgeführt.
- [ ] Alle Tests sind grün.
