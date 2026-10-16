# 12: Schwierigkeit geeicht

**What to build:** Die Beurteilung liefert die Schwierigkeit als Zahl mit Teilwerten. Sie misst vor allem die
Denkarbeit und bildet die heutige Reihenfolge nach (ADR 0001), geprüft an Leveln, an denen nicht geeicht wurde.

**Spec:** ../spec.md, Abschnitt „Beurteilung“ (Schwierigkeit).

**Blocked by:** 09 (Spielermodell und Probieren), 10 (Kernideen I), 11 (Kernideen II)

**Status:** resolved

- [x] Die Schwierigkeit besteht aus Teilwerten: Denkarbeit aus dem Spielermodell, Farblogik und Kernideen. Die Grösse
      (drehbare Elemente) geht nur mit kleinem, nach oben begrenztem Anteil ein. Dieser Anteil ist ausgewiesen.
- [x] Die Gewichte werden nur an jedem zweiten der 150 Level eingestellt. Die Auswahl ist fest, zum Beispiel alle
      geraden Plätze. Alle 150 zählen gleich.
- [x] Ein Test prüft die Rangkorrelation mit der heutigen Reihenfolge an den übrigen Leveln: mindestens 0,85 über alle
      und mindestens 0,5 in jedem 30er-Bereich.
      (Am 16.10.2026 geändert, Entscheide des Nutzers: gekreuzt, auf zwei Stellen gerundet, mindestens 0,85 über alle
      und 0,3 je 30er-Bereich; Spec und ADR 0001 nachgeführt. Erreicht: über alle 0,93, je Bereich knapp in 91–120 mit
      0,296, gerundet 0,30. Siehe `## Comments`.)
- [x] Ein Bericht unter `## Comments` nennt die Werte gesamt und je Bereich sowie die grössten Abweichungen mit altem
      und neuem Platz.

## Comments

**Abschluss 16.10.2026: Abnahme erreicht, knapp.**
- Gekreuzt (die Abnahme nach den Entscheiden des Nutzers), auf zwei Stellen gerundet wie beim Knäuel: über alle 0,93
  (verlangt 0,85); je Bereich 0,85 / 0,30 / 0,38 / 0,30 / 0,52 (verlangt je 0,3). Ungerundet sind es 0,850 / 0,301 /
  0,382 / **0,296** / 0,521: 91–120 liegt 0,004 unter 0,3 und gilt gerundet als erreicht. Der Abstand ist knapp; schon
  kleine Änderungen an Leveln oder Gewichten können ihn kippen.
- Bisheriges Mass, an den 75 ungeraden Plätzen: über alle 0,93; je Bereich 0,81 / 0,58 / 0,33 / 0,43 / 0,76. Es
  verfehlt 0,5 in 61–90 und 91–120; darum gilt nach dem Entscheid des Nutzers das gekreuzte Mass.
- Die Abnahme ist ein normaler Test und grün; er zeigt das bisherige Mass weiter an.
- Anteile im Mittel: Denkarbeit 56,9 %, Zusammenspiel 7,0 %, Weglänge 25,0 %, Grösse 11,1 %.
- Die Durchgänge, nach Entscheiden des Nutzers:
  1. Spielermodell, Farblogik, Kernideen und Grösse. Ungerade Plätze: 0,90 | 0,79 0,49 0,06 0,28 0,56.
  2. „Erst verbessern, dann anpassen“: der Teilwert Weglänge und das gekreuzte Mass je Bereich. Frei geeicht trug die
     Weglänge 45 % des Werts.
  3. Die Weglänge begrenzt: im Mittel höchstens ein Viertel, bei keinem Level mehr als ein Drittel; Spielermodell,
     Farblogik und Kernideen tragen als Denkarbeit im Mittel mindestens die Hälfte.
  4. Nach dem Zusammenführen von Ticket 13: das Zusammenspiel aus dem Spielwert als weiterer Teilwert. Danach der
     Entscheid über die Abnahme: Das bisherige Mass erreicht 0,5 nicht in allen Bereichen, also gilt das gekreuzte mit
     0,3. Spec (User Stories 26 und 27, „Beurteilung“, Tests) und ADR 0001 sind angepasst, mit Begründung und den
     Zahlen beider Masse.
  5. Die Abnahme wird auf zwei Stellen gerundet, wie beim Knäuel (Entscheid des Nutzers). Festgehalten in der Spec
     („Beurteilung“, Tests und „Weitere Hinweise“ bei den Auslegungen) und in ADR 0001.

**Aufbau** (`tools/beurteilung/`, README unter „Beurteilung“):
- `schwierigkeit.mjs`: Teil `schwierigkeit`, teuer, eine Zeile in `regeln.mjs` unter der Kommentarzeile von Ticket 12.
  - Ausgabe `{ wert, teilwerte }`, `wert` ist die Summe der vier Teilwerte:
    - `denkarbeit { wert, anteil, spielermodell, farblogik, kernideen }`, die drei Teile je mit `wert` und Messwerten;
    - `zusammenspiel { wert, anteil, jeElement, stellen }`;
    - `weglaenge { wert, anteil, abschnitte }`;
    - `groesse { wert, anteil, drehbar }`.
  - Der Name „Denkarbeit“ folgt der Spec: „vor allem aus Denkarbeit: dem Spielermodell, der Farblogik und den
    Kernideen“.
  - `bewerte(messwerte, gewichte)` rechnet Wert und Teilwerte, für die Beurteilung und die Eichung gleich.
  - `MESSWERTE` nennt die geeichten Messwerte je Teil, `GRENZEN` die Grenzen der Anteile, `GROESSE` die der Grösse.
- `schwierigkeit-eichung.mjs`: Eichen mit Nebenbedingungen (`eiche`), Anteile (`anteile`), Prüfen (`jeBereich`) und
  das gekreuzte Mass (`gekreuzt`), gemeinsam für Skript und Test.
- `schwierigkeit-gewichte.json`: die Gewichte, versioniert. `tools/eiche-schwierigkeit.mjs` schreibt die Datei neu.
- Erweitert, rückwärtsverträglich:
  - `feldform.mjs`: `drehungen(level)`, das Level in den vier Vierteldrehungen um die Drehachse; neben `durchlauf` aus
    Ticket 13;
  - `spielermodell.mjs`: `spielermodellJeDrehung(ctx)`. Die erste Drehung ist `spielermodell(ctx)`, unverändert;
  - `spielwert.mjs`: `zusammenspiel(ctx)` und `zusammenspielStellen(ctx)` exportiert und über `ctx.merke` gerechnet.
    Der Spielwert ist unverändert, `tests/beurteilung/spielwert.test.mjs` grün.

**Teilwerte und Gewichte**, eingestellt an den geraden Plätzen (zum Vergleich die früheren Durchgänge):

| Teilwert | Teil | Messwert | heute | 3. ohne Zusammenspiel | 2. Weglänge frei | 1. ohne Weglänge |
|---|---|---|---|---|---|---|
| Denkarbeit | Spielermodell | Rückschlüsse: drehbare Elemente, die es mit vollem Überblick rückwärts entscheidet | **3,122** | 3,469 | 2,201 | 4,483 |
| | | Fallunterscheidungen mit Horizont 2 und mit vollem Überblick (k2 + kInf) | **0,646** | 0,659 | 0,569 | 0,731 |
| | | längste Kette mit vollem Überblick | **0,264** | 0,211 | 0,130 | 0,276 |
| | | Stillstand: Horizont 2 steckt (0 oder 1) | **6,001** | 3,823 | 5,833 | 2,215 |
| | Farblogik | Farboperationen: Mischziele, nötige Filter, nötige zerlegende Prismen | **3,376** | 3,686 | 3,254 | 4,032 |
| | Kernideen | Zahl der nötigen Kernideen (Funde) | **1,710** | 2,423 | 1,823 | 2,903 |
| Zusammenspiel | | Stellen des Zusammenspiels je drehbares Element, höchstens 1 (wie im Spielwert) | **6,560** | – | – | – |
| Weglänge | | gerade Strahlabschnitte in der Lösungsstellung | **0,872** | 0,717 | 1,615 | – |
| Grösse | | 10 × min(drehbare Elemente, 12) / 12, höchstens 10 Punkte | fest | fest | fest | fest |

**Anteile am Wert** auf den 150 (im Mittel; wenigstens bis höchstens je Level):

| Teilwert | Anteil | Punkte im Mittel |
|---|---|---|
| Denkarbeit | **56,9 %** (38,9–71,4 %) | 32,0: Spielermodell 23,1, Farblogik 7,4, Kernideen 1,4 |
| Zusammenspiel | **7,0 %** (0–20,4 %) | 3,6 |
| Weglänge | **25,0 %** (17,6–32,6 %) | 13,6 |
| Grösse | **11,1 %** (6,9–13,9 %) | 6,0 |

- Die Werte reichen von 19,8 bis 99,2. Im Mittel je Grad nach heutigem Platz: leicht 34, mittel 51, schwer 70, sehr
  schwer 91.
- Bindend ist heute der Mittelwert der Weglänge (25,0 %); die Denkarbeit liegt mit 56,9 % über der Hälfte.
- Ein Test prüft das auf den 150: Denkarbeit im Mittel mindestens 50 %, Weglänge im Mittel höchstens 25 % und bei
  keinem Level mehr als ein Drittel, Grösse höchstens 10 Punkte und ein Fünftel.

**Zusammenspiel** (Teilwert `zusammenspiel`, Messwerte `jeElement` und `stellen`):
- Derselbe Teilwert wie im Spielwert, ohne doppelten Code: `zusammenspiel(ctx)` aus `spielwert.mjs`, über `ctx.merke`
  einmal je Beurteilung. Stellen sind Elemente, die mehrere Strahlen nutzen, gemeinsame Mischziele und Kreuzungen; der
  Teilwert ist ihre Zahl je drehbares Element, höchstens 1.
- Ein eigener Teilwert neben der Denkarbeit, weil die Spec die Denkarbeit aus Spielermodell, Farblogik und Kernideen
  bildet; so bleibt die Grenze „Denkarbeit mindestens die Hälfte“ an diesen drei.
- Verglichen mit der blossen Zahl der Stellen:

| Zusammenspiel als | bisher, ungerade Plätze | gekreuzt |
|---|---|---|
| (keines) | 0,92 \| 0,80 0,55 0,21 0,35 0,64 | 0,92 \| 0,84 0,24 0,34 0,31 0,55 |
| **je drehbares Element (wie im Spielwert)** | **0,93 \| 0,81 0,58 0,33 0,43 0,76** | **0,93 \| 0,85 0,30 0,38 0,30 0,52** |
| Zahl der Stellen | 0,93 \| 0,80 0,54 0,28 0,43 0,78 | 0,93 \| 0,85 0,42 0,29 0,27 0,54 |

- Gewinn gegenüber Durchgang 3:
  - bisher: 31–60 +0,03, 61–90 +0,12, 91–120 +0,08, 121–150 +0,12;
  - gekreuzt: 31–60 +0,06, 61–90 +0,04, 91–120 −0,01, 121–150 −0,03.
- Das Zusammenspiel hebt 31–60 gekreuzt über 0,3 und senkt 91–120 von 0,31 auf 0,296, gerundet 0,30.

**Weglänge** (Teilwert `weglaenge`, Messwert `abschnitte`):
- **Mass:** die Zahl der geraden Strahlabschnitte in der Lösungsstellung, auf den 150 zwischen 6 und 28.
- **Begründung:** Jeden Abschnitt verfolgt der Spieler, um zu sehen, wohin das Licht geht. Das gilt auch für Licht, das
  ins Leere läuft, denn auch es könnte ein Ziel falsch treffen. Gezählt wird in Abschnitten, nicht nach Länge: Ein
  langer gerader Strahl ist nicht schwerer als ein kurzer.
- Über alle 150 folgt die Zahl der Abschnitte der Grösse (Rangkorrelation 0,86), in 31–100 nur zu 0,30. Sie ist eher
  Weg als Denken; darum die Grenze.
- **Die Grenzen als Nebenbedingung der Eichung** (`eiche` in `schwierigkeit-eichung.mjs`):
  - Hält die freie Lösung die Grenzen nicht ein, bleibt das Gewicht der Weglänge fest, und die übrigen werden darauf
    geeicht. Das grösste Gewicht, das die Grenzen einhält, sucht eine Bisektion; mit ihm wächst der Anteil der
    Weglänge, und der der Denkarbeit sinkt.
  - Geprüft wird an allen 150 Leveln, denn die Anteile hängen nur von den Messwerten ab, nicht von der Reihenfolge;
    die Gewichte kommen weiter nur aus den geraden Plätzen.
  - Die Regel bleibt Gewicht mal Messwert, und die Grenzen gelten nach jedem neuen Eichen von selbst.
  - Verworfen: eine feste oder gedeckelte Form wie bei der Grösse. Ein festes Gewicht wäre nicht geeicht. Ein Deckel
    auf die Zahl der Abschnitte hielte den Anteil im Mittel nicht ein und machte lange Wege oben gleich.
  - Für ein neues Level gelten die Grenzen nicht von selbst; dort zeigen die `anteil` der Teilwerte, wo es steht.
- **Verglichene Masse** im zweiten Durchgang, je frei zu den ersten sechs Messwerten dazu (über alle | je Bereich):

| Weglänge als | bisher, ungerade Plätze | gekreuzt |
|---|---|---|
| (keine) | 0,90 \| 0,79 0,49 0,06 0,28 0,56 | 0,90 \| 0,83 0,20 0,26 0,21 0,46 |
| **gerade Abschnitte** | **0,92 \| 0,80 0,61 0,39 0,42 0,73** | **0,93 \| 0,83 0,21 0,39 0,39 0,68** |
| Abschnitte ohne Auslaufen über die Feldkante | 0,92 \| 0,81 0,66 0,16 0,40 0,77 | 0,92 \| 0,84 0,26 0,32 0,33 0,66 |
| Umlenkungen (Spiegel, Prismen, Kombinatoren) | 0,92 \| 0,79 0,53 0,32 0,36 0,77 | 0,92 \| 0,82 0,16 0,40 0,34 0,65 |
| Reflexionen | 0,91 \| 0,78 0,52 0,12 0,28 0,58 | 0,90 \| 0,80 0,18 0,28 0,24 0,56 |
| Länge in Feldern | 0,92 \| 0,83 0,41 0,36 0,29 0,55 | 0,91 \| 0,87 0,26 0,47 0,28 0,46 |
| drehbare Elemente auf den Wegen zu den Zielen, Summe | 0,90 \| 0,81 0,46 0,12 0,26 0,56 | 0,90 \| 0,82 0,23 0,25 0,25 0,53 |
| dasselbe, längster Weg | 0,90 \| 0,78 0,44 0,13 0,24 0,54 | 0,90 \| 0,81 0,17 0,29 0,20 0,51 |
| dasselbe, verschiedene Elemente | 0,90 \| 0,81 0,49 0,02 0,30 0,50 | 0,91 \| 0,83 0,28 0,20 0,33 0,52 |

**Weitere Masse der Teilwerte:**
- **Rückschlüsse** statt der Zahl aller Folgerungen:
  - Die Zahl aller Folgerungen zählt jede gestrichene Stellung. Ohne Fallunterscheidung ist das je drehbares Element
    die Zahl seiner Stellungen minus eins, also nur die Grösse; ein Prisma mit 7 wöge mehr als zwei Spiegel mit je 3.
  - Was sicheres Licht vorwärts zeigt, sieht der Spieler und zählt nicht. Das kommt auf den 150 selten vor (7 Level in
    der Lage der Leveldaten), etwa in 37 Knotenpunkt: 6,5 Rückschlüsse bei 7 drehbaren Elementen.
- **Farblogik:** Gezählt werden die Farboperationen, die die Lösung braucht:
  - Mischen: jedes Mischziel nach dem Glossar;
  - Filtern: jeder Filter, ohne dessen Wirkung ein Ziel seine Farbe verliert (Gegenprobe mit einem weissen Filter an
    seiner Stelle);
  - Zerlegen: jedes Prisma, das in der Lösung Licht aus mindestens zwei Grundfarben bricht und ohne das ein Ziel seine
    Farbe verliert (Blocker an seiner Stelle). Auf den 150 wirkt jedes zerlegende Prisma.
  - Begründung: Das ist das Glossar wörtlich (Mischen, Filtern oder Zerlegen ist nötig), und jede Operation will für
    sich durchdacht sein.
  - Verglichen im ersten Durchgang, in einer Kreuzprobe innerhalb der geraden Plätze (zwei Hälften, je an der einen
    eingestellt und an der anderen geprüft): Die Zahl der Operationen folgte der Reihenfolge besser als die Zahl der
    Ziele mit Farblogik (eines, dessen Farbe keine gleichfarbige Quelle allein liefert) oder die Zahl der Arten (0–3).
    Die Summe aus „über alle“ und dem Mittel der Bereiche war 1,42 gegen 1,35 bzw. 1,28.
  - Die Farblogik des Spielwerts (Anteil der Ziele) ist ein anderes Mass. Ihn fragt der Spielwert, ob es Farblogik
    gibt; die Schwierigkeit fragt, wie viel davon.
- **Kernideen:** die Funde, also `kernideen.length`. In derselben Kreuzprobe gleich gut wie die Zahl der Arten (1,42
  gegen 1,39).
- **Grösse:** fest begrenzt, nicht geeicht. Frei geeicht hätte sie im ersten Durchgang 77–91 % des Werts getragen,
  und die übrigen Teilwerte wären fast auf null gefallen. Die heutige Reihenfolge folgt in grossen Zügen der Grösse.

**Robust: das Spielermodell über die vier Drehungen gemittelt** (Entscheid bei der Umsetzung, nach dem Hinweis aus
Ticket 09):
- Befund wie im Review von Ticket 09: Um 180° gedreht haben 28 der 150 Level andere Werte (k2, kInf, Kette), über die
  vier Drehungen 31. Die Rückschlüsse ändern sich in 31 Leveln.
- Mit der festen Reihenfolge allein ändert sich der Wert von 49 Leveln, wenn man sie dreht, mit den heutigen Gewichten
  um bis zu 8,4 Punkte. Der Platz unter den 150 schwankt um bis zu 21 Plätze, bei 20 Leveln um mindestens 10, so in 84
  Spiegeltreppe, 60 Feuerwerk und 63 Glitzer. Ein Rückschluss mehr oder weniger macht 3,1 Punkte, und in der Mitte
  liegen viele Level nah beisammen.
- Das Mittel über die vier Drehungen hängt nicht davon ab, wie das Level gedreht ist. Ein Test prüft das an 21
  Querschläger und am Kandidaten 8004 je eine und zwei Vierteldrehungen weit. Die Teilwerte zum Schliessen ändern sich
  dabei.
- Kosten: das Spielermodell auf drei weiteren Leveln, auf den 150 zusammen rund 3 s.
- Gedreht wird das Level, nicht nur die Reihenfolge der Zellen. Das Modell zählt auch die Stellungen eines Elements in
  fester Reihenfolge; mit umsortierten Zellen allein glichen 29 der 150 gedrehten Level nicht dem Original.
- Spiegelbilder nicht: Ein Prisma bricht Rot und Blau zu verschiedenen Seiten, gespiegelt ist es ein anderes Rätsel.
- Das Spielermodell selbst und Schliessen bleiben unverändert. Die Schwellen beim Raten (Ticket 09) gelten für die
  feste Reihenfolge.

**Eichung** (`sh tools/leise.sh node tools/eiche-schwierigkeit.mjs [--bericht]`, Verfahren in
`schwierigkeit-eichung.mjs`):
- Eingestellt an den 75 geraden Plätzen, jedes Level gleich: nichtnegative kleinste Quadrate des heutigen Platzes auf
  die acht Messwerte, mit den Nebenbedingungen für Weglänge und Denkarbeit.
  - Kein Teilwert senkt die Schwierigkeit.
  - Skala: Ohne die Grösse hat das schwerste der 150 Level 90 Punkte.
- Ein Test prüft, dass die versionierten Gewichte genau die einer Eichung an den geraden Plätzen sind und dass die
  vertauschte Reihenfolge der ungeraden sie nicht ändert.
- Verworfen: die Rangkorrelation direkt optimieren, über alle plus Mittel der Bereiche. Die Gewichte sprangen zwischen
  Startpunkten, oft fiel die Farblogik auf null. In der Kreuzprobe war es nicht besser.
- Gekreuzt, an den ungeraden geeicht (mit denselben Nebenbedingungen): Rückschlüsse 3,459, Fallunterscheidungen 0,777,
  Kette 0,054, Stillstand 5,832, Farblogik 1,586, Kernideen 1,087, Zusammenspiel 12,448, Weglänge 0,902. Die Hälften
  gewichten Farblogik und Zusammenspiel recht verschieden.

**Rangkorrelation mit der heutigen Reihenfolge:**

| | über alle | 1–30 | 31–60 | 61–90 | 91–120 | 121–150 |
|---|---|---|---|---|---|---|
| **gekreuzt:** alle 30 je Bereich (Abnahme, auf zwei Stellen 0,85 / 0,3) | **0,93** | 0,850 | 0,301 | 0,382 | **0,296** (0,30) | 0,521 |
| **bisher:** ungerade Plätze (früher verlangt 0,85 / 0,5) | **0,93** | 0,81 | 0,58 | 0,33 | 0,43 | 0,76 |
| gerade Plätze (geeicht) | 0,94 | 0,94 | 0,04 | 0,43 | 0,50 | 0,57 |
| alle 150 | 0,94 | 0,87 | 0,39 | 0,37 | 0,42 | 0,65 |
| 3. ohne Zusammenspiel, gekreuzt | 0,92 | 0,84 | 0,24 | 0,34 | 0,31 | 0,55 |
| 3. ohne Zusammenspiel, bisher | 0,92 | 0,80 | 0,55 | 0,21 | 0,35 | 0,64 |
| 2. Weglänge frei, gekreuzt | 0,93 | 0,83 | 0,21 | 0,39 | 0,39 | 0,68 |
| 2. Weglänge frei, bisher | 0,92 | 0,80 | 0,61 | 0,39 | 0,42 | 0,73 |
| 1. ohne Weglänge, gekreuzt | 0,90 | 0,83 | 0,20 | 0,26 | 0,21 | 0,46 |
| 1. ohne Weglänge, bisher | 0,90 | 0,79 | 0,49 | 0,06 | 0,28 | 0,56 |
| alte Wertung, ungerade Plätze | 0,87 | 0,86 | 0,23 | −0,31 | 0,88 | 0,50 |
| alte Wertung, alle 150 (ungeeicht, also auch gekreuzt) | 0,88 | 0,83 | 0,07 | 0,08 | 0,79 | 0,42 |

- Gegenüber der alten Wertung (`score` aus `metrics`) ist die neue über alle und in 31–60, 61–90 und 121–150 besser,
  in 1–30 gleich und in 91–120 schwächer (bisher 0,43 statt 0,88). In 91–120 trägt bei der alten Wertung der
  Suchaufwand des Lösers (log der Knoten, allein 0,87).
- 31–60: Die geraden Plätze dieses Bereichs folgen der Reihenfolge schon mit den eigenen Gewichten nicht (0,04).

**Grösste Abweichungen** (alter Platz → neuer Platz unter den 150, nach dem Wert der neuen Schwierigkeit):

| Level | alt | neu | Hälfte | Wert |
|---|---|---|---|---|
| Weichen | 17 | 63 | ungerade | 50,3 |
| Kreuzfeuer | 51 | 91 | ungerade | 55,5 |
| Lichtnetz | 74 | 35 | gerade | 44,2 |
| Chamäleon | 100 | 61 | gerade | 50,3 |
| Rubin | 72 | 36 | gerade | 44,3 |
| Schimmer | 50 | 85 | gerade | 54,4 |
| Farbnebel | 81 | 116 | ungerade | 61,6 |
| Laterne | 86 | 51,5 | gerade | 47,9 |
| Lichtharfe | 42 | 74 | gerade | 51,3 |
| Mosaik | 77 | 109 | ungerade | 59,3 |
| Sonnenwende | 109 | 77 | ungerade | 52,1 |
| Spiegelachse | 45 | 76 | ungerade | 52,1 |

- Nach hinten rutschen frühe Level, in denen fast jedes der 7 drehbaren Elemente ein Rückschluss ist, mit mehreren
  Farboperationen (17 Weichen, 50 Schimmer, 51 Kreuzfeuer) oder viel Zusammenspiel (81 Farbnebel und 77 Mosaik mit je
  7 Stellen, 42 Lichtharfe mit 6 bei 5 drehbaren Elementen).
- Nach vorn rutschen späte Level ohne nötige Kernidee und mit wenig Farblogik (72 Rubin, 86 Laterne, 100 Chamäleon, 109
  Sonnenwende) oder mit wenig Weg (74 Lichtnetz, 11 Abschnitte).
- Nach Spec gehen Abweichungen über 10 Plätze an die KI-Tester (Ticket 16). Das wären heute 52 der 150 Level.

**Vergleich mit dem Spielwert** (offen aus Ticket 13): Rangkorrelation von Spielwert und Schwierigkeit an den 150
Leveln:

| alle 150 | leicht (1–30) | mittel (31–100) | schwer (101–140) | sehr schwer (141–150) |
|---|---|---|---|---|
| 0,65 | 0,31 | 0,71 | 0,36 | 0,48 |

- Grade nach heutigem Platz. Über alle hängen beide deutlich zusammen. Beide zählen nötige Kernideen, Farblogik (je
  anders gemessen) und das Zusammenspiel (gleich gemessen). Gegenläufig sind die Fallunterscheidungen: Sie heben die
  Schwierigkeit und senken beim Spielwert das Schliessen. Welcher Teil wie viel ausmacht, ist nicht gemessen.
- Ob 0,71 in „mittel“ zu eng ist, damit der Spielwert unabhängig von der Schwierigkeit misst (Glossar), ist für
  Ticket 15 zu prüfen.

**Warum es je Bereich nur knapp reicht:**
- In 31–100 haben 59 der 70 Level genau 7 drehbare Elemente. 52 davon lösen sich in jeder Drehung ohne
  Fallunterscheidung; dort sieht das Spielermodell kaum Unterschiede. Kernideen, Farboperationen, Abschnitte und
  Zusammenspiel folgen der Reihenfolge dort nur mässig.
- Mit 15 Leveln je Bereich und Hälfte schwankt die Rangkorrelation zufällig um etwa ±0,27, das gekreuzte Mass mit 30
  Leveln um etwa ±0,19. Der Abstand von 0,296 zu 0,3 liegt weit darin.
- Auch die alte Wertung verfehlt 31–60 und 61–90 (0,23 und −0,31). Die KI-Tester waren sich bisher zu 0,02–0,27 einig.
  Die heutige Reihenfolge in der Mitte stammt aus mehreren Reviews mit eingeschobenen Leveln (PLAN 2.22 und 2.24).
- In 91–120 folgt der Suchaufwand des Lösers der Reihenfolge, die Messwerte des Spielermodells kaum.

**Tests** (testgetrieben, nur über `beurteile` und die Eichung):
- `tests/beurteilung/schwierigkeit.test.mjs`, 20 Tests (einer aus dem Review), darunter die Abnahme je Bereich mit
  beiden Massen:
  - Form: vier Teilwerte mit Anteil, die Denkarbeit aus Spielermodell, Farblogik und Kernideen, Summen, Messwerte;
    ohne `teuer` offen.
  - Spielermodell: ein Rückschluss; Fallunterscheidungen und Kette an den Leveln aus `probieren-level.mjs`; gedreht
    dieselbe Schwierigkeit, mit Gegenprobe am Schliessen.
  - Farblogik: Mischen, Filtern und Zerlegen, je nötig und wirkungslos.
  - Kernideen: Zahl der nötigen.
  - Zusammenspiel: ein gemeinsames Mischziel ist eine Stelle, derselbe Teilwert wie im Spielwert; allein keine.
  - Weglänge: zwei Abschnitte über einen Spiegel, drei über zwei.
  - Auf den 150:
    - Stillstand genau bei 116, 138, 139, 140, 147 und 150;
    - Rückschlüsse in 37;
    - Kernideen, Mischziele und Zusammenspiel wie in der Beurteilung und im Spielwert;
    - Grösse höchstens 10 Punkte und ein Fünftel;
    - Anteile: Denkarbeit im Mittel mindestens die Hälfte, Weglänge höchstens ein Viertel und bei keinem Level ein
      Drittel.
  - Eichung: Die versionierten Gewichte sind die der geraden Plätze; die vertauschte Reihenfolge der ungeraden ändert
    sie nicht.
  - Gekreuzt (Review): Tauscht man je zwei benachbarte Plätze einer Hälfte, bleiben ihre Werte, die der anderen
    ändern sich. Ein gekreuztes Mass, das jede Hälfte mit ihren eigenen Gewichten vorhersagt, bestünde die Abnahme
    (0,932 | 0,875 0,338 0,371 0,405 0,645) und fiele nur hier auf.
  - Eichprüfung, auf zwei Stellen gerundet: über alle gekreuzt und an den ungeraden Plätzen mindestens 0,85; je
    Bereich gekreuzt mindestens 0,3, dazu die Anzeige des bisherigen Masses.
- `tests/beurteilung/feldform.test.mjs`: Drehungen, an allen 159 Leveln gelöst und viermal gedreht wieder gleich.
- Im ersten Durchgang waren zuerst 12 Tests rot. Die Gegenprobe zur Drehung bestand ohne Regel nur, weil beide Werte
  null waren; seither prüft der Test, dass es einen Wert gibt. Die späteren Tests (Weglänge, Eichung, Anteile,
  Zusammenspiel) entstanden vor dem Code, einen eigenen roten Lauf dafür gab es nicht.
- Sechs verfälschte Regeln, je eine Änderung, fallen alle auf (erster Durchgang):
  - an Mini-Leveln: nur die erste Drehung; Filter ohne Gegenprobe; jedes brechende Prisma zerlegt;
    Fallunterscheidungen nur mit vollem Überblick; ohne Mischen;
  - nur an den 150: Rückschlüsse auch vorwärts (37 Knotenpunkt hätte 7 statt 6,5).
- Laufzeiten über `leise.sh` mit 20 %, nacheinander, alle grün (Rechner unter Last anderer Arbeit):
  - `node tests/beurteilung/schwierigkeit.test.mjs`: 19 Tests, 42 s;
  - `node tests/beurteilung.test.mjs`: 164 Tests, 102 s (vorher unter mehr Last 130–132 s).
- Vor der Rundung, mit dem ungerundeten Mass: `tests/beurteilung/spielwert.test.mjs` 16 Tests in 87 s (der Spielwert
  ist unverändert), `tests/golden.mjs` 4 s, `tests/logic.test.mjs` 558 Tests in 40 s, `tests/ki-tester.test.mjs` 54
  Tests unter 1 s, `tools/eiche-schwierigkeit.mjs --bericht` 89 s (davon rund 25 s für die alte Wertung). Die
  Schwierigkeit kostet im Testlauf gut 10 s: das Spielermodell auf drei weiteren Drehungen der 150 (rund 3 s) und der
  Kandidaten der Eichmenge des Spielwerts (rund 5 s, gemessen: 65 statt 60 s für die 42 Kandidaten), dazu Mini-Level
  und gedrehte Level. Das Eichen im Test (viermal, je mit Bisektion) kostet unter 1 s.

**Abweichungen:**
- Zusammenspiel und Weglänge sind Teilwerte, die das Ticket nicht nennt (Entscheide des Nutzers).
- Die Abnahme ist geändert: gekreuzt, 0,3 je Bereich, auf zwei Stellen gerundet (Entscheide des Nutzers, Spec und ADR
  0001 nachgeführt).
- Gemeinsame Dateien: `feldform.mjs` (`drehungen`), `spielermodell.mjs` (`spielermodellJeDrehung`, am Ende),
  `spielwert.mjs` (Zusammenspiel exportiert), `feldform.test.mjs` (ein Test am Ende), README (ein Unterpunkt und die
  Laufzeit des Testlaufs).

**Hinweise für Ticket 15 und später:**
- Die Grenzen der Anteile gelten beim Eichen für die 150. Ein neues Level kann sie überschreiten, etwa mit mehr als
  einem Drittel Weglänge; seine Anteile stehen in den Teilwerten.
- Der Spielwert hängt in „mittel“ zu 0,71 mit der Schwierigkeit zusammen (siehe oben). Zu prüfen, ob er dort noch
  unabhängig von der Schwierigkeit misst (Glossar).
- 91–120 liegt gekreuzt bei 0,296 und erreicht die Abnahme nur gerundet. Werden Level ersetzt oder neu geeicht, kann
  der Bereich darunter fallen. Kandidaten zum Verbessern: der Suchaufwand des Lösers für 91–120 (misst aber Probieren,
  nicht Folgern) und das Urteil der KI-Tester (Ticket 16).
- Die Schwierigkeit ist teuer (alle Kernideen, Suche ohne Abschneiden). Für den Generator (Ticket 18 ff.) liesse sich
  eine günstige Vorstufe ohne Falle und Lockvogel abspalten; die beiden kommen auf den 150 nur in 16 Leveln vor.
- Die Masse für Farblogik, Kernideen, Weglänge und Zusammenspiel sind auch mit Blick auf Zahlen gewählt, die die
  ungeraden Plätze enthalten: die Erkundung der Einzelmerkmale über alle 150 und die Vergleichstabellen. Die Gewichte
  selbst kommen nur aus den geraden.
- Aus dem Review, gekreuzt nachgerechnet (über alle | je Bereich):
  - Die feste Grösse entscheidet mit: 10 Punkte voll ab 12 bestehen. Mit 9 Punkten (0,928 | 0,851 0,291 0,377 0,292
    0,531) oder 11 (0,929 | 0,850 0,311 0,382 0,293 0,513) fielen Bereiche unter 0,295, mit 12 Punkten oder voll ab
    10 nicht.
  - Die Skala nimmt die Messwerte aller 150. Nur aus der geeichten Hälfte fiele 31–60 auf 0,247 (0,915 | 0,838 0,247
    0,392 0,295 0,610); die Grenzen der Anteile nur an ihr änderten fast nichts.
  - Mit zufällig vertauschten Plätzen liegt das gekreuzte Mass über alle bei 0,05–0,11; meist bricht die Eichung
    dann ab, weil die Denkarbeit auch ohne Weglänge unter der Hälfte bliebe. Auswendig gelernt wird die Reihenfolge
    also nicht, aber die Abnahme liegt in der Mitte im Rauschen.
- Ticket 14: Die Würfel-Feldform braucht auch `drehungen` (wie `durchlauf` aus Ticket 13), sonst fehlt dort die
  Schwierigkeit.
