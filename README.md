# PRISMA

Ein 3D-Licht-Puzzle im Browser: Spiegel und Kristalle drehen, Licht lenken,
mit Prismen in Spektralfarben aufspalten und farbige Ziele treffen.

- **Starten:** `index.html` direkt im Browser öffnen (keine Installation, kein Build-Step).
  Three.js r147 wird per CDN geladen, daher ist eine Internetverbindung nötig.
- **Spezifikation:** siehe [SPEC.md](SPEC.md).
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
- **Ablauf:** Startbildschirm (Klick startet und schaltet den Ton frei), dann Level I. Beim Lösen leuchten die
  Ziele nacheinander auf, ein Akkord erklingt, eine Lichtwelle läuft über die Platte und es regnen Funken;
  danach "Level gelöst" mit Weiter-Button. Ton komplett per Web Audio erzeugt.
  `?nointro` überspringt den Startbildschirm (nutzen die Screenshot-Tests; `INTRO=1` zeigt ihn).
- **Level-Werkzeuge** (`tools/`, nur für die Entwicklung):
  `solver.mjs` folgt den Strahlen und probiert nur Elemente durch, die Licht bekommen (schneidet ab, sobald ein Ziel
  falsches Licht erhält) und misst die Schwierigkeit (`metrics`: Suchknoten, erreichbare Stellungen, Rateschritte,
  berührte Elemente, Ziele – zusammen `score`; Klicks nur zur Info, sie hängen von der Startverdrehung ab);
  `generate.mjs <kapitel> <anzahl> [seed] [maxseeds] [--jobs N]` erzeugt eindeutig lösbare Level nach den Vorgaben in
  `chapters.mjs` (mit `--jobs` parallel auf N Prozessen);
  `show.mjs` zeigt Level als Textfeld (`node tools/generate.mjs VI 3 | node tools/show.mjs`);
  `curate.mjs <kapitel> [pool] [--jobs N] [--seed S] [--save datei] [--pool datei] [--dry]` wählt aus einem Pool
  10 Level im Wertungsfenster des Kapitels (aufsteigend, möglichst verschieden) und schreibt sie zwischen die
  Markierungen `KAPITEL:<id>` in index.html. Empfohlen: erst `--dry --save pool.jsonl` ansehen, dann mit
  `--pool pool.jsonl` schreiben (gleiche Auswahl). Rückgabewert 2: zu wenige Kandidaten im Fenster.
  Kapitel X ist langsam – Pool 35–40 und viel Zeit einplanen.
- **Levels:** bis zu 10 Kapitel à 10 Levels in `LEVELS` (index.html; Kapitel in `CHAPTERS`, Kapitel I handgebaut),
  jede Lösung steht als Kommentar und im Feld `solution`.
  Levelauswahl mit Kapitelreitern; ein Level ist spielbar, sobald eines der beiden vorigen gelöst ist (eins darf man
  überspringen). Fortschritt und aktuelles Level bleiben im Browser gespeichert (nach Kapitel und Name).
  `?unlockall` bzw. `__prisma.unlockAll()` schaltet für Tests alles frei.
  Wichtig: Kapitel-ID und Levelname sind der Speicherschlüssel des Fortschritts. Namen in `tools/chapters.mjs`
  nach dem Veröffentlichen nicht mehr umbenennen; ein neu kuratiertes Kapitel übernimmt die Namen der Position nach.
  Die Tests probieren alle Stellungen durch und prüfen, dass jede Lösung stimmt und eindeutig ist.
