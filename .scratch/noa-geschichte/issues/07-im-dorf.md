# 07: Kapitel «Im Dorf»

**Spec:** ../spec.md

**Blocked by:** 04

**Status:** ready-for-agent

**What to build:** Das Tutorial als Kapitel der Geschichte (Entscheid 3, 10, 18): Nach dem Prolog fragt ein Untertitel
«Möchtest du zuerst mit Noa im Dorf üben?» mit «Üben» und «Gleich los». «Üben» spielt die 9 Tutorial-Level im Dorf,
danach bringen die Glühwürmchen das Licht in den Bergwald wie heute.

- [ ] Angebot nach dem Prolog, beim ersten Durchgang je Grad; ohne Vorgabe, der Spieler wählt.
- [ ] «Im Dorf»: die 9 Tutorial-Level mit ihren Hinweisen und Namen, Hintergrund vorerst die Milchstrasse (eine
      eigene Skybox macht der Nutzer später; der Hintergrund ist an einer Stelle austauschbar); Kopfzeile etwa
      «Im Dorf – Erstes Licht» und «Übung 1 / 9».
- [ ] «Überspringen» während des ganzen Kapitels; danach weiter zum Einstieg in den Bergwald.
- [ ] Einstiege in die Welten überspringbar (Entscheid 10, im Review von Ticket 04 als offen gefunden): heute lassen
      sie sich nur durch Tippen beschleunigen; ein «Überspringen» wie beim Prolog, das ohne Ruckeln ins Level führt.
- [ ] Ein kurzer Text der Geschichte zum Kapitel (Noa übt mit der Taschenlampe), im Stil der übrigen Untertitel.
- [ ] Die Übersicht (Ticket 06) zeigt «Im Dorf», wenn es gespielt wurde; das Kapitel zählt nicht zu den 60 Leveln.
- [ ] Probe im Browser: Üben, Gleich los, Überspringen mitten im Kapitel; Desktop und Handy.
- [ ] Alle Tests grün; Review nach dem Ticket.

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
