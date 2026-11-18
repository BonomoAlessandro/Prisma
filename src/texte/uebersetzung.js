// Übersetzungsschicht, Kern (Ticket 07 von .scratch/umbau/): Alle Texte, die der Spieler sieht, stehen in einer
// JSON-Datei je Sprache (src/texte/<sprache>.json, Deutsch in de.json); der Code nennt nur Schlüssel und holt den Text
// mit t('schluessel', { werte }). Dieser Kern ist rein (kein DOM, kein Speicher) und gilt auch in Node (Tests); die
// Seite benutzt ihn über src/texte/sprache.js, das die Sprachdateien lädt, die Sprache wählt und sie wechselt
// (sprachSchicht, seit Ticket 01 von .scratch/sprachwahl/ ohne Neuladen).
//
// Sprachdatei: ein Objekt mit Bereichen (menue, uebersicht, geschichte …); ein Schlüssel ist der Weg mit Punkten
// (menue.aktion.weiter). Ein Blatt ist ein Text oder ein Text je Gerät { touch, maus } (Finger bzw. Maus, etwa «Tippen»
// und «Klicken»). Ausnahme ist der Bereich titel: die Titel der Level unter ihrem Namen (levelTitel), auch Namen mit
// Leerzeichen. Platzhalter im Text: {name} für einen Wert aus werte (etwa «Übung {n} / {N}»), sonst ein Wort je Gerät
// aus dem Bereich geraet («{Tippe}» ist am Handy «Tippe», mit der Maus «Klicke»). Fehlt ein Schlüssel in einer Sprache,
// gilt der deutsche Text.

/** Die Sprache, deren Datei alle Schlüssel hat und für fehlende einspringt. */
export const GRUNDSPRACHE = 'de';

/** Ist w ein Text je Gerät ({ touch, maus }, beide Texte)? */
export const istGeraeteText = (w) => w !== null && typeof w === 'object' && !Array.isArray(w)
  && Object.keys(w).sort().join() === 'maus,touch' && typeof w.touch === 'string' && typeof w.maus === 'string';

/** Blatt unter dem Schlüssel (Weg mit Punkten) in einer Sprachdatei: Text, Text je Gerät oder undefined. */
export function nachschlagen(texte, schluessel) {
  let w = texte;
  for (const teil of schluessel.split('.')) {
    if (w === null || typeof w !== 'object' || !Object.hasOwn(w, teil)) return undefined;
    w = w[teil];
  }
  return typeof w === 'string' || istGeraeteText(w) ? w : undefined;
}

/** Alle Blätter einer Sprachdatei als Map Schlüssel → Text bzw. { touch, maus }; titel: je Name ein Blatt. */
export function blaetter(texte, vorne = '', alle = new Map()) {
  for (const [k, w] of Object.entries(texte ?? {})) {
    const schluessel = vorne ? `${vorne}.${k}` : k;
    if (typeof w === 'string' || istGeraeteText(w)) alle.set(schluessel, w);
    else if (w !== null && typeof w === 'object' && !Array.isArray(w)) blaetter(w, schluessel, alle);
    else alle.set(schluessel, w); // kein gültiges Blatt: der Test meldet es
  }
  return alle;
}

/** Die Namen der Platzhalter in einem Text ({name}), in ihrer Reihenfolge, ohne Doppelte. */
export const platzhalter = (text) => [...new Set([...String(text).matchAll(/\{([^{}]+)\}/g)].map((m) => m[1]))];

/**
 * Sprache beim Start: die gespeicherte, wenn es sie gibt; sonst die des Geräts (geraet wie navigator.language):
 * Deutsch bei de*, sonst Englisch, solange es die englische Datei gibt, sonst Deutsch. vorhanden: die Sprachen mit
 * Datei.
 */
export function spracheWaehlen({ gewuenscht = null, gespeichert = null, geraet = '', vorhanden = [GRUNDSPRACHE] }) {
  for (const s of [gewuenscht, gespeichert]) if (s && vorhanden.includes(s)) return s;
  if (/^de(-|_|$)/i.test(geraet ?? '')) return GRUNDSPRACHE;
  return vorhanden.includes('en') ? 'en' : GRUNDSPRACHE;
}

/**
 * Übersetzer für eine Sprache: t(schluessel, werte) gibt den Text der Sprache (fehlt er, den deutschen; fehlt auch der,
 * den Schlüssel selbst, damit eine Lücke auffällt). sprachen: { de: {…}, en: {…} }, touch: Gerät mit Finger (Texte
 * je Gerät und Platzhalter wie {Tippe}); werte.touch ändert das Gerät für diesen Aufruf (Proben prüfen so beide).
 */
export function uebersetzer(sprachen, sprache, touch = false) {
  const texte = sprachen[sprache] ?? sprachen[GRUNDSPRACHE], grund = sprachen[GRUNDSPRACHE];
  const blatt = (schluessel) => nachschlagen(texte, schluessel) ?? nachschlagen(grund, schluessel);
  const fuer = (w, finger) => (typeof w === 'string' ? w : finger ? w.touch : w.maus);
  return function t(schluessel, werte = {}) {
    const finger = typeof werte.touch === 'boolean' ? werte.touch : touch;
    const w = blatt(schluessel);
    if (w === undefined) return schluessel;
    return fuer(w, finger).replace(/\{([^{}]+)\}/g, (ganz, name) => {
      if (Object.hasOwn(werte, name)) return String(werte[name]);
      const g = blatt(`geraet.${name}`);
      return g === undefined ? ganz : fuer(g, finger);
    });
  };
}

/** Titel eines Levels in der Sprache: aus dem Bereich titel (unter seinem Namen), sonst Deutsch, sonst der Name. */
export function titelVon(sprachen, sprache, name) {
  const aus = (s) => (Object.hasOwn(sprachen[s]?.titel ?? {}, name) ? sprachen[s].titel[name] : undefined);
  return aus(sprache) ?? aus(GRUNDSPRACHE) ?? name;
}

/**
 * Die Sprache zur Laufzeit (Ticket 01 von .scratch/sprachwahl/: ein Wechsel lädt nicht mehr neu). t, titel und
 * sprache folgen immer der aktuellen Sprache (t wie bei uebersetzer, titel wie titelVon). wechsle(kuerzel) stellt um
 * und meldet es allen, die sich mit abonniere(fn) gemeldet haben, in dieser Reihenfolge: fn({ sprache, vorher }).
 * Gleiche oder unbekannte Sprache (ohne Datei): nichts, zurück false. Wirft ein Abonnent, kommen die übrigen trotzdem
 * dran (der Fehler geht an fehler, Vorgabe die Konsole). sprachen und touch wie bei uebersetzer.
 */
export function sprachSchicht(sprachen, sprache, { touch = false, fehler = (e) => console.error(e) } = {}) {
  let aktuell = Object.hasOwn(sprachen, sprache) ? sprache : GRUNDSPRACHE;
  let uebersetze = uebersetzer(sprachen, aktuell, touch);
  const abonnenten = [];
  return {
    get sprache() { return aktuell; },
    t: (schluessel, werte) => uebersetze(schluessel, werte),
    titel: (name) => titelVon(sprachen, aktuell, name),
    abonniere(fn) { abonnenten.push(fn); },
    wechsle(kuerzel) {
      if (kuerzel === aktuell || !Object.hasOwn(sprachen, kuerzel)) return false;
      const vorher = aktuell;
      aktuell = kuerzel;
      uebersetze = uebersetzer(sprachen, aktuell, touch);
      for (const fn of [...abonnenten]) {
        try { fn({ sprache: aktuell, vorher }); } catch (e) { fehler(e); }
      }
      return true;
    },
  };
}
