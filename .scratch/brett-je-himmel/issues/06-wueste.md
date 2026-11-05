# 06: Wüste

**Spec:** ../spec.md

**Blocked by:** 05

**Status:** ready-for-agent

**What to build:** Ein Brett für die Wüste in der Richtung, die am Strand gewählt wurde. Wir zeigen 2 bis 3 Varianten im
Spiel, der Nutzer wählt eine, sie wird fertig gebaut und abgenommen.

- [ ] **Varianten:** 2 bis 3 Varianten innerhalb der gewählten Richtung, abgestimmt auf die Wüste (Material, Farben
      im Licht der Wüste). Sie sind über den Schalter in der Adresse umschaltbar, wie in Ticket 04.
- [ ] **Bilder und Leistung:** eine Vorschauseite mit denselben Ansichten wie in Ticket 04 auf Desktop und Handy
      (Spielansicht, flach, ganz heraus, Fall des Lichts beim Einstieg in die Wüste, Lösen). Dazu kommen die Messwerte
      je Variante.
- [ ] **Wahl des Nutzers:** Die Wahl steht unter «Comments». Danach wird die gewählte Variante fertig gebaut, und die
      übrigen werden entfernt.
- [ ] **Brett-Angabe:** Die Werte stehen in der Brett-Angabe der Wüste. Das Register wird nur in der Brett-Angabe
      nachgeführt, und das Prüfwerkzeug kennt die Werte.
- [ ] **Übergänge:** Auf der Reise vom Meer in die Wüste und von der Wüste zum Vulkan (dieser vorerst mit Steinbrett)
      und beim Wiederholen über diese Weltgrenzen bleibt alles ohne Steinbrett, ohne Löcher und ohne Ruckeln.
- [ ] **Leistung:** Die Bildzeit steigt nicht messbar, und der Grafikspeicher bleibt etwa wie heute.
- [ ] **Abnahme:** Der Nutzer nimmt über eine Vorschauseite ab, erst dann wird committet.
- [ ] Alle Tests sind grün (Logik, offline, Geschichte-Probe), und das Review nach dem Ticket ist gelaufen.

## Hinweise

- **Die Wüste:**
  - Weiche Dünen im Anime-Stil, mit Windrippeln nah am Brett und Schatten in Rosa-Lila.
  - Die Sonne steht flach, bei etwa 17°.
  - Der Grund liegt 4 m unter dem Brett. Die nahen Dünen sind ein 3D-Netz (`bakedMesh` dunes), das in den Sand des
    Panoramas übergeht.
  - Weiter weg liegen die Oase und die Pyramiden.
- Die Wüste lädt ihr Bild erst beim Gebrauch (`vorab: false`). Eine Form aus Blender belastet deshalb die Grenze für
  das vorab Gespeicherte nicht, wohl aber das Budget der Skybox (sie liegt schon nahe an 300 MB Grafikspeicher).
