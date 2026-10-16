# 16: KI-Tester prüfen die grossen Abweichungen

**What to build:** Für jedes Level, das nach der Formel mehr als 10 Plätze wandern würde, urteilen die beiden KI-Tester.
Verschoben wird nur, wenn sie zustimmen. Danach steht die Reihenfolge der 150 Level fest.

**Spec:** ../spec.md, Abschnitte „KI-Tester“ und „Levelliste, Reihenfolge und Austausch“.

**Blocked by:** 05 (Ablauf der KI-Tester), 15 (Neue Reihenfolge und Grade)

**Status:** ready-for-agent

- [ ] Für jedes Level der Prüfliste aus Ticket 15 urteilen beide Tester nach dem Ablauf aus Ticket 05.
- [ ] Ein Level kommt nur dann auf den Platz der Formel, wenn beide Tester zustimmen. Sonst bleibt es an seinem alten
      Platz.
- [ ] Eigene Korrekturen der Tester betragen höchstens 5 Plätze und überschreiten nie eine Gradgrenze.
- [ ] Lehnen beide Tester ein Level ab, kommt es auf die Duldungsliste. Dies ist der letzte Zeitpunkt, an dem die Liste
      wachsen darf, und der Test der ursprünglichen Liste wird entsprechend nachgeführt.
- [ ] Das Protokoll ist vollständig. Ein Test der Levelliste prüft, dass jede Abweichung vom Platz der Formel im
      Protokoll begründet ist.
- [ ] Der Grad sinkt entlang der Reihenfolge weiterhin nie, und alle Tests sind grün.

## Comments

**Hinweis aus Ticket 13 (Spielwert):** Die Läufe `spielwert-1` bis `spielwert-4` (16.10.2026, Ablauf 1) dienen nur
dem Eichen des Spielwerts. Ihre Verschiebungen und Ablehnungen beziehen sich auf die damalige Reihenfolge und gelten
hier nicht als Korrektur, wie die Probeläufe. Vor dem Lauf dieses Tickets das Glossar schärfen und eine neue Version
des Ablaufs mit Probelauf machen (siehe Spec, „Weitere Hinweise“).

**Hinweise aus Ticket 15 (Reihenfolge und Grade, 16.10.2026):**
- **Prüfliste:** 51 Level, versioniert in `tools/levelliste.json` (`pruefliste`, in der neuen Reihenfolge).
  `tools/ordne-level.mjs` berichtet sie mit dem Platz nach der Formel.
  - nach vorn (heutiger Platz → Platz nach der Formel): 41 → 27, 52 → 31, 55 → 32, 58 → 40, 64 → 45, 65 → 37,
    70 → 41, 72 → 36, 74 → 35, 75 → 59, 79 → 66, 84 → 69, 86 → 53, 87 → 60, 93 → 73, 95 → 71, 99 → 72, 100 → 61,
    102 → 81, 107 → 86, 108 → 84, 109 → 77, 110 → 95, 111 → 87, 112 → 90, 117 → 88, 134 → 121, 144 → 131;
  - nach hinten: 17 → 62, 27 → 46, 32 → 47, 36 → 58, 42 → 74, 45 → 76, 49 → 63, 50 → 85, 51 → 91, 61 → 82,
    63 → 79, 66 → 80, 67 → 92, 76 → 101, 77 → 109, 80 → 99, 81 → 116, 82 → 113, 83 → 97, 85 → 104, 91 → 114,
    94 → 105, 122 → 137.
  - Bis zum Urteil stehen sie an ihrem heutigen Platz und tragen den Grad ihres Abschnitts. Bei 17 Leveln ist das
    nicht der Grad nach der Schwelle: 17, 27, 32, 41, 77, 81, 82, 91, 94, 107–112, 117, 144.
  - Nur der Wechsel zwischen „leicht“ und „mittel“ ändert, was gilt (Review von Ticket 15): Kommen 17 Weichen und
    32 Streulicht nach „mittel“, fehlt ihnen die nötige Kernidee, und sie liegen unter dem Mindest-Spielwert (57,9
    bzw. 52,2). Auf der ursprünglichen Duldungsliste stehen sie nicht, der Test „Die Duldungsliste wird nur kürzer“
    fiele also. Das braucht einen Entscheid des Nutzers. 27 Spiegelbild besteht auch als „mittel“; 41 Schliff käme als
    „leicht“ von der Liste.
  - 56 Strahlenkranz bleibt ebenfalls am heutigen Platz, weil es zwischen den Leveln der Prüfliste 12 Plätze wandern
    würde. Für die KI-Tester ist es kein Fall; nach den Verschiebungen dieses Tickets rechnet `ordne-level.mjs` die
    freien Plätze neu.
- **Duldungsliste:**
  - 33 der 51 stehen auch auf der Duldungsliste, 6 mit Ausschlussgrund: 36, 67, 77, 86, 111, 134. Diese 6 ersetzt
    Phase 6 ohnehin.
  - 27 stehen nur wegen Kernidee oder Spielwert darauf. Über sie entscheidet der Nutzer je Grad nach diesem Ticket,
    mit den Urteilen der KI-Tester (Entscheid vom 16.10.2026). Darum lohnt es sich, bei ihnen Aha-Moment und Gefühl
    genau zu lesen. Die übrigen 25 dieser Art sind nicht auf der Prüfliste.
- **Anker (A4–A8):** In der neuen Reihenfolge und mit den neuen Graden passen sie nicht mehr.
  - A4 Farbverlauf (heute 94) steht auf der Prüfliste (Formel 105, nach der Schwelle schwer).
  - A5 Silberstreif wird „mittel“ (Platz 96), A6 Pulsar „sehr schwer“ (Platz 145).
  - A7 Morgenröte (Platz 143) und A8 Sternenstaub (Platz 138) stehen nicht mehr am unteren bzw. oberen Ende von
    „sehr schwer“ (138–150).
  - A1–A3 bleiben in ihrem Grad (Plätze 5, 23, 34).
  - Regel (1) der Anker („nicht auf der Duldungsliste“) meinte die 37 der Neuzählung. Auf der neuen Liste stehen
    auch A3 Kreuzweg, A4 Farbverlauf und A5 Silberstreif, je nur wegen Kernidee bzw. Spielwert.
  - Ausserhalb von Duldungsliste und Prüfliste gibt es in „mittel“ erst ab Platz 68 ein Level (68 Feuerwerk). Die
    Wahl der Anker muss hier entscheiden, ob Regel (1) nur den Ausschlussgrund meint.
- **Ablauf 1 bleibt bis zur neuen Version auf der heutigen Reihenfolge**, damit der Fingerabdruck (d91d5db7fe66811d)
  und die 43 Einträge im Protokoll gültig bleiben:
  - `loadAnchors`, `levelAt` und `prepare.mjs` rechnen mit den Plätzen der festen Namensliste
    `tools/beurteilung/heutige-reihenfolge.json`.
  - `GRADES` und `gradeOf` sind die vorläufigen Grade.
  - Der Fingerabdruck lässt das neue Feld `grad` aus wie früher `difficulty`.
  - Die neue Version des Ablaufs (geschärftes Glossar, neue Anker) sollte zugleich wechseln: die Referenz auf den
    Platz in der neuen Reihenfolge und die Grade aus den Leveldaten (`level.grad`).
  - Die Grenzen eines Grads gibt dann die Reihenfolge im Spiel vor (leicht 1–32, mittel 33–102, schwer 103–137, sehr
    schwer 138–150); sie verschieben sich mit jeder Verschiebung.
- **Test der Levelliste:** `tests/levelliste.test.mjs` prüft heute, dass die Reihenfolge genau die der Formel ist
  („Die Reihenfolge folgt der Schwierigkeit …“) und die Prüfliste stimmt. Dieses Ticket erweitert ihn: Abweichungen vom
  Platz der Formel sind nur mit Begründung im Protokoll erlaubt, gezählt nur aus Läufen der neuen Version.
  `ordne()` und `gradeEntlang()` in `tools/levelliste.mjs` sind dafür die Stellen.
- **Duplikat:** `tests/ki-tester.test.mjs` führt die 37 Namen der Neuzählung als eigene Liste (`DULDUNG`, Länge 37).
  Sie entspricht dem Grund Ausschlussgrund in `tools/levelliste.json`. Wird diese kürzer, sollte der Test sie von
  dort lesen.
