"""Create web delivery copies without changing the originals. Run after audit_assets.py."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json, subprocess, shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
records = json.loads((ROOT/'docs/asset-audit.json').read_text())
choices = {
 'Entertainment1': ('Character transitions / 01', 'Entertainment', 'A character-focused entertainment edit with layered frames and transitions.', ['Transitions', 'Layered frames'], 2),
 'Entertainment2': ('Character transitions / 02', 'Entertainment', 'An entertainment edit combining character footage, typography and comic imagery.', ['Typography', 'Compositing'], 1),
 'Entertainment3': ('Portraits in motion', 'Entertainment', 'A square-format character edit combining portrait frames, motion and type.', ['Layered frames', 'Typography'], 0),
 'Entertainment4': ('Character transitions / 03', 'Entertainment', 'A portrait-format entertainment edit built around character footage.', ['Pacing', 'Transitions'], 2),
 'Entertainment5': ('Character transitions / 04', 'Entertainment', 'A short portrait edit combining character footage and transitions.', ['Pacing', 'Transitions'], 1),
 'Entertainment6': ('Animated dimensions', 'Entertainment', 'Animation footage meets geometric frames, saturated color and kinetic type.', ['Kinetic typography', 'Compositing'], 0),
 'Entertainment7': ('Worlds in motion', 'Entertainment', 'A character-driven entertainment edit with cinematic footage, typography and layered transitions.', ['Transitions', 'Typography', 'Compositing'], 0),
 'Entertainment8': ('Dialogue in motion', 'Entertainment', 'A dialogue-led entertainment edit with animated text and graphic accents.', ['Typography', 'Graphic accents'], 1),
 'Entertainment9': ('Character transitions / 05', 'Entertainment', 'A portrait-format entertainment edit using split frames and character footage.', ['Split frames', 'Typography'], 0),
 'Fitness': ('Built in motion', 'Fitness', 'A vertical fitness edit combining training footage, rhythmic cuts and text.', ['Pacing', 'Typography'], 1),
 'Promotional': ('Street Snitch / App promo', 'Promotional', 'An app presentation using animated phone mockups, interface details and typography.', ['Motion graphics', 'Product presentation'], 1),
 'UGC1': ('UGC / Digital tools', 'UGC', 'Vertical promotional content combining a presenter, website captures and captions.', ['Captions', 'Screen compositing'], 2),
 'UGC2': ('UGC / Platform walkthrough', 'UGC', 'A short presenter-led promotion with interface captures and on-screen captions.', ['Captions', 'Screen compositing'], 0),
}
logo_titles = ['Orbit', 'Particles', 'Green planet', 'Cube', 'Neon', 'Character']
for i, title in enumerate(logo_titles, 1):
    choices[f'LogoReveal{i}'] = (f'{title} / Logo reveal', 'Logo animation', 'A short motion-graphics logo animation study.', ['Logo animation', 'Motion graphics'], 2 if i in [2,5,6] else 0)

def prepare(record):
    path=Path(record['source']); stem=path.stem
    if stem not in choices: return
    title, category, description, techniques, frame = choices[stem]
    target=ROOT/'assets/videos'/f'{stem.lower()}.mp4'
    if not target.exists():
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(path),'-map','0:v:0','-map','0:a?','-vf',"scale=w='min(1080,iw)':h=-2",'-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-threads','2','-c:a','aac','-b:a','160k','-movflags','+faststart',str(target)], check=True)
    im=Image.open(ROOT/'docs/frames'/f'{stem.lower()}-{frame}.jpg')
    im.save(ROOT/'assets/thumbnails'/f'{stem.lower()}.webp',quality=86)
    print(f'{stem}: {target.stat().st_size//1024} KB',flush=True)
    return dict(id=stem.lower(),title=title,category=category,description=description,techniques=techniques,duration=record['duration'],width=record['width'],height=record['height'],video=f'assets/videos/{stem.lower()}.mp4',poster=f'assets/thumbnails/{stem.lower()}.webp',source=path.name)

with ThreadPoolExecutor(max_workers=2) as pool:
    projects=list(filter(None,pool.map(prepare,records)))
order=['Entertainment7','Promotional','Fitness','Entertainment6','UGC2','LogoReveal2','Entertainment1','Entertainment2','Entertainment3','Entertainment4','Entertainment5','Entertainment8','Entertainment9','UGC1','LogoReveal1','LogoReveal3','LogoReveal4','LogoReveal5','LogoReveal6']
projects.sort(key=lambda p:order.index(Path(p['source']).stem))
(ROOT/'js').mkdir(exist_ok=True)
(ROOT/'js/projects.js').write_text('// Titles are descriptive working titles; see docs/ASSET-AUDIT.md.\nexport const projects = '+json.dumps(projects,indent=2)+';\n',encoding='utf-8')
shutil.copy2(r'D:\Documents\C.V\Daniel_Rawda_Resume_Video_Editing.pdf',ROOT/'assets/documents/daniel-rawda-resume.pdf')
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(ROOT/'assets/videos/entertainment7.mp4'),'-an','-vf','scale=960:-2','-c:v','libx264','-crf','26','-preset','fast','-threads','2','-movflags','+faststart',str(ROOT/'assets/videos/hero-loop.mp4')],check=True)
