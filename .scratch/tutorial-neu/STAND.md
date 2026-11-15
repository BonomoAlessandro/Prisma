# Stand «Tutorial neu» – Übergabe

Stand 15.11.2026, Branch `feature/tutorial-neu` (von `main` ec02954, gepusht). PLAN 1a.3. Spec und Tickets aus
dem Grilling vom 14.11.2026; Entscheide und Begründungen in `spec.md` und in den Tickets unter `issues/`, je unter
«Comments». `APP_VERSION` ist `2026-11-14 tutorial-neu-3` (index.html und sw.js). **Tickets 01–03 sind umgesetzt,
das Vorhaben wartet auf den Test des Nutzers.**

## Fertig

| Ticket | Was | Commit |
|---|---|---|
| 01 | Band unten (Satz, Punkte, «Weiter»), Abdunkeln und Lichtkegel statt Umriss, Hand sofort, strikte Führung (Sperre), Rückmeldung je Schritt, «Erstes Licht» neu mit vier Schritten; später Fingerzeig entfernt | Merge 85530ed, Review b0eb320 |
| 01 | Nach dem Poco-Test des Nutzers: kein Funkeln mehr nach einem geschafften Schritt | 3c570a6 |
| 02 | Brechung, Farbenlehre und Mischung auf neuen Brettern, die übrigen fünf Übungen weg, kein Stand im Dorf | Merge abff645 |
| 03 | Prüfung, zwei ergänzte Proben, Doku, diese Übergabe | siehe Ticket 03 |

Die Führung heute: vier Übungen (Erstes Licht, Brechung, Farbenlehre, Mischung), je vier Schritte, Satz im Band unten,
Punkte für den Fortschritt, «Weiter» an Erklärungen. Die Szene ist abgedunkelt, ein Lichtkegel liegt auf dem Element
des Schritts, bei Handlungen zeigt die gezeichnete Hand (Wahl B aus 1a.1) die Geste sofort vor und nach 5 s Pause wieder. Nur das
markierte Element reagiert, bei Erklärungen ist das Brett gesperrt; Kamera, Knöpfe, Menü, Übersicht, Ton, Neustart
und «Dorf überspringen» bleiben frei. Ein geschaffter Schritt: Punkt füllt sich, leiser Ton, nach 0,6 s blendet der
nächste ein; kein Funkeln. Hinweise nebenbei zu Kamera und Neustart stehen in «Brechung» über dem Band. Neustart
beginnt beim ersten Schritt, Menü und Übersicht behalten Übung und Schritt, Neuladen und jeder neue Start des Dorfs
beginnen bei Übung 1; im Stand bleibt nur `dorf.ende`. Begriffe in `CONTEXT.md` (Im Dorf, Führung, Band, Lichtkegel,
Sperre, Schritt, Hinweis nebenbei, unter «Abgelöst» Später Fingerzeig, Umriss, die neun Übungen, Platz im Dorf,
Funkeln).

## Wie man prüft

- Node-Tests: `node tests/<name>.test.mjs` für alle `tests/*.test.mjs` (in einer Sperre parallel), dazu
  `node tests/golden.mjs`.
- Dorf-Probe, je Lauf einzeln: `GPU=1 LEISE_MAX_CPU=100 LEISE_CPU=100 LEISE_VORRANG=3 sh tools/leise.sh timeout -k 30
  900 node tests/geschichte-probe.mjs --dorf [--handy | --handy --groesse 360x640 | --quer]` (etwa 6 min). Spielt
  jeden Schritt aller vier Übungen, prüft Band, Kegel, Hand, Sperre und dass das Band nichts verdeckt; dazu Neuladen
  mitten in der Führung (zurück auf Übung 1), Neustart, Menü, Übersicht und «Überspringen» mitten in einer Übung.
- Randfälle: `--dorf-raender` (etwa 6 min). Seit Ticket 03 mit g): mitten in der Führung in einen anderen Grad und
  zurück (dort keine Führung, zurück Übung 1, Schritt 1) und «Dorf überspringen» im Wechsel zwischen zwei Schritten.
- Wackeln: `node tests/screenshot.mjs wackeln 1440 900 300 "$(cat tests/wackel-probe.js)"`, Handy mit `MOBILE=1 DPR=3`
  und `393 852`. Seit Ticket 03 prüft sie in der Welt auch, dass die Sperre dort nicht gilt (jedes drehbare dreht).
- Ergebnisse von Ticket 03 stehen im Ticket unter «Comments».

## Was der Nutzer testet

Die Beobachtungsfragen stehen in Ticket 03 unter «Comments»: auf dem Poco und mit mindestens einer Person, die Prisma
noch nie gesehen hat, auf dem Handy. Kurz: ob Band und Lichtkegel gefunden werden, ob die Sperre als Hilfe statt als
Fehler wirkt, die zwei Tippen mit Zwischenstand, die drei Zeilen Hinweise nebenbei in «Brechung», der Kegel in
Farbenlehre Schritt 4, und ob die Elemente danach im Bergwald richtig benutzt werden.

## Als Nächstes

1. **Poco-Test des Nutzers** und **Test mit einer fremden Person**; was auffällt, kommt in Ticket 03 unter «Comments».
2. Befunde beheben (je ein Ticket oder in 03), dann PLAN 1a.3 abhaken und die Haken in Ticket 03 setzen.
3. **Merge nach `main` nur auf das Go des Nutzers** (vorher `main` holen; `APP_VERSION` bei Konflikten neu setzen,
   index.html und sw.js gleich).

## Arbeitsweise (vom Nutzer so gewünscht, wie in 1a.1)

- Je Ticket ein Umsetzer, danach ein unabhängiges Review; Kleines behebt der Reviewer selbst.
- **Schwere Läufe** (Chrome, Proben) nur über `GPU=1 LEISE_MAX_CPU=100 LEISE_CPU=100 LEISE_VORRANG=<n> sh
  tools/leise.sh timeout -k 30 900 …`, einzeln, Ausgabe in eine Logdatei und darin `FEHLER` suchen. Node-Tests dürfen
  in einer Sperre parallel laufen.
- Neues Rot zuerst gegen `ec02954` (Stand vor dem Vorhaben) vergleichen, in einem temporären Worktree, danach löschen.
- Commits als AlessandroBonomo, ohne Zeilen, die ein KI-Werkzeug nennen. Gepusht wird nur, wenn der Nutzer es sagt.
- Merge nach `main` nur auf das Go des Nutzers.
- Aufräumen: `tests/output/`, Logs, Bilder, Chrome-Profile und temporäre Worktrees löschen, sobald sie nicht mehr
  gebraucht werden.

## Bekannt rot, schon vor dem Vorhaben

- Einzelne Bildlücken über 100 ms beim Himmelswechsel in der Dorf-Probe, «Sehr schwer: Übersicht → Übung 3
  wiederholen → Übung 4» (früher «Übung 8 wiederholen»): im ersten Zeichnen des Himmels `forest`, nur zeitweise, auf
  `ec02954` ebenso (Review Ticket 02).
- Vereinzelte Lücken über 100 ms im Wald, in Prolog und Einstieg; bei Verdacht auf Zufall einmal wiederholen.
- Die übrigen Punkte aus `.scratch/tutorial-fuehrung/STAND.md`, «Bekannt rot» (Übersicht öffnen und schliessen in
  Chrome headless, Layout-Funde bei 640 × 360, `tests/offline.mjs` in der Notbremse) gelten weiter.

## Offene Punkte

- Alte Bestwerte: Brechung, Farbenlehre und Mischung heissen wie früher; wer sie auf den alten Brettern hatte, sieht
  in der Übersicht Drehungen (2, 3, 2), die auf den neuen (mindestens 3, 4, 3) nicht zu erreichen sind. Die Spec will
  keine Umrechnung; nur Geräte mit altem Stand.
- Hinweise nebenbei in «Brechung»: Kamera und Neustart stehen zusammen (hochkant drei Zeilen) neben der ersten
  Erklärung. Nur den ersten zu zeigen hiesse, dass den Neustart-Hinweis nie sieht, wer die Kamera nicht benutzt;
  Entscheid nach dem Test.
- Abdunkeln: nach dem Poco-Test von 0,46 auf 0,52 (`FUEHRUNG.kegel.dunkel`).
- Tipps in den sechs Welten, Führung für Menü, Übersicht und Ton gehören nicht in dieses Vorhaben.
