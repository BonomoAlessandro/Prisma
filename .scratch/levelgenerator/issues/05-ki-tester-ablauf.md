# 05: Ablauf der KI-Tester

**What to build:** Ein wiederholbarer Ablauf, in dem zwei KI-Tester Level aus Spielersicht beurteilen, dazu ein
versioniertes Protokoll ihrer Urteile (ADR 0002). Die Tester beurteilen, was der Code schlecht sieht: Aha-Moment,
Lesbarkeit und Gefühl. Ticket 13 eicht an ihren Urteilen den Spielwert, die Tickets 16 und 23–26 prüfen damit die
Reihenfolge und die Ersatzlevel.

**Spec:** ../spec.md, Abschnitt „KI-Tester“.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Zwei Tester urteilen unabhängig voneinander. Jeder bekommt das Feld als Text und Screenshots der Startstellung
      auf Desktop und Handy.
- [x] Als Anker dienen je zwei feste Level pro Schwierigkeitsgrad. Die Grade gelten vorläufig: leicht 1–30, mittel
      31–100, schwer 101–140, sehr schwer 141–150. Kein Anker steht auf der Duldungsliste der Spec.
- [x] Jeder Tester antwortet in festen JSON-Feldern:
      - Aha-Moment ja oder nein, mit Beschreibung
      - Lesbarkeit
      - Gefühl (Spass) von 1 bis 5
      - Einordnung zwischen den Ankern
      - Ablehnung mit einem Begriff aus dem Glossar, oder keine
- [x] Die Urteile werden nach festen Regeln zusammengeführt: abgelehnt nur, wenn beide ablehnen. Eine Korrektur der
      Position beträgt höchstens 5 Plätze und überschreitet nie eine Gradgrenze.
- [x] Jedes Urteil steht mit Datum, Version des Ablaufs und Begründung im versionierten Protokoll.
- [x] Ein Test prüft das Protokoll: Schema, Grenzen der Korrekturen und Ablehnung nur gemeinsam.
- [x] Ein Probelauf auf den Ankern und drei weiteren Leveln liegt im Protokoll.
- [x] Die Screenshots entstehen über die gedeckelte Umgebung, nacheinander.

## Comments

**Abschluss 16.10.2026.** Ablauf und Werkzeuge stehen, Probelauf 2 liegt im Protokoll (Version 1, 11 Einträge).
Bedienung und Regeln im README, Abschnitt „KI-Tester“. Darunter folgen die Nachbesserung nach dem Review und der
nachgeführte Stand vom 15.10.

**Probelauf 2** (`probelauf-2`): Beide KI-Tester liefen als eigene KI-Agenten mit frischem Kontext
(`claude-opus-5-5`, `general-purpose`). Keiner lehnte einen Anker ab, alle Anker ordneten sich bei sich selbst ein.

| Level | Platz | Gefühl A/B | Desktop A/B | Handy A/B | Einordnung A/B | Ablehnung A/B | Ergebnis |
|---|---:|---|---|---|---|---|---|
| A1 Schleuse | 3 | 3/3 | 5/5 | 4/4 | A1/A1 | –/– | bleibt |
| A2 Brechpunkt | 30 | 4/3 | 4/5 | 4/4 | A2/A2 | –/– | bleibt |
| A3 Kreuzweg | 35 | 4/4 | 4/4 | 4/4 | A3/A3 | –/– | bleibt |
| A4 Farbverlauf | 94 | 4/4 | 4/4 | 3/4 | A4/A4 | –/– | bleibt |
| A5 Silberstreif | 103 | 4/4 | 4/4 | 4/4 | A5/A5 | –/– | bleibt |
| A6 Pulsar | 135 | 3/4 | 3/4 | 3/3 | A6/A6 | –/– | bleibt |
| A7 Morgenröte | 141 | 5/5 | 3/4 | 3/3 | A7/A7 | –/– | bleibt |
| A8 Sternenstaub | 148 | 4/5 | 4/4 | 3/3 | A8/A8 | –/– | bleibt |
| L1 Glasbläser | 83 | 3/3 | 4/4 | 3/3 | A2-A3/A3-A4 | –/– | bleibt (Wünsche −49/0) |
| L2 Halo | 125 | 4/4 | 4/3 | 3/3 | A5-A6/A5-A6 | –/– | bleibt |
| L3 Spiegelbild | 27 | 3/3 | 4/3 | 3/3 | A2-A3/A2-A3 | Zerfall/Zerfall | +3 → 30, an A2 vorbei |

- **L3 Spiegelbild:** Mit der neuen Vorlage nennen jetzt beide Zerfall. Der rote Teil links (Quelle (1,6), Spiegel
  (1,2), Prisma (0,2), rotes Ziel) hängt nicht am Rest; A nennt ihn „fast ein Füllteil“.
  - Im Grad „leicht“ zählt Zerfall nicht. Beide sehen das Level schwerer als A2, es geht darum an A2 vorbei auf
    Platz 30 (+3, an der Gradgrenze), und A2 rückt auf 29. Das ist der erste Fall der neuen Ankerregel.
  - Stuft Ticket 15 das Level als „mittel“ ein, ist es abgelehnt. Genau dafür verlangt die Vorlage die Begriffe
    unabhängig vom Grad (Muss 1 aus dem Review).
- **L1 Glasbläser:** Die KI-Tester sind sich uneinig, also bleibt es. A sieht es zwischen A2 und A3 (will −49),
  B zwischen A3 und A4. Beide nennen die lange Spiegelkette zum weissen Ziel eher Leitungsarbeit als Farblogik
  (Gefühl 3/3).
- **Einigkeit:**
  - Aha-Moment: in 10 von 11 Leveln gleich, nur bei A1 sieht B einen kleinen.
  - Gefühl: 8-mal gleich, 3-mal um 1 verschieden. Das Mittel ist 3,73 bei A und 3,82 bei B.
  - Lesbarkeit: auf dem Desktop 6-mal gleich, auf dem Handy 10-mal; sonst um 1 verschieden. Das Handy ist nie
    besser als der Desktop.
  - Einordnung der drei Level: zweimal gleich, einmal weit auseinander (L1).
- **Auffällig in den Begründungen:**
  - **Lesbarkeit**, wiederkehrend:
    - senkrechte Spiegel als dünne Stäbe (A2, A6, A7, A8, L1);
    - Ausgangsrichtung des Kombinators kaum zu sehen (A3, A7, L3);
    - Fächerrichtung eng stehender Prismen auf dem Handy (A7, A8, L2);
    - weisse Startstrahlen überstrahlen Spiegel (L3, beide);
    - kleine Filter, bei L1 ist der Grünfilter auf dem Handy kaum als Filter zu erkennen.
  - **A3 Kreuzweg:** B schreibt wieder, das Trennen und Wiedervereinen des Magentas „grenzt an eine Scheinmischung“.
  - **A7 Morgenröte:** Beide geben 5. Das zu Beginn erfüllte gelbe Ziel ist eine Falle.
  - **L2 Halo:** Beide finden die Mitte dicht; die Prismen in Spalte 3 verdecken sich teilweise.
- **Vergleich mit Probelauf 1:** Dieselben Bilder und Feldtexte, aber eine neue Vorlage und Regel; darum nennen jetzt
  beide bei L3 Zerfall.
- **Korrekturen aus Probeläufen** gelten in Ticket 15/16 nicht als Korrektur, sie zeigen nur den Ablauf.

**Nachbesserung nach dem Review (16.10.2026)**, Punkt für Punkt:
  1. **Ankerregel:** „Nie über einen Anker“ ist weg. Anker sind eine feste Auswahl, keine festen Plätze (Spec, User Story 43).
     Begründung unten unter „Regeln“, im README und im Kopf von `protocol.mjs`.
  2. **Eine Version 1:** `VERSIONS` und `fixedAnchors` sind aus Code und Tests entfernt. Es bleibt `VERSION = '1'`
     mit `FINGERPRINT`, und das Protokoll ist leer.
     - **Verworfen** sind die Zwischenstände Version 1 und 2 samt den 11 Einträgen aus `probelauf-1`.
     - **Warum:** Sie waren nie committet, kein versionierter Stand bezieht sich auf sie. Seither haben sich die Regel
       (Anker, Ablehnung als Liste) und die Eingaben (Auftrag, Glossar, Schema) geändert. Die Urteile gehören damit zu
       keiner gültigen Version. Schalter je Version hätten nur Zwischenstände getragen.
  3. **Füllteil und Zerfall:** Auftrag und Schema verlangen die Begriffe in jedem Grad. Ob sie zählen, entscheidet die
     Regel nach dem Grad der Referenz.
  4. **Fingerabdruck:** Er umfasst die Aufträge an beide KI-Tester, `anchors.json`, das Schema, das Glossar und
     `fieldText()` der 8 Anker samt Leveldaten (ohne Name und Markierung).
     - Die Aufträge rendert `brief()` in `protocol.mjs`, mit Lauf und Pfaden als Platzhalter. Die festen Zeilen der
       Listen „Anker“ und „Level“ stehen jetzt als Vorlagen am Schluss von `brief.md`.
     - **Mutanten** in einer Kopie ausserhalb des Repos, je eine Änderung: Alle 10 schlagen am Fingerabdruck an, die 3
       Gegenkontrollen nicht.

       | Mutant | Fingerabdruck |
       |---|---|
       | Legende im Feld (`field.mjs`) | rot |
       | Überschrift im Auftrag (`## Anker`) | rot |
       | Überschrift im Feld (`## Startstellung`) | rot |
       | Grad in der Ankerliste über `anchors.json` (A4 „schwer“) | rot, dazu der Ankertest |
       | Grad in der Ankerliste über die Zeilenvorlage (Grad weggelassen) | rot, dazu der Test des Auftrags |
       | Grad in der Ankerliste über den Code von `brief()` | rot, dazu der Test des Auftrags |
       | Startstellung eines Spiegels in A1 (`index.html`, Spiegel (3,3) rot 0 → 1) | rot |
       | Glossar: `_Vermeiden_`-Zeile bei Füllteil entfernt | rot, dazu der Glossartest |
       | Schema: Beschreibung von `gefuehl` | rot |
       | Zeile eines Ankers in der Levelliste | rot, dazu der Test des Auftrags |
       | Gegenkontrolle: ein Spiegel in Level 83 (kein Anker) | grün |
       | Gegenkontrolle: Kommentar in `protocol.mjs` | grün |
       | Gegenkontrolle: Markierung „schwer“ bei A1 | grün |
  5. **Glossar:** Die `_Vermeiden_`-Zeilen unter „Was Spass verdirbt“ bleiben, heute nur die bei Füllteil. Die übrigen
     sind Hinweise für Autoren und fallen weg. Der Auftrag erklärt, was die Zeile heisst.
  6. **Unabhängig und blind:**
     - Jeder KI-Tester hat einen eigenen Antwortordner, `antwort-A/` bzw. `antwort-B/`.
     - `lauf.json` und die Aufträge liegen ausserhalb von `eingabe/` und den Antwortordnern.
     - `AGENT` in `protocol.mjs` (`claude-opus-5-5`, `general-purpose`) steht in `lauf.json` und in jedem Eintrag
       (`agent`); der Test verlangt es.
     - Das README beschreibt den Start der KI-Agenten.
  7. **Ablehnung als Liste:** `ablehnung` ist eine Liste von Begriffen, leer für keine. Abgelehnt ist ein Level, wenn
     beide mindestens einen Begriff nennen, der beim Grad gilt. `gruende` sind alle geltenden Begriffe beider Listen.
     Beide Listen stehen in den Einzelurteilen und in der Begründung des Eintrags.
  8. **Tests:** 54 statt 47.
     - Jede Gegenprobe prüft die erwartete Meldung.
     - Neue Gegenproben: Gradgrenze 100/101 ohne Anker, Anker verschoben, abgelehnt und verschoben, Füllteil in einem
       leichten Level, Ablehnung als Begriff statt als Liste, ohne Modell.
     - Neu sind auch „Abgelehnt, also keine Verschiebung“, das Feld als Text unabhängig von Name und Markierung, das
       Glossar, der Auftrag und der Fingerabdruck. Die Testnamen folgen der neuen Regel.
     - **Testgetrieben:** Gegen den alten Stand liefen 31 der 54 Tests rot. Grün blieben die, deren Verhalten schon
       bestand, etwa „Abgelehnt, also keine Verschiebung“, das Feld ohne Name und Markierung und die Gegenprobe 100/101.
  9. **Probeläufe** zeigen nur den Ablauf. Ihre Korrekturen gelten in Ticket 15/16 nicht als Korrektur (README).
  10. **Optional, alles erledigt:**
      - Laufzeit einheitlich mit 26,6 s je Aufnahme;
      - „KI-Tester“ und „KI-Agent“ im README;
      - `reference` statt `ref` im Test, `signed` und `levelAt` nur noch in `protocol.mjs`, nur ein `endsWith('\n')`
        in `merge.mjs`;
      - Beispiel in `brief.md` mit „A2-A3“ (Plätze 31–34) statt „A3-A4“ (36–93).
  11. **Probelauf 2 vorbereitet** mit `prepare.mjs probelauf-2 27 83 125 --anker`:
      - Dieselben Level und Kennungen wie in Probelauf 1 (L1 83 Glasbläser, L2 125 Halo, L3 27 Spiegelbild), aber
        eine andere Reihenfolge.
      - Die Bilder sind neu aufgenommen, 22 Aufnahmen mit je 24,0 s ohne den Start von Chrome. Sie sind wie die 11
        Feldtexte byte-gleich mit `probelauf-1`. Anders ist nur das Schema (Ablehnung als Liste).
      - `merge.mjs --trocken` lief mit erfundenen Antworten in einem Wegwerf-Lauf durch. Das Protokoll blieb leer.
- **Tests** über `leise.sh`, nacheinander, alle grün:
  - `tests/ki-tester.test.mjs`: 54 Tests, 1,2 s, mit leerem Protokoll; nach Probelauf 2 mit 11 Einträgen grün,
    1,5 s;
  - `tests/golden.mjs`: 4,4 s;
  - `tests/logic.test.mjs`: 558 Tests, 29,5 s.

**Stand 15.10.2026, nachgeführt 16.10.**

**Gebaut:**
- `tools/ki-tester/`:
  - `protocol.mjs`: Version und Fingerabdruck, vorläufige Grade, Anker, Auftrag, Prüfung der Antworten, Zusammenführen,
    Prüfung des Protokolls.
  - `anchors.json`, `answer.schema.json`, `brief.md` (Auftrag samt Vorlagen der Zeilen).
  - `field.mjs` (Feld als Text), `shots.mjs` (Screenshots).
  - `prepare.mjs`, `merge.mjs`, `protocol.jsonl`.
- `tools/chrome.mjs`, herausgelöst aus `tests/screenshot.mjs`. `tests/ki-tester.test.mjs`.
- `index.html`:
  - Die Animationsschritte aus `frame` stehen in `animate(t, dt)`, als reine Verschiebung.
  - Dazu kommt der Debug-Schalter `__prismaDebug.settle(s)`. Er läuft nur mit `?t=`, und nur Tests rufen ihn auf.

**Anker:** Die Begründungen stehen in `anchors.json`. Gewählt nach vier Regeln:
- nicht auf der Duldungsliste und kein Grenzfall;
- nah am Rand des Grads;
- der Rang der alten Wertung liegt höchstens 7 Plätze vom Platz entfernt;
- zusammen decken die Anker alle Elemente ab.

| A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 |
|---|---|---|---|---|---|---|---|
| 3 Schleuse | 30 Brechpunkt | 35 Kreuzweg | 94 Farbverlauf | 103 Silberstreif | 135 Pulsar | 141 Morgenröte | 148 Sternenstaub |

**Regeln** (`protocol.mjs`):
- **Ablehnen:** Die KI-Tester nennen jeden zutreffenden Begriff, unabhängig vom Grad. Abgelehnt ist ein Level, wenn
  beide mindestens einen Begriff nennen, der beim Grad der Referenz gilt. Füllteil und Zerfall gelten erst ab „mittel“.
  Ein abgelehntes Level wird nicht verschoben.
- **Bereich einer Einordnung:**
  - „A3-A4“ heisst zwischen den beiden Ankern,
  - „A3“ heisst der Anker und seine Nachbarn,
  - „<A1“ und „>A8“ heissen davor bzw. dahinter.
- **Verschieben:**
  - Liegt der Platz ausserhalb des Bereichs, will ein KI-Tester bis an dessen Rand.
  - Verschoben wird nur, wenn beide in dieselbe Richtung wollen: um den kleineren Wunsch, höchstens 5 Plätze und nie
    über eine Gradgrenze.
- **Anker sind eine feste Auswahl, keine festen Plätze (Spec, User Story 43: „je zwei feste Anker pro Schwierigkeitsgrad“):**
  - Fest ist, welche Level die Anker sind. So meint „schwerer als A3“ für beide KI-Tester und in jedem Lauf dasselbe
    Level.
  - Ein Anker wird durch sein eigenes Urteil nie verschoben. Andere Level dürfen an ihm vorbei, er rückt dann um einen
    Platz und bleibt in seinem Grad. Beispiel: Wollen beide ein Level von Platz 27 hinter A2 (30), kommt es auf 30
    (+3, an der Gradgrenze), und A2 rückt auf 29.
  - Feste Plätze hiessen dagegen, dass ein Level vor einem Anker bleiben muss, obwohl beide KI-Tester es schwerer
    finden. Die Regel widerspräche dann beiden Urteilen.
  - Die Bereiche eines Laufs rechnen mit den Plätzen der Anker bei seiner Vorbereitung (`lauf.json`).
- **Später (Ticket 15/16):**
  - Die Referenz wird der Platz nach der Formel.
  - Ein Level geht nur dorthin, wenn dieser Platz für beide KI-Tester im Bereich liegt oder näher daran als der alte.
  - Von dort aus gilt dieselbe Korrektur.
  - Korrekturen aus Probeläufen zählen nicht, sie zeigen nur den Ablauf.

**Screenshots** (`shots.mjs`):
- **Ablauf je Level:**
  - neu laden mit `?t=12`,
  - `settle(6)`, zwei Bilder rendern, aufnehmen,
  - `settle(1)`, nochmals aufnehmen.
  - Gültig ist eine Aufnahme erst, wenn beide byte-gleich sind.
  - In der Kopfzeile steht nur die Kennung, ohne Nummer, Name und Grad.
- **Laufzeit:** 26,6 s je Aufnahme statt 150 s (Probelauf 1: 22 Aufnahmen, 11 Level × 2 Bildschirme, in 9 min 46 s).
  Alles über `leise.sh` mit 20 %, allein.
- **Belege:**
  - **Spiel ohne Schalter unverändert:** Der langsame Weg aus Ticket 03 (150 s) ist mit neuem `index.html` und neuem
    `screenshot.mjs` byte-gleich mit `t03-nachher2-*`, auf Desktop und Handy.
  - **Schneller Weg:** Er ergibt auf Level 141 dieselben Bytes.
  - **Wiederholbar:** `probelauf-1` und `t05-kontrolle` sind in allen 22 Bildern und 11 Texten byte-gleich.

**Probelauf 1** (15.10.): hinfällig mit den verworfenen Versionen 1 und 2. Er zeigte, dass der Ablauf trägt; die
Gründe zur Lesbarkeit kehrten in Probelauf 2 wieder.

**Abweichungen vom Ticket:**
- `index.html` hat den Debug-Schalter `settle` bekommen. Der Beleg, dass das Spiel ohne Schalter gleich bleibt, steht
  oben.
- `tests/screenshot.mjs` nutzt jetzt `tools/chrome.mjs`.
- Die Ablehnung ist eine Liste von Begriffen statt eines einzelnen (Entscheid aus dem Review).

**Offen:**
- **Grad „mittel“ ist grob:** Zwischen A3 (35) und A4 (94) liegen 58 Plätze. In Probelauf 2 lag L1 (83) für B
  darin, für A davor (−49). Vor Ticket 16 entscheiden, ob eine feinere Angabe nötig ist, etwa das Drittel im Bereich
  (neue Version).
- **L3 Spiegelbild in Ticket 15:** Beide KI-Tester nennen Zerfall. Kommt das Level in „mittel“, ist es abgelehnt.
- **Duldungsliste im Test:** Sie und die Grenzfälle stehen dort als Konstante nach der Spec. Ab Ticket 15 aus dem Code
  nehmen.
- **Nächste Version:** Es gibt nur Version 1, und der Test verlangt sie in jedem Eintrag. Kommt Version 2, braucht es
  eine Regel, wie ältere Einträge geprüft werden.
- **Bilder nicht im Fingerabdruck:** Eine Änderung der Darstellung im Spiel meldet kein Test. Die Bilder entstehen
  darum je Lauf neu.
- **Zwischenspeicher für Anker-Bilder:** 16 der 22 Aufnahmen eines Probelaufs sind Anker. Bei vielen Läufen lohnt sich
  einer.
- **Anker A3 Kreuzweg:** Mit der Erkennung der Scheinmischung (Ticket 07) prüfen; in beiden Probeläufen fiel er als nahe
  an einer Scheinmischung auf. Fällt er, kommt ein neuer Anker und eine neue Version.

Commit siehe git log.
