# 17: Grade im Spiel

**What to build:** Spieler sehen den Schwierigkeitsgrad jedes Levels: als Punkte auf den Kacheln der Levelauswahl und
als Text in der Kopfzeile und im Seitentitel.

**Spec:** ../spec.md, Abschnitt „Anzeige der Grade“.

**Blocked by:** 15 (Neue Reihenfolge und Grade)

**Status:** ready-for-agent

- [ ] Jede Kachel eines Levels nach dem Tutorial zeigt Punkte 1–4, von ●○○○ bis ●●●●. Das Tutorial hat keine Punkte.
- [ ] Die Kopfzeile des Levels nennt den Grad als Text.
- [ ] Der Seitentitel der Levelauswahl nennt den Grad als Text, wenn alle Level der Seite denselben Grad haben, so wie
      heute bei der Markierung.
- [ ] Die Grade haben keine eigenen Farben, weil Rot, Grün und Blau im Spiel Lichtfarben sind. Sie sind ohne Farbsehen
      lesbar, und der Text für Screenreader nennt den Grad.
- [ ] Screenshots sind geprüft, auf Desktop und Handy: die Levelauswahl über mehrere Seiten und die Kopfzeile in je
      einem Level pro Grad. Sie entstehen über die gedeckelte Umgebung, nacheinander.
- [ ] Alle Tests sind grün.
- [ ] Entstehen neue Dateien für das Spiel, stehen sie im Build Command von Render und im Service Worker.

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
