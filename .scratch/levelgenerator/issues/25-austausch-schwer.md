# 25: Austausch „schwer“

**What to build:** Die schweren Level auf der Duldungsliste werden durch neue Level aus dem Generator ersetzt, in einem
Durchgang. Laut Neuzählung sind es 17 Level: 101, 106, 111, 116, 120, 121, 128, 129, 131, 132, 133, 134, 136, 137, 138,
139 und 140. Massgebend ist die Duldungsliste nach den Tickets 15 und 16.

**Spec:** ../spec.md, Abschnitt „Levelliste, Reihenfolge und Austausch“.

**Blocked by:** 16 (KI-Tester prüfen die grossen Abweichungen), 19 (Generator: alle Kernideen), 20 (Generator:
Verfeinern)

**Status:** ready-for-agent

- [ ] Für jedes schwere Level der Duldungsliste gibt es ein Ersatzlevel aus dem neuen Generator, mit dem Grad „schwer“
      und einer nötigen Kernidee.
- [ ] Die Formel ordnet jedes Ersatzlevel ein, und beide KI-Tester prüfen es (Protokoll). Lehnen beide ab, kommt ein
      neuer Kandidat.
- [ ] **Haltepunkt:** Die Namen im bisherigen Stil werden vorgeschlagen, und der Nutzer genehmigt sie, bevor sie ins
      Spiel kommen. Die Genehmigung steht unter `## Comments`.
- [ ] Die ersetzten Level sind samt Namen entfernt, und die Namen stehen auf der Liste der entfernten Namen.
- [ ] Auf der Duldungsliste steht kein schweres Level mehr. Ist dieses Ticket das letzte der Tickets 23–26, ist die
      Liste leer, und der Test verlangt ab jetzt eine leere Liste.
- [ ] Die Regel „dieselbe Haupt-Kernidee höchstens zweimal je 10 Level“ bleibt erfüllt.
- [ ] Alle Tests sind grün. Stichproben der Screenshots sind geprüft.
