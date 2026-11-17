// Testschnittstelle für Proben (Ticket 04 von .scratch/umbau/): Proben (tests/*-probe.mjs, tests/*.js über
// tests/screenshot.mjs, tools/ki-tester/shots.mjs) lesen über Runtime.evaluate neben window.__prismaDebug einige Namen
// der Seite direkt als globale Namen (game, camera, draw …). Zur Zeit der klassischen Skripte waren alle Namen der
// obersten Ebene global; in Modulen sind sie es nicht mehr. Darum zeigt jedes Modul die Namen, die Proben brauchen, als
// Eigenschaften von window: lesend über einen Getter (immer der aktuelle Wert), wo eine Probe den Namen ersetzt (draw,
// renderReflection), auch mit einem Setzer, der die Bindung im Modul ändert (auch Importe in anderen Modulen sehen dann
// den neuen Wert). Das Spiel selbst liest diese Eigenschaften nie.
export function alsGlobal(lesen: Record<string, () => unknown>, setzen: Record<string, (wert: never) => void> = {}): void {
  for (const [name, lies] of Object.entries(lesen)) {
    Object.defineProperty(window, name, { get: lies, set: setzen[name], configurable: true, enumerable: false });
  }
}
