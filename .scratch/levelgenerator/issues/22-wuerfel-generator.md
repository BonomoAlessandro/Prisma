# 22: Würfel-Branch: Generator im Würfel

**What to build:** Auf dem Branch `feature/3d-wuerfel` erzeugt der neue Generator auch Würfel-Level. Damit ist die
Feldform an echten Würfeln geprüft. Würfel-Level kommen nicht ins Spiel.

**Spec:** ../spec.md, Abschnitt „Würfel“.

**Blocked by:** 14 (Würfel-Branch: Beurteilung im Würfel), 21 (Alte Werkzeuge abbauen)

**Status:** ready-for-agent

- [ ] main ist erneut in den Branch übernommen, und alle Tests sind grün.
- [ ] Die Tests des Generators laufen zusätzlich mit der Würfel-Feldform. Ein Auftrag für einen kleinen Würfel liefert
      ein eindeutig lösbares Würfel-Level, das die Beurteilung besteht.
- [ ] Fehlt der Feldform auf main etwas, wird es dort mit eigenem Commit nachgezogen.
- [ ] Kein Würfel-Level kommt ins Spiel.

## Comments

**Hinweis aus Ticket 18 (Generator):**
- Der Generator braucht von der Feldform zusätzlich `element(zelle, angaben)` (Leveldaten eines Elements in einer
  Zelle) und `rahmen` (Angaben der Leveldaten, die das Feld festlegen, im Würfel etwa `{ dim: 3, size }`). Die flache
  Feldform hat sie seit Ticket 18, die Würfel-Feldform braucht sie auch.
- Quellen entstehen über `quelleStatt` aus einem Kombinator, der in die gewünschte Richtung abgibt (`ausgang`). Mit
  der Standardachse y gibt es so nur Richtungen der Ebene; für andere Achsen müsste `element` eine Achse wählen.
- Die flache Feldform hält die Nachbarn in einer Tabelle, und `feldformVon` legt sie je Grösse einmal an: Das
  Spielermodell fragt die Nachbarn in jeder Beurteilung zehntausendfach ab (vorher 40 % der Zeit des Generators). Die
  Würfel-Feldform profitiert ebenso.
- `tests/generator.test.mjs` sucht im Quelltext des Generators nach `.x` und `.z`; für den Würfel gehört `.y`
  dazu.

**Vorbereitung durch den Koordinator (18.10.2026, Entscheid des Nutzers):**
- Ticket 27 (ein Durchlauf der Strahlregel) ist in `feature/3d-wuerfel` übernommen, als Fast-Forward auf `7524457`.
- Vier alte Commits des Würfel-Branches trugen die Zeile „Co-Authored-By: Claude“. Der Branch ist ohne diese Zeilen
  neu geschrieben und per Force-Push ersetzt (vorher `cf636c6`, jetzt `7524457`). Dateistände, Autoren und Daten aller
  Commits sind gleich, und die Elternteile aus `feature/levelgenerator` sind unverändert. Der alte Stand liegt lokal
  unter `backup/3d-wuerfel-vor-bereinigung` und `backup/ticket-27-vor-bereinigung`.
- Neue Hashes für Verweise in Tickets und Notizen (die ersten vier Commits des Branches sind unverändert):

  | alt | neu | Commit |
  |---|---|---|
  | `cfeda0b` | `02a0841` | feat(3d): Elemente im Würfel mit Ring und Achszapfen statt Sockel |
  | `e4e459d` | `06f4a7f` | fix(3d): Zellen mittig im Würfel, Ringe der untersten Ebene über der Platte |
  | `9591678` | `87b77d0` | feat(levelauswahl): Umschalter Fläche (2D) / Würfel (3D) |
  | `f4e0e48` | `4ddd294` | refactor(3d): Ebenenwahl im Würfel entfernt |
  | `16c52b7` | `65e8f01` | feat(3d): Siegesanimation im Würfel |
  | `1771c24` | `19fd4e9` | merge: feature/levelgenerator in den Würfel-Branch (Ticket 14, Stufe A) |
  | `2e32eec` | `e5461fe` | refactor(beurteilung): Feldform kennt die Wirkung der Elemente |
  | `1ca9954` | `7003202` | feat(3d): Beurteilung mit Würfel-Leveln (Würfel-Feldform) |
  | `9e8c889` | `548ac73` | fix(beurteilung): Drehungen drehen auch Elemente ohne Richtung oder Stellung |
  | `cf636c6` | `1c93d52` | docs(3d): Würfel-Feldform im README, Test für Elemente ohne Angaben (Review Ticket 14) |
  | `bcdfb1f` | `08d1c1b` | refactor(logik): Ein Durchlauf der Strahlregel für flache Level und Würfel |
  | `69ff89d` | `c83086e` | docs(3d): Ticket 27 erledigt |
  | `8f8d8f0` | `304564a` | fix(logik): Ungültige Richtung im Würfel meldet auch die Spiegelregel … (Review Ticket 27) |
  | `9c974d3` | `7524457` | docs(3d): Review Ticket 27, keine offenen Funde |

**Stand am Abend des 18.10.2026** (Pause über Nacht auf Wunsch des Nutzers; Branch `ticket/22-wuerfel-generator` im
Worktree `.claude/worktrees/agent-ae7764404a8e6fa32`, nicht gepusht). Es läuft nichts mehr.
- **Erledigt:**
  - Merge von `feature/levelgenerator` (`3a9d8d2`) in den Branch (`5a36b8d`). Konflikte in `index.html` (Würfel-Level
    hinter `LEVELS` mit `CUBE_START`, dazu die Grade aus Ticket 17 statt `DIFFICULTY`), `feldform.mjs`,
    `feldform.test.mjs` und README, je beide Seiten. Die Strahlregel ist die des Branches: Auf
    `feature/levelgenerator` hat sich dort seit `2e05bae` nur ein Kommentar geändert. Der LEVELS-Block ist genau der von
    `feature/levelgenerator`, `LEVELS_3D` genau der des Branches. `levelliste.test.mjs` gibt dem Code, den es aus
    `index.html` liest, `CUBE_START` mit.
  - Danach grün: golden und `--voll` (ohne `--write`), logic 567, beurteilung 201, generator 28, levelliste 37,
    ki-tester 64, offline; Proben im Browser: Interaktion, Klicks im Würfel, Kern gelöst („Ziele 3 / 3“),
    Levelauswahl, je ohne Konsolenmeldung.
  - Der Feldform fehlte, ein Element mit einer anderen Drehachse als y zu setzen. Nachgezogen auf
    `ticket/22-feldform` (von `feature/levelgenerator`, `8ca2c64`): `drehachsen` und `element` mit `drehachse`; der
    Generator setzt drehbare Elemente, feste Spiegel und Quellen mit jeder Drehachse. Flache Level bitgleich: alle 28
    Aufträge, 10 610 Seeds, Ergebnis und Strahlverfolgungen gleich wie `3a9d8d2`. Dort alle Tests grün. In den Branch
    gemergt (`2f35f6e`).
  - Würfel-Feldform mit `element`, `rahmen`, Drehachsen, Nachbartabelle, je Grösse eingefroren; Generator-Test mit fünf
    Aufträgen im Würfel 4 × 4 × 4 (`696cee7`). Ein Auftrag „leicht“ im Würfel 4 × 4 × 4 liefert eindeutig lösbare
    Level, die die Beurteilung bestehen, mit Licht zwischen den Ebenen (Seeds 1–100: 90 Level). Alle Tests grün:
    generator 29, beurteilung 205, übrige wie oben.
- **Rot oder offen:**
  - Der Generator-Test brauchte mit den Würfel-Aufträgen 112,7 s statt 72 s, das Ziel sind etwa 90 s. Der Rechner war
    dabei langsamer (beurteilung 107 statt 90 s); der Vergleich abwechselnd mit und ohne Würfel-Aufträge in einem Lauf
    steht noch aus. Reicht es nicht, werden die Würfel-Aufträge kleiner.
  - README und `3D-WUERFEL.md` sind nachgeführt (dieser Commit), die Notiz „Umgesetzt“ fehlt noch.
- **Als Nächstes:** Laufzeit des Generator-Tests messen, Beispiel-Level für die Notiz, Notiz „Umgesetzt“ mit
  Auslegungen (Knäuel im Raum, Drehungen bei Prismen mit waagrechter Achse, Bausteine in kleinen Feldern), Haken und
  Status.
