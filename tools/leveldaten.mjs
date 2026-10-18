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
//   Screenshots der Kandidaten).
import { createHash } from 'node:crypto';

const TYPE_DE = { mirror: 'Spiegel', prism: 'Prisma', combiner: 'Kombinator' };
const str = (v) => `'${String(v).replace(/['\\]/g, '\\$&')}'`;
const mod8 = (v) => (((v || 0) % 8) + 8) % 8;

/** Ein Element als Zeile wie in LEVELS: type, x, z, dann dir, rot, color (ausser Weiss bei Quellen), fixed. */
function elementCode(e) {
  const parts = [`type: ${str(e.type)}`, `x: ${e.x}`, `z: ${e.z}`];
  if (e.dir !== undefined) parts.push(`dir: ${e.dir}`);
  if (e.rot !== undefined) parts.push(`rot: ${e.rot}`);
  if (e.color !== undefined && !(e.type === 'source' && e.color === 'white')) parts.push(`color: ${str(e.color)}`);
  if (e.fixed) parts.push('fixed: true');
  return `{ ${parts.join(', ')} }`;
}

/** Die Lösung als Kommentar („// Lösung: Spiegel (5,3) rot 3 · …“), auf etwa 100 Zeichen umbrochen. */
function loesungText(level) {
  const teile = Object.entries(level.solution).map(([k, v]) => {
    const e = level.elements.find(q => `${q.x},${q.z}` === k);
    return `${TYPE_DE[e.type]} (${k}) ${e.type === 'combiner' ? 'dir' : 'rot'} ${v}`;
  });
  const zeilen = [];
  let z = '// Lösung:';
  for (const t of teile) {
    if (`${z} ${t}`.length > 100) { zeilen.push(z.replace(/ ·$/, '')); z = '//  '; }
    z += ` ${t} ·`;
  }
  zeilen.push(z.replace(/ ·$/, ''));
  return zeilen;
}

/**
 * Ein Level als Block für LEVELS in index.html (Zeilen mit „\n“, ohne Zeilenende am Schluss): Lösungskommentar, dazu
 * die Zeilen aus kommentar (ohne „// “), Name und Grad, Elemente, Lösung.
 */
export function levelCode(level, kommentar = []) {
  return [
    '  {',
    ...[...loesungText(level), ...kommentar.map(k => `// ${k}`)].map(l => `    ${l}`),
    `    name: ${str(level.name)},${level.grad ? ` grad: ${str(level.grad)},` : ''}`,
    '    elements: [',
    ...level.elements.map(e => `      ${elementCode(e)},`),
    '    ],',
    `    solution: { ${Object.entries(level.solution).map(([k, v]) => `${str(k)}: ${v}`).join(', ')} },`,
    '  },',
  ].join('\n');
}

/**
 * Abdruck eines Levels: 8 Hex-Zeichen aus den Elementen, wie createBoard sie liest (Typ, Zelle, Stellung, Richtung,
 * Farbe mit Weiss als Vorgabe, fest), und der Lösung, je sortiert.
 */
export function abdruck(level) {
  const elemente = level.elements.map(e => JSON.stringify([e.type, e.x, e.z, mod8(e.rot), mod8(e.dir),
    e.color || 'white', !!e.fixed])).sort();
  const loesung = Object.entries(level.solution).map(([k, v]) => `${k}:${v}`).sort();
  return createHash('sha256').update(JSON.stringify({ elemente, loesung })).digest('hex').slice(0, 8);
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
  const kopf = html.indexOf('<head>');
  if (ende < 0 || kopf < 0 || kopf > ende) throw new Error('index.html: <head> oder LEVELS:END fehlt');
  const bloecke = levels.map(l => levelCode(l).replaceAll('\n', nl) + nl).join('');
  const nachKopf = kopf + '<head>'.length;
  return html.slice(0, nachKopf) + `${nl}<base href="${basis}">` + html.slice(nachKopf, ende) + bloecke
    + html.slice(ende);
}
