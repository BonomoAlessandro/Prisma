# PNG -> JPG (optional verkleinert): blender -b --python tojpg.py -- <ein.png> <aus.jpg> [max_breite]
import bpy, sys
a = sys.argv[sys.argv.index('--') + 1:]
img = bpy.data.images.load(a[0])
if len(a) > 2 and img.size[0] > int(a[2]):
    w = int(a[2]); img.scale(w, int(img.size[1] * w / img.size[0]))
sc = bpy.context.scene
sc.render.image_settings.file_format = 'JPEG'
sc.render.image_settings.quality = 90
sc.view_settings.view_transform = 'Standard'
img.save_render(a[1], scene=sc)
print('JPG', a[1], img.size[:])
