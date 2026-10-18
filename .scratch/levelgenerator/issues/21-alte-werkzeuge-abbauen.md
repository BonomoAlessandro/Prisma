# 21: Alte Werkzeuge abbauen

**What to build:** Nur noch die Beurteilung und der neue Generator bestimmen, wie Level beurteilt und erzeugt werden.
Die alten Werkzeuge mit eigenen Formeln verschwinden.

**Spec:** ../spec.md, Abschnitte „Generator“ und „Beurteilung“; ADR 0004.

**Blocked by:** 15 (Neue Reihenfolge und Grade), 19 (Generator: alle Kernideen), 20 (Generator: Verfeinern)

**Status:** resolved

- [x] Diese Teile sind entfernt:
      - der alte Generator, das Härten und die Profile (Grössenstufe × Mischung);
      - die alte Formel der Schwierigkeit samt der falschen Zählung der Mischziele;
      - der alte Ja/Nein-Filter;
      - die von Hand gepflegte Auswahlliste;
      - Kandidatendateien, die niemand mehr verwendet.
- [x] Pools und Kuratieren benutzen nur noch die Beurteilung oder entfallen, wo der neue Ablauf sie ersetzt.
- [x] Kein Werkzeug rechnet mehr mit einer eigenen Formel. Das ist durch eine Suche im Code belegt.
- [x] Die Referenz des Golden-Tests ist ohne die alte Wertung neu geschrieben, mit Begründung im Commit. Das Verhalten
      der Strahlregel bleibt unverändert.
- [x] README (Werkzeuge, Tests) und PLAN.md sind nachgeführt.
- [x] Alle Tests sind grün.

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
- ~~**Aus dem Review (Fund 2), noch offen:** Ist in einem Versuch von „schwerer“ vor dem Festigen kein drehbares Element
  dazugekommen, kann er nicht gelingen (Festigen nimmt nur weg), und doch läuft die Eindeutigkeitssuche. Ein solcher
  Versuch liesse sich vor `festige` überspringen. Das spart laut Reviewer 1–10 % der Zeit, je nach Grad: 3 % bei
  `sehr schwer`, 10 % bei `schwer-mischziel`, 1 % bei `mittel`. Es ändert ab „mittel“ den Zufall und damit die Level
  und alle Messzahlen. Darum ist es in Ticket 20 nicht eingebaut; beim Abbau nachholen und neu messen.~~
  **Gestrichen (18.10.2026, Koordinator):** Fund 2 setzt Ticket 28 um, das „schwerer“ ohnehin umbaut (dort der
  letzte Hinweis). In Ticket 21 ist er nicht eingebaut; der Generator, seine Level und seine Messzahlen bleiben hier
  unverändert.

**Umgesetzt 18.10.2026.** Gearbeitet im Worktree `.claude/worktrees/agent-a98d2986320fcc6ab` auf dem Branch
`ticket/21-alte-werkzeuge` (von `feature/levelgenerator`, Stand `6e98bb1`). Alle schweren Läufe nacheinander über
`leise.sh` mit `LEISE_MAX_CPU=65 LEISE_CPU=65` (ausser einem Lauf von `offline.mjs`, siehe Tests); Rechner i7-9750H,
Node 22.12.0. Zwei Commits: zuerst die Referenz
des Golden-Tests (`c549679`, `test(golden)`), dann der Abbau (`bf8cce7`, `refactor(werkzeuge)`).

**Entfernt** (im Verlauf bis `6e98bb1` nachzulesen):
- der alte Generator `tools/generate.mjs`, das Härten `tools/harden.mjs` und die Profile `tools/profiles.mjs`
  (Grössenstufe × Mischung, dazu `NAMES` und `PROFILE_LEVELS`);
- die alte Formel `metrics` in `tools/solver.mjs`: `score` samt der Zählung `mixed`, die jedes Ziel mit Mischfarbe
  zählte (129 statt 71 Level, auch Weiss aus einer weissen Quelle);
- der Ja/Nein-Filter `tools/quality.mjs` (`passes` mit `QUALITY_RULES`, dazu `quality`, `interplay`, `density`,
  `symOverlap` und `oddFilters`);
- die Auswahlliste `tools/selection.jsonl` (von Hand gepflegt, mit `difficulty`) und die Kandidatendatei
  `tools/candidates.jsonl` (handgebaute Level, früheres Kapitel II); beide las nur `curate.mjs`;
- Pools `tools/pools.mjs` und Kuratieren `tools/curate.mjs`. Beides ersetzt der neue Ablauf: Kandidaten je Auftrag
  liefert `generiere.mjs` mit ihrer Beurteilung (eine JSON-Zeile je Level; in eine Datei umgeleitet ist das ein Pool),
  Reihenfolge und Grade rechnet `ordne-level.mjs` aus der Beurteilung. `tools/pools/` bleibt in `.gitignore`, denn
  lokal liegen dort noch frühere Pools und Reviews.

**Umgebaut:**
- `tools/bench.mjs`: ohne `GENERATORS.alt` samt „härten“ und `ACCEPTANCES.alt`. Standard ist `--generator neu
  --accept beurteilung`; die Optionen bleiben mit je einer Wahl, damit die Aufrufe aus den Tickets 19, 20 und 28
  weiter gelten. `--generator alt`, `--accept alt` und die Gruppe „härten“ weist es ab. `--compare` vergleicht weiter
  mit gespeicherten Messungen des alten Generators (`tools/bench-baseline.json` bleibt, die Ausgangszahlen der Spec);
  einen Faktor gibt es wie bisher nur bei derselben Abnahme mit Grad, gegen die Datei im Repo (Abnahme `alt`) also
  nicht. Probe: `generator leicht mittel-mischziel --seeds 100 --jobs 2 --compare tools/bench-baseline.json` läuft.
- `tools/show.mjs` (Hinweis aus Ticket 18): statt der alten Wertung Grad, drehbare Elemente, Ziele und Klicks und, wo
  vorhanden, die Beurteilung der JSON-Zeilen von `generiere.mjs` (Schwierigkeit, Spielwert, Haupt-Kernidee und
  weitere Kernideen). `--level` nimmt den Platz in LEVELS (wie bisher, das Tutorial mitgezählt) oder den Namen;
  `--beurteilen` beurteilt Level ohne mitgegebene Beurteilung mit ihrem Grad und allen Regeln und nennt dazu die
  Ausschlussgründe (etwa `--level Zenit --beurteilen`: Schwierigkeit 96,2, Spielwert 87,5, Haupt-Kernidee
  Abschalten, Ausschluss Scheinmischung). Gezeichnet wird die notierte Lösung, nicht die gefundene.
- `tools/eiche-schwierigkeit.mjs --bericht`: ohne den Vergleich mit der alten Wertung (die Zahlen stehen in ADR 0001);
  22 s statt etwa 40 s. Die Gewichte bleiben gleich.
- `tests/logic.test.mjs`: Die Tests der vorgesehenen Namen (`NAMES`), der IDs der Profile, von `metrics` und der
  fremden Filterfarbe (`oddFilters`) entfallen hier (553 → 548).
- `tests/levelliste.test.mjs` (Hinweise aus 15 und 18), zwei Tests mehr (28 → 30):
  - **Ersatz für `NAMES`:** „Kein Level wird umbenannt“: Jeder Name der heutigen Reihenfolge
    (`beurteilung/heutige-reihenfolge.json`, dieselben 150 Namen wie `NAMES`) steht im Spiel oder auf der Liste der
    entfernten Namen; nach dem Tutorial folgen 150 Level; kein Name beginnt wie ein alter Speicherschlüssel („II:“).
    Anders als `NAMES` muss die Liste für den Austausch nicht nachgeführt werden: Der Name eines ersetzten Levels kommt
    auf die Liste der entfernten Namen, der neue ist frei. Eindeutig und ohne entfernten Namen prüfte der Test schon.
  - **Ersatz für `oddFilters`:** „Kein Filter gibt in der Lösung eine fremde Farbe ab“, mit derselben Regel (die
    eintreffende Farbe mit einem weissen Filter an seiner Stelle) über alle 159 Level, dazu eine Gegenprobe (Cyan durch
    einen Gelbfilter als Grün). Der Generator hat dieselbe Regel in `wirkungslos`; für die Level im Spiel steht sie
    jetzt hier.
- `tests/golden.mjs` und `tests/golden.json`: siehe unten.
- README (Level-Werkzeuge, `bench.mjs`, `show.mjs`, Tests, Mischziele, Eichung, Namen der Level) und PLAN.md (2.2,
  2.3, 3.5, Erledigt, Befehle) nachgeführt; im Kopf von LEVELS (index.html) der Hinweis, dass die Kommentare je Level
  aus den Werkzeugen bis Ticket 21 stammen.

**Golden-Referenz** (Hinweis aus Ticket 15): Die Einträge mit `score` bestimmten, für welche Level der normale Lauf den
Löser vergleicht. Neue Regel: eine Stichprobe nach dem Platz im Spiel, das Tutorial und jedes 10. Level danach (Platz
1, 11, …, 141, 24 Level). Die Referenz hat die Löserdaten aller 159 Level, also passt sie auch nach einem Umordnen;
der Test prüft das selbst (Löserdaten für jedes Level, kein `score` mehr). Geschrieben mit `--write` und nach Namen
mit der alten Referenz verglichen: alle 159 Einträge gleich bis auf `score` (Strahlbilder und Löser Wert für Wert);
233 Kommazahlen weichen um höchstens 1,8e-15 ab (Rundungsreste, Toleranz 1e-9). Die Einträge stehen jetzt in der
Reihenfolge im Spiel. Die Begründung steht im Commit. Der normale Lauf braucht 1,3 statt 4,7 s.

**Beleg „keine eigene Formel“** (Stand des Branchs):
- `git grep -n -E "metrics|\bscore\b|oddFilters|PROFILES|\bNAMES\b|quality\.mjs|profiles\.mjs|harden|generate\.mjs|curate|pools\.mjs|selection\.jsonl|candidates\.jsonl|interplay|density\(|passes\(" -- tools tests index.html sw.js ':!tools/blender' ':!tests/golden.json'`
  findet nur Kommentare zur Herkunft (in `golden.mjs`, `levelliste.test.mjs`, `logic.test.mjs`, `bench.mjs`,
  `eiche-schwierigkeit.mjs`, `solver.mjs`, `generator/schritte.mjs`, `generator/zufall.mjs`,
  `beurteilung/kernideen/lockvogel.mjs` und drei Tests der Beurteilung), die Prüfung „kein `score` mehr“ im
  Golden-Test und `score` in der Schwarmsimulation der Fische (index.html, ohne Bezug zu Leveln).
- `git grep -n -E "Math\.log2|Wertung" -- tools tests ':!tools/blender' ':!tools/beurteilung' ':!tests/golden.json'`
  findet nur Kommentare und die Meldung des Golden-Tests.
- Schwierigkeit, Spielwert und Grad (`schwierigkeit.wert`, `spielwert.wert`, `gradVon`) lesen ausserhalb von
  `tools/beurteilung/` nur Werkzeuge und Tests, die `beurteile` bzw. `beurteileAlle` aufrufen oder die Beurteilung des
  Generators weiterreichen: `bench.mjs`, `eiche-schwierigkeit.mjs`, `eiche-spielwert.mjs`, `generator/index.mjs`,
  `generiere.mjs`, `levelliste.mjs`, `ordne-level.mjs`, `show.mjs` und die Tests von Beurteilung, Generator und
  Levelliste. Die vorläufigen Grade nach Platz in `ki-tester/protocol.mjs` gelten nur für Einträge von Ablauf 1.

**Tests** (alle grün, über `leise.sh` mit 65 %, Laufzeit je Lauf):

| Test | vorher | nachher | Laufzeit nachher |
|---|---|---|---:|
| `golden.mjs --schnell` | – | grün | 0 s |
| `golden.mjs` | grün | grün | 2 s (vorher 5 s) |
| `golden.mjs --voll` | grün | grün | 23 s |
| `logic.test.mjs` | 553 | 548 | 26 s |
| `ki-tester.test.mjs` | 62 | 62 | 1 s |
| `beurteilung.test.mjs` | 177 | 177 | 73 s |
| `levelliste.test.mjs` | 28 | 30 | 54 s |
| `generator.test.mjs` | 25 | 25 | 62 s |
| `offline.mjs`, auch `--redirect` | – | grün | je 80 s |

Vorher heisst: dieselben Tests auf `6e98bb1` vor dem Umbau, in derselben Sitzung (golden 5 s, `--voll` 25 s, logic
26 s, beurteilung 72 s, levelliste 52 s, generator 62 s). `offline.mjs` lief versehentlich ohne `leise.sh`.

**Abweichungen:**
- Fund 2 aus dem Review von Ticket 20 ist nicht eingebaut, sondern gestrichen und an Ticket 28 übergeben (siehe oben).
- Die Kommentare der 150 Level in LEVELS („// Wertung 9.8 · … · Profil 1-prisma, Seed 149“) bleiben stehen: Sie
  nennen die Herkunft und rechnen nichts. Alle 150 Blöcke umzuschreiben, kollidierte mit dem Austausch in 23–26, der
  die Blöcke mit `ordne-level.mjs --schreiben` umstellt. Der Kopf von LEVELS sagt jetzt, woher sie stammen.
- Kommentare zur Herkunft in `tools/generator/schritte.mjs` und `zufall.mjs` („aus dem alten Generator
  (generate.mjs)“, „der in Ticket 21 wegfällt“) und in `tools/beurteilung/kernideen/lockvogel.mjs` („übernommen aus
  quality.mjs“) sind unverändert: `tools/generator/` baut gerade Ticket 28 um, und als Herkunft stimmen sie.
- Neu prüft der Test der Levelliste die Zahl von 150 Leveln ausdrücklich (vorher steckte sie in `NAMES`). Ändert
  sich die Zahl einmal (Spec: änderbar), wird sie dort angepasst.

**Hinweise für die Folgetickets:**
- **22 (Würfel-Generator):** Auf `feature/3d-wuerfel` brauchen `tests/golden.mjs` (`metrics`, `score`),
  `tests/logic.test.mjs` (`NAMES`, `PROFILES`, `metrics`, `oddFilters`) und `tools/bench.mjs` (`GENERATORS.alt`)
  noch die alten Werkzeuge. Beim Übernehmen von main die Fassungen von main nehmen und die entfernten Dateien mit
  entfernen. Weicht `golden.json` dort von main ab, mit `--write` neu schreiben, nachdem der Vergleich nach Namen bis
  auf `score` gleich ist (wie hier).
- **23–26 (Austausch):**
  - Golden-Test: Ein neues Level meldet er als „neu (nicht in golden.json)“, ein entferntes als „fehlt jetzt“. Nach
    dem Austausch `node tests/golden.mjs --write` (bewusste Änderung der Level), vorher prüfen, dass nur die
    ausgetauschten Level abweichen. Die Stichprobe richtet sich nach dem Platz, sie wandert also mit.
  - Namen: Der Name eines ersetzten Levels muss auf `entfernteNamen` in `tools/levelliste.json`, sonst wird „Kein
    Level wird umbenannt“ rot; nach dem Tutorial bleiben es 150 Level. `profiles.mjs` muss nicht mehr nachgeführt
    werden.
  - `curate.mjs` gibt es nicht mehr. Ein Ersatzlevel kommt als Block von „  {“ bis „  },“ zwischen die Markierungen
    LEVELS:BEGIN/END, von Hand oder mit einem kleinen Skript; `ordne-level.mjs --schreiben` ordnet nur vorhandene
    Blöcke und erwartet so viele wie die heutige Reihenfolge (`inHeutigerReihenfolge` wirft, sobald eines fehlt). Das
    Format der Blöcke schrieb `levelCode` in `curate.mjs` (Verlauf `6e98bb1`): Kommentar „Lösung: …“, Elemente nach
    Typ, dann Zelle sortiert, `solution`. Die Herkunft eines neuen Levels ohne „Wertung“ angeben, etwa „Generator
    mittel-mischziel, Seed 5 · Schwierigkeit 53,6 · Spielwert 77,6“.
  - `show.mjs` zeigt die Kandidaten aus `generiere.mjs` mit ihrer Beurteilung; `show.mjs --level <Name>
    --beurteilen` zeigt ein Level im Spiel samt Beurteilung.
  - Ein neues Level darf keinen Filter mit fremder Farbe haben (Test der Levelliste); der Generator setzt keinen.
- **28 (Kernideen ab „mittel“):** Fund 2 aus dem Review von Ticket 20 gehört jetzt dorthin. `tools/generator/` und
  `tests/generator.test.mjs` sind hier unverändert. `bench.mjs` misst ohne Angabe mit `--generator neu --accept
  beurteilung`; die ausdrücklichen Optionen gelten weiter. Ohne Gruppe misst es alle 28 Aufträge, mit den
  Standardwerten (60 000 Seeds) ab „mittel“ viele CPU-Stunden; also Gruppen und `--seeds` angeben.
