# 06: Gruppe 5 (325 Level)

**What to build:** 35 neue Level aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je Grad (leicht /
mittel / schwer / sehr schwer): 5 / 20 / 7 / 3. Danach stehen 325 Level im Spiel: 58 / 170 / 68 / 29.

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 05

**Status:** done

- [x] 35 neue Level im Spiel, je Grad wie oben; Fehlmengen eines Grads sind begründet und für die nächste Gruppe
      vermerkt.
- [x] Jedes neue Level hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee und ist
      keinem anderen Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt (Protokoll); von beiden abgelehnte sind ersetzt.
- [x] Namen im bisherigen Stil vergeben, eindeutig, keiner von der Liste entfernter Level (ohne Freigabe des Nutzers).
- [x] Herkunft jedes Levels (Auftrag, Seed, Ziel-Schwierigkeit) ist nachbaubar.
- [x] Golden-Test-Referenz nachgeführt, alle Tests grün, Stichproben der Screenshots geprüft, auf main gemergt.

## Comments

## Comments

**Zwischenstand (22.10.2026):** Die erste Wahl lief über eine Stunde ohne Ergebnis. Zwei Ursachen, beide behoben:
- Fiel das Mittel je 10 Level schon vor den Zügen auf einer Seite (hier 181–190, oder die angefangene letzte Seite
  321–325), liess die Häufungsregel keinen einzigen Zug zu, und alle Häufungen blieben offen (18). Jetzt zählen nur
  volle Seiten, und ein Zug darf nur keine weitere Seite fallen lassen (`fallendeSeiten`).
- Laut Messung (CPU-Profil) ging über die Hälfte der Zeit in `haeufungen`, das je Probezug alle 33 Seiten neu zählte.
  Ein Zug ändert höchstens zwei Seiten; jetzt zählt es nur diese. Die Häufungsregel brauchte für 30 Schritte 24 statt
  253 s.

**Runde `ausbau-5` (Wahl, 15 Minuten nach der Beschleunigung):** keine Wahl ohne Fehler. Überall offen: Plätze
251–260, 3-mal „Mischziel aus zwei Quellen“ (Oase, Wetterleuchten, Achterbahn, alle aus dem Bestand). Auf 231–280
stehen 10 Level mit dieser Haupt-Kernidee, genau so viele, wie fünf Seiten fassen; jeder einzelne Zug schafft eine
neue Häufung auf einer Nachbarseite. **Entscheid (selbst):** wie in Gruppe 3 `--verschiebe mittel:-2,schwer:2`, damit
mehr schwere Level anderer Haupt-Kernidee in diesen Bereich kommen; Gruppe 6 gleicht aus.

**Weitere Runden:** `ausbau-5-2` (13 beurteilt, keines abgelehnt oder schwach; drei Korrekturen öffneten Häufungen),
`ausbau-5-3` (3; zwei Korrekturen −5 öffneten Häufungen auf 281–290 und 301–310), nur beurteilte (`ausbau-5-4`) ohne
Wahl, Kandidat e0a5b164 dann ausgeschlossen (seine Korrektur schob ihn in die Häufung 301–310), `ausbau-5-5` offen auf
281–290 (Gratwanderung, Nadelöhr, Hafeneinfahrt; Nachbarseiten mit je 2 „Sammelstelle“ voll). **Entscheid (selbst):**
`--verschiebe mittel:-3,schwer:3`. `ausbau-5-6`: 4 beurteilt, Kandidat 849fc21b (sehr schwer) von beiden abgelehnt
(Scheinmischung), ersetzt.

**Vorrat (Frage des Nutzers, ob die Pools grösser sein sollten):** Der Pool ungeprüfter Kandidaten reicht (Tausende);
es fehlten beurteilte Kandidaten oben in „schwer“ und in „sehr schwer“, deren Korrekturen die Wahl schon kennt. Lauf
`ausbau-v-oben`: 40 Kandidaten (26 schwer ab Schwierigkeit 75, 14 sehr schwer, reihum über die Haupt-Kernideen),
keiner abgelehnt, keiner schwach. Danach fand die Wahl nur über beurteilte Kandidaten (`ausbau-5-7`) gleich beim ersten
Startwert eine Wahl ohne Fehler. Nutzer (22.10.2026): Pools auch für die folgenden Tickets gross genug halten, von Fall
zu Fall.

**Ergebnis (22.10.2026, Branch `ausbau/06-gruppe-5`)**

- **Im Spiel:** 325 Level, 58 / 167 / 71 / 29 statt 58 / 170 / 68 / 29 (bewusst `mittel:-3,schwer:3`, siehe oben;
  Gruppe 6 gleicht aus).
- **Neu:** Kiesel, Wasserfarbe, Buntstift, Farbstift, Kreidestrich (leicht); Bolero, Reigen, Kreistanz, Pirouette,
  Drehung, Wirbel, Spirale, Schnecke, Muschel, Seestern, Koralle, Perle, Lagune, Brandung, Gezeitenkreis, Ebbe, Flut
  (mittel); Windjammer, Dreimaster, Segeltörn, Kaperfahrt, Flaschenpost, Schatztruhe, Geheimgang, Falltür, Zugbrücke,
  Burggraben (schwer); Kapella, Prokyon, Antares (sehr schwer).
- **KI-Tester:** alle 35 beurteilt (Läufe `ausbau-5-2`, `-5-3`, `-5-6`, `ausbau-v-oben` und frühere), abgelehnte und
  schwache nicht im Spiel.
- **Werkzeug:** Mittel je 10 Level nur über volle Seiten, ein Verstoss sperrt nicht jeden Zug (`fallendeSeiten`);
  Häufungsregel zählt je Probezug nur die geänderten Seiten (Wahl rund 15 statt über 60 Minuten).
- **Tests:** Logik 1073, Levelliste 53, KI-Tester 65, Golden 334 (nach `--write`), Beurteilung 178, alle grün.
  Stichprobe: Spirale (147, Handy) und Zugbrücke (283, Desktop), ohne Befund.
