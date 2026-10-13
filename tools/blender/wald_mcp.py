# Führt die Wald-Skripte in der offenen Blender-Sitzung aus, über den Blender-MCP (Werkzeug execute_blender_code).
# Blender muss mit dem MCP-Add-on laufen (Online-Zugriff an, z. B. blender --online-mode wald_anime.blend).
#   import sys; sys.path.insert(0, r'C:\...\tools\blender'); import wald_mcp
#   wald_mcp.run('wald_render.py', 'view', 0, 0, 1440, 900, 32, 'b1_t0')   # wie blender -b … --python wald_render.py -- …
#   wald_mcp.run('anime.py', 'test', 'b1_t0')
#   wald_mcp.scene().replace_trees()                                        # Bäume mit den Werten aus wald_scene.py
#   wald_mcp.start([('wald_export.py', 'full', 4096, 64), ('anime.py', 'pano', 'full', 'full', 'mask_full')])
#   wald_mcp.neu('anime')                                                   # Szene ganz neu bauen (wald_anime.blend)
#   wald_mcp.skybox()                                                       # alles neu rendern und malen (ANIME unten)
# start() ist für alles, was länger als die 300 s eines MCP-Aufrufs dauert: Der Aufruf kehrt sofort zurück, danach
# arbeitet Blender die Schritte der Reihe nach ab (die Oberfläche steht so lange still, auch der MCP antwortet erst
# danach wieder). Fortschritt in out/<stil>/mcp.log (START/FERTIG/FEHLER je Schritt, am Ende ALLES FERTIG).
# stil: wie WALD_STIL ('anime' oder '' für die realistische Fassung). wald_scene.py selbst nie mit run() ausführen: Es
# setzt Blender zurück (und damit auch das MCP-Add-on); dafür gibt es neu().
import os, sys, time, importlib, runpy, contextlib, traceback
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)


def run(script, *args, stil='anime'):
    """Skript wie von der Kommandozeile ausführen (Argumente nach --)"""
    if script == 'wald_scene.py':
        raise ValueError('wald_scene.py setzt Blender zurück – neu() oder scene().replace_…() verwenden')
    os.environ['WALD_STIL'] = stil
    old = sys.argv
    sys.argv = [bpy.app.binary_path, '--', *map(str, args)]
    try:
        runpy.run_path(os.path.join(HERE, script), run_name='__main__')
    finally:
        sys.argv = old


def _later(stil, steps):
    """Schritte [(text, funktion), …] nach dem MCP-Aufruf nacheinander ausführen; Protokoll in out/<stil>/mcp.log"""
    log = os.path.join(HERE, 'out', stil, 'mcp.log')
    os.makedirs(os.path.dirname(log), exist_ok=True)

    def job():
        with open(log, 'a', encoding='utf-8') as fh, contextlib.redirect_stdout(fh):
            for text, fn in steps:
                t0 = time.time()
                print(time.strftime('%H:%M:%S'), 'START', text, flush=True)
                try:
                    fn()
                except Exception:
                    traceback.print_exc(file=fh)
                    print(time.strftime('%H:%M:%S'), 'FEHLER', text, flush=True)
                    return None
                print(time.strftime('%H:%M:%S'), 'FERTIG', text, '%.0f s' % (time.time() - t0), flush=True)
            print(time.strftime('%H:%M:%S'), 'ALLES FERTIG', flush=True)
        return None

    bpy.app.timers.register(job, first_interval=0.5, persistent=True)   # persistent: neu() lädt eine andere Datei
    return log


def start(steps, stil='anime'):
    """Skripte [(skript, arg, …), …] nach dem MCP-Aufruf nacheinander ausführen"""
    steps = [tuple(s) for s in steps]
    return _later(stil, [(' '.join(map(str, s)), lambda s=s: run(*s, stil=stil)) for s in steps])


# Ganze Anime-Skybox aus der offenen Szene (rund 30 min mit einer RTX A2000): Tiefe, Himmelsmasken, Panorama und
# Streifen rendern und malen; skybox() hängt noch trees.json an. Danach: node tools/blender/pack.mjs anime
ANIME = ([('wald_export.py', 'depth', 2048), ('wald_export.py', 'depthcode', 1024),
          ('wald_export.py', 'mask', 'mask_full', 'full', 4096)]
         + [('wald_export.py', 'mask', 'mask_band_%d' % i, 'band', i, 3, 4096) for i in range(3)]
         + [('wald_export.py', 'full', 4096, 64), ('anime.py', 'pano', 'full', 'full', 'mask_full')]
         + [('wald_export.py', 'band', i, 3, 4096, 32) for i in range(3)]
         + [('anime.py', 'bands', 3), ('anime.py', 'json', 3)])


def skybox():
    """Alles für backgrounds/ (Anime-Fassung): ANIME, dann die Fichten fürs Spiel (sky/anime/trees.json)"""
    def trees():
        import wald_spielbaum
        print(wald_spielbaum.export('anime'), flush=True)

    steps = [(' '.join(map(str, s)), lambda s=s: run(*s, stil='anime')) for s in ANIME]
    return _later('anime', steps + [('wald_spielbaum.export anime', trees)])


def neu(stil='anime', path=None):
    """Szene mit wald_scene.py ganz neu bauen und speichern (wie blender -b --factory-startup --python wald_scene.py,
    aber ohne Blender zurückzusetzen). Ersetzt die offene Datei: vorher speichern, was bleiben soll."""
    path = path or os.path.join(HERE, 'wald_anime.blend' if stil == 'anime' else 'wald.blend')

    def make():
        bpy.ops.wm.read_homefile(use_empty=True, use_factory_startup=True, load_ui=False)
        scene(stil).build()
        bpy.ops.wm.save_as_mainfile(filepath=path, compress=True)

    return _later(stil, [('neu ' + path, make)])


def scene(stil='anime'):
    """wald_scene.py frisch geladen (ohne Aufbau), für replace_trees(), replace_volumes() usw."""
    os.environ['WALD_STIL'] = stil
    import wald_lib, wald_spielbaum, wald_scene
    importlib.reload(wald_lib)
    importlib.reload(wald_spielbaum)
    return importlib.reload(wald_scene)
