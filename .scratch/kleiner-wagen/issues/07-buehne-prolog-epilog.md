# 07: Bühne von Prolog und Epilog, Überblendung Wagen in Wagen

**Spec:** ../spec.md

**Blocked by:** 06

**Status:** ready-for-agent

**What to build:** Der Kleine Wagen am Himmel der Bühne: im Prolog blass, im Epilog ganz wach; dazu die Überblendung
vom Finale in den Epilog von Wagen zu Wagen (Entscheide 8, 15; Ablauf 1, 6 und 7 der Spec).

- [ ] Der Wagen ist Teil des Himmels der Bühne, um ihren Polarstern, in der Form aus dem Wagen-Modul.
- [ ] **Prolog:** die sechs Sterne so blass wie die schwächsten Hintergrundsterne, ohne Funkeln, ohne Linien; der
      Polarstern hell wie heute.
- [ ] **Prolog 4** (Noas Strahl verblasst, «… der Kleine Wagen ist fast unsichtbar»): Die Linien zeichnen sich einmal
      für einen Atemzug ganz schwach ab und verlöschen wieder.
- [ ] **Epilog:** alle sieben Sterne hell, die Linien glimmen schwach nach; der Polarstern blinkt wie heute.
- [ ] **Überblendung Wagen in Wagen:** Der leuchtende Wagen am Ende des Finales geht ohne Sprung in den Wagen über dem
      Dorf über (heute Stern in Stern über `starAt`; auf den ganzen Wagen erweitern), in Desktop, Handy hoch und quer.
- [ ] Der ganze Wagen ist in Prolog 4 und im Epilog im Bild, auch im Hochformat; dafür darf die Kamera von Prolog 4
      im Hochformat leicht verschoben werden.
- [ ] Prolog und Epilog bleiben gleich lang wie heute.
- [ ] Nach den Regeln der Bühne (ADR 0007): in WebGL wie die übrigen Teile, Andeutung und Nachglimmen als kleine
      Animation nach der Zeit der Bühne, keine zusätzlichen Ruckler; Grafikspeicher auf dem Handy im Rahmen.
- [ ] Die Sprünge «Prolog» und «Epilog» im Sprungbrett zeigen die neuen Szenen.
- [ ] Messung der Bühne: Bildzeiten wie vorher (Desktop, Handy mit Pixeldichte des Poco), Bilder an jedem Ruhepunkt
      in Desktop, Handy hoch und quer und kleinem Handy; der Wagen ist darauf zu sehen.
- [ ] Probe: Übergang Finale → Epilog ohne Sprung (Bilder davor und danach), Bildzeiten.
- [ ] Alle Tests grün; Review nach dem Ticket.

## Anhaltspunkte im Code

- `createStoryScene` (Himmel mit Sternen und Polarstern als Teil `polar`, Aktionen `reach`, `blink`, `answer`,
  `starAt`), `STORY_PROLOG`/`STORY_EPILOG` (`cam`, `camP` für Hochformat).
- Messung: `tests/buehne-messung.mjs` (`messen`, `bilder`, `--epilog`, `--handy`).

## Comments
