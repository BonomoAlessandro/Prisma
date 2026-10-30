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

**Aus dem Review von Ticket 06 (30.10.2026):** In der Übersicht wirken Pfeile/Pos1/Ende nicht, solange «Schliessen»
den Fokus hat; Hinweis zur gesperrten Kachel auf dem Desktop näher an die Kachel; «Schliessen» auf 44 px; erstes
Zeichnen einer frisch geladenen Skybox (Reise, Weltgrenze) kostet 50–120 ms; auf kleinen Handys hoch (unter 700 px)
zeigt das Menü die Aktion der Karte nicht; Begriffe «Wiederholen» und «Bestwerte» ins Glossar.

**Doku-Teil (Worktree noa/08-doku, 30.10.2026)** – parallel zu Ticket 07 und zum Einbau von 09, ohne Code:

- **`CONTEXT.md`** (Abschnitt «Noas Geschichte»): Durchgang (geschafft heisst Finale gesehen, «Von vorn», «Reise» nur
  noch unter _Vermeiden_), Welt (Abgrenzung zu «Im Dorf»: Kapitel ohne Nummer, keine Welt), Einstieg in eine Welt
  (überspringbar, Einstieg ins Dorf ohne Träger), Reise (läuft ganz, nicht überspringbar, Entscheid 28), Übersicht
  geschärft; «Im Dorf» nach dem Einbauplan und den Entscheiden von Ticket 07 neu gefasst (Übungen, Angebot auch nach
  übersprungenem Prolog, keine der sechs Welten, zählt nicht zu den 60, Übersicht, Milchstrasse); neu «Menü» (mit
  «Weiter» und «Von vorn», Wunsch aus 05), «Wiederholen», «Bestwerte» (überleben «Von vorn», Entscheid 27) und
  «Testschnittstelle» (Wunsch aus 04). Titel: «sonst den Namen (die Übungen im Dorf)». Geschichte, Grad, Vorrat
  unverändert geprüft. «Was Spass macht», «Kernideen», «Was Spass verdirbt» unberührt; `tests/ki-tester.test.mjs`
  danach grün (siehe unten).
- **ADR 0001:** Verweis «Für das Spiel abgelöst durch ADR 0005», als Massstab der Eichung gilt es weiter.
- **ADR 0005** nachgeführt: «Weiter» und «Von vorn» im Menü, «Im Dorf» als Kapitel ohne Welt, Wiederholen ohne
  Zwischenszenen, Bestwerte überleben «Von vorn», Reisen laufen ganz (Entscheide 27, 28); die Entscheide des
  Koordinators aus 05–07 als markierte Liste; unter «Verworfen» Bestwerte mit «Von vorn» löschen und Reisen
  überspringbar.
- **PLAN.md 0:** Stand vom 30.10. (02–06 fertig, 07 und 09 in Arbeit, 08 offen), offene Punkte ausserhalb der Spec
  (eigene Skybox «Im Dorf», Würfel als Teil 2, Zwischenszenen in einer Welt), Entscheide vom 30.10., Vorrat unter 0.2,
  Platzhalter und Ticket 09 unter 0.3. Nicht auf «erledigt» gesetzt.
- **Offen für den Code-Teil von 08:**
  - «Im Dorf» in `CONTEXT.md` nach dem fertigen Ticket 07 gegenlesen (Kopfzeile, Name der Knöpfe, Code-Namen wie
    `STORY_DORF`/`story.inDorf` erst nach dem Einbau nennen; «Überspringen» beim Einstieg mit dem gebauten Knopf und Esc
    abgleichen).
  - Eintrag «Reihe» unter «Abgelöst» erst nachführen, wenn Levelliste, KI-Tester und Golden-Test umgestellt oder
    entfernt sind; «Platzhalter» erst nach dem Einbau von 09 als abgelöst markieren.
  - Im Code «Reise» nur für `story.travel`, Kommentare um `story.steps` auf «Durchgang» (dann den Hinweis «im Code
    steht dafür noch …» unter Durchgang streichen).
  - `SPEC.md` und `3D-WUERFEL.md` erwähnen noch Levelauswahl und Hintergrund-Umschalten (Hinweis aus 04).
  - PLAN.md 0 nach der Abnahme auf erledigt setzen; Checkbox «`CONTEXT.md` … ADR» erst dann abhaken, wenn «Im Dorf»
    nach 07 gegengelesen ist.
