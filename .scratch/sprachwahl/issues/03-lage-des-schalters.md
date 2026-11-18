# 03: Lage des Schalters

**Spec:** ../spec.md

**Status:** done (18.11.2026: Der Nutzer wählt Variante 0, die heutige Lage. Teil 2 entfällt, nichts ändert sich.)

**What to build:** Auf dem Handy hochkant steht der Schalter der Sprache klein in der Ecke oben rechts, dicht neben
«PRISMA» und über dem Untertitel (`tests/bildvergleich/referenz/handy-menue.jpg`). Dort geht er schnell unter (Nutzer,
18.11.2026: «geht es im oberen rechten Eck auf dem Smartphone schnell unter wegen der anderen Texte, die so nah
sind»). Der Schalter soll eine Lage bekommen, in der man ihn findet, ohne dass er dem Menü die Ruhe nimmt. Desktop und
Handy quer prüfen und anpassen, wo es nötig ist.

## Teil 1: Skizzenkatalog (vor der Umsetzung)

- [ ] Fünf bis sieben Varianten der Lage, im echten Menü. Am einfachsten ohne Änderung am Code: das Menü laden und
      Stil und DOM über das DevTools-Protokoll umbauen. Je Variante Bilder für Handy hochkant (390 × 844), Poco
      (393 × 873, Pixeldichte 2,75), 360 × 640, Handy quer (844 × 390) und Desktop (1280 × 800), je mit geschlossenem
      Schalter und mit grob angedeuteter offener Liste (wohin sie aufgeht, siehe Ticket 02). Auf Deutsch, eine Grösse
      auch auf Englisch.
- [ ] Ideen zum Ausgangspunkt (breit streuen, gern weitere):
      - Ecke oben rechts mit mehr Abstand: Titel und Untertitel rücken etwas nach unten, oder der Schalter bekommt eine
        eigene Zeile über dem Titel.
      - Ecke oben links (auf dem Handy hochkant ist sie frei).
      - Unten neben «Von vorn» als zweite leise Aktion, in Reichweite des Daumens. Die Liste geht dann nach oben auf.
      - Ganz unten unter dem Knopf «Weiter», klein in einer Fusszeile.
      - Nur der Globus als runder Knopf in der Ecke, die Sprache steht erst in der Liste.
- [ ] Eine Seite `.scratch/sprachwahl/katalog/index.html`, die die Varianten nebeneinander zeigt (je Variante ein
      Satz, was sie will, und was dafür bzw. dagegen spricht). Bilder relativ eingebunden, im selben Ordner.
- [ ] Der Nutzer wählt. Seine Wahl hier unter «Wahl des Nutzers» festhalten.

## Teil 2: Umsetzung der gewählten Lage

- [ ] Der Schalter steht in der gewählten Lage, auf allen Grössen: Desktop, Handy hochkant, Handy quer, Poco und
      360 × 640, auch mit dem Massstab `SEITE` und den sicheren Rändern (`env(safe-area-inset-*)`).
- [ ] Kein Text des Menüs liegt näher als etwa 16 px am Schalter (Titel, Untertitel, Reiter, Karte, «Von vorn»,
      Knopf). Die Trefferfläche auf dem Handy ist mindestens etwa 44 × 44 px gross. Die Schrift ist nicht kleiner als
      die von «Von vorn».
- [ ] Die Liste aus Ticket 02 geht in die passende Richtung auf und bleibt ganz im Bild.
- [ ] Die Reihenfolge für die Tastatur (Tab) passt zur neuen Lage.
- [ ] **Gezielt prüfen, keine grossen Läufe** (Entscheid des Nutzers 18.11.2026; die Änderung betrifft nur das
      Menü): Aufnahmen des Menüs in den Grössen oben, Abstände und Trefferfläche im Browser gemessen, Node-Tests.
      Kein Bildvergleich. Die Referenzbilder des Menüs schreibt Ticket 02 einmal für Lage und Liste zusammen.
- [ ] `appVersion` in `package.json` hochzählen (`2026-11-18 sprachwahl-…`).
- [ ] README und Kopfkommentar von `menue.js` (Lage des Schalters) nachgeführt.

## Wahl des Nutzers

18.11.2026, nach Ansicht des Katalogs (`../katalog/index.html`): «option 0 ist noch immer die beste, also nichts soll
sich hier ändern». Der Schalter bleibt oben rechts, so wie er ist. Die Liste aus Ticket 02 geht von dort nach unten
auf. Dazu der Vorschlag des Nutzers: Auf dem Smartphone steht auf dem Schalter künftig nur das Kürzel («DE», «EN»)
statt «DEUTSCH» und «ENGLISH». Das braucht weniger Platz neben dem Titel. Auf anderen Geräten bleibt der volle Name.
Umgesetzt in Ticket 02.

Die Varianten im Katalog waren:

- **0 Heute:** zum Vergleich. Auf dem Handy liegt er 1 px am Untertitel, die Schrift ist 8,5 px.
- **1 Eigene Zeile oben rechts:** Auf dem Handy rücken Titel, Reiter und Karte 38 px nach unten. Das war die
  Empfehlung des Katalogs.
- **2 Links:** auf dem Handy oben links, sonst unten links.
- **3 Neben «Von vorn»:** unten, die Liste geht nach oben auf.
- **4 Fusszeile unter «Weiter».**
- **5 Nur der Globus** als runder Knopf.
- **6 Legende der Sternkarte:** fein gerahmt in der freien Ecke oben rechts der Karte.

## Hinweise

- Der Schalter: `src/seite/oberflaeche/menue.js` (`.menue-sprache`), Stil in `src/stil/menue.css` (`.menue-sprache`,
  eigene Regeln für Handy hochkant um Zeile 208 und quer um Zeile 247).
- Reihenfolge der Tickets: 01, dann 03, dann 02. Die Liste aus Ticket 02 baut auf der gewählten Lage auf.
- Prüfläufe nach `CLAUDE.md` (Abschnitt Prüfläufe). Bilder nur über `tools/leise.sh`, Chrome stumm.
