"""Build V4-only start wipes from the user's local opaque black-on-white MOV pack.
Build-time only: Pillow and ffmpeg. Existing effects and classic transition are untouched.
Usage: python tools/build-start-transitions.py PACK [--ffmpeg PATH]
"""
import argparse, hashlib, json, shutil, subprocess
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
p=argparse.ArgumentParser();p.add_argument('pack',type=Path);p.add_argument('--ffmpeg',type=Path);a=p.parse_args()
root=Path(__file__).resolve().parents[1]
ffmpeg=str(a.ffmpeg or shutil.which('ffmpeg') or root/'work/builddeps/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe')
if not Path(ffmpeg).exists(): raise SystemExit('Pass --ffmpeg with a local executable')
# Ten visually different spreads, retaining the supplied source names and hashes.
selection=[1,3,5,8,10,13,17,21,29,35]
out=root/'assets/effects/start';out.mkdir(parents=True,exist_ok=True)
w,h,columns,count,duration=256,135,6,36,2
manifest=[];sheet=Image.new('RGB',(w*3,(h+20)*len(selection)), '#eee5d1');label=ImageDraw.Draw(sheet)
for index,number in enumerate(selection,1):
    relative=f'Transitions/Version 1/LookAE Ink Transition (V1) ({number}).mov';source=a.pack/relative
    filters=f'fps={count/duration},scale={w}:{h}:flags=lanczos,format=gray'
    raw=subprocess.check_output([ffmpeg,'-v','error','-i',str(source),'-t',str(duration),'-vf',filters,'-frames:v',str(count),'-f','rawvideo','-pix_fmt','gray','pipe:1'])
    frames=min(count,len(raw)//(w*h))
    if frames!=count: raise RuntimeError(f'{source.name}: expected {count} frames, got {frames}')
    atlas=Image.new('RGBA',(columns*w,((frames+columns-1)//columns)*h));coverage=[]
    for frame in range(frames):
        gray=Image.frombytes('L',(w,h),raw[frame*w*h:(frame+1)*w*h]);alpha=ImageOps.invert(gray)
        coverage.append(sum(alpha.histogram()[i]*i for i in range(256))/(w*h*255))
        ink=Image.new('RGBA',(w,h),(31,29,25));ink.putalpha(alpha);atlas.paste(ink,((frame%columns)*w,(frame//columns)*h))
        if frame in [9,18,27]:
            col=[9,18,27].index(frame);tile=Image.new('RGBA',(w,h),'#eee5d1');tile.alpha_composite(ink);sheet.paste(tile.convert('RGB'),(col*w,(index-1)*(h+20)+20))
    label.text((5,(index-1)*(h+20)+3),f'{index:02d} / original V1({number})',fill='#38382d')
    target=out/f'start-{index:02d}.webp';atlas.save(target,lossless=True,method=6)
    entry=dict(id=f'start-{index:02d}',file=target.name,source=relative,sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),width=w,height=h,columns=columns,frames=frames,duration=duration,bytes=target.stat().st_size,decodedBytes=atlas.width*atlas.height*4,alphaCoverage=dict(first=coverage[0],middle=coverage[18],last=coverage[-1]))
    manifest.append(entry);print(f'{entry["id"]}: {entry["bytes"]} bytes, mean alpha first/mid/end {coverage[0]:.3f}/{coverage[18]:.3f}/{coverage[-1]:.3f}')
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
(root/'work').mkdir(exist_ok=True);sheet.save(root/'work/start-transition-contact.png')
print('TOTAL',sum(v['bytes'] for v in manifest),'bytes; decoded RGBA upper bound',sum(v['decodedBytes'] for v in manifest))
