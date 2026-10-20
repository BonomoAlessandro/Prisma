# 01: Vorbereitung auf 500 Level

**What to build:** Werkzeuge, Tests und Spiel kommen mit mehr als 150 Leveln zurecht, sodass jede Gruppe der Tickets
02–11 nur noch Leveldaten hinzufügt.

**Spec:** ../spec.md

**Status:** ready-for-agent

- [x] Alle Stellen, die 150 Level annehmen, sind gefunden und angepasst (u. a. `tools/ordne-level.mjs`,
      `tools/levelliste.mjs`, Tests der Levelliste, `index.html`). Die heutige Reihenfolge der 150 bleibt Massstab der
      Eichung (ADR 0001); neue Level stehen nach der Formel wie die Ersatzlevel der Tickets 23–26.
- [x] Mit eingefügten Leveln bleibt jede Regel der Levelliste prüfbar: Grad sinkt nie, Mittel je 10 Level steigt,
      Haupt-Kernidee höchstens zweimal je 10, feste Plätze der Prüfliste aus Ticket 16 bleiben gültig.
- [x] Die Levelauswahl ist mit 50 Seiten auf Desktop und Handy bedienbar (heute 15 Reiter), etwa mit Sprung zu einem
      Grad; Screenshot-Proben auf Desktop und Handy.
- [x] Eine Prüfung auf zu ähnliche Level (gegen das Spiel und unter den Kandidaten) mit festem, begründetem Mass.
- [x] Ein Werkzeug schlägt je Gruppe den Bedarf vor: Anzahl je Grad nach der Tabelle der Spec, dazu je Grad die
      Haupt-Kernideen, die beim Einfügen die Regel „höchstens zweimal je 10“ einhalten.
- [x] Laufzeit von Golden-Test und Tests der Levelliste mit 500 Leveln abgeschätzt; falls nötig beschleunigt, ohne das
      Verhalten zu ändern.
- [x] Probelauf: Mit 35 Probe-Leveln (nicht committet) laufen alle Tests grün.
- [ ] Review nach dem Ticket.

## Comments

**Umsetzung (20.10.2026, Branch `ausbau/01-vorbereitung`)**

- **Bestand und Ausbau** (`tools/levelliste.mjs`, Kopf): Die Level vor dem Ausbau sind der Bestand. `ordne`, Prüfliste,
  Zustimmung und eigene Korrekturen der KI-Tester rechnen nur unter ihm, mit Plätzen unter dem Bestand; ohne Ausbau
  ist das Ergebnis bitgleich zu vorher (Ausgabe von `ordne-level.mjs` bis auf die neuen Textteile gleich, alle Tests
  unverändert grün). Die Level des Ausbaus (`ausbau` in `levelliste.json`) fügt `fuegeEin` danach ein: vor das erste
  Level des Bestands, das nach der Formel steht und schwerer ist oder einen höheren Grad hat; ihr Grad folgt der
  Schwelle, so sinkt der Grad nie. Ihre Korrektur durch die KI-Tester gilt vom Platz beim Einfügen (`eingefuegt`),
  Häufungsregel und Mittel je 10 Level gelten für die ganze Reihenfolge. Begründung: Mit 350 neuen Leveln wanderte
  sonst fast jedes Level des Bestands weiter als 10 Plätze von seinem heutigen Platz, und die Entscheide aus Ticket 16
  fielen alle neu an.
- **`ordne-level.mjs --ausbau`** (wie `--austausch`, ohne `ersetzt`), `--json` mit `ausbau: true` als Vorschau für
  `prepare.mjs`; geschrieben wird nur mit Namen und zählendem Urteil `ausbau-…` ohne Ablehnung. Namen braucht der
  Nutzer nicht freizugeben (Entscheid vom 20.10.2026).
- **KI-Tester:** `prepare.mjs --kandidaten` mit einer Vorschau rechnet Plätze, Grade, Referenzen und Anker in ihr
  (`gradesIn`, `gradeOf`, `reference`, `loadAnchors` in `protocol.mjs` mit wahlweiser Reihenfolge). Die Referenz von
  Ablauf 2 hat keine Obergrenze mehr (Kandidaten stehen in einer Vorschau, die länger ist als das Spiel); die
  Gegenprobe im Test prüft nun die Untergrenze. Der Test „Anker am Ende des Grads“ rechnet unter dem Bestand: Die Anker
  bleiben eine feste Auswahl, sonst wären die Urteile der Läufe nicht vergleichbar.
- **Eichmenge des Spielwerts** (`beurteilung/spielwert-eichmenge.mjs`): Läufe `ausbau-…` zählen wie `ersatz-…` nicht
  (im Probelauf gefunden: der Test der Beurteilung brach mit „unbekannte Level“ ab).
- **Levelauswahl** (`index.html`): fünf Knöpfe für die Abschnitte (Tutorial, Leicht, Mittel, Schwer, Sehr schwer, je
  mit Fortschritt; ein Klick zeigt die erste Seite) statt eines Reiters je Seite, darunter Blättern mit ‹ ›, dazu
  ← / Bild↑ und → / Bild↓ bei offener Auswahl. Die Seiten (PAGES) und ihre Titel bleiben. Screenshot-Proben auf
  Desktop 1440 × 900, Handy 390 × 844 hochkant und quer, ohne Konsolenfehler. Der Service Worker holt `index.html`
  online frisch, eine neue Cache-Version braucht es nicht.
- **Ähnlichkeit** (`tools/aehnlichkeit.mjs`): Jaccard-Index der Elemente (Art, Farbe, fest, Zelle), das Höchste über
  die acht Symmetrien. Gemessen an den 159 Leveln im Spiel: drei Fast-Doppel (Dreiklang – Delta 0,79, Karussell –
  Rundflug 0,76, Fokus – Türkis 0,59), dann verschiedene Rätsel mit ähnlichem Gerüst (0,45, 0,43) und ab 0,30 nichts
  Auffälliges. Grenze 0,5. **Fund für den Nutzer:** Die drei Paare stehen heute schon im Spiel (je ein Ersatzlevel aus
  Ticket 24); sie bleiben, bis darüber entschieden ist. Frische Kandidaten des Generators liegen bei höchstens 0,27.
- **`tools/ausbau.mjs`:** `pool` (Kandidaten parallel, Gruppe 1: 1220 Level aus 20 Aufträgen zu 200 Seeds in 231 s
  mit `--jobs 9`), `wahl` (Bedarf je Grad aus der Tabelle der Spec, verteilt über den Bereich des Grads, dann Suche
  gegen offene Häufungen), `bedarf`. Erkenntnis: Die heutige Reihenfolge passt nur so ins Seitenraster, wie sie ist;
  schiebt ein eingefügtes Level die Seiten um 1–9 Plätze, bleiben unter den heutigen Leveln 3–7 Häufungen offen, die
  die Häufungsregel mit 3 Plätzen nicht löst. Darum wählt `wahl` zuerst alle Level und tauscht dann (lokale Suche mit
  festem Zufall, auch gleich gute Schritte), bis keine Häufung offen bleibt: Gruppe 1 in 330 Schritten, etwa 40 s.
  Während der Wahl füllen Platzhalter die letzte Seite auf (eine angefangene Seite mit wenigen Leveln lässt die
  Häufungsregel sonst keinen Zug machen); das Ergebnis rechnet ohne sie wie `ordne-level.mjs`.
- **Laufzeiten mit 185 Leveln** (Probelauf, `LEISE_CPU=80`): Levelliste 25 s, Golden 2 s (`--voll` 10 s, `--write`
  14 s), `ordne-level.mjs` 36–60 s, Beurteilung 82 s, Logik 15 s. Hochgerechnet auf 500 Level etwa 75 s, 6 s (30 s),
  2–3 min; das ist tragbar, beschleunigt wird nichts.
- **Probelauf:** die 35 Level der Wahl für Gruppe 1 mit Namen „Probe 01–35“ und neutralen, erfundenen Urteilen (Lauf
  `ausbau-probe`, über `merge.mjs`) geschrieben: Grade 37 / 93 / 39 / 16 genau nach der Tabelle, keine offene
  Häufung, Mittel je 10 Level steigt (kleinster Schritt −0,06), ein zweiter Lauf von `ordne-level.mjs` ändert nichts.
  Grün: Logik 653, Levelliste 48, KI-Tester 65, Golden (nach `--write`), Beurteilung 178, Generator 30, Offline.
  Danach zurückgesetzt (Leveldaten, `levelliste.json`, `golden.json`, Protokoll).
- **Für die Gruppen:** Golden-Test-Referenz mit `node tests/golden.mjs --write` nachführen, sobald neue Level im Spiel
  stehen.
