# 01: Gestalt und Stand des Wagens, Sprungbrett, Vorher-Lauf

**Spec:** ../spec.md

**Blocked by:** –

**Status:** ready-for-agent

**What to build:** Die Grundlage für alle weiteren Tickets: Der Kleine Wagen steht als Form, Reihenfolge, Linien und
Stand an einer Stelle im Code (Entscheide 4–6, 10, Abschnitt «Der Wagen» der Spec). Dazu das Sprungbrett zur Abnahme
(Entscheide 24, 25) und ein Lauf der Probe auf dem heutigen Stand, an dem spätere Tickets die Dauer von Reisen und
Finale messen (Entscheid 19). Im Bild ändert sich in diesem Ticket noch nichts ausser dem Knopf «Szenen».

Zuerst den Branch `feature/kleiner-wagen` von main anlegen.

- [ ] **Vorher-Lauf**, bevor etwas an `index.html` geändert wird: die Browser-Probe der Geschichte mit dem ganzen
      Durchgang in «leicht» (Desktop und Handy hoch), Dauer jedes Einstiegs, jeder Reise und des Finales (vom Klick
      auf «Weiter» bis zum spielbaren Level bzw. bis zum Epilog) und ihre Bildzeiten. Ergebnis als Datei in diesem
      Ordner (nicht in `tests/output/`, das ist ignoriert), damit spätere Tickets dagegen messen.
- [ ] **Wagen-Modul an einer Stelle:** sieben Sterne in der Form des Ladezeichens (Polarstern zuerst), die
      Reihenfolge des Erwachens (Stern 1 Bergwald … Stern 6 Sterne, 7 Polarstern), die Linien je erwachtem Stern
      (k − 1 → k, mit Stern 4 zusätzlich 4 → 1; 6 → 7 erst nach dem Finale).
- [ ] **Stand aus dem Durchgang ableiten**, ohne neue Felder im Speicherstand: welche Sterne wach, welche Linien
      gezogen, welcher Stern der nächste. Ein Stern ist wach, sobald das letzte Level seiner Welt gelöst ist; ein
      geschaffter Grad hat alle sieben Linien. Je Grad getrennt; «Von vorn» ergibt alle schlafend.
- [ ] Der Stand ist über das Objekt der Geschichte lesbar, das die Testschnittstelle schon zeigt (keine neue
      Schnittstelle, nichts, was ein Level überspringt).
- [ ] Das **Ladezeichen** nimmt seine Form aus dem Wagen-Modul und sieht genau aus wie vorher (Bilder vorher/nachher
      vergleichen, auch Grösse und Lage `oben`).
- [ ] **Sprungbrett** (nur mit `?szenen`): Knopf «Szenen» in einer Ecke, der eine Liste öffnet: Prolog, Einstieg ins
      Dorf, Einstieg in den Bergwald, Bergwald → Meer, Meer → Wüste, Wüste → Vulkan, Vulkan → Planeten, Planeten →
      Sterne, Finale, Epilog. Bedienbar mit Maus, Finger und Tastatur; nicht im Weg von Menü, Übersicht und Knöpfen
      des Spiels.
- [ ] Jeder Sprung setzt einen vorübergehenden Stand, der dem Durchgang an dieser Stelle entspricht (vor dem Vulkan
      drei Sterne wach usw.), und spielt die Szene von ihrem natürlichen Anfang (beim Ende einer Welt: ab dem
      Aufstieg nach dem letzten Level). Danach geht es normal weiter; das nächste Level ist spielbar.
- [ ] Solange `?szenen` gilt, schreibt das Spiel weder Stand noch Bestwerte. Nach Neuladen ohne Parameter ist alles
      wie vorher (prüfen).
- [ ] Das Sprungbrett ist ein abgegrenzter Teil, den Ticket 10 mit einem Schnitt entfernen kann (an wenigen,
      markierten Stellen; im Kommentar steht, dass es vorübergehend ist, Ausnahme von ADR 0005).
- [ ] **Probe** erweitert um einen Ablauf für den Wagen (über das Menü gespielt, gelöst über die Testschnittstelle):
      Stand nach jeder Welt, nach Neuladen mitten in einer Welt, beim Fortsetzen, nach Wechsel über das Menü, beim
      Wiederholen einer früheren Welt, je Grad getrennt, nach «Von vorn» (Bestwerte bleiben), geschaffter Grad.
- [ ] Alle bestehenden Tests grün; Review nach dem Ticket.

## Anhaltspunkte im Code

- Form heute in `ladeZeichen` (Sterne `P`, Linien `K`); `#lade` und seine Grösse bleiben dort.
- Stand je Grad: `story` mit `setGrade`, `menuStand`, `progress` (`prisma.noa.<grad>`), `STORY_LEVELS`,
  `STORY_CHAPTERS`, `storyChapterId`.
- Testschnittstelle: `window.__prismaDebug` (zeigt `story`, `progress`, `skyTheme`), `loese()`.
- Probe: `tests/geschichte-probe.mjs` (Abläufe `--ganz`, `--uebersicht`, `--dorf` als Vorbild).
- Der Parameter `?wagen=<faktor>` gehört dem Ladezeichen; neue Namen nicht damit verwechseln.

## Comments
