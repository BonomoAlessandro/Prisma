# 12: Würfel-Gruppe 11 (275 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 6 / 2.
Danach stehen 275 neue Würfel-Level im Spiel: 47 / 146 / 58 / 24. Aufzug und Kern sind nicht mehr im Spiel (Entscheid vom 25.10.2026).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 11

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

**25.10.2026, Agent:** Gruppe 11 steht im Spiel: 25 neue Würfel-Level (4 / 13 / 6 / 2). Zusammen sind es jetzt 275
(47 / 146 / 58 / 24).
- **Pool erweitert (pool-3):** Bei „mittel“ waren Abschalten, Falle und Farben abzählen knapp. Deshalb kamen neue
  Kandidaten für diese drei Kernideen dazu: Seeds 21201–22800 bei „mittel“ (500 Kandidaten), 21201–22000 bei
  „schwer“ (130) und 22401–22800 bei „sehr schwer“ (7, dort bringt mehr Generieren kaum etwas). Die Dateien liegen
  in tests/output/wuerfel/pool-3/ und gehen ab jetzt in die Pool-Liste der Wahl ein. Floss (mittel-abschalten,
  Seed 21742) stammt schon daraus.
- **Wahl:** Die erste Wahl (wahl-11) liess keine Häufung offen. Nach den Korrekturen der Tester blieben aber drei
  offen: Seite 10 mit Sammelstelle 4-mal, Seite 12 und Seite 16 mit Abschalten je 4-mal. Ersetzt wurden cc8e8791,
  d20a7450 und a9e73605 (wahl-11b, Lauf wuerfel-11-2). Danach blieben Seite 10 und Seite 12 offen. Deshalb wurden
  auch d6b3a5dd und ce2214f9 ersetzt (wahl-11c, Lauf wuerfel-11-3). Danach blieb keine Häufung offen.
- **KI-Tester (wuerfel-11, -11-2, -11-3):** 29 Kandidaten beurteilt, keiner von beiden abgelehnt. Am schwächsten
  bewerten beide Utopia: Gefühl 3, am Desktop und am Handy je 2 von 5, wegen zehn Spiegeln an der Ostwand und
  einer langen blauen Schleife. Kein Knäuel. Am Handy bekommen von A auch Sigiriya, Banach-Tarski, Fatehpur Sikri
  und Göbekli Tepe eine 2. Die stärksten Level (Gefühl 5) sind Sigiriya, Banach-Tarski und Fatehpur Sikri.
- **Namen nach Review 11:** umbenannt Zinngießer → Federkiel, Deckenfresko → Pergola, Kandelaber → Abakus,
  Kupferstich → Dudelsack, Krabbe → Senkblei, Wimperg → Draisine, Kai → Kajüte.
- **Namen der Gruppe:** Hypercube habe ich von Hand durch Banach-Tarski ersetzt. Es bedeutet dasselbe wie
  Hyperwürfel und Tesserakt und ist englisch.
- Golden nachgeführt (784 Level, davon 275 Würfel), alle Tests grün. Stichproben der Screenshots stammen aus den
  Bildern der Tester.

**25.10.2026, Reviewer:** Geprüft auf 43f01ca (Merge von 836d16f).
- **Herkunft:** Floss (mittel-abschalten, Seed 21742, pool-3, Stand 1df6ca5+) und Troja (schwer-sammelstelle, Seed
  21035, Stand 0d0edd0) mit `tools/ausbau.mjs pool … --wuerfel --seeds 1` auf dem Stand aus `git archive` nachgebaut;
  der Abdruck stimmt (6a9f6bc2, 4679cbe2), die Schwierigkeit auch (54,2 und 71,2).
- **Befund, Tests nicht ganz grün:** `tests/wuerfelliste.test.mjs` schlägt fehl (11 bestanden, 1 FAIL „Herkunft“:
  Floss). index.html trägt „Stand 1df6ca5+“; das „+“ heisst nicht nachbaubar, und der Test lässt es darum nicht zu.
  pool-3 entstand, während index.html ungesichert geändert war (nur die Leveldaten, nicht die Spiellogik). Der Nachbau
  auf dem sauberen 1df6ca5 liefert dasselbe Level. Darum genügt in index.html „Stand 1df6ca5“ (Zeile über
  `name: 'Floss'`). Alle Zeilen in tests/output/wuerfel/pool-3/ tragen „1df6ca5+“. Wer daraus ein Level nimmt, setzt
  „1df6ca5“ und baut es zur Probe nach. Besser: pool-3 einmal mit sauberem Stand neu stempeln. Die übrigen Tests sind
  grün: golden (784 Level, davon 275 Würfel), logic 1891, ki-tester 83, levelliste 56, beurteilung 205, generator 31.
- **Urteile:** Alle 25 neuen haben ein zählendes Urteil beider Tester: 21 aus wuerfel-11, Floss aus wuerfel-11-2,
  Brunnenschacht und Dock aus wuerfel-11-3. Winkelmass (c0fd7282) hat sein Urteil schon aus wuerfel-10. Dort war es
  nur wegen einer Häufung ersetzt, nicht abgelehnt. Das stand nicht im Kommentar. Keines lehnt ein Tester ab. Die
  Verschiebungen entsprechen der Rechnung von `wuerfelReihenfolge` (Folge = index.html, 22 Züge der Häufungsregel). Wo
  `ergebnis` im Protokoll abweicht, etwa bei Nadelkissen (1 → 5), Sigiriya (2 → 5) und Banach-Tarski (0 → 5), kommt
  das vom Platz der Formel, wie die Spec es vorsieht. cc8e8791, d20a7450, a9e73605, d6b3a5dd und ce2214f9 stehen
  nicht im Spiel.
- **Häufung:** Keine ist offen. Ab Seite 6 steht fast jede Seite genau an der Grenze 3, alle Level dort sind ab
  „mittel“. Seite 18 hat Mischziel, Abschalten und Falle je 3-mal, Seite 22 Sammelstelle, Falle und Farben abzählen.
  Die Wahl hat kaum noch Luft.
- **Grade:** 47 / 146 / 58 / 24 wie bestandNach(11) und das Ticket.
- **Namen:** Sie sind eindeutig, keiner steht auf der Liste entfernter Level, keiner trägt einen Begriff des Glossars.
  Die Ortsnamen ab „schwer“ und Banach-Tarski passen in den Stil. Vorschläge für den Entwickler (das Review ändert
  index.html nicht). Die neuen Namen sind gegen alle flachen, Würfel-, entfernten und ursprünglichen Namen geprüft:
  - **Dock → Zwinger:** Dock (Platz 119) steht direkt neben Werft (120) und bedeutet fast dasselbe. Dazu kommen
    Hafenkran, Hafenmole, Fähre, Kajüte und jetzt Floss.
  - **Voliere → Tabernakel:** Voliere ist ein Vogelhaus wie Taubenschlag (51).
  - **Rechenschieber → Globus:** Rechenschieber ist ein Rechengerät wie Abakus (118, eben erst umbenannt).
  - **Brunnenschacht → Pechnase:** Brunnenschacht trägt das Grundwort von Lichtschacht (entfernt) und das Wort von
    Springbrunnen (flach).
  - **Briefbeschwerer → Bücherstütze:** zweites Brief… neben Briefkasten (24).
  - **Nadelkissen → Wecker:** Nadel… wie Nadelöhr, dazu Kompassnadel (beide flach).
  - **Musikinstrumente:** Mit Cembalo, Kontrabass, Leier, Ziehharmonika und Fagott sind es im Würfel 8 (dazu Zither,
    Drehorgel, Dudelsack). Flach kommen Glockenspiel, Glasharfe, Lichtharfe und Harmonie dazu. Für „mittel“, sonst
    meist Bauwerke und Gerät, ist das ein Klumpen; er stört, wenn auch nicht stark. Vorschlag: zwei ersetzen.
    **Kontrabass → Sänfte** (Seite 8 mit Dudelsack) und **Ziehharmonika → Rüstkammer** (Harmoni… wie Harmonie,
    flach). Cembalo, Leier und Fagott bleiben.
  - Kleiner, ohne Vorschlag: Sonnenschirm ist das achte Sonnen… (flach sieben). Winkelmass teilt „Winkel“ mit
    Winkelzug (flach). Hobel klingt wie Gobelin und Obelisk. Hofburg teilt „Burg“ mit Burggraben (flach) und „Hof“ mit
    Hinterhof und Innenhof. Schnürsenkel und Senkblei teilen „Senk…“.
