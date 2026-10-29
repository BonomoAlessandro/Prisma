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
