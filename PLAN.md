# PRISMA – Plan und offene Punkte

Hier stehen alle Punkte, die wir noch umsetzen wollen. Erledigtes wird abgehakt (`[x]`) und bleibt zur
Nachvollziehbarkeit stehen. Neue Wünsche kommen einfach als neuer Punkt dazu.

**Legende:** `[ ]` offen · `[~]` in Arbeit · `[x]` erledigt · **E** = Entscheidung des Nutzers nötig

Zuletzt aktualisiert: 7. Oktober 2026 (abends)

---

## Ziel

- **Tutorial + 70 Level:** Zuerst ein kurzes Tutorial (6 Level), das die Mechaniken zeigt: Spiegel, feste Spiegel
  und Blöcke, Prisma, Filter, farbige Quellen, Kombinator, je mit einem Hinweis in der Kopfzeile. Danach 70 Level, **allein nach
  Schwierigkeit sortiert** (leicht → schwer), ohne Gruppierung nach Elementen oder Anzahl Komponenten. Die Level 51–70
  sind alle schwerer als Level 50.
- **Leitlinien für alle Level:**
  1. Elemente und Farben mischen sich frei: Spiegel, Prismen, Filter, Kombinatoren, Blöcke, farbige Quellen.
  2. Die Level sollen Spass machen, teilweise zum Grübeln anregen und qualitativ stark sein.
  3. Je weiter man kommt, desto schwerer.
- Die Levelauswahl blättert in Seiten (Tutorial, 1–10, …, 61–70). Die Seiten sind keine Kapitel und haben kein Thema.

---

## 1. Entscheidungen (offen)

- [x] **E3 · Tutorial überspringen?** Erledigt durch E5: Alle Level sind jederzeit spielbar.
- [x] **E4 · Farbige Quellen im Tutorial:** eigenes Tutorial-Level „Farbiges Licht“ vor dem Kombinator.
- [x] **E5 · Kein Freischalten:** Alle Level (auch Tutorial) sind jederzeit spielbar; gelöste Level bleiben markiert.
- [x] **E6 · Level 74 und 79 bleiben** vorerst drin: Die Kandidaten S19/S40 (`tools/pools/review6/`) liegen auf dem
  anderen Rechner. Der Austausch kann dort nachgeholt werden (siehe 2.11).

## 2. Tutorial + 70 Level (aktuelle Arbeit)

- [x] **2.1 Struktur:** Kapitel entfernt; Tutorial mit Hinweisen, 50 Level nach Wertung, Levelauswahl mit Seiten,
  Fortschritt nach Levelname (alte Schlüssel „II:Name“ werden übernommen).
- [x] **2.2 Generator-Profile** (`tools/profiles.mjs`): Grössenstufe 1–5 × Mischung (Spiegel, Prisma, Filter,
  farbige Quellen, Kombinator, bunt). Farbige Quellen im Generator. Pools mit `tools/pools.mjs`.
- [x] **2.3 Kuratierung** (`tools/curate.mjs`): alle Pools + handgebaute Level, 50 gleichmässig über die Wertung,
  verschiedene Grundmuster, abwechselnde und ausgewogene Mischungen; Review der Auswahl und der Reihenfolge.
- [x] **2.3b Zweites Review** mit zwei unabhängigen Testern (Spielersicht ohne Kennzahlen, analytisches
  Spielermodell), abgeglichen in zwei Runden: Reihenfolge neu (Rangkorrelation der Tester 0.91 → Abstand im Mittel
  unter 2 Plätzen), 4 Level ersetzt (Kopie eines Tutorial-Levels, Dopplung, zwei wirkungslose Filter). Tutorial:
  „Farbenlehre“ umgebaut (Filter jetzt nötig), „Mischung“ mit festen Spiegeln entschärft, Hinweise zu Mischen auf
  dem Ziel und Prisma auf einfarbigem Licht. Berichte in `tools/pools/review2/` (nicht versioniert).
- [ ] **2.4 Feedback des Nutzers:** Alle 70 Level anspielen: Steigt die Schwierigkeit spürbar? Langweilige oder
  unfaire Level? Passt der Übergang vom Tutorial und von Level 50 zu 51?
- [ ] **2.5 Oberes Ende:** Über Wertung ~40 gibt es nur wenige Kandidaten (Stufe 5 ist langsam, Filter-Profil ohne
  Ausbeute). Bei Bedarf Stufe 5 länger laufen lassen und die letzten Level ersetzen.
- [ ] **2.7 Generator: wirkungslose Filter verwerfen** (Strahl hat schon die Filterfarbe – bei rund 1/3 der
  Filter-Level im Pool). Ebenso feste Spiegel, die nie für die Lösung zählen und kaum als Lockvogel wirken.
- [ ] **2.8 Lesbarkeit im Spiel** (aus dem Review): Blaue Ziele wirken fast weiss; die Richtung des Kombinators ist
  auf Distanz schwer zu erkennen; „Weiss + Rot im Kombinator = Weiss“ wird nirgends gezeigt.
- [x] **2.9 Level 51–70 (schwerer als Level 50):** `tools/harden.mjs` macht erzeugte Level schrittweise schwerer
  (lokale Suche; Quellen müssen gekoppelt sein, Feld kaum dichter als bei den 50 – auch nach dem Abschluss geprüft,
  `curate.mjs` und ein Test prüfen dasselbe). Pools harden-1 bis -6: 121 Kandidaten (Wertung 44–56.6; harden-6 lieferte
  mit 18 Prozessen 73 Level in einer Stunde). Strahlverfolgung 2,2× schneller (gleiche Ergebnisse, im Code-Review an
  22 800 Strahlbildern nachgeprüft). Code-Review, Befunde behoben.
  **Review** (`tools/pools/review4/`, nicht versioniert): 20 per `curate.mjs --keep 50` gewählte + 12 Reserven,
  gemischt und anonym, an zwei Tester (Spielersicht: alle 32 ohne Löser gelöst; Analyst: Spielermodell
  `player.mjs`, Holzwege `traps.mjs`). 7 gewählte ersetzt (zu erzwungen/Fleiss: Spiegeltreppen, Prismenreihe,
  Zerlegen-und-Vereinen; R09 als ermüdendes Knäuel), 7 Reserven aufgenommen. Reihenfolge aus beiden Rangfolgen
  nach zwei Runden (Rangkorrelation 0.06 → 0.50; einig bei Anfang und den schwersten drei). Die Wertung trifft die
  menschliche Schwierigkeit in diesem Band kaum (ρ ≈ 0.26) – siehe 3.5. Testlauf dauert gut 2 Minuten (vorher 7 s).
- [~] **2.11 Level 71–80 (mindestens so schwer wie 51–70):** Zwei Läufe harden-7/-8 (73 Kandidaten), Vorsieb mit dem
  Spielermodell (`tools/pools/review5/screen.mjs`: Denkaufwand, Raten, Holzwege, Scheinkombinatoren; geeicht an Review 4),
  59 bestanden, 30 + 10 Reserven an zwei Tester (`tools/pools/review6/`). Der Analyst empfahl nur 10 (echtes Mischziel
  aus zwei Quellen, kein Fleissteil, keine Scheinmischung) – diese 10 sind eingebaut (Reihenfolge des Analysten).
  **Spieler-Tester** (nach dem Commit, `review6/tester-spieler.md`): empfiehlt 20. Einig mit dem Analysten bei 8 der
  10 eingebauten; **strittig: Level 74 „Spiegelkabinett“ (S36, Spiegeltreppe) und 79 „Nebelfeld“ (S07, Kombinator nur
  Umlenker)** – der Spieler würde sie streichen. Beide Tester wählen S19 und S40 (beim Analysten Reserve).
  **E · Vorschlag:** S36 und S07 durch S19 und S40 ersetzen (dann 10 Level mit Zustimmung beider), Reihenfolge
  neu abgleichen. Für 20 bräuchte es Level, die der Analyst als zu leicht oder Scheinmischung streicht – eher nicht.
  Ausserdem: Screenshot der Levelauswahl (9 Seiten, 2 Reihen). Tutorial: Blau/Rot können im Prisma um 135° abknicken.
  Vorsieb verbessern: mix2 ≥ 1 verlangen, Scheinkombinatoren (Ausgabe = Eingang, Zerlegen und Wiedervereinen) erkennen;
  Basen „misch“ und „bunt“ liefern die guten Level.
- [ ] **2.10 Tutorial: verschwindendes Licht** (aus Review 4): Ein Prisma schluckt Licht, dessen Austrittsfläche mehr
  als 90° abgewandt ist; ein parallel getroffener Spiegel schluckt es auch. Mehrere Level ab 51 setzen das voraus
  (z. B. Licht in den Rücken eines Prismas), das Tutorial sagt es nicht. Vorschlag: ein Satz im Prisma-Hinweis.
- [ ] **2.6 Mischziele gezielt erzeugen:** Zwei verschiedenfarbige Strahlen auf dasselbe Ziel (z. B. Magenta aus
  Rot und Blau), mit Qualitätskriterium „Mischziel vorhanden“.

## 3. Qualität der Level und Werkzeuge (aus den Reviews)

- [ ] **3.1 Wertung verfeinern:** Sie bildet noch stark nur die Anzahl Elemente und Quellen ab.
  - Interaktion in die Wertung aufnehmen: Kreuzungen, geteilte Spiegel, Mehrfachtreffer.
  - Nur echte Verzweigungen als Rateschritte zählen.
  - Der frühere Test „Rangkorrelation mit Kapitel I“ entfällt (Kapitel I gibt es nicht mehr); stattdessen
    prüft das Review die Reihenfolge, der Test verlangt eine steigende Wertung (Toleranz 1.5).
- [ ] **3.2 Vielfalt der Grundmuster:** Bei einer Quelle dominiert „Schleife durch festen Spiegel“. Mustermarken
  vergeben (Schleife, diagonal, Selbstkreuzung, geteilter Spiegel, Mischziel …), höchstens 2 gleiche je 10 Level.
- [ ] **3.3 Ausbeute des Generators verbessern:** Häufigste Verwerfungsgründe sind „Quelle überflüssig“,
  „Anzahl drehbarer Elemente“ und „zu wenige Ziele“. Weitere Quellen gezielt durch einen drehbaren Spiegel einer
  vorhandenen Quelle führen.
- [ ] **3.4 Lockvögel häufiger:** Bisher hat nur ein Teil der Level einen Lockvogel, der beim Probieren Licht bekommt.
  Ziel: in den meisten Leveln mindestens einer.
- [ ] **3.5 `harden.mjs` verbessern** (Review 4, Bericht `tools/pools/review4/tester-analyst.md`, Abschnitt 4):
  - Wertung belohnt Grösse statt Denken: 16 von 32 Kandidaten sind bei vollem Überblick ohne Fallunterscheidung
    lösbar. Spielermodell (`player.mjs`) als Abnahme, z. B. mindestens ein Stillstand bei Horizont 2, aber höchstens
    zwei Fallunterscheidungen mit kurzer Kette bei vollem Überblick. Das Modell dafür versionieren.
  - Scheinmischung: Kombinator mit nur einer Eingangsfarbe (blosser Umlenker) oder Mischung, die ein Prisma sofort
    wieder zerlegt, verwerfen; Prismen, die in der Lösung nur eine Grundfarbe führen, bestrafen.
  - Füllteile (Quelle → 1–3 Spiegel → Ziel) bestrafen; ein weisses Ziel direkt aus einer weissen Quelle zählt in
    der Wertung fälschlich als Mischziel (betrifft auch `solver.mjs`).
  - Mischziele aus zwei verschiedenen Quellen verlangen oder stark gewichten (8 von 32 Kandidaten hatten keins).
  - Geschlucktes Licht an drehbaren Elementen und Tausende weiter Fast-Lösungen (Probieren statt Denken) begrenzen;
    Dichtegrenzen eher senken (`maxAdjacent` ~1.2, `maxShort` ~0.75).

## 4. Später (nächste Version, nicht jetzt)

- [ ] Neue Mechaniken, z. B. verschiebbare Elemente, Strahlteiler (halbdurchlässiger Spiegel), Portale.
- [ ] Grösseres Spielfeld als 7×7 (Platte, Kamera, Handy-Layout anpassen).
- [ ] Eventuell eine 3D-Karte für die Levelauswahl.
- [ ] Mehr als 70 Level, wenn die ersten 70 überzeugen.

## 5. Erledigt (Überblick)

- [x] Phasen 1–8 der Spezifikation (Szene, Logik, Strahlen, Elemente, Interaktion, Level-System, Lösungsmoment,
  Audio, UI, Startbildschirm, Feinschliff)
- [x] App-Icon und Web-App-Manifest (`e3582cd`)
- [x] Löser, Schwierigkeitsmessung, Generator, Textansicht; eine Regel für Spiel, Löser und Tests (`a21ec1a`)
- [x] Kapitelstruktur und Kuratier-Werkzeug (`caa018f`)
- [x] Levelauswahl mit Kapitelreitern, Freischalten (eins überspringbar), Fortschritt nach „Kapitel:Name“ (`f5931c1`)
- [x] Kapitel II „Spiegelwege“ (10 Level, rein weiss, Wertung 10.8–17.9) und Qualitätskriterien (`d32e15f`)
- [x] Umbau auf Tutorial + 50 Level nach Schwierigkeit (Kapitel aufgelöst)
- [x] Level 51–70, alle schwerer als Level 50 (`6e988e0`)
- [x] Drehbar und fest auf einen Blick: runder Teller mit weissem Leuchtring = drehbar, eckiger Sockel mit roten
  Eckleuchten = fest – auch Quelle, Ziel und Filter (`343096c`, `9a58a00`)

---

## Arbeitsweise und Befehle

- Jeder Schritt wird von einem Reviewer geprüft und danach committet. Commits enthalten keine Erwähnung von Claude.
- Grössere Level-Änderungen spielt der Nutzer an und gibt Feedback.

```bash
node tests/logic.test.mjs                                   # alle Tests (Eindeutigkeit jedes Levels)
node tools/pools.mjs --jobs 13                              # Pools je Profil erzeugen (bis 2,5 h; vorhandene bleiben)
node tools/curate.mjs --dry --save tools/pools/draft.jsonl   # Auswahl ansehen und speichern
node tools/curate.mjs --order tools/selection.jsonl          # genau diese Auswahl/Reihenfolge ins Spiel schreiben
node tools/show.mjs --level 15                               # ein Level als Textfeld (Start und Lösung)
```

- Pools liegen in `tools/pools/` (nicht versioniert).
