# -*- coding: utf-8 -*-
"""婉娘 puppet 资产后处理：抠图、部件裁切、肤色匹配、锚点输出。

用法:
    python scripts/postprocess_avatar.py base      # 处理基准立绘 + 输出锚点预览
    python scripts/postprocess_avatar.py parts     # 处理嘴/眼部件条 + 输出叠加合成预览
    python scripts/postprocess_avatar.py anchors   # 只重新输出锚点预览（调坐标用）

所有坐标均为 base 裁掉底部水印条后的像素坐标 (1024 x 1472)。
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "public" / "avatar" / "wanniang-puppet"
SOURCE = ROOT / "assets-source" / "wanniang-puppet"
RAW = SOURCE / "raw"
PREVIEW = SOURCE / "preview"

BASE_W, BASE_H = 1024, 1472  # 裁掉底部 64px 水印后
WATERMARK_CROP = 64

# ---- 锚点（在 base 坐标系内，单位 px；调参后会被写入 puppetConfig） ----
# 单眼部件（闭眼/半闭眼贴片，只覆盖眼睛不含眉毛），左眼盒；右眼取镜像
EYE_BOX = {"cx": 452, "cy": 307, "w": 100, "h": 50}
EYE_RIGHT_CX = 576          # 右眼中心 x（镜像层定位用）
MOUTH_BOX = {"cx": 512, "cy": 432, "w": 142, "h": 96}

# mouths.png 五格手动裁切盒：以各格唇心为中心 w240 h160（1792x1024 坐标系）
MOUTH_PANEL_BOXES = [  # (x, y, w, h)
    (50, 545, 240, 160),    # 1 closed
    (407, 540, 240, 160),   # 2 a
    (765, 535, 240, 160),   # 3 aa
    (1125, 540, 240, 160),  # 4 o
    (1440, 550, 240, 160),  # 5 smile
]
EYE_PANEL_BOXES = [  # 闭眼/半闭眼单眼贴片（不含眉），1792x1024 坐标系
    (1160, 470, 240, 120),  # 4 closed
    (815, 465, 240, 120),   # 3 half（低垂视线兼作半闭）
]

MOUTH_NAMES = ["closed", "a", "aa", "o", "smile"]
EYE_NAMES = ["closed", "half"]

FEATHER = 14  # 部件边缘羽化 px


def keyout_magenta(img: Image.Image) -> Image.Image:
    """按行采样背景色做距离抠图，兼容纵向渐变品红背景。"""
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    h, w, _ = rgb.shape
    alpha = np.zeros((h, w), dtype=np.float32)
    for y in range(h):
        bg = np.median(rgb[y, :12], axis=0)
        dist = np.linalg.norm(rgb[y] - bg, axis=1)
        alpha[y] = np.clip((dist - 42.0) / (70.0 - 42.0), 0, 1)
    a = Image.fromarray((alpha * 255).astype(np.uint8), "L")
    a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out = img.convert("RGBA")
    out.putalpha(a)
    return out


def process_base() -> Image.Image:
    img = Image.open(RAW / "base.png")
    img = img.crop((0, 0, img.width, img.height - WATERMARK_CROP))
    assert img.size == (BASE_W, BASE_H), img.size
    cut = keyout_magenta(img)
    cut.save(OUT / "base.webp", "WEBP", quality=82)
    poster = cut.copy()
    poster.thumbnail((640, 640 * 3))
    poster.save(OUT / "poster.webp", "WEBP", quality=80)
    print(f"base.webp {cut.size}  poster.webp {poster.size}")
    return cut


def draw_anchors(base: Image.Image) -> None:
    PREVIEW.mkdir(exist_ok=True)
    prev = Image.new("RGBA", base.size, (24, 24, 28, 255))
    prev.paste(base, (0, 0), base)
    d = ImageDraw.Draw(prev)
    for name, box, color in (
        ("eye_L", EYE_BOX, (0, 255, 128, 255)),
        ("mouth", MOUTH_BOX, (255, 200, 0, 255)),
    ):
        x0, y0 = box["cx"] - box["w"] / 2, box["cy"] - box["h"] / 2
        x1, y1 = box["cx"] + box["w"] / 2, box["cy"] + box["h"] / 2
        d.rectangle([x0, y0, x1, y1], outline=color, width=3)
        d.text((x0 + 4, y0 + 4), name, fill=color)
    # 右眼镜像盒
    rw = EYE_BOX["w"]
    d.rectangle(
        [EYE_RIGHT_CX - rw / 2, EYE_BOX["cy"] - EYE_BOX["h"] / 2,
         EYE_RIGHT_CX + rw / 2, EYE_BOX["cy"] + EYE_BOX["h"] / 2],
        outline=(0, 200, 255, 255), width=3,
    )
    d.text((EYE_RIGHT_CX - rw / 2 + 4, EYE_BOX["cy"] - EYE_BOX["h"] / 2 + 4),
           "eye_R(mirror)", fill=(0, 200, 255, 255))
    prev.convert("RGB").save(PREVIEW / "anchors.png")
    print(f"preview -> {PREVIEW / 'anchors.png'}")


def ring_mean(arr: np.ndarray, box, ring: int = 12):
    """盒外圈 ring 像素的均值（offset-only 肤色校正用）。"""
    x, y, w, h = box
    top = arr[max(y - ring, 0):y, x:x + w]
    bottom = arr[y + h:y + h + ring, x:x + w]
    left = arr[y:y + h, max(x - ring, 0):x]
    right = arr[y:y + h, x + w:x + w + ring]
    parts = [p.reshape(-1, 3) for p in (top, bottom, left, right) if p.size]
    return np.concatenate(parts).mean(axis=0)


def color_match(patch: np.ndarray, src_box, base_arr, dst_box, k: float = 0.85) -> np.ndarray:
    """offset-only 校正：只平移肤色均值，保留饱和度/对比度关系，避免唇色失真。

    k 为校正强度（默认 0.85，保持现有行为）；调参脚本可传入 1.0 做对比。
    """
    s_mean = ring_mean(patch, src_box)
    d_mean = ring_mean(base_arr, dst_box)
    out = patch.astype(np.float32) + (d_mean - s_mean) * k
    return np.clip(out, 0, 255).astype(np.uint8)


def feather_alpha(size, feather: int) -> Image.Image:
    w, h = size
    a = np.zeros((h, w), dtype=np.float32)
    a[feather:h - feather, feather:w - feather] = 1.0
    img = Image.fromarray((a * 255).astype(np.uint8), "L")
    return img.filter(ImageFilter.GaussianBlur(feather * 0.6))


def make_part(src: Image.Image, box, base_arr, dst_box, out_w: int, out_h: int):
    patch = src.crop((box[0], box[1], box[0] + box[2], box[1] + box[3]))
    arr = np.asarray(patch.convert("RGB"))
    inner = (6, 6, arr.shape[1] - 12, arr.shape[0] - 12)  # 统计环向内缩
    matched = color_match(arr, inner, base_arr, dst_box)
    img = Image.fromarray(matched).resize((out_w, out_h), Image.LANCZOS)
    rgba = img.convert("RGBA")
    rgba.putalpha(feather_alpha((out_w, out_h), FEATHER))
    return rgba


def process_parts(base: Image.Image) -> None:
    PREVIEW.mkdir(exist_ok=True)
    base_arr = np.asarray(base.convert("RGB"))
    mouth_dst = (int(MOUTH_BOX["cx"] - MOUTH_BOX["w"] / 2), int(MOUTH_BOX["cy"] - MOUTH_BOX["h"] / 2),
                 MOUTH_BOX["w"], MOUTH_BOX["h"])
    eye_dst = (int(EYE_BOX["cx"] - EYE_BOX["w"] / 2), int(EYE_BOX["cy"] - EYE_BOX["h"] / 2),
               EYE_BOX["w"], EYE_BOX["h"])

    mouths_src = Image.open(RAW / "mouths.png")
    cells = []
    for name, box in zip(MOUTH_NAMES, MOUTH_PANEL_BOXES):
        part = make_part(mouths_src, box, base_arr, mouth_dst, MOUTH_BOX["w"], MOUTH_BOX["h"])
        cells.append(part)
        part.save(PREVIEW / f"mouth_{name}.png")
    strip = Image.new("RGBA", (MOUTH_BOX["w"] * len(cells), MOUTH_BOX["h"]))
    for i, c in enumerate(cells):
        strip.paste(c, (i * MOUTH_BOX["w"], 0))
    strip.save(PREVIEW / "mouths.webp", "WEBP", quality=84)

    eyes_src = Image.open(RAW / "eyes.png")
    cells = []
    for name, box in zip(EYE_NAMES, EYE_PANEL_BOXES):
        part = make_part(eyes_src, box, base_arr, eye_dst, EYE_BOX["w"], EYE_BOX["h"])
        cells.append(part)
        part.save(PREVIEW / f"eye_{name}.png")
    strip = Image.new("RGBA", (EYE_BOX["w"] * len(cells), EYE_BOX["h"]))
    for i, c in enumerate(cells):
        strip.paste(c, (i * EYE_BOX["w"], 0))
    strip.save(OUT / "eyes.webp", "WEBP", quality=84)

    # 叠加合成预览：睁眼状态不贴眼部部件（用 base 自己的眼睛），仅闭眼/半闭贴片
    comp_specs = [("neutral", 0, None), ("speak_aa", 2, None), ("warm", 4, None),
                  ("blink", 0, 0), ("half", 0, 1)]
    mouth_cells = [Image.open(PREVIEW / f"mouth_{n}.png") for n in MOUTH_NAMES]
    eye_cells = [Image.open(PREVIEW / f"eye_{n}.png") for n in EYE_NAMES]
    for tag, mi, ei in comp_specs:
        comp = Image.new("RGBA", base.size, (24, 24, 28, 255))
        comp.paste(base, (0, 0), base)
        comp.paste(mouth_cells[mi], (mouth_dst[0], mouth_dst[1]), mouth_cells[mi])
        if ei is not None:
            comp.paste(eye_cells[ei], (eye_dst[0], eye_dst[1]), eye_cells[ei])
            mirror = eye_cells[ei].transpose(Image.FLIP_LEFT_RIGHT)
            rx = int(EYE_RIGHT_CX - EYE_BOX["w"] / 2)
            comp.paste(mirror, (rx, eye_dst[1]), mirror)
        comp.convert("RGB").save(PREVIEW / f"comp_{tag}.png")
    print(f"parts + composites -> {OUT} / {PREVIEW}")

    anchors = {
        "baseWidth": BASE_W, "baseHeight": BASE_H,
        "eye": {"leftCx": EYE_BOX["cx"], "rightCx": EYE_RIGHT_CX,
                "cy": EYE_BOX["cy"], "w": EYE_BOX["w"], "h": EYE_BOX["h"]},
        "mouth": {"cx": MOUTH_BOX["cx"], "cy": MOUTH_BOX["cy"],
                  "w": MOUTH_BOX["w"], "h": MOUTH_BOX["h"]},
        "mouthCells": MOUTH_NAMES, "eyeCells": EYE_NAMES,
    }
    (OUT / "anchors.json").write_text(json.dumps(anchors, indent=2), "utf-8")
    print("anchors.json written")


if __name__ == "__main__":
    step = sys.argv[1] if len(sys.argv) > 1 else "all"
    if step in ("base", "all"):
        base = process_base()
    else:
        base = Image.open(OUT / "base.webp")
    if step in ("anchors", "base", "all"):
        draw_anchors(base.convert("RGBA"))
    if step in ("parts", "all"):
        process_parts(base.convert("RGBA"))
