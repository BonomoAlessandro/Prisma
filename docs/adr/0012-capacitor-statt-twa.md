# Android mit Capacitor statt als Trusted Web Activity

Entschieden vom Nutzer am 15.11.2026 (Grilling «Umbau für die Stores», `.scratch/umbau/spec.md`). Ändert den Weg in
PLAN 4, der bis dahin eine Trusted Web Activity (TWA) mit Bubblewrap oder PWABuilder vorsah.

## Kontext

Eine TWA lädt das Spiel von einer festen Web-Adresse. Sie braucht dafür `assetlinks.json` auf der Website, der erste
Start braucht Internet, und Käufe in der App gehen nur über die «Digital Goods API». Auf Android soll später eine
Vollversion gekauft werden können.

## Entscheid

Die Android-App wird mit Capacitor gebaut. Das Spiel aus `dist/` liegt in der App.

## Folgen

- Die App läuft vom ersten Start an offline und hängt nicht von der Web-Adresse ab.
- Für Käufe in der App gibt es fertige Erweiterungen, wenn die Vollversion kommt.
- `assetlinks.json` (PLAN 4.5) entfällt. Die feste Adresse (PLAN 4.1) braucht es nur noch für die Browser-Fassung.
- Ein Spielstand aus der Browser-Fassung geht nicht in die App über; jede Plattform hat ihren eigenen.
- Updates der App gehen über den Play Store, nicht mehr über das Neuladen der Website.
