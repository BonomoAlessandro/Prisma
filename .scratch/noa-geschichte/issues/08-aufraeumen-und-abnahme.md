# 08: Aufräumen, Begriffe, Abnahme

**Spec:** ../spec.md

**Blocked by:** 05, 06, 07, 09

**Status:** ready-for-agent

**What to build:** Was die 500er-Reihe brauchte und nicht mehr gebraucht wird, ist weg; Begriffe und Entscheide sind
festgehalten; ein ganzer Durchgang je Grad ist im Browser geprüft. Danach ist der Stand bereit für den Merge, den der
Nutzer auslöst.

- [ ] Code der alten Levelauswahl, der Würfel-Darstellung im Menü, der Hintergrund-Wahl und von `?signal` entfernt, wo
      er nicht mehr gebraucht wird (die Würfel-Strahlregel und -Darstellung bleiben, damit zurückgeholte Würfel-Level
      laufen).
- [ ] Werkzeuge und Tests der 500er-Reihe (Reihenfolge nach Formel, Seiten, Prüfliste) entfernt oder auf den Vorrat
      umgestellt; README und Kopfkommentare angepasst.
- [ ] `CONTEXT.md`: Begriffe Geschichte, Durchgang, Welt, Vorrat, Übersicht, Titel; ADR «Die Geschichte ersetzt die
      feste Reihenfolge» unter `docs/adr/`.
- [ ] PLAN.md 0 auf erledigt, offene Punkte nachgetragen (eigene Skybox «Im Dorf», Würfel als Teil 2).
- [ ] Abnahme im Browser: je Grad ein ganzer Durchgang (automatisch gelöst) vom Menü bis zum Epilog, dazu Wiederholen,
      «Von vorn», Neuladen mitten in einer Welt; Desktop und Handy; Messung der Bildzeiten in den Zwischenszenen wie
      vor dem Umbau.
- [ ] Alle Tests grün; Review nach dem Ticket. Kein Merge, bis der Nutzer es sagt.

## Comments

**Doku vorab (30.10.2026):** `CONTEXT.md` (Abschnitte «Noas Geschichte», «Level der Geschichte», «Abgelöst») und
ADR 0005 «Die Geschichte ersetzt die feste Reihenfolge» geschrieben, vor dem Abschluss dieses Tickets nachführen. Beim
Aufräumen mitnehmen: «Reise» im Code nur noch für den Übergang zwischen Welten (`story.travel`), die 60 Level eines
Grads heissen «Durchgang» (Kommentare um `story.steps`); den Eintrag «Reihe» in `CONTEXT.md` nachführen, sobald
Levelliste, KI-Tester und Golden-Test umgestellt oder entfernt sind; in ADR 0001 einen kurzen Verweis «für das Spiel
abgelöst durch ADR 0005» ergänzen; «Platzhalter» nach Ticket 09 als abgelöst markieren.

**Aus dem Review von Ticket 05 (30.10.2026):** Beim ersten Öffnen des Menüs mit Lichtwegen (begonnene oder geschaffte
Grade) gibt es 0,35–0,6 s nach dem Klick einen zweiten Ruck (Desktop 121–218 ms, mit Finale-Stand bis 376 ms; Handy
hoch 206 ms), vermutlich das erste Zeichnen des Leucht-Filters der Wege (`feGaussianBlur`); dazu das erste «Spiel →
Menü» auf dem Handy (121 ms). Vorwärmen, solange der Startbildschirm steht. Ebenso die Prolog-Bühne beim ersten
Zeichnen (Desktop 103–151 ms, Handy bis 249 ms) und sporadisch Epilog → Menü (einmal 248 ms). Während Reise und Finale
sind «Menü» und «Neu starten» sichtbar, wirken aber nicht – ausblenden oder sichtbar sperren.
