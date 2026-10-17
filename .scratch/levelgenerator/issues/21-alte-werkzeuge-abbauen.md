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

## Comments

**Hinweise aus Ticket 15 (16.10.2026):**
- Reihenfolge und Grade entstehen jetzt mit `tools/ordne-level.mjs` aus der Beurteilung. `tools/selection.jsonl` und
  `curate.mjs` bestimmen sie nicht mehr. Kein Test liest `selection.jsonl` oder `harden.mjs` noch.
  `curate.mjs --order tools/selection.jsonl` schriebe die alte Reihenfolge mit dem Feld `difficulty` zurück und
  brächte die Tests der Levelliste zum Scheitern; es gehört zu den Teilen, die hier entfallen.
- `tests/logic.test.mjs` braucht `tools/profiles.mjs` noch für `NAMES` (die 150 Namen, als Menge verglichen) und die
  IDs der Profile, und `tools/quality.mjs` für `oddFilters`.
- Der Golden-Test vergleicht seit Ticket 15 nach Namen. Welche Level Löser und alte Wertung bekommen, steht in
  `golden.json` selbst (die Einträge mit `score`). Beim Neuschreiben ohne alte Wertung braucht es dafür eine neue
  Regel.

**Hinweis aus Ticket 18 (Generator):**
- Der neue Generator (`tools/generator/`, `tools/generiere.mjs`) braucht keine alten Werkzeuge: den Zufall hat er in
  `generator/zufall.mjs`, die Regeln der Levelliste aus `levelliste.mjs`.
- In `tools/bench.mjs` entfallen mit dem alten Generator `GENERATORS.alt` samt „härten“ und `ACCEPTANCES.alt`; als
  Standard bieten sich dann `--generator neu --accept beurteilung` an.
- `tests/logic.test.mjs` prüft die fremde Filterfarbe mit `oddFilters` aus `quality.mjs`. Der Generator hat
  dieselbe Regel in `wirkungslos` (`schritte.mjs`); für die Level im Spiel braucht es die Prüfung weiter, etwa in den
  Tests der Levelliste.
- `tools/show.mjs` zeigt die alte Wertung (`metrics`); für die JSON-Zeilen von `generiere.mjs` passt die
  Beurteilung besser.

**Hinweis aus Ticket 20 (Verfeinern):**
- Die Ausgangszahl für „härten“ ist gemessen, mit der Beurteilung als Abnahme. Gemessen auf dem i7-9750H mit
  `--jobs 4` und Seeds 1–160: 54 Level in 20 091 CPU-s, schwer 6,3 und sehr schwer 3,4 je CPU-Stunde. Der neue
  Generator liefert 1 353 bzw. 160 (Zahlen in Ticket 20). `harden.mjs` wird für den Vergleich also nicht mehr
  gebraucht.
- Der neue Generator kennt alle vier Grade (`VORGABEN` in `generator/vorgaben.mjs`) und braucht vom alten nichts.
  `bench.mjs` vergleicht über `--compare` weiter mit gespeicherten Messungen des alten. Die Dateien aus Ticket 20
  liegen nicht im Repo.
- Der Deckel ist im Repo 50 % wie in der Spec. Ein Rechner hebt ihn lokal mit `LEISE_MAX_CPU` an (nicht
  versioniert); `leise.sh` und `tools/deckel.mjs` (Generator, `bench.mjs`, Screenshots) lesen die Variable.
- **Aus dem Review (Fund 2), noch offen:** Ist in einem Versuch von „schwerer“ vor dem Festigen kein drehbares Element
  dazugekommen, kann er nicht gelingen (Festigen nimmt nur weg), und doch läuft die Eindeutigkeitssuche. Ein solcher
  Versuch liesse sich vor `festige` überspringen. Das spart laut Reviewer 1–10 % der Zeit, je nach Grad: 3 % bei
  `sehr schwer`, 10 % bei `schwer-mischziel`, 1 % bei `mittel`. Es ändert ab „mittel“ den Zufall und damit die Level
  und alle Messzahlen. Darum ist es in Ticket 20 nicht eingebaut; beim Abbau nachholen und neu messen.
