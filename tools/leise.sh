#!/bin/sh
# Startet einen Befehl so, dass er den Rechner nicht blockiert: in einem Job-Objekt mit harter CPU-Obergrenze
# (Vorgabe 20 % der ganzen Maschine, also gut 4 von 20 Kernen) und Priorität „Leerlauf“ (leise.ps1). Alle
# Unterprozesse (node → Chrome mit SwiftShader) bleiben im Job; Kernmaske und Priorität allein setzte Chrome zurück.
# Läufe warten aufeinander (Sperre /tmp/prisma-leise.lock), damit auch parallel arbeitende Agenten nie zwei schwere
# Läufe gleichzeitig starten; ein Aufruf innerhalb eines Laufs (LEISE_AKTIV) läuft direkt.
# leise.sh <befehl> [argumente …]   (Grenze ändern: LEISE_CPU=10 leise.sh …)
[ -n "$LEISE_AKTIV" ] && exec "$@"
# Obergrenze je Lauf: 65 % (Generator, Screenshots der KI-Tester). Weil Läufe nur nacheinander laufen, bleibt die Arbeit
# an Tickets so insgesamt unter der Grenze des Nutzers von 65 % (seit 17.10.2026).
[ "${LEISE_CPU:-20}" -le 65 ] 2>/dev/null || { echo "leise: LEISE_CPU=$LEISE_CPU ist über 65, Abbruch" >&2; exit 1; }
SPERRE=/tmp/prisma-leise.lock
WP=$(cat /proc/$$/winpid)
# Halter einer Sperre aus „pid winpid“; lebt er noch? (MSYS-PIDs kommen wieder vor, darum auch die winpid)
halter() { read -r h_pid h_wp 2>/dev/null < "$SPERRE/pid" || { h_pid=; h_wp=; }; }
lebt() { [ -n "$h_pid" ] && [ "$(cat "/proc/$h_pid/winpid" 2>/dev/null)" = "$h_wp" ]; }
alt() { [ -n "$(find "$1" -maxdepth 0 -mmin +1 2>/dev/null)" ]; }
# Verwaist: Halter tot, oder seit über einer Minute keine pid-Datei (Absturz zwischen mkdir und echo).
verwaist() { halter; if [ -n "$h_pid" ]; then ! lebt; else alt "$SPERRE"; fi; }
gemeldet=
until mkdir "$SPERRE" 2>/dev/null; do
  if verwaist; then
    alt "$SPERRE.uebernahme" && rm -rf "$SPERRE.uebernahme"
    # Übernahme selbst sperren und darin neu prüfen, sonst löscht ein Wartender die frische Sperre eines anderen.
    if mkdir "$SPERRE.uebernahme" 2>/dev/null; then
      verwaist && rm -rf "$SPERRE"
      rmdir "$SPERRE.uebernahme"
    fi
    continue
  fi
  [ -z "$gemeldet" ] && { echo "leise: warte auf laufenden Lauf (PID ${h_pid:-?})" >&2; gemeldet=1; }
  sleep 2
done
echo "$$ $WP" > "$SPERRE/pid"
trap 'halter; [ "$h_pid" = "$$" ] && rm -rf "$SPERRE"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
powershell -NoProfile -ExecutionPolicy Bypass -File "$(cygpath -w "$(dirname "$0")")\leise.ps1" -ProcessId "$WP" -Percent "${LEISE_CPU:-20}" || { echo "leise: Job nicht gesetzt, Abbruch" >&2; exit 1; }
LEISE_AKTIV=1 "$@"
