"""Bilder der Filme auf das Brett zuschneiden und verkleinern (publish/bilder/<variante>/fNN.jpg), dazu je Variante ein
Kontaktbogen zum Prüfen (out/<variante>-bogen.jpg). Aufruf: python -I zuschnitt.py <variante> …  [--bogen-nur]"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

HIER = Path(__file__).parent
BOX = (0, 96, 1440, 900)          # Brett mit etwas Himmel, aus 1440 × 900
GROESSE = (720, 402)
QUALI = int(next((a.split('=')[1] for a in sys.argv if a.startswith('--q=')), 70))


def film(v):
    src = HIER / 'out' / v
    dst = HIER / 'publish' / 'bilder' / v
    dst.mkdir(parents=True, exist_ok=True)
    zeiten = json.loads((src / 'zeiten.json').read_text())['zeiten']
    bilder = sorted(src.glob('f*.jpg'))
    summe = 0
    for b in bilder:
        im = Image.open(b).convert('RGB').crop(BOX).resize(GROESSE, Image.LANCZOS)
        ziel = dst / b.name
        im.save(ziel, quality=QUALI, optimize=True, progressive=True)
        summe += ziel.stat().st_size
    # Kontaktbogen: jedes dritte Bild, 4 Spalten, Zeit eingetragen
    wahl = list(range(0, len(bilder), 3))
    w, h = 480, 268
    bogen = Image.new('RGB', (w * 4, h * ((len(wahl) + 3) // 4)), 'black')
    for n, k in enumerate(wahl):
        im = Image.open(bilder[k]).convert('RGB').crop(BOX).resize((w, h), Image.LANCZOS)
        d = ImageDraw.Draw(im)
        d.rectangle((0, 0, 90, 20), fill='black')
        d.text((4, 4), f'{zeiten[k]:+.2f} s', fill='white')
        bogen.paste(im, ((n % 4) * w, (n // 4) * h))
    bogen.save(HIER / 'out' / f'{v}-bogen.jpg', quality=82)
    print(v, len(bilder), 'Bilder', round(summe / 1024), 'KB')


for v in [a for a in sys.argv[1:] if not a.startswith('--')]:
    film(v)
