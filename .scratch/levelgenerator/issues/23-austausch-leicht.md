# 23: Austausch „leicht“

**What to build:** Die leichten Level auf der Duldungsliste werden durch neue Level aus dem Generator ersetzt, in einem
Durchgang. Laut Neuzählung sind es 5 Level: 15, 19, 20, 26 und 29. Massgebend ist die Duldungsliste nach den Tickets 15
und 16.

**Spec:** ../spec.md, Abschnitt „Levelliste, Reihenfolge und Austausch“.

**Blocked by:** 16 (KI-Tester prüfen die grossen Abweichungen), 19 (Generator: alle Kernideen), 20 (Generator:
Verfeinern)

**Status:** resolved

- [x] Für jedes leichte Level der Duldungsliste gibt es ein Ersatzlevel aus dem neuen Generator, mit dem Grad „leicht“.
- [x] Die Formel ordnet jedes Ersatzlevel ein, und beide KI-Tester prüfen es (Protokoll). Lehnen beide ab, kommt ein
      neuer Kandidat.
- [x] **Haltepunkt:** Die Namen im bisherigen Stil werden vorgeschlagen, und der Nutzer genehmigt sie, bevor sie ins
      Spiel kommen. Die Genehmigung steht unter `## Comments`.
- [x] Die ersetzten Level sind samt Namen entfernt, und die Namen stehen auf der Liste der entfernten Namen.
- [x] Auf der Duldungsliste steht kein leichtes Level mehr. Ist dieses Ticket das letzte der Tickets 23–26, ist die
      Liste leer, und der Test verlangt ab jetzt eine leere Liste.
- [x] Die Regel „dieselbe Haupt-Kernidee höchstens zweimal je 10 Level“ bleibt erfüllt.
- [x] Alle Tests sind grün. Stichproben der Screenshots sind geprüft.

## Comments

**Hinweis aus Ticket 15 (16.10.2026, Review):** Die Duldungsliste steht jetzt nach Grund getrennt in
`tools/levelliste.json`. In „leicht“ stehen 6 Level darauf, alle mit Ausschlussgrund (Scheinmischung): Begegnung,
Auslese, Labyrinth, Doppelpass, Seitenlicht und Lichtbündel (heute leicht statt mittel). Kernidee und Mindest-Spielwert
gelten erst ab „mittel“. Die Endbedingung „Liste leer“ hängt vom Entscheid des Nutzers nach Ticket 16 über die 52 Level
ab, die nur wegen Kernidee oder Spielwert auf der Liste stehen (Spec, Phase 6).
Vor dem ersten Entfernen: `inHeutigerReihenfolge()` wirft, sobald ein Level der heutigen Reihenfolge fehlt (Ticket 15,
„Hinweise für Folgetickets“).

**Hinweis aus Ticket 16 (17.10.2026):** Nach den KI-Testern ist „leicht“ die Plätze 1–31; darauf stehen dieselben 6
Level mit Ausschlussgrund (Scheinmischung) auf der Duldungsliste, keines nur wegen Kernidee oder Spielwert (die
gelten in „leicht“ nicht). 17 Weichen und 32 Streulicht sind nach „mittel“ gewechselt, 41 Schliff nach „leicht“. Über
die 50 Level ohne Ausschlussgrund in den übrigen Graden entscheidet der Nutzer erst, nachdem der Spielwert in
„mittel“ angesehen ist (Ticket 16, Hinweis in Ticket 24); davon hängt die Endbedingung „Liste leer“ ab.

**Hinweis aus Ticket 20 (Generator):**
- Der Auftrag nimmt eine Ziel-Schwierigkeit an: `generiere({ grad: 'leicht', kernidee, seed, feldform,
  schwierigkeit: [33, 43] })`. Im Test liefert das ohne Kernidee 26 von 30 Seeds, alle in 33–43.
- „leicht“ ist gegenüber Ticket 18 bitgleich.
- Die Kommandozeile `tools/generiere.mjs` kennt die Ziel-Schwierigkeit noch nicht. Für den Austausch ein kleines
  Skript oder eine Option `--schwierigkeit`.

**Entscheid des Nutzers zur Haupt-Kernidee (17.10.2026, aus dem Review von Ticket 19):** Der Generator bleibt bei der
Auslegung aus Ticket 18 und 19: Die verlangte Kernidee ist unter den nötigen, weitere dürfen dazukommen. Die strengere
Regel „die verlangte Kernidee ist die Haupt-Kernidee“ kommt erst mit dem Austausch, als Wahl im Auftrag, wo die Regel
„dieselbe Haupt-Kernidee höchstens zweimal je 10 Level“ sie braucht. Gemessen in Ticket 19: Die verlangte ist fast
immer auch die Haupt-Kernidee; Ausnahme 11 von 807 Sammelstellen-Leveln mit Haupt-Kernidee Abschalten.

**Stufe A (18.10.2026): Kandidaten und Lauf `ersatz-leicht-1` vorbereitet.**
- **5 oder 6 Level:** Massgebend ist `tools/levelliste.json` nach den Tickets 15 und 16. Dort stehen in „leicht“
  (Plätze 1–31) 6 Level, alle nur mit Ausschlussgrund (Scheinmischung): 12 Begegnung, 18 Auslese, 20 Labyrinth,
  24 Doppelpass, 26 Seitenlicht, 29 Lichtbündel (Plätze im Spiel). Die Zahl 5 und die Plätze 15, 19, 20, 26, 29 im Kopf
  des Tickets sind heutige Plätze der Neuzählung mit den vorläufigen Graden (leicht 1–30). Lichtbündel stand dort auf
  dem heutigen Platz 31, also in „mittel“, und ist seit Ticket 15 „leicht“ (Formel 30). Ticket 24 nennt es darum noch
  unter „mittel“ (31); dort entfällt es. Ersetzt werden hier alle 6.
- **Lücken:** Jeder Ersatz bekommt als Ziel-Schwierigkeit die Lücke zwischen den Nachbarn des ersetzten Levels nach der
  Schwierigkeit (Rang der Formel). So bekommt er denselben Platz der Formel, und kein anderes Level verschiebt sich:
  Begegnung 29,5–32,9, Auslese 35,4–36,65, Labyrinth 36,7–37,5, Doppelpass 39,1–41,2, Seitenlicht 41,3–41,8,
  Lichtbündel 42,4–42,95 (unter „mittel“ ab 43).
- **Kandidaten:** `generiere.mjs` mit der neuen Option `--schwierigkeit`, je Lücke alle sieben Aufträge von „leicht“
  (bis 40 Level aus 2000 Seeds; Lockvogel liefert in „leicht“ nichts, Farben abzählen nur in der ersten Lücke). Gewählt
  je Lücke ein Kandidat und ein Ersatz mit anderer Haupt-Kernidee, nach Spielwert, Lesbarkeit des Felds und
  Abwechslung. Die Haupt-Kernidee kommt aus der Beurteilung (`hauptKernidee`): „leicht“ verlangt keine Kernidee, eine
  Wahl „verlangte = Haupt-Kernidee“ im Auftrag braucht es hier nicht. Auf 21–30 haben Zusammenfluss und Spiegelbild
  schon zweimal Mischziel aus zwei Quellen, dort also keines; je Seite kann keine Wahl aus Kandidat und Ersatz eine
  Haupt-Kernidee dreimal bringen.
- **Platz nach der Formel** (`ordne-level.mjs --austausch`, je ein Lauf mit den Kandidaten und mit den Ersatzleveln):
  Jeder kommt auf den Platz des ersetzten Levels, kein anderes Level ändert Platz, Formel oder Grad, die Prüfliste
  bleibt. „leicht“ hat danach kein Level auf der Duldungsliste (84 statt 90), die Haupt-Kernidee ist ohne die
  Duldungsliste je 10 Level eingehalten, das Mittel je 10 Level 25,1 34,5 41,2 … (mit den Ersatzleveln 34,2 41,1).
- **Werkzeuge** (klein, mit Test):
  - `tools/levelliste.mjs`: `imSpiel()` (heutige Level, dann die neuen ohne heutigen Platz), `ordne()` und
    `reihenfolge()` mit `heute` und `kandidat`: ein neues Level wandert nicht und steht nach der Formel; Urteile aus
    Läufen `ersatz-…` (`ERSATZ_LAEUFE`, zählen jetzt mit) gelten nur für neue Level, über den Namen „Kandidat
    <Abdruck>“; die Korrektur wie am Platz der Formel; lehnen beide ab, kommt es nicht ins Spiel.
  - `tools/leveldaten.mjs` (neu): `levelCode` (Block für LEVELS), `abdruck`/`kandidatName`, `seiteMitLeveln`.
  - `tools/ordne-level.mjs`: `--austausch`, mit `--schreiben` Einsetzen und Entfernen (erst Stufe C).
  - `tools/ki-tester/prepare.mjs --kandidaten`, `shots.mjs` mit wählbarer Seite: Die Bilder der Kandidaten kommen von
    einer Kopie von index.html mit den Kandidaten am Ende von LEVELS (ausserhalb von `eingabe/`).
  - Für Stufe C vorbereitet: `inHeutigerReihenfolge()` nimmt ein entferntes Level aus der festen Kopie
    `tools/beurteilung/entfernte-level.json`; die Eichmenge des Spielwerts lässt die neuen Level aus.
- **Kandidaten** (Kandidat / Ersatz; Auftrag, Seed, Schwierigkeit, Haupt-Kernidee; alle mit Spielplatz des ersetzten
  Levels, Lichtbündel Formel 30, Platz 29; nachzubauen mit `generiere.mjs <auftrag> --seed S --anzahl 1
  --schwierigkeit VON,BIS`):

  | ersetzt | Kandidat | Ersatz |
  |---|---|---|
  | 12 Begegnung | 1b8f9d78: leicht, 89; 32,55; Mischziel aus zwei Quellen (Kombinator) | 6fc545fb: leicht-sammelstelle, 97; 30,49; Sammelstelle |
  | 18 Auslese | a52f4787: leicht, 160; 35,96; Abschalten | fefccef3: leicht-sammelstelle, 33; 35,61; Sammelstelle |
  | 20 Labyrinth | 58b938f2: leicht-falle, 113; 37,40; Falle | c06a4a7b: leicht-abschalten, 1435; 37,09; Abschalten |
  | 24 Doppelpass | 2dabfc25: leicht-sammelstelle, 114; 39,82; Sammelstelle | 95c47469: leicht-falle, 464; 39,58; Falle |
  | 26 Seitenlicht | ecc56896: leicht, 1710; 41,77; Abschalten | 67a28862: leicht-sammelstelle, 362; 41,77; Sammelstelle (Kombinator) |
  | 29 Lichtbündel | 19c8ae2e: leicht-falle, 525; 42,88; Falle | 1a39b397: leicht-sammelstelle, 169; 42,72; Abschalten |

- **Lauf `ersatz-leicht-1`** (Ablauf 2, Fingerabdruck unverändert `066a880667331a43`), alle 12 auf einmal, ohne
  `--anker`: `prepare.mjs ersatz-leicht-1 --kandidaten <Ausgabe von ordne-level --json beider Läufe>`. Referenz je
  Kandidat der Platz der Formel mit dem Grad dort (leicht 1–31). 40 Aufnahmen mit `LEISE_CPU=65`, 23,7 s je Aufnahme
  (die Anker neu, weil sich `shots.mjs` geändert hat). Die KI-Tester startet der Koordinator.
- **Tests** (über `leise.sh`): `levelliste.test.mjs` 33 (vorher 28), `ki-tester.test.mjs` 64 (vorher 62),
  `beurteilung.test.mjs` 177, alle grün; `ordne-level.mjs` ohne Austausch gibt dieselbe Reihenfolge, dieselben Listen
  und dieselbe Ausgabe je Level wie vorher.

**Stufe B (18.10.2026): Urteile der KI-Tester, Wahl je Lücke, Namensvorschläge.**
- Ticket 21 ist vorher hereingemergt (`43d93c4`; Konflikte nur in README und im Kopf von `tests/levelliste.test.mjs`).
  Danach grün: `levelliste.test.mjs` 35, `ki-tester.test.mjs` 64, `logic.test.mjs` 548, `golden.mjs`.
- **Auslegungen aus Stufe A** vom Koordinator bestätigt (18.10.2026): Name „Kandidat <Abdruck>“ im Protokoll,
  Korrektur vom Platz der Formel aus, ein von beiden abgelehntes neues Level kommt nicht ins Spiel, die entfernten
  Level bleiben als feste Kopie der Massstab der Eichung, neue Level kommen nicht in die Eichmenge.
- **Lauf `ersatz-leicht-1`** zusammengeführt (`merge.mjs`, 12 Einträge, Ablauf 2; Protokoll jetzt 118 Einträge, Test
  grün). Beide KI-Tester (`general-purpose`, `claude-opus-5-5`) nennen nur „Zerfall“, beide bei 5 Kandidaten (1b8f9d78,
  58b938f2, 19c8ae2e, 95c47469, 1a39b397); Zerfall gilt erst ab „mittel“, also ist keiner abgelehnt. Einordnung
  zwischen A1-A2 und A3, Gefühl 3–5.
- **Wahl je Lücke** (Platz nach `ordne-level.mjs --austausch` mit den Urteilen; Gefühl, Einordnung und Aha je A/B):

  | Lücke | gewählt | Platz | Schwierigkeit | Haupt-Kernidee | Gefühl | Einordnung | Aha | Begründung |
  |---|---|---:|---:|---|---|---|---|---|
  | Begegnung | 6fc545fb (Ersatz) | 12 | 30,49 | Sammelstelle | 4/4 | A1-A2/A1-A2 | ja/ja | Kandidat 1b8f9d78 nur 3/3, Aha ja/nein, beide Zerfall („zwei getrennte Teile, ohne Überraschung“) |
  | Auslese | fefccef3 (Ersatz) | 18 | 35,61 | Sammelstelle | 4/4 | A1-A2/A2 | ja/ja | gleich gut wie a52f4787 (4/4, ja/ja), passt aber nach beiden auf den Platz; a52f4787 käme +5 und brächte auf 21–30 dreimal Abschalten |
  | Labyrinth | c06a4a7b (Ersatz) | 25 (+5) | 37,09 | Abschalten | 5/4 | A2-A3/A3 | ja/ja | Kandidat 58b938f2 nur 4/3, beide Zerfall („geradlinig“); der Ersatz „schöne Kette aus Folgerungen“ |
  | Doppelpass | 2dabfc25 | 23 | 39,82 | Sammelstelle | 4/4 | A1-A2/A2 | ja/ja | Kandidat |
  | Seitenlicht | ecc56896 | 27 (+3) | 41,77 | Abschalten | 4/4 | A2-A3/A2-A3 | ja/ja | Kandidat |
  | Lichtbündel | 19c8ae2e | 31 | 42,88 | Falle | 4/4 | A2-A3/A3 | ja/ja | Kandidat; beide nennen Zerfall (gilt nicht in „leicht“) |

  Mit dieser Wahl: alle 31 leichten Level auf 1–31, kein leichtes Level auf der Duldungsliste (84), die Haupt-Kernidee
  ohne die Duldungsliste je 10 Level eingehalten (11–20: Sammelstelle 2; 21–30: Abschalten 2, Mischziel aus zwei
  Quellen 2, Sammelstelle 1), keine neuen Züge der Häufungsregel, das Mittel je 10 Level 25,1 34,2 41,0 45,5 …,
  kleinster Schritt −0,34 wie vorher. Gegenprobe mit a52f4787 statt fefccef3: dreimal Abschalten auf 21–30, die
  Häufungsregel zöge a52f4787 von 22 auf 20 zurück, gegen die Einordnung der KI-Tester.
- **Namensvorschläge** (je 2–3, der erste bevorzugt; keiner im Spiel oder unter den entfernten Namen, geprüft):
  - 12, 6fc545fb: **Sammellinse** (ein Prisma sammelt Gelb und Blau aus zwei Quellen, wie eine Linse Licht
    sammelt), Farbtrichter, Eckenlicht (Rot läuft über zwei Spiegel um die Ecke).
  - 18, fefccef3: **Strahlteiler** (das linke Prisma teilt Magenta und schickt Grün diagonal weiter; Begriff der
    Optik), Dreiklang (drei Quellen, drei Ziele), Farbwaage (wer liefert Grün: das nahe oder das ferne Prisma).
  - 23, 2dabfc25: **Amethyst** (violetter Stein für das Magenta-Ziel, wie Rubin, Saphir, Smaragd), Purpur,
    Farbtreff (Blau und Rot aus zwei Quellen treffen sich).
  - 25, c06a4a7b: **Fackellauf** (das gelbe Ziel gibt sein Licht ab, eine zweite Quelle übernimmt wie bei einer
    Staffel), Ablösung, Gelbphase.
  - 27, ecc56896: **Fernlicht** (das zweite Rot kommt von der fernen Quelle über die lange Diagonale), Schräglicht,
    Weitblick.
  - 31, 19c8ae2e: **Blitz** (Rot im Zickzack über zwei senkrechte Spiegel in die Ecke), Blitzlicht, Slalom.
  Die Genehmigung des Nutzers folgt hier.


**Genehmigung des Nutzers (18.10.2026, über den Koordinator):** Alle Favoriten gelten, auch die Wahl auf Platz 18
(Ersatz fefccef3 statt a52f4787): Sammellinse, Strahlteiler, Amethyst, Fackellauf, Fernlicht, Blitz.

**Abschluss Stufe C (18.10.2026).**
- **Eingesetzt** mit `ordne-level.mjs --austausch <genehmigte Datei> --schreiben` (je Eintrag `ersetzt`, `name`,
  `auftrag`, `seed`, `schwierigkeit`, `level`); ein zweiter Lauf ohne `--austausch` meldet „Reihenfolge und Grade
  stimmen“ und „Duldungsliste und Prüfliste stimmen“.

  | Platz | neu | ersetzt | Schwierigkeit | Haupt-Kernidee | Herkunft (Auftrag, Seed, Ziel) | KI-Tester (Gefühl, Einordnung) |
  |---:|---|---|---:|---|---|---|
  | 12 | Sammellinse | Begegnung | 30,5 | Sammelstelle | leicht-sammelstelle, 97, 29,5–32,9 | 4/4, A1-A2/A1-A2 |
  | 18 | Strahlteiler | Auslese | 35,6 | Sammelstelle | leicht-sammelstelle, 33, 35,4–36,65 | 4/4, A1-A2/A2 |
  | 23 | Amethyst | Doppelpass | 39,8 | Sammelstelle | leicht-sammelstelle, 114, 39,1–41,2 | 4/4, A1-A2/A2 |
  | 25 | Fackellauf | Labyrinth | 37,1 | Abschalten | leicht-abschalten, 1435, 36,7–37,5 | 5/4, A2-A3/A3 (+5) |
  | 27 | Fernlicht | Seitenlicht | 41,8 | Abschalten | leicht, 1710, 41,3–41,8 | 4/4, A2-A3/A2-A3 (+3) |
  | 31 | Blitz | Lichtbündel | 42,9 | Falle | leicht-falle, 525, 42,4–42,95 | 4/4, A2-A3/A3 |

  - Jeder Block in `index.html` hat den Lösungskommentar wie die übrigen und eine Zeile Herkunft („Generator
    <Auftrag>, Seed S, Ziel VON–BIS · ersetzt … (Austausch „leicht“)“, seit M1 aus dem Review mit der
    Ziel-Schwierigkeit); die alte Zeile „Wertung …“ gibt es für neue Level nicht.
  - Die Abdrücke der Level im Spiel sind die der beurteilten Kandidaten; über sie findet die Levelliste die Urteile aus
    `ersatz-leicht-1`.
- **Entfernt:** Begegnung, Auslese, Doppelpass, Labyrinth, Seitenlicht und Lichtbündel. Ihre Namen stehen auf
  `entfernteNamen` in `tools/levelliste.json`, ihre Leveldaten als feste Kopie in
  `tools/beurteilung/entfernte-level.json`. Damit bleiben Eichung, Eichmenge und die Tests der Beurteilung an den 150
  der heutigen Reihenfolge gleich (`beurteilung.test.mjs` unverändert grün).
- **Duldungsliste:** 84 Level (vorher 90), Ausschlussgrund 31 (vorher 37); leicht 0 von 31. Neu im Test der
  Levelliste: „Nach dem Austausch steht kein Level aus leicht auf der Duldungsliste“ (`AUSGETAUSCHT`, die Tickets
  24–26 ergänzen ihren Grad). Nicht das letzte der Tickets 23–26, die Liste ist also nicht leer.
- **Regeln:**
  - Grad sinkt nie; leicht bleibt 1–31.
  - Haupt-Kernidee ohne die Duldungsliste je 10 Level eingehalten: 11–20 Sammelstelle 2; 21–30 Abschalten 2,
    Mischziel aus zwei Quellen 2, Sammelstelle 1. Häufungsregel nur mit den zwei Zügen aus Ticket 16.
  - Mittel je 10 Level 25,1 34,2 41,0 45,5 …, kleinster Schritt −0,34 (wie vorher).
  - Prüfliste unverändert (51, erledigt).
  - Durch die Korrekturen der neuen Level rücken 7 heutige leichte Level um einen Platz nach vorn (Farbkreis,
    Brechpunkt, Querschläger, Farbspiel, Facette, Spiegelbild, Schliff); ihre Formel und ihr Grad bleiben.
- **Tests** (über `leise.sh`, `LEISE_CPU=65`):
  - `levelliste.test.mjs` 36 grün, darunter: 6 neue Level mit Urteil aus `ersatz-leicht-1`, keines abgelehnt;
    entfernte Level mit Namen und Kopie; kein umbenanntes Level; keine fremde Filterfarbe; kein leichtes Level auf
    der Duldungsliste.
  - `ki-tester.test.mjs` 64, `logic.test.mjs` 548, `beurteilung.test.mjs` 177, `generator.test.mjs` 25: alle grün.
  - `golden.mjs`: wie erwartet 12 Abweichungen, nur die 6 entfernten und die 6 neuen Namen; alle übrigen 153 Level
    sind wie in `golden.json`. Die Referenz schreibt der Koordinator nach dem Merge neu (`--write`), `golden.json` ist
    hier nicht angefasst.
- **Screenshots** (Stichproben, ohne Meldungen in der Konsole):
  - Levelauswahl 11–20 und 21–30 (Desktop) mit den neuen Namen und „Leicht“ im Seitentitel; 31–40 (Handy) gemischt,
    ohne Grad im Titel wie vorher.
  - Alle sechs neuen Level auf Desktop und Handy mit Kopfzeile wie im Spiel (`tests/output/t23-level/`), etwa
    25 Fackellauf und 31 Blitz: Name, ●○○○ Leicht, Ziele, Strahlen der Startstellung.
- **Abweichungen:**
  - 6 statt 5 Level (oben, Stufe A).
  - Für Begegnung, Auslese und Labyrinth kamen Ersatzlevel statt der Kandidaten (Sammellinse, Strahlteiler,
    Fackellauf); Begründung bei Stufe B.
  - Eine Wahl „verlangte = Haupt-Kernidee“ im Auftrag war nicht nötig.
  - Hinweise für 24–26 stehen dort unter `## Comments`.

**Review (18.10.2026).** Geprüft wurde `git diff 43d93c4 HEAD` (Stufen A–C), nachgerechnet in Kopien ausserhalb des
Repos.
- **Austausch:** Die sechs neuen Level stehen mit den genehmigten Namen auf ihren Plätzen: 12 Sammellinse,
  18 Strahlteiler, 23 Amethyst, 25 Fackellauf, 27 Fernlicht und 31 Blitz, alle „leicht“.
  - Jedes ist bitgenau der beurteilte Kandidat: Elemente samt Reihenfolge und Lösung gleichen dem Kandidaten auf der
    Seite des Laufs (`ersatz-leicht-1/seite/index.html`), und der Abdruck stimmt mit dem Protokoll überein.
  - Haupt-Kernidee, Schwierigkeit und Platz entsprechen der Tabelle von Stufe C.
  - Die sechs alten Level fehlen im Spiel, und ihre Namen stehen auf `entfernteNamen`. Ihre Kopie in
    `entfernte-level.json` ist als JSON gleich den Leveldaten in `43d93c4`.
  - Die übrigen 144 Level und das Tutorial sind unverändert, ebenso ihre Reihenfolge untereinander.
- **Reihenfolge:**
  - Auf dem Stand von Stufe B (index.html und levelliste.json aus `6fb6d2c`, ohne `entfernte-level.json`) lief
    `ordne-level.mjs --austausch … --schreiben` mit den Werkzeugen von HEAD. Die Austausch-Datei ist mit
    `generiere.mjs` neu gebaut. Das Ergebnis sind genau index.html, levelliste.json und `entfernte-level.json` von
    HEAD; es braucht also keinen Handeingriff mehr.
  - Ein zweiter Lauf mit `--schreiben` meldet „stimmen“ und ändert nichts.
  - Die 7 heutigen leichten Level rücken wie berichtet einen Platz vor: Farbkreis, Brechpunkt, Querschläger,
    Farbspiel, Facette, Spiegelbild und Schliff. Das folgt aus der Regel `korrigiere` mit den Korrekturen von
    Fackellauf (+5) und Fernlicht (+3), die vor denen von Spiegelbild und Schliff angewandt werden.
  - Die Haupt-Kernidee ist ohne die Duldungsliste eingehalten: auf 11–20 Sammelstelle 2, auf 21–30 Abschalten 2,
    Mischziel aus zwei Quellen 2 und Sammelstelle 1.
  - Das Mittel je 10 Level ist 25,1 34,2 41,0 45,5 …, der kleinste Schritt −0,34. Die Häufungsregel macht nur die
    zwei Züge aus Ticket 16.
- **Duldungsliste und Eichung:**
  - Auf der Duldungsliste stehen 84 Level (leicht 0 von 31), davon 31 mit Ausschlussgrund.
  - Die Eichung bleibt gleich: `inHeutigerReihenfolge()` und `eichmenge()` liefern auf HEAD dasselbe JSON wie auf
    `43d93c4`.
  - Gegenproben zum neuen Test „kein Level aus leicht auf der Duldungsliste“:
    - Mit Zickzack auf der Duldungsliste wird er rot.
    - Auf dem Stand von Stufe B wird nur er rot, mit den sechs alten Leveln; die übrigen 35 Tests bleiben grün.
- **KI-Tester:** Die 12 Einträge von `ersatz-leicht-1` sind genau `entry()` aus `lauf.json` und den beiden Antworten,
  wie `merge.mjs` sie erzeugt.
  - Genannt wurde nur „Zerfall“, und das gilt in „leicht“ nicht. Kein Kandidat ist abgelehnt.
  - Die Referenzen (Platz der Formel) sind dieselben wie im Spiel, also auch die Korrektur.
- **Golden:** 12 Abweichungen, nur die sechs fehlenden und die sechs neuen Namen; die übrigen 153 Level sind gleich.
  `golden.json` ist nicht angefasst.
- **Werkzeuge:**
  - `generiere.mjs --schwierigkeit` baut mit den Lücken aus Stufe A alle sechs Level nach, auch mit dem Generator von
    Ticket 28 (`9a34b5b`).
  - Geprüft sind auch `prepare.mjs --kandidaten`, die Seite mit den Kandidaten und `shots.mjs` mit wählbarer Seite: Das
    Bild L4 des Laufs zeigt das spätere Strahlteiler.
  - Es gibt keinen doppelten Code mit `tools/generator/` oder `tools/beurteilung/`, und kein Werkzeug rechnet
    Schwierigkeit oder Wertung selbst.
- **Screenshots:** Geprüft sind die Levelauswahl 21–30 (Desktop, mit „Leicht“ im Titel und den neuen Namen) und 31–40
  (Handy), dazu 18 Strahlteiler und 25 Fackellauf (Desktop) sowie 31 Blitz (Handy). Kopfzeile, Grad und Ziele sind
  wie im Spiel.
- **Selbst behoben (klein):**
  - `ordne-level.mjs`: Die Zeile „Prüfliste … mit Urteil der KI-Tester“ zählte die Urteile der neuen Level mit
    (57 statt 51). Der Kopf nennt jetzt auch die Läufe `ersatz-…` (`4996e50`).
  - ADR 0001 ist ergänzt: Entfernte Level bleiben als feste Kopie Teil des Massstabs (`5b4657a`).
- **Offen, M1 (mittel): Die Herkunftszeile reicht nicht zum Nachbauen.**
  - **Wo:** `tools/ordne-level.mjs`, in `schreibeLevels` (Zeile mit `herkunft`) und in `ladeAustausch`; die sechs
    Zeilen „Generator … · ersetzt …“ in index.html (1134, 1255, 1357, 1396, 1437, 1524); README zu `--austausch`;
    Schritt 2 der Hinweise in 24–26.
  - **Fehler:** `generiere.mjs leicht-abschalten --seed 1435 --anzahl 1` liefert 6c49fce4 (Schwierigkeit 20,1) statt
    Fackellauf. Ebenso entstehen für Amethyst (Seed 114) 3583a7a8 und für Blitz (Seed 525) 355659ec. Das Level im Spiel
    entsteht nur mit der Ziel-Schwierigkeit der Lücke, und die steht nur in Stufe A dieses Tickets.
  - **Erwartet:** Die Herkunft nennt Auftrag, Seed und Ziel-Schwierigkeit, etwa „Generator leicht-abschalten, Seed 1435,
    Ziel 36,7–37,5 · ersetzt Labyrinth (Austausch „leicht“)“.
  - **Vorschlag:** Den Eintrag der Austausch-Datei um ein wahlweises `schwierigkeit: [von, bis]` ergänzen,
    `ladeAustausch` prüft es und übernimmt es, und die Herkunft gibt es aus. Die sechs Zeilen in index.html mit den
    Lücken aus Stufe A angleichen (29,5–32,9 · 35,4–36,65 · 39,1–41,2 · 36,7–37,5 · 41,3–41,8 · 42,4–42,95, in der
    Reihenfolge Sammellinse, Strahlteiler, Amethyst, Fackellauf, Fernlicht, Blitz). README, die Hinweise in 24–26 und
    die Spalte „Herkunft“ von Stufe C nachführen.
  - **Behoben, wenn:**
    - Für jedes der sechs Level ergibt `generiere.mjs <auftrag> --seed S --anzahl 1 --seeds 1 --schwierigkeit VON,BIS`
      mit den Werten der Herkunftszeile denselben Abdruck wie das Level im Spiel.
    - `--austausch … --schreiben` ergibt auf dem Stand von Stufe B wieder genau HEAD, und ein zweiter Lauf meldet
      „stimmen“.
- **Hinweis, keine Änderung:** Die genehmigten Namen Strahlteiler und Sammellinse heissen wie Mechaniken, die die Spec
  ausdrücklich nicht vorsieht („Nicht Teil dieser Spec“). Es sind nur Namen.
- **Tests** (über `leise.sh`, `LEISE_CPU=65`): Golden hat wie erwartet 12 Abweichungen. Grün sind logic 548,
  generator 25, beurteilung 177, levelliste 36, ki-tester 64 und offline.
- **Urteil:** Bereit zum Mergen, sobald M1 behoben ist. M1 betrifft nur Kommentare und das Format der Austausch-Datei;
  Leveldaten, Reihenfolge und Duldungsliste sind korrekt.

**M1 behoben (18.10.2026).**
- Ein Eintrag der Austausch-Datei hat jetzt wahlweise `schwierigkeit: [von, bis]`. `ladeAustausch` in
  `tools/ordne-level.mjs` prüft und übernimmt es, und die Herkunftszeile nennt Auftrag, Seed und Ziel, etwa
  „Generator leicht-abschalten, Seed 1435, Ziel 36,7–37,5 · ersetzt Labyrinth (Austausch „leicht“)“.
- Die sechs Zeilen in index.html kommen aus dem Werkzeug, nicht von Hand: Auf dem Stand von Stufe B (index.html und
  levelliste.json aus `6fb6d2c`) lief `ordne-level.mjs --austausch … --schreiben` mit der ergänzten Austausch-Datei.
  - Gegenüber dem vorigen Stand ändern sich nur diese sechs Kommentarzeilen; levelliste.json und
    `entfernte-level.json` sind gleich.
  - Ein zweiter Lauf meldet „stimmen“.
- Nachgebaut: Für alle sechs Level ergibt `generiere.mjs <auftrag> --seed S --anzahl 1 --seeds 1 --schwierigkeit
  VON,BIS` mit den Werten der Herkunftszeile denselben Abdruck wie das Level im Spiel (6 von 6).
- Neuer Test in `tests/levelliste.test.mjs`: Jedes neue Level hat diese Herkunftszeile mit der Ziel-Schwierigkeit.
- Nachgeführt: README zu `--austausch`, Schritt 2 der Hinweise in den Tickets 24–26 und die Spalte „Herkunft“ der
  Tabelle von Stufe C.
