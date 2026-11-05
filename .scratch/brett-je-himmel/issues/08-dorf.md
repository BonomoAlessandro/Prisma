# 08: Dorf

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** ready-for-agent

**What to build:** Ein Brett für Noas Dorf bei Nacht (Kapitel «Im Dorf») in der Richtung, die am Strand gewählt wurde.
Wir zeigen 2 bis 3 Varianten im Spiel, der Nutzer wählt eine, sie wird fertig gebaut und abgenommen.

- [ ] **Varianten:** 2 bis 3 Varianten innerhalb der gewählten Richtung, abgestimmt auf das Dorf bei Nacht (Material,
      Farben im Licht des Dorfs). Sie sind über den Schalter in der Adresse umschaltbar, wie in Ticket 04.
- [ ] **Bilder und Leistung:** eine Vorschauseite mit denselben Ansichten wie in Ticket 04 auf Desktop und Handy
      (Spielansicht, flach, ganz heraus, Einstieg ins Dorf nach «Üben», Lösen einer Übung). Dazu kommen die Messwerte
      je Variante.
- [ ] **Wahl des Nutzers:** Die Wahl steht unter «Comments». Danach wird die gewählte Variante fertig gebaut, und die
      übrigen werden entfernt.
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
