# 05: Gruppe 4 (290 Level)

**What to build:** 35 neue Level aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je Grad (leicht /
mittel / schwer / sehr schwer): 6 / 19 / 7 / 3. Danach stehen 290 Level im Spiel: 53 / 150 / 61 / 26.

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 04

**Status:** resolved

- [x] 35 neue Level im Spiel, je Grad wie oben; Fehlmengen eines Grads sind begründet und für die nächste Gruppe
      vermerkt.
- [x] Jedes neue Level hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee und ist
      keinem anderen Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt (Protokoll); von beiden abgelehnte sind ersetzt.
- [x] Namen im bisherigen Stil vergeben, eindeutig, keiner von der Liste entfernter Level (ohne Freigabe des Nutzers).
- [x] Herkunft jedes Levels (Auftrag, Seed, Ziel-Schwierigkeit) ist nachbaubar.
- [x] Golden-Test-Referenz nachgeführt, alle Tests grün, Stichproben der Screenshots geprüft, auf main gemergt.

## Comments

**Zwischenstand (22.10.2026):** Die Wahl `ausbau-4` (16 schon beurteilte, 19 im Lauf `ausbau-4` beurteilt, kein
abgelehntes und kein schwaches) liess sich nicht schreiben: Auf den Plätzen 221–230 stehen 4-mal „Farben abzählen“
(Tandem, Supernova aus dem Bestand, Seilschaft und Pilgerweg aus Gruppe 3). Die Häufungsregel nahm nur einen Zug, der
eine Häufung ganz auflöst; bei 4-mal derselben Haupt-Kernidee gibt es keinen solchen, wie weit auch immer. Auch die
Suche nur über beurteilte Kandidaten (`ausbau-4-2`, sechs Startwerte, 6000 Schritte) fand keine Wahl ohne Fehler.

**Entscheid (selbst, im Sinn des Nutzerentscheids vom 22.10.2026, „bestehende Level dürfen verschoben werden, wenn
nötig“):** Die Häufungsregel (`entzerre` in `tools/levelliste.mjs`) nimmt jetzt auch eine Folge von Zügen, die eine
Häufung je verkleinern und am Ende auflösen, mit einer kleinen Vorausschau: Ein verkleinernder Zug gilt nur, wenn die
Häufung danach ganz aufgeht. Lässt sie sich mit einem Zug auflösen, wählt die Regel wie bisher, darum ändert sich am
Bestand nichts. Dazu rückt ein Level im Ausbau um höchstens 5 statt 3 Plätze (`MAX_ENTZERREN_AUSBAU`,
`maxEntzerren`); ohne Ausbau bleiben es 3. Tests: Levelliste 53 (neu: 4-mal auf einer Seite, Grenze im Ausbau).

**Nachtrag:** Die Suche `ausbau-4-3` (nur beurteilte, neue Regel) liess bei allen Startwerten die Häufung auf
221–230 offen (3- oder 4-mal „Farben abzählen“). Grund: Auf 211–240 stehen 7 Level mit dieser Haupt-Kernidee, drei
Seiten fassen höchstens 6; Verschieben allein reicht nicht, es braucht dort mehr schwere Level mit anderer
Haupt-Kernidee. Ein Startwert hing über eine Stunde, weil die Vorausschau bei einer unlösbaren Häufung zu stark
verzweigte; sie prüft jetzt höchstens `VORAUSSCHAU` = 40 Stellungen je Häufung. Nächste Runde `ausbau-4-4` über alle
Kandidaten; die neu gewählten beurteilen die KI-Tester.

**Ergebnis (22.10.2026, Branch `ausbau/05-gruppe-4`)**

- **Im Spiel:** 290 Level, 53 / 150 / 61 / 26, genau wie die Tabelle. Neu je Grad 3 / 22 / 8 / 2 statt 6 / 19 / 7 / 3,
  weil Gruppe 3 bewusst verschoben war (Ticket 04) und `wahl` den Bedarf aus dem Spiel rechnet.
- **Neu:** Schneeflocke, Sonnenblume, Löwenzahn (leicht); Spiegelwand, Glaswand, Lichtzelt, Lichtfeder, Farbenrad,
  Spektrum, Farbtafel, Farbmuster, Zwischenton, Halbton, Farbton, Lichtton, Farbklang, Akkord, Harmonie, Melodie,
  Kanon, Fuge, Sonate, Rondo, Menuett, Walzer (mittel); Fernweh, Kompassnadel, Sternenkarte, Seekarte, Leuchtfeuer,
  Lotsenboot, Hafeneinfahrt, Ankerplatz (schwer); Aldebaran, Arktur (sehr schwer).
- **KI-Tester:** Läufe `ausbau-4` (19), `ausbau-4-4` (2), `ausbau-4-5` (1), dazu 13 aus früheren Läufen. Abgelehnt
  keines, schwach keines. Eine Korrektur (−5) in `ausbau-4-4` öffnete die Häufung auf 221–230 wieder; die Runde
  `ausbau-4-5` kannte sie und fand eine Wahl ohne Fehler.
- **Werkzeug:** Häufungsregel mit Folgen verkleinernder Züge und Vorausschau (`VORAUSSCHAU` = 40), im Ausbau höchstens
  5 Plätze (`MAX_ENTZERREN_AUSBAU`). Startwerte der Suche, die mehr als doppelt so lange rechneten wie die übrigen,
  habe ich abgebrochen (je Runde 1–2 von 6); die übrigen reichten.
- **Tests:** Logik 968, Levelliste 53, KI-Tester 65, Golden 299 (nach `--write`), Beurteilung 178, alle grün.
  Stichprobe: Fuge (167, Desktop) und Arktur (280, Handy), ohne Befund.

**Review (22.10.2026):** keine mittleren oder grossen Befunde. Der Reviewer bestätigt: Wo ein Zug eine Häufung
auflöst, wählt `entzerre` wie vorher; die Schleife endet; das Budget gilt je Häufung. Klein und selbst behoben:
zwei zu lange Importzeilen, ein Satz im Kopfkommentar. Hinweis übernommen: zuerst nur die Züge der betroffenen Level
prüfen (spart Proben). Dazu aus der Wahl für Gruppe 5: Das Mittel je 10 Level zählt nur volle Seiten
(`fallendeSeiten`), und fällt es schon vor den Zügen auf einer Seite, darf ein Zug nur keine weitere fallen lassen;
sonst sperrte ein einziger Verstoss jeden Zug (siehe Ticket 06).
