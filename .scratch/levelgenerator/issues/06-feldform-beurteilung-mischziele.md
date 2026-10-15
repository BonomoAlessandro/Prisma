# 06: Feldform und Beurteilung mit Mischzielen

**What to build:** Das gemeinsame Beurteilungsmodul entsteht mit einem einzigen Einstieg: Level hinein, Beurteilung
heraus. Es kennt das Feld nur über die Feldform. Als Erstes liefert es die Mischziele nach dem Glossar. Dieses Ticket
schafft das Gerüst, in das die Tickets 07–13 ihre Teile einhängen.

**Spec:** ../spec.md, Abschnitte „Feldform“ und „Beurteilung“.

**Blocked by:** 01 (Golden-Test)

**Status:** ready-for-agent

- [ ] Die Feldform für flache Felder liefert Zellen, Nachbarn, Richtungen sowie die Drehachse und die möglichen
      Stellungen eines Elements. x/y und die acht Richtungen kennt nur sie.
- [ ] Der Einstieg gibt eine Struktur mit allen Teilen der Spec zurück: Schwierigkeit, Spielwert, Kernideen, Mischziele
      und Ausschlüsse. Noch nicht berechnete Teile sind als solche erkennbar.
- [ ] Ein Mischziel ist ein Ziel, dessen Farbe im Level gemischt wird, durch einen Kombinator oder durch mehrere
      Strahlen auf dem Ziel. Weiss direkt aus einer weissen Quelle zählt nicht. Ein Mischziel aus zwei Quellen ist als
      solches gekennzeichnet.
- [ ] Mini-Level testen diese Fälle: Mischung im Kombinator, Mischung auf dem Ziel, Weiss aus weisser Quelle (kein
      Mischziel), zwei Strahlen derselben Quelle auf einem Ziel (Mischziel, aber nicht aus zwei Quellen).
- [ ] Auf den 150 heutigen Leveln haben 71 Level ein Mischziel und 38 eines aus zwei Quellen. Abweichungen sind
      begründet.
- [ ] Die alte Zählung im Löser bleibt vorerst, damit der Golden-Test grün bleibt. Sie fällt in Ticket 21 weg.
