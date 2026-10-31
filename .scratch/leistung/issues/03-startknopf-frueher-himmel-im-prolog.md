# 03: Startknopf spätestens nach 3,9 s, Himmel lädt im Prolog

**Spec:** ../spec.md

**Blocked by:** 02, 04 (04 baut die Prolog-Bühne und ihr Vorwärmen um, dieses Ticket plant die Ladearbeit darum herum)

**Status:** ready-for-agent

**What to build:** «Klicken/Tippen zum Starten» erscheint **spätestens 3,9 s** nach Beginn der Enthüllung, auch auf dem
Handy und bei langsamem Laden. Die schwere Ladearbeit für den Himmel kollidiert weder mit den Animationen des
Startbildschirms noch mit der Fahrt des Prologs.

Heute wartet der Knopf auf mindestens 2,9 s **und** `skyTheme.shown` (`index.html` 15799–15808, Commit 7bf959c),
höchstens 15 s. Der Startbildschirm ist aber deckend (305), man sieht den Himmel dahinter also nicht. Die Enthüllung
selbst wartet vorher auf die Schrift (bis 0,8 s) und `sceneReady` (bis 5 s, 15790–15796). Ticket 02 löst die Bindung an
das erste WebGL-Bild. Bei `introCalm` (4,2 s, `INTRO_REVEAL_MS` 15769) startet ein Schwall Arbeit: Shader, Uploads,
Aufwärm-Zeichnen, Vorwärmen von Menü-SVG mit Blur, Übersicht und Prolog-Bühne (17632–17637, 11730ff). Er fällt genau in
das Einblenden und Pulsieren des Knopfs.

**Wichtig: WebGL-Pause allein genügt nicht.** Das erste Schreiben in eine grosse Textur hält den **Grafikprozess**
30–80 ms an (11778–11781). Über diesen Prozess laufen auch CSS und SVG, also auch Startbildschirm und Prolog-Bühne.
Deshalb hält `skyTheme.quiet` scharfes Bild und Streifen heute schon aus der Prolog-Fahrt heraus (18050–18054, «ihr
Hochladen hielt sie bis 110 ms an», Review Ticket 07 der Geschichte). Diese Regel bleibt bestehen.

- [ ] **Enthüllung ohne lange Wartezeit:** Sie beginnt, sobald die Schrift geladen ist (höchstens 0,8 s wie heute),
      nicht erst nach einem WebGL-Bild. Die Zeit vom Laden der Seite bis zum Knopf wird gemessen und im Ticket notiert.
- [ ] Der Knopf erscheint nach Ende der Enthüllung, spätestens aber bei 3,9 s, **ohne** auf den Himmel zu warten.
- [ ] **Wo die grossen Uploads hindürfen:** Bestandsaufnahme aller GPU-Uploads und Shader-Kompilierungen von Seitenstart
      bis Spielbeginn: Vorschau, Netz, Tiefe, scharfes Bild, Streifen, Ebenen, Vorwärmen. Für jede wird festgelegt, wann
      sie läuft:
      - nur an Stellen, an denen nichts Sichtbares animiert: die Enthüllung ist fertig und nur das Pulsieren läuft
        (prüfen, ob auch das stockt), oder im Prolog beim Warten auf Tippen zwischen den Fahrten (nicht während einer
        Fahrt);
      - oder in Stücken, die klein genug sind, dass keiner den Grafikprozess über einen Frame anhält, z. B. kleinere
        `texSubImage2D`-Streifen.
      Das Ergebnis als Tabelle ins Ticket schreiben.
- [ ] **Neue Spieler (mit Prolog):** Was für den Spielbeginn nötig ist (Vorschau und Netz, also `skyTheme.shown`), ist
      bis zum Ende des Prologs fertig. Hochgeladen wird nur in den Warte-Phasen nach der Regel oben. Ist es am Ende
      trotzdem nicht fertig, gibt es eine weiche Überblendung, bis der Himmel steht. Dieses Laden wird im Messwerkzeug
      markiert.
- [ ] **Spieler ohne Prolog** (Neuladen mitten im Spiel, «Weiter»): Nach dem Klick folgt eine kurze, weiche
      Überblendung, bis der Himmel steht. Kein schwarzer Blitz und kein Hänger über 33 ms ausserhalb der markierten
      Ladephase. Wie lange das auf dem Arbeitsrechner gedrosselt dauert, wird gemessen und im Ticket notiert.
- [ ] **Vorwärmen:** Was heute an `introCalm` hängt, nach derselben Regel planen. Das Vorwärmen der Prolog-Bühne (so,
      wie Ticket 04 sie umgebaut hat) muss vor dem Prolog fertig sein, sonst ruckelt ihr erstes Bild (bekannt:
      103–249 ms, Ticket 08 der Geschichte). Das Menü-SVG mit Blur kann warten, bis der Prolog vorbei ist.
- [ ] Ruckelt der Startbildschirm selbst noch, wird das hier mitbehoben. In Frage kommen die CSS-Animationen (223–301:
      `clip-path`-Reveal mit `text-shadow` 60 px, Strahl mit `box-shadow`) und der SVG-Fächer mit `feGaussianBlur` und
      `stroke-dashoffset` im Markup (um 1120–1124). Die Optik bleibt gleich, z. B. durch compositor-fähige Eigenschaften
      (transform/opacity) oder vorgerenderten Glow statt Live-Filter.
- [ ] Messen: Abschnitte Startbildschirm und Prolog sowie Übergang ins Spiel vorher und nachher, ungedrosselt und
      gedrosselt; dazu die Zeit bis zum Erscheinen des Knopfs.
- [ ] Tests grün (Start-, Geschichte- und Offline-Tests anpassen, wo sie auf `skyTheme.shown` vor dem Start bauen),
      Review des Diffs, Commit auf `feature/leistung`.

## Comments
