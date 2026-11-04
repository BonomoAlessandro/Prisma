# 05: Erwachen, Flug am nächsten Stern vorbei, Einstiege, Töne

**Spec:** ../spec.md

**Blocked by:** 04

**Status:** ready-for-agent

**What to build:** Am Ende jeder Welt (1–5) steigen die Strahlen zum Stern dieser Welt, er erwacht, und der Träger
fliegt am nächsten schlafenden Stern vorbei in die nächste Welt; jeder Einstieg führt am Stern seiner Welt vorbei
(Entscheide 7, 16, 18, 19; Ablauf 3 und 5 der Spec).

- [ ] **Aufstieg:** Der Lichtpunkt steht am Ort des Sterns dieser Welt; die Kamera schaut dorthin (beim Vulkan über
      die Kraterwand) statt in eine feste Höhe geradeaus.
- [ ] **Erwachen**, sobald die Strahlen ankommen: Der Stern blitzt auf und bleibt hell, die Linie vom vorigen Stern
      zieht sich (mit Stern 4 auch die Linie 4 → 1, die Schale schliesst sich). Ab da zeigt der Wagen den neuen
      Stand.
- [ ] **Ton:** je Stern ein leiser Glockenton im Hall wie die übrigen Töne, Stern 1 der tiefste, steigend bis
      Stern 6; ohne neue Klangdateien. Die Töne der Strahlen beim Aufstieg bleiben.
- [ ] **Flug:** Der Träger nimmt das Licht beim geweckten Stern und fliegt zum nächsten, noch schlafenden; als das
      Licht vorbeizieht, zuckt dieser kurz auf und wird wieder blass. Dann sinkt das Licht aufs Feld der neuen Welt.
      Ersetzt den heutigen seitlichen Bogen. Laden, Schweben während des Ladens (höchstens 8 s), Überblenden und
      Landung bleiben geregelt wie heute; der Wagen bleibt beim Überblenden stehen.
- [ ] **Einstieg in eine Welt** (nach dem Prolog, nach dem Dorf, beim Fortsetzen): Der Träger bringt das Licht am
      schlafenden Stern dieser Welt vorbei, der kurz aufzuckt. «Überspringen» lässt das Licht weiterhin ohne Schnitt
      landen. Der Einstieg ins Dorf bleibt ohne Träger und ohne Stern.
- [ ] **Dauer:** jede Reise höchstens etwa 1 s länger als im Vorher-Lauf (Ticket 01); Einstiege nicht länger als
      heute. Tippen beschleunigt wie heute.
- [ ] **Wiederholen:** kein Aufstieg, kein Erwachen; über eine Weltgrenze blendet nur der Hintergrund, der Wagen
      bleibt im Stand des Durchgangs.
- [ ] Die Sprünge «Ende einer Welt» und «Einstieg in den Bergwald» im Sprungbrett zeigen die neuen Szenen im
      richtigen Stand.
- [ ] Probe: Stand nach jedem Erwachen, Dauer jeder Reise gegen den Vorher-Lauf, Bildzeiten (Lücken über 100 ms sind
      Fehler), Bilder von Aufstieg, Erwachen und Vorbeiflug je Welt in Desktop, Handy hoch und quer.
- [ ] Alle Tests grün; Review nach dem Ticket.

## Anhaltspunkte im Code

- `story.ascend` (Strahlen `beams`, Lichtpunkt `flare`, `aimGaze`), `story.travel` (Bogen, `carrier`, Laden
  `settled`, `skyTheme.quiet`, `blendSky`, `fall`), `story.enter` (Einstieg, `traeger`), `story.replayWorld`.
- Träger: `STORY_CARRIERS`, `story.makeCarrier`.
- Ton: `audio.hit(color, when, { octave, gain })` und der Hall des Audio-Moduls.

## Comments

**04.11.2026, Hinweis aus der Wahl des Nutzers (Ticket 02, Leiste C):** Der Untertitel bei der Ankunft in einer Welt
steht künftig senkrecht in der Mitte des Bildschirms (Einbau in Ticket 08). Der Lichtpunkt soll dabei darüber stehen,
mit demselben Abstand zum Text wie der Wagen der Leiste darunter. Den Flug und den Blick der Kamera so anlegen, dass das
möglich ist.
