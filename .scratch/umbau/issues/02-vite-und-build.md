# 02: Vite, npm und `dist/`; Prüfungen gegen den Build

**Spec:** ../spec.md

**Status:** ready-for-agent (umgesetzt bis auf Bildvergleich, wartet auf 01)

**Blocked by:** 01

**What to build:** Prisma bekommt einen Build-Schritt mit Vite. Der Inhalt von `index.html` bleibt in diesem Ticket
fast unverändert. Es geht nur darum, dass das Spiel aus `npm run dev` und aus `dist/` genauso läuft wie heute und alle
Prüfungen dagegen laufen. **Meilenstein:** entfällt (Nutzer, 16.11.2026); der erste Handytest kommt nach Ticket 07.

- [x] `package.json` mit Vite als einziger Abhängigkeit für den Build (Version fest, `package-lock.json` im Repo).
      Skripte: `dev`, `build`, `preview`, `test` (alle Node-Tests), `test:bild` (Bildvergleich).
- [x] `vite.config` mit `base: './'`. Ausgabe nach `dist/` (in `.gitignore`).
- [x] Statische Dateien, die heute direkt geladen werden (`vendor/`, `backgrounds/`, `icons/`, `favicon.svg`,
      `manifest.webmanifest`), kommen unverändert in den Build. Three.js bleibt vorerst als klassisches Skript
      eingebunden (r147, die globalen Namen bleiben).
- [x] **Service Worker:** Die Liste `FILES`/`LAZY` in `sw.js` entsteht beim Build aus der Ausgabe, statt von Hand
      gepflegt zu werden. Die Regeln bleiben: was nicht jedes Gerät braucht (Teile der Skyboxen ohne `precache`), kommt
      nach `LAZY`. Dateinamen mit Hash aus dem Build dürfen direkt aus dem Speicher kommen wie heute `vendor/`. Der Test
      in `tests/logic.test.mjs`, der die Dateiliste prüft, wird angepasst. `tests/offline.mjs` läuft gegen `dist/`.
- [x] `APP_VERSION` hat nur noch **eine** Quelle; `index.html` und `sw.js` bekommen sie beim Build.
- [x] **Prüfungen:** Alle Proben und Tests, die `index.html` über `file://` öffnen, laufen gegen `dist/` über einen
      kleinen lokalen Server (oder `vite preview`). Tests, die markierte Bereiche aus dem Quelltext lesen (`LOGIC`,
      `HALL`, `LEVELS`, `WUERFEL`, `GESCHICHTE`), lesen weiter aus der Quelldatei, bis Ticket 03 sie ablöst.
- [x] Werkzeuge, die in `index.html` schreiben (`tools/ordne-level.mjs`, `tools/ordne-wuerfel.mjs`, `tools/geschichte.mjs`,
      `tools/leveldaten.mjs`, `tools/vorrat.mjs` u. a.), schreiben weiter in die Quelldatei und funktionieren unverändert.
- [ ] Bildvergleich gegen `dist/` grün, `tests/golden.mjs` gegen die bestehende Referenz grün, alle Node-Tests und
      Proben grün.
- [x] README: Starten (`npm install`, `npm run dev`), Bauen, Testen; der Hinweis auf den Doppelklick fällt weg.
- [x] `APP_VERSION` hochsetzen und dem Nutzer sagen, wie er `dist/` auf dem Handy öffnet (z. B. `vite preview --host`
      im gleichen WLAN).

## Hinweise

- `tests/brett-probe.mjs` (etwa Zeile 290) hat schon einen kleinen Server für http; wiederverwenden statt neu bauen.
- Vite lädt Module über `file://` nicht. Darum laufen ab hier alle Proben über http.
- Achtung beim Service Worker während der Entwicklung auf `localhost` (README, «Offline»): Er bleibt registriert und
  liefert alte Stände. Im Dev-Server den Service Worker nicht registrieren.

## Notizen der Umsetzung

Umsetzer, 16.11.2026, Branch `ticket/umbau-02` (von `feature/umbau`, ohne Ticket 01).

### Entscheide

- **Vite 8.3.8** (fest, `package-lock.json`), einzige Abhängigkeit. `package.json` ohne `"type": "module"` (sonst
  läse Node die `.js`-Dateien unter `tools/vorrat/` und `tests/*-probe.js` anders); die Konfiguration heisst darum
  `vite.config.mjs`. Skripte: `dev`, `build`, `preview`, `test` (`tests/alle.mjs`: alle Node-Tests nacheinander, jeder
  bis zum Ende, Übersicht am Schluss), `test:bild` (`node tests/bildvergleich.mjs`, kommt mit 01).
- **`index.html` fast unverändert.** Was sie direkt lädt (drei Icons im Kopf, three.js r147, `backgrounds/skies.js`),
  trägt `vite-ignore`: Vite lässt es stehen und entfernt nur das Attribut. Ohne das hätte Vite die Icons mit Hash nach
  `assets/` kopiert und für jedes klassische Skript gewarnt. Der Inhalt von `<style>` geht durch Vite, aber
  unverkleinert (`cssMinify: false`); einzige Änderung im Build ist die Schrift: `url(vendor/jost/jost-latin.woff2)`
  wird `url(./assets/jost-latin-<hash>.woff2)`. Ein Test vergleicht `dist/index.html` mit der Quelle: gleich bis auf
  `vite-ignore`, die Schrift und `APP_VERSION`.
- **Statische Dateien** kopiert das Plugin `prisma` in `vite.config.mjs` nach dem Build unverändert nach `dist/`:
  `vendor/`, `icons/`, `favicon.svg`, `manifest.webmanifest`, aus `backgrounds/` das Register und genau die Teile, die
  es nennt (alte Stände bleiben weg). Was Vite schon selbst übernommen hat (die Schrift), wird nicht doppelt kopiert.
  Kein `public/`-Ordner (`publicDir: false`): Die Dateien bleiben, wo sie sind; `pack.mjs` und `icons.mjs` schreiben
  weiter dorthin.
- **Service Worker.** In der Quelle `sw.js` sind `FILES` und `LAZY` leer (`const FILES = []; // beim Build gefüllt`);
  der Build füllt sie aus dem, was in `dist/` liegt: alles nach `FILES`, ausser `sw.js` und den Lizenztexten
  (`LICENSE`, `*.txt`); Teile der Skyboxen ohne `precache` nach `LAZY` (heute 21 vorab, 9 beim ersten Gebrauch). Das
  `importScripts` des Registers fällt weg. `assets/` (Hash im Namen) kommt wie `vendor/` direkt aus dem Speicher.
  `SKIES` bleibt (pack.mjs führt es weiter nach, der Test dazu auch); nötig wäre es nicht mehr, weil die Dateinamen der
  Teile ihren Stand tragen und so `sw.js` ändern.
- **`APP_VERSION`:** einzige Quelle ist `appVersion` in `package.json` (jetzt `2026-11-16 umbau-02`). In `index.html`
  und `sw.js` steht der Platzhalter `__APP_VERSION__`; der Build setzt ihn in beiden ein, der Dev-Server in
  `index.html`.
- **Dev-Server ohne Service Worker:** Er setzt vor allem anderen `window.PRISMA_DEV = true`; `index.html` registriert
  dann keinen. Fragt ein alter, noch registrierter Service Worker derselben Adresse nach `sw.js`, bekommt er einen, der
  den Speicher `prisma-*` leert und sich abmeldet. Dazu liefert der Dev-Server `vendor/` und `backgrounds/` roh: Vite
  hängte an klassische Skripte sonst eine Source-Map an (bei den Skyboxen mehrere MB je Datei).
- **Eine Stelle für die Adresse des Spiels: `tools/spielserver.mjs`.** `spielServer()` baut `dist/` frisch (still,
  rund 2 s) und liefert es über einen kleinen Server auf `127.0.0.1` (freier Port); Rückgabe
  `{ base, seite(query), url(pfad), close() }`. Statt `sw.js` liefert er einen leeren Service Worker ohne
  Fetch-Handler: Die Seite läuft wie früher über file:// ohne Vorab-Speichern (die Messungen bleiben vergleichbar), und
  Chrome meldet keinen Fehler (eine 404 auf `sw.js` erschien als `[log:error]`, an dem mehrere Proben scheitern).
  `PRISMA_OHNE_BAU=1` nimmt das vorhandene `dist/`, `PRISMA_SPIEL=<url>` eine laufende Adresse (Dev-Server, preview).
  `seiteAus(pfad)` für `--seite`/`--vorher`: eine Kopie einer früheren `index.html` ungebaut aus ihrem Ordner.
  `baue(ordner)` baut in einen beliebigen Ordner (für `logic.test.mjs` und `offline.mjs`). Der Server aus
  `brett-probe.mjs` ist darin aufgegangen.
- **Umgestellt auf http/`dist/`:** `screenshot.mjs`, `brett-probe.mjs` (alle Abschnitte; `netz` drosselt weiter im
  Browser), `geschichte-probe.mjs`, `leerlauf-probe.mjs`, `ruhetakt-probe.mjs`, `spiegel-probe.mjs` (`--vorher` über
  einen zweiten Server aus dem Wurzelordner), `start-probe.mjs`, `buehne-messung.mjs`, `offline.mjs` (eigener Server
  wegen `--redirect` und Neustart, liefert jetzt `dist/` samt dem gebauten `sw.js`).
- **`tests/logic.test.mjs`, Block «Offline»:** baut einmal in einen Ordner im Temp-Verzeichnis und prüft dort: alles,
  was die gebaute Seite und das Manifest laden, steht in `FILES`; jede Datei der Listen existiert genau so geschrieben,
  keine doppelt; jede Datei des Builds steht in einer Liste (ausser `sw.js` und Lizenztexten); statische Dateien Byte
  für Byte wie die Quelle; `index.html` wie oben; Version aus `package.json` in beiden Dateien, Platzhalter in den
  Quellen. Dazu der Dev-Server (programmatisch gestartet): Version eingesetzt, `PRISMA_DEV` vor der Registrierung,
  `sw.js` meldet sich nur ab, `vendor/` und `backgrounds/` roh. Braucht `npm install`.
- Markierte Bereiche lesen alle Tests weiter aus der Quelldatei `index.html`; die Werkzeuge schreiben weiter dorthin
  (an ihnen nichts geändert). Probe: `node tools/geschichte.mjs spiel` am echten Stand meldet «stimmen schon, nichts zu
  schreiben», `index.html` byte-gleich (md5 vorher = nachher); die Hin-und-zurück-Tests in `vorrat.test.mjs`,
  `geschichte.test.mjs`, `levelliste.test.mjs` und `ki-tester.test.mjs` sind grün.

### Für den Bildvergleich (Ticket 01) nach dem Zusammenführen

`tests/bildvergleich.mjs` holt die Adresse über `tools/spielserver.mjs`: `const spiel = await spielServer();`, dann
`spiel.seite('noadapt&nointro&…')` statt der file://-URL, am Ende `await spiel.close()`. Die Referenzbilder bleiben
(sie stammen aus der heutigen `index.html`; nicht neu schreiben).

### Abweichungen und Offenes

- **KI-Tester** (`tools/ki-tester/shots.mjs`, `prepare.mjs`) öffnen ihre Kopien von `index.html` (mit `<base>` auf den
  Wurzelordner) weiter über file://. Das geht, solange `index.html` klassische Skripte hat; es sind Werkzeuge, keine
  Prüfungen. Spätestens mit Ticket 03/04 (Module) müssen sie über `spielServer` laufen. Über file:// zeigt die
  Leistungsanzeige dort den Platzhalter der Version.
- `tools/icons.mjs` rendert `favicon.svg` über file://, nicht das Spiel; bleibt.
- `dist/index.html` hat gemischte Zeilenenden (den von Vite wieder eingesetzten `<style>`-Inhalt mit LF); ohne Wirkung.
- Die Schrift liegt im Build nur unter `assets/` (mit Hash), nicht mehr unter `vendor/jost/`; `OFL.txt` liegt weiter
  bei.

### Auf dem Handy (Meilenstein 1)

Auf dem Rechner (im Repo nach dem Merge oder im Worktree): `npm install` (einmal), `npm run build`, dann
`npm run preview -- --host`. Vite zeigt `Network: http://192.168.…:4173/`; diese Adresse im Chrome des Handys im
gleichen WLAN öffnen (Windows-Firewall: beim ersten Mal Zugriff für Node erlauben). Über http mit einer Adresse im Netz
gibt es keinen Service Worker (nur https oder `localhost`); offline geht diese Fassung also nicht, das kommt mit GitHub
Pages (Ticket 09). Die Leistungsanzeige (`?perf`) zeigt `2026-11-16 umbau-02`.

### Läufe

Alle über `tools/leise.sh` (`LEISE_MAX_CPU=100 LEISE_CPU=100 LEISE_VORRANG=2`), Browserläufe nacheinander, gegen den
Stand `1b5acae`/`c9b0c30`. Die Zeiten der Proben enthalten das Warten an der Sperre (Ticket 01 lief gleichzeitig).

- `npm test` (`tests/alle.mjs`): alle grün. golden 4 s (ohne `--write`, gegen die bestehende Referenz), logic 49 s
  (2068 Tests, mit Build und Dev-Server), hall 0 s, vorrat 5 s, geschichte 485 s, levelliste 55 s, wuerfelliste 21 s,
  ki-tester 6 s, beurteilung 76 s, generator 69 s.
- `screenshot.mjs`: Menü über http aus `dist/`, Schrift Jost geladen, Konsole ohne Meldungen.
- `offline.mjs` und `offline.mjs --redirect`: je 36 Prüfungen, bestanden (Service Worker aus dem Build, alle Skyboxen
  online und offline).
- `start-probe.mjs`: in Ordnung (neu: Knopf 2,91 s nach `.go`; weiter: 2,90 s).
- `leerlauf-probe.mjs` und `--still`: OK (Reaktion je im nächsten Bild; Ruhe 28,4 Bilder/s).
- `ruhetakt-probe.mjs`: OK (Ruhe 28,6 Bilder/s bei 56,9 Bildschirmbildern). Der erste Lauf von leerlauf und ruhetakt
  scheiterte an meinem Fehler (`seite` im Ergebnis-JSON nicht mehr definiert), behoben in `c9b0c30`.
- `spiegel-probe.mjs` (pruefe): OK.
- `brett-probe.mjs` (alle Abschnitte, auch `netz` über den Server): 100 Prüfungen, «Brett: in Ordnung».
- `geschichte-probe.mjs` (Desktop, alle Grade, 2 Welten) und `--dorf`: bestanden, Konsole ohne Fehler.
- `buehne-messung.mjs` (messen): durchgelaufen, Konsole leer.
- `vite preview --host`: liefert `dist/` auf `localhost` und im WLAN (`Network: http://192.168.1.33:…`).
- Dev-Server im Browser (`npx vite`, dann `PRISMA_SPIEL=http://localhost:5199/ node tests/screenshot.mjs …`): Spiel
  läuft, `navigator.serviceWorker.getRegistrations()` leer, `PRISMA_DEV` gesetzt, Version eingesetzt; in der Konsole
  nur die Meldungen des Vite-Clients.
- Nicht gelaufen: die Proben mit `--seite`/`--vorher` (Vorher-Fassung), `geschichte-probe` auf dem Handy und die
  übrigen Abläufe (`--menue`, `--uebersicht`, `--ganz` usw.); das bleibt dem Reviewer.
- Bildvergleich gegen `dist/`: offen, wartet auf Ticket 01.

## Comments
