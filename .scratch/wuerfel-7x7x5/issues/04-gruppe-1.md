# 04: Würfel-Gruppe 1 in 7 × 7 × 5 (100 Level)

**Spec:** ../spec.md

**Blocked by:** 03

**Status:** resolved

**What to build:** 25 neue Würfel-Level 7 × 7 × 5 nach dem Ablauf einer Gruppe (Spec `wuerfel-500`), alle nach
der Ebenen-Regel. Neu je Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 6 / 2. Danach im Spiel: 21 / 56 / 16 / 7.

- [x] 25 neue Level, je Grad wie oben; Fehlmengen begründet und für die nächste Gruppe vermerkt.
- [x] Genau eine Lösung, Beurteilung bestanden, ab „mittel“ nötige Kernidee, Ebenen-Regel erfüllt, keinem anderen
      Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt; von beiden abgelehnte sind ersetzt.
- [x] Namen ohne Freigabe, eindeutig, gut unterscheidbar; Herkunft nachbaubar.
- [x] Golden-Referenz, alle Tests grün, Stichproben der Screenshots, auf `feature/3d-wuerfel` gepusht; Review.

## Comments

**26.10.2026, Koordinator: erledigt.** Im Spiel stehen jetzt 100 Würfel-Level, je Grad 21 / 56 / 16 / 7, genau wie in der Tabelle.

- **Wahl:** `wuerfel.mjs wahl 1` über den umgerechneten Pool und `pool-1-*`.
  - 3568 Kandidaten, 828 kommen in Frage.
  - 2740 fallen weg, weil sie einen zweiten unabhängigen Teil mit drehbarem Element haben.
  - Gewählt 4 / 13 / 6 / 2, mit 4 Tauschen gegen Häufungen.
- **KI-Tester:**
  - Der erste Lauf unter W5, wuerfel-1-q, liess sich nicht zusammenführen. Nach dem Urteil der Tester rückt Ewige Wiederkehr (A8) vor Gauss (A7), dann stehen die Anker nicht nach Platz.
  - Darum gibt es W6 mit A7 Möbiusband und A8 Gauss. Beide sind beurteilt und haben keine eigene Korrektur.
  - Der Lauf wurde unter W6 neu gemacht, als wuerfel-1-q2. Die Antworten aus wuerfel-1-q sind verworfen und nicht im Protokoll.
  - **Ergebnis:** Kein Kandidat ist abgelehnt. Einmal Knäuel nur von A, bei zwei Kandidaten; das zählt nicht.
- **Fehler in der Korrektur durch die KI-Tester behoben** (`tools/levelliste.mjs`, `heutigeAnker`, nur Würfel):
  - Bisher rechnete die eigene Korrektur eines Urteils mit den Plätzen der Anker beim Lauf.
  - Wächst das Spiel, rücken die Anker nach hinten. Die 75 Level, beurteilt bei 75 Leveln, wollten bei 100 darum fast alle −5, und „sehr schwer“ kehrte sich um.
  - Jetzt werden die Anker über ihren Namen (`VERSIONS[…].ankerNamen`) auf ihren Platz in der heutigen Formel umgerechnet. Die Korrekturen entsprechen damit wieder denen beim Zusammenführen.
  - Die flachen Level sind unverändert.
  - Der Fehler bestand schon im 7 × 7 × 7, dort wohl schwächer, weil die Gruppen kleiner wuchsen.
- **Häufungen:** Mit Gruppe 1 ist keine mehr offen, auch die aus dem Bestand allein nicht.
  - Die Grenz-Duldung (Stockwerk) wird nicht mehr gebraucht, `GRENZ_DULDUNG = []`.
- **Namen:** Keksdose, Bauernhof, Pantoffel, Mütze, Deichtor, Trockendock, Drehbank, Museum, Mandoline, Tapisserie, Alphorn, Posaune, Kombüse, Trommel, Cembalo, Palisade, Taubenschlag, Kölner Dom, Kyoto, Ephesos, Karthago, Prambanan, Nazca, Julia-Menge, Turing.
  - Die 225 Namen der entfernten Level stehen wieder im Vorrat, daher auch Palisade und Taubenschlag.
- **Golden und Tests:** Golden nachgeführt (609 Level), alle Tests mit Exit 0.

**26.10.2026, Reviewer (Tickets 03 und 04), Branch `review/quader-04`:** in Ordnung, mit drei kleinen Korrekturen.

- **Behoben:**
  - **Test rot:** In `wuerfelliste.test.mjs` schlug „Grenz-Duldung: ein leichtes Level der Liste …“ fehl (Exit 1). Er
    nahm `GRENZ_DULDUNG[0]`, und die Liste ist jetzt leer. Neu nimmt `wuerfelReihenfolge` dafür `obenAuch` (Vorgabe
    `GRENZ_DULDUNG`), und der Test gibt eine eigene Liste. So bleibt der Mechanismus geprüft.
  - **Namen: Cembalo, Palisade und Taubenschlag heissen jetzt Ölmühle, Fallgatter und Bienenkorb.**
    - Alle drei sind Namen entfernter Level (mit anderem Seed).
    - Der Fortschritt im Browser zählt nach Namen. Wer bei 300 Würfel-Leveln Palisade gelöst hatte, sähe die neue
      Palisade als gelöst, denn `progress.load` filtert nur unbekannte Namen.
    - Ausserdem gibt es im Würfel schon viele Instrumente (Review Ticket 12 der Spec wuerfel-500).
    - Golden ist nachgeführt.
  - Die verwaiste JSDoc-Zeile vor `WUERFEL` ist gestrichen.
- **Neue Tests:**
  - `heutigeAnker` an einem erfundenen Fall. Mit den heutigen Plätzen ist die Korrektur −2, mit den Plätzen beim Lauf
    wäre sie −4. Rückfall, wenn ein Anker nicht im Spiel steht oder die Anker nicht nach Platz stehen.
  - Über alle 100 Urteile: Jedes findet seine Anker im Spiel und nach Platz in der Formel, ohne Rückfall.
  - Der Test der Verteilung prüft auch die Spalte „neu“ beider Tabellen.
- **Geprüft, in Ordnung:**
  - `heutigeAnker` rechnet Level und Anker im selben Rahmen: `formel`, vor den eigenen Korrekturen, denn
    `referenz.position` ist `formel[i]`.
  - Flache Einträge haben kein `wuerfel` und bleiben wie bisher (golden und levelliste grün).
  - Urteile zu entfernten Leveln zählen nicht.
  - `bestandNach` und `anteilig` stimmen mit beiden Tabellen überein, auch mit wuerfel-500 bis Gruppe 12.
  - Protokoll:
    - wuerfel-0-1 bis -3: W4, 67 Level.
    - wuerfel-0-4: W5, die 8 Anker aus W4.
    - wuerfel-1-q2: W6, 25 Kandidaten.
    - Zusammen 100 verschiedene Level, keines abgelehnt.
  - Stichproben der Bilder aus wuerfel-1-q2 (L2, L10, L13): Die Level gehen über mehrere Ebenen, mit Elementen unten.
- **Offen, für Ticket 05:**
  - Der Rückfall in `heutigeAnker` geschieht still. Wird ein Anker-Level umbenannt, rechnen seine Urteile wieder mit
    den Plätzen beim Lauf, also mit dem alten Fehler. Der neue Test fängt das ab. Ein Fehler statt des Rückfalls wäre
    vielleicht besser.
  - **W6:** Möbiusband (A7, „unten“) und Gauss (A8, „oben“) stehen im Spiel jetzt auf Platz 99 und 100, nicht auf
    97 und 98 wie in der Begründung. Banach-Tarski, Ewige Wiederkehr und Ikosaeder rücken vor sie.
    - Dadurch gibt es in „sehr schwer“ kaum noch „>A8“, und das untere Ende ist nicht verankert.
    - Eine W7 prüfen, sobald die Vorschau von Gruppe 2 steht.
  - **W5 A2 (Zahnbürste):** In der Begründung heisst es „Picknick, Stockwerk und Kommode sind Anker von W4“. Das stimmt
    nur für Picknick. Eine Korrektur würde den Fingerabdruck ändern, darum ist es nur vermerkt.
  - **Namen entfernter Level wieder vergeben:** Die Spec lässt es zu. Weil der Fortschritt nach Namen zählt, besser
    nicht. Falls es gewollt ist, eine Frage an den Nutzer.
