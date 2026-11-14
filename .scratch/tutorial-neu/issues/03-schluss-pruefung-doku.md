# 03: Schluss mit Prüfung und Doku

**Spec:** ../spec.md

**Blocked by:** 02

**Status:** ready-for-human (geprüft und beschrieben; offen nur noch der Test des Nutzers auf dem Poco und mit einer
Person, die Prisma nicht kennt, danach der Merge auf sein Go)

**What to build:** Das Vorhaben ist geprüft und beschrieben, bereit für den Test des Nutzers und den Merge auf sein Go.

- [x] Alle Node-Tests und Golden grün; Dorf-Probe auf allen vier Grössen; Unterbrechungen mitten in der Führung
      (Neuladen: zurück auf Übung 1; Neustart, Menü, Übersicht, «Dorf überspringen»); Wackel-Probe in einer Welt
      (Sperre gilt dort nicht).
- [x] Doku: `CONTEXT.md` (Übungen, Führung, Band, Lichtkegel, Sperre; Abgelöstes), `README.md`, PLAN 1a.3 mit Stand,
      `.scratch/tutorial-neu/STAND.md` mit Übergabe, Beobachtungsfragen für den Test von Hand.
- [x] `APP_VERSION` in `index.html` und `sw.js` gleich.
- [ ] Offen für den Nutzer: Poco-Test und Test mit einer Person, die Prisma nicht kennt. Merge nach `main` nur auf sein
      Go (vorher `main` holen).

## Comments

### Umsetzung (15.11.2026)

Branch `ticket/tutorial-neu-03` von `feature/tutorial-neu` bei abff645. Am Spiel ist nichts geändert, nur Proben und
Doku; darum bleibt `APP_VERSION` `2026-11-14 tutorial-neu-3` (index.html und sw.js gleich).

**Tests** (über `tools/leise.sh`, schwere Läufe einzeln):

- Alle Node-Tests grün (10 Dateien, `logic.test.mjs` 2059 Tests). Golden grün: 842 Level, Löser für die Stichprobe
  (88 Level).
- Dorf-Probe `--dorf`: `--handy` und `--quer` grün, Konsole ohne Fehler. Desktop und `--handy --groesse 360x640` je
  nur mit der bekannten Bildlücke «Sehr schwer: Übersicht → Übung 3 wiederholen → Übung 4» (367 ms bzw. 163 ms, im
  ersten Zeichnen der Himmel beim Wechsel), sonst grün. Das ist die bekannte Lücke aus «Bekannt rot» (Review Ticket 02,
  auf `ec02954` ebenso); kein neues Rot, darum kein Vergleich.
- Randfälle `--dorf-raender` am Desktop und auf dem Handy grün, mit dem neuen Fall g), Konsole ohne Fehler; in den gemessenen
  Übergängen keine Lücke über 100 ms.
- Wackel-Probe am Desktop (1440 × 900) und auf dem Handy (`MOBILE=1 DPR=3`, 393 × 852) grün, Konsole ohne Meldungen.
  In der Welt («Lichtblick», Bergwald Leicht) drehen alle 3 drehbaren Elemente, der feste Spiegel wackelt.

**Unterbrechungen mitten in der Führung:** Was `--dorf` schon spielt: Neuladen mitten in «Farbenlehre» (Schritt 2) →
«Weiter» beginnt bei Übung 1, Schritt 1; Neustart in «Erstes Licht» → Schritt 1; Menü und Übersicht behalten Übung und
Schritt; die offene Übung aus der Übersicht läuft im Ablauf weiter; «Überspringen» mitten in «Farbenlehre» (Schritt 2,
eine Handlung mit Lichtkegel) → Satz zum Ende, im Bergwald bleibt nichts von der Führung. `--dorf-raender` dazu
«Überspringen» beim Versinken und während der Feier. **Ergänzt** in `--dorf-raender` als Fall g):

- mitten in der Führung (Übung 1, Schritt 2) ins Menü, in einen anderen Grad (Mittel, Bergwald 1): dort keine Führung
  (kein Band, kein Kegel, keine Hand, nichts abgedunkelt); zurück in Leicht: Übung 1, Schritt 1, Stand unverändert;
- «Dorf überspringen» im Wechsel zwischen zwei Schritten (nach «Weiter», bevor der nächste einblendet; der Wechsel für
  die Probe auf 3 s gestreckt): Satz zum Ende ohne Band und Kegel, auch nach Ablauf des Wechsels, im Bergwald nichts
  von der Führung.

**Wackeln in einer Welt:** `tests/wackel-probe.js` prüfte schon, dass in der Welt keine Führung läuft, der feste
Spiegel wackelt und das drehbare daneben dreht. **Ergänzt:** `fuehrung.darf` gilt dort für jedes Element,
`fuehrung.vorrang()` ist null, und jedes drehbare Element dreht beim Antippen seiner Mitte (bis das Level gelöst ist).

**Doku:** `CONTEXT.md` (Führung: Neustart gegen Neuladen, kein Funkeln; unter «Abgelöst» neu Umriss, die neun Übungen,
Platz im Dorf, Funkeln), `README.md` (`--dorf` und `--dorf-raender` mit vier Übungen, Band, Lichtkegel, Sperre, ohne
Umriss und späten Fingerzeig; «Levels» mit den vier Übungen), `PLAN.md` 1a.3 mit Stand, `CLAUDE.md` «Laufendes
Vorhaben», `STAND.md` als Übergabe, Status von Ticket 01 und 02.

### Beobachtungsfragen für den Test von Hand

Auf dem Poco (der Nutzer, hochkant und quer) und mit mindestens einer Person, die Prisma noch nie gesehen hat, auf dem
Handy. Der Person nichts erklären, nur zuschauen; erst am Ende fragen. Antworten hier unter «Comments».

**Führung allgemein**

1. Findet der Blick den Satz im Band unten von selbst, oder sucht die Person zuerst oben oder auf dem Brett?
2. Fällt der Lichtkegel genug auf (Abdunkeln 0,46)? Ist ohne Zögern klar, welches Element gemeint ist?
3. Wird die Hand verstanden und nachgemacht, auch das lange Drücken in «Erstes Licht» Schritt 4?
4. Wird «Weiter» bei Erklärungen gefunden, oder tippt die Person zuerst aufs Brett und wartet?
5. Die Sperre: Tippt die Person andere Elemente an? Wirkt ihr Wackeln wie «hier nicht» oder wie ein Fehler?
6. Merkt die Person, dass ein Schritt geschafft ist, ohne Funkeln, nur mit Punkt, leisem Ton und dem Wechsel nach
   0,6 s? Auch mit Ton aus? Werden die Punkte ● ● ○ ○ als Fortschritt gelesen?
7. «Erstes Licht» Schritt 3: Wird nach dem Wackeln des festen Spiegels «rund gegen eckig» verstanden?

**Hinweise aus dem Review von Ticket 02**

8. Hinweise nebenbei in «Brechung»: Kamera und Neustart stehen ab Schritt 1 zusammen über dem Band, hochkant drei
   Zeilen, gleichzeitig mit der Erklärung zum Block. Werden sie gelesen, überlesen, oder lenken sie von der Erklärung
   ab? Benutzt die Person danach die Kamera (wischen, zwei Finger) und findet sie den Kreispfeil?
9. Zwei Tippen mit Zwischenstand: In «Brechung» Schritt 2 und «Farbenlehre» Schritt 3 schickt das erste Tippen das
   Licht zurück zur Lampe, in «Farbenlehre» Schritt 4 und «Mischung» Schritt 2 steht der Spiegel danach längs zum Strahl
   und das Licht endet an seiner Kante. Tippt die Person nach dem ersten Tippen weiter («bis …»), oder hält sie inne
   und glaubt, etwas falsch gemacht zu haben?
10. «Farbenlehre» Schritt 4: Kegel und Hand liegen auf dem Spiegel, nicht auf der roten Lampe. Wird «die andere Lampe»
    gefunden und verstanden, dass sie von selbst rot leuchtet? Sonst ginge `bei: ['6,4', '6,1']`.
11. Nur auf dem Poco mit altem Stand: Zeigt die Übersicht bei «Brechung», «Farbenlehre» und «Mischung» noch alte
    Drehungen (2, 3, 2) von den alten Brettern, die auf den neuen (mindestens 3, 4, 3) nicht zu erreichen sind? Stört
    das?

**Übungen und danach**

12. «Farbenlehre» Schritt 2: Wird der Ring am Kristall verstanden, auch die falsche Farbe, die darin flackert?
13. «Mischung» mit vier Lampen und acht Elementen: Findet sich die Person zurecht, oder sucht und zögert sie? Wird
    der Kombinator verstanden?
14. Massstab der Spec: Schafft die Person alle vier Übungen ohne fremde Hilfe? Benutzt sie danach im Bergwald (einige
    Level) Drehen, Zurückdrehen, Prisma, Filter und Kombinator richtig?
15. Nur der Nutzer: Neuladen mitten im Dorf beginnt bei Übung 1, die Übersicht behält die gelösten. Passt das so?
16. Nur der Nutzer, hochkant, quer und auf einem kleinen Handy: Verdeckt das Band etwas, ist der Satz gut lesbar,
    ruckelt der Wechsel «Übersicht → Übung wiederholen» (bekannte Lücke beim Himmelswechsel)?
17. Welcher Satz wird zweimal gelesen oder nachgefragt? Wo bleibt die Person länger als ein paar Sekunden stehen,
    ohne etwas zu tun?
18. Nur der Nutzer, am Desktop: Werden Klicken, Rechtsklicken («Erstes Licht» Schritt 4) und das Mausrad ebenso
    verstanden wie auf dem Handy, auch mit der Hand, die die Geste vorzeigt?
