#!/bin/sh
# Startet einen Befehl so, dass er den Rechner nicht blockiert: in einem Job-Objekt mit harter CPU-Obergrenze
# (Vorgabe 20 % der ganzen Maschine, also gut 4 von 20 Kernen) und Priorität „Leerlauf“ (leise.ps1). Alle
# Unterprozesse (node → Chrome mit SwiftShader) bleiben im Job; Kernmaske und Priorität allein setzte Chrome zurück.
# leise.sh <befehl> [argumente …]   (Grenze ändern: LEISE_CPU=10 leise.sh …; Vorrang: LEISE_VORRANG=5 leise.sh …)
#
# Zwei Arten von Läufen (LEISE_ART, Ticket 13 von .scratch/umbau/; welcher Lauf welche Art ist: README, Abschnitt Tests):
# - allein (Vorgabe): Läufe mit Bildzeiten oder Messungen. Sie halten die Sperre /tmp/prisma-leise.lock allein, wie bis
#   Ticket 13: Ein alleiniger Lauf startet erst, wenn kein anderer Lauf mehr läuft, und solange er läuft, startet keiner.
#   Warten mehrere, geht die kleinere Zahl LEISE_VORRANG vor (die Nummer des Tickets: das früher begonnene Ticket hat
#   Vorrang; ohne Angabe 500). Wartende melden sich in /tmp/prisma-leise.warte als „<vorrang>.<pid>“.
# - leicht (LEISE_ART=leicht): Läufe ohne Messung von Zeiten (Bildvergleich, Golden, Node-Tests, Proben ohne Bildtakt,
#   Werkzeuge). Bis zu LEISE_LEICHT_MAX (Vorgabe 4) laufen gleichzeitig. Sie halten die Sperre gemeinsam: Der erste legt
#   sie an (mit der Datei „art“), jeder trägt sich darin als „leicht.<pid>“ ein, in „pid“ steht immer ein lebender von
#   ihnen, der letzte räumt sie weg. So wartet jeder alleinige Lauf auf sie, auch eine ältere Kopie dieses Skripts, die
#   von leichten Läufen nichts weiss (ein Lauf der alten Kopie zählt als alleiniger). Ein leichter Lauf startet nicht,
#   solange ein alleiniger wartet, dessen Vorrang gleich oder kleiner ist; einer mit grösserer Zahl wird höchstens
#   LEISE_FRIST Minuten (Vorgabe 10) überholt, danach startet kein leichter mehr, bis er gelaufen ist. Wartende leichte
#   Läufe tragen sich nirgends ein (ein alleiniger kommt vor ihnen dran, sobald die Sperre frei ist).
# Ein Aufruf innerhalb eines Laufs (LEISE_AKTIV) läuft direkt. Eine verwaiste Sperre (Halter tot und kein lebender
# leichter Lauf darin, oder über eine Minute ohne pid-Datei) wird übernommen. Zum Prüfen dieses Skripts ohne die echte
# Sperre: LEISE_SPERRE und LEISE_WARTE auf eigene Pfade (tests/leise.test.mjs).
[ -n "$LEISE_AKTIV" ] && exec "$@"
# Obergrenze je Lauf: 50 % (Generator, Screenshots der KI-Tester). Ein Rechner hebt sie lokal mit LEISE_MAX_CPU an
# (nicht versioniert, etwa in .claude/settings.local.json unter env); dieselbe Grenze prüfen Generator, Messskript
# und Screenshots (tools/deckel.mjs).
MAX=${LEISE_MAX_CPU:-50}
[ "${LEISE_CPU:-20}" -le "$MAX" ] 2>/dev/null || {
  echo "leise: LEISE_CPU=${LEISE_CPU:-20} muss eine ganze Zahl bis $MAX sein (Obergrenze LEISE_MAX_CPU, Standard 50)," \
    "Abbruch" >&2; exit 1; }
ART=${LEISE_ART:-allein}
case $ART in allein|leicht) ;; *) echo "leise: LEISE_ART=$ART muss allein oder leicht sein, Abbruch" >&2; exit 1 ;; esac
LMAX=${LEISE_LEICHT_MAX:-4}
[ "$LMAX" -ge 1 ] 2>/dev/null || { echo "leise: LEISE_LEICHT_MAX=$LMAX muss eine ganze Zahl ab 1 sein, Abbruch" >&2; exit 1; }
FRIST=${LEISE_FRIST:-10}
[ "$FRIST" -ge 0 ] 2>/dev/null || { echo "leise: LEISE_FRIST=$FRIST muss eine ganze Zahl sein (Minuten), Abbruch" >&2; exit 1; }
SPERRE=${LEISE_SPERRE:-/tmp/prisma-leise.lock}
WARTE=${LEISE_WARTE:-/tmp/prisma-leise.warte}
WP=$(cat /proc/$$/winpid)
# Halter einer Sperre aus „pid winpid“; lebt er noch? (MSYS-PIDs kommen wieder vor, darum auch die winpid)
halter() { read -r h_pid h_wp 2>/dev/null < "$SPERRE/pid" || { h_pid=; h_wp=; }; }
lebt() { [ -n "$h_pid" ] && [ "$(cat "/proc/$h_pid/winpid" 2>/dev/null)" = "$h_wp" ]; }
alt() { [ -n "$(find "$1" -maxdepth 0 -mmin +1 2>/dev/null)" ]; }
# Leichte Läufe in der Sperre: Zahl der lebenden (l_n) und einer von ihnen ausser diesem Lauf (l_pid l_wp). raeumen:
# die Einträge toter leichter Läufe löschen (nur unter der Sperre der Gruppe).
lebende() {
  l_n=0; l_pid=; l_wp=
  for f in "$SPERRE"/leicht.*; do
    [ -f "$f" ] || continue
    read -r h_pid h_wp 2>/dev/null < "$f" || continue
    if lebt; then
      l_n=$((l_n + 1)); [ "$h_pid" != "$$" ] && { l_pid=$h_pid; l_wp=$h_wp; }
    elif [ "$1" = raeumen ]; then rm -f "$f"
    fi
  done
}
# Verwaist: Halter tot und kein lebender leichter Lauf darin, oder seit über einer Minute keine pid-Datei (Absturz
# zwischen mkdir und echo).
verwaist() {
  halter
  if [ -n "$h_pid" ]; then lebt && return 1; lebende; [ "$l_n" -eq 0 ]; else alt "$SPERRE"; fi
}
# Sperre der Gruppe (für Augenblicke): Eintreten und Austreten leichter Läufe und das Übernehmen einer verwaisten Sperre
# ändern die Sperre nie gleichzeitig. Älter als eine Minute ist sie verwaist.
GRUPPE="$SPERRE.leicht"
sperren() { until mkdir "$GRUPPE" 2>/dev/null; do alt "$GRUPPE" && rmdir "$GRUPPE" 2>/dev/null; sleep 0.2; done; }
entsperren() { rmdir "$GRUPPE" 2>/dev/null; }
uebernehmen() {
  alt "$SPERRE.uebernahme" && rm -rf "$SPERRE.uebernahme"
  # Übernahme selbst sperren und darin neu prüfen, sonst löscht ein Wartender die frische Sperre eines anderen; dazu die
  # Sperre der Gruppe, sonst tritt zwischen Prüfen und Löschen ein leichter Lauf in die tote Gruppe ein (Review 13).
  if mkdir "$SPERRE.uebernahme" 2>/dev/null; then
    sperren
    verwaist && rm -rf "$SPERRE"
    entsperren
    rmdir "$SPERRE.uebernahme"
  fi
}
VORRANG=${LEISE_VORRANG:-500}
[ "$VORRANG" -ge 0 ] 2>/dev/null || { echo "leise: LEISE_VORRANG=$VORRANG muss eine ganze Zahl sein, Abbruch" >&2; exit 1; }
mkdir -p "$WARTE"
gemeldet=

if [ "$ART" = allein ]; then
  # wie bis Ticket 13: wer eine kleinere Zahl lebend vor sich sieht, lässt ihm die Sperre; Marken toter Wartender werden
  # weggeräumt
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
  until ! vortritt && mkdir "$SPERRE" 2>/dev/null; do
    if [ -n "$v_pid" ]; then
      [ -z "$gemeldet" ] && { echo "leise: lasse Lauf mit Vorrang vor (PID $v_pid)" >&2; gemeldet=1; }
      v_pid=; sleep 2; continue
    fi
    if verwaist; then uebernehmen; continue; fi
    if [ -z "$gemeldet" ]; then
      if [ -f "$SPERRE/art" ]; then echo "leise: warte auf laufende leichte Läufe (PID ${h_pid:-?} u. a.)" >&2
      else echo "leise: warte auf laufenden Lauf (PID ${h_pid:-?})" >&2; fi
      gemeldet=1
    fi
    sleep 2
  done
  echo "$$ $WP" > "$SPERRE/pid"
  rm -f "$MARKE"
  trap 'halter; [ "$h_pid" = "$$" ] && rm -rf "$SPERRE"' EXIT
else
  # pid ersetzen, ohne dass sie je leer oder halb geschrieben ist (ein Wartender hielte die Sperre sonst für verwaist)
  setze_halter() { echo "$1 $2" > "$SPERRE/pid.$$" && mv -f "$SPERRE/pid.$$" "$SPERRE/pid"; }
  # Wartet ein alleiniger Lauf, dem dieser Vortritt lässt? (gleicher oder kleinerer Vorrang, oder länger als FRIST)
  # Marken anderer Läufe nur lesen, nie löschen.
  vortritt() {
    for m in "$WARTE"/*.*; do
      [ -f "$m" ] || continue
      n=${m##*/}; n=${n%%.*}
      read -r h_pid h_wp 2>/dev/null < "$m" || continue
      lebt || continue
      if [ "$n" -le "$VORRANG" ] 2>/dev/null || [ -n "$(find "$m" -maxdepth 0 -mmin +"$FRIST" 2>/dev/null)" ]; then
        v_pid=$h_pid; return 0
      fi
    done
    return 1
  }
  melde() { [ "$gemeldet" = "$1" ] || { echo "leise: $2" >&2; gemeldet=$1; }; }
  while :; do
    if vortritt; then melde vortritt "lasse alleinigen Lauf vor (PID $v_pid)"; sleep 2; continue; fi
    sperren
    if mkdir "$SPERRE" 2>/dev/null; then
      echo leicht > "$SPERRE/art"
      echo "$$ $WP" > "$SPERRE/leicht.$$"
      setze_halter "$$" "$WP"
      entsperren; break
    fi
    if [ -f "$SPERRE/art" ]; then
      lebende raeumen
      if [ "$l_n" -lt "$LMAX" ]; then
        echo "$$ $WP" > "$SPERRE/leicht.$$"
        halter; lebt || setze_halter "$$" "$WP"
        entsperren; break
      fi
      entsperren; melde voll "warte: schon $l_n leichte Läufe (LEISE_LEICHT_MAX=$LMAX)"; sleep 2; continue
    fi
    entsperren
    if verwaist; then uebernehmen; continue; fi
    melde allein "warte auf laufenden alleinigen Lauf (PID ${h_pid:-?})"; sleep 2
  done
  # Austreten: der letzte räumt die Sperre weg; sonst bekommt ein anderer lebender leichter Lauf die pid, wenn sie auf
  # diesen oder einen toten zeigt
  austreten() {
    sperren
    # die Wache nur unter der Sperre der Gruppe beenden: dann hält sie sie gerade nicht
    [ -n "$WACHE" ] && kill "$WACHE" 2>/dev/null
    rm -f "$SPERRE/leicht.$$"
    if [ -f "$SPERRE/art" ]; then
      lebende raeumen
      if [ "$l_n" -eq 0 ]; then rm -rf "$SPERRE"
      else halter; if [ "$h_pid" = "$$" ] || ! lebt; then setze_halter "$l_pid" "$l_wp"; fi
      fi
    fi
    entsperren
  }
  trap austreten EXIT
  # Wache (Review 13): Stirbt der Halter hart (taskkill /F, kill -9), räumt er die pid nicht mehr weg. Eine ältere Kopie
  # dieses Skripts, die nur pid kennt, hielte die Gruppe dann für verwaist und liefe neben den übrigen leichten Läufen.
  # Darum prüft jeder leichte Lauf alle 5 s, ob der Halter lebt, und trägt sich sonst selbst ein. Sie endet, sobald
  # dieser Lauf ausgetreten oder tot ist.
  wache() {
    trap - EXIT INT TERM
    while sleep 5; do
      sperren
      if [ "$(cat "/proc/$$/winpid" 2>/dev/null)" = "$WP" ] && [ -f "$SPERRE/leicht.$$" ]; then
        halter; lebt || setze_halter "$$" "$WP"
        entsperren
      else entsperren; exit 0
      fi
    done
  }
fi
trap 'exit 130' INT
trap 'exit 143' TERM
powershell -NoProfile -ExecutionPolicy Bypass -File "$(cygpath -w "$(dirname "$0")")\leise.ps1" -ProcessId "$WP" -Percent "${LEISE_CPU:-20}" || { echo "leise: Job nicht gesetzt, Abbruch" >&2; exit 1; }
[ "$ART" = leicht ] && { wache </dev/null >/dev/null 2>&1 & WACHE=$!; }
LEISE_AKTIV=1 LEISE_ART=$ART "$@"
