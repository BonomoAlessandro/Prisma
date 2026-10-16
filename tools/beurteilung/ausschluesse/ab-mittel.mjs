// Ausschlussgründe, die erst ab „mittel“ gelten (Füllteil und Zerfall, Spec „Beurteilung“): Ein leichtes Level darf aus
// einfachen Strängen und unabhängigen Teilen bestehen.
//
// Ohne vorgegebenen Grad (grad = null) gelten sie wie ab „mittel“: Ausgenommen ist nur ein ausdrücklich leichtes Level.
// So geht kein Ausschluss verloren, nur weil der Grad fehlt; die Begründung sagt dann, dass der Grund erst ab „mittel“
// gilt. Bis die Beurteilung den Grad selbst bestimmt (Tickets 12 und 15), gibt ihn der Aufrufer vor.

/** Gilt ein Ausschlussgrund ab „mittel“ in der Beurteilung ctx? */
export const giltAbMittel = (ctx) => ctx.grad !== 'leicht';

/** Zusatz zur Begründung: leer, ausser der Grad ist nicht vorgegeben. */
export const zusatzOhneGrad = (ctx) => (ctx.grad === null ? ' Gilt erst ab „mittel“; der Grad ist nicht vorgegeben.' : '');
