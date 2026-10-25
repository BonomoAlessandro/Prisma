# 10: Würfel-Gruppe 9 (225 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 5 / 13 / 5 / 2.
Danach stehen 225 neue Würfel-Level im Spiel: 39 / 119 / 47 / 20. Aufzug und Kern sind nicht mehr im Spiel (Entscheid vom 25.10.2026).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 09

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

**25.10.2026, Agent:** Gruppe 9 steht im Spiel: 25 neue Würfel-Level (5 / 13 / 5 / 2). Zusammen sind es jetzt 225
(39 / 119 / 47 / 20).
- **Aufzug und Kern entfernt** (Wunsch des Nutzers: sie waren nur zum Testen). Sie bleiben als feste Beispiele für
  die Tests der Beurteilung in `tests/wuerfel-handgebaut.mjs`. `HANDGEBAUT` ist aus `tools/wuerfelliste.mjs`
  entfernt; jedes Würfel-Level braucht jetzt ein Urteil der KI-Tester. Mit Aufzug verschwindet auch der einzige
  Hinweis in der Kopfzeile (Achsen-Hinweis); das ist dem Nutzer gemeldet.
- **Anker W3:** Kern war Anker A2, neu ist es Blumentopf (leicht, Falle, nicht verschoben). Urteile früherer
  Versionen zählen weiter.
- **Wahl:** Ohne die zwei Level rückten alle um bis zu zwei Plätze vor, dadurch waren Sammelstelle auf Seite 4 und
  Farben abzählen auf Seite 11 je viermal da. wahl-9b setzt die neuen Kandidaten so dazwischen, dass keine Häufung
  offen bleibt (6 Tausche).
- **KI-Tester (wuerfel-9):** 25 Level beurteilt, keiner lehnt ab. Wollknäuel (leicht) hat für A keinen Aha-Moment,
  für B schon. Am Handy schwach lesbar (2 von 5): Riemann und Projektive Ebene bei beiden, Palenque bei beiden,
  Teotihuacán bei B. Kein Level liegt ganz in einer Ebene.
- **Namen:** Umbenannt nach Review 09: Wachturm → Kachelofen, Börse → Spinnrad, Taufbecken → Amboss. Die
  Grundwort-Prüfung beim Benennen vergleicht jetzt mit flachen und Würfel-Namen und kennt kurze Grundwörter
  (…uhr, …dom, …hof, …tor). Dadurch fielen Förderturm, Altarbild, Kuckucksuhr, Petersdom und Lorenz-Attraktor weg.
- Golden nachgeführt, alle Tests grün. Stichproben der Screenshots stammen aus den Bildern der Tester.
