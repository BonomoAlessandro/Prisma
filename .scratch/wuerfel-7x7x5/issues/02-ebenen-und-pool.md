# 02: Ebenen-Regel, Pool umrechnen, Generator im Quader

**Spec:** ../spec.md

**Blocked by:** 01

**Status:** resolved

**What to build:** Die Ebenen-Regel der Spec (mindestens 3 Ebenen mit getroffenen Elementen, unterstes Element auf
y = 0) als feste Regel der Würfel-Levelliste, der umgerechnete Pool und ein erster neuer Pool 7 × 7 × 5.

- [x] Regel in `tools/wuerfelliste.mjs` und in `wahl`; Test über alle Würfel-Level im Spiel (bis Ticket 03 sind
      die bekannten Fälle ausgenommen, danach keine).
- [x] Umrechnen: Pool 7 × 7 × 7 → 7 × 7 × 5 (verschoben, neu beurteilt, Herkunft mit Verschiebung), nur Kandidaten,
      die die Regel erfüllen und eindeutig lösbar bleiben.
- [x] Generator im Quader 7 × 7 × 5 mit der Regel; Probe der Ausbeute je Grad, im Ticket festgehalten.
- [x] Alle Tests grün; Review.

## Comments

**26.10.2026, Koordinator: erledigt.**

- **Regel:** In `tools/wuerfelliste.mjs` stehen `MIN_EBENEN = 3`, `getroffeneEbenen(level)` und `ebenenVerletzt(level)`.
  - `getroffeneEbenen` zählt die Elemente, die die Lösungsstellung trifft, und dazu immer alle Quellen. Getroffen heisst: ein Ereignis des Strahls mit Element oder Ziel, bei einem Spiegel die Zelle des Ereignisses „reflect“.
  - `ebenenVerletzt` meldet zu wenige Ebenen und ein Level, das schwebt.
  - Ein Test baut ein Probelevel: Ein Zierstück auf einer dritten Ebene zählt nicht, ein Filter auf der mittleren Ebene schon, und ein gehobenes Level schwebt.
- **Weitere Teile in `tools/wuerfelliste.mjs`:**
  - `QUADER` (7 × 7 × 5) ist ab Ticket 03 der `WUERFEL`.
  - `senke(level, tief)` senkt ein Level um so viele Ebenen.
- **Wahl:** `tools/wuerfel.mjs wahl` verwirft jeden Kandidaten, der die Regel verletzt. Die Ausgabe trägt `gesenkt`, und `ordne-wuerfel` schreibt in die Herkunft „…, Stand …, gesenkt um N“.
- **Test über die Level im Spiel:** Er kommt erst in Ticket 03, mit den Daten. Bis dahin verletzen ihn die bekannten 225.
- **Pool umgerechnet:** `wuerfel.mjs umrechnen` nach `tests/output/quader/pool-umgerechnet.jsonl`.
  - 4872 gelesen, 1300 übernommen.
  - Verworfen: 2752 passen nicht in 5 Ebenen, 820 verletzen die Ebenen-Regel.
  - Neu beurteilt hat keiner einen Ausschlussgrund, und der Grad ist bei allen wie im Auftrag. Je Grad 433 / 599 / 218 / 50. Dauer 11 s.
- **Generator im Quader:** `ausbau.mjs pool --wuerfel` baut jetzt in `QUADER` und verwirft Kandidaten, die die Regel verletzen.
- **Probe:** 100 Seeds je Auftrag, 13 Aufträge.
  - leicht 60 %.
  - mittel: mischziel 43 %, sammelstelle 45 %, abzaehlen 2 %, abschalten 4 %.
  - schwer: sammelstelle 35 %, mischziel 17 %, abschalten 8 %, ohne Kernidee 4 %.
  - sehr schwer: mischziel 5 %, ohne Kernidee 3 %, sammelstelle 2 %, abschalten 0 %.
  - Im Quader liefert „schwer“ deutlich besser als im Würfel 7 × 7 × 7.
- **Neuer Pool:** Stand 74361c6, sauber, in `tests/output/quader/pool-1-*.jsonl`.

  | Datei | Seeds je Auftrag | Kandidaten | Dauer |
  |---|---|---|---|
  | sehr-schwer (3 Aufträge) | 3000 | 271 | 32 min |
  | schwer (4) | 1000 | 622 | 5 min |
  | mittel (4) | 1000 | 882 | 41 s |
  | leicht (3) | 400 | 568 | 10 s |

- **Zusammen mit dem umgerechneten Pool:** je Grad (nur mit Grad wie im Auftrag) 1001 / 1481 / 840 / 321. Für die 9 Gruppen bis 300 braucht es 34 / 116 / 53 / 22, das reicht reichlich.
- **Tests:** alle grün, mit Exit 0.

**26.10.2026, Review (Branch `review/quader-02`):** gut, ohne Fehler im Code.

- **`getroffeneEbenen`:** erfasst jede Ereignisart von `tracePass`, die ein Element trifft: `absorb` (Quelle, Blocker, Spiegel streifend am Rahmen, Prisma ohne Austritt, Filter ohne Durchlass), `refract`, `filter`, `merge` tragen `element`, `hit` trägt `target`, `reflect` geht über die Zelle. `edge` und `floor` haben kein Element. Ein nicht getroffenes Element zählt nie. Die Ereignisse sind die des letzten Durchgangs von `traceBeams`, also mit den Ausgängen der Kombinatoren. `setRot` setzt beim Kombinator `dir`.
- **Senken:** Die Annahme stimmt. Unter dem untersten Element läuft ein Strahl auf den Boden, über dem obersten an den Rand, in beiden Formen ohne Treffer und mit gleich vielen Abschnitten.
- **Stichprobe mit dem Löser:** alle 3643 Kandidaten in `tests/output/quader/` (1300 umgerechnet, 2343 aus `pool-1-*`).
  - Alle haben genau eine Lösung, die notierte, erfüllen die Ebenen-Regel und haben die Form 7 × 7 × 5 mit y von 0 bis 4.
  - Die getroffenen Ebenen stimmen mit einer unabhängigen Rechnung über die Endpunkte der Strahlabschnitte überein.
  - Die 1300 umgerechneten, zurück in den Würfel 7 × 7 × 7 gehoben, haben dort dieselbe eindeutige Lösung.
  - `gesenkt` je Wert: 0: 279, 1: 146, 2: 458, 3: 290, 4: 127.
- **Hinweis:** 75 der umgerechneten Kandidaten sind Level im Spiel (gesenkt). `umrechnen` vergleicht mit den Leveln im Würfel 7 × 7 × 7 und findet sie darum nicht. `wahl` verwirft sie nach Ticket 03 (Name im Spiel, Ähnlichkeit), wenn der Bestand gleich gesenkt ist. Die Zahlen je Grad oben sind darum um bis zu 75 zu hoch, es reicht trotzdem.
- **Kleinigkeit:** Ein Kandidat aus `--behalte` geht in `wahl` nicht durch den Filter der Ebenen-Regel. Er stammt aus einer früheren Wahl, darum offen gelassen.
- **Ergänzt:**
  - Test „getroffen zählt bei jeder Ereignisart“: Spiegel streifend, Prisma schluckt und fächert, Blocker, und ein Kombinator, dessen Lösung `dir` von der Startstellung abweicht.
  - Im Test der Ebenen-Regel: Gehoben und gesenkt hat das Level dieselben Lösungen.
  - Kopf von `ordne-wuerfel.mjs`: das Feld `gesenkt`.
