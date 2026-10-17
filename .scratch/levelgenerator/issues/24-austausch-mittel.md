# 24: Austausch „mittel“

**What to build:** Die mittleren Level auf der Duldungsliste werden durch neue Level aus dem Generator ersetzt, in einem
Durchgang. Laut Neuzählung sind es 11 Level: 31, 36, 38, 40, 43, 67, 77, 86, 92, 97 und 98. Massgebend ist die
Duldungsliste nach den Tickets 15 und 16.

**Spec:** ../spec.md, Abschnitt „Levelliste, Reihenfolge und Austausch“.

**Blocked by:** 16 (KI-Tester prüfen die grossen Abweichungen), 19 (Generator: alle Kernideen), 20 (Generator:
Verfeinern)

**Status:** ready-for-agent

- [ ] Für jedes mittlere Level der Duldungsliste gibt es ein Ersatzlevel aus dem neuen Generator, mit dem Grad „mittel“
      und einer nötigen Kernidee.
- [ ] Die Formel ordnet jedes Ersatzlevel ein, und beide KI-Tester prüfen es (Protokoll). Lehnen beide ab, kommt ein
      neuer Kandidat.
- [ ] **Haltepunkt:** Die Namen im bisherigen Stil werden vorgeschlagen, und der Nutzer genehmigt sie, bevor sie ins
      Spiel kommen. Die Genehmigung steht unter `## Comments`.
- [ ] Die ersetzten Level sind samt Namen entfernt, und die Namen stehen auf der Liste der entfernten Namen.
- [ ] Auf der Duldungsliste steht kein mittleres Level mehr. Ist dieses Ticket das letzte der Tickets 23–26, ist die
      Liste leer, und der Test verlangt ab jetzt eine leere Liste.
- [ ] Die Regel „dieselbe Haupt-Kernidee höchstens zweimal je 10 Level“ bleibt erfüllt.
- [ ] Alle Tests sind grün. Stichproben der Screenshots sind geprüft.

## Comments

**Hinweis aus Ticket 15 (16.10.2026, Review):** Die Duldungsliste steht jetzt nach Grund getrennt in
`tools/levelliste.json`. In „mittel“ stehen 55 von 70 Level darauf: 10 mit Ausschlussgrund (Glasmurmel, Einklang,
Schnittstelle, Geflecht, Weichensteller, Mosaik, Laterne, Lichtorgel, Polarlicht, Libelle) und 45 nur wegen Kernidee
oder Spielwert. Phase 6 ersetzt zuerst die mit Ausschlussgrund; über die 45 entscheidet der Nutzer nach Ticket 16
(Spec, Phase 6). Davon hängt auch die Endbedingung „Liste leer“ ab.
Vor dem ersten Entfernen: `inHeutigerReihenfolge()` wirft, sobald ein Level der heutigen Reihenfolge fehlt (Ticket 15,
„Hinweise für Folgetickets“).

**Hinweis aus Ticket 16 (17.10.2026):** Nach den KI-Testern stehen in „mittel“ (Plätze 32–105) 57 von 74 Level auf
der Duldungsliste: 11 mit Ausschlussgrund (Einklang, Schnittstelle, Geflecht, Glasmurmel, Weichensteller, Mosaik,
Laterne, Lichtorgel, Libelle, Polarlicht, Lichtschleife), dazu 2 von beiden KI-Testern abgelehnt ohne Ausschlussgrund
(Sonnenstrahl, Widerschein); diese 13 ersetzt Phase 6 zuerst. 44 stehen nur wegen Kernidee oder Spielwert darauf,
darunter neu 17 Weichen und 32 Streulicht (Entscheid des Nutzers, Ticket 16).
- **Vor dem Entscheid über die Level ohne Ausschlussgrund wird der Spielwert in „mittel“ angesehen** (Erkennung der
  Kernideen oder Modell; Entscheid des Nutzers vom 17.10.2026): Er übersieht hier Kernideen, die die KI-Tester sehen.
  Von 44 Leveln in „mittel“ mit Urteil der KI-Tester und ohne Ausschlussgrund haben 29 keine erkannte Kernidee; bei
  27 davon sehen beide KI-Tester einen Aha-Moment, 19 haben ein Gefühl von mindestens 4 (etwa Uhrwerk 5,0,
  Spektralband, Rochade, Schimmer 4,5). Das Gefühl unterscheidet sich kaum: im Mittel 3,97 mit, 3,86 ohne erkannte
  Kernidee. Die Schwelle der Übereinstimmung im Test des Spielwerts ist darum auf 0,26 / 0,25 gesenkt (gemessen
  0,28 / 0,27).
- Die Urteile stehen im Protokoll (`pruefung-1` bis `-7`, dazu Probe- und Eichläufe); `node tools/ordne-level.mjs
  --json <datei>` gibt je Level Duldung, Spielwert und Urteil aus. Anker A3 Glasfenster steht nur ohne Kernidee auf
  der Liste; wird es ersetzt, braucht es einen neuen Anker und eine neue Version des Ablaufs der KI-Tester.

**Hinweis aus Ticket 20 (Generator):**
- `mittel-mischziel` liefert 1 125 von 2000 Seeds (Schwierigkeit 45,2 / 48,1 / 51,0), `mittel` ohne Kernidee nur
  201, denn ohne Baustein ist eine Kernidee nur nebenbei nötig.
- Mit verlangtem Mischziel ist die Haupt-Kernidee fast immer das Mischziel. Für „höchstens zweimal je 10 Level“
  braucht es die Bausteine aus Ticket 19. Ein Ersatz für eine bestimmte Lücke kann `schwierigkeit: [von, bis]`
  verlangen.
