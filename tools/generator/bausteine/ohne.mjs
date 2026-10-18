// Baustein ohne Kernidee (Ticket 18): Er baut keine Kernidee ein. Das Level besteht aus den Strängen, die das Ergänzen
// setzt (Quellen, Elemente entlang der Strahlen, Ziele an den Strahlenden). Das genügt für „leicht“: Leichte Level
// dürfen aus einfachen Strängen bestehen und brauchen keine Kernidee (Spec, Glossar „Füllteil“, Ticket 13).
export default {
  kernidee: null,
  braucht: { quellen: 1, drehbar: 0 },
  baue: () => null,
};
