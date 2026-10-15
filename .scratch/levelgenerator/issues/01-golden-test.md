# 01: Golden-Test auf main

**What to build:** Ein Test hält für jedes flache Level (Tutorial und 150) fest, wie die Strahlen in Start- und
Lösungsstellung laufen und was der Löser ermittelt. Jede Änderung im Verhalten der Strahlregel oder des Lösers macht
ihn rot, Rundungsreste in Kommazahlen nicht. Er ist das Sicherheitsnetz für alle weiteren Tickets (ADR 0003).
Grundlage ist der Golden-Test vom Branch `feature/3d-wuerfel` (Commit `74378ff`). Er deckt nur flache Level ab und
läuft gegen main schon grün. Die Würfel-Logik bleibt auf dem Branch.

**Spec:** ../spec.md, Abschnitte „Strahlregel“ und „Entscheide zu den Tests“, Nahtstelle 1.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Test und Referenzdaten sind auf main, ohne Würfel-Code.
- [ ] Exakt verglichen werden Treffer, Mischungen, „gelöst“, Art, Reihenfolge und Farbe der Ereignisse und Segmente,
      Zellen, Richtungen, Element-Bezüge sowie die Ergebnisse des Lösers (Lösungen, Knoten, Blätter, Fast-Lösungen,
      Rateschritte).
- [ ] Kommazahlen (Normalen, Endpunkte, Längen, Abstände) werden mit einer Toleranz von 1e-9 verglichen.
- [ ] Gegenprobe: Eine absichtlich veränderte Strahlregel, etwa ein Spiegel, der anders lenkt, macht den Test rot. Eine
      Abweichung von 1e-12 in einer Normalen macht ihn nicht rot.
- [ ] Der Test läuft grün gegen den heutigen Stand.
- [ ] Das README beschreibt den Aufruf und wann die Referenz neu geschrieben werden darf: nur bei einer bewussten
      Änderung des Verhaltens.
