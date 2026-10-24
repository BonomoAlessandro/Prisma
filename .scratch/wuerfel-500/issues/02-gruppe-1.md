# 02: Würfel-Gruppe 1 (25 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 5 / 13 / 5 / 2.
Danach stehen 25 neue Würfel-Level im Spiel: 5 / 13 / 5 / 2 (dazu Aufzug und Kern).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 01

**Status:** resolved

- [x] 25 neue Level im Spiel, je Grad wie oben; Fehlmengen eines Grads sind begründet und für die nächste Gruppe
      vermerkt.
- [x] Jedes neue Level hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee und ist
      keinem anderen Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt (Protokoll); von beiden abgelehnte sind ersetzt.
- [x] Namen im bisherigen Stil vergeben, eindeutig über flache und Würfel-Level, keiner von der Liste entfernter Level
      (ohne Freigabe des Nutzers).
- [x] Herkunft jedes Levels (Auftrag, Seed, Ziel-Schwierigkeit) ist nachbaubar.
- [x] Golden-Referenz nachgeführt, alle Tests grün, Stichproben der Screenshots geprüft, auf `feature/3d-wuerfel`
      gepusht.
- [x] **Pilot:** Dauer und Ausbeute je Grad (Kandidaten, Ablehnungen der KI-Tester, CPU-Zeit) stehen unter
      `## Comments`, als Grundlage für die Schätzung der übrigen Gruppen.

## Comments

- 2026-10-24: Erledigt. 25 neue Würfel-Level, 5 / 13 / 5 / 2. Mit Aufzug und Kern (beide leicht) stehen 27 im Spiel:
  - leicht: Bauklotz, Treppe, Dachboden, Erker, Dachfenster
  - mittel: Treppenhaus, Galerie, Veranda, Atrium, Balkon, Mansarde, Wintergarten, Dachterrasse, Innenhof, Rotunde, Pavillon, Krypta, Laubengang
  - schwer: Zitadelle, Pagode, Zikkurat, Pyramide, Basilika
  - sehr schwer: Hyperwürfel, Tesserakt
- Namen aus einem eigenen Vorrat zu Bauten und Räumen (passend zu Aufzug und Kern), tests/output/wuerfel/namen-vorrat.json, nicht versioniert. Ohne Namen der flachen Level und ohne Namen aus deren Vorrat.
- **Pilot, Dauer und Ausbeute:**
  - Pool-1 (24 Aufträge, Seeds 20001–20400, --jobs 4, LEISE_CPU 30): 2272 Kandidaten, 1232 s.
  - Grosser Pool (--jobs 9, LEISE_CPU 80):
    - sehr schwer: 6 Aufträge, Seeds 20401–22400, 213 Kandidaten, 1972 s
    - mittel: 6 Aufträge, Seeds 20401–21200, 1050 Kandidaten, 79 s
    - schwer: 6 Aufträge, Seeds 20401–21200, 700 Kandidaten, 289 s
  - Wahl 15–40 s, ordne-wuerfel 3 s.
  - Bilder der KI-Tester: 56 min für 27 Level (Desktop 82 s und Handy 39 s je Aufnahme); 7 min für 3 Ersatz-Level, die Anker kommen aus dem Zwischenspeicher.
  - KI-Tester: je etwa 12 min für 25 Level und gut 2 min für 3.
  - Ablehnungen: 3 von 25, alle leicht und von beiden Testern abgelehnt (Zerfall, Füllteil). Die Wahl liess in leicht noch einen zweiten unabhängigen Teil mit 1 drehbaren Element zu. Seit 805c363 schliesst sie im Würfel jeden zweiten Teil aus. Danach verwirft die Vorprüfung 1676 von 2272 Kandidaten aus Pool-1; leicht bleibt reichlich.
  - Ersatz im Lauf wuerfel-1-2: 3 neue leichte, keiner abgelehnt.
  - Korrekturen der KI-Tester: Treppenhaus −4, Dachfenster +2.
- **Gefundene Fehler:**
  - Seit PLAN 2.2 fiel ein Strahl auf der Plattform in die unterste Zelle. An einem Prisma brach die Sammelstelle ab; das hat den Pool schwer zum Absturz gebracht. Behoben in 0d0edd0, mit Test.
  - Die Eichmenge des Spielwerts las die Würfel-Urteile im Protokoll mit. Behoben in 5f1a602.
  - Zwei Tests der Beurteilung galten allen Würfel-Leveln statt Aufzug und Kern.
- Für Gruppe 2: Pool-1 und die Pools 2 (sehr schwer, mittel, schwer) unter tests/output/wuerfel/. Die Anker W2 (je Grad zwei neue) legt Ticket 03 fest.
