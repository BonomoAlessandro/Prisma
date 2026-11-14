# Stand «Tutorial neu» – Übergabe

Stand 14.11.2026, Branch `feature/tutorial-neu` (von `main` ec02954). PLAN 1a.3. Spec und Tickets aus dem Grilling vom
14.11.2026. **Ticket 01 ist umgesetzt und reviewt** (Merge 85530ed, APP_VERSION `2026-11-14 tutorial-neu-1`) und wartet
auf den Poco-Test des Nutzers.

## Als Nächstes

1. ~~Ticket 01~~ fertig. Hinweise fürs Weitere im Ticket unter «Comments»: Band deckt quer und bei 360 × 640 die
   unterste Brettreihe (neue Bretter unten frei lassen), Text `NEBENBEI.neustart` passt hochkant nicht, Abdunkeln 0,46
   auf dem Poco beurteilen.
2. Bilder sind beim Nutzer, **er prüft auf dem Poco**. Ticket 02 erst nach seinem Okay.
3. Ticket 02, dann 03.

## Arbeitsweise (vom Nutzer so gewünscht, wie in 1a.1)

- Je Ticket ein Umsetzer, danach ein unabhängiges Review; Kleines behebt der Reviewer selbst.
- **Schwere Läufe** (Chrome, Proben) nur über `LEISE_MAX_CPU=100 LEISE_CPU=100 LEISE_VORRANG=4 sh tools/leise.sh
  timeout -k 30 900 …`, einzeln. Node-Tests dürfen in einer Sperre parallel laufen.
- Neues Rot zuerst gegen `ec02954` vergleichen; bekannte Lücken siehe `.scratch/tutorial-fuehrung/STAND.md`.
- Commits als AlessandroBonomo, ohne Zeilen, die ein KI-Werkzeug nennen. Gepusht wird nur, wenn der Nutzer es sagt.
- Merge nach `main` nur auf das Go des Nutzers.
- Aufräumen: `tests/output/`, Bilder, Chrome-Profile und temporäre Worktrees löschen, sobald sie nicht mehr gebraucht
  werden.
