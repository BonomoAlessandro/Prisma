# 08: Aufräumen, Begriffe, Abnahme

**Spec:** ../spec.md

**Blocked by:** 05, 06, 07, 09

**Status:** ready-for-agent

**What to build:** Was die 500er-Reihe brauchte und nicht mehr gebraucht wird, ist weg; Begriffe und Entscheide sind
festgehalten; ein ganzer Durchgang je Grad ist im Browser geprüft. Danach ist der Stand bereit für den Merge, den der
Nutzer auslöst.

- [x] Code der alten Levelauswahl, der Würfel-Darstellung im Menü, der Hintergrund-Wahl und von `?signal` entfernt, wo
      er nicht mehr gebraucht wird (die Würfel-Strahlregel und -Darstellung bleiben, damit zurückgeholte Würfel-Level
      laufen).
- [ ] Werkzeuge und Tests der 500er-Reihe (Reihenfolge nach Formel, Seiten, Prüfliste) entfernt oder auf den Vorrat
      umgestellt; README und Kopfkommentare angepasst.
- [x] `CONTEXT.md`: Begriffe Geschichte, Durchgang, Welt, Vorrat, Übersicht, Titel; ADR «Die Geschichte ersetzt die
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
