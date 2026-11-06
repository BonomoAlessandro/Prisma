# 04: Strand: Gezeitenbecken im Spiel

**Spec:** ../spec.md

**Blocked by:** 02

**Status:** ready-for-agent

**What to build:** Der Nutzer hat im Katalog (Ticket 03) das **Gezeitenbecken** gewählt, ohne den Wasserfall. Es wird
als echte Art von Brett ins Spiel gebaut und wird das Brett des Strands. Der Nutzer bekommt Bilder von Desktop und
Handy und gibt Rückmeldungen, bis die Richtung sitzt. Den Übergang zu anderen Brettern und den Abschluss macht
Ticket 05.

So sieht es aus (Karte 6 im Katalog, Hauptbild):

- **Feld:** heller Sandstein mit eingravierten Rasterlinien.
- **Rinne:** Rundherum läuft im Rand eine flache Rinne mit klarem Wasser, mit Lichtnetz am Grund und Schaum an den
  Kanten. Die Wasserkante ersetzt die Einlegelinie.
- **Aussen und Seiten:** Eine schmale Felslippe hält das Wasser. Die Seiten sind nasser Fels mit Rinnsalen.
- **Spiegelung:** nur in der Rinne, dort stark. Das Feld ist matt.
- **Lichtwelle beim Lösen:** Licht läuft über den Stein, und in der Rinne läuft ein Schwall mit Schaum rundum.

- [ ] **Neue Art:** Das Gezeitenbecken wird eine Art im Brett-Teil (Ticket 01). Es steht in `BOARD_TYPES` und hat
      seine Werte in `BOARD_PARAMS`, etwa die Farben von Stein, Wasser und Fels sowie die Lage der Rinne. Die
      Brett-Angabe des Strands (`skybox.json`) nennt die neue Art und ihre Werte, und das Register wird mit
      `pack.mjs --brett beach` nachgeführt.
- [ ] **Vorlage:** Als Vorlage dient `katalog/bretter/varianten/6-wasserrand.js` mit den Hilfen in
      `katalog/bretter/bretter.js`. Die Skripte bauen das Brett zur Laufzeit gegen den Stand 6f322ce. Sie nutzen
      `floorMaterial` und die frühere Kantengruppe, die es nach Ticket 01 nicht mehr gibt. Übernommen werden also die
      Formeln und Farben, nicht der Aufbau.
- [ ] **Schalter:** Ein Parameter in der Adresse (zum Beispiel `?brett=stone`) zeigt zum Vergleich ein anderes Brett,
      nur für Bilder. Er verschwindet in Ticket 10.
- [ ] **Material und Speicher:**
      - Das Material wird im Spiel berechnet, ohne Bilddateien, und zwar im Hintergrund beim Laden (Ticket 02).
      - Der Grafikspeicher bleibt etwa wie beim Steinbrett. Der Katalog rechnete mit 2048², das Steinbrett hat 1024²:
        Die Grösse misst und begründet das Ticket.
      - Eine Form aus Blender ist für diese Richtung nicht nötig.
- [ ] **Spiegelung nur in der Rinne:** Die planare Spiegelung bleibt, wirkt aber nur in der Rinne, etwa über Rauheit
      oder eine Maske. Ist das auf dem Handy zu teuer, wird gemessen und der Nutzer gefragt.
- [ ] **Pflicht und Grenzen:**
      - Das Brett hat seine eigene Lichtwelle, wie in der Karte: Licht läuft über den Stein, und in der Rinne zieht ein
        Schwall mit Schaum rundum, der danach wieder still wird. Sie kommt als Bildfolge oder kurzes Video auf die
        Vorschauseite (Wunsch des Nutzers vom 06.11.2026).
      - Befund aus der Bildfolge vom 06.11.2026 (https://claude.ai/artifact/SobbUb4scUxKp3dH7FVfqM): Der Ring wird
        schwächer, je weiter er läuft (Stärke 0,82 bei 0,7 m, 0,16 bei 4,3 m). In der Rinne, 4,3 bis 4,8 m von der
        Mitte, kommt der Schwall deshalb fast ohne Kraft an. Die Rinne bekommt darum ihre eigene Zeit: Der Schwall
        startet, wenn der Ring ankommt, und läuft mit eigener Stärke rundum. Bildfolgen nimmt
        `lichtwelle/welle-folge.mjs` auf.
      - Wunsch des Nutzers (06.11.2026): Die Lichtwelle soll nach **Wasser oder Seifenblasen** aussehen, zumindest ein
        wenig. Zum Beispiel rollt eine kleine Welle mit Gischt über das Feld, oder schillernde Seifenblasen steigen dort
        auf, wo der Ring vorbeizieht, und zerplatzen. Zeig ihm 2 bis 3 Varianten als Bildfolge.
      - Das 7×7-Feld bleibt eben, gleich gross und an derselben Stelle.
      - Die Form bleibt innerhalb des Umrisses, und das Brett schwebt.
      - Die Art nennt ihren Kernquader. Mit flacher und ganz herausgezoomter Kamera hat der Himmel keine Löcher.
- [ ] **Bilder zur Rückmeldung** auf einer Vorschauseite (Artifact), neben dem Steinbrett und dem Katalogbild, auf dem
      Desktop (1440 × 900) und dem Handy (390 × 844 hochkant). Gezeigt werden:
      - die Spielansicht,
      - die flache Kamera,
      - die ganz herausgezoomte Kamera,
      - der Fall des Lichts aufs Brett beim Einstieg ins Meer,
      - das Lösen mit der Lichtwelle.
- [ ] **Leistung:** Bildzeit und Grafikspeicher, gemessen mit dem Messwerkzeug auf dem Desktop und in der
      Handy-Ansicht, stehen mit auf der Seite, verglichen mit dem Steinbrett.
- [ ] **Rückmeldung des Nutzers:** Sie wird eingearbeitet, auch über mehrere Runden. Sein Urteil steht unter
      «Comments».
- [ ] **Tests:** Ein Logiktest zeigt, dass das Prüfwerkzeug ungültige Werte der neuen Art ablehnt. Die Offline-Probe
      meldet am Strand die neue Art. Alle Tests sind grün, und das Review nach dem Ticket ist gelaufen.

## Hinweise

- **Was am Strand ums Brett liegt:**
  - Wasser rund ums Brett (`waterSurface`), 3 m tiefer, mit einem Loch unter dem Brett.
  - Fische, die Abstand zum Umriss halten.
  - Felsen (`bakedMesh`).
  - Gemalte Pflanzen (`paintedInstances`) mit Pinselfilter, der das Brett ausspart.
  - Das Hauptlicht des Strands steht im Register (`light.dir`). Das Brett nutzt es nicht, denn das Licht auf dem Brett
    bleibt gleich.
- **Lichtwelle:** Auf hellen Brettern wirkt die Lichtwelle des Steinbretts kaum (Katalog). Die stärkere Form der Karte
  ist deshalb Teil der Art.
- **Fester Zufall:** Mit `?t=` hängt der Zufall an der Zahl der Objekte (siehe Ticket 01). Vergleichsbilder mit und
  ohne neues Brett können sich deshalb bei den Zielen unterscheiden.
- Die Bildaufnahme läuft über `tools/leise.sh` und mit `--mute-audio`.
