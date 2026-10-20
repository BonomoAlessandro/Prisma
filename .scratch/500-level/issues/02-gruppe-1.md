# 02: Gruppe 1 (185 Level)

**What to build:** 35 neue Level aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je Grad (leicht /
mittel / schwer / sehr schwer): 6 / 19 / 7 / 3. Danach stehen 185 Level im Spiel: 37 / 93 / 39 / 16.

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] 35 neue Level im Spiel, je Grad wie oben; Fehlmengen eines Grads sind begründet und für die nächste Gruppe
      vermerkt.
- [x] Jedes neue Level hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee und ist
      keinem anderen Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt (Protokoll); von beiden abgelehnte sind ersetzt.
- [x] Namen im bisherigen Stil vergeben, eindeutig, keiner von der Liste entfernter Level (ohne Freigabe des Nutzers).
- [x] Herkunft jedes Levels (Auftrag, Seed, Ziel-Schwierigkeit) ist nachbaubar.
- [ ] Golden-Test-Referenz nachgeführt, alle Tests grün, Stichproben der Screenshots geprüft, auf main gemergt.
- [x] **Pilot:** Dauer und Ausbeute je Grad (Kandidaten, Ablehnungen der KI-Tester, CPU-Zeit) stehen unter
      `## Comments`, als Grundlage für die Schätzung der übrigen Gruppen.

## Comments

**Ergebnis (20./21.10.2026, Branch `ausbau/02-gruppe-1`)**

- **Im Spiel:** 185 Level, 37 / 93 / 39 / 16, genau nach der Tabelle; keine Fehlmenge. Neu:
  - leicht: Lichtblick, Kerzenschein, Farbklecks, Glanzlicht, Morgentau, Seifenblase;
  - mittel: Aquarell, Pastell, Indigo, Zinnober, Kobalt, Windrose, Sonnenuhr, Glockenspiel, Wendeltreppe, Lichtgitter,
    Farbtropfen, Spiegelung, Abendlicht, Goldglanz, Regenschauer, Lichtwirbel, Kristall, Glasharfe, Silberblick;
  - schwer: Irrgarten, Expedition, Gipfelsturm, Karawane, Kreuzfahrt, Schatzkarte, Seidenstrasse;
  - sehr schwer: Andromeda, Sternnebel, Sonnenwind.
- **Herkunft:** im Kommentar jedes Levels (Generator, Auftrag, Seed · Ausbau „Grad“); Pools
  `ausbau.mjs pool … --seed 10001 --seeds 200` (Pool 1), `--seed 10201 --seeds 400` (Pool 2) und für „sehr schwer“
  `--seed 10201 --seeds 2000`. Die Namen stammen aus einem Vorrat (nicht versioniert), je Grad der Reihe nach, ohne
  vergebene, entfernte oder ähnliche Namen.
- **KI-Tester, vier Läufe** (Protokoll `ausbau-1`, `ausbau-1-2`, `ausbau-1-3`, `ausbau-1-4`; 51 Kandidaten beurteilt):
  - `ausbau-1` (35): 5 abgelehnt, alle wegen Zerfall (3 mittel, 2 schwer). Dazu ersetzt: ein leichtes Level mit
    Gefühl 2,5 (Füllteil bei beiden).
  - `ausbau-1-2` (11 Ersatz): keine Ablehnung; ersetzt wegen Gefühl 2,5: ein leichtes (Füllteil und Zerfall bei
    beiden) und ein sehr schweres (Knäuel aus 14 Spiegeln bei A).
  - `ausbau-1-3` (4): 1 abgelehnt (sehr schwer, Füllteil bei beiden).
  - `ausbau-1-4` (1): angenommen (Gefühl 2 / 4, Zerfall nur bei A).
- **Entscheide des Koordinators** (der Nutzer war nicht erreichbar):
  - Ersetzt wird, was beide KI-Tester ablehnen, und ein Level mit Gefühl im Mittel unter 3 (in jedem Grad) oder ab
    „mittel“ ohne Aha-Moment bei beiden. Genau 3 reicht (Sonnenwind: sehr schwere Kandidaten sind knapp, B lobt es).
  - **Vorprüfung auf Zerfall** (`ZWEITER_TEIL_HOECHSTENS` in `tools/ausbau.mjs`): Alle 5 Ablehnungen aus `ausbau-1`
    hatten einen zweiten unabhängigen Teil mit genau 2 drehbaren Elementen; die Regel der Beurteilung schliesst erst ab
    3 aus. Ohne solchen zweiten Teil nannte kein KI-Tester Zerfall. Seither kommt in jedem Grad nur in Frage, wessen
    zweiter Teil höchstens 1 drehbares Element hat (in „leicht“, weil beide leichten Kandidaten mit 2 mühsam waren).
    Die Regel der Beurteilung bleibt unverändert; `gruppen` in `zerfall.mjs` ist dafür exportiert.
  - **Suche gegen offene Häufungen** mit `--auch-gesetzte`: Mit nur wenigen freien Plätzen löste die Suche die
    Häufungen nicht; dann darf sie auch schon beurteilte Level tauschen, aber nur bei echter Verbesserung, und es gilt
    der beste Stand (wenig offen, dann wenig getauschte). So kamen nach `ausbau-1` 11 statt 6 Level neu dazu, darunter
    die zwei sehr schweren mit Gefühl 3.
  - `prepare.mjs` überspringt in der Vorschau Kandidaten, die schon ein zählendes Urteil haben (sonst wiese die
    Levelliste ein zweites Urteil ab).
  - Ab `ausbau-1-2` bekommen die KI-Tester als Prompt den Verweis auf ihre Auftragsdatei statt ihres Inhalts (gleicher
    Inhalt, ohne Abschreibfehler); sie lesen ausser ihr nur `eingabe/`.
- **Pilot, Dauer und Ausbeute:** Pool 1 (20 Aufträge × 200 Seeds) 231 s, 1220 Level; Pool 2 (15 × 400) 271 s, 2342
  Level; „sehr schwer“ (5 × 2000) 1353 s, 387 Level (Mischziel 144, Sammelstelle 128, Abzählen 55, Abschalten 32,
  Falle 28). Nach der Vorprüfung auf Zerfall kommen etwa 40 % der Kandidaten in Frage. Ein Lauf der KI-Tester für 35
  Level: Screenshots rund 40 min, Urteile rund 17 min; vier Läufe bis zur fertigen Gruppe, zusammen etwa 3 Stunden mit
  Wahl und Schreiben. Mit der Vorprüfung erwartet: 1–2 Läufe je Gruppe.
- **Tests:** Logik 653, Levelliste 51, KI-Tester 65, Golden 194 Level (nach
  `--write`), Beurteilung 178, alle grün. Angepasst: Der erfundene Fall „Ganze Regel mit einem Level des Ausbaus“ rechnet
  ohne die echten Urteile des Ausbaus (deren Korrekturen verschoben das erfundene Level mit). Stichprobe der
  Screenshots: Lichtblick (3) und Andromeda (175), Desktop und Handy, ohne Befund.

**Review (20.10.2026)** (nur Werkzeuge und Tests: `tools/ausbau.mjs`, `tools/ki-tester/prepare.mjs`,
`tools/beurteilung/ausschluesse/zerfall.mjs`, `tests/levelliste.test.mjs`)

- **Stimmt mit dem Kommentar überein:** Vorprüfung auf Zerfall (`zweiterTeil` über das exportierte `gruppen`, die Regel
  der Beurteilung unverändert), `--auch-gesetzte` (Level aus `--behalte` je Level dreimal seltener gezogen, nur bei
  echter Verbesserung getauscht), bester Stand der Suche, `prepare.mjs` überspringt beurteilte Kandidaten (über
  `kandidatName`, wie die Namen im Protokoll stehen), der angepasste Test.
- **Randfälle geprüft:** Ohne freie und ohne tauschbare Level läuft die Suche nicht, der beste Stand ist dann die Wahl
  selbst. Der Zufall hängt nur an der Gruppe und an der Reihenfolge der Kandidaten, bleibt also deterministisch (die
  Folge ist durch die neue Liste `tauschbar` eine andere als vor dem Ticket, das ist gewollt). Ohne `--auch-gesetzte`
  gibt die Suche jetzt den ersten Stand mit dem besten Ergebnis aus statt des letzten, gleich gut. Sind in der
  Vorschau alle Kandidaten schon beurteilt, bricht `prepare.mjs` mit einem Fehler ab (gewollt).
- **Eingearbeitet** (834e7d2): Der Aufruf von `wahl` nennt `--auch-gesetzte`; im Kopf „mit 2 und mehr drehbaren
  Elementen“ statt „mit 2“; der Fehler von `prepare.mjs` nennt in der Vorschau, dass nur Kandidaten ohne Urteil zählen.
  Levelliste 51 und KI-Tester 65 Tests grün.
- **Offen (klein, nur zur Kenntnis):** In `vorBest` ist der zweite Teil (weniger getauschte bei gleichem Ergebnis) heute
  wirkungslos: Ein Level aus `--behalte` steht nicht in `inFrage` und kehrt nach einem Tausch nie zurück, die Zahl der
  getauschten steigt also nur. Unschädlich; es greift erst, wenn sie zurückkehren könnten. Ebenso wird ein Platz, an
  dem ein Level aus `--behalte` schon getauscht ist, danach wie ein freier behandelt (ohne „echt besser“), nur mit
  einem Drittel der Häufigkeit; auch das ist sinnvoll, da das neue Level ohnehin ein Urteil braucht.
- **Bereit zum Mergen:** ja (was die Werkzeuge betrifft).
