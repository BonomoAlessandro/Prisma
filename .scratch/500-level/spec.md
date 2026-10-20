# Spec: Ausbau auf 500 Level

Status: ready-for-agent

Begriffe nach `CONTEXT.md`. Baut auf der Spec `.scratch/levelgenerator/spec.md` auf (Beurteilung, Generator,
KI-Tester, Levelliste); deren Regeln gelten weiter, ausser wo hier etwas anderes steht. Entscheide des Nutzers vom
20.10.2026.

## Ziel

- Nach dem unveränderten Tutorial stehen **500 Level insgesamt**: die heutigen 150 bleiben, **350 kommen neu dazu**,
  alle aus dem Generator in `tools/generator/`.
- **Verteilung der Grade** am Ende (heute 31 / 74 / 32 / 13): weniger leichte, etwas mehr mittlere Level.

  | Grad | heute | Ziel | Anteil | neu |
  |---|---|---|---|---|
  | leicht | 31 | 85 | 17 % | 54 |
  | mittel | 74 | 265 | 53 % | 191 |
  | schwer | 32 | 105 | 21 % | 73 |
  | sehr schwer | 13 | 45 | 9 % | 32 |

- Der Grad folgt weiter den festen Schwellen (`tools/beurteilung/grad.mjs`); die Verteilung entsteht durch die Wahl
  der neuen Level, nicht durch neue Schwellen.

## Vorgehen in kleinen Gruppen

- Nach der Vorbereitung (Ticket 01) kommen die neuen Level in **10 Gruppen zu je 35 Level** (Tickets 02–11).
- **Jede Gruppe ist ein fertiger Stand:** auf main, alle Tests grün, und die Verteilung der Grade liegt so nahe wie
  möglich an der Zielverteilung. So kann der Nutzer nach jeder Gruppe pausieren oder ganz aufhören, ohne dass das
  Spiel schief verteilt ist.
- Bestand nach jeder Gruppe (leicht / mittel / schwer / sehr schwer):

  | Gruppe | Ticket | Level | Bestand | neu in der Gruppe |
  |---|---|---|---|---|
  | 1 | 02 | 185 | 37 / 93 / 39 / 16 | 6 / 19 / 7 / 3 |
  | 2 | 03 | 220 | 42 / 112 / 47 / 19 | 5 / 19 / 8 / 3 |
  | 3 | 04 | 255 | 47 / 131 / 54 / 23 | 5 / 19 / 7 / 4 |
  | 4 | 05 | 290 | 53 / 150 / 61 / 26 | 6 / 19 / 7 / 3 |
  | 5 | 06 | 325 | 58 / 170 / 68 / 29 | 5 / 20 / 7 / 3 |
  | 6 | 07 | 360 | 63 / 189 / 76 / 32 | 5 / 19 / 8 / 3 |
  | 7 | 08 | 395 | 69 / 208 / 83 / 35 | 6 / 19 / 7 / 3 |
  | 8 | 09 | 430 | 74 / 227 / 90 / 39 | 5 / 19 / 7 / 4 |
  | 9 | 10 | 465 | 79 / 246 / 98 / 42 | 5 / 19 / 8 / 3 |
  | 10 | 11 | 500 | 85 / 265 / 105 / 45 | 6 / 19 / 7 / 3 |

- Liefert ein Grad in einer Gruppe zu wenig (am ehesten „sehr schwer“), wird das im Ticket festgehalten und in der
  nächsten Gruppe nachgeholt; die Gruppe gilt trotzdem als fertig, wenn alle Tests grün sind.
- Vor jeder Gruppe fragt der Koordinator den Nutzer nicht erneut; der Nutzer meldet sich, wenn er pausieren oder
  aufhören will.

## Ablauf einer Gruppe

1. **Kandidaten:** Der Generator erzeugt je Grad und Kernidee Kandidaten (`tools/generiere.mjs`, unter dem Deckel nach
   `tools/leise.sh`), mit Reserve für Ablehnungen. Die Haupt-Kernideen werden so gewählt, dass „dieselbe Haupt-Kernidee
   höchstens zweimal je 10 Level“ auch nach dem Einfügen gilt.
2. **Ähnlichkeit:** Kein Kandidat ist einem Level im Spiel oder einem anderen Kandidaten zu ähnlich (Prüfung aus
   Ticket 01).
3. **Einordnen:** Die Formel ordnet jeden Kandidaten ein (`tools/ordne-level.mjs`).
4. **KI-Tester:** Beide KI-Tester beurteilen jeden Kandidaten (Lauf `ausbau-<gruppe>-…`). Die Regeln bleiben: Lehnen
   beide ab, kommt ein neuer Kandidat; Korrekturen höchstens 5 Plätze und nie über eine Gradgrenze.
5. **Namen:** Der Koordinator vergibt Namen im bisherigen Stil, eindeutig und nicht von der Liste entfernter Level.
   **Der Nutzer genehmigt die Namen nicht** (Entscheid vom 20.10.2026; ersetzt User Story 54 und die Haltepunkte der
   Tickets 23–26).
6. **Abschluss:** Leveldaten, Golden-Test-Referenz und Protokoll aktualisiert, alle Tests grün, Herkunft jedes Levels
   (Auftrag, Seed, Ziel-Schwierigkeit) nachbaubar, Ergebnis unter `## Comments` im Ticket, Merge nach main.

## Reviews

- **Ticket 01** ändert Code und bekommt wie bisher ein Review nach dem Ticket.
- **Die Gruppen (Tickets 02–11)** erzeugen nur Leveldaten und bekommen **kein Code-Review**. Die Qualität sichern die
  Beurteilung, die KI-Tester und die Tests der Levelliste. Muss in einer Gruppe doch Code geändert werden, bekommt
  diese Änderung ein Review.

## Rechnerlast

Wie bisher nur über die gedeckelte Umgebung (`tools/leise.sh`), auf diesem Rechner nach der lokalen Grenze, nie
mehrere schwere Läufe parallel.

## Nicht Teil dieser Spec

- Änderungen am Tutorial, an der Strahlregel, an den Schwellen der Grade oder an den Gewichten der Beurteilung.
- Würfel-Level.
- Mehr als 500 Level.
