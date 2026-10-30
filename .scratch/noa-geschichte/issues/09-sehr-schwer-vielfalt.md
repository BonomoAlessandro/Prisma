# 09: Neue sehr schwere Level statt der Platzhalter

**Spec:** ../spec.md

**Blocked by:** 04. Kommt vor Ticket 08 (Entscheid des Nutzers, 29.10.2026), damit die Abnahme den
Endstand prüft und die Werkzeuge aus Ticket 01 noch da sind. **Wann es läuft, entscheidet der Nutzer**; das
Generieren hält die Sperre von `tools/leise.sh` lange (in Ticket 01 rund 1½ h) und läuft nicht neben anderen Proben.

**Status:** ready-for-agent

**What to build:** In «sehr schwer» geht die Vielfalt der Wahl nicht auf (Ticket 03, Entscheid des Nutzers vom
29.10.2026): Die 60 Level haben fast nur 5 Haupt-Kernideen zu je etwa 12, darum steht in vielen Fenstern von 10
aufeinanderfolgenden Leveln dieselbe Haupt-Kernidee drei- oder viermal. Diese Level sind Platzhalter. Vor dem Aufräumen
und der Abnahme (Ticket 08) werden neue, passende sehr schwere Level generiert und ersetzen so viele Platzhalter,
dass die Regel ganz aufgeht: dieselbe Haupt-Kernidee höchstens zweimal je 10 aufeinanderfolgende Level, auch über
Weltgrenzen, mit höchstens 3 Plätzen Abweichung vom Rang nach Schwierigkeit.

- [ ] Ausgangslage aus `tools/geschichte/wahl.json` (`grade["sehr schwer"].verstoesse`): welche Haupt-Kernideen an
      welchen Stellen zu oft stehen, welche fehlen; daraus der Bedarf an neuen Leveln je Haupt-Kernidee und Bereich
      der Schwierigkeit. Zuerst prüfen, was beurteilte, nicht abgelehnte Kandidaten aus Ticket 01 (Lauf `ausbau-noa-1`
      und frühere `ausbau-…`) schon decken; erst den Rest generieren.
- [ ] Generieren mit Haupt-Kernideen, die in «sehr schwer» selten sind (z. B. Lockvogel oder Ideen, die der
      Generator in anderen Graden kennt), im passenden Bereich der Schwierigkeit; über `tools/ausbau.mjs` wie in
      Ticket 01, nur über `tools/leise.sh` mit `LEISE_CPU=50`.
- [ ] Vorauswahl wie in Ticket 01 (Grad «sehr schwer», genau eine Lösung, keinem Level in Spiel und Vorrat zu
      ähnlich), dann ein Lauf der KI-Tester; nur nicht abgelehnte mit gutem Urteil kommen in Frage.
- [ ] Die Wahl (`tools/geschichte.mjs wahl`) nimmt die neuen Level in den Pool; die ersetzten Platzhalter gehen in
      den Vorrat (`tools/vorrat.mjs`). `verstoesse` ist leer, der Test erlaubt in «sehr schwer» keine Verstösse mehr.
- [ ] Titel: Die Plätze behalten ihre Titel; neue Level bekommen einen Schlüssel (`name`) im Stil der übrigen sehr
      schweren (Sternnamen), eindeutig über Spiel und Vorrat und nicht von der Liste entfernter Level.
- [ ] Speicherstand: Vor dem Merge gibt es keine Spielstände von Spielern; ersetzte Level brauchen keinen Übergang.
      Bestehende Teststände dürfen verfallen (im Ticket festhalten).
- [ ] Probe im Browser: ein Durchgang durch eine Welt von «sehr schwer» mit neuen Leveln.
- [ ] Alle Tests grün; Review nach dem Ticket.

## Comments

**Analyse vor dem Generieren (30.10.2026; ohne Generieren, ohne KI-Tester, nur der Bericht geändert)**

Rechenweg: die 60 aus `wahl.json`, Schwierigkeit ungerundet aus der Beurteilung (gibt genau die Ränge der Datei);
`ordneUeberGrenzen` aus `tools/geschichte.mjs` (importiert) ergibt dieselbe Anordnung wie die Datei. Für den Bedarf
eine eigene Suche nach dem Muster von `ordneUeberGrenzen` (gleiche Regeln: höchstens 3 Plätze vom Rang, auch über
Weltgrenzen, höchstens 2 je Haupt-Kernidee in 10 aufeinanderfolgenden Leveln), in der das Level eines Rangs durch ein
gedachtes neues Level derselben Schwierigkeit (gleicher Rang) mit anderer Haupt-Kernidee ersetzt werden darf; jedes
Ergebnis gegengeprüft mit dem importierten `ordneUeberGrenzen` bzw. `waehleGrad`. Schweres über `leise.sh`
(`LEISE_CPU=50`). Hilfsskripte nur im Scratchpad. Abkürzungen: Ab Abschalten, Fa Falle, Fz Farben abzählen,
Mi Mischziel aus zwei Quellen, Sa Sammelstelle, Lo Lockvogel; R Rang nach Schwierigkeit (1–60).

1. **Ausgangslage.** Ab 12, Fa 12, Fz 12, Sa 12, Mi 11, Lo 1.
   - Je Welt (heutige Anordnung): Bergwald Ab 3, Sa 2, Mi 2, Fz 2, Fa 1; Meer je 2 von Fa, Ab, Sa, Mi, Fz; Wüste Mi 3,
     Sa 3, Ab 2, Fz 2; Vulkan Fa 2, Sa 2, Fz 2, Ab 2, Mi 1, Lo 1; Planeten Fa 3, Fz 2, Sa 2, Ab 2, Mi 1; Sterne Fa 4,
     Mi 2, Fz 2, Sa 1, Ab 1.
   - Je Band: unter 91 (26 Level) Ab 7, Mi 7, Fz 5, Sa 4, Fa 3; 91–96 (22) Sa 6, Fz 5, Fa 4, Ab 4, Mi 2, Lo 1; ab 96
     (12) Fa 5, Sa 2, Mi 2, Fz 2, Ab 1. Es fehlen Lockvogel (einer), Falle zwischen R17 und R33 (89,4–91,7: keine),
     Mischziel in 91–96 (2) und Abschalten ab 96 (1).
   - Verstösse: 34 in 30 von 51 Fenstern, Zuviel 37 (nach Rang ohne Verschiebung 71 in 51, Zuviel 99). Mi 10
     Fenster, Zuviel 11 (Plätze 12–32 und 45–54, 14–23 viermal); Sa 10, Zuviel 10 (17–39); Fz 7, Zuviel 7 (6–15,
     20–29, 28–44); Fa 4, Zuviel 6 (41–60, 50–59 und 51–60 viermal); Ab 3, Zuviel 3 (1–17, 39–48). Am häufigsten in
     Fenstern mit Verstoss: Abendrot, Kugelsternhaufen, Pollux (je 8), Weissabgleich (7), Regulus (6).
   - Warum es nicht aufgeht: Mit fünf Ideen zu 12 muss jede in jedem Fenster genau zweimal stehen (Takt von 10), die
     Ränge häufen aber. Engstellen (Rangbereich, der mehr Level einer Idee hat, als die Plätze ±3 fassen): Fa R34–60
     9 Level für 6 Plätze (mindestens 3 weg); Mi R17–29 6 für 4 (2 weg: Hyaden, Sonnenwind, Abendrot, Weissabgleich,
     Weisser Zwerg, Rigel); Ab R2–14 5 für 4 (Sternenstaub, Kanopus, Wega, Kastor, Aldebaran); Sa R27–31 3 von 4 für 2
     (Regulus, Kugelsternhaufen, Pollux, Leitstern); Fz R37–39 3 für 2 (Prokyon, Roter Riese, Gezeitenkraft).
2. **Bedarf: mindestens 9 Ersatzlevel, und 9 reichen.** Je Idee für sich wären es 8 (Fa 3, Mi 2, Ab, Sa, Fz je 1);
   über die Plätze gekoppelt geht es mit 8 nicht, auch wenn die neuen in keinem Fenster zählten (gerechnet). Mit 9
   geht es; zwei Lösungen, je mit dem importierten `ordneUeberGrenzen` gegengeprüft (Pool genau 60, 0 Verstösse):
   - **A, 9 Lockvögel** (je mit der Schwierigkeit zwischen den Nachbarn): statt Wega (88,5–88,8), Sonnenwind
     (89,5–90,0), Abendrot (90,0–90,2), Kugelsternhaufen (91,0), Prokyon (92,3–92,8), Neutronenstern (93,8–94,6),
     Thuban (96,1–96,2), Raumzeit (96,2–96,4), Shaula (98,4–98,7). 70 Plätze verschoben, 36 Level.
   - **B, ohne Lockvogel** (die Lösung mit den wenigsten Lockvögeln hat keinen): Mi statt Wega (88,5–88,8), Sa statt
     Sonnenwind (89,5–90,0), Fa statt Abendrot (90,0–90,2), Fa statt Regulus (90,9–91,0), Fa statt Leitstern
     (91,2–91,5), Mi statt Antares (91,7–92,0), Mi statt Roter Riese (92,7–92,8), Sa statt Raumzeit (96,2–96,4), Ab
     statt Shaula (98,4–98,7). 96 Plätze, 49 Level. Gebraucht sind also gängige Ideen an den richtigen Stellen, vor
     allem **Falle bei 90–91,5** und Mischziel bei 88,6 und 92–93.
   - **Wer rausfällt:** Kein einzelner Platzhalter ist zwingend (je einen der 13 aus diesen Lösungen gesperrt: es geht
     weiter mit 9). Zwingend sind nur die Engstellen oben. Die Lösung mit den schwächsten ersetzten (Ideen frei) nimmt
     Sonnenwind (Rang in der Bewertung 60), Antares (58), Raumzeit (53), Abendrot (52), Neutronenstern (51), Shaula
     (44), Prokyon (43), Wega (34), Kugelsternhaufen (19); darunter Shaula aus Ticket 01. Welche es am Ende sind, hängt
     an Schwierigkeit und Idee der echten Kandidaten (das Modell nimmt den Rang des ersetzten; ±3 gibt Spielraum).
   - **Weg im Code (wichtig):** Ticket 09 legt die ersetzten Platzhalter in den Vorrat; der Vorrat gehört über `ALLE`
     zum Pool. Dann hat der Pool 69 statt 60, und `waehleGrad` nimmt den Weg der übrigen Grade (Sechstel, ±2 in der
     Welt; `UEBER_GRENZEN` wirkt nur bei genau 60). Gerechnet mit den Lösungen A und B (neue mit Gefühl 4,5):
     14 Verstösse (Zuviel 14) bzw. 35 (Zuviel 41), und es fallen andere Level heraus. Nur mit Pool genau 60 geht es
     auf. Ticket 09 braucht darum eine Änderung an `tools/geschichte.mjs`: die ersetzten aus dem Pool von «sehr schwer»
     nehmen (etwa eine Liste neben `sehr-schwer-neu.json`), oder für «sehr schwer» eine Wahl von 60 aus mehr als 60
     mit ±3 über die Weltgrenzen.
3. **Was schon da ist.** Im Protokoll 100 Kandidaten mit Grad «sehr schwer» aus Läufen `ausbau-…`; 47 stehen in Spiel
   oder Vorrat, 53 nicht: 35 aus `ausbau-noa-1`, 18 aus früheren (`ausbau-v2` 8, `ausbau-v-oben` 4, je einer aus
   `ausbau-1`, `-1-2`, `-1-3`, `-3-v`, `-5-3`, `-5-6`). Von beiden abgelehnt 3 (70b8922a Füllteil, 849fc21b
   Scheinmischung, 8a76a70d Knäuel). Gefühl ab 3 und Aha: 48 (die «48 weiteren» aus Ticket 01; 34 aus `ausbau-noa-1`,
   14 frühere), Gefühl im Mittel 5,0 zweimal, 4,5 14, 4,0 13, 3,5 14, 3,0 5; Aha bei beiden in allen 48.
   - **Die Leveldaten fehlen.** `tests/output/noa/` gibt es nicht mehr (weder hier noch im Hauptrepo noch in den
     Scratchpads), ebenso die Eingaben der KI-Tester (`tests/output/ki-tester/ausbau-noa-1/`) und die Pools der
     früheren Läufe; das Protokoll hat nur den Abdruck. Auftrag und Seed stehen nur für die 15 gewählten fest. Darum
     **ungeklärt:** Haupt-Kernidee je Kandidat, genaue Schwierigkeit, Spielwert, Ähnlichkeit zu den 240 und zum
     Vorrat, wie viel vom Bedarf sie decken und ob die Regel mit ihnen allein aufgeht.
   - Geschätzt (nicht nachgerechnet): Schwierigkeit über den Platz der Formel im Protokoll, eingeklammert durch
     Kandidaten desselben Laufs mit bekannter Schwierigkeit (bei `ausbau-noa-1` die 13 gewählten): von den 35 unter
     88,9: 7; 88,9–92,0: 10; 92,3–93,0: 3; 93,8–96,1: 4; 96,1–98,7: 6; über 98,7: 5 (einer mit Gefühl 2,5).
     Haupt-Kernideen der 35 aus der Vorauswahl von Ticket 01 (je Idee 9, Lockvogel 3, weniger die 13 gewählten):
     Ab 6, Fa 6, Fz 9, Mi 7, Sa 5, Lo 2. Belegte die Vorauswahl die Bänder reihum, bleiben unter 91 etwa Fa 3, Mi 3,
     Sa 2 und ab 96 Ab 3, Sa 2: der Zahl nach passt das zu Lösung B, sicher erst mit den Leveldaten. Nach den Filtern
     von Ticket 01 haben die 35 eine Haupt-Kernidee und Spielwert ab 60, sind keinem damals 500 flachen Level (heute
     Spiel und Vorrat ohne die 15 neuen) zu ähnlich und untereinander (also auch zu den 15) unter 0,35; die früheren
     bestanden die Filter des Ausbaus ihrer Zeit.
   - **Nachbaubar:** die 35 aus `ausbau-noa-1` ja, aber nur über einen Nachbau der beiden ganzen Pools von Ticket 01
     (Seed je Kandidat unbekannt). Generator und Beurteilung sind seit `33a933c` nur im Lader geändert, und Ticket 04
     baute Pollux, Shaula und Thuban mit gleichem Abdruck nach. Die früheren nicht (Aufträge und Seeds unbekannt).
4. **Was der Generator kann.** Sechs Kernideen (Bausteine Ab, Fa, Fz, Lo, Mi, Sa) und «ohne», in allen Graden
   dieselben; in «sehr schwer» 7 Aufträge (`sehr schwer`, `-abschalten`, `-falle`, `-abzaehlen`, `-lockvogel`,
   `-mischziel`, `-sammelstelle`). Weitere Ideen aus tieferen Graden gibt es nicht; ohne Haupt-Kernidee verwirft der
   Generator ein sehr schweres Level (Grund «ab mittel ohne nötige Kernidee»). Die Haupt-Kernidee folgt der Rangfolge
   Fa, Ab, Fz, Sa, Lo, Mi: Lockvogel nur, wenn keine der vier ersten nötig ist, in grossen Leveln selten. Ausbeute
   «sehr schwer» (Ticket 28/29, Seeds 1–500 je Auftrag, verlangte Idee = Haupt-Kernidee): Mi 26, Fz 14, Ab 7, Fa 6,
   Sa 5, Lo 0; `sehr schwer-lockvogel` 0 Level aus 500 Seeds («nicht bestellen»). Ticket 01: 738 Level aus 21 000
   Seeds, Lockvogel 7, in der Vorauswahl 3 («mehr taugten nicht»); Ausbau Ticket 07: 2 von 107 Lockvögeln bestanden die
   Filter. Algol kam aus `sehr schwer-mischziel`. In «sehr schwer» selten ist nur Lockvogel (1 von 60); Lösung A
   (9 Lockvögel in bestimmten Bändern) wäre grob 5–8 h Rechnen und unsicher, Lösung B braucht keine seltene Idee.
5. **Plan für das Generieren.**
   - Vorher entscheiden: Pool von «sehr schwer» genau 60 (ersetzte aus dem Pool) oder Wahl aus mehr als 60 (Punkt 2).
   - Stufe 1, Nachbau der Pools von Ticket 01 (gleiche Aufträge und Seeds; `index.html` dann ohne offene Änderungen,
     sonst steht der Stand mit «+»; nicht neben anderen Proben):
     `LEISE_CPU=50 sh tools/leise.sh node tools/ausbau.mjs pool "sehr schwer" "sehr schwer-abschalten"
     "sehr schwer-falle" "sehr schwer-abzaehlen" "sehr schwer-lockvogel" "sehr schwer-mischziel"
     "sehr schwer-sammelstelle" --aus tests/output/noa/pool-ss-1.jsonl --seed 40001 --seeds 3000 --jobs 9`, dann
     dasselbe mit `--aus tests/output/noa/pool-ss-2.jsonl --seed 50001 --seeds 2000 --schwierigkeit 96,112 --jobs 9`.
     Erwartet 738 + 114 Level, darin die 48 Abdrücke (Probe). Dauer wie Ticket 01, etwa 55 + 36 min: 9 Prozesse sind
     45 % von 20 Kernen, die Grenze von 50 % bremst sie kaum (geschätzt).
   - Stufe 2 (Minuten): Haupt-Kernidee, Schwierigkeit, Spielwert, Ähnlichkeit zu den 815 flachen Leveln in Spiel und
     Vorrat; dann die Suche aus Punkt 2 mit echten Kandidaten (60 aus den 60 und den 34 beurteilten, wenige Ersatzlevel,
     schwächste raus). Geht es auf, braucht es keinen Lauf der KI-Tester.
   - Stufe 3, nur für offene Stellen: Vorauswahl aus den rund 800 unbeurteilten des Pools (2–3 je Stelle), sonst
     gezielt, etwa `… pool "sehr schwer-falle" "sehr schwer-mischziel" "sehr schwer-sammelstelle" --aus
     tests/output/noa/pool-ss-3.jsonl --seed 60001 --seeds 2000 --schwierigkeit 89,93 --jobs 9` (etwa 16 min) bzw.
     `"sehr schwer-abschalten" "sehr schwer-sammelstelle" … --schwierigkeit 96,99`; dann KI-Tester Lauf
     `ausbau-noa-2` wie `ausbau-noa-1` (wenig Rechnen, die Dauer liegt bei den Urteilen).
   - Stufe 4, Einbau: `ordne-level.mjs --ausbau`, Sternnamen, Platzhalter in den Vorrat, Pool-Regel aus dem Entscheid,
     `geschichte.mjs wahl` und `spiel`, Test auf 0 Verstösse, alle Tests über `leise.sh`.
   - Plan B: Fehlt eine Stelle, zuerst einen anderen Ersatz suchen (es gibt viele Mengen zu 9, kein Platzhalter ist
     zwingend), dann mehr als 9 ersetzen; Lockvögel nur als letztes Mittel (teuer). Geht es trotzdem nicht ganz auf:
     melden statt lockern (Entscheid vom 29.10.2026).
   - **Entscheide:** (1) Freigabe und Zeitpunkt des Generierens (Stufe 1, etwa 1½ h Sperre von `leise.sh`) – Nutzer.
     (2) Weg im Code für den Pool von «sehr schwer» (Punkt 2); er ändert, was Ticket 09 zum Vorrat sagt – Nutzer
     oder Koordinator. (3) Dass Lösung B ohne Lockvogel gilt (das Ticket nennt Lockvogel als Beispiel) – zur Kenntnis.

**Entscheid des Koordinators zum Pool (30.10.2026):** Die Wahl für «sehr schwer» wählt künftig 60 aus einem grösseren
Pool (Spiel, Vorrat und neue Kandidaten) mit denselben Regeln wie heute (±3 über die Weltgrenzen, Vielfalt vor
Bewertung, nächstbestes Level mit anderer Haupt-Kernidee). So bleiben ersetzte Platzhalter im Vorrat, ohne die Wahl
zu verfälschen, und die Regel aus der Spec («Lässt sich beides nicht erfüllen, kommt das nächstbeste Level mit anderer
Lösungsart») gilt auch hier. `waehleGrad`/`UEBER_GRENZEN` werden dafür verallgemeinert (Teil dieses Tickets).

**Stufe 1 und 2 (30.10.2026; Freigabe des Nutzers für Stufe 1; kein weiteres Generieren, kein Lauf der KI-Tester,
nur dieser Bericht geändert)**

- **Stufe 1, Nachbau der Pools von Ticket 01** (ein Lauf über `leise.sh`, `LEISE_CPU=50`, `--jobs 9`, 12:14–13:22,
  68 min): `tests/output/noa/pool-ss-1.jsonl` (738 Level, Seeds 40001–43000, die sieben Aufträge) und
  `pool-ss-2.jsonl` (114, Seeds 50001–52000, `--schwierigkeit 96,112`), genau so viele wie damals. Vorprobe vor dem
  Lauf (`generiere.mjs`, zwei bekannte Seeds) und Probe nach dem ersten Auftrag: Abdruck stimmt. Am Ende stimmen alle
  13 bekannten Seeds aus `sehr-schwer-neu.json` (Auftrag, Seed, Abdruck), und alle 48 Kandidaten aus `ausbau-noa-1`
  sind wieder da. Die Zeilen tragen `stand` mit «+», weil `index.html` offene Änderungen von Ticket 05 hatte; die
  Spiellogik ist davon nicht berührt (Abdrücke gleich).
- **Stufe 2, die 35 beurteilten Kandidaten ausserhalb des Spiels** (bewertet mit `bewerte` aus `tools/geschichte.mjs`
  zusammen mit den 60, importiert): keiner abgelehnt, alle «sehr schwer» mit Haupt-Kernidee und Spielwert ab 84,8,
  keinem flachen Level in Spiel und Vorrat zu ähnlich (höchstens 0,26), untereinander unter 0,35. Haupt-Kernideen
  Mi 7, Fz 9, Sa 5, Fa 6, Ab 6, Lo 2 (wie aus Ticket 01 geschätzt). Schwierigkeit 87,9–106,8; vier liegen über allen
  60 heutigen (99,6, 101,0, 102,4, 106,8). In Frage kommen 34 (Gefühl ab 3 und Aha; 525422a7 mit Gefühl 2,5 nicht).
- **Die Wahl von 60 aus den 60 und den 34** mit den Regeln von «sehr schwer» (Entscheid des Koordinators: Rang nach
  Schwierigkeit unter den 60 gewählten, höchstens 3 Plätze davon, auch über Weltgrenzen; höchstens 2 je Haupt-Kernidee
  in 10 aufeinanderfolgenden; Vielfalt vor Bewertung, Bewertung als kleinste Summe der Ränge in der Bewertung wie
  `besteMenge`). Gerechnet im Scratchpad mit eigener Suche über die Plätze und lokaler Suche, jede Lösung gegengeprüft
  mit dem importierten `ordneUeberGrenzen` und `fensterVerstoesse`. **Die Regel geht ganz auf: 0 Verstösse.** Eine
  genaue Suche über alle Mengen sprengte den Speicher; die Mengen unten sind darum die besten **gefundenen**, nicht
  bewiesen beste.
  - **Nach Bewertung (die Regel des Entscheids): 23 rein, 23 raus.** Summe der Ränge 1968 (ohne Vielfalt bestenfalls
    1770). Gefühl im Mittel der 60: 4,19 statt 3,87. Haupt-Kernideen danach Ab 12, Sa 12, Fz 12, Fa 12, Mi 10, Lo 2.
    Verschoben 45 Level, zusammen 88 Plätze.
    - Rein (Schwierigkeit, Idee, Gefühl): aad8ee01 88,0 Fz 4,0; dd52f00a 88,5 Mi 4,5; b15759ab 88,6 Sa 4,0;
      7bad0b0c 88,7 Fz 5,0; 4d11a993 88,8 Sa 4,5; f09bb21b 88,9 Fa 4,5; 239dd03f 89,1 Fz 3,5; 7c2319ec 89,4 Mi 4,0;
      0dc0739b 90,9 Ab 4,5; 2fb3afb5 91,0 Fa 4,0; be9c3fb2 91,1 Fa 3,0; 928f2230 91,5 Ab 4,5; f4e9da8e 91,7 Mi 4,0;
      8cde63f2 91,8 Fz 5,0; 330805ef 92,3 Lo 3,5; 192e9bb4 92,4 Mi 3,5; 7d2b8d12 92,7 Mi 4,0; a6700df9 93,8 Ab 3,5;
      12a1b927 95,0 Fz 4,5; 24d655cd 96,2 Sa 4,5; 929badef 99,6 Ab 4,5; 69d92fd5 102,4 Ab 4,5; aa669d97 106,8 Fz 4,5.
      Aha bei allen von beiden; Spielwert 88,4–96,8.
    - Raus: Spica, Abendstern, Wega, Galaxis, Andromeda, Hyaden, Deneb, Sonnenwind, Abendrot, Arktur, Pulsar, Weisser
      Zwerg, Regulus, Plejaden, Antares, Prokyon, Roter Riese, Neutronenstern, Milchstrasse, Raumzeit, Schwarzes Loch,
      Sternnebel, Shaula (Gefühl 3,0–4,0, meist 3,0–3,5; darunter Shaula aus Ticket 01).
    - Nicht gewählt: 11 Kandidaten (0a93f026, 2b606bcd, ac0fd637, fd747d28, f043193d, cff39df8, 0bad3327, b2fa2853,
      25582948, af87cceb, 3e415b77).
  - **Mit den wenigsten Tauschen: 7 rein, 7 raus.** Rein f09bb21b (Fa 88,9, Gefühl 4,5), be9c3fb2 (Fa 91,1, 3,0),
    330805ef (Lo 92,3, 3,5), 7d2b8d12 (Mi 92,7, 4,0), 24d655cd (Sa 96,2, 4,5), 69d92fd5 (Ab 102,4, 4,5), aa669d97
    (Fz 106,8, 4,5); raus Wega, Sonnenwind, Abendrot, Regulus, Prokyon, Raumzeit, Shaula. Verschoben 48 Level,
    96 Plätze. Ob 6 Tausche reichen, ist ungeklärt (genaue Suche zu gross). Weniger als die 9 der Analyse, weil echte
    Kandidaten eigene Schwierigkeiten haben und die zwei schwersten das obere Ende erweitern.
- **Offen für Stufe 3: nichts.** Die Regel geht mit den beurteilten Kandidaten ganz auf, ohne neues Generieren und ohne
  Lauf der KI-Tester. Zu entscheiden bleibt, ob die Wahl wirklich nach Bewertung tauscht (23 Level neu, die Geschichte
  in «sehr schwer» wird deutlich besser bewertet) oder so wenig wie möglich (7). Die Mengen oben hängen an der
  genauen Regel, die `waehleGrad` in Stufe 4 bekommt (Bewertung als Summe der Ränge oder anders); die Wahl in Stufe 4
  rechnet sie neu.

**Entscheid des Nutzers (30.10.2026, nach Stufe 2):** Die Wahl für «sehr schwer» tauscht **nach Bewertung** (gleiche
Regel wie in den übrigen Graden: beste Bewertung, Vielfalt vor Bewertung, ±3 über die Weltgrenzen), also rund 23
Platzhalter gegen besser bewertete, schon beurteilte Kandidaten aus `ausbau-noa-1`. Stufe 3 (neu generieren, neuer
Lauf der KI-Tester) entfällt. Die Leveldaten der Kandidaten werden versioniert abgelegt, damit sie nicht wieder nur in
`tests/output/` liegen. Einbau (Stufe 4) nach Ticket 07.

**Wahl und Werkzeug für Stufe 4, ohne Einbau (30.10.2026, Branch `feature/noa-09-wahl` ab `63c44b7`)**

- **Pool und Regeln** (`tools/geschichte.mjs`, Kopf und Abschnitt «Wahl über den ganzen Grad»): Der Pool von «sehr
  schwer» sind die 60 aus Spiel und Vorrat und die 35 Kandidaten aus `tools/geschichte/sehr-schwer-kandidaten.json`
  (`kandidatenLevel`, im Pool als `ersatz`, unter ihrem Schlüssel oder ohne Schlüssel unter dem Kandidatennamen).
  Kandidaten nur mit gutem Urteil wie in Ticket 01 (Gefühl im Mittel ab 3, Aha bei mindestens einem; `GUT_AB`,
  `gutesUrteil`): 525422a7 steht in `wahl.json` unter `ausgeschlossen` (Gefühl 2,5, Aha 0,5). `waehleGrad` nimmt mit
  `UEBER_GRENZEN` jetzt immer `waehleUeberGrenzen`: kein abgelehntes, keines einem gewählten Level eines anderen Grads
  oder einem besser bewerteten des Pools zu ähnlich (heute keines); gehen die 60 am besten bewerteten mit ±3 auf, gelten
  sie, sonst die Menge mit der kleinsten Summe der Ränge in der Bewertung, die sich mit ±3 über die Weltgrenzen ohne
  Verstoss anordnen lässt (wie `besteMenge`), angeordnet mit `ordneUeberGrenzen` (kleinste Verschiebung). Geht keine,
  die 60 besten mit dem kleinsten Zuviel (nicht gelockert). Die Sechstel gelten in «sehr schwer» nicht; der Abschnitt
  einer Welt in `wahl.json` ist der Teil des Pools, aus dem ihre Ränge kommen, und `vielfalt` nennt «statt X (besser
  bewertet): nicht in der besten gefundenen Menge …». Die übrigen drei Grade rechnen wie bisher.
- **Suche** (`besteMengeUeberGrenzen`, `sucheSchichten`): über die Plätze wie `ordneUeberGrenzen`, dazu je Platz die
  Wahl des Levels für Rang p+3; Zustand: zuletzt gewähltes Level, Haupt-Kernideen der gewählten, noch nicht gestellten
  Ränge und der letzten 9 Plätze; untere Schranke je Zustand aus den freien Plätzen je Haupt-Kernidee und den am besten
  bewerteten Leveln, die noch kommen können. **Genau geht nicht:** ohne Strahl über 6,8 Mio. Zustände schon bei Platz 8
  (gemessen, Abbruch). Darum ein Strahl von 100 000 Zuständen je Platz (nachbaubar: feste Reihenfolge nach Kosten plus
  Schranke, Verschiebungen, Schlüssel), danach Nachbessern in Fenstern von 20 Leveln des Pools (Schritt 5, innen genau),
  bis ein Durchgang nichts mehr bringt. Probe im Scratchpad: Strahl 2000 fand keine Menge, 20 000 Summe 2039, 100 000
  Summe 1959; eine iterierte lokale Suche mit fester Folge von Zufallszahlen (wie die Analyse) kam in 15 min auch nicht
  unter 1959. Kleine Fälle rechnet der Strahl genau (Test gegen alle Mengen). **Laufzeit** über `leise.sh`: `wahl` etwa
  75 s (Beurteilung 12–19 s, Wahl aller Grade 60 s, davon die Suche etwa 50 s), vorher etwa 30 s.
- **Ergebnis** (`wahl.json` neu, `verstoesse` in allen Graden leer; «leicht», «mittel», «schwer» unverändert, Prüfsumme
  im Test): **23 rein, 23 raus**, Summe der Ränge in der Bewertung **1959** (ab 0 gezählt; Analyse 1968, untere Schranke
  der Suche 1848, ohne Vielfalt 1770; steht in `wahl.json` unter `grade["sehr schwer"].suche`), **0 Verstösse**,
  Gefühl im Mittel der 60 **4,19** (vorher 3,87), verschoben 48 Level, zusammen 104 Plätze (10 über eine Weltgrenze).
  Haupt-Kernideen Ab 12, Sa 12, Fa 12, Fz 12, Mi 10, Lo 2. Gegenüber der Analyse (1968) kommt Izar (ac0fd637) statt
  239dd03f, und Kugelsternhaufen geht statt Prokyon.
  - **Rein, mit Schlüssel** (Kandidat, Schwierigkeit, Haupt-Kernidee, Gefühl, Platz): Albireo (aad8ee01, 88,0, Fz,
    4,0, Bergwald 6), Alioth (dd52f00a, 88,5, Mi, 4,5, Bergwald 10), Ankaa (b15759ab, 88,6, Sa, 4,0, Bergwald 5),
    Diphda (7bad0b0c, 88,7, Fz, 5,0, Bergwald 9), Hamal (4d11a993, 88,8, Sa, 4,5, Meer 3), Dubhe (f09bb21b, 88,9, Fa,
    4,5, Bergwald 8), Alhena (7c2319ec, 89,4, Mi, 4,0, Meer 7), Enif (0dc0739b, 90,9, Ab, 4,5, Wüste 2), Kochab
    (2fb3afb5, 91,0, Fa, 4,0, Wüste 4), Menkar (be9c3fb2, 91,1, Fa, 3,0, Wüste 8), Merak (928f2230, 91,5, Ab, 4,5,
    Vulkan 1), Sadr (f4e9da8e, 91,7, Mi, 4,0, Wüste 10), Mintaka (8cde63f2, 91,8, Fz, 5,0, Wüste 9), Izar (ac0fd637,
    91,8, Sa, 4,0, Vulkan 5), Nunki (330805ef, 92,3, Lo, 3,5, Vulkan 2), Saiph (192e9bb4, 92,4, Mi, 3,5, Vulkan 7),
    Markab (7d2b8d12, 92,7, Mi, 4,0, Planeten 1), Megrez (a6700df9, 93,8, Ab, 3,5, Planeten 8), Schedir (12a1b927,
    95,0, Fz, 4,5, Planeten 6), Wezen (24d655cd, 96,2, Sa, 4,5, Sterne 3), Alpheratz (929badef, 99,6, Ab, 4,5,
    Sterne 5), Alkaid (69d92fd5, 102,4, Ab, 4,5, Sterne 8), Mirfak (aa669d97, 106,8, Fz, 4,5, Sterne 9).
  - **Raus** (gehen beim Einbau in den Vorrat, bleiben im Pool): Spica, Abendstern, Wega, Galaxis, Andromeda, Hyaden,
    Deneb, Sonnenwind, Abendrot, Arktur, Pulsar, Weisser Zwerg, Regulus, Kugelsternhaufen, Plejaden, Antares, Roter
    Riese, Neutronenstern, Milchstrasse, Raumzeit, Schwarzes Loch, Sternnebel, Shaula (Gefühl 3,0–4,0; Shaula aus
    Ticket 01).
  - Nicht gewählt: 11 Kandidaten bleiben ohne Schlüssel in der Datei (0a93f026, 239dd03f, 2b606bcd, fd747d28,
    f043193d, cff39df8, 0bad3327, b2fa2853, 25582948, af87cceb, 3e415b77), dazu 525422a7 (ausgeschlossen).
- **Schlüssel** (Entscheid selbst, nach dem Muster von Ticket 03): in `sehr-schwer-kandidaten.json` unter
  `level.name`, wie bei `sehr-schwer-neu.json`; nur die 23 gewählten, die übrigen bleiben leer. Sternnamen, eindeutig
  in jeder Schreibung (`schreibung`: Gross/klein, Umlaute, ß, Akzente, c/k, ph/f, th/t, y/i, v/w, Doppelbuchstaben;
  so fallen etwa Vega, Castor, Procyon, Capella als Doppel von Wega, Kastor, Prokyon, Kapella auf) über Spiel, Vorrat,
  die 15 neuen, die übrigen Kandidaten, alle Titel und `entfernteNamen` (`namenFehler`; `wahl` prüft sie vorher und
  bricht ab, wenn ein gewählter Kandidat keinen Schlüssel hat). Die Namen sind so gewählt, dass die Reihenfolge bei
  gleicher Bewertung, gleichem Spielwert oder gleicher Schwierigkeit wie unter dem Kandidatennamen bleibt (Gruppen mit
  Achernar/Spiralnebel, Pollux/Mizar/Gravitation/Kugelsternhaufen, Abendrot); so ist die Wahl mit Namen dieselbe wie
  ohne (geprüft: zweiter Lauf gleich). `titel.json` unverändert, die Titel bleiben an ihren Plätzen.
- **Speicherstand:** Vor dem Merge gibt es keine Spielstände von Spielern; die ersetzten Level brauchen keinen
  Übergang. Bestehende Teststände in «sehr schwer» (`prisma.noa.sehr-schwer`) dürfen verfallen: Platz und gelöste
  Level beziehen sich danach auf die neue Reise.
- **Tests** (`tests/geschichte.test.mjs`): Vielfalt in allen Graden ohne Verstoss; «sehr schwer» 60 aus mehr als 60,
  die besten 60 gehen nicht auf, die gewählten schon, Summe der Ränge wie in der Datei und ≤ 1968, nicht unter der
  unteren Schranke, Level in Nachbarwelten mit Grund; übrige Grade unverändert (Prüfsumme aus `63c44b7`); Abschnitte
  in «sehr schwer» bis zum Level mit dem letzten Rang der Welt; Kandidaten (Schlüssel genau bei den gewählten, Abdruck,
  im Pool als Ersatz, ohne gutes Urteil ausgeschlossen) mit Gegenproben zu `namenFehler` und `poolLevel`;
  `ausbauListe`; `besteMengeUeberGrenzen` gegen alle Mengen an sechs erfundenen Pools (14 Level, Menge von 12, mit
  einer eigenen Tiefensuche); `waehleGrad` mit mehr als 60 (die besten gehen auf: ohne Suche; zu ähnliche fallen weg,
  mit Grund); die erlaubten Verstösse gelten nur in ihrem Grad (jetzt an einem erfundenen Verstoss in «sehr schwer»).
  **Erwartet rot bis zum Einbau** (im Test markiert, nicht abgeschwächt): die drei Tests «Die Wahl im Spiel» (Spiel =
  Wahl, Datenblock, `spiel` ändert nichts), weil die 23 neuen Level noch nicht im Spiel stehen. Ergebnis über
  `leise.sh` im Branch: 32 bestanden, die drei erwartet roten rot (etwa 5 min).

- **Einbau (Stufe 4), Schrittfolge** – noch nicht ausgeführt; nach Ticket 06/07 auf dem Stand, in dem `index.html` frei
  ist, nacheinander, Schweres über `LEISE_CPU=50 sh tools/leise.sh`:
  1. `node tools/vorrat.mjs zurueckholen --flach` (alle 275 flachen Level aus dem Vorrat ins Spiel; `ordne-level.mjs`
     schreibt nur ohne flache Level im Vorrat).
  2. `node tools/geschichte.mjs ausbau <datei>` schreibt die 23 gewählten Kandidaten als JSON-Zeilen
     `{ level, name, auftrag, seed, schwierigkeit }` (Ziel 96–112 nur bei den Seeds aus `pool-ss-2`), wie in Ticket 04.
  3. `ordne-level.mjs --ausbau <datei>` (Bericht), dann mit `--schreiben`: die 23 kommen nach der Formel in die Reihe,
     mit Herkunft im Kommentar und in `levelliste.json` unter `ausbau`.
  4. `node tests/golden.mjs` (erwartet: nur die 23 neu, Anzahl 824 → 847), dann `node tests/golden.mjs --write`.
  5. `node tools/geschichte.mjs spiel`: legt die 23 ersetzten Platzhalter und die übrigen flachen Level (298) in den
     Vorrat, Titel und Datenblock wie `wahl.json`; ein zweiter Lauf ändert nichts.
  6. `geschichte.mjs wahl` neu: `wahl.json` muss byte-gleich bleiben (die 23 gelten im Spiel weiter als Kandidaten aus
     der Liste).
  7. Tests anpassen (unten), alle Tests über `leise.sh`, Probe im Browser (eine Welt «sehr schwer» mit neuen Leveln),
     Review, Commit.
- **Probe an einer Kopie** (Scratchpad, ohne `.git`, 30.10.2026 16:13–16:25, ein Lauf über `leise.sh`; nichts davon im
  Worktree): Schritte 1–6 laufen durch. Zurückgeholt 275; `ordne-level.mjs --ausbau` ohne Abbruch (Häufungsregel
  eingehalten, Namen eindeutig, genau eine Lösung, Urteile «388 von 388 Leveln des Ausbaus»; wie in Ticket 04 rücken
  dabei einige Level der Reihe um 1–5 Plätze, darunter Alhena, Ankaa, Markab, Hyaden, Weisser Zwerg), 40 s; Golden vor
  `--write` genau 24 Abweichungen (Anzahl und die 23 neuen), danach 847 Level; `spiel` legt 298 flache ab, zweiter Lauf
  nichts; `wahl` danach **byte-gleich** (die übrigen Grade also auch nach dem Einbau unverändert). Tests danach:
  Geschichte 35/35 (die drei bis dahin roten grün), Levelliste 55, Golden grün, Strahlregel 2032, KI-Tester 84,
  Beurteilung 206.
- **Nach dem Einbau anzupassen:**
  - `tests/vorrat.test.mjs`, «Jedes Level von vor dem Umbau … dazu nur die 15 neuen sehr schweren»: liest nur
    `sehr-schwer-neu.json`; dazu die Kandidaten mit Schlüssel aus `sehr-schwer-kandidaten.json` (sonst rot mit den 23).
  - `tests/golden.json` mit `--write` (Schritt 4).
  - Texte mit Zahlen: README («Seit Ticket 04 liegen dort die 275 flachen Level …» → 298; Levels: 515 flache → 538),
    Kopf von `tests/geschichte.test.mjs` und README-Abschnitt zum Test (der Hinweis «erwartet rot bis zum Einbau» und
    `ROT_BIS_EINBAU` im Test fallen weg).
  - Nicht wegen Ticket 09, aber in der Probe aufgefallen: In der Kopie ohne `.git` meldet `tests/wuerfelliste.test.mjs`
    «Stand ist kein Commit» (braucht Git, im Worktree nicht betroffen), und `tests/vorrat.test.mjs` «Titel: levelCode …»
    ist schon im Worktree vor Ticket 09 rot (Würfel-Vorrat mit CRLF in diesem Checkout; nicht von Ticket 09 berührt).
- **Offen:** Einbau (Schritte oben), Anpassung von `vorrat.test.mjs`, Probe im Browser, Review. Ob 1959 das Optimum
  ist, ist nicht bewiesen (untere Schranke 1848); die Wahl ist die beste gefundene und nachbaubar.
