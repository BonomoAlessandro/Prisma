# 05: Menü mit den vier Graden

**Spec:** ../spec.md

**Blocked by:** 04

**Status:** resolved

**What to build:** Nach dem Startbildschirm das Menü nach Entscheid 8, 14, 19 und 25: vier Karten mit dem Stand je
Grad, «Weiter», «Von vorn», geschaffte Grade mit dem Polarstern. Dazu der Knopf «Menü» im Spiel und «Zum Menü» am Ende
des Epilogs. Die Gestalt wählt der Nutzer aus Vorschauen.

- [x] **Haltepunkt:** zwei oder drei Varianten als Vorschau (Bilder für Desktop und Handy, hoch und quer), z. B. vier
      Karten nebeneinander, ein Stapel vor dem Nachthimmel, die Grade als Stationen auf dem Weg zum Stern. Der Nutzer
      wählt; erst dann wird gebaut.
- [x] Karten: Grad, Stand («Wüste · 23 / 60», «noch nicht begonnen», geschafft mit dem Polarstern); begonnen →
      Fortsetzung, geschafft → Übersicht (Ticket 06; bis dahin Fortsetzung von vorn mit Rückfrage), neu → Durchgang.
- [x] «Weiter» zum zuletzt gespielten, nicht geschafften Grad; fehlt, wenn es keinen gibt.
- [x] «Von vorn» je begonnenem oder geschafftem Grad, mit Rückfrage; löscht nur den Stand dieses Grads.
- [x] Knopf «Menü» im Spiel (unten rechts); der Stand bleibt. Am Ende des Epilogs «Zum Menü»; der geschaffte Grad ist
      markiert, der nächstschwerere hervorgehoben.
- [x] Tastatur und Bildschirmleser bedienbar; Probe im Browser auf Desktop und Handy (hoch und quer).
- [x] Alle Tests grün; Review nach dem Ticket.

## Comments

**Haltepunkt erledigt (29.10.2026):** Vorschauen in `.scratch/noa-geschichte/menue-vorschau/` (Karten, Fächer,
Lichtwege; je Desktop, Handy hoch und quer, Übersicht `bilder/uebersicht.png`). Der Nutzer wählt **Variante 3
«Lichtwege zum Polarstern»**: je Grad ein Lichtweg von Noas Lampe zum Polarstern, hell so weit, wie das Licht im Grad
gekommen ist, die sechs Welten als Punkte darauf, «Weiter» am Kopf des Lichts. Beim Bau die Ansicht Handy hoch
aufräumen (vier schmale Spalten, Gedränge am Stern). Hervorgehoben wird der nächstschwerere Grad nur direkt nach dem
Epilog (Entscheid 14); sonst führt «Weiter». Vorlage: `variante-lichtwege.html` mit `gemeinsam.css`/`gemeinsam.js`.

**Baustein vorgebaut (29.10.2026):** `.scratch/noa-geschichte/bausteine/menue/` (`menue.js`, `menue.css`,
`probe.html`, `LIESMICH.md` mit Schnittstelle und Einbau; Bilder mit `aufnahme.mjs` neu). Handy hoch: Grade als
Zeilen, Lampen gestaffelt links, Wege steigen auf und laufen im Fächer zum Stern; «Weiter» unten. Entscheide des
Koordinators zu den offenen Fragen des Bausteins: «23 / 60» zählt gelöste Level (Ticket 04 liefert die Zahl); ist der
nächstschwerere Grad schon geschafft, wird der nächste nicht geschaffte hervorgehoben, nach «sehr schwer» keiner; ein
Grad gilt ab dem Prolog als begonnen (`welt: 'dorf'`, «Dorf · 0 / 60»); hinter dem Menü schaut die Kamera in den
Himmel, damit das Brett nicht hinter den Wegen steht.

**Aus dem Review von Ticket 04 (30.10.2026):** Nach der Wahl eines Grads in einer anderen Welt das Menü sofort
schliessen bzw. einen Schleier zeigen (heute bleibt die Wahl bis 3 s stehen, weil `enter()` auf `skyTheme.ready`
wartet, ohne `close()`); beim Fortsetzen in einer anderen Welt die 3,5–3,9 s Laden des Himmels nicht als leeres Brett
zeigen, sondern weich überbrücken (z. B. Kamera bleibt im Himmel, bis die Welt bereit ist). Auf dem Handy quer fehlt
die Unterzeile der Kopfzeile (wie vor dem Umbau) – beim Einbau des Menüs prüfen, ob sie dort Platz findet.

**Ergebnis (30.10.2026, Branch `feature/lichtsignal-prototyp`, nicht committet)**

- **Menü im Spiel** (`index.html`): der Baustein (`createMenu`, CSS «Menü der Geschichte») eingesetzt, `<div id="menue">`
  nach `#story`, `icons: STORY_ICONS`, `uebersicht: false` bis Ticket 06 (ein geschaffter Grad fragt «Von vorn»). Die
  schlichte Wahl (`story.menu()`, `#story .grades` samt CSS) ist weg. Einzige Abweichung vom Baustein: `menu.hide(true)`
  blendet ohne Überblenden aus (nur für die Testschnittstelle `zeige`); sonst Code und Gestalt gleich.
- **Stand** (`story.menuStand`): je Grad aus `progress`: geschafft; neu, solange nichts gesehen, gelöst und kein Platz
  ist (auch ein unlesbarer Stand); sonst begonnen mit der Welt des Platzes (vor dem Einstieg in den Bergwald `'dorf'`,
  also ab dem Prolog) und den gelösten Leveln des Grads. Dazu `progress.last()` für «Weiter» und `hervorheben` nur
  direkt nach dem Epilog. «Von vorn» (`story.resetGrade`, `progress.remove`) löscht nur `prisma.noa.<grad>`; der
  zuletzt gespielte Grad bleibt, das Menü bleibt offen (Fokus beim Grad, Meldung für den Bildschirmleser).
- **Ablauf:**
  - Nach dem Startbildschirm `story.start` → `openMenu({ sofort })`: Die Bühne wird wie bisher früh gebaut, die Kamera
    schaut sofort in den Himmel der Welt, in der es im zuletzt gespielten Grad weitergeht.
  - **«Menü» im Spiel** (Knopf unten rechts am Platz des früheren Hintergrund-Knopfs, drei Striche, `title`
    «Menü (Esc)»; Taste Esc): in `play`, `in` und `out`, nicht während einer Zwischenszene. Kopfzeile, Knöpfe und
    «Gelöst» gehen weg, der Blick hebt sich in 1,8 s vom Brett in den Himmel; das Level bleibt stehen (`story.paused`).
  - **Wahl im Menü** (`choose`): Das Menü blendet sofort aus. Derselbe Grad mit seinem Level noch auf dem Brett:
    `resume`, der Blick senkt sich, es geht weiter wie vorher (Drehungen bleiben, die Zeit im Menü zählt nicht für die
    Bestzeit; wurde das Level unter dem Menü fertig gelöst, kommt «Gelöst» jetzt). Sonst `begin`: Ein altes Brett
    versinkt unbemerkt (`sinkTo`), die Kamera bleibt im Himmel, bis der Himmel der Welt geladen ist (`skyOf`; zwischen
    zwei Welten auf der Erde über die Farben beider wie auf der Reise), dann senkt sich der Blick, und das Level wächst
    schon, bevor man das Brett sieht. In einer neuen Welt schwenkt die Kamera aus dem Himmel zum Licht des Einstiegs;
    ein neuer Grad beginnt mit dem Prolog, das alte Brett versinkt dahinter.
  - **«Zum Menü»** am Ende des Epilogs ohne Neuladen (`afterEpilog`): Das Menü blendet über der ausblendenden Bühne
    ein, dahinter der Himmel der Sterne mit dem Blick zum Polarstern; der geschaffte Grad trägt den Polarstern, der
    nächstschwerere nicht geschaffte ist hervorgehoben und hat den Fokus (nach «sehr schwer» keiner). Die Bühne hält
    nicht an, wenn sie gleich wieder gebraucht wird (`scene.hide`).
  - Unter dem Menü: 30 Bilder/s, ausser der Blick bewegt sich (`frameRate.busy`); Kopfzeile und «Gelöst» erscheinen
    dort nicht (`ui.showHud`, `ui.showSolved`).
- **Tastatur:** im Menü wie im Baustein (Tab, Pfeile, Pos1/Ende, Enter, Rückfrage mit Esc); die Tasten des Spiels (R,
  Pfeile …) wirken nicht aufs Brett darunter, M schaltet weiter den Ton. **Esc** öffnet im Spiel das Menü und führt im
  Menü, das aus dem Spiel kam, zurück ins Level (`story.back`; nach dem Start und nach dem Epilog nicht).
- **Handy quer:** Die Unterzeile der Kopfzeile ist wieder da, klein und ohne die Bedienung (`#hud.geschichte .sub`):
  «●●○○ Mittel · Kapitel 3 / 6 · Level 4 / 10» passt in eine Zeile über dem Brett.
- **Vom Vorgänger übernommen** (nach Durchsicht unverändert): Einbau des Bausteins, `menuStand`, `openMenu`, `toMenu`,
  `afterEpilog`, `resetGrade`, `choose`/`resume`/`begin`/`skyOf`/`gazeTo`, Einstieg aus dem Himmel, `progress.remove`,
  Knopf und Tasten, die Erweiterung der Probe. **Dazu oder geändert:** Esc zurück ins Spiel, Unterzeile auf dem Handy
  quer, ein doppelter Kommentaranfang vor `story.finale` entfernt; in der Probe die erste Geste (siehe unten), Bilder
  der Probe und das erste Zeichnen der Bühne in den Bildzeiten, Esc-Proben, Bildzeiten auch für «Menü → Prolog»;
  README (Ablauf, Steuerung, Testschnittstelle, Probe).
- **Probe** `tests/geschichte-probe.mjs` (neu `--menue` und `--quer`; Desktop mit der Maus, Handy hoch und quer mit
  `Input.dispatchTouchEvent`): Stand je Grad, «Weiter» (Ziel, Fokus), «Menü» im Spiel und zurück ins selbe Level (die
  Drehung bleibt, R wirkt nicht), Esc hin und zurück, Wechsel in Schwer im Bergwald aus der Wüste (Menü sofort zu, kein
  leeres Brett: der Blick senkt sich erst, wenn der Himmel bereit ist, und unter 0,6 wächst schon das Level), «Von vorn»
  mit Abbrechen und Bestätigen (nur Mittel gelöscht, Fokus bleibt, «Weiter» jetzt zu Schwer), ein neuer Grad aus dem
  Spiel heraus (Prolog, altes Brett versinkt, Einstieg, erstes Level); `--finale` bis «Zum Menü» ohne Neuladen
  (geschafft, Hervorhebung, Fokus, Kamera im Himmel, Esc ohne Wirkung) und weiter in den hervorgehobenen Grad. Mit
  `?nointro` fehlt der Klick auf «Klicken zum Starten»: Die Probe tippt nach jedem Laden einmal ins Leere des Menüs, damit
  das Freischalten des Tons (einmal 0,2–0,3 s) nicht in die Bildzeiten des ersten Übergangs fällt.
- **Proben im Browser** (alle bestanden, Konsole ohne Fehler; Bilder unter `tests/output/geschichte/`): Desktop
  `--menue`, `--finale leicht` (danach Mittel hervorgehoben und begonnen), `--grad schwer`; Handy hoch `--menue
  --handy`, `--finale mittel --handy`, `--grad sehr-schwer --handy`; Handy quer `--menue --quer`, `--finale
  sehr-schwer --quer` (danach nichts hervorgehoben). Bilder selbst geprüft: Menü neu, mit Stand, nach dem Epilog, aus
  dem Spiel, Rückfrage, nach «Von vorn», Warten im Himmel, Level danach, Kopfzeile quer.
- **Bildzeiten** (längste Lücke zwischen zwei Bildern; Desktop / Handy hoch / Handy quer): Menü → Spiel in derselben
  Welt 30 / 48 / 55 ms; Spiel → Menü 18 / 18 / 36 ms; Menü → dasselbe Level 18 / 13 / 18 ms; Menü → anderer Grad in
  einer anderen Welt 25 / 30 / 18 ms; Menü → Prolog eines neuen Grads (altes Brett versinkt) 79 / 30 / 61 ms;
  Epilog → Menü 91 / 18 / 18 ms. Keine Lücke über 100 ms ausser zwei, die nicht neu sind: das erste Zeichnen der Bühne
  beim Prolog (Handy 121–230 ms; gegen HEAD gemessen: vorher 182 ms, jetzt 188 ms) und die Bilder der Probe selbst
  (`Page.captureScreenshot`, auf dem Handy bis 0,45 s); die Probe meldet beide, zählt sie aber nicht. Fortsetzen in
  einer anderen Welt nach dem Laden, Handy: vorher 230 / 115 ms (Level wächst neben dem leeren Brett), jetzt 55 / 37 ms.
- **Tests** nacheinander über `leise.sh` (`LEISE_CPU=50`): Strahlregel 1963, Golden 824 Level, Vorrat 15, Levelliste 55,
  Würfelliste 20, KI-Tester 84, Beurteilung 206, Geschichte 30, Generator 31, Offline bestanden, Bedienung
  (`interaction-probe.js`) und `shots.mjs` (Platz 1 und 240, Desktop und Handy). Der KI-Tester-Test war zuerst rot (79,
  5 Fehler im Fingerabdruck, flach und Würfel W6), schon auf HEAD: `35142ee` hatte «Haupt-Kernidee» unter «Was Spass
  macht» in `CONTEXT.md` eingefügt, und diesen Abschnitt lesen die KI-Tester. Behoben, indem der Begriff nach «Level der
  Geschichte» vor «Vielfalt» wandert (mit Hinweis, warum); keine neue Version des Ablaufs. Soll er dort bleiben, braucht
  es stattdessen eine neue Version in `tools/ki-tester/protocol.mjs`.
- **Entscheide (selbst):**
  - Esc schliesst das Menü, das aus dem Spiel kam (wie «Weiter» zurück ins Level), wie man es von einem Dialog
    erwartet; nach dem Start und nach dem Epilog hat es keine Wirkung.
  - Wartet die Wahl auf den Himmel einer anderen Welt (1,5–4 s beim ersten Laden), bleibt die Kamera im Himmel, und
    nur dessen Farben gleiten zur neuen Welt; kein Untertitel, kein Schleier (zurückhaltend; der Einstieg kommt nur
    einmal je Grad).
  - Knopf «Menü»: drei Striche, dritter Knopf unten rechts (dort sass der Hintergrund-Knopf), «Menü (Esc)».
  - «Menü» geht auch, während ein Level versinkt oder herauswächst; das Level wächst dahinter fertig heraus.
  - Unterzeile auf dem Handy quer: klein, ohne die Bedienung (sie passt sonst nicht in eine Zeile).
- **Offen / für später:**
  - Ticket 06: `uebersicht: true` setzen und die Aktion `'uebersicht'` in `story.pick` behandeln (heute fiele sie auf
    `choose`); Knopf «Übersicht» im Spiel neben «Menü». Auf dem Handy quer zeigt eine Karte ihre Aktion nicht (Baustein);
    beim geschafften Grad ohne Übersicht führt sie heute ohne Beschriftung zur Rückfrage «Von vorn». Die Zeit im Menü
    zählt schon nicht für die Bestzeit (`resume`).
  - Ticket 07: Der Stand vor dem Bergwald heisst «Dorf · 0 / 60» (`welt: 'dorf'`); mit «Im Dorf» prüfen, ob gelöste
    Tutorial-Level dort zählen sollen (heute nur die 60), und «Menü» im Tutorial.
  - Ticket 08: Begriff «Menü» und «Weiter» ins Glossar; das erste Zeichnen der Bühne (Handy bis 0,23 s, wie vor dem
    Menü) liesse sich vorwärmen, solange das Menü still steht; Epilog → Menü auf dem Desktop 91 ms (knapp unter 100).
  - Die Bilder der KI-Tester (`shots.mjs`, `prepare.mjs`) zeigen unten rechts jetzt drei Knöpfe; nicht im
    Fingerabdruck.

**Review Code (30.10.2026)** (unabhängiger Reviewer, Schwerpunkt Code und Tests; geprüft gegen Häkchen, Entscheide 8,
14, 17, 19, 20, 25, 26, «Ablauf im Spiel», «Speicherstand» und den Baustein)

- **Baustein:** `createMenu` und das CSS sind zeichengleich mit `bausteine/menue/` bis auf Kommentare (Dateinamen statt
  «im CSS des Menüs») und `hide(sofort)` für `zeige`; die Abweichung ist begründet und wirkt nur in der
  Testschnittstelle.
- **Stand und Regeln:** `menuStand` (neu, begonnen ab dem Prolog mit `welt: 'dorf'`, geschafft, gelöste Level nur der
  60 des Grads), «Weiter» nur zum zuletzt gespielten, begonnenen Grad, Hervorhebung nur mit `hervorheben` nach dem
  Epilog (nächster nicht geschaffter, nach «sehr schwer» keiner) stimmen. «Von vorn» löscht nur `prisma.noa.<grad>`,
  `prisma.noa.zuletzt` bleibt; gilt es dem laufenden Grad, ist auch `paused` weg (Esc führt dann nicht mehr ins alte
  Level).
- **Abläufe:** Keine hängenden Zustände gefunden: `toMenu` sperrt während Zwischenszenen, Reise, Finale, `holdEnter`
  und der Blickwechsel zurück (`running`); das Menü nimmt nach jeder Aktion keine weitere an; `afterEpilog` ist gegen
  doppelt geschützt; Esc wirkt im Menü nur, wenn es aus dem Spiel kam, sonst schliesst es nur die Rückfrage. Menü
  während ein Level versinkt oder herauswächst: Derselbe Grad setzt fort (`resume` bzw. `begin` mit `sinkTo` aus der
  aktuellen Höhe). Nach dem Finale führen `begin`/`enter`/`fall` den Blick wieder auf 0; die Bühne hält nicht an, wenn
  der nächste Prolog sie schon zeigt (`scene.hide`).
- **Reste:** keine `story.menu`, `#story .grades` oder `data-mode="grades"` mehr; keine toten Funktionen oder Regeln.
- **`CONTEXT.md`:** Die drei Abschnitte, die die KI-Tester lesen (`glossary()`: «Was Spass macht», «Kernideen», «Was
  Spass verdirbt»), sind wieder zeichengleich mit dem Stand vor `35142ee`; sonst nur die Verschiebung von
  «Haupt-Kernidee» samt Hinweis, nichts verloren.
- **Behoben:**
  - `story.resume`: verschiebt jetzt auch `game.stats.lastTurnAt` um die Zeit im Menü, nicht nur `startedAt`. Kam der
    Lösungsmoment der letzten Drehung vor dem Menü erst nach der Rückkehr (Menü kürzer als das Aufleuchten der
    Ziele), fehlte die Zeit im Menü in der Lösungszeit, im Extremfall wurde sie negativ.
  - `tests/geschichte-probe.mjs`: zwei neue Zeilen über 120 Zeichen umbrochen.
  - Veraltete Kommentare «Wahl des Grads» in `tests/interaction-probe.js`, `tests/perf-probe.js` und
    `tests/levelliste.test.mjs` auf das Menü; im README die Grade «auf den Karten des Menüs» statt «auf den Knöpfen
    der Wahl des Grads», den Absatz «Ablauf» auf 120 Zeichen umbrochen.
- **Tests** (nacheinander über `leise.sh`, `LEISE_CPU=50`): Strahlregel 1963, Golden 824 Level, Vorrat 15, Levelliste
  55, Würfelliste 20, KI-Tester 84, Beurteilung 206, Geschichte 30, Generator 31, Offline, Bedienung
  (`interaction-probe.js`) und `shots.mjs` (Platz 1 und 240, Desktop und Handy, ohne Menü, drei Knöpfe) bestanden.
  Probe `--menue` auf Desktop, Handy hoch und Handy quer bestanden, Konsole ohne Fehler; keine Lücke über 100 ms.
  Knapp: Desktop «Menü → Prolog» 91 ms mit 10 Lücken über 50 ms, während die Bühne des Prologs steht (nicht das Menü).
- **Offen (klein, nicht behoben):**
  - Geschaffter Grad ohne Übersicht: Nach der bestätigten Rückfrage bleibt das Menü offen und der Grad ist neu; erst
    ein zweiter Klick beginnt. Das Ticket spricht von «Fortsetzung von vorn mit Rückfrage». Bis Ticket 06 vertretbar.
  - «Menü» und «Neu starten» stehen während Reise und Finale da, wirken aber nicht (wie bisher «Neu starten»).
- **Commitbereit:** ja.

**Nachbesserung nach dem Browser-Review (30.10.2026, nicht committet)**

- **Gehaltenes Enter am Startbildschirm** (`holdUntilRelease` in `index.html`): Nach dem Start mit Enter oder
  Leertaste gehört die Taste bis zum Loslassen niemandem mehr (Wiederholungen beim Drücken und das Loslassen mit
  `preventDefault` und `stopImmediatePropagation` geschluckt); so löst sie im Menü, das gleich den Fokus setzt, keinen
  Knopf aus. Ein neues Drücken gibt sie frei (falls das Loslassen verpasst wurde). Ersetzt den bisherigen `halt` nur für
  das Loslassen der Leertaste.
- **«Weiter» (Entscheid 25, Auslegung des Koordinators):** zum zuletzt gespielten unter den begonnenen, nicht
  geschafften Graden. Jeder Grad merkt sich beim Speichern `gespielt` (ms) im Stand `prisma.noa.<grad>`; gespeichert
  wird jetzt auch bei der Wahl im Menü. `story.menuStand`: Ist der zuletzt gewählte Grad (`prisma.noa.zuletzt`, bleibt)
  begonnen, ist er es; sonst der begonnene mit dem jüngsten `gespielt` (ein Stand ohne Zeit zählt als ältester).
  «Von vorn» und «geschafft» nehmen einen Grad aus dieser Wahl. Die Hervorhebung nach dem Epilog rechnet jetzt das
  Spiel (als Schlüssel des Grads an den Baustein, der das so vorsieht); so stehen nach dem Epilog Hervorhebung und
  «Weiter» nebeneinander, und die Zeichen der Welten sitzen wieder am Weg von «Weiter». Der Fokus geht dann nach der
  Regel des Bausteins auf «Weiter».
- **«Von vorn» auf dem Handy quer:** so hoch, wie es geht, bis 40 px (`clamp` mit `dvh`; vorher 95 × 28 px). Gemessen
  mit vier Graden mit «Von vorn» (der engste Fall, mit Ticket 06 auch bei geschafften Graden): bei 844 × 390 je 40 px,
  die Liste genau voll (die Lücken zwischen den Graden werden 0, der Abstand zur nächsten Zeile bleibt durch den Rand im
  Knopf), bei 667 × 375 je 36 px; ohne `dvh` wie bisher 28 px. Abweichung vom Baustein (`menue.css` dort unverändert).
- **Proben** (nacheinander über `leise.sh`, Zeitrahmen jetzt innerhalb: `sh tools/leise.sh timeout -k 30 900 node …`,
  damit das Warten auf die Sperre nicht zählt; so auch im README): `--menue` auf Desktop, Handy hoch und quer (Touch)
  und `--finale leicht` auf dem Desktop bestanden, Konsole ohne Fehler.
  - Neu in `--menue` (Desktop, allein mit `--start`): gehaltenes Enter am Startbildschirm (Druck, eine halbe Sekunde
    Wiederholungen, Loslassen) ohne Stand und mit Stand: Das Menü bleibt offen, Fokus auf «Leicht» bzw. «Weiter»,
    kein Stand geschrieben; danach wählt ein neues Enter wieder. Gegenprobe mit einer Kopie ohne `holdUntilRelease`:
    dort startet die Wiederholung «Leicht» mit dem Prolog.
  - Ausgangsstand der Probe jetzt Leicht begonnen (lange nicht gespielt), Mittel, Schwer, Sehr schwer geschafft;
    «Von vorn» gilt Schwer, dem zuletzt gespielten Grad mit seinem Level auf dem Brett: danach führt «Weiter» zu Mittel
    (nicht zu Leicht, das in der Reihe vorher kommt), die Zeichen der Welten stehen an seinem Weg, Esc bleibt im Menü,
    und der neue Durchgang von Schwer beginnt mit dem Prolog, während sein altes Brett versinkt.
  - `--finale`: ein weiterer Grad im Vulkan begonnen; nach dem Epilog Hervorhebung des nächstschwereren und «Weiter» zum
    begonnenen Grad mit den Zeichen der Welten, Fokus auf «Weiter».
  - Bildzeiten (Desktop / Handy hoch / quer): Menü → gleiche Welt 43 / 85 / 67 ms, Spiel → Menü 18 / 24 / 24 ms,
    Menü → dasselbe Level 24 / 12 / 18 ms, Menü → andere Welt 24 / 18 / 30 ms, Menü → Prolog 48 / 36 / 73 ms,
    Epilog → Menü 36 ms (Desktop); keine Lücke über 100 ms ausser den bekannten (erstes Zeichnen der Bühne auf dem Handy
    121 ms, Bild der Probe).
- **Tests:** Geschichte 30, Levelliste 55, KI-Tester 84 bestanden.

**Abschluss (30.10.2026):** Review Code und Review Browser commitbereit; Nachbesserungen aus dem Browser-Review
(gehaltenes Enter, «Weiter» nach Entscheid 25 als jüngster begonnener, nicht geschaffter Grad, «Von vorn» auf dem
Handy quer 40 px) mit Proben belegt. Nach dem Epilog liegt der Fokus nach der Regel des Bausteins auf «Weiter», der
nächstschwerere Grad ist hervorgehoben (Entscheid 14) – so belassen. Ruck beim ersten Öffnen des Menüs → Ticket 08.
