'use strict';
/* =====================================================================
   ÜBERSICHT DES GRADS (Baustein für Ticket 06, Spec .scratch/noa-geschichte/spec.md, Entscheide 9, 16, 19, 24).
   Ersetzt die Levelauswahl: je Welt eine Reihe mit Station, Name und Summe der Bestzeiten, je Level eine Kachel mit
   Nummer, Titel, gelöst, Bestzeit und wenigsten Drehungen. Gelöste Level sind wieder spielbar, das nächste ungelöste
   ist offen, spätere sind gesperrt (sichtbar, nicht wählbar). «Im Dorf» als eigene Reihe, wenn es gespielt wurde.
   Desktop (breit und hoch genug): alle Welten untereinander, durch jede Reihe ein Lichtweg wie im Menü. Sonst (Handy
   hoch und quer, Tablet, kleines Fenster): eine Welt je Seite, Blättern mit den Stationen, den Pfeilen oder Wischen
   über die Kacheln (mit Bewegung, wie die bisherige Levelauswahl). Einsetzen und Daten: LIESMICH.md.
   ===================================================================== */

/**
 * Baut die Übersicht in root (ein leeres Element, z. B. <div id="uebersicht">) und gibt { show, hide, vorwaermen,
 * offen } zurück.
 * icons: Zeichen der Stationen (im Spiel STORY_ICONS: dorf, wald, meer, …), Inhalt eines SVG mit viewBox 0 0 24 24.
 * onPlay({ welt, level, wiederholen, eintrag }): eine offene, freie oder gelöste Kachel gewählt; welt ist der Index in
 * daten.welten oder 'dorf', level der Index in der Reihe, wiederholen true bei einem gelösten Level, eintrag das
 * Objekt aus den Daten. onClose(): Escape, «Schliessen» oder Klick neben die Kacheln. Beide schliessen nicht selbst;
 * der Aufrufer ruft hide().
 */
function createUebersicht({ root, icons = {}, onPlay = () => {}, onClose = () => {} }) {
  /** Alle Welten untereinander (Desktop), sonst eine Welt je Seite. Die Grenze steht nur hier: das CSS richtet sich
   * nach data-modus am root */
  const ALLE = matchMedia('(min-width: 1180px) and (min-height: 600px)');
  /** Wischen und Blättern wie in der bisherigen Levelauswahl (INPUT.swipeMin, swipeSlope, dragThresholdTouch,
   * PAGE_SLIDE im Spiel) */
  const WISCH = { min: 50, schwelle: 10, steigung: 0.6, gummi: 0.3, ms: 280, easing: 'cubic-bezier(0.25, 0.8, 0.3, 1)' };
  /** wie GRAD_ANZEIGE im Spiel */
  const GRADE = {
    'leicht': { name: 'Leicht', punkte: 1 }, 'mittel': { name: 'Mittel', punkte: 2 },
    'schwer': { name: 'Schwer', punkte: 3 }, 'sehr schwer': { name: 'Sehr schwer', punkte: 4 },
  };
  /** eigene Zeichen, im Strich der STORY_ICONS */
  const Z = {
    uhr: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    drehung: '<path d="M19 12a7 7 0 1 1-2.05-4.95"/><path d="M17.3 3.6v3.6h-3.6"/>',
    schloss: '<rect x="6" y="11" width="12" height="8.5" rx="1.5"/><path d="M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11"/>',
    links: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
    rechts: '<path d="M9.5 5.5l6.5 6.5-6.5 6.5"/>',
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ico = (pfad, cls = '') => `<svg class="ueb-ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${pfad ?? ''}</svg>`;
  const wert = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  /** 1:42, ab einer Stunde 1:02:05 (wie formatDuration im Spiel) */
  const zeit = (sek) => {
    const s = Math.floor(sek), z = (n) => String(n).padStart(2, '0'), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
    return h ? `${h}:${z(m)}:${z(s % 60)}` : `${m}:${z(s % 60)}`;
  };
  /** für Bildschirmleser «1 Minute 42 Sekunden» statt «1:42» */
  const sprichZeit = (sek) => {
    const s = Math.floor(sek), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, r = s % 60, t = [];
    if (h) t.push(`${h} ${h === 1 ? 'Stunde' : 'Stunden'}`);
    if (m) t.push(`${m} ${m === 1 ? 'Minute' : 'Minuten'}`);
    if (r || !t.length) t.push(`${r} ${r === 1 ? 'Sekunde' : 'Sekunden'}`);
    return t.join(' ');
  };
  const drehungen = (n) => `${n} ${n === 1 ? 'Drehung' : 'Drehungen'}`;
  /**
   * Weiche Trennstriche in langen Wörtern, ohne Wörterbuch (hyphens: auto kennt Deutsch nicht in jedem Browser): in
   * jeder Gruppe von Konsonanten zwischen zwei Vokalen vor dem längsten Anlaut, mit dem ein deutsches Wort beginnen
   * kann (Schaum-krone, Feuer-schlund, See-pferd-chen, Luft-spiegelung), sonst vor dem letzten Konsonanten
   * (Asteroiden-gürtel); vorn zwei, hinten vier Buchstaben mindestens (sonst Asteroidengür-tel, Bärenhü-ter). Gebraucht
   * nur, wenn ein Wort auch klein nicht in die Kachel passt (.ueb-brich); sonst trennt das CSS nicht.
   */
  const VOKAL = /[aeiouyäöüàéèê]/i;
  const ANLAUT = ['schr', 'schl', 'schm', 'schn', 'schw', 'spr', 'str', 'pfl', 'pfr', 'sch', 'pf', 'bl', 'br', 'ch', 'ck',
    'dr', 'fl', 'fr', 'gl', 'gr', 'kl', 'kn', 'kr', 'ph', 'pl', 'pr', 'sp', 'st', 'th', 'tr', 'zw'];
  const SHY = String.fromCharCode(0xad);
  const trenne = (titel) => String(titel ?? '').replace(/\p{L}{9,}/gu, (w) => {
    const klein = w.toLowerCase(), stellen = [];
    for (let i = 1; i < w.length; i++) {
      if (VOKAL.test(klein[i]) || !VOKAL.test(klein[i - 1])) continue; // Anfang einer Gruppe von Konsonanten
      let e = i;
      while (e < w.length && !VOKAL.test(klein[e])) e++;
      if (e >= w.length) break; // am Wortende: keine Trennstelle
      const gruppe = klein.slice(i, e), anlaut = ANLAUT.find((a) => gruppe.endsWith(a));
      const t = e - (anlaut ? anlaut.length : 1);
      if (t >= 2 && w.length - t >= 4) stellen.push(t);
      i = e;
    }
    return stellen.reduceRight((s, t) => s.slice(0, t) + SHY + s.slice(t), w);
  });
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const uid = `ueb-${Math.random().toString(36).slice(2, 8)}`;
  /** Polarstern klein (wie im Menü): ein geschaffter Grad */
  const STERN = `<svg class="ueb-stern" viewBox="-50 -50 100 100" aria-hidden="true"><defs><radialGradient id="${uid}-hof">
    <stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="0.3" stop-color="#cdd4ff" stop-opacity="0.22"/>
    <stop offset="1" stop-color="#aab4ff" stop-opacity="0"/></radialGradient></defs><circle r="46" fill="url(#${uid}-hof)"/>
    <path d="M0-46L2.6-2.6 32 0 2.6 2.6 0 46-2.6 2.6-32 0-2.6-2.6z" fill="#fff"/><circle r="5" fill="#fff"/></svg>`;

  root.classList.add('ueb', 'ueb-zu');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', `${uid}-titel`);
  root.setAttribute('aria-describedby', `${uid}-grad`);
  root.inert = true;
  root.innerHTML = `
    <div class="ueb-rahmen">
      <header class="ueb-kopf">
        <div class="ueb-kopftext">
          <h2 class="ueb-titel" id="${uid}-titel">Übersicht</h2>
          <p class="ueb-grad" id="${uid}-grad"></p>
        </div>
        <p class="ueb-legende" aria-hidden="true"><span>${ico(Z.uhr)}Bestzeit</span><span>${ico(Z.drehung)}wenigste Drehungen</span></p>
      </header>
      <nav class="ueb-stationen" aria-label="Welten"></nav>
      <div class="ueb-pager">
        <button class="ueb-schritt" data-schritt="-1" aria-label="Vorige Welt">${ico(Z.links)}</button>
        <div class="ueb-seitentitel"></div>
        <button class="ueb-schritt" data-schritt="1" aria-label="Nächste Welt">${ico(Z.rechts)}</button>
      </div>
      <div class="ueb-fenster"><div class="ueb-spur"></div></div>
      <footer class="ueb-fuss"><button class="ueb-schliessen">Schliessen</button></footer>
    </div>
    <p class="ueb-hinweis" role="status"></p>`;
  const $ = (sel) => root.querySelector(sel);
  const rahmen = $('.ueb-rahmen'), gradEl = $('.ueb-grad'), stationen = $('.ueb-stationen'), seitentitel = $('.ueb-seitentitel');
  const fenster = $('.ueb-fenster'), spur = $('.ueb-spur'), hinweis = $('.ueb-hinweis');
  const schritte = [...root.querySelectorAll('.ueb-schritt')];

  let daten = null, reihen = [], seite = 0, modus = '', offen = false;
  let wisch = null, gewischtUm = -Infinity, gezeigtUm = -Infinity, fahrt = null, hinweisUhr = 0;

  /**
   * Reihen der Übersicht: «Im Dorf» (falls gespielt), dann die Welten. Zustand je Level: gelöst (spielbar), offen (das
   * erste ungelöste der Kette) oder gesperrt (jedes spätere ungelöste). Die Welten bilden eine Kette über alle Reihen,
   * das Dorf eine eigene. Mit dorf.frei (nach «Überspringen») ist dort jede ungelöste Übung frei: spielbar wie die
   * offene, ohne deren Hof.
   */
  function baueReihen(d) {
    const r = [];
    if (d.dorf) r.push({ art: 'dorf', schluessel: 'dorf', name: d.dorf.name ?? 'Im Dorf', icon: d.dorf.icon ?? 'dorf', level: d.dorf.level ?? [] });
    (d.welten ?? []).forEach((w, i) => r.push({ art: 'welt', schluessel: i, name: w.name, icon: w.icon, level: w.level ?? [] }));
    for (const art of ['dorf', 'welt']) {
      let frei = true;
      const alleFrei = art === 'dorf' && !!d.dorf?.frei;
      for (const re of r.filter((x) => x.art === art)) {
        re.zustand = re.level.map((l) => {
          if (l.geloest) return 'geloest';
          if (alleFrei) return 'frei';
          if (frei) { frei = false; return 'offen'; }
          return 'gesperrt';
        });
      }
    }
    for (const re of r) {
      const mitZeit = re.level.filter((l) => l.geloest && wert(l.bestzeit));
      re.geloest = re.zustand.filter((z) => z === 'geloest').length;
      re.mitZeit = mitZeit.length;
      re.summe = mitZeit.reduce((s, l) => s + Math.floor(l.bestzeit), 0);
      re.lage = re.level.length && re.geloest === re.level.length ? 'fertig'
        : re.zustand.some((z) => z === 'offen' || z === 'frei') || re.geloest ? 'jetzt' : 'spaeter';
    }
    return r;
  }

  /** «4 / 10 · ◷ 6:12» (sichtbar) und «Meer: 4 von 10 gelöst, Summe der Bestzeiten …» (Bildschirmleser) */
  const standHtml = (re) => `<span>${re.geloest} / ${re.level.length}</span>` +
    (re.mitZeit ? `<span class="ueb-wert">${ico(Z.uhr)}${zeit(re.summe)}</span>` : '');
  const standText = (re) => `${re.name}: ${re.geloest} von ${re.level.length} gelöst` +
    (re.mitZeit ? `, Summe der Bestzeiten ${sprichZeit(re.summe)}` : '');

  function kachelHtml(re, l) {
    const lvl = re.level[l], z = re.zustand[l], titel = lvl.titel ?? lvl.name ?? '';
    const art = re.art === 'dorf' ? 'Übung' : 'Level';
    const mitZeit = z === 'geloest' && wert(lvl.bestzeit), mitDr = z === 'geloest' && wert(lvl.drehungen);
    const aktuell = daten.aktuell && daten.aktuell.welt === re.schluessel && daten.aktuell.level === l;
    let unten = '';
    if (z === 'gesperrt') unten = `<span class="ueb-schloss">${ico(Z.schloss)}</span>`;
    else if (z === 'offen' || z === 'frei') unten = `<span class="ueb-los">${re.art === 'dorf' ? 'Üben' : 'Weiter'}${ico(Z.rechts)}</span>`;
    else unten = (mitZeit ? `<span class="ueb-wert">${ico(Z.uhr)}${zeit(lvl.bestzeit)}</span>` : '<span></span>') +
      (mitDr ? `<span class="ueb-wert">${ico(Z.drehung)}${Math.round(lvl.drehungen)}</span>` : '');
    const sprache = [`${art} ${l + 1}`, titel, z === 'gesperrt' ? 'gesperrt'
      : z === 'offen' ? (re.art === 'dorf' ? 'als Nächstes zu üben' : 'als Nächstes zu spielen') : z === 'frei' ? 'frei' : 'gelöst'];
    if (mitZeit) sprache.push(`Bestzeit ${sprichZeit(lvl.bestzeit)}`);
    if (mitDr) sprache.push(`wenigste ${drehungen(Math.round(lvl.drehungen))}`);
    if (aktuell) sprache.push('läuft gerade');
    return `<li><button class="ueb-kachel ueb-${z}" tabindex="-1" aria-label="${esc(sprache.join(', '))}"` +
      `${z === 'gesperrt' ? ' aria-disabled="true"' : ''}${aktuell ? ' aria-current="true"' : ''}>` +
      `<span class="ueb-nr">${l + 1}</span>${z === 'geloest' ? '<span class="ueb-punkt"></span>' : ''}` +
      `<span class="ueb-name">${esc(trenne(titel))}</span><span class="ueb-unten">${unten}</span></button></li>`;
  }

  function reiheHtml(re, r) {
    // Licht im Weg der Reihe (nur alle Welten untereinander): von der Station bis zur Mitte der offenen Kachel bzw. der
    // letzten gelösten, bei einer fertigen Welt ganz durch (die Kacheln decken es zu, es scheint in den Lücken)
    // (Raster zu 10 Plätzen; «Im Dorf» hat 9, der Rest bleibt frei)
    const k = re.zustand.includes('offen') ? re.zustand.indexOf('offen') : re.zustand.lastIndexOf('geloest');
    const rest = Math.max(0, 10 - re.level.length), platz = (n) => `(100% - 9 * var(--ueb-luecke)) / 10 * ${n} + ${n} * var(--ueb-luecke)`;
    const licht = re.lage === 'fertig' ? `calc(100% - ${platz(rest)})` : k < 0 ? '-100vw' : `calc(${platz(k)} + (100% - 9 * var(--ueb-luecke)) / 20)`;
    return `<section class="ueb-welt ueb-${re.lage}" data-reihe="${r}" role="group" aria-label="${esc(standText(re))}">
      <div class="ueb-welt-kopf" aria-hidden="true">
        <span class="ueb-welt-text"><span class="ueb-welt-name">${esc(re.name)}</span><span class="ueb-welt-stand">${standHtml(re)}</span></span>
        <span class="ueb-station">${ico(icons[re.icon])}</span>
      </div>
      <ol class="ueb-kacheln" style="--ueb-licht: ${licht}; --ueb-rest: ${rest}">${re.level.map((_, l) => kachelHtml(re, l)).join('')}</ol>
    </section>`;
  }

  function zeichne() {
    const g = (typeof daten.grad === 'string' ? GRADE[daten.grad] : daten.grad) ?? { name: String(daten.grad ?? ''), punkte: 0 };
    const welten = reihen.filter((re) => re.art === 'welt');
    const geloest = welten.reduce((s, re) => s + re.geloest, 0), gesamt = welten.reduce((s, re) => s + re.level.length, 0);
    // geschafft heisst: Finale gesehen (daten.geschafft); ohne Angabe, wenn alle gelöst sind
    const geschafft = typeof daten.geschafft === 'boolean' ? daten.geschafft : gesamt > 0 && geloest === gesamt;
    const summe = welten.reduce((s, re) => s + re.summe, 0), alleZeiten = welten.every((re) => re.mitZeit === re.level.length);
    gradEl.innerHTML = `<span class="ueb-gradzeile" aria-hidden="true"><span class="ueb-pips">${[1, 2, 3, 4]
      .map((i) => `<i${i <= g.punkte ? ' class="ueb-an"' : ''}></i>`).join('')}</span><span class="ueb-gradname">${esc(g.name)}</span></span>` +
      `<span class="ueb-fortschritt" aria-hidden="true">${geschafft ? `${STERN}<span>Geschafft</span><span class="ueb-trenn">·</span>` : ''}` +
      `<span>${geloest} / ${gesamt}</span>${geschafft && alleZeiten ? `<span class="ueb-trenn">·</span><span class="ueb-wert">${ico(Z.uhr)}${zeit(summe)}</span>` : ''}</span>` +
      `<span class="ueb-sr">${esc(g.name)}, ${geschafft ? 'geschafft, ' : ''}${geloest} von ${gesamt} Level gelöst` +
      `${geschafft && alleZeiten ? `, Summe der Bestzeiten ${sprichZeit(summe)}` : ''}</span>`;
    root.classList.toggle('ueb-geschafft', geschafft);
    stationen.innerHTML = reihen.map((re, r) => (r ? `<span class="ueb-weg${re.lage !== 'spaeter' ? ' ueb-an' : ''}" aria-hidden="true"></span>` : '') +
      `<button class="ueb-tab ueb-${re.lage}" data-reihe="${r}" aria-label="${esc(standText(re))}"><span class="ueb-station">${ico(icons[re.icon])}</span></button>`).join('');
    spur.innerHTML = reihen.map(reiheHtml).join('');
  }

  const kacheln = (r) => [...(spur.children[r]?.querySelectorAll('.ueb-kachel') ?? [])];
  /** die offene Kachel einer Kette ('welt' oder 'dorf') als [Reihe, Level], sonst null */
  function offeneKachel(art) {
    const r = reihen.findIndex((re) => re.art === art && re.zustand.includes('offen'));
    return r < 0 ? null : [r, reihen[r].zustand.indexOf('offen')];
  }
  /** Kachel, die beim Öffnen den Fokus bekommt: gewählt, sonst das laufende Level, sonst das offene, sonst die erste
   * der ersten Welt */
  function startZiel(wahl) {
    const finde = (a) => {
      if (!a) return null;
      const r = reihen.findIndex((re) => re.schluessel === a.welt);
      return r >= 0 && reihen[r].level[a.level ?? 0] ? [r, a.level ?? 0] : null;
    };
    const erste = Math.max(0, reihen.findIndex((re) => re.art === 'welt'));
    return finde(wahl.fokus) ?? finde(daten.aktuell) ?? offeneKachel('welt') ?? offeneKachel('dorf') ?? [erste, 0];
  }

  /** Nur eine Kachel ist mit Tab erreichbar (die zuletzt fokussierte), die übrigen mit den Pfeiltasten */
  function rolle(k) {
    if (!k) return;
    for (const alt of spur.querySelectorAll('.ueb-kachel[tabindex="0"]')) if (alt !== k) alt.tabIndex = -1;
    k.tabIndex = 0;
  }
  function fokussiere(r, l) {
    const k = kacheln(r)[l];
    if (!k) return;
    if (modus === 'seiten' && r !== seite) blaettere(r, { bewegt: Math.abs(r - seite) === 1 });
    rolle(k);
    k.focus();
  }

  // ---------- Seiten: eine Welt je Seite, Blättern mit Bewegung ----------
  function setzeModus() {
    const neu = ALLE.matches ? 'alle' : 'seiten';
    if (neu !== modus) { modus = neu; root.dataset.modus = neu; }
    ordne();
  }
  /** Seiten in Ruhe: nur die gezeigte ist bedienbar (die übrigen liegen daneben, beim Wischen sichtbar) */
  function ordne() {
    beendeFahrt();
    [...spur.children].forEach((s, r) => { s.inert = modus === 'seiten' && r !== seite; });
    schiebe(0);
  }
  const schrittweite = () => spur.clientWidth + (parseFloat(getComputedStyle(spur).columnGap) || 0);
  /** Spur in Ruhe (dx 0) oder um dx px aus der Ruhe (beim Wischen) */
  function schiebe(dx) {
    spur.style.transform = modus === 'seiten' && (seite || dx) ? `translateX(${-seite * schrittweite() + dx}px)` : '';
  }
  function fahre(von, nach) {
    const anim = spur.animate([{ transform: `translateX(${von}px)` }, { transform: `translateX(${nach}px)` }],
      { duration: WISCH.ms * Math.min(1, Math.abs(nach - von) / schrittweite()), easing: WISCH.easing });
    fahrt = { anim };
    anim.onfinish = () => { if (fahrt?.anim === anim) beendeFahrt(); };
  }
  /** laufende Bewegung gleich fertig (der Endstand ist schon gesetzt) */
  function beendeFahrt() {
    const f = fahrt;
    fahrt = null;
    f?.anim.cancel();
  }
  /**
   * Zur Seite ziel blättern: Kopf, Stationen und Pfeile wechseln gleich, die Kacheln fahren (bewegt, ausser bei
   * reduzierter Bewegung). von: wo die Spur beim Wischen schon steht (px aus der Ruhe der alten Seite).
   */
  function blaettere(ziel, { von = 0, bewegt = true } = {}) {
    if (modus !== 'seiten' || ziel < 0 || ziel >= reihen.length || ziel === seite) {
      if (von) zurueck(von);
      return false;
    }
    beendeFahrt();
    const w = schrittweite(), start = -seite * w + von;
    seite = ziel;
    [...spur.children].forEach((s, r) => { s.inert = r !== seite; });
    // Tab führt auf der neuen Seite zu ihrer offenen Kachel, sonst zur ersten
    if (!spur.children[seite].contains(spur.querySelector('.ueb-kachel[tabindex="0"]'))) {
      const z = reihen[seite].zustand.indexOf('offen');
      rolle(kacheln(seite)[Math.max(0, z)]);
    }
    zeigeSeitenkopf();
    schiebe(0);
    if (bewegt && !still()) fahre(start, -seite * w);
    return true;
  }
  /** zu kurz gewischt oder am Rand: zurück in die Ruhe */
  function zurueck(von) {
    schiebe(0);
    if (!still()) fahre(-seite * schrittweite() + von, -seite * schrittweite());
  }
  /** Kopf der gezeigten Seite: Station, Name, Stand; Pfeile und Stationen dazu */
  function zeigeSeitenkopf() {
    const re = reihen[seite];
    if (!re) return;
    seitentitel.innerHTML = `<span class="ueb-seitenname" aria-hidden="true">${ico(icons[re.icon])}<span class="ueb-welt-name">${esc(re.name)}</span></span>` +
      `<span class="ueb-welt-stand" aria-hidden="true">${standHtml(re)}</span><span class="ueb-sr">${esc(standText(re))}</span>`;
    const weg = document.activeElement;
    schritte[0].disabled = seite === 0;
    schritte[1].disabled = seite === reihen.length - 1;
    if (weg?.disabled) schritte[weg === schritte[0] ? 1 : 0].focus(); // Pfeil am Ende: Fokus nicht verlieren
    for (const t of stationen.querySelectorAll('.ueb-tab')) {
      if (+t.dataset.reihe === seite) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    }
  }

  // ---------- Titel: lange Wörter kleiner, nur notfalls mitten im Wort umbrechen ----------
  function passeTitelAn() {
    const namen = [...spur.querySelectorAll('.ueb-name')];
    for (const t of namen) t.classList.remove('ueb-eng', 'ueb-brich');
    const zuBreit = (t) => t.scrollWidth > t.clientWidth + 1;
    const lang = namen.filter(zuBreit);
    lang.forEach((t) => t.classList.add('ueb-eng'));
    lang.filter(zuBreit).forEach((t) => t.classList.add('ueb-brich'));
  }

  // ---------- Hinweis (gesperrte Kachel) ----------
  function sage(text) {
    hinweis.textContent = text;
    hinweis.classList.add('ueb-da');
    clearTimeout(hinweisUhr);
    hinweisUhr = setTimeout(() => hinweis.classList.remove('ueb-da'), 2800);
  }

  // ---------- Bedienung ----------
  spur.addEventListener('click', (e) => {
    const k = e.target.closest('.ueb-kachel');
    if (!k) return;
    const r = +k.closest('.ueb-welt').dataset.reihe, l = kacheln(r).indexOf(k), re = reihen[r], z = re.zustand[l];
    rolle(k);
    if (z === 'gesperrt') {
      const o = offeneKachel(re.art);
      const vor = o && reihen[o[0]];
      sage(vor ? `Gesperrt – erst «${vor.level[o[1]].titel ?? vor.level[o[1]].name ?? ''}» (${vor.name} ${o[1] + 1}) lösen` : 'Gesperrt');
      return;
    }
    onPlay({ welt: re.schluessel, level: l, wiederholen: z === 'geloest', eintrag: re.level[l] });
  });
  stationen.addEventListener('click', (e) => {
    const t = e.target.closest('.ueb-tab');
    if (t) blaettere(+t.dataset.reihe, { bewegt: Math.abs(+t.dataset.reihe - seite) === 1 });
  });
  for (const b of schritte) b.addEventListener('click', () => blaettere(seite + +b.dataset.schritt));
  $('.ueb-schliessen').addEventListener('click', () => onClose());
  // Klick neben die Kacheln (auf den Hintergrund) schliesst wie in der bisherigen Levelauswahl
  root.addEventListener('click', (e) => { if (e.target === root || e.target === rahmen) onClose(); });
  root.addEventListener('focusin', (e) => { if (e.target.classList?.contains('ueb-kachel')) rolle(e.target); });

  /**
   * Tasten (solange offen, vor dem Spiel abgefangen): Pfeile über die Kacheln (links/rechts in der Reihenfolge, auch
   * über die Grenze der Welt; hoch/runter eine Reihe), Pos1/Ende Anfang und Ende der Welt (mit Strg: ganz), Bild↑/↓
   * vorige und nächste Welt, Escape schliesst, Tab bleibt im Dialog. Ausserhalb der Kacheln blättern ←/→ (Seiten).
   */
  function taste(e) {
    if (!offen || e.altKey || e.metaKey || (e.ctrlKey && e.key !== 'Home' && e.key !== 'End')) return;
    const k = e.key, an = document.activeElement, kachel = an?.closest?.('.ueb-kachel');
    const nimm = () => { e.preventDefault(); e.stopPropagation(); };
    if (k === 'Enter' && e.repeat) { nimm(); return; } // gehaltenes Enter (etwa von der Karte im Menü) spielt nichts
    if (k === 'Escape') { nimm(); onClose(); return; }
    if (k === 'Tab') { e.stopPropagation(); falle(e); return; }
    const pfeile = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
    if (!pfeile.includes(k)) return;
    if (kachel && root.contains(kachel)) {
      const r = +kachel.closest('.ueb-welt').dataset.reihe, l = kacheln(r).indexOf(kachel), n = reihen[r].level.length;
      const letzte = (z) => reihen[z].level.length - 1;
      let ziel = null;
      if (k === 'ArrowRight') ziel = l < n - 1 ? [r, l + 1] : r < reihen.length - 1 ? [r + 1, 0] : null;
      else if (k === 'ArrowLeft') ziel = l > 0 ? [r, l - 1] : r > 0 ? [r - 1, letzte(r - 1)] : null;
      else if (k === 'Home') ziel = e.ctrlKey ? [0, 0] : [r, 0];
      else if (k === 'End') ziel = e.ctrlKey ? [reihen.length - 1, letzte(reihen.length - 1)] : [r, n - 1];
      else if (k === 'PageUp' || k === 'PageDown' || modus === 'alle') {
        const z = r + (k === 'PageDown' || k === 'ArrowDown' ? 1 : -1);
        if (z >= 0 && z < reihen.length) ziel = [z, Math.min(l, letzte(z))];
      } else { // Seite: hoch und runter im Raster der Welt
        const sp = getComputedStyle(kachel.closest('.ueb-kacheln')).gridTemplateColumns.split(' ').length || 1;
        const z = l + (k === 'ArrowDown' ? sp : -sp);
        if (z >= 0 && z < n) ziel = [r, z];
        else if (k === 'ArrowDown' && Math.floor(l / sp) < Math.floor((n - 1) / sp)) ziel = [r, n - 1];
      }
      nimm();
      if (ziel) fokussiere(...ziel);
      return;
    }
    if (an?.closest?.('.ueb-stationen') && (k === 'ArrowLeft' || k === 'ArrowRight')) {
      const tabs = [...stationen.querySelectorAll('.ueb-tab')], i = tabs.indexOf(an.closest('.ueb-tab'));
      nimm();
      tabs[Math.min(tabs.length - 1, Math.max(0, i + (k === 'ArrowRight' ? 1 : -1)))]?.focus();
      return;
    }
    if (modus === 'seiten' && ['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(k)) {
      nimm();
      blaettere(seite + (k === 'ArrowRight' || k === 'PageDown' ? 1 : -1));
      return;
    }
    if (!root.contains(an) || an === root) { // Fokus verloren (Klick auf den Hintergrund): zurück auf die Kacheln
      nimm();
      const t = spur.querySelector('.ueb-kachel[tabindex="0"]');
      if (t && !t.closest('[inert]')) t.focus();
    }
  }
  /** Tab und Umschalt+Tab bleiben im Dialog */
  function falle(e) {
    const ziele = [...root.querySelectorAll('button')]
      .filter((b) => b.tabIndex >= 0 && !b.disabled && !b.closest('[inert]') && b.getClientRects().length);
    if (!ziele.length) return;
    const i = ziele.indexOf(document.activeElement);
    if (e.shiftKey ? i <= 0 : i < 0 || i === ziele.length - 1) {
      e.preventDefault();
      ziele[e.shiftKey ? ziele.length - 1 : 0].focus();
    }
  }

  /**
   * Wischen über die Kacheln (Finger oder Stift, nicht die Maus; Kopf, Stationen und Pfeile blättern nicht), wie in
   * der bisherigen Levelauswahl: Die Kacheln folgen dem Finger, die Nachbarwelt fährt daneben herein; beim Loslassen
   * blättert es weiter oder federt zurück. Ein zweiter Finger bricht ab; senkrechtes Ziehen übernimmt der Browser
   * (touch-action: pan-y) und meldet dann pointercancel.
   */
  function loslassen(e, abgebrochen) {
    const w = wisch;
    wisch = null;
    if (!w.waagrecht) return;
    gewischtUm = performance.now();
    const dx = e.clientX - w.x, schritt = dx < 0 ? 1 : -1;
    if (!abgebrochen && Math.abs(dx) >= WISCH.min && reihen[seite + schritt]) blaettere(seite + schritt, { von: w.gezeigt });
    else if (w.gezeigt) zurueck(w.gezeigt);
  }
  root.addEventListener('pointerdown', (e) => {
    gewischtUm = -Infinity; // neues Drücken: sein Klick gilt wieder
    if (!e.isPrimary && wisch) loslassen(e, true);
  });
  fenster.addEventListener('pointerdown', (e) => {
    if (modus !== 'seiten' || e.pointerType === 'mouse' || !e.isPrimary || !e.target.closest('.ueb-kacheln')) return;
    beendeFahrt();
    wisch = { id: e.pointerId, x: e.clientX, y: e.clientY, griff: 0, waagrecht: false, gezeigt: 0 };
  });
  root.addEventListener('pointermove', (e) => {
    const w = wisch;
    if (w?.id !== e.pointerId) return;
    if (!w.waagrecht) {
      const dx = e.clientX - w.x, dy = e.clientY - w.y;
      if (Math.hypot(dx, dy) < WISCH.schwelle) return;
      if (Math.abs(dy) > Math.abs(dx) * WISCH.steigung) { wisch = null; return; } // senkrecht: kein Wischen
      w.waagrecht = true;
      w.griff = e.clientX; // ab hier folgen die Kacheln dem Finger, ohne Sprung
      return;
    }
    if (still()) return;
    const dx = e.clientX - w.griff;
    w.gezeigt = reihen[seite + (dx < 0 ? 1 : -1)] ? dx : dx * WISCH.gummi; // am Anfang und Ende nur zögernd
    schiebe(w.gezeigt);
  });
  root.addEventListener('pointerup', (e) => { if (wisch?.id === e.pointerId) loslassen(e, false); });
  root.addEventListener('pointercancel', (e) => { if (wisch?.id === e.pointerId) loslassen(e, true); });
  // ein Klick gleich nach dem Wischen (ohne neues Drücken) wählt keine Kachel und schliesst nicht; ebenso einer mit
  // Maus oder Finger gleich nach dem Öffnen (der zweite eines Doppelklicks auf den Knopf, der sie geöffnet hat)
  addEventListener('click', (e) => {
    const jetzt = performance.now(), gleich = jetzt - gewischtUm < 400 || e.detail > 0 && jetzt - gezeigtUm < 400;
    if (gleich && root.contains(e.target)) { e.stopPropagation(); e.preventDefault(); }
  }, true);
  addEventListener('resize', () => { if (offen) { setzeModus(); passeTitelAn(); } });

  /**
   * Zeigt die Übersicht mit diesen Daten (jedes Mal neu gezeichnet) und setzt den Fokus: wahl.fokus { welt, level },
   * sonst daten.aktuell, sonst die offene Kachel. Auf Seiten zeigt sie deren Welt.
   */
  function show(d, wahl = {}) {
    gezeigtUm = performance.now();
    daten = d;
    reihen = baueReihen(d);
    zeichne();
    offen = true;
    root.inert = false;
    root.classList.remove('ueb-zu');
    removeEventListener('keydown', taste, true);
    addEventListener('keydown', taste, true);
    const [r, l] = startZiel(wahl);
    seite = r;
    setzeModus();
    zeigeSeitenkopf();
    passeTitelAn();
    document.fonts?.ready?.then(() => { if (offen) passeTitelAn(); });
    const k = kacheln(r)[l];
    rolle(k);
    k?.focus();
    // die Welt erst nach dem Öffnen ansagen, wenn geblättert wird (sonst doppelt mit dem Fokus)
    requestAnimationFrame(() => { if (offen) seitentitel.setAttribute('aria-live', 'polite'); });
  }
  function hide() {
    if (!offen) return;
    offen = false;
    beendeFahrt();
    wisch = null;
    removeEventListener('keydown', taste, true);
    root.classList.add('ueb-zu');
    root.inert = true;
    seitentitel.removeAttribute('aria-live');
    clearTimeout(hinweisUhr);
    hinweis.classList.remove('ueb-da');
    hinweis.textContent = '';
  }
  /**
   * Einmal unsichtbar zeichnen (fast durchsichtig, nicht bedienbar, ohne Fokus), solange nichts anderes läuft: Beim
   * ersten Zeigen stand sonst ein Bild rund 100 ms, während der Browser alles zum ersten Mal zeichnete (danach nicht
   * mehr). Nur, solange sie zu ist; show() zeichnet danach ohnehin neu.
   */
  function vorwaermen(d) {
    if (offen) return;
    daten = d;
    reihen = baueReihen(d);
    zeichne();
    seite = 0;
    setzeModus();
    zeigeSeitenkopf();
    passeTitelAn();
    root.classList.add('ueb-vorwaermen');
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('ueb-vorwaermen')));
  }

  return { show, hide, vorwaermen, get offen() { return offen; } };
}
