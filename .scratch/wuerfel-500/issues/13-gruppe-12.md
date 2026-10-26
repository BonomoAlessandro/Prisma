# 13: Würfel-Gruppe 12 (300 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 5 / 3.
Danach stehen 300 neue Würfel-Level im Spiel: 51 / 159 / 63 / 27. Aufzug und Kern sind nicht mehr im Spiel (Entscheid vom 25.10.2026).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 12

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

**26.10.2026, Agent:** Gruppe 12 steht im Spiel: 25 neue Würfel-Level (4 / 13 / 5 / 3). Zusammen sind es jetzt 300
(51 / 159 / 63 / 27, genau 17 / 53 / 21 / 9 %).
- **Korrektur zu Ticket 12 (Befund aus Review 12):** Dort stand „alle Tests grün“, das stimmte nicht.
  wuerfelliste.test.mjs schlug bei der Herkunft von Floss fehl: Der Stand war „1df6ca5+“, weil pool-3 entstand,
  während index.html ungesichert geändert war. Mein Testskript zeigte nur die letzte Zeile jedes Tests. Behoben:
  - Floss trägt jetzt „Stand 1df6ca5“; der Reviewer hat Floss auf dem sauberen Commit nachgebaut.
  - pool-3 ist auf „1df6ca5“ umgestempelt (637 Zeilen; die alten liegen in tests/output/wuerfel/pool-3-alt-stempel/).
  - Das Testskript meldet jetzt jede Zeile, die nicht „ok“ ist, und den Exit-Code.
- **Namen nach Review 12:** umbenannt Dock → Zisterne, Voliere → Pechnase, Rechenschieber → Bügeleisen,
  Brunnenschacht → Rikscha, Briefbeschwerer → Bücherstütze, Nadelkissen → Kaffeemühle, Kontrabass → Gemüsebeet,
  Ziehharmonika → Zinnsoldat. Die Gründe stehen im Kommentar des Reviewers. Von seinen Vorschlägen haben nur
  Pechnase und Bücherstütze die Ähnlichkeitsprüfung bestanden, die übrigen Namen sind aus dem Vorrat.
- **Wahl und Ersatz:**
  - Die erste Wahl (wahl-12) liess Seite 6 offen (Sammelstelle 3-mal).
  - Nach den Urteilen (wuerfel-12) lehnten beide Tester 1965cb63 und 926299f9 (sehr schwer) als „Knäuel“ ab. Dazu
    kamen offene Häufungen auf den Seiten 13, 15 und 16. Ersatz in drei Runden: mit 23 gesetzten (wahl-12b),
    dann die 13 mittleren neu gewählt (wahl-12c), dann die leichten (wahl-12d).
  - Seite 6 blieb offen: Platz 51 ist das letzte leichte Level, Stockwerk (Sammelstelle, KI-Tester +4). Zusammen
    mit Palisade und Taubenschlag (mittel) stehen dort 3 Sammelstellen, alle drei schon im Spiel. Ein besonders
    schweres leichtes Level (9297d73c, Lauf wuerfel-12-2) rückte nicht hinter Stockwerk. Beide Tester sahen darin
    Füllteil und Zerfall. Es ist wieder entfernt.
  - **Entscheid des Nutzers (26.10.2026): diese Häufung an der Grenze leicht/mittel dulden.** Umgesetzt als
    GRENZ_DULDUNG in tools/wuerfelliste.mjs (nur Stockwerk). Für Stockwerk gilt die Grenze ab „mittel“ (3), eine
    vierte Sammelstelle würde weiter gemeldet. Dazu die Option obenAuch in reihenfolge (tools/levelliste.mjs).
  - Danach war Seite 21 offen (Falle 4-mal). 17200e6e ist ersetzt durch db8c5149 (wahl-12f, Lauf wuerfel-12-3).
    Danach blieb keine Häufung offen.
- **KI-Tester (wuerfel-12, -12-2, -12-3):** Von beiden abgelehnt wurden nur die zwei Knäuel oben und 9297d73c
  (Füllteil und Zerfall, das bei „leicht“ nicht zählt; trotzdem ersetzt). Die 25 Level im Spiel lehnt keiner ab.
  Am Handy schwach (2 von 5): Hausdorff bei B.
- **Pool:** Vor allem bei „mittel“ stammen 11 der 13 neuen Level aus pool-3 (Falle 10-mal). Ohne die Erweiterung
  wäre Falle bei „mittel“ nicht zu füllen gewesen.
- **Namen der Gruppe:** Der Vorrat für „mittel“ war leer (alle übrigen scheitern am Grundwort). Er ist um 14 Geräte
  und Instrumente der Messkunst aufgestockt (Theodolit, Gnomon, Geodreieck …). Von Hand ersetzt: Blumenvase →
  Strohhut (Blumen… wie Blumentopf).
- Golden nachgeführt (809 Level, davon 300 Würfel), alle Tests grün. Exit-Code 0 bei allen, im neuen Skript
  geprüft. Stichproben der Screenshots stammen aus den Bildern der Tester.
