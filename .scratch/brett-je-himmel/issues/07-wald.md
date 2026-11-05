# 07: Bergwald

**Spec:** ../spec.md

**Blocked by:** 06

**Status:** ready-for-agent

**What to build:** Ein Brett für den Bergwald in der Richtung, die am Strand gewählt wurde. Wir zeigen 2 bis 3 Varianten
im Spiel, der Nutzer wählt eine, sie wird fertig gebaut und abgenommen.

- [ ] **Varianten:** 2 bis 3 Varianten innerhalb der gewählten Richtung, abgestimmt auf den Wald (Material, Farben im
      Licht des Walds). Sie sind über den Schalter in der Adresse umschaltbar, wie in Ticket 04.
- [ ] **Bilder und Leistung:** eine Vorschauseite mit denselben Ansichten wie in Ticket 04 auf Desktop und Handy
      (Spielansicht, flach, ganz heraus, Fall des Lichts beim Einstieg in den Bergwald nach dem Prolog, Lösen). Dazu
      kommen die Messwerte je Variante.
- [ ] **Wahl des Nutzers:** Die Wahl steht unter «Comments». Danach wird die gewählte Variante fertig gebaut, und die
      übrigen werden entfernt.
- [ ] **Brett-Angabe:** Die Werte stehen in der Brett-Angabe des Walds. Das Register wird nur in der Brett-Angabe
      nachgeführt, und das Prüfwerkzeug kennt die Werte.
- [ ] **Übergänge:** Alles bleibt ohne Steinbrett, ohne Löcher und ohne Ruckeln:
      - beim Einstieg in den Bergwald nach dem Prolog («Gleich los») und nach «Im Dorf» (das Dorf vorerst mit
        Steinbrett),
      - auf der Reise vom Bergwald ans Meer,
      - beim Wiederholen über diese Weltgrenze.
- [ ] **Leistung:** Die Bildzeit steigt nicht messbar, und der Grafikspeicher bleibt etwa wie heute.
- [ ] **Abnahme:** Der Nutzer nimmt über eine Vorschauseite ab, erst dann wird committet.
- [ ] Alle Tests sind grün (Logik, offline, Geschichte-Probe auch mit `--dorf`), und das Review nach dem Ticket ist
      gelaufen.

## Hinweise

- **Der Wald:**
  - Nahe Fichten als 3D-Modelle (`toonInstances`), Glühwürmchen (`glowParticles`) und Nebelschleier (`mistSheets`).
  - Der Pinselfilter ist im Wald auf Wunsch des Nutzers aus.
  - Unter dem Brett war früher ein Loch im Himmel, inzwischen behoben (PLAN 2.37). Mit dem Kernquader prüfen, dass es
    nicht wiederkommt.
- **Budget:** Der Wald wird vorab gespeichert. Eine Form aus Blender zählt deshalb zur Grenze von 4,5 MB. Reicht der
  Platz nicht, fragen wir den Nutzer.
- Der Wald ist der erste Himmel der Geschichte. Er lädt hinter der Bühne des Prologs, und das Angebot wartet bis zu 8
  Sekunden auf ihn. Das Brett muss in dieser Zeit mit fertig werden.
