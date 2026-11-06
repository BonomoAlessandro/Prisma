# Stand «Ein Brett je Himmel» – Übergabe

Stand 06.11.2026 nachmittags, Branch `feature/brett-je-himmel` (gepusht). Diese Notiz ist für das Weiterarbeiten auf
einem anderen Rechner gedacht. Entscheide und Begründungen stehen in `spec.md` und in den Tickets unter `issues/`, je
unter «Comments».

## Fertig

| Ticket | Was | Commit |
|---|---|---|
| 01 | Brett-Angabe im Register, Steinbrett als Art, Kernquader, `__prisma.brett()`, Glossar | eacc5db |
| 02 | Das Brett wechselt mit dem Himmel: bereit, halten, überblenden, Notfall nur bei echtem Warten | d48d4b1 |
| 03 | Katalog Strand, gewählt: Gezeitenbecken | b2083c4 |
| 04 | **Gezeitenbecken** (Art `tidePool`) mit Lichtwelle **Brandung** am Strand | d02bac7, Merge ba55cb6 |
| 06 | **Lehmterrasse** (Art `clay`) mit Lichtwelle **Sandverwehung** in der Wüste | 90d6b30, Merge 97c1da1 |

Nach dem Merge von 06 liefen auf dem gemeinsamen Stand: Logik 2041, KI-Tester 84, Offline-Probe, Geschichte-Probe
`--grad leicht --welten 3`, `brett-probe` mit allen Teilen (die wackelige Lücken-Prüfung «Brett laden und überblenden»
dabei 79 ms, grün).

## Entscheide des Nutzers für die übrigen Bretter

Alle fünf Bretter und ihre Lichtwellen sind gewählt. Kataloge und Vorlagen stehen im Branch.

| Welt | Brett | Lichtwelle | Katalog | Vorlage (Skript zur Laufzeit) |
|---|---|---|---|---|
| Dorf (08) | Hochbeet | Sämlinge keimen neben den Schnüren, Glühwürmchen steigen auf (Katalog Version 2) | https://claude.ai/artifact/6tyN2oGW1VJRwVB3CXNTEG | `katalog-dorf/bretter/varianten-dorf/4-hochbeet.js` |
| Bergwald (07) | Moospolster | weisse Blumen blühen auf und welken, Pilze leuchten | https://claude.ai/artifact/NxHnBEMttQfErbf32u96zJ | `katalog-wald/bretter/varianten-wald/2-moos.js` |
| Vulkan (09) | Basaltsäulen | Säulen heben sich eine Handbreit, Flanken glühen, Glut in den Fugen (Version 2) | https://claude.ai/artifact/M9QffoMkGcgwSn2geoCjWv | `katalog-vulkan/bretter/varianten-vulkan/2-basalt.js` |

Für Instanzen die korrigierte `bretter.js` aus `katalog-vulkan/bretter/` nehmen (Weltposition in `withWave`). Die
Lichtwelle richtet sich nach der **Ankunft** des Rings, nicht nach seiner Stärke (die fällt bis zum Rand auf fast
nichts). Vorbilder dafür: `uShockT`/`shockClock` beim Gezeitenbecken, `uWave` bei der Lehmterrasse.

## Als Nächstes

1. **07 Moospolster und 08 Hochbeet** gleichzeitig, je in einem eigenen Worktree und Branch von `feature/brett-je-himmel`.
2. **09 Basaltsäulen und 05 Übergang** zwischen verschieden geformten Brettern (für alle Bretter, siehe Ticket 05).
3. **10 Schluss:** Schalter weg, ganze Geschichte auf Desktop und Handy-Ansicht, Messung über alle Welten, aktuelles
   `main` holen, Test des Nutzers auf dem Poco, Merge nach `main` nur auf sein Go.

## Arbeitsweise (vom Nutzer so gewünscht)

- **Höchstens zwei Tickets gleichzeitig**, je ein Worktree neben dem Repo (z. B. `../prisma-brett-07`) mit eigenem
  Branch (`feature/brett-07-wald`).
- Je Brett: Umsetzer baut, dann **Vorschauseite** (Artifact) mit Desktop 1440 × 900 und Handy 390 × 844, Spielansicht,
  flach, ganz herausgezoomt, Fall des Lichts beim Einstieg und die **Lichtwelle als Film in Echtzeit**, dazu Messwerte
  gegen das Steinbrett. Dann **anhalten**, der Nutzer gibt Rückmeldung. Erst nach seinem Okay: alle Tests, Haken,
  Notiz.
- Danach ein **unabhängiges Review** (Skill `mattpocock-skills:code-review`), Kleinigkeiten behebt der Reviewer selbst,
  Grundsätzliches wird Auflage. Committet wird erst nach dem Review, im Branch des Tickets, dann Merge in
  `feature/brett-je-himmel`.
- **Nie zwei Agenten in einem Worktree.** Ein Umsetzer ändert nach seinem Abschlussbericht nichts mehr, auch wenn ein
  anderer Agent ihm noch etwas schickt.
- **Schwere Läufe** (Chrome, Proben) nur über `LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 …`, im Vordergrund,
  nie zwei gleichzeitig. Chrome stumm (`--mute-audio`, steht in `tools/chrome.mjs`).
- **Bilder aufräumen:** Rohbilder, Kopien und `tests/output/` löschen, sobald sie sicher nicht mehr gebraucht werden.
  Nie `tools/blender/out/` (Rohdaten der Skyboxen).
- Commits ohne Zeilen, die ein KI-Werkzeug nennen. Gepusht wird nur, wenn der Nutzer es sagt.

## Zusammenführen: Fallen

- Beide Bretter fügen ihren Code an derselben Stelle ein (nach dem Steinbrett). Git verschachtelt die zwei Blöcke dann
  zu mehreren Konflikten. Besser: den eigenen Stand nehmen und den Block des anderen Tickets als Ganzes dahinter setzen
  (aus `git diff <basis> <branch>` die Einfügung ablesen).
- Konflikte gibt es sicher bei `const BOARD_TYPES = { … }` (eine Zeile, alle Arten), bei `BOARD_PARAMS` und im
  Kopfkommentar von `tools/sky-schema.mjs`, bei den Logiktests und bei `APP_VERSION` und `SKIES` in `sw.js`.
  `backgrounds/skies.js` danach mit `node tools/blender/pack.mjs --brett` nachführen, das setzt auch `SKIES`.
- `git show <commit>:index.html` liefert LF, die Arbeitskopie hat CRLF.

## Im Spiel ausprobieren

Das Spiel läuft direkt aus der Datei (Chrome):

- Strand: `file:///<pfad>/index.html?sky=beach`
- Wüste: `file:///<pfad>/index.html?sky=desert`
- Vergleich mit dem Steinbrett: `&brett=stone` anhängen. Ein Level lösen zeigt die Lichtwelle.

## Offene Punkte

- **Ticket 10 (Poco):**
  - In der Handy-Ansicht zeichnete das Gezeitenbecken weniger Bilder pro Sekunde als das Steinbrett, Ursache unklar.
  - Die Kosten der Lichtwellen auf einem echten Handy sind nicht gemessen.
  - Die Reise ans Meer ohne Vorladen auf dem Poco messen.
  - Die Texturdaten jedes Bretts bleiben im JS-Speicher, rund 12 MB je Brett.
- **Ticket 05:**
  - Beim Überblenden vom Steinbrett erscheinen eingezogene oder hängende Teile (Lehmwand, später Erdscholle,
    hängende Säulen) erst im letzten Bild.
  - Doppelter Code zum Zusammenziehen: das Überblenden in stone/tidePool/clay und `createClayTextures` neben
    `createStoneTextures`.
  - Wird ein Überblenden mittendrin umgelenkt, springt ein Teil des alten Bretts weg.
  - Das Notfall-Steinbrett erscheint ohne Einblenden.
- **Ticket 10 (Aufräumen):**
  - Der Schalter `?brett=` muss weg.
  - Das Brett lässt sich über `__prismaDebug` umstellen; bedenken.
  - Gehören die Namen der Bretter ins Glossar? Danach den KI-Tester-Test laufen lassen.
- **Sonst:**
  - Die Türmchen der Lehmterrasse werfen keinen Schatten.
  - `dispose` beendet einen noch rechnenden Worker nicht.
  - `FLOOR_DETAIL_GLSL.replace('float iw = 0.011;', …)` in der Lehmterrasse greift nicht mehr, falls sich die Zeile beim
    Steinbrett ändert.
  - `BOARD_FIELD` 4,2 und `BOARD_PLATE` 4,9 stehen in `tools/sky-schema.mjs` von Hand.
  - `brett-probe` liest teils Interna.
  - Die Lücken-Prüfung «Brett laden und überblenden» ist wackelig (Ursache: Das Wasser des Strands rechnet beim ersten
    Bild des Panoramas `groundShift`, zu lange Häppchen). Das liegt am Strand-Himmel, nicht am Brett.
- **Andere Branches:** Der Kleine Wagen (PLAN 0.4) läuft auf `feature/kleiner-wagen`, auf einem anderen Rechner. `main`
  steht auf 504adbb (mit dem neuen Vulkan-Krater).
