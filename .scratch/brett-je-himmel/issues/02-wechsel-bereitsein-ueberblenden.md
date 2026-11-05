# 02: Das Brett wechselt mit dem Himmel: bereit, halten, überblenden

**Spec:** ../spec.md

**Blocked by:** 01

**Status:** ready-for-agent

**What to build:** Das Brett gehört zum Bereitsein seines Himmels. Es wird berechnet, während der Himmel lädt oder
vorgeladen wird, und hält, bis das neue bereit ist. Es blendet gleichzeitig mit dem Himmel über und wird mit ihm
freigegeben. Damit sieht der Spieler unter einem Blender-Himmel nie ein falsches oder ein Steinbrett. Gebaut und
geprüft wird das mit dem Steinbrett als vorläufigem Brett aller fünf Himmel (Ticket 01), also bevor die Gestaltung
feststeht.

- [ ] **Bereitsein:** `skyTheme.ready` und damit `__prisma.skyReady()` ist erst wahr, wenn auch das Brett des Himmels
      berechnet und hochgeladen ist. Jede Stelle, die heute auf den Himmel wartet, wartet damit auch auf das Brett:
      - das Angebot nach dem Prolog («Gleich los»),
      - der Einstieg in eine Welt,
      - die Reise,
      - das Fortsetzen nach dem Neuladen,
      - das Wiederholen über eine Weltgrenze,
      - das Senken des Blicks aufs Brett.

      Gewartet wird höchstens 8 Sekunden, mit dem Kleinen Wagen wie heute.
- [ ] **Rechnen beim Laden:** Das Brett eines Himmels wird berechnet (im Hintergrund-Thread) und hochgeladen, wenn sein
      Himmel vorbereitet oder vorgeladen wird (`prepare`, `preload`), nie im Moment des Wechsels. Für die nächste Welt
      geschieht das, solange «Gelöst» steht. Grosse Uploads folgen den Regeln der Himmel (`skyTheme.quiet`,
      `ruhe.lade`).
- [ ] **Halten:** Bis das neue Brett bereit ist, bleibt das bisherige stehen, so wie `skyTheme.update` den bisherigen
      Himmel hält.
- [ ] **Überblenden:** Das Brett gleitet gleichzeitig mit dem Himmel und über dessen ganze Dauer (`fadeTime`, in der
      Geschichte 2,4 s oder 3 s) direkt vom alten zum neuen Brett.
      - Es gibt kein Steinbrett dazwischen, auch wenn der Himmel selbst über die Nacht wechselt (ins Sonnensystem, zu
        den Sternen).
      - Für Bretter gleicher Form genügt ein Mischen im Material.
      - Den Weg zwischen verschiedenen Formen legt Ticket 05 fest. Hier muss nur die Schnittstelle dafür bereitstehen.
      - Während des Überblendens gilt im Plattentest der Schnitt der Kernquader beider Bretter. Dort muss jedes Pixel
        von einem der beiden deckend gezeichnet sein, sonst fehlt dahinter der Himmel.
- [ ] **Freigeben:** Die Texturen eines Bretts werden zusammen mit denen seines Himmels freigegeben (auf dem Handy
      sofort, auf dem Desktop nach 30 s). Das Steinbrett bleibt immer, weil Milchstrasse und Rückfall es brauchen.
- [ ] **Notfall:** Scheitert das Berechnen, oder fehlt nach 8 Sekunden jedes frühere Brett, erscheint das Steinbrett.
      Dabei steht kein `[error]` in der Konsole, eine Warnung ist erlaubt.
- [ ] **Testschnittstelle:** `brett()` meldet zusätzlich, wie weit eine Überblendung ist (`anteil` 0 bis 1 des neuen
      Bretts, 1 ohne Überblendung) und von welchem Himmel sie kommt (`von`).
- [ ] **Proben:**
      - `tests/geschichte-probe.mjs` schreibt je Bild das Brett ins Protokoll (Himmel, bereit, Anteil).
      - `ohneLeeresBrett` prüft zusätzlich zwei Dinge:
        - Der Blick senkt sich erst, wenn das Brett des Himmels der Welt bereit ist.
        - Unter einem Blender-Himmel steht nie das Brett eines anderen Himmels oder ein Steinbrett im Blick.
      - In jeder Welt und «Im Dorf» passt das Brett zum Himmel.
      - Mit `--uebersicht` wechselt das Brett beim Wiederholen über eine Weltgrenze mit.
      - Die gemessenen Bildzeiten der Übergänge haben keine Lücken über 100 ms.
- [ ] **Langsames Netz:** Mit gedrosseltem Netz (DevTools oder eine Probe mit Netzdrosselung) wartet der Kleine Wagen,
      bis Himmel und Brett da sind. Unter einem Blender-Himmel erscheint kein Steinbrett. Das Ergebnis steht im Ticket.
- [ ] **Leistung:** Das Messwerkzeug (`?perf`, Taste F) misst vorher und nachher, auf dem Desktop und in der
      Handy-Ansicht. Die Werte stehen im Ticket, und die Bildzeit steigt nicht messbar.
- [ ] Alle Tests sind grün, auch die Geschichte-Probe mit `--dorf` und `--uebersicht`, und das Review nach dem Ticket
      ist gelaufen.

## Hinweise

- **Wie der Himmel heute wechselt:**
  - `skyTheme.set`, `preload`, `update` und `apply` steuern den Wechsel. Der Himmel blendet zuerst aus und dann ein, ein
    gewöhnlicher Wechsel dauert je 1,5 s.
  - Zwischen zwei Welten auf der Erde gleitet er über die Farben beider (`story.blendSky`).
  - `story.skyOf` wartet mit dem Kleinen Wagen. Das Angebot wartet in einer eigenen Schleife (8 s).
- Das Ruckeln beim ersten Hochladen grosser Texturen ist bekannt (siehe die Erinnerung «Start-Ruckeln» und
  `.scratch/leistung/`, Ticket 09). Messen lässt es sich mit den Bildzeiten der Geschichte-Probe.
