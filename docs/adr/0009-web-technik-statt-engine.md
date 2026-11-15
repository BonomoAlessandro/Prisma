# Prisma bleibt bei Web-Technik und wird für die Stores umgebaut, nicht in einer Engine neu geschrieben

Entschieden vom Nutzer am 15.11.2026 (Grilling «Umbau für die Stores», `.scratch/umbau/spec.md`).

## Kontext

Prisma soll in den Google Play Store und auf Steam (Windows und Steam Deck) und weiter im Browser laufen. Heute ist das
Spiel eine einzige `index.html` mit rund 27 000 Zeilen, ohne Build-Schritt, mit Three.js r147. Die Frage war, ob der
Weg in die Stores die Gelegenheit für eine ganz andere Technik ist, etwa eine Engine wie Godot oder Unity.

Was stört, ist vor allem die Arbeit am Code (eine riesige Datei, schwer zu überblicken) und der Aufwand beim Verpacken
für mehrere Plattformen. Leistung und fehlende Funktionen im Browser sind kein Grund.

## Entscheid

- Prisma bleibt eine Web-App mit Three.js. Kein Wechsel auf eine Engine.
- Der Code wird mit Vite und npm gebaut und schrittweise in Module aufgeteilt, mit schrittweiser Einführung von
  TypeScript.
- Ein `dist/` speist alle drei Ziele: Browser (GitHub Pages), Android (Capacitor, ADR 0010) und Steam (Electron,
  ADR 0011).
- Three.js bleibt vorerst bei r147.

## Folgen

- Strahlregel, Löser, die Level der Geschichte, Golden und alle Prüfungen bleiben erhalten. Ein Neuschreiben hätte sie
  alle gefährdet.
- Der Start mit Doppelklick auf `index.html` entfällt; entwickelt wird mit `npm run dev`.
- Prüfungen und Werkzeuge, die heute Bereiche aus `index.html` lesen oder in sie schreiben, müssen umgestellt werden.
- Ein Bildvergleich sichert den Umbau ab, damit der Nutzer nicht jeden Schritt von Hand prüfen muss.
