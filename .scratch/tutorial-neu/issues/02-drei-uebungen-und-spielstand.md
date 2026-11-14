# 02: Brechung, Farbenlehre, Mischung neu; Spielstand

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
- [ ] **Spielstand:** Ein laufendes Dorf aus der alten Zählung (ohne die Kennung der neuen, siehe Spec «Spielstände»)
      beginnt wieder bei Übung 1; ein beendetes oder übersprungenes Dorf bleibt, auch mit `platz` ≥ 4. Logiktest dazu.
- [ ] **Abhängigkeiten der 9 nachziehen:** `TUTORIAL_COUNT` ergibt sich aus `LEVELS`; prüfen, was an Indizes von `LEVELS`
      hängt (`tests/golden.json`, Klassik-Modus mit «Tutorial n / N», Übersicht, Logik- und Vorratstests), und anpassen.
- [ ] Dorf-Probe spielt jeden Schritt aller vier Übungen auf Desktop, Handy hoch, 360 × 640 und quer.

## Hinweise

- Der Test «Tutorial: führt alle Elementarten ein» in `tests/logic.test.mjs` verlangt Spiegel, festen Spiegel, Block,
  Prisma, Filter, Kombinator und eine farbige Quelle im Tutorial; die neue Auswahl muss das weiter erfüllen oder der
  Test wird bewusst angepasst. «Schritte: die Inhalte je Übung» nennt die neun alten Namen, «Umweg», «Schatten» und die
  Hinweise nebenbei in «Sperre» und «Brechung»; er wird neu geschrieben (Kamera und Neustart dann beide in «Brechung»).
- Der Speicherstand des Dorfs wird in `storyDorfStand` geprüft (`index.html`, etwa Zeile 22650). Achtung: Heute gilt
  dort ein `platz` ≥ `TUTORIAL_COUNT` als unlesbar, und der Stand wird gelöscht (etwa Zeile 24722). Ein altes gespieltes
  Dorf steht auf Platz 8 (`TUTORIAL_COUNT - 1`, so auch `?alles`); ohne Änderung ginge also gerade das beendete Dorf
  verloren.
- Neues Rot zuerst gegen `ec02954` (Stand vor dem Vorhaben) vergleichen.
