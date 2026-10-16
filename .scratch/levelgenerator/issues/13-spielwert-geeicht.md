# 13: Spielwert geeicht

**What to build:** Die Beurteilung liefert den Spielwert als Zahl mit Teilwerten, getrennt von der Schwierigkeit. Er
entscheidet über die Aufnahme ins Spiel. Unter einem Mindest-Spielwert wird kein Level aufgenommen.

**Spec:** ../spec.md, Abschnitte „Beurteilung“ (Spielwert) und „KI-Tester“.

**Blocked by:** 05 (Ablauf der KI-Tester), 09 (Spielermodell und Probieren), 10 (Kernideen I), 11 (Kernideen II)

**Status:** resolved

- [x] Der Spielwert besteht aus Teilwerten:
      - Schliessen (aus dem Spielermodell) und eine nötige Kernidee tragen zusammen etwa zwei Drittel.
      - Farblogik und Zusammenspiel geben einen kleineren Bonus.
      - Beim Zusammenspiel zählen gemeinsame Mischziele, und alle Quellen werden verglichen. Das behebt die Fehler aus
        der Analyse.
- [x] Als Eichmenge dienen die Spass-Urteile der KI-Tester (Ablauf aus 05) für mindestens 40 Level aus allen vier
      Graden. Vorhandene Urteile aus den Reviews zählen mit, wenn sie ein Gefühl von 1 bis 5 enthalten. Alle Urteile
      stehen im Protokoll.
- [x] Die Gewichte bringen den Spielwert möglichst nah an das Spass-Urteil. Die erreichte Rangkorrelation steht unter
      `## Comments`.
- [x] Der Mindest-Spielwert ist festgelegt und begründet. Berichtet wird, welche der 150 Level darunter liegen.
- [x] Mini-Level zeigen: Ein Level, das sich durch Schliessen mit nötiger Kernidee lösen lässt, hat einen höheren
      Spielwert als ein sonst gleiches Level ohne diese Eigenschaften.

## Comments

**Abschluss 16.10.2026.** Stufe A baute den Teil `spielwert` und bereitete die Eichmenge vor (Zwischenstand unten).
Die KI-Tester beurteilten die vier Läufe `spielwert-1` bis `spielwert-4`, das Protokoll hat 43 Einträge. Stufe B eichte
an ihnen und an den Reviews.

**Aufbau** (README unter „Beurteilung“, Unterpunkt „Spielwert“):
- `tools/beurteilung/spielwert.mjs`: die Regel, dazu `GEWICHTE`, `KERNIDEE`, `kernideeTeil` und `MINDEST_SPIELWERT`.
  Eine Zeile in `regeln.mjs` unter der Kommentarzeile von Ticket 13. Ausgabe `{ wert (0–100), teilwerte (je 0–1) }`.
  Die Regel ist teuer.
- `tools/beurteilung/spass-reviews.json`: die 72 Spass-Urteile der Spieler-Tester aus den Reviews 4 und 6 samt
  Leveldaten, übernommen aus `tools/pools/` (nicht versioniert, nur gelesen).
- `tools/beurteilung/spielwert-eichmenge.mjs`: `eichmenge()` aus dem Protokoll und `spass-reviews.json`, dazu
  `rangkorrelation()`. Gebraucht vom Messskript und vom Test.
- `tools/eiche-spielwert.mjs`: Messskript der Eichung, etwa 1,5 min über `leise.sh`.
- `feldform.mjs`: `durchlauf(s)` für die Kreuzungen (Stufe A).

**Teilwerte und Gewichte:**

| Teilwert | Gewicht | Form |
|---|---:|---|
| Schliessen | 34 | folgern (Horizont 2) × (1 − kInf / 7) × (1 − weite Fast-Lösungen ‰ / 60) |
| Kernidee | 33 | ohne nötige Kernidee 0; die erste bringt 0,8, jede weitere verschiedene 30 % des Rests (zwei 0,86, drei 0,90, vier 0,93) |
| Farblogik | 17 | Anteil der Ziele, die ein Mischziel sind oder beschnittenes Licht einer Quelle bekommen |
| Zusammenspiel | 16 | Stellen je drehbares Element, höchstens 1: Elemente mit mehreren Strahlen, gemeinsame Mischziele, Kreuzungen |

- Schliessen und Kernidee tragen 67, Farblogik und Zusammenspiel 33. Ein Level, das sich durch Schliessen lösen lässt
  und eine nötige Kernidee hat, erreicht ohne Bonus 60,4, also gut 60 % der Skala („etwa zwei Drittel“), mit jeder
  weiteren Kernidee mehr, bis 67.
- Die Spec gibt nur die zwei Drittel vor. Stufe A teilte beide Teile fast hälftig (34/33 und 17/16); „Gewichte der
  Spec“ heisst unten diese Teilung.
- Gegenüber Stufe A geändert ist nur die Kernidee: Dort trug eine Kernidee den ganzen Teilwert, weitere zählten nicht.

**Eichmenge** (109 Level):

| | Level | mit Urteil der KI-Tester | mit Review-Urteil | ohne Ausschlussgrund |
|---|---:|---:|---:|---:|
| leicht | 14 | 14 | 0 | 12 |
| mittel | 16 | 16 | 0 | 12 |
| schwer | 27 | 9 | 20 | 14 |
| sehr schwer | 10 | 4 | 10 | 6 |
| Kandidaten ausserhalb des Spiels | 42 | 0 | 42 | 19 |
| zusammen | 109 | 43 | 72 | 63 |

- Spass eines Levels: bei den KI-Testern das Mittel aus A und B, bei den Reviews der Spass der Spieler-Tester. Bei
  einer Brücke ist es das Mittel beider.
- **Geeicht wird an den 63 Leveln ohne Ausschlussgrund.** Der Spielwert entscheidet nur unter Leveln, die die
  Ausschlüsse bestehen. Ein Level mit Ausschluss bekommt sein tiefes Gefühl vor allem für den Ausschlussgrund, und den
  misst der Spielwert bewusst nicht (149 Zenit: 3 gegen 5 im Review, siehe Brücken). Zum Vergleich steht auch die
  ganze Menge da.

**Brücken** (Urteil der KI-Tester und aus einem Review):

| Level | KI-Tester | Review | Differenz |
|---|---:|---:|---:|
| 125 Halo | 4,0 | 4,0 (R01) | 0 |
| 135 Pulsar | 3,5 | 4,0 (R14) | −0,5 |
| 141 Morgenröte | 5,0 | 5,0 (S09) | 0 |
| 144 Spiegelkabinett | 4,0 | 3,5 (S36) | +0,5 |
| 148 Sternenstaub | 4,5 | 4,5 (S28) | 0 |
| 149 Zenit | 3,0 | 5,0 (S12) | −2,0 |

- Die Skalen passen ohne Angleichung: Median der Differenz 0, ohne 149 auch das Mittel 0, höchstens ein halber Punkt.
- Einzig 149 weicht ab. Beide KI-Tester lehnten es wegen Scheinmischung ab, wie der Code (Fall b); Review 6 kannte den
  Begriff noch nicht. Bei den 63 Leveln ohne Ausschluss fällt 149 ohnehin weg.

**Rangkorrelation mit dem Spass**, je auf der Eichmenge selbst und in der Kreuzprüfung (5 und 10 Falten, eines weg)
sowie an jedem zweiten Level eingestellt und an den übrigen geprüft (Hälfte):

| Modell | ohne Ausschluss (63): eingestellt / 5, 10, eines weg / Hälfte | alle (109) |
|---|---|---|
| Gewichte der Spec, eine Kernidee zählt | 0,29 / 0,29, 0,29, 0,29 / 0,35 | 0,28 / 0,28, 0,28, 0,28 / 0,44 |
| **dieselben Gewichte, weitere Kernideen geeicht** | **0,32 / 0,31, 0,32, 0,32 / 0,38** | 0,29 / 0,29, 0,29, 0,29 / 0,45 |
| dieselben Gewichte, `erste` (ab 0,6) und `weitere` geeicht | 0,35 / 0,35, 0,35, 0,34 / 0,39 | 0,29 / 0,27, 0,25, 0,25 / 0,43 |
| dieselben Gewichte, `erste` (0 bis 1) und `weitere` geeicht | 0,38 / 0,26, 0,29, 0,24 / 0,35 | 0,29 / 0,27, 0,20, 0,14 / 0,36 |
| alle Werte frei eingestellt | 0,37 / 0,22, 0,26, 0,30 / 0,31 | 0,31 / 0,19, 0,19, 0,21 / 0,31 |

- **Frei eingestellte Gewichte lernen auswendig:** Auf der Menge selbst sind sie am besten. In jeder Kreuzprüfung liegen
  sie unter den Gewichten der Spec, und von Falte zu Falte springen sie (in einer Vorprüfung Schliessen zwischen 0
  und 52). Darum bleiben die Gewichte der Spec (34/33/17/16).
- **Bestätigt hat die Kreuzprüfung auf beiden Mengen nur eines:** Weitere Kernideen zählen mit. In allen drei Kreuzprüfungen ist das
  besser (0,31–0,32 gegen 0,29), auf der ganzen Menge mindestens gleich gut. Geeicht ist dabei nur `weitere`
  (0,3; gesucht 0 bis 1 in Zehnteln).
  - `erste` wollen die Daten tiefer. Auf 0,6 bis 1 begrenzt wählt die Eichung ohne Ausschluss 0,6 (`weitere` 0,2) und
    hält das in der Kreuzprüfung (0,34–0,35). Über alle 109 ist das in der Kreuzprüfung aber schlechter als das feste
    0,8 (0,25–0,27 gegen 0,29), und von 0 bis 1 lernt `erste` auswendig (0,24–0,29).
  - Die Spec setzt die Grenze: Mit Schliessen soll eine Kernidee etwa zwei Drittel tragen. Darum gilt 0,8, der tiefste
    Wert mit gut 60 %. Mit 0,6 läge Schliessen mit einer Kernidee ohne Bonus bei 53,8, und der Mindest-Spielwert müsste
    mitgehen.
- **Erreicht** mit den Werten in `spielwert.mjs`:
  - ohne Ausschluss 0,32: KI-Tester 0,31 (35 Level), Reviews 0,43 (33), Kandidaten 0,32 (19);
  - je Grad: leicht 0,04 (12), mittel 0,54 (12), schwer 0,24 (14), sehr schwer 0,88 (6);
  - alle 109: 0,29.
- **Einordnung:** Die Übereinstimmung ist schwach. Das liegt an den Urteilen, die streuen, und an den Kernideen, die die
  Erkennung nicht sieht (siehe Hinweise unten). Bei den leichten Leveln trennt der Spielwert nicht. Dort gilt kein
  Mindest-Spielwert, und eine Kernidee ist nicht verlangt.
- **Je Teilwert** (ohne Ausschluss): Zusammenspiel 0,23, Farblogik 0,18, Zahl der nötigen Kernideen 0,18, Schliessen
  nur 0,07 (alle 0,01). Das grösste Gewicht hat also der Teilwert, dem der Spass einzeln am wenigsten folgt; es kommt
  aus der Spec, nicht aus den Daten.

**Mindest-Spielwert: 60** (`MINDEST_SPIELWERT`, gilt ab „mittel“ nach Nahtstelle 3 der Spec, siehe Abweichungen):
- **Aus dem Aufbau:** Ein Level, das sich durch Schliessen lösen lässt und eine nötige Kernidee hat, liegt immer darüber
  (60,4), auch ohne Bonus. Ohne Kernidee braucht ein Level volles Schliessen und mindestens 26 der 33 Punkte Bonus. Die
  Schwelle setzt also die beiden Spassquellen der Spec durch.
- **Aus den Daten:** Unter den Schwellen mit mindestens zehn Leveln auf jeder Seite trennt 60 das Gefühl am deutlichsten:

| Schwelle | ohne Ausschluss: darunter / darüber | alle: darunter / darüber |
|---:|---|---|
| 50 | 3,70 (10) / 3,83 (53) | 3,56 (17) / 3,79 (92) |
| 55 | 3,68 (17) / 3,86 (46) | 3,55 (28) / 3,83 (81) |
| **60** | **3,56 (27) / 3,99 (36)** | **3,51 (40) / 3,90 (69)** |
| 65 | 3,63 (32) / 3,99 (31) | 3,60 (50) / 3,89 (59) |
| 70 | 3,63 (33) / 4,01 (30) | 3,60 (55) / 3,91 (54) |

  Bei 45 ist der Abstand grösser (0,50), aber darunter liegen nur 3 bzw. 7 Level.

**Die 150 unter dem Mindest-Spielwert** (Grad nach heutigem Platz):
- **leicht 25 von 30** (hier ohne Folge): alle ausser 13, 15, 26, 27 und 28.
- **mittel 46 von 70:** 31 Lichtbündel, 32 Streulicht, 34 Funkenflug, 35 Kreuzweg, 36 Einklang, 37 Knotenpunkt,
  38 Schnittstelle, 39 Lichtschacht, 40 Geflecht, 41 Schliff, 43 Glasmurmel, 44 Turmalin, 45 Spiegelachse,
  46 Drehscheibe, 47 Farbschleuse, 48 Lichtfaden, 49 Pinselstrich, 50 Schimmer, 51 Kreuzfeuer, 52 Lichtpfad,
  53 Perlmutt, 54 Legierung, 55 Farbwechsel, 56 Strahlenkranz, 57 Fadenkreuz, 58 Verästelung, 59 Paravent,
  61 Spektralband, 62 Glasbaustein, 64 Sonnenstrahl, 65 Tagesanbruch, 66 Glühwürmchen, 68 Blaue Stunde,
  69 Lichtschranke, 71 Farbtupfer, 72 Rubin, 73 Rochade, 74 Lichtnetz, 75 Bumerang, 83 Glasbläser, 86 Laterne,
  87 Mondlicht, 89 Uhrwerk, 98 Rangierbahnhof, 99 Widerschein, 100 Chamäleon.
- **schwer 10 von 40:** 102 Smaragd, 104 Sternwarte, 106 Polarlicht, 107 Kathedrale, 108 Pendel, 109 Sonnenwende,
  115 Lichtjahr, 116 Komet, 118 Lichthof, 140 Urknall.
- **sehr schwer 1 von 10:** 144 Spiegelkabinett.
- **Ab „mittel“ sind es 57 Level.** 53 davon haben keine nötige Kernidee. Die verlangt die Spec ab „mittel“ ohnehin, auf
  den 150 fehlt sie 59 Levels (Ticket 11). Neu kommen nur 4 Level mit Kernidee, aber wenig Schliessen, dazu: 74
  Lichtnetz (Lockvogel), 116 Komet, 140 Urknall und 144 Spiegelkabinett. Auf der Duldungsliste stehen davon schon 31, 36,
  38, 40, 43, 86, 98, 106, 116 und 140.
- Ab „mittel“ liegen darunter auch Level, die den KI-Testern gefielen (Gefühl mindestens 4): 35, 39, 51, 73 (4,5), 74,
  89 Uhrwerk (5), 102, 109 und 144, dazu 140 Urknall mit 5 in Review 4. Siehe die Hinweise für Ticket 15/16.

**Unabhängigkeit von der Schwierigkeit** (Rangkorrelation; Ticket 12 ist noch nicht zusammengeführt):
- Auf den 150: Spielwert und Grad 0,46, Spielwert und Zahl der drehbaren Elemente 0,39. Der Spielwert steigt also mit
  der Schwierigkeit, weil Kernideen und Farblogik in schweren Leveln häufiger sind.
- In der Eichmenge ohne Ausschluss: Spass und drehbare Elemente 0,18, Spielwert und drehbare Elemente 0,48. Rechnet man
  die Grösse heraus (Teilkorrelation der Ränge), bleibt zwischen Spielwert und Spass 0,28 (alle 0,26). Der Spielwert misst
  also mehr als die Grösse.

**Gegenprobe der Ausschlüsse an den KI-Testern:**
- Die 8 der 43 Level, die der Code ausschliesst, lehnten beide KI-Tester unabhängig ab, und zwar mit demselben Begriff:
  - Scheinmischung: 20 Auslese, 26 Labyrinth, 38 Schnittstelle, 92 Lichtorgel, 101 Opal, 149 Zenit;
  - Füllteil und Zerfall: 40 Geflecht;
  - Scheinmischung und Zerfall: 86 Laterne.
  Alle stehen auf der Duldungsliste.
- Abgelehnt haben beide zudem 118 Lichthof (Scheinmischung). Nach der Regel besteht es, weil die Mischung über 4
  Spiegel und nicht direkt ins Prisma läuft. 118 steht schon in der Spec unter den Grenzfällen der Scheinmischung (b);
  in Ticket 15/16 neu ansehen.
- Nur einer nannte einen Begriff bei 117 Supernova (B: Scheinmischung). Bei 27 Spiegelbild (leicht) nannten beide
  Zerfall; der gilt dort nicht.

**Hinweise für Ticket 15/16 und das Glossar:**
- **Die KI-Tester sehen Kernideen, wo die Erkennung keine findet:**
  - 39 Lichtschacht: beide Abschalten, das falsche Weiss muss vom blauen Ziel. Die Erkennung zählt nur Licht in der Farbe
    des Ziels (Auslegung Ticket 10).
  - 14 Zwillinge: beide eine Falle, die Grün auf das rote Ziel bringt. Die Erkennung verlangt ein schon erfülltes Ziel.
  - 51 Kreuzfeuer und 102 Smaragd: A eine Falle.
  - 89 Uhrwerk (B) und 73 Rochade (A): Farben abzählen.

  Entweder das Glossar so schärfen, wie die Spec es vor dem nächsten Lauf verlangt, oder die Erkennung erweitern.
  Beides hebt die Übereinstimmung.
- **Die Korrekturen der Eichläufe** (Verschiebungen um bis zu 5 Plätze, 9 Ablehnungen) beziehen sich auf die heutige
  Reihenfolge. Wie bei den Probeläufen sollten sie in Ticket 15/16 nicht als Korrektur gelten.

**Tests** (über `leise.sh`, nacheinander, alle grün):
- `tests/beurteilung.test.mjs`: 144 Tests in 92 s, vorher 45 s; die 45 s mehr sind die Kandidaten der Eichmenge.
- `tests/golden.mjs`: 3 s.
- `tests/logic.test.mjs`: 558 Tests in 34 s.
- `tests/ki-tester.test.mjs`: 54 Tests mit 43 Einträgen im Protokoll.
- `tests/beurteilung/spielwert.test.mjs`, 16 Tests, nur über `beurteile` und die Eichmenge:
  - die Mini-Level aus Stufe A, darunter der Punkt des Tickets (2 × 2 Level gleicher Bauart);
  - Raten, das Abschalten-Paar, Farblogik, Zusammenspiel;
  - zwei Drittel: Schliessen mit einer Kernidee ohne Bonus 60–75 Punkte, der volle Bonus höchstens ein Drittel und
    kleiner;
  - neu: Jede weitere Kernidee hebt den Teilwert, der unter 1 bleibt;
  - neu: Mindest-Spielwert an Mini-Leveln;
  - neu: die 150 unter dem Mindest-Spielwert je Grad;
  - neu: die Eichmenge, mindestens 40 Level mit Urteil der KI-Tester aus allen vier Graden und 72 Review-Urteile;
  - neu: **die Übereinstimmung**, Rangkorrelation mindestens 0,30 ohne Ausschluss und 0,27 über alle (erreicht 0,32
    und 0,29; die Reserve fängt Rundung und kleine Änderungen der Erkennung auf).
- **Testgetrieben:** zu den 13 verfälschten Regeln aus Stufe A kommen 4 dazu: `weitere` 0, `erste` 1 und 0,5,
  Mindest-Spielwert 70. Alle fallen auf.

**Abweichungen vom Ticket:**
- „Alle Urteile stehen im Protokoll“: Die Urteile der KI-Tester stehen im Protokoll. Die Review-Urteile stehen in
  `spass-reviews.json`, weil sie nicht aus dem Ablauf der KI-Tester stammen (ohne Bilder, ohne Version, andere
  Felder); das Protokoll prüft jede Zeile gegen Ablauf 1.
- Gewichte: Die Eichung bestätigt die Gewichte der Spec und eicht nur die weiteren Kernideen, weil frei eingestellte
  Gewichte in der Kreuzprüfung schlechter waren.
- Der Mindest-Spielwert gilt ab „mittel“, wie es der Test der Levelliste in der Spec verlangt (Nahtstelle 3). Die Spec
  unter „Beurteilung“, User Story 32 und Ticket 15 sagten „kein Level“. Der Nutzer hat „ab mittel“ am 16.10.2026
  bestätigt, ebenso „zwei Drittel“ als Punkte eines Levels (`erste` 0,8). Beides steht in der Spec unter den
  Auslegungen; Spec und Ticket 15 sind nachgeführt.
- Die Läufe `spielwert-1` bis `spielwert-4` liefen mit Ablauf 1, also ohne das Glossar zu schärfen, wie es die Spec vor
  dem nächsten Lauf verlangt. Nachgeholt wird das vor dem Lauf von Ticket 16 (Hinweis dort).

**Offen:**
- **Vergleich mit der neuen Schwierigkeit** (Ticket 12) nach dem Zusammenführen: Rangkorrelation von Spielwert und
  Schwierigkeit, auch je Grad. Heute: mit dem Grad 0,46, mit der Grösse 0,39.
- **57 Level ab „mittel“ unter dem Mindest-Spielwert:** Ticket 15 entscheidet mit der Duldungsliste. 53 davon fehlt die
  Kernidee, die die Spec ab „mittel“ ohnehin verlangt.
- **Kernideen, die die KI-Tester sehen** (oben): Glossar schärfen oder Erkennung erweitern, dann neu eichen.
- **Rangfolge der Haupt-Kernidee** (offen aus Ticket 11): Für Faktoren je Kernidee ist die Eichmenge zu klein. Je
  Kernidee gibt es nur wenige Level, und schon vier Werte lernten auswendig.
- **Raten über kInf** hängt von der Reihenfolge der Zellen ab (Ticket 09). Kommt aus Ticket 12 ein robusteres Mass,
  übernimmt es der Spielwert.
- **Neue Urteile im Protokoll** ändern die Eichmenge. Der Test verlangt dann weiter mindestens 0,30 und 0,27; fällt er,
  wird neu geeicht (`tools/eiche-spielwert.mjs`).
- **Zwischenspeicher für Anker-Bilder** (offen aus Ticket 05): eine Option in `prepare.mjs`, siehe Stufe A.

**Zwischenstand Stufe A (16.10.2026)**, soweit er weiter gilt:
- **Formen:**
  - Schliessen: folgern ist der Anteil der Stellungen, die das Spielermodell mit Horizont 2 streicht (durch Folgern
    oder Fallunterscheidung), unter 1 nur, wenn es steckt. Raten und Fast-Lösungen sind an der Schwelle von Probieren
    gemessen; eine Fallunterscheidung mehr als erlaubt ergäbe 0. Die Kette zählt nicht, weil sie stark von der
    Reihenfolge der Elemente abhängt (Ticket 09).
  - Farblogik: Beschnitten heisst, die Farbe der Quelle geht nicht in der Farbe des Ziels auf. Dann muss ein Filter oder
    ein Prisma beschneiden, denn in der Lösung bekommt kein Ziel falsches Licht. Weiss + Rot = Weiss zählt nicht.
  - Zusammenspiel: Das alte `split.mjs` verglich nur die ersten beiden Quellen. Der Spielwert zählt im Strahlbild aller
    Quellen, und ein gemeinsames Mischziel zählt auch hinter einem Kombinator. Elemente, die bloss das Mischlicht eines
    Kombinators weiterleiten, zählen nicht; ein Vergleich je Quelle hätte sie alle mitgezählt.
- **Vorhandene Spass-Urteile** (`tools/pools/` im Haupt-Repo, nur gelesen):
  - Ein Gefühl von 1 bis 5 haben nur die Spieler-Tester der Reviews 4 und 6. Die Analysten geben eine „Qual.“, kein
    Gefühl. Die Reviews 1, 3 und 5 haben keine Urteile mit Gefühl. Die Ordner `review2/`, `mittel/review/` und
    `mittel2/review/` gibt es nicht mehr.
  - Review 4, 32 Kandidaten, Spass ganzzahlig: 20 sind heute 121–140, über gleiche Elemente und Lösung zugeordnet.
  - Review 6, 40 Kandidaten, Spass in halben Schritten: 10 sind heute 141–150.
  - Probelauf 2 hatte 11 Level mit Gefühl. Vor den neuen Läufen hatten im Spiel nur 37 Level ein Gefühl: leicht 3,
    mittel 3, schwer 21, sehr schwer 10.
- **Neue Läufe** (Ablauf 1, je 8 Level plus die 8 Anker):
  - Auswahl je Grad, geschichtet nach dem vorläufigen Spielwert, ohne Anker und ohne Level mit Urteil der KI-Tester:
    leicht 11, mittel 13, schwer 6 aus 101–120, sehr schwer 2 als Brücken (144, 149). 8 der 32 stehen auf der
    Duldungsliste.
  - `spielwert-1`: 1, 12, 20, 39, 52, 79, 109, 117;
  - `spielwert-2`: 4, 13, 14, 73, 86, 92, 102, 113;
  - `spielwert-3`: 6, 23, 26, 40, 51, 91, 118, 144;
  - `spielwert-4`: 16, 25, 38, 74, 81, 89, 101, 149.
- **Bilder:**
  - `spielwert-1` lief vollständig mit `prepare.mjs` (26,8 s je Aufnahme auf dem Desktop, 24,9 s auf dem Handy).
  - Für 2–4 schrieb `prepare.mjs … --ohne-bilder` Texte, Aufträge und `lauf.json`. Ein Wegwerf-Skript ausserhalb des
    Repos nahm nur die 8 Level auf, mit `takeShots` und ihrer Kennung in der Kopfzeile. Die 16 Bilder der Anker kamen aus
    `spielwert-1`.
  - Nachweis, dass sie gleich sind: gleicher Fingerabdruck, gleiche Plätze der Anker, byte-gleiche Feldtexte, und A1
    und A7 in `spielwert-4` neu aufgenommen byte-gleich.
  - Gespart: 44 von 128 Aufnahmen. Ein Zwischenspeicher als Option in `prepare.mjs` lohnt bei vielen Läufen (offen aus
    Ticket 05).
- **Mini-Level für den Punkt des Tickets:**
  - Vier Level gleicher Bauart wie die Testlevel für Probieren (5 × 5, zwei weisse Quellen, vier drehbare Spiegel, zwei
    weisse Ziele) mit gleicher Farblogik und gleichem Zusammenspiel.
  - Durch Schliessen lösbar mit nötiger Kernidee (Abschalten, aus einer gezielten Suche) liegt über nur Schliessen, über
    nur Kernidee bei vollen Fast-Lösungen und über keinem von beiden.
  - Ein Paar, das sich nur in einem Element unterscheidet, fand die Suche nicht (gut 2000 eindeutige Mini-Level).
