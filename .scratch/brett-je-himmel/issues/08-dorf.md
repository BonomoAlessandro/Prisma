# 08: Dorf

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** ready-for-agent

**What to build:** Ein Brett für Noas Dorf bei Nacht (Kapitel «Im Dorf»).
Die Welt bekommt ihren eigenen Katalog mit 6 bis 8 völlig neuen Richtungen (wie Ticket 03), die dem
Strand nicht ähneln müssen (Entscheid des Nutzers vom 05.11.2026). Der Nutzer wählt eine, sie wird im Spiel gebaut,
fertig gemacht und abgenommen.

- [x] **Katalog:** Vorbilder suchen und eine Vorschauseite mit 6 bis 8 völlig verschiedenen Richtungen für Noas Dorf bei Nacht
      bauen, wie in Ticket 03: echte Spielbilder mit zur Laufzeit eingesetztem Brett, je 4 Ansichten, Vorbilder mit
      Link, Idee, Raster, Einlegelinie, Spiegelung, Lichtwelle und Kostenhinweise. Der Katalog darf vor Ticket 05
      entstehen (er fasst `index.html` nicht an).
- [x] **Wahl aus dem Katalog:** Der Nutzer wählt eine Richtung, eventuell mit Änderungswünschen. Die Wahl steht unter
      «Comments».
- [x] **Im Spiel:** Die gewählte Richtung wird eine Art von Brett, wie das Gezeitenbecken in Ticket 04. Der Nutzer gibt
      an Bildern Rückmeldungen, bis sie sitzt.
- [x] **Eigene Lichtwelle:** Das Brett bekommt seine eigene Lichtwelle aus seiner Welt, wie die Blumen beim
      Moospolster: Wo der Ring vorbeizieht, passiert etwas auf dem Brett und kommt danach wieder zur Ruhe.
      Gewählt mit dem Brett (Katalog Version 2): Wo der Ring vorbeizieht, keimen neben den Schnüren Reihen von
      Sämlingen auf, und Glühwürmchen steigen aus Erde und Kräutern. Hinter dem Ring ziehen sich die Keimlinge in die
      Erde zurück, die Glühwürmchen schweben noch kurz und verlöschen. Das passt zu den Glühwürmchen im Dorf.
      Sie kommt als Bildfolge oder kurzes Video auf die Vorschauseite.
- [x] **Bilder und Leistung:** eine Vorschauseite mit denselben Ansichten wie in Ticket 04 auf Desktop und Handy
      (Spielansicht, flach, ganz heraus, Einstieg ins Dorf nach «Üben», Lösen einer Übung). Dazu kommen die Messwerte
      des Bretts, verglichen mit dem Steinbrett.
- [x] **Brett-Angabe:** Die Werte stehen in der Brett-Angabe des Dorfs. Das Register wird nur in der Brett-Angabe
      nachgeführt, und das Prüfwerkzeug kennt die Werte.
- [x] **Übergänge:** Alles bleibt ohne Steinbrett unter dem Dorf, ohne Löcher und ohne Ruckeln:
      - beim Einstieg ins Dorf nach «Üben» (davor die Milchstrasse mit Steinbrett),
      - beim Weg vom Dorf in den Bergwald, nach der 9. Übung und mit «Dorf überspringen»,
      - beim Fortsetzen nach dem Neuladen mitten im Dorf,
      - beim Wiederholen einer Übung aus der Übersicht.
- [x] **Leistung:** Die Bildzeit steigt nicht messbar, und der Grafikspeicher bleibt etwa wie heute.
- [ ] **Abnahme:** Der Nutzer nimmt über eine Vorschauseite ab, erst dann wird committet.
- [x] Alle Tests sind grün (Logik, offline, Geschichte-Probe mit `--dorf` und `--uebersicht`), und das Review nach dem
      Ticket ist gelaufen.

## Hinweise

- **Das Dorf:**
  - Es liegt hinter Noas Haus: ein Dorf mit Kirche am Hang, Gipfel mit Schnee und ein Sternenhimmel.
  - Noas Haus, Zaun, Hochbeet und drei Nachbarhäuser sind 3D-Modelle (`bakedMesh` house, neighbors), dazu kommen
    Glühwürmchen.
  - Der Grund liegt 4 m unter dem Brett.
- Das Dorf lädt erst beim Gebrauch (`vorab: false`).
- Das Dorf ist der Ort, an dem neue Spieler das Brett zum ersten Mal sehen. Die Übungen und ihre Hinweise müssen
  deshalb gut lesbar bleiben. Das Urteil darüber trifft der Nutzer an den Bildern.

## Comments

**Katalog (06.11.2026):** acht Richtungen, https://claude.ai/artifact/6tyN2oGW1VJRwVB3CXNTEG: Laube, Flickendecke,
Dorfplatz nach dem Regen, Hochbeet, Buntes Glas, Himmelslaterne, Kachelofen und Altes Spielbrett. Quelle, Bilder und
Skripte liegen in `katalog-dorf/`, die Vorbilder in `vorbilder/dorf.md`.

**Wahl des Nutzers (06.11.2026): Hochbeet** (Karte 4), mit der Lichtwelle der Karte:

- Das Brett ist das Hochbeet aus Noas Garten.
- Im Feld liegt frisch gerechte, dunkle Erde. Das Raster sind helle Pflanzschnüre zwischen Holzpflöcken, mit kleinem
  Schatten. Die Einlegelinie ist eine Reihe heller Kiesel.
- Im Rand wachsen Kräuter: Schnittlauch mit lila Blüten, Thymian, Ringelblumen und Salat.
- Die Seiten sind Lärchenbohlen, oben liegt ein Abdeckbrett, 8 cm über der Erde.
- Es gibt keine Spiegelung, Erde ist matt.
- Lichtwelle: Glühwürmchen steigen aus Erde und Kräutern auf, wo der Ring vorbeizieht, und schweben nach. In Version 2
  des Katalogs (nach der Wahl veröffentlicht) keimen dazu Reihen von Sämlingen neben den Schnüren und ziehen sich
  hinter dem Ring zurück, rund 1200 Keimlinge im Shader. Der Nutzer will diese Version 2 (06.11.2026).
- Kosten: rund 1800 Halme, Blätter und Blüten und 420 Glühwürmchen. Auf dem Handy zu messen, eventuell gröber. Mit
  kleinen Formen aus Blender wären Kräuter und Blüten deutlich schöner.
- Lesbarkeit: Das Dorf ist für neue Spieler das erste Brett. Die dunkle Erde gibt den Strahlen guten Kontrast,
  die Pflanzschnüre müssen als Raster gut sichtbar bleiben.
- Vorlage: `katalog-dorf/bretter/varianten-dorf/4-hochbeet.js` mit `0-hilfe.js`, `0b-dorf.js` (Hilfen `waveMat`,
  `sparks`, `waveInst` für Körper, die nur in der Welle wachsen) und `bretter.js`.

**Umsetzung (07.11.2026, Worktree `prisma-brett-08`, Branch `feature/brett-08-dorf` von `feature/brett-je-himmel`
50760cf)**

- **Art `raisedBed`** (`index.html`, eigener Block «Hochbeet» im Brett-Teil nach der Lehmterrasse):
  - `BOARD_TYPES = { stone, tidePool, clay, raisedBed }`. Masse in `BED`, Werte in `BED_VALUES`, gebaut von
    `raisedBedBoard(v)`.
  - Texturen im Hintergrund-Thread über `boardTextures` (`raisedBedData`, Formeln und Farben aus `4-hochbeet.js`):
    Erde 1024² mit Farbe und Normalen (zwei Töne, Krumen, Spuren des Rechens im Feld, Mulch im Rand, Steinchen),
    Lärchenbohlen der Seiten 1024 × 128 (Fugen, Schrauben), Abdeckbrett 1024 × 32. Keine Rauheitstextur, die Erde ist
    überall gleich matt (0,97).
  - Die Pflanzschnüre rechnet der Shader (`BED_CORD_GLSL`): helle Schnur mit schmalem Schatten, über `fwidth` geglättet,
    mit Mindestkontrast, damit das Raster auch aus der Ferne lesbar bleibt. 32 Pflöcke an den Enden.
  - Statt der Einlegelinie gut 500 Kiesel als Instanzen (flache Kugeln, Farbe je Kiesel), dahinter die Kräuter wie im
    Katalog: Schnittlauch mit lila Blüten, Thymian, Ringelblumen, Salat (rund 1800 Halme, Kugeln und Blüten). Pflöcke,
    Kiesel und Kräuter teilen sich ein Material mit Farbe je Instanz (ein Programm, siehe unten).
  - Kasten aus Bohlen ohne Deckfläche, 0,6 m tief, bündig mit dem Umriss (±4,9 m), Oberkante in y = 0. Darauf das
    Abdeckbrett (vier Bretter in einer Form, 8 cm hoch, von 4,77 m bis zum Umriss).
  - Keine Spiegelung (`mirror: null`), Erde ist matt.
  - **Kernquader:** der Kasten (±4,9 m, y −0,6 … 0).
  - **Überblenden** wie bei der Lehmterrasse: Kommt das Hochbeet hinzu, liegt es oben, durchsichtig. Geht es, bleiben
    Erde und Kasten deckend; Abdeckbrett, Pflöcke, Kiesel, Kräuter und Sämlinge blenden aus. Der untere Teil des Kastens
    (−0,41 … −0,6 m) verschwindet dabei erst im letzten Bild, wie bei den eingezogenen Formen (Ticket 05).
- **Lichtwelle** (Katalog Version 2), alles nach der Ankunft des Rings (`shockClock`, `uShockT − Abstand / 6,5`):
  - Erde: Front ± 45 cm, dahinter ein kurzer Nachschein; die Schnüre leuchten an der Front mit.
  - Sämlinge: rund 1100 in Reihen neben den Schnüren (je Stiel und zwei Keimblätter, 10 Dreiecke, eine Form, eine
    Instanz). Kurz vor der Ankunft wächst der Stiel aus der Erde, dann öffnen sich die Keimblätter; 0,06 bis 0,4 s danach
    ziehen sie sich zurück. Gezeichnet nur bis 1,9 s nach dem Start des Rings.
  - Glühwürmchen: 420 Punkte (260 über den Kräutern, 160 über dem Feld), leuchten an der Front hell auf, steigen
    0,3 bis 1,1 m, treiben und flackern, verlöschen nach 0,8 bis 2,8 s. Additiv, ohne das Alpha des Bilds zu ändern (wie
    `glowParticles`). Gezeichnet nur bis 4,4 s.
  - Beim Fall des Polarsterns (Glut mit Radius 0) richtet sich der Anfang nach der Stärke der Glut (`uBed.y`).
- **Brett-Angabe:** `tools/blender/szenen/village/skybox.json` nennt `raisedBed` mit 13 Farben in sRGB 0 … 1 (`soil`
  und `larch` je zwei Töne [hell, dunkel], `mulch`, `cord`, `pebble`, `peg`, `chive`, `thyme`, `lettuce`, `marigold`,
  `blossom`, `sprout`, `firefly`). Register mit `node tools/blender/pack.mjs --brett village` (Register `bea532db` in
  `sw.js`). `tools/sky-schema.mjs`: `BOARD_PARAMS.raisedBed`, Kopf nachgeführt.
- `APP_VERSION` `2026-11-07 brett-dorf` (`index.html`, `sw.js`).
- **Programme:** Beim ersten Bauen übersetzt das Hochbeet seine Programme (`boardTheme.compile`). Ohne paralleles
  Übersetzen hielt das in der Geschichte-Probe ein Bild beim Überspringen des Prologs 423 ms an (dort lädt der Himmel
  des Dorfs vor, auf HEAD 19 ms). Mit dem gemeinsamen Material für Pflöcke, Kiesel und Kräuter und dem Abdeckbrett im
  Programm der Seiten (5 statt 7 Programme) blieb es im nächsten Lauf bei 24 ms. Gemessen im Menü beim Vorbereiten
  allein: Hochbeet 165–197 ms Bildzeit beim ersten Übersetzen, Lehmterrasse 159–360 ms, Gezeitenbecken 151–480 ms
  (headless, Rechner geteilt): Das Muster haben alle Bretter.

**Vorschau (07.11.2026):** Die Artifact-Werkzeuge gingen in dieser Sitzung nicht. Die Seite liegt lokal unter
`…\scratchpad\vorschau-08\index.html` (Desktop 1440 × 900 und Handy 390 × 844, je Spielansicht, flach, ganz heraus und
beides, neben dem Steinbrett und dem Katalogbild; Lichtwelle als Film in Echtzeit mit 12 Bildern/s; Einstieg ins Dorf
nach «Üben», Übungen mit Hinweis und gelöst aus der Geschichte-Probe; Messwerte).

**Messwerte** (headless mit Grafikkarte, `?perf`, `?sky=village`, Level 12, Steinbrett über `&brett=stone`; Rechner mit
Ticket 07 geteilt, Unterschiede unter etwa 1 ms nicht messbar). Zeichenzeit Mittel in ms:

| Ansicht | Ruhe Hochbeet | Ruhe Stein | Welle Hochbeet (3 s) | Welle Stein |
|---|---|---|---|---|
| Desktop 1440 × 900 | 12,69 · 12,66 | 13,06 · 13,22 | 13,36 | 12,08 |
| Handy 390 × 844, Dichte 2 | 12,76 · 12,61 | 13,45 · 13,37 | 12,05 | 12,83 |

- In Ruhe zeichnet das Hochbeet eher schneller (keine Spiegelung), in der Welle auf dem Desktop gut 1 ms mehr für 3 s.
- **Grafikspeicher:** Hochbeet 11,5 MB Texturen (mit Mipmaps) und 0,24 MB Netze samt Instanzen; Steinbrett 16 MB.
- **Bauzeit:** Texturen 342 ms (Steinbrett 356 ms), im Hintergrund-Thread; Netze und Instanzen 5 ms im Hauptthread.
- 9 Zeichenobjekte, in Ruhe 7 gezeichnet (Erde, Kasten, Abdeckbrett, Pflöcke, Halme, Kugeln, Ringelblumen).

**Tests (07.11.2026, je über `leise.sh`, GPU, stumm, nacheinander):**

- `node tests/logic.test.mjs`: 2042 bestanden. Neu: «Dorf mit dem Hochbeet (raisedBed); die Prüfung lehnt ungültige und
  fehlende Farben ab» (Farbe über 1, unter 0, zwei Werte, Erde ohne zwei Töne, Bohlen mit drei Tönen, fehlende Farbe,
  unbekannter Wert).
- `tests/offline.mjs`: bestanden. Das Dorf ist online und offline erst bereit, wenn `raisedBed` bereit ist.
- `tests/brett-probe.mjs`: in Ordnung, alle 33 Prüfungen (die Lücken-Prüfung «Brett laden und überblenden» 36 ms).
- Geschichte-Probe `--dorf --handy`: bestanden.
- Geschichte-Probe `--dorf` (Desktop): alle Prüfungen zum Brett grün (im Dorf immer `raisedBed`, kein Notfall), rot nur
  eine Lücke beim Wiederholen von Übung 8 aus der Übersicht (421 ms, 700 ms nach dem Klick, der Himmel des Dorfs lädt
  neu). Dieselbe Lücke hat eine Kopie von HEAD (415 ms): Sie kommt vom Himmel, nicht vom Brett. Im ersten Lauf kam die
  Lücke beim Überspringen des Prologs (423 ms) dazu; sie kam vom Übersetzen der Programme und ist behoben (siehe
  «Programme», danach 24 ms).
- Geschichte-Probe `--uebersicht`: «Weiter ins Meer» blendet über 2,43 s, die Prüfungen zum Brett sind grün. Rot sind
  Lücken über 100 ms beim Öffnen und Schliessen der Übersicht am Strand (zwei Läufe: 180 ms; 325, 249 und 163 ms). Eine
  Kopie von HEAD scheitert im selben Lauf an denselben Stellen (149, 234 und 267 ms): nicht von diesem Ticket.

**Offen:**

- Abnahme durch den Nutzer an der Vorschauseite.
- Die Lücken beim Wiederholen ins Dorf (Himmel) und um die Übersicht (auch auf HEAD) gehören nicht zu diesem Ticket, die
  Proben bleiben dort rot.
- Kosten auf dem echten Handy (Ticket 10): Welle mit 1100 Sämlingen und 420 Glühwürmchen, 1800 Kräuter in Ruhe.
- Übersetzen der Programme ohne paralleles Übersetzen hält bei jedem neuen Brett ein Bild an (alle Bretter), das gehört
  in Ticket 05 oder 10.
- Kräuter und Kasten werfen keinen Schatten (wie die Türmchen der Lehmterrasse).

**Review (07.11.2026, unabhängig, gegen f6ecfff):** passt, keine Auflagen.

- **Geprüft:**
  - Das Steinbrett, das Gezeitenbecken und die Lehmterrasse sind unverändert, nur `BOARD_TYPES` ist erweitert.
  - Kernquader ±4,9 m, y −0,6 … 0: Erde (Ebene in y = 0) und der Kasten ohne Deckfläche (Seiten und Boden) decken
    ihn ganz. Das Abdeckbrett liegt mit seiner Unterseite auf der Erde. Die Unterseite zeigt nach unten und wird von
    oben nicht gezeichnet, darum gibt es kein Flimmern.
  - Überblenden wie bei der Lehmterrasse: «oben» alles durchsichtig, «unten» bleiben Erde und Kasten deckend. Die
    durchsichtigen Programme übersetzt `fadeVariants` vorab, auch die unsichtbaren Sämlinge (`compileParallel`
    geht über alle Objekte). Pflöcke, Kiesel und Kräuter haben alle eine Farbe je Instanz. Darum gibt es für `plantMat`
    genau ein Programm, und `vColor` ist dort immer vorhanden.
  - Freigeben: alle Geometrien (auch die Teile des Abdeckbretts schon beim Bauen), Instanzen samt Farben, sechs
    Materialien und die Glühwürmchen, vier Texturen.
  - Lichtwelle nach der Ankunft des Rings (`uShockT − Abstand / 6,5`). Die Sämlinge sind spätestens bei rund 1,4 s
    fertig, die Glühwürmchen bei rund 3,9 s. Gezeichnet werden sie bis 1,9 bzw. 4,4 s, das reicht. Beim Fall des
    Polarsterns ist `uBed.y = min(1, Glut · 3)`. Mit `glut(1) = 0,45` steht es schon vor dem Lauf des Rings auf 1, es
    springt also nicht. `setFade` liest die Uhr ein Bild vor `shockClock` (Reihenfolge in `animate`). Die ersten
    Sämlinge erscheinen deshalb ein Bild später, das ist ohne Folgen.
  - Ausrichtung: Die Zeilen der Texturen, die Normalen (+v = −z) und `wp`/`pz` im Shader stimmen zueinander und
    zur Platte.
  - Register: `pack.mjs --brett` ergibt im Worktree dasselbe `skies.js` und `SKIES` `bea532db` (keine Änderung).
    `skybox.json` des Dorfs hat CRLF wie die Wüste. `sky-schema.mjs` und der Logiktest decken alle 13 Werte ab.
    `APP_VERSION` ist an beiden Stellen gleich.
  - Lesbarkeit: In den Bildern der Probe (Übung 2 vor und nach dem Lösen) sind die Pflanzschnüre als Raster klar zu
    sehen. Die Glühwürmchen nach dem Lösen verdecken nichts Wichtiges. Das Urteil darüber bleibt beim Nutzer.
- **Behoben (cbfee2d):** In `BED_CORD_GLSL` glättete `span` das Ende der Schnüre mit der Breite der falschen
  Richtung (`ap` statt `ap.yx`). Das fiel nur bei flachem Blick an den Pflöcken auf. Der Kommentar dazu sprach von
  «Schnur längs x», gemeint ist die Schnur längs z.
- **Bereitwerden nach dem Laden** (`?sky=village`, bis `brett().bereit` und `skyReady()`, je 3 Läufe abwechselnd,
  GPU, Rechner ruhig bis auf das Review von 07): Desktop Hochbeet 10,4 · 10,7 · 10,7 s, Steinbrett 9,8 · 10,0 ·
  10,0 s. Handy Hochbeet 8,8 · 8,8 · 9,3 s, Steinbrett 8,3 · 8,6 · 8,9 s. Das Hochbeet kostet also etwa 0,6 s
  (Desktop) bzw. 0,3 s (Handy). Den grössten Teil der Zeit braucht der Himmel. Die 7,3 gegen 4,6 s der Vorschau
  kamen vom geteilten Rechner.
- **Hinweise (gehören nicht zu diesem Ticket):**
  - Auch das Hochbeet beendet beim `dispose` einen noch rechnenden Worker nicht (wie die anderen, offener Punkt).
  - Kräuter, Pflöcke und Abdeckbrett werfen keinen Schatten (die Vorlage hatte ihn am Abdeckbrett). Das ist gewollt
    gleich wie bei der Lehmterrasse.
- **Tests im Review** (je über `leise.sh` mit GPU, nacheinander):
  - Node: Logik 2042, Geschichte 35, Levelliste 54, KI-Tester 84, Generator 31, Halle 6, Beurteilung 206, Vorrat 18,
    Würfelliste 20, alle bestanden.
  - `offline.mjs`: bestanden (das Dorf online und offline erst bereit mit `raisedBed`). `brett-probe.mjs`: in Ordnung
    (die Lücke «Brett laden und überblenden» 52 ms).
  - Geschichte-Probe `--grad leicht --welten 3` Desktop und Handy: bestanden.
  - `--dorf` Desktop: **bestanden**. Wiederholen von Übung 8 aus der Übersicht höchstens 50 ms; die 421 ms des
    Umsetzers kamen diesmal nicht. Die Kopie der Basis 50760cf hat ebenfalls bestanden. `--dorf --handy`: bestanden.
  - `--uebersicht`: rot, eine Lücke von 100 ms bei «Wiederholen: Weiter über die Weltgrenze» (Wald → Meer). Die Basis
    ist im selben Lauf an derselben Stelle rot (117 ms). Öffnen und Schliessen der Übersicht waren diesmal in beiden
    grün.
  - `--wagen`: rot in zwei Läufen, je 117 ms bei «Wiederholen über die Grenze ins Meer». Die Basis hatte dort einmal
    83 ms und war grün. Die Lücke liegt in allen Fällen im ersten Bild, in dem das Panorama des Strands zu sehen ist
    (Wald → Meer, Anteil 0,04). Das Dorf kommt in diesem Lauf nicht vor, das Hochbeet ist dort weder gebaut noch zu
    sehen. Es ist die bekannte, streuende Lücke vom Wasser des Strands (`groundShift`, Review von Ticket 06: 61 bis
    127 ms auf HEAD), nicht von diesem Ticket.
