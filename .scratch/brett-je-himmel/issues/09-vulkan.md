# 09: Vulkan

**Spec:** ../spec.md

**Blocked by:** 08, dazu der neue Vulkan-Krater auf `main` (Branch `feature/vulkan-krater`, ausserhalb dieser Spec)

**Status:** ready-for-agent

**What to build:** Ein Brett für den Vulkan in der Richtung, die am Strand gewählt wurde, auf dem fertigen neuen Krater.
Wir zeigen 2 bis 3 Varianten im Spiel, der Nutzer wählt eine, sie wird fertig gebaut und abgenommen.

- [ ] **Vorher main holen:** `main` mit dem neuen Krater wird in den Branch geholt. Die Brett-Angabe in der
      `skybox.json` des Vulkans und das Register werden dabei zusammengeführt: Der Krater bringt neue Teile mit, die
      Brett-Angabe bleibt `stone`. Danach müssen alle Tests grün sein.
- [ ] **Varianten:** 2 bis 3 Varianten innerhalb der gewählten Richtung, abgestimmt auf Fels und Lava bei Nacht
      (Material, Farben im Licht der Lava). Sie sind über den Schalter in der Adresse umschaltbar, wie in Ticket 04.
- [ ] **Bilder und Leistung:** eine Vorschauseite mit denselben Ansichten wie in Ticket 04 auf Desktop und Handy
      (Spielansicht, flach, ganz heraus, Fall des Lichts beim Einstieg in den Vulkan mit dem Blick über die Kraterwand,
      Lösen). Dazu kommen die Messwerte je Variante.
- [ ] **Wahl des Nutzers:** Die Wahl steht unter «Comments». Danach wird die gewählte Variante fertig gebaut, und die
      übrigen werden entfernt.
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
