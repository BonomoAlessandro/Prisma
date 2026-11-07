# 07: Bergwald

**Spec:** ../spec.md

**Blocked by:** 06

**Status:** ready-for-agent

**What to build:** Ein Brett für den Bergwald.
Die Welt bekommt ihren eigenen Katalog mit 6 bis 8 völlig neuen Richtungen (wie Ticket 03), die dem
Strand nicht ähneln müssen (Entscheid des Nutzers vom 05.11.2026). Der Nutzer wählt eine, sie wird im Spiel gebaut,
fertig gemacht und abgenommen.

- [x] **Katalog:** Vorbilder suchen und eine Vorschauseite mit 6 bis 8 völlig verschiedenen Richtungen für den Bergwald
      bauen, wie in Ticket 03: echte Spielbilder mit zur Laufzeit eingesetztem Brett, je 4 Ansichten, Vorbilder mit
      Link, Idee, Raster, Einlegelinie, Spiegelung, Lichtwelle und Kostenhinweise. Der Katalog darf vor Ticket 05
      entstehen (er fasst `index.html` nicht an).
- [x] **Wahl aus dem Katalog:** Der Nutzer wählt eine Richtung, eventuell mit Änderungswünschen. Die Wahl steht unter
      «Comments».
- [x] **Im Spiel:** Die gewählte Richtung wird eine Art von Brett, wie das Gezeitenbecken in Ticket 04. Der Nutzer gibt
      an Bildern Rückmeldungen, bis sie sitzt.
- [x] **Eigene Lichtwelle:** Das Brett bekommt seine eigene Lichtwelle aus seiner Welt, wie die Blumen beim
      Moospolster: Wo der Ring vorbeizieht, passiert etwas auf dem Brett und kommt danach wieder zur Ruhe.
      Die Karte zeigt sie schon: Wo der Ring vorbeizieht, blühen kleine weisse Blumen auf und welken wieder, und
      die Helmlinge leuchten auf. Genau diese Lichtwelle hat den Nutzer begeistert, sie ist das Vorbild für alle Bretter.
      Sie kommt als Bildfolge oder kurzes Video auf die Vorschauseite.
- [x] **Bilder und Leistung:** eine Vorschauseite mit denselben Ansichten wie in Ticket 04 auf Desktop und Handy
      (Spielansicht, flach, ganz heraus, Fall des Lichts beim Einstieg in den Bergwald nach dem Prolog, Lösen). Dazu
      kommen die Messwerte des Bretts, verglichen mit dem Steinbrett.
- [x] **Brett-Angabe:** Die Werte stehen in der Brett-Angabe des Walds. Das Register wird nur in der Brett-Angabe
      nachgeführt, und das Prüfwerkzeug kennt die Werte.
- [x] **Übergänge:** Alles bleibt ohne Steinbrett, ohne Löcher und ohne Ruckeln:
      - beim Einstieg in den Bergwald nach dem Prolog («Gleich los») und nach «Im Dorf» (das Dorf vorerst mit
        Steinbrett),
      - auf der Reise vom Bergwald ans Meer,
      - beim Wiederholen über diese Weltgrenze.
- [x] **Leistung:** Die Bildzeit steigt nicht messbar, und der Grafikspeicher bleibt etwa wie heute.
- [ ] **Abnahme:** Der Nutzer nimmt über eine Vorschauseite ab, erst dann wird committet.
- [ ] Alle Tests sind grün (Logik, offline, Geschichte-Probe auch mit `--dorf`). Offen: `--wagen`, siehe Review.
- [x] **Review:** Das Review nach dem Ticket ist gelaufen.

## Hinweise

- **Der Wald:**
  - Nahe Fichten als 3D-Modelle (`toonInstances`), Glühwürmchen (`glowParticles`) und Nebelschleier (`mistSheets`).
  - Der Pinselfilter ist im Wald auf Wunsch des Nutzers aus.
  - Unter dem Brett war früher ein Loch im Himmel, inzwischen behoben (PLAN 2.37). Mit dem Kernquader prüfen, dass es
    nicht wiederkommt.
- **Budget:** Der Wald wird vorab gespeichert. Eine Form aus Blender zählt deshalb zur Grenze von 4,5 MB. Reicht der
  Platz nicht, fragen wir den Nutzer.
- Der Wald ist der erste Himmel der Geschichte. Er lädt hinter der Bühne des Prologs, und das Angebot wartet bis zu 8
  Sekunden auf ihn. Das Brett muss in dieser Zeit mit fertig werden.

## Comments

**Katalog (06.11.2026):** acht Richtungen, https://claude.ai/artifact/NxHnBEMttQfErbf32u96zJ: Baumscheibe, Moospolster,
Granitblock mit Flechten, Kerbschnitt und Bauernmalerei, Fliegenpilz, Wurzelgeflecht, Papierlaterne und
Scherenschnitt. Quelle, Bilder und Skripte liegen in `katalog-wald/`, die Vorbilder in `vorbilder/wald.md`.

**Wahl des Nutzers (06.11.2026): Moospolster** (Karte 2), «super», ohne Änderungswünsche:

- Das Brett ist ein Stück Waldboden, das sich gelöst hat.
- Das Feld ist kurzes, samtiges Moos wie im Moostempel von Kyoto. Das Raster sind Linien aus hellem Silbermoos, eine
  Einlegelinie gibt es nicht, die Polster beginnen am Feld.
- Im Rand liegen dicke Moospolster mit leuchtenden Helmlingen, an den Ecken wächst Farn.
- Die Seiten sind eine Erdscholle mit Steinen, darunter hängen Wurzeln.
- Es gibt keine Spiegelung.
- Die Lichtwelle ist wie beim Waldgott in «Prinzessin Mononoke»: Wo der Ring vorbeizieht, blühen kleine weisse Blumen
  auf und welken hinter ihm wieder, und die Helmlinge leuchten auf.
- Kosten: Polster, Pilze, Farn und Blumen sind rund 2100 kleine Körper in wenigen Gruppen, dazu 70 Wurzeln. Das muss
  auf dem Handy gemessen werden, eventuell mit weniger und grösseren Teilen.
- Vorlage: `katalog-wald/bretter/varianten-wald/2-moos.js` mit `0-hilfe.js`, `0-wald.js` und `bretter.js`. Übernommen
  werden Formeln und Farben, nicht der Aufbau.

**Umsetzung (07.11.2026, Worktree `prisma-brett-07`, Branch `feature/brett-07-wald` von `feature/brett-je-himmel`
50760cf; Abnahme durch den Nutzer und Review offen)**

- **Art `moss`** (`index.html`, eigener Block «Moospolster» nach der Lehmterrasse): `BOARD_TYPES = { stone, tidePool,
  clay, moss }`, Masse und Mengen in `MOSS`, Werte in `MOSS_VALUES`, gebaut von `mossBoard(v)`.
  - Texturen im Hintergrund-Thread über `boardTextures` (`mossData`, Formeln und Farben aus `2-moos.js`, Höhen
    ungerundet): Feld 1024² Farbe und Normalen, Erdscholle 2048 × 128, Moos der Polster 512² (im Gitter periodisch,
    nahtlos wiederholt). Keine Rauheit (überall 1), keine Spiegelung (`mirror: null`).
  - Raster aus Silbermoos über `FLOOR_DETAIL_GLSL` mit breiterer Linie (`lw` 0,0075). Greift der Ersatz nicht mehr,
    wirft `build` (Steinbrett als Notfall) statt still falsch zu zeichnen. Keine Einlegelinie.
  - Erdscholle bündig unter der Oberfläche ohne Deckfläche (wie das Gezeitenbecken), Kernquader wie beim Steinbrett.
  - Instanzen: 420 Polster (Halbkugeln, Lambert, ohne Schatten), rund 70 Helmlinge mit Stielen, 59 Farnwedel (Form im
    Fragment-Shader, `MOSS_FROND_GLSL`, ohne Bild), 70 Wurzeln in einem Netz (`mossRoots`). Die Polster ragen höchstens
    5 cm über den Umriss, die Farnwedel an den Ecken wie im Katalog bis rund 0,7 m.
  - Überblenden wie die Lehmterrasse (`fest`, `oben`, `unten`): Oberfläche und Scholle bleiben deckend, Polster, Pilze,
    Farn und Wurzeln blenden aus, die Blumen stehen nur ohne Überblenden.
- **Lichtwelle (Waldgott):** alles nach der Ankunft des Rings (`uShockT − Abstand / SHOCK_SPEED`), nicht nach seiner
  Stärke.
  - 1500 Blumen (Waldsauerklee, `mossFlowers`): ein Zeichenaufruf, Form im Fragment-Shader. Sie öffnen sich beim Ring,
    leuchten kurz, welken 0,15 bis 0,65 s danach (schmaler, braun, kleiner). Gezeichnet nur bis 2,2 s nach dem Start.
  - Helmlinge leuchten mit der Ankunft hell grün auf und klingen in gut 1 s ab.
  - Über das Moos läuft an der Front ein grünlich-goldener Schein, der kurz nachglimmt.
- **Brett-Angabe:** `forest/skybox.json` mit 13 Farben in sRGB (`moss`, `soil`, `root`, `fern`, `flower` je zwei Töne).
  Werte, die im Katalog linear standen (Silbermoos im Shader, Leuchten der Pilze, Farbe der Wurzeln), sind nach sRGB
  umgerechnet. `BOARD_PARAMS.moss` in `tools/sky-schema.mjs`, Register mit `pack.mjs --brett forest` (`SKIES`
  `37507eee`). `APP_VERSION` `2026-11-07 brett-wald`.
- **Proben:** Die Mechanik der `brett-probe` nimmt dem Wald nach dem Start die Brett-Angabe (sie rechnet mit nur dem
  Steinbrett und den Brettern der Probe), die Startprüfung vergleicht die Art mit dem Register.

**Vorschau (07.11.2026):** Die Artifact-Werkzeuge waren in der Sitzung des Umsetzers nicht verfügbar. Die Seite liegt
lokal (Ordner `vorschau` im Scratchpad der Sitzung, an den Koordinator gemeldet): Desktop 1440 × 900 und Handy
390 × 844 (Pixeldichte 2), je Spielansicht, flach, ganz heraus und beides neben dem Steinbrett, das Katalogbild, die
Lichtwelle und der Fall des Lichts nach dem Prolog als Filme in Echtzeit (12 Bilder/s), die Messwerte.

**Messwerte** (headless mit Grafikkarte, Messwerkzeug, Level 41 im Wald, Steinbrett über `?brett=stone`; je zwei
Läufe; Welle angehalten):

- **Zeichenzeit (GPU) Desktop:** Ruhe 13,84 · 13,87 ms gegen 13,86 · 13,80 (Stein); Welle 0,3 s 14,33 · 14,32 gegen
  13,92 · 13,78; 0,8 s 14,32 · 14,36 gegen 13,70 · 13,89. Die Welle kostet rund 0,5 ms.
- **Handy** (390 × 844, Dichte 2, CPU 4×): Ruhe 13,0 · 13,4 ms gegen 16,2 · 18,9; Welle 13,5 bis 14,6 gegen 15,6 bis
  19,2. Billiger als das Steinbrett, weil nichts gespiegelt wird.
- **Erster Stand** mit den Polstern als MeshStandardMaterial mit Schatten: 17,0 ms am Desktop (+3,2 ms). Gemessen durch
  Ausblenden je Teil: Polster rund 4 ms, Feld 1,5, Farn 1, der Rest je unter 0,5. Mit Lambert und ohne Schatten auf den
  Polstern gleich wie das Steinbrett, das Aussehen fast gleich.
- **Grafikspeicher:** Texturen 13,3 MB (Steinbrett 16,0), Netze und Instanzen 0,3 MB.
- **Bauzeit:** im Hauptthread 5 bis 14 ms am Desktop, 25 bis 47 ms mit CPU 4× (Steinbrett 1 bis 4 bzw. 5 bis 14). Das
  Rechnen im Hintergrund bis berechnet 0,49 s (Stein 0,40), bis bereit 0,67 s (0,60); mit CPU 4× 0,65 bis 0,85 s bzw. 0,8
  bis 1,0 s.
- **Prolog:** Beim Einstieg nach dem Prolog («Gleich los») ist das Moospolster bereit, wenn das Licht hält (Desktop 8,1 s,
  Handy 6,1 s nach «Gleich los», ohne Notfall); der Blick senkt sich auf das bereite Brett.

**Tests (07.11.2026):**

- `node tests/logic.test.mjs`: 2042 bestanden. Neu: «Bergwald mit dem Moospolster (moss); die Prüfung lehnt ungültige
  und fehlende Farben ab».
- `tests/offline.mjs`: bestanden, der Wald meldet online und offline `moss`.
- `tests/brett-probe.mjs`: alle Teile bestanden. Mechanik (Lücke «Brett laden und überblenden» 53 ms), Netz, Menü,
  Reise (Wald mit Moospolster → Meer ohne Vorladen, längste Lücke 60 ms).
- Geschichte-Probe `--grad leicht --welten 2` und `--dorf` (GPU): bestanden, Konsole ohne Fehler.

**Offen und Fragen an den Nutzer:**

- Die Farnwedel an den Ecken ragen wie im Katalog bis rund 0,7 m über den Umriss (Spec: Form innerhalb des Umrisses).
  Im Wald hängt daran nichts (keine Fische, kein Pinselfilter); so lassen oder kürzen?
- Die Polster sind matter als im Katalog (Lambert statt MeshStandardMaterial, ohne Schatten), das kostete sonst 3 ms.
- Bauzeit im Hauptthread bis 47 ms auf dem gedrosselten Handy (Instanzen, Wurzeln, Blumen): beim Laden hinter dem
  Prolog, auf dem Poco messen (Ticket 10).
- Überblenden vom Steinbrett («Im Dorf» → Bergwald): Polster, Farn und Wurzeln blenden mit ein, die Wurzeln hängen unter
  dem Steinbrett schon während des Überblendens (Ticket 05).

**Entscheide des Nutzers (07.11.2026)** zu den Fragen des Umsetzers:

- Die Farnwedel an den Ecken, die bis rund 0,7 m über den Umriss ragen, bleiben so, wie sie jetzt sind.
- Die matteren Polster (Lambert statt MeshStandardMaterial) sehen so gut aus und bleiben.

**Review (07.11.2026, unabhängig, fe12497 gegen 50760cf):** Der Code passt, keine Kleinigkeit zu beheben. Eine
Auflage für den Umsetzer: die Lücke beim Wiederholen über die Grenze ins Meer (`--wagen`).

- **Auflage: Lücke «Wagen: Wiederholen über die Grenze ins Meer»** (Geschichte-Probe `--wagen`, Desktop):
  - Mit dem Moospolster scheiterte sie in drei von drei Läufen: 107, 133 und 106 ms. Die Basis 50760cf als Kopie (Wald
    mit Steinbrett) bestand zweimal mit 89 und 88 ms. Gemessen wurde abwechselnd auf demselben Rechner.
  - Die Lücke liegt in beiden Fassungen am selben Bild: Es ist das erste Bild des Strand-Panoramas (`shown` wechselt
    auf `beach`, `w` 0,03 bis 0,045, `anteil` des Bretts 0,51 bis 0,52). Das ist die bekannte Stelle mit `groundShift`
    im Wasser des Strands (Review Ticket 06). Das Moospolster legt dort gut 20 bis 40 ms drauf.
  - Am Zeichnen der Polster, Pilze, Farne und Wurzeln liegt es nicht: In einer Kopie, die sie beim Ausblenden (`unten`)
    ganz verbirgt, waren es 125 ms. Vermutlich liegt es am Hauptthread, etwa an einer Speicherbereinigung (rund 12 MB
    Texturdaten bleiben im JS-Speicher, dazu die Listen der Instanzen) oder an etwas, das beim Ausblenden des
    Moospolsters erst in diesem Bild anfällt.
  - Vorschlag: In der Probe dieses Bild mit einem Profil aufzeichnen und mit der Basis vergleichen. Danach entscheiden,
    ob es am Brett liegt oder ob die Stelle im Strand (`groundShift` in Häppchen) für alle Bretter behoben werden muss.
- **Hinweis Bauzeit:** `mossBoard` baut alle Instanzen, Wurzeln und Blumen synchron in `acquire`, mit CPU 4× bis 47 ms
  (Messung des Umsetzers). Beim Prolog fällt das beim Laden der Seite an, unkritisch. Beim Vorladen aus dem Dorf
  (`--dorf`, «Gelöst») ist es ein Bild. Die Probe mass dort höchstens 53 ms, beim Laden des Walds hinter dem Angebot
  88 ms. Auf dem Poco messen (Ticket 10). Sonst lassen sich die Listen im Worker rechnen.
- **Geprüft, in Ordnung:**
  - Steinbrett, Gezeitenbecken und Lehmterrasse sind unverändert, nur `BOARD_TYPES` ist erweitert. Der Kernquader ist
    wie beim Steinbrett. Oberfläche (y = 0) und Erdscholle (Box ohne Deckfläche, Boden bleibt, ±PLATE/2,
    y 0 … −PLATE_THICK − 0,03) decken ihn ganz.
  - **Worker:** `mossData` ist in sich geschlossen (eigenes hash, noise, fbm, ohne helpers). Die Werte kommen ohne
    `type` an. Die Schlüssel stimmen mit den specs von `boardTextures` überein. Die Normalen haben dieselbe Konvention
    wie das Gezeitenbecken. Die Zeilen von Feld und Scholle passen zu den UVs von PlaneGeometry und BoxGeometry. Das Moos
    der Polster ist periodisch (`repeat` 3 × 2, ganzzahlig über die Naht der Kugel), `RepeatWrapping` setzt der Bau vor
    dem Hochladen, und `boardTextureUpload` übernimmt es.
  - **Lichtwelle:**
    - Blumen, Helmlinge und Schein richten sich nach der Ankunft (`uShockT − Abstand / SHOCK_SPEED`), auch beim
      langsameren Ring der Geschichte.
    - Das Viereck der Blumen zeigt nach oben (Vorderseite). Ausserhalb des Fensters liegt es hinter der Bildebene
      (z = 2).
    - In Ruhe sind die Blumen aus (`flowerEnd` 2,2 s, die letzte welkt bei rund 1,8 s). Schein und Helmlinge stehen
      hinter einer Bedingung auf `uShockT`.
    - `follow` läuft vor `shockClock`. Die Blumen gehen deshalb ein Bild später an und aus, das ist unsichtbar.
  - **Übersetzen:** `compileParallel` übersetzt auch Unsichtbares (Blumen), die Fassung `oben` deckt auch die
    durchsichtigen Teile von `unten`. Das Ersetzen der Rasterbreite wirft, statt still falsch zu zeichnen. Das wird ein
    Notfall mit Warnung.
  - **Freigeben:** Freigegeben werden alle Geometrien (auch Instanzen, Wurzeln und Blumen), sieben Materialien und das
    der Blumen sowie vier Texturen samt den eigenen WebGL-Texturen.
  - **Daten:**
    - `MOSS_VALUES` und `BOARD_PARAMS.moss` nennen dieselben 13 Werte, alle werden benutzt.
    - `pack.mjs --brett` neu gerechnet: `skies.js` und `SKIES` `37507eee` bleiben unverändert, neu ist nur `board` des
      Walds. `APP_VERSION` ist an beiden Stellen gleich.
    - Zeilenenden sind CRLF in der Arbeitskopie, `skies.js` bleibt LF (`-text`).
  - Die `brett-probe` liest die Art des Walds aus dem Register und nimmt ihm danach die Brett-Angabe. Das Moospolster
    wird frei, sobald das Steinbrett steht (`built.size === 1`).
  - Kommentare und Stil passen zum Code um sie herum (Aufbau wie `clayBoard`).
- **Tests im Review:**
  - Node: Logik 2042, Geschichte 35, Levelliste 54, KI-Tester 84, Generator 31, Halle 6, Beurteilung 206, Vorrat 18,
    Würfelliste 20, alle bestanden.
  - Offline: bestanden, der Wald meldet online und offline `moss`.
  - `brett-probe`: alle Teile bestanden. Start mit dem Moospolster. «Brett laden und überblenden» 35 ms, Reise ohne
    Vorladen ans Meer 36 ms.
  - Geschichte-Probe `--grad leicht --welten 3`, Desktop und `--handy`: beide bestanden, die Konsole ohne Fehler.
  - Geschichte-Probe `--dorf`: bestanden. Das Angebot wartet, bis der Wald fertig geladen ist (längste Lücke 88 ms),
    Satz zum Ende → Bergwald 1 53 ms.
  - Geschichte-Probe `--wagen`: **gescheitert**, nur an der Lücke von oben (107, 133, 106 ms; die Basis 89 und 88 ms).
    Alles andere ist grün.
