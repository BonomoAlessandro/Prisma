# 10: Schluss: Schalter weg, ganze Prüfung, Poco, Merge

**Spec:** ../spec.md

**Blocked by:** 09

**Status:** fertig (09.11.2026 nach `main` gemergt)

**What to build:** Jede Welt hat jetzt ein festes Brett. Der Schalter für die Varianten verschwindet. Danach folgen die
ganze Geschichte als Prüfung, die Messung über alle Welten, der Test des Nutzers auf dem Poco und am Ende der Merge nach
`main`, auf das Go des Nutzers.

- [x] **Schalter entfernen:** Der Parameter in der Adresse für das Brett und aller Code für Varianten verschwinden. Kein
      Weg bleibt, ein Brett zu wählen, ausser über den Himmel (`?sky=` für Tests). Eine Suche im Code bestätigt das.
- [x] **Feste Bretter:** Die fünf Blender-Himmel haben ihre festen Bretter, Milchstrasse und Sonnensystem das
      Steinbrett. Ein Logiktest prüft, dass keine der fünf Brett-Angaben mehr `stone` ist.
- [x] **Ganze Geschichte:** Die Geschichte-Probe mit `--ganz` läuft auf dem Desktop und mit `--handy`, dazu `--dorf`,
      `--uebersicht` und `--menue`. Die Offline-Probe läuft, und alle Logiktests sind grün.
- [x] **Leistung über alle Welten:** Das Messwerkzeug misst auf dem Desktop und in der Handy-Ansicht. Die Werte stehen
      im Ticket, verglichen mit dem Stand vor Ticket 01. Die Grenze für alles vorab Gespeicherte (4,5 MB) wird
      eingehalten.
- [x] **main holen:** Der aktuelle `main` wird in den Branch geholt, zum Beispiel mit dem Kleinen Wagen vom anderen
      Rechner. Konflikte werden gelöst, und die Tests laufen danach noch einmal.
- [x] **Poco:** Der Nutzer testet auf dem Poco F4 GT. Seine Rückmeldung steht unter «Comments», Befunde werden behoben.
- [x] **Doku:**
      - PLAN 1.1 wird mit einer kurzen Zusammenfassung abgehakt.
      - Die Spec bekommt ihren Schlussstand.
      - Das Glossar wird geprüft: Stimmen «Brett» und «Steinbrett» noch?
- [x] **Merge (09.11.2026, 9c853da):** Der Merge nach `main` kommt erst auf das Go des Nutzers. Gepusht wird nur, wenn er es sagt.
- [x] Das Review nach dem Ticket ist gelaufen.

## Hinweise

- **Render:** Neue Dateien ausserhalb von `backgrounds/` müssen in den Build-Befehl auf Render und in `sw.js`. Ein Test
  prüft `sw.js`.
- Der Krater-Branch und der Kleine Wagen können `main` bis dahin verändert haben. Vor dem Holen fetchen.

## Comments

**Poco-Test des Nutzers (09.11.2026)** auf dem Stand mit Ticket 11 (`2026-11-08 himmel-vorzeichnen`, 7b858e9):
«alles sieht super aus». Keine Befunde, Lockerung der Lückenprüfung nicht nötig (Ticket 11 hat die Lücken behoben).

**Umsetzung bis vor den Poco-Test (08.11.2026, Worktree `prisma-brett-10`, Branch `feature/brett-10-schluss` von
`feature/brett-je-himmel` 3b909a3; Go des Nutzers nach seinem manuellen Test)**

- **Entfernt:** `?brett=` (`BOARD_URL` und die erste Zeile von `boardTheme.prepare`) und die Test-Leiste `?bretter`
  (Commits 698ec03, 4e6c170; der Block vor «Zugriff für Debugging/Tests»). Anderen Code für Varianten gab es seit
  Ticket 05 nicht mehr. Die Suche nach `BOARD_URL`, `brett=`, `bretter` und `get('brett')` in `index.html`, `sw.js`,
  `tests/`, `tools/` und `README.md` findet nichts mehr. Nur `.scratch` nennt sie noch, als Geschichte in den Tickets
  04–09. In `STAND.md` zeigt «Im Spiel ausprobieren» jetzt nur `?sky=`.
- **`__prismaDebug.boardTheme` bleibt:** Es gehört zur Testschnittstelle (nicht serialisiert, das Spiel ruft es nie auf),
  wie `skyTheme`, `scene` und `renderer`. `brett-probe` braucht dort `built`, `skies`, `free`, `prepare` und eigene Arten
  (`types`). Ein Spieler kann damit nichts wählen. Ein Brett zeigt im Spiel nur der Himmel, in Tests `?sky=`.
- **Feste Bretter:** Neuer Logiktest «feste Bretter». Er verlangt: Keiner der fünf Blender-Himmel hat das Steinbrett,
  keine zwei haben dieselbe Art, und Milchstrasse und Sonnensystem (`SKY_ENTRIES`, Liste `code`) haben keine
  Brett-Angabe.
- `APP_VERSION` ist `2026-11-08 brett-schluss` (`index.html`, `sw.js`). Es gibt keine neuen Dateien, das Register ist
  unverändert.
- **main:** Nach `git fetch` ist `origin/main` 96d6538. Das ist schon im Branch (Merge 8a424b2), es gibt nichts zu holen.
- **Glossar:** «Brett» nennt jetzt den Umriss als Grenze statt der Masse des Steinbretts. Dazu kommen die fünf Bretter
  mit ihren Arten (mit einem Hinweis auf das Hochbeet in Noas Garten im Himmel) und die eigene Lichtwelle. Die Masse
  stehen jetzt beim «Steinbrett». Der Abschnitt «Auf dem Feld» gehört nicht zum Fingerabdruck der KI-Tester, und der
  KI-Tester-Test ist grün (84).

**Tests (08.11.2026, Browser seriell über `leise.sh` mit GPU, stumm):**

- Node: Logik 2045, KI-Tester 84, Beurteilung 206, Geschichte 35, Levelliste 54, Würfelliste 20, Vorrat 18, Hall 6,
  Generator 31 (über `leise.sh`), alle grün.
- `offline.mjs`: bestanden. 32 Prüfungen, jeder Blender-Himmel ist online und offline erst mit seinem Brett bereit.
- `brett-probe.mjs`: 99 von 100.
  - Rot war `formen` Stein → Moos (flach) mit 1 leeren Pixel im Kernquader (von über 15 000).
  - Ein zweiter Lauf `--nur formen` zeigte wieder 1 Pixel, diesmal Moos → Lehm (flach, heraus). Das gab es schon zweimal
    in Ticket 05 und 09.
  - Beide Male war das Moospolster dabei, flach. Offen (siehe unten).
- Geschichte-Probe:
  - `--ganz` Desktop: bestanden. Längste Lücken: Reisen 34–50 ms, Finale 67 ms, sonst unter 35 ms.
  - `--ganz --handy`: bestanden. Reisen 33–50 ms, Finale 50 ms.
  - `--dorf` Desktop: rot. «Menü → Prolog → Überspringen» hatte 174 ms, beim Überspringen, das Brett des Walds war schon
    bereit. Das ist die bekannte Lücke, auf den Basen 19–189 ms (Review 05). «Übung 8 wiederholen» hatte diesmal 50 ms.
  - `--dorf --handy`: bestanden.
  - `--uebersicht` Desktop: bestanden (Öffnen 67, Schliessen 83, über die Weltgrenze 67 ms).
  - `--uebersicht --handy`: rot mit 101 ms beim Öffnen der Übersicht (bekannt, auf allen Ständen).
  - `--menue` Desktop und Handy: bestanden.
  - `--wagen` Desktop: rot. «Wiederholen über die Grenze ins Meer» hatte 100,3 ms. Im Bild davor: `shown` beach, w 0,07,
    Brett tidePool bereit, Anteil 0,53.
  - `--wagen --handy`: bestanden (50 ms).
  - `--grenzen` Desktop: rot. Wüste → Vulkan hatte 117 ms, im Bild davor `shown` volcano, w 0,04, Basalt bereit. Vulkan
    → Planeten hatte 50 ms. Die Prüfungen zum Brett sind grün (clay → basalt über 2,45 s, basalt → stone über 2,35 s).
  - `--grenzen --handy`: bestanden (67 / 50 ms).
  - Alle roten Läufe liegen an bekannten Stellen. Zwei sind im ersten Bild eines neuen Panoramas (Entscheid 08.11.,
    siehe unten). Die anderen beiden sind «Prolog überspringen» und das Öffnen der Übersicht, die schon auf den Basen
    streuen.

**Leistung über alle Welten**

- **Messung:** Messwerkzeug über `tests/leerlauf-probe.mjs --sky <himmel>`, Abschnitt «Ruhe»: erstes Level der
  Geschichte ohne Eingabe, 10 s.
- **Grenzen der Messung:** headless mit Grafikkarte. Das zeigt Regression und Vergleich, ergibt aber keine Werte fürs
  Poco.
- **Ansichten:** Desktop 1440 × 900; Handy 393 × 873, Pixeldichte 2,75, CPU 4× gedrosselt.
- **Vergleich:** «vor» ist b2083c4, der Stand vor Ticket 01, als eigener Worktree. Je Himmel abwechselnd mit «neu»
  gemessen.
- **GPU-Zeit:** über `EXT_disjoint_timer_query_webgl2`.

| Ansicht | Himmel | GPU-Mittel Ruhe neu / vor (ms) | GPU-p95 neu / vor | CPU-p95 neu / vor | Bild-p95 neu / vor | Bilder/s neu / vor |
|---|---|---|---|---|---|---|
| desktop | milky | 12,88 / 12,83 | 14,4 / 14,1 | 6,3 / 6,3 | 16,8 / 16,9 | 60 / 60 |
| desktop | solar | 13,31 / 13,31 | 14,9 / 14,8 | 6,9 / 6,8 | 18,3 / 18,2 | 57,1 / 57,2 |
| desktop | forest | 13,31 / 14,78 | 14 / 19,1 | 5,2 / 13,2 | 18,3 / 18,6 | 56,8 / 55,8 |
| desktop | beach | 19,81 / 18,25 | 23,5 / 20,5 | 7,9 / 8,2 | 35,5 / 34,7 | 49,5 / 53,7 |
| desktop | desert | 14,53 / 14,38 | 15,9 / 16,4 | 4,8 / 6,7 | 18,3 / 18,3 | 56,7 / 56,8 |
| desktop | volcano | 17,76 / 15,37 | 20,3 / 17,3 | 7,6 / 6,9 | 18,4 / 18,3 | 55,1 / 56,6 |
| desktop | village | 12,91 / 13,25 | 17,2 / 14,4 | 5,1 / 6,9 | 18,3 / 18,3 | 56,6 / 57 |
| handy | milky | 16,69 / 14,3 | 20,7 / 20,5 | 21,3 / 18,2 | 18,3 / 18,2 | 53,8 / 56,2 |
| handy | solar | 16,32 / 14,43 | 21 / 20,4 | 20,2 / 18,7 | 18,2 / 18,2 | 55,1 / 55,8 |
| handy | forest | 12,74 / 12,19 | 13,8 / 16,8 | 17,1 / 18,1 | 18,2 / 18,2 | 56,2 / 56,2 |
| handy | beach | 15,58 / 17,2 | 19,9 / 24,7 | 18,2 / 23,3 | 18,2 / 35,6 | 55,9 / 51,7 |
| handy | desert | 12,52 / 14,68 | 15,3 / 18,4 | 16,3 / 17,1 | 18,2 / 18,2 | 56,2 / 56 |
| handy | volcano | 14,21 / 16,76 | 19,3 / 21,8 | 19,8 / 23,9 | 18,2 / 18,3 | 56 / 54,9 |
| handy | village | 13,2 / 15,8 | 13,2 / 20,1 | 13,3 / 20,8 | 18,2 / 18,2 | 56,4 / 56,1 |

- **Zweiter Lauf** am Desktop, wo der Unterschied gross war: Strand GPU-Mittel neu 19,70 / vor 18,21 ms, Vulkan neu
  17,69 / vor 15,38 ms. Der Unterschied ist also echt: Am Desktop kostet der **Strand rund +1,5 ms** je Bild, der
  **Vulkan rund +2,3 ms** (wie in Ticket 09 mit +1,7 ms; der Nutzer lässt es so).
- **Übrige Himmel am Desktop:** Bei Wald, Wüste, Dorf, Milchstrasse und Sonnensystem bleibt der Unterschied innerhalb
  der Streuung.
- **Handy-Ansicht (gedrosselt):** Kein Brett ist messbar teurer. Die Unterschiede gehen in beide Richtungen
  (Streuung), die Grafikkarte ist hier nicht der Engpass.
  - Die Bildabstände (p95) liegen überall bei 18,2–18,3 ms, ausser am Strand: «vor» 35,6 ms, «neu» 18,2 ms. Dort senkt
    das Spiel die Auflösung (`adaptiveResolution`).
- **Strand am Desktop:** Neu wie vor hält er headless die 60 Bilder/s nicht (p95 35 ms; 49,5 bzw. 53,7 Bilder/s). Das
  liegt am Himmel des Strands auf dieser Grafikkarte, nicht am Brett.
- **Vorab gespeichert:**
  - Die Teile der Skyboxen mit `precache` haben 4 153 961 Bytes. Die Grenze von 4 500 000 ist eingehalten. Vor Ticket 01
    waren es 4 464 641, der neue Krater ist kleiner.
  - Die Bretter bringen keine Bytes dazu. `index.html` ist mit allen Brettern 149 KB grösser als `main` 96d6538
    (1,45 MB, ohne CRLF).
  - Alles aus `FILES` samt den Skybox-Teilen: 6,75 MB (vor 6,84 MB).

**Lücken an Weltgrenzen: Vorschlag für die gezielte Lockerung** (nicht gebaut, erst nach dem Poco-Test)

- **Ort:** `ende(name, …)` in `tests/geschichte-probe.mjs` zählt jede Lücke über 100 ms
  (`pruefe(ueber(100) === 0, …)`). Es gibt zwei Aufrufe an Weltgrenzen:
  - in `grenzenAblauf` `ende('Wiederholen: ' + name)` (Wüste → Vulkan, Vulkan → Planeten);
  - in `wagenAblauf` `ende('Wagen: Wiederholen über die Grenze ins Meer')`.
- **Vorschlag:** `ende` bekommt die Option `{ panorama: <id> }`.
  - Damit zählt **eine** Lücke bis 160 ms nicht, wenn im Bild davor der neue Blender-Himmel gerade erst einblendet:
    `log[i].shown === id && log[i].blender && log[i].w < 0.1`, und das Brett ist kein Notfall.
  - Die Probe gibt sie aus wie die Bilder der Probe (`art[i]`), mit «(erstes Bild des Panoramas, Entscheid 08.11.,
    zählt bis 160 ms nicht)».
  - Fehler bleiben: jede zweite Lücke dort, jede über 160 ms und jede an einer anderen Stelle.
- **Aufrufe:**
  - `ende(…, { panorama: nach })` in `grenzenAblauf` (`nach` ist dort bekannt);
  - `{ panorama: 'beach' }` bei der Grenze ins Meer in `wagenAblauf`.
- **Reisen der Geschichte** (`ganzerDurchgang`): Sie bleiben streng. Sie laden vorab und waren grün.
- **Gemessen heute:** 100 ms bei w 0,07 (Meer) und 117 ms bei w 0,04 (Vulkan). In den Reviews 05 und 09 waren es bis
  150 ms.

**Für den Poco-Test bereit**

- **Stand:** `feature/brett-10-schluss`, nicht gepusht. Zum Testen auf dem Poco muss der Stand auf Render oder lokal ins
  WLAN.
- **Version:** `2026-11-08 brett-schluss` in der Leistungsanzeige (Taste F bzw. `?perf`). Steht die alte da, einmal neu
  laden.
- **Was der Nutzer ansieht:**
  - Den Durchgang «Leicht» über alle Welten. Dabei je Welt das Brett beim Einstieg (Fall des Lichts) und die Lichtwelle
    beim Lösen. Wie flüssig es auf dem Gezeitenbecken (in der Handy-Ansicht früher weniger Bilder) und auf den
    Basaltsäulen läuft.
  - An den Weltgrenzen ins Meer und in den Vulkan: Hält das Bild sichtbar an, wenn der neue Himmel einblendet? Auch beim
    Wiederholen über die Grenze aus der Übersicht (ohne Vorladen). Mit `?perf` zeigt das Messwerkzeug die Hänger.
  - Die Reise ans Meer ohne Vorladen: Bergwald 10 aus der Übersicht wiederholen, dann «Weiter».
  - Offline (installierte App): In jeder Welt steht dasselbe Brett wie online.

**Offen:**

- Der Poco-Test. Danach je nach Befund die Lockerung oder das unsichtbare Vorzeichnen des Himmels (Entscheid 08.11.).
- `brett-probe formen`: 1 leeres Pixel bei Übergängen mit dem Moospolster, flach. Das kam jetzt in 2 von 2 Läufen vor, je
  bei einer anderen Paarung. Vermutlich ist es ein Riss in der Rasterung an einer Naht der Polster. Die Stelle
  aufzeichnen und ansehen.
- Der Strand kostet am Desktop +1,5 ms je Bild gegen das Steinbrett (headless); auf dem Poco ansehen.
- Review und Merge.
