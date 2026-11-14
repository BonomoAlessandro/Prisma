# 02: Brechung, Farbenlehre, Mischung neu; kein Stand im Dorf

**Spec:** ../spec.md

**Blocked by:** 01 und das Okay des Nutzers nach seinem Poco-Test

**Status:** needs-triage (wird ready-for-agent mit dem Okay zu 01)

**What to build:** Das Dorf hat danach genau vier Übungen auf neuen Brettern. Die alten Übungen Umweg, Sperre,
Schatten, Farbiges Licht und Treffpunkt sowie die alten Bretter von Brechung, Farbenlehre und Mischung sind weg.

- [ ] **Brechung:** Blöcke schlucken Licht, das Prisma fächert auf; nebenbei Kamera und Neustart. Höchstens 4 Schritte.
- [ ] **Farbenlehre:** der Filter, farbige Quellen und der Ring am Ziel. Höchstens 4 Schritte.
- [ ] **Mischung:** Mischen am Ziel, dann der Kombinator. Höchstens 4 Schritte.
- [ ] Jedes Brett eindeutig lösbar (Löser), auf dem Handy quer nicht eng; der letzte Schritt führt zur Lösung, kein
      Schritt kann wegen der Sperre in eine Sackgasse führen.
- [ ] **Kein Stand im Dorf** (Spec «Kein Stand im Dorf»): `platz` im Dorf-Stand fällt weg; wer das Dorf startet oder
      mitten im Dorf neu lädt, beginnt bei Übung 1. Gespeichert bleibt nur `ende`; ein beendetes oder übersprungenes
      Dorf bleibt beendet, auch aus alten Ständen mit `platz` bis 8. Logiktest dazu; was heute `dorf.platz` prüft,
      umstellen (`tests/levelliste.test.mjs` etwa Zeile 917–930, `tests/geschichte-probe.mjs` etwa Zeile 2088–2160
      mit «Neuladen → Übung 4», dazu etwa 2327 und 2362–2397).
- [ ] **Abhängigkeiten der 9 nachziehen:** `TUTORIAL_COUNT` ergibt sich aus `LEVELS`; prüfen, was an Indizes von `LEVELS`
      hängt (`tests/golden.json`, Klassik-Modus mit «Tutorial n / N», Übersicht, Logik- und Vorratstests), und anpassen.
- [ ] Dorf-Probe spielt jeden Schritt aller vier Übungen auf Desktop, Handy hoch, 360 × 640 und quer.

## Hinweise

- Der Test «Tutorial: führt alle Elementarten ein» in `tests/logic.test.mjs` verlangt Spiegel, festen Spiegel, Block,
  Prisma, Filter, Kombinator und eine farbige Quelle im Tutorial; die neue Auswahl muss das weiter erfüllen oder der
  Test wird bewusst angepasst. «Schritte: die Inhalte je Übung» nennt die neun alten Namen, «Umweg», «Schatten» und die
  Hinweise nebenbei in «Sperre» und «Brechung»; er wird neu geschrieben (Kamera und Neustart dann beide in «Brechung»).
- Der Speicherstand des Dorfs wird in `storyDorfStand` geprüft (`index.html`, etwa Zeile 22650). Achtung: Heute gilt
  dort ein Stand ohne ganzzahliges `platz` oder mit `platz` ≥ `TUTORIAL_COUNT` als unlesbar, und `setGrade` löscht ihn
  (etwa Zeile 24722–24724). Ein altes gespieltes Dorf steht auf Platz 8 (`TUTORIAL_COUNT - 1`, so auch `?alles`, etwa
  Zeile 24630); ohne Änderung ginge also gerade das beendete Dorf verloren, und ein neuer Stand ohne `platz` ebenso.
- `dorf.platz` wird gelesen in `firstIndex` (etwa Zeile 24731) und `begin` (etwa Zeile 25077: läuft das Dorf, beginnt
  es bei dieser Übung) und geschrieben in `save` (etwa Zeile 24750). Ohne `platz` muss `begin` bei Index 0 beginnen.
  «Innerhalb einer Sitzung behalten Menü und Übersicht die Übung» gilt heute über `resume` (`choose`, `playDorf`: das
  Brett steht noch). Wo `choose` nicht fortsetzt, ruft es `setGrade` auf (setzt `inDorf` zurück, lädt den Stand neu),
  dann `begin`: ohne gespeicherten Platz also Übung 1, z. B. nach einem Wechsel in einen anderen Grad und zurück. Das
  passt zu «jeder Start bei Übung 1»; nur darf `begin` nicht auf ein fehlendes `platz` stossen.
- Die Übersicht (`baueReihen`, etwa Zeile 21782) richtet sich nicht nach `platz`, sondern nach `geloest`: Die erste
  ungelöste Übung ist «offen». `geloest` bleibt gespeichert. Nach dem Neuladen mitten im Dorf beginnt «Weiter» also bei
  Übung 1, die Übersicht zeigt aber die gelösten Übungen als gelöst und die nächste als offen; wer sie dort wählt,
  spielt ab ihr im normalen Ablauf weiter (`playDorf`, `advanceDorf`). Das bleibt so, ausser der Nutzer entscheidet
  anders.
- Neues Rot zuerst gegen `ec02954` (Stand vor dem Vorhaben) vergleichen.
