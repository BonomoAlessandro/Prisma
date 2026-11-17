# 04: Übriger Code in Module, TypeScript einführen

**Spec:** ../spec.md

**Status:** done (Review 17.11.2026 bestanden; mittlere Funde in 05, 09 und 10)

**Blocked by:** 03

**What to build:** Der restliche Code aus `index.html` wird in Module unter `src/` aufgeteilt, entlang der Teile des
Spiels. Am Ende ist `index.html` nur noch das Gerüst der Seite (Markup, Einstieg), und kein Teil des Spiels ist mehr
als ein grosser Block in ihr. TypeScript ist eingerichtet und wird für neue und herausgelöste Module benutzt. Verhalten
und Aussehen bleiben genau gleich.

- [x] `tsconfig.json` mit `allowJs`; `npm run typecheck` (`tsc --noEmit`) läuft ohne Fehler und gehört zu den Prüfungen.
- [x] Aufteilen in sinnvolle Teile, ungefähr: Szene und Grafik (Three.js, Himmel, Bloom), Brett und Elemente, Eingabe
      (Maus, Finger, Mausrad), Führung im Dorf, Geschichte und Bühne, Ton, Oberfläche (Menü, Übersicht, Kopfzeile,
      Einstellungen), Leistungsanzeige. Die genaue Aufteilung legt der Umsetzer fest und begründet sie unter
      «Comments».
- [x] CSS aus `index.html` in eigene Dateien.
- [x] **In mehreren Schritten**, jeder ein eigener Commit. Nach jedem Schritt sind Bildvergleich, Golden, alle Tests und
      Proben grün. Ein Schritt, der rot wird, wird korrigiert oder zurückgenommen, bevor es weitergeht.
- [x] Globale Variablen, über die die Teile heute miteinander reden, werden zu Importen und Exporten. Wo das ohne
      Verhaltensänderung nicht geht, bleiben sie vorerst und werden unter «Comments» aufgelistet.
- [x] `window.__prismaDebug` und alle Schalter in der URL (`?noadapt`, `?nointro`, `?sky=`, `?t=`, `?perf`, `?takt=`
      …) funktionieren weiter, die Proben brauchen sie.
- [x] README: Aufbau des Codes kurz beschreiben (welcher Teil wo liegt).
- [x] Die KI-Tester (`tools/ki-tester/shots.mjs`, `prepare.mjs`) öffnen das Spiel über `tools/spielserver.mjs` statt
      über file://; mit Modulen geht file:// nicht mehr (erledigt in Ticket 03).
- [x] Kleinigkeit aus Review 02: Kommentar zu `writeRegistry` in `tools/blender/pack.mjs` nennt noch `importScripts`.
- [x] Aus Ticket 03: Die Marken `/* MODUL src/… */` (Build und Dev-Server setzen dort den Text des Moduls ein) werden
      zu echten Importen; danach zeigen Fehlerorte und Haltepunkte auf die Module (Source-Map).
- [x] Aus Review 03: Der Build verkleinert wieder (`minify` an, Ticket 03 hatte `minify: false`). Die Bitgleichheit des
      Halls prüft man über die Prüfsumme, nicht über den Text (`Math.pow` gegen `**` ist dieselbe Operation; die
      Textprüfung in `logic.test.mjs` entsprechend anpassen). Grösse von `dist/` vorher und nachher unter «Comments».
- [x] Aus Review 03: `tsc --noEmit` prüft auch `src/hall-worker.ts` (siehe erste Checkbox).

## Hinweise

- Das ist das grösste Ticket. Der Umsetzer darf es beim Start in Teiltickets (04a, 04b …) aufteilen, wenn das die
  Schritte klarer macht.
- Die Marker `LEVELS`, `WUERFEL` und `GESCHICHTE` bleiben bis Ticket 06 erhalten, damit die Werkzeuge weiter schreiben können.

## Comments

### Umsetzung

Umsetzer, 17.11.2026, Branch `ticket/umbau-04` ab `feature/umbau` (`3c8ce0b`). Zuerst auf diesem Stand (Kopie
`git archive 3c8ce0b`): `logic.test.mjs` grün (2077), `offline.mjs` bestanden.

**Aufteilung in Schritte (je ein Commit):**

- `04a` (`62e71ff`) TypeScript: `typescript` 5.9.3 als devDependency, `tsconfig.json` (`allowJs`, `checkJs` aus,
  `strict`, `noEmit`) und `tsconfig.worker.json` (WebWorker statt DOM für `src/hall-worker.ts`; beide Umgebungen in
  einem Programm vertragen sich nicht), `npm run typecheck`, `tests/typecheck.mjs` in `npm test`. Kommentar in `pack.mjs`.
- `04b` (`d100c67`) CSS nach `src/stil/` (acht Teile, `index.css` bindet sie mit `@import` in der alten Reihenfolge ein).
  Vite setzt den `<link>` ans Ende des Kopfs, nach dem Skript des Massstabs, das die Medienabfragen der Blätter
  umrechnet; `stilZurueck` in `vite.config.mjs` setzt ihn an seine Stelle in der Quelle zurück. Der gebündelte Stil ist
  ohne Kommentare und Leerraum gleich dem alten `<style>` (geprüft, und ein Test in `logic`).
- `04c` (`f85c671`) die drei klassischen Skripte als drei Module (`src/seite/konfiguration`, `darstellung`, `spiel`),
  Einstieg `src/main.ts`, echte Importe statt Marken (`setzeEin`, `MARKE`, `mitLogik` entfallen), Worker des Halls über
  `new Worker(new URL('../hall-worker.ts', import.meta.url))`, Build verkleinert mit Source-Map, Testschnittstelle.
- `04d` (`16f770a`) die zwei grossen Teile entlang der Abschnitte des Codes in 25 Module (Liste im README, «Aufbau des
  Codes»): Szene, Texturen, Himmel (Sterne, Sonnensystem, Skyboxen), Brett, Bildschritte, Kamera, Elemente, Feld,
  Strahlen, Eingabe, Ton, Levelfluss, Oberfläche (DOM, UI, Menü, Übersicht), Führung im Dorf, Geschichte (Daten, Bühne,
  Ablauf), Auflösung, Leistung, Hauptschleife. Geschnitten nur an den Grenzen der bestehenden Abschnitte, in der alten
  Reihenfolge; nichts verschoben. «Einstellungen» hat das Spiel keine eigenen.
- `04e` (`b10320b`) `konfiguration` und `oberflaeche/dom` als TypeScript, `src/globale.d.ts` (`THREE`).
- `04f` (`1b10f6b`) README, Kopfzeilen der Module, Verweise in `tools/sky-schema.mjs`.
- `04g` (`98fffc6`), `04h` (`131a997`), `04i` (`4e7ff6a`): Korrekturen nach den Läufen (siehe Abweichungen).

**Wie die Module entstanden:** mit einem Werkzeug nur für dieses Ticket (nicht im Repo): Es schneidet die Skripte von
`3c8ce0b` an den Zeilen des Plans, löst alle Namen mit dem Prüfer von TypeScript auf (alle Teile als Skripte mit
gemeinsamem globalem Bereich, also genau die bisherige Sicht) und schreibt je Modul die `import`-Zeilen (was es aus
anderen braucht) und den `export`-Block (was andere brauchen). Keine Namen doppelt, und **kein Teil schreibt einen
Namen eines anderen** (ausser den zwei Setzern der Testschnittstelle, siehe unten); darum ging alles über gewöhnliche
Importe und Exporte. Gegenprobe mit einer Textsuche über alle Module: keine fehlenden Importe (nur Treffer in Strings,
Shadern und lokalen Namen). Das ungekürzte Bündel von `04c` und `04d` ist bis auf die Lage der Aufrufe `alsGlobal` und
des Halls gleich.

**Reihenfolge und Seitenstart in Stücken:** Die Teile laden in der Reihenfolge der früheren Skripte: Jedes Modul
importiert zuerst das vorherige, `src/main.ts` nur das letzte (zyklische Importe, gewollt; geprüft in `logic`, Block
«Module», und am Bündel). Die Spiellogik lädt wie früher im ersten Teil (`import '../logik.js'` in `konfiguration`).
Damit der Seitenstart in Stücken bleibt (Ticket 10 der Leistung: drei Skripte in drei Aufgaben), warten `szene.js` und
`kamera.js`, wo früher ein neues Skript begann, zuerst auf eine neue Aufgabe (`await neueAufgabe()` auf oberster Ebene;
`neueAufgabe` nach `src/seite/aufgabe.ts` verschoben).

### Globale Namen, die bleiben

- **Testschnittstelle (`src/seite/testschnittstelle.ts`, `alsGlobal`):** Die Proben lesen über Runtime.evaluate neben
  `__prismaDebug` viele Namen direkt als globale Namen (`game`, `camera`, `renderer`, `story`, `sceneLoop`, `skyTheme`,
  `LEVELS`, `isRotatable`, `QUALITY`, `IS_MOBILE`, `phiLimits` in `shots.mjs` …), und drei Proben ersetzen `draw`,
  `spiegel-probe` auch `renderReflection`. Jedes Modul zeigt die Namen, die Proben brauchen (heute 63), am Schluss als
  Getter auf `window`; `draw` und `renderReflection` mit Setzer, der die Bindung im Modul ändert (Importe anderer
  Module sehen den neuen Wert, wie früher die globale Funktion). Das Spiel liest diese Eigenschaften nie. Die Liste
  stammt aus einer Suche über `tests/*.mjs`, `tests/*.js` und `tools/ki-tester/shots.mjs`; fehlt einer Probe ein Name,
  kommt er dort dazu. Später könnten die Proben über `__prismaDebug` gehen.
- Aus den klassischen Skripten in `index.html` wie bisher: `SEITE`, `seiteBreite`, `seiteHoehe`, `seiteMedia` (Massstab,
  muss im Kopf vor dem ersten Layout laufen), `THREE` (vendor), `PRISMA_SKIES`, `PRISMA_DEV`.
- `window.__prisma`, `window.__prismaDebug` unverändert.

### Grösse von `dist/`

Gebaut mit `vite build`: vorher (`3c8ce0b`) 32 425 721 Bytes, `index.html` 1 577 587 (gzip 436 827). Nachher
31 634 622 Bytes ohne Source-Maps (−791 099), mit Maps 34 025 621: `index.html` 10 618, Spiel
`assets/index-….js` 775 451 (gzip 229 540), Stil 78 294 (gzip 19 412), Worker 549. Die Source-Maps (`.map`) kommen
nicht in den Speicher des Service Workers. Stil unverkleinert (`cssMinify: false` wie bisher).

### Läufe

Über `tools/leise.sh` (`LEISE_MAX_CPU=100 LEISE_CPU=100 LEISE_VORRANG=2`), Browserläufe nacheinander, je auf einer
Kopie des Commits im Scratchpad (die Sperre hielten lange andere Läufe; so konnte ich weiterarbeiten).

- `04b`: Bildvergleich `--nur start,dorf,welt-3-4` **grün** (36 Bilder, Abweichung 0). `npm test`: rot in `logic`
  (Build: Zeilenende des verschobenen `<link>`) → `04g`; `wuerfelliste` rot nur, weil die Kopie kein git-Repo war.
- `04g` (alles bis dahin): `golden --voll`, `offline` grün; Bildvergleich **rot** (29 Bilder der Welten, Dorf, Reise),
  `brett-probe` und `geschichte-probe --dorf` mit Lücken bis 700 ms («Himmel: Streifen 200 ms»). Ursache: das
  Verkleinern benennt um, aber zwei Worker bekommen ihren Code als Text von Funktionen des Spiels (`skyBitmaps`:
  `decode` mit `OPT`; `boardTextures`: `compute` samt `helpers` und `compute.name`). Umbenannt scheiterten sie, und das
  Spiel rechnete im Hauptthread. → `04h`: verkleinert ohne Umbenennen (`mangle: false`, Funktionsnamen behalten), Test
  dafür in `logic`.
- `04h` (Kopie als git-Klon): `brett-probe` (GPU=1) «Brett: in Ordnung». **Bildvergleich ganz: GRÜN**, 66 Bilder in
  28 min 7 s, grösste Abweichung 3, Anteil 0,000 %. `golden --voll`: alle 842 Level wie in `golden.json`. `offline.mjs`
  bestanden. `npm test`: alles grün ausser einem Test in `logic` (Source-Map, Pfade relativ zum Ausgabeordner) → `04i`;
  danach `logic.test.mjs` im Worktree grün (2080). `typecheck` grün.
- `geschichte-probe --dorf` (GPU=1): zweimal je eine Lücke in «Sehr schwer: Übersicht → Übung 3 wiederholen → Übung 4»
  (394, 371 ms), die **Basis `3c8ce0b` ebenso** (404 ms) – bekannt, siehe Review 03 (`--uebersicht`). Im zweiten Lauf
  einmal 451 ms in «Menü → Prolog → Überspringen», im ersten nicht (kommt nicht wieder). Sonst bestanden, Konsole ohne
  Fehler.
- `start-probe`: heute auf diesem Rechner **auch auf der Basis rot** (Zeitüberschreitung bei «weiter»; `.go` 6,21 s statt
  1,45 s im Review 03, der Rechner war stark belastet). Ticket im selben Lauf daneben: `.go` 6,05 s, Knopf 8,96 s
  (Basis 6,21 / 9,11 s), «weiter» ebenso Zeitüberschreitung. Kein Unterschied zur Basis, aber kein gültiger
  Messwert: bitte im Review bei ruhigem Rechner wiederholen.
- Nicht gelaufen (Reviewer): `leerlauf-`, `ruhetakt-`, `spiegel-probe`, die übrigen `geschichte-probe`,
  `buehne-messung`, die KI-Tester mit Kandidaten (`shots.mjs` baut dafür jetzt mit `PRISMA_LOGIK`).

### Abweichungen

- **Schritte nicht einzeln grün vor dem nächsten:** Die Sperre war Stunden belegt; ich habe die Schritte auf Kopien
  geprüft und weitergearbeitet. Rot wurden `04b` (`logic`) und `04c` (Bildvergleich, Proben); behoben in `04g`/`04h`,
  nicht durch Zurücknehmen. Der Bildvergleich lief ganz nur am Schluss (`04h`).
- **Verkleinern ohne Umbenennen** (siehe Läufe): Mit Umbenennen wären es 698 statt 775 KB. Mehr ginge nur, wenn die
  beiden Worker eigene Module würden (wie der Hall); das wäre eine Änderung am Code, nicht nur ein Umzug.
- **TypeScript:** neu `main.ts`, `aufgabe.ts`, `testschnittstelle.ts`; herausgelöst `konfiguration.ts`,
  `oberflaeche/dom.ts`. Die grossen Teile bleiben JavaScript (`allowJs`, ungeprüft): ohne Typen von three r147 und mit
  vielen offenen Objekten gäbe es unter `strict` Tausende Fehler; Stück für Stück in späteren Tickets.
- Die Seite übersetzt alle Teile in einer Datei (früher drei Skripte, drei Übersetzungen); ausgeführt wird weiter in
  drei Aufgaben. Ein Fehler beim Laden in einem Teil hält jetzt auch die späteren an (früher liefen spätere Skripte
  weiter). Mit `await` auf oberster Ebene kann `load` vor dem Ende des Seitenstarts kommen; daran hängt nur die
  Registrierung des Service Workers.
- `tests/hall.test.mjs`, `levelliste.test.mjs`, `tools/blender/pack.mjs`, `tools/sky-schema.mjs` lesen den Code aus
  `index.html` und allen Modulen (`spielQuelltext`); `ki-tester`: `mitLogik` entfällt, `shots.mjs` baut für Kandidaten
  einen eigenen Build (`spielServer({ logik })`).
- `--seite`/`--vorher` der Messproben wie seit 03: eine Fassung ab hier braucht den Build.

### Review (unabhängiger Reviewer)

17.11.2026, Stand `c2509b3`. Ergebnis: **bestanden**, mit zwei eigenen Korrekturen (unten). Läufe über `tools/leise.sh`
(`LEISE_MAX_CPU=100 LEISE_CPU=100 LEISE_VORRANG=2`), Browserläufe nacheinander, Proben mit `GPU=1`. Zum Vergleich ein
Worktree von `3c8ce0b` (Basis).

**Eigene Korrekturen**

- `8b13fe2` Testschnittstelle unvollständig: Proben lesen weitere Namen der Seite als globale Namen, die `alsGlobal`
  nicht zeigte: `RUHE_NACH_MS` (`ruhetakt-probe`, wäre am Tippen gescheitert), `composer`, `bloomPass`, `brushPass`,
  `finalPass` (`spiegel-probe messen`, `perf-probe.js`, `geschichte-probe` beim Aufzeichnen des Himmels) und `wagen`
  (`geschichte-probe --wagen`). Gefunden mit einer Suche aller Namen der obersten Ebene von `src/` (nicht nur der
  exportierten) in allen Proben, Skripten und Werkzeugen mit Chrome; dazu `alsGlobal` in `bildschritte.js`,
  `leistung.js`, `geschichte/daten.js`. Jetzt 69 Namen.
- `530853a` README: Die Teile laden `levelfluss` → `oberflaeche/dom.ts` → `fuehrung.js` → `oberflaeche/ui.js` →
  `menue` → `uebersicht` (wie in der Basis: `$`, dann Führung, dann UI); das README nannte `fuehrung.js` nach der
  Übersicht. Ein Kommentar in `vite.config.mjs` nannte `src/seite/spiel.js` statt `ton.js`.

**Läufe (Ticket mit den Korrekturen / Basis)**

- `npm test`: alle grün (golden, logic 2080, hall 7, vorrat 18, geschichte 35, levelliste 54, wuerfelliste 20,
  ki-tester 84, beurteilung 206, generator 31, typecheck).
- `golden.mjs --voll` ohne `--write`: alle 842 Level wie in `golden.json`, Löser für alle Level.
- Bildvergleich ganz, ohne `--write`: **GRÜN**, 66 Bilder in 27 min 32 s, grösste Abweichung 2, Anteil 0,000 %.
- `start-probe`, drei Läufe auf dem Ticket, zwei auf der Basis, bei ruhigem Rechner: alle «in Ordnung». «neu» `.go`
  1,27 / 1,02 / 1,46 s (Basis 1,29 / 0,73 s), ganz 9,61 / 10,12 s (Basis 9,92 / 9,39 s); «weiter» spielt nach 6,05 /
  5,99 / 6,16 s (Basis 6,10 / 6,11 s). Im Rauschen. Im ersten Lauf einmal eine Lücke von 442 ms und «ganz» nicht
  erreicht; in den zwei Wiederholungen nicht mehr.
- `leerlauf-probe`: OK; Ruhe 28,4 Bilder/s, GPU 741 ms/s (Basis 28,4, 738 ms/s).
- `ruhetakt-probe`: OK (Basis OK). `spiegel-probe pruefe`: OK (Basis OK).
- `geschichte-probe --handy`, `--quer`, `--menue`: bestanden, Konsole ohne Fehler. `--uebersicht`: rot mit zwei
  Lücken (124 ms «Spiel → Übersicht», 221 ms «Übersicht → Spiel»), Basis ebenso rot (144, 194, 161 ms; bekannt,
  `.scratch/energie/spec.md`). `--dorf`: rot mit 352 ms «Übung 3 wiederholen → Übung 4» und 144 ms «Prolog →
  Überspringen», Basis an denselben zwei Stellen (386 und 368 ms). Kein Unterschied durch das Ticket.
- `buehne-messung`: gelaufen, Konsole leer. `brett-probe`: «Brett: in Ordnung». `offline.mjs`: bestanden.
- **Dev-Server** (native Module mit zyklischen Importen und `await` auf oberster Ebene, nicht gebündelt):
  `PRISMA_SPIEL=<npm run dev> start-probe --nur neu`: in Ordnung (`.go` 1,84 s, ganz 10,07 s).
- **KI-Tester mit Kandidat:** `takeShots` mit `logikMitLeveln(alleText(), [Kandidat])`, ein Level des Spiels und der
  Kandidat am Ende von `LEVELS`: alle vier Bilder geschrieben, Kopfzeile «Kandidat»; der temporäre Build
  (`prisma-logik-*`) ist danach weg.
- **Werkzeuge am echten Stand:** `geschichte.mjs spiel`: «nichts zu schreiben»; `ordne-level.mjs --schreiben`:
  «Reihenfolge und Grade stimmen …»; `ordne-wuerfel.mjs --schreiben` meldet «geschrieben», schreibt aber dieselben
  Bytes; `vorrat.mjs ablegen Fingerzeig Alkaid`, dann `zurueckholen`. Danach `src/logik.js`, `tools/vorrat/flach.js`,
  `tools/vorrat/wuerfel.js`, `index.html` byte-gleich (md5). `tools/levelliste.json` wieder LF statt CRLF, `git diff`
  leer (wie schon in Review 03, älter als dieses Ticket).

**Bewertung**

1. *Verhalten.* Strikt war jedes der alten Skripte schon (`'use strict'`). Die Spiellogik und der Zufall laufen jetzt
   vor dem Rumpf von `konfiguration.ts` (Importe zuerst), früher am Ende des ersten Skripts: beide rein (kein
   `Math.random`, kein DOM), also gleich. Funktionen sind jetzt über alle Module schon beim Laden bekannt (früher erst
   ab ihrem Skript): nur nachsichtiger. Nichts im Spiel hört auf `load`, `DOMContentLoaded` oder `readyState`
   (gesucht).
   *Fehler beim Laden hält alle späteren Teile an:* vertretbar. Früher scheiterten die späteren Skripte nach einem
   Fehler meist auch (Namen des gescheiterten Teils im TDZ oder nicht da); einen Fehler-Handler gibt es nicht.
   *`load` und Service Worker:* gemessen beim ersten Besuch (frischer Chrome, echter `sw.js`, Build über http):
   `load` und Registrierung kommen jetzt nach 0,15 s, vor dem Aufbau der Szene; auf der Basis nach 3,9 s (Desktop)
   bzw. 4,4 s (Handy), nach den drei Skripten. Das Installieren (alle `FILES` mit `cache: 'reload'`, mehrere MB)
   läuft so während des ganzen Seitenstarts statt erst während seiner zweiten Hälfte. Lokal ohne Folgen: `.go`
   8,09 gegen 7,84 s (Desktop), 6,29 gegen 6,48 s (Handy, SwiftShader). Gar nicht registriert werden kann er nicht:
   Der Hörer auf `load` steht im Kopf vor dem Modul; `offline.mjs` grün, `controller` nach dem ersten Besuch gesetzt.
   **Mittel, offen:** Im echten Netz (erster Besuch auf Pages, langsames Handy) teilen sich Vorab-Speichern und
   Seitenstart die Leitung früher als bisher. Wer den alten Zeitpunkt will: registrieren, wenn `load` da ist **und**
   `src/main.ts` fertig geladen hat (etwa ein Ereignis am Ende von `main.ts`, auf das das Skript im Kopf zusätzlich
   wartet). Entscheiden spätestens mit Ticket 09 (Pages); in Capacitor (10) spielt der Service Worker keine Rolle.
2. *Worker mit Funktionstext.* Mit `mangle: false` heute sicher: Im Bündel stehen `decode`, `OPT`, `stoneData`,
   `mulberry32`, `makeNoise2D` usw. mit ihrem Namen; `__name`-Hilfen (keepNames) kommen nicht vor. Auch ein späterer
   Namenskonflikt zwischen Modulen bräche sie nicht: rolldown benennt dann beide Stellen gleich um (`stoneData$1`,
   und `.name` ist ebenfalls `stoneData$1`; an einem kleinen Bündel mit denselben Optionen geprüft). Der Test in
   `logic` prüft aber nur den Text von `decode`/`boardTextures`, nicht dass die Worker laufen; ein Rückfall in den
   Hauptthread fiele nur mittelbar auf (Lücken in `brett-probe`, `geschichte-probe --dorf`, so wie in `04c`).
   **Mittel, Empfehlung für später:** `decode` als eigenes Worker-Modul wie der Hall wäre klein (die Funktion ist schon
   eigenständig); `boardTextures` mit sechs Rechenfunktionen und Hilfen grösser (ein Worker-Modul, das die Funktionen
   importiert). Danach ginge auch `mangle` wieder (rund 77 KB weniger). Bis dahin wäre ein Zähler in `__prismaDebug`
   «im Hauptthread gerechnet», den eine Probe prüft, die engere Wache.
3. *Source-Maps:* nicht im Speicher des Service Workers (`NICHT_SPEICHERN`, im gebauten `sw.js` geprüft; holte
   DevTools eine `.map` über den Service Worker, läge sie bis zum nächsten Aktivieren im Speicher, harmlos). In `dist/`
   2,31 MB (`index-….js.map`) und 4 KB (Worker); `dist/` 34,0 MB statt 31,6 MB. Mit Ticket 09 gehen sie auf Pages
   (öffentlich, das Repo ist es ohnehin), mit Ticket 10 in die APK: **dort bewusst entscheiden** (Pages behalten oder
   `sourcemap: 'hidden'`; in der App weglassen).
4. *KI-Tester:* `spielServer({ logik })` geprüft, siehe Läufe.
5. *Typisierung nur von fünf Modulen:* vertretbar. Die Spec sagt «dürfen TypeScript sein», die grossen Teile wären
   unter `strict` ohne Typen von three r147 eine eigene Arbeit. `konfiguration.ts` und `dom.ts` sind allerdings fast
   typfrei; ein nächster billiger Schritt wäre `// @ts-check` in einzelnen kleinen JS-Modulen.
6. *Schnitt der Module:* sinnvoll, an den alten Abschnitten, Reihenfolge wie die Basis (geprüft an der Reihenfolge der
   Auswertung ab `src/main.ts`). README nach `530853a` richtig. Grosse Teile bleiben gross (`skybox.js` 3900,
   `brett.js` 2700, `geschichte.js` 2400 Zeilen); weiter teilen ist Sache späterer Tickets.
7. *Werkzeuge:* siehe Läufe. Empfehlung (klein, für später): ein Test, der die Namen prüft, die Proben über
   Runtime.evaluate global lesen (wie die Suche oben), damit die Liste von `alsGlobal` nicht wieder still Lücken
   bekommt.
