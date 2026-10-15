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
- **Plan und offene Punkte:** siehe [PLAN.md](PLAN.md) – was noch umgesetzt werden soll, Entscheidungen, Erledigtes.
- **Icon:** `favicon.svg` (Prisma mit Farbfächer), PNG-Varianten in `icons/` (iOS 180 px, Android 192/512 px),
  dazu `icon-maskable-*.png` für Android, das Icons selbst rund oder eckig zuschneidet (`node tools/icons.mjs` erzeugt
  sie aus `favicon.svg`: ohne Ecke, Inhalt verkleinert in die Schutzzone).
- **Name und Manifest:** Im Store und beim Installieren heisst das Spiel „Prisma – Licht-Puzzle“, auf dem
  Startbildschirm „Prisma“. `manifest.webmanifest` (feste `id` „prisma“, nicht mehr ändern) wird nur über http(s)
  eingebunden, über file:// blockiert es der Browser.
- **Tests:**
  - `node tests/logic.test.mjs` prüft die Strahllogik.
  - `node tests/golden.mjs` vergleicht die Strahlbilder aller flachen Level (Start- und Lösungsstellung) mit
    `tests/golden.json`, dazu Löser und alte Wertung (`score`) für das Tutorial und jedes 10. Level: das Verhalten
    exakt, Kommazahlen auf 1e-9 genau (etwa 5 s). `--voll` vergleicht den Löser für alle 159 Level (etwa 20 s),
    vor und nach Änderungen am Löser. `--schnell` vergleicht nur die Strahlbilder, ohne Löser und alte Wertung
    (etwa 1 s), für Zwischenschritte eines Umbaus. Nach mehreren Schritten, am Schluss und immer, wenn der Löser berührt
    ist, läuft er ohne `--schnell`. `--write` schreibt die Referenz neu, aber nur bei einer bewussten Änderung des
    Verhaltens; ein Umbau der Strahlregel oder des Lösers muss gegen die bestehende Referenz grün bleiben.
  - `node tests/offline.mjs` prüft den Offline-Betrieb (`--redirect`: Server leitet index.html weiter).
  - `node tests/screenshot.mjs` rendert Screenshots per Headless-Chrome nach `tests/output/`.
  - `node tests/screenshot.mjs perf 1280 800 200 "$(cat tests/perf-probe.js)"` vergleicht die Kosten der Renderstufen.
  - `node tests/screenshot.mjs interaction 1440 900 800 "$(cat tests/interaction-probe.js)"` simuliert Klick,
    Rechtsklick, Ziehen und Hover.
- **Steuerung:** Klick/Tap dreht ein Element um 45°, Rechtsklick oder langes Drücken zurück, Ziehen dreht die Kamera rund ums Feld.
  Schaltflächen unten rechts: Level neu starten, Ton an/aus, Hintergrund (Milchstrasse, Sonnensystem, Wald oder Strand, der Reihe nach), Levelauswahl.
  Tasten: N / → nächstes Level, P / ← voriges Level, R neu starten, M Ton, H Hintergrund, L Levelauswahl,
  Enter weiter (nach dem Lösen), Esc schliessen, F Leistungsanzeige.
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
  Objekte, Nebellagen, Leuchtpunkte, bewegtes Wasser), sind Ebenentypen mit Parametern (`SKY_LAYERS`). `backgrounds/`
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
- **Level-Werkzeuge** (`tools/`, nur für die Entwicklung):
  `solver.mjs` folgt den Strahlen und probiert nur Elemente durch, die Licht bekommen (schneidet ab, sobald ein Ziel
  falsches Licht erhält; die Verfolgung macht nach jeder gesetzten Stellung dort weiter, wo sie angehalten hat), und
  misst die Schwierigkeit (`metrics`: Suchknoten, erreichbare Stellungen, Rateschritte, berührte Elemente, Ziele –
  zusammen `score`; Klicks nur zur Info, sie hängen von der Startverdrehung ab). Ist nur die Eindeutigkeit gefragt,
  hält `solve(level, { unique: true })` bei der zweiten Lösung an;
  `generate.mjs <profil> <anzahl> [seed] [maxseeds] [--jobs N] [--time S]` erzeugt eindeutig lösbare Level nach
  einem Profil aus `profiles.mjs` (Grössenstufe 1–5 × Mischung: nur Spiegel, Prisma, Filter, farbige Quellen,
  Kombinator, bunt gemischt);
  `pools.mjs [profil …] [--count N] [--jobs N] [--minutes M]` erzeugt für jedes Profil einen Kandidaten-Pool in
  `tools/pools/` (nicht versioniert; alle Profile dauern mit 13 Prozessen bis zu 2,5 Stunden);
  `quality.mjs` prüft, ob ein Level das Feld nutzt (Fläche, Quadranten, Rand), ob mehrere Quellen gekoppelt sind
  und ob es Zusammenspiel gibt (Kreuzungen, Mehrfachtreffer, geteilte Spiegel, Lockvögel, die beim Probieren Licht
  bekommen) – Generator und Kuratierung verwerfen Level, die das nicht erfüllen;
  `harden.mjs [anzahl] [seed] [--min W] [--max W] [--steps K] [--jobs N] [--time S]` macht Level schwerer, als
  der Generator sie in einem Zug findet (heute Level 121–150): Es startet bei einem erzeugten Level der Stufe 3–4 und
  verändert es Schritt für Schritt (Element auf einen Strahl setzen, festen Spiegel drehbar machen, Ziel
  verschieben, Lockvogel, Quelle …), stellt nach jedem Schritt die Eindeutigkeit her und behält, was die Wertung
  plus Zusammenspiel erhöht (Simulated Annealing). Verworfen wird, was in unabhängige Teilrätsel zerfällt oder
  zum Knäuel wird (Feld kaum dichter als bei den ursprünglichen 50 Leveln, auch nach dem Abschluss geprüft); am Ende
  gelten dieselben Prüfungen wie beim Generator (Ausgabe wie `generate.mjs`, z. B. nach `tools/pools/harden.jsonl`);
  `show.mjs` zeigt Level als Textfeld (`node tools/generate.mjs 2-prisma 3 | node tools/show.mjs`);
  `curate.mjs [--dry] [--keep N] [--from W] [--to W] [--pools ordner] [--save datei] [--order datei]` wirft alle Pools und
  `candidates.jsonl` (handgebaute Level, früheres Kapitel II) zusammen, wählt so viele Level, wie `NAMES` in
  `profiles.mjs` hat, gleichmässig über die Wertung (verschiedene Grundmuster, abwechselnde Mischungen), sortiert
  sie nach Wertung und schreibt sie zwischen die Markierungen `LEVELS:BEGIN/END` in index.html. `--keep 50` übernimmt
  die ersten 50 Level aus `tools/selection.jsonl` unverändert und wählt nur die übrigen, alle schwerer als das
  schwerste übernommene (mit `--from` gilt diese Untergrenze, so kamen die heutigen 141–150 dazu: `--keep 70 --from 48`;
  die Zahlen 50 und 70 gelten für den Stand vor dem Einfügen der mittelschweren Level);
  `--pools` liest die Kandidaten aus einem anderen Ordner, z. B. einem vorab gesiebten. Mit `--order` wird eine von
  Hand korrigierte Reihenfolge
  übernommen (JSON-Zeilen wie bei `--save`); die endgültige Auswahl liegt in `tools/selection.jsonl`. Ihre
  Reihenfolge stammt aus einem Review zweier Tester (Spielersicht und Spielermodell), weil die Wertung Level mit
  unabhängigen Teilrätseln über- und Farblogik unterschätzt; die Tests verlangen steigende Mittelwerte je 10 Level.
  Rückgabewert 2: zu wenige Kandidaten im Wertungsbereich. Ein Feld `difficulty` in `selection.jsonl` wird als
  Markierung ins Level geschrieben;
  `bench.mjs <generator|trace|solver …> [gruppe …] [--seeds N] [--jobs N] [--unique] [--save datei] [--compare datei]`
  misst die Effizienz in CPU-Zeit, nicht mit der Wanduhr (der Deckel von `leise.sh` verzerrt sie): angenommene Level
  je CPU-Stunde je Profil mit festen Seeds, die mittlere Zeit je Aufruf der Strahlregel auf zufälligen Stellungen
  aller Level und die Zeit des Lösers über alle Level, dazu über die Level mit Blockern ohne diese (sie haben dann
  mehrere Lösungen). `--unique` misst den Löser im Modus unique: Auf den eindeutigen Leveln sucht er gleich weit, ohne
  Blocker hält er bei der zweiten Lösung an. Generator und Abnahme sind austauschbar (`--generator`, `--accept`),
  damit später der neue Generator je Schwierigkeitsgrad und die Beurteilung als Abnahme dazukommen. Die
  Ausgangszahlen stehen in `tools/bench-baseline.json`. `--save` fügt einzeln gemessene Profile dort hinzu, wenn
  Generator, Abnahme, Seeds, `--jobs` und Rechner gleich sind. `--compare` zeigt den Gewinn und meldet andere
  angenommene Level (Fingerabdruck), eine andere Knotenzahl des Lösers und andere Strahlbilder. Deren Prüfsumme
  erfasst Art, Farbe und Element der Ereignisse, Treffer, Mischungen, „gelöst“ und die auf 1e-6 gerundeten Endpunkte,
  aber keine Normalen und Längen; das Verhalten sichert weiterhin der Golden-Test. Die CPU-Zeit hängt von der Zahl
  der Prozesse und von der übrigen Last auf dem Rechner ab (beobachtet 20 bis 50 %): Verglichen wird nur mit
  gleichem `--jobs`, am besten vorher und nachher in derselben Sitzung (alter Stand etwa in einem `git worktree`).
  Das Skript läuft nur mit tiefster Priorität und bricht bei einem höheren Deckel ab: den Generator mit
  `LEISE_CPU=50 sh tools/leise.sh node tools/bench.mjs generator`, Strahlregel und Löser über
  `leise.sh` mit 20 %;
  `leise.sh <befehl …>` (mit `leise.ps1`, nur unter Windows) startet einen Befehl samt allen Unterprozessen in einem
  Job-Objekt mit harter CPU-Obergrenze und Priorität „Leerlauf“, damit der Rechner bedienbar bleibt. Vorgabe sind 20 %
  der ganzen Maschine, der Generator darf `LEISE_CPU=50`. Alle schweren Läufe (Tests, Messungen, Screenshots,
  Generator) laufen darüber, nie mehrere gleichzeitig.
- **Levels:** in `LEVELS` (index.html): zuerst das Tutorial (`tutorial: true`, je ein Hinweis zur Mechanik in der
  Kopfzeile, auch im Handy-Querformat; 9 Level mit je einem Gedanken: Ziel und Spiegel, drehbar/fest, Block,
  Prisma, verschwindendes Licht, Filter, farbige Quellen, Mischen auf dem Ziel, Kombinator), danach 150 Level, allein nach Schwierigkeit sortiert; die Level 121–150 (aus `harden.mjs`) sind alle
  schwerer als die ersten 120, 141–150 mindestens so schwer wie 121–140. 70 der ersten 120 sind mittelschwere Level,
  nachträglich einsortiert: zuerst 20 zwischen die damaligen Level 16 und 68 (Review zweier Tester in
  `tools/pools/mittel/review/`), dann 50 zwischen die damaligen Level 40 und 69 (heute 40–119; Review von drei
  Testern aus Spielersicht und einem Spielermodell in `tools/pools/mittel2/review/`; beides nicht versioniert); die
  Namen wandern mit ihren Leveln, umbenannt wurde nichts. Jede Lösung steht als Kommentar
  und im Feld `solution`. Schwere Level tragen `difficulty: 'schwer'` (Level 120–140) bzw. `'sehr schwer'` (141–150):
  Kopfzeile mit Rauten (◆ bzw. ◆◆) und Text hinter dem Namen (auf dem Handy nur die Rauten), Rauten oben rechts auf
  der Kachel in der Levelauswahl und im Seitentitel, wenn die ganze Seite gleich markiert ist. Die Levelauswahl
  blättert in Seiten (Tutorial, 1–10, 11–20 … 141–150; ab 9 Seiten in zwei Reihen) – reine Seiten, keine Themen.
  Alle Level sind jederzeit spielbar, nichts muss freigeschaltet werden. Fortschritt und aktuelles Level bleiben
  im Browser gespeichert (nach Levelname).
  Wichtig: Der Levelname ist der Speicherschlüssel des Fortschritts. Die Namen in `tools/profiles.mjs` werden der
  Position nach vergeben – nach dem Veröffentlichen nicht mehr umbenennen.
  Die Tests probieren alle Stellungen durch und prüfen, dass jede Lösung stimmt und eindeutig ist.
