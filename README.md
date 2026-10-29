# PRISMA

Ein 3D-Licht-Puzzle im Browser: Spiegel und Kristalle drehen, Licht lenken,
mit Prismen in Spektralfarben aufspalten und farbige Ziele treffen.

- **Starten:** `index.html` direkt im Browser öffnen (keine Installation, kein Build-Step, kein Internet nötig).
  Three.js r147 (MIT) und die Schrift Jost (SIL OFL 1.1) liegen in `vendor/`, die Lizenztexte daneben.
- **Offline:** Über http(s) ausgeliefert, speichert der Service Worker `sw.js` alle Dateien; danach läuft das Spiel
  auch ohne Verbindung. Neue Dateien in die Liste `FILES` in `sw.js` eintragen (ein Test prüft das); grosse, die nicht jedes Gerät braucht, in
  `LAZY` (gespeichert beim ersten Gebrauch).
  Beim Entwickeln über `localhost` bleibt der Service Worker für diese Adresse registriert (er liefert das Spiel auch
  bei gestopptem Server): In den DevTools unter Application → Service Workers „Unregister“ oder „Bypass for network“.
- **Spezifikation:** siehe [SPEC.md](SPEC.md).
- **Würfel-Level (3D-Prototyp):** Vorgehen, Modell und offene Punkte in [3D-WUERFEL.md](3D-WUERFEL.md).
- **Plan und offene Punkte:** siehe [PLAN.md](PLAN.md) – was noch umgesetzt werden soll, Entscheidungen, Erledigtes.
- **Icon:** `favicon.svg` (Prisma mit Farbfächer), PNG-Varianten in `icons/` (iOS 180 px, Android 192/512 px),
  dazu `icon-maskable-*.png` für Android, das Icons selbst rund oder eckig zuschneidet (`node tools/icons.mjs` erzeugt
  sie aus `favicon.svg`: ohne Ecke, Inhalt verkleinert in die Schutzzone).
- **Name und Manifest:** Im Store und beim Installieren heisst das Spiel „Prisma – Licht-Puzzle“, auf dem
  Startbildschirm „Prisma“. `manifest.webmanifest` (feste `id` „prisma“, nicht mehr ändern) wird nur über http(s)
  eingebunden, über file:// blockiert es der Browser.
- **Tests:**
  - `node tests/logic.test.mjs` prüft die Strahllogik, im Block „Würfel (dim: 3)“ auch die Würfel-Level.
  - `node tests/golden.mjs` vergleicht die Strahlbilder aller flachen Level (Start- und Lösungsstellung) mit
    `tests/golden.json`, dazu den Löser für eine Stichprobe, das Tutorial und jedes 10. Level der Reihenfolge im Spiel
    (Platz 1, 11, …, 141): das Verhalten exakt, Kommazahlen auf 1e-9 genau (etwa 2 s). Die Referenz hält die
    Löserdaten aller Level fest, die Stichprobe passt also auch nach einem Umordnen. Verglichen wird je Level nach
    Namen, gleich auf welchem Platz es steht; er meldet, wie viele Level an einem anderen Platz stehen als in der
    Referenz. `--voll` vergleicht den Löser für alle 159 Level (etwa 25 s), vor und nach Änderungen am Löser.
    `--schnell` vergleicht nur die Strahlbilder, ohne Löser (etwa 1 s), für Zwischenschritte eines Umbaus. Nach
    mehreren Schritten, am Schluss und immer, wenn der Löser berührt ist, läuft er ohne `--schnell`. `--write` schreibt
    die Referenz neu, aber nur bei einer bewussten Änderung des Verhaltens oder wenn Level dazukommen oder wegfallen;
    ein Umbau der Strahlregel oder des Lösers muss gegen die bestehende Referenz grün bleiben. Bis Ticket 21 hielt die
    Referenz für 24 Level auch die alte Wertung (`score`) fest, und diese Einträge bildeten die Stichprobe.
  - `node tests/beurteilung.test.mjs` prüft die Beurteilung (unter `leise.sh` etwa 40 s, auf einem Thread 90–130 s je
    nach Last): den Einstieg, die Feldform und je Regel eine Datei in `tests/beurteilung/` (einzeln aufrufbar, eine neue
    Datei läuft ohne Eintrag mit). Jede Regel wird an kleinen, von Hand gebauten Leveln geprüft und an den 150 heutigen
    Leveln mit den Zahlen der Neuzählung aus der Spec. `helfer.mjs` baut die Mini-Level (Elemente in Lösungsstellung)
    und beurteilt einmal je Lauf die 150 in der heutigen Reihenfolge (die feste Namensliste aus Ticket 15, Massstab
    der Eichung; `platz` ist der heutige Platz), mit dem Grad aus den Leveldaten, ohne und mit den teuren
    Regeln (`heutigeLevel({ teuer: true })`), und die 42 Kandidaten der Eichmenge des Spielwerts
    (`eichmengeBeurteilt()`). Das ist der grösste Teil der Arbeit, auf einem Thread rund 3 s, 32 s und 45 s. Der
    Einstieg beurteilt es darum vorab in einem Durchgang auf vier Threads (`await vorausBeurteilen()`, mit
    `tools/beurteilung/parallel.mjs`); die Testfälle bleiben synchron und finden es im Cache. `BEURTEILUNG_THREADS=1`
    rechnet ohne Worker, mit denselben Ergebnissen. Eine teure Datei allein beurteilt ihre Teile ebenso vorab (etwa
    `await vorausBeurteilen(['teuer'])`, über den Einstieg ohne Wirkung), die übrigen auf einem Thread. Scheitert der
    Vorab-Durchgang, ist das ein roter Testfall. Danach laufen die Testdateien auf einem Thread (rund 11 s, vor allem
    Probieren, Schwierigkeit und Schliessen an ihren Testleveln).
  - `node tests/levelliste.test.mjs` prüft die Levelliste (Spec, Nahtstelle 3; unter `leise.sh` etwa 25 s): Jedes Level
    nach dem Tutorial hat einen Grad, der nie sinkt und den Schwellen folgt; die Anzeige bildet die Grade auf 1–4
    Punkte und Text ab, der Seitentitel nennt den Grad der Seite oder ihren Bereich; die Reihenfolge ist die der Formel,
    und jede Abweichung davon ist im Protokoll der KI-Tester oder durch die Häufungsregel begründet (Ticket 16, dazu
    beide Regeln an erfundenen Fällen); kein von den KI-Testern korrigiertes Level steht mehr als 5 Plätze von seinem
    Platz davor, weder nach den Korrekturen noch am Ende (Ticket 24, mit Gegenproben an erfundenen Korrekturen, die
    einander schieben); die Prüfliste stimmt und ist erledigt, jedes Level darauf hat ein zählendes
    Urteil, und sein Entscheid bleibt fest, auch wenn ein Austausch die Formel verschiebt (Ticket 26, mit Gegenproben an
    erfundenen Verschiebungen); das Mittel der Schwierigkeit je 10 Level fällt um höchstens 1 Punkt; dieselbe
    Haupt-Kernidee höchstens zweimal je 10 Level, ohne die Duldungsliste; Ausschluss, fehlende Kernidee, zu tiefer
    Spielwert und Ablehnung durch beide KI-Tester nur bei Leveln auf der Duldungsliste, die nur kürzer wird (einmal, in
    Ticket 16, wuchs die ursprüngliche Liste um begründete Ergänzungen); nach dem Austausch eines Grads stehen aus ihm
    nur noch Level der Gruppe „behalten nach Urteil der KI-Tester“ darauf, die nie wächst und deren Level die Regel
    `stark` im Protokoll erfüllen (Tickets 24 und 25, mit Gegenproben an erfundenen Urteilen; seit Ticket 25 nennt die
    Liste genau diese Level, 27 in „mittel“ und 4 in „schwer“); eindeutige Namen, keiner aus der
    Liste entfernter Namen; jeder Name der heutigen Reihenfolge steht im Spiel oder auf dieser Liste (umbenannt wird
    nichts), 150 Level nach dem Tutorial und dazu die des Ausbaus; kein Filter gibt in der Lösung eine fremde Farbe ab (etwa Cyan durch einen
    Gelbfilter als Grün, mit Gegenprobe); genau eine Lösung; der Fortschritt hängt am Namen. Zum Austausch (Tickets
    23–26): Jedes neue Level steht nach der Formel und hat ein zählendes Urteil der KI-Tester (Lauf `ersatz-…`), das es
    nicht ablehnt; jedes entfernte Level hat seinen Namen auf der Liste und seine Leveldaten in der festen Kopie für die
    Eichung; die Regel für neue Level an einem erfundenen Fall; `levelCode` ergibt jedes Level wieder, der Abdruck hängt
    nur an den Leveldaten. Zum Ausbau auf 500 Level: Die Level des Ausbaus stehen in `levelliste.json`, jedes mit
    zählendem Urteil (Lauf `ausbau-…`), Herkunft im Kommentar und Grad nach der Schwelle, keines einem anderen Level zu
    ähnlich; `fuegeEin` und die ganze Regel mit einem Level des Ausbaus an erfundenen Fällen; die Plätze der Regeln für
    den Bestand zählen unter dem Bestand. Er ersetzt die früheren Tests zu Markierung, gehärteten Leveln, Härte-Abnahme und
    Auswahlliste in `tests/logic.test.mjs`, seit Ticket 21 auch die der Namen (`NAMES` in `profiles.mjs`) und der
    fremden Filterfarbe (`oddFilters` in `quality.mjs`).
  - `node tests/wuerfelliste.test.mjs` prüft die Würfel-Level (`.scratch/wuerfel-500/`; über `leise.sh`): Reihenfolge
    und Grade wie `tools/ordne-wuerfel.mjs` sie rechnet, keine Regel verletzt (im Würfel gibt es keine Duldungsliste),
    genau eine Lösung, keinem anderen Würfel-Level zu ähnlich, Namen eindeutig über flache und Würfel-Level, je Level
    ein Urteil der KI-Tester (`wuerfel-…`) und die Herkunft im Kommentar, kein Hinweis; dazu die Bausteine an
    erfundenen Fällen (Verteilung der Grade nach der Tabelle der Spec, Korrektur der KI-Tester, Ähnlichkeit über die 48
    Symmetrien des Würfels, Leveldaten als Text).
  - `node tests/generator.test.mjs` prüft den Generator (Spec, Nahtstelle 4; nur über `leise.sh`, denn der Generator
    prüft den Deckel; etwa 1 min): feste Seeds für „leicht“ ohne Kernidee und mit jeder der sechs Kernideen (je 50,
    dazu je Kernidee ein fester Seed, der ein Level mit ihr liefert), für „leicht“ mit den Ziel-Schwierigkeiten 33–43
    und 20–30 und für die Grade ab „mittel“ ohne Kernidee und mit Mischziel aus zwei Quellen (12–30 Seeds); ab
    „mittel“ hat jedes Level eine nötige Kernidee, mit Ziel-Schwierigkeit liegt es darin. Ab „mittel“ gibt es je Grad
    und Kernidee einen Auftrag mit einem festen Seed, der ein Level mit ihr als Haupt-Kernidee liefert (Ticket 28; in
    „sehr schwer“ ausser dem Lockvogel). Jedes Level hat so viele Quellen, wie die Vorgabe seines Grads verlangt;
    „mittel“ mit Falle, Seed 278 verwirft er mit „zu wenige Quellen“, der feste Seed desselben Auftrags liefert mit
    genau zwei, „leicht“ weiter auch mit einer (Ticket 29). Auf dem Würfel-Branch (Ticket 22) laufen dazu fünf
    Aufträge im Würfel 4 × 4 × 4 („leicht“ ohne Kernidee, mit Mischziel, Abschalten und Sammelstelle, „mittel“ mit
    Mischziel) durch alle Prüfungen, und die Würfel-Level nutzen den Raum (Licht zwischen den Ebenen, drehbare
    Elemente mit waagrechter Drehachse).
    Derselbe Auftrag ergibt dasselbe Level, auch nach anderen Aufträgen; jedes gelieferte Level hat genau eine Lösung,
    besteht die Beurteilung (neu beurteilt und gleich der mitgegebenen), hat den verlangten Grad und die verlangte
    Kernidee nötig, Leveldaten wie in LEVELS und eine Startstellung mit genug Klicks. Kein Filter, dessen Strahl schon
    seine Farbe hat, kein fester Spiegel und kein Blocker, der weder für die Lösung zählt noch als Lockvogel wirkt;
    eine Gegenprobe an einem handgebauten Level zeigt, dass die Prüfung solche Elemente findet. Dazu: Der Quelltext
    des Generators kennt keine Koordinaten und Richtungen, mit `LEISE_CPU` über 50 bricht er ab (mit
    `LEISE_MAX_CPU=65` erst über 65), und unbekannte Aufträge weist er ab.
  - `node tests/ki-tester.test.mjs [protokoll]` prüft den Ablauf der KI-Tester: Schema der Antworten, Zusammenführen
    (Ablehnen nur gemeinsam, Korrektur höchstens 5 Plätze und nie über eine Gradgrenze, Anker), Referenz und Grade in
    der Reihenfolge im Spiel, Feld als Text, Auftrag und Fingerabdruck der Eingaben und das versionierte Protokoll
    `tools/ki-tester/protocol.jsonl` (jeder Eintrag nach der Referenz seiner Version), dazu Gegenproben mit
    verfälschten Kopien, die mit der erwarteten Meldung rot werden. Mit dem Pfad einer eigenen verfälschten Kopie wird
    er rot. Dazu Kandidaten ohne Platz im Spiel: die Seite mit den Kandidaten für die Bilder und `prepare.mjs
    --kandidaten` (Name, Referenz, Feld als Text, Abweisung bei falschem Grad; ohne Bilder).
  - `node tests/vorrat.test.mjs` prüft den Vorrat und den gemeinsamen Lader (`.scratch/noa-geschichte/`, Ticket 02;
    wenige Sekunden, auf Kopien der Texte im Speicher): Ablegen und Zurückholen sind verlustfrei (`index.html` und der
    Vorrat byte-gleich, auch in Teilen, in anderer Gruppierung und Reihenfolge, über mehrere Schritte, für alle Level
    und mit CRLF), die Folge nach dem Zurückholen, das Format (Block wie im Spiel, Platz, Titel), Auswahl und Fehler;
    dazu der Lader auf dem Stand der Dateien (jedes Level genau einmal, wie nach dem Zurückholen aller).
  - Golden-Test, Strahlregel, Beurteilung samt Eichung, Levelliste, Würfelliste und KI-Tester lesen die Level aus Spiel
    und Vorrat über den Lader (`tools/lader.mjs`), die Anzeige der Grade und die Proben im Browser nur das Spiel.
  - `node tests/offline.mjs` prüft den Offline-Betrieb (`--redirect`: Server leitet index.html weiter; startet
    Headless-Chrome, also wie die Screenshots nur über `leise.sh`).
  - `node tests/screenshot.mjs` rendert Screenshots per Headless-Chrome nach `tests/output/`.
  - `node tests/screenshot.mjs perf 1280 800 200 "$(cat tests/perf-probe.js)"` vergleicht die Kosten der Renderstufen.
  - `node tests/screenshot.mjs interaction 1440 900 800 "$(cat tests/interaction-probe.js)"` simuliert Klick,
    Rechtsklick, Ziehen und Hover.
  - `node tests/screenshot.mjs cube-click 1440 900 500 "$(cat tests/cube-click-probe.js)"` klickt im Würfel-Level
    „Blumentopf“ jedes drehbare Element an und meldet, welches sich gedreht hat. `tests/cube-probe.js` stellt ein
    Würfel-Level für Screenshots ein (Aufruf im Kopf der Datei und in [3D-WUERFEL.md](3D-WUERFEL.md)).
- **Steuerung:** Klick/Tap dreht ein Element um 45°, Rechtsklick oder langes Drücken zurück, Ziehen dreht die Kamera rund ums Feld.
  Schaltflächen unten rechts: Level neu starten, Ton an/aus, Hintergrund (Milchstrasse, Sonnensystem, Wald oder Strand, der Reihe nach), Levelauswahl.
  Tasten: N / → nächstes Level, P / ← voriges Level, R neu starten, M Ton, H Hintergrund, L Levelauswahl,
  Enter weiter (nach dem Lösen), Esc schliessen, F Leistungsanzeige. In der Levelauswahl blättern ← / Bild↑ und
  → / Bild↓ eine Seite weiter, auf dem Handy auch Wischen über die Kacheln (nach links die nächste Seite); oben
  springen Tutorial, Leicht, Mittel, Schwer und Sehr schwer zur ersten Seite des Abschnitts.
- **Würfel-Level (Prototyp, Branch `feature/3d-wuerfel`):** zwei Level in einem 7×7×7-Würfel (`LEVELS_3D`, `dim: 3`),
  in der Levelauswahl unter „Würfel · 3D“. Jedes Element dreht um eine feste Achse in einem Ring (Achszapfen zeigen sie) und
  wirkt in der Ebene senkrecht dazu wie im 2D-Feld; Spiegel mit waagrechter Achse lenken Licht zwischen die Ebenen.
  Derselbe Durchlauf der Strahlregel wie für die flachen Level (`tracePass`, ADR 0003): Ein flaches Level ist ein Würfel
  mit einer Ebene. Nur das Brett hat eine eigene Fassung (`createBoard3`, mit y und Drehachse); die flachen Level
  bleiben bitgleich (`tests/golden.mjs`).
  Die Kamera lässt sich im Würfel viel stärker neigen. Beurteilung (Ticket 14) und Generator (Ticket 22) kennen den
  Würfel über die Würfel-Feldform (`tools/beurteilung/feldform-wuerfel.mjs`); Würfel-Level aus dem Generator kommen
  nicht ins Spiel.
- **Ablauf:** Startbildschirm (Klick startet und schaltet den Ton frei), dann das Tutorial. Die Kopfzeile zählt die
  Ziele, die schon in ihrer Farbe leuchten („Ziele 1 / 3“). Der Ring am Ziel hat einen festen Platz je Grundfarbe
  (Rot links, Grün rechts, Blau vorne) und zeigt, aus welchen die gesuchte Farbe besteht. Kommt eine gebrauchte
  Grundfarbe an, wird ihr Bogen heller; kommt eine an, die das Ziel nicht braucht, flackert sie in ihrem leeren
  Platz. Beim Lösen leuchten die Ziele nacheinander auf, ein Akkord erklingt, eine Lichtwelle läuft über die
  Platte und es regnen Funken; danach "Level gelöst" mit Weiter-Button. Ton komplett per Web Audio erzeugt.
  `?nointro` überspringt den Startbildschirm (nutzen die Screenshot-Tests; `INTRO=1` zeigt ihn).
- **Leistung:** Fast die ganze Last ist das Rendern (Szene zweimal wegen der Bodenspiegelung, dazu Bloom); die
  Logik kostet unter 0,1 ms pro Bild. Darum rendert das Spiel nur so oft wie nötig (`frameRate`): höchstens
  60 Bilder/s, solange sich etwas bewegt oder bis 1,5 s nach einer Eingabe, sonst 30 (ruhige Umgebung, offene
  Levelauswahl). Gerendert wird jedes k-te Bildschirmbild, damit der Takt gleichmässig bleibt (144 Hz → 72 bzw. 29).
  Dazu passt die Auflösung sich an, wenn Bilder zu lange dauern (`adaptiveResolution`, Budget je nach Bildrate).
- **Skyboxen aus Blender** (`tools/blender/`, nur für die Entwicklung, braucht Blender 5.2 mit GPU): Hintergründe, die
  in Blender als Panorama entstehen; im Spiel zeichnet sie ein allgemeines Modul (`createPanoramaSky`, Abschnitt SKYBOX
  in `index.html`) aus ihrem Manifest. Register `backgrounds/skies.js`, Daten in `backgrounds/<id>/` (Stand im
  Dateinamen); beides schreibt `node tools/blender/pack.mjs <id>` aus `tools/blender/szenen/<id>/skybox.json` (Name,
  Reihenfolge, Sterne, Farben, Ebenen) und der Ausgabe der Pipeline. `tools/sky-schema.mjs` prüft das Register (beim
  Packen und in den Tests), `sw.js` liest seine Listen daraus. Was das Spiel zu einem Panorama selbst zeichnet (nahe
  Objekte, Nebellagen, Leuchtpunkte, bewegtes Wasser), sind Ebenentypen mit Parametern (`SKY_LAYERS`). Pinsel: Jede
  Ebene mit `"brush": true` bekommt Pinselstriche wie das gemalte Panorama (anisotroper Kuwahara-Filter wie `anime.py`,
  `createBrushPass`); die Einstellungen stehen im Feld `brush` der Skybox (`size` Radius in Grad wie
  `px_per_deg * 0.28`, `uniformity`, `sharpness`, `eccentricity` wie der Knoten im Kompositor, `mobile` Stufe auf dem
  Handy), Standard aus. `backgrounds/`
  muss samt Unterordnern mit ausgeliefert werden. Konzept und weitere Schritte: PLAN 2.32. Belichtung und Malstil je
  Szene stehen in `tools/blender/stile.py` (Name = `WALD_STIL` = Ordner `out/<stil>`, `sky/<stil>`).
- **Wald** (`forest`, erste Skybox): `wald_scene.py` baut die Szene (Gelände, Fichten, Nebel, Mond) als `wald.blend`,
  `wald_render.py` rendert Vorschauen aus Sicht der Spielkamera, `wald_export.py` das Panorama, die Streifen und die
  Tiefe (Aufrufe in seinem Kopf). Eingebaut ist die Anime-Fassung: dieselben Skripte mit `WALD_STIL=anime`, danach
  malt `anime.py` die Renderings (Aufrufe in seinem Kopf) und schreibt `sky/anime/sky.json` (mit Hauptlicht, hellstem
  Wert und Farbringen für den Platzhalter beim Laden). Die Fichten nahe am Brett zeichnet das Spiel selbst (im
  Panorama lägen sie schräg): Modelle und Standorte erzeugt `wald_spielbaum.py` (`sky/<stil>/trees.json`).
  Gearbeitet wird über den Blender-MCP in der offenen Szene: `wald_mcp.py` führt die Skripte dort aus, lange Schritte
  (Rendern, Malen) nach dem Aufruf mit Protokoll in `out/<stil>/mcp.log`. Szene, Renderings und Zwischenbilder
  (`*.blend`, `out/`, `sky/`) sind nicht im Repo, die Skripte erzeugen sie neu: `wald_mcp.neu('anime')` baut
  `wald_anime.blend` (rund 20 s, gleich wie die Szene der eingecheckten Bilder), `wald_mcp.skybox()` rendert und malt
  alles (rund 30 min mit einer RTX A2000), danach `node tools/blender/pack.mjs forest`. Einrichten auf einem neuen
  Rechner: Blender 5.2 mit dem MCP von Blender Lab (projects.blender.org/lab/blender_mcp, Releases): `mcp-<version>.zip`
  in Blender als Erweiterung installieren und Blender mit `--online-mode` starten (die Brücke startet nur mit
  Online-Zugriff), `blender-<version>.mcpb` (ein Zip) entpacken und in Claude Code eintragen:
  `claude mcp add -s user blender -- uv run --directory <entpackter Ordner> blender-mcp`.
- **Strand** (`beach`, PLAN 2.33): Szene in `tools/blender/szenen/beach/szene.py`; über den MCP
  `wald_mcp.neu('beach')` (baut `beach.blend`, rund 5 s), `wald_mcp.skybox('beach')` (rendert, malt und exportiert
  Pflanzen und Wasserkarte nach `sky/beach/ebenen.json`, rund 25 min), danach `node tools/blender/pack.mjs beach`.
  Nur die nahen Pflanzen neu (Modelle, Eigenschatten, Lichtsonde, rund 3 min): `wald_mcp.scene('beach').export_flora()`,
  danach packen. Die Pflanzen zeichnet das Spiel beleuchtet und gemalt wie Blender (Ebene `paintedInstances`, PLAN 2.38).
- **Vulkan** (`volcano`, PLAN 1.2): Das Brett schwebt im Schlot über einem Lavasee, Vorbilder Nyiragongo (See) und
  Masaya (Wand): Rundum eine steile, geschichtete Kraterwand in zwei Stufen mit schmalem Absatz, im Grundriss aus
  geraden Flächen (Rippen und Buchten in wechselnden Abständen, ruhige und wilde Abschnitte, V-förmige Rinnen,
  manche erst weit oben), aus Gesteinsbänken mit dünnen Lagen und kantigen Felsflächen; am Fuss eine Schutthalde,
  je nach Stelle Fächer, Kegel oder fast kahl, mit Felsblöcken wie am Strand in Gruppen, dazu Riesenblöcke. Licht:
  warm von der Lava unten, kühl vom Mond oben. Szene in `tools/blender/szenen/volcano/szene.py` (in Cycles gerendert,
  gemalt mit dem Stil `volcano` in `stile.py` wie der Strand, feinere Pinselstriche `pinsel`, weil die Wand nah ist). `wald_mcp.neu('volcano')`, `wald_mcp.skybox('volcano')`
  (ohne MCP auch headless mit denselben Skripten über `wald_mcp.run`), danach `node tools/blender/pack.mjs volcano`.
  Bewegt zeichnet das Spiel den See ums Brett (`lavaPool`: treibende Krustenplatten mit glühenden Rissen, die sich
  öffnen und schliessen; Gasblasen wölben die Kruste auf, reissen, Lava spritzt hoch und kühlt ab; Funken); Blender
  malt dort nur die Kruste. Ein Dutzend Felsbrocken am Ufer zeichnet das Spiel wie die nahen Felsen am Strand
  (`bakedMesh`, Licht gebacken und gemalt, `export()` der Szene).
- **Level-Werkzeuge** (`tools/`, nur für die Entwicklung): Wie Level beurteilt und erzeugt werden, bestimmen nur die
  Beurteilung (`tools/beurteilung/`) und der Generator (`tools/generator/`, Kommandozeile `generiere.mjs`); beide
  unten. Seit Ticket 21 sind die alten Werkzeuge mit eigenen Formeln entfernt (im Verlauf bis `6e98bb1`): der
  Generator nach Profilen (`generate.mjs`, `profiles.mjs`: Grössenstufe × Mischung), das Härten (`harden.mjs`), die
  Pools (`pools.mjs`), das Kuratieren (`curate.mjs`) samt Auswahlliste (`selection.jsonl`) und handgebauten Kandidaten
  (`candidates.jsonl`), der Ja/Nein-Filter (`quality.mjs`) und die alte Wertung (`metrics` mit `score` und der
  Zählung `mixed`). Kandidaten liefert der Generator, Reihenfolge und Grade `ordne-level.mjs`.
  `solver.mjs` folgt den Strahlen und probiert nur Elemente durch, die Licht bekommen (schneidet ab, sobald ein Ziel
  falsches Licht erhält; die Verfolgung macht nach jeder gesetzten Stellung dort weiter, wo sie angehalten hat), und
  zählt Lösungen, Suchknoten, Blätter, Fast-Lösungen und Rateschritte; `clicksTo` zählt die Klicks bis zu einer Lösung.
  Ist nur die Eindeutigkeit gefragt, hält `solve(level, { unique: true })` bei der zweiten Lösung an;
  `show.mjs` zeigt Level als Textfeld, Start und Lösung, mit Grad, drehbaren Elementen, Zielen und Klicks und, wo sie
  vorliegt, der Beurteilung: die JSON-Zeilen von `generiere.mjs` mit Schwierigkeit, Spielwert und Kernideen
  (`… generiere.mjs leicht --anzahl 3 | node tools/show.mjs`), ein Level aus index.html mit `--level <platz|name>`
  (Platz in LEVELS ab 1, das Tutorial mitgezählt). `--beurteilen` beurteilt Level ohne mitgegebene Beurteilung (alle
  Regeln, mit ihrem Grad; je Level bis einige Sekunden) und nennt dazu die Ausschlussgründe;
  `ordne-level.mjs [--schreiben] [--json datei]` (über `leise.sh`, etwa 40 s) ordnet die 150 Level nach der
  Schwierigkeit der Beurteilung und legt ihren Grad fest (Ticket 15). Gerechnet wird von der heutigen Reihenfolge aus
  (`beurteilung/heutige-reihenfolge.json`); Verschiebungen bis 10 Plätze werden übernommen, weiter wandernde Level
  bleiben an ihrem Platz und stehen auf der Prüfliste der KI-Tester. Mit den zählenden Urteilen der KI-Tester (Ablauf 2,
  Läufe `pruefung-…`; Ticket 16) kommt ein Level der Prüfliste nur auf den Platz der Formel, wenn beide zustimmen: Der
  Platz der Formel liegt für beide in ihrem Bereich der Einordnung oder näher daran als der alte Platz. Sonst bleibt
  es. Dieser Entscheid bleibt fest, auch wenn ein Austausch die Formel verschiebt: An dem Platz der Formel beim
  Entscheid, den `levelliste.json` festhält (`prueflisteFormel`, Ticket 26), misst sich, ob das Level auf der Prüfliste
  steht, und mit ihm rechnet die Zustimmung; ein Level, das erst später darüber kommt, braucht ein Urteil, und sein
  Platz der Formel kommt dazu (`festePlaetze`). Von dort, wo es steht, gilt die eigene Korrektur der KI-Tester nach der
  Regel von `merge` (höchstens 5 Plätze, nie über eine Gradgrenze; am alten Platz das Ergebnis aus dem Protokoll, am
  Platz der Formel dieselbe Regel mit dem Grad dort). Lehnen beide ab, wird es nicht korrigiert und kommt auf die
  Duldungsliste (Grund `abgelehnt`). Häuft sich danach dieselbe Haupt-Kernidee auf einer Seite (mehr als zweimal ohne
  die Duldungsliste), rückt ein Level im eigenen Grad um höchstens 3 Plätze: zuerst eines der betroffenen, sonst ein
  anderes derselben oder einer Nachbarseite, eines der Duldungsliste vor einem anderen; dann der kürzeste Zug, der
  spätere Platz, nach hinten. Kein Zug schafft eine neue Häufung oder bricht Grad, Mittel je 10 Level oder die
  Korrekturen der KI-Tester: Kein korrigiertes Level steht mehr als 5 Plätze von seinem Platz davor, weder nach den
  Korrekturen (die einander schieben, wenn sie nahe beieinander liegen) noch am Ende (`zuWeitKorrigiert`, Ticket 24).
  Der Bericht zeigt Prüfliste samt Entscheid je Level, die Züge der Häufungsregel, Schwellen und ihre Herleitung, die
  Duldungsliste nach Grund und Grad samt neuen Leveln darauf und die Regeln der Levelliste, darunter jedes korrigierte
  Level, das zu weit steht (Platz davor, nach den Korrekturen, am Ende).
  `--schreiben` trägt Reihenfolge und Grad in index.html ein (zwischen `LEVELS:BEGIN/END`) und Duldungsliste, Prüfliste
  und `prueflisteErledigt` in `tools/levelliste.json`; die ursprüngliche Duldungsliste, die entfernten Namen,
  `prueflisteFormel` und die Gruppe `behalten` (Ticket 24, nur ohne Level, die es nicht mehr gibt) bleiben, wie sie
  sind, nur einmal, in Ticket 16, wuchs die ursprüngliche Liste um begründete Ergänzungen (`ergaenzt`: Level, die beide
  KI-Tester ablehnen, und Level, die durch ihr Urteil in einen Grad kommen, in dem sie eine Regel verletzen). Bleibt
  eine Häufung offen oder steht ein korrigiertes Level zu weit, schreibt es nicht, auch mit `--austausch`. Ein
  zweiter Lauf ändert nichts. Die Regeln (Reihenfolge, Urteile der KI-Tester, Häufungsregel, Grade entlang der
  Reihenfolge, Gründe der Duldung, Toleranzen) stehen in `levelliste.mjs`, gemeinsam für Skript und Test.
  Austausch (Tickets 23–26): Ein neues Level hat keinen heutigen Platz, wandert also nicht und steht nach der Formel;
  die KI-Tester beurteilen es in einem Lauf `ersatz-…` unter dem Namen „Kandidat <Abdruck>“ (`leveldaten.mjs`), von
  dort gilt ihre Korrektur wie am Platz der Formel, und lehnen beide ab, kommt es nicht ins Spiel.
  `--austausch datei` (eine JSON-Liste `{ ersetzt, level, name, auftrag, seed, schwierigkeit }`, die Leveldaten etwa
  von `generiere.mjs`, `schwierigkeit` die Ziel-Schwierigkeit `[von, bis]` des Auftrags) rechnet, als wären die
  Kandidaten schon im Spiel und die ersetzten Level entfernt: Platz, Grad, Haupt-Kernidee und Regeln je Kandidat, mit
  `--json` auch die Leveldaten für `prepare.mjs --kandidaten`. Mit `--schreiben` und genehmigten Namen setzt es die
  neuen Level ein (nur mit einem zählenden Urteil ohne Ablehnung; im Kommentar die Herkunft aus Auftrag, Seed und
  Ziel-Schwierigkeit, mit der `generiere.mjs <auftrag> --seed S --anzahl 1 --schwierigkeit VON,BIS` es nachbaut),
  nimmt die ersetzten heraus, setzt ihre Namen auf `entfernteNamen` und legt ihre Leveldaten als feste Kopie für die
  Eichung in `beurteilung/entfernte-level.json` (so bleiben die 150 der heutigen Reihenfolge der Massstab, ADR 0001).
  Ausbau auf 500 Level (`.scratch/500-level/`, in Gruppen zu 35): Die Level vor dem Ausbau sind der Bestand und stehen
  untereinander genau wie ohne ihn; die Level des Ausbaus (`ausbau` in `levelliste.json`) fügt `levelliste.mjs`
  (`fuegeEin`) nach der Formel dazu, ihr Grad folgt der Schwelle, beurteilt werden sie in Läufen `ausbau-…`.
  `--ausbau datei` (wie `--austausch`, aber ohne `ersetzt`) rechnet mit den Kandidaten, `--json` liefert die ganze
  Reihenfolge als Vorschau für `prepare.mjs --kandidaten`, `--schreiben` setzt sie mit ihren Namen ein (eine Freigabe
  der Namen durch den Nutzer braucht es beim Ausbau nicht);
  `ausbau.mjs` erzeugt und wählt die Level einer Gruppe: `pool <auftrag …> --aus datei [--seed S] [--seeds M]
  [--jobs N]` sammelt Kandidaten des Generators parallel (über `leise.sh`), `wahl <gruppe> --pool datei[,…] --aus
  datei [--behalte datei] [--ohne name,…]` wählt nach dem Bedarf je Grad (Bestand nach der Gruppe laut Spec weniger
  die Level im Spiel) über den Bereich des Grads verteilt, keinem Level zu ähnlich, ohne dass der Grad sinkt oder das
  Mittel je 10 Level fällt, und sucht dann so lange Tausche, bis mit der Häufungsregel keine Häufung offen bleibt
  (etwa 40 s für Gruppe 1); `bedarf` zeigt den Bestand und den Bedarf je Gruppe; `pool … --wuerfel` sammelt
  Kandidaten im Würfel 7 × 7 × 7;
  Würfel-Level (`.scratch/wuerfel-500/`): `wuerfel.mjs wahl <gruppe> --pool datei[,…] --aus datei [--behalte datei]
  [--ohne name,…]` wählt die neuen einer Gruppe (Bedarf je Grad nach der Spec, gegen Häufungen der Haupt-Kernidee),
  `wuerfel.mjs bedarf` zeigt Bestand und Bedarf; `ordne-wuerfel.mjs [--kandidaten datei] [--json datei]
  [--schreiben]` ordnet die Würfel-Level nach den Regeln in `wuerfelliste.mjs` (eine eigene Reihenfolge ohne Bestand,
  Grade nach der Schwelle, Korrekturen der KI-Tester aus Läufen `wuerfel-…`) und schreibt sie zwischen
  `WUERFEL:BEGIN` und `WUERFEL:END` in `index.html`;
  `aehnlichkeit.mjs` misst, wie ähnlich zwei Level aufgebaut sind (Elemente mit Art, Farbe und Zelle, das Höchste über
  die acht Symmetrien des Felds, im Würfel über seine 48 mit der Drehachse von Spiegel, Prisma und Kombinator); ab 0,5
  ist ein neues Level zu ähnlich (ohne Argument: die ähnlichsten Paare in Spiel und Vorrat;
  heute drei Fast-Doppel aus dem Austausch, Dreiklang – Delta, Karussell – Rundflug und Fokus – Türkis);
  `bench.mjs <generator|trace|solver …> [gruppe …] [--seeds N] [--jobs N] [--unique] [--save datei] [--compare datei]`
  misst die Effizienz in CPU-Zeit, nicht mit der Wanduhr (der Deckel von `leise.sh` verzerrt sie): angenommene Level
  je CPU-Stunde je Gruppe mit festen Seeds, die mittlere Zeit je Aufruf der Strahlregel auf zufälligen Stellungen
  aller Level und die Zeit des Lösers über alle Level, dazu über die Level mit Blockern ohne diese (sie haben dann
  mehrere Lösungen). `--unique` misst den Löser im Modus unique: Auf den eindeutigen Leveln sucht er gleich weit, ohne
  Blocker hält er bei der zweiten Lösung an. Die Gruppen sind die Aufträge des Generators wie `leicht` und
  `leicht-mischziel`, die Abnahme ist die Beurteilung (`--generator neu --accept beurteilung`, Standard und seit Ticket
  21 einzige Wahl): genau eine Lösung und die Beurteilung bestanden, mit dem Grad nach der Schwierigkeit; die Messung
  zählt auch je Grad und je Grad und nötiger Kernidee, je Grad und Haupt-Kernidee (Ticket 28) und nennt die Quartile
  der Schwierigkeit. Der Generator gibt
  seine Beurteilung mit, die Abnahme beurteilt seine Level darum nicht ein zweites Mal. Ohne Gruppe bricht es ab und
  nennt die Aufträge (alle 28 zusammen kosteten ab „mittel“ viele CPU-Stunden); `--seeds` ist ohne Angabe 2000, der
  Umfang der Messung in Ticket 20 (bis Ticket 21 60 000 je Profil). Die Ausgangszahlen
  stehen in `tools/bench-baseline.json` (der alte Generator nach Profilen mit seiner eigenen Abnahme, bis Ticket 21
  `--generator alt --accept alt`). `--save` fügt einzeln gemessene Gruppen einer Datei hinzu, wenn Generator, Abnahme,
  Seeds, `--jobs` und Rechner gleich sind. `--compare` zeigt den Gewinn je Gruppe, je Grad und gesamt und meldet
  andere angenommene Level (Fingerabdruck), eine andere Knotenzahl des Lösers und andere Strahlbilder. Über einen
  Generatorwechsel (gegen eine gespeicherte Messung des alten Generators) vergleicht es je Auftrag mit den Leveln
  desselben Grads und derselben nötigen Kernidee des alten, über alle Profile und im besten Profil; einen Faktor gibt
  es nur bei derselben Abnahme mit Grad. Die Prüfsumme der Strahlbilder erfasst Art, Farbe und Element der Ereignisse,
  Treffer, Mischungen, „gelöst“ und die auf 1e-6 gerundeten Endpunkte, aber keine Normalen und Längen; das Verhalten
  sichert weiterhin der Golden-Test. Die CPU-Zeit hängt von
  der Zahl der Prozesse und von der übrigen Last auf dem Rechner ab (beobachtet 20 bis 50 %): Verglichen wird nur mit
  gleichem `--jobs`, am besten vorher und nachher in derselben Sitzung (alter Stand etwa in einem `git worktree`).
  Das Skript läuft nur mit tiefster Priorität und bricht bei einem höheren Deckel ab: den Generator mit
  `LEISE_CPU=50 sh tools/leise.sh node tools/bench.mjs generator <gruppe …> [--seeds N]`, Strahlregel und Löser über
  `leise.sh` mit 20 %;
  `leise.sh <befehl …>` (mit `leise.ps1`, nur unter Windows) startet einen Befehl samt allen Unterprozessen in einem
  Job-Objekt mit harter CPU-Obergrenze und Priorität „Leerlauf“, damit der Rechner bedienbar bleibt. Vorgabe sind 20 %
  der ganzen Maschine; der Generator und die Vorbereitung der KI-Tester (`prepare.mjs`, Screenshots) dürfen
  `LEISE_CPU=50`, mehr nimmt `leise.sh` ohne `LEISE_MAX_CPU` nicht an. Weil Läufe nur nacheinander laufen, bleibt die
  Arbeit an Tickets insgesamt unter 70 % der Maschine (Vorgabe des Nutzers). Ein Rechner, auf dem mehr erlaubt ist,
  hebt die Obergrenze lokal mit der Umgebungsvariablen `LEISE_MAX_CPU` an (Standard 50; nicht versioniert, etwa in
  `.claude/settings.local.json` unter `env`, das gitignored ist), etwa `LEISE_MAX_CPU=65 LEISE_CPU=65 sh tools/leise.sh
  …`. Dieselbe Grenze prüfen Generator, Messskript und Screenshots (`tools/deckel.mjs`). Alle schweren Läufe (Tests,
  Messungen, Screenshots, Generator) laufen darüber, nie mehrere gleichzeitig: Eine Sperre (`/tmp/prisma-leise.lock`)
  lässt einen zweiten Lauf warten („leise: warte auf laufenden Lauf“), auch aus parallel arbeitenden Worktrees; ein Aufruf innerhalb eines
  Laufs läuft direkt, eine verwaiste Sperre (Halter tot, oder über eine Minute ohne pid-Datei) wird übernommen;
  `chrome.mjs` steuert Headless-Chrome über das DevTools-Protokoll (für `tests/screenshot.mjs` und die KI-Tester).
- **Beurteilung** (`tools/beurteilung/`, nur für die Entwicklung; ADR 0002, Spec „Beurteilung“ und „Feldform“): ein
  Modul mit einem Einstieg, `beurteile(level, { grad, teuer })` aus `index.mjs`. Es liefert Schwierigkeit, Spielwert,
  die Teilwerte zum Schliessen, Kernideen samt Haupt-Kernidee, Mischziele und Ausschlussgründe (je mit Glossarbegriff
  und Begründung).
  `offen` nennt die Teile, die noch keine Regel berechnet. `grad` gibt den Schwierigkeitsgrad vor, bis die Beurteilung
  ihn selbst bestimmt (Tickets 12 und 15). `teuer: false` lässt die Regeln weg, die lange rechnen; sie stehen dann in
  `offen`. `zwischenstand` (eine Map) hält fest, was die Regeln einmal je Beurteilung rechnen; eine zweite Beurteilung
  desselben Levels mit demselben Grad und derselben Map rechnet es nicht nach. So kostet eine Vorprüfung mit
  `teuer: false` die volle Beurteilung danach nichts (Generator, Ticket 18). Für ein anderes oder inzwischen
  verändertes Level oder einen anderen Grad wirft sie.
  - **Feldform** (`feldform.mjs`): Zellen, Nachbarn, Richtungen, Drehachse und mögliche Stellungen eines Elements und
    was es in einer Stellung mit einem Strahl macht (`spiegeln`, `brechen`, `ausgang`, aus der Strahlregel), dazu die
    Drehungen eines Levels um die Drehachse (`drehungen`, Ticket 12). Für den Generator (Ticket 18) liefert sie die
    Leveldaten eines Elements in einer Zelle (`element`) und die Angaben des Felds (`rahmen`, im Feld 7 × 7 keine),
    dazu die Drehachsen, die ein Element haben kann (`drehachsen`, im flachen Feld nur y; `element` nimmt eine davon
    als `drehachse`, Ticket 22). Nur sie kennt Koordinaten und die acht Richtungen; eine Zelle ist ein Schlüssel wie in
    der Lösung („x,z“). Die Nachbarn stehen je Feldform in einer Tabelle, und `feldformVon` legt die flache Feldform je
    Grösse nur einmal an (eingefroren, alle Beurteilungen teilen sie): Das Spielermodell fragt die Nachbarn in jeder
    Beurteilung zehntausendfach ab. Auf main gibt es nur die flache Feldform, eine weitere (Würfel) kommt in
    `feldformVon` dazu.
    Auf dem Würfel-Branch ist das die Würfel-Feldform (`feldform-wuerfel.mjs`, Ticket 14) für Level mit `dim: 3`:
    Zellen „x,y,z“, 18 Richtungen, Drehachse je Element; für den Generator (Ticket 22) auch `element` und `rahmen`
    (`{ dim: 3, size }`), die drei Drehachsen und die Nachbarn aus einer Tabelle, je Grösse eine eingefrorene.
  - **Regeln:** Jede liegt in einer eigenen Datei: `mischziele.mjs`, `schliessen.mjs`, je Ausschlussgrund eine in
    `ausschluesse/`, je Kernidee eine in `kernideen/`, dazu `schwierigkeit.mjs` und `spielwert.mjs`. Sie steht mit
    einer Zeile in `regeln.mjs`, unter der Kommentarzeile ihres Tickets. Wie eine Regel aussieht, steht im Kopf von
    `index.mjs`. Was mehrere Regeln brauchen (Strahlbilder der Lösungsstellung in `loesungsstellung.mjs`, das
    Spielermodell in `spielermodell.mjs`, die Suche ohne Abschneiden in `suche.mjs`), rechnet `ctx.merke` einmal je
    Beurteilung.
  - **Mischziele:** Gemessen in der Lösungsstellung. Ein Ziel mit Mischfarbe ist ein Mischziel, wenn es ohne die
    mischenden Kombinatoren (dort Blocker, bis keiner mehr mischt) keinen Strahl bekommt, der seine Farbe schon hat; so
    zählen Weiss aus einer weissen Quelle und Gelb aus einem Gelbfilter nicht. Es ist aus zwei Quellen, wenn mindestens
    zwei Quellen je allein Licht darauf bringen (die übrigen schlucken dabei als Blocker). Das ist noch nicht die
    Kernidee „Mischziel aus zwei Quellen“ (Ticket 10). Die alte Zählung `mixed` in `metrics` (Ziele mit Mischfarbe, 129
    statt 71 Level) ist mit der alten Wertung in Ticket 21 entfallen.
  - **Scheinmischung und Knäuel** (`ausschluesse/`, alle Grade, in der Lösungsstellung): Scheinmischung je Kombinator
    mit Licht in den Fällen a–c der Spec; wohin seine Mischung läuft, zeigt ein Strahlbild, in dem nur sie leuchtet.
    Knäuel über die Nachbarn der Feldform: benachbarte drehbare Elemente und kurze Strahlabschnitte (`abschnitt`),
    beide Werte auf zwei Stellen gerundet wie in der Neuzählung.
  - **Füllteil und Zerfall** (`ausschluesse/`, Ticket 08) gelten erst ab „mittel“; ohne vorgegebenen Grad wie ab
    „mittel“, und die Begründung sagt es. Ein Füllteil ist ein Strang über höchstens 3 Spiegel, bei dem keine Stellung
    seiner Spiegel das Licht fremder Strahlen auf anderen Zielen ändert. Für den Zerfall hängen Ziele über gemeinsame
    drehbare Elemente (an ihrer Stelle ein Blocker) und gemeinsame Mischziele zu Gruppen zusammen.
  - **Spielermodell, Schliessen und Probieren** (Ticket 09): Das Spielermodell aus den Reviews folgert vorwärts und
    rückwärts, mit Horizont 2 und mit vollem Überblick, und braucht bei Stillstand eine Fallunterscheidung. Die
    drehbaren Elemente geht es in der Reihenfolge der Zellen durch, damit die Reihenfolge in den Leveldaten nichts
    ändert. Der Teil `schliessen` liefert k2, kInf, die längste Kette und die Fallunterscheidungen, dazu die weiten
    Fast-Lösungen der Suche ohne Abschneiden (mindestens 3 Elemente anders als in der Lösung). Probieren gilt in allen
    Graden: mehr als 60 ‰ weite Fast-Lösungen, oder Raten mit kInf > 6 oder Kette > 38. Beide Regeln sind teuer; die
    Suche braucht auf den 150 rund 25 s (140 Urknall bis 3,6 s), das Spielermodell gut 1 s.
  - **Kernideen Mischziel aus zwei Quellen, Abschalten, Farben abzählen** (je eine Datei in `kernideen/`): Jede zählt nur,
    wenn die Lösung von ihr abhängt. Die Prüfung „nötig“ in `noetig.mjs` (auch für Ticket 11) nimmt der Lösung den
    Beitrag der Kernidee weg (`gegenprobe`, `wegZu`) und fragt mit einer Suche des Lösers je Quelle, was jede Quelle
    allein in irgendeiner Stellung erreicht (`allein`). Jeder Fund nennt in der Begründung Ziel, Quellen und Licht. Die
    drei Regeln brauchen auf den 150 zusammen rund 3–4 s, vor allem für die Suchen je Quelle und die Wege der
    Zwischenstände.
  - **Kernideen Sammelstelle, Falle, Lockvogel und die Haupt-Kernidee** (Ticket 11; je eine Datei in `kernideen/`,
    dazu `haupt-kernidee.mjs`), wieder nur, wenn die Lösung von ihnen abhängt:
    - Sammelstelle: Aus mindestens zwei Richtungen fällt Licht in ein Prisma, und ohne den Zulauf aus einer davon
      verliert ein Ziel seine Farbe, für mindestens zwei Richtungen. Die Wegnahme `ohneZulauf` in `noetig.mjs` setzt an
      die Stelle des Prismas einen Blocker und bricht das Licht der übrigen Richtungen selbst weiter (`refractInPrism`).
      Ohne Wegnahme muss sie die Lösung wiedergeben; das prüft die Regel an jedem Prisma (ADR 0003).
    - Falle: ein naheliegender Zwischenstand wie beim Abschalten, bei dem ein Spiegel oder Prisma in der Lösung anders
      steht. Bringt die Lösung dasselbe Licht derselben Quelle auf anderem Weg hin, ist es eine Falle, nimmt sie es dem
      Ziel weg, Abschalten; beides zugleich gilt nie. Nötig ist sie, wenn eine weite Fast-Lösung sie enthält (Holzweg)
      und das Spielermodell mit Horizont 2 sie nicht auf den ersten Blick widerlegt (`aufDenErstenBlick`).
    - Lockvogel: ein festes Teil abseits der Lösung, das in mindestens 10 % der Strahlbilder der Suche ohne Abschneiden
      Licht bekommt (wie früher in `quality.mjs`, jetzt auch Filter). Nötig ist er, wenn er auch in die Irre führt (in
      mindestens 10 % der Holzwege Licht, mindestens in einem) und das Level ohne ihn (ein weisser Filter an seiner
      Stelle) eine zweite Lösung hätte. Ein Blocker, der nur eine zweite Lösung verhindert, zählt also nicht. Die Suche
      zählt dafür das Licht auf den festen Teilen mit (`licht`, je Fast-Lösung `feste`).
    - Haupt-Kernidee (Teil `hauptKernidee`, Begriff „Kernidee“): unter den nötigen die, die dem Schliessen am meisten
      abverlangt, nach der festen Rangfolge Falle, Abschalten, Farben abzählen, Sammelstelle, Lockvogel, Mischziel aus
      zwei Quellen; ohne nötige Kernidee ist `begriff` null. Begründung der Rangfolge im Kopf der Datei.
    - Falle, Lockvogel und Haupt-Kernidee sind teuer. Der Lockvogel braucht auf den 150 rund 5 s für die Suchen nach
      einer zweiten Lösung, die übrigen Regeln zusammen unter 0,1 s.
  - **Schwierigkeit** (Ticket 12, `schwierigkeit.mjs`, ADR 0001): Der Wert ist die Summe von vier Teilwerten, je mit
    seinem Anteil am Wert und den Messwerten (Gewicht mal Messwert).
    - Denkarbeit, die Summe aus Spielermodell, Farblogik und Kernideen:
      - Spielermodell: Rückschlüsse (drehbare Elemente, die es rückwärts vom Ziel her entscheidet), Fallunterscheidungen
        (k2 + kInf), längste Kette und Stillstand (Horizont 2 steckt). Gemittelt über die vier Drehungen des Levels um
        die Drehachse (`drehungen` der Feldform, `spielermodellJeDrehung`), denn die feste Reihenfolge der Zellen ist
        willkürlich; gedreht ist es dasselbe Rätsel und hat dieselbe Schwierigkeit.
      - Farblogik: die Farboperationen der Lösung, je Mischziel, nötigem Filter (an seiner Stelle ein weisser Filter)
        und nötigem Prisma, das Licht aus mindestens zwei Grundfarben bricht.
      - Kernideen: die Zahl der nötigen Kernideen.
    - Zusammenspiel: derselbe Teilwert wie im Spielwert (`zusammenspiel` aus `spielwert.mjs`).
    - Weglänge: die Zahl der geraden Strahlabschnitte in der Lösungsstellung, also der Schritte, die der Spieler
      verfolgt.
    - Grösse: höchstens 10 Punkte, voll ab 12 drehbaren Elementen.
    - Grenzen (`GRENZEN`, beim Eichen eingehalten): Die Weglänge trägt im Mittel höchstens ein Viertel und bei keinem
      Level mehr als ein Drittel, die Denkarbeit im Mittel mindestens die Hälfte. Auf den 150 tragen im Mittel die
      Denkarbeit 56,9 %, das Zusammenspiel 7,0 %, die Weglänge 25,0 % und die Grösse 11,1 %.
    - Die Gewichte stehen in `schwierigkeit-gewichte.json`.
      `sh tools/leise.sh node tools/eiche-schwierigkeit.mjs [--bericht]` stellt sie an den Leveln der geraden Plätze
      der heutigen Reihenfolge ein (feste Namensliste `heutige-reihenfolge.json` seit Ticket 15, denn im Spiel stehen
      die Level jetzt in der Reihenfolge der Formel) und schreibt die Datei neu: nichtnegative kleinste Quadrate;
      hielte sie die Grenzen nicht ein, wird das Gewicht der Weglänge festgehalten und so gross gewählt, wie die
      Grenzen erlauben. Es zeigt die Anteile und beide Masse je Bereich; `--bericht` dazu grösste Abweichungen und die
      Rangkorrelation mit dem Spielwert (den Vergleich mit der alten Wertung gibt es seit Ticket 21 nur noch in ADR
      0001). Eichen und Prüfen stehen in `schwierigkeit-eichung.mjs`, gemeinsam für Skript und Test.
    - Abnahme (Spec, ADR 0001), gekreuzt: an den geraden Plätzen eichen und die ungeraden vorhersagen, dann umgekehrt;
      Rangkorrelation über alle mindestens 0,85, je 30er-Bereich über alle 30 Level mindestens 0,3, auf zwei Stellen
      gerundet wie beim Knäuel. Erreicht: über alle 0,93, je Bereich knapp in 91–120 (0,296, gerundet 0,30). Der Test
      zeigt auch das bisherige Mass, die 15 nicht geeichten Level je Bereich.
    - Teuer, weil sie alle Kernideen braucht; das Spielermodell auf den drei weiteren Drehungen kostet auf den 150
      zusammen rund 3 s.
  - **Schwierigkeitsgrad** (Ticket 15, `grad.mjs`): `gradVon(wert)` nach festen Schwellen `SCHWELLEN` auf der
    Schwierigkeit: mittel ab 43, schwer ab 58,5, sehr schwer ab 87. Je die Mitte der breitesten Lücke zwischen zwei
    Leveln höchstens 5 Plätze von der vorläufigen Grenze (30 / 70 / 40 / 10), auf halbe Punkte gerundet. Kein Teil von
    `beurteile`; wie der Grad entlang der Reihenfolge gilt, regelt `tools/levelliste.mjs`.
  - **Spielwert** (Ticket 13, `spielwert.mjs`): `{ wert, teilwerte }`, der Wert von 0 bis 100 aus vier Teilwerten von 0
    bis 1 mit den Gewichten Schliessen 34, Kernidee 33, Farblogik 17 und Zusammenspiel 16.
    - Schliessen: Anteil, den das Spielermodell mit Horizont 2 folgert, × (1 − kInf / 7) × (1 − weite Fast-Lösungen in
      ‰ / 60), beides an den Schwellen von Probieren gemessen.
    - Kernidee: Die erste nötige Kernidee bringt 0,8, jede weitere 30 % des Rests.
    - Farblogik: Anteil der Ziele, die ein Mischziel sind oder Licht einer Quelle bekommen, deren Farbe ein Filter oder
      ein Prisma beschneiden muss.
    - Zusammenspiel: Stellen je drehbares Element, höchstens 1. Stellen sind Elemente, die mehrere Strahlen nutzen,
      gemeinsame Mischziele und Kreuzungen; dafür liefert die Feldform `durchlauf`.
    - Unter `MINDEST_SPIELWERT` (60) kommt ein Level ab „mittel“ nicht ins Spiel. Schliessen mit einer nötigen
      Kernidee ergibt ohne Bonus 60,4.
    - **Eichung** an der Eichmenge (`spielwert-eichmenge.mjs`): Gefühl der KI-Tester aus dem Protokoll und der
      Spieler-Tester aus den Reviews 4 und 6 (`spass-reviews.json`, samt Leveldaten aus den Pools übernommen).
      `sh tools/leise.sh node tools/eiche-spielwert.mjs` (etwa 35 s) berichtet die Brücken, die
      Rangkorrelation mit Kreuzprüfung, das Gefühl unter und über möglichen Schwellen und die Level der 150 unter dem
      Mindest-Spielwert. Begründung der Werte in Ticket 13.
    - Teuer, weil Schliessen und die Kernideen es sind.
  - **Auf mehreren Threads** (`parallel.mjs`): `await beurteileAlle([{ level, opts }, …])` beurteilt viele Level wie
    `beurteile(level, opts)` auf `worker_threads` und gibt die Beurteilungen in der Reihenfolge der Aufträge zurück,
    bitgleich zum Lauf auf einem Thread. Vorgabe 4 Threads, so viel lässt der Deckel von `leise.sh`;
    `BEURTEILUNG_THREADS` übersteuert, 1 heisst ohne Worker. Jeder Thread holt sich das nächste Level, sobald er frei
    ist. Level und Beurteilungen sind reine Daten und kommen per structured clone unverändert über die Thread-Grenze.
    Genutzt vom Test der Beurteilung und von den Messskripten `eiche-spielwert.mjs` und `eiche-schwierigkeit.mjs`.
- **Generator** (`tools/generator/`, nur für die Entwicklung; ADR 0004, Spec „Generator“ und „Effizienz“; Tickets
  18–20): ein Einstieg, `generiere({ grad, kernidee, seed, feldform, schwierigkeit })` aus `index.mjs`. Ein Auftrag
  ergibt `{ level, beurteilung }` mit Leveldaten wie in LEVELS (ohne Namen, mit `grad`, in der Startstellung) und ihrer
  Beurteilung, oder `{ level: null, grund }`. Derselbe Auftrag ergibt dasselbe Level. Er kennt alle vier Grade
  (Ticket 20), je ohne Kernidee und mit jeder der sechs Kernideen (`angebot()`, Ticket 19); ein anderer Auftrag wirft.
  `schwierigkeit` ist wahlweise eine Ziel-Schwierigkeit `[von, bis]` (beide eingeschlossen), die den Grad
  überschneidet; wirksam ist der Teil im Grad. Ohne sie gilt der ganze Grad.
  - **Ablauf** (für alle Grade gleich): Der Baustein der Kernidee (`bausteine/`, je Kernidee einer) baut sie gezielt
    in ein leeres Feld (`bau.mjs`); das Ergänzen setzt Quellen, drehbare Elemente am Ende der Strahlen, Filter, feste
    Spiegel und Ziele an die Strahlenden bis zur Grösse, die die Vorgabe des Grads würfelt (`vorgaben.mjs`, ersetzt die
    Profile); das Festigen (`schritte.mjs`) färbt die Ziele, nimmt Elemente ohne Licht weg, stellt die Eindeutigkeit mit
    höchstens zwei Reparaturen her (Blocker oder fester Spiegel; die Suche im Modus unique) und nimmt wirkungslose
    Elemente weg. Dann kommt eine Startstellung mit genug Klicks (sonst eine neue, statt zu verwerfen). Zuletzt die
    Beurteilung, zuerst günstig ohne die teuren Regeln, dann voll, über denselben Zwischenstand. Stimmen Grad oder
    Ziel-Schwierigkeit nicht, oder findet die Vorprüfung Füllteil oder Zerfall, macht ein Schritt des Verfeinerns
    (`verfeinern.mjs`) das Level leichter (ein drehbares Element weniger) oder schwerer (eines mehr, möglichst auf einer
    Kreuzung zweier Strahlen, das verbindet Stränge), höchstens `schritte`-mal je Grad, und es wird neu beurteilt. Ab
    „mittel“ setzt schon das Ergänzen einen Teil der Elemente auf solche Kreuzungen, und ein zu kleiner Bau wächst mit
    „schwerer“, bevor er verworfen wird.
  - **Kernideen ab „mittel“** (Ticket 28): Ein Strang der Kernidee darf kein Füllteil und nicht abgetrennt sein, ihre
    Ziele darf „schwerer“ aber nicht öffnen. Darum bauen Abschalten, Farben abzählen und Lockvogel ihre Stränge dort
    verbunden (siehe Bausteine), und „schwerer“ dockt Stränge dieser Bausteine an (`andocken.mjs`; beim Lockvogel
    findet es am Ring nichts dazu): fremdes Licht auf einen Spiegel des Strangs oder ein Prisma vor seine Quelle, die
    übrigen Grundfarben gehen zur Seite. Neue Quellen des Andockens, bei Farben abzählen und Lockvogel auch die des
    Ergänzens, teilen keine Grundfarbe mit den Zielen der Kernidee; auch das Andocken setzt nicht mehr Quellen, als der
    Grad erlaubt. Ein Versuch von „schwerer“ ohne ein drehbares Element mehr endet ab „mittel“ vor dem Festigen.
    „leicht“ bleibt bitgleich.
  - **Vier Bedingungen** für jedes gelieferte Level: genau eine Lösung, kein Grund der Levelliste (`levelliste.mjs`:
    kein Ausschlussgrund, ab „mittel“ eine nötige Kernidee und der Mindest-Spielwert), der verlangte Grad nach
    `grad.mjs` und die verlangte Kernidee nötig. Dazu hält es die Quellen der Vorgabe seines Grads ein, wie die Level
    im Spiel (ab „mittel“ 2–3 bzw. 2–4): Mehr setzt der Generator nicht (Ticket 28), und ein fertiges Level mit zu
    wenigen verwirft er mit „zu wenige Quellen“ (Ticket 29; das Festigen kann eine Quelle als wirkungslos wegnehmen).
  - **Keine wirkungslosen Elemente** (Regel des Generators, kein Ausschlussgrund): Jeder Filter nimmt einem Strahl der
    Lösung Farbe, gibt keine fremde Farbe ab und zählt für die Lösung; jede Quelle bringt einem Ziel Licht; jedes Ziel
    hängt von einem drehbaren Element ab; jeder feste Spiegel und Blocker zählt für die Lösung (ohne ihn bekäme ein Ziel
    anderes Licht, oder es gäbe eine zweite Lösung). Ausgenommen sind die Lockvögel ihres Bausteins (feste Teile der
    Kernidee ohne Licht in der Lösung): Sie prüft die volle Beurteilung mit dem Licht der Suche ohne Abschneiden.
  - **Bausteine** (`bausteine/`, Ticket 19; gemeinsame Hilfen in `wege.mjs`): Mischziel (zwei Quellen auf ein Ziel),
    Abschalten (ein Spiegel lenkt eine Quelle auf kurzem Weg aufs Ziel, die Lösung bringt dessen Farbe über zwei Spiegel
    aus einer zweiten), Farben abzählen (Ring aus vier Spiegeln, zwei Quellen derselben Grundfarbe erreichen jeden
    Ausgang, eine dritte von aussen), Sammelstelle (ein Prisma bricht zwei Zuläufe zu je einem eigenen Ziel), Falle
    (ein Prisma bricht eine Grundfarbe direkt aufs Ziel, die Lösung bringt sie über einen Spiegel; eine übrige
    Grundfarbe führt in der Falle über zwei Spiegel in den Holzweg) und Lockvogel (Ringtausch dreier Quellen, ein fester
    Spiegel oder Blocker verstellt ihn). Ab „mittel“ (Ticket 28): Beim Abschalten bekommt A immer ein eigenes Ziel,
    wo es geht über einen zweiten Spiegel, an den fremdes Licht andockt; Farben abzählen ist ein Weichenring (drei
    Quellen an drei Ecken, eine in einer Mischung mit der Grundfarbe); beim Lockvogel steht vor jedem Spiegel des Rings
    ein Prisma.
  - **Nur über die Feldform:** Zellen, Nachbarn, Richtungen, Stellungen und die Wirkung der Elemente kommen aus der
    Feldform des Auftrags, neue Elemente aus `feldform.element`, Quellen aus `feldform.quelleStatt`. Drehbare
    Elemente und feste Spiegel des Ergänzens bekommen eine der Drehachsen der Feldform (`feldform.drehachsen`,
    `bau.varianten`, Ticket 22): Gewählt wird unter allen Drehachsen und Stellungen, die das Licht sinnvoll
    weitergeben. Eine Quelle bekommt die erste Drehachse, mit der sie in die verlangte Richtung leuchtet. Im flachen
    Feld gibt es nur y, dort bleibt alles wie vorher; im Würfel lenkt ein Element mit waagrechter Achse Licht zwischen
    die Ebenen. Die Bausteine der Kernideen setzen ihre Spiegel und Prismen mit der ersten Drehachse. Der Test sucht im
    Quelltext nach Koordinaten (auch y), Drehachsen (`axis` der Leveldaten, Namen wie `'x'`) und Richtungen.
  - **Gedeckelt:** `generiere` bricht ab, wenn der Prozess nicht mit tiefster Priorität läuft oder `LEISE_CPU` über 50
    liegt (über `LEISE_MAX_CPU`, wo gesetzt). Aufruf:
    `LEISE_CPU=50 sh tools/leise.sh node tools/generiere.mjs <auftrag> [--anzahl N] [--seed S] [--seeds M]` (Aufträge
    `<grad>` oder `<grad>-<kernidee>` für die Grade `leicht`, `mittel`, `schwer`, `"sehr schwer"` und die Kernideen
    `mischziel`, `abschalten`, `abzaehlen`, `sammelstelle`, `falle`, `lockvogel`, etwa `mittel-abschalten`; ohne
    Auftrag nennt es alle) schreibt je Level eine JSON-Zeile `{ seed, level, schwierigkeit, spielwert, kernideen,
    hauptKernidee }` auf stdout und die Gründe der Seeds ohne Level auf stderr; mit `| node tools/show.mjs` als
    Textfeld. `--schwierigkeit VON,BIS` gibt dem Auftrag eine Ziel-Schwierigkeit, etwa für eine Lücke beim Austausch
    (Ticket 23). Messen: `LEISE_CPU=50 sh tools/leise.sh node tools/bench.mjs generator <auftrag …> [--seeds N]` (etwa
    `mittel mittel-mischziel`, ohne Angabe 2000 Seeds je Auftrag; ohne Auftrag nennt es alle).
  - **Erweitern:** Eine weitere Kernidee ist ein Baustein in `bausteine/` mit einer Zeile in `bausteine/index.mjs`
    (Glossarbegriff, was er mindestens setzt, `baue`), ein weiterer Grad eine Vorgabe in `vorgaben.mjs`. Ob eine
    Kernidee nötig ist, entscheidet immer die Beurteilung.
- **KI-Tester** (`tools/ki-tester/`, nur für die Entwicklung; ADR 0002, Spec „KI-Tester“): Zwei KI-Tester beurteilen
  Level aus Spielersicht, jeder als eigener KI-Agent. Das Repo bereitet ihre Eingaben vor und führt ihre Antworten
  zusammen; es ruft selbst keine KI auf. Ablauf 2 (Ticket 16) rechnet mit den Plätzen der Reihenfolge im Spiel und
  den Graden der Leveldaten; ein Platz bei `prepare.mjs` ist also ein Platz im Spiel. Ablauf 1 rechnete mit den
  Plätzen der heutigen Reihenfolge vor Ticket 15 (feste Namensliste `tools/beurteilung/heutige-reihenfolge.json`) und
  den vorläufigen Graden.
  - **Vorbereiten:**
    `LEISE_CPU=50 sh tools/leise.sh node tools/ki-tester/prepare.mjs <lauf> [platz …] [--kandidaten datei] [--anker]
    [--ohne-bilder] [--ohne-zwischenspeicher]`. Die Level heissen L1, L2 … (feste Mischung, der Platz bleibt
    verborgen), die Anker A1–A8 (`anchors.json`, je zwei pro Grad mit Begründung). `--anker` lässt auch die Anker
    beurteilen (Probelauf). `--kandidaten` nimmt neue Level ohne Platz im Spiel auf (Austausch, Läufe `ersatz-…`): eine
    JSON-Liste `{ formel, level }`, etwa die Ausgabe von `ordne-level.mjs --austausch … --json`; Referenz ist der Platz
    nach der Formel mit dem Grad dort, im Protokoll heisst ein Kandidat „Kandidat <Abdruck>“, und seine Bilder kommen
    von einer Kopie von index.html mit den Kandidaten am Ende von `LEVELS` (`<lauf>/seite/`, ausserhalb von `eingabe/`).
    Die Bilder der Anker kommen aus einem Zwischenspeicher (`tests/output/ki-tester/anker-bilder/`), solange sich nichts
    geändert hat, was sie beeinflusst: Fingerabdruck des Ablaufs, `index.html`, `vendor/`, `backgrounds/`, `shots.mjs`,
    `chrome.mjs`, der Chrome selbst, Leveldaten, Platz und Kennung des Ankers. `--ohne-zwischenspeicher` nimmt sie neu
    auf. Unter `tests/output/ki-tester/<lauf>/` entstehen:
    - `eingabe/`: das Feld als Text je Level (`field.mjs`: Raster, Elemente, Licht der Startstellung, ohne Lösung, Name
      und Markierung), Screenshots der Startstellung auf Desktop und Handy (`shots.mjs`) und das Schema der Antwort;
    - `antwort-A/` und `antwort-B/`: je KI-Tester ein eigener, leerer Ordner für seine `urteile.json`;
    - `auftrag-A.md`, `auftrag-B.md` (aus `brief.md`) und `lauf.json` für `merge.mjs` (Namen, Referenz je Level,
      Plätze der Anker, Reihenfolgen, Version, Fingerabdruck, Modell und Agent-Typ). Sie liegen ausserhalb der Ordner,
      die die KI-Tester lesen und schreiben.
  - **Beurteilen:** Der Koordinator startet je KI-Tester einen eigenen KI-Agenten mit frischem Kontext: Agent-Typ
    `general-purpose`, Modell `claude-opus-5-5` (so in `lauf.json`), als Prompt nur der Inhalt von `auftrag-A.md`
    bzw. `auftrag-B.md`. Keiner sieht Auftrag oder Antwort des anderen, und sie beurteilen in verschiedener Reihenfolge
    (A gemischt, B umgekehrt). Ein KI-Tester liest nur `eingabe/` und schreibt nur seine `antwort-A/urteile.json` bzw.
    `antwort-B/urteile.json`: eine Liste von Urteilen nach `answer.schema.json` (Aha-Moment, Lesbarkeit auf Desktop
    und Handy, Gefühl 1–5, Einordnung zwischen den Ankern, Ablehnung als Liste von Begriffen aus „Was Spass verdirbt“,
    Begründung).
  - **Zusammenführen:** `node tools/ki-tester/merge.mjs <lauf> [--trocken]` prüft beide Antworten und hängt je Level
    einen Eintrag an `protocol.jsonl` an: Datum, Version des Ablaufs, Modell und Agent-Typ, beide Einzelurteile samt
    ihren Listen der Ablehnung, Ergebnis und Begründung. Danach `node tests/ki-tester.test.mjs`. Die Regeln stehen in
    `protocol.mjs`:
    - **Ablehnen:** Die KI-Tester nennen jeden zutreffenden Begriff, unabhängig vom Grad. Abgelehnt ist ein Level, wenn
      beide mindestens einen Begriff nennen, der beim Grad der Referenz gilt (Füllteil und Zerfall erst ab „mittel“).
      Ein abgelehntes Level wird nicht verschoben.
    - **Bereich einer Einordnung:** zwischen zwei Ankern, beim Anker selbst und seinen Nachbarn, vor A1 oder nach A8.
      Liegt der Platz des Levels ausserhalb, will der KI-Tester bis an den nächsten Rand des Bereichs.
    - **Verschieben:** nur, wenn beide in dieselbe Richtung wollen: um den kleineren Wunsch, höchstens 5 Plätze und nie
      über eine Gradgrenze.
    - **Anker** sind eine feste Auswahl, keine festen Plätze (Spec, User Story 43: „je zwei feste Anker pro
      Schwierigkeitsgrad“). Fest ist, welche Level die Anker sind, damit „schwerer als A3“ für beide KI-Tester und
      in jedem Lauf dasselbe Level meint. Ein Anker wird durch sein eigenes Urteil nie verschoben. Andere Level dürfen an ihm vorbei; er rückt dann um einen Platz und bleibt in
      seinem Grad. Feste Plätze hiessen, dass ein Level vor einem Anker bleiben muss, obwohl beide KI-Tester es
      schwerer finden. Die Bereiche eines Laufs rechnen mit den Plätzen der Anker aus `lauf.json`.
    - **Probeläufe** (`probelauf-…`) zeigen nur den Ablauf; ihre Korrekturen gelten in Ticket 15/16 nicht.
  - **Referenz** (Ablauf 2): der Platz in der Reihenfolge im Spiel und der Grad aus den Leveldaten (`grad`). Die
    Grenzen eines Grads gibt die Reihenfolge vor (seit Ticket 16 leicht 1–31, mittel 32–105, schwer 106–137, sehr
    schwer 138–150); sie verschieben sich mit jeder Verschiebung. `prepare.mjs` hält je Level die Referenz und die
    Plätze der Anker in `lauf.json` fest, und `merge.mjs` rechnet mit ihnen. Für ein Level der Prüfliste ist das sein
    alter Platz; ob es auf den Platz der Formel kommt, entscheidet `ordne-level.mjs` aus den zählenden Einträgen (Regel
    in `levelliste.mjs`, siehe dort; nur Läufe `pruefung-…` zählen). Die Anker werden über den Namen gefunden; der Test
    prüft, dass jeder in seinem Grad am richtigen Ende bleibt: im äussersten Drittel, oder zwischen ihm und dem Ende
    taugt kein Level als Anker (kein Ausschlussgrund, nicht auf der Prüfliste).
  - **Version und Fingerabdruck:** `VERSION`, `FINGERPRINT` und `VERSIONS` in `protocol.mjs`; die Version steht in
    jedem Eintrag. Der Fingerabdruck umfasst alles, was die KI-Tester sehen: die Aufträge aus `brief.md` samt den Zeilen
    der Listen, `anchors.json`, das Schema, das Glossar und das Feld als Text der Anker samt ihren Leveldaten, nicht
    aber die Bilder. Ändert sich davon etwas oder die Regel, kommt eine neue Version: Test, `prepare.mjs` und
    `merge.mjs` melden einen anderen Fingerabdruck, und `merge.mjs` nimmt nur Läufe der aktuellen Version mit ihrem
    Fingerabdruck an. Einträge älterer Versionen bleiben gültig; der Test prüft jeden nach der Referenz seiner Version
    (Ablauf 1: 43 Einträge, heutige Reihenfolge und vorläufige Grade).
  - **Screenshots:** `shots.mjs` lädt je Level die Seite mit `?t=12` neu, spult Herauswachsen und Aufleuchten mit
    `__prismaDebug.settle` vor (nur für Tests, das Spiel ruft es nie auf) und nimmt erst auf, wenn zwei Aufnahmen nach
    weiterem Vorspulen byte-gleich sind. Das dauert 26,6 s je Aufnahme (ein Level auf einem Bildschirm) statt 150 s;
    die Bilder sind byte-gleich mit denen nach 150 s Warten.
    `sh tools/leise.sh node tools/ki-tester/shots.mjs <ordner> <platz …>` nimmt Level (Platz im Spiel) mit der
    Kopfzeile wie im Spiel auf.
- **Vorrat und Lader** (`.scratch/noa-geschichte/`, Ticket 02; nur für die Entwicklung): Level, die nicht im Spiel
  stehen, liegen versioniert in `tools/vorrat/` (`flach.js`, `wuerfel.js`): je Level sein Block aus `index.html`
  Zeile für Zeile (Lösung und Herkunft im Kommentar, Name, wahlweise `titel`, Grad, Elemente, Lösung), darüber
  `// Platz im Spiel: nach „<Name>“`, das Level unmittelbar davor in der ganzen Folge aus Spiel und Vorrat.
  `node tools/vorrat.mjs ablegen <name …> [--flach] [--wuerfel] [--grad <grad>] [--datei <datei>]` nimmt Level aus
  `index.html` (das Tutorial bleibt), `zurueckholen` mit denselben Angaben oder `--alle` setzt sie an ihren Platz
  zurück, `liste` zeigt den Vorrat je Art und Grad; hin und zurück ist `index.html` byte-gleich. Der gemeinsame Lader
  (`tools/lader.mjs`) liefert `ALLE` (`LEVELS`, `TUTORIAL_COUNT`, `LEVELS_3D` wie nach dem Zurückholen aller, die Level
  im Spiel als dieselben Objekte wie in `solver.mjs`), `VORRAT`, `ort(name)` und `alleText()` (`index.html` mit allen
  Leveln). Wer alle Level braucht, liest über ihn; `ordne-level.mjs` und `ordne-wuerfel.mjs` rechnen mit ihm, schreiben
  aber nur, wenn ihre Art nicht im Vorrat liegt.
- **Levels:** in `LEVELS` (index.html): zuerst das Tutorial (`tutorial: true`, je ein Hinweis zur Mechanik in der
  Kopfzeile, auch im Handy-Querformat; 9 Level mit je einem Gedanken: Ziel und Spiegel, drehbar/fest, Block,
  Prisma, verschwindendes Licht, Filter, farbige Quellen, Mischen auf dem Ziel, Kombinator), danach 150 Level, seit
  Ticket 15 nach der Schwierigkeit der Beurteilung geordnet (`tools/ordne-level.mjs`): Ohne die KI-Tester wandert kein
  Level mehr als 10 Plätze. Über die 51 Level, die nach der Formel weiter wandern würden (Prüfliste in
  `tools/levelliste.json`), haben in Ticket 16 die KI-Tester geurteilt: 28 stehen nach der Formel, die übrigen an
  ihrem alten Platz, dazu ihre Korrekturen und zwei Züge der Häufungsregel. In Ticket 23 kamen für die 6 leichten
  Level mit Ausschlussgrund 6 neue aus dem Generator (Sammellinse, Strahlteiler, Amethyst, Fackellauf, Fernlicht,
  Blitz; je mit Herkunft im Kommentar), nach der Formel eingeordnet und von den KI-Testern geprüft (Lauf
  `ersatz-leicht-1`); die ersetzten stehen nur noch als feste Kopie für die Eichung in
  `tools/beurteilung/entfernte-level.json`. Ebenso kamen 8 neue sehr schwere Level in Ticket 26 (Lauf
  `ersatz-sehr-schwer-1`) und 30 neue mittlere in Ticket 24 (Läufe `ersatz-mittel-1` bis `-5`): für die 13 mit
  Ausschlussgrund oder Ablehnung und für 17 ohne erkannte Kernidee, die die KI-Tester schwach beurteilten, dazu 15 neue
  schwere in Ticket 25 (Läufe `ersatz-schwer-1` und `-2`): für die 13 mit Ausschlussgrund, Lichthof und Sternwarte.
  27 mittlere und 4 schwere Level, die nur wegen Kernidee oder Spielwert auf der Duldungsliste stehen, bleiben nach
  ihrem Urteil (Gruppe `behalten` in `tools/levelliste.json`); seit Ticket 25 stehen nur noch sie auf der Liste, alle
  vier Grade sind ausgetauscht. Die frühere Reihenfolge entstand so: Die Level 121–150 (aus `harden.mjs`)
  waren alle schwerer als die ersten 120. 70 der ersten 120 sind
  mittelschwere Level, nachträglich einsortiert: zuerst 20 zwischen die damaligen Level 16 und 68 (Review zweier
  Tester in `tools/pools/mittel/review/`), dann 50 zwischen die damaligen Level 40 und 69 (vor Ticket 15 die Plätze
  40–119; Review von drei Testern aus Spielersicht und einem Spielermodell in `tools/pools/mittel2/review/`; beides
  nicht versioniert); die Namen wandern mit ihren Leveln, umbenannt wurde nichts. Jede Lösung steht als Kommentar und
  im Feld `solution`. Jedes Level nach dem Tutorial trägt seinen Grad im Feld `grad` (leicht 1–31, mittel 32–105,
  schwer 106–137, sehr schwer 138–150). Das Spiel zeigt ihn (Ticket 17, `GRAD_ANZEIGE`) als Punkte von leicht ●○○○
  bis sehr schwer ●●●● oben rechts auf der Kachel der Levelauswahl, mit Punkten und Text in der Kopfzeile (hinter dem
  Namen, auf dem Handy hochkant in einer eigenen Zeile darunter) und als Text im Seitentitel, gemischt als Bereich
  („Leicht bis Mittel“). Das Tutorial hat keinen Grad. Eigene Farben haben die Grade nicht, weil Rot, Grün und Blau
  Lichtfarben sind: Volle und leere Punkte unterscheiden sich in der Form, und Screenreader lesen den Grad als Text (in
  der Kopfzeile und im Namen der Kachel). Die Punkte sind gezeichnet (CSS), nicht aus der Schrift. Die Levelauswahl
  blättert in Seiten (Tutorial, 1–10, 11–20 … 141–150; ab 9 Seiten in zwei Reihen) – reine Seiten, keine Themen.
  Alle Level sind jederzeit spielbar, nichts muss freigeschaltet werden. Fortschritt und aktuelles Level bleiben
  im Browser gespeichert (nach Levelname).
  Wichtig: Der Levelname ist der Speicherschlüssel des Fortschritts; ein Umordnen ändert ihn nicht (geprüft in
  `tests/levelliste.test.mjs`). Die Namen der 150 wurden einst der Position nach vergeben (bis Ticket 21 in
  `tools/profiles.mjs`; als feste Liste in `tools/beurteilung/heutige-reihenfolge.json`) – nach dem Veröffentlichen
  nicht mehr umbenennen. Entfernte Namen kommen auf die Liste in `tools/levelliste.json` und werden nie wieder
  vergeben; jeder Name der festen Liste steht im Spiel oder auf dieser Liste (geprüft in `tests/levelliste.test.mjs`).
  Die Tests probieren alle Stellungen durch und prüfen, dass jede Lösung stimmt und eindeutig ist.
