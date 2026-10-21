# 04: Gruppe 3 (255 Level)

**What to build:** 35 neue Level aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je Grad (leicht /
mittel / schwer / sehr schwer): 5 / 19 / 7 / 4. Danach stehen 255 Level im Spiel: 47 / 131 / 54 / 23.

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] 35 neue Level im Spiel, je Grad wie oben; Fehlmengen eines Grads sind begründet und für die nächste Gruppe
      vermerkt.
- [x] Jedes neue Level hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee und ist
      keinem anderen Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt (Protokoll); von beiden abgelehnte sind ersetzt.
- [x] Namen im bisherigen Stil vergeben, eindeutig, keiner von der Liste entfernter Level (ohne Freigabe des Nutzers).
- [x] Herkunft jedes Levels (Auftrag, Seed, Ziel-Schwierigkeit) ist nachbaubar.
- [ ] Golden-Test-Referenz nachgeführt, alle Tests grün, Stichproben der Screenshots geprüft, auf main gemergt.

## Comments

**Zwischenstand und offene Frage an den Nutzer (22.10.2026, nachts)**

Gruppe 3 kostet ein Vielfaches von Gruppe 1 und 2. Die KI-Tester lehnen kaum noch etwas ab (die Vorprüfung auf Zerfall
wirkt), aber die Reihenfolge lässt sich immer schwerer schreiben:

- **Ursache:** Die KI-Tester korrigieren neue Level oft um volle 5 Plätze (in „mittel“ fast immer nach vorn). Kreuzen
  sich zwei korrigierte Level gegenläufig, schiebt das eine das andere um einen Platz weiter; dann steht es 6 Plätze von
  seinem Platz davor, und die Regel aus Ticket 24 (M1, höchstens 5) greift. Steht ein Level so schon vor der
  Häufungsregel zu weit, lässt diese keinen Zug zu, und dichte Häufungen der Haupt-Kernidee bleiben offen.
- **Folge:** Jedes neue Urteil bringt neue Korrekturen und damit neue Konflikte mit Leveln aus Gruppe 1 und 2. Die
  Runden konvergieren schlecht (35 → 12 → 4 → 2 Urteile, und noch die letzten 2 brachten wieder Konflikte).
- **Möglichkeiten** (Entscheid des Nutzers, keine davon ist umgesetzt):
  1. Korrekturen der KI-Tester für Level des Ausbaus gleichzeitig statt nacheinander anwenden (jedes Level an seinen
     Zielplatz, andere rücken nach), so dass keine Korrektur eine andere verlängert.
  2. Bei Leveln des Ausbaus die Korrektur auf 3 statt 5 Plätze begrenzen (sie wirkt dann weniger weit, lässt aber
     Spielraum für die Häufungsregel).
  3. Die Prüfung „höchstens 5 Plätze vom Platz davor“ für Verschiebungen um einen Platz durch andere Korrekturen
     lockern (6 statt 5).
  4. So weiter wie bisher: mehr Vorrat beurteilen, mehr Rechenzeit für die Suche; machbar, aber langsam.

**Entscheid des Nutzers (22.10.2026):** „Jetzt da wir so viele neue Level generieren, dürfen bestehende Level auch
verschoben werden, wenn nötig. Die maximal-5-Plätze-Verschiebenregel gilt hier nicht.“ Umgesetzt als Möglichkeit 3
ohne Obergrenze: Im Ausbau entfällt die Prüfung „korrigiertes Level höchstens 5 Plätze vom Platz davor“
(`zuWeitGilt` in `tools/levelliste.mjs`; in der Häufungsregel, in `ordne-level.mjs` beim Schreiben, im Test der
Levelliste und in der Suche der Wahl). Die einzelne Korrektur der KI-Tester bleibt höchstens 5 Plätze (`merge`), und
ohne Ausbau gilt alles wie bisher. Folge: Mit der neuen Regel lässt die Häufungsregel wieder Züge zu, und die
Reihenfolge der Gruppen 1 und 2 ordnet sich beim Schreiben leicht anders (einige Züge der Häufungsregel).

**Ergebnis (22.10.2026, Branch `ausbau/04-gruppe-3`)**

- **Im Spiel:** 255 Level, 50 / 128 / 53 / 24. Gegen die Tabelle (47 / 131 / 54 / 23) bewusst verschoben
  (`--verschiebe leicht:3,mittel:-3,schwer:-1,sehr schwer:1`): Mit nur 5 neuen leichten Leveln war die Häufung
  Amethyst, Seifenblase, Leuchtkäfer (Sammelstelle, Plätze 31–40) rechnerisch nicht aufzulösen, und eine Häufung oben
  in „schwer“ (Gratwanderung, Nadelöhr, Weltumsegelung) löste erst ein schweres Level weniger vor ihr. Gruppe 4
  gleicht das aus, weil `wahl` den Bedarf aus dem Spiel rechnet.
- **Neu:** Fingerzeig, Pfadfinder, Wegmarke, Lichtschalter, Kreisel, Murmel, Glasperle, Tautropfen (leicht); Bronze,
  Quarz, Bergkristall, Rosenquarz, Mondstein, Sonnenstein, Glasmalerei, Buntglas, Fensterrose, Glockenturm, Kompass,
  Sextant, Astrolabium, Fernrohr, Periskop, Lichtleiter (mittel); Steilwand, Nordwand, Seilschaft, Biwak, Basislager,
  Höhenweg (schwer); Wega, Atair, Deneb, Rigel, Beteigeuze (sehr schwer).
- **KI-Tester:** Läufe `ausbau-3` (29), `ausbau-3-2` (12), `ausbau-3-3` (4), `ausbau-3-v` (35, Vorrat), `ausbau-3-6`
  (2). Abgelehnt keines; schwach ein leichtes (Gefühl 2). Die Vorprüfung auf Zerfall wirkt; die Runden kamen von den
  Korrekturen (siehe Zwischenstand oben), die der Entscheid des Nutzers auflöst.
- **Werkzeug** (`tools/ausbau.mjs`): `--verschiebe` je Grad; überzählige gesetzte Level fallen weg; fallendes Mittel je
  10 Level als Fehler der Bewertung statt Ausschluss (die angefangene letzte Seite sperrte sonst die Suche); Paar- und
  Mehrfachtausch auch über gesetzte Plätze; Fisher-Yates im Mehrfachtausch.
- **Tests:** Logik 863, Levelliste 51, KI-Tester 65, Golden 264 (nach `--write`), Beurteilung 178, alle grün.
  Stichprobe: Kreisel (35) und Deneb (242), Desktop und Handy, ohne Befund.
