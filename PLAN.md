# PRISMA – Plan und offene Punkte

Hier stehen alle Punkte, die wir noch umsetzen wollen. Erledigtes wird abgehakt (`[x]`) und bleibt zur
Nachvollziehbarkeit stehen. Neue Wünsche kommen einfach als neuer Punkt dazu.

**Legende:** `[ ]` offen · `[~]` in Arbeit · `[x]` erledigt · **E** = Entscheidung des Nutzers nötig

Zuletzt aktualisiert: 3. Oktober 2026

---

## Ziel

- **Tutorial + 50 Level:** Zuerst ein kurzes Tutorial (6 Level), das die Mechaniken zeigt: Spiegel, feste Spiegel
  und Blöcke, Prisma, Filter, farbige Quellen, Kombinator, je mit einem Hinweis in der Kopfzeile. Danach 50 Level, **allein nach
  Schwierigkeit sortiert** (leicht → schwer), ohne Gruppierung nach Elementen oder Anzahl Komponenten.
- **Leitlinien für alle Level:**
  1. Elemente und Farben mischen sich frei: Spiegel, Prismen, Filter, Kombinatoren, Blöcke, farbige Quellen.
  2. Die Level sollen Spass machen, teilweise zum Grübeln anregen und qualitativ stark sein.
  3. Je weiter man kommt, desto schwerer.
- Die Levelauswahl blättert in Seiten (Tutorial, 1–10, …, 41–50). Die Seiten sind keine Kapitel und haben kein Thema.

---

## 1. Entscheidungen (offen)

- [ ] **E3 · Tutorial überspringen?** Zurzeit öffnet sich Level 1, sobald Tutorial 4 oder 5 gelöst ist (wie überall:
  eins darf man überspringen). Erfahrene Spieler können das Tutorial nicht ganz überspringen. Gewünscht?
- [x] **E4 · Farbige Quellen im Tutorial:** eigenes Tutorial-Level „Farbiges Licht“ vor dem Kombinator.

## 2. Tutorial + 50 Level (aktuelle Arbeit)

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
- [ ] **2.4 Feedback des Nutzers:** Alle 50 Level anspielen: Steigt die Schwierigkeit spürbar? Langweilige oder
  unfaire Level? Passt der Übergang vom Tutorial?
- [ ] **2.5 Oberes Ende:** Über Wertung ~40 gibt es nur wenige Kandidaten (Stufe 5 ist langsam, Filter-Profil ohne
  Ausbeute). Bei Bedarf Stufe 5 länger laufen lassen und die letzten Level ersetzen.
- [ ] **2.7 Generator: wirkungslose Filter verwerfen** (Strahl hat schon die Filterfarbe – bei rund 1/3 der
  Filter-Level im Pool). Ebenso feste Spiegel, die nie für die Lösung zählen und kaum als Lockvogel wirken.
- [ ] **2.8 Lesbarkeit im Spiel** (aus dem Review): Blaue Ziele wirken fast weiss; die Richtung des Kombinators ist
  auf Distanz schwer zu erkennen; „Weiss + Rot im Kombinator = Weiss“ wird nirgends gezeigt.
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

## 4. Später (nächste Version, nicht jetzt)

- [ ] Neue Mechaniken, z. B. verschiebbare Elemente, Strahlteiler (halbdurchlässiger Spiegel), Portale.
- [ ] Grösseres Spielfeld als 7×7 (Platte, Kamera, Handy-Layout anpassen).
- [ ] Eventuell eine 3D-Karte für die Levelauswahl.
- [ ] Mehr als 50 Level, wenn die ersten 50 überzeugen.

## 5. Erledigt (Überblick)

- [x] Phasen 1–8 der Spezifikation (Szene, Logik, Strahlen, Elemente, Interaktion, Level-System, Lösungsmoment,
  Audio, UI, Startbildschirm, Feinschliff)
- [x] App-Icon und Web-App-Manifest (`e3582cd`)
- [x] Löser, Schwierigkeitsmessung, Generator, Textansicht; eine Regel für Spiel, Löser und Tests (`a21ec1a`)
- [x] Kapitelstruktur und Kuratier-Werkzeug (`caa018f`)
- [x] Levelauswahl mit Kapitelreitern, Freischalten (eins überspringbar), Fortschritt nach „Kapitel:Name“ (`f5931c1`)
- [x] Kapitel II „Spiegelwege“ (10 Level, rein weiss, Wertung 10.8–17.9) und Qualitätskriterien (`d32e15f`)
- [x] Umbau auf Tutorial + 50 Level nach Schwierigkeit (Kapitel aufgelöst)

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
- Im Browser `index.html?unlockall` öffnen, um alle Level ohne Freischalten zu spielen.
