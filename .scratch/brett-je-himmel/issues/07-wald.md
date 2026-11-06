# 07: Bergwald

**Spec:** ../spec.md

**Blocked by:** 06

**Status:** ready-for-agent

**What to build:** Ein Brett für den Bergwald.
Die Welt bekommt ihren eigenen Katalog mit 6 bis 8 völlig neuen Richtungen (wie Ticket 03), die dem
Strand nicht ähneln müssen (Entscheid des Nutzers vom 05.11.2026). Der Nutzer wählt eine, sie wird im Spiel gebaut,
fertig gemacht und abgenommen.

- [x] **Katalog:** Vorbilder suchen und eine Vorschauseite mit 6 bis 8 völlig verschiedenen Richtungen für den Bergwald
      bauen, wie in Ticket 03: echte Spielbilder mit zur Laufzeit eingesetztem Brett, je 4 Ansichten, Vorbilder mit
      Link, Idee, Raster, Einlegelinie, Spiegelung, Lichtwelle und Kostenhinweise. Der Katalog darf vor Ticket 05
      entstehen (er fasst `index.html` nicht an).
- [x] **Wahl aus dem Katalog:** Der Nutzer wählt eine Richtung, eventuell mit Änderungswünschen. Die Wahl steht unter
      «Comments».
- [ ] **Im Spiel:** Die gewählte Richtung wird eine Art von Brett, wie das Gezeitenbecken in Ticket 04. Der Nutzer gibt
      an Bildern Rückmeldungen, bis sie sitzt.
- [ ] **Bilder und Leistung:** eine Vorschauseite mit denselben Ansichten wie in Ticket 04 auf Desktop und Handy
      (Spielansicht, flach, ganz heraus, Fall des Lichts beim Einstieg in den Bergwald nach dem Prolog, Lösen). Dazu
      kommen die Messwerte des Bretts, verglichen mit dem Steinbrett.
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

## Comments

**Katalog (06.11.2026):** acht Richtungen, https://claude.ai/artifact/NxHnBEMttQfErbf32u96zJ: Baumscheibe, Moospolster,
Granitblock mit Flechten, Kerbschnitt und Bauernmalerei, Fliegenpilz, Wurzelgeflecht, Papierlaterne und
Scherenschnitt. Quelle, Bilder und Skripte liegen in `katalog-wald/`, die Vorbilder in `vorbilder/wald.md`.

**Wahl des Nutzers (06.11.2026): Moospolster** (Karte 2), «super», ohne Änderungswünsche:

- Das Brett ist ein Stück Waldboden, das sich gelöst hat.
- Das Feld ist kurzes, samtiges Moos wie im Moostempel von Kyoto. Das Raster sind Linien aus hellem Silbermoos, eine
  Einlegelinie gibt es nicht, die Polster beginnen am Feld.
- Im Rand liegen dicke Moospolster mit leuchtenden Helmlingen, an den Ecken wächst Farn.
- Die Seiten sind eine Erdscholle mit Steinen, darunter hängen Wurzeln.
- Es gibt keine Spiegelung.
- Die Lichtwelle ist wie beim Waldgott in «Prinzessin Mononoke»: Wo der Ring vorbeizieht, blühen kleine weisse Blumen
  auf und welken hinter ihm wieder, und die Helmlinge leuchten auf.
- Kosten: Polster, Pilze, Farn und Blumen sind rund 2100 kleine Körper in wenigen Gruppen, dazu 70 Wurzeln. Das muss
  auf dem Handy gemessen werden, eventuell mit weniger und grösseren Teilen.
- Vorlage: `katalog-wald/bretter/varianten-wald/2-moos.js` mit `0-hilfe.js`, `0-wald.js` und `bretter.js`. Übernommen
  werden Formeln und Farben, nicht der Aufbau.
