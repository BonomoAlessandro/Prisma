# 25: Austausch „schwer“

**What to build:** Die schweren Level auf der Duldungsliste werden durch neue Level aus dem Generator ersetzt, in einem
Durchgang. Laut Neuzählung sind es 17 Level: 101, 106, 111, 116, 120, 121, 128, 129, 131, 132, 133, 134, 136, 137, 138,
139 und 140. Massgebend ist die Duldungsliste nach den Tickets 15 und 16.

**Spec:** ../spec.md, Abschnitt „Levelliste, Reihenfolge und Austausch“.

**Blocked by:** 16 (KI-Tester prüfen die grossen Abweichungen), 19 (Generator: alle Kernideen), 20 (Generator:
Verfeinern), 28 (Generator: Kernideen ab „mittel“)

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

## Comments

**Hinweis aus Ticket 15 (16.10.2026, Review):** Die Duldungsliste steht jetzt nach Grund getrennt in
`tools/levelliste.json`. In „schwer“ stehen 20 Level darauf: 14 mit Ausschlussgrund (Rangierbahnhof, Opal,
Lichtschleife, Unendlichkeit, Komet, Interferenz, Irrlicht, Leuchtturm, Glasperlenspiel, Sternbild, Singularität,
Urknall, Kristallpalast, Lichtgeschwindigkeit) und 6 nur wegen Kernidee oder Spielwert (Sternwarte, Kathedrale, Pendel,
Sonnenwende, Lichthof, Lichtjahr). Korona, Quasar und Ereignishorizont sind jetzt „sehr schwer“, Polarlicht „mittel“.
Über die 6 entscheidet der Nutzer nach Ticket 16 (Spec, Phase 6); davon hängt die Endbedingung „Liste leer“ ab.
Vor dem ersten Entfernen: `inHeutigerReihenfolge()` wirft, sobald ein Level der heutigen Reihenfolge fehlt (Ticket 15,
„Hinweise für Folgetickets“).

**Hinweis aus Ticket 16 (17.10.2026):** Nach den KI-Testern ist „schwer“ die Plätze 106–137; darauf stehen 19 von 32
Level auf der Duldungsliste: 13 mit Ausschlussgrund (Lichtschleife ist jetzt „mittel“) und dieselben 6 nur wegen
Kernidee oder Spielwert (Sternwarte, Kathedrale, Pendel, Sonnenwende, Lichthof, Lichtjahr). Vor dem Entscheid über die
Level ohne Ausschlussgrund wird der Spielwert in „mittel“ angesehen (Entscheid des Nutzers, Hinweis in Ticket 24); die
Übereinstimmung mit dem Gefühl der KI-Tester ist auch in „schwer“ schwach (Rangkorrelation 0,14 bei 15 Leveln ohne
Ausschlussgrund).

**Hinweis aus Ticket 20 (Generator):** `schwer-mischziel` liefert 693 von 2000 Seeds (Schwierigkeit 61,6 / 64,9 /
70,0; rund 0,2 CPU-s je Seed), `schwer` ohne Kernidee 352 (0,5 CPU-s je Seed). Die neuen Level liegen eher im
unteren Teil von „schwer“. Für Ersatz weit oben (die Level im Spiel reichen bis 87) hilft eine Ziel-Schwierigkeit
`schwierigkeit: [von, bis]`; sie kostet Ausbeute. Haupt-Kernidee meist das Mischziel, siehe Ticket 24.

**Nach dem Merge mit 19** (Probe in Ticket 20, Seeds 1–100 je Auftrag): `schwer-mischziel` 39 Level,
`schwer-sammelstelle` 36, `schwer-falle` 8, Abschalten und Farben abzählen je 4, Lockvogel 0. Für „höchstens zweimal
je 10 Level“ stehen also vor allem Mischziel und Sammelstelle bereit; siehe Ticket 24.

**Entscheid des Nutzers zur Haupt-Kernidee (17.10.2026):** Die Regel „verlangte Kernidee = Haupt-Kernidee“ kommt als
Wahl im Auftrag mit dem Austausch, siehe Ticket 23.

**Hinweis aus Ticket 28 (18.10.2026):** Bei „schwer“ liefert jetzt jede Kernidee genug Level mit ihr als
Haupt-Kernidee, Seeds 1–200 je Auftrag: Sammelstelle 54, Mischziel 52, Farben abzählen 50, Lockvogel 24, Falle 18,
Abschalten 16 (je CPU-Stunde 560 bis 6 300, `--jobs 7`). Knapp ist 121–140: Falle und Abschalten haben dort schon je
2; auf 121–130 bleiben Farben abzählen 1, Sammelstelle 1, Lockvogel 2, Mischziel 2, auf 131–140 Falle 2,
Sammelstelle 1, Lockvogel 2, Mischziel 2 (131–140 teilt sich das mit Korona aus „sehr schwer“). Tabellen in Ticket 28.
