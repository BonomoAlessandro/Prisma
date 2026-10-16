# 01: Golden-Test auf main

**What to build:** Ein Test hält für jedes flache Level (Tutorial und 150) fest, wie die Strahlen in Start- und
Lösungsstellung laufen und was der Löser ermittelt. Jede Änderung im Verhalten der Strahlregel oder des Lösers macht
ihn rot, Rundungsreste in Kommazahlen nicht. Er ist das Sicherheitsnetz für alle weiteren Tickets (ADR 0003).
Grundlage ist der Golden-Test vom Branch `feature/3d-wuerfel` (Commit `74378ff`). Er deckt nur flache Level ab und
läuft gegen main schon grün. Die Würfel-Logik bleibt auf dem Branch.

**Spec:** ../spec.md, Abschnitte „Strahlregel“ und „Entscheide zu den Tests“, Nahtstelle 1.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Test und Referenzdaten sind auf dem Branch `feature/levelgenerator`, ohne Würfel-Code; sie kommen mit dem Merge
      nach main.
- [x] Exakt verglichen werden Treffer, Mischungen, „gelöst“, Art, Reihenfolge und Farbe der Ereignisse und Segmente,
      Zellen, Richtungen, Element-Bezüge sowie die Ergebnisse des Lösers (Lösungen, Knoten, Blätter, Fast-Lösungen,
      Rateschritte).
- [x] Kommazahlen (Normalen, Endpunkte, Längen, Abstände) werden mit einer Toleranz von 1e-9 verglichen.
- [x] Gegenprobe: Eine absichtlich veränderte Strahlregel, etwa ein Spiegel, der anders lenkt, macht den Test rot. Eine
      Abweichung von 1e-12 in einer Normalen macht ihn nicht rot.
- [x] Der Test läuft grün gegen den heutigen Stand.
- [x] Das README beschreibt den Aufruf und wann die Referenz neu geschrieben werden darf: nur bei einer bewussten
      Änderung des Verhaltens.

## Comments

**Umgesetzt (Oktober 2026):** `tests/golden.mjs` und `tests/golden.json` aus `74378ff` übernommen. Würfel-Bezüge gab es
keine (kein `y`, kein `LEVELS_3D`). Der Vergleich läuft Wert für Wert über den ganzen Eintrag statt über den JSON-Text:
Endpunkte, Normalen, Längen und Abstände mit 1e-9, alles andere exakt. Die Gegenprobe läuft bei jedem Aufruf mit:
- Ein Spiegel, der einen nach Osten laufenden Strahl nach Norden statt nach Süden lenkt, fällt in 100 von 159 Leveln auf.
- 1e-12 in einer Normalen fällt nicht auf.
- Auf der Kopie eines Eintrags mit Löserdaten fallen auf: 1e-6 in einer Normalen, `solver.nodes + 1`, alte Wertung
  (`score`) + 0,1 sowie 1e-12 in `color` und in `element`.

Sie war zuerst rot: die 1e-12-Probe gegen den alten Textvergleich, die übrigen gegen einen Vergleich, der alle Zahlen
mit Toleranz 1 nimmt.

**Löser in der Referenz für alle Level:** `golden.json` hält `solver` jetzt für alle 159 Level fest, die alte Wertung
(`score`) weiter nur für die 24 Level (Tutorial und jedes 10.), weil sie den Löser ein zweites Mal rechnet. Der normale
Lauf vergleicht den Löser nur für diese 24 Level, damit er schnell bleibt; `--voll` vergleicht ihn für alle 159 und ist
für Ticket 04 und die Reviews gedacht. Die Referenz wurde dafür einmal mit `--write` erweitert. Ohne die 135 neuen
`solver`-Felder ist sie byte-gleich mit der alten aus `74378ff`.

**Laufzeit** über `leise.sh`, alle grün: `node tests/golden.mjs` 29 s, `--voll` 1 min 53 s, `--write` 2 min 37 s,
`node tests/logic.test.mjs` 4 min 30 s (554 Tests).

**Abweichungen vom Ticket:**
- Der normale Lauf vergleicht den Löser nur für 24 von 159 Leveln; für alle braucht es `--voll` (Gründe oben).
- Die alte Wertung (`score`) bleibt in der Referenz und wird exakt verglichen (Tickets 06 und 21 rechnen damit).
- Zellen und Richtungen sind keine eigenen Felder: Sie stecken in den Koordinaten, und eine falsche Zelle weicht um
  mindestens 0,0046 ab (Spiegelkante gegen schräges Auslaufen über die Feldecke), also weit über der Toleranz.

Commit siehe git log.
