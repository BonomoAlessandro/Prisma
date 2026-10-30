# 06: Übersicht mit Bestwerten, Wiederholen

**Spec:** ../spec.md

**Blocked by:** 04

**Status:** resolved

**What to build:** Die Übersicht des Grads ersetzt die Levelauswahl (Entscheid 9, 16, 24): die Welten des Durchgangs
mit je 10 Kacheln, dazu «Im Dorf», wenn es gespielt wurde. Gelöste Level lassen sich ohne Zwischenszenen wiederholen;
jede Kachel zeigt Bestzeit und wenigste Drehungen.

- [x] Je Welt eine Reihe mit Name der Welt, ihrem Zeichen (Station) und der Summe der Bestzeiten; je Kachel Nummer,
      Titel, gelöst, Bestzeit, wenigste Drehungen. Das nächste ungelöste Level ist offen, spätere sind gesperrt.
- [x] Speicherstand: je Level Bestzeit und wenigste Drehungen, je für sich (`prisma.noa.*`, je Grad).
- [x] Wiederholen: ohne Träger, Reise und Untertitel; «Weiter» zum nächsten Level der Reihe; beim Wechsel der Welt
      blendet nur der Hintergrund; beim nächsten noch ungelösten Level gilt wieder der normale Ablauf (Einstieg,
      Reisen, Finale).
- [x] Feld «Gelöst»: eine neue Bestmarke kurz melden («Neue Bestzeit», «Weniger Drehungen»).
- [x] Aus dem Menü öffnet ein geschaffter Grad seine Übersicht (Ticket 05 anpassen).
- [x] Wischen und Blättern wie in der bisherigen Levelauswahl, wo es passt; Probe im Browser auf Desktop und Handy (hoch
      und quer).
- [x] Alle Tests grün; Review nach dem Ticket.

## Comments

**Baustein vorgebaut (29.10.2026):** `.scratch/noa-geschichte/bausteine/uebersicht/` (`uebersicht.js`,
`uebersicht.css`, `probe.html`, `LIESMICH.md` mit Schnittstelle, Speicherstand-Vorschlag
`prisma.noa.<grad>.bestwerte` und `merkeBestwerte`; Bilder mit `aufnahme.mjs` neu). Desktop: alle Welten
untereinander mit Lichtweg je Reihe; Handy/Tablet: eine Welt je Seite, Stationen oben, Wischen nur auf den Kacheln.
Entscheide des Koordinators zu den offenen Fragen: Titel gesperrter Level bleiben blass sichtbar; nach «Überspringen»
im Dorf sind alle Übungen frei; eine neue Bestmarke wird erst gemeldet, wenn es schon einen Wert gab; die Taste L
öffnet die Übersicht wie bisher die Levelauswahl; Zeichen für Drehungen mit Legende genügt; die Gesamtsumme steht nur
bei einem geschafften Grad. Kleinigkeit für den Einbau: Trennung «Asteroiden-gürtel» statt «Asteroidengür-tel».

**Einbauplan (Koordinator, 30.10.2026)** – Grundlage `git show HEAD:index.html` (Ticket 04), Zeilen ungefähr dort;
dazu die Arbeitskopie von Ticket 05 (noch nicht committet). «hängt an 05» markiert, was es erst mit 05 gibt. 06 und
07 ändern dieselben Teile von `story` (`drives`, `save`, `advance`, `hudText`, `solvedText`, `markSolved`):
nacheinander bauen, nie zwei Agenten zugleich in `index.html`.

1. **Bestwerte ermitteln und speichern**
   - Als Feld im Stand des Grads, nicht als eigener Schlüssel wie im Baustein: `prisma.noa.<grad>` =
     `{ platz, geloest, gesehen, geschafft, bestwerte: { <name>: { zeit, drehungen } } }`. Gründe: `progress.keyOf`
     schreibt `sehr-schwer` (der Baustein `prisma.noa.${grad}` mit Leerzeichen), Ticket 04 sieht ein weiteres Feld
     vor (`progress.save` behält es), und «Von vorn» (`progress.remove`, hängt an 05) löscht die Bestwerte mit.
   - `progress.load` (Z. 14757): `bestwerte` prüfen (Objekt; je Name `zeit` und `drehungen` endliche Zahlen ≥ 0,
     sonst weg). `progress` bleibt ohne Bezug auf den Rest des Spiels: `tests/levelliste.test.mjs` (Z. 853–882)
     schneidet es heraus und gibt nur `localStorage` und `STORY_LEVELS` mit; dort die erwarteten Objekte anpassen und
     Fälle für `bestwerte` ergänzen (gültig, kaputt, je für sich verbessert).
   - Beim Lösen (`updateFlow`, Z. 14838–14845): `flow.record = story.markSolved(game.levelIndex, flow.solveStats)`.
     In `story.markSolved` (Z. 15640) gilt das frühe `return` bei schon gelöstem Level nur noch für `geloest`; die
     Bestwerte immer nachführen (`story.noteBest(name, stats)` nach `merkeBestwerte` aus dem Baustein, auf
     `this.stand.bestwerte`, `zeit = Math.floor(seconds)`), dann `save()`; zurück `{ neueBestzeit, wenigerDrehungen }`,
     ausserhalb der Geschichte `null`. Gemeldet nur, wenn es schon einen Wert gab. `flow.record = null` in
     `enterLevel` (Z. 14806). Wieder verdreht und neu gelöst gibt keine Meldung (mehr Zeit, mehr Drehungen).
   - Zeit unter Menü und Übersicht zählt nicht: `game.stats.startedAt` verschieben wie `story.resume` (hängt an 05).

2. **Meldung im Feld «Gelöst»**
   - `ui.showSolved` (Z. 15005) liest `flow.record`, nicht ein neues Argument: `story.resume` ruft es nach dem Menü
     erneut auf (hängt an 05). Eigenes Element in `#solved` (HTML Z. 425–429), etwa `<div class="best">` mit «Neue
     Bestzeit», «Weniger Drehungen» oder beidem mit « · »; dazu die Zahl in `.stats` hervorheben (Klasse an `.num`,
     ein Puls). Nicht nur in `.stats`: Auf dem Handy quer ist `#solved .stats` aus (CSS Z. 393), die Meldung muss dort
     in der Zeile oben stehen. `#solved` ist `aria-live`, der Bildschirmleser hört sie mit.

3. **Baustein einsetzen** (nach `LIESMICH.md`)
   - CSS, `<div id="uebersicht"></div>` (nach `#story` bzw. `#menue`, hängt an 05), Skript nach `STORY_ICONS`
     (Z. 15068). In `trenne` die Trennung «Asteroiden-gürtel» richten, danach `aufnahme.mjs pruefen`.
   - Daten (`story.overviewData(grad)`): Welten aus `STORY_CHAPTERS` (Name ohne Artikel, «Bergwald» … «Sterne»;
     Zeichen `storyChapterId(ch)`), Level aus `STORY_LEVELS[grad]` mit `titel` aus `LEVELS`, `geloest` und
     `bestwerte` aus dem Stand (laufender Grad `this.stand`, sonst `progress.load`), `aktuell` (Kapitel und Platz in
     der Welt) nur aus dem Spiel; `dorf` kommt mit 07.
   - Knopf «Übersicht» in `#controls` (HTML Z. 416–423), Zeichen der alten Levelauswahl (vier Quadrate, `fc22df1`),
     `title` «Übersicht (L)», vor «Menü», damit «Menü» unten rechts bleibt (hängt an 05). Nur in einem Level der
     Geschichte sichtbar.
   - **Aus dem Spiel** (Knopf, Taste L im Tastenhandler Z. 16390) wie «Menü» (hängt an 05): gleiche Wächter wie
     `story.toMenu`, `paused = { grade, at }`; den Teil von `openMenu` vor `menu.show` (Kopfzeile, «Gelöst», Knöpfe
     weg, Blick in den Himmel) als `story.lift()` teilen; `choosing = true` (dann stimmen `ui.showHud`,
     `ui.showSolved`, `tap` und `frameRate.busy` schon; Kommentar: Menü oder Übersicht offen); dann
     `uebersicht.show(…)`. Hinter ihrem halb durchsichtigen Hintergrund steht so der Himmel, nicht das Brett.
   - **Schliessen** (`onClose`: Esc, «Schliessen», Klick daneben; dazu L): `uebersicht.hide()`, `choosing = false`,
     `resume(paused)` (hängt an 05), Fokus auf «Übersicht».
   - **Aus dem Menü** (hängt an 05): `createMenu({ uebersicht: true })`; in `story.pick` die Aktion `'uebersicht'`:
     `menu.hide()`, `uebersicht.show(this.overviewData(grad))`; `onClose` → `menu.show(this.menuStand())` (das Menü
     nimmt nach einer Aktion erst nach `show()` wieder etwas an).
   - Tastenhandler gleich nach dem Startbildschirm: `if (uebersicht.offen) { M: Ton; L: schliessen; return; }`
     (Pfeile, Esc und Tab fängt die Übersicht selbst ab, R usw. wirkten sonst aufs Brett). `uebersicht` in
     `__prismaDebug` (Z. 16723) für die Proben.

4. **Wiederholen**
   - Neu `story.replay`: Ein gelöstes Level aus der Übersicht läuft. `step` bleibt das laufende Level; so stimmen
     `drives`, `hudText`, `markSolved` und in 05 `choose`/`resume` ohne Änderung. Der Fortschritt bleibt in
     `stand.platz`: `save()` (Z. 15627) schreibt `platz = Math.max(stand.platz, step)`. `setGrade` (Z. 15603) setzt
     `replay = false` (anderer Grad; «Von vorn» über `resetGrade`, hängt an 05).
   - **Kachel gewählt** (`onPlay`): Übersicht aus, `choosing = false`, `paused = null`; aus dem Menü vorher
     `setGrade(grad)` und `outside = false`. Gelöst (`wiederholen`): `step` = Platz der Kachel, `replay = true`,
     `begin()`; die Welt ist gesehen, also läuft der Zweig ohne Einstieg (hängt an 05: altes Brett versinkt mit
     `sinkTo`, `skyOf`, Blick senkt sich, Level wächst). Offen: ist es das Level auf dem Brett, wie Schliessen;
     sonst `replay = false`, `step` = Platz, `save()`, `begin()` (mit Einstieg, wenn die Welt neu ist).
   - **«Weiter»** (`advance`, Z. 15703) mit `replay`: nächstes Level gelöst → `step++`, gleiche Welt `changeLevel`,
     neue Welt `replayWorld(next)`. Ungelöst → `replay = false`, dann der normale Zweig (gleiche Welt
     `changeLevel`, sonst `chapterEnd` mit Reise). Am letzten Level: Grad geschafft → Übersicht; sonst `finale()`.
   - `solvedText` (Z. 16145) mit `replay`: am Ende einer Welt passt «Der Wald leuchtet» / «Weiter zum Meer» auch ohne
     Reise; am letzten Level eines geschafften Grads «Zur Übersicht» statt «Hinaufschauen». Kopfzeile wie sonst.
   - **`replayWorld(next)`**, nur der Himmel blendet (Entscheid 16), ohne leeres Brett: `running = true`,
     `flow.state = 'story'` (das alte Level dreht nicht mehr), «Gelöst» und Kopfzeile sofort weg;
     `skyTheme.quiet = true`, `fadeTime` 2,4 s und `blend` zwischen zwei Welten auf der Erde wie in `travel`
     (Z. 15740–15745). Das alte Level bleibt stehen, bis der neue Himmel `settled` ist (höchstens 8 s), dann
     `await this.sinkTo(i); enterLevel(i)`, während er überblendet; danach `fadeTime` zurück, `blend = null`,
     `running = false`, `quiet` 1,2 s nach dem Stehen des Levels aus (wie Z. 15773–15775).

5. **Proben** – `tests/geschichte-probe.mjs` (hängt an 05: `--menue`, `--quer`, `laden`, `messe`, `tippe`) um
   `--uebersicht`, Desktop, Handy hoch und quer:
   - Stand mit gelösten Leveln in Wald und Meer und einigen Bestwerten setzen; Übersicht mit Knopf und L öffnen:
     Kacheln gelöst/offen/gesperrt, Werte, laufendes Level; Esc zurück ins selbe Level, Drehungen bleiben, die Zeit
     in der Übersicht zählt nicht.
   - Wiederholen eines Levels im Bergwald aus dem Meer: kein Untertitel, kein Träger (`#story` zu), Himmel wechselt,
     `platz` im Speicher unverändert; «Weiter» über die Grenze Wald → Meer: nur der Himmel, kein leeres Brett,
     Bildzeiten ohne Lücke über 100 ms; beim ersten ungelösten Level wieder der normale Ablauf, `platz` wächst.
   - Bestwerte: Stand mit `{ zeit: 999, drehungen: 99 }`, `loese()` → «Neue Bestzeit · Weniger Drehungen», Speicher
     verbessert; erstes Lösen und gleiche Werte ohne Meldung; auf dem Handy quer sichtbar.
   - Menü: geschaffter Grad → Übersicht, Esc zurück ins Menü (Fokus beim Grad), Kachel → Wiederholen bis zum
     letzten Level → «Zur Übersicht»; «Von vorn» löscht die Bestwerte mit.
   - Wischen und Blättern auf dem Handy (Touch wie in der Probe von 05); Konsole leer.

6. **Risiken**
   - Auf `settled` warten, nicht auf `skyTheme.ready`: `ready` verlangt auch das scharfe Bild und die Streifen, die
     mit `quiet` erst danach laden – es wartete immer die vollen 8 s. `skyOf` aus 05 wartet auf `ready` (dort ohne
     `quiet`: passt für `begin`, nicht für `replayWorld`).
   - Eine Skybox aus Blender lädt 2–4 s (Review 04: 3,5–3,9 s); so lange steht nach «Weiter» noch das alte Level.
     Fühlt es sich in der Probe träge an: Blick in den Himmel wie beim Menü (`gazeTo`, hängt an 05).
   - Nach `quiet = false` lädt das scharfe Bild nach (Ruck von 30–80 ms) wie nach jeder Reise; auf dem Handy gibt
     `skyTheme.keep = 0` den alten Himmel sofort frei, hin und zurück lädt jedes Mal neu.
   - `story.blend` muss wieder `null` werden, sonst rechnet `blendSky` jedes Bild weiter.
   - `choosing` heisst neu «Menü oder Übersicht offen»: die Stellen in 05 (`choose`, `back`, `afterEpilog`) prüfen.
   - Ticket 09 ersetzt Platzhalter: Neue Namen stehen nicht in `geloest` und erscheinen vor `platz` als offen; mit
     `Math.max` fällt `platz` trotzdem nicht zurück.

7. **Offene Fragen**
   1. Bestwerte im Stand des Grads, die mit «Von vorn» gehen (so geplant), oder getrennt wie im Baustein, die es
      überleben? Die Rückfrage im Menü sagt «Der Stand dieses Grads wird gelöscht».
   2. Wiederholen bis zum letzten Level eines geschafften Grads: danach zurück in die Übersicht (Vorschlag) oder noch
      einmal Finale und Epilog? Die Spec nennt das Finale nur ab dem nächsten ungelösten Level.
   3. Wiederholen eines geschafften Grads aus dem Menü: `prisma.noa.zuletzt` nicht ändern (Vorschlag)? Sonst fehlt
      danach «Weiter» zum begonnenen Grad (Entscheid 25).
   4. Kopf der Übersicht: Der Baustein zeigt «Geschafft», sobald alle 60 gelöst sind, das Menü erst mit `geschafft`
      (Finale gesehen). Dem Baustein `geschafft` mitgeben?
   5. Übersicht aus dem Spiel mit Blick in den Himmel wie das Menü (Vorschlag, dieselben Wege wie 05) oder über dem
      Brett wie die alte Levelauswahl (schneller zum Nachschauen; Wiederholen in einer anderen Welt dann wie
      `replayWorld`)?

**Entscheide zu den offenen Fragen des Einbauplans (30.10.2026):**
1. **Bestwerte überleben «Von vorn»** (Entscheid des Nutzers): Sie liegen darum in einem eigenen Schlüssel je Grad,
   z. B. `prisma.noa.<grad>.bestwerte` mit derselben Schreibweise des Grads wie `progress.keyOf` (Bindestrich), und
   `resetGrade`/`progress.remove` löscht nur den Stand. Gesperrte Kacheln zeigen nach «Von vorn» keine Werte, bis das
   Level wieder gelöst ist; beim Lösen gilt der alte Bestwert als Vergleich (neue Bestmarke nur, wenn besser).
2. Nach dem letzten Level beim Wiederholen eines geschafften Grads kommt die Übersicht, kein Finale (Entscheid 16:
   Wiederholen ohne Zwischenszenen) (Koordinator).
3. Wiederholen in einem geschafften Grad ändert `prisma.noa.zuletzt` nicht, damit «Weiter» zum zuletzt gespielten,
   nicht geschafften Grad bleibt (Entscheid 25) (Koordinator).
4. «Geschafft» heisst überall: Finale gesehen (`geschafft` im Stand), auch in der Übersicht; sind alle 60 gelöst,
   aber das Finale fehlt (z. B. Neuladen im Finale), führt «Weiter» ins Finale (Koordinator).
5. Übersicht aus dem Spiel wie das Menü: Level pausiert, Blick in den Himmel (Koordinator).

**Aus dem Review von Ticket 05 (30.10.2026):** Ein geschaffter Grad im Menü braucht ohne Übersicht nach «Von vorn» einen
zweiten Klick zum Beginnen; mit der Übersicht (`uebersicht: true`, Zweig `'uebersicht'` in `story.pick`) entfällt das.
Auf dem Handy quer zeigt die Karte ihre Aktion nicht (so im Baustein) – dort beim Einbau eine Beschriftung oder ein
Zeichen ergänzen.

**Ergebnis (30.10.2026, Branch `feature/lichtsignal-prototyp`, nicht committet)**

- **Baustein eingesetzt** (`index.html`): CSS als Abschnitt «Übersicht des Grads», `<div id="uebersicht">` nach
  `#menue`, `createUebersicht` als Abschnitt «ÜBERSICHT DES GRADS» nach dem Menü, `uebersicht` in `__prismaDebug`.
  Beim Einbau geändert und im Baustein nachgeführt (`uebersicht.js`, `uebersicht.css`, `LIESMICH.md`):
  - Trennung nie vor einem Rest unter vier Buchstaben: «Asteroiden-gürtel» statt «Asteroidengür-tel» (über alle 240
    Titel geprüft: nur Trennstellen vor «-tel», «-bel», «-ter» usw. fallen weg, etwa «Bärenhü-ter», «Ring-ne-bel»).
  - `daten.geschafft` (Finale gesehen) für den Kopf «Geschafft» (Entscheid 4); ohne Angabe wie bisher «alle gelöst».
  - `daten.dorf.frei` (Ticket 07): nach «Überspringen» ist jede ungelöste Übung frei (spielbar wie die offene, ohne
    Hof, `.ueb-frei`).
  - `vorwaermen(daten)`: einmal fast durchsichtig zeichnen. Das erste Öffnen hielt sonst ein Bild 97–102 ms an (Long
    Animation Frame ohne Skript und Layout: der Browser zeichnete alles zum ersten Mal), danach nie mehr. Im Spiel unter
    dem ruhigen Startbildschirm (`introCalm`); danach erstes Öffnen auf dem Desktop 79 ms statt 97.
  - Nur im Spiel: Ebene 7 statt 6, damit die Übersicht über dem ausblendenden Menü liegt (beide überblenden).
- **Bestwerte** (Entscheid 27 des Nutzers: eigener Schlüssel): `prisma.noa.<grad>.bestwerte` (Grad mit Bindestrich wie
  `progress.keyOf`), `progress.best(grad)` (Kaputtes fällt weg) und `progress.noteBest(grad, name, stats)` nach
  `merkeBestwerte` (Zeit in ganzen Sekunden, je für sich; gemeldet nur eine Verbesserung eines vorhandenen Werts).
  `progress.remove` («Von vorn») lässt sie stehen; gesperrte Kacheln zeigen danach keine Werte, bis das Level wieder
  gelöst ist (`overviewData` gibt Werte nur für gelöste). `story.markSolved(index, stats)` führt sie immer nach, auch
  beim Wiederholen, und gibt `{ neueBestzeit, wenigerDrehungen }` zurück (`flow.record`, in `enterLevel` null).
- **«Gelöst»:** `#solved-best` unter der Meldung («Neue Bestzeit», «Weniger Drehungen» oder beides mit « · »), die
  verbesserte Zahl leuchtet einmal auf; auf dem Handy quer in der Zeile oben. Liest `flow.record`, also auch nach
  Menü oder Übersicht (`resume`).
- **Übersicht öffnen:** aus dem Spiel mit dem Knopf «Übersicht» (vier Quadrate wie die alte Levelauswahl, vor «Menü»,
  nur in einem Level der Geschichte) oder L, wie «Menü»: gleiche Wächter, `paused`, `story.lift()` (aus `openMenu`
  geteilt: Kopfzeile, «Gelöst», Knöpfe weg, Blick in den Himmel), `choosing` heisst jetzt «Menü oder Übersicht offen».
  Aus dem Menü: `uebersicht: true`, Zweig `'uebersicht'` in `story.pick` (Menü blendet aus, Übersicht darüber ein).
  Schliessen (Esc, «Schliessen», Klick daneben, L) führt dorthin zurück: ins Menü mit dem Fokus auf der Karte des
  Grads, bzw. ins Level (`resume`: Drehungen bleiben, die Zeit zählt nicht) mit dem Fokus auf «Übersicht». Unter der
  Übersicht wirken nur M und L (Tastenhandler gleich nach dem Startbildschirm).
- **Wiederholen** (`story.replay`, `playFromOverview`, `replayWorld`): wie im Einbauplan. `step` ist das laufende Level,
  `save()` schreibt `platz = max(platz, step)`, `setGrade` beendet das Wiederholen. `begin()` kommt mit `replay` immer
  ohne Prolog und Einstieg. «Weiter»: nächstes gelöstes Level gleiche Welt `changeLevel`, andere Welt `replayWorld`
  (nur der Himmel, `quiet`, 2,4 s, `blend`; das alte Level bleibt stehen, bis der neue Himmel `settled` ist); ungelöst →
  normaler Ablauf (Reise, Finale); nach dem letzten Level eines geschafften Grads «Zur Übersicht» (Übersicht wie aus
  dem Spiel, Schliessen zurück ins gelöste Level). Die offene Kachel ist, wenn ihr Level auf dem Brett steht, wie
  Schliessen; sonst normaler Ablauf ab dort.
- **Menü, Handy quer:** Die Aktion der Karte («Übersicht ›», «Fortsetzen ›», «Beginnen ›») steht klein hinter dem Stand
  in derselben Zeile (Abweichung vom Menü-Baustein, der sie dort ausblendet); mit vier «Von vorn» passt die Liste
  weiterhin (Bild `quer-menue-start.png`).
- **Proben** `tests/geschichte-probe.mjs --uebersicht` (Desktop mit Maus und Tasten, Handy hoch und quer mit
  `Input.dispatchTouchEvent`), alle bestanden, Konsole ohne Fehler: Übersicht aus dem Spiel (Knopf, L), Zustände und
  Werte der Kacheln, laufendes Level, Tasten darunter (R wirkt nicht, M schon, Pfeile, Strg+Pos1, Enter spielt),
  Schliessen zurück ins selbe Level (Drehung bleibt, `startedAt` um die Zeit in der Übersicht verschoben); Wiederholen
  Bergwald 1 aus dem Meer (kein Untertitel, kein Träger, Himmel erst im Himmel gewechselt, `platz` bleibt 13); «Neue
  Bestzeit · Weniger Drehungen» (auch quer sichtbar), bei gleichen Werten und beim ersten Lösen keine Meldung, Bestwerte
  entstehen; «Weiter» Bergwald 10 → Meer 1 (Blick bleibt auf dem Brett, das Level versinkt erst nach `settled`, danach
  `blend` null, `quiet` aus, `fadeTime` zurück); Meer 3 → Meer 4 wieder normal, `platz` wächst auf 14; Menü: Karte
  «Übersicht» (auch quer sichtbar) → Übersicht Leicht (Geschafft, Summe 49:30), auf dem Handy Station, Pfeil und
  Wischen, Esc/«Schliessen» zurück ins Menü (Fokus `wahl:leicht`); Kachel Sterne 9 → Wiederholen aus dem Menü
  (`prisma.noa.zuletzt` bleibt `mittel`) → Sterne 10 → «Ganz oben» / «Zur Übersicht» → Übersicht mit dem laufenden
  Level → zurück ins gelöste Level; «Von vorn» Leicht: Stand weg, Bestwerte gleich, keine Werte auf den Kacheln. Auf
  dem Desktop dazu: nach dem Wiederholen ein ungelöstes Level in der nächsten Welt mit Reise, danach `platz` 11.
  Ebenso bestanden: `--menue` auf Desktop, Handy hoch und quer (Erwartung «Von vorn» jetzt auch beim geschafften Grad),
  `--finale leicht` und `--grad mittel --welten 1` auf dem Desktop.
- **Bildzeiten** (längste Lücke; Desktop / Handy hoch / quer): Spiel → Übersicht 79 / 30 / 24 ms, Übersicht → Spiel
  30 / 12 / 18, Übersicht → Wiederholen (andere Welt) 67 / 12 / 18, Weiter über die Weltgrenze (Wiederholen)
  49 / 43 / 85, Menü → Übersicht 36 / 12 / 12, Übersicht → Menü 30 / 19 / 6, Übersicht (Menü) → Wiederholen im
  geschafften Grad 43 / 24 / 18, letztes Level → Übersicht 25 / 18 / 7. Keine Lücke über 100 ms. Im ersten Lauf auf dem
  Desktop (vor `vorwaermen`) zweimal knapp darüber: Weltgrenze 121 ms und Menü → Wiederholen 109 ms; in einer
  eigenen Messung mit frisch geladenem Strand (`keep = 0`, je zweimal) und im zweiten Lauf nicht wieder (48–55 ms).
  Die längste Stelle der Weltgrenze ist das erste Zeichnen der neuen Skybox, während das Level wächst; eine Reihenfolge,
  in der das Level erst wächst, wenn der neue Himmel zu sehen ist, brachte nichts Messbares, aber 150 ms leeres Brett –
  verworfen.
- **Tests** (nacheinander über `leise.sh`, `LEISE_CPU=50`, Zeitrahmen innerhalb): Strahlregel 1963, Golden 824 Level,
  Vorrat 15, Levelliste 55 (Speicherstand um die Bestwerte erweitert: erstes Lösen und gleiche Werte ohne Meldung, je
  für sich aus zwei Läufen, «Von vorn» lässt sie stehen, Kaputtes fällt weg), Würfelliste 20, KI-Tester 84,
  Beurteilung 206, Geschichte 30, Generator 31, Offline, Bedienung (`interaction-probe.js`) und `shots.mjs` (Platz 1
  und 240, Desktop und Handy, weiter drei Knöpfe) bestanden; `CONTEXT.md` unverändert. Baustein: `aufnahme.mjs
  pruefen` (Tastatur, Ereignisse, Laptop und Tablet; `dorf-laptop.png` trennt «Asteroiden-gürtel»).
- **Entscheide (selbst):** Knopf «Übersicht» nur in einem Level der Geschichte (`hidden` sonst, auch für die Bilder der
  KI-Tester); `vorwaermen` unter dem Startbildschirm (mit `?nointro` gleich beim Öffnen des Menüs); das Wiederholen
  ändert `prisma.noa.zuletzt` auch nicht, wenn man mit Esc aus dem Menü in ein Wiederholen eines geschafften Grads
  zurückkehrt (`choose`); ein Wiederholen, das im Menü über «Weiter» desselben Grads fortgesetzt wird, bleibt ein
  Wiederholen; «Weiter» im Wiederholen speichert nichts.
- **Offen / für später:**
  - Ticket 07: `overviewData` liefert «Im Dorf», sobald `stand.dorf` besteht (`frei` bei `ende: 'uebersprungen'`);
    `playFromOverview` übergeht `welt: 'dorf'` noch, `aktuell` im Dorf und der Knopf «Übersicht» im Dorf
    (`ui.showHud` blendet ihn heute ohne `drives` aus) kommen dort dazu. Bestwerte der Übungen laufen über
    `markSolved`, sobald `drives` das Dorf kennt.
  - Ticket 08: «Wiederholen» und «Bestwerte» ins Glossar (heute nur unter «Übersicht»); das erste Zeichnen einer frisch
    geladenen Skybox (Reise, Weltgrenze im Wiederholen) kostet auf dem Desktop 50–120 ms; auf kleinen Handys hoch
    (unter 700 px Höhe) blendet das Menü die Aktion der Karte weiterhin aus (Baustein).
  - Platzhalter (Ticket 09): Ein ungelöstes Level vor `platz` erscheint als offen; danach läuft der normale Ablauf auch
    über schon gelöste Level, `platz` fällt nie zurück.

**Review Code (30.10.2026)** – unabhängiger Reviewer, Schwerpunkt Code und Tests; geprüft gegen die Häkchen, die Spec
(Entscheide 9, 16, 19, 24, 25, 27, «Speicherstand») und die Entscheide zu den offenen Fragen, nicht gegen das Ergebnis
oben.

- **Speicherstand:** in Ordnung. Bestwerte unter `prisma.noa.<grad>.bestwerte` (Bindestrich über `progress.keyOf`),
  `progress.remove` lässt sie stehen, Kaputtes fällt einzeln weg; gemeldet nur die Verbesserung eines vorhandenen Werts,
  Zeit in ganzen Sekunden wie `formatDuration`; die Zeit unter Menü und Übersicht verschiebt `resume`; `save()` mit
  `Math.max` (sonst schreibt keine Stelle `platz`); `zuletzt` bleibt beim Wiederholen eines geschafften Grads (`choose`,
  `playFromOverview`); «geschafft» ist überall `stand.geschafft`.
- **Wiederholen:** in Ordnung, keine hängenden Zustände gefunden (eigene Probe, Desktop und Handy): L während das Level
  versinkt, dann eine Kachel; L, Esc und Enter während `replayWorld`; Neuladen mitten im Wiederholen (Platz 14 bleibt,
  `replay` aus, `zuletzt` gleich); Menü ↔ Übersicht ↔ Spiel.
- **Baustein:** im Spiel bis auf eine Einrückung gleich wie im Baustein (dort gerichtet); die Abweichungen (Trennregel,
  `geschafft`, `dorf.frei`, `vorwaermen`, Ebene 7) sind begründet und nachgeführt.
- **Behoben:**
  1. Doppelklick und gehaltenes Enter (`createUebersicht`, Spiel und Baustein, LIESMICH nachgeführt): Ein Doppelklick
     auf «Zur Übersicht» startete auf dem Desktop die Kachel unter dem Zeiger (Sterne 5 statt der Übersicht), ein
     Doppeltipp auf «Übersicht» schloss sie auf dem Handy gleich wieder, und ein gehaltenes Enter auf der Karte eines
     geschafften Grads spielte über die Tastenwiederholung sofort eine Kachel. Jetzt wirkt ein Klick mit Maus oder
     Finger (`e.detail > 0`) in den ersten 400 ms nach `show()` nicht, und ein wiederholtes Enter spielt nichts.
  2. CSS: `#solved .best` traf auch die hervorgehobene Zahl `.num.best` (Einzug 0,4 em); jetzt `#solved > .best`.
  3. `replayWorld` setzt `fast = 1` wie `ascend`: Ein Enter beim Herauswachsen davor verkürzte sonst das Warten auf den
     neuen Himmel (höchstens 2,7 statt 8 s).
  4. JSDoc von `createUebersicht` (gibt auch `vorwaermen` zurück, `onPlay` auch für freie Kacheln), Zeilen über 120
     Zeichen im Kommentar von `replayWorld` und im README umbrochen.
  5. Fokus nach dem Schliessen (Entscheid des Koordinators, nach dem ersten Bericht): Er lag immer auf «Übersicht»,
     so dass Enter in einem gelösten Level die Übersicht wieder öffnete statt weiterzuführen. Jetzt kommt er in einem
     gelösten Level auf «Weiter» im Feld «Gelöst», sobald es wieder steht (`closeOverview` nach `resume`), in einem
     ungelösten bleibt er auf «Übersicht». Die Probe prüft es auf dem Desktop nach dem letzten Level (`btn-next`).
- **Offen (klein, ohne Handlungsbedarf):**
  - Enter oder Leertaste während `replayWorld` beschleunigt noch dessen Warten (`tap` setzt `fast = 3`, wie bei den
    Reisen gewollt); harmlos, die nächste Zwischenszene setzt es zurück.
  - `playFromOverview` wechselt den Grad (`setGrade`) vor der Prüfung `i < 0`; nur bei einem fehlenden Level erreichbar.
- **Tests** (nacheinander über `leise.sh`, `LEISE_CPU=50`, Zeitrahmen innerhalb): Strahlregel 1963, Golden 824 Level,
  Vorrat 15, Levelliste 55, Würfelliste 20, KI-Tester 84, Beurteilung 206, Geschichte 30, Generator 31, Offline,
  Bedienung (`interaction-probe.js`, Konsole leer), `shots.mjs` Platz 1 und 240 (Desktop, Handy): alle bestanden.
  `geschichte-probe.mjs --uebersicht` auf Desktop, Handy hoch und quer (vor und nach den Korrekturen) und `--menue` auf
  dem Desktop bestanden, Konsole ohne Fehler, keine Lücke über 100 ms (längste nach den Korrekturen 91 ms);
  `aufnahme.mjs pruefen` des Bausteins wie vorher. Nach Punkt 5 erneut: `--uebersicht` auf dem Desktop bestanden
  (längste Lücke 73 ms), `tests/geschichte.test.mjs` 30 bestanden; eigene Probe: Esc im gelösten Level, dann Enter
  führt ins nächste Level (Platz 14).
- **Commitbereit:** ja.

**Review Browser (30.10.2026):** Desktop mit Maus und Tasten, Handy hoch und quer mit Touch: bestanden, Konsole leer.
Die im ersten Lauf gemessenen Lücken von 100–200 ms beim Öffnen/Schliessen der Übersicht aus dem Spiel bestätigten
sich im Vergleichslauf nicht (Spiel → Übersicht höchstens 54 ms, Übersicht → Spiel höchstens 42 ms, gleich wie
Spiel ↔ Menü). Kleinigkeiten für Ticket 08: Pfeile/Pos1/Ende wirken nicht, solange «Schliessen» den Fokus hat; der
Hinweis zur gesperrten Kachel steht auf dem Desktop weit weg von der Kachel; «Schliessen» ist 43 statt 44 px hoch.
