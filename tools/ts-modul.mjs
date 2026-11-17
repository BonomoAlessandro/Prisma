// Module des Spiels in TypeScript für Tests und Werkzeuge in Node (Ticket 05 von .scratch/umbau/).
//
// Node 22.12 lädt .ts nicht ohne Weiteres. tsModul(pfad) meldet einmal einen Lade-Haken an (module.register), der für
// Dateien auf .ts das Format module-typescript meldet (Node entfernt dann die Typen; nur Typen, keine enum o. Ä.), und
// importiert das Modul; auch Module, die ein .ts importieren (etwa src/spielstand.js die Speicherschicht). Die Warnung
// «Type Stripping is an experimental feature» unterdrückt es. Ab Node 22.18 entfernt Node Typen von selbst.
//
//   const { progress } = await tsModul('src/spielstand.js');   // Pfad relativ zum Wurzelordner
import { register } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './spielserver.mjs';

let angemeldet = false;

function anmelden() {
  if (angemeldet) return;
  angemeldet = true;
  const warne = process.emitWarning;
  process.emitWarning = function (w, ...rest) {
    if (String(w?.message ?? w).includes('Type Stripping')) return undefined;
    return warne.call(this, w, ...rest);
  };
  const haken = `export async function load(url, ctx, next) {
    return next(url, url.endsWith('.ts') ? { ...ctx, format: 'module-typescript' } : ctx);
  }`;
  register(`data:text/javascript,${encodeURIComponent(haken)}`);
}

/** Das Modul unter pfad (relativ zum Wurzelordner), auch .ts oder eines, das .ts importiert. */
export async function tsModul(pfad) {
  anmelden();
  return import(pathToFileURL(join(root, pfad)).href);
}
