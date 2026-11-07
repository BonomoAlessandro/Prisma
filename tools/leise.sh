#!/bin/sh
# Startet einen Befehl so, dass er den Rechner nicht blockiert: in einem Job-Objekt mit harter CPU-Obergrenze
# (Vorgabe 20 % der ganzen Maschine, also gut 4 von 20 Kernen) und Priorität „Leerlauf“ (leise.ps1). Alle
# Unterprozesse (node → Chrome mit SwiftShader) bleiben im Job; Kernmaske und Priorität allein setzte Chrome zurück.
# Läufe warten aufeinander (Sperre /tmp/prisma-leise.lock), damit auch parallel arbeitende Agenten nie zwei schwere
# Läufe gleichzeitig starten; ein Aufruf innerhalb eines Laufs (LEISE_AKTIV) läuft direkt. Warten mehrere, geht die
# kleinere Zahl LEISE_VORRANG vor (die Nummer des Tickets: das früher begonnene Ticket hat Vorrang; ohne Angabe 500).
# leise.sh <befehl> [argumente …]   (Grenze ändern: LEISE_CPU=10 leise.sh …; Vorrang: LEISE_VORRANG=5 leise.sh …)
[ -n "$LEISE_AKTIV" ] && exec "$@"
# Obergrenze je Lauf: 50 % (Generator, Screenshots der KI-Tester). Weil Läufe nur nacheinander laufen, bleibt die Arbeit
# an Tickets so insgesamt unter der Grenze des Nutzers von 70 %. Ein Rechner hebt sie lokal mit LEISE_MAX_CPU an
# (nicht versioniert, etwa in .claude/settings.local.json unter env); dieselbe Grenze prüfen Generator, Messskript
# und Screenshots (tools/deckel.mjs).
MAX=${LEISE_MAX_CPU:-50}
[ "${LEISE_CPU:-20}" -le "$MAX" ] 2>/dev/null || {
  echo "leise: LEISE_CPU=${LEISE_CPU:-20} muss eine ganze Zahl bis $MAX sein (Obergrenze LEISE_MAX_CPU, Standard 50)," \
    "Abbruch" >&2; exit 1; }
SPERRE=/tmp/prisma-leise.lock
WP=$(cat /proc/$$/winpid)
# Halter einer Sperre aus „pid winpid“; lebt er noch? (MSYS-PIDs kommen wieder vor, darum auch die winpid)
halter() { read -r h_pid h_wp 2>/dev/null < "$SPERRE/pid" || { h_pid=; h_wp=; }; }
lebt() { [ -n "$h_pid" ] && [ "$(cat "/proc/$h_pid/winpid" 2>/dev/null)" = "$h_wp" ]; }
alt() { [ -n "$(find "$1" -maxdepth 0 -mmin +1 2>/dev/null)" ]; }
# Verwaist: Halter tot, oder seit über einer Minute keine pid-Datei (Absturz zwischen mkdir und echo).
verwaist() { halter; if [ -n "$h_pid" ]; then ! lebt; else alt "$SPERRE"; fi; }
# Wartende melden sich in $WARTE als „<vorrang>.<pid>“ mit „pid winpid“; wer eine kleinere Zahl lebend vor sich
# sieht, lässt ihm die Sperre. Marken toter Wartender werden weggeräumt.
VORRANG=${LEISE_VORRANG:-500}
[ "$VORRANG" -ge 0 ] 2>/dev/null || { echo "leise: LEISE_VORRANG=$VORRANG muss eine ganze Zahl sein, Abbruch" >&2; exit 1; }
WARTE=/tmp/prisma-leise.warte
mkdir -p "$WARTE"
MARKE="$WARTE/$VORRANG.$$"
echo "$$ $WP" > "$MARKE"
trap 'rm -f "$MARKE"' EXIT
vortritt() {
  for m in "$WARTE"/*.*; do
    [ -f "$m" ] && [ "$m" != "$MARKE" ] || continue
    n=${m##*/}; n=${n%%.*}
    [ "$n" -lt "$VORRANG" ] 2>/dev/null || continue
    read -r h_pid h_wp 2>/dev/null < "$m" || continue
    if lebt; then v_pid=$h_pid; return 0; fi
    rm -f "$m"
  done
  return 1
}
gemeldet=
until ! vortritt && mkdir "$SPERRE" 2>/dev/null; do
  if [ -n "$v_pid" ]; then
    [ -z "$gemeldet" ] && { echo "leise: lasse Lauf mit Vorrang vor (PID $v_pid)" >&2; gemeldet=1; }
    v_pid=; sleep 2; continue
  fi
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
rm -f "$MARKE"
trap 'halter; [ "$h_pid" = "$$" ] && rm -rf "$SPERRE"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
powershell -NoProfile -ExecutionPolicy Bypass -File "$(cygpath -w "$(dirname "$0")")\leise.ps1" -ProcessId "$WP" -Percent "${LEISE_CPU:-20}" || { echo "leise: Job nicht gesetzt, Abbruch" >&2; exit 1; }
LEISE_AKTIV=1 "$@"
