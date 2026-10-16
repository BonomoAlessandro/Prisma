# 14: Würfel-Branch: Beurteilung im Würfel

**What to build:** Auf dem Branch `feature/3d-wuerfel` funktioniert die Beurteilung auch mit Würfel-Leveln. Das zeigt,
dass die Feldform an echten Würfeln taugt. Die Würfel-Logik bleibt auf dem Branch.

**Spec:** ../spec.md, Abschnitt „Würfel“.

**Blocked by:** 12 (Schwierigkeit geeicht), 13 (Spielwert geeicht)

**Status:** ready-for-agent

- [ ] main ist in den Branch übernommen, die Konflikte sind gelöst, und alle Tests des Branches sind grün.
- [ ] Auf dem Branch gibt es eine Würfel-Feldform: Zellen mit drei Koordinaten, 18 Richtungen und Drehachsen.
- [ ] Die Tests der Beurteilung laufen zusätzlich mit Würfel-Leveln: Aufzug, Kern und Mini-Würfel-Level mindestens für
      Mischziel, Scheinmischung und Knäuel. Beim Knäuel zählen die Nachbarn im Raum.
- [ ] Fehlt der Feldform auf main etwas, wird es dort mit eigenem Commit nachgezogen und nicht auf dem Branch umgangen.
- [ ] Ausser diesen Korrekturen an der Feldform kommt nichts nach main.
