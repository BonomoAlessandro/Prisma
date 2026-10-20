// Eichmenge des Spielwerts (Ticket 13): die Level mit einem Spass-Urteil (Gefühl 1–5), je Level ein Eintrag. Gebraucht
// vom Messskript tools/eiche-spielwert.mjs und vom Test des Spielwerts; die Beurteilung selbst kennt sie nicht.
// - KI-Tester: aus dem versionierten Protokoll (tools/ki-tester/protocol.jsonl), das Mittel der Gefühle von A und B,
//   über alle Läufe, in denen das Level vorkommt. Gefunden wird es über seinen Namen, damit ein Umsortieren nichts
//   ändert.
// - Reviews 4 und 6: der Spass der Spieler-Tester (spass-reviews.json, übernommen aus den Pools). Heutige Level über
//   ihren Namen, Kandidaten, die nicht ins Spiel kamen, mit ihren Leveldaten.
// - Ein Level mit Urteilen aus beiden Quellen (Brücke) bekommt das Mittel beider. An den Brücken passen die Skalen
//   ohne Angleichung (Ticket 13).
// - Nicht darin sind die neuen Level aus dem Austausch (Tickets 23–26, Läufe ersatz-…): Sie haben keinen Platz in der
//   heutigen Reihenfolge, dem Massstab der Eichung (ADR 0001), und ihre Urteile ändern die Eichmenge darum nicht.
import { readFileSync } from 'node:fs';
import { inHeutigerReihenfolge } from './heutige-reihenfolge.mjs';
import { ERSATZ_LAEUFE } from '../levelliste.mjs';

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');
const mittel = (a) => a.reduce((s, x) => s + x, 0) / a.length;

/**
 * Die Eichmenge: [{ name, platz (1–150, in der heutigen Reihenfolge) und grad (aus den Leveldaten) oder beide null bei
 * Kandidaten ausserhalb des Spiels, level, spass: Mittel der Quellen, urteile: { kiTester: Mittel aus A und B oder
 * null, review: Spass oder null }, review: Kennung im Review (etwa „R01“) oder null }]; zuerst die heutigen Level nach
 * Platz, dann die Kandidaten.
 */
export function eichmenge() {
  const heute = inHeutigerReihenfolge();
  const ki = new Map();
  for (const line of read('../ki-tester/protocol.jsonl').split('\n').filter(l => l.trim())) {
    const e = JSON.parse(line);
    if (ERSATZ_LAEUFE.test(e.lauf) && !heute.some(l => l.name === e.level.name)) continue;
    if (!ki.has(e.level.name)) ki.set(e.level.name, []);
    ki.get(e.level.name).push((e.urteile.A.gefuehl + e.urteile.B.gefuehl) / 2);
  }
  const reviews = JSON.parse(read('./spass-reviews.json')).urteile;
  const eintrag = (name, platz, level, kiTester, r) => {
    const urteile = { kiTester, review: r ? r.spass : null };
    return { name, platz, grad: platz ? level.grad : null, level, spass: mittel([kiTester, urteile.review].filter(v => v !== null)),
      urteile, review: r ? r.id : null };
  };
  const out = [];
  heute.forEach((level, i) => {
    const r = reviews.find(u => u.name === level.name);
    const k = ki.has(level.name) ? mittel(ki.get(level.name)) : null;
    if (k !== null || r) out.push(eintrag(level.name, i + 1, level, k, r));
  });
  for (const r of reviews.filter(u => !u.name)) out.push(eintrag(r.id, null, { name: r.id, ...r.level }, null, r));
  const fremd = [...ki.keys()].filter(name => !heute.some(l => l.name === name));
  if (fremd.length) throw new Error(`Protokoll: unbekannte Level ${fremd.join(', ')}`);
  return out;
}

/** Rangkorrelation nach Spearman, gleiche Werte mit mittlerem Rang. */
export function rangkorrelation(a, b) {
  const rang = (v) => {
    const s = v.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]), r = new Array(v.length);
    for (let i = 0; i < s.length;) {
      let j = i;
      while (j + 1 < s.length && s[j + 1][0] === s[i][0]) j++;
      for (let k = i; k <= j; k++) r[s[k][1]] = (i + j) / 2;
      i = j + 1;
    }
    return r;
  };
  const ra = rang(a), rb = rang(b), ma = mittel(ra), mb = mittel(rb);
  let ab = 0, aa = 0, bb = 0;
  for (let i = 0; i < ra.length; i++) { ab += (ra[i] - ma) * (rb[i] - mb); aa += (ra[i] - ma) ** 2; bb += (rb[i] - mb) ** 2; }
  return aa && bb ? ab / Math.sqrt(aa * bb) : 0;
}
