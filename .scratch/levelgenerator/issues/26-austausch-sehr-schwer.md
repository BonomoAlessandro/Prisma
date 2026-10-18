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

**Hinweis aus Ticket 28 (18.10.2026):** Die Verteilung der Haupt-Kernideen ist gemessen. Seeds 1–500 je Auftrag,
Level mit der verlangten Kernidee als Haupt-Kernidee: Mischziel 26, Farben abzählen 14, Abschalten 7 (Seeds 501–1000:
3; nach dem Review), Falle 6, Sammelstelle 5, Lockvogel 0 (je Auftrag 205 bis 420 CPU-s, mit `--jobs 7` rund eine
Minute; `sehr schwer-lockvogel` nicht bestellen). Bedarf auf 141–150: Abschalten hat dort schon 2, die 7 Ersatzlevel
brauchen ohne Lockvogel Falle 1, Farben abzählen 2, Sammelstelle 2 und Mischziel 2, also jede dieser vier voll; Korona
auf 140 teilt die Seite mit vier schweren Ersatzleveln (frei: Falle 2, Sammelstelle 1, Lockvogel 2, Mischziel 2). Für
Kandidaten, die die KI-Tester ablehnen dürfen, lohnen bei Falle und Sammelstelle einige hundert Seeds mehr. Tabellen
in Ticket 28.

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

**Stand am Abend des 18.10.2026 (Stufe A, unterbrochen).** Branch `ticket/26-austausch-sehr-schwer` ab `10e3041`.
Zwischenstände im Scratchpad unter `t26\` (Sitzung `0a88c4f4-…`); dort auch die Skripte.
- **Erledigt:**
  - **8 Level, nicht 4:** Massgebend ist `tools/levelliste.json` (Ticket 16). In „sehr schwer“ (Plätze 138–150) stehen 8
    Level darauf: 140 Korona, 142 Prismenhof, 146 Quasar, 147 Ereignishorizont, 148 Zenit, 149 Farbenrausch und
    150 Farbmühle mit Ausschlussgrund, 144 Spiegelkabinett von beiden KI-Testern abgelehnt (dazu unter dem
    Mindest-Spielwert). Keines steht nur wegen Kernidee oder Spielwert darauf, ein Entscheid des Nutzers ist also nicht
    nötig. Die 4 im Kopf sind die heutigen Plätze der vier Favoriten aus Review 6.
  - **Lücken** (Nachbarn im Spiel nach der Schwierigkeit): Korona 88,36–89,15, Prismenhof 89,16–90,32,
    Spiegelkabinett 90,33–90,41, Quasar 90,42–91,28, Ereignishorizont 90,55–96,17, Zenit 91,29–96,51, Farbenrausch
    96,18–99,16, Farbmühle 96,52–110 (nach oben offen; der Generator verlangt eine Zahl).
  - **Kernideen nach Ticket 28:** auf 141–150 Falle 1, Farben abzählen 2, Sammelstelle 2, Mischziel 2 (jede voll),
    Korona auf 140 Mischziel (lässt Ticket 25 auf 131–140 Falle 2, Sammelstelle 1, Lockvogel 2, Mischziel 1).
  - **Generator** (Filter: Haupt-Kernidee = verlangte, mindestens 2 Quellen; alle Kandidaten haben 3 oder 4):
    - Befund: Ein Seed rechnet mit und ohne Ziel gleich bis zur ersten vollen Beurteilung im Grad; scheitert er vorher,
      dann mit jedem Ziel gleich. Darum zuerst ohne Ziel, dann mit Ziel nur auf den Seeds mit Level oder spätem
      Scheitern.
    - Ohne Ziel, Seeds 1–1000 je Auftrag (`--jobs 7`, 2309 CPU-s): Level / Haupt Mischziel 72 / 47, Farben abzählen
      43 / 28, Sammelstelle 48 / 22, Falle 15 / 15.
    - Mit Ziel auf diesen Seeds (90,33–90,41; 96,18–99,16; 96,52–110; 1314 CPU-s): oben genug, etwa Sammelstelle 4 bzw.
      6 Haupt-Level. Für Spiegelkabinett (Lücke 0,08 breit) nur ein Level (Mischziel, Seed 357); sein Ersatz nimmt die
      Lücke von Prismenhof (Morgenröte rückt dann von 143 auf 144).
    - Nachbau: Alle 16 Kandidaten und 2 verworfene ergeben mit `generiere.mjs <auftrag> --seed S --anzahl 1 --seeds 1
      --schwierigkeit VON,BIS` denselben Abdruck.
  - **Kandidaten** (Kandidat / Ersatz; Auftrag `sehr schwer-…`, Seed, Schwierigkeit, Platz nach `ordne-level.mjs
    --austausch`):

    | ersetzt | Kandidat | Ersatz |
    |---|---|---|
    | 140 Korona | 7cdbf908: mischziel, 366; 88,47; 140 | 43ba1dd9: mischziel, 735; 88,71; 140 |
    | 142 Prismenhof | fb490f7a: mischziel, 312; 90,02; 142 | ae5500c7: mischziel, 386; 89,24; 142 |
    | 144 Spiegelkabinett | fe84c829: mischziel, 357; 90,41; 144 | e3300612: mischziel, 770; 89,93; 143 |
    | 146 Quasar | 0e4262ab: sammelstelle, 673; 91,23; 147 | c94a77bc: sammelstelle, 343; 90,82; 146 |
    | 147 Ereignishorizont | 2d5f0698: abzaehlen, 101; 90,86; 146 | 0c14e76f: abzaehlen, 866; 91,54; 147 |
    | 148 Zenit | d4f62e92: falle, 633; 95,19; 148 | bd19e7db: falle, 534; 94,61; 148 |
    | 149 Farbenrausch | a1e8102b: abzaehlen, 170; 96,44; 149 | 2c01b273: abzaehlen, 505; 96,47; 149 |
    | 150 Farbmühle | 4f7893e6: sammelstelle, 556; 100,85; 150 | 7fea2e13: sammelstelle, 109; 98,40; 150 |

  - **Lauf `ersatz-sehr-schwer-1`:** `prepare.mjs --kandidaten` lief, ist aber für die Nacht nach 5 von 48 Aufnahmen
    abgebrochen; der unvollständige Ordner ist gelöscht.
- **Befunde für Stufe C** (an den Koordinator gemeldet, Entscheid offen):
  1. **Zwielicht und Farben abzählen auf 131–140.** Ohne Spiegelkabinett (Formel 131) rückt Zwielicht (Prüfliste,
     pruefung-7) in der Formel von 137 auf 136. Damit stimmt KI-Tester A zu, Zwielicht geht von 122 auf 136, und 13
     schwere Level rücken einen Platz vor. Auf 131–140 steht dann dreimal Farben abzählen (Halo, Zwielicht,
     Lichtbrücke), und die Häufungsregel findet keinen einzelnen Zug („nicht aufzulösen“). Das gilt für jede Wahl der
     Kandidaten; `--schreiben` würde abbrechen.
  2. **Anker A8.** Pulsar (heute 135) kann höchstens auf 145 stehen (10 Plätze). Auf 146–150 stehen nach dem Austausch
     neue Level ohne Ausschlussgrund, damit hält A8 die Regel „am oberen Ende“ nicht mehr ein. Es braucht in Stufe C
     einen neuen Anker A8 und Ablauf 3 (wie in Ticket 16 vorhergesagt). Für den Lauf `ersatz-sehr-schwer-1` gilt noch
     Ablauf 2.
- **Als Nächstes:** `prepare.mjs ersatz-sehr-schwer-1 --kandidaten <t26\kandidaten.json>` neu starten, über `leise.sh`
  mit `LEISE_CPU=65`, etwa 25 min. Danach Bericht an den Koordinator (Ende Stufe A) mit Lauf, Kandidaten und den
  beiden Befunden.
- **Zwischenstände in `t26\`:** `stufe1.jsonl` und `stufe2.jsonl` (Pools), `wahl.json`, `nachbau.jsonl`,
  `austausch-H.json` und `austausch-E.json` (Kandidaten und Ersatz), `ordne-H.json`/`.txt` und `ordne-E.json`/`.txt`,
  `ordne-heute.json` (Stand vorher) und `kandidaten.json` (Eingabe für `prepare.mjs`). Skripte: `pool.mjs`,
  `nachbau.mjs`, `austausch.mjs`, `kandidaten.mjs`, `zeige.mjs`. Die Sätze B1 und B2 (Sammelstelle unter Pulsar)
  sind verworfen: Pulsar käme auf 146 und bliebe dann auf seinem heutigen Platz 135, in „schwer“.
