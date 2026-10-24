// Leveldaten als Text für index.html und ein Abdruck je Level (Ticket 23, Austausch): für tools/ordne-level.mjs, das
// neue Level ins Spiel schreibt, und tools/ki-tester/prepare.mjs, das Kandidaten ohne Platz im Spiel aufnimmt.
// - levelCode: ein Level als Block zwischen LEVELS:BEGIN und LEVELS:END, im Format der übrigen (Lösungskommentar,
//   Name und Grad, je Element eine Zeile, Lösung). Die Elemente bleiben in ihrer Reihenfolge, denn nach ihr zählt das
//   Spiel die Elemente durch.
// - abdruck und kandidatName: Ein neues Level hat vor der Genehmigung seines Namens noch keinen (Haltepunkt der
//   Tickets 23–26). Die KI-Tester beurteilen es darum unter einem Namen aus seinen Leveldaten, „Kandidat <Abdruck>“;
//   über ihn findet die Levelliste ihr Urteil, wenn das Level mit seinem Namen im Spiel steht. Der Abdruck hängt nur
//   daran, was das Spiel aus den Daten macht (Elemente wie in createBoard, Lösung), nicht an Name, Grad, Kommentaren
//   oder der Reihenfolge der Felder und Elemente.
// - seiteMitLeveln: index.html mit weiteren Leveln am Ende von LEVELS, als Seite an einem anderen Ort (für die
//   Screenshots der Kandidaten); seiteMitWuerfeln dasselbe am Ende von LEVELS_3D.
import { createHash } from 'node:crypto';

const TYPE_DE = { mirror: 'Spiegel', prism: 'Prisma', combiner: 'Kombinator' };
const str = (v) => `'${String(v).replace(/['\\]/g, '\\$&')}'`;
const mod8 = (v) => (((v || 0) % 8) + 8) % 8;

/**
 * Ein Element als Zeile wie in LEVELS: type, x, z, dann dir, rot, color (ausser Weiss bei Quellen), fixed; im Würfel
 * wie in LEVELS_3D: type, x, y, z, axis (ausser der Vorgabe y), dann dasselbe.
 */
function elementCode(e) {
  const parts = e.y === undefined ? [`type: ${str(e.type)}`, `x: ${e.x}`, `z: ${e.z}`]
    : [`type: ${str(e.type)}`, `x: ${e.x}`, `y: ${e.y}`, `z: ${e.z}`];
  if (e.axis !== undefined && e.axis !== 'y') parts.push(`axis: ${str(e.axis)}`);
  if (e.dir !== undefined) parts.push(`dir: ${e.dir}`);
  if (e.rot !== undefined) parts.push(`rot: ${e.rot}`);
  if (e.color !== undefined && !(e.type === 'source' && e.color === 'white')) parts.push(`color: ${str(e.color)}`);
  if (e.fixed) parts.push('fixed: true');
  return `{ ${parts.join(', ')} }`;
}

/** Die Zelle eines Elements wie in den Schlüsseln der Lösung: "x,z", im Würfel "x,y,z". */
const zelle = (e) => (e.y === undefined ? `${e.x},${e.z}` : `${e.x},${e.y},${e.z}`);

/**
 * Die Lösung als Kommentar („// Lösung: Spiegel (5,3) rot 3 · …“, im Würfel mit Zelle x,y,z und Drehachse), auf etwa 100 Zeichen umbrochen wie die übrigen
 * Level: Eine umbrochene Zeile endet mit „·“, die nächste beginnt eingerückt.
 */
function loesungText(level) {
  const teile = Object.entries(level.solution).map(([k, v]) => {
    const e = level.elements.find(q => zelle(q) === k);
    const achse = level.dim === 3 ? ` Achse ${e.axis || 'y'}` : '';
    return `${TYPE_DE[e.type]} (${k})${achse} ${e.type === 'combiner' ? 'dir' : 'rot'} ${v}`;
  });
  const zeilen = [];
  let z = '// Lösung:';
  for (const t of teile) {
    if (`${z} ${t}`.length > 100) { zeilen.push(z); z = '//  '; }
    z += ` ${t} ·`;
  }
  zeilen.push(z.replace(/ ·$/, ''));
  return zeilen;
}

/**
 * Ein Level als Block für LEVELS in index.html (Zeilen mit „\n“, ohne Zeilenende am Schluss): Lösungskommentar, dazu
 * die Zeilen aus kommentar (ohne „// “), Name und Grad, Elemente, Lösung. Ein Würfel-Level (dim 3) für LEVELS_3D hat
 * nach dem Namen dim und size, dazu wahlweise hint.
 */
export function levelCode(level, kommentar = []) {
  return [
    '  {',
    ...[...loesungText(level), ...kommentar.map(k => `// ${k}`)].map(l => `    ${l}`),
    `    name: ${str(level.name)},${level.dim === 3 ? ` dim: 3, size: ${level.size},` : ''}`
      + `${level.grad ? ` grad: ${str(level.grad)},` : ''}`,
    ...(level.dim === 3 && level.hint ? [`    hint: ${str(level.hint)},`] : []),
    '    elements: [',
    ...level.elements.map(e => `      ${elementCode(e)},`),
    '    ],',
    `    solution: { ${Object.entries(level.solution).map(([k, v]) => `${str(k)}: ${v}`).join(', ')} },`,
    '  },',
  ].join('\n');
}

/**
 * Abdruck eines Levels: 8 Hex-Zeichen aus den Elementen, wie createBoard sie liest (Typ, Zelle, Stellung, Richtung,
 * Farbe mit Weiss als Vorgabe, fest), und der Lösung, je sortiert. Im Würfel kommen Ebene, Drehachse (Vorgabe y) und
 * die Grösse dazu; ein flaches Level hat denselben Abdruck wie vor dem Würfel.
 */
export function abdruck(level) {
  const wuerfel = level.dim === 3;
  const elemente = level.elements.map(e => JSON.stringify([e.type, e.x, e.z, mod8(e.rot), mod8(e.dir),
    e.color || 'white', !!e.fixed, ...(wuerfel ? [e.y, e.axis || 'y'] : [])])).sort();
  const loesung = Object.entries(level.solution).map(([k, v]) => `${k}:${v}`).sort();
  const daten = wuerfel ? { elemente, loesung, size: level.size } : { elemente, loesung };
  return createHash('sha256').update(JSON.stringify(daten)).digest('hex').slice(0, 8);
}

/** Der Name, unter dem die KI-Tester ein neues Level vor der Genehmigung seines Namens beurteilen. */
export const kandidatName = (level) => `Kandidat ${abdruck(level)}`;

/**
 * index.html mit weiteren Leveln am Ende von LEVELS (vor LEVELS:END), für eine Seite an einem anderen Ort: basis ist
 * die URL des Ordners von index.html (mit „/“ am Ende); ein <base> gleich nach <head> lässt Skripte, Bilder und Himmel
 * von dort laden.
 */
export function seiteMitLeveln(html, levels, basis) {
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const ende = html.indexOf('  /* LEVELS:END */');
  if (ende < 0) throw new Error('index.html: LEVELS:END fehlt');
  return mitBasis(html, ende, levels.map(l => levelCode(l).replaceAll('\n', nl) + nl).join(''), basis);
}

/**
 * Wie seiteMitLeveln, für Würfel-Level: index.html mit weiteren Leveln am Ende von LEVELS_3D (vor dem „];“, das
 * „const LEVELS_3D = [“ schliesst), je Level eine Zeile JSON. Den Block im Format der übrigen (levelCode im Würfel)
 * braucht erst die Gruppe, die Level ins Spiel schreibt; für die Screenshots genügen die Daten.
 */
export function seiteMitWuerfeln(html, levels, basis) {
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const start = html.indexOf('const LEVELS_3D = [');
  const ende = start < 0 ? -1 : html.indexOf(`${nl}];`, start) + nl.length;
  if (ende < nl.length) throw new Error('index.html: const LEVELS_3D = [ … ]; fehlt');
  return mitBasis(html, ende, levels.map(l => `  ${JSON.stringify(l)},${nl}`).join(''), basis);
}

/** html mit text an der Stelle ende und einem <base href="basis"> gleich nach <head> (davor). */
function mitBasis(html, ende, text, basis) {
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const kopf = html.indexOf('<head>');
  if (kopf < 0 || kopf > ende) throw new Error('index.html: <head> fehlt oder steht nach den Leveln');
  const nachKopf = kopf + '<head>'.length;
  return html.slice(0, nachKopf) + `${nl}<base href="${basis}">` + html.slice(nachKopf, ende) + text + html.slice(ende);
}
