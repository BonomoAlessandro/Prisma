# 02: Vite, npm und `dist/`; Prüfungen gegen den Build

**Spec:** ../spec.md

**Status:** ready-for-agent

**Blocked by:** 01

**What to build:** Prisma bekommt einen Build-Schritt mit Vite. Der Inhalt von `index.html` bleibt in diesem Ticket
fast unverändert. Es geht nur darum, dass das Spiel aus `npm run dev` und aus `dist/` genauso läuft wie heute und alle
Prüfungen dagegen laufen. **Meilenstein:** entfällt (Nutzer, 16.11.2026); der erste Handytest kommt nach Ticket 07.

- [ ] `package.json` mit Vite als einziger Abhängigkeit für den Build (Version fest, `package-lock.json` im Repo).
      Skripte: `dev`, `build`, `preview`, `test` (alle Node-Tests), `test:bild` (Bildvergleich).
- [ ] `vite.config` mit `base: './'`. Ausgabe nach `dist/` (in `.gitignore`).
- [ ] Statische Dateien, die heute direkt geladen werden (`vendor/`, `backgrounds/`, `icons/`, `favicon.svg`,
      `manifest.webmanifest`), kommen unverändert in den Build. Three.js bleibt vorerst als klassisches Skript
      eingebunden (r147, die globalen Namen bleiben).
- [ ] **Service Worker:** Die Liste `FILES`/`LAZY` in `sw.js` entsteht beim Build aus der Ausgabe, statt von Hand
      gepflegt zu werden. Die Regeln bleiben: was nicht jedes Gerät braucht (Teile der Skyboxen ohne `precache`), kommt
      nach `LAZY`. Dateinamen mit Hash aus dem Build dürfen direkt aus dem Speicher kommen wie heute `vendor/`. Der Test
      in `tests/logic.test.mjs`, der die Dateiliste prüft, wird angepasst. `tests/offline.mjs` läuft gegen `dist/`.
- [ ] `APP_VERSION` hat nur noch **eine** Quelle; `index.html` und `sw.js` bekommen sie beim Build.
- [ ] **Prüfungen:** Alle Proben und Tests, die `index.html` über `file://` öffnen, laufen gegen `dist/` über einen
      kleinen lokalen Server (oder `vite preview`). Tests, die markierte Bereiche aus dem Quelltext lesen (`LOGIC`,
      `HALL`, `LEVELS`, `WUERFEL`, `GESCHICHTE`), lesen weiter aus der Quelldatei, bis Ticket 03 sie ablöst.
- [ ] Werkzeuge, die in `index.html` schreiben (`tools/ordne-level.mjs`, `tools/ordne-wuerfel.mjs`, `tools/geschichte.mjs`,
      `tools/leveldaten.mjs`, `tools/vorrat.mjs` u. a.), schreiben weiter in die Quelldatei und funktionieren unverändert.
- [ ] Bildvergleich gegen `dist/` grün, `tests/golden.mjs` gegen die bestehende Referenz grün, alle Node-Tests und
      Proben grün.
- [ ] README: Starten (`npm install`, `npm run dev`), Bauen, Testen; der Hinweis auf den Doppelklick fällt weg.
- [ ] `APP_VERSION` hochsetzen und dem Nutzer sagen, wie er `dist/` auf dem Handy öffnet (z. B. `vite preview --host`
      im gleichen WLAN).

## Hinweise

- `tests/brett-probe.mjs` (etwa Zeile 290) hat schon einen kleinen Server für http; wiederverwenden statt neu bauen.
- Vite lädt Module über `file://` nicht. Darum laufen ab hier alle Proben über http.
- Achtung beim Service Worker während der Entwicklung auf `localhost` (README, «Offline»): Er bleibt registriert und
  liefert alte Stände. Im Dev-Server den Service Worker nicht registrieren.

## Comments
