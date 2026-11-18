// Übersetzungsschicht der Seite (Ticket 07 von .scratch/umbau/): lädt die Sprachdateien (jede src/texte/<kürzel>.json
// ist eine Sprache; eine neue Sprache ist nur eine neue Datei), wählt die Sprache beim Start und gibt t, levelTitel,
// die Namen der Sprachen und den Wechsel. Den Kern (Nachschlagen, Platzhalter, Wahl, Wechsel) hat uebersetzung.js.
// Sprache beim Start: ?sprache=<kürzel> (zum Prüfen, wird nicht gespeichert), sonst die im Menü gewählte (Speicherschicht,
// einstellungen.sprache), sonst die des Geräts (navigator.language: de* Deutsch, sonst Englisch, solange es en.json
// gibt). Das Dokument bekommt lang, die festen Texte in index.html (data-t …), Seitentitel, Beschreibung und das
// Manifest der Sprache (seit Ticket 08) gleich beim Laden dieses Moduls, vor dem Startbildschirm.
// Ein Wechsel im Menü (setzeSprache; seit Ticket 01 von .scratch/sprachwahl/) speichert die neue Sprache und lädt die
// Seite nicht neu: t, levelTitel und sprache (ein Live-Binding) folgen ihr sofort. Dieses Modul stellt das Dokument um
// (lang, feste Texte ohne die mit Zustand, Manifest) und meldet den Wechsel dann allen, die sich mit beiSprachwechsel
// gemeldet haben: Wer Texte ins Dokument geschrieben hat, schreibt sie mit seinem Zustand neu, auch verborgene. Texte
// in Daten (Kapitel, Grade …) holen die Module erst beim Lesen. So steht jeder Text gleich in der neuen Sprache, und
// Szene, Himmel und Brett bleiben, wie sie sind.
// Kein Import aus src/seite/: Es lädt vor jedem Teil, der es braucht, und ändert so die Reihenfolge der Teile nicht.
import { einstellungen } from '../spielstand.js';
import { GRUNDSPRACHE, sprachSchicht, spracheWaehlen } from './uebersetzung.js';

const DATEIEN = import.meta.glob('./*.json', { eager: true, import: 'default' });
/** Die Sprachen mit Datei: { de: {…}, en: {…} }. */
const SPRACHEN = Object.fromEntries(Object.entries(DATEIEN).map(([pfad, texte]) => [pfad.slice(2, -5), texte]));
/** Ihre Kürzel, Deutsch zuerst (die Reihenfolge im Schalter). */
const VORHANDEN = Object.keys(SPRACHEN).sort((a, b) => (b === GRUNDSPRACHE) - (a === GRUNDSPRACHE) || a.localeCompare(b));
const schicht = sprachSchicht(SPRACHEN, spracheWaehlen({
  gewuenscht: new URLSearchParams(location.search).get('sprache'), gespeichert: einstellungen.sprache(),
  geraet: navigator.language, vorhanden: VORHANDEN,
}), { touch: matchMedia('(pointer: coarse)').matches });
/** Die Sprache (Kürzel ihrer Datei). Ein Live-Binding: Wer sie importiert, sieht nach einem Wechsel die neue. */
let sprache = schicht.sprache;
/** Text zum Schlüssel in der aktuellen Sprache (siehe uebersetzer); Gerät wie IS_TOUCH der Oberfläche. */
const t = schicht.t;
/** Titel eines Levels in der aktuellen Sprache (Bereich titel der Sprachdatei; ohne Eintrag, etwa ein Kandidat der
 * KI-Tester, sein Name). */
const levelTitel = (lvl) => schicht.titel(lvl.name);
/** Name einer Sprache in ihr selbst («Deutsch», «English»). */
const spracheName = (kuerzel) => SPRACHEN[kuerzel]?.sprache?.name ?? kuerzel;
/**
 * fn({ sprache, vorher }) nach jedem Wechsel der Sprache, wenn das Dokument schon umgestellt ist: Wer Texte gebaut hat,
 * schreibt sie hier mit seinem Zustand neu, auch verborgene. In der Reihenfolge des Meldens.
 */
const beiSprachwechsel = (fn) => schicht.abonniere(fn);

/**
 * Feste Texte des Dokuments: data-t (Text), data-t-title, data-t-aria-label, data-t-content (Attribut). wechsel: ohne
 * die Teile mit Zustand (data-zustand nennt sie: text bzw. das Attribut); die setzt ihr Besitzer selbst neu (etwa
 * aria-label von #btn-sound je nach Ton an oder aus, «Gelöst» und «Weiter» je nach Lage der Geschichte).
 */
function uebersetzeSeite(wechsel = false) {
  const eigen = (el, teil) => wechsel && (el.dataset.zustand ?? '').split(/\s+/).includes(teil);
  for (const el of document.querySelectorAll('[data-t]')) if (!eigen(el, 'text')) el.textContent = t(el.dataset.t);
  for (const attr of ['title', 'aria-label', 'content']) {
    for (const el of document.querySelectorAll(`[data-t-${attr}]`)) {
      if (!eigen(el, attr)) el.setAttribute(attr, t(el.getAttribute(`data-t-${attr}`)));
    }
  }
}
/**
 * Das Dokument in der aktuellen Sprache: lang, feste Texte (auch Seitentitel und Beschreibung) und das Manifest (Name
 * beim Installieren und auf dem Startbildschirm, Ticket 08). index.html fügt über http(s) das deutsche ein
 * (manifest.webmanifest); eine andere Sprache nimmt ihr eigenes, manifest-<kürzel>.webmanifest (gleich bis auf Name,
 * Beschreibung und lang; tests/texte.test.mjs verlangt es für jede Sprachdatei).
 */
function stelleDokumentUm(wechsel) {
  document.documentElement.lang = sprache;
  uebersetzeSeite(wechsel);
  const manifest = document.querySelector('link[rel="manifest"]');
  const datei = sprache === GRUNDSPRACHE ? 'manifest.webmanifest' : `manifest-${sprache}.webmanifest`;
  if (manifest && manifest.getAttribute('href') !== datei) manifest.setAttribute('href', datei);
}
stelleDokumentUm(false);
// als Erstes beim Wechsel (vor allen, die dieses Modul importieren): das Dokument
beiSprachwechsel(({ sprache: neu }) => {
  sprache = neu;
  stelleDokumentUm(true);
});

/**
 * Die Sprache wechseln (Schalter im Menü, Testschnittstelle), ohne Neuladen: merken, ?sprache= aus der Adresse nehmen
 * (sonst gälte nach einem Neuladen wieder diese), dann umstellen und melden (beiSprachwechsel). Gleiche oder unbekannte
 * Sprache: nichts. Zurück true, wenn gewechselt.
 */
function setzeSprache(kuerzel) {
  if (kuerzel === sprache || !VORHANDEN.includes(kuerzel)) return false;
  einstellungen.setSprache(kuerzel);
  if (new URLSearchParams(location.search).has('sprache')) {
    // die übrigen Parameter wörtlich behalten (URLSearchParams schriebe ?nointro als ?nointro=)
    const rest = location.search.slice(1).split('&').filter((p) => p && !/^sprache(=|$)/.test(p)).join('&');
    history.replaceState(history.state, '', location.pathname + (rest ? `?${rest}` : '') + location.hash);
  }
  return schicht.wechsle(kuerzel);
}

export { beiSprachwechsel, levelTitel, setzeSprache, sprache, spracheName, t, VORHANDEN };
