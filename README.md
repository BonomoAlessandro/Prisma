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
  Tasten: N / → nächstes Level, P / ← voriges Level, R neu starten, M Ton, L Levelauswahl,
  Enter weiter (nach dem Lösen), Esc schliessen, F Leistungsanzeige.
- **Ablauf:** Startbildschirm (Klick startet und schaltet den Ton frei), dann Level I. Beim Lösen leuchten die
  Ziele nacheinander auf, ein Akkord erklingt, eine Lichtwelle läuft über die Platte und es regnen Funken;
  danach "Level gelöst" mit Weiter-Button. Ton komplett per Web Audio erzeugt.
  `?nointro` überspringt den Startbildschirm (nutzen die Screenshot-Tests; `INTRO=1` zeigt ihn).
- **Levels:** 10 Levels in `LEVELS` (index.html), jede Lösung steht als Kommentar und im Feld `solution`.
  Das zuletzt gespielte Level und die gelösten Level bleiben im Browser gespeichert.
  Die Tests probieren alle Stellungen durch und prüfen, dass jede Lösung stimmt und eindeutig ist.
