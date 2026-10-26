# Spec: 500 Würfel-Level

Status: ready-for-agent

Begriffe nach `CONTEXT.md`. Baut auf den Specs `.scratch/levelgenerator/spec.md` (Beurteilung, Generator, KI-Tester,
Levelliste) und `.scratch/500-level/spec.md` (Ablauf einer Gruppe) auf; deren Regeln gelten weiter, ausser wo hier
etwas anderes steht. Entscheide des Nutzers vom 24.10.2026.

## Ziel

- **500 neue Würfel-Level** aus dem Generator in `tools/generator/`, alle im Würfel **7 × 7 × 7**, mit denselben
  Qualitätsmerkmalen wie die flachen Level: genau eine Lösung, Beurteilung bestanden, ab „mittel“ eine nötige
  Kernidee, keinem anderen Level zu ähnlich, von beiden KI-Testern beurteilt, Namen im bisherigen Stil.
- **Verteilung der Grade** wie das Ziel des Ausbaus auf 500: **17 leicht / 53 mittel / 21 schwer / 9 sehr schwer**.
  Der Grad folgt den festen Schwellen (`tools/beurteilung/grad.mjs`).
- **Bis der Nutzer anhält** (Entscheide vom 24.10.2026): Zuerst sollten es 100 sein (Tickets 01–05). Danach hat der
  Nutzer entschieden: Nach jedem fertigen Ticket beginnt der Koordinator gleich das nächste, auch nach Gruppe 4, bis
  der Nutzer sagt, dass es genug ist.
- **Ohne Einführung:** Es gibt kein Würfel-Tutorial. Die handgebauten Level Aufzug und Kern waren nur zum Testen da:
  Am 25.10.2026 (vor Gruppe 9, Ticket 10) hat der Nutzer sie aus dem Spiel genommen. Im Spiel stehen nur die Level aus
  dem Generator. Aufzug und Kern bleiben als Testdaten (`tests/wuerfel-handgebaut.mjs`), Kern als Anker nur in den
  Versionen W1 und W2 der KI-Tester.
- **Pause bei 300** (Entscheid vom 25.10.2026): Nach Gruppe 12 (Ticket 13, 300 Würfel-Level) hält der Koordinator an,
  bis der Nutzer weitergehen lässt.
- Die flachen Level (Tutorial und 500) bleiben unverändert (`tests/golden.mjs`).

## Branch

Alles bleibt auf **`feature/3d-wuerfel`**: Vorbereitung und Gruppen werden dort committet und gepusht, nicht nach
main gemergt. Wann der Würfel nach main kommt, entscheidet der Nutzer. Neues von main kommt bei Bedarf per Merge
von main in den Branch.

## Vorgehen in kleinen Gruppen

- Nach der Vorbereitung (Ticket 01) kommen die neuen Level in **20 Gruppen zu je 25** (Tickets 02–21).
- **Jede Gruppe ist ein fertiger Stand:** auf `feature/3d-wuerfel` gepusht, alle Tests grün, die Verteilung der Grade
  so nahe wie möglich an der Zielverteilung. Der Nutzer kann nach jeder Gruppe pausieren oder aufhören. Bestand und
  Anteil je Gruppe nach der Zielverteilung, gerundet nach dem grössten Rest; jeder Bestand ist auch für sich verteilt
  wie das Ziel.
- Bestand der neuen Level nach jeder Gruppe (leicht / mittel / schwer / sehr schwer):

  | Gruppe | Ticket | neue Level | Bestand | neu in der Gruppe |
  |---|---|---|---|---|
  | 1 | 02 | 25 | 5 / 13 / 5 / 2 | 5 / 13 / 5 / 2 |
  | 2 | 03 | 50 | 9 / 27 / 10 / 4 | 4 / 14 / 5 / 2 |
  | 3 | 04 | 75 | 13 / 40 / 16 / 6 | 4 / 13 / 6 / 2 |
  | 4 | 05 | 100 | 17 / 53 / 21 / 9 | 4 / 13 / 5 / 3 |
  | 5 | 06 | 125 | 22 / 66 / 26 / 11 | 5 / 13 / 5 / 2 |
  | 6 | 07 | 150 | 26 / 80 / 31 / 13 | 4 / 14 / 5 / 2 |
  | 7 | 08 | 175 | 30 / 93 / 37 / 15 | 4 / 13 / 6 / 2 |
  | 8 | 09 | 200 | 34 / 106 / 42 / 18 | 4 / 13 / 5 / 3 |
  | 9 | 10 | 225 | 39 / 119 / 47 / 20 | 5 / 13 / 5 / 2 |
  | 10 | 11 | 250 | 43 / 133 / 52 / 22 | 4 / 14 / 5 / 2 |
  | 11 | 12 | 275 | 47 / 146 / 58 / 24 | 4 / 13 / 6 / 2 |
  | 12 | 13 | 300 | 51 / 159 / 63 / 27 | 4 / 13 / 5 / 3 |
  | 13 | 14 | 325 | 56 / 172 / 68 / 29 | 5 / 13 / 5 / 2 |
  | 14 | 15 | 350 | 60 / 186 / 73 / 31 | 4 / 14 / 5 / 2 |
  | 15 | 16 | 375 | 64 / 199 / 79 / 33 | 4 / 13 / 6 / 2 |
  | 16 | 17 | 400 | 68 / 212 / 84 / 36 | 4 / 13 / 5 / 3 |
  | 17 | 18 | 425 | 73 / 225 / 89 / 38 | 5 / 13 / 5 / 2 |
  | 18 | 19 | 450 | 77 / 239 / 94 / 40 | 4 / 14 / 5 / 2 |
  | 19 | 20 | 475 | 81 / 252 / 100 / 42 | 4 / 13 / 6 / 2 |
  | 20 | 21 | 500 | 85 / 265 / 105 / 45 | 4 / 13 / 5 / 3 |

- Liefert ein Grad zu wenig (am ehesten „schwer“ und „sehr schwer“, siehe Probe unten), wird das im Ticket
  festgehalten und in der nächsten Gruppe nachgeholt.
- Vor jeder Gruppe fragt der Koordinator den Nutzer nicht erneut (siehe Ziel).

## Ablauf einer Gruppe

Wie in `.scratch/500-level/spec.md`, mit dem Würfel statt des flachen Felds:

1. **Kandidaten** aus dem Generator mit der Würfel-Feldform `feldformVon({ dim: 3, size: 7 })`, mit Reserve. Entscheid vom
   24.10.2026: ein grosser Vorrat für alle Gruppen (`tools/ausbau.mjs pool … --wuerfel`, unter `tests/output/wuerfel/`),
   „der Pool kann fast nicht zu gross sein“; reicht er für einen Grad nicht, wird er mit neuen Seeds vergrössert.
2. **Ähnlichkeit:** kein Kandidat einem Würfel-Level im Spiel oder einem anderen Kandidaten zu ähnlich.
3. **Einordnen** in die Reihenfolge der Würfel-Level nach der Formel.
4. **KI-Tester:** beide beurteilen jeden Kandidaten; die Regeln für Ablehnung, Ersatz und Korrektur bleiben. Der Koordinator
   verlangt im Auftrag an die Agents ausdrücklich alle vier Bilder je Level und Anker (Gruppe 2: beide sahen zuerst nur
   das Desktop-Bild und schätzten die Lesbarkeit am Handy). Nach jeder Gruppe kann eine neue Version der Würfel-Anker
   kommen (W2 nach Gruppe 1). Die Korrektur (höchstens ±5) rechnet `reihenfolge` vom Platz nach der Formel aus, nicht
   vom Platz der Vorschau, den die Tester sehen; `ergebnis` im Protokoll kann darum vom angewandten Wert abweichen
   (Review Ticket 04). Der Endplatz kann sich zudem durch die Häufungsregel und die Korrekturen anderer Level um mehr
   als 5 verschieben.
5. **Namen** vergibt der Koordinator ohne Freigabe des Nutzers: eindeutig über flache und Würfel-Level, keiner von
   der Liste entfernter Level, und gut unterscheidbar: kein Name, der einen anderen enthält oder dasselbe Grundwort
   trägt (…anlage, …hof, …kasten; Review Ticket 04).
6. **Abschluss:** Leveldaten, Golden-Referenz, Protokoll, alle Tests grün, Herkunft jedes Levels nachbaubar
   (Auftrag, Seed, Ziel und Stand des Codes, Review Ticket 02), Ergebnis unter `## Comments`, Push.

## Reihenfolge der Würfel-Level

Eine eigene Reihenfolge neben der flachen, mit denselben Regeln: Grad sinkt nie, das Mittel der Schwierigkeit je 10
Level steigt, dieselbe Haupt-Kernidee höchstens zweimal je 10 Level. Die Schwierigkeit kommt aus derselben
Beurteilung wie im flachen Feld. Sie ist an den flachen Leveln geeicht (ADR 0001), nicht an Würfeln; die KI-Tester
sind darum hier besonders wichtig. Weicht ihr Urteil im Würfel systematisch von der Formel ab, hält das der
Koordinator im Ticket fest, ohne Schwellen oder Gewichte zu ändern.

## Probe vom 24.10.2026 (Generator, 7 × 7 × 7, 10 Seeds je Auftrag)

- „leicht“ liefert in fast jedem Auftrag; „mittel“ mit Mischziel, Sammelstelle und Farben abzählen.
- „schwer“ und „sehr schwer“ nur in etwa 5–10 % der Seeds (Gründe meist Zerfall und Füllteil); je Seed höchstens
  wenige Sekunden. Mit einigen Tausend Seeds reicht das.
- Den Lockvogel baut der Generator im Würfel nie ein, „Falle“ nur in „leicht“. Das ist kein Ziel dieser Spec.

## Reviews

- **Ticket 01** ändert Code und bekommt ein Review nach dem Ticket.
- **Die Gruppen (Tickets 02–05)** erzeugen nur Leveldaten und bekommen kein Code-Review. Muss in einer Gruppe Code
  geändert werden, bekommt diese Änderung ein Review.

## Rechnerlast

Nur über `tools/leise.sh`, auf diesem Rechner nach der lokalen Grenze, nie mehrere schwere Läufe parallel.

## Nicht Teil dieser Spec

- Mehr als 500 neue Würfel-Level, ein Würfel-Tutorial.
- **Ab 26.10.2026 gilt für jedes Würfel-Level die Dauerregel aus `.scratch/wuerfel-7x7x5/spec.md`** (7 × 7 × 5, mindestens
  3 Ebenen, am Boden); die Tickets 14–21 kommen in 7 × 7 × 5.
- Änderungen an der Strahlregel, an den Schwellen der Grade oder an den Gewichten der Beurteilung.
- Neue Kernideen für den Würfel (etwa den Lockvogel möglich machen).
- Der Merge nach main.
