# Fichten fürs Spiel: Die Bäume nahe am Brett zeigt das Panorama nicht (aus seinem Mittelpunkt gesehen lägen sie schräg,
# siehe PLAN 2.30); das Spiel zeichnet sie selbst. Hier entstehen die Modelle dafür, einfache Stufen-Fichten (gezackte,
# hängende Astkränze, je rund 500 Dreiecke) im Umriss der Blender-Fichten, und die Liste der Standorte.
# Über den Blender-MCP (siehe wald_mcp.py):
#   import wald_spielbaum as sb
#   sb.preview()            # Modelle in der Sammlung „Spielbaeume“ (nicht gerendert) zum Ansehen
#   sb.export()             # sky/<stil>/trees.json für pack.mjs
import os, sys, json
import numpy as np
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

R_NEAR = 60.0   # Bäume näher am Brett (waagrecht, in m) zeichnet das Spiel, weiter weg zeigt sie das Panorama
VARIANTS = 4


def spruce_tiers(seed):
    """Stufen-Fichte der Höhe 1 (Fuss bei z = 0): Stamm, darüber Astkränze aus gezackten Kegeln, oben die Spitze.
    -> Ecken (N, 3), Normalen (N, 3), Dreiecke (M, 3). Normalen weich nach aussen und oben: Für die Stufen im Toon-Licht
    zählt die Form der Krone, nicht die einzelne Fläche."""
    rng = np.random.default_rng(seed)
    V, N, F = [], [], []

    def add(verts, normals, tris):
        o = sum(len(v) for v in V)
        V.append(np.asarray(verts, float)); N.append(np.asarray(normals, float)); F.append(np.asarray(tris, int) + o)

    # Stamm (sechseckig, unten unter der Krone sichtbar)
    a = np.arange(6) * np.pi / 3
    ring = np.c_[np.cos(a), np.sin(a), np.zeros(6)]
    verts = np.r_[ring * [0.022, 0.022, 0] + [0, 0, -0.06], ring * [0.016, 0.016, 0] + [0, 0, 0.2]]
    tris = [[i, (i + 1) % 6, 6 + (i + 1) % 6] for i in range(6)] + [[i, 6 + (i + 1) % 6, 6 + i] for i in range(6)]
    add(verts, np.r_[ring, ring], tris)

    tiers = int(rng.integers(10, 14))
    top = 0.9
    z_att = np.linspace(0.08 + 0.03 * rng.random(), top, tiers)  # wo der Kranz am Stamm ansetzt (oben)
    t = (z_att - 0.04) / 0.96
    r_tip = 0.205 * (1 - t) ** 0.8 * rng.uniform(0.82, 1.12, tiers) + 0.02  # säulig-kegelig wie die Blender-Fichten
    for i in range(tiers):
        m = int(rng.integers(9, 13))                              # Astspitzen im Kranz
        drop = (0.12 + 0.04 * rng.random()) * (1.0 - 0.45 * i / tiers)  # wie tief der Kranz hängt (überlappt den nächsten)
        zt, rt = z_att[i], r_tip[i]
        phase = rng.uniform(0, 2 * np.pi)
        ang = phase + np.arange(2 * m) * np.pi / m + rng.normal(0, 0.07, 2 * m)
        tipk = np.arange(2 * m) % 2 == 0
        rad = np.where(tipk, rt * rng.uniform(0.88, 1.15, 2 * m), rt * rng.uniform(0.5, 0.68, 2 * m))
        zr = zt - drop * np.where(tipk, 1.0, 0.7) * rng.uniform(0.85, 1.15, 2 * m)
        rim = np.c_[rad * np.cos(ang), rad * np.sin(ang), zr]
        apex = [0, 0, zt + 0.015]
        under = [0, 0, zt - 0.45 * drop]                          # Unterseite: flacher Kegel zum Stamm
        verts = np.r_[[apex], rim, [under]]
        out = np.c_[np.cos(ang), np.sin(ang), np.full(2 * m, 0.9)]
        out /= np.linalg.norm(out, axis=1)[:, None]
        normals = np.r_[[[0, 0, 1]], out, [[0, 0, -1]]]
        j = np.arange(2 * m); j1 = (j + 1) % (2 * m)
        tris = np.r_[np.c_[np.zeros(2 * m, int), 1 + j, 1 + j1],                       # Oberseite
                     np.c_[1 + j1, 1 + j, np.full(2 * m, 1 + 2 * m)]]                 # Unterseite
        add(verts, normals, tris)
    # Spitze
    tip = np.c_[0.03 * np.cos(a), 0.03 * np.sin(a), np.full(6, top)]
    verts = np.r_[[[0, 0, 1.0]], tip]
    normals = np.r_[[[0, 0, 1]], np.c_[np.cos(a), np.sin(a), np.full(6, 0.6)] / np.sqrt(1.36)]
    add(verts, normals, [[0, 1 + i, 1 + (i + 1) % 6] for i in range(6)])
    return np.concatenate(V), np.concatenate(N), np.concatenate(F)


def preview(n=VARIANTS):
    """Modelle als Objekte sp00 … in der Sammlung „Spielbaeume“ (vom Rendern ausgeschlossen)"""
    sc = bpy.context.scene
    coll = bpy.data.collections.get('Spielbaeume') or bpy.data.collections.new('Spielbaeume')
    if coll.name not in sc.collection.children:
        sc.collection.children.link(coll)
    for lc in bpy.context.view_layer.layer_collection.children:
        if lc.collection == coll:
            lc.exclude = True
    stats = []
    for k in range(n):
        V, N, F = spruce_tiers(2000 + k)
        name = 'sp%02d' % k
        if name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[name])
        if name in bpy.data.meshes:
            bpy.data.meshes.remove(bpy.data.meshes[name])
        me = bpy.data.meshes.new(name)
        me.from_pydata(V.tolist(), [], F.tolist())
        me.update()
        me.normals_split_custom_set_from_vertices(N.tolist())
        me.materials.append(bpy.data.materials['Nadeln'])
        coll.objects.link(bpy.data.objects.new(name, me))
        stats.append(len(F))
    return stats


def moonlight(p, pos, scl, moon, terrain):
    """Anteil Mondlicht an den Punkten p (K, 3): Strahl zum Mond gegen das Gelände (abgetastet) und gegen die Kronen
    der Bäume pos/scl (Kegel, Fuss bis Spitze; Radius wie die Modelle, 0.2 × Breite)"""
    lit = np.ones(len(p))
    for t in np.geomspace(0.5, 400, 160):                        # Gelände
        q = p + t * moon
        lit = np.where(terrain(q[:, 0], q[:, 1]) > q[:, 2] + 0.05, 0.0, lit)
    mh = moon[:2] / np.linalg.norm(moon[:2])
    k = np.linalg.norm(moon[:2])                                 # waagrechter Anteil je Strahllänge
    for i0 in range(0, len(p), 256):                             # Kronen, in Blöcken (Speicher)
        P = p[i0:i0 + 256, None, :]
        d = pos[None, :, :2] - P[..., :2]
        s = d @ mh                                               # waagrechter Weg bis zum nächsten Punkt am Stamm
        miss = np.abs(d @ np.array([-mh[1], mh[0]]))
        z = P[..., 2] + s / k * moon[2]                          # Höhe des Strahls dort
        f = (z - pos[None, :, 2]) / scl[None, :, 2]              # 0 Fuss … 1 Spitze
        r = 0.2 * scl[None, :, 0] * (1 - np.clip(f, 0, 1)) ** 0.9
        hit = (s > 0.3) & (f > 0.02) & (f < 1) & (miss < r)
        lit[i0:i0 + 256] *= ~hit.any(1)
    return lit


def near_trees(stil_scene):
    """Bäume näher als R_NEAR aus wald_scene.tree_points(): Spielkoordinaten (x, y, z) des Fusses, Höhe, Breite,
    Drehung um die Hochachse, Modell, Mondlicht unten und oben an der Krone (0 … 1, je Mittel aus drei Punkten),
    Helligkeit, Oberkante des Nebels am Baum (Höhe im Spiel; der Nebel der Szene, siehe wald_scene.mat_fog)"""
    from wald_lib import terrain, fog_top
    pos, var, scl, rot = stil_scene.tree_points()
    rr = np.hypot(pos[:, 0], pos[:, 1])
    sel = rr < R_NEAR
    p, v, s, r = pos[sel], var[sel], scl[sel], rot[sel]
    occ = rr < R_NEAR + 40                                       # Schattenwerfer, auch knapp ausserhalb
    moon = np.array(stil_scene.MOON)
    light = []
    for fs in ((0.15, 0.3, 0.45), (0.6, 0.75, 0.9)):
        pts = np.concatenate([p + np.c_[np.zeros((len(p), 2)), f * s[:, 2]] for f in fs])
        # vom Stamm zum Mond hin aus der eigenen Krone heraus
        crown = 0.2 * np.tile(s[:, 0], len(fs)) * (1 - 0.9 * np.repeat(fs, len(p)))
        pts[:, :2] += 1.1 * crown[:, None] * moon[:2] / np.linalg.norm(moon[:2])
        light.append(moonlight(pts, pos[occ], scl[occ], moon, terrain).reshape(3, -1).mean(0))
    rng = np.random.default_rng(3)
    shade = rng.uniform(0.85, 1.12, len(p))
    fog = fog_top(p[:, 0], p[:, 1]) - stil_scene.FOG_DROP
    game = np.c_[p[:, 0], p[:, 2], -p[:, 1]]                     # Blender (x, y, z) -> Spiel (x, z, −y)
    return [[round(float(g[0]), 3), round(float(g[1]), 3), round(float(g[2]), 3), round(float(si[2]), 3),
             round(float(si[0]), 3), round(float(ri[2]), 3), int(vi) % VARIANTS, round(float(lo), 2), round(float(hi), 2),
             round(float(sh), 2), round(float(f), 2)]
            for g, si, ri, vi, lo, hi, sh, f in zip(game, s, r, v, light[0], light[1], shade, fog)]


def export(stil='anime'):
    """sky/<stil>/trees.json: Modelle (Spielkoordinaten, y oben) und Standorte der nahen Bäume"""
    import wald_mcp
    ws = wald_mcp.scene(stil)
    models = []
    for k in range(VARIANTS):
        V, N, F = spruce_tiers(2000 + k)
        V = np.c_[V[:, 0], V[:, 2], -V[:, 1]]; N = np.c_[N[:, 0], N[:, 2], -N[:, 1]]
        models.append({'pos': np.round(V, 4).ravel().tolist(), 'nrm': np.round(N, 3).ravel().tolist(),
                       'idx': F.ravel().tolist()})   # (x, z, −y) ist eine Drehung: Umlaufsinn bleibt
    trees = near_trees(ws)
    path = os.path.join(HERE, 'sky', stil, 'trees.json')
    # Nebel wie in der Szene: Dichte (je m) im weichen Saum über der Oberkante und im Kern darunter; mittlere Oberkante
    fog = {'soft': [2.5, -1.0, ws.FOG_SOFT], 'core': [-0.5, -5.0, ws.FOG_CORE], 'top': ws.FOG_TOP}
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump({'rNear': R_NEAR, 'fog': fog, 'models': models, 'trees': trees}, fh, separators=(',', ':'))
    return {'pfad': path, 'baeume': len(trees), 'dreiecke': [len(m['idx']) // 3 for m in models]}
