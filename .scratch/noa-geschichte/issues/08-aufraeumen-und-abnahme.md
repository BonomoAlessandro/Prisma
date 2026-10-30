# 08: Aufräumen, Begriffe, Abnahme

**Spec:** ../spec.md

**Blocked by:** 05, 06, 07, 09

**Status:** ready-for-agent

**What to build:** Was die 500er-Reihe brauchte und nicht mehr gebraucht wird, ist weg; Begriffe und Entscheide sind
festgehalten; ein ganzer Durchgang je Grad ist im Browser geprüft. Danach ist der Stand bereit für den Merge, den der
Nutzer auslöst.

- [ ] Code der alten Levelauswahl, der Würfel-Darstellung im Menü, der Hintergrund-Wahl und von `?signal` entfernt, wo
      er nicht mehr gebraucht wird (die Würfel-Strahlregel und -Darstellung bleiben, damit zurückgeholte Würfel-Level
      laufen).
- [ ] Werkzeuge und Tests der 500er-Reihe (Reihenfolge nach Formel, Seiten, Prüfliste) entfernt oder auf den Vorrat
      umgestellt; README und Kopfkommentare angepasst.
- [ ] `CONTEXT.md`: Begriffe Geschichte, Durchgang, Welt, Vorrat, Übersicht, Titel; ADR «Die Geschichte ersetzt die
      feste Reihenfolge» unter `docs/adr/`.
- [ ] PLAN.md 0 auf erledigt, offene Punkte nachgetragen (eigene Skybox «Im Dorf», Würfel als Teil 2).
- [ ] Abnahme im Browser: je Grad ein ganzer Durchgang (automatisch gelöst) vom Menü bis zum Epilog, dazu Wiederholen,
      «Von vorn», Neuladen mitten in einer Welt; Desktop und Handy; Messung der Bildzeiten in den Zwischenszenen wie
      vor dem Umbau.
- [ ] Alle Tests grün; Review nach dem Ticket. Kein Merge, bis der Nutzer es sagt.

## Comments

**Doku vorab (30.10.2026):** `CONTEXT.md` (Abschnitte «Noas Geschichte», «Level der Geschichte», «Abgelöst») und
ADR 0005 «Die Geschichte ersetzt die feste Reihenfolge» geschrieben, vor dem Abschluss dieses Tickets nachführen. Beim
Aufräumen mitnehmen: «Reise» im Code nur noch für den Übergang zwischen Welten (`story.travel`), die 60 Level eines
Grads heissen «Durchgang» (Kommentare um `story.steps`); den Eintrag «Reihe» in `CONTEXT.md` nachführen, sobald
Levelliste, KI-Tester und Golden-Test umgestellt oder entfernt sind; in ADR 0001 einen kurzen Verweis «für das Spiel
abgelöst durch ADR 0005» ergänzen; «Platzhalter» nach Ticket 09 als abgelöst markieren.

**Aus dem Review von Ticket 05 (30.10.2026):** Beim ersten Öffnen des Menüs mit Lichtwegen (begonnene oder geschaffte
Grade) gibt es 0,35–0,6 s nach dem Klick einen zweiten Ruck (Desktop 121–218 ms, mit Finale-Stand bis 376 ms; Handy
hoch 206 ms), vermutlich das erste Zeichnen des Leucht-Filters der Wege (`feGaussianBlur`); dazu das erste «Spiel →
Menü» auf dem Handy (121 ms). Vorwärmen, solange der Startbildschirm steht. Ebenso die Prolog-Bühne beim ersten
Zeichnen (Desktop 103–151 ms, Handy bis 249 ms) und sporadisch Epilog → Menü (einmal 248 ms). Während Reise und Finale
sind «Menü» und «Neu starten» sichtbar, wirken aber nicht – ausblenden oder sichtbar sperren.

**Aus dem Review von Ticket 06 (30.10.2026):** In der Übersicht wirken Pfeile/Pos1/Ende nicht, solange «Schliessen»
den Fokus hat; Hinweis zur gesperrten Kachel auf dem Desktop näher an die Kachel; «Schliessen» auf 44 px; erstes
Zeichnen einer frisch geladenen Skybox (Reise, Weltgrenze) kostet 50–120 ms; auf kleinen Handys hoch (unter 700 px)
zeigt das Menü die Aktion der Karte nicht; Begriffe «Wiederholen» und «Bestwerte» ins Glossar.

**Doku-Teil (Worktree noa/08-doku, 30.10.2026)** – parallel zu Ticket 07 und zum Einbau von 09, ohne Code:

- **`CONTEXT.md`** (Abschnitt «Noas Geschichte»): Durchgang (geschafft heisst Finale gesehen, «Von vorn», «Reise» nur
  noch unter _Vermeiden_), Welt (Abgrenzung zu «Im Dorf»: Kapitel ohne Nummer, keine Welt), Einstieg in eine Welt
  (überspringbar, Einstieg ins Dorf ohne Träger), Reise (läuft ganz, nicht überspringbar, Entscheid 28), Übersicht
  geschärft; «Im Dorf» nach dem Einbauplan und den Entscheiden von Ticket 07 neu gefasst (Übungen, Angebot auch nach
  übersprungenem Prolog, keine der sechs Welten, zählt nicht zu den 60, Übersicht, Milchstrasse); neu «Menü» (mit
  «Weiter» und «Von vorn», Wunsch aus 05), «Wiederholen», «Bestwerte» (überleben «Von vorn», Entscheid 27) und
  «Testschnittstelle» (Wunsch aus 04). Titel: «sonst den Namen (die Übungen im Dorf)». Geschichte, Grad, Vorrat
  unverändert geprüft. «Was Spass macht», «Kernideen», «Was Spass verdirbt» unberührt; `tests/ki-tester.test.mjs`
  danach grün (siehe unten).
- **ADR 0001:** Verweis «Für das Spiel abgelöst durch ADR 0005», als Massstab der Eichung gilt es weiter.
- **ADR 0005** nachgeführt: «Weiter» und «Von vorn» im Menü, «Im Dorf» als Kapitel ohne Welt, Wiederholen ohne
  Zwischenszenen, Bestwerte überleben «Von vorn», Reisen laufen ganz (Entscheide 27, 28); die Entscheide des
  Koordinators aus 05–07 als markierte Liste; unter «Verworfen» Bestwerte mit «Von vorn» löschen und Reisen
  überspringbar.
- **PLAN.md 0:** Stand vom 30.10. (02–06 fertig, 07 und 09 in Arbeit, 08 offen), offene Punkte ausserhalb der Spec
  (eigene Skybox «Im Dorf», Würfel als Teil 2, Zwischenszenen in einer Welt), Entscheide vom 30.10., Vorrat unter 0.2,
  Platzhalter und Ticket 09 unter 0.3. Nicht auf «erledigt» gesetzt.
- **Offen für den Code-Teil von 08:**
  - «Im Dorf» in `CONTEXT.md` nach dem fertigen Ticket 07 gegenlesen (Kopfzeile, Name der Knöpfe, Code-Namen wie
    `STORY_DORF`/`story.inDorf` erst nach dem Einbau nennen; «Überspringen» beim Einstieg mit dem gebauten Knopf und Esc
    abgleichen).
  - Eintrag «Reihe» unter «Abgelöst» erst nachführen, wenn Levelliste, KI-Tester und Golden-Test umgestellt oder
    entfernt sind; «Platzhalter» erst nach dem Einbau von 09 als abgelöst markieren.
  - Im Code «Reise» nur für `story.travel`, Kommentare um `story.steps` auf «Durchgang» (dann den Hinweis «im Code
    steht dafür noch …» unter Durchgang streichen).
  - `SPEC.md` und `3D-WUERFEL.md` erwähnen noch Levelauswahl und Hintergrund-Umschalten (Hinweis aus 04).
  - PLAN.md 0 nach der Abnahme auf erledigt setzen; Checkbox «`CONTEXT.md` … ADR» erst dann abhaken, wenn «Im Dorf»
    nach 07 gegengelesen ist.

**Werkzeug-Teil (noa/08-werkzeuge, 30.10.2026)** – Checkbox 2, in einem eigenen Worktree ab `944b038`, parallel zum
Spiel-Teil; `index.html`, `CONTEXT.md`, `SPEC.md`, `3D-WUERFEL.md` und `tests/geschichte-probe.mjs` unberührt.

- **Grundsatz:** ADR 0005 behält die Reihe als Folge aller flachen Level aus Spiel und Vorrat («`LEVELS` behält die
  Folge der Reihe», «Regeln der Levelliste gelten ohne Sonderfall weiter»). Sie ist Referenz der KI-Tester (Platz,
  Grad, Anker), Platz eines Levels im Vorrat, Massstab der Grade und der Ort, an dem neue Level ihren Grad bekommen.
  Entfernt ist darum nur, was der Reihe *als Ablauf des Spiels* diente; die Tests lesen seit Ticket 02 Spiel und Vorrat
  über den Lader, keiner setzt mehr 500 Level im Spiel voraus.
- **Bestandsaufnahme und Entscheid:**

  | Werkzeug/Test | hängt an | braucht es heute | Entscheid |
  |---|---|---|---|
  | `ordne-level.mjs --austausch` | Reihe als Spiel (Level ersetzen, altes entfernen) | niemand; Ersatz ist Vorrat + `geschichte.mjs wahl` (ADR 0005, «nicht löschen») | entfernt (Aufruf meldet den Wegfall) |
  | `ordne-level.mjs` (Ordnen, `--ausbau`, `--json`) | Reihenfolge nach Formel, Prüfliste | KI-Tester (Vorschau für Läufe `ausbau-…`), Ausbau sehr schwerer Level, Grade | umgestellt: schreibt in Spiel **und** Vorrat (`inGanzerFolge`), neue Level kommen in den Vorrat; kein `zurueckholen --flach` mehr nötig |
  | `ordne-wuerfel.mjs` | Würfel-Reihe | Würfel (Teil 2) | behalten, ebenso auf Spiel und Vorrat umgestellt |
  | `ausbau.mjs wahl`, `bedarf`, `bestandNach` | Tabelle der 500er-Reihe in Gruppen zu 35 | niemand (Ticket 01 und 09 wählten anders) | entfernt |
  | `ausbau.mjs pool` | – | Kandidaten für Geschichte (01, 09) und Würfel | behalten |
  | `levelliste.mjs`, `levelliste.json` (Prüfliste, Duldung, Häufung je 10) | Reihe | `ordne-level`, Würfel (`reihenfolge`), Generator und bench (`GRUENDE`), Geschichte (Urteile, `behalten`), Eichmenge | behalten, Kopf nachgeführt («Seite» = Abschnitt zu 10 der Reihe) |
  | `tests/levelliste.test.mjs` | Reihe aus Spiel und Vorrat | prüft Reihe, Namen, Lösungen, Speicherstand | behalten; Test «Bedarf je Gruppe» entfernt (55 → 54) |
  | `tests/golden.mjs` | Stichprobe = jedes 10. Level der Reihe | Strahlregel, Löser | umgestellt: Tutorial, je Grad jedes 10. Level der Geschichte, jedes 10. flache Level des Vorrats, jedes 10. Würfel-Level (93) |
  | `ki-tester/*`, `tests/ki-tester.test.mjs` | Referenz = Platz in der Reihe | Bewertung/Ablehnung für die Wahl, Ausbau, Würfel | behalten, Kommentare («1–150» → Reihe aus Spiel und Vorrat) |
  | `tests/vorrat.test.mjs` | – | Vorrat | erweitert um `inGanzerFolge` (3 Tests) |
  | Würfel (`wuerfel.mjs`, `wuerfelliste.mjs`, Test) | Würfel-Reihe | Teil 2 | behalten |
  | `beurteilung/heutige-reihenfolge*`, `entfernte-level.json`, `eiche-*.mjs` | heutige Reihenfolge der 150 | Eichung (ADR 0001) | behalten |
  | `show.mjs`, `shots.mjs`, `aehnlichkeit.mjs`, `geschichte.mjs`, Generator | Spiel bzw. alle Level | Geschichte, KI-Tester | behalten (Kopf von `geschichte.mjs` nachgeführt) |
  | Seiten der Levelauswahl | – | – | in Werkzeugen und Tests seit Ticket 04 nicht mehr vorhanden |

- **Ausbau sehr schwerer Level ohne `zurueckholen`:** `ausbau.mjs pool` → `ordne-level.mjs --ausbau <d> --json <v>` →
  `prepare.mjs ausbau-… --kandidaten <v>`, `merge.mjs` → Schlüssel in `sehr-schwer-kandidaten.json` →
  `geschichte.mjs wahl` → `geschichte.mjs ausbau <d>` → `ordne-level.mjs --ausbau <d> --schreiben` (in den Vorrat) →
  `golden.mjs --write` → `geschichte.mjs spiel`. Ganz ohne `ordne-level` geht es nicht, weil Vorschau für die
  KI-Tester sowie Platz und Grad neuer Level aus der Formel kommen; darum umgestellt statt entfernt (README).
- **Probe an einer Kopie** (Scratchpad): «Kugelsternhaufen» (Ausbau, im Vorrat) aus Vorrat und `levelliste.json`
  genommen, mit `ordne-level.mjs --ausbau … --schreiben` wieder eingereiht (56 s): `index.html`, `flach.js`,
  `wuerfel.js` byte-gleich wie vorher, in `levelliste.json` steht der Name nur am Ende von `ausbau`.
- **Commits:** `3565337` (ordne-level/ordne-wuerfel in Spiel und Vorrat, Austausch weg), `d3d6e68` (wahl/bedarf weg),
  `dfc3401` (Golden-Stichprobe), `a6718f6` (README).
- **Tests** (ein Lauf über `leise.sh`, `LEISE_CPU=100`): Strahlregel 2032, Golden 847 Level, Vorrat 18, Levelliste 54,
  Würfelliste 20, KI-Tester 84, Beurteilung 206, Generator 31, Geschichte 35, Offline bestanden. Die Proben im
  Browser nicht neu gelaufen (`index.html` unverändert).
- **«Reihe» in `CONTEXT.md`:** Als Ablauf ist sie abgelöst, als Begriff nicht ganz: Levelliste, KI-Tester (Referenz)
  und `ordne-level.mjs` (Platz und Grad neuer Level, Platz im Vorrat) rechnen weiter mit ihr, der Golden-Test nicht mehr.
  Vorschlag für den Eintrag: «… _Abgelöst_ als Ablauf durch die Geschichte (ADR 0005). Weiter die Folge aller flachen
  Level aus Spiel und Vorrat: Referenz der KI-Tester, Platz im Vorrat und Ort, an dem neue Level ihren Grad bekommen
  (`ordne-level.mjs`, Levelliste). Austausch, Seiten und der Bedarf je Gruppe sind weg (Ticket 08).»
- **Offene Fragen:**
  1. Prüfliste, Duldungsliste und Häufungsregel je 10 in der flachen Reihe behalten? Sie halten die Reihe, wie sie
     ist; fielen sie weg, wanderte die Reihe beim nächsten `ordne-level` und mit ihr Referenzen und Grade (ADR 0005
     will das nicht). Alternative wäre eine eingefrorene Reihe, in die neue Level nur noch eingereiht werden.
  2. `prepare.mjs --kandidaten` ohne Vorschau (Format des Austauschs `{ formel, level }`) hat keinen Erzeuger mehr; vom
     Test gedeckt, darum behalten. Entfernen?

**Review Werkzeug-Teil (30.10.2026)** – `noa/08-werkzeuge` (`3565337`…`b82b7e7`, Basis `944b038`). Urteil: bereit zum
Merge.

- **`inGanzerFolge` und `ordne-level.mjs`/`ordne-wuerfel.mjs`:** richtig. Auf den echten Dateien ergibt ein Lauf ohne
  Änderung für beide Arten `index.html` und Vorrat byte-gleich; mit gemischten Zeilenenden (`index.html` LF, Vorrat
  CRLF und umgekehrt) bleibt jede Datei bei ihren, die ganze Folge stimmt, und zweimal umgekehrt ergibt wieder die
  Ausgangstexte. `ordne-level.mjs` schreibt nur, wenn Reihenfolge oder Grade abweichen (`imSpielGleich`); zuerst den
  Vorrat, dann `index.html`, wie beim Ablegen. Steht ein Level im Spiel und im Vorrat, bricht schon der Lader ab
  («Im Spiel und im Vorrat»), ebenso `zurueckholen`; geschrieben wird dann nichts. Die Namenszeile mit `titel` (Level
  der Geschichte) ersetzt `ordneLevels` richtig.
- **Kleiner Fund, behoben:** «Ändert aendere nichts, sind die Texte byte-gleich» galt nur, solange die Datei des
  Vorrats in der Folge der Reihe liegt. Nach einzelnem Ablegen (spätes Level vor frühem) hängte `ablegen` alles neu
  in der Folge an, ein Lauf ohne Änderung ordnete also die Datei um (`ordne-wuerfel.mjs --schreiben` schreibt immer).
  Jetzt gibt `inGanzerFolge` ohne Änderung und ohne neue Level die Texte unverändert zurück; Test dazu in
  `tests/vorrat.test.mjs` (im bestehenden Test «Ändert nichts»).
- **Kleiner Fund, behoben:** neue Kommentarzeilen über 120 Zeichen umgebrochen (`prepare.mjs`, `protocol.mjs`,
  `ordne-level.mjs`, `ordne-wuerfel.mjs`, `levelliste.mjs`, Ausgabe in `golden.mjs`).
- **Entfernte Teile:** nichts hängt mehr daran. Kein Import von `ausbau.mjs` (`ZIEL`, `GRUPPEN`, `VORHER`,
  `bestandNach`) in `tools/` oder `tests/`; `pool` und der Worker sind gegenüber `944b038` Zeichen für Zeichen gleich,
  keine verwaisten Bezeichner. `bestandNach`/`bedarf` in `wuerfelliste.mjs` und `wuerfel.mjs` sind die der Würfel,
  nicht betroffen. `--austausch`, `ausbau.mjs wahl/bedarf` und `zurueckholen --flach` stehen nur noch in
  abgeschlossenen Tickets (levelgenerator 23–26, 500-level, wuerfel-500, Ticket 09) und als Rückblick in README und
  Köpfen. `SPEC.md`, `3D-WUERFEL.md`, ADR und `CONTEXT.md` nennen sie nicht.
- **Golden-Stichprobe** (93 Level): Tutorial, je Grad 6 Level der Geschichte (das erste jeder Welt), jedes 10. flache
  Level des Vorrats (in der Folge der Reihe, also über alle Grade) und jedes 10. Würfel-Level; alle Grade und der Würfel
  sind gedeckt, die Prüfung «nicht in Spiel und Vorrat» fängt Tippfehler. Die Referenz hat weiter die Löserdaten aller
  847 Level. Anmerkung ohne Handlungsbedarf: Aus der Geschichte kommt immer der erste Platz einer Welt.
- **README:** Ablauf für neue sehr schwere Level vollständig und in der richtigen Reihenfolge (`pool` → Vorschau →
  KI-Tester → Schlüssel → `wahl` → `geschichte.mjs ausbau` → `ordne-level --ausbau --schreiben` → `golden --write` →
  `spiel`); er passt zu den Köpfen von `geschichte.mjs` und `ordne-level.mjs`.
- **Tests:** nicht abgeschwächt. «Bedarf je Gruppe» prüfte nur `bestandNach` aus `ausbau.mjs`, also die entfernte
  Tabelle der 500er-Reihe; der Wegfall ist berechtigt. Die Würfel-Tabelle prüft `tests/wuerfelliste.test.mjs` weiter.
  Neu drei Tests zu `inGanzerFolge` und die Gegenprobe oben.
- **Testläufe** (über `leise.sh`, `LEISE_CPU=100`): vor den Fixes Vorrat 18, Golden 847 Level (Stichprobe 93),
  Levelliste 54, Würfelliste 20, KI-Tester 84, alle bestanden; nach den Fixes Vorrat 18 und Golden erneut bestanden.
- **Offene Fragen:** (1) Prüfliste, Duldung und Häufung je 10 behalten: einverstanden. Sie halten die Reihe fest;
  fielen sie weg, wanderten beim nächsten `ordne-level` Plätze und Grade und damit die Referenzen der KI-Tester und der
  Platz im Vorrat (ADR 0005 will die Folge behalten). Eine eingefrorene Reihe wäre ein neuer Entscheid, kein
  Aufräumen. (2) `{ formel, level }` ohne Vorschau behalten: einverstanden, der Pfad ist derselbe Code wie mit Vorschau
  und kostet nichts. Er ist aber eine Falle, seit es Level des Ausbaus gibt (der Kopf von `prepare.mjs` warnt: ohne
  Vorschau zählt `formel` im ganzen Spiel, `ordne-level` unter dem Bestand). Für neue flache Level darum immer mit
  Vorschau aus `ordne-level.mjs --ausbau … --json`.
