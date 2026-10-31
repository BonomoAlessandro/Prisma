/* =====================================================================
   MENÜ DER GESCHICHTE (Ticket 05) — «Lichtwege zum Polarstern».
   Je Grad ein Lichtweg von Noas Lampe zum Polarstern, hell so weit, wie das Licht im Grad gekommen ist; Punkte teilen
   ihn in die sechs Welten. «Weiter» führt zum zuletzt gespielten, nicht geschafften Grad; ein geschaffter Grad trägt
   den Polarstern; «Von vorn» je begonnenem oder geschafftem Grad, mit Rückfrage. Gestalt in menue.css (Präfix menue-).

     const menu = createMenu({ root, onAction });
     menu.show(stand);   // einblenden; ist es offen, mit dem neuen Stand neu zeichnen (Fokus bleibt beim Grad)
     menu.hide();        // ausblenden; Promise, erfüllt, wenn es ganz weg ist
     menu.offen;         // true, solange es offen ist
     menu.keydown(e);    // aus dem Tastatur-Handler des Spiels: true, wenn das Menü die Taste genommen hat

   stand = { grade: { leicht: { stand: 'neu' | 'begonnen' | 'geschafft', welt, geloest }, mittel, schwer,
             'sehr schwer' }, zuletzt: 'mittel', hervorheben: false }
   onAction({ aktion, grad }): 'weiter' | 'beginnen' | 'fortsetzen' | 'uebersicht' | 'vonvorn' (erst nach der Rückfrage).
   Mehr in LIESMICH.md. Ohne Abhängigkeiten vom Spiel; einziger globaler Name ist createMenu.
   ===================================================================== */

const createMenu = (() => {
  /** Die Grade in der Reihenfolge des Menüs; id wie das Feld grad in LEVELS (GRAD_ANZEIGE im Spiel). */
  const GRADE = [
    { id: 'leicht', name: 'Leicht', punkte: 1 },
    { id: 'mittel', name: 'Mittel', punkte: 2 },
    { id: 'schwer', name: 'Schwer', punkte: 3 },
    { id: 'sehr schwer', name: 'Sehr schwer', punkte: 4 },
  ];
  /** Die sechs Welten eines Durchgangs (id wie in STORY_ICONS); vor der ersten Welt ist das Licht im Dorf. */
  const WELTEN = [
    { id: 'wald', name: 'Bergwald' }, { id: 'meer', name: 'Meer' }, { id: 'wueste', name: 'Wüste' },
    { id: 'vulkan', name: 'Vulkan' }, { id: 'planeten', name: 'Planeten' }, { id: 'sterne', name: 'Sterne' },
  ];
  const JE_WELT = 10;
  const LEVEL = WELTEN.length * JE_WELT; // 60 je Grad
  /** Zeichen wie STORY_ICONS im Spiel (createMenu({ icons: STORY_ICONS }) nimmt die des Spiels), dazu «neu starten». */
  const ICONS = {
    wald: '<path d="M12 3.5l-5 7h3l-4.5 6.5h13L14 10.5h3z"/><path d="M12 17v3.5"/>',
    meer: '<path d="M2.5 10c2.4-2.2 4.6-2.2 7 0s4.6 2.2 7 0c1.4-1.3 3.6-1.8 5-1"/><path d="M2.5 15.5c2.4-2.2 4.6-2.2 7 0s4.6 2.2 7 0c1.4-1.3 3.6-1.8 5-1"/>',
    wueste: '<path d="M2.5 19.5l7-11 7 11z"/><path d="M9.5 8.5l2.2 11"/><circle cx="18.2" cy="6" r="2.2"/>',
    vulkan: '<path d="M2.5 19.5l5.5-9h2.2l1.8 2 1.8-2h2.2l5.5 9z"/><path d="M11 7.5c-.6-1.6.6-2.6 0-4.2M14 7.5c.8-1.2 1.8-1.6 2.6-1.2"/>',
    planeten: '<circle cx="12" cy="12" r="4.2"/><ellipse cx="12" cy="12" rx="9.5" ry="3" transform="rotate(-20 12 12)"/>',
    sterne: '<path d="M12 3l1.9 7.1L21 12l-7.1 1.9L12 21l-1.9-7.1L3 12l7.1-1.9z"/>',
    neu: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v3.2h3.2"/>', // «Level neu starten» im Spiel
    pfeil: '<path d="M9.5 5.5l6.5 6.5-6.5 6.5"/>',
  };
  const AKTION = { weiter: 'Weiter', beginnen: 'Beginnen', fortsetzen: 'Fortsetzen', uebersicht: 'Übersicht', vonvorn: 'Von vorn' };
  // gleich wie in menue.css
  const HOCH = '(max-width: 600px) and (orientation: portrait)';
  const STILL = '(prefers-reduced-motion: reduce)';
  const AUS_MS = 800, FRAGE_MS = 300; // Ausblenden des Menüs bzw. der Rückfrage (Transition in menue.css)
  const WACHSEN = { start: 0.35, grund: 0.5, je: 1.3 }; // Einblenden: Beginn (s), Dauer = grund + je · Anteil des Wegs
  let zaehler = 0;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const f = (n) => n.toFixed(1);
  const make = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  };

  /* ---------- Wege als Polylinien: Länge, Punkt und Richtung bei einer Länge, Stück bis zu einer Länge ---------- */

  function weg(pts) {
    const len = [0];
    for (let k = 1; k < pts.length; k++) len.push(len[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
    return { pts, len, L: len[len.length - 1] };
  }
  /** Punkt bei Bogenlänge s, mit Richtung (dx, dy, Länge 1). */
  function punkt(w, s) {
    s = clamp(s, 0, w.L);
    let k = 1;
    while (k < w.pts.length - 1 && w.len[k] < s) k++;
    const a = w.pts[k - 1], b = w.pts[k], l = w.len[k] - w.len[k - 1] || 1, t = (s - w.len[k - 1]) / l;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: (b.x - a.x) / l, dy: (b.y - a.y) / l };
  }
  function stueck(w, s) {
    const out = [w.pts[0]];
    for (let k = 1; k < w.pts.length && w.len[k] < s; k++) out.push(w.pts[k]);
    out.push(punkt(w, s));
    return out;
  }
  /** Von A über die Ecke C nach S, die Ecke mit Radius r gerundet (quadratische Kurve, in Stücken). */
  function ecke(A, C, S, r) {
    const ein = Math.hypot(A.x - C.x, A.y - C.y), aus = Math.hypot(S.x - C.x, S.y - C.y);
    r = Math.min(r, ein * 0.9, aus * 0.5);
    const P = { x: C.x + (A.x - C.x) / ein * r, y: C.y + (A.y - C.y) / ein * r };
    const Q = { x: C.x + (S.x - C.x) / aus * r, y: C.y + (S.y - C.y) / aus * r };
    const pts = [A, P];
    for (let k = 1; k < 10; k++) {
      const t = k / 10, u = 1 - t;
      pts.push({ x: u * u * P.x + 2 * u * t * C.x + t * t * Q.x, y: u * u * P.y + 2 * u * t * C.y + t * t * Q.y });
    }
    pts.push(Q, S);
    return pts;
  }
  const punkte = (pts) => pts.map((p) => `${f(p.x)},${f(p.y)}`).join(' ');

  /* ---------- Stand lesen ---------- */

  /** Stand des Spiels in die Daten des Menüs; Fehlendes gilt als «neu», Zahlen werden begrenzt. */
  function lies(stand, uebersicht) {
    const grade = GRADE.map((g, i) => {
      const s = stand?.grade?.[g.id] ?? {};
      const art = s.stand === 'begonnen' || s.stand === 'geschafft' ? s.stand : 'neu';
      const geloest = art === 'geschafft' ? LEVEL : art === 'neu' ? 0 : clamp(Math.floor(+s.geloest || 0), 0, LEVEL);
      // Welt: id oder Nummer 0 … 5; 'dorf' vor der ersten Welt (Prolog, «Im Dorf»); fehlt sie, aus den gelösten Leveln
      let welt = typeof s.welt === 'number' ? Math.floor(s.welt) : WELTEN.findIndex((w) => w.id === s.welt);
      const dorf = art === 'begonnen' && s.welt === 'dorf';
      if (art !== 'begonnen') welt = art === 'geschafft' ? WELTEN.length : -1;
      else if (dorf) welt = -1;
      else if (!(welt >= 0 && welt < WELTEN.length)) welt = Math.min(WELTEN.length - 1, Math.floor(geloest / JE_WELT));
      const aktion = art === 'geschafft' ? (uebersicht ? 'uebersicht' : 'vonvorn') : art === 'neu' ? 'beginnen' : 'fortsetzen';
      return { ...g, i, art, geloest, welt, dorf, aktion, anteil: geloest / LEVEL };
    });
    const zuletzt = grade.find((g) => g.id === stand?.zuletzt) ?? null;
    const weiter = zuletzt?.art === 'begonnen' ? zuletzt : null;
    // hervorheben: true → der nächstschwerere, noch nicht geschaffte Grad nach dem zuletzt geschafften; oder eine id
    let hervor = null;
    if (typeof stand?.hervorheben === 'string') hervor = grade.find((g) => g.id === stand.hervorheben) ?? null;
    else if (stand?.hervorheben && zuletzt?.art === 'geschafft') hervor = grade.slice(zuletzt.i + 1).find((g) => g.art !== 'geschafft') ?? null;
    return { grade, zuletzt, weiter, hervor };
  }
  const weltName = (g) => (g.dorf ? 'Dorf' : WELTEN[g.welt].name);
  const ariaStand = (g) => (g.art === 'geschafft' ? 'geschafft, Polarstern erreicht' : g.art === 'neu' ? 'noch nicht begonnen'
    : `begonnen, ${g.dorf ? 'im Dorf' : weltName(g)}, ${g.geloest} von ${LEVEL} Leveln gelöst`);

  /* ---------- Baustein ---------- */

  return function createMenu({ root, onAction = () => {}, uebersicht = true, icons = {} } = {}) {
    if (!root) throw new Error('createMenu: root fehlt');
    const uid = `menue-${++zaehler}`;
    const ICO = { ...ICONS, ...icons };
    const icon = (id) => `<svg class="menue-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICO[id]}</svg>`;
    const stern = () => `<span class="menue-stern" aria-hidden="true"><svg viewBox="0 0 100 100" focusable="false"><use href="#${uid}-stern"/></svg></span>`;

    root.classList.add('menue', 'menue-aus');
    root.hidden = true;
    root.inert = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Menü');
    root.innerHTML = `
      <svg class="menue-defs" aria-hidden="true" focusable="false"><defs>
        <radialGradient id="${uid}-hof"><stop offset="0" stop-color="#ffffff" stop-opacity="0.6"/><stop offset="0.22" stop-color="#cdd4ff" stop-opacity="0.26"/><stop offset="1" stop-color="#aab4ff" stop-opacity="0"/></radialGradient>
        <radialGradient id="${uid}-strahl"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#e6eaff" stop-opacity="0.5"/><stop offset="1" stop-color="#e6eaff" stop-opacity="0"/></radialGradient>
        <symbol id="${uid}-stern" viewBox="-50 -50 100 100">
          <circle r="48" fill="url(#${uid}-hof)"/>
          <path d="M0-46L2.4-2.4 30 0 2.4 2.4 0 46-2.4 2.4-30 0-2.4-2.4z" fill="url(#${uid}-strahl)"/>
          <path d="M0-16L1.2-1.2 16 0 1.2 1.2 0 16-1.2 1.2-16 0-1.2-1.2z" fill="#fff" transform="rotate(45)" opacity="0.55"/>
          <circle r="4.2" fill="#fff"/>
        </symbol>
      </defs></svg>
      <div class="menue-inhalt">
        <svg class="menue-wege" aria-hidden="true" focusable="false"></svg>
        <header class="menue-kopf"><h2 class="menue-titel">Prisma</h2><p class="menue-unter">Ein Lichtsignal an die Sterne</p></header>
        <div class="menue-ziel" aria-hidden="true">${stern()}<span class="menue-wort">Polarstern</span></div>
        <button type="button" class="menue-weiter" data-menue-fokus="weiter" hidden><span>Weiter</span><span class="menue-wohin"></span></button>
        <ol class="menue-grade" aria-label="Grade"></ol>
      </div>
      <div class="menue-frage menue-aus" role="alertdialog" aria-modal="true" aria-labelledby="${uid}-frage-titel" aria-describedby="${uid}-frage-text" hidden>
        <div class="menue-frage-box">
          <h3 class="menue-frage-titel" id="${uid}-frage-titel"></h3>
          <p class="menue-frage-text" id="${uid}-frage-text"></p>
          <div class="menue-frage-knoepfe">
            <button type="button" class="menue-pille" data-menue-frage="nein">Abbrechen</button>
            <button type="button" class="menue-pille menue-pille-ja" data-menue-frage="ja">Von vorn</button>
          </div>
        </div>
      </div>
      <p class="menue-sr" aria-live="polite"></p>`;
    const $ = (sel) => root.querySelector(sel);
    // Fokusrahmen erst nach einer Taste: Chrome zeigt ihn sonst auch, wenn das Menü nach einem Klick ins Leere (etwa auf
    // den Startbildschirm) den Fokus setzt; mit Zeiger oder Finger bedient, bleibt er weg (menue.css .menue-zeiger)
    addEventListener('pointerdown', () => root.classList.add('menue-zeiger'), true);
    addEventListener('keydown', () => root.classList.remove('menue-zeiger'), true);
    const inhalt = $('.menue-inhalt'), svg = $('.menue-wege'), liste = $('.menue-grade'), weiterBtn = $('.menue-weiter');
    const sternEl = $('.menue-ziel .menue-stern'), frageEl = $('.menue-frage'), sr = $('.menue-sr');
    const neinBtn = $('[data-menue-frage="nein"]'), jaBtn = $('[data-menue-frage="ja"]');

    let daten = lies({}, uebersicht);
    let offen = false;
    let gesperrt = false;   // nach einer Aktion (ausser «Von vorn») bis zum nächsten show(): kein Doppelklick
    let frage = null;       // Grad der offenen Rückfrage
    let frageVon = null;    // Knopf, der sie geöffnet hat (bekommt den Fokus zurück)
    let aktiv = null;       // Grad unter Zeiger oder Fokus: sein Weg heller
    let wachsenSeit = -Infinity; // Zeit des Einblendens (performance.now) für die Bewegung der Wege
    let zeitAus = 0, zeitFrage = 0, plan = 0;

    /* ---------- Aufbau der Grade ---------- */

    function render() {
      liste.replaceChildren();
      for (const g of daten.grade) {
        const li = make('li', `menue-grad menue-${g.art}`);
        li.dataset.grad = g.id;
        li.style.setProperty('--menue-i', g.i);
        if (g === daten.hervor) li.classList.add('menue-hervor');
        if (g === daten.weiter) li.classList.add('menue-zuletzt');

        const lampe = make('span', 'menue-lampe');
        lampe.setAttribute('aria-hidden', 'true');

        const wahl = make('button', 'menue-wahl');
        wahl.type = 'button';
        wahl.dataset.menueFokus = `wahl:${g.id}`;
        wahl.setAttribute('aria-label', `${g.name}: ${ariaStand(g)}${g === daten.hervor ? ', als Nächstes empfohlen' : ''}. ${AKTION[g.aktion]}`);
        if (g.aktion === 'vonvorn') wahl.setAttribute('aria-haspopup', 'dialog');
        const zeile = make('span', 'menue-zeile1');
        const pips = make('span', 'menue-pips');
        for (let k = 1; k <= 4; k++) pips.append(make('i', k <= g.punkte ? 'menue-on' : ''));
        zeile.append(pips, make('span', 'menue-name', g.name));
        const stand = make('span', 'menue-stand');
        if (g.art === 'geschafft') { stand.innerHTML = stern(); stand.append(make('span', '', 'Geschafft')); }
        else if (g.art === 'neu') stand.textContent = 'noch nicht begonnen';
        else stand.append(make('span', '', weltName(g)), make('span', 'menue-trenn', '·'), make('span', 'menue-zahl', `${g.geloest} / ${LEVEL}`));
        const aktion = make('span', 'menue-aktion', AKTION[g.aktion]);
        aktion.insertAdjacentHTML('beforeend', icon('pfeil'));
        wahl.append(zeile, stand, aktion);
        wahl.addEventListener('click', () => (g.aktion === 'vonvorn' ? oeffneFrage(g, wahl) : melde(g.aktion, g)));
        li.append(wahl, lampe);

        // «Von vorn» bei begonnenem oder geschafftem Grad (ohne Übersicht ist es beim geschafften schon die Karte)
        if (g.art !== 'neu' && g.aktion !== 'vonvorn') {
          const vv = make('button', 'menue-vonvorn');
          vv.type = 'button';
          vv.dataset.menueFokus = `vonvorn:${g.id}`;
          vv.setAttribute('aria-label', `${g.name} von vorn beginnen`);
          vv.setAttribute('aria-haspopup', 'dialog');
          vv.innerHTML = `${icon('neu')}<span>Von vorn</span>`;
          vv.addEventListener('click', () => oeffneFrage(g, vv));
          li.append(vv);
        }
        liste.append(li);
      }
      const w = daten.weiter;
      weiterBtn.hidden = !w;
      root.classList.toggle('menue-mit-weiter', !!w);
      if (w) {
        weiterBtn.querySelector('.menue-wohin').textContent = `${w.name} · ${weltName(w)} ${w.geloest} / ${LEVEL}`;
        weiterBtn.setAttribute('aria-label', `Weiter: ${w.name}, ${w.dorf ? 'im Dorf' : weltName(w)}, ${w.geloest} von ${LEVEL} Leveln gelöst`);
      }
    }

    /* ---------- Wege zeichnen (bei jeder Grössenänderung neu) ---------- */

    function zeichne() {
      if (!offen) return;
      const R = root.getBoundingClientRect(), W = R.width, H = R.height;
      if (!W || !H) return;
      const mitte = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - R.left + r.width / 2, y: r.top - R.top + r.height / 2 }; };
      const hoch = matchMedia(HOCH).matches;
      const S = mitte(sternEl);
      const lis = [...liste.children];
      const lampen = lis.map((li) => mitte(li.querySelector('.menue-lampe')));
      const listeOben = lis.length ? lis[0].getBoundingClientRect().top - R.top : H;
      // hochkant: senkrecht vor der Lampe hinauf bis über die Zeilen, dort zum Stern; je schwerer, desto höher biegt er
      // ab (Leicht innen und am tiefsten): so kreuzen sich die Wege nie, und keiner läuft über eine Beschriftung
      const abstand = clamp((listeOben - 12 - (S.y + 50)) / 4, 6, 22);
      const wege = daten.grade.map((g, i) => {
        const A = lampen[i];
        const T = listeOben - 12 - i * abstand;
        if (hoch && T < A.y - 2 && T > S.y + 20) return weg(ecke(A, { x: A.x, y: T }, S, Math.min(14, abstand * 0.7)));
        return weg([A, S]);
      });

      // Bewegung beim Einblenden: was schon vergangen ist, rechnet das CSS ab (Neuzeichnen mitten im Wachsen)
      const vorbei = (performance.now() - wachsenSeit) / 1000;
      const wachsen = vorbei < 3.2 && !matchMedia(STILL).matches;
      svg.classList.toggle('menue-wachsen', wachsen);
      svg.style.setProperty('--menue-vorbei', `${Math.max(0, vorbei).toFixed(3)}s`);
      const dauer = (g) => WACHSEN.grund + WACHSEN.je * g.anteil;
      // Zeitpunkt, an dem das Licht den Bruchteil y seines Wegs erreicht (Umkehrung von ease-out-cubic)
      const bei = (g, y) => WACHSEN.start + dauer(g) * (1 - Math.cbrt(1 - clamp(y, 0, 1)));

      // die sechs Welten als Zeichen: auf dem Weg von «Weiter», sonst des hervorgehobenen, ganz neu auf dem leichten
      const haupt = daten.weiter ?? daten.hervor ?? (daten.grade.every((g) => g.art === 'neu') ? daten.grade[0] : null);
      let unten = '', oben = '';
      daten.grade.forEach((g, i) => {
        const w = wege[i], p = g.anteil, s = p * w.L;
        const cls = ['menue-weg', `menue-${g.art}`, g === daten.hervor && 'menue-hervor', g.id === aktiv && 'menue-an'].filter(Boolean).join(' ');
        let teil = `<polyline class="menue-grund" points="${punkte(w.pts)}"/>`;
        if (p > 0) {
          const z = `style="--len:${f(s)};--dur:${dauer(g).toFixed(2)}s;--d:${WACHSEN.start}s" points="${punkte(stueck(w, s))}"`;
          teil += `<polyline class="menue-hof" ${z}/><polyline class="menue-licht" filter="url(#${uid}-leuchten)" ${z}/>`;
        }
        unten += `<g class="${cls}" data-grad="${g.id}">${teil}</g>`;
        // Grenzen der Welten
        for (let k = 1; k < WELTEN.length; k++) {
          const y = k / WELTEN.length, P = punkt(w, y * w.L), an = y <= p + 1e-9, c = `cx="${f(P.x)}" cy="${f(P.y)}"`;
          oben += `<circle class="menue-station" ${c} r="2.4"/>`; // darüber geht er an, wenn das Licht ihn erreicht
          if (an) oben += `<circle class="menue-station menue-an menue-auf" style="--d:${bei(g, y / p).toFixed(2)}s" ${c} r="2.6"/>`;
        }
        if (g === haupt) {
          const s2 = hoch ? 15 : 17, o = hoch ? 0 : 19; // hochkant auf dem Weg (die Bahnen liegen eng), sonst daneben
          WELTEN.forEach((welt, k) => {
            const y = (k + 0.5) / WELTEN.length, M = punkt(w, y * w.L);
            const n = { x: M.dy, y: -M.dx }; // links der Richtung zum Stern
            const x = M.x + n.x * o, yy = M.y + n.y * o;
            const zcls = k < g.welt ? 'menue-an' : k === g.welt ? 'menue-jetzt' : '';
            const auf = y <= p ? ` menue-auf" style="--d:${bei(g, y / p).toFixed(2)}s` : '';
            oben += `<g class="menue-welt ${zcls}${auf}"${k === g.welt ? ` filter="url(#${uid}-leuchten)"` : ''}>`
              + (hoch ? `<circle class="menue-scheibe" cx="${f(x)}" cy="${f(yy)}" r="${s2 / 2 + 3}"/>` : '')
              + `<svg x="${f(x - s2 / 2)}" y="${f(yy - s2 / 2)}" width="${s2}" height="${s2}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ICO[welt.id]}</svg></g>`;
          });
        }
        // Kopf des Lichts: gross am Weg von «Weiter», klein bei den übrigen begonnenen
        if (g.art === 'begonnen' && p > 0) {
          const K = punkt(w, s), d = `style="--d:${(WACHSEN.start + dauer(g) * 0.85).toFixed(2)}s"`;
          oben += g === daten.weiter
            ? `<g class="menue-auf" ${d}><circle cx="${f(K.x)}" cy="${f(K.y)}" r="20" fill="url(#${uid}-kopf)"/><circle cx="${f(K.x)}" cy="${f(K.y)}" r="3.6" fill="#fff"/></g>`
            : `<circle class="menue-auf" ${d} cx="${f(K.x)}" cy="${f(K.y)}" r="2.8" fill="#fff"/>`;
        }
      });

      // «Weiter» (Desktop, quer) unter dem Kopf des Lichts, mit feiner Linie dorthin; nie über die Beschriftung der
      // Grade, nie über den Rand; hochkant liegt es fest unten (CSS)
      weiterBtn.style.left = weiterBtn.style.top = '';
      const wg = daten.weiter;
      if (wg && !hoch) {
        const w = wege[wg.i], K = punkt(w, wg.anteil * w.L);
        let u = { x: -K.dy, y: K.dx }; // rechts der Richtung: beim Weg nach rechts oben ist das unten
        if (u.y < 0) u = { x: -u.x, y: -u.y };
        const r = weiterBtn.getBoundingClientRect(), bw = r.width, bh = r.height;
        const ab = bh / 2 + 26, rand = 16;
        if (K.y + u.y * ab + bh / 2 > H - rand) u = { x: -u.x, y: -u.y }; // unten kein Platz: über den Weg
        const links = Math.max(...lampen.map((a) => a.x)) + 28 + bw / 2;
        const B = {
          x: Math.max(links, Math.min(K.x + u.x * ab, W - rand - bw / 2)),
          y: clamp(K.y + u.y * ab, rand + bh / 2, H - rand - bh / 2),
        };
        weiterBtn.style.left = `${f(B.x)}px`;
        weiterBtn.style.top = `${f(B.y)}px`;
        // Linie vom Kopf bis an den Rand der Pille
        const v = { x: K.x - B.x, y: K.y - B.y }, t = Math.min(bw / 2 / Math.abs(v.x || 1e-6), bh / 2 / Math.abs(v.y || 1e-6));
        if (t < 1) {
          const E = { x: B.x + v.x * t, y: B.y + v.y * t }, l = Math.hypot(K.x - E.x, K.y - E.y);
          if (l > 14) {
            const a = { x: K.x + (E.x - K.x) / l * 7, y: K.y + (E.y - K.y) / l * 7 };
            oben += `<line class="menue-faden menue-auf" style="--d:${(WACHSEN.start + dauer(wg) * 0.85).toFixed(2)}s" x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(E.x)}" y2="${f(E.y)}"/>`;
          }
        }
      }

      svg.setAttribute('viewBox', `0 0 ${f(W)} ${f(H)}`);
      svg.innerHTML = `<defs>
          <filter id="${uid}-leuchten" filterUnits="userSpaceOnUse" x="0" y="0" width="${f(W)}" height="${f(H)}">
            <feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="${uid}-kopf"><stop offset="0" stop-color="#fff" stop-opacity="0.75"/><stop offset="0.35" stop-color="#cdd4ff" stop-opacity="0.25"/><stop offset="1" stop-color="#aab4ff" stop-opacity="0"/></radialGradient>
        </defs>${unten}${oben}`;
    }
    /** Neu zeichnen im nächsten Bild (mehrere Anlässe zugleich: einmal). */
    function planen() {
      if (!offen || plan) return;
      plan = requestAnimationFrame(() => { plan = 0; zeichne(); });
    }
    const beobachter = typeof ResizeObserver === 'function' ? new ResizeObserver(planen) : null;
    addEventListener('resize', planen);
    document.fonts?.ready?.then(planen);

    /** Zeiger oder Fokus auf einem Grad: sein Weg heller. */
    function setzeAktiv(id) {
      if (id === aktiv) return;
      aktiv = id;
      for (const el of svg.querySelectorAll('.menue-weg')) el.classList.toggle('menue-an', el.dataset.grad === id);
    }
    const gradVon = (el) => (el === weiterBtn ? daten.weiter?.id ?? null : el?.closest?.('.menue-grad')?.dataset.grad ?? null);
    inhalt.addEventListener('pointerover', (e) => setzeAktiv(gradVon(e.target)));
    inhalt.addEventListener('pointerleave', () => setzeAktiv(gradVon(document.activeElement)));
    inhalt.addEventListener('focusin', (e) => setzeAktiv(gradVon(e.target)));

    /* ---------- Fokus ---------- */

    const ziel = (key) => (key ? root.querySelector(`[data-menue-fokus="${CSS.escape(key)}"]`) : null);
    function fokussiere(key) {
      const el = ziel(key);
      if (el && !el.hidden) el.focus({ preventScroll: true });
      return !!el;
    }
    /** Wohin der Fokus beim Öffnen geht: «Weiter», sonst der hervorgehobene, der zuletzt gespielte, der erste Grad. */
    function startFokus() {
      if (daten.weiter) return 'weiter';
      const g = daten.hervor ?? daten.zuletzt ?? daten.grade.find((x) => x.art === 'begonnen') ?? daten.grade[0];
      return `wahl:${g.id}`;
    }
    /** Haltepunkte der Pfeiltasten: «Weiter», dann die Grade von oben nach unten. */
    const halte = () => [...(daten.weiter ? [weiterBtn] : []), ...liste.querySelectorAll('.menue-wahl')];

    /* ---------- Aktionen und Rückfrage ---------- */

    function melde(aktion, g) {
      if (gesperrt || !offen) return;
      if (aktion !== 'vonvorn') gesperrt = true; // das Spiel blendet das Menü aus; show() gibt es wieder frei
      onAction({ aktion, grad: g.id });
    }
    weiterBtn.addEventListener('click', () => { if (daten.weiter) melde('weiter', daten.weiter); });

    function oeffneFrage(g, von) {
      if (!offen || gesperrt) return;
      clearTimeout(zeitFrage);
      frage = g;
      frageVon = von?.dataset.menueFokus ?? null;
      $('.menue-frage-titel').textContent = `${g.name} von vorn beginnen?`;
      $('.menue-frage-text').textContent = g.art === 'geschafft'
        ? `Der Stand dieses Grads wird gelöscht, auch der erreichte Polarstern. Die anderen Grade bleiben, wie sie sind.`
        : `Der Stand dieses Grads wird gelöscht (${g.dorf ? 'im Dorf' : weltName(g)}, ${g.geloest} von ${LEVEL} Leveln). Die anderen Grade bleiben, wie sie sind.`;
      inhalt.inert = true;
      frageEl.hidden = false;
      void frageEl.offsetWidth; // erst sichtbar setzen, dann einblenden
      frageEl.classList.remove('menue-aus');
      neinBtn.focus({ preventScroll: true }); // sicher: Abbrechen zuerst
    }
    /** ja: bestätigt («Von vorn» an das Spiel); sofort: ohne Ausblenden und ohne Fokus (show, hide). */
    function schliesseFrage(ja = false, sofort = false) {
      if (!frage) return;
      const g = frage;
      frage = null;
      frageEl.classList.add('menue-aus');
      inhalt.inert = false;
      clearTimeout(zeitFrage);
      const weg = () => { if (!frage) frageEl.hidden = true; };
      if (sofort) { weg(); return; }
      zeitFrage = setTimeout(weg, FRAGE_MS);
      if (!ja) { fokussiere(frageVon) || fokussiere(`wahl:${g.id}`); return; }
      fokussiere(`wahl:${g.id}`); // vor onAction: ein show() darin behält den Fokus beim Grad
      melde('vonvorn', g);
      fokussiere(`wahl:${g.id}`) || fokussiere(startFokus());
      sage(`${g.name}: Stand gelöscht.`);
    }
    neinBtn.addEventListener('click', () => schliesseFrage(false));
    jaBtn.addEventListener('click', () => schliesseFrage(true));
    frageEl.addEventListener('click', (e) => { if (e.target === frageEl) schliesseFrage(false); });

    /** Meldung für den Bildschirmleser (leeren und neu setzen: auch dieselbe Meldung zweimal). */
    function sage(text) {
      sr.textContent = '';
      requestAnimationFrame(() => { sr.textContent = text; });
    }

    /* ---------- Tasten ---------- */

    /** true: die Taste gehört dem Menü (Standardaktion verhindert). */
    function taste(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return false;
      if (frage) {
        if (e.key === 'Escape') { schliesseFrage(false); return true; }
        // in der Rückfrage bleiben: Tab und Pfeile wechseln zwischen den zwei Knöpfen
        if (e.key === 'Tab' || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          (document.activeElement === neinBtn ? jaBtn : neinBtn).focus();
          return true;
        }
        return false;
      }
      const schritt = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!schritt && e.key !== 'Home' && e.key !== 'End') return false;
      const stopps = halte();
      if (!stopps.length) return false;
      const akt = document.activeElement;
      let i = stopps.indexOf(akt);
      if (i < 0 && akt?.closest?.('.menue-grad')) i = stopps.indexOf(akt.closest('.menue-grad').querySelector('.menue-wahl'));
      let el;
      if (e.key === 'Home') el = stopps[0];
      else if (e.key === 'End') el = stopps[stopps.length - 1];
      else if (i < 0) el = ziel(startFokus());
      else el = stopps[clamp(i + schritt, 0, stopps.length - 1)];
      el?.focus({ preventScroll: true });
      return true;
    }
    root.addEventListener('keydown', (e) => {
      if (!offen || e.defaultPrevented) return;
      if (taste(e)) { e.preventDefault(); e.stopPropagation(); }
    });

    /* ---------- Öffnen und Schliessen ---------- */

    return {
      get offen() { return offen; },
      /** Einblenden mit dem Stand des Spiels; ist das Menü schon offen, neu aufbauen (Fokus bleibt beim selben Knopf). */
      show(stand = {}) {
        daten = lies(stand, uebersicht);
        gesperrt = false;
        const war = offen;
        const key = war && root.contains(document.activeElement) ? document.activeElement.dataset?.menueFokus : null;
        if (war && frage) schliesseFrage(false, true);
        render();
        if (!war) {
          offen = true;
          clearTimeout(zeitAus);
          root.hidden = false;
          root.inert = false;
          void root.offsetWidth; // erst sichtbar setzen, dann einblenden
          root.classList.remove('menue-aus');
          weiterBtn.classList.toggle('menue-auf', !matchMedia(STILL).matches);
          wachsenSeit = performance.now();
          aktiv = null;
          beobachter?.observe(root);
          beobachter?.observe(liste);
          zeichne();
          fokussiere(startFokus());
        } else {
          zeichne();
          if (key) fokussiere(key) || fokussiere(startFokus());
        }
      },
      /** Ausblenden; erfüllt, wenn es ganz weg ist (dann hidden). */
      hide() {
        if (!offen) return Promise.resolve();
        offen = false;
        schliesseFrage(false, true);
        if (root.contains(document.activeElement)) document.activeElement.blur();
        root.inert = true;
        root.classList.add('menue-aus');
        beobachter?.disconnect();
        cancelAnimationFrame(plan);
        plan = 0;
        clearTimeout(zeitAus);
        return new Promise((resolve) => {
          zeitAus = setTimeout(() => { if (!offen) root.hidden = true; resolve(); }, AUS_MS);
        });
      },
      /**
       * Für den Tastatur-Handler des Spiels, solange das Menü offen ist: true, wenn die Taste dem Menü gehört (dann
       * nichts weiter tun). Liegt der Fokus ausserhalb (Klick ins Leere), holen ihn Pfeile und Tab zurück ins Menü.
       */
      keydown(e) {
        if (!offen) return false;
        if (root.contains(e.target)) return e.defaultPrevented || taste(e) && (e.preventDefault(), true);
        if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'].includes(e.key)) {
          e.preventDefault();
          if (frage) neinBtn.focus(); else fokussiere(startFokus());
          return true;
        }
        if (frage && e.key === 'Escape') { schliesseFrage(false); return true; }
        return false;
      },
    };
  };
})();
