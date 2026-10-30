# Stand und Übergabe: Noas Geschichte

Stand: 30.10.2026, nach Ticket 06. Geschrieben, damit auf einem anderen Rechner (anderer Claude, ohne die lokale
Erinnerung dieses Rechners) nahtlos weitergearbeitet werden kann. Bei jedem grösseren Schritt nachführen.

Spec: `spec.md` (Entscheide 1–28). Tickets: `issues/NN-*.md`, je mit Bericht, Entscheiden und Hinweisen unter
`## Comments` – vor jedem Ticket ganz lesen. Begriffe: `CONTEXT.md`, Entscheid: `docs/adr/0005-…`.

## Branches

- **`feature/lichtsignal-prototyp`** – die Hauptarbeit (Tickets 02–06, Doku, Bausteine). Hier geht es weiter.
- **`feature/noa-09-wahl`** – nur der Werkzeug-Teil von Ticket 09 (neue Wahl für «sehr schwer», Namen, Tests), von
  `feature/lichtsignal-prototyp` bei 63c44b7 abgezweigt. **Noch nicht gemergt**: Die neue Wahl passt erst zu
  `index.html`, wenn der Einbau läuft (Test «Spiel = Wahl» ist im Branch bis dahin absichtlich rot). Mergen erst beim
  Einbau von Ticket 09 (siehe unten).
- **`main`** bleibt unberührt. **Nach `main` wird erst gemergt, wenn der Nutzer es sagt.** Gepusht wird nur auf
  Auftrag des Nutzers.

## Erledigt

| Ticket | Inhalt | Commit |
|---|---|---|
| 01 | 15 neue sehr schwere Level (beurteilt) | vor a13a1df |
| 02 | Vorrat (`tools/vorrat/`, `tools/vorrat.mjs`) und gemeinsamer Lader (`tools/lader.mjs`) | da610b1 |
| 03 | Wahl der 240 Level, Titel der Welten (`tools/geschichte.mjs`, `tools/geschichte/wahl.json`, `titel.json`) | 434ff83 |
| 04 | Das Spiel ist die Geschichte je Grad (Datenblock `STORY_LEVELS`, Speicherstand `prisma.noa.*`) | 7558f36 |
| 05 | Menü «Lichtwege zum Polarstern», Knopf «Menü», «Zum Menü» nach dem Epilog | bb27929 |
| 06 | Übersicht mit Bestwerten, Wiederholen | 7b0d0b5 |
| 08 (Teil) | `CONTEXT.md` (Begriffe), ADR 0005 | 35142ee |
| 09 (Teil) | Analyse, Pools von Ticket 01 nachgebaut, 35 Kandidaten versioniert (`tools/geschichte/sehr-schwer-kandidaten.json`), Entscheid «nach Bewertung» | 1c860aa, 12b43aa, 63c44b7 |
| 09 (Werkzeug) | Neue Wahl «sehr schwer»: 23 Kandidaten rein (Sternnamen Albireo … Mirfak), 23 Platzhalter raus, 0 Verstösse, Gefühl im Mittel 4,19 statt 3,87; Schrittfolge für den Einbau | 9e9708a auf `feature/noa-09-wahl` |

## Als Nächstes, in dieser Reihenfolge

1. **Ticket 07 «Im Dorf»** (`issues/07-im-dorf.md`): Texte, Einbauplan und alle Entscheide stehen unter Comments
   (Angebot nach dem Prolog, auch nach «Überspringen»; Dorf ohne Träger; **Einstiege in die Welten überspringbar**,
   Entscheid 10; **Reisen bleiben nicht überspringbar**, Entscheid 28). Offene Punkte aus Ticket 06 für 07 stehen im
   Bericht von 06 (`playFromOverview` für das Dorf, Knopf «Übersicht» im Dorf, Bestwerte der Übungen).
2. **Ticket 09, Einbau** (`issues/09-sehr-schwer-vielfalt.md`): `feature/noa-09-wahl` in
   `feature/lichtsignal-prototyp` mergen (die genaue Schrittfolge und das Ergebnis der Probe an einer Kopie stehen
   unter Comments in Ticket 09 **auf dem Branch `feature/noa-09-wahl`**), dann diese Schritte (u. a.
   `node tools/geschichte.mjs spiel`, ggf. `ordne-level.mjs --ausbau`, `tests/golden.mjs --write`), Tests anpassen,
   Probe einer Welt in «sehr schwer», Review. Darf auch vor 07 laufen, aber **nie gleichzeitig** mit einer anderen Arbeit an `index.html`.
3. **Ticket 08, Aufräumen und Abnahme** (`issues/08-aufraeumen-und-abnahme.md`): Comments enthalten die gesammelten
   Punkte (Vorwärmen des Menü-Filters und der Prolog-Bühne, «Menü»/«Neu starten» während Reise und Finale, Begriffe
   «Reise»/«Durchgang», «Wiederholen», «Bestwerte», «Im Dorf», ADR 0001 verweisen, Würfel als Teil 2). Danach ist der
   Stand bereit für den Merge, den der Nutzer auslöst.

## Arbeitsweise (vom Nutzer so gewünscht)

- Antworten auf **Deutsch, Schweizer Schreibweise** (ss statt ß).
- **Commits ohne Hinweis auf Claude/KI** (keine «Co-Authored-By»- oder «Generated with»-Zeilen).
- Je Ticket: Umsetzer-Agent → **Review** (bewährt: zwei Reviewer parallel, einer für Code und Tests, einer fürs
  Spielerlebnis im Browser mit Bildzeiten) → kleine Nachbesserungen → Commit. Dann gleich das nächste Ticket.
- Parallel arbeiten, wo es nicht kollidiert (Bausteine, Doku, Pläne, Werkzeuge in eigenem Worktree) – **nie zwei
  Agenten zugleich in `index.html`**.
- **Schwere Prozesse** (Node-Tests, Chrome, Generator) nur über `LEISE_CPU=50 sh tools/leise.sh <befehl>`, nie
  parallel; Zeitrahmen **innerhalb** von leise (`sh tools/leise.sh timeout -k 30 900 node …`), damit Warten auf die
  Sperre nicht zählt. Fremde Prozesse nie beenden, ohne den Nutzer zu fragen.
- **Handy-Proben** in headless Chrome nur mit echten Touch-Ereignissen (`Input.dispatchTouchEvent`); Mausereignisse
  bleiben mit der Touch-Emulation hängen.
- Nach Änderungen an `CONTEXT.md` immer `tests/ki-tester.test.mjs` laufen lassen: Der Abschnitt «Was Spass macht»
  gehört zum Fingerabdruck der KI-Tester.
- Gestaltungsfragen: breit streuen, Vorschauen zeigen, den Nutzer wählen lassen. Ruckelfreiheit der Zwischenszenen
  ist dem Nutzer wichtig – Bildzeiten (rAF-Lücken) messen, neue Lücken über ~100 ms vermeiden.
- Ausliefern (Render): Build-Befehl listet Dateien einzeln; neue Dateien, die das Spiel braucht, dort nachtragen
  (betrifft erst den Merge nach `main`).

## Proben und Werkzeuge

- `tests/geschichte-probe.mjs` (Flags u. a. `--menue`, `--uebersicht`, `--finale <grad>`, `--grad <grad>`, `--welten n`,
  `--handy`, `--quer`, `--start`): Ablauf im Browser mit Bildern unter `tests/output/geschichte/` und Bildzeiten.
- Alle Tests: Liste im `README.md` (Strahlregel, Golden, Vorrat, Levelliste, Würfelliste, KI-Tester, Beurteilung,
  Geschichte, Generator, Offline, Bedienung, `shots.mjs`).
- `tools/geschichte.mjs wahl | titel | spiel [--trocken]`, `tools/vorrat.mjs liste | ablegen | zurueckholen`.
- Testschnittstelle im Spiel: `window.__prismaDebug` (nur Konsole; kein Überspringen für Spieler, Entscheid 21).
- Auf `feature/noa-09-wahl` sind drei Tests in `tests/geschichte.test.mjs` («Wahl im Spiel», markiert
  `ROT_BIS_EINBAU`) absichtlich rot, bis der Einbau läuft; nach dem Einbau anpassen: `tests/vorrat.test.mjs` (auch die
  benannten Kandidaten zulassen), `tests/golden.json` (`--write`), Zahlen in README und Testkopf (275 → 298 im Vorrat,
  515 → 538 flache Level), Markierung `ROT_BIS_EINBAU` streichen – Details in Ticket 09 auf dem Branch.
- Ein frischer Windows-Checkout (`core.autocrlf`) liefert `index.html` und den Vorrat mit CRLF; die Werkzeuge kommen
  damit klar (Zeilenenden je Datei), der Titel-Test des Vorrats seit 503f68f auch.
- Nicht übertragen werden: Treiber und Messskripte der Reviews (lagen nur im lokalen Scratchpad) und
  `tests/output/` (nicht versioniert; die Pools aus Ticket 01 braucht es nicht mehr).
