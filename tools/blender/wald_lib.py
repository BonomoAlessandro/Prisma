# Bausteine für die Blender-Szene „Wald“ (Hintergrund von Prisma, siehe wald_export.py): Rauschen, Gelände, Fichten,
# Tonkurve wie im Spiel.
# Koordinaten in Blender (Z oben). Spiel (x, y, z) -> Blender (x, -z, y). Das Brett liegt im Ursprung, Ebene z = 0.
import math
import numpy as np

# ---------------------------------------------------------------- Rauschen

class Perlin:
    def __init__(self, seed):
        rng = np.random.default_rng(seed)
        self.p = np.concatenate([rng.permutation(256)] * 2).astype(np.int64)
        a = rng.uniform(0, 2 * np.pi, 256)
        self.g = np.stack([np.cos(a), np.sin(a)], -1)

    def __call__(self, x, y):
        x0 = np.floor(x); y0 = np.floor(y)
        fx = x - x0; fy = y - y0
        ix = x0.astype(np.int64) & 255; iy = y0.astype(np.int64) & 255
        ix1 = (ix + 1) & 255; iy1 = (iy + 1) & 255
        p, g = self.p, self.g

        def d(i, j, dx, dy):
            h = p[p[i] + j]
            return g[h, 0] * dx + g[h, 1] * dy

        u = fx * fx * fx * (fx * (fx * 6 - 15) + 10)
        v = fy * fy * fy * (fy * (fy * 6 - 15) + 10)
        a = d(ix, iy, fx, fy); b = d(ix1, iy, fx - 1, fy)
        c = d(ix, iy1, fx, fy - 1); e = d(ix1, iy1, fx - 1, fy - 1)
        ab = a + (b - a) * u
        ce = c + (e - c) * u
        return (ab + (ce - ab) * v) * 1.42


_ROT = [(math.cos(k * 1.07 + 0.3), math.sin(k * 1.07 + 0.3)) for k in range(12)]


def fbm(n, x, y, octaves=4, lac=2.03, gain=0.5):
    s = 0.0; a = 1.0; norm = 0.0; f = 1.0
    for k in range(octaves):
        c, si = _ROT[k]
        s = s + a * n((x * c - y * si) * f + 17.3 * k, (x * si + y * c) * f - 9.1 * k)
        norm += a; a *= gain; f *= lac
    return s / norm


def ridged(n, x, y, octaves=5, lac=2.05, gain=0.5):
    """Grate: 1 auf den Kämmen, Details vor allem auf den Kämmen (Multifraktal)."""
    s = 0.0; a = 1.0; norm = 0.0; f = 1.0; w = 1.0
    for k in range(octaves):
        c, si = _ROT[k]
        v = 1 - np.abs(n((x * c - y * si) * f + 17.3 * k, (x * si + y * c) * f - 9.1 * k))
        v = v * v
        s = s + a * v * w
        norm += a
        w = np.clip(v * 1.6, 0, 1)
        a *= gain; f *= lac
    return s / norm


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def smax(a, b, k):
    h = np.clip(0.5 + 0.5 * (a - b) / k, 0.0, 1.0)
    return b + (a - b) * h + k * h * (1 - h)


# ---------------------------------------------------------------- Gelände

FOG = -16.0  # Oberkante des Nebelmeers (im Mittel)
N1, N2, N3, N4, N5, N6 = (Perlin(s) for s in (11, 23, 37, 41, 53, 67))


def terrain(x, y):
    """Höhe des Geländes. Ein Grat zieht ungefähr von West nach Ost (zum Mond hin) durch die Kuppe unter dem Brett,
    nach Norden und Süden fällt der Hang in Täler mit Nebel; ringsum Kämme, die aus dem Nebel ragen, fern höhere Berge."""
    x = np.asarray(x, dtype=np.float64); y = np.asarray(y, dtype=np.float64)
    r = np.hypot(x, y)
    wx = x + 38 * fbm(N1, x / 260, y / 260, 3)
    wy = y + 38 * fbm(N1, x / 260 + 31.7, y / 260 - 12.9, 3)
    R = ridged(N2, wx / 170, wy / 170, 5)
    e = R - 0.70                                         # gut ein Viertel der Fläche ragt aus dem Nebel
    hills = FOG - 2 + np.where(e > 0, 42 * e, 45 * e)
    hills -= 18 * (1 - smoothstep(15, 60, r))           # nahe am Brett tiefer: die Kuppe steht frei
    # fern höhere Berge (Silhouetten in Schichten); ihre Täler bleiben im Nebel
    far = smoothstep(220, 1500, r)
    m = smoothstep(0.55, 0.97, ridged(N3, wx / 540, wy / 540, 5))
    hills = smax(hills, -60 + far * (38 + 80 * m ** 1.4), 12)
    # Gebirge am Horizont (ab gut 1 km): schroffe Grate bis gut 400 m, oben Schnee (Material); zum Rand des Geländes hin
    # wieder flacher, sonst bräche es dort ab
    alp = smoothstep(1000, 2100, r) * (1 - smoothstep(2900, 3300, r))
    g = ridged(N6, wx / 1000 + 7.1, wy / 1000 - 3.3, 5)
    hills = smax(hills, -40 + alp * (60 + 400 * g ** 2.2) - 400 * (1 - alp), 20)   # nah: wirkungslos
    # Grat durch das Brett (West–Ost), leicht geschwungen
    v = y - 10 * np.sin(x / 45) - 6 * fbm(N4, x / 90, 0.37, 2)
    av = np.abs(v)
    ridge = -10 - 0.05 * np.abs(x) - 0.38 * np.maximum(av - 4.5, 0) - 0.003 * np.maximum(av - 4.5, 0) ** 2
    z = smax(ridge, hills, 9)
    # kleinere Formen: Kuppen, Mulden, Felsrippen, feine Unebenheit
    det = smoothstep(6, 18, r)
    knolls = fbm(N5, x / 11, y / 11, 3) * 2.0
    ribs = np.clip(1 - np.abs(fbm(N4, x / 17 + 5, y / 17 - 7, 3)) * 2.2, 0, 1) ** 3 * 1.5
    micro = fbm(N6, x / 2.4, y / 2.4, 3) * 0.35
    near = 1 - smoothstep(300, 700, r)
    z = z + (knolls + ribs) * (0.35 + 0.65 * det) + micro * near
    # der Betrachter steht oben: ringsum bleibt alles unter ihm, erst fern steigen die Berge an
    z = np.minimum(z, -9.0 + 0.06 * np.maximum(r - 8, 0) + 0.2 * np.maximum(r - 300, 0))
    return z


def terrain_slope(x, y, h=0.4):
    dx = terrain(x + h, y) - terrain(x - h, y)
    dy = terrain(x, y + h) - terrain(x, y - h)
    return np.hypot(dx, dy) / (2 * h)   # Steigung (tan)


def fog_top(x, y):
    """Oberkante des Nebels: Wogen und lange Schlieren in Windrichtung (wie im Shader der Szene)."""
    F = (0.94, 0.34)
    q = x * F[0] + y * F[1]; p = -x * F[1] + y * F[0]
    return FOG + 1.4 * fbm(N3, x / 32, y / 32, 3) + 0.7 * fbm(N5, q / 90, p / 18, 2)


# ---------------------------------------------------------------- Rohre (vektorisiert)

def tubes(curves, radii, sides):
    """curves (N, K, 3), radii (N, K) -> verts (N*K*sides, 3), quads (M, 4). Offene Enden."""
    N, K, _ = curves.shape
    T = np.zeros_like(curves)
    T[:, 1:-1] = curves[:, 2:] - curves[:, :-2]
    T[:, 0] = curves[:, 1] - curves[:, 0]
    T[:, -1] = curves[:, -1] - curves[:, -2]
    T /= np.linalg.norm(T, axis=-1, keepdims=True) + 1e-12
    ref = np.where(np.abs(T[..., 2:3]) > 0.9, np.array([1.0, 0, 0]), np.array([0, 0, 1.0]))
    n1 = np.cross(T, ref); n1 /= np.linalg.norm(n1, axis=-1, keepdims=True) + 1e-12
    n2 = np.cross(T, n1)
    ang = np.arange(sides) * 2 * np.pi / sides
    ca, sa = np.cos(ang), np.sin(ang)
    V = curves[:, :, None, :] + radii[:, :, None, None] * (ca[None, None, :, None] * n1[:, :, None, :] + sa[None, None, :, None] * n2[:, :, None, :])
    verts = V.reshape(-1, 3)
    base = (np.arange(N) * K * sides)[:, None, None]
    k = np.arange(K - 1)[None, :, None]
    m = np.arange(sides)[None, None, :]
    m1 = (m + 1) % sides
    a = base + k * sides + m
    b = base + k * sides + m1
    c = base + (k + 1) * sides + m1
    d = base + (k + 1) * sides + m
    quads = np.stack(np.broadcast_arrays(a, b, c, d), -1).reshape(-1, 4)
    return verts, quads


# ---------------------------------------------------------------- Fichte

def spruce(seed, lod='hi'):
    """Fichte der Höhe 1 (Fuss im Ursprung). Liefert Liste von (verts, quads, material) – 0 Rinde, 1 Nadeln.
    Stamm, Astquirle mit Zwischenästen, je Ast Zweige zu beiden Seiten (hängend, unten mehr), dazu Seitentriebe."""
    rng = np.random.default_rng(seed)
    hi = lod == 'hi'
    cb = rng.uniform(0.03, 0.10)       # Kronenansatz
    R0 = rng.uniform(0.15, 0.185)      # Kronenradius unten
    shape = rng.uniform(0.82, 1.0)     # Kontur (1: Kegel)
    parts = []

    # Stamm
    K = 8
    zz = np.linspace(-0.04, 0.985, K)
    trunk = np.stack([np.zeros(K), np.zeros(K), zz], -1)[None]
    lean = rng.normal(0, 0.012, 2)
    trunk[0, :, 0] += lean[0] * zz ** 2; trunk[0, :, 1] += lean[1] * zz ** 2
    v, q = tubes(trunk, np.linspace(0.021, 0.002, K)[None], 6 if hi else 4)
    parts.append((v, q, 0))

    axis_x = lambda z: lean[0] * z * z
    axis_y = lambda z: lean[1] * z * z

    branch_curves = []; branch_r = []
    twig_curves = []; twig_r = []
    KB = 7 if hi else 5

    def add_branch(z0, phi, L, t, minor=False):
        a0 = math.radians(np.interp(t, [0, 0.6, 1], [-10, 12, 42]) + rng.normal(0, 6))
        droop = np.interp(t, [0, 1], [0.62, 0.10]) * rng.uniform(0.75, 1.25) * (0.6 if minor else 1)
        s = np.linspace(0, 1, KB)
        bend = rng.normal(0, 0.18)
        ph = phi + bend * s * s
        d = L * s * math.cos(a0)
        z = z0 + L * (math.sin(a0) * s - droop * s * s * (1.25 - s))
        x0, y0 = axis_x(z0), axis_y(z0)
        c = np.stack([x0 + d * np.cos(ph), y0 + d * np.sin(ph), z], -1)
        branch_curves.append(c)
        branch_r.append(np.linspace(0.0045 + 0.012 * L, 0.0012, KB))
        # Zweige
        T = np.gradient(c, axis=0); T /= np.linalg.norm(T, axis=1, keepdims=True)
        n_side = int(np.interp(L, [0.02, R0], [4, 16 if hi else 5]))
        if n_side < 2:
            return
        ss = np.sort(rng.uniform(0.1, 0.97, 2 * n_side))
        hang = np.interp(t, [0, 0.7, 1], [1.05, 0.55, 0.2]) * rng.uniform(0.7, 1.2)
        for j, sj in enumerate(ss):
            i = min(int(sj * (KB - 1)), KB - 2); f = sj * (KB - 1) - i
            P = c[i] * (1 - f) + c[i + 1] * f
            Tj = T[i] * (1 - f) + T[i + 1] * f; Tj /= np.linalg.norm(Tj)
            side = 1 if j % 2 == 0 else -1
            S = np.cross(Tj, (0, 0, 1)); S /= (np.linalg.norm(S) + 1e-9); S *= side
            if rng.random() < 0.18:  # einige Triebe obenauf
                alpha = math.radians(rng.uniform(15, 40)); beta = -math.radians(rng.uniform(10, 35))
            else:
                alpha = math.radians(rng.uniform(48, 78)); beta = hang * rng.uniform(0.6, 1.25)
            Dh = Tj * math.cos(alpha) + S * math.sin(alpha)
            D = Dh * math.cos(beta) - np.array([0, 0, 1.0]) * math.sin(beta)
            lt = L * np.interp(sj, [0, 1], [0.46, 0.13]) * rng.uniform(0.7, 1.15)
            u = np.linspace(0, 1, 5 if hi else 3)[:, None]
            tw = P + D * lt * u - np.array([0, 0, 1.0]) * lt * 0.28 * u * u
            twig_curves.append(tw)
            rr = (0.0075 if hi else 0.012) * (0.8 + 0.6 * min(L / R0, 1))
            twig_r.append(np.linspace(rr, rr * 0.45, len(u)))
            if hi and lt > 0.035:
                # Seitentriebe: geben dem Rand die Fransen
                for k2 in range(rng.integers(2, 4)):
                    uu = rng.uniform(0.3, 0.8)
                    Q = P + D * lt * uu - np.array([0, 0, 1.0]) * lt * 0.28 * uu * uu
                    S2 = np.cross(D, (0, 0, 1)); S2 /= (np.linalg.norm(S2) + 1e-9)
                    S2 *= (1 if k2 % 2 else -1)
                    D2 = D * 0.55 + S2 * 0.75 - np.array([0, 0, 1.0]) * rng.uniform(0.1, 0.6)
                    D2 /= np.linalg.norm(D2)
                    l2 = lt * rng.uniform(0.25, 0.42)
                    u2 = np.linspace(0, 1, 3)[:, None]
                    twig_curves_small.append(Q + D2 * l2 * u2 - np.array([0, 0, 1.0]) * l2 * 0.2 * u2 * u2)

    twig_curves_small = []
    z = cb
    whorls = []
    while z < 0.95:
        whorls.append(z)
        z += rng.uniform(0.026, 0.04) * (1 - 0.3 * z) * (1.0 if hi else 1.7)
    for zw in whorls:
        t = (zw - cb) / (1 - cb)
        Lmax = R0 * (1 - t) ** shape * 1.05 + 0.018
        nb = int(rng.integers(5, 8)) if hi else int(rng.integers(4, 6))
        phi0 = rng.uniform(0, 2 * np.pi)
        for b in range(nb):
            add_branch(zw, phi0 + 2 * np.pi * b / nb + rng.normal(0, 0.25), Lmax * rng.uniform(0.72, 1.08), t)
        if hi:
            for b in range(int(rng.integers(2, 5))):
                add_branch(zw + rng.uniform(0.25, 0.75) * 0.03, rng.uniform(0, 2 * np.pi), Lmax * rng.uniform(0.3, 0.6), t, minor=True)
    # Leittrieb mit kurzen Trieben
    top = np.array([[axis_x(0.94), axis_y(0.94), 0.94], [axis_x(1.0), axis_y(1.0), 1.0]])
    twig_curves.append(np.linspace(top[0], top[1], 5 if hi else 3))
    twig_r.append(np.linspace(0.006, 0.002, 5 if hi else 3))

    v, q = tubes(np.array(branch_curves), np.array(branch_r), 3)
    parts.append((v, q, 0 if hi else 1))
    # Zweige nach Punktzahl gruppiert
    by_len = {}
    for cv, rv in zip(twig_curves, twig_r):
        by_len.setdefault(len(cv), ([], []))
        by_len[len(cv)][0].append(cv); by_len[len(cv)][1].append(rv)
    for _, (cv, rv) in by_len.items():
        v, q = tubes(np.array(cv), np.array(rv), 3)
        parts.append((v, q, 1))
    if twig_curves_small:
        cv = np.array(twig_curves_small)
        rv = np.tile(np.array([0.0048, 0.0036, 0.0016]), (len(cv), 1))
        v, q = tubes(cv, rv, 3)
        parts.append((v, q, 1))
    return parts


# ---------------------------------------------------------------- Bildausgabe (über Blender)

def srgb_encode(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def aces_game(c, exposure=1.0):
    """Wie der letzte Bildschritt des Spiels (acesFilmic, three.js): Linear -> Anzeige (linear, danach sRGB)."""
    c = c * exposure / 0.6
    inM = np.array([[0.59719, 0.35458, 0.04823], [0.07600, 0.90834, 0.01566], [0.02840, 0.13383, 0.83777]])
    outM = np.array([[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]])
    v = c @ inM.T
    a = v * (v + 0.0245786) - 0.000090537
    b = v * (0.983729 * v + 0.4329510) + 0.238081
    v = a / b
    return np.clip(v @ outM.T, 0, 1)
