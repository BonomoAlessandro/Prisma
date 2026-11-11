# Stand «Ein Brett je Himmel» – Übergabe

Stand 08.11.2026 nachmittags, Branch `feature/brett-je-himmel` (seit dem 06.11. nicht gepusht, Ticket 10 gemergt,
cc31f9c); Ticket 11 im Worktree `prisma-brett-11`, Branch `feature/brett-11-vorzeichnen` (von 122d6f7). Diese Notiz ist für das Weiterarbeiten auf
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
| 08 | **Hochbeet** (Art `raisedBed`) mit Sämlingen und Glühwürmchen im Dorf | Merge 9c514ed |
| 07 | **Moospolster** (Art `moss`) mit Lichtwelle Waldgott im Bergwald | Merge 62c99e6 |
| 05 | **Übergang** für alle Arten an einer Stelle (`boardBlend`): das neue Brett wächst von der Mitte, undurchsichtig, umgelenkt ohne Sprung, Notfall wächst ein; Ziel der Fische beim Aufwärmen | Merge 1037af7 |
| 09 | **Basaltsäulen** (Art `basalt`) mit Lichtwelle Version 2 im Vulkan, auf `boardBlend`; Hülle −2,9 m; `boardBlendN` nimmt die Kamera aus `viewMatrix` (Lambert hat kein `cameraPosition`) | Merge 2ae2be4 |
| 10 | **Schluss** bis vor den Poco-Test: `?brett=` und Leiste `?bretter` entfernt, Logiktest «feste Bretter», ganze Prüfung, Messung über alle Welten, Doku | ea3b7b8 und folgende, Merge cc31f9c |
| 11 | **Himmel unsichtbar vorzeichnen:** Die Lücke im ersten Bild eines neuen Panoramas kam vom Freigeben des alten (bis 300 MB auf einmal). Jetzt Vorrat für Texturen der Himmel (`skyTexPool`), Streifen in einer Höhe (`BAND_HOEHE`), Freigeben an stillen Bildern (`freigabe`), einmal unsichtbar vorzeichnen in voller Grösse (`skyTheme.vorzeichnen`), Protokoll der Arbeit (`arbeit`, `ARBEIT` in der Geschichte-Probe) | `feature/brett-11-vorzeichnen` |

Nach dem Merge von 09 (08.11.) lief der ganze Satz auf dem gemeinsamen Stand: alle Node-Tests (Logik 2044, Generator über
`leise.sh`), Offline, `brett-probe` (100 ok, `formen` 30 Übergänge aller sechs Arten ohne leeres Pixel), Geschichte-Probe
`--grad leicht --welten 5` Desktop und Handy, `--dorf`, `--uebersicht`, `--grenzen --handy` grün. Rot nur `--wagen`
(«Wiederholen über die Grenze ins Meer» 150 ms) und `--grenzen` (Wüste → Vulkan 150 ms), beide im ersten Bild des
neuen Panoramas (w ≈ 0,04), wie auf den Basen vor 05 und 09 (Streuung, siehe Reviews 05 und 09).

Ticket 10 (08.11., Zahlen im Ticket): Node-Tests alle grün (Logik 2045), Offline grün, `--ganz` Desktop und Handy
grün, `--menue` grün. Rot nur an bekannten Stellen: `--dorf`, `--wagen`, `--grenzen` am Desktop, `--uebersicht` auf
dem Handy; die jeweils andere Ansicht grün. `brett-probe` 99/100 (1 Pixel mit dem Moospolster, flach). Leistung headless: Strand
+1,5 ms, Vulkan +2,3 ms je Bild am Desktop, sonst Streuung; vorab gespeichert 4,15 von 4,5 MB.

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

1. **Ticket 11 (Himmel unsichtbar vorzeichnen):** fertig, reviewt mit Nachprüfung (Naht behoben), am 08.11. in
   `feature/brett-je-himmel` gemergt (08d3ec9) und gepusht.
1. **Poco-Test des Nutzers** (Ticket 10 und 11): am 09.11. auf `2026-11-08 himmel-vorzeichnen` (7b858e9), «alles
   sieht super aus», keine Befunde.
1. **Merge nach `main`:** am 09.11. auf Go des Nutzers gemergt und gepusht (9c853da). PLAN 1.1 ist abgeschlossen.
2. **Antworten des Nutzers (08.11.):** Das Wachsen von der Mitte bleibt. Die Ruckler an den Weltgrenzen hat der Nutzer im
   manuellen Test nicht bemerkt: Das Ziel der Fische behält MSAA. Die Probe `formen` bleibt. Basaltsäulen gefallen,
   die +1,7 ms merkt der Nutzer nicht: so lassen.
3. Ticket 10 ist reviewt und in `feature/brett-je-himmel` gemergt (cc31f9c). Nach `main` nur auf sein Go (`main`
   96d6538 ist schon drin, vor dem Merge noch einmal fetchen).

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
- Ebenso `forest`, `village`, `volcano`; das Steinbrett zeigen `?sky=milky` und `?sky=solar`. Ein Level lösen zeigt die
  Lichtwelle. Einen Schalter für das Brett gibt es nicht mehr (Ticket 10).

## Offene Punkte

- **Ticket 10 (Poco):**
  - In der Handy-Ansicht zeichnete das Gezeitenbecken weniger Bilder pro Sekunde als das Steinbrett, Ursache unklar.
  - Die Kosten der Lichtwellen auf einem echten Handy sind nicht gemessen.
  - Die Reise ans Meer ohne Vorladen auf dem Poco messen.
  - Die Texturdaten jedes Bretts bleiben im JS-Speicher, rund 12 MB je Brett.
- **Weltgrenzen** (Ticket 11, erledigt): Die 100–150 ms im ersten Bild eines neuen Panoramas kamen vom Freigeben des
  alten (bis 300 MB auf einmal am Desktop). Jetzt Vorrat für Texturen, Freigeben an stillen Bildern, Vorzeichnen.
- **Streifen am Desktop** (Ticket 11, erledigt): Das erste Schreiben in Streifen einer neuen Grösse hielt den
  Grafikprozess einmal je Welt 105–142 ms an. Jetzt liegen alle Streifen in 4096 × 4096 (`BAND_HOEHE`, Shader `uKl`),
  der Vorrat nimmt sie. Rund 10–20 % mehr Grafikspeicher für die Streifen am Desktop.
- **Present von Chrome headless** (Ticket 11): Die Lücken beim Öffnen und Schliessen der Übersicht auf dem Handy (bis
  424 ms) sind ein hängendes `DXGISwapChainImageBacking::Present` im Grafikprozess, auf allen Ständen, ohne Arbeit des
  Spiels im Bild; auf dem Poco ansehen.
- **Basalt:** +1,7 ms GPU am Desktop in Ruhe (+2,2 ms in der Welle), vermutlich `discard` über die ganze Oberfläche
  (kein früher Tiefentest für die Säulen darunter); Abhilfe: inneres Quadrat ohne `discard` plus Ring, oder kürzere
  Säulen. Hauptthread-Bau 8,8 / 11,9 ms (Desktop / Handy gedrosselt).
- **`brett-probe formen`** meldete zweimal in vielen Läufen 1 leeres Pixel (Hochbeet → Stein, Moos → Lehm, flach);
  vermutlich ein Riss in der Rasterung an einer Naht, Ursache offen. Seit «Hochbeet im Mondlicht» und den Kühen im Dorf
  (10.11.2026, `feature/dorf-mond-kuehe`) in jedem Lauf 1–2 Übergänge mit je 1 Pixel (4 von 4 Läufen; verschiedene
  Übergänge, z. B. Hochbeet → Stein umgelenkt, tidePool → raisedBed flach-heraus, clay → moss flach). Auf 700edfa
  3 von 3 Läufen ohne. Auch ohne das Mondlicht des Hochbeets trat es auf (1 Lauf: clay → moss), also nicht dessen
  Shader. Form und Zufall der Bretter hängen nicht von den Werten ab (feste Seeds). Im Spiel nicht zu sehen (1 Pixel
  im Bild der Probe, 320 × 200, ein Bild lang).
- `--uebersicht`: Öffnen und Schliessen zeitweise über 100 ms, auf allen Ständen: Present von Chrome headless (Ticket 11).
- `--dorf`: «Übung 8 wiederholen» und «Prolog überspringen» zeitweise über 100 ms, schon auf den Basen: dieselbe Ursache
  wie an den Weltgrenzen (Freigeben des alten Panoramas), seit Ticket 11 behoben.
- **Ticket 10 (Aufräumen), erledigt:** Leiste `?bretter` und Schalter `?brett=` sind weg. `__prismaDebug.boardTheme`
  bleibt: Es ist die Testschnittstelle für Proben (`brett-probe` setzt dort eigene Arten und Brett-Angaben), wie
  `skyTheme` und die übrigen Interna, und kein Weg für Spieler. Die Namen der Bretter stehen im Glossar unter «Brett»
  (Abschnitt «Auf dem Feld», nicht Teil des Fingerabdrucks der KI-Tester; KI-Tester-Test grün).
- **Sonst:**
  - Die Pyramiden auf den Ecken der Lehmterrasse (seit 10.11.2026 statt der Türmchen, PLAN 1.6) werfen keinen Schatten.
  - `dispose` beendet einen noch rechnenden Worker nicht.
  - `FLOOR_DETAIL_GLSL.replace('float iw = 0.011;', …)` in der Lehmterrasse greift nicht mehr, falls sich die Zeile beim
    Steinbrett ändert.
  - `BOARD_FIELD` 4,2 und `BOARD_PLATE` 4,9 stehen in `tools/sky-schema.mjs` von Hand.
  - `brett-probe` liest teils Interna.
  - Die Lücken-Prüfung «Brett laden und überblenden» ist wackelig (Ursache: Das Wasser des Strands rechnet beim ersten
    Bild des Panoramas `groundShift`, zu lange Häppchen). Das liegt am Strand-Himmel, nicht am Brett.
- **main geholt (07.11.2026, Merge 8a424b2):** Der Kleine Wagen (PLAN 0.4) ist im Branch. Auf der Reise in eine neue
  Welt gilt der Flug des Kleinen Wagens, das Licht wartet aber wie bisher auf Himmel und Brett (`skyTheme.settled`). Bei
  jeder Ankunft hält das Licht an und wartet auf Tippen; `brett-probe` tippt dafür auf der Reise ans Meer.
- **Vor Ticket 10** macht der Nutzer einen manuellen Test (Wunsch vom 07.11.2026); erst danach beginnt 10.
