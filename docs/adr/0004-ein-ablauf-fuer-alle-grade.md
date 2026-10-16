# Ein Generator-Ablauf für alle Schwierigkeitsgrade

Bisher baute `generate.mjs` die meisten Level konstruktiv und `harden.mjs` die Level 121–150 durch Simulated Annealing,
jedes mit eigener Formel. Neu erzeugt ein einziger Ablauf Level für alle Schwierigkeitsgrade: Zuerst baut er eine
Kernidee gezielt ein, dann verfeinert er das Level, beurteilt mit dem gemeinsamen Modul. So gelten für alle Level
dieselben Massstäbe, und auch schwere Level haben eine Kernidee statt nur viele drehbare Teile.
