# 02: Skizzenkatalog für Menü, Übersicht und Leiste

**Spec:** ../spec.md

**Blocked by:** –  (läuft parallel zu den übrigen Tickets ab Beginn)

**Status:** ready-for-agent

**What to build:** Ein Katalog von Varianten, wie der Kleine Wagen in Menü, Übersicht und die Leiste unter dem
Untertitel kommt (Entscheide 9, 17, 21; Abschnitt «Skizzenkatalog» der Spec). Der Nutzer wählt daraus; eingebaut wird
erst in Ticket 08. Dieses Ticket berührt `index.html` nie, nur Dateien in diesem Ordner.

- [ ] **Vorbilder recherchieren**, bevor gezeichnet wird: Sternkarten, Fortschrittsanzeigen mit Sternbildern in
      Spielen und Apps, Sternbilder als Navigation. Kurze Liste mit Quelle und dem, was davon brauchbar ist, in den
      Comments dieses Tickets. Ziel: Varianten, die sich wirklich unterscheiden, nicht nur in Markierungen.
- [ ] **Eine Katalogseite** in diesem Ordner (Unterordner `katalog/`), im Browser direkt zu öffnen.
- [ ] **Menü:** 5–6 Varianten, das heutige «Lichtwege zum Polarstern» als Vergleich. Ideen aus dem Grilling als
      Ausgangspunkt (Punkte der Lichtwege werden die Sterne; grosser Wagen hinter dem Polarstern für den Grad im
      Fokus; je Karte ein kleiner Wagen), dazu eigene aus der Recherche.
- [ ] **Übersicht:** 3 Varianten (etwa jede Welt mit ihrem Stern im Kopf, hell, sobald sie geschafft ist).
- [ ] **Leiste unter dem Untertitel:** 3 Varianten: die heutige (Dorf und sechs Welten mit Linien), ein kleiner Wagen
      mit den Welten als Sternen, eine Mischform.
- [ ] Je Variante umschaltbar: **Stand** (nicht begonnen, in der Wüste, geschafft), **Format** (Desktop, Handy hoch,
      Handy quer) und der **Moment**, in dem ein Stern neu aufleuchtet (abspielbar). Tasten und Knöpfe, auch per
      Finger.
- [ ] Der Wagen hat in allen Varianten die Form des Ladezeichens und die Reihenfolge der Spec (Stern 1 Bergwald …
      6 Sterne, Polarstern an der Spitze der Deichsel; Schale schliesst sich mit Stern 4).
- [ ] Im Stil des Spiels (Schrift, Farben, Nachthimmel wie Menü und Startbildschirm), damit der Vergleich zum
      heutigen Menü fair ist.
- [ ] Zusätzlich als **private Artifact-Seite** veröffentlicht, damit der Nutzer sie auf dem Handy öffnen kann; Link
      in den Comments.
- [ ] Review (Varianten verschieden genug, Formate stimmen, nichts in `index.html`), dann dem Nutzer vorlegen. Seine
      Wahl je Bereich (Menü, Übersicht, Leiste) in den Comments festhalten; das gibt Ticket 08 frei.

## Anhaltspunkte

- Heutiges Menü und Übersicht als Bausteine: `.scratch/noa-geschichte/bausteine/` (Menü und Übersicht; das Spiel ist
  massgebend, die Bausteine kennen nicht alles), Vorschauen in `.scratch/noa-geschichte/menue-vorschau/`.
- Im Spiel: `createMenu` (Stil-Präfix `menue-`), `createUebersicht`, die Leiste `fillPath` mit `STORY_STATIONS` und
  `STORY_ICONS`.
- Vorgehen bei offenen Gestaltungsfragen: breit streuen, Vorbilder zeigen, schnell vergleichbar (wie beim
  Ladezeichen, Prototyp auf Branch `prototyp/ladeindikator`).

## Comments
