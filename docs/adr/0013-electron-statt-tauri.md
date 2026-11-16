# Steam mit Electron statt Tauri

Entschieden vom Nutzer am 15.11.2026 (Grilling «Umbau für die Stores», `.scratch/umbau/spec.md`). Legt den in PLAN 5
offenen Weg fest.

## Kontext

Für Steam braucht die Web-App eine Desktop-Hülle. Zur Wahl standen Electron und Tauri. Prisma soll auf Windows und dem
Steam Deck laufen. Das Deck läuft unter Linux.

## Entscheid

Die Steam-Fassung wird mit Electron gebaut, Steam-Funktionen kommen über `steamworks.js`.

## Folgen

- Electron bringt seinen eigenen Chromium mit. WebGL verhält sich auf Windows und dem Deck gleich wie im Chrome, in dem
  das Spiel heute entwickelt und geprüft wird. Tauri nutzt die Web-Ansicht des Systems, unter Linux WebKitGTK mit
  spürbar schwächerem WebGL.
- Die App wird rund 100 MB grösser als mit Tauri. Für ein Spiel auf Steam ist das unerheblich.
- Steam Cloud, Erfolge und Overlay sind über `steamworks.js` erreichbar.
