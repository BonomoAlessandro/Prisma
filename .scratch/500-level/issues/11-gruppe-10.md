# 11: Gruppe 10 (500 Level)

**What to build:** 35 neue Level aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je Grad (leicht /
mittel / schwer / sehr schwer): 6 / 19 / 7 / 3. Danach stehen 500 Level im Spiel: 85 / 265 / 105 / 45.

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 10

**Status:** done

- [x] 35 neue Level im Spiel, je Grad wie oben; Fehlmengen eines Grads sind begründet und für die nächste Gruppe
      vermerkt.
- [x] Jedes neue Level hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee und ist
      keinem anderen Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt (Protokoll); von beiden abgelehnte sind ersetzt.
- [x] Namen im bisherigen Stil vergeben, eindeutig, keiner von der Liste entfernter Level (ohne Freigabe des Nutzers).
- [x] Herkunft jedes Levels (Auftrag, Seed, Ziel-Schwierigkeit) ist nachbaubar.
- [x] Golden-Test-Referenz nachgeführt, alle Tests grün, Stichproben der Screenshots geprüft, auf main gemergt.
- [x] Die Verteilung entspricht der Zielverteilung der Spec (85 / 265 / 105 / 45); in PLAN.md ist das Ziel
      nachgeführt.

## Comments

## Comments

**Vorrat `ausbau-v2`** (20 leicht, 20 mittel, 12 sehr schwer): zwei von beiden abgelehnt (Kandidat 8a76a70d, sehr
schwer: Knäuel, Probieren; Kandidat d6bb936c, mittel: Zerfall, Füllteil), ausgeschlossen. KI-Tester A hatte auch die
acht Anker beurteilt; merge lehnt das ab, darum habe ich nur diese acht Einträge aus seiner Antwort entfernt (die
Urteile zu den 52 Kandidaten unverändert; das Original liegt als `urteile.mit-ankern.json` daneben).

**Ergebnis (22.10.2026, Branch `ausbau/11-gruppe-10`)**

- **Wahl:** `ausbau-10` nur über beurteilte Kandidaten, beim ersten Startwert ohne Fehler.
- **Im Spiel:** 500 Level, 85 / 265 / 105 / 45, genau das Ziel der Spec.
- **Neu:** Zitronengelb, Grasgrün, Himmelblau, Kirschrot, Rosenrot, Lindgrün (leicht); Lichtkasten, Guckkasten, Prismenglas, Brillenglas, Linse, Brennpunkt, Lichtstrahl, Strahlengang, Umlenkspiegel, Kehrspiegel, Spiegelpaar, Doppelbild, Spiegelschrift, Rückspiegel, Seitenspiegel, Wechselspiel, Pingpong, Waagschale, Gleichgewicht (mittel); Steinkreis, Observatorium, Planetarium, Himmelsscheibe, Tierkreis, Sternzeichen, Mondbahn (schwer); Gravitation, Gezeitenkraft, Raumzeit (sehr schwer).
- **Name:** „Fluchtgeschwindigkeit“ (21 Zeichen) brach in der Kachel der Levelauswahl mitten im Wort; ersetzt durch
  „Raumzeit“ („Ereignishorizont“ ging nicht, er steht auf der Liste der entfernten Namen).
- **KI-Tester:** alle 35 aus den Vorräten beurteilt, keines abgelehnt oder schwach.
- **Tests:** Logik 1598, Levelliste 54, KI-Tester 65, Golden 509 (nach `--write`, dazu `--voll`: Löser für alle
  509 Level), Beurteilung 178, alle grün. Stichprobe: Spiegelschrift (290, Desktop), Platz 496 (Handy, langer Name
  umbrochen) und die Levelauswahl (Abschnitte 9 / 85 / 265 / 105 / 45, letzte Seite 491–500, ohne Konsolenfehler).
