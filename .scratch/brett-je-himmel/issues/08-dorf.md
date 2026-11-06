# 08: Dorf

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** ready-for-agent

**What to build:** Ein Brett für Noas Dorf bei Nacht (Kapitel «Im Dorf»).
Die Welt bekommt ihren eigenen Katalog mit 6 bis 8 völlig neuen Richtungen (wie Ticket 03), die dem
Strand nicht ähneln müssen (Entscheid des Nutzers vom 05.11.2026). Der Nutzer wählt eine, sie wird im Spiel gebaut,
fertig gemacht und abgenommen.

- [x] **Katalog:** Vorbilder suchen und eine Vorschauseite mit 6 bis 8 völlig verschiedenen Richtungen für Noas Dorf bei Nacht
      bauen, wie in Ticket 03: echte Spielbilder mit zur Laufzeit eingesetztem Brett, je 4 Ansichten, Vorbilder mit
      Link, Idee, Raster, Einlegelinie, Spiegelung, Lichtwelle und Kostenhinweise. Der Katalog darf vor Ticket 05
      entstehen (er fasst `index.html` nicht an).
- [x] **Wahl aus dem Katalog:** Der Nutzer wählt eine Richtung, eventuell mit Änderungswünschen. Die Wahl steht unter
      «Comments».
- [ ] **Im Spiel:** Die gewählte Richtung wird eine Art von Brett, wie das Gezeitenbecken in Ticket 04. Der Nutzer gibt
      an Bildern Rückmeldungen, bis sie sitzt.
- [ ] **Eigene Lichtwelle:** Das Brett bekommt seine eigene Lichtwelle aus seiner Welt, wie die Blumen beim
      Moospolster: Wo der Ring vorbeizieht, passiert etwas auf dem Brett und kommt danach wieder zur Ruhe.
      Gewählt mit dem Brett (Katalog Version 2): Wo der Ring vorbeizieht, keimen neben den Schnüren Reihen von
      Sämlingen auf, und Glühwürmchen steigen aus Erde und Kräutern. Hinter dem Ring ziehen sich die Keimlinge in die
      Erde zurück, die Glühwürmchen schweben noch kurz und verlöschen. Das passt zu den Glühwürmchen im Dorf.
      Sie kommt als Bildfolge oder kurzes Video auf die Vorschauseite.
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

## Comments

**Katalog (06.11.2026):** acht Richtungen, https://claude.ai/artifact/6tyN2oGW1VJRwVB3CXNTEG: Laube, Flickendecke,
Dorfplatz nach dem Regen, Hochbeet, Buntes Glas, Himmelslaterne, Kachelofen und Altes Spielbrett. Quelle, Bilder und
Skripte liegen in `katalog-dorf/`, die Vorbilder in `vorbilder/dorf.md`.

**Wahl des Nutzers (06.11.2026): Hochbeet** (Karte 4), mit der Lichtwelle der Karte:

- Das Brett ist das Hochbeet aus Noas Garten.
- Im Feld liegt frisch gerechte, dunkle Erde. Das Raster sind helle Pflanzschnüre zwischen Holzpflöcken, mit kleinem
  Schatten. Die Einlegelinie ist eine Reihe heller Kiesel.
- Im Rand wachsen Kräuter: Schnittlauch mit lila Blüten, Thymian, Ringelblumen und Salat.
- Die Seiten sind Lärchenbohlen, oben liegt ein Abdeckbrett, 8 cm über der Erde.
- Es gibt keine Spiegelung, Erde ist matt.
- Lichtwelle: Glühwürmchen steigen aus Erde und Kräutern auf, wo der Ring vorbeizieht, und schweben nach. In Version 2
  des Katalogs (nach der Wahl veröffentlicht) keimen dazu Reihen von Sämlingen neben den Schnüren und ziehen sich
  hinter dem Ring zurück, rund 1200 Keimlinge im Shader. Der Nutzer will diese Version 2 (06.11.2026).
- Kosten: rund 1800 Halme, Blätter und Blüten und 420 Glühwürmchen. Auf dem Handy zu messen, eventuell gröber. Mit
  kleinen Formen aus Blender wären Kräuter und Blüten deutlich schöner.
- Lesbarkeit: Das Dorf ist für neue Spieler das erste Brett. Die dunkle Erde gibt den Strahlen guten Kontrast,
  die Pflanzschnüre müssen als Raster gut sichtbar bleiben.
- Vorlage: `katalog-dorf/bretter/varianten-dorf/4-hochbeet.js` mit `0-hilfe.js`, `0b-dorf.js` (Hilfen `waveMat`,
  `sparks`, `waveInst` für Körper, die nur in der Welle wachsen) und `bretter.js`.
