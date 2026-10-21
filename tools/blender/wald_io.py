# Bild-Ein-/Ausgabe über Blender (bpy): PNG/JPEG schreiben, EXR lesen.
import bpy
import numpy as np


def save_image(rgb, path, fmt='PNG', quality=92, bw=False):
    """rgb: (H, W, 3) Anzeige-Werte 0..1 (schon sRGB-kodiert), Zeile 0 oben. bw: PNG in Graustufen (Masken)."""
    h, w, _ = rgb.shape
    img = bpy.data.images.new('out', w, h, alpha=False, float_buffer=False)
    px = np.ones((h, w, 4), np.float32)
    px[..., :3] = np.clip(rgb[::-1], 0, 1)
    img.pixels.foreach_set(px.ravel())
    img.filepath_raw = path
    img.file_format = fmt
    if fmt == 'JPEG' or bw:
        st = bpy.context.scene.render.image_settings
        keep = {k: getattr(st, k) for k in ('file_format', 'quality', 'color_mode', 'compression', 'color_management')}
        st.file_format = fmt
        st.quality = quality
        st.color_management = 'OVERRIDE'
        st.view_settings.view_transform = 'Standard'
        st.color_mode = 'BW' if bw else 'RGB'
        if bw:
            st.compression = 100
        try:
            img.save_render(path, scene=bpy.context.scene)
        finally:   # die Szene behält sonst die Einstellung (Graustufen machten alle folgenden Bilder grau)
            for k, v in keep.items():
                setattr(st, k, v)
    else:
        img.save()
    bpy.data.images.remove(img)


def load_exr(path):
    """-> (H, W, 4) float32, Zeile 0 oben, linear."""
    img = bpy.data.images.load(path, check_existing=False)
    img.colorspace_settings.name = 'Non-Color'
    w, h = img.size
    px = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(px)
    bpy.data.images.remove(img)
    return px.reshape(h, w, 4)[::-1].copy()
