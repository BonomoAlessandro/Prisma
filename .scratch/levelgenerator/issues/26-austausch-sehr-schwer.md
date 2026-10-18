# 26: Austausch „sehr schwer“

**What to build:** Die sehr schweren Level auf der Duldungsliste werden durch neue Level aus dem Generator ersetzt, in
einem Durchgang. Laut Neuzählung sind es 4 Level: 143 Prismenhof, 146 Farbenrausch, 147 Farbmühle und 149 Zenit.
Massgebend ist die Duldungsliste nach den Tickets 15 und 16.

**Spec:** ../spec.md, Abschnitt „Levelliste, Reihenfolge und Austausch“.

**Blocked by:** 16 (KI-Tester prüfen die grossen Abweichungen), 19 (Generator: alle Kernideen), 20 (Generator:
Verfeinern), 28 (Generator: Kernideen ab „mittel“)

**Status:** ready-for-agent

- [ ] Für jedes sehr schwere Level der Duldungsliste gibt es ein Ersatzlevel aus dem neuen Generator, mit dem Grad
      „sehr schwer“ und einer nötigen Kernidee.
- [ ] Die Formel ordnet jedes Ersatzlevel ein, und beide KI-Tester prüfen es (Protokoll). Lehnen beide ab, kommt ein
      neuer Kandidat.
- [ ] **Haltepunkt:** Die Namen im bisherigen Stil werden vorgeschlagen, und der Nutzer genehmigt sie, bevor sie ins
      Spiel kommen. Die Genehmigung steht unter `## Comments`.
- [ ] Die ersetzten Level sind samt Namen entfernt, und die Namen stehen auf der Liste der entfernten Namen.
- [ ] Auf der Duldungsliste steht kein sehr schweres Level mehr. Ist dieses Ticket das letzte der Tickets 23–26, ist
      die Liste leer, und der Test verlangt ab jetzt eine leere Liste.
- [ ] Die Regel „dieselbe Haupt-Kernidee höchstens zweimal je 10 Level“ bleibt erfüllt.
- [ ] Alle Tests sind grün. Stichproben der Screenshots sind geprüft.

## Comments

**Hinweis aus Ticket 15 (16.10.2026, Review):** Die Duldungsliste steht jetzt nach Grund getrennt in
`tools/levelliste.json`. In „sehr schwer“ stehen 8 Level darauf: 7 mit Ausschlussgrund (Korona, Prismenhof, Quasar,
Ereignishorizont, Zenit, Farbenrausch, Farbmühle) und Spiegelkabinett nur wegen des Spielwerts. Über Spiegelkabinett
entscheidet der Nutzer nach Ticket 16 (Spec, Phase 6); davon hängt die Endbedingung „Liste leer“ ab.
Vor dem ersten Entfernen: `inHeutigerReihenfolge()` wirft, sobald ein Level der heutigen Reihenfolge fehlt (Ticket 15,
„Hinweise für Folgetickets“).

**Hinweis aus Ticket 16 (17.10.2026):** Nach den KI-Testern ist „sehr schwer“ die Plätze 138–150; darauf stehen
dieselben 8 Level auf der Duldungsliste. Spiegelkabinett haben beide KI-Tester abgelehnt (Knäuel); es ist damit wie
die 7 mit Ausschlussgrund zuerst zu ersetzen und nicht mehr Gegenstand des Entscheids über die Level ohne
Ausschlussgrund. Anker A8 Pulsar (Platz 145) steht nur am oberen Ende, weil 146–150 alle einen Ausschlussgrund haben:
Kommen Ersatzlevel dorthin, braucht es vor dem nächsten Lauf der KI-Tester einen neuen Anker und eine neue Version des
Ablaufs.

**Hinweis aus Ticket 20 (Generator):**
- „sehr schwer“ liefert wenig und teuer:
  - `sehr schwer-mischziel` 139 von 2000 Seeds, 0,66 CPU-s je Seed;
  - `sehr schwer` 117, 1,3 CPU-s je Seed;
  - Schwierigkeit um 88–94.
- Für 8 Ersatzlevel samt Kandidaten für die KI-Tester genügen ein paar hundert Seeds. Mit `LEISE_CPU=50` sind das
  wenige Minuten, auf einem Rechner mit `LEISE_MAX_CPU=65` auch mit `LEISE_CPU=65` und `--jobs 7`.
- Die Level liegen meist knapp über der Schwelle 87 (Q1 88–89, Q3 93–94). Für Ersatz weiter oben braucht es eine
  Ziel-Schwierigkeit und mehr Seeds; die Grenze ist der Platz im Feld 7 × 7.
- **Nach dem Merge mit 19:** Schon bei „mittel“ und „schwer“ liefern Lockvogel, Farben abzählen und Abschalten kaum
  Level (Probe in Ticket 20). Bei „sehr schwer“ liefern auch `sehr schwer-sammelstelle` und `sehr schwer-falle` je
  nur 1 von 50 Seeds (Review, ein Prozess, 30 bzw. 23 CPU-s); es bleibt praktisch nur das Mischziel (139 von 2000).
  Für 8 Ersatzlevel und „höchstens zweimal je 10 Level“ reicht das nur, wenn die Haupt-Kernideen der gelieferten
  Level verschieden genug sind. Vor dem Austausch deshalb die Verteilung von `beurteilung.hauptKernidee` bei „sehr
  schwer“ messen; reicht sie nicht, braucht es zuerst Bausteine, die ab „mittel“ Platz und offene Strahlen lassen
  (Ticket 20, „Nach dem Merge mit 19“).

**Entscheid des Nutzers zur Haupt-Kernidee (17.10.2026):** Die Regel „verlangte Kernidee = Haupt-Kernidee“ kommt als
Wahl im Auftrag mit dem Austausch, siehe Ticket 23.

**Hinweis aus Ticket 23 (Austausch „leicht“, 18.10.2026):**
- Ablauf mit den Werkzeugen aus Ticket 23 (README zu `ordne-level.mjs`, `prepare.mjs` und `generiere.mjs`):
  1. Kandidaten mit `generiere.mjs <auftrag> --schwierigkeit VON,BIS`. Als Ziel-Schwierigkeit taugt die Lücke zwischen
     den Nachbarn des ersetzten Levels nach der Schwierigkeit; dann bleibt der Platz der Formel aller anderen Level
     gleich.
  2. Eine Austausch-Datei (JSON-Liste `{ ersetzt, level, auftrag, seed }`) und `ordne-level.mjs --austausch <datei>
     --json <ausgabe>` ohne `--schreiben`: Platz, Grad, Haupt-Kernidee und Regeln, als wären die Kandidaten im Spiel.
  3. `prepare.mjs ersatz-<grad>-1 --kandidaten <ausgabe>` nimmt die Einträge mit Leveldaten; Kandidat und Ersatz aus
     zwei Läufen von Schritt 2 in eine Liste zusammenfügen.
  4. Nach `merge.mjs` dieselbe Austausch-Datei mit dem genehmigten `name` je Eintrag und `--schreiben`. Ein zweiter
     Lauf ohne `--austausch` meldet „stimmen“.
- Die Korrekturen der KI-Tester verschieben ein neues Level um bis zu 5 Plätze, auf eine andere Seite. Das kann eine
  Haupt-Kernidee häufen (in Ticket 23 ein Grund, auf Platz 18 den Ersatz zu nehmen). Vor dem Schreiben mit
  `--austausch` prüfen.
- Die Haupt-Kernidee kam in „leicht“ aus der Beurteilung (`hauptKernidee` in der Ausgabe von `generiere.mjs`); eine
  Wahl „verlangte = Haupt-Kernidee“ im Auftrag war nicht nötig. Ab „mittel“ leistet ein Filter in der Auswahl
  dasselbe; eine Wahl im Auftrag wäre eine Änderung in `tools/generator/` (Ticket 28).
- `AUSGETAUSCHT` in `tests/levelliste.test.mjs` um den Grad ergänzen; nach dem letzten der Tickets 23–26 verlangt der
  Test eine leere Duldungsliste.
- Nach dem Austausch braucht `tests/golden.json` ein `--write` (neue Namen, die ersetzten fehlen); bei Ticket 23 hat
  das der Koordinator nach dem Merge übernommen.
