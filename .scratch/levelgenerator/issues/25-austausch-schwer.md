# 25: Austausch „schwer“

**What to build:** Die schweren Level auf der Duldungsliste werden durch neue Level aus dem Generator ersetzt, in einem
Durchgang. Laut Neuzählung sind es 17 Level: 101, 106, 111, 116, 120, 121, 128, 129, 131, 132, 133, 134, 136, 137, 138,
139 und 140. Massgebend ist die Duldungsliste nach den Tickets 15 und 16.

**Spec:** ../spec.md, Abschnitt „Levelliste, Reihenfolge und Austausch“.

**Blocked by:** 16 (KI-Tester prüfen die grossen Abweichungen), 19 (Generator: alle Kernideen), 20 (Generator:
Verfeinern), 28 (Generator: Kernideen ab „mittel“)

**Status:** resolved

- [x] Für jedes schwere Level der Duldungsliste gibt es ein Ersatzlevel aus dem neuen Generator, mit dem Grad „schwer“
      und einer nötigen Kernidee. Nach dem Entscheid des Nutzers vom 19.10.2026 (Option a) gilt das für die 15 zu
      ersetzenden (13 mit Ausschlussgrund, dazu Lichthof und Sternwarte, schwach beurteilt); 4 stark beurteilte bleiben
      (Grund „behalten nach Urteil der KI-Tester“).
- [x] Die Formel ordnet jedes Ersatzlevel ein, und beide KI-Tester prüfen es (Protokoll). Lehnen beide ab, kommt ein
      neuer Kandidat.
- [x] **Haltepunkt:** Die Namen im bisherigen Stil werden vorgeschlagen, und der Nutzer genehmigt sie, bevor sie ins
      Spiel kommen. Die Genehmigung steht unter `## Comments`.
- [x] Die ersetzten Level sind samt Namen entfernt, und die Namen stehen auf der Liste der entfernten Namen.
- [x] Auf der Duldungsliste steht kein schweres Level mehr. Ist dieses Ticket das letzte der Tickets 23–26, ist die
      Liste leer, und der Test verlangt ab jetzt eine leere Liste. Nach den Entscheiden des Nutzers (Tickets 24 und 25)
      stehen nur noch die 4 behaltenen schweren Level darauf; mit diesem letzten der Tickets 23–26 nennt die Liste genau
      die 31 behaltenen Level (mittel 27, schwer 4), und der Test verlangt das.
- [x] Die Regel „dieselbe Haupt-Kernidee höchstens zweimal je 10 Level“ bleibt erfüllt.
- [x] Alle Tests sind grün. Stichproben der Screenshots sind geprüft.

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
Abschalten 14 (je CPU-Stunde 660 bis 6 300, `--jobs 7`; Abschalten in vier Bereichen zu 200 Seeds, 1–800, 13–17, nach
dem Review). Knapp ist 121–140: Auf 121–130 haben Falle und Abschalten schon je 2, auf 131–140 Abschalten und Farben
abzählen; auf 121–130 bleiben Farben abzählen 1, Sammelstelle 1, Lockvogel 2, Mischziel 2, auf 131–140 Falle 2,
Sammelstelle 1, Lockvogel 2, Mischziel 2 (131–140 teilt sich das mit Korona aus „sehr schwer“). Tabellen in Ticket 28.

**Hinweis aus Ticket 23 (Austausch „leicht“, 18.10.2026):**
- Ablauf mit den Werkzeugen aus Ticket 23 (README zu `ordne-level.mjs`, `prepare.mjs` und `generiere.mjs`):
  1. Kandidaten mit `generiere.mjs <auftrag> --schwierigkeit VON,BIS`. Als Ziel-Schwierigkeit taugt die Lücke zwischen
     den Nachbarn des ersetzten Levels nach der Schwierigkeit; dann bleibt der Platz der Formel aller anderen Level
     gleich.
  2. Eine Austausch-Datei (JSON-Liste `{ ersetzt, level, auftrag, seed, schwierigkeit }`, `schwierigkeit` die
     Ziel-Schwierigkeit `[von, bis]` aus Schritt 1) und `ordne-level.mjs --austausch <datei> --json <ausgabe>` ohne
     `--schreiben`: Platz, Grad, Haupt-Kernidee und Regeln, als wären die Kandidaten im Spiel. Auftrag, Seed und
     Ziel-Schwierigkeit kommen beim Schreiben als Herkunft in den Kommentar; ohne die Ziel-Schwierigkeit baut
     `generiere.mjs` das Level nicht nach (Review Ticket 23, M1).
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

**Hinweis aus Ticket 26 (Austausch „sehr schwer“, 19.10.2026):**
- **Neue Regel** (Entscheid des Nutzers vom 19.10.2026): Die Entscheide aus Ticket 16 zu den Leveln der Prüfliste
  bleiben fest, auch wenn ein Austausch die Formel verschiebt. An dem Platz der Formel beim Entscheid
  (`prueflisteFormel` in `tools/levelliste.json`, `formelEntscheid` in `reihenfolge`) misst sich, ob ein Level auf der
  Prüfliste steht, und mit ihm rechnet die Zustimmung. Ein Level, das erst durch einen Austausch weiter als 10 Plätze
  wandern würde, steht neu auf der Prüfliste und braucht ein Urteil; danach kommt sein Platz der Formel dazu
  (`festePlaetze`, nach dem Review von Ticket 26, M1). Anlass war Zwielicht: Ohne Spiegelkabinett (Formel 131) wäre es
  von 122 auf 136 gesprungen. Es bleibt auf 122, in „schwer“ verschiebt sich durch Ticket 26 kein Level. Knapp an der
  Grenze stehen Sternenstaub (A7) und Pulsar (A8) mit je 1 Platz, Lichtkegel mit 2 sowie Halo, Brechpunkt, Feuerwerk
  und Lichtbrücke mit je 3.
- **Seite 131–140** nach Ticket 26: 131 Sternbild, 132 Singularität, 133 Urknall, 135 Lichtgeschwindigkeit (alle
  Duldungsliste, hier zu ersetzen), 134 Halo (Farben abzählen), 136 Sonnenfinsternis (Abschalten), 137 Lichtbrücke
  (Farben abzählen), 138 Sternenstaub (Abschalten), 139 Abendstern (Sammelstelle), 140 Lichtfächer (neu, Mischziel aus
  zwei Quellen). Frei bleiben dort für die 4 Ersatzlevel: Falle 2, Sammelstelle 1, Lockvogel 2, Mischziel 1. Eine
  Korrektur der KI-Tester darf ein Ersatzlevel nicht über 137/138 tragen (Gradgrenze).
- **Anker:** A8 Pulsar steht jetzt auf 149 (die neuen Level auf 144–148 haben die KI-Tester unter A8 eingeordnet); der
  Ablauf bleibt Version 2.
- **Zerfall:** Die KI-Tester nannten in Ticket 26 keinen Zerfall, wohl aber in Ticket 24. Die Vorprüfung aus Ticket 24
  (`zerfall-check.mjs` im Scratchpad unter `t24\`, Kopie unter `t26\`) trennte im Pool „sehr schwer“: Farben abzählen
  28 von 28 mit einem Teil, Mischziel 10 von 47, Sammelstelle 8 von 22, Falle 5 von 15.

**Hinweis aus Ticket 24 (19.10.2026):**
- **„Liste leer“ gilt so nicht mehr** (Entscheid des Nutzers vom 18.10.2026): In „mittel“ bleiben die Level, die nur
  wegen Kernidee oder Spielwert auf der Duldungsliste standen und nach der Regel stark gut beurteilt sind, unter dem
  Grund „behalten nach Urteil der KI-Tester“ (27 von 44). Regel `stark` in `tools/levelliste.mjs`: jedes Urteil im
  Protokoll (Ablauf 1 und 2, auch Probe-, Eich- und Ankerläufe) mit Aha-Moment bei beiden und ohne Begriff der
  Ablehnung, Gefühl im Mittel über alle Urteile mindestens 4, mindestens ein Urteil aus Ablauf 2. Die Gruppe steht in
  `tools/levelliste.json` (`behalten`) und wächst nie; der Test verlangt nach dem Austausch eines Grads, dass aus ihm
  nur noch behaltene Level auf der Duldungsliste stehen. Ob dieselbe Regel für die 6 schweren Level ohne
  Ausschlussgrund gilt, entscheidet der Nutzer hier selbst; dann gehören sie in die Gruppe (der Test kennt heute nur
  die Liste aus Ticket 24, `BEHALTEN_TICKET_24`).
- Für die Level ohne Urteil: ein Lauf wie `behalten-mittel-1` (zählt nicht für die Levelliste, geht aber in die
  Eichmenge des Spielwerts ein; vorher die Übereinstimmung prüfen).
- Die KI-Tester sehen oft Zerfall, wo die Beurteilung keinen findet; die Vorprüfung `t24\zerfall-check.mjs` trifft ihre
  Nennungen an den 26 Kandidaten der ersten Runde genau. Viele Korrekturen der KI-Tester nahe beieinander können ein
  korrigiertes Level weiter als 5 Plätze schieben; dann macht die Häufungsregel keine Züge mehr (in 24 mit einer
  anderen Wahl je Lücke gelöst, Skript `t24\suche.mjs`). Seit dem Review von Ticket 24 (M1) meldet `ordne-level.mjs`
  das selbst unter „Regeln der Levelliste“ (Platz davor, nach den Korrekturen, am Ende; `zuWeitKorrigiert` in
  `levelliste.mjs`) und schreibt dann nicht, auch mit `--austausch`.

**Stufe A1 (19.10.2026): Bestand, Entscheidungsgrundlage zu Gruppe 2, Bedarf je Seite.** Noch keine Kandidaten.
Branch `ticket/25-austausch-schwer` von `origin/feature/levelgenerator` (`a7f4337`). Den Stand nach Ticket 24 zeigt
eine Kopie von `ticket/24-austausch-mittel` (`681ebe2`, nicht gemergt) im Scratchpad. Skripte und Zwischenstände liegen
unter `t25\`, die Läufe gehen über `leise.sh` mit `LEISE_MAX_CPU=80 LEISE_CPU=80`.
- **Bestand** (`ordne-level.mjs --json`, `tools/levelliste.json`; in „schwer“ auf beiden Ständen gleich): „schwer“
  sind die Plätze 106–137 (32 Level), davon stehen 19 auf der Duldungsliste, wie im Hinweis aus Ticket 16.
  - **Gruppe 1, 13 Level** (werden ersetzt), alle mit Ausschlussgrund; von beiden KI-Testern abgelehnt ist in „schwer“
    keines. Plätze im Spiel:
    - Scheinmischung: 109 Rangierbahnhof (dazu ohne Kernidee, unter 60), 110 Opal, 115 Unendlichkeit, 119 Komet
      (dazu unter 60), 123 Interferenz, 125 Irrlicht, 128 Leuchtturm, 129 Glasperlenspiel, 135 Lichtgeschwindigkeit;
    - Zerfall: 116 Kristallpalast (Prüfliste, zur Formel 121, Korrektur −5) und 131 Sternbild;
    - mehrere Gründe: 132 Singularität (Scheinmischung, Zerfall), 133 Urknall (Scheinmischung, Knäuel, unter 60).
  - **Gruppe 2, 6 Level**, nur wegen Kernidee oder Spielwert auf der Liste, alle ohne nötige Kernidee und unter 60:
    106 Sonnenwende, 107 Pendel, 108 Kathedrale, 113 Sternwarte, 114 Lichthof, 120 Lichtjahr.
  - Die 17 Plätze im Kopf des Tickets sind heutige Plätze der Neuzählung mit den vorläufigen Graden. Davon sind
    Polarlicht und Lichtschleife seit Ticket 15 „mittel“ (ersetzt in 24), Korona, Quasar und Ereignishorizont „sehr
    schwer“ (ersetzt in 26). Neu dazu kommt 98 Rangierbahnhof (heute „schwer“), also 13 mit Ausschlussgrund, dazu die
    6 der Gruppe 2.
- **Entscheidungsgrundlage zu Gruppe 2** (Regel `stark` aus `tools/levelliste.mjs` auf dem Stand von Ticket 24, an den
  Urteilen im Protokoll; `t25\stark.mjs`):

  | Platz | Name | Formel | Urteile (Lauf, Ablauf: Gefühl A/B, Aha A/B, Ablehnung A/B) | Gefühl im Mittel | Spielwert | Regel stark heute |
  |---:|---|---:|---|---:|---:|---|
  | 106 | Sonnenwende | 77 | spielwert-1 (1): 4/4, ja/ja, –/–; pruefung-1 (2): 5/4, ja/ja, –/– | 4,25 | 48,8 | stark |
  | 107 | Pendel | 84 | pruefung-3 (2): 4/4, ja/ja, –/– | 4,00 | 50,5 | stark |
  | 108 | Kathedrale | 86 | pruefung-7 (2): 4/4, ja/ja, –/– | 4,00 | 49,2 | stark |
  | 113 | Sternwarte | 110 | – | – | 38,3 | ohne Urteil |
  | 114 | Lichthof | 111 | spielwert-3 (1): 4/3, ja/ja, Scheinmischung/Scheinmischung | 3,50 | 56,2 | schwach |
  | 120 | Lichtjahr | 119 | – | – | 54,3 | ohne Urteil |

  - Erkannte Kernideen: bei keinem der sechs; alle stehen ohne nötige Kernidee und unter dem Mindest-Spielwert auf der
    Liste. Die KI-Tester beschreiben als Aha-Moment:
    - Sonnenwende und Pendel: ein Kombinator mischt Rot und Blau bzw. Rot und Grün desselben Prismas, und Spiegel der
      weissen Stränge lenken den zweiten Strahl mit (ein Mischziel aus einer Quelle, ausserhalb des Glossars, wie in
      „mittel“);
    - Kathedrale: Farben abzählen im weiteren Sinn (der Filter nimmt zwei Quellen das Blau, also bedient die dritte
      das weisse Ziel), danach Grün auf langem Weg über doppelt genutzte Spiegel;
    - Lichthof: Gelb aus Rot und Grün läuft über mehrere Spiegel in ein Prisma, das es wieder trennt. Beide nennen das
      Scheinmischung (b). Die Beurteilung zählt es nicht, weil die Mischung nicht direkt ins Prisma läuft (Grenzfall
      der Neuzählung, Spec „Weitere Hinweise“).
  - **Nach der Regel heute:**
    - stark: Sonnenwende, Pendel und Kathedrale. Jedes hat ein Urteil aus Ablauf 2 (`pruefung-…`).
    - schwach: Lichthof. Beide nennen Scheinmischung, das Gefühl ist 3,5, und es gibt nur ein Urteil aus Ablauf 1
      (Eichlauf `spielwert-3`). Weil jedes Urteil zählt, bleibt es auch mit einem neuen Urteil schwach.
    - ohne Urteil: Sternwarte (tiefster Spielwert in „schwer“) und Lichtjahr.
    - nur mit Urteil aus Ablauf 1: Lichthof.
  - Sonnenwende, Pendel und Kathedrale stehen als Level der Prüfliste am heutigen Platz. Nach der Formel lägen sie auf
    77–86 (Schwierigkeit 52,1–54,6, nach der Schwelle „mittel“); „schwer“ sind sie nur durch ihren Platz. Beide
    KI-Tester wollten sie früher haben (Korrektur −5, −5, −3), aber nicht so früh wie die Formel.
- **Optionen:**
  - **(a) Dieselbe Regel wie in „mittel“, mit einem Lauf** (meine Empfehlung). Der Lauf `behalten-schwer-1` beurteilt
    Sternwarte und Lichtjahr; er zählt nicht für die Levelliste, geht aber in die Eichmenge des Spielwerts ein. Danach
    gilt die Regel stark für alle 6.
    - Sonnenwende, Pendel und Kathedrale bleiben unter dem Grund „behalten nach Urteil der KI-Tester“, Lichthof wird
      ersetzt, Sternwarte und Lichtjahr je nach Urteil. Zu ersetzen sind also 14 bis 16 Level.
    - Kosten: ein kleiner Lauf (2 Level), dazu Kandidat und Ersatz für 14–16 Lücken (zwei bis drei Läufe
      `ersatz-schwer-…`).
    - Die Gruppe `behalten` wächst um 3 bis 5 Level. Der Test lässt heute nur die 27 aus Ticket 24 zu
      (`BEHALTEN_TICKET_24`) und braucht dann die Liste aus diesem Entscheid dazu.
    - Folge: In „schwer“ bleiben 3–5 behaltene Level auf der Duldungsliste.
    - Eichmenge des Spielwerts: Die Übereinstimmung ist heute 0,29 ohne Ausschlussgrund und 0,27 über alle (Stand
      nach 24, Schwelle 0,26 / 0,25). Mit den zwei neuen Urteilen (angenommenes Gefühl als Mittel aus A und B,
      `t24\eichmenge-sim.mjs`): beide 3 ergibt 0,31 / 0,28, beide 4 ergibt 0,28 / 0,26, beide 4,5 ergibt 0,26 / 0,24,
      dann also unter der Schwelle über alle. Zieht man das Gefühl zufällig aus den 50 mittleren Leveln mit Urteil
      ohne erkannte Kernidee, fällt es in 3,9 % der Fälle unter eine Schwelle. Der Grund ist Sternwarte mit dem
      tiefsten Spielwert (38,3): Finden beide KI-Tester es sehr gut, sinkt die Übereinstimmung. Dann entscheidet wie
      in Ticket 24 der Nutzer.
  - **(a′) Dieselbe Regel, ohne Lauf:** Sternwarte und Lichtjahr gelten ohne Urteil als schwach und werden ersetzt
    (16 Level). Das spart den Lauf, aber die Regel aus „mittel“ beurteilte zuerst.
  - **(b) Alle 6 ersetzen** (19 Level). Die Duldungsliste ist in „schwer“ danach leer. Teuer ist das auf 101–110:
    - Sonnenwende, Pendel und Kathedrale brauchen Ersatz mit dem Grad „schwer“ (ab 58,5) auf 106–108. Zusammen mit
      Rangierbahnhof und Opal teilen sich fünf Level die Lücke 58,5–59,28.
    - Ohne Lockvogel muss die Seite dann genau Falle 2, Abschalten 2 und Farben abzählen 1 bringen.
    - Die Formel von 26 Leveln (alle „mittel“ ausser Supernova) rückt um bis zu 3 Plätze. Prüfliste und Entscheide
      bleiben (feste Plätze), aber die Korrekturen von drei Leveln aus „mittel“ rechnen neu (Türkis +3 → +5,
      Rundflug 0 → +1, Prismenreigen −5 → −4), und Wabe, Smaragd, Lichtbogen und Prismenreigen rücken um einen Platz.
  - **(c) Alle 6 behalten:** nach der Regel stark nicht möglich (Lichthof hat Ablehnungen); das bräuchte eine andere
    Regel.
  - Begründung der Empfehlung: Sie ist dieselbe Regel wie in „mittel“. Die drei starken Level haben Urteile aus
    Ablauf 2 mit Gefühl 4 bis 5. Ihr Ersatz wäre zudem der teuerste Teil von (b): enge Lücke, die Seite 101–110 voll
    und Folgen für „mittel“. Der Lauf zu zwei Leveln kostet wenig.
- **Bedarf je Seite** (Stand nach Ticket 24). Simuliert mit `reihenfolge` aus `tools/levelliste.mjs` samt
  `prueflisteFormel` (`t25\sim.mjs`); je Ersatz eine angenommene Schwierigkeit in seiner Lücke, ohne Korrektur der
  KI-Tester. Gezählt wird ohne die Duldungsliste, höchstens 2 je Haupt-Kernidee. Spalte „dürfen dazu“ in der
  Reihenfolge Fa / Ab / Fz / Sa / Lo / Mi:

  | Plätze | bleiben (Haupt-Kernidee) | neu: Gruppe 1 | dazu (a) | dazu (b) | dürfen dazu | ohne Lockvogel nötig |
  |---|---|---|---|---|---|---|
  | 101–110 | Mi 2 (Prismenreigen, Lichtbogen), Sa 2 (Türkis, Rundflug), Fz 1 (Doppelstern), alle „mittel“ aus 24 | 109, 110 | – | 106, 107, 108 | 2 / 2 / 1 / 0 / 2 / 0 | bei 5 neuen genau Fa 2, Ab 2, Fz 1 |
  | 111–120 | Mi 2 (Oase, Wetterleuchten), Fz 1 (Supernova), Fa 2 (Gordischer Knoten, Meisterstück) | 115, 118 | 114, je nach Urteil 113 und 119 | 113, 114, 119 | 0 / 2 / 1 / 2 / 2 / 0 | bei 5 neuen genau Ab 2, Fz 1, Sa 2 |
  | 121–130 | Fz 1 (Zwielicht), Sa 1 (Fata Morgana), Ab 2 (Rosette, Spiegelsaal), Fa 1 (Brennglas) | 121, 123, 125, 128, 129 | – | – | 1 / 0 / 1 / 1 / 2 / 2 | genau Fa 1, Fz 1, Sa 1, Mi 2 |
  | 131–140 | Fz 2 (Halo, Lichtbrücke), Ab 2 (Sonnenfinsternis, Sternenstaub), Sa 1 (Abendstern), Mi 1 (Lichtfächer) | 131, 132, 133, 135 | – | – | 2 / 0 / 0 / 1 / 2 / 1 | genau Fa 2, Sa 1, Mi 1 |

  - Jedes Ersatzlevel kommt auf den Platz des ersetzten Levels, ausser dem für Kristallpalast. Kristallpalast steht
    heute durch seine Korrektur auf 116, sein Ersatz kommt nach der Formel auf 121. Dazwischen rücken Wetterleuchten,
    Gordischer Knoten, Lichtjahr (falls es bleibt) und Komet (Ersatz) einen Platz vor, Meisterstück (Falle) von 121
    auf 120. Damit hat 111–120 schon Falle 2 und Mischziel 2, 121–130 nur noch Falle 1.
  - Sonst ändern sich in (a) weder Formel, Prüfliste, Entscheid noch Korrektur eines anderen Levels (in (b) siehe
    oben). Die Häufungsregel macht nur die drei bisherigen Züge, das Mittel je 10 Level steigt, und kein Level kommt
    neu auf die Prüfliste.
  - **Knapp sind 121–130 und 131–140 in jedem Fall:** Ohne Lockvogel muss dort jede freie Kernidee voll kommen; in
    Ticket 24 bestand kein Lockvogel die Vorprüfung auf Zerfall. Auf 101–110 genügt in (a) eine Kernidee. Auf 111–120
    genügen bei 3 neuen Leveln zwei; werden Sternwarte und Lichtjahr ersetzt (5 neue), ist auch diese Seite knapp.
  - Spielraum geben die Häufungsregel (bis 3 Plätze im Grad) und die Korrekturen der KI-Tester (bis 5 Plätze). Diese
    können ein Ersatzlevel aber auch auf die Nachbarseite tragen: das für Kristallpalast (121) mit −1 bis −5 auf
    111–120 (dort sind Falle und Mischziel voll), die auf 109 und 110 mit einer Korrektur nach oben ebenso.
  - Ziel-Schwierigkeit (Lücke nach dem Rang der Formel, Stand nach 24):
    - Rangierbahnhof und Opal: 59,13–59,28, nur 0,15 breit. Nach der Simulation taugt auch 58,5–59,28: Unter 59,13
      ändert sich nur die Formel von Farbverlauf (Prüfliste, Platz 93), und sein Entscheid ist fest.
    - Sternwarte, Lichthof und Unendlichkeit: 59,28–60,41 (bleiben Sternwarte und Lichthof, für Unendlichkeit
      59,70–60,41).
    - Komet und Lichtjahr: 62,40–66,03 (bleibt Lichtjahr, für Komet 62,40–64,20).
    - Kristallpalast und Interferenz 66,03–70,98; Irrlicht 70,98–75,57; Leuchtturm, Glasperlenspiel und Sternbild
      75,76–81,58; Singularität und Urknall 81,58–83,60; Lichtgeschwindigkeit 83,60–85,91 (die Gradgrenze 137/138 liegt
      zwei Plätze darüber).

**Entscheid des Nutzers zu Gruppe 2 (19.10.2026, über den Koordinator): Option (a).** Für Gruppe 2 in „schwer“ gilt
dieselbe Regel stark wie in „mittel“, mit einem eigenen Lauf für die Level ohne Urteil.
- Sonnenwende, Pendel und Kathedrale bleiben unter dem Grund „behalten nach Urteil der KI-Tester“, Lichthof wird
  ersetzt, Sternwarte und Lichtjahr behalten oder ersetzen nach der Regel stark.
- Fällt der Spielwert-Test nach dem Lauf unter 0,26 / 0,25, gehen die Zahlen an den Koordinator; Eichmenge und
  Schwelle bleiben.
- Erst nach dem Merge von Ticket 24: der Grund „behalten“ für „schwer“ und sein Test (eine eigene, nicht wachsende
  Liste wie `BEHALTEN_TICKET_24`), dann Kandidaten nach dem Bedarf je Seite, mit Rangfolge und Vorprüfung auf Zerfall
  wie in 24 und 26.

**Lauf `behalten-schwer-1` vorbereitet (19.10.2026).** `prepare.mjs behalten-schwer-1 113 120` (Plätze im Spiel), ohne
`--anker`, über `leise.sh` mit `LEISE_MAX_CPU=80 LEISE_CPU=80`: L1 120 Lichtjahr, L2 113 Sternwarte. Ablauf 2,
Fingerabdruck `066a880667331a43`, Agent `general-purpose`, Modell `claude-opus-5-5` (`lauf.json`). Bilder 18–19 s je
Aufnahme; die Anker sind neu aufgenommen (neuer Worktree). Aufträge unter
`tests/output/ki-tester/behalten-schwer-1/auftrag-A.md` und `auftrag-B.md` im Worktree. Der Lauf zählt nicht für die
Levelliste (wie `behalten-mittel-1`), geht aber in die Eichmenge des Spielwerts ein. Die KI-Tester startet der
Koordinator, nach dem Merge von Ticket 24. Bis dahin ist dieses Ticket pausiert.

**Merge mit Ticket 24, Lauf `behalten-schwer-1`, Kandidaten und Läufe `ersatz-schwer-1` und `-2` (19.10.2026).**
- **Merge** von `origin/feature/levelgenerator` (`1ed17a2`, mit Ticket 24) als Merge-Commit. Ein Konflikt in diesem
  Ticket; beide Seiten bleiben, der Hinweis aus 24 zuerst. Danach grün (über `leise.sh`, `LEISE_MAX_CPU=80
  LEISE_CPU=80`): golden (alle 159 Level wie in `golden.json`), logic 548, generator 30, beurteilung 178,
  levelliste 42, ki-tester 64, offline; `ordne-level.mjs` meldet „stimmen“. Das Ergebnis je Level (`--json`) ist
  gleich wie in der Vorschau aus Stufe A1 (150 von 150), Lücken und Bedarf je Seite gelten also unverändert.
- **`behalten-schwer-1` zusammengeführt** (`merge.mjs`, 2 Einträge, Ablauf 2): Lichtjahr 4/4, Aha ja/ja, keine
  Ablehnung; Sternwarte 3/4, Aha ja/ja, keine Ablehnung. Die Korrekturen (−5, −1) gelten nicht, der Lauf zählt nicht
  für die Levelliste. `ki-tester.test.mjs` grün (64); Spielwert jetzt 0,30 ohne Ausschlussgrund (116 Level) und 0,27
  über alle (167), Schwelle 0,26 / 0,25.
- **Regel stark** (`stark` in `tools/levelliste.mjs`): stark sind Sonnenwende, Pendel, Kathedrale und Lichtjahr (4,00),
  schwach sind Sternwarte (Gefühl 3,50) und Lichthof. **Zu ersetzen sind 15 Level:** die 13 der Gruppe 1, Lichthof und
  Sternwarte. Der Grund „behalten“ für die vier und sein Test kommen mit Stufe C.
- **Generator:** `generiere.mjs schwer-<kernidee> --schwierigkeit VON,BIS --anzahl 12 --seeds 600`, je Lücke die
  Kernideen, die auf ihrer Seite frei sind (35 Aufträge, 9 Prozesse, Scratchpad `t25\gen1\`). Gefiltert nach
  Haupt-Kernidee = verlangte, mindestens 2 Quellen und Vorprüfung auf Zerfall (ein Teil, `t24\zerfall-check.mjs`).
  Taugliche je Lücke: 58,5–59,28 12, 59,45–60,41 15, 62,4–64,2 21, 66,03–70,98 22, 70,98–75,57 19,
  75,76–81,58 20, 81,58–83,6 5, 83,6–85,91 7. Lockvogel besteht die Vorprüfung fast nie (2 von 35), Mischziel
  selten (5 von 40).
- **Gewählt** je Lücke Kandidat und Ersatz nach Spielwert und den Haupt-Kernideen je Seite. Mit allen Kandidaten ist
  jede Seite eingehalten; mit allen Ersatzleveln zugleich hat 121–130 Falle 3-mal (zählt erst bei der Wahl, wie in
  24). Je Zelle: Abdruck, Auftrag `schwer-…`, Seed; Schwierigkeit; Haupt-Kernidee; Platz (Formel) nach
  `ordne-level.mjs --austausch`:

  | ersetzt | Ziel | Kandidat (`ersatz-schwer-1`) | Ersatz (`ersatz-schwer-2`) |
  |---|---|---|---|
  | Rangierbahnhof | 58,5–59,28 | e42ac1c0: abzaehlen, 77; 59,28; Fz; 110 (108) | 6ce8e339: falle, 557; 58,81; Fa; 109 (106) |
  | Opal | 58,5–59,28 | b93dc895: abschalten, 570; 59,15; Ab; 109 (107) | dbba6247: abzaehlen, 370; 58,87; Fz; 110 (107) |
  | Lichthof | 59,45–60,41 | f3eed0f8: abschalten, 50; 59,64; Ab; 113 (110) | e71667a6: abschalten, 8; 59,85; Ab; 113 (110) |
  | Unendlichkeit | 59,45–60,41 | 7cdeab95: abzaehlen, 324; 59,67; Fz; 114 (111) | 43554748: abzaehlen, 57; 59,88; Fz; 115 (112) |
  | Sternwarte | 59,45–60,41 | 1e992573: sammelstelle, 112; 60,00; Sa; 115 (112) | 43fb9e6d: sammelstelle, 275; 59,87; Sa; 114 (111) |
  | Komet | 62,4–64,2 | 3a58a7d5: sammelstelle, 103; 64,11; Sa; 118 (118) | 2b2c360a: abschalten, 204; 63,50; Ab; 118 (118) |
  | Kristallpalast | 66,03–70,98 | 84bdf14e: mischziel, 17; 67,84; Mi; 121 (121) | 2a7a744a: mischziel, 79; 67,52; Mi; 123 (122) |
  | Interferenz | 66,03–70,98 | e6f1434d: falle, 44; 70,02; Fa; 123 (122) | 290c4eb8: sammelstelle, 73; 66,83; Sa; 121 (121) |
  | Irrlicht | 70,98–75,57 | e356c4e7: mischziel, 66; 72,27; Mi; 125 (124) | da6b6dd9: falle, 559; 74,33; Fa; 125 (124) |
  | Leuchtturm | 75,76–81,58 | cd12705b: sammelstelle, 89; 77,36; Sa; 128 (127) | 292940a1: falle, 194; 77,23; Fa; 128 (127) |
  | Glasperlenspiel | 75,76–81,58 | 7df94a31: abzaehlen, 261; 77,86; Fz; 129 (128) | 364ab006: abzaehlen, 28; 79,02; Fz; 129 (128) |
  | Sternbild | 75,76–81,58 | a88f32c8: falle, 409; 81,53; Fa; 131 (129) | 757ddcbd: falle, 387; 79,05; Fa; 131 (129) |
  | Singularität | 81,58–83,6 | db7d29ef: lockvogel, 301; 81,69; Lo; 133 (132) | d0b808b9: falle, 16; 82,64; Fa; 133 (132) |
  | Urknall | 81,58–83,6 | d4ea96ec: sammelstelle, 458; 81,61; Sa; 132 (131) | 307f6bfc: sammelstelle, 371; 82,01; Sa; 132 (131) |
  | Lichtgeschwindigkeit | 83,6–85,91 | 3f1f9eaa: falle, 529; 84,00; Fa; 135 (134) | 6ec6e6d7: mischziel, 568; 85,67; Mi; 135 (134) |

  - Benachbarte ersetzte Level teilen eine Lücke; welches neue Level welchen Platz bekommt, folgt der Schwierigkeit.
  - Ziel für Rangierbahnhof und Opal 58,5–59,28 (Stufe A1); dabei ändert sich nur die Formel von Farbverlauf, sein
    Entscheid ist fest.
- **`--austausch`** (ohne `--schreiben`, je ein Lauf mit allen Kandidaten und mit allen Ersatzleveln): alle 30
  „schwer“ auf 109–135, „schwer“ bleibt 106–137; keines auf der Duldungsliste. Prüfliste 35 (die 36 ohne
  Kristallpalast), alle mit Urteil, Entscheide unverändert, keine Sperre wegen zu weit korrigierter Level. Mit den
  Kandidaten ist die Haupt-Kernidee je 10 Level eingehalten (Häufungsregel: Lichtwaage 50 → 51, Doppelspiegel
  102 → 100, a88f32c8 130 → 131 statt Spiegelsaal); das Mittel je 10 Level steigt überall (kleinster Schritt +0,47).
  Duldungsliste danach 31 (schwer 4, genau die behaltenen).
- **Läufe** (Ablauf 2, Fingerabdruck unverändert, ohne `--anker`, Agent `general-purpose`, Modell `claude-opus-5-5`):
  `ersatz-schwer-1` mit den 15 Kandidaten, `ersatz-schwer-2` mit den 15 Ersatzleveln, je `prepare.mjs <lauf>
  --kandidaten <Liste>` (nur Einträge „Kandidat …“ ohne Urteil). Referenz ist der Platz der Formel (106–134, alle
  „schwer“). Bilder 22–24 s je Aufnahme; die Anker im ersten Lauf neu (index.html nach dem Merge), im zweiten aus dem
  Zwischenspeicher. Aufträge unter `tests/output/ki-tester/ersatz-schwer-1/` und `ersatz-schwer-2/` im Worktree; die
  KI-Tester startet der Koordinator.

**Läufe `ersatz-schwer-1` und `-2` zusammengeführt, Wahl je Lücke, Namensvorschläge (19.10.2026).**
- **Merge:** `merge.mjs` für beide Läufe (je 15 Einträge, Ablauf 2), `tests/ki-tester.test.mjs` grün (64). Beide
  KI-Tester lehnen kein Level ab; einen Begriff nennt nur A bei e356c4e7 (Zerfall, Vorprüfung ein Teil). Ohne
  Aha-Moment bei einem KI-Tester ist e42ac1c0 (A). Viele Korrekturen sind −5 oder +5.
- **Wahl** nach der Rangfolge aus 26 und 24 (nicht abgelehnt, beide Aha, kein Begriff, ein Teil, Gefühl, bei
  Gleichstand Spielwert; Kandidat und Ersatz gleichwertig, `t25\wahl.mjs`). Mit den besten Leveln bleiben drei
  Häufungen offen (111–120 Sammelstelle, 121–130 Falle, 131–140 Farben abzählen), weil die Korrekturen die neuen Level
  über die Seiten tragen. Eine Suche mit `reihenfolge()` (`t25\suche.mjs`; Lücken mit gemeinsamer Ziel-Schwierigkeit
  dürfen ihre Level tauschen) findet eine Wahl ohne Fehler. Alle gewählten Level haben Aha bei beiden, keinen Begriff
  und einen Teil; abweichend vom besten nach dem Gefühl sind Opal (dbba6247 3/3 statt 6ce8e339 4/4, das jetzt
  Rangierbahnhof füllt) und die Verteilung innerhalb der gemeinsamen Lücken.
- **`--austausch` mit der Wahl** (alle 15, ohne `--schreiben`): alle „schwer“ auf 108–137, „schwer“ bleibt 106–137;
  keines auf der Duldungsliste (schwer 4, genau die behaltenen). Prüfliste 35, alle mit Urteil, Entscheide
  unverändert. Haupt-Kernidee je 10 Level eingehalten (Häufungsregel: Lichtwaage 50 → 51, Doppelspiegel 102 → 100,
  dbba6247 110 → 111, 84bdf14e 118 → 121, 292940a1 130 → 131). Korrekturen höchstens 5 Plätze vom Platz davor, nach den
  Korrekturen und am Ende: eingehalten (keine Sperre). Keine Korrektur geht über 105/106 oder 137/138. Mittel je 10
  Level steigt überall (kleinster Schritt +0,48). Anker: A5 Oase auf 114, A6 Lichtbrücke auf 136.
- **Namensvorschläge** (je drei, der Favorit zuerst; keiner im Spiel oder unter den entfernten Namen, keiner mit
  Licht-, Stern-, Weiss-, Gold-, Sonnen-, Brech- oder Brenn- und keiner nach einer Mechanik; kurz begründet nach den
  Beschreibungen der KI-Tester):

  | Platz | ersetzt | Abdruck | Haupt-Kernidee | Gefühl A/B | Namen (Favorit zuerst) |
  |---:|---|---|---|---|---|
  | 108 | Unendlichkeit | 7cdeab95 | Farben abzählen | 4/4 | **Wegweiser** (das einzige Grün steckt im Gelb, es zeigt den Weg zum weissen Ziel), Spurensuche, Grünfund |
  | 110 | Rangierbahnhof | 6ce8e339 | Falle | 4/4 | **Passstrasse** (Rot im Zickzack um den Block), Bergpfad, Umgehung |
  | 111 | Opal | dbba6247 | Farben abzählen | 3/3 | **Tandem** (zwei Spiegel tragen je zwei Strahlen), Weggefährten, Begleiter |
  | 113 | Komet | 3a58a7d5 | Sammelstelle | 4/4 | **Marktplatz** (das Prisma nimmt Magenta und Grün und verteilt auf drei Wege), Umschlagplatz, Börse |
  | 115 | Lichthof | f3eed0f8 | Abschalten | 4/4 | **Rollentausch** (das obere Grün gehört dem Cyan-Ziel, das grüne Ziel bekommt Grün von unten), Platzwechsel, Seitenwechsel |
  | 116 | Sternwarte | e71667a6 | Abschalten | 5/4 | **Stabübergabe** (die zweite Magenta-Quelle übernimmt das schon leuchtende Ziel), Schichtwechsel, Nachfolge |
  | 121 | Interferenz | 84bdf14e | Mischziel aus zwei Quellen | 4/4 | **Achterbahn** (Blau in einer Schleife über fünf Spiegel), Looping, Kreisverkehr |
  | 122 | Kristallpalast | 2a7a744a | Mischziel aus zwei Quellen | 4/5 | **Mäander** (Weiss im Zickzack zum Prisma unten rechts), Flusslauf, Flussschleife |
  | 125 | Irrlicht | da6b6dd9 | Falle | 4/4 | **Abkürzung** (der direkte Weg ins weisse Ziel ist die Falle), Sackgasse, Trugschluss |
  | 129 | Singularität | d4ea96ec | Sammelstelle | 5/4 | **Nadelöhr** (Rot, Cyan und Weiss laufen durch ein Prisma auf drei Ziele), Engpass, Flaschenhals |
  | 130 | Leuchtturm | 7df94a31 | Farben abzählen | 5/5 | **Odyssee** (Blau über zehn Spiegel, die fast alle schon gestellt sind), Irrfahrt, Weltreise |
  | 131 | Sternbild | 292940a1 | Falle | 4/4 | **Seeschlange** (Rot in einer langen Schlange quer durchs Feld), Lindwurm, Natter |
  | 132 | Glasperlenspiel | a88f32c8 | Falle | 4/4 | **Maskerade** (das Rot der Startstellung trifft, ist aber das falsche), Täuschung, Doppelgänger |
  | 134 | Urknall | 307f6bfc | Sammelstelle | 5/4 | **Weltumsegelung** (Grün einmal ums Feld und durch den Gelbfilter), Ringbahn, Äquator |
  | 137 | Lichtgeschwindigkeit | 6ec6e6d7 | Mischziel aus zwei Quellen | 4/4 | **Fehlstart** (die rote Quelle trifft am Start das falsche Ziel), Partnerwahl, Tanzpaar |

  Die Genehmigung des Nutzers folgt hier.

**Genehmigung des Nutzers (19.10.2026, über den Koordinator):** Alle 15 Favoriten gelten: 108 Wegweiser,
110 Passstrasse, 111 Tandem, 113 Marktplatz, 115 Rollentausch, 116 Stabübergabe, 121 Achterbahn, 122 Mäander,
125 Abkürzung, 129 Nadelöhr, 130 Odyssee, 131 Seeschlange, 132 Maskerade, 134 Weltumsegelung, 137 Fehlstart.

**Abschluss Stufe C (19.10.2026).**
- **Eingesetzt** mit `ordne-level.mjs --austausch <t25\austausch-genehmigt.json> --schreiben` (je Eintrag `ersetzt`,
  `name`, `auftrag`, `seed`, `schwierigkeit`, `level`; die Wahl aus Stufe B); ein zweiter Lauf ohne `--austausch`
  meldet „Reihenfolge und Grade stimmen“ und „Duldungsliste und Prüfliste stimmen“. Alle 150 Level stehen auf dem
  Platz aus der Prüfung mit `--austausch`.

  | Platz | neu | ersetzt | Schwierigkeit | Haupt-Kernidee | Herkunft (Auftrag, Seed, Ziel) | KI-Tester (Gefühl, Lauf) |
  |---:|---|---|---:|---|---|---|
  | 108 | Wegweiser | Unendlichkeit | 59,7 | Farben abzählen | schwer-abzaehlen, 324, 59,45–60,41 | 4/4, ersatz-schwer-1 |
  | 110 | Passstrasse | Rangierbahnhof | 58,8 | Falle | schwer-falle, 557, 58,5–59,28 | 4/4, ersatz-schwer-2 |
  | 111 | Tandem | Opal | 58,9 | Farben abzählen | schwer-abzaehlen, 370, 58,5–59,28 | 3/3, ersatz-schwer-2 |
  | 113 | Marktplatz | Komet | 64,1 | Sammelstelle | schwer-sammelstelle, 103, 62,4–64,2 | 4/4, ersatz-schwer-1 |
  | 115 | Rollentausch | Lichthof | 59,6 | Abschalten | schwer-abschalten, 50, 59,45–60,41 | 4/4, ersatz-schwer-1 |
  | 116 | Stabübergabe | Sternwarte | 59,8 | Abschalten | schwer-abschalten, 8, 59,45–60,41 | 5/4, ersatz-schwer-2 |
  | 121 | Achterbahn | Interferenz | 67,8 | Mischziel aus zwei Quellen | schwer-mischziel, 17, 66,03–70,98 | 4/4, ersatz-schwer-1 |
  | 122 | Mäander | Kristallpalast | 67,5 | Mischziel aus zwei Quellen | schwer-mischziel, 79, 66,03–70,98 | 4/5, ersatz-schwer-2 |
  | 125 | Abkürzung | Irrlicht | 74,3 | Falle | schwer-falle, 559, 70,98–75,57 | 4/4, ersatz-schwer-2 |
  | 129 | Nadelöhr | Singularität | 81,6 | Sammelstelle | schwer-sammelstelle, 458, 81,58–83,6 | 5/4, ersatz-schwer-1 |
  | 130 | Odyssee | Leuchtturm | 77,9 | Farben abzählen | schwer-abzaehlen, 261, 75,76–81,58 | 5/5, ersatz-schwer-1 |
  | 131 | Seeschlange | Sternbild | 77,2 | Falle | schwer-falle, 194, 75,76–81,58 | 4/4, ersatz-schwer-2 |
  | 132 | Maskerade | Glasperlenspiel | 81,5 | Falle | schwer-falle, 409, 75,76–81,58 | 4/4, ersatz-schwer-1 |
  | 134 | Weltumsegelung | Urknall | 82,0 | Sammelstelle | schwer-sammelstelle, 371, 81,58–83,6 | 5/4, ersatz-schwer-2 |
  | 137 | Fehlstart | Lichtgeschwindigkeit | 85,7 | Mischziel aus zwei Quellen | schwer-mischziel, 568, 83,6–85,91 | 4/4, ersatz-schwer-2 |

  - Jeder Block in `index.html` hat den Lösungskommentar und die Herkunftszeile („Generator <Auftrag>, Seed S, Ziel
    VON–BIS · ersetzt … (Austausch „schwer“)“). Nachgebaut: Alle 59 Level mit Herkunftszeile (6 aus 23, 30 aus 24, 8
    aus 26, 15 aus 25) ergibt `generiere()` aus Auftrag, Seed und Ziel mit demselben Abdruck wie im Spiel
    (`t24\herkunft.mjs`).
- **Entfernt:** die 15 ersetzten Level. Ihre Namen stehen auf `entfernteNamen` (jetzt 59), ihre Leveldaten als feste
  Kopie in `tools/beurteilung/entfernte-level.json` (59 Level).
- **Behalten:** Die Gruppe `behalten` in `tools/levelliste.json` hat jetzt 31 Level, dazu Sonnenwende, Pendel,
  Kathedrale und Lichtjahr. `tests/levelliste.test.mjs`: eigene feste Liste `BEHALTEN_TICKET_25`, die nicht wächst (die
  Gruppe darf nur Level aus den Entscheiden in 24 und 25 enthalten, die aus 24 in „mittel“, die aus 25 in „schwer“);
  Gegenprobe: Sternwarte ist nach dem Protokoll nicht stark und fällt als zusätzliches Level auf.
- **Duldungsliste:** 31 Level (leicht 0 von 31, mittel 27 von 74, schwer 4 von 32, sehr schwer 0 von 13), genau die
  behaltenen. Ausschlussgrund 0, ohne nötige Kernidee 30, unter dem Mindest-Spielwert 25, abgelehnt 0. `AUSGETAUSCHT`
  nennt jetzt alle vier Grade; ein neuer Test verlangt die Endbedingung: Die Duldungsliste nennt genau die behaltenen
  Level, 27 in „mittel“ und 4 in „schwer“. Phase 6 ist damit abgeschlossen.
- **Regeln:**
  - Grade: leicht 1–31, mittel 32–105, schwer 106–137, sehr schwer 138–150; der Grad sinkt nie.
  - Prüfliste 35 (die 36 von vorher ohne Kristallpalast), erledigt; `prueflisteFormel` bleibt.
  - Haupt-Kernidee höchstens zweimal je 10 Level ohne die Duldungsliste; Häufungsregel: Lichtwaage 50 → 51,
    Doppelspiegel 102 → 100, Tandem 110 → 111, Achterbahn 118 → 121, Seeschlange 130 → 131.
  - Mittel je 10 Level steigt überall (kleinster Schritt +0,48); kein korrigiertes Level mehr als 5 Plätze vom Platz
    davor, nach den Korrekturen und am Ende.
  - Anker: A5 Oase auf 114, A6 Lichtbrücke auf 136, je im äussersten Drittel von „schwer“.
- **Tests** (über `leise.sh`, `LEISE_MAX_CPU=80 LEISE_CPU=80`):
  - logic 548, generator 30, beurteilung 178 (Spielwert 0,30 / 0,27), levelliste 43, ki-tester 64, offline: grün.
  - `tests/ki-tester.test.mjs`: Der Test der Anker prüfte mit `AUSSCHLUSS.length > 0`, ob `levelliste.json` gelesen
    ist; die Liste mit Ausschlussgrund ist jetzt leer. Er prüft jetzt, dass sie eine Liste ist.
  - `golden.mjs`: wie erwartet 30 Abweichungen, genau die 15 fehlenden und die 15 neuen Namen; die übrigen 144 Level
    sind wie in `golden.json`. Die Referenz schreibt der Koordinator nach dem Merge neu.
- **Screenshots** (Stichproben, ohne Meldungen in der Konsole): Levelauswahl 111–120 (Desktop und Handy; Titel „Level
  111 – 120 · Schwer“, Tandem, Marktplatz, Rollentausch, Stabübergabe, ●●●○) und 131–140 (Desktop und Handy; Titel
  ohne Grad, weil die Seite gemischt ist, 131–137 ●●●○, 138–140 ●●●●); 113 Marktplatz und 130 Odyssee auf Desktop und
  Handy mit Kopfzeile wie im Spiel (Name, ●●●○ Schwer, Ziele; `tests/output/t25-level/`).
- **Abweichungen:**
  - 15 statt 17 Level: die 13 mit Ausschlussgrund (die 17 im Kopf sind die Neuzählung) und nach dem Entscheid des
    Nutzers Lichthof und Sternwarte; Sonnenwende, Pendel, Kathedrale und Lichtjahr bleiben.
  - Zwei Läufe der KI-Tester für Kandidaten (`ersatz-schwer-1`, `-2`) und einer für Gruppe 2 (`behalten-schwer-1`).
  - Ziel für Rangierbahnhof und Opal 58,5–59,28 statt der engen Lücke 59,13–59,28 (Stufe A1).
  - Wahl je Lücke mit einer Suche statt nur nach der Rangfolge, wegen der Korrekturen der KI-Tester (Stufe B); Opal
    bekommt ein Level mit 3/3.
  - Vorprüfung auf Zerfall vor den KI-Testern (wie in 24 und 26), die Beurteilung ist unverändert.
  - Neu ausserhalb von Levels, Levelliste und Protokoll: `tests/levelliste.test.mjs`, eine Zeile in
    `tests/ki-tester.test.mjs`, Spec und README.
