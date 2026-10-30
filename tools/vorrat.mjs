// Vorrat der Level (Spec .scratch/noa-geschichte/, «Daten»; Ticket 02): Level, die nicht im Spiel stehen, aber
// jederzeit zurückkommen können, versioniert unter tools/vorrat/, getrennt nach Fläche (flach.js) und Würfel
// (wuerfel.js). Je Level steht dort sein Block aus index.html (zwischen LEVELS:BEGIN und LEVELS:END bzw. WUERFEL:BEGIN
// und WUERFEL:END, von „  {“ bis „  },“) Zeile für Zeile unverändert: Lösung und Herkunft im Kommentar, Name, wahlweise
// Titel, Grad, Elemente, Lösung, also das Format von levelCode in leveldaten.mjs. Darüber eine Zeile mit seinem Platz
// beim Ablegen, „// Platz im Spiel: nach „<Name>““ oder „// Platz im Spiel: am Anfang“. So zeigt ein Diff, welche
// Level gehen und kommen, und ein Level kommt mit denselben Bytes zurück.
// - Die ganze Folge: die Level im Spiel mit denen des Vorrats an ihrem Platz, wie nach dem Zurückholen aller
//   (einfuegen; der Lader liest sie so). Der Platz eines Levels im Vorrat ist das Level unmittelbar davor in dieser
//   Folge, auch wenn das selbst im Vorrat liegt oder mit abgelegt wird. So zeigt jedes Level auf einen anderen
//   Vorgänger, und die ganze Folge bleibt beim Ablegen und Zurückholen dieselbe. Hiesse der Platz das Level davor im
//   Spiel, zeigten zwei Level auf denselben, sobald dazwischen schon eines im Vorrat liegt, und kämen sie einzeln
//   zurück, wäre ihre Reihenfolge verloren.
// - ablegen: nimmt Level aus index.html und hängt sie in ihrer Reihenfolge im Spiel an den Vorrat an. Das Tutorial (vor
//   LEVELS:BEGIN) bleibt im Spiel.
// - zurueckholen: setzt Level aus dem Vorrat wieder in index.html ein, an ihren Platz in der ganzen Folge: Ablegen und
//   Zurückholen derselben Level ergibt index.html und den Vorrat byte-gleich wie vorher, auch in Teilen, in anderer
//   Gruppierung und Reihenfolge und über mehrere Schritte (tests/vorrat.test.mjs). Ordnet ein Werkzeug die Level im
//   Spiel um, während andere im Vorrat liegen, kommt ein Level hinter seinen Vorgänger, wo der dann steht.
// - liste: zeigt den Vorrat je Art und Grad.
// - inGanzerFolge: für Werkzeuge, die die ganze Folge einer Art ordnen oder ergänzen (ordne-level.mjs,
//   ordne-wuerfel.mjs; Ticket 08): Sie schreiben in Spiel und Vorrat, ohne dass vorher alles zurückgeholt werden muss.
// Der gemeinsame Lader (lader.mjs) liest Spiel und Vorrat zusammen, in der Folge wie nach dem Zurückholen aller Level
// (mitAllen). Die Funktionen rechnen auf Texten (index.html und die Dateien des Vorrats); geschrieben wird nur über die
// Kommandozeile. Zeilenenden wie in der jeweiligen Datei (index.html LF, der Vorrat nach core.autocrlf auch CRLF).
// Aufruf: node tools/vorrat.mjs liste
//         node tools/vorrat.mjs ablegen <name …> [--flach] [--wuerfel] [--grad <grad>] [--datei <datei>]
//         node tools/vorrat.mjs zurueckholen <name …> [--flach] [--wuerfel] [--grad <grad>] [--alle] [--datei <datei>]
//   <name …>   einzelne Level nach ihrem Namen, flach oder im Würfel
//   --flach    alle flachen Level (ohne das Tutorial), --wuerfel alle Würfel-Level; mit --grad nur die dieses Grads
//   --grad     ohne --flach und --wuerfel: die flachen und die Würfel-Level dieses Grads
//   --alle     (zurueckholen) der ganze Vorrat
//   --datei    Namen aus einer Datei: eine JSON-Liste oder ein Name je Zeile
// Beim Ablegen wird zuerst der Vorrat geschrieben, dann index.html, beim Zurückholen umgekehrt: Bricht etwas dazwischen
// ab, steht ein Level doppelt (der Lader meldet das), aber nie nirgends.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** Die Arten: wo ihre Level im Spiel stehen (Markierungen in index.html) und ihre Datei im Vorrat. */
export const ARTEN = {
  flach: { anfang: '/* LEVELS:BEGIN */', ende: '/* LEVELS:END */', datei: new URL('./vorrat/flach.js', import.meta.url),
    text: 'flache Level' },
  wuerfel: { anfang: '/* WUERFEL:BEGIN */', ende: '/* WUERFEL:END */',
    datei: new URL('./vorrat/wuerfel.js', import.meta.url), text: 'Würfel-Level' },
};
export const INDEX = new URL('../index.html', import.meta.url);
/** Die Markierungen im Vorrat, zwischen denen seine Level stehen. */
const VORRAT_ANFANG = '/* VORRAT:BEGIN */', VORRAT_ENDE = '/* VORRAT:END */';
const NAME = /^ {4}name: '((?:[^'\\]|\\.)*)'/;
const PLATZ = /^ {2}\/\/ Platz im Spiel: (?:nach „(.*)“|am Anfang)$/;
const unquote = (s) => s.replace(/\\(.)/g, '$1');

/** Die Zeile mit dem Platz im Spiel beim Ablegen (nach: Name des Vorgängers oder null am Anfang). */
const platzZeile = (nach) => `  // Platz im Spiel: ${nach === null ? 'am Anfang' : `nach „${nach}“`}`;

/**
 * Der Bereich zwischen zwei Markierungen, je auf einer eigenen Zeile: { von, bis, nl, zeilen }, von und bis die Grenzen
 * der Zeilen dazwischen im Text, nl das Zeilenende der Datei.
 */
function bereich(text, anfang, ende, wo) {
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const a = text.indexOf(anfang), e = text.indexOf(ende);
  if (a < 0 || e < a) throw new Error(`${wo}: Markierungen ${anfang} und ${ende} fehlen`);
  const von = text.indexOf(nl, a) + nl.length, bis = text.lastIndexOf(nl, e) + nl.length;
  return { von, bis, nl, zeilen: text.slice(von, bis).split(nl).slice(0, -1) };
}

/** Der Text mit anderen Zeilen im Bereich b (aus bereich). */
const ersetze = (text, b, zeilen) => text.slice(0, b.von) + zeilen.map(z => z + b.nl).join('') + text.slice(b.bis);

/**
 * Die Level eines Bereichs als Blöcke von „  {“ bis „  },“, je { name, grad, titel, zeilen }; im Vorrat steht vor
 * jedem Block die Zeile mit seinem Platz (dazu platz: die Zeile, nach: Name des Vorgängers oder null), im Spiel keine.
 * Name, Titel und Grad aus der Namenszeile (titel und grad null, wenn sie fehlen).
 */
function bloecke(zeilen, wo, imVorrat) {
  const out = [];
  let block = null, platz = null;
  for (const zeile of zeilen) {
    if (!block && imVorrat && PLATZ.test(zeile)) {
      if (platz) throw new Error(`${wo}: zwei Zeilen mit dem Platz im Spiel hintereinander: ${zeile}`);
      platz = zeile;
      continue;
    }
    if (zeile === '  {') {
      if (block) throw new Error(`${wo}: Level ohne Ende vor ${zeile}`);
      if (imVorrat && !platz) throw new Error(`${wo}: Level ohne Zeile mit dem Platz im Spiel`);
      block = [zeile];
    } else if (!block) throw new Error(`${wo}: Zeile ausserhalb eines Levels: ${zeile}`);
    else block.push(zeile);
    if (zeile === '  },') {
      const kopf = block.find(z => NAME.test(z));
      if (!kopf) throw new Error(`${wo}: Level ohne Namenszeile: ${block.slice(0, 3).join(' ')}`);
      const feld = (k) => {
        const m = kopf.match(new RegExp(`\\b${k}: '((?:[^'\\\\]|\\\\.)*)'`));
        return m ? unquote(m[1]) : null;
      };
      const b = { name: unquote(kopf.match(NAME)[1]), titel: feld('titel'), grad: feld('grad'), zeilen: block };
      if (imVorrat) {
        const m = platz.match(PLATZ);
        Object.assign(b, { platz, nach: m[1] === undefined ? null : m[1] });
      }
      out.push(b);
      block = null;
      platz = null;
    }
  }
  if (block || platz) throw new Error(`${wo}: das letzte Level ist unvollständig`);
  const namen = out.map(b => b.name), doppelt = namen.filter((x, k) => namen.indexOf(x) !== k);
  if (doppelt.length) throw new Error(`${wo}: doppelt: ${[...new Set(doppelt)].join(', ')}`);
  return out;
}

/**
 * Der Bereich der Level einer Art im Spiel (zwischen ihren Markierungen in index.html) bzw. in ihrer Datei im
 * Vorrat.
 */
const spielBereich = (html, art) => bereich(html, ARTEN[art].anfang, ARTEN[art].ende, 'index.html');
const vorratBereich = (text, art) => bereich(text, VORRAT_ANFANG, VORRAT_ENDE, `tools/vorrat/${art}.js`);

/** Die Namen der Level einer Art im Spiel (zwischen den Markierungen), in ihrer Reihenfolge; ohne das Tutorial. */
export const namenImSpiel = (html, art) => bloecke(spielBereich(html, art).zeilen, 'index.html', false)
  .map(b => b.name);

/**
 * Der Vorrat einer Art (text: der Inhalt ihrer Datei): je Level { name, titel, grad, nach, platz, zeilen }, in der
 * Reihenfolge der Datei (nach dem Ablegen).
 */
export const inhalt = (text, art) => bloecke(vorratBereich(text, art).zeilen, `tools/vorrat/${art}.js`, true);

/**
 * Die Leveldaten des Vorrats einer Art, wie das Spiel sie aus LEVELS bzw. LEVELS_3D liest: je Level das Objekt, in der
 * Reihenfolge der Datei. Ausgewertet wie im Spiel (die Blöcke sind JavaScript), samt Kommentaren.
 */
export function leveldaten(text, art) {
  const b = vorratBereich(text, art), eintraege = inhalt(text, art);
  const level = new Function(`return [\n${b.zeilen.join('\n')}\n];`)();
  if (level.length !== eintraege.length || level.some((l, k) => l.name !== eintraege[k].name)) {
    throw new Error(`tools/vorrat/${art}.js: Leveldaten und Namenszeilen passen nicht zusammen`);
  }
  return level;
}

/**
 * Die Folge der Namen nach dem Zurückholen: folge die Namen im Spiel, holen die Einträge des Vorrats, die zurückkommen
 * ({ name, nach }), vorrat alle Einträge des Vorrats in seiner Reihenfolge. Gerechnet wird die ganze Folge (siehe
 * Kopf), dann bleiben das Spiel und die geholten. Die Einträge kommen vom Ende des Vorrats her dazu, jedes gleich
 * hinter seinen Vorgänger; steht der (noch) nicht darin, hinter dessen Vorgänger aus dem Vorrat und so fort, ohne einen
 * (am Anfang abgelegt) an den Anfang. Zeigt jedes Level auf einen anderen Vorgänger, ist das Ergebnis gleich in jeder
 * Reihenfolge. Ein Vorgänger, der weder im Spiel noch im Vorrat steht, schickt das Level ans Ende.
 */
export function einfuegen(folge, holen, vorrat = holen) {
  const alle = [...folge], imVorrat = new Map(vorrat.map(e => [e.name, e]));
  const fremd = [...holen.filter(e => imVorrat.get(e.name) !== e), ...vorrat.filter(e => folge.includes(e.name))];
  if (fremd.length) {
    throw new Error(`einfuegen: nicht im Vorrat oder schon im Spiel: ${fremd.map(e => e.name).join(', ')}`);
  }
  for (const e of [...vorrat].reverse()) {
    let vor = e.nach;
    const gesehen = new Set();
    while (vor !== null && !alle.includes(vor) && imVorrat.has(vor) && !gesehen.has(vor)) {
      gesehen.add(vor);
      vor = imVorrat.get(vor).nach;
    }
    alle.splice(vor === null ? 0 : alle.includes(vor) ? alle.indexOf(vor) + 1 : alle.length, 0, e.name);
  }
  const bleibt = new Set([...folge, ...holen.map(e => e.name)]);
  return alle.filter(x => bleibt.has(x));
}

/** Die Texte: { spiel: index.html, flach, wuerfel: die Dateien des Vorrats }, aus den Dateien. */
export const lese = () => ({ spiel: readFileSync(INDEX, 'utf8'),
  ...Object.fromEntries(Object.entries(ARTEN).map(([art, a]) => [art, readFileSync(a.datei, 'utf8')])) });

/**
 * Legt Level ab. texte wie bei lese, namen die Namen der Level (flach und im Würfel gemischt). Rückgabe: die neuen
 * Texte und je Art die abgelegten Namen in ihrer Reihenfolge im Spiel (abgelegt). Wirft, wenn ein Name nicht zwischen
 * den Markierungen im Spiel steht (das Tutorial steht davor) oder schon im Vorrat.
 */
export function ablegen(texte, namen) {
  const offen = new Set(namen), neu = { ...texte }, abgelegt = {};
  for (const art of Object.keys(ARTEN)) {
    const s = spielBereich(neu.spiel, art), v = vorratBereich(neu[art], art);
    const imSpiel = bloecke(s.zeilen, 'index.html', false), imVorrat = inhalt(neu[art], art);
    const schon = imSpiel.filter(b => offen.has(b.name) && imVorrat.some(x => x.name === b.name)).map(b => b.name);
    if (schon.length) throw new Error(`Schon im Vorrat: ${schon.join(', ')}`);
    // der Vorgänger in der ganzen Folge, mit den Leveln, die schon im Vorrat liegen (siehe Kopf)
    const voll = einfuegen(imSpiel.map(b => b.name), imVorrat, imVorrat);
    const weg = imSpiel.filter(b => offen.has(b.name)).map((b) => {
      const k = voll.indexOf(b.name);
      return { ...b, nach: k ? voll[k - 1] : null };
    });
    const fremd = weg.filter(b => b.nach?.includes('“')).map(b => b.nach);
    if (fremd.length) throw new Error(`Name mit „“ lässt sich als Platz nicht festhalten: ${fremd.join(', ')}`);
    neu[art] = ersetze(neu[art], v, [...imVorrat, ...weg.map(b => ({ ...b, platz: platzZeile(b.nach) }))]
      .flatMap(b => [b.platz, ...b.zeilen]));
    neu.spiel = ersetze(neu.spiel, s, imSpiel.filter(b => !offen.has(b.name)).flatMap(b => b.zeilen));
    abgelegt[art] = weg.map(b => b.name);
    for (const b of weg) offen.delete(b.name);
  }
  const liegen = Object.keys(ARTEN).flatMap(art => inhalt(texte[art], art).map(b => b.name))
    .filter(n => offen.has(n));
  if (liegen.length) throw new Error(`Schon im Vorrat: ${liegen.join(', ')}`);
  if (offen.size) throw new Error(`Nicht im Spiel (oder im Tutorial): ${[...offen].join(', ')}`);
  return { ...neu, abgelegt };
}

/**
 * Holt Level zurück. texte wie bei lese, namen die Namen der Level (flach und im Würfel gemischt) oder null für den
 * ganzen Vorrat. Rückgabe: die neuen Texte und je Art die zurückgeholten Namen in der Reihenfolge des Vorrats
 * (zurueck). Wirft, wenn ein Name nicht im Vorrat steht.
 */
export function zurueckholen(texte, namen = null) {
  const offen = new Set(namen ?? []), neu = { ...texte }, zurueck = {};
  for (const art of Object.keys(ARTEN)) {
    const s = spielBereich(neu.spiel, art), v = vorratBereich(neu[art], art);
    const imSpiel = bloecke(s.zeilen, 'index.html', false), imVorrat = inhalt(neu[art], art);
    const holen = imVorrat.filter(b => namen === null || offen.has(b.name));
    const doppelt = holen.filter(b => imSpiel.some(x => x.name === b.name)).map(b => b.name);
    if (doppelt.length) throw new Error(`Im Spiel und im Vorrat: ${doppelt.join(', ')}`);
    const block = new Map([...imSpiel, ...holen].map(b => [b.name, b]));
    const folge = einfuegen(imSpiel.map(b => b.name), holen, imVorrat);
    neu.spiel = ersetze(neu.spiel, s, folge.flatMap(x => block.get(x).zeilen));
    neu[art] = ersetze(neu[art], v, imVorrat.filter(b => !holen.includes(b)).flatMap(b => [b.platz, ...b.zeilen]));
    zurueck[art] = holen.map(b => b.name);
    for (const b of holen) offen.delete(b.name);
  }
  if (offen.size) throw new Error(`Nicht im Vorrat: ${[...offen].join(', ')}`);
  return { ...neu, zurueck };
}

/**
 * index.html mit allen Leveln des Vorrats an ihrem Platz (texte wie bei lese): so, wie zurueckholen --alle schriebe.
 */
export const mitAllen = (texte) => zurueckholen(texte).spiel;

/**
 * Ändert die ganze Folge einer Art (Spiel und Vorrat zusammen; Ticket 08), etwa wenn tools/ordne-level.mjs die Reihe
 * neu ordnet oder ein neues Level einreiht: Holt alle Level der Art aus dem Vorrat zurück, wendet aendere auf
 * index.html an (Text → Text, mit allen Leveln der Art zwischen ihren Markierungen) und legt danach die Level wieder ab,
 * die vorher im Vorrat lagen. neu: Namen von Leveln, die aendere dazugebracht hat; sie kommen in den Vorrat, solange
 * dort Level ihrer Art liegen (das Spiel ist die Geschichte, in sie bringt sie erst tools/geschichte.mjs spiel), sonst
 * bleiben sie im Spiel wie die übrigen. Rückgabe: die neuen Texte (wie bei lese) und die abgelegten Namen je Art.
 * Ändert aendere nichts, sind die Texte byte-gleich (hin und zurück wie oben). Ein Level, das aendere weglässt, fehlt
 * danach in Spiel und Vorrat: Ablegen wirft dann.
 */
export function inGanzerFolge(texte, art, aendere, neu = []) {
  const vorher = inhalt(texte[art], art).map(b => b.name);
  const geholt = vorher.length ? zurueckholen(texte, vorher) : { ...texte };
  const spiel = aendere(geholt.spiel);
  const weg = vorher.length ? [...vorher, ...neu] : [];
  if (!weg.length) return { ...geholt, spiel, abgelegt: Object.fromEntries(Object.keys(ARTEN).map(a => [a, []])) };
  return ablegen({ ...geholt, spiel }, weg);
}

/**
 * Die Namen einer Auswahl (siehe Kopf) unter den Leveln { name, grad } je Art: einzelne Namen, die Arten (leer: keine
 * Gruppe nach Art) und ein Grad (ohne Art: beide Arten); alle: jedes Level.
 */
export function auswahl(levelJeArt, { namen = [], arten = [], grad = null, alle = false }) {
  const gruppen = alle ? Object.keys(levelJeArt) : arten.length ? arten : grad ? Object.keys(levelJeArt) : [];
  const dazu = gruppen.flatMap(art => levelJeArt[art].filter(l => alle || !grad || l.grad === grad).map(l => l.name));
  return [...new Set([...namen, ...dazu])];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { GRADE } = await import('./beurteilung/index.mjs');
  const args = process.argv.slice(2);
  const fail = (text) => { console.error(text); process.exit(1); };
  const wert = (name) => { const i = args.indexOf(name); return i < 0 ? null : args.splice(i, 2)[1] ?? ''; };
  const befehl = args.shift(), grad = wert('--grad'), datei = wert('--datei');
  const flags = new Set(args.filter(a => a.startsWith('--')));
  const namen = args.filter(a => !a.startsWith('--'));
  const AUFRUF = 'Aufruf: node tools/vorrat.mjs liste | ablegen <name …> [--flach] [--wuerfel] [--grad <grad>] '
    + '[--datei <datei>] | zurueckholen <name …> [--flach] [--wuerfel] [--grad <grad>] [--alle] [--datei <datei>]';
  const erlaubt = befehl === 'zurueckholen' ? ['--flach', '--wuerfel', '--alle'] : ['--flach', '--wuerfel'];
  if (!['liste', 'ablegen', 'zurueckholen'].includes(befehl) || [...flags].some(f => !erlaubt.includes(f))
    || grad === '' || datei === '' || (grad !== null && !GRADE.includes(grad))) {
    fail(grad && !GRADE.includes(grad) ? `Unbekannter Grad „${grad}“ (${GRADE.join(', ')})` : AUFRUF);
  }
  if (datei) {
    const text = readFileSync(datei, 'utf8').trim();
    namen.push(...(text.startsWith('[') ? JSON.parse(text) : text.split(/\r?\n/).map(x => x.trim()).filter(Boolean)));
  }
  const texte = lese();
  const kurz = (liste) => liste.join(', ') || '–';
  if (befehl === 'liste') {
    for (const [art, a] of Object.entries(ARTEN)) {
      const v = inhalt(texte[art], art);
      console.log(`${a.text} im Vorrat: ${v.length}`);
      for (const g of [...GRADE, null]) {
        const je = v.filter(l => (g === null ? !GRADE.includes(l.grad) : l.grad === g));
        if (je.length) console.log(`  ${g ?? 'ohne Grad'} (${je.length}): ${kurz(je.map(l => l.name))}`);
      }
    }
  } else {
    const arten = ['flach', 'wuerfel'].filter(art => flags.has(`--${art}`));
    if (!namen.length && !arten.length && !grad && !flags.has('--alle')) fail(AUFRUF);
    const hin = befehl === 'ablegen';
    // Die Level, unter denen die Gruppen wählen: beim Ablegen die im Spiel, beim Zurückholen die im Vorrat
    const levelJeArt = Object.fromEntries(Object.keys(ARTEN).map(art => [art, hin
      ? bloecke(spielBereich(texte.spiel, art).zeilen, 'index.html', false) : inhalt(texte[art], art)]));
    const gewaehlt = auswahl(levelJeArt, { namen, arten, grad, alle: flags.has('--alle') });
    if (!gewaehlt.length && !hin && flags.has('--alle')) {
      console.log('Der Vorrat ist leer, nichts zurückzuholen.');
      process.exit(0);
    }
    if (!gewaehlt.length) fail('Keine Level in dieser Auswahl.');
    let r;
    try {
      r = hin ? ablegen(texte, gewaehlt) : zurueckholen(texte, gewaehlt);
    } catch (e) {
      fail(e.message);
    }
    const geaendert = Object.keys(ARTEN).filter(art => r[hin ? 'abgelegt' : 'zurueck'][art].length);
    const schreibeVorrat = () => { for (const art of geaendert) writeFileSync(ARTEN[art].datei, r[art]); };
    if (hin) schreibeVorrat();
    writeFileSync(INDEX, r.spiel);
    if (!hin) schreibeVorrat();
    for (const art of geaendert) {
      const liste = r[hin ? 'abgelegt' : 'zurueck'][art];
      console.log(`${hin ? 'abgelegt' : 'zurückgeholt'}: ${liste.length} ${ARTEN[art].text}: ${kurz(liste)}`);
    }
    console.log(`geschrieben: index.html, ${geaendert.map(art => `tools/vorrat/${art}.js`).join(', ')}`);
  }
}
