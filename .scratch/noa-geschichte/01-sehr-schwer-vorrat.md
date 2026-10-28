# 01: 15 neue sehr schwere Level für Noas Geschichte (PLAN.md 0.3)

**What to build:** Für 60 Level je Grad (6 Welten × 10) fehlen in «sehr schwer» 15 (im Spiel 45). Aus einem grossen
Pool die besten 15 wählen, beurteilt und fertig für den Umbau, aber noch nirgends eingebaut. Wunsch des Nutzers vom
28.10.2026; dazu die Regeln in PLAN.md 0.1 (beste Bewertung ohne Häufungen, Schwierigkeit steigt über die Welten).

**Status:** resolved

- [x] Grosser Pool aus dem Generator, alle sieben Aufträge «sehr schwer»
- [x] Vorauswahl mit den Filtern der Wahl im Ausbau, verteilt über Haupt-Kernideen und Schwierigkeit
- [x] Beide KI-Tester haben jeden Kandidaten der Vorauswahl beurteilt (Protokoll, Lauf `ausbau-noa-1`)
- [x] 15 gewählt, keines abgelehnt oder schwach, verschieden genug; geprüft auf dem Stand des Codes
- [x] Leveldaten mit Herkunft in `tools/geschichte/sehr-schwer-neu.json`, nicht im Spiel

## Comments

**Ergebnis (28./29.10.2026, Branch `feature/lichtsignal-prototyp`)**

- **Pools** (`tests/output/noa/`, nicht versioniert; Stand `33a933c`, `LEISE_CPU=80`, `--jobs 9`):
  - `pool-ss-1`: `ausbau.mjs pool "sehr schwer" "sehr schwer-abschalten" "sehr schwer-falle" "sehr schwer-abzaehlen"
    "sehr schwer-lockvogel" "sehr schwer-mischziel" "sehr schwer-sammelstelle" --seed 40001 --seeds 3000`:
    738 Level in 3295 s (Lockvogel nur 7).
  - `pool-ss-2`: dieselben Aufträge, `--seed 50001 --seeds 2000 --schwierigkeit 96,112` für die oberen Welten:
    114 Level in 2145 s.
- **Vorauswahl** (Hilfsskript, nicht im Repo): 48 aus 852, je Haupt-Kernidee 9 (Lockvogel 3, mehr taugten nicht),
  reihum aus den Bändern unter 91, 91–96 und ab 96; kein zweiter Teil mit drehbarem Element, keinem Level im Spiel zu
  ähnlich, untereinander unter 0,35 Ähnlichkeit.
- **KI-Tester, Lauf `ausbau-noa-1`** (48 Kandidaten, 8 Anker): Die erste Antwort beider war zu flüchtig (Bilder nur
  stichprobenweise, kaum gelöst); beide haben auf Nachfrage alle Level mit beiden Bildern neu beurteilt. Beide hatten
  auch die Anker beurteilt; wie in `ausbau-v2` nur diese Einträge entfernt (Original `urteile.mit-ankern.json`). Keine
  Ablehnung; zwei Kandidaten mit Gefühl im Mittel unter 3 (525422a7, af87cceb).
- **Wahl der 15** aus allen beurteilten sehr schweren Kandidaten, die nicht im Spiel stehen (die neuen und 16 übrige aus
  dem Ausbau): nicht abgelehnt, Gefühl im Mittel ab 3, Aha bei mindestens einem; Rang nach Gefühl, Aha bei beiden,
  Spielwert. Mit den 45 im Spiel höchstens 12 je Haupt-Kernidee; Wunsch je Band 3 / 6 / 6, weil die 45 meist bei 88–92
  liegen und oben Level für die letzten Welten fehlten. Lockvogel kommt bei den 45 nicht vor; der beste (ffbab861,
  Gefühl 4/4) ist darum fest gesetzt (Entscheid des Koordinators).
- **Die 60 sehr schweren danach je Haupt-Kernidee:** Abschalten 12, Farben abzählen 12, Falle 12, Sammelstelle 12,
  Mischziel aus zwei Quellen 11, Lockvogel 1.
- **Gewählt** (Schwierigkeit, Haupt-Kernidee, Gefühl A/B, Lauf):

  | Kandidat | Schw. | Haupt-Kernidee | Gefühl | Lauf | Auftrag, Seed |
  |---|---|---|---|---|---|
  | f7e8b93d | 87,9 | Sammelstelle | 5/5 | ausbau-noa-1 | sammelstelle 40922 |
  | c0f328cc | 88,4 | Abschalten | 4/5 | ausbau-noa-1 | lockvogel 41653 |
  | 6fa1a019 | 88,9 | Abschalten | 5/5 | ausbau-noa-1 | mischziel 41160 |
  | f4c043d4 | 91,2 | Sammelstelle | 4/5 | ausbau-v2 | sammelstelle 11925 |
  | f8c4b89c | 92,0 | Sammelstelle | 4/5 | ausbau-noa-1 | sammelstelle 40563 |
  | 4608e5c4 | 92,3 | Falle | 4/4 | ausbau-noa-1 | sehr schwer 40139 |
  | ffbab861 | 93,0 | Lockvogel | 4/4 | ausbau-noa-1 | mischziel 40263 |
  | 6ed76ea9 | 93,6 | Sammelstelle | 4/5 | ausbau-noa-1 | sammelstelle 40703 |
  | 6b925427 | 93,8 | Abschalten | 5/4 | ausbau-noa-1 | sehr schwer 40374 |
  | 4ba9219a | 96,1 | Sammelstelle | 4/5 | ausbau-noa-1 | sammelstelle 42153 |
  | 89b6826b | 96,2 | Falle | 4/3 | ausbau-noa-1 | sammelstelle 51612 (Ziel 96–112) |
  | 8a062c51 | 96,2 | Mischziel aus zwei Quellen | 4/5 | ausbau-noa-1 | sehr schwer 40562 |
  | 00fc281b | 97,2 | Mischziel aus zwei Quellen | 4/4 | ausbau-noa-1 | sehr schwer 50514 (Ziel 96–112) |
  | 4ab6b993 | 98,6 | Falle | 3/4 | ausbau-v-oben | sammelstelle 11205 |
  | 853bd411 | 98,7 | Falle | 3/5 | ausbau-noa-1 | sammelstelle 42149 |

- **Prüfung auf dem Stand des Codes** (`ordne-level.mjs --ausbau` mit den 15): alle «sehr schwer» nach der Schwelle,
  ohne Ausschluss, mit Haupt-Kernidee; die beiden aus dem Ausbau mit unveränderter Schwierigkeit.
- **Tests:** KI-Tester 84, Levelliste 57, grün. Das Spiel ist unverändert.
- **Offen für den Umbau:** Namen (PLAN.md 0.3, ob zur Welt oder zum Grad); Einbau nach den Regeln in PLAN.md 0.1.
  Ersatz: 48 weitere gute beurteilte Kandidaten (63 mit den 15) stehen im Protokoll (Lauf `ausbau-noa-1` und frühere
  `ausbau-…`), ihre Leveldaten in den Pools.
