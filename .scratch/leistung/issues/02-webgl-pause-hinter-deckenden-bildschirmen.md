# 02: Szene zeichnet nicht hinter deckenden Bildschirmen; Mechanismus für Ruhen und Aufwecken

**Spec:** ../spec.md

**Blocked by:** 01

**Status:** ready-for-agent

**What to build:** Solange ein deckender Bildschirm die 3D-Szene vollständig verdeckt, wird sie **nicht gezeichnet**,
also mit 0 gerenderten Bildern statt 60 bzw. 30. Das betrifft den Startbildschirm, die Bühne von Prolog und Epilog im
Szenenmodus und jede andere deckende Ebene. Die Logik läuft weiter. Optisch ändert sich nichts. Dieses Ticket baut
ausserdem den Mechanismus für Ruhen und Aufwecken der Hauptschleife, den Ticket 06 wiederverwendet.

Heute läuft `frame()` (`index.html` um 19411) auf jedem Display-Refresh. `frameRate.busy()` (19363) liefert für
`flow.state === 'intro'` true, also 60 fps hinter dem deckenden `#intro` (Hintergrund deckend, 305). Hinter
`story.covered` (Prolog, 18419) sind es 30 fps.

**Wichtig: `animate()` (um 19430) ist Logik, nicht Rendern.** Darin laufen `story.update` mit den `story.tweens`,
worauf `story.wait()` (18852) beruht, `skyTheme.update` mit den Überblend-Gewichten, `uReady`/`uFade` und dem
Freigeben alter Himmel, sowie `updateFlow`, `celebration` und `beamView`. Die Lade-Schleifen der Skybox
(`shown()`, 11781–11797) warten auf `uFade`/`uReady`. Hält man `animate()` an, hängen `story.wait()` (z. B. 18124,
18247–18250, `wait(1.9)` bei 18415), `skyTheme.shown` wird nie wahr und der Himmel lädt hinter dem Prolog nie fertig.

- [ ] **Logik und Zeichnen trennen.** In `frame()` laufen Logik (`animate()` und alles, was Zustand fortschreibt) und
      Zeichnen (`renderReflection`, `composer.render`, Schatten, alles mit GPU-Arbeit) getrennt. Bei verdeckter Szene
      läuft nur die Logik, im rAF-Takt oder gedrosselt, solange Timer und Tweens korrekt bleiben. Gezeichnet wird nicht.
- [ ] Einen zentralen Zustand «Szene verdeckt» einführen. Er weiss, welche Ebenen deckend sind: `#intro`,
      `#story` im Szenenmodus (`#020208`, 357) und weitere, die man beim Durchsehen findet. Halbtransparente Ebenen und
      das Menü über dem sichtbaren Himmel zählen **nicht** dazu. Dort prüfen, was durchscheint.
- [ ] **Mechanismus für Ruhen und Aufwecken** (`wake()` o. ä.): Die Hauptschleife meldet pro Durchgang, ob sie
      zeichnen muss und ob sie überhaupt weiterlaufen muss, also ob Logik ansteht (Tweens, Überblendungen, Ladeschleifen,
      die auf `uFade`/`uReady` warten, Feiern). Steht nichts an, ruht sie ohne rAF. Eingaben, Tweens, `story.wait`,
      Skybox-Laden, `resize`, `visibilitychange` usw. wecken sie über `wake()`. In diesem Ticket wird nur der
      Mechanismus gebaut und für die verdeckten Phasen benutzt. Ruhen im sichtbaren Spiel ist Ticket 06.
- [ ] Laden, Hochladen in Stücken (`sliced`, läuft über `nextFrame` unabhängig von `frame()`) und Uploads laufen in
      verdeckten Phasen weiter. Die Zeitbasis der Szene (Himmel, Staub, Uhr) springt beim Aufdecken nicht.
- [ ] **Aufwärmen statt Hänger:** Kurz bevor die Szene aufgedeckt wird, also bevor die Überblendung beginnt, wird
      einmal gezeichnet. Das passiert, wenn Shader, Uploads und Render-Targets nach der Pause «kalt» sein könnten. Der
      erste sichtbare Frame darf nicht länger dauern als heute.
- [ ] Bedingungen, die heute ein gezeichnetes Bild brauchen, sauber behandeln:
      - `sceneReady` als Voraussetzung des Intro-Starts (15790–15796, wartet bis zu 5 s): Die Enthüllung soll nicht
        mehr auf ein WebGL-Bild warten, das man nicht sieht. Was dieses erste Bild bisher vorbereitet hat, macht
        stattdessen das Aufwärmen.
      - Shader-Vorkompilierung (`compileParallel`, `KHR_parallel_shader_compile`) und das Aufwärm-Zeichnen bei
        `introCalm` (11727–11730).
      - `adaptiveResolution` darf aus verdeckten Phasen nichts lernen.
      - `perfHud.avgMs`, `__prisma.fps()` und `__prisma.frames`: Die Tests warten auf `__prisma.frames > 2`
        (`tests/geschichte-probe.mjs`, `tests/offline.mjs` u. a.). Alle Stellen suchen und auf ein passendes Signal
        umstellen, z. B. «Logik läuft» bzw. «erstes Bild gezeichnet».
- [ ] Messen mit dem Werkzeug aus 01: Startbildschirm und Prolog vorher und nachher, ungedrosselt und gedrosselt.
      Ein Übergang Start → Prolog → Spiel ohne Bild über 33 ms (Laden hinter Überblendung ausgenommen und markiert).
- [ ] Tests grün, Review des Diffs, Commit auf `feature/leistung`.

## Comments
