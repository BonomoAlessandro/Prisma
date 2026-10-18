# 15: Neue Reihenfolge und Grade

**What to build:** Die 150 Level werden mit der Beurteilung neu geordnet und bekommen ihren Schwierigkeitsgrad. Die
Tests der Levelliste prüfen ab jetzt die Regeln der Spec. Level, die eine Regel verletzen, stehen auf der Duldungsliste,
bis sie in Phase 6 ersetzt werden.

**Spec:** ../spec.md, Abschnitte „Levelliste, Reihenfolge und Austausch“, „Schwierigkeitsgrade“ und „Entscheide zu den
Tests“, Nahtstelle 3.

**Blocked by:** 12 (Schwierigkeit geeicht), 13 (Spielwert geeicht)

**Status:** resolved

- [x] Die 150 Level werden nach der Schwierigkeit geordnet. Verschiebungen bis 10 Plätze werden übernommen. Ein Level,
      das weiter wandern würde, bleibt an seinem alten Platz und kommt auf die Prüfliste für Ticket 16.
- [x] Feste Schwellen der vier Grade auf der Schwierigkeit sind festgelegt und begründet. Ausgangspunkt ist die
      vorläufige Aufteilung 30 / 70 / 40 / 10. Entlang der Reihenfolge sinkt der Grad nie.
- [x] Jedes Level nach dem Tutorial trägt in den Leveldaten seinen Grad, eines der vier Wörter. Das Feld ist nach dem
      Glossar benannt und ersetzt die alte Markierung. Bis Ticket 17 zeigt das Spiel weiterhin nur „schwer“ und „sehr
      schwer“ an.
- [x] Die Reihenfolge entsteht aus der Beurteilung und dem Protokoll der KI-Tester. Die von Hand gepflegte Auswahlliste
      wird für die Reihenfolge nicht mehr gebraucht. (Im Protokoll gibt es noch keine Korrekturen; sie kommen mit
      Ticket 16.)
- [x] Auf der Duldungsliste stehen alle Level, die einen Ausschlussgrund haben, und ab „mittel“ alle, die keine nötige
      Kernidee haben oder unter dem Mindest-Spielwert liegen.
- [x] **Haltepunkt:** In zwei Fällen hält das Ticket an, und der Nutzer entscheidet (erreicht nach Stufe A, Entscheide
      des Nutzers vom 16.10.2026 unter `## Comments`):
      - Die Duldungsliste wird deutlich länger als die 37 Level der Neuzählung.
      - Die heutigen Level verletzen eine Regel, die sich nicht über die Duldungsliste abbilden lässt, etwa „Haupt-Kernidee
        höchstens zweimal je 10 Level“.
- [x] Eine leere Liste der entfernten Namen ist angelegt.
- [x] Die neuen Tests der Levelliste ersetzen die Tests zu Markierung, gehärteten Leveln, Härte-Abnahme und
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
- [x] Der Fortschritt der Spieler bleibt erhalten, denn er ist nach Namen gespeichert.

## Comments

**Hinweise aus den Tickets 11 und 13:**
- Ab „mittel“ haben 59 Level keine nötige Kernidee (Ticket 11), und 57 liegen unter dem Mindest-Spielwert 60, 53 davon
  ohne nötige Kernidee (Ticket 13). Die Duldungsliste würde damit deutlich länger als 37: Das ist der Haltepunkt, der
  Nutzer entscheidet.
- Darunter sind Level, die die KI-Tester mögen, etwa 73 Rochade und 89 Uhrwerk. Die KI-Tester sehen Kernideen, wo die
  Erkennung keine findet (39, 14, 51, 102, 73, 89; Ticket 13, „Hinweise“). Vor dem Festlegen der Liste prüfen, ob das
  Glossar zu schärfen oder die Erkennung zu erweitern ist.
- Der Mindest-Spielwert gilt erst ab „mittel“ (Auslegung vom 16.10.2026, Spec „Weitere Hinweise“).

**Zwischenstand Stufe A (16.10.2026): gerechnet bis zum Haltepunkt.** Leveldaten, Tests der Levelliste und Regeln der
Beurteilung sind unverändert. Der Haltepunkt ist erreicht, weil die Duldungsliste 89 statt 37 Level lang würde. Die
Regel „Haupt-Kernidee höchstens zweimal je 10 Level“ verletzen die heutigen Level viermal, aber nur zusammen mit Leveln
der Duldungsliste; ohne diese gezählt ist sie eingehalten. Der Nutzer entscheidet; Optionen und Empfehlung am Schluss.

**Skript** `tools/ordne-level.mjs`:
- Aufruf `sh tools/leise.sh node tools/ordne-level.mjs [--json <datei>]`, 37 s.
- Beurteilt die 150 mit `beurteileAlle`, ordnet sie, legt die Grade fest und prüft die Regeln der Nahtstelle 3.
- `--json` schreibt je Level alten und neuen Platz, Grad nach Schwelle und nach Reihenfolge, Prüfliste und Gründe der
  Duldung; Grundlage für Stufe B.
- Deterministisch: Zwei Läufe gaben dieselbe Datei.

**Kreisschluss:**
- Vom Grad hängen nur Füllteil und Zerfall ab (`ctx.grad`). Schwierigkeit, Spielwert, Kernideen und Haupt-Kernidee
  hängen nicht davon ab. Die Reihenfolge hängt also nicht vom Grad ab, die Ausschlüsse und über „ab mittel“ die
  Duldungsliste schon.
- Das Skript rechnet trotzdem bis zum Fixpunkt: zuerst ohne Grad, dann mit den Graden der Reihenfolge, bis sich
  Schwierigkeit und Grade nicht mehr ändern. Der Fixpunkt ist nach 2 Durchgängen erreicht. Hängt eine spätere Regel
  vom Grad ab, rechnet das Skript weiter oder bricht nach 5 Durchgängen ab.

**Reihenfolge:**
- Platz nach der Formel: nach der Schwierigkeit, bei gleichem Wert in der heutigen Reihenfolge (26 Level in 11 Gruppen
  mit genau gleichem Wert). Ticket 12 zählte mit mittleren Rängen 52 Abweichungen über 10 Plätze. Mit fester
  Reihenfolge bei gleichem Wert sind es 51: 40 Geflecht hat Rang 50 statt 51,5.
- 98 Level stehen nach der Formel, 12 davon am alten Platz. Verschoben werden sie im Mittel um 3,7 Plätze, höchstens
  um 10.
- **Prüfliste für Ticket 16: 51 Level**, 28 nach vorn und 23 nach hinten (heutiger Platz → Platz nach der Formel):
  - nach vorn: 41 → 27, 52 → 31, 55 → 32, 58 → 40, 64 → 45, 65 → 37, 70 → 41, 72 → 36, 74 → 35, 75 → 59, 79 → 66,
    84 → 69, 86 → 53, 87 → 60, 93 → 73, 95 → 71, 99 → 72, 100 → 61, 102 → 81, 107 → 86, 108 → 84, 109 → 77, 110 → 95,
    111 → 87, 112 → 90, 117 → 88, 134 → 121, 144 → 131;
  - nach hinten: 17 → 62, 27 → 46, 32 → 47, 36 → 58, 42 → 74, 45 → 76, 49 → 63, 50 → 85, 51 → 91, 61 → 82, 63 → 79,
    66 → 80, 67 → 92, 76 → 101, 77 → 109, 80 → 99, 81 → 116, 82 → 113, 83 → 97, 85 → 104, 91 → 114, 94 → 105,
    122 → 137.
- 56 Strahlenkranz bleibt ebenfalls am alten Platz, obwohl die Formel es nur 7 Plätze weiter vorn sieht (49): Zwischen
  den Leveln der Prüfliste käme es auf Platz 44, 12 Plätze weit. Für die KI-Tester ist es kein Fall. Nach Ticket 16 wird
  neu verteilt.
- 33 der 51 stehen auch auf der Duldungsliste, 6 davon mit Ausschlussgrund. Nicht auf der Duldungsliste stehen 18: 17,
  27, 32, 42, 63, 70, 76, 79, 80, 81, 84, 85, 91, 95, 110, 112, 117, 122.

**Schwellen der Grade** (untere Grenze auf der Schwierigkeit):

| Grad | ab | vorläufige Grenze | Lücke dort | gewählte Lücke | Level höchstens 1 Punkt entfernt |
|---|---|---|---|---|---|
| mittel | 43 | nach 30 Leveln, 42,77–43,69 | 0,92 | dieselbe | 6 |
| schwer | 58,5 | nach 100 Leveln, 58,10–58,11 | 0,02 | nach 104 Leveln, 58,32–59,13 (0,81) | 12 |
| sehr schwer | 87 | nach 140 Leveln, 88,35–88,51 | 0,15 | nach 138 Leveln, 85,98–87,95 (1,97) | 1 |

- Regel: je die breiteste Lücke zwischen zwei benachbarten Werten höchstens 5 Plätze von der vorläufigen Grenze, ihre
  Mitte auf halbe Punkte gerundet. Eine Schwelle in einer Lücke hält, wenn sich Werte etwas verschieben. Genau nach 100
  Leveln lägen die beiden Nachbarn nur 0,01 auseinander.
- Nach der Schwelle: leicht 30, mittel 74, schwer 34, sehr schwer 12. In der Reihenfolge (Regel unten): leicht 32
  (Plätze 1–32), mittel 70 (33–102), schwer 35 (103–137), sehr schwer 13 (138–150).
- Knapp ist die Grenze zwischen mittel und schwer: Dort liegen die Werte am dichtesten. Neues Eichen kann dort Grade
  verschieben.

**Grad entlang der Reihenfolge:**
- Vorschlag:
  - Der Grad folgt der Schwelle.
  - Ein Level, das an seinem alten Platz bleibt, bekommt den Grad seines Abschnitts der Reihenfolge, also den des
    letzten Levels davor, das nach der Formel steht. Das gilt heute für die Prüfliste, später auch für Level, die die
    KI-Tester nicht verschieben.
  - Ein Abschnitt beginnt beim ersten Level nach der Formel, das die Schwelle erreicht. So sinkt der Grad nie, und ein
    Level am alten Platz zieht keine anderen mit.
- So haben 17 Level nicht den Grad nach der Schwelle, alle auf der Prüfliste:
  - leicht statt mittel: 17, 27, 32;
  - mittel statt leicht: 41;
  - mittel statt schwer: 77, 81, 82, 91, 94;
  - schwer statt mittel: 107, 108, 109, 110, 111, 112, 117;
  - sehr schwer statt schwer: 144.
- Zum Vergleich zwei andere Regeln:
  - Mit dem laufenden Maximum der Grade nach der Schwelle von vorn wäre ab 17 Weichen alles mindestens „mittel“:
    leicht 16, mittel 60, schwer 61, sehr schwer 13; 43 Level nicht nach der Schwelle.
  - Mit dem laufenden Minimum von hinten zögen 41 Schliff und 117 Supernova die Grenzen nach hinten: leicht 41,
    mittel 76, schwer 27, sehr schwer 6; 30 Level nicht nach der Schwelle.
- Gegenüber dem vorläufigen Grad nach heutigem Platz ändern 11 Level ihren Grad:
  - leicht: 31 Lichtbündel, 32 Streulicht;
  - mittel: 102 Smaragd, 103 Silberstreif (Anker A5), 106 Polarlicht;
  - schwer: 98 Rangierbahnhof, 145 Lichtbrücke;
  - sehr schwer: 131 Korona, 135 Pulsar (Anker A6), 136 Quasar, 137 Ereignishorizont.

**Entwurf der Duldungsliste** (Grad der Reihenfolge, Plätze heute):

| Grund | leicht | mittel | schwer | sehr schwer | zusammen |
|---|---|---|---|---|---|
| Ausschlussgrund | 6 | 10 | 14 | 7 | 37 |
| ab „mittel“ ohne nötige Kernidee | – | 50 | 7 | 0 | 57 |
| ab „mittel“ unter dem Mindest-Spielwert 60 | – | 45 | 9 | 1 | 55 |
| **Duldungsliste** | **6 von 32** | **55 von 70** | **20 von 35** | **8 von 13** | **89** |

- **Ausschlussgrund:** genau die 37 der Neuzählung. Keines ist neu, keines fällt weg, auch nicht durch den neuen Grad:
  31 Lichtbündel wird leicht, hat aber eine Scheinmischung, und die gilt überall.
  - leicht: 15 Begegnung, 19 Seitenlicht, 20 Auslese, 26 Labyrinth, 29 Doppelpass, 31 Lichtbündel (alle
    Scheinmischung);
  - mittel: 36 Einklang (Füllteil), 38 Schnittstelle (Scheinmischung), 40 Geflecht (Füllteil, Zerfall), 43 Glasmurmel
    (Füllteil), 67 Weichensteller (Füllteil, Scheinmischung), 77 Mosaik (Füllteil), 86 Laterne (Scheinmischung,
    Zerfall), 92 Lichtorgel, 97 Libelle, 106 Polarlicht (je Scheinmischung);
  - schwer: 98 Rangierbahnhof, 101 Opal, 111 Lichtschleife, 116 Komet, 120 Unendlichkeit, 121 Irrlicht, 128
    Interferenz, 129 Leuchtturm, 132 Glasperlenspiel, 138 Lichtgeschwindigkeit (je Scheinmischung), 133 Sternbild,
    134 Kristallpalast (je Zerfall), 139 Singularität (Scheinmischung, Zerfall), 140 Urknall (Scheinmischung, Knäuel);
  - sehr schwer: 131 Korona (Füllteil, Scheinmischung, Zerfall), 136 Quasar (Scheinmischung, Knäuel), 137
    Ereignishorizont, 143 Prismenhof, 147 Farbmühle, 149 Zenit (je Scheinmischung), 146 Farbenrausch (Knäuel).
- **Ab „mittel“ ohne nötige Kernidee** (57):
  - mittel: 33 Glasfenster, 34 Funkenflug, 35 Kreuzweg, 36 Einklang, 37 Knotenpunkt, 38 Schnittstelle, 39
    Lichtschacht, 40 Geflecht, 41 Schliff, 43 Glasmurmel, 44 Turmalin, 45 Spiegelachse, 46 Drehscheibe, 47
    Farbschleuse, 48 Lichtfaden, 49 Pinselstrich, 50 Schimmer, 51 Kreuzfeuer, 52 Lichtpfad, 53 Perlmutt, 54 Legierung,
    55 Farbwechsel, 56 Strahlenkranz, 57 Fadenkreuz, 58 Verästelung, 59 Paravent, 61 Spektralband, 62 Glasbaustein, 64
    Sonnenstrahl, 65 Tagesanbruch, 66 Glühwürmchen, 68 Blaue Stunde, 69 Lichtschranke, 71 Farbtupfer, 72 Rubin, 73
    Rochade, 75 Bumerang, 78 Lichtkreuz, 82 Traumfänger, 83 Glasbläser, 86 Laterne, 87 Mondlicht, 89 Uhrwerk, 93
    Schachbrett, 94 Farbverlauf, 99 Widerschein, 100 Chamäleon, 102 Smaragd, 103 Silberstreif, 106 Polarlicht;
  - schwer: 98 Rangierbahnhof, 104 Sternwarte, 107 Kathedrale, 108 Pendel, 109 Sonnenwende, 115 Lichtjahr, 118
    Lichthof.
- **Ab „mittel“ unter dem Mindest-Spielwert 60** (55):
  - mittel: 34 (46,5), 35 (38,1), 36 (48,6), 37 (49,2), 38 (44,0), 39 (47,1), 40 (50,5), 41 (40,9), 43 (45,3),
    44 (51,6), 45 (53,6), 46 (46,5), 47 (55,6), 48 (51,1), 49 (52,2), 50 (57,9), 51 (57,0), 52 (53,2), 53 (49,9),
    54 (51,6), 55 (53,2), 56 (52,2), 57 (55,6), 58 (47,7), 59 (51,1), 61 (55,9), 62 (57,9), 64 (46,2), 65 (47,6),
    66 (57,9), 68 (54,4), 69 (57,9), 71 (48,0), 72 (51,3), 73 (54,5), 74 Lichtnetz (45,5), 75 (52,2), 83 (49,6),
    86 (48,8), 87 (48,8), 89 (59,0), 99 (55,2), 100 (49,9), 102 (50,7), 106 (53,0);
  - schwer: 98 (53,2), 104 (38,3), 107 (49,2), 108 (50,5), 109 (48,8), 115 (54,3), 116 Komet (57,7), 118 (56,2), 140
    Urknall (53,3);
  - sehr schwer: 144 Spiegelkabinett (55,1).
- Ohne Ausschlussgrund stehen 52 Level auf der Liste:
  - 44 haben keine nötige Kernidee und liegen unter 60.
  - Nur ohne Kernidee, je knapp über 60: 33, 78, 82, 93, 94, 103.
  - Nur unter 60: 74 Lichtnetz (Lockvogel) und 144 Spiegelkabinett.
- 14 der 52 haben ein Urteil der KI-Tester, im Mittel ein Gefühl von 4,0, 11 davon mindestens 4 (89 Uhrwerk 5, 73
  Rochade 4,5). Die 9 Level ab „mittel“ mit Urteil, die nicht auf der Liste stehen, haben im Mittel 4,2.
- **Grenzfälle der Neuzählung** (Spec, „Weitere Hinweise“):
  - Knäuel: 122, 150, 85, 99 und 109 bestehen; 38 fällt wegen Scheinmischung.
  - Zerfall mit zweiter Gruppe aus 2 Elementen: Keines fällt wegen Zerfall. 37 und 80 bestehen, 36 und 43 haben einen
    Füllteil, 101 eine Scheinmischung.
  - Scheinmischung (b): 76, 100, 117 und 118 bestehen. 118 Lichthof lehnten beide KI-Tester ab (Ticket 13).

**Die übrigen Regeln der Nahtstelle 3**, in der neuen Reihenfolge:
- **Haupt-Kernidee höchstens zweimal je 10 Level** (je Seite der Levelauswahl): 4 Verletzungen.
  - Plätze 81–90: Abschalten 3-mal (84, 88, 92);
  - 121–130: Mischziel aus zwei Quellen 3-mal (121, 129, 133);
  - 131–140: Abschalten 3-mal (139, 130, 148);
  - 141–150: Abschalten 4-mal (141, 135, 137, 149).
  - In jeder dieser Gruppen steht ein Level der Duldungsliste (92, 121/129/133, 139, 137/149). Zählt der Test nur Level,
    die nicht auf der Duldungsliste stehen, ist die Regel eingehalten. Vorschlag: so zählen; ein Ersatz in Phase 6
    bringt eine andere Kernidee.
  - In gleitenden Fenstern zu 10 Leveln wären 50 von 141 verletzt. Die Spec meint feste Gruppen wie der heutige Test der
    Mittelwerte.
- **Mittel der Schwierigkeit je 10 Level:** 25,1 35,8 40,5 45,6 48,9 48,2 50,5 52,2 55,1 55,4 56,6 60,3 77,0 84,3 91,5.
  - Von 41–50 nach 51–60 fällt es um 0,68. Grund sind die Level der Prüfliste an ihren alten Plätzen; ohne sie ist der
    kleinste Schritt +1,36. Die heutige Reihenfolge fiele mit der neuen Schwierigkeit an derselben Stelle um 0,57.
  - Ohne die Duldungsliste fiele es dort um 1,43. Die Duldungsliste hier auszunehmen, hilft also nicht.
  - Vorschlag: Toleranz 1 Punkt (Reserve 0,32 statt heute 0,02). Nach Ticket 16 neu ansehen.
- **Grad:** Jedes Level hat einen, und er sinkt nie (Regel oben).
- **Namen:** eindeutig; die Liste der entfernten Namen ist leer.
- **Genau eine Lösung:** alle 150, mit dem Löser (`unique`) wie im heutigen Test.
- **Verschiebungen der KI-Tester:**
  - Es gibt noch keine.
  - Die 43 Einträge im Protokoll stammen aus Eichläufen, ihre Plätze beziehen sich auf die heutige Reihenfolge.
  - Der Test darf nur Läufe aus Ticket 16 zählen, etwa ab einer neuen Version des Ablaufs.
- **Spielwert und Schwierigkeit** (Hinweis aus Ticket 12):
  - Rangkorrelation: alle 0,65, leicht 0,21, mittel 0,69, schwer 0,26, sehr schwer 0,37.
  - In „mittel“ hängen beide eng zusammen. Beide zählen Kernideen, Farblogik und Zusammenspiel.

**Abschätzung: erweiterte Erkennung.** Gerechnet an Kopien der Regeln Abschalten, Falle und Farben abzählen im
Scratchpad; die Regeln im Repo sind unverändert.
- **Die Erweiterungen:**
  - **A+ Abschalten mit jedem falschen Licht:**
    - Der Zwischenstand ist wie heute: Eine Quelle allein bringt über höchstens 3 drehbare Elemente, jedes davon
      nötig, Licht auf ein Ziel. Der Weg ist kürzer als in der Lösung, und kein anderes Ziel bekommt falsches Licht.
    - Neu enthält das Licht auf dem Ziel nur mindestens eine seiner Grundfarben und dazu falsches Licht, etwa Weiss auf
      Blau oder Magenta auf Cyan.
    - Nötig: Die Lösung nimmt der Quelle auch den richtigen Teil weg. Bringt dieselbe Quelle ihn auf anderem Weg hin,
      gehört der Fall zur Falle.
  - **F+ Falle ohne erfülltes Ziel:** Das Licht auf dem Ziel ist nur ein Teil seiner Farbe (Rot auf Gelb) oder hat
    falsches Licht dabei. Holzweg und erster Blick wie heute. Dazu zwei Varianten:
    - F+′: ohne die Prüfung auf den ersten Blick bei falschem Licht;
    - „gleich lang“: so viele drehbare Elemente wie in der Lösung, aber ein kürzerer Weg des Lichts (aus 14 Zwillinge).
  - **Z+ Farben abzählen, auch wenn sich der Verlust Ziel für Ziel zeigt** (aus 89 Uhrwerk):
    - eine knappe Grundfarbe mit mindestens 3 Zielen;
    - der Verlust ist möglich;
    - mindestens ein Ziel hat 2 mögliche Lieferanten.
- **Die Fälle der KI-Tester:**
  - 39 Lichtschacht: A+, Weiss von (4,6) über (4,5) auf dem blauen Ziel.
  - 51 Kreuzfeuer: A+, Weiss über (2,3)/(2,2) auf dem Cyan-Ziel, und Z+ für Blau.
  - 89 Uhrwerk: Z+ für Blau: 3 Quellen, 3 Ziele.
  - 14 Zwillinge, nicht erkannt:
    - „Rot direkt“ bringt Grün mit aufs rote Ziel.
    - Der Zwischenstand hat so viele drehbare Elemente wie die Lösung. Mit „gleich lang“ ist er einer, aber kein
      Holzweg enthält ihn.
    - 14 ist ohnehin leicht.
  - 102 Smaragd, nicht erkannt:
    - Über (2,0) kann das Blau aus dem Prisma nicht nach Osten aufs Cyan-Ziel, denn ein Spiegel lenkt Nordwest nicht
      nach Ost.
    - Die Erkennung findet nur einen Zwischenstand, der der Lösung entspricht.
  - 73 Rochade, nicht erkannt:
    - Weiss fällt über (4,5) aufs blaue Ziel, doch dieselbe Quelle bringt das Blau in der Lösung, und kein Holzweg
      enthält den Zwischenstand.
    - Blau brauchen nur 2 Ziele.
- **Funde auf den 150:**
  - A+: 49 Level mit 51 Funden (leicht 9, mittel 27, schwer 11, sehr schwer 2); 32 davon haben heute keine Kernidee.
  - Z+: 39 Level mit 63 Funden (leicht 4, mittel 25, schwer 10); 29 davon heute ohne Kernidee.
  - F+ und F+′: 5 Level (76, 125, 136, 137, 148); „gleich lang“: 16. Alle haben heute schon eine Kernidee.
- **Ab „mittel“:**

| Erkennung | ohne Kernidee | unter 60 | Duldungsliste | neu mit Kernidee | neu über 60 |
|---|---|---|---|---|---|
| heute | 57 | 55 | 89 | – | – |
| A+ | 32 | 34 | 65 | 25 | 21 |
| Z+ | 32 | 32 | 70 | 25 | 23 |
| A+ und Z+ | 18 | 21 | **56** | 39 | 34 |
| A+, Z+ und F+′ gleich lang | 18 | 20 | 56 | 39 | 35 |
| F+ (jede Variante) | 57 | 55 | 89 | 0 | 0 |

  Mit A+ und Z+ wären es je Grad: leicht 6, mittel 28, schwer 14, sehr schwer 8. Auch so bleibt die Liste deutlich
  länger als 37.
- **Dekorativ? Mini-Level:**
  - Gezählt wird das Mini-Level „A+ nötig“: Weiss fiele über einen Spiegel auf ein blaues Ziel, die Lösung braucht es
    für ein weisses Ziel, und Blau kommt über zwei Spiegel und einen Blaufilter.
  - Nicht gezählt werden die dekorativen Abwandlungen:
    - Blau kommt ebenso kurz;
    - das Licht hat keine Farbe des Ziels (Rot auf Blau);
    - dieselbe Quelle bringt ihr Blau auf längerem Weg über einen Filter hin;
    - für Z+: drei blaue Quellen mit je nur einem erreichbaren Ziel.
  - **Aber A+ zählt, was man sofort sieht:** Das Spielermodell widerlegt alle 51 Zwischenstände von A+ auf den ersten
    Blick, dazu den des Mini-Levels. Beim heutigen Abschalten sind es nur 8 von 31. Nach dem Mass, das die Falle schon
    anlegt, sind die Funde von A+ also dekorativ.
  - Z+ zählt genau, was Ticket 10 bewusst ausschloss: einen Verlust, der sich Ziel für Ziel zeigt.
- **Gegen die KI-Tester:**
  - Von den 15 Leveln mit Urteil und Fund von A+ nennen sie bei 4 Abschalten (35, 39, 81, 92).
  - Von den 14 mit Fund von Z+ nennen sie bei 5 Farben abzählen (38, 52, 89, 94, 109). Bei 17 Leveln mit Urteil nennen
    sie Farben abzählen, wo Z+ nichts Neues findet.
- **Folgen für die Abnahmen**, neu geeicht wie in Ticket 12; die Schwierigkeit zählt die neuen Funde als Kernideen:

| Erkennung | Schwierigkeit gekreuzt: alle \| 1–30 31–60 61–90 91–120 121–150 | Spielwert: ohne Ausschluss / alle |
|---|---|---|
| heute | 0,929 \| 0,850 0,301 0,382 0,296 0,521 | 0,323 / 0,289 |
| A+ | 0,915 \| 0,835 **0,216** 0,301 0,294 0,526 | 0,337 / 0,295 |
| Z+ | 0,921 \| 0,854 **0,286** 0,336 0,306 0,553 | 0,382 / 0,277 |
| F+ | 0,928 \| 0,852 0,298 0,351 **0,285** 0,539 | 0,319 / 0,296 |
| F+ gleich lang | 0,929 \| 0,852 0,319 0,360 **0,292** 0,527 | 0,319 / 0,295 |
| A+ und Z+ | 0,910 \| 0,842 **0,224** **0,285** 0,318 0,527 | 0,345 / **0,263** |

  Verlangt sind 0,85 und je Bereich 0,3, auf zwei Stellen gerundet, beim Spielwert 0,30 und 0,27. Jede Erweiterung
  kippt die Abnahme der Schwierigkeit in einem Bereich (fett), auch nach neuem Eichen. A+ und Z+ zusammen kippen auch
  die des Spielwerts über alle.

**Optionen für den Haltepunkt:**
- **(a) Die lange Duldungsliste annehmen (89), Ersatz in Phase 6.**
  - Neu zu eichen: nichts.
  - Folgen: Phase 6 ersetzt 89 der 150 Level, in „mittel“ 55 von 70. Darunter sind Level, die die KI-Tester mögen.
  - Abnahmen aus 12 und 13: Keine kippt.
- **(b) Zuerst die Erkennung erweitern, als eigener Schritt, dann neu eichen.**
  - Neu zu eichen:
    - die Schwierigkeit, weil Kernideen mitzählen; danach Reihenfolge, Prüfliste und Schwellen;
    - der Spielwert: Übereinstimmung und `weitere`;
    - die Tests der Kernideen, etwa in Ticket 10 „kein Abschalten bei falschem Licht“ und die Zahlen auf den 150.
  - Folgen:
    - Die Duldungsliste würde 56 bis 70 Level lang, immer noch deutlich über 37.
    - A+ zählt nur, was das Spielermodell auf den ersten Blick widerlegt. Z+ hebt einen Entscheid aus Ticket 10 auf.
    - Das geplante Schärfen des Glossars („Abschalten nur in der Farbe des Ziels“) liefe A+ entgegen.
  - Was kippt: die Schwierigkeit gekreuzt in 31–60 (A+ 0,22, Z+ 0,29) bzw. 91–120 (F+ 0,29); mit A+ und Z+ auch der
    Spielwert über alle (0,263).
- **(c) Das Glossar schärfen und die KI-Tester neu laufen lassen.**
  - Neu zu eichen: Mit neuen Urteilen im Protokoll ändert sich die Eichmenge des Spielwerts. Dazu kommen eine neue
    Version des Ablaufs und ein neuer Fingerabdruck.
  - Folgen:
    - Die Duldungsliste bleibt 89 lang, denn die Erkennung ändert sich nicht.
    - Danach sähen die KI-Tester die Kernideen wie der Code, und ihre Urteile über die 52 würden vergleichbar.
    - Vor Ticket 16 ist das ohnehin verlangt.
  - Was kippt: möglicherweise die Übereinstimmung des Spielwerts (0,30 bzw. 0,27), je nach neuen Urteilen.
- **(d) Mischformen:**
  - **(d1) wie (a), dazu (c) vor Ticket 16:**
    - Die Liste wird nach Grund getrennt geführt.
    - Phase 6 ersetzt zuerst die 37 mit Ausschlussgrund.
    - Über die 52, die nur wegen Kernidee oder Spielwert auf der Liste stehen, wird je Grad nach Ticket 16 entschieden,
      mit den Urteilen der KI-Tester. 27 der 52 stehen ohnehin auf der Prüfliste.
    - Neu zu eichen ist nichts, und keine Abnahme kippt.
  - **(d2) Kernidee und Mindest-Spielwert für die heutigen Level erst ab „schwer“ verlangen:**
    - Die Duldungsliste würde 44 Level lang (leicht 6, mittel 10, schwer 20, sehr schwer 8).
    - Das ändert die Spec: User Story 10, das Glossar bei „Kernidee“ und die Nahtstelle 3.
    - Neu zu eichen ist nichts.
  - **(d3) nur Z+, als eigener Schritt:** Das ist der deutlichste Fall, 89 Uhrwerk. Die Duldungsliste würde 70 Level
    lang, und die Schwierigkeit in 31–60 kippt (0,286).

**Empfehlung: (d1).**
- Die Erkennung jetzt zu erweitern, lohnt sich nicht:
  - Die Liste bliebe über 37, im besten Fall 56.
  - A+ zählt, was man sofort sieht.
  - Jede Erweiterung kippt eine Abnahme aus Ticket 12, A+ mit Z+ auch die aus Ticket 13.
- Die Duldungsliste ist das vorgesehene Werkzeug, damit die Tests sofort gelten. Nach Grund getrennt bleibt sichtbar,
  welche Level gegen eine Ausschlussregel verstossen (37, wie in der Neuzählung) und welche keine erkannte Kernidee
  haben (52).
- Ob die 52 alle ersetzt werden, ist eine Frage des Spasses: Die KI-Tester mögen viele davon. Mit geschärftem Glossar
  liefern sie die Urteile dafür in Ticket 16, für 27 davon ohne Mehraufwand.
- Reihenfolge, Grade und die übrigen Regeln hängen von dieser Wahl nicht ab.

**Für Stufe B bei jeder Option:**
- **Eichung an der heutigen Reihenfolge (ADR 0001):**
  - `eiche-schwierigkeit.mjs`, der Test der Schwierigkeit und `schwierigkeit-gewichte.json` lesen die Plätze aus
    `LEVELS`.
  - Nach dem Umsortieren wäre das die Reihenfolge der Formel selbst, ein Kreisschluss: Die Rangkorrelation stiege von
    selbst.
  - Die heutige Reihenfolge muss deshalb als feste Liste von Namen erhalten bleiben. An ihr wird weiter geeicht und
    geprüft.
- **Tests mit Plätzen:**
  - Viele Tests der Beurteilung nennen heutige Plätze, etwa die Falle bei 76, 79, 101 …, den Stillstand bei 116, 138 …
    oder `heutigeLevel()[147]`.
  - Den vorläufigen Grad nach Platz nutzen `helfer.mjs`, `spielwert-eichmenge.mjs`, `eiche-spielwert.mjs` und
    `eiche-schwierigkeit.mjs` (`gradeOf`).
  - Sie lesen künftig Namen und den Grad aus den Leveldaten.
  - In der Eichmenge des Spielwerts wechselt dabei kein Level zwischen leicht und mittel, die Ausschlüsse bleiben also
    gleich.
- **Anker der KI-Tester:**
  - A5 Silberstreif wird „mittel“, A6 Pulsar „sehr schwer“.
  - A7 Morgenröte (Platz 143) und A8 Sternenstaub (Platz 138) stehen nicht mehr am Ende ihres Grads (138–150).
  - A4 Farbverlauf steht auf der Prüfliste.
  - Neue Anker brauchen eine neue Version des Ablaufs in `tools/ki-tester/`. Sonst fällt der Test der Anker in
    `tests/ki-tester.test.mjs`. Das gehört zu Ticket 16 oder vor dessen Lauf.
- **Protokoll:** `referenz.position` und die Bereiche der Anker rechnen mit der heutigen Reihenfolge. `GRADES` in
  `protocol.mjs` sind die vorläufigen Grade.
- **README:** ein Eintrag für `tools/ordne-level.mjs`.

**Abschluss 16.10.2026 (Stufe B).** Umgesetzt nach den Entscheiden des Nutzers zum Haltepunkt.

**Entscheide des Nutzers (16.10.2026):**
- Die Duldungsliste mit 89 Leveln wird angenommen (Option d1), nach Grund getrennt: Ausschlussgrund; ab „mittel“ ohne
  nötige Kernidee; ab „mittel“ unter dem Mindest-Spielwert.
  - Die Tests gelten sofort, die Erkennung der Kernideen bleibt unverändert.
  - Phase 6 ersetzt zuerst die 37 Level mit Ausschlussgrund. Über die 52, die nur wegen Kernidee oder Spielwert
    draufstehen, wird je Grad nach Ticket 16 entschieden, mit den Urteilen der KI-Tester.
  - Das Glossar wird wie geplant vor Ticket 16 geschärft.
- Alle Einzelheiten wie vorgeschlagen:
  - die Schwellen mit der Regel der breitesten Lücke;
  - der Grad des Abschnitts für ein Level am alten Platz;
  - die Haupt-Kernidee nur ausserhalb der Duldungsliste gezählt;
  - die Toleranz von 1 Punkt für das Mittel je 10 Level.
- Festgehalten in der Spec („Schwierigkeitsgrade“, „Levelliste, Reihenfolge und Austausch“, Phase 6, Nahtstelle 3 und
  „Weitere Hinweise“ bei den Auslegungen); die Liste der 37 Namen dort ersetzt der Verweis auf die Datei. ADR 0001 hat
  einen Nachtrag zur festen Namensliste.

**Aufbau:**
- `tools/beurteilung/heutige-reihenfolge.json` und `.mjs`: die heutige Reihenfolge vor diesem Ticket als feste
  Namensliste, `HEUTIGE_REIHENFOLGE`, `heutigerPlatz(name)`, `inHeutigerReihenfolge()`.
  - Sie bleibt der Massstab der Eichung (ADR 0001): `eiche-schwierigkeit.mjs`, `eiche-spielwert.mjs`, die
    Eichmenge des Spielwerts und `heutigeLevel()` im Testhelfer lesen die Level in dieser Reihenfolge.
  - Ohne sie eichte die Schwierigkeit nach dem Umordnen an ihrer eigenen Reihenfolge.
- `tools/beurteilung/grad.mjs`: `SCHWELLEN` (mittel ab 43, schwer ab 58,5, sehr schwer ab 87) und `gradVon(wert)`.
  Keine Regel in `regeln.mjs` und kein Teil von `beurteile`; so bleibt die Beurteilung für Ticket 14 unberührt.
- `tools/levelliste.mjs`: die Regeln der Levelliste, gemeinsam für Skript und Test.
  - `ordne(werte)`: die Reihenfolge mit Prüfliste;
  - `gradeEntlang()`: Grade nach der Schwelle, am alten Platz der Grad des Abschnitts;
  - `GRUENDE`: die drei Gründe der Duldung;
  - `MAX_WANDERN` (10), `TOLERANZ_MITTEL` (1), `HAUPT_KERNIDEE_JE_10` (2), `zehner`, `ladeLevelliste()`.
- `tools/levelliste.json`, versioniert:
  - `duldung` und `urspruenglich`, je nach Grund (`ausschlussgrund`, `ohneKernidee`, `unterMindestSpielwert`);
  - `entfernteNamen` (leer);
  - `pruefliste` (51 Namen) für Ticket 16.
- `tools/ordne-level.mjs` (aus Stufe A): rechnet jetzt immer von der festen Namensliste aus und nutzt
  `levelliste.mjs`.
  - `--schreiben` ordnet die Level zwischen `LEVELS:BEGIN/END` in index.html und setzt `grad` hinter den Namen
    (statt `difficulty`). Es schreibt Duldungsliste und Prüfliste nach `levelliste.json`; die ursprüngliche Liste und
    die entfernten Namen lässt es, wie sie sind.
  - Ein zweiter Lauf meldet „Reihenfolge und Grade stimmen“ und ändert nichts (38,7 s).
- index.html:
  - Die 150 Level stehen neu geordnet, jedes mit `grad`. Der Text jedes Levels ist sonst unverändert; der
    Golden-Test belegt das.
  - Die Anzeige liest `grad` über `GRAD_ANZEIGE` (früher `DIFFICULTY`), die nur „schwer“ und „sehr schwer“ kennt.
  - Der Seitentitel nennt den Grad nur, wenn ihn die ganze Seite hat und er angezeigt wird.
  - Der Kommentar zum Format von `LEVELS` ist nachgeführt.
- KI-Tester, nur so weit nötig: Ablauf 1 bleibt auf der heutigen Reihenfolge.
  - `loadAnchors` und `levelAt` rechnen über die Namensliste, und `prepare.mjs` nimmt die Bilder am Platz des
    Levels im Spiel auf.
  - Der Fingerabdruck lässt `grad` aus wie früher `difficulty` und bleibt d91d5db7fe66811d.
  - Eine neue Version des Ablaufs war nicht nötig.

**Zahlen:**
- Reihenfolge:
  - 98 Level stehen nach der Formel, 12 davon am heutigen Platz. Verschoben werden sie im Mittel um 3,7 Plätze,
    höchstens um 10.
  - Die Prüfliste hat 51 Level, dazu bleibt 56 Strahlenkranz am heutigen Platz (Zwischenstand Stufe A).
  - 86 der 159 Level stehen an einem anderen Platz als vorher.
- Grade in der Reihenfolge: leicht 32 (Plätze 1–32), mittel 70 (33–102), schwer 35 (103–137), sehr schwer 13
  (138–150).
  - Nach der Schwelle allein wären es 30 / 74 / 34 / 12.
  - 17 Level der Prüfliste haben den Grad ihres Abschnitts statt den nach der Schwelle.
  - 11 Level haben einen anderen Grad als vorläufig: 31, 32 leicht; 102, 103, 106 mittel; 98, 145 schwer; 131, 135,
    136, 137 sehr schwer.
- Duldungsliste 89:
  - Ausschlussgrund 37, genau die der Neuzählung (leicht 6, mittel 10, schwer 14, sehr schwer 7);
  - ohne Kernidee 57 (mittel 50, schwer 7);
  - unter 60: 55 (mittel 45, schwer 9, sehr schwer 1).
  - Die Listen mit Namen stehen im Zwischenstand Stufe A und in `tools/levelliste.json`.
- Mittel der Schwierigkeit je 10 Level: 25,1 35,8 40,5 45,6 48,9 48,2 50,5 52,2 55,1 55,4 56,6 60,3 77,0 84,3 91,5.
  Der kleinste Schritt ist −0,68, bei der Toleranz von 1 Punkt also 0,32 Reserve.
- Haupt-Kernidee je 10 Level, ohne die Duldungsliste gezählt: eingehalten.

**Tests** (über `leise.sh`, nacheinander, alle grün):

| Test | Ergebnis | Laufzeit |
|---|---|---|
| `tests/golden.mjs` | alle 159 Level wie in `golden.json`, verglichen nach Namen | 3,1 s |
| `tests/golden.mjs --voll` | dasselbe mit dem Löser aller Level | 16,6 s |
| `tests/logic.test.mjs` | 553 Tests (vorher 558: 5 Tests der alten Levelliste entfernt) | 17,8 s |
| `tests/beurteilung.test.mjs` | 165 Tests, wie vorher | 36,7 s |
| `tests/ki-tester.test.mjs` | 54 Tests, wie vorher, Fingerabdruck unverändert | 0,4 s |
| `tests/levelliste.test.mjs` (neu) | 18 Tests | 27,4 s |
| `tests/screenshot.mjs` und die Proben unten | keine Meldungen in der Konsole | 17,7 s, die Proben nachher 4 min 20 s |

- **Golden-Test nach Namen:** Er war nach Plätzen geschlüsselt.
  - Jetzt vergleicht er je Level nach Namen. Welche Level Löser und alte Wertung bekommen, liest er aus `golden.json`
    (die Einträge mit `score`, also dieselben 24 Level wie vorher).
  - `golden.json` ist unverändert. Der Lauf meldet „86 Level stehen an einem anderen Platz als in golden.json,
    verglichen nach Namen“ und sonst keine Abweichung, auch mit `--voll`: Nur die Reihenfolge wechselt, und jedes Level
    hat nach Namen dieselben Strahlbilder und Löserergebnisse.
- **Tests der Levelliste** (`tests/levelliste.test.mjs`), je ein Test:
  - jedes Level mit einem der vier Grade, das Tutorial ohne, kein `difficulty`;
  - der Grad sinkt nie;
  - die Reihenfolge ist die der Formel, von der heutigen Reihenfolge aus;
  - die Prüfliste stimmt;
  - der Grad folgt den Schwellen bzw. dem Abschnitt;
  - das Mittel je 10 Level fällt um höchstens 1 Punkt (und steigt über alle um mindestens 15 wie bisher);
  - die Haupt-Kernidee höchstens zweimal je 10 Level, ohne die Duldungsliste;
  - je Grund: verletzt nur bei Leveln auf der Duldungsliste, und jedes geduldete Level verletzt die Regel noch;
  - die Liste wird nur kürzer;
  - nur Level im Spiel, je Grund keines doppelt;
  - eindeutige Namen, keiner auf der Liste der entfernten Namen;
  - genau eine Lösung;
  - der Fortschritt hängt am Namen.
- **Fortschritt geprüft:** Der Test lädt den Speicherstand aus index.html (`progress`) mit einer Attrappe von
  `localStorage`.
  - Er speichert gelöste Level und das aktuelle Level in der heutigen Reihenfolge und lädt sie in der neuen.
  - Gelöste und aktuelles Level kommen nach Namen wieder, obwohl sie an anderen Plätzen stehen.
  - Ein Speicherstand nach Platz (`keyOf` als Platz) fiele auf.
- **Gegenproben:** Acht verfälschte Fassungen fallen alle auf: zwei Namen getauscht, ein Grad falsch, ein Name aus der
  Duldungsliste gestrichen, ein neuer darauf, ein Name der Prüfliste gestrichen, Toleranz 0, Haupt-Kernidee höchstens
  einmal, Fortschritt nach Platz statt Namen. Danach sind die Dateien byte-gleich wiederhergestellt.
- **Review:** Die Tests der Reihenfolge, der Prüfliste und des Grads rechnen zusätzlich ohne `ordne()` und
  `gradeEntlang()` nach: höchstens 10 Plätze oder am heutigen Platz, nach der Schwierigkeit geordnet, Prüfliste aus dem
  Rang, Grad nach den Schwellen. Vorher fiel ein Fehler in `ordne()` nicht auf, wenn `--schreiben` ihn in die
  Leveldaten übernahm (Gegenprobe: umgekehrte Reihenfolge bei gleichem Wert). Der Test des Fortschritts liest die
  Schlüssel aus `FLOW`, nicht den ersten `storageKey` (der des Himmels).
- **Tests der Beurteilung**, umgestellt auf die Namensliste und den Grad der Leveldaten:
  - `helfer.mjs` liest die 150 in der heutigen Reihenfolge, mit `level.grad` statt `gradeOf`. Das sind zwei
    Zeilen und ein Kommentar; `miniLevel` ist unberührt (Ticket 14).
  - Die Plätze in den Tests sind weiter heutige Plätze und bleiben gleich.
  - `schwierigkeit.test.mjs` sucht Querschläger über den Namen statt über den Platz in `LEVELS`.
  - Testzahlen ändern sich nur, wo sich ein Grad wirklich ändert, mit einem Kommentar je Stelle:

| Test | vorher | jetzt | warum |
|---|---|---|---|
| Abschalten je Grad | schwer 11, sehr schwer 5 | 9, 7 | 135 Pulsar, 137 Ereignishorizont sehr schwer |
| Lockvogel je Grad | schwer 4, sehr schwer 0 | 3, 1 | 135 Pulsar sehr schwer |
| Mischziel aus zwei Quellen je Grad | schwer 17, sehr schwer 10 | 15, 12 | 131, 136, 137 sehr schwer, 145 schwer |
| ab „mittel“ ohne Kernidee | 59 (schwer 9) | 57 (schwer 7) | 31, 32 leicht; 102, 103, 106 mittel; 98 schwer |
| unter dem Mindest-Spielwert | leicht 25, mittel 46, schwer 10; 53 ohne Kernidee | 27, 45, 9; 51 | wie oben |

  - Bei Falle, Farben abzählen und Sammelstelle bleiben die Zahlen. Ihre Titel heissen jetzt „je Grad“ statt „je Grad
    nach heutigem Platz“.
- **Eichungen unverändert:**
  - Schwierigkeit: `eiche-schwierigkeit.mjs` mit der Namensliste schreibt dieselbe `schwierigkeit-gewichte.json`
    (bis aufs Zeilenende gleich). Gekreuzt 0,93 | 0,85 0,30 0,38 0,30 0,52 wie vorher.
  - Spielwert: `eiche-spielwert.mjs` mit derselben Eichmenge (109 Level, 63 ohne Ausschluss), denselben Brücken und
    0,32 bzw. 0,29.
  - Je Grad zählt die Eichmenge nun nach den neuen Graden (mittel 18, schwer 22, sehr schwer 13 statt 16, 27, 10).
- **Screenshots** (Desktop 1440 × 900 und Handy 390 × 844, vorher und nachher):
  - Levelauswahl der Seiten 101–110, 111–120, 131–140, 141–150 mit `tests/screenshot.mjs`, Kopfzeile von Silberstreif,
    Pulsar und Morgenröte mit `tools/ki-tester/shots.mjs`.
  - Gleich bleiben Kacheln, Kopfzeile und Seitentitel. Anders sind nur die Reihenfolge und, wo sich der Grad ändert,
    Rauten und Titel:
    - Rauten tragen jetzt die Plätze 103–150 statt 121–150.
    - Der Seitentitel 111–120 und 121–130 heisst „Schwer“, 131–140 ist gemischt (vorher „Schwer“), 141–150 bleibt
      „Sehr schwer“.
    - Pulsar zeigt „◆◆ Sehr schwer“ statt „◆ Schwer“.
- **Render:** Das Spiel braucht keine neue Datei. Geändert ist nur index.html; die neuen Dateien gehören zu Werkzeugen
  und Tests.

**Abweichungen:**
- Ablauf 1 der KI-Tester rechnet mit den Plätzen der heutigen Reihenfolge. Sonst stünden A5, A6 und A8 nicht mehr in
  ihrem vorläufigen Grad, und der Test der Anker fiele; neue Anker gehören in eine neue Version (Ticket 16).
- Dazu angepasst: `prepare.mjs` (Index der Bilder) und `tests/ki-tester.test.mjs` (das Feld als Text hängt nicht vom
  Grad ab: `grad` statt `difficulty`).
- Der Test der Duldungsliste prüft auch die Gegenrichtung: Ein Level, das seine Regel nicht mehr verletzt, muss von der
  Liste. So bleibt sie genau.
- Die Spannweite von mindestens 15 Punkten über die Mittel je 10 Level stammt aus dem bisherigen Test und bleibt.
- `tests/logic.test.mjs` vergleicht die Namen der 150 mit `NAMES` aus `profiles.mjs` jetzt als Menge; die
  Reihenfolge prüft `tests/levelliste.test.mjs`.

**Hinweise für Folgetickets:**
- Ticket 16: Prüfliste, Anker A4–A8, Ablauf 1 und der Test der Protokoll-Korrekturen stehen dort unter `## Comments`.
- Ticket 17: das Feld `grad` und `GRAD_ANZEIGE` (Hinweis dort).
- Tickets 18 ff. (Generator):
  - `gradVon` aus `tools/beurteilung/grad.mjs` gibt den Grad eines neuen Levels.
  - `ordne()` kennt heute nur Level mit einem Platz in der heutigen Reihenfolge. Für Ersatzlevel (Phase 6) braucht es
    eine Regel, wo sie einsortiert werden, etwa am Platz der Formel mit Prüfung durch die KI-Tester.
  - Ein entferntes Level kommt mit seinem Namen auf `entfernteNamen` und aus der Duldungsliste.
  - `inHeutigerReihenfolge()` wirft, sobald ein Level der heutigen Reihenfolge nicht mehr im Spiel ist (Review). Das
    trifft die Eichung der Schwierigkeit und des Spielwerts, den Testhelfer der Beurteilung, Ablauf 1 der KI-Tester
    und den Test der Levelliste. Vor dem ersten Entfernen (Tickets 23–26) braucht es dafür eine Regel, etwa die
    entfernten Level als feste Kopie für die Eichung.
- Ticket 21: `selection.jsonl`, `curate.mjs`, `harden.mjs` und die Profile bestimmen die Reihenfolge nicht mehr
  (Hinweis dort).
- Ticket 14:
  - `tests/beurteilung/helfer.mjs` ändert nur `heute()` und `grad()`.
  - `tools/beurteilung/` bekommt nur neue Dateien (`grad.mjs`, `heutige-reihenfolge.*`) und eine Änderung in
    `spielwert-eichmenge.mjs`; keine Regel ist berührt.

**Offen:**
- Der Spielwert hängt in „mittel“ zu 0,69 mit der Schwierigkeit zusammen (Hinweis aus Ticket 12, Stufe A). Ob er dort
  unabhängig genug misst, bleibt offen.
- Die Grenze zwischen mittel und schwer liegt im dichtesten Teil der Werte (12 Level höchstens 1 Punkt von 58,5). Ein
  neues Eichen kann dort Grade verschieben; der Test zeigt es dann an.
- `tests/ki-tester.test.mjs` führt die 37 Namen der Neuzählung als eigene Liste; siehe Hinweis in Ticket 16.
