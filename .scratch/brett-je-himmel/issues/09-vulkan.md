# 09: Vulkan

**Spec:** ../spec.md

**Blocked by:** 08 (der neue Vulkan-Krater ist seit 05.11.2026 auf `main`, 504adbb, und im Branch: Merge 0fc5cee)

**Status:** ready-for-agent

**What to build:** Ein Brett für den Vulkan, auf dem fertigen neuen Krater.
Die Welt bekommt ihren eigenen Katalog mit 6 bis 8 völlig neuen Richtungen (wie Ticket 03), die dem
Strand nicht ähneln müssen (Entscheid des Nutzers vom 05.11.2026). Der Nutzer wählt eine, sie wird im Spiel gebaut,
fertig gemacht und abgenommen.

- [x] **Vorher main holen:** erledigt am 05.11.2026 (Merge 0fc5cee). Das Register enthält den neuen Krater (rev
      584a34b8) mit der Brett-Angabe `stone`. Logiktests, Offline-Probe und Geschichte-Probe «leicht» waren grün.
- [x] **Katalog:** Vorbilder suchen und eine Vorschauseite mit 6 bis 8 völlig verschiedenen Richtungen für den Vulkan
      bauen, wie in Ticket 03: echte Spielbilder mit zur Laufzeit eingesetztem Brett, je 4 Ansichten, Vorbilder mit
      Link, Idee, Raster, Einlegelinie, Spiegelung, Lichtwelle und Kostenhinweise. Der Katalog darf vor Ticket 05
      entstehen (er fasst `index.html` nicht an).
- [x] **Wahl aus dem Katalog:** Der Nutzer wählt eine Richtung, eventuell mit Änderungswünschen. Die Wahl steht unter
      «Comments».
- [ ] **Im Spiel:** Die gewählte Richtung wird eine Art von Brett, wie das Gezeitenbecken in Ticket 04. Der Nutzer gibt
      an Bildern Rückmeldungen, bis sie sitzt.
- [ ] **Eigene Lichtwelle:** Das Brett bekommt seine eigene Lichtwelle aus seiner Welt, wie die Blumen beim
      Moospolster: Wo der Ring vorbeizieht, passiert etwas auf dem Brett und kommt danach wieder zur Ruhe.
      Gewählt mit dem Brett: Glut steigt in den Fugen der Säulen auf, und die Köpfe der Randsäulen leuchten
      nacheinander auf. Achte auf Bloom.
      Sie kommt als Bildfolge oder kurzes Video auf die Vorschauseite.
- [ ] **Bilder und Leistung:** eine Vorschauseite mit denselben Ansichten wie in Ticket 04 auf Desktop und Handy
      (Spielansicht, flach, ganz heraus, Fall des Lichts beim Einstieg in den Vulkan mit dem Blick über die Kraterwand,
      Lösen). Dazu kommen die Messwerte des Bretts, verglichen mit dem Steinbrett.
- [ ] **Brett-Angabe:** Die Werte stehen in der Brett-Angabe des Vulkans. Das Register wird nur in der Brett-Angabe
      nachgeführt, und das Prüfwerkzeug kennt die Werte.
- [ ] **Übergänge:** Auf der Reise von der Wüste zum Vulkan und vom Vulkan zu den Planeten (dort das Steinbrett) und
      beim Wiederholen über diese Weltgrenzen bleibt alles ohne falsches Brett, ohne Löcher und ohne Ruckeln.
- [ ] **Leistung:** Die Bildzeit steigt nicht messbar, und der Grafikspeicher bleibt etwa wie heute.
- [ ] **Abnahme:** Der Nutzer nimmt über eine Vorschauseite ab, erst dann wird committet.
- [ ] Alle Tests sind grün (Logik, offline, Geschichte-Probe), und das Review nach dem Ticket ist gelaufen.

## Hinweise

- **Der neue Krater** (Stand Krater-Branch, 05.11.2026):
  - Er ist etwa doppelt so weit (Ufer 53 m) und hat einen Rand bei 60 m.
  - Es ist Nacht, und die Lava ist das Hauptlicht (satte Glut).
  - Im Kapitel Vulkan schaut die Kamera weniger hoch (`up` 0.65).
  - Der Lavasee (`lavaPool`) liegt unter dem Brett und wird nah am Brett gedämpft (`calm`). Dazu kommen Felsen
    (`bakedMesh`).
- **Budget:** Der Vulkan wird vorab gespeichert. Eine Form aus Blender zählt deshalb zur Grenze von 4,5 MB. Reicht der
  Platz nicht, fragen wir den Nutzer.
- Auf dem Branch des Kleinen Wagens steht der Stern des Vulkans «über der Kraterwand». Ist der Kleine Wagen schon auf
  `main`, kommt er mit.

## Comments

**Katalog (06.11.2026):** acht Richtungen am neuen Krater, https://claude.ai/artifact/M9QffoMkGcgwSn2geoCjWv: Obsidian,
Basaltsäulen, Stricklava, Amboss, Bimsfloss, Schwefelquelle, Höhlenstadt und Drachenhort. Quelle, Bilder und Skripte
liegen in `katalog-vulkan/`, die Vorbilder in `vorbilder/vulkan.md`. Die Fassung von `bretter.js` dort rechnet die
Weltposition für Instanzen richtig, in den Katalogen von Wüste und Wald ist das noch falsch.

**Wahl des Nutzers (06.11.2026): Basaltsäulen** (Karte 2), mit der Lichtwelle der Karte:

- Das Brett ist das Ende eines Bündels sechseckiger Basaltsäulen wie am Giant’s Causeway.
- Im Feld sind die Säulen eben geschliffen, man sieht nur ihre feinen Fugen. Das Raster sind feine helle Linien
  über den Fugen, die Einlegelinie ist hellgrau.
- Im Rand stehen die Säulen in Stufen, nach aussen tiefer, einzelne etwas höher.
- Unten hängen sie verschieden lang herab wie an der Decke der Fingalshöhle, und ihre Enden fangen das Licht der Lava.
- Leichte Spiegelung, der Basalt ist geschliffen.
- Lichtwelle: Glut steigt in den Fugen auf, und die Köpfe der Randsäulen leuchten nacheinander auf. In Version 2 des
  Katalogs (nach der Wahl veröffentlicht) heben sich dazu die Säulen des Felds eine Handbreit, ihre Flanken glühen
  orange, und hinter dem Ring sinken sie zurück und die Fugen verglimmen. Der Nutzer will diese Version 2 (06.11.2026).
- Kosten: rund 940 Säulen als ein Körper mit Instanzen, auf dem Handy zu messen. Der stufige Rand verkleinert den
  Kernquader etwas.
- Vorlage: `katalog-vulkan/bretter/varianten-vulkan/2-basalt.js` mit `0-hilfe.js` und `bretter.js` aus demselben Ordner.
