"""Inspect a local source video without changing it; prepare a frame board for shot selection."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import cv2
from PIL import Image, ImageDraw


def inspect(source: Path, output: Path, count: int) -> dict:
    source = source.resolve(strict=True)
    if not source.is_file():
        raise ValueError('Source must be a local video file.')
    capture = cv2.VideoCapture(str(source))
    if not capture.isOpened():
        raise ValueError(f'Could not decode source video: {source.name}')
    try:
        fps = float(capture.get(cv2.CAP_PROP_FPS))
        frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        if fps <= 0 or frames <= 0:
            raise ValueError('Video duration could not be established.')
        duration = frames / fps
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        output.mkdir(parents=True, exist_ok=True)
        cell_w, cell_h, columns = 384, 244, 4
        board = Image.new('RGB', (columns * cell_w, ((count + columns - 1) // columns) * cell_h), '#18231f')
        draw = ImageDraw.Draw(board)
        samples = []
        for index in range(count):
            requested = max(0.0, (duration - 1 / fps) * index / max(1, count - 1))
            capture.set(cv2.CAP_PROP_POS_MSEC, requested * 1000)
            ok, frame = capture.read()
            if not ok:
                # Some decoders cannot seek to the final frame; keep that failure explicit.
                samples.append({'requestedSeconds': round(requested, 3), 'decoded': False})
                continue
            position = float(capture.get(cv2.CAP_PROP_POS_MSEC)) / 1000
            picture = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            picture.thumbnail((cell_w - 8, cell_h - 30), Image.Resampling.LANCZOS)
            x, y = (index % columns) * cell_w, (index // columns) * cell_h
            board.paste(picture, (x + (cell_w - picture.width) // 2, y + 4))
            draw.text((x + 8, y + cell_h - 23), f'{index + 1:02d}  {requested:07.2f}s', fill='#f3efe7')
            samples.append({'requestedSeconds': round(requested, 3), 'decoderSeconds': round(position, 3), 'decoded': True})
        board.save(output / 'contact-sheet.jpg', quality=90)
        with source.open('rb') as stream:
            digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        result = {
            'source': str(source), 'sourceBytes': source.stat().st_size, 'sha256': digest,
            'width': width, 'height': height, 'reportedFps': fps,
            'reportedFrames': frames, 'estimatedDurationSeconds': duration,
            'samples': samples, 'contactSheet': str(output / 'contact-sheet.jpg'),
            'note': 'Frame samples support shot selection; they do not establish rights, full motion quality, or loop continuity.',
        }
        (output / 'inspection.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
        return result
    finally:
        capture.release()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--frames', type=int, default=24)
    args = parser.parse_args()
    if not 4 <= args.frames <= 64:
        parser.error('--frames must be between 4 and 64')
    data = inspect(args.source, args.output, args.frames)
    print(json.dumps({key: data[key] for key in ['width', 'height', 'reportedFps', 'estimatedDurationSeconds', 'contactSheet']}, ensure_ascii=True))
