// Menü der Geschichte (Sternkarte mit Reitern) (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import { createSprachliste } from './sprachliste.js';
import { beiSprachwechsel, setzeSprache, sprache, spracheName, t, VORHANDEN } from '../../texte/sprache.js';

/* =====================================================================
   MENÜ DER GESCHICHTE (Ticket 05; seit Ticket 08 von .scratch/kleiner-wagen/ «Sternkarte mit Reitern», Variante F des
   Skizzenkatalogs, gewählt vom Nutzer). Die vier Grade sind Reiter; der gewählte zeigt seinen Kleinen Wagen wie auf
   einer Sternkarte: Kreise um den Polarstern, die Namen der Welten an ihren Sternen, die Grösse der Punkte nach der
   echten Helligkeit, noch fehlende Linien gestrichelt, der Stern der Welt, in der das Licht ist, mit Ring. Darunter der
   Knopf des Grads (Weiter, Beginnen, Fortsetzen, Übersicht) und «Von vorn» mit Rückfrage. «Weiter» heisst der Knopf des
   zuletzt gespielten, nicht geschafften Grads; ihn zeigt das Menü beim Öffnen. Ist seit dem letzten Zeigen eines Grads
   (in dieser Sitzung) ein Stern erwacht, blitzt er auf, und seine Linien ziehen sich (der Moment aus dem Katalog).
   Desktop und Handy quer: Reiter links untereinander, die Karte daneben, der Knopf darunter; Handy hoch: Reiter oben
   als Segmente, darunter Karte und Stand, der Knopf ganz unten in Reichweite des Daumens. Oben rechts der Schalter
   der Sprache (Ticket 07 von .scratch/umbau/; das Spiel hat keine eigenen Einstellungen): Globus, der Name der Sprache
   (auf dem Handy, hochkant und quer, ihr Kürzel «DE») und ein ▾. Er öffnet eine Liste aller Sprachen, nach unten
   (createSprachliste in sprachliste.js, Ticket 02 von .scratch/sprachwahl/; Esc schliesst nur sie, nicht das Menü).
   Eine andere wählen wechselt ohne Neuladen (Ticket 01): Das Menü bleibt offen und schreibt seine Texte neu (Reiter,
   Karte, Knopf, Stand, eine offene Rückfrage, Schalter und Liste), der Fokus liegt auf dem Schalter, und der
   Bildschirmleser hört die neue Sprache; auch ein geschlossenes Menü folgt einem Wechsel. Texte über
   die Übersetzungsschicht (t), die Namen von Graden, Welten und Aktionen erst beim Lesen. Gestalt im Stil (Präfix
   menue-). Der Baustein .scratch/noa-geschichte/bausteine/menue/ («Lichtwege») ist damit überholt.

     const menu = createMenu({ root, onAction, wagen });
     menu.show(stand);   // einblenden; ist es offen, mit dem neuen Stand neu zeichnen (Fokus und Reiter bleiben)
     menu.hide();        // ausblenden; Promise, erfüllt, wenn es ganz weg ist (hide(true): sofort, Testschnittstelle)
     menu.offen;         // true, solange es offen ist
     menu.vorwaermen(stand); // einmal unsichtbar zeichnen, solange es zu ist (Startbildschirm)
     menu.keydown(e);    // aus dem Tastatur-Handler des Spiels: true, wenn das Menü die Taste genommen hat

   stand = { grade: { leicht: { stand: 'neu' | 'begonnen' | 'geschafft', welt, geloest, wach }, mittel, schwer,
             'sehr schwer' }, zuletzt: 'mittel', hervorheben: false }   (das Spiel: story.menuStand)
   wach: so viele Sterne des Wagens sind in diesem Grad wach (0 … 7 mit dem Polarstern; das Spiel: wagen.stand); ohne
   Angabe aus den gelösten Leveln.
   wagen: Form und Linien des Kleinen Wagens { form, linien, polarstern } (im Spiel das Modul wagen).
   onAction({ aktion, grad }): 'weiter' | 'beginnen' | 'fortsetzen' | 'uebersicht' | 'vonvorn' (nach der Rückfrage).
   Bedienung: Ein Reiter wählt seinen Grad (Klick, Tippen, Fokus); der Knopf und Enter auf einem Reiter führen die
   Aktion des Grads aus. Pfeile: der Knopf, dann die Reiter von oben nach unten (Pos1, Ende); solange die Liste der
   Sprachen offen ist, bedienen Pfeile, Pos1, Ende, Enter, Tab und Esc nur sie. Wischen (Finger oder Stift, nicht die
   Maus) über Karte, Reiter und Stand wählt den Nachbargrad, mit Bewegung wie das Blättern in der Übersicht: Die Karte
   folgt dem Finger, die des Nachbargrads fährt daneben herein, beim Loslassen gleitet sie ganz herein oder federt
   zurück; bei Leicht und Sehr schwer nur zögernd (Gummiband). Ohne Abhängigkeiten vom übrigen Spiel.
   ===================================================================== */

const createMenu = (() => {
  /**
   * Die Grade in der Reihenfolge des Menüs; id wie das Feld grad in LEVELS (GRAD_ANZEIGE im Spiel). Den Namen holt ein
   * Getter erst beim Lesen, in der aktuellen Sprache.
   */
  const GRADE = [
    { id: 'leicht', get name() { return t('grad.leicht'); }, punkte: 1 },
    { id: 'mittel', get name() { return t('grad.mittel'); }, punkte: 2 },
    { id: 'schwer', get name() { return t('grad.schwer'); }, punkte: 3 },
    { id: 'sehr schwer', get name() { return t('grad.sehrSchwer'); }, punkte: 4 },
  ];
  /** Die sechs Welten eines Durchgangs, Welt i weckt Stern i + 1; vor der ersten Welt ist das Licht im Dorf. */
  const WELTEN = ['wald', 'meer', 'wueste', 'vulkan', 'planeten', 'sterne']
    .map((id) => ({ id, get name() { return t(`welt.${id}`); } }));
  const JE_WELT = 10;
  const LEVEL = WELTEN.length * JE_WELT; // 60 je Grad
  /** Zeichen im Strich der STORY_ICONS: «Von vorn» wie «Level neu starten» im Spiel; die Sprache ein Globus. */
  const ICONS = {
    neu: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v3.2h3.2"/>',
    sprache: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5s1.2-6.2 3.6-8.5z"/>',
  };
  /**
   * Datenschutzerklärung (Ticket 10 von .scratch/umbau/, PLAN 4.9; unten links, hoch oben links): in einem neuen Tab.
   * Im Browser die Seite neben dem Spiel (auch offline, im Speicher des Service Workers); in der Android-App
   * (PRISMA_APP) die auf GitHub Pages, die Capacitor im Browser des Handys öffnet: In der WebView ersetzte sie das Spiel,
   * und die Zurück-Taste fände dort keinen Weg zurück. Englisch springt zum englischen Teil. In der aktuellen Sprache
   * (ein Wechsel ohne Neuladen setzt Text und Ziel des Links neu).
   */
  const datenschutz = () => (window.PRISMA_APP ? 'https://bonomoalessandro.github.io/Prisma/datenschutz.html' : 'datenschutz.html')
    + (sprache === 'de' ? '' : '#en');
  /** Name einer Aktion ('weiter' | 'beginnen' | 'fortsetzen' | 'uebersicht' | 'vonvorn') in der aktuellen Sprache. */
  const aktionName = (a) => t(`menue.aktion.${a}`);
  // gleich wie im CSS des Menüs
  const HOCH = '(max-width: 600px) and (orientation: portrait)';
  const STILL = '(prefers-reduced-motion: reduce)';
  const wenigBewegung = () => matchMedia(STILL).matches;
  const AUS_MS = 800, FRAGE_MS = 300; // Ausblenden des Menüs bzw. der Rückfrage (Transition im CSS des Menüs)
  /**
   * Sternkarte: echte Helligkeit (mag) der Sterne 1 … 7 (Kochab, Pherkad, η, ζ, ε, δ UMi, Polaris) für die Grösse der
   * Punkte, wohin ihre Namen stehen (vom Stern nach aussen; hoch steht der von Stern 1 darüber, rechts fehlt der Platz).
   * rand: Platz (px) um den Wagen für die Namen, je Seite; gross: höchstens so viele px je Einheit der Form; kreis:
   * Abstand der Kreise um den Pol (Einheiten der Form), speiche: Winkel zwischen den Stundenlinien (°). moment: das
   * Erwachen beim Öffnen beginnt nach ab s, je weiterer Stern schritt s später.
   */
  const KARTE = {
    mag: [2.1, 3.0, 4.9, 4.3, 4.2, 4.3, 2.0],
    richtung: [[1, -0.15], [0.3, 1], [-0.35, 1], [0.35, -1], [0.3, -1], [0.3, -1], [0, -1]],
    richtungHoch: { 1: [0.25, -1] },
    rand: { links: 24, rechts: 116, oben: 46, unten: 48 },
    randHoch: { links: 46, rechts: 34, oben: 42, unten: 40 },
    gross: 6, kreis: 23.3, speiche: 30,
    moment: { ab: 0.7, schritt: 0.45 },
  };
  /** Beginn des Erwachens von Stern k (s nach dem Öffnen), wenn vorher ab Sterne wach waren (KARTE.moment). */
  const um = (k, ab) => KARTE.moment.ab + KARTE.moment.schritt * (Math.min(k, WELTEN.length + 1) - ab - 1);
  /**
   * Wischen über Karte, Reiter und Stand: die Werte des Blätterns in der Übersicht (WISCH in uebersicht.js), ausser
   * min: Der Grad wechselt erst ab 90 px (dort 50; Nutzer 19.11.2026: man soll etwas weiter wischen müssen, hochkant
   * gut ein Viertel der Breite); luecke: Abstand zwischen der Karte und der des Nachbargrads (px der Oberfläche; hoch
   * liegt diese damit ganz neben dem Bild).
   */
  const WISCH = { min: 90, schwelle: 10, steigung: 0.6, gummi: 0.3, ms: 280, easing: 'cubic-bezier(0.25, 0.8, 0.3, 1)',
    luecke: 32 };
  let zaehler = 0;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const f = (n) => n.toFixed(1);
  const make = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

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
      // wache Sterne: geschafft alle sieben, begonnen höchstens die sechs der Welten
      const wach = art === 'geschafft' ? WELTEN.length + 1 : art === 'neu' ? 0
        : clamp(Math.floor(Number.isFinite(+s.wach) ? +s.wach : geloest / JE_WELT), 0, WELTEN.length);
      const naechster = art === 'begonnen' && wach < WELTEN.length ? wach + 1 : 0; // Stern der Welt, in der das Licht ist
      const aktion = art === 'geschafft' ? (uebersicht ? 'uebersicht' : 'vonvorn') : art === 'neu' ? 'beginnen' : 'fortsetzen';
      return { ...g, i, art, geloest, welt, dorf, wach, naechster, aktion };
    });
    const zuletzt = grade.find((g) => g.id === stand?.zuletzt) ?? null;
    const weiter = zuletzt?.art === 'begonnen' ? zuletzt : null;
    // hervorheben: true → der nächstschwerere, noch nicht geschaffte Grad nach dem zuletzt geschafften; oder eine id
    let hervor = null;
    if (typeof stand?.hervorheben === 'string') hervor = grade.find((g) => g.id === stand.hervorheben) ?? null;
    else if (stand?.hervorheben && zuletzt?.art === 'geschafft') hervor = grade.slice(zuletzt.i + 1).find((g) => g.art !== 'geschafft') ?? null;
    return { grade, zuletzt, weiter, hervor };
  }
  const weltName = (g) => (g.dorf ? t('welt.dorf') : WELTEN[g.welt].name);
  const ariaStand = (g) => (g.art === 'geschafft' ? t('menue.aria.geschafft') : g.art === 'neu' ? t('menue.neu')
    : t('menue.aria.begonnen', { wo: g.dorf ? t('menue.imDorf') : weltName(g), n: g.geloest, N: LEVEL }));
  const wohin = (g) => (g.art === 'neu' ? t('menue.wohin.neu', { grad: g.name })
    : g.art === 'geschafft' ? t('menue.wohin.geschafft', { grad: g.name })
      : t('menue.wohin.begonnen', { grad: g.name, welt: weltName(g), n: g.geloest, N: LEVEL }));
  /** Was als Nächstes am Himmel des Grads geschieht (Handy hoch, unter der Karte). */
  const fein = (g) => (g.art === 'geschafft' ? t('menue.fein.geschafft') : g.art === 'neu' ? t('menue.fein.neu')
    : g.naechster ? t('menue.fein.naechster', { n: g.naechster, welt: WELTEN[g.naechster - 1].name })
      : t('menue.fein.polarstern'));

  /* ---------- Baustein ---------- */

  return function createMenu({ root, onAction = () => {}, uebersicht = true, wagen = null } = {}) {
    if (!root) throw new Error('createMenu: root fehlt');
    const uid = `menue-${++zaehler}`;
    const icon = (id) => `<svg class="menue-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[id]}</svg>`;
    const stern = () => `<span class="menue-stern" aria-hidden="true"><svg viewBox="0 0 100 100" focusable="false"><use href="#${uid}-stern"/></svg></span>`;
    const form = wagen?.form ?? [], linien = wagen?.linien ?? [], polar = wagen?.polarstern ?? form.length;

    root.classList.add('menue', 'menue-aus');
    root.hidden = true;
    root.inert = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', t('menue.name'));
    root.innerHTML = `
      <svg class="menue-defs" aria-hidden="true" focusable="false"><defs>
        <radialGradient id="${uid}-hof"><stop offset="0" stop-color="#ffffff" stop-opacity="0.6"/><stop offset="0.22" stop-color="#cdd4ff" stop-opacity="0.26"/><stop offset="1" stop-color="#aab4ff" stop-opacity="0"/></radialGradient>
        <radialGradient id="${uid}-strahl"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#e6eaff" stop-opacity="0.5"/><stop offset="1" stop-color="#e6eaff" stop-opacity="0"/></radialGradient>
        <radialGradient id="${uid}-schein"><stop offset="0" stop-color="#ffffff" stop-opacity="0.8"/><stop offset="0.22" stop-color="#dfe3ff" stop-opacity="0.32"/><stop offset="1" stop-color="#aab4ff" stop-opacity="0"/></radialGradient>
        <symbol id="${uid}-stern" viewBox="-50 -50 100 100">
          <circle r="48" fill="url(#${uid}-hof)"/>
          <path d="M0-46L2.4-2.4 30 0 2.4 2.4 0 46-2.4 2.4-30 0-2.4-2.4z" fill="url(#${uid}-strahl)"/>
          <path d="M0-16L1.2-1.2 16 0 1.2 1.2 0 16-1.2 1.2-16 0-1.2-1.2z" fill="#fff" transform="rotate(45)" opacity="0.55"/>
          <circle r="4.2" fill="#fff"/>
        </symbol>
      </defs></svg>
      <div class="menue-inhalt">
        <header class="menue-kopf"><h2 class="menue-titel">Prisma</h2><p class="menue-unter">${esc(t('start.untertitel'))}</p></header>
        <ol class="menue-grade" aria-label="${esc(t('menue.grade'))}"></ol>
        <div class="menue-karte" aria-hidden="true"><svg class="menue-sternkarte" focusable="false"></svg><svg class="menue-sternkarte menue-nachbar" focusable="false"></svg></div>
        <div class="menue-info" aria-hidden="true"><span class="menue-info-name"></span><span class="menue-stand"></span><span class="menue-fein"></span></div>
        <div class="menue-knoepfe">
          <button type="button" class="menue-weiter" data-menue-fokus="weiter"><span class="menue-was"></span><span class="menue-wohin"></span></button>
        </div>
        <button type="button" class="menue-sprache" data-menue-fokus="sprache">${icon('sprache')}</button>
        <a class="menue-datenschutz" data-menue-fokus="datenschutz" href="${esc(datenschutz())}" target="_blank" rel="noopener">${esc(t('menue.datenschutz'))}</a>
      </div>
      <div class="menue-frage menue-aus" role="alertdialog" aria-modal="true" aria-labelledby="${uid}-frage-titel" aria-describedby="${uid}-frage-text" hidden>
        <div class="menue-frage-box">
          <h3 class="menue-frage-titel" id="${uid}-frage-titel"></h3>
          <p class="menue-frage-text" id="${uid}-frage-text"></p>
          <div class="menue-frage-knoepfe">
            <button type="button" class="menue-pille" data-menue-frage="nein">${esc(t('menue.frage.abbrechen'))}</button>
            <button type="button" class="menue-pille menue-pille-ja" data-menue-frage="ja">${esc(aktionName('vonvorn'))}</button>
          </div>
        </div>
      </div>
      <p class="menue-sr" aria-live="polite"></p>`;
    const $ = (sel) => root.querySelector(sel);
    // Fokusrahmen erst nach einer Taste: Chrome zeigt ihn sonst auch, wenn das Menü nach einem Klick ins Leere (etwa auf
    // den Startbildschirm) den Fokus setzt; mit Zeiger oder Finger bedient, bleibt er weg (CSS .menue-zeiger)
    addEventListener('pointerdown', () => root.classList.add('menue-zeiger'), true);
    addEventListener('keydown', () => root.classList.remove('menue-zeiger'), true);
    const inhalt = $('.menue-inhalt'), karte = $('.menue-karte'), svg = $('.menue-sternkarte'), liste = $('.menue-grade');
    const nachbar = $('.menue-nachbar'); // Karte des Nachbargrads beim Wischen, sonst leer
    const knopf = $('.menue-weiter'), knoepfe = $('.menue-knoepfe'), info = $('.menue-info');
    const frageEl = $('.menue-frage'), sr = $('.menue-sr');
    const neinBtn = $('[data-menue-frage="nein"]'), jaBtn = $('[data-menue-frage="ja"]');
    // Sprache (Ticket 07 von .scratch/umbau/): Der Schalter öffnet die Liste der Sprachen mit Datei, nach unten, am
    // rechten Rand des Schalters (Ticket 02 von .scratch/sprachwahl/). Eine andere wählen wechselt ohne Neuladen
    // (setzeSprache, Ticket 01; das Menü schreibt sich dann neu, auch Schalter und Liste). Den Text des Schalters (voller
    // Name, auf dem Handy das Kürzel) und das ▾ setzt die Liste; mit nur einer Sprache tut ein Klick nichts.
    /** Name der Liste und aria-label des Schalters (voller Name und Kürzel) in der aktuellen Sprache. */
    const sprachTexte = () => ({ liste: t('menue.sprachliste'),
      schalter: t('menue.sprache', { sprache: spracheName(sprache), kuerzel: sprache.toUpperCase() }) });
    const sprachliste = createSprachliste({
      knopf: $('.menue-sprache'),
      sprachen: VORHANDEN.map((k) => ({ kuerzel: k, name: spracheName(k) })),
      aktuell: sprache, richtung: 'unten', ausrichtung: 'ende', texte: sprachTexte(),
      onWahl: (k) => { if (offen && !gesperrt) setzeSprache(k); },
    });

    let stand0 = {};        // der Stand des Spiels, den es zeigt (show, vorwaermen; ein Wechsel der Sprache liest ihn neu)
    let daten = lies(stand0, uebersicht);
    let offen = false;
    let gesperrt = false;   // nach einer Aktion (ausser «Von vorn») bis zum nächsten show(): kein Doppelklick
    let frage = null;       // Grad der offenen Rückfrage
    let frageVon = null;    // Knopf, der sie geöffnet hat (bekommt den Fokus zurück)
    let wahlId = null;      // Grad des gewählten Reiters: seine Karte und sein Knopf
    let warm = false;       // vorwaermen zeichnet gerade unsichtbar
    let zeitAus = 0, zeitFrage = 0, plan = 0;
    const gezeigt = new Map(); // je Grad: so viele Sterne waren beim letzten Zeigen wach (der Moment des Erwachens)
    let gezeichnet = '';    // was die Karte zeigt (Grösse, Grad, Stand): dasselbe nicht neu zeichnen
    let momentBis = 0;      // bis dahin läuft der Moment (performance.now); danach einmal ohne ihn neu zeichnen
    let wisch = null;       // laufendes Wischen (Finger oder Stift): { id, x, y, griff, waagrecht, gezeigt, r }
    let fahrt = null;       // Bewegung der Karten nach dem Loslassen (Animationen)
    let gewischtUm = -Infinity; // Ende des letzten Wischens (performance.now): ein Klick gleich danach gilt nicht

    const gewaehlt = () => daten.grade.find((g) => g.id === wahlId) ?? daten.grade[0];
    /** Reiter beim Öffnen: der Grad von «Weiter», sonst der hervorgehobene, der zuletzt gespielte, der erste begonnene. */
    const startWahl = () => (daten.weiter ?? daten.hervor ?? daten.zuletzt ?? daten.grade.find((x) => x.art === 'begonnen')
      ?? daten.grade[0]).id;
    const aktionVon = (g) => (g === daten.weiter ? 'weiter' : g.aktion);

    /* ---------- Aufbau: Reiter, Knopf, «Von vorn» ---------- */

    function standEl(el, g) {
      el.replaceChildren();
      if (g.art === 'geschafft') { el.innerHTML = stern(); el.append(make('span', '', t('menue.geschafft'))); }
      else if (g.art === 'neu') el.textContent = t('menue.neu');
      else el.append(make('span', '', weltName(g)), make('span', 'menue-trenn', '·'), make('span', 'menue-zahl', `${g.geloest} / ${LEVEL}`));
    }
    function render() {
      liste.replaceChildren();
      for (const b of knoepfe.querySelectorAll('.menue-vonvorn')) b.remove();
      for (const g of daten.grade) {
        const li = make('li', `menue-grad menue-${g.art}`);
        li.dataset.grad = g.id;
        if (g === daten.hervor) li.classList.add('menue-hervor');
        if (g === daten.weiter) li.classList.add('menue-zuletzt');
        const wahl = make('button', 'menue-wahl');
        wahl.type = 'button';
        wahl.dataset.menueFokus = `wahl:${g.id}`;
        wahl.setAttribute('aria-label', t(g === daten.hervor ? 'menue.aria.wahlEmpfohlen' : 'menue.aria.wahl',
          { grad: g.name, stand: ariaStand(g), aktion: aktionName(aktionVon(g)) }));
        const zeile = make('span', 'menue-zeile1');
        const pips = make('span', 'menue-pips');
        for (let k = 1; k <= 4; k++) pips.append(make('i', k <= g.punkte ? 'menue-on' : ''));
        zeile.append(pips, make('span', 'menue-name', g.name));
        const stand = make('span', 'menue-stand');
        standEl(stand, g);
        wahl.append(zeile, stand);
        wahl.addEventListener('click', () => waehle(g.id));
        li.append(wahl);
        liste.append(li);
        // «Von vorn» bei begonnenem oder geschafftem Grad (ohne Übersicht ist es beim geschafften schon der Knopf),
        // zu sehen beim gewählten
        if (g.art !== 'neu' && g.aktion !== 'vonvorn') {
          const vv = make('button', 'menue-vonvorn');
          vv.type = 'button';
          vv.dataset.menueFokus = `vonvorn:${g.id}`;
          vv.setAttribute('aria-label', t('menue.aria.vonvorn', { grad: g.name }));
          vv.setAttribute('aria-haspopup', 'dialog');
          vv.innerHTML = `${icon('neu')}<span>${esc(aktionName('vonvorn'))}</span>`;
          vv.addEventListener('click', () => oeffneFrage(g, vv));
          knoepfe.append(vv);
        }
      }
      setzeWahl();
    }
    /** Den gewählten Reiter zeigen: hervorgehoben, seine Karte, sein Knopf, sein «Von vorn», sein Stand (hoch). */
    function setzeWahl() {
      const g = gewaehlt();
      for (const li of liste.children) {
        const an = li.dataset.grad === g.id;
        li.classList.toggle('menue-an', an);
        li.firstChild.setAttribute('aria-current', an ? 'true' : 'false');
      }
      for (const b of knoepfe.querySelectorAll('.menue-vonvorn')) b.hidden = b.dataset.menueFokus !== `vonvorn:${g.id}`;
      const a = aktionVon(g);
      knopf.querySelector('.menue-was').textContent = aktionName(a);
      knopf.querySelector('.menue-wohin').textContent = wohin(g);
      knopf.setAttribute('aria-label',
        t('menue.aria.knopf', { aktion: aktionName(a), grad: g.name, stand: ariaStand(g) }));
      if (a === 'vonvorn') knopf.setAttribute('aria-haspopup', 'dialog'); else knopf.removeAttribute('aria-haspopup');
      info.querySelector('.menue-info-name').textContent = g.name;
      standEl(info.querySelector('.menue-stand'), g);
      info.querySelector('.menue-fein').textContent = fein(g);
      zeichne();
    }
    function waehle(id) {
      if (id === wahlId) return;
      beendeFahrt(); // Tippen auf einen Reiter, während die Karten noch gleiten
      wahlId = id;
      setzeWahl();
    }

    /* ---------- Sternkarte zeichnen (bei jeder Grössenänderung und jeder Wahl neu) ---------- */

    /** Grösse der Karte in Pixeln der Oberfläche (getBoundingClientRect misst in Pixeln des Layouts, SEITE); hoch. */
    function masse() {
      const R = karte.getBoundingClientRect();
      return { W: R.width / SEITE, H: R.height / SEITE, hoch: matchMedia(seiteMedia(HOCH)).matches };
    }
    function zeichne() {
      if (!offen && !warm || !form.length) return;
      const m = masse();
      if (!m.W || !m.H) return;
      const g = gewaehlt();
      // dasselbe Bild nicht noch einmal (ResizeObserver, Schriften, show mit gleichem Stand): ein laufender Moment bliebe
      // sonst nicht stehen
      const key = [m.W, m.H, m.hoch, g.id, g.art, g.wach, g.geloest].join();
      if (key === gezeichnet && (!momentBis || performance.now() < momentBis)) return;
      gezeichnet = key;
      momentBis = 0;
      // Moment: erst beim Zeigen, nicht beim Vorwärmen; was seit dem letzten Zeigen dieses Grads erwacht ist
      const vorher = gezeigt.get(g.id), still = !offen || wenigBewegung();
      const ab = !still && vorher !== undefined && vorher < g.wach ? vorher : g.wach;
      gezeigt.set(g.id, g.wach);
      svg.setAttribute('viewBox', `0 0 ${f(m.W)} ${f(m.H)}`);
      svg.innerHTML = karteBild(g, m, ab, `${uid}-rand`);
      if (ab < g.wach) momentBis = performance.now() + (um(g.wach, ab) + 2) * 1000;
    }
    /**
     * Die Karte des Grads g still in die zweite Fläche: die des Nachbargrads beim Wischen. vorMoment: ist seit dem
     * letzten Zeigen von g ein Stern erwacht, so, wie sie vor dem Moment aussieht (seine Animationen angehalten, im
     * Stil); gewählt beginnt er genau da, statt dass der Stern erst wach daneben steht und dann noch einmal erwacht.
     */
    function zeichneNachbar(g, vorMoment = false) {
      const m = masse(), vorher = gezeigt.get(g.id);
      const ab = vorMoment && vorher !== undefined && vorher < g.wach ? vorher : g.wach;
      nachbar.setAttribute('viewBox', `0 0 ${f(m.W)} ${f(m.H)}`);
      nachbar.innerHTML = form.length && m.W && m.H ? karteBild(g, m, ab, `${uid}-rand-n`) : '';
      nachbar.dataset.grad = g.id;
    }
    function leereNachbar() {
      nachbar.replaceChildren();
      delete nachbar.dataset.grad;
    }
    /**
     * Inhalt der Sternkarte des Grads g in der Grösse W × H (Pixel der Oberfläche; hoch: Handy hochkant). ab: so viele
     * Sterne waren vorher wach (kleiner als g.wach: das Erwachen spielt, sonst still); clip: id des Rands der Karte.
     */
    function karteBild(g, { W, H, hoch }, ab, clip) {
      const rand = hoch ? KARTE.randHoch : KARTE.rand;
      const xs = form.map((p) => p[0]), ys = form.map((p) => p[1]);
      const x0 = Math.min(...xs), y0 = Math.min(...ys), bw = Math.max(...xs) - x0, bh = Math.max(...ys) - y0;
      const s = clamp(Math.min((W - rand.links - rand.rechts) / bw, (H - rand.oben - rand.unten) / bh), 0.8, KARTE.gross);
      // der Wagen samt dem Platz für die Namen mittig in der Karte
      const ox = rand.links + (W - rand.links - rand.rechts - bw * s) / 2 - x0 * s;
      const oy = rand.oben + (H - rand.oben - rand.unten - bh * s) / 2 - y0 * s;
      const P = (k) => [ox + form[k - 1][0] * s, oy + form[k - 1][1] * s];
      const wach = (k) => (k === polar ? g.wach > WELTEN.length : k <= g.wach);
      const da = ([a, b]) => wach(a) && wach(b);
      const warVorher = (k) => (k === polar ? ab > WELTEN.length : k <= ab);

      const kern = clamp(0.45 * s, 1.4, 2.7), ring = Math.max(7, 2.2 * s), breite = clamp(0.45 + 0.24 * s, 0.8, 1.7);
      const abstand = clamp(2 * s + 8, 11, 20);
      // Netz der Sternkarte: Kreise um den Pol, Stundenlinien, in der Karte
      const [px, py] = P(polar), weit = Math.hypot(W, H) + Math.hypot(px, py);
      let netz = '';
      for (let r = KARTE.kreis * s; r < weit; r += KARTE.kreis * s) netz += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(r)}"/>`;
      for (let w = 0; w < 360; w += KARTE.speiche) {
        const a = w * Math.PI / 180;
        netz += `<line x1="${f(px)}" y1="${f(py)}" x2="${f(px + Math.cos(a) * weit)}" y2="${f(py + Math.sin(a) * weit)}"/>`;
      }
      let teile = `<defs><clipPath id="${clip}"><rect width="${f(W)}" height="${f(H)}" rx="24"/></clipPath></defs>`
        + `<g class="menue-netz" clip-path="url(#${clip})">${netz}</g>`;
      // Linien: noch fehlende gestrichelt, gezogene hell (eben gezogene ziehen sich vom ersten Stern zum zweiten)
      for (const l of linien) {
        const [ax, ay] = P(l[0]), [bx, by] = P(l[1]), xy = `x1="${f(ax)}" y1="${f(ay)}" x2="${f(bx)}" y2="${f(by)}"`;
        teile += `<line class="menue-geist" ${xy} stroke-width="${f(breite)}"/>`;
        if (!da(l)) continue;
        const neu = !(warVorher(l[0]) && warVorher(l[1]));
        teile += `<line class="menue-linie${neu ? ' menue-zieht' : ''}" ${xy} stroke-width="${f(breite)}"`
          + (neu ? ` style="--len:${f(Math.hypot(bx - ax, by - ay) + 1)};--d:${um(Math.max(...l), ab) + 0.2}s"` : '') + '/>';
      }
      // Sterne: Punktgrösse nach der Helligkeit; wache mit Hof, schlafende klein und blass; der Polarstern mit Strahlen
      let namen = '';
      for (let k = 1; k <= form.length; k++) {
        const [x, y] = P(k), m = 1 + (4.9 - KARTE.mag[k - 1]) * 0.3, an = wach(k), neu = an && !warVorher(k);
        const r = kern * m * (an ? 1 : 0.62), d = neu ? ` style="--d:${um(k, ab)}s"` : '';
        teile += `<g transform="translate(${f(x)} ${f(y)})"><g class="menue-ks${an ? ' menue-an' : ''}${neu ? ' menue-erwacht' : ''}"${d}>`;
        if (k === polar) {
          const gr = kern * m * 4.6 / 46 * 100 * (an ? 1.25 : 1);
          teile += `<use href="#${uid}-stern" x="${f(-gr / 2)}" y="${f(-gr / 2)}" width="${f(gr)}" height="${f(gr)}"/>`;
        } else {
          if (an) teile += `<circle class="menue-schein" r="${f(kern * 5.5 * m)}" fill="url(#${uid}-schein)"/>`;
          teile += `<circle class="menue-kern" r="${f(r)}"/>`;
        }
        teile += '</g>';
        if (k === g.naechster) {
          teile += `<circle class="menue-ring${ab < g.wach ? ' menue-spaeter' : ''}" r="${f(ring)}"`
            + (ab < g.wach ? ` style="--d:${um(g.wach, ab) + 0.6}s"` : '') + '/>';
        }
        teile += '</g>';
        // Name nach aussen, darunter bei geweckten und beim Stern der Welt die gelösten Level dieser Welt
        const [dx0, dy0] = (hoch && KARTE.richtungHoch[k]) || KARTE.richtung[k - 1], n = Math.hypot(dx0, dy0);
        const dx = dx0 / n, dy = dy0 / n, tx = x + dx * abstand, ty = y + dy * abstand;
        const zahl = k === polar ? '' : an ? `${JE_WELT} / ${JE_WELT}`
          : k === g.naechster ? `${clamp(g.geloest - (k - 1) * JE_WELT, 0, JE_WELT)} / ${JE_WELT}` : '';
        const seit = Math.abs(dx) > Math.abs(dy), anker = seit ? (dx > 0 ? 'start' : 'end') : 'middle';
        const lage = seit ? 'central' : dy > 0 ? 'hanging' : 'auto';
        const [d1, d2] = !zahl ? ['0', '0'] : seit ? ['-0.6em', '1.25em'] : dy > 0 ? ['0', '1.3em'] : ['-1.15em', '1.3em'];
        const cls = k === polar ? `menue-polar${an ? ' menue-an' : ''}`
          : `menue-welt${an ? ' menue-an' : k === g.naechster ? ' menue-jetzt' : ''}`;
        namen += `<text class="menue-etikett ${cls}" x="${f(tx)}" y="${f(ty)}" text-anchor="${anker}" dominant-baseline="${lage}">`
          + `<tspan x="${f(tx)}" dy="${d1}">${esc(k === polar ? t('welt.polarstern') : WELTEN[k - 1].name)}</tspan>`
          + (zahl ? `<tspan class="menue-klein" x="${f(tx)}" dy="${d2}">${zahl}</tspan>` : '') + '</text>';
      }
      return teile + namen;
    }
    /** Neu zeichnen im nächsten Bild (mehrere Anlässe zugleich: einmal). */
    function planen() {
      if (!offen || plan) return;
      plan = requestAnimationFrame(() => { plan = 0; zeichne(); });
    }
    const beobachter = typeof ResizeObserver === 'function' ? new ResizeObserver(planen) : null;
    addEventListener('resize', planen);
    document.fonts?.ready?.then(planen);
    // Fokus auf einem Reiter (Tab, Pfeile, Rückkehr aus der Übersicht): er ist gewählt
    inhalt.addEventListener('focusin', (e) => {
      const li = e.target.classList?.contains('menue-wahl') ? e.target.closest('.menue-grad') : null;
      if (li) waehle(li.dataset.grad);
    });

    /* ---------- Wischen: der Nachbargrad, mit Bewegung wie das Blättern in der Übersicht ---------- */

    const schrittweite = () => karte.clientWidth + WISCH.luecke;
    /** Die Karte um dx px aus der Ruhe, die des Nachbargrads daneben (r: 1 rechts, der nächste Grad; -1 links; 0 keine). */
    function schiebe(dx, r = 0) {
      svg.style.transform = dx ? `translateX(${dx}px)` : '';
      nachbar.style.transform = r ? `translateX(${dx + r * schrittweite()}px)` : '';
    }
    /** Karten gleiten von → nach (px aus der Ruhe); der Endstand steht schon im Stil, danach ist die zweite Fläche leer. */
    function fahre(wege) {
      const dauer = WISCH.ms * Math.min(1, Math.abs(wege[0][2] - wege[0][1]) / schrittweite());
      const anims = wege.map(([el, von, nach]) => el.animate(
        [{ transform: `translateX(${von}px)` }, { transform: `translateX(${nach}px)` }], { duration: dauer, easing: WISCH.easing }));
      fahrt = anims;
      anims[0].onfinish = () => { if (fahrt === anims) beendeFahrt(); };
    }
    /** Laufende Bewegung gleich fertig: die Karte in Ruhe, die des Nachbargrads weg. */
    function beendeFahrt() {
      const anims = fahrt;
      fahrt = null;
      anims?.forEach((a) => a.cancel());
      leereNachbar();
      schiebe(0);
      karte.classList.remove('menue-wischt');
    }
    /**
     * Weit genug gewischt: der Grad ziel (auf der Seite r) wird gewählt wie mit seinem Reiter; seine Karte gleitet von
     * dort, wo sie beim Loslassen steht, ganz herein, die bisherige (still neu gezeichnet) zur anderen Seite hinaus. von:
     * wo die Karte beim Loslassen steht (px aus der Ruhe; 0 nach einem schnellen Wisch ohne Bild dazwischen: die ganze
     * Breite wie beim Blättern der Übersicht). Lag der Fokus auf einem Reiter, geht er zum neuen; auf «Von vorn» (jetzt
     * verborgen) zu dem des neuen Grads, sonst auf den Knopf.
     */
    function gleite(ziel, r, von) {
      const alt = gewaehlt(), a = root.contains(document.activeElement) ? document.activeElement : null;
      wahlId = ziel.id;
      setzeWahl();
      if (a?.classList.contains('menue-wahl')) fokussiere(`wahl:${ziel.id}`);
      else if (a?.classList.contains('menue-vonvorn')) fokussiere(`vonvorn:${ziel.id}`) || fokussiere('weiter');
      if (wenigBewegung()) { beendeFahrt(); return; }
      const w = schrittweite();
      zeichneNachbar(alt);
      schiebe(0);
      nachbar.style.transform = `translateX(${-r * w}px)`;
      fahre([[svg, von + r * w, 0], [nachbar, von, -r * w]]);
    }
    /** Zu kurz gewischt oder am Rand: die Karte federt zurück, die des Nachbargrads (Seite r) wieder hinaus. */
    function zurueck(von, r) {
      if (!von || wenigBewegung()) { beendeFahrt(); return; }
      const w = schrittweite();
      schiebe(0, r);
      fahre([[svg, von, 0], ...(r ? [[nachbar, von + r * w, r * w]] : [])]);
    }
    function loslassen(e, abgebrochen) {
      const w = wisch;
      wisch = null;
      if (!w.waagrecht) return;
      gewischtUm = performance.now();
      const dx = (e.clientX - w.x) / SEITE, r = dx < 0 ? 1 : -1; // Pixel der Oberfläche; nach links: der nächste
      const ziel = daten.grade[gewaehlt().i + r];
      if (!abgebrochen && Math.abs(dx) >= WISCH.min && ziel && offen && !gesperrt && !frage) gleite(ziel, r, w.gezeigt);
      else zurueck(w.gezeigt, w.r);
    }
    // Beginn auf Karte, Reitern oder Stand (Finger oder Stift, nicht die Maus; nicht mit Rückfrage oder offener Liste der
    // Sprachen); Ziehen und Loslassen zählen im ganzen Menü. Waagrechtes Ziehen überlässt der Browser dem Menü
    // (touch-action: pan-y im Stil, dazu touchmove unten), senkrechtes bricht das Wischen ab.
    inhalt.addEventListener('pointerdown', (e) => {
      if (!offen || gesperrt || frage || sprachliste.offen || e.pointerType === 'mouse' || !e.isPrimary
        || !e.target.closest?.('.menue-karte, .menue-grade, .menue-info')) return;
      beendeFahrt();
      wisch = { id: e.pointerId, x: e.clientX, y: e.clientY, griff: 0, waagrecht: false, gezeigt: 0, r: 0 };
    });
    root.addEventListener('pointerdown', (e) => {
      gewischtUm = -Infinity; // neues Drücken: sein Klick gilt wieder
      if (!e.isPrimary && wisch) loslassen(e, true); // ein zweiter Finger bricht ab
    });
    root.addEventListener('pointermove', (e) => {
      const w = wisch;
      if (w?.id !== e.pointerId) return;
      if (!w.waagrecht) {
        const dx = (e.clientX - w.x) / SEITE, dy = (e.clientY - w.y) / SEITE;
        if (Math.hypot(dx, dy) < WISCH.schwelle) return;
        if (Math.abs(dy) > Math.abs(dx) * WISCH.steigung) { wisch = null; return; } // senkrecht: kein Wischen
        w.waagrecht = true;
        w.griff = e.clientX; // ab hier folgt die Karte dem Finger, ohne Sprung
        if (!wenigBewegung()) karte.classList.add('menue-wischt');
        return;
      }
      if (wenigBewegung()) return;
      const dx = (e.clientX - w.griff) / SEITE, r = dx < 0 ? 1 : -1, nb = daten.grade[gewaehlt().i + r];
      if (!nb) leereNachbar();
      else if (nachbar.dataset.grad !== nb.id) zeichneNachbar(nb, true);
      w.r = nb ? r : 0;
      w.gezeigt = nb ? dx : dx * WISCH.gummi; // bei Leicht und Sehr schwer nur zögernd
      schiebe(w.gezeigt, w.r);
    });
    root.addEventListener('pointerup', (e) => { if (wisch?.id === e.pointerId) loslassen(e, false); });
    root.addEventListener('pointercancel', (e) => { if (wisch?.id === e.pointerId) loslassen(e, true); });
    // Ein Wischen bewegt nur das Menü: Ohne das gab Chrome einem schnellen Wisch noch Schwung (unsichtbar, im Menü
    // scrollt nichts), und das nächste Tippen bis gut 1 s danach hielt nur ihn an, ein Reiter oder der Knopf reagierte
    // nicht (Probe in Chrome mit Touch; touch-action: none allein half nicht). Auf Karte, Reitern und Stand scrollt
    // nichts.
    root.addEventListener('touchmove', (e) => { if (wisch && e.cancelable) e.preventDefault(); }, { passive: false });
    // ein Klick gleich nach dem Wischen (ohne neues Drücken) wählt keinen Reiter und löst keinen Knopf aus (Chrome
    // schickt nach einem Wischen mit dem Stift einen Klick, Befund beim Wischen in der Übersicht)
    addEventListener('click', (e) => {
      if (performance.now() - gewischtUm < 400 && root.contains(e.target)) { e.stopPropagation(); e.preventDefault(); }
    }, true);

    /* ---------- Fokus ---------- */

    const ziel = (key) => (key ? root.querySelector(`[data-menue-fokus="${CSS.escape(key)}"]`) : null);
    function fokussiere(key) {
      const el = ziel(key);
      if (el && !el.hidden) el.focus({ preventScroll: true });
      return !!el && !el.hidden;
    }
    /** Wohin der Fokus beim Öffnen geht: «Weiter», sonst der Reiter des hervorgehobenen, zuletzt gespielten, ersten Grads. */
    const startFokus = () => (daten.weiter ? 'weiter' : `wahl:${startWahl()}`);
    /** Haltepunkte der Pfeiltasten: der Knopf, dann die Reiter von oben nach unten. */
    const halte = () => [knopf, ...liste.querySelectorAll('.menue-wahl')];

    /* ---------- Aktionen und Rückfrage ---------- */

    function melde(aktion, g) {
      if (gesperrt || !offen) return;
      if (aktion !== 'vonvorn') gesperrt = true; // das Spiel blendet das Menü aus; show() gibt es wieder frei
      onAction({ aktion, grad: g.id });
    }
    /** Die Aktion des Grads g (Knopf oder Enter auf seinem Reiter); von: der Knopf, der sie auslöst. */
    const handle = (g, von) => (g.aktion === 'vonvorn' ? oeffneFrage(g, von) : melde(aktionVon(g), g));
    knopf.addEventListener('click', () => handle(gewaehlt(), knopf));

    function oeffneFrage(g, von) {
      if (!offen || gesperrt) return;
      sprachliste.schliessen(true); // nie Liste und Rückfrage zugleich
      clearTimeout(zeitFrage);
      frage = g;
      frageVon = von?.dataset.menueFokus ?? null;
      fuelleFrage(g);
      inhalt.inert = true;
      frageEl.hidden = false;
      void frageEl.offsetWidth; // erst sichtbar setzen, dann einblenden
      frageEl.classList.remove('menue-aus');
      neinBtn.focus({ preventScroll: true }); // sicher: Abbrechen zuerst
    }
    /** Titel und Text der Rückfrage zum Grad g (oeffneFrage, Wechsel der Sprache). */
    function fuelleFrage(g) {
      $('.menue-frage-titel').textContent = t('menue.frage.titel', { grad: g.name });
      $('.menue-frage-text').textContent = g.art === 'geschafft' ? t('menue.frage.geschafft')
        : t('menue.frage.begonnen', { wo: g.dorf ? t('menue.imDorf') : weltName(g), n: g.geloest, N: LEVEL });
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
      sage(t('menue.geloescht', { grad: g.name }));
    }
    neinBtn.addEventListener('click', () => schliesseFrage(false));
    jaBtn.addEventListener('click', () => schliesseFrage(true));
    frageEl.addEventListener('click', (e) => { if (e.target === frageEl) schliesseFrage(false); });

    /** Meldung für den Bildschirmleser (leeren und neu setzen: auch dieselbe Meldung zweimal). */
    function sage(text) {
      sr.textContent = '';
      requestAnimationFrame(() => { sr.textContent = text; });
    }

    /* ---------- Wechsel der Sprache ---------- */

    /** Die Namen auf der Sternkarte in der aktuellen Sprache, ohne sie neu zu zeichnen (ein Erwachen läuft weiter). */
    function etiketten() {
      svg.querySelectorAll('.menue-etikett').forEach((el, i) => { // in zeichne je Stern 1 … 7 eines
        el.firstElementChild.textContent = i + 1 === polar ? t('welt.polarstern') : WELTEN[i].name;
      });
    }
    /**
     * Wechsel der Sprache (Ticket 01 von .scratch/sprachwahl/, ohne Neuladen): alle Texte neu, offen oder zu, mit dem
     * Stand, den das Menü zeigt. Reiter, Fokus (meist auf dem Schalter), eine offene Rückfrage und ein Erwachen auf der
     * Karte bleiben. Offen sagt der Bildschirmleser die neue Sprache an; eine ältere Meldung (alte Sprache) geht.
     */
    beiSprachwechsel(() => {
      root.setAttribute('aria-label', t('menue.name'));
      $('.menue-unter').textContent = t('start.untertitel');
      liste.setAttribute('aria-label', t('menue.grade'));
      sprachliste.setze({ aktuell: sprache, texte: sprachTexte() }); // Schalter, Häkchen, Name der Liste
      const ds = $('.menue-datenschutz'); // Datenschutz: Text und Ziel (#en) in der neuen Sprache
      ds.textContent = t('menue.datenschutz');
      ds.href = datenschutz();
      neinBtn.textContent = t('menue.frage.abbrechen');
      jaBtn.textContent = aktionName('vonvorn');
      const key = root.contains(document.activeElement) ? document.activeElement.dataset?.menueFokus : null;
      daten = lies(stand0, uebersicht);
      beendeFahrt(); // die Karte des Nachbargrads hätte noch Namen in der alten Sprache
      render(); // Reiter und «Von vorn» neu, Knopf und Stand (die Karte zeichnet dasselbe Bild nicht neu: etiketten)
      etiketten();
      if (frage) {
        frage = daten.grade.find((g) => g.id === frage.id);
        fuelleFrage(frage);
      }
      if (key) fokussiere(key);
      if (offen) sage(t('menue.spracheGewechselt', { sprache: spracheName(sprache) }));
      else sr.textContent = '';
    });

    /* ---------- Tasten ---------- */

    /** true: die Taste gehört dem Menü (Standardaktion verhindert). */
    function taste(e) {
      if (sprachliste.offen) return sprachliste.keydown(e); // die Taste gehört der Liste (Esc schliesst nur sie)
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
      const akt = document.activeElement;
      // Enter auf einem Reiter: die Aktion seines Grads (Klick und Leertaste wählen ihn nur); gehalten: nichts
      if (e.key === 'Enter' && akt?.classList?.contains('menue-wahl') && root.contains(akt)) {
        const g = daten.grade.find((x) => x.id === akt.closest('.menue-grad').dataset.grad);
        if (g && !e.repeat) { waehle(g.id); handle(g, akt); }
        return true;
      }
      const schritt = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!schritt && e.key !== 'Home' && e.key !== 'End') return false;
      const stopps = halte();
      let i = stopps.indexOf(akt);
      if (i < 0 && akt?.classList?.contains('menue-vonvorn')) i = 0; // «Von vorn» gehört zum Knopf
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
      /** Einblenden mit dem Stand des Spiels; ist das Menü schon offen, neu aufbauen (Fokus und Reiter bleiben). */
      show(stand = {}) {
        daten = lies(stand0 = stand, uebersicht);
        gesperrt = false;
        const war = offen;
        const key = war && root.contains(document.activeElement) ? document.activeElement.dataset?.menueFokus : null;
        if (war && frage) schliesseFrage(false, true);
        wisch = null;
        beendeFahrt();
        if (!war) wahlId = startWahl();
        render();
        if (!war) {
          offen = true;
          clearTimeout(zeitAus);
          root.hidden = false;
          root.inert = false;
          void root.offsetWidth; // erst sichtbar setzen, dann einblenden
          root.classList.remove('menue-aus');
          knopf.classList.toggle('menue-auf', !matchMedia(STILL).matches);
          beobachter?.observe(karte);
          zeichne();
          fokussiere(startFokus());
        } else if (key) fokussiere(key) || fokussiere(startFokus());
      },
      /**
       * Einmal unsichtbar zeichnen (fast durchsichtig, nicht bedienbar, ohne Fokus), solange es zu ist: Das erste
       * Zeichnen hielt das Bild beim ersten Öffnen an (Review Ticket 05, damals mit dem Leuchten der Lichtwege bis gut
       * 400 ms). show() zeichnet neu.
       */
      vorwaermen(stand = {}) {
        if (offen || warm) return;
        warm = true;
        daten = lies(stand0 = stand, uebersicht);
        wahlId = startWahl();
        root.hidden = false;
        root.classList.add('menue-vorwaermen');
        render();
        requestAnimationFrame(() => requestAnimationFrame(() => {
          warm = false;
          root.classList.remove('menue-vorwaermen');
          if (!offen) root.hidden = true;
        }));
      },
      /** Ausblenden; erfüllt, wenn es ganz weg ist (dann hidden). sofort: ohne Überblenden (Testschnittstelle). */
      hide(sofort = false) {
        if (!offen) return Promise.resolve();
        offen = false;
        if (momentBis) momentBis = 1; // ein unterbrochener Moment spielt beim nächsten Öffnen nicht noch einmal
        schliesseFrage(false, true);
        sprachliste.schliessen(true);
        wisch = null;
        beendeFahrt();
        if (root.contains(document.activeElement)) document.activeElement.blur();
        root.inert = true;
        root.classList.add('menue-aus');
        beobachter?.disconnect();
        cancelAnimationFrame(plan);
        plan = 0;
        clearTimeout(zeitAus);
        return new Promise((resolve) => {
          zeitAus = setTimeout(() => { if (!offen) root.hidden = true; resolve(); }, sofort ? 0 : AUS_MS);
          if (sofort) root.hidden = true;
        });
      },
      /**
       * Für den Tastatur-Handler des Spiels, solange das Menü offen ist: true, wenn die Taste dem Menü gehört (dann
       * nichts weiter tun). Liegt der Fokus ausserhalb (Klick ins Leere), holen ihn Pfeile und Tab zurück ins Menü.
       */
      keydown(e) {
        if (!offen) return false;
        if (sprachliste.offen) return sprachliste.keydown(e);
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

export { createMenu };
