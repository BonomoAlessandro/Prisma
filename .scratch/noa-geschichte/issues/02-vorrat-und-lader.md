# 02: Vorrat und gemeinsamer Lader

**Spec:** ../spec.md

**Blocked by:** –

**Status:** resolved

**What to build:** Die Grundlage, um Level aus dem Spiel zu nehmen, ohne sie zu verlieren: ein versionierter Vorrat
unter `tools/vorrat/` mit einem Werkzeug zum Ablegen und Zurückholen, und ein gemeinsamer Lader, über den Werkzeuge und
Tests Level aus Spiel und Vorrat finden. Das Spiel bleibt in diesem Ticket unverändert (der Vorrat ist noch leer bzw.
nur zur Probe gefüllt); erst Ticket 04 nimmt Level aus dem Spiel.

- [x] Format des Vorrats: Leveldaten wie in `LEVELS`/`LEVELS_3D` (über `tools/leveldaten.mjs`, `levelCode`), samt
      Herkunft im Kommentar, Grad, Lösung und, falls vorhanden, `titel`; getrennt nach Fläche und Würfel. Lesbar wie die
      Blöcke in `index.html`, damit ein Diff zeigt, was sich ändert.
- [x] `tools/vorrat.mjs`: `ablegen` (Level aus `index.html` in den Vorrat), `zurueckholen` (einzelne Level, eine
      Gruppe wie «alle Würfel» oder ein Grad), `liste`. Ablegen und Zurückholen sind verlustfrei: Hin und zurück ergibt
      byte-gleiche Leveldaten.
- [x] Gemeinsamer Lader: Alle Stellen, die heute Level aus `index.html` lesen (u. a. `tools/levelliste.mjs`,
      `tools/ordne-level.mjs`, `tools/ordne-wuerfel.mjs`, `tools/wuerfelliste.mjs`, `tools/aehnlichkeit.mjs`,
      `tools/ki-tester/*`, `tools/leveldaten.mjs`, `tests/golden.mjs`, `tests/levelliste.test.mjs`,
      `tests/wuerfelliste.test.mjs`, `tests/beurteilung/*`), sind gefunden; wer alle Level braucht (Eichung, Ähnlichkeit,
      KI-Tester, Golden-Test, Würfelliste), liest Spiel und Vorrat über den Lader, wer nur das Spiel braucht, nur das
      Spiel.
- [x] Probe (nicht committet): Werden 20 flache und 20 Würfel-Level abgelegt, bleiben Golden-Test, Beurteilung,
      KI-Tester und Würfelliste grün; zurückgeholt ist `index.html` wieder byte-gleich.
- [x] Alle Tests grün mit unverändertem Spiel; Review nach dem Ticket.

## Comments

**Ergebnis (29.10.2026, Branch `feature/lichtsignal-prototyp`)**

- **Vorrat** (`tools/vorrat/flach.js`, `tools/vorrat/wuerfel.js`, leer committet): je Level sein Block aus
  `index.html` Zeile für Zeile (Lösung und Herkunft im Kommentar, Name, wahlweise `titel`, Grad, Elemente, Lösung),
  darüber `// Platz im Spiel: nach „<Name>“` bzw. `am Anfang`. Die Dateien sind JavaScript wie `index.html`; ein Diff
  zeigt genau die Level, die gehen und kommen. `levelCode` schreibt `titel` (hinter Name und Würfel, vor dem Grad);
  `ordne-level.mjs` und `ordne-wuerfel.mjs` lesen Namenszeilen mit Titel.
- **Werkzeug** `tools/vorrat.mjs`: `ablegen <name …> [--flach] [--wuerfel] [--grad g] [--datei d]`,
  `zurueckholen` mit denselben Angaben oder `--alle`, `liste`. Rechnet auf Texten (Funktionen `ablegen`,
  `zurueckholen`, `einfuegen`, `inhalt`, `leveldaten`, `mitAllen` für Ticket 04 nutzbar), Zeilenenden je Datei (der
  Vorrat wird nach `core.autocrlf` CRLF). Das Tutorial bleibt im Spiel.
- **Entscheid Platz:** Der Vorgänger ist das Level unmittelbar davor in der ganzen Folge aus Spiel und Vorrat, nicht im
  Spiel. Mit dem Vorgänger im Spiel zeigten zwei Level auf denselben, sobald dazwischen schon eines im Vorrat lag, und
  einzeln zurückgeholt kippte ihre Reihenfolge (vom Test gefunden). So bleibt die ganze Folge bei jedem Ablegen und
  Zurückholen dieselbe, in jeder Reihenfolge und Gruppierung.
- **Lader** `tools/lader.mjs`: `ALLE` (`LEVELS`, `TUTORIAL_COUNT`, `LEVELS_3D` wie nach `zurueckholen --alle`; die
  Level im Spiel dieselben Objekte wie in `L`), `VORRAT`, `ort(name)`, `alleText()`; bricht ab bei einem Namen in
  Spiel und Vorrat. Kostet etwa 13 ms.
- **Über den Lader (alle Level):** `beurteilung/heutige-reihenfolge.mjs` (Eichung, Eichmenge), `ki-tester/protocol.mjs`
  (Reihenfolge, Grade, Anker, Fingerabdruck), `ki-tester/prepare.mjs` (Seite für die Bilder aus `alleText`, sobald
  Level im Vorrat liegen; `tools/vorrat/` im Schlüssel der Anker-Bilder), `levelliste.mjs` (`imSpiel`),
  `wuerfelliste.mjs`, `aehnlichkeit.mjs`, `ausbau.mjs`, `wuerfel.mjs`, `bench.mjs`, `show.mjs` (Name),
  `ordne-level.mjs`, `ordne-wuerfel.mjs` (rechnen mit allen, schreiben nur ohne Level ihrer Art im Vorrat), Tests
  `golden.mjs`, `logic.test.mjs` (Level als Prüfdaten der Strahlregel), `levelliste.test.mjs`,
  `wuerfelliste.test.mjs`, `ki-tester.test.mjs`, `beurteilung/feldform*.test.mjs`, `schwierigkeit.test.mjs`,
  `wuerfel.test.mjs`. **Nur das Spiel:** Tutorial-Tests, Anzeige der Grade und Seiten der Levelauswahl
  (`levelliste.test.mjs`), `ki-tester/shots.mjs` (Kommandozeile), die Proben im Browser.
- **Neuer Test** `tests/vorrat.test.mjs` (14): hin und zurück byte-gleich (Teile, Gruppen, Mischungen, mehrere
  Schritte, alle 800 Level, CRLF), zufällig abwechselnd ablegen und zurückholen bei gleicher ganzer Folge, Format,
  Titel, `einfuegen`, Auswahl, Fehler, Lader gegen `alleText`, Kommandozeile.
- **Probe** (nicht committet): 20 flache (mit den Ankern A2, A4, A8, Querschläger, Anfang, Ende, Folgen von Nachbarn)
  und 20 Würfel-Level (mit den Würfel-Ankern A2 und A8) über die Kommandozeile abgelegt. Grün: Golden 809 Level,
  Beurteilung 206, KI-Tester 84, Würfelliste 20, dazu Levelliste 57, Strahlregel 1918, Generator 31, Vorrat 14.
  `prepare.mjs` hat Querschläger und die Anker aus dem Vorrat echt aufgenommen (Bild geprüft). Zurückgeholt in fünf
  anderen Gruppen (`--grad mittel`, drei Namen, `--wuerfel`, `--flach --grad leicht`, `--alle`): `index.html`,
  `flach.js`, `wuerfel.js` byte-gleich (sha256).
- **Tests mit unverändertem Spiel** (leerer Vorrat, über `leise.sh`): Strahlregel 1918, Golden 809 Level, Levelliste
  57, Würfelliste 20, Beurteilung 206, KI-Tester 84, Generator 31, Vorrat 14; `ordne-level.mjs` und
  `ordne-wuerfel.mjs` ohne `--schreiben`: Reihenfolge und Grade stimmen bzw. jede Prüfung ja.
- **Für Ticket 04:**
  - `LEVELS` im Spiel nicht umordnen, die Reihenfolge der Geschichte im eigenen Datenblock halten: Dann setzt der
    Lader die 500er-Reihe und die Würfel-Reihe exakt wieder zusammen, und Levelliste, Würfelliste, KI-Tester (Grade und
    Referenz in der Reihenfolge) und die Stichprobe des Golden-Tests bleiben ohne Änderung gültig. Wird `LEVELS`
    umgeordnet, kommen die Level des Vorrats hinter ihre Vorgänger, wo die dann stehen; die Tests der Reihenfolge
    müssen dann auf eine feste Liste umgestellt werden.
  - Die 15 neuen sehr schweren Level sind nicht in der 500er-Reihe: in `levelliste.json` (`ausbau`, über
    `ordne-level.mjs --ausbau`) aufnehmen oder die Tests der Reihenfolge für sie anpassen; `tests/golden.json` mit
    `--write` um sie ergänzen. Neue Namen und Titel gegen `ALLE` (flach und Würfel) prüfen.
  - Mit der Levelauswahl fallen in `levelliste.test.mjs` die Tests der Anzeige (Seiten, Abschnitte, Würfel-Seiten)
    und des alten Fortschritts (`progress`, nach Namen) weg; `tests/cube-probe.js` und `cube-click-probe.js` suchen
    Würfel-Level im Spiel.
  - Die Bilder der KI-Tester brauchen weiter `__prismaDebug.progress.save(index)` und ein Neuladen, das `LEVELS[index]`
    zeigt (Würfel ab `CUBE_START`); sonst `shots.mjs` anpassen.
  - `ordne-level.mjs` und `ordne-wuerfel.mjs` schreiben nur ohne Level ihrer Art im Vorrat (zurückholen, ordnen,
    wieder ablegen).
- **Für Ticket 03:** Pool und Bewertung über `ALLE` lesen (heute dasselbe wie das Spiel); `titel` schreibt
  `levelCode`, und der Vorrat übernimmt ihn.

**Review (29.10.2026)**

- Gegen Ticket und Spec geprüft: `index.html` gegenüber HEAD unverändert, `tools/vorrat/flach.js` und `wuerfel.js`
  leer. Der Vorrat übernimmt die Blöcke aus `index.html` Zeile für Zeile statt sie mit `levelCode` neu zu schreiben;
  das Format ist dasselbe und hin und zurück sicher byte-gleich. Die Suche nach Stellen, die Level direkt aus
  `index.html` oder `L` lesen, fand keine vergessene; was noch `L` liest, braucht nur das Spiel (Tutorial, Anzeige,
  `shots.mjs`, `show.mjs --level <Platz>`).
- Eigene Probe über die Kommandozeile in fünf Schritten, mit anderen Leveln als oben: Nachbarn an den Gradgrenzen
  (Lindgrün|Funkenregen, Doppelstern|Gewürzroute, Fehlstart|Wega), Turmalin und Goldwechsel und später ihre Vorgänger
  Pirouette und Lichtwaage (Kette über den Vorrat), Umlaufbahn (das letzte), Djenné; `--wuerfel --grad "sehr schwer"`
  (27), `--flach --grad "sehr schwer"` (die übrigen 43); `--datei` als JSON (Würfel an den Gradgrenzen, mit Bamiyan
  vor dem schon abgelegten Möbiusband) und als Zeilen mit CRLF. Zusammen 54 flache und 33 Würfel-Level; nach jedem
  Schritt `alleText` byte-gleich mit dem alten `index.html`. Grün: Golden 809 Level, Strahlregel 1918, Vorrat 14,
  Levelliste 57, Würfelliste 20, KI-Tester 84, Beurteilung 206. Zurückgeholt in sechs anderen Gruppen
  (`--grad schwer`, `--datei`, `--wuerfel`, zwei Namen, `--flach --grad "sehr schwer"`, `--alle`): `index.html`,
  `flach.js`, `wuerfel.js` byte-gleich (sha256).
- Fehlerfälle über die Kommandozeile (Tutorial, unbekannt, schon im Vorrat, teils unbekannt, falscher Grad, `--alle`
  beim Ablegen, leerer Vorrat) schreiben nichts. Ein Name in Spiel und Vorrat zugleich: Der Lader bricht ab, `liste`
  läuft weiter, `ablegen` und `zurueckholen` weisen ab.
- Im Speicher dazu 806 zufällige Schritte über die ganze Folge (einzelne, Blöcke von Nachbarn, grosse Teile): nach
  jedem die Level im Spiel in der Reihenfolge der ganzen Folge, am Ende byte-gleich. `index.html` mit CRLF (Vorrat LF
  und CRLF) hin und zurück byte-gleich. `NAMENSZEILE` in `ordne-level.mjs` und `ordne-wuerfel.mjs` passt auf alle 800
  Namenszeilen und auf `levelCode` mit Titel.
- Mit unverändertem Spiel alle Tests grün, dazu Generator 31.
- Selbst behoben: Zeilen über 120 Zeichen umbrochen (Kopf von `vorrat.mjs` und `lader.mjs`, zwei JSDoc-Kommentare und
  `namenImSpiel` in `vorrat.mjs`, die Meldung zum Vorrat in `ordne-wuerfel.mjs`).
- Offen, klein: Fehler aus `ablegen` und `zurueckholen` erscheinen in der Kommandozeile als Ausnahme mit Stacktrace
  (Exit 1, nichts geschrieben); `ablegen` mit einem Level, das schon im Vorrat liegt, meldet «Nicht im Spiel»;
  `zurueckholen --alle` endet bei leerem Vorrat mit Exit 1. Für Ticket 04: Der übliche `git diff` zeigt viele
  abgelegte Level in `index.html` als gemischte Zeilen, `git diff --histogram` als reine Löschungen.
