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

**Hinweis aus Ticket 28 (18.10.2026):** Ab „mittel“ liefert jetzt jede Kernidee genug Level mit ihr als
Haupt-Kernidee, Seeds 1–200 je Auftrag: Mischziel 111, Lockvogel 85, Sammelstelle 64, Farben abzählen 43, Falle 31,
Abschalten 15 (je CPU-Stunde 2 900 bis 40 000, `--jobs 7`). In vier Bereichen zu 200 Seeds (1–800) liefern Abschalten
14–16 und Farben abzählen 41–51, alle mit höchstens drei Quellen (nach dem Review). Nach der Haupt-Kernidee filtern
(`beurteilung.hauptKernidee`). Bedarf je Seite (verbleibende Haupt-Kernideen, was dazukommen darf) für den sicheren
Fall (nur Ausschlussgrund und abgelehnt) und für eine leere Liste: Tabellen in Ticket 28. Im sicheren Fall genügen je
Seite zwei Kernideen; bei leerer Liste braucht 41–60 fünf der sechs, je 2-mal. Die Seeds ab „mittel“ sind seit Ticket
28 teils andere als in früheren Proben.

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
- Die Zahl 11 im Kopf dieses Tickets zählt 31 Lichtbündel mit (Neuzählung, vorläufige Grade). Lichtbündel ist seit
  Ticket 15 „leicht“ und in Ticket 23 ersetzt. Massgebend sind die 11 Level mit Ausschlussgrund in „mittel“ aus dem
  Hinweis aus Ticket 16, dazu Sonnenstrahl und Widerschein (von beiden KI-Testern abgelehnt).

**Stufe A (18.10.2026): Bestand, Entscheidungsgrundlage zu Gruppe 2, Kandidaten und Läufe `ersatz-mittel-1` und
`ersatz-mittel-2` vorbereitet.** Branch `ticket/24-austausch-mittel` von `origin/feature/levelgenerator` (`10e3041`).
Alle Läufe über `leise.sh` mit `LEISE_MAX_CPU=65 LEISE_CPU=65`; Skripte und Zwischenstände im Scratchpad unter `t24\`.
- **Bestand** (`ordne-level.mjs --json`, `tools/levelliste.json`): „mittel“ sind die Plätze 32–105 (74 Level), davon
  57 auf der Duldungsliste.
  - **Gruppe 1, 13 Level** (werden ersetzt), Plätze im Spiel: 11 mit Ausschlussgrund, 38 Einklang (Füllteil, auch
    abgelehnt), 43 Geflecht (Füllteil, Zerfall), 44 Glasmurmel (Füllteil), 47 Schnittstelle (Scheinmischung),
    55 Laterne (Scheinmischung, Zerfall, auch abgelehnt), 77 Mosaik (Füllteil), 83 Lichtschleife (Scheinmischung, auch
    abgelehnt), 89 Weichensteller (Füllteil, Scheinmischung, auch abgelehnt), 92 Lichtorgel, 104 Polarlicht und
    105 Libelle (je Scheinmischung); dazu ohne Ausschlussgrund von beiden KI-Testern abgelehnt 49 Sonnenstrahl
    (Füllteil) und 70 Widerschein (Zerfall).
  - **Gruppe 2, 44 Level** nur wegen Kernidee oder Spielwert: 37 ohne nötige Kernidee und unter 60, 6 nur ohne
    Kernidee (Glasfenster, Lichtkreuz, Traumfänger, Farbverlauf, Schachbrett, Silberstreif), 1 nur unter 60 (Lichtnetz,
    Lockvogel, 45,5).
  - Die Zahlen 13 und 44 stimmen mit dem Hinweis aus Ticket 16. Die 11 Plätze im Kopf des Tickets sind die Neuzählung
    mit den vorläufigen Graden: 31 Lichtbündel ist in Ticket 23 ersetzt, 98 Rangierbahnhof ist heute „schwer“ (Ticket
    25), 106 Polarlicht und 111 Lichtschleife sind heute „mittel“ (Plätze 104 und 83).
- **Lücken:** Ziel-Schwierigkeit ist die Lücke zwischen den Nachbarn nach der Schwierigkeit (Rang der Formel), wie in
  Ticket 23; dann bleiben Platz der Formel, Prüfliste und Urteile der übrigen Level gleich. Drei Abweichungen:
  - **Mosaik** (Formel 109, also „schwer“, steht als Level der Prüfliste am heutigen Platz 77): Ein Ersatz an seinem
    Rang wäre „schwer“. Ziel ist darum die Lücke um Platz 77 (53,72–54,34); der Ersatz muss über 53,884 liegen, sonst
    rückt 73 Rochade auf Formel 84 (heute 73, also mehr als 10 Plätze) auf die Prüfliste, ohne Urteil.
  - **Einklang und Geflecht** stehen am heutigen Platz (36 bzw. 40, Formel 58 bzw. 50). Ihre Ersatzlevel stehen nach der
    Formel, also auf 59 bzw. 51. Ersatzlevel auf ihren Plätzen (Schwierigkeit 43,7–45,4) brächten 34 Funkenflug (heute
    34, Formel 44) auf Formel 45 und damit auf die Prüfliste, ohne Urteil. Dafür rücken 16 Level auf 35–59 um 1–4 Plätze
    (Glasfenster 35 → 39, Tagesanbruch, Verästelung, Schattenspiel, Knotenpunkt, Spiegelachse, Lichtschacht, Streulicht,
    Drehscheibe, Strahlenkranz, Turmalin, Legierung, Farbschleuse, Perlmutt, Lichtfaden, Paravent) und Rochade 78 → 77;
    Formel, Grad, Prüfliste und Urteile der übrigen Level bleiben, ausser dem Rang der Formel zwischen Mosaik und
    seinem Ersatz.
  - **Schnittstelle** (45,70–46,01) und **Sonnenstrahl** (46,09–46,94) aus demselben Grund knapp unter bzw. über
    Funkenflug (46,08); **Polarlicht und Libelle** teilen eine Lücke (57,28–58,31).
- **Kandidaten** mit `generiere.mjs mittel-<kernidee> --schwierigkeit VON,BIS --anzahl 10 --seeds 400`, je Lücke alle
  sechs Kernideen (auf 81–90 ohne Abschalten und Mischziel, auf 91–110 ohne Mischziel), 66 Aufträge, 7 Prozesse,
  rund 13 min Wanduhr. Gefiltert nach `hauptKernidee`; alle haben 2 oder 3 Quellen (Ticket 29). Je Lücke ein Kandidat
  und ein Ersatz mit anderer Haupt-Kernidee, nach Spielwert, Grösse und Abwechslung; auf keiner Seite kann eine Wahl aus
  Kandidat und Ersatz eine Haupt-Kernidee dreimal bringen. Alle 26 baut `generiere.mjs <auftrag> --seed S --anzahl 1
  --seeds 1 --schwierigkeit VON,BIS` nach (geprüft). Je Zelle Abdruck: Auftrag, Seed; Schwierigkeit; Haupt-Kernidee;
  Quellen; Platz nach `ordne-level.mjs --austausch` (Formel):

  | ersetzt | Grund | Ziel | Kandidat | Ersatz |
  |---|---|---|---|---|
  | 44 Glasmurmel | Füllteil | 44,32–45,38 | fcd4bfeb: mittel-falle, 217; 45,07; Falle; 2; 42 (38) | c26b02f0: mittel-sammelstelle, 140; 44,82; Sammelstelle; 3; 42 (38) |
  | 47 Schnittstelle | Scheinmischung | 45,70–46,01 | ba0e3031: mittel-abzaehlen, 112; 45,72; Farben abzählen; 3; 44 (42) | 8656eb5f: mittel-mischziel, 47; 45,94; Mischziel; 3; 44 (42) |
  | 49 Sonnenstrahl | abgelehnt | 46,09–46,94 | ac58204f: mittel-sammelstelle, 57; 46,71; Sammelstelle; 3; 47 (45) | c4ee29fd: mittel-mischziel, 84; 46,81; Mischziel; 3; 47 (45) |
  | 43 Geflecht | Füllteil, Zerfall | 46,96–47,88 | 0775747e: mittel-abzaehlen, 145; 47,36; Farben abzählen; 3; 51 (50) | 7c15642a: mittel-falle, 225; 47,43; Falle; 2; 51 (50) |
  | 55 Laterne | Scheinmischung, Zerfall | 47,90–48,51 | 8ca9a613: mittel-mischziel, 243; 48,35; Mischziel; 3; 54 (53) | 9413f358: mittel-lockvogel, 293; 48,22; Lockvogel; 3; 54 (53) |
  | 38 Einklang | Füllteil | 48,84–49,45 | 51e721c1: mittel-sammelstelle, 270; 49,00; Sammelstelle; 3; 59 (58) | 5c0dc837: mittel-falle, 84; 49,36; Falle; 2; 59 (58) |
  | 70 Widerschein | abgelehnt | 51,15–51,71 | a6e146e0: mittel-sammelstelle, 374; 51,61; Sammelstelle; 3; 70 (74) | 44342c17: mittel-abzaehlen, 8; 51,48; Farben abzählen; 3; 70 (74) |
  | 77 Mosaik | Füllteil | 53,72–54,34 | a4621708: mittel-lockvogel, 281; 54,34; Lockvogel; 3; 78 (85) | 53522ec0: mittel-mischziel, 126; 54,05; Mischziel; 3; 78 (84) |
  | 83 Lichtschleife | Scheinmischung | 54,36–54,78 | be69a422: mittel-sammelstelle, 286; 54,73; Sammelstelle; 3; 83 (89) | 3774c0a4: mittel-lockvogel, 84; 54,61; Lockvogel; 3; 83 (87) |
  | 89 Weichensteller | Füllteil, Scheinmischung | 55,55–55,68 | ae26b9cc: mittel-falle, 218; 55,64; Falle; 2; 89 (93) | 31dacb34: mittel-abzaehlen, 8; 55,60; Farben abzählen; 3; 89 (93) |
  | 92 Lichtorgel | Scheinmischung | 55,70–56,10 | 0a36526d: mittel-sammelstelle, 114; 55,83; Sammelstelle; 3; 92 (95) | 5a608007: mittel-lockvogel, 277; 55,70; Lockvogel; 3; 92 (95) |
  | 104 Polarlicht | Scheinmischung | 57,28–58,31 | 8d478f46: mittel-abzaehlen, 385; 58,25; Farben abzählen; 3; 105 (104) | 64341929: mittel-lockvogel, 64; 58,15; Lockvogel; 3; 104 (103) |
  | 105 Libelle | Scheinmischung | 57,28–58,31 | f03e3dee: mittel-sammelstelle, 68; 58,18; Sammelstelle; 3; 104 (103) | dd0fbbef: mittel-lockvogel, 90; 58,15; Lockvogel; 3; 105 (104) |

- **Regeln** (`ordne-level.mjs --austausch … --json`, ohne `--schreiben`, je ein Lauf mit allen Kandidaten und mit allen
  Ersatzleveln; Kandidat und Ersatz derselben Lücke landen auf demselben Platz):
  - Alle 13 sind „mittel“, auf den Plätzen 42–105; „mittel“ bleibt 32–105, keine Duldung (Spielwert 78,5–93,4).
  - Prüfliste 44 (die 51 ohne die 7 ersetzten), alle mit Urteil; Entscheide und Korrekturen der übrigen unverändert.
  - Haupt-Kernidee ohne die Duldungsliste je 10 Level eingehalten, Häufungsregel nur mit den zwei Zügen aus Ticket 16.
    Mit den Kandidaten: 31–40 Fa 1, Mi 1, Fz 1; 41–50 Fa 1, Fz 1, Sa 1; 51–60 Fz 1, Mi 1, Sa 1; 61–70 Lo 1, Ab 1,
    Sa 1; 71–80 Mi 1, Lo 1, Fa 1, Ab 1; 81–90 Sa 1, Mi 2, Ab 2, Fa 1; 91–100 Sa 1, Mi 2, Ab 1; 101–110 Mi 2, Fa 1, Sa 1,
    Fz 1 (die 2 schweren Ersatzlevel aus Ticket 25 haben dort noch Fa 1, Ab 2, Fz 1, Sa 1, Lo 2).
  - Mittel je 10 Level fällt höchstens um 0,33 (81–100, wie vorher 0,34). Duldungsliste 71 statt 84, „mittel“ 44.
  - Die Korrekturen der KI-Tester können ein neues Level noch um bis zu 5 Plätze verschieben; vor dem Schreiben wieder
    mit `--austausch` prüfen (Hinweis aus Ticket 23).
- **Läufe** (Ablauf 2, Fingerabdruck unverändert): `ersatz-mittel-1` mit den 13 Kandidaten, `ersatz-mittel-2` mit den 13
  Ersatzleveln, je ohne `--anker`, je `prepare.mjs <lauf> --kandidaten <Liste>`. Zwei Läufe statt einem zu 26 Leveln,
  damit ein KI-Tester nicht 34 Felder samt Bildern auf einmal beurteilt. Bilder je Aufnahme 26–28 s; die Anker sind im
  ersten Lauf neu aufgenommen (neuer Worktree), im zweiten aus dem Zwischenspeicher. Agent `general-purpose`, Modell
  `claude-opus-5-5` (`lauf.json`). Die KI-Tester startet der Koordinator.
  - Die Liste für `--kandidaten` nimmt aus der Ausgabe von `ordne-level.mjs --json` nur die Einträge „Kandidat …“: Die
    Ausgabe enthält auch die sechs neuen Level aus Ticket 23 mit Leveldaten (etwa Sammellinse), und ein zweites Urteil
    zu ihnen liesse `reihenfolge()` werfen. Hinweis für 25 und 26.
- **Entscheidungsgrundlage für Gruppe 2:** siehe nächsten Abschnitt.

**Entscheidungsgrundlage für Gruppe 2 (18.10.2026; Spec, Phase 6).** Die Beurteilung ist nicht geändert; angesehen
mit einem Skript, das nur ihre Vorstufen ausgibt (`t24\diag.mjs`).
- **Die 44 Level** (Plätze im Spiel; Gefühl und Aha je Urteil im Protokoll, A/B; „stark“: beide sehen in jedem Urteil
  einen Aha-Moment, Gefühl im Mittel mindestens 4, kein Begriff der Ablehnung):

  | Platz | Name | Gefühl A/B | Aha A/B | Spielwert | erkannte Kernidee | Grund | Urteil |
  |---:|---|---|---|---:|---|---|---|
  | 32 | Farbwechsel | 4/3 | ja/nein | 53,2 | – | ohne Kernidee, unter 60 | schwach |
  | 33 | Lichtpfad | 3/4, 4/4 | ja/ja, ja/ja | 53,2 | – | ohne Kernidee, unter 60 | schwach |
  | 34 | Funkenflug | – | – | 46,5 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 35 | Glasfenster (Anker A3) | 4/4 | ja/ja | 61,3 | – | ohne Kernidee | stark |
  | 36 | Tagesanbruch | 3/3 | ja/ja | 47,6 | – | ohne Kernidee, unter 60 | schwach |
  | 39 | Verästelung | 3/3 | ja/ja | 47,7 | – | ohne Kernidee, unter 60 | schwach |
  | 40 | Lichtnetz | 4/4, 4/4 | ja/ja, ja/ja | 45,5 | Lockvogel | unter 60 | stark |
  | 42 | Kreuzweg | 4/4 | ja/ja | 38,1 | – | ohne Kernidee, unter 60 | stark |
  | 45 | Knotenpunkt | – | – | 49,2 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 46 | Spiegelachse | 3/4 | ja/ja | 53,6 | – | ohne Kernidee, unter 60 | schwach |
  | 48 | Lichtschacht | 4/4, 4/3 | ja/ja, ja/nein | 47,1 | – | ohne Kernidee, unter 60 | schwach |
  | 50 | Streulicht | 4/4 | ja/ja | 52,2 | – | ohne Kernidee, unter 60 | stark |
  | 51 | Drehscheibe | – | – | 46,5 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 52 | Strahlenkranz | – | – | 52,2 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 53 | Turmalin | – | – | 51,6 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 54 | Legierung | – | – | 51,6 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 56 | Farbschleuse | – | – | 55,6 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 57 | Perlmutt | – | – | 49,9 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 58 | Lichtfaden | – | – | 51,1 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 59 | Paravent | – | – | 51,1 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 60 | Bumerang | 4/4 | ja/ja | 52,2 | – | ohne Kernidee, unter 60 | stark |
  | 61 | Mondlicht | 4/4 | ja/ja | 48,8 | – | ohne Kernidee, unter 60 | stark |
  | 62 | Weichen | 4/4 | ja/ja | 57,9 | – | ohne Kernidee, unter 60 | stark |
  | 63 | Glasbaustein | – | – | 57,9 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 64 | Fadenkreuz | – | – | 55,6 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 65 | Lichtschranke | – | – | 57,9 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 67 | Blaue Stunde | – | – | 54,4 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 68 | Pinselstrich | 4/4 | ja/ja | 52,2 | – | ohne Kernidee, unter 60 | stark |
  | 71 | Farbtupfer | – | – | 48,0 | – | ohne Kernidee, unter 60 | ohne Urteil |
  | 72 | Rubin | 4/4 | ja/ja | 51,3 | – | ohne Kernidee, unter 60 | stark |
  | 73 | Lichtkreuz | – | – | 62,4 | – | ohne Kernidee | ohne Urteil |
  | 75 | Glühwürmchen | 4/4 | ja/ja | 57,9 | – | ohne Kernidee, unter 60 | stark |
  | 76 | Spektralband | 4/5 | ja/ja | 55,9 | – | ohne Kernidee, unter 60 | stark |
  | 78 | Rochade | 5/4 | ja/ja | 54,5 | – | ohne Kernidee, unter 60 | stark |
  | 81 | Traumfänger | 4/4 | ja/ja | 60,1 | – | ohne Kernidee | stark |
  | 82 | Glasbläser | 3/3, 4/3 | ja/ja, ja/ja | 49,6 | – | ohne Kernidee, unter 60 | schwach |
  | 87 | Schimmer | 5/4 | ja/ja | 57,9 | – | ohne Kernidee, unter 60 | stark |
  | 88 | Kreuzfeuer | 4/4, 4/4 | ja/ja, ja/ja | 57,0 | – | ohne Kernidee, unter 60 | stark |
  | 91 | Uhrwerk | 5/5 | ja/ja | 59,0 | – | ohne Kernidee, unter 60 | stark |
  | 94 | Farbverlauf | 4/4, 4/5 | ja/ja, ja/ja | 60,5 | – | ohne Kernidee | stark |
  | 95 | Schachbrett | 4/4 | ja/ja | 60,1 | – | ohne Kernidee | stark |
  | 98 | Smaragd | 4/4, 4/4 | ja/ja, ja/ja | 50,7 | – | ohne Kernidee, unter 60 | stark |
  | 99 | Silberstreif | 4/4 | ja/ja | 63,0 | – | ohne Kernidee | stark |
  | 100 | Chamäleon | 3/4 | ja/ja | 49,9 | – | ohne Kernidee, unter 60 | schwach (A nennt Scheinmischung) |

  Zusammen: 20 stark, 8 schwach, 16 ohne Urteil der KI-Tester (nie auf einer Prüfliste). Mit Urteil und ohne erkannte
  Kernidee sind es 27; dazu kommen Sonnenstrahl und Widerschein aus Gruppe 1, also die 29 aus Ticket 16.
- **Was die KI-Tester sehen und warum die Beurteilung es nicht zählt** (Stichprobe von 15: Glasfenster, Verästelung,
  Streulicht, Spektralband, Rubin, Kreuzweg, Lichtschacht, Lichtpfad, Mondlicht, Schimmer, Uhrwerk, Weichen,
  Farbverlauf, Smaragd, Kreuzfeuer; dazu die Beschreibungen aller 28 mit Urteil):
  - **Falle** (bei 8 genannt, etwa Verästelung, Streulicht, Spektralband, Rubin, Kreuzfeuer, Smaragd, Glasfenster): Die
    naheliegende Stellung, die die KI-Tester beschreiben, bringt meist einem anderen Ziel falsches Licht oder nimmt
    einem anderen Strang den Weg („blockiert den Weg zum Ziel links unten“). Die Beurteilung findet in 14 der 15 keinen
    naheliegenden Zwischenstand (eine Quelle erfüllt ein Ziel allein, kürzer als in der Lösung, ohne falsches Licht), in
    Glasfenster einen, aber in 12 der 15 gibt es gar keine weite Fast-Lösung (Holzweg). Die Falle der KI-Tester wird
    also nach einem oder zwei Zügen sichtbar; die Beurteilung nennt das dekorativ (Ticket 11).
  - **Farben abzählen** (bei 15 genannt, etwa Lichtpfad, Schimmer, Uhrwerk, Mondlicht, Farbverlauf): gemeint ist meist
    ein einzelner erzwungener Schluss („das Blau-Ziel legt das Prisma fest“). Knappe Grundfarben gibt es in allen 15,
    aber der Verlust zeigt sich immer an einem einzelnen Ziel; gezählt wird erst, wenn nur das Abzählen ihn zeigt
    (Entscheid in Ticket 10; die Erweiterung Z+ in Ticket 15 hätte etwa Uhrwerk gezählt).
  - **Abschalten** (Kreuzweg, Lichtschacht): Das Licht auf dem Ziel hat eine falsche Farbe (Magenta auf Cyan, Weiss auf
    Blau); gezählt wird nur Licht in der Farbe des Ziels (Spec, Ticket 10; A+ in Ticket 15 zählte das, aber das
    Spielermodell widerlegt solche Zwischenstände auf den ersten Blick).
  - **Ausserhalb des Glossars:** Am häufigsten beschreiben sie ein Mischziel aus einer Quelle (Rot und Blau oder Grün
    und Blau desselben Prismas laufen getrennt und treffen sich wieder: Lichtnetz, Pinselstrich, Glühwürmchen, Smaragd,
    Farbverlauf, Kreuzweg, Chamäleon; in der Stichprobe zählt die Beurteilung solche Ziele bei Kreuzweg, Farbverlauf,
    Smaragd und Schimmer als Mischziel, aber nicht „aus zwei Quellen“), einen Spiegel, der zwei Strahlen zugleich lenkt
    (bei den meisten; das ist Zusammenspiel, keine Kernidee), und ein Prisma, das mehrere Ziele zugleich bedient
    (Weichen, Kreuzfeuer). Sammelstelle findet sich nicht: Jedes Prisma der Stichprobe hat
    einen Zulauf.
  - **Folge für den Spielwert:** Die erste Kernidee zählt 0,8; ohne sie liegen die Level bei 38–63 (Glasfenster 61,3,
    Silberstreif 63,0), mit voller Farblogik und viel Zusammenspiel knapp um 60. Das Gefühl der KI-Tester unterscheidet
    sich kaum (Ticket 16: 3,97 mit, 3,86 ohne erkannte Kernidee). Schuld ist also weniger ein Fehler der Erkennung als
    das Modell: Die Kernideen sind bewusst eng gefasst, und der Spielwert hängt fast ganz an ihnen. Was die KI-Tester
    sehen, wäre eine Änderung des Glossars und damit der Spec (neue Kernideen) oder die Erweiterungen aus Ticket 15,
    die die Abnahmen der Schwierigkeit (31–60) und des Spielwerts kippten.
- **Optionen** (Kosten grob, nach Ticket 28 „Fall B“ und diesem Lauf):
  - **(a) Alle 44 ersetzen.** Kosten: 44 Ersatzlevel und 44 Reserven (Generator rund 15–30 min Wanduhr), zwei bis vier
    Läufe der KI-Tester (Bilder rund 50 s je Level), 44 Namen mehr zur Genehmigung. Auf 41–60 braucht es fünf der sechs
    Kernideen je zweimal, Abschalten liefert in schmalen Lücken kaum (0–4 aus 400 Seeds); einige Ersatzlevel landen dann
    neben ihrer Lücke. A3 Glasfenster wird ersetzt: neuer Anker, neue Version des Ablaufs der KI-Tester (Anker,
    Fingerabdruck, zählende Abläufe in `levelliste.mjs`), am besten als eigenes kleines Ticket vor dem Lauf. Folge:
    „mittel“ hätte 57 neue von 74 Leveln; 20 Level, die beide KI-Tester mögen, fallen weg. Die Duldungsliste ist in
    „mittel“ leer.
  - **(b) Nur einen Teil ersetzen** (meine Empfehlung): die 8 schwachen und die 16 ohne Urteil, zusammen 24; die 20
    starken bleiben geduldet. Kosten etwa die Hälfte von (a), A3 bleibt. Folge: „mittel“ 37 neue von 74; auf der
    Duldungsliste bleiben 20 mittlere Level. Die Endbedingung „Liste leer“ nach 23–26 gilt dann nicht; der Haken „kein
    mittleres Level auf der Duldungsliste“ bleibt offen, und für das Ende von 23–26 braucht es einen Entscheid (etwa ein
    eigener Grund „behalten nach Urteil der KI-Tester“ oder eine Liste der behaltenen Level in der Spec). Variante (b′):
    die 16 ohne Urteil zuerst beurteilen lassen und nach derselben Regel entscheiden; ein solcher Lauf zählt nicht für
    die Levelliste, geht aber in die Eichmenge des Spielwerts ein (Test 0,26 / 0,25, gemessen 0,28 / 0,27).
  - **(c) Zuerst ein eigenes Ticket zur Erkennung, dann neu entscheiden.** Kosten: Spec- und Glossarentscheid (neue
    Kernideen wie „Mischziel aus einer Quelle über getrennte Wege“), neue Eichung von Schwierigkeit und Spielwert, neue
    Version des Ablaufs der KI-Tester; mehrere Tickets. Folge: Ticket 15 schätzte für die bisherigen Erweiterungen eine
    Duldungsliste von höchstens 56 (mittel 28) und kippende Abnahmen; ob neue Kernideen mehr bringen, ist offen.
    Gruppe 1 ist davon nicht berührt und kann vorher kommen.
- **Empfehlung (b):** Die Urteile der KI-Tester sind das einzige Mass für Spass, das hier etwas weiss, und für 20 Level
  sind sie eindeutig gut; die 24 übrigen haben entweder schwache Urteile oder gar keine, und für sie spricht nur die
  Regel. (c) lohnt sich als eigenes Ticket erst, wenn der Nutzer das Glossar erweitern will.

**Entscheid des Nutzers zu Gruppe 2 (18.10.2026, über den Koordinator): Variante (b′).**
1. Die 16 Level ohne Urteil beurteilen zuerst die KI-Tester.
2. Danach gilt für alle 44 dieselbe Regel: **Stark** ist ein Level, wenn beide KI-Tester in jedem Urteil einen
   Aha-Moment sehen, das Gefühl im Mittel mindestens 4 ist und keiner einen Begriff der Ablehnung nennt. Starke Level
   bleiben im Spiel, unter einem neuen Grund „behalten nach Urteil der KI-Tester“. Alle übrigen werden ersetzt.
3. Die Endbedingung „Liste leer“ nach 23–26 gilt nicht mehr: Am Ende stehen nur noch Level mit dem Grund „behalten“
   auf der Liste.

**Lauf `behalten-mittel-1` vorbereitet (18.10.2026).**
- Die 16 Level ohne Urteil mit ihren Plätzen im Spiel: 34 Funkenflug, 45 Knotenpunkt, 51 Drehscheibe,
  52 Strahlenkranz, 53 Turmalin, 54 Legierung, 56 Farbschleuse, 57 Perlmutt, 58 Lichtfaden, 59 Paravent,
  63 Glasbaustein, 64 Fadenkreuz, 65 Lichtschranke, 67 Blaue Stunde, 71 Farbtupfer, 73 Lichtkreuz;
  `prepare.mjs behalten-mittel-1 <Plätze>`, Ablauf 2, ohne `--anker`; Bilder 30–32 s je Aufnahme, die der Anker aus
  dem Zwischenspeicher. Die KI-Tester startet der Koordinator.
- Der Name zählt nicht für die Levelliste (nur `pruefung-…` und `ersatz-…`); diese Level stehen nicht auf der
  Prüfliste, und `reihenfolge()` würde bei einem zählenden Urteil zu ihnen werfen.
- **Eichmenge des Spielwerts:** Die Eichmenge nimmt jedes Urteil zu einem Level der heutigen Reihenfolge, gleich aus
  welchem Lauf (`spielwert-eichmenge.mjs`; ausgenommen sind nur Läufe `ersatz-…` zu neuen Leveln). Die 16 kommen also
  neu hinein (heute ist keines darin, auch nicht über die Reviews), und zwar auch die, die danach ersetzt werden: Ihre
  Leveldaten bleiben als feste Kopie Teil des Massstabs. Die Urteile gibt es noch nicht; mit angenommenem Gefühl
  (Mittel aus A und B), gerechnet mit den Beurteilungen des Tests (`t24\eichmenge-sim.mjs`), heute 0,2822 / 0,2671
  (gerundet 0,28 / 0,27, Schwelle 0,26 / 0,25):

  | Gefühl der 16 | ohne Ausschlussgrund | über alle |
  |---|---:|---:|
  | alle 3 | 0,35 | 0,33 |
  | alle 3,5 | 0,32 | 0,30 |
  | alle 4 | **0,22** | **0,21** |
  | alle 4,5 | **0,09** | **0,12** |
  | zufällig aus den 34 mittleren Leveln mit Urteil ohne erkannte Kernidee (5000 Ziehungen): 5 %, Median, 95 % | 0,20 / 0,25 / 0,30 | 0,21 / 0,25 / 0,28 |
  | gegen den Spielwert (bester Spass beim tiefsten Spielwert) | **0,17** | **0,20** |
  | mit dem Spielwert | 0,32 | 0,28 |

  In den Ziehungen fällt der Test in 53 % der Fälle unter die Schwelle. Grund: Die 16 haben einen tiefen Spielwert
  (46,5–62,4); finden die KI-Tester sie so gut wie die übrigen mittleren Level ohne erkannte Kernidee (meist 4), sinkt
  die Übereinstimmung. Werden sie schwach beurteilt (und dann ersetzt), steigt sie. Die Schwelle passe ich nicht an;
  fällt der Test nach dem Zusammenführen, melde ich das.
- **Anker A3 Glasfenster** ist formal stark: Sein einziges Urteil im Protokoll ist das als Anker im Probelauf
  `probelauf-3` (Ablauf 2): Gefühl 4/4, Aha ja/ja, keine Ablehnung. Die Regel zählt dabei jedes Urteil im Protokoll,
  auch Probeläufe, Eichläufe und Ablauf 1. Bei 4 der 20 starken Level stammen alle Urteile aus Ablauf 1 (Kreuzweg und
  Silberstreif aus `probelauf-2`, Rochade aus `spielwert-2`, Uhrwerk aus `spielwert-4`); zählten nur Urteile aus
  Ablauf 2, hätten sie keines.

**Läufe `ersatz-mittel-1` und `-2` zusammengeführt (18.10.2026).** `merge.mjs` für beide (je 13 Einträge, Ablauf 2;
Protokoll jetzt 144 Einträge), danach `tests/ki-tester.test.mjs` grün (64). Beide KI-Tester lehnen 7 Level ab, alle
wegen Zerfall. Je Lücke (Gefühl A/B, Zerfall genannt von, Ergebnis von `merge.mjs` am Platz der Formel; „Teile“ aus
der Vorprüfung unten):

| Lücke | Kandidat | Ersatz | Stand |
|---|---|---|---|
| Glasmurmel | fcd4bfeb: 4/4, B; bleibt; 2 Teile | c26b02f0: 4/3, beide: abgelehnt | gefüllt (Kandidat) |
| Schnittstelle | ba0e3031: 4/4, –; bleibt; 1 Teil | 8656eb5f: 4/5, –; bleibt; 1 Teil | gefüllt |
| Sonnenstrahl | ac58204f: 3/3, beide: abgelehnt | c4ee29fd: 4/4, –; bleibt; 1 Teil | gefüllt (Ersatz) |
| Geflecht | 0775747e: 4/5, –; bleibt; 1 Teil | 7c15642a: 4/5, A; bleibt; 2 Teile | gefüllt |
| Laterne | 8ca9a613: 3/3, beide: abgelehnt | 9413f358: 3/4, A; bleibt; 3 Teile | gefüllt (Ersatz) |
| Einklang | 51e721c1: 4/4, B; +5; 2 Teile | 5c0dc837: 3/4, beide: abgelehnt | gefüllt (Kandidat) |
| Widerschein | a6e146e0: 4/4, –; bleibt; 1 Teil | 44342c17: 4/4, –; bleibt; 1 Teil | gefüllt |
| Mosaik | a4621708: 3/4, A; bleibt; 3 Teile | 53522ec0: 3/3, beide: abgelehnt | gefüllt (Kandidat) |
| Lichtschleife | be69a422: 5/4, –; bleibt; 1 Teil | 3774c0a4: 3/4, A; bleibt; 3 Teile | gefüllt |
| Weichensteller | ae26b9cc: 4/4, –; +5; 1 Teil | 31dacb34: 4/3, –; bleibt; 1 Teil | gefüllt |
| Lichtorgel | 0a36526d: 3/4, beide: abgelehnt | 5a608007: 3/3, beide: abgelehnt | **offen** |
| Polarlicht | 8d478f46: 5/4, –; bleibt; 1 Teil | 64341929: 3/4, A; bleibt; 3 Teile | gefüllt |
| Libelle | f03e3dee: 4/4, –; bleibt; 1 Teil | dd0fbbef: 3/4, A; −1; 3 Teile | gefüllt |

- Offen ist nur Lichtorgel. Vier Lücken sind nur mit einem Level gefüllt, bei dem einer der beiden KI-Tester Zerfall
  nennt und die Vorprüfung mehrere Teile findet (Glasmurmel, Laterne, Einklang, Mosaik); nach der Regel sind sie nicht
  abgelehnt.
- Neue Kandidaten für Lichtorgel kommen erst mit dem Urteil über die 16 Level ohne Urteil, in einem gemeinsamen Lauf mit
  den Ersatzleveln für die schwachen Level der Gruppe 2 (Koordinator, 18.10.2026).

**Zerfall: Regel der Beurteilung und Urteil der KI-Tester (18.10.2026).**
- **Was die KI-Tester meinen** (ihre Begründungen): Die Lösung zerfällt in Stränge je Quelle, die kein Element und kein
  Ziel teilen und kein Mischziel verbindet, etwa „drei Quellen, drei getrennte Stränge aus je einem Prisma und einem
  Spiegel“ oder „der weisse Strang mit vier Elementen und das gelbe Mischziel aus zwei Quellen haben nichts
  miteinander zu tun“. Die Grösse eines Teils spielt für sie keine Rolle.
- **Die Regel der Beurteilung** (`ausschluesse/zerfall.mjs`) gruppiert Ziele über gemeinsame drehbare Elemente und
  Mischziele und zählt erst, wenn die zweite Gruppe mindestens 3 drehbare Elemente hat. Die abgelehnten Kandidaten haben
  zweite Teile mit 1–2 drehbaren Elementen; kurze Stränge mit einem Prisma sind auch kein Füllteil (der zählt nur
  Spiegel). Der Generator liefert nur Level, die die Regel besteht, also keines der 26 mit Zerfall nach der Regel.
- **Unterschied an den 26 Kandidaten:** Regel 0 von 26; KI-Tester beide 7, einer 8, keiner 11. Ab „mittel“ war Zerfall
  im Spiel bisher selten: an den 58 Leveln ab „mittel“ mit Urteil aus Ablauf 2 nennen die KI-Tester ihn bei 5 (beide
  bei 44 Glasmurmel und 70 Widerschein), die Regel findet ihn bei 2 (55 Laterne, 116 Kristallpalast).
- **Vorprüfung** (nur im Scratchpad, `t24\zerfall-check.mjs`; die Beurteilung ist unverändert): In der Lösungsstellung
  leuchtet je eine Quelle allein (die übrigen als Blocker, wie `jeQuelle`). Zwei Quellen gehören zu einem Teil, wenn ihr
  Licht ein gemeinsames Ziel trifft oder beide ein gemeinsames Element brauchen (Spiegel, Prisma, Kombinator, Filter;
  „brauchen“: an seiner Stelle ein Blocker, und ein Ziel bekommt von dieser Quelle anderes Licht). Streulicht, das nur
  einen fremden Spiegel streift, verbindet nicht (so bei 53522ec0: Mit jedem berührten Element wäre es ein Teil, die
  KI-Tester sehen zwei).
  - An den 26: mehr als ein Teil bei 15, und das sind genau die 15, bei denen mindestens ein KI-Tester Zerfall nennt
    (darunter alle 7 Ablehnungen); ein Teil bei 11, und bei keinem davon nennt einer Zerfall.
  - An den Leveln im Spiel stimmt sie weniger genau: von den 58 ab „mittel“ mit Urteil aus Ablauf 2 hat sie bei 5 mehr
    als einen Teil (Glasmurmel, Blendwerk und Kristallpalast mit Zerfall bei den KI-Testern; Einklang und Weichensteller
    ohne, beide aber wegen Füllteil abgelehnt); Widerschein und Laterne (Zerfall bei den KI-Testern) haben nach ihr
    einen Teil. In „leicht“ (Ticket 23) haben Fackellauf, Strahlteiler und Fernlicht zwei Teile, ohne dass die KI-Tester
    Zerfall nennen.
  - Für die nächsten Kandidaten verwerfe ich jeden mit mehr als einem Teil, bevor er zu den KI-Testern geht.

**Entscheide des Koordinators (18.10.2026, innerhalb der Regeln und des Entscheids des Nutzers).**
1. **Welche Urteile für „stark“ zählen:** jedes Urteil eines Levels im Protokoll, aus Ablauf 1 und 2, und jedes muss
   die Regel erfüllen. Zusätzlich braucht jedes behaltene Level mindestens ein Urteil aus Ablauf 2. Darum kommen
   Kreuzweg, Silberstreif, Rochade und Uhrwerk (bisher nur Urteile aus Ablauf 1) in den Lauf `behalten-mittel-1`.
   A3 Glasfenster hat sein Urteil aus Ablauf 2 (`probelauf-3`, als Anker) und bleibt draussen; Anker werden in den
   Läufen nicht beurteilt.
2. **Spielwert-Test:** Der Lauf wird gemacht, an der Eichmenge und ihrer Auswahl ändert sich nichts. Fällt die
   Übereinstimmung nach dem Zusammenführen unter 0,26 / 0,25, gehen die Zahlen an den Koordinator, und der Nutzer
   entscheidet.
3. **Lücken, deren gültiges Level Zerfall hat** (ein KI-Tester nennt ihn, die Vorprüfung findet mehrere Teile):
   Glasmurmel, Laterne, Einklang und Mosaik bekommen im nächsten gemeinsamen Lauf neue Kandidaten, die die Vorprüfung
   mit einem Teil bestehen; das heutige gültige Level bleibt Rückfall. Bei Geflecht, Lichtschleife, Polarlicht und
   Libelle gilt der Kandidat ohne Zerfall (0775747e, be69a422, 8d478f46, f03e3dee), nicht der Ersatz.

**Lauf `behalten-mittel-1` neu vorbereitet, mit 20 Leveln** (noch ohne Antworten, der alte Ordner ist gelöscht): die 16
ohne Urteil und dazu 42 Kreuzweg, 78 Rochade, 91 Uhrwerk und 99 Silberstreif (Plätze im Spiel); Ablauf 2, ohne
`--anker`, Bilder 31–33 s je Aufnahme, die der Anker aus dem Zwischenspeicher. Die vier kommen mit ihrem neuen Urteil
auch in der Eichmenge anders vor (Mittel über alle Urteile eines Levels).

**Stand am Abend des 18.10.2026** (Pause über Nacht; Branch `ticket/24-austausch-mittel`, nicht gepusht).
- **Erledigt:** Bestand und Entscheidungsgrundlage zu Gruppe 2 (Entscheid des Nutzers: Variante b′); Gruppe 1:
  Kandidaten und Ersatz für alle 13 Lücken, Läufe `ersatz-mittel-1` und `-2` zusammengeführt (Protokoll 144 Einträge,
  `ki-tester.test.mjs` grün); Vorprüfung auf Zerfall (`t24\zerfall-check.mjs` im Scratchpad); Lauf `behalten-mittel-1`
  mit 20 Leveln vorbereitet.
- **Offene Läufe:** `behalten-mittel-1` (20 Level), Aufträge
  `tests/output/ki-tester/behalten-mittel-1/auftrag-A.md` und `auftrag-B.md` im Worktree; die KI-Tester startet der
  Koordinator. Sonst läuft nichts (kein `leise.sh`, kein Node, kein Chrome aus diesem Ticket).
- **Als Nächstes:**
  1. `merge.mjs behalten-mittel-1`, `ki-tester.test.mjs`, dann der Test des Spielwerts (Übereinstimmung; fällt sie
     unter 0,26 / 0,25, gehen die Zahlen an den Koordinator).
  2. Nach der Regel „stark“ (jedes Urteil, dazu mindestens eines aus Ablauf 2) bestimmen, welche der 44 Level der
     Gruppe 2 behalten und welche ersetzt werden.
  3. Ein gemeinsamer Lauf mit neuen Kandidaten für Lichtorgel (offen), für Glasmurmel, Laterne, Einklang und Mosaik
     (heute nur ein Level mit Zerfall bei einem KI-Tester, bleibt Rückfall) und für die schwachen Level der Gruppe 2;
     nur Kandidaten, die die Vorprüfung auf Zerfall mit einem Teil bestehen.
  4. Grund „behalten nach Urteil der KI-Tester“ in `levelliste.json` und `levelliste.mjs` mit Test und Gegenprobe; Spec
     und Hinweise in 25 und 26 nachführen.
  5. Danach Namen (Haltepunkt), dann Phase C.

**Lauf `behalten-mittel-1` zusammengeführt (19.10.2026).** `merge.mjs` (20 Einträge, Ablauf 2; Protokoll jetzt 164),
`tests/ki-tester.test.mjs` grün (64), `tests/beurteilung.test.mjs` grün (177).
- **Spielwert:** Übereinstimmung mit dem Spass der Eichmenge jetzt 0,29 ohne Ausschlussgrund (114 Level) und 0,27 über
  alle (165), vorher 0,28 (98) und 0,27 (149); Schwelle 0,26 / 0,25. Die neuen Urteile sind gemischt (Gefühl 3–5), darum
  stieg sie leicht. An der Eichmenge ist nichts geändert.
- Die Korrekturen, die `merge.mjs` ausgibt, gelten nicht: Der Lauf zählt nicht für die Levelliste.
- **Regel „stark“** (Entscheide vom 18.10.2026): jedes Urteil im Protokoll (Ablauf 1 und 2) mit Aha-Moment bei beiden,
  Gefühl im Mittel über alle Urteile mindestens 4, kein Begriff der Ablehnung, dazu mindestens ein Urteil aus Ablauf 2.
  Ergebnis für die 44 Level der Gruppe 2: **27 stark (behalten), 17 ersetzen** (`t24\stark.mjs`):

  | Platz | Name | Urteile (Lauf: Gefühl A/B, Aha A/B, Ablehnung) | Gefühl im Mittel | Spielwert | Grund | Ergebnis |
  |---:|---|---|---:|---:|---|---|
  | 32 | Farbwechsel | pruefung-4: 4/3, ja/nein | 3,50 | 53,2 | ohne Kernidee, unter 60 | ersetzen: nicht jedes Mal Aha bei beiden; Gefühl 3,50 |
  | 33 | Lichtpfad | spielwert-1: 3/4, ja/ja; pruefung-5: 4/4, ja/ja | 3,75 | 53,2 | ohne Kernidee, unter 60 | ersetzen: Gefühl 3,75 |
  | 34 | Funkenflug | behalten-mittel-1: 3/3, ja/nein | 3,00 | 46,5 | ohne Kernidee, unter 60 | ersetzen: nicht jedes Mal Aha bei beiden; Gefühl 3,00 |
  | 35 | Glasfenster | probelauf-3: 4/4, ja/ja | 4,00 | 61,3 | ohne Kernidee | stark: behalten |
  | 36 | Tagesanbruch | pruefung-3: 3/3, ja/ja | 3,00 | 47,6 | ohne Kernidee, unter 60 | ersetzen: Gefühl 3,00 |
  | 39 | Verästelung | pruefung-6: 3/3, ja/ja | 3,00 | 47,7 | ohne Kernidee, unter 60 | ersetzen: Gefühl 3,00 |
  | 40 | Lichtnetz | spielwert-4: 4/4, ja/ja; pruefung-2: 4/4, ja/ja | 4,00 | 45,5 | unter 60 | stark: behalten |
  | 42 | Kreuzweg | probelauf-2: 4/4, ja/ja; behalten-mittel-1: 2/4, nein/ja, Scheinmischung/– | 3,50 | 38,1 | ohne Kernidee, unter 60 | ersetzen: nicht jedes Mal Aha bei beiden; Gefühl 3,50; Ablehnung (A Scheinmischung) |
  | 45 | Knotenpunkt | behalten-mittel-1: 3/4, ja/ja, Zerfall/– | 3,50 | 49,2 | ohne Kernidee, unter 60 | ersetzen: Gefühl 3,50; Ablehnung (A Zerfall) |
  | 46 | Spiegelachse | pruefung-2: 3/4, ja/ja | 3,50 | 53,6 | ohne Kernidee, unter 60 | ersetzen: Gefühl 3,50 |
  | 48 | Lichtschacht | spielwert-1: 4/4, ja/ja; probelauf-3: 4/3, ja/nein | 3,75 | 47,1 | ohne Kernidee, unter 60 | ersetzen: nicht jedes Mal Aha bei beiden; Gefühl 3,75 |
  | 50 | Streulicht | pruefung-5: 4/4, ja/ja | 4,00 | 52,2 | ohne Kernidee, unter 60 | stark: behalten |
  | 51 | Drehscheibe | behalten-mittel-1: 3/3, nein/nein | 3,00 | 46,5 | ohne Kernidee, unter 60 | ersetzen: nicht jedes Mal Aha bei beiden; Gefühl 3,00 |
  | 52 | Strahlenkranz | behalten-mittel-1: 4/5, ja/ja | 4,50 | 52,2 | ohne Kernidee, unter 60 | stark: behalten |
  | 53 | Turmalin | behalten-mittel-1: 5/4, ja/ja | 4,50 | 51,6 | ohne Kernidee, unter 60 | stark: behalten |
  | 54 | Legierung | behalten-mittel-1: 3/4, nein/ja | 3,50 | 51,6 | ohne Kernidee, unter 60 | ersetzen: nicht jedes Mal Aha bei beiden; Gefühl 3,50 |
  | 56 | Farbschleuse | behalten-mittel-1: 4/4, ja/ja | 4,00 | 55,6 | ohne Kernidee, unter 60 | stark: behalten |
  | 57 | Perlmutt | behalten-mittel-1: 4/4, ja/ja | 4,00 | 49,9 | ohne Kernidee, unter 60 | stark: behalten |
  | 58 | Lichtfaden | behalten-mittel-1: 3/3, nein/nein | 3,00 | 51,1 | ohne Kernidee, unter 60 | ersetzen: nicht jedes Mal Aha bei beiden; Gefühl 3,00 |
  | 59 | Paravent | behalten-mittel-1: 3/3, nein/nein | 3,00 | 51,1 | ohne Kernidee, unter 60 | ersetzen: nicht jedes Mal Aha bei beiden; Gefühl 3,00 |
  | 60 | Bumerang | pruefung-1: 4/4, ja/ja | 4,00 | 52,2 | ohne Kernidee, unter 60 | stark: behalten |
  | 61 | Mondlicht | pruefung-6: 4/4, ja/ja | 4,00 | 48,8 | ohne Kernidee, unter 60 | stark: behalten |
  | 62 | Weichen | pruefung-3: 4/4, ja/ja | 4,00 | 57,9 | ohne Kernidee, unter 60 | stark: behalten |
  | 63 | Glasbaustein | behalten-mittel-1: 4/4, ja/ja | 4,00 | 57,9 | ohne Kernidee, unter 60 | stark: behalten |
  | 64 | Fadenkreuz | behalten-mittel-1: 4/4, ja/ja | 4,00 | 55,6 | ohne Kernidee, unter 60 | stark: behalten |
  | 65 | Lichtschranke | behalten-mittel-1: 4/4, ja/ja | 4,00 | 57,9 | ohne Kernidee, unter 60 | stark: behalten |
  | 67 | Blaue Stunde | behalten-mittel-1: 4/4, ja/ja | 4,00 | 54,4 | ohne Kernidee, unter 60 | stark: behalten |
  | 68 | Pinselstrich | pruefung-2: 4/4, ja/ja | 4,00 | 52,2 | ohne Kernidee, unter 60 | stark: behalten |
  | 71 | Farbtupfer | behalten-mittel-1: 5/4, ja/ja | 4,50 | 48,0 | ohne Kernidee, unter 60 | stark: behalten |
  | 72 | Rubin | pruefung-7: 4/4, ja/ja | 4,00 | 51,3 | ohne Kernidee, unter 60 | stark: behalten |
  | 73 | Lichtkreuz | behalten-mittel-1: 4/5, ja/ja | 4,50 | 62,4 | ohne Kernidee | stark: behalten |
  | 75 | Glühwürmchen | pruefung-5: 4/4, ja/ja | 4,00 | 57,9 | ohne Kernidee, unter 60 | stark: behalten |
  | 76 | Spektralband | pruefung-7: 4/5, ja/ja | 4,50 | 55,9 | ohne Kernidee, unter 60 | stark: behalten |
  | 78 | Rochade | spielwert-2: 5/4, ja/ja; behalten-mittel-1: 3/4, nein/ja | 4,00 | 54,5 | ohne Kernidee, unter 60 | ersetzen: nicht jedes Mal Aha bei beiden |
  | 81 | Traumfänger | pruefung-6: 4/4, ja/ja | 4,00 | 60,1 | ohne Kernidee | stark: behalten |
  | 82 | Glasbläser | probelauf-2: 3/3, ja/ja; pruefung-5: 4/3, ja/ja | 3,25 | 49,6 | ohne Kernidee, unter 60 | ersetzen: Gefühl 3,25 |
  | 87 | Schimmer | pruefung-4: 5/4, ja/ja | 4,50 | 57,9 | ohne Kernidee, unter 60 | stark: behalten |
  | 88 | Kreuzfeuer | spielwert-3: 4/4, ja/ja; pruefung-3: 4/4, ja/ja | 4,00 | 57,0 | ohne Kernidee, unter 60 | stark: behalten |
  | 91 | Uhrwerk | spielwert-4: 5/5, ja/ja; behalten-mittel-1: 4/5, nein/ja | 4,75 | 59,0 | ohne Kernidee, unter 60 | ersetzen: nicht jedes Mal Aha bei beiden |
  | 94 | Farbverlauf | probelauf-2: 4/4, ja/ja; pruefung-1: 4/5, ja/ja | 4,25 | 60,5 | ohne Kernidee | stark: behalten |
  | 95 | Schachbrett | pruefung-3: 4/4, ja/ja | 4,00 | 60,1 | ohne Kernidee | stark: behalten |
  | 98 | Smaragd | spielwert-2: 4/4, ja/ja; pruefung-6: 4/4, ja/ja | 4,00 | 50,7 | ohne Kernidee, unter 60 | stark: behalten |
  | 99 | Silberstreif | probelauf-2: 4/4, ja/ja; behalten-mittel-1: 5/5, ja/ja | 4,50 | 63,0 | ohne Kernidee | stark: behalten |
  | 100 | Chamäleon | pruefung-4: 3/4, ja/ja, Scheinmischung/– | 3,50 | 49,9 | ohne Kernidee, unter 60 | ersetzen: Gefühl 3,50; Ablehnung (A Scheinmischung) |

  - Gegenüber Stufe A: Kreuzweg, Rochade und Uhrwerk sind jetzt schwach (im neuen Urteil sieht A keinen Aha-Moment,
    bei Kreuzweg dazu Gefühl 2 und Scheinmischung), Silberstreif bleibt stark (5/5). Von den 16 ohne Urteil sind 10
    stark und 6 schwach.
  - A3 Glasfenster ist stark (einziges Urteil aus Ablauf 2 in `probelauf-3`, als Anker).
  - Zu ersetzen sind damit 30 mittlere Level: die 13 der Gruppe 1 und 17 der Gruppe 2.
