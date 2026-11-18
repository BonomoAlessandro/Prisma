// Die Sprachdateien der Übersetzungsschicht für Tests und Werkzeuge (Ticket 07 von .scratch/umbau/): jede Datei
// src/texte/<kürzel>.json ist eine Sprache (de.json hat alle Schlüssel). Gelesen wie im Spiel (src/texte/sprache.js lädt
// dieselben Dateien); geschrieben in einer festen Form (JSON mit zwei Leerzeichen Einzug, am Schluss ein
// Zeilenumbruch; die Zeilenenden wie in der Datei, core.autocrlf macht im Arbeitsordner unter Windows CRLF daraus),
// damit ein Werkzeug, das einen Bereich neu schreibt (tools/geschichte.mjs spiel: die Titel der Level), sonst nichts
// ändert.
import { readdirSync, readFileSync } from 'node:fs';

/** Ordner der Sprachdateien. */
export const TEXTE = new URL('../src/texte/', import.meta.url);
/** Pfad (URL) der Datei einer Sprache. */
export const sprachDatei = (kuerzel) => new URL(`${kuerzel}.json`, TEXTE);
/** Die Kürzel der Sprachen mit Datei, Deutsch zuerst. */
export const kuerzel = () => readdirSync(TEXTE).filter((d) => d.endsWith('.json')).map((d) => d.slice(0, -5))
  .sort((a, b) => (b === 'de') - (a === 'de') || a.localeCompare(b));
/** Der Text der Datei einer Sprache. */
export const sprachText = (k) => readFileSync(sprachDatei(k), 'utf8');
/** Alle Sprachen: { de: {…}, en: {…} } wie im Spiel. */
export const sprachen = () => Object.fromEntries(kuerzel().map((k) => [k, JSON.parse(sprachText(k))]));
/** Eine Sprachdatei in ihrer festen Form; wie: der bisherige Text (seine Zeilenenden bleiben). */
export const alsText = (texte, wie = '') => `${JSON.stringify(texte, null, 2)}\n`
  .replace(/\n/g, wie.includes('\r\n') ? '\r\n' : '\n');
