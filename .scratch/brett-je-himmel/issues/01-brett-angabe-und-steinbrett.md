# 01: Brett-Angabe im Register, Steinbrett als Art

**Spec:** ../spec.md

**Blocked by:** –

**Status:** resolved

**What to build:** Ein dünner Schnitt durch alle Schichten. Am Aussehen im Spiel ändert er nichts:

- Die Beschreibung jedes Blender-Himmels nennt sein Brett.
- Das Packwerkzeug trägt das Brett ins Register ein, und das Prüfwerkzeug prüft es.
- Das Spiel baut daraus das Brett.
- Die Testschnittstelle meldet, welches Brett zu sehen ist.

Vorerst gibt es nur eine Art, das Steinbrett. Alle fünf Blender-Himmel bekommen es als vorläufiges Brett. Dazu kommen
die beiden Begriffe ins Glossar.

- [x] **Brett-Teil im Spielcode:** Das heutige Steinbrett wird zur Art `stone` eines abgegrenzten Teils für das Brett.
      Heute steht es im Abschnitt «STEINPLATTE mit planarer Spiegelung». Dazu gehören:
      - die Oberfläche mit der Schiefer-Textur aus dem Hintergrund-Thread,
      - die eingravierten Rasterlinien, die Einlegelinie und die Fase,
      - die Spiegelung,
      - die Lichtwelle beim Lösen,
      - die Seiten und die Metallkante.

      Der Teil baut ein Brett aus Art und Werten, meldet, wann es bereit ist, und gibt es frei. Bretter gleicher Art mit
      gleichen Werten teilen sich ein Brett, sodass das Steinbrett nur einmal im Grafikspeicher liegt. Sichtbar ändert
      sich nichts: Vorher-Nachher-Bilder auf Desktop und Handy, von oben, flach und ganz herausgezoomt.
- [x] **Liste der Arten:** Die Arten stehen in einer einzigen Zeile im Spielcode, so wie `const SKY_LAYERS = { … }`.
      Vorschlag: `const BOARD_TYPES = { stone };`. Das Prüfwerkzeug liest die Namen aus dieser Zeile, wie heute die
      Arten der Ebenen. Ein Logiktest schlägt fehl, wenn die Zeile nicht gefunden wird (wie bei `codeSkies`).
- [x] **Brett-Angabe:** Das neue, optionale Feld `board: { type, …Werte }` steht in `skybox.json` und im Register.
      - Das Prüfwerkzeug (`checkSkies`) meldet eine unbekannte Art sowie ungültige oder unbekannte Werte als Fehler.
      - Die erlaubten Werte stehen je Art in einer Tabelle wie `LAYER_PARAMS`. Für `stone` gibt es keine.
      - Der Kommentar am Kopf des Prüfwerkzeugs beschreibt das Feld.
- [x] **Packen:** Das Packwerkzeug übernimmt `board` aus `skybox.json` ins Register. Es bekommt dazu eine Betriebsart,
      die **nur die Brett-Angabe** ins bestehende Register überträgt, ohne die Teile neu zu packen. Teile und ihr Stand
      bleiben, nur der Stand des Registers in `sw.js` wird nachgeführt. Gründe:
      - Die Rohdaten aus Blender liegen nicht im Repo, sondern nur im Hauptordner (`tools/blender/out/`).
      - Dort ist der Vulkan gerade auf dem Stand des Krater-Branchs, nicht auf dem von main.
      - Die Werte der Bretter ändern sich in den folgenden Tickets oft.
- [x] **Die fünf Himmel:** Die fünf `skybox.json` (beach, desert, forest, village, volcano) bekommen
      `board: { type: 'stone' }`. Register und `sw.js` werden nachgeführt.
- [x] **Brett im Spiel:** Das Spiel zeigt das Brett des gezeigten Himmels, in diesem Ticket noch ohne Überblenden (das
      kommt mit 02). Ohne Angabe sowie bei Milchstrasse und Sonnensystem zeigt es das Steinbrett.
- [x] **Kernquader:** Der Panorama-Shader verwirft heute alles hinter dem Quader des Bretts (`PLATE_LO`/`PLATE_HI`),
      weil das Brett diesen Quader ganz und undurchsichtig deckt. Künftig nennt jede Art ihren **Kernquader**, also den
      Quader, den sie sicher undurchsichtig deckt. Der Plattentest nimmt den Kernquader des gezeigten Bretts, und für
      `stone` ist das der heutige Quader. Sonst entstehen Löcher im Himmel, sobald eine Form den Umriss nicht ganz
      füllt (siehe auch die Risiken in Ticket 11 von `.scratch/leistung/`).
- [x] **Testschnittstelle:** Neu kommt `window.__prisma.brett()` mit der Antwort `{ himmel, art, bereit }`. Dabei ist
      `himmel` die id des Himmels, dessen Brett gezeigt wird (auch `milky` und `solar`), und `art` dessen Art.
- [x] **Glossar:** In `CONTEXT.md` kommen die Einträge «Brett» und «Steinbrett» unter «Auf dem Feld» dazu, mit
      «Plattform» und «Steinplatte» unter _Vermeiden_. Wie sie lauten, steht in der Spec. Sie dürfen nicht unter «Was
      Spass macht» stehen. Danach muss `tests/ki-tester.test.mjs` grün sein.
- [x] **Tests:**
      - Logiktests:
        - Die Arten werden im Spielcode gefunden.
        - Die fünf Blender-Himmel haben eine gültige Brett-Angabe.
        - Die Prüfung lehnt eine unbekannte Art und einen unbekannten Wert ab, an einem abgeänderten Eintrag wie im
          Test zu den Ebenen des Vulkans.
      - `tests/offline.mjs`:
        - Für jeden Blender-Himmel meldet `brett()` online und offline den Himmel, die Art `stone` und `bereit`.
        - Mit `?sky=milky` und `?sky=solar` meldet es die Art `stone`.
- [x] Alle Tests sind grün (Logik, offline, Geschichte-Probe für «leicht»), und das Review nach dem Ticket ist gelaufen.

## Hinweise

- **Diese Stellen kennen den Umriss und bleiben, wie sie sind:**
  - die Schablone des Pinselfilters (`PLATE + 1`),
  - der Abstand der Fische (`keepOut`),
  - die Korona der Sonne,
  - die Lage der Milchstrasse zur Platte,
  - der Kommentar zu `phiMax`.
- **Spiegelung:** `renderReflection` übernimmt die Matrix der Oberfläche (heute `floorTop`) und blendet sie beim
  Spiegeln aus. Das läuft künftig über den Brett-Teil. Die Lichtwelle hängt an `shockUniforms`, die auch der Rahmen im
  Würfel nutzt.
- `__prismaDebug.floorMaterial` wird ausserhalb von `index.html` nicht benutzt. Es darf angepasst oder durch den
  Brett-Teil ersetzt werden.
- Browserproben laufen über `tools/leise.sh`, nie gleichzeitig, und mit `--mute-audio`.

## Comments

**Umsetzung (05.11.2026, Branch `feature/brett-je-himmel`, nicht committet, Review offen)**

- **Brett-Teil** (`index.html`, Abschnitt «BRETT mit planarer Spiegelung»): `const BOARD_TYPES = { stone };`, jede Art
  `{ core, build(values) }`. `build` liefert `{ group, mirror, textures, computed, dispose() }`; `stoneBoard()` ist das
  bisherige Steinbrett 1:1 (Schiefer aus dem Worker, Rasterlinien, Einlegelinie, Fase, Spiegelung, Lichtwelle über
  `shockUniforms`, Seiten, Metallkante). Gemeinsam für alle Arten bleiben `reflector`, `reflLodShift` und
  `shockUniforms`. `boardTheme` baut aus Art und Werten (`acquire`), teilt Bretter gleicher Art und Werte (Schlüssel
  aus Art und sortierten Werten, Zähler), gibt frei (`release`), zeigt das Brett eines Himmels (`show`, von
  `skyTheme.set`) und meldet `bereit` (Texturen berechnet und auf der Grafikkarte). Das Steinbrett hält er dauerhaft
  (eigenes `acquire` beim Start). Weil das Brett im Menü (Blick im Himmel) nicht gezeichnet wird, lädt `draw` die
  Texturen eines berechneten Bretts an einer ruhigen Stelle hoch (`boardTheme.upload`), sonst wäre es dort nie bereit.
  Unbekannte Art im Register: Warnung und Steinbrett.
- **Kernquader:** `stone.core` ist der Quader von Oberfläche bis Unterkante der Seiten. Der Plattentest im Panorama
  liest ihn über die gemeinsamen Uniforms `BOARD_CORE` (`uCoreLo`, `uCoreHi`, je 1 cm kleiner), die `show` setzt,
  statt der festen `PLATE_LO`/`PLATE_HI`.
- **Brett-Angabe und Prüfung** (`tools/sky-schema.mjs`): `boardTypes(html)` liest die Zeile, `BOARD_PARAMS`
  (`stone: {}`), `checkSkies(…, { boards })` meldet fehlende oder unbekannte Art und unbekannte oder ungültige Werte.
- **Packen:** `node tools/blender/pack.mjs --brett [<id> …]` (ohne id alle) überträgt nur `board` aus `skybox.json`,
  prüft und schreibt Register und `SKIES` in `sw.js`; Teile und `rev` bleiben (Register gegen vorher: nur `board`
  dazu). Das volle Packen übernimmt `board` ebenso. Register `d136aa93`.
- **Startreihenfolge:** `skyTheme.set` beim Laden (samt `?sky=`) steht jetzt nach dem Brett-Teil, weil `set` das Brett
  zeigt.
- `__prismaDebug.floorMaterial` ist durch `__prismaDebug.boardTheme` ersetzt. `APP_VERSION` `2026-11-05 brett-angabe`.
- **Keine sichtbare Änderung:** Bilder mit `tests/screenshot.mjs` (`GPU=1`, `?t=12`, Level 0 über `zeige`, `settle`),
  Desktop 1440 × 900 und Handy 390 × 844 mit Pixeldichte 2, je Kamera normal, flach (`phiMax`) und ganz herausgezoomt
  (`zoomMax`). Strand und Milchstrasse: alle 12 Bilder vorher und nachher pixelgleich (zwei Läufe vorher waren
  untereinander pixelgleich). Dazu Wald, Wüste, Dorf, Vulkan und Sonnensystem, normal und flach, gegen eine Kopie der
  alten Seite: 19 von 20 pixelgleich; beim Sonnensystem normal auf dem Handy weichen 201 Pixel um 1 Stufe ab, und
  zwei Läufe der alten Seite tun das auch (3 Pixel um 1), das ist Rauschen des Laufs.
- **Fund dabei:** Mit `?t=` ist `Math.random` fest, und three zieht für jede Kennung (uuid) Zufallszahlen. Eine
  zusätzliche Gruppe für das Brett verschob den Zufall, und die Ziele standen anders gedreht im Bild. Darum liegen die
  Teile der Kante direkt in der Gruppe des Bretts (gleich viele Objekte wie vorher). Wer später Bretter anders baut
  (mehr Objekte, anderer Zeitpunkt), bekommt mit `?t=` andere Vergleichsbilder, ohne dass sich das Brett ändert.
- **Tests:** `node tests/logic.test.mjs` 2039 bestanden (neu: Arten gefunden; fünf Himmel mit gültiger Brett-Angabe,
  Register wie `skybox.json`; Prüfung lehnt unbekannte Art, unbekannten Wert, fehlende Art und Nicht-Objekt ab),
  `node tests/ki-tester.test.mjs` 84 bestanden, `tests/offline.mjs` bestanden (neu: `brett()` für alle fünf
  Blender-Himmel online und offline `stone` und bereit, `milky` und `solar` online `stone`), Geschichte-Probe
  `--grad leicht` (GPU) bestanden, Konsole ohne Fehler.

**Review (05.11.2026, unabhängiger Reviewer, Standards und Spec getrennt geprüft): bestanden, Hinweise für 02**

- **Geprüft:**
  - `stoneBoard()` ist der alte Code des Steinbretts, nur in einer Gruppe. Die Lichtwelle hängt weiter an den
    gemeinsamen `shockUniforms` (auch für den Rahmen im Würfel).
  - Der Kernquader hat genau die Zahlen der alten `PLATE_LO`/`PLATE_HI`.
  - Ausserhalb des Brett-Teils greift nichts mehr auf `floorTop`/`floorMaterial` zu.
  - Zum Register kommt je Eintrag nur `board` dazu (`rev` und `parts` gleich), und `SKIES` in `sw.js` ist der Hash des
    Registers.
  - `backgrounds/<id>/` ist unverändert, die Zeilenenden ebenso (CRLF wie zuvor, `git diff --stat` ohne ganze
    Dateien).
  - `pack.mjs --brett` (an einer Kopie):
    - Ein zweiter Lauf ändert nichts.
    - Vom Register von HEAD aus entsteht dieselbe `skies.js` und dieselbe `sw.js`.
    - Eine unbekannte Art und ein unbekannter Wert werden abgelehnt, ohne dass etwas geschrieben wird.
    - Eine unbekannte id bricht ab.
- **Selbst behoben:**
  - `index.html`: In zwei Kommentaren des verschobenen Steinbretts heisst es «Oberfläche» statt «Boden».
  - `tests/logic.test.mjs`: Der Fall «ohne Brett-Angabe» nutzt `errorsWith(undefined)` statt einer zweiten Kopie
    des Aufrufs.
- **Hinweise für Ticket 02 (kein Mangel von 01):**
  - `boardTheme.upload()` lädt die drei Texturen in einem Stück hoch, sobald `ruhe.jetzt()` gilt, auch wenn das Brett
    nicht im Bild ist. Im Menü (`story.choosing`) gilt das ohne `?nointro` nie: Dort ist das Brett im echten Spiel also
    noch nicht `bereit`, nur in den Proben. 02 soll die Uploads nach den Regeln der Himmel machen (`ruhe.lade`, `quiet`,
    falls nötig in Häppchen wie `skyUpload`).
  - `show` baut und zeigt in einem Schritt. Für Halten und Überblenden wird es in Vorbereiten (beim `prepare` und
    `preload` des Himmels) und Zeigen aufgeteilt, `brett()` bekommt `von` und `anteil` dazu. Beides lässt sich
    anfügen, ohne etwas zurückzubauen.
  - Namen, nach Ermessen: Der Parameter `spec` in `acquire`/`show` ist leicht mit der Spec zu verwechseln (besser
    `angabe`). `BOARD_CORE` ist ein veränderliches Uniform-Objekt (sonst heissen solche `…Uniforms`). Ketten wie
    `shown.entry.board.group`.
  - Der Katalog von 03 nutzt `__prismaDebug.floorMaterial`, läuft aber gegen seinen eigenen Stand (`katalog-basis`,
    6f322ce) und bricht darum nicht. Ab 04 werden die Richtungen ohnehin Arten in `BOARD_TYPES`.
- **Bilder:** Den vollen Satz (auch ganz herausgezoomt) gibt es nur für Strand und Milchstrasse. Das reicht, denn
  alle Himmel zeigen dasselbe geteilte Steinbrett. Eigene Stichprobe gegen eine Kopie von HEAD: Strand auf Desktop
  (1440 × 900) und Handy (390 × 844, Pixeldichte 2), `?t=12`, Level 0, beide byte-gleich.
- **Start-Probe** (`--handy --drossel 4 --laeufe 2`, headless, alte gegen neue Seite): Beide sind in Ordnung. Nach
  «Weiter» sind die längsten Bilder beim Laden 66 statt 83–100 ms und im Spiel 83–133 statt 184–200 ms. Die Textur
  lädt jetzt an der ruhigen Stelle hoch statt im ersten Bild mit Brett. Beim Start ohne Stand gibt es keinen
  Unterschied über das Rauschen hinaus.
- **Tests nach dem Review:**
  - `node tests/logic.test.mjs`: 2039 bestanden.
  - `node tests/ki-tester.test.mjs`: 84 bestanden.
  - `tests/offline.mjs`: bestanden, 32 Prüfungen.
  - Geschichte-Probe `--grad leicht` (GPU): bestanden, Konsole ohne Fehler.
  - Die Änderungen des Reviews an `index.html` betreffen nur Kommentare. Die Browserproben liefen davor, der Logiktest
    danach noch einmal.
