# Stand «Der Kleine Wagen» – Übergabe

Stand: 04.11.2026, kurz vor 17:15. Branch `feature/kleiner-wagen` (von main 6f322ce), gepusht nach origin. Der
Nutzer macht am Abend auf einem anderen Rechner weiter. Diese Datei ersetzt die Erinnerungen des Koordinators, die
auf dem anderen Rechner fehlen: zuerst hier lesen, dann Spec und Tickets.

## Wo was liegt

- Spec: `spec.md` (26 Entscheide aus dem Grilling vom 04.11.2026, Texte, Abläufe, Teststellen).
- Tickets: `issues/01` bis `issues/10`, je mit Checkliste, Anhaltspunkten im Code und Comments.
- Skizzenkatalog: `katalog/katalog.html` (im Browser direkt öffnen), Bilder dazu mit `katalog/aufnahme.mjs`.
  Veröffentlicht als private Artifact-Seite: https://claude.ai/artifact/FPj7CsvjGuVnwEEYoCm1pf (Version 5).
  Veröffentlicht wird eine Kopie ohne `<!doctype>`/`<html>`/`<head>`/`<body>`:
  `sed -e '1,5d' -e '/^<\/head>$/d' -e '/^<body>$/d' -e '/^<\/body>$/d' -e '/^<\/html>$/d' katalog/katalog.html > <kopie>.html`,
  dann mit dem Artifact-Werkzeug und `url` der Seite (aus einer anderen Unterhaltung erst `read`, dann veröffentlichen).
- Vorher-Lauf (Ticket 01, Massstab für die Dauer von Reisen und Finale): `vorher/`.

## Stand der Tickets

| Ticket | Stand |
|---|---|
| 01 Gestalt, Stand, Sprungbrett, Vorher-Lauf | **Zwischenstand, ungeprüft** (siehe unten und Comments im Ticket) |
| 02 Skizzenkatalog | erledigt (resolved); Wahl des Nutzers: Menü F, Übersicht C, Leiste C mit Anpassungen (in Ticket 08) |
| 03 Texte | offen, wartet auf 01 |
| 04 Wagen am Himmel | offen |
| 05 Erwachen und Flug | offen (Hinweis aus der Wahl der Leiste in den Comments) |
| 06 Finale | offen |
| 07 Bühne, Überblendung Wagen in Wagen | offen |
| 08 Einbau Katalog | offen, Wahl steht in den Comments |
| 09 Doku und KI-Tester | offen |
| 10 Sprungbrett ausbauen | offen, erst nach der Abnahme durch den Nutzer |

### Ticket 01, Zwischenstand

Der Umsetzer musste um 17:10 mitten in der Arbeit anhalten; der Stand ist so committet, wie er war, **ohne Review und
ohne abschliessenden Testlauf** (Commit «Zwischenstand Ticket 01»). Laut seinen Häkchen im Ticket gebaut:

- Vorher-Lauf in `vorher/` (Desktop und Handy, je ganzer Durchgang «leicht» und Finale), die Probe misst dafür die
  Dauer von Einstiegen, Reisen und Finale (`tests/geschichte-probe.mjs`).
- Wagen-Modul `const wagen` in `index.html` (Form, Reihenfolge, Linien, `wagen.stand(stand, welten)`), lesbar über
  `story.wagenStand(grad)`; das Ladezeichen nimmt Form und Linien aus `wagen`.
- Sprungbrett: alle Stellen tragen das Kennwort «SZENEN (vorübergehend, Ticket 10 entfernt …)»; `SZENEN_SPEICHER`
  ersetzt mit `?szenen` das Speichern (Stand und Bestwerte), der Block «SZENEN» am Ende baut Knopf und Liste.
- Ablauf für den Wagen in der Probe.

Offen: Die Notiz des Umsetzers unter `## Comments` fehlt (er kam nicht mehr dazu). Darum zuerst prüfen, ob alles
wirklich steht: Spiel laden (auch mit `?szenen`), Probe mit dem Wagen-Ablauf und die übrigen Tests über `leise.sh`
laufen lassen, Vergleich des Ladezeichens vorher/nachher. Dann das Review von Ticket 01, dann Commit.

## Nächste Schritte

1. Ticket 01 fertig bauen (Rest laut Comments im Ticket), dann Review durch einen unabhängigen Agenten, dann Commit.
2. Danach 03 → 04 → 05 → 06 → 07 → 08 → 09, jedes mit Review und Commit, nacheinander (alle ändern `index.html`).
3. Offene Frage an den Nutzer (gestellt am 04.11., noch ohne Antwort): Nach Ticket 04 (Wagen am Himmel) und 05
   (Erwachen auf der Reise) anhalten, bis er mit `?szenen` geschaut hat, oder bis 09 durchlaufen?
4. Abnahme durch den Nutzer mit `?szenen` am Computer und auf dem Poco (Deploy des Feature-Branchs macht er selbst;
   pushen nur auf sein Wort), dabei Grösse und Helligkeit des Wagens festlegen. Dann Ticket 10, dann Merge nach main
   auf sein Wort.

## Arbeitsregeln (vom Nutzer, gelten weiter)

- **Ablauf je Ticket:** Umsetzer-Agent → unabhängiger Reviewer-Agent mit frischem Kontext (prüft gegen Ticket und Spec,
  lässt die Tests selbst laufen, behebt Kleinigkeiten selbst, Grundsätzliches geht zurück) → der Koordinator committet
  die Dateien des Tickets und nennt den Hash. Umsetzer und Reviewer committen nicht.
- **Nie zwei Agenten zugleich in `index.html`.** Parallel nur, was andere Dateien betrifft (wie der Katalog).
- **Schwere Läufe** (Chrome, Proben, Tests) nur über `LEISE_CPU=50 sh tools/leise.sh <befehl …>` (CPU-Deckel und Sperre,
  Läufe nacheinander). Der Nutzer arbeitet nebenher am selben Rechner.
- **Chrome immer stumm** (`--mute-audio`; `tools/chrome.mjs` und `tests/offline.mjs` machen das seit diesem Branch). Der
  Nutzer hörte sonst die Töne des Spiels.
- **Commits ohne jede Erwähnung von Claude** (keine Co-Authored-By- oder «Generated with»-Zeile).
- **Pushen und nach main mergen nur auf Wort des Nutzers.**
- **Neue Dateien, die das Spiel lädt,** müssen in die Liste des Builds auf Render (Build Command im Render-Dashboard
  kopiert eine feste Liste); geplant ist keine.
- **Agenten im Blick behalten:** Ein Umsetzer von Ticket 01 blieb über eine Stunde im Leerlauf, weil er auf Läufe
  wartete, die längst fertig waren. Nach jedem «warte auf …» nachsehen, ob wirklich noch etwas läuft.
- **Gestaltung:** Bei offenen Fragen breit streuen und Vorbilder zeigen (Skizzenkatalog), bevor viel gebaut wird.
- Texte und Kommentare auf Deutsch, Schweizer Schreibung («ss» statt «ß»).

## Nicht Teil dieses Branchs

- `bilder/` im Hauptordner (Skyboxen.png, Wueste.png) gehört dem Nutzer und ist absichtlich nicht committet.
