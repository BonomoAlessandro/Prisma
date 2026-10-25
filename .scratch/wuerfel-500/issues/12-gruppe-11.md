# 12: Würfel-Gruppe 11 (275 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 6 / 2.
Danach stehen 275 neue Würfel-Level im Spiel: 47 / 146 / 58 / 24. Aufzug und Kern sind nicht mehr im Spiel (Entscheid vom 25.10.2026).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 11

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

**25.10.2026, Agent:** Gruppe 11 steht im Spiel: 25 neue Würfel-Level (4 / 13 / 6 / 2). Zusammen sind es jetzt 275
(47 / 146 / 58 / 24).
- **Pool erweitert (pool-3):** Bei „mittel“ waren Abschalten, Falle und Farben abzählen knapp. Deshalb kamen neue
  Kandidaten für diese drei Kernideen dazu: Seeds 21201–22800 bei „mittel“ (500 Kandidaten), 21201–22000 bei
  „schwer“ (130) und 22401–22800 bei „sehr schwer“ (7, dort bringt mehr Generieren kaum etwas). Die Dateien liegen
  in tests/output/wuerfel/pool-3/ und gehen ab jetzt in die Pool-Liste der Wahl ein. Floss (mittel-abschalten,
  Seed 21742) stammt schon daraus.
- **Wahl:** Die erste Wahl (wahl-11) liess keine Häufung offen. Nach den Korrekturen der Tester blieben aber drei
  offen: Seite 10 mit Sammelstelle 4-mal, Seite 12 und Seite 16 mit Abschalten je 4-mal. Ersetzt wurden cc8e8791,
  d20a7450 und a9e73605 (wahl-11b, Lauf wuerfel-11-2). Danach blieben Seite 10 und Seite 12 offen. Deshalb wurden
  auch d6b3a5dd und ce2214f9 ersetzt (wahl-11c, Lauf wuerfel-11-3). Danach blieb keine Häufung offen.
- **KI-Tester (wuerfel-11, -11-2, -11-3):** 29 Kandidaten beurteilt, keiner von beiden abgelehnt. Am schwächsten
  bewerten beide Utopia: Gefühl 3, am Desktop und am Handy je 2 von 5, wegen zehn Spiegeln an der Ostwand und
  einer langen blauen Schleife. Kein Knäuel. Am Handy bekommen von A auch Sigiriya, Banach-Tarski, Fatehpur Sikri
  und Göbekli Tepe eine 2. Die stärksten Level (Gefühl 5) sind Sigiriya, Banach-Tarski und Fatehpur Sikri.
- **Namen nach Review 11:** umbenannt Zinngießer → Federkiel, Deckenfresko → Pergola, Kandelaber → Abakus,
  Kupferstich → Dudelsack, Krabbe → Senkblei, Wimperg → Draisine, Kai → Kajüte.
- **Namen der Gruppe:** Hypercube habe ich von Hand durch Banach-Tarski ersetzt. Es bedeutet dasselbe wie
  Hyperwürfel und Tesserakt und ist englisch.
- Golden nachgeführt (784 Level, davon 275 Würfel), alle Tests grün. Stichproben der Screenshots stammen aus den
  Bildern der Tester.
