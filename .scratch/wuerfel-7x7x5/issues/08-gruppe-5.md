# 08: Würfel-Gruppe 5 in 7 × 7 × 5 (200 Level)

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** resolved

**What to build:** 25 neue Würfel-Level 7 × 7 × 5 nach dem Ablauf einer Gruppe (Spec `wuerfel-500`), alle nach
der Ebenen-Regel. Neu je Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 6 / 2. Danach im Spiel: 36 / 108 / 39 / 17.

- [x] 25 neue Level, je Grad wie oben; Fehlmengen begründet und für die nächste Gruppe vermerkt.
- [x] Genau eine Lösung, Beurteilung bestanden, ab „mittel“ nötige Kernidee, Ebenen-Regel erfüllt, keinem anderen
      Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt; von beiden abgelehnte sind ersetzt.
- [x] Namen ohne Freigabe, eindeutig, gut unterscheidbar; Herkunft nachbaubar.
- [x] Golden-Referenz, alle Tests grün, Stichproben der Screenshots, auf `feature/3d-wuerfel` gepusht; Review.

## Comments

**26.10.2026, Koordinator: erledigt.** Im Spiel stehen jetzt 200 Würfel-Level, je Grad 36 / 108 / 39 / 17, wie in der Tabelle.

- **Häufung an der Grenze leicht/mittel:** Die Wahl liess Seite 4 offen, „Sammelstelle“ bei leichten Leveln (erlaubt sind 2).
  - Im Spiel lagen fünf leichte Sammelstelle-Level auf 9 Plätzen: Vogeltränke, Kommode, Federball, Stockwerk, Steckenpferd, mit Schwierigkeit 37–41. Bei höchstens 2 je Seite bräuchten sie mehr als 20 Plätze. Kein Tausch löst das, und „leicht“ endet direkt danach.
  - **Lösung:** Federball (Gruppe 4) und Steckenpferd (Gruppe 2) sind aus dem Spiel genommen. Beide kamen erst in diesem Umbau dazu und waren nie auf main.
  - Ihre Namen stehen trotzdem auf `entfernteNamen`, ihre Abdrücke in `ohne.txt`.
  - Die Gruppe wählt dafür 6 statt 4 leichte, nur aus dem Bereich 37–42,5 ohne Sammelstelle.
  - Dafür gibt es einen neuen Pool `pool-2-leicht-oben.jsonl`: Stand b80d994, `--schwierigkeit 37,42.5`, 5 Aufträge × 1500 Seeds, 1561 Kandidaten.
  - Gewählt sind 27, netto kommen 25 dazu. Danach ist keine Häufung offen.
- **KI-Tester:** wuerfel-5-q mit 26 Kandidaten. Einer, 6ad3ca9b, war schon in Lauf wuerfel-4-q beurteilt und damals nur wegen einer Häufung getauscht.
  - Keiner abgelehnt. d05409a4 (sehr schwer) bekam einmal Knäuel, nur von A.
  - Der Lauf hatte 26 statt höchstens 25 Kandidaten.
- **Namen:** Türklinke, Strickjacke, Handtuch, Zahnpasta, Kamm, Nachttisch, Kalvarienberg, Wallfahrtskirche, Barbican, Segelflugzeug, Kupferkessel, Steinmetz, Kerzenzieher, Brigg, Lastenaufzug, Drechsler, Balalaika, Klüver, Besanmast, Konark, Khajuraho, Anuradhapura, Sukhothai, Nikko, Gyeongju, Chaos, Ramanujan.
  - Alle sind streng geprüft. Instrumente und Entropie (Physik) sind von Hand ersetzt.
  - Der Vorrat an mittleren Namen, die die strengen Regeln bestehen, ist knapp. Für die nächsten Gruppen braucht es neue.
- **Golden und Tests:** Golden nachgeführt (709 Level). Alle Tests mit Exit 0.

**26.10.2026, Reviewer: in Ordnung nach zwölf Umbenennungen** (Branch `review/quader-08`).

- **Umbenannt:**
  - Leicht: Zahnpasta → Wecker, Kamm → Eierbecher, Handtuch → Kissen.
    - Zahnpasta und Zahnbürste (Platz 25) sind fast dasselbe Ding und teilen „Zahn“.
    - Auf 25–35 standen vier Dinge aus dem Bad: Zahnbürste, Handtuch, Zahnpasta, Kamm.
    - Handtuch lag 14 Plätze neben Handschuh, beide mit „Hand“.
  - Mittel:
    - Barbican → Sänfte. Barbican ist das englische Wort für Barbakane (Platz 111).
    - Kalvarienberg → Gouache. Kalvarienberg und Wallfahrtskirche lagen 5 Plätze auseinander, beide zum Thema Wallfahrt.
    - Segelflugzeug → Schlitten. „Segelflug“ steckt darin, und Rundflug wie Funkenflug enden auf „flug“.
    - Kupferkessel → Korvette. Kupferstich liegt 9 Plätze daneben, dazu kommt Kupferglanz.
    - Balalaika → Gondel. Balalaika ist ein Instrument direkt neben Okarina, obwohl Instrumente selten bleiben sollen.
    - Besanmast → Töpfer. „Mast“ steckt in Dreimaster, und Klüver ist 6 Plätze davor schon ein Teil der Takelage.
  - Schwer: Konark → Paestum, Khajuraho → Aksum, Nikko → Ugarit.
    - Konark, Ellora, Hampi und Khajuraho waren vier indische Tempelstätten auf den Plätzen 146–152.
    - Nikko und Torii lagen direkt nebeneinander, beide Schreine in Japan.
  - Kein Name ist doppelt, keiner steht auf `entfernteNamen`, keiner hat ein Teilwort oder ein gleiches Wortende.
    - Carnac und Persepolis sind verworfen: Carnac klingt wie Karnak, Persepolis endet wie Akropolis.
  - Die alten Namen waren nie auf main, deshalb nicht auf `entfernteNamen` (wie Wandteppich und Ikone in Review 07).
  - Golden ist nachgeführt.
- **Federball und Steckenpferd:**
  - Das Herausnehmen ist schlüssig. Fünf leichte Sammelstelle-Level lagen auf 9 Plätzen. Erlaubt sind 2 je Seite, und „leicht“ endet bei Platz 36.
  - Die Namen stehen auf `entfernteNamen`. Die Abdrücke 44b81127 und 9d71adf8 stehen in `ohne.txt`.
  - Kein Test und kein Werkzeug nennt sie, nur `tools/levelliste.json`.
- **Geprüft, in Ordnung:**
  - Die Verteilung ist 36 / 108 / 39 / 17.
  - `pool-2-leicht-oben.jsonl`: 1561 Kandidaten, alle mit Stand b80d994, Ziel [37, 42,5], Seeds 80001–81500. Die sechs neuen leichten Level stehen darin mit gleichem Abdruck.
  - Herkunft und Kommentar passen. Die anderen 21 kommen aus bestehenden Pools.
  - Protokoll: wuerfel-5-q hat 26 Urteile, alle 26 sind im Spiel. Jedes der 27 neuen Level hat genau ein Urteil.
  - Die Plätze der Anker steigen: 2/25/36/126/145/158/173/174 und danach 2/25/38/143/165/181/197/198.
  - Bilder, Stichproben wuerfel-5-q:
    - L7 (Türklinke), L2 (Eierbecher, vorher Kamm) und L26 (Nachttisch).
    - Jedes geht über mehrere Ebenen und hat Ziele am Boden.
- **Korrektur zum Kommentar:**
  - Der Kandidat mit dem Urteil aus wuerfel-4-q ist **e92487d8** (jetzt Aksum, vorher Khajuraho), nicht 6ad3ca9b.
  - 6ad3ca9b (Klüver) ist in wuerfel-5-q beurteilt (L25).
- **Offen:**
  - Der Pool hat 4 Aufträge (leicht, leicht-falle, leicht-abschalten, leicht-mischziel), der Kommentar nennt 5.
  - Kerzenzieher teilt „Kerzen“ mit Kerzenschein und Kerzenlicht (flach). Steinmetz teilt „Stein“ mit Steinkreis. Beide Namen bleiben.
  - Der Vorrat ist knapp, bei den mittleren und den schweren Namen.
    - Nicht-indische und nicht-japanische Stätten bevorzugen.
    - Kein Name sollte ein Grundwort eines anderen enthalten, wie „flug“ oder „mast“.
- **Tests:** Exit 0 bei wuerfelliste, levelliste, ki-tester, beurteilung, logic und golden.
