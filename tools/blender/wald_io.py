# Bild-Ein-/Ausgabe über Blender (bpy): PNG/JPEG schreiben, EXR lesen.
import bpy
import numpy as np


def save_image(rgb, path, fmt='PNG', quality=92):
    """rgb: (H, W, 3) Anzeige-Werte 0..1 (schon sRGB-kodiert), Zeile 0 oben."""
    h, w, _ = rgb.shape
    img = bpy.data.images.new('out', w, h, alpha=False, float_buffer=False)
    px = np.ones((h, w, 4), np.float32)
    px[..., :3] = np.clip(rgb[::-1], 0, 1)
    img.pixels.foreach_set(px.ravel())
    img.filepath_raw = path
    img.file_format = fmt
    if fmt == 'JPEG':
        sc = bpy.context.scene
        sc.render.image_settings.file_format = 'JPEG'
        sc.render.image_settings.quality = quality
        sc.render.image_settings.color_management = 'OVERRIDE'
        sc.render.image_settings.view_settings.view_transform = 'Standard'
        img.save_render(path, scene=sc)
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
