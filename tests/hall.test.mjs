// Prüft die Impulsantwort des Halls (das Modul src/hall.js mit mulberry32 aus src/zufall.js; bis Ticket 03 von
// .scratch/umbau/ der Bereich HALL in index.html), Ticket 05 von .scratch/leistung/: Seit dem Umbau rechnet sie ein
// Worker vorab als Float32Arrays (hallImpulse), früher rechnete audio._impulse sie beim ersten Klick direkt in den
// AudioBuffer. Das Rauschen kommt aus mulberry32 mit festem Samen 5, die Kurve ist also bei jedem Laden dieselbe und
// lässt sich bitgenau vergleichen: Die Referenz (SHA-256 über die Float32-Bytes links, dann rechts, und Stichproben)
// stammt aus der alten Berechnung im Stand 963177d, mit einem nachgebauten AudioBuffer (getChannelData als
// Float32Array) gerechnet. Den gebauten Worker (dist/assets/hall-worker-….js) rechnet tests/logic.test.mjs nach.
// Aufruf: node tests/hall.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { HALL_SECONDS as seconds, hallImpulse } from '../src/hall.js';
import { mulberry32 } from '../src/zufall.js';
import { ausText, module } from '../tools/seitenmodule.mjs';

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
test('Seite: die Module rechnen auch als Text ausgeführt dasselbe (hallData ohne Worker, in Stücken)', () => {
  // als Skript ausgeführt (zufall, dann hall), wie bis Ticket 04 in der Seite
  const text = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  const { mulberry32: m } = ausText(text('src/zufall.js'), 'src/zufall.js');
  const seite = ausText(text('src/hall.js'), 'src/hall.js', { mulberry32: m });
  assert.equal(seite.HALL_SECONDS, seconds);
  const steps = seite.hallImpulse(44100, seite.HALL_SECONDS);
  let r;
  do r = steps.next(); while (!r.done);
  assert.equal(r.value[1][1000], REFERENZ[44100][2][3]);
  assert.equal(m(5)(), mulberry32(5)());
  // die Seite importiert das Modul (seit Ticket 04, vorher setzte sie seinen Text ein)
  assert.ok(module().some((p) => /^import \{[^}]*\bhallImpulse\b[^}]*\} from '(\.\.?\/)+hall\.js';/m.test(text(p))),
    'kein Modul der Seite importiert hallImpulse aus src/hall.js');
});
test('Worker (src/hall-worker.ts): die Länge aus dem Modul, die Puffer übertragen', () => {
  const w = readFileSync(new URL('../src/hall-worker.ts', import.meta.url), 'utf8');
  assert.match(w, /^import \{ HALL_SECONDS, hallImpulse \} from '\.\/hall\.js';$/m);
  assert.match(w, /hallImpulse\(rate, HALL_SECONDS\)/);
  assert.match(w, /postMessage\(r\.value, r\.value\.map\(\(d\) => d\.buffer\)\)/);
});
console.log(`\n${passed} Tests bestanden${process.exitCode ? ', mit Fehlern' : ''}.`);
