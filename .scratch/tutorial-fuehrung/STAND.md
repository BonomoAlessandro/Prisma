# Stand «Führung im Dorf» – Übergabe

Stand 10.11.2026, Branch `feature/tutorial-fuehrung` (gepusht, b6421e6; Tickets 01–05 gemergt, 05 = Rückmeldungen
aus dem ersten Handy-Test). PLAN 1a.1. Entscheide und Begründungen stehen in `spec.md` und in den Tickets unter
`issues/`, je unter «Comments». `APP_VERSION` ist `2026-11-10 tutorial-fuehrung-3` (index.html und sw.js).

## Fertig

| Ticket | Was | Commit |
|---|---|---|
| 01 | Vorbilder und Katalog, der Nutzer wählte C «Vorzeigen» | siehe Ticket |
| 02 | Gerüst der Schritte (`schritte`, `nebenbei`, `fuehrung`, später Fingerzeig) und Weigerung fester Elemente mit Sockel im ganzen Spiel | Merge im Branch, siehe Ticket |
| 03 | Alle 9 Übungen geführt, Startstellungen von «Umweg» und «Mischung» geändert, Dorf-Probe spielt jeden Schritt | Merge bc52fe0 |
| 04 | Drei Punkte aus dem Review von 03, Probe für Unterbrechungen mitten in der Führung, Wackeln in einer Welt, `APP_VERSION`, Doku | cab0c58, 43b5bea, fe4dfb3 und die Doku danach |
| 05 | Erster Handy-Test des Nutzers: Umriss als Ring in der Szene (hinter Elementen verdeckt), alle Sätze nennen Ziel und Weg (Tabelle in Ticket 05), «Weiter» an fester Stelle beim Satz | Merges 60af470, 2c8877b, Review b6421e6 |

Die Sätze gelten in der Fassung aus Ticket 05; die Angaben zu Ticket 04 unten sind dort teils überholt.

Die Führung: je Übung höchstens drei Schritte mit einem Satz in der Kopfzeile (Platzhalter je Gerät), gestrichelter
Umriss und Hand am Element, «Weiter» an Erklärungen, Hinweise nebenbei zu Kamera («Sperre») und Neustart
(«Brechung»), später Fingerzeig nach `FUEHRUNG.fingerzeig` = 15 s (vorläufig). Nichts wird gesperrt, gelöst wird nie
von selbst. Nur im Dorf; Neustart und Neuladen beginnen beim ersten Schritt, Menü und Übersicht behalten ihn.

Ticket 04 änderte an den Übungen:

- **Mischung, Schritt 1:** Strahl-Schritt am Prisma, weiter erst, wenn im Kombinator Magenta ankommt (neues Feld
  `farbe` an Strahl-Schritten). Vorher schaltete jede Drehung weiter, auch ein langes Drücken, nach dem nur Blau ankam.
- **Umweg:** Der hintere Spiegel (5,1) startet wie der vordere eine Stufe zu weit (rot 2). Schritt 3 umrandet beide
  runden Spiegel: «{Drücke lang} auf die runden Spiegel, so drehen sie zurück.» Vorher blieb nach ihm eine Drehung an
  (5,1) ohne Umriss und Satz, und der Satz sprach vom «markierten Spiegel».
- **Farbenlehre, Schritt 2** umrandet Prisma und Spiegel: «{Tippe} Prisma und Spiegel: Das Prisma fächert nur auf, was
  ankommt.» Vorher blieb der Spiegel (4,2) ungenannt.

Prüfung (Zahlen in Ticket 04 unter «Comments»): alle Node-Tests und Golden grün; Dorf-Probe Desktop, Handy, 360 × 640
und quer spielen jeden der 23 Schritte (29 gespielte: Übung 2 und 3 auch in Leicht); rot nur bekannte Bildlücken. Wackel-Probe am Desktop und auf dem Handy grün,
auch in einer Welt (Bergwald «Lichtblick», fester Spiegel neben einem Prisma).

## Was der Nutzer testet

Die Liste mit den Beobachtungsfragen steht in Ticket 04 unter «Comments»: auf dem Poco und mit mindestens einer Person,
die Prisma noch nie gesehen hat, auf dem Handy. Kurz: das Wort «Farbpfeile», ob in «Umweg» zuerst der feste Spiegel
angetippt wird, ob das Wackeln auf dem Gerät gut aussieht, ob der Blick die Kopfzeile findet (sonst Textort D aus dem
Katalog), die 15 s des späten Fingerzeigs, dazu «Ziele» in der Kopfzeile gegen «Kristall» in den Sätzen.

## Als Nächstes

1. **Poco-Test des Nutzers** und **Test mit einer fremden Person**; was auffällt, kommt in Ticket 04 unter «Comments».
2. Danach die **15 s festlegen** (`FUEHRUNG.fingerzeig` in `index.html`, eine Stelle), Befunde beheben, PLAN 1a.1
   abhaken, Haken in Ticket 04 setzen.
3. **Merge nach `main` nur auf das Go des Nutzers** (vorher `main` holen; `APP_VERSION` bei Konflikten neu setzen,
   index.html und sw.js gleich).

## Arbeitsweise (vom Nutzer so gewünscht)

- Je Ticket ein Umsetzer, danach ein unabhängiges Review; Kleines behebt der Reviewer selbst.
- **Schwere Läufe** (Chrome, Proben) nur über `LEISE_MAX_CPU=100 LEISE_CPU=100 LEISE_VORRANG=4 sh tools/leise.sh
  timeout -k 30 900 …`, einzeln. Node-Tests dürfen in einer Sperre parallel laufen.
- Neues Rot zuerst gegen `e426554` (Stand vor dem Vorhaben) vergleichen, bevor es dem Vorhaben angelastet wird.
- Commits als AlessandroBonomo, ohne Zeilen, die ein KI-Werkzeug nennen. Gepusht wird nur, wenn der Nutzer es sagt.
- Aufräumen: `tests/output/`, Bilder, Chrome-Profile und temporäre Worktrees löschen, sobald sie nicht mehr gebraucht
  werden.

## Bekannt rot, schon vor dem Vorhaben

- Bildlücke «Sehr schwer: Übersicht → Übung 8 wiederholen» beim Himmelswechsel (Dorf-Probe).
- Vereinzelte Lücken über 100 ms in Prolog, Einstieg und Wald.
- `--uebersicht --menue`: Öffnen und Schliessen der Übersicht zeitweise über 100 ms (Present von Chrome headless, siehe
  `.scratch/brett-je-himmel/STAND.md`). Auf dem Branch je Lauf 2–3, auf `e426554` 0–1 (Zahlen in Ticket 04); die
  Führung ist dort aus. Beim Poco-Test auf Ruckler beim Öffnen und Schliessen der Übersicht achten.
- `--dorf --handy`: Lücke um 425 ms im Einstieg ins Dorf gleich nach dem Bild «dorf-einstieg» der Probe; auf
  `e426554` dieselbe (445 ms), dort noch im Zeitfenster des Bilds und darum nicht gezählt.
- Bei 640 × 360 zehn Layout-Funde («Überspringen» über dem Titel, Leiste im Einstieg ins Dorf), auf `e426554` identisch.
- `tests/offline.mjs` läuft in die Notbremse (SwiftShader) und wird ausgelassen.

## Offene Punkte

- Die Kopfzeile zählt «Ziele», die Sätze sagen «Kristall» (beim Test beobachten).
- `cube-click-probe` wurde nicht gefahren (braucht `vorrat.mjs zurueckholen`).
- Tipps in den sechs Welten gehören nicht in dieses Vorhaben (eigener Plan-Punkt, falls sie fehlen).
