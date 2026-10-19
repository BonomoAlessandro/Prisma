# 26: Austausch „sehr schwer“

**What to build:** Die sehr schweren Level auf der Duldungsliste werden durch neue Level aus dem Generator ersetzt, in
einem Durchgang. Laut Neuzählung sind es 4 Level: 143 Prismenhof, 146 Farbenrausch, 147 Farbmühle und 149 Zenit.
Massgebend ist die Duldungsliste nach den Tickets 15 und 16.

**Spec:** ../spec.md, Abschnitt „Levelliste, Reihenfolge und Austausch“.

**Blocked by:** 16 (KI-Tester prüfen die grossen Abweichungen), 19 (Generator: alle Kernideen), 20 (Generator:
Verfeinern), 28 (Generator: Kernideen ab „mittel“)

**Status:** resolved

- [x] Für jedes sehr schwere Level der Duldungsliste gibt es ein Ersatzlevel aus dem neuen Generator, mit dem Grad
      „sehr schwer“ und einer nötigen Kernidee.
- [x] Die Formel ordnet jedes Ersatzlevel ein, und beide KI-Tester prüfen es (Protokoll). Lehnen beide ab, kommt ein
      neuer Kandidat.
- [x] **Haltepunkt:** Die Namen im bisherigen Stil werden vorgeschlagen, und der Nutzer genehmigt sie, bevor sie ins
      Spiel kommen. Die Genehmigung steht unter `## Comments`.
- [x] Die ersetzten Level sind samt Namen entfernt, und die Namen stehen auf der Liste der entfernten Namen.
- [x] Auf der Duldungsliste steht kein sehr schweres Level mehr. Ist dieses Ticket das letzte der Tickets 23–26, ist
      die Liste leer, und der Test verlangt ab jetzt eine leere Liste.
- [x] Die Regel „dieselbe Haupt-Kernidee höchstens zweimal je 10 Level“ bleibt erfüllt.
- [x] Alle Tests sind grün. Stichproben der Screenshots sind geprüft.

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

**Stufe A abgeschlossen (19.10.2026).**
- Ticket 29 ist inzwischen in `feature/levelgenerator`. Es verwirft nur fertige Level unter der Untergrenze der Quellen,
  und alle 16 Kandidaten haben 3 oder 4 Quellen; sie bleiben also gleich.
- **Lauf `ersatz-sehr-schwer-1` vorbereitet** (Ablauf 2, Fingerabdruck `066a880667331a43`, Agent `general-purpose`,
  Modell `claude-opus-5-5`): `prepare.mjs ersatz-sehr-schwer-1 --kandidaten <t26\kandidaten.json>`, die 16 Kandidaten
  der Tabelle oben als L1–L16 ohne `--anker`. Die Referenz je Kandidat ist der Platz der Formel mit dem Grad dort
  (138–150, Anker A7 auf 138, A8 auf 145). 48 Aufnahmen mit `LEISE_CPU=65`, 23,8 bzw. 22,1 s je Aufnahme. Die
  KI-Tester startet der Koordinator.
- **Entscheide für Stufe C** (über den Koordinator, 19.10.2026):
  - Zwielicht, Entscheid des Nutzers (Vorschlag a): Die Entscheide aus Ticket 16 zu den Leveln der Prüfliste bleiben
    fest, auch wenn ein Austausch die Formel verschiebt; Zwielicht bleibt auf 122. Kommt als Regel in
    `tools/levelliste.mjs` und `ordne-level.mjs`, mit Test und Gegenprobe, dazu Spec und Hinweise in 24 und 25.
  - Anker A8 (in Ticket 16 vorgesehen): ein neues Level am oberen Ende von „sehr schwer“, mit Urteil und ohne
    Ablehnung; danach Ablauf 3. Den Vorschlag bestätigt der Nutzer mit den Namen.

**Vorprüfung auf Zerfall (19.10.2026, auf Bitte des Koordinators).** Das Skript `zerfall-check.mjs` aus Ticket 24 liegt
als Kopie in `t26\`. Es teilt die Lösung in Teile, die weder ein Ziel noch ein nötiges Element teilen; die Beurteilung
bleibt unverändert. Ergebnis je Kandidat des Laufs `ersatz-sehr-schwer-1` (Teile, Grösse je Teil als Quellen / drehbare
Elemente / Ziele):

| ersetzt | Kandidat | Ersatz |
|---|---|---|
| Korona | 7cdbf908: 2 (2/10/2 + 2/2/1) | 43ba1dd9: 2 (2/12/3 + 2/1/1) |
| Prismenhof | fb490f7a: 3 (1/8/1 + 2/2/1 + 1/2/1) | ae5500c7: 2 (2/13/4 + 2/1/1) |
| Spiegelkabinett | fe84c829: 2 (3/12/3 + 1/2/1) | e3300612: 2 (3/13/2 + 1/1/1) |
| Quasar | **0e4262ab: 1** | c94a77bc: 2 (3/12/4 + 1/1/1) |
| Ereignishorizont | **2d5f0698: 1** | **0c14e76f: 1** |
| Zenit | d4f62e92: 4 (1/6/2 + 3 × 1/2/1) | bd19e7db: 2 (2/13/4 + 1/1/1) |
| Farbenrausch | **a1e8102b: 1** | **2c01b273: 1** |
| Farbmühle | 4f7893e6: 2 (3/12/4 + 1/1/1) | **7fea2e13: 1** |

- Mit einem Teil bestehen 6 von 16. Für Korona, Prismenhof, Spiegelkabinett (alle Mischziel) und Zenit (Falle) besteht
  keiner.
- Im Pool (Seeds 1–1000 ohne Ziel, verlangte = Haupt-Kernidee) bestehen Farben abzählen 28 von 28, Mischziel 10 von 47,
  Sammelstelle 8 von 22 und Falle 5 von 15. Bestehende Mischziele liegen fast nur unter 88 oder über 90,4.
- In Stufe B gilt je Lücke bevorzugt ein Kandidat, der mit einem Teil besteht, sonst die Regel der KI-Tester.

**Stufe B (19.10.2026): Urteile der KI-Tester, Wahl je Lücke, Namensvorschläge.**
- **Lauf `ersatz-sehr-schwer-1`** zusammengeführt (`merge.mjs`, 16 Einträge, Ablauf 2; `ki-tester.test.mjs` 64 grün).
  Abgelehnt ist keiner. B nennt keinen Begriff, A nennt Füllteil bei ae5500c7 und 43ba1dd9 (beide Ersatz). A sieht bei
  e3300612 keinen Aha-Moment (Gefühl 2). Die meisten Kandidaten über Pulsar ordnen beide unter A8 ein (Korrektur −2 bis
  −5).
- **Wahl** nach der Rangfolge des Koordinators: nicht abgelehnt, beide sehen einen Aha-Moment, keiner nennt einen
  Begriff, die Vorprüfung ergibt einen Teil, höheres mittleres Gefühl. Je Lücke besteht der beste Kandidat die zweite
  und dritte Stufe; einen Lauf 2 braucht es nicht.

  | Lücke | gewählt | Platz | Schwierigkeit | Haupt-Kernidee | Gefühl | Einordnung | Teile | Begründung |
  |---|---|---:|---:|---|---|---|---:|---|
  | Korona | 7cdbf908 | 140 | 88,47 | Mischziel | 4/4 | A7-A8 / A5-A6 | 2 | Ersatz: A nennt Füllteil |
  | Prismenhof | fb490f7a | 142 | 90,02 | Mischziel | 3/3 | >A8 / A7 | 3 | Ersatz: A nennt Füllteil |
  | Spiegelkabinett | fe84c829 | 146 | 90,41 | Mischziel | 4/4 | >A8 / A7-A8 | 2 | Ersatz: A ohne Aha |
  | Quasar | 0e4262ab | 144 (−3) | 91,23 | Sammelstelle | 5/4 | A7-A8 / A7 | 1 | Vorprüfung |
  | Ereignishorizont | 2d5f0698 | 150 | 90,86 | Farben abzählen | 4/4 | A8 / A8 | 1 | gleichauf mit 0c14e76f; höherer Spielwert (94,3 / 92,0) |
  | Zenit | bd19e7db (Ersatz) | 148 (−2) | 94,61 | Falle | 4/4 | A8 / A8 | 2 | Kandidat: 4 Teile, Gefühl 4/3 |
  | Farbenrausch | a1e8102b | 147 (−3) | 96,44 | Farben abzählen | 4/4 | A8 / A7-A8 | 1 | gleichauf mit 2c01b273; höherer Spielwert (89,7 / 84,6) |
  | Farbmühle | 7fea2e13 (Ersatz) | 145 (−5) | 98,40 | Sammelstelle | 4/5 | A7-A8 / A7-A8 | 1 | Vorprüfung |

- **Plätze** (`ordne-level.mjs --austausch`, ohne die neue Regel zu Zwielicht): 140 neu, 141 Lichtkegel, 142 neu,
  143 Morgenröte, 144–148 neu, 149 Pulsar, 150 neu. Kein heutiges Level aus 138–148 ändert seinen Platz; Pulsar rückt
  durch die Korrekturen der neuen Level von 145 auf 149. Keine Korrektur geht über die Grenze 140/141.
- **Regeln:** Auf 141–150 je zweimal Falle, Mischziel, Abschalten, Sammelstelle und Farben abzählen. Auf 131–140 mit
  Zwielicht auf 122 (Entscheid vom 19.10.2026) Abschalten 2, Farben abzählen 2, Sammelstelle 1, Mischziel 1; frei für
  Ticket 25 bleiben dort Falle 2, Sammelstelle 1, Lockvogel 2 und Mischziel 1. Mittel 141–150: 92,2.
- **Anker A8:** Mit diesen Korrekturen steht Pulsar auf 149, im äussersten Drittel von 138–150; der Test der Anker
  bleibt damit auch ohne neuen Anker grün (anders als in Stufe A angenommen). Kommt trotzdem ein neuer A8, dann
  2d5f0698 auf 150: beide KI-Tester „A8“, Aha ja/ja, kein Begriff, ein Teil, Lesbarkeit 4/3, Gefühl 4/4.
- **Namensvorschläge** (je 2–3, der erste bevorzugt; keiner im Spiel oder unter den entfernten Namen, geprüft):
  - 140, 7cdbf908: **Lichtfächer** (das Prisma fächert Weiss nach Nordosten, Rot und Blau treffen sich auf zwei
    Wegen im Magenta-Ziel), Kreuzlicht, Doppelstern.
  - 142, fb490f7a: **Abendrot** (Gelb wird im Rotfilter zu Rot; neben Abendstern und Morgenröte), Rotglas, Rückweg.
  - 144, 0e4262ab: **Leitstern** (ein Prisma sammelt Gelb und Blau und versorgt drei Ziele), Polarstern.
  - 145, 7fea2e13: **Konjunktion** (Rot von oben und Grün von unten treffen sich im Prisma, Gelb und Cyan je aus zwei
    Quellen), Doppelstern.
  - 146, fe84c829: **Weissabgleich** (Rot, Grün und Blau aus drei Quellen ergeben Weiss; die Farbbilanz knackt es),
    Dreiklang, Tageslicht.
  - 147, a1e8102b: **Dreigestirn** (drei Magenta-Quellen, eine geht ungeteilt ins Magenta-Ziel), Purpur, Fuchsie.
  - 148, bd19e7db: **Azur** (drei blaue Ziele, jede Quelle liefert genau ein Blau), Kobalt, Ultramarin.
  - 150, 2d5f0698: **Umlaufbahn** (das Blau läuft über neun Spiegel einmal ums Feld), Kometenbahn, Mondbahn.
  Die Genehmigung des Nutzers folgt hier.

**Genehmigung des Nutzers (19.10.2026, über den Koordinator):** Alle Favoriten gelten: 140 Lichtfächer, 142 Abendrot,
144 Leitstern, 145 Konjunktion, 146 Weissabgleich, 147 Dreigestirn, 148 Azur, 150 Umlaufbahn. Anker A8 Pulsar bleibt,
kein neuer Anker und kein Ablauf 3. Dazu der Entscheid zu Zwielicht (Vorschlag a, siehe Stufe A).

**Abschluss Stufe C (19.10.2026).**
- **Neue Regel** (Entscheid des Nutzers vom 19.10.2026): Die Entscheide aus Ticket 16 zu den Leveln der Prüfliste
  bleiben fest, auch wenn ein Austausch die Formel verschiebt.
  - `tools/levelliste.json` hält je Level der Prüfliste mit Urteil den Platz der Formel beim Entscheid fest
    (`prueflisteFormel`, 51 Level, darunter Zwielicht 137 und Spiegelkabinett 131). Gesetzt vor dem Austausch mit
    `ordne-level.mjs --schreiben` auf dem Stand von Ticket 23 (dort sonst unverändert); danach bleibt er, wie er ist.
  - `reihenfolge` in `tools/levelliste.mjs` nimmt ihn als `formelEntscheid` und rechnet damit die Zustimmung; wohin ein
    Level mit Zustimmung kommt, folgt weiter der Formel von heute. `ordne-level.mjs` liest und schreibt ihn und nennt im
    Bericht „beim Entscheid …“, wo er abweicht.
  - Neuer Test „Die Entscheide aus Ticket 16 zur Prüfliste bleiben fest …“ mit Gegenprobe: Ohne die festen Plätze
    fiele nur der Entscheid zu Zwielicht anders aus (Formel 136 statt 137), und Zwielicht käme zur Formel; mit ihnen
    steht es auf 122.
- **Eingesetzt** mit `ordne-level.mjs --austausch <t26\austausch-genehmigt.json> --schreiben`; ein zweiter Lauf ohne
  `--austausch` meldet „Reihenfolge und Grade stimmen“ und „Duldungsliste und Prüfliste stimmen“.

  | Platz | neu | ersetzt | Schwierigkeit | Haupt-Kernidee | Herkunft (Auftrag, Seed, Ziel) | KI-Tester (Gefühl, Einordnung) |
  |---:|---|---|---:|---|---|---|
  | 140 | Lichtfächer | Korona | 88,5 | Mischziel | sehr schwer-mischziel, 366, 88,36–89,15 | 4/4, A7-A8/A5-A6 |
  | 142 | Abendrot | Prismenhof | 90,0 | Mischziel | sehr schwer-mischziel, 312, 89,16–90,32 | 3/3, >A8/A7 |
  | 144 | Leitstern | Quasar | 91,2 | Sammelstelle | sehr schwer-sammelstelle, 673, 90,42–91,28 | 5/4, A7-A8/A7 (−3) |
  | 145 | Konjunktion | Farbmühle | 98,4 | Sammelstelle | sehr schwer-sammelstelle, 109, 96,52–110 | 4/5, A7-A8/A7-A8 (−5) |
  | 146 | Weissabgleich | Spiegelkabinett | 90,4 | Mischziel | sehr schwer-mischziel, 357, 90,33–90,41 | 4/4, >A8/A7-A8 |
  | 147 | Dreigestirn | Farbenrausch | 96,4 | Farben abzählen | sehr schwer-abzaehlen, 170, 96,18–99,16 | 4/4, A8/A7-A8 (−3) |
  | 148 | Azur | Zenit | 94,6 | Falle | sehr schwer-falle, 534, 91,29–96,51 | 4/4, A8/A8 (−2) |
  | 150 | Umlaufbahn | Ereignishorizont | 90,9 | Farben abzählen | sehr schwer-abzaehlen, 101, 90,55–96,17 | 4/4, A8/A8 |

  - Nachgebaut: Für alle acht ergibt `generiere.mjs <auftrag> --seed S --anzahl 1 --seeds 1 --schwierigkeit VON,BIS`
    mit den Werten der Herkunftszeile denselben Abdruck wie das Level im Spiel (8 von 8).
- **Entfernt:** Korona, Prismenhof, Spiegelkabinett, Quasar, Ereignishorizont, Zenit, Farbenrausch und Farbmühle;
  ihre Namen stehen auf `entfernteNamen`, ihre Leveldaten in `tools/beurteilung/entfernte-level.json`.
- **Duldungsliste:** 76 Level (vorher 84): Ausschlussgrund 24 (31), unter dem Mindest-Spielwert 55 (56), von beiden
  KI-Testern abgelehnt 6 (7), ohne nötige Kernidee 58; sehr schwer 0 von 13. `AUSGETAUSCHT` ist um „sehr schwer“
  ergänzt. Nicht das letzte der Tickets 23–26, die Liste ist also nicht leer.
- **Regeln:**
  - Grad sinkt nie; sehr schwer bleibt 138–150. Nur Pulsar ändert seinen Platz (145 → 149, durch die Korrekturen der
    neuen Level, die die KI-Tester unter A8 einordnen); Zwielicht bleibt auf 122, in „schwer“ rückt kein Level.
  - Haupt-Kernidee ohne die Duldungsliste eingehalten: auf 141–150 Falle, Mischziel, Abschalten, Sammelstelle und
    Farben abzählen je 2; auf 131–140 Abschalten 2, Farben abzählen 2, Sammelstelle 1, Mischziel 1. Häufungsregel nur
    mit den zwei Zügen aus Ticket 16.
  - Mittel je 10 Level … 61,6 75,5 85,3 92,2, kleinster Schritt −0,34 (wie vorher).
  - Prüfliste 50 (ohne Spiegelkabinett), erledigt.
  - Anker: A8 Pulsar steht auf 149, im äussersten Drittel des Grads; der Test der Anker ist grün, Ablauf 2 bleibt.
- **Tests** (über `leise.sh`, `LEISE_MAX_CPU=80 LEISE_CPU=80`): logic 548, generator 28, beurteilung 177,
  levelliste 38, ki-tester 64 und offline grün. `golden.mjs`: wie erwartet 16 Abweichungen, nur die 8 entfernten und
  die 8 neuen Namen; `tests/golden.json` ist nicht angefasst. Im Test der Herkunftszeile erlaubt das Muster jetzt
  Aufträge wie „sehr schwer-mischziel“ (vorher nur ohne Leerzeichen).
- **Screenshots** (Stichproben, ohne Meldungen in der Konsole): Levelauswahl 141–150 auf Desktop (Titel „Level
  141 – 150 · Sehr schwer“, die neuen Namen, ●●●●) und Handy; 140 Lichtfächer und 150 Umlaufbahn auf Desktop und Handy
  mit Kopfzeile wie im Spiel (`tests/output/t26-level/`).
- **Abweichungen:**
  - 8 statt 4 Level (Stufe A).
  - Für Zenit und Farbmühle kamen die Ersatzkandidaten (Azur, Konjunktion), nach der Rangfolge aus Stufe B mit der
    Vorprüfung auf Zerfall aus Ticket 24; ein Lauf 2 war nicht nötig.
  - Der Anker bleibt (Stufe A ging von einem neuen A8 aus).
  - Hinweise für 24 und 25 stehen dort unter `## Comments`, die neue Regel und die Duldungsliste nach Ticket 26 in der
    Spec, die Regel auch im README.

**Review (19.10.2026).** Geprüft wurde `git diff 10e3041 HEAD` (Stufen A–C), nachgerechnet in Kopien ausserhalb des
Repos (Scratchpad `review26\`).
- **Austausch:** Die acht neuen Level stehen mit den genehmigten Namen auf ihren Plätzen, alle „sehr schwer“:
  140 Lichtfächer, 142 Abendrot, 144 Leitstern, 145 Konjunktion, 146 Weissabgleich, 147 Dreigestirn, 148 Azur und
  150 Umlaufbahn.
  - Jedes ist bitgenau der beurteilte Kandidat: Elemente samt Reihenfolge und Lösung gleichen dem Kandidaten auf der
    Seite des Laufs (`ersatz-sehr-schwer-1/seite/index.html`), der Abdruck dem Namen im Protokoll und der Wahl je
    Lücke.
  - Die acht alten Level fehlen im Spiel, ihre Namen stehen auf `entfernteNamen`, und ihre Kopie in
    `entfernte-level.json` ist als JSON gleich den Leveldaten in `10e3041`; die sechs aus Ticket 23 sind unverändert.
  - Die übrigen 142 Level und das Tutorial sind unverändert, ebenso ihre Reihenfolge untereinander. Nur Pulsar rückt,
    von 145 auf 149.
- **Wahl je Lücke:** Die 16 Einträge von `ersatz-sehr-schwer-1` sind genau `entry()` aus `lauf.json` und den beiden
  Antworten, wie `merge.mjs` sie erzeugt. Die Rangfolge (nicht abgelehnt, beide Aha, kein Begriff, ein Teil, Gefühl)
  ist richtig angewandt: Bei Korona und Prismenhof scheidet der Ersatz an „Füllteil“ (A) aus, bei Spiegelkabinett an
  „kein Aha“ (A); Quasar und Farbmühle entscheidet die Vorprüfung (ein Teil), Zenit das Gefühl (4/4 gegen 4/3). Die
  Teile der acht gewählten ergibt `zerfall-check.mjs` wie im Ticket.
  - Hinweis: Bei Ereignishorizont und Farbenrausch sind beide bis zum Gefühl gleichauf; den Ausschlag gibt der
    Spielwert (94,3/92,0 und 89,7/84,6, nachgebaut), eine Stufe, die die Rangfolge nicht nennt. Sie steht in der
    Tabelle von Stufe B, und die Namen sind auf dieser Wahl genehmigt.
- **Neue Regel:** Korrekt und nachvollziehbar. `prueflisteFormel` ist für alle 51 Level gleich dem Platz der Formel bei
  Ticket 16 (`ordne-level.mjs --json` auf `974c4f0`) und auf `10e3041`; ob nach Ticket 16 oder 23 gesetzt, macht also
  keinen Unterschied. Auf HEAD weicht nur Zwielicht ab (137 → 136), und nur dessen Entscheid hinge an der Regel.
  - Alle bisherigen Entscheide bleiben: Zustimmung und Platz der 50 Level der Prüfliste sind auf HEAD wie auf
    `10e3041`, die Häufungsregel macht wie bisher nur Chamäleon 102 → 100 und Spiegelsaal 131 → 130.
  - Ohne die Regel (nachgerechnet): Zwielicht 122 → 136, 13 schwere Level einen Platz vor, auf 131–140 dreimal Farben
    abzählen offen, wie in Spec und Ticket beschrieben.
  - Die Gegenprobe ist echt: Rechnet `reihenfolge` die Zustimmung wieder mit der Formel von heute, oder fehlt
    `prueflisteFormel` in `levelliste.json`, wird der neue Test rot (Zwielicht 136 ≠ 137 bzw. „ohne festen Platz der
    Formel“), dazu die Tests der Reihenfolge und der Häufungsregel; die übrigen 35 bleiben grün.
- **Reihenfolge:** Auf dem Stand von Stufe B (`fa32acc`, Werkzeuge von HEAD) setzt `ordne-level.mjs --schreiben` nur
  `prueflisteFormel`; danach ergibt `--austausch … --schreiben` mit einer eigenen Austausch-Datei (Leveldaten aus dem
  eigenen Nachbau, Ziel aus den Lücken von Stufe A) genau index.html, levelliste.json und `entfernte-level.json` von
  HEAD. Ein zweiter Lauf meldet „stimmen“ und ändert nichts. Die Haupt-Kernidee ist ohne die Duldungsliste
  eingehalten (141–150 fünf Kernideen je zweimal; 131–140 Abschalten 2, Farben abzählen 2, Sammelstelle 1, Mischziel
  1), das Mittel je 10 Level ist … 61,6 75,5 85,3 92,2 mit kleinstem Schritt −0,34, der Test der Anker ist grün (A8
  Pulsar auf 149).
- **Herkunft:** Alle acht Herkunftszeilen bauen mit `generiere.mjs <auftrag> --seed S --anzahl 1 --seeds 1
  --schwierigkeit VON,BIS` das Level im Spiel nach: mit dem Generator des Branches, mit dem von `bfd92a2` (Ticket 29)
  und mit dem von `75ab4e0` (Ticket 22, inzwischen auf `origin/feature/levelgenerator`). Der Nachbau gibt bei festen
  Spiegeln `fixed` vor `rot` aus; als Daten ist er gleich, im Spiel schreibt `levelCode` die übliche Reihenfolge.
- **Muster der Herkunftszeile im Test:** Es erlaubt jetzt genau den Vorsatz „sehr “ (`(?:sehr )?[a-z]+(?:-[a-z]+)?`),
  keine beliebigen Leerzeichen, und prüft weiter Seed, Ziel und dass die Zeile direkt vor dem Namen des Levels steht.
  Das genügt; ob die Werte das Level nachbauen, prüft der Test nicht (zu teuer), das bleibt Sache des Reviews.
- **Merge-Probe** (temporärer Branch, wieder gelöscht): Mit `bfd92a2` gibt es nur einen Konflikt, am Ende von Ticket 24
  (zwei neue Hinweise, aus 29 und aus 26); beide bleiben, der ältere zuerst. README und Tests mischen sich von selbst.
  Auf dem gemischten Stand sind golden (16 Namensabweichungen), generator 30, levelliste 38 und ki-tester 64 grün.
  Mit `75ab4e0` entsteht derselbe eine Konflikt (`git merge-tree`).
- **Screenshots:** Geprüft sind die Levelauswahl 141–150 auf Desktop (Titel „Level 141 – 150 · Sehr schwer“, die
  neuen Namen, ●●●●) und Handy sowie 140 Lichtfächer (Desktop) und 150 Umlaufbahn (Handy): Kopfzeile, Grad und Ziele
  wie im Spiel.
- **Selbst behoben (klein):** Drei Zeilen im README, eine in der Spec und eine im Kopf von `tests/levelliste.test.mjs`
  waren länger als 120 Zeichen (umbrochen, Text unverändert); Kopf und `ladeLevelliste` in `tools/levelliste.mjs`
  nennen jetzt Ticket 26 bzw. `prueflisteFormel` (`e53854e`).
- **Offen, M1 (mittel, betrifft erst 24/25): Die Regel hält nur die Zustimmung fest, nicht die Zugehörigkeit zur
  Prüfliste.**
  - **Wo:** `tools/levelliste.mjs`, `reihenfolge` (die Prüfliste kommt aus `ordne` mit der Formel von heute; „das
    Level steht nicht auf der Prüfliste“ wirft); `tools/ordne-level.mjs`, `prueflisteFormel = bisher?.prueflisteFormel
    ?? …` (übernimmt alles oder nichts); Hinweis aus Ticket 26 in Ticket 24 („mit der Regel ändert sich dadurch kein
    Entscheid mehr“).
  - **Szenario:** Ein Austausch schiebt die Formel eines Levels der Prüfliste auf höchstens 10 Plätze an seinen
    heutigen Platz: `reihenfolge` wirft „Urteil zu … (pruefung-…): das Level steht nicht auf der Prüfliste“, Skript und
    Test brechen ab (mit den Werten von HEAD nachgestellt: Eine Schwierigkeit knapp über Farbverlauf für Feuerwerk oder
    für Brechpunkt genügt). Umgekehrt kommt ein Level ohne Urteil neu auf die Prüfliste; ein späteres Urteil nimmt
    `ordne-level.mjs` nicht in `prueflisteFormel` auf, der neue Test verlangt es aber. Knapp an der Grenze stehen
    ausserhalb der Duldungsliste Sternenstaub (A7, heute 148, Formel 138) und Pulsar (A8, heute 135, Formel 145) mit
    je einem Platz, Lichtkegel mit 2, Saphir (Prüfliste, bleibt), Feuerwerk, Halo, Brechpunkt und Lichtbrücke mit 3.
    Mit Ersatz in der Lücke am Platz im Spiel (wie in 26) kippt nach meiner Abschätzung in 24/25 keines;
    ausgeschlossen ist es nicht.
  - **Erwartet:** Ein Entscheid aus Ticket 16 bleibt auch dann fest, wenn das Level durch die Verschiebung unter die
    Grenze fällt; ein Level, das neu darüber kommt, braucht nach ADR 0002 ein Urteil, und dessen Platz der Formel kommt
    wie die übrigen in `prueflisteFormel`.
  - **Vorschlag:** Ein Level mit festem Platz beim Entscheid bleibt auf der Prüfliste (`ordne` misst die Zugehörigkeit
    dieser Level mit `formelEntscheid`); `ordne-level.mjs` behält die bisherigen Einträge und ergänzt Level mit neuem
    Urteil um ihren Platz der Formel von heute. Dazu ein Test mit erfundener Verschiebung (wie oben), und die Hinweise
    in 24 und 25 nachführen.
  - **Behoben, wenn:** Mit der erfundenen Verschiebung rechnet `reihenfolge` ohne Fehler, und das Level behält
    Entscheid und Platz; ein erfundenes neues Urteil landet beim Schreiben in `prueflisteFormel`; auf HEAD ändert sich
    nichts (ein zweiter Lauf meldet „stimmen“).
- **Hinweis für 24/25, keine Änderung:** Die Gegenprobe im neuen Test hängt an Zwielicht. Rückt dessen Formel durch
  einen späteren Austausch wieder auf 137, wird sie rot, obwohl die Regel hält; dann braucht es ein anderes Beispiel
  oder eine erfundene Verschiebung.
- **Tests** (über `leise.sh`, `LEISE_MAX_CPU=80 LEISE_CPU=80`): Golden hat wie erwartet nur die 16 Namensabweichungen.
  Grün sind logic 548, generator 28, beurteilung 177, levelliste 38, ki-tester 64 und offline.
- **Urteil:** Ticket 26 ist bereit zum Mergen. Leveldaten, Namen, Reihenfolge, Duldungsliste und die neue Regel sind
  für den heutigen Stand korrekt. M1 sollte vor dem Fortsetzen von Ticket 24 geschlossen werden (hier oder dort). Nach
  dem Merge schreibt der Koordinator `tests/golden.json` neu.

**M1 behoben (19.10.2026).**
- **Zugehörigkeit zur Prüfliste fest:** `ordne` in `tools/levelliste.mjs` nimmt je Level den festen Platz der Formel
  beim Entscheid (`fest[i]`) und misst daran, ob ein Level mit Entscheid auf der Prüfliste steht; `reihenfolge` gibt
  ihn aus `formelEntscheid` weiter, für die Prüfliste und für die Zustimmung. Ein Level mit Entscheid bleibt so auf der
  Prüfliste, mit Entscheid und Platz, auch wenn ein Austausch seine Formel an den heutigen Platz rückt; `reihenfolge`
  wirft dann nicht mehr.
- **Neue Urteile:** `festePlaetze` in `tools/levelliste.mjs` (von `ordne-level.mjs` benutzt) behält die bisherigen
  Einträge von `prueflisteFormel` und ergänzt ein Level der Prüfliste mit Urteil, aber ohne festen Platz, um seinen
  Platz der Formel von heute. `ordne-level.mjs` vergleicht `prueflisteFormel` jetzt mit diesem Ergebnis („stimmen“
  nur, wenn nichts dazukommt).
- **Test** „Feste Entscheide der Prüfliste an erfundenen Verschiebungen der Formel, mit Gegenproben“, unabhängig von
  Zwielicht (die Gegenprobe dort ist weg):
  1. Die Formel eines Levels der Prüfliste, das am heutigen Platz bleibt, rückt auf diesen Platz: Mit den festen
     Plätzen bleibt es auf der Prüfliste, mit Entscheid, festem Platz und heutigem Platz; ohne sie wirft
     `reihenfolge` („steht nicht auf der Prüfliste“).
  2. Ein Level, dem beide am festen Platz zustimmen, bleibt am heutigen Platz, wenn der feste Platz 11 Plätze auf der
     anderen Seite läge; die Formel von heute ist dieselbe.
  3. Ein Level rückt durch eine erfundene Verschiebung 15 Plätze in der Formel: Es steht neu auf der Prüfliste, ohne
     Urteil kommt nichts zu `prueflisteFormel`, mit einem erfundenen Urteil sein Platz der Formel von heute, die
     übrigen bleiben.
  Dazu misst der Test der Prüfliste die Level mit Entscheid am festen Platz, und auf dem Stand im Spiel ergibt
  `festePlaetze` genau `prueflisteFormel`.
- **Auf HEAD unverändert:** `ordne-level.mjs` meldet „stimmen“; das Ergebnis je Level (`--json`) ist gleich wie vor M1,
  index.html und `levelliste.json` sind unverändert.
- **Nachgeführt:** Hinweise in 24 und 25, Spec („Weitere Hinweise“) und README.
- **Tests** (über `leise.sh`, `LEISE_MAX_CPU=80 LEISE_CPU=80`): logic 548, generator 28, beurteilung 177,
  levelliste 39, ki-tester 64 und offline grün; golden mit genau den 16 Namensabweichungen.
