// Globale Namen für tsc (Ticket 04 von .scratch/umbau/): was die klassischen Skripte in index.html bereitstellen und
// die TypeScript-Module unter src/ benutzen. three.js r147 kommt als klassisches Skript aus vendor/ (ohne Typen, darum
// any; eine Aktualisierung von three ist ein eigener Entscheid, spec.md).
declare const THREE: any;
