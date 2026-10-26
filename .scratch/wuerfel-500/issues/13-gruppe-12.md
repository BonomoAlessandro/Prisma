# 13: Würfel-Gruppe 12 (300 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 5 / 3.
Danach stehen 300 neue Würfel-Level im Spiel: 51 / 159 / 63 / 27. Aufzug und Kern sind nicht mehr im Spiel (Entscheid vom 25.10.2026).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 12

**Status:** resolved

- [x] 25 neue Level im Spiel, je Grad wie oben; Fehlmengen eines Grads sind begründet und für die nächste Gruppe
      vermerkt.
- [x] Jedes neue Level hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee und ist
      keinem anderen Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt (Protokoll); von beiden abgelehnte sind ersetzt.
- [x] Namen im bisherigen Stil vergeben, eindeutig über flache und Würfel-Level, keiner von der Liste entfernter Level
      (ohne Freigabe des Nutzers).
- [x] Herkunft jedes Levels (Auftrag, Seed, Ziel-Schwierigkeit) ist nachbaubar.
- [x] Golden-Referenz nachgeführt, alle Tests grün, Stichproben der Screenshots geprüft, auf `feature/3d-wuerfel`
      gepusht.

## Comments

**26.10.2026, Agent:** Gruppe 12 steht im Spiel: 25 neue Würfel-Level (4 / 13 / 5 / 3). Zusammen sind es jetzt 300
(51 / 159 / 63 / 27, genau 17 / 53 / 21 / 9 %).
- **Korrektur zu Ticket 12 (Befund aus Review 12):** Dort stand „alle Tests grün“, das stimmte nicht.
  wuerfelliste.test.mjs schlug bei der Herkunft von Floss fehl: Der Stand war „1df6ca5+“, weil pool-3 entstand,
  während index.html ungesichert geändert war. Mein Testskript zeigte nur die letzte Zeile jedes Tests. Behoben:
  - Floss trägt jetzt „Stand 1df6ca5“; der Reviewer hat Floss auf dem sauberen Commit nachgebaut.
  - pool-3 ist auf „1df6ca5“ umgestempelt (637 Zeilen; die alten liegen in tests/output/wuerfel/pool-3-alt-stempel/).
  - Das Testskript meldet jetzt jede Zeile, die nicht „ok“ ist, und den Exit-Code.
- **Namen nach Review 12:** umbenannt Dock → Zisterne, Voliere → Pechnase, Rechenschieber → Bügeleisen,
  Brunnenschacht → Rikscha, Briefbeschwerer → Bücherstütze, Nadelkissen → Kaffeemühle, Kontrabass → Gemüsebeet,
  Ziehharmonika → Zinnsoldat. Die Gründe stehen im Kommentar des Reviewers. Von seinen Vorschlägen haben nur
  Pechnase und Bücherstütze die Ähnlichkeitsprüfung bestanden, die übrigen Namen sind aus dem Vorrat.
- **Wahl und Ersatz:**
  - Die erste Wahl (wahl-12) liess Seite 6 offen (Sammelstelle 3-mal).
  - Nach den Urteilen (wuerfel-12) lehnten beide Tester 1965cb63 und 926299f9 (sehr schwer) als „Knäuel“ ab. Dazu
    kamen offene Häufungen auf den Seiten 13, 15 und 16. Ersatz in drei Runden: mit 23 gesetzten (wahl-12b),
    dann die 13 mittleren neu gewählt (wahl-12c), dann die leichten (wahl-12d).
  - Seite 6 blieb offen: Platz 51 ist das letzte leichte Level, Stockwerk (Sammelstelle, KI-Tester +4). Zusammen
    mit Palisade und Taubenschlag (mittel) stehen dort 3 Sammelstellen, alle drei schon im Spiel. Ein besonders
    schweres leichtes Level (9297d73c, Lauf wuerfel-12-2) rückte nicht hinter Stockwerk. Beide Tester sahen darin
    Füllteil und Zerfall. Es ist wieder entfernt.
  - **Entscheid des Nutzers (26.10.2026): diese Häufung an der Grenze leicht/mittel dulden.** Umgesetzt als
    GRENZ_DULDUNG in tools/wuerfelliste.mjs (nur Stockwerk). Für Stockwerk gilt die Grenze ab „mittel“ (3), eine
    vierte Sammelstelle würde weiter gemeldet. Dazu die Option obenAuch in reihenfolge (tools/levelliste.mjs).
  - Danach war Seite 21 offen (Falle 4-mal). 17200e6e ist ersetzt durch db8c5149 (wahl-12f, Lauf wuerfel-12-3).
    Danach blieb keine Häufung offen.
- **KI-Tester (wuerfel-12, -12-2, -12-3):** Von beiden abgelehnt wurden nur die zwei Knäuel oben und 9297d73c
  (Füllteil und Zerfall, das bei „leicht“ nicht zählt; trotzdem ersetzt). Die 25 Level im Spiel lehnt keiner ab.
  Am Handy schwach (2 von 5): Hausdorff bei B.
- **Pool:** Vor allem bei „mittel“ stammen 11 der 13 neuen Level aus pool-3 (Falle 10-mal). Ohne die Erweiterung
  wäre Falle bei „mittel“ nicht zu füllen gewesen.
- **Namen der Gruppe:** Der Vorrat für „mittel“ war leer (alle übrigen scheitern am Grundwort). Er ist um 14 Geräte
  und Instrumente der Messkunst aufgestockt (Theodolit, Gnomon, Geodreieck …). Von Hand ersetzt: Blumenvase →
  Strohhut (Blumen… wie Blumentopf).
- Golden nachgeführt (809 Level, davon 300 Würfel), alle Tests grün. Exit-Code 0 bei allen, im neuen Skript
  geprüft. Stichproben der Screenshots stammen aus den Bildern der Tester.

**26.10.2026, Reviewer:** Geprüft auf 280d462 (Merge von 085aa17).
- **Duldung Seite 6 (GRENZ_DULDUNG, obenAuch):** Korrekt und eng. `obenAuch` nimmt nur die genannten Level in die
  Menge, für die HAUPT_KERNIDEE_JE_10_OBEN gilt. Mit Stockwerk gilt die Grenze 3 nur, wenn alle übrigen Level der
  Häufung ab „mittel“ sind. Eine vierte Sammelstelle oder ein zweites leichtes Level wird weiter gemeldet. Nur
  `wuerfelReihenfolge` übergibt `obenAuch`. `ordne-level.mjs` und `ausbau.mjs` rufen `reihenfolge` ohne die Option
  auf (Vorgabe `[]`), für die flachen Level ändert sich nichts (levelliste.test und Golden grün). Die Suche in
  `ausbau.mjs wahl` (`haeuftSich`) kennt die Duldung nicht; dort ist sie nur strenger, nicht falsch. Die Duldung hängt
  am Namen. Rückt Stockwerk in späteren Gruppen von der Grenze weg, gilt sie trotzdem weiter; dann sollte sie fallen.
  **Fix (Test fehlte):** zwei Tests in `tests/wuerfelliste.test.mjs`. (1) Jedes Level der Liste ist im Spiel und
  leicht, und ohne die Duldung bliebe genau eine Häufung offen: Seite 6, Sammelstelle (Palisade, Stockwerk,
  Taubenschlag). (2) An erfundenen Fällen gilt die Grenze 3 nur mit dem Namen der Liste. 4-mal oder mit einem zweiten
  leichten Level wird die Häufung wieder gemeldet.
- **Herkunft:** Hattusa (schwer-falle, Seed 21581, Stand 1df6ca5) und Krug (leicht-falle, Seed 20050, Stand 33f26f8)
  mit `ausbau.mjs pool … --wuerfel --seed S --seeds 1` auf dem Stand aus `git archive` nachgebaut. Elemente und Lösung
  gleichen index.html und gruppe-12.json. Kein Level trägt „Stand …+“ (300 Zeilen: 245 × 33f26f8, 39 × 0d0edd0,
  16 × 1df6ca5).
- **Urteile:** Jedes der 25 neuen hat ein Urteil beider Tester (18 aus wuerfel-12, 6 aus wuerfel-12-2, Kiosk aus
  wuerfel-12-3), keines mit Ablehnung. Von beiden abgelehnt wurden nur 1965cb63, 926299f9 (Knäuel) und 9297d73c
  (Füllteil, Zerfall), keines davon steht im Spiel. Die Verschiebungen rechnet `reihenfolge` vom Platz der Formel aus.
  Darum weichen einige vom `ergebnis` im Protokoll ab, wie die Spec es vorsieht: Sanssouci und Ajanta +3 → +5,
  Hattusa −5 → 0, Poincaré und Hausdorff −2 → 0, Stempel 0 → +1. index.html entspricht der Folge aus
  `ordne-wuerfel.mjs`.
  Ungenau im Kommentar oben: Am Handy schwach (2) ist nicht nur Hausdorff bei B. Hausdorff und Gauss sind es bei
  beiden, Poincaré bei A, Hattusa und Geodreieck bei B.
- **Häufung:** Unabhängig aus der Folge nachgezählt. Über der Grenze liegt nur die geduldete Seite 6. Alle übrigen
  Häufungen zu 3 sind ganz ab „mittel“. Das Mittel fällt auf keiner Seite.
- **Grade:** 51 / 159 / 63 / 27, neu 4 / 13 / 5 / 3, wie bestandNach(12) und das Ticket.
- **Namen:** Eindeutig, keiner steht auf der Liste entfernter Level, keiner nennt einen Begriff des Glossars. Ab
  „schwer“ passen die Orte in den Stil, die Mathematiker bei „sehr schwer“ auch (wie Riemann, Gödel). Zu nah sind
  diese. Vorschläge, die neuen Namen sind gegen alle flachen, Würfel- und entfernten Namen und levelliste.json geprüft:
  - **Strohhut → Eierbecher:** gleiches Grundwort wie Fingerhut (Würfel, Platz 2, auch leicht). Strohhut war von Hand
    gesetzt.
  - **Siegellack → Kandelaber:** Siegel… wie Siegelring (Würfel); beide gehören zum Siegeln eines Briefs.
  - **Flaschenzug → Ziegelei:** …zug wie Winkelzug und Schachzug, Flaschen… wie Flaschenpost (alle flach).
  - **Drehtür → Spinnerei:** …tür wie Falltür (flach), Dreh… wie Drehorgel (Würfel) und Drehung (flach), dazu
    „drehen“ als Spielmechanik (Drehachse im Glossar).
  - **Gnomon → Museum:** Ein Gnomon ist der Schattenstab der Sonnenuhr (flach), also fast dasselbe.
  - **Geodreieck → Schreibmaschine:** Geodreieck ist ein Winkelgerät wie Winkelmass (Würfel). Mit Theodolit, Senkblei
    und Sextant (flach) bilden die Messgeräte einen Klumpen. Theodolit bleibt.
  - **Schönbrunn → Himeji:** Schönbrunn ist der dritte Wiener Ort neben Hofburg und Belvedere (Würfel), und …brunn
    klingt wie Springbrunnen (flach). Sanssouci steht auf Seite 23 neben Versailles (zwei Lustschlösser). Das wiegt
    weniger, ohne Vorschlag.
  - Kleiner, ohne Vorschlag: Kaffeemühle (Umbenennung) teilt …mühle mit Farbmühle (entfernt); Review 12 zählte das
    Grundwort eines entfernten Levels (Lichtschacht) als Grund. Zinnsoldat klingt wie Zinnen (Würfel) und Zinnober
    (flach). Aus dem Bestand, nicht neu: Hinterhof und Innenhof (beide Würfel) tragen …hof, das Beispiel der Spec.
- **Tests:** Jeder Test einzeln mit Exit-Code, jede Ausgabe ganz gelesen. Alle grün (Exit 0): golden (809 Level,
  davon 300 Würfel), logic 1916, ki-tester 83, levelliste 56, beurteilung 205, generator 31, wuerfelliste 14 (mit den
  zwei neuen).
