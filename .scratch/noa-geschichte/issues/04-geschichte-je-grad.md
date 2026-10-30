# 04: Die Geschichte je Grad im Spiel

**Spec:** ../spec.md

**Blocked by:** 03

**Status:** resolved

**What to build:** Das Spiel ist die Geschichte. `index.html` enthält nur noch das Tutorial und die 240 Level der Wahl
(mit Titel), alles andere liegt im Vorrat. Ein Durchgang läuft je Grad mit 6 Welten zu 10 Leveln, mit eigenem
Speicherstand je Grad. Die Wahl des Grads ist in diesem Ticket noch schlicht (vier Knöpfe nach dem Startbildschirm);
das gestaltete Menü folgt in Ticket 05.

- [x] Umbau mit `tools/vorrat.mjs`: Die nicht gewählten flachen Level und alle 300 Würfel-Level in den Vorrat, die
      15 neuen sehr schweren ins Spiel; ein Datenblock der Geschichte (je Grad 6 × 10 Schlüssel in Reihenfolge), aus dem
      Werkzeug geschrieben. Test: Jedes Level von vorher steht im Spiel oder im Vorrat, mit unveränderten Leveldaten.
- [x] `STORY_CHAPTERS` liest die Level je Grad aus dem Datenblock; Kopfzeile nach Entscheid 20 («Das Meer – Brandung»,
      «●●○○ Mittel · Kapitel 2 / 6 · Level 4 / 10»); das Spiel zeigt `titel ?? name`.
- [x] Die Geschichte läuft ohne `?signal`; `?signal` hat keine Wirkung mehr. Überspringen mit N und `?signal=<Kapitel>`
      entfallen ganz (Entscheid 21); Werkzeuge und Testtreiber steuern über die Testschnittstelle (`__prismaDebug`).
- [x] Speicherstand je Grad unter `prisma.noa.*` (Platz, gelöste Level, gesehene Momente, geschafft) und der zuletzt
      gespielte Grad; alte Schlüssel werden nicht mehr gelesen. Neuladen setzt im zuletzt gespielten Grad fort,
      Einstiege nur beim ersten Mal je Grad (wie heute `prisma.signal.seen`, jetzt je Grad).
- [x] Die bisherige Levelauswahl (Fläche/Würfel, Seiten) ist aus dem Spiel; bis Ticket 06 öffnet der Knopf nichts
      bzw. ist ausgeblendet. Hintergrund-Knopf und Taste H entfallen (Entscheid 26).
- [x] Tests der Levelliste und der Würfelliste auf den neuen Stand (Würfel im Vorrat); Golden-Test, Beurteilung,
      KI-Tester grün über den Lader.
- [x] Probe im Browser: in jedem Grad ein Durchgang durch die ersten zwei Welten (Einstieg, 10 Level, Reise), dazu das
      Finale ab der letzten Welt; Desktop und Handy, Konsole ohne Fehler.
- [x] Alle Tests grün; Review nach dem Ticket.

## Comments

**Ergebnis (29.10.2026, Branch `feature/lichtsignal-prototyp`)**

- **Die 15 neuen sehr schweren ins Spiel**, solange alle flachen Level im Spiel standen: `ordne-level.mjs --ausbau
  <datei> --schreiben`, die Datei aus `sehr-schwer-neu.json` umgesetzt (`{ level, name, auftrag, seed, schwierigkeit }`,
  Ziel 96–112 nur bei den Seeds 5xxxx aus `pool-ss-2`; Pollux, Shaula und Thuban mit `generiere.mjs` nachgebaut,
  der Abdruck stimmt). Sie stehen nach der Formel in der Reihe (Plätze 461–515 von jetzt 515), mit Herkunft im
  Kommentar und in `levelliste.json` unter `ausbau`; die Häufungsregel bleibt eingehalten, dabei rückten neun sehr
  schwere Level des Ausbaus in ihrem Grad um wenige Plätze (Spica, Kapella, Sternenstaub, Abendstern, Orion,
  Morgenröte, Leitstern, Gravitation, Weissabgleich). `entfernteNamen` hat das Werkzeug dabei neu umbrochen (Inhalt
  gleich). Golden-Test vorher geprüft: nur die 15 neu, alle 809 übrigen unverändert; dann `--write` (824 Level).
- **Umbau** mit dem neuen Befehl `node tools/geschichte.mjs spiel [--trocken]` (Funktionen `insSpiel`, `reiseAus`,
  `blockZeilen`, `mitBlock`, `mitTitelnImSpiel`, `reiseImSpiel`; Regeln im Kopf des Werkzeugs, über die Funktionen von
  `vorrat.mjs`): 275 flache Level und alle 300 Würfel-Level in den Vorrat, die 240 der Wahl bleiben mit `titel` in
  der Namenszeile im Spiel, in der Reihenfolge der Reihe (`LEVELS` nicht umgeordnet, Hinweis aus Ticket 02), dazu der
  Datenblock. Ein zweiter Lauf ändert nichts; Level der Wahl im Vorrat holt er zurück, Level ausserhalb der Wahl
  verlieren ihren Titel. Fehlt ein Level der Wahl in Spiel und Vorrat, bricht er ab (neue Level zuerst über
  `--ausbau`). `poolLevel` nimmt die 15 nun aus dem Spiel (weiter als neu, mit Kandidat), so bleibt `wahl.json`
  nachbaubar.
- **Datenblock** in `index.html`: `const STORY_LEVELS = { 'leicht': [[10 Schlüssel Bergwald], …, [10 Sterne]], … }`
  zwischen `/* GESCHICHTE:BEGIN */` und `/* GESCHICHTE:END */`, je Welt ein Kommentar mit ihrem Namen, im LOGIC-Block
  (für die Tests als `L.STORY_LEVELS` über `tools/solver.mjs`).
- **Spiel** (`index.html`):
  - `STORY_CHAPTERS` ohne eigene Level; `story.setGrade(grad)` baut die Reise (`steps`) aus `STORY_LEVELS[grad]`.
    Kopfzeile nach Entscheid 20 (`story.hudText`, `ui.showHud`): «Das Meer – Sandbank» (`titel ?? name`), darunter
    «●○○○ Leicht · Kapitel 2 / 6 · Level 1 / 10», dahinter die Bedienung (Handy hochkant in einer eigenen Zeile;
    Handy quer wie bisher ohne Unterzeile).
  - Kein `?signal` mehr (`STORY_PARAM`, `story.on`, `body.story`, `story.skip` weg). Die Geschichte ist der einzige
    Ablauf: `ui.start` → `story.menu()` (vier Knöpfe in `#story .grades`, Fokus auf dem zuletzt gespielten Grad) →
    `story.choose(grad)` → `begin()`: Prolog nur ohne `prolog` in `gesehen`, Einstieg nur in einer ungesehenen Welt,
    sonst gleich ins Level, sobald ihr Himmel da ist; Reise, Finale und Epilog wie im Prototyp.
  - Speicherstand (`progress`, neu): `prisma.noa.<grad>` (`leicht`, `mittel`, `schwer`, `sehr-schwer`) = JSON
    `{ platz, geloest, gesehen, geschafft }`; `gesehen`: `prolog` und die Stationen der Welten (`wald`, `meer`,
    `wueste`, `vulkan`, `planeten`, `sterne`); weitere Felder bleiben beim Speichern erhalten. `prisma.noa.zuletzt`:
    der zuletzt gewählte Grad. Unlesbar oder fremd: von vorn. Gespeichert wird beim Wählen (zuletzt), beim Lösen
    (geloest), bei «Weiter» (platz), nach dem Prolog und beim Einstieg (gesehen) und vor dem Epilog (geschafft). Die
    alten Schlüssel liest das Spiel nicht und löscht sie nicht.
  - Levelauswahl ganz entfernt (Markup, CSS, `PAGES`, `SECTIONS`, `MODES`, Wischen, Tasten L, N, P, Pfeile,
    Bild↑↓), ebenso Hintergrund-Knopf, Taste H, `skyTheme.next` und Speichern/Lesen von `prisma.sky`. `?sky=` bleibt
    für Tests (`offline.mjs`) und geht beim Start der Welt vor. Tasten: R, M, Enter, F; in Zwischenszenen Enter oder
    Leertaste, Esc überspringt den Prolog.
  - Testschnittstelle `__prismaDebug`: `zeige(index)` (Level ausserhalb der Geschichte, ohne Speicherstand, Kopfzeile
    mit Titel oder Name und Grad wie früher; mit `?t=` wachsen die Strahlen wie beim ersten Level) und `loese()` (dreht
    das laufende Level Drehung für Drehung in die Lösung); den Grad wählt `story.choose`, einen Stand setzen Proben in
    `localStorage`. `shots.mjs` lädt je Bild neu und ruft `zeige` (mit `?sky=milky`, wie bisher vor der
    Milchstrasse; Bild geprüft). `interaction-probe.js` und `perf-probe.js` zeigen das erste Tutorial-Level über
    `zeige`, `cube-probe.js` und `cube-click-probe.js` ihr Würfel-Level (vorher zurückholen, im Kopf notiert).
  - Unverändert: Träger, Reise, `skyTheme.quiet`, Warten auf `settled`, Vorwärm-Elemente (bleiben jetzt immer, wie in
    der Geschichte), Bühne früh gebaut (jetzt in `menu()`, also wie vorher unter dem ausblendenden Startbildschirm),
    Vorzeichnen vor dem Finale, Startknopf erst mit geladener Skybox (der Welt, in der es weitergeht), Himmel über
    `sky.rings`.
- **Tests:** `tests/vorrat.test.mjs` prüft jedes Level von vorher (`tests/vor-dem-umbau.json`, Abdruck der Leveldaten
  aus `fc22df1`, ohne `titel`) gegen Spiel und Vorrat, mit Gegenproben. `tests/geschichte.test.mjs` neu: Spiel =
  Tutorial und die 240 mit Titel in der Reihenfolge der Reihe, keine Würfel, Datenblock = Reise aus `wahl.json`, `spiel` an
  Kopien der Texte (nichts zu tun, zurück und hin byte-gleich, Abbruch); der Test der 15 Schlüssel prüft jetzt «je
  einmal im Spiel, gleiche Leveldaten». `tests/levelliste.test.mjs`: Tests der Seiten der Levelauswahl und des alten
  Fortschritts weg, neu der Speicherstand je Grad. `ki-tester/protocol.mjs`: Der Fingerabdruck lässt `titel` weg wie
  `name` (die KI-Tester sehen ihn nicht; sonst änderte der Titel eines Ankers wie Zusammenfluss den Fingerabdruck).
  Neue Probe `tests/geschichte-probe.mjs` (im README).
- **Probe im Browser** (`tests/geschichte-probe.mjs`, Chrome auf der Grafikkarte über `leise.sh`), Desktop 1440 × 900
  und Handy 390 × 844 hoch: in allen vier Graden Prolog (im ersten getippt, sonst übersprungen), Einstieg in den
  Bergwald, 20 Level mit Kopfzeile geprüft, Reise ins Meer und in die Wüste, Stand geprüft, dann Neuladen: Fokus auf
  dem Grad, Fortsetzen am Platz 20 ohne Einstieg und Prolog; Finale ab der letzten Welt (Desktop «sehr schwer», Handy
  «mittel»): Einstieg in die Sterne, 10 Level, Finale, Epilog bis «Zum Menü», `geschafft`, zurück zur Wahl. Alles
  grün, Konsole ohne Fehler. Dazu Tastatur: Leertaste am Startbildschirm öffnet die Wahl (wählt nicht gleich), Enter
  wählt den Grad mit Fokus. Bilder unter `tests/output/geschichte/`.
- **Tests** nacheinander über `leise.sh` (`LEISE_CPU=50`) grün: Strahlregel 1963, Golden 824 Level, Vorrat 15,
  Levelliste 55, Würfelliste 20, KI-Tester 84, Beurteilung 206, Geschichte 30, Generator 31, Offline bestanden; dazu
  Bedienung (`interaction-probe.js`) und ein Bild mit `shots.mjs`.
- **Entscheide (selbst):**
  - Die 15 neuen über `--ausbau` in die Reihe statt ans Ende: So gelten Levelliste, KI-Tester und Golden-Test ohne
    Sonderfall.
  - Wahl des Grads: vier Knöpfe mit Punkten und Namen des Grads über der Welt, darüber «Schwierigkeit», kein Stand und
    kein «Weiter» (Ticket 05). Auch ein geschaffter Grad setzt an seinem Platz fort (letztes Level der Sterne).
  - «Zum Menü» am Ende des Epilogs lädt die Seite neu (Startbildschirm, dann die Wahl); den Übergang ohne Neuladen
    baut Ticket 05.
  - Das Tutorial steht weiter im Spiel, ist im Ablauf aber nicht erreichbar, bis Ticket 07 «Im Dorf» baut.
  - Ein Level ausserhalb der Geschichte (nur Testschnittstelle) zeigt die Kopfzeile wie früher, ohne «Weiter».
- **Für Ticket 05:** Menü statt `story.menu()`/`#story .grades` (Knopf und Stand je Grad, «Weiter», «Von vorn»);
  «Menü» im Spiel braucht einen Übergang von einem Brett mit Level zu einem anderen Grad (heute nur nach dem Laden mit
  leerem Brett; `sinkTo` kann das alte Feld versenken, `story.gaze` nach dem Finale zurücksetzen); «Zum Menü» ohne
  Neuladen. Die Leertaste am Startbildschirm ist abgefangen, weil danach ein Knopf den Fokus hat (keyup).
- **Für Ticket 06:** Bestzeit und Drehungen je Level als weiteres Feld im Stand des Grads (`progress.save` behält
  unbekannte Felder; `flow.solveStats` hat Zeit und Drehungen beim Lösen). Die alte Levelauswahl (Kacheln, Wischen)
  steht in `fc22df1`, falls die Übersicht etwas davon braucht.
- **Für Ticket 07:** «Im Dorf» als Kapitel vor dem Bergwald (Station `dorf` gibt es in `STORY_STATIONS`); Tutorial
  gespielt oder übersprungen als Feld im Stand; die Kopfzeile des Tutorials ausserhalb der Geschichte steht noch in
  `ui.showHud`.
- **Für Ticket 08:** Begriffe (Grad, Durchgang, Vorrat, Titel, Testschnittstelle) in `CONTEXT.md`; `SPEC.md` und
  `3D-WUERFEL.md` erwähnen noch die Levelauswahl und das Umschalten des Hintergrunds.

**Review Code (30.10.2026)**

- Geprüft:
  - Kein Level verloren, eigener Abgleich gegen `HEAD:index.html`: Alle 809 Level von vorher stehen je genau einmal
    im Spiel oder im Vorrat, mit gleichen Zeilen bis auf `titel`. `tests/vor-dem-umbau.json` stimmt mit HEAD überein.
  - Die 15 neuen sehr schweren Level: Leveldaten wie in `sehr-schwer-neu.json`, Herkunft im Kommentar, in
    `levelliste.json` unter `ausbau`.
  - Zurückholen: In einer Kopie bringt `vorrat.mjs zurueckholen --alle` alle 815 Level zurück, der Würfel-Block ist
    byte-gleich wie vorher; danach führt `geschichte.mjs spiel` wieder genau zum Stand vorher (sha256), ein zweiter
    Lauf ändert nichts.
  - Spiel = Wahl: Tutorial und die 240 mit Titel, Reihenfolge der Reihe; `STORY_LEVELS` entspricht der Reise.
  - Spiellogik: Speicherstand `prisma.noa.*`, Reste der entfernten Teile (keine), `__prismaDebug` (kein Weg zum
    Überspringen über Taste oder URL), Zeilenlängen.
- Behoben:
  - Die Unterzeile der Kopfzeile ist jetzt in Teile mit `white-space: nowrap` gegliedert (`index.html`,
    `ui.showHud` und CSS `.teil`). Auf dem Handy hochkant brach bei «sehr schwer» sonst «Level 1 / 10» vor der 10 um.
  - `skyTheme.names` entfernt; es wurde seit dem Wegfall des Hintergrund-Knopfs nicht mehr gebraucht.
  - `tests/cube-click-probe.js` und README: Statt «Blumentopf» (seit dem Quader entfernt, nicht im Vorrat) nimmt die
    Probe jetzt «Zahnbürste» (Anker A2). In einer Kopie zurückgeholt dreht jeder Klick genau sein Element.
  - In `shots.mjs` einen Kommentar neu umbrochen.
- Tests nacheinander über `leise.sh`, alle grün:
  - Strahlregel, Golden, Vorrat, Levelliste, Würfelliste, KI-Tester, Beurteilung, Geschichte, Generator, Offline.
  - Geschichte-Probe Desktop (leicht, schwer, Finale mittel) und Handy (sehr schwer, mittel, Finale leicht).
  - Bedienung (`interaction-probe.js`), `shots.mjs` (Platz 1 und 240).
  - Eine eigene Touch-Probe auf dem Handy, die die Ereignisse wie ein Finger auslöst.
- Hinweise:
  - `window.__prisma.goto` und das Argument von `stepLevel` werden nicht mehr gebraucht.
  - Entscheid 10 der Spec («Einstiege immer überspringbar») deckt kein Ticket ab; Einstiege lassen sich heute nur
    durch Tippen beschleunigen.

**Review Browser (30.10.2026):** aus Spielersicht commitbereit. Ablauf je Grad, Neuladen, zweiter Grad mit Prolog,
Finale und Epilog, Tastatur, Handy hoch und quer mit Touch: bestanden; Konsole in 30 Läufen leer. Bildzeiten alt
(fc22df1) gegen neu ohne neue Lücke über 100 ms jenseits der Streuung (Prolog, Einstieg, Reise Wald → Meer, Reise ins
Weltall, Finale, Fortsetzen). Für Ticket 05 übernommen: die Wahl bleibt bis 3 s sichtbar, wenn der gewählte Grad in
einer anderen, noch nicht gesehenen Welt steht (`enter()` wartet auf `skyTheme.ready` ohne `close()`); Fortsetzen in
einer anderen Welt zeigt 3,5–3,9 s ein leeres Brett, während der Himmel lädt.
