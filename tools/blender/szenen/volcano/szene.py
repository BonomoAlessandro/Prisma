# Baut die Blender-Szene „Im Vulkan“ (Skybox volcano, PLAN 1.2), realistisch gerendert und danach gemalt wie der
# Strand. Über den Blender-MCP: wald_mcp.neu('volcano') baut sie und speichert tools/blender/volcano.blend; einzelne
# Teile neu mit wald_mcp.scene('volcano').replace_…(). Ohne MCP headless mit denselben Skripten (wald_mcp.run).
# Vorbilder: Nyiragongo (Lavasee aus dunkler Kruste mit glühenden Rissen) und der Gaskrater Darvaza («Door to Hell»,
# Wunsch vom 11.11.2026, Variante «Sandtrichter»): ein eingesunkener Trichter aus Sand und Lehm, oben eine kurze,
# bröckelnde Abbruchkante mit hellen Lagen, auf der Böschung überall Feuernester aus kleinen Gasflammen; Nacht, die
# Glut leuchtet von unten. Gemalt wie eine Anime-Landschaft: grosse, klar begrenzte Flächen, fast schwarze Schatten
# gegen warmes Glutlicht.
# Aufbau: Das Brett schwebt über dem Lavasee (LAVA_Z) eines weiten Kraters (FOOT). Vom Ufer steigt eine Böschung aus
# Sand bis unter den Rand (SLOPE: unten flacher, oben steiler); darauf Rutschungen (SLUMPS: Abrisskante, Mulde, Wulst),
# Rinnen (RILLS) mit kleinen Schuttfächern, Rieselstreifen, abgestürzte Lehmbrocken (S.boulder wie am Strand) und
# Feuernester (NESTS: Flammen, Russ auf dem Sand, je eine Lampe). Oben die Abbruchkante (SCARP), fast senkrecht, mit
# Lagen in eigener Farbe und leichtem Überhang bis zum Rand (RIM); dahinter flache Wüste mit dunklen Sträuchern an der
# Kante. Durch die Öffnung ein fast schwarzer Nachthimmel (die Sterne zeichnet das Spiel); im Krater nur leichter
# Dunst (Luftperspektive). Licht: die Lava von unten (Risse leuchten, ein Ring Punktlampen „Glut Ufer“ knapp vor dem
# Ufer, schwach die Flächenlampe „Glut See“) und die Feuernester; der Mond (Lampe „Oben“, im Spiel die Richtung des
# Hauptlichts) gibt nur einen Hauch Kühle.
# Das Spiel zeichnet selbst: den See bis LAVA_GAME, bewegt (lavaPool; Blender malt dort nur die Kruste), und ein
# Dutzend Felsbrocken im See vor dem Ufer (bakedMesh, wie die nahen Felsen am Strand: gebackenes Licht, gemalt;
# Sammlung „Spiel“, für die Panoramakamera unsichtbar).
# Koordinaten: Blender (x, y, z) = Spiel (x, −z, y). Brett im Ursprung, Panorama-Mittelpunkt (0, 0, 3).
import bpy, math, os, sys, time, importlib.util
import numpy as np
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
from wald_lib import Perlin, fbm, smoothstep
from wald_scene import make_mesh, NT


def _strand():
    """Baumodul der Strand-Szene (ohne Aufbau): Ringgitter, Ikosphäre, Sammlungen, Knotengruppen, Luft"""
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
LAVA_Z = -9.0         # Lavasee (Spiel: level der Ebenen)
# Die Kamera bleibt immer über der Böschung: ganz herausgezoomt und flach geneigt steht sie bis 48 m von der Mitte
# (Handy hochkant, 2D; Würfel 7 auf Desktop und Tablet bis 45 m, auf dem Handy hochkant bis 64 m), dort 17 … 26 m über
# der Lava; die flache Böschung ist bei 48 m erst gut 4 m, bei 64 m gut 9 m hoch.
FOOT = 38.0           # mittlerer Radius, an dem die Böschung in den See taucht
LAVA_GAME = 29.0      # bis hier zeichnet das Spiel den See (radius von lavaPool), voll deckend bis LAVA_GAME − 2.5
# Rand über der Lava (Bezug; je Richtung um 11 … 23 m, eine Seite höher), vom Brett aus knapp über dem Horizont;
# dahinter flache Wüste
RIM = 17.0
SCARP = 2.5           # Abbruchkante unter dem Rand (m, je Richtung 0,8 … 4,5): fast senkrecht, Lehm in Lagen
# Neigung der Böschung am Ufer und am Fuss der Abbruchkante (Höhe je m waagrecht, 15° … 23°); mit 24° … 36° wirkte
# sie wie eine Wand, mit 19° … 29° noch zu steil
SLOPE = (0.26, 0.42)
R_REF = 58.0          # Bezugsradius für Längen entlang der Böschung (Rutschungen, Rinnen, Feuer): etwa ihre Mitte
SEG = 2048            # Spalten des Gitters rundum
# Zeilenabstand (m Höhe), je Spalte gleich: die Lagen der Abbruchkante enden ohne Treppen; entlang der flachen Böschung
# liegen die Zeilen so knapp 0,4 m auseinander
DH = 0.1
EXTENT = 700.0
TOP = Vector((-0.45, 0.52, 0.72)).normalized()   # kühles Licht von oben (Hauptlicht fürs Spiel)
B1, B2 = Perlin(503), Perlin(509)
G2, G3, G4, G5, G6, G7, G8, G9 = (Perlin(s) for s in (523, 541, 547, 557, 563, 569, 571, 577))


def sc():
    return bpy.context.scene


def link(name, data, coll=None):
    ob = bpy.data.objects.new(name, data)
    (coll or sc().collection).objects.link(ob)
    return ob


# ---------------------------------------------------------------- Trichter

def foot_radius(th):
    """Ufer je Richtung (Bogenmass, von +y über +x): Buchten und Vorsprünge"""
    c, s = np.cos(th), np.sin(th)
    return FOOT + 4.0 * fbm(B1, c * 1.3 + 7, s * 1.3 - 4, 3) + 1.6 * fbm(B2, c * 4.0, s * 4.0, 2)


def ring(P, th, f, octaves=3):
    """Rauschen rundum ohne Naht, gut 6 · f Wellen je Umlauf"""
    return fbm(P, np.cos(th) * f + 3.7, np.sin(th) * f - 1.9, octaves)


LU = 2 * np.pi * R_REF   # Umfang beim Bezugsradius


def wrapped(du):
    """Abstand entlang der Böschung (m bei R_REF) auf −LU/2 … LU/2"""
    return (du + LU / 2) % LU - LU / 2


def along(P, th, v, size, octaves=3):
    """Rauschen über (Weg entlang der Böschung / size, v) ohne Naht bei th = 0: im letzten Zehntel des Umlaufs gleitet
    es in die Werte vom Anfang über"""
    t = np.mod(th, 2 * np.pi)
    u = t * R_REF / size
    out = fbm(P, u, v, octaves)
    w = smoothstep(1.8 * np.pi, 2 * np.pi, t)
    m = w > 0
    if np.any(m):
        out = np.array(out, dtype=np.float64, copy=True)
        out[m] += w[m] * (fbm(P, u[m] - LU / size, v[m], octaves) - out[m])
    return out


def columns(th):
    """Aufbau je Richtung th: Ufer rf (die Böschung taucht in die Lava), Rand H (eine Seite höher, dazu Buckel und
    Kerben), Fuss der Abbruchkante hs, Steilheit k der Böschung, grosse Buchten bay (m nach aussen). Die Werte von ring
    liegen meist in ±0,4: Rand ±3, ±2 und ±1 m, Abbruchkante 0,8 … 4,5 m, Neigung ±16 %, Buchten ±4 m"""
    rf = foot_radius(th)
    H = RIM + 8.0 * ring(G9, th, 0.5, 2) + 5.0 * ring(G5, th, 1.2) + 2.0 * ring(G2, th, 6.0, 2)
    sc = np.clip(SCARP + 4.5 * ring(G3, th, 2.2), 0.8, 4.5)
    k = 1.0 + 0.4 * ring(G4, th, 1.8)
    bay = 10.0 * ring(G7, th, 0.5, 2)
    return dict(rf=rf, H=H, hs=H - sc, k=k, bay=bay)


def run(h, C):
    """Waagrechter Abstand vom Ufer bis zur Höhe h über der Lava (m): die Neigung wächst von SLOPE[0] am Ufer bis
    SLOPE[1] am Fuss der Abbruchkante (darüber senkrecht)"""
    a = SLOPE[0] * C['k']
    b = (SLOPE[1] - SLOPE[0]) * C['k'] / C['hs']
    return np.log(np.maximum(1 + b * np.minimum(h, C['hs']) / a, 0.05)) / b


def _slumps(seed=41, n=30):
    """Rutschungen: Mitte (m entlang der Böschung), halbe Breite, Abrisskante (Anteil der Höhe hs; über 1 schneidet sie
    in die Abbruchkante), Länge (m Höhe), Tiefe der Mulde (m)"""
    rng = np.random.default_rng(seed)
    return dict(u=rng.uniform(0, LU, n), w=rng.uniform(5.0, 16.0, n), top=rng.uniform(0.35, 1.08, n),
                L=rng.uniform(3.0, 9.0, n), a=rng.uniform(0.3, 1.0, n))


def _rills(seed=43, n=48):
    """Rinnen: Mitte (m), Breite (m), Tiefe (m), Anfang oben und Ende unten (Anteil von hs), Mäander (m) und Phase"""
    rng = np.random.default_rng(seed)
    h1 = rng.uniform(0.45, 1.0, n)
    return dict(u=rng.uniform(0, LU, n), w=rng.uniform(0.7, 2.2, n), d=rng.uniform(0.25, 1.0, n), h1=h1,
                h0=h1 * rng.uniform(0.0, 0.55, n), amp=rng.uniform(0.4, 2.5, n), ph=rng.uniform(0, 2 * np.pi, n))


def _flows(seed=47, n=380):
    """Rieselzungen: schmale Zungen aus nachgerutschtem Sand, oben spitz, unten mit rundem Wulst: Mitte (m), halbe
    Breite (m), Anfang oben (Anteil von hs), Länge (m Höhe), Höhe (m)"""
    rng = np.random.default_rng(seed)
    return dict(u=rng.uniform(0, LU, n), w=rng.uniform(0.6, 2.0, n), top=rng.uniform(0.2, 1.0, n),
                L=rng.uniform(2.0, 7.0, n), a=rng.uniform(0.15, 0.45, n))


SLUMPS, RILLS, FLOWS = _slumps(), _rills(), _flows()


def features(u, h, hs):
    """Rutschungen, Rinnen und Rieselzungen an den Stellen (u m entlang der Böschung, h über der Lava, hs je Stelle):
    Versatz nach aussen (m; Mulden positiv, Wülste, Zungen und Fächer negativ), frisch (0 … 1: frisch gerutschter Sand)
    und offen (0 … 1: an der Abrisskante liegen die Lagen frei)"""
    o = np.zeros_like(h); fresh = np.zeros_like(h); bare = np.zeros_like(h)
    Sl = SLUMPS
    for i in range(len(Sl['u'])):
        x = wrapped(u - Sl['u'][i]) / Sl['w'][i]
        m = np.abs(x) < 1.0
        if not m.any():
            continue
        xm, hm = x[m], h[m]
        L, a = Sl['L'][i], Sl['a'][i]
        t = (Sl['top'][i] * hs[m] - 0.25 * L * xm ** 2 - hm) / L   # Abrisskante sichelförmig, in der Mitte am höchsten
        side = smoothstep(1.0, 0.75, np.abs(xm))
        dep = a * smoothstep(0.0, 0.12, t) * (1 - smoothstep(0.3, 0.7, t))         # Mulde unter der Abrisskante
        toe = 0.35 * a * smoothstep(0.5, 0.8, t) * (1 - smoothstep(0.85, 1.15, t))   # Wulst am Fuss, flach
        o[m] += (dep - toe) * side
        fresh[m] = np.maximum(fresh[m], side * smoothstep(-0.02, 0.04, t) * (1 - smoothstep(0.8, 1.05, t)))
        bare[m] = np.maximum(bare[m], side * smoothstep(-0.01, 0.01, t) * (1 - smoothstep(0.04, 0.1, t)))
    Ri = RILLS
    for i in range(len(Ri['u'])):
        x = wrapped(u - Ri['u'][i] - Ri['amp'][i] * np.sin(h * 0.35 + Ri['ph'][i])) / Ri['w'][i]
        m = np.abs(x) < 3.0
        if not m.any():
            continue
        xm, hm = x[m], h[m]
        h0, h1, d = Ri['h0'][i] * hs[m], Ri['h1'][i] * hs[m], Ri['d'][i]
        groove = d * np.clip(1 - np.abs(xm), 0, 1) ** 1.2 * smoothstep(h0, h0 + 2.0, hm) * (1 - smoothstep(h1 - 1.5, h1, hm))
        fan = 0.5 * d * np.clip(1 - np.abs(xm) / 3.0, 0, 1) * smoothstep(h0 - 4.0, h0 - 1.0, hm) * (1 - smoothstep(h0 - 1.0, h0 + 0.5, hm))
        o[m] += groove - fan
    Fl = FLOWS
    for i in range(len(Fl['u'])):
        x = wrapped(u - Fl['u'][i]) / Fl['w'][i]
        m = np.abs(x) < 1.0
        if not m.any():
            continue
        t = (Fl['top'][i] * hs[m] - h[m]) / Fl['L'][i]
        wt = np.clip(t * 3.0, 0, 1) * np.sqrt(np.clip(1 - np.clip((t - 0.8) / 0.2, 0, None) ** 2, 0, 1))
        body = np.where((t > 0) & (t < 1), np.clip(1 - (np.abs(x[m]) / np.maximum(wt, 1e-3)) ** 2, 0, 1), 0.0)
        o[m] -= Fl['a'][i] * body * (1 + 0.6 * smoothstep(0.6, 0.9, t))
        fresh[m] = np.maximum(fresh[m], 0.6 * body)
    return o, fresh, bare


def surface(th, h, C=None):
    """Radius von Böschung und Abbruchkante an den Stellen (th, h über der Lava): Profil, Buchten, Rutschungen und
    Rinnen, feines Relief und Rieselstreifen; an der Kante bröckelnder Lehm, oben ein kleiner Überhang. Dazu je Stelle
    frisch, offen und cliff (1 an der Abbruchkante)"""
    C = C or columns(th)
    Cb = {k: np.broadcast_to(v, h.shape) for k, v in C.items()}
    hs, H = Cb['hs'], Cb['H']
    u = np.mod(th, 2 * np.pi) * R_REF
    o, fresh, bare = features(u, h, hs)
    cliff = smoothstep(hs - 0.3, hs + 0.3, h)
    r = Cb['rf'] + run(h, Cb) + Cb['bay'] * smoothstep(0.0, 6.0, h) + o
    crumble = 0.5 * along(G6, th, h / 1.4, 2.5) + 0.22 * along(G8, th, h / 0.5, 0.9)
    sand = 0.25 * along(G6, th, h / 2.5, 4.0) + 0.03 * along(G2, th, h / 2.5, 1.2)
    r = r + cliff * (0.10 * (h - hs) + crumble) + (1 - cliff) * sand
    r = r - 0.7 * smoothstep(H - 1.4, H - 0.15, h)               # Überhang an der Kante
    return r, dict(fresh=fresh, bare=bare, cliff=cliff)


# Farben (linear): Sand der Böschung (dunkel, hell), frisch gerutscht, verbrannt am Ufer, Wüste hinter dem Rand; die
# Lagen der Abbruchkante weisslich, beige, ocker, grau und rötlich wie in Darvaza
SAND = (np.array((0.28, 0.22, 0.16)), np.array((0.37, 0.29, 0.20)))
FRESH = np.array((0.42, 0.34, 0.24))
SCORCH = np.array((0.045, 0.040, 0.036))
DESERT = (np.array((0.16, 0.12, 0.09)), np.array((0.22, 0.17, 0.12)))
LAYER_COLORS = [(0.50, 0.46, 0.40), (0.42, 0.34, 0.25), (0.40, 0.29, 0.17), (0.30, 0.28, 0.26), (0.36, 0.23, 0.15),
                (0.47, 0.40, 0.31)]


def _layers(seed=91):
    """Lagen in der Abbruchkante: Unterkanten (m über der Lava) und Farben, je 0,25 … 2,5 m dick"""
    rng = np.random.default_rng(seed)
    z, lz, col = -5.0, [], []
    while z < RIM + 25.0:
        lz.append(z)
        col.append(np.array(LAYER_COLORS[rng.integers(len(LAYER_COLORS))]) * rng.uniform(0.92, 1.06))
        z += float(np.clip(rng.lognormal(-0.3, 0.6), 0.25, 2.5))
    return np.array(lz), np.array(col)


LAYERS = _layers()


def layer_color(th, h):
    hz = h + 1.5 * ring(G8, th, 0.7, 2)                           # die Lagen wellen sanft rundum
    j = np.clip(np.searchsorted(LAYERS[0], hz, 'right') - 1, 0, len(LAYERS[0]) - 1)
    return LAYERS[1][j]


def _nests(seed=61, n=130):
    """Feuernester: Richtung, Höhe über der Lava, Zahl der Flammen. Gut die Hälfte unten (bis gut ein Drittel der
    Böschung, dort grösser), ein Viertel in der Mitte, der Rest am Fuss der Abbruchkante"""
    rng = np.random.default_rng(seed)
    th = rng.uniform(0, 2 * np.pi, n)
    C = columns(th)
    zone = rng.choice(3, n, p=(0.55, 0.27, 0.18))
    f = np.select([zone == 0, zone == 1], [rng.uniform(0.03, 0.35, n), rng.uniform(0.35, 0.85, n)],
                  rng.uniform(0.9, 0.98, n))
    k = np.clip(np.round(rng.lognormal(1.8, 0.5, n) * np.where(zone == 0, 1.2, 0.8)), 2, 24).astype(int)
    return dict(th=th, h=f * C['hs'], k=k, seed=rng.integers(1 << 30, size=n))


NESTS = _nests()


def soot(th, h):
    """Russ um die Feuernester (0 … 1): rund um das Nest und als Fahne die Böschung hinauf; dazu Hitze (0 … 1) nah am
    Nest, wo die Risse im Boden glimmen"""
    s = np.zeros_like(h); heat = np.zeros_like(h)
    N = NESTS
    for i in range(len(N['th'])):
        du = wrapped((th - N['th'][i]) * R_REF)
        dh = h - N['h'][i]
        m = (np.abs(du) < 5.0) & (dh > -3.0) & (dh < 10.0)
        if not m.any():
            continue
        k = N['k'][i]
        d, e = du[m], dh[m]
        wl = 0.8 + 0.06 * k + 0.3 * np.maximum(e, 0)
        f = np.exp(-(d / wl) ** 2) * np.where(e < 0, np.exp(-(e / 1.0) ** 2), np.exp(-e / (1.2 + 0.1 * k)))
        s[m] = np.maximum(s[m], f)
        rh = 1.0 + 0.1 * k
        heat[m] = np.maximum(heat[m], np.exp(-(d / rh) ** 2 - (e / (0.7 * rh)) ** 2))
    return s, heat


def albedo(th, h, r, info):
    """Grundfarbe der Böschung: Sand gefleckt in drei Grössen, Rieselstreifen, frisch gerutscht heller, an Abrisskanten und an der
    Abbruchkante die Lagen, am Ufer verbrannt, um die Feuer Russ"""
    x, y = r * np.sin(th), r * np.cos(th)
    n = np.clip(1.3 * (0.5 + 0.5 * fbm(G4, x * 0.06, y * 0.06, 3)) - 0.15, 0, 1)
    col = SAND[0] + n[..., None] * (SAND[1] - SAND[0])
    patch = 0.5 + 0.5 * fbm(G5, x * 0.35, y * 0.35, 3)                       # Flecken um 3 m
    grit = 0.5 + 0.5 * fbm(G8, x * 1.1, y * 1.1, 2)                          # körnig um 1 m
    col = col * ((0.8 + 0.35 * patch) * (0.9 + 0.2 * grit))[..., None]
    col = col * (1 + 0.3 * along(G2, th, h / 2.5, 1.2))[..., None]          # Rieselstreifen, schwach (sonst Vorhang)
    col = col + (0.5 * info['fresh'])[..., None] * (FRESH - col)
    expose = np.maximum(info['cliff'], info['bare'])[..., None]
    col = col + expose * (layer_color(th, h) - col)
    col = col + (0.85 * smoothstep(1.8, 0.2, h))[..., None] * (SCORCH - col)
    col = col * (1 - 0.6 * info['soot'])[..., None]
    return col


ROWS = dict(lip=5, weit=40)   # Zeilen ausserhalb der Kante: Rundung, Wüste bis EXTENT


def funnel_mesh():
    """Böschung und Abbruchkante als ein Gitter auf festen Höhen (alle DH m, je Spalte gleich: die Lagen enden ohne
    Treppen; über dem Rand fallen die Zeilen auf die Kante), dahinter Rundung und Wüste. Attribute h (m über der Lava),
    cliff (1 an der Abbruchkante), heat (nah an einem Feuernest), albedo (Grundfarbe)"""
    th = np.arange(SEG) * 2 * np.pi / SEG
    sn, cs = np.sin(th), np.cos(th)
    C = columns(th)
    rows = np.arange(-1.5, C['H'].max() + DH, DH)[:, None]
    h = np.minimum(rows, C['H'][None])
    T = np.broadcast_to(th, h.shape)
    r, info = surface(T, h, C)
    info['soot'], heat = soot(T, h)
    A = albedo(T, h, r, info)
    K = info['cliff']
    rl = r[-1]
    s = np.linspace(0, 1, ROWS['lip'] + 1)[1:, None]
    R2 = rl + 3.0 * s
    H2 = C['H'] + 0.3 * np.sin(np.pi * s) - 0.15 * s
    s = np.linspace(0, 1, ROWS['weit'])[1:, None]
    R3 = (rl + 3.0) * ((EXTENT / (rl + 3.0)) ** s)
    H3 = (C['H'] - 0.15 + 0.02 * (R3 - rl - 3.0)
          + 2.0 * fbm(G6, R3 * sn * 0.01, R3 * cs * 0.01, 3) * smoothstep(0, 40, R3 - rl))
    Rd = np.concatenate([R2, R3]); Hd = np.concatenate([H2, H3])
    heat = np.concatenate([heat, np.zeros_like(Rd)])
    nd = np.clip(0.5 + 0.5 * fbm(G4, Rd * sn * 0.03, Rd * cs * 0.03, 3), 0, 1)
    Ad = DESERT[0] + nd[..., None] * (DESERT[1] - DESERT[0])
    R = np.concatenate([r, Rd]); Hh = np.concatenate([h, Hd])
    K = np.concatenate([K, np.zeros_like(Rd)]); A = np.concatenate([A, Ad])
    nr = len(R)
    V = np.stack([R * sn, R * cs, LAVA_Z + Hh], -1).reshape(-1, 3)
    i = np.arange(nr - 1)[:, None] * SEG; j = np.arange(SEG)[None]
    a = i + j; b = i + (j + 1) % SEG
    F = np.stack([a, b, b + SEG, a + SEG], -1).reshape(-1, 4)   # Normale zur Mitte hin bzw. nach oben
    P = V.reshape(nr, SEG, 3)
    same = np.all(np.abs(P[1:] - P[:-1]) < 1e-6, -1)           # Zeile fällt auf die vorige (über dem Rand)
    F = F[~(same & np.roll(same, -1, 1)).ravel()]
    me = make_mesh('Trichter', V, F)
    S.attrs(me, h=Hh.ravel(), cliff=K.ravel(), heat=heat.ravel())
    ca = me.color_attributes.new('albedo', 'FLOAT_COLOR', 'POINT')
    ca.data.foreach_set('color', np.concatenate([A.reshape(-1, 3), np.ones((A.size // 3, 1))], 1).astype(np.float32).ravel())
    log('Trichter', len(V), 'Ecken,', len(F), 'Flächen')
    return me


def mat_funnel():
    """Grundfarbe aus dem Gitter (albedo), leicht gefleckt; Sand feinkörnig mit Windrippeln quer zum Hang, die
    Abbruchkante (cliff 1) bröckelig; der Boden reisst am Ufer und um die Feuer (heat), dort glimmen die Risse; knapp
    über der Lava glüht der Sand; Schatten fast schwarz mit einem Hauch Blau (Grundlicht wie bei den Blöcken)"""
    m = bpy.data.materials.new('Trichter'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bsdf = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.95)
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    alb = t.node('ShaderNodeAttribute'); alb.attribute_name = 'albedo'
    ah = t.node('ShaderNodeAttribute'); ah.attribute_name = 'h'
    ac = t.node('ShaderNodeAttribute'); ac.attribute_name = 'cliff'
    hh = t.node('ShaderNodeAttribute'); hh.attribute_name = 'heat'
    h, cliff, heat = ah.outputs['Fac'], ac.outputs['Fac'], hh.outputs['Fac']
    mottle = t.node('ShaderNodeTexNoise', in_Scale=0.9, in_Detail=3.0); t.link(pos, mottle.inputs['Vector'])
    col = t.vmath('MULTIPLY', alb.outputs['Color'], t.maprange(mottle.outputs['Fac'], 0.3, 0.7, 0.9, 1.08))
    speck = t.node('ShaderNodeTexNoise', in_Scale=9.0, in_Detail=2.0); t.link(pos, speck.inputs['Vector'])
    col = t.vmath('MULTIPLY', col, t.maprange(speck.outputs['Fac'], 0.35, 0.65, 0.88, 1.1))      # feines Korn
    # Risse im Boden (Zellen um 0,8 m): am Ufer verbrannt, um die Feuer glimmend, dazu Flecken aufgerissener
    # Lehmkruste in der unteren Böschung
    cr = t.node('ShaderNodeTexVoronoi', in_Scale=1.3); cr.feature = 'DISTANCE_TO_EDGE'; t.link(pos, cr.inputs['Vector'])
    cpatch = t.node('ShaderNodeTexNoise', in_Scale=0.07, in_Detail=2.0); t.link(pos, cpatch.inputs['Vector'])
    claycrust = t.math('MULTIPLY', t.maprange(cpatch.outputs['Fac'], 0.56, 0.64), t.maprange(h, 8.0, 3.0))
    crust = t.math('MULTIPLY', t.math('MAXIMUM', t.math('MAXIMUM', heat, t.maprange(h, 2.5, 0.8)), claycrust),
                   t.math('SUBTRACT', 1.0, cliff))
    crack = t.math('MULTIPLY', t.maprange(cr.outputs['Distance'], 0.045, 0.0), crust)
    col = t.mix(t.math('MULTIPLY', claycrust, 0.35), col, (0.36, 0.30, 0.22, 1))                    # Kruste heller
    col = t.mix(t.math('MULTIPLY', crack, 0.85), col, (0.02, 0.016, 0.014, 1))
    t.link(col, bsdf.inputs['Base Color'])
    grain = t.node('ShaderNodeTexNoise', in_Scale=4.0, in_Detail=6.0); t.link(pos, grain.inputs['Vector'])
    vor = t.node('ShaderNodeTexVoronoi', in_Scale=2.2); t.link(pos, vor.inputs['Vector'])
    # Windrippel: Bänder in der Höhe (Kämme längs des Hangs), stark verzogen, knapp 1 m auseinander (feinere
    # verschwanden beim Malen), nur in Flecken (überall gleich wirkten sie wie die Zeilen eines Bildschirms)
    rip = t.node('ShaderNodeTexWave', in_Scale=0.35, in_Distortion=7.0, in_Detail=3.0, in_Detail__Scale=1.5)
    rip.bands_direction = 'Z'
    t.link(pos, rip.inputs['Vector'])
    rpatch = t.node('ShaderNodeTexNoise', in_Scale=0.12, in_Detail=2.0); t.link(pos, rpatch.inputs['Vector'])
    ripple = t.math('MULTIPLY', rip.outputs['Fac'], t.maprange(rpatch.outputs['Fac'], 0.38, 0.52))
    sand = t.math('SUBTRACT', t.math('ADD', t.math('MULTIPLY', grain.outputs['Fac'], 0.4),
                                     t.math('MULTIPLY', ripple, 1.6)), t.math('MULTIPLY', crack, 0.6))
    bmp = t.node('ShaderNodeBump', in_Distance=0.08)
    t.link(t.math('ADD', 0.3, t.math('MULTIPLY', cliff, 0.5)), bmp.inputs['Strength'])
    t.link(t.mix(cliff, sand, vor.outputs['Distance']), bmp.inputs['Height'])
    t.link(bmp.outputs['Normal'], bsdf.inputs['Normal'])
    n2 = t.node('ShaderNodeTexNoise', in_Scale=1.6, in_Detail=4.0); t.link(pos, n2.inputs['Vector'])
    splash = t.math('MULTIPLY', t.maprange(h, 0.9, 0.1), t.maprange(n2.outputs['Fac'], 0.4, 0.6))
    glow = t.vmath('MULTIPLY', t.mix(splash, (0.9, 0.10, 0.02, 1), (1.0, 0.30, 0.04, 1)), t.math('MULTIPLY', splash, 5.0))
    ember = t.math('MULTIPLY', t.math('MULTIPLY', crack, t.maprange(heat, 0.25, 0.9)), 3.5)   # glimmende Risse
    glow = t.vmath('ADD', glow, t.vmath('MULTIPLY', (1.0, 0.34, 0.05), ember))
    amb = t.vmath('MULTIPLY', col, (0.55 * ROCK_AMBIENT, 0.65 * ROCK_AMBIENT, ROCK_AMBIENT))
    t.link(t.vmath('ADD', glow, amb), bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = 1.0
    t.link(S.air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


ROCK_AMBIENT = 0.02   # Grundlicht von Sand und Blöcken (Anteil der eigenen Farbe, bläulich): Schatten mit einem Hauch Blau


def mat_rock():
    """Felsblock wie am Strand (szenen/beach mat_rock), in Vulkanfarben: dunkler Basalt, nach oben gewandte Flächen
    heller, je Block anders getönt (tone), einzelne Risse; vereinzelt Rost und Schwefel. Das Licht kommt von der Lava
    (unten warm); Mond und Himmel geben kaum etwas. Für die Felsbrocken im See."""
    m = bpy.data.materials.new('Fels'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    nrm = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], nrm.inputs[0])
    tone = t.node('ShaderNodeAttribute'); tone.attribute_name = 'tone'
    n1 = t.node('ShaderNodeTexNoise', in_Scale=0.8, in_Detail=4.0); t.link(pos, n1.inputs['Vector'])
    nf = t.node('ShaderNodeTexNoise', in_Scale=4.0, in_Detail=3.0); t.link(pos, nf.inputs['Vector'])
    up = t.maprange(nrm.outputs['Z'], 0.3, 0.9)
    col = t.mix(up, (0.050, 0.046, 0.046, 1), (0.125, 0.112, 0.104, 1))
    col = t.mix(t.math('MULTIPLY', tone.outputs['Fac'], 0.5), col, (0.085, 0.070, 0.066, 1))
    vor = t.node('ShaderNodeTexVoronoi', in_Scale=0.9); vor.feature = 'DISTANCE_TO_EDGE'
    t.link(pos, vor.inputs['Vector'])
    crack = t.math('MULTIPLY', t.maprange(vor.outputs['Distance'], 0.03, 0.0), t.maprange(n1.outputs['Fac'], 0.5, 0.62))
    col = t.mix(t.math('MULTIPLY', crack, 0.8), col, (0.02, 0.018, 0.02, 1))
    rust = t.math('MULTIPLY', t.math('GREATER_THAN', tone.outputs['Fac'], 0.82), t.maprange(nf.outputs['Fac'], 0.45, 0.6))
    col = t.mix(t.math('MULTIPLY', rust, 0.7), col, (0.17, 0.065, 0.03, 1))
    sulfur = t.math('MULTIPLY', t.maprange(nf.outputs['Fac'], 0.64, 0.7), up)
    col = t.mix(t.math('MULTIPLY', sulfur, 0.6), col, (0.42, 0.35, 0.08, 1))
    bsdf = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.85)
    t.link(col, bsdf.inputs['Base Color'])
    t.link(t.vmath('MULTIPLY', col, (0.55, 0.65, 1.0)), bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = ROCK_AMBIENT
    t.link(S.air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


def mat_clay_rock():
    """Abgestürzte Lehmbrocken: heller Lehm, gefleckt, nach oben gewandte Flächen etwas heller, je Vorlage (tone) und
    je Brocken (Attribut tint der Punkte) anders getönt, an den Kanten feine Risse; bei den Feuern (Attribut heat der
    Punkte) verrusst, dort glimmen die Risse. Lagen als Streifen wirkten wie Bretter"""
    m = bpy.data.materials.new('Lehmbrocken'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    nrm = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], nrm.inputs[0])
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(pos, sep.inputs[0])
    tone = t.node('ShaderNodeAttribute'); tone.attribute_name = 'tone'
    up = t.maprange(nrm.outputs['Z'], 0.2, 0.9)
    col = t.mix(up, (0.24, 0.19, 0.14, 1), (0.40, 0.33, 0.24, 1))
    col = t.mix(t.math('MULTIPLY', tone.outputs['Fac'], 0.6), col, (0.36, 0.25, 0.15, 1))
    mot = t.node('ShaderNodeTexNoise', in_Scale=2.0, in_Detail=3.0); t.link(pos, mot.inputs['Vector'])
    col = t.vmath('MULTIPLY', col, t.maprange(mot.outputs['Fac'], 0.3, 0.7, 0.88, 1.08))
    tint = t.node('ShaderNodeAttribute'); tint.attribute_name = 'tint'; tint.attribute_type = 'INSTANCER'
    hot = t.node('ShaderNodeAttribute'); hot.attribute_name = 'heat'; hot.attribute_type = 'INSTANCER'
    col = t.vmath('MULTIPLY', col, t.maprange(tint.outputs['Fac'], 0.0, 1.0, 0.72, 1.18))
    col = t.mix(t.maprange(tint.outputs['Fac'], 0.8, 1.0, 0.0, 0.5), col, (0.30, 0.17, 0.09, 1))   # einzelne rötliche
    vor = t.node('ShaderNodeTexVoronoi', in_Scale=3.0); vor.feature = 'DISTANCE_TO_EDGE'; t.link(pos, vor.inputs['Vector'])
    crack = t.maprange(vor.outputs['Distance'], 0.02, 0.0)
    col = t.mix(t.math('MULTIPLY', crack, 0.5), col, (0.06, 0.05, 0.045, 1))
    sooty = t.math('MAXIMUM', t.math('MULTIPLY', t.math('GREATER_THAN', tone.outputs['Fac'], 0.8), 0.6),
                   t.maprange(hot.outputs['Fac'], 0.1, 0.6, 0.0, 0.85))
    col = t.mix(sooty, col, (0.05, 0.045, 0.04, 1))
    bsdf = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.95)
    t.link(col, bsdf.inputs['Base Color'])
    ember = t.math('MULTIPLY', t.math('MULTIPLY', crack, t.maprange(hot.outputs['Fac'], 0.6, 0.95)), 1.2)   # stärker: Leopardenflecken
    t.link(t.vmath('ADD', t.vmath('MULTIPLY', col, (0.55 * ROCK_AMBIENT, 0.65 * ROCK_AMBIENT, ROCK_AMBIENT)),
                   t.vmath('MULTIPLY', (1.0, 0.34, 0.05), ember)), bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = 1.0
    t.link(S.air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


TEMPLATES = 16
CLAY_TEMPLATES = 28   # Vorlagen der Lehmbrocken: kantig, dazu flache Platten und längliche Stücke


def build_templates(name='Vulkanvorlagen', mat=None, seed=1200, n=TEMPLATES, shapes=False):
    """Felsblöcke als Vorlagen (vom Rendern ausgeschlossen) wie am Strand: S.boulder (kantig, Bruchflächen), Kanten
    scharf, je Vorlage ein Ton. Die Namen tragen die Nummer (der Geometrieknoten sortiert nach Namen). Vulkanvorlagen
    (Basalt) für die Felsbrocken im See, Lehmvorlagen für die Brocken auf der Böschung"""
    coll = S.collection(name, exclude=True)
    for ob in list(coll.objects):
        bpy.data.objects.remove(ob)
    mat = mat or bpy.data.materials.get('Fels') or mat_rock()
    prefix = 'v' if name == 'Vulkanvorlagen' else 'l'
    for k in range(n):
        V, F, _ = S.boulder(seed + k)
        if shapes and k % 3 == 1:
            V = V * np.array([1.2, 1.05, 0.62])          # Platte: abgeplatzte Kruste (dünner wirkte wie ein Brett)
        elif shapes and k % 3 == 2:
            V = V * np.array([1.35, 0.85, 0.85])         # länglich
        nm = '%s%02d' % (prefix, k)
        me = S.mesh(nm, V, F, mats=[mat])
        me.set_sharp_from_angle(angle=math.radians(25))
        S.attrs(me, tone=np.full(len(V), np.random.default_rng(k + 40).random()))
        link(nm, me, coll)
    return coll


def _clusters(seed, n):
    """Mitten von Gruppen auf der Böschung (Richtung, Anteil der Höhe hs)"""
    rng = np.random.default_rng(seed)
    return rng.uniform(0, 2 * np.pi, n), rng.uniform(0.05, 0.9, n)


def block_points(seed=71):
    """Lehmbrocken: ein Schuttsaum unter der Abbruchkante (frisch gestürzt, dicht), Haufen auf den Wülsten der
    Rutschungen, Gruppen über die Böschung (unten mehr und grösser: grosse rollen weiter), verbranntes Geröll am Ufer
    und einzelne grosse Blöcke. Lage (x, y, z Blender), Vorlage, Grösse je Achse (m), Drehung (Euler, gekippt), Ton
    und Hitze je Brocken"""
    rng = np.random.default_rng(seed)
    parts = []                                       # (th, h als Anteil von hs oder m, Grösse)

    def add(th, f, size, absolute=False):
        parts.append((np.mod(th, 2 * np.pi), f, size, absolute))
    n = 2600                                         # Schuttsaum
    th = rng.uniform(0, 2 * np.pi, n)
    add(th, 1.0 - rng.exponential(0.06, n), np.clip(rng.lognormal(-1.1, 0.55, n), 0.12, 1.4))
    Sl = SLUMPS                                      # Haufen an den Rutschungen
    n = 1200
    i = rng.integers(len(Sl['u']), size=n)
    x = rng.normal(0, 0.35, n)
    tt = np.clip(rng.normal(0.85, 0.12, n), 0.5, 1.1)
    th = (Sl['u'][i] + x * Sl['w'][i]) / R_REF
    C = columns(np.mod(th, 2 * np.pi))
    add(th, (Sl['top'][i] * C['hs'] - 0.25 * Sl['L'][i] * x ** 2 - tt * Sl['L'][i]) / C['hs'],
        np.clip(rng.lognormal(-1.0, 0.55, n), 0.12, 1.6))
    cth, cf = _clusters(77, 70)                     # Gruppen über die Böschung
    n = 1800
    j = rng.integers(len(cth), size=n)
    add(cth[j] + rng.normal(0, 2.5, n) / R_REF, np.clip(cf[j] + rng.normal(0, 0.05, n), 0.02, 0.95),
        np.clip(rng.lognormal(-1.0, 0.55, n) * (1.5 - cf[j]), 0.12, 1.8))
    n = 1300                                         # einzeln, unten mehr
    add(rng.uniform(0, 2 * np.pi, n), 1 - rng.random(n) ** 0.5, np.clip(rng.lognormal(-1.2, 0.6, n), 0.1, 1.5))
    n = 900                                          # verbranntes Geröll am Ufer (m über der Lava)
    add(rng.uniform(0, 2 * np.pi, n), rng.uniform(-0.3, 1.6, n), np.clip(rng.lognormal(-0.9, 0.5, n), 0.15, 1.5), True)
    n = 30                                           # grosse Blöcke
    add(rng.uniform(0, 2 * np.pi, n), rng.uniform(0.05, 0.6, n), rng.uniform(1.5, 3.0, n))
    th = np.concatenate([p[0] for p in parts]); size = np.concatenate([p[2] for p in parts])
    C = columns(th)
    h = np.concatenate([p[1] if p[3] else p[1] * columns(p[0])['hs'] for p in parts])
    h = np.clip(h, -0.4, C['hs'] - 0.15)
    r, _ = surface(th, h, C)
    _, heat = soot(th, h)
    m = len(th)
    pos = np.stack([r * np.sin(th), r * np.cos(th), LAVA_Z + h - rng.uniform(0.25, 0.5, m) * size], -1)
    scl = size[:, None] * np.stack([rng.uniform(1.0, 1.4, m), rng.uniform(0.85, 1.2, m), rng.uniform(0.65, 1.0, m)], -1)
    rot = np.stack([rng.normal(0, 0.45, m), rng.normal(0, 0.45, m), rng.uniform(0, 2 * np.pi, m)], -1)
    return pos, rng.integers(CLAY_TEMPLATES, size=m), scl, rot, dict(tint=rng.random(m), heat=heat)


def points(name, pos, var, scl, rot, extra):
    """Punkte für den Verteiler wie S.points, dazu weitere Werte je Punkt (für das Material: Attribut vom Instancer)"""
    me = S.points(name, pos, var, scl, rot)
    for k, v in extra.items():
        at = me.attributes.new(k, 'FLOAT', 'POINT')
        at.data.foreach_set('value', np.asarray(v, np.float32))
    return me


def build_blocks():
    old = bpy.data.materials.get('Lehmbrocken')
    if old:
        bpy.data.materials.remove(old)            # beim Ersetzen mit den Werten von jetzt
    coll = build_templates('Lehmvorlagen', mat_clay_rock(), 2200, CLAY_TEMPLATES, shapes=True)
    group = S.instancer('Brocken verteilen', coll)
    for name, (pos, var, scl, rot, extra) in (('Brocken', block_points()), ('Kies', gravel_points())):
        ob = link(name, points(name, pos, var, scl, rot, extra))
        ob.modifiers.new(name, 'NODES').node_group = group
        log(name, len(pos))


def gravel_points(n=40000, seed=73):
    """Kies (3 … 25 cm) aus denselben Vorlagen wie die Brocken: knapp die Hälfte über die Böschung (unten dichter), ein
    Viertel in den Rinnen, der Rest in Flecken um die Gruppen der Brocken und unter der Abbruchkante"""
    rng = np.random.default_rng(seed)
    n1, n2, n3 = int(0.45 * n), int(0.25 * n), int(0.15 * n)
    n4 = n - n1 - n2 - n3
    th1 = rng.uniform(0, 2 * np.pi, n1)
    f1 = 1 - rng.random(n1) ** 0.5
    Ri = RILLS
    i2 = rng.integers(len(Ri['u']), size=n2)
    f2 = rng.uniform(Ri['h0'][i2] - 0.15, Ri['h1'][i2], n2)
    cth, cf = _clusters(77, 70)
    j = rng.integers(len(cth), size=n3)
    th3 = cth[j] + rng.normal(0, 3.5, n3) / R_REF
    f3 = np.clip(cf[j] + rng.normal(0, 0.07, n3), 0.02, 0.95)
    th4 = rng.uniform(0, 2 * np.pi, n4)
    f4 = 1.0 - rng.exponential(0.1, n4)
    th = np.mod(np.concatenate([th1, Ri['u'][i2] / R_REF, th3, th4]), 2 * np.pi)
    f = np.concatenate([f1, f2, f3, f4])
    C0 = columns(th)
    h = f * C0['hs']
    u2 = Ri['u'][i2] + Ri['amp'][i2] * np.sin(h[n1:n1 + n2] * 0.35 + Ri['ph'][i2]) + rng.normal(0, 0.35, n2) * Ri['w'][i2]
    th[n1:n1 + n2] = np.mod(u2 / R_REF, 2 * np.pi)
    C = columns(th)
    h = np.clip(h, -0.3, C['hs'] - 0.15)
    r, _ = surface(th, h, C)
    _, heat = soot(th, h)
    size = np.clip(rng.lognormal(-2.5, 0.5, n), 0.03, 0.25)
    pos = np.stack([r * np.sin(th), r * np.cos(th), LAVA_Z + h - 0.4 * size], -1)
    scl = size[:, None] * np.stack([rng.uniform(1.0, 1.5, n), rng.uniform(0.8, 1.2, n), rng.uniform(0.5, 1.0, n)], -1)
    rot = np.stack([rng.normal(0, 0.5, n), rng.normal(0, 0.5, n), rng.uniform(0, 2 * np.pi, n)], -1)
    return pos, rng.integers(CLAY_TEMPLATES, size=n), scl, rot, dict(tint=rng.random(n), heat=heat)


def build_shrubs(n=420, seed=97):
    """Dunkle Sträucher (Saxaul) auf der Wüste hinter dem Rand, die meisten nah an der Kante: vom Brett aus stehen sie
    als Umrisse vor dem Himmel. Je Strauch 3 … 6 Kugeln"""
    import bmesh
    rng = np.random.default_rng(seed)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
    ico = np.array([v.co[:] for v in bm.verts]); ifaces = np.array([[v.index for v in f.verts] for f in bm.faces])
    bm.free()
    th = rng.uniform(0, 2 * np.pi, n)
    C = columns(th)
    rl, _ = surface(th, C['H'], C)
    r = rl + 3.0 + np.clip(rng.exponential(6.0, n), 0.3, 35.0)
    V, F = [], []
    for k in range(n):
        hgt = rng.uniform(0.5, 1.6)
        for _ in range(rng.integers(3, 7)):
            c = np.array([r[k] * np.sin(th[k]), r[k] * np.cos(th[k]), LAVA_Z + C['H'][k] + 0.1])
            c = c + np.array([*rng.normal(0, 0.45 * hgt, 2), rng.uniform(0.2, 0.8) * hgt])
            s = rng.uniform(0.25, 0.55, 3) * hgt
            F.append(ifaces + sum(len(v) for v in V))
            V.append(ico * s + c)
    me = make_mesh('Straeucher', np.concatenate(V), np.concatenate(F))
    mat = bpy.data.materials.get('Strauch')
    if mat is None:
        mat = bpy.data.materials.new('Strauch'); mat.use_nodes = True
        b = mat.node_tree.nodes['Principled BSDF']
        b.inputs['Base Color'].default_value = (0.035, 0.028, 0.02, 1)
        b.inputs['Roughness'].default_value = 1.0
    me.materials.append(mat)
    link('Straeucher', me)
    log('Sträucher', n)


FLAME_STRENGTH = (4.0, 1.6)   # Leuchten von Kern und Hülle der Flammen am Fuss (nach oben schwächer)


def mat_flame():
    """Flamme aus zwei Schichten (Attribut shell): ein gelber Kern und eine orange Hülle, die über Rot zur Spitze hin
    durchsichtig ausläuft (Attribut ft 0 … 1 von unten nach oben)"""
    m = bpy.data.materials.new('Flamme'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    ft = t.node('ShaderNodeAttribute'); ft.attribute_name = 'ft'
    sh = t.node('ShaderNodeAttribute'); sh.attribute_name = 'shell'
    f, shell = ft.outputs['Fac'], sh.outputs['Fac']

    def ramp(stops):
        r = t.node('ShaderNodeValToRGB')
        cr = r.color_ramp
        cr.elements[0].position = stops[0][0]; cr.elements[0].color = stops[0][1] + (1,)
        cr.elements[1].position = stops[-1][0]; cr.elements[1].color = stops[-1][1] + (1,)
        for p, c in stops[1:-1]:
            e = cr.elements.new(p); e.color = c + (1,)
        t.link(f, r.inputs['Fac'])
        return r.outputs['Color']
    core = ramp([(0.0, (1.0, 0.86, 0.50)), (0.5, (1.0, 0.62, 0.18)), (1.0, (1.0, 0.36, 0.05))])
    hull = ramp([(0.0, (1.0, 0.50, 0.10)), (0.45, (0.95, 0.26, 0.03)), (1.0, (0.45, 0.04, 0.01))])
    em = t.node('ShaderNodeEmission')
    t.link(t.mix(shell, core, hull), em.inputs['Color'])
    strength = t.math('ADD', FLAME_STRENGTH[0], t.math('MULTIPLY', shell, FLAME_STRENGTH[1] - FLAME_STRENGTH[0]))
    t.link(t.math('MULTIPLY', t.maprange(f, 0.0, 1.0, 1.0, 0.4), strength), em.inputs['Strength'])
    tr = t.node('ShaderNodeBsdfTransparent')
    mix = t.node('ShaderNodeMixShader')
    alpha = t.math('MULTIPLY', t.maprange(f, 0.5, 1.0, 1.0, 0.0), t.math('SUBTRACT', 1.0, t.math('MULTIPLY', shell, 0.25)))
    t.link(alpha, mix.inputs['Fac'])
    t.link(tr.outputs[0], mix.inputs[1]); t.link(em.outputs[0], mix.inputs[2])
    t.link(mix.outputs[0], out.inputs['Surface'])
    return m


def flame_points():
    """Flammen der Feuernester: je Nest k Flammen um seine Mitte auf der Böschung, eine davon gross. Fusspunkte
    (x, y, z), Höhe und Breite (m)"""
    N = NESTS
    P, Hf, Wf = [], [], []
    for i in range(len(N['th'])):
        rng = np.random.default_rng(int(N['seed'][i]))
        k = int(N['k'][i])
        du = rng.normal(0, 0.6 + 0.07 * k, k)
        dh = rng.normal(0, 0.4 + 0.04 * k, k)
        th = N['th'][i] + du / R_REF
        h = np.clip(N['h'][i] + dh, 0.3, None)
        C = columns(th)
        h = np.minimum(h, C['hs'] - 0.1)
        r, _ = surface(th, h, C)
        r = r - 0.08
        P.append(np.stack([r * np.sin(th), r * np.cos(th), LAVA_Z + h], -1))
        hf = np.clip(rng.lognormal(-0.3, 0.45, k), 0.3, 1.8)
        hf[rng.integers(k)] = rng.uniform(1.3, 2.6)
        Hf.append(hf); Wf.append(hf * rng.uniform(0.26, 0.38, k))
    return np.concatenate(P), np.concatenate(Hf), np.concatenate(Wf)


def build_flames():
    """Flammen als Zungen (Drehkörper, 12 Seiten): unten rund, oben spitz, leicht geneigt und gebogen, je aus Hülle und
    einem kleineren Kern darin; werfen keinen Schatten und sind für die Kamera unsichtbar (ihr Licht bleibt). Attribute
    ft (0 am Fuss … 1 an der Spitze) und shell"""
    P, Hf, Wf = flame_points()
    rng = np.random.default_rng(5)
    t = np.linspace(0, 1, 11)
    prof = np.where(t < 0.2, np.sqrt(t / 0.2), ((1 - t) / 0.8) ** 1.25)
    seg = 12
    a = np.linspace(0, 2 * np.pi, seg, endpoint=False)
    L = np.stack([np.outer(prof, np.sin(a)), np.outer(prof, np.cos(a)), np.repeat(t[:, None], seg, 1)], -1).reshape(-1, 3)
    ftl = np.repeat(t, seg)
    ii = np.arange(len(t) - 1)[:, None]; jj = np.arange(seg)[None, :]
    q0 = ii * seg + jj; q1 = ii * seg + (jj + 1) % seg
    Fl = np.stack([q0, q1, q1 + seg, q0 + seg], -1).reshape(-1, 4)
    n = len(P)
    tx, ty = rng.normal(0, 0.12, n), rng.normal(0, 0.12, n)
    bend = rng.normal(0, 0.18, (n, 2))
    V, F, FT, SH = [], [], [], []
    for k in range(n):
        cx, sx, cy, sy = math.cos(tx[k]), math.sin(tx[k]), math.cos(ty[k]), math.sin(ty[k])
        rot = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]]) @ np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
        for shell, sw, shh in ((1.0, 1.0, 1.0), (0.0, 0.55, 0.7)):
            loc = L * np.array([Wf[k] * sw, Wf[k] * sw, Hf[k] * shh])
            loc[:, 0] += bend[k, 0] * Hf[k] * loc[:, 2] ** 2 / max(Hf[k], 1e-3)
            loc[:, 1] += bend[k, 1] * Hf[k] * loc[:, 2] ** 2 / max(Hf[k], 1e-3)
            F.append(Fl + sum(len(v) for v in V))
            V.append(loc @ rot.T + P[k])
            FT.append(ftl); SH.append(np.full(len(L), shell))
    me = make_mesh('Flammen', np.concatenate(V), np.concatenate(F))
    S.attrs(me, ft=np.concatenate(FT), shell=np.concatenate(SH))
    old = bpy.data.materials.get('Flamme')
    if old:
        bpy.data.materials.remove(old)
    me.materials.append(mat_flame())
    ob = link('Flammen', me)
    ob.visible_shadow = False
    ob.visible_camera = False   # im Panorama nur ihr Licht: die Flammen selbst zeichnet das Spiel bewegt (fireNests)
    ob.visible_glossy = False
    log('Flammen', n, 'in', len(NESTS['th']), 'Nestern')


def build_funnel():
    build_templates()                       # Vorlagen der Felsbrocken im See (Basalt)
    me = funnel_mesh()
    me.materials.append(mat_funnel())
    link('Trichter', me)
    build_blocks()
    build_shrubs()
    build_flames()


# Felsbrocken am Seeufer, die das Spiel selbst zeichnet (bakedMesh): Winkel (Grad), Abstand vom Fuss (m, negativ: im
# See), Grösse (m). Die meisten nach vorn (+y): In der Standardansicht liegt dort der obere Bildrand
RIM_ROCKS = [(-48, -1.2, 3.2), (-30, 0.5, 4.2), (-14, -0.8, 2.6), (2, 0.8, 3.8), (16, -1.5, 2.4), (31, 0.2, 4.6),
             (47, -0.6, 3.0), (64, 0.9, 3.6), (95, -1.0, 3.4), (140, 0.4, 4.0), (200, -0.8, 3.2), (250, 0.6, 3.8),
             (300, -1.2, 3.0)]
# So weit liegen sie vor dem Ufer im See (m, vor dem Ring der Glut am Ufer, sonst überstrahlt er sie; etwa am Rand
# des Sees im Spiel, LAVA_GAME) und so viel grösser: Am Ufer steckten sie fast ganz in der gemalten Böschung
RIM_ROCK_OUT, RIM_ROCK_SCALE = 9.0, 1.4


def build_rim_rocks():
    """Felsbrocken am Ufer als ein Netz (Sammlung Spiel: für die Kamera unsichtbar, Licht und Schatten bleiben im
    Panorama), mit UV-Karte (wie am Strand unwrap_near_rocks); für bake_rim_rocks"""
    import bmesh
    from mathutils import Euler, Matrix
    for n in ('Felsen nah',):
        if bpy.data.objects.get(n):
            bpy.data.objects.remove(bpy.data.objects[n])
    coll = bpy.data.collections['Vulkanvorlagen']
    rng = np.random.default_rng(83)
    bm = bmesh.new()
    tone = bm.verts.layers.float.new('tone')
    for deg, du, size in RIM_ROCKS:
        a = math.radians(deg)
        r = float(foot_radius(np.array(a))) + du - RIM_ROCK_OUT
        size *= RIM_ROCK_SCALE
        v = int(rng.integers(TEMPLATES))
        tpl = coll.objects['v%02d' % v].data
        s_ = (size * 1.3, size * 1.0, size * 0.75)
        M = Matrix.Translation((r * math.sin(a), r * math.cos(a), LAVA_Z - 0.3 * size)) \
            @ Euler((0, 0, rng.uniform(0, 6.3)), 'XYZ').to_matrix().to_4x4() @ Matrix.Diagonal((*s_, 1.0))
        n0 = len(bm.verts)
        bm.from_mesh(tpl)
        bm.verts.ensure_lookup_table()
        new = bm.verts[n0:]
        bmesh.ops.transform(bm, matrix=M, verts=new)
        t = float(rng.random())
        for vt in new:
            vt[tone] = t
    me = bpy.data.meshes.new('Felsen nah')
    bm.to_mesh(me)
    bm.free()
    me.materials.append(bpy.data.materials['Fels'])
    ob = link('Felsen nah', me, S.collection('Spiel'))
    ob.visible_camera = False
    S.unwrap_near_rocks(ob)
    log('Felsen nah', len(me.vertices), 'Ecken,', len(RIM_ROCKS), 'Brocken')


# ---------------------------------------------------------------- Lavasee

CRACK_STRENGTH = 7.0
CRUST = (0.025, 0.020, 0.022)


def lake_mesh():
    """See als Scheibe bis unter die Böschung; Attribut wall: Abstand zum Ufer (m, > 0 im See)"""
    r_max = FOOT + 8.0
    X, Y, F = S.ring_mesh('See', 1024, 0.3, r_max)
    X = np.concatenate([X, [0.0]]); Y = np.concatenate([Y, [0.0]])
    j = np.arange(1024)
    fan = np.stack([np.full(1024, len(X) - 1), (j + 1) % 1024, j], -1)
    r0 = foot_radius(np.arctan2(X, Y))
    me = make_mesh('See', np.stack([X, Y, np.full(len(X), LAVA_Z)], -1), [F, fan])
    S.attrs(me, wall=r0 - np.hypot(X, Y))
    return me


def mat_lake():
    """Kruste dunkel, leicht glänzend; Risse unregelmässig (verzerrte Zellen in zwei Grössen), im Kern gelborange, aussen
    rot; am Ufer ein heller Glutsaum mit Spritzern. Unter dem See des Spiels nur die dunkle Kruste mit
    schwachem Glühen (dort zeichnet das Spiel)."""
    m = bpy.data.materials.new('Lava'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bsdf = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.45)
    bsdf.inputs['Base Color'].default_value = CRUST + (1,)
    a = t.node('ShaderNodeAttribute'); a.attribute_name = 'wall'
    wall = a.outputs['Fac']
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    # verzerrte Koordinaten: die Risse laufen unregelmässig statt in geraden Zellkanten
    warp = t.node('ShaderNodeTexNoise', in_Scale=0.12, in_Detail=3.0); t.link(pos, warp.inputs['Vector'])
    wp = t.vmath('ADD', pos, t.vmath('MULTIPLY', t.vmath('SUBTRACT', warp.outputs['Color'], (0.5, 0.5, 0.5)), (8.0, 8.0, 0.0)))
    big = t.node('ShaderNodeTexVoronoi', in_Scale=0.24); big.feature = 'DISTANCE_TO_EDGE'; t.link(wp, big.inputs['Vector'])
    small = t.node('ShaderNodeTexVoronoi', in_Scale=0.75); small.feature = 'DISTANCE_TO_EDGE'; t.link(wp, small.inputs['Vector'])
    gate = t.node('ShaderNodeTexNoise', in_Scale=0.3, in_Detail=2.0); t.link(pos, gate.inputs['Vector'])
    c1 = t.math('MULTIPLY', t.maprange(big.outputs['Distance'], 0.026, 0.0), t.maprange(gate.outputs['Fac'], 0.3, 0.6, 0.45, 1.0))
    c2 = t.math('MULTIPLY', t.maprange(small.outputs['Distance'], 0.03, 0.0), t.maprange(gate.outputs['Fac'], 0.5, 0.62))
    crack = t.math('MAXIMUM', c1, t.math('MULTIPLY', c2, 0.7))
    r = t.vmath('LENGTH', t.vmath('MULTIPLY', pos, (1, 1, 0)))
    open_ = t.maprange(r, LAVA_GAME - 3.2, LAVA_GAME - 2.4)   # unter dem Spiel nur schwach
    crack = t.math('MULTIPLY', crack, open_)   # unter dem Spiel nur die Kruste (kleineres Bild)
    # Glutsaum am Ufer mit Spritzern
    sn = t.node('ShaderNodeTexNoise', in_Scale=0.6, in_Detail=3.0); t.link(pos, sn.inputs['Vector'])
    rim = t.math('MAXIMUM', t.maprange(wall, 1.4, 0.3), t.math('MULTIPLY', t.maprange(wall, 3.0, 1.2), t.maprange(sn.outputs['Fac'], 0.55, 0.68)))
    heat = t.math('MAXIMUM', crack, rim)
    ramp = t.node('ShaderNodeValToRGB')
    cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.32, 0.025, 0.008, 1)
    cr.elements[1].position = 1.0; cr.elements[1].color = (1.0, 0.40, 0.06, 1)   # höchstens kräftiges Orange-Gelb
    e = cr.elements.new(0.5); e.color = (0.92, 0.15, 0.02, 1)
    t.link(heat, ramp.inputs['Fac'])
    t.link(ramp.outputs['Color'], bsdf.inputs['Emission Color'])
    t.link(t.math('MULTIPLY', t.math('POWER', heat, 0.8), CRACK_STRENGTH), bsdf.inputs['Emission Strength'])
    t.link(S.air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


def build_lake():
    me = lake_mesh()
    me.materials.append(mat_lake())
    link('See', me)


# ---------------------------------------------------------------- Himmel, Licht, Luft

# Nacht wie am Gaskrater Darvaza («Door to Hell»): Hauptlicht sind Lava und Feuernester, der Himmel fast schwarz mit
# Sternen (die zeichnet das Spiel) bis hinunter zum Rand. Mond (Oben) und Himmel geben kaum Licht; die Böschung glüht
# unten und um die Feuer, nach oben wird es dunkel, der Rand steht dunkel vor dem Himmel. Der helle Sand wirft gut
# siebenmal so viel Licht zurück wie früher der Basalt: die Lampen der Lava sind entsprechend schwächer.
SKY_GAIN = 0.12
SKY_LIGHT = 0.08      # Himmel als Licht (für die Kamera SKY_GAIN): die weite Öffnung hellte die Böschung sonst auf
AIR_DIST = 900.0      # Dunst im Krater
AIR_HEIGHT = 300.0
GLUT = (1.0, 0.38, 0.08)   # Farbe der Lampen der Lava: sattes Orange
GLOW_ENERGY = 600.0   # Widerschein der Lava (W): Flächenlampe knapp über dem See, nach oben, nur ein schwacher Schein
# Glut am Ufer: ein Ring Punktlampen knapp vor der Böschung (Anzahl, W je Lampe, m vor dem Ufer, m über der Lava). Nah
# am Ufer fällt es nach oben stark ab: unten glüht der Sand, der Rand bleibt dunkel.
GLOW_SHORE = (24, 2.2e3, 2.0, 1.0)
FIRE = (1.0, 0.48, 0.14)   # Farbe der Lampen der Feuernester
NEST_ENERGY = 450.0   # W je Feuernest mit 6 Flammen (mit der Zahl der Flammen hoch 0,7)
TOP_STRENGTH = 0.12
TOP_COLOR = (0.55, 0.62, 1.0)


def sky_group():
    """Himmelsfarbe: fast schwarzes Nachtblau mit einem Stich Petrol, bis hinunter zum Rand (die tiefsten Kerben liegen
    vom Mittelpunkt aus fast waagrecht, z um 0,02): Ein warmer Schein über dem Rand wirkte wie ein Licht hinter dem
    Krater. Darunter, nur als Dunst der Luftperspektive vor der Böschung, ein dunkles Glutrot: das Leuchten des Sees.
    Rauchschwaden knapp über dem Rand, dunkel und kaum sichtbar"""
    ng, t, gi, go = S._group('Himmelsfarbe', [('Richtung', 'NodeSocketVector'), ('Gain', 'NodeSocketFloat')],
                             [('Farbe', 'NodeSocketColor')])
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(t.vmath('NORMALIZE', gi.outputs['Richtung']), sep.inputs[0])
    ramp = t.node('ShaderNodeValToRGB')
    cr = ramp.color_ramp; cr.interpolation = 'EASE'
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.25, 0.08, 0.03, 1)
    cr.elements[1].position = 1.0; cr.elements[1].color = (0.005, 0.012, 0.024, 1)
    for p, col in ((0.02, (0.05, 0.02, 0.018, 1)), (0.06, (0.010, 0.016, 0.026, 1))):
        e = cr.elements.new(p); e.color = col
    t.link(t.math('MAXIMUM', sep.outputs['Z'], 0.0), ramp.inputs['Fac'])
    n = t.node('ShaderNodeTexNoise', in_Scale=2.5, in_Detail=5.0); t.link(gi.outputs['Richtung'], n.inputs['Vector'])
    low = t.maprange(sep.outputs['Z'], 0.4, 0.1)    # Rauch nur knapp über dem Rand
    smoke = t.mix(t.math('MULTIPLY', t.math('MULTIPLY', t.maprange(n.outputs['Fac'], 0.45, 0.7), 0.4), low),
                  ramp.outputs['Color'], (0.026, 0.026, 0.034, 1))
    scl = t.node('ShaderNodeVectorMath'); scl.operation = 'SCALE'
    t.link(smoke, scl.inputs[0]); t.link(t.math('MULTIPLY', gi.outputs['Gain'], 6.0), scl.inputs['Scale'])
    t.link(scl.outputs['Vector'], go.inputs['Farbe'])
    return ng


def world():
    w = bpy.data.worlds.new('Nacht'); sc().world = w; w.use_nodes = True
    sky_group()   # Gruppen werden neu gefüllt, nicht ersetzt: Materialien behalten ihre Verbindungen
    S.WATER, S.AIR_DIST, S.AIR_HEIGHT, S.SKY_GAIN = LAVA_Z, AIR_DIST, AIR_HEIGHT, SKY_GAIN
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
    t.link(g.outputs['Farbe'], bg.inputs['Color'])
    return w


def lights():
    ld = bpy.data.lights.new('Oben', 'SUN')
    ld.energy = TOP_STRENGTH; ld.color = TOP_COLOR; ld.angle = math.radians(8.0)
    ob = link('Oben', ld)
    ob.rotation_euler = TOP.to_track_quat('Z', 'Y').to_euler()
    ob['hauptlicht'] = True
    ld = bpy.data.lights.new('Glut See', 'AREA'); ld.shape = 'DISK'; ld.size = 2 * FOOT
    ld.energy = GLOW_ENERGY; ld.color = GLUT
    ob = link('Glut See', ld)
    ob.location = (0.0, 0.0, LAVA_Z + 0.4)
    ob.rotation_euler = (math.pi, 0, 0)   # Flächenlampen leuchten entlang ihrer −Z: hier nach oben
    ob.visible_camera = False
    ob.visible_glossy = False
    n, energy, inset, lift = GLOW_SHORE
    for i in range(n):
        a = 2 * math.pi * (i + 0.5) / n
        r = float(foot_radius(np.array(a))) - inset
        name = 'Glut Ufer %02d' % i
        ld = bpy.data.lights.new(name, 'POINT'); ld.shadow_soft_size = 6.0
        ld.energy = energy; ld.color = GLUT
        ob = link(name, ld)
        ob.location = (r * math.sin(a), r * math.cos(a), LAVA_Z + lift)
        ob.visible_camera = False
        ob.visible_glossy = False
    # je Feuernest eine Lampe, etwas vor der Böschung und über den Flammen
    N = NESTS
    C = columns(N['th'])
    r, _ = surface(N['th'], N['h'], C)
    for i in range(len(N['th'])):
        a, k = float(N['th'][i]), int(N['k'][i])
        name = 'Feuer %03d' % i
        ld = bpy.data.lights.new(name, 'POINT'); ld.shadow_soft_size = 0.6
        ld.energy = NEST_ENERGY * (k / 6.0) ** 0.7; ld.color = FIRE
        ob = link(name, ld)
        rr = float(r[i]) - 0.8
        ob.location = (rr * math.sin(a), rr * math.cos(a), LAVA_Z + float(N['h'][i]) + 0.7)
        ob.visible_camera = False
        ob.visible_glossy = False


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
    build_funnel()
    build_rim_rocks()
    build_lake()
    lights()
    cameras()


def _remove(names):
    for n in names:
        ob = bpy.data.objects.get(n)
        if ob:
            bpy.data.objects.remove(ob)


def replace_crater():
    """Trichter, Brocken, Sträucher, Flammen, Felsbrocken und See neu; dazu das Licht (replace_world), denn der Ring
    „Glut Ufer“, die Flächenlampe und die Lampen der Feuernester richten sich nach Ufer und Böschung"""
    _remove(['Trichter', 'Brocken', 'Kies', 'Straeucher', 'Flammen', 'Felsen nah', 'See', 'Kraterwand', 'Bloecke'])
    bpy.data.orphans_purge(do_recursive=True)   # sonst bleiben die alten Netze und das Rendern wird langsam
    build_funnel()
    build_rim_rocks()
    build_lake()
    replace_world()


def replace_world():
    old = sc().world
    world()
    if old:
        bpy.data.worlds.remove(old)
    _remove(['Oben', 'Glut See', 'Glut Mitte'] + [o.name for o in bpy.data.objects
                                                  if o.name.startswith(('Glut Ufer', 'Feuer '))])
    for ld in [l for l in bpy.data.lights if l.users == 0]:
        bpy.data.lights.remove(ld)   # sonst bekämen die neuen Lampen Namen mit .001
    lights()


# ---------------------------------------------------------------- Export fürs Spiel

ROCK_TEX = 1024   # Bild der Felsbrocken am Ufer (gebackenes Licht), Seitenlänge auf dem Desktop; das Handy die halbe


def bake_rim_rocks(stil='volcano', samples=512):
    """Licht der Felsbrocken am Ufer backen wie am Strand (szenen/beach bake_near_rocks): Cycles COMBINED mit den
    Einstellungen des Panoramas, dazu Grundfarbe und Normale, entrauscht (anime.denoise) -> Bild „Felsen Licht“"""
    import importlib
    os.environ['WALD_STIL'] = stil
    import wald_export, anime
    wx = importlib.reload(wald_export)
    anime = importlib.reload(anime)
    ob = bpy.data.objects['Felsen nah']
    imgs = {}
    for key in ('licht', 'farbe', 'normale'):
        name = 'Felsen ' + key
        if bpy.data.images.get(name):
            bpy.data.images.remove(bpy.data.images[name])
        imgs[key] = bpy.data.images.new(name, ROCK_TEX, ROCK_TEX, float_buffer=True)
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
    # die Vorlagen (gleiches Material) und die Blöcke würden sonst mitgebacken bzw. verdecken nichts: nur ob ist aktiv
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
        wx.restore()
        mat.node_tree.nodes.remove(node)
    px = {k: np.array(im.pixels[:], np.float64).reshape(ROCK_TEX, ROCK_TEX, 4)[::-1, :, :3] for k, im in imgs.items()}
    clean = anime.denoise(px['licht'], px['farbe'], px['normale'] * 2 - 1)
    for im in imgs.values():
        bpy.data.images.remove(im)
    return clean


def rock_model(sky, lin, stil='volcano'):
    """Felsbrocken am Ufer fürs Spiel (bakedMesh, wie am Strand rock_model): Ecken in Spielkoordinaten (Int16, 1/256 m),
    UV (Uint16), Dreiecke, rock8 überall 255 (nur Fels); das gebackene Licht gemalt wie das Panorama als
    sky/<stil>/rocks_hd.jpg und halb so gross rocks.jpg"""
    import base64, importlib
    from wald_io import save_image
    os.environ['WALD_STIL'] = stil
    import anime
    anime = importlib.reload(anime)
    painted = anime.paint_texture(lin)
    save_image(painted, os.path.join(sky, 'rocks_hd.jpg'), 'JPEG', 86)
    h, w = painted.shape[:2]
    save_image(painted.reshape(h // 2, 2, w // 2, 2, 3).mean((1, 3)), os.path.join(sky, 'rocks.jpg'), 'JPEG', 86)
    me = bpy.data.objects['Felsen nah'].data
    me.calc_loop_triangles()
    loops = np.empty(len(me.loop_triangles) * 3, np.int64); me.loop_triangles.foreach_get('loops', loops)
    vi = np.empty(len(me.loops), np.int64); me.loops.foreach_get('vertex_index', vi)
    uv = np.empty(len(me.loops) * 2); me.uv_layers.active.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
    co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
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
            'uv16': b(quv[first].astype('<u2')), 'rock8': b(np.full(n, 255, 'u1')), 'texture': 'file:rocks.jpg'}


def fire_model():
    """Flammen und Feuernester fürs Spiel (Ebene fireNests): je Flamme Fuss (Spielkoordinaten, m), Höhe, Breite (m)
    und ein Zufallswert; je Nest Mitte und Zahl der Flammen"""
    P, Hf, Wf = flame_points()
    seed = np.random.default_rng(9).random(len(P))
    q = lambda v, d=2: round(float(v), d)
    flames = [[q(P[i][0]), q(P[i][2]), q(-P[i][1]), q(Hf[i]), q(Wf[i]), q(seed[i], 3)] for i in range(len(P))]
    Nn = NESTS
    r, _ = surface(Nn['th'], Nn['h'], columns(Nn['th']))
    nests = [[q(r[i] * math.sin(Nn['th'][i])), q(LAVA_Z + Nn['h'][i]), q(-r[i] * math.cos(Nn['th'][i])), int(Nn['k'][i])]
             for i in range(len(Nn['th']))]
    return {'flames': flames, 'nests': nests}


def export(stil='volcano'):
    """sky/<stil>/ebenen.json für pack.mjs: die Felsbrocken am Ufer (bakedMesh, Bild rocks.jpg, im HD-Teil
    rocks_hd.jpg) und die Flammen der Feuernester (fireNests). lavaPool rechnet alles andere selbst."""
    import json
    sky = os.path.join(ROOT, 'sky', stil)
    os.makedirs(sky, exist_ok=True)
    rocks = rock_model(sky, bake_rim_rocks(stil), stil)
    fires = fire_model()
    data = {'rocks': rocks, 'fires': fires, 'hd': {'rocks': {'texture': 'file:rocks_hd.jpg'}}}
    with open(os.path.join(sky, 'ebenen.json'), 'w', encoding='utf-8') as fh:
        json.dump(data, fh, separators=(',', ':'))
    return {'felsen_ecken': rocks['n'], 'flammen': len(fires['flames'])}
