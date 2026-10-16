# 07: Scheinmischung und Knäuel

**What to build:** Die Beurteilung meldet die Ausschlussgründe Scheinmischung und Knäuel, beide in allen
Schwierigkeitsgraden. Jede Meldung trägt den Glossarbegriff und eine Begründung.

**Spec:** ../spec.md, Abschnitt „Beurteilung“, Tabelle der Ausschlussgründe.

**Blocked by:** 06 (Feldform und Beurteilung)

**Status:** resolved

- [x] Eine Scheinmischung liegt in drei Fällen vor:
      - (a) Ein Kombinator gibt einen Eingang unverändert aus oder hat nur einen beleuchteten Eingang.
      - (b) Eine Mischung läuft direkt in ein Prisma, das genau die eingehenden Strahlen wieder trennt. Gezählt wird
        nach Strahlen, nicht nach Quellen.
      - (c) Eine Mischung läuft in einen Filter, der nur einen Eingang durchlässt.

      Trägt nur eine Quelle die Mischung, ist das kein Ausschluss.
- [x] Ein Knäuel liegt vor, wenn benachbarte drehbare Elemente den Wert 1,30 überschreiten oder der Anteil kurzer
      Strahlabschnitte 0,85 überschreitet. Der Anteil zählt nur bei Leveln mit mindestens 12 Abschnitten.
- [x] Die Begründung nennt das Element und den Fall.
- [x] Mini-Level decken jeden Fall ab, dazu diese Grenzfälle:
      - genau 1,30 besteht, 1,31 nicht;
      - 11 Abschnitte mit hohem Anteil kurzer Abschnitte bestehen;
      - eine Mischung, die über Spiegel ins Prisma läuft, also nicht direkt, besteht;
      - ein Prisma, das mehr zerlegt, als hineinkam, besteht;
      - der Fall Zenit fällt: drei einzelne Strahlen R, G und B, zwei davon aus derselben Quelle.
- [x] Auf den 150 ergibt sich die Neuzählung:
      - 30 Level mit Scheinmischung (26 Kombinatoren im Fall a, 6 im Fall b, 1 im Fall c)
      - 3 Level mit Knäuel

      Abweichungen sind begründet.

## Comments

**Abschluss 16.10.2026.**

**Regeln** (je eine Datei in `tools/beurteilung/ausschluesse/`, je eine Zeile in `regeln.mjs` unter Ticket 07; README
unter „Beurteilung“):
- `scheinmischung.mjs`: je Kombinator mit Licht in der Lösungsstellung, ein Fund je Kombinator und Fall,
  `{ element, fall: 'a' | 'b' | 'c', begruendung }`. Die Begründung nennt den Kombinator, bei (b) und (c) auch das
  Prisma oder den Filter, und den Fall.
  - (a): Die Ausgabe hat die Farbe eines Eingangsstrahls. Das deckt „nur ein beleuchteter Eingang“ mit ab, denn aus
    einer Richtung trifft einen Kombinator im Strahlbild nur ein Strahl. Auf den 150 hat jeder der 76 Kombinatoren mit
    Licht gleich viele Eingangsrichtungen wie Strahlen.
  - (b) und (c): Wohin die Mischung läuft, zeigt ein Strahlbild, in dem nur sie leuchtet. Der Kombinator wird dort zur
    Quelle in ihrer Farbe und Richtung, die übrigen Quellen und Kombinatoren zu Blockern. Massgebend ist das erste
    Element nach den Spiegeln. So bleibt es bei der einen Strahlregel, ohne eigene Verfolgung.
    - (b): direkt ins Prisma, und jeder Eingangsstrahl hat eine Grundfarbe. Das ist „nach Strahlen“: Bringt ein Eingang
      schon eine Mischung, zerlegt das Prisma mehr, als hineinkam.
    - (c): auch über Spiegel in einen Filter, der nur die Farbe eines Eingangsstrahls durchlässt.
  - Die Quellen zählen nicht.
- `knaeuel.mjs`: `{ fall: 'benachbart' | 'kurz', wert, begruendung }`, beides über die Nachbarn der Feldform.
  - benachbart: Paare benachbarter drehbarer Elemente (auch schräg) je drehbares Element.
  - kurz: Anteil der Abschnitte, die in einer Nachbarzelle ihres Anfangs enden. Gezählt werden die Abschnitte im Feld,
    ohne das Auslaufen über die Feldkante, und erst ab 12.
  - Beide Werte sind auf zwei Stellen gerundet wie in der Neuzählung. Auf den 150 ändert das keinen Entscheid (122 und
    150 liegen ungerundet genau bei 13/10). Für neue Level liegen die Grenzen damit bei 1,305 und 0,855: 23 kurze von
    27 Abschnitten (0,852) oder 29 von 34 bestehen nur dank der Rundung, bei den Nachbarn erst ab 23 drehbaren Elementen
    (30 Paare, 1,304). (Hinweis aus dem Review.)
  - Die Begründung nennt Fall, Wert und Schwelle. Beim Fall benachbart nennt sie dazu das Element mit den meisten
    drehbaren Nachbarn. Ein einzelnes schuldiges Element gibt es beim Knäuel nicht.
- `feldform.mjs`: neu ist `abschnitt(s)`, eingefügt nach `zelleBei`. Die Funktion liefert die Zellen von Anfang und Ende
  eines Strahlabschnitts, `{ von, bis }`; `bis` ist null hinter der Feldkante. Die Richtung eines Abschnitts war nicht
  nötig.

**Zahlen auf den 150:**
- Scheinmischung: 30 Level; 26 Kombinatoren im Fall a (16 mit nur einem Eingang, 10 mit Ausgabe gleich Eingang),
  6 im Fall b, 1 im Fall c (106 Polarlicht). Je Level und Kombinator gleich wie in der Neuzählung, keine Abweichung.
- Knäuel: 3 Level, 136 Quasar (1,31), 140 Urknall (1,33) und 146 Farbenrausch (1,31), alle im Fall benachbart.
  - Für alle 150 sind die Werte gleich wie in der Neuzählung: benachbart, Anteil kurz und Zahl der Abschnitte.
  - Keine Abweichung.
- Grenzfälle der Spec mit der fertigen Regel:
  - Knäuel: 122 und 150 liegen genau bei 1,30, 38, 85, 99 und 109 bei 1,29. Alle bestehen.
  - Kurz: 3 (0,88 bei 8 Abschnitten) und 7 (0,90 bei 10 Abschnitten) bestehen nur dank der Mindestzahl.
  - Scheinmischung (b): Bei 76, 100 und 117 zerlegt das Prisma mehr, als hineinkam. 118 läuft über 4 Spiegel. Alle vier
    bestehen. 149 Zenit fällt.

**Tests** (`node tests/beurteilung.test.mjs`, 52 Tests, davon neu 15 in `scheinmischung.test.mjs` und 9 in
`knaeuel.test.mjs`; aus dem Review kamen zwei Tests dazu, ein dritter prüft nun die Level statt nur ihrer Zahl):
- Scheinmischung:
  - echte Mischung;
  - (a) Ausgabe gleich Eingang;
  - (a) ein Eingang, dazu ein Kombinator ohne Licht;
  - nur eine Quelle trägt die Mischung;
  - (b), auch der Fall Zenit;
  - Mischung über einen Spiegel ins Prisma;
  - Prisma zerlegt mehr, als hineinkam;
  - (c) direkt und über einen Spiegel;
  - Filter lässt die ganze Mischung durch;
  - gemessen in der Lösungsstellung: Der Kombinator startet zu einem Filter (aus dem Review);
  - Begründung, alle Grade, Zahlen auf den 150;
  - Grenzfälle der Spec auf den 150: 149 fällt im Fall b, 76, 100, 117 und 118 bestehen (aus dem Review).
- Knäuel:
  - 1,30 gegen 1,31;
  - feste Elemente zählen nicht;
  - 11 gegen 12 kurze Abschnitte;
  - 0,85 gegen 0,86;
  - ein Schritt schräg ist kurz;
  - das Auslaufen über die Feldkante zählt nicht;
  - Begründung, alle Grade, auf den 150 die Level 136, 140 und 146 (seit dem Review die Level, nicht nur ihre Zahl).
- **Testgetrieben:**
  - Ohne die Regeln waren 15 der 22 neuen Tests rot. Die übrigen 7 prüfen Fälle ohne Ausschluss.
  - 12 verfälschte Regeln, je eine Änderung, fallen alle an einem Mini-Level auf:
    - Scheinmischung: (b) nur mit zwei Strahlen, (b) auch über Spiegel, (b) auch mit gemischtem Eingang, (c) nur direkt,
      (a) auch ohne Licht;
    - Knäuel: ohne Mindestzahl, ≥ statt > in beiden Fällen, kurz nur gerade, feste Elemente mitgezählt, Auslaufen
      mitgezählt, ungerundet.
- **Laufzeiten** über `leise.sh`, nacheinander, alle grün:
  - `tests/beurteilung.test.mjs`: 1,5 s;
  - `tests/golden.mjs`: 5,8 s;
  - `tests/logic.test.mjs`: 558 Tests, 43 s;
  - nach dem Review (52 Tests der Beurteilung), gemessen im Job ohne den Start von `leise.sh`: 0,2 s, 4,4 s und 40 s.

**Abweichungen vom Ticket:**
- In den Zahlen keine.
- (c) gilt auch über Spiegel. Das Ticket sagt nur bei (b) „direkt“, und die Neuzählung zählt (c) ebenso. Ein Mini-Level
  hält das fest.
- Über das Ticket hinaus kamen Grenzfälle dazu:
  - 0,85 gegen 0,86;
  - das Auslaufen über die Feldkante;
  - feste Elemente;
  - ein Filter, der die ganze Mischung durchlässt.
- Beim Knäuel nennt die Begründung kein schuldiges Element: im Fall kurz keines, im Fall benachbart das dichteste
  (siehe oben).

**Offen:**
- Im README steht unter „Beurteilung“, `offen` nenne heute alle Teile ausser den Mischzielen. Das stimmt nach dem
  Zusammenführen der Tickets 07–10 nicht mehr. Wegen der parallelen Tickets ist der Satz nicht angefasst.
- Beim Zusammenführen: Der README-Punkt „Scheinmischung und Knäuel“ steht direkt nach „Mischziele“. Setzen die Tickets
  08–10 ihren Punkt an dieselbe Stelle, gibt es dort einen leicht lösbaren Konflikt.
- Randfälle aus dem Review, auf den 150 kommt keiner vor, wie in der Neuzählung behandelt:
  - Rückkopplung: Läuft die ganze Mischung über Spiegel in den eigenen Kombinator zurück, meldet Fall a „gibt seinen
    Eingang … unverändert aus“. Der Ausschluss passt, denn die Mischung erreicht dann nichts; nur nennt die Begründung
    die eigene Ausgabe einen Eingang.
  - Gleiche Grundfarben, etwa Rot + Rot + Blau direkt ins Prisma, gelten als Fall b, obwohl drei Strahlen hinein- und
    zwei herauskommen. Die Begründung nennt jede Farbe einmal.
  - Fall c sieht nur das erste Element nach den Spiegeln: Magenta durch einen Magentafilter in einen Rotfilter bleibt
    ohne Fund.
