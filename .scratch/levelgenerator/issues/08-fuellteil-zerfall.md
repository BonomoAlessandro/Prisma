# 08: Füllteil und Zerfall

**What to build:** Die Beurteilung meldet die Ausschlussgründe Füllteil und Zerfall, beide erst ab dem Grad „mittel“.
Leichte Level dürfen aus einfachen Strängen bestehen.

**Spec:** ../spec.md, Abschnitt „Beurteilung“, Tabelle der Ausschlussgründe.

**Blocked by:** 06 (Feldform und Beurteilung)

**Status:** resolved

- [x] Ein Füllteil ist ein Strang mit einer Quelle, höchstens 3 Spiegeln und eigenem Ziel, bei dem gilt: Dreht man
      ausgehend von der Lösung irgendein drehbares Element des Strangs einzeln in eine andere Stellung, ändert sich das
      Licht nie, das fremde Strahlen an andere Ziele bringen.
- [x] Ein Zerfall liegt vor bei mehr als einer Gruppe von Zielen, wenn die zweite Gruppe mindestens 3 drehbare Elemente
      hat. Ein gemeinsames Mischziel verbindet Gruppen.
- [x] Den Grad liefert die Beurteilung. Bis zur Eichung (Tickets 12 und 15) lässt er sich von aussen vorgeben, mit den
      vorläufigen Graden nach heutigem Platz.
- [x] Die Begründung nennt den Strang bzw. die Gruppen.
- [x] Mini-Level testen diese Fälle:
      - ein Strang, den ein fremder Strahl kreuzt: kein Füllteil;
      - ein isolierter Strang in „leicht“: erlaubt;
      - derselbe Strang in „mittel“: Ausschluss;
      - ein Strang mit 4 Spiegeln: kein Füllteil;
      - zwei Gruppen mit gemeinsamem Mischziel: kein Zerfall;
      - eine zweite Gruppe mit 2 Elementen: kein Zerfall.
- [x] Auf den 150 ergeben sich ab „mittel“ 6 Level mit Füllteil und 6 mit Zerfall, wie in der Neuzählung. Abweichungen
      sind begründet.

## Comments

**Abschluss 16.10.2026.**

**Regeln** (`tools/beurteilung/ausschluesse/`, je eine Zeile in `regeln.mjs`, Kurzfassung im README unter
„Beurteilung“), gemessen in der Lösungsstellung:
- `fuellteil.mjs`:
  - Ein Strang ist das Licht einer Quelle allein (die übrigen als Blocker), das als ein Strahl über Spiegel, auch feste,
    und Filter auf genau ein Ziel läuft: kein Prisma, kein Kombinator, nichts geht verloren. Eigenes Ziel heisst: Keine
    andere Quelle bringt allein Licht darauf.
  - Ein Füllteil ist ein Strang über höchstens 3 Spiegel, bei dem keine Stellung eines drehbaren Spiegels das Licht
    ändert, das fremde Strahlen auf andere Ziele bringen. Dafür leuchten die übrigen Quellen, die Quelle des Strangs steht
    als Blocker. Gedreht wird je ein Spiegel mit `setRot` auf einem eigenen Brett aus `brettInLoesung`, nicht auf dem
    gemeinsamen.
  - Fund je Strang: `{ begruendung, strang: { quelle, spiegel, ziel } }`, als Zellen.
- `zerfall.mjs`:
  - Ein Ziel hängt von einem drehbaren Element ab, wenn es mit einem Blocker an dessen Stelle anderes Licht bekommt.
    Ziele mit einem gemeinsamen Element bilden eine Gruppe.
  - Ein Mischziel aus `mischziele(ctx)` kommt in eine Gruppe mit allen Zielen, auf die eine seiner Quellen allein Licht
    bringt.
  - Zerfall: mehr als eine Gruppe, und die zweite (nach der Zahl der drehbaren Elemente) hat mindestens 3.
  - Höchstens ein Fund: `{ begruendung, gruppen: [{ ziele, elemente }] }`, alle Gruppen, die grösste zuerst.
- `ab-mittel.mjs`: die gemeinsame Gradregel der beiden.

**Ohne Grad (`grad = null`):** Beide gelten wie ab „mittel“. Ausgenommen ist nur ein ausdrücklich leichtes Level. So
geht kein Ausschluss verloren, nur weil der Grad fehlt. Die Begründung endet dann mit „Gilt erst ab „mittel“; der Grad
ist nicht vorgegeben.“ Getestet in beiden Testdateien, mit `grad: null` und ohne Angabe.

**Zahlen auf den 150** (vorläufiger Grad nach Platz):
- Füllteil, 6 Level: 36 Einklang, 40 Geflecht, 43 Glasmurmel, 67 Weichensteller, 77 Mosaik, 131 Korona.
- Zerfall, 6 Level: 40 Geflecht, 86 Laterne, 131 Korona, 133 Sternbild, 134 Kristallpalast, 139 Singularität.
- Keine Abweichung von der Neuzählung, auch nicht je Strang und je Level. Mit „mittel“ für alle 150 kämen nur 25
  Farbspiel (Füllteil) und 20 Auslese (Zerfall) dazu; beide sind leicht.

**Grenzfälle:**
- Ein fremder Strahl zählt nur, wenn er einen drehbaren Spiegel des Strangs trifft. Kreuzt er den Weg nur in einer
  leeren Zelle, bleibt es ein Füllteil (Test). Das folgt der Spec und der Absicht der _Vermeiden_-Zeile im Glossar: Ein
  Einstieg ist ein kurzer Strang, dessen Spiegel auch ein anderer Strahl trifft, denn danach weiss man etwas über den
  Rest; ein Kreuzen in einer leeren Zelle schafft keine Abhängigkeit. Die Zeile sagt dafür ungenau „kreuzt“ (siehe
  Offen).
- Ändert eine Stellung fremdes Licht nur auf dem eigenen Ziel des Strangs, bleibt es ein Füllteil (Spec: „an andere
  Ziele“; Test).
- Lenkt eine Stellung nur das eigene Licht des Strangs auf ein anderes Ziel, bleibt es ein Füllteil (Spec: „fremde
  Strahlen“; Test aus dem Review).
- Verglichen wird die Farbe auf den Zielen: Bringt eine Stellung nur eine Farbe dazu, die ein Ziel schon hat, ändert
  sich nichts (aus dem Review).
- Feste Spiegel zählen bei den 3 Spiegeln mit (Test). Gezählt werden Spiegel, nicht Reflexionen; anders wäre es nur bei
  3 Schleuse, die ohnehin 6 Spiegel hat.
- Ein Strang ganz ohne Spiegel ist ein Füllteil (Test). Die Neuzählung verlangte mindestens eine Reflexion; auf den 150
  kommt ein solcher Strang nicht vor.
- Ein Filter im Strang ist erlaubt, wie in der Neuzählung, ein Prisma nicht (Test aus dem Review). Ein Filter kommt nur
  bei 25 Farbspiel vor.
- Die Quelle des Strangs steht beim fremden Licht als Blocker im Feld, wie in Ticket 06. In der Neuzählung fehlte sie;
  auf den 150 macht das keinen Unterschied.
- Die Neuzählung hat die Verbindung über Mischziele nur von Hand nachgeprüft. Gerechnet verbindet sie Gruppen in 19
  Seitenlicht, 29 Doppelpass und 128 Interferenz, hebt aber keinen Zerfall auf. Das Mini-Level mit gemeinsamem
  Mischziel ist so gebaut, dass nur sie die Gruppen verbindet.
- Kommt Licht über drehbare Elemente aufs Mischziel, hängen die Gruppen schon über die Abhängigkeit zusammen. Die
  Verbindung über das Mischziel wirkt also nur über Quellen und feste Elemente, und sie verbindet auch Gruppen, die sich
  bloss eine Quelle teilen (siehe Offen).
- Zweite Gruppe aus 2 Elementen (Spec: 36, 37, 43, 80, 101): kein Zerfall.

**Tests** (`node tests/beurteilung.test.mjs`, 44 Tests, 2 s):
- `fuellteil.test.mjs` (10): die vier Füllteil-Fälle des Tickets, dazu 3 Spiegel und ganz ohne Spiegel, fester vierter
  Spiegel, Kreuzen in leerer Zelle, Licht nur aufs eigene Ziel, ohne Grad, Zahl auf den 150. Aus dem Review: eigenes
  Licht auf einem anderen Ziel, Filter ja und Prisma nein.
- `zerfall.test.mjs` (6): Zerfall mit zwei Gruppen aus je 3 Elementen und Begründung, dasselbe in „leicht“, ohne Grad,
  zweite Gruppe mit 2 Elementen, gemeinsames Mischziel, Zahl auf den 150.
- **Testgetrieben:** Ohne Regeln waren die positiven Mini-Level und die Zahlen rot. Zehn verfälschte Regeln fallen alle
  an einem Mini-Level auf: ohne Prüfung des fremden Lichts, bis 4 Spiegel, ohne eigenes Ziel, eigenes Ziel
  mitverglichen, nur drehbare Spiegel gezählt, Grad egal, ohne Grad wie leicht, ohne Mischziel-Verbindung, ab 2
  Elementen, grösste statt zweite Gruppe.
  - Aus dem Review: Drei weitere fielen vorher nur an den 150 oder gar nicht auf, jetzt an einem Mini-Level: Strang über
    ein Prisma, Strang ohne Filter, Quelle des Strangs leuchtet beim fremden Licht mit.
- Über `leise.sh`, nacheinander, alle grün: `tests/golden.mjs` 5 s, `tests/logic.test.mjs` 558 Tests, 36 s. Nach dem
  Review: `tests/beurteilung.test.mjs` 44 Tests, 1,5 s; `tests/golden.mjs` 6 s; `tests/logic.test.mjs` 42 s.

**Abweichungen vom Ticket:**
- Neu ist ausser den beiden Regeln `ausschluesse/ab-mittel.mjs`. Von den gemeinsamen Dateien sind nur `regeln.mjs` (zwei
  Zeilen) und das README (ein Absatz) berührt. Die Feldform reichte, wie sie ist.
- Das Verhalten ohne Grad (oben) verlangte das Ticket nicht.

**Offen:**
- **Glossar:** Die _Vermeiden_-Zeile bei Füllteil sollte vor dem nächsten Lauf der KI-Tester geschärft werden: „Füllteil
  für einen kurzen Strang, den ein anderer Strahl an einem seiner Spiegel trifft (das ist ein Einstieg)“. Heute urteilen
  Regel und KI-Tester verschieden über einen Strang, den ein fremder Strahl nur in einer leeren Zelle kreuzt. Hier nicht
  geändert: Das Glossar steckt im Fingerabdruck der KI-Tester, eine Änderung zieht eine neue Version nach sich.
- **Mischziel-Verbindung beim Zerfall** (aus dem Review), mit den Grenzfällen der Neuzählung in Phase 3 zu entscheiden:
  - Weisses Licht durch ein festes Prisma, Grün und Rot je über 3 drehbare Spiegel auf ihr Ziel, Blau direkt auf ein
    Mischziel, das Rot von einer zweiten Quelle bekommt. Grün und Rot lassen sich einzeln lösen; ohne das Mischziel ist
    es ein Zerfall, mit ihm keiner, weil es alle Ziele der weissen Quelle verbindet.
  - Ebenso offen ist, ob ein drehbares Element ohne Wirkung auf ein Ziel, etwa ein Lockvogel ohne Licht, zu einer
    Gruppe zählt. Heute zählt es nicht, wie in der Neuzählung.
- **Zusammenführen:**
  - Der README-Absatz steht an derselben Stelle wie der von Ticket 07, nach den Mischzielen; beide behalten.
  - Im README steht weiter, `offen` nenne „alle ausser den Mischzielen“. Der Satz ist überholt, bleibt aber, damit sich
    die parallelen Tickets dort nicht berühren.
  - Weil die Regeln ohne Grad wie ab „mittel“ gelten, melden Mini-Level mit kurzem Strang ohne Grad nun einen Füllteil.
    Erwartet ein Test eines anderen Tickets ohne Grad ein leeres `ausschluesse`, wird er rot; er sollte nach Begriff
    filtern oder einen Grad angeben.
  - Das Ersetzen durch Blocker, die Zielliste und die Zuordnung Zelle → Id stehen nun in mehreren Regeln. Ein Helfer in
    `loesungsstellung.mjs` böte sich an; hier nicht, weil die Datei allen Tickets gehört.
- Sobald Ticket 12/15 den Grad bestimmt, sollte `ctx.grad` ihn tragen; dann entfällt der Fall ohne Grad.

Commit siehe git log.
