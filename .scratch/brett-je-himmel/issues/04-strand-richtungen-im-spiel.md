# 04: Strand: 2 bis 3 Richtungen im Spiel

**Spec:** ../spec.md

**Blocked by:** 02, 03

**Status:** ready-for-agent

**What to build:** Die 2 bis 3 Richtungen, die der Nutzer im Katalog gewählt hat (Ticket 03), werden als Arten von
Brettern ins Spiel gebaut. Am Strand lassen sie sich über einen Parameter in der Adresse umschalten, der nur während
der Arbeit existiert. Der Nutzer bekommt Bilder von Desktop und Handy und wählt eine Richtung.

- [ ] **Arten:** Jede gewählte Richtung wird eine Art im Brett-Teil. Sie steht in der Liste der Arten und hat ihre
      Werte. Die Werte der Varianten stehen vorerst im Code; erst die gewählte kommt in Ticket 05 in die
      `skybox.json`.
- [ ] **Schalter:** Ein Parameter in der Adresse (zum Beispiel `?brett=<art>`) zeigt eine Variante, nur für Vergleiche
      und Bilder. Ohne ihn bleibt das Brett aus der Brett-Angabe. Er verschwindet in Ticket 10.
- [ ] **Material und Speicher:**
      - Das Material wird im Spiel berechnet, ohne Bilddateien.
      - Der Grafikspeicher bleibt je Brett etwa wie beim Steinbrett.
      - Gerechnet wird beim Laden (Ticket 02).
- [ ] **Formen aus Blender** nur, wenn eine Richtung sie verlangt:
      - Gebaut werden sie mit dem Blender-MCP, klein gehalten und in den Teilen des Strands mitgeladen (wie die Felsen
        als `bakedMesh`).
      - Die Grenze für alles vorab Gespeicherte bleibt bei 4,5 MB. Heute sind davon etwa 4,2 MB belegt, der Strand
        wird vorab gespeichert.
      - Reicht der Platz nicht, fragen wir den Nutzer.
- [ ] **Pflicht und Grenzen:**
      - Jede Variante hat die Lichtwelle beim Lösen.
      - Das 7×7-Feld bleibt eben, gleich gross und an derselben Stelle.
      - Die Form bleibt innerhalb des Umrisses, und das Brett schwebt.
      - Jede Art nennt ihren Kernquader, und der Himmel hat keine Löcher. Das wird mit flacher Kamera und ganz
        herausgezoomt geprüft.
- [ ] **Bilder für die Wahl** auf einer Vorschauseite (Artifact), Varianten nebeneinander, auf dem Desktop (1440 × 900)
      und dem Handy (390 × 844 hochkant). Gezeigt werden:
      - die Spielansicht,
      - die flache Kamera,
      - die ganz herausgezoomte Kamera,
      - der Fall des Lichts aufs Brett beim Einstieg ins Meer,
      - das Lösen mit der Lichtwelle.
- [ ] **Leistung:** Bildzeit und Grafikspeicher je Variante, gemessen mit dem Messwerkzeug auf dem Desktop und in der
      Handy-Ansicht, stehen mit auf der Seite.
- [ ] **Wahl des Nutzers:** Der Nutzer wählt eine Richtung, eventuell mit Änderungswünschen. Die Wahl steht unter
      «Comments».
- [ ] Alle Tests sind grün, und das Review nach dem Ticket ist gelaufen.

## Hinweise

- **Was am Strand ums Brett liegt:**
  - Wasser rund ums Brett (`waterSurface`), mit einem Loch unter dem Brett, 3 m tiefer.
  - Fische, die Abstand zum Umriss halten.
  - Felsen (`bakedMesh`).
  - Gemalte Pflanzen (`paintedInstances`) mit Pinselfilter, der das Brett ausspart.
  - Das Hauptlicht des Strands steht im Register (`light.dir`). Das Brett nutzt es nicht, denn das Licht auf dem Brett
    bleibt gleich.
- Die Bildaufnahme läuft über `tools/leise.sh` und mit `--mute-audio`.
