# 14: Nachschliff der Sperre (leise.sh)

**Spec:** ../spec.md

**Status:** done (Review 17.11.2026 bestanden)

**Blocked by:** 13 (in `feature/umbau`)

**What to build:** Die Funde aus dem Review von Ticket 13 an `tools/leise.sh` beheben. Nichts am Spiel.

- [x] **Halter tot, leichte Läufe leben noch:** Ein leichter Lauf prüft regelmässig, ob der Halter der Gruppe (`pid`)
      noch lebt, und trägt sich sonst selbst als Halter ein, damit die Gruppe nicht ohne Halter dasteht. Test in
      `tests/leise.test.mjs`: Halter hart beenden (`taskkill /F` bzw. `kill -9`), ein zweiter leichter Lauf lebt; ein
      alleiniger Lauf startet erst, wenn auch dieser fertig ist.
- [x] **Vorrang auch für wartende leichte Läufe:** Wartende leichte Läufe tragen sich in die Warteschlange ein, so dass
      `LEISE_VORRANG` auch gegen eine Kette alleiniger Läufe wirkt (Review 13: `npm test` mit Vorrang 2 wartete 43 min,
      weil eine Kette alleiniger Läufe jedes Rennen um die freie Sperre gewann). Kein Lauf darf endlos warten. Test.
- [x] **Übernahme mit Sperre der Gruppe:** `uebernehmen` des alleinigen Laufs nimmt auch `$SPERRE.leicht`, damit nach
      einem harten Abbruch kein Wettlauf entsteht.
- [x] **«fast ruhig» im Bildvergleich:** Die Fälle, in denen eine Ansicht nur «fast ruhig» war, in der Übersicht am
      Schluss zählen (oder den Ausweg auf «poco» beschränken, wenn er nur dort nötig ist); unter «Comments» begründen.
- [x] README und `CLAUDE.md` nachführen, falls sich Verhalten ändert.

## Hinweise

- Ältere Kopien von `leise.sh` (in Worktrees, die vor dem Merge von 13 abgezweigt sind) halten eine Gruppe ohne
  lebenden Halter für verwaist. Deshalb holen alle Worktrees `feature/umbau` herein, sobald 13 gemergt ist.
- Tests mit eigenen Pfaden (`LEISE_SPERRE`, `LEISE_WARTE`), nie gegen die echte Sperre unter `/tmp`.

## Comments

### Umsetzung (17.11.2026, Branch `ticket/umbau-14`)

**Gemacht** (je Schritt ein Commit):

1. **Übernahme unter der Sperre der Gruppe** (`196cde7`): `sperren`/`entsperren` und `GRUPPE` stehen jetzt vor beiden
   Arten; `uebernehmen` nimmt nach `$SPERRE.uebernahme` auch `$SPERRE.leicht` und prüft darin neu. Reihenfolge immer
   «Übernahme, dann Gruppe»; kein Lauf nimmt die Übernahme, während er die Gruppe hält (kein gegenseitiges Warten).
   Das Fenster von Millisekunden lässt sich nicht verlässlich nachstellen, darum ohne eigenen Test.
2. **Wache je leichtem Lauf** (`7465d3a`): Nach dem Eintreten (und nach `leise.ps1`, also im Job) startet ein
   Hintergrund-Teil der Shell (`wache`, Ein-/Ausgabe auf `/dev/null`, Fallen zurückgesetzt). Er prüft alle 5 s unter der
   Sperre der Gruppe, ob der Lauf noch lebt und eingetragen ist, und setzt sich als Halter, wenn `pid` auf einen toten
   zeigt; sonst endet er. `austreten` beendet ihn unter der Sperre der Gruppe (dann hält er sie nicht). Test «Halter
   hart beendet, leichter lebt weiter»: zwei leichte, `taskkill /F` auf die winpid aus `pid`; binnen 15 s steht der
   zweite in `pid`, ein danach gestarteter alleiniger beginnt erst nach dessen Ende, Sperre danach weg. Gegenprobe
   ohne Wache: rot (`pid` bleibt beim toten).
3. **Wartende leichte in der Warteschlange** (`f1427f7`): Ein leichter Lauf, der nicht beim ersten Versuch eintritt,
   legt `$WARTE/<vorrang>.leicht.<pid>` an (Inhalt «pid winpid» wie bei den alleinigen). Alleinige (neue und die
   Kopien aus 13, die die Zahl vor dem ersten Punkt lesen) lassen ihm bei kleinerer Zahl den Vortritt. Leichte
   übergehen diese Marken (zwei leichte liessen einander sonst gegenseitig vor).
   - **Gegenseitiges Warten vermieden:** Ein leichter lässt einem alleinigen mit grösserer Zahl nach `LEISE_FRIST`
     den Vortritt, der alleinige ihm wegen der Zahl: beide warteten ewig. Darum nimmt ein leichter seine Marke zurück,
     solange er selbst jemandem Vortritt lässt. Gegenprobe ohne Zurücknehmen: der Fall hängt (Zeitrahmen 120 s greift).
   - **Frist neu nur für alleinige, die schon vor dem leichten warteten** (`stat -c %Y` der Marke ≤ Start des
     leichten, `T0`). Sonst hätte jeder alleinige einer Kette, der hinter einem langen anderen alleinigen über 10 min
     gewartet hat, den wartenden leichten wieder überholt. Endlos wartet so keiner: Alleinige, die nach dem leichten
     kommen, lassen ihn vor; die vor ihm sind endlich viele; ein alleiniger mit grösserer Zahl wird nur von leichten
     überholt, die vor ihm da waren, oder höchstens `LEISE_FRIST` Minuten von späteren.
   - Tests: «Vorrang eines wartenden leichten gegen eine Kette alleiniger» (A1 → A2 → A3 direkt aneinander, Vorrang
     500, dazu L mit 2: L läuft vor A2; Gegenprobe ohne Marke: rot) und «kein gegenseitiger Vortritt nach der Frist»
     (die Marke von A2 wird um 2 min zurückdatiert, statt eine Minute zu warten).
   - Jeder Fall im Test hat jetzt einen Zeitrahmen von 120 s; danach werden seine Läufe mit `taskkill /F /T` beendet.
4. Kopfkommentar von `leise.sh` (`5a5d8e9`), README (`d603917`: Absatz zu `leise.sh` unter Werkzeuge, Absatz
   «fast ruhig» beim Bildvergleich). `CLAUDE.md` nicht geändert: Die Regeln für Agenten (welche Art, Vorrang) bleiben
   gleich, nur die Sperre hält sie jetzt besser ein.
5. **«fast ruhig»** (`4f88a97`): beschränkt auf «poco» (`FAST_RUHIG`), und die Übersicht am Schluss zählt die Fälle
   mit Namen (auch über `--jobs`, im JSON der Teilprozesse). Begründung: In allen bekannten Läufen (Umsetzung und
   Review 13, SwiftShader und GPU, auch neben anderen leichten Läufen) kam es nur bei «poco» vor (`poco-start`,
   `poco-dorf-uebung-2`, `poco-welt-2-vor`); bei den drei Grössen mit Pixeldichte 1 wird die Ansicht immer
   byte-gleich. Eine fast ruhige Ansicht dort ist damit wieder rot («Ansicht wird nicht ruhig») und fällt auf.

**Läufe:**

- `node tests/leise.test.mjs`: 9 Fälle, 41 Prüfungen, 0 Fehler, 25–28 s (nach jedem Schritt grün).
- Verträglichkeit mit der Kopie aus Ticket 13 (`0793a2d:tools/leise.sh` in einem Ordner im Scratchpad, nur mit
  eigenen Pfaden, Skript danach gelöscht), alle grün: alte Kette alleiniger lässt dem neuen wartenden leichten
  (Vorrang 2) den Vortritt; alter alleiniger nach der Frist und neuer leichter warten nicht aufeinander; alter leichter
  (500) wartet, bis der neue wartende leichte (2) eingetreten ist, und läuft dann neben ihm; alter leichter als Halter
  hart beendet: der neue leichte trägt sich ein, ein alter alleiniger wartet auf ihn; drei alte und drei neue leichte
  mit einem neuen und einem alten alleinigen: beide alleinigen allein, Sperre danach weg.
- `LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 5400 node tests/bildvergleich.mjs
  --gpu` (an der echten Sperre, mit der neuen Kopie; wartete zuerst auf einen alleinigen Lauf eines anderen Agenten):
  **grün**, 77 Bilder in 7 min 43 s, grösste Abweichung 6, höchstens 0,014 %; Übersicht: «nur «fast ruhig» …: 1,
  poco-welt-2-vor (0 Pixel, bis 1)».

**Offen / Grenzen:**

- **Kopien aus Ticket 13 haben keine Wache.** Ist nur ein alter leichter Lauf in der Gruppe übrig und stirbt der Halter
  hart, bleibt `pid` tot, bis ein neuer leichter eintritt; für neue und Kopien aus 13 ist das harmlos (sie prüfen die
  Mitglieder), nur Kopien von vor 13 liefen dann daneben (wie im Review 13 beschrieben).
- **Kopien aus Ticket 13 als leichte Läufe** halten eine Marke `…leicht…` für einen wartenden alleinigen: Sie lassen
  einem wartenden neuen leichten mit gleicher oder kleinerer Zahl (oder dessen Marke älter als ihre Frist ist) den
  Vortritt, bis er eingetreten ist. Das verzögert sie nur kurz (er tritt ein, sobald Platz ist), kein Hängen.
- Kopien aus Ticket 13 als leichte Läufe tragen sich selbst nicht ein; für sie gilt der Vorrang gegen alleinige weiter
  nicht. Darum sollen die Worktrees `feature/umbau` hereinholen, sobald 14 gemergt ist.
- Ein leichter Lauf trägt sich erst nach dem ersten gescheiterten Versuch ein (bis 2 s). Ein alleiniger, der genau in
  dieser Zeit die freie Sperre nimmt, kommt noch vor ihm dran (höchstens einer).
- Die Wache ist ein zusätzlicher Prozess je leichtem Lauf (meist `sleep 5`); nach einem harten Tod des Laufs endet sie
  bei der nächsten Prüfung von selbst.
- Der Weg über `--jobs` (Teilprozesse geben `fastRuhig` im JSON zurück) ist nicht eigens gelaufen.

### Review (unabhängiger Reviewer, 17.11.2026)

**Ergebnis:** bestanden. Ein kosmetischer Fix selbst gemacht, keine mittleren oder grossen Funde.

**Selbst behoben:** `2eff3b5` README: die neue Zeile zu `leise.sh` (159 Zeichen) auf 120 umbrochen. Die lange Zeile
im Absatz zum Bildvergleich stammt schon aus Ticket 13 und bleibt.

**Logik von `leise.sh`** (durchgegangen, wo verdächtig nachgestellt):

- **Kein gegenseitiges Warten:** Ein leichter Lauf mit Marke wartet nur auf etwas, das selbst nicht wartet (alleiniger
  Halter, volle Gruppe, kurz die Übernahme); wer ihm wegen der Marke Vortritt lässt (alleinige mit grösserer Zahl, neue
  wie aus 13; leichte aus 13 mit gleicher oder grösserer Zahl), ist nie das, worauf er wartet. Lässt er selbst vor,
  nimmt er die Marke zurück. Damit gibt es keinen Kreis. Reihenfolge der Sperren immer Übernahme vor Gruppe; Wache und
  `austreten` nehmen nur die Gruppe. Kein endloses Warten: Leichte, die nach einem alleinigen kamen, lassen ihn nach
  `LEISE_FRIST` vor und nehmen ihre Marken zurück; die vor ihm kamen, sind endlich viele.
- **Alleiniger neben leichtem:** Eintreten und Austreten der Gruppe, Übernahme und Wache ändern die Sperre nur unter
  `$SPERRE.leicht`; ein alleiniger nimmt die Sperre per `mkdir` und wartet bei fehlender `pid` eine Minute (halb
  angelegt). Während `rm -rf` des letzten leichten sieht ein Wartender entweder einen lebenden Halter oder ein frisch
  geändertes Verzeichnis. Die Wache setzt `pid` nur, wenn ihr eigener Eintrag `leicht.<pid>` noch da ist, also nie in
  die Sperre eines alleinigen.
- **Wache:** nach `taskkill /F` auf den Halter (eigene Probe, zwei leichte): binnen 5 s ist der zweite Halter, die Wache
  des getöteten verschwindet (in `ps` nicht mehr da), Sperre nach dem Ende des zweiten weg. Nach normalem Ende keine
  Meldung «Terminated», keine übrige Wache (ausser einem `sleep 5` für höchstens 5 s, Ausgabe auf `/dev/null`, hält
  also keine Pipe offen).
- **Tote Marke eines wartenden leichten:** wartender leichter (Vorrang 2) hart beendet, alleiniger (500) dahinter: er
  räumt die Marke weg und läuft nach 5 s; Warteschlange danach leer.
- **Kopie aus Ticket 13** (`0793a2d:tools/leise.sh` mit `leise.ps1` im Scratchpad, nur eigene Pfade): neuer alleiniger
  hält, dahinter neuer wartender leichter (2), alter alleiniger (500), alter leichter (500): Reihenfolge A1 → L → alter
  alleiniger allein → alter leichter, nie überlappend, Sperre und Warteschlange danach leer. Die Angaben des Umsetzers
  zu den Kopien aus 13 stimmen mit dem Code überein (sie lesen die Zahl vor dem ersten Punkt; ihr `uebernehmen` nimmt
  die Gruppe weiterhin nicht, das kleine Fenster aus Review 13 bleibt also, solange solche Kopien laufen).

**Beobachtungen (klein, nicht behoben):**

- Ein leichter nimmt seine Marke auch zurück, wenn er einem alleinigen wegen kleinerer oder gleicher Zahl vorlässt
  (nötig wäre es nur beim Vortritt wegen der Frist). Mit drei Beteiligten (alleiniger mit 1, leichter mit 2, Kette mit
  500) kann so ein Glied der Kette noch einmal vor den leichten kommen, aber nur, wenn der alleinige mit 1 in weniger
  als etwa 2 s fertig ist (der leichte trägt sich wieder ein, solange jener läuft). Praktisch bedeutungslos.
- Wie schon in Review 13: Ein hart beendeter `sh` lässt seinen Befehl (node, Chrome, im Test `sleep`) weiterlaufen; die
  Gruppe zählt ihn dann nicht mehr. Nicht Teil dieses Tickets.

**Tests:** Die Fälle prüfen das Behauptete, jeder hat den Zeitrahmen von 120 s. Gegenproben selbst gemacht: ohne Wache
(Start der Wache abgeschaltet) rot in «Halter hart beendet» (`pid` bleibt beim toten); ohne das Zurücknehmen der Marke
rot in «kein gegenseitiger Vortritt» (Marke bleibt, dann Zeitrahmen 120 s überschritten). Danach `git checkout`.

**«fast ruhig» nur für poco:** vertretbar. Der Ausweg ist für den bekannten Fleck im Lichtstreifen bei Pixeldichte 2,75
gedacht; bei den drei Grössen mit Pixeldichte 1 wäre eine nicht ruhige Ansicht ein echter Hinweis und ist jetzt rot. Die
Übersicht zählt die Fälle, auch über `--jobs`.

**Läufe:**

- `node tests/leise.test.mjs` 3×: je 41 Prüfungen, 0 Fehler (26 s, 25 s, 30 s).
- `LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 5400 node tests/bildvergleich.mjs
  --gpu --jobs 2` (echte Sperre, wartete zuerst auf einen alleinigen Lauf eines anderen Agenten): **grün**, 77 Bilder
  in 6 min 38 s, grösste Abweichung 6, höchstens 0,014 %; Übersicht «nur «fast ruhig» …: 1, poco-welt-2-vor (0 Pixel,
  bis 1)», also auch über die Teilprozesse gezählt.
