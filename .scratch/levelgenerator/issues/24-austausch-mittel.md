# 24: Austausch „mittel“

**What to build:** Die mittleren Level auf der Duldungsliste werden durch neue Level aus dem Generator ersetzt, in einem
Durchgang. Laut Neuzählung sind es 11 Level: 31, 36, 38, 40, 43, 67, 77, 86, 92, 97 und 98. Massgebend ist die
Duldungsliste nach den Tickets 15 und 16.

**Spec:** ../spec.md, Abschnitt „Levelliste, Reihenfolge und Austausch“.

**Blocked by:** 16 (KI-Tester prüfen die grossen Abweichungen), 19 (Generator: alle Kernideen), 20 (Generator:
Verfeinern), 28 (Generator: Kernideen ab „mittel“)

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
- **Nach dem Merge mit 19** (Probe in Ticket 20, Seeds 1–100 je Auftrag): `mittel-mischziel` 55 Level,
  `mittel-sammelstelle` 43, `mittel-falle` 13, `mittel-abschalten` 3, Farben abzählen und Lockvogel 0. Für
  „höchstens zweimal je 10 Level“ stehen ab „mittel“ also vor allem Mischziel und Sammelstelle bereit, dazu wenig
  Falle. Liegen viele Ersatzlevel nah beieinander, kann das knapp werden. Die Haupt-Kernidee wählt die Beurteilung
  (`beurteilung.hauptKernidee`), nicht der Auftrag.

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
- Die Zahl 11 im Kopf dieses Tickets zählt 31 Lichtbündel mit (Neuzählung, vorläufige Grade). Lichtbündel ist seit
  Ticket 15 „leicht“ und in Ticket 23 ersetzt. Massgebend sind die 11 Level mit Ausschlussgrund in „mittel“ aus dem
  Hinweis aus Ticket 16, dazu Sonnenstrahl und Widerschein (von beiden KI-Testern abgelehnt).
