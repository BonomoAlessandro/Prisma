# 06: Feldform und Beurteilung mit Mischzielen

**What to build:** Das gemeinsame Beurteilungsmodul entsteht mit einem einzigen Einstieg: Level hinein, Beurteilung
heraus. Es kennt das Feld nur über die Feldform. Als Erstes liefert es die Mischziele nach dem Glossar. Dieses Ticket
schafft das Gerüst, in das die Tickets 07–13 ihre Teile einhängen.

**Spec:** ../spec.md, Abschnitte „Feldform“ und „Beurteilung“.

**Blocked by:** 01 (Golden-Test)

**Status:** resolved

- [x] Die Feldform für flache Felder liefert Zellen, Nachbarn, Richtungen sowie die Drehachse und die möglichen
      Stellungen eines Elements. x/y und die acht Richtungen kennt nur sie.
- [x] Der Einstieg gibt eine Struktur mit allen Teilen der Spec zurück: Schwierigkeit, Spielwert, Kernideen, Mischziele
      und Ausschlüsse. Noch nicht berechnete Teile sind als solche erkennbar.
- [x] Ein Mischziel ist ein Ziel, dessen Farbe im Level gemischt wird, durch einen Kombinator oder durch mehrere
      Strahlen auf dem Ziel. Weiss direkt aus einer weissen Quelle zählt nicht. Ein Mischziel aus zwei Quellen ist als
      solches gekennzeichnet.
- [x] Mini-Level testen diese Fälle: Mischung im Kombinator, Mischung auf dem Ziel, Weiss aus weisser Quelle (kein
      Mischziel), zwei Strahlen derselben Quelle auf einem Ziel (Mischziel, aber nicht aus zwei Quellen).
- [x] Auf den 150 heutigen Leveln haben 71 Level ein Mischziel und 38 eines aus zwei Quellen. Abweichungen sind
      begründet.
- [x] Die alte Zählung im Löser bleibt vorerst, damit der Golden-Test grün bleibt. Sie fällt in Ticket 21 weg.

## Comments

**Abschluss 16.10.2026.**

**Aufbau** (`tools/beurteilung/`, Bedienung im README unter „Beurteilung“):
- `index.mjs`: der einzige Einstieg `beurteile(level, { grad })`. Er gibt `schwierigkeit`, `spielwert`, `kernideen`,
  `mischziele`, `ausschluesse` und `offen` zurück.
  - `offen` nennt mit Glossarbegriff, was noch keine Regel berechnet. Ein offener Wert ist `null`, ein offener Begriff
    hat keine Funde. Heute sind alle Teile offen ausser den Mischzielen.
  - `grad` gibt den Grad von aussen vor, bis Ticket 12/15 ihn bestimmen; Ticket 08 braucht ihn für „ab mittel“.
  - Ein Level ohne Lösung und ein unbekannter Grad werden mit Meldung abgelehnt.
- `feldform.mjs`: `feldformVon(level)` liefert die flache Feldform.
  - Teile: `zellen`, `zelle(element)`, `zelleBei(punkt im Strahlbild)`, `richtungen`, `nachbar(zelle, richtung)`,
    `nachbarn(zelle)`, `drehachse(element)` (immer `'y'`, wie die Achse y im Würfel-Level) und `stellungen(element)`.
  - Eine Zelle ist ein Schlüssel wie in der Lösung („x,z“) und wird ausserhalb nie zerlegt.
  - Ein Level mit `dim` ≠ 2 wird abgelehnt. Die Würfel-Feldform kommt in Ticket 14 an dieser Stelle dazu.
- `loesungsstellung.mjs`: Brett und Strahlbild der Lösungsstellung, auch je Quelle allein, einmal je Beurteilung.
- `mischziele.mjs`: die erste Regel.
- `regeln.mjs`: die Registrierung, je Regel eine Zeile.

**Eine Regel einhängen (Tickets 07–13):**
- Eine eigene Datei, etwa `ausschluesse/knaeuel.mjs`. Ihr Standard-Export ist `{ teil, begriff, beurteile(ctx) }`.
  - Ausschlussgründe und Kernideen geben eine Liste von Funden zurück, je mindestens `{ begruendung }`. Den Begriff
    ergänzt die Beurteilung.
  - Schwierigkeit und Spielwert geben ihren Wert zurück, `{ wert, teilwerte }`.
- In `regeln.mjs` eine Zeile `export { default as knaeuel } from './ausschluesse/knaeuel.mjs';`, unter der
  Kommentarzeile des eigenen Tickets. Zwischen den Einträgen verschiedener Tickets bleibt so immer eine unveränderte
  Zeile. Geprüft mit vier Zweigen in einem Wegwerf-Repo: Sie liessen sich ohne Konflikt zusammenführen.
- `ctx = { level, feldform, grad, merke }`.
  - Gemeinsame Zwischenergebnisse gehen über `ctx.merke(funktion, rechne)`.
  - Braucht eine Regel eine andere, ruft sie deren Funktion mit `ctx` auf, etwa Zerfall `mischziele(ctx)`.
  - Unbekannte Begriffe oder Teile meldet `index.mjs` schon beim Laden.
- Tests: eine eigene Datei `tests/beurteilung/<regel>.test.mjs`. Sie läuft ohne Eintrag mit.
  - `helfer.mjs` liefert `test`, `miniLevel` (Elemente in Lösungsstellung) und `heutigeLevel()`.
  - `heutigeLevel()` beurteilt die 150 einmal je Lauf, mit dem vorläufigen Grad nach dem heutigen Platz.
  - Die Zahl der Neuzählung gehört als Test in die Datei der Regel. So bleibt jede Zahl bei ihrer Regel, und
    parallele Tickets teilen keine Testdatei.

**Mischziel**, gemessen in der Lösungsstellung:
- Ein Kombinator mischt, wenn er eine Mischfarbe abgibt, die kein Eingangsstrahl schon hat. Weiss + Rot = Weiss mischt
  also nicht.
- Ein Ziel mit Mischfarbe ist ein Mischziel, wenn es ohne die mischenden Kombinatoren (dort Blocker) keinen Strahl
  bekommt, der seine Farbe schon hat. Mischt ohne sie ein anderer Kombinator neu, wird auch er zum Blocker, bis keiner
  mehr mischt (aus dem Review: sonst fiel ein Kombinator, der schon gemischtes Licht bekommt, als Mischung aus).
- Aus zwei Quellen ist es, wenn mindestens zwei Quellen je allein Licht darauf bringen. Die übrigen Quellen stehen
  dabei als Blocker im Feld (aus dem Review: weggelassen liessen sie fremdes Licht durch).
- Das ist die Regel der Neuzählung. Ausgabe je Ziel: `{ ziel, farbe, quellen, ausZweiQuellen }`.
- `ausZweiQuellen` ist nicht die Kernidee „Mischziel aus zwei Quellen“ (Glossar: Die Farbe entsteht nur aus zwei
  Quellen). Verlangt man, dass keine Quelle allein die Farbe liefert, sind es 37 Level und 44 Ziele statt 38 und 46;
  anders sind 114 Gordischer Knoten (Gelb auf 3,0) und 125 Halo (Gelb auf 0,4). Hinweis in Ticket 10.

**Zahlen auf den 150:**
- 71 Level haben ein Mischziel, 38 eines aus zwei Quellen; zusammen sind es 88 Mischziele, 46 davon aus zwei Quellen.
- Je Level und Ziel gleich wie in der Neuzählung, samt Zahl der Quellen. Keine Abweichung.
- Die Neuzählung kannte keinen Randfall, in dem ein anderer Kombinator im Bild ohne Mischung neu mischt. Auf den 150
  kommt er nicht vor: Die beiden Korrekturen aus dem Review ändern dort kein Ziel.
- Die alte Zählung (`mixed` in `metrics`, Ziele mit Mischfarbe) ergibt 129 Level. Sie bleibt für den Golden-Test bis
  Ticket 21; `solver.mjs` hat dazu nur einen Hinweis im Kommentar bekommen.

**Tests** (`node tests/beurteilung.test.mjs`, 28 Tests):
- Einstieg (6): alle Teile, Begriffe nach dem Glossar, `offen`, Begründung je Fund, Level unverändert, Fehler.
- Feldform (10), auch gegen die Strahlregel und die Lösungen aller 159 Level.
- Mischziele (12): die vier Fälle des Tickets, dazu:
  - Weiss + Rot = Weiss im Kombinator: kein Mischziel;
  - Weiss aus Rot, Grün und Blau einer weissen Quelle im Kombinator: Mischziel;
  - Gelbfilter: kein Mischziel;
  - Grundfarbe, auch aus einer Mischung, die ein Prisma wieder zerlegt: kein Mischziel;
  - eine dunkle Quelle schluckt weiter Licht (aus dem Review);
  - ein Kombinator, der schon gemischtes Licht bekommt und ohne es selbst mischt (aus dem Review);
  - Lösungs- statt Startstellung;
  - die Zahlen auf den 150.
- **Testgetrieben:**
  - Ohne Modul waren alle Tests rot. Mit leerer Mischziel-Regel waren die 5 Mini-Level mit Mischziel und die Zahlen auf
    den 150 rot.
  - Fünf verfälschte Regeln, je eine Änderung, fallen alle schon an einem Mini-Level auf: alte Zählung, auch
    Grundfarben, jeder Kombinator mischt, Strahlen statt Quellen, Startstellung.
  - Die Grundfarbe aus einer zerlegten Mischung kam erst dadurch dazu; vorher fiel diese Verfälschung nur an den 150 auf.
- **Laufzeiten** über `leise.sh`, nacheinander, alle grün:
  - `tests/beurteilung.test.mjs`: 28 Tests, 1,3 s (nach dem Review);
  - `tests/golden.mjs`: 5 s;
  - `tests/logic.test.mjs`: 558 Tests, 38 s.

**Abweichungen vom Ticket:**
- Dazugekommen, weil die Folgetickets es brauchen:
  - `grad` am Einstieg (Ticket 08);
  - `zelleBei` in der Feldform: die Zelle eines Ereignisses oder Abschnitts im Strahlbild, für Scheinmischung, Knäuel und
    Füllteil;
  - `TEILE` und `GRADE` als Export.
- Die Zahl auf den 150 steht nicht in `logic.test.mjs`, sondern in `tests/beurteilung/mischziele.test.mjs` (Grund
  oben). Die neuen Tests der Levelliste kommen mit Ticket 15.

**Offen:**
- Braucht Ticket 07 oder 09 mehr von der Feldform, etwa die Richtung eines Strahlabschnitts, ergänzen beide
  `feldform.mjs`. Das ist neben `regeln.mjs` die einzige mögliche Berührung; dann je eine eigene Funktion an getrennter
  Stelle.
- Ticket 09 braucht für die Teilwerte des Spielermodells vielleicht einen eigenen Teil der Ausgabe. Dafür ergänzt es
  `TEILE` in `index.mjs`.
- Ebenso fehlen in der Ausgabe noch die Haupt-Kernidee (Spec: „nötige Kernideen, eine davon als Haupt-Kernidee“,
  Ticket 11) und der Schwierigkeitsgrad, den die Beurteilung später selbst bestimmt (Tickets 12 und 15). Beide brauchen
  die Ergebnisse anderer Regeln. Naheliegend ist je eine eigene Regel mit eigenem Eintrag in `TEILE`, die die
  Funktionen der anderen Regeln mit `ctx` aufruft (Hinweis aus dem Review). Eine Regel, deren Ergebnis andere brauchen,
  rechnet deshalb wie `mischziele` über `ctx.merke`.

Commit siehe git log.
