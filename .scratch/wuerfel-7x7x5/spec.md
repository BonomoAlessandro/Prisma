# Spec: Würfel-Level 7 × 7 × 5 über mindestens 3 Ebenen

Status: ready-for-agent

Begriffe nach `CONTEXT.md`. Baut auf `.scratch/wuerfel-500/spec.md` auf: Ablauf einer Gruppe, Qualität, Namen,
Reihenfolge, KI-Tester und Rechnerlast. Deren Regeln gelten weiter, ausser wo hier etwas anderes steht.

Entscheid des Nutzers vom 26.10.2026, nachdem er Würfel-Level angesehen hat: „Viele davon sind alle auf einer Ebene,
einfach nicht am Boden … Das könnte gleich ein 2D-Level sein.“

**Dauerregel:** Form und Ebenen-Regel gelten ab jetzt immer für jedes Würfel-Level, ausser der Nutzer sagt
ausdrücklich etwas anderes.

- Form: 7 × 7 × 5.
- Ebenen-Regel: mindestens 3 Ebenen, unterstes Element am Boden.
- Das gilt für jede künftige Gruppe, jeden Pool und jede andere Spec.

Zusatz des Nutzers vom 26.10.2026: „Wichtig ist, dass das neu eine Regel ist, die immer auf die Würfel angewandt werden
soll, ausser ich sage was anderes.“

Im Code ist sie eine feste Regel der Würfel-Levelliste, ohne Duldungsliste.

## Ziel

- **Der Würfel wird flacher:** Grundfläche **7 × 7**, Höhe **5** (Ebenen y = 0 … 4) statt 7 × 7 × 7.
  - Das gilt für alle Würfel-Level im Spiel und für alle künftigen.
  - Auch die Tickets 14–21 der Spec `wuerfel-500` kommen danach in 7 × 7 × 5.
- **Mindestens 3 Ebenen:** In der Lösung trifft der Strahl Elemente auf mindestens **3 verschiedenen Ebenen** y.
  - Quellen und Ziele zählen mit, ebenso alle anderen Elemente.
  - Ein Element, das der Strahl in der Lösung nicht berührt, zählt nicht. Sonst genügte ein Zierstück auf einer
    dritten Ebene.
- **Am Boden:** Das unterste Element steht auf der Ebene y = 0. Kein Level schwebt.
- **Die 300 Würfel-Level werden überarbeitet.** Danach stehen wieder **300** im Spiel.
  - Verteilung: 51 / 159 / 63 / 27, also 17 / 53 / 21 / 9 %.
  - Dieselbe Qualität wie bisher: genau eine Lösung, Beurteilung bestanden, ab „mittel“ eine nötige Kernidee, keinem
    anderen zu ähnlich, von beiden KI-Testern beurteilt, Namen vergeben, Herkunft nachbaubar.
  - **Behalten:** Manche Level gehen schon über mindestens 3 Ebenen, und ihre Elemente passen in 5 Ebenen.
    - Zählung vom 26.10.2026: 75 Level, je Grad 17 / 43 / 10 / 5.
    - Sie werden nach unten geschoben, bis das unterste Element auf y = 0 steht.
    - Ihre Lösung bleibt dieselbe, denn über der obersten Ebene mit Elementen ist nur leerer Raum.
    - Sie behalten Namen und Herkunft, mit einem Vermerk der Verschiebung.
    - Sie werden neu beurteilt, und beide KI-Tester beurteilen sie neu, denn Abdruck und Bilder ändern sich.
  - **Ersetzen:** Die übrigen 225 kommen aus dem Spiel. Gruppen zu 25 ersetzen sie durch neue.
    - Ihre Namen werden wieder frei.
    - Sie stehen nicht auf der Liste entfernter Level.
- Die flachen Level bleiben unverändert (`tests/golden.mjs`).

## Branch

Alles bleibt auf **`feature/3d-wuerfel`** und kommt nicht nach main.

- main hat seit 26.10.2026 den Stand mit 300 Würfel-Leveln 7 × 7 × 7.
- Wann der neue Stand nach main kommt, entscheidet der Nutzer.

## Das Modell

- **Leveldaten:** `{ name, dim: 3, size: 7, height: 5, … }`.
  - `size` ist die Kantenlänge der Grundfläche (x und z).
  - `height` ist die Zahl der Ebenen (y).
  - Ohne `height` gilt `size`, also ein Würfel wie bisher. Das braucht etwa die Testdaten Aufzug und Kern.
- **Spiel (`index.html`):** Diese Teile rechnen mit der Höhe:
  - Brett und Strahlregel
  - Darstellung: Rahmen, Ebenen, Kamera, Anklicken
  - Levelauswahl

  Ein Strahl, der oben aus dem Feld läuft, endet am Rand wie an jeder anderen Seite.
- **Werkzeuge:** Diese Teile rechnen ebenfalls mit der Höhe:
  - Feldform (`feldform-wuerfel.mjs`, `feldformVon`)
  - Generator und Beurteilung
  - Ähnlichkeit: Es zählen nur die Symmetrien, die y erhalten, also die acht der Grundfläche. Ein Würfel und ein
    flacherer Quader sind nie ähnlich.
  - KI-Tester, mit Text und Bildern
  - Leveldaten, Wahl und Ordnen
- **Die Ebenen-Regel** ist eine Regel der Würfel-Levelliste, wie `verletzt` in `tools/wuerfelliste.mjs`.
  - Ein Level, das sie nicht erfüllt, kommt nicht ins Spiel.
  - `tools/wuerfel.mjs wahl` nimmt nur Kandidaten, die sie erfüllen.
  - Ein Test prüft jedes Würfel-Level im Spiel darauf.

## Kandidaten

- **Pool umrechnen:** Ein Teil der Kandidaten im Pool 7 × 7 × 7 (`tests/output/wuerfel/`) passt nach dem
  Herunterschieben in 7 × 7 × 5 mit mindestens 3 Ebenen.
  - Zählung vom 26.10.2026: etwa 1300 von 4872, je Grad etwa 430 / 600 / 220 / 50.
  - Diese Kandidaten werden umgerechnet und neu beurteilt.
  - Ihre Herkunft: Auftrag, Seed, Stand des Generators im 7 × 7 × 7 und die Verschiebung.
- **Neuer Pool 7 × 7 × 5:** Der Generator baut direkt im Quader.
  - Was die Ebenen-Regel nicht erfüllt, verwirft er.
  - Das ist besonders für „schwer“ und „sehr schwer“ nötig, denn dort ist der umgerechnete Pool knapp.
  - Entscheid vom 24.10.2026: „Der Pool kann fast nicht zu gross sein.“

## Vorgehen

1. Ticket 01: Höhe im Modell, im Spiel und in den Werkzeugen.
2. Ticket 02: Ebenen-Regel, Pool umrechnen, Generator im Quader, Probe der Ausbeute je Grad.
3. Ticket 03: Bestand umstellen. Die 75 Level bleiben (verschoben, neu beurteilt, von den KI-Testern beurteilt), die
   übrigen kommen aus dem Spiel.
4. Tickets 04–12: 9 Gruppen zu 25, bis wieder 300 Level im Spiel stehen.
   - Die Tabelle geht vom Bestand 17 / 43 / 10 / 5 aus und zeigt leicht / mittel / schwer / sehr schwer.
   - Ändert die Neubeurteilung in Ticket 03 Grade, rechnet der Koordinator die Tabelle mit demselben Verfahren neu:
     grösster Rest, bei gleichem Rest der leichtere Grad.

   | Gruppe | Ticket | Level | Bestand | neu in der Gruppe |
   |---|---|---|---|---|
   | 1 | 04 | 100 | 21 / 56 / 16 / 7 | 4 / 13 / 6 / 2 |
   | 2 | 05 | 125 | 24 / 69 / 22 / 10 | 3 / 13 / 6 / 3 |
   | 3 | 06 | 150 | 28 / 82 / 28 / 12 | 4 / 13 / 6 / 2 |
   | 4 | 07 | 175 | 32 / 95 / 33 / 15 | 4 / 13 / 5 / 3 |
   | 5 | 08 | 200 | 36 / 108 / 39 / 17 | 4 / 13 / 6 / 2 |
   | 6 | 09 | 225 | 40 / 120 / 45 / 20 | 4 / 12 / 6 / 3 |
   | 7 | 10 | 250 | 44 / 133 / 51 / 22 | 4 / 13 / 6 / 2 |
   | 8 | 11 | 275 | 47 / 146 / 57 / 25 | 3 / 13 / 6 / 3 |
   | 9 | 12 | 300 | 51 / 159 / 63 / 27 | 4 / 13 / 6 / 2 |

5. Bei 300 Leveln wird wie bisher pausiert.
   - Weiter bis 500 geht es erst auf Anweisung des Nutzers.
   - Das sind die Tickets 14–21 der Spec `wuerfel-500`, in 7 × 7 × 5.

Nach jedem Ticket gibt es einen Stand auf `feature/3d-wuerfel`, und alle Tests sind grün. Danach beginnt gleich das
nächste Ticket, ohne Rückfrage.

## Reviews

- Die Tickets 01 und 02 ändern Code und bekommen ein Review.
- Die Tickets 03–12 bekommen ein Review wie die Gruppen bisher: nach jedem Ticket, für Namen und Daten.

## Rechnerlast

Schwere Läufe laufen nur über `tools/leise.sh` mit der lokalen Grenze, und nie mehrere parallel.

## Nicht Teil dieser Spec

- Andere Grössen als 7 × 7 × 5.
- Änderungen an der Strahlregel, an den Schwellen der Grade oder an den Gewichten der Beurteilung.
- Neue Kernideen.
