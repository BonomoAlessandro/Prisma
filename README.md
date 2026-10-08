# PRISMA

Ein 3D-Licht-Puzzle im Browser: Spiegel und Kristalle drehen, Licht lenken,
mit Prismen in Spektralfarben aufspalten und farbige Ziele treffen.

- **Starten:** `index.html` direkt im Browser öffnen (keine Installation, kein Build-Step).
  Three.js r147 wird per CDN geladen, daher ist eine Internetverbindung nötig.
- **Spezifikation:** siehe [SPEC.md](SPEC.md).
- **Plan und offene Punkte:** siehe [PLAN.md](PLAN.md) – was noch umgesetzt werden soll, Entscheidungen, Erledigtes.
- **Icon:** `favicon.svg` (Prisma mit Farbfächer), PNG-Varianten in `icons/` (iOS 180 px, Android 192/512 px),
  `manifest.webmanifest` für den Startbildschirm – wird nur über http(s) eingebunden, über file:// blockiert es der Browser.
- **Tests:** `node tests/logic.test.mjs` prüft die Strahllogik,
  `node tests/screenshot.mjs` rendert Screenshots per Headless-Chrome nach `tests/output/`,
  `node tests/screenshot.mjs perf 1280 800 200 "$(cat tests/perf-probe.js)"` vergleicht die Kosten der Renderstufen,
  `node tests/screenshot.mjs interaction 1440 900 800 "$(cat tests/interaction-probe.js)"` simuliert Klick, Rechtsklick, Ziehen und Hover.
- **Steuerung:** Klick/Tap dreht ein Element um 45°, Rechtsklick oder langes Drücken zurück, Ziehen dreht die Kamera.
  Schaltflächen unten rechts: Level neu starten, Ton an/aus, Levelauswahl.
  Tasten: N / → nächstes Level, P / ← voriges Level, R neu starten, M Ton, L Levelauswahl,
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
- **Level-Werkzeuge** (`tools/`, nur für die Entwicklung):
  `solver.mjs` folgt den Strahlen und probiert nur Elemente durch, die Licht bekommen (schneidet ab, sobald ein Ziel
  falsches Licht erhält) und misst die Schwierigkeit (`metrics`: Suchknoten, erreichbare Stellungen, Rateschritte,
  berührte Elemente, Ziele – zusammen `score`; Klicks nur zur Info, sie hängen von der Startverdrehung ab);
  `generate.mjs <profil> <anzahl> [seed] [maxseeds] [--jobs N] [--time S]` erzeugt eindeutig lösbare Level nach
  einem Profil aus `profiles.mjs` (Grössenstufe 1–5 × Mischung: nur Spiegel, Prisma, Filter, farbige Quellen,
  Kombinator, bunt gemischt);
  `pools.mjs [profil …] [--count N] [--jobs N] [--minutes M]` erzeugt für jedes Profil einen Kandidaten-Pool in
  `tools/pools/` (nicht versioniert; alle Profile dauern mit 13 Prozessen bis zu 2,5 Stunden);
  `quality.mjs` prüft, ob ein Level das Feld nutzt (Fläche, Quadranten, Rand), ob mehrere Quellen gekoppelt sind
  und ob es Zusammenspiel gibt (Kreuzungen, Mehrfachtreffer, geteilte Spiegel, Lockvögel, die beim Probieren Licht
  bekommen) – Generator und Kuratierung verwerfen Level, die das nicht erfüllen;
  `harden.mjs [anzahl] [seed] [--min W] [--max W] [--steps K] [--jobs N] [--time S]` macht Level schwerer, als
  der Generator sie in einem Zug findet (Level 51–80): Es startet bei einem erzeugten Level der Stufe 3–4 und
  verändert es Schritt für Schritt (Element auf einen Strahl setzen, festen Spiegel drehbar machen, Ziel
  verschieben, Lockvogel, Quelle …), stellt nach jedem Schritt die Eindeutigkeit her und behält, was die Wertung
  plus Zusammenspiel erhöht (Simulated Annealing). Verworfen wird, was in unabhängige Teilrätsel zerfällt oder
  zum Knäuel wird (Feld kaum dichter als bei den ersten 50 Level, auch nach dem Abschluss geprüft); am Ende gelten
  dieselben Prüfungen wie beim Generator (Ausgabe wie `generate.mjs`, z. B. nach `tools/pools/harden.jsonl`);
  `show.mjs` zeigt Level als Textfeld (`node tools/generate.mjs 2-prisma 3 | node tools/show.mjs`);
  `curate.mjs [--dry] [--keep N] [--from W] [--to W] [--pools ordner] [--save datei] [--order datei]` wirft alle Pools und
  `candidates.jsonl` (handgebaute Level, früheres Kapitel II) zusammen, wählt so viele Level, wie `NAMES` in
  `profiles.mjs` hat, gleichmässig über die Wertung (verschiedene Grundmuster, abwechselnde Mischungen), sortiert
  sie nach Wertung und schreibt sie zwischen die Markierungen `LEVELS:BEGIN/END` in index.html. `--keep 50` übernimmt
  die ersten 50 Level aus `tools/selection.jsonl` unverändert und wählt nur die übrigen, alle schwerer als das
  schwerste übernommene (mit `--from` gilt diese Untergrenze, so kamen 71–80 dazu: `--keep 70 --from 48`);
  `--pools` liest die Kandidaten aus einem anderen Ordner, z. B. einem vorab gesiebten. Mit `--order` wird eine von
  Hand korrigierte Reihenfolge
  übernommen (JSON-Zeilen wie bei `--save`); die endgültige Auswahl liegt in `tools/selection.jsonl`. Ihre
  Reihenfolge stammt aus einem Review zweier Tester (Spielersicht und Spielermodell), weil die Wertung Level mit
  unabhängigen Teilrätseln über- und Farblogik unterschätzt; die Tests verlangen steigende Mittelwerte je 10 Level.
  Rückgabewert 2: zu wenige Kandidaten im Wertungsbereich.
- **Levels:** in `LEVELS` (index.html): zuerst das Tutorial (`tutorial: true`, je ein Hinweis zur Mechanik in der
  Kopfzeile, auch im Handy-Querformat; 9 Level mit je einem Gedanken: Ziel und Spiegel, drehbar/fest, Block,
  Prisma, verschwindendes Licht, Filter, farbige Quellen, Mischen auf dem Ziel, Kombinator), danach 80 Level, allein nach Schwierigkeit sortiert; die Level 51–80 (aus `harden.mjs`) sind alle
  schwerer als die ersten 50, 71–80 mindestens so schwer wie 51–70. Jede Lösung steht als Kommentar und im Feld
  `solution`. Die Levelauswahl blättert in Seiten (Tutorial, 1–10, 11–20 … 71–80; ab 9 Seiten in zwei Reihen) –
  reine Seiten, keine Themen.
  Alle Level sind jederzeit spielbar, nichts muss freigeschaltet werden. Fortschritt und aktuelles Level bleiben
  im Browser gespeichert (nach Levelname).
  Wichtig: Der Levelname ist der Speicherschlüssel des Fortschritts. Die Namen in `tools/profiles.mjs` werden der
  Position nach vergeben – nach dem Veröffentlichen nicht mehr umbenennen.
  Die Tests probieren alle Stellungen durch und prüfen, dass jede Lösung stimmt und eindeutig ist.
