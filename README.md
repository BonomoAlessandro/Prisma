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
  - `node tests/beurteilung.test.mjs` prüft die Beurteilung (etwa 1 s): den Einstieg, die Feldform und je Regel eine
    Datei in `tests/beurteilung/` (einzeln aufrufbar, eine neue Datei läuft ohne Eintrag mit). Jede Regel wird an
    kleinen, von Hand gebauten Leveln geprüft und an den 150 heutigen Leveln mit den Zahlen der Neuzählung aus der Spec.
    `helfer.mjs` baut die Mini-Level (Elemente in Lösungsstellung) und beurteilt die 150 einmal je Lauf, mit dem
    vorläufigen Grad nach dem heutigen Platz.
  - `node tests/ki-tester.test.mjs [protokoll]` prüft den Ablauf der KI-Tester: Schema der Antworten, Zusammenführen
    (Ablehnen nur gemeinsam, Korrektur höchstens 5 Plätze und nie über eine Gradgrenze, Anker), Feld als Text, Auftrag
    und Fingerabdruck der Eingaben und das versionierte Protokoll `tools/ki-tester/protocol.jsonl`, dazu Gegenproben mit
    verfälschten Kopien, die mit der erwarteten Meldung rot werden. Mit dem Pfad einer eigenen verfälschten Kopie wird
    er rot.
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
  Generator) laufen darüber, nie mehrere gleichzeitig;
  `chrome.mjs` steuert Headless-Chrome über das DevTools-Protokoll (für `tests/screenshot.mjs` und die KI-Tester).
- **Beurteilung** (`tools/beurteilung/`, nur für die Entwicklung; ADR 0002, Spec „Beurteilung“ und „Feldform“): ein
  Modul mit einem Einstieg, `beurteile(level, { grad })` aus `index.mjs`. Es liefert Schwierigkeit, Spielwert,
  Kernideen, Mischziele und Ausschlussgründe (je mit Glossarbegriff und Begründung). `offen` nennt die Teile, die noch
  keine Regel berechnet; heute sind es alle ausser den Mischzielen. `grad` gibt den Schwierigkeitsgrad vor, bis die
  Beurteilung ihn selbst bestimmt (Tickets 12 und 15).
  - **Feldform** (`feldform.mjs`): Zellen, Nachbarn, Richtungen, Drehachse und mögliche Stellungen eines Elements. Nur
    sie kennt Koordinaten und die acht Richtungen; eine Zelle ist ein Schlüssel wie in der Lösung („x,z“). Auf main gibt
    es nur die flache Feldform, eine weitere (Würfel) kommt in `feldformVon` dazu.
  - **Regeln:** Jede liegt in einer eigenen Datei: `mischziele.mjs`, je Ausschlussgrund eine in `ausschluesse/`, je
    Kernidee eine in `kernideen/`, dazu `schwierigkeit.mjs` und `spielwert.mjs`. Sie steht mit einer Zeile in
    `regeln.mjs`, unter der Kommentarzeile ihres Tickets. Wie eine Regel aussieht, steht im Kopf von `index.mjs`. Was
    mehrere Regeln brauchen (Strahlbilder der Lösungsstellung in `loesungsstellung.mjs`, später Suchen und
    Spielermodell), rechnet `ctx.merke` einmal je Beurteilung.
  - **Mischziele:** Gemessen in der Lösungsstellung. Ein Ziel mit Mischfarbe ist ein Mischziel, wenn es ohne die
    mischenden Kombinatoren (dort Blocker, bis keiner mehr mischt) keinen Strahl bekommt, der seine Farbe schon hat; so
    zählen Weiss aus einer weissen Quelle und Gelb aus einem Gelbfilter nicht. Es ist aus zwei Quellen, wenn mindestens
    zwei Quellen je allein Licht darauf bringen (die übrigen schlucken dabei als Blocker). Das ist noch nicht die
    Kernidee „Mischziel aus zwei Quellen“ (Ticket 10). Die alte Zählung `mixed` in `metrics` (Ziele mit Mischfarbe, 129
    statt 71 Level) bleibt bis Ticket 21 für den Golden-Test.
- **KI-Tester** (`tools/ki-tester/`, nur für die Entwicklung; ADR 0002, Spec „KI-Tester“): Zwei KI-Tester beurteilen
  Level aus Spielersicht, jeder als eigener KI-Agent. Das Repo bereitet ihre Eingaben vor und führt ihre Antworten
  zusammen; es ruft selbst keine KI auf.
  - **Vorbereiten:** `sh tools/leise.sh node tools/ki-tester/prepare.mjs <lauf> [platz …] [--anker] [--ohne-bilder]`.
    Die Level heissen L1, L2 … (feste Mischung, der heutige Platz bleibt verborgen), die Anker A1–A8 (`anchors.json`,
    je zwei pro Grad mit Begründung). `--anker` lässt auch die Anker beurteilen (Probelauf). Unter
    `tests/output/ki-tester/<lauf>/` entstehen:
    - `eingabe/`: das Feld als Text je Level (`field.mjs`: Raster, Elemente, Licht der Startstellung, ohne Lösung, Name
      und Markierung), Screenshots der Startstellung auf Desktop und Handy (`shots.mjs`) und das Schema der Antwort;
    - `antwort-A/` und `antwort-B/`: je KI-Tester ein eigener, leerer Ordner für seine `urteile.json`;
    - `auftrag-A.md`, `auftrag-B.md` (aus `brief.md`) und `lauf.json` für `merge.mjs` (Namen, Plätze, Reihenfolgen,
      Version, Fingerabdruck, Modell und Agent-Typ). Sie liegen ausserhalb der Ordner, die die KI-Tester lesen und
      schreiben.
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
  - **Referenz:** Heute ist es der Platz in der heutigen Reihenfolge mit den vorläufigen Graden (1–30, 31–100,
    101–140, 141–150). Ab Ticket 15/16 wird es der Platz nach der Formel, und der Grad folgt den Schwellen der
    Schwierigkeit. Dann kommt der alte Platz als zweites Feld in die Referenz (neue Version): Ein Level geht nur auf den
    Platz der Formel, wenn für beide KI-Tester dieser Platz in ihrem Bereich liegt oder näher daran als der alte; sonst
    bleibt es am alten Platz. Von dort aus gilt dieselbe Korrektur. Die Anker werden über den Namen gefunden und haben
    nach dem Umsortieren ihre neuen Plätze; der Test prüft, dass jeder in seinem Grad am richtigen Ende bleibt.
  - **Version und Fingerabdruck:** `VERSION` und `FINGERPRINT` in `protocol.mjs`; die Version steht in jedem Eintrag.
    Der Fingerabdruck umfasst alles, was die KI-Tester sehen: die Aufträge aus `brief.md` samt den Zeilen der Listen,
    `anchors.json`, das Schema, das Glossar und das Feld als Text der Anker samt ihren Leveldaten, nicht aber die
    Bilder. Ändert sich davon etwas oder die Regel, kommt eine neue Version: Test, `prepare.mjs` und `merge.mjs` melden
    einen anderen Fingerabdruck, und `merge.mjs` nimmt nur Läufe der aktuellen Version mit ihrem Fingerabdruck an.
  - **Screenshots:** `shots.mjs` lädt je Level die Seite mit `?t=12` neu, spult Herauswachsen und Aufleuchten mit
    `__prismaDebug.settle` vor (nur für Tests, das Spiel ruft es nie auf) und nimmt erst auf, wenn zwei Aufnahmen nach
    weiterem Vorspulen byte-gleich sind. Das dauert 26,6 s je Aufnahme (ein Level auf einem Bildschirm) statt 150 s;
    die Bilder sind byte-gleich mit denen nach 150 s Warten.
    `sh tools/leise.sh node tools/ki-tester/shots.mjs <ordner> <platz …>` nimmt Level mit der Kopfzeile wie im
    Spiel auf.
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
