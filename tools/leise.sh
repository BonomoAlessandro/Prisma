#!/bin/sh
# Startet einen Befehl so, dass er den Rechner nicht blockiert: in einem Job-Objekt mit harter CPU-Obergrenze
# (Vorgabe 20 % der ganzen Maschine, also gut 4 von 20 Kernen) und Priorität „Leerlauf“ (leise.ps1). Alle
# Unterprozesse (node → Chrome mit SwiftShader) bleiben im Job; Kernmaske und Priorität allein setzte Chrome zurück.
# leise.sh <befehl> [argumente …]   (Grenze ändern: LEISE_CPU=10 leise.sh …)
WP=$(cat /proc/$$/winpid)
powershell -NoProfile -ExecutionPolicy Bypass -File "$(cygpath -w "$(dirname "$0")")\\leise.ps1" -ProcessId "$WP" -Percent "${LEISE_CPU:-20}" || { echo "leise: Job nicht gesetzt, Abbruch" >&2; exit 1; }
"$@"
