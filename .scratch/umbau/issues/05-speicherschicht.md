# 05: Speicherschicht

**Spec:** ../spec.md

**Status:** needs-triage

**Blocked by:** 04

**What to build:** Aller Zugriff auf den Spielstand läuft über ein Modul, die Speicherschicht. Heute steckt dahinter
`localStorage`. Später kann jede Plattform eine eigene Umsetzung einsetzen (Capacitor, Electron mit einer Datei für
Steam Cloud), ohne dass sich das Spiel ändert.

- [ ] Ein Modul mit einer kleinen Schnittstelle (lesen, schreiben, löschen je Schlüssel) und einer Umsetzung für
      `localStorage`. Die Plattform wählt die Umsetzung beim Start; in diesem Ticket gibt es nur die eine.
- [ ] Kein anderer Teil des Codes greift mehr direkt auf `localStorage` zu (ein Test prüft das im Quelltext).
- [ ] **Schlüssel und Format bleiben gleich** (z. B. `prisma.noa.<grad>`, `prisma.noa.<grad>.bestwerte`,
      `prisma.noa.zuletzt`). Ein Spielstand von heute wird ohne Umrechnung weiter gelesen. Ein Test lädt einen heutigen
      Spielstand und prüft, dass Fortschritt, Bestwerte und Einstellungen erhalten bleiben.
- [ ] Schlägt das Speichern fehl (privater Modus, voller Speicher), läuft das Spiel weiter wie heute.
- [ ] Bildvergleich, Golden, alle Tests und Proben grün.
- [ ] Begriff «Speicherschicht» in `CONTEXT.md`.

## Hinweise

- Keine Vorbereitung für die Vollversion zum Kaufen (Spec, «Geld»).
- Alle heutigen Zugriffe finden: `grep -n localStorage src/ index.html`.

## Comments
