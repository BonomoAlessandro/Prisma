# 26: Austausch „sehr schwer“

**What to build:** Die sehr schweren Level auf der Duldungsliste werden durch neue Level aus dem Generator ersetzt, in
einem Durchgang. Laut Neuzählung sind es 4 Level: 143 Prismenhof, 146 Farbenrausch, 147 Farbmühle und 149 Zenit.
Massgebend ist die Duldungsliste nach den Tickets 15 und 16.

**Spec:** ../spec.md, Abschnitt „Levelliste, Reihenfolge und Austausch“.

**Blocked by:** 16 (KI-Tester prüfen die grossen Abweichungen), 19 (Generator: alle Kernideen), 20 (Generator:
Verfeinern)

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
