// Level-Generator für PRISMA.
// Baut Level konstruktiv: Quellen setzen, Strahlen durch zufällig platzierte Elemente führen,
// Ziele an die Strahlenden setzen (mit genau der Farbe, die dort ankommt) – damit ist die
// Ausgangsstellung eine Lösung. Danach werden zusätzliche Lösungen mit Blockern auf ihren Wegen
// ausgeschlossen, funktionslose Teile entfernt und die Startstellung verdreht.
//
// Aufruf: node tools/generate.mjs <profil> <anzahl> [startseed] [maxseeds]   (Profile: tools/profiles.mjs)
//         → JSON-Zeilen { level, metrics, seed } auf stdout, Zusammenfassung auf stderr
import { L, solve, metrics, litCells, keyOf } from './solver.mjs';
import { quality, passes } from './quality.mjs';
import { PROFILES } from './profiles.mjs';

const SIZE = 7;
const SOURCE_COLORS = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta'];

/** Deterministischer Zufall (mulberry32) – gleicher Seed, gleiches Level. */
export function rng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const R = {
    next,
    int: (a, b) => a + Math.floor(next() * (b - a + 1)), // a … b
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    /** Fisher-Yates – unabhängig von der Sortier-Implementierung der JS-Engine */
    shuffle: (arr) => {
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
      return arr;
    },
  };
  return R;
}

const inBoard = (x, z) => x >= 0 && z >= 0 && x < SIZE && z < SIZE;
const key = (x, z) => x + ',' + z;
const asLevel = (elements, name = '') => ({ name, elements: elements.map(e => ({ ...e })) });
const traceEls = (elements) => L.traceBeams(L.createBoard(asLevel(elements)));
const rotatable = (e) => L.isRotatable({ ...e, fixed: !!e.fixed });
const rotOf = (e) => (e.type === 'combiner' ? e.dir : e.rot);
const withRot = (e, v) => (e.type === 'combiner' ? { ...e, dir: v } : { ...e, rot: v });
const per = (e) => (e.type === 'mirror' ? 4 : 8);

/** Zellen, durch die ein Abschnitt läuft (ohne Start- und Endzelle), mit Richtung und Farbe. */
function segmentCells(s) {
  const dx = Math.sign(Math.round((s.x1 - s.x0) * 1000)), dz = Math.sign(Math.round((s.z1 - s.z0) * 1000));
  const dir = L.DIRS.findIndex(([a, b]) => a === dx && b === dz);
  const cells = [];
  let x = s.x0 + dx, z = s.z0 + dz;
  while (inBoard(x, z) && (Math.abs(x - s.x0) < Math.abs(s.x1 - s.x0) - 0.6 || Math.abs(z - s.z0) < Math.abs(s.z1 - s.z0) - 0.6)) {
    cells.push({ x, z, dir, color: s.color });
    x += dx; z += dz;
  }
  return cells;
}
const pathCells = (r) => new Set(r.segments.flatMap(segmentCells).map(c => key(c.x, c.z)));

/** Sinnvolle Stellung für ein Element, das ein Strahl in Richtung dir erreicht. */
function chooseRotation(type, dir, R) {
  if (type === 'mirror') {
    // ablenken – nicht parallel (schluckt) und nicht senkrecht (wirft zurück)
    return R.pick([0, 1, 2, 3].filter(r => { const nd = L.reflectOnMirror(dir, r); return nd !== dir && nd !== (dir + 4) % 8; }));
  }
  if (type === 'prism') return (dir + R.pick([-2, -1, 0, 1, 2]) + 8) % 8;
  return R.int(0, 7);
}

/**
 * Ein Level nach Profil erzeugen. Liefert { level, metrics, seed } oder { fail: Grund }.
 * spec: siehe profiles.mjs
 */
export function generateOne(spec, seed) {
  const R = rng(seed);
  const els = [];
  const occupied = new Set();
  const put = (e) => { els.push(e); occupied.add(key(e.x, e.z)); };
  const remove = (e) => { els.splice(els.indexOf(e), 1); occupied.delete(key(e.x, e.z)); };
  const fail = (why) => ({ fail: why });

  // ---- Quellen: am Rand, Blick ins Feld; der erste Treffer darf keine andere Quelle sein
  const nSources = R.int(...spec.sources);
  for (let i = 0; i < nSources; i++) {
    for (let tries = 0; tries < 40; tries++) {
      const edge = R.int(0, 3), t = R.int(0, SIZE - 1);
      const [x, z] = [[0, t], [SIZE - 1, t], [t, 0], [t, SIZE - 1]][edge];
      if (occupied.has(key(x, z))) continue;
      const dir = ([0, 4, 2, 6][edge] + (spec.diagonalSources && R.chance(spec.diagonalSources) ? R.pick([-1, 1]) : 0) + 8) % 8;
      const [dx, dz] = L.DIRS[dir];
      if (!inBoard(x + dx, z + dz)) continue;
      let cx = x + dx, cz = z + dz, blocked = false;
      while (inBoard(cx, cz)) { if (occupied.has(key(cx, cz))) { blocked = true; break; } cx += dx; cz += dz; }
      if (blocked) continue; // Quelle würde direkt in eine andere Quelle strahlen
      const color = spec.colorSources && R.chance(spec.colorSources) ? R.pick(SOURCE_COLORS) : null;
      put({ type: 'source', x, z, dir, ...(color ? { color } : {}) });
      break;
    }
  }

  // ---- Elemente entlang der Strahlen platzieren (Kombinatoren zuletzt: brauchen zwei Strahlen)
  const budget = [];
  for (const [type, range] of Object.entries(spec.place)) for (let i = R.int(...range); i > 0; i--) budget.push(type);
  R.shuffle(budget);
  budget.sort((a, b) => (a === 'combiner') - (b === 'combiner'));
  for (const type of budget) {
    const cells = traceEls(els).segments.flatMap(segmentCells).filter(c => !occupied.has(key(c.x, c.z)));
    if (!cells.length) continue;
    if (type === 'combiner') {
      const by = new Map();
      for (const c of cells) { const k = key(c.x, c.z); if (!by.has(k)) by.set(k, []); by.get(k).push(c); }
      const cross = [...by.values()].filter(list => new Set(list.map(c => c.dir)).size >= 2);
      if (!cross.length) continue;
      const list = R.pick(cross);
      put({ type: 'combiner', x: list[0].x, z: list[0].z, dir: R.int(0, 7) });
      continue;
    }
    const c = R.pick(cells);
    if (type === 'filter') {
      const subsets = [1, 2, 3, 4, 5, 6].filter(m => (m & c.color) === m && m !== c.color); // echte Teilmenge
      if (!subsets.length) continue;
      put({ type: 'filter', x: c.x, z: c.z, color: L.COLOR_NAMES[R.pick(subsets)] });
      continue;
    }
    if (type === 'prism' && [1, 2, 4].includes(c.color)) continue; // Prisma auf Mischlicht – sonst nur Umlenkung
    const v = chooseRotation(type, c.dir, R);
    put({ type, x: c.x, z: c.z, ...(type === 'combiner' ? { dir: v } : { rot: v }) });
  }

  // ---- feste Spiegel auf den Strahlwegen (engen ein, gehören zur Lösung)
  for (let i = R.int(...(spec.fixedOnPath || [0, 0])); i > 0; i--) {
    const cells = traceEls(els).segments.flatMap(segmentCells).filter(c => !occupied.has(key(c.x, c.z)));
    if (!cells.length) break;
    const c = R.pick(cells);
    put({ type: 'mirror', x: c.x, z: c.z, rot: chooseRotation('mirror', c.dir, R), fixed: true });
  }

  // ---- Ziele: an Strahlenden oder kurz davor; Farbe aus den tatsächlichen Treffern
  let r = traceEls(els);
  // je endendem Strahl höchstens ein Ziel (ein zweites läge im Schatten des ersten). Strahlenden sind
  // Strahlen, die das Feld verlassen oder geschluckt werden (Quelle, Blocker, Spiegelkante, Prisma) –
  // das Ziel kommt dann kurz vor diese Stelle.
  const at = (x, z) => x.toFixed(3) + ',' + z.toFixed(3);
  const absorbed = new Set(r.events.filter(e => e.kind === 'absorb').map(e => at(e.x, e.z)));
  const ends = [];
  for (const s of r.segments) {
    if (!s.fade && !absorbed.has(at(s.x1, s.z1))) continue;
    const cells = segmentCells(s).filter(c => !occupied.has(key(c.x, c.z)));
    if (cells.length) ends.push(R.pick(cells.slice(-3))); // eine der letzten Zellen vor der Kante
  }
  const cand = R.shuffle([...new Map(ends.map(c => [key(c.x, c.z), c])).values()]);
  const wanted = R.int(...spec.targets);
  for (const c of cand) {
    if (els.filter(e => e.type === 'target').length >= wanted) break;
    if (occupied.has(key(c.x, c.z))) continue;
    put({ type: 'target', x: c.x, z: c.z, color: 'white' });
  }
  for (let pass = 0; pass < 5; pass++) {
    const b = L.createBoard(asLevel(els));
    r = L.traceBeams(b);
    let changed = false;
    for (const t of b.elements.filter(e => e.type === 'target')) {
      const e = els.find(q => q.type === 'target' && q.x === t.x && q.z === t.z);
      const hit = r.hits.get(t.id) || 0;
      if (!hit) { remove(e); changed = true; continue; }
      if (e.color !== L.COLOR_NAMES[hit]) { e.color = L.COLOR_NAMES[hit]; changed = true; }
    }
    if (!changed) break;
  }
  if (els.filter(e => e.type === 'target').length < spec.targets[0]) return fail('zu wenige Ziele');

  // ---- drehbare Elemente und Filter ohne Licht entfernen (Stellung egal bzw. ohne Wirkung) –
  //      z. B. wenn ein später gesetztes Ziel den Strahl davor abschneidet
  for (let pass = 0; pass < 4; pass++) {
    const b = L.createBoard(asLevel(els));
    const lit = litCells(L.traceBeams(b), b);
    const dark = els.filter(e => (rotatable(e) || e.type === 'filter') && !lit.has(key(e.x, e.z)));
    if (!dark.length) break;
    dark.forEach(remove);
  }
  if (!traceEls(els).solved) return fail('Konstruktion nicht gelöst');

  // ---- Lösung festhalten; Lockvögel auf Zellen, über die falsche Stellungen das Licht oft schicken
  //      (abseits des Lösungswegs) – so kommen sie beim Probieren tatsächlich ins Spiel
  const solution = Object.fromEntries(els.filter(rotatable).map(e => [key(e.x, e.z), rotOf(e)]));
  const solCells = pathCells(traceEls(els));
  const wrongHits = new Map();
  solve(asLevel(els), { prune: false, maxNodes: 1e5, collect: 0, onLeaf: (res) => {
    if (res.solved) return;
    for (const k of pathCells(res)) if (!occupied.has(k) && !solCells.has(k)) wrongHits.set(k, (wrongHits.get(k) || 0) + 1);
  } });
  const hot = [...wrongHits].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k);
  for (let i = R.int(...(spec.decoys || [0, 0])); i > 0 && hot.length; i--) {
    const k = hot.splice(R.int(0, Math.min(3, hot.length - 1)), 1)[0];
    if (occupied.has(k)) continue;
    const [x, z] = k.split(',').map(Number);
    put(R.chance(0.5) ? { type: 'blocker', x, z } : { type: 'mirror', x, z, rot: R.int(0, 3), fixed: true });
  }

  // ---- Eindeutigkeit: abweichende Strahlbilder auf einer nur dort genutzten Zelle blockieren
  for (let rep = 0; ; rep++) {
    const res = solve(asLevel(els), { collect: 6, maxNodes: 4e5 });
    if (res.aborted) return fail('Suche zu gross');
    if (res.count === 1) break;
    if (rep >= 12 || !spec.repairs) return fail('nicht eindeutig');
    const alt = res.solutions.find(s => s.free || Object.entries(s.set).some(([k, v]) => k in solution && v !== solution[k]));
    if (!alt) return fail('keine Alternative greifbar');
    const altEls = els.map(e => (rotatable(e) && key(e.x, e.z) in alt.set ? withRot(e, alt.set[key(e.x, e.z)]) : e));
    const altCells = pathCells(traceEls(altEls));
    const cur = pathCells(traceEls(els));
    const spots = [...altCells].filter(k => !cur.has(k) && !occupied.has(k));
    if (spots.length) {
      const [x, z] = R.pick(spots).split(',').map(Number);
      put({ type: 'blocker', x, z });
      continue;
    }
    // Kein freies Feld auf dem anderen Weg: einen Spiegel, der sich zwischen den Lösungen unterscheidet,
    // in seiner Lösungsstellung festsetzen. Nur Spiegel – nur sie zeigen im Spiel, dass sie fest sind
    // (Teller ohne Drehmarken); ein festes Prisma oder ein fester Kombinator sähe drehbar aus.
    const diff = els.filter(e => e.type === 'mirror' && rotatable(e) && key(e.x, e.z) in alt.set && alt.set[key(e.x, e.z)] !== solution[key(e.x, e.z)] % per(e));
    if (!diff.length) return fail('Alternative nicht blockierbar');
    const e = R.pick(diff);
    els[els.indexOf(e)] = { ...e, fixed: true };
    delete solution[key(e.x, e.z)];
  }

  // ---- funktionslose Teile: feste Elemente/Blocker, die in keiner Stellung Licht bekommen, entfernen;
  //      Ziele, die in jeder Stellung erfüllt sind, machen das Level wertlos
  const everLit = new Set();
  const targetsAlways = new Map(); // "x,z" → in allen Blättern erfüllt
  const full = solve(asLevel(els), {
    prune: false, maxNodes: 3e5, collect: 0,
    onLeaf: (res, board) => {
      for (const k of litCells(res, board)) everLit.add(k);
      for (const t of board.elements.filter(e => e.type === 'target')) {
        const k = keyOf(t);
        targetsAlways.set(k, (targetsAlways.get(k) ?? true) && res.satisfied.has(t.id));
      }
    },
  });
  if (full.aborted) return fail('Vollsuche zu gross'); // sonst liefen die Prüfungen unten nur über einen Teil
  if ([...targetsAlways.values()].some(Boolean)) return fail('Ziel immer erfüllt');
  for (const e of els.filter(q => (q.type === 'blocker' || q.fixed || q.type === 'filter') && !everLit.has(key(q.x, q.z)))) remove(e);

  // ---- Blocker, die nichts einschränken: probeweise entfernen; bleibt die Lösung eindeutig, wegbleiben lassen
  for (const blk of els.filter(e => e.type === 'blocker')) {
    const without = els.filter(e => e !== blk);
    const res = solve(asLevel(without), { collect: 1, maxNodes: 4e5 });
    if (!res.aborted && res.count === 1) remove(blk);
  }
  if (els.filter(e => e.type === 'blocker').length > (spec.maxBlockers ?? 4)) return fail('zu viele Blocker');

  // ---- überflüssige Quellen: bleibt das Level ohne eine Quelle gelöst, war sie unnötig
  for (const src of els.filter(e => e.type === 'source')) {
    if (traceEls(els.filter(e => e !== src)).solved) return fail('Quelle überflüssig');
  }

  // ---- Startstellung: jedes drehbare Element weg von der Lösung; höchstens ein Ziel erfüllt
  //      (keins, wenn es nur ein Ziel gibt)
  const nTargets = els.filter(e => e.type === 'target').length;
  for (let tries = 0; ; tries++) {
    if (tries >= 40) return fail('keine gute Startstellung');
    for (let i = 0; i < els.length; i++) {
      const e = els[i];
      if (!rotatable(e)) continue;
      let v;
      do { v = R.int(0, per(e) - 1); } while (v === solution[key(e.x, e.z)] % per(e));
      els[i] = withRot(e, v);
    }
    const s0 = traceEls(els);
    if (!s0.solved && s0.satisfied.size <= (nTargets > 1 ? 1 : 0)) break;
  }

  const level = { name: '', elements: els.map(e => ({ ...e })), solution };
  const m = metrics(level);
  if (!m.unique) return fail('am Ende nicht eindeutig');
  const norm = (sol) => JSON.stringify(Object.entries(sol).map(([k, v]) => [k, v % per(els.find(e => key(e.x, e.z) === k))]).sort());
  if (norm(m.solution) !== norm(solution)) return fail('Lösung weicht ab');
  if (m.rotatable < spec.rotatable[0] || m.rotatable > spec.rotatable[1]) return fail('Anzahl drehbarer Elemente');
  if (spec.requireKinds && !spec.requireKinds.every(k => m.kinds.includes(k))) return fail('Elementtyp fehlt');
  if (m.clicks < (spec.minClicks || 1)) return fail('zu wenige Klicks');
  // Qualität: Feld genutzt, Quellen gekoppelt, Zusammenspiel (siehe quality.mjs)
  const q = quality(level);
  const why = passes(q);
  if (why.length) return fail(why[0]);
  return { level, metrics: m, quality: q, seed };
}

// ---- Kommandozeile
// node tools/generate.mjs <profil> <anzahl> [startseed] [maxseeds] [--jobs N] [--time Sekunden]
// --time: nach so vielen Sekunden mit den bis dahin gefundenen Leveln aufhören.
// Mit --jobs laufen N Prozesse parallel (Seeds verzahnt: startseed + i, Schrittweite N). Welche Seeds
// zuerst fertig werden, hängt vom Zeitablauf ab – die Auswahl ist daher nicht reproduzierbar, jedes
// einzelne Level aber schon (gleicher Seed, gleiches Level). Ausgabe nach Seed sortiert.
if (process.argv[1] && process.argv[1].endsWith('generate.mjs')) {
  const args = process.argv.slice(2);
  const jobsAt = args.indexOf('--jobs');
  const jobs = jobsAt >= 0 ? Number(args.splice(jobsAt, 2)[1]) : 1;
  if (!Number.isInteger(jobs) || jobs < 1) { console.error('--jobs braucht eine ganze Zahl ≥ 1'); process.exit(1); }
  const timeAt = args.indexOf('--time');
  const seconds = timeAt >= 0 ? Number(args.splice(timeAt, 2)[1]) : Infinity;
  if (!(seconds > 0)) { console.error('--time braucht eine Zahl > 0'); process.exit(1); }
  const deadline = Date.now() + seconds * 1000;
  const [profileId, count = '20', startSeed = '1', maxSeeds = '20000'] = args;
  const stride = +(process.env.GEN_STRIDE || 1);
  const spec = PROFILES.find(p => p.id === profileId);
  if (!spec) {
    console.error('Profil unbekannt:', profileId, '– verfügbar:', PROFILES.map(p => p.id).join(', '));
    process.exit(1);
  }
  process.stdout.on('error', () => process.exit(0)); // z. B. "| head" schliesst die Pipe
  const summary = (found, tried, reasons) => `Profil ${profileId}: ${found} Level aus ${tried} Seeds` +
    (reasons.size ? ' · verworfen: ' + [...reasons].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') : '');

  if (jobs > 1) {
    // Kinder melden Funde als JSON-Zeilen und regelmässig ihren Zählerstand ({"stats": …})
    const { spawn } = await import('node:child_process');
    const results = [], stats = new Map();
    const kids = [];
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      kids.forEach(k => k.kill());
      results.sort((a, b) => a.seed - b.seed).slice(0, +count).forEach(g => console.log(JSON.stringify(g)));
      const reasons = new Map();
      let tried = 0;
      for (const st of stats.values()) {
        tried += st.tried;
        for (const [k, v] of Object.entries(st.reasons)) reasons.set(k, (reasons.get(k) || 0) + v);
      }
      // Zählerstände kommen alle 10 Seeds – nach dem Abbruch der Kinder daher "mindestens"
      console.error(summary(Math.min(results.length, +count), tried, reasons).replace(' aus ', ' aus mindestens ') + ` (${jobs} Prozesse)`);
    };
    if (Number.isFinite(seconds)) setTimeout(finish, seconds * 1000).unref();
    let alive = jobs;
    for (let i = 0; i < jobs; i++) {
      const k = spawn(process.execPath, [process.argv[1], profileId, count, String(+startSeed + i), String(Math.ceil(+maxSeeds / jobs))],
        { env: { ...process.env, GEN_STRIDE: String(jobs), GEN_CHILD: '1' }, stdio: ['ignore', 'pipe', 'ignore'] });
      let buf = '';
      k.stdout.on('data', (d) => {
        buf += d;
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
          if (!line) continue;
          const msg = JSON.parse(line);
          if (msg.stats) stats.set(i, msg.stats);
          else results.push(msg);
          if (results.length >= +count) finish();
        }
      });
      k.on('exit', () => { if (--alive === 0) finish(); });
      kids.push(k);
    }
  } else {
    let found = 0, tried = 0;
    const reasons = new Map();
    const child = !!process.env.GEN_CHILD;
    const report = () => console.log(JSON.stringify({ stats: { tried, reasons: Object.fromEntries(reasons) } }));
    for (let seed = +startSeed; found < +count && tried < +maxSeeds && Date.now() < deadline; seed += stride, tried++) {
      const g = generateOne(spec, seed);
      if (child && (tried + 1) % 10 === 0) console.log(JSON.stringify({ stats: { tried: tried + 1, reasons: Object.fromEntries(reasons) } }));
      if (g.fail) { reasons.set(g.fail, (reasons.get(g.fail) || 0) + 1); continue; }
      found++;
      console.log(JSON.stringify(g));
    }
    if (child) report();
    else console.error(summary(found, tried, reasons));
  }
}
