"""Rebuild browser alpha atlases from the supplied local Ink Matte pack.
Build-only dependencies: Pillow and ffmpeg (or imageio-ffmpeg). No runtime dependency.
Usage: python tools/build-ink-mattes.py "D:/ink_game/Ink Matte (HD Set 1)"
"""
import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from PIL import Image, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument('pack', type=Path)
args = parser.parse_args()
ffmpeg = shutil.which('ffmpeg')
if not ffmpeg:
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
out = Path(__file__).resolve().parents[1] / 'assets' / 'effects'
out.mkdir(parents=True, exist_ok=True)
selected = [
    ('drops', 'Drops/LookAE Ink Drops (1).mov', 160, 160, 8, 32, 3.2),
    ('transition', 'Transitions/Version 1/LookAE Ink Transition (V1) (1).mov', 320, 169, 6, 36, 2),
]
manifest = []
for name, relative, width, height, columns, count, duration in selected:
    source = args.pack / relative
    filters = f'fps={count/duration},scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:color=white'
    raw = subprocess.check_output([ffmpeg, '-v', 'error', '-i', str(source), '-t', str(duration), '-vf', filters, '-frames:v', str(count), '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1'])
    count = min(count, len(raw) // (width*height))
    atlas = Image.new('RGBA', (columns*width, ((count+columns-1)//columns)*height))
    for i in range(count):
        gray = Image.frombytes('L', (width, height), raw[i*width*height:(i+1)*width*height])
        ink = Image.new('RGBA', (width, height), (31, 29, 25))
        ink.putalpha(ImageOps.invert(gray))  # Originals are opaque black-on-white, not alpha video.
        atlas.paste(ink, ((i % columns)*width, (i // columns)*height))
    target = out / f'{name}.webp'
    atlas.save(target, lossless=True, method=6)
    manifest.append(dict(id=name, source=relative, sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(), codec='H.264 High, yuv420p, opaque black-on-white', originalSize=[2048,1080], originalFps='59.94', width=width, height=height, columns=columns, frames=count, duration=duration, bytes=target.stat().st_size))
(out / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
