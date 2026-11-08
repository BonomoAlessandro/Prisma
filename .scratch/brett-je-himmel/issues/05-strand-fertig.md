# 05: Strand fertig

**Spec:** ../spec.md

**Blocked by:** 04

**Status:** ready-for-human

**What to build:** Die gewählte Richtung wird für den Strand fertig gebaut, bis der Nutzer sie abnimmt. Dazu gehört der
Weg, wie zwei Bretter verschiedener Form ineinander übergehen. Diese Richtung ist das Muster für Wüste, Wald, Dorf und
Vulkan.

- [ ] **Ausarbeiten:** Die gewählte Richtung wird nach den Rückmeldungen des Nutzers ausgearbeitet. Mehrere Runden
      sind möglich, jede mit Bildern wie in Ticket 04.
- [x] **Werte in die Brett-Angabe:**
      - Die Werte stehen in der Brett-Angabe des Strands (`skybox.json`, `board`).
      - Das Register wird über die Betriebsart aus Ticket 01 nachgeführt, die nur die Brett-Angabe überträgt.
      - Das Prüfwerkzeug kennt die erlaubten Werte der Art und lehnt ungültige ab. Ein Logiktest zeigt das an einem
        abgeänderten Eintrag.
- [x] **Übergang zwischen Formen:** Festlegen und bauen, wie zwei Bretter verschiedener Form ineinander übergehen,
      zum Beispiel durch ein Auflösen oder ein Wachsen wie bei den Elementen.
      - Der Übergang dauert gleich lang wie der Himmel, und dazwischen steht kein Steinbrett.
      - Im Schnitt der Kernquader ist jedes Pixel gedeckt.
      - Geprüft wird auf der Reise vom Bergwald ans Meer und vom Meer in die Wüste, wo der Wald und die Wüste noch
        vorläufig das Steinbrett haben, und beim Wiederholen über die Weltgrenze, wo der Blick auf dem Brett bleibt.
- [x] **Varianten entfernen:** Die nicht gewählten Varianten verschwinden aus dem Code. Der Schalter in der Adresse
      - Befund aus Ticket 06 (06.11.2026): Beim Überblenden vom Steinbrett zur Lehmterrasse steckt deren eingezogene
        Wand mit den Balken hinter den dunklen Seiten des Steinbretts und erscheint erst im letzten Bild. Der Nutzer
        will das hier für alle Formen lösen, nicht einzeln je Brett. Das gilt auch für Moospolster (Erdscholle,
        Wurzeln), Hochbeet und Basaltsäulen (hängende Säulen), sobald sie da sind.
      bleibt bis Ticket 10, weil die übrigen Himmel ihn noch brauchen.
- [ ] **Leistung:**
      - Die Bildzeit steigt gegenüber dem Steinbrett nicht messbar (Desktop und Handy-Ansicht).
      - Der Grafikspeicher bleibt etwa wie heute.
      - Gerechnet wird beim Laden, und beim Wechsel ruckelt nichts (Bildzeiten der Geschichte-Probe).
- [ ] **Abnahme:** Eine Vorschauseite zeigt die Bilder wie in Ticket 04, dazu die Lichtwelle und den Übergang als Bildfolge oder kurzes
      Video. Der Nutzer nimmt ab, erst dann wird committet.
- [x] **Tests:** Logiktest für die Werte des Strands. Die Geschichte-Probe und die Offline-Probe zeigen das Brett des
      Strands am Meer.
- [ ] Alle Tests sind grün, und das Review nach dem Ticket ist gelaufen.

## Hinweise

- In der Geschichte schaut die Kamera auf Reise und Einstieg in den Himmel, wenn der Himmel wechselt. Beim Wiederholen
  über eine Weltgrenze bleibt sie auf dem Brett. Dort sieht man den Übergang voll.

## Comments

**Umsetzung Übergang zwischen Formen (07.11.2026, Worktree `prisma-brett-05`, Branch `feature/brett-05-uebergang` von
`feature/brett-je-himmel` 9c514ed, Ticket 07 per Merge geholt; Review offen)**

- **Gewählt: Wachsen von der Mitte aus.** Das neue Brett wächst über die ganze Dauer des Himmels von der Mitte nach
  aussen über das bisherige, mit fransiger, warm leuchtender Front, wie die Lichtwelle beim Lösen. Ein Auflösen mit
  Durchsichtigkeit wurde verworfen: Durchsichtig sieht man innere Teile erst, wenn das alte Brett weg ist, und im Schnitt
  der Kernquader bräuchte es einen deckenden Rest.
  - **Umsetzung:** `boardBlend` (`index.html`, vor dem Steinbrett), für alle Arten gleich und an einer Stelle.
    - Beide Bretter zeichnen undurchsichtig. Jedes verwirft die Pixel, die gerade dem anderen gehören (`discard`).
    - Wem ein Pixel gehört, entscheidet ein Wert n des Sehstrahls, nicht der Ort des Bretts: der Punkt, wo der Strahl in
      die Hülle aller Bretter tritt (Umriss, y 0 … −2 m). Innen ist n klein, zum Rand und nach unten gross, dazu kommt
      Rauschen. Beide Bretter rechnen für ein Pixel dasselbe n, überlappend um 0,002. Darum ist jedes Pixel im Schnitt der
      Kernquader in jedem Bild gedeckt.
    - Eingezogene oder hängende Teile kommen mit der Front zum Vorschein: Wo das bisherige verworfen wird, sieht man
      dahinter das neue. Das gilt für Lehmwand und Balken, für Erdscholle und Wurzeln, für den unteren Kasten des
      Hochbeets und später für hängende Säulen.
    - Teile über dem Brett (Polster, Türmchen, Kräuter) nehmen ihren eigenen Ort, sonst kämen sie mit dem Eintritt ihres
      Strahls weiter innen zu früh.
    - Netze mit eigenem `ShaderMaterial` (Tropfen, Körner, Glühwürmchen, Blumen) blenden wie bisher über den Anteil in
      `setFade(k)`.
  - **Arten:** `setFade(k)` hat kein `upper` mehr, und `look`, `fadeVariants` und die durchsichtigen Fassungen sind in
    stone, tidePool, clay, raisedBed und moss weg. Vorab übersetzt wird je Material die Fassung mit `BOARD_BLEND`
    (`needBlend`, `blendBereit`). In Ruhe zeichnet jedes Brett mit denselben Programmen wie vorher, der Code steht hinter
    `#ifdef`. Eine neue Art (Basaltsäulen) braucht nichts Eigenes, solange ihre Netze, die den Kernquader decken, gewöhnliche
    Materialien haben.
  - **`boardTheme`:** `to`, `anteil` und `unter` (die bisherigen Bretter von innen nach aussen, je mit `bis`) ersetzen
    `from`/`to`.
    - **Umgelenkt:** Jedes gezeigte Brett behält sein Stück, das nächste wächst darüber, in der Zeit, die der Himmel noch
      braucht (`p0`). Nichts springt weg; bis zu vier Stücke je Brett.
    - **Notfall:** Das Steinbrett wächst aus dem Nichts ins Bild (eigene Uhr), statt auf einmal dazustehen.
    - `brett()` meldet zusätzlich `stuecke`. `von` ist das äusserste bisherige Brett.
- **Zusammengeführt:** `createClayTextures` ist ein Aufruf von `boardTextures`. Dafür hat `boardTextures` die Option
  «wiederholt» bekommen.
- **Werte des Strands:** Sie waren seit Ticket 04 erledigt (Brett-Angabe, `BOARD_PARAMS.tidePool`, Logiktest mit
  abgeändertem Eintrag). Varianten gab es im Code keine mehr, nur noch `?brett=` (bleibt bis Ticket 10).
- **Lücke beim Einblenden des Strands** (Zusatz aus Ticket 07): Das Wasser legte sein Ziel für die Fische unter der
  Oberfläche (volle Grösse, HDR, MSAA) erst im ersten Bild an, in dem der Strand einblendet. Beim Aufwärmen
  (`skyWarmDraw`) war es nur 1 × 1 gross. Jetzt legt das Aufwärmen es in der Grösse des Spiels an (`prismaWarm`).
  - Wald → Meer mit Vorladen (wie nach «Gelöst», `trans.mjs`, je 5 Läufe): längstes Bild Basis 117 · 134 · 117 · 100 · 50
    ms, neu 50 · 34 · 50 · 67 · 50 ms.
  - **Nicht gelöst auf dem Weg ohne Vorladen** (`--wagen`, «Wiederholen über die Grenze ins Meer»): Basis 136 und 90 ms,
    neu 124, 131 und 141 ms. Vermutlich fällt das Anlegen des Ziels dort ins Aufwärmen während der Reise, und die Probe
    misst auch diese Bilder.
- **Proben:**
  - `brett-probe` hat den neuen Teil `formen`: jede geordnete Paarung aller Arten des Registers (mit Moospolster 20) und
    zwei umgelenkte Übergänge. Je Bild zeichnet die Probe nur die Bretter in ein kleines Bild. Geprüft wird, dass im
    Kernquader kein Pixel ohne Brett bleibt und dass kein Teil auf einmal erscheint oder verschwindet: höchstens 3 % ins
    erste und ins letzte Bild, sonst nicht mehr, als der Fortschritt des Bilds erklärt.
  - Das ist bewusst eine Prüfung an Bildern, aber ohne Referenzbilder (Abweichung von «keine Pixeltests», vom Leiter
    verlangt).
  - In `mechanik` wächst das Notfall-Steinbrett ins Bild.
- `APP_VERSION` `2026-11-07 brett-uebergang`, Register nach dem Merge `0f024f9f`.

**Messwerte** (headless mit GPU, Rechner mit Ticket 09 geteilt):

- `formen`: 0 Lücken im Kernquader in allen 22 Übergängen (76–130 Bilder je Übergang). Ins letzte Bild ändern sich
  0,0–0,3 % der Pixel mit Brett, ins erste 0,0–0,1 %. Der grösste Schritt (die Front) liegt bei 3,6–13,5 %.
- Leistung in Ruhe: Die Programme sind dieselben wie vorher, die Bildzeit ändert sich also nicht. Das ist nicht eigens
  gemessen.
- Während des Übergangs zeichnen beide Bretter undurchsichtig (vorher eines davon durchsichtig), dazu kommen je Pixel
  zweimal Wertrauschen.
- Grafikspeicher: Es gibt keine neue Textur und kein neues Ziel. Das Ziel der Fische liegt nur früher an.

**Vorschau:** `…\scratchpad\vorschau-05\index.html` (Filme in Echtzeit mit Regler: Stein → Lehm, Gezeitenbecken → Lehm,
Hochbeet → Stein, Stein → Moos, Hochbeet → Moos, zwei umgelenkte; Handy Stein → Lehm; je vorher und nachher; Messwerte).

**Tests:** siehe Abschlussbericht; Ergebnisse unten.

**Tests (07./08.11.2026, je über `leise.sh`, GPU, stumm, nacheinander; Rechner mit Ticket 09 geteilt):**

- `node tests/logic.test.mjs`: 2043 bestanden (nach dem Merge von 07).
- `tests/offline.mjs`: bestanden.
- `tests/brett-probe.mjs`: Netz, Menü, Reise und Formen grün.
  - In der Mechanik scheiterte zuerst die Dauer «vom Notfall ins richtige Brett»: Die Probe zählte nach `von`, und das wird
    leer, sobald das richtige Brett das Stück des Steinbretts bedeckt hat. Jetzt zählt sie nach der Art. Danach war die
    Mechanik grün.
- Geschichte-Probe:
  - `--grad leicht --welten 3`: bestanden.
  - `--dorf`: in drei Läufen je eine Lücke über 100 ms, an wechselnden Stellen. Beim Überspringen des Prologs waren es
    390 ms, 45 ms (grün) und 331 ms. Bei «Übung 8 wiederholen» waren es 319, 316 und 53 ms. Die Basis 62c99e6 war im
    einzigen Lauf grün.
  - Eine Messung mit Zählung der Programme (Kopie der Seite) zeigte: Während keines Übergangs wird ein Programm
    übersetzt.
  - Die Lücken streuen auf dem geteilten Rechner, schon in Ticket 08 hatte die Basis dort 415 ms.
  - `--wagen`: rot mit 124 ms («Wiederholen über die Grenze ins Meer»). Im Wechsel mit der Basis 62c99e6 waren es neu
    131 und 141 ms, Basis 136 und 90 ms (siehe oben, nicht gelöst).
  - `--uebersicht`: «Weiter über die Weltgrenze» mit 88 ms grün. Rot waren Öffnen und Schliessen der Übersicht (107, 268
    und 200 ms), wie schon in Ticket 08 auf der Basis.

**Offen:** Abnahme des Nutzers an der Vorschau; Review; die Lücke auf dem Weg ohne Vorladen ans Meer (`--wagen`).

**Review (08.11.2026, Worktree `prisma-brett-05`, Stand 0ad2a5b; Basis 62c99e6 im eigenen Worktree zum Vergleich)**

- **Befund Übergang (`boardBlend`):** In Ordnung.
  - Der Einbau in die Materialien stimmt: Der Schlüssel im Programm-Cache bleibt der eigene, `BOARD_BLEND` trennt die Fassungen über `defines`, und die Uniforms hängen auch an der Fassung ohne Überblenden. Der Grund: three 0.147 nimmt beim Zurückwechseln die Uniforms des zuletzt gebauten Programms. In Ruhe ist der Code abgeschaltet (`#ifdef`).
  - Verträgt sich mit `mark` des Pinsels: Der fasst die Hülle danach, und sein Schlüssel liest den eingefrorenen.
  - Weil kein Brett Schatten wirft, stört der Schattenpass nicht.
  - `dispose` ist unverändert; three gibt beim Freigeben des Materials beide Fassungen ab.
  - Umlenken, Rückkehr zum selben Brett (Stücke werden zusammengelegt, kein Leuchten ohne Wechsel) und das Notfall-Steinbrett aus dem Nichts: Code und `formen` stimmen überein.
- **Selbst behoben** (1e6eec6, klein): Sprang der Himmel mitten in einem Übergang mit dem Himmel (`set` ohne Überblenden), wuchs das Brett mit eigener Uhr weiter, statt mitzuspringen. Das widersprach dem eigenen Kommentar in `follow` und der Beschreibung von `boardTheme`. Jetzt nimmt es die eigene Uhr nur aus dem Notfall oder dann, wenn es schon mit eigener Uhr wächst. Danach ist `brett-probe` ganz grün.
- **Programme beim Wechsel:**
  - Die Fassungen mit `BOARD_BLEND` werden wie zuvor die durchsichtigen vorab übersetzt, in gleicher Zahl je Brett.
  - Zeitprotokoll der Übersetzungen in je zwei `--dorf`-Läufen (HEAD und Basis, Kopien mit Protokoll): gleiche Abfolge an gleicher Stelle. Die neuen Fassungen sind etwas grösser und werden später fertig: 480–710 ms nach dem Anstossen, die Basis 170–870 ms.
  - In `formen` steigt die Zahl der Programme nur beim ersten Auftritt einer Art. Das kommt von der Probe selbst: Sie zeichnet ohne Lichter, also mit anderen Programmen. Kein Hinweis auf Übersetzen im Spiel.
- **Lücken: Streuung, nicht das Ticket.** Je drei abwechselnde Läufe, längstes Bild:
  - `--wagen`, «Wiederholen über die Grenze ins Meer»: HEAD 98, 116, 130 ms; Basis 90, 129, 126 ms. In beiden liegt das lange Bild im ersten Bild des Strand-Panoramas (Anteil ≈ 0,53), siehe Ticket 07.
  - `--dorf`, «Übung 8 wiederholen»: HEAD 368, 402, 53, 405, 428 ms; Basis 350, 392, 406, 354 ms. Das lange Bild liegt beim Einstieg ins Dorf, bevor ein Brett überblendet oder übersetzt wird.
  - `--dorf`, «Prolog überspringen»: HEAD 120, 74, 163, 53, 38 ms; Basis 19, 26, 55, 38, 189 ms. In beiden fallen die Lücken in die Zeit, in der die vorab übersetzten Fassungen von Stein und Moos noch ausstehen.
  - `--uebersicht`: Öffnen rot, HEAD 143 und 160 ms, Basis 162 und 287 ms.
- **Wackelig:** `brett-probe formen` meldete im ersten Lauf bei Hochbeet → Stein (flach, heraus) 1 Pixel ohne Brett im Kernquader, von über 9000. Im zweiten Lauf und im dritten (nach der Korrektur) waren es 0 in allen 22 Übergängen. Vermutlich ein Riss in der Rasterung an einer Naht. Wiederholt es sich, die Stelle aufzeichnen.
- **Basaltsäulen (Ticket 09):** Die Lösung passt. Es braucht nur `look` und `fadeVariants` weg und `setFade(k)`.
  - Die Köpfe liegen bei −0,003 m, also in der Hülle (bis 0,005 m), und die Säulen enden über −2 m.
  - Was den Kernquader deckt, muss in Ruhe unter y = 0,005 liegen. Teile darüber nehmen ihren eigenen Ort, und dann deckte es im Kernquader nicht mehr sicher.
  - Gehobene Säulen (Lichtwelle) überschneiden sich nur selten mit einem Übergang.
- **Tests (über `leise.sh`, GPU, seriell):**
  - Node: Logik 2043, KI-Tester 84, Beurteilung 206, Geschichte 35, Levelliste 54, Würfelliste 20, Vorrat 18, Hall 6, Generator 31, alle grün.
  - `offline.mjs` grün.
  - `brett-probe` grün bis auf das eine Pixel; nach der Korrektur ganz grün.
  - Geschichte-Probe `--grad leicht --welten 3` grün auf Desktop und mit `--handy`.
  - `--dorf`, `--wagen` und `--uebersicht` mit den Lücken oben.
- **Auflagen:** keine. Hinweis für Ticket 10: Die Lücken beim Überspringen des Prologs und bei «Übung 8 wiederholen» bestehen schon auf der Basis. Die erste hängt am Fertigwerden der vorab übersetzten Fassungen, die zweite am Einstieg ins Dorf.
