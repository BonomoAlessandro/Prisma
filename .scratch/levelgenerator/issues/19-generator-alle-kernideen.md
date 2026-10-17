# 19: Generator: alle Kernideen

**What to build:** Der Generator baut jede der sechs Kernideen gezielt ein. Ein Auftrag mit einer Kernidee liefert ein
Level, in dem genau diese Kernidee nötig ist.

**Spec:** ../spec.md, Abschnitt „Generator“; Glossar, Abschnitt „Kernideen“.

**Blocked by:** 18 (Generator: erster Durchstich)

**Status:** ready-for-agent

- [ ] Abschalten, Farben abzählen, Sammelstelle, Falle und Lockvogel lassen sich gezielt einbauen, zusätzlich zum
      Mischziel aus zwei Quellen.
- [ ] Ein Auftrag mit einer Kernidee liefert ein Level, in dem diese Kernidee laut Beurteilung nötig ist.
- [ ] Je Kernidee gibt es einen Test mit festem Seed.
- [ ] Die Ausbeute je Kernidee ist gemessen und steht unter `## Comments`.

## Comments

**Hinweis aus Ticket 18 (Generator):**
- **Baustein:** Eine Kernidee ist ein Baustein in `tools/generator/bausteine/` mit einer Zeile in
  `bausteine/index.mjs` (Glossarbegriff, `braucht`, `baue(bau, plan, vorgaben)`); Vorbild ist
  `mischziel-zwei-quellen.mjs`. Der Baustein schützt seine Elemente (`kern: true`) und reserviert die Zellen seiner
  Wege. Ob die Kernidee nötig ist, entscheidet die Beurteilung: Abschalten, Farben abzählen und Sammelstelle schon in
  der Vorprüfung, Falle und Lockvogel erst in der vollen Beurteilung (der Ablauf erkennt das an `offen`).
- **Lockvogel:** Der Generator setzt noch keine Lockvögel, und ein festes Teil zählt heute nur über die Lösung (Regel
  gegen wirkungslose Elemente, `wirkungslos` in `schritte.mjs`). Ein Lockvogel braucht die Prüfung „bekommt beim
  Probieren Licht“, also die Suche ohne Abschneiden. Die macht schon die Beurteilung (`suche.mjs`, `licht`), gibt
  `licht` aber nicht aus. Damit sie nicht doppelt läuft: den Lockvogel über die Kernidee in der vollen Beurteilung
  prüfen oder `beurteile` klein ergänzen (etwa das Licht auf festen Teilen ausgeben), bitgleich wie in Ticket 18. Der
  alte Generator suchte heisse Zellen mit einer eigenen Vollsuche (47 % seiner Zeit). Achtung (Review): Ein fester
  Spiegel des Lockvogel-Bausteins zählt nicht für die Lösung; `wirkungslos` meldet für ihn heute „Kernidee
  wirkungslos“, der Bau scheitert also schon beim Festigen. `wirkungslos` muss feste Teile der Kernidee dort auslassen
  (die Beurteilung prüft den Lockvogel dann mit dem Licht der Suche) oder ihren Anteil im Licht der Suche prüfen.
- **Quellen:** Abschalten und Farben abzählen brauchen oft drei Quellen; die Vorgabe „leicht“ erlaubt 1–3. Der
  Mischziel-Baustein belegt zwei Quellen und reserviert ihre Wege; danach findet das Ergänzen oft keinen offenen Strahl
  mehr („zu klein“ bei 13 % der Seeds).
- **Aufträge:** `KURZNAMEN` in `index.mjs` kennt die Kurznamen aller sechs Kernideen. `angebot()` nimmt neue
  Bausteine von selbst auf (Kommandozeile `leicht-abschalten` …, Gruppen des Messskripts).
- **Test und Messung:** In `tests/generator.test.mjs` je Kernidee einen Auftrag zu `AUFTRAEGE` hinzufügen; alle
  Prüfungen gelten dann auch für ihn. `bench.mjs generator --generator neu --accept beurteilung` zählt je Grad und
  nötiger Kernidee; `--compare` mit einer Messung des alten Generators zeigt dieselbe Kernidee über alle Profile und im
  besten Profil.
