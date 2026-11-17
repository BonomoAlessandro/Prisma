# 14: Nachschliff der Sperre (leise.sh)

**Spec:** ../spec.md

**Status:** ready-for-agent (17.11.2026, Funde aus Review 13)

**Blocked by:** 13 (in `feature/umbau`)

**What to build:** Die Funde aus dem Review von Ticket 13 an `tools/leise.sh` beheben. Nichts am Spiel.

- [ ] **Halter tot, leichte Läufe leben noch:** Ein leichter Lauf prüft regelmässig, ob der Halter der Gruppe (`pid`)
      noch lebt, und trägt sich sonst selbst als Halter ein, damit die Gruppe nicht ohne Halter dasteht. Test in
      `tests/leise.test.mjs`: Halter hart beenden (`taskkill /F` bzw. `kill -9`), ein zweiter leichter Lauf lebt; ein
      alleiniger Lauf startet erst, wenn auch dieser fertig ist.
- [ ] **Vorrang auch für wartende leichte Läufe:** Wartende leichte Läufe tragen sich in die Warteschlange ein, so dass
      `LEISE_VORRANG` auch gegen eine Kette alleiniger Läufe wirkt (Review 13: `npm test` mit Vorrang 2 wartete 43 min,
      weil eine Kette alleiniger Läufe jedes Rennen um die freie Sperre gewann). Kein Lauf darf endlos warten. Test.
- [ ] **Übernahme mit Sperre der Gruppe:** `uebernehmen` des alleinigen Laufs nimmt auch `$SPERRE.leicht`, damit nach
      einem harten Abbruch kein Wettlauf entsteht.
- [ ] **«fast ruhig» im Bildvergleich:** Die Fälle, in denen eine Ansicht nur «fast ruhig» war, in der Übersicht am
      Schluss zählen (oder den Ausweg auf «poco» beschränken, wenn er nur dort nötig ist); unter «Comments» begründen.
- [ ] README und `CLAUDE.md` nachführen, falls sich Verhalten ändert.

## Hinweise

- Ältere Kopien von `leise.sh` (in Worktrees, die vor dem Merge von 13 abgezweigt sind) halten eine Gruppe ohne
  lebenden Halter für verwaist. Deshalb holen alle Worktrees `feature/umbau` herein, sobald 13 gemergt ist.
- Tests mit eigenen Pfaden (`LEISE_SPERRE`, `LEISE_WARTE`), nie gegen die echte Sperre unter `/tmp`.

## Comments
