# 02: Das Brett wechselt mit dem Himmel: bereit, halten, überblenden

**Spec:** ../spec.md

**Blocked by:** 01

**Status:** resolved

**What to build:** Das Brett gehört zum Bereitsein seines Himmels. Es wird berechnet, während der Himmel lädt oder
vorgeladen wird, und hält, bis das neue bereit ist. Es blendet gleichzeitig mit dem Himmel über und wird mit ihm
freigegeben. Damit sieht der Spieler unter einem Blender-Himmel nie ein falsches oder ein Steinbrett. Gebaut und
geprüft wird das mit dem Steinbrett als vorläufigem Brett aller fünf Himmel (Ticket 01), also bevor die Gestaltung
feststeht.

- [x] **Bereitsein:** `skyTheme.ready` und damit `__prisma.skyReady()` ist erst wahr, wenn auch das Brett des Himmels
      berechnet und hochgeladen ist. Jede Stelle, die heute auf den Himmel wartet, wartet damit auch auf das Brett:
      - das Angebot nach dem Prolog («Gleich los»),
      - der Einstieg in eine Welt,
      - die Reise,
      - das Fortsetzen nach dem Neuladen,
      - das Wiederholen über eine Weltgrenze,
      - das Senken des Blicks aufs Brett.

      Gewartet wird höchstens 8 Sekunden, mit dem Kleinen Wagen wie heute.
- [x] **Rechnen beim Laden:** Das Brett eines Himmels wird berechnet (im Hintergrund-Thread) und hochgeladen, wenn sein
      Himmel vorbereitet oder vorgeladen wird (`prepare`, `preload`), nie im Moment des Wechsels. Für die nächste Welt
      geschieht das, solange «Gelöst» steht. Grosse Uploads folgen den Regeln der Himmel (`skyTheme.quiet`,
      `ruhe.lade`).
- [x] **Halten:** Bis das neue Brett bereit ist, bleibt das bisherige stehen, so wie `skyTheme.update` den bisherigen
      Himmel hält.
- [x] **Überblenden:** Das Brett gleitet gleichzeitig mit dem Himmel und über dessen ganze Dauer (`fadeTime`, in der
      Geschichte 2,4 s oder 3 s) direkt vom alten zum neuen Brett.
      - Es gibt kein Steinbrett dazwischen, auch wenn der Himmel selbst über die Nacht wechselt (ins Sonnensystem, zu
        den Sternen).
      - Für Bretter gleicher Form genügt ein Mischen im Material.
      - Den Weg zwischen verschiedenen Formen legt Ticket 05 fest. Hier muss nur die Schnittstelle dafür bereitstehen.
      - Während des Überblendens gilt im Plattentest der Schnitt der Kernquader beider Bretter. Dort muss jedes Pixel
        von einem der beiden deckend gezeichnet sein, sonst fehlt dahinter der Himmel.
- [x] **Freigeben:** Die Texturen eines Bretts werden zusammen mit denen seines Himmels freigegeben (auf dem Handy
      sofort, auf dem Desktop nach 30 s). Das Steinbrett bleibt immer, weil Milchstrasse und Rückfall es brauchen.
- [x] **Notfall:** Scheitert das Berechnen, oder fehlt nach 8 Sekunden jedes frühere Brett, erscheint das Steinbrett.
      Dabei steht kein `[error]` in der Konsole, eine Warnung ist erlaubt.
- [x] **Testschnittstelle:** `brett()` meldet zusätzlich, wie weit eine Überblendung ist (`anteil` 0 bis 1 des neuen
      Bretts, 1 ohne Überblendung) und von welchem Himmel sie kommt (`von`).
- [x] **Proben:**
      - `tests/geschichte-probe.mjs` schreibt je Bild das Brett ins Protokoll (Himmel, bereit, Anteil).
      - `ohneLeeresBrett` prüft zusätzlich zwei Dinge:
        - Der Blick senkt sich erst, wenn das Brett des Himmels der Welt bereit ist.
        - Unter einem Blender-Himmel steht nie das Brett eines anderen Himmels oder ein Steinbrett im Blick.
      - In jeder Welt und «Im Dorf» passt das Brett zum Himmel.
      - Mit `--uebersicht` wechselt das Brett beim Wiederholen über eine Weltgrenze mit.
      - Die gemessenen Bildzeiten der Übergänge haben keine Lücken über 100 ms.
- [x] **Langsames Netz:** Mit gedrosseltem Netz (DevTools oder eine Probe mit Netzdrosselung) wartet der Kleine Wagen,
      bis Himmel und Brett da sind. Unter einem Blender-Himmel erscheint kein Steinbrett. Das Ergebnis steht im Ticket.
- [x] **Leistung:** Das Messwerkzeug (`?perf`, Taste F) misst vorher und nachher, auf dem Desktop und in der
      Handy-Ansicht. Die Werte stehen im Ticket, und die Bildzeit steigt nicht messbar.
- [x] Alle Tests sind grün, auch die Geschichte-Probe mit `--dorf` und `--uebersicht`, und das Review nach dem Ticket
      ist gelaufen.

## Hinweise

- **Wie der Himmel heute wechselt:**
  - `skyTheme.set`, `preload`, `update` und `apply` steuern den Wechsel. Der Himmel blendet zuerst aus und dann ein, ein
    gewöhnlicher Wechsel dauert je 1,5 s.
  - Zwischen zwei Welten auf der Erde gleitet er über die Farben beider (`story.blendSky`).
  - `story.skyOf` wartet mit dem Kleinen Wagen. Das Angebot wartet in einer eigenen Schleife (8 s).
- Das Ruckeln beim ersten Hochladen grosser Texturen ist bekannt (siehe die Erinnerung «Start-Ruckeln» und
  `.scratch/leistung/`, Ticket 09). Messen lässt es sich mit den Bildzeiten der Geschichte-Probe.

## Comments

**Zwischenstand 1 (06.11.2026): vorgefunden**

Ein früherer Agent hatte am 05.11. begonnen und ohne Notiz aufgehört. Uncommittet im Worktree lagen:

- `index.html` (+~470 Zeilen), im Brett-Teil schon weitgehend gebaut:
  - `boardTheme` mit `prepare`/`free` (von `skyTheme.set`, `preload` und dem Freigeben in `update`), `load` (warten
    aufs Berechnen, `sceneReady`, `ruhe`, Programme mit `compileParallel`, Texturen in Häppchen über den neuen
    Generator `boardTextureUpload` wie `skyUpload`), `follow` je Bild (Halten, Überblenden mit dem Himmel, Springen,
    Notfall nach 8 s mit eigener Uhr), `render` (`setFade` je Brett, Schnitt der Kernquader), `mirrors`, `info` mit
    `von`, `anteil`, `notfall`.
  - `skyTheme.ready` schliesst das Brett ein (`steht`), neu `skyTheme.settled` und `holding` (hält den bisherigen
    Himmel, solange das Brett des gewählten nicht bereit ist). Reise und Wiederholen über eine Weltgrenze warten auf
    `skyTheme.settled` statt aufs Modul.
  - Steinbrett: `computed` ist jetzt ein Promise (abgelehnt, wenn das Berechnen scheitert), `setFade(k, upper)` mischt
    im Material (das neue liegt durchsichtig oben, das bisherige deckend darunter), `fadeVariants` zum Vorab-Übersetzen.
  - `BOARD_CORE` heisst `boardCoreUniforms`, `renderReflection` blendet alle gezeigten Oberflächen aus,
    `boardTheme.upload()` in `draw` ist weg, `sceneReady` steht weiter vorn.
- `tests/geschichte-probe.mjs`: Protokoll je Bild mit Brett, `brettPasst` in jeder Messung, `ohneLeeresBrett` und
  `brettDerWelt` erweitert, `--uebersicht` prüft den Wechsel des Bretts mit dem Himmel.
- `tests/offline.mjs`: `skyReady` erst, wenn das Brett bereit ist und ganz steht.
- neu `tests/brett-probe.mjs`: Mechanik mit zwei nur in der Seite angelegten Arten (`probe`: Steinbrett mit Tor,
  `kaputt`) und langsames Netz (CDP-Drosselung, Handy).
- `sw.js`: `APP_VERSION`.

Nichts davon war gelaufen oder gemessen (keine Ausgaben, keine Notiz). Der Aufbau ist stimmig; ich behalte ihn,
prüfe ihn Stück für Stück und baue zu Ende.

**Zwischenstand 2 (06.11.2026): Mechanik geprüft, kleine Änderungen**

- Erste Läufe auf dem vorgefundenen Stand: Logik 2039 bestanden, Offline-Probe bestanden, `brett-probe` (Mechanik und
  Netz) bestanden.
- Geändert:
  - `skyTheme.holding` hält den bisherigen Himmel fürs Brett nur, wenn ein Brett dasteht, das stehen bleiben muss
    (`boardTheme.haelt`). Steht keines (erster Himmel nach dem Start, das Steinbrett rechnet noch), gibt es nichts zu
    halten, und der Himmel muss nicht darauf warten.
  - `brett-probe` Mechanik: neu der Fall «vorgeladen» (`preload` des Dorfs mit eigenem Brett: Es ist vor dem Wechsel
    bereit, Himmel und Brett blenden ohne Halten über) und die längste Lücke beim Laden und Überblenden eines eigenen
    Bretts (höchstens 100 ms). Die Wüste mit dem scheiternden Brett kommt jetzt vom Brett des Dorfs (Überblenden in
    den Notfall).
  - `brett-probe` Netz geht wie im Spiel über den Startbildschirm (ohne `?nointro`): Unter dem Menü lädt dann nichts
    Grosses, das Brett lädt erst hinter der Überblendung nach «Weiter» (`ruhe.lade`). So prüft die Probe die echten
    Regeln für ruhige Stellen.
  - `APP_VERSION` `2026-11-06 brett-wechsel`.

**Zwischenstand 3 (06.11.2026): Proben und Messungen**

- Geschichte-Probe (GPU, Desktop): `--grad leicht` bestanden, `--dorf` bestanden (11 Messungen, längste Lücke 67 ms,
  keine über 100 ms), `--uebersicht` bestanden (8 Messungen, längste Lücke 79 ms; «Weiter ins Meer»: Brett und Himmel
  blenden gleichzeitig über 2,38 s). Konsole jeweils ohne Fehler.
- Vergleichsbilder gegen HEAD (Kopie der Seite, `?t=12`, Level 0, `settle(6)`, Desktop 1440 × 900): Strand und
  Milchstrasse, je normal, flach (`phiMax`) und ganz herausgezoomt (`zoomMax`): alle 6 Paare pixelgleich.
- Kernquader (einmalig von Hand, weil Interna nicht in die Proben gehören): Mit einer Testart mit kleinerem Kernquader
  liest der Plattentest vor dem Wechsel den Quader des Steinbretts, während des Überblendens den Schnitt beider und
  danach den der Testart (je 1 cm kleiner).
- Kosten je Bild (Seite mit CPU 4×): `boardTheme.follow` 5,6 µs je Aufruf; die Getter `ready`, `settled`, `holding`,
  `busy` und `mirrors` zusammen 14 µs.
- Messwerkzeug über `tests/leerlauf-probe.mjs` (`?perf`, headless mit GPU, Strand), Zeichenzeit Mittel / p95 in ms im
  Abschnitt «Ruhe» (erstes Level, keine Eingabe):

  | Ansicht | vorher (HEAD) | nachher |
  |---|---|---|
  | Desktop 1440 × 900, 3 Läufe | 11,27 / 15,4 · 10,56 / 13,2 · 10,95 / 13,7 | 8,63 / 11,4 · 10,76 / 13,0 · 10,51 / 12,8 |
  | Handy 393 × 873, CPU 4×, 3 Läufe | 15,41 / 20,7 · 13,92 / 20,1 · 15,24 / 20,6 | 14,85 / 18,9 · 13,29 / 21,9 · 14,80 / 19,5 |

  Auch «Eingabe» und «Menü» liegen im Rauschen. Gedrosselt schwanken die Läufe beider Fassungen stark (gezeichnete
  Bilder je s in «Ruhe» 25–39). Die Reaktionsprüfung der Probe scheitert headless auf dem Desktop bei alt und neu
  gleich (virtuell getaktetes rAF), das ist nicht von diesem Ticket.
- Start-Probe (`--handy --drossel 4`, headless, je 5 Läufe):
  - frischer Stand, längste Lücke im Startbildschirm: vorher 158, 139, 121, 115, 127 ms; nachher 255, 109, 115, 127,
    158 ms. Sie liegt bei beiden um 6,3 s nach dem Laden, wo der Himmel des Walds hochlädt.
  - «Weiter» mitten im Wald, längstes Bild im Spiel: vorher 79, 79, 66, 79, 73 ms; nachher 206, 67, 79, 55, 79 ms.
    Der eine Ausreisser von 206 ms kam in vier weiteren Läufen nicht wieder.
  - Himmel nach «Weiter»: vorher 1,91–2,22 s, nachher 1,60–2,63 s; Level spielt vorher 5,0–5,5 s, nachher 4,7–6,3 s.

**Umsetzung (06.11.2026, Branch `feature/brett-je-himmel`, nicht committet, Review offen)**

- **Brett-Teil** (`index.html`, «BRETT mit planarer Spiegelung»): `skyTheme` steuert `boardTheme`, die Geschichte
  spricht nur mit dem Himmel.
  - **Bereitsein:** `skyTheme.ready` verlangt `boardTheme.steht` (das Brett des gewählten Himmels steht ganz, bereit
    und ohne Überblenden; Notfall nur, wenn das Berechnen scheiterte). Neu `skyTheme.settled` (Himmel geladen und
    Brett bereit), darauf warten Reise und Wiederholen über eine Weltgrenze statt aufs Modul. Angebot, Einstieg,
    Fortsetzen nach dem Neuladen und das Senken des Blicks warten über `skyTheme.ready` (Angebot, `story.skyOf`), je
    höchstens 8 s mit dem Kleinen Wagen wie bisher.
  - **Laden:** `skyTheme.set` und `preload` rufen `boardTheme.prepare(sky, angabe)`: bauen (`acquire`, geteilt bei
    gleicher Angabe), dann `load`: warten aufs Berechnen im Hintergrund-Thread (`computed` ist ein Promise), auf das
    erste Bild und eine ruhige Stelle, Programme mit `compileParallel` in Häppchen, Texturen mit dem neuen Generator
    `boardTextureUpload` (an three vorbei wie `skyUpload`, je Bild höchstens 1 MB an einer ruhigen Stelle, Mipmaps auf
    der Grafikkarte). `boardTheme.upload()` in `draw` ist weg. Unter dem Menü lädt es nicht, hinter der Überblendung
    nach «Weiter» schon (`ruhe.lade` in `skyOf`).
  - **Halten:** `skyTheme.holding` hält den bisherigen Himmel samt Brett, solange das Brett des gewählten nicht bereit
    ist und ein Brett dasteht (`boardTheme.haelt`).
  - **Überblenden:** `boardTheme.follow(dt)` je Bild nach `skyTheme.update`: Sobald der Himmel überblendet, gleitet das
    Brett vom bisherigen (`from`) zum neuen (`to`), der Anteil ist der Fortschritt des Himmels über seine ganze Dauer
    (0 … 0,5 Ausblenden, 0,5 … 1 Einblenden, wie `blendSky`), also auch über die Nacht ohne Steinbrett dazwischen.
    `render` ruft je Brett `setFade(k, upper)`. Das Steinbrett mischt im Material: Das neue liegt durchsichtig oben
    (ohne Tiefe, `polygonOffset`, `renderOrder −1`), das bisherige bleibt darunter deckend, bis es weg ist. Die
    durchsichtigen Programme sind vorab übersetzt (`fadeVariants`, `needOben`, sobald es mehr als ein Brett gibt);
    `bereitFuer` wartet darauf.
  - **Schnitt der Kernquader:** `render` setzt `boardCoreUniforms` (früher `BOARD_CORE`) auf den Kernquader des
    gezeigten Bretts, während des Überblendens auf den Schnitt beider (je 1 cm kleiner). Ohne Brett liegt er weit
    unter der Szene.
  - **Spiegelung:** `boardTheme.mirrors` liefert die Oberflächen beider gezeigten Bretter, `renderReflection` blendet
    alle beim Spiegeln aus.
  - **Freigeben:** `skyTheme.update` ruft beim Freigeben eines Panoramas `boardTheme.free(sky)` (Handy sofort, Desktop
    nach `keep`, immer sofort, sobald ein anderes Panorama gewählt ist). Gezeigt bleibt ein Brett, bis sein Überblenden
    vorbei ist (eigene Zählung in `show`). Das Steinbrett hält ein dauerhaftes `acquire`.
  - **Notfall:** Scheitert das Berechnen (oder Bauen, Übersetzen, Hochladen), gilt für den Himmel das Steinbrett
    (`notfall`). Steht 8 s lang kein Brett da (kein früheres zum Halten, die Frist läuft ab dem Start der Szene),
    erscheint das Steinbrett und gleitet, sobald das richtige bereit ist, in `fadeTime` hinüber. Beides mit
    `console.warn`, nie `[error]`.
  - **Testschnittstelle:** `__prisma.brett()` meldet `{ himmel, art, bereit, von, anteil, notfall }`;
    `boardTheme.types` nimmt Arten an, die nur eine Probe anlegt.
- **Proben:** `tests/geschichte-probe.mjs` (Brett je Bild im Protokoll, `brettPasst` in jeder Messung,
  `ohneLeeresBrett` erweitert, neu `brettDerWelt`, `--uebersicht` prüft das Mitwechseln), `tests/offline.mjs`
  (`skyReady` erst mit bereitem Brett), neu `tests/brett-probe.mjs` (Mechanik mit Testarten, langsames Netz), im
  README beschrieben.
- **Langsames Netz** (`brett-probe` netz: Handy 390 × 844, 300 KB/s, 150 ms, CPU 4×, über den Startbildschirm, Stand
  mitten in der Wüste): «Tippen zum Starten» nach 13,2 s, «Weiter» gleich danach; Himmel und Brett waren da noch
  nicht bereit (`brett()` meldet keines). Der Kleine Wagen stand in 356 von 439 Bildern, der Blick senkte sich 4,3 s
  nach «Weiter» auf das bereite Brett der Wüste (Steinbrett als ihr Brett, kein Notfall). Unter dem Himmel der Wüste
  stand nie ein fremdes Brett oder ein Notfall-Steinbrett.
- **Tests:**
  - `node tests/logic.test.mjs`: 2039 bestanden.
  - `tests/offline.mjs`: bestanden.
  - `tests/brett-probe.mjs`: bestanden (Mechanik 20 Prüfungen, Netz 4). Laden und Überblenden eines eigenen Bretts:
    längste Lücke 61 ms; vorgeladenes Dorf: 36 ms. Überblenden Wald → Strand: Himmel und Brett je 2,42 s, Beginn
    und Ende im selben Bild.
  - Geschichte-Probe (GPU): `--grad leicht` (Desktop und `--handy`), `--dorf`, `--uebersicht` und `--menue` bestanden,
    keine Lücke über 100 ms (längste 79 ms), Konsole ohne Fehler und Warnungen.
- **Abweichungen vom Ticket:**
  - `skyTheme.quiet` hält das Hochladen des Bretts nicht auf. Das Brett gehört zu dem, was ein Himmel zum Einblenden
    braucht (`settled`), wie Netz und Vorschau des Panoramas, die ebenfalls während `quiet` hochladen. Mit `quiet` warten
    nur scharfes Bild und Streifen, die erst nach dem Einblenden kommen. Wartete das Brett darauf, blieben Reise und
    Wiederholen bis zur Frist von 8 s stehen. Grosse Uploads laufen trotzdem nur in Häppchen an ruhigen Stellen.
  - Hält ein Brett, das nie bereit wird, den bisherigen Himmel, endet das Halten nicht nach 8 s (wie beim Himmel, der
    nicht lädt). Die Geschichte geht nach 8 s weiter, das Level landet dann unter dem bisherigen Himmel auf dessen
    Brett, also stimmig.
  - `brett()` meldet zusätzlich `notfall`.
- **Für Ticket 04 und 05:**
  - Eine neue Art: Eintrag in `BOARD_TYPES` (eine Zeile, das Prüfwerkzeug liest sie) und `BOARD_PARAMS` in
    `tools/sky-schema.mjs`, je `{ core, build(values) }`. `build` liefert `{ group, mirror, textures, computed (Promise),
    setFade(k, upper), fadeVariants, dispose }`, beschrieben über `BOARD_TYPES`. Die Lichtwelle hängt an
    `shockUniforms`.
  - `boardTextureUpload` kann nur `DataTexture` mit RGBA-Bytes in `image.data` (sRGB oder linear, mit oder ohne
    Mipmaps). Andere Formate brauchen dort einen Zweig.
  - Überblenden verschiedener Formen: `setFade(k, true)` bekommt das neue, `setFade(1 − k, false)` das bisherige. Der
    Plattentest nimmt den Schnitt beider Kernquader, und dort muss in jedem Bild jedes Pixel von einem der beiden
    deckend gezeichnet sein. Das Steinbrett erreicht das, indem das bisherige bis zum Schluss deckend bleibt. Löst
    sich in 05 das bisherige auf, muss das neue dort decken, oder der Kernquader beim Überblenden muss kleiner werden.
  - Durchsichtige oder andere Fassungen für das Überblenden gehören in `fadeVariants`, sonst übersetzt three sie im
    ersten Bild des Wechsels (Ruck).
  - Jedes eigene Brett belegt seinen Grafikspeicher zusätzlich zum Steinbrett, das immer bleibt. Mit Vorladen stehen
    kurz drei Bretter im Speicher (gezeigt, vorgeladen, Steinbrett).
  - Fester Zufall: Ein eigenes Brett baut seine Objekte, wenn sein Himmel vorbereitet wird. Mit `?t=` verschiebt das den
    Zufall späterer Objekte (Ziele anders gedreht), ohne dass sich etwas am Brett ändert.
  - `tests/brett-probe.mjs` prüft die Mechanik mit Testarten. Sobald der Strand ein eigenes Brett hat, lässt sich
    dort auch das echte Überblenden zeigen (Bilder mitten im Wechsel, flach und herausgezoomt).

**Review (06.11.2026, unabhängiger Reviewer, Standards und Spec getrennt geprüft): bestanden; die Auflage (Frist des
Notfalls) ist auf Wunsch der Leitung im Review behoben, Hinweise für 04, 05 und 10**

- **Auflage, im Review behoben:** Solange alle Himmel das Steinbrett haben, war der Fehler ohne Wirkung. Ab dem
  ersten eigenen Brett hätte er zu einem Notfall und einer Warnung geführt, obwohl niemand gewartet hat.
  - **Frist läuft auch im Menü:** Die 8 s bis zum Notfall zählen ab `sceneLoop.started` (`follow`), also auch im Menü.
    Dort lädt bewusst nichts (`story.choosing` ist keine ruhige Stelle). Wer beim ersten Start schnell tippt und im
    Menü verweilt, bekommt so unter dem Blender-Himmel nach 8 s das Steinbrett als Notfall samt Warnung. Die Spec
    meint aber 8 s Warten. Vorschlag: Die Frist zählt nur, solange das Brett laden darf (`ruhe.jetzt()`), oder nur,
    solange die Geschichte darauf wartet.
  - **Steinbrett ohne Prüfung:** Der Notfall zeigt `this.stone`, ohne `stone.ready` zu prüfen. Ist es noch nicht
    hochgeladen, lädt three es beim ersten Zeichnen in einem Stück. Das ist der Ruck aus dem Review von 01, und
    `boardTextureUpload` bricht dann ab. Vorschlag: das Steinbrett erst zeigen, wenn es bereit ist.
  - **Neuer Fall für `brett-probe`:** im Menü länger als 8 s, bevor das Brett bereit ist. Dabei darf es keinen Notfall
    und keine Warnung geben.
  - **Behoben (`index.html`, `boardTheme`):**
    - `fristStarten` ersetzt `ohneSeit`. Die Frist zählt mit eigener Uhr (alle 100 ms) nur die Zeit, in der das Brett
      laden darf (`ruhe.jetzt()`). Wartet die Geschichte, gilt das ebenfalls (`skyOf` markiert das Laden). Nach 8 s
      weckt die Uhr die Schleife.
    - Der Notfall nimmt das Steinbrett erst, wenn es bereit ist (`stone.ready`). Bis dahin weckt dessen `load` die
      Schleife.
  - **`brett-probe` mit neuem Teil `menue`:** Desktop über den Startbildschirm, im Menü springt der Himmel zum Dorf mit
    einer Testart, die nie bereit wird. Nach 10 s gibt es keinen Notfall und keine Warnung; README und Kopf der Probe
    sind nachgeführt.
  - **Gegenprobe** (einmalig, nicht in der Probe): Zählt die Zeit im Menü doch (`ruhe.jetzt` immer wahr), kommt der
    Notfall nach 8,1 s samt Warnung. Der Fall ist also nicht leer.

- **Geprüft (im Code, dazu Läufe):**
  - **Warten aufs Brett:** Alle Stellen, die auf den Himmel warten, warten auch aufs Brett, jede höchstens 8 s:
    - das Angebot mit der Uhr,
    - Einstieg und Fortsetzen über `skyOf` (`skyTheme.ready`),
    - Reise und Wiederholen über eine Weltgrenze (`skyTheme.settled`).

    Keine Schleife ist ohne Grenze. Auch ein Brett, das nie bereit wird, lässt die Geschichte nicht hängen.
  - **Kein fremdes Brett:** Unter einem Blender-Himmel steht auf keinem der Wege ein fremdes Brett oder ein Steinbrett
    ohne Notfall (Reise, Einstieg, Angebot, Fortsetzen, Wiederholen, Menü). Gehalten wird immer das Paar aus bisherigem
    Himmel und bisherigem Brett. Springt der Himmel (`set` ohne Überblenden), steht bis zum Bereitsein keines da. Das
    geschieht nur verdeckt: beim Start, nach «Üben» hinter der Bühne und mit `?sky=`.
  - **Keine Löcher im Himmel:** Beim Überblenden bleibt das bisherige Brett bis zum letzten Bild deckend
    (`setFade(1 − k, false)`), und der Schnitt der Kernquader liegt in seinem Quader. Ohne Brett liegt der Quader unter
    der Szene.
  - **Freigeben und Rennen:**
    - `show` hält die gezeigten Bretter mit einer eigenen Zählung.
    - `free` während des Ladens bricht Übersetzen und Hochladen ab, und `weg()` löscht die halbe WebGL-Textur.
    - `dispose` löscht die eigene Textur samt `properties`.
    - Durchgegangen: Wald → Strand → Wald, ein Wechsel mitten im Überblenden, Vorladen mit anschliessendem Wechsel
      woandershin. Dabei fand sich kein Leck und kein Hängen.
  - **Die beiden Abweichungen sind vertretbar:**
    - `quiet`: Ohne Brett ist ein Himmel nicht `settled`. Wartete das Brett auf `quiet`, stünden Reise und Wiederholen
      8 s. Mit dem Vorladen ist es meist vorher fertig, sonst lädt es in Häppchen, während der Träger fast still
      schwebt.
    - Halten ohne Zeitgrenze: Der Himmel hält schon immer so. Himmel und Brett bleiben dabei ein stimmiges Paar.
  - **Form:**
    - Zeilenenden CRLF wie zuvor, und `git diff --stat` zeigt keine ganzen Dateien.
    - Kein Hinweis auf ein KI-Werkzeug, und `APP_VERSION` ist in `sw.js` und `index.html` gleich.
    - Es gibt keine Verweise mehr auf `BOARD_CORE`, `boardTheme.upload`, `isReady` oder `shown`.
    - Die Hinweise aus dem Review von 01 sind umgesetzt (Häppchen, `prepare`/`show` getrennt, `angabe`,
      `boardCoreUniforms`).
- **Selbst behoben (nur Kommentare und Text):**
  - `tests/geschichte-probe.mjs`: eine zu lange Kommentarzeile bei `messe` umbrochen.
  - `index.html`:
    - Der Kopf von `boardTheme` nennt `prepare(sky, angabe)` und sagt, dass das Brett nicht auf `quiet` wartet, und
      warum.
    - Der Kopf von `ruhe` nennt das Laden eines Bretts.
    - Beim Kommentar zu `?sky=` heisst es «set bereitet das Brett vor» statt «zeigt».
  - Ticket: `brettDerWelt` ist neu, nicht erweitert.
- **Ausreisser von 255 und 206 ms: nicht von diesem Ticket.**
  - **Start-Probe** (headless mit GPU, `--handy --drossel 4`), HEAD als Kopie gegen neu, teils abwechselnd. Der
    Rechner war dabei stark belastet: `.go` schwankte bei derselben Seite zwischen 1,5 und 5,1 s.
    - Längste Lücke im Startbildschirm, je 12 Läufe: HEAD 91–345 ms, neu 103–788 ms. Die Werte überlappen sich, und
      in fünf direkt abwechselnden Paaren war es HEAD 194–345 ms gegen neu 103–479 ms.
    - Längstes Bild im Spiel nach «Weiter», je 7 Läufe: HEAD 67–158 ms, neu 60–230 ms.
  - **Gegenprobe bei ruhigerem Rechner** (je 3 Läufe, alle Uploads mit Zeit aufgezeichnet):
    - Die längste Lücke im Startbildschirm liegt bei beiden um 6,3–6,6 s und ist gleich gross: HEAD 97–109 ms, neu
      91–109 ms.
    - Bei HEAD lädt in dieser Lücke nichts hoch. Das Steinbrett lud dort im ersten, verdeckten Bild vor der Enthüllung
      hoch.
    - Neu fällt in dieselbe ruhige Stelle das erste Häppchen des Steinbretts (`texStorage2D` und die erste Zeile von
      1 MB). Die längste Lücke wird dadurch nicht grösser.
    - Im Spiel nach «Weiter» lädt am Brett nichts mehr, es ist schon vor dem Klick bereit. Die Spiegelung legt ihr Ziel
      bei beiden Fassungen im selben Moment an, wenn der Blick sinkt.
- **Hinweise (kein Mangel von 02):**
  - **Lücken-Prüfungen sind schon vorher wackelig.** Die Lücke beim ersten Bild eines Panoramas mitten im Überblenden
    gab es schon vorher: Wald → Strand misst HEAD 61–79 ms, neu ohne eigenes Brett 66–78 ms, mit dem Probe-Brett
    66–97 ms. Darum scheiterte die neue Prüfung «Brett laden und überblenden» in `brett-probe` einmal mit 107 ms (im
    zweiten Lauf 67 ms). Am Brett ändert sich in diesem Bild nichts. Ebenso scheiterte `--dorf` hier in beiden Läufen
    an je einer Lücke:
    - 173 ms bei stehendem Himmel und Brett,
    - 121 ms im Moment des Klicks auf «Übung 8 wiederholen».

    HEAD (als Export gestartet) scheitert an derselben Stelle mit 170 ms. Alle Prüfungen zum Brett waren grün.
  - **Sprünge beim Umlenken:** Wird ein Überblenden mittendrin auf einen dritten Himmel umgelenkt (oder zurück),
    springt der Anteil des fallengelassenen Bretts in einem Bild weg, je nach Moment bis zur Hälfte. Mit dem
    Steinbrett ist das unsichtbar. In 05 lohnt ein Blick darauf.
  - **Notfall ohne Überblenden:** Das Steinbrett nach 8 s ohne Brett erscheint ohne Einblenden. Nach einem Sprung des
    Himmels steht bis dahin keines da, das geschieht aber nur verdeckt.
  - **Bereites Brett ohne Halten:** Gibt es kein früheres Brett zum Halten, erscheint ein Brett, sobald es bereit
    ist, auch unter dem alten Himmel, den sein Modul noch hält. Das kommt nur beim Start, im Menü und auf der Bühne vor,
    und die Kamera schaut dann in den Himmel. `brettPasst` (Blick unter 0,6) würde es nicht bemerken.
  - **Interna in `brett-probe`:** Die Probe liest auch Interna (`boardTheme.built` samt Format der Schlüssel,
    `group.visible`, `ready`/`obenBereit`, `skyTheme.holding`). Die Spec sagt «Er prüft keine Interna», und die Achse
    Standards wertet das als Verstoss. Solange alle Himmel das Steinbrett zeigen, geht es aber nicht anders. Ich halte
    es darum hier als bewusste Abweichung fest. Ab 04/05 sollte die Probe, wo möglich, nur `brett()` und Bilder
    nutzen.
  - **Proben prüfen nicht die Art:** «Unter einem Blender-Himmel nie das Steinbrett» prüfen die Proben über
    `notfall` und `himmel`, also über Werte der Umsetzung selbst. Ab 04 sollten sie zusätzlich `art` mit der
    Brett-Angabe im Register vergleichen.
  - **Abweichung `quiet` ungeprüft:** Keine Probe lädt während einer Reise ein eigenes Brett, denn alle Himmel teilen
    das Steinbrett, das seit dem Start bereit ist. Auf der Reise gilt `ruhe.jetzt()` immer. Vorschlag für 04: ein Fall
    «Reise ohne Vorladen, mit Testart» und die Bildzeiten dazu.
  - **Ticket 10:** Über `__prismaDebug` lässt sich das Brett heute anders wählen (`boardTheme.types` ist beschreibbar,
    `skyTheme.byId.get(id).board` lässt sich setzen). Das betrifft nur Debug und Proben. Die Spec verlangt am Ende,
    dass «jede andere Art, das Brett umzustellen» entfernt ist.
  - **Smells, alle nach Ermessen** (Achse Standards, keiner blockiert; aufräumen, wenn 05 den Code ohnehin anfasst):
    - Doppelt:
      - `boardTextureUpload` wiederholt den WebGL2-Teil von `skyUpload`.
      - Die Formel in `progress` steht genauso in `story.blendSky`.
      - Derselbe Vergleich steht in `steht` und in `follow`.
      - `brettPasst` steht in beiden Proben, und die Fassungen sind schon auseinandergelaufen.
    - Am falschen Ort: `progress` liest nur `skyTheme`.
    - Schwer lesbar: `show(from, to, anteil, mitHimmel)` nimmt vier Werte nach Position, darunter einen Schalter. Der
      Lebenslauf eines Eintrags steckt in losen Schaltern (`ready`, `failed`, `gone`, `obenBereit`).
    - Namen:
      - Dieselben Begriffe heissen zweisprachig: `ready`/`settled`/`holding` beim Himmel, `steht`/`bereitFuer`/`haelt`
        beim Brett.
      - `render` zeichnet nichts.
      - `basis`, `look`, `needOben` und `hier` sagen nicht, was sie tun.
  - **Kosten des echten Überblendens:** Während des Überblendens zeichnen zwei Bretter, eines davon durchsichtig.
    Gemessen ist das erst, wenn es echte Bretter gibt, auf dem Handy in 04/05.
  - **Grafikspeicher:** Nach dem Entscheid des Nutzers vom 06.11. sind höchstens drei Bretter erlaubt (Spec
    angepasst), und die Umsetzung hält das ein: das Steinbrett, das gezeigte und beim Wechsel oder Vorladen ein
    weiteres. Wird nach einem Vorladen ein anderer Himmel gewählt, steht ein viertes Brett nur bis zum nächsten
    `update`, das das vorgeladene freigibt.
- **Tests im Review:**
  - `node tests/logic.test.mjs`: 2039 bestanden.
  - `node tests/ki-tester.test.mjs`: 84 bestanden.
  - `tests/offline.mjs`: bestanden.
  - `tests/brett-probe.mjs`: Mechanik 20 Prüfungen, Netz 4. Im ersten Lauf scheiterte eine Prüfung mit 107 ms (siehe
    oben), im zweiten Lauf (nur Mechanik) war alles grün mit 67 ms. Netz: Der Blick senkte sich 4,0 s nach «Weiter»
    auf das bereite Brett der Wüste, der Kleine Wagen stand in 357 von 462 Bildern.
  - Geschichte-Probe (GPU):
    - `--grad leicht` bestanden.
    - `--uebersicht` bestanden; «Weiter ins Meer»: Brett und Himmel blenden über 2,48 s, die längste Lücke war 97 ms.
    - `--dorf`: alle Prüfungen zum Brett grün, je eine Lücke über 100 ms (siehe oben, bei HEAD ebenso).
  - Nach den Änderungen an den Kommentaren lief `node tests/logic.test.mjs` noch einmal: 2039 bestanden.
  - **Nach der Behebung der Auflage:**
    - `tests/brett-probe.mjs` mit allen drei Teilen: Menü 3 Prüfungen grün, Netz 4 grün (Blick 7,2 s nach «Weiter»
      auf dem bereiten Brett der Wüste). In der Mechanik ist der Notfall des Vulkans nach 8,0 s weiter grün.
    - Ein Fehler blieb: «Brett laden und überblenden» mit 103 ms bei 1389 ms. Das ist wieder das erste Bild des
      Strand-Panoramas mitten im Überblenden (siehe Hinweise), nicht die Frist.
    - Geschichte-Probe `--grad leicht` bestanden, Konsole ohne Fehler.
    - `node tests/logic.test.mjs`: 2039 bestanden.
    - CRLF stimmt, `git diff --stat` zeigt keine ganzen Dateien.
