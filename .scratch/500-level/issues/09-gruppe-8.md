# 09: Gruppe 8 (430 Level)

**What to build:** 35 neue Level aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je Grad (leicht /
mittel / schwer / sehr schwer): 5 / 19 / 7 / 4. Danach stehen 430 Level im Spiel: 74 / 227 / 90 / 39.

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 08

**Status:** done

- [x] 35 neue Level im Spiel, je Grad wie oben; Fehlmengen eines Grads sind begründet und für die nächste Gruppe
      vermerkt.
- [x] Jedes neue Level hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee und ist
      keinem anderen Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt (Protokoll); von beiden abgelehnte sind ersetzt.
- [x] Namen im bisherigen Stil vergeben, eindeutig, keiner von der Liste entfernter Level (ohne Freigabe des Nutzers).
- [x] Herkunft jedes Levels (Auftrag, Seed, Ziel-Schwierigkeit) ist nachbaubar.
- [x] Golden-Test-Referenz nachgeführt, alle Tests grün, Stichproben der Screenshots geprüft, auf main gemergt.

## Comments

## Comments

**Ergebnis (22.10.2026, Branch `ausbau/09-gruppe-8`)**

- **Wahl:** `ausbau-8` fand bei allen Startwerten eine Wahl ohne Fehler, aber mit 28 unbeurteilten Leveln; die
  Vorbereitung für die KI-Tester habe ich abgebrochen. `ausbau-8-2` nur über beurteilte Kandidaten (Vorräte
  `ausbau-v-oben`, `-v-mittel`, `-v-mittel-oben`, `-v-leicht`) fand beim ersten Startwert eine Wahl ohne Fehler,
  ohne neue Korrekturrunde.
- **Im Spiel:** 430 Level, 74 / 227 / 90 / 39, genau nach der Tabelle.
- **Neu:** Lupe, Kerzenlicht, Fackel, Lichtkugel, Sternchen (leicht); Funkenregen, Sternenregen, Lichtspiel, Silhouette, Scherenschnitt, Intarsie, Filigran, Ornament, Arabeske, Ranke, Blütenblatt, Lotus, Orchidee, Iris, Lavendel, Flieder, Hortensie, Tulpe, Narzisse (mittel); Schachzug, Gambit, Zugzwang, Springergabel, Turmopfer, Endspiel, Räderwerk (schwer); Galaxis, Spiralnebel, Kugelsternhaufen, Roter Riese (sehr schwer).
- **KI-Tester:** alle 35 aus den Vorräten beurteilt, keines abgelehnt oder schwach.
- **Werkzeug:** keine Codeänderung, darum kein Review.
- **Tests:** Logik 1388, Levelliste 54, KI-Tester 65, Golden 439 (nach `--write`), Beurteilung 178, alle grün.
  Stichprobe: Orchidee (274, Desktop) und Zugzwang (342, Handy), ohne Befund.
