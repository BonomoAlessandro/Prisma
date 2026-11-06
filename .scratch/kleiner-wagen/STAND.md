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
| 01 Gestalt, Stand, Sprungbrett, Vorher-Lauf | erledigt, mit Review (ea15d24) |
| 02 Skizzenkatalog | erledigt (resolved); Wahl des Nutzers: Menü F, Übersicht C, Leiste C mit Anpassungen (in Ticket 08) |
| 03 Texte | erledigt, mit Review |
| 04 Wagen am Himmel | erledigt, mit Review |
| 05 Erwachen und Flug | erledigt, mit Review |
| 06 Finale | erledigt, mit Review |
| 07 Bühne, Überblendung Wagen in Wagen | erledigt, mit Review |
| 08 Einbau Katalog | erledigt, mit Review |
| 09 Doku und KI-Tester | im Review (06.11.) |
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
3. Entschieden (Nutzer, 04.11. abends): 03 bis 09 ohne Halt durchziehen; Abnahme erst danach. (Frage war: nach 04 und 05
   anhalten oder bis 09 durchlaufen?)
4. Abnahme durch den Nutzer mit `?szenen` am Computer und auf dem Poco (Deploy des Feature-Branchs macht er selbst;
   pushen nur auf sein Wort), dabei Grösse und Helligkeit des Wagens festlegen. Dann Ticket 10, dann Merge nach main
   auf sein Wort.

## Arbeitsregeln (vom Nutzer, gelten weiter)

- **Ablauf je Ticket:** Umsetzer-Agent → unabhängiger Reviewer-Agent mit frischem Kontext (prüft gegen Ticket und Spec,
  lässt die Tests selbst laufen, behebt Kleinigkeiten selbst, Grundsätzliches geht zurück) → der Koordinator committet
  die Dateien des Tickets und nennt den Hash. Umsetzer und Reviewer committen nicht.
- **Nie zwei Agenten zugleich in derselben Arbeitskopie von `index.html`.** Seit 05.11. (Nutzer: «überall wo du dinge
  parallel machen kannst, tue es») darf der Umsetzer des nächsten Tickets in einem eigenen Worktree beginnen, während
  der Reviewer das vorige prüft; der Koordinator führt die Korrekturen des Reviews nach. Schwere Läufe bleiben über die
  Sperre von `leise.sh` nacheinander.
- **Vorrang an der Sperre** (Nutzer, 05.11.): Das früher begonnene Ticket hat Vorrang. Jeder Lauf setzt
  `LEISE_VORRANG=<Ticketnummer>` (Umsetzer wie Reviewer); warten mehrere, geht die kleinere Zahl vor. Laufende Läufe
  werden dafür nie abgebrochen.
- **Schwere Läufe** (Chrome, Proben, Tests) nur über `LEISE_CPU=50 sh tools/leise.sh <befehl …>` (CPU-Deckel und Sperre,
  Läufe nacheinander). Der Nutzer arbeitet nebenher am selben Rechner.
- **Tests aufteilen** (Nutzer, 04.11. abends, nur solange die Qualität nicht leidet): Der Umsetzer lässt nur die Läufe
  laufen, die sein Ticket betreffen, der Reviewer den ganzen Satz. Innerhalb einer Sperre von `leise.sh` dürfen reine
  Node-Tests ohne Browser parallel laufen. Browserläufe bleiben nacheinander, Läufe mit Bildzeiten und der Vergleich
  mit `vorher/` immer allein.
- **Chrome immer stumm** (`--mute-audio`; `tools/chrome.mjs` und `tests/offline.mjs` machen das seit diesem Branch). Der
  Nutzer hörte sonst die Töne des Spiels.
- **Commits ohne jede Erwähnung von Claude** (keine Co-Authored-By- oder «Generated with»-Zeile).
- **Pushen und nach main mergen nur auf Wort des Nutzers.**
- **Neue Dateien, die das Spiel lädt,** müssen in die Liste des Builds auf Render (Build Command im Render-Dashboard
  kopiert eine feste Liste); geplant ist keine.
- **Agenten im Blick behalten** (Nutzer, 06.11.: «Stelle sicher, dass solche Hänger bemerkt werden»): Agenten geben
  oft mit «warte auf Hintergrundarbeit» zurück und wachen nicht wieder auf (Ticket 01: über 1 h, Ticket 06: Läufe
  wartend, Ticket 08: 01:18–07:30). Darum läuft im Koordinator immer eine Wache im Hintergrund (Skript wache.sh im
  Scratchpad der Sitzung): Sie meldet, wenn das Transkript eines aktiven Agenten (Liste wache.liste, «name agentid»)
  über 10 min still ist und an der Sperre nichts läuft oder wartet, wenn eine Sperre über 90 min gehalten wird oder
  wenn das Wachhalten stockt. Nach jeder Meldung nachsehen, den Agenten anstossen und die Wache neu starten; jeden
  neuen Agenten in die Liste eintragen, fertige austragen. In neuen Sitzungen die Wache neu anlegen.
- **Gestaltung:** Bei offenen Fragen breit streuen und Vorbilder zeigen (Skizzenkatalog), bevor viel gebaut wird.
- Texte und Kommentare auf Deutsch, Schweizer Schreibung («ss» statt «ß»).

## Nicht Teil dieses Branchs

- `bilder/` im Hauptordner (Skyboxen.png, Wueste.png) gehört dem Nutzer und ist absichtlich nicht committet.
