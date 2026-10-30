## Laufende Arbeit

Noas Geschichte (Branch `feature/lichtsignal-prototyp`): Stand, nächste Schritte und Arbeitsweise stehen in
`.scratch/noa-geschichte/STAND.md` – zuerst lesen. Antworten auf Deutsch (Schweizer Schreibweise), Commits ohne
Hinweis auf Claude, schwere Prozesse nur über `LEISE_CPU=50 sh tools/leise.sh`, kein Push und kein Merge nach `main`
ohne Auftrag des Nutzers.

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels, recorded as a `Status:` line in each issue file: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
