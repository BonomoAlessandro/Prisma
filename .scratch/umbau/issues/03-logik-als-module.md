# 03: Spiellogik und markierte Bereiche als Module

**Spec:** ../spec.md

**Status:** ready-for-agent (umgesetzt, wartet auf Review)

**Blocked by:** 02

**What to build:** Die Bereiche, die Tests und Werkzeuge heute als Text aus `index.html` schneiden, werden echte Module
unter `src/`. Tests und Werkzeuge importieren sie, statt `indexOf('/* …:BEGIN')` und `new Function(…)` zu benutzen.
Das Spiel verhält sich und sieht genau gleich aus.

- [x] `LOGIC` (Strahlregel und Logik) als Modul, dazu `HALL` (Impulsantwort des Halls, läuft auch im Worker). Die
      neuen Module sind TypeScript, sofern das ohne Verhaltensänderung geht. Sonst vorerst JavaScript.
- [x] `index.html` bzw. das Hauptskript importiert die Module. Der Worker für den Hall lädt sein Modul, statt Quelltext
      zu bekommen. (Die Seite setzt die Module beim Build ein, siehe Notizen.)
- [x] `tests/logic.test.mjs`, `tests/golden.mjs`, `tests/hall.test.mjs`, `tests/vorrat.test.mjs`,
      `tests/ki-tester.test.mjs`, `tests/levelliste.test.mjs`, `tools/solver.mjs` und `tools/lader.mjs` importieren die
      Module (die übrigen Tests und Werkzeuge laden die Logik heute über `tools/solver.mjs`). Ein kleiner Weg dafür,
      dass Node die TypeScript-Module laden kann (z. B. über `tsx` oder Vite), steht im README.
- [x] `LEVELS`, `WUERFEL` und `GESCHICHTE` bleiben in diesem Ticket markierte Bereiche (Ticket 06 macht Datendateien
      daraus). Sie liegen heute innerhalb von `LOGIC`; wandern sie mit ins Modul, schreiben `tools/ordne-level.mjs`,
      `tools/ordne-wuerfel.mjs`, `tools/geschichte.mjs`, `tools/leveldaten.mjs` und `tools/vorrat.mjs` dorthin.
- [x] `tests/hall.test.mjs` bleibt bitgleich mit den Prüfsummen aus dem Stand `963177d`.
- [x] Golden (auch `--voll`, weil der Löser betroffen ist), Bildvergleich, alle Tests und Proben grün.

## Hinweise

- Die Bereiche finden: `grep -n ':BEGIN' index.html`.
- Golden muss gegen die **bestehende** Referenz grün bleiben, ohne `--write`.

## Notizen der Umsetzung

Umsetzer, 16./17.11.2026, Branch `ticket/umbau-03` (auf Ticket 02, danach `feature/umbau` mit Ticket 01 hineingeholt).

### Entscheide

- **Module unter `src/`:** `src/logik.js` (der ganze Bereich `LOGIC` samt `LEVELS`, `WUERFEL`, `GESCHICHTE`, Text
  unverändert bis auf den Kopfkommentar), `src/zufall.js` (`mulberry32`, gebraucht vom Hall), `src/hall.js`
  (`HALL_SECONDS`, `hallImpulse`; importiert `mulberry32`), `src/hall-worker.ts` (der Worker). `src/package.json` mit
  `"type": "module"`, damit Node die `.js` als ES-Module lädt (ohne das ganze Repo umzustellen; ohne Warnung).
- **Die Seite setzt die Module ein, statt sie zu importieren.** `index.html` hat drei klassische Skripte mit
  gemeinsamem globalem Bereich (Seitenstart in Stücken), und die Logik wird beim Laden gebraucht. Ein
  `<script type="module">` liefe erst nach allen klassischen Skripten (verzögert), und seine Namen wären nicht mehr
  global; beides hiesse, auch Skript 2 und 3 umzubauen (Ticket 04). Darum steht in `index.html` an der Stelle des
  Moduls die Marke `/* MODUL src/logik.js */` (ebenso `zufall`, `hall`), und `vite.config.mjs` setzt beim Build und im
  Dev-Server den Text des Moduls ein, ohne seine `import`-Zeilen und den `export`-Block am Schluss
  (`tools/seitenmodule.mjs`: `zerlege`, `setzeEin`). Im Spiel läuft so derselbe Code wie vorher, mit denselben
  globalen Namen (auch denen, die der Bildvergleich über `__prismaDebug` liest: `COLORS`, `STORY_LEVELS`). Verglichen
  mit dem alten `index.html` ändern sich im Build nur Kommentare, die Zeile `HALL_SECONDS` (jetzt im Modul) und der
  Start des Workers. Form eines solchen Moduls: am Anfang nur `import { … } from './x.js';` (x steht in der Seite
  weiter oben, `setzeEin` prüft das), am Schluss genau ein `export { … };` mit allen Namen der obersten Ebene
  (`tests/logic.test.mjs` prüft das mit dem Parser von Vite). Ändert sich ein eingesetztes Modul, lädt der Dev-Server
  die Seite neu. Mit Ticket 04 (übriger Code in Module) kann die Seite die Module direkt importieren, und die Marken
  fallen weg.
- **Worker des Halls:** `new Worker('__HALL_WORKER__', { type: 'module' })`; im Dev-Server setzt das Plugin
  `src/hall-worker.ts` ein (Vite übersetzt), im Build die eigene Datei `assets/hall-worker-<hash>.js` (`emitFile`,
  relativer Pfad, über `dist/` in `FILES` von `sw.js`). Kein Blob und kein Quelltext mehr. Lädt er nicht (alte
  Browser ohne Modul-Worker), rechnet die Seite wie bisher in Stücken im Hauptthread. **Build unverkleinert**
  (`minify: false`): Verkleinert machte Vite aus `Math.pow(…, 3.2)` ein `**`; der Worker ist die einzige JS-Datei des
  Builds, unverkleinert 1 KB.
- **TypeScript nur im Worker.** Die Module, die die Seite einsetzt und Node lädt, bleiben JavaScript: Typen müssten vor
  dem Einsetzen entfernt werden, und `transformWithOxc` (Vite) druckt den Code dabei neu (Kommentare, auch die Marken
  `LEVELS:END` usw., fallen weg, Zahlen und Format ändern sich). Das wäre nicht mehr derselbe Code. **Node und TS,
  geprüft für Ticket 04:** Node 22.12 mit `--experimental-strip-types` lädt `.ts` ohne Abhängigkeit (mit
  `ExperimentalWarning`); ohne Schalter geht es über einen Lade-Haken (`module.register`), der für `.ts` das Format
  `module-typescript` meldet, danach `await import('….ts')` (ebenfalls ohne Abhängigkeit). Ab Node 22.18 entfernt Node
  Typen von selbst. Steht im README unter «Module und TypeScript». Keine neue Abhängigkeit.
- **Node:** `tools/solver.mjs` liefert `L` als Namensraum von `src/logik.js` (alle 75 Namen, früher eine Auswahl).
  Wo ein Test eine geänderte Logik braucht (Golden: Gegenprobe mit umgelenktem `reflectOnMirror`; Vorrat, KI-Tester:
  Logik mit weiteren Leveln), führt er ihren Text aus wie früher (`ausText` bzw. `zerlege(…).code` mit `new Function`).
- **Werkzeuge schreiben in `src/logik.js`:** `tools/vorrat.mjs` (`LOGIK` statt `INDEX`), `ordne-level.mjs`,
  `ordne-wuerfel.mjs`, `geschichte.mjs`; die Meldungen nennen `src/logik.js`. `tools/ausbau.mjs` zählt `src/logik.js`
  als Spiellogik für den Stand des Codes.
- **KI-Tester:** `leveldaten.mjs` hat statt `seiteMitLeveln`/`seiteMitWuerfeln` (Kopie von `index.html` mit `<base>`)
  `logikMitLeveln`/`logikMitWuerfeln` (Spiellogik mit weiteren Leveln); `prepare.mjs` schreibt sie nach
  `<lauf>/seite/logik.js`; `shots.mjs` öffnet das Spiel über `spielServer`, mit einer solchen Logik als Seite
  `kandidaten.html` neben dem Build (`mitLogik` ersetzt in `dist/index.html` die Logik). Dafür hat `spielServer` die
  Option `seiten` (Seiten nur im Speicher). Der Fingerabdruck der Anker-Bilder umfasst jetzt `src/`.
- **Bildvergleich (Ticket 01) über `spielServer`** (`dist/` über http): nur die Zeile `seite` in
  `tests/bildvergleich.mjs`, wie in den Notizen von 02 vorgesehen; Referenzbilder unverändert.
- Kleinigkeiten: Kommentare und Doku, die den Bereich `LOGIC` nannten (`index.html`, README, `3D-WUERFEL.md`), zeigen
  auf `src/logik.js`. `tests/levelliste.test.mjs` suchte alte Schlüssel «ab `LOGIC:END`»; ohne den Bereich lieferte
  `indexOf` −1 und der Test prüfte nur noch ein Zeichen. Er prüft jetzt ganz `index.html` (die Logik steht nicht mehr
  darin, wie früher). `tests/logic.test.mjs` liest Teile der Seite aus `index.html` mit eingesetzten Modulen.

### Läufe

Über `tools/leise.sh` (`LEISE_MAX_CPU=100 LEISE_CPU=100 LEISE_VORRANG=3`), Browserläufe nacheinander, am Stand nach dem
Merge von `feature/umbau` (mit Ticket 01). Ein erster Gesamtlauf wartete Stunden an der Sperre, seine Ausgabe ging
verloren; ich brach ihn ab und startete nach dem Merge neu.

- **Werkzeuge am echten Stand:** `geschichte.mjs spiel`: «src/logik.js und Vorrat stimmen schon, nichts zu
  schreiben»; `ordne-level.mjs --schreiben`: «src/logik.js: Reihenfolge und Grade stimmen; levelliste.json:
  Duldungsliste und Prüfliste stimmen»; `ordne-wuerfel.mjs --schreiben`; `vorrat.mjs ablegen Fingerzeig Alkaid`, dann
  `zurueckholen`. Danach `src/logik.js`, `tools/vorrat/flach.js`, `tools/vorrat/wuerfel.js`, `index.html` byte-gleich
  (md5). `tools/levelliste.json` hatte danach LF statt CRLF, sonst gleich (`git diff` leer); das macht `ordne-level`
  schon vor diesem Ticket.
- **`npm test`:** alle grün (logic 2076, hall 7, vorrat 18, geschichte 35, levelliste 54, wuerfelliste 20, ki-tester
  84, beurteilung 206, generator 31; golden ohne `--write`).
- **`golden.mjs --voll`:** «alle 842 Level (davon 300 Würfel) wie in golden.json, Löser für alle Level» (25 s).
- **`hall.test.mjs`:** bitgleich mit den Prüfsummen aus `963177d` (44,1/48/96 kHz). Dazu rechnet `logic.test.mjs` den
  gebauten `assets/hall-worker-….js` in Node nach (gleiche Prüfsumme für 48 kHz), und im Browser (`screenshot.mjs`
  mit Skript) lädt die Seite `assets/hall-worker-BzBNKJAk.js`, und `hallData(48000)` hat dieselbe Prüfsumme
  `ba341507…`; Konsole ohne Meldungen.
- **`brett-probe.mjs`** (GPU=1, alle Abschnitte): «Brett: in Ordnung».
- **`geschichte-probe.mjs --dorf`** (GPU=1): bestanden, Konsole ohne Fehler.
- **`offline.mjs`:** bestanden (Service Worker aus dem Build, Skyboxen online und offline, Worker unter `assets/`).
- **KI-Tester:** `takeShots` über `spielServer` ohne Logik, dann mit `logikMitLeveln(alleText(), …)` ein Level des
  Spiels und ein Kandidat am Ende: alle Bilder geschrieben, Kopfzeile «Kandidat».
- **Bildvergleich** (`tests/bildvergleich.mjs`, ohne `--write`, alle 66 Bilder, 26 min 44 s): alle Bilder in der
  Toleranz (grösste Abweichung eines Pixels 2, Anteil 0,000 %), aber rot wegen einer Meldung der Konsole in der Ansicht
  «start» (alle drei Grössen): `404 favicon.ico`. Der Bildvergleich setzt den Spielstand auf `favicon.svg` als Seite,
  und über http fragt Chrome dann nach `/favicon.ico` (über file:// nie). Folge des Wechsels auf http, nicht der
  Logik. Behoben in `tools/spielserver.mjs`: `/favicon.ico` ohne Datei antwortet leer (204). Danach `--nur start` grün
  (3 Bilder, Abweichung 0).

### Abweichungen und Offenes

- Die Seite **importiert** die Module noch nicht, sie setzt sie beim Build ein (Begründung oben); echte Importe mit
  Ticket 04.
- `--seite`/`--vorher` der Messproben liefern eine `index.html` ungebaut aus ihrem Ordner: Das geht für Fassungen vor
  diesem Ticket; eine Fassung ab hier braucht den Build (die Logik steht nur als Marke darin).
- `spielServer` antwortet auf `/favicon.ico` leer (siehe Bildvergleich); im Build gibt es keine solche Datei.
- `shots.mjs` baut `dist/` je Aufruf von `takeShots` frisch (je etwa 2 s; `prepare.mjs` ruft es bis zu zweimal).
- Nicht gelaufen: die übrigen Proben (`start-`, `leerlauf-`, `ruhetakt-`, `spiegel-probe`, `geschichte-probe` ohne
  `--dorf`, `buehne-messung`); das bleibt dem Reviewer.

## Comments

### Review (unabhängiger Reviewer)

17.11.2026, Stand `1134648`. Ergebnis: **bestanden**, keine eigenen Korrekturen nötig. Läufe über `tools/leise.sh`
(`LEISE_MAX_CPU=100 LEISE_CPU=100 LEISE_VORRANG=2`), Browserläufe nacheinander. Zum Vergleich ein Worktree von
`feature/umbau` (`36653cf`).

**Läufe (Ticket / Basis)**

- `npm test`: alle grün (golden, logic, hall, vorrat, geschichte, levelliste, wuerfelliste, ki-tester, beurteilung,
  generator).
- `golden.mjs --voll` ohne `--write`: «alle 842 Level (davon 300 Würfel) wie in golden.json, Löser für alle Level».
- Bildvergleich ganz, ohne `--write`: **GRÜN**, 66 Bilder in 28 min 39 s, grösste Abweichung eines Pixels 3, Anteil
  0,000 %, Konsole ohne Meldungen (auch «start» mit der 204 für `favicon.ico`).
- `start-probe`: in Ordnung; «neu» `.go` 1,34 s, Knopf 4,24 s, ganz 10,19 s (Basis 1,45 / 4,35 / 10,11 s); «weiter»
  ganz 11,01 s (Basis 11,14 s). Kein Unterschied in der Ladezeit.
- `leerlauf-probe`: OK; Ruhe 28,4 Bilder/s, GPU 718 ms/s (Basis 28,4, 723 ms/s).
- `ruhetakt-probe`: OK (Basis OK). `spiegel-probe pruefe`: OK (Basis OK).
- `geschichte-probe --handy`, `--quer`, `--menue`, `--uebersicht`: alle bestanden, Konsole ohne Fehler. Die Basis
  hatte in `--uebersicht` zwei Lücken über 100 ms (232 und 126 ms, bekannt rot, `.scratch/energie/spec.md`).
- `buehne-messung`: gelaufen, Konsole leer (Basis ebenso).
- `brett-probe` (GPU=1): im ersten Lauf ein Fehler «tidePool → clay (flach): Lücke 1 Pixel im Kernquader»; wiederholt
  «Brett: in Ordnung». Die Basis war im einzigen Lauf grün. Eine Lücke von 1 Pixel im Übergang der Bretter hat mit
  Logik, Hall oder Worker nichts zu tun; ich werte das als Ausreisser, nicht als Fund.
- `offline.mjs`: bestanden (Basis ebenso).

**Bewertung der Abweichungen**

1. *Einsetzen statt Importieren:* sauber und eng gefasst. `zerlege` nimmt nur `import { … } from './x.js';` am Anfang
   und genau einen `export { … };` am Schluss an, alles andere wirft; `setzeEin` prüft, dass Importiertes weiter oben
   steht, und ersetzt über eine Funktion (keine `$`-Fallen). **Zeichengleich geprüft:** Basis und Ticket gebaut,
   `dist/index.html` verglichen. Unterschiede nur in Kommentaren (Kopf der Logik, `LOGIC:BEGIN/END`, `HALL:BEGIN/END`,
   zwei Verweise), die Zeile `HALL_WET` mit `HALL_SECONDS` aus dem Modul und der Start des Workers (Datei statt Blob);
   der Code der Logik (Zeilen 1416–8404) ist Zeichen für Zeichen gleich. Strenger Modus: `src/logik.js` läuft in Node
   als Modul strikt, in der Seite steht vor der Marke `'use strict';`, also gleich.
   *Fehlerorte:* Ein Fehler in der Logik zeigt auf `index.html` (Build oder Dev-Server), nicht auf `src/logik.js`; ohne
   Source-Map. Der Abstand ist fest (Zeile in der Seite − 1415 für `logik.js`), DevTools zeigen den Code in
   `index.html`, Haltepunkte in `src/logik.js` gehen nicht. Für die Zwischenzeit bis Ticket 04 vertretbar.
   *Werkzeuge:* `ordne-level`, `ordne-wuerfel`, `geschichte`, `vorrat` schreiben nur zwischen den Marken
   `…:BEGIN/END` und erhalten Zeilenenden (CRLF); den `export`-Block berühren sie nicht. Käme ein neuer Name auf die
   oberste Ebene, fiele das laut in `logic.test.mjs` auf (Block «Module»), nicht still.
2. *`minify: false`:* wirkt praktisch nur auf den Worker. Die klassischen Skripte in `index.html` hat Vite schon auf der
   Basis nie verkleinert. `dist/` 32 423 020 → 32 425 498 Bytes (+2,5 KB: Kommentare und Worker), `index.html` gzip
   443,38 → 443,93 KB, Worker 1,36 KB (gzip 0,80). Ladezeit gleich (siehe `start-probe`). **Die Begründung stimmt nur
   halb:** Verkleinert wird zwar `Math.pow(…, 3.2)` zu `** 3.2`, die Prüfsumme (48 kHz, `ba341507…`) bleibt in Node aber
   gleich, auch mit `minify: true`; nach ECMAScript sind `**` und `Math.pow` dieselbe Operation
   (`Number::exponentiate`). Rot würde nur die Textprüfung `Math.pow(1 - i / len, 3.2)` in `logic.test.mjs`. Engere
   Wege, geprüft (Worker allein gebaut): `build.target: 'es2015'` oder `rolldownOptions.output.minify.compress: false`
   behalten `Math.pow` und verkleinern (0,9 KB), Prüfsumme gleich. Heute lohnt das nicht. **Für Ticket 04** (dann geht
   der Code der Seite durch den Bundler, 1,5 MB) verkleinern und die Bitgleichheit über die Prüfsumme statt über den Text
   prüfen.
3. *TypeScript nur im Worker:* vertretbar; die Begründung (das Entfernen der Typen druckt den Code neu, Marken und Format
   gingen verloren) trägt. Hinweis: Es prüft nichts die Typen (kein `tsc`, Vite entfernt sie nur); mit Ticket 04 ein
   `tsc --noEmit` erwägen.

**Für das Zusammenführen:** `ticket/umbau-03` enthält `7fd7176` (sw.js nimmt unbekannte Dateien unter `assets/` in den
Speicher, Review 02) noch nicht. `git merge-tree` mit `feature/umbau` ist konfliktfrei; nach dem Merge `logic` und
`offline.mjs` laufen lassen (der Worker liegt unter `assets/`).
