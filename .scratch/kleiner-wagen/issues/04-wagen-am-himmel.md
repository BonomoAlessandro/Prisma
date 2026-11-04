# 04: Wagen am Himmel der Welten und des Dorfs

**Spec:** ../spec.md

**Blocked by:** 01, 03  (nacheinander in `index.html`)

**Status:** ready-for-agent

**What to build:** Der Kleine Wagen steht an einer festen Stelle am Himmel jeder Welt und über dem Dorf, im Stand des
Durchgangs (Entscheide 10, 11, 20; Abschnitt «Der Wagen», Ablauf 2 und 4 der Spec). Noch ohne Erwachen und ohne neuen
Flug; die kommen in Ticket 05.

- [ ] Ein eigenes, leichtes Objekt am Himmel (sieben Sterne, die gezogenen Linien) mit **fester Richtung** in der
      Welt, unabhängig von der Skybox. Beim Wechsel der Welt (Reise, Wiederholen über eine Weltgrenze) blendet es
      nicht mit, es bleibt stehen.
- [ ] **Helligkeit** nach der Tabelle der Spec: geweckte Sterne und Linien hell, auch bei Tag; Stern dieser Welt bei
      Nacht blass und kaum merklich atmend, bei Tag ein feiner Funke; übrige schlafende bei Nacht blass wie
      Hintergrundsterne, bei Tag unsichtbar; Polarstern bei Nacht mittelhell, bei Tag blass.
- [ ] **Tag oder Nacht** aus dem Himmel abgeleitet (keine Hintergrundsterne = Tag), nicht nach Namen der Welten;
      beim Überblenden zwischen zwei Welten gleitet die Helligkeit mit.
- [ ] Über dem **Dorf** (Kapitel «Im Dorf») alle sechs Sterne schlafend, wie im Prolog.
- [ ] **Stand** aus dem Wagen-Modul (Ticket 01): nach Neuladen, Fortsetzen, Wechsel über das Menü und beim Wiederholen
      der Stand des Durchgangs; je Grad getrennt.
- [ ] **Feste Stelle** so gewählt, dass in jeder Welt der Stern dieser Welt beim heutigen Aufstieg gut im Bild liegt
      (der des Vulkans über der Kraterwand) und im Finale der ganze Wagen ins Bild passt, in Desktop, Handy hoch und
      quer. Bilder dazu für das Review; Ticket 05 und 06 bauen darauf.
- [ ] Im **Spiel** steht der Wagen ohne Hervorhebung am Himmel; er darf das Brett nicht überdecken und nicht mit dem
      Bloom ausfransen.
- [ ] **Grösse und Helligkeit** an einer Stelle; dazu vorübergehend Parameter zum Abstimmen während der Abnahme, als
      Teil des Sprungbretts markiert (Ticket 10 entfernt sie).
- [ ] **Leistung:** keine messbare zusätzliche Bildzeit im Spiel und auf den Reisen (Probe gegen den Vorher-Lauf,
      Handy-Emulation mit Pixeldichte des Poco); die Leerlauf-Regeln des Spiels bleiben (der Wagen weckt die Schleife
      nicht ohne Not; das Atmen nur, wo die Schleife ohnehin läuft, sonst ruhig).
- [ ] Probe: Bilder je Welt mit dem Wagen am Himmel (Tag und Nacht, verschiedene Stände), Bildzeiten wie vorher.
- [ ] Alle Tests grün; Review nach dem Ticket.

## Anhaltspunkte im Code

- Himmel: `skyTheme` (Register `SKY_ENTRIES`, `sky.stars`, `sky.starsAboveHorizon`, Überblenden `fading`, `weight`),
  Sternfeld `stars` (Uniforms `uFade`, `uHorizon`), Himmelskugel `background`; zwischen zwei Welten auf der Erde
  `story.blendSky`.
- Tag-Himmel heute: Strand (`beach`) und Wüste (`desert`) mit `stars: 0`; Nacht: Dorf, Wald, Vulkan mit 0,3;
  Sonnensystem und Milchstrasse aus dem Code.
- Aufstieg heute: `story.ascend(elevation, star)` mit `aimGaze`, `STORY_UP`, `up` des Vulkans (1,0).
- Leerlauf: `sceneLoop` (wecken nur, wenn sich etwas bewegt).

## Comments
