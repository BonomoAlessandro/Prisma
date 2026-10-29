# 03: Wahl der 240 Level und Titel der Welten

**Spec:** ../spec.md

**Blocked by:** 02

**Status:** resolved

**What to build:** Je Grad die 60 Level der Geschichte, verteilt auf die 6 Welten zu je 10, nach den Regeln der Spec
(«Wahl der 240 Level»), und für jedes einen Titel, der zu seiner Welt passt. Das Ergebnis ist eine nachbaubare Datei
unter `tools/geschichte/`; das Spiel bleibt in diesem Ticket unverändert.

- [x] Werkzeug für die Wahl (z. B. `tools/geschichte.mjs wahl`): Pool je Grad aus dem Spiel, für «sehr schwer» dazu
      die 15 aus `tools/geschichte/sehr-schwer-neu.json`; Bewertung aus Urteil der KI-Tester und Spielwert, kein von
      beiden abgelehntes Level; Vielfalt vor Bewertung (Haupt-Kernidee höchstens zweimal je 10 aufeinanderfolgende
      Level des Grads, auch über Weltgrenzen; Ähnlichkeit unter 0,5); Schwierigkeit über den ganzen Bereich des Grads,
      Welt *w* mit den Rängen 10·*w* … 10·*w*+9, innerhalb der Welt Vertauschungen um höchstens 2 Plätze.
      (In «sehr schwer» nach dem Entscheid des Nutzers vom 29.10.2026 bis 3 Plätze vom Rang, auch über die
      Weltgrenze; die Vielfalt geht dort auch so nicht ganz auf, siehe Comments.)
- [x] Gleiche Eingaben ergeben die gleiche Wahl. Die Datei nennt je Level Grad, Welt, Platz, Schwierigkeit,
      Haupt-Kernidee, Bewertung und, wo die Vielfalt eine Entscheidung erzwang, warum.
- [x] Die 15 neuen sehr schweren Level bekommen einen Schlüssel (`name`) im bisherigen Stil, eindeutig und nicht von der
      Liste entfernter Level.
- [x] 240 Titel (je Welt 40) nach «Namen der Welten» in der Spec, eindeutig über alle Titel und Namen in Spiel und
      Vorrat, Schweizer Schreibweise. Der Koordinator wählt sie, ohne Freigabe des Nutzers.
- [x] Tests der Wahl: 4 × 60, je Welt 10, Grad stimmt, Schwierigkeit steigt (Ränge je Welt, Vertauschungen höchstens 2),
      Vielfalt, Ähnlichkeit, kein abgelehntes Level, genau eine Lösung, Titel eindeutig; Gegenproben an erfundenen
      Fällen.
- [x] Bericht unter `## Comments`: Verteilung der Haupt-Kernideen je Grad und Welt, Bereich der Schwierigkeit je Welt,
      wo die Vielfalt die Bewertung überstimmte.
- [x] Alle Tests grün; Review nach dem Ticket.

## Comments

**Ergebnis (29.10.2026, Branch `feature/lichtsignal-prototyp`)**

- **Gebaut:**
  - `tools/geschichte.mjs`: `wahl [--trocken]` (über `leise.sh`, etwa 30 s) rechnet die Wahl und schreibt
    `tools/geschichte/wahl.json`; `titel` ordnet nach einer Änderung in `titel.json` die Titel neu zu (ohne neue
    Wahl) und prüft sie. Regeln und Auslegungen im Kopf des Werkzeugs; die Bausteine (Bewertung, Ablehnung, Wahl je
    Welt und Grad, Anordnung, Prüfung `pruefe`, Titelprüfung `titelFehler`) sind exportiert, für Tests und Ticket 04.
  - `tools/geschichte/wahl.json`: je Grad Pool, abgelehnte Level mit Grund, die Abschnitte der Welten im Pool,
    verschobene Grenzen und (nur «sehr schwer») die Verstösse gegen die Vielfalt; dann je Level eine Zeile mit Grad,
    Welt, Platz (1–10), Name, Titel, Rang nach Schwierigkeit im Grad (1–60), Schwierigkeit, Haupt-Kernidee, Bewertung
    (Gefühl, Aha, Spielwert, Urteile und Läufe oder `geschaetzt`, Rang in der Bewertung des Pools), bei den 15 neuen
    der Kandidat, und wo die Vielfalt entschied, `vielfalt` mit Grund.
  - `tools/geschichte/titel.json`: die 240 Titel, je Welt und Grad 10 in der Reihenfolge der Plätze (Titel *k* gehört
    dem Level auf Platz *k*), von Hand editierbar.
  - `tools/geschichte/sehr-schwer-neu.json`: die Schlüssel der 15 neuen Level (sonst unverändert).
  - `tests/geschichte.test.mjs` (27 Tests, im README eingetragen), README-Abschnitt «Wahl für Noas Geschichte».
- **Auslegung «abgelehnt»** (Code und Daten): Die KI-Tester lehnen ab, wenn in einem Urteil beide einen Begriff aus «Was
  Spass verdirbt» nennen, der beim Grad gilt (Regel `merge` in `ki-tester/protocol.mjs`; Füllteil und Zerfall erst ab
  «mittel»), neu gerechnet mit dem heutigen Grad, über jedes flache Urteil zum Level (unter seinem Namen oder als
  Kandidat, auch als Anker und aus Ablauf 1, wie die Regel `stark`). Die Beurteilung lehnt ab mit einem
  Ausschlussgrund oder ab «mittel» mit einem Spielwert unter `MINDEST_SPIELWERT` 60 («kommt nicht ins Spiel»,
  `spielwert.mjs`; in «leicht» gibt es keinen). Ausgeschlossen ist, was eines von beiden ablehnt. Ein fehlendes Urteil
  ist keine Ablehnung (Hinweis des Koordinators). Ergebnis: Keine Ablehnung durch die KI-Tester und kein
  Ausschlussgrund im ganzen Pool. Ausgeschlossen sind die 25 Level unter dem Mindest-Spielwert, 21 in «mittel»
  (Lichtnetz, Streulicht, Strahlenkranz, Turmalin, Farbschleuse, Perlmutt, Bumerang, Mondlicht, Weichen, Glasbaustein,
  Fadenkreuz, Lichtschranke, Pinselstrich, Blaue Stunde, Farbtupfer, Rubin, Glühwürmchen, Spektralband, Schimmer,
  Kreuzfeuer, Smaragd) und 4 in «schwer» (Sonnenwende, Pendel, Kathedrale, Lichtjahr). Alle 25 stehen auf der Liste
  «behalten nach Urteil der KI-Tester» (Entscheid des Nutzers vom 18.10.2026). **Entschieden (Nutzer, 29.10.2026):**
  Die Auslegung bleibt, die 25 kommen nicht in die Geschichte; ein fehlendes Urteil ist keine Ablehnung (in der Spec,
  «Wahl der 240 Level», und im Kopf von `tools/geschichte.mjs` festgehalten).
- **Bewertung:** zuerst das Gefühl im Mittel über alle Urteile beider KI-Tester, dann der Anteil der Urteile mit Aha,
  dann der Spielwert (wie die Wahl der 15 in Ticket 01). Ohne Urteil (23 Level im Pool, alter Bestand) sind Gefühl und
  Aha das Mittel der 10 beurteilten Level desselben Grads mit dem nächsten Spielwert (`geschaetzt`); unter den 240 sind
  es 16 (leicht 9, mittel 1, schwer 4, sehr schwer 2: Abendstern, Lichtkegel).
- **Verfahren:** Der Pool eines Grads, nach Schwierigkeit geordnet, wird in Sechstel geteilt, je Welt eines (so
  verteilen sich die 60 über den ganzen Bereich, und Welt *w* hat die Ränge 10·*w* … 10·*w*+9). Jede Welt nimmt ihre
  10 nach der Bewertung, übergeht ein Level, dessen Haupt-Kernidee schon zweimal mit besser bewerteten in der Welt
  steht oder das einem gewählten zu ähnlich ist, und nimmt, wenn sich das nicht anordnen lässt, unter allen Mengen,
  die sich anordnen lassen, die mit der kleinsten Summe der Ränge in der Bewertung (vollständige Suche mit Schranke).
  Die Vielfalt über die Weltgrenzen ist exakt erfasst: Je Haupt-Kernidee der früheste Platz ihres ersten und zweiten
  Vorkommens in der nächsten Welt. Angeordnet wird mit den wenigsten Vertauschungen. Befund dabei: Haben zwei Welten
  nacheinander je zweimal fünf Haupt-Kernideen, muss die zweite die Folge der ersten Platz für Platz wiederholen (in
  «schwer» etwa Ab Fa Mi Fz Sa Fz Ab Fa Sa Mi in vier Welten). Darum entscheidet die Vielfalt oft, und ein Lockvogel
  oder ein Level ohne Haupt-Kernidee lockert das Muster.
- **Ergebnis je Grad und Welt** (Schwierigkeit der 10 gewählten; Haupt-Kernideen: Ab Abschalten, Fa Falle, Fz Farben
  abzählen, Mi Mischziel aus zwei Quellen, Sa Sammelstelle, Lo Lockvogel, – ohne; «statt»: gewählt statt eines besser
  bewerteten; «vert.»: Platz ≠ Rang; fett: mehr als zweimal in der Welt):

  | Grad | Welt | Schwierigkeit | Haupt-Kernideen | statt | vert. |
  |---|---|---|---|---|---|
  | leicht | Bergwald | 20,5–27,8 | – 8, Sa 2 | 0 | 0 |
  | | Meer | 28,4–32,8 | – 6, Mi 2, Sa 2 | 2 | 2 |
  | | Wüste | 32,9–35,4 | – 5, Mi 2, Ab 2, Sa 1 | 1 | 3 |
  | | Vulkan | 35,6–38,7 | – 3, Sa 2, Mi 2, Fa 2, Ab 1 | 1 | 0 |
  | | Planeten | 38,7–40,5 | – 4, Sa 2, Lo 1, Mi 1, Fa 1, Ab 1 | 2 | 7 |
  | | Sterne | 41,3–42,9 | – 2, Fa 2, Ab 2, Sa 2, Mi 2 | 1 | 6 |
  | mittel | Bergwald | 43,8–45,7 | Mi 2, Fz 2, Sa 2, Ab 2, Fa 2 | 3 | 8 |
  | | Meer | 45,9–49,6 | Mi 2, Fz 2, Sa 2, Ab 2, Lo 1, Fa 1 | 2 | 7 |
  | | Wüste | 49,8–52,1 | Mi 2, Fz 2, Sa 2, Ab 2, Fa 2 | 4 | 6 |
  | | Vulkan | 53,1–55,3 | Mi 2, Sa 2, Fz 2, Ab 2, Fa 1, – 1 | 4 | 6 |
  | | Planeten | 55,6–56,9 | Fa 2, Mi 2, Sa 2, Fz 2, Ab 2 | 3 | 5 |
  | | Sterne | 57,3–61,1 | Mi 2, Sa 2, Fa 2, Fz 1, Ab 1, – 2 | 3 | 7 |
  | schwer | Bergwald | 58,8–60,6 | Fa 2, Mi 2, Fz 2, Sa 2, Ab 1, Lo 1 | 1 | 5 |
  | | Meer | 60,7–63,5 | Ab 2, Fa 2, Mi 2, Fz 2, Sa 2 | 1 | 7 |
  | | Wüste | 64,0–74,3 | Ab 2, Fa 2, Mi 2, Fz 2, Sa 2 | 2 | 7 |
  | | Vulkan | 74,7–77,6 | Ab 2, Fa 2, Mi 2, Fz 2, Sa 2 | 3 | 6 |
  | | Planeten | 77,6–81,1 | Fa 2, Mi 2, Fz 2, Sa 2, Ab 1, Lo 1 | 3 | 8 |
  | | Sterne | 81,5–85,6 | Ab 2, Fa 2, Mi 2, Fz 2, Sa 2 | 5 | 9 |
  | sehr schwer | Bergwald | 87,9–88,8 | **Ab 3**, Sa 2, Mi 2, Fz 2, Fa 1 | 0 | 8 |
  | | Meer | 88,9–90,2 | Fa 2, Ab 2, Sa 2, Mi 2, Fz 2 | 0 | 9 |
  | | Wüste | 90,0–91,5 | **Mi 3**, **Sa 3**, Ab 2, Fz 2 | 0 | 7 |
  | | Vulkan | 91,0–93,3 | Fa 2, Sa 2, Fz 2, Ab 2, Mi 1, Lo 1 | 0 | 8 |
  | | Planeten | 92,8–96,2 | **Fa 3**, Fz 2, Sa 2, Ab 2, Mi 1 | 0 | 7 |
  | | Sterne | 96,2–98,7 | **Fa 4**, Mi 2, Fz 2, Sa 1, Ab 1 | 0 | 5 |

  Im ganzen Grad: leicht – 28, Sa 11, Mi 9, Ab 6, Fa 5, Lo 1; mittel Mi 12, Sa 12, Fz 11, Ab 11, Fa 10, Lo 1, – 3;
  schwer Fa 12, Mi 12, Fz 12, Sa 12, Ab 10, Lo 2; sehr schwer Ab 12, Sa 12, Fa 12, Fz 12, Mi 11, Lo 1. Die Abschnitte
  (Bereich im Pool) stehen in `wahl.json`; die Schwierigkeit steigt in jedem Grad von Welt zu Welt ohne Überlappung,
  ausser in «sehr schwer», wo nach dem Entscheid vom 29.10.2026 sechs Level in einer Nachbarwelt stehen (unten).
- **Wo die Vielfalt die Bewertung überstimmte:** 41 Level kamen statt eines besser bewerteten: leicht 7 (alle, weil
  Sammelstelle oder Mischziel schon zweimal in der Welt stand), mittel 19 (13 Haupt-Kernidee schon zweimal, 6 wegen der
  Anordnung über die Weltgrenze), schwer 15 (8 und 7). Dazu stehen 143 Level nicht auf dem Platz ihres Rangs: leicht
  18, mittel 39, schwer 42 (je höchstens 2 Plätze in der Welt), sehr schwer 44 (höchstens 3 Plätze, zusammen 102,
  davon 6 in einer Nachbarwelt). Jedes nennt in `vielfalt`, statt welchem Level es kam
  und warum, bzw. welche Häufung nach Schwierigkeit allein entstünde. Mittlerer Rang in der Bewertung des Pools: leicht
  36,8 von 85, mittel 60,6 von 244, schwer 41,3 von 101. Das schwächste gewählte in «mittel» ist Feuerwerk (Rang 206,
  ohne Urteil, Gefühl geschätzt 3,85; ein Lockvogel, der das Muster lockert); in «mittel» haben fast alle Gefühl 4 bis
  5, die Ränge liegen dort eng.
- **Abweichungen von der Spec** (in `wahl.json` und im Bericht des Werkzeugs sichtbar):
  - **«sehr schwer»: Die Vielfalt geht nicht auf, auch nicht mit 3 Plätzen über die Weltgrenzen.** Der Pool ist genau
    60, also ist jede Welt ihr Sechstel, und schon darin steht eine Haupt-Kernidee drei- oder viermal (mit den Rängen
    je Welt: Wüste Sammelstelle 4, Vulkan Farben abzählen 4, Sterne Falle 4 …). Mit ±2 in der Welt blieben 45 der 51
    Fenster mit Verstoss (Zuviel 61, nach Rang 99). **Entscheid des Nutzers vom 29.10.2026:** Nur in «sehr schwer» darf
    ein Level bis 3 Plätze von seinem Rang 1–60 abweichen, auch über eine Weltgrenze; die Vielfalt soll dann ganz
    aufgehen, sonst melden statt weiter lockern. Umgesetzt (`ordneUeberGrenzen`, `UEBER_GRENZEN`): Es geht damit
    **nicht** ganz auf. Die kleinste Verschiebung, bei der es ganz aufginge, liegt über 7 Plätzen (mit 3, 4, 5, 6 und 7
    gerechnet: keine Anordnung). Der Grund liegt in den Daten: Mit je 12 von fünf Haupt-Kernideen (Mischziel 11 und ein
    Lockvogel) muss jedes Fenster von 10 genau zweimal jede enthalten, die Folge also streng im Takt von 10 laufen,
    und die Schwierigkeit häuft etwa vier Falle unter den zehn schwersten. Nicht weiter gelockert: Die Wahl nimmt mit
    höchstens 3 Plätzen die Anordnung mit dem kleinsten Zuviel (37 statt 61; 30 der 51 Fenster mit Verstoss, 3 davon
    mit einer Haupt-Kernidee viermal), dann die kleinste Summe der Verschiebungen (102 Plätze, 44 Level, 6 davon in
    einer Nachbarwelt: Arktur, Abendrot, Gravitation, Rigel, Orion, Gezeitenkraft). Die Verstösse stehen in `wahl.json`
    unter `grade["sehr schwer"].verstoesse`, der Test erlaubt genau diese und prüft, dass es mit 3 Plätzen ohne
    Verstoss nicht geht. **Berichtigung:** Mein erster Bericht sagte, mit 3 Plätzen ohne Weltgrenzen ginge es ganz auf;
    das war falsch (die Probe dazu hatte nur die ersten 10 Plätze angeordnet). Wege zur vollen Vielfalt wären Ersatz
    einiger Level aus den 48 weiteren beurteilten Kandidaten von Ticket 01 (mit Haupt-Kernideen, die in ihrem Bereich
    der Schwierigkeit fehlen) oder neue Level.
  - **«schwer»: Grenzen der Abschnitte verschoben.** Im obersten Sechstel (17 Level) gibt es höchstens 9 mit höchstens
    zwei je Haupt-Kernidee (5-mal Sammelstelle, 5-mal Abschalten). Die Grenzen rücken darum nach unten: Planeten |
    Sterne 3 Level, Vulkan | Planeten 1, Wüste | Vulkan 1, Meer | Wüste 4 (Pool-Plätze in `verschoben`). Das ist keine
    Regel der Spec (die Sechstel sind meine Umsetzung von «über den ganzen Bereich»), aber sichtbar gemacht; die Ränge
    je Welt gelten weiter.
- **Schlüssel der 15 neuen Level** (Sternnamen wie die übrigen sehr schweren, nach Schwierigkeit): Fomalhaut, Kanopus,
  Kastor, Pollux, Mizar, Alkor, Algol, Bellatrix, Achernar, Alnilam, Thuban, Alphard, Hadar, Shaula, Mira; eindeutig
  über Spiel und Vorrat (flach und Würfel, auch in anderer Schreibung) und nicht auf `entfernteNamen`. Woher der
  Generator früher seine Namen nahm: aus einem Vorrat, der nicht versioniert ist (`tests/output/…`, Ticket 01 des
  Ausbaus), hier nicht vorhanden; die entfernten stehen in `tools/levelliste.json` (`entfernteNamen`).
- **Titel** (`tools/geschichte/titel.json`): je Welt 40, ein oder zwei Wörter, «ss» statt «ß», eindeutig über alle Titel
  und die Namen in Spiel, Vorrat und der 15 neuen (ohne Gross- und Kleinschreibung), keiner auf `entfernteNamen`.
  Bergwald (Moospolster, Farnwedel … Bachtobel, Johanniswürmchen), Meer (Sandbank, Gischt … Mahlstrom), Wüste (Sandkorn,
  Skarabäus … Schirokko), Vulkan (Lava, Glutnest … Höllenschlund), Planeten (Mondaufgang, Io, Enceladus …
  Asteroidengürtel), Sterne (Grosser Wagen, Schwan, Orionnebel … Firmament). Leicht eher einfache Wörter, sehr schwer
  die grösseren. Nicht möglich, weil schon Namen von Leveln: etwa Brandung, Glut, Glühwürmchen, Oase, Pyramide,
  Polarstern, Sternbild (entfernt). Teilwörter wie «Glutnest» zu «Glut» sind erlaubt.
- **Tests** (`tests/geschichte.test.mjs`, 27, etwa 3 min über `leise.sh`): nachbaubar (neu gerechnet byte-gleich wie
  die Datei), alle Regeln über `pruefe`, Grad, Ränge und Vertauschungen samt Angaben der Datei (in «sehr schwer»
  höchstens 3 Plätze vom Rang im Grad), Abschnitte ohne Lücke, Vielfalt (in «sehr schwer» genau die genannten
  Verstösse; mit 3 Plätzen ohne Verstoss geht es nicht, es sind weniger als nach Rang und als mit 2 Plätzen, und die
  Level in einer Nachbarwelt nennen den Grund), kein abgelehntes, genau eine Lösung (Löser wie in
  `levelliste.test.mjs`), Titel und Zuordnung, Schlüssel der 15. Gegenproben: falsche Welt, 3 Plätze vom Rang,
  die Regel der 3 Plätze über die Weltgrenze (1 und 3 Plätze in «sehr schwer» erlaubt, in «schwer» nicht, 4 Plätze
  auch in «sehr schwer» nicht, an erfundenen Graden und an der echten Wahl), fehlend, doppelt, anderer Grad, falscher
  Platz, dreimal dieselbe Haupt-Kernidee über die Weltgrenze, zu ähnlich, abgelehnt, falsch notierte und mehrdeutige
  Lösung, Titel doppelt (andere Schreibung), gleich einem Namen (flach, Würfel, neu), entfernt, ß, drei Wörter, zu
  wenige, Schlüssel doppelt oder leer; Ablehnung und Bewertung an erfundenen Urteilen; die Wahl an erfundenen Pools
  (drittes Level derselben Haupt-Kernidee, Muster über die Weltgrenze, ganzer Grad, ohne Wahl mit kleinstem Zuviel,
  und die Anordnung über den ganzen Grad gegen alle Anordnungen eines Falls mit 12 Leveln: kleinste Verschiebung über
  die Weltgrenze, keine Anordnung, wo keine geht, und dann das kleinste Zuviel).
- **Alle Tests** nacheinander über `leise.sh` (`LEISE_CPU=50`) grün, auch nach den Entscheiden vom 29.10.2026:
  Geschichte 27, Strahlregel 1918, Golden 809 Level,
  Beurteilung 206, Levelliste 57, Würfelliste 20, KI-Tester 84, Vorrat 14, Generator 31, Offline bestanden.
  `index.html` ist unverändert.
- **Für Ticket 04:** `wahl.json` lesen (Reihenfolge je Grad: Welten in `WELTEN`, darin `platz`); `titel` kommt über
  `levelCode` ins Spiel und in den Vorrat. Die 15 neuen Level brauchen beim Einbau ihren Kommentar mit der Herkunft
  (Auftrag, Seed, Lauf aus `sehr-schwer-neu.json`), einen Eintrag in `levelliste.json` (`ausbau`) und
  `tests/golden.json` (siehe Ticket 02). Nach einer Änderung an den Leveln oder an der Beurteilung
  `geschichte.mjs wahl` neu laufen lassen; der Test meldet, wenn die Datei nicht mehr nachbaubar ist.

**Entscheid des Nutzers (29.10.2026, nach der Berichtigung):** «sehr schwer» nimmt vorerst die vorhandenen Level in
der Anordnung mit dem kleinsten Zuviel (±3 über die Grenzen, `verstoesse` sichtbar und vom Test genau so erlaubt).
Es sind Platzhalter: Ganz am Schluss generiert Ticket 09 passende neue Level und ersetzt sie, bis die Vielfalt ganz
aufgeht. **Titel** vom Koordinator durchgesehen; drei ersetzt (Totenbuch → Sonnentempel, Höllenschlund →
Feuerschlund, Himmelszelt → Sternkarte; nach dem Review wegen zu naher Paare Glutrot → Glutschein, Kugelhaufen →
Sternhaufen), mit `node tools/geschichte.mjs titel` neu zugeordnet.

**Review (29.10.2026)**

- **Unabhängig nachgeprüft** (eigenes Prüfskript, ohne Code aus `tools/geschichte.mjs`): Pool je Grad über den Lader
  (85, 265, 105, 60), Ablehnung neu gerechnet (genau die 25 unter dem Mindest-Spielwert, keine durch die KI-Tester
  oder einen Ausschlussgrund), Bewertung und Rang in der Bewertung je Level, 4 × 60, je Welt 10 auf den Plätzen
  1–10, Grad, Schwierigkeit und Haupt-Kernidee wie in der Datei, Ränge (leicht bis schwer je Welt, höchstens 2 Plätze,
  keine über die Grenze; sehr schwer höchstens 3, davon 6 über die Grenze), Vielfalt (in leicht bis schwer kein
  Verstoss, in sehr schwer genau die 34 aus `verstoesse`), Ähnlichkeit über alle 240 (höchstens 0,48), Abschnitte
  ohne Lücke, Titel eindeutig gegen alle Titel, die Namen in Spiel und Vorrat, die 15 neuen und `entfernteNamen`
  (ohne Gross- und Kleinschreibung), Schlüssel der 15 (auch in anderer Schreibung wie C/K). Eigene Rechnung über alle
  Anordnungen mit ±3 in «sehr schwer»: ohne Verstoss geht es nicht, das kleinste Zuviel ist 37 bei 102 Plätzen und
  44 verschobenen Leveln, genau die Wahl. Probe mit Tausch: In keiner Welt von leicht bis schwer könnte ein besser
  bewertetes Level aus dem Abschnitt eines der gewählten ersetzen, ohne eine Regel zu brechen. Gegenproben am
  Prüfskript schlagen an.
- **Nachbaubar:** `wahl` zweimal und `titel` einmal ergeben dieselbe Datei, byte-gleich; die Suche stiess nie an
  ihre Grenze. `index.html` unverändert, Zeilen höchstens 120 Zeichen.
- **Behoben:** Zahl der Tests unter «Gebaut» (25 → 27).
- **Für Ticket 04:** `poolLevel` bricht ab («gibt es schon in Spiel oder Vorrat»), sobald die 15 neuen im Spiel
  stehen; dann den Pool nicht mehr aus `sehr-schwer-neu.json` ergänzen.
- **Titel, nur zur Kenntnis:** «Glutrot» (Vulkan, leicht) und «Rotglut» (Vulkan, schwer) liegen nahe beieinander,
  «Kugelhaufen» (Sterne, sehr schwer) nahe am Namen des Levels Kugelsternhaufen. Beides ist nach den Regeln erlaubt.
- **Tests** nacheinander über `leise.sh` (`LEISE_CPU=50`) grün: Geschichte 27, Strahlregel 1918, Golden 809 Level,
  Beurteilung 206, Levelliste 57, Würfelliste 20, KI-Tester 84, Vorrat 14, Generator 31, Offline bestanden.
