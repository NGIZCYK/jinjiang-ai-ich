"""Encode selected concept originals for the website; no cropping or creative edits."""
from pathlib import Path
import hashlib
import json
import subprocess
import argparse
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets-source/stay-rooms-20261102'
DEST = ROOT / 'web/public/assets/stays/20261102'
FFMPEG = ROOT / '.cache/hero-film-20261030/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--revision', default='20261102')
    revision = parser.parse_args().revision
    if not re.fullmatch(r'[0-9]{8}(?:-v[0-9]+)?', revision):
        parser.error('Invalid asset revision')
    source = ROOT / ('assets-source/stay-rooms-' + revision)
    dest = ROOT / ('web/public/assets/stays/' + revision)
    data = json.loads((source / 'generation.json').read_text(encoding='utf-8'))
    dest.mkdir(parents=True, exist_ok=True)
    outputs = []
    for asset in data['assets']:
        original = source / (asset['id'] + '.png')
        asset['original'] = str(original.relative_to(ROOT)).replace('\\', '/')
        asset['originalSha256'] = hashlib.sha256(original.read_bytes()).hexdigest()
        for width in (960, 1440):
            target = dest / f"{asset['id']}-{width}.webp"
            budget = (250 if asset['id'].endswith('detail') else 450) * 1024
            for quality in (86, 82, 78, 74):
                subprocess.run([str(FFMPEG), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(original),
                                '-vf', f'scale={width}:-1', '-frames:v', '1', '-c:v', 'libwebp',
                                '-quality', str(quality), str(target)], check=True)
                if target.stat().st_size <= budget:
                    break
            assert target.stat().st_size <= budget, target
            outputs.append({'id': asset['id'], 'width': width, 'height': width * 2 // 3,
                            'file': str(target.relative_to(ROOT)).replace('\\', '/'),
                            'bytes': target.stat().st_size, 'quality': quality,
                            'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
    data['outputs'] = outputs
    (source / 'manifest.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'originals': len(data['assets']), 'responsiveFiles': len(outputs),
                      'largestBytes': max(o['bytes'] for o in outputs)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
