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

**26.10.2026, Reviewer: in Ordnung nach fünfzehn Umbenennungen** (Branch `review/quader-09`).

- **Entfernte Level:** schlüssig.
  - Vier mittlere Sammelstelle-Level lagen auf 11 Plätzen, dazu die leichten Häufungen auf Seite 4.
  - Abdrücke in `ohne.txt`: 78e6fda8 (Barkasse), 6ad3ca9b (Klüver), 49205964 (Relief), 6e50b96e (Töpfer),
    11ed58c9 (Kissen), 0cc217ca (Eierbecher), 5d51e9b1 (Vogeltränke), dazu der abgelehnte 87e8f9e0.
  - Keiner der acht ist im Spiel. Kein Test und kein Werkzeug nennt die Namen, nur `tools/levelliste.json`.
  - **Behoben:** Töpfer fehlte auf `entfernteNamen`. Nach dem Merge von Review 08 stand das Level unter diesem Namen
    im Spiel, deshalb ist Töpfer ergänzt. Besanmast bleibt auf der Liste.
- **Werkzeug:** `--ohne @datei` ist korrekt.
  - Nachgeführt: der Kopf (der Umbruch war zerrissen) und der Aufruf in Kopf und Fehlermeldung.
  - Die Datei darf jetzt auch eine Zeile je Kandidat haben.
- **Umbenannt:**
  - Leicht:
    - Guetzli → Sparschwein. Guetzli ist ein Keks, Keksdose steht auf Platz 1.
    - Kuscheltier → Fotoalbum. Kuscheltier ist der Oberbegriff zu Teddybär, 6 Plätze davor.
    - Faltenrock → Toaster. Mütze, Strickjacke und Faltenrock waren drei Kleider auf 11 Plätzen.
  - Mittel:
    - Seladon → Sattler. Seladon lag direkt neben Gouache, beides Kunsttechniken.
    - Batik → Böttcher. Batik lag 3 Plätze vor Fresko.
    - Scagliola → Heissluftballon. Scagliola lag direkt vor Lithografie, Papyrus 3 Plätze davor.
    - Kapstan → Schreiner. Ein Kapstan ist fast dasselbe wie die Ankerwinde (12 Plätze davor), dazu kommt Bugspriet 2 Plätze daneben.
    - Ukulele → Schaluppe. Ukulele lag direkt neben Okarina, wie Balalaika in Review 08.
    - Glockengiesser → Marionette. „Glocken“ steckt in Glockenspiel und Glockenturm (flach), und Drechsler lag 3 Plätze davor.
    - Leuchtbake → Hochrad. „Leucht“ steckt in Kronleuchter und vier flachen Namen, und Leuchtfeuer ist fast dasselbe.
    - Ständerbau → Färber. Ständerbau und Mittelbau lagen nebeneinander, beide enden auf „bau“.
    - Stuckateur → Synagoge. Stuckateur und Steinmetz lagen nebeneinander, beides Handwerk am Bau.
  - Schwer:
    - Nimrud → Volubilis. Nimrud und Ninive lagen 2 Plätze auseinander, beides assyrische Hauptstädte.
    - Bhaktapur → Masada. Harappa, Sanchi und Bhaktapur waren drei südasiatische Stätten auf 4 Plätzen.
    - Aspendos → Skara Brae. Aspendos lag 4 Plätze vor Ephesos, beides antike Städte in Kleinasien.
  - Die neuen Namen kommen nirgends sonst vor, auch nicht auf `entfernteNamen` oder als Teilwort.
    - Verworfen, weil schon vergeben oder entfernt: Pavillon, Pagode, Krypta, Kanzel, Rikscha, Viadukt, Petra, Knossos und Lalibela.
    - Ebenfalls verworfen: Bildhauer und Seiler, wegen „Bild“ und „Seil“.
  - Die alten Namen waren nie auf main, deshalb nicht auf `entfernteNamen`.
  - Golden ist nachgeführt.
- **Geprüft, in Ordnung:**
  - Die Verteilung ist 40 / 120 / 45 / 20. Neu sind 7 / 16 / 6 / 3 = 32, entfernt 3 / 4 / 0 / 0.
  - Die Herkunft der 32 steht im Spiel. Stichproben in den Pools stimmen: Seeds 60940, 71520, 80394 und 21634.
  - Protokoll:
    - Jedes neue Level hat genau ein Urteil: 30 aus wuerfel-6-q, dazu 215e6df2 und 5d36eac0 aus wuerfel-6-q2.
    - 87e8f9e0 ist abgelehnt (Knäuel, Probieren) und nicht im Spiel.
    - Die Plätze der Anker steigen: 2/25/38/143/165/181/197/198, danach 2/32/41/159/182/202/221/222 (q) und 2/32/41/159/182/202/223/224 (q2).
  - Bilder, Stichproben aus wuerfel-6-q: L11 (Volubilis, vorher Nimrud), L17 (Sparschwein, vorher Guetzli) und
    L20 (Böttcher, vorher Batik). Jedes geht über mehrere Ebenen und hat Elemente am Boden.
- **Offen:**
  - Mittel hat viele Instrumente: Okarina, Alphorn, Posaune, Marimba, Celesta, Trommel, Spinett, Clavichord und
    Bandoneon auf den Plätzen 120–157. Bei den nächsten Gruppen keine weiteren nehmen.
  - Hardy (207) und Ramanujan (218) sind ein bekanntes Paar. Sie liegen 11 Plätze auseinander und bleiben.
  - Der neue Vorrat war nicht streng genug: 15 von 32 Namen sind ersetzt. Vor der nächsten Gruppe sollte er gegen
    Teilwörter in den flachen Namen und gegen Nachbarn im Spiel geprüft werden.
- **Tests:** Exit 0 bei wuerfelliste, levelliste, ki-tester, beurteilung, logic und golden.
