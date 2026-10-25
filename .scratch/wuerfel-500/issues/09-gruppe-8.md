# 09: Würfel-Gruppe 8 (200 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 5 / 3.
Danach stehen 200 neue Würfel-Level im Spiel: 34 / 106 / 42 / 18 (dazu Aufzug und Kern).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 08

**Status:** resolved

- [x] 25 neue Level im Spiel, je Grad wie oben; Fehlmengen eines Grads sind begründet und für die nächste Gruppe
      vermerkt.
- [x] Jedes neue Level hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee und ist
      keinem anderen Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt (Protokoll); von beiden abgelehnte sind ersetzt.
- [x] Namen im bisherigen Stil vergeben, eindeutig über flache und Würfel-Level, keiner von der Liste entfernter Level
      (ohne Freigabe des Nutzers).
- [x] Herkunft jedes Levels (Auftrag, Seed, Ziel-Schwierigkeit) ist nachbaubar.
- [x] Golden-Referenz nachgeführt, alle Tests grün, Stichproben der Screenshots geprüft, auf `feature/3d-wuerfel`
      gepusht.

## Comments

**25.10.2026, Agent:** Gruppe 8 steht im Spiel: 25 neue Würfel-Level (4 / 13 / 5 / 3). Zusammen sind es jetzt 200 neue
(34 / 106 / 42 / 18), dazu Aufzug und Kern.
- **Wahl:** Die erste Wahl (wahl-8) ging durch und liess keine Häufung offen. Mittel hat 6-mal Abschalten, auch nach
  den Korrekturen der Tester ohne Häufung.
- **KI-Tester (wuerfel-8):** 22 Level beurteilt; die übrigen 3 hatten schon ein zählendes Urteil aus früheren Läufen.
  Keiner lehnt ab. L7 hat keinen Aha-Moment (Spiegeltreppe), bleibt aber als leichtes Level. L11, L15 und L16 sind am
  Handy schwach lesbar (A: 2 von 5). B meldet drei Level ganz in einer Ebene (L19, L5, L12). Das ist die offene Frage
  an den Nutzer; bis zu seinem Entscheid gilt die bisherige Regel.
- **Namen:** Der Vorrat für „mittel“ ist aufgestockt und geprüft (Handwerk, Bauteile, Wasserbau). Umbenannt nach
  Review 08: Chorgestühl → Lesepult (zu nah an Chorraum und Glockenstuhl).
- Golden nachgeführt, alle Tests grün. Stichproben der Screenshots stammen aus den Bildern der Tester.

**25.10.2026, Review:** Geprüft auf 5af54c2.
- **Herkunft:** Münze (mittel, Seed 20778, Stand 33f26f8) und Potala (schwer, Seed 20971, Stand 0d0edd0) mit
  `tools/ausbau.mjs pool … --wuerfel` auf dem Stand aus `git archive` nachgebaut; der Abdruck stimmt (5f3e2484,
  648647c1).
- **Urteile:** Alle 25 neuen haben ein zählendes Urteil. Die drei aus früheren Läufen sind Thermen (5fd08683),
  Apotheke (f3a6e4f2) und Escorial (9e0f14cb), alle aus wuerfel-7, keines von beiden abgelehnt. Bei Thermen nennt B
  Knäuel; das zählt als einzelne Ablehnung nicht.
- **Grade:** 34 / 106 / 42 / 18 wie bestandNach(8). `tests/wuerfelliste.test.mjs`: 12 Tests bestanden.
- **Namen, offen:** Wachturm trägt das Grundwort von Glockenturm und Rätselturm (dazu Turmzimmer, Turmopfer); nach Spec
  Schritt 5 umbenennen. Inhaltlich nah und dicht beieinander: Münze (Platz 136) und Börse (138), Taufbecken (140) und
  Baptisterium (147); Lesepult und Kanzel; Kolonie und Kolonnade sehen sich ähnlich; Hafenmole neben Hafenkran und
  Hafeneinfahrt. Vorschlag: in der nächsten Gruppe Wachturm, Börse und Taufbecken umbenennen, die übrigen beobachten.
