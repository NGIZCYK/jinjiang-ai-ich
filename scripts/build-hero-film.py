"""Render the approved classroom hero edit; never alter source cache files."""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
FFMPEG = ROOT / '.cache/hero-film-20261030/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
TIMELINE = [
    ('atelier', 73.2, 77.6, .55),
    ('needle', 34.4, 38.4, .52),
    ('flowers', 96.6, 100.6, .50),
    ('courtyard', 118.8, 121.8, .50),
    # End-exclusive: the next source shot starts at 105.80s.
    ('window', 102.0, 105.8, .52),
]


def run(args):
    subprocess.run([str(FFMPEG), '-hide_banner', '-loglevel', 'error', '-y', *map(str, args)], check=True)


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def render(source: Path, reuse_clips=False):
    source = source.resolve(strict=True)
    original_hash = digest(source)
    work = ROOT / '.cache/hero-build-20261101/render'
    work.mkdir(parents=True, exist_ok=True)
    outputs = []
    for variant, width, height in [('desktop', 1920, 1080), ('mobile', 720, 1280)]:
        print(f'Rendering {variant}', flush=True)
        clips = []
        for index, (name, start, end, focus) in enumerate(TIMELINE):
            clip = work / f'{variant}-{index}-{name}.mkv'
            # Remove the letterbox (including its captions), then compose each delivery aspect ratio.
            crop = f"crop=3840:1632:0:264,scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}:(iw-ow)*{focus if variant == 'mobile' else .5}:(ih-oh)/2"
            filters = crop + ',setsar=1,fps=25,eq=contrast=0.98:brightness=-0.008:saturation=0.93,format=yuv420p'
            # Always rebuild the corrected tail; the original cache contains an extra shot.
            if not (reuse_clips and name != 'window' and clip.exists() and clip.stat().st_size > 0):
                run(['-threads', '2', '-ss', start, '-i', source, '-t', round(end-start, 3), '-an', '-vf', filters,
                     '-c:v', 'ffv1', '-level', '3', '-threads', '2', clip])
            clips.append(clip)
            print(f'  {name} {start:.2f}-{end:.2f}s', flush=True)

        inputs = [arg for clip in clips for arg in ['-i', clip]]
        graph = [f'[{i}:v]settb=AVTB,setpts=PTS-STARTPTS,fps=25[v{i}]' for i in range(len(clips))]
        total = TIMELINE[0][2]-TIMELINE[0][1]
        previous = 'v0'
        for index in range(1, len(clips)):
            label = f'fade{index}'
            graph.append(f'[{previous}][v{index}]xfade=transition=fade:duration=0.4:offset={total-.4:.3f},fps=25[{label}]')
            total += TIMELINE[index][2]-TIMELINE[index][1]-.4
            previous = label
        # Middle + tail-to-head dissolve forms a circular edit with no black fade at the seam.
        graph += [f'[{previous}]split=3[midin][tailin][headin]',
                  f'[midin]trim=start=0.4:end={total-.4:.3f},setpts=PTS-STARTPTS[mid]',
                  f'[tailin]trim=start={total-.4:.3f}:end={total:.3f},setpts=PTS-STARTPTS,fps=25[tail]',
                  '[headin]trim=start=0:end=0.4,setpts=PTS-STARTPTS,fps=25[head]',
                  '[tail][head]xfade=transition=fade:duration=0.4:offset=0[seam]',
                  '[mid][seam]concat=n=2:v=1:a=0,fps=25,format=yuv420p[out]']
        duration = round(total - .4, 3)
        video = ROOT / f'web/public/videos/home-embroidery-20261101-v2-{variant}.mp4'
        video.parent.mkdir(parents=True, exist_ok=True)
        run(['-filter_complex_threads', '1', *inputs, '-filter_complex', ';'.join(graph), '-map', '[out]', '-an',
             '-t', duration, '-r', '25', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-threads', '2',
             '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
             '-movflags', '+faststart', video])
        poster = ROOT / f'web/public/assets/home-embroidery-20261101-v2-{variant}.webp'
        run(['-i', video, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '88', poster])
        outputs.append({'variant': variant, 'width': width, 'height': height, 'video': video.relative_to(ROOT).as_posix(),
                        'videoBytes': video.stat().st_size, 'videoSha256': digest(video),
                        'poster': poster.relative_to(ROOT).as_posix(), 'posterSha256': digest(poster)})
    assert digest(source) == original_hash, 'Source was modified'
    manifest = {'source': str(source), 'sourceSha256': original_hash, 'sourceTitle': '汉绣芳华【武汉非遗】',
                'bvid': 'BV15t4y197q5', 'use': 'Classroom substitute footage approved by user; no on-page source label',
                'sourceCrop': [3840, 1632, 0, 264], 'timeline': TIMELINE, 'transitionSeconds': .4,
                'revision': 'v2-tail-recut', 'durationSeconds': duration, 'fps': 25, 'audio': False, 'outputs': outputs}
    target = ROOT / 'assets-source/hero-film-20261101/manifest.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Both variants rendered; original source SHA-256 unchanged.', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--reuse-clips', action='store_true', help='Reuse explicitly reviewed intermediate clips from this edit.')
    args = parser.parse_args()
    render(args.source, args.reuse_clips)
