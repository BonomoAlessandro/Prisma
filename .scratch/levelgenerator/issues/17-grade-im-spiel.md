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
