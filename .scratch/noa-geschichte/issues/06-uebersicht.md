# 06: Übersicht mit Bestwerten, Wiederholen

**Spec:** ../spec.md

**Blocked by:** 04

**Status:** ready-for-agent

**What to build:** Die Übersicht des Grads ersetzt die Levelauswahl (Entscheid 9, 16, 24): die Welten des Durchgangs
mit je 10 Kacheln, dazu «Im Dorf», wenn es gespielt wurde. Gelöste Level lassen sich ohne Zwischenszenen wiederholen;
jede Kachel zeigt Bestzeit und wenigste Drehungen.

- [ ] Je Welt eine Reihe mit Name der Welt, ihrem Zeichen (Station) und der Summe der Bestzeiten; je Kachel Nummer,
      Titel, gelöst, Bestzeit, wenigste Drehungen. Das nächste ungelöste Level ist offen, spätere sind gesperrt.
- [ ] Speicherstand: je Level Bestzeit und wenigste Drehungen, je für sich (`prisma.noa.*`, je Grad).
- [ ] Wiederholen: ohne Träger, Reise und Untertitel; «Weiter» zum nächsten Level der Reihe; beim Wechsel der Welt
      blendet nur der Hintergrund; beim nächsten noch ungelösten Level gilt wieder der normale Ablauf (Einstieg,
      Reisen, Finale).
- [ ] Feld «Gelöst»: eine neue Bestmarke kurz melden («Neue Bestzeit», «Weniger Drehungen»).
- [ ] Aus dem Menü öffnet ein geschaffter Grad seine Übersicht (Ticket 05 anpassen).
- [ ] Wischen und Blättern wie in der bisherigen Levelauswahl, wo es passt; Probe im Browser auf Desktop und Handy (hoch
      und quer).
- [ ] Alle Tests grün; Review nach dem Ticket.

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
