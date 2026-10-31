# 08: Aufräumen, Begriffe, Abnahme

**Spec:** ../spec.md

**Blocked by:** 05, 06, 07, 09

**Status:** resolved

**What to build:** Was die 500er-Reihe brauchte und nicht mehr gebraucht wird, ist weg; Begriffe und Entscheide sind
festgehalten; ein ganzer Durchgang je Grad ist im Browser geprüft. Danach ist der Stand bereit für den Merge, den der
Nutzer auslöst.

- [x] Code der alten Levelauswahl, der Würfel-Darstellung im Menü, der Hintergrund-Wahl und von `?signal` entfernt, wo
      er nicht mehr gebraucht wird (die Würfel-Strahlregel und -Darstellung bleiben, damit zurückgeholte Würfel-Level
      laufen).
- [x] Werkzeuge und Tests der 500er-Reihe (Reihenfolge nach Formel, Seiten, Prüfliste) entfernt oder auf den Vorrat
      umgestellt; README und Kopfkommentare angepasst.
- [x] `CONTEXT.md`: Begriffe Geschichte, Durchgang, Welt, Vorrat, Übersicht, Titel; ADR «Die Geschichte ersetzt die
      feste Reihenfolge» unter `docs/adr/`.
- [x] PLAN.md 0 auf erledigt, offene Punkte nachgetragen (eigene Skybox «Im Dorf», Würfel als Teil 2).
- [x] Abnahme im Browser: je Grad ein ganzer Durchgang (automatisch gelöst) vom Menü bis zum Epilog, dazu Wiederholen,
      «Von vorn», Neuladen mitten in einer Welt; Desktop und Handy; Messung der Bildzeiten in den Zwischenszenen wie
      vor dem Umbau.
- [x] Alle Tests grün; Review nach dem Ticket. Kein Merge, bis der Nutzer es sagt.

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

**Spiel-Teil (31.10.2026, Branch `feature/lichtsignal-prototyp`, ab 944b038)** – Commits 1b7b205 (Doku), e92b20c
(Aufräumen), ef2f085 und b74857c (Feinschliff). Abnahme und «Reihe» in `CONTEXT.md` folgen nach dem Zusammenführen mit
dem Werkzeug-Teil.

- **Aufräumen in `index.html`:** Levelauswahl (Markup, CSS, `PAGES`, `SECTIONS`, `MODES`, Tasten), Hintergrund-Knopf,
  Taste H, `skyTheme.next`/`names` und `?signal` hatte Ticket 04 schon entfernt; ein Durchgang über alle Bezeichner und
  CSS-Klassen fand keinen weiteren toten Code. Entfernt: `stepLevel(delta)` (Blättern mit N/P, nur noch mit 0 gerufen)
  → `restartLevel()`; `__prisma.goto` (Sprung in ein beliebiges Level, von keinem Werkzeug genutzt, widersprach «kein
  Weg, ein Level zu überspringen»); Kommentare zu «umschaltbar» und zu Konstanten der alten Levelauswahl.
  **Bewusst behalten:** `LEVELS_3D`, `CUBE_START`, `cubeView`, die Kopfzeile «Würfel n / m» und der Zweig für Übungen
  ausserhalb der Geschichte in `ui.showHud` (zurückgeholte Würfel-Level über `zeige`: `cube-probe.js`,
  `cube-click-probe.js`, `shots.mjs --wuerfel`, `ki-tester/prepare.mjs`); `?sky=` (`offline.mjs`, `shots.mjs`); die
  übrigen Felder von `__prisma` (`screenshot.mjs` gibt das Objekt aus, Leistungsanzeige). Eine «Würfel-Darstellung im
  Menü» gibt es seit Ticket 04 nicht mehr. Kein Test hing am entfernten Code.
- **Begriffe im Code:** «Reise» nur noch für `story.travel` (Reise, Untertitel der Reise, Träger); um `story.steps`,
  `progress`, `STORY_LEVELS`, `setGrade`, `markSolved`, `menuStand` heisst es «Durchgang».
- **Feinschliff** (Bildzeiten: längste Lücke, je zwei frische Chrome-Läufe mit eigenem Treiber, Desktop / Handy hoch /
  quer, ms):
  - *Menü vorgewärmt* (`menu.vorwaermen`, beim ruhigen Startbildschirm einmal unsichtbar gezeichnet, wie die
    Übersicht): Start → Menü mit Lichtwegen, Ruck 0,35–0,6 s nach dem Klick vorher 55–71 / 53 / 36, nachher 19 /
    19–22 / 19–24. Die grosse Lücke direkt beim Klick (350–430 ms auf allen Bildschirmen, vorher wie nachher) ist nicht
    das Menü, sondern `audio.unlock` (Profil: 398 ms in `unlock`, Hall `ConvolverNode`); siehe offen.
  - *Bühne vorgewärmt* (`story.vorwaermen`, erste Einstellung des Prologs, zwei Bilder unsichtbar unter dem
    Startbildschirm): Menü → Prolog vorher 72–87 / 122–124 / 70–465, nachher 36–37 / 19–25 / 22–35. In den Proben
    trat die Ausnahme «erstes Zeichnen der Bühne» vorher dreimal auf (107–123 ms), nachher nie.
  - Startbildschirm selbst (6 s ab bereit, mit dem Vorwärmen): 36 / 24 / 36. Spiel → Menü (erstes Mal) vorher und
    nachher 36 / 19 / 19. Epilog → Menü vorher und nachher 19–21 / 19 / 19 (die einmal 248 ms nicht wieder gesehen).
  - *Skybox der nächsten Welt:* Die Ursache war nicht nur das erste Zeichnen, sondern der Aufbau der Skybox mitten im
    Flug (Profil: Hochladen des Felsbilds am Strand 2662 × 1706 in einem Stück 85–110 ms, Entpacken der Netze 30–40 ms,
    erstes Zeichnen der Netze). Jetzt: (1) Solange «Gelöst» steht und «Weiter» in eine andere Welt führt, lädt der
    Himmel der nächsten Welt schon (`story.preloadNext`, `skyTheme.preload`, 0,3 s nach dem Feld; bleibt vorgemerkt,
    bis ein Himmel gewählt wird; Dauer gut 2,7–3,3 s); (2) `skyWarmDraw` zeichnet jedes Teil vor dem Einblenden einmal
    in ein Ziel von 1 × 1 Pixel (eigene Ebene, gleiche Lichter: dieselben Programme); (3) Felsbilder als ImageBitmap
    ohne Farbumrechnung, Farbbilder in Streifen zu 256 Zeilen über `skyUpload`, Mipmaps auf der Grafikkarte; (4)
    `bakedMesh` entpackt in Häppchen. Bild bitgleich wie vorher (Strand in vier Blickrichtungen, gleiche Prüfsumme).
    Reise Bergwald → Meer vorher 69–87 / 52–53 / 53–54, nachher 36–37 / 37–38 / 37–55; Weltgrenze beim Wiederholen
    vorher 107 / 53–54 / 37–53, nachher 41–53 / 36–54 / 36–57; «Gelöst» steht 2,5 s, während der Himmel lädt: 36–42 /
    19–53 / 19–40. Ein sofortiges «Weiter» (wie in der Probe) lädt wie bisher im Flug, dank (2)–(4) ohne Lücke über
    100 ms.
  - *«Menü» und «Neu starten» auf Reise und im Finale ausgeblendet* (`ascend` nimmt die Knöpfe weg, `fall` und `begin`
    bringen sie wieder); die Probe prüft es auf jeder Reise und im Finale.
  - *Übersicht:* Pfeile holen den Fokus von «Schliessen» (oder den Seitenpfeilen) auf die Kachel, die Tab erreicht,
    Pos1/Ende (auch mit Strg) wirken wie von ihr aus; der Hinweis zur gesperrten Kachel steht auf dem Desktop (alle
    Welten untereinander) 10 px über der Kachel, mittig, sonst darunter, auf Seiten wie bisher über dem Fuss;
    «Schliessen» mindestens 44 px hoch.
  - *Menü auf kleinen Handys hoch* (unter 700 px): Die Aktion der Karte («Fortsetzen», «Übersicht», «Beginnen») steht
    wieder, 8 px, Karten etwas enger; geprüft auf 360 × 640, 375 × 667 und 320 × 568 (vier Grade, «Weiter»).
  - *Fokus:* nach «Üben»/«Gleich los» auf der Geschichte (`#story`: Enter tippt, Tab führt zu «Überspringen»), nach
    «Überspringen» und wenn die Geschichte ausblendet, während sie den Fokus hat, aufs Spielfeld (Canvas, `tabindex
    -1`), nicht mehr auf `body` (`story.keepFocus`).
  - *Eigene Skybox fürs Dorf* (nur vermerkt): Vor dem Prolog lädt `begin` den Himmel des Bergwalds (`setSky(ch.sky)`),
    auch wenn danach «Üben» folgt; mit einer eigenen Skybox an `STORY_DORF.sky` wäre der Wald dann umsonst geladen.
    Dann den Himmel erst nach der Wahl im Angebot laden (oder beide vor), `story.init` ebenso.
- **Begriffe:** `CONTEXT.md` «Im Dorf» gegen das Gebaute gelesen und neu gefasst (Kopfzeile mit Hinweis, «Dorf
  überspringen» nur als Knopf, Esc öffnet dort das Menü, Satz zum Ende, Übersicht ab «Üben», Code-Namen `STORY_DORF`,
  `story.inDorf`, `story.uebung`, `prisma.noa.<grad>.dorf`); neu «Angebot», «Einstieg ins Dorf», «Überspringen»;
  «Platzhalter» unter «Abgelöst»; der Hinweis «im Code steht dafür noch …» unter Durchgang gestrichen. «Was Spass
  macht» unverändert, `tests/ki-tester.test.mjs` 84 bestanden. `SPEC.md` (Hintergrund bestimmt die Welt, Knöpfe
  Übersicht und Menü) und `3D-WUERFEL.md` (Würfel im Vorrat, keine Levelauswahl) nachgeführt. «Reihe» offen (nach dem
  Werkzeug-Teil).
- **Probe** `tests/geschichte-probe.mjs` ergänzt: Fokus nach der Wahl im Angebot und nach «Überspringen»; Knöpfe weg
  auf jeder Reise und im Finale; Übersicht: Pfeil und Ende mit dem Fokus auf «Schliessen», Hinweis an der Kachel
  (Desktop), «Schliessen» ≥ 44 px.
- **Tests** (über `leise.sh`, `LEISE_MAX_CPU=100 LEISE_CPU=100`): Strahlregel 2032, Golden 847 Level, Vorrat 15,
  Levelliste 55, Würfelliste 20, KI-Tester 84, Beurteilung 206, Geschichte 35, Generator 31, Offline, Bedienung
  (`interaction-probe.js`, Konsole leer), `shots.mjs` Platz 1 und 240: alle bestanden. Proben `--dorf`,
  `--dorf-raender`, `--menue`, `--uebersicht` auf Desktop, Handy hoch und quer bestanden, Konsole leer. Längste Lücke je
  Probe vorher (944b038) → nachher, ms: Desktop 71 → 55, 53 → 53, 37 → 55, 71 → 88; Handy 54 → 52, 53 → 37, 53 → 36,
  53 → 53; quer 88 → 53, 37 → 53, 54 → 54, 37 → 52. Keine Lücke über 100 ms.
- **Offen:**
  - `audio.unlock` beim ersten Klick hält das Bild 350–430 ms an (Hall: `ConvolverNode` mit 3,2 s Rauschen); gehört
    zum Start, nicht zum Menü; etwa den Hall später oder kürzer setzen.
  - Desktop «Spiel → Übersicht»: erste Lücke beim Öffnen 88 ms (in einem Zwischenstand einmal 106), vorher 70–71,
    trotz Vorwärmen der Übersicht. Beobachten.
  - Der Baustein der Übersicht unter `.scratch/noa-geschichte/bausteine/` kennt Hinweis an der Kachel, Tasten ab
    «Schliessen» und 44 px nicht (das Spiel ist massgebend).
  - Die Ausnahme «erstes Zeichnen der Bühne» in der Probe (`ende(…, { buehne })`) wird nicht mehr gebraucht; sie bleibt,
    bis die Abnahme es bestätigt.

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

**Abnahme (31.10.2026)** – Stand `2fff6e0` (alles zusammengeführt), Headless-Chrome auf der Grafikkarte, alle Läufe über
`leise.sh` (`LEISE_MAX_CPU=100 LEISE_CPU=100`). Urteil: **bestanden**.

- **Probe erweitert** (`9d1162a`): `--ganz` spielt je Grad den ganzen Durchgang in einer Sitzung (Menü → Prolog →
  Angebot «Gleich los» → Einstieg → 60 Level mit fünf Reisen → Finale → Epilog → «Zum Menü» ohne Neuladen; geschafft,
  nächster Grad hervorgehoben), mit Neuladen mitten in der Wüste (25 gelöst: «Weiter» an Wüste 26, ohne Einstieg, Stand
  richtig) und den Bildzeiten jeder Zwischenszene; etwa 7–8 min je Grad. `--groesse 360x640` für kleine Handys; `tippe`
  scrollt ein Element ausserhalb des Bildschirms erst wie ein Spieler herbei (Finger bzw. Mausrad). Die Ausnahme «erstes
  Zeichnen der Bühne» trat in keinem Lauf mehr auf und ist entfernt (`6785368`).
- **Durchgänge:** je Grad ganz auf Desktop (1440 × 900) und Handy hoch (390 × 844), quer (844 × 390) Leicht und Sehr
  schwer: 10 Läufe bestanden, Konsole leer. Dazu `--menue` («Von vorn» mit Rückfrage), `--uebersicht` (Wiederholen,
  Weltgrenze, Bestwerte) und `--dorf` (Einstieg ins Dorf) auf Desktop, Handy und quer; `--menue`, `--uebersicht` und ein
  Grad mit einer Welt auf 360 × 640 und 320 × 568: bestanden.
- **Längste Lücke je Szene** (ms, höchster Wert über die Grade; Desktop / Handy hoch / quer):

  | Szene | Desktop | Handy | quer |
  |---|---|---|---|
  | Menü → Prolog bis zum Angebot | 71 | 54 | 55 |
  | «Gleich los» → Einstieg Bergwald | 36 | 71 | 53 |
  | Einstieg ins Dorf («Üben» → Übung 1, `--dorf`) | 54 | 53 | 71 |
  | Reise → Meer | 54 | 54 | 54 |
  | Reise → Wüste | 89 | 89 | 89 |
  | Reise → Vulkan | 54 | 55 | 53 |
  | Reise → Planeten | 37 | 54 (Ausreisser 459) | 54 |
  | Reise → Sterne | 37 | 37 | 37 |
  | Neuladen → «Weiter» (Wüste 26) | 37 | 52 | 53 |
  | Finale (Level 60 → Epilog) | 42 | 37 | 37 |
  | Epilog bis «Zum Menü» | 53 | 36 | 37 |
  | Epilog → Menü | 20 | 20 | 19 |

  Übrige Übergänge (Menü, Übersicht, Dorf): höchstens 87 ms (Desktop «Spiel → Übersicht», bekannt) und 70 ms.
- **Ausreisser:** Handy Mittel, Reise → Planeten einmal 459 ms, rund 300 ms nach einem Bild der Probe; zwei frische
  Läufe 53 / 53 ms, in den übrigen 10 Planeten-Reisen höchstens 54. Ebenso 320 × 568 `--menue` einmal 414 ms im ersten
  Bild der Messung, direkt nach einem Bild der Probe; zwei frische Läufe 19 / 24 ms. Beide Male nach
  `Page.captureScreenshot` auf dem Handy, nicht im Spiel.
- **Beobachtung:** Reise Meer → Wüste hat in jedem Lauf und auf jedem Gerät eine Lücke von 71–89 ms gleich nach dem
  Klick auf «Weiter» (Schleier, noch Strand), also unter der Grenze, aber knapp und immer. Vermutlich der Träger
  `spray` oder das Freigeben/Laden am Strand; mit einem Profil ansehen.
- **Bilder** (`tests/output/geschichte/`): Texte, Knöpfe und Übergänge stimmen auf allen Grössen. Behoben (`9a6272b`):
  auf 320 × 568 lief «SEHR SCHWER» im Menü 40 px unter das Zeichen von «Von vorn»; unter 340 px sind Name, Punkte und
  «Von vorn» enger (gemessen: 6 px Abstand; 360 × 640 und grösser unverändert). Offen: Auf 360 × 640 und 320 × 568
  steht «Schliessen» der Übersicht unter den Kacheln ausserhalb des Bildschirms (man muss scrollen, der Kopf ist beim
  Öffnen weggescrollt); der Kicker «Kapitel 3 · Die Wüste» ist auf dem hellen Himmel der Reise kaum lesbar.
- **Tests** (Stand 2fff6e0): Strahlregel 2032, Golden 847 Level, Vorrat 18, Levelliste 54, Würfelliste 20, KI-Tester 84,
  Beurteilung 206, Geschichte 35, Generator 31, Offline, Bedienung (Konsole leer), `shots.mjs` Platz 1 und 240: alle
  bestanden; nach `9a6272b` Strahlregel, Golden, Vorrat, Levelliste und Geschichte erneut bestanden.

**Nachprüfung Reise in die Wüste (31.10.2026):** Die Lücke von 71–105 ms gleich nach «Weiter» (Schleier, noch Strand)
kam nicht vom Träger und nicht von den Felsbildern, sondern vom ersten Zeichnen des Kugelnetzes der Wüste (vorgeladen
unter «Gelöst», fertig etwa beim Klick): Ihr feines Netz (1024 × 512 statt 512 × 256) hat 6,3 MB Ecken und 12,6 MB
Dreiecke, die three in `skyWarmDraw` in einem Stück hochlud; `bufferData` wartete dabei 80 ms auf den Grafikprozess
(gemessen mit umwickelten WebGL-Aufrufen und Chrome-Trace: `WaitForToken` im rAF). Jetzt lädt `skyBufferUpload` Puffer
über 4 MB vor dem ersten Zeichnen in Stücken zu 2 MB je Bild in eigene WebGL-Puffer (`GLBufferAttribute`); kleinere
Netze (Wald, Strand, Vulkan) wie bisher (in Stücken war das Angebot des Walds einmal 88 statt 53 ms). Bild bitgleich
(Bildschirm Wüste, Strand, Wald alt/neu: 0 Pixel verschieden; Felsbilder `bitgleich/run.mjs`: alle gleich).
- Reise → Wüste, längste Lücke: Desktop Mittel vorher 88 ms (Grad Mittel, frisch), nachher 53 / 53 / 36 / 50 / 54 ms;
  Handy Schwer vorher 71–89 ms, nachher 72 (einmal, bei der Landung) / 36 / 50 / 50 / 54 ms. Die Lücke nach «Weiter» ist
  weg (höchstens 53 ms wie bei den anderen Reisen).
- Alle Reisen nachher (Desktop / Handy, je höchstens): Meer 59 / 56, Wüste 54 / 72, Vulkan 53 / 53, Planeten 37 / 71,
  Sterne 37 / 36; übrige Übergänge des Durchgangs höchstens 72 ms (Prolog, Wald schon bereit, wie früher 71). `--dorf`
  höchstens 54 ms (HEAD daneben 53/54).
- Tests: `--ganz` Mittel (Desktop) und Schwer (Handy) je fünfmal, `--dorf`, `tests/offline.mjs`, `tests/logic.test.mjs`
  (2032): alle bestanden, Konsole ohne Fehler.

**Abschluss (31.10.2026, Koordinator):** Werkzeug-Teil (`noa/08-werkzeuge`) und Review-Fix (`noa/08-spiel-review`, Felsbilder
über `OffscreenCanvas`) zusammengeführt; «Reihe» in `CONTEXT.md` nachgeführt (KI-Tester 84 bestanden); Nachprüfung der
Reise in die Wüste mit `cbbc8c6` bestanden. PLAN.md 0 auf erledigt, die kleinen offenen Punkte der Abnahme dort
nachgetragen. Lokal nach main gemergt auf Wunsch des Nutzers (kein Push).
