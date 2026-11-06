# 06: Wüste

**Spec:** ../spec.md

**Blocked by:** 05

**Status:** ready-for-agent

**What to build:** Ein Brett für die Wüste.
Die Welt bekommt ihren eigenen Katalog mit 6 bis 8 völlig neuen Richtungen (wie Ticket 03), die dem
Strand nicht ähneln müssen (Entscheid des Nutzers vom 05.11.2026). Der Nutzer wählt eine, sie wird im Spiel gebaut,
fertig gemacht und abgenommen.

- [x] **Katalog:** Vorbilder suchen und eine Vorschauseite mit 6 bis 8 völlig verschiedenen Richtungen für die Wüste
      bauen, wie in Ticket 03: echte Spielbilder mit zur Laufzeit eingesetztem Brett, je 4 Ansichten, Vorbilder mit
      Link, Idee, Raster, Einlegelinie, Spiegelung, Lichtwelle und Kostenhinweise. Der Katalog darf vor Ticket 05
      entstehen (er fasst `index.html` nicht an).
- [x] **Wahl aus dem Katalog:** Der Nutzer wählt eine Richtung, eventuell mit Änderungswünschen. Die Wahl steht unter
      «Comments».
- [ ] **Im Spiel:** Die gewählte Richtung wird eine Art von Brett, wie das Gezeitenbecken in Ticket 04. Der Nutzer gibt
      an Bildern Rückmeldungen, bis sie sitzt.
- [ ] **Bilder und Leistung:** eine Vorschauseite mit denselben Ansichten wie in Ticket 04 auf Desktop und Handy
      (Spielansicht, flach, ganz heraus, Fall des Lichts beim Einstieg in die Wüste, Lösen). Dazu kommen die Messwerte
      des Bretts, verglichen mit dem Steinbrett.
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

## Comments

**Erste Runde, verworfen (05.11.2026):** Vier Varianten der Rinnen-Idee vom Strand (Wadi mit rieselndem Sand, Oase,
Salzpfanne, Tempelbecken): https://claude.ai/artifact/UeqkywwPtPK2k2rDt7ccHq. Der Nutzer war nicht zufrieden und will
für jede Welt etwas komplett Neues, das dem Strand nicht ähneln muss. Die Dateien sind nicht im Repo,
die Seite bleibt unter dem Link.

**Zweite Runde (06.11.2026):** acht völlig neue Richtungen, https://claude.ai/artifact/18PvQpJeqFYvQZbDkyDR8j:
Fliegender Kelim, Lehmterrasse, Geode, Yardang, Tempelboden, Playa, Meteoreisen und Sandmandala. Quelle, Bilder und
die Skripte, die die Bretter zur Laufzeit bauen (nur gegen 6f322ce), liegen in `katalog-wueste/`.

**Wahl des Nutzers (06.11.2026): Lehmterrasse** (Karte 2), ohne Änderungswünsche:

- Das Brett ist das Dach eines Lehmbaus wie die Moschee von Djenné.
- Das Feld ist glatter Lehmputz mit feinen Rillen als Raster und einer hellen Kalklinie als Einlegelinie.
- Im Rand schauen Ziegel hervor, wo der Putz abgeplatzt ist.
- Unter einem Gesims steht eine eingezogene Lehmwand, aus der Balken aus Palmholz ragen (22 cm).
- Auf den Ecken stehen Spitztürmchen mit einem Straussenei.
- Es gibt keine Spiegelung, Lehm ist matt.
- Die Lichtwelle ist warmes Abendlicht, das in den Rillen des Rasters mitläuft.
- Vorlage: `katalog-wueste/bretter/varianten-wueste2/2-lehm.js` mit `0-hilfe.js` und `bretter.js`. Übernommen werden die
  Formeln und Farben, nicht der Aufbau, wie beim Gezeitenbecken (Ticket 04).
- Zu messen: Balken und Türmchen als Instanzen auf dem Handy.
