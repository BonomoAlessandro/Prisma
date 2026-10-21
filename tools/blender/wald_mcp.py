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
import os, sys, time, importlib, importlib.util, runpy, contextlib, traceback
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)


def run(script, *args, stil='anime'):
    """Skript wie von der Kommandozeile ausführen (Argumente nach --)"""
    if script == 'wald_scene.py':
        raise ValueError('wald_scene.py setzt Blender zurück – neu() oder scene().replace_…() verwenden')
    os.environ['WALD_STIL'] = stil
    # Hilfsmodule frisch laden: Blender behält sie sonst mit dem Stand (und der Szene, WALD_STIL) des ersten Imports
    for name in ('wald_lib', 'wald_io', 'stile', 'wald_export'):
        if name in sys.modules:
            importlib.reload(sys.modules[name])
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
# Streifen rendern und malen; skybox() hängt noch trees.json an. Danach: node tools/blender/pack.mjs forest
ANIME = ([('wald_export.py', 'depth', 2048), ('wald_export.py', 'depthcode', 1024),
          ('wald_export.py', 'mask', 'mask_full', 'full', 4096)]
         + [('wald_export.py', 'mask', 'mask_band_%d' % i, 'band', i, 3, 4096) for i in range(3)]
         + [('wald_export.py', 'full', 4096, 64), ('anime.py', 'pano', 'full', 'full', 'mask_full')]
         + [('wald_export.py', 'band', i, 3, 4096, 32) for i in range(3)]
         + [('anime.py', 'bands', 3), ('anime.py', 'json', 3)])


def skybox(stil='anime'):
    """Alles für backgrounds/ aus der offenen Szene: ANIME, dann die Daten der Ebenen (Wald: die Fichten,
    sky/anime/trees.json; andere: export() der Szene, sky/<stil>/ebenen.json)"""
    def layers():
        if stil == 'anime':
            import wald_spielbaum
            print(wald_spielbaum.export('anime'), flush=True)
        else:
            print(scene(stil).export(stil), flush=True)

    from stile import stil as style
    todo = [s for s in ANIME if s[1] != 'mask' or style(stil).get('himmel') == 'mondnacht']   # Masken nur für den gemalten Himmel
    if style(stil).get('wasser') is not None:   # Wassermaske so fein wie das ganze Bild: Tiefe in dessen Breite
        todo = [('wald_export.py', 'depth', 4096) if s[:2] == ('wald_export.py', 'depth') else s for s in todo]
    steps = [(' '.join(map(str, s)), lambda s=s: run(*s, stil=stil)) for s in todo]
    return _later(stil, steps + [('export ' + stil, layers)])


def neu(stil='anime', path=None):
    """Szene ganz neu bauen und speichern (Wald: wie blender -b --factory-startup --python wald_scene.py, aber ohne
    Blender zurückzusetzen; andere: szenen/<stil>/szene.py -> <stil>.blend). Ersetzt die offene Datei: vorher
    speichern, was bleiben soll."""
    path = path or os.path.join(HERE, {'anime': 'wald_anime.blend', '': 'wald.blend'}.get(stil, stil + '.blend'))

    def make():
        bpy.ops.wm.read_homefile(use_empty=True, use_factory_startup=True, load_ui=False)
        scene(stil).build()
        bpy.ops.wm.save_as_mainfile(filepath=path, compress=True)

    return _later(stil, [('neu ' + path, make)])


def scene(stil='anime'):
    """Baumodul der Szene frisch geladen (ohne Aufbau), für replace_…(): der Wald wald_scene.py, andere
    szenen/<stil>/szene.py"""
    os.environ['WALD_STIL'] = stil
    import wald_lib, wald_spielbaum, wald_scene
    importlib.reload(wald_lib)
    importlib.reload(wald_spielbaum)
    ws = importlib.reload(wald_scene)
    if stil in ('', 'anime'):
        return ws
    spec = importlib.util.spec_from_file_location('szene_' + stil, os.path.join(HERE, 'szenen', stil, 'szene.py'))
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod
