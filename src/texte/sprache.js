// Übersetzungsschicht der Seite (Ticket 07 von .scratch/umbau/): lädt die Sprachdateien (jede src/texte/<kürzel>.json
// ist eine Sprache; eine neue Sprache ist nur eine neue Datei), wählt die Sprache beim Start und gibt t, levelTitel und
// den Schalter der Sprache. Den Kern (Nachschlagen, Platzhalter, Wahl) hat src/texte/uebersetzung.js.
// Sprache beim Start: ?sprache=<kürzel> (zum Prüfen, wird nicht gespeichert), sonst die im Menü gewählte (Speicherschicht,
// einstellungen.sprache), sonst die des Geräts (navigator.language: de* Deutsch, sonst Englisch, solange es en.json
// gibt). Ein Wechsel im Menü speichert die neue und lädt die Seite neu (setzeSprache): So steht jeder Text, auch der
// schon gebaute, in der neuen Sprache. Das Dokument bekommt lang, die festen Texte in index.html (data-t …) und den
// Seitentitel gleich beim Laden dieses Moduls, vor dem Startbildschirm, seit Ticket 08 auch das Manifest der Sprache.
// Kein Import aus src/seite/: Es lädt vor jedem Teil, der es braucht, und ändert so die Reihenfolge der Teile nicht.
import { einstellungen } from '../spielstand.js';
import { GRUNDSPRACHE, spracheWaehlen, titelVon, uebersetzer } from './uebersetzung.js';

const DATEIEN = import.meta.glob('./*.json', { eager: true, import: 'default' });
/** Die Sprachen mit Datei: { de: {…}, en: {…} }. */
const SPRACHEN = Object.fromEntries(Object.entries(DATEIEN).map(([pfad, texte]) => [pfad.slice(2, -5), texte]));
/** Ihre Kürzel, Deutsch zuerst (die Reihenfolge im Schalter). */
const VORHANDEN = Object.keys(SPRACHEN).sort((a, b) => (b === GRUNDSPRACHE) - (a === GRUNDSPRACHE) || a.localeCompare(b));
/** Die Sprache dieser Sitzung. */
const sprache = spracheWaehlen({
  gewuenscht: new URLSearchParams(location.search).get('sprache'), gespeichert: einstellungen.sprache(),
  geraet: navigator.language, vorhanden: VORHANDEN,
});
/** Text zum Schlüssel in der Sprache dieser Sitzung (siehe uebersetzer); Gerät wie IS_TOUCH der Oberfläche. */
const t = uebersetzer(SPRACHEN, sprache, matchMedia('(pointer: coarse)').matches);
/** Titel eines Levels (Bereich titel der Sprachdatei; ohne Eintrag, etwa ein Kandidat der KI-Tester, sein Name). */
const levelTitel = (lvl) => titelVon(SPRACHEN, sprache, lvl.name);
/** Name einer Sprache in ihr selbst («Deutsch», «English»). */
const spracheName = (kuerzel) => SPRACHEN[kuerzel]?.sprache?.name ?? kuerzel;
/** Die Sprache wechseln: merken und neu laden (gleiche Sprache: nichts). */
function setzeSprache(kuerzel) {
  if (kuerzel === sprache || !VORHANDEN.includes(kuerzel)) return;
  einstellungen.setSprache(kuerzel);
  const adresse = new URL(location.href);
  adresse.searchParams.delete('sprache'); // sonst gälte nach dem Laden wieder die der Adresse
  if (adresse.href === location.href) location.reload(); else location.replace(adresse.href);
}

/** Feste Texte des Dokuments: data-t (Text), data-t-title, data-t-aria-label, data-t-content (Attribut). */
function uebersetzeSeite(wurzel = document) {
  for (const el of wurzel.querySelectorAll('[data-t]')) el.textContent = t(el.getAttribute('data-t'));
  for (const attr of ['title', 'aria-label', 'content']) {
    for (const el of wurzel.querySelectorAll(`[data-t-${attr}]`)) el.setAttribute(attr, t(el.getAttribute(`data-t-${attr}`)));
  }
}
document.documentElement.lang = sprache;
uebersetzeSeite();
// Manifest (Name beim Installieren und auf dem Startbildschirm, Ticket 08): index.html fügt über http(s) das deutsche
// ein (manifest.webmanifest); eine andere Sprache nimmt ihr eigenes, manifest-<kürzel>.webmanifest (gleich bis auf Name,
// Beschreibung und lang; tests/texte.test.mjs verlangt es für jede Sprachdatei).
const manifest = document.querySelector('link[rel="manifest"]');
if (manifest && sprache !== GRUNDSPRACHE) manifest.setAttribute('href', `manifest-${sprache}.webmanifest`);

export { levelTitel, setzeSprache, sprache, spracheName, t, VORHANDEN };
