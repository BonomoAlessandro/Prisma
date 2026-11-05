# 08: Dorf

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** ready-for-agent

**What to build:** Ein Brett für Noas Dorf bei Nacht (Kapitel «Im Dorf»).
Die Welt bekommt ihren eigenen Katalog mit 6 bis 8 völlig neuen Richtungen (wie Ticket 03), die dem
Strand nicht ähneln müssen (Entscheid des Nutzers vom 05.11.2026). Der Nutzer wählt eine, sie wird im Spiel gebaut,
fertig gemacht und abgenommen.

- [ ] **Katalog:** Vorbilder suchen und eine Vorschauseite mit 6 bis 8 völlig verschiedenen Richtungen für Noas Dorf bei Nacht
      bauen, wie in Ticket 03: echte Spielbilder mit zur Laufzeit eingesetztem Brett, je 4 Ansichten, Vorbilder mit
      Link, Idee, Raster, Einlegelinie, Spiegelung, Lichtwelle und Kostenhinweise. Der Katalog darf vor Ticket 05
      entstehen (er fasst `index.html` nicht an).
- [ ] **Wahl aus dem Katalog:** Der Nutzer wählt eine Richtung, eventuell mit Änderungswünschen. Die Wahl steht unter
      «Comments».
- [ ] **Im Spiel:** Die gewählte Richtung wird eine Art von Brett, wie das Gezeitenbecken in Ticket 04. Der Nutzer gibt
      an Bildern Rückmeldungen, bis sie sitzt.
- [ ] **Bilder und Leistung:** eine Vorschauseite mit denselben Ansichten wie in Ticket 04 auf Desktop und Handy
      (Spielansicht, flach, ganz heraus, Einstieg ins Dorf nach «Üben», Lösen einer Übung). Dazu kommen die Messwerte
      des Bretts, verglichen mit dem Steinbrett.
- [ ] **Brett-Angabe:** Die Werte stehen in der Brett-Angabe des Dorfs. Das Register wird nur in der Brett-Angabe
      nachgeführt, und das Prüfwerkzeug kennt die Werte.
- [ ] **Übergänge:** Alles bleibt ohne Steinbrett unter dem Dorf, ohne Löcher und ohne Ruckeln:
      - beim Einstieg ins Dorf nach «Üben» (davor die Milchstrasse mit Steinbrett),
      - beim Weg vom Dorf in den Bergwald, nach der 9. Übung und mit «Dorf überspringen»,
      - beim Fortsetzen nach dem Neuladen mitten im Dorf,
      - beim Wiederholen einer Übung aus der Übersicht.
- [ ] **Leistung:** Die Bildzeit steigt nicht messbar, und der Grafikspeicher bleibt etwa wie heute.
- [ ] **Abnahme:** Der Nutzer nimmt über eine Vorschauseite ab, erst dann wird committet.
- [ ] Alle Tests sind grün (Logik, offline, Geschichte-Probe mit `--dorf` und `--uebersicht`), und das Review nach dem
      Ticket ist gelaufen.

## Hinweise

- **Das Dorf:**
  - Es liegt hinter Noas Haus: ein Dorf mit Kirche am Hang, Gipfel mit Schnee und ein Sternenhimmel.
  - Noas Haus, Zaun, Hochbeet und drei Nachbarhäuser sind 3D-Modelle (`bakedMesh` house, neighbors), dazu kommen
    Glühwürmchen.
  - Der Grund liegt 4 m unter dem Brett.
- Das Dorf lädt erst beim Gebrauch (`vorab: false`).
- Das Dorf ist der Ort, an dem neue Spieler das Brett zum ersten Mal sehen. Die Übungen und ihre Hinweise müssen
  deshalb gut lesbar bleiben. Das Urteil darüber trifft der Nutzer an den Bildern.
