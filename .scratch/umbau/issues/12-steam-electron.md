# 12: Steam mit Electron

**Spec:** ../spec.md

**Status:** needs-triage (vor Beginn ein eigenes Grilling)

**Blocked by:** 11

**What to build:** Prisma als Desktop-App mit Electron und `steamworks.js` (ADR 0011), für Windows und das Steam Deck
(Linux), aus demselben `dist/`. Einmaliger Kaufpreis. Spielstand als Datei über die Speicherschicht, mit Steam Cloud.

Grob, wird im Grilling ausgearbeitet:

- [ ] Electron einrichten, Builds für Windows und Linux.
- [ ] Speicherschicht für Electron (Datei im Benutzerordner), Steam Cloud.
- [ ] Fenster und Vollbild, Auflösungen, Maus und Tastatur, Controller aus Ticket 11.
- [ ] Steamworks: Konto (Steam Direct, 100 USD je Spiel), App-ID, Upload mit SteamPipe, Store-Seite, Wartezeit von
      mindestens 30 Tagen vor dem Erscheinen.
- [ ] Prüfung auf dem Steam Deck («Deck Verified»).

**Offen für das Grilling:** Preis, Steam-Erfolge ja/nein, Store-Seite (Texte, Bilder, Trailer), wer auf dem Deck testet,
Datum des Erscheinens.

## Comments
