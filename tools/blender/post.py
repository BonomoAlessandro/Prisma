# Nachbearbeitung ohne neu zu rendern: blender -b --python post.py -- <name> <belichtung> [ausgabe-name]
import sys, os
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from wald_lib import aces_game, srgb_encode
from wald_io import save_image, load_exr

argv = sys.argv[sys.argv.index('--') + 1:]
name, exposure = argv[0], float(argv[1])
out = argv[2] if len(argv) > 2 else name
img = load_exr(os.path.join(HERE, 'out', name + '.exr'))[..., :3].astype(np.float64)
save_image(srgb_encode(aces_game(img * exposure)), os.path.join(HERE, 'out', out + '.png'))
print('FERTIG', out)
