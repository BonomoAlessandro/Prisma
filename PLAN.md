# PRISMA – Plan und offene Punkte

Hier stehen alle Punkte, die wir noch umsetzen wollen. Erledigtes wird abgehakt (`[x]`) und bleibt zur
Nachvollziehbarkeit stehen. Neue Wünsche kommen einfach als neuer Punkt dazu.

**Legende:** `[ ]` offen · `[~]` in Arbeit · `[x]` erledigt · **E** = Entscheidung des Nutzers nötig

Zuletzt aktualisiert: 2. Oktober 2026

---

## Ziel

- **50 Level:** 5 Kapitel à 10. Kapitel I sind die 10 handgebauten Lern-Level, die Kapitel II–V werden
  generiert und kuratiert. Ob es danach weitergeht, entscheiden wir, wenn die 50 stehen.
- **Leitlinien für alle Level:**
  1. Keine festen Vorgaben, welche Elemente oder Farben ein Kapitel oder Level verwendet. Spiegel, Prismen, Filter,
     Kombinatoren, Blocker, farbige Quellen und Mischziele dürfen überall vorkommen, wenn es dem Level guttut.
  2. Die Level sollen Spass machen, teilweise zum Grübeln anregen und insgesamt qualitativ stark sein.
  3. Die Schwierigkeit steigt von Level zu Level und von Kapitel zu Kapitel.

---

## 1. Entscheidungen (offen)

- [ ] **E1 · Schwierigkeit von Kapitel I zu Kapitel II.** Kapitel I endet schwerer (I.9 Wertung 28.5, I.10 31.2),
  als Kapitel II verläuft (10.8–17.9). Kapitel I steigt ausserdem nicht durchgehend, weil es die Elemente der Reihe
  nach einführt (z. B. I.3 14.6 vor I.4 8.4). Möglichkeiten:
  - (a) Kapitel I als Lernkurve ausnehmen; „steigend“ gilt ab Kapitel II.
  - (b) Kapitel I umbauen: I.9/I.10 entschärfen oder ans Ende eines späteren Kapitels verschieben.
  - (c) Die Kapitel ab II streng steigend legen, ohne Sägezahn. Vorschlag: II 12–20, III 20–27, IV 27–34, V 34–45.
- [ ] **E2 · Kapiteltitel und Levelnamen.** Die Kapitel sind nicht mehr an ein Element gebunden. Titel und
  Namen der Kapitel III–V neu wählen. Kapitel II behält seine Namen, denn sie sind der Speicherschlüssel des Fortschritts.

## 2. Level-Ausbau auf 50 Level (aktuelle Arbeit)

Reihenfolge = Priorität. Jeder Punkt wird von einem Reviewer geprüft und danach committet.

- [ ] **2.1 Feedback zu Kapitel II einholen:** Wie fühlt sich die Schwierigkeit an, steigt sie? Gibt es langweilige
  oder unfaire Level? Passt der Übergang von Kapitel I?
- [ ] **2.2 Struktur auf 5 Kapitel umstellen:**
  - `CHAPTERS` in index.html und `tools/chapters.mjs` auf 5 Kapitel kürzen.
  - Die Markierungen `KAPITEL:VI` … `KAPITEL:X` entfernen.
  - Die Levelauswahl zeigt 5 Reiter (Layout auf Desktop und Handy prüfen); die Tests anpassen.
- [ ] **2.3 Kapitel-Vorgaben ohne Element-Themen:** In `tools/chapters.mjs` pro Kapitel nur Schwierigkeit und
  Umfang vorgeben (drehbare Elemente, Quellen, Ziele, Wertungsfenster nach E1). Die Elemente sind ein gewichteter
  Mix statt einer festen Liste: Je weiter hinten, desto mehr Prismen, Filter und Kombinatoren, aber nicht ausschliesslich.
- [ ] **2.4 Farbige Quellen im Generator:** Einzelne Quellen zufällig farbig (Rot, Grün, Blau, ggf. Mischfarben),
  mit einem Anteil je Kapitel. Bisher gibt es nur `sourceColor`, eine Farbe für alle Quellen.
- [ ] **2.5 Mischziele erzeugen:** Zwei verschiedenfarbige Strahlen gezielt auf dasselbe Ziel führen (Mischfarbe,
  z. B. Magenta aus Rot und Blau). Dazu ein wählbares Qualitätskriterium „Mischziel vorhanden“.
- [ ] **2.6 Kapitel II, zweite Hälfte neu (Variante 2):** Die Positionen II.1–II.5 bleiben rein weiss. Die Positionen
  II.6–II.10 bekommen farbige Quellen und mindestens ein Mischziel, als Steigerung zum Kapitelende.
- [ ] **2.7 Kapitel III erzeugen**, kuratieren, reviewen, committen, danach Feedback des Nutzers.
- [ ] **2.8 Kapitel IV erzeugen**, kuratieren, reviewen, committen, danach Feedback.
- [ ] **2.9 Kapitel V erzeugen**, kuratieren, reviewen, committen, danach Feedback. Das letzte Kapitel braucht viel
  Rechenzeit, deshalb mit kleinerem Pool und viel Zeit planen.
- [ ] **2.10 Abschluss:** Alle 50 Level am Stück durchspielen. Prüfen, ob die Schwierigkeit über alle Kapitel steigt
  (Wertungsverlauf); das README aktualisieren.

## 3. Qualität der Level und Werkzeuge (aus den Reviews)

- [ ] **3.1 Wertung verfeinern:** Sie bildet noch stark nur die Anzahl Elemente und Quellen ab.
  - Interaktion in die Wertung aufnehmen: Kreuzungen, geteilte Spiegel, Mehrfachtreffer.
  - Nur echte Verzweigungen als Rateschritte zählen.
  - Danach die Rangkorrelation mit Kapitel I erneut prüfen (Test ≥ 0.8).
- [ ] **3.2 Vielfalt der Grundmuster:** Bei einer Quelle dominiert „Schleife durch festen Spiegel“. Mustermarken
  vergeben (Schleife, diagonal, Selbstkreuzung, geteilter Spiegel, Mischziel …), höchstens 2 gleiche pro Kapitel.
- [ ] **3.3 Ausbeute des Generators verbessern:** Häufigste Verwerfungsgründe sind „Quelle überflüssig“,
  „Anzahl drehbarer Elemente“ und „zu wenige Ziele“. Weitere Quellen gezielt durch einen drehbaren Spiegel einer
  vorhandenen Quelle führen.
- [ ] **3.4 Lockvögel häufiger:** Bisher hat nur ein Teil der Level einen Lockvogel, der beim Probieren Licht bekommt.
  Ziel: ab Kapitel II in den meisten Leveln mindestens einer.

## 4. Später (nächste Version, nicht jetzt)

- [ ] Neue Mechaniken, z. B. verschiebbare Elemente, Strahlteiler (halbdurchlässiger Spiegel), Portale.
- [ ] Grösseres Spielfeld als 7×7 (Platte, Kamera, Handy-Layout anpassen).
- [ ] Eventuell eine 3D-Karte für die Kapitel- bzw. Levelauswahl.
- [ ] Mehr als 50 Level, wenn die ersten 50 überzeugen.

## 5. Erledigt (Überblick)

- [x] Phasen 1–8 der Spezifikation (Szene, Logik, Strahlen, Elemente, Interaktion, Level-System, Lösungsmoment,
  Audio, UI, Startbildschirm, Feinschliff)
- [x] App-Icon und Web-App-Manifest (`e3582cd`)
- [x] Löser, Schwierigkeitsmessung, Generator, Textansicht; eine Regel für Spiel, Löser und Tests (`a21ec1a`)
- [x] Kapitelstruktur und Kuratier-Werkzeug (`caa018f`)
- [x] Levelauswahl mit Kapitelreitern, Freischalten (eins überspringbar), Fortschritt nach „Kapitel:Name“ (`f5931c1`)
- [x] Kapitel II „Spiegelwege“ (10 Level, rein weiss, Wertung 10.8–17.9) und Qualitätskriterien (`d32e15f`)

---

## Arbeitsweise und Befehle

- Jeder Schritt wird von einem Reviewer geprüft und danach committet. Commits enthalten keine Erwähnung von Claude.
- Nach jedem Kapitel spielt der Nutzer an und gibt Feedback, bevor das nächste kommt.

```bash
node tests/logic.test.mjs                                                # alle Tests (Eindeutigkeit jedes Levels)
node tools/curate.mjs II 120 --jobs 6 --dry --save tools/pools/II.jsonl  # Pool erzeugen, Auswahl ansehen
node tools/curate.mjs II --pool tools/pools/II.jsonl                      # genau diese Auswahl ins Spiel schreiben
node tools/show.mjs --level 15                                            # ein Level als Textfeld (Start und Lösung)
```

- Pools liegen in `tools/pools/` (nicht versioniert).
- Im Browser `index.html?unlockall` öffnen, um alle Level ohne Freischalten zu spielen.
