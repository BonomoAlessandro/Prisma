# Spec: 100 Würfel-Level

Status: ready-for-agent

Begriffe nach `CONTEXT.md`. Baut auf den Specs `.scratch/levelgenerator/spec.md` (Beurteilung, Generator, KI-Tester,
Levelliste) und `.scratch/500-level/spec.md` (Ablauf einer Gruppe) auf; deren Regeln gelten weiter, ausser wo hier
etwas anderes steht. Entscheide des Nutzers vom 24.10.2026.

## Ziel

- **100 neue Würfel-Level** aus dem Generator in `tools/generator/`, alle im Würfel **7 × 7 × 7**, mit denselben
  Qualitätsmerkmalen wie die flachen Level: genau eine Lösung, Beurteilung bestanden, ab „mittel“ eine nötige
  Kernidee, keinem anderen Level zu ähnlich, von beiden KI-Testern beurteilt, Namen im bisherigen Stil.
- **Verteilung der Grade** wie das Ziel des Ausbaus auf 500: **17 leicht / 53 mittel / 21 schwer / 9 sehr schwer**.
  Der Grad folgt den festen Schwellen (`tools/beurteilung/grad.mjs`).
- **Ohne Einführung:** Es gibt kein Würfel-Tutorial. Die handgebauten Level Aufzug und Kern bleiben im Spiel und
  werden wie die neuen nach der Formel eingeordnet; zusammen sind es danach 102 Würfel-Level. Sie zählen nicht zu den
  100 und nicht zur Verteilung oben.
- Die flachen Level (Tutorial und 500) bleiben unverändert (`tests/golden.mjs`).

## Branch

Alles bleibt auf **`feature/3d-wuerfel`**: Vorbereitung und Gruppen werden dort committet und gepusht, nicht nach
main gemergt. Wann der Würfel nach main kommt, entscheidet der Nutzer. Neues von main kommt bei Bedarf per Merge
von main in den Branch.

## Vorgehen in kleinen Gruppen

- Nach der Vorbereitung (Ticket 01) kommen die neuen Level in **4 Gruppen zu je 25** (Tickets 02–05).
- **Jede Gruppe ist ein fertiger Stand:** auf `feature/3d-wuerfel` gepusht, alle Tests grün, die Verteilung der Grade
  so nahe wie möglich an der Zielverteilung. Der Nutzer kann nach jeder Gruppe pausieren oder aufhören.
- Bestand der neuen Level nach jeder Gruppe (leicht / mittel / schwer / sehr schwer), ohne Aufzug und Kern:

  | Gruppe | Ticket | neue Level | Bestand | neu in der Gruppe |
  |---|---|---|---|---|
  | 1 | 02 | 25 | 4 / 14 / 5 / 2 | 4 / 14 / 5 / 2 |
  | 2 | 03 | 50 | 8 / 27 / 11 / 4 | 4 / 13 / 6 / 2 |
  | 3 | 04 | 75 | 13 / 40 / 16 / 6 | 5 / 13 / 5 / 2 |
  | 4 | 05 | 100 | 17 / 53 / 21 / 9 | 4 / 13 / 5 / 3 |

- Liefert ein Grad zu wenig (am ehesten „schwer“ und „sehr schwer“, siehe Probe unten), wird das im Ticket
  festgehalten und in der nächsten Gruppe nachgeholt.
- Vor jeder Gruppe fragt der Koordinator den Nutzer nicht erneut.

## Ablauf einer Gruppe

Wie in `.scratch/500-level/spec.md`, mit dem Würfel statt des flachen Felds:

1. **Kandidaten** aus dem Generator mit der Würfel-Feldform `feldformVon({ dim: 3, size: 7 })`, mit Reserve.
2. **Ähnlichkeit:** kein Kandidat einem Würfel-Level im Spiel oder einem anderen Kandidaten zu ähnlich.
3. **Einordnen** in die Reihenfolge der Würfel-Level nach der Formel.
4. **KI-Tester:** beide beurteilen jeden Kandidaten; die Regeln für Ablehnung, Ersatz und Korrektur bleiben.
5. **Namen** vergibt der Koordinator ohne Freigabe des Nutzers: eindeutig über flache und Würfel-Level, keiner von
   der Liste entfernter Level.
6. **Abschluss:** Leveldaten, Golden-Referenz, Protokoll, alle Tests grün, Herkunft jedes Levels nachbaubar,
   Ergebnis unter `## Comments`, Push.

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

- Ein Würfel-Tutorial, andere Würfelgrössen als 7 × 7 × 7.
- Änderungen an der Strahlregel, an den Schwellen der Grade oder an den Gewichten der Beurteilung.
- Neue Kernideen für den Würfel (etwa den Lockvogel möglich machen).
- Der Merge nach main.
