## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels, recorded as a `Status:` line in each issue file: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Prüfläufe

Schwere Läufe über `tools/leise.sh` mit Zeitgrenze. Läufe ohne Zeitmessung (Node-Tests, Golden, Bildvergleich,
`brett-probe`, `offline`, `screenshot`, Werkzeuge) als leichte (`LEISE_ART=leicht`, bis zu vier gleichzeitig), Proben
mit Bildzeiten oder Messungen allein (ohne `LEISE_ART`); Tabelle im README, Abschnitt Tests.
- Umsetzer: nur die schnellen Prüfungen (Node-Tests, Golden, Bildvergleich auf der Grafikkarte mit `--gpu`) und die
  Proben, die ihr Ticket direkt betrifft. Der Reviewer lässt den ganzen Satz einmal laufen, den Bildvergleich in
  SwiftShader (ohne `--gpu`), die Proben mit Zeitmessung nur er.
- Nach einem Treiberupdate (oder neuem Chrome) die GPU-Referenzen (`referenz-gpu/`) erst mit `--gpu --write` neu
  schreiben, wenn der Bildvergleich in SwiftShader grün ist.
- Wackelt ein paralleler Lauf (Zeitüberschreitung, Flake), als alleinigen wiederholen (Bildvergleich mit `--jobs 1`).
- Proben mit Bildtakt: Eine einzelne Lücke über 100 ms kommt auf diesem Rechner schon auf der Basis vor. Dann
  wiederholen bzw. mit der Basis vergleichen; es zählt nur ein Fehler, der auf der Basis nicht kommt.

## Laufendes Vorhaben

PLAN 3a «Umbau für die Stores» (`feature/umbau`): Spec und Tickets in `.scratch/umbau/`, vor dem Weitermachen lesen.
`main` mit «Energie auf dem Handy» ist seit 16.11.2026 hineingeholt; als Nächstes Ticket 01. Zuletzt abgeschlossen:
«Energie auf dem Handy» (16.11.2026 nach `main`: Ruhe-Bildrate 30, Spiegelung nur im All, −50 % Strom auf dem Poco;
`.scratch/energie/`); davor PLAN 1a.3 «Tutorial neu» (15.11.2026 nach `main`, Übergabe in
`.scratch/tutorial-neu/STAND.md`; offen nur der Test mit einer fremden Person); davor PLAN 1a.1 «Führung im Dorf» (10.11.2026 nach `main`, Übergabe in
`.scratch/tutorial-fuehrung/STAND.md`); davor PLAN 1.1 «Ein Brett je Himmel» (`.scratch/brett-je-himmel/STAND.md`).
