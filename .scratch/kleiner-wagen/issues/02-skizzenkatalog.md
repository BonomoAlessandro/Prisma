# 02: Skizzenkatalog für Menü, Übersicht und Leiste

**Spec:** ../spec.md

**Blocked by:** –  (läuft parallel zu den übrigen Tickets ab Beginn)

**Status:** ready-for-agent

**What to build:** Ein Katalog von Varianten, wie der Kleine Wagen in Menü, Übersicht und die Leiste unter dem
Untertitel kommt (Entscheide 9, 17, 21; Abschnitt «Skizzenkatalog» der Spec). Der Nutzer wählt daraus; eingebaut wird
erst in Ticket 08. Dieses Ticket berührt `index.html` nie, nur Dateien in diesem Ordner.

- [x] **Vorbilder recherchieren**, bevor gezeichnet wird: Sternkarten, Fortschrittsanzeigen mit Sternbildern in
      Spielen und Apps, Sternbilder als Navigation. Kurze Liste mit Quelle und dem, was davon brauchbar ist, in den
      Comments dieses Tickets. Ziel: Varianten, die sich wirklich unterscheiden, nicht nur in Markierungen.
- [x] **Eine Katalogseite** in diesem Ordner (Unterordner `katalog/`), im Browser direkt zu öffnen.
- [x] **Menü:** 5–6 Varianten, das heutige «Lichtwege zum Polarstern» als Vergleich. Ideen aus dem Grilling als
      Ausgangspunkt (Punkte der Lichtwege werden die Sterne; grosser Wagen hinter dem Polarstern für den Grad im
      Fokus; je Karte ein kleiner Wagen), dazu eigene aus der Recherche.
- [x] **Übersicht:** 3 Varianten (etwa jede Welt mit ihrem Stern im Kopf, hell, sobald sie geschafft ist).
- [x] **Leiste unter dem Untertitel:** 3 Varianten: die heutige (Dorf und sechs Welten mit Linien), ein kleiner Wagen
      mit den Welten als Sternen, eine Mischform.
- [x] Je Variante umschaltbar: **Stand** (nicht begonnen, in der Wüste, geschafft), **Format** (Desktop, Handy hoch,
      Handy quer) und der **Moment**, in dem ein Stern neu aufleuchtet (abspielbar). Tasten und Knöpfe, auch per
      Finger.
- [x] Der Wagen hat in allen Varianten die Form des Ladezeichens und die Reihenfolge der Spec (Stern 1 Bergwald …
      6 Sterne, Polarstern an der Spitze der Deichsel; Schale schliesst sich mit Stern 4).
- [x] Im Stil des Spiels (Schrift, Farben, Nachthimmel wie Menü und Startbildschirm), damit der Vergleich zum
      heutigen Menü fair ist.
- [x] Zusätzlich als **private Artifact-Seite** veröffentlicht, damit der Nutzer sie auf dem Handy öffnen kann; Link
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

**04.11.2026, Katalog gebaut** (`katalog/katalog.html`, eine Datei mit CSS und JS, Schrift Jost von Google Fonts, der
Himmel gezeichnet, keine Bilder; im Browser direkt per Datei zu öffnen; auf 390 px Breite ohne waagrechtes Scrollen
geprüft).

Vorbilder (Recherche vor dem Zeichnen):

- Skyrim, Menü der Fähigkeiten ([Game Informer](https://www.gameinformer.com/games/the_elder_scrolls_v_skyrim/b/xbox360/archive/2011/01/28/skyrim-menu-system-overhaul.aspx)):
  Fähigkeiten als Sternbilder an einem Nachthimmel, die Kamera schwenkt zum gewählten. Brauchbar: mehrere Wagen an
  einem Himmel, Schwenk statt Liste (Menü E).
- Ōkami ([Wikipedia](https://en.wikipedia.org/wiki/%C5%8Ckami)): Sternbilder mit fehlenden Sternen; erst ergänzt
  erwacht der Gott. Brauchbar: der nächste, noch schlafende Stern als Lücke mit Ring, noch fehlende Linien gestrichelt
  (Menü F), das «Erwachen» als Moment.
- Sky: Children of the Light ([App Unwrapper](https://www.appunwrapper.com/2019/07/28/sky-children-of-the-light-spirit-locations-guide/)):
  Sternbildtisch zu Hause, je Reich ein Sternbild, befreite Geister leuchten, fehlende grau. Brauchbar: je Grad ein
  eigener Wagen, nebeneinander oder zum Durchblättern (Menü D, E).
- Genshin Impact, Sternbild einer Figur ([Pro Game Guides](https://progameguides.com/genshin-impact/genshin-impact-character-constellations/)): sechs Knoten,
  einzeln antippen und freischalten. Brauchbar: der Wagen als Bedienelement, ein Stern = eine Welt (Übersicht B, Menü F).
- GRIS ([ludo.guide](https://www.ludo.guide/guide/gris), [Analog Stick Gaming](https://www.analogstickgaming.com/nintendo-reviews/2018/12/15/gris)):
  gesammelte Lichter werden zu einem Sternbild, über das man am Ende aufsteigt. Brauchbar: der Lichtweg führt durch
  die Sterne (Menü B).
- Bejeweled Stars ([EA Hilfe](https://help.ea.com/en/help/popcap/bejeweled-stars/how-do-i-complete-constellations-)):
  gelöste Level füllen Sternbilder. Brauchbar: Level als kleine Sterne um den Stern ihrer Welt (Übersicht C).
- Sternkarten der IAU und von Sky & Telescope, Ursa Minor ([constellation-guide](https://www.constellation-guide.com/constellation-list/ursa-minor-constellation),
  [EarthSky: Kochab und Pherkad](https://earthsky.org/brightest-stars/kochab-and-pherkad-guard-the-north-celestial-pole)):
  Punktgrösse nach Helligkeit, Namen an den Sternen, Kreise um den Pol. Unsere Zuordnung trifft das echte Sternbild:
  Stern 1 = Kochab (2,1 mag, hell aussen an der Schale), 2 = Pherkad, 4 = ζ (Ansatz der Deichsel). Brauchbar: Namen
  der Welten an ihren Sternen, Grösse statt Farbe (Menü F).
- Stellarium ([ConstellationMgr](https://stellarium.org/doc/head/classConstellationMgr.html)), Star Walk 2
  ([Hilfe](https://starwalk.space/en/tutorials/how-to-turn-off-the-images-of-constellations)): Linien, Namen und Bilder
  eines Sternbilds blenden je für sich weich ein. Brauchbar: Linien ziehen sich, statt hart zu erscheinen; der Wagen
  zeigt den Grad, auf den man schaut (Menü C).
- Outer Wilds, Logbuch ([Modding-Anleitung zum Schiffslog](https://nh.outerwildsmods.com/guides/ship-log/)): Einträge
  als Karten in Reihen je Planet. Brauchbar: Die Übersicht darf ein Kartenraster bleiben, der Stern gehört in den Kopf
  der Reihe (Übersicht A).
- Astronomie: Der Kleine Wagen dreht sich jede Nacht einmal um den Polarstern ([Wikipedia: Ursa Minor](https://en.wikipedia.org/wiki/Ursa_Minor)).
  Brauchbar: vier Grade als vier Stunden derselben Nacht (Menü B).

Varianten (je erste = heutiges Spiel):

- Menü A «Heute: Lichtwege zum Polarstern»: das heutige Menü zum Vergleich; der Moment ist das Wachsen des Lichts.
- Menü B «Vier Wagen um den Polarstern»: jeder Lichtweg führt durch die Sterne seines Wagens, die vier Wagen hängen
  fächerförmig am gemeinsamen Polarstern, der Grad steht am Ende der Schale.
- Menü C «Grosser Wagen hinter dem Polarstern»: heutige Lichtwege, der Polarstern ist die Spitze eines grossen Wagens,
  der den Grad unter Zeiger oder Fokus zeigt.
- Menü D «Je Karte ein kleiner Wagen»: vier Karten, jede mit dem Wagen ihres Grads, «Weiter» darunter.
- Menü E «Ein Himmel, vier Wagen»: vier Wagen an einem weiten Himmel, der Grad im Fokus gross in der Mitte, Schwenk mit
  Pfeilen oder Wischen.
- Menü F «Sternkarte mit Reitern»: ein grosser Wagen wie auf einer Sternkarte (Namen der Welten, Punktgrösse nach
  Helligkeit, fehlende Linien gestrichelt), die Grade als Reiter.
- Übersicht A «Stern im Kopf»: heutiges Raster; im Kopf jeder Welt der kleine Wagen mit ihrem Stern hervorgehoben, auf
  dem Handy über jedem Zeichen der Welten ihr Stern.
- Übersicht B «Wagen als Wegweiser»: Stern antippen, daneben die zehn Level seiner Welt; das Dorf als eigene Station.
- Übersicht C «Sternhaufen»: um jeden Stern seine zehn Level als kleine Sterne, Haufen antippen zeigt die Liste.
- Leiste A «Heute: Dorf und sechs Welten»: die heutige Leiste.
- Leiste B «Kleiner Wagen»: der Wagen selbst, Ring am Stern der Welt, in die das Licht fliegt, darunter ihr Zeichen und
  Name.
- Leiste C «Zeichen im Wagen» (Mischform): die Zeichen der Welten an den Sternen des Wagens, durch seine Linien verbunden.

Bedienung: oben Bereich (M, U, L), Stand (1, 2, 3), Format (D, H, Q), Moment abspielen (P); Tippen auf eine Vorschau
zeigt sie gross (← → Variante, Esc). Im Grossbild lassen sich Menü C, E, F und alle Übersichten antippen. Für Bilder:
`katalog.html?nur&bereich=menue&v=B&format=hoch&stand=wueste&t=1.0` (ein Bildschirm, im Moment eingefroren) und
`?blatt&bereich=…&format=…` (alle Varianten); `aufnahme.mjs` macht daraus `katalog/bilder/` (nicht versioniert).

Offen: Menü B dreht den Wagen (nur Leicht steht wie am Himmel); Wahl des Nutzers je Bereich; Artifact-Link.

**04.11.2026, Review** (unabhängig; Chrome stumm über `tools/leise.sh`, LEISE_CPU=50): bestanden mit Korrekturen.

- Wagen in allen 108 Bildschirmen (12 Varianten × 3 Stände × 3 Formate) aus dem DOM gelesen: Form wie das Ladezeichen
  (Abweichung höchstens 0,1 %), nirgends gedreht ausser Menü B, Sterne, Ringe und Linien je Stand wie in der Spec
  (nicht begonnen: keine Linie; in der Wüste: Sterne 1 und 2, Linie 1–2, Ring an 3; geschafft: alle sieben Linien).
  Die Momente abgetastet: Erwachen von Stern 2 mit Linie zu 1, dann Zucken von 3; Finale mit Stern 6, Puls 1 → 6 in
  dieser Reihenfolge, Linie zum Polarstern ab 4 s, Polarstern flammt danach auf. Konsole leer, auf 390 px kein
  waagrechtes Scrollen, Tasten, Grossbild und die bedienbaren Varianten tun, was sie sollen.
- Korrigiert in `katalog/katalog.html`: Wischen in Menü E ging mit dem Finger nicht (der Browser brach mit
  `pointercancel` ab) und mit der Maus nur, wenn man über mehrere Wagen zog (der Klick auf den Wagen darunter sprang
  zurück); beides behoben und nachgeprüft. Menü B: «nur Leicht steht wie am Himmel» stimmte nur auf dem Handy hoch
  (Desktop: keiner genau, Schwer etwa 6°; quer: Schwer); jetzt eigene Zeile «Abweichung von der Spec» mit Verweis auf
  Entscheid 4. Knöpfe bei Fingerbedienung 44 px hoch (statt 40). Titel der Seite «Skizzenkatalog Kleiner Wagen» (für
  das Artifact).
- Hinweise ohne Änderung: In der Übersicht A auf dem Handy stehen die Sterne über den Zeichen der Welten in einer Reihe,
  nicht in Wagenform (der kleine Wagen im Kopf hat die Form). Das Schliessen der Schale mit Stern 4 lässt sich in keinem
  der drei Stände abspielen. Auf dem Handy bleibt die Steuerung oben (nicht mitlaufend); das Grossbild hat Stand,
  Format und Moment, aber nicht den Bereich.
- Quellen der Recherche aufgerufen: erreichbar und zum Thema, mit diesen Ausnahmen. Entfernt: der Kurzlink von
  GameBanshee (eine Nachrichtenübersicht zu Skyrim-Vorschauen vom 08.06.2011, nur am Rand zum Menü; Game Informer
  bleibt als Beleg) und der Fandom-Spiegel zu Ōkami (nur eine Bot-Sperre; Wikipedia bleibt). Unbestätigt: EA zu
  Bejeweled Stars (ein automatischer Abruf landet auf der Startseite der Hilfe), Pro Game Guides und App Unwrapper
  (sperren automatische Abrufe).

**04.11.2026, Koordinator:** Review bestanden mit Korrekturen (siehe Review-Notiz). Als private Artifact-Seite
veröffentlicht: https://claude.ai/artifact/FPj7CsvjGuVnwEEYoCm1pf (aus einer Kopie ohne `<!doctype>`/`<html>`/`<head>`/
`<body>`, sonst gleich wie `katalog/katalog.html`). Wartet auf die Wahl des Nutzers je Bereich (Menü, Übersicht,
Leiste); erst dann `resolved` und Ticket 08 frei.
