# 01: Brett-Angabe im Register, Steinbrett als Art

**Spec:** ../spec.md

**Blocked by:** –

**Status:** ready-for-agent

**What to build:** Ein dünner Schnitt durch alle Schichten. Am Aussehen im Spiel ändert er nichts:

- Die Beschreibung jedes Blender-Himmels nennt sein Brett.
- Das Packwerkzeug trägt das Brett ins Register ein, und das Prüfwerkzeug prüft es.
- Das Spiel baut daraus das Brett.
- Die Testschnittstelle meldet, welches Brett zu sehen ist.

Vorerst gibt es nur eine Art, das Steinbrett. Alle fünf Blender-Himmel bekommen es als vorläufiges Brett. Dazu kommen
die beiden Begriffe ins Glossar.

- [ ] **Brett-Teil im Spielcode:** Das heutige Steinbrett wird zur Art `stone` eines abgegrenzten Teils für das Brett.
      Heute steht es im Abschnitt «STEINPLATTE mit planarer Spiegelung». Dazu gehören:
      - die Oberfläche mit der Schiefer-Textur aus dem Hintergrund-Thread,
      - die eingravierten Rasterlinien, die Einlegelinie und die Fase,
      - die Spiegelung,
      - die Lichtwelle beim Lösen,
      - die Seiten und die Metallkante.

      Der Teil baut ein Brett aus Art und Werten, meldet, wann es bereit ist, und gibt es frei. Bretter gleicher Art mit
      gleichen Werten teilen sich ein Brett, sodass das Steinbrett nur einmal im Grafikspeicher liegt. Sichtbar ändert
      sich nichts: Vorher-Nachher-Bilder auf Desktop und Handy, von oben, flach und ganz herausgezoomt.
- [ ] **Liste der Arten:** Die Arten stehen in einer einzigen Zeile im Spielcode, so wie `const SKY_LAYERS = { … }`.
      Vorschlag: `const BOARD_TYPES = { stone };`. Das Prüfwerkzeug liest die Namen aus dieser Zeile, wie heute die
      Arten der Ebenen. Ein Logiktest schlägt fehl, wenn die Zeile nicht gefunden wird (wie bei `codeSkies`).
- [ ] **Brett-Angabe:** Das neue, optionale Feld `board: { type, …Werte }` steht in `skybox.json` und im Register.
      - Das Prüfwerkzeug (`checkSkies`) meldet eine unbekannte Art sowie ungültige oder unbekannte Werte als Fehler.
      - Die erlaubten Werte stehen je Art in einer Tabelle wie `LAYER_PARAMS`. Für `stone` gibt es keine.
      - Der Kommentar am Kopf des Prüfwerkzeugs beschreibt das Feld.
- [ ] **Packen:** Das Packwerkzeug übernimmt `board` aus `skybox.json` ins Register. Es bekommt dazu eine Betriebsart,
      die **nur die Brett-Angabe** ins bestehende Register überträgt, ohne die Teile neu zu packen. Teile und ihr Stand
      bleiben, nur der Stand des Registers in `sw.js` wird nachgeführt. Gründe:
      - Die Rohdaten aus Blender liegen nicht im Repo, sondern nur im Hauptordner (`tools/blender/out/`).
      - Dort ist der Vulkan gerade auf dem Stand des Krater-Branchs, nicht auf dem von main.
      - Die Werte der Bretter ändern sich in den folgenden Tickets oft.
- [ ] **Die fünf Himmel:** Die fünf `skybox.json` (beach, desert, forest, village, volcano) bekommen
      `board: { type: 'stone' }`. Register und `sw.js` werden nachgeführt.
- [ ] **Brett im Spiel:** Das Spiel zeigt das Brett des gezeigten Himmels, in diesem Ticket noch ohne Überblenden (das
      kommt mit 02). Ohne Angabe sowie bei Milchstrasse und Sonnensystem zeigt es das Steinbrett.
- [ ] **Kernquader:** Der Panorama-Shader verwirft heute alles hinter dem Quader des Bretts (`PLATE_LO`/`PLATE_HI`),
      weil das Brett diesen Quader ganz und undurchsichtig deckt. Künftig nennt jede Art ihren **Kernquader**, also den
      Quader, den sie sicher undurchsichtig deckt. Der Plattentest nimmt den Kernquader des gezeigten Bretts, und für
      `stone` ist das der heutige Quader. Sonst entstehen Löcher im Himmel, sobald eine Form den Umriss nicht ganz
      füllt (siehe auch die Risiken in Ticket 11 von `.scratch/leistung/`).
- [ ] **Testschnittstelle:** Neu kommt `window.__prisma.brett()` mit der Antwort `{ himmel, art, bereit }`. Dabei ist
      `himmel` die id des Himmels, dessen Brett gezeigt wird (auch `milky` und `solar`), und `art` dessen Art.
- [ ] **Glossar:** In `CONTEXT.md` kommen die Einträge «Brett» und «Steinbrett» unter «Auf dem Feld» dazu, mit
      «Plattform» und «Steinplatte» unter _Vermeiden_. Wie sie lauten, steht in der Spec. Sie dürfen nicht unter «Was
      Spass macht» stehen. Danach muss `tests/ki-tester.test.mjs` grün sein.
- [ ] **Tests:**
      - Logiktests:
        - Die Arten werden im Spielcode gefunden.
        - Die fünf Blender-Himmel haben eine gültige Brett-Angabe.
        - Die Prüfung lehnt eine unbekannte Art und einen unbekannten Wert ab, an einem abgeänderten Eintrag wie im
          Test zu den Ebenen des Vulkans.
      - `tests/offline.mjs`:
        - Für jeden Blender-Himmel meldet `brett()` online und offline den Himmel, die Art `stone` und `bereit`.
        - Mit `?sky=milky` und `?sky=solar` meldet es die Art `stone`.
- [ ] Alle Tests sind grün (Logik, offline, Geschichte-Probe für «leicht»), und das Review nach dem Ticket ist gelaufen.

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
