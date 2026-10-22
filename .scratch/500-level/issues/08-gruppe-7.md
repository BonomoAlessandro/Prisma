# 08: Gruppe 7 (395 Level)

**What to build:** 35 neue Level aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je Grad (leicht /
mittel / schwer / sehr schwer): 6 / 19 / 7 / 3. Danach stehen 395 Level im Spiel: 69 / 208 / 83 / 35.

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 07

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

**Runden der Wahl (22.10.2026):** `ausbau-7` ohne Wahl ohne Fehler, überall offen 251–260 „Farben abzählen“ 4-mal
(Messing, Neptun, Abendlicht, Brandung; das obere Ende von „mittel“ war ohne Level ohne Haupt-Kernidee dicht gepackt).
Vorrat `ausbau-v-mittel-oben`: 30 Kandidaten „mittel“ ab Schwierigkeit 56,5 ohne „Farben abzählen“, keiner abgelehnt
oder schwach. Danach `ausbau-7-2` (mit den 14 unbeurteilten der ersten Wahl gesetzt) unverändert, `ausbau-7-3` nur
über beurteilte: 251–260 aufgelöst, dafür andere Häufungen zwischen vorhandenen Leveln auf 201–230; dazu fehlten
beurteilte leichte Kandidaten (Vorrat `ausbau-v-leicht`, 25 Kandidaten, in Arbeit).

**Entscheid des Nutzers (22.10.2026):** Im Ausbau gilt auch für „mittel“ höchstens 3-mal dieselbe Haupt-Kernidee je
10 Level (wenn alle Level der Häufung ab „mittel“ sind); nur „leicht“ bleibt bei 2. Umgesetzt durch
`GRADE_OBEN = ['mittel', 'schwer', 'sehr schwer']` in `tools/levelliste.mjs`, Texte in `ausbau.mjs`, `ordne-level.mjs`
und im Test angepasst. Die Reihenfolge im Spiel ordnet sich beim Schreiben der Gruppe wieder leicht anders.

Vorrat `ausbau-v-leicht`: 25 Kandidaten „leicht“, einer schwach (Gefühl 2/3) und ausgeschlossen. Danach fand die Wahl
mit der neuen Regel nur über beurteilte Kandidaten (`ausbau-7-4`) beim ersten Startwert eine Wahl ohne Fehler.

**Ergebnis (22.10.2026, Branch `ausbau/08-gruppe-7`)**

- **Im Spiel:** 395 Level, 69 / 208 / 83 / 35, genau nach der Tabelle.
- **Neu:** Glanzpapier, Lichtfleck, Abzweigung, Kurve, Torbogen, Fensterglas (leicht); Titan, Europa, Kallisto,
  Ganymed, Phobos, Deimos, Mondsichel, Halbmond, Vollmond, Neumond, Mondfinsternis, Dämmerung, Abenddämmerung,
  Morgendämmerung, Zwischenlicht, Gegenschein, Nachglühen, Abendglut, Glut (mittel); Orakel, Rätselturm, Zauberwürfel,
  Puzzlestück, Knobelei, Kopfnuss, Denksport (schwer); Hyaden, Magellanwolke, Milchstrasse (sehr schwer).
- **KI-Tester:** alle 35 aus Vorräten und früheren Läufen beurteilt, keines abgelehnt oder schwach im Spiel; ohne neue
  Korrekturrunde.
- **Tests:** Logik 1283, Levelliste 54, KI-Tester 65, Golden 404 (nach `--write`), Beurteilung 178, alle grün.
  Stichprobe: Ganymed (131, Handy) und Knobelei (331, Desktop), ohne Befund.
