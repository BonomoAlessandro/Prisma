# 05: Speicherschicht

**Spec:** ../spec.md

**Status:** ready-for-agent (umgesetzt, wartet auf Review)

**Blocked by:** 04

**What to build:** Aller Zugriff auf den Spielstand läuft über ein Modul, die Speicherschicht. Heute steckt dahinter
`localStorage`. Später kann jede Plattform eine eigene Umsetzung einsetzen (Capacitor, Electron mit einer Datei für
Steam Cloud), ohne dass sich das Spiel ändert.

- [x] Ein Modul mit einer kleinen Schnittstelle (lesen, schreiben, löschen je Schlüssel) und einer Umsetzung für
      `localStorage`. Die Plattform wählt die Umsetzung beim Start; in diesem Ticket gibt es nur die eine.
- [x] Kein anderer Teil des Codes greift mehr direkt auf `localStorage` zu (ein Test prüft das im Quelltext).
- [x] **Schlüssel und Format bleiben gleich** (z. B. `prisma.noa.<grad>`, `prisma.noa.<grad>.bestwerte`,
      `prisma.noa.zuletzt`). Ein Spielstand von heute wird ohne Umrechnung weiter gelesen. Ein Test lädt einen heutigen
      Spielstand und prüft, dass Fortschritt, Bestwerte und Einstellungen erhalten bleiben.
- [x] Schlägt das Speichern fehl (privater Modus, voller Speicher), läuft das Spiel weiter wie heute.
- [x] Bildvergleich, Golden, alle Tests und Proben grün.
- [x] Begriff «Speicherschicht» in `CONTEXT.md`.
- [x] Aus Review 04: Ein Test prüft, dass jeder Name, den die Proben global lesen (`tools/*-probe*`, `perf-probe.js`
      …), in der Testschnittstelle steht (`alsGlobal`), damit die Liste nicht wieder still Lücken bekommt.
- [x] Aus Review 04: Der Worker für `decode` (Skyboxen) wird ein eigenes Worker-Modul wie der Hall, statt Funktionstext
      zu bekommen. Wenn auch `boardTextures` sauber geht, ebenso; dann `mangle` im Build wieder an (rund 77 KB weniger).
      Sonst bleibt `mangle: false`, und `__prismaDebug` zählt «im Hauptthread gerechnet», damit ein Rückfall auffällt.

## Hinweise

- Keine Vorbereitung für die Vollversion zum Kaufen (Spec, «Geld»).
- Alle heutigen Zugriffe finden: `grep -n localStorage src/ index.html`.

## Comments

### Umsetzung

Umsetzer, 17.11.2026, Branch `ticket/umbau-05` ab `feature/umbau` (`1cecbd6`); danach `feature/umbau` zweimal
hineingeholt (Ticket 13, `8a3e6ca`, ein Konflikt nur im Kopfkommentar von `tests/alle.mjs`; Ticket 14, `1a1ce0b`).

**Schritte (je ein Commit):**

- `05a` (`cdbe847`) Speicherschicht `src/speicher.ts`: Schnittstelle `Speicher` (`lesen`, `schreiben`, `loeschen` je
  Schlüssel, Text; wirft nie), Umsetzung `localStorageSpeicher` (jeder Zugriff in `try`, wie bisher), Wahl beim Start
  `speicherFuerPlattform()` (heute nur die eine), `speicher`. Neu `src/spielstand.js`: `progress` aus
  `levelfluss.js` hierher verschoben (Code unverändert ausser `read`/`write`/`remove` über die Schicht), dazu
  `einstellungen` (Ton aus unter `prisma.muted`, bisher `localStorage` direkt in `ton.js`; `audio.storageKey` entfällt).
  `geschichte.js` und `schleife.js` importieren `progress` aus `spielstand.js`. `tools/ts-modul.mjs` (`tsModul`): ein
  Lade-Haken für `.ts` in Node 22.12 (unterdrückt die Warnung); `levelliste.test.mjs` importiert `progress` damit,
  statt den Text aus dem Quelltext zu schneiden.
- `05b` (`42650cc`) `tests/speicher.test.mjs` (in `npm test`): Quelltext (`index.html`, `sw.js`, alle Module, auch
  Kommentare) nennt `localStorage`/`sessionStorage` nur in `src/speicher.ts`, mit Gegenprobe; die Umsetzung legt jeden
  Text unverändert ab; ein **Spielstand von heute** (drei Grade samt Dorf, Bestwerte in zwei Graden, zuletzt gespielt,
  Ton aus, alte Schlüssel `prisma.solvedLevels`/`prisma.current` und ein fremder) wird ohne Umrechnung gelesen und
  unverändert gespeichert **Byte für Byte gleich** geschrieben, kein neuer Schlüssel; Fehler (Zugriff gesperrt, Speicher
  voll, gar kein `localStorage`): nichts wirft, Stand von vorn, alter Stand bleibt.
- `05c` (`4fad1e7`) `tests/testschnittstelle.test.mjs` (in `npm test`, aus Review 04): Mit dem Parser von TypeScript
  die Namen der obersten Ebene aller Module und alle Namen aus `alsGlobal`; Proben sind `tests/*.js` (ganz) und jede
  Datei unter `tests/`/`tools/`, die Chrome steuert (jeder String und jedes Template als Code der Seite). Gezählt werden
  freie Namen (keine Eigenschaften, nichts im Code selbst Deklariertes, dazu `window.x`); Wortlisten und einzelne Wörter
  sind Daten, ausser `ev('…')` wertet sie aus. Gegenprobe am Stand vor `8b13fe2`: meldet alle sechs damals fehlenden
  Namen (`RUHE_NACH_MS`, `bloomPass`, `brushPass`, `composer`, `finalPass`, `wagen`). Heute keine Lücke.
- `05d` (`806aed8`) Worker der Skyboxen als eigenes Modul: `decode`/`OPT` nach `src/himmelbild.js` (unverändert),
  Worker `src/himmelbild-worker.ts`, gestartet wie der Hall (`new Worker(new URL(…), { type: 'module' })`); ohne Worker
  `decode` im Hauptthread wie bisher. `tsconfig*.json`: alle `src/*-worker.ts` in der Umgebung WebWorker.
- `05e` (`0f75369`) Worker der Bretter ebenso: die sechs Rechnungen (`stoneData`, `tidePoolData`, `clayData`,
  `raisedBedData`, `mossData`, `basaltData`) samt `makeNoise2D` nach `src/brettdaten.js` (unverändert verschoben, rund
  560 Zeilen aus `texturen.js` und `brett.js`; vorher geprüft, dass sie ausser `mulberry32` nur Globale wie `Math`
  brauchen), `BRETT_DATEN` als Verzeichnis, Worker `src/brettdaten-worker.ts`. `boardTextures(specs, art, arg)` nimmt
  den Namen der Rechnung (statt Funktion und `helpers`), unbekannter Name wirft. **`mangle` wieder an**
  (`vite.config.mjs`: `rolldownOptions` mit `mangle: false`/`keepNames` entfernt). `logic`: die drei Worker je einmal
  unter `assets/`, in `FILES`, vom Spiel genannt; kein Worker aus einem Blob; Namen gekürzt.
- `05f` (`9763592`) README (Aufbau, TypeScript, Tests), `CONTEXT.md`: Begriff «Speicherschicht».

**Geprüft im Browser (eigenes Skript, nicht im Repo):** Build mit einem Stand «leicht», Platz 25, Ton aus im
`localStorage`: alle Worker als `type: 'module'` gestartet (`brettdaten-worker` zweimal: Stein, Lehm; `hall-worker`;
`himmelbild-worker` mit 5 Antworten), jede mit Antwort, kein `error`; `__prismaDebug.audio.muted` true,
`progress.last()` «leicht», Platz 25; Konsole leer. Einen Zähler «im Hauptthread gerechnet» gibt es darum nicht.

**Grösse:** Spiel `assets/index-….js` 698 464 Bytes (vorher 775 451, −76 987), dazu Worker 13 961 (Bretter),
1 415 (Skyboxen), 549 (Hall).

### Läufe

- `npm test` vor dem Merge (alter `leise.sh`, alleinig): alles grün bis auf eine eigene, zu breite Prüfung in `logic`
  (die Blob-Prüfung traf einen SVG-Blob der Bühne) → korrigiert vor `05e`, `logic` danach grün.
- **Bildvergleich in SwiftShader (vor dem Merge, Stand `0f75369`): GRÜN**, 66 Bilder in 29 min 39 s, grösste
  Abweichung 0.
- `offline.mjs`: bestanden (mit Lehm-, Gezeiten- und Moosbrett aus dem Worker).
- Nach dem Merge von Ticket 13 (`8a3e6ca`), leichte Läufe: `npm test` alles grün (golden, logic, hall, speicher,
  testschnittstelle, vorrat, geschichte, levelliste, wuerfelliste, ki-tester, beurteilung, generator, typecheck,
  leise; 17 min, geschichte 616 s). **Bildvergleich `--gpu`: GRÜN**, 77 Bilder in 7 min 45 s, grösste Abweichung 6,
  höchster Anteil 0,014 %.
- Nach dem Merge von Ticket 14 (`1a1ce0b`): `leise`, `testschnittstelle`, `speicher` grün.
- Proben (alleinig, `GPU=1`; als Umsetzer nur die direkt betroffenen, keine Zeitmessung bewertet):
  - `brett-probe` ganz (vor dem Merge): «Mechanik», «Netz», «Menü», «Reise» in Ordnung; in «Formen» **ein Pixel in
    einem Bild** des Übergangs raisedBed → tidePool ohne Brett (Kernquader). Wiederholt (`--nur formen`, nach dem
    Merge): «Brett: in Ordnung», derselbe Übergang ohne Lücke. Die Prüfung misst Deckung (Alpha), nicht die Texturen.
  - `geschichte-probe --menue` (gespeicherte Stände je Grad, «Weiter», «Von vorn»): im ersten Lauf eine Lücke 231 ms
    «Menü → Prolog (neuer Grad)»; wiederholt: **bestanden**, Konsole ohne Fehler.
  - `geschichte-probe --uebersicht` (Bestwerte, Wiederholen): rot mit drei Lücken (178 ms «Spiel → Übersicht», 213 ms
    «Übersicht → Spiel», 125 ms «letztes Level → Übersicht»); bekannt auch auf der Basis (Review 04: 124/221 ms, Basis
    144/194/161 ms). Speicherstand und Bestwerte in der Probe sonst in Ordnung. Nicht gegen die Basis wiederholt.

### Abweichungen

- `progress` liegt jetzt in `src/spielstand.js` (nicht mehr in `levelfluss.js`), der Ton liest/schreibt über
  `einstellungen`. Verhalten gleich; Schlüssel und Texte gleich (Test).
- Tests, die `.ts` importieren, brauchen `tools/ts-modul.mjs` (Node 22.12).
- Beide Worker sind Module (statt nur `decode`); damit `mangle` an und kein Zähler in `__prismaDebug`. Ein Rückfall in
  den Hauptthread (Modul-Worker lädt nicht, etwa in alten Browsern) fiele weiter nur mittelbar auf (Lücken in Proben).
- Kommentar in `schleife.js`: «über localStorage» → «im Speicher der Seite» (der Quelltext-Test zählt auch Kommentare).

### Offen

- Zeitmessungen und der ganze Satz Proben: Reviewer (`--uebersicht` gegen die Basis; `--dorf`, `start-probe`,
  `leerlauf`, `ruhetakt`, `spiegel`, `buehne-messung`). Mit gekürzten Namen ändert sich der Text von
  `onBeforeCompile` (three unterscheidet Programme danach); die Hülle ist für alle Materialien dieselbe Funktion, also
  gleich viele Programme – im Review an `start-probe`/Shader-Zahl gegenprüfen.
