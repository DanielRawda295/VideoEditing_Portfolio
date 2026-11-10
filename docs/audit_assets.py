"""Read source media; generate local audit, representative frames and delivery images."""
from pathlib import Path
import json, subprocess
from PIL import Image, ImageOps, ImageDraw
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r'E:\PortfolioVideos')
for folder in ['assets/images', 'assets/thumbnails', 'assets/videos', 'assets/documents', 'docs/frames']:
    (ROOT / folder).mkdir(parents=True, exist_ok=True)
records = []
for path in sorted(SOURCE.rglob('*')):
    if not path.is_file():
        continue
    record = {'source': str(path), 'bytes': path.stat().st_size, 'format': path.suffix}
    if path.suffix.lower() in {'.mp4', '.m4v', '.mov', '.webm', '.mkv'}:
        metadata = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(path)]))
        stream = next(s for s in metadata['streams'] if s['codec_type'] == 'video')
        duration = float(metadata['format']['duration'])
        record.update(duration=duration, width=stream['width'], height=stream['height'], fps=stream['avg_frame_rate'], codec=stream['codec_name'], audio=any(s['codec_type']=='audio' for s in metadata['streams']))
        record['aspect'] = f"{stream['width']}:{stream['height']}"
        for i, fraction in enumerate([.18, .45, .72]):
            out = ROOT / 'docs/frames' / f'{path.stem.lower()}-{i}.jpg'
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(round(duration*fraction, 2)), '-i', str(path), '-frames:v', '1', '-vf', 'scale=640:-2', '-q:v', '3', str(out)], check=True)
        print(path.name, round(duration, 2), record['aspect'], record['fps'], flush=True)
    records.append(record)
(ROOT / 'docs/asset-audit.json').write_text(json.dumps(records, indent=2), encoding='utf-8')
cv = Path(r'D:\Documents\C.V\Daniel_Rawda_Resume_Video_Editing.pdf')
(ROOT / 'docs/resume-extracted.txt').write_text('\n\n'.join(p.extract_text() for p in PdfReader(cv).pages), encoding='utf-8')
portrait = Image.open(r'C:\Users\TOSHIBA\OneDrive\الصور\ID\LinkedinProfile.png').convert('RGB')
portrait.thumbnail((1000, 1300))
portrait.save(ROOT / 'assets/images/daniel-portrait.webp', quality=88)
videos = [r for r in records if 'duration' in r]
for start in range(0, len(videos), 7):
    batch = videos[start:start+7]
    sheet = Image.new('RGB', (1200, len(batch)*242), '#14161a')
    draw = ImageDraw.Draw(sheet)
    for row, record in enumerate(batch):
        stem = Path(record['source']).stem.lower()
        draw.text((10, row*242+5), f"{Path(record['source']).name} / {record['duration']:.1f}s / {record['aspect']}", fill='white')
        for i in range(3):
            im=Image.open(ROOT / 'docs/frames' / f'{stem}-{i}.jpg')
            im=ImageOps.contain(im, (390,210))
            sheet.paste(im,(i*400+(390-im.width)//2, row*242+28))
    sheet.save(ROOT / 'docs' / f'contact-sheet-{start//7+1}.jpg',quality=90)
