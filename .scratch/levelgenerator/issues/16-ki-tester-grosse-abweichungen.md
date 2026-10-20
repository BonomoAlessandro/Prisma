# 16: KI-Tester prüfen die grossen Abweichungen

**What to build:** Für jedes Level, das nach der Formel mehr als 10 Plätze wandern würde, urteilen die beiden KI-Tester.
Verschoben wird nur, wenn sie zustimmen. Danach steht die Reihenfolge der 150 Level fest.

**Spec:** ../spec.md, Abschnitte „KI-Tester“ und „Levelliste, Reihenfolge und Austausch“.

**Blocked by:** 05 (Ablauf der KI-Tester), 15 (Neue Reihenfolge und Grade)

**Status:** resolved

- [x] Für jedes Level der Prüfliste aus Ticket 15 urteilen beide Tester nach dem Ablauf aus Ticket 05.
- [x] Ein Level kommt nur dann auf den Platz der Formel, wenn beide Tester zustimmen. Sonst bleibt es an seinem alten
      Platz.
- [x] Eigene Korrekturen der Tester betragen höchstens 5 Plätze und überschreiten nie eine Gradgrenze.
- [x] Lehnen beide Tester ein Level ab, kommt es auf die Duldungsliste. Dies ist der letzte Zeitpunkt, an dem die Liste
      wachsen darf, und der Test der ursprünglichen Liste wird entsprechend nachgeführt.
- [x] Das Protokoll ist vollständig. Ein Test der Levelliste prüft, dass jede Abweichung vom Platz der Formel im
      Protokoll begründet ist.
- [x] Der Grad sinkt entlang der Reihenfolge weiterhin nie, und alle Tests sind grün.

## Comments

**Abschluss 17.10.2026.** Alle 51 Level der Prüfliste sind beurteilt (Läufe `pruefung-1` bis `-7`, Ablauf 2,
Fingerabdruck `066a880667331a43`, 51 zählende Einträge). Reihenfolge und Grade stehen in `index.html`, Duldungsliste
und Prüfliste (erledigt) in `tools/levelliste.json`. Darunter die Stufen A und B und der Probelauf 3.
- **Entscheide des Nutzers vom 17.10.2026** (in der Spec unter „Weitere Hinweise“, Regeln in `tools/levelliste.mjs`):
  - 17 Weichen und 32 Streulicht kommen auf den Platz der Formel in „mittel“ und auf die Duldungsliste (ohne nötige
    Kernidee, unter dem Mindest-Spielwert), als einmalige Ausnahme. Allgemein: Kommt ein Level durch ein Urteil der
    KI-Tester in einen Grad, in dem es eine Regel verletzt, darf es jetzt auf die Liste.
  - Häufungsregel für die Haupt-Kernidee (höchstens zweimal je 10 Level ausserhalb der Duldungsliste): Ein Level rückt
    im eigenen Grad um höchstens 3 Plätze, so wenig wie nötig. Wahl: (1) Züge der betroffenen Level; (2) sonst Züge
    anderer Level derselben oder einer Nachbarseite, ein Level der Duldungsliste vor einem anderen; (3) dann der
    kürzeste Zug, der spätere Platz, nach hinten. Kein Zug schafft eine neue Häufung oder bricht Grad, Mittel je 10
    Level oder die Korrekturen der KI-Tester. Die Stufe (2) kam nach dem Halt dazu: Auf 91–100 liess sich die Häufung
    mit den betroffenen Leveln nicht auflösen (siehe unten).
- **Urteile der KI-Tester**, je Level der Prüfliste (heutiger Platz → neuer Platz):
  - **Zur Formel (28):**
    - ohne eigene Korrektur (12): 17 Weichen → 62, 32 Streulicht → 50, 51 Kreuzfeuer → 88, 55 Farbwechsel → 32,
      61 Spektralband → 76, 63 Glitzer → 74, 66 Glühwürmchen → 75, 75 Bumerang → 60, 76 Doppelspiegel → 103,
      87 Mondlicht → 61, 95 Kaleidoskop → 69, 110 Farbknoten → 96;
    - mit Korrektur von dort (11): 41 Schliff +4 → 31, 49 Pinselstrich +5 → 68, 50 Schimmer +5 → 87, 52 Lichtpfad
      +1 → 33, 58 Verästelung −5 → 39, 65 Tagesanbruch −3 → 36, 70 Schattenspiel −5 → 41, 74 Lichtnetz −1 → 40,
      85 Prismenreigen −5 → 101, 112 Bernstein +5 → 90, 134 Kristallpalast −5 → 116;
    - abgelehnt (5, keine Korrektur): 64 Sonnenstrahl → 49 (Füllteil), 67 Weichensteller → 89 (Scheinmischung,
      Füllteil), 86 Laterne → 55 (Scheinmischung, Zerfall), 99 Widerschein → 70 (Zerfall), 111 Lichtschleife → 83
      (Scheinmischung).
  - **Am alten Platz (23):**
    - ohne Korrektur (9): 45 Spiegelachse, 72 Rubin, 77 Mosaik, 79 Saphir, 80 Blendwerk, 82 Traumfänger,
      83 Glasbläser, 100 Chamäleon, 122 Zwielicht (die Plätze verschieben sich durch die übrigen leicht);
    - mit Korrektur (12): 27 Spiegelbild +4 → 30, 42 Lichtharfe −5 → 37, 81 Farbnebel +5 → 84, 84 Spiegeltreppe
      +5 → 86, 91 Glasfaser +5 → 93, 93 Schachbrett +3 → 95, 94 Farbverlauf +2 → 94, 102 Smaragd −4 → 98,
      107 Kathedrale −3 → 108, 108 Pendel −5 → 107, 109 Sonnenwende −5 → 106, 117 Supernova −5 → 112;
    - abgelehnt (2): 36 Einklang → 38 (Füllteil), 144 Spiegelkabinett → 144 (Knäuel).
  - Zwischen den Leveln der Prüfliste bleiben ausserdem 34 Funkenflug und 40 Geflecht am heutigen Platz (sie
    wanderten sonst mehr als 10 Plätze; vorher 56 Strahlenkranz).
- **Häufungen** (ausserhalb der Duldungsliste, vor der Regel):
  - 91–100, „Mischziel aus zwei Quellen“ 3-mal (93 Glasfaser, 96 Farbknoten, 100 Prismenreigen): Rund um die Seite
    stehen sechs solche Level (84, 90, 93, 96, 100, 101); rückt eines der betroffenen nach vorn, kommt Bernstein von
    90 nach, nach hinten Lichtbogen von 101, bei jeder Weite. Gelöst mit Stufe (2): 102 Chamäleon (Duldungsliste,
    ohne Haupt-Kernidee) → 100; Prismenreigen und Lichtbogen rücken auf 101 und 102. Die anderen beiden möglichen
    Züge (Chamäleon → 99, 103 Doppelspiegel → 100) sind länger bzw. kein Level der Duldungsliste.
  - 131–140, „Abschalten“ 3-mal (131 Spiegelsaal, 136 Sonnenfinsternis, 138 Sternenstaub): gelöst mit Stufe (1),
    Spiegelsaal → 130 (auf 121–130 danach zweimal Abschalten).
  - Danach keine Häufung; das Mittel je 10 Level fällt höchstens um 0,34 Punkte (81–90 nach 91–100).
- **Grade:** leicht 1–31 (31 Level), mittel 32–105 (74), schwer 106–137 (32), sehr schwer 138–150 (13); der Grad
  sinkt nie. 11 Level am alten Platz tragen den Grad ihres Abschnitts statt den nach der Schwelle (27, 77, 81, 82, 91,
  94, 107, 108, 109, 117, 144; heutige Plätze). Geschrieben hat `ordne-level.mjs --schreiben`; jedes Level ist nach
  Namen inhaltlich gleich geblieben, nur Reihenfolge (107 Plätze) und `grad` (6 Level) haben sich geändert. Ein
  zweiter Lauf meldet „stimmen“.
- **Duldungsliste neu** (90 Level; vorher 89), je Grund und Grad:

  | Grund | leicht | mittel | schwer | sehr schwer | zusammen |
  |---|---:|---:|---:|---:|---:|
  | Ausschlussgrund | 6 | 11 | 13 | 7 | 37 |
  | ab „mittel“ ohne nötige Kernidee | – | 51 | 7 | – | 58 |
  | ab „mittel“ unter dem Mindest-Spielwert | – | 46 | 9 | 1 | 56 |
  | von beiden KI-Testern abgelehnt | – | 6 | – | 1 | 7 |
  | Level auf der Liste / im Grad | 6/31 | 57/74 | 19/32 | 8/13 | 90 |

  - Neu darauf: 17 Weichen und 32 Streulicht (ohne Kernidee, unter dem Mindest-Spielwert) und die 7 abgelehnten.
    Weg ist 41 Schliff (jetzt „leicht“). `levelliste.json` hält die Ergänzungen einzeln fest (`ergaenzt`); der Test
    prüft je Grund: ursprüngliche Liste = Ticket 15 (37 / 57 / 55 / 0) plus Ergänzungen, jede durch das Protokoll
    begründet.
  - Ohne Ausschlussgrund und ohne Ablehnung: 50 Level, davon 43 ohne nötige Kernidee und unter dem
    Mindest-Spielwert, 6 nur ohne Kernidee (33 Glasfenster, 78 Lichtkreuz, 82 Traumfänger, 93 Schachbrett,
    94 Farbverlauf, 103 Silberstreif), 1 nur unter dem Mindest-Spielwert (74 Lichtnetz).
- **Anker** (über den Namen, Fingerabdruck unverändert): A1 1 Zickzack, A2 28 Zusammenfluss, A3 35 Glasfenster,
  A4 102 Lichtbogen, A5 111 Oase, A6 137 Lichtbrücke, A7 138 Sternenstaub, A8 145 Pulsar. Alle bleiben in ihrem
  Grad am richtigen Ende (Test).
- **Tests** (nacheinander über `leise.sh`):
  - `tests/golden.mjs`: grün, auch `--voll` (alle 159 Level wie in `golden.json`, 132 an einem anderen Platz);
  - `tests/logic.test.mjs`: 553 Tests grün;
  - `tests/levelliste.test.mjs`: 26 Tests grün, darunter „Jede Abweichung vom Platz der Formel ist im Protokoll oder
    durch die Häufungsregel begründet“ (streng: alle 51 beurteilt), die Ergänzungen der ursprünglichen Liste und die
    Häufungsregel an erfundenen Fällen;
  - `tests/ki-tester.test.mjs`: 62 Tests grün (106 Einträge, Ablauf 1: 43, Ablauf 2: 63), die Anker am Ende ihres
    Grads, Fingerabdruck unverändert;
  - `tests/beurteilung.test.mjs`: 172 Tests grün. Nachgeführt sind vier Zählungen je Grad, die den Gradwechseln
    folgen (Haupt-Kernidee, Mischziel aus zwei Quellen, Sammelstelle, Mindest-Spielwert), und die Schwelle der
    Übereinstimmung des Spielwerts (siehe nächster Punkt).
- **Spielwert, Schwelle gesenkt** (Entscheid des Nutzers vom 17.10.2026): Mit den 51 Urteilen der Prüfläufe in der
  Eichmenge fiel die Rangkorrelation mit dem Spass von 0,35 / 0,32 (nach Probelauf 3) auf 0,28 ohne Ausschlussgrund
  (98 Level) und 0,27 über alle (149). Der Test verlangt jetzt 0,26 / 0,25 statt 0,30 / 0,27. Laut
  `tools/eiche-spielwert.mjs` hebt innerhalb der Spec (erste Kernidee 0,8) auch eine neue Eichung von „weitere“ den
  Wert nicht über 0,28; über 0,30 käme man nur mit einer leichteren ersten Kernidee (0,6: 0,31), entgegen dem
  Entscheid „zwei Drittel“ aus Ticket 13. Die Regeln der Beurteilung sind nicht geändert.
  - Je Grad ohne Ausschlussgrund: leicht 0,05 (14 Level), mittel 0,35 (44), schwer 0,14 (15), sehr schwer 0,70 (6);
    nach Quelle KI-Tester 0,32 (72), Reviews 0,43 (33).
  - **Festgehaltene Schwäche:** In „mittel“ übersieht der Spielwert Kernideen, die die KI-Tester sehen. Von 44 Leveln
    in „mittel“ mit Urteil und ohne Ausschlussgrund haben 29 keine erkannte Kernidee; bei 27 davon sehen beide
    KI-Tester einen Aha-Moment, 19 haben ein Gefühl von mindestens 4 (auf der Prüfliste: 23 ohne Kernidee, davon 14
    mit Gefühl ab 4). Das Gefühl unterscheidet sich kaum: im Mittel 3,97 mit, 3,86 ohne erkannte Kernidee.
  - Vor dem Entscheid über die Level ohne Ausschlussgrund wird der Spielwert in „mittel“ angesehen (Erkennung der
    Kernideen oder Modell); Hinweise dazu stehen in den Tickets 23–26, ausführlich in Ticket 24.
  - Screenshot-Probe der Levelauswahl (`tests/output/t16-auswahl-101.png`, `-131.png`, `-141-handy.png`): Reihenfolge
    und Rauten stimmen mit den neuen Plätzen und Graden überein (101 Prismenreigen, 102 Lichtbogen; 131–137 schwer,
    138–140 sehr schwer; Seite 141–150 mit „Sehr schwer“ im Titel).
- **Hinweise für die Tickets 23–26 (Austausch) und den Entscheid über die Level ohne Ausschlussgrund:**
  - Zuerst zu ersetzen sind die 37 Level mit Ausschlussgrund und die 3 abgelehnten ohne Ausschlussgrund:
    leicht 6, mittel 13 (dazu 64 Sonnenstrahl, 99 Widerschein), schwer 13, sehr schwer 8 (dazu 144 Spiegelkabinett).
  - Für den Entscheid über die 50 übrigen stehen bei 32 davon Urteile der KI-Tester im Protokoll (Aha-Moment, Gefühl,
    Begründung): 25 aus `pruefung-1` bis `-7`, dazu 7 aus Probe- und Eichläufen (Glasfenster, Kreuzweg, Lichtschacht,
    Rochade, Uhrwerk, Silberstreif, Lichthof). Für 18 gibt es noch keines. `node tools/ordne-level.mjs --json <datei>`
    gibt je Level Duldung, Spielwert und Urteil aus.
  - Anker A3 Glasfenster steht auf der Duldungsliste (nur ohne Kernidee). Wird es ersetzt, braucht es einen neuen
    Anker und damit eine neue Version des Ablaufs, bevor die KI-Tester die Ersatzlevel prüfen.
  - Ersatzlevel ordnet die Formel ein, die KI-Tester prüfen sie (Ablauf 2 oder neuer). Die Läufe heissen dann nicht
    `pruefung-…`: Für die Levelliste zählen nur Läufe `pruefung-…` von Ablauf 2 (`ZAEHLENDE_LAEUFE`,
    `ZAEHLENDE_ABLAEUFE`), die ursprüngliche Liste wächst nicht mehr (`ERGAENZENDE_LAEUFE`), und `reihenfolge()` meldet
    ein zählendes Urteil zu einem Level ausserhalb der Prüfliste als Fehler; das muss Phase 6 für neue Level erweitern.
    Probe- und Eichläufe (etwa zu den 18 Leveln ohne Urteil) zählen nicht und stören die Levelliste nicht (Review).
  - Die Häufungsregel gilt weiter; ein neues Level kann sie an anderer Stelle auslösen.
  - Der Zwischenspeicher der Anker-Bilder gilt nur, solange `index.html` gleich bleibt; nach Ticket 17 werden sie neu
    aufgenommen.

**Hinweis aus Ticket 13 (Spielwert):** Die Läufe `spielwert-1` bis `spielwert-4` (16.10.2026, Ablauf 1) dienen nur
dem Eichen des Spielwerts. Ihre Verschiebungen und Ablehnungen beziehen sich auf die damalige Reihenfolge und gelten
hier nicht als Korrektur, wie die Probeläufe. Vor dem Lauf dieses Tickets das Glossar schärfen und eine neue Version
des Ablaufs mit Probelauf machen (siehe Spec, „Weitere Hinweise“).

**Hinweise aus Ticket 15 (Reihenfolge und Grade, 16.10.2026):**
- **Prüfliste:** 51 Level, versioniert in `tools/levelliste.json` (`pruefliste`, in der neuen Reihenfolge).
  `tools/ordne-level.mjs` berichtet sie mit dem Platz nach der Formel.
  - nach vorn (heutiger Platz → Platz nach der Formel): 41 → 27, 52 → 31, 55 → 32, 58 → 40, 64 → 45, 65 → 37,
    70 → 41, 72 → 36, 74 → 35, 75 → 59, 79 → 66, 84 → 69, 86 → 53, 87 → 60, 93 → 73, 95 → 71, 99 → 72, 100 → 61,
    102 → 81, 107 → 86, 108 → 84, 109 → 77, 110 → 95, 111 → 87, 112 → 90, 117 → 88, 134 → 121, 144 → 131;
  - nach hinten: 17 → 62, 27 → 46, 32 → 47, 36 → 58, 42 → 74, 45 → 76, 49 → 63, 50 → 85, 51 → 91, 61 → 82,
    63 → 79, 66 → 80, 67 → 92, 76 → 101, 77 → 109, 80 → 99, 81 → 116, 82 → 113, 83 → 97, 85 → 104, 91 → 114,
    94 → 105, 122 → 137.
  - Bis zum Urteil stehen sie an ihrem heutigen Platz und tragen den Grad ihres Abschnitts. Bei 17 Leveln ist das
    nicht der Grad nach der Schwelle: 17, 27, 32, 41, 77, 81, 82, 91, 94, 107–112, 117, 144.
  - Nur der Wechsel zwischen „leicht“ und „mittel“ ändert, was gilt (Review von Ticket 15): Kommen 17 Weichen und
    32 Streulicht nach „mittel“, fehlt ihnen die nötige Kernidee, und sie liegen unter dem Mindest-Spielwert (57,9
    bzw. 52,2). Auf der ursprünglichen Duldungsliste stehen sie nicht, der Test „Die Duldungsliste wird nur kürzer“
    fiele also. Das braucht einen Entscheid des Nutzers. 27 Spiegelbild besteht auch als „mittel“; 41 Schliff käme als
    „leicht“ von der Liste.
  - 56 Strahlenkranz bleibt ebenfalls am heutigen Platz, weil es zwischen den Leveln der Prüfliste 12 Plätze wandern
    würde. Für die KI-Tester ist es kein Fall; nach den Verschiebungen dieses Tickets rechnet `ordne-level.mjs` die
    freien Plätze neu.
- **Duldungsliste:**
  - 33 der 51 stehen auch auf der Duldungsliste, 6 mit Ausschlussgrund: 36, 67, 77, 86, 111, 134. Diese 6 ersetzt
    Phase 6 ohnehin.
  - 27 stehen nur wegen Kernidee oder Spielwert darauf. Über sie entscheidet der Nutzer je Grad nach diesem Ticket,
    mit den Urteilen der KI-Tester (Entscheid vom 16.10.2026). Darum lohnt es sich, bei ihnen Aha-Moment und Gefühl
    genau zu lesen. Die übrigen 25 dieser Art sind nicht auf der Prüfliste.
- **Anker (A4–A8):** In der neuen Reihenfolge und mit den neuen Graden passen sie nicht mehr.
  - A4 Farbverlauf (heute 94) steht auf der Prüfliste (Formel 105, nach der Schwelle schwer).
  - A5 Silberstreif wird „mittel“ (Platz 96), A6 Pulsar „sehr schwer“ (Platz 145).
  - A7 Morgenröte (Platz 143) und A8 Sternenstaub (Platz 138) stehen nicht mehr am unteren bzw. oberen Ende von
    „sehr schwer“ (138–150).
  - A1–A3 bleiben in ihrem Grad (Plätze 5, 23, 34).
  - Regel (1) der Anker („nicht auf der Duldungsliste“) meinte die 37 der Neuzählung. Auf der neuen Liste stehen
    auch A3 Kreuzweg, A4 Farbverlauf und A5 Silberstreif, je nur wegen Kernidee bzw. Spielwert.
  - Ausserhalb von Duldungsliste und Prüfliste gibt es in „mittel“ erst ab Platz 68 ein Level (68 Feuerwerk). Die
    Wahl der Anker muss hier entscheiden, ob Regel (1) nur den Ausschlussgrund meint.
- **Ablauf 1 bleibt bis zur neuen Version auf der heutigen Reihenfolge**, damit der Fingerabdruck (d91d5db7fe66811d)
  und die 43 Einträge im Protokoll gültig bleiben:
  - `loadAnchors`, `levelAt` und `prepare.mjs` rechnen mit den Plätzen der festen Namensliste
    `tools/beurteilung/heutige-reihenfolge.json`.
  - `GRADES` und `gradeOf` sind die vorläufigen Grade.
  - Der Fingerabdruck lässt das neue Feld `grad` aus wie früher `difficulty`.
  - Die neue Version des Ablaufs (geschärftes Glossar, neue Anker) sollte zugleich wechseln: die Referenz auf den
    Platz in der neuen Reihenfolge und die Grade aus den Leveldaten (`level.grad`).
  - Die Grenzen eines Grads gibt dann die Reihenfolge im Spiel vor (leicht 1–32, mittel 33–102, schwer 103–137, sehr
    schwer 138–150); sie verschieben sich mit jeder Verschiebung.
- **Test der Levelliste:** `tests/levelliste.test.mjs` prüft heute, dass die Reihenfolge genau die der Formel ist
  („Die Reihenfolge folgt der Schwierigkeit …“) und die Prüfliste stimmt. Dieses Ticket erweitert ihn: Abweichungen vom
  Platz der Formel sind nur mit Begründung im Protokoll erlaubt, gezählt nur aus Läufen der neuen Version.
  `ordne()` und `gradeEntlang()` in `tools/levelliste.mjs` sind dafür die Stellen.
- **Duplikat:** `tests/ki-tester.test.mjs` führt die 37 Namen der Neuzählung als eigene Liste (`DULDUNG`, Länge 37).
  Sie entspricht dem Grund Ausschlussgrund in `tools/levelliste.json`. Wird diese kürzer, sollte der Test sie von
  dort lesen.

**Stufe A (17.10.2026): Ablauf 2 und Probelauf 3 vorbereitet.**
- **Ablauf 2** (`tools/ki-tester/protocol.mjs`, Fingerabdruck `066a880667331a43`):
  - **Glossar** (`CONTEXT.md`, die KI-Tester lesen es von dort) geschärft wie in der Spec unter „Weitere Hinweise“:
    Füllteil „… den ein anderer Strahl an einem seiner Spiegel trifft“, Abschalten „Licht in der Farbe des Ziels“, bei
    Abschalten und Falle die Abgrenzung.
  - **Referenz:** der Platz in der Reihenfolge im Spiel, der Grad aus den Leveldaten, die Grenzen aus der Reihenfolge
    (`GRADES`, `reference`). `prepare.mjs` hält die Referenz jedes Levels in `lauf.json` fest, `merge.mjs` rechnet mit
    ihr statt neu.
  - **Versionen** (`VERSIONS`): Jeder Eintrag wird nach der Referenz seiner Version geprüft. Die 43 Einträge von
    Ablauf 1 bleiben gültig (heutige Reihenfolge, vorläufige Grade, jetzt `PROVISIONAL_GRADES`).
  - **Anker** (`anchors.json`, Begründungen dort): A1 1 Zickzack, A2 30 Zusammenfluss, A3 33 Glasfenster, A4 97
    Lichtbogen, A5 105 Oase, A6 137 Lichtbrücke, A7 138 Sternenstaub, A8 145 Pulsar. Keiner hat einen Ausschlussgrund
    oder steht auf der Prüfliste; nur A3 steht auf der Duldungsliste (ohne nötige Kernidee). Wo einer nicht genau am
    Ende steht (A2, A4, A5, A8), haben alle Level bis zum Ende einen Ausschlussgrund oder stehen auf der Prüfliste.
  - `shots.mjs` nimmt jetzt `LEISE_CPU=50` an, wie README und `leise.sh` es für die Screenshots erlauben.
- **Probelauf 3** (`tests/output/ki-tester/probelauf-3/`, nicht versioniert), mit `--anker` und 4 Leveln, an denen
  das geschärfte Glossar zählt: 15 Zwillinge (leicht; in Ablauf 1 sahen beide eine Falle mit Grün auf dem roten
  Ziel), 35 Glasmurmel (mittel; zwei Füllteile: den einen kreuzt ein fremder Strahl nur in einer leeren Zelle, am
  anderen trifft ein fremder blauer Strahl den drehbaren Spiegel (6,3), dort sagt das geschärfte Glossar eher
  Einstieg), 39 Lichtschacht (mittel; in Ablauf 1 beide Abschalten mit falschem Weiss), 143 Morgenröte (sehr schwer;
  in Ablauf 1 beide Falle, die Erkennung sagt Abschalten). Kennungen: L1 Glasmurmel, L2 Morgenröte, L3 Zwillinge,
  L4 Lichtschacht. 24 Aufnahmen mit `LEISE_CPU=50`, 10,4 s je Aufnahme, zusammen 4 min 51 s.
- **Offen nach Stufe A, erledigt in Stufe B:** die Regel für die Prüfliste, die Eichmenge nach Probelauf 3 und der
  Kopf von `abschalten.mjs` (siehe unten). „mittel“ bleibt für die Einordnung grob (A3 33 bis A4 97); Entscheid des
  Nutzers: Die Einordnung bleibt, wie sie ist, liegt der neue Platz im Bereich zwischen zwei Ankern, gilt die Formel.

**Probelauf 3, Auswertung (Ablauf 2, 12 Einträge, vom Koordinator zusammengeführt).**
- **Das geschärfte Glossar wirkt:**
  - 143 Morgenröte: Beide sehen jetzt Abschalten („das gelbe Ziel leuchtet schon … muss abgeschaltet werden“), in
    Ablauf 1 nannten beide eine Falle. Die Erkennung sagt Abschalten.
  - 39 Lichtschacht: Keiner nennt mehr Abschalten (Ablauf 1: beide), A nennt das weiss beleuchtete blaue Ziel „sofort
    als Fehler erkennbar“. A sieht Farben abzählen, B keine Kernidee; die Erkennung findet keine.
  - 35 Glasmurmel: Beide lehnen mit Füllteil ab, am Strang (0,0)–(0,1)–(4,1), weil „kein anderer Strahl diese Spiegel
    trifft“, also wörtlich nach dem neuen Kriterium. Den zweiten Strang, dessen Spiegel (6,3) ein fremdes Blau trifft,
    nennt keiner Füllteil; das ist nach dem Glossar ein Einstieg, die Erkennung zählt ihn als Füllteil. Beide nennen
    dazu Zerfall, die Erkennung nicht.
  - 15 Zwillinge: Beide nennen weiter eine Falle. Ihre Beschreibung: Fächert das Prisma nach Ost, trifft Rot das Ziel
    direkt, aber Grün kommt über den festen Spiegel (3,1) mit; in der Lösung läuft Rot über einen Spiegel. Die Falle
    ist also der direkte Weg des Rots, und die Lösung bringt dasselbe Rot auf einem anderen Weg hin: eine Falle im
    neuen Sinn, kein Fehler im Glossar. „Grün auf das rote Ziel“ (Ticket 13) beschrieb nur die Folge. Die Erkennung
    zählt sie nicht, weil das Ziel dabei falsches Licht bekommt und die Stellung so auf den ersten Blick widerlegt ist
    (Tickets 10 und 11); A nennt sie „eine kleine Falle“. Dem Glossar fehlt nur dieser Zusatz.
- **Einigkeit:** Alle 8 Anker ordnen sich bei sich ein. Ablehnung in 12 von 12 gleich, Aha-Moment in 11 von 12 (nicht
  bei Lichtschacht). Einordnung der 4 Level: zweimal gleich, zweimal benachbart. Gefühl 6-mal gleich, sonst um 1
  verschieden (Mittel A 3,83, B 3,42). Lesbarkeit auf dem Desktop 7-mal, auf dem Handy 8-mal gleich, sonst um 1.
- **Korrekturen** (Probelauf, gelten nicht): Morgenröte −5 → 138 (beide bei A6), Zwillinge +5 → 20 (beide A2-A3).
- **Spielwert:** Die Gefühle kommen in die Eichmenge. Die Übereinstimmung hält und steigt: 0,345 ohne Ausschlussgrund
  (67 Level, gerundet 0,35), 0,322 über alle (114, gerundet 0,32); vorher 0,32 (63) und 0,29 (109). Im Testnamen
  standen die alten Anzahlen; jetzt gibt der Test die Werte aus.
- **Auftrag vor den Läufen der 51:** keine Änderung nötig. Der fehlende Zusatz bei Falle betrifft nur den
  Aha-Moment; Platz und Ablehnung hängen nicht an den Kernideen. Wiederkehrend in der Lesbarkeit ist die kleine
  Ausgangsrichtung des Kombinators (Zwillinge beide, Morgenröte B); das ist Darstellung, nicht Auftrag.

**Stufe B (17.10.2026): Regel für die Prüfliste, Zwischenspeicher der Anker-Bilder, Aufteilung der 51.**
- **Regel** in `tools/levelliste.mjs` (`reihenfolge`, `zustimmung`, `korrigiere`, `ordne` mit `zurFormel`), benutzt von
  `ordne-level.mjs` und `tests/levelliste.test.mjs`; nicht im Teil des Ablaufs, der in den Fingerabdruck eingeht (er
  bleibt `066a880667331a43`):
  - Es zählen nur Einträge von Ablauf 2 ohne Probeläufe und ohne Anker (`zaehlt`), je Level der Prüfliste höchstens
    einer, sonst ein Fehler. Nach dem Review genau nach dem Entscheid: nur Läufe `pruefung-…`, also auch keine
    Eichläufe.
  - Der Platz der Formel kommt aus den Daten: `ordne()` rechnet ihn aus der Schwierigkeit, wie für die Prüfliste.
  - Zustimmung je KI-Tester: Der Platz der Formel liegt in seinem Bereich der Einordnung oder näher daran als der alte
    Platz, gerechnet mit den Plätzen der Anker aus dem Eintrag. Stimmen beide zu, steht das Level nach der Formel wie
    die übrigen, auch über 10 Plätze hinaus; sonst bleibt es am alten Platz.
  - Eigene Korrektur von dort, wo es steht: am alten Platz das Ergebnis aus dem Protokoll, am Platz der Formel
    dieselbe Regel von `merge` mit dem Grad dort (Plan aus Ticket 05: „Von dort aus gilt dieselbe Korrektur“).
    Höchstens 5 Plätze und nie aus dem Abschnitt des eigenen Grads (`korrigiere`).
  - Lehnen beide ab (beim Grad dort, wo das Level steht), wird es nicht korrigiert und kommt auf die Duldungsliste,
    neuer Grund `abgelehnt` („von beiden KI-Testern abgelehnt“). `ordne-level.mjs --schreiben` nimmt die abgelehnten
    Level auch in die ursprüngliche Liste auf; der Test erlaubt dort nur Level, die beide KI-Tester in einem zählenden
    Lauf abgelehnt haben. Ein abgelehntes Level geht trotzdem auf den Platz der Formel, wenn beide zustimmen.
  - Test „Jede Abweichung vom Platz der Formel ist im Protokoll begründet“: Die Reihenfolge im Spiel ist die von
    `reihenfolge()` aus Formel und zählenden Einträgen; am alten Platz steht ein Level der Prüfliste nur ohne
    Zustimmung beider; jede eigene Korrektur hat ein Urteil, höchstens 5 Plätze und keine Ablehnung. Heute: 0 von 51
    beurteilt. Dazu die Regel an erfundenen Urteilen auf den heutigen Leveln (zur Formel mit Korrektur −1, am alten
    Platz mit +5, abgelehnt wegen Zerfall erst in „mittel“).
  - Folge von „beim Grad dort“: 17, 27 und 32 kämen mit der Formel nach „mittel“; dort zählen Füllteil und Zerfall
    (27 Spiegelbild: in Probelauf 2 nannten beide Zerfall), und Ticket 15 hat für 17 und 32 die Duldungsliste noch
    offen gelassen (Entscheid des Nutzers).
- **Zwischenspeicher** in `prepare.mjs`, `tests/output/ki-tester/anker-bilder/`: Schlüssel aus Fingerabdruck,
  Inhalt von `index.html`, `vendor/`, `backgrounds/`, `shots.mjs`, `chrome.mjs`, dem Chrome (Pfad, Grösse,
  Zeitstempel, Versionsordner), Leveldaten, Platz und Kennung des Ankers. Nach Ticket 17 (neue Kopfzeile in
  `index.html`) werden die Bilder also neu aufgenommen. `--ohne-zwischenspeicher` erzwingt es.
  - Beleg mit zwei Wegwerf-Läufen nur mit den Ankern: Der erste nahm die 16 Bilder neu auf (175 s); sie sind
    byte-gleich mit denen aus Probelauf 3, obwohl seither Kommentare in `shots.mjs` und `chrome.mjs` geändert haben.
    Der zweite nahm alle aus dem Zwischenspeicher, ohne Chrome, wieder byte-gleich.
  - Ein Lauf mit 7–8 Leveln braucht so 14–16 statt 30–32 Aufnahmen, bei rund 10,4 s je Aufnahme etwa 2,6 statt
    5,4 min. Der Zwischenspeicher ist gefüllt; er gilt, solange sich keine der Eingaben ändert.
- **Aufteilung der 51 auf 7 Läufe** (Plätze im Spiel = heutige Plätze; Ziel: je Lauf etwa gleich viele nach vorn und
  nach hinten, die Level ausserhalb von „mittel“ und die mit Gradwechsel verteilt, höchstens ein Level mit
  Ausschlussgrund, keine Nachbarn bis 3 Plätze im selben Lauf):

  | Lauf | Plätze | vorn/hinten | Grade l/m/s/ss | Gradwechsel | Ausschlussgrund |
  |---|---|---|---|---|---|
  | pruefung-1 | 42 64 75 81 85 94 109 134 | 4/4 | 0/6/2/0 | 81, 94, 109 | 134 |
  | pruefung-2 | 45 49 63 74 80 95 110 144 | 4/4 | 0/6/1/1 | 110, 144 | – |
  | pruefung-3 | 17 51 65 77 84 93 108 | 4/3 | 1/5/1/0 | 17, 77, 108 | 77 |
  | pruefung-4 | 27 41 50 55 67 100 112 | 4/3 | 1/5/1/0 | 27, 41, 112 | 67 |
  | pruefung-5 | 32 52 66 70 83 99 111 | 4/3 | 1/5/1/0 | 32, 111 | 111 |
  | pruefung-6 | 36 58 76 82 87 102 117 | 4/3 | 0/6/1/0 | 82, 117 | 36 |
  | pruefung-7 | 61 72 79 86 91 107 122 | 4/3 | 0/5/2/0 | 91, 107 | 86 |

  Aufruf je Lauf, ohne `--anker`: `LEISE_CPU=50 sh tools/leise.sh node tools/ki-tester/prepare.mjs pruefung-1 42 64 75
  81 85 94 109 134` (ebenso die übrigen). Die Level mit nur Kernidee oder Spielwert auf der Duldungsliste (27) sind
  mit 3–4 je Lauf verteilt.
