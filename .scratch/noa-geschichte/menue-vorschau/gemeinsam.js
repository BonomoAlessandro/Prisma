// Gemeinsam für die drei Vorschauen: Zeichen (aus STORY_ICONS im Spiel), Polarstern, der gezeigte Stand und kleine
// Helfer. Nicht Teil des Spiels.
'use strict';

const ICONS = {
  dorf: '<path d="M4.5 19.5v-7.5l7.5-6 7.5 6v7.5z"/><path d="M10 19.5V15h4v4.5"/>',
  wald: '<path d="M12 3.5l-5 7h3l-4.5 6.5h13L14 10.5h3z"/><path d="M12 17v3.5"/>',
  meer: '<path d="M2.5 10c2.4-2.2 4.6-2.2 7 0s4.6 2.2 7 0c1.4-1.3 3.6-1.8 5-1"/><path d="M2.5 15.5c2.4-2.2 4.6-2.2 7 0s4.6 2.2 7 0c1.4-1.3 3.6-1.8 5-1"/>',
  wueste: '<path d="M2.5 19.5l7-11 7 11z"/><path d="M9.5 8.5l2.2 11"/><circle cx="18.2" cy="6" r="2.2"/>',
  vulkan: '<path d="M2.5 19.5l5.5-9h2.2l1.8 2 1.8-2h2.2l5.5 9z"/><path d="M11 7.5c-.6-1.6.6-2.6 0-4.2M14 7.5c.8-1.2 1.8-1.6 2.6-1.2"/>',
  planeten: '<circle cx="12" cy="12" r="4.2"/><ellipse cx="12" cy="12" rx="9.5" ry="3" transform="rotate(-20 12 12)"/>',
  sterne: '<path d="M12 3l1.9 7.1L21 12l-7.1 1.9L12 21l-1.9-7.1L3 12l7.1-1.9z"/>',
  neu: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v3.2h3.2"/>', // «Level neu starten» im Spiel
  pfeil: '<path d="M9.5 5.5l6.5 6.5-6.5 6.5"/>',
  links: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
};

const WELTEN = [
  { id: 'wald', name: 'Bergwald' }, { id: 'meer', name: 'Meer' }, { id: 'wueste', name: 'Wüste' },
  { id: 'vulkan', name: 'Vulkan' }, { id: 'planeten', name: 'Planeten' }, { id: 'sterne', name: 'Sterne' },
];

/**
 * Der Stand in allen Vorschauen: leicht geschafft, mittel begonnen und zuletzt gespielt (Ziel von «Weiter»),
 * schwer und sehr schwer nicht begonnen, schwer als nächstschwererer hervorgehoben.
 */
const GRADE = [
  { id: 'leicht', name: 'Leicht', punkte: 1, stand: 'geschafft', level: 60 },
  { id: 'mittel', name: 'Mittel', punkte: 2, stand: 'begonnen', level: 23, zuletzt: true },
  { id: 'schwer', name: 'Schwer', punkte: 3, stand: 'neu', hervor: true },
  { id: 'sehr-schwer', name: 'Sehr schwer', punkte: 4, stand: 'neu' },
];
const WEITER = GRADE.find((g) => g.zuletzt && g.stand !== 'geschafft') ?? null;

const welt = (g) => WELTEN[Math.min(5, Math.floor((g.level - 1) / 10))];
/** Anteil des Wegs: gelöste Level / 60 (beim begonnenen das aktuelle halb) */
const anteil = (g) => (g.stand === 'geschafft' ? 1 : g.stand === 'neu' ? 0 : (g.level - 0.5) / 60);
const standText = (g) => (g.stand === 'geschafft' ? 'Geschafft' : g.stand === 'neu' ? 'noch nicht begonnen'
  : `${welt(g).name} · ${g.level} / 60`);
const aktion = (g) => (g.stand === 'geschafft' ? 'Übersicht' : g.stand === 'neu' ? 'Beginnen' : 'Fortsetzen');
const ariaKarte = (g) => `${g.name}: ${g.stand === 'geschafft' ? 'geschafft, Polarstern erreicht' : g.stand === 'neu'
  ? 'noch nicht begonnen' : `${welt(g).name}, Level ${g.level} von 60`}. ${aktion(g)}`;

const icon = (id, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[id]}</svg>`;
const pips = (n) => `<span class="pips" aria-hidden="true">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
/** Polarstern: leuchtend (erreicht) oder blass (aus) */
const stern = (an = true, cls = '') =>
  `<span class="stern ${an ? '' : 'aus'} ${cls}" aria-hidden="true"><svg viewBox="0 0 100 100"><use href="#polarstern"/></svg></span>`;
const vonVorn = (g, kurz = false) => (g.stand === 'neu' ? '' :
  `<button class="vonvorn" aria-label="${g.name} von vorn beginnen (mit Rückfrage)">${icon('neu')}<span>${kurz ? 'Von vorn' : 'Von vorn'}</span></button>`);

/** Weg der sechs Welten wie die Leiste in den Untertiteln der Geschichte, am Ende der Polarstern */
function wegLeiste(g) {
  const jetzt = g.stand === 'begonnen' ? WELTEN.indexOf(welt(g)) : -1;
  const fertig = g.stand === 'geschafft' ? 6 : Math.max(0, jetzt);
  const teile = WELTEN.map((w, i) => {
    const cls = i < fertig ? 'done' : i === jetzt ? 'now' : '';
    return `${i ? `<span class="ln ${i <= fertig ? 'done' : ''}"></span>` : ''}<span class="st ${cls}" title="${w.name}">${icon(w.id)}</span>`;
  });
  teile.push(`<span class="ln ${g.stand === 'geschafft' ? 'done' : ''}"></span>${stern(g.stand === 'geschafft', 'ziel')}`);
  return `<div class="weg" aria-hidden="true">${teile.join('')}</div>`;
}

// Zeichen einmal ins Dokument: Polarstern mit Hof und Strahlen
document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <radialGradient id="ps-hof"><stop offset="0" stop-color="#ffffff" stop-opacity="0.6"/><stop offset="0.22" stop-color="#cdd4ff" stop-opacity="0.26"/><stop offset="1" stop-color="#aab4ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="ps-strahl"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#e6eaff" stop-opacity="0.5"/><stop offset="1" stop-color="#e6eaff" stop-opacity="0"/></radialGradient>
    <symbol id="polarstern" viewBox="-50 -50 100 100">
      <circle r="48" fill="url(#ps-hof)"/>
      <path d="M0-46L2.4-2.4 30 0 2.4 2.4 0 46-2.4 2.4-30 0-2.4-2.4z" fill="url(#ps-strahl)"/>
      <path d="M0-16L1.2-1.2 16 0 1.2 1.2 0 16-1.2 1.2-16 0-1.2-1.2z" fill="#fff" transform="rotate(45)" opacity="0.55"/>
      <circle r="4.2" fill="#fff"/>
    </symbol>
  </defs></svg>`);

/** ?fokus: Tastaturfokus auf das Element mit data-fokus (Probe des Fokusrings in der Aufnahme) */
function fokusProbe() {
  if (!new URLSearchParams(location.search).has('fokus')) return;
  const el = document.querySelector('[data-fokus]');
  if (!el) return;
  el.focus();
  if (!el.matches(':focus-visible')) el.classList.add('zeige-fokus');
}
