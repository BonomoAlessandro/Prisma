# 03: Gruppe 2 (220 Level)

**What to build:** 35 neue Level aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je Grad (leicht /
mittel / schwer / sehr schwer): 5 / 19 / 8 / 3. Danach stehen 220 Level im Spiel: 42 / 112 / 47 / 19.

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] 35 neue Level im Spiel, je Grad wie oben; Fehlmengen eines Grads sind begründet und für die nächste Gruppe
      vermerkt.
- [x] Jedes neue Level hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee und ist
      keinem anderen Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt (Protokoll); von beiden abgelehnte sind ersetzt.
- [x] Namen im bisherigen Stil vergeben, eindeutig, keiner von der Liste entfernter Level (ohne Freigabe des Nutzers).
- [x] Herkunft jedes Levels (Auftrag, Seed, Ziel-Schwierigkeit) ist nachbaubar.
- [ ] Golden-Test-Referenz nachgeführt, alle Tests grün, Stichproben der Screenshots geprüft, auf main gemergt.

## Comments

**Ergebnis (21.10.2026, Branch `ausbau/03-gruppe-2`)**

- **Im Spiel:** 220 Level, 42 / 112 / 47 / 19 nach der Tabelle; keine Fehlmenge. Neu: Taschenlampe, Lichtpunkt,
  Glühbirne, Leuchtkäfer, Kinderspiel (leicht); Ocker, Karmin, Ultramarin, Malachit, Lapislazuli, Jade, Topas, Granat,
  Achat, Onyx, Citrin, Aquamarin, Elfenbein, Perlglanz, Seidenglanz, Goldstaub, Silbermond, Kupferglanz, Messing
  (mittel); Gewürzroute, Entdeckungsreise, Polarfahrt, Weltreise, Pilgerweg, Jakobsweg, Gebirgspfad, Gratwanderung
  (schwer); Orion, Kassiopeia, Sirius (sehr schwer).
- **KI-Tester, vier Läufe** (`ausbau-2` 35, `ausbau-2-2` 20, `ausbau-2-3` 12, `ausbau-2-4` 6): abgelehnt 4
  (Scheinmischung 1, Zerfall 1, Füllteil 2), schwach 1 (leicht, Gefühl 2,5). Im ersten Lauf waren 32 von 35 gut, die
  Vorprüfung auf Zerfall wirkt.
- **Was Läufe kostete:** Die Korrekturen der KI-Tester verschieben die Level; mehrere korrigierte Level nahe beieinander
  schieben einander über 5 Plätze, dann lässt die Häufungsregel keinen Zug zu, und `ordne-level.mjs` schreibt nicht.
  Die Wahl kannte die Korrekturen erst nach dem Urteil. Darum je Ersatz neue Tausche und neue Urteile (35 → 20 → 12 →
  6). Werkzeug dazu (alle in `tools/ausbau.mjs`):
  - Die Suche bewertet zu weit korrigierte Level vor offenen Häufungen.
  - Sie nimmt bevorzugt Kandidaten mit Urteil; bei gleich gutem Ergebnis gewinnt die Wahl mit weniger Leveln ohne
    Urteil. `--nur-beurteilt` wählt nur aus beurteilten (für die nächsten Gruppen: zuerst etwa 50 beurteilen lassen,
    dann daraus wählen).
  - `--schritte`, `--zufall` (anderer Startwert), Paar- und Mehrfachtausch gegen offene Häufungen.
  - `pool --schwierigkeit VON,BIS`: Das obere Ende von „schwer“ (75–86) trifft der Generator sonst kaum; dort
    standen Odyssee, Halo und Lichtbrücke so dicht, dass erst Kandidaten aus diesem Bereich die Häufung lösten. Die
    Ziel-Schwierigkeit steht in der Herkunft (Kommentar des Levels).
  - Die Vorprüfung auf Zerfall ist ab „mittel“ strenger: kein zweiter Teil mit drehbarem Element
    (`ZWEITER_TEIL_AB_MITTEL`), weil beide KI-Tester einen Strang aus Quelle, einem Spiegel und Ziel mit fester
    Zweitfarbe dreimal als Füllteil ablehnten.
- **Pools** (nicht versioniert, `tests/output/ausbau/`): Pool 3 (9 Aufträge × 600 Seeds ab 10601), oberes „schwer“
  (6 × 1200 ab 20001, Ziel 72–86 bzw. 75–86), oberes „mittel“ (6 × 400 ab 20001, Ziel 52–58).
- **Tests:** Logik 758, Levelliste 51, KI-Tester 65, Golden 229 (nach `--write`), Beurteilung 178, alle grün.
  Stichprobe: Karmin (51) und Sirius (210), Desktop und Handy, ohne Befund.
