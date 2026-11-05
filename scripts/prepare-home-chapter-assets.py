"""Build the homepage chapter-card crop from the reviewed atelier photograph.

Source: web/public/assets/suxiu-floral-huayun-20261103.webp, which is the
lossless runtime copy of assets-source/atelier-20261103/floral-huayun-original.jpg
(exhibition image of the "Chinese Dream Floral Rhythms" series,
https://www.cnacs.net.cn/89/202409/6430.html; no open licence found, local review
only — verify permission before publication).

The crop changes framing only: no recolouring, no upscaling. It matches the wide
01 "Lobby · Observe" card, which otherwise crops the 1080x1880 portrait into a
narrow band and ships a 2.1 MB file.
"""
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'web' / 'public' / 'assets' / 'suxiu-floral-huayun-20261103.webp'
OUTPUT = ROOT / 'web' / 'public' / 'assets' / 'suxiu-floral-huayun-card-20261104.webp'
RECORD = ROOT / 'assets-source' / 'home-chapters-20261104' / 'manifest.json'
CROP = (0, 700, 1080, 1300)  # x0, y0, x1, y1 — main peony cluster, 1080x600
QUALITY = 82


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    with Image.open(SOURCE) as original:
        original_size = original.size
        card = original.convert('RGB').crop(CROP)
    card.save(OUTPUT, 'WEBP', quality=QUALITY, method=6)
    record = [{
        'source': str(SOURCE.relative_to(ROOT)).replace('\\', '/'),
        'runtime': str(OUTPUT.relative_to(ROOT)).replace('\\', '/'),
        'original_size': original_size,
        'runtime_size': card.size,
        'crop_box': CROP,
        'source_sha256': sha(SOURCE),
        'runtime_sha256': sha(OUTPUT),
        'bytes': OUTPUT.stat().st_size,
        'source_page': 'https://www.cnacs.net.cn/89/202409/6430.html',
        'credit': 'Exhibition image of Chinese Dream Floral Rhythms series; photographer not specified in report.',
        'rights': 'No open licence found. Local review only; verify permission before publication.',
        'changes': 'Cropped for the homepage 01 chapter card and re-encoded; no recolouring or upscaling',
    }]
    RECORD.parent.mkdir(parents=True, exist_ok=True)
    RECORD.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(record, ensure_ascii=True, indent=2))


if __name__ == '__main__':
    main()
