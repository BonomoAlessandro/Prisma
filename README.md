# PRISMA

Ein 3D-Licht-Puzzle im Browser: Spiegel und Kristalle drehen, Licht lenken,
mit Prismen in Spektralfarben aufspalten und farbige Ziele treffen.

- **Starten:** `index.html` direkt im Browser öffnen (keine Installation, kein Build-Step).
  Three.js r147 wird per CDN geladen, daher ist eine Internetverbindung nötig.
- **Spezifikation:** siehe [SPEC.md](SPEC.md).
- **Plan und offene Punkte:** siehe [PLAN.md](PLAN.md) – was noch umgesetzt werden soll, Entscheidungen, Erledigtes.
- **Icon:** `favicon.svg` (Prisma mit Farbfächer), PNG-Varianten in `icons/` (iOS 180 px, Android 192/512 px),
  `manifest.webmanifest` für den Startbildschirm – wird nur über http(s) eingebunden, über file:// blockiert es der Browser.
- **Tests:** `node tests/logic.test.mjs` prüft die Strahllogik,
  `node tests/screenshot.mjs` rendert Screenshots per Headless-Chrome nach `tests/output/`,
  `node tests/screenshot.mjs perf 1280 800 200 "$(cat tests/perf-probe.js)"` vergleicht die Kosten der Renderstufen,
  `node tests/screenshot.mjs interaction 1440 900 800 "$(cat tests/interaction-probe.js)"` simuliert Klick, Rechtsklick, Ziehen und Hover.
- **Steuerung:** Klick/Tap dreht ein Element um 45°, Rechtsklick oder langes Drücken zurück, Ziehen dreht die Kamera.
  Schaltflächen unten rechts: Level neu starten, Ton an/aus, Levelauswahl.
  Tasten: N / → nächstes Level, P / ← voriges Level (nur freigeschaltete), R neu starten, M Ton, L Levelauswahl,
  Enter weiter (nach dem Lösen), Esc schliessen, F Leistungsanzeige.
- **Ablauf:** Startbildschirm (Klick startet und schaltet den Ton frei), dann das Tutorial. Beim Lösen leuchten die
  Ziele nacheinander auf, ein Akkord erklingt, eine Lichtwelle läuft über die Platte und es regnen Funken;
  danach "Level gelöst" mit Weiter-Button. Ton komplett per Web Audio erzeugt.
  `?nointro` überspringt den Startbildschirm (nutzen die Screenshot-Tests; `INTRO=1` zeigt ihn).
- **Level-Werkzeuge** (`tools/`, nur für die Entwicklung):
  `solver.mjs` folgt den Strahlen und probiert nur Elemente durch, die Licht bekommen (schneidet ab, sobald ein Ziel
  falsches Licht erhält) und misst die Schwierigkeit (`metrics`: Suchknoten, erreichbare Stellungen, Rateschritte,
  berührte Elemente, Ziele – zusammen `score`; Klicks nur zur Info, sie hängen von der Startverdrehung ab);
  `generate.mjs <profil> <anzahl> [seed] [maxseeds] [--jobs N] [--time S]` erzeugt eindeutig lösbare Level nach
  einem Profil aus `profiles.mjs` (Grössenstufe 1–5 × Mischung: nur Spiegel, Prisma, Filter, farbige Quellen,
  Kombinator, bunt gemischt);
  `pools.mjs [profil …] [--count N] [--jobs N] [--minutes M]` erzeugt für jedes Profil einen Kandidaten-Pool in
  `tools/pools/` (nicht versioniert; alle Profile dauern mit 13 Prozessen bis zu 2,5 Stunden);
  `quality.mjs` prüft, ob ein Level das Feld nutzt (Fläche, Quadranten, Rand), ob mehrere Quellen gekoppelt sind
  und ob es Zusammenspiel gibt (Kreuzungen, Mehrfachtreffer, geteilte Spiegel, Lockvögel, die beim Probieren Licht
  bekommen) – Generator und Kuratierung verwerfen Level, die das nicht erfüllen;
  `show.mjs` zeigt Level als Textfeld (`node tools/generate.mjs 2-prisma 3 | node tools/show.mjs`);
  `curate.mjs [--dry] [--from W] [--to W] [--save datei] [--order datei]` wirft alle Pools und
  `candidates.jsonl` (handgebaute Level, früheres Kapitel II) zusammen, wählt 50 Level gleichmässig über die
  Wertung (verschiedene Grundmuster, abwechselnde Mischungen), sortiert sie nach Wertung und schreibt sie zwischen
  die Markierungen `LEVELS:BEGIN/END` in index.html. Mit `--order` wird eine von Hand korrigierte Reihenfolge
  übernommen (JSON-Zeilen wie bei `--save`); die endgültige Auswahl liegt in `tools/selection.jsonl`.
  Rückgabewert 2: zu wenige Kandidaten im Wertungsbereich.
- **Levels:** in `LEVELS` (index.html): zuerst das Tutorial (`tutorial: true`, je ein Hinweis zur Mechanik in der
  Kopfzeile, auch im Handy-Querformat: Spiegel, feste Spiegel und Blöcke, Prisma, Filter, farbige Quellen,
  Kombinator), danach 50 Level, allein nach Schwierigkeit sortiert. Jede Lösung steht als Kommentar und im Feld
  `solution`. Die Levelauswahl blättert in Seiten (Tutorial, 1–10, 11–20 …) – reine Seiten, keine Themen.
  Ein Level ist spielbar, sobald eines der beiden vorigen gelöst ist (eins darf man überspringen). Fortschritt und
  aktuelles Level bleiben im Browser gespeichert (nach Levelname).
  `?unlockall` bzw. `__prisma.unlockAll()` schaltet für Tests alles frei.
  Wichtig: Der Levelname ist der Speicherschlüssel des Fortschritts. Die Namen in `tools/profiles.mjs` werden der
  Position nach vergeben – nach dem Veröffentlichen nicht mehr umbenennen.
  Die Tests probieren alle Stellungen durch und prüfen, dass jede Lösung stimmt und eindeutig ist.
