# 11: Kernideen II: Sammelstelle, Falle, Lockvogel

**What to build:** Die Beurteilung erkennt die übrigen drei Kernideen und bestimmt für jedes Level die Haupt-Kernidee.
Die Prüfung „nötig“ kommt aus Ticket 10.

**Spec:** ../spec.md, Abschnitt „Beurteilung“ (Kernideen); Glossar, Abschnitt „Kernideen“.

**Blocked by:** 09 (Spielermodell und Probieren), 10 (Kernideen I)

**Status:** ready-for-agent

- [ ] Erkannt werden diese Kernideen:
      - **Sammelstelle:** ein Prisma, das Licht aus mehreren Richtungen sammelt und neu verteilt.
      - **Falle:** eine naheliegende Stellung eines Prismas oder Spiegels, die in die Irre führt. Die Erkennung stützt
        sich auf die Fast-Lösungen und das Spielermodell.
      - **Lockvogel:** ein festes Teil abseits der Lösung, das beim Probieren Licht bekommt. Eine vorhandene Erkennung
        in den Werkzeugen wird übernommen oder ersetzt.
- [ ] Jede dieser Kernideen zählt nur, wenn sie nötig ist.
- [ ] Jedes Level bekommt eine Haupt-Kernidee. Die Regel dafür ist begründet, zum Beispiel die Kernidee mit dem
      grössten Beitrag zum Schliessen.
- [ ] Mini-Level gibt es je Kernidee, einmal nötig und einmal dekorativ.
- [ ] Die Zahlen je Kernidee, die Verteilung der Haupt-Kernideen und die Grade auf den 150 stehen unter `## Comments`.

## Comments

**Hinweis aus Ticket 04 (Löser schneller):** `solve` übergibt `onLeaf` nur noch `(r, board)`; das dritte Argument
`value` (Map Element-Id → Stellung) ist weggefallen.
- Die unversionierten Skripte zu den Fallen in den Review-Ordnern der Pools benutzen es und brechen jetzt ab:
  `tools/pools/review4/traps.mjs`, `review4/trapshow.mjs`, `review6/traps.mjs` und `review6/trapshow.mjs`. Dazu
  kommen `review5/screen.mjs` und `review6/features.mjs` (Ticket 09).
- Beim Übernehmen der Holzwege anpassen: Entschieden ist ein Element, wenn `getRot(el) !== L.OPEN`, und seine
  Stellung ist `getRot(el)`. Beides kommt aus `tools/solver.mjs`.
