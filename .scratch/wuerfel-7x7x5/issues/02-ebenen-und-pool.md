# 02: Ebenen-Regel, Pool umrechnen, Generator im Quader

**Spec:** ../spec.md

**Blocked by:** 01

**Status:** ready-for-agent

**What to build:** Die Ebenen-Regel der Spec (mindestens 3 Ebenen mit getroffenen Elementen, unterstes Element auf
y = 0) als feste Regel der Würfel-Levelliste, der umgerechnete Pool und ein erster neuer Pool 7 × 7 × 5.

- [ ] Regel in `tools/wuerfelliste.mjs` und in `wahl`; Test über alle Würfel-Level im Spiel (bis Ticket 03 sind
      die bekannten Fälle ausgenommen, danach keine).
- [ ] Umrechnen: Pool 7 × 7 × 7 → 7 × 7 × 5 (verschoben, neu beurteilt, Herkunft mit Verschiebung), nur Kandidaten,
      die die Regel erfüllen und eindeutig lösbar bleiben.
- [ ] Generator im Quader 7 × 7 × 5 mit der Regel; Probe der Ausbeute je Grad, im Ticket festgehalten.
- [ ] Alle Tests grün; Review.

## Comments
