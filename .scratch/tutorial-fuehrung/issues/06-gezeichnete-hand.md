# 06: Gezeichnete Hand

**Spec:** ../spec.md

**Blocked by:** 05

**Status:** ready-for-agent

**What to build:** Die Hand der Führung neu zeichnen. Der Nutzer (10.11.2026): «Die hände die erscheinen um zu zeigen
wo geklickt werden soll, soll noch angepast werden. Ich bin mit dem look noch nicht zufrieden». Aus fünf Varianten
(A heute, B gezeichnete Hand, C Hand aus Licht, D Lichtpunkt, E Schattenriss) wählte er **B**: «B die gezichnete hand
ist super».

- [x] Zeigehand statt des einzelnen Fingers: ausgestreckter Zeigefinger, eingerollte Finger, Daumen, goldener Ärmel;
      weiss mit dunkler Kontur aussen, Schatten darunter. Kuppe bleibt an derselben Stelle (FUEHRUNG.kuppe).
- [x] Tippen wie bisher; beim langen Drücken drückt die Hand jetzt auch, solange sich der Ring füllt.
- [x] Rechtsklick (Maus) unverändert.
- [x] `APP_VERSION` `2026-11-10 tutorial-fuehrung-4`.

## Comments

**Review (10.11.2026), Commit 5effe8c:** keine Funde, nichts geändert.

- Markup und CSS: Die Hand wird per `innerHTML` im `<svg>` gebaut, also im SVG-Namensraum; Kontur (Strich 3,2 unter
  derselben Form) und Fläche je aus derselben Liste. `fz-tipp` und `fz-halt` skalieren um die Kuppe (Ursprung der
  Gruppe, wie beim alten Finger); `fz-halt` drückt (12–70 %), während sich der Ring füllt (15–60 %). Mit
  prefers-reduced-motion steht die Hand mit der Kuppe am Element. Rechtsklick unverändert (nur die gemeinsame
  Deckkraft 0,9 der alten `.fz-hand` fällt weg, kaum sichtbar). Keine Reste der alten Regel `.fz-finger { fill … }`.
- Bilder im Spiel (Probe mit vorübergehend eingefügten Aufnahmen, wieder entfernt): Poco 412 × 915, DPR 2,625, alle
  20 Schritte mit Hand, Desktop 1440 × 900. Hand ganz sichtbar, Kuppe am Element, nirgends von Kopfzeile oder Rand
  abgeschnitten; am knappsten «Mischung» Schritt 3 (Kombinator in der rechten Spalte), dort noch ganz im Bild.
  Langes Drücken in «Umweg» Schritt 3: Hand drückt im Ring. Rechtsklick am Desktop: Maus wie bisher.
- Tests: `logic.test.mjs` 2064 bestanden, `vorrat.test.mjs` 18 bestanden. Dorf-Probe Desktop und `--handy` (390 × 844)
  je 29 gespielte Schritte, je 1 Fehler, nur der bekannte: Bildlücke «Sehr schwer: Übersicht → Übung 8 wiederholen»
  (405 bzw. 281 ms). Dazu zwei Läufe mit Aufnahmen (Poco, Desktop), gleiches Bild (317 bzw. 403 ms).
