# 03: Texte

**Spec:** ../spec.md

**Blocked by:** 01  (nacheinander in `index.html`)

**Status:** ready-for-agent

**What to build:** Die Texte der Geschichte erzählen vom Kleinen Wagen (Entscheide 13, 14; Abschnitt «Texte» der
Spec). Nur Texte; Bild und Ablauf ändern sich in diesem Ticket nicht.

- [x] Prolog 2, 4 und 6 nach der Tabelle der Spec (in Prolog 6 «von Spiegel zu Spiegel, von Ort zu Ort»).
- [x] Die Untertitel bei der Ankunft in den sechs Welten (Reise und Einstieg) nach der Tabelle; die heutigen
      Nachsätze zum Spiel («Lenke es zwischen den Bäumen hindurch» usw.) fallen ganz weg.
- [x] Meldung «Gelöst» nach dem letzten Level der Sterne: «Der Wagen ist wach» statt «Ganz oben»; der Knopf bleibt.
- [x] Finale: drei Sätze statt zwei, je mit Warten auf Tippen wie heute.
- [x] Epilog 3 nach der Tabelle.
- [x] Unverändert: Prolog 1, 3, 5, Epilog 1, 2, Angebot, Texte des Dorfs, übrige Meldungen «Gelöst» und ihre Knöpfe.
- [x] Schreibung wie im Spiel: «ss» statt «ß», Anführungszeichen «», Gedankenstrich –.
- [x] Untertitel auf kleinen Handys (360 × 640, 320 × 568) und quer: kein Text abgeschnitten, nicht mehr Zeilen als
      der längste heutige Untertitel (Bilder in der Probe).
- [x] Probe: prüft die neuen Texte (Prolog über die Bühne, Untertitel der Einstiege und Reisen, Finale, Epilog);
      die Stelle, die heute «Ganz oben» erwartet, erwartet «Der Wagen ist wach».
- [ ] Alle Tests grün; Review nach dem Ticket. (Umsetzer: Texte in allen Läufen richtig, rot nur einzelne Lücken
      der Bildzeiten, siehe Comments; den ganzen Satz lässt der Reviewer laufen)

## Anhaltspunkte im Code

- `STORY_PROLOG`, `STORY_EPILOG`, `STORY_FINALE`, `STORY_CHAPTERS` (`travel`, `done`).
- Das Finale zeigt jeden Satz von `STORY_FINALE` mit `caption` (wartet auf Tippen).
- Probe: `tests/geschichte-probe.mjs` erwartet heute `'Ganz oben'` beim letzten Level im Wiederholen.

## Comments

### Umsetzer (05.11.2026)

**Gebaut** (nur Texte, Bild und Ablauf unverändert):

- `index.html`: `STORY_PROLOG` 2, 4, 6, `STORY_EPILOG` 3, die sechs `travel` in `STORY_CHAPTERS` (gelten für Reise und
  Einstieg; die Nachsätze zum Spiel sind weg) und `done` der Sterne («Der Wagen ist wach», Knopf «Hinaufschauen»
  bleibt) wörtlich nach der Tabelle der Spec. `STORY_FINALE` hat drei Sätze; `finale()` zeigt sie wie bisher je mit
  `caption` (wartet auf Tippen). Prolog 1, 3, 5, Epilog 1, 2, Angebot, Dorf und die übrigen «Gelöst» unverändert.
- `tests/geschichte-probe.mjs`: die erwarteten Sätze als Konstanten (aus der Spec, nicht aus dem Spiel gelesen).
  `pruefeSatz` prüft den gelesenen Satz, dass er ganz im Bild steht (nichts abgeschnitten, kein Überlauf) und seine
  Zeilen gegen einen Massstab in derselben Breite und Schrift: auf der Bühne der alte Prolog 2, im Untertitel über der
  Welt der Einstieg ins Dorf (die längsten Sätze vor dem Wagen). Geprüft werden Prolog und Epilog Einstellung für
  Einstellung (`buehneDurch` mit `saetze`, auch die Zahl der Einstellungen), die Einstiege und Reisen (`durchgang`,
  `finale`, `ganzerDurchgang`, Einstieg in den Vulkan im Wagen-Ablauf), die drei Sätze des Finales (alle drei
  Abläufe mit Finale warten jetzt auf drei Sätze) und in `level` «Gelöst» nach dem letzten Level jeder Welt (Meldung
  und Knopf, also auch «Der Wagen ist wach» im Durchgang); im Wiederholen erwartet die Übersicht «Der Wagen ist wach».

**Geprüft** (`GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh timeout -k 30 1000 node tests/geschichte-probe.mjs …`):

| Lauf | Texte, «Gelöst», im Bild, Zeilen | übrige Fehler |
|---|---|---|
| `--ganz` (Desktop) | alle richtig; Hinweis Prolog 6 (s. u.) | – (damals noch als Fehler gezählt, seither Hinweis) |
| `--ganz --handy --groesse 360x640` | alle richtig; Hinweis Prolog 6 | je eine Lücke: Prolog 355 ms (bei 53 ms), Neuladen 285 ms, Finale 304 ms |
| `--ganz --handy --groesse 320x568` | alle richtig; Hinweis Prolog 6 | je eine Lücke: Neuladen 322 ms, Finale 304 ms |
| `--ganz --quer` (zweimal) | alle richtig, Prolog 6 passt (2 Zeilen) | einzelne Lücken, wechselnd: Prolog 107/105 ms, Neuladen 123 ms, Planeten 425 ms, Finale 428 ms |
| `--wagen` (Desktop) | Finale mit drei Sätzen, Einstieg Vulkan | bestanden |
| `--uebersicht` (Desktop) | «Der Wagen ist wach» im Wiederholen richtig | vier einzelne Lücken (122–446 ms, bekannt auf diesem Rechner) |

Zeilen (Satz / Massstab): Desktop Untertitel höchstens 3/3 (Planeten), Bühne Prolog 6 3/2; 360 × 640 Untertitel
höchstens 4/4 (Planeten), Prolog 6 5/4; 320 × 568 Untertitel höchstens 4/4 (Meer, Planeten), Prolog 6 5/4; quer
Untertitel höchstens 3/3, Bühne höchstens 2/2. Alle Sätze ganz im Bild. Bilder: `tests/output/geschichte/<bildschirm>-leicht-*.png`.
Die Lücken sind Einzelne, ihr Ort wechselt von Lauf zu Lauf (im Finale beim Vorwärmen des Epilogs, im Vorher-Lauf auf dem
Handy ebenso: 234 ms); die Texte ändern weder Ablauf noch Zeichnen. Desktop `--ganz` ohne jede Lücke über 100 ms.
Finale netto 14,6 s statt 14,0 s (der dritte Satz: ein Wechsel des Untertitels mehr, gut 0,6 s ohne Tippen).
`tests/geschichte.test.mjs` nicht laufen gelassen: Es prüft die Wahl der Level und Titel, keine Texte der Geschichte.

**Offen, zur Entscheidung:** Prolog 6 steht wörtlich in der Spec (Entscheid 13), braucht aber auf der Bühne eine Zeile
mehr als der längste Satz vorher (Desktop 3 statt 2, kleine Handys 5 statt 4; quer gleich). Abgeschnitten wird nichts:
Die Zeilen der Bühne wachsen nach oben. Die Probe meldet das darum als HINWEIS, nicht als Fehler; im Untertitel über der
Welt bleibt die Grenze ein Fehler. Kürzen hiesse, den Text der Spec zu ändern – das entscheidet der Nutzer
(Kriterium des Tickets nennt «Untertitel», die Bühne ist nicht ausdrücklich gemeint).

### Review (05.11.2026, unabhängiger Reviewer)

**Urteil:** bereit zum Commit. Keine mittleren oder grossen Funde; drei kleine selbst behoben.

**Geprüft gegen Ticket und Spec:**

- Texte maschinell Zeichen für Zeichen verglichen (Skript liest die Tabelle «Texte» der Spec, `STORY_*` aus `index.html`
  und HEAD ea15d24 sowie die Konstanten der Probe): Prolog 2, 4, 6, die sechs Ankünfte, «Der Wagen ist wach», die drei
  Sätze des Finales und Epilog 3 stimmen genau; Prolog 1, 3, 5, Epilog 1, 2, alle übrigen Felder der Kapitel
  (`done`, `next`, `carrier`, `sky`, `up` …) und die Einstellungen von Prolog und Epilog (Kamera, `act`, `move`) sind
  unverändert; Angebot und Dorf nicht berührt. Kein «ß», «» und – wie im Spiel. Die Konstanten der Probe gleichen der
  Spec, der Massstab der Bühne ist wörtlich der alte Prolog 2, der des Untertitels der Einstieg ins Dorf (144 Zeichen,
  der längste Untertitel vor dem Wagen; der neue längste, Planeten, hat 145).
- Finale: `finale()` zeigt `STORY_FINALE` unverändert Satz für Satz mit `caption` (wartet auf Tippen); die Probe tippt
  in allen drei Abläufen (`finale`, `ganzerDurchgang`, `wagenAblauf`) dreimal.
- Probe: `pruefeSatz` vergleicht den gelesenen Satz genau (alte Nachsätze fallen so sicher auf), prüft «ganz im Bild»
  und die Zeilen gegen den Massstab in gleicher Breite und Schrift; `buehneDurch` prüft auch die Zahl der
  Einstellungen. Abgedeckt: Prolog, Einstieg Bergwald, alle fünf Reisen, Einstieg Sterne (Fortsetzen), Einstieg Vulkan
  (Wagen), Finale, Epilog, «Gelöst» am Ende jeder Welt, Wiederholen mit «Zur Übersicht». Weder zu locker noch zu
  streng; dass beim Fortsetzen nur Sterne und Vulkan geprüft werden, genügt (dasselbe Feld `travel` wie die Reise).
- Stil wie im Umfeld; die alten Kommentare «Ganz oben» in `index.html` meinen den Ort, nicht die Meldung, und bleiben.

**Kleine Funde, selbst behoben** (`tests/geschichte-probe.mjs`):

1. Kopf der Probe: Er sagte «ohne mehr Zeilen als der längste Satz», auf der Bühne ist es aber nur ein HINWEIS; ergänzt.
2. Das Ticket verlangt Bilder für kleine Handys, vom längsten Satz (Prolog 6) gab es keines: `buehneDurch` macht jetzt
   auch vom letzten Satz mit Tippen ein Bild (`<bildschirm>-leicht-prolog-6.png`).
3. Fünf Zeilen über 120 Zeichen umgebrochen, die doppelte Meldung in `pruefeSatz` zusammengefasst.

**Prolog 6:** Passt zum Ticket. Das Kriterium spricht vom Untertitel über der Welt; der Text steht wörtlich in der
Spec (Entscheid 13), und die Bühne ist dafür gebaut, nach oben zu wachsen. Bild 320 × 568
(`handy-320x568-leicht-prolog-6.png`): fünf Zeilen, gut lesbar, viel freier Himmel darüber, nichts verdeckt oder
abgeschnitten. Zeilen Satz/Massstab: Desktop 3/2, Handy 390 × 844 4/3, 360 × 640 und 320 × 568 5/4, quer 2/2. Der
HINWEIS ist die richtige Stufe; ob der Satz kürzer werden soll, entscheidet der Nutzer bei der Abnahme. Kleinigkeit
fürs Auge: Auf 320 × 568 beginnt die letzte Zeile mit «–» («– Stern für Stern …»).

**Tests** (alle unter einem Aufruf `GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh sh …`, Node-Tests
parallel, Generator danach allein, Browserläufe nacheinander, Chrome stumm):

| Lauf | Ergebnis |
|---|---|
| `beurteilung`, `geschichte`, `hall`, `ki-tester`, `levelliste`, `logic`, `vorrat`, `wuerfelliste` (`*.test.mjs`) | grün (206, 35, 6, 84, 54, 2036, 18, 20) |
| `golden.mjs` | grün (847 Level) |
| `generator.test.mjs` (allein) | grün (31) |
| `offline.mjs`, `offline.mjs --redirect` | grün |
| Probe ohne Argumente (vier Grade) | bestanden; HINWEIS Prolog 6 |
| `--wagen`, `--wagen --handy` | bestanden |
| `--ganz` | bestanden, keine Lücke über 100 ms; HINWEIS Prolog 6 |
| `--finale leicht` | bestanden |
| `--handy --grad leicht` | bestanden; HINWEIS Prolog 6 |
| `--menue` | rot: 3 einzelne Lücken (213, 126, 248 ms) |
| `--uebersicht` | rot: 5 einzelne Lücken (125–447 ms); «Der Wagen ist wach» im Wiederholen richtig |
| `--dorf` | rot: 1 Lücke (437 ms, Sehr schwer, Übung 8 → 9) |
| `--ganz --handy --groesse 360x640` (zweimal) | Texte alle richtig; Lücken Neuladen 251/252 ms, Finale 286/340 ms, Prolog 391 ms (2. Lauf) |
| `--ganz --handy --groesse 320x568` (zweimal) | Texte alle richtig; Lücken Prolog 286 ms, Neuladen 340 ms, Finale 3 × bis 445 ms; 2. Lauf Reise Sterne 424 ms, Finale 356 ms |
| `--ganz --quer` | Texte alle richtig; 1 Lücke Prolog 249 ms |

In allen Läufen: jeder Satz richtig und ganz im Bild, kein Untertitel über dem Massstab. Rot sind nur Bildzeiten.

**Bildzeiten, mit main verglichen** (Worktree von ea15d24, danach entfernt; `--ganz --handy` auf 360 × 640 und
320 × 568): main hatte selbst Lücken (Prolog 462 ms, Reise Meer 379 ms, Reise Sterne 445 ms, Einstieg Bergwald
374 ms), also dieselbe Unruhe an wechselnden Stellen.

- **Neuladen → Weiter (Wüste 26):** auf main zweimal ohne Lücke, mit dem Branch meist 250–340 ms. Gemischte Läufe auf
  320 × 568: neues Spiel mit alter Probe 320 ms, **altes Spiel mit neuer Probe 251 ms**. Die Lücke kommt also auch ohne
  die neuen Texte; kein Fund.
- **Finale (Level 60 → Epilog) auf kleinen Handys:** sechsmal von sechs mit Lücke (Umsetzer zweimal, Review viermal,
  286–445 ms), immer gleich nach einem Tippen (Wechsel des Untertitels bzw. Schleier zum Epilog). Auf main hier zweimal
  ohne (22 ms), im Vorher-Lauf auf dem Handy aber 234 ms. Nach der Regel kein Fund (kommt auf main vor). Neu ist der
  dritte Satz, also ein Wechsel mehr; der erste Satz braucht auf 320 × 568 drei Zeilen statt einer. **Beobachtung für
  Ticket 06** (das Finale wird dort umgebaut): die Lücken im Finale auf 360 × 640 und 320 × 568 eigens messen. Desktop
  und quer ohne Lücke im Finale; netto 14,3–14,7 s (main 13,9 s).

Skripte und Protokolle: Scratchpad des Reviews, `r03/` (`alle.sh`, `nachlauf.sh`, `nachlauf2.sh`, `status.txt`, je
Lauf ein `.log`).
