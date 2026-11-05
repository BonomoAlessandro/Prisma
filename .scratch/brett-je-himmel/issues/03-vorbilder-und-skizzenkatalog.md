# 03: Vorbilder und Skizzenkatalog am Strand

**Spec:** ../spec.md

**Blocked by:** – (läuft gleichzeitig mit 01 und 02 und fasst `index.html` nicht an)

**Status:** ready-for-agent

**What to build:** Eine Vorschauseite (Artifact) mit 6 bis 8 deutlich verschiedenen Richtungen, wie das Brett am Strand
das Material seiner Umgebung aufnehmen kann. Daraus wählt der Nutzer 2 bis 3 für Ticket 04. Der Nutzer weiss bei
Gestaltungsfragen oft selbst nicht genau, was er will. Deshalb sollen die Richtungen breit streuen und echte Vorbilder
zeigen, nicht nur Abwandlungen in der Farbe.

- [ ] **Vorbilder:** Gesucht wird in Spielen, Kunst und Natur, zum Beispiel nach schwebenden Plattformen und Inseln in
      Spielen mit gemaltem Stil, Treibholz, Muschelkalk, nassem Sand mit Rippeln, Seeglas und Strandfelsen mit
      Seepocken. Jedes Vorbild bekommt einen Link und einen Satz dazu. Abgelegt wird alles in
      `.scratch/brett-je-himmel/vorbilder/index.md`.
- [ ] **6 bis 8 Richtungen**, deutlich verschieden. Beispiele:
      - nur eine andere Oberfläche,
      - eine andere Form innerhalb des Umrisses (Floss, Scholle, Bohlen),
      - Dinge, die auf dem Rand liegen oder wachsen,
      - ein Übergang zum Wasser,
      - ein gemalter Look wie die nahen Pflanzen (Pinselfilter).
- [ ] **Jede Karte enthält:**
      - Ein echtes Spielbild vom Strand im schrägen Blick wie im Spiel (`?sky=beach`, mit `tests/screenshot.mjs` vom
        heutigen Stand). Das neue Brett ist darübergemalt (SVG oder Canvas), dazu kommt eine Aufsicht.
      - Die Vorbilder mit Link und zwei, drei Sätze zur Idee.
      - Was die Karte von Rasterlinien, Einlegelinie und Spiegelung behält, und wie die Lichtwelle beim Lösen darauf
        aussieht. Die Lichtwelle ist Pflicht.
      - Hinweise, wo sie zutreffen:
        - Die Richtung braucht eine Form aus Blender.
        - Sie ginge über den heutigen Umriss von 9,8 × 9,8 m hinaus oder verbände das Brett mit dem Grund (nur als
          Ausblick, teurer).
        - Sie deckt das 7×7-Feld nicht ganz undurchsichtig (Kernquader, siehe Ticket 01).
- [ ] **Grenzen** (aus der Spec): Das 7×7-Feld bleibt eben, gleich gross und an derselben Stelle. Das Brett schwebt
      weiter, und das Licht auf dem Brett bleibt gleich. Die Farben sollen wirken, als stünden sie im Licht des Strands.
      Eine Regel für die Lesbarkeit gibt es nicht, darüber urteilt der Nutzer.
- [ ] **Ablage:** Die Quelle der Vorschauseite liegt unter `.scratch/brett-je-himmel/katalog/`. Bilder bleiben klein,
      grosse Bilder liegen nur in `tests/output/`.
- [ ] **Wahl des Nutzers:** Der Nutzer wählt 2 bis 3 Karten, eventuell mit Änderungswünschen. Die Wahl steht unter
      «Comments».

## Hinweise

- Vorgehen wie bei den Prismenzeichen: Ein Katalog mit 8 Karten brachte dort die Wende, nachdem kleine Abwandlungen im
  Spiel ermüdet hatten.
- Am Strand spart der Pinselfilter Brett und Elemente heute aus. Soll ein Brett gemalt wirken, gehört das als Hinweis
  auf seine Karte.
- Die Bildaufnahme läuft über `tools/leise.sh` und mit `--mute-audio`.
