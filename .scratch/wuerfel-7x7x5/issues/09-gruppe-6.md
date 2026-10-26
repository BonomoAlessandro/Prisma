# 09: Würfel-Gruppe 6 in 7 × 7 × 5 (225 Level)

**Spec:** ../spec.md

**Blocked by:** 08

**Status:** resolved

**What to build:** 25 neue Würfel-Level 7 × 7 × 5 nach dem Ablauf einer Gruppe (Spec `wuerfel-500`), alle nach
der Ebenen-Regel. Neu je Grad (leicht / mittel / schwer / sehr schwer): 4 / 12 / 6 / 3. Danach im Spiel: 40 / 120 / 45 / 20.

- [x] 25 neue Level, je Grad wie oben; Fehlmengen begründet und für die nächste Gruppe vermerkt.
- [x] Genau eine Lösung, Beurteilung bestanden, ab „mittel“ nötige Kernidee, Ebenen-Regel erfüllt, keinem anderen
      Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt; von beiden abgelehnte sind ersetzt.
- [x] Namen ohne Freigabe, eindeutig, gut unterscheidbar; Herkunft nachbaubar.
- [x] Golden-Referenz, alle Tests grün, Stichproben der Screenshots, auf `feature/3d-wuerfel` gepusht; Review.

## Comments

**26.10.2026, Koordinator: erledigt.** Im Spiel stehen jetzt 225 Würfel-Level, je Grad 40 / 120 / 45 / 20, wie in der Tabelle.

- **Häufungen und Entscheide** (Auftrag des Nutzers: bei Unklarheiten selbst entscheiden):
  - **Seite 16, „Sammelstelle“ 5-mal bei mittel:** Sieben mittlere Sammelstelle-Level lagen auf 11 Plätzen. Die KI-Tester hatten viele um +5 ans obere Ende von „mittel“ geschoben. Eine eingeschränkte Wahl brachte nur neue Häufungen.
    - Entscheid: Barkasse, Klüver, Relief und Besanmast (der Review 08 nannte es Töpfer) sind aus dem Spiel genommen. Alle kamen erst in diesem Umbau dazu und waren nie auf main.
  - **Seite 4, „Abschalten“ 4-mal bei leicht:** Verursacht durch die engen leichten Kandidaten aus Gruppe 5, die ich selbst so eingeschränkt hatte.
    - Entscheid: Kissen und Eierbecher sind entfernt.
  - **Nach den Korrekturen der Tester, Seite 4, „Sammelstelle“ 3-mal bei leicht:** Vogeltränke ist entfernt.
  - Alle entfernten Namen stehen auf `entfernteNamen`, ihre Abdrücke in `ohne.txt`.
  - Die Gruppe wählt dafür 32 statt 25, netto bleiben es 25.
- **Werkzeug:** `wuerfel.mjs wahl --ohne @datei` liest die Liste aus einer Datei. Die Kommandozeile war für 2600 Namen zu kurz.
- **KI-Tester:**
  - **wuerfel-6-q:** 31 Kandidaten in einem Lauf. Ich habe entschieden, nicht aufzuteilen, weil das nur Bilder kostet. Abgelehnt: 87e8f9e0 (sehr schwer, Knäuel und Probieren).
  - **wuerfel-6-q2:** zwei Ersatzlevel, 215e6df2 (sehr schwer) und 5d36eac0 (leicht), keines abgelehnt.
- **Namen:** Vorne im Vorrat stehen jetzt 338 neue Namen, die streng geprüft und gemischt sind. Ein Helfer hat sie gesammelt.
  - Kuscheltier, Guetzli, Planschbecken, Sandschaufel, Duschvorhang, Lineal, Faltenrock
  - Walmdach, Glockengiesser, Ständerbau, Batik, Scagliola, Planierraupe, Omnibus, Vergolder, Ukulele, Seladon, Stuckateur, Stechbeitel, Leuchtbake, Kapstan, Kürschner, Papyrus
  - Luxor, Kilwa, Nimrud, Bhaktapur, Aspendos, Calakmul
  - Hypatia, Hardy, Fakultät
  - Gegen eine Häufung von Kunsttechniken sind vier Namen von Hand getauscht.
- **Golden und Tests:** Golden nachgeführt (734 Level). Alle Tests mit Exit 0.
