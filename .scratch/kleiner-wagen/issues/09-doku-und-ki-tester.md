# 09: Doku und Test der KI-Tester

**Spec:** ../spec.md

**Blocked by:** 08

**Status:** ready-for-agent

**What to build:** Glossar, Plan und Kommentare beschreiben den Kleinen Wagen so, wie er gebaut ist (Entscheid 23;
«Doku» in den Entscheiden zur Umsetzung der Spec).

- [x] `CONTEXT.md`, Abschnitt «Noas Geschichte»: neue Einträge **Kleiner Wagen** (das Sternbild aus sieben Sternen,
      an der Spitze der Deichsel der Polarstern; im Code `wagen`; _Vermeiden_: Sternzeichen, Planeten), **Stern einer
      Welt** und **Erwachen** (wann, was man sieht, wann ein Stern als wach gilt, «Von vorn»).
- [x] Bestehende Einträge anpassen, wo der Wagen sie berührt: Reise (Aufstieg zum Stern, Flug am nächsten vorbei),
      Einstieg in eine Welt, Träger, Wiederholen (kein Erwachen), Menü und Übersicht (nach der Wahl aus Ticket 02),
      Im Dorf (Wagen am Himmel).
- [x] Die Sprache des Glossars: kurz, Begriffe statt Code, so wie die übrigen Einträge.
- [x] `PLAN.md` 0.4 abhaken mit Verweis auf diese Spec; die Farben-Ebene bleibt dort als offene Idee stehen.
- [x] Kommentare im Code an den geänderten Stellen auf dem Stand (Geschichte, Reise, Finale, Bühne, Ladezeichen).
- [x] **Test der KI-Tester** nach der Änderung an `CONTEXT.md` laufen lassen (ihr Fingerabdruck hängt an der Doku,
      «Was Spass macht» gehört dazu); er muss grün sein.
- [x] Alle Tests grün; Review nach dem Ticket.

## Anhaltspunkte

- `tests/ki-tester.test.mjs`; Begriffe und Ton: bestehende Einträge in `CONTEXT.md`.

## Comments

**06.11.2026, Notiz des Umsetzers** (Worktree `kw-09`, Schnappschuss von Ticket 08 während dessen Abschluss; dessen
`index.html` liegt vor den Reviews 06/07, z. B. noch `ascend(elevation, star, stern)`)

Geändert:

- `CONTEXT.md`, «Noas Geschichte»: neu **Kleiner Wagen**, **Stern einer Welt**, **Erwachen** (nach «Welt», vor «Im
  Dorf»), beschrieben nach dem gebauten Stand (Comments 03–08): feste Stelle am Himmel, nur beim Hinaufschauen zu
  sehen (Entscheid des Nutzers zu Ticket 04), Tag/Nacht, Prolog 4, Wagen in Wagen, Glockentöne, Puls, Stand ohne
  eigenes Feld. Angepasst: Geschichte, Welt (je ein Satz), Menü (Reiter und Sternkarte, Knopf «Weiter/Fortsetzen/
  Beginnen/Übersicht», «Von vorn» des gewählten Grads), Im Dorf (Wagen am Himmel), Einstieg in eine Welt (am Stern
  vorbei), Reise (Aufstieg zum Stern, Erwachen, Vorbeiflug, Wagen bleibt stehen, Untertitel in der Mitte, Leiste am
  Rand), Träger, Übersicht (Sternhaufen, Liste je Haufen), Wiederholen (kein Erwachen). Nebenbei: «Hintergrund vorerst
  die Milchstrasse» bei Im Dorf und Welt war veraltet (seit 03.11. Skybox `village`), nachgeführt.
- `PLAN.md` 0.4: abgehakt, Verweis auf `.scratch/kleiner-wagen/`, kurz was gebaut ist; offen die Abnahme samt Ticket
  10 und die Farben-Ebene als Idee (Entscheid 3). Der alte Entwurf der Texte ist weg (steht in der Spec).
- `index.html`, nur Kommentare: Kopf «NOAS GESCHICHTE» (vor `STORY_UP`; Kapitelende mit Stern, Erwachen, Finale über
  die Deichsel statt «Punkt am Himmel … Ganz oben»), Kopf von `story.travel` (Untertitel in der Mitte, Leiste am Rand
  statt «Unten steht dazu»), Kopf von `story.makeFlare` (Lichtpunkt beim Stern der Welt, im Finale auf dem
  Polarstern). Bühne (`createStoryScene`, `BUEHNENWAGEN`), Finale, Einstieg (`enter`) und Ladezeichen waren schon auf
  dem Stand.

Geprüft (`LEISE_VORRANG=9 GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Node parallel): `ki-tester` (84,
Fingerabdruck Version 2 und W6 unverändert: Er liest nur «Was Spass macht», «Kernideen» und «Was Spass verdirbt», die
nicht berührt sind; also keine neue Version nötig), `geschichte` (35), `levelliste` (54), `logic` (2036), `hall` (6),
`vorrat` (18), `beurteilung` (206), `wuerfelliste` (20): alle grün. Keine Browserläufe (nur Kommentare).

Offen:

- Beim Zusammenführen mit 08 und den Reviews 06/07 die drei Kommentare in `index.html` prüfen (im Branch 960364b
  stehen dieselben alten Sätze, sie lassen sich dort gleich ersetzen).
- Nicht angefasst, Gebiet von 08: CSS-Kommentar über `.ueb-station` («wie die Stationen der Lichtwege»); das Menü der
  Lichtwege gibt es nicht mehr. Die Doku von `STORY_CHAPTERS` nennt `up` noch «Vulkan: über die Kraterwand»; der
  Aufstieg schaut seit 05 zum Stern, `up` gilt nur noch für den Blick nach der Landung.
- `PLAN.md` 0, «Offen, nicht Teil der Spec»: «Eigene Skybox für «Im Dorf» … vorerst die Milchstrasse» ist laut 1.2
  erledigt (`village`), dort noch offen; nicht Teil dieses Tickets.
- Menü- und Übersichtseintrag beschreiben den Stand von 08 im Schnappschuss; ändert 08 noch Bedienung oder Texte
  (z. B. Knopfnamen), die zwei Einträge nachziehen.
- Review (anderer Agent), dann Commit durch den Koordinator.

**06.11.2026, Review** (unabhängiger Reviewer, frischer Kontext; Hauptarbeitskopie = 50548cc mit den Änderungen von
09; Läufe über `LEISE_VORRANG=9 GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`)

Ergebnis: **bereit zum Commit.** Glossar, PLAN 0.4 und Kommentare beschreiben den Stand von 50548cc; die drei neuen
Einträge entsprechen Entscheid 23 und «Doku» der Spec, Ton und Länge wie «Im Dorf» oder «Menü». Die drei Kommentare in
`index.html` (Kopf «NOAS GESCHICHTE», `travel`, `makeFlare`) passen auch nach den Reviews 06/07/08. Gegen die Reviews
geprüft: `ascend(stern)` (06) ist im Code und kommt in Glossar und PLAN nicht als Code vor; Wagen in Wagen (07), Reiter
und Knopf, Sternhaufen mit einer Welt daneben und `lichtHoch()` auch im Dorf (08) standen nur zum Teil drin, nachgeführt.

Selbst behoben (klein):

- `CONTEXT.md`: **Menü** sagt jetzt, dass ein Reiter nur wählt und der Knopf (oder Enter auf dem Reiter) ausführt.
  **Übersicht**: die Liste steht neben dem Himmel (Handy hoch darunter), eine Welt zur Zeit; aus dem Menü öffnet sie der
  Knopf «Übersicht» eines geschafften Grads, nicht mehr «die Karte» (Karten gibt es nicht mehr). **Kleiner Wagen**: für
  Wagen in Wagen schaut die Kamera am Ende des Finales weiter. **Erwachen**: «Menü ohne Erwachen» mit dem Moment des
  Menüs abgeglichen (ein seither erwachter Stern blitzt nur auf). **Einstieg ins Dorf**: Untertitel in der Mitte, die
  Leiste darunter mit allen Zeichen blass (08). **Reise**: das Licht steht über dem Untertitel. Dazu Zeilen über
  120 Zeichen und abgebrochene Zeilen (Geschichte, Reise, Übersicht, Wiederholen) neu umbrochen.
- `PLAN.md` 0: «Eigene Skybox für «Im Dorf»» abgehakt (`village`, seit 03.11., siehe 1.2); «`.menue-aktion` auf kleinen
  Handys 8 px» als entfallen abgehakt (die Klasse gibt es seit dem Neubau des Menüs in Ticket 08 nicht mehr).
- `index.html`, nur Kommentare: `.ueb-station` (Zeichen der Welt im Kopf ihrer Liste statt «wie die Stationen der
  Lichtwege») und `.ueb-kacheln` (kein Lichtweg mehr hinter den Kacheln); Doku von `STORY_CHAPTERS` zu `up` (wie hoch
  man beim Ankommen und aus dem Menü in den Himmel schaut; der Aufstieg schaut zum Stern); `openMenu` («hinter der
  Sternkarte» statt «hinter den Wegen»); `enter` («Kapitel und Leiste» statt «Kapitel und Weg», Umbruch); Kopf von
  `finale` (Ende mit dem Wagen, wo die Bühne ihn zeigt, wenn nötig mit weiterem Sichtfeld; Wagen in Wagen).
- Stichprobe ohne Fund: `BUEHNENWAGEN`, `createStoryScene`, Ladezeichen, `STORY_FLUG`, `HIMMELSWAGEN`, `wagenBlick`,
  `wagenEnde`, `sichtfeld`, `lichtHoch`, `fillPath`, Köpfe von Menü und Übersicht. Die übrigen «Lichtwege» im Code sind
  Geschichte (Messungen früherer Tickets, überholte Bausteine), keine Beschreibung des Stands.

**KI-Tester:** Der Fingerabdruck liest aus `CONTEXT.md` nur «Was Spass macht», «Kernideen» und «Was Spass verdirbt»
(`glossary()` in `tools/ki-tester/protocol.mjs`); «Noas Geschichte» gehört nicht dazu. Keine neue Version nötig, der Test
ist grün (auch noch einmal auf dem Endstand des Glossars).

Läufe:

| Lauf | Ergebnis |
|---|---|
| Node: alle `tests/*.test.mjs` parallel, `generator.test` danach | grün (ki-tester 84, geschichte 35, generator 31, logic, levelliste, beurteilung, vorrat, wuerfelliste, hall) |
| `ki-tester.test.mjs` auf dem Endstand von `CONTEXT.md` | grün (84) |
| Probe ohne Argumente (Desktop, vier Grade) | bestanden, Konsole ohne Fehler |

Offen: keine Funde. Weitere Browserläufe nicht nötig (nur Kommentare in `index.html`). Zur Abnahme bleiben die Punkte
aus den Reviews 06–08 (in PLAN 0.4 unter «Abnahme» zusammengefasst).
