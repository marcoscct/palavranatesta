import os
from PIL import Image

sizes = [48, 72, 96, 128, 192, 256, 512]
src = 'assets/icon.png'
dest_dir = 'icons'

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

if os.path.exists(src):
    try:
        with Image.open(src) as img:
            for s in sizes:
                out = img.resize((s, s), Image.Resampling.LANCZOS)
                out.save(f'{dest_dir}/icon-{s}.webp', 'WEBP')
                print(f'Generated icon-{s}.webp')
    except Exception as e:
        print(f"Error: {e}")
else:
    print(f'Source {src} not found. Please place icon.png in assets folder.')
