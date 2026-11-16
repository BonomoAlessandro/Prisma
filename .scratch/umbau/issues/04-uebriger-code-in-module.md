# 04: Übriger Code in Module, TypeScript einführen

**Spec:** ../spec.md

**Status:** needs-triage

**Blocked by:** 03

**What to build:** Der restliche Code aus `index.html` wird in Module unter `src/` aufgeteilt, entlang der Teile des
Spiels. Am Ende ist `index.html` nur noch das Gerüst der Seite (Markup, Einstieg), und kein Teil des Spiels ist mehr
als ein grosser Block in ihr. TypeScript ist eingerichtet und wird für neue und herausgelöste Module benutzt. Verhalten
und Aussehen bleiben genau gleich.

- [ ] `tsconfig.json` mit `allowJs`; `npm run typecheck` (`tsc --noEmit`) läuft ohne Fehler und gehört zu den Prüfungen.
- [ ] Aufteilen in sinnvolle Teile, ungefähr: Szene und Grafik (Three.js, Himmel, Bloom), Brett und Elemente, Eingabe
      (Maus, Finger, Mausrad), Führung im Dorf, Geschichte und Bühne, Ton, Oberfläche (Menü, Übersicht, Kopfzeile,
      Einstellungen), Leistungsanzeige. Die genaue Aufteilung legt der Umsetzer fest und begründet sie unter
      «Comments».
- [ ] CSS aus `index.html` in eigene Dateien.
- [ ] **In mehreren Schritten**, jeder ein eigener Commit. Nach jedem Schritt sind Bildvergleich, Golden, alle Tests und
      Proben grün. Ein Schritt, der rot wird, wird korrigiert oder zurückgenommen, bevor es weitergeht.
- [ ] Globale Variablen, über die die Teile heute miteinander reden, werden zu Importen und Exporten. Wo das ohne
      Verhaltensänderung nicht geht, bleiben sie vorerst und werden unter «Comments» aufgelistet.
- [ ] `window.__prismaDebug` und alle Schalter in der URL (`?noadapt`, `?nointro`, `?sky=`, `?t=`, `?perf`, `?takt=`
      …) funktionieren weiter, die Proben brauchen sie.
- [ ] README: Aufbau des Codes kurz beschreiben (welcher Teil wo liegt).
- [ ] Die KI-Tester (`tools/ki-tester/shots.mjs`, `prepare.mjs`) öffnen das Spiel über `tools/spielserver.mjs` statt
      über file://; mit Modulen geht file:// nicht mehr (offen aus Ticket 02).
- [ ] Kleinigkeit aus Review 02: Kommentar zu `writeRegistry` in `tools/blender/pack.mjs` nennt noch `importScripts`.

## Hinweise

- Das ist das grösste Ticket. Der Umsetzer darf es beim Start in Teiltickets (04a, 04b …) aufteilen, wenn das die
  Schritte klarer macht.
- Die Marker `LEVELS`, `WUERFEL` und `GESCHICHTE` bleiben bis Ticket 06 erhalten, damit die Werkzeuge weiter schreiben können.

## Comments
