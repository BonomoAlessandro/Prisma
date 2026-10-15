# Der Code beurteilt, KI-Tester korrigieren nur eng

Schwierigkeit, Spielwert und Ausschlüsse berechnet ein gemeinsames Modul, weil es wiederholbar und testbar ist. Zwei
KI-Tester beurteilen, was der Code schlecht sieht (Aha-Moment, Lesbarkeit), aber ihre Urteile streuen stark. Darum
dürfen sie ein Level nur gemeinsam ablehnen oder um höchstens fünf Plätze verschieben, nie über eine Gradgrenze. Sie
prüfen jedes neue Level und jedes, bei dem Code und heutige Reihenfolge um mehr als zehn Plätze auseinanderliegen.
Jede Korrektur steht mit Begründung in einem versionierten Protokoll.
