# 07: Kapitel «Im Dorf»

**Spec:** ../spec.md

**Blocked by:** 04

**Status:** ready-for-agent

**What to build:** Das Tutorial als Kapitel der Geschichte (Entscheid 3, 10, 18): Nach dem Prolog fragt ein Untertitel
«Möchtest du zuerst mit Noa im Dorf üben?» mit «Üben» und «Gleich los». «Üben» spielt die 9 Tutorial-Level im Dorf,
danach bringen die Glühwürmchen das Licht in den Bergwald wie heute.

- [x] Angebot nach dem Prolog, beim ersten Durchgang je Grad; ohne Vorgabe, der Spieler wählt.
- [x] «Im Dorf»: die 9 Tutorial-Level mit ihren Hinweisen und Namen, Hintergrund vorerst die Milchstrasse (eine
      eigene Skybox macht der Nutzer später; der Hintergrund ist an einer Stelle austauschbar); Kopfzeile etwa
      «Im Dorf – Erstes Licht» und «Übung 1 / 9».
- [x] «Überspringen» während des ganzen Kapitels; danach weiter zum Einstieg in den Bergwald.
- [x] Einstiege in die Welten überspringbar (Entscheid 10, im Review von Ticket 04 als offen gefunden): heute lassen
      sie sich nur durch Tippen beschleunigen; ein «Überspringen» wie beim Prolog, das ohne Ruckeln ins Level führt.
- [x] Ein kurzer Text der Geschichte zum Kapitel (Noa übt mit der Taschenlampe), im Stil der übrigen Untertitel.
- [x] Die Übersicht (Ticket 06) zeigt «Im Dorf», wenn es gespielt wurde; das Kapitel zählt nicht zu den 60 Leveln.
- [x] Probe im Browser: Üben, Gleich los, Überspringen mitten im Kapitel; Desktop und Handy.
- [ ] Alle Tests grün; Review nach dem Ticket. (Tests grün, Review steht aus)

## Comments

**Entwurf der Texte (Koordinator, 30.10.2026)** – im Ton von Prolog und Reise-Untertiteln, Noa ohne Pronomen:

- **Angebot nach dem Prolog** (Untertitel mit zwei Knöpfen): Kicker «Im Dorf», Text «Bevor die Glühwürmchen das
  Licht in den Wald tragen: Möchtest du zuerst mit Noa im Dorf üben?» – Knöpfe «Üben» und «Gleich los».
- **Einstieg ins Kapitel** (Kicker «Im Dorf · Erstes Licht»): «Hinter dem Haus übt Noa mit der Taschenlampe. Ein
  alter Spiegel, ein Stück buntes Glas – und das Licht geht genau dorthin, wo Noa es haben will.»
- **Ende des Kapitels**, auch nach «Überspringen», danach der Glühwürmchen-Flug in den Bergwald wie heute: «Jetzt
  weiss Noa, wie man Licht weitergibt. Am Waldrand blinken schon die Glühwürmchen.»
- Kopfzeile: «Im Dorf – <Name der Übung>», darunter «●○○○ Leicht · Übung 3 / 9» (Grad wie gewählt).

**Einbauplan (Koordinator, 30.10.2026)** – Grundlage `git show HEAD:index.html` (Ticket 04), Zeilen ungefähr dort;
dazu die Arbeitskopie von Ticket 05 (noch nicht committet). «hängt an 05» markiert, was es erst mit 05 gibt. 06 und
07 ändern dieselben Teile von `story`: nacheinander bauen, nie zugleich in `index.html`; wer als Zweiter kommt, führt
zusammen (Bestwerte der Übungen und die Reihe «Im Dorf» brauchen beide).

1. **Das Dorf an einer Stelle** – bei `STORY_CHAPTERS` (Z. 15086) `const STORY_DORF = { station: 0, title: 'Im Dorf',
   sky: 'milky', … }` mit Angebot, Einstieg, Ende und den Texten für «Gelöst» nach der 9. Übung (Texte aus dem
   Kommentar oben). `sky` ist die austauschbare Stelle für die spätere eigene Skybox (`story.setSky` fällt auf
   `milky` zurück). Die Übungen sind `LEVELS[0 … TUTORIAL_COUNT − 1]` (Daten Z. 1140–1270, `TUTORIAL_COUNT` Z. 7288;
   die Tests verlangen 9 am Anfang von `LEVELS`), mit `name` und `hint`.

2. **Zustand und Speicherstand**
   - `story.inDorf` (das Kapitel läuft) und `story.uebung` (0–8); `story.currentIndex()` = `inDorf ? uebung :
     steps[step].index`. Damit `drives` (Z. 15626) und – hängt an 05 – die Bedingung für `resume` in `choose` (dort
     `game.levelIndex === this.steps[this.step]?.index`): sonst führt «Menü» → «Weiter» mitten im Dorf über
     `begin()` in den Bergwald.
   - Stand `prisma.noa.<grad>`: `gesehen` + `'angebot'` (nach der Wahl, auch bei «Gleich los») und + `'dorf'` (nach
     dem Einstieg ins Dorf; `STORY_STATIONS[0]` heisst schon `dorf`); neues Feld `dorf: { platz: 0–8, ende: null |
     'gespielt' | 'uebersprungen' }`, nur nach «Üben». Gelöste Übungen kommen mit ihrem Namen in `geloest`, ihre
     Bestwerte (06) ebenso. `save()` (Z. 15627) im Dorf: `stand.dorf.platz = uebung`, `platz` bleibt 0. `dorf` beim
     Laden prüfen, aber in `story.setGrade`, nicht in `progress` (der Test in `levelliste.test.mjs` Z. 853 schneidet
     `progress` ohne `TUTORIAL_COUNT` heraus).
   - Menü (hängt an 05): `menuStand` zählt nur Namen aus `STORY_LEVELS` und meldet `welt: 'dorf'`, solange `wald`
     nicht gesehen ist – «Dorf · 0 / 60» ab dem Prolog stimmt ohne Änderung, ebenso die Rückfrage «im Dorf».

3. **Angebot nach dem Prolog**
   - In `begin()` (Z. 15683, in 05 umgebaut) nach dem Prolog: `if (!this.seen('angebot'))` das Angebot. Es steht auf
     der Bühne, bevor sie ausblendet: `playScene` (Z. 15866) bekommt eine Option, die nach der letzten Einstellung
     **und nach «Überspringen»** (dort `sc.speed = 1`, `sc.skip` weg) Kicker, Text und zwei Knöpfe zeigt
     (`sc.actions([['Üben', …], ['Gleich los', …]])` wie der Epilog, Z. 15486), den Fokus auf «Üben» setzt und auf
     die Wahl wartet. Die Bühne hat noch keinen Kicker: Element in ihrer `.sub` ergänzen (Markup Z. 15357, CSS um
     Z. 361).
   - Prolog gesehen, Angebot nicht (Neuladen dazwischen): Bühne nur mit dem Angebot (`sc.reset(STORY_PROLOG.at(-1))`,
     ohne Fahrt).
   - Hintergrund: 05 lädt den Wald schon hinter dem Prolog (`setSky(ch.sky)` in `begin`); nach «Üben»
     `setSky(STORY_DORF.sky)` (Milchstrasse aus dem Code, sofort da), nach «Gleich los» bleibt der Wald.

4. **Ablauf «Im Dorf»**
   - «Üben»: `stand.dorf = { platz: 0, ende: null }`, `see('angebot')`, `inDorf = true`, dann der Einstieg ins Dorf
     über `enter()` (Z. 15985) mit Parametern statt der Werte des Kapitels: Kicker «Im Dorf · Erstes Licht», Text,
     Weg `0`, Moment `'dorf'` für `fall()` (Z. 16029 markiert heute `storyChapterId(this.chapter())`, das wäre
     `wald`), kein Träger (siehe offene Frage 3).
   - Fortsetzen (Neuladen, Menü): in `begin()` vor dem Bergwald: `stand.dorf` ohne `ende` → im Dorf an `dorf.platz`
     weiter; ist `dorf` gesehen, ohne Einstieg wie der Zweig «Welt gesehen» in 05 (`skyOf(STORY_DORF)`, Blick senkt
     sich, `enterLevel(uebung)`). `story.init` (Z. 15593) lädt dann hinter dem Startbildschirm `STORY_DORF.sky`.
   - `advance()` (Z. 15703) im Dorf: `uebung++`, `save()`, `changeLevel(uebung)`; nach der 9. `dorfEnde('gespielt')`.
   - Kopfzeile (`hudText` Z. 16140, `ui.showHud` Z. 14956): «Im Dorf – <name>», darunter der Grad aus `story.grade`
     (`fillTier(tier, { grad: story.grade })`; die Übungen haben keinen), «Übung 3 / 9» und der Hinweis mit
     `{Klick}`/`{Rechtsklick}` wie im Zweig `lvl.tutorial` (Z. 14982). Den Hinweis nicht in `.ctl` legen (05 blendet
     `.ctl` auf dem Handy quer aus), die Klasse `tutorial` behalten (hält dort die Unterzeile, CSS Z. 120). Der Zweig
     für Übungen ausserhalb der Geschichte (`zeige`, KI-Tester, `interaction-probe.js`) bleibt.
   - `solvedText` (Z. 16145): Übung 1–8 «Gelöst» / «Weiter», nach der 9. die Texte aus `STORY_DORF` (etwa «Das Dorf
     leuchtet» / «In den Bergwald»).
   - Im Dorf kein Knopf «Übersicht» und keine Taste L (06); «Menü» und Esc bleiben (hängt an 05).

5. **Überspringen und Ende des Kapitels**
   - Knopf «Überspringen» während des ganzen Kapitels (auch beim Herauswachsen und unter «Gelöst»), oben rechts im
     Stil von `.scene .skip` (CSS Z. 384). Vorschlag: ein Knopf `#btn-skip` nach `#story` (z-index 7), den auch die
     Einstiege nutzen (Punkt 6); unter Menü und Übersicht versteckt. Im Dorf bleibt Esc beim Menü.
   - `dorfEnde(art)`, nicht während `running`: `running = true`, `flow.state = 'story'`, «Gelöst», Kopfzeile und
     Knöpfe weg; `stand.dorf.ende = art`, `inDorf = false`, `save()`; Blick hebt sich (`gazeTo(1, …)`, hängt an 05;
     `enter` setzte sonst `gaze = 1` mit einem Schnitt), Untertitel mit dem Ende (`caption()`, Z. 16069, wartet auf
     Tippen), dann `enter(steps[0].index, STORY_CHAPTERS[0], this.sinkTo(steps[0].index))`: Glühwürmchen und «Kapitel
     1 · Der Bergwald» wie heute nach dem Prolog, `fall` markiert `wald`.
   - Übersicht (06): Reihe «Im Dorf», sobald `stand.dorf` besteht. Nach `'uebersprungen'` sind alle Übungen frei
     (Entscheid des Koordinators zu 06); der Baustein kann das noch nicht (`baueReihen` macht nur die erste
     ungelöste Übung offen): Option wie `dorf.frei` ergänzen. Eine Übung aus der Übersicht läuft immer als
     Wiederholen (`inDorf`, `replay`, ohne Einstieg), «Weiter» zur nächsten, nach der 9. zurück in die Übersicht.

6. **Einstiege überspringbar** (Entscheid 10)
   - `story.skip()` (Knopf aus Punkt 5; Esc über `story.keydown`, Z. 16129, heute nur `skipProlog`) setzt im Einstieg
     ein Flag. Die Tweens von `enter` und `fall` tragen eine Marke; neu `story.dropTweens(marke)` nimmt sie aus
     `this.tweens` und erfüllt ihre Promise ohne letzten Schritt (sonst sprängen Lichtpunkt und Kamera ans Ende).
     `enter` prüft das Flag nach jedem `await` und geht zu `land()`.
   - `land(index, moment, sunk)`, Vorbild Prolog (kein Schnitt, nur eine kürzere, weiche Fahrt): Untertitel zu,
     Träger und Lichtpunkt in 0,4 s aus, `await sunk`, Blick senkt sich weich (`gazeTo(0, ~1,8)`, hängt an 05), das
     Level wächst ab k > 0,25 wie im Zweig «Welt gesehen»; `see(moment)`, Knöpfe an.
   - Zeitpunkte: Himmel lädt noch (`skyOf`): weiter warten, Kamera bleibt im Himmel, dann landen; Flug; Warten auf
     `sunk`; `fall` vor `enterLevel` → landen; nach `enterLevel` ist der Knopf weg. Gleich für den Einstieg ins Dorf.
     Tippen beschleunigt weiter (`fast = 3`).

7. **Proben** – `tests/geschichte-probe.mjs` um `--dorf` (hängt an 05: `laden`, `tippe`, `messe`), Desktop, Handy hoch
   und quer (Touch):
   - Neuer Grad: Prolog mit dem Knopf überspringen → Angebot (Kicker, Text, Fokus auf «Üben») → «Üben» → Einstieg
     ins Dorf (Himmel `milky`, `gesehen` mit `angebot` und `dorf`, ohne `wald`) → drei Übungen mit `loese()` und
     «Weiter»: Kopfzeile «Im Dorf – Umweg», «Übung 2 / 9», Hinweis; `dorf.platz` im Speicher.
   - Neuladen → Menü «Dorf · 0 / 60» → «Weiter» → Übung 4 ohne Prolog, Angebot und Einstieg; Menü (Esc) mitten in
     einer Übung und zurück: dieselbe Übung.
   - «Überspringen» mitten in einer Übung und während des Herauswachsens → Ende → Glühwürmchen in den Bergwald,
     `dorf.ende = 'uebersprungen'`, Übersicht mit «Im Dorf», alle Übungen frei. Einmal alle 9 Übungen bis zum Ende.
   - «Gleich los»: Einstieg in den Bergwald wie heute, kein `dorf` im Stand, Übersicht ohne Dorf.
   - Einstieg überspringen zu den Zeitpunkten aus Punkt 6: Level steht, Untertitel zu, Moment gesehen, genau ein
     `enterLevel`, Bildzeiten ohne Lücke über 100 ms, Konsole leer.
   - Tastatur: Tab und Enter im Angebot, Esc im Einstieg überspringt, Esc im Dorf öffnet das Menü.

8. **Risiken**
   - 05 ist noch nicht committet: `begin`, `enter(index, ch, sunk)`, `choose`/`resume`, `gazeTo`, `skyOf` können
     sich noch ändern.
   - `fall` und `see` hängen am Kapitel des Platzes (`this.chapter()`): im Dorf überall den Moment mitgeben.
   - Abbruch: nur die markierten Tweens verwerfen, nicht `gazeTo` oder das Warten in `skyOf`; `present()` blendet über
     `storySleep` in echter Zeit um – ein Überspringen mitten darin darf den Untertitel nicht stehen lassen.
   - Handy quer: Kopfzeile mit Hinweis über dem Brett, «Überspringen» oben rechts neben der Meldung «Gelöst», die
     dort oben in einer Zeile steht – in der Probe auf Überdeckung prüfen.
   - Vorwärmen: `story.firstIndex()` (Z. 15617) und `story.init` kennen das Dorf nicht; die Vorwärm-Elemente decken
     jede Art ab, nur der Himmel hinter dem Startbildschirm muss stimmen.
   - Mit einer eigenen Skybox fürs Dorf (später) lädt 05 vor dem Prolog den Wald, obwohl vielleicht «Üben» folgt.

9. **Offene Fragen**
   1. Angebot auch nach «Überspringen» des Prologs? Vorschlag ja: Es ist eine Wahl, keine Zwischenszene.
   2. Sollen auch die Reisen überspringbar sein? Entscheid 10 nennt Prolog, Angebot und Einstiege; im ersten
      Durchgang kommen Meer bis Sterne aber über Reisen (CONTEXT «Einstieg in eine Welt»: nur ohne Reise davor). Der
      Abbruch liesse sich in `travel` gleich bauen.
   3. Einstieg ins Dorf ohne Träger (nur das Licht der Lampe, wie der Text sagt) oder mit den Glühwürmchen, die laut
      Text erst am Ende am Waldrand blinken?
   4. Übungen aus der Übersicht: nach der 9. zurück in die Übersicht (Vorschlag) oder weiter, wo der Durchgang steht?
   5. Übersicht im Dorf ausgeblendet (Vorschlag) oder mit spielbaren Übungen?
   6. CONTEXT sagt «Im Dorf … ist keine Welt», es bekommt aber einen Einstieg, eine Station und den Moment `dorf`:
      Begriff «Einstieg ins Dorf» in Ticket 08 ergänzen.

**Entscheide zu den offenen Fragen des Einbauplans (30.10.2026):**
1. Das Angebot kommt auch nach «Überspringen» des Prologs (Entscheid 18) (Koordinator).
2. **Reisen zwischen den Welten laufen ganz, sie sind nicht überspringbar** (Entscheid des Nutzers); überspringbar
   sind Prolog, Angebot, Kapitel «Im Dorf» und die Einstiege in die Welten.
3. Einstieg ins Dorf ohne Träger: das Licht ist schon bei Noa; weicher Übergang von der Bühne aufs Brett (Koordinator).
4. Eine Übung aus der Übersicht führt nach der 9. zurück in die Übersicht (wie beim Wiederholen) (Koordinator).
5. Die Übersicht ist auch im Dorf erreichbar (Koordinator).
6. Der Begriff «Im Dorf» (Kapitel, aber keine der sechs Welten) wird in Ticket 08 in `CONTEXT.md` geschärft.

**Ergebnis (30.10.2026, Branch `feature/lichtsignal-prototyp`)**

- **Das Dorf an einer Stelle:** `STORY_DORF` nach `STORY_CHAPTERS` (Station 0, `sky: 'milky'` als austauschbare
  Stelle, Texte von Angebot, Einstieg, Ende, «Das Dorf leuchtet» / «In den Bergwald»); `storyDorfStand` prüft den
  Stand des Dorfs (Unlesbares gilt als nicht gespielt).
- **Zustand und Speicherstand:** `story.inDorf`, `story.uebung`, `currentIndex()` (für `drives`, `choose`/`resume`);
  `gesehen` + `angebot` (bei beiden Wahlen) und + `dorf`; `prisma.noa.<grad>.dorf = { platz, ende }` nur nach «Üben»,
  geprüft in `setGrade` (nicht in `progress`). `save()` schreibt im Dorf `dorf.platz`, `platz` bleibt 0. Gelöste
  Übungen kommen mit Namen in `geloest`, ihre Bestwerte über `markSolved` in `.bestwerte`. `init`/`firstIndex` laden
  hinter dem Startbildschirm den Himmel des Dorfs bzw. wärmen die Übung vor, wenn das Kapitel läuft.
- **Angebot:** `playScene(…, { angebot })` zeigt nach der letzten Einstellung bzw. nach «Überspringen» (die Fahrt läuft
  erst im Zeitraffer zu Ende, dann `speed = 1`) auf der Bühne Kicker «Im Dorf», den Satz und «Üben» / «Gleich los»
  (blenden mit dem Satz ein), Fokus auf «Üben» (`story.offer`). Die Wahl gilt sofort (`gesehen`, `stand.dorf`); nach
  «Üben» wechselt der Himmel hinter der noch deckenden Bühne ohne Überblenden auf die Milchstrasse. Prolog gesehen,
  Angebot nicht (Neuladen dazwischen): Bühne nur mit dem Angebot auf dem letzten Bild des Prologs. Das Angebot kommt
  nur, solange der Bergwald nicht gesehen ist (ältere Stände bekommen es nicht mitten im Spiel). Die Bühne hat dafür
  `.sub .kicker`; die beiden Satzzeilen liegen jetzt in einer Rasterzelle (unten bündig, mindestens zwei Zeilen hoch)
  statt absolut: Ein langer Satz wächst nach oben, ohne den Kicker zu überdecken; Prolog und Epilog sehen gleich aus.
- **Im Dorf:** Einstieg über `enter(index, STORY_DORF, sunk, STORY_DORF.einstieg)` (Kicker «Im Dorf · Erstes Licht»,
  Weg mit der Station Dorf, nur der Lichtpunkt, kein Träger, Moment `dorf`); `enter` und `fall` nehmen dafür Kicker,
  Text, Weg, Träger und Moment als Parameter. Kopfzeile «Im Dorf – Umweg», darunter «●○○○ Leicht · Übung 2 / 9» und
  der Hinweis in eigener Zeile (Klasse `hinweis`, nicht `.ctl`; Klasse `tutorial` bleibt), auch auf dem Handy quer.
  «Weiter» (`advanceDorf`) zur nächsten Übung, nach der 9. «Das Dorf leuchtet» / «In den Bergwald» und das Ende.
  Neuladen/Menü: `begin` setzt an `dorf.platz` fort (ohne Prolog, Angebot und Einstieg), «Menü» und Esc wie in jedem
  Level, «Übersicht» (Knopf und L) im Dorf mit der laufenden Übung (`aktuell: { welt: 'dorf' }`).
- **Überspringen und Ende:** `#btn-skip` (nach `#story`, Ebene 8, oben rechts im Stil der Bühne; auf dem Handy hochkant
  unten links, dort reicht die Kopfzeile mit dem Hinweis über die ganze Breite). Sichtbar, solange `skippable()`:
  in einem Einstieg und solange das Kapitel läuft (auch beim Herauswachsen, unter «Gelöst», beim Wiederholen einer
  Übung davor), nie unter Menü und Übersicht; die Sichtbarkeit führt `story.update` je Bild nach. `dorfEnde(art)`:
  «Gelöst», Kopfzeile und Knöpfe weg, `dorf.ende`, Blick hebt sich, Satz zum Ende (Kicker «Im Dorf», wartet auf
  Tippen), darunter versinkt die Übung, dann Glühwürmchen und «Kapitel 1 · Der Bergwald» wie nach dem Prolog. Läuft
  gerade eine Zwischenszene (Blick senkt sich, Fall), wartet das Überspringen bis zu ihrem Ende (`endeWartet`, `done`).
- **Einstiege überspringbar** (Entscheid 10; Reisen nicht, Entscheid 28): Knopf oder Esc. `entering = { skip }` vom
  Beginn von `enter` bis das Level zu wachsen beginnt; Flug und Fall tragen ihn als Marke (`tween(…, mark)`),
  `dropTweens(mark)` nimmt sie ohne letzten Schritt heraus. `land()`: Untertitel zu, Lichtpunkt und Träger in 0,4 s
  aus, `await sunk`, Blick senkt sich in 1,8 s, das Level wächst ab k > 0,25, Moment gesehen. Lädt der Himmel noch,
  wartet der Einstieg weiter im Himmel (kein leeres Brett unter einem fremden Himmel). Gleich für den Einstieg ins Dorf.
- **Übersicht:** Reihe «Im Dorf», sobald `stand.dorf` besteht, nach «Überspringen» alle Übungen frei (`dorf.frei`).
  Übung aus der Übersicht (`playDorf`): Läuft das Kapitel, geht es an der offenen Übung normal weiter (steht sie auf
  dem Brett: wie Schliessen); jede andere als Wiederholen ohne Einstieg, «Weiter» zur nächsten, nach der 9.
  «Zur Übersicht». Beim Wiederholen in einem laufenden Kapitel gilt ab der ersten ungelösten Übung wieder der normale
  Ablauf.
- **Fix nebenbei:** Der Knopf «Überspringen» der Bühne war nach einem Neuladen nicht `hidden` (nur `playScene` setzte
  es); `makeScene` setzt ihn jetzt versteckt (sonst hielt `skip` den Prolog für offen).
- **Probe** `tests/geschichte-probe.mjs --dorf` (neu, `dorfAblauf`; die übrigen Abläufe wählen nach dem Prolog «Gleich
  los» und erwarten `prolog,angebot,wald`): Leicht: Prolog mit dem Knopf übersprungen → Angebot (Kicker, Text, Fokus,
  Desktop mit Enter) → Einstieg ins Dorf (Milchstrasse, ohne Träger, `prolog,angebot,dorf`) → drei Übungen
  (Kopfzeile, Hinweis, «Gelöst», `dorf.platz` 3) → Neuladen, Menü «Leicht · Dorf 0 / 60», «Weiter» → Übung 4 ohne
  Zwischenszene → Menü (Esc bzw. Knopf) und zurück in dieselbe Übung → Übersicht im Dorf (Reihe Dorf, 3 gelöst,
  laufende Übung 4) → «Überspringen» → Satz zum Ende (`dorf.ende` uebersprungen) → Bergwald 1 → Übersicht: 6 freie
  Übungen. Mittel: Einstieg ins Dorf im Flug übersprungen (Desktop mit Esc), «Überspringen» beim Herauswachsen von
  Übung 2, Einstieg in den Bergwald im Fall übersprungen. Schwer: «Gleich los» (Desktop Tab + Enter), Einstieg gleich zu
  Beginn übersprungen (kein leeres Brett), kein `dorf`, Übersicht ohne Dorf. Sehr schwer: alle 9 Übungen bis zum
  Bergwald (`dorf.ende` gespielt), aus der Übersicht Übung 8 wiederholen → 9 → «Zur Übersicht». Bei jedem
  übersprungenen Einstieg: Level steht, Untertitel zu, Moment gesehen, genau ein Herauswachsen; auf dem Handy quer
  überdeckt «Überspringen» weder Kopfzeile noch «Gelöst» noch die Knöpfe. **Bestanden** auf Desktop, Handy hoch und
  quer (Touch), Konsole leer; dazu auf dem Desktop `--menue`, `--grad leicht --welten 1` und `--finale schwer`.
  Bilder `tests/output/geschichte/<bildschirm>-dorf-*.png`.
- **Bildzeiten** (längste Lücke im bestandenen Lauf, Desktop / Handy hoch / quer, ms): Menü → Prolog → Überspringen
  84 / 33 / 53 (das erste Zeichnen der Bühne ausgenommen, wie bisher); Üben → Einstieg ins Dorf → Übung 1 50 / 34 /
  36; Weiter → Übung 4 nach Neuladen 67 / 50 / 35; Überspringen → Satz zum Ende 33 / 17 / 19; Satz zum Ende → Bergwald
  1 67 / 83 / 36; Einstieg ins Dorf im Flug übersprungen 67 / 67 / 87; Überspringen beim Herauswachsen 33 / 17 / 19;
  Einstieg in den Bergwald im Fall übersprungen 67 / 50 / 36; gleich zu Beginn übersprungen 67 / 67 / 71; Übung 8
  wiederholen → 9 50 / 84 / 67. In zwei früheren Desktop-Läufen je einmal knapp darüber: 106 ms gleich nach dem ersten
  Zeichnen der Bühne (zweites Bild danach, der Wald lädt noch) und 107 ms beim Herauswachsen von Bergwald 1 nach einem
  ganz am Anfang übersprungenen Einstieg (Aufbau des Levels); im dritten Lauf beide nicht wieder (84 und 67 ms).
- **Tests** (nacheinander über `leise.sh`, `LEISE_CPU=80`, Zeitrahmen innerhalb): Strahlregel 1963, Golden 824 Level,
  Vorrat 15, Levelliste 55, Würfelliste 20, KI-Tester 84, Beurteilung 206, Geschichte 30, Generator 31, Offline,
  Bedienung (`interaction-probe.js`, Konsole leer), `shots.mjs` Platz 1 und 240 (Desktop, Handy; ohne «Überspringen»):
  alle bestanden. `CONTEXT.md` unverändert (Ticket 08).
- **Entscheide des Umsetzers:**
  1. Ein Level der Welten aus der Übersicht mitten im laufenden Kapitel (nur Bergwald 1 ist offen) gilt als
     «Überspringen» ohne den Satz zum Ende (`dorf.ende = 'uebersprungen'`), danach der Einstieg in den Bergwald.
  2. «Überspringen» während des Einstiegs ins Dorf überspringt nur den Einstieg (landet in Übung 1, wie Plan Punkt 6);
     das Kapitel überspringt danach derselbe Knopf.
  3. Esc überspringt Prolog und Einstiege, nie das Kapitel: Im Dorf öffnet Esc wie in jedem Level das Menü.
  4. «Überspringen» auf dem Handy hochkant unten links statt oben rechts (die Kopfzeile mit dem Hinweis braucht dort
     die ganze Breite); Desktop und Handy quer oben rechts wie auf der Bühne.
  5. Im Dorf steht statt der Bedienung der Hinweis der Übung (er erklärt Klick und Rechtsklick selbst).
  6. Der Satz zum Ende kommt mit dem Kicker «Im Dorf», ohne Weg; er erscheint, während sich der Blick hebt.
  7. Wiederholen einer Übung speichert nichts (wie Ticket 06), Bestwerte und `geloest` schon.
- **Offen / für Ticket 08:**
  - `CONTEXT.md`: «Im Dorf» (Kapitel, keine Welt), «Einstieg ins Dorf», Moment `dorf`, «Angebot»; Glossar «Überspringen»
    (Prolog, Kapitel, Einstiege; Reisen nicht).
  - Vorwärmen: Vor dem Prolog lädt weiterhin der Wald, auch wenn danach «Üben» folgt (mit einer eigenen Skybox des Dorfs
    unnötige Last); die Bühne zeichnet beim ersten Mal weiterhin lange (wie bisher ausgenommen).
  - Erstes Herauswachsen von Bergwald 1 nach einem sofort übersprungenen Einstieg einmal 107 ms (Desktop), nicht
    wiederholt; beobachten.
  - Kicker «Im Dorf» auf der Bühne ist klein und blass (Stil der Untertitel-Kicker); ggf. im Review des Spielerlebnisses
    beurteilen.
