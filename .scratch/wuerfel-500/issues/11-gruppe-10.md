# 11: Würfel-Gruppe 10 (250 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 4 / 14 / 5 / 2.
Danach stehen 250 neue Würfel-Level im Spiel: 43 / 133 / 52 / 22. Aufzug und Kern sind nicht mehr im Spiel (Entscheid vom 25.10.2026).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 10

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

**25.10.2026, Agent:** Gruppe 10 steht im Spiel: 25 neue Würfel-Level (4 / 14 / 5 / 2). Zusammen sind es jetzt 250
(43 / 133 / 52 / 22).
- **Wahl:** Die erste Wahl (wahl-10) liess keine Häufung offen. Nach den Korrekturen der Tester blieben aber Seite 9
  mit Abschalten 6-mal und Seite 10 mit Sammelstelle 4-mal. Ersetzt wurden 4100b3ff, b09e40f2 und c0fd7282
  (wahl-10b, Lauf wuerfel-10-2). Danach rückte der Ersatz 2b43ea8c (Sammelstelle, −5) auf Seite 10, auch er ist
  ersetzt (wahl-10c, Lauf wuerfel-10-3). Danach blieb keine Häufung offen.
- **KI-Tester (wuerfel-10, -10-2, -10-3):** 29 Kandidaten beurteilt, keiner von beiden abgelehnt. B nennt bei Ewige
  Wiederkehr „Knäuel“, A nicht. Am Handy schwach lesbar (2 von 5): Ewige Wiederkehr und Xanadu bei beiden, Isfahan
  bei B. Kein Aha für A bei Radiergummi und Teddybär (beide leicht).
- **Namen nach Review 10:** umbenannt Spinnrad → Gobelin (Grundwort …rad wie Zahnrad), Konsolfries → Kupferstich
  (nah an Konsole), Bibliothekar → Sekretär (nah an Bibliothek von Babel), Wollknäuel → Nudelholz („Knäuel“ ist ein
  Begriff der Beurteilung), Kerzenleuchter → Ochsenauge (nah an Kerzenlicht, Kerzenschein). Die Grundwort-Prüfung
  kennt jetzt auch …rad.
- **Namen der Gruppe:** Von Hand ersetzt wurden Goldschmied (nah an Schmiede), Blasebalg (zu Amboss und Schmiede),
  Gummistiefel (zweites …gummi neben Radiergummi) sowie Triglyphe, Akanthus und Volute. Diese drei sind Bauornamente
  wie Metope und Kapitell. Der Vorrat für „mittel“ ist fast leer: Die meisten Namen darin scheitern am Grundwort
  (…haus, …erei, …werk). Vor Gruppe 11 stocke ich ihn auf.
- Golden nachgeführt, alle Tests grün. Stichproben der Screenshots stammen aus den Bildern der Tester.
