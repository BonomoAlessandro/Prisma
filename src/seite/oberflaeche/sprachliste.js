// Liste der Sprachen am Schalter der Sprache (Ticket 02 von .scratch/sprachwahl/). Ohne Abhängigkeiten vom übrigen
// Spiel und ohne Texte aus den Sprachdateien (die Texte für den Bildschirmleser kommen als Parameter); der Import von
// ui.js gibt nur die Reihenfolge beim Laden (jeder Teil importiert zuerst den vorherigen, menue.js diesen).
import './ui.js';

/* =====================================================================
   SPRACHLISTE: Der Schalter der Sprache wird zum «Menu Button» nach WAI-ARIA APG. Antippen öffnet eine kleine Liste
   aller Sprachen, jede mit ihrem Namen in ihr selbst, die aktuelle mit Häkchen; eine andere antippen wählt sie. Auf
   dem Schalter Globus, Sprache und ▾: der volle Name («DEUTSCH»), in den Handy-Layouts des Menüs (hochkant und quer,
   dieselben Medienabfragen wie src/stil/menue.css) nur das Kürzel («DE»); das aria-label nennt immer den vollen Namen.
   Gestalt im Stil des Menüs (Präfix menue-sl-, src/stil/sprachliste.css), wie die Rückfrage «Von vorn»: feine Linie,
   dunkler Grund, sanftes Ein- und Ausblenden (mit prefers-reduced-motion ohne Bewegung, nur die Überblendung).

     const liste = createSprachliste({
       knopf,                      // der Schalter (button), darin nur der Globus: Der Baustein setzt den Text der
                                   // Sprache dazu (voller Name, auf dem Handy das Kürzel) und das ▾, dazu
                                   // aria-haspopup, aria-expanded und aria-controls
       sprachen: [{ kuerzel: 'de', name: 'Deutsch' }, { kuerzel: 'en', name: 'English' }],  // in dieser Reihenfolge
       aktuell: 'de',
       onWahl(kuerzel) {},         // eine andere Sprache gewählt (die Liste ist dann schon zu, der Fokus am Schalter)
       richtung: 'unten',          // 'unten' | 'oben': wohin die Liste vom Schalter aus aufgeht
       ausrichtung: 'ende',        // 'ende': rechte Kante an der des Schalters | 'start': linke an der linken
       texte: {
         liste: 'Sprache',         // Name der Liste für den Bildschirmleser (ohne: der Name des Schalters)
         schalter: 'Sprache: Deutsch',  // aria-label des Schalters, mit dem vollen Namen (ohne: bleibt, wie es ist)
       },
     });
     liste.offen;                  // true, solange sie offen ist
     liste.oeffnen(fokus);         // 'aktuell' (Vorgabe) | 'erste' | 'letzte'; false mit nur einer Sprache
     liste.schliessen(sofort);     // sofort: ohne Ausblenden (das Menü blendet aus, die Rückfrage öffnet)
     liste.setze({ aktuell, sprachen, texte });   // nach dem Wechsel: Text des Schalters, Häkchen, Einträge, Namen
                                                  // (alle Felder wahlweise)
     liste.keydown(e);             // true, wenn die Taste der Liste gehört (Standardaktion dann verhindert)

   Der Baustein hängt die Liste und einen unsichtbaren Schleier direkt hinter den Schalter ins DOM (gleiches Elternteil)
   und hört selbst auf Klicks und Tasten am Schalter und in der Liste; keydown(e) braucht nur, wer Tasten von ausserhalb
   weiterreicht (etwa der Tastatur-Handler des Spiels). Eine Taste, die die Liste genommen hat, ist defaultPrevented.
   Den Wechsel selbst macht onWahl; danach setze({ aktuell }) aufrufen (der Baustein ändert aktuell nicht von sich aus).

   Bedienung: Klick, Tippen, Enter oder Leertaste am Schalter öffnen (Fokus auf der aktuellen Sprache), Pfeil runter
   ebenso, Pfeil hoch mit Fokus auf der letzten. In der Liste Pfeile hoch und runter (mit Umlauf), Pos1, Ende, ein
   Buchstabe springt zur Sprache mit diesem Anfang; Enter und Leertaste wählen. Esc und Tab schliessen, der Fokus geht
   an den Schalter zurück. Klick oder Tippen ausserhalb schliesst (auf den Schleier: darunter wird nichts ausgelöst),
   ebenso erneutes Antippen des Schalters. Die aktuelle Sprache wählen schliesst nur. Mit nur einer Sprache: kein ▾,
   keine Liste, ein Klick tut nichts.
   Lage: in Pixeln der Oberfläche (Massstab SEITE aus index.html; ohne ihn 1), ganz im Bild mit 8 px Rand und den
   sicheren Rändern (env(safe-area-inset-*), gemessen am Schleier). Passt sie in der gewünschten Richtung nicht, geht
   sie in die andere auf, wenn dort mehr Platz ist; sonst wird sie niedriger und rollt.
   ===================================================================== */

const SL = 'menue-sl';
/** Zeichen im Strich der Zeichen des Menüs (.menue-ico): das ▾ des Schalters und das Häkchen. */
const STRICH = {
  pfeil: '<path d="M7.5 10l4.5 4.5 4.5-4.5"/>',
  haken: '<path d="M5.5 12.5l4.2 4.2 8.8-9.4"/>',
};
const zeichen = (id, cls) => `<svg class="menue-ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${STRICH[id]}</svg>`;
/** Das ▾ (der Baustein hängt es selbst an den Schalter, solange es mehr als eine Sprache gibt). */
const PFEIL = zeichen('pfeil', `${SL}-pfeil`);
const AUS_MS = 300;  // Ausblenden (Transition in sprachliste.css), wie die Rückfrage
const RAND = 8;      // Abstand zum Rand des Bilds (px der Oberfläche), zusätzlich zu den sicheren Rändern
const ABSTAND = 6;   // zwischen Schalter und Liste
let zaehler = 0;

const massstab = () => (typeof SEITE === 'number' && SEITE > 0 ? SEITE : 1);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function createSprachliste({ knopf, sprachen = [], aktuell = null, onWahl = () => {}, richtung = 'unten',
  ausrichtung = 'ende', texte = {} } = {}) {
  if (!knopf) throw new Error('createSprachliste: knopf fehlt');
  const id = `${SL}-${++zaehler}`;
  const schleier = document.createElement('div');
  schleier.className = `${SL}-schleier`;
  schleier.hidden = true;
  const liste = document.createElement('div');
  liste.className = `${SL} ${SL}-aus`;
  liste.id = id;
  liste.hidden = true;
  liste.inert = true;
  liste.setAttribute('role', 'menu');
  knopf.after(schleier, liste);

  let offen = false, zeit = 0;
  /** @type {HTMLButtonElement[]} */
  let eintraege = [];
  const genommen = new WeakSet(); // Tasten, die die Liste schon genommen hat (eigene Hörer und keydown von aussen)
  const mehr = () => sprachen.length > 1;
  const aktIndex = () => Math.max(0, sprachen.findIndex((s) => s.kuerzel === aktuell));

  /* ---------- Aufbau: Einträge, Schalter ---------- */

  function baue() {
    liste.replaceChildren();
    eintraege = sprachen.map(({ kuerzel, name }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `${SL}-eintrag`;
      b.tabIndex = -1;
      b.lang = kuerzel; // der Name steht in seiner eigenen Sprache
      b.dataset.sprache = kuerzel;
      b.setAttribute('role', 'menuitemradio');
      b.setAttribute('aria-checked', String(kuerzel === aktuell));
      b.innerHTML = `<span class="${SL}-haken">${zeichen('haken', '')}</span><span class="${SL}-name"></span>`;
      b.lastElementChild.textContent = name ?? kuerzel;
      b.addEventListener('click', () => waehle(kuerzel));
      liste.append(b);
      return b;
    });
    beschrifte();
    if (texte?.liste) {
      liste.setAttribute('aria-label', texte.liste);
      liste.removeAttribute('aria-labelledby');
    } else {
      if (!knopf.id) knopf.id = `${id}-schalter`;
      liste.setAttribute('aria-labelledby', knopf.id);
      liste.removeAttribute('aria-label');
    }
    knopf.classList.toggle(`${SL}-schalter`, mehr());
    if (mehr()) {
      knopf.setAttribute('aria-haspopup', 'menu');
      knopf.setAttribute('aria-controls', id);
      knopf.setAttribute('aria-expanded', String(offen));
      if (!knopf.querySelector(`.${SL}-pfeil`)) knopf.insertAdjacentHTML('beforeend', PFEIL);
    } else {
      for (const a of ['aria-haspopup', 'aria-controls', 'aria-expanded']) knopf.removeAttribute(a);
      knopf.querySelector(`.${SL}-pfeil`)?.remove();
      schliessen(true);
    }
  }

  /**
   * Text des Schalters: der volle Name der aktuellen Sprache und ihr Kürzel; das CSS zeigt je Layout einen (Handy
   * hochkant und quer das Kürzel). Er steht vor dem ▾; was sonst im Schalter steht (der Globus), bleibt.
   */
  function beschrifte() {
    let b = knopf.querySelector(`.${SL}-text`);
    if (!b) {
      b = document.createElement('span');
      b.className = `${SL}-text`;
      b.innerHTML = `<span class="${SL}-voll"></span><span class="${SL}-kurz"></span>`;
      const pfeil = knopf.querySelector(`.${SL}-pfeil`);
      if (pfeil) pfeil.before(b); else knopf.append(b);
    }
    const s = sprachen.find((x) => x.kuerzel === aktuell);
    b.firstElementChild.textContent = s?.name ?? aktuell ?? '';
    b.lastElementChild.textContent = String(aktuell ?? '').toUpperCase();
    if (texte?.schalter) knopf.setAttribute('aria-label', texte.schalter);
  }

  /* ---------- Lage: am Schalter, ganz im Bild ---------- */

  function lage() {
    if (!offen) return;
    const s = massstab();
    // in Pixeln der Oberfläche (getBoundingClientRect misst in Pixeln des Layouts); der Schleier ist das Bild, seine
    // Polsterung die sicheren Ränder
    const k = knopf.getBoundingClientRect(), v = schleier.getBoundingClientRect(), cs = getComputedStyle(schleier);
    const px = (wert) => parseFloat(wert) || 0;
    const so = px(cs.paddingTop), sr = px(cs.paddingRight), su = px(cs.paddingBottom), sl = px(cs.paddingLeft);
    const W = v.width / s, H = v.height / s;
    const K = { l: k.left / s, r: k.right / s, o: k.top / s, u: k.bottom / s };
    liste.style.maxHeight = '';
    liste.style.setProperty('--menue-sl-schalter', `${Math.round(K.r - K.l)}px`); // mindestens so breit wie er
    const L = liste.getBoundingClientRect(), w = L.width / s, h = L.height / s;
    const oben0 = so + RAND, unten0 = H - su - RAND, links0 = sl + RAND, rechts0 = W - sr - RAND;
    const platzUnten = unten0 - (K.u + ABSTAND), platzOben = K.o - ABSTAND - oben0;
    let nachOben = richtung === 'oben';
    if (nachOben && platzOben < h && platzUnten > platzOben) nachOben = false;
    else if (!nachOben && platzUnten < h && platzOben > platzUnten) nachOben = true;
    const platz = Math.max(0, nachOben ? platzOben : platzUnten), hoch = Math.min(h, platz);
    if (h > platz) liste.style.maxHeight = `${platz}px`;
    const top = clamp(nachOben ? K.o - ABSTAND - hoch : K.u + ABSTAND, oben0, Math.max(oben0, unten0 - hoch));
    const left = clamp(ausrichtung === 'start' ? K.l : K.r - w, links0, Math.max(links0, rechts0 - w));
    liste.style.left = `${left.toFixed(1)}px`;
    liste.style.top = `${top.toFixed(1)}px`;
    liste.classList.toggle(`${SL}-oben`, nachOben);
  }

  /* ---------- Öffnen, Schliessen, Wählen ---------- */

  function fokussiere(i) {
    eintraege[(i + eintraege.length) % eintraege.length]?.focus({ preventScroll: true });
  }
  function oeffnen(fokus = 'aktuell') {
    if (!mehr()) return false;
    if (!offen) {
      offen = true;
      clearTimeout(zeit);
      schleier.hidden = false;
      liste.hidden = false;
      liste.inert = false;
      lage();
      void liste.offsetWidth; // erst sichtbar setzen, dann einblenden
      liste.classList.remove(`${SL}-aus`);
      knopf.setAttribute('aria-expanded', 'true');
      knopf.classList.add(`${SL}-offen`);
      addEventListener('resize', lage);
    }
    fokussiere(fokus === 'letzte' ? eintraege.length - 1 : fokus === 'erste' ? 0 : aktIndex());
    return true;
  }
  /** sofort: ohne Ausblenden. Lag der Fokus in der Liste, geht er an den Schalter zurück. */
  function schliessen(sofort = false) {
    if (!offen) return;
    offen = false;
    const zurueck = liste.contains(document.activeElement);
    liste.classList.add(`${SL}-aus`);
    liste.inert = true;
    schleier.hidden = true;
    knopf.setAttribute('aria-expanded', 'false');
    knopf.classList.remove(`${SL}-offen`);
    removeEventListener('resize', lage);
    clearTimeout(zeit);
    const weg = () => { if (!offen) liste.hidden = true; };
    if (sofort) weg(); else zeit = setTimeout(weg, AUS_MS);
    if (zurueck) knopf.focus({ preventScroll: true });
  }
  function waehle(kuerzel) {
    if (!offen) return;
    schliessen();
    knopf.focus({ preventScroll: true });
    if (kuerzel !== aktuell) onWahl(kuerzel);
  }

  knopf.addEventListener('click', () => {
    if (!mehr()) return;
    if (offen) schliessen(); else oeffnen('aktuell');
  });
  // Klick ausserhalb: auf den Schleier (er deckt alles, auch den Schalter); mousedown ohne Standard, damit der Fokus
  // bis dahin in der Liste bleibt
  schleier.addEventListener('mousedown', (e) => e.preventDefault());
  schleier.addEventListener('click', () => { schliessen(); knopf.focus({ preventScroll: true }); });
  // der Fokus geht anders hinaus (etwa ein Klick, den der Schleier nicht fängt): zu, ohne ihn zurückzuholen
  liste.addEventListener('focusout', (e) => {
    const nach = /** @type {Node | null} */ (e.relatedTarget);
    if (offen && nach && !liste.contains(nach)) schliessen();
  });

  /* ---------- Tasten ---------- */

  /** true: die Taste gehört der Liste (Standardaktion verhindert). */
  function taste(e) {
    if (genommen.has(e)) return true;
    if (e.ctrlKey || e.metaKey || e.altKey || !mehr()) return false;
    const akt = /** @type {HTMLElement | null} */ (document.activeElement);
    const i = eintraege.indexOf(/** @type {HTMLButtonElement} */ (akt));
    if (!offen) {
      // zu: nur Pfeil runter und hoch am Schalter (Enter und Leertaste lösen seinen Klick aus)
      if (akt !== knopf) return false;
      if (e.key === 'ArrowDown') oeffnen('aktuell');
      else if (e.key === 'ArrowUp') oeffnen('letzte');
      else return false;
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      schliessen();
      knopf.focus({ preventScroll: true });
    } else if (e.key === 'ArrowDown') fokussiere(i < 0 ? aktIndex() : i + 1);
    else if (e.key === 'ArrowUp') fokussiere(i < 0 ? aktIndex() : i - 1);
    else if (e.key === 'Home' || e.key === 'PageUp') fokussiere(0);
    else if (e.key === 'End' || e.key === 'PageDown') fokussiere(eintraege.length - 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { /* nichts, aber nicht an das Menü */ }
    else if (e.key === 'Enter' || e.key === ' ') {
      // auf einem Eintrag: sein Klick wählt (gehalten: nichts); sonst der Fokus in die Liste
      if (i >= 0 && !e.repeat) return false;
      if (i < 0) fokussiere(aktIndex());
    } else if (e.key.length === 1 && e.key.trim()) {
      const b = e.key.toLocaleLowerCase();
      const n = sprachen.length, j = Array.from({ length: n }, (_, d) => (Math.max(i, 0) + 1 + d) % n)
        .find((x) => (sprachen[x].name ?? '').toLocaleLowerCase().startsWith(b));
      if (j === undefined) return false;
      fokussiere(j);
    } else return false;
    genommen.add(e);
    e.preventDefault();
    return true;
  }
  const hoerer = (e) => { if (!e.defaultPrevented) taste(e); };
  knopf.addEventListener('keydown', hoerer);
  liste.addEventListener('keydown', hoerer);

  baue();

  return {
    get offen() { return offen; },
    oeffnen,
    schliessen,
    /** Neue aktuelle Sprache, andere Sprachen oder Texte (alle Felder wahlweise); baut die Einträge neu. */
    setze({ aktuell: a, sprachen: sp, texte: tx } = {}) {
      if (a !== undefined) aktuell = a;
      if (sp) sprachen = sp;
      if (tx) texte = tx;
      const fokus = offen && liste.contains(document.activeElement) ? document.activeElement?.dataset?.sprache : null;
      baue();
      if (offen) {
        lage();
        if (fokus) fokussiere(Math.max(0, sprachen.findIndex((x) => x.kuerzel === fokus)));
      }
    },
    /** Für den Tastatur-Handler des Menüs oder des Spiels: true, wenn die Taste der Liste gehört. */
    keydown: taste,
  };
}

export { createSprachliste };
