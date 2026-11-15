# Spec: Energie auf dem Handy

Status: ready-for-agent

Wunsch des Nutzers (15.11.2026): Das Spiel soll auf dem Smartphone weniger Akku brauchen, so weit wie möglich, ohne
dass Gefühl oder Ansicht für den Spieler schlechter werden. Branch `feature/energie` von `main` (966c75a).

## Messung auf dem Poco (15.11.2026)

Gemessen über kabelloses Debugging. Erlaubt sind: der Prisma-Chrome über CDP, dazu nur lesend `dumpsys battery`,
`batterystats`, `gfxinfo` und `thermalservice`.

**Ladezähler** (`dumpsys battery`, Schritte von etwa 1 % ≈ 14 mAh bei zwei Zellen, ≈ 8,2 V): je Fassung 12 min,
Ungenauigkeit etwa ±25 %.

| Fassung | Bilder/s | Strom | Leistung |
|---|---|---|---|
| Level heute, Kamera schwebt, keine Eingabe | 60 | 430–460 mA | ≈ 3,6 W |
| Level ohne Spiegelung, Bloom, Pinsel | 60 | 250–285 mA | ≈ 2,2 W |
| Level `?takt=30` | 30 | 170–215 mA | ≈ 1,6 W |
| Menü (Blick im Himmel) | 10 | 140–150 mA | ≈ 1,2 W |

Die Grundlast mit stehendem Bild war nicht verwertbar: Sie lief als erste Fassung direkt nach schweren
Trace-Messungen, und die Anzeige des Akkus glättet nach.

**CPU-Zeit aus dem Chrome-Trace:** Sie taugt nicht als Mass für Energie. Das Handy senkt bei weniger Last den Takt
der Kerne, dieselbe Arbeit dauert dann länger.

**Schluss:** Der grösste Hebel ist die Bildrate im Level, auch wenn der Spieler nur überlegt. Die Effekte machen etwa
ein Drittel aus.

## Ticket 01: Ruhe-Bildrate (Schalter `?ruhetakt=<n>`)

Siehe `issues/01-ruhe-bildrate.md`.

## Bekannt rot (Vorhaben Energie)

- `geschichte-probe --uebersicht`: in jedem Lauf eine einzelne Lücke von 120–230 ms an wechselnden Stellen («Spiel →
  Übersicht», «letztes Level → Übersicht», «Übersicht → Spiel», «Menü → Übersicht»); auf d732d27 ebenso (Review
  Ticket 04).
- Wie zuvor: Himmelswechsel («Übersicht → Übung 3 wiederholen»), Wald, «Angebot steht», «Prolog → Überspringen».
