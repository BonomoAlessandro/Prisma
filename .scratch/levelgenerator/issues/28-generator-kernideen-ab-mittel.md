# 28: Generator: Kernideen ab „mittel“

**What to build:** Ab „mittel“ liefert der Generator für jede der sechs Kernideen genug Level, in denen sie die
Haupt-Kernidee ist. Heute liefern ab „mittel“ fast nur Mischziel und Sammelstelle, Lockvogel gar nichts. Damit kann
der Austausch in den Tickets 24–26 die Regel „dieselbe Haupt-Kernidee höchstens zweimal je 10 Level“ erfüllen.

**Spec:** ../spec.md, Abschnitte „Generator“ und „Effizienz“; „Beurteilung“ (Haupt-Kernidee, Rangfolge); Glossar,
Abschnitt „Kernideen“.

**Blocked by:** 19 (Generator: alle Kernideen), 20 (Generator: Verfeinern)

**Status:** resolved

- [x] Zuerst den Bedarf messen: Für die Plätze, die 24, 25 und 26 ersetzen, steht unter `## Comments`, welche
      Haupt-Kernideen die verbleibenden Level in jedem Abschnitt zu 10 Leveln schon haben und wie viele Ersatzlevel je
      Haupt-Kernidee höchstens dazukommen dürfen. Daraus folgt, welche Kernideen je Grad wirklich gebraucht werden.
- [x] Die Bausteine lassen ab „mittel“ Platz zum Verfeinern (Quellen, offene Strahlen), oder „schwerer“ darf auch an
      Strängen der Kernidee wachsen, ohne die Kernidee zu zerstören, oder beides. Die Wahl ist begründet.
- [x] Bei „mittel“ und „schwer“ liefert jede der sechs Kernideen aus 200 Seeds mindestens 10 Level, in denen die
      verlangte Kernidee die Haupt-Kernidee ist (nach der Rangfolge der Beurteilung). Erreicht eine Kernidee das nicht,
      ist gezeigt, warum das an der Kernidee selbst liegt, und der Bedarf aus dem ersten Punkt ist trotzdem gedeckt.
- [x] Bei „sehr schwer“ liefern mindestens fünf Kernideen aus 500 Seeds je mindestens 3 Level mit ihr als
      Haupt-Kernidee, mindestens aber so viele, wie der Bedarf aus dem ersten Punkt verlangt.
- [x] Nichts wird schlechter: „leicht“ ist für alle sieben Aufträge bitgleich, und Mischziel und Sammelstelle liefern ab
      „mittel“ je CPU-Stunde nicht weniger als heute (gleiches `--jobs`, gleiche Seeds, dieselbe Sitzung).
- [x] Je Grad ab „mittel“ und je Kernidee gibt es einen Auftrag im Generator-Test; dazu je Grad ein fester Seed für
      mindestens die Kernideen, die der Bedarf verlangt. Der Generator-Test bleibt unter etwa 90 s.
- [x] Die Ausbeute je Grad und Kernidee (Level, davon mit ihr als Haupt-Kernidee, Level je CPU-Stunde) steht unter
      `## Comments`, ebenso die Hinweise für 24–26.

## Comments

**Anlass (18.10.2026):** Frage aus dem Review von Ticket 20 nach dem Merge mit 19. Der Nutzer hat entschieden, dass
vor den Tickets 24–26 ein eigenes Ticket kommt.

**Hinweise aus den Tickets 19 und 20:**
- Probe nach dem Merge (Ticket 20, „Nach dem Merge mit 19“, Seeds 1–100, ein Prozess):

  | Kernidee | mittel | schwer |
  |---|---:|---:|
  | Mischziel aus zwei Quellen | 55 | 39 |
  | Sammelstelle | 43 | 36 |
  | Falle | 13 | 8 |
  | Abschalten | 3 | 4 |
  | Farben abzählen | 0 | 4 |
  | Lockvogel | 0 | 0 |

  Nachprüfung (Seeds 101–200): `mittel-sammelstelle` 37, `mittel-falle` 18, `mittel-abschalten` 1, Farben abzählen und
  Lockvogel 0; `schwer-falle` 10, `schwer-abzaehlen` 6, `schwer-lockvogel` 0. Bei „sehr schwer“ liefern Sammelstelle
  und Falle je nur 1 von 50 Seeds; praktisch nur das Mischziel liefert (139 von 2000).
- Warum es scheitert:
  - **Lockvogel:** Der Baustein braucht drei Quellen, und alle seine Strahlen enden an Zielen der Kernidee. „mittel“
    erlaubt höchstens 3 Quellen (`vorgaben.mjs`), also bleibt keine Quelle und kein offenes Ende. „schwerer“ öffnet nur
    Ziele ausserhalb der Kernidee (73 von 100: zu klein und kein Zuwachs).
  - **Farben abzählen:** fällt bei „mittel“ zu 77 % an einem Füllteil, bei dem „schwerer“ nichts mehr dazubringt. Der
    Ring belegt drei Quellen und reserviert viele Zellen.
  - **Abschalten:** meist „Kernidee wirkungslos“ oder ein Füllteil, auch nach „schwerer“.
  - **Falle:** meist nicht eindeutig oder nicht eingebaut.
- Mögliche Hebel, nicht vorgegeben:
  - Bausteine, die ab „mittel“ weniger Quellen belegen oder offene Strahlen übrig lassen.
  - Eine Vorgabe, die dem Baustein Quellen dazugibt (`maengel` in `vorgaben.mjs` prüft schon, dass die Vorgabe Platz
    für den Baustein hat).
  - Ein Schritt „schwerer“, der an Strängen der Kernidee wächst und danach prüft, ob sie noch nötig ist.
- **Haupt-Kernidee:** Die Beurteilung wählt sie nach der festen Rangfolge Falle, Abschalten, Farben abzählen,
  Sammelstelle, Lockvogel, Mischziel aus zwei Quellen (Spec, „Weitere Hinweise“). Das Mischziel steht zuletzt, ist
  also nur Haupt-Kernidee, wenn keine andere nötig ist. Ob der Auftrag „verlangte = Haupt-Kernidee“ erzwingen kann,
  ist Sache von 23–26 (Entscheid des Nutzers vom 17.10.2026, Ticket 23); hier wird es nur gezählt.
- **Messen:** `bench.mjs generator --generator neu --accept beurteilung` zählt je Grad und nötiger Kernidee. Nur
  Messungen mit gleichem `--jobs` vergleichen (Ticket 02: die Prozesszahl ändert die CPU-Zeit je Seed). Auf einem
  Rechner mit `LEISE_MAX_CPU=65` gehen `LEISE_CPU=65` und `--jobs 7`.
- Aus dem Review von Ticket 20 (Fund 2, in Ticket 21 notiert): Aussichtslose Versuche von „schwerer“ laufen noch
  durch die Eindeutigkeitssuche. Wird „schwerer“ hier ohnehin umgebaut, lässt sich das gleich mitnehmen.

**Umgesetzt 18.10.2026.** Gearbeitet im Worktree `.claude/worktrees/agent-a39029bcb21095e55` auf dem Branch
`ticket/28-kernideen-ab-mittel` (von `origin/feature/levelgenerator`, Stand `6e98bb1`; während der Arbeit auf Bitte
des Koordinators `43d93c4` mit Ticket 21 per Fast-Forward übernommen, danach golden, logic und generator grün).
Rechner i7-9750H (12 logische Kerne), Node 22.12.0. Alle Läufe über `leise.sh` mit `LEISE_MAX_CPU=65 LEISE_CPU=65`,
nacheinander; alle Messungen mit `--jobs 7`. „vorher“ ist eine Kopie von `43d93c4` mit dem Messskript dieses Tickets
(es zählt nur zusätzlich die Haupt-Kernidee), im selben Lauf von `leise.sh` abwechselnd mit „nachher“ gemessen.

**Bedarf** (Platzierung und Haupt-Kernidee aus `node tools/ordne-level.mjs --json`, Stand `43d93c4`). Gezählt wird wie
in der Regel der Levelliste: je Seite zu 10 Leveln die Haupt-Kernideen der verbleibenden Level ohne die Duldungsliste;
höchstens 2 je Haupt-Kernidee. Annahme: Jedes Ersatzlevel kommt auf die Seite des Levels, das es ersetzt
(Ziel-Schwierigkeit wie dort); die Häufungsregel (bis 3 Plätze im Grad) gibt etwas Spielraum dazu. Zwei Fälle:
- **Fall A** (sicher): ersetzt werden die Level mit Ausschlussgrund oder von beiden KI-Testern abgelehnt (mittel 13,
  schwer 13, sehr schwer 8); die übrigen der Duldungsliste bleiben geduldet und zählen nicht.
- **Fall B** (Liste leer): ersetzt werden alle Level der Duldungsliste ab „mittel“ (mittel 57, schwer 19, sehr schwer 8).

Fall A, „dürfen dazu“ in der Reihenfolge Falle / Abschalten / Farben abzählen / Sammelstelle / Lockvogel / Mischziel:

| Plätze | zu ersetzen | verbleibend (Haupt-Kernidee) | dürfen dazu Fa / Ab / Fz / Sa / Lo / Mi | mind. verschiedene | ohne Lockvogel unentbehrlich |
|---|---|---|---|---:|---|
| 31–40 | 1 mittel | Mi 1 | 2 / 2 / 2 / 2 / 2 / 1 | 1 | – |
| 41–50 | 4 mittel | Fz 1 | 2 / 2 / 1 / 2 / 2 / 2 | 2 | – |
| 51–60 | 1 mittel | – | 2 / 2 / 2 / 2 / 2 / 2 | 1 | – |
| 61–70 | 1 mittel | Ab 1, Lo 1 | 2 / 1 / 2 / 2 / 1 / 2 | 1 | – |
| 71–80 | 1 mittel | Fa 1, Ab 1, Mi 1 | 1 / 1 / 2 / 2 / 2 / 1 | 1 | – |
| 81–90 | 2 mittel | Ab 2, Mi 2 | 2 / 0 / 2 / 2 / 2 / 0 | 1 | – |
| 91–100 | 1 mittel | Ab 1, Mi 2 | 2 / 1 / 2 / 2 / 2 / 0 | 1 | – |
| 101–110 | 2 mittel + 2 schwer | Fa 1, Mi 2 | 1 / 2 / 2 / 2 / 2 / 0 | 2 | – |
| 111–120 | 3 schwer | Fa 1, Fz 1, Mi 2 | 1 / 2 / 1 / 2 / 2 / 0 | 2 | – |
| 121–130 | 4 schwer | Fa 2, Ab 2, Fz 1, Sa 1 | 0 / 0 / 1 / 1 / 2 / 2 | 2 | Fz 1, Sa 1, Mi 2 |
| 131–140 | 4 schwer + 1 sehr schwer (140 Korona) | Ab 2, Fz 2, Sa 1 | 2 / 0 / 0 / 1 / 2 / 2 | 3 | Fa 2, Sa 1, Mi 2 |
| 141–150 | 7 sehr schwer | Fa 1, Ab 2 | 1 / 0 / 2 / 2 / 2 / 2 | 4 | Fa 1, Fz 2, Sa 2, Mi 2 |

Fall B (Liste leer), dieselben Spalten:

| Plätze | zu ersetzen | verbleibend (Haupt-Kernidee) | dürfen dazu Fa / Ab / Fz / Sa / Lo / Mi | mind. verschiedene | ohne Lockvogel unentbehrlich |
|---|---|---|---|---:|---|
| 31–40 | 8 mittel | Mi 1 | 2 / 2 / 2 / 2 / 2 / 1 | 4 | Fa 1, Ab 1, Fz 1, Sa 1 |
| 41–50 | 9 mittel | Fz 1 | 2 / 2 / 1 / 2 / 2 / 2 | 5 | Fa 2, Ab 2, Fz 1, Sa 2, Mi 2 |
| 51–60 | 10 mittel | – | 2 / 2 / 2 / 2 / 2 / 2 | 5 | Fa 2, Ab 2, Fz 2, Sa 2, Mi 2 |
| 61–70 | 8 mittel | Ab 1, Lo 1 | 2 / 1 / 2 / 2 / 1 / 2 | 4 | Fa 1, Fz 1, Sa 1, Mi 1 |
| 71–80 | 7 mittel | Fa 1, Ab 1, Mi 1 | 1 / 1 / 2 / 2 / 2 / 1 | 4 | Fa 1, Ab 1, Fz 2, Sa 2, Mi 1 |
| 81–90 | 6 mittel | Ab 2, Mi 2 | 2 / 0 / 2 / 2 / 2 / 0 | 3 | Fa 2, Fz 2, Sa 2 |
| 91–100 | 7 mittel | Ab 1, Mi 2 | 2 / 1 / 2 / 2 / 2 / 0 | 4 | Fa 2, Ab 1, Fz 2, Sa 2 |
| 101–110 | 2 mittel + 5 schwer | Fa 1, Mi 2 | 1 / 2 / 2 / 2 / 2 / 0 | 4 | Fa 1, Ab 2, Fz 2, Sa 2 |
| 111–120 | 6 schwer | Fa 1, Fz 1, Mi 2 | 1 / 2 / 1 / 2 / 2 / 0 | 3 | Fa 1, Ab 2, Fz 1, Sa 2 |
| 121–130 | 4 schwer | Fa 2, Ab 2, Fz 1, Sa 1 | 0 / 0 / 1 / 1 / 2 / 2 | 2 | Fz 1, Sa 1, Mi 2 |
| 131–140 | 4 schwer + 1 sehr schwer | Ab 2, Fz 2, Sa 1 | 2 / 0 / 0 / 1 / 2 / 2 | 3 | Fa 2, Sa 1, Mi 2 |
| 141–150 | 7 sehr schwer | Fa 1, Ab 2 | 1 / 0 / 2 / 2 / 2 / 2 | 4 | Fa 1, Fz 2, Sa 2, Mi 2 |

„unentbehrlich“: ohne diese Kernidee reicht der Platz der übrigen nicht, mit der Zahl, die sie dann bringen muss. Mit
allen sechs Kernideen ist keine allein unentbehrlich. Daraus je Grad:
- **mittel:** Im Fall A genügen je Seite zwei Kernideen (höchstens 4 Ersatzlevel, mindestens 8 frei). Im Fall B braucht
  es fünf der sechs, auf 41–60 jede je 2-mal (ohne Lockvogel alle fünf übrigen), zusammen je Kernidee etwa 7–14.
- **schwer:** Falle und Abschalten haben auf 121–130 schon je 2, Abschalten und Farben abzählen auf 131–140. Auf
  121–130 bleiben Fz 1, Sa 1, Lo 2, Mi 2, auf 131–140 Fa 2, Sa 1, Lo 2, Mi 2: Mischziel ist ohne Lockvogel auf beiden
  Seiten voll nötig, dazu Farben abzählen, Sammelstelle und (131–140) Falle.
- **sehr schwer:** Auf 141–150 hat Abschalten schon 2; die 7 Ersatzlevel brauchen mindestens vier von Fa (1), Fz, Sa,
  Lo, Mi (je 2). Ohne Lockvogel braucht es Falle 1, Farben abzählen 2, Sammelstelle 2 und Mischziel 2, also jede dieser
  vier voll; dazu Korona auf 140 (Fa, Lo, Mi, Sa frei). Je Haupt-Kernidee also höchstens 3 Ersatzlevel.
Die leichten Ersatzlevel (Ticket 23) liegen auf 1–31; Platz 31 teilt seine Seite mit „mittel“. Bringt ein leichtes
Ersatzlevel dort eine Haupt-Kernidee, zählt sie auf 31–40 mit (heute Mi 1).

**Gewählte Lösung: beides**, je nach Kernidee. Die Bausteine bauen ab „mittel“ (`vorgaben.andocken`) ihre Stränge
verbunden, und „schwerer“ dockt Stränge der Kernidee an, wo das die Kernidee nicht zerstört (`andocken.mjs`).
Begründung: Gescheitert ist ab „mittel“ fast immer ein Füllteil oder Zerfall an einem Strang der Kernidee (die Bausteine
setzen ihre Elemente auf Zellen ohne fremdes Licht und reservieren ihre Wege, und „schwerer“ darf ihre Ziele nicht
öffnen), dazu Ringe ohne offenes Ende. Ein Füllteil verschwindet nur, wenn fremdes Licht einen Spiegel des Strangs
trifft, ein anderer Strahl sein Ziel mitbeleuchtet oder sein Licht über ein Prisma läuft. Welcher Weg die Kernidee
heil lässt, hängt an der Kernidee:
- **Andocken** (`tools/generator/andocken.mjs`, neu): fremdes Licht auf einen drehbaren Spiegel des Strangs (vom Ende
  eines offenen Strahls über einen neuen Spiegel oder von einer neuen Quelle am Rand; fehlt eine Quelle, weicht eine
  ausserhalb der Kernidee) oder ein Prisma vor eine Quelle mit einer Grundfarbe (sie leuchtet in einer Mischung, das
  Prisma bricht die Grundfarbe weiter, die übrigen zur Seite). Geprüft mit der Strahlregel: Ziele der Kernidee wie
  vorher, Lockvögel dunkel, Platz für ein neues Ziel. „schwerer“ dockt zuerst an, wenn die Beurteilung Elemente der
  Kernidee nennt (Füllteil, Zerfall), und statt einer getrennten neuen Quelle, wenn kein Platz ist; nur für die
  Bausteine mit `andocken` (Abschalten, Farben abzählen, Lockvogel). Mischziel, Sammelstelle und Falle brauchen es
  nicht und bleiben unverändert (mit Andocken bei der Falle: 14 / 9 statt 13 / 8 Level aus 100 Seeds bei mittel /
  schwer, im Rauschen).
- **Abschalten:** A bekommt immer ein eigenes Ziel X, möglichst über einen Spiegel von B (Andocken im Baustein), der
  Weg dorthin ist reserviert; A und ihr Spiegel stehen in `bau.unberuehrt` (kein Andocken, nicht fest). Vorher
  untersucht (Seeds 1–40): In jedem Fall von „Kernidee wirkungslos“ (zusammen 20 von 100 Seeds) war der Spiegel von A
  fest gemacht, weil der Zwischenstand bei fehlendem X eine zweite Lösung war; danach nahm ein Element auf einer
  Kreuzung (verbinden) X noch oft das Licht; ein Prisma vor A nahm dem Zwischenstand seinen kurzen Weg. Eine Weiche (B
  über den Spiegel von A) geht nicht: Die beiden Stellungen, die A umlenken, stehen senkrecht zueinander, A und B
  tauschten im Zwischenstand ihre Ziele (100 von 100 Seeds verworfen).
- **Farben abzählen:** Weichenring: drei Quellen an drei Ecken (zwei in der Grundfarbe, eine in einer Mischung, die sie
  enthält), drei Ziele an Ausgängen. Ecken mit eigener Quelle sind Weichen, die Stränge teilen sich Ecken. Im alten Ring
  lassen sich die Ecken nicht andocken (alle Richtungen sind Ringseiten, Ausgänge oder Quellwege), mit drei Quellen
  derselben Farbe gäbe es vier Lösungen; die Leitfarbe macht die Lösung eindeutig. Neue Quellen teilen keine Grundfarbe
  mit den Zielen der Kernidee (`fremdfarbe`): Eine weisse Quelle mehr machte die Grundfarbe nicht mehr knapp (mit
  dieser Regel schwer-abzaehlen 29 statt 15 Level aus 100 Seeds).
- **Lockvogel:** Grundfarbe im Ring und vor jedem Ringspiegel ein drehbares Prisma (Quellen in einer Mischung); keines,
  das in einer anderen Stellung die Grundfarbe geradewegs auf ein Ziel des Rings bräche (das wäre ein Abschalten und
  ginge als Haupt-Kernidee vor: vorher 20 von 45 Leveln); die Ringspiegel stehen in `bau.unberuehrt`. Proben an 115
  leichten Lockvogel-Leveln: fremdes Licht auf einem Ringspiegel liess den Lockvogel in 0 von 54 nötig (der Tausch
  findet für das fremde Licht kein Ziel), ein Prisma vor einem Ringspiegel in 52 von 76. Der Baustein versucht es ab
  „mittel“ bis 500-mal (statt 80), weil ein Versuch seltener gelingt.
- **Fund 2** aus dem Review von Ticket 20 (`vorgaben.abkuerzen`, ab „mittel“): Ein Versuch von „schwerer“, vor dessen
  Festigen kein drehbares Element dazugekommen ist, endet ohne Eindeutigkeitssuche. In „leicht“ (auch mit
  Ziel-Schwierigkeit) bleibt es beim Festigen.

**Ausbeute** (Seeds 1–200 bzw. 1–500 je Auftrag, `--jobs 7`, Abnahme Beurteilung; „Haupt“: Level mit der verlangten
Kernidee als Haupt-Kernidee; je CPU-Stunde gezählt sind diese Level; bei zwei Runden beide Werte):

| Grad | Kernidee | vorher Level / Haupt | vorher CPU-s | vorher Haupt je CPU-h | nachher Level / Haupt | nachher CPU-s | nachher Haupt je CPU-h |
|---|---|---:|---:|---:|---:|---:|---:|
| mittel (200) | Mischziel | 115 / 111 | 2,4 / 12,2 | 166 500 / 32 754 | 115 / 111 | 10,0 / 12,1 | 39 960 / 33 025 |
| | Abschalten | 4 / 4 | 4,9 | 2 939 | 17 / 17 | 11,3 | 5 416 |
| | Farben abzählen | 0 / 0 | 6,2 | 0 | 116 / 106 | 12,9 | 29 581 |
| | Sammelstelle | 80 / 64 | 4,6 / 15,5 | 50 087 / 14 865 | 80 / 64 | 8,4 / 13,8 | 27 429 / 16 696 |
| | Falle | 31 / 31 | 7,6 | 14 684 | 31 / 31 | 15,6 | 7 154 |
| | Lockvogel | 0 / 0 | 7,5 | 0 | 108 / 85 | 56,4 | 5 426 |
| schwer (200) | Mischziel | 68 / 52 | 32,3 / 44,8 | 5 796 / 4 179 | 69 / 52 | 29,8 / 31,3 | 6 282 / 5 981 |
| | Abschalten | 7 / 7 | 61,5 | 410 | 17 / 16 | 103,0 | 559 |
| | Farben abzählen | 10 / 10 | 36,1 | 997 | 55 / 50 | 46,5 | 3 871 |
| | Sammelstelle | 68 / 55 | 51,1 / 55,8 | 3 875 / 3 548 | 67 / 54 | 44,2 / 40,6 | 4 398 / 4 788 |
| | Falle | 18 / 18 | 51,0 | 1 271 | 18 / 18 | 54,9 | 1 180 |
| | Lockvogel | 0 / 0 | 17,4 | 0 | 48 / 24 | 131,0 | 660 |
| sehr schwer (500) | Mischziel | 40 / 26 | 333,9 / 397,4 | 280 / 236 | 40 / 26 | 294,9 / 293,3 | 317 / 319 |
| | Abschalten | 3 / 3 | 435,0 | 25 | 5 / 5 | 503,8 | 36 |
| | Farben abzählen | 0 / 0 | 139,8 | 0 | 21 / 14 | 205,0 | 246 |
| | Sammelstelle | 16 / 5 | 428,5 / 418,5 | 42 / 43 | 16 / 5 | 341,1 / 330,1 | 53 / 55 |
| | Falle | 7 / 7 | 373,8 | 67 | 6 / 6 | 346,3 | 62 |
| | Lockvogel | 0 / 0 | 48,3 | 0 | 0 / 0 | 532,1 | 0 |

- **mittel und schwer:** Jede der sechs Kernideen liefert aus 200 Seeds mindestens 16 Level mit ihr als
  Haupt-Kernidee (Abschalten 17 / 16 knapp über der Schwelle, die übrigen 18 bis 111).
- **sehr schwer:** Fünf Kernideen liefern aus 500 Seeds je mindestens 5 (Mischziel 26, Farben abzählen 14, Falle 6,
  Abschalten 5, Sammelstelle 5), der Bedarf verlangt je höchstens 3. Lockvogel liefert nichts: Der Ring entsteht (in
  66 % der Seeds), wächst aber nicht auf 9 bis 14 drehbare Elemente (meist zu klein, Zerfall oder Grad schwer mit
  „schwerer: nichts dazugekommen“); der Bedarf ist ohne ihn gedeckt (siehe oben), und das Kriterium verlangt fünf.
- **Gleiche Level vorher und nachher** (gleicher Fingerabdruck): Mischziel, Sammelstelle und Falle bei „mittel“ (auch
  dieselben Gründe), Falle bei „schwer“, Mischziel und Sammelstelle bei „sehr schwer“. Diese Aufträge rechnen nachher
  dasselbe, bis auf die abgekürzten Versuche; was ihre CPU-Zeit unterscheidet, ist Streuung. Sie ist bei „mittel“ gross:
  dieselben 115 Level von mittel-mischziel kosteten 2,4, 10,0, 12,2 und 12,1 CPU-s, die 31 von mittel-falle 7,6 und
  15,6.
- Abläufe: `LEISE_MAX_CPU=65 LEISE_CPU=65 sh tools/leise.sh sh serie.sh …` (Skript im Scratchpad unter `t28\`); darin
  je Stand `node tools/bench.mjs generator <aufträge> --seeds 200 --jobs 7 --save …`, Reihenfolge vorher, nachher,
  vorher, nachher (die zweite Runde nur Mischziel und Sammelstelle), „sehr schwer“ ebenso mit 500 Seeds.
  Lauf „mittel/schwer“ 11:12–11:16, „sehr schwer“ 11:17–11:36.

**Nichts wird schlechter:**
- **„leicht“ bitgleich:** alle sieben leichten Aufträge (ohne Kernidee und je Kernidee) und dazu „leicht“ mit den
  Ziel-Schwierigkeiten 33–43 und 20–30, Seeds 1–1000, das ganze Ergebnis von `generiere` (Level samt Beurteilung bzw.
  Grund) als Hash gegen `43d93c4`: 9000 von 9000 gleich. Das ist so gebaut: Alles Neue hängt an `vorgaben.andocken`
  bzw. `vorgaben.abkuerzen`, die erst ab „mittel“ gesetzt sind, und verbraucht in „leicht“ keinen Zufall.
- **Mischziel und Sammelstelle je CPU-Stunde:** bei „mittel“ dieselben Level und Gründe wie vorher, also dieselbe
  Rechnung bis auf abgekürzte Versuche, nicht weniger je CPU-Stunde (die gemessenen Werte streuen, siehe oben); bei
  „schwer“ in beiden Runden mehr (Mischziel 6 282 / 5 981 gegen 5 796 / 4 179, Sammelstelle 4 398 / 4 788 gegen
  3 875 / 3 548 Haupt-Level je CPU-Stunde; 69 statt 68 bzw. 67 statt 68 Level), bei „sehr schwer“ mit denselben Leveln
  in beiden Runden weniger CPU-Zeit (Mischziel 294,9 / 293,3 gegen 333,9 / 397,4 CPU-s, Sammelstelle 341,1 / 330,1 gegen
  428,5 / 418,5).
- Falle bei „sehr schwer“ 6 statt 7 Level (der abgekürzte Versuch ändert dort den Zufall); nicht Teil des Kriteriums,
  im Rauschen.

**Fund 2 neu gemessen** (die Aufträge ohne Kernidee, bei denen nur er sich ändert; Seeds 1–200, `--jobs 7`, vorher,
nachher, vorher, nachher, 11:37–11:44): `mittel`, `schwer` und `sehr schwer` liefern dieselben Level (17, 44, 16; bei
„mittel“ und „schwer“ auch dieselben Gründe). CPU-s vorher / nachher: mittel 8,5 und 18,1 / 16,4 und 17,3 (Streuung),
schwer 91,7 und 108,4 / 103,4 und 100,6 (kein messbarer Unterschied), sehr schwer 314,9 und 320,3 / 304,4 und 307,6
(−3 bis −5 %, wie der Reviewer schätzte). Bei sehr schwer-mischziel und -sammelstelle (ebenfalls dieselben Level)
−12 bis −26 %. Der Zufall ändert sich nur, wo das Festigen im abgekürzten Versuch eine Reparatur gewürfelt hätte;
unter den Aufträgen ohne Andocken kam das in diesen Messungen nur bei schwer-mischziel, schwer-sammelstelle und sehr
schwer-falle vor.

**Tests** (über `leise.sh` mit `LEISE_MAX_CPU=65 LEISE_CPU=65`, nacheinander, Wanduhr mit Wartezeit), alle grün:

| Lauf | Dauer |
|---|---:|
| `node tests/golden.mjs` | 2 s |
| `node tests/logic.test.mjs` (548 Tests) | 25 s |
| `node tests/generator.test.mjs` (28 Tests, 577 Aufträge, 369 Level; Erzeugen 42,3 s) | 65 s |
| `node tests/beurteilung.test.mjs` (177 Tests) | 72 s |
| `node tests/levelliste.test.mjs` (30 Tests) | 46 s |
| `node tests/ki-tester.test.mjs` (62 Tests) | 1 s |

- Neu im Generator-Test: je Grad ab „mittel“ und je Kernidee ein Auftrag (die Mischziele hatten schon einen), je mit
  einem festen Seed (`FEST_AB_MITTEL`), und je Grad ein Test, dass der feste Seed ein Level des Grads liefert, in dem
  die verlangte Kernidee die Haupt-Kernidee ist (neu beurteilt): mittel Mischziel 6, Abschalten 1, Farben abzählen 3,
  Sammelstelle 1, Falle 3, Lockvogel 4; schwer 10, 2, 5, 12, 26, 20; sehr schwer 12, 19, 2, 53, 28. Für den Lockvogel
  in „sehr schwer“ läuft Seed 1 ohne verlangtes Level mit (alle übrigen Prüfungen gelten für alle Level).
- `tests/generator.test.mjs` nimmt `seeds` jetzt auch als Liste.

**Abweichungen und Entscheide:**
- **Andocken nur für drei Bausteine** (`andocken` im Baustein): Mischziel und Sammelstelle lieferten schon genug. Mit
  Andocken lieferten sie in Proben mit 100 Seeds ähnlich viele Level (schwer-sammelstelle mehr: 35 statt 29) bei mehr
  CPU-Zeit, und „nicht weniger je CPU-Stunde“ wäre bei der Streuung der CPU-Zeit nicht sicher zu zeigen gewesen. So
  hängt ihr Ergebnis nur an Fund 2.
- **Haupt-Kernidee** wird gezählt, nicht erzwungen (Entscheid des Nutzers, Ticket 23): Der Generator liefert weiter
  Level, in denen die verlangte Kernidee nötig ist. Bei Lockvogel ist sie in 85 von 108 (mittel) bzw. 24 von 48
  (schwer) Leveln auch die Haupt-Kernidee, sonst vor allem Abschalten oder Farben abzählen.
- **Abschalten** ist die schwächste Kernidee ab „mittel“ (17 / 16 aus 200). Mehr brachten weitere Ansätze nicht: die
  Weiche (geht nicht, siehe oben), eine Prüfung auf eindeutigen Kern im Baustein (keine Wirkung), Andocken ohne
  Rückfall auf das bisherige „schwerer“, wenn es nicht geht (0 statt 5 Level aus 100 Seeds), „schwerer“ ganz ohne
  Andocken (2 / 6 statt 6 / 11 bei mittel / schwer). Abschalten als Haupt-Kernidee entsteht auch nebenbei, etwa bei
  mittel-sammelstelle (8 von 100 Seeds) und mittel-lockvogel.
- **bench.mjs** zählt zusätzlich je Grad und Haupt-Kernidee (`haupt` in der gespeicherten Messung, eine Ausgabe
  „Haupt-Kernidee je Gruppe und Grad“); sonst unverändert.
- **Gemeinsame Dateien:** `bau.mjs` (Set `unberuehrt`), `schritte.mjs` (`fremdfarbe`, `neueFarbe`; `eindeutig` macht
  Elemente aus `unberuehrt` nicht fest), `verfeinern.mjs` („schwerer“, `merke`/`zurueck`), `index.mjs` (`ANDOCKEN`,
  `plan.andocken`), `vorgaben.mjs` (`andocken`, `abkuerzen`), `bausteine/index.mjs` (Kopf); README „Generator“, Tests
  und Messskript.

**Hinweise für 24–26:**
- Bestellen je Kernidee wie bisher (`mittel-abschalten`, `schwer-lockvogel` …); die Haupt-Kernidee steht in
  `beurteilung.hauptKernidee` (`tools/generiere.mjs` gibt sie je Level aus). Es lohnt, nach der Haupt-Kernidee zu
  filtern: Je Auftrag ist sie bei 31 bis 100 % der Level die verlangte (Tabelle oben; am wenigsten bei sehr
  schwer-sammelstelle, 5 von 16).
- Der Bedarf je Seite steht oben (Fall A sicher, Fall B bei leerer Liste). Knapp sind „schwer“ 121–140 (ohne Lockvogel
  Mischziel voll) und „sehr schwer“ 141–150 (Falle 1, Farben abzählen 2, Sammelstelle 2, Mischziel 2 und Lockvogel
  nicht lieferbar). Die Häufungsregel (bis 3 Plätze im Grad, „sehr schwer“ ist 138–150) gibt etwas Luft.
- Kosten bei `--jobs 7` je 100 Haupt-Level etwa: mittel höchstens 0,02 CPU-Stunden (Abschalten, Lockvogel; die übrigen
  weniger),
  schwer 0,02 (Mischziel) bis 0,18 (Abschalten), sehr schwer 0,3 (Mischziel) bis 2,8 (Abschalten). Für Kandidaten, die
  die KI-Tester ablehnen dürfen, genügen bei „sehr schwer“ einige hundert Seeds je Kernidee (500 Seeds je Auftrag
  kosteten 205 bis 504 CPU-s, mit `--jobs 7` rund eine Minute Wanduhr).
- `sehr schwer-lockvogel` nicht bestellen: 0 Level aus 500 Seeds bei 532 CPU-s.
- Ziel-Schwierigkeit (`schwierigkeit: [von, bis]`) funktioniert mit allen Aufträgen; sie kostet Ausbeute.
- Seeds und Level ab „mittel“ sind für Abschalten, Farben abzählen und Lockvogel neu, für die übrigen Aufträge teils
  (Fund 2); Seeds aus früheren Proben gelten dort nicht mehr.

**Review 18.10.2026** (Reviewer-Agent, im selben Worktree, Stand `9a34b5b`; Skripte nur im Scratchpad unter
`review28\`). Alle Läufe über `leise.sh` mit `LEISE_MAX_CPU=65 LEISE_CPU=65`, Messungen mit `--jobs 7`.
- **Geprüft:** `git diff 43d93c4 HEAD`, also `andocken.mjs`, die drei Bausteine, „schwerer“ mit `merke`/`zurueck`,
  `unberuehrt` in `bau.mjs` und `eindeutig`, `fremdfarbe`/`neueFarbe`, `mangel` mit `ANDOCKEN`, `plan.andocken`, die
  Vorgaben, `bench.mjs`, Test, README und die Hinweise in 24–26.
  - Andocken: Neue Spiegel und Quellen kommen nur auf freie, nicht reservierte Zellen ohne fremdes Licht (offene Enden:
    genau ein Strahl), Quellen nur an den Rand mit der Kante dahinter; das neue Licht darf reservierte Zellen kreuzen.
    Mischlicht vor einem Prisma nur aus Quellen mit einer Grundfarbe, die übrigen Farben brauchen eine freie Zelle.
    Schleifen begrenzt die Strahlregel, Mehrdeutigkeit das Festigen. Misslingt ein Versuch, ist der Stand wieder der
    alte (`probiere` nimmt seine Elemente und die Farbe zurück, „schwerer“ ruft `zurueck`). Nötig bleibt die Kernidee
    nachweislich, weil jedes gelieferte Level voll beurteilt wird (`mangel`: verlangte Kernidee nötig).
  - Nur Abschalten, Farben abzählen und Lockvogel haben `andocken`; Mischziel, Sammelstelle und Falle rechnen ausser
    Fund 2 wie vorher (siehe unten, je Seed gleich).
  - Fund 2: Festigen nimmt nur weg (Aufräumen und wirkungslose Elemente fallen weg, Reparaturen setzen Blocker oder
    machen Spiegel fest), ein Versuch ohne drehbares Element mehr scheitert also so oder so. Anders werden höchstens
    der Grund des letzten Versuchs und der Zufall, wenn das Festigen eine Reparatur gewürfelt hätte.
- **Nachgemessen:** Seeds 1–200 der zwölf Aufträge mittel/schwer auf `9a34b5b`: Fingerabdruck und Gründe gleich wie
  in der Messung oben (gemessen ist also der Code des Commits). Zweiter Bereich, Seeds 201–400 (Level / Haupt):

  | Kernidee | mittel | schwer |
  |---|---:|---:|
  | Mischziel | 104 / 100 | 72 / 55 |
  | Abschalten | 9 / 9 | 9 / 7 |
  | Farben abzählen | 122 / 111 | 67 / 54 |
  | Sammelstelle | 80 / 72 | 68 / 59 |
  | Falle | 30 / 30 | 17 / 17 |
  | Lockvogel | 99 / 82 | 52 / 26 |

  „sehr schwer“, Seeds 501–1000 (Haupt): Mischziel 21, Farben abzählen 14, Sammelstelle 17, Falle 9, Abschalten 5,
  also wieder fünf Kernideen mit je mindestens 3.
- **„leicht“ bitgleich**, eigener Bereich: die sieben leichten Aufträge und beide Ziel-Schwierigkeiten, Seeds
  1001–1400, gegen `43d93c4`: 3600 von 3600 Ergebnissen gleich (Hash des ganzen Ergebnisses), auch die Zahl der
  Strahlverfolgungen (`L.traceBeams`) je Seed. Die Skripte des Entwicklers (`t28\bitgleich.mjs`, `vergleiche.mjs`)
  hashen ebenso das ganze Ergebnis; ihre Basis hat denselben Generator wie `43d93c4`.
- **Mischziel und Sammelstelle je CPU-Stunde:** Der Nachweis über gleiche Level ist tragfähig, mit einem
  deterministischen Mass bestätigt: je Seed das ganze Ergebnis und die Zahl der Strahlverfolgungen, Seeds 1–200 gegen
  `43d93c4`. `mittel-mischziel` 200 von 200 gleich, Strahlverfolgungen −17 %, `mittel-sammelstelle` 200 von 200,
  −20 %, `mittel` 200 von 200, −1 %, `schwer` 200 von 200, −6 %; bei keinem Seed mehr. `schwer-mischziel` 199 von 200
  (Seed 120 liefert jetzt ein Level), −29 %, ein Seed mehr. Die CPU-Zeit taugt bei „mittel“ dafür nicht: Dieselben
  115 Level von `mittel-mischziel` kosteten 2,4, 7,7, 10,0, 12,1 und 12,2 CPU-s (Faktor 5, gleiches `--jobs`). Die
  Kosten in den Hinweisen für 24–26 sind darum nur Grössenordnungen.
- **Methodik:** Alle Messungen der Ausbeute und von Fund 2 mit `--jobs 7`, abwechselnd im selben Lauf von `leise.sh`;
  die Tabelle stimmt mit den gespeicherten Messungen (`t28\M-…`, `S-…`, `F-…`) überein.
- **Bedarf** unabhängig nachgerechnet (Reihenfolge und Grad aus `index.html`, Duldung aus `tools/levelliste.json`,
  Haupt-Kernidee aus einem neuen Lauf von `ordne-level.mjs --json`): beide Tabellen gleich, Summen 13 / 13 / 8 und
  57 / 19 / 8, Grade leicht 1–31, mittel 32–105, schwer 106–137, sehr schwer 138–150.
- **Erkennbar für Spieler:** Die festen Seeds des Tests (alle 17 liefern) und je drei weitere Level ab Seed 201 mit
  `show.mjs` und der Begründung der Beurteilung angesehen. Abschalten: Die Quelle neben dem Ziel erreicht es mit einem
  Spiegel, wird aber für andere Ziele gebraucht (etwa mittel, Seed 1: Gelb über ein Prisma zu Rot und Grün); Farben
  abzählen: knappe Grundfarbe mit drei (bis vier) Quellen, die Leitfarbe legt eine Zuordnung fest; Lockvogel: Ring
  mit Prismen vor den Spiegeln, der feste Spiegel oder Blocker bekommt im Tausch Licht. Das ist die Kernidee im Sinn
  des Glossars, nicht nur gezählt.
- **Wie oft angedockt wird** (instrumentierte Kopie, Seeds 1–60 bzw. 1–100):
  - Abschalten: Im Baustein kommt A nur in 10 von 100 (mittel) bzw. 6 von 60 (schwer) Seeds über einen Spiegel von B
    ans Ziel, sonst gleich (README angepasst). Von 39 Seeds, die bei mittel an einem Füllteil enden, ist es 17-mal der
    Strang von A (A und ihr Spiegel unberührt, die übrigen Spiegel nicht Kernidee, also nichts andockbar) und 17-mal
    der Strang von B (alles Kernidee).
  - Lockvogel: nie (Ringspiegel unberührt, Quellen schon in Mischung); `andocken` wirkt dort nur über `fremdfarbe`.
  - Farben abzählen: oft, auch mit neuer Quelle; bei mittel haben 24 von 34 Leveln vier Quellen.
- **Tests** (nach den Änderungen unten), alle grün: golden (2 s), logic (548, 25 s), generator (28, 69 s, nach der
  Umbenennung noch einmal 72 s), beurteilung (177, 73 s), levelliste (30, 51 s), ki-tester (62, 0 s).

**Im Review behoben** (Commit `0b94467`):
- `andocken.mjs`: Das vorgeschaltete Prisma nennt die Zelle seiner Quelle in `vor`; `quelle` ist nur noch eine neue
  Quelle. Je Seed gleich wie vorher (mittel/schwer-abzaehlen und -abschalten, 230 Seeds, samt Strahlverfolgungen).
- `lockvogel.mjs` und README: Am Ring findet „schwerer“ nichts zum Andocken. README: A bekommt nur, wo es geht, ihr
  Ziel über einen Spiegel von B; die Quellen des Andockens teilen immer keine Grundfarbe mit den Zielen der Kernidee,
  die des Ergänzens nur mit `fremdfarbe` (so auch `bausteine/index.mjs`). `vorgaben.mjs`: Das Andocken darf eine
  Quelle über `quellen` setzen. `bench.mjs`: Der Kopf nennt die Zählung je Grad und Haupt-Kernidee.
- Hier und in Ticket 25: Auf 131–140 haben Abschalten und Farben abzählen schon je 2, nicht Falle und Abschalten.

**Offen:**
1. **Abschalten knapp unter der Schwelle** (mittel; Abnahme, dritter Punkt): Aus Seeds 1–200 kommen 17 / 16 Level mit
   Abschalten als Haupt-Kernidee, aus 201–400 nur 9 / 7 (mittel / schwer), im Mittel also etwa 13 / 11 je 200 Seeds.
   Die Abnahme ist damit nur für die gemessenen Seeds erfüllt. Entweder die Ausbeute heben (Hebel: In „schwerer“
   dürfen auch die drehbaren Spiegel ausserhalb der Kernidee eines genannten Füllteils andocken, A und ihr Spiegel
   bleiben unberührt; das trifft den Strang von A, 17 von 39 Füllteilen; oder A im Baustein öfter über B führen) und
   in mindestens zwei Bereichen zu 200 Seeds mindestens 10 zeigen, oder den dritten Punkt über seinen Nachsatz
   abnehmen (warum es an der Kernidee liegt, Bedarf trotzdem gedeckt: Abschalten ist in keinem Fall unentbehrlich,
   und bei „mittel“ kosten 100 Seeds rund 5 CPU-s). In beiden Fällen die Zahlen hier und in den Hinweisen in 24 und 25
   (17 bzw. 16) mit der Spanne nachführen.
2. **Vier Quellen in „mittel“** (niedrig): `plan.andocken.quellen` erlaubt bei Farben abzählen (und Lockvogel) eine
   Quelle über der Vorgabe; bei `mittel-abzaehlen` haben 24 von 34 Leveln (Seeds 1–60) vier Quellen, im Spiel kein
   einziges mittleres Level. Unter „Abweichungen und Entscheide“ begründen (oder auf `quellen[1]` begrenzen und neu
   messen); für die KI-Tester in 24 ist das ein sichtbarer Unterschied.

**Urteil:** Code, Bedarf, „leicht“ bitgleich, Fund 2 und die Messmethode sind in Ordnung. Bereit zum Mergen nach
Punkt 1 (Ausbeute oder Begründung samt Zahlen) und Punkt 2 (Begründung).
