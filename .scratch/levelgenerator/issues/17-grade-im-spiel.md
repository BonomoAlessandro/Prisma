# 17: Grade im Spiel

**What to build:** Spieler sehen den Schwierigkeitsgrad jedes Levels: als Punkte auf den Kacheln der Levelauswahl und
als Text in der Kopfzeile und im Seitentitel.

**Spec:** ../spec.md, Abschnitt „Anzeige der Grade“.

**Blocked by:** 15 (Neue Reihenfolge und Grade)

**Status:** resolved

- [x] Jede Kachel eines Levels nach dem Tutorial zeigt Punkte 1–4, von ●○○○ bis ●●●●. Das Tutorial hat keine Punkte.
- [x] Die Kopfzeile des Levels nennt den Grad als Text.
- [x] Der Seitentitel der Levelauswahl nennt den Grad als Text, wenn alle Level der Seite denselben Grad haben, so wie
      heute bei der Markierung.
- [x] Die Grade haben keine eigenen Farben, weil Rot, Grün und Blau im Spiel Lichtfarben sind. Sie sind ohne Farbsehen
      lesbar, und der Text für Screenreader nennt den Grad.
- [x] Screenshots sind geprüft, auf Desktop und Handy: die Levelauswahl über mehrere Seiten und die Kopfzeile in je
      einem Level pro Grad. Sie entstehen über die gedeckelte Umgebung, nacheinander.
- [x] Alle Tests sind grün.
- [x] Entstehen neue Dateien für das Spiel, stehen sie im Build Command von Render und im Service Worker. (Es
      entstehen keine.)

## Comments

**Hinweise aus Ticket 15 (16.10.2026):**
- Jedes Level nach dem Tutorial trägt seinen Grad im Feld `grad` (`'leicht'`, `'mittel'`, `'schwer'`,
  `'sehr schwer'`); das Feld `difficulty` gibt es nicht mehr. Reihenfolge: leicht 1–32, mittel 33–102, schwer
  103–137, sehr schwer 138–150.
- Bis zu diesem Ticket zeigt das Spiel nur „schwer“ und „sehr schwer“: `GRAD_ANZEIGE` in index.html (früher
  `DIFFICULTY`), genutzt von `fillTier`, dem Seitentitel in `PAGES` und der Kachel. Der Seitentitel nennt den Grad
  nur, wenn er in `GRAD_ANZEIGE` steht und die ganze Seite ihn hat.
- Mit den neuen Graden zeigen heute die Seiten 111–120 und 121–130 „Schwer“ und 141–150 „Sehr schwer“ im Titel, 101–110
  und 131–140 sind gemischt. Die Kacheln der Plätze 103–150 tragen Rauten statt bisher 121–150.
- Die Proben aus Ticket 15: `tests/screenshot.mjs` mit `__prismaDebug.ui.openLevels()` und `showPage('…')` für die
  Levelauswahl, `tools/ki-tester/shots.mjs <ordner> <platz …>` (Platz im Spiel) für die Kopfzeile. Beides über
  `leise.sh`, Desktop 1440 × 900 und Handy 390 × 844.

**Abschluss 17.10.2026.** Gearbeitet im Worktree `prisma-wt/t17` auf dem Branch `ticket-17` (Stand von
`feature/levelgenerator`, `456a4d1`). Alle Läufe gingen über `leise.sh` mit 20 %, nacheinander.
- **Anzeige** (`index.html`): `GRAD_ANZEIGE` kennt alle vier Grade mit Text und Zahl der Punkte (`GRAD_PUNKTE` = 4).
  `fillTier` zeichnet die Punkte als vier CSS-Kreise, volle gefüllt, leere als Ring. Sie stammen nicht aus der Schrift,
  weil Jost nur den lateinischen Zeichensatz hat und ● und ○ sonst je nach Gerät aus verschiedenen Ersatzschriften
  kämen.
  - **Kachel:** Punkte oben rechts, wo vorher die Rauten standen. Auf dem Handy, hochkant und quer, rückt die Zahl 8 px
    tiefer, damit sie nicht an den Punkten klebt.
  - **Kopfzeile:** Punkte und Text hinter dem Namen. Auf dem Handy hochkant stehen sie in einer eigenen Zeile unter dem
    Namen, weil lange Namen wie „Lichtgeschwindigkeit“ die Zeile füllen. Quer stehen sie wieder in der Zeile des
    Namens, dort ist Platz.
  - **Seitentitel:** unverändert nach der Regel „ganze Seite gleicher Grad“, jetzt für alle vier Grade.
  - **Farben:** keine eigenen; `--hard` und `--very-hard` sind entfernt. Punkte und Text stehen in `--ink-dim` wie
    Ziele und Hinweis. Volle und leere Punkte unterscheiden sich in der Form.
  - **Screenreader:** Die Punkte sind `aria-hidden`. Gelesen wird der Text, in der Kopfzeile und im `aria-label` der
    Kachel („Level 103 Rangierbahnhof, schwer, gelöst“).
- **KI-Tester:** Der Grad bleibt im Element `#hud-tier`. `shots.mjs` blendet ihn deshalb für die KI-Tester weiter mit
  `hidden` aus. Damit `display: block` auf dem Handy `hidden` nicht aushebelt, gilt `#hud .tier[hidden]
  { display: none; }`. Im Browser geprüft: Tutorial `none`, Level 135 `block`, versteckt `none`.
- **Test** (`tests/levelliste.test.mjs`, Abschnitt Grade): Die Daten der Anzeige kommen aus index.html.
  - Die vier Grade ergeben ●○○○ Leicht bis ●●●● Sehr schwer.
  - Der Seitentitel nennt den Grad nur auf einer einheitlichen Seite. Geprüft an einer von Hand gebauten Liste (leicht,
    gemischt, angefangene sehr schwere Seite) und an allen Seiten im Spiel.
- **Proben** (von git ignoriert, im Worktree), Desktop 1440 × 900 und Handy 390 × 844 (Pixeldichte 2):
  - Levelauswahl: `tests/output/t17-auswahl-<seite>-desktop.png` und `-handy.png` für die Seiten `T` (Tutorial), `1`
    (leicht), `31` (gemischt leicht/mittel), `101` (gemischt mittel/schwer), `111` (schwer) und `141` (sehr schwer).
    Die Level 31, 33, 34 und 112 sind dabei als gelöst markiert, damit auch der Punkt für „gelöst“ zu sehen ist.
  - Kopfzeile: `tests/output/t17-kopfzeile/<platz>-desktop.png` und `-handy.png` für 32 (leicht), 67 (mittel), 135
    (schwer, längster Name) und 147 (sehr schwer).
  - Dazu `tests/output/t17-kopf-tutorial-handy.png` (Tutorial ohne Grad) und `tests/output/t17-kopf-135-handy-quer.png`
    (Handy quer, 844 × 390). Zum Vergleich der alte Stand: `tests/output/t17-vorher-auswahl-101-*.png` und
    `tests/output/t17-vorher-kopf/140-*.png`.
  - **Urteil:** Die vier Grade sind auf beiden Geräten auf einen Blick zu unterscheiden. Punkte und Text sind mittig
    ausgerichtet. Der Punkt für „gelöst“ bleibt unten mittig und leuchtet, Verwechslung ausgeschlossen. Die Anzeige
    des Grads bricht nirgends um.
  - **Schon vorher so, nicht Teil des Tickets:** Lange Namen wie „Ereignishorizont“ oder „Rangierbahnhof“ machen das
    Kachelraster auf dem Desktop breiter als die Reiter, sodass es nach rechts übersteht.
- **Tests** über `leise.sh`, alle grün: Golden 4 s, Logik 17 s (553 Tests), Levelliste 27 s (20), Beurteilung 61 s
  (172) und KI-Tester 1 s (54). In den 61 s der Beurteilung und im Schlusslauf der Levelliste (93 s) steckt Wartezeit
  in der Warteschlange von `leise.sh`.
- **Neue Dateien:** keine; Build Command auf Render und Service Worker bleiben, wie sie sind.

**Review 17.10.2026.** Im Querformat stiessen dreistellige Zahlen auf der Kachel an die Punkte („141●●●●“, auf
568 × 320 überlappend); behoben wie hochkant mit `margin-top: 8px` für die Zahl. Proben unter `tests/output/r17-*`:
Levelauswahl 41–50 (nur mittel) und Kopfzeile 38 (mittel) und 147 (sehr schwer) auf Desktop, Handy hochkant und quer,
Seite 141 quer vor und nach der Korrektur. Die Aufnahmen der KI-Tester mit Kennung (32, 67, 135, 147) sind auf Desktop
und Handy byte-gleich mit denen aus `456a4d1` (`r17-ki-vorher/`, `r17-ki-nachher/`).
