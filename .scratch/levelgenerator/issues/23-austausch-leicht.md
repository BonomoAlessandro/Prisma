# 23: Austausch „leicht“

**What to build:** Die leichten Level auf der Duldungsliste werden durch neue Level aus dem Generator ersetzt, in einem
Durchgang. Laut Neuzählung sind es 5 Level: 15, 19, 20, 26 und 29. Massgebend ist die Duldungsliste nach den Tickets 15
und 16.

**Spec:** ../spec.md, Abschnitt „Levelliste, Reihenfolge und Austausch“.

**Blocked by:** 16 (KI-Tester prüfen die grossen Abweichungen), 19 (Generator: alle Kernideen), 20 (Generator:
Verfeinern)

**Status:** ready-for-agent

- [ ] Für jedes leichte Level der Duldungsliste gibt es ein Ersatzlevel aus dem neuen Generator, mit dem Grad „leicht“.
- [ ] Die Formel ordnet jedes Ersatzlevel ein, und beide KI-Tester prüfen es (Protokoll). Lehnen beide ab, kommt ein
      neuer Kandidat.
- [ ] **Haltepunkt:** Die Namen im bisherigen Stil werden vorgeschlagen, und der Nutzer genehmigt sie, bevor sie ins
      Spiel kommen. Die Genehmigung steht unter `## Comments`.
- [ ] Die ersetzten Level sind samt Namen entfernt, und die Namen stehen auf der Liste der entfernten Namen.
- [ ] Auf der Duldungsliste steht kein leichtes Level mehr. Ist dieses Ticket das letzte der Tickets 23–26, ist die
      Liste leer, und der Test verlangt ab jetzt eine leere Liste.
- [ ] Die Regel „dieselbe Haupt-Kernidee höchstens zweimal je 10 Level“ bleibt erfüllt.
- [ ] Alle Tests sind grün. Stichproben der Screenshots sind geprüft.

## Comments

**Hinweis aus Ticket 15 (16.10.2026, Review):** Die Duldungsliste steht jetzt nach Grund getrennt in
`tools/levelliste.json`. In „leicht“ stehen 6 Level darauf, alle mit Ausschlussgrund (Scheinmischung): Begegnung,
Auslese, Labyrinth, Doppelpass, Seitenlicht und Lichtbündel (heute leicht statt mittel). Kernidee und Mindest-Spielwert
gelten erst ab „mittel“. Die Endbedingung „Liste leer“ hängt vom Entscheid des Nutzers nach Ticket 16 über die 52 Level
ab, die nur wegen Kernidee oder Spielwert auf der Liste stehen (Spec, Phase 6).
Vor dem ersten Entfernen: `inHeutigerReihenfolge()` wirft, sobald ein Level der heutigen Reihenfolge fehlt (Ticket 15,
„Hinweise für Folgetickets“).
