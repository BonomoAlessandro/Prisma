# 06: Würfel-Gruppe 3 in 7 × 7 × 5 (150 Level)

**Spec:** ../spec.md

**Blocked by:** 05

**Status:** resolved

**What to build:** 25 neue Würfel-Level 7 × 7 × 5 nach dem Ablauf einer Gruppe (Spec `wuerfel-500`), alle nach
der Ebenen-Regel. Neu je Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 6 / 2. Danach im Spiel: 28 / 82 / 28 / 12.

- [x] 25 neue Level, je Grad wie oben; Fehlmengen begründet und für die nächste Gruppe vermerkt.
- [x] Genau eine Lösung, Beurteilung bestanden, ab „mittel“ nötige Kernidee, Ebenen-Regel erfüllt, keinem anderen
      Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt; von beiden abgelehnte sind ersetzt.
- [x] Namen ohne Freigabe, eindeutig, gut unterscheidbar; Herkunft nachbaubar.
- [x] Golden-Referenz, alle Tests grün, Stichproben der Screenshots, auf `feature/3d-wuerfel` gepusht; Review.

## Comments

**26.10.2026, Koordinator: erledigt.** Im Spiel stehen jetzt 150 Würfel-Level, je Grad 28 / 82 / 28 / 12, wie in der Tabelle.

- **Wahl:** 4 / 13 / 6 / 2, mit 7 Tauschen gegen Häufungen.
  - Darunter war wieder Kandidat a1f97f10, der in Gruppe 2 ersetzt wurde (nur ein Strang, Füllteil). Er hatte schon ein Urteil, darum beurteilten die Tester in wuerfel-3-q nur 24. Er ist ersetzt.
  - Ab jetzt läuft jede Wahl mit `--ohne "$(cat tests/output/quader/ohne.txt)"`. Die Liste enthält a1f97f10 und d155f557.
- **KI-Tester:** wuerfel-3-q, 24 Kandidaten, keiner abgelehnt.
- **Ersatz für a1f97f10:** Mit dem Ersatz blieb auf Seite 11 „Sammelstelle“ 4-mal offen. Die Korrekturen der Tester an den gesetzten Kandidaten hatten d155f557 dorthin geschoben.
  - Darum ist auch d155f557 ersetzt. Er war unauffällig und wurde nur wegen der Häufung ersetzt.
  - Die beiden Ersatzlevel 12b0315e (leicht) und 796e71df (mittel) kamen in Lauf wuerfel-3-q2. Keiner ist abgelehnt, und danach ist keine Häufung mehr offen.
- **Namen:** Knopf, Springseil, Jojo, Kupferstich, Fresko, Hochofen, Mundharmonika, Hafenbecken, Kronleuchter, Seifenkiste, Hospiz, Postkutsche, Cello, Bugspriet, Heckentheater, Mykene, Milet, Uxmal, Olympia, Timgad, Hampi, Apeiron, Kepler, Schubkarre, Webstuhl.
  - Das Skript hätte für „mittel“ acht Instrumente nacheinander vergeben. Darum sind die Themen von Hand gemischt.
  - Nach Review 05 prüft das Skript auch gegen `entfernteNamen` und gegen Teilwörter.
- **Golden und Tests:** Golden nachgeführt (659 Level). Alle Tests mit Exit 0, jeder Test einzeln geprüft.

**26.10.2026, Reviewer: in Ordnung nach acht Umbenennungen.**

- **Umbenannt:**
  - Hochofen → Stickrahmen (dasselbe Grundwort wie Kachelofen, entfernt)
  - Seifenkiste → Kogge (Kiste wie Holzkiste, entfernt; dazu Seifenblase im flachen Spiel; als Seifenkiste auch kein Name für „mittel“)
  - Heckentheater → Galionsfigur (Theater wie Amphitheater, entfernt; dazu Theaterloge im Spiel)
  - Webstuhl → Schraubstock (Stuhl wie Glockenstuhl, entfernt; deshalb wich in Review 05 schon Chorgestühl)
  - Hafenbecken → Fayence (neben Hafenkran im Spiel, Hafeneinfahrt im flachen Spiel und Hafenmole, entfernt)
  - Schubkarre → Gummistiefel (leicht, fünf Plätze vor Schublade)
  - Apeiron → Fibonacci (Apeiron gehört zur Philosophie, nicht zur Mathematik; neben Aleph und Ewige Wiederkehr eine
    Häufung „das Unendliche“)
  - Cello → Triptychon (Plätze 94–103 hatten sieben Instrumente: Posaune, Marimba, Celesta, Clavichord, Cello, Trommel,
    Spinett)

  Das Skript prüft offenbar Teilwörter, aber kein gemeinsames Grundwort, also das Ende des Wortes. Fünf der acht Funde
  hätte ein Vergleich der Wortenden gefunden. Golden ist nachgeführt.
- **Geprüft, in Ordnung:**
  - Die Namen sind eindeutig über alle 659 Level, und keiner steht auf `entfernteNamen`. Teilen sich Namen nur das
    Bestimmungswort, bleiben sie, etwa Springseil (Springbrunnen) und Kupferstich (Kupferglanz).
  - Die Verteilung ist 28 / 82 / 28 / 12, neu 4 / 13 / 6 / 2.
  - Die Herkunft ist vollständig, mit Auftrag, Seed und Stand. 17 Level kommen neu mit Stand 74361c6. 8 sind umgerechnet:
    Sie haben den alten Stand und „gesenkt um N“, auch „gesenkt um 0“ wie im Bestand.
  - Protokoll: wuerfel-3-q hat 24 Urteile, 23 davon im Spiel und d155f557. wuerfel-3-q2 hat 2 Urteile, für 12b0315e und
    796e71df. Damit hat jedes der 25 neuen Level genau ein Urteil mit A und B, und keines ist abgelehnt.
  - Die Plätze der Anker steigen: 4/24/32/108/127/136/147/148 und 3/25/32/108/126/136/149/150.
  - d155f557 ist schlüssig. In `vorschau-3b.json` ist Seite 11 viermal „Sammelstelle“ (104, 105, 108 und 110,
    darunter d155f557 auf 104). In `vorschau-3c.json` und `vorschau-3d.json` ist er nicht mehr im Spiel.
    `ohne.txt` enthält genau a1f97f10 und d155f557, und beide fehlen im Spiel.
  - Die Ebenen-Regel gilt für alle 25. Die getroffenen Ebenen sind mindestens 3, und jedes Level steht am Boden.
    Fresko liegt mit den Ebenen 0–2 knapp darin.
  - Bilder, Stichproben L10 (Knopf), L11 (Fresko), L20 (d155f557) und L23 (Fibonacci): Die Level gehen über mehrere
    Ebenen, mit Elementen am Boden. Fresko liegt sichtbar in der unteren Hälfte.
- **Offen:**
  - Unter „mittel“ sind rund 15 der 82 Namen Instrumente. Neue Instrumente nur noch selten vergeben.
  - Das Namen-Skript sollte das gemeinsame Grundwort prüfen, also das Ende des Wortes, auch gegen `entfernteNamen`.
