# 01: Gestalt und Stand des Wagens, Sprungbrett, Vorher-Lauf

**Spec:** ../spec.md

**Blocked by:** –

**Status:** ready-for-agent

**What to build:** Die Grundlage für alle weiteren Tickets: Der Kleine Wagen steht als Form, Reihenfolge, Linien und
Stand an einer Stelle im Code (Entscheide 4–6, 10, Abschnitt «Der Wagen» der Spec). Dazu das Sprungbrett zur Abnahme
(Entscheide 24, 25) und ein Lauf der Probe auf dem heutigen Stand, an dem spätere Tickets die Dauer von Reisen und
Finale messen (Entscheid 19). Im Bild ändert sich in diesem Ticket noch nichts ausser dem Knopf «Szenen».

Zuerst den Branch `feature/kleiner-wagen` von main anlegen.

- [x] **Vorher-Lauf**, bevor etwas an `index.html` geändert wird: die Browser-Probe der Geschichte mit dem ganzen
      Durchgang in «leicht» (Desktop und Handy hoch), Dauer jedes Einstiegs, jeder Reise und des Finales (vom Klick
      auf «Weiter» bis zum spielbaren Level bzw. bis zum Epilog) und ihre Bildzeiten. Ergebnis als Datei in diesem
      Ordner (nicht in `tests/output/`, das ist ignoriert), damit spätere Tickets dagegen messen.
- [x] **Wagen-Modul an einer Stelle:** sieben Sterne in der Form des Ladezeichens (Polarstern zuerst), die
      Reihenfolge des Erwachens (Stern 1 Bergwald … Stern 6 Sterne, 7 Polarstern), die Linien je erwachtem Stern
      (k − 1 → k, mit Stern 4 zusätzlich 4 → 1; 6 → 7 erst nach dem Finale).
- [x] **Stand aus dem Durchgang ableiten**, ohne neue Felder im Speicherstand: welche Sterne wach, welche Linien
      gezogen, welcher Stern der nächste. Ein Stern ist wach, sobald das letzte Level seiner Welt gelöst ist; ein
      geschaffter Grad hat alle sieben Linien. Je Grad getrennt; «Von vorn» ergibt alle schlafend.
- [x] Der Stand ist über das Objekt der Geschichte lesbar, das die Testschnittstelle schon zeigt (keine neue
      Schnittstelle, nichts, was ein Level überspringt).
- [x] Das **Ladezeichen** nimmt seine Form aus dem Wagen-Modul und sieht genau aus wie vorher (Bilder vorher/nachher
      vergleichen, auch Grösse und Lage `oben`).
- [x] **Sprungbrett** (nur mit `?szenen`): Knopf «Szenen» in einer Ecke, der eine Liste öffnet: Prolog, Einstieg ins
      Dorf, Einstieg in den Bergwald, Bergwald → Meer, Meer → Wüste, Wüste → Vulkan, Vulkan → Planeten, Planeten →
      Sterne, Finale, Epilog. Bedienbar mit Maus, Finger und Tastatur; nicht im Weg von Menü, Übersicht und Knöpfen
      des Spiels.
- [x] Jeder Sprung setzt einen vorübergehenden Stand, der dem Durchgang an dieser Stelle entspricht (vor dem Vulkan
      drei Sterne wach usw.), und spielt die Szene von ihrem natürlichen Anfang (beim Ende einer Welt: ab dem
      Aufstieg nach dem letzten Level). Danach geht es normal weiter; das nächste Level ist spielbar.
- [x] Solange `?szenen` gilt, schreibt das Spiel weder Stand noch Bestwerte. Nach Neuladen ohne Parameter ist alles
      wie vorher (prüfen).
- [x] Das Sprungbrett ist ein abgegrenzter Teil, den Ticket 10 mit einem Schnitt entfernen kann (an wenigen,
      markierten Stellen; im Kommentar steht, dass es vorübergehend ist, Ausnahme von ADR 0005).
- [x] **Probe** erweitert um einen Ablauf für den Wagen (über das Menü gespielt, gelöst über die Testschnittstelle):
      Stand nach jeder Welt, nach Neuladen mitten in einer Welt, beim Fortsetzen, nach Wechsel über das Menü, beim
      Wiederholen einer früheren Welt, je Grad getrennt, nach «Von vorn» (Bestwerte bleiben), geschaffter Grad.
- [x] Alle bestehenden Tests grün; Review nach dem Ticket (Tests grün laut Notiz des Umsetzers; Review offen).

## Anhaltspunkte im Code

- Form heute in `ladeZeichen` (Sterne `P`, Linien `K`); `#lade` und seine Grösse bleiben dort.
- Stand je Grad: `story` mit `setGrade`, `menuStand`, `progress` (`prisma.noa.<grad>`), `STORY_LEVELS`,
  `STORY_CHAPTERS`, `storyChapterId`.
- Testschnittstelle: `window.__prismaDebug` (zeigt `story`, `progress`, `skyTheme`), `loese()`.
- Probe: `tests/geschichte-probe.mjs` (Abläufe `--ganz`, `--uebersicht`, `--dorf` als Vorbild).
- Der Parameter `?wagen=<faktor>` gehört dem Ladezeichen; neue Namen nicht damit verwechseln.

## Comments

**04.11.2026 abends, Notiz des Umsetzers** (Zwischenstand f0c686f geprüft und abgeschlossen; zweiter Umsetzer auf dem
anderen Rechner).

Gebaut (im Zwischenstand, geprüft):

- `const wagen` in `index.html` (nach `storyChapterId`): `form` (Stern 1 … 7, Polarstern zuletzt), `linien` (1→2,
  2→3, 3→4, 4→1, 4→5, 5→6, 6→7), `polarstern`, `stand(stand, welten)` → `{ wach, linien, naechster }`. Gelesen über
  `story.wagenStand(grad)` (Objekt der Geschichte, das `__prismaDebug` schon zeigt; ohne neues Feld im Speicherstand).
- `ladeZeichen` baut `P` und `K` aus `wagen.form` (umgekehrt) und `wagen.linien`; das ergibt genau die alten Tabellen.
- Sprungbrett `?szenen`: `SZENEN_SPEICHER` bei `progress` (read/write/remove), CSS `#szenen`, Block «SZENEN» am Ende
  des Scripts. Alle Stellen tragen «SZENEN (vorübergehend, Ticket 10 entfernt»: CSS, `SZENEN_SPEICHER`, drei Zeilen in
  `progress`, der Block am Ende, dazu jetzt eine Zeile in `tests/levelliste.test.mjs` (siehe unten).
- Probe: `--wagen` (wagenAblauf), `--messwerte`, Dauer der Zwischenszenen (`ende(name, { bis })`); Vorher-Lauf in
  `vorher/`.

Behoben:

- `tests/levelliste.test.mjs` schlug fehl («SZENEN_SPEICHER is not defined»): Der Test schneidet `const progress = {…}`
  aus `index.html` und führt es für sich aus. Er gibt jetzt `SZENEN_SPEICHER = null` mit (markiert «SZENEN
  (vorübergehend, Ticket 10 entfernt)»; Ticket 10 nimmt den Parameter wieder heraus).

Geprüft (alle über `LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh …`, Chrome stumm):

- Node-Tests: logic 2036, hall 6, vorrat 18, levelliste 53 (nach der Behebung), wuerfelliste 20, beurteilung 206,
  geschichte 35, ki-tester 84, generator 31, golden (847 Level), offline und offline --redirect: alle bestanden.
- Probe `--wagen` Desktop (188 s) und `--wagen --handy` (181 s): bestanden, Konsole ohne Fehler.
- Probe ohne Argumente (vier Grade): bestanden, 642 s. Ein erster Lauf brach nach 1650 s mit «Zeitrahmen 14 min»
  ab: Nach dem Bild `desktop-leicht-21` antwortete die Seite beim Neuladen etwa 12 min nicht mehr (ein Hänger, keine
  Langsamkeit). Danach je ein Lauf auf main (Arbeitskopie von d537f69) und auf diesem Stand: beide 642 s, bestanden.
  Der Ablauf ohne Argumente berührt nichts Neues (Wagen-Ablauf nur mit `--wagen`, Dauer nur mit `--ganz`/`--finale`).
- Probe `--ganz` Desktop (443 s, Messwerte gegen `vorher/desktop.json`: Reisen 13,13–13,27 s statt 13,15–13,29 s,
  Finale netto 13,94 statt 14,00 s, Prolog 27,85 statt 28,09 s, keine Lücke über 50 ms), `--finale leicht`, `--menue`,
  `--dorf`, `--handy --grad leicht`: bestanden.
- Probe `--uebersicht`: «Spiel → Übersicht» hat am Anfang eine Lücke von 83–117 ms (ein Bild über oder unter der
  Grenze von 100 ms). Je drei Läufe abwechselnd: dieser Stand 100/83/67 ms, main 83/83/100 ms (dazu ein früherer Lauf
  auf main mit 83 ms). Der Fehler tritt auf main gleich auf und kommt nicht von diesem Ticket (ohne `?szenen` läuft beim
  Öffnen der Übersicht nichts Neues). Er bleibt offen, ausserhalb von Ticket 01.
- Ladezeichen vorher (main) / nachher, Desktop 1440 × 900 und Handy 390 × 844 (Pixeldichte 2), Mitte und `oben`: DOM,
  erzeugtes CSS, Klassen, `--gross` (2,2 bzw. 1), Lage und Grösse (Desktop mitte 539/261, 362 × 235; oben 539/108) und
  Bilder zu sechs festen Zeitpunkten der Animation (0 bis 3,2 s, angehalten): alles byte-gleich.
- Sprungbrett (Prüfskript im Scratchpad des Umsetzers, kein bleibender Test), Desktop mit Maus und Tastatur, Handy mit
  dem Finger: Stand in Mittel (Wüste 23) und Leicht mit Bestwerten gesetzt; ohne `?szenen` kein Knopf; mit `?szenen`
  der Knopf oben links, über keinem Knopf des Menüs, Liste wie im Ticket. Tastatur: Enter öffnet (Fokus auf
  «Prolog»), Pfeile, Pos1/Ende wandern, Esc schliesst und gibt den Fokus an den Knopf zurück, Enter springt; daneben
  getippt schliesst. Alle zehn Sprünge nacheinander, je bis zum nächsten spielbaren Level (gelöst) bzw. bis «Zum Menü»:
  Prolog mit Angebot und «Gleich los», Einstieg ins Dorf («Im Dorf · Erstes Licht»), Einstieg in den Bergwald,
  Bergwald → Meer … Planeten → Sterne (vorher w Sterne wach, danach w + 1, Untertitel der Reise richtig), Finale (vorher
  5, danach 7, Epilog, «Zum Menü»), Epilog (7). Nach jedem Sprung localStorage unverändert; nach dem Neuladen ohne
  `?szenen` localStorage, «Weiter Mittel · Wüste 23 / 60» und der Wagen aller Grade wie vorher; Konsole ohne Fehler.
  Die zehn Meldungen «Bühne: liegt unter einem anderen Element» im ersten Desktop-Lauf kamen vom Prüfskript: Es prüfte,
  ob die Mitte von `#story .scene .lines` zuoberst liegt, dort liegt aber die Bühne selbst (`div.scene.lit`), auf die
  der Klick wirkt wie in der Probe. Der Knopf «Szenen» ist während jeder Zwischenszene ausgeblendet (`.hidden`, ohne
  Zeiger, inert). Wiederholt nach der Nachbesserung (meldet jetzt nur, wenn das Sprungbrett darüberliegt): Desktop und
  Handy bestanden.

Offen:

- Review (anderer Agent), dann Commit durch den Koordinator.
- Die Lücke beim Öffnen der Übersicht aus dem Spiel (83–117 ms, auch auf main), ausserhalb dieses Tickets.
- Ein einmaliger Hänger der Probe beim Neuladen (siehe oben), nicht nachgestellt. Einmal genauso im Prüfskript des
  Sprungbretts auf dem Handy (Laden ohne `?szenen` am Schluss, Seite antwortete nicht); die Wiederholung bestand. Ein
  Zusammenhang mit dem Ticket ist nicht zu sehen (der Hänger kam auch ohne `?szenen`), auf main nicht gezielt geprüft.

**04.11.2026 abends, Review** (unabhängiger Reviewer; Code `git diff 6f322ce -- index.html tests tools CLAUDE.md` und
Arbeitskopie).

Funde:

- Keine mittleren oder grossen. `wagen.stand` entspricht der Spec (wach ab dem letzten Level der Welt, Polarstern nur
  mit `geschafft`, Linien nur zwischen wachen Sternen, je Grad, «Von vorn» über `progress.remove`). `ladeZeichen` ergibt
  aus `wagen.form`/`wagen.linien` genau die alten Tabellen `P` und `K` (nachgerechnet). Das Sprungbrett schreibt mit
  `?szenen` nur in `SZENEN_SPEICHER` (alle Schreibstellen von Stand, Bestwerten und `zuletzt` gehen über `progress`;
  sonst schreibt nur der Ton in localStorage), alle Stellen tragen das Kennwort.
- Klein, behoben: Kommentar bei `wagen.form` «bei Grösse 1 knapp Pixel» stimmte nicht (S = 1,2), jetzt «je 1,2 px».
- Hinweise, nicht geändert: (1) Hat der Knopf «Szenen» nach Esc den Fokus, schluckt das Sprungbrett alle Tasten des
  Spiels, bis man daneben klickt (für ein vorübergehendes Werkzeug hingenommen). (2) Der Kommentar bei `wagen` nennt
  schon Himmel, Bühne, Menü usw. als Nutzer; bisher nimmt nur das Ladezeichen daraus (kommt mit 04 bis 08). (3) Eine
  Zeile in `progress.remove` ist länger als 120 Zeichen.

Tests (ein Lauf `LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh sh lauf.sh`, Node-Tests parallel, Chrome stumm):
logic 2036, hall 6, vorrat 18, levelliste 54, wuerfelliste 20, beurteilung 206, geschichte 35, ki-tester 84, golden
(847 Level), offline und offline --redirect: bestanden. Probe `--wagen`, `--wagen --handy`, ohne Argumente: bestanden.
generator: 30 bestanden, 1 FAIL «Er läuft nur gedeckelt» (Kindprozess mit leerem stderr, unter Last parallel; von Hand
bricht der Generator mit der richtigen Meldung ab; das Ticket berührt den Generator nicht) – einzeln zu wiederholen.
Bei der Übergabe noch offen: `--ganz`, `--finale leicht`, `--menue`, `--uebersicht`, `--dorf`, `--handy --grad leicht`.

Nachgetragen vom Koordinator (04.11.2026, 23:30): `--ganz`, `--finale leicht`, `--handy --grad leicht` bestanden;
Generator-Test «Er läuft nur gedeckelt» allein bestanden (der Fehlschlag kam von der parallelen Last). `--menue`,
`--uebersicht` und `--dorf` waren ab etwa 22:47 rot, je nur an einzelnen Bildlücken von 120–460 ms, Konsole und Werte
sauber. Vergleich allein auf main (6f322ce, Worktree): `--menue` und `--uebersicht` dort ebenso rot (Lücken bis 266 ms),
also nicht vom Ticket. `--dorf` («Übung 8 wiederholen → Übung 9») abwechselnd: main 36/53/53 ms, Branch 459/404 ms in den
ersten beiden Läufen, dann 53/53 ms – gleich wie main. Die grossen Lücken sind Störungen des Rechners, kein Fund. Hinweis:
Der Rechner war an diesem Abend dreimal im Standby (19:10, 19:39–20:04, 21:12–21:55, Fehler im Wach-Skript), daher die
«Hänger» in den Notizen oben. Urteil: bereit zum Commit.
