// Macht Level schwerer – für die Level jenseits der Generator-Stufen (heute ab Level 121; vor dem Einfügen der
// mittelschweren Level ab 51 bzw. 71).
// Der Generator (generate.mjs) baut ein Level in einem Zug; ab etwa 9 drehbaren Elementen findet er kaum noch
// eindeutig lösbare. Dieses Werkzeug startet daher bei einem frisch erzeugten, mittelgrossen Level (Stufe 3–4,
// alle Mischungen) und verändert es in kleinen Schritten (lokale Suche, Simulated Annealing):
//   - ein Element auf einen Strahl setzen: Spiegel, Prisma (nur auf Mischlicht), Kombinator (nur auf einer
//     Kreuzung), Filter (nur eine echte Teilfarbe)
//   - einen festen Spiegel drehbar machen oder umgekehrt, die Lösungsstellung eines Elements ändern
//   - ein Ziel an ein Strahlende setzen oder verschieben, einen Lockvogel oder eine Quelle hinzufügen
//   - ein Element oder eine Quelle entfernen, einen festen Teil verschieben
// Das Level steht dabei immer in Lösungsstellung: Nach jedem Schritt bekommen die Ziele die Farbe, die dort
// ankommt (trifft ein zweiter Strahl, entsteht ein Mischziel), Elemente ohne Licht fallen weg, makeUnique stellt
// die Eindeutigkeit her. Bewertet wird wie in solver.mjs (Suche, Rateschritte, Ziele, Mischfarben, berührte
// Elemente) plus Zusammenspiel (Kreuzungen, Mehrfachtreffer, geteilte Elemente). Am Ende durchläuft das Level
// dieselben Prüfungen wie jedes generierte (finish: funktionslose Teile, Startstellung, Qualitätskriterien).
//
// Aufruf: node tools/harden.mjs [anzahl] [startseed] [--min W] [--max W] [--steps K] [--jobs N] [--time S]
//   anzahl       so viele Level suchen (Standard 10), startseed: erster Seed (Standard 1)
//   --min/--max  Zielwertung (Standard 44–54): jeder Lauf zielt auf einen zufälligen Wert darin und hört dort auf;
//                Ergebnisse haben mindestens --min, können --max aber übertreffen
//   --steps      höchstens so viele bewertete Schritte je Lauf (Standard 1500; Abbruch nach 300 ohne Fortschritt)
//   --jobs       so viele Prozesse parallel (Standard 1; Seeds verzahnt: startseed + i, Schrittweite jobs)
//   --time       Gesamtzeit in Sekunden; danach mit den gefundenen Leveln aufhören
// → JSON-Zeilen { level, metrics, quality, seed, base, steps } auf stdout (wie generate.mjs, in der Reihenfolge
// der Funde), Zusammenfassung auf stderr (mit HARDEN_DEBUG=1 auch jeder verworfene Lauf). Ein Lauf ist bei gleichem Seed gleich, solange er nicht an eine Zeitgrenze stösst.
import { L, litCells } from './solver.mjs';
import { interplay, density, oddFilters } from './quality.mjs';
import { PROFILES } from './profiles.mjs';
import { rng, asLevel, traceEls, segmentCells, chooseRotation, SOURCE_COLORS, generateOne, makeUnique, finish } from './generate.mjs';

const SIZE = 7;
const key = (x, z) => x + ',' + z;
const isRot = (e) => L.isRotatable({ ...e, fixed: !!e.fixed });
const rotOf = (e) => (e.type === 'combiner' ? e.dir : e.rot);
const primary = (c) => c === 1 || c === 2 || c === 4;
const clone = (els) => els.map(e => ({ ...e }));
const solutionOf = (els) => Object.fromEntries(els.filter(isRot).map(e => [key(e.x, e.z), rotOf(e)]));

/** Vorgaben für die gehärteten Level (finish prüft rotatable, minClicks, maxBlockers am Ende). */
export const HARD = {
  rotatable: [9, 14], targets: [3, 7], minClicks: 12, maxBlockers: 6, repairs: true, maxRepairs: 6,
  maxSearch: 1.5e6, maxFull: 4e6, maxElements: 30, maxSources: 4, maxAdjacent: 1.35, maxShort: 0.85,
};
/** Startlevel: Stufe 3 und 4 aller Mischungen – sie entstehen schnell und bringen verschiedene Elemente mit. */
const BASES = PROFILES.filter(p => /^[34]-/.test(p.id)).map(p => p.id);

/** Schritte mit Gewicht (wie oft sie versucht werden). */
const MOVES = [
  ['mirror', 3], ['prism', 1.5], ['combiner', 1], ['filter', 0.8], ['unfix', 1.5], ['fix', 0.3], ['rerot', 2],
  ['target', 1.5], ['moveTarget', 1], ['decoy', 1], ['source', 0.6], ['removeSource', 0.4], ['remove', 1], ['move', 0.8],
];
const MOVE_TOTAL = MOVES.reduce((s, [, w]) => s + w, 0);
function pickMove(R) {
  let x = R.next() * MOVE_TOTAL;
  for (const [m, w] of MOVES) if ((x -= w) < 0) return m;
  return MOVES[0][0];
}

/** Zellen kurz vor den Strahlenden (Feldkante oder geschluckt) – dort kann ein Ziel stehen, ohne etwas abzuschneiden. */
function beamEnds(r, occ) {
  const at = (x, z) => x.toFixed(3) + ',' + z.toFixed(3);
  const absorbed = new Set(r.events.filter(e => e.kind === 'absorb').map(e => at(e.x, e.z)));
  return r.segments.filter(s => s.fade || absorbed.has(at(s.x1, s.z1)))
    .map(s => segmentCells(s).filter(c => !occ.has(key(c.x, c.z))).slice(-3))
    .filter(list => list.length);
}

/** Ein zufälliger Schritt. els steht in Lösungsstellung; liefert eine geänderte Kopie oder null. */
function mutate(els, R) {
  const next = clone(els);
  const occ = new Set(next.map(e => key(e.x, e.z)));
  let r = traceEls(next);
  const free = r.segments.flatMap(segmentCells).filter(c => !occ.has(key(c.x, c.z)));
  const pick = (arr) => (arr.length ? R.pick(arr) : null);
  const move = pickMove(R);
  switch (move) {
    case 'mirror': {
      const c = pick(free);
      if (!c) return null;
      next.push({ type: 'mirror', x: c.x, z: c.z, rot: chooseRotation('mirror', c.dir, R) });
      break;
    }
    case 'prism': {
      const c = pick(free.filter(q => !primary(q.color)));
      if (!c) return null;
      next.push({ type: 'prism', x: c.x, z: c.z, rot: chooseRotation('prism', c.dir, R) });
      break;
    }
    case 'combiner': {
      const by = new Map();
      for (const c of free) { const k = key(c.x, c.z); if (!by.has(k)) by.set(k, new Set()); by.get(k).add(c.dir); }
      const k = pick([...by].filter(([, d]) => d.size >= 2).map(([q]) => q));
      if (!k) return null;
      const [x, z] = k.split(',').map(Number);
      next.push({ type: 'combiner', x, z, dir: R.int(0, 7) });
      break;
    }
    case 'filter': {
      const c = pick(free.filter(q => !primary(q.color)));
      if (!c) return null;
      const subsets = [1, 2, 3, 4, 5, 6].filter(m => (m & c.color) === m && m !== c.color); // echte Teilfarbe
      next.push({ type: 'filter', x: c.x, z: c.z, color: L.COLOR_NAMES[R.pick(subsets)] });
      break;
    }
    case 'unfix': {
      const e = pick(next.filter(q => q.type === 'mirror' && q.fixed));
      if (!e) return null;
      delete e.fixed;
      break;
    }
    case 'fix': {
      const e = pick(next.filter(q => q.type === 'mirror' && !q.fixed));
      if (!e) return null;
      e.fixed = true;
      break;
    }
    case 'rerot': {
      const e = pick(next.filter(isRot));
      if (!e) return null;
      const per = e.type === 'mirror' ? 4 : 8, v = (rotOf(e) + R.int(1, per - 1)) % per;
      if (e.type === 'combiner') e.dir = v; else e.rot = v;
      break;
    }
    case 'target':
    case 'moveTarget': {
      if (move === 'moveTarget') {
        const t = pick(next.filter(q => q.type === 'target'));
        if (!t) return null;
        next.splice(next.indexOf(t), 1);
        occ.delete(key(t.x, t.z));
        r = traceEls(next); // ohne das Ziel läuft sein Strahl weiter
      }
      const list = pick(beamEnds(r, occ));
      if (!list) return null;
      const c = R.pick(list);
      next.push({ type: 'target', x: c.x, z: c.z, color: 'white' }); // Farbe setzt normalize
      break;
    }
    case 'decoy': {
      const path = new Set(r.segments.flatMap(segmentCells).map(c => key(c.x, c.z)));
      const cells = [];
      for (let x = 0; x < SIZE; x++) for (let z = 0; z < SIZE; z++) if (!occ.has(key(x, z)) && !path.has(key(x, z))) cells.push([x, z]);
      const c = pick(cells);
      if (!c) return null;
      next.push(R.chance(0.5) ? { type: 'blocker', x: c[0], z: c[1] } : { type: 'mirror', x: c[0], z: c[1], rot: R.int(0, 3), fixed: true });
      break;
    }
    case 'source': {
      if (next.filter(q => q.type === 'source').length >= HARD.maxSources) return null;
      const edge = R.int(0, 3), t = R.int(0, SIZE - 1);
      const [x, z] = [[0, t], [SIZE - 1, t], [t, 0], [t, SIZE - 1]][edge];
      if (occ.has(key(x, z))) return null;
      const dir = ([0, 4, 2, 6][edge] + (R.chance(0.15) ? R.pick([-1, 1]) : 0) + 8) % 8;
      const [dx, dz] = L.DIRS[dir];
      let cx = x + dx, cz = z + dz;
      if (cx < 0 || cz < 0 || cx >= SIZE || cz >= SIZE) return null;
      for (; cx >= 0 && cz >= 0 && cx < SIZE && cz < SIZE; cx += dx, cz += dz) {
        const e = next.find(q => q.x === cx && q.z === cz);
        if (e) { if (e.type === 'source') return null; break; } // nicht direkt in eine andere Quelle
      }
      const color = R.chance(0.35) ? R.pick(SOURCE_COLORS) : null;
      next.push({ type: 'source', x, z, dir, ...(color ? { color } : {}) });
      break;
    }
    case 'removeSource': {
      const sources = next.filter(q => q.type === 'source');
      if (sources.length < 2) return null;
      next.splice(next.indexOf(R.pick(sources)), 1);
      break;
    }
    case 'remove': {
      const e = pick(next.filter(q => q.type !== 'source' && q.type !== 'target'));
      if (!e) return null;
      next.splice(next.indexOf(e), 1);
      break;
    }
    case 'move': {
      const e = pick(next.filter(q => q.fixed || q.type === 'blocker' || q.type === 'filter'));
      if (!e) return null;
      const [dx, dz] = L.DIRS[R.int(0, 7)];
      const x = e.x + dx, z = e.z + dz;
      if (x < 0 || z < 0 || x >= SIZE || z >= SIZE || occ.has(key(x, z))) return null;
      e.x = x; e.z = z;
      break;
    }
  }
  return next;
}

/**
 * Ziele nach dem Strahlbild färben (ohne Licht: entfernen), drehbare Elemente und Filter ohne Licht entfernen –
 * bis nichts mehr wegfällt (ein entferntes Ziel gibt seinen Strahl frei). Ändert els; true, wenn gelöst.
 */
function normalize(els) {
  for (let pass = 0; pass < 8; pass++) {
    const b = L.createBoard(asLevel(els));
    const r = L.traceBeams(b);
    if (r.truncated) return false;
    const drop = new Set();
    for (const t of b.elements.filter(e => e.type === 'target')) { // Element-ID = Index in els
      const hit = r.hits.get(t.id) || 0;
      if (!hit) drop.add(t.id);
      else els[t.id].color = L.COLOR_NAMES[hit];
    }
    if (!drop.size) {
      const lit = litCells(r, b);
      for (const e of b.elements) if ((L.isRotatable(e) || e.type === 'filter') && !lit.has(key(e.x, e.z))) drop.add(e.id);
    }
    if (!drop.size) return true; // Ziele tragen jetzt genau ihre Farbe: gelöst
    const keep = els.filter((_, i) => !drop.has(i));
    els.length = 0;
    els.push(...keep);
  }
  return false;
}

/**
 * score: Wertung wie metrics().score – mit der Suche anstelle der Vollsuche (beide liegen nah beieinander).
 * obj: Ziel der Suche – score plus Zusammenspiel, abzüglich vieler Blocker, unabhängiger Quellengruppen
 * (zerfällt in Teilrätsel) und eines zu dichten Felds (Knäuel statt sichtbarer Strahlwege).
 */
function rate(els, res) {
  const level = { name: '', elements: els, solution: solutionOf(els) };
  const ip = interplay(level), d = density(level);
  const targets = els.filter(e => e.type === 'target');
  const mixed = targets.filter(t => !['red', 'green', 'blue'].includes(t.color)).length;
  const search = Math.log2(Math.max(1, res.nodes));
  const score = 1.5 * search + 1.2 * Math.log2(1 + res.guesses) + 0.5 * targets.length + 0.4 * mixed + 0.25 * litCells(ip.r, ip.b).size;
  const interaction = ip.crossings + ip.multiHit + ip.shared;
  const blockers = els.filter(e => e.type === 'blocker').length;
  const obj = score + 0.3 * Math.min(interaction, 8) - 0.5 * Math.max(0, blockers - 3) - 8 * (ip.groups - 1)
    - 6 * Math.max(0, d.adjacent - 1) - 6 * Math.max(0, d.short - 0.75)
    - 30 * Math.max(0, d.adjacent - HARD.maxAdjacent) - 30 * Math.max(0, d.short - HARD.maxShort); // steile Wand an der Abnahmegrenze
  return { score, obj, groups: ip.groups, ...d };
}
/**
 * Abnahme: alle Quellen gekoppelt, Feld kaum dichter als bei den ursprünglichen 50 Leveln (Grenzen 1.35 bzw. 0.85;
 * die 50 liegen bei höchstens 1.29 bzw. 0.9, siehe density in quality.mjs).
 */
const accept = (c) => c.groups === 1 && c.adjacent <= HARD.maxAdjacent && c.short <= HARD.maxShort;
/** Dieselbe Abnahme für ein fertiges Level (mit Lösung) – finish entfernt Blocker, das ändert die Strahlwege. */
export const accepted = (level) => accept({ groups: interplay(level).groups, ...density(level) });

/** Verwerfungsgründe der Schritte (für HARDEN_DEBUG=2, je Lauf). */
export const rejects = new Map();
const reject = (why) => { rejects.set(why, (rejects.get(why) || 0) + 1); return null; };

/** Prüft und bewertet einen Stand; ändert els (normalize, makeUnique). null: verworfen. */
function evaluate(els, R) {
  if (!normalize(els)) return reject('nicht gelöst');
  const n = (type) => els.filter(e => e.type === type).length;
  // Ein umgelenkter Strahl lässt oft ein Ziel ohne Licht zurück: fehlende Ziele an neue Strahlenden setzen
  for (let k = 0; k < 3 && n('target') < HARD.targets[0]; k++) {
    const ends = beamEnds(traceEls(els), new Set(els.map(e => key(e.x, e.z))));
    if (!ends.length) break;
    const c = R.pick(R.pick(ends));
    els.push({ type: 'target', x: c.x, z: c.z, color: 'white' });
    if (!normalize(els)) return reject('nicht gelöst');
  }
  if (n('target') < HARD.targets[0] || n('target') > HARD.targets[1]) return reject('Anzahl Ziele');
  // Quellen, ohne die das Level genauso gelöst ist, tragen nichts bei: entfernen (die Ziele bleiben richtig)
  for (const src of els.filter(e => e.type === 'source')) {
    if (n('source') > 1 && traceEls(els.filter(e => e !== src)).solved) els.splice(els.indexOf(src), 1);
  }
  if (!normalize(els)) return reject('nicht gelöst');
  if (n('target') < HARD.targets[0]) return reject('Anzahl Ziele');
  if (els.filter(isRot).length > HARD.rotatable[1] || els.length > HARD.maxElements) return reject('zu viele Elemente');
  const solution = solutionOf(els);
  if (oddFilters({ name: '', elements: els, solution }).length) return reject('Filter gibt fremde Farbe ab');
  // Ziel ohne Zutun: bekäme seine Farbe auch, wenn jedes drehbare Element das Licht schluckte
  const blocked = traceEls(els.map(e => (isRot(e) ? { type: 'blocker', x: e.x, z: e.z } : e)));
  if (els.some((e, i) => e.type === 'target' && blocked.hits.get(i) === L.COLORS[e.color])) return reject('Ziel ohne Zutun');
  const u = makeUnique(els, solution, R, HARD);
  if (u.fail) return reject(u.fail);
  if (n('blocker') > HARD.maxBlockers + 2 || els.length > HARD.maxElements) return reject('zu viele Blocker');
  return { els, ...rate(els, u.res) };
}

/** Ein Lauf: Startlevel erzeugen, schwerer machen, die besten Stände abschliessen. */
export function climb(seed, { min = 44, max = 54, steps = 1500, deadline = Infinity } = {}) {
  const R = rng(seed * 7919 + 17);
  const base = BASES[seed % BASES.length];
  const spec = PROFILES.find(p => p.id === base);
  // Startlevel: das erste erzeugte, das auch die Prüfungen hier besteht (z. B. kein Ziel ohne Zutun) und dessen
  // Quellen schon in der Lösung zusammenhängen – sonst wächst meist nur ein unabhängiges Teilrätsel
  let cur = null;
  for (let s = seed * 100000, tries = 0; !cur && tries < 20000 && Date.now() < deadline; s++, tries++) {
    const g = generateOne(spec, s);
    if (g.fail) continue;
    cur = evaluate(g.level.elements.map(e => (isRot(e) ? { ...e, [e.type === 'combiner' ? 'dir' : 'rot']: g.level.solution[key(e.x, e.z)] } : { ...e })), R);
    if (cur && cur.groups > 1) cur = null;
  }
  if (!cur) return { fail: 'kein Startlevel' };
  const debug = process.env.HARDEN_DEBUG === '2'; // jeder neue beste Stand
  const top = []; // Stände, die die Abnahme bestehen, je besser als alle vorigen
  let best = cur;
  const goal = min + R.next() * (max - min);
  // Kühl: Verschlechterungen nur selten annehmen. Nach STALL Schritten ohne neuen besten Stand zurück zum
  // besten, nach GIVE_UP Schritten aufhören (die frühen Schritte sind billig, die späten teuer).
  const STALL = 80, GIVE_UP = 300;
  let done = 0, since = 0;
  for (let tries = 0; done < steps && tries < steps * 6 && Date.now() < deadline; tries++) {
    const cand = mutate(cur.els, R);
    if (!cand) continue;
    const ev = evaluate(cand, R);
    if (!ev) continue;
    done++;
    since++;
    const T = 0.8 * (1 - done / steps) + 0.1;
    if (ev.obj >= cur.obj || R.next() < Math.exp((ev.obj - cur.obj) / T)) cur = ev;
    if (ev.obj > best.obj) {
      best = ev;
      since = 0;
      if (debug) console.error(`  ${seed}/${done}: obj ${ev.obj.toFixed(1)} score ${ev.score.toFixed(1)} · ${ev.els.filter(isRot).length} drehbar · Gruppen ${ev.groups} · dicht ${ev.adjacent}/${ev.short}`);
    }
    if (accept(ev) && (!top.length || ev.obj > top.at(-1).obj)) top.push(ev);
    if (top.length && top.at(-1).score >= goal) break;
    if (since >= GIVE_UP) break;
    if (since % STALL === 0 && since) cur = best;
  }
  if (debug) console.error(`  ${seed}: verworfene Schritte: ${[...rejects].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  rejects.clear();
  // Nach Ablauf der Zeit lohnt der Abschluss (Vollsuche) nicht mehr: der Aufrufer beendet den Prozess gleich
  if (Date.now() >= deadline) return { fail: 'Zeit abgelaufen' };
  // Abschluss: die besten Stände der Reihe nach, bis einer alle Prüfungen besteht
  let why = top.length ? 'zu leicht' : 'keine Abnahme';
  for (const cand of top.slice(-6).reverse()) {
    if (cand.score < min - 2) continue;
    const fin = clone(cand.els);
    const g = finish(fin, solutionOf(fin), HARD, R, seed);
    if (g.fail) { why = g.fail; continue; }
    if (g.metrics.score < min) { why = 'zu leicht'; continue; }
    if (!accepted(g.level)) { why = 'Abnahme nach Abschluss'; continue; }
    return { ...g, base, steps: done };
  }
  const fmt = (c) => (c ? `${c.score.toFixed(1)} (${c.els.filter(isRot).length} drehbar, Gruppen ${c.groups}, dicht ${c.adjacent}/${c.short})` : '–');
  return { fail: why, detail: `${done} Schritte · bester Stand ${fmt(best)} · bester abnehmbarer ${fmt(top.at(-1))}` };
}

// ---- Kommandozeile (parallel wie generate.mjs: Kinder mit verzahnten Seeds)
if (process.argv[1] && process.argv[1].endsWith('harden.mjs')) {
  const args = process.argv.slice(2);
  const flag = (name, def) => { const i = args.indexOf(name); return i < 0 ? def : Number(args.splice(i, 2)[1]); };
  const jobs = flag('--jobs', 1), seconds = flag('--time', Infinity);
  const opts = { min: flag('--min', 44), max: flag('--max', 54), steps: flag('--steps', 1500), deadline: Date.now() + seconds * 1000 };
  const [count = '10', startSeed = '1'] = args;
  const whole = (v) => Number.isInteger(Number(v)) && Number(v) >= 1;
  if (!whole(jobs) || !whole(count) || !whole(startSeed) || !whole(opts.steps) || !(seconds > 0) || !(opts.max >= opts.min)) {
    console.error('Aufruf: node tools/harden.mjs [anzahl] [startseed] [--min W] [--max W] [--steps K] [--jobs N] [--time S]');
    process.exit(1);
  }
  const kids = []; // Kindprozesse (nur im Elternprozess)
  process.stdout.on('error', () => { kids.forEach(k => k.kill()); process.exit(0); }); // z. B. Ausgabe in head geleitet
  if (process.env.HARDEN_CHILD) {
    const stride = +process.env.HARDEN_STRIDE;
    for (let seed = +startSeed; Date.now() < opts.deadline; seed += stride) {
      const g = climb(seed, opts);
      console.log(JSON.stringify(g.fail ? { stats: { seed, fail: g.fail, detail: g.detail } } : g));
    }
  } else {
    const { spawn } = await import('node:child_process');
    const results = [], reasons = new Map();
    let tried = 0, done = false;
    const finishAll = () => {
      if (done) return;
      done = true;
      kids.forEach(k => k.kill());
      console.error(`${Math.min(results.length, +count)} Level aus ${tried} Läufen` +
        (reasons.size ? ' · verworfen: ' + [...reasons].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') : ''));
    };
    if (Number.isFinite(seconds)) setTimeout(finishAll, seconds * 1000 + 2000).unref();
    let alive = jobs;
    for (let i = 0; i < jobs; i++) {
      const childArgs = [count, String(+startSeed + i), '--min', opts.min, '--max', opts.max, '--steps', opts.steps,
        ...(Number.isFinite(seconds) ? ['--time', seconds] : [])].map(String);
      const k = spawn(process.execPath, [process.argv[1], ...childArgs],
        { env: { ...process.env, HARDEN_CHILD: '1', HARDEN_STRIDE: String(jobs) }, stdio: ['ignore', 'pipe', 'inherit'] });
      let buf = '';
      k.stdout.setEncoding('utf8'); // Umlaute nicht an Blockgrenzen zerreissen
      k.stdout.on('data', (d) => {
        buf += d;
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
          if (!line) continue;
          const msg = JSON.parse(line);
          tried++;
          if (msg.stats) {
            reasons.set(msg.stats.fail, (reasons.get(msg.stats.fail) || 0) + 1);
            if (process.env.HARDEN_DEBUG) console.error(`  Seed ${msg.stats.seed}: ${msg.stats.fail} · ${msg.stats.detail || ''}`);
          } else if (results.length < +count) {
            results.push(msg);
            console.log(line); // sofort ausgeben: ein Abbruch verliert nichts
            console.error(`  Seed ${msg.seed}: Wertung ${msg.metrics.score} · ${msg.metrics.rotatable} drehbar · ${msg.metrics.targets} Ziele · ${msg.base}`);
          }
          if (results.length >= +count) finishAll();
        }
      });
      k.on('exit', () => { if (--alive === 0) finishAll(); });
      kids.push(k);
    }
  }
}
