# 03: Lage des Schalters

**Spec:** ../spec.md

**Status:** ready-for-agent (Katalog zuerst; die Umsetzung erst nach der Wahl des Nutzers)

**Blocked by:** 01 (nur die Umsetzung; den Katalog nicht)

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
- [ ] Bildvergleich: neue Referenzen nur für die Menübilder (`menue`, je Grösse und Sprache, SwiftShader und
      Grafikkarte). Vorher prüfen, dass sich die übrigen Bilder nicht ändern. Der Bildvergleich mit Wechsel aus Ticket
      01 bleibt grün.
- [ ] `appVersion` in `package.json` hochzählen (`2026-11-18 sprachwahl-…`).
- [ ] README und Kopfkommentar von `menue.js` (Lage des Schalters) nachgeführt.

## Wahl des Nutzers

(offen)

## Hinweise

- Der Schalter: `src/seite/oberflaeche/menue.js` (`.menue-sprache`), Stil in `src/stil/menue.css` (`.menue-sprache`,
  eigene Regeln für Handy hochkant um Zeile 208 und quer um Zeile 247).
- Reihenfolge der Tickets: 01, dann 03, dann 02. Die Liste aus Ticket 02 baut auf der gewählten Lage auf.
- Prüfläufe nach `CLAUDE.md` (Abschnitt Prüfläufe). Bilder nur über `tools/leise.sh`, Chrome stumm.
