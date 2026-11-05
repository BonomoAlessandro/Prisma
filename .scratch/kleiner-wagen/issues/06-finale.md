# 06: Finale mit Puls durch den Wagen

**Spec:** ../spec.md

**Blocked by:** 05

**Status:** ready-for-agent

**What to build:** Im Finale erwacht der sechste Stern, ein Lichtpuls läuft durch den ganzen Wagen und über die
Deichsel zum Polarstern, der dann antwortet wie heute (Entscheide 12, 16, 19; Ablauf 6 der Spec). Die Überblendung
Wagen in Wagen ins Dorf folgt in Ticket 07, weil sie die Bühne braucht; hier wird nur vorbereitet, dass der Wagen am
Ende richtig im Bild steht.

- [x] Die Strahlen steigen zum **sechsten Stern** (nicht mehr direkt zum Polarstern); er erwacht mit seinem Ton.
- [x] Satz 1 «Der letzte Stern erwacht. …»: Ein **Lichtpuls** läuft Stern für Stern durch den Wagen, in der
      Reihenfolge des Erwachens (1 bis 6), mit den sechs Tönen.
- [x] Satz 2 «Über die Deichsel läuft das Licht bis zum Polarstern.»: Der Puls springt die Linie 6 → 7 hinauf, die
      Linie bleibt gezogen; der **Polarstern flammt auf** und setzt den Schlusston.
- [x] Satz 3 «Er hat das Zeichen gesehen. Und er antwortet.», danach der heutige Ablauf: Sein Strahl fällt aufs
      Brett, der Aufprall klingt aus, der Blick geht hinauf, Überblendung ins Dorf (vorerst weiter Stern in Stern).
- [x] Am Ende steht der Wagen im Bild so, wie die Bühne ihn zeigt (Polarstern oben links, Schale unten rechts), der
      ganze Wagen im Bild, in Desktop, Handy hoch und quer.
- [x] Jeder Satz wartet wie heute auf Tippen; das Finale bleibt nicht überspringbar. Dauer etwa 4 s länger als im
      Vorher-Lauf (ohne die Wartezeit auf Tippen).
- [x] Nach dem Finale ist der Grad geschafft, der Wagen ganz wach mit allen sieben Linien (Menü, Übersicht, Himmel
      beim Wiederholen).
- [x] Neuladen mitten im Finale verhält sich wie heute (kein neuer Fehlerfall).
- [x] Der Sprung «Finale» im Sprungbrett zeigt es im richtigen Stand.
- [x] Probe: Ablauf und Stand nach dem Finale, Dauer gegen den Vorher-Lauf, Bildzeiten, Bilder von Puls, Polarstern
      und Endbild.
- [x] Alle Tests grün; Review nach dem Ticket.

## Anhaltspunkte im Code

- `story.finale` (`ascend(0.5, true)`, `STORY_FINALE`, `caption`, Antwort `this.answer`, Kamera hinab und hinauf),
  danach Epilog mit `scene.starAt` (wo der Polarstern der Bühne im Bild steht).
- `prewarmScene(STORY_EPILOG)` im Finale: Die Bühne wird vorgezeichnet, während die Kamera still steht.

## Comments

**05.11.2026, Hinweis aus dem Review von Ticket 03:** Auf kleinen Handys (360 × 640, 320 × 568) hat das Finale in
sechs von sechs Läufen eine einzelne Lücke von 286–445 ms gleich nach einem Tippen (Vorher-Lauf Handy: 234 ms an
derselben Stelle, auf main nicht in jedem Lauf). Beim Umbau des Finales dort eigens messen.

**05.11.2026, Notiz des Umsetzers** (Worktree `kw-06`, Stand nach Ticket 05 vor dessen Review)

Gebaut (`index.html`, `tests/geschichte-probe.mjs`):

- `STORY_PULS` (nach `STORY_FLUG`): blick 1,2 s, rand 0,07, abstand 72; puls ab 0,9 s, schritt 0,26 s, glanz 0,8,
  nach 0,6 s; deichsel ab 0,35 s, zug 0,7 s, flamme 0,7 s.
- `story.finale`: `ascend(STORY_UP, false, 6)`: Der sechste Stern erwacht wie die übrigen (`erwache`, Linie 5 → 6,
  sein Ton). Satz 1: Der Blick gleitet zum ganzen Wagen über dem Untertitel (`wagenBlick`), der Lichtpunkt geht im
  sechsten Stern auf, dann `puls()`: Stern 1 … 6 mit ihren Tönen, die Linie(n) zum jeweiligen Stern leuchten mit
  (bei 4 auch 4 → 1). Satz 2: `deichsel()` zieht 6 → 7, die Strahlen der Ziele verblassen; erst dann ist der
  Polarstern wach, der Lichtpunkt steht auf ihm (`story.amStern`, in `update` je Bild nachgeführt), er flammt auf und
  setzt den Schlusston `audio.stern(7)` (`POLAR_HZ`: A5, darunter E5 und A4, 5,5 s). Satz 3: Die Bühne wird
  vorgewärmt (alles steht still). Danach die Antwort wie bisher; der Blick gleitet weich vom Wagen zur Strahlspitze.
  Am Ende `wagenBlick(1, Höhe des Polarsterns der Bühne)`.
- `wagenBlick(unten, polar)`: Der Wagen steht **waagrecht immer mittig**. Er steht 60° hoch, und die Kamera hält den
  Horizont waagrecht: Seitlich der Mitte stünde er schräg (im ersten Versuch mit dem Polarstern an seinem Ort auf der
  Bühne um gut 20° gedreht, die Deichsel fast waagrecht). Senkrecht so, dass er im freien Platz steht (über dem
  Untertitel) bzw. der Polarstern auf der Höhe dessen der Bühne, soweit der ganze Wagen im Bild bleibt.
- `caption(text, waehrend)`: Der Satz wartet erst auf Tippen, wenn das, was zu ihm geschieht, fertig ist; bis dahin
  ist die Aufforderung verborgen (`.caption.warte`). Tippen beschleunigt wie bisher.
- Probe `--wagen`: Die Aufzeichnung schreibt dazu den Ort der Sterne im Bild, den Modus, das Warten auf Tippen und die
  Oberkante des Untertitels auf. `pruefeFinale`: Erwachen von Stern 6; Puls Stern für Stern mit dem ganzen Wagen über
  dem Untertitel; Töne genau [6, 1 … 6, 7]; Satz 1 wartet erst nach dem Puls; Linie 6 → 7 zieht sich vor dem
  Polarstern, das Licht steht auf ihm, er flammt auf; Satz 2 wartet erst danach; Endbild ganz im Bild, Polarstern oben
  links, Schale unten rechts; nach dem Finale alle sieben wach mit allen Linien. Bilder `wagen-finale-puls`,
  `-polarstern`, `-endbild`.
- Sprungbrett: keine Änderung nötig (der Sprung «Finale» endet in `ui.advance` → `finale`).

Geprüft (alle über `GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Chrome stumm):

- Node `geschichte`, `levelliste`, `hall`: grün.
- `--wagen` Desktop, `--handy --dpr 2.75`, `--quer --dpr 2.75`: bestanden, Konsole ohne Fehler (Desktop und Handy
  nach dem Umbau von `wagenBlick` wiederholt). Der Polarstern steht am Ende bei 0,34 / 0,18 (Desktop), 0,11 / 0,34
  (hoch), 0,38 / 0,12 (quer) der Breite / Höhe; der der Bühne bei 0,72 / 0,19, 0,88 / 0,34, 0,70 / 0,12.
- Dauer des Finales netto, gegen den Vorher-Lauf (Grenze +4,5 s): `--finale` Desktop 17,72 s gegen 14,00 (+3,72);
  `--finale --handy --dpr 2.75` 17,70 gegen 14,31 (+3,39); `--ganz` Desktop 17,67 gegen 14,00 (+3,67); `--ganz
  --handy --dpr 2.75` 17,70 gegen 14,01 (+3,69). Davon stammen **+0,69 s aus Ticket 03** (dritter Satz, Überblendung
  2 × 350 ms): `--finale` Desktop auf ea15d24 13,96 s, auf dem Vorstand (Ticket 05) 14,65 s. Gegen den Vorstand kostet
  das Finale also gut 3 s mehr. Reisen und Einstiege unverändert (−0,52 … +0,03 s).
- Bildzeiten: Finale Desktop längste Lücke 54–71 ms, Handy 24–35 ms. `--ganz --handy`: eine Lücke von 379 ms im
  Prolog (von diesem Ticket nicht berührt; Vorher-Lauf 310 ms an derselben Stelle).
- **Lücke auf dem kleinen Handy** (360 × 640, Hinweis aus dem Review 03): mit der Probe auf dem Vorstand 318 / 355 ms,
  auf dem neuen Stand 446 + 370 / 288 + 341 ms; jede liegt 50–80 ms nach dem Ende eines Bilds der Probe, während der
  Satz ruhig auf Tippen wartet. Mit einer Kopie der Probe ohne Bilder (danach gelöscht) je zwei Läufe: Vorstand
  längste Lücke 24 / 24 ms, neu 23 / 19 ms, netto 14,67 gegen 17,68–17,71 s. Die Lücken kommen also von den Bildern
  der Probe (Nachzeichnen nach dem Bildschirmfoto), nicht vom Spiel; kein Fund.
- Neuladen mitten im Finale (Satz 1, eigenes Skript, gegen den Vorstand): gleich wie heute: Menü, Stand Platz 59,
  60 gelöst, nicht geschafft, «Weiter» spielt Level 60 wieder; Konsole ohne Fehler. Neu zeigt der Himmel vor dem
  Neuladen schon sechs wache Sterne (das Erwachen ist geschehen), danach wie vorher.
- Sprung «Finale» mit `?szenen`: Stern 6 erwacht, drei Sätze mit Puls und Polarstern, danach alle sieben wach,
  nichts gespeichert, Konsole ohne Fehler.
- Bilder angesehen: Puls, Polarstern, Endbild in Desktop, hoch, quer; Endbild aufrecht, ganzer Wagen.

Offen:

- **Stern in Stern bis Ticket 07 nur ungefähr:** Der Polarstern der Bühne steht im ersten Bild des Epilogs weiter
  rechts (siehe oben), der Wagen am Himmel ist dort nicht ganz im Bild unterzubringen, ohne schräg zu stehen. Ticket
  07 legt den Wagen der Bühne (bzw. `STORY_EPILOG[0].from`/`fromP`) so, dass sein Polarstern dort steht, wo
  `wagenBlick` ihn zeigt; die Höhe stimmt schon.
- `ascend` hat den Parameter `star` jetzt ohne Aufrufer (räumt der Koordinator beim Zusammenführen auf).
- Review (anderer Agent), dann Commit durch den Koordinator.

**05.11.2026, Review** (unabhängiger Reviewer, frischer Kontext; geprüft die nicht committeten Änderungen gegen
750b6c0, wie der Koordinator sie aus `kw-06` übertragen hat; Vergleich mit einem Worktree von 750b6c0, danach entfernt)

Ergebnis: **bereit zum Commit.** Ticket und Spec (Ablauf 6, Entscheide 12, 16, 19) erfüllt; keine offenen Funde.

Selbst behoben (klein):

- `ascend(elevation, star, stern)` → `ascend(stern)`: Seit diesem Ticket geben beide Aufrufer (Ende einer Welt,
  Finale) den Stern mit; `star` und `elevation` (nur für den Blick ohne Stern) waren tot. Die Zweige dafür (Polarstern
  schon vorher schwach, Abstand 60, Akkord mit 7, `aimGaze`) sind weg, das Verhalten mit Stern bleibt gleich.
- Probe: Laufzeit von `--wagen` im Kopf und über `wagenAblauf` «etwa 9 min» → «etwa 4 min» (gemessen 4:03 Desktop,
  4:11 Handy, 4:10 quer, jeweils mit dem Finale).

Geprüft im Code: Aufstieg zum sechsten Stern über `ascend` mit `erwache(6)` (Blitz 1,6 s und Linie 5 → 6 sind fertig,
bevor der Puls bei 2,2 s beginnt, auch beschleunigt, weil alles auf der Zeitachse der Szene läuft); Puls Stern 1 … 6
mit je seinem Ton und den Linien zum Stern (bei 4 auch 4 → 1); Deichsel 6 → 7, dann erst Polarstern wach, Lichtpunkt
auf ihm (`amStern`, in `update` nachgeführt, im Epilog wieder `null`), Schlusston `audio.stern(7)` ohne neue Klangdatei;
`caption(text, waehrend)`: Die Aufforderung ist bis zum Ende der Animation verborgen (`visibility`, das Layout bleibt
stehen), Tippen beschleunigt wie bisher, das Finale bleibt ohne «Überspringen»; Vorwärmen der Bühne zu Satz 3 (die
Kamera steht), danach noch gut 8 s bis zur Bühne; Sprungbrett (kein Sprung, solange eine Zwischenszene läuft).
Leerlauf und Leistung: keine neue Schleife, je Bild nur die Nachführung des Lichtpunkts während des Finales,
`wagenBlick` zweimal je Finale.

Läufe (alle über `LEISE_VORRANG=6 GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Chrome stumm):

- Node: alle `tests/*.test.mjs` und `golden` parallel, `generator.test` danach: grün. `offline.mjs` und `--redirect`:
  grün. Probe ohne Argumente: bestanden.
- `--wagen` Desktop, `--handy --dpr 2.75`, `--quer --dpr 2.75`: bestanden, Konsole ohne Fehler. Polarstern am Ende
  0,34 / 0,18, 0,11 / 0,34, 0,38 / 0,12 (Breite / Höhe), auf der Bühne 0,72 / 0,19, 0,88 / 0,34, 0,70 / 0,12 (die Höhe
  stimmt, waagrecht Ticket 07). Bilder angesehen: Puls mit ganzem Wagen über dem Untertitel, Polarstern flammt auf,
  Endbild aufrecht und ganz im Bild (Polarstern oben links, Schale unten rechts), in allen drei.
- Dauer des Finales netto (Grenze +4,5 s gegen `vorher/`), in Klammern 750b6c0 im selben Aufruf:

  | Lauf | neu | Vorher-Lauf | mehr | 750b6c0 |
  |---|---:|---:|---:|---:|
  | `--finale` Desktop | 17,72 | 14,00 | +3,72 | 14,65 |
  | `--finale --handy --dpr 2.75` | 17,67 | 14,31 | +3,36 | 14,65 |
  | `--finale` 360 × 640 (4 Läufe) | 17,30–17,72 | – | – | 14,26–14,65 |
  | `--ganz` Desktop | 17,71 | 14,00 | +3,71 | 14,62 |
  | `--ganz --handy --dpr 2.75` (3 Läufe) | 17,70–17,72 | 14,01 | +3,69 … +3,71 | 14,65 |
  | `--ganz --quer` (2 Läufe) | 17,67–17,69 | – | – | 14,62 |

  Gegen 750b6c0 also +3,02 … +3,09 s; die +0,65 s aus Ticket 03 bestätigt. Reisen und Einstiege in `--ganz` unverändert
  (−0,52 … +0,01 s gegen den Vorher-Lauf, gleich wie 750b6c0).
- Bildzeiten Finale: Desktop längste Lücke 53–54 ms (750b6c0: 22–35 ms), Handy 35–36 ms (20–24), quer 53 ms (23).
  Die eine Lücke von gut 50 ms liegt in allen neuen Desktop- und Quer-Läufen beim Aufprall der Antwort aufs Brett
  (etwa 11,6 s Szenenzeit); unter der Grenze von 100 ms, kein Fund. Vermutlich das Rastern der vorgewärmten Bühne, das
  jetzt später beginnt; wer in Ticket 07 an der Bühne arbeitet, kann es im Auge behalten.
- **Kleines Handy** (`--finale leicht --handy --groesse 360x640`, Kopie der Probe, die die Zeitfenster ihrer Bilder
  ausgibt, danach gelöscht): mit Bildern neu 357 ms / 23 ms, 750b6c0 410 / 342 ms; jede Lücke über 100 ms beginnt
  25–40 ms nach dem Ende eines Bilds der Probe, während ein Satz auf Tippen wartet, auf beiden Ständen. Ohne Bilder je
  zwei Läufe: neu 23 / 23 ms, 750b6c0 24 / 23 ms. Die Aussage des Umsetzers stimmt: Die Lücken kommen von den Bildern
  der Probe, nicht vom Finale. Ebenso eine Lücke von 267 ms im Finale von `--ganz --quer` (50 ms nach einem Bild der
  Probe, im zweiten Lauf nicht).
- Neuladen mitten im Finale (Satz 1) und Sprung «Finale» (Skript des Umsetzers, neu und 750b6c0): Neuladen gleich wie
  im Vorstand (Menü, Platz 59, 60 gelöst, nicht geschafft, «Weiter» spielt Level 60), neu nur mit Stern 6 schon wach;
  Sprung: Stern 6 erwacht, nach dem Finale alle sieben wach mit allen Linien, nichts gespeichert; Konsole ohne Fehler.
- `--handy --grad leicht`: bestanden. `--dorf`, `--menue`, `--uebersicht` je zweimal: einzelne Lücken über 100 ms an
  den bekannten Stellen (Dorf «Übung 8 wiederholen → Übung 9» 441 ms, Menü «Spiel → Menü» 142/180 ms, Übersicht an
  wechselnden Stellen), auf 750b6c0 dieselben (463 ms, 106 ms, 143–286 ms); vom Finale nicht berührt.
- `--ganz --handy`: Prolog 213 ms im dritten Lauf (bekannt, Ticket 07); «Neuladen → Weiter (Wüste 26)» 122 / 215 / 24 ms
  (750b6c0 19 / 24 ms) – nicht in jedem Lauf, im Weg dorthin läuft kein Code dieses Tickets, kein Fund.
  `--ganz --quer`: Reise zu den Planeten bzw. Sternen 379–432 ms und Neuladen 122/127 ms wie schon im Review 05 auf
  älteren Ständen (750b6c0 diesmal: Prolog 106 ms, Neuladen 71 ms).
