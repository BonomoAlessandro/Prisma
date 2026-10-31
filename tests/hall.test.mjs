// Prüft die Impulsantwort des Halls aus index.html (Bereich HALL:BEGIN … HALL:END, dazu mulberry32), Ticket 05 von
// .scratch/leistung/: Seit dem Umbau rechnet sie ein Worker vorab als Float32Arrays (hallImpulse), früher rechnete
// audio._impulse sie beim ersten Klick direkt in den AudioBuffer. Das Rauschen kommt aus mulberry32 mit festem Samen 5,
// die Kurve ist also bei jedem Laden dieselbe und lässt sich bitgenau vergleichen: Die Referenz (SHA-256 über die
// Float32-Bytes links, dann rechts, und Stichproben) stammt aus der alten Berechnung im Stand 963177d, mit einem
// nachgebauten AudioBuffer (getChannelData als Float32Array) gerechnet.
// Aufruf: node tests/hall.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const begin = html.indexOf('/* HALL:BEGIN'), end = html.indexOf('/* HALL:END');
assert.ok(begin > 0 && end > begin, 'HALL-Marker nicht gefunden');
const mulberry = html.match(/function mulberry32\(seed\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(mulberry, 'mulberry32 nicht gefunden');
const seconds = +html.match(/const HALL_SECONDS = ([\d.]+);/)?.[1];
const { hallImpulse } = new Function(`const HALL_SECONDS = ${seconds};\n${mulberry}\n${html.slice(begin, end)}
return { hallImpulse };`)();

// je Abtastrate: Länge, SHA-256 und Stichproben [links 0, links 1, rechts 0, rechts 1000, links letzter] der alten Kurve
const REFERENZ = {
  44100: [141120, '9ab816d751fbc54e9bac8d44c62ec940ce4526dda7d7bd03acee335b001a2618',
    [0.3795498311519623, 0.5454741716384888, -0.337301641702652, 0.1325770914554596, -3.505835040690128e-18]],
  48000: [153600, 'ba341507dc2e45d5cd5c13451af52e0266a4c566c0c6b4e15908557beab439dd',
    [0.3795498311519623, 0.54547518491745, 0.019877243787050247, 0.7772428393363953, 2.3197534162137138e-17]],
  96000: [307200, 'b7dd8e560f89acc9c575755057ced99bcc880c5307903e94cc914ff6cdbed7d8',
    [0.3795498311519623, 0.5454808473587036, 0.7637283802032471, -0.2920411229133606, 2.7169334517539107e-18]],
};

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ', name); }
  catch (e) { console.error('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
}
/** Bis zum Ende durchlaufen; liefert die Daten und die Zahl der Stücke. */
function rechne(rate, step) {
  const steps = hallImpulse(rate, seconds, step);
  let r, stuecke = 0;
  while (!(r = steps.next()).done) stuecke++;
  return { data: r.value, stuecke };
}

console.log('Hall');
test('Länge des Halls wie früher: 3,2 s', () => assert.equal(seconds, 3.2));
for (const [rate, [len, sha, proben]] of Object.entries(REFERENZ)) {
  test(`${rate} Hz: bitgleich mit der alten Berechnung`, () => {
    const { data } = rechne(+rate);
    assert.equal(data.length, 2);
    for (const d of data) { assert.ok(d instanceof Float32Array); assert.equal(d.length, len); }
    const h = createHash('sha256');
    for (const d of data) h.update(new Uint8Array(d.buffer));
    assert.equal(h.digest('hex'), sha);
    const [l, r] = data;
    assert.deepEqual([l[0], l[1], r[0], r[1000], l[len - 1]], proben);
  });
}
test('Stückgrösse ändert nichts, Stücke wie verlangt', () => {
  const a = rechne(48000), b = rechne(48000, 1000);
  assert.equal(a.stuecke, 2 * Math.ceil(153600 / 8192));
  assert.equal(b.stuecke, 2 * Math.ceil(153600 / 1000));
  for (let ch = 0; ch < 2; ch++) assert.deepEqual(a.data[ch], b.data[ch]);
});
test('Worker: der Quelltext von hallImpulse und mulberry32 läuft für sich', () => {
  // so baut hallData den Worker: ohne die Konstanten des Spiels, die Länge kommt als Argument
  const f = new Function(`${mulberry}\n${hallImpulse}\nreturn hallImpulse;`)();
  const steps = f(44100, seconds);
  let r;
  do r = steps.next(); while (!r.done);
  assert.equal(r.value[1][1000], REFERENZ[44100][2][3]);
});
console.log(`\n${passed} Tests bestanden${process.exitCode ? ', mit Fehlern' : ''}.`);
