// Tests des Einstiegs der Beurteilung (Spec „Beurteilung“): Level hinein, Beurteilung heraus, mit allen Teilen der Spec.
// Noch nicht berechnete Teile müssen als solche erkennbar sein.
// Aufruf: node tests/beurteilung/einstieg.test.mjs (alle Tests der Beurteilung: node tests/beurteilung.test.mjs)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beurteile, TEILE } from '../../tools/beurteilung/index.mjs';
import { test, miniLevel, heutigeLevel } from './helfer.mjs';

console.log('Beurteilung: Einstieg');

const glossar = readFileSync(new URL('../../CONTEXT.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** Die Begriffe im Glossar (Zeilen „**Begriff**:“), nur im Abschnitt titel, falls angegeben. */
function begriffe(titel = null) {
  let text = glossar;
  if (titel) {
    const start = glossar.indexOf(`\n## ${titel}\n`);
    assert.ok(start >= 0, `CONTEXT.md: Abschnitt „${titel}“ fehlt`);
    const end = glossar.indexOf('\n## ', start + 1);
    text = glossar.slice(start, end < 0 ? undefined : end);
  }
  return [...text.matchAll(/^\*\*(.+?)\*\*:/gm)].map(m => m[1]);
}
const imGlossar = begriffe();
/** Die Teile mit einem Wert statt mit Funden je Begriff. */
const WERTE = Object.keys(TEILE).filter(teil => !Array.isArray(TEILE[teil]));

const einfach = miniLevel([
  { type: 'source', x: 0, z: 3, dir: 0 },
  { type: 'mirror', x: 3, z: 3, rot: 1 },
  { type: 'target', x: 3, z: 6, color: 'white' },
], 'Ein Spiegel');
/** Beurteilungen zum Prüfen der Form: ein Mini-Level und die 150 heutigen Level. */
const alle = () => [{ name: einfach.name, b: beurteile(einfach) }, ...heutigeLevel().map(h => ({ name: h.level.name, b: h.beurteilung }))];

test('Der Einstieg liefert alle Teile der Spec: Schwierigkeit, Spielwert, Kernideen, Mischziele, Ausschlüsse, dazu offen', () => {
  const b = beurteile(einfach);
  for (const teil of ['schwierigkeit', 'spielwert', 'kernideen', 'mischziele', 'ausschluesse', 'offen']) assert.ok(teil in b, teil);
  for (const teil of ['kernideen', 'ausschluesse', 'offen']) assert.ok(Array.isArray(b[teil]), teil);
});

test('Die Teile tragen die Begriffe des Glossars: Ausschlussgründe aus „Was Spass verdirbt“, Kernideen aus „Kernideen“', () => {
  assert.deepEqual(TEILE.ausschluesse, begriffe('Was Spass verdirbt'));
  assert.deepEqual(TEILE.kernideen, begriffe('Kernideen'));
  for (const teil of WERTE) assert.ok(imGlossar.includes(TEILE[teil]), teil);
});

test('Noch nicht berechnete Teile stehen mit ihrem Glossarbegriff in offen: ein Wert ist dann null, ein Begriff ohne Funde', () => {
  for (const { name, b } of alle()) {
    assert.ok(b.offen.every(begriff => imGlossar.includes(begriff)), `${name}: ${b.offen}`);
    for (const teil of WERTE) {
      assert.equal(b[teil] === null, b.offen.includes(TEILE[teil]), `${name}: ${teil}`);
    }
    for (const f of [...b.kernideen, ...b.ausschluesse]) assert.ok(!b.offen.includes(f.begriff), `${name}: ${f.begriff} ist offen`);
  }
});

test('Jeder Ausschluss und jede Kernidee trägt den Glossarbegriff und eine Begründung', () => {
  for (const { name, b } of alle()) {
    for (const [teil, list] of [['ausschluesse', b.ausschluesse], ['kernideen', b.kernideen]]) {
      for (const f of list) {
        assert.ok(TEILE[teil].includes(f.begriff), `${name}: ${f.begriff}`);
        assert.ok(typeof f.begruendung === 'string' && f.begruendung.trim(), `${name}: ${f.begriff} ohne Begründung`);
      }
    }
  }
});

test('Die Beurteilung verändert das Level nicht und liefert bei gleicher Eingabe dasselbe', () => {
  const level = structuredClone(einfach);
  const first = beurteile(level, { grad: 'mittel' });
  assert.deepEqual(level, einfach);
  assert.deepEqual(beurteile(level, { grad: 'mittel' }), first);
});

test('Ohne Lösung oder mit unbekanntem Grad meldet der Einstieg einen Fehler', () => {
  const { solution, ...ohne } = einfach;
  assert.throws(() => beurteile(ohne), /Lösung/);
  assert.throws(() => beurteile(einfach, { grad: 'Mittel' }), /Grad/);
  for (const grad of ['leicht', 'mittel', 'schwer', 'sehr schwer']) beurteile(einfach, { grad });
});

test('Zwischenstand: erst ohne die teuren Regeln, dann voll mit derselben Map ergibt dasselbe wie voll allein', () => {
  // Die ersten 20 der heutigen Reihenfolge (klein, also schnell), verglichen mit ihrer vollen Beurteilung allein
  for (const { level, grad } of heutigeLevel().slice(0, 20)) {
    const beurteilung = beurteile(level, { grad });
    const zwischenstand = new Map();
    const vorab = beurteile(level, { grad, teuer: false, zwischenstand });
    assert.deepEqual(vorab, beurteile(level, { grad, teuer: false }), level.name);
    assert.deepEqual(beurteile(level, { grad, zwischenstand }), beurteilung, level.name);
  }
});

test('Zwischenstand: Für ein anderes oder verändertes Level oder einen anderen Grad meldet er einen Fehler', () => {
  const zwischenstand = new Map();
  beurteile(einfach, { grad: 'leicht', teuer: false, zwischenstand });
  assert.throws(() => beurteile(einfach, { grad: 'mittel', zwischenstand }), /Zwischenstand/);
  assert.throws(() => beurteile(structuredClone(einfach), { grad: 'leicht', zwischenstand }), /Zwischenstand/);
  beurteile(einfach, { grad: 'leicht', zwischenstand });
  // Dasselbe Objekt, nach der Vorprüfung verändert: Der Spiegel steht in der Lösung anders
  const level = structuredClone(einfach), veraendert = new Map();
  beurteile(level, { grad: 'leicht', teuer: false, zwischenstand: veraendert });
  level.solution['3,3'] = 3;
  assert.throws(() => beurteile(level, { grad: 'leicht', zwischenstand: veraendert }), /verändert/);
});
