// Eine neue Aufgabe abwarten (Seitenstart in Stücken, Ticket 10 der Leistung): ein Versprechen, das in einer eigenen
// Aufgabe der Ereignisschleife erfüllt wird (MessageChannel, ohne die Verzögerung von setTimeout). Dazwischen zeichnet
// der Browser, wenn ein Bild fällig ist, und nimmt Eingaben an; der Aufbau wartet aber nicht auf ein Bild. Gebraucht
// zwischen den Teilen der Seite beim Laden (früher eigene klassische Skripte) und von seitenstart.
export const neueAufgabe = (): Promise<void> => new Promise((weiter) => {
  const kanal = new MessageChannel();
  kanal.port1.onmessage = () => weiter();
  kanal.port2.postMessage(0);
});
