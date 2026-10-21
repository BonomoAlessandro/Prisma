# 06: Gruppe 5 (325 Level)

**What to build:** 35 neue Level aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je Grad (leicht /
mittel / schwer / sehr schwer): 5 / 20 / 7 / 3. Danach stehen 325 Level im Spiel: 58 / 170 / 68 / 29.

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 05

**Status:** in-progress

- [ ] 35 neue Level im Spiel, je Grad wie oben; Fehlmengen eines Grads sind begründet und für die nächste Gruppe
      vermerkt.
- [ ] Jedes neue Level hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee und ist
      keinem anderen Level zu ähnlich.
- [ ] Beide KI-Tester haben jedes neue Level beurteilt (Protokoll); von beiden abgelehnte sind ersetzt.
- [ ] Namen im bisherigen Stil vergeben, eindeutig, keiner von der Liste entfernter Level (ohne Freigabe des Nutzers).
- [ ] Herkunft jedes Levels (Auftrag, Seed, Ziel-Schwierigkeit) ist nachbaubar.
- [ ] Golden-Test-Referenz nachgeführt, alle Tests grün, Stichproben der Screenshots geprüft, auf main gemergt.

## Comments

## Comments

**Zwischenstand (22.10.2026):** Die erste Wahl lief über eine Stunde ohne Ergebnis. Zwei Ursachen, beide behoben:
- Fiel das Mittel je 10 Level schon vor den Zügen auf einer Seite (hier 181–190, oder die angefangene letzte Seite
  321–325), liess die Häufungsregel keinen einzigen Zug zu, und alle Häufungen blieben offen (18). Jetzt zählen nur
  volle Seiten, und ein Zug darf nur keine weitere Seite fallen lassen (`fallendeSeiten`).
- Laut Messung (CPU-Profil) ging über die Hälfte der Zeit in `haeufungen`, das je Probezug alle 33 Seiten neu zählte.
  Ein Zug ändert höchstens zwei Seiten; jetzt zählt es nur diese. Die Häufungsregel brauchte für 30 Schritte 24 statt
  253 s.
