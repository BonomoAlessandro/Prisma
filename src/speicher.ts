// Speicherschicht (Ticket 05 von .scratch/umbau/): Aller Zugriff auf den Spielstand läuft über dieses Modul. Das Spiel
// kennt nur die kleine Schnittstelle Speicher (lesen, schreiben, löschen je Schlüssel, Werte als Text); welche
// Umsetzung dahinter steckt, wählt die Plattform beim Start (speicherFuerPlattform). Heute gibt es nur eine:
// localStorage des Browsers. Später kann jede Plattform eine eigene einsetzen (Capacitor, Electron mit einer Datei für
// Steam Cloud), ohne dass sich das Spiel ändert. Schlüssel und Format des Spielstands legt src/spielstand.js fest,
// nicht die Umsetzung: Sie speichert jeden Text unter seinem Schlüssel unverändert.
//
// Fehler dringen nie nach aussen (privater Modus, voller Speicher, gesperrter Zugriff): lesen gibt dann null zurück,
// schreiben und löschen tun nichts, und das Spiel läuft weiter, ohne Stand. Kein anderer Teil des Codes greift auf
// localStorage zu (tests/speicher.test.mjs prüft das im Quelltext).

/** Ein Speicher für den Spielstand: Text je Schlüssel. Wirft nie. */
export interface Speicher {
  /** Der Text unter dem Schlüssel, null wenn keiner da ist oder das Lesen scheitert. */
  lesen(schluessel: string): string | null;
  /** Den Text unter dem Schlüssel ablegen; scheitert es, bleibt der Speicher, wie er war. */
  schreiben(schluessel: string, wert: string): void;
  /** Den Schlüssel entfernen; scheitert es, bleibt er. */
  loeschen(schluessel: string): void;
}

/**
 * localStorage des Browsers. Jeder Zugriff liest localStorage neu und steht in try: Schon der Zugriff auf den Namen
 * kann werfen (Speicher gesperrt), setItem wirft bei vollem Speicher oder im privaten Fenster (ältere Safari).
 */
export const localStorageSpeicher: Speicher = {
  lesen(schluessel) {
    try { return localStorage.getItem(schluessel); } catch { return null; }
  },
  schreiben(schluessel, wert) {
    try { localStorage.setItem(schluessel, wert); } catch { /* privates Fenster o. Ä. */ }
  },
  loeschen(schluessel) {
    try { localStorage.removeItem(schluessel); } catch { /* privates Fenster o. Ä. */ }
  },
};

/** Die Umsetzung für diese Plattform, einmal beim Start gewählt. Heute überall localStorage (Browser, später auch die
 * App mit Capacitor, deren WebView ihn ebenso hat). */
export function speicherFuerPlattform(): Speicher {
  return localStorageSpeicher;
}

/** Der Speicher des Spiels. */
export const speicher: Speicher = speicherFuerPlattform();
