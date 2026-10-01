# PRISMA

Ein 3D-Licht-Puzzle im Browser: Spiegel und Kristalle drehen, Licht lenken,
mit Prismen in Spektralfarben aufspalten und farbige Ziele treffen.

- **Starten:** `index.html` direkt im Browser öffnen (keine Installation, kein Build-Step).
  Three.js r147 wird per CDN geladen, daher ist eine Internetverbindung nötig.
- **Spezifikation:** siehe [SPEC.md](SPEC.md).
- **Tests:** `node tests/logic.test.mjs` prüft die Strahllogik,
  `node tests/screenshot.mjs` rendert Screenshots per Headless-Chrome nach `tests/output/`,
  `node tests/screenshot.mjs perf 1280 800 200 "$(cat tests/perf-probe.js)"` vergleicht die Kosten der Renderstufen,
  `node tests/screenshot.mjs interaction 1440 900 800 "$(cat tests/interaction-probe.js)"` simuliert Klick, Rechtsklick, Ziehen und Hover.
- **Steuerung:** Klick/Tap dreht ein Element um 45°, Rechtsklick oder langes Drücken zurück, Ziehen dreht die Kamera. F: Leistungsanzeige.
