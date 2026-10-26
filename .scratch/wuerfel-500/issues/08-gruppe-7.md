# 08: Würfel-Gruppe 7 (175 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 6 / 2.
Danach stehen 175 neue Würfel-Level im Spiel: 30 / 93 / 37 / 15 (dazu Aufzug und Kern).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 07

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

**25.10.2026, Agent:** Gruppe 7 steht im Spiel: 25 neue Würfel-Level (4 / 13 / 6 / 2), zusammen 175 neue (30 / 93 / 37 / 15)
plus Aufzug und Kern.
- **Wahl:** Vier Anläufe. wahl-7 und wahl-7b liessen auf Seite 4 (Mischziel aus zwei Quellen) eine Häufung offen, auch
  nach dem Tausch in der Wahl. Gelöst mit einem zweiten Zug in `entzerre` (tools/levelliste.mjs): Neben dem Rücken
  tauschen zwei Level desselben Grads die Plätze, eingeschaltet nur für den Würfel (`tauschen` in wuerfelliste.mjs). Die
  flache Reihenfolge bleibt gleich (Golden unverändert). Neuer Test in tests/levelliste.test.mjs. ordne-wuerfel meldet
  den Zug als „tauscht Platz a mit b“.
- **KI-Tester (wuerfel-7):** 24 Level neu beurteilt; Kandidat 9d64221d hatte schon ein Urteil aus wuerfel-6, das ihn
  nicht ablehnt. A lehnt L17 ab (Scheinmischung), B lehnt L6 ab (Knäuel). Keines ist von beiden abgelehnt.
- **Ersatz (wuerfel-7-2):** Nach den Korrekturen der Tester stand Abschalten auf Seite 8 (Plätze 71–80) 4-mal. Allein
  Kandidat 9e0f14cb zu ersetzen reichte nicht: Zwischen den Plätzen 62 und 86 stehen 10 Level mit Abschalten. Darum sind
  auch 5fd08683 und f3a6e4f2 ersetzt, alle drei durch a431ecfc, 11e82f7c und fc439dc2. Beide Tester haben die drei
  beurteilt, keiner lehnt ab.
- **Namen:** Nach den Regeln von Spec Schritt 5. Der Vorrat ist aufgestockt und gegen alle Namen im Spiel und die
  entfernten geprüft. Umbenannt nach Review 07: Haustür → Fingerhut, Kapelle → Kanzel, Kasematte → Tribüne.
- **Test:** In tests/beurteilung/feldform-wuerfel.test.mjs zählte der Test die Drehungen am ersten Element. Bei
  Brotkorb steht die Quelle auf der Mittelachse (3,6,3), daher nimmt der Test jetzt das erste Element neben der Achse.
- Golden nachgeführt, alle Tests grün. Stichproben der Screenshots geprüft (L6 desktop, Ersatz L2 handy).
- **Für später:** Im mittleren Bereich ist Abschalten dicht; die nächsten Wahlen sollten dort weniger davon nehmen.
