# 10: Seitenstart in Stücken

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** ready-for-agent

**What to build:** Das Hauptscript läuft beim Laden nicht mehr als eine einzige lange Aufgabe. Auf dem Poco soll keine
Aufgabe des Seitenstarts länger als 100 ms dauern (heute 342 ms Script). Optisch ändert sich nichts, der Startknopf
kommt nicht später.

**Messwerte (07):**

- Poco, Handy-Durchlauf 2: Seitenstart-Hänger 342 ms («`?perf=`: Script 332 ms», das Hauptscript), dazu 173 ms ohne
  Script und 120 ms (`FrameRequestCallback`, Script 77 ms). Durchlauf 1: 807 ms; Tickets 02–05 haben schon viel
  herausgenommen.
- T2000 Desktop: 246 ms (ohne Script), Handy-Emulation 4×: 684 ms; 6×: 1552 ms.
- CPU-Profil des Ladens (Handy-Emulation 4×): Hauptscript (`index.html` Zeile 1199) 1376 ms in einer Aufgabe. Darin:
  `compileParallel` → `issue` (Programme der Szene anstossen, three erzeugt ihren Code synchron) 406 ms;
  `buildEnvironment` × 2 (PMREM `fromScene`, synchron übersetzt und gezeichnet) 388 ms; Gruppe der Elemente zum
  Vorwärmen (`index.html` um 21003) 132 ms; `createStars` (mit `gauss`) 126 ms; Renderer anlegen 60 ms;
  `createComposer` 16 ms. Geteilt durch ~4 ergibt das die 332 ms des Poco.

**Was man sieht:** Während des Seitenstarts steht der Startbildschirm noch vor der Enthüllung (zählt als Laden, nicht
gegen die Grenzwerte). Die lange Aufgabe verzögert aber das erste Bild und die Enthüllung und blockiert Eingaben.

**Vorschlag:**

- [ ] Das Hauptscript nach dem Aufbau des Nötigsten (Renderer, Szene, Startbildschirm) in Abschnitte teilen, mit
      `await` auf eine neue Aufgabe dazwischen (`scheduler.yield`, sonst `setTimeout(0)`/`MessageChannel`):
      Umgebung (`buildEnvironment`, die zweite für die Spiegelung erst danach), Sterne, Elemente zum Vorwärmen,
      `compileParallel` der Szene. Die Reihenfolge bleibt (`scene.environment` vor dem Anstossen der Programme).
- [ ] `compileParallel` → `issue`: in Häppchen über die Wurzeln bzw. Materialien (wie in 09), nicht die ganze Szene in
      einem `renderer.compile`.
- [ ] Prüfen, dass nichts vor dem Ende der Abschnitte auf die Teile zugreift (Testschnittstelle, `?nointro`, Proben),
      und dass `sceneReady`/Vorwärmen vor `.go` gleich bleibt (Ticket 03).
- [ ] Messen: CPU-Profil des Ladens vorher/nachher (Handy-Emulation 4×), Start-Probe (Knopf nach Laden), Referenzdurchlauf
      Desktop und Handy 4×.
- [ ] Tests grün (alle Proben mit `?nointro` und mit Startbildschirm), Review, Commit.

**Abnahmekriterium:** Handy-Emulation 4×: keine Aufgabe im Seitenstart über 400 ms Script (entspricht ~100 ms auf dem
Poco); Knopf nach dem Laden nicht später als vorher (Start-Probe, je 2 Läufe). Poco (Schlussabnahme): längster
Hänger im Seitenstart ≤ 150 ms. Startbildschirm und Spiel unverändert.

**Gewinn und Rang:** Seitenstart zählt als Laden; der Gewinn ist ein früheres erstes Bild und keine eingefrorene Seite
beim Öffnen. Niedriger Rang als 09 und 11.

## Comments
