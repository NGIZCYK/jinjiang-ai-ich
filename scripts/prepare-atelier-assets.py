"""Prepare local atelier photographs; no recolouring, generated texture or upscaling."""
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import urllib.request

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets-source' / 'atelier-20261103'
PUBLIC = ROOT / 'web' / 'public' / 'assets'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    SOURCE.mkdir(parents=True, exist_ok=True)
    floral = SOURCE / 'floral-huayun-original.jpg'
    if not floral.exists():
        reviewed = Path(tempfile.gettempdir()) / 'suxiu-candidate-flower-rhythm.jpg'
        if reviewed.exists():
            shutil.copyfile(reviewed, floral)
        else:
            download('https://cmsfiles.zhongkefu.com.cn/gongyimeishu/upload/gyms/weixin/c56d78d84e00dc1c370ac29fe793aa68.jpg', floral)
    silk = SOURCE / 'silk-jim-thompson-original.jpg'
    if not silk.exists():
        download('https://upload.wikimedia.org/wikipedia/commons/b/b4/Silk_thread_at_Jim_Thompson_House_%2836345567205%29.jpg', silk)
    lotus = SOURCE / 'lotus-helujiaoyuyu-original.jpg'
    if not lotus.exists():
        reviewed = Path(tempfile.gettempdir()) / 'suxiu-candidate-lotus.jpg'
        if reviewed.exists():
            shutil.copyfile(reviewed, lotus)
        else:
            download('https://cmsfiles.zhongkefu.com.cn/gongyimeishu/upload/gyms/weixin/f2788428a165dbd5d3641975b72e77de.jpg', lotus)
    cocoons = SOURCE / 'cocoons-wood-original.jpg'
    if not cocoons.exists():
        reviewed = ROOT.parent / 'tmp/silk-set-review-20261103/cocoons.jpg'
        if reviewed.exists():
            shutil.copyfile(reviewed, cocoons)
        else:
            download('https://cdn.shopify.com/s/files/1/0556/9114/9450/files/AdobeStock_431686398.jpg?v=1724495268&width=1400', cocoons)
    pastel = SOURCE / 'silk-pastel-tray-original.jpg'
    if not pastel.exists():
        reviewed = ROOT.parent / 'tmp/silk-set-review-20261103/palette.jpg'
        if reviewed.exists():
            shutil.copyfile(reviewed, pastel)
        else:
            download('https://www.lanseichina.com/cdn/shop/files/2_2fb585c2-a835-447f-ba3a-e69118253b70.jpg?v=1721889423&width=2048', pastel)
    shading = SOURCE / 'silk-shading-rsn-original.jpg'
    if not shading.exists():
        reviewed = Path(tempfile.gettempdir()) / 'suxiu-candidate-volume-flower-rsn-2.jpg'
        if reviewed.exists():
            shutil.copyfile(reviewed, shading)
        else:
            download('https://rsn.org.uk/cdn/shop/files/The_Double_Sided_Art_Chinese_Silk_Shading_in_the_Su_Embroidery_Tradition_with_Joni_Zhou_2.jpg?crop=center&height=1706&v=1790072407&width=2560', shading)
    manifest = []
    items = [
        (floral, 'suxiu-floral-huayun-20261103.webp', None,
         'https://www.cnacs.net.cn/89/202409/6430.html',
         'Exhibition image of Chinese Dream Floral Rhythms series; photographer not specified in report.',
         'No open licence found. Local review only; verify permission before publication.'),
        (silk, 'silk-dyed-hanks-20261103.webp', 1920,
         'https://commons.wikimedia.org/wiki/File:Silk_thread_at_Jim_Thompson_House_(36345567205).jpg',
         'xiquinhosilva, Hanks of dyed silk thread at the Jim Thompson House, Bangkok (2017).',
         'CC BY 2.0 https://creativecommons.org/licenses/by/2.0/'),
        (lotus, 'suxiu-lustre-lotus-20261103.webp', None,
         'https://www.cnacs.net.cn/89/202409/6430.html',
         'Yao Jianping, He Lu Jiao Yu Yu (lotus embroidery), exhibition image; photographer not specified in report.',
         'No open licence found. Local review only; verify permission before publication.'),
        (cocoons, 'silk-cocoons-wood-20261103.webp', None,
         'https://favorric.com/blogs/column/whatis-silk',
         'Cocoon image referenced by FAVORRIC; original image identified as Adobe Stock 431686398.',
         'Commercial stock image. Local review only; obtain a valid licence before publication.'),
        (pastel, 'silk-pastel-tray-20261103.webp', 1600,
         'https://www.lanseichina.com/products/untwisted-mulberry-silk-threads-spring',
         'Lansei China, Spring untwisted mulberry silk material display photograph.',
         'No open licence found. Local review only; verify permission before publication.'),
        (shading, 'silk-shading-petals-20261103.webp', 1920,
         'https://rsn.org.uk/products/the-double-sided-art-chinese-silk-shading-in-the-su-embroidery-tradition-with-joni-zhou',
         'Royal School of Needlework, Chinese Silk Shading in the Su Embroidery Tradition with Joni Zhou, course demonstration image.',
         'All rights reserved by source. Local review only; verify permission before publication.'),
    ]
    for source, filename, max_width, url, credit, rights in items:
        with Image.open(source) as original:
            original_size = original.size
            image = original.convert('RGB')
        if max_width and image.width > max_width:
            image = image.resize((max_width, round(image.height * max_width / image.width)), Image.Resampling.LANCZOS)
        output = PUBLIC / filename
        image.save(output, 'WEBP', lossless=max_width is None, quality=90, method=6)
        manifest.append(dict(source=str(source.relative_to(ROOT)).replace('\\', '/'),
                             runtime=str(output.relative_to(ROOT)).replace('\\', '/'),
                             original_size=original_size, runtime_size=image.size,
                             source_sha256=sha(source), runtime_sha256=sha(output),
                             bytes=output.stat().st_size, source_page=url, credit=credit, rights=rights,
                             changes='Format conversion only' if max_width is None else 'Resized and converted; no crop or recolouring'))
    (SOURCE / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(manifest, ensure_ascii=True, indent=2))


def download(url, path):
    request = urllib.request.Request(url, headers={'User-Agent': 'AtelierLocalAssetReview/1.0'})
    path.write_bytes(urllib.request.urlopen(request, timeout=30).read())


if __name__ == '__main__':
    main()
