# 04: Strand: Gezeitenbecken im Spiel

**Spec:** ../spec.md

**Blocked by:** 02

**Status:** resolved

**What to build:** Der Nutzer hat im Katalog (Ticket 03) das **Gezeitenbecken** gewählt, ohne den Wasserfall. Es wird
als echte Art von Brett ins Spiel gebaut und wird das Brett des Strands. Der Nutzer bekommt Bilder von Desktop und
Handy und gibt Rückmeldungen, bis die Richtung sitzt. Den Übergang zu anderen Brettern und den Abschluss macht
Ticket 05.

So sieht es aus (Karte 6 im Katalog, Hauptbild):

- **Feld:** heller Sandstein mit eingravierten Rasterlinien.
- **Rinne:** Rundherum läuft im Rand eine flache Rinne mit klarem Wasser, mit Lichtnetz am Grund und Schaum an den
  Kanten. Die Wasserkante ersetzt die Einlegelinie.
- **Aussen und Seiten:** Eine schmale Felslippe hält das Wasser. Die Seiten sind nasser Fels mit Rinnsalen.
- **Spiegelung:** nur in der Rinne, dort stark. Das Feld ist matt.
- **Lichtwelle beim Lösen:** Licht läuft über den Stein, und in der Rinne läuft ein Schwall mit Schaum rundum.

- [x] **Neue Art:** Das Gezeitenbecken wird eine Art im Brett-Teil (Ticket 01). Es steht in `BOARD_TYPES` und hat
      seine Werte in `BOARD_PARAMS`, etwa die Farben von Stein, Wasser und Fels sowie die Lage der Rinne. Die
      Brett-Angabe des Strands (`skybox.json`) nennt die neue Art und ihre Werte, und das Register wird mit
      `pack.mjs --brett beach` nachgeführt.
- [x] **Vorlage:** Als Vorlage dient `katalog/bretter/varianten/6-wasserrand.js` mit den Hilfen in
      `katalog/bretter/bretter.js`. Die Skripte bauen das Brett zur Laufzeit gegen den Stand 6f322ce. Sie nutzen
      `floorMaterial` und die frühere Kantengruppe, die es nach Ticket 01 nicht mehr gibt. Übernommen werden also die
      Formeln und Farben, nicht der Aufbau.
- [x] **Schalter:** Ein Parameter in der Adresse (zum Beispiel `?brett=stone`) zeigt zum Vergleich ein anderes Brett,
      nur für Bilder. Er verschwindet in Ticket 10.
- [x] **Material und Speicher:**
      - Das Material wird im Spiel berechnet, ohne Bilddateien, und zwar im Hintergrund beim Laden (Ticket 02).
      - Der Grafikspeicher bleibt etwa wie beim Steinbrett. Der Katalog rechnete mit 2048², das Steinbrett hat 1024²:
        Die Grösse misst und begründet das Ticket.
      - Eine Form aus Blender ist für diese Richtung nicht nötig.
- [x] **Spiegelung nur in der Rinne:** Die planare Spiegelung bleibt, wirkt aber nur in der Rinne, etwa über Rauheit
      oder eine Maske. Ist das auf dem Handy zu teuer, wird gemessen und der Nutzer gefragt.
- [x] **Pflicht und Grenzen:**
      - Das Brett hat seine eigene Lichtwelle, wie in der Karte: Licht läuft über den Stein, und in der Rinne zieht ein
        Schwall mit Schaum rundum, der danach wieder still wird. Sie kommt als Bildfolge oder kurzes Video auf die
        Vorschauseite (Wunsch des Nutzers vom 06.11.2026).
      - Befund aus der Bildfolge vom 06.11.2026 (https://claude.ai/artifact/SobbUb4scUxKp3dH7FVfqM): Der Ring wird
        schwächer, je weiter er läuft (Stärke 0,82 bei 0,7 m, 0,16 bei 4,3 m). In der Rinne, 4,3 bis 4,8 m von der
        Mitte, kommt der Schwall deshalb fast ohne Kraft an. Die Rinne bekommt darum ihre eigene Zeit: Der Schwall
        startet, wenn der Ring ankommt, und läuft mit eigener Stärke rundum. Bildfolgen nimmt
        `lichtwelle/welle-folge.mjs` auf.
      - Wunsch des Nutzers (06.11.2026): Die Lichtwelle soll nach **Wasser oder Seifenblasen** aussehen, zumindest ein
        wenig. Zum Beispiel rollt eine kleine Welle mit Gischt über das Feld, oder schillernde Seifenblasen steigen dort
        auf, wo der Ring vorbeizieht, und zerplatzen. Zeig ihm 2 bis 3 Varianten als Bildfolge.
      - **Gewählt (06.11.2026): Brandung** (Variante A der Vorschau https://claude.ai/artifact/JpN1KG6cNopn4wGAZrYJ8v).
        Eine Welle mit Schaumkrone rollt über den Stein, Tropfen spritzen. Dahinter ist der Stein nass, glitzert und
        trocknet fleckig. In der Rinne steigt Gischt auf, und Schaum treibt rundum. Gesteuert wird alles über die
        Ankunft des Rings (Zeit seit dem Start minus Abstand / 6,5), nicht über seine Stärke, damit die Rinne die volle
        Wirkung bekommt. Rund 760 Tropfen, geschätzt 0,5 bis 1 ms je Bild auf dem Handy, das wird gemessen. Vorlage:
        `lichtwelle/varianten/s1-brandung.js` mit `1-welle.js` und `lichtwelle/bretter.js`.
      - Das 7×7-Feld bleibt eben, gleich gross und an derselben Stelle.
      - Die Form bleibt innerhalb des Umrisses, und das Brett schwebt.
      - Die Art nennt ihren Kernquader. Mit flacher und ganz herausgezoomter Kamera hat der Himmel keine Löcher.
- [x] **Bilder zur Rückmeldung** auf einer Vorschauseite (Artifact), neben dem Steinbrett und dem Katalogbild, auf dem
      Desktop (1440 × 900) und dem Handy (390 × 844 hochkant). Gezeigt werden:
      - die Spielansicht,
      - die flache Kamera,
      - die ganz herausgezoomte Kamera,
      - der Fall des Lichts aufs Brett beim Einstieg ins Meer,
      - das Lösen mit der Lichtwelle.
- [x] **Leistung:** Bildzeit und Grafikspeicher, gemessen mit dem Messwerkzeug auf dem Desktop und in der
      Handy-Ansicht, stehen mit auf der Seite, verglichen mit dem Steinbrett.
- [x] **Rückmeldung des Nutzers:** Sie wird eingearbeitet, auch über mehrere Runden. Sein Urteil steht unter
      «Comments».
- [x] **Tests:** Ein Logiktest zeigt, dass das Prüfwerkzeug ungültige Werte der neuen Art ablehnt. Die Offline-Probe
      meldet am Strand die neue Art. Alle Tests sind grün, und das Review nach dem Ticket ist gelaufen.

## Hinweise

- **Was am Strand ums Brett liegt:**
  - Wasser rund ums Brett (`waterSurface`), 3 m tiefer, mit einem Loch unter dem Brett.
  - Fische, die Abstand zum Umriss halten.
  - Felsen (`bakedMesh`).
  - Gemalte Pflanzen (`paintedInstances`) mit Pinselfilter, der das Brett ausspart.
  - Das Hauptlicht des Strands steht im Register (`light.dir`). Das Brett nutzt es nicht, denn das Licht auf dem Brett
    bleibt gleich.
- **Lichtwelle:** Auf hellen Brettern wirkt die Lichtwelle des Steinbretts kaum (Katalog). Die stärkere Form der Karte
  ist deshalb Teil der Art.
- **Fester Zufall:** Mit `?t=` hängt der Zufall an der Zahl der Objekte (siehe Ticket 01). Vergleichsbilder mit und
  ohne neues Brett können sich deshalb bei den Zielen unterscheiden.
- Die Bildaufnahme läuft über `tools/leise.sh` und mit `--mute-audio`.

## Comments

**Umsetzung (06.11.2026, Worktree `prisma-brett-04`, Branch `feature/brett-04-strand` von `feature/brett-je-himmel`
d48d4b1, nicht committet, Review offen)**

- **Art `tidePool`** (`index.html`, Brett-Teil): `const BOARD_TYPES = { stone, tidePool };`, gebaut von
  `tidePoolBoard(values)`.
  - Oberfläche in y = 0, darunter die Seiten als Quader ohne Deckfläche, bündig, ohne Metallkante. Der Kernquader ist
    derselbe wie beim Steinbrett.
  - Überblenden wie beim Steinbrett mit Mischen im Material (`setFade`, `fadeVariants`), weil die Form gleich ist.
  - Fehlt ein Wert, wirft `build`, und es steht das Steinbrett als Notfall.
- **Texturen im Spiel berechnet:**
  - Neu ist `boardTextures(specs, compute, arg, helpers)`, der allgemeine Worker. `createStoneTextures` ist nur noch ein
    Aufruf davon.
  - `tidePoolData` übernimmt Formeln und Farben aus Karte 6 (`6-wasserrand.js`). Die Höhen bleiben Gleitzahlen, statt
    wie im Katalog in 8 Bit gestuft.
  - Grösse: Oberfläche 3 × 1024² (Farbe, Rauheit, Normalen), Seiten 1024 × 64, alles RGBA, also über
    `boardTextureUpload` ohne neuen Zweig.
- **Spiegelung nur in der Rinne** über die Rauheit: Wasser 0,03, Schaum bis 0,7, Stein 0,86, Fels 0,7. Stärke 0,85
  statt 0,42. Spiegel-Uniforms und -Code teilen sich jetzt beide Arten (`addBoardReflection`, `boardReflectGlsl`).
- **Lichtwelle «Brandung»:**
  - Neu ist `shockUniforms.uShockT` mit der Uhr `shockClock(dt)`, die in `animate` nach der Feier läuft. Solange der Ring
    läuft, gilt Radius / `SHOCK_SPEED`, danach läuft sie mit dt weiter, nach `SHOCK_REST_S` (8 s) steht sie auf 99
    (Ruhe). `CELEBRATE.shockSpeed` ist jetzt `SHOCK_SPEED`.
  - Die Wirkung folgt der Ankunft des Rings (`uShockT − Abstand / 6,5`), nicht seiner Stärke. Der Shader-Teil steht in
    `TIDE_NOISE_GLSL`, `TIDE_WAVE_PRE`, `TIDE_RIPPLE_GLSL` und `TIDE_WAVE_GLSL`.
  - Die Glocke heisst `wBell(x) = exp(−x²)`. Die Vorlage nahm `pow(x, 2.0)`, und das ist in GLSL für x < 0 nicht
    festgelegt.
  - Tropfen: `tideDrops`, 760 Instanzen in einem Zeichenaufruf. Ihre Mischung lässt das Alpha des Bilds stehen
    (Pinselfilter, Farbsaum). Sichtbar sind sie nur, solange `uShockT < 2 s`.
- **Brett-Angabe und Prüfung:**
  - `beach/skybox.json` nennt `tidePool` mit `stone`, `water` und `rock` (je [hell, dunkel] in sRGB) und
    `channel: [4.32, 4.77]`.
  - `BOARD_PARAMS.tidePool` in `tools/sky-schema.mjs`: Farbpaare mit Kanälen von 0 bis 1. Die Rinne beginnt ausserhalb
    des Felds (über 4,2 m), ist mindestens 10 cm breit, und aussen bleiben mindestens 5 cm Lippe.
  - `pack.mjs --brett beach`: Register `1eb4fc98` in `sw.js`.
- **Schalter:** `?brett=<art>` (`BOARD_URL`, erste Zeile von `boardTheme.prepare`), wortgleich mit Ticket 06. Fällt mit
  Ticket 10 weg.
- `APP_VERSION` ist `2026-11-06 brett-strand`.
- **Steinbrett unverändert:** Bilder gegen eine Kopie von HEAD (`?t=12`, Level 0, `settle`) sind pixelgleich. Geprüft
  unter der Milchstrasse und am Strand mit `?brett=stone`, je normal, flach und ganz herausgezoomt. Die alte Seite fällt
  mit dem neuen Register wie vorgesehen aufs Steinbrett zurück, mit Warnung.

**Messungen** (headless mit GPU; Strand; Steinbrett über `?brett=stone`):

- **Grafikspeicher:**
  - Gezeitenbecken 16,3 MiB (3 × 1024² und Seiten 1024 × 64, mit Mipmaps), Steinbrett 16,0 MiB.
  - Mit drei Brettern im Speicher sind es rund 49 MiB.
- **Zeichenaufrufe des Bretts in Ruhe:** 2 statt 6. Die Tropfen kommen als einer dazu, nur in den ersten 2 s der Welle.
- **Rechnen im Hintergrund-Thread** (Desktop, ungedrosselt): Gezeitenbecken 0,37–0,54 s, Steinbrett 0,33 s. In allen
  Läufen waren alle Bretter samt den Fassungen fürs Überblenden 0,1–0,9 s nach `skyReady` bereit.
- **Leerlauf-Probe «Ruhe»**, Zeichenzeit Mittel / p95 in ms, gezeichnete Bilder/s:

  | Ansicht | Gezeitenbecken | Steinbrett |
  |---|---|---|
  | Desktop 1440 × 900, 2 Läufe | 10,38 / 12,5 · 10,40 / 12,4; 54,9 · 54,9 | 10,41 / 12,1 · 10,34 / 12,1; 54,8 · 55,0 |
  | Handy der Probe (393 × 873, CPU 4×), 5 Läufe | Median 13,1 ms, Bilder/s 13,1 · 21,4 · 9,8 · 18,6 · 26,7 (Median 18,6) | Median 14,0 ms, Bilder/s 23,0 · 28,4 · 14,7 · 26,1 · 33,6 (Median 26,1) |

- **Welle angehalten** (`shockClock` fest, je 4 s, drei Durchgänge abwechselnd in derselben Seite), Zeichenzeit Mittel
  in ms:
  - Desktop, Gezeitenbecken: Ruhe 10,0 · 9,4 · 9,9; 0,5 s 9,0 · 8,5 · 10,6; 1,0 s 9,1 · 9,6 · 9,8.
  - Desktop, Steinbrett: Ruhe 8,9 · 10,0 · 10,7; 0,5 s 9,2 · 9,2 · 10,2; 1,0 s 9,1 · 9,8 · 11,1.
  - Handy 390 × 844 mit Pixeldichte 2, Gezeitenbecken: Ruhe 17,0 · 13,8 · 14,6; 0,5 s 12,6 · 13,1 · 13,7; 1,0 s 13,6 · 16,0
    · 16,6.
  - Handy, Steinbrett: Ruhe 14,4 · 15,8 · 15,2; 0,5 s 15,8 · 14,9 · 12,8; 1,0 s 17,4 · 15,9 · 13,5.
  - Die Welle kostet auf dieser Grafikkarte weniger, als die Messung streut (rund 1 ms).
- **Texturgrösse 1024²:**
  - Ganz herangezoomt ist 2048² nur im Schaum der Rinne einen Hauch schärfer, Bildvergleich auf der Vorschauseite.
  - In der Spielansicht ist ein Pixel auf dem Brett etwa 1 cm gross, ein Texel bei 1024² ebenso. Die Rasterlinien
    rechnet der Shader.
  - 2048² belegte 64,7 MiB je Brett und bräuchte viermal so lange zum Rechnen.

**Abnahme (06.11.2026):**

- Vorschauseite (Runde 1): https://claude.ai/artifact/Y2hVmeV5zHNQyAHQmgQfEd. Darauf Desktop 1440 × 900 und Handy
  390 × 844 mit Pixeldichte 2, je Spielansicht, flach, ganz herausgezoomt sowie flach und herausgezoomt, neben Steinbrett
  und Katalogbild. Dazu Lichtwelle und Fall des Lichts beim Einstieg ins Meer als Filme in Echtzeit (12 Bilder/s) und
  die Leistung.
- Urteil des Nutzers: «das aussehen für den strand ist ebenfalls gut». Die Richtung sitzt, die Seiten bleiben, die
  Brandung bleibt mit Glitzern und Tropfen. Zur Leistung auf dem Handy hat er nichts gesagt, es bleibt beim Poco-Test in
  Ticket 10.

**Tests (06.11.2026):**

- `node tests/logic.test.mjs`: 2040 bestanden. Neu: Die Prüfung lehnt ungültige Werte des Gezeitenbeckens ab (eine
  Farbe statt zwei, ein Kanal über 1, eine Farbe mit zwei Kanälen, Rinne im Feld, zu schmal, ohne Lippe, vertauscht,
  fehlender und unbekannter Wert).
- `tests/offline.mjs`: bestanden. Am Strand meldet `brett()` online und offline `tidePool`.
- `tests/brett-probe.mjs`: bestanden, mit Mechanik 20, Netz 4, Menü 3 und neu Reise 6 Prüfungen.
  - **Reise ohne Vorladen ans Meer:** Stand Bergwald 10, das Vorladen ist abgeschaltet. Das Brett des Meers ist vor
    «Weiter» nicht gebaut. Es lädt auf der Reise unter `skyTheme.quiet` und ist 6,7 s nach «Weiter» im Bild (im ersten
    Lauf 8,7 s). Der Blick senkt sich auf das bereite `tidePool`. Längste Lücke 36 ms, im ersten Lauf 73 ms. Kein Notfall.
  - Die Prüfung auf `art` hat brett06 geschrieben, und ich habe sie wortgleich übernommen: `soll` je Bild aus dem
    Register, dazu `brettPasst` in beiden Proben, `brettDerWelt` und der Teil Netz. Im Kopf von `brett-probe` steht damit
    schon eine Zeile zur Lehmterrasse (Ticket 06), die erst nach dessen Merge zutrifft.
  - **Lücken-Prüfung «Brett laden und überblenden»:** 67 ms bei 1357 ms. Sie misst die Probe-Art der Mechanik (ein
    Steinbrett), nicht das echte Brett. Mit dem echten Gezeitenbecken zeigt die Reise 36 bzw. 73 ms.
- Geschichte-Probe `--grad leicht` (GPU): bestanden, Konsole ohne Fehler.

**Offen für Ticket 10 (Poco):**

- **Bilder je Sekunde in der Handy-Ansicht:** In der Leerlauf-Probe (CPU 4×) zeichnete das Gezeitenbecken in fünf von
  fünf Paaren weniger Bilder je Sekunde, bei gleicher Zeichenzeit (Median 18,6 gegen 26,1). Ein CPU-Profil unter
  denselben Bedingungen (?perf, Browserkennung Android, Menü, erstes Level) zeigte das Gegenteil: 27 gegen 15 Bilder/s,
  und keine Funktion brauchte beim Gezeitenbecken mehr Zeit. Die Ursache ist nicht gefunden. Der Rechner war stark
  belastet, die gedrosselten Werte schwankten innerhalb eines Laufs um das Doppelte. Auf dem Poco messen.
- **Kosten der Welle auf einem echten Handy:** geschätzt waren 0,5 bis 1 ms je Bild. Messbar war es hier nicht.

**Für Ticket 05 und die weiteren Welten:**

- Gezeitenbecken und Steinbrett haben dieselbe Form und denselben Kernquader. Zwischen ihnen genügt das Mischen im
  Material, und Ticket 05 braucht dafür nichts Neues.
- `boardTextures` und `shockUniforms.uShockT` (`shockClock`) lassen sich für weitere Bretter und deren Lichtwellen
  nutzen.
- Die Uhr der Welle läuft nach dem Abbrechen der Feier weiter, bis 8 s nach dem Start des Rings. Das neue Level wächst
  dann unter dem trocknenden Stein, und das ist gewollt.
- Mit `?t=` verschiebt das Gezeitenbecken den festen Zufall: Es bringt vier Objekte samt Materialien, Netzen und
  Texturen mit.

**Review (06.11.2026, unabhängiger Reviewer, Achsen Standards und Spec, Stand nicht committet gegen d48d4b1)**

- **Urteil: bestanden, ohne Auflage.** Die Art `tidePool` ist sauber in den Brett-Teil gebaut. Das Steinbrett, seine
  Lichtwelle und der Würfel bleiben unverändert. Im Register hat sich nur `board` des Strands geändert.
- **Geprüft und in Ordnung:**
  - **Steinbrett:** Der Umbau auf `boardTextures` und `addBoardReflection`/`boardReflectGlsl` ergibt dieselben Daten.
    Das GLSL ist dasselbe, nur die Deklarationen stehen in anderer Reihenfolge. `CELEBRATE.shockSpeed` bleibt 6,5.
    `shockClock` schreibt nur `uShockT`, und das lesen nur Boden und Tropfen des Gezeitenbeckens. Der Würfelrahmen
    liest nur `uShockColor`, die Feier ändert sich also nicht.
  - **Kernquader und Form:** Der Kernquader ist gleich wie beim Steinbrett. Oberfläche (y = 0) und Seiten (ohne
    Deckfläche, bis −0,41 m) decken ihn ganz, also gibt es keine Löcher, auch nicht flach oder herausgezoomt.
  - **Speicher:** `dispose` gibt alle drei Netze frei (auch die Tropfen), dazu drei Materialien und vier Texturen.
    `side` dient als `map` und als `emissiveMap`, ist aber eine einzige Textur.
  - **Leistung in Ruhe:** `uShockT` steht auf 99, die Tropfen sind unsichtbar und kosten keinen Zeichenaufruf. Der
    Shader überspringt die Welle an einer Uniform. Je Bild kommen nur `setFade` und `shockClock` dazu, ohne messbare
    Kosten. Die Programme der Tropfen übersetzt `compileParallel` auch unsichtbar mit.
  - **Prüfwerkzeug:** `boardErrors` geht über alle Werte von `BOARD_PARAMS`. Ein fehlender Wert ist darum ein Fehler,
    nicht nur ein `undefined`. Farbpaare und Rinne werden sauber geprüft. `SKIES` stimmt (Logiktest), das Register
    gleicht `skybox.json`.
  - **Form:** Keine Datei ist ganz umgeschrieben, die Zeilenenden sind wie vorher, und `APP_VERSION` ist an beiden
    Stellen gleich. Es gibt keine Urheberzeile, im Ticket stehen nur die Links auf die Vorschauseiten.
- **Im Review behoben:**
  - Der Schalter `?brett=` war nicht wortgleich mit Ticket 06: Hier stand `{ type }` ohne Werte. Jetzt steht die
    Fassung aus 06 Zeichen für Zeichen hier, samt beiden Kommentaren: Unter jedem Himmel gilt diese Art, mit den Werten
    des ersten Himmels, der sie hat. `?brett=stone` wirkt wie bisher.
  - Im Ticket stand `SHOCK_REST_S` mit 6 s, im Code sind es 8 s. Beide Stellen im Ticket sind nachgeführt.
  - Kommentar zu `shockClock`: Beim Fall des Lichts (`story.shock`) läuft der Ring mit rund 4,7 m/s, also läuft auch
    die Uhr langsamer. Die Front bleibt dabei am Ring.
  - `tidePoolData`: Die unbenutzte Variable `HP` ist entfernt (mit Node nachgerechnet).
  - `brett-probe`, Teil Reise: Die Probe gibt jetzt auch die Wartezeit ab dem Abflug aus.
- **Reise ohne Vorladen** (die Frage nach Reise- und Wartezeit):
  - Der Himmel des Meers wird 4,6 s nach «Weiter» gewählt (Aufstieg und 1 s Flug), das ist Reisezeit. Die Wartezeit
    ab da bis zum Brett im Bild betrug in sechs Läufen 2,0, 7,4, 3,2, 2,8, 2,9 und 1,4 s.
  - Aufgeschlüsselt in drei Läufen: Das Gezeitenbecken war 1,9–2,5 s nach dem Bauen bereit. Die Fassungen fürs
    Überblenden brauchten weitere 0,7–0,9 s. Der Himmel des Meers war etwa gleichzeitig fertig.
  - Der Notfall kann auf der Reise nicht auslösen: Das alte Brett bleibt gehalten, und die Frist zählt nur, wenn kein
    Brett dasteht. Die 8 s sind nur die Grenze, wie lange der Träger schwebt (`story.travel`). Danach fliegt er weiter,
    und das Brett lädt im Flug fertig. Ein falsches Brett gibt es dabei nicht, wohl aber vielleicht ein Ruckeln.
  - Der Lauf mit 7,4 s war auch der mit einer Lücke von 162 ms (11 über 50 ms). Der Rechner war da stark belastet. In den
    anderen fünf Läufen lag die längste Lücke bei 49–66 ms.
- **Hinweise (keine Auflage):**
  - **Ticket 10 (Poco):** Die Reise ohne Vorladen auf dem Handy messen. Rechnet der Worker dort mehrere Sekunden, rückt
    die 8-s-Grenze des Trägers nahe. Im Spiel lädt das Vorladen nach «Gelöst» das Brett meist schon vorher.
  - **Ticket 10, Speicher:** Die Texturdaten jedes Bretts bleiben auch nach dem Hochladen im JS-Speicher, rund 12 MB je
    Brett, bei drei Brettern also rund 37 MB. Das war beim Steinbrett schon so.
  - **Wackelige Lücken-Prüfung** «Brett laden und überblenden» (Mechanik, Probe-Art, nicht das Gezeitenbecken): Sie
    scheiterte hier zweimal von zwei Läufen, mit 109 ms bei 1398 ms und 127 ms bei 1414 ms. Das ist dieselbe Stelle wie
    im Review von 02 (107 und 103 ms bei 1389 ms), also das erste Bild des Strand-Panoramas mitten im Überblenden. Mit
    04 hat das nichts zu tun, sie sollte aber in 05 oder 10 robuster werden. Die neue Prüfung im Teil Reise scheiterte
    einmal von sechs Läufen (162 ms, siehe oben).
  - Steht die Schleife still (Bühne deckt die Szene, `?t=`), steht auch `uShockT`. Danach läuft die Welle dort weiter,
    wo sie stand. Das fällt kaum auf.
  - Im Würfel misst die Uhr den Kreis, in dem die Kugelschale den Boden schneidet. Die Front bleibt am Ring, die Uhr
    läuft aber anfangs schneller. Das zählt nur, falls das Gezeitenbecken unter einem Würfel steht.
  - Die Tropfen der Rinne fliegen kurz bis etwa 1 m über den Umriss hinaus, die des Felds bis etwa 2,5 m, wie in der
    Vorlage. Die Seiten nehmen `rock[1]` (0,48/0,38/0,38), Karte 6 hatte 0,44/0,34/0,34. Beides ist im Aussehen
    abgenommen.
  - **Smells, alle nach Ermessen:** Das Überblenden (`look`, `setFade`, `fadeVariants`, `dispose`) steht fast gleich in
    `stoneBoard` und `tidePoolBoard`. Ticket 05 fasst das ohnehin an und könnte es zusammenziehen. Die Masse 4,2 und
    4,9 in `tools/sky-schema.mjs` stehen von Hand neben `BOARD` und `PLATE`. Die Namen `a0` und `a1` erklären sich nur
    über die Kommentare. `klicke` steht in `reise` und `menue` doppelt, ebenso die Formel für `soll` in beiden Proben.
  - **Abweichungen, bewusst:** Der Teil `reise` liest `boardTheme.built` und schaltet `skyTheme.preload` ab (Interna,
    wie schon im Review von 02 festgehalten). Im Kopf von `brett-probe` steht die Zeile zur Lehmterrasse, die erst nach
    dem Merge von 06 stimmt. `?brett=` fehlt im README, weil er mit 10 wegfällt. «Gezeitenbecken» fehlt noch im Glossar
    (`CONTEXT.md`). Ticket 10 prüft das Glossar, danach muss der KI-Tester-Test laufen.
- **Tests im Review** (Stand mit den Behebungen; die Proben je über `leise.sh`, GPU, stumm):
  - `node tests/logic.test.mjs`: 2040 bestanden. `node tests/ki-tester.test.mjs`: 84 bestanden.
  - `tests/offline.mjs`: bestanden. Am Strand ist das Brett `tidePool`, online wie offline.
  - `tests/brett-probe.mjs`:
    - Netz 4/4 grün: Der Blick sinkt 4,6 s nach «Weiter» auf das bereite Brett der Wüste.
    - Menü 3/3 grün.
    - Reise 6/6 grün in fünf von sechs Läufen. Ein Lauf scheiterte an der Lücke (162 ms, siehe oben). Der letzte Lauf,
      nach der letzten Änderung, war grün.
    - Mechanik 19/20: Rot blieb nur die wackelige Lücken-Prüfung (siehe oben).
  - Geschichte-Probe `--grad leicht`: bestanden, Konsole ohne Fehler, das Gezeitenbecken steht im Meer. Nach dem Lösen
    ist der Stein nass und glitzert.
  - Geschichte-Probe `--uebersicht`: bestanden. «Weiter ins Meer» blendet vom Steinbrett ins Gezeitenbecken über 2,40 s,
    keine Lücke über 100 ms (längste 67 ms).
  - Beide Proben liefen auf dem heutigen Stand von `tests/geschichte-probe.mjs` (byte-gleich mit 06) und
    `tests/brett-probe.mjs`.
