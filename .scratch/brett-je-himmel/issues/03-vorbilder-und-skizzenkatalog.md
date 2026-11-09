# 03: Vorbilder und Skizzenkatalog am Strand

**Spec:** ../spec.md

**Blocked by:** – (läuft gleichzeitig mit 01 und 02 und fasst `index.html` nicht an)

**Status:** resolved

**What to build:** Eine Vorschauseite (Artifact) mit 6 bis 8 deutlich verschiedenen Richtungen, wie das Brett am Strand
das Material seiner Umgebung aufnehmen kann. Daraus wählt der Nutzer 2 bis 3 für Ticket 04. Der Nutzer weiss bei
Gestaltungsfragen oft selbst nicht genau, was er will. Deshalb sollen die Richtungen breit streuen und echte Vorbilder
zeigen, nicht nur Abwandlungen in der Farbe.

- [x] **Vorbilder:** Gesucht wird in Spielen, Kunst und Natur, zum Beispiel nach schwebenden Plattformen und Inseln in
      Spielen mit gemaltem Stil, Treibholz, Muschelkalk, nassem Sand mit Rippeln, Seeglas und Strandfelsen mit
      Seepocken. Jedes Vorbild bekommt einen Link und einen Satz dazu. Abgelegt wird alles in
      `.scratch/brett-je-himmel/vorbilder/index.md`.
- [x] **6 bis 8 Richtungen**, deutlich verschieden. Beispiele:
      - nur eine andere Oberfläche,
      - eine andere Form innerhalb des Umrisses (Floss, Scholle, Bohlen),
      - Dinge, die auf dem Rand liegen oder wachsen,
      - ein Übergang zum Wasser,
      - ein gemalter Look wie die nahen Pflanzen (Pinselfilter).
- [x] **Jede Karte enthält:**
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
- [x] **Grenzen** (aus der Spec): Das 7×7-Feld bleibt eben, gleich gross und an derselben Stelle. Das Brett schwebt
      weiter, und das Licht auf dem Brett bleibt gleich. Die Farben sollen wirken, als stünden sie im Licht des Strands.
      Eine Regel für die Lesbarkeit gibt es nicht, darüber urteilt der Nutzer.
- [x] **Ablage:** Die Quelle der Vorschauseite liegt unter `.scratch/brett-je-himmel/katalog/`. Bilder bleiben klein,
      grosse Bilder liegen nur in `tests/output/`.
- [x] **Wahl des Nutzers:** Der Nutzer wählt 2 bis 3 Karten, eventuell mit Änderungswünschen. Die Wahl steht unter
      «Comments».

## Hinweise

- Vorgehen wie bei den Prismenzeichen: Ein Katalog mit 8 Karten brachte dort die Wende, nachdem kleine Abwandlungen im
  Spiel ermüdet hatten.
- Am Strand spart der Pinselfilter Brett und Elemente heute aus. Soll ein Brett gemalt wirken, gehört das als Hinweis
  auf seine Karte.
- Die Bildaufnahme läuft über `tools/leise.sh` und mit `--mute-audio`.

## Comments

**Katalog (05.11.2026):** Die Vorschauseite hat 8 Karten: Sandbank, Treibholz-Floss, Gezeitenfels, Muschelkalk mit
Perlmutt, Seeglas, Gezeitenbecken, Gemalt und Schwebende Sandinsel. Veröffentlicht ist sie unter
https://claude.ai/artifact/81jLC81YCbWBGYDRe6C6H1.

- **Bilder:** Alle Bilder sind echte Spielbilder (main 6f322ce, `?sky=beach`, 1440 × 900). Das Brett wurde zur
  Laufzeit eingesetzt, mit berechneten Texturen, Shadern und einfachen Körpern. Jede Karte hat 4 Bilder: schräg, von
  oben, flach und die Lichtwelle beim Lösen.
- **Ablage:**
  - `vorbilder/index.md` mit rund 50 Vorbildern; alle Links antworten mit 200.
  - `katalog/seite.mjs` ist die Quelle der Seite, `node seite.mjs` schreibt `index.html`.
  - In `katalog/bilder/` liegen 37 JPEGs (2,6 MB).
  - `katalog/bretter/` enthält die Skripte, die die Bretter zur Laufzeit bauen. Die Aufnahme läuft mit
    `katalog.mjs`, gegen einen Worktree auf 6f322ce daneben.
- **Funde beim Bauen:**
  - Auf hellen Brettern wirkt die Lichtwelle des Steinbretts kaum, deshalb hat jede Karte ihre eigene, stärkere Form.
  - Floss, Seeglas und Sandinsel bräuchten einen kleineren Kernquader.
  - `floorTop.visible = false` hält nicht, weil `renderReflection` die Oberfläche jedes Bild wieder einschaltet.
- **Achtung:** Die Skripte in `katalog/bretter/` greifen auf `__prismaDebug.floorMaterial` und auf die frühere
  Kantengruppe zu. Beides gibt es nach Ticket 01 nicht mehr (`boardTheme`, Brett-Teil). Sie laufen nur noch gegen
  6f322ce und dienen als Vorlage, nicht als Werkzeug.

**Wahl des Nutzers (05.11.2026):** **Gezeitenbecken** (Karte 6), und zwar so, wie es auf dem Hauptbild der Karte
steht:

- Das Feld ist heller Sandstein mit eingravierten Rasterlinien.
- Rundherum läuft im Rand eine flache Rinne mit klarem Wasser, mit Lichtnetz am Grund und Schaum an den Kanten. Die
  Wasserkante ersetzt die Einlegelinie.
- Aussen hält eine schmale Felslippe das Wasser. Die Seiten sind nasser Fels mit Rinnsalen.
- Gespiegelt wird nur in der Rinne, und das Feld ist matt.
- Die Lichtwelle läuft als Licht über den Stein und als Schwall mit Schaum durch die Rinne.

Den **Wasserfall** aus dem Ausblick-Bild will der Nutzer nicht. Er steht als Idee im PLAN unter 1.1.

Statt 2 bis 3 Richtungen baut Ticket 04 nur das Gezeitenbecken und verfeinert es an Bildern.

Wie sich die Richtung auf die übrigen Himmel überträgt, ist noch offen. Ein Vorschlag, den die Tickets 06 bis 09 mit
dem Nutzer klären: ein Feld aus dem Gestein der Welt, im Rand eine Rinne mit dem Element der Welt, etwa Sand in der
Wüste, ein Bach im Wald oder Lava am Vulkan.
