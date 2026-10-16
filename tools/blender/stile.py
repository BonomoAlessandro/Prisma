# Belichtung und Malstil je Szene, nach WALD_STIL (zugleich der Ordner out/<stil>, sky/<stil>); gelesen von
# wald_export.py (Belichtung) und anime.py (Malen).
#   belichtung  Faktor auf das lineare Rendering
#   stops       Farbverlauf nach Helligkeit (Anzeige-Farben); die eigene Farbe der Szene bleibt nur in den Mitteltönen –
#               für Szenen in einer Grundfarbe (Mondnacht). Ohne stops: Farben der Szene, satter (saettigung), Schatten
#               farbig statt schwarz (schatten: Farbe, die sich in die dunklen Töne mischt)
#   licht       Faktor je Farbe für die hellen Töne (Abendlicht), ohne: keiner
#   glut        Farbe des Leuchtens um helle Stellen (Nebel, Mond, Sonne, Wolken)
#   knie        Anteil der Spitze (PEAK), ab dem helle Töne weich darunter gedrückt werden (Standard 0.6)
#   spitze      hellster Szenenwert nach dem Malen (Standard 0.95, unter der Bloom-Schwelle)
#   volumen     Streuungen im Volumen beim Rendern (Standard 2; dichte Wolken bleiben damit innen grau)
#   rauschen    Stärke der Farbschwankung wie bei Gouache (Standard 0.02; ein gerenderter Himmel wirkt damit fleckig)
#   himmel      'mondnacht': gemalter Nachthimmel mit Mond, Wolken und Sternen statt des gerenderten (Himmelsmaske);
#               None: der gerenderte Himmel bleibt und wird wie alles andere gemalt

STILE = {
    '': {'belichtung': 5.5},   # realistischer Wald (wald_export.py encode, nicht gemalt)
    # Mondnacht wie in einem gemalten Anime-Hintergrund – tiefes Indigo in den Schatten, Wald blaugrün, Nebel und Dunst
    # leuchtend hellblau bis türkis, die hellsten Stellen fast weiss mit einem Hauch Cyan
    'anime': {
        'belichtung': 5.5,
        'stops': [
            (0.00, (0.012, 0.025, 0.040)),
            (0.12, (0.025, 0.068, 0.082)),
            (0.25, (0.058, 0.135, 0.145)),
            (0.40, (0.140, 0.275, 0.355)),
            (0.55, (0.340, 0.480, 0.620)),
            (0.72, (0.610, 0.715, 0.835)),
            (0.88, (0.810, 0.855, 0.925)),
            (1.00, (0.935, 0.950, 0.980)),
        ],
        'glut': (0.85, 0.95, 1.0),
        'himmel': 'mondnacht',
    },
    # Abend am Meer wie bei Ghibli: satte Farben, warmes Licht, Schatten bläulich-violett statt schwarz
    'beach': {
        'belichtung': 1.1,
        'saettigung': 1.25,
        'schatten': (0.030, 0.030, 0.075),
        'glut': (1.0, 0.86, 0.66),
        'himmel': None,
        'licht': (1.0, 0.9, 0.76),   # helle Töne wärmer: Abendsonne
        'knie': 0.78,     # helle Töne erst spät unter die Spitze drücken (Sand und Lagune bleiben leuchtend)
        'spitze': 0.88,   # unter TEX_MAX (anime.py): kein hartes Kappen am Horizont zur Sonne hin
        'rauschen': 0.006,
        'volumen': 4,
    },
}


def stil(name):
    return STILE[name]
