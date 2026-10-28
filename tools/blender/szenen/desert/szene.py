# Baut die Blender-Szene „Wüste am Nachmittag“ (Skybox desert, PLAN 1.2, Storyline: Gelb), realistisch gerendert und
# danach gemalt wie Strand und Vulkan. Über den Blender-MCP: wald_mcp.neu('desert') baut sie und speichert
# tools/blender/desert.blend; einzelne Teile neu mit wald_mcp.scene('desert').replace_…().
# Vorbild: Anime-Wüste mit messerscharfen Dünenkämmen wie in der Namib – grosse, klar begrenzte Flächen, die Seite zur
# Sonne hell und golden, die steile Leeseite im Schatten warm orangebraun, in der Ferne Dunst und ein Gebirge.
# Aufbau: Das Brett schwebt über einer flachen Sandmulde (FLOOR). Ringsum Sicheldünen (Barchane), weiter
# draussen grössere Dünen und Dünenketten, in der Ferne Sterndünen, dahinter ein welliges Sandmeer und in einem Sektor
# ein Gebirge im Dunst. Jede Düne ist eine Kammlinie (chain): Zur Windseite fällt sie flach ab (STOSS), auf der Leeseite
# steil (LEE, Schüttwinkel); die Höhe ist das Maximum aller Dünen und des Grunds, in den Tälern weich (smax). So bleiben
# die Kämme scharf und die Flanken eben. Rund um das Brett liegen ein paar kleine, nahe Dünen, die das Spiel als 3D-Netz zeichnet (NEAR, bakedMesh).
# Links hinten liegt eine kleine Oase (Teich, Dattelpalmen), rechts der grossen
# Düne stehen in der Ferne die drei Pyramiden von Giza auf ihrem Plateau; zu beiden bleibt der Blick frei (sightlines).
# Licht: Nachmittagssonne hinten links (SUN), Wind von links nach rechts (WIND): Die flachen Luvseiten liegen in der
# Sonne, die steilen Leeseiten im Schatten.
# Koordinaten: Blender (x, y, z) = Spiel (x, −z, y). Brett im Ursprung, Panorama-Mittelpunkt (0, 0, 3).
import bpy, math, os, sys, time, importlib.util
import numpy as np
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
from wald_lib import Perlin, fbm, ridged, smoothstep, smax
from wald_scene import make_mesh, NT


def _strand():
    """Baumodul der Strand-Szene (ohne Aufbau): Knotengruppen, Luft, Ikosphäre"""
    name = 'szene_beach'
    if name not in sys.modules:
        spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'szenen', 'beach', 'szene.py'))
        mod = importlib.util.module_from_spec(spec)
        sys.modules[name] = mod
        spec.loader.exec_module(mod)
    return sys.modules[name]


S = _strand()
T0 = time.time()
def log(*a):
    print('[%6.1fs]' % (time.time() - T0), *a, flush=True)


PANO_CENTER = (0.0, 0.0, 3.0)
FLOOR = -4.0          # Sand unter dem Brett (Spiel: das Brett schwebt 4 m darüber)
CLEAR = 16.0          # so weit bleibt die Mulde unter dem Brett ganz flach
R_DUNE = 95.0         # kein Dünenkamm näher am Brett: Das Spiel legt das Panorama auf ein Netz nach seiner Tiefe, nur
                      # bis 88 m echt (PANO.dMax), dahinter auf eine Kugel; eine nähere Kante vor Fernerem risse auf,
                      # sobald die Kamera neben dem Mittelpunkt steht (Zacken an den Kämmen)
OASIS = (-125.0, 150.0)   # Oase: Richtung (Grad von +y über +x) und Abstand ihrer Mitte (m); weiter als 88 m, sonst
                          # rissen die Palmen am Netz der Tiefe im Spiel auf (R_DUNE)
POND = 17.0               # Halbmesser des Teichs (m)
OASIS_AREA = 42.0         # so weit um ihre Mitte keine Düne
PYR_AZ, PYR_DIST = 46.0, 1600.0   # Pyramiden von Giza: Richtung und Abstand der mittleren (Chephren)
PYR_HALF = 14.0                   # so breit (± Grad) bleibt der Blick auf sie frei
SUN_ELEV = 17.0       # Grad über dem Horizont: später Nachmittag, das Streiflicht zeigt die runden Formen
SUN_AZ = -62.0        # Grad von +y über +x: hinten links
SUN = Vector((math.sin(math.radians(SUN_AZ)) * math.cos(math.radians(SUN_ELEV)),
              math.cos(math.radians(SUN_AZ)) * math.cos(math.radians(SUN_ELEV)),
              math.sin(math.radians(SUN_ELEV)))).normalized()
WIND_DEG = -20.0      # der Wind weht nach +x, etwas nach vorn: die Kämme laufen schräg in die Tiefe
WIND = np.array([math.cos(math.radians(WIND_DEG)), math.sin(math.radians(WIND_DEG))])
PERP = np.array([-WIND[1], WIND[0]])
STOSS = 0.18          # Luvseite (m je m, um 10°: lang und sanft wie bei gemalten Dünen)
LEE = 0.5             # Leeseite (um 27°: weicher als der Schüttwinkel, gemalter Sand statt Grat)
ROUND = 0.9           # Kämme rund: Krümmungshalbmesser im Verhältnis zur Kammhöhe (Profil Neigung · (√(d² + R²) − R))
EXTENT = 30000.0
SEG_NEAR, R_SPLIT, SEG_FAR = 1536, 2600.0, 768   # Gitter: fein bis R_SPLIT, dahinter grob
D1, D2, D3, D4 = (Perlin(s) for s in (211, 223, 227, 229))


def _at(az, d):
    return np.array([math.sin(math.radians(az)) * d, math.cos(math.radians(az)) * d])


OASIS_XY = _at(*OASIS)


def _wedge(x, y, az, half, r0, r1):
    """1 in einem Keil vom Brett aus (Richtung az ± half Grad, Abstand r0 … r1), weich auslaufend"""
    r = np.hypot(x, y)
    da = np.abs((np.degrees(np.arctan2(x, y)) - az + 180.0) % 360.0 - 180.0)
    return (1 - smoothstep(half, half + 6.0, da)) * smoothstep(r0 - 30.0, r0, r) * (1 - smoothstep(r1, r1 + 300.0, r))


def sightlines(x, y):
    """0 … 1: so weit sind die Dünen zurückgenommen – freier Blick vom Brett auf die Oase, das Plateau von Giza frei
    (auf dem Weg dorthin senkt _fit_corridor ganze Dünen: ein Keil schnitte Wände in ihre Hänge und liesse halbe Grate
    stehen)"""
    oasis = np.maximum(_wedge(x, y, OASIS[0], 9.0, 60.0, OASIS[1]),
                       1 - smoothstep(OASIS_AREA * 0.7, OASIS_AREA * 1.3, np.hypot(x - OASIS_XY[0], y - OASIS_XY[1])))
    giza = _at(PYR_AZ, PYR_DIST)   # das Plateau um die Pyramiden: Schotter, keine Dünen
    return np.maximum(oasis, 1 - smoothstep(550.0, 800.0, np.hypot(x - giza[0], y - giza[1])))


def sc():
    return bpy.context.scene


def link(name, data, coll=None):
    ob = bpy.data.objects.new(name, data)
    (coll or sc().collection).objects.link(ob)
    return ob


# ---------------------------------------------------------------- Dünen

def _wobble(rng, s, amp, waves=2):
    """glatte Zufallskurve über s ∈ [−1, 1] (Summe weniger Sinuswellen), Amplitude amp"""
    out = np.zeros_like(s)
    for k in range(waves):
        f = rng.uniform(0.6, 1.6) * (k + 1)
        out += np.sin(f * math.pi * s + rng.uniform(0, 2 * math.pi)) / (k + 1)
    return amp * out / sum(1 / (k + 1) for k in range(waves))


def crescent(rng, c, L, H, bend=0.35, n=28, stoss=STOSS, lee=LEE):
    """Sicheldüne: Kamm quer zum Wind, die Hörner nach Lee gebogen, zu den Enden hin niedriger"""
    s = np.linspace(-1, 1, n)
    P = (np.asarray(c)[None] + PERP[None] * (s * L / 2)[:, None]
         + WIND[None] * (bend * L / 2 * s ** 2 + _wobble(rng, s, 0.08 * L))[:, None])
    h = H * np.clip(1 - s ** 2, 0, 1) ** 0.45 * (1 + _wobble(rng, s, 0.12, 3))
    return dict(P=P, H=h, stoss=stoss, lee=lee, k=max(1.0, 0.12 * H))


def transverse(rng, c, L, H, n=48):
    """Querdüne: langer Kamm quer zum Wind, in Bögen nach Lee und Luv, mit Sätteln und Buckeln"""
    s = np.linspace(-1, 1, n)
    P = np.asarray(c)[None] + PERP[None] * (s * L / 2)[:, None] + WIND[None] * _wobble(rng, s, 0.07 * L, 4)[:, None]
    h = H * np.clip(1 - s ** 2, 0, 1) ** 0.3 * (1 + _wobble(rng, s, 0.22, 4))
    return dict(P=P, H=h, stoss=STOSS, lee=LEE, k=max(1.5, 0.12 * H))


def ridge(rng, c, L, H, angle, n=36, stoss=0.34, lee=0.58):
    """Dünenkette (lang, gewunden), Richtung angle (Grad gegen die Windrichtung)"""
    a = math.radians(WIND_DEG + angle)
    d = np.array([math.cos(a), math.sin(a)]); q = np.array([-d[1], d[0]])
    s = np.linspace(-1, 1, n)
    P = np.asarray(c)[None] + d[None] * (s * L / 2)[:, None] + q[None] * _wobble(rng, s, 0.09 * L, 3)[:, None]
    h = H * np.clip(1 - s ** 2, 0, 1) ** 0.35 * (1 + _wobble(rng, s, 0.18, 3))
    return dict(P=P, H=h, stoss=stoss, lee=lee, k=max(1.5, 0.12 * H))


def star(rng, c, H, arm, arms=None):
    """Sterndüne: ein Gipfel, 3–5 gewundene Arme, die zu den Enden hin auslaufen"""
    arms = arms or int(rng.integers(3, 6))
    a0 = rng.uniform(0, 2 * math.pi)
    out = []
    for k in range(arms):
        a = a0 + 2 * math.pi * k / arms + rng.uniform(-0.35, 0.35)
        d = np.array([math.cos(a), math.sin(a)]); q = np.array([-d[1], d[0]])
        Lk = arm * rng.uniform(0.6, 1.3)
        s = np.linspace(0, 1, 20)
        P = np.asarray(c)[None] + d[None] * (s * Lk)[:, None] + q[None] * (0.25 * Lk * s ** 1.5 * rng.uniform(-1, 1))[:, None]
        h = H * (1 - s) ** 0.9 * (1 + 0.1 * np.sin(5 * s + rng.uniform(0, 6)))
        out.append(dict(P=P, H=h, stoss=0.30, lee=0.62, k=max(2.0, 0.1 * H)))
    return out


def _place(rng, n, r0, r1, size, taken, az=None, tries=4000):
    """n Mittelpunkte im Ring r0 … r1 (Fläche gleich verteilt), mit Abstand size(r) zu allen bisherigen"""
    pts = []
    for _ in range(tries):
        if len(pts) >= n:
            break
        r = math.sqrt(rng.uniform(r0 * r0, r1 * r1))
        a = rng.uniform(0, 2 * math.pi) if az is None else math.radians(rng.uniform(*az))
        p = np.array([r * math.sin(a), r * math.cos(a)])
        sz = size(r)
        if all(np.hypot(*(p - q)) > 0.5 * (sz + s2) for q, s2 in taken):
            pts.append(p); taken.append((p, sz))
    return pts


FOOT_CLEAR = 40.0     # so weit vom Brett bleibt die Mulde frei von Dünenhängen (lange Luvhänge sonst bis unters Brett)


def _reach(c):
    """So weit vom Kamm reicht eine Düne höchstens: Höhe durch die flachste Neigung, dazu die Rundung des Kamms (das
    Profil ist um R nach aussen verschoben) und der weiche Übergang zu den Nachbarn (k). Wer weniger annimmt, schneidet
    die Düne ab: Stufen von Metern im Sand."""
    H = float(c['H'].max())
    return H / c['stoss'] + max(2.0, ROUND * H) + 4 * c['k'] + 1.0


def _fit_clear(c, radius=FOOT_CLEAR, margin=0.3):
    """Düne so weit senken, dass sie auf dem Kreis radius um das Brett mindestens margin unter ihrem Grund bleibt"""
    near = float(np.min(np.hypot(c['P'][:, 0], c['P'][:, 1]))) - _reach(c)
    if near > radius:
        return c
    a = np.linspace(0, 2 * math.pi, 128, endpoint=False)
    ring = radius * np.stack([np.sin(a), np.cos(a)], -1)
    H0 = c['H'].copy()
    g = base(ring[:, 0], ring[:, 1])
    def top(s):
        c['H'] = H0 * s; c.pop('dense', None)
        return float((_envelope(ring, c) - g).max())
    if top(1.0) <= -margin:
        return c
    lo, hi = 0.0, 1.0
    for _ in range(12):
        mid = 0.5 * (lo + hi)
        lo, hi = (mid, hi) if top(mid) <= -margin else (lo, mid)
    top(lo)
    return c


def _fit_corridor(c, margin=0.3):
    """Düne als Ganzes so weit senken, dass sie den Blick vom Panorama-Mittelpunkt auf den Fuss der Pyramiden nicht
    verdeckt (Strahlen im Keil PYR_AZ ± PYR_HALF bis kurz vor das Plateau)"""
    az = np.radians(np.linspace(PYR_AZ - PYR_HALF, PYR_AZ + PYR_HALF, 11))
    r = np.linspace(60.0, PYR_DIST - 450.0, 80)
    pts = np.stack([np.outer(np.sin(az), r).ravel(), np.outer(np.cos(az), r).ravel()], -1)
    lo, hi = c['P'].min(0) - _reach(c), c['P'].max(0) + _reach(c)
    near = (pts[:, 0] > lo[0]) & (pts[:, 0] < hi[0]) & (pts[:, 1] > lo[1]) & (pts[:, 1] < hi[1])
    if not near.any():
        return c
    pts = pts[near]
    d = np.hypot(pts[:, 0], pts[:, 1])
    foot = base(np.array([_at(PYR_AZ, PYR_DIST)[0]]), np.array([_at(PYR_AZ, PYR_DIST)[1]]))[0]
    sight = PANO_CENTER[2] + (foot - PANO_CENTER[2]) * d / PYR_DIST - margin   # Sichtlinie zum Fuss
    H0 = c['H'].copy()
    def over(s):
        c['H'] = H0 * s; c.pop('dense', None)
        return float((_envelope(pts, c) - sight).max())
    if over(1.0) <= 0:
        return c
    lo_, hi_ = 0.0, 1.0
    for _ in range(12):
        mid = 0.5 * (lo_ + hi_)
        lo_, hi_ = (mid, hi_) if over(mid) <= 0 else (lo_, mid)
    over(lo_)
    return c


def _fit_reach(c, fade=25.0):
    """Kamm zum Brett hin auslaufen lassen: näher als R_DUNE flach, über fade Meter ansteigend"""
    c['H'] = c['H'] * smoothstep(R_DUNE, R_DUNE + fade, np.hypot(c['P'][:, 0], c['P'][:, 1]))
    c.pop('dense', None)
    return c


VIEW_TOP = 19.0       # so hoch (Grad über dem Horizont, vom Mittelpunkt aus) dürfen nahe Kämme ragen: darunter liegen
                      # die HD-Streifen (stile.py streifen 22), darüber nur das grobe ganze Bild


def _fit_view(c, top=VIEW_TOP):
    """Düne so weit senken, dass ihr Kamm vom Panorama-Mittelpunkt aus höchstens top Grad hoch reicht"""
    d = np.hypot(c['P'][:, 0], c['P'][:, 1])
    room = PANO_CENTER[2] - base(c['P'][:, 0], c['P'][:, 1]) + math.tan(math.radians(top)) * d   # erlaubte Kammhöhe
    s = float(np.min(room / np.maximum(c['H'], 1e-6)))
    if s < 1.0:
        c['H'] = c['H'] * s; c.pop('dense', None)
    return c


def dunes(seed=7):
    """Alle Kammlinien: nahe Sicheldünen, mittlere Dünen und Ketten, ferne Sterndünen"""
    rng = np.random.default_rng(seed)
    out, taken = [], []
    # nah, rund um die Mulde: vorn eine grosse Düne, deren Kamm in die Tiefe läuft (Blickfang hinter dem Brett), ringsum
    # Sicheldünen; alle Kämme erst ab R_DUNE (_fit_reach), ihre Hänge erst ab FOOT_CLEAR (_fit_clear) und nicht höher
    # als VIEW_TOP (_fit_view)
    hero = PERP * (R_DUNE + 95.0) - WIND * 10.0; taken.append((hero, 120.0))
    out.append(crescent(rng, hero, 190.0, 36.0, 0.12))
    for c in _place(rng, 10, R_DUNE + 25.0, 210.0, lambda r: 0.6 * r, taken):
        out.append(crescent(rng, c, rng.uniform(70, 150), rng.uniform(18, 34), rng.uniform(0.2, 0.5)))
    # mittel: ein Meer aus Querdünen, dazwischen Sicheldünen und einige Ketten; dicht, sie greifen ineinander
    for c in _place(rng, 130, 150.0, 1600.0, lambda r: 0.2 * r + 45, taken):
        r = np.hypot(*c)
        H = rng.uniform(12, 22) + 0.03 * r * rng.uniform(0.6, 1.2)
        kind = rng.uniform()
        if kind < 0.55:
            out.append(transverse(rng, c, rng.uniform(8, 16) * H, H))
        elif kind < 0.85:
            out.append(crescent(rng, c, rng.uniform(5.0, 8.0) * H, H, rng.uniform(0.2, 0.55)))
        else:
            out.append(ridge(rng, c, rng.uniform(10, 18) * H, 0.9 * H, rng.uniform(-35, 35)))
    # fern: Sterndünen und grosse Querdünen
    for c in _place(rng, 220, 1600.0, 8000.0, lambda r: 0.12 * r + 200, taken):
        r = np.hypot(*c)
        H = rng.uniform(45, 90) + 0.012 * r * rng.uniform(0.5, 1.0)
        kind = rng.uniform()
        if kind < 0.45:
            out.extend(star(rng, c, H, rng.uniform(4.0, 7.0) * H))
        elif kind < 0.85:
            out.append(transverse(rng, c, rng.uniform(10, 18) * H, 0.9 * H))
        else:
            out.append(ridge(rng, c, rng.uniform(9, 15) * H, 0.8 * H, rng.uniform(-30, 30), stoss=0.3, lee=0.62))
    for c in out:   # Sichtachse zur Oase
        c['H'] = c['H'] * (1 - sightlines(c['P'][:, 0], c['P'][:, 1]))
    return [d for d in (_fit_view(_fit_corridor(_fit_clear(_fit_reach(c)))) for c in out) if d['H'].max() > 3.0]


def base(x, y):
    """Grund ohne Dünen: die flache Mulde, weiter draussen ein welliges Sandmeer, dahinter das Gebirge"""
    r = np.hypot(x, y)
    und = 0.5 * fbm(D1, x / 45 + 3, y / 45 - 5, 3) * smoothstep(4, CLEAR + 10, r) + 0.08 * fbm(D2, x / 7, y / 7, 2)
    und = und + 6.0 * smoothstep(30, R_DUNE + 20, r)   # die Mulde steigt zu den Dünen hin an, ein Tal (hohl: verdeckt nichts)
    # grosse, sanfte Wellen, auf denen die Dünen liegen (zwischen ihnen keine Ebene)
    open_ = 1 - _wedge(x, y, PYR_AZ, PYR_HALF + 2.0, R_DUNE, PYR_DIST + 900.0)   # zu den Pyramiden: flache Ebene, Plateau
    und = und + np.minimum(6 + 0.006 * r, 30) * smoothstep(120, 600, r) * fbm(D2, x / 700 - 3, y / 700 + 8, 3) * open_
    sea = smoothstep(2500, 9000, r) * (30 + 25 * fbm(D2, x / 3000 + 7, y / 3000 - 1, 3))
    # Sandmeer: Kämme quer zum Wind (ridged, gestreckt), nach aussen höher, dann im Dunst flach
    u = x * WIND[0] + y * WIND[1]; v = x * PERP[0] + y * PERP[1]
    crest = ridged(D3, u / 900 + 11, v / 2600 - 4, 4)
    sea = sea + crest * 70 * smoothstep(5000, 10000, r) * (1 - smoothstep(17000, 26000, r))
    return FLOOR + und + sea * open_ + mountains(x, y)


def mountains(x, y):
    """Gebirge in einem Sektor hinter dem Brett (gegen +y, leicht rechts), 8–13 km entfernt"""
    r = np.hypot(x, y)
    az = np.degrees(np.arctan2(x, y))
    sector = smoothstep(-75, -45, az) * (1 - smoothstep(55, 85, az))
    band = smoothstep(7500, 9500, r) * (1 - smoothstep(12500, 15000, r))
    hm = ridged(D4, x / 2600 + 2, y / 2600 + 9, 5)
    lift = 0.35 + 0.65 * (0.5 + 0.5 * fbm(D1, x / 9000, y / 9000, 2))
    behind = 1 - 0.85 * _wedge(x, y, PYR_AZ, 14.0, 3000.0, 30000.0)   # hinter den Pyramiden niedriger: ihr Umriss bleibt frei
    return 950 * hm ** 1.5 * lift * sector * band * behind


def _slope(c, n):
    """Neigung zur Seite n (Einheitsvektor weg vom Kamm): flach nach Luv, steil nach Lee"""
    w = smoothstep(-0.2, 0.6, n @ WIND)
    return c['stoss'] + (c['lee'] - c['stoss']) * w


def _catmull(P, per=16):
    """glatte Kurve (Catmull-Rom) durch die Punkte P, per Punkte je Stück; die Enden verlängert gespiegelt"""
    Q = np.concatenate([2 * P[:1] - P[1:2], P, 2 * P[-1:] - P[-2:-1]])
    t = np.linspace(0, 1, per, endpoint=False)[:, None]
    out = []
    for i in range(1, len(Q) - 2):
        p0, p1, p2, p3 = Q[i - 1], Q[i], Q[i + 1], Q[i + 2]
        out.append(0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t ** 2
                          + (3 * p1 - p0 - 3 * p2 + p3) * t ** 3))
    return np.concatenate(out + [P[-1:]])


def _dense(c):
    """Kammlinie als glatte Kurve dicht nach Bogenlänge abgetastet (nah am Brett alle 0,4 m, weiter draussen gröber):
    Punkte, Höhen, Normalen (stetig: an den Knoten der groben Linie springt die Neigung so nicht), Grund darunter (jeder
    Kammpunkt steht auf dem Grund an seiner Stelle: Ein Mittel über die ganze Kette hob lange Ketten nahe am Brett an)"""
    if 'dense' not in c:
        P, H = c['P'], c['H']
        F = _catmull(np.concatenate([P, H[:, None]], 1))
        s = np.concatenate([[0.0], np.cumsum(np.linalg.norm(np.diff(F[:, :2], axis=0), axis=1))])
        step = max(0.4, 0.004 * float(np.hypot(*P.mean(0))))
        si = np.linspace(0, s[-1], max(3, int(s[-1] / step) + 1))
        D = np.stack([np.interp(si, s, F[:, k]) for k in range(3)], -1)
        T = np.gradient(D[:, :2], axis=0); T /= np.linalg.norm(T, axis=1, keepdims=True)
        # vor R_DUNE flach, auch zwischen den groben Punkten (die glatte Kurve trug die Höhe sonst nach innen, _fit_reach),
        # ebenso in den Sichtachsen; ausgeblendete Teile liegen dazu unter dem Grund: Gleich hoch wie er höbe das weiche
        # Maximum (smax) die Fläche um k/4 an, ein schmaler Wall entlang der ausgeblendeten Kammlinie
        fade = (np.ones(len(D)) if c.get('near') else
                smoothstep(R_DUNE, R_DUNE + 25.0, np.hypot(D[:, 0], D[:, 1])) * (1 - sightlines(D[:, 0], D[:, 1])))
        Hd = np.maximum(D[:, 2], 0.0) * fade
        # entlang des Kamms höchstens so steil wie die Luvseite: Hörner und ausgeblendete Stellen laufen flach aus (sonst
        # fiel der Kamm an seinen Enden auf wenigen Metern um 20 m – eine Steilwand quer zur Düne)
        ds = np.hypot(*np.diff(D[:, :2], axis=0).T)
        a = 0.8 * c['stoss']
        for i in range(1, len(Hd)):
            Hd[i] = min(Hd[i], Hd[i - 1] + a * ds[i - 1])
        for i in range(len(Hd) - 2, -1, -1):
            Hd[i] = min(Hd[i], Hd[i + 1] + a * ds[i])
        ground = base(D[:, 0], D[:, 1]) - (1 - fade) * (c['k'] + 0.5)
        c['dense'] = (D[:, :2], Hd, np.stack([-T[:, 1], T[:, 0]], -1), ground)
    return c['dense']


def _envelope(p, c, budget=3_000_000):
    """Höhe der Düne c (Blender z) an den Punkten p: das Maximum über die Kammpunkte j ihres Zelts – Kammhöhe minus
    Neigung mal Abstand, um den Kamm rund (Bogen mit Halbmesser R statt Grat). Die Neigung des Zelts gilt nach der
    Seite von p gegenüber j (Luv flach, Lee steil; an den Enden des Kamms nach der Richtung vom Endpunkt) und geht über
    einen Winkel weich von Luv nach Lee über. So ist jedes Zelt glatt und ihr Maximum ohne Stufen; hart gewechselt
    (je Kammpunkt) lagen feine Rinnen entlang der verlängerten Tangenten, nach der Seite des nächsten Kammpunkts für
    alle Zelte Stufen von Metern auf den Kämmen."""
    Pd, Hd, Nd, Bd = _dense(c)
    top = Bd + Hd
    R = np.maximum(2.0, ROUND * Hd)                                  # Rundung je Kammpunkt
    m = len(Pd)
    u = np.arange(m) / (m - 1)
    end = smoothstep(0.0, 0.06, u) * smoothstep(1.0, 0.94, u)      # 1 im Inneren, 0 an den Enden
    tip_at = Pd[np.where(np.arange(m) < m // 2, 0, m - 1)]           # nächster Endpunkt je Kammpunkt
    out = np.empty(len(p))
    chunk = max(500, budget // m)
    for s in range(0, len(p), chunk):
        q = p[s:s + chunk]
        v = q[:, None, :] - Pd[None]
        d = np.sqrt((v * v).sum(-1))
        side = np.clip((v * Nd[None]).sum(-1) / (0.5 * d + 1.0), -1.0, 1.0)   # −1 … 1, weich über einen Winkel
        tip = q[:, None, :] - tip_at[None]
        tip /= np.maximum(np.linalg.norm(tip, axis=-1, keepdims=True), 1e-9)
        n = Nd[None] * (side * end[None])[..., None] + tip * (1 - end)[None, :, None]   # nicht normiert: stetig
        out[s:s + chunk] = (top[None] - _slope(c, n) * (np.sqrt(d * d + R[None] ** 2) - R[None])).max(1)
    return out


def height_raw(x, y):
    """Höhe des Geländes (Blender z) vor dem Glätten und der Grund ohne Dünen"""
    x = np.asarray(x, float); y = np.asarray(y, float)
    g = base(x, y)
    # weich zwischen Dünen und am Fuss gegen den Grund (Täler und Füsse rund). Ausgeblendete Kammteile liegen in _dense
    # tiefer als k unter dem Grund: Dort hebt das weiche Maximum nichts an (sonst helle Wälle quer durch die Mulde)
    z = g.copy()
    for c in DUNES:
        P, H = c['P'], c['H']
        reach = _reach(c)
        lo, hi = P.min(0) - reach, P.max(0) + reach
        ii = np.nonzero((x > lo[0]) & (x < hi[0]) & (y > lo[1]) & (y < hi[1]))[0]
        if len(ii):
            z[ii] = smax(_envelope(np.stack([x[ii], y[ii]], -1), c), z[ii], c['k'])
    # Oase: Boden flach (auch wo Hänge hineinreichen), in der Mitte der Teich
    w = 1 - smoothstep(OASIS_AREA * 0.6, OASIS_AREA, np.hypot(x - OASIS_XY[0], y - OASIS_XY[1]))
    if w.any():
        dip = -1.2 * (1 - smoothstep(0.85, 1.1, pond_shape(x, y)))
        z = z * (1 - w) + (g + dip) * w
    return z, g


DUNES = dunes()


# Geglättet: Die Zelte der Dünen stossen an Falten aneinander, ebene Facetten wie Fels. Gemalter Sand besteht aus
# glatten, runden Formen (Journey: die Grundform der Dünen ist ganz glatt, Licht und Farbe tun den Rest). Darum geht
# die fertige Höhe durch einen Gaussfilter, gerechnet auf Gittern um das Brett: nah fein, weiter weg gröber (dort
# sieht man nur grosse Formen). Je Stufe: halbe Breite, Zelle, Sigma (m), gültig bis USE (dann Übergang zur nächsten).
GRIDS = [(320.0, 0.8, 3.5), (1300.0, 3.2, 8.0), (5200.0, 13.0, 30.0), (30500.0, 76.0, 120.0)]
USE = [300.0, 1200.0, 5000.0]
_SMOOTH = {}


def _grid_key(level):
    """Fingerabdruck der Eingaben eines Gitters (Dünen, Grund, Gitter): Blender behält die Gitter zwischen zwei Läufen
    (bpy.app.driver_namespace), solange er gleich bleibt – das Rechnen dauert Minuten"""
    import hashlib, inspect
    h = hashlib.sha1(repr(GRIDS[level]).encode())
    for c in DUNES:
        h.update(c['P'].tobytes()); h.update(c['H'].tobytes()); h.update(repr((c['stoss'], c['lee'], c['k'])).encode())
    for fn in (base, mountains, height_raw, _envelope, _dense, _slope, sightlines, pond_shape):
        h.update(inspect.getsource(fn).encode())
    h.update(repr((ROUND, R_DUNE, OASIS, POND, OASIS_AREA, PYR_AZ, PYR_DIST, FLOOR, CLEAR)).encode())
    return 'desert_grid_%d_%s' % (level, h.hexdigest())


def _grid(level):
    """Gitter der Stufe level, geglättet (Gauss per FFT; der Rand wickelt herum, liegt aber über 3 Sigma hinter USE)"""
    if level not in _SMOOTH:
        key = _grid_key(level)
        if key in bpy.app.driver_namespace:
            _SMOOTH[level] = bpy.app.driver_namespace[key]
            return _SMOOTH[level]
        half, cell, sigma = GRIDS[level]
        n = int(round(2 * half / cell)) + 1
        xs = np.linspace(-half, half, n)
        X, Y = np.meshgrid(xs, xs)
        z, _ = height_raw(X.ravel(), Y.ravel())
        k = np.fft.fftfreq(n, d=xs[1] - xs[0])
        G = np.exp(-2.0 * (np.pi * sigma) ** 2 * (k[:, None] ** 2 + k[None, :] ** 2))
        _SMOOTH[level] = (xs, np.real(np.fft.ifft2(np.fft.fft2(z.reshape(n, n)) * G)), z.reshape(n, n))
        for old in [k for k in bpy.app.driver_namespace.keys() if k.startswith('desert_grid_%d_' % level)]:
            del bpy.app.driver_namespace[old]
        bpy.app.driver_namespace[key] = _SMOOTH[level]
        log('geglättet', level, n, 'je Seite')
    return _SMOOTH[level]


def _sample(level, x, y):
    xs, Z, _ = _grid(level)
    n, h = len(xs), xs[1] - xs[0]
    fx, fy = (x - xs[0]) / h, (y - xs[0]) / h
    ix = np.clip(np.floor(fx).astype(int), 0, n - 2); iy = np.clip(np.floor(fy).astype(int), 0, n - 2)
    tx, ty = np.clip(fx - ix, 0, 1), np.clip(fy - iy, 0, 1)
    return (Z[iy, ix] * (1 - tx) * (1 - ty) + Z[iy, ix + 1] * tx * (1 - ty)
            + Z[iy + 1, ix] * (1 - tx) * ty + Z[iy + 1, ix + 1] * tx * ty)


def height(x, y):
    """Höhe des Geländes (Blender z), geglättet, und der Grund ohne Dünen"""
    x = np.asarray(x, float); y = np.asarray(y, float)
    r = np.maximum(np.abs(x), np.abs(y))
    z = np.zeros_like(x); rest = np.ones_like(x)
    for level in range(len(GRIDS)):
        w = rest * (1 - smoothstep(0.9 * USE[level], USE[level], r)) if level < len(USE) else rest
        sel = w > 1e-6
        if sel.any():
            z[sel] += w[sel] * _sample(level, x[sel], y[sel])
        rest = rest - w
    return z, base(x, y)


def ring_grid(nseg, r0, r1, center=False):
    """Ringe um die Mitte (dichter nahe am Brett), mit center ein Fächer bis zur Mitte (kein Loch unter dem Brett)"""
    ratio = 1 + 2 * np.pi / nseg
    radii = r0 * ratio ** np.arange(int(np.log(r1 / r0) / np.log(ratio)) + 2)
    a = np.arange(nseg) * 2 * np.pi / nseg
    X = (radii[:, None] * np.cos(a)[None]).ravel(); Y = (radii[:, None] * np.sin(a)[None]).ravel()
    nr = len(radii)
    i = np.arange(nr - 1)[:, None]; j = np.arange(nseg)[None]; j1 = (j + 1) % nseg
    F = [np.stack(np.broadcast_arrays(i * nseg + j, i * nseg + j1, (i + 1) * nseg + j1, (i + 1) * nseg + j), -1).reshape(-1, 4)]
    if center:
        c = len(X)
        X = np.append(X, 0.0); Y = np.append(Y, 0.0)
        jj = np.arange(nseg)
        F.append(np.stack([np.full(nseg, c), (jj + 1) % nseg, jj], -1))
    return X, Y, F


def terrain(name, nseg, r0, r1, center=False):
    X, Y, F = ring_grid(nseg, r0, r1, center)
    z, g = height(X, Y)
    me = make_mesh(name, np.stack([X, Y, z], -1), F)
    rel = z - g
    S.attrs(me, dune=np.clip(rel / 6.0, 0, 1), flat=1 - smoothstep(0.3, 2.5, rel),
            berg=np.clip(mountains(X, Y) / 150.0, 0, 1), oase=1 - smoothstep(1.0, 2.6, pond_shape(X, Y)),
            plateau=1 - smoothstep(600.0, 900.0, np.hypot(X - _at(PYR_AZ, PYR_DIST)[0], Y - _at(PYR_AZ, PYR_DIST)[1])))
    log(name, len(X), 'Ecken')
    return me


# ---------------------------------------------------------------- Nahe Dünen (das Spiel zeichnet sie)

# Dünen nahe am Brett zeichnet das Spiel als 3D-Netz mit gebackenem Licht (bakedMesh, wie die Felsbrocken im Vulkan):
# Im Panorama läge ihr Kamm vor fernerem Gelände, und das Netz der Tiefe risse dort auf, sobald die Kamera neben dem
# Mittelpunkt steht. Sie liegen in der Sammlung „Spiel“ (das Panorama zeigt nur ihre Schatten, dahinter den Sand ohne
# sie). Ihr Netz endet vor NEAR_MAX: dahinter liegt im Spiel die Kugel des Panoramas (88 m, PANO.dMax).
NEAR_RING = (44.0, 56.0)    # Kämme der nahen Dünen (m vom Brett)
NEAR_MAX = 86.0             # bis hier reicht ihr Netz
NEAR_FADE = ((16.0, 26.0), (70.0, 84.0))   # unter dem Brett flach, zum Rand des Netzes hin wieder auf den Grund
NEAR_KEEP = ((OASIS[0], 24.0), (PYR_AZ, 24.0))   # Richtungen ± Grad, die frei bleiben: der Blick auf Oase, Pyramiden
NEAR_SHOW = 0.25            # das Spiel zeichnet sie, wo sie so viel (m) über dem Sand des Panoramas liegen …
NEAR_SOLID = 2.0            # … und läuft bis zu dieser Höhe (m) durchsichtig ins Panorama aus (bakedMesh fade)
NEAR_UP = 2.5               # Höhe (m), die rock8 = 255 entspricht. skybox.json: fade = [NEAR_SHOW, NEAR_SOLID] / NEAR_UP,
                            # ground = [NEAR_SINK, NEAR_UP]
NEAR_PANO_DROP = NEAR_SOLID # so viel tiefer liegt ihr Netz, wenn Blender das Panorama rendert: Der Sand darunter bleibt
                            # im Übergang unverschattet (dort scheint er im Spiel durch), ihr Schlagschatten bleibt
NEAR_SINK = NEAR_SHOW       # ihr Netz liegt so viel tiefer (m): Wo das Spiel es nicht zeigt, liegt es unter dem Sand des
                            # Panoramas. Knapp darüber wirkte es dort wie ein Dach und verschattete den Sand (roter Saum)


def near_dunes(seed=31, n=3):
    """Dünen rund um das Brett: Sicheln, 10–15 m hoch (nach dem Glätten und Ausblenden am Rand weniger), steiler als
    die fernen (sie bleiben im Netz)"""
    rng = np.random.default_rng(seed)
    out = []
    for _ in range(2000):
        if len(out) >= n:
            break
        az = rng.uniform(-180.0, 180.0)
        if any(abs((az - a + 180.0) % 360.0 - 180.0) < w for a, w in NEAR_KEEP):
            continue
        c = _at(az, rng.uniform(*NEAR_RING))
        if any(np.hypot(*(c - d['center'])) < 75.0 for d in out):   # Lücken: kein Ring ums Brett
            continue
        d = crescent(rng, c, rng.uniform(40.0, 65.0), rng.uniform(10.0, 15.0), rng.uniform(0.15, 0.4), stoss=0.4, lee=0.55)
        d['center'] = c
        d['near'] = True
        out.append(d)
    return out


NEAR = near_dunes()


def _near_fade(r):
    (a0, a1), (b0, b1) = NEAR_FADE
    return smoothstep(a0, a1, r) * (1 - smoothstep(b0, b1, r))


_NEAR_GRID = {}


def near_grid():
    """Gitter der Stufe 0 mit den nahen Dünen, geglättet wie das Gelände: (xs, Höhe mit ihnen, Höhe ohne sie)"""
    if not _NEAR_GRID:
        xs, Zs, Zraw = _grid(0)
        n = len(xs)
        X, Y = np.meshgrid(xs, xs)
        r = np.hypot(X, Y)
        inner = r < NEAR_MAX + 20.0
        z = Zraw.copy()
        pts = np.stack([X[inner], Y[inner]], -1)
        env = np.full(len(pts), -1e6)
        for c in NEAR:
            env = smax(_envelope(pts, c), env, c['k'])
        z[inner] = Zraw[inner] + _near_fade(r[inner]) * np.maximum(smax(env, Zraw[inner], 1.0) - Zraw[inner], 0.0)
        sigma = GRIDS[0][2]
        k = np.fft.fftfreq(n, d=xs[1] - xs[0])
        G = np.exp(-2.0 * (np.pi * sigma) ** 2 * (k[:, None] ** 2 + k[None, :] ** 2))
        _NEAR_GRID['z'] = (xs, np.real(np.fft.ifft2(np.fft.fft2(z) * G)), Zs)
        log('nahe Dünen', len(NEAR))
    return _NEAR_GRID['z']


def near_mesh():
    """Netz der nahen Dünen auf dem Gitter der Stufe 0 (Dreiecke), nur wo sie über dem Sand liegen: Ecken, Dreiecke,
    show (Höhe über dem Sand des Panoramas / NEAR_UP: das Spiel zeigt sie ab NEAR_SHOW, voll ab NEAR_SOLID), Höhe über dem
    Grund (für die Farbe wie im Gelände: dune, flat)"""
    xs, Zn, Zs = near_grid()
    n = len(xs)
    X, Y = np.meshgrid(xs, xs)
    up = Zn - Zs
    ok = (np.hypot(X, Y) < NEAR_MAX) & (up > 0.02)
    cell = ok[:-1, :-1] | ok[1:, :-1] | ok[:-1, 1:] | ok[1:, 1:]
    cell &= (np.hypot(X, Y) < NEAR_MAX)[:-1, :-1] & (np.hypot(X, Y) < NEAR_MAX)[1:, 1:]
    iy, ix = np.nonzero(cell)
    a = iy * n + ix
    quads = np.stack([a, a + 1, a + n + 1, a + n], -1)
    used, inv = np.unique(quads, return_inverse=True)
    F = inv.reshape(-1, 4)
    tris = np.concatenate([F[:, [0, 1, 2]], F[:, [0, 2, 3]]])
    # um NEAR_SINK tiefer: Ihr flacher Rand liegt so unter dem Sand des Panoramas (knapp darüber warf er feine
    # Schattenlinien ins Panorama); das Spiel zeigt sie erst ab NEAR_SHOW, dort liegen sie über ihm
    V = np.stack([X.ravel()[used], Y.ravel()[used], Zn.ravel()[used] - NEAR_SINK], -1)
    rel = V[:, 2] - base(V[:, 0], V[:, 1])
    return V, tris, np.clip(up.ravel()[used] / NEAR_UP, 0, 1), rel


def replace_near():
    _remove(['Duenen nah'])
    _NEAR_GRID.clear()
    build_near()


def build_near():
    V, F, show, rel = near_mesh()
    me = make_mesh('Duenen nah', V, F)
    # Farbe wie im Gelände (terrain): sonst färbte das Material ihren flachen Fuss wie Dünen, heller als den Sand daneben
    S.attrs(me, show=show, dune=np.clip(rel / 6.0, 0, 1), flat=1 - smoothstep(0.3, 2.5, rel))
    me.materials.append(bpy.data.materials.get('Sand') or mat_sand())
    ob = link('Duenen nah', me, S.collection('Spiel'))
    ob.location.z = -NEAR_PANO_DROP   # fürs Panorama; beim Backen an seinem Platz (bake_near), exportiert ohne Versatz
    log('Dünen nah', len(V), 'Ecken')


# ---------------------------------------------------------------- Material

RIPPLE = (35.0, 150.0)   # Windrippel: voll bis hier vom Brett (m), bis dahin auslaufend
AMBIENT = 0.11   # Grundlicht des Sands (Anteil der eigenen Farbe, wärmer): Schatten warm orangebraun, nie grau


def mat_sand():
    """Sand golden aus grossen, weichen Flächen, nur grossräumig etwas heller und dunkler; die Flächen zwischen den
    Dünen leicht ockerfarben, in der Ferne das Gebirge aus rotbraunem Fels. Windrippel nur nah am Brett (dort sieht man
    sie, weiter weg verschwinden sie im Sand wie auf Fotos), auf steilen Flanken schwächer"""
    m = bpy.data.materials.new('Sand'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bsdf = t.node('ShaderNodeBsdfPrincipled')
    def attr(name):
        nd = t.node('ShaderNodeAttribute'); nd.attribute_name = name
        return nd.outputs['Fac']
    geo = t.node('ShaderNodeNewGeometry')
    nrm = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], nrm.inputs[0])
    dune, flat, berg, oase, plateau = attr('dune'), attr('flat'), attr('berg'), attr('oase'), attr('plateau')
    n1 = t.node('ShaderNodeTexNoise', in_Scale=0.004, in_Detail=3.0); t.link(geo.outputs['Position'], n1.inputs['Vector'])
    n2 = t.node('ShaderNodeTexNoise', in_Scale=0.05, in_Detail=4.0); t.link(geo.outputs['Position'], n2.inputs['Vector'])
    sand = t.mix(t.maprange(n1.outputs['Fac'], 0.35, 0.65), (0.78, 0.42, 0.15, 1), (0.84, 0.50, 0.19, 1))
    sand = t.mix(t.math('MULTIPLY', t.maprange(n2.outputs['Fac'], 0.4, 0.6), 0.25), sand, (0.74, 0.38, 0.14, 1))
    pan = t.mix(t.maprange(n2.outputs['Fac'], 0.3, 0.7), (0.62, 0.34, 0.15, 1), (0.70, 0.41, 0.18, 1))
    col = t.mix(t.math('MULTIPLY', flat, t.math('SUBTRACT', 1.0, dune)), sand, pan)
    up = t.maprange(nrm.outputs['Z'], 0.55, 0.9)
    rock = t.mix(up, (0.30, 0.13, 0.08, 1), (0.52, 0.30, 0.17, 1))
    col = t.mix(berg, col, rock)
    # Plateau von Giza: heller Kalksteinschotter
    col = t.mix(t.math('MULTIPLY', plateau, 0.7), col, t.mix(t.maprange(n2.outputs['Fac'], 0.3, 0.7), (0.62, 0.48, 0.32, 1), (0.72, 0.58, 0.40, 1)))
    # Oase: zum Wasser hin feuchter, dunkler Sand, dazwischen Flecken von Gras
    col = t.mix(oase, col, (0.36, 0.22, 0.11, 1))
    gn = t.node('ShaderNodeTexNoise', in_Scale=0.25, in_Detail=3.0); t.link(geo.outputs['Position'], gn.inputs['Vector'])
    col = t.mix(t.math('MULTIPLY', oase, t.maprange(gn.outputs['Fac'], 0.45, 0.6)), col, (0.10, 0.15, 0.05, 1))
    t.link(col, bsdf.inputs['Base Color'])
    t.link(t.vmath('MULTIPLY', col, (1.0, 0.72, 0.52)), bsdf.inputs['Emission Color'])   # warm: Licht vom Sand ringsum
    bsdf.inputs['Emission Strength'].default_value = AMBIENT
    bsdf.inputs['Roughness'].default_value = 0.95
    # Windrippel quer zum Wind (Mapping dreht die Bänder), verzogen; voll bis RIPPLE[0] vom Brett, bis RIPPLE[1] auslaufend
    mp = t.node('ShaderNodeMapping'); mp.inputs['Rotation'].default_value = (0, 0, -math.radians(WIND_DEG))
    t.link(geo.outputs['Position'], mp.inputs['Vector'])
    rp = t.node('ShaderNodeTexWave', in_Scale=0.75, in_Distortion=4.0, in_Detail=2.0, in_Detail__Scale=1.5)
    rp.bands_direction = 'X'
    t.link(mp.outputs['Vector'], rp.inputs['Vector'])
    dist = t.vmath('LENGTH', t.vmath('MULTIPLY', geo.outputs['Position'], (1, 1, 0)))
    near = t.maprange(dist, RIPPLE[1], RIPPLE[0])
    gentle = t.math('ADD', 0.35, t.math('MULTIPLY', t.maprange(nrm.outputs['Z'], 0.85, 0.97), 0.65))
    sb = t.node('ShaderNodeBump', in_Distance=0.03)
    t.link(rp.outputs['Fac'], sb.inputs['Height'])
    t.link(t.math('MULTIPLY', t.math('MULTIPLY', near, gentle), 0.6), sb.inputs['Strength'])
    t.link(sb.outputs['Normal'], bsdf.inputs['Normal'])
    t.link(S.air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


def build_ground():
    mat = bpy.data.materials.get('Sand') or mat_sand()
    for name, args in (('Gelaende nah', (SEG_NEAR, 0.6, R_SPLIT, True)),
                       ('Gelaende fern', (SEG_FAR, 0.995 * R_SPLIT, EXTENT))):
        me = terrain(name, *args)
        me.materials.append(mat)
        link(name, me)


# ---------------------------------------------------------------- Oase und Pyramiden

# Oase: ein Teich (Rand unregelmässig) mit Dattelpalmen, Büschen und Gras ringsum, der Boden dort feucht und dunkler
OASIS_PLANTS = {'palm': (15, (8.0, 13.0)), 'bush': (12, (1.6, 3.2)), 'grass': (40, (0.6, 1.2))}   # Anzahl, Höhen (m)
PALM_COLORS = [((0.12, 0.09, 0.06), (0.26, 0.20, 0.14)), ((0.04, 0.08, 0.025), (0.15, 0.21, 0.07)),
               ((0.20, 0.13, 0.06), (0.34, 0.24, 0.11)), ((0.16, 0.08, 0.03), (0.32, 0.17, 0.06))]   # Datteln


def pond_shape(x, y):
    """Abstand zur Mitte des Teichs im Verhältnis zu seinem Rand in dieser Richtung (1 = Ufer)"""
    dx, dy = x - OASIS_XY[0], y - OASIS_XY[1]
    a = np.arctan2(dy, dx)
    rim = POND * (1 + 0.12 * np.sin(2 * a + 1.0) + 0.05 * np.sin(5 * a + 2.0))
    return np.hypot(dx, dy) / rim


def water_level():
    return float(base(np.array([OASIS_XY[0]]), np.array([OASIS_XY[1]]))[0]) - 0.15   # fast randvoll: vom Brett aus sichtbar


def mat_water():
    """Teich: dunkles, klares Wasser, das den Himmel und die Palmen spiegelt"""
    m = bpy.data.materials.new('Teich'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bsdf = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.06)
    bsdf.inputs['Base Color'].default_value = (0.01, 0.06, 0.06, 1)
    bsdf.inputs['IOR'].default_value = 1.33
    geo = t.node('ShaderNodeNewGeometry')
    n = t.node('ShaderNodeTexNoise', in_Scale=0.6, in_Detail=3.0); t.link(geo.outputs['Position'], n.inputs['Vector'])
    bump = t.node('ShaderNodeBump', in_Strength=0.08, in_Distance=0.05)
    t.link(n.outputs['Fac'], bump.inputs['Height']); t.link(bump.outputs['Normal'], bsdf.inputs['Normal'])
    t.link(S.air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


def _plant_mats(prefix, colors):
    """Materialien je Teil eines Modells aus pflanzen.py: 0 Stamm, 1 Laub, 2 dürres Laub, 3 Frucht"""
    return [bpy.data.materials.get('%s %d' % (prefix, i)) or
            S.mat_plant('%s %d' % (prefix, i), dark, light, translucent=0.3 if i in (1, 2) else 0.0, rings=prefix == 'Palme' and i == 0)
            for i, (dark, light) in enumerate(colors)]


def build_oasis(seed=41):
    """Teich, Dattelpalmen, Büsche und Gras der Oase"""
    P = S._pflanzen()
    rng = np.random.default_rng(seed)
    ox, oy = OASIS_XY
    level = water_level()
    a = np.linspace(0, 2 * math.pi, 96, endpoint=False)
    X = ox + 1.35 * POND * np.cos(a); Y = oy + 1.35 * POND * np.sin(a)
    V = np.concatenate([np.c_[X, Y, np.full_like(X, level)], [[ox, oy, level]]])
    F = [[96, (k + 1) % 96, k] for k in range(96)]
    me = S.mesh('Teich', V, F, mats=[mat_water()], smooth=False)
    link('Teich', me)
    groups = {}
    for kind, (count, (h0, h1)) in OASIS_PLANTS.items():
        placed = 0
        for _ in range(4000):
            if placed >= count:
                break
            r = rng.uniform(0.95, {'palm': 2.3, 'bush': 2.6, 'grass': 1.6}[kind]) * POND
            ang = rng.uniform(0, 2 * math.pi)
            x, y = ox + r * math.cos(ang), oy + r * math.sin(ang)
            if pond_shape(np.array([x]), np.array([y]))[0] < 1.08:
                continue
            z = float(height(np.array([x]), np.array([y]))[0][0])
            h = rng.uniform(h0, h1)
            model = {'palm': lambda: P.palm(int(rng.integers(0, 10 ** 6)), 1.0),
                     'bush': lambda: P.shrub(int(rng.integers(0, 10 ** 6)), 1.0),
                     'grass': lambda: P.grass(int(rng.integers(0, 10 ** 6)), 1.0)}[kind]()
            w = h * rng.uniform(0.75, 0.95) if kind == 'palm' else h * rng.uniform(1.2, 1.6)
            rot = rng.uniform(0, 2 * math.pi); ca, sa = math.cos(rot), math.sin(rot)
            Vm = np.asarray(model['V'], float) * np.array([w, w, h])
            Vm = Vm @ np.array([[ca, -sa, 0], [sa, ca, 0], [0, 0, 1]]).T + np.array([x, y, z - 0.15])
            groups.setdefault(kind, []).append((Vm, model['F'], model['M'], model['T']))
            placed += 1
    colors = {'palm': ('Palme', PALM_COLORS), 'bush': ('Oasenbusch', S.PLANT_COLORS['bush']),
              'grass': ('Oasengras', S.PLANT_COLORS['grass'])}
    for kind, items in groups.items():
        V, F, M, T, off = [], [], [], [], 0
        for v, f, m, tone in items:
            V.append(v); F.extend([[i + off for i in face] for face in f]); M.extend(m); T.extend(tone); off += len(v)
        prefix, cols = colors[kind]
        me = S.mesh('Oase ' + prefix, np.concatenate(V), F, M, mats=_plant_mats(prefix, cols))
        S.attrs(me, tone=T)
        link('Oase ' + prefix, me)
    log('Oase', {k: len(v) for k, v in groups.items()}, 'Wasser auf', round(level, 2))


# Die Pyramiden von Giza auf ihrem Plateau, rechts der grossen Düne: (Name, quer zur Blickrichtung nach rechts,
# entlang weg vom Brett (m), Seitenlänge, Höhe, Verkleidung an der Spitze)
GIZA = [('Cheops', 250.0, -220.0, 230.0, 146.0, False), ('Chephren', 0.0, 0.0, 215.0, 143.0, True),
        ('Mykerinos', -210.0, 330.0, 103.0, 65.0, False)]   # rund ±9° um die Mitte, innerhalb PYR_HALF
PYR_SINK = 1.5     # so tief (m) unter dem tiefsten Punkt ihrer Grundfläche beginnt jede Pyramide: sie steht im Sand
GIZA_TURN = 28.0   # Grundrisse gegen die Blickrichtung gedreht (Grad): zwei Seiten sichtbar, eine im Licht


def mat_stone(name, dark, light):
    """Kalkstein der Pyramiden: etwas fleckig, matt"""
    m = bpy.data.materials.new(name); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bsdf = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.9)
    geo = t.node('ShaderNodeNewGeometry')
    n = t.node('ShaderNodeTexNoise', in_Scale=0.03, in_Detail=4.0); t.link(geo.outputs['Position'], n.inputs['Vector'])
    col = t.mix(t.maprange(n.outputs['Fac'], 0.35, 0.65), (*dark, 1), (*light, 1))
    t.link(col, bsdf.inputs['Base Color'])
    t.link(t.vmath('MULTIPLY', col, (1.0, 0.75, 0.55)), bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = AMBIENT
    t.link(S.air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


def build_pyramids():
    C = _at(PYR_AZ, PYR_DIST)
    f = C / np.linalg.norm(C); right = np.array([f[1], -f[0]])
    turn = math.atan2(f[1], f[0]) + math.radians(GIZA_TURN)
    stone = mat_stone('Kalkstein', (0.40, 0.26, 0.13), (0.54, 0.37, 0.19))    # dunkler als der Sand: hebt sich im Dunst ab
    casing = mat_stone('Verkleidung', (0.68, 0.56, 0.40), (0.78, 0.66, 0.48))
    V, F, M = [], [], []
    for name, across, along, side, h, cap in GIZA:
        p = C + right * across + f * along
        half = side / 2
        corners = [(p[0] + half * math.cos(turn + k * math.pi / 2) * math.sqrt(2),
                    p[1] + half * math.sin(turn + k * math.pi / 2) * math.sqrt(2)) for k in range(4)]
        # Fuss am tiefsten Punkt der Grundfläche (Gitter über das ganze Quadrat): Nach der Höhe der Mitte schwebten die
        # Kanten, wo der Boden zum Rand hin abfällt
        u, v = np.meshgrid(np.linspace(-1, 1, 25), np.linspace(-1, 1, 25))
        e1 = np.array([math.cos(turn + math.pi / 4), math.sin(turn + math.pi / 4)]) * half
        e2 = np.array([-e1[1], e1[0]])
        gx = p[0] + u.ravel() * e1[0] + v.ravel() * e2[0]; gy = p[1] + u.ravel() * e1[1] + v.ravel() * e2[1]
        z0 = float(height(gx, gy)[0].min()) - PYR_SINK
        def ring(frac):   # Querschnitt auf frac der Höhe
            return [(p[0] + (cx - p[0]) * (1 - frac), p[1] + (cy - p[1]) * (1 - frac), z0 + h * frac) for cx, cy in corners]
        top = 0.78 if cap else 1.0
        o = len(V)
        V += ring(0.0) + (ring(top) if cap else []) + [(p[0], p[1], z0 + h)]
        apex = len(V) - 1
        if cap:   # unten Kalkstein bis top, darüber die helle Verkleidung
            for k in range(4):
                F.append([o + k, o + (k + 1) % 4, o + 4 + (k + 1) % 4, o + 4 + k]); M.append(0)
                F.append([o + 4 + k, o + 4 + (k + 1) % 4, apex]); M.append(1)
        else:
            for k in range(4):
                F.append([o + k, o + (k + 1) % 4, apex]); M.append(0)
    me = S.mesh('Pyramiden', np.array(V), F, M, mats=[stone, casing], smooth=False)
    link('Pyramiden', me)
    log('Pyramiden', len(GIZA), 'bei', np.round(C).tolist())


def mat_plant(name, dark, light):
    """Pflanze: Farbe nach Höhe im Objekt etwas heller, mit Grundlicht (bläulich), Luftperspektive"""
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bsdf = t.node('ShaderNodeBsdfPrincipled')
    n = t.node('ShaderNodeTexNoise', in_Scale=1.5, in_Detail=3.0)
    geo = t.node('ShaderNodeNewGeometry'); t.link(geo.outputs['Position'], n.inputs['Vector'])
    col = t.mix(t.maprange(n.outputs['Fac'], 0.35, 0.65), dark + (1,), light + (1,))
    t.link(col, bsdf.inputs['Base Color'])
    t.link(t.vmath('MULTIPLY', col, (0.6, 0.7, 1.0)), bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = 0.15
    bsdf.inputs['Roughness'].default_value = 0.7
    t.link(S.air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


# ---------------------------------------------------------------- Himmel, Licht, Luft

SKY_GAIN = 0.12          # Himmel gegenüber der Sonnenlampe, wie ihn Kamera und Spiegelungen sehen
SKY_LIGHT = 0.12         # ... als Licht (die Sonne steht hoch: der Himmel ist hell, sonst überstrahlt er die Sonne)
SUN_STRENGTH = 3.4
SUN_COLOR = (1.0, 0.82, 0.60)
AIR_DIST = 8000.0        # Luftperspektive: Staub in der Wüstenluft
AIR_HEIGHT = 900.0


def sky_group():
    """Himmelsfarbe in eine Richtung (Gain: Anteil gegenüber der Sonnenlampe): physikalischer Himmel mit der
    Nachmittagssonne, gemalt: oben ein klares, helles Blau, zum Horizont hin staubig cremefarben, zur Sonne hin warm;
    dazu Federwolken (Zirren) in Streifen quer über den Himmel"""
    ng, t, gi, go = S._group('Himmelsfarbe', [('Richtung', 'NodeSocketVector'), ('Gain', 'NodeSocketFloat')],
                             [('Farbe', 'NodeSocketColor')])
    rs = t.node('ShaderNodeSeparateXYZ'); t.link(gi.outputs['Richtung'], rs.inputs[0])
    rc = t.node('ShaderNodeCombineXYZ')
    t.link(rs.outputs['X'], rc.inputs['X']); t.link(rs.outputs['Y'], rc.inputs['Y'])
    t.link(t.math('MAXIMUM', rs.outputs['Z'], 0.002), rc.inputs['Z'])
    d = t.vmath('NORMALIZE', rc.outputs[0])
    sky = t.node('ShaderNodeTexSky')
    sky.sky_type = 'MULTIPLE_SCATTERING'
    sky.sun_disc = False
    sky.sun_elevation = math.asin(SUN.z)
    sky.sun_rotation = math.atan2(SUN.x, SUN.y)
    sky.altitude = 200.0
    sky.air_density = 1.0
    sky.aerosol_density = 1.2
    t.link(d, sky.inputs['Vector'])
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(d, sep.inputs[0])
    z = sep.outputs['Z']
    dh = t.vmath('NORMALIZE', t.vmath('MULTIPLY', d, (1, 1, 0)))
    sh = Vector((SUN.x, SUN.y, 0)).normalized()
    toward = t.math('POWER', t.math('ADD', 0.5, t.math('MULTIPLY', t.vmath('DOT_PRODUCT', dh, (sh.x, sh.y, 0)), 0.5)), 3.0)
    top = t.mix(t.maprange(z, 0.1, 0.9), (1.0, 0.97, 0.95, 1), (0.82, 0.92, 1.0, 1))
    band = t.mix(toward, (1.0, 0.86, 0.72, 1), (1.0, 0.78, 0.55, 1))
    warm = t.mix(t.maprange(z, 0.22, 0.0), top, band)
    ang = t.math('ARCCOSINE', t.math('MINIMUM', t.vmath('DOT_PRODUCT', d, tuple(SUN)), 1.0))
    halo = t.math('ADD', t.math('MULTIPLY', t.math('EXPONENT', t.math('DIVIDE', ang, -0.05)), 1.2),
                  t.math('MULTIPLY', t.math('EXPONENT', t.math('DIVIDE', ang, -0.25)), 0.25))
    hv = t.node('ShaderNodeCombineXYZ')
    for k in range(3):
        t.link(halo, hv.inputs[k])
    glow = t.vmath('ADD', (1, 1, 1), t.vmath('MULTIPLY', (1.0, 0.88, 0.70), hv.outputs[0]))
    col = t.vmath('MULTIPLY', t.vmath('MULTIPLY', sky.outputs['Color'], warm), glow)
    # Zirren: eine Wolkenschicht in 8 km Höhe, Rauschen entlang einer Richtung gestreckt
    inv = t.math('DIVIDE', 8.0, t.math('MAXIMUM', z, 0.02))
    sc_ = t.node('ShaderNodeVectorMath'); sc_.operation = 'SCALE'
    t.link(t.vmath('MULTIPLY', d, (1, 1, 0)), sc_.inputs[0]); t.link(inv, sc_.inputs['Scale'])
    mp = t.node('ShaderNodeMapping'); mp.inputs['Rotation'].default_value = (0, 0, math.radians(35))
    mp.inputs['Scale'].default_value = (0.08, 0.5, 1.0)
    t.link(sc_.outputs['Vector'], mp.inputs['Vector'])
    cn = t.node('ShaderNodeTexNoise', in_Scale=1.0, in_Detail=6.0, in_Roughness=0.6)
    t.link(mp.outputs['Vector'], cn.inputs['Vector'])
    cover = t.math('MULTIPLY', t.maprange(cn.outputs['Fac'], 0.52, 0.72),
                   t.math('MULTIPLY', t.maprange(z, 0.03, 0.15), t.maprange(z, 0.85, 0.5)))
    cloud = t.vmath('MULTIPLY', (1.0, 0.95, 0.88), t.math('ADD', 0.4, t.math('MULTIPLY', halo, 0.3)))
    col = t.mix(t.math('MULTIPLY', cover, 0.55), col, t.vmath('MAXIMUM', col, cloud))
    out_ = t.node('ShaderNodeVectorMath'); out_.operation = 'SCALE'
    t.link(col, out_.inputs[0]); t.link(gi.outputs['Gain'], out_.inputs['Scale'])
    t.link(out_.outputs['Vector'], go.inputs['Farbe'])
    return ng


def world():
    w = bpy.data.worlds.new('Nachmittag'); sc().world = w; w.use_nodes = True
    sky_group()
    S.WATER, S.AIR_DIST, S.AIR_HEIGHT, S.SKY_GAIN = FLOOR, AIR_DIST, AIR_HEIGHT, SKY_GAIN
    S.air_group()
    t = NT(w.node_tree)
    out = t.node('ShaderNodeOutputWorld')
    bg = t.node('ShaderNodeBackground', in_Strength=1.0)
    t.link(bg.outputs[0], out.inputs[0])
    tc = t.node('ShaderNodeTexCoord')
    d = t.vmath('NORMALIZE', tc.outputs['Generated'])
    lp = t.node('ShaderNodeLightPath')
    seen = t.math('MAXIMUM', lp.outputs['Is Camera Ray'], lp.outputs['Is Glossy Ray'])
    gain = t.math('ADD', SKY_LIGHT, t.math('MULTIPLY', seen, SKY_GAIN - SKY_LIGHT))
    g = t.node('ShaderNodeGroup'); g.node_tree = bpy.data.node_groups['Himmelsfarbe']
    t.link(d, g.inputs['Richtung']); t.link(gain, g.inputs['Gain'])
    r = t.math('ARCCOSINE', t.math('MINIMUM', t.vmath('DOT_PRODUCT', d, tuple(SUN)), 1.0))
    R = 0.0095
    disk = t.math('MULTIPLY', t.maprange(r, R * 1.08, R * 0.92), lp.outputs['Is Camera Ray'])
    sun = t.node('ShaderNodeVectorMath'); sun.operation = 'SCALE'
    sun.inputs[0].default_value = (40.0, 34.0, 26.0)
    t.link(disk, sun.inputs['Scale'])
    t.link(t.vmath('ADD', g.outputs['Farbe'], sun.outputs['Vector']), bg.inputs['Color'])
    return w


def sun_lamp():
    ld = bpy.data.lights.new('Sonne', 'SUN')
    ld.energy = SUN_STRENGTH
    ld.color = SUN_COLOR
    ld.angle = math.radians(4.0)   # weiche Schattenkanten: Sand im Dunst, keine harten Linien
    ob = link('Sonne', ld)
    ob.rotation_euler = SUN.to_track_quat('Z', 'Y').to_euler()
    ob['hauptlicht'] = True
    return ob


def cameras():
    cd = bpy.data.cameras.new('Panorama'); cd.type = 'PANO'; cd.panorama_type = 'EQUIRECTANGULAR'
    cd.clip_start = 0.05; cd.clip_end = 60000
    pano = link('Panorama', cd); pano.location = PANO_CENTER; pano.rotation_euler = (math.pi / 2, 0, 0)
    gd = bpy.data.cameras.new('Spielkamera'); gd.sensor_fit = 'VERTICAL'; gd.angle_y = math.radians(32)
    gd.clip_start = 0.05; gd.clip_end = 60000
    link('Spielkamera', gd)
    sc().camera = pano


# ---------------------------------------------------------------- Aufbau und Ersetzen

def build():
    """Ganze Szene in die (leere) aktuelle Datei bauen"""
    sc().render.engine = 'CYCLES'
    world()
    build_ground()
    build_near()
    build_oasis()
    build_pyramids()
    sun_lamp()
    cameras()


def _remove(names):
    for n in names:
        ob = bpy.data.objects.get(n)
        if ob:
            bpy.data.objects.remove(ob)


def replace_ground():
    global DUNES
    DUNES = dunes()
    _SMOOTH.clear()
    _NEAR_GRID.clear()
    _remove(['Gelaende nah', 'Gelaende fern', 'Duenen nah'])
    m = bpy.data.materials.get('Sand')
    if m:
        bpy.data.materials.remove(m)
    build_ground()
    build_near()
    bpy.data.orphans_purge(do_recursive=True)


def replace_flora():
    _remove(['Buesche', 'Teich', 'Oase Palme', 'Oase Oasenbusch', 'Oase Oasengras', 'Pyramiden'])
    build_oasis()
    build_pyramids()
    bpy.data.orphans_purge(do_recursive=True)


def replace_materials():
    """Sand neu (Farben geändert), ohne das Gelände neu zu rechnen"""
    for name in ('Sand',):
        old = bpy.data.materials.get(name)
        if old:
            old.name = name + ' alt'
    new = {'Sand': mat_sand()}
    for ob in bpy.data.objects:
        if ob.type == 'MESH':
            for i, m in enumerate(ob.data.materials):
                if m and m.name.endswith(' alt'):
                    ob.data.materials[i] = new[m.name[:-4]]
    for name in ('Sand',):
        old = bpy.data.materials.get(name + ' alt')
        if old:
            bpy.data.materials.remove(old)


def replace_world():
    old = sc().world
    world()
    if old:
        bpy.data.worlds.remove(old)
    _remove(['Sonne'])
    sun_lamp()


# ---------------------------------------------------------------- Export fürs Spiel

BAKE_DROP = 0.6   # so viel tiefer liegt das Gelände beim Backen der nahen Dünen (m)
NEAR_TEX = 1536   # Bild der nahen Dünen (gebackenes Licht), Seitenlänge auf dem Desktop; das Handy die halbe (2048 sprengte
                  # mit den Streifen das Budget von 300 MB Grafikspeicher)


def unwrap(ob):
    """Fürs Backen und fürs Spiel: eine UV-Karte"""
    with S.only(ob):
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.004, area_weight=0.0, scale_to_bounds=True)
        bpy.ops.object.mode_set(mode='OBJECT')


def bake_near(stil='desert', samples=512):
    """Licht der nahen Dünen backen wie die Felsbrocken im Vulkan (bake_rim_rocks): Cycles COMBINED mit den
    Einstellungen des Panoramas, dazu Grundfarbe und Normale, entrauscht (anime.denoise). Das Gelände liegt dabei
    BAKE_DROP tiefer: Am flachen Fuss liegen die Dünen nur Zentimeter darüber (oder darunter), es verdeckte dort Sonne
    und Himmel – ein dunkler Rand um jede Düne"""
    import importlib
    os.environ['WALD_STIL'] = stil
    import wald_export, anime
    wx = importlib.reload(wald_export)
    anime = importlib.reload(anime)
    ob = bpy.data.objects['Duenen nah']
    if not ob.data.uv_layers:
        unwrap(ob)
    imgs = {}
    for key in ('licht', 'farbe', 'normale'):
        name = 'Duenen ' + key
        if bpy.data.images.get(name):
            bpy.data.images.remove(bpy.data.images[name])
        imgs[key] = bpy.data.images.new(name, NEAR_TEX, NEAR_TEX, float_buffer=True)
    mat = ob.data.materials[0]
    node = mat.node_tree.nodes.new('ShaderNodeTexImage')
    mat.node_tree.nodes.active = node
    scene = sc()
    bk = scene.render.bake
    wx.setup_cycles()
    wx.setv(bk, 'target', 'IMAGE_TEXTURES')
    wx.setv(bk, 'margin', 8)
    wx.setv(bk, 'view_from', 'ACTIVE_CAMERA')
    for attr in ('use_pass_direct', 'use_pass_indirect', 'use_pass_color', 'normal_space'):
        wx.setv(bk, attr, getattr(bk, attr))
    ground = [bpy.data.objects[n] for n in ('Gelaende nah', 'Gelaende fern') if n in bpy.data.objects]
    for g in ground:
        g.location.z -= BAKE_DROP
    ob.location.z = 0.0   # an seinem Platz (fürs Panorama liegt es NEAR_PANO_DROP tiefer)
    try:
        for key, kind, spp in (('licht', 'COMBINED', samples), ('farbe', 'DIFFUSE', 16), ('normale', 'NORMAL', 4)):
            node.image = imgs[key]
            scene.cycles.samples = spp
            if kind == 'DIFFUSE':
                bk.use_pass_direct = bk.use_pass_indirect = False
                bk.use_pass_color = True
            bk.normal_space = 'OBJECT'
            with S.only(ob):
                bpy.ops.object.bake(type=kind)
    finally:
        for g in ground:
            g.location.z += BAKE_DROP
        ob.location.z = -NEAR_PANO_DROP
        wx.restore()
        mat.node_tree.nodes.remove(node)
    px = {k: np.array(im.pixels[:], np.float64).reshape(NEAR_TEX, NEAR_TEX, 4)[::-1, :, :3] for k, im in imgs.items()}
    clean = anime.denoise(px['licht'], px['farbe'], px['normale'] * 2 - 1)
    for im in imgs.values():
        bpy.data.images.remove(im)
    return clean


def near_model(sky, lin, stil='desert'):
    """Nahe Dünen fürs Spiel (bakedMesh, wie die Felsbrocken im Vulkan rock_model): Ecken in Spielkoordinaten (Int16,
    1/256 m), UV (Uint16), Dreiecke, rock8 = Höhe über dem Sand des Panoramas (Attribut show); das gebackene Licht
    gemalt wie das Panorama als sky/<stil>/dunes_hd.jpg und halb so gross dunes.jpg"""
    import base64, importlib
    from wald_io import save_image
    os.environ['WALD_STIL'] = stil
    import anime
    anime = importlib.reload(anime)
    painted = anime.paint_texture(lin)
    save_image(painted, os.path.join(sky, 'dunes_hd.jpg'), 'JPEG', 86)
    h, w = painted.shape[:2]
    save_image(painted.reshape(h // 2, 2, w // 2, 2, 3).mean((1, 3)), os.path.join(sky, 'dunes.jpg'), 'JPEG', 86)
    me = bpy.data.objects['Duenen nah'].data
    me.calc_loop_triangles()
    loops = np.empty(len(me.loop_triangles) * 3, np.int64); me.loop_triangles.foreach_get('loops', loops)
    vi = np.empty(len(me.loops), np.int64); me.loops.foreach_get('vertex_index', vi)
    uv = np.empty(len(me.loops) * 2); me.uv_layers.active.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
    co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    show = np.empty(len(me.vertices)); me.attributes['show'].data.foreach_get('value', show)
    quv = np.clip(np.round(uv * 65535), 0, 65535).astype(np.int64)
    key = (vi * 65536 + quv[:, 0]) * 65536 + quv[:, 1]
    uniq, first, inv = np.unique(key, return_index=True, return_inverse=True)
    tri = inv[loops]
    pos = co[vi[first]]
    game = np.c_[pos[:, 0], pos[:, 2], -pos[:, 1]]                  # Blender -> Spiel
    n = len(uniq)
    b = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
    idx = {'idx16': b(tri.astype('<u2'))} if n <= 65536 else {'idx32': b(tri.astype('<u4'))}
    return {'n': n, 'scale': 256, 'pos16': b(np.clip(np.round(game * 256), -32767, 32767).astype('<i2')), **idx,
            'uv16': b(quv[first].astype('<u2')), 'rock8': b(np.round(show[vi[first]] * 255).astype('u1')),
            'texture': 'file:dunes.jpg'}


def export(stil='desert'):
    """sky/<stil>/ebenen.json für pack.mjs: die nahen Dünen (bakedMesh, Bild dunes.jpg, im HD-Teil dunes_hd.jpg)"""
    import json
    sky = os.path.join(ROOT, 'sky', stil)
    os.makedirs(sky, exist_ok=True)
    dunes = near_model(sky, bake_near(stil), stil)
    data = {'dunes': dunes, 'hd': {'dunes': {'texture': 'file:dunes_hd.jpg'}}}
    with open(os.path.join(sky, 'ebenen.json'), 'w', encoding='utf-8') as fh:
        json.dump(data, fh, separators=(',', ':'))
    return {'duenen_ecken': dunes['n']}
